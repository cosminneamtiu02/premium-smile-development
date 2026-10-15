import { render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline — the
// reason this file exists apart from PostList.test.tsx (the header below).
// tests/setup/components.ts loads no CSS globally; the per-file import is the
// house pattern (DoctorIntro, PriceList, Pagination).
import '@/styles/globals.css';
import { locales, type Locale } from '@/i18n/locales';
import { postsIn, postsOnPage, type BlogPost } from '@/lib/blog/blog';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import { PostList, type PostListItem, type PostListProps } from './PostList';
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
  lineTexts,
  linesOf,
  namedAs,
  roomAboveRem,
  segmentsOf,
  wrapStyleAt,
} from './PostList.fixtures';

// sections/PostList — THE BAND, COMPUTED: the hero, the grid and the pager at
// the six named windows (§7) and the owner's 1401 reference, with the real
// stylesheet and the real faces (PostList.tsx's paragraphs THE BAND, THE BAND
// SCALE, THE HERO, THE CAPS, THE LIST and THE PAGER).
//
// ── WHY A FILE OF ITS OWN. PostList.test.tsx pins the band's class TOKENS
// with no stylesheet loaded — its one premise, which every component suite in
// the repo shares. Line counts, columns, gaps and the design pixel are
// COMPUTED things — a class name cannot show one — so they need the sheet,
// and the hero's lines need the real FACE, because a fallback serif sets
// other widths. One premise per file (DoctorIntro.scale.test.tsx's split).
//
// ── WHAT IS MEASURED, per window (the runner's own viewport, set per case —
// ui/Heading's `hero` step reads it — beside the classic 15px scrollbar this
// runner draws, the visual net's own geometry: a 768 window's column is
// 599.4px here, 768 − 15 − 2 × 76.8):
//   · THE REGIME: on at 1280, 1401, 1536, 1920 and 2560, and at 1160 for
//     every language's hero and the heading's reach at its limit (a fine
//     pointer, a column past max(56rem, 896px)), off at 320, 390, 768, 1024
//     and 1100 — and s, the design pixel, min(column, 96rem) / 1106 where it
//     is on. Every case that expects it on checks its PREMISES first and
//     names them (expectScaled): the runner's column against the step, then
//     a fine pointer. The narrowest such window is 1160, not the regime's
//     first (NARROWEST says why).
//   · THE GATES, read from the compiled rules in the CSSOM: the band's own
//     regime tokens — the stairway's line breaks, the heading's reach and
//     its design size — style the page only behind `@supports (color:
//     rgb(from red r g b))`, `@media (pointer: fine)` and both container
//     steps, so a touch screen keeps the theme's natural wrapping. No case
//     here emulates the device (THE GATES' case says why): the touch tablets
//     are tests/e2e/band-scale.spec.ts's, 1180 and 1366, a fresh browser
//     each.
//   · THE HERO, in Romanian: the <h1>'s size — `hero`'s viewport clamp off
//     the regime, the design's 65.04 × s on it (sections/DoctorIntro's
//     name's class, restored on 2026-10-15) — and its LINES (PostList.tsx's
//     THE STAIRWAY): inside the scale the copy's own line breaks hold, so
//     the heading falls in TWO lines and the lead in THREE, each line
//     exactly the message file's segment, each
//     narrower than the one above it by the stairway's steps, the heading's
//     second line wider than the lead's first, and no line wider than its
//     box; off the regime — at 1100 and 1024 on a mouse, at 768 and on a
//     phone — the breaks are spaces and both blocks wrap as prose: neither
//     block's lines are the copy's, and the heading takes more than the
//     stairway's two (expectProse says why the lead's line COUNT is no part
//     of it). No last line of either is ever
//     a single word, none starts with punctuation, no word is cut across two
//     lines. Neither block hyphenates; both wrap `pretty` on a column under
//     48rem and plainly from it, and keep their breaks only where the band is
//     scaled (the computed white-space). Every line centred on the column;
//     48 × s between the two — the hero's computed gap and the distance laid
//     out alike.
//   · THE HEADING'S REACH (PostList.tsx's paragraph of that name): inside the
//     scale the <h1>'s box is centred on the column's centre line, passes
//     neither of its edges by more than 100 design pixels and stays inside
//     the page, nothing to scroll sideways — the page measured by its own box,
//     not by `clientWidth`, which in this runner counts the reserved 15px
//     scrollbar gutter as page and would let 15px of overflow through; off
//     the scale the box stays inside the column. At its LIMIT — a first line
//     longer than the reach, and every language's heading under SC 1.4.12's
//     text spacing — the box is exactly the column plus 100 design pixels a
//     side and the line wraps inside it.
//   · EVERY LANGUAGE'S HERO, as src/messages ships it (PostList.tsx's THE
//     STAIRWAY and THE NO-BREAK SPACES), alone on the page: the copy itself
//     first — one break in the heading, two in the lead, each between two
//     words, and no other character that breaks a line (a carriage return,
//     U+2028, U+2029); then the stairway and the heading's reach inside the
//     scale at 1160, 1280, 1401, 1536, 1920 and 2560, its <h1> at 65.04 × s;
//     and on the 320, 360, 375, 390, 393, 412, 430 and 440 phones and at 768
//     — with no scrollbar, as on a phone or a tablet (`scrollbar-width: none`
//     on the root, proved by the root's own box: as wide as the window), and
//     768 once more behind the classic one — no last line one word, none
//     starting with punctuation, no word cut, the heading inside the column.
//   · THE ROOM (PostList.tsx's THE BAND): above the hero 64, 96 from a 32rem
//     column and 128 from 48rem; from the lead to the cards 76.8, then 96
//     from 48rem — the rhythm box's computed gap and the distance laid out
//     alike; under the pager, the band's last box, 32 at every width — each
//     × s.
//   · THE GRID: one column at 320 and 390, two at 768, three from 1280; every
//     card one track wide; every row one height (the cards fill their items);
//     the gap 32 × s.
//   · THE PAGER: its end edge ON the grid's end edge, 32 × s under the grid.
//   · THE JUMP: a card's 2.5 % (PostCard's THE CARD JUMP) under every gap it
//     grows into — between rows, beside a neighbour, above the pager.
//   · NO SIDEWAYS SCROLL — the page measured by the root's own box, never by
//     its `clientWidth`, which in this runner is the whole window, the
//     reserved 15px scrollbar gutter included (expectReach's reading).
// And three facts of the scale: between 1280 and 1920 the hero's sizes and
// gaps, the cards and the pager grow by the SAME factor, s1920 / s1280 (the
// hero's two BOXES do not: each hugs its longest line, a text measure that
// Source Serif 4's optical size sets narrower per em as it grows — the
// Romanian heading's 0.2 % and its lead's 6.4 % under × s between those two
// windows); under the regime's step (1024 and 1100 windows on a mouse)
// nothing is remapped, and on a touch screen nothing can be (THE GATES); past
// the cap (2560) the band is 96rem wide and centred.
// THE SHARED RULES — the stairway's steps, the jump, the band's room and
// gaps — the line reader and the <h1>'s name matcher are
// PostList.fixtures.ts's, spelled once for this file and PostList.stories.tsx
// (G2 typescript, 2026-10-15).
// THE POSTS are the blog's own first page in Romanian (lib/blog's
// postsIn('ro') — a test of the band may read the data the band never does),
// each reading time worded as the page words it; the heroes are read out of
// the five message files, so the copy measured here is the copy that ships,
// no-break spaces included. Tolerances: a twentieth of a pixel on a box
// (layout rounds to 1/64px), a hundredth on a font size, half a pixel on a
// centre.

