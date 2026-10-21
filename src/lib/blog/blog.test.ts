import { describe, expect, it } from 'vitest';
import { locales } from '../../i18n/locales';
import {
  MAX_READING_MINUTES,
  MAX_TAGS,
  POSTS_PER_PAGE,
  articlePath,
  blogPagePath,
  isPostAlt,
  newestFirst,
  numberedPages,
  pageCount,
  parsePageParam,
  parsePosts,
  postIn,
  posts,
  postsIn,
  postsOnPage,
  type BlogPostEntry,
} from './blog';

// lib/blog — the reader of src/content/blog/posts.json and the arithmetic that
// cuts the list into pages. The header of blog.ts argues every rule pinned here.

/** Characters that SHOW NOTHING and survive `trim` (lib/visible-text's THE
 *  UNSEEN SET), by their codes — never typed into the source: the zero-width
 *  space U+200B, the soft hyphen U+00AD, the word joiner U+2060, the Hangul
 *  filler U+3164, a letter drawn as blank width, and NEL U+0085, a control
 *  character — the one of Unicode's White_Space that `\s` misses. */
const ZERO_WIDTH_SPACE = String.fromCharCode(0x200b);
const SOFT_HYPHEN = String.fromCharCode(0xad);
const WORD_JOINER = String.fromCharCode(0x2060);
const HANGUL_FILLER = String.fromCharCode(0x3164);
const NEXT_LINE = String.fromCharCode(0x85);
/** A tooth (U+1F9B7) — an emoji, which shows and names nothing. */
const TOOTH = String.fromCodePoint(0x1f9b7);

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

  it('accepts an alt that describes in words of any script, and a title or a tag that is a number — a letter or a digit names something', () => {
    for (const alt of ['O fotografie', 'Ψ', 'ș.']) {
      const [post] = parsePosts([rawPostWithGerman(rawWords({ alt }))]);
      expect(post?.words.de.alt, alt).toBe(alt);
    }
    const [year] = parsePosts([
      rawPostWithGerman(rawWords({ title: '2019', tags: ['2024'] })),
    ]);
    expect(year?.words.de.title).toBe('2019');
    expect(year?.words.de.tags).toEqual(['2024']);
  });

  it('refuses a file that is not an array, and an entry that is not an object', () => {
    expect(() => parsePosts({ posts: [] })).toThrow(/expected an array/);
    expect(() => parsePosts(['text'])).toThrow(/post 1: expected an object/);
  });

  it.each([
    [
      'an unknown key (a typo)',
      rawPost({ sumary: 'x' }),
      /unknown key\(s\) "sumary"/,
    ],
    ['a missing key', rawPostWithout('author'), /missing key\(s\) "author"/],
    [
      'the words of the old, one-language shape at the top level',
      rawPost({ title: 'Un titlu' }),
      /unknown key\(s\) "title"/,
    ],
    ['an upper-case slug', rawPost({ slug: 'Exemplu' }), /"slug" must be/],
    [
      'a slug with a double dash',
      rawPost({ slug: 'un--slug' }),
      /"slug" must be/,
    ],
    ['a slug with a space', rawPost({ slug: 'un slug' }), /"slug" must be/],
    ['the reserved slug "page"', rawPost({ slug: 'page' }), /reserved/],
    [
      'an author that is not text — saying so, and naming the value by its type',
      rawPost({ author: 7 }),
      '"author" must be visible text, trimmed: it is not a string, got 7',
    ],
    [
      'an author with a stray space — saying so, the value quoted',
      rawPost({ author: 'Dr. Exemplu ' }),
      '"author" must be visible text, trimmed: it has white space at its start or end, got "Dr. Exemplu "',
    ],
    [
      'an author that SHOWS NOTHING — a zero-width space, which trimming keeps, spelled by its code point in the quote',
      rawPost({ author: ZERO_WIDTH_SPACE }),
      '"author" must be visible text, trimmed: it shows nothing, got "\\u{200B}"',
    ],
    [
      'an author that is NEL alone — a control character, the one of White_Space that `\\s` misses',
      rawPost({ author: NEXT_LINE }),
      '"author" must be visible text, trimmed: it shows nothing, got "\\u{0085}"',
    ],
    [
      'a slug holding a character drawn as nothing — spelled by its code point, where the post is named and where it is refused (round 2 of lib/visible-text’s review)',
      rawPost({ slug: `exemplu${ZERO_WIDTH_SPACE}` }),
      'post 1 ("exemplu\\u{200B}"): "slug" must be lower-case ASCII words joined by single dashes, got "exemplu\\u{200B}"',
    ],
    [
      'a key holding a character drawn as nothing — quoted, beside the key it misses',
      (() => {
        const post = rawPostWithout('author');
        post[`author${ZERO_WIDTH_SPACE}`] = 'Dr. Exemplu';
        return post;
      })(),
      'unknown key(s) "author\\u{200B}"; missing key(s) "author"',
    ],
    ['a day that does not exist', rawPost({ date: '2026-02-30' }), /"date"/],
    ['a day without its zeros', rawPost({ date: '2026-2-3' }), /"date"/],
    ['a day written first', rawPost({ date: '15-01-2026' }), /"date"/],
    [
      'a day written as a number — named as written',
      rawPost({ date: 20260115 }),
      '"date" must be a real day spelled YYYY-MM-DD, got 20260115',
    ],
    [
      'a day with a no-break space after it — the space spelled',
      rawPost({ date: `2026-01-15${String.fromCharCode(0xa0)}` }),
      '"date" must be a real day spelled YYYY-MM-DD, got "2026-01-15\\u{00A0}"',
    ],
    [
      'an image that is a string',
      rawPost({ image: '/images/x.jpg' }),
      /"image" must be an object/,
    ],
    [
      'an image that still carries its alt (it is a language’s word now)',
      rawPost({ image: { src: '/images/x.jpg', alt: '' } }),
      /"image": unknown key\(s\) "alt"/,
    ],
    [
      'a picture outside /images/',
      rawPost({ image: { src: '/photos/x.jpg' } }),
      '"image.src" must be a path under /images/, got "/photos/x.jpg"',
    ],
    [
      'a picture path that is no string — named by its type',
      rawPost({ image: { src: ['/images/x.jpg'] } }),
      '"image.src" must be a path under /images/, got <object>',
    ],
    [
      'a post with no reading time',
      rawPostWithout('readingMinutes'),
      /missing key\(s\) "readingMinutes"/,
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
      'a reading time that is a BigInt — named by its type, never JSON’s own „Do not know how to serialize a BigInt"',
      rawPost({ readingMinutes: BigInt(4) }),
      'post 1 ("exemplu-de-articol"): "readingMinutes" must be a whole number of minutes from 1 to 60, got <bigint>',
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
      /"words": missing language\(s\) "it"/,
    ],
    [
      'a language the site does not route',
      rawPost({ words: rawAllWords({ es: rawWords() }) }),
      /"words": unknown language\(s\) "es"/,
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
      /"words\.de": missing key\(s\) "summary"/,
    ],
    [
      'a language with an unknown field',
      rawPostWithGerman(rawWords({ titel: 'x' })),
      /"words\.de": unknown key\(s\) "titel"/,
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
      'a title that SHOWS NOTHING — a Hangul filler, a letter drawn as blank width',
      rawPostWithGerman(rawWords({ title: HANGUL_FILLER })),
      '"words.de.title" must be visible text, trimmed: it shows nothing, got "\\u{3164}"',
    ],
    [
      'a title of a mark alone — it shows, and names nothing',
      rawPostWithGerman(rawWords({ title: '.' })),
      '"words.de.title" names nothing: it holds no letter or digit that shows, got "." — a title of marks alone is a heading with no name',
    ],
    [
      'a title of an emoji alone',
      rawPostWithGerman(rawWords({ title: TOOTH })),
      `"words.de.title" names nothing: it holds no letter or digit that shows, got "${TOOTH}"`,
    ],
    [
      'a title of an ellipsis beside a Hangul filler — the one letter is drawn as nothing',
      rawPostWithGerman(rawWords({ title: `…${HANGUL_FILLER}` })),
      '"words.de.title" names nothing: it holds no letter or digit that shows, got "…\\u{3164}"',
    ],
    [
      'a summary that SHOWS NOTHING — a soft hyphen, which trimming keeps',
      rawPostWithGerman(rawWords({ summary: SOFT_HYPHEN })),
      '"words.de.summary" must be visible text, trimmed: it shows nothing, got "\\u{00AD}"',
    ],
    [
      'a tag that SHOWS NOTHING — a word joiner, which trimming keeps — naming the tag',
      rawPostWithGerman(rawWords({ tags: ['Mundhygiene', WORD_JOINER] })),
      '"words.de.tags": every tag must be visible text, trimmed — tag 2: it shows nothing, got "\\u{2060}"',
    ],
    [
      'a tag of an ellipsis alone — a chip that names nothing',
      rawPostWithGerman(rawWords({ tags: ['…', 'Tipps'] })),
      '"words.de.tags": tag 1 names nothing: it holds no letter or digit that shows, got "…" — a chip of marks alone is a label with no name',
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
      '"words.de.tags": the tag "tipps" is listed twice (tags 1 and 2)',
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
      '"words.de.alt" must be "" for a picture that only decorates the title beside it, or words that describe it — visible text, trimmed, holding a letter that shows: it has white space at its start or end, got " a"',
    ],
    [
      'an alt that is not text',
      rawPostWithGerman(rawWords({ alt: null })),
      '"words.de.alt" must be "" for a picture that only decorates the title beside it, or words that describe it — visible text, trimmed, holding a letter that shows: it is not a string, got null',
    ],
    // A cover alt is "" or WORDS (lib/blog's THE TEXTS): until round 1 of
    // lib/visible-text's review (2026-10-21) every one of these passed as a
    // described picture, a cover named by nothing — on the card, on the
    // article's cover and in the link preview's og:image:alt.
    [
      'an alt that SHOWS NOTHING — a zero-width space',
      rawPostWithGerman(rawWords({ alt: ZERO_WIDTH_SPACE })),
      '"words.de.alt" must be "" for a picture that only decorates the title beside it, or words that describe it — visible text, trimmed, holding a letter that shows: it shows nothing, got "\\u{200B}"',
    ],
    [
      'an alt that is NEL alone — a control character',
      rawPostWithGerman(rawWords({ alt: NEXT_LINE })),
      /"words\.de\.alt" must be "" .*: it shows nothing, got "\\u\{0085\}"$/,
    ],
    [
      'an alt that is a dot — it shows, and describes nothing',
      rawPostWithGerman(rawWords({ alt: '.' })),
      '"words.de.alt" must be "" for a picture that only decorates the title beside it, or words that describe it — visible text, trimmed, holding a letter that shows: it holds no letter that shows, got "."',
    ],
    [
      'an alt that is a dash',
      rawPostWithGerman(rawWords({ alt: '-' })),
      /"words\.de\.alt" must be "" .*: it holds no letter that shows, got "-"$/,
    ],
    [
      'an alt that is a number alone — a figure describes no picture',
      rawPostWithGerman(rawWords({ alt: '2' })),
      /"words\.de\.alt" must be "" .*: it holds no letter that shows, got "2"$/,
    ],
    [
      'an alt of a Hangul filler beside a dot — the dot shows, the one letter is drawn as nothing',
      rawPostWithGerman(rawWords({ alt: `${HANGUL_FILLER}.` })),
      /"words\.de\.alt" must be "" .*: it holds no letter that shows, got "\\u\{3164\}\."$/,
    ],
  ])('refuses %s', (_case, entry, message) => {
    // Always the parser's own TypeError, naming the post — never one thrown
    // on the way to its message (JSON's, for a BigInt).
    expect(() => parsePosts([entry])).toThrow(TypeError);
    expect(() => parsePosts([entry])).toThrow(message);
  });

  it('refuses a slug used twice, naming the later post', () => {
    expect(() =>
      parsePosts([rawPost(), rawPost({ date: '2026-02-01' })]),
    ).toThrow(
      /post 2 \("exemplu-de-articol"\): "slug" "exemplu-de-articol" is used by an earlier post/,
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
    ).toThrow(/posts\.json, post 2 \("al-doilea"\): "words\.fr\.title"/);
  });

  it('names the slug even when the post fails on its keys — the typo case', () => {
    expect(() => parsePosts([rawPost({ sumary: 'x' })])).toThrow(
      /post 1 \("exemplu-de-articol"\): unknown key\(s\) "sumary"/,
    );
  });
});

