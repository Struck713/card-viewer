# Hosting the catalog ourselves (for now)

## Decision

There is no third-party `CATALOG_ORIGIN` to point at. The owner has decided
that, **for now, this project hosts the catalog itself** — a stand-in, not
a permanent arrangement — by taking the catalog package out of the
`vendor/cardgame` submodule and embedding it directly in this Next.js app,
as an API route (`pages/api/catalog.js`) in the same Vercel deployment as
the card viewer itself, rather than as a separate project. Once this site
is deployed, its own URL *is* `CATALOG_ORIGIN`.

This supersedes an earlier version of this decision, where the catalog was
deployed as a second, separate Vercel project
(`catalog-deploy/`). That split added a deployment for no real benefit once
it was clear the site and the catalog would always ship from the owner's
same account on the same cadence anyway; collapsing them into one project
is simpler to operate and is still just as swappable later (see
"Migrating to an externally hosted catalog" below) — `CATALOG_ORIGIN`
doesn't care how many Vercel projects sit behind it.

This is explicitly a stopgap. If the game's own team (the people behind
`vendor/cardgame`) later deploys the catalog themselves — e.g. the Railway
deployment their own `catalog/README.md` already describes as "prepared,
not done" — **that becomes the real source of truth, and we flip
`CATALOG_ORIGIN` to point at it.** See "Migrating to an externally hosted
catalog" below for exactly what that flip does and doesn't involve.

