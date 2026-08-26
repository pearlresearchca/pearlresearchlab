import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { PageFrame } from '@/components/site-shell'

export default function NotFound() {
  return (
    <PageFrame>
      <main>
        <section className="page-hero">
          <div className="site-container">
            <p className="eyebrow">Page not found</p>
            <h1>This page took a different path.</h1>
            <p className="hero-intro">
              The page you&apos;re looking for may have moved or no longer exists. Here are a few places to pick up the thread.
            </p>
            <div className="hero-actions">
              <Link href="/" className="button button-primary">
                Back to homepage <ArrowUpRight aria-hidden="true" />
              </Link>
              <Link href="/research" className="text-link">Explore our research</Link>
            </div>
          </div>
        </section>
      </main>
    </PageFrame>
  )
}
