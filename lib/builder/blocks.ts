import type { BuilderNode, Style } from './types'
import { cloneWithNewIds, uid } from './tree'

// Block registry metadata (no React here, so it's usable from server
// actions too). Rendering lives in components/builder-render; editing UI is
// generated from `fields` and `styleGroups`, so adding a new block type means
// adding one entry here plus one render component.

export type Option = { value: string; label: string }

export type FieldDef = {
  key: string
  label: string
  hint?: string
  placeholder?: string
  // Only shown in the Advanced tab.
  advanced?: boolean
  showIf?: (props: Record<string, any>) => boolean
} & (
  | { type: 'text' | 'textarea' | 'number' | 'toggle' | 'image' | 'video' | 'color' | 'icon' | 'link' | 'richtext' | 'html' | 'date'; min?: number; max?: number; rows?: number }
  | { type: 'select' | 'segmented'; options: Option[] }
  | { type: 'list'; itemLabel: string; titleKey: string; itemFields: FieldDef[]; newItem: () => Record<string, any> }
)

export type StyleGroup = 'typography' | 'spacing' | 'size' | 'layout' | 'background' | 'border' | 'shadow' | 'image' | 'position' | 'visibility' | 'animation'

export type Category = 'basic' | 'layout' | 'media' | 'advanced' | 'site' | 'hidden'

export type BlockDef = {
  type: string
  label: string
  icon: string
  category: Category
  description?: string
  // Containers accept dropped children; `accepts` narrows which types.
  container?: { accepts?: string[]; orientation?: 'vertical' | 'horizontal' }
  // Only valid inside these parent types (e.g. a column inside columns).
  parents?: string[]
  // Rich text / headings can be edited directly on the canvas.
  inlineText?: string
  fields: FieldDef[]
  styleGroups: StyleGroup[]
  // Site content collections this block reads (loaded server-side).
  data?: ('researchAreas' | 'team' | 'projects' | 'partners' | 'values' | 'globalBlock')[]
  create: () => Omit<BuilderNode, 'id'>
}

const ALIGN: Option[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
]

const TEXT_GROUPS: StyleGroup[] = ['typography', 'spacing', 'size', 'background', 'border', 'position', 'visibility', 'animation']
const BOX_GROUPS: StyleGroup[] = ['spacing', 'size', 'background', 'border', 'shadow', 'position', 'visibility', 'animation']

export const ICON_OPTIONS = [
  'ArrowRight', 'ArrowUpRight', 'Check', 'CheckCircle', 'Star', 'Heart', 'HeartPulse', 'Leaf', 'Network', 'Scale', 'Users', 'User',
  'Globe', 'Mail', 'Phone', 'MapPin', 'Calendar', 'Clock', 'BookOpen', 'GraduationCap', 'FlaskConical', 'Lightbulb', 'Target',
  'Shield', 'Award', 'Briefcase', 'Building2', 'Handshake', 'MessageCircle', 'Sparkles', 'TrendingUp', 'BarChart3', 'FileText',
  'Download', 'ExternalLink', 'Info', 'HelpCircle', 'Home', 'Search', 'Stethoscope', 'Sprout', 'Truck', 'Hospital',
].map((v) => ({ value: v, label: v.replace(/([a-z])([A-Z0-9])/g, '$1 $2') }))

export const SOCIAL_PLATFORMS: Option[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'x', label: 'X / Twitter' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'github', label: 'GitHub' },
  { value: 'bluesky', label: 'Bluesky' },
  { value: 'email', label: 'Email' },
  { value: 'website', label: 'Website' },
]

function s(desktop: Style, extra: Partial<Record<'tablet' | 'mobile', Style>> = {}) {
  return { desktop, ...extra }
}

export function makeNode(type: string, overrides: Partial<Omit<BuilderNode, 'id' | 'type'>> = {}): BuilderNode {
  const def = BLOCKS[type]
  const base = def ? def.create() : { type, props: {} }
  return {
    ...base,
    ...overrides,
    id: uid(),
    type,
    props: { ...base.props, ...(overrides.props ?? {}) },
    children: overrides.children ?? base.children?.map((c) => cloneWithNewIds(c)),
  }
}

const TEAM_GROUPS: Option[] = [
  { value: 'leadership', label: 'Leadership' },
  { value: 'tfs', label: 'Transforming Food Systems' },
  { value: 'ift', label: 'Inter-Facility Transfer System' },
  { value: 'past', label: 'Past contributors' },
]

