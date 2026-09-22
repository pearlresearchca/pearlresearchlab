'use client'

import DOMPurify from 'dompurify'

// Browser-side sanitizing for the builder canvas and media uploads. Content on
// the canvas may have been written by another editor, so it's never trusted.

export function sanitizeHtmlClient(type: string, html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'button', 'textarea', 'select', 'link', 'meta', 'base'],
    FORBID_ATTR: type === 'html' ? [] : ['srcset'],
  })
}

// SVG uploads are a classic XSS vector (inline scripts, event handlers,
// external references), so every SVG is rewritten through DOMPurify's SVG
// profile before it's uploaded.
export async function sanitizeSvgFile(file: File): Promise<File> {
  const text = await file.text()
  const clean = DOMPurify.sanitize(text, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject', 'use'],
    FORBID_ATTR: ['xlink:href', 'href'],
  })
  if (!clean || !/<svg[\s>]/i.test(clean)) throw new Error('This SVG file could not be read safely.')
  return new File([clean], file.name, { type: 'image/svg+xml' })
}
