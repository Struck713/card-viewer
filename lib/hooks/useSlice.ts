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
  // (docs/data-layer.md §4.6). Not yet acted on by the data layer — callers
  // that need "load this stats release specifically" are out of scope here.
  releaseId: string | null;
  setSlice: (tierGroup: TierGroup, matchType: MatchType) => void;
  // Carries tier/match/stats into any other link built off this page, so
  // the current slice/release selection survives navigation instead of
  // resetting to the default.
  toQueryString: () => string;
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
    return params.toString();
  }, [tierGroup, matchType, releaseId]);

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
    setSlice,
    toQueryString,
    findSlice,
  };
}
