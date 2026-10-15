import raw from '../../content/blog/posts.json';
import { locales, type Locale } from '../../i18n/locales';
import type { ImagePath } from '../image-path/image-path';
import { isIsoDate, type IsoDate } from '../time-ago/time-ago';

// lib/blog — THE BLOG'S POSTS: read from one JSON file, checked once, sorted
// newest first and cut into pages, in each of the site's five languages.
// React-free DATA (CLAUDE.md §4's foundation ring): the blog pages populate
// sections/PostList from it, and nothing in ui/ may import it. Built on the
// blog branch (CLAUDE.md §15.39), 2026-10-11, in Romanian; in every language
// since round 3, 2026-10-14 (the owner: "internationalise and add that blog
// on every language").
//
// ── WHY JSON (the owner, verbatim: "each element should be a list that is
// populated by a json"). The price list, the team and the opener's slides are
// typed .ts modules (fb-465), where `Record<Locale, …>` makes a missing
// translation a compile error. The posts carry five languages too, but they
// are a list the owner edits by hand, so they stay JSON — and what a .ts
// module would have checked while compiling, `parsePosts` checks while
// BUILDING: the import below is handed over as `unknown` on purpose, so
// nothing reaches a page unless it passed. A malformed entry — a language
// missing, a field misspelt — fails `next build` naming the post's number,
// its slug, the language and the field: never a card that renders
// "undefined", never a German page that quietly shows another language.
//
// ── THE FILE'S SHAPE: an array of posts, each with its FACTS once and its
// WORDS in every language — exactly these six keys:
//   slug     lower-case ASCII words joined by single dashes, unique, one for
//            every language: the article's address once articles exist
//            (/{locale}/blog/<slug>/); never "page", which the list's own
//            pages use (/{locale}/blog/page/2/)
//   date     the day it was published, YYYY-MM-DD, a real calendar day —
//            what orders the list; no card prints it since round 2
//   author   the name as it should read, one string for every language
//            („Dr. …")
//   image    { "src": "/images/…" } — the picture, one for every language
//   readingMinutes  how long the article takes to read, a whole number of
//            minutes from 1 to 60 — the card's „5 min de citit" (the owner,
//            2026-10-14: "on the left writes how long it takes to read")
//   words    exactly "ro", "en", "de", "fr" and "it" — the locale manifest's
//            five (src/i18n/locales.ts) — each with exactly these four keys:
//              title    the card's heading
//              summary  one or two sentences
//              tags     the categories, at most MAX_TAGS, possibly none — the
//                       cards show them as tags floating over the card's
//                       picture (sections/PostCard); every language lists
//                       the same categories in the same order
//                       (tests/unit/blog-data.test.ts holds it)
//              alt      the picture's description in that language — "" for
//                       a picture that only decorates the title beside it
// A key the reader does not know is refused too, so a typo („sumary") is a
// build error rather than a summary that silently vanished, and so is a sixth
// language the site does not route. Order in the file does not matter:
// `posts` is sorted by date, newest first, then by slug — the same order in
// every language, because the facts that order it are written once.
//
// ── PLACEHOLDERS — TODO(owner). The twelve posts in the file are Claude's
// drafts, written so the page can be seen: the Romanian on 2026-10-11, the
// English, German, French and Italian on 2026-10-14 — each a translation of
// the Romanian, in the register its message file speaks (en "you", de „Sie",
// fr « vous », it «tu», like ro „tu") and with the price list's names for the
// specialties (lib/prices). Ordinary dental-care topics, CMSR-clean in all
// five languages (tests/unit/cmsr-scan.test.ts reads every title, summary,
// tag and non-empty alt) and D-DASH-clean (tests/unit/blog-data.test.ts),
// illustrated with the clinic's three photographs and attributed to the
// clinic's real doctors. No article exists behind any of them. They are
// replaced — or their authors confirm them — before the blog is launched
// (BACKLOG.md entry 7). Four choices in the drafts, each the owner's to undo:
//   · no draft genders a doctor (lib/team's NOBODY IS GENDERED): where the
//     Romanian says „medicul", English and French say "your dentist" and
//     German and Italian say it impersonally;
//   · the AUTHOR is one string, „Dr. …" in every language, where lib/team
//     drops the point in French („Dr"), so a French card and that doctor's
//     page spell the honorific two ways;
//   · the French keep the narrow no-break space (U+202F) before „:" and „;",
//     as lib/reviews and lib/hero-slides do;
//   · the tags are lower case, the reference's look — but German's start
//     with a capital, as German writes its nouns („Mundhygiene";
//     tests/unit/blog-data.test.ts holds each language to its case).
// The pictures carry an EMPTY alt in every language (G2 a11y, 2026-10-14): a
// photograph of the waiting room illustrates no article, and its description
// read before every title — three descriptions cycling over twelve cards —
// was noise; a real post's picture gets an alt when it shows something its
// title does not. The reading times are placeholders too: no article exists
// to time. The day the articles' bodies land, the build can count each body's
// words instead (about 200 a minute) and that field can go — until then it is
// the one place the number lives.
//
// ── PAGES. POSTS_PER_PAGE is 6 — the owner's grid (2026-10-14): "i want 3 per
// row, max 6 items on a page, so 2 rows" (five, infiniswiss.com/blog's own
// count, until then). Page 1 is /{locale}/blog/ and page n is
// /{locale}/blog/page/n/, the same pages in every language, since every post
// is written in all five; `blogPagePath` is the one spelling, and the pages
// build every href from it through i18n/href's localeHref. `numberedPages` is
// what the /page/[page]/ route generates for each language — and it is never
// empty, because Next 16 refuses an empty `generateStaticParams` result under
// `output: 'export'` (its build error E1454): a blog of six posts or fewer has
// no page 2, so the route then generates page 1 again (/{locale}/blog/page/1/,
// linked from nowhere) instead of failing the build.

