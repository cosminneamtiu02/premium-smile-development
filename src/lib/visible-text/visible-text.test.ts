import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  hasVisibleLetter,
  hasVisibleText,
  hasVisibleWord,
  isFinishedText,
  spelled,
  whyUnfinished,
  withoutInvisible,
  type FinishedText,
} from './visible-text';

// lib/visible-text — the site's tests of what a text shows, on ONE set of
// characters, beside the module (the lib-foldering lane). visible-text.ts's
// header argues every row pinned here: THE UNSEEN SET — white space, the
// controls, Unicode's default-ignorable code points, the braille blank and
// the interlinear annotation characters — shows nothing, everything else
// shows; a letter that shows is any letter but the four drawn as nothing, the
// Hangul fillers (THE LETTER RULE), and a word's worth is a letter or a digit
// that shows (THE WORD RULE); FINISHED TEXT is a well-formed string that
// shows something with no white space at either end; `withoutInvisible` drops
// what is drawn as nothing, reads a blank gap as a space and keeps white
// space; `spelled` quotes any value for a message.
// Every invisible character is built from its code point, never typed into
// the source, where it would show nothing either. Pure string work: it would
// run anywhere, and runs in the components project's Chromium only because
// that is where `src/**/*.test.ts` runs.

/** A text of the given code points, one character each. */
const of = (...codePoints: readonly number[]): string =>
  String.fromCodePoint(...codePoints);

/** A lone surrogate — `String.fromCodePoint` refuses one, so it is built
 *  from its code unit. */
const LONE_SURROGATE = String.fromCharCode(0xd800);

/** Values that are no string, each as a caller outside TypeScript could hand
 *  one over — `RegExp.test` reads every one of them as text. */
const NOT_STRINGS: ReadonlyArray<readonly [string, unknown]> = [
  ['undefined', undefined],
  ['null', null],
  ['an object', {}],
  ['a number', 7],
  ['a list of text', ['Înainte']],
];

/** A predicate on a string, called with a value that escaped the types. */
const askedOf = (predicate: (text: string) => boolean, value: unknown) =>
  predicate(value as string);

describe('hasVisibleText — a text that shows NOTHING', () => {
  it.each([
    ['an empty string', ''],
    ['spaces', '   '],
    ['a no-break space (U+00A0)', of(0xa0)],
    ['a narrow no-break space (U+202F), French’s before „:"', of(0x202f)],
    ['a tab and a line feed', '\t\n'],
    ['an ideographic space (U+3000)', of(0x3000)],
    ['a zero-width space (U+200B)', of(0x200b)],
    ['a soft hyphen (U+00AD)', of(0xad)],
    ['a word joiner (U+2060)', of(0x2060)],
    ['a byte-order mark (U+FEFF)', of(0xfeff)],
    ['a left-to-right mark (U+200E)', of(0x200e)],
    // The review's measured edges: no format characters, yet drawn as
    // nothing — or, the Hangul fillers, letters drawn as blank width.
    ['a Hangul filler (U+3164) — a letter, Lo', of(0x3164)],
    ['a halfwidth Hangul filler (U+FFA0) — a letter, Lo', of(0xffa0)],
    ['a variation selector (U+FE0F) alone', of(0xfe0f)],
    ['a variation selector (U+FE00) alone', of(0xfe00)],
    [
      'a variation selector past U+FFFF (U+E0100) — one code point, never two halves',
      of(0xe0100),
    ],
    ['a combining grapheme joiner (U+034F)', of(0x034f)],
    ['a Mongolian free variation selector (U+180B)', of(0x180b)],
    ['a Khmer inherent vowel (U+17B4)', of(0x17b4)],
    // Round 1 of the module's review (2026-10-21): the CONTROLS, the braille
    // blank and the interlinear annotation characters joined THE UNSEEN SET.
    [
      'NEL (U+0085) — the one character of Unicode’s White_Space that `\\s` misses, a C1 control',
      of(0x85),
    ],
    ['a C1 control (U+0080)', of(0x80)],
    ['a C1 control (U+009F)', of(0x9f)],
    ['NUL (U+0000) — the HTML parser drops it outright', of(0x0)],
    ['a C0 control (U+0007, the bell)', of(0x7)],
    ['DEL (U+007F)', of(0x7f)],
    [
      'the braille blank (U+2800) — blank on screen and on a braille display: THE KNOWN GAP, closed',
      of(0x2800),
    ],
    [
      'an interlinear annotation anchor (U+FFF9) — a format character no renderer ignores by default, blank in all three engines',
      of(0xfff9),
    ],
    ['an interlinear annotation terminator (U+FFFB)', of(0xfffb)],
    [
      'invisible characters among spaces',
      ` ${of(0x200b)}${of(0xa0)}${of(0xad)}\n${of(0x2060)} ${of(0x85, 0x2800, 0xfffa)}`,
    ],
  ])('%s', (_name, text) => {
    expect(hasVisibleText(text)).toBe(false);
  });

  it.each(NOT_STRINGS)(
    'answers false for a value that is no string — %s — where `RegExp.test` would read it as text („undefined", „null", „[object Object]")',
    (_name, value) => {
      expect(askedOf(hasVisibleText, value)).toBe(false);
    },
  );
});

