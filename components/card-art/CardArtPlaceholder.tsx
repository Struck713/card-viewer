interface CardArtPlaceholderProps {
  size?: 'sm' | 'lg';
  label?: string;
}

// No card art exists yet (confirmed with the owner) — one shared filler
// everywhere a card would show art, so swapping in real art later is a
// one-component change rather than a layout rework.
export function CardArtPlaceholder({
  size = 'sm',
  label,
}: CardArtPlaceholderProps) {
  const dimensions = size === 'lg' ? 'h-48 w-36' : 'h-14 w-10';
  const title = label ? `No card art for ${label} yet` : 'No card art yet';

  return (
    <div
      className={`${dimensions} shrink-0 rounded-md bg-neutral-200 flex items-center justify-center text-neutral-400`}
      role="img"
      aria-label={title}
      title={title}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-1/3 w-1/3"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm3 3h6v2H9V9zm0 4h6v2H9v-2z" />
      </svg>
    </div>
  );
}
