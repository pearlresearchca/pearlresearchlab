import { redirect } from 'next/navigation'
import { Toaster } from 'sonner'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { signOutAction } from '../auth-actions'
import { AdminShell } from '@/components/admin/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')
  if (!admin.profile) redirect('/admin/no-access')

  const { role, sections } = admin.profile
  const displayName = admin.profile.full_name || admin.email

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <AdminShell role={role} sections={sections} displayName={displayName} email={admin.email} signOut={signOutAction}>
        {children}
      </AdminShell>
    </>
  )
}
