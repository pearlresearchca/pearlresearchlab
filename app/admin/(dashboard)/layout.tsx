import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { signOutAction } from '../auth-actions'
import { AdminSidebar } from '@/components/admin/sidebar'
import { SubmitButton } from '@/components/admin/submit-button'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')
  if (!admin.profile) redirect('/admin/no-access')

  const isAdmin = admin.profile.role === 'admin'

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <Link href="/admin" className="flex items-baseline gap-2">
          <span className="text-sm font-bold tracking-widest text-primary-dark">PEARL</span>
          <span className="text-xs text-muted-foreground">Admin</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <p className="font-medium text-foreground">{admin.profile?.full_name || admin.email}</p>
            <p className="text-xs capitalize text-muted-foreground">{admin.profile?.role ?? 'editor'}</p>
          </div>
          <form action={signOutAction}>
            <SubmitButton variant="ghost" pendingText="Signing out…">
              Sign out
            </SubmitButton>
          </form>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        <aside className="w-56 shrink-0">
          <AdminSidebar isAdmin={isAdmin} />
          <div className="mt-6 border-t border-border pt-4">
            <Link href="/" className="text-xs font-medium text-muted-foreground hover:text-primary">
              ← View live site
            </Link>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
