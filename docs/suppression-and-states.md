# Suppression, empty states, and non-goals

The spec calls suppression "the rule most likely to be got wrong" (§3.3).
This doc exists so it's impossible to miss, and so there's one place that
collects every "don't build this" boundary from the spec in one list.

## The suppression rule

A win rate the publisher won't stand behind arrives as **`winRate: null`**,
paired with `matches: 0`. Null means "not enough data". It is never `0`.

The rule used to read "the key is absent, not `0`, not `null`" — the API
changed how it expresses suppression on 2026-10-28, not whether it does.

**Zero is real, and this is what raises the stakes.** `winRate: 0` with
`matches > 0` means the card lost every game it was in. When the live
endpoint was last sampled, 59 of 168 rows carried a genuine `0` sitting
right beside 40 that carried `null`. Under the old contract a suppressed
figure was the only thing that could look like zero, so `?? 0` was a latent
bug you could ship without noticing. Now both states occur in every
response, and conflating them is a visible lie: it tells a reader that a
card with no games lost all of them.

**Correct:**

```ts
if (isSuppressed(stat)) {
  renderSuppressed(); // "not enough data", citing methodology.minSample
} else {
  renderPercent(stat.winRate); // including a real 0 -> "0.0%"
}
```

**Wrong — these are real bugs, not style choices:**

```ts
renderPercent(stat.winRate ?? 0); // null becomes a fake 0%, indistinguishable from a real one
renderPercent(stat.winRate || 0); // same bug, and it also eats a genuine 0
sortRows((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0)); // ranks "no games" among the cards that lost everything
```

Route every stat display through the shared helpers rather than inlining a
null check at each call site:

```ts
// lib/format/suppression.ts
export function isSuppressed(stat: CardWinrate | undefined): boolean {
  // `== null` covers null, a card with no row at all, and a future
  // upstream return to key-absence — all of which read "not enough data".
  return stat?.winRate == null;
}

export function winRateValue(stat: CardWinrate | undefined): number | null {
  return stat?.winRate ?? null;
}

export function compareWinRate(direction: SortDirection): Comparator;
```

A suppressed figure sorts **last in both directions** — decided once in
`compareWinRate`, not per-column. Sorting it as `0` would bury it among the
cards that genuinely lost every game, which is exactly the distinction the
rule protects.

**Counts have no suppressed state.** `matches`, `wins` and `losses` are
always present, and `0` / `0–0` is a real "no games" — not "not enough
data". Only `winRate` is ever suppressed, so the Record column still renders
`0–0` for a card whose rate is null.

**A rate never appears without its record.** `minSample` is 1, so a 100% can
come from one game. The owner's call is to publish that rather than hide it
(spec §8 question 3) — which is only defensible because the sample is
visible beside it. So two rules follow, and both are tested:

- Never render a win rate without its win–loss record.
- Never add a client-side minimum sample. Suppressing below a threshold of
  our own would mean the site disagreeing with the publisher about what is
  publishable, and would hide real data from a reader who can already see
  how thin it is.

A card present in the catalog but with **no row at all** in the statistics
file is "no published data". That is the collectible/non-collectible split:
the file covers collectible cards, so a token or transform form reached
through a card's Transforms section has no row. Render it distinctly from
both a suppressed figure and a real low value.

## Empty and degraded states

| Condition                                               | What the user sees                                                                                                                                                                                         |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The statistics file 404s                                | Full card browser (table, detail, filters, search, sort) with every stats-dependent column/section replaced by "statistics have not been published yet" — never hidden silently, never replaced with zeros |
| `winRate` is `null`                                     | "Not enough data" on that figure, with `matches` and the win–loss record still shown beside it                                                                                                             |
| `winRate` is a genuine `0`                              | `0.0%` — a real result, visually distinct from "not enough data" and never conflated with it                                                                                                               |
| A catalog card has no row in the statistics file        | "No published data" on that card, distinct from a suppressed figure                                                                                                                                        |
| `methodology.preliminary` is `true` (today's state)     | A prominent notice on every page showing a statistic, stating `minSample` as read from the payload and noting that AI matches are included                                                                 |
| Either catalog file 404s                                | Sitewide "catalog not available" error — there is nothing to browse                                                                                                                                        |
| A payload parses as JSON but has the wrong shape        | Treated as an error, not rendered. There is no version field to warn us, so this assertion is the only guard (see `data-contract.md` rule #1)                                                              |
| Statistics load but `generatedAt` is stale or advancing | Nothing special. It is a recompute clock; the site displays what it is told and never presents it as a release                                                                                             |

## Hard non-goals (spec §7)

Treat these as a checklist to run new feature ideas against before building
them — if an idea needs any of these, it's out of scope for this contract,
not a missing feature to request differently:

- Player profiles, leaderboards, match history, anything per-account — the
  API carries no player/match identifiers, by design and by an automated
  privacy scan upstream.
- Deck lists, deck codes, "top decks", or deck and faction statistics of any
  kind. Deck statistics do not exist — not merely deck lists.
- **Statistics the API doesn't publish, derived from the ones it does.** In
  particular, do not aggregate card rows into a faction or colour win rate:
  the metric counts player-games by starting-deck inclusion, so summing a
  faction's cards counts the same game once per included card of that
  colour. This is the trap most likely to be walked into, which is why it
  gets its own bullet.
- Slicing of any kind — tier, match type, patch, region, date range, deck,
  player. One figure per card is all there is.
- Date-range or history views. There are no release ids and no snapshots;
  the only thing you have is the current recompute.
- Realtime/per-match feeds, webhooks, writing anything back — the API is
  `GET`/`HEAD`/`OPTIONS` static JSON, full stop.
- Treating the game repo's raw internal card/keyword JSON as a data source
  for the live site, or committing any copy of the catalog into this repo.
  The catalog API is the only supported surface; the raw files include
  internal effect data that is deliberately not exported, and a committed
  copy would be a second, silently stale source of card data.
- Inventing endpoints (`/cards/:id`, `?color=`, `/search`). They don't exist
  and will 404 — all filtering is client-side over the full array.
- Inventing identifiers the API doesn't publish. There is no catalog
  version, game version or stats release id. Don't substitute `cards.json`'s
  `ETag` as a pseudo-version, and don't present `generatedAt` as a release.
