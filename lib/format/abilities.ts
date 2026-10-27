import type { KeywordsResponse } from '../api/types';

export interface ResolvedAbility {
  key: string;
  // Present when the key resolves to a real keyword; null means "no
  // keyword text for this key" and the caller MUST fall back to the
  // card's own description — never render `key` itself (spec §3.3).
  keyword: { name: string; description: string } | null;
}

// Parameterised keys resolve through their base: shielded_1 -> shielded,
// reinforce_4 -> reinforce (spec §3.3).
function baseKey(key: string): string {
  return key.replace(/_\d+$/, '');
}

export function resolveAbility(
  key: string,
  keywords: KeywordsResponse,
): ResolvedAbility {
  const direct = keywords.abilityKeywords[key];
  const keywordId =
    direct !== undefined ? direct : keywords.abilityKeywords[baseKey(key)];
  if (!keywordId) {
    return { key, keyword: null };
  }
  const found = keywords.keywords.find((k) => k.id === keywordId);
  return {
    key,
    keyword: found
      ? { name: found.name, description: found.description }
      : null,
  };
}
