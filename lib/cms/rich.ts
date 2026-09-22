import { paragraphsHtml } from '@/lib/builder/presets'
import { sanitizeRichHtml } from '@/lib/builder/sanitize'
import type { PageContentMap } from './types'

// Core-page fields edited with the rich text editor. They're stored as HTML;
// older values are plain text with blank lines between paragraphs, which
// still render (and open in the editor) as paragraphs.
export const RICH_FIELDS: Record<string, readonly string[]> = {
  about: ['mission_body', 'vision_body', 'partners_body'],
  contact: ['partnerships_intro', 'approach_body', 'start_body'],
}

export function isRichField(page: string, key: string): boolean {
  return RICH_FIELDS[page]?.includes(key) ?? false
}

function looksLikeHtml(value: string): boolean {
  return /^\s*<[a-z][\s\S]*>/i.test(value)
}

// Sanitized HTML for a rich field, whether it was saved as HTML or plain text.
export function richHtml(map: PageContentMap, key: string): string {
  const raw = map[key]?.value ?? ''
  if (!raw.trim()) return ''
  if (looksLikeHtml(raw)) return sanitizeRichHtml(raw)
  return paragraphsHtml(raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean))
}

// Cleans a submitted value for storage: HTML is sanitized, and an editor
// left empty (`<p></p>`) is stored as an empty string.
export function cleanRichValue(value: string): string {
  const clean = sanitizeRichHtml(value)
  return clean.replace(/<p>\s*<\/p>/g, '').trim() ? clean : ''
}
