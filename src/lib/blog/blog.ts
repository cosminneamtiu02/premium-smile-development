import raw from '../../content/blog/posts.json';
import type { Locale } from '../../i18n/locales';
import type { ImagePath } from '../image-path/image-path';
import { isIsoDate, type IsoDate } from '../time-ago/time-ago';

// lib/blog — THE BLOG'S POSTS: read from one JSON file, checked once, sorted
// newest first and cut into pages. React-free DATA (CLAUDE.md §4's foundation
// ring): the blog pages populate sections/PostList from it, and nothing in ui/
// may import it. Built on the blog branch (CLAUDE.md §15.39), 2026-10-11.
//
// ── WHY JSON (the owner, verbatim: "each element should be a list that is
// populated by a json"). The price list and the team are typed .ts modules
// (fb-465), because every row of theirs carries five languages and a missing
// translation must be a compile error. A post is ROMANIAN ONLY (§5), so a
// plain list the owner edits by hand is the right tool — and what a .ts module
// would have checked while compiling, `parsePosts` checks while BUILDING: the
// import below is handed over as `unknown` on purpose, so nothing reaches a
// page unless it passed. A malformed entry fails `next build` naming the
// post's number, its slug and the field — never a card that renders
// "undefined".
//
// ── THE FILE'S SHAPE: an array of posts, each with exactly these seven keys —
//   slug     lower-case ASCII words joined by single dashes, unique: the
//            article's address once articles exist (/ro/blog/<slug>/); never
//            "page", which the list's own pages use (/ro/blog/page/2/)
//   title    the card's heading
//   summary  one or two sentences
//   date     the day it was published, YYYY-MM-DD, a real calendar day
//   author   the name as it should read („Dr. …")
//   image    { "src": "/images/…", "alt": "…" } — alt may be "" for a picture
//            that only decorates the title beside it
//   tags     the categories, possibly none — the cards show them as the price
//            strip's resting pill (sections/PostCard)
// A key the reader does not know is refused too, so a typo („sumary") is a
// build error rather than a summary that silently vanished. Order in the file
// does not matter: `posts` is sorted by date, newest first, then by slug.
//
// ── PLACEHOLDERS — TODO(owner). The twelve posts in the file are Claude's
// drafts, written so the page can be seen (2026-10-11): ordinary dental-care
// topics, CMSR-clean (tests/unit/cmsr-scan.test.ts reads every title, summary,
// tag and non-empty alt), illustrated with the clinic's three photographs and
// attributed to the clinic's real doctors. No article exists behind any of
// them. They are replaced — or their authors confirm them — before the blog
// is launched (BACKLOG.md entry 7). Their pictures carry an EMPTY alt (G2
// a11y, 2026-10-14): a photograph of the waiting room illustrates no article,
// and its description read before every title — three descriptions cycling
// over twelve cards — was noise; a real post's picture gets an alt when it
// shows something its title does not.
//
// ── PAGES. POSTS_PER_PAGE is 5, the reference's own count (infiniswiss.com/
// blog shows five a page). Page 1 is /ro/blog/ and page n is /ro/blog/page/n/;
// `blogPagePath` is the one spelling, and the pages build every href from it
// through i18n/href's localeHref. `numberedPages` is what the /page/[page]/
// route generates — and it is never empty, because Next 16 refuses an empty
// `generateStaticParams` result under `output: 'export'` (its build error
// E1454): a blog of five posts or fewer has no page 2, so the route then
// generates page 1 again (/ro/blog/page/1/, linked from nowhere) instead of
// failing the build.

/** One post, as the JSON file holds it once `parsePosts` has checked it. */
export type BlogPost = Readonly<{
  slug: string;
  title: string;
  summary: string;
  date: IsoDate;
  author: string;
  image: Readonly<{ src: ImagePath; alt: string }>;
  tags: readonly string[];
}>;

/**
 * The one language the blog is written in (§5). lib/routes' blog row says the
 * same thing for the navigation; blog.test.ts holds the two equal.
 */
export const BLOG_LOCALE = 'ro' as const satisfies Locale;

/** Posts a page shows — the reference's five. */
export const POSTS_PER_PAGE = 5;

/** Slugs the list's own addresses already use (/ro/blog/page/2/). */
export const RESERVED_SLUGS: readonly string[] = ['page'];

const POST_KEYS = [
  'slug',
  'title',
  'summary',
  'date',
  'author',
  'image',
  'tags',
] as const;
const IMAGE_KEYS = ['src', 'alt'] as const;

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

