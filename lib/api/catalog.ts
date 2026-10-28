import { fetchJson } from './http';
import { HttpError, type CatalogResult } from './errors';
import type { Card, CardsResponse, KeywordsResponse } from './types';

function indexCardsById(cards: Card[]): Map<string, Card> {
  const map = new Map<string, Card>();
  for (const card of cards) {
    map.set(card.id, card);
  }
  return map;
}

// The catalog is two flat files at fixed paths — no index hop, no version
// in the path, nothing to resolve. Fetched in parallel; a 404 on either
// means the catalog isn't deployed at this origin at all.
export async function loadCatalog(origin: string): Promise<CatalogResult> {
  let cardsRes: CardsResponse;
  let keywordsRes: KeywordsResponse;
  try {
    [cardsRes, keywordsRes] = await Promise.all([
      fetchJson<CardsResponse>(`${origin}/data/cards.json`),
      fetchJson<KeywordsResponse>(`${origin}/data/keywords.json`),
    ]);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return { status: 'not-deployed' };
    }
    return { status: 'network-error', error };
  }

  // No payload carries a version field, so there is no gate and no warning
  // before a breaking change. Assert the shape instead — see stats.ts.
  if (
    !Array.isArray(cardsRes?.cards) ||
    !Array.isArray(keywordsRes?.keywords)
  ) {
    return {
      status: 'network-error',
      error: new Error('catalog files did not match the expected shape'),
    };
  }

  return {
    status: 'ok',
    data: {
      cards: cardsRes.cards,
      cardsById: indexCardsById(cardsRes.cards),
      keywords: keywordsRes,
    },
  };
}
