import Link from 'next/link'
import {
  ArrowRight,
  FileStack,
  FlaskConical,
  FolderKanban,
  Handshake,
  Home as HomeIcon,
  Inbox,
  Info,
  MessageSquare,
  PencilLine,
  LayoutTemplate,
  Mail,
  Plus,
  Users2,
  type LucideIcon,
} from 'lucide-react'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess, type SectionKey } from '@/lib/cms/permissions'
import { getAllTeamMembers, getAllPartners, getProjects, getResearchAreas, getUserDirectory } from '@/lib/cms/queries'
import { listPages } from '@/lib/builder/queries'
import { EmptyState } from '@/components/admin/ui'
import { StatusBadge } from '@/components/builder/ui'
import { relativeTime } from '@/lib/cms/format'
import { ActivityChart, StatusDonut, type ActivityPoint } from '@/components/admin/dashboard-charts'
import type { AuditLogEntry } from '@/lib/cms/types'

const CORE_PAGES: { key: SectionKey; label: string; href: string; icon: LucideIcon }[] = [
  { key: 'home', label: 'Home', href: '/admin/home', icon: HomeIcon },
  { key: 'about', label: 'About', href: '/admin/about', icon: Info },
  { key: 'research', label: 'Research', href: '/admin/research', icon: FlaskConical },
  { key: 'projects', label: 'Projects', href: '/admin/projects', icon: FolderKanban },
  { key: 'team', label: 'Team', href: '/admin/team', icon: Users2 },
  { key: 'contact', label: 'Contact', href: '/admin/contact', icon: Mail },
]

const TABLE_LABELS: Record<string, string> = {
  cms_pages: 'page',
  cms_settings: 'site settings',
  cms_blocks: 'reusable block',
  page_content: 'page text',
  research_areas: 'research area',
  about_values: 'value',
  partners: 'partner logo',
  partner_placements: 'logo placement',
  projects: 'project',
  project_sections: 'project section',
  team_members: 'team member',
}

const ACTION_VERB: Record<string, string> = { insert: 'added', update: 'updated', delete: 'removed' }
const ACTION_DOT: Record<string, string> = { insert: 'bg-emerald-500', update: 'bg-primary', delete: 'bg-red-500' }

