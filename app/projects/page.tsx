import type { Metadata } from 'next'
import { ProjectsPage } from '@/components/pearl-pages'
import { livePageMetadata, renderLivePage } from '@/lib/builder/public'

const fallbackMetadata: Metadata = {
  title: 'Projects',
  description: 'Explore the projects where PEARL researchers and partners are working together to make health systems and communities more equitable.',
  alternates: { canonical: '/projects' },
}

// Shows the page-builder version once it's published; until then the
// original page keeps rendering from its content tables.
export function generateMetadata() {
  return livePageMetadata({ legacyKey: 'projects' }, fallbackMetadata)
}

export default async function Page() {
  return (await renderLivePage({ legacyKey: 'projects' })) ?? <ProjectsPage />
}
