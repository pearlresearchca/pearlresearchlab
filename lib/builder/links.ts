// Links are stored as { href, pageId?, newTab? }. When a link points at a
// builder page we keep its id, so renaming that page's URL never breaks it.

export type LinkValue = {
  href?: string
  pageId?: string
  newTab?: boolean
}

export type LinkKind = 'page' | 'url' | 'email' | 'phone' | 'anchor'

export function linkKind(link: LinkValue | undefined): LinkKind {
  if (!link) return 'url'
  if (link.pageId) return 'page'
  const href = link.href ?? ''
  if (href.startsWith('mailto:')) return 'email'
  if (href.startsWith('tel:')) return 'phone'
  if (href.startsWith('#')) return 'anchor'
  return 'url'
}

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/|#)/i

export function safeHref(href: string | undefined | null): string | null {
  if (!href) return null
  const v = href.trim()
  if (!v) return null
  if (SAFE_HREF.test(v)) return v
  // Bare domains like "example.com" → https://example.com
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(v)) return `https://${v}`
  return null
}

export function resolveLink(link: LinkValue | undefined | null, pageSlugs: Record<string, string>): { href: string; external: boolean; newTab: boolean } | null {
  if (!link) return null
  let href: string | null = null
  if (link.pageId && pageSlugs[link.pageId] !== undefined) href = '/' + pageSlugs[link.pageId]
  else href = safeHref(link.href)
  if (!href) return null
  const external = /^https?:\/\//i.test(href)
  return { href, external, newTab: !!link.newTab }
}

export function linkAttrs(resolved: { href: string; newTab: boolean } | null) {
  if (!resolved) return {}
  return {
    href: resolved.href,
    ...(resolved.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
  }
}
