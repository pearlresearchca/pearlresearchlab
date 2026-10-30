// Content model for blog posts: a list of simple blocks (no HTML), shown in
// one of several visual styles. Shared by the admin composer (client), the
// article page (server) and the save action (validation).

export type PostBlock =
  | { id: string; type: 'heading'; text: string; level: 'h2' | 'h3' }
  | { id: string; type: 'paragraph'; text: string }
  | { id: string; type: 'image'; src: string; alt: string; caption: string; size: 'normal' | 'wide' | 'full' }
  | { id: string; type: 'imageText'; src: string; alt: string; title: string; text: string; side: 'left' | 'right' }
  | { id: string; type: 'quote'; text: string; cite: string }
  | { id: string; type: 'list'; items: string; ordered: boolean }
  | { id: string; type: 'callout'; title: string; text: string; tone: 'info' | 'tip' | 'important' }
  | { id: string; type: 'stats'; items: { value: string; label: string }[] }
  | { id: string; type: 'video'; url: string; caption: string }
  | { id: string; type: 'qa'; question: string; answer: string }
  | { id: string; type: 'button'; label: string; href: string }
  | { id: string; type: 'divider' }

export type PostBlockType = PostBlock['type']

export type BlockDef = { type: PostBlockType; label: string; description: string; icon: string; create: () => PostBlock }

export function blockId() {
  return 'b' + Math.random().toString(36).slice(2, 10)
}

export const BLOCK_DEFS: BlockDef[] = [
  { type: 'paragraph', label: 'Paragraph', description: 'Regular text', icon: 'Pilcrow', create: () => ({ id: blockId(), type: 'paragraph', text: '' }) },
  { type: 'heading', label: 'Heading', description: 'Section title', icon: 'Heading', create: () => ({ id: blockId(), type: 'heading', text: '', level: 'h2' }) },
  { type: 'image', label: 'Image', description: 'Photo with caption', icon: 'Image', create: () => ({ id: blockId(), type: 'image', src: '', alt: '', caption: '', size: 'wide' }) },
  { type: 'imageText', label: 'Image + text', description: 'Side by side', icon: 'PanelsLeftRight', create: () => ({ id: blockId(), type: 'imageText', src: '', alt: '', title: '', text: '', side: 'left' }) },
  { type: 'quote', label: 'Quote', description: 'Highlight a quote', icon: 'Quote', create: () => ({ id: blockId(), type: 'quote', text: '', cite: '' }) },
  { type: 'list', label: 'List', description: 'Bullets or steps', icon: 'List', create: () => ({ id: blockId(), type: 'list', items: '', ordered: false }) },
  { type: 'callout', label: 'Highlight box', description: 'Key message or tip', icon: 'Lightbulb', create: () => ({ id: blockId(), type: 'callout', title: '', text: '', tone: 'info' }) },
  { type: 'stats', label: 'Key numbers', description: 'Up to 4 figures', icon: 'BarChart3', create: () => ({ id: blockId(), type: 'stats', items: [{ value: '', label: '' }, { value: '', label: '' }, { value: '', label: '' }] }) },
  { type: 'video', label: 'Video', description: 'YouTube or Vimeo', icon: 'PlayCircle', create: () => ({ id: blockId(), type: 'video', url: '', caption: '' }) },
  { type: 'qa', label: 'Question & answer', description: 'For interviews', icon: 'MessagesSquare', create: () => ({ id: blockId(), type: 'qa', question: '', answer: '' }) },
  { type: 'button', label: 'Button', description: 'Link to a page', icon: 'MousePointerClick', create: () => ({ id: blockId(), type: 'button', label: 'Get in touch', href: '/contact' }) },
  { type: 'divider', label: 'Divider', description: 'Separate sections', icon: 'Minus', create: () => ({ id: blockId(), type: 'divider' }) },
]

export const BLOCK_DEF: Record<PostBlockType, BlockDef> = Object.fromEntries(BLOCK_DEFS.map((d) => [d.type, d])) as Record<PostBlockType, BlockDef>

