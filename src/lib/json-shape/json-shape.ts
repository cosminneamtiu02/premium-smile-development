import type { ImagePath } from '../image-path/image-path';
import { spelled } from '../visible-text/visible-text';

// lib/json-shape — THE BLOG JSON'S SHAPE CHECKS: the three questions the
// blog's two build-time readers ask of a value parsed from a JSON file before
// they ask anything of its words — is it a RECORD (`isRecord`), which of its
// keys does a reader not know and which does it miss (`keyProblems`), is it a
// picture's PATH (`isImagePath`). React-free MECHANICS (CLAUDE.md §4's
// foundation ring, fenced by tests/unit/lib-react-free.test.ts): pure
// functions, no DOM, no data. Built on the article page's lane (CLAUDE.md
// §15.39 round 4) on 2026-10-21, round 2 of lib/visible-text's review.
//
// ── WHY A MODULE (§4's sharing table, its first row: identical MECHANICS, a
// second consumer — extract to the nearest tier both may import). lib/blog
// reads src/content/blog/posts.json and lib/blog-article every article's
// JSON, and until this module each held its own byte-identical copy of the
// three, pinned to the other by a test that read both files through the
// TypeScript compiler (tests/unit/blog-parsers-sync.test.ts, deleted with
// the copies). The table's second row — a KEEP-IN-SYNC pair, one side pinned
// — is for VALUES that must agree while their files stay apart, never for
// mechanics a module can hold once. A fourth copy, `isText`, had already
// left for lib/visible-text as its `isFinishedText` in round 1; these three
// are no question of what a text SHOWS, so they have a module of their own.
// `isImagePath` lives here rather than in lib/image-path, whose charter is a
// TYPE alone (`ImagePath`, imported type-only everywhere): a guard is code.
//
// ── ITS READERS: lib/blog's `parsePosts` and lib/blog-article's
// `parseArticle`, both at BUILD (their errors fail `next build`). Not
// adopted, recorded: sections/PostGallery's captions test keeps its own
// `isRecord` arrow — a test's reading of the raw article file, its shape and
// nothing else — the day it is touched.
//
// ── THE KEYS ARE QUOTED (round 2 of lib/visible-text's review, the three
// reviewers): `keyProblems` names each key it lists by lib/visible-text's
// `spelled`, in double quotes, every character a reader would not see by its
// code point — so a key the file misspells with a character drawn as
// nothing, `"title"` and a zero-width space, is listed as `"title\u{200B}"`
// beside the missing `"title"`, never as the very key it misses.

/** A plain object — a JSON object, never null and never an array. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The keys of `record` that `allowed` does not list, and the ones it lacks —
 * each named as a `noun` („key", „language") and quoted `spelled` (the
 * header's THE KEYS ARE QUOTED): `unknown key(s) "sumary"`, `missing key(s)
 * "summary"`. Empty when `record` holds exactly `allowed`.
 */
export function keyProblems(
  record: Record<string, unknown>,
  allowed: readonly string[],
  noun = 'key',
): string[] {
  const unknown = Object.keys(record).filter((key) => !allowed.includes(key));
  const missing = allowed.filter((key) => !(key in record));
  const listed = (keys: readonly string[]): string =>
    keys.map((key) => spelled(key)).join(', ');
  return [
    ...(unknown.length > 0 ? [`unknown ${noun}(s) ${listed(unknown)}`] : []),
    ...(missing.length > 0 ? [`missing ${noun}(s) ${listed(missing)}`] : []),
  ];
}

/** A picture path under public/images/ — the guard that narrows to ImagePath. */
export function isImagePath(value: string): value is ImagePath {
  return value.startsWith('/images/');
}
