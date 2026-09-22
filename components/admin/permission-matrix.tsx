import { Check, FlaskConical, FolderKanban, Handshake, Home, Info, Mail, Settings2, Users2, X, type LucideIcon } from 'lucide-react'
import { SECTIONS } from '@/lib/cms/permissions'

const SECTION_ICONS: Record<string, LucideIcon> = {
  home: Home,
  about: Info,
  research: FlaskConical,
  projects: FolderKanban,
  team: Users2,
  partners: Handshake,
  contact: Mail,
  global: Settings2,
}

export function PermissionMatrix({ role, sections }: { role: 'admin' | 'editor'; sections: string[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-border bg-muted/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Section</span>
        <span>Access</span>
      </div>
      <div className="divide-y divide-border">
        {SECTIONS.map((s) => {
          const Icon = SECTION_ICONS[s.key] ?? Home
          const granted = role === 'admin' || sections.includes(s.key)
          return (
            <div key={s.key} className="grid grid-cols-[1fr_auto] items-center gap-2 px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="size-4" aria-hidden="true" />
                </div>
                <span className="text-sm text-foreground">{s.label}</span>
              </div>
              {granted ? (
                <span className="flex size-6 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
              ) : (
                <span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground/60">
                  <X className="size-3.5" aria-hidden="true" />
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
