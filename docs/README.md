# Card Statistics Website — Technical Documentation

This is the engineering documentation for the public card-statistics website
built on top of the card game's catalog/stats JSON API described in
[`../stats-website-spec.md`](../stats-website-spec.md). That spec is the
product brief and the authoritative schema reference — **read it first**.
These docs translate it into an implementation plan for a specific stack:

- **Next.js** (App Router)
- **Tailwind CSS**
- Static/CSR data fetching against the catalog API — no custom backend

## Why there's a submodule

[`vendor/cardgame`](../vendor/cardgame) is a git submodule pointing at the
game's own repository
([`PlantMichael/cardgame`](https://github.com/PlantMichael/cardgame)). It is
there for **reference only** — to resolve ambiguity in the spec, to look at
the actual catalog exporter when something is underspecified, and to confirm
what is and isn't implemented yet. It is not a dependency of the website and
nothing in the website imports from it.

See [`reverse-engineering.md`](./reverse-engineering.md) for what's actually
in there, what it confirms, and the hard line on what not to use from it (the
spec's §7 non-goals apply to the submodule too: no scraping `data/cards/*.json`
as a substitute for the catalog API).

**One part of it is more than reference now:** `vendor/cardgame/catalog` is
what we deploy as the catalog API itself, since no one else has published
it — see [`catalog-hosting.md`](./catalog-hosting.md).

## Document map

| Doc | Covers |
|---|---|
| [`architecture.md`](./architecture.md) | Tech stack, rendering strategy, project layout |
| [`data-contract.md`](./data-contract.md) | Condensed API reference + TypeScript types (derived from the spec) |
| [`data-layer.md`](./data-layer.md) | Fetch/cache/error-handling design for the API client |
| [`pages-and-components.md`](./pages-and-components.md) | Route map and component breakdown against the spec's requirements |
| [`suppression-and-states.md`](./suppression-and-states.md) | The suppression rule, empty states, error states — the parts most likely to be gotten wrong |
| [`testing.md`](./testing.md) | Test strategy, required fixture-based tests |
| [`reverse-engineering.md`](./reverse-engineering.md) | What the `vendor/cardgame` submodule is for and what it confirms |
| [`catalog-hosting.md`](./catalog-hosting.md) | Why and how we self-host the catalog API out of the submodule *for now*, and how we flip to an externally hosted one later |
| [`deployment.md`](./deployment.md) | Static hosting, configuration, build/release checklist |
| [`open-questions.md`](./open-questions.md) | Owner questions and definition of done, carried over from the spec |

## Current status (as of this writing)

Confirmed directly against the submodule's `catalog/` package:

- The **card catalog** API (`/data/v1/...`) is implemented, tested, and
  already exported as static files in the game repo
  (`catalog/public/data/v1/...`), but no one else had deployed it publicly.
  **We now deploy it ourselves** — see
  [`catalog-hosting.md`](./catalog-hosting.md). `release-input.json` there
  is still a candidate (`0.1.0-candidate.1` / `unreleased`), not a
  finalized release; hosting it doesn't change that.
- The **stats** API (`/data/v1/stats/...`) does not exist anywhere in the
  repo — no server code, no routes, no fixtures beyond the ones in the spec
  itself. Hosting the catalog doesn't change this either. Build and ship
  the card-browser-only mode first; see
  [`suppression-and-states.md`](./suppression-and-states.md) for how the site
  must behave while this is true.
- `CATALOG_ORIGIN` will be the URL of our own catalog Vercel deployment
  once it's live (see [`catalog-hosting.md`](./catalog-hosting.md)), not a
  third party's domain. Nothing in this stack should hardcode a guessed one
  in the meantime.
