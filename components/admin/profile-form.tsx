'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Lock } from 'lucide-react'
import { Field, TextArea, TextInput } from '@/components/admin/ui'
import { Initials } from '@/components/admin/sidebar'
import { updateProfileAction } from '@/app/admin/(dashboard)/profile/actions'
import type { AppUser } from '@/lib/cms/types'

export function ProfileForm({ profile, onboarding = false }: { profile: AppUser; onboarding?: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [name, setName] = useState(profile.full_name ?? '')
  const roleLabel = profile.role === 'admin' ? 'Administrator' : 'Editor'

  function submit(formData: FormData) {
    start(async () => {
      const res = await updateProfileAction(formData)
      if ('error' in res) {
        toast.error(res.error)
        return
      }
      toast.success(onboarding ? 'Welcome aboard! Your profile is set up.' : 'Profile saved')
      router.refresh()
    })
  }

  return (
    <form action={submit} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,.04),0_4px_16px_-8px_rgba(15,23,42,.08)]">
      <div className="flex flex-wrap items-center gap-4 border-b border-border px-6 py-5">
        <Initials name={name || profile.email} className="size-14 text-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground">{name || 'Your name'}</p>
          <p className="break-all text-sm text-muted-foreground">{profile.email}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{roleLabel}</span>
      </div>

      <div className="grid gap-5 p-6 md:grid-cols-2">
        <Field label="Full name *" htmlFor="full_name" hint="Shown in the admin and next to every change you make in the activity log.">
          <TextInput id="full_name" name="full_name" required minLength={2} maxLength={120} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" />
        </Field>
        <Field label="Job title" htmlFor="job_title" hint="Optional, e.g. Research coordinator.">
          <TextInput id="job_title" name="job_title" maxLength={120} autoComplete="organization-title" defaultValue={profile.job_title ?? ''} />
        </Field>
        <Field label="Contact number" htmlFor="phone" hint="Only visible to other admin users.">
          <TextInput id="phone" name="phone" type="tel" maxLength={40} autoComplete="tel" defaultValue={profile.phone ?? ''} placeholder="+1 555 123 4567" />
        </Field>
        <Field label="Email" htmlFor="email" hint="Your sign-in email. Ask an administrator to change it.">
          <div className="relative">
            <TextInput id="email" value={profile.email} readOnly disabled className="cursor-not-allowed bg-muted pr-9 text-muted-foreground" />
            <Lock className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          </div>
        </Field>
        <Field label="About you" htmlFor="bio" hint="Optional. A line or two for your colleagues." className="md:col-span-2">
          <TextArea id="bio" name="bio" rows={3} maxLength={1000} defaultValue={profile.bio ?? ''} />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border bg-background/60 px-6 py-4">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary-dark disabled:opacity-60">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {onboarding ? 'Save and continue' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
