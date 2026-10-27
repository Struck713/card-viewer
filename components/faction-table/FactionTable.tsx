import { factionDisplay } from '../../lib/format/factions';
import { formatRate } from '../../lib/format/rates';
import type { DeckStat } from '../../lib/api/types';

function factionPairLabel(factions: DeckStat['factions']): string {
  return factions.map((color) => factionDisplay(color).label).join(' / ');
}

// No deck-list affordance — deck-stats.json has no card list, deck code,
// or hash (docs/pages-and-components.md). Just the comparison itself.
export function FactionTable({
  decks,
  ratePrecision,
}: {
  decks: DeckStat[];
  ratePrecision?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left">
            <th className="py-2 pr-4 font-medium">Faction(s)</th>
            <th className="py-2 pr-4 font-medium">Win rate</th>
            <th className="py-2 pr-4 font-medium">Matches</th>
          </tr>
        </thead>
        <tbody>
          {decks.map((deck) => (
            <tr
              key={factionPairLabel(deck.factions)}
              className="border-b border-neutral-100"
            >
              <td className="py-2 pr-4">
                <span className="flex items-center gap-2">
                  {deck.factions.map((color) => {
                    const faction = factionDisplay(color);
                    return (
                      <span key={color} className="flex items-center gap-1">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${faction.swatchClassName}`}
                          aria-hidden="true"
                        />
                        <span className={faction.textClassName}>
                          {faction.label}
                        </span>
                      </span>
                    );
                  })}
                </span>
              </td>
              <td className="py-2 pr-4">
                {deck.winRate === undefined ? (
                  <span className="text-neutral-500">Not enough data</span>
                ) : (
                  formatRate(deck.winRate, ratePrecision)
                )}
              </td>
              <td className="py-2 pr-4">
                {deck.matches === undefined ? (
                  <span className="text-neutral-500">Not enough data</span>
                ) : (
                  deck.matches
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
