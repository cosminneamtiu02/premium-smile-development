import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { localeHref } from '@/i18n/href';
import {
  BLOG_LOCALE,
  blogPagePath,
  pageCount,
  postsOnPage,
  type BlogPost,
} from '@/lib/blog/blog';
import {
  PostList,
  type PostListItem,
  type PostListPagination,
  type PostListProps,
} from './PostList';

// Sections/PostList — the blog index's band. FOUR stories: the first page,
// the last page, the empty blog, and the first page at the 320 stress width.
// The export NAMES are load-bearing — each names a baseline file — so this
// list IS the band's contribution to a lane's visual manifest. `Sections/*`
// routes every story to 390 + 1536 (tests/visual/stories.spec.ts, §13); the
// 'stress-320' tag adds the accessibility width to Narrowest.
//
// ── THE POSTS ARE THE BLOG'S OWN — lib/blog's `posts`, cut by its own
// `postsOnPage` (the ReviewsCarousel precedent: stories may read lib data, the
// band never does). They are the placeholder drafts the JSON ships today
// (lib/blog's PLACEHOLDERS paragraph), so these frames show exactly what the
// page shows. The stories do the page's other two jobs themselves, the way
// the page will: each day is worded by a local Intl.DateTimeFormat in the
// blog's language, read as the UTC day the ISO string names, and every href
// goes through localeHref and lib/blog's blogPagePath — the site's one URL
// rule, so a story link is the address the built page links to. LastPage
// reads `pageCount()` rather than a fixed 3, so a post added or removed in the
// JSON moves the story with it instead of breaking it.
//
// ── EVERY STORY PINS ITS LANGUAGE (the preview decorator stamps <html lang>
// from it, and `hyphens: auto` picks its dictionary there — §15.14); the blog
// is Romanian only (§5). Two pin a VIEWPORT for the Vitest storybook project
// — LastPage a phone's 390, Narrowest the 320 stress width — while Default
// and Empty open at the runner's own 1200. The visual net ignores the pins
// (it sets its own page size per project), so every play DERIVES what it
// expects from the boxes it measures, never from the pinned width.
//
// ── WHAT THE PLAYS MEASURE, AND WHAT THEY DO NOT WAIT FOR. The real faces
// first: Storybook loads Source Serif 4 and JetBrains Mono under their own
// family names, `font-display: block`, so a play that measured before they
// arrived would lay the words out in a fallback — each element's face is
// asked for by its COMPUTED font (the PostCard and Pagination stories'
// idiom). No play waits on a picture: in the Vitest run the optimizer's
// variants do not exist, every <img> 404s and falls back to its original
// file, and awaiting a decode could hang. The same run prints Next's dev-only
// warning that a lazy card's picture was the LCP: there the first card's
// preload asks for a variant that is missing (measured at the runner's
// 1200×900: the browser logged an LCP entry for the second card's picture
// and none for the first's), so it says nothing about the built page, whose
// variants exist. Every distance is read off the
// <li>s and the band's own boxes, which no hover transform reaches: a card
// jumps under a resting pointer (PostCard's THE CARD JUMP), but the
// transform rides the <article> inside the <li>, and a child's transform
// never moves its parent's box.

