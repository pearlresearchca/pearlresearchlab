'use client'

import { useState } from 'react'
import { RichTextEditor } from '@/components/builder/rich-text-editor'

// Rich text editor for admin forms: the HTML is submitted through a hidden
// input, and sanitized again on the server before it's saved.
export function RichTextField({ id, name, defaultValue = '', tall = false }: { id?: string; name: string; defaultValue?: string; tall?: boolean }) {
  const [html, setHtml] = useState(defaultValue)
  return (
    <div id={id} className="pb-page overflow-hidden rounded-lg border border-border bg-white transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15" style={{ fontSize: 15 }}>
      <RichTextEditor html={html} onChange={setHtml} stickyToolbar={false} className={`max-h-[60vh] overflow-y-auto px-3.5 py-3 ${tall ? 'min-h-[200px]' : 'min-h-[96px]'}`} />
      <input type="hidden" name={name} value={html} />
    </div>
  )
}