// ---------------------------------------------------------------- styles
export type PostStyle = {
  key: string
  name: string
  description: string
  // Mini preview colours for the style picker.
  swatch: { bg: string; ink: string; accent: string }
  starter: () => PostBlock[]
}

const p = (text: string): PostBlock => ({ id: blockId(), type: 'paragraph', text })
const h = (text: string, level: 'h2' | 'h3' = 'h2'): PostBlock => ({ id: blockId(), type: 'heading', text, level })

export const POST_STYLES: PostStyle[] = [
  { key: 'classic', name: 'Classic', description: 'Clean article with a soft header', swatch: { bg: '#eef4f2', ink: '#0d4f4d', accent: '#d9b84d' }, starter: () => [p(''), h(''), p('')] },
  { key: 'magazine', name: 'Magazine', description: 'Title beside a large cover photo', swatch: { bg: '#ffffff', ink: '#0d4f4d', accent: '#146b68' }, starter: () => [p(''), { ...BLOCK_DEF.image.create() }, p('')] },
  { key: 'feature', name: 'Feature', description: 'Full-width photo with title on top', swatch: { bg: '#0b2f2e', ink: '#ffffff', accent: '#d9b84d' }, starter: () => [p(''), { ...BLOCK_DEF.quote.create() }, p('')] },
  { key: 'minimal', name: 'Minimal', description: 'Simple, text-first and calm', swatch: { bg: '#ffffff', ink: '#172b2b', accent: '#cbdad6' }, starter: () => [p(''), p('')] },
  { key: 'editorial', name: 'Editorial', description: 'Big serif type and a drop cap', swatch: { bg: '#fbf8f1', ink: '#172b2b', accent: '#d9b84d' }, starter: () => [p(''), { ...BLOCK_DEF.quote.create() }, p('')] },
  { key: 'research', name: 'Research brief', description: 'Key findings up front', swatch: { bg: '#f5f9f8', ink: '#0d4f4d', accent: '#146b68' }, starter: () => [{ ...BLOCK_DEF.stats.create() }, h('Key findings'), { id: blockId(), type: 'list', items: '', ordered: false }, h('Why it matters'), p(''), { id: blockId(), type: 'callout', title: 'What’s next', text: '', tone: 'tip' }] },
  { key: 'story', name: 'Story', description: 'Centred and spacious, for longer reads', swatch: { bg: '#ffffff', ink: '#0d4f4d', accent: '#d9b84d' }, starter: () => [p(''), { ...BLOCK_DEF.image.create() }, p('')] },
  { key: 'photo', name: 'Photo essay', description: 'Large images with short captions', swatch: { bg: '#111c1c', ink: '#ffffff', accent: '#d9b84d' }, starter: () => [{ ...BLOCK_DEF.image.create(), size: 'full' } as PostBlock, p(''), { ...BLOCK_DEF.image.create(), size: 'full' } as PostBlock, p('')] },
  { key: 'news', name: 'News bulletin', description: 'Short update with a dateline', swatch: { bg: '#ffffff', ink: '#172b2b', accent: '#146b68' }, starter: () => [p(''), p(''), { ...BLOCK_DEF.button.create() }] },
  { key: 'interview', name: 'Interview', description: 'Questions and answers', swatch: { bg: '#eef4f2', ink: '#0d4f4d', accent: '#146b68' }, starter: () => [p(''), { ...BLOCK_DEF.qa.create() }, { ...BLOCK_DEF.qa.create() }, { ...BLOCK_DEF.qa.create() }] },
  { key: 'spotlight', name: 'Spotlight', description: 'Dark, dramatic announcement', swatch: { bg: '#0d4f4d', ink: '#ffffff', accent: '#d9b84d' }, starter: () => [p(''), { ...BLOCK_DEF.callout.create(), tone: 'important' } as PostBlock, { ...BLOCK_DEF.button.create() }] },
  { key: 'event', name: 'Event recap', description: 'Date badge, highlights and photos', swatch: { bg: '#fbf6e6', ink: '#0d4f4d', accent: '#d9b84d' }, starter: () => [p(''), h('Highlights'), { id: blockId(), type: 'list', items: '', ordered: false }, { ...BLOCK_DEF.image.create() }, p('')] },
]

