import { cleanup, render } from '@testing-library/react';
import { userEvent as realUser } from 'vitest/browser';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
// The REAL stylesheet and, below, the REAL face: a title word's width is the
// typeface's, at the size the card's title computes, on the line its grid
// gives it — and where a title breaks is the engine's, under the rule the
// title computes — nothing a class string or a character count can answer.
import '@/styles/globals.css';
import { locales, type Locale } from '@/i18n/locales';
import { postsIn } from '@/lib/blog/blog';
import { PostCard, type PostCardContent } from './PostCard';
import {
  paintScaleOf,
  unitRanges,
  unitsAcrossLines,
  unitsOf,
} from './PostCard.fixtures';
import postListSource from '@/components/sections/PostList/PostList.tsx?raw';

// sections/PostCard — EVERY TITLE WORD THE BLOG SHIPS FITS THE NARROWEST
// TITLE LINE A CARD DRAWS, in each of the five languages, MEASURED — AND
// EVERY TITLE BREAKS BETWEEN ITS WORDS ONLY, NEVER AT A SYLLABLE.
//
// ── WHY MEASURED (the tier-3 review, 2026-10-14). tests/unit/blog-data.test.ts
// held a title word to 16 characters, the ceiling lib/team keeps for a name
// at the `hero` step — and a character count cannot bound a width:
// „Wurzelbehandlung", 16 characters, sets 250.5px at the card title's 30px,
// past the line below, while the 15-character „Zahnaufhellung:" the blog
// ships sets 217.1. So the rule is the width itself, in the real face; that
// data test keeps the rules a count CAN hold (the tags, the summaries).
//
// ── WHY IT IS THE TITLE'S SAFETY NET (2026-10-15). The title wears
// `hyphens-none` — PostCard's THE TITLE NEVER SPLITS A WORD, the owner's "as
// you say" to the one-class lever — so the site's `hyphens: auto` (§15.14)
// no longer reaches it: a title breaks at a space or after a written hyphen,
// and a word wider than its line could break only where the title's belt
// breaks it, anywhere and with no hyphen at all. Every word fitting the
// narrowest line is what keeps the belt idle, and the rule safe.
//
// ── THE NARROWEST LINE, 222px. The title is ui/Heading's `band` step, which
// answers to ui/Card's own `@container` — 30px on a card under 28rem of
// content (§15.24's card rule, PostCard's THE NAME) — and its line is the
// card's content box. The page lays the cards out in sections/PostList's
// GRID: one column, two from its column's 36rem, three from 56rem, 2rem
// apart. So the narrowest card is a two-column one AT that step: two 272px
// tracks in a 576px column, less the frame's 3px and the padding's 22px a
// side (ui/Card's framed row) — a 222px line, at a 720px window, 738.75
// behind a classic scrollbar. Every other card's line is wider: one column's
// narrowest is 223px (a 320 window behind a classic scrollbar; 238 on a 320
// phone), three unscaled columns on a touch tablet's 56rem column 227.3,
// three in THE BAND SCALE 297 design pixels for a 30-design-pixel title
// (§15.32), and a title sets 36px only on a line of 28rem and more.
//
// ── A UNIT, NOT A WORD: what a line cannot break — PostCard.fixtures.ts's
// `unitsOf`, THE CUT RULE this file and the stories' `expectTitleWordsWhole`
// share (one spelling since the review of 2026-10-15): the text between two
// breakable spaces, cut once more after a hyphen, where CSS may break („six-"
// then „monthly": `hyphens: none` leaves a written hyphen's break alone —
// MEASURED, „Why the six- / monthly check- / up matters" on the 222px line).
// With the title's hyphenation off, these are the only places it breaks. A
// no-break space JOINS (French sets the narrow U+202F before its colon, so
// „adulte :" is one unit), and punctuation rides with its word
// („Zahnaufhellung:").
//
// ── HOW. The real card in a frame like the page's at that step — a 36rem
// query container round PostList's own grid (FRAME_GRID, held equal to
// GRID, read out of its source, PostCard.test.tsx's frame) — with each
// post's real title, under its language's `lang`, as the page sets it; then
// the title's own element stops wrapping (`white-space: nowrap`) and a Range
// reads each unit's natural width, in LAYOUT pixels (THE READINGS ARE
// LAYOUT, below). The title's belt (`wrap-anywhere`, THE TITLE'S BELT) exists
// for what the data cannot promise — a reader's text spacing, a larger
// default font; no shipped title leans on it. MEASURED (Chromium, the real
// face), the widest unit of each language on the 222px line: German
// „Zahnaufhellung:" 217.1, French „interdentaires" 185.2, Italian
// „sbiancamento" 184.5, Romanian „Sensibilitatea" 176.1, English
// „toothbrush" 145.7. The German margin is about 2 %, measured on macOS —
// PostCard's IT IS SAFE BECAUSE EVERY WORD FITS records what it means for
// CI's Linux.
//
// ── THE BREAKS, LAID OUT (2026-10-15). Then every title is laid out as the
// page lays it out, WRAPPING, on three lines (FRAMES): the narrowest, 222px,
// and a 390 phone's — 301px, a 351px column, the window less ui/Container's
// 5vw a side (§15.35); 286px behind a classic 15px scrollbar, which `vw`
// counts — under its language's `lang`, which picks the dictionary
// `hyphens: auto` would split with. A Range over each unit must stand on
// ONE line (PostCard.fixtures.ts's `unitsAcrossLines`, the reading the
// stories share). That bites only where the engine hyphenates the language:
// Chromium on macOS does, all five — MEASURED with the title's class taken
// off: 60 units split on these three lines, 14 Romanian, 4 English, 20
// German, 12 French and 10 Italian, German's „Zahnbürste" on both phone lines
// among them — while §15.25 records Chromium's own pattern set (Android,
// Windows, Linux) as believed to carry no Romanian one; where an engine has
// none, the premise's computed `hyphens: none` is the guard that bites.
//
// ── THE READINGS ARE LAYOUT, AND THE CARD IS HELD STILL (the review of
// 2026-10-15, react and typescript). The card JUMPS — a resting pointer is
// :hover, and a hovered card is painted at 105 % (PostCard's THE CARD JUMP) —
// and this file read PAINTED sizes: the title's rectangle and each unit's.
// MEASURED, run after PostCard.test.tsx in one browser page, the frame's
// first card turned :hover within 100ms under the pointer that file leaves
// at its top-left corner — over this frame's first picture — and its 222px
// title read 233.1px: red with nothing wrong, and green until then only
// because the reading came before the hover. So every length here is now
// LAYOUT — a title's line its computed width (`lineOf`), a unit's width and
// its lines' spread its Range's, divided by the title's paint scale
// (PostCard.fixtures.ts's `paintScaleOf`). And the card is held still
// besides, belt and braces: the pointer is PARKED off the cards before each
// test (PostCard.test.tsx's parkPointer, the house's rule) and every
// transition is off (its THE STILLNESS RULE, in the sheet this file
// injects), so no reading depends on where the pointer rests. The last block
// proves it with the pointer resting ON a card, grown to 105 %.
//
// ── THE NARROW CARDS LEFT (2026-10-17). From that morning to its evening a
// block here measured the title's two narrow steps on the Home band's narrow
// carousel cards; the band took the MINIATURE instead and the steps left the
// card (PostCard's THE NARROW STEPS, REMOVED). The 222px line above is again
// the narrowest a title is drawn on at its own size. A miniature's titles are
// PostCard.miniature.test.tsx's: its words at the share of its full card's,
// on a line the share less 0.7px, every word whole.

