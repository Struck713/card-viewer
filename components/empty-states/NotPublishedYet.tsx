import { EmptyState } from './EmptyState';

interface NotPublishedYetProps {
  // Use the compact form inline (a table cell, a stat row) where a full
  // boxed empty state would be too heavy; use the full form for whole
  // sections (e.g. all of /methodology's content).
  compact?: boolean;
}

export function NotPublishedYet({ compact = false }: NotPublishedYetProps) {
  if (compact) {
    return <span className="text-sm text-neutral-500">Not published yet</span>;
  }
  return (
    <EmptyState
      title="Statistics have not been published yet"
      description="The statistics file could not be found at the catalog origin. The card browser still works fully."
    />
  );
}
