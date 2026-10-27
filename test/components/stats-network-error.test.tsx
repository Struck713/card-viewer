import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/providers';
import { CardsPageClient } from '../../app/cards/CardsPageClient';
import { registerCatalogHandlers } from '../helpers/handlers';
import { server } from '../msw/server';

const ORIGIN = 'http://test.local'; // matches NEXT_PUBLIC_CATALOG_ORIGIN set in test/setup.ts

describe('stats network error on /cards', () => {
  it('a genuine stats API failure shows a visible error, never silently renders as "not published"', async () => {
    registerCatalogHandlers(ORIGIN);
    server.use(
      http.get(`${ORIGIN}/data/v1/stats/latest.json`, () =>
        HttpResponse.error(),
      ),
    );

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    await screen.findByText('Garbage Addict');
    expect(
      await screen.findByText("Couldn't load statistics"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Statistics have not been published yet'),
    ).not.toBeInTheDocument();
  });
});