export const POST_STYLE: Record<string, PostStyle> = Object.fromEntries(POST_STYLES.map((s) => [s.key, s]))

// ---------------------------------------------------------------- helpers
export function blocksText(blocks: PostBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'heading': case 'paragraph': return b.text
        case 'imageText': return `${b.title} ${b.text}`
        case 'quote': return b.text
        case 'list': return b.items
        case 'callout': return `${b.title} ${b.text}`
        case 'stats': return b.items.map((i) => `${i.value} ${i.label}`).join(' ')
        case 'qa': return `${b.question} ${b.answer}`
        default: return ''
      }
    })
    .join(' ')
}

export function readingMinutesFromText(text: string): number {
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 220))
}

export function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return null
}

// ---------------------------------------------------------------- validation (server)
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')
const safeHref = (v: unknown) => {
  const s = str(v, 500).trim()
  return /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(s) ? s : ''
}
const safeSrc = (v: unknown) => {
  const s = str(v, 1000).trim()
  return /^(https:\/\/|\/)/i.test(s) ? s : ''
}
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T => (options.includes(v as T) ? (v as T) : fallback)

// Keeps only known block types and fields, with length and URL checks.
export function sanitizePostBlocks(input: unknown): PostBlock[] {
  if (!Array.isArray(input)) return []
  const out: PostBlock[] = []
  for (const raw of input.slice(0, 200)) {
    if (!raw || typeof raw !== 'object') continue
    const b = raw as Record<string, unknown>
    const id = /^[a-z0-9]{2,20}$/i.test(String(b.id)) ? String(b.id) : blockId()
    switch (b.type) {
      case 'heading': out.push({ id, type: 'heading', text: str(b.text, 300), level: oneOf(b.level, ['h2', 'h3'] as const, 'h2') }); break
      case 'paragraph': out.push({ id, type: 'paragraph', text: str(b.text, 10000) }); break
      case 'image': out.push({ id, type: 'image', src: safeSrc(b.src), alt: str(b.alt, 300), caption: str(b.caption, 500), size: oneOf(b.size, ['normal', 'wide', 'full'] as const, 'wide') }); break
      case 'imageText': out.push({ id, type: 'imageText', src: safeSrc(b.src), alt: str(b.alt, 300), title: str(b.title, 300), text: str(b.text, 5000), side: oneOf(b.side, ['left', 'right'] as const, 'left') }); break
      case 'quote': out.push({ id, type: 'quote', text: str(b.text, 2000), cite: str(b.cite, 200) }); break
      case 'list': out.push({ id, type: 'list', items: str(b.items, 5000), ordered: b.ordered === true }); break
      case 'callout': out.push({ id, type: 'callout', title: str(b.title, 200), text: str(b.text, 3000), tone: oneOf(b.tone, ['info', 'tip', 'important'] as const, 'info') }); break
      case 'stats': out.push({ id, type: 'stats', items: (Array.isArray(b.items) ? b.items : []).slice(0, 4).map((i: any) => ({ value: str(i?.value, 40), label: str(i?.label, 160) })) }); break
      case 'video': out.push({ id, type: 'video', url: safeHref(b.url), caption: str(b.caption, 500) }); break
      case 'qa': out.push({ id, type: 'qa', question: str(b.question, 1000), answer: str(b.answer, 10000) }); break
      case 'button': out.push({ id, type: 'button', label: str(b.label, 80), href: safeHref(b.href) }); break
      case 'divider': out.push({ id, type: 'divider' }); break
    }
  }
  return out
}
