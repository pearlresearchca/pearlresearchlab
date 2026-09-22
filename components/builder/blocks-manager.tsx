'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Globe, Pencil, Trash2 } from 'lucide-react'
import { deleteReusableBlockAction, deleteTemplateAction, updateReusableBlockAction } from '@/lib/builder/actions'
import { BLOCKS } from '@/lib/builder/blocks'
import { relativeTime } from '@/lib/cms/format'
import type { PageTemplateRow, ReusableBlock } from '@/lib/builder/types'
import { Btn, ConfirmProvider, IconBtn, Toggle, inputClass, useConfirm } from './ui'

export function BlocksManager(props: { blocks: ReusableBlock[]; templates: PageTemplateRow[] }) {
  return (
    <ConfirmProvider>
      <Inner {...props} />
    </ConfirmProvider>
  )
}

function Inner({ blocks, templates }: { blocks: ReusableBlock[]; templates: PageTemplateRow[] }) {
  const router = useRouter()
  const confirm = useConfirm()
  const [names, setNames] = useState<Record<string, string>>({})

  async function run(p: Promise<{ ok: true } | { error: string }>, msg: string) {
    const r = await p
    if ('error' in r) return toast.error(r.error)
    toast.success(msg)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold">Reusable blocks</h2>
        <p className="mb-4 text-sm text-muted-foreground">Save any section or block from the page builder (select it, then the bookmark icon). Insert them from Add → Saved.</p>
        {blocks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">No saved blocks yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {blocks.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 py-3">
                <input
                  className={`${inputClass} max-w-xs`}
                  aria-label="Block name"
                  value={names[b.id] ?? b.name}
                  onChange={(e) => setNames({ ...names, [b.id]: e.target.value })}
                  onBlur={() => names[b.id] !== undefined && names[b.id] !== b.name && run(updateReusableBlockAction(b.id, { name: names[b.id] }), 'Renamed')}
                />
                <span className="text-xs text-muted-foreground">{BLOCKS[b.block.type]?.label ?? b.block.type} · updated {relativeTime(b.updated_at)}</span>
                {b.is_global && <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800"><Globe className="size-3" /> Global</span>}
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-28">
                    <Toggle checked={b.is_global} onChange={(v) => run(updateReusableBlockAction(b.id, { isGlobal: v }), v ? 'Now a global block' : 'No longer global')} label="Global" />
                  </div>
                  <Link href={`/admin/builder/block/${b.id}`} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted"><Pencil className="size-3.5" /> Edit</Link>
                  <IconBtn
                    label={`Delete ${b.name}`}
                    className="hover:text-red-600"
                    onClick={async () => {
                      if (await confirm({ title: `Delete “${b.name}”?`, body: b.is_global ? 'Pages using this global block will show nothing in its place.' : 'Copies already placed on pages stay.', confirmLabel: 'Delete', danger: true }))
                        run(deleteReusableBlockAction(b.id), 'Block deleted')
                    }}
                  >
                    <Trash2 />
                  </IconBtn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold">My page templates</h2>
        <p className="mb-4 text-sm text-muted-foreground">Create one in the page builder: ⋯ menu → Save page as template. They appear under “My templates” when creating a page.</p>
        {templates.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">No saved templates yet. The 18 built-in templates are always available.</p>
        ) : (
          <ul className="divide-y divide-border">
            {templates.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.description || 'No description'} · {t.content.sections.length} sections · updated {relativeTime(t.updated_at)}</p>
                </div>
                <Btn
                  size="sm"
                  variant="ghost"
                  className="ml-auto text-red-600"
                  onClick={async () => {
                    if (await confirm({ title: `Delete template “${t.name}”?`, body: 'Pages created from it are not affected.', confirmLabel: 'Delete', danger: true })) run(deleteTemplateAction(t.id), 'Template deleted')
                  }}
                >
                  <Trash2 className="size-3.5" /> Delete
                </Btn>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
