import { createInsForgeServerClient } from '@/lib/insforge/server'
import { AdminCard } from '@/components/admin/ui'
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
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam ?? '1') || 1)
  const pageSize = 40
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const insforge = await createInsForgeServerClient()
  const { data, count } = await insforge.database
    .from('content_audit_log')
    .select('id, table_name, record_id, action, changed_by, changed_by_email, old_data, new_data, changed_at', { count: 'exact' })
    .order('changed_at', { ascending: false })
    .range(from, to)

  const entries = (data ?? []) as AuditLogEntry[]
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Activity log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every content and image change, and who made it.</p>
      </div>

      <AdminCard>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-4">When</th>
              <th className="py-2 pr-4">Who</th>
              <th className="py-2 pr-4">Action</th>
              <th className="py-2 pr-4">Where</th>
              <th className="py-2">What</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-border/60">
                <td className="whitespace-nowrap py-2 pr-4 text-muted-foreground">{new Date(entry.changed_at).toLocaleString()}</td>
                <td className="py-2 pr-4 text-foreground">{entry.changed_by_email ?? 'system'}</td>
                <td className="py-2 pr-4 capitalize text-foreground">{entry.action}</td>
                <td className="py-2 pr-4 text-foreground">{TABLE_LABELS[entry.table_name] ?? entry.table_name}</td>
                <td className="py-2 text-muted-foreground">{summarize(entry)}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted-foreground">No activity recorded.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-3">
            {page > 1 && <a href={`/admin/activity?page=${page - 1}`} className="text-primary">← Newer</a>}
            {page < totalPages && <a href={`/admin/activity?page=${page + 1}`} className="text-primary">Older →</a>}
          </div>
        </div>
      </AdminCard>
    </div>
  )
}
