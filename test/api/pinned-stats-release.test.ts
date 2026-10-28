import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { loadStatsRelease } from '../../lib/api/stats';
import {
  registerStatsReleaseHandlers,
  registerStatsReleaseMissing,
} from '../helpers/handlers';
import { server } from '../msw/server';

const ORIGIN = 'http://test.local'; // matches NEXT_PUBLIC_CATALOG_ORIGIN set in test/setup.ts
const PINNED = 'stats-0.0.0-dev-r2';

describe('loadStatsRelease (?stats= pinning)', () => {
  it('loads a release by id, without reading stats/latest.json', async () => {
    // No stats/latest.json handler is registered: with
    // onUnhandledFrame: 'error', touching it at all would fail this test.
    registerStatsReleaseHandlers(ORIGIN, PINNED);

    const result = await loadStatsRelease(ORIGIN, PINNED, '0.0.0-dev');

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.data.provenance).toEqual({
      releaseId: PINNED,
      gameVersion: 'dev',
      catalogVersion: '0.0.0-dev',
      pinned: true,
    });
    expect(result.data.cardStats.releaseId).toBe(PINNED);
  });

  it('reports an unknown catalogVersion as null rather than guessing', async () => {
    registerStatsReleaseHandlers(ORIGIN, PINNED);

    const result = await loadStatsRelease(ORIGIN, PINNED, null);

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    // Must stay null: a release file carries no catalogVersion, and
    // defaulting it to the browsed release would silently claim a match
    // nobody verified.
    expect(result.data.provenance.catalogVersion).toBeNull();
  });

  it('maps a 404 to pinned-not-found — not not-published, not inconsistent', async () => {
    registerStatsReleaseMissing(ORIGIN, 'stats-does-not-exist');

    const result = await loadStatsRelease(ORIGIN, 'stats-does-not-exist', null);

    // "This link names a release that isn't there" is a different fact
    // from "no statistics exist yet" and from "an index named a file that
    // 404s", and all three must stay distinguishable.
    expect(result).toEqual({
      status: 'pinned-not-found',
      releaseId: 'stats-does-not-exist',
    });
  });

  it('gates on the release file schemaVersion, since no index gates it', async () => {
    const base = `${ORIGIN}/data/v1/stats/releases/${PINNED}`;
    const future = { schemaVersion: 2, releaseId: PINNED, gameVersion: 'dev' };
    server.use(
      http.get(`${base}/card-stats.json`, () => HttpResponse.json(future)),
      http.get(`${base}/deck-stats.json`, () => HttpResponse.json(future)),
    );

    const result = await loadStatsRelease(ORIGIN, PINNED, null);

    // Without this, ?stats= would be a way around the schema gate.
    expect(result).toEqual({ status: 'schema-mismatch', got: 2 });
  });

  it('percent-encodes the release id, which comes from the URL', async () => {
    let requested = '';
    server.use(
      http.get(`${ORIGIN}/data/v1/stats/releases/*`, ({ request }) => {
        requested = new URL(request.url).pathname;
        return HttpResponse.json({ error: 'not found' }, { status: 404 });
      }),
    );

    await loadStatsRelease(ORIGIN, 'a/../b', null);

    expect(requested).toContain('a%2F..%2Fb');
  });
});
