import { readFile } from 'node:fs/promises'
import path from 'node:path'

// Email templates live as plain HTML files in /templates/email so they can be
// edited without touching code. Placeholders:
//   {{name}}   → value, HTML-escaped (safe for anything a visitor typed)
//   {{{name}}} → value inserted as-is (only for HTML this code builds itself)
// Unknown placeholders render as empty text.

const TEMPLATE_DIR = path.join(process.cwd(), 'templates', 'email')
const cache = new Map<string, string>()

export type TemplateName = 'contact-admin' | 'contact-confirmation'

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function load(name: TemplateName): Promise<string> {
  // Re-read in development so template edits show up without a restart.
  if (process.env.NODE_ENV === 'production' && cache.has(name)) return cache.get(name)!
  const html = await readFile(path.join(TEMPLATE_DIR, `${name}.html`), 'utf8')
  cache.set(name, html)
  return html
}

export async function renderTemplate(name: TemplateName, vars: Record<string, string | number | undefined>): Promise<string> {
  const html = await load(name)
  return html
    .replace(/<!--[\s\S]*?-->/g, '') // strip the documentation comments
    .replace(/\{\{\{\s*(\w+)\s*\}\}\}/g, (_, key: string) => String(vars[key] ?? ''))
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => escapeHtml(vars[key]))
}
