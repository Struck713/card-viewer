import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/providers';
import { CardsPageClient } from '../../app/cards/CardsPageClient';
import {
  registerCatalogHandlers,
  registerStatsReleaseHandlers,
  registerStatsReleaseMissing,
} from '../helpers/handlers';
import { setSearchParams } from '../helpers/navigation';

const ORIGIN = 'http://test.local'; // matches NEXT_PUBLIC_CATALOG_ORIGIN set in test/setup.ts
const PINNED = 'stats-0.0.0-dev-r2';

// b_001's drawRate differs sharply between the two fixture releases:
// latest (stats-0.0.0-dev) has 0.612, r2 has 0.233. So the rendered
// percentage alone proves which release was actually loaded.
const LATEST_DRAW_RATE = '61.2%';
const PINNED_DRAW_RATE = '23.3%';

describe('?stats= release pinning', () => {
  it('renders the pinned release, not latest', async () => {
    registerCatalogHandlers(ORIGIN);
    registerStatsReleaseHandlers(ORIGIN, PINNED);
    setSearchParams({ stats: PINNED, catalog: '0.0.0-dev' });

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    // No handler for stats/latest.json is registered at all, so with
    // onUnhandledFrame: 'error' this would also fail if the pin were
    // ignored and "latest" fetched instead.
    expect(await screen.findByText(PINNED_DRAW_RATE)).toBeInTheDocument();
    expect(screen.queryByText(LATEST_DRAW_RATE)).not.toBeInTheDocument();
  });

  it('says the view is pinned and offers a way back to latest', async () => {
    registerCatalogHandlers(ORIGIN);
    registerStatsReleaseHandlers(ORIGIN, PINNED);
    setSearchParams({ stats: PINNED, catalog: '0.0.0-dev' });

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    // Showing a possibly-stale release silently is the bug ?stats= exists
    // to prevent, so the pin has to be visible.
    expect(
      await screen.findByText(new RegExp(`Pinned to stats release ${PINNED}`)),
    ).toBeInTheDocument();
    const back = screen.getByRole('link', { name: 'View the latest release' });
    expect(back).toHaveAttribute('href', '/cards?tier=mid&match=ranked');
  });

  it('says so when the link did not declare which catalog release it describes', async () => {
    registerCatalogHandlers(ORIGIN);
    registerStatsReleaseHandlers(ORIGIN, PINNED);
    setSearchParams({ stats: PINNED }); // no ?catalog=

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    // "Unknown" must not be rendered as agreement — a release file
    // carries no catalogVersion, so there is nothing to compare.
    expect(
      await screen.findByText(/catalog release these pinned statistics/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/not the .* release being browsed/)).toBeNull();
  });

  it('a pinned release that does not exist reads as a bad link, not as "no statistics yet"', async () => {
    registerCatalogHandlers(ORIGIN);
    registerStatsReleaseMissing(ORIGIN, 'stats-gone');
    setSearchParams({ stats: 'stats-gone' });

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    expect(
      await screen.findByText("That statistics release doesn't exist"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Statistics have not been published yet'),
    ).not.toBeInTheDocument();
    // The card browser still works regardless.
    expect(screen.getByText('Garbage Addict')).toBeInTheDocument();
  });

  it('carries the pin into per-card links so it survives navigation', async () => {
    registerCatalogHandlers(ORIGIN);
    registerStatsReleaseHandlers(ORIGIN, PINNED);
    setSearchParams({ stats: PINNED, catalog: '0.0.0-dev' });

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    const cardLink = await screen.findByRole('link', {
      name: /Garbage Addict/,
    });
    expect(cardLink.getAttribute('href')).toContain(`stats=${PINNED}`);
    expect(cardLink.getAttribute('href')).toContain('catalog=0.0.0-dev');
  });
});
