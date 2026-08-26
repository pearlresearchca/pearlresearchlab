'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/home', label: 'Home page' },
  { href: '/admin/about', label: 'About page' },
  { href: '/admin/research', label: 'Research areas' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/team', label: 'Team' },
  { href: '/admin/partners', label: 'Partner logos' },
  { href: '/admin/contact', label: 'Contact page' },
  { href: '/admin/activity', label: 'Activity log' },
]

export function AdminSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const items = isAdmin ? [...links, { href: '/admin/users', label: 'Users & access' }] : links

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              active ? 'bg-primary text-white' : 'text-foreground hover:bg-muted'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
