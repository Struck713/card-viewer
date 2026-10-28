# Data layer

Everything here lives under `lib/api/` and `lib/hooks/`. The goal is one
small, well-tested client that every page/component calls into — no
component should call `fetch()` on a catalog/stats URL directly.

## Fetch-once-index-filter-locally

Per spec §4.1: there is no server-side filtering, sorting, or per-card route.
`?query=` strings are ignored. The entire client model is:

1. Fetch `/data/cards.json` and `/data/keywords.json`.
2. Hold `cards: Card[]` and the keyword maps in memory, indexed by `id` (a
   `Map<string, Card>`).
3. All search/filter/sort described in spec §5.1 happens over that in-memory
   array in the browser. Never add a loading state per keystroke of search —
   there's no request to make.

There is no index file to read first, no URL inside a payload to resolve, and
no version in any path, so each path is a literal constant.

```ts
// lib/api/catalog.ts (shape, not full implementation)
export async function loadCatalog(origin: string): Promise<CatalogResult> {
  const [cardsRes, keywordsRes] = await Promise.all([
    fetchRevalidated<CardsResponse>(`${origin}/data/cards.json`),
    fetchRevalidated<KeywordsResponse>(`${origin}/data/keywords.json`),
  ]);
  return {
    status: 'ok',
    data: {
      cards: cardsRes.cards,
      cardsById: indexCardsById(cardsRes.cards),
      keywords: keywordsRes,
    },
  };
}
```

Same shape for statistics: one fetch of `/data/stats/card-winrates.json`,
indexed by card id at load time (`LoadedStats.byId`) because every consumer
joins on it.

## Caching

Per spec §4.2. **Nothing is immutable and nothing is addressed by a release
id**, so there is no forever-cache here — that was the previous contract.

- **Catalog files** (`cards.json`, `keywords.json`) are
  `Cache-Control: no-cache` **with** an `ETag`. `fetchRevalidated()` sends
  `If-None-Match` on repeat loads and handles a `304` by replaying a stored
  body. This is the only caching the data layer does.
- **The statistics file** carries **no `ETag`** and is recomputed
  continuously, so it cannot be conditionally revalidated at all.
  `fetchFresh()` refetches it every time and stores nothing. That is not a
  compromise but the intended behaviour: the figures can change at any
  moment, so caching them aggressively would pin a visitor to numbers that
  have moved on. Don't add a cache here even if an `ETag` appears upstream.

```ts
// lib/api/cache.ts (shape)
export async function fetchRevalidated<T>(url: string): Promise<T> {
  const etag = readEtag(url);
  const res = await fetchResponse(
    url,
    etag ? { 'If-None-Match': etag } : undefined,
  );
  if (res.status === 304) return readBodyCache<T>(url)!;
  const body = await res.json();
  writeEtag(url, res.headers.get('ETag'));
  writeBodyCache(url, body);
  return body;
}

export async function fetchFresh<T>(url: string): Promise<T> {
  // No ETag upstream, so nothing to revalidate and nothing to store.
  return (await fetchResponse(url)).json();
}
```

Wrap all `localStorage` access in try/catch — private browsing or blocked
storage must degrade to "just refetch," never throw and break the page.
`cache.ts` also sweeps the dead `cardgame-viewer:release:` keys on load, so
a returning visitor doesn't carry an old release body forever.

## Error handling matrix

Per spec §4.4, every non-2xx must be handled explicitly and distinctly.
There is no index naming a file any more, so each 404 has exactly one
meaning — which makes this matrix shorter and less ambiguous than it was,
not vaguer.

| Situation                              | Response                                                  | Site behavior                                                                                          |
| -------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `cards.json` or `keywords.json` → 404  | Catalog not available at this origin                      | The whole site has nothing to show; display a clear "catalog not available" page, not a crash          |
| `/data/stats/card-winrates.json` → 404 | Statistics not published                                  | Card browser works fully; show "statistics have not been published yet" wherever statistics would be   |
| Valid JSON, unexpected shape           | A breaking change, arriving with no version field to warn | Resolve to `network-error`. This assertion is the only guard there is — see `data-contract.md` rule #1 |
| Network failure / non-JSON body        | Transient or environment issue                            | Retry affordance; don't cache a failure                                                                |

Model this as a typed result rather than throwing strings:

```ts
type CatalogResult =
  | { status: 'ok'; data: LoadedCatalog }
  | { status: 'not-deployed' }
  | { status: 'network-error'; error: unknown };

type StatsResult =
  | { status: 'ok'; data: LoadedStats }
  | { status: 'not-published' }
  | { status: 'network-error'; error: unknown };
```

`useCatalog()`/`useStats()` return one of these discriminated unions instead
of `{ data, loading, error }` with `error: unknown` — it forces every call
site to handle "not published" differently from "broken," which is exactly
the distinction the spec insists on.

Two cases the previous contract had are gone, deliberately rather than by
omission: **`schema-mismatch`** (no payload carries a `schemaVersion`, so
there is nothing to gate on) and **`inconsistent`** (it meant "an index named
a file that 404s", and there is no index).

## CORS and methods

Per spec §4.3/§4.5: the API sends `Access-Control-Allow-Origin: *` with no
credentials, allows `If-None-Match` as a request header, exposes `ETag`, and
only serves `GET`/`HEAD`/`OPTIONS`. Never attach cookies, `Authorization`
headers, or `credentials: 'include'` to these fetches — there's nothing on
the other end to authenticate, and sending credentials to a wildcard-CORS
endpoint is also just bad practice to carry into other code.

## Linking

**Nothing in the URL selects what data to load.** There is one catalog and
one statistics file, no slices to choose between and no release to pin, so
card links are plain `/cards/<id>` and `/cards`.

This is why the app has no `useSearchParams()` caller at all, which in turn
is why there is no Suspense boundary around the providers: the previous
`?tier=`/`?match=`/`?stats=`/`?catalog=` plumbing forced one to keep the
static shell prerendering, and removing the params removed the problem.

**The catalog will not be versioned again** — settled with the owner, not
just absent today (spec §8 question 1). So don't keep a dormant hook for it,
and don't reach for `?`-params to select data that has only one version.