function Card({ title, subtitle, action, children, className = '' }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,.04)] ${className}`}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

function Metric({ label, value, detail, icon: Icon, href }: { label: string; value: number; detail?: string; icon: LucideIcon; href?: string }) {
  const body = (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(15,23,42,.04)] transition hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-slate-500">
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-3">
        <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
      </div>
    </div>
  )
  return href ? (
    <Link href={href} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20">
      {body}
    </Link>
  ) : (
    body
  )
}

export default async function AdminDashboard() {
  const admin = await getCurrentAdmin()
  const isAdmin = admin?.profile?.role === 'admin'
  const can = (s: SectionKey) => canAccess(admin?.profile, s)

  const [teamMembers, projects, partners, areas, builderPages] = await Promise.all([
    getAllTeamMembers(),
    getProjects(false),
    getAllPartners(),
    getResearchAreas(),
    listPages().catch(() => []),
  ])
  const homePage = builderPages.find((p) => p.legacy_key === 'home')
  const published = builderPages.filter((p) => p.status === 'published').length
  const drafts = builderPages.filter((p) => p.status === 'draft').length
  const recentPages = [...builderPages].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5)
  const counts: Partial<Record<SectionKey, string>> = {
    research: `${areas.length} research areas`,
    projects: `${projects.length} projects`,
    team: `${teamMembers.length} members`,
  }
  const corePages = CORE_PAGES.filter((c) => can(c.key)).map((c) => ({ ...c, builder: builderPages.find((p) => p.legacy_key === c.key) }))
  const content = [
    { label: 'Partner logos', count: partners.length, href: '/admin/partners', icon: Handshake, section: 'partners' as const },
  ].filter((c) => can(c.section))

  // Last 30 days of content changes (admins) and form messages, for the
  // charts. Failures just leave a chart empty rather than breaking the page.
  const DAYS = 30
  const since = new Date(Date.now() - (DAYS - 1) * 86_400_000)
  since.setUTCHours(0, 0, 0, 0)
  const canMessages = can('pages') || can('contact')
  const insforge = await createInsForgeServerClient()
  const emptyDirectory = {} as Awaited<ReturnType<typeof getUserDirectory>>
  const [auditRes, directory, messagesRes, unreadRes] = await Promise.all([
    isAdmin
      ? insforge.database.from('content_audit_log').select('id, table_name, action, changed_by, changed_by_email, changed_at').gte('changed_at', since.toISOString()).order('changed_at', { ascending: false }).limit(5000)
      : Promise.resolve({ data: [] }),
    isAdmin ? getUserDirectory().catch(() => emptyDirectory) : Promise.resolve(emptyDirectory),
    canMessages ? insforge.database.from('cms_form_submissions').select('created_at').gte('created_at', since.toISOString()).limit(5000) : Promise.resolve({ data: [] }),
    canMessages ? insforge.database.from('cms_form_submissions').select('id', { count: 'exact', head: true }).eq('is_read', false) : Promise.resolve({ count: 0 }),
  ])
  const audit = (auditRes.data ?? []) as AuditLogEntry[]
  const messages = (messagesRes.data ?? []) as { created_at: string }[]
  const unread = unreadRes.count ?? 0
  const actorName = (e: Pick<AuditLogEntry, 'changed_by' | 'changed_by_email'>) => (e.changed_by && directory[e.changed_by]?.full_name) || e.changed_by_email?.split('@')[0] || 'System'
  const recent = audit.slice(0, 7).map((e) => ({ ...e, actor: actorName(e) }))

  const activity: ActivityPoint[] = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(since.getTime() + i * 86_400_000)
    return { date: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }), edits: 0, messages: 0 }
  })
  const byDate = new Map(activity.map((point) => [point.date, point]))
  for (const e of audit) {
    const point = byDate.get(e.changed_at.slice(0, 10))
    if (point) point.edits++
  }
  for (const m of messages) {
    const point = byDate.get(m.created_at.slice(0, 10))
    if (point) point.messages++
  }

  const contributorCounts = new Map<string, number>()
  for (const e of audit) contributorCounts.set(actorName(e), (contributorCounts.get(actorName(e)) ?? 0) + 1)
  const contributors = [...contributorCounts].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const topCount = contributors[0]?.[1] ?? 1

  const STATUS_LABELS: Record<string, string> = { published: 'Published', draft: 'Draft', scheduled: 'Scheduled', private: 'Private', unpublished: 'Unpublished' }
  const statusData = Object.entries(STATUS_LABELS)
    .map(([key, label]) => ({ label, value: builderPages.filter((p) => p.status === key).length }))
    .filter((d) => d.value > 0)

  const firstName = (admin?.profile?.full_name || admin?.email || '').split(/[\s@]/)[0]
  const canPages = can('pages')

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">Welcome back{firstName ? `, ${firstName}` : ''}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        </div>
        {canPages && (
          <div className="flex flex-wrap gap-2">
            <Link href={homePage ? `/admin/builder/${homePage.id}` : '/admin/pages'} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted">
              <LayoutTemplate className="size-4 text-slate-500" aria-hidden="true" /> Design homepage
            </Link>
            <Link href="/admin/pages?new=1" className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary-dark">
              <Plus className="size-4" aria-hidden="true" /> New page
            </Link>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Metric label="Pages" value={builderPages.length} detail={`${published} published · ${drafts} drafts`} icon={FileStack} href={canPages ? '/admin/pages' : undefined} />
        {isAdmin ? (
          <Metric label="Content changes" value={audit.length} detail="Last 30 days" icon={PencilLine} href="/admin/activity" />
        ) : (
          <Metric label="Projects" value={projects.length} detail={`${projects.filter((p) => p.published).length} published`} icon={FolderKanban} href={can('projects') ? '/admin/projects' : undefined} />
        )}
        {canMessages ? (
          <Metric label="Form messages" value={messages.length} detail={unread ? `Last 30 days · ${unread} unread` : 'Last 30 days · all read'} icon={MessageSquare} href="/admin/submissions" />
        ) : (
          <Metric label="Partner logos" value={partners.length} icon={Handshake} href={can('partners') ? '/admin/partners' : undefined} />
        )}
        <Metric label="Team members" value={teamMembers.length} detail={`${teamMembers.filter((m) => m.active).length} shown on the site`} icon={Users2} href={can('team') ? '/admin/team' : undefined} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          {(isAdmin || canMessages) && (
            <Card title="Activity" subtitle="Content changes and form messages, last 30 days">
              <div className="px-3 pb-3 pt-4">
                <ActivityChart data={activity} showMessages={canMessages} />
              </div>
            </Card>
          )}

          {/* Recent pages */}
          {canPages && (
            <Card
              title="Recently updated pages"
              subtitle="Pick up where you left off"
              action={<Link href="/admin/pages" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">All pages <ArrowRight className="size-3.5" /></Link>}
            >
              {recentPages.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No pages yet" body="Create a page, or import the core pages under Pages." />
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {recentPages.map((p) => (
                    <li key={p.id}>
                      <Link href={`/admin/builder/${p.id}`} className="flex items-center gap-4 px-5 py-3 transition hover:bg-background">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-slate-600">
                          {p.slug === '' ? <HomeIcon className="size-4" /> : p.title.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">{p.title}</span>
                          <span className="block truncate font-mono text-[11px] text-slate-500">/{p.slug}</span>
                        </span>
                        <StatusBadge status={p.status} />
                        <span suppressHydrationWarning className="hidden w-20 text-right text-xs text-muted-foreground sm:block">{relativeTime(p.updated_at)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {/* Core pages */}
          {corePages.length > 0 && (
            <Card title="Core pages" subtitle="Edit text quickly, or open the page builder to change the layout">
              <ul className="divide-y divide-border">
                {corePages.map((c) => {
                  const Icon = c.icon
                  const state = c.builder ? (c.builder.status === 'published' ? 'Page-builder design is live' : 'Page-builder draft, not live yet') : 'Original design'
                  return (
                    <li key={c.key} className="flex flex-wrap items-center gap-4 px-5 py-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">{c.label}</span>
                        <span className="block text-xs text-muted-foreground">{state}{counts[c.key] ? ` · ${counts[c.key]}` : ''}</span>
                      </span>
                      <span className="flex gap-2">
                        <Link href={c.href} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">Edit text</Link>
                        {canPages && (
                          <Link href={c.builder ? `/admin/builder/${c.builder.id}` : '/admin/pages'} className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">
                            Design
                          </Link>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {canPages && (
            <Card title="Pages by status" action={<Link href="/admin/pages" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Manage <ArrowRight className="size-3.5" /></Link>}>
              <div className="p-5">
                <StatusDonut data={statusData} />
              </div>
            </Card>
          )}

          {/* Site content */}
          {content.length > 0 && (
            <Card title="Shared content" subtitle="Used on several pages">
              <ul className="divide-y divide-border">
                {content.map((c) => {
                  const Icon = c.icon
                  return (
                    <li key={c.href}>
                      <Link href={c.href} className="group flex items-center gap-3 px-5 py-3 transition hover:bg-background">
                        <Icon className="size-4 text-slate-400" aria-hidden="true" />
                        <span className="flex-1 text-sm font-medium text-foreground">{c.label}</span>
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-slate-600">{c.count}</span>
                        <ArrowRight className="size-3.5 text-slate-300 transition group-hover:text-primary" aria-hidden="true" />
                      </Link>
                    </li>
                  )
                })}
                {(canPages || can('contact')) && (
                  <li>
                    <Link href="/admin/submissions" className="group flex items-center gap-3 px-5 py-3 transition hover:bg-background">
                      <Inbox className="size-4 text-slate-400" aria-hidden="true" />
                      <span className="flex-1 text-sm font-medium text-foreground">Form submissions</span>
                      <ArrowRight className="size-3.5 text-slate-300 transition group-hover:text-primary" aria-hidden="true" />
                    </Link>
                  </li>
                )}
              </ul>
            </Card>
          )}

          {isAdmin && contributors.length > 0 && (
            <Card title="Top contributors" subtitle="Changes in the last 30 days">
              <ul className="flex flex-col gap-3.5 px-5 py-4">
                {contributors.map(([name, count]) => (
                  <li key={name}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-foreground">{name}</span>
                      <span className="shrink-0 text-xs font-semibold text-slate-600">{count}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-muted">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.max((count / topCount) * 100, 4)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Activity */}
          {isAdmin && (
            <Card title="Recent activity" action={<Link href="/admin/activity" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">View all <ArrowRight className="size-3.5" /></Link>}>
              {recent.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No changes yet" />
                </div>
              ) : (
                <ol className="flex flex-col gap-3.5 px-5 py-4">
                  {recent.map((entry) => (
                    <li key={entry.id} className="flex gap-3">
                      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${ACTION_DOT[entry.action] ?? 'bg-slate-400'}`} aria-hidden="true" />
                      <div className="min-w-0 text-sm">
                        <p className="text-foreground">
                          <span className="font-semibold">{entry.actor}</span> {ACTION_VERB[entry.action] ?? entry.action} a {TABLE_LABELS[entry.table_name] ?? entry.table_name}
                        </p>
                        <p suppressHydrationWarning className="text-xs text-muted-foreground">{relativeTime(entry.changed_at)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
