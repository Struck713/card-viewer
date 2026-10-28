import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/providers';
import { CardsPageClient } from '../../app/cards/CardsPageClient';
import {
  registerCatalogHandlers,
  registerStatsHandlers,
} from '../helpers/handlers';
import { readFixture } from '../helpers/fixtures';
import type { CardWinratesResponse } from '../../lib/api/types';

const ORIGIN = 'http://test.local'; // matches NEXT_PUBLIC_CATALOG_ORIGIN set in test/setup.ts
const fixture = readFixture<CardWinratesResponse>(
  'data/stats/card-winrates.json',
);

describe('preliminary statistics notice', () => {
  it('appears when the publisher marks the data preliminary', async () => {
    registerCatalogHandlers(ORIGIN);
    registerStatsHandlers(ORIGIN);

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    expect(
      await screen.findByText(/Preliminary statistics/i),
    ).toBeInTheDocument();
  });

  it('reads minSample from the payload rather than hardcoding it', async () => {
    // The whole point of the notice is to state the published threshold,
    // so a hardcoded "1" must fail this.
    registerCatalogHandlers(ORIGIN);
    registerStatsHandlers(ORIGIN, {
      methodology: { ...fixture.methodology, minSample: 25 },
    });

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    await screen.findByText(/Preliminary statistics/i);
    expect(
      screen.getByText(/minimum sample of 25 matches/i),
    ).toBeInTheDocument();
  });

  it('names the modes, since they include AI matches', async () => {
    registerCatalogHandlers(ORIGIN);
    registerStatsHandlers(ORIGIN);

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    await screen.findByText(/Preliminary statistics/i);
    expect(screen.getByText(/ranked_ai/)).toBeInTheDocument();
  });

  it('is absent when the data is not marked preliminary', async () => {
    registerCatalogHandlers(ORIGIN);
    registerStatsHandlers(ORIGIN, {
      methodology: { ...fixture.methodology, preliminary: false },
    });

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    await screen.findByText('Garbage Addict');
    expect(screen.queryByText(/Preliminary statistics/i)).toBeNull();
  });
});
