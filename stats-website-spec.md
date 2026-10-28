# Spec: card statistics website

A brief for whoever (or whatever) builds a public statistics website on top of
this game's card catalog and card-statistics API. It is self-contained: every
schema the site consumes is written out below, so you do not need the game's
source to build against it.

Read §1 and §0 before planning anything.

---

## 0. Revision history

**2026-10-28 — the API was restructured. The entire `/data/v1/…` URL space is
gone.** Every path under it now returns `404`. There is no index file, no
release id, no `schemaVersion`/`catalogVersion`/`gameVersion` envelope on any
payload, and no versioned path under any spelling. The statistics half is now
*published* — but as a single flat, unversioned, continuously recomputed file,
not as the sliced, batched releases the previous revision of this document
specified. Deck statistics were never implemented and no longer appear in the
contract at all.

This section is the only place in this repository that **documents** the
previous contract. Elsewhere, `data/v1` appears only in statements that it
is gone, and in the one piece of code that sweeps its leftovers out of a
returning visitor's `localStorage`. If you are carrying a memory of the old
shape — slices by `tierGroup` × `matchType`, draw/keep/play rates,
`stats/latest.json`, `?stats=<releaseId>` pinning, immutable release
caching, deck statistics — all of it is gone, and the plumbing was deleted
rather than left dormant. Everything below describes what the origin
actually serves, verified by probing it.

---

## 1. What exists today

The data source is a **static, anonymous, read-only JSON API**. No API key, no
login, no query parameters, no per-card route, no database. Three flat files
share one origin, and all of them are live:

| Data | URL | Cache headers |
|---|---|---|
| Card catalog | `GET /data/cards.json` | `no-cache`, **with** `ETag` |
| Keywords | `GET /data/keywords.json` | `no-cache`, **with** `ETag` |
| Card win rates | `GET /data/stats/card-winrates.json` | `no-cache`, **no** `ETag` |
| Health check | `GET /healthz` | Operator-only, not part of the data contract |

Anything else returns `404` with a JSON body: `{"error":"not found"}`.

Consequences you must design around:

1. **The origin comes from configuration** (`CATALOG_ORIGIN`), never a
   hardcoded domain.
2. **Nothing is versioned, and nothing announces a breaking change.** No
   payload carries a version field, so there is no schema gate to write and no
   warning before the next restructuring — the one in §0 arrived unannounced.
   Parse defensively: assert the shape you expect at the boundary and resolve
   to an error state, rather than letting a changed payload reach the UI.
3. **Statistics are a live view, not a batch publication.** There is no
   realtime feed, no per-match data and no player lookup, but there is also no
   snapshot: `generatedAt` advances on a roughly 60-second server-side
   recompute, and the figures themselves move between loads. Two visitors a
   minute apart can legitimately see different numbers.
4. **The statistics file can still 404.** It is published today, but the site
   must remain a fully useful card browser without it, showing an honest empty
   state rather than an error page or zeros.
5. **There is no card art in this API** — art paths are deliberately not
   exported. Build a text/type-based visual design, or ask the owner for an
   image source separately.

## 2. Configuration

```
CATALOG_ORIGIN   e.g. https://catalog.example.com   (required, no trailing slash)
```

Every path is a fixed, literal constant — no payload returns a URL to resolve
any more, so there is nothing to join against the origin beyond string
concatenation:

```js
const cards = await (await fetch(`${origin}/data/cards.json`)).json();
```

For local development, serve the §6 fixtures instead of the live origin. That
is the only way to exercise the statistics-404, no-published-row and
`preliminary: false` paths, which the live origin cannot produce on demand.

## 3. The API

### 3.1 Cards — `GET /data/cards.json`

