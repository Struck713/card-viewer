'use client';

import Link from 'next/link';
import type { Card, CardWinrate } from '../../lib/api/types';
import { CardArtPlaceholder } from '../card-art/CardArtPlaceholder';
import { formatRate, formatRecord } from '../../lib/format/rates';
import { factionDisplay } from '../../lib/format/factions';
import { isSuppressed, winRateValue } from '../../lib/format/suppression';
import {
  STATIC_COLUMNS,
  STAT_COLUMNS,
  type CardRow,
  type SortDirection,
  type SortKey,
  type StatSortKey,
} from './columns';

interface TableProps {
  rows: CardRow[];
  // false => statistics weren't loaded at all (not published / error);
  // stat cells show that instead of the per-card "no published data" case.
  statsLoaded: boolean;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
}

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 font-medium"
    >
      {label}
      {active && (
        <span aria-hidden="true">{direction === 'asc' ? '▲' : '▼'}</span>
      )}
    </button>
  );
}

// What a stat cell shows, in order of how much we know.
//
// Suppression applies to the win rate alone. A record of "0-0" is a known
// fact (the card was in no games), not a missing one, so the Record column
// still shows it — and a win rate is NEVER rendered as 0 just because it
// is absent: a genuine winRate of 0 means the card lost every game it was
// in, and 59 of 168 cards were in that state when last sampled. See
// lib/format/suppression.ts.
function StatCell({
  columnKey,
  card,
  stat,
  statsLoaded,
}: {
  columnKey: StatSortKey;
  card: Card;
  stat: CardWinrate | undefined;
  statsLoaded: boolean;
}) {
  if (!statsLoaded) {
    return <span className="text-neutral-500">Not published yet</span>;
  }
  if (!stat) {
    return (
      <span className="text-neutral-500" title={`No row for ${card.id}`}>
        No published data
      </span>
    );
  }
  if (columnKey === 'record') {
    return <>{formatRecord(stat.wins, stat.losses)}</>;
  }
  if (isSuppressed(stat)) {
    return <span className="text-neutral-500">Not enough data</span>;
  }
  return <>{formatRate(winRateValue(stat) as number)}</>;
}

export function Table({
  rows,
  statsLoaded,
  sortKey,
  sortDirection,
  onSort,
}: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left">
            <th className="py-2 pr-3" aria-hidden="true" />
            {STATIC_COLUMNS.map((col) => (
              <th key={col.key} className="py-2 pr-3">
                <SortButton
                  label={col.label}
                  active={sortKey === col.key}
                  direction={sortDirection}
                  onClick={() => onSort(col.key)}
                />
              </th>
            ))}
            {STAT_COLUMNS.map((col) => (
              <th key={col.key} className="py-2 pr-3">
                <SortButton
                  label={col.label}
                  active={sortKey === col.key}
                  direction={sortDirection}
                  onClick={() => onSort(col.key)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ card, stat }) => {
            const faction = factionDisplay(card.color);
            return (
              <tr
                key={card.id}
                className="border-b border-neutral-100 hover:bg-neutral-50"
              >
                <td className="py-2 pr-3">
                  <CardArtPlaceholder label={card.name} />
                </td>
                <td className="py-2 pr-3">
                  <Link
                    href={`/cards/${card.id}`}
                    className="font-medium hover:underline"
                  >
                    {card.name}
                  </Link>
                </td>
                <td className="py-2 pr-3">
                  <span className="flex items-center gap-1">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${faction.swatchClassName}`}
                      aria-hidden="true"
                    />
                    <span className={faction.textClassName}>
                      {faction.label}
                    </span>
                  </span>
                </td>
                <td className="py-2 pr-3">{card.type}</td>
                <td className="py-2 pr-3">{card.rarity}</td>
                <td className="py-2 pr-3">{card.manaCost}</td>
                {STAT_COLUMNS.map((col) => (
                  <td key={col.key} className="py-2 pr-3 whitespace-nowrap">
                    <StatCell
                      columnKey={col.key}
                      card={card}
                      stat={stat}
                      statsLoaded={statsLoaded}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
