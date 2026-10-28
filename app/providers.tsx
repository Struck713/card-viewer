'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { loadCatalog } from '../lib/api/catalog';
import { getCatalogOrigin } from '../lib/api/config';
import { loadStats, loadStatsRelease } from '../lib/api/stats';
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

// Which stats release the current URL asks for. Both null = "latest".
interface StatsPin {
  releaseId: string | null;
  catalogVersion: string | null;
}

// Reads ?stats=/?catalog= and reports them upward; renders nothing.
//
// This exists as its own component purely so the useSearchParams() Suspense
// requirement doesn't land on AppProviders, which wraps the entire app
// shell in app/layout.tsx — putting the hook there would opt the whole
// static shell out of prerendering. Rendering null means the boundary
// around it costs nothing visually.
function PinnedStatsSync({ onChange }: { onChange: (pin: StatsPin) => void }) {
  // useSearchParams() is typed as nullable and is null during a static
  // prerender; the same memoized fallback as lib/hooks/useSlice.ts, whose
  // comment records that dropping it previously broke the Vercel build.
  const rawSearchParams = useSearchParams();
  const searchParams = useMemo(
    () => rawSearchParams ?? new URLSearchParams(),
    [rawSearchParams],
  );
  const releaseId = searchParams.get('stats');
  const catalogVersion = searchParams.get('catalog');

  useEffect(() => {
    onChange({ releaseId, catalogVersion });
  }, [onChange, releaseId, catalogVersion]);

  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<CatalogState>(
    missingOriginError ?? { status: 'loading' },
  );
  // Keyed by the pin it was loaded for, so switching pins reads as
  // "loading" without a synchronous setState in the effect below.
  const [statsFor, setStatsFor] = useState<{ key: string; state: StatsState }>({
    key: '|',
    state: missingOriginError ?? { status: 'loading' },
  });
  const [pin, setPin] = useState<StatsPin>({
    releaseId: null,
    catalogVersion: null,
  });

  // setPin is a setState, so it's already stable; wrapping it keeps
  // PinnedStatsSync's effect deps honest without re-running on every
  // render.
  const handlePinChange = useCallback((next: StatsPin) => {
    setPin((current) =>
      current.releaseId === next.releaseId &&
      current.catalogVersion === next.catalogVersion
        ? current
        : next,
    );
  }, []);

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
    return () => {
      cancelled = true;
    };
  }, []);

  // Separate from the catalog effect because this one re-runs: following a
  // ?stats= link, or clearing it, swaps which release is loaded.
  const { releaseId, catalogVersion } = pin;
  const pinKey = `${releaseId ?? ''}|${catalogVersion ?? ''}`;
  useEffect(() => {
    if (!origin) return;
    let cancelled = false;
    const loading = releaseId
      ? loadStatsRelease(origin, releaseId, catalogVersion)
      : loadStats(origin);
    loading.then(
      (result) => {
        if (!cancelled) setStatsFor({ key: pinKey, state: result });
      },
      (error) => {
        if (!cancelled) {
          setStatsFor({
            key: pinKey,
            state: { status: 'network-error', error },
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [releaseId, catalogVersion, pinKey]);

  // A result loaded for a different pin is stale by definition — show
  // loading rather than another release's numbers under this URL.
  const stats: StatsState =
    statsFor.key === pinKey ? statsFor.state : { status: 'loading' };

  return (
    <CatalogContext.Provider value={catalog}>
      <StatsContext.Provider value={stats}>
        <Suspense fallback={null}>
          <PinnedStatsSync onChange={handlePinChange} />
        </Suspense>
        {children}
      </StatsContext.Provider>
    </CatalogContext.Provider>
  );
}
