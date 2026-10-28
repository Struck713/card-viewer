'use client';

import { useContext } from 'react';
import { StatsContext, type StatsState } from './context';

export function useStats(): StatsState {
  const ctx = useContext(StatsContext);
  if (!ctx) {
    throw new Error('useStats must be used within <AppProviders>');
  }
  return ctx;
}
