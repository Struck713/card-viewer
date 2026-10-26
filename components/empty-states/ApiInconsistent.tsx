import { EmptyState } from './EmptyState';

interface ApiInconsistentProps {
  url?: string;
}

// Visibly distinct from NotPublishedYet: this is an API bug (an index
// named a release file that 404s), never treated the same as "not
// published yet" (docs/suppression-and-states.md).
export function ApiInconsistent({ url }: ApiInconsistentProps) {
  return (
    <EmptyState
      tone="error"
      title="The catalog API is returning inconsistent data"
      description={
        url
          ? `A file the API pointed to could not be loaded (${url}). This is an API bug, not missing data.`
          : 'A file the API pointed to could not be loaded. This is an API bug, not missing data.'
      }
    />
  );
}
