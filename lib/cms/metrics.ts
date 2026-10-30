import type { DailyMetric } from './types'

// Turns daily counters into chart-ready series (UTC days, oldest first).
export function dailySeries(metrics: DailyMetric[], days: number, pick: (m: DailyMetric) => [number, number?]) {
  const start = new Date(Date.now() - (days - 1) * 86_400_000)
  start.setUTCHours(0, 0, 0, 0)
  const points = Array.from({ length: days }, (_, i) => {
    const d = new Date(start.getTime() + i * 86_400_000)
    return { date: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }), primary: 0, secondary: 0 }
  })
  const byDate = new Map(points.map((p) => [p.date, p]))
  for (const m of metrics) {
    const p = byDate.get(m.day.slice(0, 10))
    if (!p) continue
    const [a, b] = pick(m)
    p.primary += a
    p.secondary += b ?? 0
  }
  return points
}

export function totalsByItem(metrics: DailyMetric[], sinceDays?: number) {
  const since = sinceDays ? new Date(Date.now() - sinceDays * 86_400_000).toISOString().slice(0, 10) : ''
  const totals = new Map<string, { views: number; applications: number }>()
  for (const m of metrics) {
    if (since && m.day < since) continue
    const t = totals.get(m.item_id) ?? { views: 0, applications: 0 }
    t.views += m.views
    t.applications += m.applications
    totals.set(m.item_id, t)
  }
  return totals
}

export const fmt = (n: number) => n.toLocaleString('en-US')
export const pct = (part: number, whole: number) => (whole ? `${((part / whole) * 100).toFixed(1)}%` : '—')
