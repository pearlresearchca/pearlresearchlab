import { Fragment, type ReactNode } from 'react'
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock, Info, Lightbulb, Sparkles } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { blocksText, embedUrl, readingMinutesFromText, type PostBlock } from '@/lib/blog/blocks'

// Renders a blog post in its chosen style. Used by the public article page
// and the admin preview, so what editors see is exactly what visitors get.

export type ArticlePost = {
  title: string
  excerpt: string
  author: string
  category: string
  style: string
  cover_image_url: string | null
  published_at: string | null
  blocks: PostBlock[]
}

export function formatPostDate(iso: string | null | undefined) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

// **bold**, *italic*, [label](url) and bare https:// links — no raw HTML.
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(((?:https?:\/\/|\/|mailto:)[^\s)]+)\)|(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1]) out.push(<strong key={k++}>{m[1]}</strong>)
    else if (m[2]) out.push(<em key={k++}>{m[2]}</em>)
    else if (m[3]) out.push(<a key={k++} href={m[4]}>{m[3]}</a>)
    else if (m[5]) out.push(<a key={k++} href={m[5]} rel="nofollow noopener">{m[5]}</a>)
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function paragraphs(text: string, className?: string) {
  return text
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para, i) => (
      <p key={i} className={className}>
        {para.split('\n').map((line, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {inline(line)}
          </Fragment>
        ))}
      </p>
    ))
}

const filled = (b: PostBlock) => {
  switch (b.type) {
    case 'divider': return true
    case 'heading': case 'paragraph': return !!b.text.trim()
    case 'image': return !!b.src
    case 'imageText': return !!(b.src || b.text.trim() || b.title.trim())
    case 'quote': return !!b.text.trim()
    case 'list': return !!b.items.trim()
    case 'callout': return !!(b.title.trim() || b.text.trim())
    case 'stats': return b.items.some((i) => i.value.trim())
    case 'video': return !!embedUrl(b.url)
    case 'qa': return !!(b.question.trim() || b.answer.trim())
    case 'button': return !!(b.label.trim() && b.href)
  }
}

const CALLOUT_ICON = { info: Info, tip: Lightbulb, important: Sparkles }

function Block({ block, index }: { block: PostBlock; index: number }) {
  const delay = Math.min(index, 4) * 40
  switch (block.type) {
    case 'paragraph':
      return <Reveal className="pa-p" delay={delay}>{paragraphs(block.text)}</Reveal>
    case 'heading':
      return <Reveal delay={delay}>{block.level === 'h3' ? <h3 className="pa-h3">{block.text}</h3> : <h2 className="pa-h2">{block.text}</h2>}</Reveal>
    case 'image':
      return (
        <Reveal as="section" className={`pa-figure pa-figure--${block.size}`} delay={delay}>
          <figure>
            <img src={block.src} alt={block.alt} loading="lazy" />
            {block.caption && <figcaption>{block.caption}</figcaption>}
          </figure>
        </Reveal>
      )
    case 'imageText':
      return (
        <Reveal className={`pa-split pa-split--${block.side}`} delay={delay}>
          {block.src && <img src={block.src} alt={block.alt} loading="lazy" />}
          <div>
            {block.title && <h3 className="pa-h3">{block.title}</h3>}
            {paragraphs(block.text)}
          </div>
        </Reveal>
      )
    case 'quote':
      return (
        <Reveal className="pa-quote" delay={delay}>
          <blockquote>
            <p>{inline(block.text)}</p>
            {block.cite && <cite>— {block.cite}</cite>}
          </blockquote>
        </Reveal>
      )
    case 'list': {
      const items = block.items.split('\n').map((s) => s.trim()).filter(Boolean)
      const List = block.ordered ? 'ol' : 'ul'
      return (
        <Reveal delay={delay}>
          <List className={block.ordered ? 'pa-list pa-list--ol' : 'pa-list'}>
            {items.map((item, i) => <li key={i}>{inline(item)}</li>)}
          </List>
        </Reveal>
      )
    }
    case 'callout': {
      const Icon = CALLOUT_ICON[block.tone]
      return (
        <Reveal className={`pa-callout pa-callout--${block.tone}`} delay={delay}>
          <Icon aria-hidden="true" />
          <div>
            {block.title && <p className="pa-callout-title">{block.title}</p>}
            {paragraphs(block.text)}
          </div>
        </Reveal>
      )
    }
    case 'stats': {
      const items = block.items.filter((i) => i.value.trim())
      return (
        <Reveal className="pa-stats" delay={delay}>
          {items.map((s, i) => (
            <div key={i}>
              <span className="pa-stat-value">{s.value}</span>
              <span className="pa-stat-label">{s.label}</span>
            </div>
          ))}
        </Reveal>
      )
    }
    case 'video': {
      const src = embedUrl(block.url)!
      return (
        <Reveal as="section" className="pa-figure pa-figure--wide" delay={delay}>
          <figure>
            <div className="pa-video"><iframe src={src} title={block.caption || 'Video'} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
            {block.caption && <figcaption>{block.caption}</figcaption>}
          </figure>
        </Reveal>
      )
    }
    case 'qa':
      return (
        <Reveal className="pa-qa" delay={delay}>
          <p className="pa-q"><span aria-hidden="true">Q</span>{block.question}</p>
          <div className="pa-a"><span aria-hidden="true">A</span><div>{paragraphs(block.answer)}</div></div>
        </Reveal>
      )
    case 'button':
      return (
        <Reveal className="pa-button" delay={delay}>
          <a href={block.href} className="button button-primary">{block.label} <ArrowUpRight aria-hidden="true" /></a>
        </Reveal>
      )
    case 'divider':
      return <hr className="pa-divider" />
  }
}

