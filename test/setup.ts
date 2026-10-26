process.env.NEXT_PUBLIC_CATALOG_ORIGIN = 'http://test.local';

import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './msw/server';

// No real Next.js App Router is mounted under RTL/jsdom, so any component
// using useSlice (next/navigation) needs this. Default pathname/no search
// params is enough for every test that doesn't specifically exercise slice
// navigation — useSlice falls back to its mid/ranked defaults.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: () => {} }),
  usePathname: () => '/cards',
  useSearchParams: () => new URLSearchParams(),
}));

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
});

afterAll(() => server.close());
