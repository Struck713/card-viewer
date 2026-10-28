import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { loadCatalog } from '../../lib/api/catalog';
import { loadStats } from '../../lib/api/stats';
import { pruneLegacyStorage } from '../../lib/api/legacy-storage';
import { server } from '../msw/server';

const ORIGIN = 'http://catalog.test';

describe('no caching', () => {
  it('sends no If-None-Match and never writes to localStorage', async () => {
    const seenIfNoneMatch: Array<string | null> = [];
    let calls = 0;
    server.use(
      http.get(`${ORIGIN}/data/cards.json`, ({ request }) => {
        calls += 1;
        seenIfNoneMatch.push(request.headers.get('if-none-match'));
        return HttpResponse.json(
          { cards: [{ id: 'b_001' }] },
          { headers: { ETag: '"abc123"' } },
        );
      }),
      http.get(`${ORIGIN}/data/keywords.json`, () =>
        HttpResponse.json({ keywords: [] }),
      ),
    );

    await loadCatalog(ORIGIN);
    await loadCatalog(ORIGIN);

    expect(calls).toBe(2);
    expect(seenIfNoneMatch).toEqual([null, null]);
    expect(Object.keys(localStorage)).toEqual([]);
  });

  it('refetches the statistics on every call', async () => {
    let calls = 0;
    server.use(
      http.get(`${ORIGIN}/data/stats/card-winrates.json`, () => {
        calls += 1;
        return HttpResponse.json({ generatedAt: `call-${calls}`, cards: [] });
      }),
    );

    const first = await loadStats(ORIGIN);
    const second = await loadStats(ORIGIN);

    expect(calls).toBe(2);
    if (first.status !== 'ok' || second.status !== 'ok') {
      throw new Error('expected ok');
    }
    expect(second.data.generatedAt).toBe('call-2');
    expect(second.data.generatedAt).not.toBe(first.data.generatedAt);
  });

  it('a 304 is never provoked, so a stored body cannot be replayed', async () => {
    let calls = 0;
    server.use(
      http.get(`${ORIGIN}/data/cards.json`, () => {
        calls += 1;
        return HttpResponse.json({ cards: [] }, { headers: { ETag: '"abc123"' } });
      }),
      http.get(`${ORIGIN}/data/keywords.json`, () =>
        HttpResponse.json({ keywords: [] }),
      ),
    );

    await loadCatalog(ORIGIN);
    const second = await loadCatalog(ORIGIN);

    expect(calls).toBe(2);
    expect(second.status).toBe('ok');
  });

  it('prunes the dead keys a returning visitor still holds', () => {
    localStorage.setItem('cardgame-viewer:release:0.0.0-dev:x', '{}');
    localStorage.setItem(
      'cardgame-viewer:etag:http://catalog.test/data/cards.json',
      '"old"',
    );
    localStorage.setItem(
      'cardgame-viewer:body:http://catalog.test/data/cards.json',
      '{}',
    );
    localStorage.setItem(
      'some-other-app:etag:http://catalog.test/data/v1/latest.json',
      '"old"',
    );

    pruneLegacyStorage();

    expect(Object.keys(localStorage)).toEqual([]);
  });
});
