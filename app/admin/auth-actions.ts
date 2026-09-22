'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@insforge/sdk'
import { createAuthActions } from '@insforge/sdk/ssr'
import { applyPendingAccess } from '@/lib/cms/auth'

export type ActionResult = { error: string } | { ok: true } | null

function plainClient() {
  return createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
  })
}

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Enter your email and password.' }

  const auth = createAuthActions({ cookies: await cookies() })
  const { data, error } = await auth.signInWithPassword({ email, password })

  if (error || !data?.user) {
    if (error?.statusCode === 403) {
      redirect(`/admin/verify?email=${encodeURIComponent(email)}`)
    }
    return { error: error?.message ?? 'Sign in failed.' }
  }

  await applyPendingAccess(data.user.id, data.user.email, null)
  redirect('/admin')
}

export async function signOutAction() {
  const auth = createAuthActions({ cookies: await cookies() })
  await auth.signOut()
  redirect('/admin/login')
}

export async function setupFirstAdminAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const fullName = String(formData.get('full_name') ?? '').trim()

  if (!email || !password) return { error: 'Email and password are required.' }
  if (password.length < 6) return { error: 'Password must be at least 6 characters.' }

  const auth = createAuthActions({ cookies: await cookies() })
  const { data, error } = await auth.signUp({
    email,
    password,
    name: fullName || undefined,
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/login`,
  })

  if (error) {
    if (error.statusCode === 409 || /already/i.test(error.message ?? '')) {
      return {
        error:
          'That email is already registered. If you already received a verification code for it, go to the "Have a verification code?" link below to finish signing in.',
      }
    }
    return { error: error.message ?? 'Could not create the account.' }
  }

  // signUp() intentionally omits `user` while email verification is
  // pending (privacy — no account details before the address is proven).
  // There's nothing more to link yet: applyPendingAccess() runs from
  // verifyEmailAction/signInAction once we actually have a user id, and its
  // "nobody is admin yet" fallback covers bootstrapping this account.
  if (!data?.requireEmailVerification) redirect('/admin')
  redirect(`/admin/verify?email=${encodeURIComponent(email)}`)
}

export async function verifyEmailAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim()
  const otp = String(formData.get('otp') ?? '').trim()
  if (!email || !otp) return { error: 'Enter the code from your email.' }

  const auth = createAuthActions({ cookies: await cookies() })
  const { data, error } = await auth.verifyEmail({ email, otp })
  if (error || !data?.user) {
    return { error: error?.message ?? 'Invalid or expired code.' }
  }

  await applyPendingAccess(data.user.id, email, null)
  redirect('/admin')
}

export async function resendVerificationAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) return { error: 'Missing email.' }

  const { error } = await plainClient().auth.resendVerificationEmail({
    email,
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/login`,
  })
  if (error) return { error: error.message ?? 'Could not resend the code.' }
  return { ok: true }
}

export async function sendResetPasswordAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) return { error: 'Enter your email.' }

  const { error } = await plainClient().auth.sendResetPasswordEmail({
    email,
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/reset-password`,
  })
  if (error) return { error: error.message ?? 'Could not send the reset code.' }
  return { ok: true }
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim()
  const code = String(formData.get('otp') ?? '').trim()
  const newPassword = String(formData.get('password') ?? '')
  if (!email || !code) return { error: 'Enter your email and the code from your reset email.' }
  if (newPassword.length < 6) return { error: 'Password must be at least 6 characters.' }

  const client = plainClient()
  const { data, error } = await client.auth.exchangeResetPasswordToken({ email, code })
  if (error || !data?.token) {
    return { error: error?.message ?? 'Invalid or expired code.' }
  }

  const { error: resetError } = await client.auth.resetPassword({ newPassword, otp: data.token })
  if (resetError) {
    return { error: resetError.message ?? 'Could not reset the password.' }
  }

  redirect('/admin/login')
}
