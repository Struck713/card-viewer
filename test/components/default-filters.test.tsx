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

describe('default filters', () => {
  it("the initial render includes only collectible: true cards (spec §3.2's default)", async () => {
    const cardsResponse = readFixture<CardsResponse>('data/cards.json');
    const keywords = readFixture<KeywordsResponse>('data/keywords.json');
    // The fixture already carries one non-collectible transform form; add
    // a token too, so this covers both ways a card can be excluded.
    const withToken: CardsResponse = {
      ...cardsResponse,
      cards: [
        ...cardsResponse.cards,
        {
          id: 'token_001',
          name: 'Summoned Token',
          color: 'GENERIC',
          type: 'CREATURE',
          rarity: 'COMMON',
          manaCost: 0,
          attack: 1,
          health: 1,
          tribe: null,
          description: 'A token.',
          abilities: [],
          collectible: false,
          isToken: true,
          isTransformForm: false,
          transformInto: null,
          transformChoices: [],
        },
      ],
    };
    server.use(
      http.get(`${ORIGIN}/data/cards.json`, () => HttpResponse.json(withToken)),
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

    expect(
      await screen.findByText('3 of 3 collectible cards'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Summoned Token')).not.toBeInTheDocument();
  });
});
