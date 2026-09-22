'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle, Color, BackgroundColor, FontFamily, FontSize, LineHeight } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TextAlign from '@tiptap/extension-text-align'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TableKit } from '@tiptap/extension-table'
import Image from '@tiptap/extension-image'
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Code, Eraser, Highlighter, ImagePlus, IndentDecrease, IndentIncrease, Italic, Link2,
  Link2Off, List, ListChecks, ListOrdered, Minus, Quote, Redo2, Strikethrough, Subscript as SubIcon, Superscript as SupIcon, Table as TableIcon,
  Underline as UnderlineIcon, Undo2, Palette, SquareCode,
} from 'lucide-react'
import { FONT_OPTIONS } from '@/lib/builder/theme'
import { safeHref, type LinkValue } from '@/lib/builder/links'
import { LinkField } from './link-field'
import { MediaPickerDialog } from './media'
import { Btn, Dialog, IconBtn, cx, inputClass } from './ui'
import { CALLOUTS, Callout, INLINE_STYLES, StyleClass, setStyleClass, toggleCallout, unsetStyleClass } from './rich-text-styles'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './menu'
import { Paintbrush } from 'lucide-react'

// Adds a font-weight attribute to TipTap's textStyle mark.
const FontWeight = Extension.create({
  name: 'fontWeight',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontWeight: {
            default: null,
            parseHTML: (el) => (el as HTMLElement).style.fontWeight || null,
            renderHTML: (attrs) => (attrs.fontWeight ? { style: `font-weight: ${attrs.fontWeight}` } : {}),
          },
        },
      },
    ]
  },
})

// Theme colours are stored as CSS variables so text follows theme changes.
const THEME_COLORS = [
  { value: 'var(--primary)', label: 'Theme primary' },
  { value: 'var(--primary-dark)', label: 'Theme secondary' },
  { value: 'var(--accent)', label: 'Theme accent' },
  { value: 'var(--heading-color)', label: 'Theme headings' },
  { value: 'var(--muted-foreground)', label: 'Theme soft text' },
]
const COLORS = ['#172b2b', '#b42318', '#c2410c', '#15803d', '#1d4ed8', '#7c3aed', '#be185d', '#475569', '#ffffff']
const HIGHLIGHTS = ['#fbeeb8', '#d7f0e8', '#dbeafe', '#fde2e2', '#ede9fe']
const SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px']

function useEditorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      link: { openOnClick: false, autolink: true, defaultProtocol: 'https', HTMLAttributes: { rel: 'noopener noreferrer', target: null } },
    }),
    TextStyle,
    Color,
    BackgroundColor,
    FontFamily,
    FontSize,
    LineHeight,
    FontWeight,
    Highlight.configure({ multicolor: true }),
    Subscript,
    Superscript,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    TableKit.configure({ table: { resizable: false } }),
    Image.configure({ inline: false, allowBase64: false, resize: { enabled: true, alwaysPreserveAspectRatio: true, minWidth: 60, minHeight: 40 } }),
    StyleClass,
    Callout,
  ]
}

function blockType(editor: Editor): string {
  for (let l = 1; l <= 6; l++) if (editor.isActive('heading', { level: l })) return `h${l}`
  if (editor.isActive('textStyle', { fontSize: '0.85em' })) return 'small'
  return 'p'
}

function ColorMenu({ editor, kind, onDone }: { editor: Editor; kind: 'color' | 'highlight'; onDone: () => void }) {
  const list = kind === 'color' ? COLORS : HIGHLIGHTS
  return (
    <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-xl border border-border bg-surface p-2.5 shadow-xl" role="menu">
      {kind === 'color' && (
        <>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Theme colours</p>
          <div className="mb-2.5 grid grid-cols-5 gap-1">
            {THEME_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                aria-label={c.label}
                className="size-7 rounded-md border border-black/10 ring-offset-1 hover:ring-2 hover:ring-primary/40"
                style={{ background: c.value }}
                onClick={() => {
                  editor.chain().focus().setColor(c.value).run()
                  onDone()
                }}
              />
            ))}
          </div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Colours</p>
        </>
      )}
      <div className="grid grid-cols-5 gap-1">
        {list.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`${kind === 'color' ? 'Text colour' : 'Highlight'} ${c}`}
            className="size-7 rounded border border-black/10"
            style={{ background: c }}
            onClick={() => {
              if (kind === 'color') editor.chain().focus().setColor(c).run()
              else editor.chain().focus().toggleHighlight({ color: c }).run()
              onDone()
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="color"
          aria-label="Custom colour"
          className="h-7 w-10 cursor-pointer rounded border border-border"
          onChange={(e) => {
            if (kind === 'color') editor.chain().focus().setColor(e.target.value).run()
            else editor.chain().focus().setHighlight({ color: e.target.value }).run()
          }}
        />
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            if (kind === 'color') editor.chain().focus().unsetColor().run()
            else editor.chain().focus().unsetHighlight().run()
            onDone()
          }}
        >
          Remove
        </button>
      </div>
    </div>
  )
}

