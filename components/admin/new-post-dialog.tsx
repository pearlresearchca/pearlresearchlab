'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'
import { createPostAction } from '@/app/admin/(dashboard)/blog/actions'

// Creates a draft straight away and opens it; the look is chosen (and can be
// changed any time) right on the post page.
export function NewPostButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      data-tour="new-post"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await createPostAction('classic')
          if ('error' in r) return void toast.error(r.error)
          router.push(`/admin/blog/${r.id}?new=1`)
        })
      }
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark active:scale-[.97] disabled:cursor-wait disabled:opacity-80"
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />} New post
    </button>
  )
}
