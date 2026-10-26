import type { Card, KeywordsResponse } from '../../lib/api/types';
import { resolveAbility } from '../../lib/format/abilities';

interface AbilitiesProps {
  card: Card;
  keywords: KeywordsResponse;
}

// Every key goes through resolveAbility — never inline JSX logic here, and
// never render a raw key like `rummage_on_death` (spec §3.3's named
// correctness bug). Keys with no keyword text share one fallback to the
// card's description, rather than repeating it once per unresolved key.
export function Abilities({ card, keywords }: AbilitiesProps) {
  if (card.abilities.length === 0) {
    return null;
  }

  const resolved = card.abilities.map((key) => resolveAbility(key, keywords));
  const named = resolved.filter((entry) => entry.keyword !== null);
  const hasUnresolved = resolved.some((entry) => entry.keyword === null);

  return (
    <section>
      <h2 className="text-sm font-semibold text-neutral-700">Abilities</h2>
      {named.length > 0 && (
        <ul className="mt-2 space-y-2">
          {named.map((entry) => (
            <li key={entry.key} className="text-sm">
              <span className="font-medium">{entry.keyword!.name}</span>
              <span className="text-neutral-600"> — {entry.keyword!.description}</span>
            </li>
          ))}
        </ul>
      )}
      {hasUnresolved && <p className="mt-2 text-sm text-neutral-600">{card.description}</p>}
    </section>
  );
}
