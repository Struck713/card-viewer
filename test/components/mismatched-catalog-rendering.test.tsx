import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/providers';
import { CardsPageClient } from '../../app/cards/CardsPageClient';
import type { CardsResponse, KeywordsResponse } from '../../lib/api/types';
import { readFixture } from '../helpers/fixtures';
import {
  registerCatalogHandlers,
  registerStatsHandlers,
} from '../helpers/handlers';
import { server } from '../msw/server';

const ORIGIN = 'http://test.local'; // matches NEXT_PUBLIC_CATALOG_ORIGIN set in test/setup.ts

// Serves catalog release 0.1.0-other with b_001 renamed, so which release
// the page rendered from is visible in the output.
function registerOtherCatalogRelease(renamedTo: string) {
  const cards = readFixture<CardsResponse>(
    'data/v1/releases/0.0.0-dev/cards.json',
  );
  const keywords = readFixture<KeywordsResponse>(
    'data/v1/releases/0.0.0-dev/keywords.json',
  );
  const renamed: CardsResponse = {
    ...cards,
    catalogVersion: '0.1.0-other',
    cards: cards.cards.map((card) =>
      card.id === 'b_001' ? { ...card, name: renamedTo } : card,
    ),
  };
  server.use(
    http.get(`${ORIGIN}/data/v1/releases/0.1.0-other/cards.json`, () =>
      HttpResponse.json(renamed),
    ),
    http.get(`${ORIGIN}/data/v1/releases/0.1.0-other/keywords.json`, () =>
      HttpResponse.json(keywords),
    ),
  );
}

describe('mismatched catalog/stats versions', () => {
  it('renders card data from the release the statistics describe, not from latest', async () => {
    registerCatalogHandlers(ORIGIN); // catalogVersion: 0.0.0-dev, b_001 = "Garbage Addict"
    registerStatsHandlers(ORIGIN, { catalogVersion: '0.1.0-other' });
    registerOtherCatalogRelease('Refuse Enthusiast');

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    // docs/data-contract.md rule #3: when the stats index names a
    // different catalog release, names and costs beside the statistics
    // come from THAT release. Showing latest's name next to the stats
    // would be the bug the mismatch notice used to merely apologise for.
    expect(await screen.findByText('Refuse Enthusiast')).toBeInTheDocument();
    expect(screen.queryByText('Garbage Addict')).not.toBeInTheDocument();

    // The notice is still shown — substituting the data doesn't make the
    // discrepancy something to hide.
    expect(
      screen.getByText(
        /Statistics describe catalog 0\.1\.0-other, not the 0\.0\.0-dev release being browsed\./,
      ),
    ).toBeInTheDocument();
  });

  it('falls back to the browsed release, visibly, when the stats-named release cannot be loaded', async () => {
    registerCatalogHandlers(ORIGIN);
    registerStatsHandlers(ORIGIN, { catalogVersion: '0.1.0-other' });
    const missing = () =>
      HttpResponse.json({ error: 'not found' }, { status: 404 });
    server.use(
      http.get(`${ORIGIN}/data/v1/releases/0.1.0-other/cards.json`, missing),
      http.get(`${ORIGIN}/data/v1/releases/0.1.0-other/keywords.json`, missing),
    );

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    // The browser keeps working on latest's data rather than going blank...
    expect(await screen.findByText('Garbage Addict')).toBeInTheDocument();
    // ...but the fallback is stated, not silent.
    expect(
      await screen.findByText(
        /Could not verify the catalog release the statistics describe/,
      ),
    ).toBeInTheDocument();
  });
});
