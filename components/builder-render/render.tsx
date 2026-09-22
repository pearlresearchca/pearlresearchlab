import type { CSSProperties, ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { BuilderNode, PageDoc } from '@/lib/builder/types'
import { docCss, safeCssValue, safeUrl } from '@/lib/builder/styles'
import { isEmbedUrl } from '@/lib/builder/blocks'
import { linkAttrs, resolveLink, type LinkValue } from '@/lib/builder/links'
import { ICONS, SOCIAL_LABELS, SocialIcon } from './icons'
import { AnimateOnScroll, FormBlock, GalleryBlock, TabsBlock } from './client'
import { ResearchAreasBlock, TeamBlock, ProjectsBlock, PartnersBlock, ValuesBlock } from './site-blocks'
import type { RenderContext } from './context'

const SAFE_TOKEN = /^[A-Za-z0-9_ -]*$/

// Shown in the builder where an image hasn't been chosen yet, so editors can
// see the layout (and resize it) before uploading anything.
function ImagePlaceholder({ onPick, compact = false, label }: { onPick?: () => void; compact?: boolean; label?: string }) {
  return (
    <div className={`pb-img-placeholder${compact ? ' pb-img-placeholder--compact' : ''}`}>
      <svg viewBox="0 0 64 48" width={compact ? 40 : 64} height={compact ? 30 : 48} aria-hidden="true">
        <rect x="1" y="1" width="62" height="46" rx="6" fill="none" stroke="currentColor" strokeWidth="2" opacity=".5" />
        <circle cx="20" cy="16" r="5" fill="currentColor" opacity=".55" />
        <path d="M6 42l16-16 10 10 8-8 18 14z" fill="currentColor" opacity=".45" />
      </svg>
      {!compact && <span className="pb-img-placeholder-title">Image placeholder</span>}
      {label && <span className="pb-img-placeholder-hint">{label}</span>}
      {onPick && (
        <button type="button" className="pb-img-placeholder-btn" onClick={(e) => (e.stopPropagation(), onPick())}>
          Choose image
        </button>
      )}
    </div>
  )
}

function baseAttrs(node: BuilderNode, rc: RenderContext, classes: string) {
  const adv = node.advanced
  const a = node.animation
  const fx = a?.type && a.type !== 'none' && /^[a-z-]+$/.test(a.type) ? a.type : null
  // In the editor blocks stay visible (effects are previewed on demand).
  const anim = fx ? (rc.editor ? ` pb-anim-fx--${fx}` : ` pb-anim pb-anim-fx--${fx}${a?.repeat ? ' pb-anim--repeat' : ''}`) : ''
  const hover = a?.hover && a.hover !== 'none' && /^[a-z]+$/.test(a.hover) ? ` pb-hover--${a.hover}` : ''
  const extraClass = adv?.className && SAFE_TOKEN.test(adv.className) ? ` ${adv.className}` : ''
  const id = adv?.htmlId && /^[A-Za-z][A-Za-z0-9_-]*$/.test(adv.htmlId) ? adv.htmlId : undefined
  // Per-device hiding is done with container-query classes (see builder.css).
  const hide = (['desktop', 'tablet', 'mobile'] as const).filter((d) => node.style?.[d]?.display === 'none').map((d) => ` pb-hide-${d}`).join('')
  return {
    className: `${classes} n-${node.id}${extraClass}${anim}${hover}${hide}`,
    id,
    ...(rc.editor ? { 'data-node-id': node.id, 'data-node-type': node.type, ...(node.hidden ? { 'data-pb-hidden': '' } : {}) } : {}),
  }
}

function link(rc: RenderContext, value: LinkValue | undefined) {
  return resolveLink(value, rc.data.pageSlugs)
}

export function RenderChildren({ node, rc }: { node: BuilderNode; rc: RenderContext }) {
  const children = node.children ?? []
  const visible = rc.editor ? children : children.filter((c) => !c.hidden)
  if (visible.length === 0 && rc.editor) return <>{rc.editor.emptyContainer(node)}</>
  return (
    <>
      {visible.map((child) => (
        <NodeView key={child.id} node={child} rc={rc} />
      ))}
    </>
  )
}

function text(rc: RenderContext, node: BuilderNode, key: string, tag: string, className: string, extra: Record<string, unknown> = {}): ReactNode {
  if (rc.editor && rc.editor.editingId === node.id) return rc.editor.inlineText(node, key, tag, className, extra)
  const Tag = tag as 'p'
  return (
    <Tag className={className} {...extra}>
      {String(node.props[key] ?? '')}
    </Tag>
  )
}

const RATIOS: Record<string, number[]> = {
  '2-1': [2, 1],
  '1-2': [1, 2],
  '3-2': [3, 2],
  '2-3': [2, 3],
  '1-3': [1, 3],
  '3-1': [3, 1],
}

function youtubeOrVimeo(url: string, opts: { autoplay: boolean; loop: boolean; controls: boolean }): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/)
  if (yt) {
    const q = new URLSearchParams({ rel: '0' })
    if (opts.autoplay) q.set('autoplay', '1'), q.set('mute', '1')
    if (opts.loop) q.set('loop', '1'), q.set('playlist', yt[1])
    if (!opts.controls) q.set('controls', '0')
    return `https://www.youtube-nocookie.com/embed/${yt[1]}?${q}`
  }
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vm) {
    const q = new URLSearchParams({ dnt: '1' })
    if (opts.autoplay) q.set('autoplay', '1'), q.set('muted', '1')
    if (opts.loop) q.set('loop', '1')
    if (!opts.controls) q.set('controls', '0')
    return `https://player.vimeo.com/video/${vm[1]}?${q}`
  }
  return null
}

