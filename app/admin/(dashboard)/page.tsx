import Link from 'next/link'
import {
  ArrowUpRight,
  ExternalLink,
  FileStack,
  FlaskConical,
  FolderKanban,
  Handshake,
  Home as HomeIcon,
  Images,
  Inbox,
  Info,
  Mail,
  Menu,
  Palette,
  Plus,
  Sparkles,
  Users2,
  type LucideIcon,
} from 'lucide-react'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess, type SectionKey } from '@/lib/cms/permissions'
import { getAllTeamMembers, getAllPartners, getProjects } from '@/lib/cms/queries'
import { listPages } from '@/lib/builder/queries'
import { EmptyState } from '@/components/admin/ui'
import { initials, relativeTime } from '@/lib/cms/format'
import type { AuditLogEntry } from '@/lib/cms/types'

const sections: { href: string; label: string; description: string; icon: LucideIcon; section: SectionKey; tone: string }[] = [
  { href: '/admin/research', label: 'Research areas', description: 'The research streams shown on Home and the Research page.', icon: FlaskConical, section: 'research', tone: 'bg-sky-50 text-sky-600' },
  { href: '/admin/projects', label: 'Projects', description: 'Project pages, their sections and images.', icon: FolderKanban, section: 'projects', tone: 'bg-violet-50 text-violet-600' },
  { href: '/admin/team', label: 'Team', description: 'Team member photos, roles and bios.', icon: Users2, section: 'team', tone: 'bg-emerald-50 text-emerald-600' },
  { href: '/admin/partners', label: 'Partner logos', description: 'Upload logos and choose where they appear.', icon: Handshake, section: 'partners', tone: 'bg-amber-50 text-amber-600' },
  { href: '/admin/home', label: 'Home page (classic)', description: 'The original homepage form.', icon: HomeIcon, section: 'home', tone: 'bg-rose-50 text-rose-600' },
  { href: '/admin/about', label: 'About page (classic)', description: 'Mission, vision and values.', icon: Info, section: 'about', tone: 'bg-indigo-50 text-indigo-600' },
  { href: '/admin/contact', label: 'Contact page (classic)', description: 'Contact copy, address and hours.', icon: Mail, section: 'contact', tone: 'bg-teal-50 text-teal-600' },
]

const ACTION_STYLES: Record<string, string> = {
  insert: 'bg-emerald-50 text-emerald-700',
  update: 'bg-sky-50 text-sky-700',
  delete: 'bg-red-50 text-red-700',
}

const TABLE_LABELS: Record<string, string> = {
  cms_pages: 'Page',
  cms_settings: 'Site settings',
  cms_blocks: 'Reusable block',
  page_content: 'Page text',
  research_areas: 'Research area',
  about_values: 'Value',
  partners: 'Partner logo',
  partner_placements: 'Logo placement',
  projects: 'Project',
  project_sections: 'Project section',
  team_members: 'Team member',
}

