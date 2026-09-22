import { Mark, Node, mergeAttributes, type Editor } from '@tiptap/react'

// Ready-made text styles for the rich text editor. Stored as CSS classes
// (styled in app/builder.css using theme tokens), so they follow the theme.

export const INLINE_STYLES = [
  { cls: 'pb-s-lead', label: 'Lead text', hint: 'Larger intro text' },
  { cls: 'pb-s-small', label: 'Small print', hint: 'Notes and fine print' },
  { cls: 'pb-s-muted', label: 'Soft text', hint: 'Subtle grey text' },
  { cls: 'pb-s-primary', label: 'Brand colour', hint: 'Theme primary colour' },
  { cls: 'pb-s-accent', label: 'Accent colour', hint: 'Theme accent colour' },
  { cls: 'pb-s-marker', label: 'Marker highlight', hint: 'Highlighter pen effect' },
  { cls: 'pb-s-badge', label: 'Badge', hint: 'Small rounded label' },
  { cls: 'pb-s-label', label: 'Uppercase label', hint: 'Small spaced capitals' },
  { cls: 'pb-s-serif', label: 'Heading font', hint: 'Use the theme heading font' },
] as const

export const CALLOUTS = [
  { variant: 'info', label: 'Info box' },
  { variant: 'success', label: 'Success box' },
  { variant: 'warning', label: 'Warning box' },
  { variant: 'note', label: 'Note box' },
] as const

const STYLE_CLASSES: string[] = INLINE_STYLES.map((s) => s.cls)
const CALLOUT_VARIANTS: string[] = CALLOUTS.map((c) => c.variant)

export const StyleClass = Mark.create({
  name: 'styleClass',
  priority: 1001,
  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).className.split(/\s+/).find((c) => STYLE_CLASSES.includes(c)) ?? null,
        renderHTML: (attrs) => (attrs.class && STYLE_CLASSES.includes(attrs.class) ? { class: attrs.class } : {}),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'span', getAttrs: (el) => ((el as HTMLElement).className.split(/\s+/).some((c) => STYLE_CLASSES.includes(c)) ? null : false) }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0]
  },
})

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return {
      variant: {
        default: 'info',
        parseHTML: (el) => {
          const v = (el as HTMLElement).getAttribute('data-variant') ?? ''
          return CALLOUT_VARIANTS.includes(v) ? v : 'info'
        },
        renderHTML: (attrs) => ({ 'data-variant': attrs.variant, class: `pb-callout pb-callout--${attrs.variant}` }),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'div.pb-callout' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0]
  },
})

export function setStyleClass(editor: Editor, cls: string) {
  if (!STYLE_CLASSES.includes(cls)) return
  editor.chain().focus().setMark('styleClass', { class: cls }).run()
}

export function unsetStyleClass(editor: Editor) {
  editor.chain().focus().unsetMark('styleClass').run()
}

export function toggleCallout(editor: Editor, variant: string) {
  const chain = editor.chain().focus()
  if (editor.isActive('callout', { variant })) chain.lift('callout').run()
  else if (editor.isActive('callout')) chain.updateAttributes('callout', { variant }).run()
  else chain.wrapIn('callout', { variant }).run()
}