/** One language's words of a post, as the JSON file holds them. */
export type BlogPostWords = Readonly<{
  title: string;
  summary: string;
  tags: readonly string[];
  alt: string;
}>;

/** One post as the JSON file holds it once `parsePosts` has checked it: its facts once, its words in every language. */
export type BlogPostEntry = Readonly<{
  slug: string;
  date: IsoDate;
  author: string;
  image: Readonly<{ src: ImagePath }>;
  readingMinutes: number;
  words: Readonly<Record<Locale, BlogPostWords>>;
}>;

/**
 * One post in ONE language — what a list page shows (`postsIn`). No date: no
 * card prints one since round 2 (the owner's card lists none — CLAUDE.md
 * §15.39); the entry's `date` orders the list (`newestFirst`), and an article
 * page will read it off the entry.
 */
export type BlogPost = Readonly<{
  slug: string;
  title: string;
  summary: string;
  author: string;
  image: Readonly<{ src: ImagePath; alt: string }>;
  tags: readonly string[];
  readingMinutes: number;
}>;

/** Posts a page shows — the owner's two rows of three. */
export const POSTS_PER_PAGE = 6;

/** The longest reading time a post may claim, in minutes — a sanity bound on a hand-edited file. */
export const MAX_READING_MINUTES = 60;

/**
 * The most categories a post may list, in any language. Since round 2 they
 * float over the card's picture (the owner: "hovering above the image …
 * starting in the top right corner … expanding more to the left"), and the
 * chips scale with their card — 44px at the owner's 723px window, 29.3px tall
 * with a 12px label at their floor, on every narrow card — so even one to a
 * line, three of them end about 65px above the bottom of the narrowest
 * picture (266px wide, ≈177px tall; measured, sections/PostCard's THE TAGS).
 */
export const MAX_TAGS = 3;

/** Slugs the list's own addresses already use (/{locale}/blog/page/2/). */
const RESERVED_SLUGS: readonly string[] = ['page'];

const POST_KEYS = [
  'slug',
  'date',
  'author',
  'image',
  'readingMinutes',
  'words',
] as const;
const IMAGE_KEYS = ['src'] as const;
const WORD_KEYS = ['title', 'summary', 'tags', 'alt'] as const;

/** Lower-case ASCII words joined by single dashes. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A finished line of text: something in it and no stray space at either end. */
function isText(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.trim() === value
  );
}

/** The keys of `record` that `allowed` does not list, and the ones it lacks — each named as a `noun`. */
function keyProblems(
  record: Record<string, unknown>,
  allowed: readonly string[],
  noun = 'key',
): string[] {
  const unknown = Object.keys(record).filter((key) => !allowed.includes(key));
  const missing = allowed.filter((key) => !(key in record));
  return [
    ...(unknown.length > 0 ? [`unknown ${noun}(s) ${unknown.join(', ')}`] : []),
    ...(missing.length > 0 ? [`missing ${noun}(s) ${missing.join(', ')}`] : []),
  ];
}

/**
 * Checks the raw JSON and returns its posts, typed. Throws a TypeError naming
 * the post (its number in the file and, once known, its slug), the language
 * where there is one, and the field.
 */
