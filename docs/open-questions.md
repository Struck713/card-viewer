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
- [x] **Will the catalog be versioned again, and under what scheme?**
      **No — confirmed by the owner: there will be no catalog versioning.**
      So the unversioned flat paths are the permanent contract, not a
      temporary state, and removing the `/data/v1/releases/<version>/…`
      plumbing rather than leaving it dormant was the right call rather than
      a trade. Don't reintroduce version fields, a schema gate or
      release-addressed caching in anticipation of versioning returning.
- [x] **Can `card-winrates.json` get an `ETag`?** **Not needed — confirmed
      by the owner: the statistics shouldn't be aggressively cached anyway,
      because they can change at any moment.** So refetching the whole
      ~10 KB file every load is the intended behaviour, not a workaround for
      a missing header, and the absent `ETag` matches what the data wants.
      No upstream request to make. **Extended 2026-10-28:** the owner got
      the game's developer to approve the site hitting the catalog API
      directly on every load too, so `cards.json`/`keywords.json`'s `ETag`
      — which does exist — is now unused by the client for the same
      reason. No caching anywhere in the data layer, by agreement rather
      than by missing header.
- [x] **Is labelling preliminary data the right call?** **Yes — confirmed
      by the owner: a 100% win rate from a single match is fine to publish,
      as long as the sample is apparent.** The win–loss record beside every
      rate is what makes it apparent, backed by the preliminary notice. Do
      **not** add a client-side minimum sample: it would mean the site
      disagreeing with the publisher about what is publishable, and it would
      hide real data. Treat "every rate appears beside its record" as a
      standing requirement — spec §5.3 — not an incidental design choice.

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
- [x] **No win rate is ever rendered without its win–loss record**, and no
      client-side minimum sample is applied — automated tests that fail if
      the Record column is removed.
- [x] A missing statistics file yields a working card browser plus an honest
      notice.
- [x] The preliminary notice renders while `methodology.preliminary` is
      true, with `minSample` read from the payload rather than hardcoded —
      tested with an overridden value, so a hardcoded "1" fails.
- [x] `generatedAt` visible on every page that shows a statistic, labelled
      as a recompute time, and a methodology page rendering `methodology`
      verbatim.
- [x] The app's own code sends no `If-None-Match` for any file, stores no
      response body, and writes nothing to `localStorage` — all three
      files refetched fresh on every page load. (The browser's own HTTP
      cache may still revalidate a `no-cache` resource on its own; that's
      not the app caching anything.)
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
