import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, getDefaultNormalizer, within } from 'storybook/test';
import { localeHref } from '@/i18n/href';
import {
  blogPagePath,
  pageCount,
  postsIn,
  postsOnPage,
  type BlogPost,
} from '@/lib/blog/blog';
import ro from '@/messages/ro.json';
import {
  PostList,
  type PostListItem,
  type PostListPagination,
  type PostListProps,
} from './PostList';
import {
  GRID_GAP_REM,
  HERO_GAP_REM,
  JUMP,
  LEAD_FIRST_STEP,
  LEAD_STEP,
  ROOM_BELOW_REM,
  TITLE_STEP,
  leadToCardsRem,
  lineStrings,
  linesOf,
  namedAs,
  roomAboveRem,
  segmentsOf,
  wrapStyleAt,
} from './PostList.fixtures';

// Sections/PostList — the blog list's band. FIVE stories: the first page, the
// last page, a last page that is not full, the empty blog, and the first page
// at the 320 stress width. The export NAMES are load-bearing — each names a
// baseline file — so this list IS the band's contribution to a lane's visual
// manifest. `Sections/*` routes every story to 390 + 1536
// (tests/visual/stories.spec.ts, §13); the 'stress-320' tag adds the
// accessibility width to Narrowest.
//
// ── THE POSTS ARE THE BLOG'S OWN — lib/blog's Romanian posts,
// `postsIn('ro')`, cut by its own `postsOnPage` (the ReviewsCarousel
// precedent: stories may read lib data, the band never does). They are the
// placeholder drafts the JSON ships today (lib/blog's PLACEHOLDERS
// paragraph), so these frames show exactly what the page shows. The stories
// do the page's other two jobs themselves, the way the page does them
// (app/[locale]/blog/populate.ts): each reading time is
// worded as the page's ICU sentence words it in Romanian („4 min de citit"),
// and every href goes through localeHref and lib/blog's blogPagePath — the
// site's one URL rule, so a story link is the address the built page links
// to. LastPage reads `pageCount()` rather than a fixed 2, so a post added or
// removed in the JSON moves the story with it instead of breaking it. The
// hero's two sentences are read out of src/messages/ro.json (blog.hero.*,
// the PostCard stories' precedent), so the frames show the Romanian copy the
// page ships, its line breaks included — one of the five PostList.tsx's
// THE STAIRWAY records.
//
// ── EVERY STORY PINS ITS LANGUAGE (the preview decorator stamps <html lang>
// from it, and `hyphens: auto` picks its dictionary there — §15.14): Romanian,
// the house default (§13). The blog speaks five languages since round 3: the
// hero's shape in each of them is PostList.scale.test.tsx's, which reads every
// message file's copy, and the Pages/Blog twin renders the German page (its
// words and links, not the hero's lines). Three pin a VIEWPORT for the Vitest
// storybook project — LastPage a phone's 390, ShortLastPage the laptop's
// 1536, Narrowest the 320 stress width — while Default and Empty open at the
// runner's own 1200, a laptop window inside the band scale. The visual net
// ignores the pins (it sets its own page size per project), so every play
// DERIVES what it expects from the boxes it measures, never from the pinned
// width: the columns from the column's width, the design pixel from the
// rhythm box, the hero's lines from whether the band is scaled.
//
// ── WHAT THE PLAYS MEASURE, AND WHAT THEY DO NOT WAIT FOR. The real faces
// first: Storybook loads Source Serif 4 and JetBrains Mono under their own
// family names, `font-display: block`, so a play that measured before they
// arrived would lay the words out in a fallback — each element's face is
// asked for by its COMPUTED font (the PostCard and Pagination stories'
// idiom). No play waits on a picture: in the Vitest run the optimizer's
// variants do not exist, every <img> 404s and falls back to its original
// file, and awaiting a decode could hang. Every distance is read off the
// <li>s and the band's own boxes, which no hover transform reaches: a card
// jumps under a resting pointer (PostCard's THE CARD JUMP), but the transform
// rides the <article> inside the <li>, and a child's transform never moves
// its parent's box. The exact numbers at the six named windows — line counts,
// track widths, the growth with the screen — are PostList.scale.test.tsx's;
// the rules both files hold the band to (the stairway's steps, the jump, the
// band's room and gaps), the line reader both use and the <h1>'s name matcher
// are PostList.fixtures.ts's, spelled once (G2 typescript, 2026-10-15).

