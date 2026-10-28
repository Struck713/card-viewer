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
    fetchJson<CardsResponse>(`${origin}/data/cards.json`),
    fetchJson<KeywordsResponse>(`${origin}/data/keywords.json`),
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

## No caching

Per spec §4 rule 2. Everything is `Cache-Control: no-cache`, so every load
already revalidates on the origin's own terms — there was never a reason to
layer a second cache on top, and as of 2026-10-28 (owner-approved) the site
doesn't: all three files are fetched fresh on every page load, and nothing
is written to `localStorage`.

`cards.json` and `keywords.json` do carry an `ETag`, and the client
deliberately ignores it — no `If-None-Match`, ever. A `304` there only ever
saved bandwidth, not staleness, so don't re-add it as an optimization.
`card-winrates.json` carries **no `ETag`** and is recomputed continuously;
it was always refetched every load, so that half is unchanged.

```ts
// lib/api/http.ts (shape)
export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'GET', credentials: 'omit' });
  if (!res.ok) throw new HttpError(url, res.status);
  return (await res.json()) as T;
}
```

`fetchJson()` is the one `fetch()` call site for both `catalog.ts` and
`stats.ts` — no headers, no `cache` option, nothing stored.

The one piece of client-side storage logic left is a one-shot sweep,
`pruneLegacyStorage()` in `lib/api/legacy-storage.ts`, called from
`app/providers.tsx`'s effect: it clears every `cardgame-viewer:*` key (the
ETag/body pairs this change retires, plus older release-addressed keys from
before the flat API) and anything mentioning `/data/v1/`, so a returning
visitor's browser doesn't hold dead data forever. It's wrapped in try/catch
— private browsing or blocked storage must degrade to a no-op, never throw.

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
