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
| [`data-contract.md`](./data-contract.md)                   | Condensed API reference + TypeScript types (derived from the spec)                          |
| [`data-layer.md`](./data-layer.md)                         | Fetch/cache/error-handling design for the API client                                        |
| [`pages-and-components.md`](./pages-and-components.md)     | Route map and component breakdown against the spec's requirements                           |
| [`suppression-and-states.md`](./suppression-and-states.md) | The suppression rule, empty states, error states — the parts most likely to be gotten wrong |
| [`testing.md`](./testing.md)                               | Test strategy, required fixture-based tests                                                 |
| [`deployment.md`](./deployment.md)                         | Static hosting, the catalog origin, configuration, build/release checklist                  |
| [`open-questions.md`](./open-questions.md)                 | Owner questions and definition of done, carried over from the spec                          |

## Current status (as of this writing)

Confirmed by probing the live catalog origin, not assumed:

- The **card catalog** API (`/data/v1/...`) is published and live, serving
  release `0.1.0` (176 cards) with the spec's full §4.4 transport contract
  — JSON 404s, immutable release caching, wildcard CORS with `ETag`
  exposed. See [`deployment.md`](./deployment.md) for the evidence table.
- The **stats** API (`/data/v1/stats/...`) is still not published —
  `stats/latest.json` 404s at that origin. Ship the card-browser-only mode
  first; see [`suppression-and-states.md`](./suppression-and-states.md) for
  how the site must behave while this is true, and note that the site is
  built to survive stats going from "absent" to "present" with no code
  change.
- `CATALOG_ORIGIN` is the game team's origin, reached only through
  `getCatalogOrigin()`. Nothing in this stack hardcodes it, including as a
  fallback default — that's what keeps it swappable if they move it.
