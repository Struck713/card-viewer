import { fetchRevalidated } from './cache';
import { HttpError, type StatsResult } from './errors';
import type { CardWinrate, CardWinratesResponse } from './types';

function indexById(cards: CardWinrate[]): Map<string, CardWinrate> {
  const map = new Map<string, CardWinrate>();
  for (const card of cards) {
    map.set(card.id, card);
  }
  return map;
}

// Statistics are one flat, unversioned file. There is no index to read, no
// release to pin and no schemaVersion to gate on — a 404 means the
// statistics simply aren't published, which the card browser must survive
// (docs/suppression-and-states.md).
export async function loadStats(origin: string): Promise<StatsResult> {
  let res: CardWinratesResponse;
  try {
    res = await fetchRevalidated<CardWinratesResponse>(
      `${origin}/data/stats/card-winrates.json`,
    );
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return { status: 'not-published' };
    }
    return { status: 'network-error', error };
  }

  return {
    status: 'ok',
    data: {
      generatedAt: res.generatedAt,
      methodology: res.methodology,
      cards: res.cards,
      byId: indexById(res.cards),
    },
  };
}
