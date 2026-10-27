import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { AppProviders } from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Card Statistics',
  description: 'Card catalog and statistics for the card game.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        <AppProviders>
          <header className="border-b border-neutral-200">
            <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
              <Link href="/cards" className="font-semibold">
                Card Statistics
              </Link>
              <Link
                href="/cards"
                className="text-sm text-neutral-700 hover:underline"
              >
                Cards
              </Link>
              <Link
                href="/factions"
                className="text-sm text-neutral-700 hover:underline"
              >
                Factions
              </Link>
              <Link
                href="/methodology"
                className="text-sm text-neutral-700 hover:underline"
              >
                Methodology
              </Link>
            </nav>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
            {children}
          </main>
          <footer className="border-t border-neutral-200 px-4 py-4 text-center text-xs text-neutral-500">
            Unofficial, community-run card statistics. Not affiliated with the
            game&apos;s developers.
          </footer>
        </AppProviders>
      </body>
    </html>
  );
}
