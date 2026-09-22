'use client'

import { usePathname } from 'next/navigation'
import { GoogleAnalytics } from '@next/third-parties/google'

// Keeps GA4 scoped to the public site — admin panel usage (by us, editors,
// admins) should never count as visitor traffic in the analytics dashboard.
export function PublicAnalytics({ gaId }: { gaId: string }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null
  return <GoogleAnalytics gaId={gaId} />
}
