import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { locales, type Locale } from '../../src/i18n/locales';
import {
  isPostAlt,
  posts,
  postsIn,
  type BlogPostEntry,
} from '../../src/lib/blog/blog';
import { doctors } from '../../src/lib/team/team';
import { spelled } from '../../src/lib/visible-text/visible-text';
import { invisibleInside, seenAs } from './seen-text.ts';

// THE BLOG'S SHIPPED POSTS — what src/content/blog/posts.json must hold beyond
// the shape lib/blog's `parsePosts` already refuses at build time (a missing
// language, a fourth tag, a stray space …). These are the rules a card needs
// to look like a card (CLAUDE.md §15.39, 2026-10-11), read in EVERY language
// since round 3 (2026-10-14), when the posts gained their English, German,
// French and Italian words:
//   · every picture exists under public/ and is wide enough for the largest
//     file a phone asks of it — THE PICTURE FLOOR, derived below from
//     sections/PostCard's own `sizes` (its PICTURE_SIZES, read out of its
//     source): under a 46.25rem window every card is told `90vw`, which on
//     the widest phone held upright — 440 CSS px at 3×, an iPhone Pro Max
//     (§15.35) — asks for 1188 device pixels, and the browser fetches the
//     optimizer's next width, 1200 (next.config's `deviceSizes`, read too).
//     The optimizer copies a picture for every width past its own and never
//     enlarges it, so a narrower picture would hand every large phone a
//     softer file. A 2× window just under 46.25rem asks for 1332 — the 1920
//     file, which a 1200px picture serves at 1200: a tenth soft there,
//     accepted (the tier-3 review, 2026-10-14). The clinic's own photographs
//     are 1920 wide;
//   · the owner's D-DASH wording rule on every word (no spaced dash, no em or
//     en dash inside a sentence — tests/unit/hero-slides-data.test.ts's DASH,
//     widened here as in the article data test: DASH, below);
//   · every post is signed by one of the clinic's doctors: its `author` is a
//     doctor's name exactly as lib/team spells it in Romanian, so renaming a
//     doctor there fails here until the posts follow;
//   · a post describes its picture in every language or in none — an empty
//     alt is a decorative picture (lib/blog's PLACEHOLDERS), and one language
//     cannot be the only one to hear about it. "Describes" is lib/blog's own
//     rule, asked of lib/blog itself — its `isPostAlt` (THE TEXTS): until
//     round 2 of lib/visible-text's review (2026-10-21) this test spelled the
//     rule again with no pin to the parser's, and until round 1 it counted
//     any non-empty alt as a description, „." and a zero-width space among
//     them; an alt that is neither "" nor words fails here too, a belt beside
//     `parsePosts`' refusal;
//   · no INVISIBLE character stands INSIDE a post's title, summary, tags or
//     alt (tests/unit/seen-text.ts's `invisibleInside`, the article data
//     test's rule, shared since round 2 of lib/visible-text's review): „Cum
//     îți alegi peri" + a zero-width space + „uța" shows the title it copies,
//     passes every rule of `parsePosts` — finished text keeps an invisible
//     character that is no white space, at an end too — and splits a word for
//     search and for a screen reader's spelling; the characters that build an
//     emoji are kept, so a title may close on „Cu drag" and a heart;
//   · the tags are short labels in each language's own case: German starts
//     each with a capital LETTER, as German writes its nouns („Mundhygiene",
//     „3D-Röntgen"); the four others write every word lower case, the
//     reference's look — or as an ACRONYM, capitals and digits, two or more
//     („radiografie 3D", „ATM"; round 2 of lib/visible-text's review: the rule
//     refused „3D" in all five languages, and in German read the tag's first
//     CHARACTER, a digit). They float over the card's picture and scale with
//     the card, down to a 12px label at their floor (sections/PostCard's THE
//     CHIPS FOLLOW THEIR CARD), and a chip never wraps, so a tag must fit the
//     narrowest picture's line on that floor, 250px: 18 characters of real
//     words do, with room — the German compound „Wurzelbehandlungen",
//     capitalised, is a 157.7px chip and the Romanian „stomatologie copii"
//     138.9 (PostCard's THE CEILING); the cap of three a post is `parsePosts`'
//     own (lib/blog's MAX_TAGS);
//   · a summary stays a summary — the reference's longest is about 260
//     characters, and a card is not the article;
//   · no two posts share a title in one language;
//   · and two rules ACROSS the languages, so a translation cannot drift from
//     the Romanian it was made from: every language lists a post's categories
//     as the Romanian does, as many and in the same order, each Romanian
//     category worded ONE way on every card of a language (and no two of them
//     the same way) — so a German reader never meets „Mundhygiene" on one card
//     and „Hygiene" on the next; and no title or summary is another
//     language's, which is what an untranslated copy-paste looks like.
// Every comparison of words — the titles in one language, the titles and the
// summaries across the five, the tags' wordings — reads the texts AS A READER
// SEES THEM (tests/unit/seen-text.ts's `seenAs`, round 2 of lib/visible-text's
// review): a Romanian title and a zero-width space, posing as the German one,
// is the Romanian title on the German card, and a raw comparison passed it.
// A TITLE'S WORDS are held where they can be MEASURED, never here: a character
// count cannot bound a width — „Wurzelbehandlung", 16 characters, sets 250.5px
// at the card title's 30px, while the 15-character „Zahnaufhellung:" the blog
// ships sets 217.1 (the tier-3 review, 2026-10-14) — so
// src/components/sections/PostCard/PostCard.titles.test.tsx sets every title
// of every language in the real face on the narrowest title line each card
// draws — the blog list's 222px at the 30px step, and since 2026-10-17 the
// Home page's carousel cards down to a 132.6px line on PostCard's narrow
// steps — and refuses a word wider than its line (four German words on a 320
// phone excepted and named there).
// The CMSR scan (tests/unit/cmsr-scan.test.ts) reads every title, summary,
// tag and non-empty alt of the same list, in all five languages.

