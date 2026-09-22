import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
import { relativeTime } from '@/lib/cms/format'
import { SECTION_GROUPS, SECTIONS } from '@/lib/cms/permissions'
import type { UserDirectory } from '@/lib/cms/types'

export function AdminCard({
  title,
  description,
  icon,
  action,
  children,
}: {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(15,23,42,.04),0_4px_16px_-8px_rgba(15,23,42,.08)]">
      {(title || action) && (
        <div className="-mx-6 -mt-6 mb-5 flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="flex items-start gap-3">
            {icon && <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>}
            <div>
              {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      {!title && description && <p className="mb-4 text-sm text-muted-foreground">{description}</p>}
      <div className={!title && description ? 'mt-5' : ''}>{children}</div>
    </div>
  )
}

export function Field({ label, htmlFor, hint, children, className = '' }: { label: string; htmlFor?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs leading-snug text-muted-foreground">{hint}</p>}
    </div>
  )
}

const controlClass =
  'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/15'

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={twMerge(controlClass, props.className)} />
}

// Grows with its content (so long text is never cut off inside a small
// scroll box), starting at `rows` lines and capped at most of the screen.
export function TextArea({ rows = 4, style, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      {...props}
      style={{ minHeight: `calc(${rows} * 1.625em + 1.25rem + 2px)`, ...style }}
      className={twMerge(controlClass, 'max-h-[70vh] resize-y leading-relaxed [field-sizing:content]', props.className)}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={twMerge(controlClass, 'cursor-pointer', props.className)} />
}

// Access toggles grouped by area, compact enough to scan at a glance.
export function SectionCheckboxes({ name = 'sections', defaultValue = [] }: { name?: string; defaultValue?: string[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {SECTION_GROUPS.map((g) => (
        <fieldset key={g.key} className="rounded-xl border border-border bg-background p-3">
          <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">{g.label}</legend>
          <p className="mb-2 px-1 text-[11px] leading-snug text-muted-foreground">{g.description}</p>
          <div className="flex flex-col">
            {SECTIONS.filter((s) => s.group === g.key).map((s) => (
              <label key={s.key} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-1.5 py-1.5 text-[13px] text-foreground hover:bg-surface">
                {s.label}
                <input type="checkbox" name={name} value={s.key} defaultChecked={defaultValue.includes(s.key)} className="switch" />
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  )
}

// Read-only summary of someone's access, as small chips per group.
export function AccessSummary({ role, sections }: { role: 'admin' | 'editor'; sections: string[] }) {
  if (role === 'admin') return <p className="rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">Full access to everything, including managing users.</p>
  if (sections.length === 0) return <p className="text-sm text-muted-foreground">No access yet.</p>
  return (
    <div className="flex flex-col gap-2">
      {SECTION_GROUPS.map((g) => {
        const granted = SECTIONS.filter((s) => s.group === g.key && sections.includes(s.key))
        if (!granted.length) return null
        return (
          <div key={g.key} className="flex flex-wrap items-center gap-1.5">
            <span className="w-28 shrink-0 text-xs font-semibold text-slate-500">{g.label}</span>
            {granted.map((s) => (
              <span key={s.key} className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/15">{s.label}</span>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export function LastEdited({ at, by, users }: { at?: string | null; by?: string | null; users: UserDirectory }) {
  if (!at) return null
  const who = by ? users[by]?.full_name || users[by]?.email : null
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="inline-block size-1.5 rounded-full bg-accent" aria-hidden="true" />
      Last edited {who ? <>by <span className="font-medium text-foreground">{who}</span></> : ''} · {relativeTime(at)}
    </p>
  )
}

export function RoleBadge({ role }: { role: 'admin' | 'editor' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      {role === 'admin' ? 'Admin' : 'Editor'}
    </span>
  )
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background/60 px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {body && <p className="mt-1 text-sm text-muted-foreground">{body}</p>}
    </div>
  )
}
