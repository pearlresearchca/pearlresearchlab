export type SectionGroup = 'builder' | 'core' | 'content'

export const SECTION_GROUPS: { key: SectionGroup; label: string; description: string }[] = [
  { key: 'builder', label: 'Website builder', description: 'Pages, design and settings for the whole site' },
  { key: 'core', label: 'Core pages', description: 'The main pages: layout in the builder, text in quick edit' },
  { key: 'content', label: 'Shared content', description: 'Used on several pages' },
]

export const SECTIONS = [
  { key: 'pages', label: 'Pages & page builder', group: 'builder' },
  { key: 'media', label: 'Media library', group: 'builder' },
  { key: 'design', label: 'Theme, menu, header & footer', group: 'builder' },
  { key: 'seo', label: 'SEO (titles, descriptions, URLs)', group: 'builder' },
  { key: 'global', label: 'Site settings & logo', group: 'builder' },
  { key: 'home', label: 'Home page', group: 'core' },
  { key: 'about', label: 'About page', group: 'core' },
  { key: 'research', label: 'Research page & areas', group: 'core' },
  { key: 'projects', label: 'Projects page & projects', group: 'core' },
  { key: 'team', label: 'Team page & members', group: 'core' },
  { key: 'contact', label: 'Contact page & messages', group: 'core' },
  { key: 'partners', label: 'Partner logos', group: 'content' },
] as const satisfies readonly { key: string; label: string; group: SectionGroup }[]

export type SectionKey = (typeof SECTIONS)[number]['key']

export type Access = { role: 'admin' | 'editor'; sections: string[] } | null | undefined

export function canAccess(access: Access, section: SectionKey): boolean {
  if (!access) return false
  if (access.role === 'admin') return true
  return access.sections.includes(section)
}

export function sectionLabel(key: string): string {
  return SECTIONS.find((s) => s.key === key)?.label ?? key
}
