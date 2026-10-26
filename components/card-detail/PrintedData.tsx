import type { Card } from '../../lib/api/types';
import { formatAttackHealth } from '../../lib/format/cards';
import { factionDisplay } from '../../lib/format/factions';
import { CardArtPlaceholder } from '../card-art/CardArtPlaceholder';

export function PrintedData({ card }: { card: Card }) {
  const faction = factionDisplay(card.color);

  return (
    <div className="flex gap-4">
      <CardArtPlaceholder size="lg" label={card.name} />
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{card.name}</h1>
        <p className="text-sm text-neutral-600">
          <span
            className={`inline-block h-2 w-2 rounded-full ${faction.swatchClassName} mr-1 align-middle`}
            aria-hidden="true"
          />
          <span className={faction.textClassName}>{faction.label}</span>
          {' · '}
          {card.type}
          {' · '}
          {card.rarity}
          {' · '}
          Cost {card.manaCost}
        </p>
        <p className="text-sm text-neutral-600">
          Attack {formatAttackHealth(card.attack)} / Health {formatAttackHealth(card.health)}
          {card.tribe && (
            <>
              {' · '}
              Tribe: {card.tribe}
            </>
          )}
        </p>
        <p className="text-sm text-neutral-800">{card.description}</p>
      </div>
    </div>
  );
}
