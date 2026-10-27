import type { Card, CardStat } from '../../lib/api/types';
import { compareStat, type StatField } from '../../lib/format/suppression';

export interface CardRow {
  card: Card;
  // undefined when the card has no entry in the current slice ("no
  // published data for this slice") or when stats aren't loaded at all —
  // the Table distinguishes those two cases by its own statsLoaded prop.
  stat: CardStat | undefined;
}

export type StaticSortKey = 'name' | 'color' | 'type' | 'rarity' | 'manaCost';
export type SortKey = StaticSortKey | StatField;
export type SortDirection = 'asc' | 'desc';

export const STATIC_COLUMNS: { key: StaticSortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color' },
  { key: 'type', label: 'Type' },
  { key: 'rarity', label: 'Rarity' },
  { key: 'manaCost', label: 'Cost' },
];

export const STAT_COLUMNS: { key: StatField; label: string }[] = [
  { key: 'drawRate', label: 'Draw %' },
  { key: 'keepRate', label: 'Keep %' },
  { key: 'playRate', label: 'Play %' },
  { key: 'winRateWhenDrawn', label: 'Win (drawn)' },
  { key: 'winRateWhenKept', label: 'Win (kept)' },
  { key: 'winRateWhenPlayed', label: 'Win (played)' },
];

function isStatField(key: SortKey): key is StatField {
  return STAT_COLUMNS.some((col) => col.key === key);
}

// A stat-column sort must respect the suppression rule just like rendering
// does: a row with no entry for this card sorts exactly like a suppressed
// figure (last in both directions), never as 0.
export function sortRows(
  rows: CardRow[],
  key: SortKey,
  direction: SortDirection,
): CardRow[] {
  const sorted = [...rows];
  if (isStatField(key)) {
    const compare = compareStat(key, direction);
    sorted.sort((a, b) =>
      compare(a.stat ?? { id: a.card.id }, b.stat ?? { id: b.card.id }),
    );
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
