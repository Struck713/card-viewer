'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { MatchType, TierGroup } from '../api/types';

const DEFAULT_TIER: TierGroup = 'mid';
const DEFAULT_MATCH: MatchType = 'ranked';
const VALID_TIERS: readonly TierGroup[] = ['low', 'mid', 'high', 'legend'];
const VALID_MATCHES: readonly MatchType[] = ['ranked', 'casual', 'campaign'];

export interface UseSliceResult {
  tierGroup: TierGroup;
  matchType: MatchType;
  // ?stats=<releaseId>, present when a link pinned a specific stats release
  // (docs/data-layer.md §4.6). Read by PinnedStatsSync in app/providers.tsx,
  // which is what actually loads that release instead of "latest".
  releaseId: string | null;
  // ?catalog=<version> — the catalog release the pinned statistics
  // describe. A release file carries no catalogVersion of its own, so a
  // pinned link is the only place this can come from; null means the link
  // didn't say.
  catalogVersion: string | null;
  setSlice: (tierGroup: TierGroup, matchType: MatchType) => void;
  // Carries tier/match/stats/catalog into any other link built off this
  // page, so the current slice and pinned release survive navigation
  // instead of resetting to the default.
  toQueryString: () => string;
  // Same, minus the pin — the "back to the latest release" link.
  unpinnedQueryString: () => string;
  findSlice: <T extends { tierGroup: TierGroup; matchType: MatchType }>(
    slices: T[],
  ) => T | undefined;
}

function isTierGroup(value: string | null): value is TierGroup {
  return value !== null && (VALID_TIERS as readonly string[]).includes(value);
}

function isMatchType(value: string | null): value is MatchType {
  return value !== null && (VALID_MATCHES as readonly string[]).includes(value);
}

export function useSlice(): UseSliceResult {
  const router = useRouter();
  const pathname = usePathname();
  // useSearchParams() is typed as nullable (and is null during a static
  // prerender of a route that isn't reading params), so the fallback has to
  // stay — dropping it reintroduces a build failure on Vercel. Memoize it so
  // the identity is stable across renders, which the useCallback deps below
  // depend on; a bare `?? new URLSearchParams()` allocates every render.
  const rawSearchParams = useSearchParams();
  const searchParams = useMemo(
    () => rawSearchParams ?? new URLSearchParams(),
    [rawSearchParams],
  );

  const tierParam = searchParams.get('tier');
  const matchParam = searchParams.get('match');
  const tierGroup = isTierGroup(tierParam) ? tierParam : DEFAULT_TIER;
  const matchType = isMatchType(matchParam) ? matchParam : DEFAULT_MATCH;
  const releaseId = searchParams.get('stats');
  const catalogVersion = searchParams.get('catalog');

  const setSlice = useCallback(
    (nextTier: TierGroup, nextMatch: MatchType) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tier', nextTier);
      params.set('match', nextMatch);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const toQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.set('tier', tierGroup);
    params.set('match', matchType);
    if (releaseId) params.set('stats', releaseId);
    if (catalogVersion) params.set('catalog', catalogVersion);
    return params.toString();
  }, [tierGroup, matchType, releaseId, catalogVersion]);

  const unpinnedQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.set('tier', tierGroup);
    params.set('match', matchType);
    return params.toString();
  }, [tierGroup, matchType]);

  const findSlice = useCallback(
    <T extends { tierGroup: TierGroup; matchType: MatchType }>(
      slices: T[],
    ): T | undefined =>
      slices.find(
        (slice) =>
          slice.tierGroup === tierGroup && slice.matchType === matchType,
      ),
    [tierGroup, matchType],
  );

  return {
    tierGroup,
    matchType,
    releaseId,
    catalogVersion,
    setSlice,
    toQueryString,
    unpinnedQueryString,
    findSlice,
  };
}
