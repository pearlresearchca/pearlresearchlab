import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Clock, Download, ExternalLink, Eye, Inbox, Mail, Percent, Phone, ShieldCheck, Users2 } from 'lucide-react'
import { NoSectionAccess } from '@/components/admin/no-access'
import { ActionForm } from '@/components/admin/action-form'
import { SubmitButton } from '@/components/admin/submit-button'
import { RichTextField } from '@/components/admin/rich-text-field'
import { AdminCard, EmptyState, Field, LastEdited, TextArea, TextInput } from '@/components/admin/ui'
import { TrendPanel } from '@/components/admin/content-insights'
import { KpiGrid } from '@/components/admin/kpi-grid'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { getUserDirectory } from '@/lib/cms/queries'
import { APPLICATION_RETENTION_DAYS, getApplications, getDailyMetrics, getJobById } from '@/lib/cms/posts-jobs'
import { dailySeries, fmt, pct, totalsByItem } from '@/lib/cms/metrics'
import { relativeTime } from '@/lib/cms/format'
import { deleteApplicationAction, deleteJobAction, markApplicationReadAction, setJobStatusAction, updateJobAction } from '../actions'

export const metadata = { title: 'Edit position' }

function daysLeft(createdAt: string) {
  const ms = new Date(createdAt).getTime() + APPLICATION_RETENTION_DAYS * 86_400_000 - Date.now()
  const d = Math.max(0, Math.ceil(ms / 86_400_000))
  return d <= 1 ? 'Deleted within a day' : `Deleted in ${d} days`
}

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  const canEdit = canAccess(admin?.profile, 'pages')
  if (!canEdit && !canAccess(admin?.profile, 'contact')) return <NoSectionAccess label="Job openings" />
  const { id } = await params
  const job = await getJobById(id)
  if (!job) notFound()

  const [users, applications, allMetrics] = await Promise.all([getUserDirectory(), getApplications(job.id), getDailyMetrics('job', 90)])
  const metrics = allMetrics.filter((m) => m.item_id === job.id)
  const t30 = totalsByItem(metrics, 30).get(job.id) ?? { views: 0, applications: 0 }
  const tAll = totalsByItem(metrics).get(job.id) ?? { views: 0, applications: 0 }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/admin/jobs" className="hover:text-primary">Job openings</Link>
            <ChevronRight className="size-3" aria-hidden="true" />
            <span className="truncate">{job.title}</span>
          </nav>
          <h1 className="mt-1 truncate text-2xl font-semibold text-foreground">{job.title}</h1>
          <LastEdited at={job.updated_at} by={job.updated_by} users={users} />
        </div>
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            {job.status === 'open' && (
              <a href={`/careers/${job.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold hover:bg-muted">
                <ExternalLink className="size-4" aria-hidden="true" /> View posting
              </a>
            )}
            {job.status !== 'open' && (
              <ActionForm action={setJobStatusAction.bind(null, job.id, 'open')} successMessage="Position is open — it’s now on the Careers page">
                <SubmitButton pendingText="Opening…">Open for applications</SubmitButton>
              </ActionForm>
            )}
            {job.status === 'open' && (
              <ActionForm action={setJobStatusAction.bind(null, job.id, 'closed')} successMessage="Position closed">
                <SubmitButton variant="ghost" pendingText="Closing…">Close position</SubmitButton>
              </ActionForm>
            )}
          </div>
        )}
      </div>

      <KpiGrid
        items={[
          { label: 'Applications (30 days)', value: fmt(t30.applications), detail: `${fmt(tAll.applications)} in 90 days`, icon: Users2 },
          { label: 'In inbox now', value: fmt(applications.length), detail: `${applications.filter((a) => !a.is_read).length} unread · kept ${APPLICATION_RETENTION_DAYS} days`, icon: Inbox, tone: 'teal' },
          { label: 'Posting views (30 days)', value: fmt(t30.views), detail: `${fmt(tAll.views)} in 90 days`, icon: Eye, tone: 'violet' },
          { label: 'View → apply rate', value: pct(t30.applications, t30.views), detail: 'Last 30 days', icon: Percent, tone: 'amber' },
        ]}
      />

      <AdminCard
        title={`Applications (${applications.length})`}
        description={`Newest first. Applications and résumés are deleted automatically ${APPLICATION_RETENTION_DAYS} days after they arrive — download anything you need to keep.`}
        icon={<ShieldCheck className="size-4 text-emerald-600" aria-hidden="true" />}
      >
        {applications.length === 0 ? (
          <EmptyState title="No applications in the last 7 days" body={job.status === 'open' ? 'New applications will appear here.' : 'Open the position to start receiving applications.'} />
        ) : (
          <ul className="flex flex-col gap-3">
            {applications.map((a) => (
              <li key={a.id}>
                <details className={`group rounded-xl border ${a.is_read ? 'border-border' : 'border-primary/40 bg-primary/[.03]'}`}>
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                    {!a.is_read && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{a.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{a.email}</span>
                    </span>
                    <span className="hidden items-center gap-1 text-[11px] text-amber-700 sm:inline-flex"><Clock className="size-3" aria-hidden="true" /> {daysLeft(a.created_at)}</span>
                    <span suppressHydrationWarning className="w-20 text-right text-xs text-muted-foreground">{relativeTime(a.created_at)}</span>
                    <ChevronRight className="size-4 text-slate-400 transition-transform group-open:rotate-90" aria-hidden="true" />
                  </summary>
                  <div className="flex flex-col gap-4 border-t border-border p-4">
                    <div className="flex flex-wrap gap-2 text-sm">
                      <a href={`mailto:${a.email}`} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-medium hover:bg-muted"><Mail className="size-4" aria-hidden="true" /> {a.email}</a>
                      {a.phone && <a href={`tel:${a.phone}`} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-medium hover:bg-muted"><Phone className="size-4" aria-hidden="true" /> {a.phone}</a>}
                      {a.profile_url && <a href={a.profile_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-medium hover:bg-muted"><ExternalLink className="size-4" aria-hidden="true" /> Profile</a>}
                      {a.resume_key && (
                        <a href={`/admin/jobs/resume?id=${a.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-semibold text-white hover:bg-primary-dark">
                          <Download className="size-4" aria-hidden="true" /> {a.resume_name || 'Résumé'}
                        </a>
                      )}
                    </div>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{a.message}</p>
                    <div className="flex flex-wrap gap-2">
                      <ActionForm action={markApplicationReadAction.bind(null, a.id, !a.is_read)} successMessage={a.is_read ? 'Marked as unread' : 'Marked as read'}>
                        <SubmitButton variant="ghost" className="!px-3 !py-1.5 text-xs">{a.is_read ? 'Mark as unread' : 'Mark as read'}</SubmitButton>
                      </ActionForm>
                      <ActionForm action={deleteApplicationAction.bind(null, a.id)} successMessage="Application deleted">
                        <SubmitButton variant="danger" className="!px-3 !py-1.5 text-xs" pendingText="Deleting…">Delete now</SubmitButton>
                      </ActionForm>
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <TrendPanel title="Activity" data={dailySeries(metrics, 90, (m) => [m.views, m.applications])} primaryLabel="Posting views" secondaryLabel="Applications" empty="Activity appears here once the position is open." />

      {canEdit && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <ActionForm action={updateJobAction.bind(null, job.id)} successMessage="Position saved" className="flex min-w-0 flex-col gap-6">
            <AdminCard title="Position">
              <div className="flex flex-col gap-4">
                <Field label="Title" htmlFor="title"><TextInput id="title" name="title" defaultValue={job.title} required maxLength={200} /></Field>
                <Field label="Summary" htmlFor="summary" hint="One or two sentences shown on the Careers page and in search results.">
                  <TextArea id="summary" name="summary" rows={2} defaultValue={job.summary} maxLength={400} />
                </Field>
                <Field label="Description" htmlFor="description" hint="Responsibilities, qualifications, pay or stipend, how to apply…">
                  <RichTextField id="description" name="description_html" defaultValue={job.description_html} tall />
                </Field>
              </div>
            </AdminCard>
            <AdminCard title="Details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Team or stream" htmlFor="team"><TextInput id="team" name="team" defaultValue={job.team} placeholder="e.g. Transforming Food Systems" /></Field>
                <Field label="Location" htmlFor="location"><TextInput id="location" name="location" defaultValue={job.location} placeholder="e.g. Antigonish, NS · Hybrid" /></Field>
                <Field label="Type" htmlFor="employment_type"><TextInput id="employment_type" name="employment_type" defaultValue={job.employment_type} placeholder="e.g. Part-time · Research assistant" /></Field>
                <Field label="Applications close" htmlFor="closes_on" hint="Optional. Applications stop after this date."><TextInput id="closes_on" name="closes_on" type="date" defaultValue={job.closes_on ?? ''} /></Field>
                <Field label="Web address" htmlFor="slug" hint={`The posting lives at /careers/${job.slug}`}><TextInput id="slug" name="slug" defaultValue={job.slug} /></Field>
                <Field label="Order" htmlFor="sort_order" hint="Lower numbers are listed first."><TextInput id="sort_order" name="sort_order" type="number" defaultValue={job.sort_order} /></Field>
              </div>
              <div className="mt-5"><SubmitButton>Save position</SubmitButton></div>
            </AdminCard>
          </ActionForm>
          <AdminCard title="Delete position">
            <p className="mb-3 text-sm text-muted-foreground">Removes the posting and every application for it (résumés included).</p>
            <ActionForm action={deleteJobAction.bind(null, job.id)} successMessage="Position deleted">
              <SubmitButton variant="danger" pendingText="Deleting…">Delete position</SubmitButton>
            </ActionForm>
          </AdminCard>
        </div>
      )}
    </div>
  )
}
