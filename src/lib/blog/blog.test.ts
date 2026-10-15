import { describe, expect, it } from 'vitest';
import { locales } from '../../i18n/locales';
import {
  MAX_READING_MINUTES,
  MAX_TAGS,
  POSTS_PER_PAGE,
  blogPagePath,
  newestFirst,
  numberedPages,
  pageCount,
  parsePageParam,
  parsePosts,
  posts,
  postsIn,
  postsOnPage,
  type BlogPostEntry,
} from './blog';

// lib/blog — the reader of src/content/blog/posts.json and the arithmetic that
// cuts the list into pages. The header of blog.ts argues every rule pinned here.

/** One language's valid words; a test breaks exactly one thing in a copy. */
function rawWords(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    title: 'Un titlu',
    summary: 'Un rezumat scurt.',
    tags: ['igienă'],
    alt: 'O fotografie',
    ...overrides,
  };
}

/** Every language's valid words — `byLanguage` replaces one language's block. */
function rawAllWords(
  byLanguage: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, rawWords()])),
    ...byLanguage,
  };
}

/** A valid raw post; each test breaks exactly one thing in a copy of it. */
function rawPost(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    slug: 'exemplu-de-articol',
    date: '2026-01-15',
    author: 'Dr. Exemplu',
    image: { src: '/images/hero/lobby.jpg' },
    readingMinutes: 5,
    words: rawAllWords(),
    ...overrides,
  };
}

/** `rawPost` without one of its keys. */
function rawPostWithout(key: string): Record<string, unknown> {
  const post = rawPost();
  delete post[key];
  return post;
}

/** `rawPost` whose German words are `words`. */
function rawPostWithGerman(
  words: Record<string, unknown>,
): Record<string, unknown> {
  return rawPost({ words: rawAllWords({ de: words }) });
}

function post(slug: string, date: string): BlogPostEntry {
  return parsePosts([rawPost({ slug, date })])[0]!;
}