/** The keys of `record` that `allowed` does not list, and the ones it lacks. */
function keyProblems(
  record: Record<string, unknown>,
  allowed: readonly string[],
): string[] {
  const unknown = Object.keys(record).filter((key) => !allowed.includes(key));
  const missing = allowed.filter((key) => !(key in record));
  return [
    ...(unknown.length > 0 ? [`unknown key(s) ${unknown.join(', ')}`] : []),
    ...(missing.length > 0 ? [`missing key(s) ${missing.join(', ')}`] : []),
  ];
}

/**
 * Checks the raw JSON and returns its posts, typed. Throws a TypeError naming
 * the post (its number in the file and, once known, its slug) and the field.
 */
export function parsePosts(
  input: unknown,
  source = 'src/content/blog/posts.json',
): readonly BlogPost[] {
  if (!Array.isArray(input)) {
    throw new TypeError(`${source}: expected an array of posts`);
  }
  const seen = new Set<string>();

  return input.map((entry: unknown, index): BlogPost => {
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

    const { slug, title, summary, date, author, image, tags } = entry;
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

    if (!isText(title)) fail('"title" must be non-empty text, trimmed');
    if (!isText(summary)) fail('"summary" must be non-empty text, trimmed');
    if (!isText(author)) fail('"author" must be non-empty text, trimmed');
    if (typeof date !== 'string' || !isIsoDate(date)) {
      fail(
        `"date" must be a real day spelled YYYY-MM-DD, got ${JSON.stringify(date)}`,
      );
    }

    if (!isRecord(image)) return fail('"image" must be an object { src, alt }');
    const imageKeys = keyProblems(image, IMAGE_KEYS);
    if (imageKeys.length > 0) fail(`"image": ${imageKeys.join('; ')}`);
    const { src, alt } = image;
    if (typeof src !== 'string' || !isImagePath(src)) {
      fail(
        `"image.src" must be a path under /images/, got ${JSON.stringify(src)}`,
      );
    }
    if (typeof alt !== 'string' || alt.trim() !== alt) {
      fail('"image.alt" must be text, trimmed ("" for a decorative picture)');
    }

    if (!Array.isArray(tags)) return fail('"tags" must be an array of text');
    if (!tags.every(isText)) fail('every tag must be non-empty text, trimmed');
    if (new Set(tags).size !== tags.length) fail('a tag is listed twice');

    // Every field is narrowed by its check above — no cast (the `fail` note).
    return { slug, title, summary, date, author, image: { src, alt }, tags };
  });
}

/** A picture path under public/images/ — the guard that narrows to ImagePath. */
function isImagePath(value: string): value is ImagePath {
  return value.startsWith('/images/');
}

/** Newest first; posts of the same day by slug, so the order never depends on the file's. */
export function newestFirst(list: readonly BlogPost[]): readonly BlogPost[] {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.slug === b.slug) return 0;
    return a.slug < b.slug ? -1 : 1;
  });
}

/** Every post the blog shows, checked and sorted — the list the pages cut into pages. */
export const posts: readonly BlogPost[] = newestFirst(
  parsePosts(raw as unknown),
);

function assertWhole(name: string, value: number, min: number): void {
  if (!Number.isInteger(value) || value < min) {
    throw new RangeError(
      `${name} must be a whole number ≥ ${min}, got ${value}`,
    );
  }
}

/** How many pages `total` posts fill — at least one, so an empty blog still has its page 1. */
export function pageCount(
  total: number = posts.length,
  perPage: number = POSTS_PER_PAGE,
): number {
  assertWhole('total', total, 0);
  assertWhole('perPage', perPage, 1);
  return Math.max(1, Math.ceil(total / perPage));
}

/** The posts page `page` shows (1-based). Throws for a page the list does not have. */
export function postsOnPage(
  page: number,
  list: readonly BlogPost[] = posts,
  perPage: number = POSTS_PER_PAGE,
): readonly BlogPost[] {
  const count = pageCount(list.length, perPage);
  if (!Number.isInteger(page) || page < 1 || page > count) {
    throw new RangeError(
      `page ${page} does not exist — the blog has ${count} page(s)`,
    );
  }
  return list.slice((page - 1) * perPage, page * perPage);
}

/**
 * The page numbers /blog/page/[page]/ generates: 2 to the last page — or [1]
 * when there is only one page, because the export refuses an empty list (the
 * header's PAGES paragraph).
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
