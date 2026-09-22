'use client'

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// Admin palette (matches the .admin-ui tokens in app/builder.css).
const BLUE = '#4361ee'
const TEAL = '#14b8a6'
const AMBER = '#f59e0b'
const SLATE = '#94a3b8'
const VIOLET = '#8b5cf6'

const tooltipStyle = { fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 8px 24px -12px rgba(15,23,42,.25)' }
const tick = { fontSize: 11, fill: '#64748b' }

export type ActivityPoint = { date: string; label: string; edits: number; messages: number }

export function ActivityChart({ data, showMessages }: { data: ActivityPoint[]; showMessages: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="dash-edits" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BLUE} stopOpacity={0.25} />
            <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="dash-msgs" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TEAL} stopOpacity={0.25} />
            <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} minTickGap={28} />
        <YAxis tick={tick} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#0f172a', fontWeight: 600 }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Area type="monotone" dataKey="edits" name="Content changes" stroke={BLUE} strokeWidth={2} fill="url(#dash-edits)" />
        {showMessages && <Area type="monotone" dataKey="messages" name="Form messages" stroke={TEAL} strokeWidth={2} fill="url(#dash-msgs)" />}
      </AreaChart>
    </ResponsiveContainer>
  )
}

const STATUS_COLORS: Record<string, string> = { Published: TEAL, Draft: AMBER, Scheduled: BLUE, Private: VIOLET, Unpublished: SLATE }

export function StatusDonut({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((n, d) => n + d.value, 0)
  if (total === 0) return <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No pages yet</div>
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row xl:flex-col 2xl:flex-row">
      <div className="relative size-[168px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={56} outerRadius={80} paddingAngle={data.length > 1 ? 3 : 0} strokeWidth={0}>
              {data.map((d) => (
                <Cell key={d.label} fill={STATUS_COLORS[d.label] ?? SLATE} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-foreground">{total}</span>
          <span className="text-[11px] text-muted-foreground">pages</span>
        </div>
      </div>
      <ul className="flex w-full flex-col gap-2 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: STATUS_COLORS[d.label] ?? SLATE }} />
            <span className="flex-1 text-foreground">{d.label}</span>
            <span className="font-semibold text-foreground">{d.value}</span>
            <span className="w-10 text-right text-xs text-muted-foreground">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ContentBars({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap={10}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey="label" tick={{ ...tick, fill: '#334155' }} axisLine={false} tickLine={false} width={110} />
        <Tooltip cursor={{ fill: 'rgba(67,97,238,.06)' }} contentStyle={tooltipStyle} />
        <Bar dataKey="value" name="Items" radius={[0, 6, 6, 0]} fill={BLUE} label={{ position: 'right', fontSize: 11, fill: '#475569' }} />
      </BarChart>
    </ResponsiveContainer>
  )
}
