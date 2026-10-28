'use client';

import { useContext, useEffect, useState } from 'react';
import { loadCatalogRelease } from '../api/catalog';
import { getCatalogOrigin } from '../api/config';
import {
  CatalogContext,
  StatsContext,
  type CatalogState,
  type StatsState,
} from './context';

export interface UseStatsResult {
  stats: StatsState;
  // The catalog release that matches stats.data.index.catalogVersion — per
  // docs/data-contract.md rule #3, names/costs shown alongside statistics
  // must come from THIS release, never catalog/latest.json's, when they
  // differ. Equal to the primary catalog context when the versions match
  // (no extra fetch needed); 'loading' while a mismatch is being resolved.
  statsCatalog: CatalogState;
  catalogVersionMismatch: boolean;
  // True when a stats release is loaded but we don't know which catalog
  // release it describes — only possible for a ?stats= link that omitted
  // ?catalog=, since a release file carries no catalogVersion of its own.
  // Distinct from catalogVersionMismatch === false, which asserts the
  // versions actually agree.
  catalogVersionUnknown: boolean;
}

export function useStats(): UseStatsResult {
  const stats = useContext(StatsContext);
  const catalog = useContext(CatalogContext);
  if (!stats || !catalog) {
    throw new Error('useStats must be used within <AppProviders>');
  }

  const statsCatalogVersion =
    stats.status === 'ok' ? stats.data.provenance.catalogVersion : null;
  const currentCatalogVersion =
    catalog.status === 'ok' ? catalog.data.index.catalogVersion : null;
  const mismatch =
    statsCatalogVersion !== null &&
    currentCatalogVersion !== null &&
    statsCatalogVersion !== currentCatalogVersion;
  const needsOwnFetch =
    statsCatalogVersion !== null &&
    statsCatalogVersion !== currentCatalogVersion;

  const [fetchedCatalog, setFetchedCatalog] = useState<CatalogState>({
    status: 'loading',
  });

  useEffect(() => {
    if (!needsOwnFetch || !statsCatalogVersion) return;
    const origin = getCatalogOrigin();
    if (!origin) return;
    let cancelled = false;
    loadCatalogRelease(origin, statsCatalogVersion).then((result) => {
      if (!cancelled) setFetchedCatalog(result);
    });
    return () => {
      cancelled = true;
    };
  }, [needsOwnFetch, statsCatalogVersion]);

  return {
    stats,
    statsCatalog: needsOwnFetch ? fetchedCatalog : catalog,
    catalogVersionMismatch: mismatch,
    catalogVersionUnknown:
      stats.status === 'ok' && statsCatalogVersion === null,
  };
}

// The catalog release whose card data should be rendered.
//
// Per docs/data-contract.md rule #3, names and costs shown beside
// statistics must come from the catalog release the statistics describe,
// not from whatever catalog/latest.json currently points at. useStats()
// already fetches that release as `statsCatalog`; this is what makes pages
// actually render from it.
//
// Falls back to the primary catalog when the versions agree (the common
// case, and the same object — no extra fetch), when no stats are loaded,
// or when the stats-named release itself couldn't be loaded. That last
// case is already surfaced in red by ProvenanceBar, so the fallback is
// visible rather than silent.
//
// Error/loading states always come from the primary catalog, since this
// only ever substitutes an 'ok' one.
export function useDisplayCatalog(): CatalogState {
  const catalog = useContext(CatalogContext);
  const { statsCatalog, catalogVersionMismatch } = useStats();
  if (!catalog) {
    throw new Error('useDisplayCatalog must be used within <AppProviders>');
  }
  return catalogVersionMismatch && statsCatalog.status === 'ok'
    ? statsCatalog
    : catalog;
}