/** The no-break spaces, by name — never typed raw into a test. */
const NBSP = String.fromCodePoint(0xa0);
const NNBSP = String.fromCodePoint(0x202f);

/** The runner's root, which every rem here is written at (the premise). */
const ROOT = 16;

/** ui/Card's framed row, a side: the 3px frame and the 22px padding. */
const CARD_INSET = 3 + 22;

/** THE NARROWEST LINE (the header), from its parts: the grid's 36rem step
 *  less its 2rem gap, halved, less the card's inset a side. */
const LINE = (36 * ROOT - 2 * ROOT) / 2 - 2 * CARD_INSET;

/** The frame's width: the grid's two-column step, the column it fills. */
const FRAME_WIDTH = '36rem';

/** A 390 phone (THE BREAKS, LAID OUT), and ui/Container's gutter on it a
 *  side — 5vw (§15.35). */
const PHONE = 390;
const PHONE_GUTTER = PHONE / 20;
/** The classic scrollbar a mouse brings: `vw` counts it, the column loses it. */
const SCROLLBAR = 15;

/** THE LINES THE BREAKS ARE LAID OUT ON (the header): a column for the frame
 *  and the title line its card draws there — one column of the page's grid
 *  on the phone, two at the narrowest — each derived from its parts. */
const FRAMES = [
  { name: 'on the narrowest line', column: FRAME_WIDTH, line: LINE },
  {
    name: 'on a 390 phone',
    column: `${PHONE - 2 * PHONE_GUTTER}px`,
    line: PHONE - 2 * PHONE_GUTTER - 2 * CARD_INSET,
  },
  {
    name: 'on a 390 window behind a classic scrollbar',
    column: `${PHONE - SCROLLBAR - 2 * PHONE_GUTTER}px`,
    line: PHONE - SCROLLBAR - 2 * PHONE_GUTTER - 2 * CARD_INSET,
  },
] as const;

