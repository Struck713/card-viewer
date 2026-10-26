# The `vendor/cardgame` submodule

`vendor/cardgame` is a git submodule tracking
[`PlantMichael/cardgame`](https://github.com/PlantMichael/cardgame) at a
pinned commit. For most of this project it's a **reference**, not a
dependency — nothing in `app/`, `lib/`, or `components/` (the Next.js site
itself) should import from it.

**One deliberate exception:** `vendor/cardgame/catalog` is now also a real
production dependency — we deploy it ourselves as the catalog API, since no
one else has published it. See [`catalog-hosting.md`](./catalog-hosting.md)
for that plan. Everything else in this doc (the "what not to use" list
below) still applies unchanged to the rest of the submodule.

## Setup

```bash
git submodule update --init --recursive
```

Update to a newer commit of the game repo deliberately, not automatically:

```bash
cd vendor/cardgame && git fetch && git checkout <new-commit-or-tag>
cd ../.. && git add vendor/cardgame && git commit -m "bump cardgame submodule"
```

## What's actually in there

The game is a Godot 4 (GDScript) Hearthstone-style card game. Relevant parts:

```
vendor/cardgame/
├── catalog/              # the actual source of stats-website-spec.md and the API
│   ├── README.md          # implementation-level API docs — cross-check against our spec
│   ├── release-input.json # the candidate release selection (176 cards, 3 excluded)
│   ├── src/export.mjs     # the exporter: faction JSON -> public/data/v1/...
│   ├── src/server.mjs     # the static file server (npm start -> localhost:8080)
│   └── test/               # node:test suite for the exporter + server
├── data/
│   ├── cards/{green,crimson,black,orange,teal,generic}.json  # RAW internal card data — do not use directly, see below
│   ├── keywords.json        # keyword id -> name/description, source of keywords.json's `keywords`
│   └── keyword_abilities.json # ability key -> keyword id aliasing rules
├── server/                 # Nakama-adjacent relay/match server — not relevant to this site
├── scripts/, scenes/        # the Godot game itself — not relevant to this site
└── project_summary.md       # a Claude-oriented summary of the game; written early and now stale
                              # (e.g. lists only 5 colors, no CRIMSON/GENERIC — don't trust it over catalog/README.md)
```

### Confirmed facts (checked directly against this submodule, not assumed)

- **`catalog/stats-website-spec.md` in the game repo is the same document as
  `../stats-website-spec.md` at the root of this project.** The website spec
  isn't a paraphrase — it's the actual brief from the game's own repo. If
  this project's copy and the submodule's copy ever diverge, treat the
  submodule's as the newer one (it moves with the game repo) and resolve the
  difference deliberately rather than silently picking one.
- **The stats API genuinely does not exist.** There is no `stats/` anything
  under `catalog/`, no stats route in `catalog/src/server.mjs`, no stats
  fixture beyond what's written directly into the spec. (A file named
  `data/cards/winrates.txt` exists, but it's a plain-text patch/balance
  changelog, not statistics data or an API source — don't be misled by the
  filename.) This confirms spec §1's claim: build and ship card-browser-only
  first.
- **The catalog implementation matches spec §3.2/§3.3 field-for-field** —
  `catalog/README.md` documents the same `Card` fields, the same
  `abilityKeywords` null-mapping behavior, and the same "~75 unmapped keys"
  figure as the website spec. Useful when a field's exact meaning is
  ambiguous from the website spec alone (e.g. what `isToken: false` does and
  doesn't imply — see `catalog/README.md`'s table, which has a clause the
  website spec compresses out).
- **Card catalog status matches spec §1's table**: candidate release
  prepared (`0.1.0-candidate.1` / `unreleased`). It wasn't deployed by
  anyone else, so we deploy it ourselves — see
  [`catalog-hosting.md`](./catalog-hosting.md). `README.md`'s "Open
  decisions" section lists the exact three cards excluded from the
  176-card candidate selection, if that level of detail is ever needed.
- **The candidate's `public/data/v1/...` is already exported, sitting in
  the submodule** (checked directly: `catalog/public/data/v1/latest.json`
  exists and points at the `0.1.0-candidate.1` release files). That's the
  exact content [`catalog-hosting.md`](./catalog-hosting.md) deploys — no
  export step is needed against this pinned commit, only against a future
  one with different `release-input.json` values.

## What to use this submodule for

- Resolving an ambiguity in the website spec by reading the exporter's own
  README or source instead of guessing.
- Confirming whether a field, status, or behavior has changed, by diffing
  against a newer pinned commit.
- Understanding *why* a rule exists (e.g. why ability keys can map to `null`
  — `catalog/README.md`'s "Known gap" section explains the editorial process
  behind it) when that context helps write better UI copy (e.g. the tooltip
  text on a suppressed figure, or the methodology page's plain-language
  explanation).

## What **not** to do with it (spec §7, restated for this submodule specifically)

- **Do not read `data/cards/*.json` directly and treat it as card data for
  the site.** It's the internal source format and deliberately includes
  fields the catalog exporter strips out (`effect`, `effect_value`, art
  paths, starter-deck flags, runtime state). The catalog API is the only
  supported surface for printed card data — full stop, even in local dev
  (use the fixtures or the real catalog server instead, per
  [`architecture.md`](./architecture.md)).
- **Do not read `data/keywords.json` or `data/keyword_abilities.json`
  directly either**, for the same reason — fetch `keywords.json` from the
  catalog API (or its fixture). The submodule versions are the *input* to
  the exporter, not the *output* the site is contracted to consume, and they
  can differ in shape or content from what's actually published in a given
  release.
- **Do not touch `server/` (the relay/match server) or anything under
  `scenes/`/`scripts/` (the Godot game) at all.** They have nothing to do
  with the public catalog/stats contract and aren't part of this site's
  problem.
- **Don't pull anything else from this submodule into the site's build or
  CI** beyond the two sanctioned uses: running `catalog/`'s own server for
  local dev (per [`architecture.md`](./architecture.md)), and the catalog
  Vercel deployment importing `catalog/src/server.mjs` directly (per
  [`catalog-hosting.md`](./catalog-hosting.md)). Everything else in the
  submodule — the Godot game, `server/`, the raw faction JSON — stays a
  reference checkout, not a build dependency.
