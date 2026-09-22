'use client'

import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import type { ActionResult } from '@/lib/cms/action-result'

export function ActionForm({
  action,
  successMessage = 'Saved',
  className,
  children,
}: {
  action: (formData: FormData) => Promise<ActionResult>
  successMessage?: string
  className?: string
  children: React.ReactNode
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => action(formData),
    null
  )
  const seen = useRef<ActionResult | null>(null)

  useEffect(() => {
    if (!state || state === seen.current) return
    seen.current = state
    if ('error' in state) toast.error(state.error)
    else toast.success(successMessage)
  }, [state, successMessage])

  return (
    <form action={formAction} className={className}>
      {children}
    </form>
  )
}
