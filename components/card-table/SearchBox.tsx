'use client';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
}

// Client-side substring match only — no debounce, since there is no
// network request to make per keystroke (docs/data-layer.md).
export function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search name or text…"
      aria-label="Search cards"
      className="w-full max-w-xs rounded border border-neutral-300 px-2 py-1 text-sm"
    />
  );
}
