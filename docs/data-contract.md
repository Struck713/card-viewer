# Data contract (condensed reference)

This is a condensed, implementation-facing view of
[`../stats-website-spec.md`](../stats-website-spec.md) §3. The spec is
authoritative — if anything here disagrees with it, the spec wins.

**On 2026-10-28 the API was restructured and the entire `/data/v1/…` space
was removed.** See the spec's §0 for what changed; this document describes
only the current contract.

## Endpoints

Three flat files, no index, no versioned paths, no release ids.

| Endpoint                             | Purpose                            | `ETag`? | What a 404 means                    |
| ------------------------------------ | ---------------------------------- | ------- | ----------------------------------- |
| `GET /data/cards.json`               | All cards                          | Yes     | Catalog unavailable at this origin  |
| `GET /data/keywords.json`            | Keyword text + ability→keyword map | Yes     | Catalog unavailable at this origin  |
| `GET /data/stats/card-winrates.json` | One win rate per collectible card  | **No**  | Statistics not published            |
| `GET /healthz`                       | Operator health check              | —       | N/A — never call this from the site |

No JSON body returns a URL any more, so there is nothing to resolve: each
path is a literal constant appended to the configured origin.

## TypeScript types

`lib/api/types.ts` is the authority — it carries these shapes plus the
comments explaining why each one is the way it is. **Do not duplicate the
full type block here.** The previous revision of this file did, and keeping
a second verbatim copy of the schema in prose is part of what made the
restructuring above so expensive to absorb.

The shapes, in brief: `CardsResponse { cards }`, `KeywordsResponse
{ keywords, abilityKeywords }`, and `CardWinratesResponse { generatedAt,
methodology, cards }` where each row is `CardWinrate { id, matches, wins,
losses, winRate: number | null }`.

## Non-negotiable rules carried over from the spec

Numbering is preserved so existing references don't rot; several rules
changed meaning when the API did.

1. **There is no version gate, because there is no version field.** No
   payload carries `schemaVersion`, `catalogVersion` or `gameVersion`, so
   the next breaking change will arrive unannounced — the 2026-10-28
   restructuring is the proof. Instead of a gate, each loader asserts the
   shape it expects (`Array.isArray(body.cards)`) and resolves to an error
   state, so valid JSON of the wrong shape never reaches the UI.
2. **Suppression, not zero.** `winRate === null` means "not enough data",
   never `0`. **And zero is real:** `winRate === 0` with `matches > 0` means
   the card lost every game it was in, and both states appear in every live
   response (59 zeros beside 40 nulls when last sampled). Never
   `?? 0`, never `|| 0`, and never sort a null as `0`. See
   [`suppression-and-states.md`](./suppression-and-states.md) for the full
   treatment — the spec calls this the rule most likely to be gotten wrong.
3. **Nothing ties the statistics to a catalog version.** No version
   identifiers exist anywhere in the API, so there is no cross-check to
   perform. Don't invent one, and don't claim the two halves agree — or
   disagree.
4. **There is no slicing at all.** Not by tier, match type, patch, date,
   region, deck or player. One figure per card.
5. **There are no deck or faction statistics.** Don't derive them from card
   rows either: the metric counts player-games by starting-deck inclusion,
   so summing a faction's cards counts the same game once per included card
   of that colour. The number would be fabricated.
6. **The API publishes no precision hint.** `lib/format/rates.ts` is the
   only place that decides it — one decimal place. `winRate` arrives at full
   float precision (`0.6666666666666666`).
7. **Sample sizes are exact, tiny, and mandatory context.** `matches`,
   `wins` and `losses` are raw counts, mostly 0–6, with no suppressed state
   and no rounding. Always show a rate beside its record.
8. **`generatedAt` is a recompute clock, not a release id.** It advances on
   a roughly 60-second server-side recompute even when no figure changes,
   and always equals the server's own generation time. Never use it as a
   cache key, never present it as a publication date, and never treat it as
   identifying a fixed set of numbers.
