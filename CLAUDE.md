# CLAUDE.md

This repo is a public card-statistics website (Next.js + Tailwind CSS) built
on top of a card game's catalog/stats JSON API.

**Start here, in order:**

1. [`stats-website-spec.md`](./stats-website-spec.md) — the authoritative
   product brief and API schema. Read this before changing anything related
   to data fetching, card fields, or statistics.
2. [`docs/README.md`](./docs/README.md) — the technical documentation index.
   Covers architecture, the data layer, page/component breakdown,
   suppression/empty-state rules, testing, deployment, and open questions.

Do not re-derive the architecture or API shape from scratch — it's already
written out in `docs/`. Check there first.

## Key things to not get wrong

- **No backend.** Static hosting, client-side fetches straight to
  `CATALOG_ORIGIN`. See `docs/architecture.md`.
- **Suppression.** A missing stat field means "not enough data," never `0`.
  See `docs/suppression-and-states.md` — the spec itself calls this the rule
  most likely to be gotten wrong.
- **Stats may not exist yet.** The stats API (`/data/v1/stats/...`) is
  contract-frozen but unimplemented as of this writing — confirmed by
  checking the `vendor/cardgame` submodule directly, not assumed. The card
  browser must work fully without it. See `docs/suppression-and-states.md`
  and `docs/deployment.md`.
- **`vendor/cardgame` is reference-only, with one exception.** It's a
  submodule of the game's own repo, used to resolve ambiguity in the spec.
  Nothing in the Next.js site (`app/`, `lib/`, `components/`) imports from
  it, and its raw `data/cards/*.json` is never a data source for the site —
  the catalog API is. The exception: `vendor/cardgame/catalog` is also our
  interim production catalog deployment (next bullet). See
  `docs/reverse-engineering.md`.
- **We host the catalog ourselves — for now, not permanently.** No third
  party publishes it yet, so we take `vendor/cardgame/catalog` and deploy
  it as its own Vercel project, reusing its own `server.mjs` request
  handler rather than reimplementing its 404/CORS/cache behavior as plain
  static hosting. If the game's own team deploys a real catalog origin
  later, flip `NEXT_PUBLIC_CATALOG_ORIGIN` to point at it and retire ours —
  that's meant to be a one-line config change, so don't special-case
  behavior on "the catalog happens to be ours." See
  `docs/catalog-hosting.md`. Don't hardcode a guessed `CATALOG_ORIGIN`
  before our deploy exists — and specifically never use
  `https://cardgame-xi-orpin.vercel.app/`, which is the game's own web
  client, a different Vercel project entirely (confirmed: `/data/v1` 404s
  there). See `docs/deployment.md`.
- **No card art exists yet.** Use the shared placeholder component, not an
  `<img>` with a missing source. See `docs/architecture.md`.
- **This site is hosted on Vercel** (owner-managed); the game's own Vercel
  project is unrelated. See `docs/deployment.md`.
