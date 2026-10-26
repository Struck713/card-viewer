// Mirrors stats-website-spec.md §3/§4 and docs/data-contract.md exactly.
// Keep verbatim rather than re-deriving from JSON shapes at runtime.

export type Color = 'GREEN' | 'CRIMSON' | 'BLACK' | 'ORANGE' | 'TEAL' | 'GENERIC';
export type CardType = 'CREATURE' | 'STRATAGEM' | 'LOCATION';
export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type TierGroup = 'low' | 'mid' | 'high' | 'legend';
export type MatchType = 'ranked' | 'casual' | 'campaign';

export interface CatalogIndex {
  schemaVersion: number;
  catalogVersion: string;
  gameVersion: string;
  cardsUrl: string;
  keywordsUrl: string;
}

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
  schemaVersion: number;
  catalogVersion: string;
  gameVersion: string;
  cards: Card[];
}

export interface Keyword {
  id: string;
  name: string;
  description: string;
}

export interface KeywordsResponse {
  schemaVersion: number;
  catalogVersion: string;
  gameVersion: string;
  keywords: Keyword[];
  abilityKeywords: Record<string, string | null>;
}

export interface StatsIndex {
  schemaVersion: number;
  releaseId: string;
  gameVersion: string;
  catalogVersion: string; // load THIS catalog release, not latest.json's
  cardStatsUrl: string;
  deckStatsUrl: string;
}

export interface StatsMethod {
  includes: string;
  minSample: number;
  perAccountCap: number;
  pairCap: number;
  ratePrecision: string;
  sampleRounding: string;
}

// Every rate/sample field is OPTIONAL. Absent = suppressed (below minSample).
// Never default a missing field to 0.
export interface CardStat {
  id: string;
  matches?: number;
  drawRate?: number;
  keepRate?: number;
  playRate?: number;
  winRateWhenDrawn?: number;
  winRateWhenKept?: number;
  winRateWhenPlayed?: number;
  n?: { drawn?: number; kept?: number; played?: number };
}

export interface CardStatsSlice {
  tierGroup: TierGroup;
  matchType: MatchType;
  cards: CardStat[];
}

export interface CardStatsResponse {
  schemaVersion: number;
  releaseId: string;
  gameVersion: string;
  generatedOn: string; // ISO date
  method: StatsMethod;
  slices: CardStatsSlice[];
}

export interface DeckStat {
  factions: Color[]; // length 1 for a mono-color deck
  matches?: number;
  winRate?: number;
}

export interface DeckStatsSlice {
  tierGroup: TierGroup;
  matchType: MatchType;
  decks: DeckStat[];
}

export interface DeckStatsResponse {
  schemaVersion: number;
  releaseId: string;
  gameVersion: string;
  generatedOn: string;
  method: StatsMethod;
  slices: DeckStatsSlice[];
}
