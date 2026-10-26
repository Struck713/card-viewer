'use client';

import { FactionTable } from '../../components/faction-table/FactionTable';
import { ApiInconsistent } from '../../components/empty-states/ApiInconsistent';
import { EmptyState } from '../../components/empty-states/EmptyState';
import { NotPublishedYet } from '../../components/empty-states/NotPublishedYet';
import { SchemaMismatch } from '../../components/empty-states/SchemaMismatch';
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
  if (stats.status === 'not-published') {
    return <NotPublishedYet />;
  }
  if (stats.status === 'schema-mismatch') {
    return <SchemaMismatch got={stats.got} />;
  }
  if (stats.status === 'inconsistent') {
    return <ApiInconsistent url={stats.url} />;
  }
  if (stats.status === 'network-error') {
    return (
      <EmptyState tone="error" title="Couldn't load statistics" description="A network error occurred. Please try again." />
    );
  }

  const found = slice.findSlice(stats.data.deckStats.slices);

  return (
    <div className="space-y-4">
      <ProvenanceBar />
      <SliceSelector tierGroup={slice.tierGroup} matchType={slice.matchType} onChange={slice.setSlice} />
      {found ? (
        <FactionTable decks={found.decks} />
      ) : (
        <EmptyState
          title="No published data for this slice"
          description="Try a different tier or match-type combination."
        />
      )}
    </div>
  );
}
