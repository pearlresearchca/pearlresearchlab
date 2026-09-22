export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffSec = Math.round((now - then) / 1000)

  if (diffSec < 5) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`

  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const AUDIT_TABLE_LABELS: Record<string, string> = {
  page_content: 'Page text',
  research_areas: 'Research area',
  about_values: 'PEARL value',
  partners: 'Partner logo',
  partner_placements: 'Partner placement',
  projects: 'Project',
  project_sections: 'Project section',
  team_members: 'Team member',
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  insert: 'Added',
  update: 'Updated',
  delete: 'Deleted',
}

export const AUDIT_ACTION_STYLES: Record<string, string> = {
  insert: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
}

export function auditSummary(row: Record<string, unknown> | null | undefined): string {
  if (!row) return ''
  for (const field of ['title', 'name', 'heading', 'key']) {
    if (typeof row[field] === 'string') return row[field] as string
  }
  return ''
}

// Stable in-page anchor for a CMS title, e.g. "Health equity & access" -> "health-equity-access".
export function anchorId(title: string): string {
  return title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
