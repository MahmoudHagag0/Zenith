'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * S1-021 Developer Preview -- a minimal login/register form. Posts to this
 * app's own `/api/login` or `/api/register` Route Handlers, which
 * server-proxy the existing, unmodified `apps/api` auth endpoints
 * (S1-002). No new authentication logic.
 */
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) {
        setError(body.message ?? 'Something went wrong.');
        setSubmitting(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('Could not reach the API.');
      setSubmitting(false);
    }
  }

  return (
    <main className="preview-page">
      <h1>Zenith -- Developer Preview</h1>
      <p className="muted">{mode === 'login' ? 'Sign in' : 'Create an account'} to view the Dashboard.</p>
      <form onSubmit={handleSubmit} className="stack">
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {mode === 'login' ? 'Sign in' : 'Register'}
        </button>
      </form>
      <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
      </button>
    </main>
  );
}
