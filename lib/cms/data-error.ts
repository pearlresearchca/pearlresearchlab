// Failed reads must not look like "no content": a database/network outage
// used to render blank pages (or 404 builder pages) with HTTP 200. Queries
// now throw this instead, so the request fails loudly and hits an error page.

export class BackendUnavailableError extends Error {
  constructor(context: string, cause?: unknown) {
    super(`The website’s content service is temporarily unavailable (${context}). Please try again in a moment.`)
    this.name = 'BackendUnavailableError'
    this.cause = cause
  }
}

type Result<T> = { data: T; error: { message?: string; code?: string } | null }

// Returns data, or throws (and logs) when the query itself failed. A query
// that simply matched no rows is not an error.
export function unwrap<T>(result: Result<T>, context: string): T {
  if (result.error) {
    console.error(`[data] ${context} failed:`, result.error.message ?? result.error)
    throw new BackendUnavailableError(context, result.error)
  }
  return result.data
}
