import { fetchFresh } from './cache';
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
    res = await fetchFresh<CardWinratesResponse>(
      `${origin}/data/stats/card-winrates.json`,
    );
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return { status: 'not-published' };
    }
    return { status: 'network-error', error };
  }

  // The payload carries no version field of any kind, so there is nothing
  // to gate on and no way to be warned of a breaking change — this very
  // migration is the proof. A shape assertion is the cheapest defense:
  // valid JSON of the wrong shape must not reach the UI as a crash.
  if (!Array.isArray(res?.cards) || typeof res.generatedAt !== 'string') {
    return {
      status: 'network-error',
      error: new Error('card-winrates.json did not match the expected shape'),
    };
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
