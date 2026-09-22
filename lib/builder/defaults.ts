import type { FooterSettings, HeaderSettings, NavigationSettings, SiteSettings } from './types'

// Defaults reproduce the site's original hardcoded header, footer and
// navigation, so nothing changes visually until an admin edits them.

export const LINKEDIN_URL = 'https://www.linkedin.com/company/pearl-population-health-equity-advocacy-research-lab/'

export const DEFAULT_NAVIGATION: NavigationSettings = {
  items: [
    { id: 'nav-about', label: 'About', kind: 'url', url: '/about' },
    { id: 'nav-research', label: 'Research', kind: 'url', url: '/research' },
    { id: 'nav-projects', label: 'Projects', kind: 'url', url: '/projects' },
    { id: 'nav-team', label: 'Team', kind: 'url', url: '/team' },
    { id: 'nav-contact', label: 'Contact', kind: 'url', url: '/contact' },
  ],
}

export const DEFAULT_HEADER: HeaderSettings = {
  layout: 'inline',
  showLogo: true,
  showSiteName: true,
  siteName: 'PEARL',
  tagline: 'Public Health Equity\nAdvocacy Research Lab',
  showNumbers: true,
  showCta: true,
  ctaLabel: 'Work with us',
  ctaUrl: '/contact',
  showSocial: false,
  showContact: false,
  sticky: true,
}

export function defaultFooter(legacy: { blurb: string; tagline: string; copyright: string }): FooterSettings {
  return {
    columns: [
      { id: 'col-brand', kind: 'brand', text: legacy.blurb },
      { id: 'col-explore', kind: 'links', title: 'Explore', useNavigation: true, links: [] },
      {
        id: 'col-connect',
        kind: 'contact',
        title: 'Connect',
        text: 'St. Francis Xavier University\nAntigonish, Nova Scotia',
        links: [{ id: 'l-contact', label: 'Start a conversation', url: '/contact' }],
      },
    ],
    copyright: legacy.copyright,
    tagline: legacy.tagline,
  }
}

export function defaultSite(legacy: { logoUrl: string }): SiteSettings {
  return {
    siteName: 'PEARL | Public Health Equity Advocacy Research Lab',
    shortName: 'PEARL',
    logoUrl: legacy.logoUrl,
    faviconUrl: '',
    defaultSeoTitle: 'PEARL | Public Health Equity Advocacy Research Lab',
    defaultSeoDescription: 'PEARL advances public health equity through research, advocacy, and collaboration.',
    socialImage: '',
    contactEmail: '',
    phone: '',
    address: 'St. Francis Xavier University\nAntigonish, Nova Scotia',
    social: [{ id: 'soc-linkedin', platform: 'linkedin', url: LINKEDIN_URL }],
  }
}

// URL segments owned by real app routes; builder pages can't claim them.
export const RESERVED_SLUGS = ['admin', 'api', '_next', 'pearl', 'opengraph-image', 'robots.txt', 'sitemap.xml', 'favicon.ico']

// Slugs of the original pages; only their builder versions (legacy_key) may use them.
export const LEGACY_PAGES: { key: string; slug: string; title: string }[] = [
  { key: 'home', slug: '', title: 'Home' },
  { key: 'about', slug: 'about', title: 'About' },
  { key: 'research', slug: 'research', title: 'Research' },
  { key: 'projects', slug: 'projects', title: 'Projects' },
  { key: 'team', slug: 'team', title: 'Team' },
  { key: 'contact', slug: 'contact', title: 'Contact' },
]

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .split('/')
    .map((seg) => seg.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean)
    .join('/')
}

export function validateSlug(slug: string, opts: { legacyKey?: string | null } = {}): string | null {
  if (opts.legacyKey) return null
  if (!slug) return 'Please enter a page URL.'
  if (!/^([a-z0-9]+(-[a-z0-9]+)*)(\/[a-z0-9]+(-[a-z0-9]+)*)*$/.test(slug)) return 'URLs can only contain lowercase letters, numbers, hyphens and slashes.'
  const first = slug.split('/')[0]
  if (RESERVED_SLUGS.includes(first)) return `“/${first}” is reserved by the website and can’t be used.`
  if (LEGACY_PAGES.some((p) => p.slug && p.slug === slug)) return `“/${slug}” belongs to one of the original site pages. Choose a different URL.`
  if (slug.length > 120) return 'That URL is too long.'
  return null
}
