import { http, HttpResponse } from 'msw';
import type {
  CardsResponse,
  CardStatsResponse,
  CatalogIndex,
  DeckStatsResponse,
  KeywordsResponse,
  StatsIndex,
} from '../../lib/api/types';
import { server } from '../msw/server';
import { readFixture } from './fixtures';

export function registerCatalogHandlers(origin: string) {
  const index = readFixture<CatalogIndex>('data/v1/latest.json');
  const cards = readFixture<CardsResponse>(
    'data/v1/releases/0.0.0-dev/cards.json',
  );
  const keywords = readFixture<KeywordsResponse>(
    'data/v1/releases/0.0.0-dev/keywords.json',
  );
  server.use(
    http.get(`${origin}/data/v1/latest.json`, () => HttpResponse.json(index)),
    http.get(`${origin}${index.cardsUrl}`, () => HttpResponse.json(cards)),
    http.get(`${origin}${index.keywordsUrl}`, () =>
      HttpResponse.json(keywords),
    ),
  );
  return index;
}

export function registerStatsNotPublished(origin: string) {
  server.use(
    http.get(`${origin}/data/v1/stats/latest.json`, () =>
      HttpResponse.json({ error: 'not found' }, { status: 404 }),
    ),
  );
}

export function registerStatsHandlers(
  origin: string,
  overrides?: Partial<StatsIndex>,
) {
  const index = {
    ...readFixture<StatsIndex>('data/v1/stats/latest.json'),
    ...overrides,
  };
  const cardStats = readFixture<CardStatsResponse>(
    'data/v1/stats/releases/stats-0.0.0-dev/card-stats.json',
  );
  const deckStats = readFixture<DeckStatsResponse>(
    'data/v1/stats/releases/stats-0.0.0-dev/deck-stats.json',
  );
  server.use(
    http.get(`${origin}/data/v1/stats/latest.json`, () =>
      HttpResponse.json(index),
    ),
    http.get(`${origin}${index.cardStatsUrl}`, () =>
      HttpResponse.json(cardStats),
    ),
    http.get(`${origin}${index.deckStatsUrl}`, () =>
      HttpResponse.json(deckStats),
    ),
  );
  return index;
}
