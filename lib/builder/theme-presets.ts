import { DEFAULT_THEME, mergeTheme } from './theme'
import type { ThemeSettings } from './types'

// Ready-made colour schemes (and matching type/shape choices). Applying one
// updates the whole site: templates and blocks use theme tokens, so every
// page follows automatically.

type Colors = ThemeSettings['colors']
export type ThemePreset = { key: string; name: string; description: string; colors: Colors; typography?: Partial<ThemeSettings['typography']>; buttons?: Partial<ThemeSettings['buttons']>; cards?: Partial<ThemeSettings['cards']> }

export const THEME_PRESETS: ThemePreset[] = [
  { key: 'pearl', name: 'PEARL Teal', description: 'The original PEARL look', colors: DEFAULT_THEME.colors },
  {
    key: 'ocean',
    name: 'Ocean Blue',
    description: 'Clean, trustworthy blues',
    colors: { primary: '#1d4ed8', secondary: '#1e3a8a', accent: '#f59e0b', background: '#f8fafc', surface: '#ffffff', text: '#0f172a', heading: '#1e3a8a', muted: '#475569', border: '#cbd5e1', link: '#1d4ed8', tint: '#e8effd', footer: '#0b1a3d' },
    typography: { headingFont: 'DM Sans', bodyFont: 'Inter', headingWeight: '700' },
    buttons: { radius: '10px' },
    cards: { radius: '16px', shadow: 'sm' },
  },
  {
    key: 'forest',
    name: 'Forest',
    description: 'Natural greens and warm gold',
    colors: { primary: '#2f6b3a', secondary: '#1f4526', accent: '#c9a227', background: '#f7f8f3', surface: '#ffffff', text: '#1c2a1e', heading: '#1f4526', muted: '#5b6b5d', border: '#d4dccf', link: '#2f6b3a', tint: '#eaf0e3', footer: '#16261a' },
    typography: { headingFont: 'Lora', bodyFont: 'Source Sans 3' },
    buttons: { radius: '6px' },
  },
  {
    key: 'sunset',
    name: 'Sunset',
    description: 'Warm, welcoming oranges',
    colors: { primary: '#c2410c', secondary: '#7c2d12', accent: '#f59e0b', background: '#fffaf5', surface: '#ffffff', text: '#1f130b', heading: '#7c2d12', muted: '#78604f', border: '#f0dccb', link: '#c2410c', tint: '#fdeee2', footer: '#2a150a' },
    typography: { headingFont: 'Playfair Display', bodyFont: 'Lato' },
    buttons: { radius: '999px' },
    cards: { radius: '20px', shadow: 'md', border: false },
  },
  {
    key: 'plum',
    name: 'Plum',
    description: 'Creative purples with a pink accent',
    colors: { primary: '#7e22ce', secondary: '#4c1d95', accent: '#ec4899', background: '#faf8fe', surface: '#ffffff', text: '#1e1530', heading: '#4c1d95', muted: '#6b5f80', border: '#e0d6f0', link: '#7e22ce', tint: '#f1eafb', footer: '#1f1236' },
    typography: { headingFont: 'Space Grotesk', bodyFont: 'DM Sans', headingWeight: '700' },
    buttons: { radius: '12px' },
    cards: { radius: '18px', shadow: 'md', border: false },
  },
  {
    key: 'rose',
    name: 'Rose',
    description: 'Soft, elegant reds',
    colors: { primary: '#be123c', secondary: '#881337', accent: '#f4a261', background: '#fff8f9', surface: '#ffffff', text: '#2a1117', heading: '#881337', muted: '#7a5a62', border: '#f2d4da', link: '#be123c', tint: '#fde8ec', footer: '#2d0a14' },
    typography: { headingFont: 'EB Garamond', bodyFont: 'Nunito' },
    buttons: { radius: '8px' },
  },
  {
    key: 'slate',
    name: 'Slate Corporate',
    description: 'Neutral, professional greys with sky blue',
    colors: { primary: '#334155', secondary: '#0f172a', accent: '#0ea5e9', background: '#f8fafc', surface: '#ffffff', text: '#0f172a', heading: '#0f172a', muted: '#64748b', border: '#e2e8f0', link: '#0369a1', tint: '#eef2f6', footer: '#0f172a' },
    typography: { headingFont: 'Inter', bodyFont: 'Inter', headingWeight: '700' },
    buttons: { radius: '8px' },
    cards: { radius: '12px', shadow: 'sm' },
  },
  {
    key: 'aqua',
    name: 'Aqua Fresh',
    description: 'Bright teal with a coral accent',
    colors: { primary: '#0e7490', secondary: '#164e63', accent: '#f97316', background: '#f6fbfc', surface: '#ffffff', text: '#0b2530', heading: '#164e63', muted: '#4f6b75', border: '#cfe3e8', link: '#0e7490', tint: '#e0f2f5', footer: '#0b2e38' },
    typography: { headingFont: 'Poppins', bodyFont: 'Open Sans', headingWeight: '600' },
    buttons: { radius: '999px' },
    cards: { radius: '16px', shadow: 'sm' },
  },
  {
    key: 'heritage',
    name: 'Heritage',
    description: 'Classic burgundy and antique gold',
    colors: { primary: '#7f1d1d', secondary: '#450a0a', accent: '#b8860b', background: '#fbf8f3', surface: '#ffffff', text: '#261a15', heading: '#450a0a', muted: '#6e5d52', border: '#e6dccf', link: '#7f1d1d', tint: '#f6ece4', footer: '#2b0b0b' },
    typography: { headingFont: 'Libre Baskerville', bodyFont: 'Source Sans 3' },
    buttons: { radius: '2px', textTransform: 'uppercase' },
  },
  {
    key: 'sand',
    name: 'Sand & Charcoal',
    description: 'Calm neutrals with an amber accent',
    colors: { primary: '#1f2937', secondary: '#111827', accent: '#d97706', background: '#faf7f2', surface: '#ffffff', text: '#1f2937', heading: '#111827', muted: '#6b645a', border: '#e7e0d5', link: '#b45309', tint: '#f1ebe1', footer: '#111827' },
    typography: { headingFont: 'Fraunces', bodyFont: 'Work Sans' },
    buttons: { radius: '0px' },
    cards: { radius: '4px', shadow: 'none' },
  },
]

