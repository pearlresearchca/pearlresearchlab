import { redirect } from 'next/navigation'
import { UserRound } from 'lucide-react'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { PageHeader } from '@/components/admin/page-header'
import { ProfileForm } from '@/components/admin/profile-form'

export default async function ProfilePage() {
  const admin = await getCurrentAdmin()
  if (!admin?.profile) redirect('/admin/login')

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader group="Account" title="My profile" description="Your name and contact details. Your name appears in the activity log next to the changes you make." icon={<UserRound />} />
      <ProfileForm profile={admin.profile} />
    </div>
  )
}
