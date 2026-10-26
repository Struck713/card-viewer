# Suppression, empty states, and non-goals

The spec calls suppression "the rule most likely to be got wrong" (§3.5).
This doc exists so it's impossible to miss, and so there's one place that
collects every "don't build this" boundary from the spec in one list.

## The suppression rule

A `CardStat` figure that doesn't meet `method.minSample` after capping is
**absent from the object** — not `0`, not `null`, the key doesn't exist. A
card that qualifies for nothing in a slice is absent from `slice.cards`
entirely.

**Correct:**
```ts
if ('winRateWhenPlayed' in card) {
  renderPercent(card.winRateWhenPlayed);
} else {
  renderSuppressed(); // "not enough data", with a tooltip citing method.minSample
}
```

**Wrong — these are real bugs, not style choices:**
```ts
renderPercent(card.winRateWhenPlayed || 0);        // false negative → fake 0%
renderPercent(card.winRateWhenPlayed ?? 0);         // same bug, nullish form
sortRows((a, b) => (b.winRateWhenPlayed ?? 0) - (a.winRateWhenPlayed ?? 0)); // sorts suppressed cards to the bottom as if they're the worst performers
```

Build one shared helper and route every stat display through it rather than
inlining the `in` check at each call site:

```ts
// lib/format/suppression.ts
export type StatField =
  | 'drawRate' | 'keepRate' | 'playRate'
  | 'winRateWhenDrawn' | 'winRateWhenKept' | 'winRateWhenPlayed';

export function statValue(card: CardStat, field: StatField): number | undefined {
  return card[field];
}

export function isSuppressed(card: CardStat, field: StatField): boolean {
  return !(field in card);
}
```

A sortable table column backed by a suppressed figure needs a defined sort
position for suppressed rows (e.g. always last, regardless of sort
direction) — decide this once in the table component, not per-column.

A card present in the catalog but absent from the current slice is "no
published data for this slice." Render this visually distinct from "a card
with bad stats" — e.g. a muted "—" row state, not a red/low-value-looking
cell.

## Empty and degraded states

| Condition | What the user sees |
|---|---|
| No stats release exists yet (today's default state) | Full card browser (table, detail, filters, search, sort) with every stats-dependent column/section replaced by "statistics have not been published yet" — never hidden silently, never replaced with zeros |
| Stats release exists, but a given slice has no data for a card | "No published data for this slice" on that card, distinct from a suppressed-but-present-elsewhere figure |
| Switching the slice selector | Must not silently drop cards from view without saying why — if a card has no entry in the newly selected slice, show that explicitly rather than just omitting the row |
| `stats/latest.json`'s `catalogVersion` differs from `catalog/latest.json`'s | Visible notice (e.g. in the provenance bar) that the statistics describe a different catalog release than the one being browsed |
| A release file named by an index 404s | Visible error state — this is an API inconsistency bug, never silently treated the same as "not published" |
| Unknown `schemaVersion` | Sitewide "this site needs updating" notice; don't attempt partial rendering |

## Hard non-goals (spec §7)

Treat these as a checklist to run new feature ideas against before building
them — if an idea needs any of these, it's out of scope for this contract,
not a missing feature to request differently:

- Player profiles, leaderboards, match history, anything per-account — the
  API carries no player/match identifiers, by design and by an automated
  privacy scan upstream.
- Deck lists, deck codes, "top decks" — `deck-stats.json` is faction pairs
  only, nothing more granular exists.
- Date-range, patch-over-time, or region filters — releases are snapshots;
  the only "history" is older release ids, not a time series endpoint.
- Realtime/per-match feeds, webhooks, writing anything back — the API is
  `GET`/`HEAD`/`OPTIONS` static JSON, full stop.
- Treating `vendor/cardgame`'s raw `data/cards/*.json` (or any other file in
  the submodule) as a data source for the live site. The catalog API is the
  only supported surface; the raw files include internal effect data that is
  deliberately not exported. See
  [`reverse-engineering.md`](./reverse-engineering.md).
- Inventing endpoints (`/cards/:id`, `?color=`, `/search`). They don't exist
  and will 404 — all filtering is client-side over the full array.
