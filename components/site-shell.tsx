'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Reveal } from './reveal'

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56z" />
    </svg>
  )
}

const nav = [
  ['About', '/about'],
  ['Research', '/research'],
  ['Projects', '/projects'],
  ['Team', '/team'],
  ['Contact', '/contact'],
]

const LINKEDIN_URL = 'https://www.linkedin.com/company/pearl-population-health-equity-advocacy-research-lab/'

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className={scrolled ? 'site-header is-scrolled' : 'site-header'}>
      <div className="site-container header-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)} aria-label="PEARL home">
          <img src="/pearl/pearlresearchlab%20assets/image.png" alt="PEARL logo" className="brand-mark" />
          <span className="brand-copy"><strong>PEARL</strong><span>Population Health Equity<br />Advocacy Research Lab</span></span>
        </Link>
        <nav className={open ? 'desktop-nav mobile-open' : 'desktop-nav'} aria-label="Primary navigation">
          {nav.map(([label, href]) => <Link key={href} href={href} className={pathname === href ? 'active' : ''} onClick={() => setOpen(false)}>{label}</Link>)}
          <Link href="/contact" className="header-cta" onClick={() => setOpen(false)}>Work with us <ArrowUpRight aria-hidden="true" /></Link>
        </nav>
        <button className="menu-button" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X /> : <Menu />}</button>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container footer-grid">
        <div>
          <Link href="/" className="footer-brand">PEARL<span>Population Health Equity<br />Advocacy Research Lab</span></Link>
          <p>Advancing population health equity through research, advocacy, and collaboration.</p>
          <a className="footer-social" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" aria-label="PEARL on LinkedIn">
            <LinkedinIcon aria-hidden="true" />
          </a>
        </div>
        <div>
          <p className="eyebrow">Explore</p>
          {nav.slice(0, 4).map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </div>
        <div>
          <p className="eyebrow">Connect</p>
          <p>St. Francis Xavier University<br />Antigonish, Nova Scotia</p>
          <Link href="/contact">Start a conversation <ArrowUpRight aria-hidden="true" /></Link>
        </div>
      </div>
      <div className="site-container footer-bottom">
        <span>© 2026 PEARL Research Lab</span>
        <span>Research for healthier, more equitable communities.</span>
      </div>
    </footer>
  )
}

export function PageFrame({ children }: { children: React.ReactNode }) { return <><SiteHeader /><div className="page-transition">{children}</div><SiteFooter /></> }

export function PageHero({ kicker, title, intro }: { kicker: string; title: string; intro?: string }) { return <section className="page-hero"><Reveal className="site-container"><p className="eyebrow">{kicker}</p><h1>{title}</h1>{intro && <p className="hero-intro">{intro}</p>}</Reveal></section> }

export function SectionHeading({ kicker, title, body }: { kicker?: string; title: string; body?: string }) { return <Reveal className="section-heading">{kicker && <p className="eyebrow">{kicker}</p>}<h2>{title}</h2>{body && <p>{body}</p>}</Reveal> }

export function ArrowLink({ children, href = '/contact' }: { children: React.ReactNode; href?: string }) { return <Link className="arrow-link" href={href}>{children}<ArrowUpRight aria-hidden="true" /></Link> }
