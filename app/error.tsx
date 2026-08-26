'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { PageFrame } from '@/components/site-shell'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <PageFrame>
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
    </PageFrame>
  )
}
