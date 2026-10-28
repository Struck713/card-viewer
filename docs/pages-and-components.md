# Pages and components

Route map and component breakdown, mapped directly against spec §5's
priority-ordered requirements list. Build in this order — each item depends
on the data layer but not on later UI items.

## Routes

| Route          | Spec requirement                   | Works with no statistics?                                                                                           |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `/cards`       | §5.1 card table                    | Yes — table and filters work standalone; stat columns show the empty state                                          |
| `/cards/[id]`  | §5.2 card detail                   | Yes — printed data + keywords always render; the statistics section shows the empty state                           |
| `/methodology` | §5.5 provenance / methodology page | No — the methodology block is published inside the statistics file, so the whole page is the empty state without it |
| `/`            | —                                  | Redirects to `/cards`, or a minimal landing linking to it                                                           |

`/factions` is gone. Its entire content was deck statistics, which the API
no longer publishes in any form, and deriving faction rates from card rows
would double-count games (see
[`suppression-and-states.md`](./suppression-and-states.md) non-goals).

Every route that renders a statistic must also render the provenance bar
(§5.5) — don't treat `/methodology` as the only place provenance lives.

## `/cards` — card table (§5.1)

Components: `card-table/Table.tsx`, `card-table/Filters.tsx`,
`card-table/SearchBox.tsx`, `card-art/CardArtPlaceholder.tsx`.

- No card art exists yet (confirmed with the owner); each row uses the
  shared `CardArtPlaceholder` rather than an `<img>` with a missing/broken
  source. Keep it as one small shared component, not inlined per-row
  markup, so swapping in real art later is a single change.
- Default filter: `collectible: true` only (spec §3.2 — default every list
  and chart to collectible cards; non-collectible tokens/forms are there
  only because a selected card references them).
- Search: client-side substring match over `name` and `description`. No
  debounce-driven network call — there's nothing to call.
- Filters: color, type, rarity, mana cost, tribe — all derived from the
  in-memory `cards` array (e.g. distinct tribes come from the data, not a
  hardcoded list, since tribes can be added over time).
- Two stat columns: **Record** (`wins–losses`) and **Win %**. Wins and
  losses always sum to matches, so the record carries the sample size
  inline, which is what keeps a win rate honest when `minSample` can be 1.
- Sortable columns include the stat columns once statistics load. Win % must
  respect the suppression rule (see
  [`suppression-and-states.md`](./suppression-and-states.md)): a null sorts
  as "unknown" — last in both directions — while a genuine `0` sorts as the
  real lowest value. Record sorts by match count, which has no suppressed
  state.
- `StatCell` owns the four-way cell logic once, rather than each column
  repeating it: statistics not loaded, no row for this card, suppressed, or
  a value. Record skips the suppressed branch, because `0–0` is a known
  fact.
- Keyboard navigation and phone-width layout are explicit quality-bar items
  (§5 quality bar) — verify both manually, they're easy to lose in a dense
  table.

## `/cards/[id]` — card detail (§5.3)

Components: `card-detail/PrintedData.tsx`, `card-detail/Abilities.tsx`,
`card-detail/StatRows.tsx`, `card-art/CardArtPlaceholder.tsx` (larger
variant of the same component used in the table).

- Printed data: full `Card` fields, formatted (e.g. `attack`/`health` as
  `—` when `null`, since that's semantically "not applicable," not missing
  data).
- Abilities: resolve every entry in `card.abilities` through
  `keywords.abilityKeywords`. A key that maps to a keyword id renders that
  keyword's name + description (from `keywords.keywords`); a key that maps
  to `null` is **never shown as the raw key** — fall back to the card's
  `description`, which already contains the readable text for those
  ("On play…"/"On death…" effects). This fallback is not optional: spec §3.3
  calls rendering a raw ability key like `rummage_on_death` a correctness
  bug, not a style nit.
- Stat rows: Matches, Record (`W–L`), Win rate. A suppressed win rate gets a
  visible "not enough data" row rather than being omitted — showing the card
  still has that _category_ of stat, just not enough data for it yet, is
  more honest than silence. Matches and Record are always shown: `0` and
  `0–0` are real facts.
- Transform cards (`isTransformForm`, `transformInto`, `transformChoices`):
  link to the related card ids. These are the one place a user reaches a
  non-collectible card, and therefore the one place the "no published data"
  statistics state is genuinely reachable.

## `/methodology` — provenance and methodology (§5.5)

Components: `provenance/ProvenanceBar.tsx`, `provenance/MethodologyPanel.tsx`.

- `ProvenanceBar` is a shared component mounted on every page that shows a
  statistic (not just `/methodology`). It has one thing to say — **"Data as
  of `<generatedAt>`"** — because that is the only provenance the API
  publishes. It renders nothing when statistics aren't loaded, since there
  is then nothing to attribute. Format to the minute and never call it a
  release: see [`data-contract.md`](./data-contract.md) rule #8.
- `MethodologyPanel` renders the `methodology` block **verbatim** (don't
  paraphrase `minSample` etc. — display the actual values, since the
  publisher can change them with no version field to warn us), with the
  site's own plain-language gloss kept visually separate below it so it is
  never mistaken for published data.
- `PreliminaryNotice` carries the caveat while `methodology.preliminary` is
  true, interpolating `minSample` from the payload. It is owned by
  `StatsStatusBanner` rather than wired per page, so no page showing a
  statistic can forget it.

## Shared components

- `empty-states/NotPublishedYet.tsx` — statistics not published.
- `empty-states/StatsStatusBanner.tsx` — the single switch over every
  `StatsState`, including the `ok` case that carries the preliminary
  notice. Pages route all stats-state messaging through it rather than
  hand-copying the switch, which is how a case previously drifted.
- `provenance/ProvenanceBar.tsx`, `provenance/PreliminaryNotice.tsx` — see
  above.

## Definition-of-done cross-check

Before calling any of the above "done," re-check it against spec §9's
checklist directly — it's the actual acceptance criteria and is reproduced
in [`open-questions.md`](./open-questions.md).
