import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/providers';
import { ProvenanceBar } from '../../components/provenance/ProvenanceBar';
import { registerCatalogHandlers, registerStatsHandlers } from '../helpers/handlers';

const ORIGIN = 'http://test.local'; // matches NEXT_PUBLIC_CATALOG_ORIGIN set in test/setup.ts

describe('stats-named catalog release fetch failure', () => {
  it('is surfaced visibly, not silently dropped, when useStats cannot resolve it', async () => {
    registerCatalogHandlers(ORIGIN); // catalogVersion: 0.0.0-dev
    registerStatsHandlers(ORIGIN, { catalogVersion: '0.1.0-other' });
    // Deliberately no handler for 0.1.0-other's release files — loadCatalogRelease
    // 404s, which useStats's own fetch must not let go unreported.
    const { server } = await import('../msw/server');
    server.use(
      http.get('http://test.local/data/v1/releases/0.1.0-other/cards.json', () =>
        HttpResponse.json({ error: 'not found' }, { status: 404 }),
      ),
    );

    render(
      <AppProviders>
        <ProvenanceBar />
      </AppProviders>,
    );

    expect(await screen.findByText(/Catalog version:/)).toBeInTheDocument();
    expect(
      await screen.findByText(/Could not verify the catalog release the statistics describe/),
    ).toBeInTheDocument();
  });
});