/** THE BAND SCALE's numbers, written out (ui/Container's THE BAND SCALE —
 *  their census is tests/unit/design-scale.test.ts): the REFERENCE column and
 *  the CAP at this runner's 16px root (the premise asserts it). */
const REFERENCE = 1106;
const ROOT = 16;
const CAP = 96 * ROOT;

/** THE STEP, written out at the same root: the regime starts where
 *  ui/Container's column reaches max(56rem, 896px) — the band scale's chain
 *  `scalable:@4xl:@min-[896px]:`, a container query against that column. */
const STEP = Math.max(56 * ROOT, 896);

/** THE NARROWEST WINDOW THE CASES SCALE AT — 1160, whose column clears THE
 *  STEP with room on any runner: 913px behind this Mac's classic 15px
 *  scrollbar (1160 − 15 − 2 × 116 — the runner's 10vw counts the
 *  scrollbar), 911 behind a 17px one, 928 with none. Not 1140, the regime's
 *  first window here: its column is 897px, one pixel past the step — a
 *  premise no case should stand on. (PR #166's first CI run, 2026-10-15,
 *  failed every case that started at 1140, but not for that pixel: the
 *  coarse-pointer case this file then had switched Chromium's touch
 *  emulation on and off, and CI's Linux tab came back without a fine
 *  pointer, every later case off the scale whatever its window — THE GATES
 *  now reads that case's answer from the CSSOM.) The narrow end is still
 *  the point: there the design pixel is smallest and Source Serif 4's
 *  optical size sets the smaller type widest per em, so the copy's tightest
 *  lines against their boxes are measured nearest the regime's start —
 *  1160's design pixel is 1.8 % over 1140's (913 / 897). Every case that
 *  expects the scale names its premises first (expectScaled), so a window
 *  at the edge fails as the runner's column, never as a stairway rule. */
const NARROWEST = 1160;

/** The <h1>'s size in the scale, in design pixels: 16.26 spacing steps,
 *  65.04 — sections/DoctorIntro's name's, the `hero` step's value at the
 *  owner's 1401 window (PostList.tsx's THE BAND SCALE: the KEEP-IN-SYNC pair,
 *  restored on 2026-10-15). */
const TITLE_DESIGN = 16.26 * 4;

/** THE HEADING'S REACH (PostList.tsx's paragraph of that name), in design
 *  pixels: how far the <h1>'s box may pass each edge of the column inside
 *  the scale — 25 spacing steps. */
const REACH_DESIGN = 25 * 4;

/** The two caps, in design pixels (PostList.tsx's THE CAPS): the title's 6xl
 *  container step — off the scale; inside it the heading's reach takes its
 *  place — and the lead's 123 spacing steps. */
const TITLE_CAP = 1152;
const LEAD_CAP = 123 * 4;

/** The band's own design lengths (PostList.fixtures.ts's rem, at this
 *  runner's 16px root), in px at s = 1: the title-to-lead gap, 48, the
 *  grid's and the pager's gap, 32, and the room under the pager, 32 — the
 *  same at every width. */
const HERO_GAP = HERO_GAP_REM * ROOT;
const GRID_GAP = GRID_GAP_REM * ROOT;
const ROOM_BELOW = ROOM_BELOW_REM * ROOT;

/** The two lengths that follow ui/Container's column steps (32rem and 48rem
 *  of the column), in px at s = 1 for a column in px: the room above the
 *  hero, 64 / 96 / 128, and the gap from the lead to the cards, 76.8 / 96
 *  (PostList.fixtures.ts's rules). */
const roomAbove = (column: number): number =>
  roomAboveRem(column / ROOT) * ROOT;
const leadToCards = (column: number): number =>
  leadToCardsRem(column / ROOT) * ROOT;

/** A hero's copy, as a message file holds it. */
type HeroCopy = { title: string; lead: string };

/** Every language's hero as the message files ship it — the copy
 *  PostList.tsx's THE STAIRWAY records (its line breaks and no-break spaces
 *  included) — one row per locale of src/i18n/locales, which the cases
 *  below iterate: a sixth language without a row here fails to compile. */
const HEROES = {
  ro: ro.blog.hero,
  en: en.blog.hero,
  de: de.blog.hero,
  fr: fr.blog.hero,
  it: it_.blog.hero,
} as const satisfies Record<Locale, HeroCopy>;

/** The Romanian page's hero, which the band's other cases render. */
const TITLE = HEROES.ro.title;
const LEAD = HEROES.ro.lead;
const NAV_LABEL = 'Paginile articolelor';

/** A post as the page hands it to the band (app/[locale]/blog/populate.ts):
 *  the reading time worded, the rest as the data holds it. */
const itemOf = (post: BlogPost): PostListItem => ({
  slug: post.slug,
  title: post.title,
  summary: post.summary,
  author: post.author,
  readingTime: `${post.readingMinutes} min de citit`,
  image: post.image,
  tags: post.tags,
});

/** The blog's first page, a pager to page 2 — the shape the page builds. */
const PROPS: PostListProps = {
  title: TITLE,
  lead: LEAD,
  tagsLabel: 'Categorii',
  readMore: 'Citește mai mult…',
  posts: postsOnPage(1, postsIn('ro')).map(itemOf),
  pagination: {
    label: NAV_LABEL,
    current: 1,
    total: 2,
    status: 'Pagina 1 din 2',
    previousLabel: 'Pagina anterioară',
    nextLabel: 'Pagina următoare',
    nextHref: '/ro/blog/page/2/',
  },
};

// The REAL typefaces, as Pagination.scale.test.tsx loads Source Serif 4: the
// declarations .storybook/preview-fonts.css makes for Storybook, verbatim
// apart from the URLs — this runner serves the repo from its root — and
// `font-display: block`, so a fallback is never measured. The mono face sets
// every card's author line, and with it the cards' heights. Then THE
// STILLNESS: an unlayered `transition: none` beats the layered utilities, so
// nothing is read mid-fade or mid-jump.
const SERIF = 'Source Serif 4 SB';
const MONO = 'JetBrains Mono SB';
const INJECTED_CSS = `
@font-face {
  font-family: '${SERIF}';
  src: url('/src/fonts/SourceSerif4Variable-subset.woff2') format('woff2');
  font-weight: 200 900;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: '${MONO}';
  src: url('/src/fonts/JetBrainsMonoVariable-subset.woff2') format('woff2');
  font-weight: 100 800;
  font-style: normal;
  font-display: block;
}
:root { --font-source-serif: '${SERIF}'; --font-jetbrains-mono: '${MONO}'; }
*, *::before, *::after { transition: none; }
`;
/** SC 1.4.12's text spacing as its Understanding document sets it — line
 *  height 1.5, letter spacing 0.12em, word spacing 0.16em, paragraph spacing
 *  2em — every one `!important`, as a reader's own style sheet would be
 *  (THE HEADING'S REACH at its limit). */
