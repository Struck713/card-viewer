// The API publishes no precision hint any more (the old method block's
// ratePrecision is gone), so one decimal place is this site's choice. Keep
// every rate going through here so there stays exactly one place that
// decides it.
//
// Takes a non-null fraction only: a suppressed figure must be routed to
// "not enough data" by lib/format/suppression.ts before it gets here, so
// that a null can never be formatted as "0.0%".
export function formatRate(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}

// Sample size as a win-loss record, e.g. "3–1". Shown beside every rate:
// with minSample as low as 1, a figure is only honest next to its count.
export function formatRecord(wins: number, losses: number): string {
  return `${wins}–${losses}`;
}
