export const SECTIONS = [
  { key: 'home', label: 'Home page' },
  { key: 'about', label: 'About page' },
  { key: 'research', label: 'Research areas' },
  { key: 'projects', label: 'Projects' },
  { key: 'team', label: 'Team' },
  { key: 'partners', label: 'Partner logos' },
  { key: 'contact', label: 'Contact page' },
  { key: 'global', label: 'Site settings (logo & footer)' },
] as const

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
