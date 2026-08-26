'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@insforge/sdk'
import { createAuthActions } from '@insforge/sdk/ssr'
import { createInsForgeAdminClient } from '@/lib/insforge/server'
import { hasAnyAdminUser } from '@/lib/cms/auth'

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

  redirect('/admin')
}

export async function signOutAction() {
  const auth = createAuthActions({ cookies: await cookies() })
  await auth.signOut()
  redirect('/admin/login')
}

export async function setupFirstAdminAction(formData: FormData): Promise<ActionResult> {
  if (await hasAnyAdminUser()) {
    return { error: 'Setup has already been completed. Please sign in instead.' }
  }

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

  if (error || !data?.user) {
    return { error: error?.message ?? 'Could not create the account.' }
  }

  if (await hasAnyAdminUser()) {
    return { error: 'Setup has already been completed by someone else. Please sign in.' }
  }

  const admin = createInsForgeAdminClient()
  const { error: insertError } = await admin.database.from('app_users').insert([
    { id: data.user.id, email, full_name: fullName || null, role: 'admin' },
  ])
  if (insertError) {
    return { error: 'Account created, but could not grant admin access. Contact support.' }
  }

  if (!data.requireEmailVerification) redirect('/admin')
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
