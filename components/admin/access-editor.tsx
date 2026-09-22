'use client'

import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { SectionCheckboxes } from '@/components/admin/ui'

type Role = 'admin' | 'editor'

// Role picker plus section switches. Switches only make sense for editors —
// admins always have full access — so they're hidden while Admin is chosen.
export function AccessEditor({ defaultRole = 'editor', defaultSections = [], idPrefix }: { defaultRole?: Role; defaultSections?: string[]; idPrefix: string }) {
  const [role, setRole] = useState<Role>(defaultRole)
  const options: { value: Role; label: string; hint: string }[] = [
    { value: 'editor', label: 'Editor', hint: 'Edits only the areas you switch on' },
    { value: 'admin', label: 'Admin', hint: 'Full access, including users' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold text-foreground">Role</legend>
        <input type="hidden" name="role" value={role} />
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={role === o.value}
              id={`${idPrefix}-role-${o.value}`}
              onClick={() => setRole(o.value)}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${role === o.value ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-border hover:border-slate-300'}`}
            >
              <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${role === o.value ? 'border-primary' : 'border-slate-300'}`}>
                {role === o.value && <span className="size-2 rounded-full bg-primary" />}
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">{o.label}</span>
                <span className="block text-xs text-muted-foreground">{o.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {role === 'editor' ? (
        <div>
          <p className="mb-2 text-[13px] font-semibold text-foreground">What can they edit?</p>
          <SectionCheckboxes defaultValue={defaultSections} />
        </div>
      ) : (
        <p className="flex items-center gap-2 rounded-xl bg-primary/5 px-3.5 py-3 text-sm text-primary">
          <ShieldCheck className="size-4 shrink-0" aria-hidden="true" /> Admins can edit everything and manage users, so no switches are needed.
        </p>
      )}
    </div>
  )
}
