import type { ThemeSettings } from './types'
import { safeCssValue } from './styles'

// Defaults mirror the site's original design tokens in app/globals.css, so an
// untouched theme renders the site exactly as before.
export const DEFAULT_THEME: ThemeSettings = {
  colors: {
    primary: '#146b68',
    secondary: '#0d4f4d',
    accent: '#d9b84d',
    background: '#f8faf9',
    surface: '#ffffff',
    text: '#172b2b',
    heading: '#0d4f4d',
    muted: '#56706e',
    border: '#cbdad6',
    link: '#146b68',
    tint: '#eaf1ef',
    footer: '#132d2c',
  },
  typography: {
    headingFont: 'Fraunces',
    bodyFont: 'Inter',
    baseSize: 17,
    headingWeight: '400',
    bodyWeight: '400',
    lineHeight: 1.65,
    headingScale: 'default',
  },
  buttons: { radius: '0px', paddingX: '20px', paddingY: '14px', fontWeight: '700', textTransform: 'none' },
  cards: { radius: '14px', shadow: 'none', border: true },
  layout: { containerWidth: 1180, sectionSpacing: 'default', radius: '6px' },
  forms: { radius: '4px' },
}

export const THEME_COLOR_TOKENS: { key: keyof ThemeSettings['colors']; label: string; cssVar: string; hint: string }[] = [
  { key: 'primary', label: 'Primary', cssVar: '--primary', hint: 'Buttons, links and highlights' },
  { key: 'secondary', label: 'Secondary', cssVar: '--primary-dark', hint: 'Dark bands, hover states' },
  { key: 'accent', label: 'Accent', cssVar: '--accent', hint: 'Underlines and small details' },
  { key: 'background', label: 'Background', cssVar: '--background', hint: 'Page background' },
  { key: 'surface', label: 'Surface', cssVar: '--surface', hint: 'Cards and panels' },
  { key: 'text', label: 'Text', cssVar: '--foreground', hint: 'Body text' },
  { key: 'heading', label: 'Headings', cssVar: '--heading-color', hint: 'Heading text' },
  { key: 'muted', label: 'Muted text', cssVar: '--muted-foreground', hint: 'Captions and secondary text' },
  { key: 'border', label: 'Border', cssVar: '--border', hint: 'Lines and dividers' },
  { key: 'link', label: 'Links', cssVar: '--link-color', hint: 'Text links' },
  { key: 'tint', label: 'Tinted background', cssVar: '--tint', hint: 'Soft bands, page headers, cards' },
  { key: 'footer', label: 'Footer', cssVar: '--footer-bg', hint: 'Site footer background' },
]

// Fonts offered in the pickers. Inter and Fraunces are already self-hosted via
// next/font; anything else is loaded from Google Fonts only when used.
export const FONT_OPTIONS: { name: string; category: 'sans' | 'serif' | 'display' | 'system' }[] = [
  { name: 'Inter', category: 'sans' },
  { name: 'Fraunces', category: 'serif' },
  { name: 'DM Sans', category: 'sans' },
  { name: 'IBM Plex Sans', category: 'sans' },
  { name: 'Lato', category: 'sans' },
  { name: 'Montserrat', category: 'sans' },
  { name: 'Nunito', category: 'sans' },
  { name: 'Open Sans', category: 'sans' },
  { name: 'Poppins', category: 'sans' },
  { name: 'Raleway', category: 'sans' },
  { name: 'Roboto', category: 'sans' },
  { name: 'Source Sans 3', category: 'sans' },
  { name: 'Work Sans', category: 'sans' },
  { name: 'Space Grotesk', category: 'display' },
  { name: 'EB Garamond', category: 'serif' },
  { name: 'IBM Plex Serif', category: 'serif' },
  { name: 'Libre Baskerville', category: 'serif' },
  { name: 'Lora', category: 'serif' },
  { name: 'Merriweather', category: 'serif' },
  { name: 'Playfair Display', category: 'serif' },
  { name: 'System UI', category: 'system' },
  { name: 'Georgia', category: 'system' },
]

const SELF_HOSTED: Record<string, string> = {
  Inter: 'var(--font-inter)',
  Fraunces: 'var(--font-fraunces)',
}
const SYSTEM: Record<string, string> = {
  'System UI': 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
  Georgia: 'Georgia,"Times New Roman",serif',
}

export function isValidFontName(name: string): boolean {
  return /^[A-Za-z0-9 ]{2,40}$/.test(name)
}

export function fontStack(name: string, fallback: 'sans' | 'serif'): string {
  if (SELF_HOSTED[name]) return `${SELF_HOSTED[name]},${fallback === 'serif' ? 'Georgia,serif' : 'Arial,sans-serif'}`
  if (SYSTEM[name]) return SYSTEM[name]
  if (!isValidFontName(name)) return fallback === 'serif' ? 'Georgia,serif' : 'Arial,sans-serif'
  return `"${name}",${fallback === 'serif' ? 'Georgia,serif' : 'Arial,sans-serif'}`
}

