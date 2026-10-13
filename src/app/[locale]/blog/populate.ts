import type { PostListProps } from '@/components/sections/PostList/PostList';
import { localeHref } from '@/i18n/href';
import {
  BLOG_LOCALE,
  blogPagePath,
  pageCount,
  posts as SITE_POSTS,
  postsOnPage,
  type BlogPost,
} from '@/lib/blog/blog';

// app/[locale]/blog/populate.ts — THE ONE POPULATOR of the blog's list pages
// (/ro/blog/ is page 1, /ro/blog/page/n/ is page n — CLAUDE.md §15.39): lib/
// blog's posts and the page's finished words in, sections/PostList's props
// out. PURE — no next-intl, no React, the team folder's populate.ts
// precedent: the two route pages call it with the words `getTranslations`
// gives them (./words.ts), and the Pages/Blog twin calls it with the words
// `useTranslations` gives it, so the twin can never walk the posts its own way.
//
// What it decides: each post's day in the blog's language („29 septembrie
// 2026"), the pager's two links — the previous page's and the next page's,
// absent at the two ends, which is how sections/Pagination knows to draw a
// disabled control — and the counter's sentence. Every href goes through
// i18n/href's localeHref, so the interim host's base path and the trailing
// slash are the site's own (§15.13), never spelled here.

/** Every word of a list page that is not a post's — finished, except the counter's sentence, which needs the page numbers. */
export type BlogPageWords = Readonly<{
  eyebrow: string;
  title: string;
  tags: string;
  pagination: Readonly<{
    label: string;
    previous: string;
    next: string;
    status: (page: number, total: number) => string;
  }>;
}>;

/** The `blog` keys a list page reads — the one place they are spelled. */
type BlogKey =
  | 'title'
  | 'tags'
  | 'pagination.label'
  | 'pagination.previous'
  | 'pagination.next'
  | 'pagination.status';

/** A translator for the `blog` namespace — `getTranslations`' and `useTranslations`' both fit. */
export type BlogTranslate = (
  key: BlogKey,
  values?: Readonly<{ page: number; total: number }>,
) => string;

/** A translator for the `common` namespace, narrowed to the one key read here. */
export type CommonTranslate = (key: 'nav.blog') => string;

/**
 * The page's words from two translators — the ONE mapping of keys to words
 * (G2 react, 2026-10-14). The route pages call it with `getTranslations`' (./
 * words.ts), the Pages/Blog twin with `useTranslations`', so a swapped label
 * („Anterior" for „Următor") turns the twin's plays red instead of shipping
 * past them.
 */
export function blogWordsFrom(
  t: BlogTranslate,
  common: CommonTranslate,
): BlogPageWords {
  return {
    eyebrow: common('nav.blog'),
    title: t('title'),
    tags: t('tags'),
    pagination: {
      label: t('pagination.label'),
      previous: t('pagination.previous'),
      next: t('pagination.next'),
      status: (page, total) => t('pagination.status', { page, total }),
    },
  };
}

/** A post's day in the blog's language — read in UTC, so no time zone can move the calendar day. */
const DAY = new Intl.DateTimeFormat(BLOG_LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** „29 septembrie 2026" for 2026-09-29. */
export function postDayLabel(date: BlogPost['date']): string {
  return DAY.format(new Date(`${date}T00:00:00Z`));
}

/**
 * Page `page` of the blog's list, ready for sections/PostList.
 * @throws RangeError for a page the list does not have (lib/blog's postsOnPage).
 */
export function populateBlogPage(
  page: number,
  words: BlogPageWords,
  list: readonly BlogPost[] = SITE_POSTS,
): PostListProps {
  const total = pageCount(list.length);
  const href = (n: number) => localeHref(BLOG_LOCALE, blogPagePath(n));

  return {
    eyebrow: words.eyebrow,
    title: words.title,
    tagsLabel: words.tags,
    posts: postsOnPage(page, list).map((post) => ({
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      date: { iso: post.date, label: postDayLabel(post.date) },
      author: post.author,
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
