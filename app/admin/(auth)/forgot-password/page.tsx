import Link from 'next/link'
import { sendResetPasswordAction } from '../../auth-actions'
import { AuthForm } from '@/components/admin/auth-form'
import { Field, TextInput } from '@/components/admin/ui'

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">PEARL Admin</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter your email and we&apos;ll send you a reset code.</p>

        <div className="mt-6">
          <AuthForm action={sendResetPasswordAction} submitLabel="Send reset code" pendingLabel="Sending…" successMessage="Check your email for a reset code.">
            <Field label="Email" htmlFor="email">
              <TextInput id="email" name="email" type="email" autoComplete="email" required />
            </Field>
          </AuthForm>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have a code? <Link href="/admin/reset-password" className="font-medium text-primary">Enter it here</Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          <Link href="/admin/login" className="font-medium text-primary">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
