'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, RotateCcw } from 'lucide-react'
import { createJobAction, setJobStatusAction } from '@/app/admin/(dashboard)/jobs/actions'

// Creates a draft position straight away and opens its form.
export function NewPositionButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      data-tour="new-position"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await createJobAction()
          if ('error' in r) return void toast.error(r.error)
          router.push(`/admin/jobs/${r.id}`)
        })
      }
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark active:scale-[.97] disabled:cursor-wait disabled:opacity-80"
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />} New position
    </button>
  )
}

// Puts a closed position back on the Careers page.
export function ReopenPositionButton({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await setJobStatusAction(id, 'open')
          if ('error' in r) return void toast.error(r.error)
          toast.success(`“${title}” is open again — it’s back on the Careers page`)
          router.refresh()
        })
      }
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:text-primary active:scale-[.97] disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <RotateCcw className="size-3.5" aria-hidden="true" />} Reopen
    </button>
  )
}
