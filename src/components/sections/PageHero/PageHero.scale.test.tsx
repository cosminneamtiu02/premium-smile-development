import { render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline — the
// reason this file exists apart from PageHero.test.tsx (the header below).
// tests/setup/components.ts loads no CSS globally; the per-file import is the
// house pattern (DoctorIntro, PriceList, Pagination, PostList).
import '@/styles/globals.css';
import {
  Container,
  bandColumnClasses,
  bandScaleClasses,
} from '@/components/ui/Container/Container';
import { locales, type Locale } from '@/i18n/locales';
import { cx } from '@/lib/cx/cx';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import { PageHero } from './PageHero';
import {
  lineTexts,
  linesOf,
  namedAs,
  stairwayViolations,
  wrapStyleAt,
} from './PageHero.fixtures';

// sections/PageHero — THE HERO, COMPUTED: every hero copy that ships — the
// blog list's and the Team page's, in each of the five languages, read out
// of the message files — with the real stylesheet and the real faces
// (PageHero.tsx's THE STAIRWAY, THE HEADING'S REACH, THE CAPS and THE COPY'S
// RULES). Moved here from PostList.scale.test.tsx on 2026-10-15 with the hero
// itself, and widened there from the blog's five copies to every consumer's.
//
// ── WHY A FILE OF ITS OWN. PageHero.test.tsx pins the hero's class TOKENS
// with no stylesheet loaded — its one premise, which every component suite in
// the repo shares. Line counts, the reach and the design pixel are COMPUTED
// things — a class name cannot show one — so they need the sheet, and the
// lines need the real FACE, because a fallback serif sets other widths. One
// premise per file (DoctorIntro.scale.test.tsx's split).
//
// ── THE TEST BAND. The hero places nothing around itself (§6.4), and every
// regime class on it reads ui/Container's column — so each case renders it
// where its consumers do: a <section>, ui/Container, and a flex column
// wearing ui/Container's two band-scale strings (`bandColumnClasses` and
// `bandScaleClasses`, imported, never re-spelled) — the shape of
// sections/PostList's rhythm box and of sections/DoctorShowcase's page
// opener, without the room and the gaps each band owns (each band's own
// suites measure those; PostList.scale.test.tsx measures the hero inside the
// blog's band at its named windows). The page sets <html lang>; so does
// each case.
//
// ── THE COPIES: COPIES below, one row per consumer and per locale of
// src/i18n/locales, which the cases iterate — a sixth language, or a copy
// the message files lose, fails to compile. A third consumer is one more
// row: the day a page composes the hero, its copy is held here.
//
// ── WHAT IS MEASURED, per copy (the runner's own viewport, set per case —
// ui/Heading's `hero` step reads it — beside the classic 15px scrollbar this
// runner draws, the visual net's own geometry):
//   · THE COPY ITSELF (THE COPY'S RULES): one break in the heading, two in
//     the lead, each between two words, and no other character that breaks a
//     line (a carriage return, U+2028, U+2029).
//   · INSIDE THE SCALE at NARROWEST, 1280, 1401, 1536, 1920 and 2560 — its
//     PREMISES first, each named (expectScaled): the runner's column against
//     the regime's step, a fine pointer, the regime on — then THE STAIRWAY
//     (PageHero.fixtures.ts's `stairwayViolations`, its list empty: two
//     lines and three, each the copy's segment, each step within its bound,
//     the stair running on into the lead, no line wider than its box), no
//     lone last word, whole lines, THE HEADING'S REACH (the <h1>'s box
//     centred on the column, never more than 135 design pixels past either
//     edge, inside the page, nothing sideways), the <h1> at
//     65.04 × s, and the computed wrap (neither block hyphenates; `auto`
//     wrapping and the pre-line white-space that keeps the copy's breaks).
//   · OFF THE SCALE on the 320, 360, 375, 390, 393, 412, 430 and 440 phones
//     and at 768 — with no scrollbar, as on a phone or a tablet
//     (`scrollbar-width: none` on the root, proved by the root's own box: as
//     wide as the window) — and at 768, 1024 and 1100 behind the classic
//     one, as a narrow laptop window draws it: nothing remapped, no lone last
//     word, whole lines, the heading inside the column, and the computed wrap
//     (`pretty` on a column under 48rem and the plain wrap from it, the
//     copy's breaks spaces).
//   · AT ITS LIMIT (THE HEADING'S REACH): a first line longer than the reach,
//     built from two of the blog's, and every copy's heading under SC
//     1.4.12's text spacing — the box exactly the column plus 135 design
//     pixels a side, the line wrapped inside it.
// THE GATES — that the hero's regime tokens style a page only behind the
// band scale's whole chain — are read from the compiled rules in the CSSOM by
// PostList.scale.test.tsx's THE GATES case, over the very classes this
// composition wears there. NO CASE IN THIS FOLDER EMULATES THE DEVICE:
// Chromium's touch emulation switched on and off inside this shared runner
// left CI's Linux tab without a fine pointer, every later case and file in
// that tab off the scale (PR #166's first run, 2026-10-15; that case's
// record); the touch tablets are tests/e2e/band-scale.spec.ts's, 1180 and
// 1366, a fresh browser each.
// THE SHARED RULES — the stairway's steps, the wrap by column, the line
// readers and the <h1>'s name matcher — are PageHero.fixtures.ts's, spelled
// once for every suite that measures the hero. Tolerances: a twentieth of a
// pixel on a box (layout rounds to 1/64px), a hundredth on a font size, half
// a pixel on a centre.

/** This runner's root font size, 16px (the premise asserts it): THE STEP
 *  below is written at it, and a column's width in rem — the wrap's rule —
 *  is read against it (ui/Container's THE BAND SCALE; the regime's census is
 *  tests/unit/design-scale.test.ts). */
const ROOT = 16;

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
 *  coarse-pointer case PostList.scale.test.tsx then had switched Chromium's
 *  touch emulation on and off, and CI's Linux tab came back without a fine
 *  pointer, every later case off the scale whatever its window — that
 *  file's THE GATES now reads that case's answer from the CSSOM.) The narrow
 *  end is still the point: there the design pixel is smallest and Source
 *  Serif 4's optical size sets the smaller type widest per em, so a copy's
 *  tightest lines against their boxes are measured nearest the regime's
 *  start — 1160's design pixel is 1.8 % over 1140's (913 / 897). Every case
 *  that expects the scale names its premises first (expectScaled), so a
 *  window at the edge fails as the runner's column, never as a stairway
 *  rule (PageHero.tsx's THE TESTS' NARROWEST WINDOW). */