/** THE FRAME'S GRID — the page's, spelled out (Tailwind reads class names
 *  from source text) and held equal to sections/PostList's GRID below. */
const FRAME_GRID = 'grid grid-cols-1 gap-8 @xl:grid-cols-2 @4xl:grid-cols-3';

/** sections/PostList's GRID, read out of its source — throws by name when
 *  the constant is gone. */
const pageGrid = (() => {
  const grid = /\bconst GRID =\s*'([^']*)'/.exec(postListSource)?.[1];
  if (!grid) throw new Error('PostList.tsx: no `GRID` constant — it moved.');
  return grid;
})();

/** Everything but the title, in Romanian with diacritics (§13): one short
 *  card, no tags, a decorative picture. */
const CARD: Omit<PostCardContent, 'title'> = {
  href: '/ro/blog/cum-iti-alegi-periuta-de-dinti/',
  summary: 'Un rezumat scurt, ca să se vadă cartea întreagă.',
  author: 'Dr. Nicu Elena Alina',
  readingTime: '4 min de citit',
  image: { src: '/images/hero/lobby.jpg', alt: '' },
  tags: [],
};

/** The German title that carries the widest unit the blog ships,
 *  „Zahnaufhellung:" (the header's HOW) — the last block's card. */
const WIDEST_TITLE = 'Zahnaufhellung: häufige Fragen';

