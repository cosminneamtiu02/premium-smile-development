import { describe, expect, expectTypeOf, it } from 'vitest';
import { locales, type Locale } from '../../i18n/locales';
import { parsePosts, posts, postsIn, type BlogPostEntry } from '../blog/blog';
import type { ImagePath } from '../image-path/image-path';
import { doctors, findDoctor, type Doctor } from '../team/team';
import {
  STAND_IN_ARTICLE,
  WORDS_PER_MINUTE,
  articleAuthor,
  articleSlugFor,
  articleWordCount,
  articles,
  loadArticles,
  parseArticle,
  readingMinutes,
  type Article,
  type ArticleBlock,
  type ArticleCard,
  type ArticleEntry,
  type ArticleImage,
  type ArticlePair,
} from './blog-article';

// lib/blog-article — the reader of src/content/blog/articles/*.json, the
// checks it runs at load, the author lookup and the reading-time measure,
// beside the module (the lib-foldering lane). blog-article.ts's header argues
// every rule pinned here. Every article is written in the five languages of
// the locale manifest since 2026-10-15: the fixtures below write each
// language's words tagged with its code — „Un subtitlu (de)" — so a parse
// that handed one language another's words, or dropped one, shows by name.
// Since the same day a photo stands on its own and a before/after is two
// photos of ONE shape (blog-article.ts's THE PHOTO and THE PAIR IS ONE
// SHAPE): every instance of each is accepted below, and every way of writing
// a field in some languages or on one half only is refused, by name; an
// absent heading or note is checked as an ABSENT key, with strict equality,
// never as a key holding `undefined`.
// The shipped files' own integrity — every file registered, every picture on
// disk and wide enough, the owner's D-DASH rule, every language's own words,
// the reading time its post's card announces — lives in tests/unit/
// blog-article-data.test.ts, which runs in node and can read the file system;
// the CMSR scan reads every word of every language in tests/unit/
// cmsr-scan.test.ts.

/** The demo article, the one the lane shipped (blog-article.ts's PLACEHOLDER). */
const DEMO = 'cum-iti-alegi-periuta-de-dinti';

/** `make` for each of the five languages — a fixture's every language its own. */
function inEach<T>(make: (locale: Locale) => T): Record<Locale, T> {
  return {
    ro: make('ro'),
    en: make('en'),
    de: make('de'),
    fr: make('fr'),
    it: make('it'),
  };
}

/** A text in each language, tagged by its code — „Un subtitlu (de)". */
const tagged = (text: string): Record<Locale, string> =>
  inEach((locale) => `${text} (${locale})`);

/** A copy of `record` without `key` — a language or a field gone missing. */
const without = (
  record: Readonly<Record<string, unknown>>,
  key: string,
): Record<string, unknown> =>
  Object.fromEntries(Object.entries(record).filter(([name]) => name !== key));

/** U+200B ZERO WIDTH SPACE — a format character, not white space, so `trim`
 *  keeps it; built from its code, never typed into the source. */
const ZERO_WIDTH_SPACE = String.fromCharCode(0x200b);

/** Four more characters that SHOW NOTHING and survive `trim`, by their
 *  codes (lib/visible-text's THE UNSEEN SET): the soft hyphen U+00AD, the
 *  word joiner U+2060, the Hangul filler U+3164 — a LETTER (Lo) drawn as
 *  blank width, which an alt's letter rule alone let through until
 *  2026-10-20 — and NEL U+0085, a control character, the one of Unicode's
 *  White_Space that `\s` misses (in the set since 2026-10-21). */
const SOFT_HYPHEN = String.fromCharCode(0xad);
const WORD_JOINER = String.fromCharCode(0x2060);
const HANGUL_FILLER = String.fromCharCode(0x3164);
const NEXT_LINE = String.fromCharCode(0x85);
/** A no-break space — white space, which `trim` removes at an end. */
const NBSP = String.fromCharCode(0xa0);
/** A tooth (U+1F9B7): an emoji SHOWS, and names nothing — no label's words. */
const TOOTH = String.fromCodePoint(0x1f9b7);

/** A card's words in each language: its caption and the alt of its picture. */
const cardWords = (caption: string) =>
  inEach((locale) => ({
    caption: `${caption} (${locale})`,
    alt: `Sala de așteptare a clinicii, cu fotolii galbene (${locale})`,
  }));

/** The optional words a fixture photo has — each tagged by language where it is written. */
type PhotoFields = Readonly<{ heading?: string; note?: string }>;

/** The alt of every fixture photo's picture, in one language. */
const photoAlt = (locale: Locale): string =>
  `Cabinetul de tratament, cu scaunul stomatologic (${locale})`;

/** A photo's words in each language: its alt, and the optional fields asked for — the keys in the file's order. */
const photoWords = ({ heading, note }: PhotoFields = {}) =>
  inEach((locale) => ({
    ...(heading === undefined ? {} : { heading: `${heading} (${locale})` }),
    alt: photoAlt(locale),
    ...(note === undefined ? {} : { note: `${note} (${locale})` }),
  }));

/** A valid photo block; each test breaks exactly one thing in a copy. */
function rawPhoto(
  fields: PhotoFields = {},
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    type: 'photo',
    image: { src: '/images/hero/treatment-room.jpg' },
    words: photoWords(fields),
    ...overrides,
  };
}

/** A valid half of a before/after — a photo's picture and words; each test breaks exactly one thing in a copy. */
function rawHalf(
  fields: PhotoFields = {},
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    image: { src: '/images/hero/treatment-room.jpg' },
    words: photoWords(fields),
    ...overrides,
  };
}

/** A raw before/after of two halves. */
const rawPair = (
  before: unknown = rawHalf(),
  after: unknown = rawHalf(),
): Record<string, unknown> => ({ type: 'beforeAfter', before, after });

/** A copy of a photo's words with ONE language replaced — a field missing or broken there alone. */
const wordsWith = (
  fields: PhotoFields,
  locale: Locale,
  words: unknown,
): Record<string, unknown> => ({ ...photoWords(fields), [locale]: words });

/** A valid card of a gallery; each test breaks exactly one thing in a copy. */
function rawCard(
  caption: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    image: { src: '/images/hero/lobby.jpg' },
    words: cardWords(caption),
    ...overrides,
  };
}

/** A valid raw gallery of two cards — the fewest it may hold. */
function rawGallery(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    type: 'gallery',
    mode: 'loop',
    cards: [rawCard('Sala de așteptare'), rawCard('Recepția')],
    ...overrides,
  };
}

/** A valid raw article holding every block type once, in five languages. */
function rawArticle(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    blocks: [
      { type: 'paragraph', words: tagged('Un paragraf despre periuță.') },
      { type: 'heading', words: tagged('Un subtitlu') },
      rawGallery(),
      rawPhoto({ heading: 'Cabinetul', note: 'o notă scurtă.' }),
      rawPair(
        rawHalf({ heading: 'Înainte', note: 'prima notă.' }),
        rawHalf({ heading: 'După', note: 'a doua notă.' }),
      ),
    ],
    conclusion: tagged('O concluzie scurtă.'),
    ...overrides,
  };
}

/** A raw article whose SECOND block is `block` — the block every refusal below names. */
const withBlock = (block: unknown): Record<string, unknown> =>
  rawArticle({
    blocks: [{ type: 'paragraph', words: tagged('Primul.') }, block],
  });

/** {@link rawArticle}'s article in one language, as `parseArticle` must hand it back. */
function expectedIn(locale: Locale): Article {
  const lobby = (caption: string): ArticleCard => ({
    image: {
      src: '/images/hero/lobby.jpg',
      alt: `Sala de așteptare a clinicii, cu fotolii galbene (${locale})`,
    },
    caption: `${caption} (${locale})`,
  });
  const room: ArticleImage = {
    src: '/images/hero/treatment-room.jpg',
    alt: photoAlt(locale),
  };
  const words = (text: string): string => `${text} (${locale})`;
  return {
    slug: 'exemplu',
    blocks: [
      { type: 'paragraph', text: `Un paragraf despre periuță. (${locale})` },
      { type: 'heading', text: `Un subtitlu (${locale})` },
      {
        type: 'gallery',
        mode: 'loop',
        cards: [lobby('Sala de așteptare'), lobby('Recepția')],
      },
      {
        type: 'photo',
        image: room,
        heading: words('Cabinetul'),
        note: words('o notă scurtă.'),
      },
      {
        type: 'beforeAfter',
        images: { before: room, after: room },
        headings: { before: words('Înainte'), after: words('După') },
        notes: { before: words('prima notă.'), after: words('a doua notă.') },
      },
    ],
    conclusion: `O concluzie scurtă. (${locale})`,
  };
}

/** A valid post (lib/blog's own checks applied — its facts once, the same
 *  words in all five languages), for the author and the load checks. */
function post(slug: string, author = 'Dr. Nicu Elena Alina'): BlogPostEntry {
  const words = {
    title: 'Un titlu',
    summary: 'Un rezumat.',
    tags: [],
    alt: '',
  };
  const [only] = parsePosts([
    {
      slug,
      date: '2026-01-15',
      author,
      image: { src: '/images/hero/lobby.jpg' },
      readingMinutes: 1,
      words: { ro: words, en: words, de: words, fr: words, it: words },
    },
  ]);
  if (only === undefined) throw new Error('parsePosts returned no post');
  return only;
}

/** A shipped doctor by id, or a loud failure — a vacuous `?? ''` would pass. */
function shipped(id: string): Doctor {
  const doctor = findDoctor(id);
  if (doctor === undefined) throw new Error(`no shipped doctor "${id}"`);
  return doctor;
}

/** A shipped article by its slug, in every language, or a loud failure. */
function shippedArticle(slug: string, what: string): ArticleEntry {
  const entry = articles.find((article) => article.slug === slug);
  if (entry === undefined) {
    throw new Error(`${what} „${slug}" is not registered`);
  }
  return entry;
}

