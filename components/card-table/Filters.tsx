'use client';

import type { CardType, Color, Rarity } from '../../lib/api/types';

export interface FilterState {
  color: Color | 'all';
  type: CardType | 'all';
  rarity: Rarity | 'all';
  manaCost: number | 'all';
  tribe: string | 'all';
}

export interface FilterOptions {
  colors: Color[];
  types: CardType[];
  rarities: Rarity[];
  manaCosts: number[];
  tribes: string[];
}

interface FiltersProps {
  value: FilterState;
  onChange: (value: FilterState) => void;
  options: FilterOptions;
}

// Option lists come from the caller, derived from the loaded cards at
// runtime — never hardcoded, since tribes in particular can be added over
// time (docs/pages-and-components.md).
export function Filters({ value, onChange, options }: FiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <label>
        Color
        <select
          className="ml-1 rounded border border-neutral-300 px-1.5 py-1"
          value={value.color}
          onChange={(event) =>
            onChange({
              ...value,
              color: (event.target.value || 'all') as Color | 'all',
            })
          }
        >
          <option value="all">All</option>
          {options.colors.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
      </label>
      <label>
        Type
        <select
          className="ml-1 rounded border border-neutral-300 px-1.5 py-1"
          value={value.type}
          onChange={(event) =>
            onChange({ ...value, type: event.target.value as CardType | 'all' })
          }
        >
          <option value="all">All</option>
          {options.types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label>
        Rarity
        <select
          className="ml-1 rounded border border-neutral-300 px-1.5 py-1"
          value={value.rarity}
          onChange={(event) =>
            onChange({ ...value, rarity: event.target.value as Rarity | 'all' })
          }
        >
          <option value="all">All</option>
          {options.rarities.map((rarity) => (
            <option key={rarity} value={rarity}>
              {rarity}
            </option>
          ))}
        </select>
      </label>
      <label>
        Cost
        <select
          className="ml-1 rounded border border-neutral-300 px-1.5 py-1"
          value={value.manaCost}
          onChange={(event) =>
            onChange({
              ...value,
              manaCost:
                event.target.value === 'all'
                  ? 'all'
                  : Number(event.target.value),
            })
          }
        >
          <option value="all">All</option>
          {options.manaCosts.map((cost) => (
            <option key={cost} value={cost}>
              {cost}
            </option>
          ))}
        </select>
      </label>
      <label>
        Tribe
        <select
          className="ml-1 rounded border border-neutral-300 px-1.5 py-1"
          value={value.tribe}
          onChange={(event) =>
            onChange({ ...value, tribe: event.target.value })
          }
        >
          <option value="all">All</option>
          {options.tribes.map((tribe) => (
            <option key={tribe} value={tribe}>
              {tribe}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