const TEXT_SPACING = `
* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
p { margin-bottom: 2em !important; }
`;
let injected: HTMLStyleElement | null = null;
let window0 = { width: 0, height: 0 };
let lang0: string | null = null;

beforeAll(async () => {
  // Recorded FIRST, so `afterAll` can put the window back even when a
  // premise below fails.
  window0 = { width: window.innerWidth, height: window.innerHeight };
  lang0 = document.documentElement.getAttribute('lang');
  // Romanian, the house default (§13): the `lang` gives the site-wide
  // `hyphens: auto` its dictionary, as the shell's <html lang> does.
  document.documentElement.lang = 'ro';
  injected = document.createElement('style');
  injected.textContent = INJECTED_CSS;
  document.head.append(injected);
  // load(), not just ready: nothing has rendered yet, so there is no pending
  // font for `ready` to wait on — and a 404 on a subset REJECTS here, loudly.
  await document.fonts.load(`1rem "${SERIF}"`);
  await document.fonts.load(`1rem "${MONO}"`);
  await document.fonts.ready;
});

afterAll(async () => {
  injected?.remove();
  injected = null;
  if (lang0 === null) document.documentElement.removeAttribute('lang');
  else document.documentElement.lang = lang0;
  await page.viewport(window0.width, window0.height);
});

/** The node a query found, as an HTMLElement — or a failure that NAMES what
 *  went missing (PriceList.scale.test.tsx's `htmlElement`). */
const htmlElement = (
  node: Element | null | undefined,
  name: string,
): HTMLElement => {
  if (!(node instanceof HTMLElement)) throw new Error(`PostList: no ${name}`);
  return node;
};

const box = (element: Element): DOMRect => element.getBoundingClientRect();

const px = (element: Element, property: string): number =>
  parseFloat(getComputedStyle(element).getPropertyValue(property));

/** IS THE REGIME ON for this box? globals.css's `design-scale` remaps
 *  `--spacing` on the box that wears it; elsewhere a box inherits the root's
 *  (DoctorIntro.scale.test.tsx's `remapped`). */
const remapped = (element: Element): boolean =>
  getComputedStyle(element).getPropertyValue('--spacing') !==
  getComputedStyle(document.documentElement).getPropertyValue('--spacing');

/** The primary pointer this runner reports now — what the regime's
 *  `scalable:` variant asks of it (globals.css's THE SCALABLE VARIANT). */
const pointerNow = (): string =>
  (['fine', 'coarse', 'none'] as const).find(
    (kind) => window.matchMedia(`(pointer: ${kind})`).matches,
  ) ?? 'unknown';

/** THE SCALE, EXPECTED ON — its PREMISES first, each named, so a case that
 *  fails here reads as the runner's geometry or state, never as a stairway
 *  or a reach rule: the column the runner lays out at this window
 *  (ui/Container's box, the rhythm box's parent — the box the container
 *  queries read) clears THE STEP; the primary pointer is fine — a tab left
 *  without one turns every case after it off the scale, as Chromium's touch
 *  emulation switched on and off did on CI's Linux (PR #166's first run,
 *  2026-10-15; nothing in this folder emulates the device now); then the
 *  regime itself, remapped. */
const expectScaled = (rhythm: HTMLElement, where = ''): void => {
  const column = box(
    htmlElement(rhythm.parentElement, 'ui/Container column'),
  ).width;
  expect(
    column,
    `${where}the runner’s column is ${column}px — the regime starts at ${STEP}px`,
  ).toBeGreaterThanOrEqual(STEP);
  expect(
    pointerNow(),
    `${where}the runner’s primary pointer — the regime asks for a fine one`,
  ).toBe('fine');
  expect(
    remapped(rhythm),
    `${where}the regime is on — a ${column}px column, a fine pointer`,
  ).toBe(true);
};

/** One `vw` of this window in px, read off a probe — what ui/Heading's
 *  `hero` clamp reads (DoctorIntro.scale.test.tsx's `vw`). */
const vw = (): number => {
  const probe = document.createElement('div');
  probe.style.width = '100vw';
  document.body.append(probe);
  try {
    return box(probe).width / 100;
  } finally {
    probe.remove();
  }
};

/** `actual` within `tolerance` of `expected`, the label and both numbers in
 *  the failure. */
const near = (
  actual: number,
  expected: number,
  label: string,
  tolerance = 0.05,
): void => {
  expect(
    Math.abs(actual - expected),
    `${label}: ${actual} against ${expected}`,
  ).toBeLessThanOrEqual(tolerance);
};

/** The band at this window, and its boxes by structure: section →
 *  ui/Container → the rhythm box → the hero and the group → the grid and the
 *  pager. */
const renderBand = () => {
  const { unmount } = render(<PostList {...PROPS} />);
  // By the name a screen reader hears — the copy's line break a space —
  // whitespace collapsed (PostList.fixtures.ts's namedAs).
  const h1 = screen.getByRole('heading', { level: 1, name: namedAs(TITLE) });
  const hero = htmlElement(h1.parentElement, 'hero');
  const lead = htmlElement(hero.children[1], 'lead');
  const rhythm = htmlElement(hero.parentElement, 'rhythm box');
  const column = htmlElement(rhythm.parentElement, 'ui/Container column');
  const group = htmlElement(hero.nextElementSibling, 'cards-and-pager group');
  const list = htmlElement(group.firstElementChild, 'grid');
  const nav = screen.getByRole('navigation', { name: NAV_LABEL });
  const items = [...list.children].map((item, index) =>
    htmlElement(item, `item ${index + 1}`),
  );
  return { unmount, h1, hero, lead, rhythm, column, group, list, nav, items };
};

type Band = ReturnType<typeof renderBand>;

/** One language's hero alone — its shipped copy, or a copy of a case's own
 *  in that language — no cards, so a sweep of windows stays quick: the
 *  column, the regime and the hero's boxes are the band's either way
 *  (globals.css reserves the scrollbar's gutter whatever the page's height —
 *  `scrollbar-gutter: stable`). The page sets <html lang>; so does this. */
const renderHero = (locale: Locale, copy: HeroCopy = HEROES[locale]) => {
  const { title, lead } = copy;
  document.documentElement.lang = locale;
  const { unmount } = render(
    <PostList {...PROPS} title={title} lead={lead} posts={[]} />,
  );
  const h1 = screen.getByRole('heading', { level: 1 });
  const hero = htmlElement(h1.parentElement, 'hero');
  return {
    unmount: () => {
      unmount();
      document.documentElement.lang = 'ro';
    },
    h1,
    lead: htmlElement(hero.children[1], 'lead'),
    rhythm: htmlElement(hero.parentElement, 'rhythm box'),
  };
};

/** Renders `locale`'s hero — its shipped copy, or `copy` — at each window and
 *  runs `check` on it. */
const sweep = async (
  locale: Locale,
  windows: readonly number[],
  label: string,
  check: (hero: ReturnType<typeof renderHero>, where: string) => void,
  copy: HeroCopy = HEROES[locale],
): Promise<void> => {
  for (const width of windows) {
    await page.viewport(width, 900);
    const hero = renderHero(locale, copy);
    try {
      await document.fonts.ready;
      check(hero, `${locale} at ${width}${label}: `);
    } finally {
      hero.unmount();
    }
  }
};

