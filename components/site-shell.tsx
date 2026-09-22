'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Reveal } from './reveal'
import { SocialIcon, SOCIAL_LABELS } from './builder-render/icons'
import type { FooterSettings, HeaderSettings, SiteSettings } from '@/lib/builder/types'

// Navigation items with hrefs already resolved on the server (page links
// follow page URL changes automatically).
export type ResolvedNavItem = { id: string; label: string; href: string; newTab?: boolean; children?: ResolvedNavItem[] }

function isActive(pathname: string, item: ResolvedNavItem): boolean {
  if (item.href === pathname) return true
  return (item.children ?? []).some((c) => isActive(pathname, c))
}

function NavLink({ item, className, onNavigate, children }: { item: ResolvedNavItem; className?: string; onNavigate: () => void; children: React.ReactNode }) {
  const external = /^https?:\/\//.test(item.href)
  if (external || item.newTab) {
    return (
      <a href={item.href} className={className} onClick={onNavigate} {...(item.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    )
  }
  return (
    <Link href={item.href} className={className} onClick={onNavigate}>
      {children}
    </Link>
  )
}

function Dropdown({ item, index, pathname, showNumbers, onNavigate }: { item: ResolvedNavItem; index: number; pathname: string; showNumbers: boolean; onNavigate: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="nav-dropdown" ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <div className="nav-dropdown-trigger">
        <NavLink item={item} className={isActive(pathname, item) ? 'active' : ''} onNavigate={onNavigate}>
          {showNumbers && <span className="nav-index" aria-hidden="true">0{index + 1}</span>}
          {item.label}
        </NavLink>
        <button type="button" className="nav-dropdown-toggle" aria-expanded={open} aria-label={`Show ${item.label} submenu`} onClick={() => setOpen(!open)}>
          <ChevronDown aria-hidden="true" />
        </button>
      </div>
      <div className={open ? 'nav-dropdown-menu is-open' : 'nav-dropdown-menu'}>
        {item.children!.map((child) => (
          <div key={child.id}>
            <NavLink item={child} className={pathname === child.href ? 'active' : ''} onNavigate={onNavigate}>
              {child.label}
            </NavLink>
            {child.children && child.children.length > 0 && (
              <div className="nav-dropdown-nested">
                {child.children.map((g) => (
                  <NavLink key={g.id} item={g} className={pathname === g.href ? 'active' : ''} onNavigate={onNavigate}>
                    {g.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SiteHeader({ logoUrl, nav, header, site }: { logoUrl: string; nav: ResolvedNavItem[]; header: HeaderSettings; site: SiteSettings }) {
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

  const close = () => setOpen(false)
  const [tagTop, ...tagRest] = (header.tagline || '').split('\n')
  const classes = ['site-header', scrolled ? 'is-scrolled' : '', header.sticky === false ? 'is-static' : '', `header-layout-${header.layout ?? 'inline'}`].filter(Boolean).join(' ')

  return (
    <header className={classes}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div className="site-container header-inner">
        <Link href="/" className="brand" onClick={close} aria-label={`${header.siteName || site.shortName} home`}>
          {header.showLogo && logoUrl && <img src={logoUrl} alt="" className="brand-mark" />}
          {header.showSiteName && (
            <span className="brand-copy">
              <strong>{header.siteName}</strong>
              {header.tagline && (
                <span>
                  {tagTop}
                  {tagRest.map((line) => (
                    <span key={line} style={{ display: 'block', margin: 0, fontSize: 'inherit' }}>{line}</span>
                  ))}
                </span>
              )}
            </span>
          )}
        </Link>
        <nav className={open ? 'desktop-nav mobile-open' : 'desktop-nav'} aria-label="Primary navigation">
          {nav.map((item, i) =>
            item.children && item.children.length > 0 ? (
              <Dropdown key={item.id} item={item} index={i} pathname={pathname} showNumbers={header.showNumbers} onNavigate={close} />
            ) : (
              <NavLink key={item.id} item={item} className={isActive(pathname, item) ? 'active' : ''} onNavigate={close}>
                {header.showNumbers && <span className="nav-index" aria-hidden="true">0{i + 1}</span>}
                {item.label}
              </NavLink>
            )
          )}
          {header.showContact && site.contactEmail && (
            <a href={`mailto:${site.contactEmail}`} className="header-contact">{site.contactEmail}</a>
          )}
          {header.showSocial && site.social.length > 0 && (
            <span className="header-social">
              {site.social.map((s) => (
                <a key={s.id} href={s.platform === 'email' ? `mailto:${s.url}` : s.url} target="_blank" rel="noopener noreferrer" aria-label={SOCIAL_LABELS[s.platform] ?? s.platform}>
                  <SocialIcon platform={s.platform} size={18} />
                </a>
              ))}
            </span>
          )}
          {header.showCta && header.ctaLabel && (
            <Link href={header.ctaUrl || '/contact'} className="header-cta" onClick={close}>
              {header.ctaLabel} <ArrowUpRight aria-hidden="true" />
            </Link>
          )}
        </nav>
        <button className="menu-button" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  )
}

export function SiteFooter({ footer, nav, site }: { footer: FooterSettings; nav: ResolvedNavItem[]; site: SiteSettings }) {
  const style = {
    ...(footer.background ? { background: footer.background } : {}),
    ...(footer.textColor ? { color: footer.textColor } : {}),
  }
  return (
    <footer className="site-footer" style={style}>
      <div className="site-container footer-grid" style={{ gridTemplateColumns: footer.columns.length === 3 ? undefined : `repeat(${Math.max(1, footer.columns.length)}, minmax(0, 1fr))` }}>
        {footer.columns.map((col) => (
          <div key={col.id}>
            {col.kind === 'brand' ? (
              <>
                <Link href="/" className="footer-brand">
                  {site.shortName}
                  <span style={{ whiteSpace: 'pre-line' }}>{col.title || 'Public Health Equity\nAdvocacy Research Lab'}</span>
                </Link>
                {col.text && <p>{col.text}</p>}
                <span className="footer-socials">
                  {site.social.map((s) => (
                    <a key={s.id} className="footer-social" href={s.platform === 'email' ? `mailto:${s.url}` : s.url} target="_blank" rel="noopener noreferrer" aria-label={`${site.shortName} on ${SOCIAL_LABELS[s.platform] ?? s.platform}`}>
                      <SocialIcon platform={s.platform} size={20} />
                    </a>
                  ))}
                </span>
              </>
            ) : (
              <>
                {col.title && <p className="eyebrow">{col.title}</p>}
                {col.kind === 'text' && col.text && <p style={{ whiteSpace: 'pre-line' }}>{col.text}</p>}
                {col.kind === 'contact' && (
                  <>
                    {col.text && <p style={{ whiteSpace: 'pre-line' }}>{col.text}</p>}
                    {site.contactEmail && <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>}
                    {site.phone && <a href={`tel:${site.phone.replace(/[^\d+]/g, '')}`}>{site.phone}</a>}
                  </>
                )}
                {col.kind === 'social' && (
                  <span className="footer-socials">
                    {site.social.map((s) => (
                      <a key={s.id} className="footer-social" href={s.platform === 'email' ? `mailto:${s.url}` : s.url} target="_blank" rel="noopener noreferrer" aria-label={SOCIAL_LABELS[s.platform] ?? s.platform}>
                        <SocialIcon platform={s.platform} size={20} />
                      </a>
                    ))}
                  </span>
                )}
                {col.kind === 'newsletter' && (
                  <>
                    {col.text && <p>{col.text}</p>}
                    <Link href="/contact">Get in touch <ArrowUpRight aria-hidden="true" /></Link>
                  </>
                )}
                {col.kind === 'links' && col.useNavigation &&
                  nav.slice(0, 6).map((item) => (
                    <Link key={item.id} href={item.href}>{item.label}</Link>
                  ))}
                {(col.kind === 'links' || col.kind === 'contact') &&
                  (col.links ?? []).map((l) =>
                    /^https?:\/\//.test(l.url) ? (
                      <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer">{l.label} <ArrowUpRight aria-hidden="true" /></a>
                    ) : (
                      <Link key={l.id} href={l.url || '/'}>{l.label} {col.kind === 'contact' && <ArrowUpRight aria-hidden="true" />}</Link>
                    )
                  )}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="site-container footer-bottom">
        <span>{footer.copyright}</span>
        <span>{footer.tagline}</span>
      </div>
    </footer>
  )
}

export function PageHero({ kicker, title, intro }: { kicker: string; title: string; intro?: string }) { return <section className="page-hero"><Reveal className="site-container"><p className="eyebrow">{kicker}</p><h1>{title}</h1>{intro && <p className="hero-intro">{intro}</p>}</Reveal></section> }

export function SectionHeading({ kicker, title, body }: { kicker?: string; title: string; body?: string }) { return <Reveal className="section-heading">{kicker && <p className="eyebrow">{kicker}</p>}<h2>{title}</h2>{body && <p>{body}</p>}</Reveal> }

export function ArrowLink({ children, href = '/contact' }: { children: React.ReactNode; href?: string }) { return <Link className="arrow-link" href={href}>{children}<ArrowUpRight aria-hidden="true" /></Link> }
