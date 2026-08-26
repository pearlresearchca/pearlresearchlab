import type { MetadataRoute } from 'next'

const siteUrl = 'https://pearlresearchlab.vercel.app'

const routes = [
  { path: '', priority: 1 },
  { path: '/about', priority: 0.8 },
  { path: '/research', priority: 0.8 },
  { path: '/projects', priority: 0.8 },
  { path: '/team', priority: 0.6 },
  { path: '/contact', priority: 0.6 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return routes.map(({ path, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: 'monthly',
    priority,
  }))
}
