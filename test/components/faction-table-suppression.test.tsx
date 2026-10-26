import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FactionTable } from '../../components/faction-table/FactionTable';
import type { DeckStat } from '../../lib/api/types';

describe('FactionTable suppression messaging', () => {
  it('renders the same "not enough data" message for a suppressed matches count as for a suppressed win rate', () => {
    const deck: DeckStat = { factions: ['ORANGE'] }; // both winRate and matches absent

    render(<FactionTable decks={[deck]} />);

    const row = screen.getByText('Orange').closest('tr')!;
    const cells = within(row).getAllByText('Not enough data');
    expect(cells).toHaveLength(2);
  });
});
