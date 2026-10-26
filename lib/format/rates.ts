// Fraction in [0, 1] -> percentage string, at most one decimal place
// (method.ratePrecision is "0.1 percentage points" — read from the API,
// never hardcoded as a display assumption beyond this rounding).
export function formatRate(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}
