'use server'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { createInsForgeAdminClient } from '@/lib/insforge/server'
import { findNode, normalizeDoc, walk } from './tree'
import type { BuilderNode } from './types'

type Result = { ok: true } | { error: string }

const MAX_FILE_BYTES = 3 * 1024 * 1024
const ALLOWED_FILE = /\.(pdf|docx?|txt|png|jpe?g|webp)$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 10 * 60 * 1000
const GENERIC_ERROR = 'Your message could not be sent. Please try again.'

type FieldDef = { id: string; label: string; kind: string; required: boolean; options: string }
type Value = { label: string; kind: string; value: string; fileKey?: string; fileName?: string }
type Admin = ReturnType<typeof createInsForgeAdminClient>

// Salted hash of the sender's IP — enough to rate-limit, without storing the IP.
async function senderHash(): Promise<string> {
  const h = await headers()
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown'
  return createHash('sha256').update(`${process.env.INSFORGE_API_KEY ?? ''}:${ip}`).digest('hex').slice(0, 32)
}

async function tooManyRecent(admin: Admin, ipHash: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
  const { count, error } = await admin.database.from('cms_form_submissions').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', since)
  if (error) return false // never block a genuine sender because the check failed
  return (count ?? 0) >= RATE_LIMIT
}

function clientToken(fd: FormData): string | null {
  const t = String(fd.get('__token') ?? '')
  return UUID.test(t) ? t : null
}

// Checks every text/choice field first so that files are only uploaded once
// the rest of the form is known to be valid (no orphaned uploads).
function validateFields(fields: FieldDef[], fd: FormData): { values: Value[]; files: { field: FieldDef; file: File }[] } | { error: string } {
  const values: Value[] = []
  const files: { field: FieldDef; file: File }[] = []
  for (const f of fields) {
    const name = `f_${f.id}`
    if (f.kind === 'file') {
      const file = fd.get(name)
      if (!(file instanceof File) || file.size === 0) {
        if (f.required) return { error: `Please attach a file for “${f.label}”.` }
        continue
      }
      if (file.size > MAX_FILE_BYTES) return { error: `“${file.name}” is larger than 3 MB.` }
      if (!ALLOWED_FILE.test(file.name)) return { error: 'Please upload a PDF, Word document, text file or image.' }
      files.push({ field: f, file })
      continue
    }
    const raw = String(fd.get(name) ?? '').trim()
    if (f.required && !raw) return { error: `Please fill in “${f.label}”.` }
    if (!raw) continue
    if (raw.length > (f.kind === 'textarea' ? 5000 : 500)) return { error: `“${f.label}” is too long.` }
    if (f.kind === 'email' && !EMAIL.test(raw)) return { error: 'Please enter a valid email address.' }
    if (f.kind === 'select' || f.kind === 'radio') {
      const options = String(f.options ?? '').split('\n').map((o) => o.trim()).filter(Boolean)
      if (!options.includes(raw)) return { error: `Please choose an option for “${f.label}”.` }
    }
    values.push({ label: f.label, kind: f.kind, value: raw })
  }
  if (values.length === 0 && files.length === 0) return { error: 'Please fill in the form before sending.' }
  return { values, files }
}

// Validates, rate-limits, uploads files and stores the submission. A retry of
// the same form fill (same token) is recognised and not stored twice; if the
// record can't be saved, files uploaded for it are removed again.
async function store(fd: FormData, fields: FieldDef[], meta: { pageId: string | null; formName: string; keyPrefix: string }): Promise<Result> {
  if (String(fd.get('__website') ?? '').trim()) return { ok: true } // honeypot: pretend success to bots

  const checked = validateFields(fields, fd)
  if ('error' in checked) return checked

  const admin = createInsForgeAdminClient()
  const token = clientToken(fd)
  if (token) {
    const { data: dup } = await admin.database.from('cms_form_submissions').select('id').eq('client_token', token).maybeSingle()
    if (dup) return { ok: true }
  }
  const ipHash = await senderHash()
  if (await tooManyRecent(admin, ipHash)) return { error: 'You’ve sent several messages in a short time. Please wait a few minutes and try again.' }

  const uploaded: string[] = []
  const values = [...checked.values]
  for (const { field, file } of checked.files) {
    const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, '-').slice(-80)
    const key = `${meta.keyPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`
    const { error } = await admin.storage.from('form-uploads').upload(key, file)
    if (error) {
      await Promise.all(uploaded.map((k) => admin.storage.from('form-uploads').remove(k).catch(() => undefined)))
      return { error: 'Your file could not be uploaded. Please try again.' }
    }
    uploaded.push(key)
    values.push({ label: field.label, kind: field.kind, value: file.name, fileKey: key, fileName: file.name })
  }

  const { error } = await admin.database
    .from('cms_form_submissions')
    .insert([{ page_id: meta.pageId, form_name: meta.formName.slice(0, 120), data: values, client_token: token, ip_hash: ipHash }])
  if (error) {
    await Promise.all(uploaded.map((k) => admin.storage.from('form-uploads').remove(k).catch(() => undefined)))
    // Same token already stored (a retry raced the first attempt): that's a success.
    if (error.code === '23505') return { ok: true }
    console.error('[forms] insert failed', error)
    return { error: GENERIC_ERROR }
  }
  return { ok: true }
}

