import { IMG, SECTION_PRESETS, n } from './presets'
import { makeNode } from './blocks'
import type { BuilderNode, PageDoc } from './types'

// Ready-made page designs. Picking one when creating a page (or on an empty
// page) fills it with a complete, styled layout; everything stays editable.
// Admins can add their own with "Save as template".

const preset = (key: string) => SECTION_PRESETS.find((p) => p.key === key)!.build()
const doc = (...sections: BuilderNode[]): PageDoc => ({ version: 1, sections })
const TINT = '#eaf1ef'
const PH = 'Placeholder photo — replace with your own'

export type TemplateCategory = 'basic' | 'landing' | 'about' | 'services' | 'contact' | 'blog' | 'portfolio' | 'team' | 'events' | 'help' | 'research' | 'careers'

export const TEMPLATE_CATEGORIES: { key: TemplateCategory; label: string }[] = [
  { key: 'basic', label: 'Basic' },
  { key: 'landing', label: 'Landing' },
  { key: 'about', label: 'About' },
  { key: 'services', label: 'Services & pricing' },
  { key: 'contact', label: 'Contact' },
  { key: 'blog', label: 'Blog & news' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'team', label: 'Team' },
  { key: 'events', label: 'Events' },
  { key: 'help', label: 'FAQ & help' },
  { key: 'research', label: 'Research' },
  { key: 'careers', label: 'Careers' },
]

export type BuiltinTemplate = { key: string; name: string; description: string; category: TemplateCategory; build: () => PageDoc }

function pageHeader(eyebrow: string, title: string, intro: string, center = false) {
  return n.section({ contentAlign: center ? 'center' : 'left', label: 'Page header' }, [
    n.eyebrow(eyebrow),
    n.heading(title, 'h1'),
    n.text(intro, { size: 'lead', muted: true }, { maxWidth: '760px' }),
  ], { background: { type: 'color', color: TINT }, borderStyle: 'solid', borderWidth: '0 0 1px 0', borderColor: 'var(--border)', padding: { top: '92px', bottom: '76px' } })
}

function imageHero(eyebrow: string, title: string, intro: string, cta: string, href = '/contact') {
  return n.section({ contentAlign: 'center', verticalAlign: 'center', tone: 'light', label: 'Hero' }, [
    n.eyebrow(eyebrow),
    n.heading(title, 'h1', 'display', { maxWidth: '900px' }),
    n.text(intro, { size: 'lead' }, { maxWidth: '680px' }),
    n.row([n.button(cta, href, 'light'), n.link('Learn more', '#details')], { justifyContent: 'center', margin: { top: 'sm' } }),
  ], {
    background: { type: 'image', image: IMG, imagePosition: 'center', imageSize: 'cover', overlayColor: '#0d2f2e', overlayOpacity: 0.65, color: '#0d4f4d' },
    minHeight: '560px',
  })
}

function withId(node: BuilderNode, id: string): BuilderNode {
  node.advanced = { ...node.advanced, htmlId: id }
  return node
}