// Google Fonts stylesheet for any non-self-hosted fonts in use (theme fonts
// plus per-element font choices found in page content).
export function googleFontsHref(fonts: Iterable<string>): string | null {
  const families = [...new Set(fonts)].filter((f) => f && !SELF_HOSTED[f] && !SYSTEM[f] && isValidFontName(f))
  if (families.length === 0) return null
  const params = families
    .slice(0, 8)
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${params}&display=swap`
}

const SCALES = {
  compact: [2.6, 2.1, 1.7, 1.35, 1.15, 1],
  default: [3.4, 2.6, 2, 1.5, 1.2, 1],
  large: [4.4, 3.2, 2.3, 1.7, 1.3, 1.05],
}

const SECTION_SPACING = { compact: '56px', default: '88px', spacious: '124px' }
const CARD_SHADOW = { none: 'none', sm: 'var(--pb-shadow-sm)', md: 'var(--pb-shadow-md)', lg: 'var(--pb-shadow-lg)' }

export function mergeTheme(value: unknown): ThemeSettings {
  const v = (value && typeof value === 'object' ? value : {}) as Partial<ThemeSettings>
  return {
    colors: { ...DEFAULT_THEME.colors, ...(v.colors ?? {}) },
    typography: { ...DEFAULT_THEME.typography, ...(v.typography ?? {}) },
    buttons: { ...DEFAULT_THEME.buttons, ...(v.buttons ?? {}) },
    cards: { ...DEFAULT_THEME.cards, ...(v.cards ?? {}) },
    layout: { ...DEFAULT_THEME.layout, ...(v.layout ?? {}) },
    forms: { ...DEFAULT_THEME.forms, ...(v.forms ?? {}) },
  }
}

// CSS custom properties for the theme. `selector` is `html:root` on the public
// site (beating next/font's class-scoped variables) and a wrapper class
// inside the admin so the admin UI itself isn't re-themed.
export function themeCss(theme: ThemeSettings, selector = 'html:root'): string {
  const c = theme.colors
  const t = theme.typography
  const vars: Record<string, string | null> = {
    '--primary': safeCssValue(c.primary),
    '--primary-dark': safeCssValue(c.secondary),
    '--accent': safeCssValue(c.accent),
    '--background': safeCssValue(c.background),
    '--surface': safeCssValue(c.surface),
    '--foreground': safeCssValue(c.text),
    '--heading-color': safeCssValue(c.heading),
    '--muted-foreground': safeCssValue(c.muted),
    '--border': safeCssValue(c.border),
    '--link-color': safeCssValue(c.link),
    '--tint': safeCssValue(c.tint),
    '--muted': safeCssValue(c.tint),
    '--footer-bg': safeCssValue(c.footer),
    '--heading-font': fontStack(t.headingFont, 'serif'),
    '--body-font': fontStack(t.bodyFont, 'sans'),
    '--heading-weight': safeCssValue(t.headingWeight),
    '--body-weight': safeCssValue(t.bodyWeight),
    '--pb-base-size': `${Math.max(12, Math.min(24, Number(t.baseSize) || 17))}px`,
    '--pb-line-height': String(Math.max(1, Math.min(2.4, Number(t.lineHeight) || 1.65))),
    '--pb-container': `${Math.max(720, Math.min(1920, Number(theme.layout.containerWidth) || 1180))}px`,
    '--pb-section-y': SECTION_SPACING[theme.layout.sectionSpacing] ?? SECTION_SPACING.default,
    '--pb-radius-md': safeCssValue(theme.layout.radius),
    '--pb-btn-radius': safeCssValue(theme.buttons.radius),
    '--pb-btn-px': safeCssValue(theme.buttons.paddingX),
    '--pb-btn-py': safeCssValue(theme.buttons.paddingY),
    '--pb-btn-weight': safeCssValue(theme.buttons.fontWeight),
    '--pb-btn-transform': theme.buttons.textTransform === 'uppercase' ? 'uppercase' : 'none',
    '--pb-card-radius': safeCssValue(theme.cards.radius),
    '--pb-card-shadow': CARD_SHADOW[theme.cards.shadow] ?? 'none',
    '--pb-card-border': theme.cards.border ? '1px solid var(--border)' : '0',
    '--pb-input-radius': safeCssValue(theme.forms.radius),
  }
  const scale = SCALES[t.headingScale] ?? SCALES.default
  scale.forEach((s, i) => {
    const min = Math.max(1, s * 0.62).toFixed(2)
    vars[`--pb-h${i + 1}`] = i < 3 ? `clamp(${min}rem, ${(s * 1.6).toFixed(2)}vw + 0.6rem, ${s}rem)` : `${s}rem`
  })
  // Only override the site-wide font variables when a non-default font is
  // chosen, so the original pages pick up the new fonts too.
  if (t.bodyFont !== 'Inter') vars['--font-sans'] = fontStack(t.bodyFont, 'sans')
  if (t.headingFont !== 'Fraunces') vars['--font-serif'] = fontStack(t.headingFont, 'serif')

  const body = Object.entries(vars)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
  return `${selector}{${body}}`
}
