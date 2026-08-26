import { Lock } from 'lucide-react'

export function NoSectionAccess({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Lock className="size-5" aria-hidden="true" />
      </div>
      <div>
        <p className="font-semibold text-foreground">No access to {label}</p>
        <p className="mt-1 text-sm text-muted-foreground">Ask an admin to grant you this section from Users &amp; access.</p>
      </div>
    </div>
  )
}
