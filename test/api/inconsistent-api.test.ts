import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { loadCatalog } from '../../lib/api/catalog';
import type { CatalogIndex, KeywordsResponse } from '../../lib/api/types';
import { readFixture } from '../helpers/fixtures';
import { server } from '../msw/server';

const ORIGIN = 'http://catalog.test';

describe('inconsistent API (a release file named by an index 404s)', () => {
  it('is reported as "inconsistent", distinct from "not-deployed"', async () => {
    const index = readFixture<CatalogIndex>('inconsistent-latest.json');
    const keywords = readFixture<KeywordsResponse>(
      'data/v1/releases/0.0.0-dev/keywords.json',
    );

    server.use(
      http.get(`${ORIGIN}/data/v1/latest.json`, () => HttpResponse.json(index)),
      // The index names a cardsUrl that 404s — the real-world bug this
      // case exists for.
      http.get(`${ORIGIN}${index.cardsUrl}`, () =>
        HttpResponse.json({ error: 'not found' }, { status: 404 }),
      ),
      http.get(`${ORIGIN}${index.keywordsUrl}`, () =>
        HttpResponse.json(keywords),
      ),
    );

    const result = await loadCatalog(ORIGIN);

    expect(result.status).toBe('inconsistent');
    expect(result.status).not.toBe('not-deployed');
    if (result.status === 'inconsistent') {
      expect(result.url).toContain('missing-cards.json');
    }
  });
});
