import { describe, expect, it } from 'vitest';
import type { CardStat } from '../../lib/api/types';
import {
  compareStat,
  isSuppressed,
  statValue,
} from '../../lib/format/suppression';

const withRate: CardStat = { id: 'a', winRateWhenPlayed: 0.6 };
const suppressed: CardStat = { id: 'b', drawRate: 0.5 }; // no winRateWhenPlayed key at all
const alsoSuppressed: CardStat = { id: 'c' };

describe('suppression', () => {
  it('isSuppressed is true only when the key is absent, never based on falsy values', () => {
    expect(isSuppressed(withRate, 'winRateWhenPlayed')).toBe(false);
    expect(isSuppressed(suppressed, 'winRateWhenPlayed')).toBe(true);
    expect(
      isSuppressed({ id: 'z', winRateWhenPlayed: 0 }, 'winRateWhenPlayed'),
    ).toBe(false);
  });

  it('statValue returns the raw value, never defaulting a missing key to 0', () => {
    expect(statValue(withRate, 'winRateWhenPlayed')).toBe(0.6);
    expect(statValue(suppressed, 'winRateWhenPlayed')).toBeUndefined();
  });

  it('compareStat sorts suppressed rows last in both directions, never as 0', () => {
    const rows = [suppressed, withRate, alsoSuppressed];
    const asc = [...rows].sort(compareStat('winRateWhenPlayed', 'asc'));
    const desc = [...rows].sort(compareStat('winRateWhenPlayed', 'desc'));

    expect(asc[0]).toBe(withRate);
    expect(asc.slice(1)).toEqual(
      expect.arrayContaining([suppressed, alsoSuppressed]),
    );
    expect(desc[0]).toBe(withRate);
    expect(desc.slice(1)).toEqual(
      expect.arrayContaining([suppressed, alsoSuppressed]),
    );
  });
});