// The REAL typeface, as PostList.scale.test.tsx loads it: the declaration
// .storybook/preview-fonts.css makes for Storybook, its URL served from the
// repo's root, `font-display: block` so a fallback is never measured — and,
// in the same unlayered sheet, PostCard.test.tsx's THE STILLNESS RULE (its
// holdStill), which beats every @layer'd utility: the card's jump lands at
// once or not at all, never mid-way through a reading.
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
*, *::before, *::after { transition: none !important; animation: none !important; }
`;
let injected: HTMLStyleElement | null = null;
let lang0: string | null = null;
/** The parking box of the running test (THE POINTER, PARKED), once taken. */
let unpark: (() => void) | undefined;

beforeAll(async () => {
  lang0 = document.documentElement.getAttribute('lang');
  injected = document.createElement('style');
  injected.textContent = INJECTED_CSS;
  document.head.append(injected);
  // load(), not just ready: nothing has rendered yet — and a 404 on the
  // subset REJECTS here, loudly.
  await document.fonts.load(`1rem "${SERIF}"`);
  await document.fonts.ready;
});

// THE POINTER, PARKED off the cards before each test — PostCard.test.tsx's
// parkPointer, KEEP-IN-SYNC: a 2rem box prepended to the body and the REAL
// pointer on it (vitest/browser's userEvent — a synthetic event cannot move
// :hover), so every frame renders under it and no card is hovered. Taken
// away only after the frame is unmounted, so no card slides up under the
// pointer where the box stood.
beforeEach(async () => {
  const parking = document.createElement('div');
  parking.style.cssText = 'width: 2rem; height: 2rem';
  document.body.prepend(parking);
  await realUser.hover(parking);
  unpark = () => parking.remove();
});

afterEach(() => {
  cleanup();
  unpark?.();
  unpark = undefined;
});

afterAll(() => {
  injected?.remove();
  injected = null;
  if (lang0 === null) document.documentElement.removeAttribute('lang');
  else document.documentElement.lang = lang0;
});

/** The faces the titles are set in, at the size each computes, loaded with
 *  their own text before anything is read. */
const loadFaces = async (headings: readonly HTMLElement[]): Promise<void> => {
  for (const heading of headings) {
    const style = getComputedStyle(heading);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      heading.textContent ?? '',
    );
  }
  await document.fonts.ready;
};

/** The frame (the header), one card per title, under `locale`'s `lang`, its
 *  query container `width` wide — the narrowest line's column unless told;
 *  its titles once the face has them. */
const renderFrame = async (
  locale: Locale,
  titles: readonly string[],
  width: string = FRAME_WIDTH,
): Promise<HTMLElement[]> => {
  document.documentElement.lang = locale;
  const { container } = render(
    <div className="@container" style={{ width }}>
      <ul role="list" className={FRAME_GRID}>
        {titles.map((title) => (
          <li key={title}>
            <PostCard
              {...CARD}
              title={title}
              tagsLabel="Categorii"
              readMore="Citește mai mult…"
              className="h-full"
            />
          </li>
        ))}
      </ul>
    </div>,
  );
  const headings = [...container.querySelectorAll('h2')];
  await loadFaces(headings);
  return headings;
};

/** A title's LINE — its computed width: layout, which no hover's jump can
 *  scale (THE READINGS ARE LAYOUT). */
const lineOf = (title: HTMLElement): number =>
  parseFloat(getComputedStyle(title).width);

/** Each unit of a title as its own element sets it, unbroken, in LAYOUT
 *  pixels: the title stops wrapping, and a Range reads every unit's width,
 *  divided by the title's paint scale (THE READINGS ARE LAYOUT). */
const unitWidths = (title: HTMLElement): { unit: string; width: number }[] => {
  title.style.whiteSpace = 'nowrap';
  const scale = paintScaleOf(title);
  return unitRanges(title).map(({ unit, range }) => ({
    unit,
    width: range.getBoundingClientRect().width / scale,
  }));
};

describe('PostCard — every title word the blog ships fits the narrowest title line (the real face)', () => {
  it('measures where the line is narrowest — the page’s grid at its two-column step, a 222px line, the title at 30px, never hyphenated', async () => {
    expect(FRAME_GRID, 'the frame’s grid is the page’s').toBe(pageGrid);
    expect(
      parseFloat(getComputedStyle(document.documentElement).fontSize),
      'the 16px root',
    ).toBe(ROOT);
    expect(document.fonts.check(`1rem "${SERIF}"`), SERIF).toBe(true);

    const [title] = await renderFrame('ro', ['Titlu de probă']);
    if (!title) throw new Error('no title rendered');
    const grid = title.closest('ul');
    if (!grid) throw new Error('no grid round the card');
    expect(
      getComputedStyle(grid).gridTemplateColumns,
      'two tracks of 17rem',
    ).toBe('272px 272px');
    expect(lineOf(title), 'the line').toBeCloseTo(LINE, 2);
    expect(LINE).toBe(222);
    const style = getComputedStyle(title);
    expect(style.fontSize, 'the card’s title step').toBe('30px');
    expect(style.fontFamily.startsWith(`"${SERIF}"`), style.fontFamily).toBe(
      true,
    );
    // THE TITLE NEVER SPLITS A WORD (the owner, 2026-10-15): the class
    // reached the real sheet, and the site's `hyphens: auto` stops at the
    // title — the premise of every unit measured below.
    expect(style.hyphens, 'the title’s own `hyphens-none`').toBe('none');
  });

  it.each(locales)(
    'fits every %s title word on that line — no shipped title leans on the belt',
    async (locale) => {
      const titles = postsIn(locale).map((post) => post.title);
      expect(titles.length, 'posts to measure').toBeGreaterThan(0);
      const headings = await renderFrame(locale, titles);
      expect(headings).toHaveLength(titles.length);
      const misfits: string[] = [];
      for (const heading of headings) {
        expect(lineOf(heading)).toBeCloseTo(LINE, 2);
        const units = unitWidths(heading);
        expect(units.length).toBeGreaterThan(0);
        for (const { unit, width } of units) {
          expect(width, `„${unit}" set at all`).toBeGreaterThan(0);
          if (width > LINE) {
            misfits.push(
              `„${unit}" ${width.toFixed(1)}px in „${heading.textContent}"`,
            );
          }
        }
      }
      expect(misfits, `wider than the ${LINE}px line`).toEqual([]);
    },
  );

  it('has teeth — „Wurzelbehandlung", 16 characters, is wider than the line', async () => {
    const [title] = await renderFrame('de', ['Wurzelbehandlung']);
    if (!title) throw new Error('no title rendered');
    const [only] = unitWidths(title);
    expect(only?.unit).toBe('Wurzelbehandlung');
    expect(only?.width).toBeGreaterThan(LINE);
  });

  it('cuts a title where a line may break — now the only places: at a space and after a written hyphen, never at a no-break space', () => {
    expect(unitsOf('Why the six-monthly check-up matters')).toEqual([
      'Why',
      'the',
      'six-',
      'monthly',
      'check-',
      'up',
      'matters',
    ]);
    expect(unitsOf(`à l’âge adulte${NNBSP}: ce qu’il faut`)).toEqual([
      'à',
      'l’âge',
      `adulte${NNBSP}:`,
      'ce',
      'qu’il',
      'faut',
    ]);
    expect(unitsOf(`how to look after${NBSP}it`)).toEqual([
      'how',
      'to',
      'look',
      `after${NBSP}it`,
    ]);
  });
});