describe('hasVisibleText — a text that SHOWS', () => {
  it.each([
    ['letters, diacritics and all', 'Înainte'],
    ['a letter of another script', 'Ψ'],
    ['digits — „2019"', '2019'],
    ['a mark', '.'],
    ['a combining mark alone (U+0301) — it draws', of(0x0301)],
    [
      'the Arabic number sign (U+0600) — a format character, Cf, that draws a sign',
      of(0x0600),
    ],
    [
      'the Arabic end of ayah (U+06DD) — a format character that draws',
      of(0x06dd),
    ],
    [
      'a braille pattern with a dot (U+2801) — the blank is the one braille cell in the set',
      of(0x2801),
    ],
    [
      'a word beside invisible characters — one character seen is enough',
      `${of(0x200b)}După${of(0xad)} `,
    ],
  ])('%s', (_name, text) => {
    expect(hasVisibleText(text)).toBe(true);
  });

  it('refuses EXACTLY THE UNSEEN SET — white space, the controls, the default-ignorable code points, the braille blank and U+FFF9–U+FFFB, 4262 code points — over every code point', () => {
    // The whole code space but the surrogates, one character at a time: the
    // set is what Unicode's own properties say, plus the four named by hand.
    const named = /[\s\p{Cc}\p{Default_Ignorable_Code_Point}]/u;
    const unseen: number[] = [];
    const byHand: string[] = [];
    for (let codePoint = 0; codePoint <= 0x10ffff; codePoint += 1) {
      if (codePoint >= 0xd800 && codePoint <= 0xdfff) continue;
      const character = of(codePoint);
      if (hasVisibleText(character)) continue;
      unseen.push(codePoint);
      if (!named.test(character)) {
        byHand.push(
          `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
        );
      }
    }
    expect(byHand).toEqual(['U+2800', 'U+FFF9', 'U+FFFA', 'U+FFFB']);
    expect(unseen).toHaveLength(4262);
  });
});

describe('hasVisibleLetter — no letter that SHOWS', () => {
  it.each([
    ['an empty string', ''],
    ['spaces', '   '],
    ['a dot', '.'],
    ['a dash', '-'],
    ['a number alone — „2019"', '2019'],
    [
      'a combining mark alone (U+0301) — it draws, but it is no letter',
      of(0x0301),
    ],
    ['the Arabic number sign (U+0600)', of(0x0600)],
    ['the braille blank (U+2800) — no letter, in the set or out', of(0x2800)],
    ['a zero-width space and a soft hyphen', of(0x200b, 0xad)],
    ['NEL (U+0085) and NUL (U+0000) — controls, no letters', of(0x85, 0x0)],
    ['an interlinear annotation anchor (U+FFF9)', of(0xfff9)],
    // THE LETTER RULE's four: letters (Lo) and default-ignorable both.
    ['a Hangul filler (U+3164)', of(0x3164)],
    ['a halfwidth Hangul filler (U+FFA0)', of(0xffa0)],
    ['a Hangul choseong filler (U+115F)', of(0x115f)],
    ['a Hangul jungseong filler (U+1160)', of(0x1160)],
    [
      'a Hangul filler beside a dot — the dot shows, the one letter does not',
      `${of(0x3164)}.`,
    ],
  ])('%s', (_name, text) => {
    expect(hasVisibleLetter(text)).toBe(false);
  });

  it.each(NOT_STRINGS)(
    'answers false for a value that is no string — %s — whose text `RegExp.test` would read („undefined" holds letters)',
    (_name, value) => {
      expect(askedOf(hasVisibleLetter, value)).toBe(false);
    },
  );
});

describe('hasVisibleLetter — a letter that SHOWS', () => {
  it.each([
    ['a word, diacritics and all', 'Înainte'],
    ['one small letter', 'ș'],
    ['a letter of another script', 'Ψ'],
    ['a capital beside a dot', 'É.'],
    ['an Arabic letter', of(0x0628)],
    ['a CJK ideograph', of(0x5b57)],
    ['a letter beside a Hangul filler', `${of(0x3164)}a`],
    ['a letter beside invisible characters', `${of(0x200b)}x${of(0xad)}`],
    [
      'a letter beside a control and the braille blank',
      `${of(0x85)}x${of(0x2800)}`,
    ],
  ])('%s', (_name, text) => {
    expect(hasVisibleLetter(text)).toBe(true);
  });
});

describe('hasVisibleWord — no letter or digit that SHOWS', () => {
  it.each([
    ['an empty string', ''],
    ['spaces', '   '],
    ['a dot', '.'],
    ['an ellipsis', '…'],
    ['a dash', '-'],
    ['a tooth (U+1F9B7) — an emoji names nothing', of(0x1f9b7)],
    [
      'a mark and an emoji with its presentation selector',
      `.${of(0x2764, 0xfe0f)}`,
    ],
    ['a Hangul filler (U+3164) — a letter drawn as nothing', of(0x3164)],
    ['a combining mark alone (U+0301)', of(0x0301)],
    ['the braille blank (U+2800)', of(0x2800)],
  ])('%s', (_name, text) => {
    expect(hasVisibleWord(text)).toBe(false);
  });

  it.each(NOT_STRINGS)(
    'answers false for a value that is no string — %s',
    (_name, value) => {
      expect(askedOf(hasVisibleWord, value)).toBe(false);
    },
  );
});

describe('hasVisibleWord — a letter or a digit that SHOWS', () => {
  it.each([
    ['a word, diacritics and all', 'Înainte'],
    ['a year — „2019", the label a pair may honestly carry', '2019'],
    ['a digit beside a mark', '1.'],
    ['a letter of another script', 'Ψ'],
    ['a superscript digit (U+00B2) — a number, No', of(0xb2)],
    ['a Roman numeral (U+216B) — a number, Nl', of(0x216b)],
    ['a digit beside a Hangul filler', `${of(0x3164)}7`],
  ])('%s', (_name, text) => {
    expect(hasVisibleWord(text)).toBe(true);
  });
});

describe('THE LETTER RULE and THE WORD RULE — over every code point', () => {
  it('differ from \\p{L} and from [\\p{L}\\p{N}] on EXACTLY the four Hangul fillers — and every character either takes shows (hasVisibleText)', () => {
    // Measured here as the TypeScript review measured it: the whole code
    // space but the surrogates, one character at a time.
    const plainLetter = /\p{L}/u;
    const plainWord = /[\p{L}\p{N}]/u;
    const letterDiffers: string[] = [];
    const wordDiffers: string[] = [];
    let unseen = 0;
    const name = (codePoint: number): string =>
      `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
    for (let codePoint = 0; codePoint <= 0x10ffff; codePoint += 1) {
      if (codePoint >= 0xd800 && codePoint <= 0xdfff) continue;
      const character = of(codePoint);
      const letter = hasVisibleLetter(character);
      const word = hasVisibleWord(character);
      if (letter !== plainLetter.test(character)) {
        letterDiffers.push(name(codePoint));
      }
      if (word !== plainWord.test(character)) wordDiffers.push(name(codePoint));
      if ((letter || word) && !hasVisibleText(character)) unseen += 1;
      // A letter is always a word's worth.
      if (letter && !word) unseen += 1;
    }
    const fillers = ['U+115F', 'U+1160', 'U+3164', 'U+FFA0'];
    expect(letterDiffers).toEqual(fillers);
    expect(wordDiffers).toEqual(fillers);
    expect(unseen).toBe(0);
  });
});

describe('isFinishedText and whyUnfinished — FINISHED TEXT', () => {
  it.each([
    ['a word', 'Înainte'],
    ['a sentence with its no-break space', `Le temps${of(0x202f)}: deux`],
    ['a number', '2019'],
    ['a mark — it shows; the letter and word rules are the labels’', '.'],
    [
      'an invisible character inside, never at an end that trim() removes',
      `Peri${of(0x200b)}uța`,
    ],
  ])('takes %s', (_name, text) => {
    expect(isFinishedText(text)).toBe(true);
    expect(whyUnfinished(text)).toBeUndefined();
  });

  it.each([
    ['undefined', undefined, 'it is not a string, got undefined'],
    ['null', null, 'it is not a string, got null'],
    ['a number', 7, 'it is not a string, got 7'],
    ['a list', ['a'], 'it is not a string, got <object>'],
    ['an empty string', '', 'it shows nothing, got ""'],
    ['spaces', '  ', 'it shows nothing, got "  "'],
    ['a zero-width space', of(0x200b), 'it shows nothing, got "\\u{200B}"'],
    ['a Hangul filler', of(0x3164), 'it shows nothing, got "\\u{3164}"'],
    ['NEL', of(0x85), 'it shows nothing, got "\\u{0085}"'],
    ['the braille blank', of(0x2800), 'it shows nothing, got "\\u{2800}"'],
    [
      'a space at the end',
      'Text ',
      'it has white space at its start or end, got "Text "',
    ],
    [
      'a no-break space at the start',
      `${of(0xa0)}Text`,
      'it has white space at its start or end, got "\\u{00A0}Text"',
    ],
  ])('refuses %s, and says which condition failed', (_name, value, why) => {
    expect(isFinishedText(value)).toBe(false);
    expect(whyUnfinished(value)).toBe(why);
  });

  it('asks the conditions in order — not a string, not well-formed, shows nothing, white space at an end — so a blank text is named blank, not untrimmed', () => {
    expect(whyUnfinished(' ')).toBe('it shows nothing, got " "');
    expect(whyUnfinished(`${of(0x200b)} `)).toBe(
      'it shows nothing, got "\\u{200B} "',
    );
    // A lone surrogate is named first, before the spaces round it.
    expect(whyUnfinished(` ${LONE_SURROGATE} `)).toBe(
      'it is not well-formed (a lone surrogate), got " \\u{D800} "',
    );
  });

  it.each([
    ['a lone high surrogate alone', LONE_SURROGATE, '"\\u{D800}"'],
    [
      'a lone high surrogate after letters — it ends the text',
      `Ab${LONE_SURROGATE}`,
      '"Ab\\u{D800}"',
    ],
    [
      'a lone low surrogate inside a word',
      `Peri${String.fromCharCode(0xdc00)}uța`,
      '"Peri\\u{DC00}uța"',
    ],
    [
      'a pair in the wrong order — a low surrogate, then a high one',
      `Titlu ${String.fromCharCode(0xdc00, 0xd800)}`,
      '"Titlu \\u{DC00}\\u{D800}"',
    ],
  ])(
    'refuses %s — not well-formed: a code point outside THE UNSEEN SET, so it showed, and the page printed U+FFFD in its place (round 2 of the module’s review)',
    (_name, text, quoted) => {
      // The premise: the set alone reads a lone surrogate as something seen.
      expect(hasVisibleText(text)).toBe(true);
      expect(isFinishedText(text)).toBe(false);
      expect(whyUnfinished(text)).toBe(
        `it is not well-formed (a lone surrogate), got ${quoted}`,
      );
    },
  );

  it('takes a surrogate PAIR — an astral character, whole — and an emoji that closes a title on its presentation selector: the end rule is white space alone', () => {
    for (const text of [
      `Zâmbete ${of(0x1f9b7)}`,
      // A red heart drawn as an emoji, U+2764 and U+FE0F: the selector is
      // invisible and no white space, so `trim()` keeps it at the end.
      `Cu drag ${of(0x2764, 0xfe0f)}`,
    ]) {
      expect(isFinishedText(text), spelled(text)).toBe(true);
      expect(whyUnfinished(text), spelled(text)).toBeUndefined();
    }
  });

  it('narrows NOTHING on its false branch — a refused string stays a string (the brand)', () => {
    const value = 'Înainte' as string | number;
    if (isFinishedText(value)) {
      expectTypeOf(value).toEqualTypeOf<FinishedText>();
      expectTypeOf(value).toExtend<string>();
    } else {
      // A guard onto a bare `string` would narrow this to `number`.
      expectTypeOf(value).toEqualTypeOf<string | number>();
    }
    expect(isFinishedText(value)).toBe(true);
  });
});

describe('withoutInvisible — the text as a reader sees it', () => {
  it('drops what is drawn as nothing and keeps the words and the white space', () => {
    expect(
      withoutInvisible(
        `Peri${of(0x200b)}uța${of(0xad)} de${of(0xa0)}dinți${of(0x202f)}:${of(0x85, 0x0)}\n${of(0xfeff, 0x34f, 0xfe0f, 0x180b, 0xe0100, 0x115f, 0x1160)}gata`,
      ),
    ).toBe(`Periuța de${of(0xa0)}dinți${of(0x202f)}:\ngata`);
  });

  it.each([
    [
      'the braille blank (U+2800) — a blank gap in all three engines',
      `Cea${of(0x2800)}mai${of(0x2800)}bună`,
    ],
    [
      'a Hangul filler (U+3164) — a blank gap in Chromium',
      `Cea${of(0x3164)}mai${of(0x3164)}bună`,
    ],
    [
      'a halfwidth Hangul filler (U+FFA0) — a blank gap in Chromium',
      `Cea${of(0xffa0)}mai${of(0xffa0)}bună`,
    ],
    [
      'an interlinear annotation anchor and terminator (U+FFF9, U+FFFB) — blank gaps in Chromium and Firefox',
      `Cea${of(0xfff9)}mai${of(0xfffb)}bună`,
    ],
  ])(
    'reads %s as ONE SPACE — the eye sees two words, never „Ceamaibună" (round 2 of the module’s review)',
    (_name, text) => {
      expect(withoutInvisible(text)).toBe('Cea mai bună');
    },
  );

  it('drops every character of the set that is no white space — U+FEFF too — but reads EXACTLY the six blank gaps as a space, over every code point', () => {
    const name = (codePoint: number): string =>
      `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
    const keptUnseen: string[] = [];
    const changedSeen: string[] = [];
    const spaced: string[] = [];
    for (let codePoint = 0; codePoint <= 0x10ffff; codePoint += 1) {
      if (codePoint >= 0xd800 && codePoint <= 0xdfff) continue;
      const character = of(codePoint);
      const read = withoutInvisible(character);
      if (read !== character && read !== '' && read !== ' ') {
        throw new Error(
          `${name(codePoint)}: neither kept, dropped nor a space`,
        );
      }
      if (read === ' ' && character !== ' ') spaced.push(name(codePoint));
      if (hasVisibleText(character)) {
        if (read !== character) changedSeen.push(name(codePoint));
      } else if (read === character) {
        keptUnseen.push(name(codePoint));
      }
    }
    // Nothing that shows is ever changed; of the set, only white space stays
    // — every `\s` character but U+FEFF, which is drawn as nothing — and the
    // blank gaps become a space, every other character of the set nothing.
    expect(changedSeen).toEqual([]);
    expect(keptUnseen).toEqual(
      [
        0x9, 0xa, 0xb, 0xc, 0xd, 0x20, 0xa0, 0x1680, 0x2000, 0x2001, 0x2002,
        0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a, 0x2028,
        0x2029, 0x202f, 0x205f, 0x3000,
      ].map(name),
    );
    expect(spaced).toEqual(
      [0x2800, 0x3164, 0xffa0, 0xfff9, 0xfffa, 0xfffb].map(name),
    );
  });

  it.each([
    ['undefined', undefined, 'undefined'],
    ['null', null, 'null'],
    ['a number', 7, '7'],
    ['a list of text', ['Înainte'], '<object>'],
    ['a symbol', Symbol('text'), '<symbol>'],
  ])(
    'refuses a value that is no string — %s — with a TypeError naming it `spelled`: no string to hand back, and „undefined" read as a word would pass a scan',
    (_name, value, named) => {
      // A value that escaped the types, as a caller outside TypeScript hands
      // one over.
      const read = () => withoutInvisible(value as unknown as string);
      expect(read).toThrow(TypeError);
      expect(read).toThrow(`withoutInvisible: expected a string, got ${named}`);
    },
  );

  it('gives the same answer every call — its global pattern holds no state between calls', () => {
    const text = `a${of(0x200b)}b`;
    expect([1, 2, 3].map(() => withoutInvisible(text))).toEqual([
      'ab',
      'ab',
      'ab',
    ]);
  });
});

describe('spelled — a value for an error message', () => {
  it.each([
    ['a word', 'Înainte', '"Înainte"'],
    ['the empty string', '', '""'],
    [
      'a plain space — kept, the one character of the set written as itself',
      ' a ',
      '" a "',
    ],
    ['a line feed', 'a\nb', '"a\\u{000A}b"'],
    ['a tab', '\t', '"\\u{0009}"'],
    ['a no-break space', of(0xa0), '"\\u{00A0}"'],
    [
      'French’s narrow no-break space',
      `Smile${of(0x202f)}:`,
      '"Smile\\u{202F}:"',
    ],
    ['a zero-width space', of(0x200b), '"\\u{200B}"'],
    ['NEL, a C1 control', of(0x85), '"\\u{0085}"'],
    ['NUL', of(0x0), '"\\u{0000}"'],
    ['the braille blank', of(0x2800), '"\\u{2800}"'],
    ['an interlinear annotation anchor', of(0xfff9), '"\\u{FFF9}"'],
    ['a Hangul filler', of(0x3164), '"\\u{3164}"'],
    [
      'a variation selector past U+FFFF — five digits, one code point',
      of(0xe0100),
      '"\\u{E0100}"',
    ],
    [
      'a lone surrogate — ONE escape style, never JSON’s lower-case one',
      `Titlu ${LONE_SURROGATE}`,
      '"Titlu \\u{D800}"',
    ],
    [
      'an astral character that shows — whole, as itself',
      of(0x1f9b7),
      `"${of(0x1f9b7)}"`,
    ],
    [
      'a double quote and a backslash — escaped',
      'a "b" \\ c',
      '"a \\"b\\" \\\\ c"',
    ],
  ])('spells %s', (_name, value, written) => {
    expect(spelled(value)).toBe(written);
  });

  it('spells a value that is no string BY ITS TYPE — a number or a boolean as written, never by running its code', () => {
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    let ran = false;
    const touchy = {
      toJSON: () => {
        ran = true;
        return 'ran';
      },
      get field() {
        ran = true;
        return 'ran';
      },
    };
    const trap = new Proxy(
      {},
      {
        get: () => {
          throw new Error('a trap ran');
        },
      },
    );
    for (const [value, written] of [
      [undefined, 'undefined'],
      [null, 'null'],
      [7, '7'],
      [-0, '-0'],
      [Number.NaN, 'NaN'],
      [true, 'true'],
      [BigInt(10), '<bigint>'],
      [Symbol('alt'), '<symbol>'],
      [() => 'alt', '<function>'],
      [['Înainte'], '<object>'],
      [cycle, '<object>'],
      [touchy, '<object>'],
      [trap, '<object>'],
    ] as const) {
      expect(spelled(value), written).toBe(written);
    }
    expect(ran, 'an object’s own code ran').toBe(false);
  });

  it('writes every character of the set as its code point — a quote that shows what it holds — over every code point', () => {
    const shownRaw: string[] = [];
    for (let codePoint = 0; codePoint <= 0x10ffff; codePoint += 1) {
      if (codePoint >= 0xd800 && codePoint <= 0xdfff) continue;
      const character = of(codePoint);
      if (character === ' ' || hasVisibleText(character)) continue;
      if (spelled(character).includes(character)) {
        shownRaw.push(codePoint.toString(16));
      }
    }
    expect(shownRaw).toEqual([]);
  });
});

describe('the shapes — each pinned directly, so a subtype cannot pass for it', () => {
  it('types each test as a plain predicate on a string, and the finished-text guard onto its brand', () => {
    // Checked by `tsc`, not by the runner: a pin of the function itself —
    // never of a table of them, whose element type absorbs a subtype (a type
    // guard, a function that returns `true`, a widened parameter all passed
    // the table form; the round-1 typescript review, measured).
    expectTypeOf(hasVisibleText).toEqualTypeOf<(text: string) => boolean>();
    expectTypeOf(hasVisibleLetter).toEqualTypeOf<(text: string) => boolean>();
    expectTypeOf(hasVisibleWord).toEqualTypeOf<(text: string) => boolean>();
    expectTypeOf(isFinishedText).toEqualTypeOf<
      (value: unknown) => value is FinishedText
    >();
    expectTypeOf(whyUnfinished).toEqualTypeOf<
      (value: unknown) => string | undefined
    >();
    expectTypeOf(withoutInvisible).toEqualTypeOf<(text: string) => string>();
    expectTypeOf(spelled).toEqualTypeOf<(value: unknown) => string>();
    // The brand is a string, and no plain string is one.
    expectTypeOf<FinishedText>().toExtend<string>();
    expectTypeOf<string>().not.toExtend<FinishedText>();
  });

  it.each([
    ['hasVisibleText', hasVisibleText],
    ['hasVisibleLetter', hasVisibleLetter],
    ['hasVisibleWord', hasVisibleWord],
  ])(
    '%s gives the same answer every call — a pattern with the `g` flag would remember where it ended',
    (_name, predicate) => {
      // On a text of ONE character seen, a `g` pattern answers true, then
      // false, then true again.
      const text = 'Ψ';
      expect([1, 2, 3].map(() => predicate(text))).toEqual([true, true, true]);
    },
  );
});
