import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatRows } from '../../components/card-detail/StatRows';
import type { CardStatsResponse } from '../../lib/api/types';
import { readFixture } from '../helpers/fixtures';

const cardStats = readFixture<CardStatsResponse>(
  'data/v1/stats/releases/stats-0.0.0-dev/card-stats.json',
);
const slice = cardStats.slices.find(
  (s) => s.tierGroup === 'mid' && s.matchType === 'ranked',
)!;
const t019 = slice.cards.find((c) => c.id === 't_019')!;

describe('suppression rendering (t_019 fixture)', () => {
  it('a suppressed winRateWhenPlayed renders as "not enough data", never 0%', () => {
    render(<StatRows stat={t019} />);

    const row = screen.getByText('Win rate when played').closest('tr')!;
    expect(within(row).getByText('Not enough data')).toBeInTheDocument();
    expect(within(row).queryByText('0.0%')).not.toBeInTheDocument();
    expect(within(row).queryByText('0%')).not.toBeInTheDocument();
  });

  it('a present figure (drawRate) renders its real value with a sample size', () => {
    render(<StatRows stat={t019} />);

    const row = screen.getByText('Draw rate').closest('tr')!;
    expect(within(row).getByText('41.0%')).toBeInTheDocument();
    expect(within(row).getByText('n≈120')).toBeInTheDocument();
  });
});
