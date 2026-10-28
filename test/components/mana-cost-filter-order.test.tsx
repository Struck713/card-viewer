import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/providers';
import { CardsPageClient } from '../../app/cards/CardsPageClient';
import type { CardsResponse, KeywordsResponse } from '../../lib/api/types';
import { readFixture } from '../helpers/fixtures';
import { registerStatsNotPublished } from '../helpers/handlers';
import { server } from '../msw/server';

const ORIGIN = 'http://test.local'; // matches NEXT_PUBLIC_CATALOG_ORIGIN set in test/setup.ts

describe('mana cost filter option order', () => {
  it('sorts numerically, not lexicographically (10 after 2, not before)', async () => {
    const base = readFixture<CardsResponse>('data/cards.json');
    const withTenCost: CardsResponse = {
      ...base,
      cards: [
        ...base.cards,
        {
          ...base.cards[0],
          id: 'ten_cost',
          name: 'Ten Cost Card',
          manaCost: 10,
        },
      ],
    };
    const keywords = readFixture<KeywordsResponse>('data/keywords.json');
    server.use(
      http.get(`${ORIGIN}/data/cards.json`, () =>
        HttpResponse.json(withTenCost),
      ),
      http.get(`${ORIGIN}/data/keywords.json`, () =>
        HttpResponse.json(keywords),
      ),
    );
    registerStatsNotPublished(ORIGIN);

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    await screen.findByText('Garbage Addict');
    const select = screen.getByLabelText('Cost') as HTMLSelectElement;
    const optionValues = Array.from(select.options).map(
      (option) => option.value,
    );

    expect(optionValues).toEqual(['all', '3', '4', '10']);
  });
});
