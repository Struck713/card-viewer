import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { loadCatalog } from '../../lib/api/catalog';
import { loadStats } from '../../lib/api/stats';
import {
  registerCatalogHandlers,
  registerCatalogMissing,
  registerStatsHandlers,
  registerStatsNotPublished,
} from '../helpers/handlers';
import { server } from '../msw/server';

const ORIGIN = 'http://test.local';

describe('loadCatalog', () => {
  it('loads the two flat files and indexes the cards by id', async () => {
    registerCatalogHandlers(ORIGIN);
    const result = await loadCatalog(ORIGIN);

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.data.cardsById.get('b_001')?.name).toBe('Garbage Addict');
    expect(result.data.keywords.abilityKeywords.rummage_on_death).toBe(null);
  });

  it('a 404 means the catalog is not deployed at this origin', async () => {
    registerCatalogMissing(ORIGIN);
    expect((await loadCatalog(ORIGIN)).status).toBe('not-deployed');
  });

  it('rejects valid JSON of the wrong shape rather than passing it to the UI', async () => {
    // No payload carries a version field, so a breaking change arrives
    // unannounced — this shape assertion is the only warning there is.
    server.use(
      http.get(`${ORIGIN}/data/cards.json`, () =>
        HttpResponse.json({ items: [] }),
      ),
      http.get(`${ORIGIN}/data/keywords.json`, () =>
        HttpResponse.json({ keywords: [] }),
      ),
    );
    expect((await loadCatalog(ORIGIN)).status).toBe('network-error');
  });

  it('a 500 is a network error, never conflated with "not deployed"', async () => {
    server.use(
      http.get(`${ORIGIN}/data/cards.json`, () =>
        HttpResponse.text('', { status: 500 }),
      ),
      http.get(`${ORIGIN}/data/keywords.json`, () =>
        HttpResponse.json({ keywords: [] }),
      ),
    );
    expect((await loadCatalog(ORIGIN)).status).toBe('network-error');
  });

  it('a non-JSON 200 body is a network error, not a crash', async () => {
    server.use(
      http.get(`${ORIGIN}/data/cards.json`, () =>
        HttpResponse.text('not json'),
      ),
      http.get(`${ORIGIN}/data/keywords.json`, () =>
        HttpResponse.json({ keywords: [] }),
      ),
    );
    expect((await loadCatalog(ORIGIN)).status).toBe('network-error');
  });
});

describe('loadStats', () => {
  it('loads the flat win-rate table and indexes it by card id', async () => {
    registerStatsHandlers(ORIGIN);
    const result = await loadStats(ORIGIN);

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.data.byId.get('b_001')?.winRate).toBe(0.75);
    // Preserved exactly as published: null is suppression, 0 is a real 0%.
    expect(result.data.byId.get('t_019')?.winRate).toBe(null);
    expect(result.data.byId.get('gen_str_001')?.winRate).toBe(0);
    expect(result.data.methodology.minSample).toBe(1);
    expect(result.data.generatedAt).toBe('2026-10-28T03:11:27.525Z');
  });

  it('a 404 means statistics are not published', async () => {
    registerStatsNotPublished(ORIGIN);
    expect((await loadStats(ORIGIN)).status).toBe('not-published');
  });

  it('rejects valid JSON of the wrong shape', async () => {
    server.use(
      http.get(`${ORIGIN}/data/stats/card-winrates.json`, () =>
        HttpResponse.json({ generatedAt: 'x' }),
      ),
    );
    expect((await loadStats(ORIGIN)).status).toBe('network-error');
  });

  it('a 500 is a network error, never conflated with "not published"', async () => {
    server.use(
      http.get(`${ORIGIN}/data/stats/card-winrates.json`, () =>
        HttpResponse.text('', { status: 500 }),
      ),
    );
    expect((await loadStats(ORIGIN)).status).toBe('network-error');
  });

  it('a non-JSON 200 body is a network error, not a crash', async () => {
    server.use(
      http.get(`${ORIGIN}/data/stats/card-winrates.json`, () =>
        HttpResponse.text('not json'),
      ),
    );
    expect((await loadStats(ORIGIN)).status).toBe('network-error');
  });
});
