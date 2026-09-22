'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Initials } from '@/components/admin/sidebar'
import { RoleBadge } from '@/components/admin/ui'

type Member = { id: string; email: string; full_name: string | null; role: 'admin' | 'editor'; job_title?: string | null }

// Searchable, scrollable list of people, so the page stays tidy with a
// large team.
export function TeamList({ users, selectedId, selfId }: { users: Member[]; selectedId?: string; selfId: string }) {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<'all' | 'admin' | 'editor'>('all')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users
      .filter((u) => (role === 'all' || u.role === role) && (!q || `${u.full_name ?? ''} ${u.email} ${u.job_title ?? ''}`.toLowerCase().includes(q)))
      .sort((a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email))
  }, [users, query, role])

  const counts = { all: users.length, admin: users.filter((u) => u.role === 'admin').length, editor: users.filter((u) => u.role === 'editor').length }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex flex-col gap-3 border-b border-border p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people…"
            aria-label="Search people"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
        </div>
        <div className="flex rounded-lg bg-muted p-1 text-xs font-semibold" role="tablist" aria-label="Filter by role">
          {(['all', 'admin', 'editor'] as const).map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={role === r}
              onClick={() => setRole(r)}
              className={`flex-1 rounded-md px-2 py-1.5 capitalize transition ${role === r ? 'bg-surface text-primary shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-foreground'}`}
            >
              {r === 'all' ? 'All' : `${r}s`} <span className="font-medium opacity-70">{counts[r]}</span>
            </button>
          ))}
        </div>
      </div>

      <ul className="min-h-0 flex-1 max-h-[360px] overflow-y-auto p-2 lg:max-h-[calc(100vh-300px)]">
        {list.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted-foreground">No one matches “{query}”.</li>}
        {list.map((u) => {
          const active = u.id === selectedId
          return (
            <li key={u.id}>
              <Link
                href={`/admin/users?user=${u.id}`}
                scroll={false}
                aria-current={active ? 'true' : undefined}
                className={`flex items-center gap-3 rounded-lg px-2.5 py-2 transition ${active ? 'bg-primary/10' : 'hover:bg-muted'}`}
              >
                <Initials name={u.full_name || u.email} className="size-9 text-xs" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <span className="truncate">{u.full_name || u.email}</span>
                    {u.id === selfId && <span className="shrink-0 text-[11px] font-normal text-muted-foreground">(you)</span>}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{u.job_title || u.email}</span>
                </span>
                <RoleBadge role={u.role} />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
