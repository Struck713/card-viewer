'use client';

import Link from 'next/link';
import { Abilities } from '../../../components/card-detail/Abilities';
import { PrintedData } from '../../../components/card-detail/PrintedData';
import { StatRows } from '../../../components/card-detail/StatRows';
import { EmptyState } from '../../../components/empty-states/EmptyState';
import { StatsStatusBanner } from '../../../components/empty-states/StatsStatusBanner';
import { ProvenanceBar } from '../../../components/provenance/ProvenanceBar';
import { useCatalog } from '../../../lib/hooks/useCatalog';
import { useStats } from '../../../lib/hooks/useStats';

export function CardDetailPageClient({ id }: { id: string }) {
  const catalog = useCatalog();
  const stats = useStats();

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
  if (catalog.status === 'network-error') {
    return (
      <EmptyState
        tone="error"
        title="Couldn't load the card catalog"
        description="A network error occurred. Please try again."
      />
    );
  }

  const cards = catalog.data;
  const card = cards.cardsById.get(id);
  if (!card) {
    return (
      <EmptyState
        title="Card not found"
        description="This card id doesn't exist in the card catalog."
      />
    );
  }

  const cardStat = stats.status === 'ok' ? stats.data.byId.get(id) : undefined;
  const hasTransforms =
    card.isTransformForm ||
    card.transformInto !== null ||
    card.transformChoices.length > 0;

  return (
    <div className="space-y-6">
      <Link href="/cards" className="text-sm text-neutral-600 hover:underline">
        ← Back to cards
      </Link>
      <ProvenanceBar />
      <PrintedData card={card} />
      <Abilities card={card} keywords={cards.keywords} />
      {hasTransforms && (
        <section className="text-sm">
          <h2 className="text-sm font-semibold text-neutral-700">Transforms</h2>
          <ul className="mt-2 space-y-1">
            {card.transformInto && (
              <li>
                Transforms into{' '}
                <Link
                  href={`/cards/${card.transformInto}`}
                  className="underline"
                >
                  {cards.cardsById.get(card.transformInto)?.name ??
                    card.transformInto}
                </Link>
              </li>
            )}
            {card.transformChoices.map((choiceId) => (
              <li key={choiceId}>
                Can transform into{' '}
                <Link href={`/cards/${choiceId}`} className="underline">
                  {cards.cardsById.get(choiceId)?.name ?? choiceId}
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
              <StatRows stat={cardStat} />
            ) : (
              // Reachable for the non-collectible token and transform
              // forms, which the statistics file has no row for — they are
              // linked from a collectible card's Transforms section above.
              <EmptyState
                title="No published data"
                description="The statistics file has no row for this card."
              />
            ))}
        </div>
      </section>
    </div>
  );
}
