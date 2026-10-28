import { fetchIndexFile, fetchReleaseFile } from './cache';
import { HttpError, type StatsProvenance, type StatsResult } from './errors';
import type { CardStatsResponse, DeckStatsResponse, StatsIndex } from './types';

// Shared tail of loadStats/loadStatsRelease — fetches the two release files
// a stats release is made of and assembles the result. Mirrors
// catalog.ts's loadCatalogFiles/loadCatalogRelease split, for the same
// reason: a release can be reached either through its index or by id.
async function loadStatsFiles(
  origin: string,
  releaseId: string,
  cardStatsUrl: string,
  deckStatsUrl: string,
  catalogVersion: string | null,
  pinned: boolean,
): Promise<StatsResult> {
  let resolvedCardStatsUrl: string;
  let resolvedDeckStatsUrl: string;
  try {
    resolvedCardStatsUrl = new URL(cardStatsUrl, origin).toString();
    resolvedDeckStatsUrl = new URL(deckStatsUrl, origin).toString();
  } catch {
    // Same reasoning as catalog.ts's loadCatalogFiles: an unparseable
    // named URL is an API inconsistency, and must resolve to a result
    // rather than throw.
    return { status: 'inconsistent', url: cardStatsUrl };
  }

  let cardStats: CardStatsResponse;
  let deckStats: DeckStatsResponse;
  try {
    [cardStats, deckStats] = await Promise.all([
      fetchReleaseFile<CardStatsResponse>(resolvedCardStatsUrl, releaseId),
      fetchReleaseFile<DeckStatsResponse>(resolvedDeckStatsUrl, releaseId),
    ]);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      // A pinned release that 404s is a bad link, not a broken API: no
      // index ever promised this file exists, the URL did.
      return pinned
        ? { status: 'pinned-not-found', releaseId }
        : { status: 'inconsistent', url: error.url };
    }
    return { status: 'network-error', error };
  }

  // A pinned release is fetched without reading an index, so the release
  // file's own schemaVersion is the only gate there is — without this
  // check, ?stats= would be a way to bypass the schema gate entirely.
  if (cardStats.schemaVersion !== 1) {
    return { status: 'schema-mismatch', got: cardStats.schemaVersion };
  }

  const provenance: StatsProvenance = {
    releaseId,
    gameVersion: cardStats.gameVersion,
    catalogVersion,
    pinned,
  };
  return { status: 'ok', data: { provenance, cardStats, deckStats } };
}

export async function loadStats(origin: string): Promise<StatsResult> {
  let index: StatsIndex;
  try {
    index = await fetchIndexFile<StatsIndex>(
      `${origin}/data/v1/stats/latest.json`,
    );
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

  return loadStatsFiles(
    origin,
    index.releaseId,
    index.cardStatsUrl,
    index.deckStatsUrl,
    index.catalogVersion,
    false,
  );
}

// Loads a specific stats release by id, bypassing stats/latest.json — the
// mechanism behind ?stats=<releaseId> (spec §4.6, "pin when you link"), so
// a shared link keeps meaning after the next publish supersedes "latest".
//
// Mirrors loadCatalogRelease (catalog.ts): both construct a release path
// documented in docs/data-contract.md rather than reading it out of an
// index, because by definition there is no index entry to read. releaseId
// comes from the URL, so it is encoded rather than interpolated raw.
//
// catalogVersion is whatever the link declared via ?catalog=<version>, or
// null when it declared nothing — see StatsProvenance.
export async function loadStatsRelease(
  origin: string,
  releaseId: string,
  catalogVersion: string | null,
): Promise<StatsResult> {
  const encoded = encodeURIComponent(releaseId);
  return loadStatsFiles(
    origin,
    releaseId,
    `/data/v1/stats/releases/${encoded}/card-stats.json`,
    `/data/v1/stats/releases/${encoded}/deck-stats.json`,
    catalogVersion,
    true,
  );
}
