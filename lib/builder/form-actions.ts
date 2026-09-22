'use server'

import { createInsForgeAdminClient } from '@/lib/insforge/server'
import { findNode, normalizeDoc, walk } from './tree'
import type { BuilderNode } from './types'

type Result = { ok: true } | { error: string }

const MAX_FILE_BYTES = 3 * 1024 * 1024
const ALLOWED_FILE = /\.(pdf|docx?|txt|png|jpe?g|webp)$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type FieldDef = { id: string; label: string; kind: string; required: boolean; options: string }

// Public form submissions from builder form blocks. The form definition is
// read from the *published* page (never trusted from the browser), each value
// is validated against it, and the row is written with the admin client since
// visitors have no insert access to the table.
export async function submitFormAction(fd: FormData): Promise<Result> {
  try {
    // Honeypot: bots fill every field; pretend success.
    if (String(fd.get('__website') ?? '').trim()) return { ok: true }

    const pageId = String(fd.get('__page') ?? '')
    const nodeId = String(fd.get('__node') ?? '')
    if (!/^[0-9a-f-]{36}$/i.test(pageId) || !/^x[a-z0-9]{8}$/.test(nodeId)) return { error: 'This form is not available.' }

    const admin = createInsForgeAdminClient()
    const { data: page } = await admin.database.from('cms_pages').select('id, status, scheduled_at, published_content').eq('id', pageId).maybeSingle()
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

    const fields = (formNode.props.fields ?? []) as FieldDef[]
    const values: { label: string; kind: string; value: string; fileKey?: string; fileName?: string }[] = []

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
        const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, '-').slice(-80)
        const key = `${pageId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`
        const { error } = await admin.storage.from('form-uploads').upload(key, file)
        if (error) return { error: 'Your file could not be uploaded. Please try again.' }
        values.push({ label: f.label, kind: f.kind, value: file.name, fileKey: key, fileName: file.name })
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

    if (values.length === 0) return { error: 'Please fill in the form before sending.' }

    const { error } = await admin.database.from('cms_form_submissions').insert([
      { page_id: pageId, form_name: String(formNode.props.formName || 'Form').slice(0, 120), data: values },
    ])
    if (error) return { error: 'Your message could not be sent. Please try again.' }
    return { ok: true }
  } catch (err) {
    console.error('submitFormAction failed', err)
    return { error: 'Your message could not be sent. Please try again.' }
  }
}
