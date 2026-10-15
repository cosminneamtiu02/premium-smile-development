import type { PostListProps } from '@/components/sections/PostList/PostList';
import { localeHref } from '@/i18n/href';
import type { Locale } from '@/i18n/locales';
import {
  blogPagePath,
  pageCount,
  posts as SITE_POSTS,
  postsIn,
  postsOnPage,
  type BlogPostEntry,
} from '@/lib/blog/blog';

// app/[locale]/blog/populate.ts — THE ONE POPULATOR of the blog's list pages
// (/{locale}/blog/ is page 1, /{locale}/blog/page/n/ is page n — CLAUDE.md
// §15.39, in every language since round 3): the page's language, lib/blog's
// posts and the page's finished words in, sections/PostList's props out. PURE
// — no next-intl, no React, the team folder's populate.ts precedent: the two
// route pages call it with the language and the words `getTranslations` gives
// them (./words.ts), and the Pages/Blog twin calls it with the ones
// `useLocale` and `useTranslations` give it, so the twin can never walk the
// posts its own way.
//
// What it decides: each post in the page's language (lib/blog's `postsIn` —
// the facts written once, that language's title, summary, tags and alt), its
// reading time in the blog's words („5 min de citit", from the post's
// `readingMinutes` through ICU), the pager's two links — the previous page's
// and the next page's, absent at the two ends, which is how
// sections/Pagination knows to draw a disabled control — and the counter's
// sentence. Every href goes through i18n/href's localeHref under the page's
// own language, so a German page's pager stays in German, and the interim
// host's base path and the trailing slash are the site's own (§15.13), never
// spelled here. A post's DATE is not printed (round 2, the owner's card lists
// none — CLAUDE.md §15.39): lib/blog still orders the list by it.

/** Every word of a list page that is not a post's — finished, except the two that need a number. */
export type BlogPageWords = Readonly<{
  /**
   * The hero's heading — the page's <h1>. It carries the copy's own LINE
   * BREAKS, one `\n` where the stairway turns (sections/PostList's THE
   * STAIRWAY), and its NO-BREAK SPACES (U+00A0, and French's U+202F before a
   * colon — PostList's THE NO-BREAK SPACES), both made for the hero's lines:
   * anything that reuses it outside the hero — a meta description, a tab
   * title, an attribute — collapses its whitespace first. Nothing does today
   * (the tab title reads its own `blog.title`).
   */
  title: string;
  /**
   * The hero's paragraph under it — TWO `\n` and its own no-break spaces, so
   * the same care as `title` outside the hero.
   */
  lead: string;
  tags: string;
  readMore: string;
  readingTime: (minutes: number) => string;
  pagination: Readonly<{
    label: string;
    previous: string;
    next: string;
    status: (page: number, total: number) => string;
  }>;
}>;

/** The `blog` keys a list page reads that take NO values — the plain words. */
type BlogPlainKey =
  | 'hero.title'
  | 'hero.lead'
  | 'tags'
  | 'card.readMore'
  | 'pagination.label'
  | 'pagination.previous'
  | 'pagination.next';

/**
 * A translator for the `blog` namespace, ONE SIGNATURE PER KIND OF KEY — the
 * plain words take no values, the reading time its `{ minutes }`, the
 * counter its `{ page, total }` — so a key handed another key's values, or
 * none where its message needs them, does not compile (G2 typescript,
 * 2026-10-14; ./populate.test.ts pins the refusals). Every key a list page
 * reads is spelled here and only here. `getTranslations`' translator and
 * `useTranslations`' both fit it: each takes any key with optional values.
 */
export type BlogTranslate = {
  (key: BlogPlainKey): string;
  (key: 'card.readingTime', values: Readonly<{ minutes: number }>): string;
  (
    key: 'pagination.status',
    values: Readonly<{ page: number; total: number }>,
  ): string;
};

/**
 * The page's words from the `blog` translator — the ONE mapping of keys to
 * words (G2 react, 2026-10-14). The route pages call it with
 * `getTranslations`' (./words.ts), the Pages/Blog twin with
 * `useTranslations`', so a swapped label („Pagina anterioară" for „Pagina
 * următoare") turns the twin's plays red instead of shipping past them.
 */
export function blogWordsFrom(t: BlogTranslate): BlogPageWords {
  return {
    title: t('hero.title'),
    lead: t('hero.lead'),
    tags: t('tags'),
    readMore: t('card.readMore'),
    readingTime: (minutes) => t('card.readingTime', { minutes }),
    pagination: {
      label: t('pagination.label'),
      previous: t('pagination.previous'),
      next: t('pagination.next'),
      status: (page, total) => t('pagination.status', { page, total }),
    },
  };
}

/**
 * Page `page` of the blog's list in `locale`, ready for sections/PostList.
 * `words` must be that language's too — the pages read both off the route
 * (./words.ts), the twin off its story's language.
 * @throws RangeError for a page the list does not have (lib/blog's postsOnPage).
 */
export function populateBlogPage(
  locale: Locale,
  page: number,
  words: BlogPageWords,
  list: readonly BlogPostEntry[] = SITE_POSTS,
): PostListProps {
  const total = pageCount(list.length);
  const href = (n: number) => localeHref(locale, blogPagePath(n));

  return {
    title: words.title,
    lead: words.lead,
    tagsLabel: words.tags,
    readMore: words.readMore,
    posts: postsOnPage(page, postsIn(locale, list)).map((post) => ({
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      author: post.author,
      readingTime: words.readingTime(post.readingMinutes),
      image: post.image,
      tags: post.tags,
    })),
    pagination: {
      label: words.pagination.label,
      status: words.pagination.status(page, total),
      current: page,
      total,
      previousLabel: words.pagination.previous,
      nextLabel: words.pagination.next,
      ...(page > 1 ? { previousHref: href(page - 1) } : {}),
      ...(page < total ? { nextHref: href(page + 1) } : {}),
    },
  };
}
