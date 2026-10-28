import type { StatsMethodology } from '../../lib/api/types';

interface MethodologyPanelProps {
  methodology: StatsMethodology;
}

// Renders the methodology block VERBATIM — never paraphrase the values,
// since the publisher can change them without notice and there is no
// version field that would tell us they had
// (docs/pages-and-components.md).
//
// The site's own plain-language gloss is kept clearly separate, below the
// verbatim list, so it is never mistaken for published data.
export function MethodologyPanel({ methodology }: MethodologyPanelProps) {
  const {
    metric,
    modes,
    aiSeats,
    copies,
    rulesVersions,
    minSample,
    preliminary,
    privacy,
  } = methodology;

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase text-neutral-500">Metric</dt>
          <dd className="font-mono text-sm">{metric}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-neutral-500">Modes</dt>
          <dd className="font-mono text-sm">{modes.join(', ')}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-neutral-500">AI seats</dt>
          <dd className="font-mono text-sm">{aiSeats}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-neutral-500">Copies</dt>
          <dd className="font-mono text-sm">{copies}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-neutral-500">Rules versions</dt>
          <dd className="font-mono text-sm">{rulesVersions}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-neutral-500">Minimum sample</dt>
          <dd className="text-sm">
            {minSample} {minSample === 1 ? 'match' : 'matches'}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-neutral-500">Preliminary</dt>
          <dd className="text-sm">{preliminary ? 'Yes' : 'No'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase text-neutral-500">Privacy</dt>
          <dd className="text-sm">{privacy}</dd>
        </div>
      </dl>
      <div className="space-y-2 border-t border-neutral-200 pt-4 text-sm text-neutral-600">
        <p className="text-xs uppercase text-neutral-500">
          What that means, in plain terms
        </p>
        <p>
          A card counts toward a match when it was in a player&apos;s starting
          deck, counted once per player per game however many copies the deck
          held. Win rate is that player&apos;s wins over those matches — it
          measures decks that included the card, not the card&apos;s own
          contribution.
        </p>
        <p>
          Matches against AI opponents are included, and figures from different
          rules versions are combined rather than reported separately.
        </p>
        <p>
          A minimum sample of {minSample}{' '}
          {minSample === 1 ? 'match' : 'matches'} means a figure can rest on
          very few games, so every win rate is shown beside its win–loss record.
          A card with no qualifying games has no win rate at all and is shown as
          &quot;not enough data&quot; — never as 0%, which is a real result
          meaning the card lost every game it was in.
        </p>
      </div>
    </div>
  );
}
