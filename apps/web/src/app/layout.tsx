import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zenith',
  description: 'Zenith platform — foundation layer (Sprint S1-001).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