const PUBLIC = fileURLToPath(new URL('../../public', import.meta.url));

/** A file of the repository, as text. */
const sourceOf = (path: string): string =>
  readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

/**
 * D-DASH: a spaced dash of any kind, or an em/en dash anywhere, inside a
 * sentence — the article data test's DASH, widened with it in round 2 of
 * lib/visible-text's review: „any kind" is every dash Unicode files as one
 * (`\p{Pd}`: the hyphen U+2010, the non-breaking hyphen U+2011, the figure
 * dash U+2012 among them) and the minus sign U+2212. The older tests keep the
 * narrow form, NOT ADOPTED — the article data test's DASH names them.
 */
const DASH = /\s[\p{Pd}\u{2212}]\s|[\u{2013}\u{2014}]/u;

const TAG_CEILING = 18;
const SUMMARY_CEILING = 320;

/** sections/PostCard's PICTURE_SIZES, read out of its source — KEEP-IN-SYNC:
 *  the floor below follows the card's own `sizes`. */
function pictureSizes(): string {
  const match = /\bconst PICTURE_SIZES =\s*'([^']*)'/.exec(
    sourceOf('src/components/sections/PostCard/PostCard.tsx'),
  );
  if (!match?.[1]) {
    throw new Error('PostCard.tsx: no `PICTURE_SIZES` constant — it moved.');
  }
  return match[1];
}

/** The share of the window every phone is told: the list's LAST entry, the
 *  one with no media condition (a bare `90vw`). */
function phoneShare(sizes: string): number {
  const match = /,\s*(\d+(?:\.\d+)?)vw$/.exec(sizes);
  if (!match?.[1]) {
    throw new Error(`PICTURE_SIZES ends on no bare vw share: ${sizes}`);
  }
  return Number(match[1]) / 100;
}

/** The widths the optimizer writes for a full-width picture — next.config's
 *  `deviceSizes`, read out of its source. */
function deviceSizes(): number[] {
  const match = /\bdeviceSizes:\s*\[([^\]]*)\]/.exec(
    sourceOf('next.config.ts'),
  );
  if (!match?.[1]) {
    throw new Error('next.config.ts: no `deviceSizes` — it moved.');
  }
  return match[1].split(',').map((size) => Number(size.trim()));
}

/** The widest phone held upright and its density: an iPhone Pro Max, 440 CSS
 *  px at 3× (§15.35's phone gutter names it the largest). */
const WIDEST_PHONE = { width: 440, density: 3 } as const;

/** THE PICTURE FLOOR (the header): the optimizer's file the widest phone
 *  fetches for the share it is told. */
function pictureFloor(): number {
  const asked =
    phoneShare(pictureSizes()) * WIDEST_PHONE.width * WIDEST_PHONE.density;
  const file = deviceSizes()
    .toSorted((a, b) => a - b)
    .find((size) => size >= asked);
  if (file === undefined) {
    throw new Error(`no optimizer width reaches ${asked}`);
  }
  return file;
}

