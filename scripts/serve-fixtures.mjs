// Tiny zero-dependency static server for test/fixtures/, serving them under
// the same /data/v1/... paths the real catalog API uses. Lets local dev
// exercise the suppression/slice-absence/stats-published paths that the
// real catalog origin has no data for at all.
//
// Usage: node scripts/serve-fixtures.mjs
// Then: NEXT_PUBLIC_CATALOG_ORIGIN=http://localhost:8081

import { createReadStream, existsSync, statSync } from 'node:fs';
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
  const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'ETag' };
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { ...headers, 'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS' });
    res.end();
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { ...headers, 'Content-Type': 'application/json', Allow: 'GET, HEAD, OPTIONS' });
    res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ error: 'method not allowed' }));
    return;
  }

  const file = resolveFile(req.url ?? '/');
  if (!file || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { ...headers, 'Content-Type': 'application/json' });
    res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ error: 'not found' }));
    return;
  }
  const isRelease = path.relative(root, file).split(path.sep).includes('releases');
  res.writeHead(200, {
    ...headers,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': isRelease ? 'public, max-age=31536000, immutable' : 'no-cache',
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
