# Data contract (condensed reference)

This is a condensed, implementation-facing view of
[`../stats-website-spec.md`](../stats-website-spec.md) §3. The spec is
authoritative — if anything here disagrees with it, the spec wins. This doc
exists so `lib/api/types.ts` and the fetchers have one place to check without
re-reading the whole brief every time.

## Endpoints

| Endpoint | Purpose | Can 404 today? |
|---|---|---|
| `GET /data/v1/latest.json` | Catalog index: points at the current card release | Yes, if catalog never deployed |
| `GET /data/v1/releases/<catalogVersion>/cards.json` | All cards for that release | Only if index is inconsistent (bug) |
| `GET /data/v1/releases/<catalogVersion>/keywords.json` | Keyword text + ability→keyword map | Only if index is inconsistent (bug) |
| `GET /data/v1/stats/latest.json` | Stats index: points at current stats release | **Yes, normally** — stats aren't published yet |
| `GET /data/v1/stats/releases/<releaseId>/card-stats.json` | Per-card rates, sliced by tier/match type | Only if stats index is inconsistent |
| `GET /data/v1/stats/releases/<releaseId>/deck-stats.json` | Per-faction-pair win rates | Only if stats index is inconsistent |
| `GET /healthz` | Operator health check | N/A — never call this from the site |

All URLs returned inside JSON bodies are root-relative. Always resolve with
`new URL(relativeUrl, origin)` against the origin you fetched the index from
— never string-concatenate.

## TypeScript types

These mirror spec §4 exactly; keep them in `lib/api/types.ts` verbatim rather
than re-deriving them from JSON shapes at runtime.

```ts
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
  catalogVersion: string;      // load THIS catalog release, not latest.json's
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
  generatedOn: string;        // ISO date
  method: StatsMethod;
  slices: CardStatsSlice[];
}

export interface DeckStat {
  factions: Color[];          // length 1 for a mono-color deck
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
```

## Non-negotiable rules carried over from the spec

These are easy to get subtly wrong, so they're called out again here even
though they're in the spec:

1. **`schemaVersion` gate.** If `latest.json` or `stats/latest.json` has a
   `schemaVersion` other than `1`, stop parsing and show the "this site needs
   updating" notice. Do not attempt to read fields speculatively.
2. **Suppression, not zero.** A missing key in a `CardStat` means "not
   enough data," never `0`. See
   [`suppression-and-states.md`](./suppression-and-states.md) for the full
   treatment — this is called out as the rule most likely to be gotten wrong,
   in the spec's own words.
3. **The stats index names its own catalog version.** When stats are loaded,
   fetch `cards.json`/`keywords.json` for `statsIndex.catalogVersion`, *not*
   whatever `catalog/latest.json` currently points at. If they differ, say so
   visibly (e.g. in the provenance bar).
4. **No slicing beyond `tierGroup` × `matchType`.** Don't build UI that
   implies a patch/date/region/deck/player filter exists — it doesn't, and
   never will under this contract.
5. **Faction pairs only, no deck lists.** `deck-stats.json` has no card list,
   deck code, or hash. Don't build a "view this deck" feature; there's
   nothing to view.
6. **Rate precision.** Render rates as percentages with at most one decimal
   place (`ratePrecision` in `method` — read it, don't hardcode "0.1").
7. **Sample sizes are rounded down to the nearest 10 and approximate.** Don't
   recompute rates from `n.*`; display them as supporting context only.