/** The design pixel this band is drawn in: 1 off the regime. */
const scaleOf = (band: Band): number =>
  remapped(band.rhythm) ? px(band.rhythm, '--scale-px') : 1;

/** A hero's two blocks — the band's, or one language's alone (renderHero). */
type Hero = { h1: HTMLElement; lead: HTMLElement };

/** The two blocks, named for the failure messages. */
const blocksOf = (hero: Hero) =>
  [
    ['the title', hero.h1],
    ['the lead', hero.lead],
  ] as const;

/** Whole words in a text, as the eye counts them: two joined by a no-break
 *  space are two (`\s` matches U+00A0). */
const wordCount = (text: string): number =>
  text.split(/\s+/).filter(Boolean).length;

/** NO LONE LAST WORD (PostList.tsx's THE CAPS): the last line of the title
 *  and of the lead always holds at least two words. */
const expectNoLoneWord = (hero: Hero, where = ''): void => {
  for (const [name, element] of blocksOf(hero)) {
    const last = (lineTexts(element).at(-1) ?? '').trim();
    expect(
      wordCount(last),
      `${where}${name}’s last line, „${last}”`,
    ).toBeGreaterThan(1);
  }
};

/** EVERY LINE WHOLE (PostList.tsx's THE NO-BREAK SPACES): no line starts
 *  with punctuation — French joins its colon to the word before it — and no
 *  word is cut across two lines, which the belt does to a joined unit wider
 *  than the column. A line may end on a word's own hyphen („rendez-vous"
 *  breaks after it, as typesetting allows): only a cut without one counts. */
const expectWholeLines = (hero: Hero, where = ''): void => {
  for (const [name, element] of blocksOf(hero)) {
    const lines = lineTexts(element).map((line) => line.trim());
    for (const [index, line] of lines.entries()) {
      expect(line, `${where}${name}’s line ${index + 1}`).not.toMatch(
        /^[:;!?.,»)]/,
      );
    }
    expect(
      wordCount(lines.join('\n').replaceAll('-\n', '-')),
      `${where}${name}: the words its lines hold`,
    ).toBe(wordCount(element.textContent ?? ''));
  }
};

/** THE STAIRWAY (PostList.tsx's paragraph of that name), wherever the band
 *  is scaled — each rule its own assertion, in this order, so a failure names
 *  the rule it broke:
 *    1. no line wider than its box — the white-space wraps a line too long
 *       for its box, never lets it spill;
 *    2. the heading in exactly TWO lines and the lead in exactly THREE;
 *    3. each line exactly its segment of the copy — the breaks are the copy's,
 *       not the wrap's;
 *    4. the steps (PostList.fixtures.ts's): the heading's second line at
 *       most 0.9 of its first, the lead's second at most 0.95 of its first
 *       and its third at most 0.9 of its second;
 *    5. the stair runs on into the lead: the heading's second line wider
 *       than the lead's first. */
const expectStairway = (hero: Hero, copy: HeroCopy, where = ''): void => {
  for (const [name, element] of blocksOf(hero)) {
    const width = box(element).width;
    for (const [index, line] of linesOf(element).entries()) {
      expect(
        line.width,
        `${where}${name}’s line ${index + 1} inside its ${width}px box`,
      ).toBeLessThanOrEqual(width + 0.5);
    }
  }
  const title = linesOf(hero.h1).map(({ width }) => width);
  const lead = linesOf(hero.lead).map(({ width }) => width);
  expect(title, `${where}the title’s lines`).toHaveLength(2);
  expect(lead, `${where}the lead’s lines`).toHaveLength(3);
  expect(lineStrings(hero.h1), `${where}the title’s lines, as text`).toEqual(
    segmentsOf(copy.title),
  );
  expect(lineStrings(hero.lead), `${where}the lead’s lines, as text`).toEqual(
    segmentsOf(copy.lead),
  );
  const [t1 = 0, t2 = Infinity] = title;
  const [l1 = 0, l2 = Infinity, l3 = Infinity] = lead;
  expect(
    t2,
    `${where}the title’s second line against its first`,
  ).toBeLessThanOrEqual(TITLE_STEP * t1);
  expect(
    l2,
    `${where}the lead’s second line against its first`,
  ).toBeLessThanOrEqual(LEAD_FIRST_STEP * l1);
  expect(
    l3,
    `${where}the lead’s third line against its second`,
  ).toBeLessThanOrEqual(LEAD_STEP * l2);
  expect(
    t2,
    `${where}the title’s second line against the lead’s first`,
  ).toBeGreaterThan(l1);
};

/** OFF THE REGIME both blocks are PROSE (PostList.tsx's THE STAIRWAY), held
 *  by what makes them prose — each rule its own assertion, in this order, so
 *  a failure names the rule it broke:
 *    1. the computed white-space `normal` on both — the copy's line breaks
 *       collapse into spaces (expectBand reads it at every window too);
 *    2. neither block's rendered lines are the copy's segments — the
 *       laptop's breaks are absent, whatever the cause: a white-space that
 *       keeps them, or breaks written into the markup, which rule 1 cannot
 *       see;
 *    3. the heading in more lines than the stairway's two — the Romanian one
 *       in five at 320, four at 390 and three from 768 to the regime's step
 *       (this runner, behind its classic scrollbar), with margin: set on one
 *       line its words are longer than two of its boxes by 8.7 % at 1100, the
 *       tightest here, 11.9 % at 1024 and 26.9 % at 768 — and by 6.4 % on a
 *       coarse pointer at 1600 and 1920, 72px under the 1152 cap (measured in
 *       this file before THE GATES replaced its touch-emulation case; the
 *       device is tests/e2e/band-scale.spec.ts's now).
 *  NOT THE LEAD'S LINE COUNT (G2 react and typescript, 2026-10-15). Its
 *  Romanian lines here are 477.95, 430.14 and 58.45px at 1024 and 1100 (on
 *  that coarse pointer too): the last, „o vizită." (two words joined), would end
 *  the second line at 492.34px under a cap of 492, so the lead is three lines
 *  by a third of a pixel — and Linux's Chromium, where CI runs, sets Source
 *  Serif 4 a pixel or two apart from this Mac's (the repo's darwin and linux
 *  baselines show it at 16px). Nor would a count prove prose: the stairway's
 *  own lead is three lines. Rule 2 has margin where the count had none — at
 *  1024 the first line runs on past the colon to „cum să": to end at the
 *  colon it would have to refuse „cum", and the colon's segment with „cum"
 *  is 458.4px, 33.6 inside the cap; at 768 `pretty` ends it at the colon,
 *  but the second runs on past „acasă" to „e bine să" (its „ne faci" joined
 *  since the copy review of 2026-10-15). */
const expectProse = (hero: Hero, copy: HeroCopy, where = ''): void => {
  for (const [name, element] of blocksOf(hero)) {
    expect(
      getComputedStyle(element).whiteSpace,
      `${where}${name}’s line breaks, off the scale`,
    ).toBe('normal');
  }
  expect(
    lineStrings(hero.h1),
    `${where}the title’s lines, as text — never the copy’s segments`,
  ).not.toEqual(segmentsOf(copy.title));
  expect(
    lineStrings(hero.lead),
    `${where}the lead’s lines, as text — never the copy’s segments`,
  ).not.toEqual(segmentsOf(copy.lead));
  expect(linesOf(hero.h1).length, `${where}the title’s lines`).toBeGreaterThan(
    2,
  );
};

