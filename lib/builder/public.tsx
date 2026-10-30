import type { Metadata } from 'next'
import { PageFrame } from '@/components/page-frame'
import { PageBody } from '@/components/builder-render/render'
import { getLivePage, getSiteConfig, loadRenderData } from './queries'
import { sanitizeByType } from './sanitize'
import { normalizeDoc } from './tree'
import type { PageDoc } from './types'
import { JsonLd, ORGANIZATION, ORG_NAME, PORTFOLIO_PERSON, SITE_URL, breadcrumbs } from '@/lib/seo/json-ld'

type Match = { slug: string }

type PageInfo = { title: string; slug: string; description?: string; image?: string | null }

// schema.org data for a page: the organization, the page itself and its
// breadcrumb trail; the homepage also describes the website, and the
// portfolio page describes its person.
function pageSchema(page: PageInfo) {
  const url = page.slug ? `${SITE_URL}/${page.slug}` : SITE_URL
  const graph: Record<string, unknown>[] = [
    ORGANIZATION,
    { '@type': page.slug === 'portfolio' ? 'ProfilePage' : page.slug === 'contact' ? 'ContactPage' : page.slug === 'about' ? 'AboutPage' : 'WebPage', '@id': `${url}#webpage`, url, name: page.title, description: page.description, isPartOf: { '@id': `${SITE_URL}/#website` }, about: { '@id': ORGANIZATION['@id'] }, ...(page.image ? { primaryImageOfPage: page.image } : {}) },
  ]
  if (page.slug) graph.push(breadcrumbs([{ name: 'Home', path: '' }, ...page.slug.split('/').map((_, i, parts) => ({ name: i === parts.length - 1 ? page.title : parts[i], path: '/' + parts.slice(0, i + 1).join('/') }))]))
  else graph.push({ '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: SITE_URL, name: ORG_NAME, publisher: { '@id': ORGANIZATION['@id'] }, inLanguage: 'en-CA' })
  if (page.slug === 'portfolio') graph.push(PORTFOLIO_PERSON)
  return { '@context': 'https://schema.org', '@graph': graph }
}

export async function BuilderPage({ doc, pageId, page }: { doc: PageDoc; pageId: string; page?: PageInfo }) {
  const data = await loadRenderData([doc])
  return (
    <PageFrame extraFonts={data.fonts}>
      {page && <JsonLd data={pageSchema(page)} />}
      <main>
        <PageBody doc={doc} rc={{ data, pageId, html: sanitizeByType }} />
      </main>
    </PageFrame>
  )
}

// Renders the published builder version of a page, or null when there is none.
export async function renderLivePage(match: Match) {
  const page = await getLivePage(match)
  if (!page?.published_content) return null
  const config = await getSiteConfig()
  return (
    <BuilderPage
      doc={normalizeDoc(page.published_content)}
      pageId={page.id}
      page={{ title: page.seo?.title || page.title, slug: page.slug, description: page.seo?.description || config.site.defaultSeoDescription, image: page.seo?.ogImage || page.featured_image }}
    />
  )
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
