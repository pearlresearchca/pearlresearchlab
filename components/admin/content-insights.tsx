'use client'

import { useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { LucideIcon } from 'lucide-react'

// Analytics for blog posts and job postings: KPI tiles, a daily trend, a
// ranking of items and a breakdown donut. Data is aggregated on the server.

const BLUE = '#4361ee'
const TEAL = '#14b8a6'
const PALETTE = ['#4361ee', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9', '#84cc16', '#94a3b8']
const tooltipStyle = { fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 8px 24px -12px rgba(15,23,42,.25)' }
const tick = { fontSize: 11, fill: '#64748b' }

export type TrendPoint = { date: string; label: string; primary: number; secondary?: number }
export type Ranked = { label: string; value: number; secondary?: number }
export type Kpi = { label: string; value: string; detail?: string; icon: LucideIcon; tone?: 'blue' | 'teal' | 'amber' | 'violet' }

const TONES = { blue: 'bg-primary/10 text-primary', teal: 'bg-teal-500/10 text-teal-600', amber: 'bg-amber-500/10 text-amber-600', violet: 'bg-violet-500/10 text-violet-600' }

export function KpiGrid({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4" data-tour="insights">
      {items.map((k) => {
        const Icon = k.icon
        return (
          <div key={k.label} className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(15,23,42,.04)]">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] font-medium text-muted-foreground">{k.label}</p>
              <span className={`flex size-9 items-center justify-center rounded-xl ${TONES[k.tone ?? 'blue']}`}>
                <Icon className="size-[18px]" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">{k.value}</p>
              {k.detail && <p className="mt-1 text-xs text-muted-foreground">{k.detail}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Panel({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,.04)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="px-3 pb-3 pt-4">{children}</div>
    </section>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">{text}</div>
}

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
]

// Daily trend with a 7 / 30 / 90-day switch (data covers 90 days).
export function TrendPanel({ title, data, primaryLabel, secondaryLabel, empty }: { title: string; data: TrendPoint[]; primaryLabel: string; secondaryLabel?: string; empty: string }) {
  const [days, setDays] = useState(30)
  const shown = data.slice(-days)
  const total = shown.reduce((s, d) => s + d.primary + (d.secondary ?? 0), 0)
  return (
    <Panel
      title={title}
      subtitle={`Last ${days} days`}
      action={
        <div className="flex rounded-lg bg-muted p-0.5" role="radiogroup" aria-label="Date range">
          {RANGES.map((r) => (
            <button key={r.days} type="button" role="radio" aria-checked={days === r.days} onClick={() => setDays(r.days)} className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${days === r.days ? 'bg-surface text-primary shadow-sm' : 'text-slate-500 hover:text-foreground'}`}>
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      {total === 0 ? (
        <Empty text={empty} />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={shown} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ci-primary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BLUE} stopOpacity={0.25} />
                <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ci-secondary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={TEAL} stopOpacity={0.25} />
                <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} minTickGap={28} />
            <YAxis tick={tick} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#0f172a', fontWeight: 600 }} />
            {secondaryLabel && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />}
            <Area type="monotone" dataKey="primary" name={primaryLabel} stroke={BLUE} strokeWidth={2} fill="url(#ci-primary)" />
            {secondaryLabel && <Area type="monotone" dataKey="secondary" name={secondaryLabel} stroke={TEAL} strokeWidth={2} fill="url(#ci-secondary)" />}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Panel>
  )
}

// Horizontal bars ranking items (top posts by views, jobs by applications…).
export function RankingPanel({ title, subtitle, data, primaryLabel, secondaryLabel, empty }: { title: string; subtitle?: string; data: Ranked[]; primaryLabel: string; secondaryLabel?: string; empty: string }) {
  const rows = data.slice(0, 8)
  return (
    <Panel title={title} subtitle={subtitle}>
      {rows.every((r) => !r.value && !r.secondary) ? (
        <Empty text={empty} />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(180, rows.length * 40 + 40)}>
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="label" tick={tick} axisLine={false} tickLine={false} width={150} tickFormatter={(v: string) => (v.length > 22 ? v.slice(0, 21) + '…' : v)} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(67,97,238,.06)' }} />
            {secondaryLabel && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />}
            <Bar dataKey="value" name={primaryLabel} fill={BLUE} radius={[0, 6, 6, 0]} maxBarSize={18} />
            {secondaryLabel && <Bar dataKey="secondary" name={secondaryLabel} fill={TEAL} radius={[0, 6, 6, 0]} maxBarSize={18} />}
          </BarChart>
        </ResponsiveContainer>
      )}
    </Panel>
  )
}

export function BreakdownPanel({ title, subtitle, data, empty }: { title: string; subtitle?: string; data: Ranked[]; empty: string }) {
  const rows = data.filter((d) => d.value > 0)
  const total = rows.reduce((s, d) => s + d.value, 0)
  return (
    <Panel title={title} subtitle={subtitle}>
      {total === 0 ? (
        <Empty text={empty} />
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative size-[180px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rows} dataKey="value" nameKey="label" innerRadius={58} outerRadius={84} paddingAngle={2} stroke="none">
                  {rows.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold tabular-nums">{total}</span>
              <span className="text-[11px] text-muted-foreground">total</span>
            </div>
          </div>
          <ul className="flex w-full flex-col gap-2">
            {rows.map((d, i) => (
              <li key={d.label} className="flex items-center gap-2 text-sm">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{d.label}</span>
                <span className="font-semibold tabular-nums">{d.value}</span>
                <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">{Math.round((d.value / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}
