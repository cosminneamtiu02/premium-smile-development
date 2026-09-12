import { describe, expect, expectTypeOf, it } from 'vitest';
import { assertTwoLetters, isTwoLetters, type Initials } from './initials';

// lib/initials — two capitals at compile time, two letters at runtime. The
// Romanian fixture carries the comma-below Ș (U+0218): the type must admit it,
// and the belt must accept it whether it arrives as a capital or not.

describe('lib/initials', () => {
  it('the type admits two capitals of the five languages and nothing longer', () => {
    expectTypeOf<'AP'>().toExtend<Initials>();
    expectTypeOf<'ȘT'>().toExtend<Initials>();
    expectTypeOf<'ÄÖ'>().toExtend<Initials>();
    expectTypeOf<'ÉC'>().toExtend<Initials>();
    expectTypeOf<'ŐZ'>().toExtend<Initials>(); // Hungarian Ő (G3 ts L4)
    // @ts-expect-error — three letters
    const three: Initials = 'AND';
    // @ts-expect-error — one letter
    const one: Initials = 'A';
    // @ts-expect-error — lowercase is not honest data (CSS shouts, the list does not whisper)
    const lower: Initials = 'ap';
    // @ts-expect-error — a digit is not a letter
    const digit: Initials = 'A1';
    expect([three, one, lower, digit]).toHaveLength(4);
  });

  it.each(['AP', 'ȘT', 'ÄÖ', 'ap', 'Șt', 'ÉC'])(
    'accepts %s at runtime',
    (value) => {
      expect(isTwoLetters(value)).toBe(true);
      expect(() => assertTwoLetters(value, 'Avatar')).not.toThrow();
    },
  );

  it.each([
    ['three letters', 'AND'],
    ['one letter', 'A'],
    ['a digit', 'A1'],
    ['a space', 'A '],
    ['empty', ''],
    ['not a string', 12],
    ['undefined', undefined],
  ])('rejects %s', (_label, value) => {
    expect(isTwoLetters(value)).toBe(false);
    expect(() => assertTwoLetters(value, 'Avatar')).toThrow(RangeError);
    expect(() => assertTwoLetters(value, 'Avatar')).toThrow(/^Avatar: /);
  });

  it('quotes the received value in the message', () => {
    expect(() => assertTwoLetters('AND', 'Avatar')).toThrow(/received "AND"\./);
  });
});

describe('lib/initials — the guard returns a plain boolean (G3 typescript M1)', () => {
  it('leaves a failing string a string — a `value is string` predicate would make it never', () => {
    // TypeScript subtracts a predicate's type from the input on the FALSE
    // branch; with `value is string` an input that is already a `string`
    // would become `never` there. The boolean return keeps the branch honest.
    const input: string = 'AND';
    if (!isTwoLetters(input)) {
      expectTypeOf(input).toEqualTypeOf<string>();
    }
    expect(isTwoLetters(input)).toBe(false);
  });
});
