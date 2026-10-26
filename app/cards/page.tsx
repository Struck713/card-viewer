import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CardsPageClient } from './CardsPageClient';

export const metadata: Metadata = {
  title: 'Cards',
};

export default function CardsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
      <CardsPageClient />
    </Suspense>
  );
}
