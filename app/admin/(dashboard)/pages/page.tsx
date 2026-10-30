import { FileStack } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { NoSectionAccess } from '@/components/admin/no-access'
import { PagesManager } from '@/components/builder/pages-manager'
import { SITE_URL, hasAny, requireAdmin } from '@/lib/builder/admin-data'
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
  if (!hasAny(admin.profile, ['pages', 'seo', 'home', 'about', 'research', 'projects', 'team', 'contact'])) return <NoSectionAccess label="Pages" />

  const [pages, config, templates, users] = await Promise.all([listPages(), getSiteConfig(), listTemplates(), getUserDirectory()])
  const nav = navPageIds(config.navigation.items)

  return (
    <div className="flex flex-col">
      <PageHeader group="Website" title={'Pages'} description={'Create, design and publish the pages of your website.'} icon={<FileStack />} />
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
      />
    </div>
  )
}
