'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { SiteFooter, SiteHeader } from '@/components/site-shell'
import { DEFAULT_HEADER, DEFAULT_NAVIGATION, defaultFooter, defaultSite } from '@/lib/builder/defaults'

// The error boundary can't load settings from the database (that may be what
// failed), so it renders the built-in default header and footer.
const NAV = DEFAULT_NAVIGATION.items.map((i) => ({ id: i.id, label: i.label, href: i.url ?? '/' }))
const SITE = defaultSite({ logoUrl: '/pearl/pearlresearchlab%20assets/image.png' })
const FOOTER = defaultFooter({
  blurb: 'Advancing public health equity through research, advocacy, and collaboration.',
  tagline: 'Research for healthier, more equitable communities.',
  copyright: '© 2026 PEARL Research Lab',
})

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <>
      <SiteHeader logoUrl={SITE.logoUrl ?? ''} nav={NAV} header={DEFAULT_HEADER} site={SITE} />
      <main>
        <section className="page-hero">
          <div className="site-container">
            <p className="eyebrow">Something went wrong</p>
            <h1>We hit a snag loading this page.</h1>
            <p className="hero-intro">
              Please try again, or head back to the homepage. If the problem continues, reach out and let us know.
            </p>
            <div className="hero-actions">
              <button onClick={() => reset()} className="button button-primary" type="button">Try again</button>
              <Link href="/" className="text-link">Back to homepage</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter footer={FOOTER} nav={NAV} site={SITE} />
    </>
  )
}
