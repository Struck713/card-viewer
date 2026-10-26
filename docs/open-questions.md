# Open questions and definition of done

Carried over from spec §8/§9 so there's one tracked checklist inside `docs/`
instead of everyone re-reading the full spec to find it. Update this file's
checkboxes as work lands; don't let it drift from the spec if the spec is
revised — re-sync both when that happens.

## Questions for the owner before launch (spec §8)

- [x] **What is the public origin for `CATALOG_ORIGIN`?** We're hosting it
      ourselves *for now*: taking the catalog package out of the
      `vendor/cardgame` submodule and deploying it on its own Vercel
      project, reusing its own server logic rather than reinventing it.
      This is a stand-in, not permanent — if the game's own team deploys a
      real catalog origin later, we flip `CATALOG_ORIGIN` to point at that
      instead and retire ours. See
      [`catalog-hosting.md`](./catalog-hosting.md). (A Vercel URL given
      early on, `https://cardgame-xi-orpin.vercel.app/`, turned out to be
      the Godot game's HTML5 web export, not this — don't reuse it.) The
      actual origin value exists once that deploy lands.
- [x] **Has a catalog release been published, and with which
      `catalogVersion` / `gameVersion`?** Being published now, as the
      candidate already sitting exported in the submodule:
      `0.1.0-candidate.1` / `unreleased`. Still placeholder labels — see
      [`catalog-hosting.md`](./catalog-hosting.md) for what happens when the
      owner finalizes real ones.
- [x] **Do card statistics exist yet?** No, confirmed directly by the owner.
      Build and ship card-browser-only mode first.
- [x] **Is there an image source for card art?** No — confirmed by the
      owner: there isn't any card art yet. Use a filler/placeholder image for
      every card until one exists; see [`architecture.md`](./architecture.md)
      and [`pages-and-components.md`](./pages-and-components.md).
- [x] **Where should the site be hosted, and under which domain?** Vercel;
      the owner hosts it themself. No domain decided yet. See
      [`deployment.md`](./deployment.md).

## Definition of done (spec §9)

- [x] Loads `latest.json`, resolves release URLs against the configured
      origin, and refuses politely on an unknown `schemaVersion`.
- [x] Card table with search, the five filters (color, type, rarity, mana
      cost, tribe), and sorting; defaults to collectible cards only.
- [x] Keyword text resolved through `abilityKeywords`, with the description
      fallback; no raw ability key ever shown to a user.
- [x] Statistics render per slice, with sample sizes, and suppressed figures
      shown as "not enough data" — **verified against a fixture where keys
      are absent, as an automated test**, not a manual look.
- [x] A missing stats release yields a working card browser plus an honest
      notice; a 404 on a release file named by an index yields a visible
      error.
- [x] Faction-pair win rates page.
- [x] Provenance (`gameVersion`, `catalogVersion`, `releaseId`,
      `generatedOn`) visible on every page that shows a statistic, and a
      methodology page rendering `method` verbatim.
- [x] Release files cached by release id; `If-None-Match` used for index
      files.
- [x] Works at phone width; table is keyboard-navigable (native
      `<button>`/`<Link>` elements throughout — no custom click-only
      affordances).
- [x] No credentials, no cookies, no third-party analytics that receive
      card or query data without the owner's say-so — `fetchJson.ts` is
      the sole `fetch()` call site and always passes `credentials: 'omit'`.

All nine implemented and automated-tested (see [`testing.md`](./testing.md))
as of the initial build. Still open: the three Vercel projects
([`deployment.md`](./deployment.md)) aren't deployed yet — that's a manual
step for the owner, not something this checklist item can self-certify.
