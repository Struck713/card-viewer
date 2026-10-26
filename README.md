# cardgame-viewer

Public card-statistics website for the card game: a catalog browser plus
win-rate/play-rate statistics once a stats release is published. Next.js
(App Router) + Tailwind, static hosting, client-side fetches straight to a
`CATALOG_ORIGIN` — no backend of this app's own.

**Start here:** [`stats-website-spec.md`](./stats-website-spec.md) (the
product brief and API schema) and [`docs/README.md`](./docs/README.md)
(the engineering docs index — architecture, data layer, suppression rules,
testing, deployment).

## Developing

```bash
npm install
cp .env.local.example .env.local   # then point it at one of the two modes below
npm run dev                         # http://localhost:3000
```

`NEXT_PUBLIC_CATALOG_ORIGIN` needs something to point at. Two local
options:

1. **The real catalog server**, out of the `vendor/cardgame` submodule —
   has the actual 176-card candidate release, but no stats data at all:
   ```bash
   cd vendor/cardgame/catalog && npm start   # http://localhost:8080
   ```
2. **The fixture server**, for exercising suppression/slice-absence/stats-
   published paths the real server can't (`t_019`'s suppressed figures,
   `gen_str_001`'s slice absence, `rummage_on_death`'s null keyword
   mapping — see spec §6):
   ```bash
   npm run dev:fixtures   # http://localhost:8081
   ```

Point `.env.local`'s `NEXT_PUBLIC_CATALOG_ORIGIN` at whichever one you're
running. Never hardcode a fallback origin in code — see
[`docs/deployment.md`](./docs/deployment.md).

## Testing

```bash
npm run test    # Vitest + Testing Library + MSW
npm run lint
npx tsc --noEmit
```

Fixtures live in `test/fixtures/`, copied verbatim from the spec. See
[`docs/testing.md`](./docs/testing.md) for what each required test proves.

## Deployment

Three separate Vercel projects, per [`docs/deployment.md`](./docs/deployment.md)
and [`docs/catalog-hosting.md`](./docs/catalog-hosting.md):

| Project | Root directory | Serves |
|---|---|---|
| This site | repo root | the Next.js app |
| `catalog-deploy` | `catalog-deploy/` | our interim catalog API (stopgap until a real one exists) |
| *(unrelated)* | — | `vendor/cardgame`'s own Godot web export — not ours, don't confuse the two |

Set `NEXT_PUBLIC_CATALOG_ORIGIN` on this site's Vercel project to the
`catalog-deploy` project's URL once that's live. Flipping to a real,
externally hosted catalog later is meant to be exactly that: changing this
one env var.
