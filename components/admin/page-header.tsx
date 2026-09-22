import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

// Title bar used at the top of admin screens: breadcrumb, icon, title,
// description and optional actions on the right.
export function PageHeader({ title, description, icon, group, actions }: { title: string; description?: string; icon?: ReactNode; group?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-xs font-medium text-slate-500">
          <Link href="/admin" className="hover:text-primary">Home</Link>
          {group && (
            <>
              <ChevronRight className="size-3.5" aria-hidden="true" />
              <span>{group}</span>
            </>
          )}
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <span className="text-foreground" aria-current="page">{title}</span>
        </nav>
        <div className="flex items-center gap-3">
          {icon && <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-400 text-white shadow-lg shadow-primary/25 [&_svg]:size-5">{icon}</span>}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
