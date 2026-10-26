'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { loadCatalog } from '../lib/api/catalog';
import { getCatalogOrigin } from '../lib/api/config';
import { loadStats } from '../lib/api/stats';
import { CatalogContext, StatsContext, type CatalogState, type StatsState } from '../lib/hooks/context';

export function AppProviders({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<CatalogState>({ status: 'loading' });
  const [stats, setStats] = useState<StatsState>({ status: 'loading' });

  useEffect(() => {
    const origin = getCatalogOrigin();
    if (!origin) {
      const error = new Error('NEXT_PUBLIC_CATALOG_ORIGIN is not set');
      setCatalog({ status: 'network-error', error });
      setStats({ status: 'network-error', error });
      return;
    }

    let cancelled = false;
    loadCatalog(origin).then((result) => {
      if (!cancelled) setCatalog(result);
    });
    loadStats(origin).then((result) => {
      if (!cancelled) setStats(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CatalogContext.Provider value={catalog}>
      <StatsContext.Provider value={stats}>{children}</StatsContext.Provider>
    </CatalogContext.Provider>
  );
}