describe('parsePosts — the build-time check of the JSON', () => {
  it('returns a valid post: its facts once, its words in every language', () => {
    const [only] = parsePosts([
      rawPost({
        words: rawAllWords({
          de: rawWords({ title: 'Ein Titel', tags: ['mundhygiene'] }),
        }),
      }),
    ]);
    expect(only).toEqual({
      slug: 'exemplu-de-articol',
      date: '2026-01-15',
      author: 'Dr. Exemplu',
      image: { src: '/images/hero/lobby.jpg' },
      readingMinutes: 5,
      words: {
        ro: rawWords(),
        en: rawWords(),
        de: rawWords({ title: 'Ein Titel', tags: ['mundhygiene'] }),
        fr: rawWords(),
        it: rawWords(),
      },
    });
    // The record holds exactly the manifest's languages, in its order.
    expect(Object.keys(only?.words ?? {})).toEqual([...locales]);
  });

  it(`accepts a reading time from 1 to ${MAX_READING_MINUTES} minutes, both ends included`, () => {
    for (const readingMinutes of [1, MAX_READING_MINUTES]) {
      expect(parsePosts([rawPost({ readingMinutes })])[0]?.readingMinutes).toBe(
        readingMinutes,
      );
    }
  });

  it(`accepts an empty alt (a decorative picture), no tags, and up to ${MAX_TAGS} tags`, () => {
    const [bare] = parsePosts([
      rawPostWithGerman(rawWords({ alt: '', tags: [] })),
    ]);
    expect(bare?.words.de.alt).toBe('');
    expect(bare?.words.de.tags).toEqual([]);
    const full = ['a', 'b', 'c'].slice(0, MAX_TAGS);
    const [most] = parsePosts([rawPostWithGerman(rawWords({ tags: full }))]);
    expect(most?.words.de.tags).toEqual(full);
  });

  it('refuses a file that is not an array, and an entry that is not an object', () => {
    expect(() => parsePosts({ posts: [] })).toThrow(/expected an array/);
    expect(() => parsePosts(['text'])).toThrow(/post 1: expected an object/);
  });

  it.each([
    [
      'an unknown key (a typo)',
      rawPost({ sumary: 'x' }),
      /unknown key\(s\) sumary/,
    ],
    ['a missing key', rawPostWithout('author'), /missing key\(s\) author/],
    [
      'the words of the old, one-language shape at the top level',
      rawPost({ title: 'Un titlu' }),
      /unknown key\(s\) title/,
    ],
    ['an upper-case slug', rawPost({ slug: 'Exemplu' }), /"slug" must be/],
    [
      'a slug with a double dash',
      rawPost({ slug: 'un--slug' }),
      /"slug" must be/,
    ],
    ['a slug with a space', rawPost({ slug: 'un slug' }), /"slug" must be/],
    ['the reserved slug "page"', rawPost({ slug: 'page' }), /reserved/],
    ['an author that is not text', rawPost({ author: 7 }), /"author"/],
    [
      'an author with a stray space',
      rawPost({ author: 'Dr. Exemplu ' }),
      /"author"/,
    ],
    ['a day that does not exist', rawPost({ date: '2026-02-30' }), /"date"/],
    ['a day without its zeros', rawPost({ date: '2026-2-3' }), /"date"/],
    ['a day written first', rawPost({ date: '15-01-2026' }), /"date"/],
    [
      'an image that is a string',
      rawPost({ image: '/images/x.jpg' }),
      /"image" must be an object/,
    ],
    [
      'an image that still carries its alt (it is a language’s word now)',
      rawPost({ image: { src: '/images/x.jpg', alt: '' } }),
      /"image": unknown key\(s\) alt/,
    ],
    [
      'a picture outside /images/',
      rawPost({ image: { src: '/photos/x.jpg' } }),
      /"image.src"/,
    ],
    [
      'a post with no reading time',
      rawPostWithout('readingMinutes'),
      /missing key\(s\) readingMinutes/,
    ],
    [
      'a reading time of zero',
      rawPost({ readingMinutes: 0 }),
      /"readingMinutes" must be a whole number of minutes from 1 to 60, got 0/,
    ],
    [
      'a reading time past the bound',
      rawPost({ readingMinutes: MAX_READING_MINUTES + 1 }),
      /"readingMinutes"/,
    ],
    [
      'a reading time in fractions',
      rawPost({ readingMinutes: 4.5 }),
      /"readingMinutes"/,
    ],
    [
      'a reading time written as text',
      rawPost({ readingMinutes: '5' }),
      /"readingMinutes" .* got "5"/,
    ],
    [
      'words that are not an object',
      rawPost({ words: ['ro'] }),
      /"words" must be an object \{ ro, en, de, fr, it \}/,
    ],
    [
      'a language missing',
      rawPost({
        words: Object.fromEntries(
          locales
            .filter((locale) => locale !== 'it')
            .map((locale) => [locale, rawWords()]),
        ),
      }),
      /"words": missing language\(s\) it/,
    ],
    [
      'a language the site does not route',
      rawPost({ words: rawAllWords({ es: rawWords() }) }),
      /"words": unknown language\(s\) es/,
    ],
    [
      'a language that is not an object',
      rawPost({ words: rawAllWords({ de: 'Ein Titel' }) }),
      /"words\.de" must be an object \{ title, summary, tags, alt \}/,
    ],
    [
      'a language missing a field',
      (() => {
        const words = rawWords();
        delete words.summary;
        return rawPostWithGerman(words);
      })(),
      /"words\.de": missing key\(s\) summary/,
    ],
    [
      'a language with an unknown field',
      rawPostWithGerman(rawWords({ titel: 'x' })),
      /"words\.de": unknown key\(s\) titel/,
    ],
    [
      'an empty title',
      rawPostWithGerman(rawWords({ title: '' })),
      /"words\.de\.title"/,
    ],
    [
      'a summary with a stray space',
      rawPostWithGerman(rawWords({ summary: 'Text ' })),
      /"words\.de\.summary"/,
    ],
    [
      'tags that are not a list',
      rawPostWithGerman(rawWords({ tags: 'mundhygiene' })),
      /"words\.de\.tags" must be an array/,
    ],
    [
      'an empty tag',
      rawPostWithGerman(rawWords({ tags: [''] })),
      /"words\.de\.tags": every tag/,
    ],
    [
      'a tag listed twice',
      rawPostWithGerman(rawWords({ tags: ['tipps', 'tipps'] })),
      /"words\.de\.tags": a tag is listed twice/,
    ],
    [
      `more than ${MAX_TAGS} tags`,
      rawPostWithGerman(
        rawWords({
          tags: Array.from({ length: MAX_TAGS + 1 }, (_, i) => `tag-${i}`),
        }),
      ),
      new RegExp(
        `"words\\.de\\.tags": at most ${MAX_TAGS} tags .* got ${MAX_TAGS + 1}`,
      ),
    ],
    [
      'an alt with a stray space',
      rawPostWithGerman(rawWords({ alt: ' a' })),
      /"words\.de\.alt"/,
    ],
    [
      'an alt that is not text',
      rawPostWithGerman(rawWords({ alt: null })),
      /"words\.de\.alt"/,
    ],
  ])('refuses %s', (_case, entry, message) => {
    expect(() => parsePosts([entry])).toThrow(message);
  });

  it('refuses a slug used twice, naming the later post', () => {
    expect(() =>
      parsePosts([rawPost(), rawPost({ date: '2026-02-01' })]),
    ).toThrow(
      /post 2 \(„exemplu-de-articol"\): "slug" exemplu-de-articol is used by an earlier post/,
    );
  });

  it('names the post by its number and slug, and the language, in every message', () => {
    expect(() =>
      parsePosts([
        rawPost(),
        rawPost({
          slug: 'al-doilea',
          words: rawAllWords({ fr: rawWords({ title: '' }) }),
        }),
      ]),
    ).toThrow(/posts\.json, post 2 \(„al-doilea"\): "words\.fr\.title"/);
  });

  it('names the slug even when the post fails on its keys — the typo case', () => {
    expect(() => parsePosts([rawPost({ sumary: 'x' })])).toThrow(
      /post 1 \(„exemplu-de-articol"\): unknown key\(s\) sumary/,
    );
  });
});

describe('postsIn — one language of every post, what a list page shows', () => {
  it.each(locales)(
    '%s: each post’s facts with that language’s words, the picture’s alt among them',
    (locale) => {
      const entry = parsePosts([
        rawPost({
          words: rawAllWords({
            [locale]: rawWords({
              title: `title:${locale}`,
              summary: `summary:${locale}`,
              tags: [`tag:${locale}`],
              alt: `alt:${locale}`,
            }),
          }),
        }),
      ]);
      // No date: it orders the list and no card prints it (BlogPost's note).
      expect(postsIn(locale, entry)).toEqual([
        {
          slug: 'exemplu-de-articol',
          title: `title:${locale}`,
          summary: `summary:${locale}`,
          author: 'Dr. Exemplu',
          image: { src: '/images/hero/lobby.jpg', alt: `alt:${locale}` },
          tags: [`tag:${locale}`],
          readingMinutes: 5,
        },
      ]);
    },
  );

  it('keeps the order of the list it is given', () => {
    const list = [post('nou', '2026-09-01'), post('vechi', '2025-12-31')];
    for (const locale of locales) {
      expect(postsIn(locale, list).map((p) => p.slug)).toEqual([
        'nou',
        'vechi',
      ]);
    }
  });
});

describe('newestFirst — the order the pages show', () => {
  it('puts the newest day first and orders a shared day by slug', () => {
    const sorted = newestFirst([
      post('b-mijloc', '2026-05-01'),
      post('vechi', '2025-12-31'),
      post('a-mijloc', '2026-05-01'),
      post('nou', '2026-09-01'),
    ]);
    expect(sorted.map((p) => p.slug)).toEqual([
      'nou',
      'a-mijloc',
      'b-mijloc',
      'vechi',
    ]);
  });

  it('leaves the list it was given untouched', () => {
    const list = [post('vechi', '2025-01-01'), post('nou', '2026-01-01')];
    newestFirst(list);
    expect(list.map((p) => p.slug)).toEqual(['vechi', 'nou']);
  });
});

describe('the pages — counting, cutting and spelling them', () => {
  it('counts pages of six — the owner’s two rows of three — and never fewer than one', () => {
    expect(POSTS_PER_PAGE).toBe(6);
    expect([0, 1, 6, 7, 12, 13, 18].map((n) => pageCount(n))).toEqual([
      1, 1, 1, 2, 2, 3, 3,
    ]);
    expect(() => pageCount(-1)).toThrow(RangeError);
    expect(() => pageCount(2.5)).toThrow(RangeError);
    expect(() => pageCount(10, 0)).toThrow(RangeError);
  });

  it('cuts any list into its pages and refuses a page it does not have', () => {
    const list = Array.from({ length: 13 }, (_, i) =>
      post(
        `articol-${String(i).padStart(2, '0')}`,
        `2026-01-${String(i + 1).padStart(2, '0')}`,
      ),
    );
    expect(postsOnPage(1, list).map((p) => p.slug)).toEqual(
      list.slice(0, 6).map((p) => p.slug),
    );
    expect(postsOnPage(3, list)).toHaveLength(1);
    for (const page of [0, 4, 1.5, Number.NaN]) {
      expect(() => postsOnPage(page, list)).toThrow(RangeError);
    }
    expect(postsOnPage(1, [])).toEqual([]);
    // One language's posts cut the same way as the entries they come from.
    expect(postsOnPage(3, postsIn('de', list)).map((p) => p.slug)).toEqual(
      postsOnPage(3, list).map((p) => p.slug),
    );
  });

  it('generates pages 2 to the last — or page 1 again when there is only one page (never an empty list)', () => {
    expect(numberedPages(13)).toEqual([2, 3]);
    expect(numberedPages(7)).toEqual([2]);
    expect(numberedPages(6)).toEqual([1]);
    expect(numberedPages(0)).toEqual([1]);
  });

  it('spells page 1 as /blog and page n as /blog/page/n', () => {
    expect(blogPagePath(1)).toBe('/blog');
    expect(blogPagePath(2)).toBe('/blog/page/2');
    expect(blogPagePath(12)).toBe('/blog/page/12');
    for (const page of [0, -1, 1.5]) {
      expect(() => blogPagePath(page)).toThrow(RangeError);
    }
  });

  it('reads the route segment back as a number, and only a canonical one', () => {
    expect(parsePageParam('2')).toBe(2);
    expect(parsePageParam('1')).toBe(1);
    expect(parsePageParam('10')).toBe(10);
    for (const value of ['', '0', '02', '2.0', ' 2', 'x', '-2']) {
      expect(() => parsePageParam(value), value).toThrow(RangeError);
    }
  });
});

describe('the shipped list', () => {
  it('parses, has posts, and is ordered newest first', () => {
    expect(posts.length).toBeGreaterThan(0);
    expect(newestFirst(posts)).toEqual(posts);
  });
});