export function PostArticle({ post, legacyHtml, backHref = '/blogs' }: { post: ArticlePost; legacyHtml?: string; backHref?: string | null }) {
  const style = post.style || 'classic'
  const blocks = post.blocks.filter(filled)
  const minutes = readingMinutesFromText(blocksText(blocks) + ' ' + (legacyHtml ?? '').replace(/<[^>]+>/g, ' '))
  const date = formatPostDate(post.published_at)
  const day = post.published_at ? new Date(post.published_at) : null

  return (
    <article className={`pa pa--${style}`}>
      <header className="pa-hero">
        {post.cover_image_url && ['feature', 'magazine', 'spotlight', 'photo'].includes(style) && (
          <div className="pa-hero-media"><img src={post.cover_image_url} alt="" /></div>
        )}
        <div className="pa-hero-inner">
          {backHref && <a href={backHref} className="pa-back"><ArrowLeft aria-hidden="true" /> All stories</a>}
          {style === 'event' && day && (
            <span className="pa-datebadge" aria-hidden="true">
              <span>{day.toLocaleDateString('en-CA', { month: 'short', timeZone: 'UTC' })}</span>
              <strong>{day.getUTCDate()}</strong>
            </span>
          )}
          <div className="pa-meta">
            {style === 'news' && <span className="pa-dateline"><CalendarDays aria-hidden="true" /> {date || 'Draft'}</span>}
            {style === 'research' && <span className="pa-kicker">Research brief</span>}
            {post.category && <span className="pa-chip">{post.category}</span>}
            {style !== 'news' && date && <time dateTime={post.published_at ?? undefined}>{date}</time>}
            <span className="pa-read"><Clock aria-hidden="true" /> {minutes} min read</span>
          </div>
          <h1 className="pa-title">{post.title || 'Untitled post'}</h1>
          {post.excerpt && <p className="pa-lead">{post.excerpt}</p>}
          {post.author && <p className="pa-byline">By <strong>{post.author}</strong></p>}
        </div>
      </header>

      {post.cover_image_url && !['feature', 'magazine', 'spotlight', 'photo', 'minimal', 'news'].includes(style) && (
        <figure className="pa-cover"><img src={post.cover_image_url} alt="" /></figure>
      )}

      <div className="pa-body">
        {blocks.map((b, i) => <Block block={b} index={i} key={b.id} />)}
        {legacyHtml && <div className="pb-rich pa-legacy" dangerouslySetInnerHTML={{ __html: legacyHtml }} />}
        {blocks.length === 0 && !legacyHtml && <p className="pa-empty">This post doesn’t have any content yet.</p>}
      </div>
    </article>
  )
}