export const BLOCK_LIST: BlockDef[] = [
  // ---------------------------------------------------------------- layout
  {
    type: 'section',
    label: 'Section',
    icon: 'Rows3',
    category: 'layout',
    description: 'A full-width band that holds other blocks',
    container: { orientation: 'vertical' },
    fields: [
      { key: 'width', label: 'Content width', type: 'segmented', options: [{ value: 'boxed', label: 'Boxed' }, { value: 'narrow', label: 'Narrow' }, { value: 'full', label: 'Full width' }] },
      { key: 'contentAlign', label: 'Content alignment', type: 'segmented', options: ALIGN },
      { key: 'verticalAlign', label: 'Vertical alignment', type: 'segmented', options: [{ value: 'top', label: 'Top' }, { value: 'center', label: 'Center' }, { value: 'bottom', label: 'Bottom' }], hint: 'Applies when the section has a minimum height.' },
      { key: 'tone', label: 'Text colour scheme', type: 'segmented', options: [{ value: 'auto', label: 'Default' }, { value: 'light', label: 'Light text' }], hint: 'Use light text on dark backgrounds.' },
      { key: 'label', label: 'Section name (for your reference)', type: 'text', advanced: true },
    ],
    styleGroups: ['spacing', 'size', 'layout', 'background', 'border', 'shadow', 'visibility', 'animation'],
    create: () => ({ type: 'section', props: { width: 'boxed', contentAlign: 'left', verticalAlign: 'top', tone: 'auto' }, children: [] }),
  },
  {
    type: 'columns',
    label: 'Columns',
    icon: 'Columns3',
    category: 'layout',
    description: 'Side-by-side columns',
    container: { accepts: ['column'], orientation: 'horizontal' },
    fields: [
      {
        key: 'ratio',
        label: 'Column widths',
        type: 'select',
        options: [
          { value: 'equal', label: 'Equal' },
          { value: '2-1', label: 'Wide + narrow (2:1)' },
          { value: '1-2', label: 'Narrow + wide (1:2)' },
          { value: '3-2', label: '3:2' },
          { value: '2-3', label: '2:3' },
          { value: '1-3', label: '1:3' },
          { value: '3-1', label: '3:1' },
        ],
      },
      { key: 'stackOn', label: 'Stack columns on', type: 'segmented', options: [{ value: 'tablet', label: 'Tablet' }, { value: 'mobile', label: 'Mobile' }, { value: 'never', label: 'Never' }] },
      { key: 'reverseOnStack', label: 'Reverse order when stacked', type: 'toggle' },
    ],
    styleGroups: ['spacing', 'size', 'layout', 'background', 'border', 'shadow', 'visibility', 'animation'],
    create: () => ({
      type: 'columns',
      props: { ratio: 'equal', stackOn: 'tablet', reverseOnStack: false },
      style: s({ gap: '48px', alignItems: 'flex-start' }),
      children: [
        { id: '', type: 'column', props: {}, children: [] },
        { id: '', type: 'column', props: {}, children: [] },
      ],
    }),
  },
  {
    type: 'column',
    label: 'Column',
    icon: 'RectangleVertical',
    category: 'hidden',
    container: { orientation: 'vertical' },
    parents: ['columns'],
    fields: [],
    styleGroups: ['spacing', 'layout', 'background', 'border', 'shadow', 'visibility', 'animation'],
    create: () => ({ type: 'column', props: {}, children: [] }),
  },
  {
    type: 'group',
    label: 'Container',
    icon: 'Square',
    category: 'layout',
    description: 'Groups blocks in a row or stack',
    container: { orientation: 'vertical' },
    fields: [
      { key: 'direction', label: 'Arrange items', type: 'segmented', options: [{ value: 'column', label: 'Stacked' }, { value: 'row', label: 'In a row' }] },
      { key: 'wrap', label: 'Wrap onto new lines', type: 'toggle', showIf: (p) => p.direction === 'row' },
    ],
    styleGroups: ['spacing', 'size', 'layout', 'background', 'border', 'shadow', 'position', 'visibility', 'animation'],
    create: () => ({ type: 'group', props: { direction: 'column', wrap: true }, children: [] }),
  },
  {
    type: 'grid',
    label: 'Grid',
    icon: 'LayoutGrid',
    category: 'layout',
    description: 'A grid of cards or other blocks',
    container: { orientation: 'horizontal' },
    fields: [
      { key: 'columns', label: 'Columns (desktop)', type: 'segmented', options: ['1', '2', '3', '4', '5', '6'].map((v) => ({ value: v, label: v })) },
      { key: 'tabletColumns', label: 'Columns (tablet)', type: 'segmented', options: ['1', '2', '3', '4'].map((v) => ({ value: v, label: v })) },
      { key: 'mobileColumns', label: 'Columns (mobile)', type: 'segmented', options: ['1', '2'].map((v) => ({ value: v, label: v })) },
    ],
    styleGroups: ['spacing', 'size', 'layout', 'background', 'border', 'shadow', 'visibility', 'animation'],
    create: () => ({ type: 'grid', props: { columns: '3', tabletColumns: '2', mobileColumns: '1' }, style: s({ gap: '24px' }), children: [] }),
  },

  // ---------------------------------------------------------------- basic
  {
    type: 'heading',
    label: 'Heading',
    icon: 'Heading',
    category: 'basic',
    inlineText: 'text',
    fields: [
      { key: 'text', label: 'Text', type: 'textarea', rows: 2 },
      { key: 'level', label: 'Heading level', type: 'segmented', options: [...['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((v) => ({ value: v, label: v.toUpperCase() })), { value: 'p', label: 'Text' }], hint: 'Use one H1 per page, then H2 for sections — it helps accessibility and search.' },
      {
        key: 'preset',
        label: 'Style',
        type: 'select',
        options: [
          { value: 'default', label: 'Standard' },
          { value: 'display', label: 'Display (extra large)' },
          { value: 'eyebrow', label: 'Small label (eyebrow)' },
          { value: 'subtitle', label: 'Subtitle' },
        ],
      },
      { key: 'link', label: 'Link', type: 'link' },
    ],
    styleGroups: TEXT_GROUPS,
    create: () => ({ type: 'heading', props: { text: 'Your heading here', level: 'h2', preset: 'default' } }),
  },
  {
    type: 'paragraph',
    label: 'Text',
    icon: 'Pilcrow',
    category: 'basic',
    inlineText: 'text',
    description: 'A plain paragraph',
    fields: [
      { key: 'text', label: 'Text', type: 'textarea', rows: 5 },
      { key: 'size', label: 'Size', type: 'segmented', options: [{ value: 'small', label: 'Small' }, { value: 'normal', label: 'Normal' }, { value: 'lead', label: 'Large' }] },
      { key: 'muted', label: 'Softer colour', type: 'toggle' },
    ],
    styleGroups: TEXT_GROUPS,
    create: () => ({ type: 'paragraph', props: { text: 'Write something here. Double-click to edit this text directly on the page.', size: 'normal', muted: false } }),
  },
  {
    type: 'richtext',
    label: 'Rich text',
    icon: 'FileText',
    category: 'basic',
    description: 'Formatted text with lists, links, tables and images',
    fields: [{ key: 'html', label: 'Content', type: 'richtext' }],
    styleGroups: TEXT_GROUPS,
    create: () => ({
      type: 'richtext',
      props: { html: '<p>Start writing. Select text to format it, add <strong>bold</strong>, <em>italic</em>, links, lists and more.</p>' },
    }),
  },
  {
    type: 'image',
    label: 'Image',
    icon: 'Image',
    category: 'media',
    fields: [
      { key: 'src', label: 'Image', type: 'image' },
      { key: 'alt', label: 'Alt text (describe the image)', type: 'text', hint: 'Read aloud by screen readers. Leave empty only for purely decorative images.' },
      { key: 'caption', label: 'Caption', type: 'text' },
      { key: 'link', label: 'Link', type: 'link' },
      { key: 'aspect', label: 'Shape', type: 'select', options: [{ value: 'auto', label: 'Original' }, { value: '16/9', label: 'Wide (16:9)' }, { value: '4/3', label: 'Landscape (4:3)' }, { value: '1/1', label: 'Square' }, { value: '3/4', label: 'Portrait (3:4)' }, { value: '4/5', label: 'Portrait (4:5)' }, { value: '21/9', label: 'Panorama (21:9)' }] },
      { key: 'height', label: 'Fixed height', type: 'text', placeholder: 'e.g. 420px', hint: 'Optional. Overrides the shape.' },
      { key: 'fit', label: 'Fit', type: 'segmented', options: [{ value: 'cover', label: 'Fill' }, { value: 'contain', label: 'Fit' }] },
      {
        key: 'focus',
        label: 'Focus point',
        type: 'select',
        options: ['top left', 'top center', 'top right', 'center left', 'center', 'center right', 'bottom left', 'bottom center', 'bottom right'].map((v) => ({ value: v, label: v.replace(/\b\w/g, (c) => c.toUpperCase()) })),
        hint: 'Which part of the image stays visible when it is cropped to a shape.',
      },
      { key: 'lazy', label: 'Load when scrolled into view', type: 'toggle', advanced: true, hint: 'Turn off for images at the very top of the page.' },
    ],
    styleGroups: ['spacing', 'size', 'border', 'shadow', 'position', 'visibility', 'animation'],
    create: () => ({ type: 'image', props: { src: '', alt: '', caption: '', aspect: '16/9', fit: 'cover', focus: 'center', lazy: true } }),
  },
  {
    type: 'button',
    label: 'Button',
    icon: 'RectangleHorizontal',
    category: 'basic',
    inlineText: 'label',
    fields: [
      { key: 'label', label: 'Button text', type: 'text' },
      { key: 'link', label: 'Link', type: 'link' },
      {
        key: 'variant',
        label: 'Style',
        type: 'select',
        options: [
          { value: 'primary', label: 'Primary' },
          { value: 'secondary', label: 'Secondary' },
          { value: 'outline', label: 'Outline' },
          { value: 'ghost', label: 'Ghost' },
          { value: 'light', label: 'Light (for dark backgrounds)' },
          { value: 'link', label: 'Arrow link' },
        ],
      },
      { key: 'size', label: 'Size', type: 'segmented', options: [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }] },
      { key: 'align', label: 'Alignment', type: 'segmented', options: [...ALIGN, { value: 'full', label: 'Full' }] },
      { key: 'icon', label: 'Show arrow', type: 'toggle' },
      { key: 'hoverBackground', label: 'Hover background', type: 'color', advanced: true },
      { key: 'hoverColor', label: 'Hover text colour', type: 'color', advanced: true },
    ],
    styleGroups: ['typography', 'spacing', 'background', 'border', 'shadow', 'position', 'visibility', 'animation'],
    create: () => ({ type: 'button', props: { label: 'Learn more', link: { href: '/contact' }, variant: 'primary', size: 'md', align: 'left', icon: true } }),
  },
  {
    type: 'link',
    label: 'Text link',
    icon: 'Link',
    category: 'basic',
    inlineText: 'label',
    fields: [
      { key: 'label', label: 'Text', type: 'text' },
      { key: 'link', label: 'Link', type: 'link' },
      { key: 'arrow', label: 'Show arrow', type: 'toggle' },
    ],
    styleGroups: ['typography', 'spacing', 'visibility', 'animation'],
    create: () => ({ type: 'link', props: { label: 'Read more', link: { href: '/' }, arrow: true } }),
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: 'Minus',
    category: 'basic',
    fields: [
      { key: 'lineStyle', label: 'Line style', type: 'segmented', options: [{ value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }] },
      { key: 'thickness', label: 'Thickness', type: 'segmented', options: ['1px', '2px', '4px'].map((v) => ({ value: v, label: v })) },
      { key: 'color', label: 'Colour', type: 'color' },
      { key: 'length', label: 'Length', type: 'segmented', options: [{ value: '100%', label: 'Full' }, { value: '50%', label: 'Half' }, { value: '64px', label: 'Short' }] },
    ],
    styleGroups: ['spacing', 'visibility'],
    create: () => ({ type: 'divider', props: { lineStyle: 'solid', thickness: '1px', color: '', length: '100%' } }),
  },
  {
    type: 'spacer',
    label: 'Spacer',
    icon: 'MoveVertical',
    category: 'basic',
    fields: [],
    styleGroups: ['size', 'visibility'],
    create: () => ({ type: 'spacer', props: {}, style: s({ height: '48px' }, { mobile: { height: '24px' } }) }),
  },
  {
    type: 'quote',
    label: 'Quote',
    icon: 'Quote',
    category: 'basic',
    inlineText: 'text',
    fields: [
      { key: 'text', label: 'Quote', type: 'textarea', rows: 4 },
      { key: 'cite', label: 'Who said it', type: 'text' },
      { key: 'variant', label: 'Style', type: 'segmented', options: [{ value: 'bar', label: 'Side bar' }, { value: 'large', label: 'Large' }] },
    ],
    styleGroups: TEXT_GROUPS,
    create: () => ({ type: 'quote', props: { text: 'A memorable quote goes here.', cite: '', variant: 'bar' } }),
  },
  {
    type: 'icon',
    label: 'Icon',
    icon: 'Star',
    category: 'basic',
    fields: [
      { key: 'name', label: 'Icon', type: 'icon' },
      { key: 'size', label: 'Size', type: 'segmented', options: [{ value: '24', label: 'S' }, { value: '32', label: 'M' }, { value: '48', label: 'L' }, { value: '64', label: 'XL' }] },
      { key: 'color', label: 'Colour', type: 'color' },
      { key: 'label', label: 'Accessible label', type: 'text', hint: 'Leave empty if the icon is decorative.' },
      { key: 'align', label: 'Alignment', type: 'segmented', options: ALIGN },
    ],
    styleGroups: ['spacing', 'background', 'border', 'visibility', 'animation'],
    create: () => ({ type: 'icon', props: { name: 'Star', size: '32', color: '', label: '', align: 'left' } }),
  },

  // ---------------------------------------------------------------- media
  {
    type: 'gallery',
    label: 'Gallery',
    icon: 'Images',
    category: 'media',
    fields: [
      {
        key: 'images',
        label: 'Images',
        type: 'list',
        itemLabel: 'Image',
        titleKey: 'alt',
        itemFields: [
          { key: 'src', label: 'Image', type: 'image' },
          { key: 'alt', label: 'Alt text', type: 'text' },
          { key: 'caption', label: 'Caption', type: 'text' },
        ],
        newItem: () => ({ id: uid(), src: '', alt: '', caption: '' }),
      },
      { key: 'columns', label: 'Columns', type: 'segmented', options: ['2', '3', '4'].map((v) => ({ value: v, label: v })) },
      { key: 'gap', label: 'Gap', type: 'segmented', options: [{ value: '8px', label: 'Tight' }, { value: '16px', label: 'Normal' }, { value: '32px', label: 'Wide' }] },
      { key: 'aspect', label: 'Image shape', type: 'select', options: [{ value: '1/1', label: 'Square' }, { value: '4/3', label: 'Landscape' }, { value: '3/4', label: 'Portrait' }, { value: '16/9', label: 'Wide' }, { value: 'auto', label: 'Original' }] },
      { key: 'lightbox', label: 'Open larger when clicked', type: 'toggle' },
      { key: 'captions', label: 'Show captions', type: 'toggle' },
    ],
    styleGroups: BOX_GROUPS,
    create: () => ({ type: 'gallery', props: { images: [], columns: '3', gap: '16px', aspect: '4/3', lightbox: true, captions: false } }),
  },
  {
    type: 'video',
    label: 'Video',
    icon: 'Video',
    category: 'media',
    fields: [
      { key: 'url', label: 'Video', type: 'video', hint: 'Paste a YouTube or Vimeo link, or upload an MP4.' },
      { key: 'poster', label: 'Cover image', type: 'image', showIf: (p) => !isEmbedUrl(p.url) },
      { key: 'title', label: 'Video title (for accessibility)', type: 'text' },
      { key: 'aspect', label: 'Shape', type: 'segmented', options: [{ value: '16/9', label: '16:9' }, { value: '4/3', label: '4:3' }, { value: '1/1', label: '1:1' }, { value: '9/16', label: 'Vertical' }] },
      { key: 'controls', label: 'Show controls', type: 'toggle' },
      { key: 'autoplay', label: 'Autoplay (always muted)', type: 'toggle' },
      { key: 'loop', label: 'Loop', type: 'toggle' },
      { key: 'muted', label: 'Muted', type: 'toggle' },
    ],
    styleGroups: BOX_GROUPS,
    create: () => ({ type: 'video', props: { url: '', poster: '', title: '', aspect: '16/9', controls: true, autoplay: false, loop: false, muted: false } }),
  },
  {
    type: 'embed',
    label: 'Embed',
    icon: 'Code2',
    category: 'advanced',
    description: 'Maps, forms, calendars and other embeddable pages',
    fields: [
      { key: 'url', label: 'Embed URL', type: 'text', placeholder: 'https://…', hint: 'The page is shown in a secure sandboxed frame.' },
      { key: 'title', label: 'Title (for accessibility)', type: 'text' },
      { key: 'height', label: 'Height', type: 'text', placeholder: '480px' },
    ],
    styleGroups: BOX_GROUPS,
    create: () => ({ type: 'embed', props: { url: '', title: 'Embedded content', height: '480px' } }),
  },
  {
    type: 'html',
    label: 'Custom HTML',
    icon: 'CodeXml',
    category: 'advanced',
    description: 'For advanced users. Scripts are removed.',
    fields: [{ key: 'html', label: 'HTML', type: 'html', hint: 'Scripts, event handlers and unsafe tags are removed automatically.' }],
    styleGroups: BOX_GROUPS,
    create: () => ({ type: 'html', props: { html: '<div>Custom HTML</div>' } }),
  },

  // ---------------------------------------------------------------- advanced
  {
    type: 'card',
    label: 'Card',
    icon: 'CreditCard',
    category: 'advanced',
    fields: [
      { key: 'image', label: 'Image', type: 'image' },
      { key: 'imageAlt', label: 'Image alt text', type: 'text' },
      { key: 'eyebrow', label: 'Small label', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'text', label: 'Description', type: 'textarea', rows: 3 },
      { key: 'buttonLabel', label: 'Button / link text', type: 'text' },
      { key: 'link', label: 'Link', type: 'link' },
      { key: 'icon', label: 'Icon (instead of image)', type: 'icon' },
      { key: 'align', label: 'Alignment', type: 'segmented', options: ALIGN },
    ],
    styleGroups: ['typography', 'spacing', 'size', 'background', 'border', 'shadow', 'visibility', 'animation'],
    create: () => ({ type: 'card', props: { image: '', imageAlt: '', eyebrow: '', title: 'Card title', text: 'A short description of this item.', buttonLabel: 'Learn more', link: { href: '' }, icon: '', align: 'left' } }),
  },
  {
    type: 'accordion',
    label: 'Accordion / FAQ',
    icon: 'ListCollapse',
    category: 'advanced',
    fields: [
      {
        key: 'items',
        label: 'Questions',
        type: 'list',
        itemLabel: 'Question',
        titleKey: 'title',
        itemFields: [
          { key: 'title', label: 'Question', type: 'text' },
          { key: 'body', label: 'Answer', type: 'textarea', rows: 4 },
        ],
        newItem: () => ({ id: uid(), title: 'New question', body: 'The answer.' }),
      },
      { key: 'openFirst', label: 'First item open', type: 'toggle' },
      { key: 'faqSchema', label: 'Mark up as FAQ for search engines', type: 'toggle', advanced: true },
    ],
    styleGroups: BOX_GROUPS,
    create: () => ({
      type: 'accordion',
      props: {
        openFirst: false,
        faqSchema: true,
        items: [
          { id: uid(), title: 'What is your first question?', body: 'Write the answer here.' },
          { id: uid(), title: 'And a second question?', body: 'Another helpful answer.' },
        ],
      },
    }),
  },
  {
    type: 'tabs',
    label: 'Tabs',
    icon: 'PanelTop',
    category: 'advanced',
    fields: [
      {
        key: 'items',
        label: 'Tabs',
        type: 'list',
        itemLabel: 'Tab',
        titleKey: 'label',
        itemFields: [
          { key: 'label', label: 'Tab name', type: 'text' },
          { key: 'body', label: 'Content', type: 'textarea', rows: 5 },
        ],
        newItem: () => ({ id: uid(), label: 'New tab', body: 'Tab content.' }),
      },
    ],
    styleGroups: BOX_GROUPS,
    create: () => ({
      type: 'tabs',
      props: { items: [{ id: uid(), label: 'First tab', body: 'Content for the first tab.' }, { id: uid(), label: 'Second tab', body: 'Content for the second tab.' }] },
    }),
  },
  {
    type: 'testimonials',
    label: 'Testimonials',
    icon: 'MessageSquareQuote',
    category: 'advanced',
    fields: [
      {
        key: 'items',
        label: 'Testimonials',
        type: 'list',
        itemLabel: 'Testimonial',
        titleKey: 'name',
        itemFields: [
          { key: 'quote', label: 'Quote', type: 'textarea', rows: 3 },
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'role', label: 'Role / organization', type: 'text' },
          { key: 'avatar', label: 'Photo', type: 'image' },
        ],
        newItem: () => ({ id: uid(), quote: 'What they said.', name: 'Name', role: '', avatar: '' }),
      },
      { key: 'columns', label: 'Columns', type: 'segmented', options: ['1', '2', '3'].map((v) => ({ value: v, label: v })) },
    ],
    styleGroups: BOX_GROUPS,
    create: () => ({
      type: 'testimonials',
      props: { columns: '2', items: [{ id: uid(), quote: 'Working with this team was a wonderful experience.', name: 'Community partner', role: '', avatar: '' }] },
    }),
  },
  {
    type: 'social',
    label: 'Social links',
    icon: 'Share2',
    category: 'advanced',
    fields: [
      {
        key: 'links',
        label: 'Links',
        type: 'list',
        itemLabel: 'Link',
        titleKey: 'platform',
        itemFields: [
          { key: 'platform', label: 'Platform', type: 'select', options: SOCIAL_PLATFORMS },
          { key: 'url', label: 'URL', type: 'text' },
        ],
        newItem: () => ({ id: uid(), platform: 'linkedin', url: '' }),
      },
      { key: 'useSite', label: 'Use the links from Site settings', type: 'toggle' },
      { key: 'size', label: 'Size', type: 'segmented', options: [{ value: '20', label: 'S' }, { value: '28', label: 'M' }, { value: '36', label: 'L' }] },
      { key: 'align', label: 'Alignment', type: 'segmented', options: ALIGN },
    ],
    styleGroups: ['spacing', 'typography', 'visibility', 'animation'],
    create: () => ({ type: 'social', props: { links: [], useSite: true, size: '28', align: 'left' } }),
  },
  {
    type: 'contact-info',
    label: 'Contact details',
    icon: 'Contact',
    category: 'advanced',
    fields: [
      { key: 'useSite', label: 'Use details from Site settings', type: 'toggle' },
      { key: 'address', label: 'Address', type: 'textarea', rows: 3, showIf: (p) => !p.useSite },
      { key: 'email', label: 'Email', type: 'text', showIf: (p) => !p.useSite },
      { key: 'phone', label: 'Phone', type: 'text', showIf: (p) => !p.useSite },
      { key: 'hours', label: 'Hours', type: 'text' },
      { key: 'layout', label: 'Layout', type: 'segmented', options: [{ value: 'row', label: 'In a row' }, { value: 'stack', label: 'Stacked' }, { value: 'cards', label: 'Cards' }] },
    ],
    styleGroups: TEXT_GROUPS,
    create: () => ({ type: 'contact-info', props: { useSite: true, address: '', email: '', phone: '', hours: '', layout: 'row' } }),
  },
  {
    type: 'form',
    label: 'Form',
    icon: 'ClipboardList',
    category: 'advanced',
    description: 'Collect messages; submissions appear in the admin',
    fields: [
      { key: 'formName', label: 'Form name', type: 'text', hint: 'Shown in Form submissions so you can tell forms apart.' },
      { key: 'appearance', label: 'Look', type: 'segmented', options: [{ value: 'card', label: 'Card' }, { value: 'plain', label: 'Plain' }] },
      {
        key: 'fields',
        label: 'Fields',
        type: 'list',
        itemLabel: 'Field',
        titleKey: 'label',
        itemFields: [
          { key: 'label', label: 'Label', type: 'text' },
          {
            key: 'kind',
            label: 'Type',
            type: 'select',
            options: [
              { value: 'text', label: 'Short text' },
              { value: 'email', label: 'Email' },
              { value: 'tel', label: 'Phone' },
              { value: 'textarea', label: 'Message (long text)' },
              { value: 'select', label: 'Dropdown' },
              { value: 'radio', label: 'Multiple choice' },
              { value: 'checkbox', label: 'Checkbox' },
              { value: 'file', label: 'File upload' },
            ],
          },
          { key: 'required', label: 'Required', type: 'toggle' },
          { key: 'placeholder', label: 'Placeholder', type: 'text' },
          { key: 'options', label: 'Choices (one per line)', type: 'textarea', rows: 4, showIf: (p) => p.kind === 'select' || p.kind === 'radio' },
          { key: 'half', label: 'Half width', type: 'toggle' },
        ],
        newItem: () => ({ id: uid(), label: 'New field', kind: 'text', required: false, placeholder: '', options: '', half: false }),
      },
      { key: 'submitLabel', label: 'Button text', type: 'text' },
      { key: 'notice', label: 'Note above the button', type: 'textarea', rows: 2 },
      { key: 'confirmationTitle', label: 'Thank-you title', type: 'text' },
      { key: 'confirmationMessage', label: 'Thank-you message', type: 'textarea', rows: 3 },
      { key: 'thankYouEmail', label: 'Email a thank-you to the sender', type: 'toggle', hint: 'Uses the form’s Email field. Who gets notified is set in Form submissions → Email settings.' },
    ],
    styleGroups: BOX_GROUPS,
    create: () => ({
      type: 'form',
      props: {
        formName: 'Contact form',
        appearance: 'card',
        submitLabel: 'Send message',
        notice: '',
        confirmationTitle: 'Thank you!',
        confirmationMessage: 'Your message has been received. We will be in touch soon.',
        thankYouEmail: true,
        fields: [
          { id: uid(), label: 'Name', kind: 'text', required: true, placeholder: '', options: '', half: true },
          { id: uid(), label: 'Email', kind: 'email', required: true, placeholder: '', options: '', half: true },
          { id: uid(), label: 'Message', kind: 'textarea', required: true, placeholder: '', options: '', half: false },
        ],
      },
    }),
  },

  // ---------------------------------------------------------------- site content (collections managed elsewhere in the admin)
  {
    type: 'research-areas',
    label: 'Research areas',
    icon: 'FlaskConical',
    category: 'site',
    description: 'Shows the research areas from Content → Research areas',
    data: ['researchAreas'],
    fields: [
      { key: 'variant', label: 'Layout', type: 'segmented', options: [{ value: 'cards', label: 'Cards' }, { value: 'rows', label: 'Rows with images' }] },
      { key: 'homeOnly', label: 'Only areas marked "show on home"', type: 'toggle' },
      { key: 'linkLabel', label: 'Link text', type: 'text' },
      { key: 'link', label: 'Link', type: 'link' },
    ],
    styleGroups: ['spacing', 'visibility'],
    create: () => ({ type: 'research-areas', props: { variant: 'cards', homeOnly: true, linkLabel: 'Learn more', link: { href: '/research' } } }),
  },
  {
    type: 'team',
    label: 'Team members',
    icon: 'Users',
    category: 'site',
    description: 'Shows people from Content → Team',
    data: ['team'],
    fields: [
      { key: 'group', label: 'Group', type: 'select', options: TEAM_GROUPS },
      { key: 'title', label: 'Group title (optional)', type: 'text' },
      { key: 'eyebrow', label: 'Group label (optional)', type: 'text' },
    ],
    styleGroups: ['spacing', 'visibility'],
    create: () => ({ type: 'team', props: { group: 'leadership', title: '', eyebrow: '' } }),
  },
  {
    type: 'projects',
    label: 'Projects',
    icon: 'FolderKanban',
    category: 'site',
    description: 'Shows published projects from Content → Projects',
    data: ['projects'],
    fields: [{ key: 'linkLabel', label: 'Call-to-action text', type: 'text' }],
    styleGroups: ['spacing', 'visibility'],
    create: () => ({ type: 'projects', props: { linkLabel: 'Discuss this project' } }),
  },
  {
    type: 'partners',
    label: 'Partner logos',
    icon: 'Handshake',
    category: 'site',
    description: 'Shows logos from Content → Partner logos',
    data: ['partners'],
    fields: [
      {
        key: 'context',
        label: 'Which logos',
        type: 'select',
        options: [
          { value: 'home', label: 'Home page set' },
          { value: 'about', label: 'About page set' },
        ],
        hint: 'Each set is managed under Partner logos.',
      },
      { key: 'variant', label: 'Layout', type: 'segmented', options: [{ value: 'marquee', label: 'Scrolling' }, { value: 'grid', label: 'Grid' }, { value: 'row', label: 'Row' }] },
    ],
    styleGroups: ['spacing', 'visibility'],
    create: () => ({ type: 'partners', props: { context: 'home', variant: 'marquee' } }),
  },
  {
    type: 'values',
    label: 'PEARL values',
    icon: 'Gem',
    category: 'site',
    description: 'Shows the values from the About page content',
    data: ['values'],
    fields: [],
    styleGroups: ['spacing', 'visibility'],
    create: () => ({ type: 'values', props: {} }),
  },
  {
    type: 'global',
    label: 'Global block',
    icon: 'Globe',
    category: 'hidden',
    description: 'A shared block — edit it once, it updates everywhere',
    data: ['globalBlock'],
    fields: [],
    styleGroups: ['visibility'],
    create: () => ({ type: 'global', props: { blockId: '' } }),
  },
]

export const BLOCKS: Record<string, BlockDef> = Object.fromEntries(BLOCK_LIST.map((b) => [b.type, b]))

export function isContainer(type: string): boolean {
  return !!BLOCKS[type]?.container
}

// Whether `childType` may be dropped into a parent of `parentType` (null = page root).
export function canContain(parentType: string | null, childType: string): boolean {
  const child = BLOCKS[childType]
  if (parentType === null) return childType === 'section' || childType === 'global'
  if (childType === 'section') return false
  const parent = BLOCKS[parentType]
  if (!parent?.container) return false
  if (parent.container.accepts && !parent.container.accepts.includes(childType)) return false
  if (child?.parents && !child.parents.includes(parentType)) return false
  return true
}

export function isEmbedUrl(url: unknown): boolean {
  return typeof url === 'string' && /(youtube\.com|youtu\.be|vimeo\.com)/i.test(url)
}

export const CATEGORY_LABELS: Record<Category, string> = {
  basic: 'Basic',
  layout: 'Layout',
  media: 'Media',
  advanced: 'Advanced',
  site: 'Site content',
  hidden: '',
}
