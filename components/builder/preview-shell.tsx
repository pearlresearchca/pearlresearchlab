'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Monitor, RefreshCw, Smartphone, Tablet } from 'lucide-react'
import { Btn, Segmented, StatusBadge } from './ui'

const WIDTHS = { desktop: '100%', tablet: '820px', mobile: '390px' } as const

// Draft preview with device sizes. The page renders in an iframe, so
// viewport-based styles (the site header, the original pages) respond exactly
// as they would on a real device of that width.
export function PreviewShell({ id, title, slug, status }: { id: string; title: string; slug: string; status: string }) {
  const [device, setDevice] = useState<keyof typeof WIDTHS>('desktop')
  const [key, setKey] = useState(0)
  return (
    <div className="admin-ui flex h-dvh flex-col bg-[#e8ecf4]">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-surface px-3">
        <Link href={`/admin/builder/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-primary">
          <ArrowLeft className="size-4" /> Back to editor
        </Link>
        <span className="truncate text-sm font-semibold">Preview: {title}</span>
        <StatusBadge status={status} />
        <span className="hidden text-xs text-muted-foreground sm:inline">Showing your latest saved draft — not visible to visitors until published.</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-36">
            <Segmented
              size="sm"
              label="Device"
              value={device}
              onChange={setDevice}
              options={[
                { value: 'desktop', label: <Monitor />, title: 'Desktop' },
                { value: 'tablet', label: <Tablet />, title: 'Tablet' },
                { value: 'mobile', label: <Smartphone />, title: 'Mobile' },
              ]}
            />
          </div>
          <Btn size="sm" variant="ghost" onClick={() => setKey((k) => k + 1)} aria-label="Reload preview"><RefreshCw className="size-4" /></Btn>
          {(status === 'published' || status === 'private') && (
            <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Live page <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 justify-center overflow-auto p-4">
        <iframe
          key={key}
          src={`/admin/preview/${id}/frame`}
          title={`Preview of ${title} (${device})`}
          className="h-full rounded-lg border border-border bg-white shadow-lg transition-[width] duration-200"
          style={{ width: WIDTHS[device], maxWidth: '100%' }}
        />
      </div>
    </div>
  )
}