function Stat({ label, value, icon: Icon, tone, href }: { label: string; value: number; icon: LucideIcon; tone: string; href?: string }) {
  const body = (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${tone}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
        <p className="mt-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  )
  return href ? <Link href={href} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20">{body}</Link> : body
}

export default async function AdminDashboard() {
  const admin = await getCurrentAdmin()
  const isAdmin = admin?.profile?.role === 'admin'
  const can = (s: SectionKey) => canAccess(admin?.profile, s)
  const visibleSections = sections.filter((s) => can(s.section))

  const [teamMembers, projects, partners, builderPages] = await Promise.all([getAllTeamMembers(), getProjects(false), getAllPartners(), listPages().catch(() => [])])
  const homePage = builderPages.find((p) => p.legacy_key === 'home')
  const published = builderPages.filter((p) => p.status === 'published').length
  const drafts = builderPages.filter((p) => p.status === 'draft').length

  const quick = [
    can('pages') && { href: '/admin/pages?new=1', label: 'New page', icon: Plus },
    (can('pages') || can('home')) && { href: homePage ? `/admin/builder/${homePage.id}` : '/admin/pages', label: 'Edit homepage', icon: HomeIcon },
    can('design') && { href: '/admin/navigation', label: 'Navigation', icon: Menu },
    (can('media') || can('pages')) && { href: '/admin/media', label: 'Upload media', icon: Images },
    can('design') && { href: '/admin/theme', label: 'Theme', icon: Palette },
  ].filter(Boolean) as { href: string; label: string; icon: LucideIcon }[]

  let recent: Pick<AuditLogEntry, 'id' | 'table_name' | 'action' | 'changed_by_email' | 'changed_at'>[] = []
  if (isAdmin) {
    const insforge = await createInsForgeServerClient()
    const { data } = await insforge.database.from('content_audit_log').select('id, table_name, action, changed_by_email, changed_at').order('changed_at', { ascending: false }).limit(8)
    recent = data ?? []
  }

  const displayName = admin?.profile?.full_name || admin?.email || ''
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-indigo-500 to-sky-500 p-7 text-white shadow-xl shadow-primary/20 sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 right-32 size-56 rounded-full bg-white/10" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles className="size-3.5" aria-hidden="true" /> PEARL website builder
          </p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting}{displayName ? `, ${displayName.split(/[\s@]/)[0]}` : ''} 👋
          </h1>
          <p className="mt-2 text-sm text-white/85 sm:text-base">Design pages visually, manage your media and keep the website up to date — no code needed.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {quick.map((q, i) => {
              const Icon = q.icon
              return (
                <Link
                  key={q.label}
                  href={q.href}
                  className={
                    i === 0
                      ? 'inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-lg transition hover:-translate-y-0.5'
                      : 'inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25'
                  }
                >
                  <Icon className="size-4" aria-hidden="true" /> {q.label}
                </Link>
              )
            })}
            <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25">
              <ExternalLink className="size-4" aria-hidden="true" /> View website
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={`Builder pages · ${published} published, ${drafts} drafts`} value={builderPages.length} icon={FileStack} tone="from-indigo-500 to-sky-400 shadow-indigo-500/30" href="/admin/pages" />
        <Stat label="Team members" value={teamMembers.length} icon={Users2} tone="from-emerald-500 to-teal-400 shadow-emerald-500/30" href={can('team') ? '/admin/team' : undefined} />
        <Stat label="Published projects" value={projects.filter((p) => p.published).length} icon={FolderKanban} tone="from-violet-500 to-fuchsia-400 shadow-violet-500/30" href={can('projects') ? '/admin/projects' : undefined} />
        <Stat label="Partner logos" value={partners.length} icon={Handshake} tone="from-amber-500 to-orange-400 shadow-amber-500/30" href={can('partners') ? '/admin/partners' : undefined} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* Content shortcuts */}
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Site content</h2>
              <p className="text-xs text-muted-foreground">Collections shown on your pages</p>
            </div>
          </div>
          {visibleSections.length === 0 ? (
            <EmptyState title="No content sections granted yet" body="Ask an admin to give you access from Users & access." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleSections.map((s) => {
                const Icon = s.icon
                return (
                  <Link key={s.href} href={s.href} className="group flex items-start gap-3 rounded-xl border border-border p-4 transition hover:border-primary/40 hover:bg-background hover:shadow-sm">
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${s.tone}`}>
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 font-semibold text-foreground">
                        {s.label}
                        <ArrowUpRight className="size-3.5 text-slate-400 opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Activity */}
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Recent activity</h2>
              <p className="text-xs text-muted-foreground">Latest changes across the site</p>
            </div>
            {isAdmin && <Link href="/admin/activity" className="text-xs font-semibold text-primary hover:underline">View all</Link>}
          </div>
          {!isAdmin ? (
            <div className="flex flex-col gap-2">
              {(can('pages') || can('contact')) && (
                <Link href="/admin/submissions" className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm font-medium hover:bg-background">
                  <Inbox className="size-4 text-primary" aria-hidden="true" /> Check form submissions
                </Link>
              )}
              <p className="text-xs text-muted-foreground">The full activity log is available to administrators.</p>
            </div>
          ) : recent.length === 0 ? (
            <EmptyState title="No changes yet" />
          ) : (
            <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
              {recent.map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[31px] flex size-5 items-center justify-center rounded-full border-2 border-surface bg-primary/15 text-[9px] font-bold text-primary" aria-hidden="true">
                    {initials(entry.changed_by_email ?? 'S').slice(0, 1)}
                  </span>
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{entry.changed_by_email?.split('@')[0] ?? 'System'}</span>{' '}
                    <span className={`mx-0.5 inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-semibold capitalize ${ACTION_STYLES[entry.action] ?? 'bg-muted text-muted-foreground'}`}>{entry.action}d</span>{' '}
                    <span className="text-muted-foreground">{TABLE_LABELS[entry.table_name] ?? entry.table_name}</span>
                  </p>
                  <p className="text-xs text-slate-400">{relativeTime(entry.changed_at)}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
