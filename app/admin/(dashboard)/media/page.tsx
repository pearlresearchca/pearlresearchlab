import { Images } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { NoSectionAccess } from '@/components/admin/no-access'
import { MediaLibrary } from '@/components/builder/media-library'
import { hasAny, requireAdmin } from '@/lib/builder/admin-data'

export default async function MediaPage() {
  const admin = await requireAdmin()
  if (!hasAny(admin.profile, ['media', 'pages'])) return <NoSectionAccess label="the Media library" />
  return (
    <div className="flex flex-col">
      <PageHeader group="Website" title={'Media library'} description={'All images and videos used on the website. Upload once, use anywhere.'} icon={<Images />} />
      <MediaLibrary canManage={hasAny(admin.profile, ['media'])} />
    </div>
  )
}
