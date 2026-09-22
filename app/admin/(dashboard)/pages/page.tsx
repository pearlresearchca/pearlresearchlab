import { FileStack } from 'lucide-react'
import { NoSectionAccess } from '@/components/admin/no-access'
import { PagesManager } from '@/components/builder/pages-manager'
import { SITE_URL, hasAny, requireAdmin } from '@/lib/builder/admin-data'
import { LEGACY_PAGES } from '@/lib/builder/defaults'
import { getSiteConfig, listPages, listTemplates } from '@/lib/builder/queries'
import { getUserDirectory } from '@/lib/cms/queries'
import type { NavItem } from '@/lib/builder/types'

function navPageIds(items: NavItem[], out = new Set<string>(), urls = new Set<string>()) {
  for (const i of items) {
    if (i.kind === 'page' && i.pageId) out.add(i.pageId)
    if (i.url) urls.add(i.url)
    if (i.children) navPageIds(i.children, out, urls)
  }
  return { ids: out, urls }
}

export default async function PagesAdminPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const { new: openNew } = await searchParams
  const admin = await requireAdmin()
  const legacyAccess = LEGACY_PAGES.filter((p) => hasAny(admin.profile, [p.key as 'home']))
  if (!hasAny(admin.profile, ['pages', 'seo']) && legacyAccess.length === 0) return <NoSectionAccess label="Pages" />

  const [pages, config, templates, users] = await Promise.all([listPages(), getSiteConfig(), listTemplates(), getUserDirectory()])
  const nav = navPageIds(config.navigation.items)
  const imported = new Set(pages.map((p) => p.legacy_key).filter(Boolean))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileStack className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pages</h1>
          <p className="text-sm text-muted-foreground">Create, design and publish the pages of your website.</p>
        </div>
      </div>
      <PagesManager
        pages={pages.map((p) => ({
          ...p,
          inNav: nav.ids.has(p.id) || nav.urls.has('/' + p.slug),
          updatedByName: p.updated_by ? users[p.updated_by]?.full_name || users[p.updated_by]?.email || null : null,
          publishedByName: p.published_by ? users[p.published_by]?.full_name || users[p.published_by]?.email || null : null,
        }))}
        templates={templates}
        theme={config.theme}
        siteUrl={SITE_URL}
        canCreate={hasAny(admin.profile, ['pages'])}
        openCreate={openNew === '1'}
        canNav={hasAny(admin.profile, ['design'])}
        legacyToImport={legacyAccess.filter((p) => !imported.has(p.key)).map((p) => ({ key: p.key, title: p.title, slug: p.slug }))}
      />
    </div>
  )
}
