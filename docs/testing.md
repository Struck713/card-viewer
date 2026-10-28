# Testing strategy

## Why fixtures matter here

The live origin serves statistics now, but it cannot be asked to produce the
cases that are easiest to get wrong: it can't 404 on demand, can't mark
itself non-preliminary, and always has a row for every collectible card. The
fixtures in spec §6 are schema-accurate and deliberately include each of
those cases:

- `t_019` has a **suppressed** figure: `winRate: null`, `matches: 0`. Use it
  to prove a null never renders as `0%` or gets silently defaulted.
- `gen_str_001` has a **genuine `0`**: `winRate: 0` with `matches: 2`, the
  card having lost both games it was in. Use it alongside `t_019` to prove
  the two render differently. **This is the most important pair in the
  fixtures** — under the old contract nothing was ever really `0`, so `?? 0`
  was a bug no test could catch. Both states now appear in every live
  response (59 zeros beside 40 nulls when last sampled).
- `cr_001t` is **absent from the statistics file entirely** — a
  non-collectible transform form, reachable from `b_001`'s Transforms
  section. Use it to prove "no published data" renders distinctly from both
  a suppressed figure and a real low value.
- `rummage_on_death` is a real example of an ability key that maps to `null`
  in `abilityKeywords` — use it to prove the description fallback actually
  fires and no raw key ever reaches the DOM.

Copy the fixtures from spec §6 verbatim into `test/fixtures/` rather than
re-deriving similar-looking test data — the point is to test against exactly
the shapes the API contract promises. Keep `generatedAt` fixed; never stamp
a live clock into a fixture.

## Required automated tests

These map directly to spec §9's definition of done — write them as actual
tests, not manual checks, per the explicit instruction there
("verified against a fixture ... a test, not a manual look"):

1. **Suppression rendering.** Using `t_019`: the win rate renders as "not
   enough data", never `0%`. Using `gen_str_001`: it renders `0.0%` and
   **not** "not enough data". Assert both in the same table, because the
   whole rule is that they are different.
2. **Suppressed sorting.** Sorting by the win-rate column puts `t_019` last
   in **both** directions while `gen_str_001` sorts as the real lowest
   value — ascending leads with the genuine `0`, not with the null. Assert
   at table level (`sortRows`), not just on the comparator.
3. **Counts are never suppressed.** A card with `winRate: null` still shows
   `0` matches and a `0–0` record, because those are real facts.
4. **Row-absence rendering.** Using `cr_001t`: a card in `cards.json` with
   no row in the statistics file renders "no published data", not a `0`, a
   blank, or a suppressed figure.
5. **Keyword fallback.** Using `rummage_on_death`: the ability resolves to
   the card's `description` text, and the raw key string never appears in
   rendered output.
6. **Stats-absent card browser.** With the statistics file returning 404,
   the card table, filters, search, sort and card detail all still work, and
   every stats-dependent area shows "statistics have not been published yet"
   rather than erroring or rendering blank.
7. **Stats network error is not "not published".** A failed fetch must show
   "couldn't load statistics", never the empty state — they are different
   facts.
8. **Shape assertion.** A payload that is valid JSON but the wrong shape
   resolves to an error state rather than reaching the UI. There is no
   version field to warn us, so this is the only guard.
9. **Caching asymmetry.** A catalog reload sends `If-None-Match` and handles
   a mocked `304` without re-parsing a body; two `loadStats` calls make two
   network fetches and store nothing. The second half is the regression
   guard against anyone reintroducing release-style caching on a
   continuously recomputed endpoint.
10. **Preliminary notice.** It appears while `methodology.preliminary` is
    true and is absent when false, and it states `minSample` **as read from
    the payload** — assert with an overridden value, so a hardcoded "1"
    fails.
11. **Provenance.** `generatedAt` renders, to the minute, with the raw ISO
    value in the markup, and is not labelled as a release or a publication
    date.
12. **A rate never appears without its sample.** Every rendered win rate has
    a win–loss record in the same row; the card detail page shows matches and
    the record beside the rate; and a 1-match 100% is **shown**, not
    suppressed by a threshold of our own. This is what makes publishing a
    single-game figure honest (spec §8 question 3), so it is tested rather
    than left to review — the tests fail if the Record column is removed.
13. **Default filters.** The card table's initial render includes only
    `collectible: true` cards.

A free guard worth knowing about: handlers are registered only at the flat
paths, and `server.listen({ onUnhandledFrame: 'error' })` means any stray
fetch of a `/data/v1/...` path fails the suite by itself. No test needed.

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
- Against the **real** origin: confirm the figures are what the endpoint
  currently says, and that reloading a minute later shows a new
  `generatedAt` — which proves the site isn't caching statistics.

## Test tooling note

Vitest + Testing Library for components, with MSW standing in for the
catalog API.

`next/navigation` is mocked globally in `test/setup.ts`, backed by the
mutable `test/helpers/navigation.ts`. Nothing reads search params any more —
the URL selects no data — but `next/link` still needs a router under jsdom,
so the mock stays.

Tests never hit the real catalog origin: every fetch path is exercised
against fixtures, so the suite stays deterministic and passes offline, and
so the absent-stats, genuine-zero and no-row cases (which the live origin
won't produce on demand) are testable at all.
