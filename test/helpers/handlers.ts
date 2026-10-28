import { http, HttpResponse } from 'msw';
import type {
  CardsResponse,
  CardWinratesResponse,
  KeywordsResponse,
} from '../../lib/api/types';
import { server } from '../msw/server';
import { readFixture } from './fixtures';

const notFound = () =>
  HttpResponse.json({ error: 'not found' }, { status: 404 });

// Three flat files at fixed paths, so there is no index to return and no
// URL to resolve — the handlers are registered at the same literal paths
// lib/api/ builds. Combined with server.listen({ onUnhandledFrame:
// 'error' }), that means any stray fetch of a /data/v1/... path fails the
// suite on its own.
export function registerCatalogHandlers(origin: string) {
  const cards = readFixture<CardsResponse>('data/cards.json');
  const keywords = readFixture<KeywordsResponse>('data/keywords.json');
  server.use(
    http.get(`${origin}/data/cards.json`, () => HttpResponse.json(cards)),
    http.get(`${origin}/data/keywords.json`, () => HttpResponse.json(keywords)),
  );
  return { cards, keywords };
}

export function registerCatalogMissing(origin: string) {
  server.use(
    http.get(`${origin}/data/cards.json`, notFound),
    http.get(`${origin}/data/keywords.json`, notFound),
  );
}

export function registerStatsNotPublished(origin: string) {
  server.use(http.get(`${origin}/data/stats/card-winrates.json`, notFound));
}

// `overrides` is how a test flips methodology.preliminary or swaps the
// card rows, since there is no second release file to point at any more.
export function registerStatsHandlers(
  origin: string,
  overrides?: Partial<CardWinratesResponse>,
) {
  const stats: CardWinratesResponse = {
    ...readFixture<CardWinratesResponse>('data/stats/card-winrates.json'),
    ...overrides,
  };
  server.use(
    http.get(`${origin}/data/stats/card-winrates.json`, () =>
      HttpResponse.json(stats),
    ),
  );
  return stats;
}
