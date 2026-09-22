import type { Metadata } from 'next'
import { ContactPage } from '@/components/pearl-pages'
import { livePageMetadata, renderLivePage } from '@/lib/builder/public'

const fallbackMetadata: Metadata = {
  title: 'Contact',
  description: 'Interested in collaborating on research, exploring partnership opportunities, or joining the PEARL team? Get in touch with PEARL Research Lab.',
  alternates: { canonical: '/contact' },
}

// Shows the page-builder version once it's published; until then the
// original page keeps rendering from its content tables.
export function generateMetadata() {
  return livePageMetadata({ legacyKey: 'contact' }, fallbackMetadata)
}

export default async function Page() {
  return (await renderLivePage({ legacyKey: 'contact' })) ?? <ContactPage />
}