function LinkDialog({ editor, open, onClose }: { editor: Editor; open: boolean; onClose: () => void }) {
  const [value, setValue] = useState<LinkValue>({})
  useEffect(() => {
    if (!open) return
    const attrs = editor.getAttributes('link')
    setValue({ href: attrs.href ?? '', newTab: attrs.target === '_blank' })
  }, [open, editor])

  function apply() {
    const href = safeHref(value.href ?? '')
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      const attrs = { href, target: value.newTab ? '_blank' : null, rel: value.newTab ? 'noopener noreferrer' : null }
      if (editor.state.selection.empty && !editor.isActive('link')) {
        editor.chain().focus().insertContent({ type: 'text', text: href.replace(/^(mailto:|tel:)/, ''), marks: [{ type: 'link', attrs }] }).run()
      } else editor.chain().focus().extendMarkRange('link').setLink(attrs).run()
    }
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editor.isActive('link') ? 'Edit link' : 'Add link'}
      size="sm"
      footer={
        <>
          {editor.isActive('link') && (
            <Btn variant="ghost" onClick={() => (editor.chain().focus().extendMarkRange('link').unsetLink().run(), onClose())}>Remove link</Btn>
          )}
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={apply}>Apply</Btn>
        </>
      }
    >
      <LinkField value={value} onChange={setValue} allowNone={false} />
    </Dialog>
  )
}