`{ "cards": [...] }`, sorted by `id`. No envelope. Currently 176 cards /
~82 KB — small enough to fetch once and filter in the browser, which is the
intended pattern.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable. The join key for statistics. |
| `name` | string | |
| `color` | `GREEN` `CRIMSON` `BLACK` `ORANGE` `TEAL` `GENERIC` | `GENERIC` is playable by every faction. |
| `type` | `CREATURE` `STRATAGEM` `LOCATION` | |
| `rarity` | `COMMON` `RARE` `EPIC` `LEGENDARY` | |
| `manaCost` | integer | Printed cost, 1–10 in current data. |
| `attack` | integer \| null | `null` for stratagems and locations. |
| `health` | integer \| null | `null` for stratagems. |
| `tribe` | string \| null | Current values: `bat` `mech` `monstrosity` `tank` `wolf` `yeti`. A tribe is **not** a keyword. |
| `description` | string | Printed rules text, numbers already resolved. |
| `abilities` | string[] | Ability keys as printed, e.g. `guardian`, `shielded_1`, `reinforce_4`. |
| `collectible` | boolean | `false` for tokens/forms that are only in the file because a selected card references them. **Default every list and chart to `collectible: true`.** |
| `isToken` | boolean | |
| `isTransformForm` | boolean | Some card transforms into this one. |
| `transformInto` | string \| null | Id within the same file. |
| `transformChoices` | string[] | Ids within the same file. |

### 3.2 Keywords — `GET /data/keywords.json`

No envelope. Two fields:

- `keywords` — `[{ id, name, description }]`, the same text the game's tooltips
  use (currently 17).
- `abilityKeywords` — a map from **every ability key that appears in
  `cards.json`** to its keyword id, or `null` (currently 98 keys, 76 of them
  `null`). Parameterised keys resolve through their base: `shielded_1` →
  `shielded`, `reinforce_4` → `reinforce`.

A `null` mapping is normal and permanent for now: those are mostly "On play…" /
"On death…" effects whose readable text is already in the card's
`description`. **Never render a raw ability key** like `rummage_on_death` as
user-facing text — look it up, and fall back to the card's description.

### 3.3 Card win rates — `GET /data/stats/card-winrates.json`

```json
{
  "generatedAt": "2026-10-28T03:11:27.525Z",
  "methodology": {
    "metric": "starting_deck_inclusion",
    "modes": ["ranked_ai", "authoritative_pvp"],
    "aiSeats": "both",
    "copies": "once_per_player_game",
    "rulesVersions": "combined",
    "minSample": 1,
    "preliminary": true,
    "privacy": "No raw identities or deck lists. Small sample changes may reveal deck inclusion or outcomes."
  },
  "cards": [
    { "id": "b_001", "matches": 4, "wins": 3, "losses": 1, "winRate": 0.75 },
    { "id": "t_019", "matches": 0, "wins": 0, "losses": 0, "winRate": null }
  ]
}
```

- **There is no slicing.** No tier, no match type, no patch, no region, no date
  range, no deck. One figure per card. Do not build UI implying otherwise.
- **There is one metric,** `starting_deck_inclusion`: a card counts toward a
  match when it was in a player's starting deck, once per player per game
  however many copies the deck held. A win rate therefore describes *decks that
  included the card*, not the card's own contribution. There are no
  draw/keep/play rates.
- `cards` covers the **collectible** cards only (currently 168 rows against 176
  catalog cards; the 8 omitted are exactly the non-collectible transform
  forms). A catalog card with no row is "no published data".
- `wins + losses === matches` on every row, and `winRate === wins / matches`
  exactly. The rate is a raw fraction at full float precision — `1`, not
  `1.000` — so the **site** chooses display precision; the API no longer
  publishes a precision hint.
- `generatedAt` is **when the server last recomputed**, not a release date or a
  publication timestamp. It advances on a roughly 60-second recompute even when
  no figure changes. Show it, labelled as what it is ("Data as of…"), format it
  to the minute so it doesn't churn, and never use it as a cache key or treat
  it as an identifier for a fixed set of numbers.
