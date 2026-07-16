'use client';

/**
 * Route-level error boundary (Foundation Acceptance Review, Medium #2).
 * Without this, any uncaught error from a Server Component's data fetch
 * (a non-401 API error, or the API being unreachable) fell through to
 * Next.js's generic error page on every one of the app's screens.
 * `withAuth()` still handles the 401 -> /login redirect on its own; this
 * is only the fallback for everything else.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page">
      <section className="hero">
        <p className="hero-caption">Zenith</p>
        <p className="hero-statement">Something went wrong loading this page.</p>
      </section>
      <p className="muted">{error.message || 'An unexpected error occurred.'}</p>
      <button type="button" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