/** The demo, in every language, or a loud failure. */
const demo = (): ArticleEntry => shippedArticle(DEMO, 'the demo');

/** A typed article whose one paragraph is `words` words long, and nothing else is counted. */
function articleOf(words: number): Article {
  return {
    slug: 'x',
    blocks: [
      {
        type: 'paragraph',
        text: Array.from({ length: words }, () => 'cuvânt').join(' '),
      },
    ],
    conclusion: '',
  };
}

/** Every picture file an article shows, in order — the same in every language. */
const picturesOf = (article: Article): string[] =>
  article.blocks.flatMap((block): string[] => {
    switch (block.type) {
      case 'paragraph':
      case 'heading':
        return [];
      case 'gallery':
        return block.cards.map((card) => card.image.src);
      case 'photo':
        return [block.image.src];
      case 'beforeAfter':
        return [block.images.before.src, block.images.after.src];
    }
  });

/** The second block of `input`, parsed, in each language — where every `withBlock` case puts the block it tests. */
function secondBlock(input: unknown): Readonly<Record<Locale, ArticleBlock>> {
  const { languages } = parseArticle(input, 'exemplu');
  return inEach((locale) => {
    const block = languages[locale].blocks[1];
    if (block === undefined) throw new Error(`no second block in ${locale}`);
    return block;
  });
}

/** Which optional words a photo or a pair has — „heading+note", „heading", „note" or „neither". */
function shapeOf(block: ArticleBlock): string {
  const [heading, note] =
    block.type === 'photo'
      ? [block.heading !== undefined, block.note !== undefined]
      : block.type === 'beforeAfter'
        ? [block.headings !== undefined, block.notes !== undefined]
        : [false, false];
  if (heading && note) return 'heading+note';
  if (heading) return 'heading';
  if (note) return 'note';
  return 'neither';
}

