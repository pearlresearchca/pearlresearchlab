import type { Metadata } from 'next'
import { ResearchPage } from '@/components/pearl-pages'
import { livePageMetadata, renderLivePage } from '@/lib/builder/public'

const fallbackMetadata: Metadata = {
  title: 'Research',
  description: "Our work is grounded in the belief that improving health requires action across the social, economic, environmental, and policy systems that influence people's lives.",
  alternates: { canonical: '/research' },
}

// Shows the page-builder version once it's published; until then the
// original page keeps rendering from its content tables.
export function generateMetadata() {
  return livePageMetadata({ legacyKey: 'research' }, fallbackMetadata)
}

export default async function Page() {
  return (await renderLivePage({ legacyKey: 'research' })) ?? <ResearchPage />
}
