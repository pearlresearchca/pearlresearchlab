import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { livePageMetadata, renderLivePage } from '@/lib/builder/public'
import { getRedirect } from '@/lib/builder/queries'

// Every page-builder page except the homepage (app/page.tsx) is served from here.

type Props = { params: Promise<{ slug: string[] }> }

function toSlug(parts: string[]): string {
  return parts.map((p) => decodeURIComponent(p).toLowerCase()).join('/')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return livePageMetadata({ slug: toSlug(slug) }, { title: 'Page not found' })
}

export default async function BuilderRoute({ params }: Props) {
  const { slug } = await params
  const path = toSlug(slug)
  const page = await renderLivePage({ slug: path })
  if (page) return page

  // Old URLs of renamed pages redirect to the new URL.
  const to = await getRedirect('/' + path)
  if (to) permanentRedirect(to)
  notFound()
}
