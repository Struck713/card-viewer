'use client';

import { useCatalog } from '../../lib/hooks/useCatalog';
import { useStats } from '../../lib/hooks/useStats';

// Mounted on every page that shows a statistic — not just /methodology.
// Catalog fields always show once loaded; stats fields only once a stats
// release is loaded, plus a visible mismatch notice per
// docs/suppression-and-states.md.
export function ProvenanceBar() {
  const catalog = useCatalog();
  const { stats, catalogVersionMismatch } = useStats();

  if (catalog.status === 'loading') {
    return <p className="px-3 py-2 text-xs text-neutral-500">Loading provenance…</p>;
  }
  if (catalog.status !== 'ok') {
    // The page's own empty/error state already explains why there's
    // nothing to show provenance for.
    return null;
  }

  const { gameVersion, catalogVersion } = catalog.data.index;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
      <span>
        Game version: <strong className="font-medium text-neutral-800">{gameVersion}</strong>
      </span>
      <span>
        Catalog version: <strong className="font-medium text-neutral-800">{catalogVersion}</strong>
      </span>
      {stats.status === 'ok' && (
        <>
          <span>
            Stats release: <strong className="font-medium text-neutral-800">{stats.data.index.releaseId}</strong>
          </span>
          <span>
            Generated: <strong className="font-medium text-neutral-800">{stats.data.cardStats.generatedOn}</strong>
          </span>
        </>
      )}
      {catalogVersionMismatch && stats.status === 'ok' && (
        <span className="font-medium text-amber-700">
          Statistics describe catalog {stats.data.index.catalogVersion}, not the {catalogVersion} release being
          browsed.
        </span>
      )}
    </div>
  );
}