export function NodeView({ node, rc }: { node: BuilderNode; rc: RenderContext }): ReactNode {
  const p = node.props ?? {}

  switch (node.type) {
    case 'section': {
      const bg = node.style?.desktop?.background
      const video = bg?.type === 'video' ? safeUrl(bg.video) : null
      const overlay = bg && bg.overlayColor && (bg.type === 'image' || bg.type === 'video') ? safeCssValue(bg.overlayColor) : null
      const classes = [
        'pb-section',
        `pb-width-${p.width ?? 'boxed'}`,
        `pb-align-${p.contentAlign ?? 'left'}`,
        `pb-valign-${p.verticalAlign ?? 'top'}`,
        p.tone === 'light' ? 'pb-tone-light' : '',
      ].join(' ')
      return (
        <section {...baseAttrs(node, rc, classes)} aria-label={p.label || undefined}>
          {video && <video className="pb-bg-video" src={video} autoPlay muted loop playsInline aria-hidden="true" />}
          {overlay && <div className="pb-overlay" style={{ background: overlay, opacity: Math.max(0, Math.min(1, Number(bg?.overlayOpacity ?? 0.5))) }} aria-hidden="true" />}
          <div className="pb-inner">
            <RenderChildren node={node} rc={rc} />
          </div>
        </section>
      )
    }

    case 'columns': {
      const count = Math.max(1, node.children?.length ?? 1)
      const ratio = RATIOS[p.ratio as string]
      const cols = ratio && ratio.length === count ? ratio.map((r) => `${r}fr`).join(' ') : `repeat(${count}, minmax(0, 1fr))`
      const classes = `pb-columns${p.stackOn && p.stackOn !== 'never' ? ` pb-stack-${p.stackOn}` : ''}${p.reverseOnStack ? ' pb-reverse' : ''}`
      return (
        <div {...baseAttrs(node, rc, classes)} style={{ '--pb-cols': cols } as CSSProperties}>
          {(node.children ?? []).map((child, i) => (
            <ColumnView key={child.id} node={child} rc={rc} index={i} />
          ))}
        </div>
      )
    }

    case 'column':
      return <ColumnView node={node} rc={rc} index={0} />

    case 'group':
      return (
        <div {...baseAttrs(node, rc, `pb-group${p.direction === 'row' ? ' pb-group--row' : ''}${p.wrap !== false ? ' pb-group--wrap' : ''}`)}>
          <RenderChildren node={node} rc={rc} />
        </div>
      )

    case 'grid':
      return (
        <div
          {...baseAttrs(node, rc, 'pb-grid')}
          style={{ '--pb-grid-cols': Number(p.columns) || 3, '--pb-grid-cols-t': Number(p.tabletColumns) || 2, '--pb-grid-cols-m': Number(p.mobileColumns) || 1 } as CSSProperties}
        >
          <RenderChildren node={node} rc={rc} />
        </div>
      )

    case 'heading': {
      const level = /^(h[1-6]|p)$/.test(p.level) ? p.level : 'h2'
      const cls = `pb-heading pb-heading--${level}${p.preset && p.preset !== 'default' ? ` pb-heading--${p.preset}` : ''}`
      const attrs = baseAttrs(node, rc, cls)
      const l = link(rc, p.link)
      if (rc.editor && rc.editor.editingId === node.id) return rc.editor.inlineText(node, 'text', level, attrs.className, attrs)
      const Tag = level as 'h2'
      return <Tag {...attrs}>{l ? <a {...linkAttrs(l)}>{p.text}</a> : p.text}</Tag>
    }

    case 'paragraph': {
      const cls = `pb-text pb-text--${p.size ?? 'normal'}${p.muted ? ' pb-text--muted' : ''}`
      const attrs = baseAttrs(node, rc, cls)
      return text(rc, node, 'text', 'p', attrs.className, attrs)
    }

    case 'richtext': {
      const attrs = baseAttrs(node, rc, 'pb-rich')
      if (rc.editor && rc.editor.editingId === node.id) return <div {...attrs}>{rc.editor.richText(node, '')}</div>
      return <div {...attrs} dangerouslySetInnerHTML={{ __html: rc.html('richtext', String(p.html ?? '')) }} />
    }

    case 'html':
      return <div {...baseAttrs(node, rc, 'pb-html')} dangerouslySetInnerHTML={{ __html: rc.html('html', String(p.html ?? '')) }} />

    case 'image': {
      const src = safeUrl(p.src)
      const attrs = baseAttrs(node, rc, 'pb-figure')
      const frameStyle: CSSProperties = {}
      if (p.height) frameStyle.height = safeCssValue(p.height) ?? undefined
      else if (p.aspect && p.aspect !== 'auto') frameStyle.aspectRatio = safeCssValue(p.aspect) ?? undefined
      const imgStyle: CSSProperties = { objectFit: p.fit === 'contain' ? 'contain' : 'cover', objectPosition: safeCssValue(p.focus) ?? 'center' }
      if (!frameStyle.height && !frameStyle.aspectRatio) imgStyle.height = 'auto'
      // No image chosen yet: a placeholder in the builder, nothing on the live site.
      if (!src && !rc.editor) return null
      const img = src ? (
        <img src={src} alt={p.alt ?? ''} loading={p.lazy === false ? 'eager' : 'lazy'} decoding="async" style={imgStyle} />
      ) : (
        <ImagePlaceholder onPick={rc.editor?.pickImage ? () => rc.editor!.pickImage!(node.id) : undefined} />
      )
      if (!src && !frameStyle.height && !frameStyle.aspectRatio) frameStyle.aspectRatio = '16/9'
      const l = link(rc, p.link)
      return (
        <figure {...attrs}>
          <div className="pb-img-frame" style={frameStyle}>
            {l && src ? <a {...linkAttrs(l)}>{img}</a> : img}
          </div>
          {p.caption && <figcaption>{p.caption}</figcaption>}
        </figure>
      )
    }

    case 'button': {
      const l = link(rc, p.link)
      const hover: Record<string, string> = {}
      const hb = safeCssValue(p.hoverBackground)
      const hc = safeCssValue(p.hoverColor)
      if (hb) hover['--pb-hover-bg'] = hb
      if (hc) hover['--pb-hover-color'] = hc
      const attrs = baseAttrs(node, rc, `pb-btn pb-btn--${p.variant ?? 'primary'} pb-btn--${p.size ?? 'md'}`)
      const editing = rc.editor && rc.editor.editingId === node.id
      const showIcon = p.icon !== false
      return (
        <div className={`pb-btn-wrap pb-btn-wrap--${p.align ?? 'left'}`}>
          {editing ? (
            <span {...attrs} style={hover as CSSProperties}>
              {rc.editor!.inlineText(node, 'label', 'span', '', {})}
              {showIcon && <ArrowUpRight aria-hidden="true" />}
            </span>
          ) : (
            <a {...attrs} {...linkAttrs(l)} style={hover as CSSProperties}>
              {p.label}
              {showIcon && <ArrowUpRight aria-hidden="true" />}
              {l?.newTab && <span className="sr-only"> (opens in a new tab)</span>}
            </a>
          )}
        </div>
      )
    }

    case 'link': {
      const l = link(rc, p.link)
      const attrs = baseAttrs(node, rc, 'pb-link')
      if (rc.editor && rc.editor.editingId === node.id) {
        return (
          <span {...attrs}>
            {rc.editor.inlineText(node, 'label', 'span', '', {})}
            {p.arrow !== false && <ArrowUpRight aria-hidden="true" />}
          </span>
        )
      }
      return (
        <a {...attrs} {...linkAttrs(l)}>
          {p.label}
          {p.arrow !== false && <ArrowUpRight aria-hidden="true" />}
        </a>
      )
    }

    case 'divider': {
      const style: CSSProperties = {
        borderTopStyle: (['solid', 'dashed', 'dotted'].includes(p.lineStyle) ? p.lineStyle : 'solid') as CSSProperties['borderTopStyle'],
        borderTopWidth: safeCssValue(p.thickness) ?? '1px',
        width: safeCssValue(p.length) ?? '100%',
      }
      const color = safeCssValue(p.color)
      if (color) style.borderTopColor = color
      return <hr {...baseAttrs(node, rc, 'pb-divider')} style={style} />
    }

    case 'spacer':
      return <div {...baseAttrs(node, rc, 'pb-spacer')} aria-hidden="true" />

    case 'quote': {
      const attrs = baseAttrs(node, rc, `pb-quote pb-quote--${p.variant ?? 'bar'}`)
      return (
        <figure {...attrs}>
          <blockquote style={{ margin: 0 }}>{text(rc, node, 'text', 'p', '')}</blockquote>
          {p.cite && <cite>— {p.cite}</cite>}
        </figure>
      )
    }

    case 'icon': {
      const Icon = ICONS[p.name as string] ?? ICONS.Star
      const size = Number(p.size) || 32
      const color = safeCssValue(p.color)
      return (
        <div {...baseAttrs(node, rc, `pb-icon-wrap pb-icon-wrap--${p.align ?? 'left'}`)}>
          <Icon className="pb-icon" width={size} height={size} style={color ? { color } : undefined} aria-hidden={p.label ? undefined : true} aria-label={p.label || undefined} role={p.label ? 'img' : undefined} />
        </div>
      )
    }

    case 'gallery': {
      const images = ((p.images ?? []) as { id: string; src: string; alt: string; caption: string }[])
        .map((img) => ({ ...img, src: safeUrl(img.src) ?? '' }))
        .filter((img) => img.src)
      return (
        <div {...baseAttrs(node, rc, 'pb-gallery-wrap')}>
          {images.length === 0 && rc.editor ? (
            <div className="pb-gallery" style={{ '--pb-gallery-cols': Number(p.columns) || 3, '--pb-gallery-gap': safeCssValue(p.gap) ?? '16px' } as CSSProperties}>
              {Array.from({ length: Number(p.columns) || 3 }, (_, i) => (
                <div key={i} className="pb-gallery-frame" style={{ aspectRatio: safeCssValue(p.aspect) !== 'auto' ? safeCssValue(p.aspect) ?? '4/3' : '4/3' }}>
                  <ImagePlaceholder compact label={i === 0 ? 'Add gallery images in the panel' : undefined} />
                </div>
              ))}
            </div>
          ) : images.length === 0 ? null : (
            <GalleryBlock
              images={images}
              columns={Number(p.columns) || 3}
              gap={safeCssValue(p.gap) ?? '16px'}
              aspect={safeCssValue(p.aspect) ?? '4/3'}
              lightbox={!!p.lightbox && !rc.editor}
              captions={!!p.captions}
            />
          )}
        </div>
      )
    }

    case 'video': {
      const url = typeof p.url === 'string' ? p.url.trim() : ''
      const aspect = safeCssValue(p.aspect) ?? '16/9'
      const attrs = baseAttrs(node, rc, 'pb-video')
      const style: CSSProperties = { aspectRatio: aspect }
      if (!url) return <div {...attrs} style={style}><div className="pb-img-empty" style={{ position: 'absolute', inset: 0 }}>{rc.editor ? 'Add a video link in the panel on the right' : null}</div></div>
      const opts = { autoplay: !!p.autoplay, loop: !!p.loop, controls: p.controls !== false }
      if (isEmbedUrl(url)) {
        const embed = youtubeOrVimeo(url, opts)
        return (
          <div {...attrs} style={style}>
            {embed && <iframe src={embed} title={p.title || 'Video'} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={rc.editor ? { pointerEvents: 'none' } : undefined} />}
          </div>
        )
      }
      const src = safeUrl(url)
      return (
        <div {...attrs} style={style}>
          {src && (
            <video
              src={src}
              poster={safeUrl(p.poster) ?? undefined}
              controls={opts.controls}
              // Browsers only allow autoplay without sound; enforce it.
              autoPlay={opts.autoplay && !rc.editor}
              muted={opts.autoplay || !!p.muted}
              loop={opts.loop}
              playsInline
              preload="metadata"
              aria-label={p.title || undefined}
            />
          )}
        </div>
      )
    }

    case 'embed': {
      const src = typeof p.url === 'string' && /^https:\/\//i.test(p.url.trim()) ? p.url.trim() : null
      const height = safeCssValue(p.height) ?? '480px'
      if (!src) return <div {...baseAttrs(node, rc, 'pb-embed-wrap')}><div className="pb-img-empty">{rc.editor ? 'Paste an https:// embed link in the panel on the right' : null}</div></div>
      return (
        <div {...baseAttrs(node, rc, 'pb-embed-wrap')}>
          <iframe
            className="pb-embed"
            src={src}
            title={p.title || 'Embedded content'}
            style={{ height, pointerEvents: rc.editor ? 'none' : undefined }}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )
    }

    case 'card': {
      const l = link(rc, p.link)
      const img = safeUrl(p.image)
      const Icon = p.icon ? ICONS[p.icon as string] : null
      return (
        <article {...baseAttrs(node, rc, `pb-card pb-card--${p.align ?? 'left'}`)}>
          {img && (
            <div className="pb-card-media">
              <img src={img} alt={p.imageAlt ?? ''} loading="lazy" decoding="async" />
            </div>
          )}
          <div className="pb-card-body">
            {!img && Icon && <Icon className="pb-card-icon" aria-hidden="true" />}
            {p.eyebrow && <span className="pb-card-eyebrow">{p.eyebrow}</span>}
            {p.title && <h3>{p.title}</h3>}
            {p.text && <p>{p.text}</p>}
            {l && (p.buttonLabel ? (
              <a className="pb-link pb-card-stretched" {...linkAttrs(l)}>
                {p.buttonLabel}
                <ArrowUpRight aria-hidden="true" />
              </a>
            ) : (
              <a className="pb-card-stretched" {...linkAttrs(l)} aria-label={p.title || 'Open'} />
            ))}
          </div>
        </article>
      )
    }

    case 'accordion': {
      const items = (p.items ?? []) as { id: string; title: string; body: string }[]
      const schema = p.faqSchema && !rc.editor && items.length > 0
        ? JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: items.map((i) => ({ '@type': 'Question', name: i.title, acceptedAnswer: { '@type': 'Answer', text: i.body } })),
          }).replace(/</g, '\\u003c')
        : null
      return (
        <div {...baseAttrs(node, rc, 'pb-accordion')}>
          {items.map((item, i) => (
            <details key={item.id} open={(p.openFirst && i === 0) || undefined}>
              <summary>{item.title}</summary>
              <div className="pb-accordion-body">{item.body}</div>
            </details>
          ))}
          {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />}
        </div>
      )
    }

    case 'tabs':
      return (
        <div {...baseAttrs(node, rc, 'pb-tabs')}>
          <TabsBlock items={(p.items ?? []) as { id: string; label: string; body: string }[]} idPrefix={node.id} />
        </div>
      )

    case 'testimonials': {
      const items = (p.items ?? []) as { id: string; quote: string; name: string; role: string; avatar: string }[]
      return (
        <div {...baseAttrs(node, rc, 'pb-testimonials')} style={{ '--pb-cols-n': Number(p.columns) || 2 } as CSSProperties}>
          {items.map((t) => (
            <figure key={t.id} className="pb-testimonial">
              <blockquote>“{t.quote}”</blockquote>
              <figcaption>
                {safeUrl(t.avatar) && <img src={safeUrl(t.avatar)!} alt="" loading="lazy" />}
                <span>
                  <strong>{t.name}</strong>
                  {t.role && <span>{t.role}</span>}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )
    }

    case 'social': {
      const links = (p.useSite ? rc.data.site.social : (p.links ?? [])) as { id: string; platform: string; url: string }[]
      const size = Number(p.size) || 28
      return (
        <div {...baseAttrs(node, rc, `pb-social pb-social--${p.align ?? 'left'}`)}>
          {links.map((s) => {
            const href = s.platform === 'email' && s.url && !s.url.startsWith('mailto:') ? `mailto:${s.url}` : s.url
            const l = resolveLink({ href }, rc.data.pageSlugs)
            if (!l) return null
            return (
              <a key={s.id} href={l.href} {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} aria-label={SOCIAL_LABELS[s.platform] ?? s.platform}>
                <SocialIcon platform={s.platform} size={size} />
              </a>
            )
          })}
          {links.length === 0 && rc.editor && <span className="pb-text--muted pb-text--small">Add social links in Site settings or in this block</span>}
        </div>
      )
    }

    case 'contact-info': {
      const site = rc.data.site
      const address = p.useSite ? site.address : p.address
      const email = p.useSite ? site.contactEmail : p.email
      const phone = p.useSite ? site.phone : p.phone
      return (
        <div {...baseAttrs(node, rc, `pb-contact${p.layout === 'stack' ? ' pb-contact--stack' : ''}`)}>
          {address && (
            <p>
              <strong>Address</strong>
              {address}
            </p>
          )}
          {p.hours && (
            <p>
              <strong>Hours</strong>
              {p.hours}
            </p>
          )}
          {email && (
            <p>
              <strong>Email</strong>
              <a href={`mailto:${email}`}>{email}</a>
            </p>
          )}
          {phone && (
            <p>
              <strong>Phone</strong>
              <a href={`tel:${String(phone).replace(/[^\d+]/g, '')}`}>{phone}</a>
            </p>
          )}
        </div>
      )
    }

    case 'form':
      return (
        <div {...baseAttrs(node, rc, 'pb-form-wrap')}>
          <FormBlock pageId={rc.pageId ?? ''} nodeId={node.id} props={p} preview={!!rc.editor} />
        </div>
      )

    case 'research-areas':
      return (
        <div {...baseAttrs(node, rc, 'pb-site-block')}>
          <ResearchAreasBlock areas={rc.data.researchAreas ?? []} props={p} link={link(rc, p.link)} />
        </div>
      )

    case 'team':
      return (
        <div {...baseAttrs(node, rc, 'pb-site-block')}>
          <TeamBlock members={rc.data.team ?? []} props={p} />
        </div>
      )

    case 'projects':
      return (
        <div {...baseAttrs(node, rc, 'pb-site-block')}>
          <ProjectsBlock projects={rc.data.projects ?? []} partners={rc.data.partners ?? {}} props={p} />
        </div>
      )

    case 'partners':
      return (
        <div {...baseAttrs(node, rc, 'pb-site-block')}>
          <PartnersBlock logos={rc.data.partners?.[p.context as string] ?? []} variant={p.variant} />
        </div>
      )

    case 'values':
      return (
        <div {...baseAttrs(node, rc, 'pb-site-block')}>
          <ValuesBlock values={rc.data.values ?? []} />
        </div>
      )

    case 'global': {
      const entry = rc.data.globalBlocks?.[p.blockId as string]
      const stack = rc.globalStack ?? []
      const attrs = baseAttrs(node, rc, 'pb-global')
      if (!entry || stack.includes(p.blockId)) {
        return rc.editor ? <div {...attrs}><div className="pb-empty-drop">This global block was deleted.</div></div> : null
      }
      // Global block content isn't individually editable in the page; it's
      // edited once under Content → Reusable blocks.
      const inner: RenderContext = { ...rc, editor: undefined, globalStack: [...stack, p.blockId] }
      return (
        <div {...attrs} style={{ display: rc.editor ? 'block' : 'contents' }}>
          <NodeView node={entry.block} rc={inner} />
        </div>
      )
    }

    default:
      return rc.editor ? <div {...baseAttrs(node, rc, 'pb-empty-drop')}>Unknown block “{node.type}”</div> : null
  }
}

function ColumnView({ node, rc, index }: { node: BuilderNode; rc: RenderContext; index: number }) {
  if (node.hidden && !rc.editor) return null
  return (
    <div {...baseAttrs(node, rc, 'pb-column')} style={{ '--pb-i': index } as CSSProperties}>
      <RenderChildren node={node} rc={rc} />
    </div>
  )
}

// Renders a whole page body: scoped styles, sections and (on the public site)
// the scroll-animation observer.
export function PageBody({ doc, rc, className = '' }: { doc: PageDoc; rc: RenderContext; className?: string }) {
  const globalDocs = Object.values(rc.data.globalBlocks ?? {}).map((g) => g.block)
  const css = docCss({ sections: [...doc.sections, ...globalDocs] })
  const sections = rc.editor ? doc.sections : doc.sections.filter((s) => !s.hidden)
  return (
    <div className={`pb-page ${className}`}>
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      {sections.map((s) => (
        <NodeView key={s.id} node={s} rc={rc} />
      ))}
      {!rc.editor && <AnimateOnScroll />}
    </div>
  )
}