/** The blog's language, as the stories pin it. */
const LOCALE = { locale: 'ro' } as const;

/** A post as the page hands it to the band: the reading time worded as the
 *  page's Romanian sentence words it, the rest as the JSON has it. */
const itemOf = (post: BlogPost): PostListItem => ({
  slug: post.slug,
  title: post.title,
  summary: post.summary,
  author: post.author,
  readingTime: `${post.readingMinutes} min de citit`,
  image: post.image,
  tags: post.tags,
});

/** Page n's address — the site's one URL rule over lib/blog's one spelling. */
const hrefOf = (page: number): string =>
  localeHref(LOCALE.locale, blogPagePath(page));

/** How many pages the blog's posts fill today (2 for the twelve drafts). */
const TOTAL = pageCount();

/** The pager as the page builds it — a back href from page 2, a forward href
 *  before the last page (the shape sections/Pagination's belt demands). The
 *  two labels are the round controls' accessible names. */
const paginationOf = (page: number, total = TOTAL): PostListPagination => ({
  label: 'Paginile articolelor',
  current: page,
  total,
  status: `Pagina ${page} din ${total}`,
  previousLabel: 'Pagina anterioară',
  nextLabel: 'Pagina următoare',
  ...(page > 1 ? { previousHref: hrefOf(page - 1) } : {}),
  ...(page < total ? { nextHref: hrefOf(page + 1) } : {}),
});

/** Page n of the blog: its posts and its pager. */
const pageArgs = (
  page: number,
): Pick<PostListProps, 'posts' | 'pagination'> => ({
  posts: postsOnPage(page, postsIn(LOCALE.locale)).map(itemOf),
  pagination: paginationOf(page),
});

/** `n` rem in px, at whatever the root font size is — never a baked-in 16. */
const rem = (n: number): number =>
  n * parseFloat(getComputedStyle(document.documentElement).fontSize);

const px = (element: Element, property: string): number =>
  parseFloat(getComputedStyle(element).getPropertyValue(property));

const box = (element: Element): DOMRect => element.getBoundingClientRect();

