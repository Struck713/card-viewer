import type { CardStat } from '../api/types';

// The rule most likely to be gotten wrong (spec §3.5): a missing key means
// "not enough data," never 0. Every stat display and every sortable stats
// column must route through these rather than inlining `in` checks or
// `?? 0` fallbacks.

export type StatField =
  | 'drawRate'
  | 'keepRate'
  | 'playRate'
  | 'winRateWhenDrawn'
  | 'winRateWhenKept'
  | 'winRateWhenPlayed';

export function statValue(
  card: CardStat,
  field: StatField,
): number | undefined {
  return card[field];
}

export function isSuppressed(card: CardStat, field: StatField): boolean {
  return !(field in card);
}

export type SortDirection = 'asc' | 'desc';

// Suppressed rows always sort last, regardless of direction — never as 0
// (which would otherwise rank them as the worst, or best in a desc sort).
export function compareStat(
  field: StatField,
  direction: SortDirection,
): (a: CardStat, b: CardStat) => number {
  return (a, b) => {
    const aSuppressed = isSuppressed(a, field);
    const bSuppressed = isSuppressed(b, field);
    if (aSuppressed && bSuppressed) return 0;
    if (aSuppressed) return 1;
    if (bSuppressed) return -1;
    const aValue = statValue(a, field) as number;
    const bValue = statValue(b, field) as number;
    return direction === 'asc' ? aValue - bValue : bValue - aValue;
  };
}
