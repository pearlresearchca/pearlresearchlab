'use client'

import { useActionState } from 'react'
import { inviteUserAction } from './actions'
import { Field, TextInput } from '@/components/admin/ui'
import { AccessEditor } from '@/components/admin/access-editor'
import { SubmitButton } from '@/components/admin/submit-button'

type State = { error: string } | { ok: true; tempPassword: string } | undefined

export function InviteUserForm() {
  const [state, formAction] = useActionState<State, FormData>(async (_prev, formData) => inviteUserAction(formData), undefined)

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="invite-name">
            <TextInput id="invite-name" name="full_name" required autoComplete="off" placeholder="e.g. Priya Sharma" />
          </Field>
          <Field label="Email" htmlFor="invite-email" hint="They sign in with this address.">
            <TextInput id="invite-email" name="email" type="email" required autoComplete="off" placeholder="name@example.com" />
          </Field>
        </div>
        <AccessEditor idPrefix="invite" />
        <div className="flex justify-end border-t border-border pt-4">
          <SubmitButton pendingText="Creating…">Add person</SubmitButton>
        </div>
      </form>

      {state && 'error' in state && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state && 'ok' in state && (
        <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          <p className="font-medium">Account created.</p>
          <p className="mt-1">
            Share this temporary password with them: <span className="font-mono font-semibold">{state.tempPassword}</span>
          </p>
          <p className="mt-1 text-green-700">
            They should check their email for a verification code, enter it at <span className="font-mono">/admin/verify</span>, then sign in with this password (and can change it later).
          </p>
        </div>
      )}
    </div>
  )
}