- Read `methodology` from the file and render it verbatim. **Do not hardcode
  any of it** — `minSample` is `1` today and can change without notice.
- `methodology.preliminary` is `true` today, and `minSample: 1` means a figure
  can rest on a single game. Say so prominently; see §5.
- **`modes` includes `ranked_ai` and `aiSeats` is `both`, so matches against AI
  are counted.** A previous revision of this document asserted the opposite.
  Do not repeat that claim.

**Suppression — the rule most likely to be got wrong.** A figure the publisher
will not stand behind has `winRate: null` (paired with `matches: 0`). Null
means "not enough data". It is **never** `0`.

**And zero is real.** `winRate: 0` with `matches > 0` means the card lost every
game it was in — 59 of 168 rows were in that state when last sampled, sitting
right beside 40 rows that were `null`. Both states occur in every live
response, so this is not a theoretical rule:

- Use an explicit null check. Never `card.winRate || 0`, never
  `card.winRate ?? 0`.
- Render a null as "–" or "not enough data", with the minimum sample
  explained. Never as 0%, and **never sort it as 0** — a null must sort last in
  both directions, or it will be ranked among the cards that genuinely lost
  everything.
- A card with no row at all is "no published data", not "0% win rate". Make
  both visually distinct from a card that really did lose every game.
- `matches`, `wins` and `losses` have **no** suppressed state. They are always
  present, and `0` / `0–0` is a real "no games" — not "not enough data".

## 4. Client rules

1. **Fetch once, index by `id`, filter locally.** There is no server-side
   filtering; `?query=` strings are ignored. All search, sort and filtering
   happens in the client over the arrays you already hold.
