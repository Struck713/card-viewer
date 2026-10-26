# catalog-deploy

Interim production deployment of the card catalog API, as its own Vercel
project (Root Directory = `catalog-deploy`, Framework Preset "Other").

`server.mjs` and `public/` here are **literal copies**, not a live import
from `vendor/cardgame/catalog` — see `../docs/catalog-hosting.md` for why
(Vercel doesn't check out submodules without extra config, and forking the
upstream game repo wasn't worth it for a stopgap). `api/catalog.js` pulls
`server.mjs`'s request handler out of the `http.Server` it normally runs
in under Railway, and runs it as a Vercel Node serverless function instead
— same 404/CORS/cache logic, different host.

This is explicitly meant to be decommissioned once a real external catalog
origin exists; see `../docs/catalog-hosting.md`'s migration section.

## Keeping it in sync

If `vendor/cardgame` is ever bumped with new card data, re-copy and
redeploy — this directory does not update itself:

```bash
cp -r ../vendor/cardgame/catalog/public ./public
cp ../vendor/cardgame/catalog/src/server.mjs ./server.mjs
# commit, then redeploy this Vercel project
```

## Smoke test after deploying

```bash
curl -s https://<this-deployment>/data/v1/latest.json   # candidate index
curl -s https://<this-deployment>/healthz                # { "status": "ok", ... }
curl -s -o /dev/null -w '%{http_code}\n' https://<this-deployment>/nope.json  # 404, JSON body
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://<this-deployment>/data/v1/latest.json  # 405
```