/** NOTHING TO SCROLL SIDEWAYS (§7, §9) — the page measured by the root's own
 *  box, which ends where this runner's reserved 15px scrollbar gutter begins.
 *  Never by `clientWidth`: here it is the whole window, gutter included, on a
 *  short page and a long one alike (measured, 2026-10-15: 1140 against a
 *  1125px box at a 1140 window), so a check against it lets 15px of overflow
 *  through (G2 typescript). */
const expectNoSideways = (where = ''): void => {
  const root = document.documentElement;
  const page = box(root).width;
  expect(
    root.scrollWidth,
    `${where}nothing to scroll sideways — the page ${page}px wide`,
  ).toBeLessThanOrEqual(Math.ceil(page));
};

/** THE HEADING'S REACH (PostList.tsx's paragraph of that name), each rule
 *  its own assertion — the column being the rhythm box, the band's own
 *  (capped and centred at 96rem past a 1920 window):
 *    · wherever the band is scaled, the <h1>'s box CENTRED on the column's
 *      centre line (± 0.5px), passing NEITHER of its edges by more than 100
 *      design pixels, and inside the PAGE with nothing to scroll sideways
 *      (expectNoSideways: the page measured by the root's own box);
 *    · anywhere else, the box INSIDE the column. */
const expectReach = (
  hero: { h1: HTMLElement; rhythm: HTMLElement },
  where = '',
): void => {
  const column = box(hero.rhythm);
  const heading = box(hero.h1);
  if (!remapped(hero.rhythm)) {
    expect(
      heading.left,
      `${where}the title’s box from the column’s start`,
    ).toBeGreaterThanOrEqual(column.left - 0.05);
    expect(
      heading.right,
      `${where}the title’s box to the column’s end`,
    ).toBeLessThanOrEqual(column.right + 0.05);
    return;
  }
  const reach = REACH_DESIGN * px(hero.rhythm, '--scale-px');
  near(
    heading.left + heading.width / 2,
    column.left + column.width / 2,
    `${where}the title’s box centred on the column`,
    0.5,
  );
  expect(
    column.left - heading.left,
    `${where}the title’s box past the column’s start (${reach}px allowed)`,
  ).toBeLessThanOrEqual(reach + 0.05);
  expect(
    heading.right - column.right,
    `${where}the title’s box past the column’s end (${reach}px allowed)`,
  ).toBeLessThanOrEqual(reach + 0.05);
  const page = box(document.documentElement);
  expect(
    heading.left,
    `${where}the title’s box from the page’s start`,
  ).toBeGreaterThanOrEqual(page.left);
  expect(
    heading.right,
    `${where}the title’s box to the page’s end`,
  ).toBeLessThanOrEqual(page.right);
  expectNoSideways(where);
};

/** The grid's rows: its items grouped by their top. */
const rowsOf = (band: Band): HTMLElement[][] => {
  const rows = new Map<number, HTMLElement[]>();
  for (const item of band.items) {
    const top = Math.round(box(item).top * 2) / 2;
    rows.set(top, [...(rows.get(top) ?? []), item]);
  }
  return [...rows.values()];
};

/** Every fact of the header's list that holds at any window: the hero
 *  centred, the band's room and gaps, the grid's tracks and rows, the pager
 *  under the grid's end edge, the jump under every gap, no lone last word,
 *  nothing sideways. */
const expectBand = (band: Band, s: number, columns: number): void => {
  const { h1, hero, lead, rhythm, column, group, list, nav, items } = band;
  const middle = box(rhythm).left + box(rhythm).width / 2;
  for (const [name, element] of [
    ['the title', h1],
    ['the lead', lead],
  ] as const) {
    for (const [index, line] of linesOf(element).entries()) {
      near(
        line.left + line.width / 2,
        middle,
        `${name}’s line ${index + 1} centred`,
        0.5,
      );
    }
  }
  expectNoLoneWord(band);
  expectWholeLines(band);
  // THE HEADING'S REACH: past the column inside the scale, centred and
  // bounded; inside it everywhere else.
  expectReach(band);

  // THE WRAP (THE HERO): neither block hyphenates, and both wrap `pretty` on
  // a column under 48rem — a phone's or a tablet's — and plainly from it;
  // THE STAIRWAY: both keep the copy's own line breaks where the band is
  // scaled and nowhere else (the pre-line white-space preserves them, the
  // normal one makes each a space).
  const wrap = wrapStyleAt(box(column).width / ROOT);
  const scaled = remapped(rhythm);
  for (const [name, element] of [
    ['the title', h1],
    ['the lead', lead],
  ] as const) {
    const style = getComputedStyle(element);
    expect(style.hyphens, `${name}’s hyphens`).toBe('none');
    expect(
      style.getPropertyValue('text-wrap-style'),
      `${name}’s wrap at a ${box(column).width}px column`,
    ).toBe(wrap);
    expect(
      style.whiteSpace,
      `${name}’s line breaks, the band ${scaled ? '' : 'not '}scaled`,
    ).toBe(scaled ? 'pre-line' : 'normal');
  }

  // THE ROOM AND THE GAPS (THE BAND): above the hero on the column's steps,
  // the title to its lead, the lead to the cards on the column's 48rem step.
  const steps = box(column).width;
  near(
    box(h1).top - box(rhythm).top,
    roomAbove(steps) * s,
    'the band’s top → the title',
  );
  near(box(lead).top - box(h1).bottom, HERO_GAP * s, 'title → lead');
  near(
    box(group).top - box(hero).bottom,
    leadToCards(steps) * s,
    'lead → cards',
  );
  // …and the same two gaps as the engine COMPUTES them, before layout rounds
  // a box to 1/64px: a flex column's gap is its `row-gap`, the hero's and the
  // rhythm box's — the bracketed 19.2 steps (4.8rem) under a 48rem column,
  // which the regime never reaches (it starts at 56rem).
  near(px(hero, 'row-gap'), HERO_GAP * s, 'the hero’s computed gap', 0.01);
  near(
    px(rhythm, 'row-gap'),
    leadToCards(steps) * s,
    'the rhythm box’s computed gap',
    0.01,
  );

  // THE GRID: its tracks, one card a track, every row one height.
  expect(
    getComputedStyle(list).gridTemplateColumns.split(' '),
    'the grid’s tracks',
  ).toHaveLength(columns);
  const gap = px(list, 'column-gap');
  near(gap, GRID_GAP * s, 'the grid’s gap', 0.01);
  near(px(list, 'row-gap'), GRID_GAP * s, 'the grid’s row gap', 0.01);
  const track = (box(list).width - (columns - 1) * gap) / columns;
  for (const [index, item] of items.entries()) {
    near(box(item).width, track, `card ${index + 1}’s width`);
    // The card fills its item (`h-full`): its frame is the row's height. Read
    // as COMPUTED heights — layout, which the jump's 105 % transform under a
    // resting real pointer never touches (the <li>'s box is not transformed
    // either; the <article>'s painted box would be).
    near(
      px(htmlElement(item.firstElementChild, 'article'), 'height'),
      px(item, 'height'),
      `card ${index + 1} fills its item`,
    );
  }
  const rows = rowsOf(band);
  expect(rows).toHaveLength(Math.ceil(items.length / columns));
  for (const row of rows) {
    const [first] = row;
    for (const item of row) {
      near(box(item).height, box(first ?? item).height, 'a row’s one height');
    }
  }

  // THE PAGER: under the grid's end edge, one gap down — and the band's last
  // box, 2rem (× s) over the band's end at every width (THE BAND).
  near(box(nav).right, box(list).right, 'the pager’s end edge on the grid’s');
  near(box(nav).top - box(list).bottom, GRID_GAP * s, 'grid → pager');
  near(
    box(rhythm).bottom - box(nav).bottom,
    ROOM_BELOW * s,
    'pager → the band’s end',
  );

  // THE JUMP: a card's 2.5 % under every gap it grows into.
  const tallest = Math.max(...items.map((item) => box(item).height));
  const widest = Math.max(...items.map((item) => box(item).width));
  expect(JUMP * tallest, 'the jump between rows').toBeLessThan(
    px(list, 'row-gap'),
  );
  expect(JUMP * tallest, 'the jump above the pager').toBeLessThan(
    box(nav).top - box(list).bottom,
  );
  if (columns > 1) {
    expect(JUMP * widest, 'the jump beside a neighbour').toBeLessThan(gap);
  }

  // NOTHING SIDEWAYS (§7, §9), the page measured by its own box.
  expectNoSideways();
};

