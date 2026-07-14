import { NextResponse } from 'next/server';

const TOKEN_COOKIE = 'zenith_token';

/** Clears the preview's own session cookie. No backend call -- the API issues no session state to revoke. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(TOKEN_COOKIE);
  return response;
}
