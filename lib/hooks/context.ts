import { createContext } from 'react';
import type { CatalogResult, StatsResult } from '../api/errors';

export type CatalogState = { status: 'loading' } | CatalogResult;
export type StatsState = { status: 'loading' } | StatsResult;

// Fetched once per session in <AppProviders> and shared across client-side
// navigation — never re-fetched by individual pages.
export const CatalogContext = createContext<CatalogState | null>(null);
export const StatsContext = createContext<StatsState | null>(null);
