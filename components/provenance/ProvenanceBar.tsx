'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { useCatalog } from '../../lib/hooks/useCatalog';
import { useSlice } from '../../lib/hooks/useSlice';
import { useStats } from '../../lib/hooks/useStats';

// A pinned link showing an older release without saying so is the exact
// failure ?stats= exists to prevent — so say so, and offer the way back.
//
// Split out because useSlice() reads search params, which forces a
// Suspense boundary during prerender. ProvenanceBar is mounted on every
// page that shows a statistic, so it owns that boundary itself rather
// than making each page remember to provide one (/methodology had none,
// and its build broke the moment this notice was added inline).
function PinnedNotice({ releaseId }: { releaseId: string }) {
  const pathname = usePathname();
  const slice = useSlice();
  return (
    <span className="font-medium text-blue-700">
      Pinned to stats release {releaseId} — this may not be the latest.{' '}
      <Link
        href={`${pathname}?${slice.unpinnedQueryString()}`}
        className="underline"
      >
        View the latest release
      </Link>
    </span>
  );
}

// Mounted on every page that shows a statistic — not just /methodology.
// Catalog fields always show once loaded; stats fields only once a stats
// release is loaded, plus a visible mismatch notice per
// docs/suppression-and-states.md.
export function ProvenanceBar() {
  const catalog = useCatalog();
  const { stats, statsCatalog, catalogVersionMismatch, catalogVersionUnknown } =
    useStats();

  if (catalog.status === 'loading') {
    return (
      <p className="px-3 py-2 text-xs text-neutral-500">Loading provenance…</p>
    );
  }
  if (catalog.status !== 'ok') {
    // The page's own empty/error state already explains why there's
    // nothing to show provenance for.
    return null;
  }

  const { gameVersion, catalogVersion } = catalog.data.index;
  const provenance = stats.status === 'ok' ? stats.data.provenance : null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
      <span>
        Game version:{' '}
        <strong className="font-medium text-neutral-800">{gameVersion}</strong>
      </span>
      <span>
        Catalog version:{' '}
        <strong className="font-medium text-neutral-800">
          {catalogVersion}
        </strong>
      </span>
      {stats.status === 'ok' && provenance && (
        <>
          <span>
            Stats release:{' '}
            <strong className="font-medium text-neutral-800">
              {provenance.releaseId}
            </strong>
          </span>
          <span>
            Generated:{' '}
            <strong className="font-medium text-neutral-800">
              {stats.data.cardStats.generatedOn}
            </strong>
          </span>
        </>
      )}
      {provenance?.pinned && (
        <Suspense fallback={null}>
          <PinnedNotice releaseId={provenance.releaseId} />
        </Suspense>
      )}
      {catalogVersionMismatch && provenance && (
        <span className="font-medium text-amber-700">
          Statistics describe catalog {provenance.catalogVersion}, not the{' '}
          {catalogVersion} release being browsed.
        </span>
      )}
      {/* Unknown is not agreement: a pinned link that omitted ?catalog=
          leaves us unable to check rule #3 at all, and claiming a match we
          can't verify would be the same bug as rendering a suppressed stat
          as 0. */}
      {catalogVersionUnknown && (
        <span className="font-medium text-amber-700">
          The catalog release these pinned statistics describe is unknown — the
          link didn&apos;t say, and a stats release doesn&apos;t record it.
        </span>
      )}
      {catalogVersionMismatch &&
        statsCatalog.status !== 'ok' &&
        statsCatalog.status !== 'loading' && (
          <span className="font-medium text-red-700">
            Could not verify the catalog release the statistics describe — its
            own data could not be loaded.
          </span>
        )}
    </div>
  );
}
