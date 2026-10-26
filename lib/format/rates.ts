// method.ratePrecision is free text (e.g. "0.1 percentage points"), not a
// machine-readable decimal-places field — derive it from the leading
// number's fractional digits rather than guessing at an undefined schema
// beyond that. Falls back to one decimal place if nothing parses.
function decimalPlacesFromPrecision(ratePrecision: string): number {
  const match = ratePrecision.match(/^(\d+)(?:\.(\d+))?/);
  if (!match) return 1; // unparseable: fall back to the safe default
  return match[2]?.length ?? 0; // matched a whole number (e.g. "1 percentage point") -> 0 decimals
}

// Fraction in [0, 1] -> percentage string. Reads its decimal precision
// from method.ratePrecision when given — never hardcode "0.1" as a display
// assumption, since it can change release to release
// (docs/data-contract.md's non-negotiable rule #6).
export function formatRate(fraction: number, ratePrecision?: string): string {
  const decimals = ratePrecision ? decimalPlacesFromPrecision(ratePrecision) : 1;
  return `${(fraction * 100).toFixed(decimals)}%`;
}
