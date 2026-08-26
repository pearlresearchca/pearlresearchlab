'use client'

import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DayPoint, TopItem } from '@/lib/analytics/ga4'

const PRIMARY = '#146b68'
const ACCENT = '#d9b84d'
const PALETTE = ['#146b68', '#d9b84d', '#5b8a87', '#c98a3a', '#8fb0ad', '#9c6b2e', '#3f6664', '#e3c98a']

export function TrafficChart({ data }: { data: DayPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.28} />
            <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="us" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={ACCENT} stopOpacity={0.35} />
            <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }}
          labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
        />
        <Area type="monotone" dataKey="pageViews" name="Page views" stroke={PRIMARY} strokeWidth={2} fill="url(#pv)" />
        <Area type="monotone" dataKey="users" name="Users" stroke={ACCENT} strokeWidth={2} fill="url(#us)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function DonutChart({ data }: { data: TopItem[] }) {
  if (data.length === 0) {
    return <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">No data yet</div>
  }
  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius={48} outerRadius={80} paddingAngle={2} strokeWidth={0}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex flex-col gap-1.5 text-xs">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="text-foreground">{d.label}</span>
            <span className="text-muted-foreground">{d.value.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function formatSeconds(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`
}

export function BarList({ data, unit = 'count' }: { data: TopItem[]; unit?: 'count' | 'duration' }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No data yet</p>
  }
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <ul className="flex flex-col gap-3">
      {data.map((d) => (
        <li key={d.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-mono text-xs text-foreground">{d.label}</span>
            <span className="shrink-0 font-semibold text-foreground">{unit === 'duration' ? formatSeconds(d.value) : d.value.toLocaleString()}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-muted">
            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.max((d.value / max) * 100, 3)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
