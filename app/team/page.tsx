import type { Metadata } from 'next'
import { TeamPage } from '@/components/pearl-pages'
import { livePageMetadata, renderLivePage } from '@/lib/builder/public'

const fallbackMetadata: Metadata = {
  title: 'Team',
  description: 'Meet the researchers, students, practitioners, and community partners working across disciplines and lived experiences at PEARL.',
  alternates: { canonical: '/team' },
}

// Shows the page-builder version once it's published; until then the
// original page keeps rendering from its content tables.
export function generateMetadata() {
  return livePageMetadata({ legacyKey: 'team' }, fallbackMetadata)
}

export default async function Page() {
  return (await renderLivePage({ legacyKey: 'team' })) ?? <TeamPage />
}
