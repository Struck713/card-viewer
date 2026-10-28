import type { Card, CardWinrate } from '../../lib/api/types';
import { compareMatches, compareWinRate } from '../../lib/format/suppression';

export interface CardRow {
  card: Card;
  // undefined when the card has no row in the statistics file, or when
  // statistics aren't loaded at all — the Table distinguishes those two
  // cases by its own statsLoaded prop.
  stat: CardWinrate | undefined;
}

export type StaticSortKey = 'name' | 'color' | 'type' | 'rarity' | 'manaCost';
export type StatSortKey = 'record' | 'winRate';
export type SortKey = StaticSortKey | StatSortKey;
export type SortDirection = 'asc' | 'desc';

export const STATIC_COLUMNS: { key: StaticSortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color' },
  { key: 'type', label: 'Type' },
  { key: 'rarity', label: 'Rarity' },
  { key: 'manaCost', label: 'Cost' },
];

// Two columns, because the API publishes one rate per card. Record carries
// the sample size inline (wins + losses === matches on every row the API
// serves, verified), which is what makes a win rate honest when
// methodology.minSample can be as low as 1.
export const STAT_COLUMNS: { key: StatSortKey; label: string }[] = [
  { key: 'record', label: 'Record' },
  { key: 'winRate', label: 'Win %' },
];

function isStatKey(key: SortKey): key is StatSortKey {
  return STAT_COLUMNS.some((col) => col.key === key);
}

// A win-rate sort must respect the suppression rule just like rendering
// does: a card with no row, or with a null rate, sorts last in both
// directions, never as 0 — which would bury it among the cards that
// genuinely lost every game.
//
// Record sorts by match count instead, which has no suppressed state.
export function sortRows(
  rows: CardRow[],
  key: SortKey,
  direction: SortDirection,
): CardRow[] {
  const sorted = [...rows];
  if (isStatKey(key)) {
    const compare =
      key === 'winRate' ? compareWinRate(direction) : compareMatches(direction);
    sorted.sort((a, b) => compare(a.stat, b.stat));
    return sorted;
  }
  sorted.sort((a, b) => {
    const av = a.card[key];
    const bv = b.card[key];
    if (typeof av === 'number' && typeof bv === 'number') {
      return direction === 'asc' ? av - bv : bv - av;
    }
    const comparison = String(av).localeCompare(String(bv));
    return direction === 'asc' ? comparison : -comparison;
  });
  return sorted;
}
