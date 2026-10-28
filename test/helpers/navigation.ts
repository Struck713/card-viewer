// Mutable stand-in for the App Router, shared by the global
// next/navigation mock in test/setup.ts.
//
// The mock used to hardcode an always-empty useSearchParams(), which made
// every URL-driven behaviour (slice selection, ?stats= pinning) untestable
// — components fell back to their defaults no matter what. Tests that care
// drive this; every other test gets the same empty-params defaults as
// before, via resetNavigation() in afterEach.
export const navigationState = {
  pathname: '/cards',
  searchParams: new URLSearchParams(),
  // Every router.push() made during a test, in order.
  pushes: [] as string[],
};

export function setSearchParams(init: string | Record<string, string>): void {
  navigationState.searchParams = new URLSearchParams(init);
}

export function setPathname(pathname: string): void {
  navigationState.pathname = pathname;
}

export function resetNavigation(): void {
  navigationState.pathname = '/cards';
  navigationState.searchParams = new URLSearchParams();
  navigationState.pushes = [];
}