describe('PostList — the band, computed (the real stylesheet and faces)', () => {
  beforeAll(() => {
    // THE PREMISES: the real faces; the 16px root CAP is written at; and a
    // place where the regime CAN apply — a fine primary pointer and an engine
    // that registers custom properties, the two conditions of globals.css's
    // THE SCALABLE VARIANT. Otherwise every case below that expects the scale
    // would fail for a reason that reads as the band's, and every case that
    // expects none would pass for the wrong one.
    expect(document.fonts.check(`1rem "${SERIF}"`), SERIF).toBe(true);
    expect(document.fonts.check(`1rem "${MONO}"`), MONO).toBe(true);
    expect(px(document.documentElement, 'font-size'), 'the 16px root').toBe(
      ROOT,
    );
    expect(window.matchMedia('(pointer: fine)').matches, 'a fine pointer').toBe(
      true,
    );
    expect(
      CSS.supports('color', 'rgb(from red r g b)'),
      'the registration gate',
    ).toBe(true);
  });

  it.each([
    { width: 320, height: 568, columns: 1 },
    { width: 390, height: 844, columns: 1 },
    { width: 768, height: 1024, columns: 2 },
  ])(
    'draws the $width window in the theme’s rem — $columns column(s), the title on `hero`’s clamp, the hero wrapped as prose, never a lone last word',
    async ({ width, height, columns }) => {
      await page.viewport(width, height);
      const band = renderBand();
      await document.fonts.ready;

      expect(remapped(band.rhythm), 'nothing remapped').toBe(false);
      near(
        px(band.h1, 'font-size'),
        Math.min(4.5 * ROOT, Math.max(2 * ROOT, ROOT + 3.5 * vw())),
        'the title, `hero`’s clamp',
        0.01,
      );
      near(px(band.lead, 'font-size'), 16, 'the lead', 0.01);
      // A phone and a tablet keep no stairway: the copy's breaks are spaces
      // there (THE STAIRWAY), and the Romanian heading takes three lines at
      // 768, four at 390, five at 320.
      expectProse(band, HEROES.ro);
      expectBand(band, 1, columns);
      band.unmount();
    },
  );

  it.each([
    { width: 1280, height: 800 },
    { width: 1401, height: 1063 },
    { width: 1536, height: 864 },
    { width: 1920, height: 1080 },
  ])(
    'draws the $width window as the 1401 design × s — three columns, the title at 65.04 × s on the stairway: TWO lines, then the lead’s THREE, each narrower than the one above, the title’s box past the column by the same amount a side',
    async ({ width, height }) => {
      await page.viewport(width, height);
      const band = renderBand();
      await document.fonts.ready;

      expectScaled(band.rhythm);
      const s = scaleOf(band);
      near(s, Math.min(box(band.column).width, CAP) / REFERENCE, 's', 0.0001);
      expectStairway(band, HEROES.ro);
      near(px(band.h1, 'font-size'), TITLE_DESIGN * s, 'the title', 0.01);
      near(px(band.lead, 'font-size'), 16 * s, 'the lead', 0.01);
      // The lead's cap, in design pixels (THE CAPS); the title's limit inside
      // the scale is its reach, which expectBand holds (THE HEADING'S REACH).
      near(px(band.lead, 'max-width'), LEAD_CAP * s, 'the lead’s cap', 0.01);
      // Not held to the column: the Romanian first line, 1183.5 design
      // pixels at 1401, is wider than the column's 1106 at every window here.
      expect(
        box(band.h1).width,
        'the title’s box wider than the column',
      ).toBeGreaterThan(box(band.rhythm).width);
      expectBand(band, s, 3);
      band.unmount();
    },
  );

  it('grows the hero’s sizes and gaps, the cards and the pager by ONE factor between a 1280 and a 1920 window — s1920 / s1280', async () => {
    const read = async (width: number, height: number) => {
      await page.viewport(width, height);
      const band = renderBand();
      await document.fonts.ready;
      expectScaled(band.rhythm, `${width}: `);
      // The hero's two BOXES are left out: each hugs its longest line, a text
      // measure that Source Serif 4's optical size sets narrower per em as it
      // grows (the header's three facts) — their lines are THE STAIRWAY's,
      // held in design pixels by expectStairway.
      const seen = {
        s: scaleOf(band),
        'the title’s size': px(band.h1, 'font-size'),
        'the lead’s size': px(band.lead, 'font-size'),
        'a card’s width': box(band.items[0] ?? band.list).width,
        'the grid’s gap': px(band.list, 'column-gap'),
        'the room above the hero': box(band.h1).top - box(band.rhythm).top,
        'the title-to-lead gap': box(band.lead).top - box(band.h1).bottom,
        'the lead-to-cards gap': box(band.group).top - box(band.hero).bottom,
        'the room under the pager':
          box(band.rhythm).bottom - box(band.nav).bottom,
        'the pager’s width': box(band.nav).width,
        'the pager’s height': box(band.nav).height,
      };
      band.unmount();
      return seen;
    };
    const small = await read(1280, 800);
    const large = await read(1920, 1080);
    const factor = large.s / small.s;
    expect(factor, 'the two windows sit inside the regime').toBeGreaterThan(1);
    for (const [label, value] of Object.entries(small)) {
      if (label === 's') continue;
      const grown = large[label as keyof typeof large];
      // The pager's counter is set a little narrower per em as it grows
      // (Source Serif 4's optical size — Pagination's THE BAND SCALE): its
      // row is held to 1 %, everything else to a thousandth.
      const tolerance = label.startsWith('the pager') ? 0.01 : 0.001;
      near(grown / value, factor, label, tolerance * factor);
    }
  });

  it('draws nothing remapped under the regime’s step — a 1100 window on a mouse: two columns, the title on `hero`’s clamp under its 6xl cap, the hero wrapped as prose', async () => {
    await page.viewport(1100, 800);
    const band = renderBand();
    await document.fonts.ready;

    expect(box(band.column).width).toBeLessThan(56 * ROOT);
    expect(remapped(band.rhythm), 'nothing remapped').toBe(false);
    near(
      px(band.h1, 'font-size'),
      ROOT + 3.5 * vw(),
      'the title, `hero`’s clamp',
      0.01,
    );
    // Off the scale the title keeps the 6xl container step as its cap, never
    // the heading's reach (THE CAPS; THE GATES below reads why a touch screen
    // keeps it too).
    near(px(band.h1, 'max-width'), TITLE_CAP, 'the title’s cap', 0.01);
    expectProse(band, HEROES.ro);
    expectBand(band, 1, 2);
    band.unmount();
  });

  it('draws a 1024 window on a mouse unremapped — the hero wrapped as prose under its caps, two columns', async () => {
    await page.viewport(1024, 768);
    const band = renderBand();
    await document.fonts.ready;

    expect(remapped(band.rhythm), 'nothing remapped').toBe(false);
    // The Romanian heading in three lines here, its 51.8px type in an
    // 804.2px column behind this runner's classic scrollbar; the lead's first
    // line runs on past the copy's colon to „cum să" under its 492px cap
    // (PostList.tsx's THE STAIRWAY: off the regime the copy's breaks are
    // spaces).
    expectProse(band, HEROES.ro);
    expectBand(band, 1, 2);
    band.unmount();
  });

  it('caps the band at 96rem past a 1920 window and centres it in the column — a 2560 window', async () => {
    await page.viewport(2560, 1440);
    const band = renderBand();
    await document.fonts.ready;

    // The premises first: the cap is the band scale's too (`scalable:`).
    expectScaled(band.rhythm);
    const column = box(band.column);
    const rhythm = box(band.rhythm);
    expect(column.width).toBeGreaterThan(CAP);
    near(rhythm.width, CAP, 'the band’s width');
    near(
      rhythm.left - column.left,
      column.right - rhythm.right,
      'the band centred',
    );
    const s = scaleOf(band);
    near(s, CAP / REFERENCE, 's at the cap', 0.0001);
    expectStairway(band, HEROES.ro);
    near(px(band.h1, 'font-size'), TITLE_DESIGN * s, 'the title', 0.01);
    expectBand(band, s, 3);
    band.unmount();
  });

  // THE GATES (PostList.tsx's THE BAND SCALE, THE STAIRWAY and THE HEADING'S
  // REACH), read from the compiled rules in the CSSOM: the band's own regime
  // tokens — the stairway's line breaks on the heading and on the lead, the
  // heading's reach (its max-content width and its cap past the column) and
  // its 16.26-step design size — style the page ONLY behind the band scale's
  // whole chain: globals.css's THE SCALABLE VARIANT, `@supports (color:
  // rgb(from red r g b))` and `@media (pointer: fine)`, then both container
  // steps, 56rem and the 896px floor. So a touch screen as wide as a desktop
  // keeps the theme's natural wrapping: the copy's breaks spaces, the `hero`
  // clamp, the 6xl cap. (The rhythm box's two band-scale strings are
  // ui/Container's, their gates DoctorShowcase.test.tsx's THE GATES.)
  //   THE DEVICE ITSELF is driven end to end, a fresh browser per window:
  // tests/e2e/band-scale.spec.ts's touch tablets on the blog, 1180 × 820 and
  // 1366 × 1024, a coarse pointer. Never here: Chromium's touch emulation
  // switched on and off inside this shared runner left CI's Linux tab
  // without a fine pointer — every later case and file in that tab off the
  // scale or without hover. This file's own coarse-pointer case did it on PR
  // #166's first run (2026-10-15), as DoctorShowcase.test.tsx's THE GATES
  // records for its band on 2026-10-01; this is its CSSOM walk, copied.
  //   A token is chosen by the regime chain it carries — any of its three
  // variants — never by its name, so the check reads whatever the band wears
  // (and spells no class of its own, which Tailwind would compile into the
  // site's stylesheet): a token that lost one link of the chain, its
  // `scalable:` above all, is still chosen, and fails a gate below.
  it('puts every rule of the band’s own regime tokens behind THE GATES in the real stylesheet — `@supports (color: rgb(from red r g b))`, `@media (pointer: fine)` and both container steps, 56rem and 896px — so a touch screen keeps the theme’s natural wrapping', () => {
    const band = renderBand();
    try {
      const chain = ['scalable:', '@4xl:', '@min-[896px]:'];
      const regimeTokens = (element: HTMLElement): string[] =>
        [...element.classList].filter((token) =>
          chain.some((variant) => token.includes(variant)),
        );
      // Four on the <h1> — the stairway, the reach's two, the size — and
      // the stairway on the lead.
      const title = regimeTokens(band.h1);
      const lead = regimeTokens(band.lead);
      expect(title, 'the title’s regime tokens').toHaveLength(4);
      expect(lead, 'the lead’s regime tokens').toHaveLength(1);
      const tokens = [...new Set([...title, ...lead])];

      const found = new Map<string, string[][]>(
        tokens.map((token) => [token, []]),
      );
      const walk = (rules: CSSRuleList, conditions: string[]): void => {
        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSStyleRule) {
            for (const token of tokens) {
              if (rule.selectorText === `.${CSS.escape(token)}`) {
                found.get(token)?.push(conditions);
              }
            }
          } else if (rule instanceof CSSSupportsRule) {
            walk(rule.cssRules, [
              ...conditions,
              `supports ${rule.conditionText}`,
            ]);
          } else if (rule instanceof CSSMediaRule) {
            walk(rule.cssRules, [
              ...conditions,
              `media ${rule.media.mediaText}`,
            ]);
          } else if (rule instanceof CSSContainerRule) {
            walk(rule.cssRules, [
              ...conditions,
              `container ${rule.conditionText}`,
            ]);
          } else if ('cssRules' in rule) {
            walk((rule as CSSGroupingRule).cssRules, conditions);
          }
        }
      };
      for (const sheet of Array.from(document.styleSheets)) {
        walk(sheet.cssRules, []);
      }

      const gates = [
        [
          'the registration gate',
          /^supports \(?color: rgb\(from red r g b\)\)?$/,
        ],
        ['a fine pointer', /^media \(pointer: fine\)$/],
        [
          'the 56rem container step',
          /^container \((?:min-width: 56rem|width >= 56rem)\)$/,
        ],
        [
          'the 896px container floor',
          /^container \((?:min-width: 896px|width >= 896px)\)$/,
        ],
      ] as const;
      for (const token of tokens) {
        const rules = found.get(token) ?? [];
        expect(rules.length, `${token}: compiled`).toBeGreaterThan(0);
        for (const conditions of rules) {
          const under = conditions.join(' › ') || 'no condition at all';
          for (const [gate, pattern] of gates) {
            expect(
              conditions.some((condition) => pattern.test(condition)),
              `${token}, under ${under}: ${gate}`,
            ).toBe(true);
          }
        }
      }
    } finally {
      band.unmount();
    }
  });

  // EVERY LANGUAGE (PostList.tsx's THE STAIRWAY and THE NO-BREAK SPACES): the
  // five message files' heroes, as shipped, held to the owner's rule — the
  // copy breaks its heading once and its lead twice; inside the scale those
  // breaks hold, the stairway falls from the heading's first line to the
  // lead's last and the <h1> is 65.04 × s; and on every phone and at 768 no
  // last line of either block one word, no line starting with punctuation, no
  // word cut across two lines. One case per locale of src/i18n/locales.
  // Chromium alone, the components project's one engine; WebKit and Firefox
  // were measured for PostList.tsx's record.
  describe('every language’s hero, as the message files ship it', () => {
    it.each(locales)(
      'breaks the %s copy where the stairway turns — ONE line break in the heading, TWO in the lead, each between two words, and no other character that breaks a line',
      (locale) => {
        const { title, lead } = HEROES[locale];
        expect(
          title.split('\n'),
          `${locale}: the heading’s lines`,
        ).toHaveLength(2);
        expect(lead.split('\n'), `${locale}: the lead’s lines`).toHaveLength(3);
        for (const [name, text] of [
          ['the heading', title],
          ['the lead', lead],
        ] as const) {
          // The `\n` is the ONE break the stairway reads (the pre-line
          // white-space keeps it, segmentsOf splits on it). Its look-alikes
          // are refused: a carriage return is a space to CSS (and a CRLF copy
          // would hang one beside every break), and U+2028 and U+2029 —
          // mandatory breaks to Unicode's line-breaking rules — break no line
          // in Chromium under either white-space (measured, 2026-10-15): a
          // turn written with any of the three would not turn where the
          // stairway counts one, nor alike in every engine.
          expect(
            text,
            `${locale}: ${name}, a line break other than the \\n`,
          ).not.toMatch(/[\r\u2028\u2029]/);
          // A space beside a break — U+00A0 included, which never collapses —
          // would hang at a line's end or open the next one, and no break may
          // open or close the block.
          expect(
            text,
            `${locale}: ${name}, a space beside a break`,
          ).not.toMatch(/\s\n|\n\s/);
          expect(text, `${locale}: ${name}, its ends`).not.toMatch(/^\s|\s$/);
        }
      },
    );

    it.each(locales)(
      `holds the %s hero to the stairway and the heading’s reach inside the scale — ${NARROWEST}, 1280, 1401, 1536, 1920 and 2560, the <h1> at 65.04 × s, its box centred on the column, never more than 100 design pixels past it, nothing sideways`,
      async (locale) => {
        await sweep(
          locale,
          [NARROWEST, 1280, 1401, 1536, 1920, 2560],
          '',
          (hero, where) => {
            expectScaled(hero.rhythm, where);
            expectStairway(hero, HEROES[locale], where);
            expectNoLoneWord(hero, where);
            expectWholeLines(hero, where);
            expectReach(hero, where);
            near(
              px(hero.h1, 'font-size'),
              TITLE_DESIGN * px(hero.rhythm, '--scale-px'),
              `${where}the title`,
              0.01,
            );
          },
        );
      },
    );

    it.each(locales)(
      'never ends the %s hero on a lone word and keeps its heading inside the column — eight phones and a 768 tablet with no scrollbar, a 768 window with one',
      async (locale) => {
        const root = document.documentElement;
        // A phone's and a tablet's scrollbar takes no room: `none` here, so
        // the column is the device's (a 390 phone's 351px).
        root.style.setProperty('scrollbar-width', 'none');
        try {
          await sweep(
            locale,
            [320, 360, 375, 390, 393, 412, 430, 440, 768],
            ', no scrollbar',
            (hero, where) => {
              // …proved by the root's own BOX, as wide as the window. Never by
              // `clientWidth`: in this runner it is the window's width with
              // the 15px gutter reserved or not (expectNoSideways), so a
              // check against it could never fail (G2 typescript).
              near(
                box(root).width,
                window.innerWidth,
                `${where}no gutter — the root’s box as wide as the window`,
              );
              expect(remapped(hero.rhythm), `${where}nothing remapped`).toBe(
                false,
              );
              expectNoLoneWord(hero, where);
              expectWholeLines(hero, where);
              expectReach(hero, where);
            },
          );
        } finally {
          root.style.removeProperty('scrollbar-width');
        }
        await sweep(locale, [768], ', a classic scrollbar', (hero, where) => {
          expectNoLoneWord(hero, where);
          expectWholeLines(hero, where);
          expectReach(hero, where);
        });
      },
    );
  });

  // THE HEADING'S REACH AT ITS LIMIT (PostList.tsx's paragraph of that name):
  // the shipped first lines all fit the reach — 83.2 design pixels past the
  // column at most, French's, measured at a 1140 window, the regime's first
  // here (the cases start at NARROWEST, 1160) — so the 100-pixel bound
  // itself is reached only by a line longer than the reach: one built here,
  // and every language's heading under SC 1.4.12's text spacing, which makes
  // each first line outgrow it. Either way the box stops at the column plus
  // 100 design pixels a side, centred, and the line wraps inside it.
  describe('the heading’s reach at its limit', () => {
    /** Every rule of expectReach — centred, never more than 100 design
     *  pixels past either edge, inside the page — then the box AT ITS LIMIT,
     *  exactly the column plus 100 design pixels a side, and the heading's
     *  lines wrapped inside it, more than the stairway's two. */
    const expectAtTheLimit = (
      hero: ReturnType<typeof renderHero>,
      where: string,
    ): void => {
      expectScaled(hero.rhythm, where);
      expectReach(hero, where);
      const s = px(hero.rhythm, '--scale-px');
      const width = box(hero.h1).width;
      near(
        width,
        box(hero.rhythm).width + 2 * REACH_DESIGN * s,
        `${where}the title’s box at its limit`,
      );
      const lines = linesOf(hero.h1);
      expect(lines.length, `${where}the title’s lines`).toBeGreaterThan(2);
      for (const [index, line] of lines.entries()) {
        expect(
          line.width,
          `${where}the title’s line ${index + 1} inside its ${width}px box`,
        ).toBeLessThanOrEqual(width + 0.5);
      }
    };

    it(`stops a first line longer than the reach at the column plus 100 design pixels a side — ${NARROWEST}, 1401, 1920 and 2560: the box centred, the line wrapped inside it, nothing sideways`, async () => {
      // German's first line and Italian's end to end, over German's second:
      // some 2,400 design pixels on one line, wider than any reach.
      const [german = '', german2 = ''] = HEROES.de.title.split('\n');
      const [italian = ''] = HEROES.it.title.split('\n');
      await sweep(
        'de',
        [NARROWEST, 1401, 1920, 2560],
        ', an over-long first line',
        expectAtTheLimit,
        { title: `${german} ${italian}\n${german2}`, lead: HEROES.de.lead },
      );
    });

    it.each(locales)(
      `stops the %s heading at the reach under SC 1.4.12’s text spacing — ${NARROWEST}, 1401 and 1920: the box centred at its limit, the lines wrapped inside it, nothing sideways`,
      async (locale) => {
        const spacing = document.createElement('style');
        spacing.textContent = TEXT_SPACING;
        document.head.append(spacing);
        try {
          await sweep(
            locale,
            [NARROWEST, 1401, 1920],
            ', SC 1.4.12’s text spacing',
            expectAtTheLimit,
          );
        } finally {
          spacing.remove();
        }
      },
    );
  });
});
