import type { LucideIcon } from 'lucide-react'

// Headline numbers for the analytics screens. A server component: icons are
// component functions, which can't be passed to client components.

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
