'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { check, withErrorHandling, type ActionResult } from '@/lib/cms/action-result'
import { sanitizeByType } from '@/lib/builder/sanitize'
import { normalizeSlug } from '@/lib/builder/defaults'

async function requirePages() {
  const admin = await getCurrentAdmin()
  if (!canAccess(admin?.profile, 'pages')) throw new Error('You don’t have permission to edit job openings.')
}

async function requireApplicationsAccess() {
  const admin = await getCurrentAdmin()
  if (!canAccess(admin?.profile, 'pages') && !canAccess(admin?.profile, 'contact')) throw new Error('You don’t have permission to manage applications.')
}

function revalidate(slug?: string) {
  revalidatePath('/admin/jobs')
  // Openings can appear on any page through the Job openings block.
  revalidatePath('/', 'layout')
  if (slug) revalidatePath(`/careers/${slug}`)
}

// Creates a draft position straight away — nothing to fill in first.
export async function createJobAction(): Promise<{ id: string } | { error: string }> {
  try {
    await requirePages()
    const insforge = await createInsForgeServerClient()
    const { data, error } = await insforge.database
      .from('job_postings')
      .insert([{ title: 'Untitled position', slug: `untitled-position-${Math.random().toString(36).slice(2, 8)}` }])
      .select('id')
      .single()
    check({ data, error })
    revalidate()
    return { id: (data as { id: string }).id }
  } catch (err) {
    console.error(err)
    return { error: err instanceof Error ? err.message : 'Could not create the position. Please try again.' }
  }
}

export async function updateJobAction(id: string, formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    await requirePages()
    const title = String(formData.get('title') ?? '').trim().slice(0, 200) || 'Untitled position'
    let slug = normalizeSlug(String(formData.get('slug') ?? '')).replace(/\//g, '-').slice(0, 90)
    // A placeholder address follows the title once the position is named.
    if (!slug || (slug.startsWith('untitled-position-') && title !== 'Untitled position')) slug = normalizeSlug(title).replace(/\//g, '-').slice(0, 80) || 'position'
    const closes = String(formData.get('closes_on') ?? '').trim()
    if (closes && !/^\d{4}-\d{2}-\d{2}$/.test(closes)) throw new Error('Please choose a valid closing date.')
    const insforge = await createInsForgeServerClient()
    const res = await insforge.database
      .from('job_postings')
      .update({
        title,
        slug,
        team: String(formData.get('team') ?? '').trim().slice(0, 120),
        location: String(formData.get('location') ?? '').trim().slice(0, 120),
        employment_type: String(formData.get('employment_type') ?? '').trim().slice(0, 80),
        summary: String(formData.get('summary') ?? '').trim().slice(0, 400),
        description_html: sanitizeByType('richtext', String(formData.get('description_html') ?? '')),
        closes_on: closes || null,
        sort_order: Number(formData.get('sort_order') ?? 0) || 0,
      })
      .eq('id', id)
    if (res.error?.code === '23505') throw new Error('Another position already uses that web address.')
    check(res)
    revalidate(slug)
  })
}

export async function setJobStatusAction(id: string, status: 'draft' | 'open' | 'closed'): Promise<ActionResult> {
  return withErrorHandling(async () => {
    await requirePages()
    const insforge = await createInsForgeServerClient()
    const { data: job } = await insforge.database.from('job_postings').select('slug, description_html, closes_on').eq('id', id).maybeSingle()
    if (!job) throw new Error('This position no longer exists.')
    if (status === 'open' && !String(job.description_html ?? '').replace(/<[^>]+>/g, '').trim()) throw new Error('Add a job description before opening the position.')
    // Reopening a past position drops a closing date that has already passed,
    // otherwise it would stay hidden on the Careers page.
    const expired = status === 'open' && job.closes_on && job.closes_on < new Date().toISOString().slice(0, 10)
    check(await insforge.database.from('job_postings').update({ status, ...(expired ? { closes_on: null } : {}) }).eq('id', id))
    revalidate(job.slug)
  })
}

export async function deleteJobAction(id: string): Promise<ActionResult> {
  const result = await withErrorHandling(async () => {
    await requirePages()
    const insforge = await createInsForgeServerClient()
    // Applications are removed with the job (their files are queued for deletion).
    check(await insforge.database.from('job_postings').delete().eq('id', id))
    revalidate()
  })
  if ('ok' in result) redirect('/admin/jobs')
  return result
}

export async function markApplicationReadAction(id: string, read: boolean): Promise<ActionResult> {
  return withErrorHandling(async () => {
    await requireApplicationsAccess()
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('job_applications').update({ is_read: read }).eq('id', id))
    revalidatePath('/admin/jobs', 'layout')
  })
}

export async function deleteApplicationAction(id: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    await requireApplicationsAccess()
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('job_applications').delete().eq('id', id))
    revalidatePath('/admin/jobs', 'layout')
  })
}
