import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../../app/providers';
import { CardsPageClient } from '../../app/cards/CardsPageClient';
import type { CardsResponse, CatalogIndex, KeywordsResponse } from '../../lib/api/types';
import { readFixture } from '../helpers/fixtures';
import { registerStatsNotPublished } from '../helpers/handlers';
import { server } from '../msw/server';

const ORIGIN = 'http://test.local'; // matches NEXT_PUBLIC_CATALOG_ORIGIN set in test/setup.ts

describe('default filters', () => {
  it("the initial render includes only collectible: true cards (spec §3.2's default)", async () => {
    const index = readFixture<CatalogIndex>('data/v1/latest.json');
    const cardsResponse = readFixture<CardsResponse>('data/v1/releases/0.0.0-dev/cards.json');
    const keywords = readFixture<KeywordsResponse>('data/v1/releases/0.0.0-dev/keywords.json');
    // Every fixture card is collectible: true by default — add one that
    // isn't, so this test actually proves the filter excludes something
    // rather than just matching a coincidentally-all-collectible fixture.
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
      http.get(`${ORIGIN}/data/v1/latest.json`, () => HttpResponse.json(index)),
      http.get(`${ORIGIN}${index.cardsUrl}`, () => HttpResponse.json(withToken)),
      http.get(`${ORIGIN}${index.keywordsUrl}`, () => HttpResponse.json(keywords)),
    );
    registerStatsNotPublished(ORIGIN);

    render(
      <AppProviders>
        <CardsPageClient />
      </AppProviders>,
    );

    expect(await screen.findByText('3 of 3 collectible cards')).toBeInTheDocument();
    expect(screen.queryByText('Summoned Token')).not.toBeInTheDocument();
  });
});