describe('parseArticle — the build-time check of one file, in five languages', () => {
  it('returns the article in each of the five languages, every block typed, each language its own words', () => {
    const entry = parseArticle(rawArticle(), 'exemplu');
    expect(entry.slug).toBe('exemplu');
    expect(Object.keys(entry.languages)).toEqual([...locales]);
    for (const locale of locales) {
      expect(entry.languages[locale], locale).toEqual(expectedIn(locale));
    }
  });

  it('writes the facts ONCE — every language the same blocks, in the same order, around the same pictures, with the same headings and notes', () => {
    const { languages } = parseArticle(rawArticle(), 'exemplu');
    const shape = (article: Article) =>
      article.blocks.map((block) => {
        switch (block.type) {
          case 'gallery':
            return `${block.type}:${block.mode}:${block.cards.length}`;
          case 'photo':
          case 'beforeAfter':
            return `${block.type}:${shapeOf(block)}`;
          case 'paragraph':
          case 'heading':
            return block.type;
        }
      });
    for (const locale of locales) {
      expect(shape(languages[locale]), locale).toEqual(shape(languages.ro));
      expect(picturesOf(languages[locale]), locale).toEqual(
        picturesOf(languages.ro),
      );
    }
  });

  it('accepts an article of a single block', () => {
    const { languages } = parseArticle(
      rawArticle({
        blocks: [{ type: 'heading', words: tagged('Doar un titlu') }],
      }),
      'exemplu',
    );
    expect(languages.de.blocks).toEqual([
      { type: 'heading', text: 'Doar un titlu (de)' },
    ]);
  });

  it.each(['loop', 'bounded'] as const)(
    'accepts a gallery in mode %s — three cards in its window, the article’s only window',
    (mode) => {
      const { languages } = parseArticle(
        rawArticle({ blocks: [rawGallery({ mode })] }),
        'exemplu',
      );
      for (const locale of locales) {
        expect(languages[locale].blocks[0], locale).toEqual({
          type: 'gallery',
          mode,
          cards: expect.any(Array),
        });
      }
    },
  );

  it.each([
    ['a heading and a note', { heading: 'Cabinetul', note: 'o notă scurtă.' }],
    ['a heading only', { heading: 'Cabinetul' }],
    ['a note only', { note: 'o notă scurtă.' }],
    ['neither a heading nor a note', {}],
  ] as const)(
    'accepts a photo with %s — each field in every language, an absent one an ABSENT key',
    (_case, fields: PhotoFields) => {
      const blocks = secondBlock(withBlock(rawPhoto(fields)));
      for (const locale of locales) {
        const inLanguage = (text: string): string => `${text} (${locale})`;
        // Strict: a key holding `undefined` is NOT an absent key here.
        expect(blocks[locale], locale).toStrictEqual({
          type: 'photo',
          image: {
            src: '/images/hero/treatment-room.jpg',
            alt: photoAlt(locale),
          },
          ...(fields.heading === undefined
            ? {}
            : { heading: inLanguage(fields.heading) }),
          ...(fields.note === undefined
            ? {}
            : { note: inLanguage(fields.note) }),
        });
        expect(Object.keys(blocks[locale]), locale).toEqual([
          'type',
          'image',
          ...(fields.heading === undefined ? [] : ['heading']),
          ...(fields.note === undefined ? [] : ['note']),
        ]);
      }
    },
  );

  it.each([
    [
      'headings and notes',
      { heading: 'Înainte', note: 'prima notă.' },
      { heading: 'După', note: 'a doua notă.' },
    ],
    [
      'headings only — any words, never only „Înainte" and „După"',
      { heading: 'La sosire' },
      { heading: 'În cabinet' },
    ],
    ['notes only', { note: 'prima notă.' }, { note: 'a doua notă.' }],
    ['neither headings nor notes', {}, {}],
  ] as const)(
    'accepts a pair with %s — its halves ONE shape, grouped',
    (_case, before: PhotoFields, after: PhotoFields) => {
      const blocks = secondBlock(
        withBlock(rawPair(rawHalf(before), rawHalf(after))),
      );
      for (const locale of locales) {
        const inLanguage = (text: string): string => `${text} (${locale})`;
        const both = (
          first: string | undefined,
          second: string | undefined,
        ): ArticlePair<string> | undefined =>
          first === undefined || second === undefined
            ? undefined
            : { before: inLanguage(first), after: inLanguage(second) };
        const headings = both(before.heading, after.heading);
        const notes = both(before.note, after.note);
        const room: ArticleImage = {
          src: '/images/hero/treatment-room.jpg',
          alt: photoAlt(locale),
        };
        expect(blocks[locale], locale).toStrictEqual({
          type: 'beforeAfter',
          images: { before: room, after: room },
          ...(headings === undefined ? {} : { headings }),
          ...(notes === undefined ? {} : { notes }),
        });
        expect(Object.keys(blocks[locale]), locale).toEqual([
          'type',
          'images',
          ...(headings === undefined ? [] : ['headings']),
          ...(notes === undefined ? [] : ['notes']),
        ]);
      }
    },
  );

  it('lets a pair show two pictures and say the same note on both halves — one shape is about the fields, not their words', () => {
    const blocks = secondBlock(
      withBlock(
        rawPair(
          rawHalf({ note: 'imagine ilustrativă.' }),
          rawHalf(
            { note: 'imagine ilustrativă.' },
            { image: { src: '/images/hero/instruments.jpg' } },
          ),
        ),
      ),
    );
    expect(blocks.ro).toStrictEqual({
      type: 'beforeAfter',
      images: {
        before: { src: '/images/hero/treatment-room.jpg', alt: photoAlt('ro') },
        after: { src: '/images/hero/instruments.jpg', alt: photoAlt('ro') },
      },
      notes: {
        before: 'imagine ilustrativă. (ro)',
        after: 'imagine ilustrativă. (ro)',
      },
    });
  });

  it('takes an alt that holds a letter of any script as words — the letter is the rule, not the alphabet', () => {
    // The premise of the invisible refusals below: trimming keeps a
    // zero-width space and a Hangul filler, so a trimmed, non-empty string
    // alone would let either through — lib/visible-text's `isFinishedText`
    // asks for something a reader SEES, and an alt's letter rule for a letter
    // that is DRAWN: `\p{L}` alone counts the filler, which IS a letter.
    expect(ZERO_WIDTH_SPACE.trim()).toBe(ZERO_WIDTH_SPACE);
    expect(HANGUL_FILLER.trim()).toBe(HANGUL_FILLER);
    expect(/\p{L}/u.test(HANGUL_FILLER)).toBe(true);
    // A small letter too: a rule that asked for a capital would pass the two
    // capitals alone.
    for (const alt of ['Ψ', 'É.', 'ș']) {
      const blocks = secondBlock(
        withBlock(rawPhoto({}, { words: wordsWith({}, 'de', { alt }) })),
      );
      expect(blocks.de, alt).toStrictEqual({
        type: 'photo',
        image: { src: '/images/hero/treatment-room.jpg', alt },
      });
    }
  });

  it('takes a LABEL that is a number — a subheading, a caption, a photo’s heading and a pair’s two: a digit names something, „2019" and „2024"', () => {
    const subheading = secondBlock(
      withBlock({ type: 'heading', words: tagged('2019') }),
    );
    expect(subheading.de).toStrictEqual({ type: 'heading', text: '2019 (de)' });
    // The tag the fixtures add — „ (de)" — holds letters; a label of digits
    // ALONE is written into one language and read back there.
    const caption = secondBlock(
      withBlock(
        rawGallery({
          cards: [
            rawCard('Sala de așteptare', {
              words: {
                ...cardWords('Sala'),
                fr: { caption: '2019', alt: 'Une salle' },
              },
            }),
            rawCard('Recepția'),
          ],
        }),
      ),
    );
    expect(
      caption.fr.type === 'gallery' ? caption.fr.cards[0]?.caption : undefined,
    ).toBe('2019');
    const photo = secondBlock(
      withBlock(
        rawPhoto(
          { heading: 'Cabinetul' },
          {
            words: wordsWith({ heading: 'Cabinetul' }, 'it', {
              heading: '2024',
              alt: 'Una sala',
            }),
          },
        ),
      ),
    );
    expect(photo.it.type === 'photo' ? photo.it.heading : undefined).toBe(
      '2024',
    );
  });

  it.each([
    ['an array', []],
    ['a string', 'text'],
    ['null', null],
  ])('refuses a file that holds %s', (_case, input) => {
    expect(() => parseArticle(input, 'exemplu')).toThrow(
      'src/content/blog/articles/exemplu.json: expected an object { "blocks": […], "conclusion": { ro, en, de, fr, it } }',
    );
  });

  it.each([
    [
      'an unknown key (a typo)',
      rawArticle({ concluzie: tagged('x') }),
      /: unknown key\(s\) "concluzie" — an article has exactly blocks, conclusion/,
    ],
    [
      'a missing key',
      without(rawArticle(), 'conclusion'),
      /: missing key\(s\) "conclusion" — an article has exactly blocks, conclusion/,
    ],
    [
      'blocks that are not a list',
      rawArticle({ blocks: { type: 'gallery' } }),
      /: "blocks" must be an array of blocks/,
    ],
    [
      'an empty list of blocks',
      rawArticle({ blocks: [] }),
      /: "blocks" is empty — an article has at least one block/,
    ],
    [
      'a conclusion in ONE language, the shape of a file written in Romanian alone',
      rawArticle({ conclusion: 'O concluzie scurtă.' }),
      /: "conclusion" must be an object \{ ro, en, de, fr, it \}/,
    ],
    [
      'a conclusion with a language missing',
      rawArticle({ conclusion: without(tagged('O concluzie.'), 'de') }),
      /: "conclusion": missing language\(s\) "de" — an article is written in exactly ro, en, de, fr, it/,
    ],
    [
      'a conclusion in a sixth language the site does not route',
      rawArticle({ conclusion: { ...tagged('O concluzie.'), es: 'Una.' } }),
      /: "conclusion": unknown language\(s\) "es" — an article is written in exactly ro, en, de, fr, it/,
    ],
    [
      'a conclusion empty in one language',
      rawArticle({ conclusion: { ...tagged('O concluzie.'), fr: '' } }),
      /: "conclusion\.fr" must be visible text, trimmed/,
    ],
    [
      'a conclusion with a stray space in one language',
      rawArticle({
        conclusion: { ...tagged('O concluzie.'), it: 'Una conclusione. ' },
      }),
      /: "conclusion\.it" must be visible text, trimmed/,
    ],
    [
      'a conclusion that is not text in one language',
      rawArticle({
        conclusion: { ...tagged('O concluzie.'), en: ['A conclusion.'] },
      }),
      /: "conclusion\.en" must be visible text, trimmed/,
    ],
    [
      'a conclusion that SHOWS NOTHING in one language — a zero-width space, which trimming keeps — saying so, the value spelled',
      rawArticle({
        conclusion: { ...tagged('O concluzie.'), de: ZERO_WIDTH_SPACE },
      }),
      ': "conclusion.de" must be visible text, trimmed: it shows nothing, got "\\u{200B}"',
    ],
    [
      'a conclusion that is NEL alone in one language — a control character',
      rawArticle({
        conclusion: { ...tagged('O concluzie.'), ro: NEXT_LINE },
      }),
      ': "conclusion.ro" must be visible text, trimmed: it shows nothing, got "\\u{0085}"',
    ],
  ])('refuses %s', (_case, input, message) => {
    expect(() => parseArticle(input, 'exemplu')).toThrow(TypeError);
    expect(() => parseArticle(input, 'exemplu')).toThrow(message);
  });

  it.each([
    [
      'a block that is not an object',
      'Un paragraf.',
      /block 2: expected an object with a "type"/,
    ],
    [
      'a block with no type',
      { words: tagged('Un paragraf.') },
      /block 2: "type" must be one of paragraph, heading, gallery, photo, beforeAfter, got undefined/,
    ],
    [
      'a type the reader does not know',
      { type: 'image', src: '/images/x.jpg' },
      /block 2: "type" must be one of paragraph, heading, gallery, photo, beforeAfter, got "image"/,
    ],
    [
      'a type in the wrong case',
      { type: 'Paragraph', words: tagged('Un paragraf.') },
      /block 2: "type" must be one of .*, got "Paragraph"/,
    ],
    [
      'a type that is no string — named by its type, never by JSON’s spelling of the object',
      { type: { name: 'paragraph' }, words: tagged('Un paragraf.') },
      'block 2: "type" must be one of paragraph, heading, gallery, photo, beforeAfter, got <object>',
    ],
    [
      'a type holding a character drawn as nothing — spelled by its code point',
      {
        type: `paragraph${ZERO_WIDTH_SPACE}`,
        words: tagged('Un paragraf.'),
      },
      'block 2: "type" must be one of paragraph, heading, gallery, photo, beforeAfter, got "paragraph\\u{200B}"',
    ],
    [
      // Every object INHERITS „constructor": a type looked up with `in`
      // instead of `Object.hasOwn` would pass as a block type and crash on
      // its key list, naming neither the file nor the block.
      'a type that is a key every object inherits („constructor")',
      { type: 'constructor', words: tagged('Un paragraf.') },
      /block 2: "type" must be one of paragraph, heading, gallery, photo, beforeAfter, got "constructor"/,
    ],
    [
      'a paragraph with an extra key',
      { type: 'paragraph', words: tagged('Un paragraf.'), title: 'x' },
      /block 2 \(paragraph\): unknown key\(s\) "title" — a paragraph block has exactly type, words/,
    ],
    [
      'a paragraph in ONE language, the shape of a file written in Romanian alone',
      { type: 'paragraph', text: 'Un paragraf.' },
      /block 2 \(paragraph\): unknown key\(s\) "text"; missing key\(s\) "words" — a paragraph block has exactly type, words/,
    ],
    [
      'a paragraph whose words are one string',
      { type: 'paragraph', words: 'Un paragraf.' },
      /block 2 \(paragraph\): "words" must be an object \{ ro, en, de, fr, it \}/,
    ],
    [
      'a paragraph with a language missing',
      { type: 'paragraph', words: without(tagged('Un paragraf.'), 'de') },
      /block 2 \(paragraph\): "words": missing language\(s\) "de" — an article is written in exactly ro, en, de, fr, it/,
    ],
    [
      'a paragraph in a sixth language',
      { type: 'paragraph', words: { ...tagged('Un paragraf.'), es: 'Uno.' } },
      /block 2 \(paragraph\): "words": unknown language\(s\) "es" — an article is written in exactly ro, en, de, fr, it/,
    ],
    [
      'a language code in the wrong case',
      {
        type: 'paragraph',
        words: { ...without(tagged('Un paragraf.'), 'ro'), RO: 'Un paragraf.' },
      },
      /block 2 \(paragraph\): "words": unknown language\(s\) "RO"; missing language\(s\) "ro"/,
    ],
    [
      'a paragraph empty in one language',
      { type: 'paragraph', words: { ...tagged('Un paragraf.'), de: '' } },
      /block 2 \(paragraph\): "words\.de" must be visible text, trimmed/,
    ],
    [
      'a paragraph with a stray space in one language',
      {
        type: 'paragraph',
        words: { ...tagged('Un paragraf.'), fr: ' Un paragraphe.' },
      },
      /block 2 \(paragraph\): "words\.fr" must be visible text, trimmed/,
    ],
    [
      'a paragraph that is not text in one language — saying so, the value named by its type',
      { type: 'paragraph', words: { ...tagged('Un paragraf.'), it: 7 } },
      'block 2 (paragraph): "words.it" must be visible text, trimmed: it is not a string, got 7',
    ],
    [
      'a paragraph with a stray no-break space in one language — saying which condition, the space spelled',
      {
        type: 'paragraph',
        words: { ...tagged('Un paragraf.'), de: `Ein Absatz.${NBSP}` },
      },
      'block 2 (paragraph): "words.de" must be visible text, trimmed: it has white space at its start or end, got "Ein Absatz.\\u{00A0}"',
    ],
    [
      'a paragraph that SHOWS NOTHING in one language — a soft hyphen and a zero-width space, which trimming keeps: until 2026-10-20 a blank line on the page',
      {
        type: 'paragraph',
        words: {
          ...tagged('Un paragraf.'),
          ro: `${SOFT_HYPHEN}${ZERO_WIDTH_SPACE}`,
        },
      },
      /block 2 \(paragraph\): "words\.ro" must be visible text, trimmed/,
    ],
    [
      'a heading empty in one language',
      { type: 'heading', words: { ...tagged('Un subtitlu'), en: '' } },
      /block 2 \(heading\): "words\.en" must be visible text, trimmed/,
    ],
    [
      'a heading that SHOWS NOTHING in one language — a Hangul filler, a letter drawn as blank width: until 2026-10-20 a nameless <h2>',
      {
        type: 'heading',
        words: { ...tagged('Un subtitlu'), it: HANGUL_FILLER },
      },
      'block 2 (heading): "words.it" must be visible text, trimmed: it shows nothing, got "\\u{3164}"',
    ],
    [
      'a subheading of a mark alone in one language — it shows, and names nothing: until 2026-10-21 an <h2> whose name says nothing',
      { type: 'heading', words: { ...tagged('Un subtitlu'), de: '.' } },
      'block 2 (heading): "words.de" names nothing: it holds no letter or digit that shows, got "." — a subheading of marks alone has no name',
    ],
    [
      'a subheading of an emoji alone in one language',
      { type: 'heading', words: { ...tagged('Un subtitlu'), ro: TOOTH } },
      `block 2 (heading): "words.ro" names nothing: it holds no letter or digit that shows, got "${TOOTH}" — a subheading of marks alone has no name`,
    ],
    [
      'a gallery with an extra key',
      rawGallery({ label: 'Galerie' }),
      /block 2 \(gallery\): unknown key\(s\) "label" — a gallery block has exactly type, mode, cards/,
    ],
    [
      'the old gallery placeholder, with none of its settings',
      { type: 'gallery' },
      /block 2 \(gallery\): missing key\(s\) "mode", "cards"/,
    ],
    [
      'a gallery mode the carousel does not have',
      rawGallery({ mode: 'circular' }),
      /block 2 \(gallery\): "mode" must be one of loop, bounded, got "circular"/,
    ],
    [
      'a gallery mode in the wrong case',
      rawGallery({ mode: 'Loop' }),
      /block 2 \(gallery\): "mode" must be one of loop, bounded, got "Loop"/,
    ],
    [
      'a gallery mode that is a list — named by its type',
      rawGallery({ mode: ['loop'] }),
      'block 2 (gallery): "mode" must be one of loop, bounded, got <object>',
    ],
    [
      'a gallery mode with a no-break space after it — the space spelled',
      rawGallery({ mode: `loop${NBSP}` }),
      'block 2 (gallery): "mode" must be one of loop, bounded, got "loop\\u{00A0}"',
    ],
    [
      // The type's trap again: with `in`, an inherited key would pass as a
      // mode and reach the carousel.
      'a gallery mode that is a key every object inherits („constructor")',
      rawGallery({ mode: 'constructor' }),
      /block 2 \(gallery\): "mode" must be one of loop, bounded, got "constructor"/,
    ],
    [
      // The five-card window is the Home page's since 2026-10-17: an article
      // names no window at all.
      'a gallery that names a window',
      rawGallery({ visible: 5 }),
      /block 2 \(gallery\): unknown key\(s\) "visible" — a gallery block has exactly type, mode, cards/,
    ],
    [
      'cards that are not a list',
      rawGallery({ cards: rawCard('Sala de așteptare') }),
      /block 2 \(gallery\): "cards" must be an array of cards/,
    ],
    [
      'a gallery of one card — a picture, not a carousel',
      rawGallery({ cards: [rawCard('Sala de așteptare')] }),
      /block 2 \(gallery\): "cards" holds 1, a gallery holds at least 2: one card is a picture, not a carousel/,
    ],
    [
      'a gallery of no cards',
      rawGallery({ cards: [] }),
      /block 2 \(gallery\): "cards" holds 0, a gallery holds at least 2/,
    ],
    [
      'a card that is not an object',
      rawGallery({ cards: [rawCard('Sala de așteptare'), 'Recepția'] }),
      /block 2 \(gallery\), card 2: expected an object \{ image, words \}/,
    ],
    [
      'a card with an extra key',
      rawGallery({
        cards: [
          rawCard('Sala de așteptare', { title: 'x' }),
          rawCard('Recepția'),
        ],
      }),
      /block 2 \(gallery\), card 1: unknown key\(s\) "title" — a card has exactly image, words/,
    ],
    [
      'a card in ONE language — its caption beside its picture',
      rawGallery({
        cards: [
          rawCard('Sala de așteptare'),
          {
            image: { src: '/images/hero/lobby.jpg', alt: 'Sala' },
            caption: 'Recepția',
          },
        ],
      }),
      /block 2 \(gallery\), card 2: unknown key\(s\) "caption"; missing key\(s\) "words" — a card has exactly image, words/,
    ],
    [
      'a card picture that is a string',
      rawGallery({
        cards: [
          rawCard('Sala de așteptare', { image: '/images/hero/lobby.jpg' }),
          rawCard('Recepția'),
        ],
      }),
      /block 2 \(gallery\), card 1: "image" must be an object \{ src \}/,
    ],
    [
      'a card picture still carrying its alt — the alt is a word, written per language',
      rawGallery({
        cards: [
          rawCard('Sala de așteptare'),
          rawCard('Recepția', {
            image: { src: '/images/hero/lobby.jpg', alt: 'Sala' },
          }),
        ],
      }),
      /block 2 \(gallery\), card 2: "image": unknown key\(s\) "alt"/,
    ],
    [
      'a card picture outside /images/',
      rawGallery({
        cards: [
          rawCard('Sala de așteptare', {
            image: { src: '/photos/lobby.jpg' },
          }),
          rawCard('Recepția'),
        ],
      }),
      /block 2 \(gallery\), card 1: "image\.src" must be a path under \/images\/, got "\/photos\/lobby\.jpg"/,
    ],
    [
      'a card with a language missing',
      rawGallery({
        cards: [
          rawCard('Sala de așteptare'),
          rawCard('Recepția', {
            words: without(cardWords('Recepția'), 'it'),
          }),
        ],
      }),
      /block 2 \(gallery\), card 2: "words": missing language\(s\) "it" — an article is written in exactly ro, en, de, fr, it/,
    ],
    [
      'a card whose words in one language are a bare caption',
      rawGallery({
        cards: [
          rawCard('Sala de așteptare', {
            words: { ...cardWords('Sala de așteptare'), de: 'Wartezimmer' },
          }),
          rawCard('Recepția'),
        ],
      }),
      /block 2 \(gallery\), card 1: "words\.de" must be an object \{ caption, alt \}/,
    ],
    [
      'a card with an extra field in one language',
      rawGallery({
        cards: [
          rawCard('Sala de așteptare', {
            words: {
              ...cardWords('Sala de așteptare'),
              fr: { caption: 'Salle', alt: 'La salle', title: 'x' },
            },
          }),
          rawCard('Recepția'),
        ],
      }),
      /block 2 \(gallery\), card 1: "words\.fr": unknown key\(s\) "title" — a card's words are exactly caption, alt/,
    ],
    [
      'a card with no caption in one language',
      rawGallery({
        cards: [
          rawCard('Sala de așteptare'),
          rawCard('Recepția', {
            words: { ...cardWords('Recepția'), en: { alt: 'The reception' } },
          }),
        ],
      }),
      /block 2 \(gallery\), card 2: "words\.en": missing key\(s\) "caption" — a card's words are exactly caption, alt/,
    ],
    [
      'a card with an empty caption in one language',
      rawGallery({
        cards: [
          rawCard('Sala de așteptare', {
            words: {
              ...cardWords('Sala de așteptare'),
              ro: { caption: '', alt: 'Sala' },
            },
          }),
          rawCard('Recepția'),
        ],
      }),
      /block 2 \(gallery\), card 1: "words\.ro\.caption" must be visible text, trimmed/,
    ],
    [
      'a caption with a stray space in one language',
      rawGallery({
        cards: [
          rawCard('Sala de așteptare', {
            words: {
              ...cardWords('Sala de așteptare'),
              it: { caption: 'Sala d’attesa ', alt: 'La sala' },
            },
          }),
          rawCard('Recepția'),
        ],
      }),
      /block 2 \(gallery\), card 1: "words\.it\.caption" must be visible text, trimmed/,
    ],
    [
      'a caption that SHOWS NOTHING in one language — a word joiner, which trimming keeps',
      rawGallery({
        cards: [
          rawCard('Sala de așteptare'),
          rawCard('Recepția', {
            words: {
              ...cardWords('Recepția'),
              fr: { caption: WORD_JOINER, alt: 'La salle' },
            },
          }),
        ],
      }),
      'block 2 (gallery), card 2: "words.fr.caption" must be visible text, trimmed: it shows nothing, got "\\u{2060}"',
    ],
    [
      'a caption of an ellipsis alone in one language — a label with no name',
      rawGallery({
        cards: [
          rawCard('Sala de așteptare'),
          rawCard('Recepția', {
            words: {
              ...cardWords('Recepția'),
              en: { caption: '…', alt: 'The reception desk' },
            },
          }),
        ],
      }),
      'block 2 (gallery), card 2: "words.en.caption" names nothing: it holds no letter or digit that shows, got "…" — a caption of marks alone has no name',
    ],
    [
      'a card picture with an EMPTY description in one language — a gallery picture is information',
      rawGallery({
        cards: [
          rawCard('Sala de așteptare'),
          rawCard('Recepția', {
            words: {
              ...cardWords('Recepția'),
              de: { caption: 'Empfang', alt: '' },
            },
          }),
        ],
      }),
      'block 2 (gallery), card 2: "words.de.alt" must describe the picture, visible text, trimmed: it shows nothing, got "" — a gallery picture is information, never decoration',
    ],
    [
      'a card picture description with a stray space in one language',
      rawGallery({
        cards: [
          rawCard('Sala de așteptare', {
            words: {
              ...cardWords('Sala de așteptare'),
              en: { caption: 'Waiting room', alt: ' The waiting room' },
            },
          }),
          rawCard('Recepția'),
        ],
      }),
      /block 2 \(gallery\), card 1: "words\.en\.alt" must describe the picture/,
    ],
    [
      'a card picture described by a mark alone in one language — a description holds a letter',
      rawGallery({
        cards: [
          rawCard('Sala de așteptare'),
          rawCard('Recepția', {
            words: {
              ...cardWords('Recepția'),
              it: { caption: 'Accettazione', alt: '-' },
            },
          }),
        ],
      }),
      'block 2 (gallery), card 2: "words.it.alt" must describe the picture in words, and it holds no visible letter, got "-" — a mark or a number alone describes nothing: a gallery picture is information, never decoration',
    ],
    [
      'a photo with an extra key',
      rawPhoto({}, { caption: 'x' }),
      /block 2 \(photo\): unknown key\(s\) "caption" — a photo block has exactly type, image, words/,
    ],
    [
      'a photo with no picture',
      without(rawPhoto(), 'image'),
      /block 2 \(photo\): missing key\(s\) "image" — a photo block has exactly type, image, words/,
    ],
    [
      'a photo picture that is a string',
      rawPhoto({}, { image: '/images/hero/lobby.jpg' }),
      /block 2 \(photo\): "image" must be an object \{ src \}/,
    ],
    [
      'a photo picture still carrying its alt — the alt is a word, written per language',
      rawPhoto({}, { image: { src: '/images/hero/lobby.jpg', alt: 'Sala' } }),
      /block 2 \(photo\): "image": unknown key\(s\) "alt"/,
    ],
    [
      'a photo picture outside /images/',
      rawPhoto({}, { image: { src: '/photos/lobby.jpg' } }),
      /block 2 \(photo\): "image\.src" must be a path under \/images\/, got "\/photos\/lobby\.jpg"/,
    ],
    [
      'a photo whose words are one string',
      rawPhoto({}, { words: 'O fotografie.' }),
      /block 2 \(photo\): "words" must be an object \{ ro, en, de, fr, it \}/,
    ],
    [
      'a photo with a language missing',
      rawPhoto({}, { words: without(photoWords(), 'it') }),
      /block 2 \(photo\): "words": missing language\(s\) "it" — an article is written in exactly ro, en, de, fr, it/,
    ],
    [
      'a photo whose words in one language are a bare alt',
      rawPhoto({}, { words: wordsWith({}, 'de', 'Ein Behandlungsraum') }),
      /block 2 \(photo\): "words\.de" must be an object \{ heading\?, alt, note\? \}/,
    ],
    [
      'a note key misspelt in one language („noet")',
      rawPhoto(
        { note: 'o notă.' },
        {
          words: wordsWith({ note: 'o notă.' }, 'fr', {
            alt: 'Une salle de soins',
            noet: 'une note.',
          }),
        },
      ),
      /block 2 \(photo\): "words\.fr": unknown key\(s\) "noet" — a photo's words are alt and, when it has them, heading and note/,
    ],
    [
      'a heading key misspelt in one language',
      rawPhoto(
        {},
        {
          words: wordsWith({}, 'en', {
            headline: 'The room',
            alt: 'A treatment room',
          }),
        },
      ),
      /block 2 \(photo\): "words\.en": unknown key\(s\) "headline" — a photo's words are alt and, when it has them, heading and note/,
    ],
    [
      'the old pair shape — a „title" — in one language of a photo',
      rawPhoto(
        {},
        { words: wordsWith({}, 'ro', { title: 'Cabinetul', alt: 'Cabinet' }) },
      ),
      /block 2 \(photo\): "words\.ro": unknown key\(s\) "title" — a photo's words are alt and, when it has them, heading and note/,
    ],
    [
      'a photo with no alt in one language',
      rawPhoto(
        { heading: 'Cabinetul' },
        {
          words: wordsWith({ heading: 'Cabinetul' }, 'ro', {
            heading: 'Cabinetul',
          }),
        },
      ),
      /block 2 \(photo\): "words\.ro": missing key\(s\) "alt" — a photo's words are alt and, when it has them, heading and note/,
    ],
    [
      'an EMPTY alt in one language — a photo is information',
      rawPhoto({}, { words: wordsWith({}, 'de', { alt: '' }) }),
      'block 2 (photo): "words.de.alt" must describe the picture, visible text, trimmed: it shows nothing, got "" — a photo of the article is information, never decoration',
    ],
    [
      'an alt that is a lone dot in one language — a description holds a letter',
      rawPhoto({}, { words: wordsWith({}, 'de', { alt: '.' }) }),
      'block 2 (photo): "words.de.alt" must describe the picture in words, and it holds no visible letter, got "." — a mark or a number alone describes nothing: a photo of the article is information, never decoration',
    ],
    [
      'an alt that is a lone zero-width space in one language — which trimming keeps, and which shows nothing',
      rawPhoto({}, { words: wordsWith({}, 'fr', { alt: ZERO_WIDTH_SPACE }) }),
      'block 2 (photo): "words.fr.alt" must describe the picture, visible text, trimmed: it shows nothing, got "\\u{200B}" — a photo of the article is information, never decoration',
    ],
    [
      'an alt that is a lone Hangul filler in one language — a LETTER drawn as blank width, which \\p{L} alone let through until 2026-10-20, and which shows nothing',
      rawPhoto({}, { words: wordsWith({}, 'it', { alt: HANGUL_FILLER }) }),
      'block 2 (photo): "words.it.alt" must describe the picture, visible text, trimmed: it shows nothing, got "\\u{3164}" — a photo of the article is information, never decoration',
    ],
    [
      'an alt that is NEL alone in one language — a control character, the one of White_Space that `\\s` misses',
      rawPhoto({}, { words: wordsWith({}, 'ro', { alt: NEXT_LINE }) }),
      'block 2 (photo): "words.ro.alt" must describe the picture, visible text, trimmed: it shows nothing, got "\\u{0085}" — a photo of the article is information, never decoration',
    ],
    [
      'an alt of a Hangul filler beside a dot in one language — the dot shows, but the one letter is drawn as nothing: \\p{L} counted it as words until PostPhoto’s round-3 reviews (2026-10-20)',
      rawPhoto(
        {},
        { words: wordsWith({}, 'de', { alt: `${HANGUL_FILLER}.` }) },
      ),
      'block 2 (photo): "words.de.alt" must describe the picture in words, and it holds no visible letter, got "\\u{3164}." — a mark or a number alone describes nothing: a photo of the article is information, never decoration',
    ],
    [
      'a photo heading that SHOWS NOTHING in one language — a zero-width space: until 2026-10-20 an empty caption row over the picture',
      rawPhoto(
        { heading: 'Cabinetul' },
        {
          words: wordsWith({ heading: 'Cabinetul' }, 'ro', {
            heading: ZERO_WIDTH_SPACE,
            alt: 'Cabinetul de tratament',
          }),
        },
      ),
      'block 2 (photo): "words.ro.heading" must be visible text, trimmed: it shows nothing, got "\\u{200B}" — a photo with no heading leaves the key out, in every language',
    ],
    [
      'a photo heading of a mark alone in one language — a caption with no name',
      rawPhoto(
        { heading: 'Cabinetul' },
        {
          words: wordsWith({ heading: 'Cabinetul' }, 'en', {
            heading: '.',
            alt: 'A treatment room',
          }),
        },
      ),
      'block 2 (photo): "words.en.heading" names nothing: it holds no letter or digit that shows, got "." — a heading of marks alone has no name',
    ],
    [
      'a photo note that SHOWS NOTHING in one language — a soft hyphen: until 2026-10-20 an empty grey row under the picture',
      rawPhoto(
        { note: 'o notă.' },
        {
          words: wordsWith({ note: 'o notă.' }, 'it', {
            alt: 'Una sala',
            note: SOFT_HYPHEN,
          }),
        },
      ),
      'block 2 (photo): "words.it.note" must be visible text, trimmed: it shows nothing, got "\\u{00AD}" — a photo with no note leaves the key out, in every language',
    ],
    [
      'an alt that is a number alone in one language — a year describes no picture',
      rawPhoto({}, { words: wordsWith({}, 'en', { alt: '2019' }) }),
      /block 2 \(photo\): "words\.en\.alt" must describe the picture in words, and it holds no visible letter/,
    ],
    [
      'an EMPTY note in one language — a photo with no note leaves the key out',
      rawPhoto(
        { note: 'o notă.' },
        {
          words: wordsWith({ note: 'o notă.' }, 'en', {
            alt: 'A room',
            note: '',
          }),
        },
      ),
      'block 2 (photo): "words.en.note" must be visible text, trimmed: it shows nothing, got "" — a photo with no note leaves the key out, in every language',
    ],
    [
      'an EMPTY heading in one language',
      rawPhoto(
        { heading: 'Cabinetul' },
        {
          words: wordsWith({ heading: 'Cabinetul' }, 'it', {
            heading: '',
            alt: 'Una sala',
          }),
        },
      ),
      'block 2 (photo): "words.it.heading" must be visible text, trimmed: it shows nothing, got "" — a photo with no heading leaves the key out, in every language',
    ],
    [
      'a heading with a stray space in one language',
      rawPhoto(
        { heading: 'Cabinetul' },
        {
          words: wordsWith({ heading: 'Cabinetul' }, 'fr', {
            heading: 'La salle ',
            alt: 'Une salle',
          }),
        },
      ),
      /block 2 \(photo\): "words\.fr\.heading" must be visible text, trimmed/,
    ],
    [
      'a note that is not text in one language',
      rawPhoto(
        { note: 'o notă.' },
        {
          words: wordsWith({ note: 'o notă.' }, 'de', {
            alt: 'Ein Raum',
            note: 7,
          }),
        },
      ),
      /block 2 \(photo\): "words\.de\.note" must be visible text, trimmed/,
    ],
    [
      'a note that SHOWS NOTHING in one language — a zero-width space, which trimming keeps',
      rawPhoto(
        { note: 'o notă.' },
        {
          words: wordsWith({ note: 'o notă.' }, 'fr', {
            alt: 'Une salle',
            note: ZERO_WIDTH_SPACE,
          }),
        },
      ),
      'block 2 (photo): "words.fr.note" must be visible text, trimmed: it shows nothing, got "\\u{200B}" — a photo with no note leaves the key out, in every language',
    ],
    [
      'a heading in four languages only — a translation forgotten',
      rawPhoto(
        { heading: 'Cabinetul' },
        {
          words: wordsWith({ heading: 'Cabinetul' }, 'de', { alt: 'Ein Raum' }),
        },
      ),
      /block 2 \(photo\): "words\.de" has no heading, while ro, en, fr, it have one — a photo's heading is written in all five languages or in none/,
    ],
    [
      'a note in four languages only — a translation forgotten',
      rawPhoto(
        { note: 'o notă.' },
        { words: wordsWith({ note: 'o notă.' }, 'it', { alt: 'Una sala' }) },
      ),
      /block 2 \(photo\): "words\.it" has no note, while ro, en, de, fr have one — a photo's note is written in all five languages or in none/,
    ],
    [
      'a note in ONE language only',
      rawPhoto(
        {},
        {
          words: wordsWith({}, 'ro', { alt: 'Cabinetul', note: 'o notă.' }),
        },
      ),
      /block 2 \(photo\): "words\.en" has no note, while ro has one — a photo's note is written in all five languages or in none/,
    ],
    [
      'a before/after with no after',
      { type: 'beforeAfter', before: rawHalf() },
      /block 2 \(beforeAfter\): missing key\(s\) "after" — a beforeAfter block has exactly type, before, after/,
    ],
    [
      'a half that is not an object',
      rawPair('Înainte', rawHalf()),
      /block 2 \(beforeAfter\), "before": expected an object \{ image, words \}/,
    ],
    [
      'a half with an extra key',
      rawPair(rawHalf(), rawHalf({}, { caption: 'x' })),
      /block 2 \(beforeAfter\), "after": unknown key\(s\) "caption" — each half of a pair is a photo, exactly image, words/,
    ],
    [
      'a half in ONE language — its heading beside its picture',
      rawPair(
        {
          heading: 'Înainte',
          image: { src: '/images/hero/lobby.jpg', alt: 'Sala' },
        },
        rawHalf(),
      ),
      /block 2 \(beforeAfter\), "before": unknown key\(s\) "heading"; missing key\(s\) "words" — each half of a pair is a photo, exactly image, words/,
    ],
    [
      'a half with a language missing',
      rawPair(
        rawHalf(
          { heading: 'Înainte' },
          { words: without(photoWords({ heading: 'Înainte' }), 'fr') },
        ),
        rawHalf({ heading: 'După' }),
      ),
      /block 2 \(beforeAfter\), "before": "words": missing language\(s\) "fr" — an article is written in exactly ro, en, de, fr, it/,
    ],
    [
      'a half with an extra field in one language',
      rawPair(
        rawHalf({ heading: 'Înainte' }),
        rawHalf(
          { heading: 'După' },
          {
            words: wordsWith({ heading: 'După' }, 'it', {
              heading: 'Dopo',
              alt: 'Il dopo',
              caption: 'x',
            }),
          },
        ),
      ),
      /block 2 \(beforeAfter\), "after": "words\.it": unknown key\(s\) "caption" — a photo's words are alt and, when it has them, heading and note/,
    ],
    [
      'the old shape — a half „title" — in one language, renamed heading',
      rawPair(
        rawHalf(
          { heading: 'Înainte' },
          {
            words: wordsWith({ heading: 'Înainte' }, 'ro', {
              title: 'Înainte',
              alt: 'Cabinetul',
            }),
          },
        ),
        rawHalf({ heading: 'După' }),
      ),
      /block 2 \(beforeAfter\), "before": "words\.ro": unknown key\(s\) "title" — a photo's words are alt and, when it has them, heading and note/,
    ],
    [
      'a half with an empty heading in one language',
      rawPair(
        rawHalf(
          { heading: 'Înainte' },
          {
            words: wordsWith({ heading: 'Înainte' }, 'de', {
              heading: '',
              alt: 'Vorher',
            }),
          },
        ),
        rawHalf({ heading: 'După' }),
      ),
      /block 2 \(beforeAfter\), "before": "words\.de\.heading" must be visible text, trimmed/,
    ],
    [
      'a half whose heading SHOWS NOTHING in one language — a soft hyphen, which trimming keeps',
      rawPair(
        rawHalf({ heading: 'Înainte' }),
        rawHalf(
          { heading: 'După' },
          {
            words: wordsWith({ heading: 'După' }, 'en', {
              heading: SOFT_HYPHEN,
              alt: 'After',
            }),
          },
        ),
      ),
      'block 2 (beforeAfter), "after": "words.en.heading" must be visible text, trimmed: it shows nothing, got "\\u{00AD}"',
    ],
    [
      'a half whose heading is a mark alone in one language — the half’s caption with no name',
      rawPair(
        rawHalf(
          { heading: 'Înainte' },
          {
            words: wordsWith({ heading: 'Înainte' }, 'fr', {
              heading: '·',
              alt: 'Avant : la salle',
            }),
          },
        ),
        rawHalf({ heading: 'După' }),
      ),
      'block 2 (beforeAfter), "before": "words.fr.heading" names nothing: it holds no letter or digit that shows, got "·" — a heading of marks alone has no name',
    ],
    [
      'a half with a note in four languages only — a translation forgotten',
      rawPair(
        rawHalf(
          { note: 'prima notă.' },
          {
            words: wordsWith({ note: 'prima notă.' }, 'de', {
              alt: 'Vorher',
            }),
          },
        ),
        rawHalf({ note: 'a doua notă.' }),
      ),
      /block 2 \(beforeAfter\), "before": "words\.de" has no note, while ro, en, fr, it have one — a photo's note is written in all five languages or in none/,
    ],
    [
      'a heading on the before half only — the pair is one shape',
      rawPair(rawHalf({ heading: 'Înainte' }), rawHalf()),
      /block 2 \(beforeAfter\): "before" has a heading and "after" has none — a pair is one shape: a heading on both halves or on neither/,
    ],
    [
      'a heading on the after half only',
      rawPair(rawHalf(), rawHalf({ heading: 'După' })),
      /block 2 \(beforeAfter\): "after" has a heading and "before" has none — a pair is one shape: a heading on both halves or on neither/,
    ],
    [
      'a note on the before half only — the owner’s „no înainte with note and după without note"',
      rawPair(rawHalf({ note: 'prima notă.' }), rawHalf()),
      /block 2 \(beforeAfter\): "before" has a note and "after" has none — a pair is one shape: a note on both halves or on neither/,
    ],
    [
      'a note on the after half only',
      rawPair(
        rawHalf({ heading: 'Înainte' }),
        rawHalf({ heading: 'După', note: 'a doua notă.' }),
      ),
      /block 2 \(beforeAfter\): "after" has a note and "before" has none — a pair is one shape: a note on both halves or on neither/,
    ],
    [
      'a picture that is a string',
      rawPair(rawHalf({}, { image: '/images/hero/lobby.jpg' }), rawHalf()),
      /"before": "image" must be an object \{ src \}/,
    ],
    [
      'a picture with an extra key',
      rawPair(
        rawHalf(),
        rawHalf({}, { image: { src: '/images/hero/lobby.jpg', width: 3 } }),
      ),
      /"after": "image": unknown key\(s\) "width"/,
    ],
    [
      'a picture with no file',
      rawPair(rawHalf({}, { image: {} }), rawHalf()),
      /"before": "image": missing key\(s\) "src"/,
    ],
    [
      'a picture outside /images/',
      rawPair(rawHalf({}, { image: { src: '/photos/lobby.jpg' } }), rawHalf()),
      /"before": "image\.src" must be a path under \/images\/, got "\/photos\/lobby\.jpg"/,
    ],
    [
      'a picture path that is not text',
      rawPair(rawHalf(), rawHalf({}, { image: { src: 3 } })),
      /"after": "image\.src" must be a path under \/images\/, got 3/,
    ],
    [
      'a picture path that is an object — named by its type',
      rawPair(
        rawHalf(),
        rawHalf({}, { image: { src: { path: '/images/x' } } }),
      ),
      '"after": "image.src" must be a path under /images/, got <object>',
    ],
    [
      'an EMPTY description in one language — a before/after picture is information',
      rawPair(
        rawHalf({ heading: 'Înainte' }),
        rawHalf(
          { heading: 'După' },
          {
            words: wordsWith({ heading: 'După' }, 'en', {
              heading: 'After',
              alt: '',
            }),
          },
        ),
      ),
      '"after": "words.en.alt" must describe the picture, visible text, trimmed: it shows nothing, got "" — a before/after picture is information, never decoration',
    ],
    [
      'a description with a stray space in one language',
      rawPair(
        rawHalf(
          { heading: 'Înainte' },
          {
            words: wordsWith({ heading: 'Înainte' }, 'fr', {
              heading: 'Avant',
              alt: 'La salle ',
            }),
          },
        ),
        rawHalf({ heading: 'După' }),
      ),
      /"before": "words\.fr\.alt" must describe the picture/,
    ],
    [
      'a description that is an ellipsis alone in one language',
      rawPair(
        rawHalf(),
        rawHalf({}, { words: wordsWith({}, 'en', { alt: '…' }) }),
      ),
      '"after": "words.en.alt" must describe the picture in words, and it holds no visible letter, got "…" — a mark or a number alone describes nothing: a before/after picture is information, never decoration',
    ],
  ])(
    'refuses %s, naming the block, the language and the field',
    (_case, block, message) => {
      expect(() => parseArticle(withBlock(block), 'exemplu')).toThrow(
        TypeError,
      );
      expect(() => parseArticle(withBlock(block), 'exemplu')).toThrow(message);
    },
  );

  it('names the file by its slug in every message — or by the source it was given', () => {
    const broken = withBlock({
      type: 'heading',
      words: { ...tagged('Un subtitlu'), de: '' },
    });
    expect(() => parseArticle(broken, 'un-articol')).toThrow(
      'src/content/blog/articles/un-articol.json, block 2 (heading): "words.de" must be visible text, trimmed',
    );
    expect(() =>
      parseArticle(broken, 'un-articol', 'fișierul-de-test'),
    ).toThrow(
      'fișierul-de-test, block 2 (heading): "words.de" must be visible text, trimmed',
    );
  });

  it('reads the languages in the manifest’s order — the first one wrong is the one named', () => {
    const broken = withBlock({
      type: 'paragraph',
      words: { ...tagged('Un paragraf.'), it: '', de: '' },
    });
    expect(() => parseArticle(broken, 'exemplu')).toThrow(/"words\.de"/);
  });

  it('types a picture path through lib/image-path, and the entry as one Article per language', () => {
    expectTypeOf<ArticleImage['src']>().toEqualTypeOf<ImagePath>();
    expectTypeOf<Article['blocks'][number]>().toEqualTypeOf<ArticleBlock>();
    expectTypeOf<ArticleEntry['languages']>().toEqualTypeOf<
      Readonly<Record<Locale, Article>>
    >();
    expectTypeOf(parseArticle).returns.toEqualTypeOf<ArticleEntry>();
  });

  it('types the gallery as the carousel takes it — the card PROVISIONAL', () => {
    expectTypeOf<Extract<ArticleBlock, { type: 'gallery' }>>().toEqualTypeOf<
      Readonly<{
        type: 'gallery';
        mode: 'loop' | 'bounded';
        cards: readonly ArticleCard[];
      }>
    >();
    expectTypeOf<ArticleCard>().toEqualTypeOf<
      Readonly<{ image: ArticleImage; caption: string }>
    >();
  });

  it('types the photo and the pair as the sections take them — a pair GROUPED, so a half-and-half one cannot be written', () => {
    expectTypeOf<Extract<ArticleBlock, { type: 'photo' }>>().toEqualTypeOf<
      Readonly<{
        type: 'photo';
        image: ArticleImage;
        heading?: string;
        note?: string;
      }>
    >();
    expectTypeOf<
      Extract<ArticleBlock, { type: 'beforeAfter' }>
    >().toEqualTypeOf<
      Readonly<{
        type: 'beforeAfter';
        images: ArticlePair<ArticleImage>;
        headings?: ArticlePair<string>;
        notes?: ArticlePair<string>;
      }>
    >();
    expectTypeOf<ArticlePair<string>>().toEqualTypeOf<
      Readonly<{ before: string; after: string }>
    >();
    // The five block types, and no other.
    expectTypeOf<ArticleBlock['type']>().toEqualTypeOf<
      'paragraph' | 'heading' | 'gallery' | 'photo' | 'beforeAfter'
    >();
  });
});

