import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FDR Assessment Creator',
  description: 'Key Assessment builder for FDR Math 9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
