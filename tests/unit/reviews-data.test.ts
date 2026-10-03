import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { REVIEWS_NOW } from '../../src/components/sections/ReviewsCarousel/ReviewsCarousel.fixtures';
import { isTwoLetters } from '../../src/lib/initials/initials';
import { isRating } from '../../src/lib/rating/rating';
import {
  reviews,
  type Review,
  type ReviewWords,
} from '../../src/lib/reviews/reviews';
import { isIsoDate } from '../../src/lib/time-ago/time-ago';
import { locales, type Locale } from '../../src/i18n/locales';

// lib/reviews INTEGRITY (board D2, owner fb-434) — the checks that need the
// file system or the calendar and therefore run in the node `unit` project
// rather than beside the module: every picture path in the list must exist
// under public/ (a typo would otherwise ship as a broken disc — ui/Image's
// runtime fallback is a belt, this is the braces), every posting day must be
// a real day that has already happened, the list must be NEWEST FIRST (the
// deck's order), every row's five-language `words` must be real text (the type
// proves the KEYS exist; only a test can see an empty string), and no two
// reviews may share a title in any language — the owner's rule for the
// titles, which name the one characteristic each review is about ("i do not
// want any repetitions or repeted characteristics", 2026-09-30). The
// type-level checks — two capitals, eleven half-steps, all five locales, a
// date with its dashes — already ran in `tsc`; the runtime guards are
// repeated here so a cast can never smuggle a bad row past CI.
//
// Empty is still a LEGAL state (board D15): every `it.each` below is guarded
// so an empty list passes honestly instead of vacuously.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const PUBLIC = join(ROOT, 'public');

/** Today in UTC, `YYYY-MM-DD` — ISO days compare correctly as strings. */
const TODAY = new Date().toISOString().slice(0, 10);

/**
 * The stories' pinned clock as a day: the band's stories, its tests and
 * Pages/Home all measure "how long ago" for the real list from REVIEWS_NOW
 * (the fabricated demo rows were dropped on the owner's word, 2026-10-01:
 * "all fabricated ones need to be dropped"). lib/time-ago throws on a day
 * after its clock, so the list is checked HERE first (G2 react, 2026-09-30):
 * a review newer than the pin fails with the name of the constant to move,
 * instead of as a crash inside the stories.
 */
const PINNED_DAY = REVIEWS_NOW.toISOString().slice(0, 10);
const MOVE_THE_PIN =
  'newer than the stories’ pinned clock — move REVIEWS_NOW in sections/ReviewsCarousel/ReviewsCarousel.fixtures.ts to this day or later';

describe('lib/reviews — the list is well-formed', () => {
  it('is an array (empty is a legal state — board D15)', () => {
    expect(Array.isArray(reviews)).toBe(true);
  });

  it('ids are unique, kebab-case and dot-free (React keys and the `review-${id}-title` HTML id seed)', () => {
    const ids = reviews.map((review) => review.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it('the type refuses a review with a missing language (board D18 — five locales or it does not compile)', () => {
    expectTypeOf<Review['words']>().toEqualTypeOf<
      Readonly<Record<Locale, ReviewWords>>
    >();
    const words: ReviewWords = { title: 'T', text: 't' };
    const fourLanguages: Review = {
      id: 'probe',
      name: 'Probe',
      initials: 'PR',
      rating: 5,
      postedOn: '2025-06-14',
      // @ts-expect-error — `de` is missing: a four-language review is not a Review
      words: { ro: words, en: words, fr: words, it: words },
    };
    expect(fourLanguages.id).toBe('probe');
  });

  it('the type refuses a posting day without its dashes', () => {
    const words: ReviewWords = { title: 'T', text: 't' };
    const undated: Review = {
      id: 'probe',
      name: 'Probe',
      initials: 'PR',
      rating: 5,
      // @ts-expect-error — not `YYYY-MM-DD`
      postedOn: '20250614',
      words: { ro: words, en: words, de: words, fr: words, it: words },
    };
    expect(undated.id).toBe('probe');
  });

  if (reviews.length > 0) {
    it.each(reviews)('$id passes the runtime guards', (review) => {
      expect(isTwoLetters(review.initials)).toBe(true);
      expect(isRating(review.rating)).toBe(true);
      expect(review.name.trim().length).toBeGreaterThan(0);
    });

    it.each(reviews)(
      '$id was posted on a real day that has already happened',
      (review) => {
        expect(isIsoDate(review.postedOn)).toBe(true);
        expect(review.postedOn <= TODAY, review.postedOn).toBe(true);
        expect(
          review.postedOn <= PINNED_DAY,
          `${review.id}: ${review.postedOn} ${MOVE_THE_PIN}`,
        ).toBe(true);
      },
    );

    it('is ordered newest first (the deck shows the list in its order)', () => {
      const days = reviews.map((review) => review.postedOn);
      expect(days).toEqual([...days].sort().reverse());
    });

    it.each(reviews)(
      '$id has its picture on disk (if it has one)',
      (review) => {
        if (!review.picture) return;
        expect(review.picture.src.startsWith('/images/reviews/')).toBe(true);
        expect(existsSync(join(PUBLIC, review.picture.src))).toBe(true);
      },
    );

    it.each(reviews)(
      '$id has a non-empty title and text in all five locales',
      (review) => {
        for (const locale of locales) {
          const words = review.words[locale];
          for (const field of ['title', 'text'] as const) {
            expect(
              words[field].trim().length,
              `${locale}: ${review.id}.${field}`,
            ).toBeGreaterThan(0);
          }
          // Board D6: the card generates the quotation marks — a row must not
          // carry its own, or a visitor reads doubled quotes.
          expect(words.text, `${locale}: ${review.id}.text`).not.toMatch(
            /^[„“"«]|[”“"»]$/,
          );
        }
      },
    );

    it.each(locales)(
      '%s: no two reviews share a title (one characteristic per review)',
      (locale) => {
        const titles = reviews.map((review) =>
          review.words[locale].title.trim().toLocaleLowerCase(locale),
        );
        expect(new Set(titles).size, titles.join(' · ')).toBe(titles.length);
      },
    );
  }
});
