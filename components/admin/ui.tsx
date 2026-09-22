import type { ReactNode } from 'react'
import { relativeTime } from '@/lib/cms/format'
import { SECTIONS } from '@/lib/cms/permissions'
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
  return <input {...props} className={`${controlClass} ${props.className ?? ''}`} />
}

export function TextArea({ rows = 4, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      {...props}
      className={`${controlClass} resize-y leading-relaxed ${props.className ?? ''}`}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${controlClass} cursor-pointer ${props.className ?? ''}`} />
}

export function SectionCheckboxes({ name = 'sections', defaultValue = [] }: { name?: string; defaultValue?: string[] }) {
  return (
    <div className="grid gap-1 rounded-xl border border-border bg-background p-2 sm:grid-cols-2">
      {SECTIONS.map((s) => (
        <label key={s.key} className="flex cursor-pointer flex-row-reverse items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface">
          <input type="checkbox" name={name} value={s.key} defaultChecked={defaultValue.includes(s.key)} className="switch" />
          {s.label}
        </label>
      ))}
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
