import { describe, expect, it } from 'vitest';
import type { CardWinrate } from '../../lib/api/types';
import {
  compareMatches,
  compareWinRate,
  isSuppressed,
  winRateValue,
} from '../../lib/format/suppression';

const won: CardWinrate = {
  id: 'a',
  matches: 4,
  wins: 3,
  losses: 1,
  winRate: 0.75,
};
// A genuine 0% — this card lost every game it was in. 59 of 168 cards were
// in this state when the live endpoint was last sampled, which is why
// telling it apart from `suppressed` is the whole point of this module.
const lostEverything: CardWinrate = {
  id: 'b',
  matches: 2,
  wins: 0,
  losses: 2,
  winRate: 0,
};
const suppressed: CardWinrate = {
  id: 'c',
  matches: 0,
  wins: 0,
  losses: 0,
  winRate: null,
};

describe('suppression', () => {
  it('treats null as suppressed and a real 0 as a value', () => {
    expect(isSuppressed(suppressed)).toBe(true);
    expect(isSuppressed(lostEverything)).toBe(false);
    expect(isSuppressed(won)).toBe(false);
  });

  it('treats a card with no row at all as suppressed', () => {
    expect(isSuppressed(undefined)).toBe(true);
  });

  it('degrades a missing key to suppressed rather than rendering undefined', () => {
    // The API always sends the key today, but it used to express
    // suppression by omitting it. If it ever regresses to that, the figure
    // must read "not enough data", not "undefined".
    expect(isSuppressed({ id: 'd' } as unknown as CardWinrate)).toBe(true);
  });

  it('winRateValue returns the raw value, never defaulting null to 0', () => {
    expect(winRateValue(won)).toBe(0.75);
    expect(winRateValue(lostEverything)).toBe(0);
    expect(winRateValue(suppressed)).toBe(null);
    expect(winRateValue(undefined)).toBe(null);
  });

  it('compareWinRate sorts suppressed last in both directions, with a real 0 ranked as a value', () => {
    const rows = [suppressed, won, lostEverything];
    const asc = [...rows].sort(compareWinRate('asc'));
    const desc = [...rows].sort(compareWinRate('desc'));

    // Ascending: the genuine 0% is the worst real figure and comes first;
    // the suppressed row is not a figure at all and comes last.
    expect(asc).toEqual([lostEverything, won, suppressed]);
    // Descending flips the real figures but leaves suppressed last — it
    // must never be ranked as 0, in either direction.
    expect(desc).toEqual([won, lostEverything, suppressed]);
  });

  it('compareMatches sorts counts plainly, since a count has no suppressed state', () => {
    const rows = [won, suppressed, lostEverything];
    expect([...rows].sort(compareMatches('asc'))).toEqual([
      suppressed,
      lostEverything,
      won,
    ]);
    expect([...rows].sort(compareMatches('desc'))).toEqual([
      won,
      lostEverything,
      suppressed,
    ]);
  });
});
