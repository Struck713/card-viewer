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
import type { Card, CardStat } from '../../lib/api/types';

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

describe('sorting by a suppressed stat column', () => {
  // docs/testing.md §2 requires this at table level, not just on the
  // comparator: sorting must place a suppressed figure in the defined
  // suppressed position, never at the extreme that treating it as 0 would
  // imply.
  it('keeps suppressed and slice-absent rows last in BOTH directions', () => {
    const rows: CardRow[] = [
      // Suppressed: the key is absent, which must not read as 0.
      { card: stubCard('t_019', 'Serene Yeti'), stat: { id: 't_019' } },
      {
        card: stubCard('b_001', 'Garbage Addict'),
        stat: { id: 'b_001', winRateWhenPlayed: 0.561 } as CardStat,
      },
      // Absent from the slice entirely — same sort treatment.
      { card: stubCard('gen_str_001', 'Orbital Strike'), stat: undefined },
      {
        card: stubCard('x_002', 'Low Performer'),
        stat: { id: 'x_002', winRateWhenPlayed: 0.102 } as CardStat,
      },
    ];

    const asc = sortRows(rows, 'winRateWhenPlayed', 'asc').map(
      (row) => row.card.id,
    );
    const desc = sortRows(rows, 'winRateWhenPlayed', 'desc').map(
      (row) => row.card.id,
    );

    // Ascending: the genuine lowest value leads; the unknowns do not.
    expect(asc[0]).toBe('x_002');
    expect(asc.slice(2)).toEqual(['t_019', 'gen_str_001']);
    // Descending: the unknowns stay last rather than flipping to the top,
    // which is what makes them read as "unknown" and not as an extreme.
    expect(desc[0]).toBe('b_001');
    expect(desc.slice(2)).toEqual(['t_019', 'gen_str_001']);
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
    const header = screen.getByRole('button', { name: /Win \(played\)/i });

    await user.click(header); // ascending
    let names = cardNamesInOrder();
    expect(names[0]).toBe('Garbage Addict'); // the only published figure
    expect(names.slice(1)).toEqual(['Serene Yeti', 'Orbital Strike']);

    await user.click(header); // descending
    names = cardNamesInOrder();
    expect(names[0]).toBe('Garbage Addict');
    // Still last — a suppressed figure is unknown in both directions, and
    // never the "worst performer".
    expect(names.slice(1)).toEqual(['Serene Yeti', 'Orbital Strike']);

    // And it never rendered as a number.
    expect(screen.queryByText('0.0%')).toBeNull();
  });
});
