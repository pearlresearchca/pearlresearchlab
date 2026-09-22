// Content model for the visual page builder.
//
// A page is a list of sections; every section, column, group and block is a
// `BuilderNode`. Content (`props`) is kept separate from presentation
// (`style`), and presentation is responsive: `style.desktop` is the base and
// `tablet` / `mobile` only hold overrides.

export type Device = 'desktop' | 'tablet' | 'mobile'

export type BoxValue = { top?: string; right?: string; bottom?: string; left?: string }

export type BackgroundValue = {
  type?: 'none' | 'color' | 'gradient' | 'image' | 'video'
  color?: string
  gradientFrom?: string
  gradientTo?: string
  gradientAngle?: number
  image?: string
  imagePosition?: string
  imageSize?: 'cover' | 'contain' | 'auto'
  imageRepeat?: 'no-repeat' | 'repeat'
  imageFixed?: boolean
  video?: string
  overlayColor?: string
  overlayOpacity?: number
}

export type Style = {
  // Typography
  fontFamily?: string
  fontSize?: string
  fontWeight?: string
  lineHeight?: string
  letterSpacing?: string
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  fontStyle?: 'normal' | 'italic'
  color?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  // Spacing
  margin?: BoxValue
  padding?: BoxValue
  // Size
  width?: string
  maxWidth?: string
  height?: string
  minHeight?: string
  // Block alignment within its parent (images, buttons, fixed-width blocks)
  align?: 'left' | 'center' | 'right' | 'full'
  // Container layout
  gap?: string
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch'
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between'
  // Decoration
  background?: BackgroundValue
  borderWidth?: string
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted'
  borderColor?: string
  borderRadius?: string
  boxShadow?: string
  opacity?: string
  // Image
  objectFit?: 'cover' | 'contain' | 'fill' | 'none'
  objectPosition?: string
  aspectRatio?: string
  // Advanced positioning
  position?: 'static' | 'relative' | 'absolute'
  top?: string
  right?: string
  bottom?: string
  left?: string
  zIndex?: string
  // Visibility per device
  display?: 'none'
}

export type StyleSet = Partial<Record<Device, Style>>

export type AnimationType =
  | 'none' | 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right'
  | 'zoom' | 'zoom-in' | 'zoom-out' | 'flip' | 'blur' | 'bounce' | 'rotate'

export type HoverEffect = 'none' | 'lift' | 'grow' | 'shrink' | 'glow' | 'tilt' | 'brighten'

export type Animation = {
  type?: AnimationType
  duration?: number
  delay?: number
  easing?: 'ease' | 'ease-out' | 'ease-in-out' | 'spring' | 'linear'
  // Play again every time the block scrolls back into view.
  repeat?: boolean
  hover?: HoverEffect
}

export type Advanced = {
  htmlId?: string
  className?: string
  // Declarations only (e.g. "letter-spacing: 2px;"), scoped to this element.
  css?: string
}

export type BuilderNode = {
  id: string
  type: string
  props: Record<string, any>
  style?: StyleSet
  children?: BuilderNode[]
  hidden?: boolean
  advanced?: Advanced
  animation?: Animation
}

export type PageDoc = {
  version: 1
  sections: BuilderNode[]
}

export const EMPTY_DOC: PageDoc = { version: 1, sections: [] }

export type PageStatus = 'draft' | 'published' | 'unpublished' | 'scheduled' | 'private'

export type PageSeo = {
  title?: string
  description?: string
  canonical?: string
  ogImage?: string
  socialTitle?: string
  socialDescription?: string
  noIndex?: boolean
  noFollow?: boolean
}

export type CmsPage = {
  id: string
  title: string
  slug: string
  status: PageStatus
  parent_id: string | null
  template: string | null
  legacy_key: string | null
  content: PageDoc
  published_content: PageDoc | null
  seo: PageSeo
  featured_image: string | null
  scheduled_at: string | null
  published_at: string | null
  published_by: string | null
  version: number
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

export type CmsPageSummary = Omit<CmsPage, 'content' | 'published_content'>

export type PageRevision = {
  id: string
  page_id: string
  title: string
  content: PageDoc
  seo: PageSeo
  reason: 'save' | 'autosave' | 'publish' | 'restore' | 'import'
  created_at: string
  created_by_email: string | null
}

export type ReusableBlock = {
  id: string
  name: string
  block: BuilderNode
  is_global: boolean
  updated_at: string
  version?: number
}

export type PageTemplateRow = {
  id: string
  name: string
  description: string | null
  content: PageDoc
  updated_at: string
}

export type MediaItem = {
  id: string
  url: string
  key: string
  filename: string
  title: string | null
  alt: string | null
  caption: string | null
  description: string | null
  mime_type: string
  size_bytes: number
  width: number | null
  height: number | null
  checksum: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Global settings
// ---------------------------------------------------------------------------

export type NavItem = {
  id: string
  label: string
  kind: 'page' | 'url'
  pageId?: string
  url?: string
  newTab?: boolean
  hidden?: boolean
  children?: NavItem[]
}

export type NavigationSettings = { items: NavItem[] }

export type SocialLink = { id: string; platform: string; url: string }

export type HeaderSettings = {
  layout: 'inline' | 'stacked' | 'centered'
  showLogo: boolean
  logoUrl?: string
  showSiteName: boolean
  siteName: string
  tagline: string
  showNumbers: boolean
  showCta: boolean
  ctaLabel: string
  ctaUrl: string
  showSocial: boolean
  showContact: boolean
  sticky: boolean
}

export type FooterColumn = {
  id: string
  kind: 'brand' | 'links' | 'text' | 'contact' | 'social' | 'newsletter'
  title?: string
  text?: string
  links?: { id: string; label: string; url: string }[]
  useNavigation?: boolean
}

export type FooterSettings = {
  columns: FooterColumn[]
  copyright: string
  tagline: string
  background?: string
  textColor?: string
}

export type SiteSettings = {
  siteName: string
  shortName: string
  logoUrl?: string
  faviconUrl?: string
  defaultSeoTitle: string
  defaultSeoDescription: string
  socialImage?: string
  contactEmail?: string
  phone?: string
  address?: string
  social: SocialLink[]
}

export type ThemeSettings = {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    heading: string
    muted: string
    border: string
    link: string
    // Soft tinted background for bands and headers.
    tint: string
    footer: string
  }
  typography: {
    headingFont: string
    bodyFont: string
    baseSize: number
    headingWeight: string
    bodyWeight: string
    lineHeight: number
    headingScale: 'compact' | 'default' | 'large'
  }
  buttons: {
    radius: string
    paddingX: string
    paddingY: string
    fontWeight: string
    textTransform: 'none' | 'uppercase'
  }
  cards: {
    radius: string
    shadow: 'none' | 'sm' | 'md' | 'lg'
    border: boolean
  }
  layout: {
    containerWidth: number
    sectionSpacing: 'compact' | 'default' | 'spacious'
    radius: string
  }
  forms: {
    radius: string
    borderColor?: string
  }
}
