import { Menu } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { NoSectionAccess } from '@/components/admin/no-access'
import { NavigationEditor } from '@/components/builder/navigation-editor'
import { hasAny, requireAdmin } from '@/lib/builder/admin-data'
import { getSiteConfig, listPages } from '@/lib/builder/queries'

export default async function NavigationPage() {
  const admin = await requireAdmin()
  if (!hasAny(admin.profile, ['design'])) return <NoSectionAccess label="Navigation" />
  const [config, pages] = await Promise.all([getSiteConfig(), listPages()])
  return (
    <div className="flex flex-col">
      <PageHeader group="Website" title={'Navigation'} description={'The menu at the top of every page. Drag items to reorder, or drag onto another item to make a dropdown.'} icon={<Menu />} />
      <NavigationEditor initial={config.navigation.items} pages={pages.map((p) => ({ id: p.id, title: p.title, slug: p.slug, status: p.status }))} version={config.versions.navigation ?? 0} />
    </div>
  )
}
