import type { StatsMethod } from '../../lib/api/types';

interface MethodologyPanelProps {
  method: StatsMethod;
}

// Renders the method block VERBATIM — never paraphrase minSample,
// perAccountCap, etc., since they can change release to release
// (docs/pages-and-components.md).
export function MethodologyPanel({ method }: MethodologyPanelProps) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase text-neutral-500">Includes</dt>
          <dd className="text-sm">{method.includes}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-neutral-500">Minimum sample</dt>
          <dd className="text-sm">{method.minSample}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-neutral-500">
            Per-account cap
          </dt>
          <dd className="text-sm">{method.perAccountCap}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-neutral-500">Pair cap</dt>
          <dd className="text-sm">{method.pairCap}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-neutral-500">Rate precision</dt>
          <dd className="text-sm">{method.ratePrecision}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-neutral-500">
            Sample rounding
          </dt>
          <dd className="text-sm">{method.sampleRounding}</dd>
        </div>
      </dl>
      <p className="text-sm text-neutral-600">
        Only matches meeting the minimum sample above are counted. To stop any
        one player or matchup from skewing a figure, each account contributes at
        most {method.perAccountCap} matches toward a single card&apos;s
        statistics, and at most {method.pairCap} matches toward a single faction
        pairing. A card or pairing that still doesn&apos;t clear the minimum
        sample after capping is shown as &quot;not enough data&quot; rather than
        a potentially misleading rate.
      </p>
    </div>
  );
}
