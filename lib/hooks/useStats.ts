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
}

export function useStats(): UseStatsResult {
  const stats = useContext(StatsContext);
  const catalog = useContext(CatalogContext);
  if (!stats || !catalog) {
    throw new Error('useStats must be used within <AppProviders>');
  }

  const statsCatalogVersion =
    stats.status === 'ok' ? stats.data.index.catalogVersion : null;
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
  };
}
