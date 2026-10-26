import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/providers';
import { ProvenanceBar } from '../../components/provenance/ProvenanceBar';
import type { CardsResponse, KeywordsResponse } from '../../lib/api/types';
import { readFixture } from '../helpers/fixtures';
import { registerCatalogHandlers, registerStatsHandlers } from '../helpers/handlers';
import { server } from '../msw/server';

const ORIGIN = 'http://test.local'; // matches NEXT_PUBLIC_CATALOG_ORIGIN set in test/setup.ts

describe('provenance mismatch', () => {
  it('when stats.catalogVersion differs from the loaded catalog, a visible mismatch notice appears', async () => {
    registerCatalogHandlers(ORIGIN); // catalogVersion: 0.0.0-dev
    registerStatsHandlers(ORIGIN, { catalogVersion: '0.1.0-other' });

    // useStats() also calls loadCatalogRelease for the stats index's named
    // version — it needs its own cards/keywords to resolve cleanly, or the
    // 404 would surface as 'inconsistent' instead of a clean mismatch.
    const cards = readFixture<CardsResponse>('data/v1/releases/0.0.0-dev/cards.json');
    const keywords = readFixture<KeywordsResponse>('data/v1/releases/0.0.0-dev/keywords.json');
    server.use(
      http.get(`${ORIGIN}/data/v1/releases/0.1.0-other/cards.json`, () => HttpResponse.json(cards)),
      http.get(`${ORIGIN}/data/v1/releases/0.1.0-other/keywords.json`, () => HttpResponse.json(keywords)),
    );

    render(
      <AppProviders>
        <ProvenanceBar />
      </AppProviders>,
    );

    expect(await screen.findByText(/Catalog version:/)).toBeInTheDocument();
    expect(
      await screen.findByText(/Statistics describe catalog 0\.1\.0-other, not the 0\.0\.0-dev release being browsed\./),
    ).toBeInTheDocument();
  });
});
