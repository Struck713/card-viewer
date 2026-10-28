# Deployment

## Hosting

**Vercel.** The owner hosts it themself; no domain has been decided yet.
Static hosting would have been sufficient either way (spec §5 quality bar —
"no backend, no server-side rendering needed"), and Vercel's default
Next.js build target works fine for that: the site makes no server-side
calls of its own at request time, it's all client-side fetches against
`CATALOG_ORIGIN`. No Vercel-specific features (edge functions, ISR, server
actions touching catalog data) are needed or should be reached for.

Note that the game's own repo deploys a _different_ thing from a separate
Vercel project — the Godot game's HTML5 web export, live at
`https://cardgame-xi-orpin.vercel.app/`. That deployment has nothing to do
with this site and does not serve the catalog API (`/data/...` 404s
there); don't confuse the two when picking a project name or domain, and
never use it as `CATALOG_ORIGIN`.

**The catalog API is hosted by the game's own team**, separately from this
site, at the origin below. This project hosts only the site — one Vercel
project, no catalog files committed here, no API route.

## The catalog origin

```
https://cardgame-catalog-production.up.railway.app
```

The game's team runs this; it is the real, external source of truth for
card data, and this project does not deploy, mirror or re-export any part
of it. Card data changes when they change it, which the site picks up on
the next load with no change here (see "Release-time behavior" below).

Verified live against this origin, matching the spec's §4.2–§4.5 transport
contract:

| Behavior                             | Observed                                                                |
| ------------------------------------ | ----------------------------------------------------------------------- |
| `GET /data/cards.json`               | `200`, `cache-control: no-cache` + `ETag`; 176 cards                    |
| `GET /data/keywords.json`            | `200`, `cache-control: no-cache` + `ETag`                               |
| `GET /data/stats/card-winrates.json` | `200`, `cache-control: no-cache`, **no `ETag`**; 168 rows               |
| `GET /data/v1/...` (anything)        | `404` — the entire versioned URL space is gone                          |
| Unknown path                         | `404` with a JSON body (`{"error":"not found"}`)                        |
| CORS                                 | `access-control-allow-origin: *`, `access-control-expose-headers: ETag` |
| Preflight (`OPTIONS`)                | `204`, allows `GET, HEAD, OPTIONS` and `If-None-Match`                  |
| `POST`                               | `405`                                                                   |

Two observations the design depends on, both from sampling the live origin
rather than reading the contract:

- **The statistics file sends no `ETag`**, so it cannot be conditionally
  revalidated. The data layer refetches it every load and stores nothing
  (see [`data-layer.md`](./data-layer.md)). That is the behaviour we want
  regardless: the owner's position is that the figures can change at any
  moment and should not be cached aggressively, so there is no upstream
  request to make here.
- **`generatedAt` advances on a ~60-second recompute even when no figure
  changes.** Sampled five times over 80 seconds: it moved 03:10:26 →
  03:11:27 while total matches, zero count and null count were identical
  throughout. It is a recompute clock, not a publication timestamp, and the
  figures themselves also move between loads.

Don't _depend_ on anything beyond what the spec promises — the data layer
treats every non-2xx as a typed failure by status code alone and never
parses an error body, and that's what keeps the origin swappable.

Both halves of the API are live. Statistics are published, but
`methodology.preliminary` is `true` with `minSample: 1`, so the figures
carry a prominent caveat; see
[`suppression-and-states.md`](./suppression-and-states.md). The
statistics-absent mode is still fully supported, because that file can
still 404.

## Configuration

```
NEXT_PUBLIC_CATALOG_ORIGIN=<origin, no trailing slash>
```

Set per environment:

- **Local dev** — the real origin above (it's public and wildcard-CORS, so
  there's nothing to run locally), or `http://localhost:8081` for the §6
  fixtures via `npm run dev:fixtures` when exercising suppression and
  empty-state paths the real origin has no data for.
- **Preview/staging** — the same real origin, unless the owner provides a
  pre-release one.
- **Production** — the real origin above, set in the site's Vercel project
  settings.

Treat the origin as opaque, swappable config in all environments: it stays
reachable only through `getCatalogOrigin()`, with no hardcoded fallback
domain in code. If the env var is unset, fail loudly in a dev-only warning
rather than silently falling back to a placeholder that looks real.

## Card art

Confirmed with the owner: there is no card art yet, and the catalog API
never exports art paths by design (spec §1.4). Use a single generic
filler/placeholder image (or a simple CSS/SVG placeholder) everywhere a card
would otherwise show art, rather than blocking the UI on this. See
[`architecture.md`](./architecture.md) and
[`pages-and-components.md`](./pages-and-components.md) for where this
plugs in — swapping the placeholder for real art later should only mean
changing one component, not redesigning the card table/detail layout.

## Pre-launch checklist (from spec §8 — resolved with the owner)

1. ~~What is the public origin for `CATALOG_ORIGIN`?~~
   `https://cardgame-catalog-production.up.railway.app` — published by the
   game's own team, verified live (see "The catalog origin" above).
2. ~~Has a catalog release actually been published, and under which
   `catalogVersion`/`gameVersion`?~~ **Moot as of 2026-10-28: the catalog is
   no longer versioned.** `/data/cards.json` serves 176 cards with no
   version field of any kind. Whether versioning returns is now spec §8
   question 1.
3. ~~Do card statistics exist yet?~~ Yes, as of 2026-10-28 — one flat,
   unversioned, continuously recomputed win-rate file. Deck statistics
   never shipped and are no longer in the contract.
4. ~~Is there an image source for card art, separate from this API?~~ No —
   use a filler image for now (see above).
5. ~~Where should the site be hosted, under which domain?~~ Vercel,
   owner-hosted; domain TBD.

See [`open-questions.md`](./open-questions.md) for the same list tracked
alongside the definition-of-done checklist.

## Release-time behavior to verify, not assume

- **There are no releases to pick up any more.** New card data appears when
  `cards.json`'s bytes change; the client fetches it fresh on the very next
  page load regardless, so there is nothing to invalidate and no index
  pointer to watch. (The origin's `ETag` still changes too, but the client
  doesn't look at it — see rule 2 in §4 of the spec.)
- The site must keep working, unmodified, if the statistics file goes from
  "exists" to "404s" — the empty-state logic in
  [`suppression-and-states.md`](./suppression-and-states.md) is a permanent
  resilience property, not a temporary scaffold from before statistics
  shipped. It was already load-bearing once, when the whole `/data/v1`
  space disappeared.
- **Expect no warning before the next breaking change.** No payload carries
  a version field, so there is nothing to gate on. Each loader asserts the
  shape it expects and resolves to an error state; that assertion is the
  only thing standing between an upstream restructuring and a broken page
  in a visitor's browser.
