'use client'

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'

// Small, dependency-free UI kit for the builder and the new admin screens.

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

export const inputClass =
  'w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60'

export function Btn({
  variant = 'default',
  size = 'md',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary' | 'danger' | 'ghost' | 'subtle'; size?: 'sm' | 'md' }) {
  const variants = {
    default: 'border border-border bg-surface text-foreground hover:bg-muted',
    primary: 'bg-primary text-white hover:bg-primary-dark border border-primary',
    danger: 'bg-red-600 text-white hover:bg-red-700 border border-red-600',
    ghost: 'text-foreground hover:bg-muted border border-transparent',
    subtle: 'bg-muted text-foreground hover:bg-border/60 border border-transparent',
  }
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        variants[variant],
        className
      )}
    />
  )
}

export function IconBtn({ label, active, className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      {...props}
      className={cx(
        'inline-flex size-8 items-center justify-center rounded-md text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-40 [&_svg]:size-4',
        active && 'bg-primary/10 text-primary',
        className
      )}
    >
      {children}
    </button>
  )
}

export function Label({ children, htmlFor, hint, extra }: { children: ReactNode; htmlFor?: string; hint?: ReactNode; extra?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
        {children}
      </label>
      {extra}
      {hint && <span className="sr-only">{hint}</span>}
    </div>
  )
}

export function FieldRow({ label, hint, htmlFor, extra, children }: { label: ReactNode; hint?: ReactNode; htmlFor?: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} extra={extra}>{label}</Label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function Segmented<T extends string>({ value, options, onChange, label, size = 'md' }: { value: T | undefined; options: { value: T; label: ReactNode; title?: string }[]; onChange: (v: T) => void; label?: string; size?: 'sm' | 'md' }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex w-full flex-wrap gap-0.5 rounded-md bg-muted p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex flex-1 items-center justify-center gap-1 rounded px-1.5 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&_svg]:size-3.5',
            size === 'sm' ? 'py-0.5 text-[11px]' : 'py-1 text-xs',
            value === o.value ? 'bg-surface text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; id?: string }) {
  const auto = useId()
  const inputId = id ?? auto
  return (
    <label htmlFor={inputId} className="flex cursor-pointer items-center justify-between gap-3 py-0.5 text-xs font-medium text-foreground">
      <span>{label}</span>
      <span className="relative inline-flex shrink-0">
        <input id={inputId} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="h-5 w-9 rounded-full bg-border transition peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40" />
        <span className="absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
      </span>
    </label>
  )
}

// Accessible modal built on the native <dialog> element (focus trapping,
// Escape to close and inert background come for free).
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-6xl' }
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={cx('m-auto w-[calc(100%-2rem)] rounded-xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-[1px]', widths[size])}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              <h2 id={titleId} className="text-base font-semibold">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
            <IconBtn label="Close" onClick={onClose}>
              <X />
            </IconBtn>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex items-center justify-end gap-2 border-t border-border bg-background/60 px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}

type ConfirmOptions = { title: string; body?: ReactNode; confirmLabel?: string; cancelLabel?: string; danger?: boolean }

const ConfirmContext = createContext<(opts: ConfirmOptions) => Promise<boolean>>(async () => false)

// `const confirm = useConfirm(); if (await confirm({...})) ...`
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null)
  const confirm = useCallback((opts: ConfirmOptions) => new Promise<boolean>((resolve) => setState({ ...opts, resolve })), [])
  const done = (v: boolean) => {
    state?.resolve(v)
    setState(null)
  }
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={!!state}
        onClose={() => done(false)}
        title={state?.title ?? ''}
        size="sm"
        footer={
          <>
            <Btn onClick={() => done(false)}>{state?.cancelLabel ?? 'Cancel'}</Btn>
            <Btn variant={state?.danger ? 'danger' : 'primary'} onClick={() => done(true)} autoFocus>
              {state?.confirmLabel ?? 'Confirm'}
            </Btn>
          </>
        }
      >
        {state?.body && <div className="text-sm text-muted-foreground">{state.body}</div>}
      </Dialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext)
}

export function Collapsible({ title, defaultOpen = true, children, extra }: { title: ReactNode; defaultOpen?: boolean; children: ReactNode; extra?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border">
      <div className="flex items-center justify-between gap-2 px-4">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex flex-1 items-center justify-between py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
          {title}
          <span aria-hidden="true" className={cx('text-base transition', open ? 'rotate-90' : '')}>›</span>
        </button>
        {extra}
      </div>
      {open && <div className="flex flex-col gap-3 px-4 pb-4">{children}</div>}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx('inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent', className)} />
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-md bg-muted', className)} />
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: 'bg-green-100 text-green-800',
    draft: 'bg-amber-100 text-amber-800',
    unpublished: 'bg-slate-200 text-slate-700',
    scheduled: 'bg-blue-100 text-blue-800',
    private: 'bg-purple-100 text-purple-800',
  }
  return <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize', map[status] ?? 'bg-muted text-muted-foreground')}>{status}</span>
}
