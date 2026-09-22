import type { Metadata } from 'next'
import { AboutPage } from '@/components/pearl-pages'
import { livePageMetadata, renderLivePage } from '@/lib/builder/public'

const fallbackMetadata: Metadata = {
  title: 'About',
  description: 'PEARL is an interdisciplinary research lab dedicated to advancing health equity through collaborative, community-engaged, and policy-relevant research.',
  alternates: { canonical: '/about' },
}

// Shows the page-builder version once it's published; until then the
// original page keeps rendering from its content tables.
export function generateMetadata() {
  return livePageMetadata({ legacyKey: 'about' }, fallbackMetadata)
}

export default async function Page() {
  return (await renderLivePage({ legacyKey: 'about' })) ?? <AboutPage />
}
