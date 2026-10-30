import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { after } from 'next/server'
import { ArrowLeft, Briefcase, CalendarClock, MapPin, Users } from 'lucide-react'
import { PageFrame } from '@/components/page-frame'
import { JobApplicationForm } from '@/components/job-application-form'
import { formatDate } from '@/components/builder-render/site-blocks'
import { getJobBySlug, recordView } from '@/lib/cms/posts-jobs'
import { sanitizeByType } from '@/lib/builder/sanitize'
import { JsonLd, ORGANIZATION, SITE_URL, breadcrumbs } from '@/lib/seo/json-ld'

type Props = { params: Promise<{ slug: string }> }

function isClosed(closesOn: string | null) {
  return !!closesOn && closesOn < new Date().toISOString().slice(0, 10)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await getJobBySlug((await params).slug)
  if (!job) return { title: 'Position not found' }
  const description = job.summary || `${job.title} at PEARL Research Lab, St. Francis Xavier University.`
  return {
    title: `${job.title} — Careers`,
    description,
    alternates: { canonical: `/careers/${job.slug}` },
    openGraph: { type: 'website', url: `/careers/${job.slug}`, title: `${job.title} · PEARL Research Lab`, description },
    twitter: { card: 'summary_large_image', title: job.title, description },
  }
}

export default async function JobPage({ params }: Props) {
  const job = await getJobBySlug((await params).slug)
  if (!job) notFound()
  const userAgent = (await headers()).get('user-agent') ?? ''
  after(() => recordView('job', job.id, userAgent))
  const closed = isClosed(job.closes_on)

  return (
    <PageFrame>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              // Google for Jobs
              '@type': 'JobPosting',
              title: job.title,
              description: job.description_html,
              datePosted: job.created_at,
              ...(job.closes_on ? { validThrough: `${job.closes_on}T23:59:59-04:00` } : {}),
              ...(job.employment_type ? { employmentType: job.employment_type } : {}),
              hiringOrganization: { '@type': 'Organization', name: 'PEARL Research Lab — St. Francis Xavier University', sameAs: SITE_URL },
              jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: job.location || 'Antigonish', addressRegion: 'NS', addressCountry: 'CA' } },
              directApply: true,
              url: `${SITE_URL}/careers/${job.slug}`,
            },
            ORGANIZATION,
            breadcrumbs([{ name: 'Home', path: '' }, { name: 'Careers', path: '/careers' }, { name: job.title, path: `/careers/${job.slug}` }]),
          ],
        }}
      />
      <main className="job-page">
        <header className="job-hero">
          <div className="site-container">
            <a href="/careers" className="article-back"><ArrowLeft aria-hidden="true" /> All opportunities</a>
            {job.team && <p className="eyebrow">{job.team}</p>}
            <h1>{job.title}</h1>
            {job.summary && <p className="job-hero-lead">{job.summary}</p>}
            <ul className="job-facts">
              {job.location && <li><MapPin aria-hidden="true" /> {job.location}</li>}
              {job.employment_type && <li><Briefcase aria-hidden="true" /> {job.employment_type}</li>}
              {job.team && <li><Users aria-hidden="true" /> {job.team}</li>}
              {job.closes_on && <li><CalendarClock aria-hidden="true" /> Apply by {formatDate(`${job.closes_on}T12:00:00Z`)}</li>}
            </ul>
          </div>
        </header>
        <div className="site-container job-layout">
          <article className="pb-rich job-description" dangerouslySetInnerHTML={{ __html: sanitizeByType('richtext', job.description_html) }} />
          <aside className="job-apply-card" id="apply" aria-labelledby="apply-title">
            <h2 id="apply-title">{closed ? 'Applications closed' : 'Apply for this role'}</h2>
            {closed ? <p>This position stopped accepting applications on {formatDate(`${job.closes_on}T12:00:00Z`)}.</p> : <JobApplicationForm jobId={job.id} jobTitle={job.title} />}
          </aside>
        </div>
      </main>
    </PageFrame>
  )
}
