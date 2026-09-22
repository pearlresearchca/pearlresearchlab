import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PreviewShell } from '@/components/builder/preview-shell'
import { requireAdmin } from '@/lib/builder/admin-data'
import { getPageById } from '@/lib/builder/queries'

export const metadata: Metadata = { title: 'Preview', robots: { index: false, follow: false } }

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAdmin()
  const page = await getPageById(id)
  if (!page) notFound()
  return <PreviewShell id={page.id} title={page.title} slug={page.slug} status={page.status} />
}
