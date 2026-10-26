# catalog-api

The interim production catalog, embedded in this app instead of its own
Vercel project. See `../docs/catalog-hosting.md` for why and `../pages/api/catalog.js`
for the route that serves it (via a `/data/v1/:path*` and `/healthz` rewrite
in `../next.config.ts`).

`server.mjs` and `public/` here are **literal copies**, not a live import
from `vendor/cardgame/catalog` — Vercel doesn't check out submodules without
extra config, and forking the upstream game repo wasn't worth it for a
stopgap. `pages/api/catalog.js` pulls `server.mjs`'s request handler out of
the `http.Server` it normally runs in under Railway and calls it directly
from a Next.js Pages API route instead — same 404/CORS/cache logic, different
host.

This is explicitly meant to be deleted, along with `pages/api/catalog.js`
and the rewrites in `next.config.ts`, once a real external catalog origin
exists; see `../docs/catalog-hosting.md`'s migration section.

## Keeping it in sync

If `vendor/cardgame` is ever bumped with new card data, re-copy — this
directory does not update itself:

```bash
cp ../vendor/cardgame/catalog/src/server.mjs ./server.mjs
cp -r ../vendor/cardgame/catalog/public ./public
# commit, then redeploy this site
```

## Smoke test after deploying

```bash
curl -s https://<this-site>/data/v1/latest.json   # candidate index
curl -s https://<this-site>/healthz                # { "status": "ok", ... }
curl -s -o /dev/null -w '%{http_code}\n' https://<this-site>/nope.json  # 404, JSON body
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://<this-site>/data/v1/latest.json  # 405
```
