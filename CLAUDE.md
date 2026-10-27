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

- **No backend for the site's own logic, no exceptions.** Static hosting,
  client-side fetches straight to `CATALOG_ORIGIN`. No API routes, no
  proxying, no server-side rendering of catalog data. See
  `docs/architecture.md`.
- **Suppression.** A missing stat field means "not enough data," never `0`.
  See `docs/suppression-and-states.md` — the spec itself calls this the rule
  most likely to be gotten wrong.
- **Stats may not exist yet.** The stats API (`/data/v1/stats/...`) is
  contract-frozen but unpublished as of this writing — confirmed by
  probing the live catalog origin, not assumed. The card browser must work
  fully without it, and must keep working unchanged when stats appear. See
  `docs/suppression-and-states.md` and `docs/deployment.md`.
- **The catalog API is external and not ours.** It's published and
  operated by the game's own team at
  `https://cardgame-catalog-production.up.railway.app`, and it implements
  the spec's §4.4 transport contract (verified). This project hosts only
  the site. Never commit catalog data into this repo, never add a local
  copy as a fallback or mirror, and never reach for a same-origin shortcut
  (relative fetches, reading files off disk in `lib/api/`) — the origin is
  opaque, swappable config, and `getCatalogOrigin()` is the only thing
  that knows it. Don't hardcode it anywhere, including as a fallback
  default, and specifically never use
  `https://cardgame-xi-orpin.vercel.app/`, which is the game's own web
  client, a different Vercel project entirely (confirmed: `/data/v1` 404s
  there). See `docs/deployment.md`.
- **No card art exists yet.** Use the shared placeholder component, not an
  `<img>` with a missing source. See `docs/architecture.md`.
- **This site is hosted on Vercel** (owner-managed); the game's own Vercel
  project is unrelated. See `docs/deployment.md`.
