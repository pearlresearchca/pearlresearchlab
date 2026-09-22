import type { MetadataRoute } from 'next'
import { listLivePagesForSitemap } from '@/lib/builder/queries'

const siteUrl = 'https://pearlresearchlab.vercel.app'

const routes = [
  { path: '', priority: 1 },
  { path: '/about', priority: 0.8 },
  { path: '/research', priority: 0.8 },
  { path: '/projects', priority: 0.8 },
  { path: '/team', priority: 0.6 },
  { path: '/contact', priority: 0.6 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()
  const builderPages = await listLivePagesForSitemap().catch(() => [])
  const legacySlugs = new Set(routes.map((r) => r.path))

  return [
    ...routes.map(({ path, priority }) => ({
      url: `${siteUrl}${path}`,
      lastModified: builderPages.find((p) => '/' + p.slug === path || (p.slug === '' && path === ''))?.updated_at ?? lastModified,
      changeFrequency: 'monthly' as const,
      priority,
    })),
    ...builderPages
      .filter((p) => !legacySlugs.has(p.slug ? '/' + p.slug : ''))
      .map((p) => ({
        url: `${siteUrl}/${p.slug}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
  ]
}
