import type { CardWinrate } from '../../lib/api/types';
import { formatRate, formatRecord } from '../../lib/format/rates';
import { isSuppressed, winRateValue } from '../../lib/format/suppression';

// One row per figure, always — a suppressed win rate gets an explicit
// "not enough data" row rather than being omitted
// (docs/pages-and-components.md).
//
// Matches and the win–loss record are plain counts with no suppressed
// state: "0" and "0–0" are real facts meaning the card was in no games.
export function StatRows({ stat }: { stat: CardWinrate }) {
  const suppressed = isSuppressed(stat);
  return (
    <table className="w-full text-sm">
      <tbody>
        <tr className="border-b border-neutral-100">
          <th
            scope="row"
            className="py-1.5 pr-4 text-left font-normal text-neutral-600"
          >
            Matches
          </th>
          <td className="py-1.5 text-right font-medium">{stat.matches}</td>
        </tr>
        <tr className="border-b border-neutral-100">
          <th
            scope="row"
            className="py-1.5 pr-4 text-left font-normal text-neutral-600"
          >
            Record (W–L)
          </th>
          <td className="py-1.5 text-right font-medium">
            {formatRecord(stat.wins, stat.losses)}
          </td>
        </tr>
        <tr>
          <th
            scope="row"
            className="py-1.5 pr-4 text-left font-normal text-neutral-600"
          >
            Win rate
          </th>
          <td className="py-1.5 text-right">
            {suppressed ? (
              <span className="text-neutral-500">Not enough data</span>
            ) : (
              <span className="font-medium">
                {formatRate(winRateValue(stat) as number)}
              </span>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
