import Link from 'next/link'
import { redirect } from 'next/navigation'
import { hasAnyAdminUser, getCurrentAdmin } from '@/lib/cms/auth'
import { signInAction } from '../../auth-actions'
import { AuthForm } from '@/components/admin/auth-form'
import { Field, TextInput } from '@/components/admin/ui'

export default async function LoginPage() {
  const [admin, setupDone] = await Promise.all([getCurrentAdmin(), hasAnyAdminUser()])
  if (admin) redirect('/admin')
  if (!setupDone) redirect('/admin/setup')

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">PEARL Admin</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage the PEARL website content and media.</p>

        <div className="mt-6">
          <AuthForm action={signInAction} submitLabel="Sign in" pendingLabel="Signing in…">
            <Field label="Email" htmlFor="email">
              <TextInput id="email" name="email" type="email" autoComplete="email" required />
            </Field>
            <Field label="Password" htmlFor="password">
              <TextInput id="password" name="password" type="password" autoComplete="current-password" required />
            </Field>
          </AuthForm>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Have a verification code? <Link href="/admin/verify" className="font-medium text-primary">Verify email</Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Forgot your password? <Link href="/admin/forgot-password" className="font-medium text-primary">Reset it</Link>
        </p>
      </div>
    </div>
  )
}
