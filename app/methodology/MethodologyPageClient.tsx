'use client';

import { ApiInconsistent } from '../../components/empty-states/ApiInconsistent';
import { EmptyState } from '../../components/empty-states/EmptyState';
import { NotPublishedYet } from '../../components/empty-states/NotPublishedYet';
import { SchemaMismatch } from '../../components/empty-states/SchemaMismatch';
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
          {stats.status === 'loading' && <p className="text-sm text-neutral-500">Loading…</p>}
          {stats.status === 'not-published' && <NotPublishedYet />}
          {stats.status === 'schema-mismatch' && <SchemaMismatch got={stats.got} />}
          {stats.status === 'inconsistent' && <ApiInconsistent url={stats.url} />}
          {stats.status === 'network-error' && (
            <EmptyState tone="error" title="Couldn't load statistics" description="A network error occurred. Please try again." />
          )}
          {stats.status === 'ok' && <MethodologyPanel method={stats.data.cardStats.method} />}
        </div>
      </section>
    </div>
  );
}
