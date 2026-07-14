import { NextResponse } from 'next/server';
import { ApiError, login } from '@/lib/api';

const TOKEN_COOKIE = 'zenith_token';

/**
 * Thin server-side proxy to the existing `POST /auth/login` (S1-002).
 * Exists only so the browser-side login form can authenticate without a
 * cross-origin request to `apps/api` -- no new authentication logic, no
 * token issuance of its own; the accessToken stored in the cookie below
 * is exactly what `apps/api` returned.
 */
export async function POST(request: Request) {
  const { email, password } = await request.json();
  try {
    const { accessToken } = await login(email, password);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(TOKEN_COOKIE, accessToken, { httpOnly: true, sameSite: 'lax', path: '/' });
    return response;
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Login failed' }, { status });
  }
}
