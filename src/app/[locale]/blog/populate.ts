import type {
  PostListItem,
  PostListProps,
} from '@/components/sections/PostList/PostList';
import { localeHref } from '@/i18n/href';
import type { Locale } from '@/i18n/locales';
import { articleAuthor, articleSlugFor } from '@/lib/blog-article/blog-article';
import {
  articlePath,
  blogPagePath,
  pageCount,
  posts as SITE_POSTS,
  postsIn,
  postsOnPage,
  type BlogPost,
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
// `readingMinutes` through ICU), the article its card opens, its author's
// name, the pager's two links — the previous page's and the next page's,
// absent at the two ends, which is how sections/Pagination knows to draw a
// disabled control — and the counter's sentence. Every href goes through
// i18n/href's localeHref under the page's own language, so a German page's
// pager and cards stay in German, and the interim host's base path and the
// trailing slash are the site's own (§15.13), never spelled here. A post's
// DATE is not printed (round 2, the owner's card lists none — CLAUDE.md
// §15.39): lib/blog still orders the list by it.
//
// THE CARD'S LINK (the owner, 2026-10-15: "on click of card anywhere it
// should take you to article. but for now it should be a dummy article and
// all should point to same article"): every card is a link to an article —
// its post's own, or lib/blog-article's STAND-IN while its post has none
// (`articleSlugFor`) — at lib/blog's `articlePath` under the page's language.
// Today the stand-in is the blog's one article, so every card on every page
// in every language opens „Cum îți alegi periuța de dinți" in that language.
//
// THE AUTHOR'S NAME as lib/team spells it in the page's language, the
// doctor lib/blog-article's `articleAuthor` finds by the post's one string —
// the very name the article's by-line prints, so a card and its article never
// disagree. In four languages it IS the post's string; French writes „Dr"
// with no point (lib/blog-article's THE AUTHOR has the rule).

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
  (key: 'readingTime', values: Readonly<{ minutes: number }>): string;
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
    readingTime: (minutes) => t('readingTime', { minutes }),
    pagination: {
      label: t('pagination.label'),
      previous: t('pagination.previous'),
      next: t('pagination.next'),
      status: (page, total) => t('pagination.status', { page, total }),
    },
  };
}

/**
 * One post as sections/PostCard's content in `locale`, with its slug (the
 * cards' key) — the ONE card mapping:
 * the list's pages and the Home page's articles band (since 2026-10-17)
 * both print a post through it, so a card reads the same wherever it stands —
 * its link the article it opens (THE CARD'S LINK, above), its author as
 * lib/team names the doctor in that language, its reading time in the blog's
 * own sentence.
 */
export function postCard(
  locale: Locale,
  post: BlogPost,
  readingTime: (minutes: number) => string,
): PostListItem {
  return {
    slug: post.slug,
    href: localeHref(locale, articlePath(articleSlugFor(post.slug))),
    title: post.title,
    summary: post.summary,
    author: articleAuthor(post).words[locale].name,
    readingTime: readingTime(post.readingMinutes),
    image: post.image,
    tags: post.tags,
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
    posts: postsOnPage(page, postsIn(locale, list)).map((post) =>
      postCard(locale, post, words.readingTime),
    ),
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
