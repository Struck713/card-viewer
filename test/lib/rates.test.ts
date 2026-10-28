import { describe, expect, it } from 'vitest';
import { formatRate, formatRecord } from '../../lib/format/rates';

describe('formatRate', () => {
  it('renders one decimal place', () => {
    expect(formatRate(0.5612)).toBe('56.1%');
  });

  it('renders a real 0 as 0.0%, distinctly from a suppressed figure', () => {
    expect(formatRate(0)).toBe('0.0%');
  });

  it('rounds the full float precision the API sends', () => {
    expect(formatRate(0.6666666666666666)).toBe('66.7%');
    expect(formatRate(1)).toBe('100.0%');
  });
});

describe('formatRecord', () => {
  it('renders wins and losses as a record', () => {
    expect(formatRecord(3, 1)).toBe('3–1');
    expect(formatRecord(0, 0)).toBe('0–0');
  });
});
