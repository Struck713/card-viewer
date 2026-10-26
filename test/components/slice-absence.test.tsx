import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Table } from '../../components/card-table/Table';
import type { CardRow } from '../../components/card-table/columns';
import type { Card, CardsResponse } from '../../lib/api/types';
import { readFixture } from '../helpers/fixtures';

const cardsResponse = readFixture<CardsResponse>('data/v1/releases/0.0.0-dev/cards.json');
const genStr001 = cardsResponse.cards.find((c) => c.id === 'gen_str_001') as Card;

describe('slice-absence rendering (gen_str_001 fixture)', () => {
  it('a card present in the catalog but absent from the loaded slice shows "no data for this slice", not a 0/blank row', () => {
    const rows: CardRow[] = [{ card: genStr001, stat: undefined }];
    render(
      <Table
        rows={rows}
        statsLoaded
        sortKey="name"
        sortDirection="asc"
        onSort={() => {}}
        linkQuery="tier=mid&match=ranked"
      />,
    );

    expect(screen.getByText('Orbital Strike')).toBeInTheDocument();
    const noDataCells = screen.getAllByText('No data for this slice');
    expect(noDataCells.length).toBeGreaterThan(0);
    expect(screen.queryByText('0.0%')).not.toBeInTheDocument();
    expect(screen.queryByText('Not enough data')).not.toBeInTheDocument();
  });
});
