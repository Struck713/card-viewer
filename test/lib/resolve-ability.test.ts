import { describe, expect, it } from 'vitest';
import { resolveAbility } from '../../lib/format/abilities';
import type { KeywordsResponse } from '../../lib/api/types';
import { readFixture } from '../helpers/fixtures';

const keywords = readFixture<KeywordsResponse>('data/v1/releases/0.0.0-dev/keywords.json');

describe('resolveAbility', () => {
  it('resolves a known ability key to its keyword name and description', () => {
    const resolved = resolveAbility('rummage', keywords);
    expect(resolved.keyword).toEqual({
      name: 'Rummage',
      description:
        'Select a card of lesser value in your graveyard, then return it to your hand. It costs one less.',
    });
  });

  it('rummage_on_death maps to null: falls back to the card description, never the raw key', () => {
    const resolved = resolveAbility('rummage_on_death', keywords);
    expect(resolved.keyword).toBeNull();
    expect(resolved.key).toBe('rummage_on_death');
  });

  it('resolves a parameterised key through its base', () => {
    const paramKeywords: KeywordsResponse = {
      ...keywords,
      keywords: [...keywords.keywords, { id: 'shielded', name: 'Shielded', description: 'Prevents the next instance of damage.' }],
      abilityKeywords: { ...keywords.abilityKeywords, shielded: 'shielded' },
    };
    const resolved = resolveAbility('shielded_1', paramKeywords);
    expect(resolved.keyword).toEqual({ name: 'Shielded', description: 'Prevents the next instance of damage.' });
  });
});
