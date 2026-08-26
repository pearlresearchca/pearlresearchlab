import Link from 'next/link'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { AdminCard } from '@/components/admin/ui'
import type { AuditLogEntry } from '@/lib/cms/types'

const sections = [
  { href: '/admin/home', label: 'Home page', description: 'Hero, purpose statement, featured project, and calls to action.' },
  { href: '/admin/about', label: 'About page', description: 'Mission, vision, PEARL values, and partner logos.' },
  { href: '/admin/research', label: 'Research areas', description: 'The five research streams shown on Home and the Research page.' },
  { href: '/admin/projects', label: 'Projects', description: 'Project pages, their sections, and images.' },
  { href: '/admin/team', label: 'Team', description: 'Team member photos, roles, and bios.' },
  { href: '/admin/partners', label: 'Partner logos', description: 'Upload logos and control where each one appears.' },
  { href: '/admin/contact', label: 'Contact page', description: 'Contact copy, address, and hours.' },
]

export default async function AdminDashboard() {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database
    .from('content_audit_log')
    .select('id, table_name, action, changed_by_email, changed_at')
    .order('changed_at', { ascending: false })
    .limit(8)

  const recent = (data ?? []) as Pick<AuditLogEntry, 'id' | 'table_name' | 'action' | 'changed_by_email' | 'changed_at'>[]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Edit the PEARL website content and images below. Changes go live immediately.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="block rounded-lg border border-border bg-surface p-5 transition hover:border-primary hover:shadow-sm">
            <p className="font-semibold text-foreground">{s.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
          </Link>
        ))}
      </div>

      <AdminCard title="Recent activity" description="The latest content changes across the site.">
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No changes yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {recent.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-foreground">
                  <span className="font-medium capitalize">{entry.action}</span> on <span className="font-mono text-xs">{entry.table_name}</span>
                </span>
                <span className="text-muted-foreground">
                  {entry.changed_by_email ?? 'system'} · {new Date(entry.changed_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/activity" className="mt-4 inline-block text-sm font-medium text-primary">
          View full activity log →
        </Link>
      </AdminCard>
    </div>
  )
}
