import { resetPasswordAction } from '../../auth-actions'
import { AuthForm } from '@/components/admin/auth-form'
import { Field, TextInput } from '@/components/admin/ui'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email = '' } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">PEARL Admin</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">Enter your reset code</h1>
        <p className="mt-2 text-sm text-muted-foreground">Check your email for the code, then choose a new password.</p>

        <div className="mt-6">
          <AuthForm action={resetPasswordAction} submitLabel="Reset password" pendingLabel="Resetting…">
            <Field label="Email" htmlFor="email">
              <TextInput id="email" name="email" type="email" defaultValue={email} autoComplete="email" required />
            </Field>
            <Field label="Reset code" htmlFor="otp">
              <TextInput id="otp" name="otp" inputMode="numeric" autoComplete="one-time-code" required />
            </Field>
            <Field label="New password" htmlFor="password" hint="At least 6 characters.">
              <TextInput id="password" name="password" type="password" autoComplete="new-password" required minLength={6} />
            </Field>
          </AuthForm>
        </div>
      </div>
    </div>
  )
}
