# Pages and components

Route map and component breakdown, mapped directly against spec §5's
priority-ordered requirements list. Build in this order — each item depends
on the data layer but not on later UI items.

## Routes

| Route | Spec requirement | Works with no stats release? |
|---|---|---|
| `/cards` | §5.1 card table, §5.2 slice selector | Yes — table and filters work standalone; stats columns show the empty state |
| `/cards/[id]` | §5.3 card detail | Yes — printed data + keywords always render; stats section shows the empty state |
| `/factions` | §5.4 faction win rates | No — this page's entire content is `deck-stats.json`; when absent, the whole page is an empty state, not a broken page |
| `/methodology` | §5.5 provenance / methodology page | Partially — catalog provenance (gameVersion, catalogVersion) always shows; the `method` block and stats provenance show the empty state when stats aren't published |
| `/` | — | Redirects to `/cards`, or a minimal landing linking to it |

Every route that renders a statistic must also render the provenance bar
(§5.5) — don't treat `/methodology` as the only place provenance lives.

## `/cards` — card table (§5.1, §5.2)

Components: `card-table/Table.tsx`, `card-table/Filters.tsx`,
`card-table/SearchBox.tsx`, `slice-selector/SliceSelector.tsx`,
`card-art/CardArtPlaceholder.tsx`.

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
- Sortable columns include the stats columns once a stats release loads;
  sorting must respect the suppression rule (see
  [`suppression-and-states.md`](./suppression-and-states.md)) — suppressed
  values sort as "unknown," not as the lowest or highest value.
- `SliceSelector` holds `(tierGroup, matchType)` state, defaulting to
  `mid`/`ranked` per spec. Changing it must not silently drop rows — if the
  new slice has no entry for a card, show why (see suppression doc) rather
  than removing the row.
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
- Stat rows: one row per published figure (`drawRate`, `keepRate`,
  `playRate`, `winRateWhenDrawn`, `winRateWhenKept`, `winRateWhenPlayed`),
  each with its `n.*` sample size next to it, and a visible "not enough
  data" row for every suppressed figure rather than omitting it — showing
  the card still has that *category* of stat, just not enough data for it
  yet, is more honest than silence.
- Transform cards (`isTransformForm`, `transformInto`, `transformChoices`):
  link to the related card ids within the same release.

## `/factions` — faction win rates (§5.4)

Components: `faction-table/FactionTable.tsx`.

- Render `deck-stats.json`'s current slice as a comparison table/grid of
  faction pairs with `winRate` and `matches`.
- Label factions by name in text, not color swatches alone (§5 quality bar:
  "readable without colour alone... label them in text too").
- No deck-list affordance of any kind — there's no deck list in the data to
  show (see non-goals).
- Empty state when `deck-stats.json` isn't available: the whole page, not a
  partial table.

## `/methodology` — provenance and methodology (§5.5)

Components: `provenance/ProvenanceBar.tsx`, `provenance/MethodologyPanel.tsx`.

- `ProvenanceBar` is a shared component mounted on every page that shows a
  statistic (not just `/methodology`): `gameVersion`, `catalogVersion`,
  `releaseId`, `generatedOn`. When stats aren't loaded, it still shows the
  catalog's `gameVersion`/`catalogVersion`.
- `MethodologyPanel` renders the `method` block **verbatim** (don't
  paraphrase `minSample`, `perAccountCap`, etc. — read and display the
  actual numbers, since they can change release to release) plus a
  plain-language explanation of capping/suppression underneath it.

## Shared components

- `empty-states/NotPublishedYet.tsx` — stats not published.
- `empty-states/SchemaMismatch.tsx` — sitewide "needs updating" notice.
- `empty-states/ApiInconsistent.tsx` — a release file 404s when an index
  named it; visually distinct from "not published."
- `provenance/ProvenanceBar.tsx` — see above.

## Definition-of-done cross-check

Before calling any of the above "done," re-check it against spec §9's
checklist directly — it's the actual acceptance criteria and is reproduced
in [`open-questions.md`](./open-questions.md).
