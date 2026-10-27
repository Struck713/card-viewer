import type { StatsState } from '../../lib/hooks/context';
import { ApiInconsistent } from './ApiInconsistent';
import { EmptyState } from './EmptyState';
import { NotPublishedYet } from './NotPublishedYet';
import { SchemaMismatch } from './SchemaMismatch';

interface StatsStatusBannerProps {
  stats: StatsState;
  compact?: boolean;
}

// One place that maps every non-'ok' StatsState to its empty/error state —
// 'loading' and 'ok' render null since callers handle those two
// differently per page (loading copy, and the actual stats content,
// vary). Having every page hand-copy this four-way switch is exactly
// what let one copy (CardsPageClient) silently drift and drop the
// network-error case.
export function StatsStatusBanner({ stats, compact }: StatsStatusBannerProps) {
  switch (stats.status) {
    case 'not-published':
      return <NotPublishedYet compact={compact} />;
    case 'schema-mismatch':
      return <SchemaMismatch got={stats.got} />;
    case 'inconsistent':
      return <ApiInconsistent url={stats.url} />;
    case 'network-error':
      return (
        <EmptyState
          tone="error"
          title="Couldn't load statistics"
          description="A network error occurred. Please try again."
        />
      );
    default:
      return null;
  }
}
