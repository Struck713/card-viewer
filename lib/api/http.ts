import { HttpError, NetworkError } from './errors';

// The only place in this app that calls fetch() against the catalog/stats
// API. GET only, no credentials/cookies/auth headers, no custom request
// headers, no cache option — the API is anonymous, wildcard-CORS, sends
// Cache-Control: no-cache on every file, and the site is approved to hit it
// directly on every load with nothing cached in between (2026-10-28).
export async function fetchJson<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method: 'GET', credentials: 'omit' });
  } catch (error) {
    throw new NetworkError(url, error);
  }
  if (!res.ok) throw new HttpError(url, res.status);
  try {
    return (await res.json()) as T;
  } catch (error) {
    throw new NetworkError(url, error);
  }
}
