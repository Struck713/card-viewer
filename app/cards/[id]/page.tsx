import { Suspense } from 'react';
import { CardDetailPageClient } from './CardDetailPageClient';

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
      <CardDetailPageClient id={id} />
    </Suspense>
  );
}
