import { getPageContent, image, lines, text } from '@/lib/cms/queries'
import { richHtml } from '@/lib/cms/rich'
import { makeNode } from './blocks'
import { listHtml, n } from './presets'
import { uid } from './tree'
import type { BuilderNode, PageDoc } from './types'

// Converts the original hardcoded pages into page-builder documents built
// from the same content (page_content rows + content collections), laid out
// to match the original design as closely as the block system allows.

const TINT = 'var(--tint)'

function pageHero(kicker: string, title: string, intro: string): BuilderNode {
  return n.section({ width: 'boxed', label: 'Page header' }, [n.eyebrow(kicker), n.heading(title, 'h1', 'display'), ...(intro ? [n.text(intro, { size: 'lead', muted: true }, { maxWidth: '760px' })] : [])], {
    background: { type: 'color', color: TINT },
    borderStyle: 'solid',
    borderWidth: '0 0 1px 0',
    borderColor: 'var(--border)',
    padding: { top: '92px', bottom: '76px' },
  })
}

async function home(): Promise<PageDoc> {
  const c = await getPageContent('home')
  const hero = image(c, 'hero_image')
  const feature = image(c, 'feature_image')
  const caption = [text(c, 'hero_image_caption_1'), text(c, 'hero_image_caption_2')].filter(Boolean).join(' · ')

  return {
    version: 1,
    sections: [
      n.section({ label: 'Hero' }, [
        n.columns(
          [
            [
              n.eyebrow(text(c, 'hero_eyebrow')),
              n.heading(text(c, 'hero_title'), 'h1', 'display'),
              n.text(text(c, 'hero_intro'), { size: 'lead', muted: true }, { maxWidth: '620px' }),
              n.row([n.button('Explore our research', '/research'), n.link('About PEARL', '/about')], { margin: { top: 'sm' } }),
            ],
            [n.image(hero?.url ?? '', "Hands joined together, representing PEARL's community-engaged research", { height: '500px', caption, lazy: false })],
          ],
          {},
          { alignItems: 'center', gap: '76px' }
        ),
      ], { background: { type: 'gradient', gradientFrom: 'var(--tint)', gradientTo: 'var(--background)', gradientAngle: 90 }, padding: { top: '88px', bottom: '72px' } }),

      n.section({ tone: 'light', label: 'Purpose statement' }, [
        n.columns([[n.eyebrow(text(c, 'statement_eyebrow'))], [n.heading(text(c, 'statement_title'), 'h2', 'default', { fontSize: 'clamp(30px, 4vw, 50px)', lineHeight: '1.15' }), n.link('Discover our approach', '/about')]], { ratio: '1-3' }, { gap: '60px' }),
      ], { background: { type: 'color', color: 'var(--primary)' }, padding: { top: '110px', bottom: '110px' } }),

      n.section({ label: 'Research streams' }, [
        n.eyebrow(text(c, 'streams_eyebrow')),
        n.heading(text(c, 'streams_title')),
        n.text(text(c, 'streams_body'), { muted: true }, { maxWidth: '650px', margin: { bottom: 'md' } }),
        n.block('research-areas', { variant: 'cards', homeOnly: true, linkLabel: 'Learn more', link: { href: '/research' } }),
        n.block('link', { label: 'View all research areas', link: { href: '/research' }, arrow: true }, { margin: { top: 'md', left: 'auto', right: 'auto' } }),
      ], { padding: { top: '110px', bottom: '110px' } }),

      n.section({ label: 'Featured project' }, [
        n.columns(
          [
            [n.image(feature?.url ?? '', 'Researcher working with fresh produce in a field', { height: '440px' })],
            [n.eyebrow(text(c, 'feature_eyebrow')), n.heading(text(c, 'feature_title')), n.text(text(c, 'feature_text'), { muted: true }), n.link('Explore the project', '/projects')],
          ],
          { ratio: '3-2' },
          { gap: '0px', alignItems: 'center', background: { type: 'color', color: TINT } }
        ),
      ], { padding: { top: '0px', bottom: '110px' } }),

      n.section({ label: 'Partners' }, [n.eyebrow(text(c, 'partners_eyebrow')), n.block('partners', { context: 'home', variant: 'marquee' })], { padding: { top: '72px', bottom: '72px' } }),

      n.section({ width: 'narrow', contentAlign: 'center', tone: 'light', label: 'Call to action' }, [
        n.eyebrow(text(c, 'cta_eyebrow')),
        n.heading(text(c, 'cta_title')),
        n.text(text(c, 'cta_text')),
        n.button('Connect with PEARL', '/contact', 'light', { align: 'center' }),
      ], { background: { type: 'color', color: 'var(--primary-dark)' }, padding: { top: '100px', bottom: '100px' } }),
    ].map(padFeatureColumn),
  }
}

