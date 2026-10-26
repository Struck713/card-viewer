// '—' for null is semantically "not applicable" (a stratagem has no
// attack/health) — visually distinct from a suppressed "not enough data"
// statistic, which uses different copy entirely.
export function formatAttackHealth(value: number | null): string {
  return value === null ? '—' : String(value);
}