describe('loadArticles — the checks at load', () => {
  it('builds the articles of the posts that have one, in the order of the posts', () => {
    const list = [post('al-doilea'), post('fara-articol'), post('primul')];
    const loaded = loadArticles(
      { primul: rawArticle(), 'al-doilea': rawArticle() },
      list,
    );
    // The list's order, never the registry's: the site's is newest first.
    expect(loaded.map((entry) => entry.slug)).toEqual(['al-doilea', 'primul']);
    // Each in every language, its slug in each.
    for (const entry of loaded) {
      for (const locale of locales) {
        expect(entry.languages[locale].slug).toBe(entry.slug);
      }
    }
  });

  it('refuses a registered article no post has, naming its file', () => {
    expect(() =>
      loadArticles({ orfan: rawArticle() }, [post('primul')]),
    ).toThrow(
      /^src\/content\/blog\/articles\/orfan\.json: "orfan" is no post's slug — an article is the body of a post in src\/content\/blog\/posts\.json/,
    );
    // A registry key that misses its post by a character drawn as nothing is
    // quoted `spelled`, so the message shows how it misses.
    expect(() =>
      loadArticles({ [`primul${ZERO_WIDTH_SPACE}`]: rawArticle() }, [
        post('primul'),
      ]),
    ).toThrow('"primul\\u{200B}" is no post\'s slug');
  });

  it('refuses a malformed file, naming it', () => {
    expect(() =>
      loadArticles({ primul: rawArticle({ blocks: [] }) }, [post('primul')]),
    ).toThrow('src/content/blog/articles/primul.json: "blocks" is empty');
  });

  it('refuses a file with a language missing, naming it', () => {
    expect(() =>
      loadArticles(
        {
          primul: rawArticle({
            conclusion: without(tagged('O concluzie.'), 'fr'),
          }),
        },
        [post('primul')],
      ),
    ).toThrow(
      'src/content/blog/articles/primul.json: "conclusion": missing language(s) "fr"',
    );
  });

  it('refuses an article whose author is no doctor, naming its post', () => {
    expect(() =>
      loadArticles({ primul: rawArticle() }, [post('primul', 'Dr. Nimeni')]),
    ).toThrow(
      /^post „primul": "author" "Dr\. Nimeni" is no doctor of lib\/team/,
    );
  });

  it('leaves a post with no article alone — its author is lib/blog’s business', () => {
    expect(loadArticles({}, [post('fara-articol', 'Dr. Nimeni')])).toEqual([]);
  });
});

