import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { isTwoLetters } from '../../src/lib/initials/initials';
import { isRating } from '../../src/lib/rating/rating';
import {
  reviews,
  type Review,
  type ReviewWords,
} from '../../src/lib/reviews/reviews';
import { locales, type Locale } from '../../src/i18n/locales';

// lib/reviews INTEGRITY (board D2, owner fb-434) — the checks that need the
// file system and therefore run in the node `unit` project rather than beside
// the module: every picture path in the owner's list must exist under public/
// (a typo would otherwise ship as a broken disc — ui/Image's runtime fallback
// is a belt, this is the braces), and every row's five-language `words` must be
// real text (the type proves the KEYS exist; only a test can see an empty
// string). The type-level checks — two capitals, eleven half-steps, all five
// locales — already ran in `tsc`; the runtime guards are repeated here so a
// cast can never smuggle a bad row past CI.
//
// The list ships EMPTY (board D15); every `it.each` below is guarded so an
// empty list passes honestly instead of vacuously (a single `it` on the array
// itself is what runs then).

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const PUBLIC = join(ROOT, 'public');

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
    const words: ReviewWords = { title: 'T', text: 't', procedure: 'p' };
    const fourLanguages: Review = {
      id: 'probe',
      name: 'Probe',
      initials: 'PR',
      rating: 5,
      // @ts-expect-error — `de` is missing: a four-language review is not a Review
      words: { ro: words, en: words, fr: words, it: words },
    };
    expect(fourLanguages.id).toBe('probe');
  });

  if (reviews.length > 0) {
    it.each(reviews)('$id passes the runtime guards', (review) => {
      expect(isTwoLetters(review.initials)).toBe(true);
      expect(isRating(review.rating)).toBe(true);
      expect(review.name.trim().length).toBeGreaterThan(0);
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
      '$id has non-empty title, text and procedure in all five locales',
      (review) => {
        for (const locale of locales) {
          const words = review.words[locale];
          for (const field of ['title', 'text', 'procedure'] as const) {
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
  }
});
