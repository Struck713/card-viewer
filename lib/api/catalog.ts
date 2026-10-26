import { fetchIndexFile, fetchReleaseFile } from './cache';
import { HttpError, type CatalogResult } from './errors';
import type { Card, CardsResponse, CatalogIndex, KeywordsResponse } from './types';

function indexCardsById(cards: Card[]): Map<string, Card> {
  const map = new Map<string, Card>();
  for (const card of cards) {
    map.set(card.id, card);
  }
  return map;
}

// Shared by loadCatalog and loadCatalogRelease: fetch cardsUrl/keywordsUrl
// (resolved against origin, never string-concatenated) for a given
// catalogVersion, and distinguish "a named release file 404s" (an API
// inconsistency bug) from every other failure.
async function loadCatalogFiles(
  origin: string,
  catalogVersion: string,
  cardsUrl: string,
  keywordsUrl: string,
): Promise<CatalogResult> {
  const cardsUrlAbs = new URL(cardsUrl, origin).toString();
  const keywordsUrlAbs = new URL(keywordsUrl, origin).toString();

  let cardsRes: CardsResponse;
  let keywordsRes: KeywordsResponse;
  try {
    [cardsRes, keywordsRes] = await Promise.all([
      fetchReleaseFile<CardsResponse>(cardsUrlAbs, catalogVersion),
      fetchReleaseFile<KeywordsResponse>(keywordsUrlAbs, catalogVersion),
    ]);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return { status: 'inconsistent', url: error.url };
    }
    return { status: 'network-error', error };
  }

  const index: CatalogIndex = {
    schemaVersion: 1,
    catalogVersion,
    gameVersion: cardsRes.gameVersion,
    cardsUrl,
    keywordsUrl,
  };
  return {
    status: 'ok',
    data: { index, cards: cardsRes.cards, cardsById: indexCardsById(cardsRes.cards), keywords: keywordsRes },
  };
}

export async function loadCatalog(origin: string): Promise<CatalogResult> {
  let index: CatalogIndex;
  try {
    index = await fetchIndexFile<CatalogIndex>(`${origin}/data/v1/latest.json`);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return { status: 'not-deployed' };
    }
    return { status: 'network-error', error };
  }
  if (index.schemaVersion !== 1) {
    return { status: 'schema-mismatch', got: index.schemaVersion };
  }
  return loadCatalogFiles(origin, index.catalogVersion, index.cardsUrl, index.keywordsUrl);
}

// Loads a specific catalog release by version, bypassing latest.json.
// Needed because the stats index can name a catalogVersion different from
// whatever catalog/latest.json currently points at — the spec requires
// loading THAT release, not "latest".
export async function loadCatalogRelease(origin: string, catalogVersion: string): Promise<CatalogResult> {
  return loadCatalogFiles(
    origin,
    catalogVersion,
    `/data/v1/releases/${catalogVersion}/cards.json`,
    `/data/v1/releases/${catalogVersion}/keywords.json`,
  );
}
