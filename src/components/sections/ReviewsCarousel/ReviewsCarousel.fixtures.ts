// sections/ReviewsCarousel — the band's STORY/TEST CLOCK, and nothing else.
// NEVER SHIPPED: no runtime file may import this one — the fence is
// ReviewsCarousel.test.tsx's ?raw guard over the band and its island, which
// refuses any `.fixtures` import and any mention of REVIEWS_NOW in their code.
//
// ── NO FABRICATED REVIEWS, ANYWHERE (owner, 2026-10-01: "all fabricated ones
// need to be dropped"). Until that day this file also held six demo rows and
// their three demo portraits — the stories' reviews since the band was built,
// in lib/reviews from 2026-09-20 to 2026-09-30, then here — and a second
// clock that measured them. All of it was dropped on the owner's word: the
// stories and the tests now render the REAL list (lib/reviews), chosen by
// position or by property and never by id, so an edit to the list cannot
// break them. Where a test needs a shape the real list cannot give — a
// controlled day, a half-star rating — it builds a placeholder row in the
// test itself whose words say plainly what they are ('Nume test',
// 'Titlu test', 'Text test.'): never an invented patient, never invented
// patient prose.
//
// ── ONE CLOCK: REVIEWS_NOW, SHARED. The band's stories, its tests,
// src/app/[locale]/(home)/Home.stories.tsx (Pages/Home) and
// tests/unit/reviews-data.test.ts all read it; the data test holds every real
// `postedOn` at or before it, and its failure message names this constant.
// The split into two clocks on 2026-09-30 kept the demo baselines still while
// the real list grew; with no demo rows left, there is nothing for a second
// clock to keep still.
//
// ── NO IMPORTS AT ALL: tests/unit/reviews-data.test.ts reads this file from
// the node `unit` project, which resolves no `@/` alias.

/**
 * THE STORY/TEST CLOCK for the real list — noon UTC on 2026-09-30, the day the
 * clinic's own Google reviews landed. Pinned so a baseline never ages: left to
 * the real clock, every card's „acum …" would change with the calendar and
 * every screenshot with it (lib/time-ago's WHEN "NOW" IS paragraph). WHEN A
 * NEWER REAL REVIEW LANDS, THIS MOVES — to that review's day or later, or
 * lib/time-ago throws for a day after `now` — and the frames that show the
 * real list change, which they would anyway, since a card appears.
 * lib/time-ago counts UTC calendar days, so the hour never matters; noon simply
 * keeps the pin far from either edge of its day.
 */
export const REVIEWS_NOW = new Date('2026-09-30T12:00:00Z');
