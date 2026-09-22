import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageFrame } from '@/components/page-frame'
import { PageBody } from '@/components/builder-render/render'
import { requireAdmin } from '@/lib/builder/admin-data'
import { getPageById, loadRenderData } from '@/lib/builder/queries'
import { sanitizeByType } from '@/lib/builder/sanitize'

export const metadata: Metadata = { title: 'Preview', robots: { index: false, follow: false } }

// The draft rendered exactly like the public site (same header, footer,
// theme and renderer), for the preview window.
export default async function PreviewFrame({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAdmin()
  const page = await getPageById(id)
  if (!page) notFound()
  const data = await loadRenderData([page.content])
  return (
    <PageFrame extraFonts={data.fonts}>
      <main>
        <PageBody doc={page.content} rc={{ data, pageId: page.id, html: sanitizeByType }} />
      </main>
    </PageFrame>
  )
}
