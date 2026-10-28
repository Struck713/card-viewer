'use client';

import { StatsStatusBanner } from '../../components/empty-states/StatsStatusBanner';
import { MethodologyPanel } from '../../components/provenance/MethodologyPanel';
import { ProvenanceBar } from '../../components/provenance/ProvenanceBar';
import { useStats } from '../../lib/hooks/useStats';

// The methodology block is published inside the statistics file, so when
// statistics aren't available there is nothing here to show but the empty
// state (docs/pages-and-components.md).
export function MethodologyPageClient() {
  const stats = useStats();

  return (
    <div className="space-y-6">
      <ProvenanceBar />
      <section>
        <h1 className="text-lg font-semibold">Methodology</h1>
        <div className="mt-3">
          {stats.status === 'loading' && (
            <p className="text-sm text-neutral-500">Loading…</p>
          )}
          <StatsStatusBanner stats={stats} />
          {stats.status === 'ok' && (
            <MethodologyPanel methodology={stats.data.methodology} />
          )}
        </div>
      </section>
    </div>
  );
}