export function applyPreset(current: ThemeSettings, preset: ThemePreset, withStyle = true): ThemeSettings {
  return mergeTheme({
    ...current,
    colors: { ...preset.colors },
    ...(withStyle
      ? {
          typography: { ...current.typography, ...(preset.typography ?? { headingFont: DEFAULT_THEME.typography.headingFont, bodyFont: DEFAULT_THEME.typography.bodyFont, headingWeight: DEFAULT_THEME.typography.headingWeight }) },
          buttons: { ...current.buttons, ...(preset.buttons ?? { radius: DEFAULT_THEME.buttons.radius, textTransform: DEFAULT_THEME.buttons.textTransform }) },
          cards: { ...current.cards, ...(preset.cards ?? { radius: DEFAULT_THEME.cards.radius, shadow: DEFAULT_THEME.cards.shadow, border: DEFAULT_THEME.cards.border }) },
        }
      : {}),
  })
}

// ----------------------------------------------------------------------------
// Generate a full palette from one brand colour.
// ----------------------------------------------------------------------------

function hexToHsl(hex: string): [number, number, number] | null {
  const m = hex.trim().match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i)
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l * 100]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let hue = 0
  if (max === r) hue = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) hue = (b - r) / d + 2
  else hue = (r - g) / d + 4
  return [hue * 60, s * 100, l * 100]
}

function hsl(h: number, s: number, l: number): string {
  const S = Math.max(0, Math.min(100, s)) / 100
  const L = Math.max(0, Math.min(100, l)) / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = S * Math.min(L, 1 - L)
  const f = (n: number) => L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const to = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`
}

export function paletteFromBrand(hex: string): Colors | null {
  const parsed = hexToHsl(hex)
  if (!parsed) return null
  const [h, s0, l0] = parsed
  const s = Math.max(35, Math.min(85, s0))
  // Keep the primary dark enough for white button text.
  const pl = Math.max(22, Math.min(42, l0))
  return {
    primary: hsl(h, s, pl),
    secondary: hsl(h, s, Math.max(14, pl - 14)),
    accent: hsl((h + 150) % 360, 75, 52),
    background: hsl(h, 25, 98),
    surface: '#ffffff',
    text: hsl(h, 30, 12),
    heading: hsl(h, s, Math.max(14, pl - 14)),
    muted: hsl(h, 12, 40),
    border: hsl(h, 20, 85),
    link: hsl(h, s, pl),
    tint: hsl(h, 40, 94),
    footer: hsl(h, 35, 11),
  }
}