describe('isPostAlt — THE TEXTS’ rule for a post’s picture, the one parsePosts and the data test ask', () => {
  it.each([
    ['"" — a picture that only decorates', ''],
    ['words that describe', 'Sala de așteptare a clinicii'],
    ['a letter of another script', 'Ψ'],
    ['a small letter beside a dot', 'ș.'],
  ])('takes %s', (_name, alt) => {
    expect(isPostAlt(alt)).toBe(true);
  });

  it.each([
    ['a dot', '.'],
    ['a dash', '-'],
    ['a number alone', '2'],
    ['a zero-width space', ZERO_WIDTH_SPACE],
    ['a Hangul filler beside a dot', `${HANGUL_FILLER}.`],
    ['NEL, a control character', NEXT_LINE],
    ['words with a space before them', ' Sala'],
    ['words with a lone surrogate', `Sala ${String.fromCharCode(0xd800)}`],
    ['null', null],
    ['a number', 7],
  ])('refuses %s — neither "" nor words that describe', (_name, alt) => {
    expect(isPostAlt(alt)).toBe(false);
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

describe('postIn — ONE post in one language, what the article page reads', () => {
  it.each(locales)(
    '%s: the entry’s facts with that language’s words — exactly what `postsIn` makes of the same entry',
    (locale) => {
      const [entry] = parsePosts([
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
      if (entry === undefined) throw new Error('parsePosts returned no post');

      expect(postIn(locale, entry)).toEqual({
        slug: 'exemplu-de-articol',
        title: `title:${locale}`,
        summary: `summary:${locale}`,
        author: 'Dr. Exemplu',
        image: { src: '/images/hero/lobby.jpg', alt: `alt:${locale}` },
        tags: [`tag:${locale}`],
        readingMinutes: 5,
      });
      expect(postsIn(locale, [entry])).toEqual([postIn(locale, entry)]);
    },
  );

  it('is what `postsIn` makes of every shipped post, in every language, in the list’s order', () => {
    for (const locale of locales) {
      expect(postsIn(locale), locale).toEqual(
        posts.map((entry) => postIn(locale, entry)),
      );
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

  it('spells a post’s article as /blog/<slug> — and refuses a slug no post could carry, naming it', () => {
    expect(articlePath('cum-iti-alegi-periuta-de-dinti')).toBe(
      '/blog/cum-iti-alegi-periuta-de-dinti',
    );
    // The rule's edges, each a slug parsePosts lets through: one character,
    // digits alone, digits beside a word.
    for (const slug of ['a', '42', 'ghid-2026']) {
      expect(articlePath(slug), slug).toBe(`/blog/${slug}`);
    }
    // Refused: the empty string, the reserved word, a capital, a doubled or
    // leading dash, a space, a slash; dots ('..' is a path's own word for the
    // folder above) and an underscore, which a pattern widened by one
    // character would let through — also after a dash, where a pattern
    // widened only in its second half would; a Romanian letter, the likeliest
    // slip on this site; a line break, which a pattern read line by line
    // would let through; a zero-width space, which no reader would see. The
    // message names each as lib/visible-text's `spelled` writes it, written
    // out: the line break and the zero-width space by their code points, so
    // the message stays on one line and shows what the slug holds.
    for (const [slug, named] of [
      ['', '""'],
      ['page', '"page"'],
      ['Cum', '"Cum"'],
      ['a--b', '"a--b"'],
      ['-a', '"-a"'],
      ['a b', '"a b"'],
      ['a/b', '"a/b"'],
      ['..', '".."'],
      ['a.b', '"a.b"'],
      ['a_b', '"a_b"'],
      ['a-b.c', '"a-b.c"'],
      ['a-b_c', '"a-b_c"'],
      ['periuță', '"periuță"'],
      ['a\nb', '"a\\u{000A}b"'],
      [`a${ZERO_WIDTH_SPACE}b`, '"a\\u{200B}b"'],
    ] as const) {
      expect(() => articlePath(slug), named).toThrow(RangeError);
      expect(() => articlePath(slug), named).toThrow(
        `${named} is not a post's slug`,
      );
    }
  });

  it('refuses a value that is not a string at all, naming it by its type — never by running its code', () => {
    // A caller outside TypeScript, reached through `unknown`. The slug
    // pattern alone would read each value as text (`RegExp.prototype.test`
    // converts its argument), so undefined, null, 123 and ['abc'] would pass
    // it as "undefined", "null", "123" and "abc" and come back as paths.
    // Named as lib/visible-text's `spelled` names it — a number, null and
    // undefined as written, anything else by its type — and the error is
    // always the RangeError: never JSON's own TypeError (a BigInt, a cycle).
    const call = (value: unknown): unknown => articlePath(value as string);
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    const named: ReadonlyArray<readonly [unknown, string]> = [
      [undefined, 'undefined'],
      [null, 'null'],
      [123, '123'],
      [['abc'], '<object>'],
      [BigInt(10), '<bigint>'],
      [cycle, '<object>'],
      [Symbol('slug'), '<symbol>'],
      [() => 'slug', '<function>'],
    ];
    for (const [value, shown] of named) {
      expect(() => call(value), shown).toThrow(RangeError);
      expect(() => call(value), shown).toThrow(`${shown} is not a post's slug`);
    }
  });

  it('reads the route segment back as a number, and only a canonical one — naming a refused one `spelled`', () => {
    expect(parsePageParam('2')).toBe(2);
    expect(parsePageParam('1')).toBe(1);
    expect(parsePageParam('10')).toBe(10);
    for (const value of ['', '0', '02', '2.0', ' 2', 'x', '-2']) {
      expect(() => parsePageParam(value), value).toThrow(RangeError);
    }
    expect(() => parsePageParam(`2${ZERO_WIDTH_SPACE}`)).toThrow(
      '"2\\u{200B}" is not a page number',
    );
  });
});

describe('the shipped list', () => {
  it('parses, has posts, and is ordered newest first', () => {
    expect(posts.length).toBeGreaterThan(0);
    expect(newestFirst(posts)).toEqual(posts);
  });
});
