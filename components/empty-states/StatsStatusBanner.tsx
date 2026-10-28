import type { StatsState } from '../../lib/hooks/context';
import { PreliminaryNotice } from '../provenance/PreliminaryNotice';
import { EmptyState } from './EmptyState';
import { NotPublishedYet } from './NotPublishedYet';

interface StatsStatusBannerProps {
  stats: StatsState;
  compact?: boolean;
}

// One place that maps every StatsState to the banner it deserves, so no
// page has to remember the set. Having every page hand-copy this switch is
// exactly what let one copy (CardsPageClient) silently drift and drop the
// network-error case.
//
// Note 'ok' is no longer always null: when the publisher marks the data
// preliminary it carries a caveat, and routing that through here means no
// page showing a statistic can forget to display it.
export function StatsStatusBanner({ stats, compact }: StatsStatusBannerProps) {
  switch (stats.status) {
    case 'not-published':
      return <NotPublishedYet compact={compact} />;
    case 'network-error':
      return (
        <EmptyState
          tone="error"
          title="Couldn't load statistics"
          description="A network error occurred. Please try again."
        />
      );
    case 'ok':
      return stats.data.methodology.preliminary ? (
        <PreliminaryNotice methodology={stats.data.methodology} />
      ) : null;
    default:
      return null;
  }
}
