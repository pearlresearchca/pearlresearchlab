import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import { PublicAnalytics } from '@/components/public-analytics'
import { getSiteConfig } from '@/lib/builder/queries'
import './globals.css'
import './builder.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const siteUrl = 'https://pearlresearchlab.vercel.app'
const siteName = 'PEARL | Public Health Equity Advocacy Research Lab'
const siteDescription = 'PEARL advances public health equity through research, advocacy, and collaboration.'

const baseMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: '%s | PEARL',
  },
  description: siteDescription,
  keywords: [
    'PEARL',
    'public health equity',
    'health equity research',
    'health systems research',
    'food systems research',
    'St. Francis Xavier University',
    'Antigonish Nova Scotia',
    'community-engaged research',
  ],
  authors: [{ name: 'PEARL Research Lab' }],
  creator: 'PEARL Research Lab',
  publisher: 'PEARL Research Lab',
  generator: 'v0.app',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName,
    title: siteName,
    description: siteDescription,
    locale: 'en_CA',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' }
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

// Default title/description/social image and favicon come from Site settings
// (with the values above as fallbacks when nothing has been saved yet).
export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig().catch(() => null)
  if (!config) return baseMetadata
  const site = config.site
  const title = site.defaultSeoTitle || siteName
  const description = site.defaultSeoDescription || siteDescription
  const image = site.socialImage ? [{ url: site.socialImage }] : undefined
  return {
    ...baseMetadata,
    title: { default: title, template: `%s | ${site.shortName || 'PEARL'}` },
    description,
    openGraph: { ...baseMetadata.openGraph, siteName: site.siteName || siteName, title, description, ...(image ? { images: image } : {}) },
    twitter: { ...baseMetadata.twitter, title, description, ...(image ? { images: [site.socialImage!] } : {}) },
    ...(site.faviconUrl ? { icons: { icon: [{ url: site.faviconUrl }], apple: site.faviconUrl } } : {}),
  }
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`bg-background ${fraunces.variable} ${inter.variable}`}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && <PublicAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />}
    </html>
  )
}
