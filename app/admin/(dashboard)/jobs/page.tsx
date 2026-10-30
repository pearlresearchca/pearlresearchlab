import Link from 'next/link'
import { after } from 'next/server'
import { BriefcaseBusiness, Eye, Inbox, Percent, Plus, ShieldCheck, Users2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { NoSectionAccess } from '@/components/admin/no-access'
import { ActionForm } from '@/components/admin/action-form'
import { SubmitButton } from '@/components/admin/submit-button'
import { EmptyState } from '@/components/admin/ui'
import { BreakdownPanel, RankingPanel, TrendPanel } from '@/components/admin/content-insights'
import { KpiGrid } from '@/components/admin/kpi-grid'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { APPLICATION_RETENTION_DAYS, getAllJobs, getApplications, getDailyMetrics } from '@/lib/cms/posts-jobs'
import { dailySeries, fmt, pct, totalsByItem } from '@/lib/cms/metrics'
import { purgeExpiredApplications } from '@/lib/jobs/purge'
import { createJobAction } from './actions'

export const metadata = { title: 'Job openings' }

const STATUS_STYLE = { open: 'bg-emerald-50 text-emerald-700', draft: 'bg-amber-50 text-amber-700', closed: 'bg-slate-100 text-slate-600' } as const
const STATUS_LABEL = { open: 'Open', draft: 'Draft', closed: 'Closed' } as const

export default async function JobsAdminPage() {
  const admin = await getCurrentAdmin()
  const canEdit = canAccess(admin?.profile, 'pages')
  if (!canEdit && !canAccess(admin?.profile, 'contact')) return <NoSectionAccess label="Job openings" />

  // Clear expired applications and their files in the background.
  after(() => purgeExpiredApplications().catch((err) => console.error('[jobs] purge failed', err)))

  const [jobs, applications, metrics] = await Promise.all([getAllJobs(), getApplications(), getDailyMetrics('job', 90)])
  const totals30 = totalsByItem(metrics, 30)
  const totalsAll = totalsByItem(metrics)
  const views30 = [...totals30.values()].reduce((s, t) => s + t.views, 0)
  const apps30 = [...totals30.values()].reduce((s, t) => s + t.applications, 0)
  const appsAll = [...totalsAll.values()].reduce((s, t) => s + t.applications, 0)
  const unread = applications.filter((a) => !a.is_read).length
  const open = jobs.filter((j) => j.status === 'open')
  const inbox = new Map<string, number>()
  for (const a of applications) inbox.set(a.job_id, (inbox.get(a.job_id) ?? 0) + 1)
  const byTeam = new Map<string, number>()
  for (const j of jobs) {
    const apps = totalsAll.get(j.id)?.applications ?? 0
    if (apps) byTeam.set(j.team || 'Other', (byTeam.get(j.team || 'Other') ?? 0) + apps)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        group="Content"
        title="Job openings"
        description="Post positions, receive applications and see how each opening performs. Open positions appear wherever the Job openings block is placed (the Careers page)."
        icon={<BriefcaseBusiness />}
      />

      <KpiGrid
        items={[
          { label: 'Open positions', value: fmt(open.length), detail: `${jobs.length} in total · ${jobs.filter((j) => j.status === 'draft').length} drafts`, icon: BriefcaseBusiness },
          { label: 'Applications (30 days)', value: fmt(apps30), detail: `${fmt(appsAll)} in 90 days · ${unread} unread now`, icon: Inbox, tone: 'teal' },
          { label: 'Job page views (30 days)', value: fmt(views30), detail: 'Visits to job detail pages', icon: Eye, tone: 'violet' },
          { label: 'View → apply rate', value: pct(apps30, views30), detail: 'Applications per job page view, 30 days', icon: Percent, tone: 'amber' },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <TrendPanel title="Views and applications" data={dailySeries(metrics, 90, (m) => [m.views, m.applications])} primaryLabel="Job page views" secondaryLabel="Applications" empty="Activity appears here once a position is open." />
        <BreakdownPanel title="Applications by team" subtitle="Last 90 days" data={[...byTeam].map(([label, value]) => ({ label, value }))} empty="No applications yet." />
      </div>
      <RankingPanel
        title="Applications per position"
        subtitle="Last 30 days"
        data={jobs.map((j) => ({ label: j.title, value: totals30.get(j.id)?.applications ?? 0, secondary: totals30.get(j.id)?.views ?? 0 })).sort((a, b) => b.value - a.value || (b.secondary ?? 0) - (a.secondary ?? 0))}
        primaryLabel="Applications"
        secondaryLabel="Page views"
        empty="No activity in the last 30 days."
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,.04)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold">Positions</h2>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-600" aria-hidden="true" /> Applications and résumés are deleted automatically after {APPLICATION_RETENTION_DAYS} days.
            </p>
          </div>
          {canEdit && (
            <ActionForm action={createJobAction} successMessage="Position created" className="flex w-full max-w-md gap-2">
              <input
                name="title"
                required
                maxLength={200}
                placeholder="Title of a new position…"
                aria-label="New position title"
                className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
              <SubmitButton className="!py-1.5" pendingText="Creating…">
                <Plus className="size-4" aria-hidden="true" /> New position
              </SubmitButton>
            </ActionForm>
          )}
        </header>
        {jobs.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No positions yet" body="Add a position title above, then describe the role and open it for applications." />
          </div>
        ) : (
          <ul className="divide-y divide-border" data-tour="job-list">
            {jobs.map((j) => {
              const current = inbox.get(j.id) ?? 0
              const fresh = applications.filter((a) => a.job_id === j.id && !a.is_read).length
              return (
                <li key={j.id}>
                  <Link href={`/admin/jobs/${j.id}`} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-background">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BriefcaseBusiness className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">{j.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{[j.team, j.location, j.employment_type].filter(Boolean).join(' · ') || 'Add details'}</span>
                    </span>
                    <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                      <Users2 className="size-3.5" aria-hidden="true" />
                      <span className="tabular-nums">{fmt(totalsAll.get(j.id)?.applications ?? 0)}</span> applied
                    </span>
                    {fresh > 0 ? (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white tabular-nums">{fresh} new</span>
                    ) : (
                      <span className="hidden w-14 text-right text-xs text-muted-foreground tabular-nums md:block">{current} in inbox</span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[j.status]}`}>{STATUS_LABEL[j.status]}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