/** Each day in the blog's own words, read as the UTC day the ISO string names. */
const DAY = new Intl.DateTimeFormat(BLOG_LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** A post as the page hands it to the band: the day worded, the rest as the JSON has it. */
const itemOf = (post: BlogPost): PostListItem => ({
  slug: post.slug,
  title: post.title,
  summary: post.summary,
  date: {
    iso: post.date,
    label: DAY.format(new Date(`${post.date}T00:00:00Z`)),
  },
  author: post.author,
  image: post.image,
  tags: post.tags,
});

/** Page n's address — the site's one URL rule over lib/blog's one spelling. */
const hrefOf = (page: number): string =>
  localeHref(BLOG_LOCALE, blogPagePath(page));

/** How many pages the blog's posts fill today (3 for the twelve drafts). */
const TOTAL = pageCount();

/** The navigation as the page builds it — a back href from page 2, a forward
 *  href before the last page (the shape sections/Pagination's belt demands). */
const paginationOf = (page: number, total = TOTAL): PostListPagination => ({
  label: 'Paginile articolelor',
  current: page,
  total,
  status: `Pagina ${page} din ${total}`,
  previousLabel: 'Anterior',
  nextLabel: 'Următor',
  ...(page > 1 ? { previousHref: hrefOf(page - 1) } : {}),
  ...(page < total ? { nextHref: hrefOf(page + 1) } : {}),
});

/** Page n of the blog: its posts and its navigation. */
const pageArgs = (
  page: number,
): Pick<PostListProps, 'posts' | 'pagination'> => ({
  posts: postsOnPage(page).map(itemOf),
  pagination: paginationOf(page),
});

/** `n` rem in px, at whatever the root font size is — never a baked-in 16. */
const rem = (n: number): number =>
  n * parseFloat(getComputedStyle(document.documentElement).fontSize);

/** The real faces, by each element's computed font, before anything is measured. */
async function loadFaces(root: HTMLElement): Promise<void> {
  for (const element of root.querySelectorAll<HTMLElement>(
    'h1, h2, p, li, time, a, button',
  )) {
    const style = getComputedStyle(element);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      element.textContent ?? '',
    );
  }
  await document.fonts.ready;
}

/** The middle of a box, across. */
const across = (box: DOMRect): number => box.left + box.width / 2;

/** The band's boxes, reached from the <h1> by structure — none of the outer
 *  ones carries a role: the opener, the rhythm box, ui/Container's column. */
function partsOf(h1: HTMLElement) {
  const opener = h1.parentElement;
  const rhythm = opener?.parentElement;
  const column = rhythm?.parentElement;
  if (!opener || !rhythm || !column) throw new Error('the band lost a box');
  return { opener, rhythm, column };
}

/** Nothing may require horizontal scrolling, at any sampled width (§7, §9). */
async function expectNoSidewaysScroll(): Promise<void> {
  const page = document.documentElement;
  await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
}

/**
 * THE OPENER — the eyebrow over the page's one <h1>, both centred in the
 * column: every line of the title (a Range's per-line boxes, so a wrapped
 * title counts line by line), and the eyebrow's box, which hugs its text.
 * The band's top step under the header follows the column's own width:
 * 3rem under 32rem of column, 4rem from it, 5rem from 48rem.
 */
async function expectOpener(
  canvasElement: HTMLElement,
  args: PostListProps,
): Promise<HTMLElement> {
  const canvas = within(canvasElement);
  await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  const h1 = canvas.getByRole('heading', { level: 1, name: args.title });
  const { opener, rhythm, column } = partsOf(h1);
  const eyebrow = within(opener).getByText(args.eyebrow);
  await expect(eyebrow.tagName).toBe('P');
  await expect(eyebrow.nextElementSibling).toBe(h1);
  await expect(getComputedStyle(eyebrow).textTransform).toBe('uppercase');

  const middle = across(column.getBoundingClientRect());
  const title = document.createRange();
  title.selectNodeContents(h1);
  const lines = [...title.getClientRects()].filter((line) => line.width > 0);
  await expect(lines.length).toBeGreaterThan(0);
  for (const line of lines) {
    await expect(Math.abs(across(line) - middle)).toBeLessThanOrEqual(1);
  }
  await expect(
    Math.abs(across(eyebrow.getBoundingClientRect()) - middle),
  ).toBeLessThanOrEqual(1);
  await expect(getComputedStyle(eyebrow).textAlign).toBe('center');
  // 8px between the eyebrow and the title (SectionHeading's gap).
  await expect(
    Math.abs(
      h1.getBoundingClientRect().top -
        eyebrow.getBoundingClientRect().bottom -
        rem(0.5),
    ),
  ).toBeLessThanOrEqual(1);

  const width = column.getBoundingClientRect().width;
  const step = width >= rem(48) ? 5 : width >= rem(32) ? 4 : 3;
  await expect(
    Math.abs(parseFloat(getComputedStyle(rhythm).paddingTop) - rem(step)),
  ).toBeLessThanOrEqual(0.5);
  return h1;
}