describe('the shipped articles', () => {
  it('ship the demo, every one the body of a post, in the posts’ order (newest first)', () => {
    const slugs = articles.map((entry) => entry.slug);
    expect(slugs).toContain(DEMO);
    expect(slugs).toEqual(
      posts.map((p) => p.slug).filter((slug) => slugs.includes(slug)),
    );
  });

  it('write the demo in every language around the same pictures — the same blocks, in the same order', () => {
    const { languages } = demo();
    const types = (article: Article) => article.blocks.map((b) => b.type);
    for (const locale of locales) {
      expect(languages[locale].slug, locale).toBe(DEMO);
      expect(types(languages[locale]), locale).toEqual(types(languages.ro));
      expect(picturesOf(languages[locale]), locale).toEqual(
        picturesOf(languages.ro),
      );
    }
  });

  it.each([
    ['ro', 728, 4],
    ['en', 791, 4],
    ['de', 767, 4],
    ['fr', 838, 5],
    ['it', 787, 4],
  ] as const)(
    'counts the demo in %s at %i words — %i minutes at 200 a minute',
    (locale, words, minutes) => {
      // Romanian: 644 words of paragraphs, subheadings and conclusion, 40 of
      // the two galleries' captions (the same eight cards in each, 20 words a
      // gallery — two since 2026-10-17, when the five-card window left the
      // article), 16 of the four photos' headings and notes and 28 of the
      // four pairs' — 728, the post's 4 minutes. Each translation runs
      // longer, as translations of Romanian do; French passes 800: 5 minutes
      // there, within the one minute the data test allows a language other
      // than Romanian — 838 words since 2026-10-20, when its four spaced „:"
      // and two spaced „?" stopped counting as words (844 until then). A
      // change to the demo's words moves these numbers — and BACKLOG.md
      // entry 7, which quotes the Romanian count. The alts never move them.
      const article = demo().languages[locale];
      expect(articleWordCount(article)).toBe(words);
      expect(readingMinutes(article)).toBe(minutes);
    },
  );

  it('shows the two galleries an article has, in order down the page — the circular carousel, then the end-to-end list — each the same eight cards, in every language', () => {
    // The owner, 2026-10-16: "create instance on 3 and instance of 5 cards on
    // ciruclar one … have simple list with cange direction onc eend reached";
    // and on 2026-10-17 the five-card window left the article for the Home
    // page ("the fiver option … do not represent it in the article").
    const galleriesIn = (locale: Locale) =>
      demo().languages[locale].blocks.flatMap((block) =>
        block.type === 'gallery' ? [block] : [],
      );
    for (const locale of locales) {
      const galleries = galleriesIn(locale);
      expect(
        galleries.map((gallery) => gallery.mode),
        `${locale}: the two galleries, in order`,
      ).toEqual(['loop', 'bounded']);
      const [first] = galleries;
      expect(first?.cards, `${locale}: eight cards`).toHaveLength(8);
      for (const [index, gallery] of galleries.entries()) {
        expect(gallery.cards, `${locale}: gallery ${index + 1}`).toEqual(
          first?.cards,
        );
      }
      expect(
        first?.cards.map((card) => card.image.src),
        `${locale}: the eight stand-in pictures, in order`,
      ).toEqual(
        Array.from(
          { length: 8 },
          (_, index) => `/images/demo/gallery-${index + 1}.jpg`,
        ),
      );
    }
    expect(galleriesIn('ro')[0]?.cards.map((card) => card.caption)).toEqual([
      'Ușa cabinetului',
      'Sala de așteptare',
      'Masa de lucru',
      'Scaunul stomatologic',
      'Instrumentele de lucru',
      'Piesele de mână',
      'Oglinda dentară',
      'La control',
    ]);
  });

  it('shows every instance the owner asked for, once: four photos and four pairs, in every language', () => {
    // The owner, 2026-10-15: "also add an instance of the single blog image
    // with note, with heading and no not and without no heading nor not and
    // with note no heading. also add every instantiation possible of a
    // inainte and dupa".
    for (const locale of locales) {
      const { blocks } = demo().languages[locale];
      const shapes = (type: 'photo' | 'beforeAfter'): string[] =>
        blocks
          .filter((block) => block.type === type)
          .map(shapeOf)
          .toSorted();
      const every = ['heading', 'heading+note', 'neither', 'note'];
      expect(shapes('photo'), `${locale}: the photos`).toEqual(every);
      expect(shapes('beforeAfter'), `${locale}: the pairs`).toEqual(every);
    }
  });

  it('heads the demo’s one pair with notes „Înainte" / „După", and names another by other words — headings are the file’s', () => {
    const pairs = demo().languages.ro.blocks.flatMap((block) =>
      block.type === 'beforeAfter' && block.headings !== undefined
        ? [block]
        : [],
    );
    expect(pairs.map((pair) => [shapeOf(pair), pair.headings])).toEqual([
      ['heading', { before: 'La sosire', after: 'În cabinet' }],
      ['heading+note', { before: 'Înainte', after: 'După' }],
    ]);
  });

  it('never sets two pictures one after the other — a paragraph or a subheading between any two', () => {
    const { blocks } = demo().languages.ro;
    const isPicture = (block: ArticleBlock): boolean =>
      block.type === 'gallery' ||
      block.type === 'photo' ||
      block.type === 'beforeAfter';
    const neighbours = blocks.flatMap((block, index) => {
      const next = blocks[index + 1];
      return next !== undefined && isPicture(block) && isPicture(next)
        ? [`blocks ${index + 1} and ${index + 2}`]
        : [];
    });
    expect(neighbours).toEqual([]);
    // The rule has something to hold: ten picture blocks among the text —
    // two galleries, four photos and four pairs.
    expect(blocks.filter(isPicture)).toHaveLength(10);
  });
});

