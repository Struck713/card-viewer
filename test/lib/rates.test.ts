import { describe, expect, it } from 'vitest';
import { formatRate } from '../../lib/format/rates';

describe('formatRate', () => {
  it('defaults to one decimal place when no ratePrecision is given', () => {
    expect(formatRate(0.5612)).toBe('56.1%');
  });

  it('reads decimal places from method.ratePrecision instead of hardcoding one', () => {
    expect(formatRate(0.5612, '0.01 percentage points')).toBe('56.12%');
    expect(formatRate(0.5612, '1 percentage point')).toBe('56%');
  });
});
