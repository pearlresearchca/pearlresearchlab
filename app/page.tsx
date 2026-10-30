import { notFound } from 'next/navigation'
import { livePageMetadata, renderLivePage } from '@/lib/builder/public'

// The homepage is the page-builder page whose URL is "/" (empty slug).

export function generateMetadata() {
  return livePageMetadata({ slug: '' })
}

export default async function HomePage() {
  return (await renderLivePage({ slug: '' })) ?? notFound()
}
