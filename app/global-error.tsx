'use client'

// Last-resort error page for failures in the root layout itself (the normal
// app/error.tsx can't render then). Must provide its own <html> and <body>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f8faf9', color: '#172b2b', display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <main style={{ maxWidth: 480, padding: 24, textAlign: 'center' }}>
          <p style={{ letterSpacing: '.15em', textTransform: 'uppercase', fontSize: 12, fontWeight: 700, color: '#146b68' }}>PEARL</p>
          <h1 style={{ fontSize: 28, margin: '8px 0 12px' }}>The site is temporarily unavailable.</h1>
          <p style={{ color: '#56706e' }}>Please try again in a moment.</p>
          <button type="button" onClick={reset} style={{ marginTop: 16, background: '#146b68', color: '#fff', border: 0, padding: '12px 18px', fontWeight: 700, cursor: 'pointer' }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
