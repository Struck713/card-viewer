import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatRows } from '../../components/card-detail/StatRows';
import type { CardWinratesResponse } from '../../lib/api/types';
import { readFixture } from '../helpers/fixtures';

const stats = readFixture<CardWinratesResponse>(
  'data/stats/card-winrates.json',
);
const byId = (id: string) => stats.cards.find((c) => c.id === id)!;

function winRateRow() {
  return screen.getByText('Win rate').closest('tr')!;
}

describe('suppression rendering', () => {
  it('a null winRate renders as "not enough data", never 0%', () => {
    render(<StatRows stat={byId('t_019')} />);

    const row = winRateRow();
    expect(within(row).getByText('Not enough data')).toBeInTheDocument();
    expect(within(row).queryByText('0.0%')).not.toBeInTheDocument();
    expect(within(row).queryByText('0%')).not.toBeInTheDocument();
  });

  it('a genuine 0 winRate renders as 0.0%, NOT as "not enough data"', () => {
    // The distinction this whole module exists for. gen_str_001 lost both
    // games it was in; t_019 played none. Rendering them the same way
    // would be the exact false-confidence bug the suppression rule
    // prevents, and both states occur in every live response.
    render(<StatRows stat={byId('gen_str_001')} />);

    const row = winRateRow();
    expect(within(row).getByText('0.0%')).toBeInTheDocument();
    expect(within(row).queryByText('Not enough data')).not.toBeInTheDocument();
  });

  it('a present figure renders its real value', () => {
    render(<StatRows stat={byId('b_001')} />);
    expect(within(winRateRow()).getByText('75.0%')).toBeInTheDocument();
  });

  it('counts are never suppressed: a card with no games still shows 0 and 0–0', () => {
    render(<StatRows stat={byId('t_019')} />);

    const matches = screen.getByText('Matches').closest('tr')!;
    expect(within(matches).getByText('0')).toBeInTheDocument();
    const record = screen.getByText('Record (W–L)').closest('tr')!;
    expect(within(record).getByText('0–0')).toBeInTheDocument();
  });
});
