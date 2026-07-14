import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiError } from './api';

const TOKEN_COOKIE = 'zenith_token';

/** Reads the session cookie set by `/api/login`; redirects to `/login` if absent. Shared by every authenticated Server Component page. */
export async function requireToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) {
    redirect('/login');
  }
  return token;
}

/** Wraps an authenticated data-fetch: redirects to `/login` on a 401 instead of rendering an error page. */
export async function withAuth<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const token = await requireToken();
  try {
    return await fn(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect('/login');
    }
    throw error;
  }
}
