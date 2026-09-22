import type { BackgroundValue, BoxValue, BuilderNode, Device, PageDoc, Style } from './types'
import { walk } from './tree'

// Responsive rules use container queries on the page wrapper (`.pb-page`)
// rather than viewport media queries, so the builder canvas can preview the
// tablet/mobile layouts faithfully just by narrowing the canvas.
export const BREAKPOINTS: Record<Exclude<Device, 'desktop'>, number> = { tablet: 1024, mobile: 640 }
export const DEVICE_WIDTHS: Record<Device, number | null> = { desktop: null, tablet: 820, mobile: 390 }

export const SPACING_PRESETS: { value: string; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'xs', label: 'XS' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'XL' },
]

export const RADIUS_PRESETS = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'pill', label: 'Pill' },
]

export const SHADOW_PRESETS = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
]

const SPACE_TOKENS = new Set(['none', 'xs', 'sm', 'md', 'lg', 'xl'])
const RADIUS_TOKENS = new Set(['none', 'sm', 'md', 'lg', 'pill'])
const SHADOW_TOKENS = new Set(['none', 'sm', 'md', 'lg'])

// ---------------------------------------------------------------------------
// Value sanitizing: admin-entered values end up inside a <style> tag, so
// anything that could close the rule/tag or load remote code is dropped.
// ---------------------------------------------------------------------------

