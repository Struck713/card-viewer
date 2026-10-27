# Deployment

## Hosting

**Vercel.** The owner hosts it themself; no domain has been decided yet.
Static hosting would have been sufficient either way (spec §5 quality bar —
"no backend, no server-side rendering needed"), and Vercel's default
Next.js build target works fine for that: the site makes no server-side
calls of its own at request time, it's all client-side fetches against
`CATALOG_ORIGIN`. No Vercel-specific features (edge functions, ISR, server
actions touching catalog data) are needed or should be reached for.

Note that the game's own repo deploys a *different* thing from a separate
Vercel project — the Godot game's HTML5 web export, live at
`https://cardgame-xi-orpin.vercel.app/`. That deployment has nothing to do
with this site and does not serve the catalog API (`/data/v1/...` 404s
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
of it. Card data changes when they publish a release, which the site picks
up through `latest.json` with no change here (see "Release-time behavior"
below).

Verified live against this origin, matching the spec's §4.4 transport
contract:

| Behavior | Observed |
|---|---|
| `GET /data/v1/latest.json` | `200`, `cache-control: no-cache` + `ETag` |
| `GET /data/v1/releases/<v>/cards.json` | `200`, `cache-control: public, max-age=31536000, immutable` + `ETag` |
| Unknown path | `404` with a JSON body (`{"error":"not found"}`) |
| CORS | `access-control-allow-origin: *`, `access-control-expose-headers: ETag` |
| Preflight (`OPTIONS`) | `204`, allows `GET, HEAD, OPTIONS` and `If-None-Match` |
| `POST` | `405` |

That means the site's conditional-request and release-caching design
(see [`data-layer.md`](./data-layer.md)) is actually supported end to end
rather than merely tolerated. Don't *depend* on anything beyond what the
spec promises, though — the data layer already treats every non-2xx as a
typed failure by status code alone and never parses an error body, and
that's what keeps the origin swappable.

Currently published there: catalog release `0.1.0` (`catalogVersion` and
`gameVersion` both `0.1.0`), 176 cards. The stats half of the API is still
not published — `/data/v1/stats/latest.json` 404s, checked against this
same origin — so card-browser-only mode remains the operative state; see
[`suppression-and-states.md`](./suppression-and-states.md).

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
   `catalogVersion`/`gameVersion`?~~ Yes: `0.1.0` for both, 176 cards,
   served from that origin. The earlier `0.1.0-candidate.1`/`unreleased`
   placeholders are no longer what's published.
3. ~~Do card/deck statistics exist yet?~~ No, confirmed directly by the
   owner. Plan the launch around card-browser-only.
4. ~~Is there an image source for card art, separate from this API?~~ No —
   use a filler image for now (see above).
5. ~~Where should the site be hosted, under which domain?~~ Vercel,
   owner-hosted; domain TBD.

See [`open-questions.md`](./open-questions.md) for the same list tracked
alongside the definition-of-done checklist.

## Release-time behavior to verify, not assume

- The site must keep working, unmodified, through a stats release going
  from "doesn't exist" to "exists" — i.e. the empty-state logic in
  [`suppression-and-states.md`](./suppression-and-states.md) is the
  mechanism that makes launching before stats exist safe, not a temporary
  scaffold to remove later.
- Because release files are cached essentially forever by release id (spec
  §4.2), a new catalog or stats release must be picked up via the *index*
  files changing (`latest.json`'s `cardsUrl`/`cardStatsUrl` pointing at a
  new version), not by invalidating any site-side cache manually.
