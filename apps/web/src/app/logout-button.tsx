'use client';

import { useRouter } from 'next/navigation';

/** A client component only because it needs an onClick handler -- the Dashboard page itself stays a Server Component. */
export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="link"
      onClick={async () => {
        await fetch('/api/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
