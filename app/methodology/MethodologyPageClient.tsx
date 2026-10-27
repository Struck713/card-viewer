'use client';

import { StatsStatusBanner } from '../../components/empty-states/StatsStatusBanner';
import { MethodologyPanel } from '../../components/provenance/MethodologyPanel';
import { ProvenanceBar } from '../../components/provenance/ProvenanceBar';
import { useStats } from '../../lib/hooks/useStats';

// Catalog provenance always shows (via ProvenanceBar, even when stats
// aren't loaded); the method block and stats provenance show the empty
// state when stats aren't published (docs/pages-and-components.md).
export function MethodologyPageClient() {
  const { stats } = useStats();

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
            <MethodologyPanel method={stats.data.cardStats.method} />
          )}
        </div>
      </section>
    </div>
  );
}
