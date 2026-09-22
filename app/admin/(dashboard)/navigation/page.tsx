import { Menu } from 'lucide-react'
import { NoSectionAccess } from '@/components/admin/no-access'
import { NavigationEditor } from '@/components/builder/navigation-editor'
import { hasAny, requireAdmin } from '@/lib/builder/admin-data'
import { getSiteConfig, listPages } from '@/lib/builder/queries'

export default async function NavigationPage() {
  const admin = await requireAdmin()
  if (!hasAny(admin.profile, ['design'])) return <NoSectionAccess label="Navigation" />
  const [config, pages] = await Promise.all([getSiteConfig(), listPages()])
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Menu className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Navigation</h1>
          <p className="text-sm text-muted-foreground">The menu at the top of every page. Drag items to reorder, or drag onto another item to make a dropdown.</p>
        </div>
      </div>
      <NavigationEditor initial={config.navigation.items} pages={pages.map((p) => ({ id: p.id, title: p.title, slug: p.slug, status: p.status }))} />
    </div>
  )
}
