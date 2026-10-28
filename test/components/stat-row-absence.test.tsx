import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Table } from '../../components/card-table/Table';
import type { CardRow } from '../../components/card-table/columns';
import type { Card, CardsResponse } from '../../lib/api/types';
import { readFixture } from '../helpers/fixtures';

const cardsResponse = readFixture<CardsResponse>('data/cards.json');
const transformForm = cardsResponse.cards.find(
  (c) => c.id === 'cr_001t',
) as Card;

describe('stat-row absence rendering (cr_001t fixture)', () => {
  it('a card in the catalog with no row in the statistics file shows "no published data", not a 0 or a blank', () => {
    // The real case: the statistics file covers the collectible cards, so
    // a token or transform form reached through a card's Transforms
    // section has no row at all. That is distinct from a suppressed
    // figure, and distinct again from statistics not being loaded.
    const rows: CardRow[] = [{ card: transformForm, stat: undefined }];
    render(
      <Table
        rows={rows}
        statsLoaded
        sortKey="name"
        sortDirection="asc"
        onSort={() => {}}
      />,
    );

    expect(screen.getByText('Wretched Form')).toBeInTheDocument();
    expect(screen.getAllByText('No published data')).toHaveLength(
      2, // one per stat column
    );
    expect(screen.queryByText('0.0%')).not.toBeInTheDocument();
    expect(screen.queryByText('0–0')).not.toBeInTheDocument();
    expect(screen.queryByText('Not enough data')).not.toBeInTheDocument();
  });
});