describe('articleSlugFor — the article a post’s card opens: its own, or THE STAND-IN', () => {
  /** The shipped stand-in, as a store holds it. */
  const standIn = (): ArticleEntry =>
    shippedArticle(STAND_IN_ARTICLE, 'the stand-in');

  it('names a registered article — the blog’s one, the owner’s “dummy” (2026-10-15)', () => {
    expect(STAND_IN_ARTICLE).toBe('cum-iti-alegi-periuta-de-dinti');
    expect(articles.map((entry) => entry.slug)).toContain(STAND_IN_ARTICLE);
  });

  it('opens a post’s OWN article when the store has one, and the stand-in for every other post', () => {
    // A store with a second article, at another post's slug.
    const store = [standIn(), { ...standIn(), slug: 'ce-este-tartrul' }];
    expect(articleSlugFor('ce-este-tartrul', store)).toBe('ce-este-tartrul');
    expect(articleSlugFor(STAND_IN_ARTICLE, store)).toBe(STAND_IN_ARTICLE);
    expect(articleSlugFor('implantul-dentar-pas-cu-pas', store)).toBe(
      STAND_IN_ARTICLE,
    );
  });

  it('opens the stand-in from every shipped post today — the one article the blog has', () => {
    for (const post of posts) {
      expect(articleSlugFor(post.slug), post.slug).toBe(STAND_IN_ARTICLE);
    }
  });

  it('refuses, naming the post, when the post has no article and the stand-in is gone too', () => {
    const store = [{ ...standIn(), slug: 'ce-este-tartrul' }];
    expect(() => articleSlugFor('implantul-dentar-pas-cu-pas', store)).toThrow(
      /post „implantul-dentar-pas-cu-pas" has no article, and the stand-in „cum-iti-alegi-periuta-de-dinti"/,
    );
    // A post with its own article never needs the stand-in.
    expect(articleSlugFor('ce-este-tartrul', store)).toBe('ce-este-tartrul');
  });
});

