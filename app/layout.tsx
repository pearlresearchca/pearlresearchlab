import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import { PublicAnalytics } from '@/components/public-analytics'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const siteUrl = 'https://pearlresearchlab.vercel.app'
const siteName = 'PEARL | Public Health Equity Advocacy Research Lab'
const siteDescription = 'PEARL advances public health equity through research, advocacy, and collaboration.'

export const metadata: Metadata = {
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

export const viewport: Viewport = {
  // The site has a single light theme; declaring dark support made browsers
  // render dark form controls and chrome on light pages.
  colorScheme: 'light',
  themeColor: '#0d4f4d',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`bg-background ${fraunces.variable} ${inter.variable}`}>
      <body className="antialiased">
        {/* Scroll-reveal content starts hidden; keep it visible without JS. */}
        <noscript><style>{'.reveal{opacity:1!important;transform:none!important}'}</style></noscript>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && <PublicAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />}
    </html>
  )
}
