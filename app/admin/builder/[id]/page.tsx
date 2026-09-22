import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Builder } from '@/components/builder/builder'
import { NoSectionAccess } from '@/components/admin/no-access'
import { SITE_URL, hasAny, loadBuilderContext, requireAdmin } from '@/lib/builder/admin-data'
import { getPageById } from '@/lib/builder/queries'
import type { SectionKey } from '@/lib/cms/permissions'

export const metadata: Metadata = { title: 'Page builder', robots: { index: false } }

export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireAdmin()
  const page = await getPageById(id)
  if (!page) notFound()

  const pageAccess: SectionKey[] = page.legacy_key ? ['pages', page.legacy_key as SectionKey] : ['pages']
  const canEdit = hasAny(admin.profile, pageAccess)
  const seoOnly = !canEdit && hasAny(admin.profile, ['seo'])
  if (!canEdit && !seoOnly) {
    return (
      <div className="mx-auto max-w-xl p-10">
        <NoSectionAccess label="this page" />
      </div>
    )
  }

  const ctx = await loadBuilderContext([page.content])
  return (
    <Builder
      mode="page"
      page={{
        id: page.id,
        title: page.title,
        slug: page.slug,
        status: page.status,
        legacy_key: page.legacy_key,
        parent_id: page.parent_id,
        seo: page.seo ?? {},
        featured_image: page.featured_image,
        published_at: page.published_at,
        version: page.version,
        updated_at: page.updated_at,
      }}
      initialDoc={page.content}
      siteUrl={SITE_URL}
      canPublish={canEdit}
      seoOnly={seoOnly}
      canDesign={hasAny(admin.profile, ['design'])}

      {...ctx}
    />
  )
}
