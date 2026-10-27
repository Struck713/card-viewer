'use client';

import { FactionTable } from '../../components/faction-table/FactionTable';
import { EmptyState } from '../../components/empty-states/EmptyState';
import { StatsStatusBanner } from '../../components/empty-states/StatsStatusBanner';
import { ProvenanceBar } from '../../components/provenance/ProvenanceBar';
import { SliceSelector } from '../../components/slice-selector/SliceSelector';
import { useSlice } from '../../lib/hooks/useSlice';
import { useStats } from '../../lib/hooks/useStats';

// This page's entire content is deck-stats.json — when it's absent, the
// whole page is an empty state, never a partial/broken table
// (docs/pages-and-components.md).
export function FactionsPageClient() {
  const { stats } = useStats();
  const slice = useSlice();

  if (stats.status === 'loading') {
    return <p className="text-sm text-neutral-500">Loading…</p>;
  }
  if (stats.status !== 'ok') {
    return <StatsStatusBanner stats={stats} />;
  }

  const found = slice.findSlice(stats.data.deckStats.slices);

  return (
    <div className="space-y-4">
      <ProvenanceBar />
      <SliceSelector
        tierGroup={slice.tierGroup}
        matchType={slice.matchType}
        onChange={slice.setSlice}
      />
      {found ? (
        <FactionTable
          decks={found.decks}
          ratePrecision={stats.data.deckStats.method.ratePrecision}
        />
      ) : (
        <EmptyState
          title="No published data for this slice"
          description="Try a different tier or match-type combination."
        />
      )}
    </div>
  );
}
