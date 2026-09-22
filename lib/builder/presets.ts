import { makeNode } from './blocks'
import type { LinkValue } from './links'
import type { BuilderNode, PageDoc, Style } from './types'

// Small helpers for composing documents in code (presets, templates and the
// import of the original pages).

export const n = {
  section(props: Record<string, any> = {}, children: BuilderNode[] = [], desktop: Style = {}, extra: Partial<BuilderNode> = {}) {
    return makeNode('section', { props, children, style: Object.keys(desktop).length ? { desktop } : undefined, ...extra })
  },
  eyebrow(text: string) {
    return makeNode('heading', { props: { text, level: 'p', preset: 'eyebrow' } })
  },
  heading(text: string, level = 'h2', preset = 'default', desktop?: Style) {
    return makeNode('heading', { props: { text, level, preset }, style: desktop ? { desktop } : undefined })
  },
  text(text: string, props: Record<string, any> = {}, desktop?: Style) {
    return makeNode('paragraph', { props: { text, size: 'normal', muted: false, ...props }, style: desktop ? { desktop } : undefined })
  },
  rich(html: string) {
    return makeNode('richtext', { props: { html } })
  },
  button(label: string, href: string, variant = 'primary', extra: Record<string, any> = {}) {
    return makeNode('button', { props: { label, link: { href } as LinkValue, variant, size: 'md', align: 'left', icon: true, ...extra } })
  },
  link(label: string, href: string) {
    return makeNode('link', { props: { label, link: { href } as LinkValue, arrow: true } })
  },
  image(src: string, alt: string, props: Record<string, any> = {}, desktop?: Style) {
    return makeNode('image', { props: { src, alt, caption: '', aspect: 'auto', fit: 'cover', focus: 'center', lazy: true, ...props }, style: desktop ? { desktop } : undefined })
  },
  columns(children: BuilderNode[][], props: Record<string, any> = {}, desktop: Style = {}) {
    return makeNode('columns', {
      props: { ratio: 'equal', stackOn: 'tablet', reverseOnStack: false, ...props },
      style: { desktop: { gap: '48px', alignItems: 'flex-start', ...desktop } },
      children: children.map((c) => makeNode('column', { children: c })),
    })
  },
  row(children: BuilderNode[], desktop: Style = {}) {
    return makeNode('group', { props: { direction: 'row', wrap: true }, children, style: { desktop: { gap: '24px', ...desktop } } })
  },
  grid(children: BuilderNode[], columns = '3', desktop: Style = {}) {
    return makeNode('grid', { props: { columns, tabletColumns: '2', mobileColumns: '1' }, children, style: { desktop: { gap: '24px', ...desktop } } })
  },
  card(title: string, text: string, extra: Record<string, any> = {}) {
    return makeNode('card', { props: { image: '', imageAlt: '', eyebrow: '', title, text, buttonLabel: 'Learn more', link: { href: '' }, icon: '', align: 'left', ...extra } })
  },
  block(type: string, props: Record<string, any> = {}, desktop?: Style) {
    return makeNode(type, { props, style: desktop ? { desktop } : undefined })
  },
  stack(children: BuilderNode[], desktop: Style = {}) {
    return makeNode('group', { props: { direction: 'column', wrap: false }, children, style: { desktop: { gap: '8px', ...desktop } } })
  },
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

export function paragraphsHtml(paragraphs: string[]): string {
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')
}

export function listHtml(items: string[]): string {
  return `<ul>${items.map((i) => `<li><p>${escapeHtml(i)}</p></li>`).join('')}</ul>`
}

const TINT = 'var(--tint)'
// Placeholder photo shipped in /public; admins swap it for their own images.
export const IMG = '/builder/placeholder.svg'

export type Preset = { key: string; label: string; description: string; icon: string; build: () => BuilderNode }

// Ready-made sections shown under "Sections" in the builder's Add panel.
export const SECTION_PRESETS: Preset[] = [
  {
    key: 'hero',
    label: 'Hero',
    icon: 'Sparkles',
    description: 'Big headline, intro, buttons and an image',
    build: () =>
      n.section({ width: 'boxed' }, [
        n.columns(
          [
            [
              n.eyebrow('Welcome'),
              n.heading('A clear, confident headline for this page', 'h1'),
              n.text('One or two sentences that explain what visitors will find here and why it matters.', { size: 'lead', muted: true }),
              n.row([n.button('Get started', '/contact'), n.link('Learn more', '/about')], { margin: { top: 'sm' } }),
            ],
            [n.image(IMG, 'Placeholder photo — replace with your own', { aspect: '4/3', lazy: false })],
          ],
          {},
          { alignItems: 'center', gap: '64px' }
        ),
      ], { background: { type: 'gradient', gradientFrom: 'var(--tint)', gradientTo: 'var(--background)', gradientAngle: 90 } }),
  },
  {
    key: 'page-header',
    label: 'Page header',
    icon: 'Heading',
    description: 'Title band for the top of an inner page',
    build: () =>
      n.section({ width: 'boxed' }, [n.eyebrow('Section'), n.heading('Page title', 'h1'), n.text('A short introduction to this page.', { size: 'lead', muted: true }, { maxWidth: '760px' })], {
        background: { type: 'color', color: TINT },
        borderStyle: 'solid',
        borderWidth: '0 0 1px 0',
        borderColor: 'var(--border)',
        padding: { top: '92px', bottom: '76px' },
      }),
  },
  {
    key: 'image-text',
    label: 'Image + text',
    icon: 'PanelLeft',
    description: 'An image beside a heading, text and link',
    build: () =>
      n.section({}, [
        n.columns([[n.image(IMG, 'Placeholder photo — replace with your own', { aspect: '4/3' })], [n.eyebrow('Feature'), n.heading('Tell a story with an image'), n.text('Describe the idea, project or service shown in the image.', { muted: true }), n.link('Read more', '/')]], {}, { alignItems: 'center', gap: '64px' }),
      ]),
  },
  {
    key: 'text-image',
    label: 'Text + image',
    icon: 'PanelRight',
    description: 'Text on the left, image on the right',
    build: () =>
      n.section({}, [
        n.columns([[n.eyebrow('Feature'), n.heading('Text first, image second'), n.text('Great for alternating sections down a page.', { muted: true }), n.button('Find out more', '/', 'outline')], [n.image(IMG, 'Placeholder photo — replace with your own', { aspect: '4/3' })]], { reverseOnStack: true }, { alignItems: 'center', gap: '64px' }),
      ]),
  },
  {
    key: 'cta',
    label: 'Call to action',
    icon: 'Megaphone',
    description: 'Dark band with a headline and button',
    build: () =>
      n.section({ width: 'narrow', contentAlign: 'center', tone: 'light' }, [
        n.eyebrow('Get involved'),
        n.heading('Ready to work together?'),
        n.text('Invite visitors to take the next step.', { size: 'lead' }),
        n.button('Contact us', '/contact', 'light', { align: 'center' }),
      ], { background: { type: 'color', color: 'var(--primary-dark)' }, padding: { top: '100px', bottom: '100px' } }),
  },
  {
    key: 'statement',
    label: 'Statement',
    icon: 'Quote',
    description: 'A bold statement on a coloured band',
    build: () =>
      n.section({ tone: 'light' }, [
        n.columns([[n.eyebrow('Our purpose')], [n.heading('A single, memorable sentence about why this work matters.'), n.link('Discover our approach', '/about')]], { ratio: '1-3' }, { gap: '60px' }),
      ], { background: { type: 'color', color: 'var(--primary)' } }),
  },
  {
    key: 'cards',
    label: 'Card grid',
    icon: 'LayoutGrid',
    description: 'Heading with three cards',
    build: () =>
      n.section({}, [
        n.eyebrow('What we do'),
        n.heading('Three things worth knowing'),
        n.grid([n.card('First item', 'A short description.', { icon: 'Lightbulb' }), n.card('Second item', 'A short description.', { icon: 'Users' }), n.card('Third item', 'A short description.', { icon: 'Target' })], '3', { margin: { top: 'sm' } }),
      ]),
  },
  {
    key: 'features',
    label: 'Features',
    icon: 'ListChecks',
    description: 'Icons with short descriptions in columns',
    build: () =>
      n.section({ contentAlign: 'center' }, [
        n.heading('Why it matters'),
        n.grid(
          ['Community-led', 'Evidence-based', 'Equity-focused'].map((t, i) =>
            n.card(t, 'Explain this point in a sentence or two.', { icon: ['Users', 'BarChart3', 'Scale'][i], buttonLabel: '', align: 'center' })
          ),
          '3',
          { margin: { top: 'sm' } }
        ),
      ]),
  },
  {
    key: 'faq',
    label: 'FAQ',
    icon: 'ListCollapse',
    description: 'Questions and answers',
    build: () => n.section({ width: 'narrow' }, [n.heading('Frequently asked questions'), makeNode('accordion')]),
  },
  {
    key: 'testimonials',
    label: 'Testimonials',
    icon: 'MessageSquareQuote',
    description: 'What people say',
    build: () => n.section({}, [n.eyebrow('Voices'), n.heading('What our partners say'), makeNode('testimonials')]),
  },
  {
    key: 'gallery',
    label: 'Gallery',
    icon: 'Images',
    description: 'A heading and a grid of photos',
    build: () => n.section({}, [n.heading('Gallery'), makeNode('gallery')]),
  },
  {
    key: 'contact',
    label: 'Contact',
    icon: 'Mail',
    description: 'Contact details beside a form',
    build: () =>
      n.section({}, [
        n.columns([[n.heading("Let's talk"), n.text('We would love to hear from you.', { muted: true }), n.block('contact-info', { useSite: true, layout: 'stack', hours: '' })], [makeNode('form')]], { ratio: '2-3' }, { gap: '80px' }),
      ], { background: { type: 'color', color: 'var(--surface)' } }),
  },
]


// Additional presets used by the page templates (also offered in the Add panel).
SECTION_PRESETS.push(
  {
    key: 'stats',
    label: 'Stats',
    icon: 'BarChart3',
    description: 'Key numbers in a row',
    build: () =>
      n.section({ contentAlign: 'center', tone: 'light' }, [
        n.grid(
          [
            ['25+', 'Community partners'],
            ['12', 'Active projects'],
            ['4', 'Research streams'],
            ['1,200', 'People reached'],
          ].map(([num, label]) =>
            n.stack([n.heading(num, 'p', 'display', { fontSize: 'clamp(2.4rem, 4vw, 3.4rem)' }), n.text(label)], { alignItems: 'center', gap: '4px' })
          ),
          '4',
          { gap: '32px' }
        ),
      ], { background: { type: 'color', color: 'var(--primary)' }, padding: { top: '72px', bottom: '72px' } }),
  },
  {
    key: 'steps',
    label: 'Steps / process',
    icon: 'ListChecks',
    description: 'Numbered steps explaining how it works',
    build: () =>
      n.section({}, [
        n.eyebrow('How it works'),
        n.heading('Three simple steps'),
        n.grid(
          ['Get in touch', 'Plan together', 'Make it happen'].map((t, i) =>
            n.card(t, 'Describe what happens at this step in one or two sentences.', { eyebrow: `Step 0${i + 1}`, buttonLabel: '' })
          ),
          '3',
          { margin: { top: 'sm' } }
        ),
      ]),
  },
  {
    key: 'pricing',
    label: 'Pricing',
    icon: 'CreditCard',
    description: 'Plans or options side by side',
    build: () =>
      n.section({ contentAlign: 'center' }, [
        n.eyebrow('Options'),
        n.heading('Choose what fits you'),
        n.grid(
          [
            ['Basic', '$0', 'For getting started'],
            ['Standard', '$49', 'Our most popular option'],
            ['Premium', '$99', 'Everything included'],
          ].map(([name, price, text], i) =>
            n.card(`${name} — ${price}`, `${text}. List what is included here.`, { eyebrow: i === 1 ? 'Recommended' : '', buttonLabel: 'Choose ' + name, link: { href: '/contact' }, align: 'center' })
          ),
          '3',
          { margin: { top: 'sm' } }
        ),
      ], { background: { type: 'color', color: 'var(--surface)' } }),
  },
  {
    key: 'people',
    label: 'People',
    icon: 'Users',
    description: 'Team members with photos',
    build: () =>
      n.section({}, [
        n.eyebrow('Our people'),
        n.heading('Meet the team'),
        n.grid(
          ['Alex Morgan', 'Sam Lee', 'Jordan Patel', 'Taylor Chen'].map((name) =>
            n.card(name, 'Role or title. A sentence about their work.', { image: IMG, imageAlt: `Portrait of ${name}`, buttonLabel: '' })
          ),
          '4',
          { margin: { top: 'sm' } }
        ),
      ]),
  },
  {
    key: 'timeline',
    label: 'Timeline',
    icon: 'Rows3',
    description: 'Milestones in order',
    build: () =>
      n.section({ width: 'narrow' }, [
        n.eyebrow('Our journey'),
        n.heading('Milestones'),
        ...['2021 — Where it began', '2023 — Growing together', '2025 — Looking ahead'].map((t) =>
          n.stack([n.heading(t, 'h3'), n.text('A short description of what happened at this point.', { muted: true })], { gap: '6px', padding: { left: 'md', top: 'xs', bottom: 'xs' }, borderStyle: 'solid', borderWidth: '0 0 0 3px', borderColor: 'var(--accent)' })
        ),
      ]),
  },
  {
    key: 'newsletter',
    label: 'Newsletter',
    icon: 'Mail',
    description: 'Sign-up call to action with a short form',
    build: () =>
      n.section({ width: 'narrow', contentAlign: 'center' }, [
        n.heading('Stay in the loop'),
        n.text('Get occasional updates about our work. No spam, unsubscribe anytime.', { muted: true }),
        makeNode('form', {
          props: {
            formName: 'Newsletter sign-up',
            submitLabel: 'Subscribe',
            notice: '',
            confirmationTitle: 'You are subscribed!',
            confirmationMessage: 'Thanks for signing up.',
            fields: [
              { id: 'xnlname01', label: 'Name', kind: 'text', required: false, placeholder: '', options: '', half: true },
              { id: 'xnlmail01', label: 'Email', kind: 'email', required: true, placeholder: '', options: '', half: true },
            ],
          },
        }),
      ], { background: { type: 'color', color: 'var(--tint)' } }),
  }
)