describe('PostCard — every title breaks between its words only, never at a syllable (the real face, laid out)', () => {
  it('lays out on the lines it names — the narrowest, and a 390 phone’s with and without the classic scrollbar', async () => {
    expect(FRAMES.map(({ line }) => line)).toEqual([222, 301, 286]);
    for (const frame of FRAMES) {
      const [title] = await renderFrame('ro', ['Titlu de probă'], frame.column);
      if (!title) throw new Error('no title rendered');
      expect(lineOf(title), frame.name).toBeCloseTo(frame.line, 2);
      expect(getComputedStyle(title).fontSize, frame.name).toBe('30px');
      cleanup();
    }
  });

  it.each(locales)(
    'keeps every word of every %s title on one line — at a space or after a written hyphen, the title breaks; inside a word, never (the owner, 2026-10-15)',
    async (locale) => {
      const titles = postsIn(locale).map((post) => post.title);
      expect(titles.length, 'posts to lay out').toBeGreaterThan(0);
      const split: string[] = [];
      for (const frame of FRAMES) {
        const headings = await renderFrame(locale, titles, frame.column);
        expect(headings).toHaveLength(titles.length);
        for (const heading of headings) {
          for (const unit of unitsAcrossLines(heading)) {
            split.push(`„${unit}" in „${heading.textContent}" ${frame.name}`);
          }
        }
        cleanup();
      }
      expect(split, 'a word laid out on two lines').toEqual([]);
    },
  );

  it('has teeth — a word laid out on two lines is caught: one too wide for its line, broken by the belt', async () => {
    const [title] = await renderFrame('de', ['Zahnbürste']);
    if (!title) throw new Error('no title rendered');
    expect(unitsAcrossLines(title), 'on a line it fits').toEqual([]);
    // Narrower than the word at the card's 30px: only the belt can break it.
    title.style.width = '3em';
    expect(unitsAcrossLines(title)).toEqual(['Zahnbürste']);
  });
});

describe('PostCard — every reading here is LAYOUT: the same with a real pointer resting on a card grown to 105 % (the real face, a real pointer)', () => {
  it('reads the same line, the same unit widths and the same lines on a hovered, jumped card as at rest — the jump scales what is painted, never what this file reads', async () => {
    // THE PREMISE: a device that hovers — the card's jump answers
    // `(hover: hover)` alone.
    expect(matchMedia('(hover: hover)').matches).toBe(true);
    const [title] = await renderFrame('de', [WIDEST_TITLE]);
    if (!title) throw new Error('no title rendered');
    const card = title.closest('article');
    if (!card) throw new Error('no card round the title');

    /** Every reading this file takes off a title: its line, the units it
     *  lays out on two lines (wrapping), and each unit's natural width
     *  (unbroken — the wrap given back after). */
    const readingsOf = () => {
      const lines = unitsAcrossLines(title);
      const widths = unitWidths(title);
      title.style.whiteSpace = '';
      return { line: lineOf(title), lines, widths };
    };

    // At rest — the pointer parked: nothing hovered, the card painted at
    // its own size.
    expect(card.matches(':hover')).toBe(false);
    expect(paintScaleOf(title)).toBeCloseTo(1, 5);
    const rest = readingsOf();
    expect(rest.widths.map(({ unit }) => unit)).toEqual([
      'Zahnaufhellung:',
      'häufige',
      'Fragen',
    ]);

    // The REAL pointer on the card: hovered, and — THE STILLNESS RULE lets
    // the jump land at once — painted at 105 %, its 222px line 233.1px on
    // screen, the reading this file once took…
    await realUser.hover(card);
    expect(card.matches(':hover')).toBe(true);
    expect(paintScaleOf(title)).toBeCloseTo(1.05, 3);
    expect(title.getBoundingClientRect().width).toBeCloseTo(1.05 * LINE, 1);

    // …and every reading the same as at rest.
    const jumped = readingsOf();
    expect(jumped.line, 'the line').toBe(rest.line);
    expect(jumped.lines, 'the units on two lines').toEqual(rest.lines);
    expect(jumped.widths).toHaveLength(rest.widths.length);
    for (const [index, { unit, width }] of jumped.widths.entries()) {
      expect(unit).toBe(rest.widths[index]?.unit);
      expect(width, `„${unit}"`).toBeCloseTo(
        rest.widths[index]?.width ?? Number.NaN,
        2,
      );
    }
  });
});
