import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { loadCatalog } from '../../lib/api/catalog';
import { loadStats } from '../../lib/api/stats';
import type { CatalogIndex, StatsIndex } from '../../lib/api/types';
import { readFixture } from '../helpers/fixtures';
import { server } from '../msw/server';

const ORIGIN = 'http://catalog.test';

describe('schema version gate', () => {
  it('latest.json with schemaVersion !== 1 → schema-mismatch, no further parsing attempted', async () => {
    const mismatch = readFixture<CatalogIndex>('schema-mismatch-latest.json');
    // No handlers registered for cardsUrl/keywordsUrl: if loadCatalog tried
    // to fetch them anyway, MSW's onUnhandledRequest: 'error' setup would
    // turn that into a network-error result and fail this exact match.
    server.use(http.get(`${ORIGIN}/data/v1/latest.json`, () => HttpResponse.json(mismatch)));

    const result = await loadCatalog(ORIGIN);

    expect(result).toEqual({ status: 'schema-mismatch', got: 2 });
  });

  it('stats/latest.json with schemaVersion !== 1 → schema-mismatch, no further parsing attempted', async () => {
    const base = readFixture<StatsIndex>('data/v1/stats/latest.json');
    const mismatch = { ...base, schemaVersion: 2 };
    server.use(http.get(`${ORIGIN}/data/v1/stats/latest.json`, () => HttpResponse.json(mismatch)));

    const result = await loadStats(ORIGIN);

    expect(result).toEqual({ status: 'schema-mismatch', got: 2 });
  });
});