/**
 * THE LIST AND THE NAVIGATION — one card per post, in order, each an article
 * named by its own <h2>; 3rem from the opener, 3rem between cards, 3rem down
 * to the navigation; the gap wider than a hovered card's jump (2.5 % of its
 * height toward each neighbour); the FIRST card's picture loading at once at
 * high priority and every other one lazily; the navigation present exactly
 * when there is more than one page.
 */
async function expectListAndNavigation(
  canvasElement: HTMLElement,
  h1: HTMLElement,
  args: PostListProps,
): Promise<void> {
  const canvas = within(canvasElement);
  const { opener } = partsOf(h1);
  const list = opener.nextElementSibling;
  if (!(list instanceof HTMLUListElement)) throw new Error('no list');
  await expect(list).toHaveAttribute('role', 'list');
  const items = [...list.children] as HTMLElement[];
  await expect(items).toHaveLength(args.posts.length);

  for (const [index, item] of items.entries()) {
    const post = args.posts[index];
    if (!post) throw new Error(`no post for item ${index + 1}`);
    await expect(
      within(item).getByRole('article', { name: post.title }),
    ).toBeInTheDocument();
  }

  const gap = (above: Element, below: Element): number =>
    below.getBoundingClientRect().top - above.getBoundingClientRect().bottom;
  await expect(Math.abs(gap(opener, list) - rem(3))).toBeLessThanOrEqual(1);
  for (const [index, item] of items.entries()) {
    const next = items[index + 1];
    if (!next) break;
    const between = gap(item, next);
    await expect(Math.abs(between - rem(3))).toBeLessThanOrEqual(1);
    const taller = Math.max(item.offsetHeight, next.offsetHeight);
    await expect(between).toBeGreaterThan(0.025 * taller);
  }

  for (const [index, item] of items.entries()) {
    const picture = item.querySelector('img');
    if (!picture) throw new Error(`card ${index + 1} has no picture`);
    if (index === 0) {
      await expect(picture).toHaveAttribute('fetchpriority', 'high');
      await expect(picture).not.toHaveAttribute('loading', 'lazy');
    } else {
      await expect(picture).toHaveAttribute('loading', 'lazy');
      await expect(picture).not.toHaveAttribute('fetchpriority');
    }
  }

  const nav = canvas.queryByRole('navigation', {
    name: args.pagination.label,
  });
  if (args.pagination.total > 1) {
    if (!nav) throw new Error('the page navigation is missing');
    await expect(list.nextElementSibling).toBe(nav);
    await expect(Math.abs(gap(list, nav) - rem(3))).toBeLessThanOrEqual(1);
  } else {
    await expect(nav).toBeNull();
  }
}

const meta = {
  title: 'Sections/PostList',
  component: PostList,
  parameters: { layout: 'fullscreen' },
  args: {
    eyebrow: 'Blog',
    title: 'Articole și noutăți',
    tagsLabel: 'Categorii',
    ...pageArgs(1),
  },
  argTypes: {
    eyebrow: {
      control: 'text',
      description:
        'The mono kicker above the page’s <h1>, finished text, uppercased in CSS',
    },
    title: {
      control: 'text',
      description:
        'The page’s one <h1>, on ui/Heading’s `hero` step, centred like the reference’s heading',
    },
    posts: {
      control: 'object',
      description:
        'The posts this page shows, in order — each one sections/PostCard’s content plus its slug (the React key, never an attribute). Empty renders the opener alone',
    },
    tagsLabel: {
      control: 'text',
      description:
        'The accessible name of every card’s tag list, e.g. „Categorii”',
    },
    pagination: {
      control: 'object',
      description:
        'sections/Pagination’s data, hrefs built by the page; one page (`total` 1) renders no navigation',
    },
  },
} satisfies Meta<typeof PostList>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE FIRST PAGE — the reference's shape: the centred „Blog" kicker and the
 * page's <h1>, the newest posts one under another at the column's full width
 * (five a page), 3rem apart, the first card's picture loading at once, and
 * the navigation under them — the back control greyed out, the forward one a
 * link to page 2. Unpinned: the Vitest run renders it at the runner's 1200,
 * where every card is the row (the square picture beside the words); the net
 * photographs it at 390 (stacked) and 1536 (the row).
 */
