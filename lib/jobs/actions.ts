'use server'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { after } from 'next/server'
import { createInsForgeAdminClient } from '@/lib/insforge/server'
import { purgeExpiredApplications } from './purge'

type Result = { ok: true } | { error: string }

const MAX_FILE_BYTES = 3 * 1024 * 1024
const RESUME_FILE = /\.(pdf|docx?|rtf|txt)$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const URL_RE = /^https?:\/\/\S+$/i
const RATE_LIMIT = 3
const RATE_WINDOW_MS = 10 * 60 * 1000
const GENERIC_ERROR = 'Your application could not be sent. Please try again.'

async function senderHash(): Promise<string> {
  const h = await headers()
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown'
  return createHash('sha256').update(`${process.env.INSFORGE_API_KEY ?? ''}:${ip}`).digest('hex').slice(0, 32)
}

function text(fd: FormData, name: string, max: number) {
  return String(fd.get(name) ?? '').trim().slice(0, max)
}

// Public job application. The job must be open; the résumé goes to private
// storage and the application is kept for 7 days (see lib/jobs/purge.ts).
export async function submitJobApplicationAction(jobId: string, fd: FormData): Promise<Result> {
  try {
    if (text(fd, '__website', 200)) return { ok: true } // honeypot: pretend success to bots

    const name = text(fd, 'name', 200)
    const email = text(fd, 'email', 200)
    const phone = text(fd, 'phone', 50)
    const profileUrl = text(fd, 'profile_url', 500)
    const message = text(fd, 'message', 5000)
    if (!name) return { error: 'Please enter your name.' }
    if (!EMAIL.test(email)) return { error: 'Please enter a valid email address.' }
    if (profileUrl && !URL_RE.test(profileUrl)) return { error: 'Profile link must start with https://' }
    if (!message) return { error: 'Please tell us a little about yourself.' }
    if (String(fd.get('consent') ?? '') !== 'on') return { error: 'Please confirm you agree to how we handle your application.' }

    const file = fd.get('resume')
    const resume = file instanceof File && file.size > 0 ? file : null
    if (!resume) return { error: 'Please attach your résumé or CV.' }
    if (resume.size > MAX_FILE_BYTES) return { error: 'Your résumé must be 3 MB or smaller.' }
    if (!RESUME_FILE.test(resume.name)) return { error: 'Please upload your résumé as a PDF or Word document.' }

    const admin = createInsForgeAdminClient()
    const { data: job } = await admin.database.from('job_postings').select('id, status, closes_on').eq('id', jobId).maybeSingle()
    const closed = !job || job.status !== 'open' || (job.closes_on && new Date(`${job.closes_on}T23:59:59`) < new Date())
    if (closed) return { error: 'This position is no longer accepting applications.' }

    const ipHash = await senderHash()
    const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
    const { count } = await admin.database.from('job_applications').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', since)
    if ((count ?? 0) >= RATE_LIMIT) return { error: 'You’ve sent several applications in a short time. Please wait a few minutes and try again.' }

    const safeName = resume.name.replace(/[^A-Za-z0-9._-]+/g, '-').slice(-80)
    const key = `job-applications/${jobId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`
    const upload = await admin.storage.from('form-uploads').upload(key, resume)
    if (upload.error) return { error: 'Your résumé could not be uploaded. Please try again.' }

    const { error } = await admin.database
      .from('job_applications')
      .insert([{ job_id: jobId, name, email, phone, profile_url: profileUrl, message, resume_key: key, resume_name: resume.name.slice(0, 200), ip_hash: ipHash }])
    if (error) {
      await admin.storage.from('form-uploads').remove(key).catch(() => undefined)
      console.error('[jobs] insert failed', error)
      return { error: GENERIC_ERROR }
    }

    after(() => purgeExpiredApplications().catch((err) => console.error('[jobs] purge failed', err)))
    return { ok: true }
  } catch (err) {
    console.error('submitJobApplicationAction failed', err)
    return { error: GENERIC_ERROR }
  }
}
