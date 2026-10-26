import { EmptyState } from './EmptyState';

interface SchemaMismatchProps {
  got: number;
}

// Sitewide "needs updating" notice — never attempt partial rendering past
// an unrecognized schemaVersion (docs/suppression-and-states.md).
export function SchemaMismatch({ got }: SchemaMismatchProps) {
  return (
    <EmptyState
      tone="error"
      title="This site needs updating"
      description={`The API is now using a data format (schemaVersion ${got}) this site doesn't understand yet. Please check back soon.`}
    />
  );
}
