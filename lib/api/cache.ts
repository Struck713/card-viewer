import { HttpError, NetworkError } from './errors';
import { fetchResponse } from './http';

// Every file the API serves is `Cache-Control: no-cache`, so every load
// revalidates; cards.json and keywords.json carry an ETag, card-winrates
// .json does not (it just always takes the 200 path). Nothing is immutable
// and nothing is addressed by a release id, so there is no forever-cache
// here — only a stored body to replay on a 304.
//
// All storage access is wrapped in try/catch: private browsing or blocked
// storage degrades to "just refetch", never throws.

const ETAG_PREFIX = 'cardgame-viewer:etag:';
const BODY_PREFIX = 'cardgame-viewer:body:';

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

async function parseAndCache<T>(
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

// Conditional GET with an If-None-Match when we have a stored ETag, and a
// stored body to serve the resulting 304 from.
export async function fetchRevalidated<T>(url: string): Promise<T> {
  const etagKey = ETAG_PREFIX + url;
  const bodyKey = BODY_PREFIX + url;
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
    return parseAndCache<T>(fresh, url, etagKey, bodyKey);
  }
  if (!res.ok) {
    throw new HttpError(url, res.status);
  }
  return parseAndCache<T>(res, url, etagKey, bodyKey);
}