2. **No caching.** Everything is `Cache-Control: no-cache`, so every load
   already revalidates on the origin's own terms. **Fetch all three files
   fresh on every page load and store nothing client-side** — no
   `If-None-Match`, no stored response body, nothing written to
   `localStorage`. This is an explicit owner decision (approved by the
   game's developer, 2026-10-28), not an oversight: `cards.json` and
   `keywords.json` do carry an `ETag`, and the client deliberately does not
   use it. A `304` there only ever saved bandwidth, not staleness — the
   origin's `no-cache` meant nobody was ever served stale data — so don't
   re-add `If-None-Match` as an optimization. `card-winrates.json` carries
   **no** `ETag` and never has, so it was always refetched every load; that
   half is unchanged. It is ~10 KB, and caching a continuously recomputed
   file would pin a visitor to numbers that have moved on.
3. **CORS.** `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers:
   If-None-Match`, `Access-Control-Expose-Headers: ETag`, no credentials. Never
   send cookies or auth headers; there is nothing to authenticate.
4. **Errors are real.** Unknown paths return a `404` with a JSON body (never a
   fallback page); other methods return `405`. Handle every non-2xx explicitly.
   There is no index naming a file any more, so each 404 has exactly one
   meaning: on `cards.json`/`keywords.json`, the catalog is not available at
   this origin; on `card-winrates.json`, statistics are not published.
5. **Methods.** `GET`, `HEAD`, `OPTIONS` only.

TypeScript types to build against:

```ts
type Color = 'GREEN' | 'CRIMSON' | 'BLACK' | 'ORANGE' | 'TEAL' | 'GENERIC';
type CardType = 'CREATURE' | 'STRATAGEM' | 'LOCATION';
type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

interface Card {
  id: string; name: string; color: Color; type: CardType; rarity: Rarity;
  manaCost: number; attack: number | null; health: number | null;
  tribe: string | null; description: string; abilities: string[];
  collectible: boolean; isToken: boolean; isTransformForm: boolean;
  transformInto: string | null; transformChoices: string[];
}

interface CardsResponse { cards: Card[] }
interface KeywordsResponse {
  keywords: { id: string; name: string; description: string }[];
  abilityKeywords: Record<string, string | null>;
}

interface StatsMethodology {
  metric: string; modes: string[]; aiSeats: string; copies: string;
  rulesVersions: string; minSample: number; preliminary: boolean;
  privacy: string;
}

// All five keys are always present. winRate === null is suppression;
// winRate === 0 is a REAL 0% and occurs in live data. Never conflate them.
interface CardWinrate {
  id: string; matches: number; wins: number; losses: number;
  winRate: number | null;
}

interface CardWinratesResponse {
  generatedAt: string; methodology: StatsMethodology; cards: CardWinrate[];
}
```

## 5. What the website must do

Minimum, in priority order:

1. **Card table.** All collectible cards, with client-side search by name and
   description, and filters for color, type, rarity, mana cost and tribe.
   Sortable columns, including the statistics columns once statistics load.
2. **Card detail.** Printed data, keyword explanations resolved through
   `abilityKeywords`, the card's win rate with its match count and win–loss
   record, and a clear statement when the rate is suppressed.
3. **Every rate beside its sample size — a hard requirement.** With
   `minSample` as low as 1, a bare percentage is misleading. A win rate must
   **never** appear without the win–loss record it was computed from. This is
   what makes publishing a 100%-from-one-match figure honest, and it is the
   reason the site does **not** suppress below a threshold of its own (§8
   question 3): the sample is shown, so the reader can judge it. Removing or
   hiding the record would silently turn an honest figure into a misleading
   one, so it is covered by a test, not left to review.
4. **A preliminary notice, prominently.** While `methodology.preliminary` is
   true, every page showing a statistic must say so and state `minSample` as
   read from the payload. It should also note that AI matches are included,
   since that surprises people.
5. **Provenance, always visible.** `generatedAt` is the only provenance the API
   publishes — show it wherever a statistic appears, labelled as a recompute
   time rather than a release. Plus a methodology page rendering the
   `methodology` block verbatim, with the site's own plain-language gloss kept
   clearly separate from the published values.
6. **Honest empty states.** No statistics file → the site still works as a card
   browser and says statistics are not published.

Quality bar: static hosting is enough (no backend, no server-side rendering
needed); works at phone width; keyboard-navigable table; no layout shift when
statistics load after cards; readable without colour alone (the factions are
colour-named — label them in text too).

## 6. Fixtures for local development

Serve these from `/data/...` locally and switch to `CATALOG_ORIGIN` later. They
are deliberately minimal but schema-accurate; the shapes are what matter,
including one card with a suppressed figure, **one card with a genuine 0% win
rate**, and one card with no statistics row at all.

Mirror the live transport too: `no-cache` throughout, a content-hash `ETag`
with a working `304` on the catalog files, and **no** `ETag` under
`/data/stats/`. The app's own code never sends `If-None-Match` (rule 2
above) — `fetchJson()` takes no conditional-request headers at all — so
the fixture server's `ETag`/`304` support exists only to prove *that*: it
still lets you confirm `localStorage` stays empty across reloads, and that
disabling the browser's own HTTP cache (DevTools → Network → "Disable
cache", or a hard reload) still shows `200`s with no app-level validator.
Don't expect a plain reload's Network panel to show only `200`s on the
catalog files: the *browser's own* HTTP cache will transparently add its
own conditional header for a `no-cache` resource it already has an `ETag`
for, independent of anything `fetchJson()` does, and the fixture server
will answer that with a real `304` — that's the browser revalidating on
its own terms, not the app caching anything.

`data/cards.json`:

