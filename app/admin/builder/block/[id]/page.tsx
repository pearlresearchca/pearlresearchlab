import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Builder } from '@/components/builder/builder'
import { NoSectionAccess } from '@/components/admin/no-access'
import { SITE_URL, hasAny, loadBuilderContext, requireAdmin } from '@/lib/builder/admin-data'
import { makeNode } from '@/lib/builder/blocks'
import { getReusableBlock } from '@/lib/builder/queries'
import type { PageDoc } from '@/lib/builder/types'

export const metadata: Metadata = { title: 'Edit reusable block', robots: { index: false } }

// Reusable / global blocks are edited in the same builder. Blocks that aren't
// sections are shown inside a temporary section and unwrapped on save.
export default async function BlockBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireAdmin()
  if (!hasAny(admin.profile, ['pages'])) {
    return (
      <div className="mx-auto max-w-xl p-10">
        <NoSectionAccess label="reusable blocks" />
      </div>
    )
  }
  const block = await getReusableBlock(id)
  if (!block) notFound()

  const wrapped = block.block.type !== 'section'
  const doc: PageDoc = { version: 1, sections: [wrapped ? makeNode('section', { children: [block.block], props: { label: 'Preview wrapper (not saved)' } }) : block.block] }
  const ctx = await loadBuilderContext([doc])

  return (
    <Builder
      mode="block"
      block={{ id: block.id, name: block.name, is_global: block.is_global, updated_at: block.updated_at, wrapped }}
      initialDoc={doc}
      siteUrl={SITE_URL}
      canPublish={false}
      seoOnly={false}
      {...ctx}
    />
  )
}
