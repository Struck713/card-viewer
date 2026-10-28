import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it } from 'vitest';
import { useSlice } from '../../lib/hooks/useSlice';
import { navigationState, setSearchParams } from '../helpers/navigation';

describe('useSlice URL handling', () => {
  it('defaults to mid/ranked when the URL says nothing', () => {
    const { result } = renderHook(() => useSlice());
    expect(result.current.tierGroup).toBe('mid');
    expect(result.current.matchType).toBe('ranked');
    expect(result.current.releaseId).toBeNull();
    expect(result.current.catalogVersion).toBeNull();
  });

  it('reads tier/match/stats/catalog out of the URL', () => {
    setSearchParams({
      tier: 'legend',
      match: 'casual',
      stats: 'stats-1.0.0-r1',
      catalog: '1.2.3',
    });
    const { result } = renderHook(() => useSlice());
    expect(result.current.tierGroup).toBe('legend');
    expect(result.current.matchType).toBe('casual');
    expect(result.current.releaseId).toBe('stats-1.0.0-r1');
    expect(result.current.catalogVersion).toBe('1.2.3');
  });

  it('falls back to the defaults for values outside the contract', () => {
    // The contract has exactly four tiers and three match types; a URL
    // naming anything else must not reach the slice lookup.
    setSearchParams({ tier: 'platinum', match: 'draft' });
    const { result } = renderHook(() => useSlice());
    expect(result.current.tierGroup).toBe('mid');
    expect(result.current.matchType).toBe('ranked');
  });

  it('keeps the pin when changing slice', () => {
    setSearchParams({ stats: 'stats-1.0.0-r1', catalog: '1.2.3' });
    const { result } = renderHook(() => useSlice());

    act(() => result.current.setSlice('high', 'campaign'));

    expect(navigationState.pushes).toHaveLength(1);
    const pushed = navigationState.pushes[0];
    expect(pushed).toContain('tier=high');
    expect(pushed).toContain('match=campaign');
    // Changing the slice must not silently drop the release you pinned.
    expect(pushed).toContain('stats=stats-1.0.0-r1');
    expect(pushed).toContain('catalog=1.2.3');
  });

  it('toQueryString carries the pin; unpinnedQueryString drops it', () => {
    setSearchParams({
      tier: 'low',
      match: 'casual',
      stats: 'stats-1.0.0-r1',
      catalog: '1.2.3',
    });
    const { result } = renderHook(() => useSlice());

    const pinned = new URLSearchParams(result.current.toQueryString());
    expect(pinned.get('tier')).toBe('low');
    expect(pinned.get('match')).toBe('casual');
    expect(pinned.get('stats')).toBe('stats-1.0.0-r1');
    expect(pinned.get('catalog')).toBe('1.2.3');

    // The "back to latest" link: same slice, no pin.
    const unpinned = new URLSearchParams(result.current.unpinnedQueryString());
    expect(unpinned.get('tier')).toBe('low');
    expect(unpinned.get('match')).toBe('casual');
    expect(unpinned.has('stats')).toBe(false);
    expect(unpinned.has('catalog')).toBe(false);
  });

  it('findSlice matches on the selected tier and match type only', () => {
    setSearchParams({ tier: 'high', match: 'casual' });
    const { result } = renderHook(() => useSlice());
    const slices = [
      { tierGroup: 'mid', matchType: 'ranked', marker: 'wrong' },
      { tierGroup: 'high', matchType: 'casual', marker: 'right' },
    ] as const;
    expect(result.current.findSlice([...slices])?.marker).toBe('right');
  });
});
