import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  tone?: 'info' | 'error';
  children?: ReactNode;
}

// Shared base for the three named empty/error states. Visually distinct by
// tone: "info" (not published yet / no data for this slice) vs "error"
// (schema mismatch / API inconsistency) — never the same look.
export function EmptyState({
  title,
  description,
  tone = 'info',
  children,
}: EmptyStateProps) {
  const toneClassName =
    tone === 'error'
      ? 'border-red-300 bg-red-50'
      : 'border-neutral-300 bg-neutral-50';

  return (
    <div
      className={`rounded-lg border ${toneClassName} p-6 text-center`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <p className="font-medium text-neutral-900">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-neutral-600">{description}</p>
      )}
      {children}
    </div>
  );
}
