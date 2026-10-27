import type { CardStat } from '../../lib/api/types';
import { formatRate } from '../../lib/format/rates';
import {
  isSuppressed,
  statValue,
  type StatField,
} from '../../lib/format/suppression';

const ROWS: {
  field: StatField;
  label: string;
  sampleKey?: keyof NonNullable<CardStat['n']>;
}[] = [
  { field: 'drawRate', label: 'Draw rate', sampleKey: 'drawn' },
  { field: 'keepRate', label: 'Keep rate', sampleKey: 'kept' },
  { field: 'playRate', label: 'Play rate', sampleKey: 'played' },
  {
    field: 'winRateWhenDrawn',
    label: 'Win rate when drawn',
    sampleKey: 'drawn',
  },
  { field: 'winRateWhenKept', label: 'Win rate when kept', sampleKey: 'kept' },
  {
    field: 'winRateWhenPlayed',
    label: 'Win rate when played',
    sampleKey: 'played',
  },
];

// One row per figure, always — a suppressed figure gets an explicit "not
// enough data" row rather than being omitted (docs/pages-and-components.md).
export function StatRows({
  stat,
  ratePrecision,
}: {
  stat: CardStat;
  ratePrecision?: string;
}) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {ROWS.map(({ field, label, sampleKey }) => {
          const suppressed = isSuppressed(stat, field);
          const value = statValue(stat, field);
          const sample = sampleKey ? stat.n?.[sampleKey] : undefined;

          return (
            <tr
              key={field}
              className="border-b border-neutral-100 last:border-0"
            >
              <th
                scope="row"
                className="py-1.5 pr-4 text-left font-normal text-neutral-600"
              >
                {label}
              </th>
              <td className="py-1.5 text-right">
                {suppressed ? (
                  <span className="text-neutral-500">Not enough data</span>
                ) : (
                  <>
                    <span className="font-medium">
                      {formatRate(value as number, ratePrecision)}
                    </span>
                    {sample !== undefined && (
                      <span className="ml-2 text-xs text-neutral-500">
                        n≈{sample}
                      </span>
                    )}
                  </>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
