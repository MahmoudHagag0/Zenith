import { NextResponse } from 'next/server';
import { ApiError, register } from '@/lib/api';

const TOKEN_COOKIE = 'zenith_token';

/** Thin server-side proxy to the existing `POST /auth/register` (S1-002). See `login/route.ts` for rationale. */
export async function POST(request: Request) {
  const { email, password } = await request.json();
  try {
    const { accessToken } = await register(email, password);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(TOKEN_COOKIE, accessToken, { httpOnly: true, sameSite: 'lax', path: '/' });
    return response;
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Registration failed' }, { status });
  }
}
