import type { Color } from '../api/types';

export interface FactionDisplay {
  label: string;
  swatchClassName: string;
  textClassName: string;
}

// Every component pairs a swatch with this same label — factions must be
// readable without colour alone (spec §5 quality bar).
const FACTION_DISPLAY: Record<Color, FactionDisplay> = {
  GREEN: {
    label: 'Green',
    swatchClassName: 'bg-green-600',
    textClassName: 'text-green-700',
  },
  CRIMSON: {
    label: 'Crimson',
    swatchClassName: 'bg-red-700',
    textClassName: 'text-red-800',
  },
  BLACK: {
    label: 'Black',
    swatchClassName: 'bg-neutral-800',
    textClassName: 'text-neutral-800',
  },
  ORANGE: {
    label: 'Orange',
    swatchClassName: 'bg-orange-500',
    textClassName: 'text-orange-700',
  },
  TEAL: {
    label: 'Teal',
    swatchClassName: 'bg-teal-600',
    textClassName: 'text-teal-700',
  },
  GENERIC: {
    label: 'Generic',
    swatchClassName: 'bg-neutral-400',
    textClassName: 'text-neutral-600',
  },
};

export function factionDisplay(color: Color): FactionDisplay {
  return FACTION_DISPLAY[color];
}
