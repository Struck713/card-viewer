import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { fetchIndexFile, fetchReleaseFile } from '../../lib/api/cache';
import { server } from '../msw/server';

const ORIGIN = 'http://catalog.test';

describe('caching', () => {
  it('fetchReleaseFile: a second load of the same release id makes zero extra fetches', async () => {
    const url = `${ORIGIN}/data/v1/releases/0.0.0-dev/cards.json`;
    let calls = 0;
    server.use(
      http.get(url, () => {
        calls += 1;
        return HttpResponse.json({ cards: [] });
      }),
    );

    const first = await fetchReleaseFile(url, '0.0.0-dev');
    const second = await fetchReleaseFile(url, '0.0.0-dev');

    expect(second).toEqual(first);
    expect(calls).toBe(1);
  });

  it('fetchIndexFile: sends If-None-Match on reload and reuses the cached body on a 304 without re-parsing it', async () => {
    const url = `${ORIGIN}/data/v1/latest.json`;
    let calls = 0;
    let secondRequestHadEtag: string | null = null;

    server.use(
      http.get(url, ({ request }) => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json({ schemaVersion: 1, catalogVersion: 'x' }, { headers: { ETag: '"abc123"' } });
        }
        secondRequestHadEtag = request.headers.get('if-none-match');
        // A 304 body is empty; parseAndCacheIndex must never be reached for
        // this response, or res.json() on an empty body would throw.
        return new HttpResponse(null, { status: 304 });
      }),
    );

    const first = await fetchIndexFile(url);
    const second = await fetchIndexFile(url);

    expect(calls).toBe(2);
    expect(secondRequestHadEtag).toBe('"abc123"');
    expect(second).toEqual(first);
  });
});
