import type { Card, CardStatsResponse, CatalogIndex, DeckStatsResponse, KeywordsResponse, StatsIndex } from './types';

export interface LoadedCatalog {
  index: CatalogIndex;
  cards: Card[];
  cardsById: Map<string, Card>;
  keywords: KeywordsResponse;
}

export interface LoadedStats {
  index: StatsIndex;
  cardStats: CardStatsResponse;
  deckStats: DeckStatsResponse;
}

// Per docs/data-layer.md: every non-2xx is a distinct, named case — never
// collapsed into one generic "failed to load" state.
export type CatalogResult =
  | { status: 'ok'; data: LoadedCatalog }
  | { status: 'not-deployed' }
  | { status: 'schema-mismatch'; got: number }
  | { status: 'inconsistent'; url: string }
  | { status: 'network-error'; error: unknown };

export type StatsResult =
  | { status: 'ok'; data: LoadedStats }
  | { status: 'not-published' }
  | { status: 'schema-mismatch'; got: number }
  | { status: 'inconsistent'; url: string }
  | { status: 'network-error'; error: unknown };

export class SchemaMismatchError extends Error {
  constructor(public readonly got: number) {
    super(`unsupported schemaVersion: ${got}`);
  }
}

// Thrown by fetchJson for any non-2xx response. Callers map this into the
// result unions above rather than letting it propagate as a thrown
// string/generic Error.
export class HttpError extends Error {
  constructor(
    public readonly url: string,
    public readonly status: number,
  ) {
    super(`${status} from ${url}`);
  }
}

// Transient/environment issue: the fetch itself failed, or the body wasn't
// parseable JSON. Maps to the 'network-error' result case — retry, don't cache.
export class NetworkError extends Error {
  constructor(
    public readonly url: string,
    public readonly cause: unknown,
  ) {
    super(`network error fetching ${url}`);
  }
}
