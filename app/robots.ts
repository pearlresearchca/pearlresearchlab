import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The admin and API aren't for search engines.
      disallow: ['/admin', '/api'],
    },
    sitemap: 'https://pearlresearchlab.vercel.app/sitemap.xml',
  }
}
