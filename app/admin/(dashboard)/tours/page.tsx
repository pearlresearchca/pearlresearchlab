import { Compass } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { ToursList } from '@/components/admin/tours-list'
import { hasAny, requireAdmin } from '@/lib/builder/admin-data'
import { listPages } from '@/lib/builder/queries'

export const metadata = { title: 'Guided tours' }

export default async function ToursPage() {
  const admin = await requireAdmin()
  // Builder tours open the homepage (nothing is changed or saved by a tour).
  const pages = hasAny(admin.profile, ['pages', 'home']) ? await listPages().catch(() => []) : []
  const home = pages.find((p) => p.slug === '')

  return (
    <div className="flex flex-col">
      <PageHeader group="Help" title="Guided tours" description="Pick a topic and we’ll walk you through it step by step, right on the screen it’s about." icon={<Compass />} />
      <ToursList builderHref={home ? `/admin/builder/${home.id}` : null} />
    </div>
  )
}
