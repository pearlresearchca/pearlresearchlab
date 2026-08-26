'use client'

import { useActionState } from 'react'
import { SubmitButton } from './submit-button'
import type { ActionResult } from '@/app/admin/auth-actions'

type Action = (formData: FormData) => Promise<ActionResult>

export function AuthForm({
  action,
  submitLabel,
  pendingLabel,
  successMessage,
  children,
}: {
  action: Action
  submitLabel: string
  pendingLabel?: string
  successMessage?: string
  children: React.ReactNode
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>((_prevState, formData) => action(formData), null)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {children}
      {state && 'error' in state && state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state && 'ok' in state && state.ok && successMessage && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</p>
      )}
      <SubmitButton pendingText={pendingLabel ?? 'Working…'}>{submitLabel}</SubmitButton>
    </form>
  )
}
