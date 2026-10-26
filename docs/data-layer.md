# Data layer

Everything here lives under `lib/api/` and `lib/hooks/`. The goal is one
small, well-tested client that every page/component calls into — no
component should call `fetch()` on a catalog/stats URL directly.

## Fetch-once-index-filter-locally

Per spec §4.1: there is no server-side filtering, sorting, or per-card route.
`?query=` strings are ignored. The entire client model is:

1. Fetch `latest.json`.
2. Resolve and fetch `cardsUrl` and `keywordsUrl` against that origin.
3. Hold `cards: Card[]` and the keyword maps in memory (and cache, see
   below), indexed by `id` (a `Map<string, Card>`).
4. All search/filter/sort described in spec §5.1 happens over that in-memory
   array in the browser. Never add a loading state per keystroke of search —
   there's no request to make.

Same pattern for stats: fetch `stats/latest.json` once, then the two release
files it names, hold them in memory, derive the current slice by filtering
`slices` for the selected `tierGroup`/`matchType`.

```ts
// lib/api/catalog.ts (shape, not full implementation)
export async function loadCatalog(origin: string): Promise<{
  index: CatalogIndex;
  cards: Card[];
  keywords: KeywordsResponse;
}> {
  const index = await fetchJson<CatalogIndex>(`${origin}/data/v1/latest.json`);
  assertSchemaVersion(index.schemaVersion);
  const cardsUrl = new URL(index.cardsUrl, origin);
  const keywordsUrl = new URL(index.keywordsUrl, origin);
  const [cardsRes, keywords] = await Promise.all([
    fetchJson<CardsResponse>(cardsUrl.toString()),
    fetchJson<KeywordsResponse>(keywordsUrl.toString()),
  ]);
  return { index, cards: cardsRes.cards, keywords };
}
```

## Caching

Per spec §4.2:

- **Index files** (`latest.json`, `stats/latest.json`) are
  `Cache-Control: no-cache` with an `ETag`. Always re-validate these: send
  `If-None-Match` on repeat loads within a session and handle a `304` by
  reusing the previously parsed body.
- **Release files** (`cards.json`, `keywords.json`, `card-stats.json`,
  `deck-stats.json`) are `public, max-age=31536000, immutable`. Their bytes
  never change for a given version, so cache them in `localStorage` or
  IndexedDB **keyed by release id** (`catalogVersion` for catalog files,
  `releaseId` for stats files), not by URL alone — this is what lets a
  returning visitor skip the network entirely for an already-seen release.

```ts
// lib/api/cache.ts (shape)
export async function fetchReleaseFile<T>(url: string, releaseKey: string): Promise<T> {
  const cached = readCache<T>(releaseKey);
  if (cached) return cached;
  const body = await fetchJson<T>(url);
  writeCache(releaseKey, body);
  return body;
}

export async function fetchIndexFile<T>(url: string): Promise<T> {
  const etag = readEtag(url);
  const res = await fetch(url, etag ? { headers: { 'If-None-Match': etag } } : undefined);
  if (res.status === 304) return readIndexCache<T>(url)!;
  const body = await res.json();
  writeEtag(url, res.headers.get('ETag'));
  writeIndexCache(url, body);
  return body;
}
```

Wrap all `localStorage`/IndexedDB access in try/catch — private browsing or
blocked storage must degrade to "just refetch," never throw and break the
page.

## Error handling matrix

Per spec §4.4, every non-2xx must be handled explicitly and distinctly. Don't
collapse these into one generic "failed to load" state:

| Situation | Response | Site behavior |
|---|---|---|
| `GET /data/v1/latest.json` → 404 | Catalog never deployed | Rare/unexpected at launch — if this happens, the whole site has nothing to show; display a clear "catalog not available" page, not a crash |
| `GET /data/v1/stats/latest.json` → 404 | Stats not published yet (**the expected, common case today**) | Card browser works fully; show the "statistics have not been published yet" notice wherever stats would appear |
| A release file named by an index returns 404 | API is internally inconsistent — a real bug, not an absence | Show a visible error, distinct from the "not published" empty state; this should never happen in a correctly operating API |
| `schemaVersion` present but not `1` | This client is out of date relative to the contract | "This site needs updating" notice; do not attempt to render |
| Network failure / non-JSON body | Transient or environment issue | Retry affordance; don't cache a failure |

Model this as a typed result rather than throwing strings, e.g.:

```ts
type CatalogResult =
  | { status: 'ok'; data: LoadedCatalog }
  | { status: 'not-deployed' }
  | { status: 'schema-mismatch'; got: number }
  | { status: 'inconsistent'; url: string }
  | { status: 'network-error'; error: unknown };

type StatsResult =
  | { status: 'ok'; data: LoadedStats }
  | { status: 'not-published' }
  | { status: 'schema-mismatch'; got: number }
  | { status: 'inconsistent'; url: string }
  | { status: 'network-error'; error: unknown };
```

`useCatalog()`/`useStats()` hooks return one of these discriminated unions
instead of `{ data, loading, error }` with `error: unknown` — it forces every
call site to handle "not published" differently from "broken," which is
exactly the distinction the spec insists on.

## CORS and methods

Per spec §4.3/§4.5: the API sends `Access-Control-Allow-Origin: *` with no
credentials, and only serves `GET`/`HEAD`/`OPTIONS`. Never attach cookies,
`Authorization` headers, or `credentials: 'include'` to these fetches —
there's nothing on the other end to authenticate, and sending credentials to
a wildcard-CORS endpoint is also just bad practice to carry into other code.

## Linking

Per spec §4.6: any shareable link to a specific statistic must carry the
`releaseId` (and `catalogVersion` where relevant) in the URL — e.g.
`/cards/g_001?stats=stats-1.0.0-r1` — so the link still makes sense after the
next stats publish supersedes "latest." Plan the route/query shape for this
from the start rather than retrofitting it.