export function RichTextToolbar({ editor, compact = false }: { editor: Editor; compact?: boolean }) {
  const [menu, setMenu] = useState<'color' | 'highlight' | 'table' | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [imageOpen, setImageOpen] = useState(false)

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: blockType(e),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      highlight: e.isActive('highlight'),
      sup: e.isActive('superscript'),
      sub: e.isActive('subscript'),
      link: e.isActive('link'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      task: e.isActive('taskList'),
      quote: e.isActive('blockquote'),
      codeBlock: e.isActive('codeBlock'),
      table: e.isActive('table'),
      align: (['left', 'center', 'right', 'justify'] as const).find((a) => e.isActive({ textAlign: a })) ?? 'left',
      font: (e.getAttributes('textStyle').fontFamily as string | undefined) ?? '',
      size: (e.getAttributes('textStyle').fontSize as string | undefined) ?? '',
      weight: (e.getAttributes('textStyle').fontWeight as string | undefined) ?? '',
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })

  const chain = () => editor.chain().focus()
  const sel = cx(inputClass, 'h-8 w-auto py-0 text-xs')

  function setBlock(v: string) {
    if (v === 'p') chain().setParagraph().unsetFontSize().run()
    else if (v === 'small') chain().setParagraph().setFontSize('0.85em').run()
    else chain().toggleHeading({ level: Number(v.slice(1)) as 1 }).run()
  }

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 rounded-t-lg border border-border bg-surface p-1 text-foreground shadow-sm"
      role="toolbar"
      aria-label="Text formatting"
      onMouseDown={(e) => {
        // Keep the editor selection when clicking toolbar buttons.
        if ((e.target as HTMLElement).closest('button')) e.preventDefault()
      }}
    >
      <IconBtn label="Undo" onClick={() => chain().undo().run()} disabled={!state.canUndo}><Undo2 /></IconBtn>
      <IconBtn label="Redo" onClick={() => chain().redo().run()} disabled={!state.canRedo}><Redo2 /></IconBtn>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <select aria-label="Text style" className={sel} value={state.block} onChange={(e) => setBlock(e.target.value)}>
        <option value="p">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
        <option value="h5">Heading 5</option>
        <option value="h6">Heading 6</option>
        <option value="small">Small text</option>
      </select>
      <Menu
        label="Text styles"
        width={250}
        align="start"
        trigger={(t) => (
          <button type="button" {...t} className={cx(sel, 'inline-flex items-center gap-1.5 font-semibold')} aria-label="Text styles">
            <Paintbrush className="size-3.5" /> Styles
          </button>
        )}
      >
        <MenuLabel>Text styles (select text first)</MenuLabel>
        {INLINE_STYLES.map((st) => (
          <MenuItem key={st.cls} onSelect={() => setStyleClass(editor, st.cls)} icon={<span className={cx('block w-8 truncate text-left text-xs', st.cls)}>Aa</span>}>
            <span className="flex flex-col leading-tight">
              <span>{st.label}</span>
              <span className="text-[10px] font-normal text-slate-400">{st.hint}</span>
            </span>
          </MenuItem>
        ))}
        <MenuItem onSelect={() => unsetStyleClass(editor)} icon={<Eraser />}>Remove text style</MenuItem>
        <MenuSeparator />
        <MenuLabel>Boxes</MenuLabel>
        {CALLOUTS.map((c) => (
          <MenuItem key={c.variant} onSelect={() => toggleCallout(editor, c.variant)} icon={<span className={cx('block size-4 rounded border-l-4', c.variant === 'info' ? 'border-primary bg-primary/10' : c.variant === 'success' ? 'border-emerald-600 bg-emerald-50' : c.variant === 'warning' ? 'border-amber-500 bg-amber-50' : 'border-slate-400 bg-slate-100')} />}>
            {c.label}
          </MenuItem>
        ))}
      </Menu>
      {!compact && (
        <>
          <select aria-label="Font" className={cx(sel, 'max-w-28')} value={state.font} onChange={(e) => (e.target.value ? chain().setFontFamily(e.target.value).run() : chain().unsetFontFamily().run())}>
            <option value="">Default font</option>
            {FONT_OPTIONS.map((f) => (
              <option key={f.name} value={f.name}>{f.name}</option>
            ))}
          </select>
          <select aria-label="Font size" className={sel} value={state.size} onChange={(e) => (e.target.value ? chain().setFontSize(e.target.value).run() : chain().unsetFontSize().run())}>
            <option value="">Size</option>
            {SIZES.map((s) => (
              <option key={s} value={s}>{s.replace('px', '')}</option>
            ))}
            {state.size && !SIZES.includes(state.size) && <option value={state.size}>{state.size}</option>}
          </select>
          <select
            aria-label="Font weight"
            className={sel}
            value={state.weight}
            onChange={(e) => (e.target.value ? chain().setMark('textStyle', { fontWeight: e.target.value }).run() : chain().setMark('textStyle', { fontWeight: null }).removeEmptyTextStyle().run())}
          >
            <option value="">Weight</option>
            <option value="300">Light</option>
            <option value="400">Regular</option>
            <option value="500">Medium</option>
            <option value="600">Semibold</option>
            <option value="700">Bold</option>
            <option value="800">Extra bold</option>
          </select>
        </>
      )}
      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <IconBtn label="Bold (Ctrl+B)" active={state.bold} onClick={() => chain().toggleBold().run()}><Bold /></IconBtn>
      <IconBtn label="Italic (Ctrl+I)" active={state.italic} onClick={() => chain().toggleItalic().run()}><Italic /></IconBtn>
      <IconBtn label="Underline (Ctrl+U)" active={state.underline} onClick={() => chain().toggleUnderline().run()}><UnderlineIcon /></IconBtn>
      <IconBtn label="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()}><Strikethrough /></IconBtn>
      <span className="relative">
        <IconBtn label="Text colour" onClick={() => setMenu(menu === 'color' ? null : 'color')} aria-expanded={menu === 'color'}><Palette /></IconBtn>
        {menu === 'color' && <ColorMenu editor={editor} kind="color" onDone={() => setMenu(null)} />}
      </span>
      <span className="relative">
        <IconBtn label="Highlight" active={state.highlight} onClick={() => setMenu(menu === 'highlight' ? null : 'highlight')} aria-expanded={menu === 'highlight'}><Highlighter /></IconBtn>
        {menu === 'highlight' && <ColorMenu editor={editor} kind="highlight" onDone={() => setMenu(null)} />}
      </span>
      <IconBtn label="Superscript" active={state.sup} onClick={() => chain().toggleSuperscript().run()}><SupIcon /></IconBtn>
      <IconBtn label="Subscript" active={state.sub} onClick={() => chain().toggleSubscript().run()}><SubIcon /></IconBtn>
      <IconBtn label="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()}><Eraser /></IconBtn>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <IconBtn label="Align left" active={state.align === 'left'} onClick={() => chain().setTextAlign('left').run()}><AlignLeft /></IconBtn>
      <IconBtn label="Align centre" active={state.align === 'center'} onClick={() => chain().setTextAlign('center').run()}><AlignCenter /></IconBtn>
      <IconBtn label="Align right" active={state.align === 'right'} onClick={() => chain().setTextAlign('right').run()}><AlignRight /></IconBtn>
      <IconBtn label="Justify" active={state.align === 'justify'} onClick={() => chain().setTextAlign('justify').run()}><AlignJustify /></IconBtn>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <IconBtn label="Bulleted list" active={state.bullet} onClick={() => chain().toggleBulletList().run()}><List /></IconBtn>
      <IconBtn label="Numbered list" active={state.ordered} onClick={() => chain().toggleOrderedList().run()}><ListOrdered /></IconBtn>
      <IconBtn label="Checklist" active={state.task} onClick={() => chain().toggleTaskList().run()}><ListChecks /></IconBtn>
      <IconBtn label="Indent list item" onClick={() => chain().sinkListItem(state.task ? 'taskItem' : 'listItem').run()}><IndentIncrease /></IconBtn>
      <IconBtn label="Outdent list item" onClick={() => chain().liftListItem(state.task ? 'taskItem' : 'listItem').run()}><IndentDecrease /></IconBtn>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <IconBtn label="Add or edit link" active={state.link} onClick={() => setLinkOpen(true)}><Link2 /></IconBtn>
      {state.link && <IconBtn label="Remove link" onClick={() => chain().extendMarkRange('link').unsetLink().run()}><Link2Off /></IconBtn>}
      <IconBtn label="Insert image" onClick={() => setImageOpen(true)}><ImagePlus /></IconBtn>
      <IconBtn label="Quote" active={state.quote} onClick={() => chain().toggleBlockquote().run()}><Quote /></IconBtn>
      <IconBtn label="Code block" active={state.codeBlock} onClick={() => chain().toggleCodeBlock().run()}><SquareCode /></IconBtn>
      <IconBtn label="Inline code" onClick={() => chain().toggleCode().run()}><Code /></IconBtn>
      <IconBtn label="Horizontal line" onClick={() => chain().setHorizontalRule().run()}><Minus /></IconBtn>
      <span className="relative">
        <IconBtn label="Table" active={state.table} onClick={() => setMenu(menu === 'table' ? null : 'table')} aria-expanded={menu === 'table'}><TableIcon /></IconBtn>
        {menu === 'table' && (
          <div className="absolute right-0 top-full z-50 mt-1 flex w-48 flex-col rounded-lg border border-border bg-surface p-1 text-xs shadow-xl" role="menu">
            {[
              ['Insert table (3×3)', () => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()],
              ['Add row below', () => chain().addRowAfter().run()],
              ['Add column right', () => chain().addColumnAfter().run()],
              ['Delete row', () => chain().deleteRow().run()],
              ['Delete column', () => chain().deleteColumn().run()],
              ['Toggle header row', () => chain().toggleHeaderRow().run()],
              ['Merge / split cells', () => chain().mergeOrSplit().run()],
              ['Delete table', () => chain().deleteTable().run()],
            ].map(([label, fn]) => (
              <button
                key={label as string}
                type="button"
                role="menuitem"
                className="rounded px-2 py-1.5 text-left hover:bg-muted disabled:opacity-40"
                disabled={label !== 'Insert table (3×3)' && !state.table}
                onClick={() => {
                  ;(fn as () => void)()
                  setMenu(null)
                }}
              >
                {label as string}
              </button>
            ))}
          </div>
        )}
      </span>
      <LinkDialog editor={editor} open={linkOpen} onClose={() => setLinkOpen(false)} />
      <MediaPickerDialog
        open={imageOpen}
        onClose={() => setImageOpen(false)}
        onSelect={({ url, alt }) => {
          const altText = alt ?? window.prompt('Describe this image for people using screen readers (alt text):') ?? ''
          chain().setImage({ src: url, alt: altText }).run()
        }}
      />
    </div>
  )
}

