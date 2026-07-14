import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zenith',
  description: 'Zenith platform — Developer Preview (Sprint S1-021).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
