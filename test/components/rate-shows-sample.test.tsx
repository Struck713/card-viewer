import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/providers';
import { CardsPageClient } from '../../app/cards/CardsPageClient';
import { CardDetailPageClient } from '../../app/cards/[id]/CardDetailPageClient';
import { STAT_COLUMNS } from '../../components/card-table/columns';
import {
  registerCatalogHandlers,
  registerStatsHandlers,
} from '../helpers/handlers';

const ORIGIN = 'http://test.local'; // matches NEXT_PUBLIC_CATALOG_ORIGIN set in test/setup.ts

// The owner's call is that a 100% win rate from a single match is fine to
// publish rather than hide (spec §8 question 3) — which is only honest
// because the sample sits right beside it. So "a rate never appears without
// its record" is a hard requirement, and these are the tests that keep it
// from being quietly undone by a later layout change.
describe('a win rate is never shown without its sample', () => {
  it('the card table pairs a Record column with the Win % column', () => {
    expect(STAT_COLUMNS.map((col) => col.key)).toEqual(['record', 'winRate']);
  });

  it('every rendered rate has a record in the same row', async () => {
    registerCatalogHandlers(ORIGIN);
    registerStatsHandlers(ORIGIN);

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );
    await screen.findByText('Garbage Addict');

    const body = screen.getAllByRole('rowgroup')[1];
    const rows = within(body).getAllByRole('row');
    expect(rows).toHaveLength(3);

    for (const row of rows) {
      const cells = within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent ?? '');
      const [record, winRate] = cells.slice(-2);
      if (winRate.endsWith('%')) {
        // A record is "W–L"; a rate without one would leave this blank.
        expect(record).toMatch(/^\d+–\d+$/);
      }
    }
  });

  it('a 100% rate from a single match shows that it was a single match', async () => {
    registerCatalogHandlers(ORIGIN);
    registerStatsHandlers(ORIGIN, {
      cards: [{ id: 'b_001', matches: 1, wins: 1, losses: 0, winRate: 1 }],
    });

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );
    const name = await screen.findByText('Garbage Addict');
    const row = name.closest('tr')!;

    expect(within(row).getByText('100.0%')).toBeInTheDocument();
    // Without this, "100.0%" reads as a strong card rather than one game.
    expect(within(row).getByText('1–0')).toBeInTheDocument();
  });

  it('the card detail page shows matches and the record beside the rate', async () => {
    registerCatalogHandlers(ORIGIN);
    registerStatsHandlers(ORIGIN);

    render(
      <AppProviders>
        <CardDetailPageClient id="b_001" />
      </AppProviders>,
    );
    await screen.findByText('Garbage Addict');

    expect(screen.getByText('Matches')).toBeInTheDocument();
    expect(screen.getByText('Record (W–L)')).toBeInTheDocument();
    expect(screen.getByText('3–1')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
  });

  it('no client-side minimum sample is applied: a 1-match rate is shown, not suppressed', async () => {
    // Suppressing below a threshold of our own would mean disagreeing with
    // the publisher about what is publishable, and hiding real data.
    registerCatalogHandlers(ORIGIN);
    registerStatsHandlers(ORIGIN, {
      cards: [{ id: 'b_001', matches: 1, wins: 1, losses: 0, winRate: 1 }],
      methodology: {
        metric: 'starting_deck_inclusion',
        modes: ['ranked_ai'],
        aiSeats: 'both',
        copies: 'once_per_player_game',
        rulesVersions: 'combined',
        minSample: 1,
        preliminary: true,
        privacy: 'x',
      },
    });

    render(
      <AppProviders>
        <CardDetailPageClient id="b_001" />
      </AppProviders>,
    );
    await screen.findByText('Garbage Addict');

    const row = screen.getByText('Win rate').closest('tr')!;
    expect(within(row).getByText('100.0%')).toBeInTheDocument();
    expect(within(row).queryByText('Not enough data')).toBeNull();
  });
});
