'use client';

import Link from 'next/link';
import { Abilities } from '../../../components/card-detail/Abilities';
import { PrintedData } from '../../../components/card-detail/PrintedData';
import { StatRows } from '../../../components/card-detail/StatRows';
import { ApiInconsistent } from '../../../components/empty-states/ApiInconsistent';
import { EmptyState } from '../../../components/empty-states/EmptyState';
import { SchemaMismatch } from '../../../components/empty-states/SchemaMismatch';
import { StatsStatusBanner } from '../../../components/empty-states/StatsStatusBanner';
import { ProvenanceBar } from '../../../components/provenance/ProvenanceBar';
import { useCatalog } from '../../../lib/hooks/useCatalog';
import { useSlice } from '../../../lib/hooks/useSlice';
import { useStats } from '../../../lib/hooks/useStats';

export function CardDetailPageClient({ id }: { id: string }) {
  const catalog = useCatalog();
  const { stats } = useStats();
  const slice = useSlice();

  if (catalog.status === 'loading') {
    return <p className="text-sm text-neutral-500">Loading…</p>;
  }
  if (catalog.status === 'not-deployed') {
    return (
      <EmptyState
        tone="error"
        title="Catalog not available"
        description="The card catalog could not be reached. Please check back soon."
      />
    );
  }
  if (catalog.status === 'schema-mismatch') {
    return <SchemaMismatch got={catalog.got} />;
  }
  if (catalog.status === 'inconsistent') {
    return <ApiInconsistent url={catalog.url} />;
  }
  if (catalog.status === 'network-error') {
    return (
      <EmptyState
        tone="error"
        title="Couldn't load the card catalog"
        description="A network error occurred. Please try again."
      />
    );
  }

  const card = catalog.data.cardsById.get(id);
  if (!card) {
    return (
      <EmptyState
        title="Card not found"
        description="This card id doesn't exist in the current catalog release."
      />
    );
  }

  const slice_ =
    stats.status === 'ok'
      ? slice.findSlice(stats.data.cardStats.slices)
      : undefined;
  const cardStat = slice_?.cards.find((entry) => entry.id === id);
  const hasTransforms =
    card.isTransformForm ||
    card.transformInto !== null ||
    card.transformChoices.length > 0;

  return (
    <div className="space-y-6">
      <Link
        href={`/cards?${slice.toQueryString()}`}
        className="text-sm text-neutral-600 hover:underline"
      >
        ← Back to cards
      </Link>
      <ProvenanceBar />
      <PrintedData card={card} />
      <Abilities card={card} keywords={catalog.data.keywords} />
      {hasTransforms && (
        <section className="text-sm">
          <h2 className="text-sm font-semibold text-neutral-700">Transforms</h2>
          <ul className="mt-2 space-y-1">
            {card.transformInto && (
              <li>
                Transforms into{' '}
                <Link
                  href={`/cards/${card.transformInto}?${slice.toQueryString()}`}
                  className="underline"
                >
                  {catalog.data.cardsById.get(card.transformInto)?.name ??
                    card.transformInto}
                </Link>
              </li>
            )}
            {card.transformChoices.map((choiceId) => (
              <li key={choiceId}>
                Can transform into{' '}
                <Link
                  href={`/cards/${choiceId}?${slice.toQueryString()}`}
                  className="underline"
                >
                  {catalog.data.cardsById.get(choiceId)?.name ?? choiceId}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h2 className="text-sm font-semibold text-neutral-700">Statistics</h2>
        <div className="mt-2">
          <StatsStatusBanner stats={stats} />
          {stats.status === 'ok' &&
            (cardStat ? (
              <StatRows
                stat={cardStat}
                ratePrecision={stats.data.cardStats.method.ratePrecision}
              />
            ) : (
              <EmptyState
                title="No published data for this slice"
                description="This card has no statistics in the selected tier/match-type slice."
              />
            ))}
        </div>
      </section>
    </div>
  );
}
