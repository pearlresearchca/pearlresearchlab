import { redirect } from 'next/navigation'
import { Toaster } from 'sonner'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { signOutAction } from '../auth-actions'
import { AdminShell } from '@/components/admin/sidebar'
import { getSiteConfig } from '@/lib/builder/queries'
import { ProfileForm } from '@/components/admin/profile-form'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')
  if (!admin.profile) redirect('/admin/no-access')

  const { role, sections } = admin.profile
  const displayName = admin.profile.full_name || admin.email
  // The site logo brands the admin too; fall back to a monogram if unavailable.
  const logoUrl = await getSiteConfig().then((c) => c.site.logoUrl).catch(() => undefined)

  // First sign-in: everyone sets up their name and contact details before
  // using the admin, so the activity log shows real names.
  if (!admin.profile.profile_completed_at) {
    return (
      <div className="admin-ui min-h-screen bg-background px-4 py-10 sm:py-16">
        <Toaster position="top-right" richColors closeButton />
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="PEARL" className="h-9 w-auto" />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">P</span>
            )}
            <form action={signOutAction}>
              <button type="submit" className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign out</button>
            </form>
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Step 1 of 1</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Welcome! Let’s set up your profile</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Your name is shown to other admins and next to every change you make. You can edit these details any time from <span className="font-medium text-foreground">My profile</span>.</p>
          </div>
          <ProfileForm profile={admin.profile} onboarding />
        </div>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <AdminShell role={role} sections={sections} displayName={displayName} email={admin.email} signOut={signOutAction} logoUrl={logoUrl}>
        {children}
      </AdminShell>
    </>
  )
}
