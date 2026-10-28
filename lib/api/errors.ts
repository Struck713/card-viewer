import type {
  Card,
  CardWinrate,
  KeywordsResponse,
  StatsMethodology,
} from './types';

export interface LoadedCatalog {
  cards: Card[];
  cardsById: Map<string, Card>;
  keywords: KeywordsResponse;
}

// What a loaded statistics file is, and the only provenance it carries.
//
// There is no release id, no gameVersion and no catalogVersion: the API
// publishes one unversioned statistics file, so generatedAt is the whole
// of its identity. byId is built once at load time because every consumer
// joins on card id (spec §4.1: fetch once, index by id, filter locally).
export interface LoadedStats {
  generatedAt: string;
  methodology: StatsMethodology;
  cards: CardWinrate[];
  byId: Map<string, CardWinrate>;
}

// Per docs/data-layer.md: every non-2xx is a distinct, named case — never
// collapsed into one generic "failed to load" state.
//
// Both unions are short now because the API is three flat files with no
// index naming any of them. A 404 therefore has exactly one meaning per
// file, and there is no 'inconsistent' case (no index to contradict a
// release file) and no 'schema-mismatch' case (no schemaVersion to gate).
export type CatalogResult =
  | { status: 'ok'; data: LoadedCatalog }
  | { status: 'not-deployed' }
  | { status: 'network-error'; error: unknown };

export type StatsResult =
  | { status: 'ok'; data: LoadedStats }
  // The statistics file 404s. The card browser must stay fully usable in
  // this state — see docs/suppression-and-states.md.
  | { status: 'not-published' }
  | { status: 'network-error'; error: unknown };

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