// Floating toolbar shown when text is selected.
function SelectionMenu({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false)
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({ bold: e.isActive('bold'), italic: e.isActive('italic'), link: e.isActive('link'), align: (['left', 'center', 'right'] as const).find((a) => e.isActive({ textAlign: a })) ?? 'left' }),
  })
  const [colorOpen, setColorOpen] = useState(false)
  return (
    <>
      <BubbleMenu editor={editor} appendTo={() => document.body} options={{ placement: 'top', strategy: 'fixed' }} shouldShow={({ editor: e, state: s }) => !s.selection.empty && !e.isActive('image') && !e.isActive('codeBlock')}>
        <div className="admin-ui flex items-center gap-0.5 rounded-xl border border-border bg-surface p-1 text-foreground shadow-xl" onMouseDown={(e) => e.preventDefault()}>
          <IconBtn label="Bold" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}><Bold /></IconBtn>
          <IconBtn label="Italic" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic /></IconBtn>
          <IconBtn label="Link" active={state.link} onClick={() => setLinkOpen(true)}><Link2 /></IconBtn>
          <span className="relative">
            <IconBtn label="Colour" onClick={() => setColorOpen(!colorOpen)}><Palette /></IconBtn>
            {colorOpen && <ColorMenu editor={editor} kind="color" onDone={() => setColorOpen(false)} />}
          </span>
          <IconBtn label="Align left" active={state.align === 'left'} onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft /></IconBtn>
          <IconBtn label="Align centre" active={state.align === 'center'} onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter /></IconBtn>
          <IconBtn label="Align right" active={state.align === 'right'} onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight /></IconBtn>
        </div>
      </BubbleMenu>
      <LinkDialog editor={editor} open={linkOpen} onClose={() => setLinkOpen(false)} />
    </>
  )
}

