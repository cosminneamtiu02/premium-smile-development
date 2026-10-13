import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { useTranslations } from 'next-intl';
import { PostList } from '@/components/sections/PostList/PostList';
import {
  BLOG_LOCALE,
  blogPagePath,
  pageCount,
  postsOnPage,
} from '@/lib/blog/blog';
import { localeHref } from '@/i18n/href';
import ro from '@/messages/ro.json';
import { blogWordsFrom, populateBlogPage } from './populate';

// Pages/Blog — the blog's list pages (CLAUDE.md §15.39): /ro/blog/ and
// /ro/blog/page/n/. KEEP-IN-SYNC with ./page.tsx and ./page/[page]/page.tsx:
// both are async Server Components the browser runner cannot render, so the
// twin below mounts the SAME band through the SAME ./populate.ts — the posts
// through `populateBlogPage`, the words through `blogWordsFrom`, the one
// mapping ./words.ts also calls, here with the isomorphic `useTranslations`'
// translators. ../page-twins.test.ts holds the bands and that call together.
//
// Romanian only, like the blog (§5): there is no German page to stress, and
// the long Romanian words of the posts are the stress. The visual matrix
// photographs Pages/* at all six widths (§13).

/** KEEP-IN-SYNC twin of the two route pages: page `page` of the list. */
function BlogPageBand({ page }: { page: number }): ReactElement {
  const words = blogWordsFrom(
    useTranslations('blog'),
    useTranslations('common'),
  );
  return <PostList {...populateBlogPage(page, words)} />;
}

/** The real face first — Source Serif 4 is `font-display: block` (PR #125's lesson). */
async function loadFace(root: HTMLElement): Promise<void> {
  const h1 = root.querySelector('h1');
  if (h1) {
    const style = getComputedStyle(h1);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      h1.textContent ?? '',
    );
  }
  await document.fonts.ready;
}

/** No width may make the page scroll sideways (§7: reflow at 320px). */
async function expectNoSidewaysScroll(): Promise<void> {
  const root = document.documentElement;
  await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
}

const meta = {
  title: 'Pages/Blog',
  component: BlogPageBand,
  parameters: { layout: 'fullscreen' },
  args: { page: 1 },
} satisfies Meta<typeof BlogPageBand>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The pager's share of the plays, read off the DATA (G2 typescript,
 * 2026-10-14) — so the twin holds whatever posts the owner ships: a one-page
 * blog has no pager at all (sections/Pagination renders nothing), and the
 * placeholders' three pages are not a fact the plays may assume.
 */
async function expectPager(
  canvas: Parameters<NonNullable<Story['play']>>[0]['canvas'],
  page: number,
): Promise<void> {
  const total = pageCount();
  const nav = canvas.queryByRole('navigation', {
    name: ro.blog.pagination.label,
  });
  if (total === 1) {
    await expect(nav).toBeNull();
    return;
  }
  await expect(nav).not.toBeNull();
  const previous = { name: ro.blog.pagination.previous };
  const next = { name: ro.blog.pagination.next };
  if (page === 1) {
    await expect(canvas.getByRole('button', previous)).toBeDisabled();
  } else {
    await expect(canvas.getByRole('link', previous)).toHaveAttribute(
      'href',
      localeHref(BLOG_LOCALE, blogPagePath(page - 1)),
    );
  }
  if (page === total) {
    await expect(canvas.getByRole('button', next)).toBeDisabled();
  } else {
    await expect(canvas.getByRole('link', next)).toHaveAttribute(
      'href',
      localeHref(BLOG_LOCALE, blogPagePath(page + 1)),
    );
  }
}

/** Page 1 — /ro/blog/: its cards, the previous control disabled, the next one a link to page 2. */
export const Romanian: Story = {
  globals: { locale: BLOG_LOCALE },
  args: { page: 1 },
  play: async ({ canvas, canvasElement }) => {
    await loadFace(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: ro.blog.title }),
    ).toBeInTheDocument();
    await expect(canvas.getAllByRole('article')).toHaveLength(
      postsOnPage(1).length,
    );
    await expectPager(canvas, 1);
    await expectNoSidewaysScroll();
  },
};

/** The LAST page: what is left of the list, the next control disabled, the previous one a link back. */
export const LastPage: Story = {
  globals: { locale: BLOG_LOCALE },
  args: { page: pageCount() },
  play: async ({ canvas, canvasElement }) => {
    await loadFace(canvasElement);
    const last = pageCount();
    await expect(
      canvas.getByRole('heading', { level: 1, name: ro.blog.title }),
    ).toBeInTheDocument();
    await expect(canvas.getAllByRole('article')).toHaveLength(
      postsOnPage(last).length,
    );
    await expectPager(canvas, last);
    await expectNoSidewaysScroll();
  },
};