const NARROWEST = 1160;

/** Every window the cases scale at. */
const SCALED = [NARROWEST, 1280, 1401, 1536, 1920, 2560] as const;

/** The phones and the tablet, with no scrollbar — the root's own box as wide
 *  as the window. */
const PHONES = [320, 360, 375, 390, 393, 412, 430, 440, 768] as const;

/** The windows behind the classic scrollbar, off the scale: a tablet-wide
 *  one, and two narrow laptop windows under the regime's step, where the
 *  heading keeps its 6xl cap and both blocks wrap as plain prose. */
const CLASSIC = [768, 1024, 1100] as const;

/** The <h1>'s size in the scale, in design pixels: 16.26 spacing steps,
 *  65.04 — sections/DoctorIntro's name's, the `hero` step's value at the
 *  owner's 1401 window (PageHero.tsx's THE ONE SIZE THE REMAP CANNOT REDRAW:
 *  the KEEP-IN-SYNC pair). */
const TITLE_DESIGN = 16.26 * 4;

/** THE HEADING'S REACH (PageHero.tsx's paragraph of that name), in design
 *  pixels: how far the <h1>'s box may pass each edge of the column inside
 *  the scale — 67.5 spacing steps in all, half of them a side: 135 (100,
 *  25 steps a side, until the React review's slow-first-load measurement). */
