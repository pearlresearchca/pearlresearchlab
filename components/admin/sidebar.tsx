'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Blocks,
  FileStack,
  FlaskConical,
  FolderKanban,
  Handshake,
  Home,
  Images,
  Inbox,
  Info,
  LayoutDashboard,
  Mail,
  Menu,
  Palette,
  PanelsTopLeft,
  ScrollText,
  Settings,
  UserCog,
  Users2,
  type LucideIcon,
} from 'lucide-react'
import { canAccess, type SectionKey } from '@/lib/cms/permissions'

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; sections?: SectionKey[]; adminOnly?: boolean }
type Group = { label?: string; items: NavItem[] }

const groups: Group[] = [
  { items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true }] },
  {
    label: 'Website',
    items: [
      { href: '/admin/pages', label: 'Pages', icon: FileStack, sections: ['pages', 'seo', 'home', 'about', 'research', 'projects', 'team', 'contact'] },
      { href: '/admin/navigation', label: 'Navigation', icon: Menu, sections: ['design'] },
      { href: '/admin/media', label: 'Media library', icon: Images, sections: ['media', 'pages'] },
      { href: '/admin/theme', label: 'Theme', icon: Palette, sections: ['design'] },
      { href: '/admin/header-footer', label: 'Header & footer', icon: PanelsTopLeft, sections: ['design'] },
      { href: '/admin/site-settings', label: 'Site settings & SEO', icon: Settings, sections: ['global', 'seo'] },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/research', label: 'Research areas', icon: FlaskConical, sections: ['research'] },
      { href: '/admin/projects', label: 'Projects', icon: FolderKanban, sections: ['projects'] },
      { href: '/admin/team', label: 'Team', icon: Users2, sections: ['team'] },
      { href: '/admin/partners', label: 'Partner logos', icon: Handshake, sections: ['partners'] },
      { href: '/admin/blocks', label: 'Reusable blocks', icon: Blocks, sections: ['pages'] },
      { href: '/admin/submissions', label: 'Form submissions', icon: Inbox, sections: ['pages', 'contact'] },
    ],
  },
  {
    label: 'Classic editors',
    items: [
      { href: '/admin/home', label: 'Home page (classic)', icon: Home, sections: ['home'] },
      { href: '/admin/about', label: 'About page (classic)', icon: Info, sections: ['about'] },
      { href: '/admin/contact', label: 'Contact page (classic)', icon: Mail, sections: ['contact'] },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/admin/users', label: 'Users & access', icon: UserCog, adminOnly: true },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, adminOnly: true },
      { href: '/admin/activity', label: 'Activity log', icon: ScrollText, adminOnly: true },
    ],
  },
]

export function AdminSidebar({ role, sections }: { role: 'admin' | 'editor'; sections: string[] }) {
  const pathname = usePathname()
  const access = { role, sections }
  const visible = (item: NavItem) => (item.adminOnly ? role === 'admin' : !item.sections || item.sections.some((s) => canAccess(access, s)))

  return (
    <nav className="flex flex-col gap-4" aria-label="Admin">
      {groups.map((g, gi) => {
        const items = g.items.filter(visible)
        if (items.length === 0) return null
        return (
          <div key={gi} className="flex flex-col gap-1">
            {g.label && <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</p>}
            {items.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    active ? 'bg-primary text-white shadow-sm' : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        )
      })}
    </nav>
  )
}
