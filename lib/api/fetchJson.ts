import { HttpError, NetworkError } from './errors';

// The only place in this app that calls fetch() against the catalog/stats
// API. GET only, no credentials/cookies/auth headers — the API is
// anonymous, wildcard-CORS, and there is nothing on the other end to
// authenticate (docs/data-layer.md).
export async function fetchResponse(url: string, headers?: HeadersInit): Promise<Response> {
  try {
    return await fetch(url, { method: 'GET', credentials: 'omit', headers });
  } catch (error) {
    throw new NetworkError(url, error);
  }
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetchResponse(url);
  if (!res.ok) {
    throw new HttpError(url, res.status);
  }
  try {
    return (await res.json()) as T;
  } catch (error) {
    throw new NetworkError(url, error);
  }
}
