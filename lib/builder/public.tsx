import type { Metadata } from 'next'
import { PageFrame } from '@/components/page-frame'
import { PageBody } from '@/components/builder-render/render'
import { getLivePage, getSiteConfig, loadRenderData } from './queries'
import { sanitizeByType } from './sanitize'
import { normalizeDoc } from './tree'
import type { PageDoc } from './types'

type Match = { slug: string } | { legacyKey: string }

export async function BuilderPage({ doc, pageId }: { doc: PageDoc; pageId: string }) {
  const data = await loadRenderData([doc])
  return (
    <PageFrame extraFonts={data.fonts}>
      <main>
        <PageBody doc={doc} rc={{ data, pageId, html: sanitizeByType }} />
      </main>
    </PageFrame>
  )
}

// Renders the published builder version of a page, or null when there is
// none (the caller then falls back to the original page component).
export async function renderLivePage(match: Match) {
  const page = await getLivePage(match)
  if (!page?.published_content) return null
  return <BuilderPage doc={normalizeDoc(page.published_content)} pageId={page.id} />
}

export async function livePageMetadata(match: Match, fallback: Metadata = {}): Promise<Metadata> {
  const [page, config] = await Promise.all([getLivePage(match), getSiteConfig()])
  if (!page) return fallback
  const seo = page.seo ?? {}
  const site = config.site
  const path = '/' + page.slug
  const title = seo.title || page.title
  const description = seo.description || site.defaultSeoDescription
  const image = seo.ogImage || page.featured_image || site.socialImage || undefined
  return {
    // The homepage uses its SEO title as-is; other pages get the site suffix template.
    title: page.slug === '' ? { absolute: seo.title || site.defaultSeoTitle } : title,
    description,
    alternates: { canonical: seo.canonical || path },
    robots: { index: !seo.noIndex, follow: !seo.noFollow },
    openGraph: {
      type: 'website',
      url: path,
      title: seo.socialTitle || title,
      description: seo.socialDescription || description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.socialTitle || title,
      description: seo.socialDescription || description,
      ...(image ? { images: [image] } : {}),
    },
  }
}
