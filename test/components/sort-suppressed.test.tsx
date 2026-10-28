import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/providers';
import { CardsPageClient } from '../../app/cards/CardsPageClient';
import { sortRows, type CardRow } from '../../components/card-table/columns';
import {
  registerCatalogHandlers,
  registerStatsHandlers,
} from '../helpers/handlers';
import type { Card, CardWinrate } from '../../lib/api/types';

const ORIGIN = 'http://test.local'; // matches NEXT_PUBLIC_CATALOG_ORIGIN set in test/setup.ts

function cardNamesInOrder(): string[] {
  const body = screen.getAllByRole('rowgroup')[1];
  return within(body)
    .getAllByRole('row')
    .map((row) => within(row).getAllByRole('cell')[1].textContent ?? '');
}

function stubCard(id: string, name: string): Card {
  return {
    id,
    name,
    color: 'GREEN',
    type: 'CREATURE',
    rarity: 'COMMON',
    manaCost: 1,
    attack: 1,
    health: 1,
    tribe: null,
    description: '',
    abilities: [],
    collectible: true,
    isToken: false,
    isTransformForm: false,
    transformInto: null,
    transformChoices: [],
  };
}

function stat(id: string, winRate: number | null, matches = 4): CardWinrate {
  return { id, matches, wins: 0, losses: 0, winRate };
}

describe('sorting by the win-rate column', () => {
  // docs/testing.md requires this at table level, not just on the
  // comparator: sorting must place a suppressed figure in the defined
  // suppressed position, never at the extreme that treating it as 0 would
  // imply — and must leave a genuine 0% sorted as the real value it is.
  it('keeps suppressed and row-absent cards last in BOTH directions, with a real 0 ranked as a value', () => {
    const rows: CardRow[] = [
      { card: stubCard('t_019', 'Serene Yeti'), stat: stat('t_019', null, 0) },
      { card: stubCard('b_001', 'Garbage Addict'), stat: stat('b_001', 0.561) },
      // No row in the statistics file at all — same sort treatment.
      { card: stubCard('cr_001t', 'Wretched Form'), stat: undefined },
      // A genuine 0%: the worst REAL figure, not an unknown.
      { card: stubCard('x_002', 'Lost Them All'), stat: stat('x_002', 0) },
    ];

    const asc = sortRows(rows, 'winRate', 'asc').map((row) => row.card.id);
    const desc = sortRows(rows, 'winRate', 'desc').map((row) => row.card.id);

    // Ascending: the genuine 0% leads, because it IS the lowest value.
    expect(asc[0]).toBe('x_002');
    expect(asc[1]).toBe('b_001');
    expect(asc.slice(2)).toEqual(['t_019', 'cr_001t']);
    // Descending flips the real figures but leaves the unknowns last,
    // which is what makes them read as "unknown" rather than an extreme.
    expect(desc[0]).toBe('b_001');
    expect(desc[1]).toBe('x_002');
    expect(desc.slice(2)).toEqual(['t_019', 'cr_001t']);
  });

  it('holds when the table is actually sorted by clicking the column', async () => {
    registerCatalogHandlers(ORIGIN);
    registerStatsHandlers(ORIGIN);

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );
    await screen.findByText('Garbage Addict');

    const user = userEvent.setup();
    const header = screen.getByRole('button', { name: /Win %/i });

    // Fixture: b_001 = 75%, gen_str_001 = a real 0%, t_019 = null.
    await user.click(header); // ascending
    expect(cardNamesInOrder()).toEqual([
      'Orbital Strike',
      'Garbage Addict',
      'Serene Yeti',
    ]);

    await user.click(header); // descending
    // The suppressed row is still last — unknown in both directions, and
    // never the "worst performer", which is where the genuine 0% belongs.
    expect(cardNamesInOrder()).toEqual([
      'Garbage Addict',
      'Orbital Strike',
      'Serene Yeti',
    ]);

    // The suppressed card never rendered as a number...
    const yetiRow = screen.getByText('Serene Yeti').closest('tr')!;
    expect(within(yetiRow).getByText('Not enough data')).toBeInTheDocument();
    // ...while the genuine 0% did.
    const zeroRow = screen.getByText('Orbital Strike').closest('tr')!;
    expect(within(zeroRow).getByText('0.0%')).toBeInTheDocument();
  });
});