/** The real faces, by each element's computed font, before anything is measured. */
async function loadFaces(root: HTMLElement): Promise<void> {
  for (const element of root.querySelectorAll<HTMLElement>(
    'h1, h2, p, li, a, button',
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
const across = (rect: DOMRect): number => rect.left + rect.width / 2;

/** The words of an element's LAST line, as PostList.fixtures.ts's reader
 *  sets them out (a hyphenated word counts once, on whichever line its tail
 *  falls; two joined by a no-break space are two). */
const lastLineWords = (element: Element): string[] =>
  (lineStrings(element).at(-1) ?? '').split(/\s+/).filter(Boolean);

/** The band's boxes, reached from the <h1> by structure — none of the outer
 *  ones carries a role: the hero, the rhythm box, ui/Container's column. */
function partsOf(h1: HTMLElement) {
  const hero = h1.parentElement;
  const rhythm = hero?.parentElement;
  const column = rhythm?.parentElement;
  if (!hero || !rhythm || !column) throw new Error('the band lost a box');
  return { hero, rhythm, column };
}

/** The design pixel the band is drawn in: globals.css's `design-scale`
 *  remaps `--spacing` on the rhythm box inside THE BAND SCALE, and there the
 *  box declares the pixel; off it the theme's rem, 1. */
function scaleOf(rhythm: HTMLElement): { scaled: boolean; s: number } {
  const scaled =
    getComputedStyle(rhythm).getPropertyValue('--spacing') !==
    getComputedStyle(document.documentElement).getPropertyValue('--spacing');
  return { scaled, s: scaled ? px(rhythm, '--scale-px') : 1 };
}

/** Nothing may require horizontal scrolling, at any sampled width (§7, §9) —
 *  the page measured by the root's own BOX, which ends where a reserved
 *  scrollbar gutter begins. Never by `clientWidth`: in a Vitest runner's
 *  frame it is the whole window, the 15px gutter included (measured,
 *  2026-10-15), so a check against it lets 15px of overflow through
 *  (G2 typescript; PostList.scale.test.tsx's expectNoSideways). */
async function expectNoSidewaysScroll(): Promise<void> {
  const root = document.documentElement;
  await expect(root.scrollWidth).toBeLessThanOrEqual(
    Math.ceil(box(root).width),
  );
}

/**
 * THE HERO — the page's one <h1> over its lead, both centred line by line in
 * the column, 3rem apart (× s in the band scale), never split at a syllable.
 * Wherever the band is scaled — a laptop or a desktop — THE STAIRWAY
 * (PostList.tsx): the copy's own line breaks hold, the title in TWO lines,
 * the second at most 0.9 of the first, and the lead in THREE, its second at
 * most 0.95 of its first and its third at most 0.9 of its second, the
 * title's second line wider than the lead's first. Anywhere else the breaks
 * are spaces and both wrap as prose — `pretty` on a phone's or a tablet's
 * column: neither block's lines are the copy's, and the title takes more
 * than two (never the lead's line COUNT, which a third of a pixel decides
 * at some widths — PostList.scale.test.tsx's expectProse); and never a last
 * line of one word. The band's room above the hero, under the header,
 * follows the column's own width: 4rem under 32rem of column, 6rem from it,
 * 8rem from 48rem (× s). Every step and length is PostList.fixtures.ts's.
 */
async function expectHero(
  canvasElement: HTMLElement,
  args: PostListProps,
): Promise<HTMLElement> {
  const canvas = within(canvasElement);
  await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  // By the name a screen reader hears — the copy's line break a space —
  // whitespace collapsed (PostList.fixtures.ts's namedAs).
  const h1 = canvas.getByRole('heading', {
    level: 1,
    name: namedAs(args.title),
  });
  const { hero, rhythm, column } = partsOf(h1);
  // The lead's text holds its line breaks: a normalizer that keeps them.
  const lead = within(hero).getByText(args.lead, {
    normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
  });
  await expect(lead.tagName).toBe('P');
  await expect(lead.previousElementSibling).toBe(h1);
  await expect(getComputedStyle(lead).textAlign).toBe('center');
  const { scaled, s } = scaleOf(rhythm);

  const middle = across(box(rhythm));
  const titleLines = linesOf(h1);
  const leadLines = linesOf(lead);
  for (const line of [...titleLines, ...leadLines]) {
    await expect(Math.abs(across(line) - middle)).toBeLessThanOrEqual(1);
  }
  if (scaled) {
    await expect(titleLines).toHaveLength(2);
    await expect(leadLines).toHaveLength(3);
    const [t1 = 0, t2 = Infinity] = titleLines.map(({ width }) => width);
    const [l1 = 0, l2 = Infinity, l3 = Infinity] = leadLines.map(
      ({ width }) => width,
    );
    await expect(t2).toBeLessThanOrEqual(TITLE_STEP * t1);
    await expect(l2).toBeLessThanOrEqual(LEAD_FIRST_STEP * l1);
    await expect(l3).toBeLessThanOrEqual(LEAD_STEP * l2);
    await expect(t2).toBeGreaterThan(l1);
  } else {
    // PROSE: the laptop's breaks absent — neither block's rendered lines
    // the copy's segments — and the title in more than the stairway's two.
    await expect(lineStrings(h1)).not.toEqual(segmentsOf(args.title));
    await expect(lineStrings(lead)).not.toEqual(segmentsOf(args.lead));
    await expect(titleLines.length).toBeGreaterThan(2);
  }
  // Whole words, the `pretty` wrap on a phone's or a tablet's column (under
  // 48rem) alone — plainly from it (PostList.tsx's THE HERO) — and the copy's
  // line breaks kept only where the band is scaled (THE STAIRWAY).
  const wrap = wrapStyleAt(box(column).width / rem(1));
  for (const element of [h1, lead]) {
    await expect(lastLineWords(element).length).toBeGreaterThan(1);
    await expect(getComputedStyle(element).hyphens).toBe('none');
    await expect(
      getComputedStyle(element).getPropertyValue('text-wrap-style'),
    ).toBe(wrap);
    await expect(getComputedStyle(element).whiteSpace).toBe(
      scaled ? 'pre-line' : 'normal',
    );
  }
  // The heading to its lead, laid out and as the hero's gap computes (a flex
  // column's gap is its `row-gap`, read before layout rounds a box).
  const heroGap = rem(HERO_GAP_REM) * s;
  await expect(
    Math.abs(box(lead).top - box(h1).bottom - heroGap),
  ).toBeLessThanOrEqual(1);
  await expect(Math.abs(px(hero, 'row-gap') - heroGap)).toBeLessThanOrEqual(
    0.05,
  );

  const above = roomAboveRem(box(column).width / rem(1));
  await expect(
    Math.abs(px(rhythm, 'padding-top') - rem(above) * s),
  ).toBeLessThanOrEqual(0.5);
  return h1;
}

/**
 * THE LIST AND THE PAGER — one card per post, in order, each an article named
 * by its own <h2>, on a grid of one column, two from the column's 36rem and
 * three from 56rem, 2rem apart (× s), every row one height; 4.8rem from the
 * hero's lead, 6rem from a 48rem column (× s); the gap wider than a hovered
 * card's jump (2.5 % of its height toward each neighbour); the FIRST card's
 * picture loading at once at high priority and every other one lazily; the
 * pager — present exactly when there is more than one page — 2rem under the
 * grid, its end edge ON the grid's end edge, whatever the last row holds; and
 * the band ending 2rem (× s) under its last box, the pager or the grid.
 */
async function expectListAndPager(
  canvasElement: HTMLElement,
  h1: HTMLElement,
  args: PostListProps,
): Promise<void> {
  const canvas = within(canvasElement);
  const { hero, rhythm, column } = partsOf(h1);
  const { s } = scaleOf(rhythm);
  const group = hero.nextElementSibling;
  if (!(group instanceof HTMLElement)) throw new Error('no group');
  const list = group.firstElementChild;
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

  // The lead to the cards, laid out and as the rhythm box's gap computes —
  // the bracketed 19.2 steps (4.8rem) under a 48rem column, the 6rem step
  // from it and always inside the band scale (its regime starts at 56rem).
  const width = box(column).width;
  const leadGap = rem(leadToCardsRem(width / rem(1))) * s;
  await expect(
    Math.abs(box(group).top - box(hero).bottom - leadGap),
  ).toBeLessThanOrEqual(1);
  await expect(Math.abs(px(rhythm, 'row-gap') - leadGap)).toBeLessThanOrEqual(
    0.05,
  );
  const columns = width >= rem(56) ? 3 : width >= rem(36) ? 2 : 1;
  await expect(
    getComputedStyle(list).gridTemplateColumns.split(' '),
  ).toHaveLength(columns);
  const gap = px(list, 'column-gap');
  await expect(Math.abs(gap - rem(GRID_GAP_REM) * s)).toBeLessThanOrEqual(0.05);
  const rows = new Map<number, HTMLElement[]>();
  for (const item of items) {
    const top = Math.round(box(item).top);
    rows.set(top, [...(rows.get(top) ?? []), item]);
  }
  await expect(rows.size).toBe(Math.ceil(items.length / columns));
  for (const row of rows.values()) {
    const height = box(row[0] ?? list).height;
    for (const item of row) {
      await expect(Math.abs(box(item).height - height)).toBeLessThanOrEqual(
        0.5,
      );
    }
  }
  const tallest = Math.max(...items.map((item) => box(item).height));
  await expect(JUMP * tallest).toBeLessThan(px(list, 'row-gap'));

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
    if (!nav) throw new Error('the pager is missing');
    await expect(list.nextElementSibling).toBe(nav);
    await expect(
      Math.abs(box(nav).right - box(list).right),
    ).toBeLessThanOrEqual(0.5);
    const below = box(nav).top - box(list).bottom;
    await expect(Math.abs(below - rem(GRID_GAP_REM) * s)).toBeLessThanOrEqual(
      1,
    );
    await expect(JUMP * tallest).toBeLessThan(below);
  } else {
    await expect(nav).toBeNull();
  }
  // The band's end, 2rem under its last box (PostList.tsx's THE BAND: the map
  // that follows opens on its own top step).
  await expect(
    Math.abs(
      box(rhythm).bottom - box(nav ?? list).bottom - rem(ROOM_BELOW_REM) * s,
    ),
  ).toBeLessThanOrEqual(0.5);
}

const meta = {
  title: 'Sections/PostList',
  component: PostList,
  parameters: { layout: 'fullscreen' },
  args: {
    title: ro.blog.hero.title,
    lead: ro.blog.hero.lead,
    tagsLabel: 'Categorii',
    readMore: 'Citește mai mult…',
    ...pageArgs(1),
  },
  argTypes: {
    title: {
      control: 'text',
      description:
        'The page’s one <h1>, the hero’s heading, on ui/Heading’s `hero` step (65.04 design pixels inside the band scale — the doctor page’s name’s size — and there as wide as its first line, up to 100 design pixels past the column a side) — finished text with ONE line break where the stairway turns: two lines on a laptop or desktop, the second the shorter; elsewhere the break is a space',
    },
    lead: {
      control: 'text',
      description:
        'The hero’s grey paragraph under the heading, centred — finished text with TWO line breaks: three lines on a laptop or desktop, each shorter than the one above; elsewhere the breaks are spaces',
    },
    posts: {
      control: 'object',
      description:
        'The posts this page shows, in order — each one sections/PostCard’s content plus its slug (the React key, never an attribute). Empty renders the hero alone',
    },
    tagsLabel: {
      control: 'text',
      description:
        'The accessible name of every card’s tag list, e.g. „Categorii”',
    },
    readMore: {
      control: 'text',
      description: 'Every card’s read-more label, e.g. „Citește mai mult…”',
    },
    pagination: {
      control: 'object',
      description:
        'sections/Pagination’s data, hrefs built by the page; one page (`total` 1) renders no pager',
    },
  },
} satisfies Meta<typeof PostList>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE FIRST PAGE — the owner's shape: the centred hero, the newest posts
 * three to a row and six a page, 2rem apart, the first card's picture loading
 * at once, and the pager under the grid's bottom-right corner — the back disc
 * greyed out, the forward one a link to page 2. Unpinned: the Vitest run
 * renders it at the runner's 1200, a laptop window inside the band scale; the
 * net photographs it at 390 (one column) and 1536 (three, scaled).
 */
export const Default: Story = {
  globals: LOCALE,
  play: async ({ args, canvasElement }) => {
    await loadFaces(canvasElement);
    const h1 = await expectHero(canvasElement, args);
    await expectListAndPager(canvasElement, h1, args);
    await expectNoSidewaysScroll();
  },
};

/**
 * THE LAST PAGE — page 2 of 2 for the twelve drafts, the six oldest posts:
 * the back disc a link to the page before it, the forward one greyed out.
 * Pinned to a phone (390), so the Vitest run proves the one column — each
 * card the column's full width — and the hero in more lines than on a laptop.
 */
export const LastPage: Story = {
  globals: { ...LOCALE, viewport: { value: 'smartphone' } },
  args: pageArgs(TOTAL),
  play: async ({ args, canvasElement }) => {
    await loadFaces(canvasElement);
    const h1 = await expectHero(canvasElement, args);
    await expectListAndPager(canvasElement, h1, args);
    if (TOTAL > 1) {
      const canvas = within(canvasElement);
      await expect(
        canvas.getByRole('button', { name: 'Pagina următoare' }),
      ).toBeDisabled();
      await expect(
        canvas.getByRole('link', { name: 'Pagina anterioară' }),
      ).toHaveAttribute('href', hrefOf(TOTAL - 1));
    }
    await expectNoSidewaysScroll();
  },
};

/**
 * A LAST PAGE THAT IS NOT FULL — page 2 of 2 holding four posts (the blog's
 * newest four, standing in for whatever a last page holds the day the count
 * is not a multiple of six). Three columns leave the second row one card
 * long, and the pager stays at the GRID's end edge, under the empty cells —
 * on every page the same place, so the arrows never move between pages
 * (PostList.tsx's THE PAGER). Pinned to the laptop's 1536, so the Vitest run
 * proves it in three columns, inside the band scale.
 */
export const ShortLastPage: Story = {
  globals: { ...LOCALE, viewport: { value: 'laptop' } },
  args: {
    posts: postsIn(LOCALE.locale).slice(0, 4).map(itemOf),
    pagination: paginationOf(2, 2),
  },
  play: async ({ args, canvasElement }) => {
    await loadFaces(canvasElement);
    const h1 = await expectHero(canvasElement, args);
    await expectListAndPager(canvasElement, h1, args);
    // Where the grid has three columns, the last card stands alone in its
    // row and the pager starts past its end edge, under the empty cells.
    const list = partsOf(h1).hero.nextElementSibling?.firstElementChild;
    if (!(list instanceof HTMLUListElement)) throw new Error('no list');
    const last = list.lastElementChild;
    if (!last) throw new Error('no card');
    const nav = within(canvasElement).getByRole('navigation', {
      name: args.pagination.label,
    });
    if (getComputedStyle(list).gridTemplateColumns.split(' ').length === 3) {
      await expect(box(nav).left).toBeGreaterThan(box(last).right);
    }
    await expectNoSidewaysScroll();
  },
};

/**
 * THE EMPTY BLOG — no posts, so one page: the hero alone, centred, with no
 * list and no pager (PostList.tsx's THE EMPTY STATE: the band is the page,
 * and a page keeps its one <h1>).
 */
export const Empty: Story = {
  globals: LOCALE,
  args: { posts: [], pagination: paginationOf(1, 1) },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await loadFaces(canvasElement);
    const h1 = await expectHero(canvasElement, args);
    const { hero, rhythm } = partsOf(h1);
    await expect(hero.nextElementSibling).toBeNull();
    // No space left behind: the rhythm box ends on its own bottom step, 2rem
    // (× s) right under the hero — a flex gap opens only between boxes that
    // exist.
    await expect(
      Math.abs(
        box(rhythm).bottom -
          box(hero).bottom -
          rem(ROOM_BELOW_REM) * scaleOf(rhythm).s,
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
 * 'stress-320' tag, and pinned there so the Vitest run proves it: the hero
 * centred line by line in more lines than anywhere, every card stacked, the
 * gap still wider than the tallest card's jump, and nothing pushing the page
 * sideways.
 */
export const Narrowest: Story = {
  tags: ['stress-320'],
  globals: { ...LOCALE, viewport: { value: 'stress320' } },
  play: async ({ args, canvasElement }) => {
    await loadFaces(canvasElement);
    const h1 = await expectHero(canvasElement, args);
    await expectListAndPager(canvasElement, h1, args);
    await expectNoSidewaysScroll();
  },
};
