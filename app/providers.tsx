'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { loadCatalog } from '../lib/api/catalog';
import { getCatalogOrigin } from '../lib/api/config';
import { loadStats } from '../lib/api/stats';
import {
  CatalogContext,
  StatsContext,
  type CatalogState,
  type StatsState,
} from '../lib/hooks/context';

const origin = getCatalogOrigin();
const missingOriginError: { status: 'network-error'; error: unknown } | null =
  origin
    ? null
    : {
        status: 'network-error',
        error: new Error('NEXT_PUBLIC_CATALOG_ORIGIN is not set'),
      };

// Both halves of the API are fetched exactly once per session and shared
// across client-side navigation. Nothing in the URL selects what to load
// any more — there is one catalog and one statistics file — so there is no
// useSearchParams() here, and therefore nothing that would opt the static
// shell out of prerendering.
export function AppProviders({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<CatalogState>(
    missingOriginError ?? { status: 'loading' },
  );
  const [stats, setStats] = useState<StatsState>(
    missingOriginError ?? { status: 'loading' },
  );

  useEffect(() => {
    if (!origin) return;
    let cancelled = false;
    loadCatalog(origin).then(
      (result) => {
        if (!cancelled) setCatalog(result);
      },
      (error) => {
        // Defense in depth: loadCatalog/loadStats resolve to a typed
        // result for every known failure mode, but a promise that somehow
        // still rejects must not leave the UI stuck on "loading" forever.
        if (!cancelled) setCatalog({ status: 'network-error', error });
      },
    );
    loadStats(origin).then(
      (result) => {
        if (!cancelled) setStats(result);
      },
      (error) => {
        if (!cancelled) setStats({ status: 'network-error', error });
      },
    );
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
