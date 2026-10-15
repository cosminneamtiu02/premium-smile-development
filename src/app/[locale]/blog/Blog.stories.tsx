import type { ReactElement } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { useLocale, useTranslations } from 'next-intl';
import { ClinicLocation } from '@/components/sections/ClinicLocation/ClinicLocation';
import { PostList } from '@/components/sections/PostList/PostList';
import { namedAs } from '@/components/sections/PostList/PostList.fixtures';
import { blogPagePath, pageCount, postsIn, postsOnPage } from '@/lib/blog/blog';
import { localeHref } from '@/i18n/href';
import { isLocale, type Locale } from '@/i18n/locales';
import de from '@/messages/de.json';
import ro from '@/messages/ro.json';
import { blogWordsFrom, populateBlogPage } from './populate';

// Pages/Blog — the blog's list pages (CLAUDE.md §15.39): /{locale}/blog/ and
// /{locale}/blog/page/n/. KEEP-IN-SYNC with ./page.tsx and
// ./page/[page]/page.tsx: both are async Server Components the browser runner
// cannot render, so the twin below mounts the SAME two bands — the list through
// the SAME ./populate.ts (the posts through `populateBlogPage`, in the story's
// language from the isomorphic `useLocale`, the words through `blogWordsFrom`,
// the one mapping ./words.ts also calls, here with `useTranslations`'
// translator), then the map, `scaled` like on every page (§15.32).
// ../page-twins.test.ts holds the bands and that call together.
//
// ── ROMANIAN AND GERMAN (§13: pages in RO + DE, German the longest language).
// The blog is written in every language since round 3 (2026-10-14), so the
// twin renders it in both, and every play reads the story's OWN language: the
// heading from that language's message file, each card named by that
// language's title of the post (lib/blog's `postsIn`), the pager's links under
// that language's prefix. A German page that showed a Romanian title, or
// linked its next page under /ro/, fails here. LastPage stays Romanian — the
// pager's other end. The visual matrix photographs Pages/* at all six widths
// (§13).

/** KEEP-IN-SYNC twin of the two route pages: page `page` of the list in the story's language, then the map. */
function BlogPageBand({ page }: { page: number }): ReactElement {
  const words = blogWordsFrom(useTranslations('blog'));
  const locale = useLocale();
  if (!isLocale(locale)) {
    throw new Error(`blog story: unknown locale "${locale}"`);
  }
  return (
    <>
      <PostList {...populateBlogPage(locale, page, words)} />
      <ClinicLocation scaled />
    </>
  );
}

/** Each story language's own messages — what its plays read the page against. */
const MESSAGES = { ro, de } as const satisfies Partial<
  Record<Locale, typeof ro>
>;
type StoryLocale = keyof typeof MESSAGES;

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
type Canvas = Parameters<NonNullable<Story['play']>>[0]['canvas'];

/**
 * The page's hero and its cards in `locale`: the <h1> is that language's
 * heading, and every card on the page is named by that language's title of its
 * post, in the list's order — so the words came from the story's language and
 * not from another. The heading is found by `namedAs` (PostList.fixtures), the
 * name the PostList folder's own suites use: the copy breaks it with a line
 * break and joins words with no-break spaces, and whitespace is collapsed on
 * both sides of the comparison — never matched raw, which held only because
 * dom-accessibility-api happens to keep the one line break (Chromium's own
 * accessible name reads it as a space).
 */
async function expectPageIn(
  canvas: Canvas,
  locale: StoryLocale,
  page: number,
): Promise<void> {
  await expect(
    canvas.getByRole('heading', {
      level: 1,
      name: namedAs(MESSAGES[locale].blog.hero.title),
    }),
  ).toBeInTheDocument();
  const titles = postsOnPage(page, postsIn(locale)).map((post) => post.title);
  await expect(canvas.getAllByRole('article')).toHaveLength(titles.length);
  for (const title of titles) {
    await expect(
      canvas.getByRole('article', { name: title }),
    ).toBeInTheDocument();
  }
}

/**
 * The pager's share of the plays, read off the DATA (G2 typescript,
 * 2026-10-14) — so the twin holds whatever posts the owner ships: a one-page
 * blog has no pager at all (sections/Pagination renders nothing), and the
 * placeholders' two pages are not a fact the plays may assume. The controls
 * are named in the story's language, and their links stay under its prefix.
 */
async function expectPager(
  canvas: Canvas,
  locale: StoryLocale,
  page: number,
): Promise<void> {
  const words = MESSAGES[locale].blog.pagination;
  const total = pageCount();
  const nav = canvas.queryByRole('navigation', { name: words.label });
  if (total === 1) {
    await expect(nav).toBeNull();
    return;
  }
  await expect(nav).not.toBeNull();
  const previous = { name: words.previous };
  const next = { name: words.next };
  if (page === 1) {
    await expect(canvas.getByRole('button', previous)).toBeDisabled();
  } else {
    await expect(canvas.getByRole('link', previous)).toHaveAttribute(
      'href',
      localeHref(locale, blogPagePath(page - 1)),
    );
  }
  if (page === total) {
    await expect(canvas.getByRole('button', next)).toBeDisabled();
  } else {
    await expect(canvas.getByRole('link', next)).toHaveAttribute(
      'href',
      localeHref(locale, blogPagePath(page + 1)),
    );
  }
}

/** The map closes every page of the list — the band Home draws, named by its own heading. */
async function expectMap(canvas: Canvas, locale: StoryLocale): Promise<void> {
  await expect(
    canvas.getByRole('heading', {
      level: 2,
      name: MESSAGES[locale].home.location.title,
    }),
  ).toBeInTheDocument();
}

/** Page 1 — /ro/blog/: the hero, its cards, the previous control disabled, the next one a link to page 2, the map. */
export const Romanian: Story = {
  globals: { locale: 'ro' },
  args: { page: 1 },
  play: async ({ canvas, canvasElement }) => {
    await loadFace(canvasElement);
    await expectPageIn(canvas, 'ro', 1);
    await expectPager(canvas, 'ro', 1);
    await expectMap(canvas, 'ro');
    await expectNoSidewaysScroll();
  },
};

/** Page 1 in German — /de/blog/, the longest language (§13): the German hero and titles, the pager under /de/, the map. */
export const German: Story = {
  globals: { locale: 'de' },
  args: { page: 1 },
  play: async ({ canvas, canvasElement }) => {
    await loadFace(canvasElement);
    await expectPageIn(canvas, 'de', 1);
    await expectPager(canvas, 'de', 1);
    await expectMap(canvas, 'de');
    await expectNoSidewaysScroll();
  },
};

/** The LAST page: what is left of the list, the next control disabled, the previous one a link back — the hero and the map as on page 1. */
export const LastPage: Story = {
  globals: { locale: 'ro' },
  args: { page: pageCount() },
  play: async ({ canvas, canvasElement }) => {
    await loadFace(canvasElement);
    const last = pageCount();
    await expectPageIn(canvas, 'ro', last);
    await expectPager(canvas, 'ro', last);
    await expectMap(canvas, 'ro');
    await expectNoSidewaysScroll();
  },
};
