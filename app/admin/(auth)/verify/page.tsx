import { verifyEmailAction, resendVerificationAction } from '../../auth-actions'
import { AuthForm } from '@/components/admin/auth-form'
import { Field, TextInput } from '@/components/admin/ui'
import { SubmitButton } from '@/components/admin/submit-button'

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email = '' } = await searchParams

  async function resendCode(formData: FormData) {
    'use server'
    await resendVerificationAction(formData)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">PEARL Admin</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">Verify your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the 6-digit code we emailed you to finish signing in.
        </p>

        <div className="mt-6">
          <AuthForm action={verifyEmailAction} submitLabel="Verify & sign in" pendingLabel="Verifying…">
            <Field label="Email" htmlFor="email">
              <TextInput id="email" name="email" type="email" defaultValue={email} autoComplete="email" required />
            </Field>
            <Field label="Verification code" htmlFor="otp">
              <TextInput id="otp" name="otp" inputMode="numeric" autoComplete="one-time-code" required />
            </Field>
          </AuthForm>
        </div>

        <form action={resendCode} className="mt-4">
          <input type="hidden" name="email" value={email} />
          <SubmitButton variant="ghost" pendingText="Sending…">
            Resend code
          </SubmitButton>
        </form>
      </div>
    </div>
  )
}
