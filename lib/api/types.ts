// Mirrors stats-website-spec.md §3 and docs/data-contract.md exactly.
// Keep verbatim rather than re-deriving from JSON shapes at runtime.
//
// Both halves of the API are flat and unversioned: there is no index file,
// no release id, and no schemaVersion/catalogVersion/gameVersion envelope
// on any payload. Cards are identified only by the collection they arrive
// in; statistics only by their generatedAt.

export type Color =
  'GREEN' | 'CRIMSON' | 'BLACK' | 'ORANGE' | 'TEAL' | 'GENERIC';
export type CardType = 'CREATURE' | 'STRATAGEM' | 'LOCATION';
export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface Card {
  id: string;
  name: string;
  color: Color;
  type: CardType;
  rarity: Rarity;
  manaCost: number;
  attack: number | null;
  health: number | null;
  tribe: string | null;
  description: string;
  abilities: string[];
  collectible: boolean;
  isToken: boolean;
  isTransformForm: boolean;
  transformInto: string | null;
  transformChoices: string[];
}

export interface CardsResponse {
  cards: Card[];
}

export interface Keyword {
  id: string;
  name: string;
  description: string;
}

export interface KeywordsResponse {
  keywords: Keyword[];
  abilityKeywords: Record<string, string | null>;
}

// How the statistics were computed. Every field is free text or a raw
// number meant to be rendered verbatim on the methodology page — none of
// it is a machine-readable instruction to the client.
export interface StatsMethodology {
  metric: string;
  modes: string[];
  aiSeats: string;
  copies: string;
  rulesVersions: string;
  minSample: number;
  preliminary: boolean;
  privacy: string;
}

// winRate is null when the API suppresses the figure, which it pairs with
// matches: 0. Null means "not enough data" — NEVER 0, and never sorted as
// 0. This is the rule the spec calls the one most likely to be got wrong;
// it moved from "the key is absent" to "the value is null", but it did not
// go away. Route every read through lib/format/suppression.ts.
export interface CardWinrate {
  id: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number | null;
}

export interface CardWinratesResponse {
  generatedAt: string; // ISO timestamp
  methodology: StatsMethodology;
  // Covers the collectible cards only; a catalog card with no row here is
  // "no published data", which renders the same as a suppressed figure.
  cards: CardWinrate[];
}
