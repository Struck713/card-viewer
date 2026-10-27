import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/providers';
import { CardsPageClient } from '../../app/cards/CardsPageClient';
import {
  registerCatalogHandlers,
  registerStatsHandlers,
} from '../helpers/handlers';
import { http, HttpResponse } from 'msw';
import { readFixture } from '../helpers/fixtures';
import type { CardStatsResponse } from '../../lib/api/types';
import { server } from '../msw/server';

const ORIGIN = 'http://test.local'; // matches NEXT_PUBLIC_CATALOG_ORIGIN set in test/setup.ts

describe('rate precision wiring', () => {
  it("the card table's rate cells use method.ratePrecision, not a hardcoded decimal count", async () => {
    registerCatalogHandlers(ORIGIN);
    const statsIndex = registerStatsHandlers(ORIGIN);
    const cardStats = readFixture<CardStatsResponse>(
      'data/v1/stats/releases/stats-0.0.0-dev/card-stats.json',
    );
    const twoDecimalStats: CardStatsResponse = {
      ...cardStats,
      method: { ...cardStats.method, ratePrecision: '0.01 percentage points' },
    };
    server.use(
      http.get(`http://test.local${statsIndex.cardStatsUrl}`, () =>
        HttpResponse.json(twoDecimalStats),
      ),
    );

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    // Garbage Addict's drawRate is 0.612 -> 61.2% at 1 decimal (the old
    // hardcoded behavior) but 61.20% at the 2 decimals this method names.
    expect(await screen.findByText('61.20%')).toBeInTheDocument();
    expect(screen.queryByText('61.2%')).not.toBeInTheDocument();
  });
});