export function parsePosts(
  input: unknown,
  source = 'src/content/blog/posts.json',
): readonly BlogPostEntry[] {
  if (!Array.isArray(input)) {
    throw new TypeError(`${source}: expected an array of posts`);
  }
  const seen = new Set<string>();

  return input.map((entry: unknown, index): BlogPostEntry => {
    let where = `${source}, post ${index + 1}`;
    // The EXPLICIT annotation is load-bearing: TypeScript treats a call as one
    // that never returns — and narrows after it — only when the callee is a
    // const with a declared type (G2 typescript, 2026-10-14). So every check
    // below narrows its field, and the post is built with no cast: deleting a
    // check is a compile error, never a field that slips through typed.
    const fail: (message: string) => never = (message) => {
      throw new TypeError(`${where}: ${message}`);
    };

    if (!isRecord(entry)) return fail('expected an object');
    // Name the post by its slug as early as the slug exists, so a key error
    // says which post too — even before the slug itself is checked.
    if (typeof entry.slug === 'string') where = `${where} („${entry.slug}")`;
    const keys = keyProblems(entry, POST_KEYS);
    if (keys.length > 0) {
      fail(`${keys.join('; ')} — a post has exactly ${POST_KEYS.join(', ')}`);
    }

    const { slug, date, author, image, readingMinutes, words } = entry;
    if (typeof slug !== 'string' || !SLUG.test(slug)) {
      return fail(
        `"slug" must be lower-case ASCII words joined by single dashes, got ${JSON.stringify(slug)}`,
      );
    }
    if (RESERVED_SLUGS.includes(slug)) {
      fail(`"slug" ${slug} is reserved for the list's own pages`);
    }
    if (seen.has(slug)) fail(`"slug" ${slug} is used by an earlier post`);
    seen.add(slug);

    if (typeof date !== 'string' || !isIsoDate(date)) {
      fail(
        `"date" must be a real day spelled YYYY-MM-DD, got ${JSON.stringify(date)}`,
      );
    }
    if (!isText(author)) fail('"author" must be non-empty text, trimmed');

    if (!isRecord(image)) return fail('"image" must be an object { src }');
    const imageKeys = keyProblems(image, IMAGE_KEYS);
    if (imageKeys.length > 0) fail(`"image": ${imageKeys.join('; ')}`);
    const { src } = image;
    if (typeof src !== 'string' || !isImagePath(src)) {
      fail(
        `"image.src" must be a path under /images/, got ${JSON.stringify(src)}`,
      );
    }

    if (
      typeof readingMinutes !== 'number' ||
      !Number.isInteger(readingMinutes) ||
      readingMinutes < 1 ||
      readingMinutes > MAX_READING_MINUTES
    ) {
      fail(
        `"readingMinutes" must be a whole number of minutes from 1 to ${MAX_READING_MINUTES}, got ${JSON.stringify(readingMinutes)}`,
      );
    }

    if (!isRecord(words)) {
      return fail(`"words" must be an object { ${locales.join(', ')} }`);
    }
    const languages = keyProblems(words, locales, 'language');
    if (languages.length > 0) {
      fail(
        `"words": ${languages.join('; ')} — a post is written in exactly ${locales.join(', ')}`,
      );
    }

    /** One language's words, checked — every message names the language. */
    const wordsIn = (locale: Locale): BlogPostWords => {
      const field = `"words.${locale}`;
      const block = words[locale];
      if (!isRecord(block)) {
        return fail(`${field}" must be an object { ${WORD_KEYS.join(', ')} }`);
      }
      const blockKeys = keyProblems(block, WORD_KEYS);
      if (blockKeys.length > 0) fail(`${field}": ${blockKeys.join('; ')}`);
      const { title, summary, tags, alt } = block;
      if (!isText(title)) {
        fail(`${field}.title" must be non-empty text, trimmed`);
      }
      if (!isText(summary)) {
        fail(`${field}.summary" must be non-empty text, trimmed`);
      }
      if (!Array.isArray(tags)) {
        return fail(`${field}.tags" must be an array of text`);
      }
      // `Array.isArray` narrows an `unknown` to `any[]`, which TypeScript
      // would hand on as `readonly string[]` with no check at all — so the
      // list is typed `readonly unknown[]` first, and only `every(isText)`
      // below makes it `readonly string[]`: deleting that check is a compile
      // error, like deleting any other (the `fail` note; G2 typescript,
      // 2026-10-14).
      const list: readonly unknown[] = tags;
      if (!list.every(isText)) {
        fail(`${field}.tags": every tag must be non-empty text, trimmed`);
      }
      if (new Set(list).size !== list.length) {
        fail(`${field}.tags": a tag is listed twice`);
      }
      if (list.length > MAX_TAGS) {
        fail(
          `${field}.tags": at most ${MAX_TAGS} tags — they float over the card's picture — got ${list.length}`,
        );
      }
      if (typeof alt !== 'string' || alt.trim() !== alt) {
        fail(
          `${field}.alt" must be text, trimmed ("" for a decorative picture)`,
        );
      }
      return { title, summary, tags: list, alt };
    };

    // Every field is narrowed by its check above — no cast (the `fail` note).
    // The languages are spelled out one by one, in the manifest's order: the
    // `Record<Locale, …>` type then refuses a sixth locale added to the
    // manifest until it is read here too, and no cast builds the record.
    return {
      slug,
      date,
      author,
      image: { src },
      readingMinutes,
      words: {
        ro: wordsIn('ro'),
        en: wordsIn('en'),
        de: wordsIn('de'),
        fr: wordsIn('fr'),
        it: wordsIn('it'),
      },
    };
  });
}

