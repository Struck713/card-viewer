'use client';

import { useContext } from 'react';
import { CatalogContext, type CatalogState } from './context';

export function useCatalog(): CatalogState {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error('useCatalog must be used within <AppProviders>');
  }
  return ctx;
}
