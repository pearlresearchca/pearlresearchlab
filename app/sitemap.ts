import type { MetadataRoute } from 'next'
import { listLivePagesForSitemap } from '@/lib/builder/queries'
import { getOpenJobs, getPublishedPosts } from '@/lib/cms/posts-jobs'

const siteUrl = 'https://pearlresearchlab.vercel.app'

// Top-level pages rank above nested ones; the homepage ranks highest.
function priority(slug: string): number {
  if (!slug) return 1
  return slug.includes('/') ? 0.6 : 0.8
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, posts, jobs] = await Promise.all([listLivePagesForSitemap().catch(() => []), getPublishedPosts(500), getOpenJobs()])
  return [
    ...pages.map((p) => ({
      url: p.slug ? `${siteUrl}/${p.slug}` : siteUrl,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'monthly' as const,
      priority: priority(p.slug),
    })),
    ...posts.map((p) => ({
      url: `${siteUrl}/blogs/${p.slug}`,
      lastModified: new Date(p.updated_at ?? p.published_at ?? p.created_at),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),
    ...jobs.map((j) => ({
      url: `${siteUrl}/careers/${j.slug}`,
      lastModified: new Date(j.updated_at ?? j.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
