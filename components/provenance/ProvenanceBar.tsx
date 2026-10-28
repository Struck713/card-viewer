'use client';

import Link from 'next/link';
import { useStats } from '../../lib/hooks/useStats';

// Formats to the minute, with the raw ISO string kept in dateTime/title.
//
// Not to the second on purpose: the origin recomputes this file on roughly
// a 60-second TTL and stamps generatedAt with its own generation time, so
// second-level precision would visibly churn on every reload while not a
// single figure changed (observed directly — see docs/data-contract.md).
function formatGeneratedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Mounted on every page that shows a statistic.
//
// generatedAt is the only provenance the API publishes: there is no
// release id, no catalog version and no game version anywhere in it any
// more. It is labelled "Data as of" rather than "Released" or "Generated
// on" because that is what it actually is — when the server last
// recomputed, not when anything was published. Calling it a release would
// be inventing an identifier the API doesn't have.
export function ProvenanceBar() {
  const stats = useStats();

  if (stats.status !== 'ok') {
    // Without statistics there is no provenance to show, and the page's
    // own empty/error state already explains why.
    return null;
  }

  const { generatedAt } = stats.data;

  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
      <span>
        Data as of{' '}
        <time
          dateTime={generatedAt}
          title={generatedAt}
          className="font-medium text-neutral-800"
        >
          {formatGeneratedAt(generatedAt)}
        </time>
      </span>
      <Link href="/methodology" className="underline">
        How these are measured
      </Link>
    </p>
  );
}
