import { cookies } from 'next/headers'
import { createServerClient } from '@insforge/sdk/ssr'
import { createAdminClient } from '@insforge/sdk'

export async function createInsForgeServerClient() {
  return createServerClient({
    cookies: await cookies(),
    // Fail fast instead of holding a page render for the SDK's 30s default;
    // several reads run per page and hosting functions have a time limit.
    timeout: 10_000,
  })
}

export function createInsForgeAdminClient() {
  const baseUrl = process.env.INSFORGE_URL
  const apiKey = process.env.INSFORGE_API_KEY
  if (!baseUrl || !apiKey) {
    throw new Error('INSFORGE_URL and INSFORGE_API_KEY must be set for admin operations.')
  }
  return createAdminClient({ baseUrl, apiKey, timeout: 15_000 })
}