const REACH_DESIGN = (67.5 / 2) * 4;

/** A hero's copy, as a message file holds it. */
type HeroCopy = { title: string; lead: string };

/** Every hero copy that ships — one row per consumer, one column per locale
 *  of src/i18n/locales: the blog list's (`blog.hero`, PostList.tsx's THE
 *  COPY) and the Team page's (`team.hero`, PageHero.tsx's THE TEAM PAGE'S
 *  COPY), each with its line breaks and no-break spaces. */
const COPIES = {
  blog: {
    ro: ro.blog.hero,
    en: en.blog.hero,
    de: de.blog.hero,
    fr: fr.blog.hero,
    it: it_.blog.hero,
  },
  team: {
    ro: ro.team.hero,
    en: en.team.hero,
    de: de.team.hero,
    fr: fr.team.hero,
    it: it_.team.hero,
  },
} as const satisfies Record<string, Record<Locale, HeroCopy>>;

type Consumer = keyof typeof COPIES;

/** The consumers, in the order the cases run them. */
const CONSUMERS = Object.keys(COPIES) as Consumer[];

// The REAL typeface, as Pagination.scale.test.tsx loads Source Serif 4: the
// declaration .storybook/preview-fonts.css makes for Storybook, verbatim
// apart from the URL — this runner serves the repo from its root — and
// `font-display: block`, so a fallback is never measured. The hero sets both
// its blocks in it (the mono face never appears). Then THE STILLNESS: an
// unlayered `transition: none` beats the layered utilities, so nothing is
// read mid-fade.
const SERIF = 'Source Serif 4 SB';
const INJECTED_CSS = `
@font-face {
  font-family: '${SERIF}';
  src: url('/src/fonts/SourceSerif4Variable-subset.woff2') format('woff2');
  font-weight: 200 900;
  font-style: normal;
  font-display: block;
}
:root { --font-source-serif: '${SERIF}'; }
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
  document.documentElement.lang = 'ro';
  injected = document.createElement('style');
  injected.textContent = INJECTED_CSS;
  document.head.append(injected);
  // load(), not just ready: nothing has rendered yet, so there is no pending
  // font for `ready` to wait on — and a 404 on the subset REJECTS here,
  // loudly.
  await document.fonts.load(`1rem "${SERIF}"`);
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
  if (!(node instanceof HTMLElement)) throw new Error(`PageHero: no ${name}`);
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

/** The test band's box — the flex column wearing ui/Container's two
 *  band-scale strings, the shape of its consumers' rhythm boxes (the header's
 *  THE TEST BAND). The utilities are ones the site's stylesheet already
 *  ships. */
const BAND = cx('flex flex-col', bandColumnClasses, bandScaleClasses);

/** One copy's hero in the test band, its language on <html>; its boxes by
 *  structure — the <h1> by the name a screen reader hears, its <header>, the
 *  lead, the band's box and ui/Container's column. */
const renderHero = (locale: Locale, copy: HeroCopy) => {
  document.documentElement.lang = locale;
  const { unmount } = render(
    <section>
      <Container>
        <div className={BAND}>
          <PageHero title={copy.title} lead={copy.lead} />
        </div>
      </Container>
    </section>,
  );
  const h1 = screen.getByRole('heading', {
    level: 1,
    name: namedAs(copy.title),
  });
  const header = htmlElement(h1.parentElement, 'header');
  const band = htmlElement(header.parentElement, 'band box');
  return {
    unmount: () => {
      unmount();
      document.documentElement.lang = 'ro';
    },
    h1,
    lead: htmlElement(header.children[1], 'lead'),
    band,
    column: htmlElement(band.parentElement, 'ui/Container column'),
  };
};

type Hero = ReturnType<typeof renderHero>;

/** Renders one copy's hero at each window and runs `check` on it. */
const sweep = async (
  locale: Locale,
  copy: HeroCopy,
  windows: readonly number[],
  label: string,
  check: (hero: Hero, where: string) => void,
): Promise<void> => {
  for (const width of windows) {
    await page.viewport(width, 900);
    const hero = renderHero(locale, copy);
    try {
      await document.fonts.ready;
      check(hero, `${label} at ${width}: `);
    } finally {
      hero.unmount();
    }
  }
};

/** THE SCALE, EXPECTED ON — its PREMISES first, each named, so a case that
 *  fails here reads as the runner's geometry or state, never as a stairway
 *  or a reach rule: the column the runner lays out at this window
 *  (ui/Container's box — the box the container queries read) clears THE
 *  STEP; the primary pointer is fine — a tab left without one turns every
 *  case after it off the scale, as Chromium's touch emulation switched on
 *  and off did on CI's Linux (PR #166's first run, 2026-10-15; nothing in
 *  this folder emulates the device); then the regime itself, remapped. */
const expectScaled = (hero: Hero, where = ''): void => {
  const column = box(hero.column).width;
  expect(
    column,
    `${where}the runner’s column is ${column}px — the regime starts at ${STEP}px`,
  ).toBeGreaterThanOrEqual(STEP);
  expect(
    pointerNow(),
    `${where}the runner’s primary pointer — the regime asks for a fine one`,
  ).toBe('fine');
  expect(
    remapped(hero.band),
    `${where}the regime is on — a ${column}px column, a fine pointer`,
  ).toBe(true);
};

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

/** NO LONE LAST WORD (PageHero.tsx's THE COPY'S RULES): the last line of the
 *  title and of the lead always holds at least two words. */
const expectNoLoneWord = (hero: Hero, where = ''): void => {
  for (const [name, element] of blocksOf(hero)) {
    const last = (lineTexts(element).at(-1) ?? '').trim();
    expect(
      wordCount(last),
      `${where}${name}’s last line, „${last}”`,
    ).toBeGreaterThan(1);
  }
};

/** EVERY LINE WHOLE (PageHero.tsx's THE COPY'S RULES): no line starts with
 *  punctuation — French joins its colon to the word before it — and no word
 *  is cut across two lines, which the belt does to a joined unit wider than
 *  the column. A line may end on a word's own hyphen („rendez-vous" breaks
 *  after it, as typesetting allows): only a cut without one counts. */
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

/** THE WRAP, COMPUTED (PageHero.tsx's ON A PHONE'S OR A TABLET'S COLUMN and
 *  THE STAIRWAY): neither block hyphenates; both wrap `pretty` on a column
 *  under 48rem — a phone's or a tablet's — and plainly from it; and both keep
 *  the copy's own line breaks where the band is scaled and nowhere else (the
 *  pre-line white-space preserves them, the normal one makes each a space). */
const expectWrap = (hero: Hero, where = ''): void => {
  const column = box(hero.column).width;
  const wrap = wrapStyleAt(column / ROOT);
  const scaled = remapped(hero.band);
  for (const [name, element] of blocksOf(hero)) {
    const style = getComputedStyle(element);
    expect(style.hyphens, `${where}${name}’s hyphens`).toBe('none');
    expect(
      style.getPropertyValue('text-wrap-style'),
      `${where}${name}’s wrap at a ${column}px column`,
    ).toBe(wrap);
    expect(
      style.whiteSpace,
      `${where}${name}’s line breaks, the band ${scaled ? '' : 'not '}scaled`,
    ).toBe(scaled ? 'pre-line' : 'normal');
  }
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

/** THE HEADING'S REACH (PageHero.tsx's paragraph of that name), each rule
 *  its own assertion — the column being the band's box (capped and centred
 *  at 96rem past a 1920 window):
 *    · wherever the band is scaled, the <h1>'s box CENTRED on the column's
 *      centre line (± 0.5px), passing NEITHER of its edges by more than 135
 *      design pixels, and inside the PAGE with nothing to scroll sideways
 *      (expectNoSideways: the page measured by the root's own box);
 *    · anywhere else, the box INSIDE the column. */
const expectReach = (hero: Hero, where = ''): void => {
  const column = box(hero.band);
  const heading = box(hero.h1);
  if (!remapped(hero.band)) {
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
  const reach = REACH_DESIGN * px(hero.band, '--scale-px');
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

describe('PageHero — every hero copy that ships, computed (the real stylesheet and face)', () => {
  beforeAll(() => {
    // THE PREMISES: the real face; the 16px root STEP is written at; and a
    // place where the regime CAN apply — a fine primary pointer and an engine
    // that registers custom properties, the two conditions of globals.css's
    // THE SCALABLE VARIANT. Otherwise every case below that expects the scale
    // would fail for a reason that reads as the hero's, and every case that
    // expects none would pass for the wrong one.
    expect(document.fonts.check(`1rem "${SERIF}"`), SERIF).toBe(true);
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

  // EVERY COPY (PageHero.tsx's THE STAIRWAY and THE COPY'S RULES): the
  // message files' heroes, as shipped, held to the owner's rule — the copy
  // breaks its heading once and its lead twice; inside the scale those breaks
  // hold, the stairway falls from the heading's first line to the lead's last
  // and the <h1> is 65.04 × s; and on every phone, at 768 and on the two
  // narrow laptop windows no last line of either block one word, no line
  // starting with punctuation, no word cut across two lines. One case per
  // consumer and per locale of src/i18n/locales. Chromium alone, the
  // components project's one engine; WebKit and Firefox were measured for
  // the blog's copy (sections/PostList's THE CAPS).
  describe.each(CONSUMERS)(
    'the %s hero, as the message files ship it',
    (consumer) => {
      it.each(locales)(
        'breaks the %s copy where the stairway turns — ONE line break in the heading, TWO in the lead, each between two words, and no other character that breaks a line',
        (locale) => {
          const { title, lead } = COPIES[consumer][locale];
          expect(
            title.split('\n'),
            `${consumer} ${locale}: the heading’s lines`,
          ).toHaveLength(2);
          expect(
            lead.split('\n'),
            `${consumer} ${locale}: the lead’s lines`,
          ).toHaveLength(3);
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
              `${consumer} ${locale}: ${name}, a line break other than the \\n`,
            ).not.toMatch(/[\r\u2028\u2029]/);
            // A space beside a break — U+00A0 included, which never collapses —
            // would hang at a line's end or open the next one, and no break may
            // open or close the block.
            expect(
              text,
              `${consumer} ${locale}: ${name}, a space beside a break`,
            ).not.toMatch(/\s\n|\n\s/);
            expect(
              text,
              `${consumer} ${locale}: ${name}, its ends`,
            ).not.toMatch(/^\s|\s$/);
          }
        },
      );

      it.each(locales)(
        `holds the %s hero to the stairway and the heading’s reach inside the scale — ${SCALED.join(', ')}: the <h1> at 65.04 × s, its box centred on the column, never more than 135 design pixels past it, nothing sideways`,
        async (locale) => {
          const copy = COPIES[consumer][locale];
          await sweep(
            locale,
            copy,
            SCALED,
            `${consumer} ${locale}`,
            (hero, where) => {
              expectScaled(hero, where);
              // THE STAIRWAY, its five rules read by PageHero.fixtures.ts's
              // one reader — every broken rule named in the failure.
              expect(
                stairwayViolations(hero, copy),
                `${where}the stairway`,
              ).toEqual([]);
              expectNoLoneWord(hero, where);
              expectWholeLines(hero, where);
              expectReach(hero, where);
              expectWrap(hero, where);
              near(
                px(hero.h1, 'font-size'),
                TITLE_DESIGN * px(hero.band, '--scale-px'),
                `${where}the title`,
                0.01,
              );
            },
          );
        },
      );

      it.each(locales)(
        `never ends the %s hero on a lone word and keeps its heading inside the column — eight phones and a 768 tablet with no scrollbar; ${CLASSIC.join(', ')} windows with one`,
        async (locale) => {
          const copy = COPIES[consumer][locale];
          const root = document.documentElement;
          // A phone's and a tablet's scrollbar takes no room: `none` here, so
          // the column is the device's (a 390 phone's 351px).
          root.style.setProperty('scrollbar-width', 'none');
          try {
            await sweep(
              locale,
              copy,
              PHONES,
              `${consumer} ${locale}, no scrollbar`,
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
                expect(remapped(hero.band), `${where}nothing remapped`).toBe(
                  false,
                );
                expectNoLoneWord(hero, where);
                expectWholeLines(hero, where);
                expectReach(hero, where);
                expectWrap(hero, where);
              },
            );
          } finally {
            root.style.removeProperty('scrollbar-width');
          }
          await sweep(
            locale,
            copy,
            CLASSIC,
            `${consumer} ${locale}, a classic scrollbar`,
            (hero, where) => {
              expect(remapped(hero.band), `${where}nothing remapped`).toBe(
                false,
              );
              expectNoLoneWord(hero, where);
              expectWholeLines(hero, where);
              expectReach(hero, where);
              expectWrap(hero, where);
            },
          );
        },
      );
    },
  );

  // THE HEADING'S REACH AT ITS LIMIT (PageHero.tsx's paragraph of that name):
  // the shipped first lines all fit the reach — the widest, measured at a
  // 1140 window, the regime's first here (the cases start at NARROWEST,
  // 1160): the blog's French, 83.2 design pixels past the column, the Team
  // page's Romanian, 83.9 — so the 135-pixel bound itself is reached only by
  // a line longer than the reach: one built here, and every copy's heading
  // under SC 1.4.12's text spacing, which makes each first line outgrow it.
  // Either way the box stops at the column plus 135 design pixels a side,
  // centred, and the line wraps inside it.
  describe('the heading’s reach at its limit', () => {
    /** Every rule of expectReach — centred, never more than 135 design
     *  pixels past either edge, inside the page — then the box AT ITS LIMIT,
     *  exactly the column plus 135 design pixels a side, and the heading's
     *  lines wrapped inside it, more than the stairway's two. */
    const expectAtTheLimit = (hero: Hero, where: string): void => {
      expectScaled(hero, where);
      expectReach(hero, where);
      const s = px(hero.band, '--scale-px');
      const width = box(hero.h1).width;
      near(
        width,
        box(hero.band).width + 2 * REACH_DESIGN * s,
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

    it(`stops a first line longer than the reach at the column plus 135 design pixels a side — ${NARROWEST}, 1401, 1920 and 2560: the box centred, the line wrapped inside it, nothing sideways`, async () => {
      // The blog's German first line and its Italian one end to end, over
      // the German second: some 2,400 design pixels on one line, wider than
      // any reach.
      const [german = '', german2 = ''] = COPIES.blog.de.title.split('\n');
      const [italian = ''] = COPIES.blog.it.title.split('\n');
      await sweep(
        'de',
        {
          title: `${german} ${italian}\n${german2}`,
          lead: COPIES.blog.de.lead,
        },
        [NARROWEST, 1401, 1920, 2560],
        'de, an over-long first line',
        expectAtTheLimit,
      );
    });

    describe.each(CONSUMERS)('the %s hero', (consumer) => {
      it.each(locales)(
        `stops the %s heading at the reach under SC 1.4.12’s text spacing — ${NARROWEST}, 1401 and 1920: the box centred at its limit, the lines wrapped inside it, nothing sideways`,
        async (locale) => {
          const spacing = document.createElement('style');
          spacing.textContent = TEXT_SPACING;
          document.head.append(spacing);
          try {
            await sweep(
              locale,
              COPIES[consumer][locale],
              [NARROWEST, 1401, 1920],
              `${consumer} ${locale}, SC 1.4.12’s text spacing`,
              expectAtTheLimit,
            );
          } finally {
            spacing.remove();
          }
        },
      );
    });
  });
});
