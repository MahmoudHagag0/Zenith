import Link from 'next/link';

/** Route-level 404 fallback (Foundation Acceptance Review, Medium #2). */
export default function NotFound() {
  return (
    <main className="page">
      <section className="hero">
        <p className="hero-caption">Zenith</p>
        <p className="hero-statement">Page not found.</p>
      </section>
      <p className="muted">
        <Link href="/">Return to Dashboard</Link>
      </p>
    </main>
  );
}