export const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  // ---------------------------------------------------------------- basic
  { key: 'blank', name: 'Blank page', category: 'basic', description: 'Start from scratch with an empty page', build: () => doc() },
  {
    key: 'simple',
    name: 'Simple text page',
    category: 'basic',
    description: 'A page header and one column of formatted text — for policies, notices and general pages',
    build: () =>
      doc(
        pageHeader('Information', 'Page title', 'A one-line summary of what this page covers.'),
        n.section({ width: 'narrow' }, [
          n.rich('<h2>First section</h2><p>Write your content here. Use headings to organise longer pages, and lists for steps or key points.</p><ul><li><p>A key point</p></li><li><p>Another key point</p></li></ul><h2>Second section</h2><p>More detail here.</p>'),
        ])
      ),
  },

  // ---------------------------------------------------------------- landing
  {
    key: 'landing',
    name: 'Landing page — split hero',
    category: 'landing',
    description: 'Hero with image, key numbers, features, story, testimonials and a call to action',
    build: () => doc(preset('hero'), preset('stats'), preset('features'), preset('image-text'), preset('testimonials'), preset('cta')),
  },
  {
    key: 'landing-photo',
    name: 'Landing page — full-width photo',
    category: 'landing',
    description: 'Big photo hero with overlay, steps, cards and a sign-up section',
    build: () =>
      doc(
        imageHero('Introducing', 'A bold headline that sums up your offer', 'Explain the benefit in a sentence visitors will remember.', 'Get started'),
        withId(preset('steps'), 'details'),
        preset('cards'),
        preset('statement'),
        preset('newsletter')
      ),
  },

  // ---------------------------------------------------------------- about
  {
    key: 'about',
    name: 'About — our story',
    category: 'about',
    description: 'Page header, story with image, purpose statement, values and a call to action',
    build: () =>
      doc(
        pageHeader('About us', 'Who we are', 'A short introduction to the organization and the people behind it.'),
        n.section({}, [
          n.columns([
            [n.eyebrow('Our story'), n.heading('How we started'), n.rich('<p>Tell the story of the organization: why it exists, who it serves and what makes it different.</p><p>Add a second paragraph with more detail about the journey so far.</p>')],
            [n.image(IMG, PH, { aspect: '4/5' })],
          ], {}, { alignItems: 'center', gap: '64px' }),
        ]),
        preset('statement'),
        preset('features'),
        preset('timeline'),
        preset('cta')
      ),
  },
  {
    key: 'about-mission',
    name: 'About — mission & values',
    category: 'about',
    description: 'Mission, vision and values laid out as clear, scannable blocks',
    build: () =>
      doc(
        pageHeader('Mission & values', 'What guides our work', 'The principles behind everything we do.', true),
        n.section({ width: 'narrow', contentAlign: 'center' }, [n.eyebrow('Our mission'), n.heading('A clear statement of your mission in one or two sentences.', 'h2')]),
        n.section({}, [
          n.columns([
            [n.eyebrow('Vision'), n.heading('Where we are going', 'h3'), n.text('Describe the future you are working towards.', { muted: true })],
            [n.eyebrow('Approach'), n.heading('How we work', 'h3'), n.text('Describe how you work with partners and communities.', { muted: true })],
          ], {}, { gap: '64px' }),
        ], { background: { type: 'color', color: TINT } }),
        n.section({}, [
          n.eyebrow('Values'),
          n.heading('What we believe'),
          n.grid(['Equity', 'Respect', 'Collaboration', 'Integrity'].map((t, i) => n.card(t, 'Explain what this value means in practice.', { icon: ['Scale', 'Heart', 'Handshake', 'Shield'][i], buttonLabel: '' })), '4', { margin: { top: 'sm' } }),
        ]),
        preset('cta')
      ),
  },

  // ---------------------------------------------------------------- services
  {
    key: 'services',
    name: 'Services overview',
    category: 'services',
    description: 'Services in cards, alternating detail sections, process steps and FAQ',
    build: () => doc(pageHeader('What we offer', 'Our services', 'An overview of the ways we can help.'), preset('cards'), preset('image-text'), preset('text-image'), preset('steps'), preset('faq'), preset('cta')),
  },
  {
    key: 'service-detail',
    name: 'Single service',
    category: 'services',
    description: 'One service in depth: benefits, how it works, testimonial and enquiry form',
    build: () =>
      doc(
        preset('hero'),
        n.section({}, [
          n.columns([
            [n.eyebrow('Benefits'), n.heading('Why choose this service'), n.rich('<ul><li><p><strong>Benefit one</strong> — a short explanation.</p></li><li><p><strong>Benefit two</strong> — a short explanation.</p></li><li><p><strong>Benefit three</strong> — a short explanation.</p></li></ul>')],
            [n.image(IMG, PH, { aspect: '4/3' })],
          ], {}, { alignItems: 'center', gap: '64px' }),
        ]),
        preset('steps'),
        n.section({ width: 'narrow', contentAlign: 'center' }, [n.block('quote', { text: 'A short quote from someone who used this service.', cite: 'Name, Organization', variant: 'large' })], { background: { type: 'color', color: TINT } }),
        preset('contact')
      ),
  },
  {
    key: 'pricing',
    name: 'Pricing / options',
    category: 'services',
    description: 'Plans side by side, what’s included, FAQ and a call to action',
    build: () => doc(pageHeader('Pricing', 'Simple, transparent options', 'Choose the option that works best for you.', true), preset('pricing'), preset('features'), preset('faq'), preset('cta')),
  },

  // ---------------------------------------------------------------- contact
  {
    key: 'contact',
    name: 'Contact — form & details',
    category: 'contact',
    description: 'Page header, contact details beside a form, and common questions',
    build: () => doc(pageHeader('Get in touch', 'Contact us', 'We’d love to hear from you. Send a message and we’ll reply soon.'), preset('contact'), preset('faq')),
  },
  {
    key: 'contact-map',
    name: 'Contact — with map',
    category: 'contact',
    description: 'Contact cards, a map and a message form',
    build: () =>
      doc(
        pageHeader('Visit or write to us', 'Contact', 'Find us, call us, or send a message.', true),
        n.section({}, [
          n.grid([
            n.card('Email', 'hello@example.com', { icon: 'Mail', buttonLabel: 'Send an email', link: { href: 'mailto:hello@example.com' }, align: 'center' }),
            n.card('Phone', '+1 902 555 0100', { icon: 'Phone', buttonLabel: 'Call us', link: { href: 'tel:+19025550100' }, align: 'center' }),
            n.card('Address', 'Street address, City, Province', { icon: 'MapPin', buttonLabel: '', align: 'center' }),
          ], '3'),
        ]),
        n.section({ width: 'full' }, [n.block('embed', { url: 'https://www.openstreetmap.org/export/embed.html?bbox=-62.01%2C45.61%2C-61.97%2C45.63&layer=mapnik', title: 'Map showing our location', height: '420px' })], { padding: { top: '0px', bottom: '0px' } }),
        n.section({ width: 'narrow' }, [n.heading('Send us a message'), makeNode('form')])
      ),
  },

  // ---------------------------------------------------------------- blog & news
  {
    key: 'blog',
    name: 'Article / blog post',
    category: 'blog',
    description: 'A readable single-column article with feature image, quote and share links',
    build: () =>
      doc(
        n.section({ width: 'narrow' }, [
          n.eyebrow('News · September 2026'),
          n.heading('Article headline goes here', 'h1'),
          n.text('A one-sentence summary of the article.', { size: 'lead', muted: true }),
          n.image(IMG, PH, { aspect: '16/9', lazy: false, caption: 'Photo caption and credit' }),
          n.rich('<p>Start writing the article. Use headings to break it into sections, and add images, quotes and lists as needed.</p><h2>A section heading</h2><p>More text here.</p><blockquote><p>A quote that stands out.</p></blockquote><p>Closing thoughts.</p>'),
          makeNode('divider'),
          n.row([n.text('Share this article', { size: 'small', muted: true }), makeNode('social')], { alignItems: 'center' }),
        ]),
        preset('newsletter')
      ),
  },
  {
    key: 'news-index',
    name: 'News / blog listing',
    category: 'blog',
    description: 'Featured story plus a grid of article cards',
    build: () =>
      doc(
        pageHeader('News', 'Latest updates', 'Stories, announcements and research news.'),
        n.section({}, [
          n.columns([[n.image(IMG, PH, { aspect: '16/9' })], [n.eyebrow('Featured'), n.heading('Headline of the featured story'), n.text('A short summary that makes people want to read more.', { muted: true }), n.link('Read the story', '/')]], {}, { alignItems: 'center', gap: '56px' }),
        ]),
        n.section({}, [
          n.heading('More stories', 'h2'),
          n.grid(['First story', 'Second story', 'Third story', 'Fourth story', 'Fifth story', 'Sixth story'].map((t) => n.card(t, 'A one or two sentence summary.', { image: IMG, imageAlt: '', eyebrow: 'Sep 2026', buttonLabel: 'Read more', link: { href: '/' } })), '3', { margin: { top: 'sm' } }),
        ], { background: { type: 'color', color: TINT } }),
        preset('newsletter')
      ),
  },

  // ---------------------------------------------------------------- portfolio
  {
    key: 'portfolio',
    name: 'Portfolio / projects',
    category: 'portfolio',
    description: 'Project cards, a photo gallery and a call to action',
    build: () =>
      doc(
        pageHeader('Our work', 'Projects', 'A selection of projects we are proud of.'),
        n.section({}, [n.grid(['Project one', 'Project two', 'Project three', 'Project four'].map((t) => n.card(t, 'What the project was about and what it achieved.', { image: IMG, imageAlt: '', eyebrow: '2026', buttonLabel: 'View project', link: { href: '/' } })), '2')]),
        n.section({}, [n.heading('Gallery'), makeNode('gallery', { props: { images: Array.from({ length: 6 }, (_, i) => ({ id: `xgal0000${i}`, src: IMG, alt: '', caption: '' })), columns: '3', gap: '16px', aspect: '4/3', lightbox: true, captions: false } })]),
        preset('cta')
      ),
  },
  {
    key: 'case-study',
    name: 'Case study',
    category: 'portfolio',
    description: 'Challenge, approach and results for a single project, with key numbers',
    build: () =>
      doc(
        imageHero('Case study', 'Project name: the headline result', 'One sentence on who this was for and what changed.', 'Discuss a similar project'),
        n.section({}, [
          n.columns([
            [n.eyebrow('The challenge'), n.text('Describe the problem the partner faced.', { muted: true })],
            [n.eyebrow('Our approach'), n.text('Describe what was done and how.', { muted: true })],
            [n.eyebrow('The outcome'), n.text('Describe the results and impact.', { muted: true })],
          ], {}, { gap: '48px' }),
        ]),
        preset('stats'),
        n.section({ width: 'narrow' }, [n.rich('<h2>The full story</h2><p>Go into more detail here: timeline, people involved, lessons learned.</p>'), n.image(IMG, PH, { aspect: '16/9' })]),
        preset('testimonials'),
        preset('cta')
      ),
  },

  // ---------------------------------------------------------------- team
  {
    key: 'team',
    name: 'Team / people',
    category: 'team',
    description: 'Intro, leadership, team grid and a join-us call to action',
    build: () =>
      doc(
        pageHeader('Our people', 'Meet the team', 'The people who make our work possible.'),
        n.section({}, [
          n.columns([[n.image(IMG, PH, { aspect: '4/5' })], [n.eyebrow('Director'), n.heading('Leader Name'), n.text('A short biography: background, focus and what drives their work.', { muted: true }), makeNode('social')]], { ratio: '1-2' }, { alignItems: 'center', gap: '56px' }),
        ]),
        preset('people'),
        n.section({ width: 'narrow', contentAlign: 'center', tone: 'light' }, [n.heading('Want to join us?'), n.text('We are always keen to hear from students, researchers and partners.'), n.button('Get in touch', '/contact', 'light', { align: 'center' })], { background: { type: 'color', color: 'var(--primary-dark)' } })
      ),
  },

  // ---------------------------------------------------------------- events
  {
    key: 'event',
    name: 'Event',
    category: 'events',
    description: 'Event hero with date & place, agenda, speakers, FAQ and registration form',
    build: () =>
      doc(
        imageHero('Event · 15 October 2026 · Antigonish, NS', 'Event name goes here', 'A short description of what the event is and who it is for.', 'Register now', '#register'),
        n.section({}, [
          n.grid([
            n.card('When', 'Thursday 15 October 2026, 9:00 am – 4:00 pm', { icon: 'Calendar', buttonLabel: '' }),
            n.card('Where', 'Venue name, street address, city', { icon: 'MapPin', buttonLabel: '' }),
            n.card('Cost', 'Free — registration required', { icon: 'Award', buttonLabel: '' }),
          ], '3'),
        ]),
        n.section({ width: 'narrow' }, [n.eyebrow('Agenda'), n.heading('Programme'), makeNode('accordion', { props: { openFirst: true, faqSchema: false, items: [
          { id: 'xagenda01', title: '9:00 — Welcome and introductions', body: 'Details about this session.' },
          { id: 'xagenda02', title: '10:30 — Keynote', body: 'Details about this session.' },
          { id: 'xagenda03', title: '1:00 — Workshops', body: 'Details about this session.' },
          { id: 'xagenda04', title: '3:30 — Closing remarks', body: 'Details about this session.' },
        ] } })]),
        preset('people'),
        withId(n.section({ width: 'narrow' }, [n.heading('Register'), n.text('Places are limited — reserve yours below.', { muted: true }), makeNode('form', { props: { ...makeNode('form').props, formName: 'Event registration', submitLabel: 'Register', confirmationTitle: 'You are registered!', confirmationMessage: 'We will email you the details closer to the date.' } })], { background: { type: 'color', color: TINT } }), 'register'),
        preset('faq')
      ),
  },

  // ---------------------------------------------------------------- help
  {
    key: 'faq',
    name: 'FAQ / help centre',
    category: 'help',
    description: 'Topic cards, grouped questions and a “still need help?” contact block',
    build: () =>
      doc(
        pageHeader('Help', 'Frequently asked questions', 'Answers to the questions we hear most often.', true),
        n.section({}, [n.grid([n.card('Getting started', 'The basics.', { icon: 'BookOpen', buttonLabel: 'Jump to section', link: { href: '#getting-started' } }), n.card('Working with us', 'Partnerships and projects.', { icon: 'Handshake', buttonLabel: 'Jump to section', link: { href: '#working-with-us' } }), n.card('Other questions', 'Everything else.', { icon: 'HelpCircle', buttonLabel: 'Jump to section', link: { href: '#other' } })], '3')]),
        withId(n.section({ width: 'narrow' }, [n.heading('Getting started', 'h2'), makeNode('accordion')]), 'getting-started'),
        withId(n.section({ width: 'narrow' }, [n.heading('Working with us', 'h2'), makeNode('accordion')], { background: { type: 'color', color: TINT } }), 'working-with-us'),
        withId(n.section({ width: 'narrow' }, [n.heading('Other questions', 'h2'), makeNode('accordion')]), 'other'),
        preset('cta')
      ),
  },

  // ---------------------------------------------------------------- research
  {
    key: 'research-project',
    name: 'Research project',
    category: 'research',
    description: 'Project overview, objectives, methods, team, partners and publications',
    build: () =>
      doc(
        pageHeader('Research project', 'Project title', 'A plain-language summary of the research question and why it matters.'),
        n.section({}, [
          n.columns([
            [n.eyebrow('Overview'), n.rich('<p>Describe the project, the communities involved and the problem it addresses.</p><p>Include funding and timeline information here.</p>')],
            [n.image(IMG, PH, { aspect: '4/3' })],
          ], {}, { alignItems: 'center', gap: '64px' }),
        ]),
        n.section({}, [n.eyebrow('Objectives'), n.heading('What the project aims to do'), n.grid(['Understand', 'Co-design', 'Share'].map((t, i) => n.card(t, 'Describe this objective.', { icon: ['Search', 'Users', 'FileText'][i], buttonLabel: '' })), '3', { margin: { top: 'sm' } })], { background: { type: 'color', color: TINT } }),
        n.section({ width: 'narrow' }, [n.eyebrow('Methods'), n.heading('Our approach'), n.rich('<ol><li><p>First phase — description.</p></li><li><p>Second phase — description.</p></li><li><p>Third phase — description.</p></li></ol>')]),
        preset('people'),
        n.section({}, [n.eyebrow('Partners'), n.heading('Working together with'), makeNode('partners', { props: { context: 'about', variant: 'grid' } })]),
        n.section({ width: 'narrow' }, [n.eyebrow('Outputs'), n.heading('Publications & resources'), n.rich('<ul><li><p><a href="https://">Publication title</a> — Journal, 2026</p></li><li><p><a href="https://">Report title</a> — 2025</p></li></ul>')]),
        preset('cta')
      ),
  },

  // ---------------------------------------------------------------- careers
  {
    key: 'careers',
    name: 'Careers / opportunities',
    category: 'careers',
    description: 'Why join us, open positions and an application form',
    build: () =>
      doc(
        preset('hero'),
        preset('features'),
        n.section({ width: 'narrow' }, [n.eyebrow('Open positions'), n.heading('Current opportunities'), makeNode('accordion', { props: { openFirst: false, faqSchema: false, items: [
          { id: 'xjob00001', title: 'Research Assistant — part time', body: 'About the role, responsibilities, requirements and how to apply.' },
          { id: 'xjob00002', title: 'Graduate student position', body: 'About the role, responsibilities, requirements and how to apply.' },
        ] } })]),
        n.section({ width: 'narrow' }, [n.heading('Apply or express interest'), makeNode('form', { props: { ...makeNode('form').props, formName: 'Job application', fields: [
          { id: 'xapp00001', label: 'Name', kind: 'text', required: true, placeholder: '', options: '', half: true },
          { id: 'xapp00002', label: 'Email', kind: 'email', required: true, placeholder: '', options: '', half: true },
          { id: 'xapp00003', label: 'Position', kind: 'select', required: true, placeholder: '', options: 'Research Assistant\nGraduate student position\nOther', half: false },
          { id: 'xapp00004', label: 'CV / résumé', kind: 'file', required: false, placeholder: '', options: '', half: false },
          { id: 'xapp00005', label: 'Message', kind: 'textarea', required: false, placeholder: '', options: '', half: false },
        ] } })], { background: { type: 'color', color: TINT } })
      ),
  },
]
