import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { fetchFresh, fetchRevalidated } from '../../lib/api/cache';
import { server } from '../msw/server';

const ORIGIN = 'http://catalog.test';

describe('caching', () => {
  it('fetchRevalidated: sends If-None-Match on reload and reuses the cached body on a 304 without re-parsing it', async () => {
    const url = `${ORIGIN}/data/cards.json`;
    let calls = 0;
    let secondRequestHadEtag: string | null = null;

    server.use(
      http.get(url, ({ request }) => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json(
            { cards: [{ id: 'b_001' }] },
            { headers: { ETag: '"abc123"' } },
          );
        }
        secondRequestHadEtag = request.headers.get('if-none-match');
        // A 304 body is empty; parseAndCache must never be reached for
        // this response, or res.json() on an empty body would throw.
        return new HttpResponse(null, { status: 304 });
      }),
    );

    const first = await fetchRevalidated(url);
    const second = await fetchRevalidated(url);

    expect(calls).toBe(2);
    expect(secondRequestHadEtag).toBe('"abc123"');
    expect(second).toEqual(first);
  });

  it('fetchFresh: refetches every time and stores nothing', async () => {
    // The statistics file sends no ETag and is recomputed continuously, so
    // there is nothing to revalidate against and nothing that may be
    // replayed from storage. This is the guard against anyone
    // reintroducing release-style caching on a live endpoint.
    const url = `${ORIGIN}/data/stats/card-winrates.json`;
    let calls = 0;
    server.use(
      http.get(url, () => {
        calls += 1;
        return HttpResponse.json({ generatedAt: `call-${calls}`, cards: [] });
      }),
    );

    await fetchFresh(url);
    const second = await fetchFresh<{ generatedAt: string }>(url);

    expect(calls).toBe(2);
    expect(second.generatedAt).toBe('call-2');
    expect(
      Object.keys(localStorage).filter((key) => key.includes(url)),
    ).toEqual([]);
  });

  it('prunes the dead release-cache keys a returning visitor still holds', async () => {
    // cache.ts sweeps these on module init, which already ran for this
    // suite — so write one and re-trigger the sweep by re-importing with a
    // fresh module registry.
    localStorage.setItem('cardgame-viewer:release:0.0.0-dev:x', '{}');
    localStorage.setItem(
      'cardgame-viewer:etag:http://catalog.test/data/v1/latest.json',
      '"old"',
    );
    const { resetModules } = await import('vitest').then((m) => m.vi);
    resetModules();
    await import('../../lib/api/cache');

    expect(localStorage.getItem('cardgame-viewer:release:0.0.0-dev:x')).toBe(
      null,
    );
    expect(
      localStorage.getItem(
        'cardgame-viewer:etag:http://catalog.test/data/v1/latest.json',
      ),
    ).toBe(null);
  });
});