const PICTURE_FLOOR = pictureFloor();

/** An ACRONYM: capitals and digits, two or more — „3D", „ATM", „CBCT". */
const ACRONYM = /^[\p{Lu}\p{N}]{2,}$/u;

/** The first LETTER of a text, of any script — never a digit or a mark. */
const FIRST_LETTER = /\p{L}/u;

/**
 * A tag in its language's case (the header): German starts it with a
 * capital LETTER — the first letter, past any digit („3D-Röntgen"); a tag
 * with no letter at all has no case to break — and the four others write
 * each word lower case, or as an acronym. A word runs between spaces and
 * dashes.
 */
function inItsCase(locale: Locale, tag: string): boolean {
  if (locale === 'de') {
    const first = FIRST_LETTER.exec(tag)?.[0];
    return first === undefined || first !== first.toLocaleLowerCase('de');
  }
  return tag
    .split(/[\s\p{Pd}]+/u)
    .every(
      (word) => word === word.toLocaleLowerCase(locale) || ACRONYM.test(word),
    );
}

/** What an alt says of its picture, by lib/blog's own rule (its `isPostAlt`,
 *  THE TEXTS): "" — a picture that only decorates — or words that DESCRIBE
 *  it; anything else is neither, which `parsePosts` refuses at build. */
function altKind(alt: string): 'decorative' | 'described' | 'neither' {
  if (alt === '') return 'decorative';
  return isPostAlt(alt) ? 'described' : 'neither';
}

/** The clinic's doctors, each by the name lib/team gives them in Romanian. */
const DOCTOR_NAMES: ReadonlySet<string> = new Set(
  doctors.map((doctor) => doctor.words.ro.name),
);

/** Every invisible character inside a post's words in one language — its
 *  title, summary, tags and alt — each as „field: "\u{200B}" at character n"
 *  (tests/unit/seen-text.ts's `invisibleInside`); empty when there is none. */
function invisiblesIn(post: BlogPostEntry, locale: Locale): string[] {
  const { title, summary, tags, alt } = post.words[locale];
  const fields: ReadonlyArray<readonly [string, string]> = [
    ['title', title],
    ['summary', summary],
    ...tags.map((tag, index) => [`tag ${index + 1}`, tag] as const),
    ['alt', alt],
  ];
  return fields.flatMap(([field, text]) =>
    invisibleInside(text).map((found) => `${field}: ${found}`),
  );
}

/** A post's title and summary that two of its languages share AS A READER
 *  SEES THEM (`seenAs`) — each as „field: every language's text, spelled";
 *  empty when every language has its own. */
function sharedOwnWords(post: BlogPostEntry): string[] {
  return (['title', 'summary'] as const).flatMap((field): string[] => {
    const texts = locales.map((locale) => post.words[locale][field]);
    return new Set(texts.map(seenAs)).size === texts.length
      ? []
      : [`${field}: ${texts.map((text) => spelled(text)).join(' | ')}`];
  });
}

/** The titles two posts of `list` share in one language, as a reader sees
 *  them — each spelled; empty when every post has its own. */
function sharedTitles(
  list: readonly BlogPostEntry[],
  locale: Locale,
): string[] {
  const seen = new Set<string>();
  return list.flatMap((post): string[] => {
    const title = seenAs(post.words[locale].title);
    if (seen.has(title)) return [`${post.slug}: ${spelled(title)}`];
    seen.add(title);
    return [];
  });
}

/**
 * The category rule ACROSS the languages (the header), for one language:
 * every post lists as many tags as in Romanian, each Romanian category
 * worded ONE way on every card, and no two categories the same way — every
 * wording and every category compared as a reader sees it. Each problem
 * named; empty when there is none.
 */
function tagWordingProblems(
  list: readonly BlogPostEntry[],
  locale: Locale,
): string[] {
  const problems: string[] = [];
  const wordingOf = new Map<string, string>();
  const categoryOf = new Map<string, string>();
  for (const post of list) {
    const romanian = post.words.ro.tags;
    const here = post.words[locale].tags;
    if (here.length !== romanian.length) {
      problems.push(
        `${post.slug}: ${here.length} tag(s) in ${locale}, ${romanian.length} in ro`,
      );
      continue;
    }
    romanian.forEach((category, index) => {
      const wording = seenAs(here[index] ?? '');
      const seenCategory = seenAs(category);
      const earlier = wordingOf.get(seenCategory);
      if (earlier !== undefined && earlier !== wording) {
        problems.push(
          `${post.slug}: ro ${spelled(seenCategory)} is ${spelled(wording)} in ${locale}, ${spelled(earlier)} on an earlier card`,
        );
      }
      const other = categoryOf.get(wording);
      if (other !== undefined && other !== seenCategory) {
        problems.push(
          `${post.slug}: ${locale} ${spelled(wording)} words two categories, ro ${spelled(other)} and ${spelled(seenCategory)}`,
        );
      }
      wordingOf.set(seenCategory, wording);
      categoryOf.set(wording, seenCategory);
    });
  }
  return problems;
}