/** A picture path under public/images/ — the guard that narrows to ImagePath. */
function isImagePath(value: string): value is ImagePath {
  return value.startsWith('/images/');
}

/** Newest first; posts of the same day by slug, so the order never depends on the file's. */
export function newestFirst(
  list: readonly BlogPostEntry[],
): readonly BlogPostEntry[] {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.slug === b.slug) return 0;
    return a.slug < b.slug ? -1 : 1;
  });
}

/** Every post the blog has, checked and sorted — its facts once, its words in every language. */
export const posts: readonly BlogPostEntry[] = newestFirst(
  parsePosts(raw as unknown),
);

/**
 * The posts in ONE language, in the list's order (newest first for `posts`):
 * each post's facts with that language's words — the list a locale's pages
 * cut into pages (`postsOnPage`).
 */
export function postsIn(
  locale: Locale,
  list: readonly BlogPostEntry[] = posts,
): readonly BlogPost[] {
  return list.map((entry) => {
    const { title, summary, tags, alt } = entry.words[locale];
    return {
      slug: entry.slug,
      title,
      summary,
      author: entry.author,
      image: { src: entry.image.src, alt },
      tags,
      readingMinutes: entry.readingMinutes,
    };
  });
}

function assertWhole(name: string, value: number, min: number): void {
  if (!Number.isInteger(value) || value < min) {
    throw new RangeError(
      `${name} must be a whole number ≥ ${min}, got ${value}`,
    );
  }
}

/**
 * How many pages `total` posts fill — at least one, so an empty blog still
 * has its page 1. The same in every language: every post is written in all
 * five.
 */
export function pageCount(
  total: number = posts.length,
  perPage: number = POSTS_PER_PAGE,
): number {
  assertWhole('total', total, 0);
  assertWhole('perPage', perPage, 1);
  return Math.max(1, Math.ceil(total / perPage));
}

/** The items page `page` shows (1-based) — of any list. Throws for a page the list does not have. */
export function postsOnPage<T>(
  page: number,
  list: readonly T[],
  perPage: number = POSTS_PER_PAGE,
): readonly T[] {
  const count = pageCount(list.length, perPage);
  if (!Number.isInteger(page) || page < 1 || page > count) {
    throw new RangeError(
      `page ${page} does not exist — the blog has ${count} page(s)`,
    );
  }
  return list.slice((page - 1) * perPage, page * perPage);
}

/**
 * The page numbers /blog/page/[page]/ generates in each language: 2 to the
 * last page — or [1] when there is only one page, because the export refuses
 * an empty list (the header's PAGES paragraph).
 */
export function numberedPages(
  total: number = posts.length,
  perPage: number = POSTS_PER_PAGE,
): readonly number[] {
  const count = pageCount(total, perPage);
  return count === 1
    ? [1]
    : Array.from({ length: count - 1 }, (_, index) => index + 2);
}

/** Page n's path under the locale prefix: 1 → /blog, n → /blog/page/n. */
export function blogPagePath(page: number): `/${string}` {
  assertWhole('page', page, 1);
  return page === 1 ? '/blog' : `/blog/page/${page}`;
}

/** The route's [page] segment as a number: "2" → 2. Refuses "02", "0", "2.0", "x". */
export function parsePageParam(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new RangeError(`"${value}" is not a page number`);
  }
  return Number(value);
}
