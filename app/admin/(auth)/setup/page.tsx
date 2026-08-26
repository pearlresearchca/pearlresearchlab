import { redirect } from 'next/navigation'
import Link from 'next/link'
import { hasAnyAdminUser } from '@/lib/cms/auth'
import { setupFirstAdminAction } from '../../auth-actions'
import { AuthForm } from '@/components/admin/auth-form'
import { Field, TextInput } from '@/components/admin/ui'

export default async function SetupPage() {
  if (await hasAnyAdminUser()) {
    redirect('/admin/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">PEARL Admin</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">Create the first admin account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This one-time setup step only appears because no admin account exists yet. You&apos;ll be the site owner and can invite others afterward.
        </p>

        <div className="mt-6">
          <AuthForm action={setupFirstAdminAction} submitLabel="Create admin account" pendingLabel="Creating…">
            <Field label="Full name" htmlFor="full_name">
              <TextInput id="full_name" name="full_name" autoComplete="name" required />
            </Field>
            <Field label="Email" htmlFor="email">
              <TextInput id="email" name="email" type="email" autoComplete="email" required />
            </Field>
            <Field label="Password" htmlFor="password" hint="At least 6 characters.">
              <TextInput id="password" name="password" type="password" autoComplete="new-password" required minLength={6} />
            </Field>
          </AuthForm>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have a verification code? <Link href="/admin/verify" className="font-medium text-primary">Enter it here</Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Already set up? <Link href="/admin/login" className="font-medium text-primary">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
