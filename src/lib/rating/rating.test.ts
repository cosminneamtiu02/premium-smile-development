import { describe, expect, expectTypeOf, it } from 'vitest';
import { assertRating, isRating, RATING_MAX, type Rating } from './rating';

// lib/rating — the eleven half-steps and nothing else. The type half is pinned
// with expectTypeOf (a `4.3` must not be a Rating at compile time); the runtime
// half is enumerated: every legal value passes, every shape of illegal value
// throws with the caller's name in the message.

// `as const satisfies`, so the table is checked AGAINST the union and, below,
// FOR it: drop a value here and the exhaustiveness pin fails (G3 ts L3).
const LEGAL = [
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5,
] as const satisfies readonly Rating[];

describe('lib/rating', () => {
  it('the type admits exactly the eleven half-steps', () => {
    expectTypeOf<Rating>().toEqualTypeOf<
      0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5
    >();
    // …and the runtime table below enumerates EVERY member, not a hand-typed
    // subset: the two halves of this file are one claim.
    expectTypeOf<(typeof LEGAL)[number]>().toEqualTypeOf<Rating>();
    // @ts-expect-error — 4.3 is not a half-step
    const wrong: Rating = 4.3;
    // @ts-expect-error — six stars do not exist
    const tooMany: Rating = 6;
    expect([wrong, tooMany]).toHaveLength(2);
    expect(RATING_MAX).toBe(5);
  });

  it.each(LEGAL)('accepts %s', (value) => {
    expect(isRating(value)).toBe(true);
    expect(() => assertRating(value, 'test')).not.toThrow();
  });

  it.each([
    ['a quarter step', 3.25],
    ['above the ceiling', 5.5],
    ['negative', -0.5],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['a numeric string', '4'],
    ['undefined', undefined],
    ['null', null],
  ])('rejects %s', (_label, value) => {
    expect(isRating(value)).toBe(false);
    expect(() => assertRating(value, 'StarRating')).toThrow(RangeError);
    expect(() => assertRating(value, 'StarRating')).toThrow(/^StarRating: /);
  });

  it('names the received value in the message', () => {
    expect(() => assertRating(4.3, 'StarRating')).toThrow(/received 4\.3\./);
  });
});
