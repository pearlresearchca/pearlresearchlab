import { Images } from 'lucide-react'
import { NoSectionAccess } from '@/components/admin/no-access'
import { MediaLibrary } from '@/components/builder/media-library'
import { hasAny, requireAdmin } from '@/lib/builder/admin-data'

export default async function MediaPage() {
  const admin = await requireAdmin()
  if (!hasAny(admin.profile, ['media', 'pages'])) return <NoSectionAccess label="the Media library" />
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Images className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Media library</h1>
          <p className="text-sm text-muted-foreground">All images and videos used on the website. Upload once, use anywhere.</p>
        </div>
      </div>
      <MediaLibrary canManage={hasAny(admin.profile, ['media'])} />
    </div>
  )
}
