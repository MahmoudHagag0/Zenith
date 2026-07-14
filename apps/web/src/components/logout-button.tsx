'use client';

import { useRouter } from 'next/navigation';

/**
 * A client component only because it needs an onClick handler -- pages
 * using it stay Server Components. Styled quietly (S1-023, `.signout`):
 * sign-out is a low-frequency, non-primary action and its top-right
 * position already makes it findable by convention, so it doesn't need
 * visual weight competing with the page's actual content.
 */
export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="signout"
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
