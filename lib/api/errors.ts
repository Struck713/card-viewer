import type {
  Card,
  CardStatsResponse,
  CatalogIndex,
  DeckStatsResponse,
  KeywordsResponse,
} from './types';

export interface LoadedCatalog {
  index: CatalogIndex;
  cards: Card[];
  cardsById: Map<string, Card>;
  keywords: KeywordsResponse;
}

// Where a loaded stats release came from, and what it describes.
//
// This is deliberately NOT StatsIndex: a release pinned by id via
// ?stats=<releaseId> is fetched without reading stats/latest.json, and
// CardStatsResponse carries no catalogVersion of its own (see types.ts) —
// so for a pinned link the catalog release the figures describe is only
// known if the link also said so via ?catalog=<version>. `null` means
// "unknown", which must never be collapsed into "matches what we're
// browsing"; that would be the same false-confidence bug as rendering a
// suppressed stat as 0.
export interface StatsProvenance {
  releaseId: string;
  gameVersion: string;
  catalogVersion: string | null;
  // True when this release was named by a link rather than by
  // stats/latest.json, i.e. it may not be the current release.
  pinned: boolean;
}

export interface LoadedStats {
  provenance: StatsProvenance;
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
  // A link pinned a stats release that doesn't exist. Distinct from
  // 'not-published' (no stats program at all) and from 'inconsistent' (an
  // index named a file that 404s, which is an API bug): this one is just a
  // bad or expired link, and only the user's URL can fix it.
  | { status: 'pinned-not-found'; releaseId: string }
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
