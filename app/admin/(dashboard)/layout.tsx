import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Toaster } from 'sonner'
import { ExternalLink } from 'lucide-react'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { signOutAction } from '../auth-actions'
import { AdminSidebar } from '@/components/admin/sidebar'
import { SubmitButton } from '@/components/admin/submit-button'
import { RoleBadge } from '@/components/admin/ui'
import { initials } from '@/lib/cms/format'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')
  if (!admin.profile) redirect('/admin/no-access')

  const { role, sections } = admin.profile
  const displayName = admin.profile.full_name || admin.email

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors closeButton />
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-3.5 backdrop-blur sm:px-6">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold tracking-wide text-white">P</span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-wide text-primary-dark">PEARL</span>
            <span className="text-[11px] text-muted-foreground">Admin</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" target="_blank" className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary sm:flex">
            View live site <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
          <div className="flex items-center gap-2.5 border-l border-border pl-4">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials(displayName)}
            </span>
            <div className="text-sm leading-tight">
              <p className="font-medium text-foreground">{displayName}</p>
              <RoleBadge role={role} />
            </div>
          </div>
          <form action={signOutAction}>
            <SubmitButton variant="ghost" pendingText="Signing out…">
              Sign out
            </SubmitButton>
          </form>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:gap-8 md:py-8">
        <aside className="shrink-0 md:w-56">
          <AdminSidebar role={role} sections={sections} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
