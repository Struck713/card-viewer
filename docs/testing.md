# Testing strategy

## Why fixtures matter here

The real catalog server (in the submodule) has no stats data at all today,
and the real API may 404 entirely for a while (spec §1). The fixtures in
spec §6 are schema-accurate and deliberately include the exact cases that
are easy to get wrong:

- `t_019` has a **suppressed** `winRateWhenPlayed` (present `drawRate`,
  `winRateWhenDrawn`, absent everything else) — use it to prove suppressed
  fields never render as 0 or get silently defaulted.
- `gen_str_001` is **absent from the stats slice entirely** — use it to
  prove "no data for this card in this slice" renders distinctly from "this
  card has bad stats."
- `rummage_on_death` is a real example of an ability key that maps to `null`
  in `abilityKeywords` — use it to prove the description fallback actually
  fires and no raw key ever reaches the DOM.

Copy the fixtures from spec §6 verbatim into `test/fixtures/` (or serve them
from a tiny local static server during tests) rather than re-deriving
similar-looking test data — the point is to test against exactly the shapes
the API contract promises, including the specific suppressed/absent cases
called out above.

## Required automated tests

These map directly to spec §9's definition of done — write them as actual
tests, not manual checks, per the explicit instruction there
("verified against a fixture ... a test, not a manual look"):

1. **Schema version gate.** `latest.json`/`stats/latest.json` with
   `schemaVersion !== 1` → renders the "needs updating" notice, attempts no
   further parsing.
2. **Suppression rendering.** Using the `t_019` fixture: `winRateWhenPlayed`
   renders as "not enough data" (or equivalent), never `0%`, and sorting a
   table by that column places `t_019` in the defined suppressed position,
   not at either extreme implied by treating it as 0.
3. **Slice-absence rendering.** Using the `gen_str_001` fixture: a card
   present in `cards.json` but absent from the loaded stats slice renders
   "no published data for this slice," and is not simply missing from the
   list without explanation.
4. **Keyword fallback.** Using the `rummage_on_death` fixture: the ability
   resolves to the card's `description` text, and the raw key string
   `rummage_on_death` never appears in rendered output.
5. **Stats-absent card browser.** With `stats/latest.json` returning 404,
   the card table, filters, search, sort, and card detail all still work,
   and every stats-dependent area shows "statistics have not been published
   yet" rather than erroring or rendering blank.
6. **Inconsistent-API error.** With `latest.json` naming a `cardsUrl` that
   404s, the site shows a visible error distinct from the "not published"
   empty state.
7. **Mismatched catalog/stats versions.** With `stats/latest.json`'s
   `catalogVersion` different from `catalog/latest.json`'s, the mismatch is
   visibly surfaced somewhere (provenance bar).
8. **Caching.** A second load of the same release id does not re-fetch the
   release file (assert on fetch call count / mock cache hit); an index file
   reload sends `If-None-Match` and handles a mocked `304` without
   re-parsing a body.
9. **Default filters.** The card table's initial render includes only
   `collectible: true` cards.

## Manual / exploratory checks

Automate what's listed above; these are harder to assert cleanly and are
checked by hand before each release:

- Phone-width layout (spec §5 quality bar) — no horizontal scroll, filters
  usable, table remains legible.
- Keyboard navigation through the card table (tab order, row focus, sort
  toggles reachable without a mouse).
- No layout shift when statistics load in after the card list has already
  rendered (§5 quality bar) — check with the stats fetch artificially
  delayed.
- Color-independence: faction names/colors are always paired with text
  labels, verified by briefly disabling color (e.g. grayscale filter) and
  confirming the page still makes sense.

## Test tooling note

Use whatever test runner fits the Next.js app — currently Vitest + Testing
Library for components, with MSW standing in for the catalog API. Tests
never hit the real catalog origin: every fetch path is exercised against
fixtures, so the suite stays deterministic and passes offline, and so the
absent-stats and inconsistent-API cases (which no live origin produces on
demand) are testable at all.