// Public form submissions from builder form blocks. The form definition is
// read from the *published* page (never trusted from the browser).
export async function submitFormAction(fd: FormData): Promise<Result> {
  try {
    const pageId = String(fd.get('__page') ?? '')
    const nodeId = String(fd.get('__node') ?? '')
    if (!UUID.test(pageId) || !/^x[a-z0-9]{8}$/.test(nodeId)) return { error: 'This form is not available.' }

    const admin = createInsForgeAdminClient()
    const { data: page, error } = await admin.database.from('cms_pages').select('id, status, scheduled_at, published_content').eq('id', pageId).maybeSingle()
    if (error) return { error: GENERIC_ERROR }
    const live =
      page &&
      page.published_content &&
      (page.status === 'published' || page.status === 'private' || (page.status === 'scheduled' && page.scheduled_at && new Date(page.scheduled_at) <= new Date()))
    if (!live) return { error: 'This form is not available.' }

    let form: BuilderNode | null = findNode(normalizeDoc(page.published_content), nodeId)
    if (!form) {
      // The form may live inside a global block used on this page.
      const { data: blocks } = await admin.database.from('cms_blocks').select('block').eq('is_global', true).limit(200)
      for (const b of (blocks ?? []) as { block: BuilderNode }[]) {
        walk([b.block], (n) => {
          if (n.id === nodeId) {
            form = n
            return false
          }
        })
        if (form) break
      }
    }
    if (!form || (form as BuilderNode).type !== 'form') return { error: 'This form is not available.' }
    const formNode = form as BuilderNode
    return await store(fd, (formNode.props.fields ?? []) as FieldDef[], { pageId, formName: String(formNode.props.formName || 'Form'), keyPrefix: pageId })
  } catch (err) {
    console.error('submitFormAction failed', err)
    return { error: GENERIC_ERROR }
  }
}

// The original (non-builder) Contact page form. Its fields are fixed in
// components/contact-form.tsx and mirrored here for validation.
const CONTACT_FIELDS: FieldDef[] = [
  { id: 'name', label: 'Name', kind: 'text', required: true, options: '' },
  { id: 'affiliation', label: 'Organization / Community / Affiliation', kind: 'text', required: false, options: '' },
  { id: 'email', label: 'Email address', kind: 'email', required: true, options: '' },
  { id: 'connection', label: 'Connection', kind: 'text', required: false, options: '' },
  { id: 'topic', label: 'Topic', kind: 'text', required: true, options: '' },
  { id: 'message', label: 'Message', kind: 'textarea', required: true, options: '' },
  { id: 'program', label: 'Organization / community / program involved', kind: 'text', required: false, options: '' },
  { id: 'contact_method', label: 'Preferred contact method', kind: 'text', required: true, options: '' },
  { id: 'phone', label: 'Phone number', kind: 'tel', required: false, options: '' },
  { id: 'contact_time', label: 'Preferred contact time', kind: 'text', required: false, options: '' },
]

export async function submitContactFormAction(fd: FormData): Promise<Result> {
  try {
    return await store(fd, CONTACT_FIELDS, { pageId: null, formName: 'Contact PEARL', keyPrefix: 'contact' })
  } catch (err) {
    console.error('submitContactFormAction failed', err)
    return { error: GENERIC_ERROR }
  }
}
