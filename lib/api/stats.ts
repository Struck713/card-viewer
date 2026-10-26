import { fetchIndexFile, fetchReleaseFile } from './cache';
import { HttpError, type StatsResult } from './errors';
import type { CardStatsResponse, DeckStatsResponse, StatsIndex } from './types';

export async function loadStats(origin: string): Promise<StatsResult> {
  let index: StatsIndex;
  try {
    index = await fetchIndexFile<StatsIndex>(`${origin}/data/v1/stats/latest.json`);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      // The expected, common case today: stats aren't published yet.
      return { status: 'not-published' };
    }
    return { status: 'network-error', error };
  }
  if (index.schemaVersion !== 1) {
    return { status: 'schema-mismatch', got: index.schemaVersion };
  }

  const cardStatsUrl = new URL(index.cardStatsUrl, origin).toString();
  const deckStatsUrl = new URL(index.deckStatsUrl, origin).toString();
  let cardStats: CardStatsResponse;
  let deckStats: DeckStatsResponse;
  try {
    [cardStats, deckStats] = await Promise.all([
      fetchReleaseFile<CardStatsResponse>(cardStatsUrl, index.releaseId),
      fetchReleaseFile<DeckStatsResponse>(deckStatsUrl, index.releaseId),
    ]);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return { status: 'inconsistent', url: error.url };
    }
    return { status: 'network-error', error };
  }

  return { status: 'ok', data: { index, cardStats, deckStats } };
}