```json
{
  "cards": [
    { "id": "b_001", "name": "Garbage Addict", "color": "BLACK", "type": "CREATURE",
      "rarity": "COMMON", "manaCost": 3, "attack": 1, "health": 1, "tribe": null,
      "description": "On play: Rummage. On death: Rummage.",
      "abilities": ["rummage", "rummage_on_death"], "collectible": true,
      "isToken": false, "isTransformForm": false, "transformInto": "cr_001t", "transformChoices": [] },
    { "id": "t_019", "name": "Serene Yeti", "color": "TEAL", "type": "CREATURE",
      "rarity": "EPIC", "manaCost": 4, "attack": 2, "health": 4, "tribe": "yeti",
      "description": "Ambush", "abilities": ["ambush"], "collectible": true,
      "isToken": false, "isTransformForm": false, "transformInto": null, "transformChoices": [] },
    { "id": "gen_str_001", "name": "Orbital Strike", "color": "GENERIC", "type": "STRATAGEM",
      "rarity": "RARE", "manaCost": 3, "attack": null, "health": null, "tribe": null,
      "description": "Deal 3 damage to any target.", "abilities": [], "collectible": true,
      "isToken": false, "isTransformForm": false, "transformInto": null, "transformChoices": [] },
    { "id": "cr_001t", "name": "Wretched Form", "color": "BLACK", "type": "CREATURE",
      "rarity": "COMMON", "manaCost": 3, "attack": 3, "health": 1, "tribe": null,
      "description": "Transformed form of Garbage Addict.", "abilities": [], "collectible": false,
      "isToken": false, "isTransformForm": true, "transformInto": null, "transformChoices": [] }
  ]
}
```

`data/keywords.json`:

```json
{
  "keywords": [
    { "id": "ambush", "name": "Ambush", "description": "Cannot be targeted when played. Loses Ambush after it attacks." },
    { "id": "rummage", "name": "Rummage", "description": "Select a card of lesser value in your graveyard, then return it to your hand. It costs one less." }
  ],
  "abilityKeywords": { "ambush": "ambush", "rummage": "rummage", "rummage_on_death": null }
}
```

`data/stats/card-winrates.json` — note `t_019` is suppressed (`winRate: null`),
`gen_str_001` has a **genuine 0%** that must never render as "not enough data",
and `cr_001t` is absent entirely:

```json
{
  "generatedAt": "2026-10-28T03:11:27.525Z",
  "methodology": {
    "metric": "starting_deck_inclusion",
    "modes": ["ranked_ai", "authoritative_pvp"],
    "aiSeats": "both",
    "copies": "once_per_player_game",
    "rulesVersions": "combined",
    "minSample": 1,
    "preliminary": true,
    "privacy": "No raw identities or deck lists. Small sample changes may reveal deck inclusion or outcomes."
  },
  "cards": [
    { "id": "b_001", "matches": 4, "wins": 3, "losses": 1, "winRate": 0.75 },
    { "id": "t_019", "matches": 0, "wins": 0, "losses": 0, "winRate": null },
    { "id": "gen_str_001", "matches": 2, "wins": 0, "losses": 2, "winRate": 0 }
  ]
}
```

Keep `generatedAt` fixed in fixtures. Never stamp a live clock into them.

## 7. Non-goals and hard limits

Do not build, and do not ask the API for:

- Player profiles, leaderboards, match history, or anything per-account. The
  published data contains no player or match identifiers, by design and by an
  automated privacy scan on the publishing side.
- Deck lists, deck codes, "top decks", or deck and faction statistics of any
  kind. **Deck statistics do not exist** — not merely deck lists.
- **Statistics the API does not publish, derived from the ones it does.** In
  particular, do not aggregate card rows into a faction or colour win rate. The
  metric counts player-games by starting-deck inclusion, so summing a faction's
  cards counts the same game once per included card of that colour. The result
  would be a fabricated number, and this is the trap most likely to be walked
  into.
- Slicing of any kind — by tier, match type, patch, region, date range or deck.
  One figure per card is all there is.
- Date-range or history views. There are no release ids and no snapshots; the
  only thing you have is the current recompute.
- Realtime or per-match feeds, webhooks, or writing anything back. The API is
  `GET`/`HEAD`/`OPTIONS` static JSON.
