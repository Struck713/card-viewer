// Embeds the catalog API inside this app's own Vercel deployment, instead
// of a separate `catalog-deploy` project. See ../../docs/catalog-hosting.md.
//
// `createCatalogServer`'s request handler is a plain `(req, res)` Node
// callback — the same shape Next.js's Node (Pages API) runtime calls
// directly. Pull it out rather than reimplementing its 404/CORS/cache/ETag
// logic.
import { createCatalogServer } from '../../catalog-api/server.mjs';
import path from 'node:path';

export const config = {
  api: {
    externalResolver: true,
  },
};

const root = path.join(process.cwd(), 'catalog-api', 'public');
const handle = createCatalogServer(root).listeners('request')[0];

export default function handler(req, res) {
  handle(req, res);
}
