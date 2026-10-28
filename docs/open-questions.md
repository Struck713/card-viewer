# Open questions and definition of done

Carried over from spec §8/§9 so there's one tracked checklist inside `docs/`
instead of everyone re-reading the full spec to find it. Update this file's
checkboxes as work lands; don't let it drift from the spec if the spec is
revised — re-sync both when that happens.

**Re-synced 2026-10-28**, when the API was restructured and the whole
`/data/v1/…` space was removed. Both lists changed; see the spec's §0.

## Questions for the owner (spec §8)

- [x] **What is the public origin for `CATALOG_ORIGIN`?**
      `https://cardgame-catalog-production.up.railway.app`, published and
      run by the game's own team. Verified live against the spec's
      §4.2–§4.5 transport contract — see
      [`deployment.md`](./deployment.md). (A Vercel URL given early on,
      `https://cardgame-xi-orpin.vercel.app/`, turned out to be the Godot
      game's HTML5 web export, not this — don't reuse it.) This resolves an
      earlier stopgap in which this project served the catalog itself as
      static files; that arrangement is gone, along with its docs.
- [x] **Is there an image source for card art?** No — confirmed by the
      owner: there isn't any card art yet. Use a filler/placeholder image for
      every card until one exists; see [`architecture.md`](./architecture.md)
      and [`pages-and-components.md`](./pages-and-components.md).
- [x] **Where should the site be hosted, and under which domain?** Vercel;
      the owner hosts it themself. No domain decided yet. See
      [`deployment.md`](./deployment.md).
- [x] **Do card statistics exist yet?** Yes, as of 2026-10-28 — one flat,
      unversioned, continuously recomputed win-rate file. Deck statistics
      never shipped and are no longer in the contract at all.
- [ ] **Will the catalog be versioned again, and under what scheme?** It is
      unversioned today (`/data/cards.json`, no `catalogVersion`), and the
      `/data/v1/releases/<version>/…` plumbing was **removed** rather than
      left dormant — so reintroducing it is real work, not a config change.
      That was an explicit, informed trade, not an oversight.
- [ ] **Can `card-winrates.json` get an `ETag`?** Without one it cannot be
      conditionally revalidated, so a refresh or polling affordance has no
      cheap request available. The catalog files already send one.
- [ ] **Is labelling preliminary data the right call?** `minSample: 1` with
      `preliminary: true` means roughly half the catalog can show 100% or 0%
      from a single game. The site currently shows the figures with a
      prominent caveat and the match count beside every rate, rather than
      suppressing below a threshold of its own. Confirm, or set a threshold.

## Definition of done (spec §9)

- [x] Loads the three flat files from the configured origin, and resolves a
      changed payload shape to an error state rather than a crash.
- [x] Card table with search, the five filters (color, type, rarity, mana
      cost, tribe), and sorting; defaults to collectible cards only.
- [x] Keyword text resolved through `abilityKeywords`, with the description
      fallback; no raw ability key ever shown to a user.
- [x] Win rates render with their match count and win–loss record. A `null`
      rate shows as "not enough data" and a **genuine `0`** shows as `0.0%`
      — **verified against a fixture containing both, as an automated
      test**, not a manual look.
- [x] A `null` rate sorts last in **both** directions, with a genuine `0`
      sorted as the real value it is — also an automated test.
- [x] A missing statistics file yields a working card browser plus an honest
      notice.
- [x] The preliminary notice renders while `methodology.preliminary` is
      true, with `minSample` read from the payload rather than hardcoded —
      tested with an overridden value, so a hardcoded "1" fails.
- [x] `generatedAt` visible on every page that shows a statistic, labelled
      as a recompute time, and a methodology page rendering `methodology`
      verbatim.
- [x] `If-None-Match` used for the catalog files; the statistics file
      refetched and never stored.
- [x] Works at phone width; table is keyboard-navigable (native
      `<button>`/`<Link>` elements throughout — no custom click-only
      affordances).
- [x] No credentials, no cookies, no third-party analytics that receive
      card or query data without the owner's say-so — `http.ts` is the sole
      `fetch()` call site and always passes `credentials: 'omit'`.

### Struck as unsatisfiable, not quietly dropped

- ~~Faction-pair win rates page.~~ Deck statistics do not exist in the API.
  `/factions` was deleted rather than left as a permanent empty shell, and
  deriving faction rates from card rows would double-count games — see the
  non-goals in [`suppression-and-states.md`](./suppression-and-states.md).
- ~~Provenance showing `gameVersion`, `catalogVersion` and `releaseId`.~~
  The API publishes none of these. `generatedAt` is the only provenance
  there is, and substituting `cards.json`'s `ETag` as a pseudo-version would
  be a fabricated identifier.
- ~~Refuses politely on an unknown `schemaVersion`.~~ No payload carries
  one. A shape assertion at each loader boundary replaces it, which is
  defensive parsing rather than a version gate.
- ~~Release files cached by release id; a 404 on a release file named by an
  index yields a visible error.~~ There are no release ids and no index.

## Still open beyond the checklist

This site isn't deployed to Vercel yet ([`deployment.md`](./deployment.md))
— that's a manual step for the owner, not something this checklist item can
self-certify. The catalog origin it will point at is already live.