// The featured-project text column had generous inner padding.
function padFeatureColumn(section: BuilderNode): BuilderNode {
  if (section.props.label !== 'Featured project') return section
  const cols = section.children?.[0]
  if (cols?.children?.[1]) cols.children[1].style = { desktop: { padding: { top: '50px', right: '50px', bottom: '50px', left: '50px' } }, mobile: { padding: { top: '28px', right: '24px', bottom: '28px', left: '24px' } } }
  return section
}

async function about(): Promise<PageDoc> {
  const c = await getPageContent('about')
  return {
    version: 1,
    sections: [
      pageHero(text(c, 'hero_kicker'), text(c, 'hero_title'), text(c, 'hero_intro')),
      n.section({ width: 'narrow', label: 'Mission' }, [n.eyebrow(text(c, 'mission_eyebrow')), n.heading(text(c, 'mission_title')), n.rich(richHtml(c, 'mission_body'))]),
      n.section({ width: 'narrow', label: 'Vision' }, [n.eyebrow(text(c, 'vision_eyebrow')), n.heading(text(c, 'vision_title'), 'h2', 'default', { fontSize: 'clamp(28px, 3.6vw, 44px)' }), n.rich(richHtml(c, 'vision_body'))], {
        background: { type: 'color', color: TINT },
      }),
      n.section({ label: 'Values' }, [n.eyebrow(text(c, 'values_eyebrow')), n.heading(text(c, 'values_title'), 'h2', 'default', { margin: { bottom: 'md' } }), n.block('values')], { background: { type: 'color', color: 'var(--surface)' } }),
      n.section({ label: 'Partners' }, [n.eyebrow(text(c, 'partners_eyebrow')), n.heading(text(c, 'partners_title')), n.rich(richHtml(c, 'partners_body'), { maxWidth: '720px', margin: { bottom: 'md' } }), n.block('partners', { context: 'about', variant: 'grid' })]),
    ],
  }
}

async function research(): Promise<PageDoc> {
  const c = await getPageContent('research')
  return {
    version: 1,
    sections: [
      pageHero(text(c, 'hero_kicker'), text(c, 'hero_title'), text(c, 'hero_intro')),
      n.section({ label: 'Research areas' }, [n.block('research-areas', { variant: 'rows', homeOnly: false, linkLabel: 'Discuss this area', link: { href: '/contact' } })], { padding: { top: '110px', bottom: '110px' } }),
    ],
  }
}

async function projects(): Promise<PageDoc> {
  const c = await getPageContent('projects')
  return {
    version: 1,
    sections: [
      pageHero(text(c, 'hero_kicker'), text(c, 'hero_title'), text(c, 'hero_intro')),
      // Project features include their own page-width containers.
      n.section({ width: 'full', label: 'Projects' }, [n.block('projects', { linkLabel: 'Discuss this project' })], { padding: { top: '0px', bottom: '0px' } }),
    ],
  }
}

async function team(): Promise<PageDoc> {
  const c = await getPageContent('team')
  return {
    version: 1,
    sections: [
      pageHero(text(c, 'hero_kicker'), text(c, 'hero_title'), text(c, 'hero_intro')),
      n.section({ label: 'Introduction' }, [
        n.columns([[n.eyebrow(text(c, 'intro_eyebrow')), n.heading(text(c, 'intro_title'))], [n.text(text(c, 'intro_body'), { muted: true })]], {}, { alignItems: 'flex-end', gap: '80px' }),
      ], {
        background: { type: 'color', color: 'var(--surface)' },
        borderStyle: 'solid',
        borderWidth: '1px 0',
        borderColor: 'var(--border)',
        padding: { top: '72px', bottom: '72px' },
      }),
      n.section({ label: 'Team' }, [
        n.eyebrow(text(c, 'leadership_eyebrow')),
        n.heading(text(c, 'leadership_title'), 'h2', 'default', { margin: { bottom: 'md' } }),
        n.block('team', { group: 'leadership', title: '', eyebrow: '' }),
        n.eyebrow(text(c, 'research_team_eyebrow')),
        n.heading(text(c, 'research_team_title')),
        n.block('team', { group: 'tfs', title: 'Transforming Food Systems', eyebrow: 'Current research stream' }),
        n.block('team', { group: 'ift', title: 'Inter-Facility Transfer System', eyebrow: 'Current research stream' }),
        n.block('team', { group: 'past', title: 'Past Contributors', eyebrow: 'Previous PEARL contributors' }),
      ], { background: { type: 'color', color: 'var(--surface)' }, padding: { top: '110px', bottom: '110px' } }),
      n.section({ tone: 'light', label: 'Call to action' }, [
        n.columns([[n.eyebrow(text(c, 'cta_eyebrow')), n.heading(text(c, 'cta_title'))], [n.block('link', { label: 'Start a conversation', link: { href: '/contact' }, arrow: true })]], { ratio: '2-1' }, { alignItems: 'center', gap: '40px' }),
      ], { background: { type: 'color', color: 'var(--primary-dark)' }, padding: { top: '72px', bottom: '72px' } }),
    ],
  }
}