export const Default: Story = {
  globals: { locale: 'ro' },
  play: async ({ args, canvasElement }) => {
    await loadFaces(canvasElement);
    const h1 = await expectOpener(canvasElement, args);
    await expectListAndNavigation(canvasElement, h1, args);
    await expectNoSidewaysScroll();
  },
};

/**
 * THE LAST PAGE — page 3 of 3 for the twelve drafts, the two oldest posts:
 * the back control a link to the page before it, the forward one greyed out.
 * Pinned to a phone (390), so the Vitest run proves the stacked cards — each
 * picture on top at the card's full width.
 */
export const LastPage: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  args: pageArgs(TOTAL),
  play: async ({ args, canvasElement }) => {
    await loadFaces(canvasElement);
    const h1 = await expectOpener(canvasElement, args);
    await expectListAndNavigation(canvasElement, h1, args);
    if (TOTAL > 1) {
      const canvas = within(canvasElement);
      await expect(
        canvas.getByRole('button', { name: 'Următor' }),
      ).toBeDisabled();
      await expect(
        canvas.getByRole('link', { name: 'Anterior' }),
      ).toHaveAttribute('href', hrefOf(TOTAL - 1));
    }
    await expectNoSidewaysScroll();
  },
};

/**
 * THE EMPTY BLOG — no posts, so one page: the opener alone, centred, with no
 * list and no navigation (PostList.tsx's THE EMPTY STATE: the band is the
 * page, and a page keeps its one <h1>).
 */
export const Empty: Story = {
  globals: { locale: 'ro' },
  args: { posts: [], pagination: paginationOf(1, 1) },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await loadFaces(canvasElement);
    const h1 = await expectOpener(canvasElement, args);
    const { opener, rhythm } = partsOf(h1);
    await expect(opener.nextElementSibling).toBeNull();
    // No space left behind: the rhythm box ends on its own bottom step, right
    // under the opener — a flex gap opens only between boxes that exist.
    await expect(
      Math.abs(
        rhythm.getBoundingClientRect().bottom -
          opener.getBoundingClientRect().bottom -
          parseFloat(getComputedStyle(rhythm).paddingBottom),
      ),
    ).toBeLessThanOrEqual(0.5);
    await expect(canvas.queryAllByRole('list')).toHaveLength(0);
    await expect(canvas.queryAllByRole('article')).toHaveLength(0);
    await expect(canvas.queryByRole('navigation')).toBeNull();
    await expect(canvas.getAllByRole('heading')).toEqual([h1]);
    await expectNoSidewaysScroll();
  },
};

/**
 * THE 320 STRESS WIDTH (§7) — the first page in the narrowest column, the
 * 'stress-320' tag, and pinned there so the Vitest run proves it: the title
 * centred line by line, every card stacked, the gap still wider than the
 * tallest card's jump, and nothing pushing the page sideways.
 */
export const Narrowest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  play: async ({ args, canvasElement }) => {
    await loadFaces(canvasElement);
    const h1 = await expectOpener(canvasElement, args);
    await expectListAndNavigation(canvasElement, h1, args);
    await expectNoSidewaysScroll();
  },
};
