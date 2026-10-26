'use client';

import type { MatchType, TierGroup } from '../../lib/api/types';

const TIERS: TierGroup[] = ['low', 'mid', 'high', 'legend'];
const MATCHES: MatchType[] = ['ranked', 'casual', 'campaign'];

interface SliceSelectorProps {
  tierGroup: TierGroup;
  matchType: MatchType;
  onChange: (tierGroup: TierGroup, matchType: MatchType) => void;
}

// The only slicing that exists (tierGroup x matchType) — this is the one
// place that selection changes, so there is only one place to get the
// "don't silently drop rows on change" rule right.
export function SliceSelector({ tierGroup, matchType, onChange }: SliceSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="font-medium">Slice:</span>
      <label>
        Tier
        <select
          className="ml-1 rounded border border-neutral-300 px-1.5 py-1"
          value={tierGroup}
          onChange={(event) => onChange(event.target.value as TierGroup, matchType)}
        >
          {TIERS.map((tier) => (
            <option key={tier} value={tier}>
              {tier}
            </option>
          ))}
        </select>
      </label>
      <label>
        Match type
        <select
          className="ml-1 rounded border border-neutral-300 px-1.5 py-1"
          value={matchType}
          onChange={(event) => onChange(tierGroup, event.target.value as MatchType)}
        >
          {MATCHES.map((match) => (
            <option key={match} value={match}>
              {match}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
