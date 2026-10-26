export function getCatalogOrigin(): string | undefined {
  const origin = process.env.NEXT_PUBLIC_CATALOG_ORIGIN;
  if (!origin && process.env.NODE_ENV !== 'production') {
    console.warn('[config] NEXT_PUBLIC_CATALOG_ORIGIN is not set.');
  }
  return origin?.replace(/\/$/, ''); // never add a fallback domain
}
