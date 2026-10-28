process.env.NEXT_PUBLIC_CATALOG_ORIGIN = 'http://test.local';

import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './msw/server';
import { navigationState, resetNavigation } from './helpers/navigation';

// No real Next.js App Router is mounted under RTL/jsdom, so any component
// using useSlice (next/navigation) needs this. It reads from the mutable
// navigationState so tests can drive the URL; left alone it yields '/cards'
// with no search params, which is what every test that doesn't care about
// navigation relied on before.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: (url: string) => {
      navigationState.pushes.push(url);
    },
  }),
  usePathname: () => navigationState.pathname,
  useSearchParams: () => navigationState.searchParams,
}));

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
  resetNavigation();
});

afterAll(() => server.close());
