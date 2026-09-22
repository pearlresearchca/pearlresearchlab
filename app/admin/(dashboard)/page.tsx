import Link from 'next/link'
import {
  ExternalLink,
  FileStack,
  FlaskConical,
  Images,
  Menu,
  Palette,
  Plus,
  FolderKanban,
  Handshake,
  Home as HomeIcon,
  Info,
  Mail,
  Users2,
  type LucideIcon,
} from 'lucide-react'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess, type SectionKey } from '@/lib/cms/permissions'
import { getAllTeamMembers, getAllPartners, getProjects } from '@/lib/cms/queries'
import { listPages } from '@/lib/builder/queries'
import { AdminCard, EmptyState } from '@/components/admin/ui'
import { initials, relativeTime } from '@/lib/cms/format'
import type { AuditLogEntry } from '@/lib/cms/types'

const sections: { href: string; label: string; description: string; icon: LucideIcon; section: SectionKey }[] = [
  { href: '/admin/home', label: 'Home page', description: 'Hero, purpose statement, featured project, and calls to action.', icon: HomeIcon, section: 'home' },
  { href: '/admin/about', label: 'About page', description: 'Mission, vision, PEARL values, and partner logos.', icon: Info, section: 'about' },
  { href: '/admin/research', label: 'Research areas', description: 'The five research streams shown on Home and the Research page.', icon: FlaskConical, section: 'research' },
  { href: '/admin/projects', label: 'Projects', description: 'Project pages, their sections, and images.', icon: FolderKanban, section: 'projects' },
  { href: '/admin/team', label: 'Team', description: 'Team member photos, roles, and bios.', icon: Users2, section: 'team' },
  { href: '/admin/partners', label: 'Partner logos', description: 'Upload logos and control where each one appears.', icon: Handshake, section: 'partners' },
  { href: '/admin/contact', label: 'Contact page', description: 'Contact copy, address, and hours.', icon: Mail, section: 'contact' },
]

const ACTION_STYLES: Record<string, string> = {
  insert: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
}

export default async function AdminDashboard() {
  const admin = await getCurrentAdmin()
  const isAdmin = admin?.profile?.role === 'admin'
  const visibleSections = sections.filter((s) => canAccess(admin?.profile, s.section))

  const [teamMembers, projects, partners, builderPages] = await Promise.all([getAllTeamMembers(), getProjects(false), getAllPartners(), listPages().catch(() => [])])
  const homePage = builderPages.find((p) => p.legacy_key === 'home')
  const can = (s: SectionKey) => canAccess(admin?.profile, s)
  const quick = [
    can('pages') && { href: '/admin/pages?new=1', label: 'New page', icon: Plus },
    (can('pages') || can('home')) && { href: homePage ? `/admin/builder/${homePage.id}` : '/admin/pages', label: 'Edit homepage', icon: HomeIcon },
    (can('pages') || can('seo')) && { href: '/admin/pages', label: 'All pages', icon: FileStack },
    can('design') && { href: '/admin/navigation', label: 'Manage navigation', icon: Menu },
    (can('media') || can('pages')) && { href: '/admin/media', label: 'Upload media', icon: Images },
    can('design') && { href: '/admin/theme', label: 'Theme settings', icon: Palette },
  ].filter(Boolean) as { href: string; label: string; icon: LucideIcon }[]

  let recent: Pick<AuditLogEntry, 'id' | 'table_name' | 'action' | 'changed_by_email' | 'changed_at'>[] = []
  if (isAdmin) {
    const insforge = await createInsForgeServerClient()
    const { data } = await insforge.database
      .from('content_audit_log')
      .select('id, table_name, action, changed_by_email, changed_at')
      .order('changed_at', { ascending: false })
      .limit(8)
    recent = data ?? []
  }

  const displayName = admin?.profile?.full_name || admin?.email || ''

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Welcome{displayName ? `, ${displayName.split(' ')[0]}` : ''}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Build and edit pages visually, or update site content below.</p>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Quick actions">
        {quick.map((q) => {
          const Icon = q.icon
          return (
            <Link key={q.label} href={q.href} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium transition hover:border-primary hover:text-primary">
              <Icon className="size-4" aria-hidden="true" /> {q.label}
            </Link>
          )
        })}
        <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium transition hover:border-primary hover:text-primary">
          <ExternalLink className="size-4" aria-hidden="true" /> View website
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Team members</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">{teamMembers.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Published projects</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">{projects.filter((p) => p.published).length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Partner logos</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">{partners.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Builder pages</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">{builderPages.length}</p>
        </div>
      </div>

      {visibleSections.length === 0 ? (
        <EmptyState title="No sections granted yet" body="Ask an admin to give you access to at least one section from Users & access." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleSections.map((s) => {
            const Icon = s.icon
            return (
              <Link key={s.href} href={s.href} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-5 transition hover:border-primary hover:shadow-sm">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-foreground">{s.label}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{s.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {isAdmin && (
        <AdminCard title="Recent activity" description="The latest content changes across the site.">
          {recent.length === 0 ? (
            <EmptyState title="No changes yet" />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {recent.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initials(entry.changed_by_email ?? 'System')}
                  </span>
                  <span className="flex-1 text-foreground">
                    <span className="font-medium">{entry.changed_by_email ?? 'system'}</span>{' '}
                    <span className={`mx-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${ACTION_STYLES[entry.action] ?? 'bg-muted text-muted-foreground'}`}>
                      {entry.action}d
                    </span>{' '}
                    <span className="font-mono text-xs text-muted-foreground">{entry.table_name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(entry.changed_at)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/activity" className="mt-4 inline-block text-sm font-medium text-primary">
            View full activity log →
          </Link>
        </AdminCard>
      )}
    </div>
  )
}
