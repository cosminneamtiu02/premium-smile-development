import raw from '../../content/blog/posts.json';
import { locales, type Locale } from '../../i18n/locales';
import type { ImagePath } from '../image-path/image-path';
import { isImagePath, isRecord, keyProblems } from '../json-shape/json-shape';
import { isIsoDate, type IsoDate } from '../time-ago/time-ago';
import {
  hasVisibleLetter,
  hasVisibleWord,
  isFinishedText,
  spelled,
  whyUnfinished,
  type FinishedText,
} from '../visible-text/visible-text';

// lib/blog — THE BLOG'S POSTS: read from one JSON file, checked once, sorted
// newest first and cut into pages, in each of the site's five languages.
// React-free DATA (CLAUDE.md §4's foundation ring), read by three populators:
// the list pages' (app/[locale]/blog/populate.ts, for sections/PostList),
// Home's (app/[locale]/(home)/populate.ts, for sections/BlogCarousel — the
// list's own cards) and the article page's
// (app/[locale]/blog/[slug]/populate.ts, for sections/PostPage: its post's
// words and picture beside lib/blog-article's body, and its date for the
// link preview alone; lib/blog-article reads `posts` too) — and by the
// numbered list pages' route (app/[locale]/blog/page/[page]/page.tsx:
// `numberedPages`, `parsePageParam`). Nothing in ui/ may import it. Built on the blog branch
// (CLAUDE.md §15.39), 2026-10-11, in Romanian; in every language since
// round 3, 2026-10-14 (the owner: "internationalise and add that blog on
// every language").
//
// ── READ ON THE SERVER ONLY (G2, 2026-10-20). The populators and the route
// run at build and hand their sections finished strings, so no visitor's JavaScript
// carries a post: none of src's 24 'use client' modules reaches this file,
// directly or through another (walked import by import, 2026-10-20), and the
// review found no post's title in any client chunk of the export. It
// matters: `posts` below is a CALL made when the module loads,
// `newestFirst(parsePosts(raw))`, which no bundler may drop, so an island
// that imports anything from here, `articlePath` alone, ships the whole
// five-language posts.json with it: a bundle of that one import measured
// 24.2 KiB minified, 9.3 KiB gzipped (esbuild, 2026-10-21), most of it the
// posts, and it grows with every post. ENFORCED since 2026-10-20 by
// §15.40's client-import fence, widened to the blog's data
// (tests/unit/lib-react-free.test.ts since 2026-10-21, "the islands never
// import the site’s data"): it refuses a VALUE import of this module from
// any module the client bundles — the fence walks the client graph from
// every 'use client' file, following imports at any depth. The lever, the
// day an island needs a path: move the helpers that hold no data
// (`blogPagePath`, `articlePath`, `parsePageParam`) into a module that
// imports no JSON.
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
//            every language: the address of the post's OWN article
//            (/{locale}/blog/<slug>/, `articlePath`), which its card opens
//            once that article exists; until then the card opens the
//            stand-in's (lib/blog-article's `articleSlugFor`, THE STAND-IN);
//            never "page", which the list's own pages use
//            (/{locale}/blog/page/2/)
//   date     the day it was published, YYYY-MM-DD, a real calendar day —
//            what orders the list; no card prints it since round 2, and the
//            article page names it in its link preview alone (Open Graph's
//            publication time, `articlePreview`'s `publishedTime`)
//   author   the doctor's name as lib/team spells it in Romanian, one string
//            for every language („Dr. …"): the KEY lib/blog-article's
//            `articleAuthor` finds the doctor by, never printed; the cards
//            and the article page print the name as lib/team spells it in
//            THEIR language — French writes „Dr", with no point
//            (lib/blog-article's THE AUTHOR)
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
//                       a picture that only decorates the title beside it,
//                       else words that describe it (THE TEXTS, below)
// A key the reader does not know is refused too, so a typo („sumary") is a
// build error rather than a summary that silently vanished, and so is a sixth
// language the site does not route.
// THE TEXTS: the author, every title, summary and tag is FINISHED text —
// well-formed, something a reader sees, with no white space at either end
// (lib/visible-text's `isFinishedText`): a zero-width space, a soft hyphen
// or a Hangul filler alone shows nothing, and trimming keeps every one of
// them; a lone surrogate, which a JSON escape can write, is refused since
// round 2 of that module's review (2026-10-21), as the page would print
// U+FFFD for it. A title and every tag is a LABEL, so it also holds a letter
// or a digit that shows (`hasVisibleWord`): a title of „." or a tag of „🦷"
// names nothing (SC 2.4.6; round 1 of lib/visible-text's review, 2026-10-21).
// An alt is "" — a decorative picture — or finished text holding a LETTER
// that shows (`hasVisibleLetter`, lib/blog-article's `parseAlt` rule with the
// decorative exception): until that review a non-empty alt was asked only to
// be trimmed, so „.", „-", „2" or a zero-width space passed as a described
// picture, a picture named by nothing on the cover, on every card and in the
// link preview's `og:image:alt` — latent, since every cover's alt is "". The
// rule is `isPostAlt`, exported since round 2 of that review (2026-10-21) so
// that tests/unit/blog-data.test.ts asks it rather than spelling it again.
// Each refusal says which condition failed and quotes its value with every
// invisible character spelled by its code point (`whyUnfinished`,
// `spelled`) — since round 2 every refusal: a key the reader does not know
// (lib/json-shape's `keyProblems`), a slug, a date, a picture's path, a
// reading time, a tag listed twice, and the slug that names the post in
// every message. Order in the file does not matter:
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
// clinic's real doctors. ONE of them has its article: „Cum îți alegi periuța
// de dinți" (cum-iti-alegi-periuta-de-dinti, the newest), written in all five
// languages in src/content/blog/articles/ (lib/blog-article), itself a
// draft. And EVERY card links to that article, on the list and in Home's
// articles band, the other eleven posts' cards too: a post with no article
// of its own opens it as the stand-in (lib/blog-article's `articleSlugFor`,
// THE STAND-IN, the owner's "dummy" of 2026-10-15), so eleven cards, each
// named for its own post, open another post's article — an SC 2.4.4
// mismatch until each post has its own. Before the blog is launched the
// posts are replaced, or their authors confirm them, and every post gets its
// article or the stand-in leaves (BACKLOG.md entry 7, which records the
// mismatch too). Three choices in the drafts, each the owner's to undo:
//   · no draft genders a doctor (lib/team's NOBODY IS GENDERED): where the
//     Romanian says „medicul", English and French say "your dentist" and
//     German and Italian say it impersonally;
//   · the French keep the narrow no-break space (U+202F) before „:" and „;",
//     as lib/reviews and lib/hero-slides do;
//   · the tags are lower case, the reference's look — but German's start
//     with a capital, as German writes its nouns („Mundhygiene"), and an
//     acronym keeps its capitals in every language („3D", „ATM";
//     tests/unit/blog-data.test.ts holds each language to its case).
// The pictures carry an EMPTY alt in every language (G2 a11y, 2026-10-14): a
// photograph of the waiting room illustrates no article, and its description
// read before every title — three descriptions cycling over twelve cards —
// was noise; a real post's picture gets an alt when it shows something its
// title does not. THE READING TIMES: the one post with an article has its
// minutes MEASURED, 4 — lib/blog-article counts an article's words at 200 a
// minute (`readingMinutes`, its READING TIME), and
// tests/unit/blog-article-data.test.ts holds the post's field to that count,
// equal in Romanian and within one minute in the four other languages, so an
// edit that moves the article's count fails CI until the field follows. The
// other eleven posts' minutes are still placeholders, with no article of
// their own to count. The field stays even so: it is the one number a card
// and its article page both print (lib/blog-article's READING TIME), and the
// count holds it to the article rather than replacing it — for a post with
// its own article; a stand-in card prints its own post's placeholder and
// opens a page that prints 4 (BACKLOG.md entry 7).
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
 * §15.39); the entry's `date` orders the list (`newestFirst`), and the
 * article page reads it off the entry for its link preview
 * (`articlePreview`'s `publishedTime`, app/[locale]/blog/[slug]/populate.ts).
 */
export type BlogPost = Readonly<{
  slug: string;
  title: string;
  summary: string;
  /**
   * The post's one `author` string, the same in every language: the doctor's
   * name as lib/team spells it in ROMANIAN („Dr. Nicu Elena Alina"). It is
   * the KEY lib/blog-article's `articleAuthor` finds the doctor by, and no
   * page prints it: the cards and the article page print
   * `articleAuthor(post).words[locale].name`, lib/team's spelling in the
   * page's language (app/[locale]/blog/populate.ts), which drops the
   * honorific's point in French („Dr Nicu Elena Alina"). Printed as it is,
   * a French card would say „Dr." above an article signed „Dr".
   */
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
 * On Home's 65 % miniature cards (sections/BlogCarousel) the chips are
 * smaller still — 7.8px labels on chips about 19px tall over a picture
 * 146.5px wide, ≈98px tall (PostCard's THE SMALLEST TEXT) — and the same
 * stack, scaled, still ends about 25px above that picture's bottom.
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

/**
 * THE TEXTS' rule for a post's picture (the header): "" for a picture that
 * only decorates the title beside it, or words that describe it — finished
 * text (lib/visible-text's `isFinishedText`) holding a letter that shows
 * (`hasVisibleLetter`). A type guard onto `'' | FinishedText`, whose false
 * branch narrows nothing, the brand's way (lib/visible-text's FINISHED TEXT).
 */
export function isPostAlt(value: unknown): value is '' | FinishedText {
  return value === '' || (isFinishedText(value) && hasVisibleLetter(value));
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
    // says which post too — even before the slug itself is checked; quoted
    // `spelled`, since an unchecked slug may hold what a reader would not see.
    if (typeof entry.slug === 'string') {
      where = `${where} (${spelled(entry.slug)})`;
    }
    const keys = keyProblems(entry, POST_KEYS);
    if (keys.length > 0) {
      fail(`${keys.join('; ')} — a post has exactly ${POST_KEYS.join(', ')}`);
    }

    const { slug, date, author, image, readingMinutes, words } = entry;
    if (typeof slug !== 'string' || !SLUG.test(slug)) {
      return fail(
        `"slug" must be lower-case ASCII words joined by single dashes, got ${spelled(slug)}`,
      );
    }
    if (RESERVED_SLUGS.includes(slug)) {
      fail(`"slug" ${spelled(slug)} is reserved for the list's own pages`);
    }
    if (seen.has(slug)) {
      fail(`"slug" ${spelled(slug)} is used by an earlier post`);
    }
    seen.add(slug);

    if (typeof date !== 'string' || !isIsoDate(date)) {
      fail(
        `"date" must be a real day spelled YYYY-MM-DD, got ${spelled(date)}`,
      );
    }
    if (!isFinishedText(author)) {
      fail(`"author" must be visible text, trimmed: ${whyUnfinished(author)}`);
    }

    if (!isRecord(image)) return fail('"image" must be an object { src }');
    const imageKeys = keyProblems(image, IMAGE_KEYS);
    if (imageKeys.length > 0) fail(`"image": ${imageKeys.join('; ')}`);
    const { src } = image;
    if (typeof src !== 'string' || !isImagePath(src)) {
      fail(`"image.src" must be a path under /images/, got ${spelled(src)}`);
    }

    if (
      typeof readingMinutes !== 'number' ||
      !Number.isInteger(readingMinutes) ||
      readingMinutes < 1 ||
      readingMinutes > MAX_READING_MINUTES
    ) {
      fail(
        `"readingMinutes" must be a whole number of minutes from 1 to ${MAX_READING_MINUTES}, got ${spelled(readingMinutes)}`,
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
      if (!isFinishedText(title)) {
        fail(
          `${field}.title" must be visible text, trimmed: ${whyUnfinished(title)}`,
        );
      }
      if (!hasVisibleWord(title)) {
        fail(
          `${field}.title" names nothing: it holds no letter or digit that shows, got ${spelled(title)} — a title of marks alone is a heading with no name`,
        );
      }
      if (!isFinishedText(summary)) {
        fail(
          `${field}.summary" must be visible text, trimmed: ${whyUnfinished(summary)}`,
        );
      }
      if (!Array.isArray(tags)) {
        return fail(
          `${field}.tags" must be an array of text, got ${spelled(tags)}`,
        );
      }
      // `Array.isArray` narrows an `unknown` to `any[]`, which TypeScript
      // would hand on as `readonly string[]` with no check at all — so the
      // list is typed `readonly unknown[]` first, and only
      // `every(isFinishedText)` below makes it `readonly FinishedText[]`, a
      // `readonly string[]`: deleting that check is a compile error, like
      // deleting any other (the `fail` note; G2 typescript, 2026-10-14).
      const list: readonly unknown[] = tags;
      if (!list.every(isFinishedText)) {
        const at = list.findIndex((tag) => !isFinishedText(tag));
        fail(
          `${field}.tags": every tag must be visible text, trimmed — tag ${at + 1}: ${whyUnfinished(list[at])}`,
        );
      }
      const wordless = list.findIndex((tag) => !hasVisibleWord(tag));
      if (wordless >= 0) {
        fail(
          `${field}.tags": tag ${wordless + 1} names nothing: it holds no letter or digit that shows, got ${spelled(list[wordless])} — a chip of marks alone is a label with no name`,
        );
      }
      const twice = list.findIndex((tag, at) => list.indexOf(tag) !== at);
      if (twice >= 0) {
        fail(
          `${field}.tags": the tag ${spelled(list[twice])} is listed twice (tags ${list.indexOf(list[twice]) + 1} and ${twice + 1})`,
        );
      }
      if (list.length > MAX_TAGS) {
        fail(
          `${field}.tags": at most ${MAX_TAGS} tags — they float over the card's picture — got ${list.length}`,
        );
      }
      // THE TEXTS: "" for a decorative picture, or words that describe it.
      if (!isPostAlt(alt)) {
        fail(
          `${field}.alt" must be "" for a picture that only decorates the title beside it, or words that describe it — visible text, trimmed, holding a letter that shows: ${whyUnfinished(alt) ?? `it holds no letter that shows, got ${spelled(alt)}`}`,
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
 * ONE post in ONE language: the entry's facts with that language's words —
 * what `postsIn` makes of every entry of a list, and what the article page
 * makes of the one entry it is for (`articlePost` and `articlePreview`,
 * app/[locale]/blog/[slug]/populate.ts), so a post reads the same on its card
 * and on its page.
 */
export function postIn(locale: Locale, entry: BlogPostEntry): BlogPost {
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
}

/**
 * The posts in ONE language, in the list's order (newest first for `posts`):
 * each post's facts with that language's words (`postIn`, entry by entry) —
 * the list a locale's pages cut into pages (`postsOnPage`).
 */
export function postsIn(
  locale: Locale,
  list: readonly BlogPostEntry[] = posts,
): readonly BlogPost[] {
  return list.map((entry) => postIn(locale, entry));
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

/**
 * An article's path under the locale prefix: a slug → /blog/<slug>, the one
 * spelling of an article's address. The cards, the list's and Home's, link
 * to the article lib/blog-article's `articleSlugFor` picks for their post,
 * which is the post's own once that exists and the stand-in until then
 * (lib/blog-article's THE STAND-IN); and the article page builds its own
 * address from it, the one its share links carry, its copy control copies
 * and its link preview names (`articleUrl`,
 * app/[locale]/blog/[slug]/populate.ts).
 *
 * Throws a RangeError for a slug no post could carry (the header's slug
 * rule, "page" included) and for anything that is not a string, which
 * `RegExp.prototype.test` would read as text, `undefined` as the word
 * "undefined". The message names the value as lib/visible-text's `spelled`
 * writes it — a string in double quotes, a line break and every character a
 * reader would not see by its code point, so the message stays on one line;
 * any other value by its type, never by running its code (`<bigint>`,
 * `<object>`, `<symbol>`), so the error is always this RangeError.
 */
export function articlePath(slug: string): `/blog/${string}` {
  if (
    typeof slug !== 'string' ||
    !SLUG.test(slug) ||
    RESERVED_SLUGS.includes(slug)
  ) {
    throw new RangeError(`${spelled(slug)} is not a post's slug`);
  }
  return `/blog/${slug}`;
}

/** The route's [page] segment as a number: "2" → 2. Refuses "02", "0", "2.0", "x". */
export function parsePageParam(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new RangeError(`${spelled(value)} is not a page number`);
  }
  return Number(value);
}