const CONNECTION_TYPES = [
  'Community member', 'Community-based organization', 'Health or social-service organization', 'Health-system partner', 'Hospital or health centre',
  'Government / public-sector organization', 'Professional association', 'Advocacy organization', 'Researcher / academic', 'Student', 'Other',
]
const TOPICS = [
  'Community priority or concern', 'Research collaboration', 'Program evaluation', 'Quality improvement', 'Evidence synthesis', 'Knowledge mobilization',
  'Community consultation', 'Health-workforce planning', 'Student / practicum opportunity', 'Potential grant or proposal collaboration', 'Partnership / networking', 'Other',
]

// A bulleted list shown as a grid of highlighted cards.
function chipList(html: string): BuilderNode {
  const node = n.rich(html)
  node.advanced = { className: 'pb-chip-list' }
  return node
}

function field(label: string, kind: string, required = false, extra: Record<string, any> = {}) {
  return { id: uid(), label, kind, required, placeholder: '', options: '', half: false, ...extra }
}

async function contact(): Promise<PageDoc> {
  const c = await getPageContent('contact')
  const address = lines(c, 'address').join('\n')
  const formHeading = n.heading(text(c, 'form_title'))
  formHeading.advanced = { htmlId: 'send-a-message' }

  return {
    version: 1,
    sections: [
      pageHero(text(c, 'hero_kicker'), text(c, 'hero_title'), text(c, 'hero_intro')),
      n.section({ width: 'narrow', label: 'Community partnerships' }, [n.heading(text(c, 'partnerships_title')), n.rich(richHtml(c, 'partnerships_intro'))]),
      n.section({ label: 'Areas of interest' }, [n.heading(text(c, 'interests_title')), chipList(listHtml(lines(c, 'interests_list'))), n.text(text(c, 'interests_note'), { muted: true })], {
        background: { type: 'color', color: TINT },
      }),
      n.section({ label: 'How we can connect' }, [
        n.columns([
          [n.heading(text(c, 'connect_title'), 'h2'), n.text(text(c, 'connect_lead')), n.rich(listHtml(lines(c, 'connect_list'))), n.text(text(c, 'connect_note'), { muted: true })],
          [n.heading(text(c, 'approach_title'), 'h2'), n.rich(richHtml(c, 'approach_body')), n.text(text(c, 'approach_note'), { muted: false }, { fontWeight: '700' })],
        ], {}, { gap: '80px' }),
      ]),
      n.section({ label: 'Contact' }, [
        n.columns(
          [
            [
              n.heading(text(c, 'start_title')),
              n.rich(richHtml(c, 'start_body')),
              makeNode('contact-info', { props: { useSite: false, address, email: text(c, 'email').trim(), phone: '', hours: text(c, 'hours'), layout: 'cards' }, style: { desktop: { margin: { top: 'md' } } } }),
              n.button(text(c, 'cta_label') || 'Send us a message', '#send-a-message'),
            ],
            [
              formHeading,
              n.text(text(c, 'form_intro'), { muted: true }),
              makeNode('form', {
                props: {
                  formName: 'Contact PEARL',
                  appearance: 'card',
                  submitLabel: 'Send message',
                  notice: text(c, 'sensitive_notice'),
                  confirmationTitle: text(c, 'confirmation_title'),
                  confirmationMessage: text(c, 'confirmation_body'),
                  fields: [
                    field('Name', 'text', true, { half: true, placeholder: 'Your full name' }),
                    field('Email address', 'email', true, { half: true, placeholder: 'you@example.com' }),
                    field('Organization / Community / Affiliation', 'text', false, { half: true }),
                    field('What best describes your connection?', 'select', false, { half: true, options: CONNECTION_TYPES.join('\n') }),
                    field('What would you like to discuss?', 'select', true, { half: true, options: TOPICS.join('\n') }),
                    field('Organization / community / program involved', 'text', false, { half: true }),
                    field('Tell us more about your question, priority, or idea.', 'textarea', true, { placeholder: 'A few sentences is plenty — we’ll follow up with any questions.' }),
                    field('How would you like PEARL to connect with you?', 'radio', true, { options: 'Email\nPhone\nEither' }),
                    field('Phone number', 'tel', false, { half: true }),
                    field('Preferred contact time', 'text', false, { half: true, placeholder: 'e.g. weekday mornings' }),
                  ],
                },
              }),
            ],
          ],
          { ratio: '2-3' },
          { gap: '100px' }
        ),
      ], { background: { type: 'color', color: 'var(--surface)' }, padding: { top: '110px', bottom: '110px' } }),
    ],
  }
}

export const LEGACY_IMPORTERS: Record<string, () => Promise<PageDoc>> = { home, about, research, projects, team, contact }
