import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/providers';
import { CardsPageClient } from '../../app/cards/CardsPageClient';
import {
  registerCatalogHandlers,
  registerStatsHandlers,
  registerStatsNotPublished,
} from '../helpers/handlers';

const ORIGIN = 'http://test.local'; // matches NEXT_PUBLIC_CATALOG_ORIGIN set in test/setup.ts

describe('provenance', () => {
  it("shows the payload's generatedAt, with the raw ISO value kept in the markup", async () => {
    const stats = registerStatsHandlers(ORIGIN);
    registerCatalogHandlers(ORIGIN);

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    const time = await screen.findByText(/Data as of/i);
    const el = time.querySelector('time')!;
    expect(el).toHaveAttribute('dateTime', stats.generatedAt);
    // Rendered to the minute, not the second: the origin restamps
    // generatedAt on a ~60s recompute without any figure changing, so
    // seconds would churn visibly for no reason.
    expect(el.textContent).not.toMatch(/\d\d:\d\d:\d\d/);
  });

  it('is not labelled as a release or a publication date', async () => {
    // generatedAt says when the server last recomputed. Presenting it as a
    // release would be inventing an identifier the API does not publish.
    registerCatalogHandlers(ORIGIN);
    registerStatsHandlers(ORIGIN);

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    await screen.findByText(/Data as of/i);
    expect(screen.queryByText(/release/i)).toBeNull();
    expect(screen.queryByText(/published on/i)).toBeNull();
  });

  it('renders nothing when there are no statistics to attribute', async () => {
    registerCatalogHandlers(ORIGIN);
    registerStatsNotPublished(ORIGIN);

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    await screen.findByText('Garbage Addict');
    expect(screen.queryByText(/Data as of/i)).toBeNull();
  });
});
