import { redirect } from 'next/navigation'
import { ScrollText } from 'lucide-react'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { AdminCard, EmptyState } from '@/components/admin/ui'
import { initials, relativeTime } from '@/lib/cms/format'
import type { AuditLogEntry } from '@/lib/cms/types'

const TABLE_LABELS: Record<string, string> = {
  page_content: 'Page text',
  research_areas: 'Research area',
  about_values: 'PEARL value',
  partners: 'Partner logo',
  partner_placements: 'Partner placement',
  projects: 'Project',
  project_sections: 'Project section',
  team_members: 'Team member',
}

const ACTION_STYLES: Record<string, string> = {
  insert: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
}

function summarize(entry: AuditLogEntry): string {
  const row = entry.new_data ?? entry.old_data
  if (!row) return ''
  if (typeof row.title === 'string') return row.title
  if (typeof row.name === 'string') return row.name
  if (typeof row.heading === 'string') return row.heading
  if (typeof row.key === 'string') return row.key
  return ''
}

export default async function ActivityAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; table?: string }>
}) {
  const admin = await getCurrentAdmin()
  if (!admin || admin.profile?.role !== 'admin') redirect('/admin')

  const { page: pageParam, table } = await searchParams
  const page = Math.max(1, Number(pageParam ?? '1') || 1)
  const pageSize = 30
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const insforge = await createInsForgeServerClient()
  let query = insforge.database
    .from('content_audit_log')
    .select('id, table_name, record_id, action, changed_by, changed_by_email, old_data, new_data, changed_at', { count: 'exact' })
    .order('changed_at', { ascending: false })
    .range(from, to)

  if (table) query = query.eq('table_name', table)

  const { data, count } = await query
  const entries = (data ?? []) as AuditLogEntry[]
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ScrollText className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Activity log</h1>
          <p className="text-sm text-muted-foreground">Every content and image change on the site, and exactly who made it.</p>
        </div>
      </div>

      <AdminCard>
        <form method="get" className="mb-4 flex items-center gap-2 text-sm">
          <label htmlFor="table-filter" className="font-medium text-foreground">Filter:</label>
          <select
            id="table-filter"
            name="table"
            defaultValue={table ?? ''}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
          >
            <option value="">All sections</option>
            {Object.entries(TABLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button type="submit" className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">
            Apply
          </button>
        </form>

        {entries.length === 0 ? (
          <EmptyState title="No activity recorded" body="Changes will show up here as soon as someone edits content." />
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials(entry.changed_by_email ?? 'System')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    <span className="font-medium">{entry.changed_by_email ?? 'System'}</span>{' '}
                    <span className={`mx-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${ACTION_STYLES[entry.action] ?? 'bg-muted text-muted-foreground'}`}>
                      {entry.action}d
                    </span>{' '}
                    {TABLE_LABELS[entry.table_name] ?? entry.table_name}
                    {summarize(entry) && <span className="text-muted-foreground"> — {summarize(entry)}</span>}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground" title={new Date(entry.changed_at).toLocaleString()}>
                  {relativeTime(entry.changed_at)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-3">
            {page > 1 && <a href={`/admin/activity?page=${page - 1}${table ? `&table=${table}` : ''}`} className="font-medium text-primary">← Newer</a>}
            {page < totalPages && <a href={`/admin/activity?page=${page + 1}${table ? `&table=${table}` : ''}`} className="font-medium text-primary">Older →</a>}
          </div>
        </div>
      </AdminCard>
    </div>
  )
}
