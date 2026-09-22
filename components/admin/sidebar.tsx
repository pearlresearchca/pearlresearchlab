'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  Blocks,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  FileStack,
  FlaskConical,
  FolderKanban,
  Handshake,
  Home,
  Images,
  Inbox,
  Info,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu as MenuIcon,
  Palette,
  PanelsTopLeft,
  ScrollText,
  Search,
  Settings,
  UserCog,
  Users2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { canAccess, type SectionKey } from '@/lib/cms/permissions'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from '@/components/builder/menu'

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; sections?: SectionKey[]; adminOnly?: boolean }
type Group = { label?: string; items: NavItem[] }

const groups: Group[] = [
  { items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true }] },
  {
    label: 'Website',
    items: [
      { href: '/admin/pages', label: 'Pages', icon: FileStack, sections: ['pages', 'seo', 'home', 'about', 'research', 'projects', 'team', 'contact'] },
      { href: '/admin/navigation', label: 'Navigation', icon: MenuIcon, sections: ['design'] },
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

type Access = { role: 'admin' | 'editor'; sections: string[] }

function visibleGroups(access: Access) {
  const visible = (item: NavItem) => (item.adminOnly ? access.role === 'admin' : !item.sections || item.sections.some((s) => canAccess(access, s)))
  return groups.map((g) => ({ ...g, items: g.items.filter(visible) })).filter((g) => g.items.length > 0)
}

const COLLAPSE_KEY = 'admin-sidebar-collapsed'

function Initials({ name, className = '' }: { name: string; className?: string }) {
  const parts = name.trim().split(/[\s@.]+/).filter(Boolean)
  const text = (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 font-semibold text-white ${className}`} aria-hidden="true">
      {text}
    </span>
  )
}

function SidebarNav({ access, collapsed, onNavigate }: { access: Access; collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-5" aria-label="Admin">
      {visibleGroups(access).map((g, gi) => (
        <div key={gi} className="flex flex-col gap-0.5">
          {g.label && !collapsed && <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[.08em] text-slate-400">{g.label}</p>}
          {g.label && collapsed && <div className="mx-3 mb-1.5 h-px bg-border" aria-hidden="true" />}
          {g.items.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  collapsed ? 'justify-center' : ''
                } ${active ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-muted hover:text-foreground'}`}
              >
                {active && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" aria-hidden="true" />}
                <Icon className={`size-[18px] shrink-0 ${active ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} aria-hidden="true" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

// Quick jump to any admin screen (Ctrl/⌘+K).
function QuickSearch({ access }: { access: Access }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const items = useMemo(() => visibleGroups(access).flatMap((g) => g.items.map((i) => ({ ...i, group: g.label ?? 'General' }))), [access])
  const results = q.trim() ? items.filter((i) => `${i.label} ${i.group}`.toLowerCase().includes(q.trim().toLowerCase())) : items.slice(0, 8)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function go(href: string) {
    setOpen(false)
    setQ('')
    input.current?.blur()
    router.push(href)
  }

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        ref={input}
        role="combobox"
        aria-expanded={open}
        aria-controls="admin-quick-search"
        aria-label="Search the admin"
        placeholder="Search…"
        value={q}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => {
          setQ(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') (e.preventDefault(), setActive((a) => Math.min(a + 1, results.length - 1)))
          if (e.key === 'ArrowUp') (e.preventDefault(), setActive((a) => Math.max(a - 1, 0)))
          if (e.key === 'Enter' && results[active]) go(results[active].href)
          if (e.key === 'Escape') input.current?.blur()
        }}
        className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-14 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/15"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:block">Ctrl K</kbd>
      {open && results.length > 0 && (
        <ul id="admin-quick-search" role="listbox" className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-[0_12px_40px_-8px_rgba(15,23,42,.25)]">
          {results.map((r, i) => {
            const Icon = r.icon
            return (
              <li key={r.href} role="option" aria-selected={i === active}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => go(r.href)} onMouseEnter={() => setActive(i)} className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm ${i === active ? 'bg-muted' : ''}`}>
                  <Icon className="size-4 text-slate-400" aria-hidden="true" />
                  <span className="flex-1 font-medium">{r.label}</span>
                  <span className="text-xs text-slate-400">{r.group}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function AdminShell({
  role,
  sections,
  displayName,
  email,
  signOut,
  children,
}: {
  role: 'admin' | 'editor'
  sections: string[]
  displayName: string
  email: string
  signOut: () => Promise<void>
  children: ReactNode
}) {
  const access = useMemo(() => ({ role, sections }), [role, sections])
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1')
    } catch {}
  }, [])
  useEffect(() => setMobileOpen(false), [pathname])

  function toggle() {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1')
      } catch {}
      return !c
    })
  }

  const roleLabel = role === 'admin' ? 'Administrator' : 'Editor'

  const sidebar = (isMobile: boolean) => {
    const c = collapsed && !isMobile
    return (
      <div className="flex h-full flex-col">
        <div className={`flex h-16 shrink-0 items-center gap-2.5 border-b border-border ${c ? 'justify-center px-2' : 'px-5'}`}>
          <Link href="/admin" className="flex items-center gap-2.5" aria-label="PEARL admin home">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-400 text-sm font-bold text-white shadow-md shadow-primary/30">P</span>
            {!c && (
              <span className="flex flex-col leading-none">
                <span className="text-[15px] font-bold tracking-wide text-foreground">PEARL</span>
                <span className="mt-0.5 text-[11px] font-medium text-slate-400">Website admin</span>
              </span>
            )}
          </Link>
          {isMobile && (
            <button type="button" onClick={() => setMobileOpen(false)} className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-muted" aria-label="Close menu">
              <X className="size-5" />
            </button>
          )}
        </div>
        {!c && (
          <div className="mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-border bg-background p-3">
            <Initials name={displayName} className="size-10 text-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              <p className="truncate text-xs text-slate-500">{roleLabel}</p>
            </div>
          </div>
        )}
        <div className={`admin-scroll min-h-0 flex-1 overflow-y-auto py-4 ${c ? 'px-2' : 'px-3'}`}>
          <SidebarNav access={access} collapsed={c} onNavigate={() => setMobileOpen(false)} />
        </div>
        {!isMobile && (
          <button type="button" onClick={toggle} className="m-3 flex items-center justify-center gap-2 rounded-xl border border-border py-2 text-xs font-medium text-slate-500 transition hover:bg-muted hover:text-foreground" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronsRight className="size-4" /> : <><ChevronsLeft className="size-4" /> Collapse</>}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="admin-ui min-h-screen">
      {/* Desktop sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-surface transition-[width] duration-200 lg:block ${collapsed ? 'w-[76px]' : 'w-64'}`} aria-label="Sidebar">
        {sidebar(false)}
      </aside>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-surface shadow-2xl">{sidebar(true)}</aside>
        </div>
      )}

      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md sm:px-6">
          <button type="button" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-muted lg:hidden" aria-label="Open menu">
            <MenuIcon className="size-5" />
          </button>
          <button type="button" onClick={toggle} className="hidden rounded-lg p-2 text-slate-500 hover:bg-muted lg:inline-flex" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <MenuIcon className="size-5" />
          </button>
          <QuickSearch access={access} />
          <div className="ml-auto flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-primary hover:text-primary sm:inline-flex">
              <ExternalLink className="size-4" aria-hidden="true" /> View site
            </a>
            <Menu
              label="Account"
              width={240}
              trigger={(p) => (
                <button type="button" {...p} className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-muted" aria-label="Account menu">
                  <Initials name={displayName} className="size-9 text-xs" />
                  <span className="hidden text-left leading-tight md:block">
                    <span className="block max-w-[140px] truncate text-sm font-semibold">{displayName}</span>
                    <span className="block text-xs text-slate-500">{roleLabel}</span>
                  </span>
                </button>
              )}
            >
              <MenuLabel>Signed in as</MenuLabel>
              <p className="truncate px-2.5 pb-2 text-sm font-medium">{email}</p>
              <MenuSeparator />
              <MenuItem href="/" external icon={<ExternalLink />}>View live website</MenuItem>
              {role === 'admin' && <MenuItem href="/admin/users" icon={<UserCog />}>Users &amp; access</MenuItem>}
              <MenuSeparator />
              <MenuItem danger icon={<LogOut />} onSelect={() => signOut()}>Sign out</MenuItem>
            </Menu>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