const UNSAFE_VALUE = /[<>{};\\]|expression\s*\(|javascript:|@import|url\s*\(|behavior\s*:|-moz-binding/i

export function safeCssValue(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  const v = String(value).trim()
  if (!v || v.length > 200 || UNSAFE_VALUE.test(v)) return null
  return v
}

export function safeUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  if (!v) return null
  if (!/^(https?:\/\/|\/)/i.test(v)) return null
  return /["'()<>\\\s]/.test(v) ? null : v
}

// Custom CSS: declarations only. Rejects anything that could escape the rule.
export function safeDeclarations(css: unknown): string {
  if (typeof css !== 'string') return ''
  return css
    .split(/[;\n]/)
    .map((d) => d.trim())
    .filter((d) => /^-?[a-z-]+\s*:\s*[^;]+$/i.test(d))
    .filter((d) => !/[<>{}\\]|expression\s*\(|javascript:|@import|behavior\s*:|-moz-binding|url\s*\(\s*['"]?\s*(javascript|data):/i.test(d))
    .join(';')
}

function space(v: string | undefined): string | null {
  if (!v) return null
  if (SPACE_TOKENS.has(v)) return v === 'none' ? '0' : `var(--pb-space-${v})`
  return safeCssValue(v)
}

function radius(v: string | undefined): string | null {
  if (!v) return null
  if (RADIUS_TOKENS.has(v)) return v === 'none' ? '0' : `var(--pb-radius-${v})`
  return safeCssValue(v)
}

function shadow(v: string | undefined): string | null {
  if (!v) return null
  if (SHADOW_TOKENS.has(v)) return v === 'none' ? 'none' : `var(--pb-shadow-${v})`
  return safeCssValue(v)
}

function box(prop: 'margin' | 'padding', value: BoxValue | undefined, out: string[]) {
  if (!value) return
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    const v = space(value[side])
    if (v !== null) out.push(`${prop}-${side}:${v}`)
  }
}

export function backgroundCss(bg: BackgroundValue | undefined, out: string[]) {
  if (!bg || !bg.type || bg.type === 'none') return
  if (bg.type === 'color') {
    const c = safeCssValue(bg.color)
    if (c) out.push(`background-color:${c}`)
  } else if (bg.type === 'gradient') {
    const from = safeCssValue(bg.gradientFrom) ?? 'var(--primary)'
    const to = safeCssValue(bg.gradientTo) ?? 'var(--primary-dark)'
    const angle = Number.isFinite(bg.gradientAngle) ? bg.gradientAngle : 135
    out.push(`background-image:linear-gradient(${angle}deg,${from},${to})`)
  } else if (bg.type === 'image') {
    const url = safeUrl(bg.image)
    if (url) {
      out.push(`background-image:url("${url}")`)
      out.push(`background-size:${bg.imageSize ?? 'cover'}`)
      out.push(`background-position:${safeCssValue(bg.imagePosition) ?? 'center'}`)
      out.push(`background-repeat:${bg.imageRepeat ?? 'no-repeat'}`)
      if (bg.imageFixed) out.push('background-attachment:fixed')
    }
    const c = safeCssValue(bg.color)
    if (c) out.push(`background-color:${c}`)
  } else if (bg.type === 'video') {
    const c = safeCssValue(bg.color)
    if (c) out.push(`background-color:${c}`)
  }
}

const SIMPLE: [keyof Style, string][] = [
  ['fontSize', 'font-size'],
  ['fontWeight', 'font-weight'],
  ['lineHeight', 'line-height'],
  ['letterSpacing', 'letter-spacing'],
  ['textTransform', 'text-transform'],
  ['fontStyle', 'font-style'],
  ['color', 'color'],
  ['textAlign', 'text-align'],
  ['width', 'width'],
  ['maxWidth', 'max-width'],
  ['height', 'height'],
  ['minHeight', 'min-height'],
  ['gap', 'gap'],
  ['alignItems', 'align-items'],
  ['justifyContent', 'justify-content'],
  ['borderWidth', 'border-width'],
  ['borderStyle', 'border-style'],
  ['borderColor', 'border-color'],
  ['opacity', 'opacity'],
  ['objectFit', 'object-fit'],
  ['objectPosition', 'object-position'],
  ['aspectRatio', 'aspect-ratio'],
  ['position', 'position'],
  ['top', 'top'],
  ['right', 'right'],
  ['bottom', 'bottom'],
  ['left', 'left'],
  ['zIndex', 'z-index'],
]

export function styleDeclarations(style: Style | undefined): string[] {
  if (!style) return []
  const out: string[] = []
  if (style.fontFamily) {
    const f = safeCssValue(style.fontFamily)
    if (f) out.push(`font-family:${f.startsWith('var(') ? f : `"${f.replace(/"/g, '')}",var(--body-font)`}`)
  }
  for (const [key, prop] of SIMPLE) {
    const v = safeCssValue(style[key] as string | undefined)
    if (v !== null) out.push(`${prop}:${v}`)
  }
  // A border style without a width would be invisible; default it.
  if (style.borderStyle && style.borderStyle !== 'none' && !style.borderWidth) out.push('border-width:1px')
  const r = radius(style.borderRadius)
  if (r !== null) out.push(`border-radius:${r}`)
  const s = shadow(style.boxShadow)
  if (s !== null) out.push(`box-shadow:${s}`)
  box('margin', style.margin, out)
  box('padding', style.padding, out)
  backgroundCss(style.background, out)
  if (style.align === 'center') out.push('margin-left:auto', 'margin-right:auto')
  else if (style.align === 'right') out.push('margin-left:auto', 'margin-right:0')
  else if (style.align === 'left') out.push('margin-left:0', 'margin-right:auto')
  else if (style.align === 'full') out.push('width:100%', 'max-width:none')
  return out
}

const EASINGS: Record<string, string> = {
  ease: 'ease',
  'ease-out': 'cubic-bezier(.2,.7,.2,1)',
  'ease-in-out': 'cubic-bezier(.65,0,.35,1)',
  spring: 'cubic-bezier(.34,1.56,.64,1)',
  linear: 'linear',
}

export function nodeClass(node: BuilderNode): string {
  return `n-${node.id}`
}

// Builds the page's scoped stylesheet: one rule per styled node, plus
// tablet/mobile overrides inside container queries.
export function docCss(doc: PageDoc | { sections: BuilderNode[] }): string {
  const base: string[] = []
  const tablet: string[] = []
  const mobile: string[] = []

  walk(doc.sections, (node) => {
    const sel = `.${nodeClass(node)}`
    const d = styleDeclarations(node.style?.desktop)
    const custom = safeDeclarations(node.advanced?.css)
    if (d.length || custom) base.push(`${sel}{${[...d, custom].filter(Boolean).join(';')}}`)
    const t = styleDeclarations(node.style?.tablet)
    if (t.length) tablet.push(`${sel}{${t.join(';')}}`)
    const m = styleDeclarations(node.style?.mobile)
    if (m.length) mobile.push(`${sel}{${m.join(';')}}`)
    if (node.animation?.type && node.animation.type !== 'none') {
      const dur = Math.max(0, Math.min(5000, Number(node.animation.duration) || 600))
      const delay = Math.max(0, Math.min(5000, Number(node.animation.delay) || 0))
      const ease = EASINGS[node.animation.easing ?? 'ease-out'] ?? EASINGS['ease-out']
      base.push(`${sel}{--pb-anim-duration:${dur}ms;--pb-anim-delay:${delay}ms;--pb-anim-ease:${ease}}`)
    }
  })

  let css = base.join('\n')
  if (tablet.length) css += `\n@container pb (max-width:${BREAKPOINTS.tablet}px){${tablet.join('\n')}}`
  if (mobile.length) css += `\n@container pb (max-width:${BREAKPOINTS.mobile}px){${mobile.join('\n')}}`
  return css
}

// Resolve a single style property for the device currently being edited,
// falling back desktop → tablet → mobile like the cascade does.
export function resolveStyle(node: BuilderNode, device: Device): Style {
  const d = node.style?.desktop ?? {}
  if (device === 'desktop') return d
  const t = { ...d, ...(node.style?.tablet ?? {}) }
  if (device === 'tablet') return t
  return { ...t, ...(node.style?.mobile ?? {}) }
}
