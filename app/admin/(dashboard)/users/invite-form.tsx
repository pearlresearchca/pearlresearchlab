'use client'

import { useActionState, useState } from 'react'
import { inviteUserAction } from './actions'
import { Field, Select, TextInput, SectionCheckboxes } from '@/components/admin/ui'
import { SubmitButton } from '@/components/admin/submit-button'

type State = { error: string } | { ok: true; tempPassword: string } | undefined

export function InviteUserForm() {
  const [state, formAction] = useActionState<State, FormData>(async (_prev, formData) => inviteUserAction(formData), undefined)
  const [role, setRole] = useState<'editor' | 'admin'>('editor')

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Full name" htmlFor="invite-name">
            <TextInput id="invite-name" name="full_name" required className="w-48" />
          </Field>
          <Field label="Email" htmlFor="invite-email">
            <TextInput id="invite-email" name="email" type="email" required className="w-64" />
          </Field>
          <Field label="Role" htmlFor="invite-role">
            <Select id="invite-role" name="role" value={role} onChange={(e) => setRole(e.target.value as 'editor' | 'admin')} className="w-32">
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
          <SubmitButton pendingText="Creating…">Add user</SubmitButton>
        </div>

        {role === 'editor' ? (
          <Field label="What can they edit?" hint="Only checked sections will be editable by this person.">
            <SectionCheckboxes />
          </Field>
        ) : (
          <p className="rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">Admins automatically get full access to every section, plus user management.</p>
        )}
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