This supersedes the "not deployed anywhere, origin unknown" status recorded
earlier in [`deployment.md`](./deployment.md) and
[`open-questions.md`](./open-questions.md) — both are updated accordingly.
It does **not** change anything about how the Next.js site *consumes* the
API (see [`data-layer.md`](./data-layer.md)): the site still only knows
about `CATALOG_ORIGIN` through config, and still can't assume it's
reachable (the stats half of it still isn't published — see below). That
fact — the site treats `CATALOG_ORIGIN` as an opaque, swappable origin — is
exactly what makes the future flip a config change instead of a rewrite.
Keep it that way; see the guardrails below.

## What's actually being hosted

`vendor/cardgame/catalog` is a complete, self-contained package:

```
catalog/
  src/export.mjs     # faction JSON -> versioned static files
  src/server.mjs      # the read-only HTTP server that serves them
  public/              # ALREADY EXPORTED — the candidate release, as of the pinned submodule commit:
    data/v1/latest.json
    data/v1/releases/0.1.0-candidate.1/cards.json
    data/v1/releases/0.1.0-candidate.1/keywords.json
```

That `public/` directory is not a hypothetical — it's already sitting in the
submodule, checked by `cat vendor/cardgame/catalog/public/data/v1/latest.json`.
It's the `0.1.0-candidate.1` / `unreleased` candidate, same placeholders
called out everywhere else in these docs. Hosting it doesn't turn it into a
real, owner-approved release — it just makes the candidate reachable. The
submodule's own `catalog/README.md` says publishing "needs owner approval of
target and spend"; doing this *is* that approval, for this candidate, for
now. If the owner later finalizes a real `catalogVersion`/`gameVersion`, redo
the export with the real `release-input.json` values and redeploy (see
"Keeping it in sync" below) — don't just relabel the existing files.

There is still no `stats/` anything in this package — the stats API remains
unimplemented (confirmed directly in the submodule). Hosting the catalog
does not change that; the site still needs to run fully in card-browser-only
mode until a stats release exists. See
[`suppression-and-states.md`](./suppression-and-states.md).

## Hosting approach: reuse `server.mjs`, don't reinvent it

Serving `public/` as plain static files would be the least work, but it
quietly breaks the contract the whole site is built against: plain static
hosting returns its own HTML 404 page for an unknown path (spec §4.4
requires a real JSON 404 body), doesn't add
`Access-Control-Allow-Origin: *` or the exact `Cache-Control`/`ETag`
behavior the spec requires, and doesn't restrict methods to
`GET`/`HEAD`/`OPTIONS`.

`catalog/src/server.mjs` already implements all of that correctly and is
already tested (`catalog/test/server.test.mjs` in the submodule covers real
404s, CORS + preflight, `Cache-Control`, `ETag` → `304`, `HEAD`,
traversal/dotfile refusal). **Reuse it as a Next.js API route instead of
re-implementing any of that.** Its request handler is a plain
`(req, res) => { ... }` Node callback — the same shape Next.js's Pages API
(Node) runtime calls directly — it's just currently wrapped in
`http.createServer(...)` for a long-running process (Railway's model, not
Vercel's serverless/Next.js model). Pull the callback back out rather than
copying its logic:

```js
// pages/api/catalog.js — a Next.js Pages API route, Node runtime
import { createCatalogServer } from '../../catalog-api/server.mjs';
import path from 'node:path';

const root = path.join(process.cwd(), 'catalog-api', 'public');
// createCatalogServer returns an http.Server; its request listener is the
// same (req, res) handler Next.js's Node runtime calls directly.
const handle = createCatalogServer(root).listeners('request')[0];

export default function handler(req, res) {
  handle(req, res);
}
```

with a `rewrites()` entry in this app's own `next.config.ts` routing the
real paths to it (Pages API routes normally only match under `/api/*`, so
the public-facing paths need an explicit rewrite):

```ts
async rewrites() {
  return [
    { source: "/data/v1/:path*", destination: "/api/catalog" },
    { source: "/healthz", destination: "/api/catalog" },
  ];
},
```

This is "hosting them in the way provided" literally: the serving logic is
the submodule's own, unmodified, just placed on a different platform than
the Railway config (`catalog/railway.json`) it was originally prepared for,
and now living inside this app's own deployment rather than a separate one.
Don't fork or reimplement `server.mjs`'s behavior — import it.

### Where this lives

The catalog (`server.mjs` + its exported `public/`, copied into
`catalog-api/` at this repo's root — see "What's actually being hosted"
below) is embedded **inside this Next.js app's own Vercel project**, via
`pages/api/catalog.js` and the `next.config.ts` rewrites above. It is not a
separate project. This means:

- One deployment to manage instead of two; the catalog ships whenever the
  site does.
- `NEXT_PUBLIC_CATALOG_ORIGIN` in production is just this site's own URL —
  still exactly the same shape as if a third party had published it from
  somewhere else entirely, so nothing in `data-layer.md` or
  `architecture.md` changes. The site's fetch code has no idea the origin
  it's calling happens to be itself; see the guardrails below for why that
  must stay true.

## Keeping it in sync

The submodule is pinned to a specific commit of the game repo. The exported
`public/` directory only reflects that commit's `release-input.json` at
export time. When the submodule is bumped (see
[`reverse-engineering.md`](./reverse-engineering.md) for the update
procedure), re-run the export, copy the result into `catalog-api/public/`,
and redeploy this site — nothing updates itself:

```bash
cd vendor/cardgame/catalog
npm run export     # regenerates public/data/v1/... from release-input.json
cd ../../..
cp -r vendor/cardgame/catalog/public catalog-api/public
cp vendor/cardgame/catalog/src/server.mjs catalog-api/server.mjs
# commit the updated submodule pointer and catalog-api/, then redeploy this site
```

Never hand-edit anything under `catalog/public/` or `catalog-api/public/`;
both are generated output.

## What doesn't change

- The site's data layer still treats `CATALOG_ORIGIN` as config, still
  validates `schemaVersion`, still handles a 404 on `stats/latest.json` as
  "not published yet" rather than assuming stats will show up just because
  the catalog is now reachable.
- `vendor/cardgame`'s raw `data/cards/*.json` is still off-limits as a data
  source (see [`reverse-engineering.md`](./reverse-engineering.md)) — this
  plan hosts the catalog's own **exported, public** files
  (`catalog/public/...`), never the internal faction JSON that feeds the
  exporter.

## Migrating to an externally hosted catalog (the future state)

When the game's own team publishes a real catalog origin — their own
Railway deployment, or anything else — switching to it should be a
**one-line config change, nothing more**:

```
NEXT_PUBLIC_CATALOG_ORIGIN=https://whatever-they-actually-deployed.example.com
```

updated in the stats site's Vercel project settings, then redeployed. At
that point:

- Our embedded catalog API (this doc's whole subject —
  `catalog-api/`, `pages/api/catalog.js`, and the `rewrites()` entries in
  `next.config.ts`) becomes unnecessary and should be deleted outright —
  don't keep it running as a silent fallback or mirror; a stale second
  source of "the catalog" is exactly the kind of inconsistency the
  suppression/provenance rules in
  [`suppression-and-states.md`](./suppression-and-states.md) exist to catch,
  and there's no reason to invite it deliberately.
- Their deployment becomes the actual driver of card data — names, costs,
  text, everything the site renders comes from whatever release they
  publish under their own `release-input.json`, not from the candidate
  we've been serving. Expect `catalogVersion`/`gameVersion` to change to
  real values at that point (ours were always the `0.1.0-candidate.1` /
  `unreleased` placeholders).
- If they later publish the **stats** API too (still unimplemented
  anywhere as of this writing), it arrives the same way — point
  `stats/latest.json` discovery at their origin, no site code change,
  since the site already treats "stats API reachable" as a runtime fact to
  check for, not a build-time assumption (see
  [`suppression-and-states.md`](./suppression-and-states.md)).

### Guardrails that keep this swap cheap

Because the eventual flip depends on the site never having quietly
coupled itself to *our specific deployment* of the catalog, a few rules
apply specifically because we're also the ones hosting it right now —
and embedding the catalog in the same app and the same deployment as the
site, rather than a separate project, makes this easier to get wrong by
accident, not less important to follow:

- Never special-case behavior based on "the catalog origin happens to be
  ours," and specifically never based on "the catalog origin happens to be
  this same deployment" now that it literally is sometimes — no
  same-origin shortcuts (no relative fetches, no skipping `fetch`'s
  `mode`/`credentials` handling, no importing `catalog-api/` logic directly
  from `lib/api/` instead of going over HTTP), no skipping the
  CORS/error-handling code paths in [`data-layer.md`](./data-layer.md)
  because "we know our own server doesn't need it." The site must work
  identically against our deployment and a future unrelated one —
  `getCatalogOrigin()` must stay the only thing that knows the origin, and
  it must stay config, not a hardcoded same-origin assumption.
- Never depend on anything from our deployment beyond what the spec and
  `catalog/README.md` actually promise. Our `pages/api/catalog.js` happens
  to wrap `server.mjs` verbatim, so it has no extra behavior today — but
  don't add any (a debug endpoint, a looser CORS policy, an extra header)
  that an externally hosted catalog wouldn't also provide.
- Keep `catalogVersion` plumbed through from the index file, never
  hardcoded anywhere in the site, so a real release's version simply
  replaces the candidate's without a code change.
