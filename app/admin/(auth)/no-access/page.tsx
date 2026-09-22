import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { signOutAction } from '../../auth-actions'
import { SubmitButton } from '@/components/admin/submit-button'

export default async function NoAccessPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')
  if (admin.profile) redirect('/admin')

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">PEARL Admin</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">No access yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account ({admin.email}) isn&apos;t connected to the PEARL admin panel yet. Ask an existing admin to add you from Users &amp; access.
        </p>
        <form action={signOutAction} className="mt-6">
          <SubmitButton variant="ghost" pendingText="Signing out…">Sign out</SubmitButton>
        </form>
      </div>
    </div>
  )
}
