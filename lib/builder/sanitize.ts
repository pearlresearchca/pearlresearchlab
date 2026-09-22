import sanitizeHtml from 'sanitize-html'
import type { BuilderNode, PageDoc } from './types'

// Server-side HTML sanitizing for rich text and custom HTML blocks. Applied
// when saving and again when rendering, so content written directly through
// the API (bypassing the builder) can't inject scripts either.

const COLOR = [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^hsla?\([\d\s.,%deg]+\)$/i, /^var\(--[a-z0-9-]+\)$/i, /^[a-z]+$/i]
const LENGTH = [/^-?\d+(\.\d+)?(px|em|rem|%|pt|vw|vh)?$/]

const RICH_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'mark', 'sub', 'sup', 'span', 'small', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'hr', 'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col', 'label', 'input', 'div',
  ],
  allowedAttributes: {
    '*': ['style', 'class', 'data-type', 'data-checked', 'data-text-align', 'data-variant', 'id'],
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'data-align'],
    th: ['colspan', 'rowspan', 'colwidth'],
    td: ['colspan', 'rowspan', 'colwidth'],
    col: ['style', 'span'],
    ol: ['start', 'type'],
    input: ['type', 'checked', 'disabled'],
    mark: ['data-color', 'style'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  allowedStyles: {
    '*': {
      color: COLOR,
      'background-color': COLOR,
      'font-size': LENGTH,
      'font-family': [/^[a-z0-9 ,"'-]+$/i],
      'font-weight': [/^\d{3}$|^(normal|bold|lighter|bolder)$/],
      'text-align': [/^(left|right|center|justify|start|end)$/],
      'line-height': [/^\d+(\.\d+)?(px|em|rem|%)?$/],
      width: LENGTH,
      'min-width': LENGTH,
      height: LENGTH,
    },
  },
  transformTags: {
    a: (tagName, attribs) => {
      const next = { ...attribs }
      if (next.target === '_blank') next.rel = 'noopener noreferrer'
      else delete next.target
      return { tagName, attribs: next }
    },
    input: (tagName, attribs) => ({ tagName, attribs: attribs.type === 'checkbox' ? { type: 'checkbox', disabled: 'disabled', ...(attribs.checked !== undefined ? { checked: 'checked' } : {}) } : {} }),
  },
  exclusiveFilter: (frame) => frame.tag === 'input' && frame.attribs.type !== 'checkbox',
}

// Custom HTML blocks get a broader (layout-oriented) allowlist, still without
// scripts, event handlers, forms or frames.
const CUSTOM_OPTIONS: sanitizeHtml.IOptions = {
  ...RICH_OPTIONS,
  allowedTags: [...(RICH_OPTIONS.allowedTags as string[]), 'section', 'article', 'aside', 'header', 'footer', 'nav', 'dl', 'dt', 'dd', 'abbr', 'cite', 'time', 'address', 'details', 'summary', 'picture', 'source'],
  allowedAttributes: {
    ...(RICH_OPTIONS.allowedAttributes as Record<string, string[]>),
    '*': ['style', 'class', 'id', 'title', 'aria-label', 'aria-hidden', 'role', 'lang', 'dir'],
    source: ['srcset', 'media', 'type'],
    time: ['datetime'],
  },
  allowedStyles: undefined,
  // Inline styles are allowed in custom HTML, but url()/expression() are not.
  parseStyleAttributes: true,
  // sanitize-html picks the tag-specific transform over '*', so a single '*'
  // transform handles both unsafe inline styles and link targets.
  transformTags: {
    '*': (tagName, attribs) => {
      const next = { ...attribs }
      if (next.style && /url\s*\(|expression\s*\(|javascript:|@import|behavior\s*:/i.test(next.style)) delete next.style
      if (tagName === 'a') {
        if (next.target === '_blank') next.rel = 'noopener noreferrer'
        else delete next.target
      }
      return { tagName, attribs: next }
    },
  },
}

export function sanitizeRichHtml(html: unknown): string {
  if (typeof html !== 'string' || !html) return ''
  return sanitizeHtml(html, RICH_OPTIONS)
}

export function sanitizeCustomHtml(html: unknown): string {
  if (typeof html !== 'string' || !html) return ''
  return sanitizeHtml(html, CUSTOM_OPTIONS)
}

export function sanitizeByType(type: string, html: string): string {
  return type === 'html' ? sanitizeCustomHtml(html) : sanitizeRichHtml(html)
}

// Clean every HTML-bearing prop in a document (used on save).
export function sanitizeDoc(doc: PageDoc): PageDoc {
  const clean = (node: BuilderNode): BuilderNode => {
    let props = node.props
    if (node.type === 'richtext' && typeof props.html === 'string') props = { ...props, html: sanitizeRichHtml(props.html) }
    if (node.type === 'html' && typeof props.html === 'string') props = { ...props, html: sanitizeCustomHtml(props.html) }
    return { ...node, props, children: node.children?.map(clean) }
  }
  return { version: 1, sections: doc.sections.map(clean) }
}

export function sanitizeNode(node: BuilderNode): BuilderNode {
  return sanitizeDoc({ version: 1, sections: [node] }).sections[0]
}
