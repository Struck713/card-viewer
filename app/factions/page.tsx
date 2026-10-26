import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FactionsPageClient } from './FactionsPageClient';

export const metadata: Metadata = {
  title: 'Faction win rates',
};

export default function FactionsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
      <FactionsPageClient />
    </Suspense>
  );
}
