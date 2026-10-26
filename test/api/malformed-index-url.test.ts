import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { loadCatalog } from '../../lib/api/catalog';
import { loadStats } from '../../lib/api/stats';
import { server } from '../msw/server';

const ORIGIN = 'http://catalog.test';

describe('a malformed URL named by an index', () => {
  it('loadCatalog resolves to a result instead of throwing/rejecting when cardsUrl is unparseable', async () => {
    server.use(
      http.get(`${ORIGIN}/data/v1/latest.json`, () =>
        HttpResponse.json({
          schemaVersion: 1,
          catalogVersion: '0.0.0-dev',
          gameVersion: 'dev',
          cardsUrl: 'http://[bad',
          keywordsUrl: '/data/v1/releases/0.0.0-dev/keywords.json',
        }),
      ),
    );

    const result = await loadCatalog(ORIGIN);

    expect(result.status).toBe('inconsistent');
  });

  it('loadStats resolves to a result instead of throwing/rejecting when cardStatsUrl is unparseable', async () => {
    server.use(
      http.get(`${ORIGIN}/data/v1/stats/latest.json`, () =>
        HttpResponse.json({
          schemaVersion: 1,
          releaseId: 'stats-x',
          gameVersion: 'dev',
          catalogVersion: '0.0.0-dev',
          cardStatsUrl: 'http://[bad',
          deckStatsUrl: '/data/v1/stats/releases/stats-x/deck-stats.json',
        }),
      ),
    );

    const result = await loadStats(ORIGIN);

    expect(result.status).toBe('inconsistent');
  });
});
