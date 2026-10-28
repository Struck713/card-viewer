# cardgame-viewer

Public card-statistics website for the card game: a catalog browser plus
per-card win-rate statistics. Next.js
(App Router) + Tailwind, static hosting, client-side fetches straight to
`CATALOG_ORIGIN` — no backend of this app's own at all.

**Start here:** [`stats-website-spec.md`](./stats-website-spec.md) (the
product brief and API schema) and [`docs/README.md`](./docs/README.md)
(the engineering docs index — architecture, data layer, suppression rules,
testing, deployment).

## Developing

```bash
npm install
cp .env.local.example .env.local
npm run dev                         # http://localhost:3000
```

That's it — the default `NEXT_PUBLIC_CATALOG_ORIGIN` is the live catalog
API published by the game's own team
(`https://cardgame-catalog-production.up.railway.app`), which is public,
anonymous and wildcard-CORS, so there's nothing to run locally to get real
card data.

The one case needing more: **the fixture server**, for the states the live
origin won't produce on demand — statistics 404ing, `preliminary: false`,
`t_019`'s suppressed `null` next to `gen_str_001`'s genuine `0%`,
`cr_001t` having no statistics row at all, and `rummage_on_death`'s null
keyword mapping (see spec §6). It also mirrors the real transport: an
`ETag` with a working `304` on the catalog files, and none under
`/data/stats/`. The app's own code never sends `If-None-Match` (nothing is
cached — see `docs/data-layer.md`), so this is mostly for parity with the
live origin — though note that the _browser's_ own HTTP cache may still
send a conditional request and get a real `304` from this server on a
plain reload, independent of the app; that's the browser revalidating a
`no-cache` resource on its own terms, not a regression. Disable the
browser cache, or check that `localStorage` stays empty, to see what the
app itself is doing.

```bash
npm run dev:fixtures   # http://localhost:8081
```

then point `.env.local`'s `NEXT_PUBLIC_CATALOG_ORIGIN` at that instead.
Never hardcode a fallback origin in code, and never commit a copy of the
catalog into this repo — see [`docs/deployment.md`](./docs/deployment.md).

## Testing

```bash
npm run test    # Vitest + Testing Library + MSW
npm run lint
npx tsc --noEmit
```

Fixtures live in `test/fixtures/`, copied verbatim from the spec. See
[`docs/testing.md`](./docs/testing.md) for what each required test proves.

## Deployment

One Vercel project for this site, per
[`docs/deployment.md`](./docs/deployment.md). Set
`NEXT_PUBLIC_CATALOG_ORIGIN` in its project settings to the catalog origin
above; the catalog API itself is deployed and operated by the game's team,
not by this project.

Don't confuse this site with `https://cardgame-xi-orpin.vercel.app/` — that
is the game's own Godot web export, a different project entirely, and it
does not serve `/data/...`.