describe('articleAuthor — the doctor who signs a post, whatever the page’s language', () => {
  it('finds Dr. Nicu Elena Alina for the demo’s post', () => {
    const demoPost = posts.find((p) => p.slug === DEMO);
    if (demoPost === undefined) throw new Error(`no post „${DEMO}"`);
    expect(articleAuthor(demoPost)).toBe(shipped('nicu-elena-alina'));
  });

  it('finds the same doctor from the post in EVERY language as from its entry', () => {
    const entry = posts.find((p) => p.slug === DEMO);
    if (entry === undefined) throw new Error(`no post „${DEMO}"`);
    for (const locale of locales) {
      const inLanguage = postsIn(locale).find((p) => p.slug === DEMO);
      if (inLanguage === undefined) {
        throw new Error(`no post „${DEMO}" in ${locale}`);
      }
      expect(articleAuthor(inLanguage), locale).toBe(articleAuthor(entry));
    }
  });

  it('resolves the author of every shipped article — the name as lib/team spells it in Romanian', () => {
    for (const entry of articles) {
      const owner = posts.find((p) => p.slug === entry.slug);
      expect(owner, entry.slug).toBeDefined();
      if (owner !== undefined) {
        expect(articleAuthor(owner).words.ro.name).toBe(owner.author);
      }
    }
  });

  it('refuses a name no doctor wears, naming the post and listing the doctors', () => {
    const nobody = post('un-articol', 'Dr. Nimeni');
    expect(() => articleAuthor(nobody)).toThrow(TypeError);
    expect(() => articleAuthor(nobody)).toThrow(
      /^post „un-articol": "author" "Dr\. Nimeni" is no doctor of lib\/team — .*„Dr\. Nicu Elena Alina"/,
    );
  });

  it('quotes the author SPELLED — a name that misses a doctor’s by a no-break space shows the space by its code point, never as the very name it misses', () => {
    const nicu = shipped('nicu-elena-alina');
    const near = nicu.words.ro.name.replace(' ', NBSP);
    expect(near, 'the near miss differs').not.toBe(nicu.words.ro.name);
    // „Dr.\u{00A0}Nicu Elena Alina": the first space, spelled.
    const quoted = `"${nicu.words.ro.name.replace(' ', '\\u{00A0}')}"`;
    expect(() => articleAuthor(post('un-articol', near))).toThrow(
      `post „un-articol": "author" ${quoted} is no doctor of lib/team`,
    );
  });

  it('reads the ROMANIAN spelling — lib/team’s names are NOT the same in all five: its French drops the honorific’s point, and a post may not sign with it', () => {
    const nicu = shipped('nicu-elena-alina');
    const french = nicu.words.fr.name;
    // The fact the rule rests on, read off lib/team: the four other
    // languages spell her as the Romanian does, French does not.
    expect(french).not.toBe(nicu.words.ro.name);
    for (const locale of ['en', 'de', 'it'] as const) {
      expect(nicu.words[locale].name, locale).toBe(nicu.words.ro.name);
    }
    expect(() => articleAuthor(post('un-articol', french))).toThrow(
      /is no doctor of lib\/team/,
    );
  });

  it.each([
    ['without the honorific', 'Nicu Elena Alina'],
    ['in lower case', 'dr. nicu elena alina'],
  ])('matches the Romanian name exactly — refuses it %s', (_case, author) => {
    expect(() => articleAuthor(post('un-articol', author))).toThrow(
      /is no doctor of lib\/team/,
    );
  });

  it('refuses a name two doctors share — an author names exactly one', () => {
    const nicu = shipped('nicu-elena-alina');
    const twin: Doctor = { ...nicu, id: 'nicu-elena-alina-2' };
    expect(() => articleAuthor(post('un-articol'), [nicu, twin])).toThrow(
      'post „un-articol": "author" "Dr. Nicu Elena Alina" names 2 doctors of lib/team (nicu-elena-alina, nicu-elena-alina-2) — an article\'s author must name exactly one',
    );
  });

  it('reads lib/team’s doctors when no list is given', () => {
    expect(doctors.length).toBeGreaterThan(0);
    expectTypeOf(articleAuthor).returns.toEqualTypeOf<Doctor>();
  });
});

