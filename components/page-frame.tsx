import { SiteFooter, SiteHeader, type ResolvedNavItem } from './site-shell'
import { getPageSlugs, getSiteConfig } from '@/lib/builder/queries'
import { googleFontsHref, themeCss } from '@/lib/builder/theme'
import { resolveLink } from '@/lib/builder/links'
import type { NavItem } from '@/lib/builder/types'

function resolveNav(items: NavItem[], slugs: Record<string, string>): ResolvedNavItem[] {
  return items
    .filter((item) => !item.hidden)
    .map((item): ResolvedNavItem | null => {
      const resolved = resolveLink(item.kind === 'page' ? { pageId: item.pageId, href: item.url } : { href: item.url }, slugs)
      if (!resolved) return null
      return {
        id: item.id,
        label: item.label,
        href: resolved.href,
        newTab: item.newTab,
        children: item.children?.length ? resolveNav(item.children, slugs) : undefined,
      }
    })
    .filter((i): i is ResolvedNavItem => i !== null)
}

// Public page chrome: theme tokens, header and footer, all generated from the
// global settings managed under Website in the admin.
export async function PageFrame({ children, extraFonts = [] }: { children: React.ReactNode; extraFonts?: string[] }) {
  const [config, slugs] = await Promise.all([getSiteConfig(), getPageSlugs()])
  const nav = resolveNav(config.navigation.items, slugs)
  const fontsHref = googleFontsHref([config.theme.typography.headingFont, config.theme.typography.bodyFont, ...extraFonts])

  return (
    <>
      {fontsHref && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link rel="stylesheet" href={fontsHref} />
        </>
      )}
      <style dangerouslySetInnerHTML={{ __html: themeCss(config.theme) }} />
      <SiteHeader logoUrl={config.site.logoUrl ?? ''} nav={nav} header={config.header} site={config.site} />
      <div className="page-transition" id="main-content" tabIndex={-1}>
        {children}
      </div>
      <SiteFooter footer={config.footer} nav={nav} site={config.site} />
    </>
  )
}
