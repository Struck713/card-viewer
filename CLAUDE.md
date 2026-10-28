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
- **Suppression.** `winRate: null` means "not enough data," never `0`. And
  **`winRate: 0` is a real value** — the card lost every game it was in —
  sitting beside the nulls in every live response. Never `?? 0`, never
  `|| 0`, and never sort a null as `0`. See
  `docs/suppression-and-states.md`; the spec calls this the rule most
  likely to be gotten wrong, and the 2026-10-28 API change made it more
  load-bearing, not less.
- **The API is flat and unversioned.** Three files: `/data/cards.json`,
  `/data/keywords.json`, `/data/stats/card-winrates.json`. No index, no
  release id, no versioned path, and no
  `schemaVersion`/`catalogVersion`/`gameVersion` on any payload — the whole
  `/data/v1/...` space was removed on 2026-10-28 and 404s. Don't
  reintroduce version plumbing, a schema gate, slices (tier × match type),
  `?stats=` pinning or deck statistics; all of it was deleted deliberately.
  See the spec's §0.
- **Statistics are published, and can still 404.** They're a live view, not
  a batch release: `generatedAt` is a recompute clock that advances roughly
  every 60 seconds even when no figure changes, so never present it as a
  release or a publication date. The card browser must stay fully usable
  when the file is absent. See `docs/suppression-and-states.md` and
  `docs/deployment.md`.
- **Nothing warns you about the next breaking change.** No payload carries
  a version field, so each loader asserts the shape it expects and resolves
  to an error state. Keep those assertions.
- **Never show a win rate without its win–loss record.** `minSample` is 1,
  so a 100% can come from a single game. Publishing that is fine — the
  owner confirmed it — _because_ the sample sits beside it. Equally, don't
  add a client-side minimum sample: that would mean disagreeing with the
  publisher about what's publishable, and hiding real data. Both halves are
  covered by tests; see `docs/suppression-and-states.md`.
- **The catalog API is external and not ours.** It's published and
  operated by the game's own team at
  `https://cardgame-catalog-production.up.railway.app`, and it implements
  the spec's §4.2–§4.5 transport contract (verified). This project hosts only
  the site. Never commit catalog data into this repo, never add a local
  copy as a fallback or mirror, and never reach for a same-origin shortcut
  (relative fetches, reading files off disk in `lib/api/`) — the origin is
  opaque, swappable config, and `getCatalogOrigin()` is the only thing
  that knows it. Don't hardcode it anywhere, including as a fallback
  default, and specifically never use
  `https://cardgame-xi-orpin.vercel.app/`, which is the game's own web
  client, a different Vercel project entirely (confirmed: `/data/...` 404s
  there). See `docs/deployment.md`.
- **The site caches nothing, by agreement with the game's developer
  (2026-10-28).** All three files are fetched fresh on every page load;
  nothing is written to `localStorage`. `cards.json`/`keywords.json` do
  carry an `ETag` — the client deliberately never sends `If-None-Match`
  against it. Don't reintroduce `If-None-Match`, a `localStorage` body
  store, SWR/React Query, or Next.js `revalidate`. See
  `docs/data-layer.md`.
- **No card art exists yet.** Use the shared placeholder component, not an
  `<img>` with a missing source. See `docs/architecture.md`.
- **This site is hosted on Vercel** (owner-managed); the game's own Vercel
  project is unrelated. See `docs/deployment.md`.
