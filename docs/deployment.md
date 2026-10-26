# Deployment

## Hosting

**Vercel.** The owner hosts it themself; no domain has been decided yet.
Static hosting would have been sufficient either way (spec §5 quality bar —
"no backend, no server-side rendering needed"), and Vercel's default
Next.js build target works fine for that: the site makes no server-side
calls of its own at request time, it's all client-side fetches against
`CATALOG_ORIGIN`. No Vercel-specific features (edge functions, ISR, server
actions touching catalog data) are needed or should be reached for.

Note that `vendor/cardgame`'s own root `vercel.json` deploys a *different*
thing — the Godot game's HTML5 web export — from a separate Vercel project
(confirmed live at `https://cardgame-xi-orpin.vercel.app/`). That deployment
has nothing to do with this site and does not serve the catalog API; don't
confuse the two when picking a project name or domain.

**The catalog itself is now also hosted by this project, on a third Vercel
project.** There's no external team publishing it — see
[`catalog-hosting.md`](./catalog-hosting.md) for the full plan (reusing
`vendor/cardgame/catalog/src/server.mjs` as a Vercel serverless function,
not reinventing its 404/CORS/cache behavior as plain static hosting). Three
separate things, three separate Vercel projects: the game's web export, the
catalog API, and this stats site.

## Configuration

```
NEXT_PUBLIC_CATALOG_ORIGIN=<origin, no trailing slash>
```

Set per environment:

- **Local dev** — `http://localhost:8080` (running the submodule's catalog
  server) or wherever the §6 fixtures are served from.
- **Preview/staging** — point at whatever origin the owner provides for
  pre-release testing, if any.
- **Production** — the URL of the catalog Vercel project once
  [`catalog-hosting.md`](./catalog-hosting.md) is deployed. This is an
  interim value: if the game's own team later publishes a real catalog
  origin, this env var is the only thing that changes to switch over — see
  [`catalog-hosting.md`](./catalog-hosting.md#migrating-to-an-externally-hosted-catalog-the-future-state).
  Not yet known by name until our deploy happens; do not hardcode a
  guessed domain in the meantime, including as a fallback default in code
  — and specifically never use `https://cardgame-xi-orpin.vercel.app/`,
  which was checked directly and found to serve the game client, not
  `/data/v1/...` JSON (it 404s there). That domain is a different Vercel
  project for a different
  purpose, not the catalog. If the env var is unset, fail loudly in a
  dev-only warning rather than silently falling back to a placeholder that
  looks real.

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

1. ~~What is the public origin for `CATALOG_ORIGIN`?~~ We host it
   ourselves now — see [`catalog-hosting.md`](./catalog-hosting.md). The
   actual URL exists once that Vercel project is deployed; until then,
   keep developing against local fixtures / the submodule's catalog server.
2. ~~Has a catalog release actually been published, and under which
   `catalogVersion`/`gameVersion`?~~ Being published now, as the candidate:
   `0.1.0-candidate.1`/`unreleased`, confirmed in `catalog/README.md` as
   placeholders. Hosting the candidate doesn't make the labels real — if
   the owner finalizes real values later, re-export and redeploy (see
   [`catalog-hosting.md`](./catalog-hosting.md#keeping-it-in-sync)).
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
