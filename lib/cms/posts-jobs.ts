import { createClient } from '@insforge/sdk'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import type { BlogPost, DailyMetric, JobApplication, JobPosting } from './types'

// Blog posts, job postings, applications and their analytics counters.
// Public lists return [] if the tables aren't there yet (before the
// migration runs) instead of breaking the page they're shown on.

type Res<T> = { data: T | null; error: { message?: string; code?: string } | null }

function rows<T>(r: Res<T[]>, context: string): T[] {
  if (r.error) {
    console.error(`[data] ${context} failed:`, r.error.message ?? r.error)
    return []
  }
  return r.data ?? []
}

// Applications are kept for 7 days; older ones are never shown even if the
// nightly clean-up hasn't run yet.
export const APPLICATION_RETENTION_DAYS = 7
export function applicationCutoff(): string {
  return new Date(Date.now() - APPLICATION_RETENTION_DAYS * 86_400_000).toISOString()
}

// ------------------------------------------------------------ blog posts
export async function getPublishedPosts(limit = 50): Promise<BlogPost[]> {
  const insforge = await createInsForgeServerClient()
  const r = await insforge.database.from('blog_posts').select('*').eq('status', 'published').order('featured', { ascending: false }).order('published_at', { ascending: false }).limit(limit)
  return rows(r as Res<BlogPost[]>, 'getPublishedPosts')
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const insforge = await createInsForgeServerClient()
  const r = await insforge.database.from('blog_posts').select('*').order('updated_at', { ascending: false }).limit(500)
  return rows(r as Res<BlogPost[]>, 'getAllPosts')
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const insforge = await createInsForgeServerClient()
  const r = await insforge.database.from('blog_posts').select('*').eq('slug', slug).eq('status', 'published').maybeSingle()
  return (r.data as BlogPost | null) ?? null
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const insforge = await createInsForgeServerClient()
  const r = await insforge.database.from('blog_posts').select('*').eq('id', id).maybeSingle()
  return (r.data as BlogPost | null) ?? null
}

// ------------------------------------------------------------ jobs
export async function getOpenJobs(): Promise<JobPosting[]> {
  const insforge = await createInsForgeServerClient()
  const r = await insforge.database.from('job_postings').select('*').eq('status', 'open').order('sort_order', { ascending: true }).order('created_at', { ascending: false }).limit(100)
  return rows(r as Res<JobPosting[]>, 'getOpenJobs')
}

export async function getAllJobs(): Promise<JobPosting[]> {
  const insforge = await createInsForgeServerClient()
  const r = await insforge.database.from('job_postings').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }).limit(500)
  return rows(r as Res<JobPosting[]>, 'getAllJobs')
}

export async function getJobBySlug(slug: string): Promise<JobPosting | null> {
  const insforge = await createInsForgeServerClient()
  const r = await insforge.database.from('job_postings').select('*').eq('slug', slug).eq('status', 'open').maybeSingle()
  return (r.data as JobPosting | null) ?? null
}

export async function getJobById(id: string): Promise<JobPosting | null> {
  const insforge = await createInsForgeServerClient()
  const r = await insforge.database.from('job_postings').select('*').eq('id', id).maybeSingle()
  return (r.data as JobPosting | null) ?? null
}

export async function getApplications(jobId?: string): Promise<JobApplication[]> {
  const insforge = await createInsForgeServerClient()
  let q = insforge.database
    .from('job_applications')
    .select('id, job_id, name, email, phone, profile_url, message, resume_key, resume_name, is_read, created_at')
    .gte('created_at', applicationCutoff())
  if (jobId) q = q.eq('job_id', jobId)
  const r = await q.order('created_at', { ascending: false }).limit(1000)
  return rows(r as Res<JobApplication[]>, 'getApplications')
}

// ------------------------------------------------------------ analytics
export async function getDailyMetrics(kind: 'post' | 'job', days = 90): Promise<DailyMetric[]> {
  const insforge = await createInsForgeServerClient()
  const since = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10)
  const r = await insforge.database.from('content_daily_metrics').select('kind, item_id, day, views, applications').eq('kind', kind).gte('day', since).limit(20000)
  return rows(r as Res<DailyMetric[]>, 'getDailyMetrics')
}

// Records one public view (counted only for published posts / open jobs).
// Uses a cookie-free anonymous client so it can run inside after(), where
// request cookies aren't available. Likely bots aren't counted.
export async function recordView(kind: 'post' | 'job', id: string, userAgent = '') {
  if (/bot|crawl|spider|slurp|preview|monitor|headless/i.test(userAgent)) return
  try {
    const insforge = createClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!, anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!, timeout: 10_000 })
    const { error } = await insforge.database.rpc('record_content_view', { p_kind: kind, p_item: id })
    if (error) console.error('[analytics] recordView failed:', error.message)
  } catch (err) {
    console.error('[analytics] recordView failed:', err)
  }
}