describe('articleWordCount and readingMinutes — the measure a post’s reading time is held to', () => {
  it('reads at 200 words a minute', () => {
    expect(WORDS_PER_MINUTE).toBe(200);
  });

  it('counts paragraphs, subheadings, captions, every heading and note and the conclusion — never the alts', () => {
    const picture: ArticleImage = {
      src: '/images/hero/lobby.jpg',
      alt: 'O descriere de cinci cuvinte',
    };
    const article: Article = {
      slug: 'x',
      blocks: [
        { type: 'paragraph', text: 'Unu doi trei.' },
        { type: 'heading', text: 'Patru cinci' },
        {
          type: 'gallery',
          mode: 'bounded',
          cards: [
            { image: picture, caption: 'Sala de așteptare' },
            { image: picture, caption: 'Recepția' },
          ],
        },
        {
          type: 'photo',
          image: picture,
          heading: 'Un cabinet',
          note: 'o notă de cinci cuvinte.',
        },
        { type: 'photo', image: picture },
        {
          type: 'beforeAfter',
          images: { before: picture, after: picture },
          headings: { before: 'Înainte', after: 'După tratament' },
          notes: { before: 'prima notă.', after: 'a doua notă.' },
        },
        { type: 'beforeAfter', images: { before: picture, after: picture } },
      ],
      conclusion: 'Șase șapte opt nouă.',
    };
    // 3 + 2 + (3 + 1) + (2 + 5) + 0 + (1 + 2 + 2 + 3) + 0 + 4 — the eight
    // five-word alts count for nothing, and so does a block's missing field.
    expect(articleWordCount(article)).toBe(28);
  });

  it('splits on any run of whitespace — a no-break space too', () => {
    const noBreakSpace = String.fromCharCode(0xa0);
    expect(
      articleWordCount({
        slug: 'x',
        blocks: [
          { type: 'paragraph', text: `unu  doi\tsunt\nși${noBreakSpace}patru` },
        ],
        conclusion: 'șase',
      }),
    ).toBe(6);
  });

  it('counts no mark that stands alone as a word — French’s spaced „:" and „?" — but a number and a word with its marks, each', () => {
    // French sets „:", „?", „!" and „;" apart with a narrow no-break space
    // (U+202F, the demo's own), which is white space to the split above.
    const narrow = String.fromCharCode(0x202f);
    const article: Article = {
      slug: 'x',
      blocks: [
        { type: 'heading', text: `Souple, médium ou dure${narrow}?` },
        {
          type: 'paragraph',
          text: `Le temps compte${narrow}: deux minutes, 2 fois. « Bien${narrow}! » …`,
        },
      ],
      conclusion: 'Fin.',
    };
    // The heading 4 (its „?" none), the paragraph 8 („2" one; „:", „«", „!",
    // „»" and „…" none) and the conclusion 1 — where a split on whitespace
    // alone counts 5, 13 and 1.
    expect(articleWordCount(article)).toBe(4 + 8 + 1);
  });

  it('counts a word by the rule a label is held to — a letter or a digit that SHOWS: a Hangul filler standing alone is no word, a letter drawn as nothing', () => {
    // lib/visible-text's `hasVisibleWord` (round 1 of its review,
    // 2026-10-21); a pattern of `[\p{L}\p{N}]` alone counted the filler.
    expect(
      articleWordCount({
        slug: 'x',
        blocks: [{ type: 'paragraph', text: `unu ${HANGUL_FILLER} doi` }],
        conclusion: `trei ${HANGUL_FILLER}${ZERO_WIDTH_SPACE}`,
      }),
    ).toBe(3);
  });

  it.each([
    [1, 1],
    [199, 1],
    [200, 1],
    [201, 2],
    [400, 2],
    [401, 3],
    [699, 4],
    [800, 4],
    [803, 5],
  ])('rounds %i words up to %i minute(s)', (words, minutes) => {
    expect(articleWordCount(articleOf(words))).toBe(words);
    expect(readingMinutes(articleOf(words))).toBe(minutes);
  });

  it('never announces 0 minutes', () => {
    expect(articleWordCount(articleOf(0))).toBe(0);
    expect(readingMinutes(articleOf(0))).toBe(1);
  });
});