/** A shipped post by its slug, or a loud failure. */
function shipped(slug: string): BlogPostEntry {
  const post = posts.find((entry) => entry.slug === slug);
  if (post === undefined) throw new Error(`no shipped post „${slug}"`);
  return post;
}

/** `post` with one language's words changed — in memory, never on disk. */
function withWords(
  post: BlogPostEntry,
  locale: Locale,
  change: Partial<BlogPostEntry['words'][Locale]>,
): BlogPostEntry {
  return {
    ...post,
    words: { ...post.words, [locale]: { ...post.words[locale], ...change } },
  };
}

describe('the blog posts — what a card needs (src/content/blog/posts.json)', () => {
  it('ships posts', () => {
    expect(posts.length).toBeGreaterThan(0);
  });

  it('derives its picture floor from the card’s own `sizes` — 90vw on a 440 CSS px phone at 3×, the optimizer’s 1200 file', () => {
    expect(phoneShare(pictureSizes())).toBe(0.9);
    expect(PICTURE_FLOOR).toBe(1200);
  });

  it.each(posts.map((post) => [post.slug, post] as const))(
    '%s: its picture exists and is wide enough',
    async (_slug, post) => {
      const file = `${PUBLIC}${post.image.src}`;
      expect(existsSync(file), file).toBe(true);
      const { width } = await sharp(file).metadata();
      expect(width, file).toBeGreaterThanOrEqual(PICTURE_FLOOR);
    },
  );

  it.each(posts.map((post) => [post.slug, post] as const))(
    '%s: is signed by one of the clinic’s doctors, as lib/team spells the name',
    (_slug, post) => {
      expect(
        DOCTOR_NAMES.has(post.author),
        `${spelled(post.author)} is no doctor of lib/team`,
      ).toBe(true);
    },
  );

  it.each(posts.map((post) => [post.slug, post] as const))(
    '%s: describes its picture in every language or in none — each alt "" or words',
    (_slug, post) => {
      const kinds = locales.map(
        (locale) => [locale, altKind(post.words[locale].alt)] as const,
      );
      expect(
        kinds.filter(([, kind]) => kind === 'neither').map(([l]) => l),
        'an alt that is neither "" nor words that describe',
      ).toEqual([]);
      const described = kinds
        .filter(([, kind]) => kind === 'described')
        .map(([locale]) => locale);
      expect(
        [0, locales.length],
        `described in ${described.join(', ')} alone`,
      ).toContain(described.length);
    },
  );

  it('the description rule has teeth — "" decorates, words describe, and a mark, a number or a character that shows nothing is neither', () => {
    expect(altKind('')).toBe('decorative');
    for (const alt of ['Sala de așteptare a clinicii', 'Ψ', 'ș.']) {
      expect(altKind(alt), alt).toBe('described');
    }
    for (const alt of [
      '.',
      '-',
      '2',
      String.fromCodePoint(0x200b),
      `${String.fromCodePoint(0x3164)}.`,
      String.fromCodePoint(0x85),
      ' Sala',
    ]) {
      expect(altKind(alt), spelled(alt)).toBe('neither');
    }
  });

  it.each(
    posts.flatMap((post) =>
      locales.map((locale) => [post.slug, locale, post] as const),
    ),
  )(
    '%s in %s: holds no invisible character inside its words — but the ones that build an emoji',
    (_slug, locale, post) => {
      expect(invisiblesIn(post, locale)).toEqual([]);
    },
  );

  it('the invisible-inside rule has teeth on a post — a word split by a zero-width space, a summary ending on a word joiner, a tag holding a soft hyphen, an alt holding a Hangul filler; an emoji closing a title is kept', () => {
    const post = shipped('cum-iti-alegi-periuta-de-dinti');
    const of = (...codePoints: number[]) => String.fromCodePoint(...codePoints);
    const { title, summary, tags } = post.words.ro;
    // The premise: the Romanian title holds the word the first row splits.
    expect(title).toContain('periuța');
    const split = title.replace('periuța', `peri${of(0x200b)}uța`);
    expect(invisiblesIn(withWords(post, 'ro', { title: split }), 'ro')).toEqual(
      [`title: "\\u{200B}" at character ${split.indexOf('uța')}`],
    );
    // A word joiner closing the summary: no white space, so `trim()` keeps
    // it and `parsePosts` takes the summary as finished text.
    const joined = `${summary}${of(0x2060)}`;
    expect(
      invisiblesIn(withWords(post, 'ro', { summary: joined }), 'ro'),
    ).toEqual([`summary: "\\u{2060}" at character ${[...joined].length}`]);
    // A soft hyphen in a tag — the exception named and NOT taken.
    const [first = 'igienă', ...rest] = tags;
    const hyphened = `${first.slice(0, 2)}${of(0xad)}${first.slice(2)}`;
    expect(
      invisiblesIn(withWords(post, 'ro', { tags: [hyphened, ...rest] }), 'ro'),
    ).toEqual(['tag 1: "\\u{00AD}" at character 3']);
    // A Hangul filler inside an alt — a blank gap no one wrote.
    expect(
      invisiblesIn(
        withWords(post, 'ro', { alt: `Sala${of(0x3164)}de așteptare` }),
        'ro',
      ),
    ).toEqual(['alt: "\\u{3164}" at character 5']);
    // Kept: a title closing on a red heart drawn as an emoji (U+2764 and
    // its presentation selector U+FE0F) — finished text, and no word split.
    expect(
      invisiblesIn(
        withWords(post, 'ro', { title: `Cu drag ${of(0x2764, 0xfe0f)}` }),
        'ro',
      ),
    ).toEqual([]);
  });

  describe.each(locales)('in %s', (locale) => {
    const list = postsIn(locale);

    it.each(list.map((post) => [post.slug, post] as const))(
      '%s: keeps every dash out of its words (D-DASH)',
      (_slug, post) => {
        for (const words of [
          post.title,
          post.summary,
          post.image.alt,
          post.author,
          ...post.tags,
        ]) {
          expect(DASH.test(words), spelled(words)).toBe(false);
        }
      },
    );

    it.each(list.map((post) => [post.slug, post] as const))(
      '%s: keeps its tags and its summary short — each tag in its language’s case',
      (_slug, post) => {
        for (const tag of post.tags) {
          expect(
            inItsCase(locale, tag),
            `${spelled(tag)} — ${locale === 'de' ? 'a German tag’s first letter is a capital' : 'each word lower case, like the reference, or an acronym („3D", „ATM")'}`,
          ).toBe(true);
          expect(tag.length, tag).toBeLessThanOrEqual(TAG_CEILING);
        }
        expect(post.summary.length).toBeLessThanOrEqual(SUMMARY_CEILING);
      },
    );

    it('gives every post its own title — as a reader sees it', () => {
      expect(sharedTitles(posts, locale)).toEqual([]);
    });
  });

  it('lists each post’s categories in every language as the Romanian does — as many, and each category worded one way on every card, as a reader sees them', () => {
    for (const locale of locales) {
      expect(tagWordingProblems(posts, locale), locale).toEqual([]);
    }
  });

  it('gives every language its own words — no title or summary is another language’s, as a reader sees it', () => {
    expect(posts.flatMap(sharedOwnWords)).toEqual([]);
  });

  it('the own-words checks have teeth — a Romanian title and a zero-width space, posing as the German one, is the Romanian title to the eye', () => {
    const post = shipped('cum-iti-alegi-periuta-de-dinti');
    const posing = `${post.words.ro.title}${String.fromCodePoint(0x200b)}`;
    // The premise: raw, the two differ — a raw comparison passed the copy.
    expect(posing).not.toBe(post.words.ro.title);
    const copied = withWords(post, 'de', { title: posing });
    expect(sharedOwnWords(copied)).toEqual([expect.stringMatching(/^title: /)]);
    // …and a title two posts share in one language, the same way: the first
    // post's German title on the second, a no-break space for its first space.
    const [one, two] = posts;
    if (one === undefined || two === undefined) {
      throw new Error('the blog ships fewer than two posts');
    }
    const twin = one.words.de.title.replace(' ', String.fromCodePoint(0xa0));
    expect(twin).not.toBe(one.words.de.title);
    expect(
      sharedTitles([one, withWords(two, 'de', { title: twin })], 'de'),
    ).toEqual([`${two.slug}: ${spelled(seenAs(twin))}`]);
    // …and the tags: one category worded two ways, or two categories one way.
    const [category = 'igienă'] = one.words.ro.tags;
    const [wording = 'Mundhygiene'] = one.words.de.tags;
    const reworded = withWords(one, 'de', {
      tags: [`${wording}x`, ...one.words.de.tags.slice(1)],
    });
    expect(tagWordingProblems([one, reworded], 'de')).toEqual([
      expect.stringContaining(`ro ${spelled(category)} is`),
    ]);
    // A second post whose one category is another, worded as the first's.
    const borrowed = withWords(
      withWords(two, 'ro', { tags: ['altceva'] }),
      'de',
      { tags: [wording] },
    );
    expect(tagWordingProblems([one, borrowed], 'de')).toEqual([
      expect.stringContaining(`words two categories`),
    ]);
    // …as a reader sees them: the second worded as the first but for a
    // zero-width space is the same chip to the eye, two categories still.
    const hidden = withWords(
      withWords(two, 'ro', { tags: ['altceva'] }),
      'de',
      {
        tags: [
          `${wording.slice(0, 4)}${String.fromCodePoint(0x200b)}${wording.slice(4)}`,
        ],
      },
    );
    expect(tagWordingProblems([one, hidden], 'de')).toEqual([
      expect.stringContaining(`words two categories`),
    ]);
  });

  it('the D-DASH scan has teeth — a spaced dash of ANY kind, the hyphen, the non-breaking hyphen, the figure dash and the minus sign among them (round 2)', () => {
    const spaced = (dash: number): string =>
      `Un titlu ${String.fromCodePoint(dash)} o idee`;
    for (const bad of [
      'Un titlu - o idee',
      'Un titlu — o idee',
      'Un–titlu',
      spaced(0x2010),
      spaced(0x2011),
      spaced(0x2012),
      spaced(0x2212),
    ]) {
      expect(DASH.test(bad), spelled(bad)).toBe(true);
    }
    for (const good of [
      'Prim-plan cu instrumente',
      's-o schimbi',
      'să-și albească',
      'the six-monthly check-up',
      'le week-end',
    ]) {
      expect(DASH.test(good), good).toBe(false);
    }
  });

  it('the case rule has teeth — a German tag’s first letter is a capital, every other word lower case or an acronym', () => {
    for (const [locale, tag] of [
      ['de', 'Mundhygiene'],
      ['de', 'Ästhetik'],
      ['ro', 'igienă'],
      ['fr', 'hygiène'],
      // Round 2: an acronym keeps its capitals in every language — „3D",
      // „ATM", „CBCT" — and German reads its first LETTER, past a digit.
      ...locales.map((locale) => [locale, '3D'] as const),
      ...locales.map((locale) => [locale, 'ATM'] as const),
      ['ro', 'radiografie 3D'],
      ['en', 'CBCT scan'],
      ['fr', 'radiographie 3D'],
      ['it', 'radiografia 3D'],
      ['de', '3D-Röntgen'],
      ['de', 'CBCT'],
    ] as const) {
      expect(inItsCase(locale, tag), `${locale} „${tag}"`).toBe(true);
    }
    for (const [locale, tag] of [
      ['de', 'mundhygiene'],
      ['de', 'ästhetik'],
      ['de', '3d-röntgen'],
      ['de', 'radiografie 3D'],
      ['ro', 'Igienă'],
      ['ro', 'Radiografie 3D'],
      ['en', 'Hygiene'],
      // A capital alone is no acronym: two characters or more.
      ['it', 'vitamina C'],
    ] as const) {
      expect(inItsCase(locale, tag), `${locale} „${tag}"`).toBe(false);
    }
  });

  it('the signature rule has teeth — a name lib/team does not spell is refused', () => {
    expect(DOCTOR_NAMES.size, 'one name a doctor').toBe(doctors.length);
    const [first] = doctors;
    if (!first) throw new Error('lib/team ships no doctor');
    const name = first.words.ro.name;
    expect(DOCTOR_NAMES.has(name), name).toBe(true);
    // The French honorific lib/team writes („Dr", no point) is not the
    // Romanian one: a post copied from a French page would sign with it.
    const slip = name.replace(/^Dr\. /, 'Dr ');
    expect(slip, 'the slip differs from the name').not.toBe(name);
    expect(DOCTOR_NAMES.has(slip), slip).toBe(false);
  });
});
