import type { CardWinrate } from '../api/types';

// The rule most likely to be gotten wrong (spec §3.5). It used to read "a
// missing key means not enough data, never 0"; the API now sends the key
// always and uses null instead, so it reads "null means not enough data,
// never 0".
//
// The stakes went UP with that change. Under the old contract a suppressed
// figure was the only thing that could look like zero, so `?? 0` was a
// latent bug you could ship without noticing. Now both states occur side
// by side in every live response: as sampled on 2026-10-28, 59 of 168
// cards had a genuine winRate of 0 (they lost every game they were in)
// while 40 had null (they played none). Collapsing those is exactly the
// false confidence this rule exists to prevent.
//
// Every stat display and every sortable stats column must route through
// these rather than inlining null checks or `?? 0` fallbacks.

// Checks undefined as well as null on purpose: undefined covers a card
// with no row in the statistics file at all, and it also means a future
// upstream return to key-absence degrades to "not enough data" rather than
// rendering the string "undefined".
export function isSuppressed(stat: CardWinrate | undefined): boolean {
  return stat === undefined || stat.winRate === null;
}

export function winRateValue(stat: CardWinrate | undefined): number | null {
  return stat?.winRate ?? null;
}

export type SortDirection = 'asc' | 'desc';

// Suppressed rows always sort last, regardless of direction — never as 0
// (which would otherwise rank them as the worst, or best in a desc sort,
// and would bury the cards that genuinely lost every game among them).
export function compareWinRate(
  direction: SortDirection,
): (a: CardWinrate | undefined, b: CardWinrate | undefined) => number {
  return (a, b) => {
    const aSuppressed = isSuppressed(a);
    const bSuppressed = isSuppressed(b);
    if (aSuppressed && bSuppressed) return 0;
    if (aSuppressed) return 1;
    if (bSuppressed) return -1;
    const aValue = winRateValue(a) as number;
    const bValue = winRateValue(b) as number;
    return direction === 'asc' ? aValue - bValue : bValue - aValue;
  };
}

// matches/wins/losses have no suppressed state: they are always-present
// counts, and `matches: 0` is a real "no games", not "not enough data".
// The suppression story belongs to winRate alone.
export function compareMatches(
  direction: SortDirection,
): (a: CardWinrate | undefined, b: CardWinrate | undefined) => number {
  return (a, b) => {
    const aValue = a?.matches ?? 0;
    const bValue = b?.matches ?? 0;
    return direction === 'asc' ? aValue - bValue : bValue - aValue;
  };
}
