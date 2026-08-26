export type ActionResult = { ok: true } | { error: string }

function isNextRedirectError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'digest' in err &&
    typeof (err as { digest?: unknown }).digest === 'string' &&
    (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  )
}

// Runs a mutation, converting thrown errors into a friendly ActionResult
// instead of letting them crash the page. Next.js's redirect()/notFound()
// work by throwing a special error — those are always rethrown so
// navigation still happens.
export async function withErrorHandling(fn: () => Promise<void>): Promise<ActionResult> {
  try {
    await fn()
    return { ok: true }
  } catch (err) {
    if (isNextRedirectError(err)) throw err
    console.error(err)
    return { error: err instanceof Error ? err.message : 'Something went wrong. Please try again.' }
  }
}

// Throws if an InsForge SDK call returned an error, so callers can just
// `check(await insforge.database.from(...).update(...))` and let
// withErrorHandling turn a failure into a toast.
export function check<T>({ error }: { data: T; error: { message?: string } | null }): void {
  if (error) throw new Error(error.message || 'Save failed — you may not have permission to edit this.')
}
