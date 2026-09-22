'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FlaskConical,
  FolderKanban,
  Handshake,
  Home,
  Info,
  LayoutDashboard,
  Mail,
  ScrollText,
  UserCog,
  Users2,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'
import { canAccess, type SectionKey } from '@/lib/cms/permissions'

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; section?: SectionKey }

const links: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/home', label: 'Home page', icon: Home, section: 'home' },
  { href: '/admin/about', label: 'About page', icon: Info, section: 'about' },
  { href: '/admin/research', label: 'Research areas', icon: FlaskConical, section: 'research' },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban, section: 'projects' },
  { href: '/admin/team', label: 'Team', icon: Users2, section: 'team' },
  { href: '/admin/partners', label: 'Partner logos', icon: Handshake, section: 'partners' },
  { href: '/admin/contact', label: 'Contact page', icon: Mail, section: 'contact' },
]

export function AdminSidebar({ role, sections }: { role: 'admin' | 'editor'; sections: string[] }) {
  const pathname = usePathname()
  const access = { role, sections }

  const items: NavItem[] = [
    ...links.filter((item) => !item.section || canAccess(access, item.section)),
    ...(role === 'admin' ? [{ href: '/admin/analytics', label: 'Analytics', icon: BarChart3 } as NavItem] : []),
    ...(role === 'admin' ? [{ href: '/admin/activity', label: 'Activity log', icon: ScrollText } as NavItem] : []),
    ...(role === 'admin' ? [{ href: '/admin/users', label: 'Users & access', icon: UserCog } as NavItem] : []),
  ]

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? 'bg-primary text-white shadow-sm' : 'text-foreground hover:bg-muted'
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
