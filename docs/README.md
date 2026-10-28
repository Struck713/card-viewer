# Card Statistics Website — Technical Documentation

This is the engineering documentation for the public card-statistics website
built on top of the card game's catalog/stats JSON API described in
[`../stats-website-spec.md`](../stats-website-spec.md). That spec is the
product brief and the authoritative schema reference — **read it first**.
These docs translate it into an implementation plan for a specific stack:

- **Next.js** (App Router)
- **Tailwind CSS**
- Static/CSR data fetching against the catalog API — no custom backend

## Where the data comes from

A single external API, hosted by the game's own team at
`https://cardgame-catalog-production.up.railway.app` and reached only
through `NEXT_PUBLIC_CATALOG_ORIGIN` — see
[`deployment.md`](./deployment.md) for the origin's verified behavior and
what's published there today. This repo contains no catalog data and no
copy of the game's own repository; the API is the only supported surface
for printed card data, per spec §7, including in local dev (use the
fixtures for anything the real origin lacks).

## Document map

| Doc                                                        | Covers                                                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [`architecture.md`](./architecture.md)                     | Tech stack, rendering strategy, project layout                                              |
| [`data-contract.md`](./data-contract.md)                   | Condensed endpoint reference + the non-negotiable rules (types live in `lib/api/types.ts`)  |
| [`data-layer.md`](./data-layer.md)                         | Fetch/no-caching/error-handling design for the API client                                   |
| [`pages-and-components.md`](./pages-and-components.md)     | Route map and component breakdown against the spec's requirements                           |
| [`suppression-and-states.md`](./suppression-and-states.md) | The suppression rule, empty states, error states — the parts most likely to be gotten wrong |
| [`testing.md`](./testing.md)                               | Test strategy, required fixture-based tests                                                 |
| [`deployment.md`](./deployment.md)                         | Static hosting, the catalog origin and its verified behavior, configuration                 |
| [`open-questions.md`](./open-questions.md)                 | Owner questions and definition of done, carried over from the spec                          |

## Current status (as of 2026-10-28)

Confirmed by probing the live catalog origin, not assumed:

- **The API was restructured and the entire `/data/v1/...` space is gone.**
  Every path under it 404s. See the spec's §0 for the full accounting; in
  short, there is no index file, no release id, no versioned path, and no
  `schemaVersion`/`catalogVersion`/`gameVersion` on any payload.
- **Both halves are now live, as three flat files:**
  `/data/cards.json` (176 cards) and `/data/keywords.json`, both
  `no-cache` with an `ETag`; and `/data/stats/card-winrates.json` (168
  rows), `no-cache` with **no** `ETag`. See
  [`deployment.md`](./deployment.md) for the evidence table.
- **Statistics are a live view, not a batch publication.**
  `methodology.preliminary` is `true` with `minSample: 1`, `generatedAt`
  advances on a roughly 60-second recompute, and the figures move between
  loads. The site shows them with a prominent caveat and the match count
  beside every rate.
- **Suppression is now `winRate: null`, and `0` is a real value** that
  appears beside it in every response. See
  [`suppression-and-states.md`](./suppression-and-states.md) — this is
  still the rule most likely to be gotten wrong, and the change made it
  more load-bearing, not less.
- The statistics file can still 404, and the card browser must stay fully
  usable when it does. That resilience was already load-bearing once, when
  the whole `/data/v1` space disappeared.
- `CATALOG_ORIGIN` is the game team's origin, reached only through
  `getCatalogOrigin()`. Nothing in this stack hardcodes it, including as a
  fallback default — that's what keeps it swappable if they move it.