export function RichTextEditor({
  html,
  onChange,
  autofocus = false,
  className,
  compact = false,
  stickyToolbar = true,
  toolbarTarget,
}: {
  html: string
  onChange: (html: string) => void
  autofocus?: boolean
  className?: string
  compact?: boolean
  stickyToolbar?: boolean
  // Render the toolbar somewhere else (the builder docks it above the canvas).
  toolbarTarget?: HTMLElement | null
}) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: useEditorExtensions(),
    content: html,
    immediatelyRender: false,
    autofocus: autofocus ? 'end' : false,
    editorProps: { attributes: { class: cx('pb-rich min-h-[3em] outline-none', className), 'aria-label': 'Rich text editor', role: 'textbox', 'aria-multiline': 'true' } },
    onUpdate: ({ editor: e }) => {
      // Debounced so typing doesn't flood the undo history / autosave.
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => onChangeRef.current(e.getHTML()), 300)
    },
    onBlur: ({ editor: e }) => {
      if (timer.current) clearTimeout(timer.current)
      onChangeRef.current(e.getHTML())
    },
  })

  // Follow outside changes (undo/redo, the other editor) while not typing here.
  useEffect(() => {
    if (!editor || editor.isFocused) return
    if (html !== editor.getHTML()) editor.commands.setContent(html, { emitUpdate: false })
  }, [html, editor])

  // Flush pending changes when the editor closes.
  useEffect(() => () => {
    if (timer.current && editor) {
      clearTimeout(timer.current)
      onChangeRef.current(editor.getHTML())
    }
  }, [editor])

  if (!editor) return <div className="pb-rich min-h-[3em] opacity-60" dangerouslySetInnerHTML={{ __html: html }} />

  const toolbar = (
    <div className={cx('admin-ui', stickyToolbar && !toolbarTarget && 'sticky top-0 z-30')} style={{ fontSize: 14, lineHeight: 1.4, textAlign: 'left', background: 'transparent' }}>
      <RichTextToolbar editor={editor} compact={compact} />
    </div>
  )
  return (
    <div className="pb-rte" onKeyDown={(e) => e.stopPropagation()}>
      {toolbarTarget ? createPortal(toolbar, toolbarTarget) : toolbar}
      <div className={cx('border border-dashed border-primary/50 p-2', toolbarTarget ? 'rounded-lg' : 'rounded-b-lg border-t-0')}>
        <EditorContent editor={editor} />
      </div>
      <SelectionMenu editor={editor} />
    </div>
  )
}
