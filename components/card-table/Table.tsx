'use client';

import Link from 'next/link';
import { CardArtPlaceholder } from '../card-art/CardArtPlaceholder';
import { formatRate } from '../../lib/format/rates';
import { factionDisplay } from '../../lib/format/factions';
import { isSuppressed, statValue } from '../../lib/format/suppression';
import { STATIC_COLUMNS, STAT_COLUMNS, type CardRow, type SortDirection, type SortKey } from './columns';

interface TableProps {
  rows: CardRow[];
  // false => stats weren't loaded at all (not published / error); stat
  // cells show that instead of the per-card "no data for this slice" case.
  statsLoaded: boolean;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  // Appended to each row's /cards/[id] link so the current slice/release
  // selection survives navigation (docs/data-layer.md §4.6).
  linkQuery: string;
  // method.ratePrecision from the loaded stats release — undefined when
  // stats aren't loaded, in which case formatRate falls back to one
  // decimal place.
  ratePrecision?: string;
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
    <button type="button" onClick={onClick} className="flex items-center gap-1 font-medium">
      {label}
      {active && <span aria-hidden="true">{direction === 'asc' ? '▲' : '▼'}</span>}
    </button>
  );
}

export function Table({ rows, statsLoaded, sortKey, sortDirection, onSort, linkQuery, ratePrecision }: TableProps) {
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
              <tr key={card.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="py-2 pr-3">
                  <CardArtPlaceholder label={card.name} />
                </td>
                <td className="py-2 pr-3">
                  <Link href={`/cards/${card.id}?${linkQuery}`} className="font-medium hover:underline">
                    {card.name}
                  </Link>
                </td>
                <td className="py-2 pr-3">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${faction.swatchClassName} mr-1 align-middle`}
                    aria-hidden="true"
                  />
                  <span className={faction.textClassName}>{faction.label}</span>
                </td>
                <td className="py-2 pr-3">{card.type}</td>
                <td className="py-2 pr-3">{card.rarity}</td>
                <td className="py-2 pr-3">{card.manaCost}</td>
                {STAT_COLUMNS.map((col) => (
                  <td key={col.key} className="py-2 pr-3 whitespace-nowrap">
                    {!statsLoaded ? (
                      <span className="text-neutral-500">Not published yet</span>
                    ) : !stat ? (
                      <span className="text-neutral-500">No data for this slice</span>
                    ) : isSuppressed(stat, col.key) ? (
                      <span className="text-neutral-500">Not enough data</span>
                    ) : (
                      formatRate(statValue(stat, col.key) as number, ratePrecision)
                    )}
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
