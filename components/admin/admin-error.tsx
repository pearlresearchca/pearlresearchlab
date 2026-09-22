'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'

// Shown when an admin screen can't load, most often because the content
// service is unreachable. Nothing has been lost: unsaved builder changes stay
// on this device and are offered back on the next visit.
export function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  const outage = /temporarily unavailable|network|timed out|fetch/i.test(error.message)
  return (
    <div className="admin-ui flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <h1 className="text-lg font-semibold text-foreground">{outage ? 'We can’t reach the server right now' : 'Something went wrong'}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {outage
            ? 'The website’s content service isn’t responding. Your published site and any unsaved changes on this device are safe. Please try again in a moment.'
            : 'This screen couldn’t be displayed. Please try again.'}
        </p>
        {error.digest && <p className="mt-2 font-mono text-[11px] text-muted-foreground">Reference: {error.digest}</p>}
        <div className="mt-6 flex justify-center gap-2">
          <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
            <RefreshCw className="size-4" aria-hidden="true" /> Try again
          </button>
          <Link href="/admin" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