- Scraping the game client, the game's relay server, or the game repository's
  `data/cards/*.json` as a substitute. The catalog is the supported surface;
  the raw files include internal effect data that is deliberately not public.
- Inventing endpoints (`/cards/:id`, `?color=`, `/search`). They do not exist
  and will 404.
- **Inventing identifiers the API doesn't publish.** There is no catalog
  version, game version or stats release id anywhere. Do not substitute
  `cards.json`'s `ETag` as a pseudo-version, and do not present `generatedAt`
  as a release.

## 8. Questions for the owner

Resolved with the owner on 2026-10-28, and recorded here because each one
was a live design question that is now settled — treat them as constraints,
not as decisions to revisit:

1. ~~Will the catalog be versioned again?~~ **No. There will be no catalog
   versioning.** This is settled, not merely absent today, so the
   unversioned flat paths are the permanent contract and the removed
   `/data/v1/releases/<version>/…` plumbing is not coming back. Don't
   reintroduce version fields, a schema gate, or release-addressed caching
   in anticipation of it.
2. ~~Can `card-winrates.json` get an `ETag`?~~ **Not needed.** The figures
   can change at any moment, so the site should not be caching them
   aggressively in the first place — refetching the whole ~10 KB file on
   every load is the intended behaviour, not a workaround for a missing
   header. The absence of an `ETag` happens to match what the data wants.
   **Extended 2026-10-28 to the catalog too:** the owner got approval from
   the game's developer for the site to hit the catalog API directly on
   every load with nothing cached in between, so `cards.json`/
   `keywords.json`'s `ETag` is now unused by the client for the same
   reason — see rule 2 in §4.
3. ~~Should the site suppress below a threshold of its own?~~ **No.** A 100%
   win rate from a single match is acceptable to publish, as long as the
   sample is impossible to miss. That is what the win–loss record beside
   every rate is for, plus the preliminary notice. Do not add a client-side
   minimum — it would mean the site disagreeing with the publisher about
   what is publishable, and it would hide real data.
4. Is there an image source for card art? The API has none.
5. Where should the site be hosted, and under which domain?

## 9. Definition of done

- [ ] Loads the three flat files from the configured origin, and resolves a
      changed payload shape to an error state rather than a crash.
- [ ] Card table with search, the five filters, and sorting; defaults to
      collectible cards only.
- [ ] Keyword text resolved through `abilityKeywords`, with the description
      fallback; no raw ability key ever shown to a user.
- [ ] Win rates render with their match count and win–loss record. A `null`
      rate shows as "not enough data" and a **genuine `0`** shows as `0.0%` —
      verified against a fixture containing both (a test, not a manual look).
- [ ] A `null` rate sorts last in **both** directions, with a genuine `0`
      sorted as the real value it is — also a test.
- [ ] A missing statistics file yields a working card browser plus an honest
      notice.
- [ ] The preliminary notice renders while `methodology.preliminary` is true,
      with `minSample` read from the payload rather than hardcoded.
- [ ] `generatedAt` visible on every page that shows a statistic, labelled as a
      recompute time, and a methodology page rendering `methodology` verbatim.
- [ ] The app's own code sends no `If-None-Match` for any file, stores no
      response body, and writes nothing to `localStorage` (the browser's
      own HTTP cache may still revalidate on its own — that's not this).
- [ ] Works at phone width; table is keyboard-navigable.
- [ ] No credentials, no cookies, no third-party analytics that receive card or
      query data without the owner's say-so.

~~Faction-pair win rates page.~~ Struck: deck statistics do not exist in the
API, and deriving them from card rows would be a fabricated number (§7).

~~Provenance showing `gameVersion`, `catalogVersion` and `releaseId`.~~ Struck
as unsatisfiable: the API publishes none of these.

~~Refuses politely on an unknown `schemaVersion`; release files cached by
release id; a 404 on a release file named by an index yields a visible error.~~
Struck: there is no `schemaVersion`, no release id, and no index.
