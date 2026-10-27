import { HttpError, NetworkError } from './errors';
import { fetchJson, fetchResponse } from './fetchJson';

// Per docs/data-layer.md: index files (latest.json) are no-cache + ETag, so
// every load revalidates; release files are immutable forever and cached by
// release id. All storage access is wrapped in try/catch — private
// browsing or blocked storage degrades to "just refetch", never throws.

const ETAG_PREFIX = 'cardgame-viewer:etag:';
const INDEX_BODY_PREFIX = 'cardgame-viewer:index-body:';
const RELEASE_PREFIX = 'cardgame-viewer:release:';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore: private browsing / storage quota / blocked storage
  }
}

async function parseAndCacheIndex<T>(
  res: Response,
  url: string,
  etagKey: string,
  bodyKey: string,
): Promise<T> {
  let body: T;
  try {
    body = (await res.json()) as T;
  } catch (error) {
    throw new NetworkError(url, error);
  }
  const etag = res.headers.get('ETag');
  if (etag) safeSet(etagKey, etag);
  safeSet(bodyKey, JSON.stringify(body));
  return body;
}

export async function fetchIndexFile<T>(url: string): Promise<T> {
  const etagKey = ETAG_PREFIX + url;
  const bodyKey = INDEX_BODY_PREFIX + url;
  const etag = safeGet(etagKey);
  const res = await fetchResponse(
    url,
    etag ? { 'If-None-Match': etag } : undefined,
  );

  if (res.status === 304) {
    const cached = safeGet(bodyKey);
    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        // corrupted cache entry: fall through to an unconditional refetch
      }
    }
    const fresh = await fetchResponse(url);
    if (!fresh.ok) throw new HttpError(url, fresh.status);
    return parseAndCacheIndex<T>(fresh, url, etagKey, bodyKey);
  }
  if (!res.ok) {
    throw new HttpError(url, res.status);
  }
  return parseAndCacheIndex<T>(res, url, etagKey, bodyKey);
}

export async function fetchReleaseFile<T>(
  url: string,
  releaseKey: string,
): Promise<T> {
  const key = `${RELEASE_PREFIX}${releaseKey}:${url}`;
  const cached = safeGet(key);
  if (cached) {
    try {
      return JSON.parse(cached) as T;
    } catch {
      // corrupted cache entry: fall through to a refetch
    }
  }
  const body = await fetchJson<T>(url);
  safeSet(key, JSON.stringify(body));
  return body;
}
