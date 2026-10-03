// lib/rating — the star rating as ONE value type and ONE guard, React-free
// (CLAUDE.md §4's foundation ring; fenced by tests/unit/lib-react-free.test.ts).
// Born in the reviews-deck run (master board fb-432…448, 2026-09-10) as the
// owner's D2 decision made concrete: a rating in the site's review list must be
// a half-step between 0 and 5, and a wrong one must fail as EARLY as possible.
//
// WHY A LIB MODULE AND NOT A TYPE INSIDE ui/StarRating. Two files need the
// same meaning: the atom (its `value` prop — what a row of five stars can show)
// and the data list in lib/reviews (what the owner types). The atom may not
// import lib DATA (§4: atoms are site-agnostic) and the ring must never depend
// on the spine, so the meaning lives one level below both, as MECHANICS the
// way lib/scroll-lock does — a type, a predicate, an assertion, no React. Both
// consumers import it by full path; neither restates the eleven literals.
//
// TWO LAYERS, DELIBERATELY. The TYPE is the compile-time half: `rating: 4.3`
// in the list is a red squiggle in the editor and a failed `tsc` in CI before
// anything renders (the owner's "more than 2 letters = error" ask, applied to
// numbers). The GUARD is the runtime belt for values that arrive past the
// compiler — a cast, a JSON import, a story control — and it throws a
// RangeError in the lib/clock `createClock` style: loud, named, with the
// received value in the message.

/** The eleven legal values — whole stars and halves, nothing in between. */
export type Rating = 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5;

/** The ring's ceiling: five stars, always (§ the reviews board — "there will always be 5 stars"). */
export const RATING_MAX = 5;

/**
 * Whether `value` is one of the eleven legal ratings. `Number.isInteger(value
 * * 2)` is the half-step test: it accepts 3.5 (7) and rejects 3.25 (6.5), and
 * because NaN and ±Infinity fail `Number.isFinite` first they never reach it.
 */
export function isRating(value: unknown): value is Rating {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= RATING_MAX &&
    Number.isInteger(value * 2)
  );
}

/**
 * The runtime belt. `caller` names the throwing site in the message so a
 * failure in a story or a test reads as "StarRating: …" rather than as an
 * anonymous RangeError.
 * @throws RangeError when `value` is not a legal rating.
 */
export function assertRating(
  value: unknown,
  caller: string,
): asserts value is Rating {
  if (!isRating(value)) {
    throw new RangeError(
      `${caller}: rating must be a half-step from 0 to ${RATING_MAX} (0, 0.5, 1, … 5); received ${typeof value === 'string' ? JSON.stringify(value) : String(value)}.`,
    );
  }
}
