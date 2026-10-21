import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ImagePath } from '../image-path/image-path';
import { isImagePath, isRecord, keyProblems } from './json-shape';

// lib/json-shape — the blog JSON's three shape checks, beside the module (the
// lib-foldering lane). json-shape.ts's header argues every row pinned here:
// a record is a plain object, never null and never an array; `keyProblems`
// lists the keys a reader does not know and the ones it misses, each quoted
// by lib/visible-text's `spelled`; a picture's path starts under /images/.
// Every invisible character is built from its code point, never typed into
// the source. Pure work on values: it would run anywhere, and runs in the
// components project's Chromium only because that is where
// `src/**/*.test.ts` runs.

/** A zero-width space (U+200B) — a key's character drawn as nothing. */
const ZERO_WIDTH_SPACE = String.fromCodePoint(0x200b);

describe('isRecord — a JSON object', () => {
  it.each([
    ['an object', { slug: 'x' }],
    ['an empty object', {}],
    ['an object with no prototype', Object.create(null) as object],
  ])('takes %s', (_name, value) => {
    expect(isRecord(value)).toBe(true);
  });

  it.each([
    ['null', null],
    ['an array — an object to `typeof`, a list to the file', ['slug']],
    ['a string', 'slug'],
    ['a number', 7],
    ['undefined', undefined],
    ['a boolean', true],
  ])('refuses %s', (_name, value) => {
    expect(isRecord(value)).toBe(false);
  });
});

describe('keyProblems — the keys a reader does not know, and the ones it misses', () => {
  const ALLOWED = ['title', 'summary', 'tags', 'alt'] as const;

  it('finds nothing in a record of exactly the allowed keys, in any order', () => {
    expect(
      keyProblems({ alt: '', tags: [], summary: 's', title: 't' }, ALLOWED),
    ).toEqual([]);
  });

  it('lists the unknown keys first, then the missing ones — each QUOTED, in the order the record and the list give them', () => {
    expect(
      keyProblems({ title: 't', sumary: 's', titel: 't', tags: [] }, ALLOWED),
    ).toEqual([
      'unknown key(s) "sumary", "titel"',
      'missing key(s) "summary", "alt"',
    ]);
  });

  it('names each kind of key by the noun it is given — „language" for the five', () => {
    expect(keyProblems({ ro: 'a', es: 'b' }, ['ro', 'en'], 'language')).toEqual(
      ['unknown language(s) "es"', 'missing language(s) "en"'],
    );
  });

  it('spells a key that holds a character drawn as nothing by its code point — never the very key it misses (lib/visible-text’s `spelled`)', () => {
    const misspelt = { title: 't', summary: 's', tags: [] } as Record<
      string,
      unknown
    >;
    misspelt[`alt${ZERO_WIDTH_SPACE}`] = '';
    expect(keyProblems(misspelt, ALLOWED)).toEqual([
      'unknown key(s) "alt\\u{200B}"',
      'missing key(s) "alt"',
    ]);
  });

  it('quotes a key holding a double quote or a backslash escaped, so the list still reads as one', () => {
    expect(keyProblems({ 'a"b': 1, 'c\\d': 2 }, [])).toEqual([
      'unknown key(s) "a\\"b", "c\\\\d"',
    ]);
  });
});

describe('isImagePath — a picture under public/images/', () => {
  it.each(['/images/hero/lobby.jpg', '/images/demo/gallery-1.jpg'])(
    'takes %s',
    (path) => {
      expect(isImagePath(path)).toBe(true);
    },
  );

  it.each([
    ['a path outside /images/', '/photos/lobby.jpg'],
    ['a relative path', 'images/hero/lobby.jpg'],
    ['a folder that only STARTS like it', '/imagesx/lobby.jpg'],
    ['the folder with no slash after it', '/images'],
    ['an address', 'https://example.com/images/lobby.jpg'],
    ['the empty string', ''],
  ])('refuses %s', (_name, path) => {
    expect(isImagePath(path)).toBe(false);
  });
});

describe('the shapes — each pinned directly, so a subtype cannot pass for it', () => {
  it('types the two guards onto what they promise, and the key list as plain messages', () => {
    // Checked by `tsc`, not by the runner.
    expectTypeOf(isRecord).toEqualTypeOf<
      (value: unknown) => value is Record<string, unknown>
    >();
    expectTypeOf(isImagePath).toEqualTypeOf<
      (value: string) => value is ImagePath
    >();
    expectTypeOf(keyProblems).toEqualTypeOf<
      (
        record: Record<string, unknown>,
        allowed: readonly string[],
        noun?: string,
      ) => string[]
    >();
  });
});
