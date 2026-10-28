import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/providers';
import { CardsPageClient } from '../../app/cards/CardsPageClient';
import {
  registerCatalogHandlers,
  registerStatsNotPublished,
} from '../helpers/handlers';

const ORIGIN = 'http://test.local'; // matches NEXT_PUBLIC_CATALOG_ORIGIN set in test/setup.ts

describe('stats-absent card browser', () => {
  it('with the statistics file 404ing, the card table/filters/search/sort still work and show "not published"', async () => {
    registerCatalogHandlers(ORIGIN);
    registerStatsNotPublished(ORIGIN);

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    expect(await screen.findByText('Garbage Addict')).toBeInTheDocument();
    expect(
      screen.getByText('Statistics have not been published yet'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Not published yet').length).toBeGreaterThan(0);

    const user = userEvent.setup();

    // Search still works — client-side, no network involved.
    await user.type(screen.getByLabelText('Search cards'), 'Serene');
    expect(screen.getByText('Serene Yeti')).toBeInTheDocument();
    expect(screen.queryByText('Garbage Addict')).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText('Search cards'));

    // Filters still work.
    await user.selectOptions(screen.getByLabelText('Type'), 'STRATAGEM');
    expect(screen.getByText('Orbital Strike')).toBeInTheDocument();
    expect(screen.queryByText('Garbage Addict')).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Type'), 'all');

    // Sort still works (toggling shouldn't throw, and rows stay present).
    await user.click(screen.getByRole('button', { name: /name/i }));
    expect(screen.getByText('Garbage Addict')).toBeInTheDocument();
  });
});
