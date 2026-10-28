// Tiny zero-dependency static server for test/fixtures/, serving them at
// the same flat /data/... paths the real catalog API uses, and mirroring
// its transport closely enough to be worth developing against:
//
//   - everything is Cache-Control: no-cache, because nothing the real API
//     serves is immutable any more;
//   - /data/cards.json and /data/keywords.json carry a content-hash ETag
//     and honour If-None-Match with a 304, as the real origin does;
//   - /data/stats/... deliberately carries NO ETag, also as the real
//     origin does, so local dev reproduces the fact that statistics can
//     never be conditionally revalidated.
//
// Lets local dev exercise the paths the live origin can't produce on
// demand: statistics 404ing, a card with no row, and preliminary: false.
//
// Usage: node scripts/serve-fixtures.mjs
// Then: NEXT_PUBLIC_CATALOG_ORIGIN=http://localhost:8081

import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', 'test', 'fixtures');
const port = Number(process.env.PORT ?? 8081);

function resolveFile(rawPath) {
  const decoded = decodeURIComponent(rawPath.split('?')[0]);
  const parts = decoded.split('/').filter((p) => p !== '');
  if (parts.some((p) => p === '.' || p === '..')) return null;
  const file = path.join(root, ...parts);
  const rel = path.relative(root, file);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return file;
}

const server = http.createServer((req, res) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers': 'ETag',
  };
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      ...headers,
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'If-None-Match',
    });
    res.end();
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {
      ...headers,
      'Content-Type': 'application/json',
      Allow: 'GET, HEAD, OPTIONS',
    });
    res.end(
      req.method === 'HEAD'
        ? undefined
        : JSON.stringify({ error: 'method not allowed' }),
    );
    return;
  }

  const file = resolveFile(req.url ?? '/');
  if (!file || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { ...headers, 'Content-Type': 'application/json' });
    res.end(
      req.method === 'HEAD'
        ? undefined
        : JSON.stringify({ error: 'not found' }),
    );
    return;
  }
  // Statistics get no ETag, matching the live origin — see the header
  // comment. Everything else gets a content hash and a real 304.
  const servesEtag = !path
    .relative(root, file)
    .split(path.sep)
    .includes('stats');
  const etag = servesEtag
    ? `"${createHash('md5').update(readFileSync(file)).digest('hex')}"`
    : null;

  if (etag && req.headers['if-none-match'] === etag) {
    res.writeHead(304, { ...headers, ETag: etag, 'Cache-Control': 'no-cache' });
    res.end();
    return;
  }

  res.writeHead(200, {
    ...headers,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
    ...(etag ? { ETag: etag } : {}),
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log(`fixture server on :${port}, serving ${root}`);
});
