// The site stores nothing now. Sweep every key the data layer ever wrote:
// the ETag/body pairs this change retires, plus the older
// release-addressed keys from before the flat API.
export function pruneLegacyStorage(): void {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('cardgame-viewer:') || key.includes('/data/v1/')) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // private browsing / blocked storage. Dead keys are harmless.
  }
}
