# Architecture

## Stack

- **Next.js** (App Router, latest stable). No custom server, no API routes
  for proxying — the catalog API already has CORS wide open
  (`Access-Control-Allow-Origin: *`, no credentials), so the browser can call
  it directly. Next's only jobs here are routing, static asset bundling, and
  giving us a component model + Tailwind integration.
- **TailwindCSS** for styling. No component library on top. The spec
  offered two options for the no-card-art problem (§1.4): a text/type-based
  design, or an image source from the owner. Resolved: the owner confirmed
  there's no card art yet, so use a single generic **filler/placeholder
  image** (e.g. a `<CardArtPlaceholder>` component — a plain colored block
  or simple icon, not an attempt to fake real art) everywhere a card would
  show art, rather than redesigning around pure text. This keeps swapping in
  real art later a one-component change instead of a layout rework.
- **No backend.** Per spec §5 quality bar: "static hosting is enough (no
  backend, no server-side rendering needed)." Treat this literally: the site
  should work as static files plus client-side fetches. Don't build an API
  route that re-fetches the catalog server-side unless a concrete need shows
  up (e.g. hiding `CATALOG_ORIGIN`, which isn't a secret — it's public
  config).

## Rendering strategy

All data in this app is fetched from a single external, cacheable, versioned
JSON API at runtime — there is nothing to render at build time except the
shell. Use **client components** for anything that reads catalog/stats data:

- `app/layout.tsx` — static shell, server component.
- Data-dependent routes (`/cards`, `/cards/[id]`, `/factions`,
  `/methodology`) render a client component that does the fetch via the data
  layer (see [`data-layer.md`](./data-layer.md)) in an effect or a small data
  hook, with a loading state.

Do **not** reach for `getServerSideProps`/server actions/ISR to fetch catalog
data. The catalog is explicitly designed to be fetched once by the browser
and filtered client-side (spec §4.1); server-rendering it on every request
adds latency and a second cache layer for no benefit, and the API has no
query parameters to make SSR meaningfully different from CSR.

If build-time static export (`next export`) is desired for the simplest
possible hosting, it works fine precisely because no page needs server data
at build time — confirm before relying on it that no route uses a feature
export disallows (none should, by design).

## Project layout

```
app/
  layout.tsx                 # shell: header, nav, footer, provenance bar slot
  page.tsx                   # landing / redirects to /cards
  cards/
    page.tsx                 # card table (spec §5.1, §5.2)
    [id]/
      page.tsx                # card detail (spec §5.3)
  factions/
    page.tsx                 # faction win rates (spec §5.4)
  methodology/
    page.tsx                 # method block + plain-language explanation (spec §5.5)
lib/
  api/
    config.ts                # CATALOG_ORIGIN resolution
    catalog.ts                # latest.json, cards.json, keywords.json fetchers
    stats.ts                  # stats/latest.json, card-stats.json, deck-stats.json fetchers
    cache.ts                  # ETag/If-None-Match + localStorage/IndexedDB release cache
    types.ts                  # TypeScript types mirroring the schema (see data-contract.md)
    errors.ts                 # typed error cases: NotPublished, SchemaMismatch, Inconsistent
  hooks/
    useCatalog.ts             # loads latest catalog release, exposes cards + keywords
    useStats.ts               # loads latest stats release if present, else "not published"
    useSlice.ts               # current tierGroup/matchType selection + derived slice data
  format/
    rates.ts                  # fraction -> percentage formatting, 1 decimal max
    suppression.ts            # helpers for "is this figure present" checks (see suppression-and-states.md)
components/
  card-table/                 # table, filters, search, sort
  card-detail/                 # printed data, resolved keywords, stat rows
  faction-table/
  provenance/                  # the small bar showing gameVersion/catalogVersion/releaseId/generatedOn
  slice-selector/
  empty-states/                # "not published yet", "schema mismatch", "inconsistent API"
  card-art/
    CardArtPlaceholder.tsx     # generic filler image/block used everywhere art would go
docs/                          # this folder
vendor/
  cardgame/                    # git submodule — reference only, not imported by app code
```

## Configuration

A single environment variable, per spec §2:

```
NEXT_PUBLIC_CATALOG_ORIGIN=https://catalog.example.com   # no trailing slash
```

It must be `NEXT_PUBLIC_*` because it's read in the browser (the fetches
happen client-side, not in a Next.js server context). This is public
configuration, not a secret — the API requires no key and serves the same
data to everyone.

Local development has two options (spec §2):

1. Run the real catalog server from the submodule:
   ```
   cd vendor/cardgame/catalog && npm start   # serves http://localhost:8080, Node >= 20, no deps
   ```
   then set `NEXT_PUBLIC_CATALOG_ORIGIN=http://localhost:8080`.
2. Serve the fixtures from spec §6 from any static file server and point
   `NEXT_PUBLIC_CATALOG_ORIGIN` at that instead — useful for exercising the
   suppression and empty-state paths, since the real catalog server has no
   stats data at all right now.

## Why not more than this

Resist adding: a server-side proxy, a database, user accounts, analytics that
forward query/card data to a third party without sign-off (explicitly
disallowed, definition of done's last line), or a CMS. Nothing in the spec
calls for persistence beyond per-viewer `localStorage`/IndexedDB caching of
immutable release files.
