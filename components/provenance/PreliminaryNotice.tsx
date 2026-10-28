import Link from 'next/link';
import type { StatsMethodology } from '../../lib/api/types';

// The publisher marks this data preliminary and publishes with a minimum
// sample as low as one match, so roughly half the catalog can show 100% or
// 0% off a single game. Decision: show the figures and label them, rather
// than hiding them behind a threshold this site invented — but the label
// is not optional, and minSample is read from the payload so it can never
// drift from what was actually published.
//
// It also names the modes, because they include AI matches. The site's
// previous methodology copy asserted the opposite ("matches against AI
// never appear"), which is no longer true of this data.
export function PreliminaryNotice({
  methodology,
}: {
  methodology: StatsMethodology;
}) {
  const { minSample, modes } = methodology;
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      <strong className="font-medium">Preliminary statistics.</strong> These
      figures are published with a minimum sample of {minSample}{' '}
      {minSample === 1 ? 'match' : 'matches'}, so a win rate can rest on a
      single game — read &quot;100%&quot; from one match as &quot;won one
      game&quot;, not as a strong card. Every win rate is shown with its
      win–loss record. Matches counted include {modes.join(' and ')}.{' '}
      <Link href="/methodology" className="underline">
        How these are measured
      </Link>
      .
    </div>
  );
}
