process.env.NEXT_PUBLIC_CATALOG_ORIGIN = 'http://test.local';

import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './msw/server';
import { navigationState, resetNavigation } from './helpers/navigation';

// No real Next.js App Router is mounted under RTL/jsdom, so any component
// reaching for next/navigation needs this. Nothing reads search params any
// more now that the URL selects nothing, but next/link still wants a
// router, and usePathname is kept so the mock stays a faithful stand-in.
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
