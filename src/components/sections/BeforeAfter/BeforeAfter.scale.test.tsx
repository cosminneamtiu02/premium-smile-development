import { render, screen } from '@testing-library/react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { page, userEvent as realUser } from 'vitest/browser';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline — the
// reason this file exists apart from BeforeAfter.test.tsx (the header below).
// tests/setup/components.ts loads no CSS globally; the per-file import is the
// house pattern (Card, Container, ClinicLocation, PriceList.scale,
// DoctorProfile.scale, PostPhoto.scale).
import '@/styles/globals.css';
import globalsSource from '@/styles/globals.css?raw';
import type { PostPhotoImage } from '@/components/sections/PostPhoto/PostPhoto';
import {
  bandColumnClasses,
  bandScaleClasses,
  Container,
  containerClasses,
} from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx/cx';
import {
  BeforeAfter,
  type BeforeAfterPair,
  type BeforeAfterProps,
} from './BeforeAfter';
import postPageSource from '../PostPage/PostPage.tsx?raw';

// sections/BeforeAfter — THE LAYOUT, THE PHONE AS IT WAS, THE PICTURES STAY
// LEVEL, the halves' `sizes` and THE BAND SCALE, COMPUTED (BeforeAfter.tsx's
// paragraphs of those names). The owner, verbatim (2026-10-15): "refactor it
// as 2 section as the blog photo and then blog photo turns into a before and
// after section. do not rework nothing yet on phone." The pair stacks —
// half, the line lying down, half — below its root's 32rem, and stands side
// by side — half | the line | half — from it, each half a subgrid of the
// pair's rows.
//
// ── WHY A FILE OF ITS OWN. BeforeAfter.test.tsx's premise is that NO
// stylesheet is loaded: the utility tokens are its contract. Where the switch
// falls, how long the line runs, where the pictures stand under words of
// different lengths, the old phone positions and the design pixel the article
// inherits are COMPUTED lengths — a class name cannot show them — so they need
// the sheet. One premise per file (PriceList.scale.test.tsx's precedent).
//
// ── WHAT IS MEASURED:
//   · THE SWITCH and THE PICTURES STAY LEVEL, container-relative: the pair
//     alone in a box of exactly `width` px — the root's own 32rem (512px at
//     this runner's 16px root) decides, whatever the window;
//   · THE PHONE, AS IT WAS: the stacked pair against TODAY, its positions
//     measured before the halves became blog photos, written out below;
//   · ENGINES WITHOUT SUBGRID: the same pair with the subgrid taken off both
//     halves by an inline `grid-template-rows: none` — exactly what such an
//     engine computes, the declaration dropped and the property at its
//     initial value;
//   · THE WINDOWS: the pair in the article's own shape — ui/Container's
//     column, a box wearing THE BAND SCALE's two strings (sections/PostPage's
//     rhythm box), and the 42rem measure — in a real window of each width, so
//     the gutter, the measure's cap and the scale's step all play their part.
//     The measure is a stand-in reading `var(--container-2xl, 42rem)`:
//     exactly what its utility reads, so inside the scale it is the remapped
//     672 design pixels, and outside it 42rem — and no class name of the
//     page's is spelled here (Tailwind would ship a rule for it);
//   · THE `sizes`: every number of the halves' string re-derived from where
//     it LIVES, and at each window the answer it gives — its media conditions
//     asked of the engine through matchMedia — against the box the picture
//     really has.
// THE SCROLLBAR IS READ, NEVER ASSUMED: a Mac with a mouse attached draws
// classic 15px scrollbars, and the root RESERVES that gutter even with
// nothing to scroll (globals.css's `scrollbar-gutter: stable`) — the column
// loses it, while `innerWidth − clientWidth` reads 0 (measured in this runner
// at a 640px window: innerWidth 640, the root's clientWidth 640, the body
// 625). So every window below is derived from the body's width: a switch at
// 640px with overlay scrollbars is one at 658.75px behind a classic bar.
// THE REAL FACE is loaded (PostCard.titles.test.tsx's injection): how many
// lines a heading or a note takes in a half is the typeface's, and the level
// pictures are proven under words that DO wrap differently — each case
// asserts its own premise first. A grid track, a gap, a 4:3 box and a font
// SIZE do not depend on it. Tolerance: a twentieth of a pixel on a box
// (layout rounds to 1/64px), a two-hundredth on a font size (a calc of px,
// never rounded).

/** THE BAND SCALE's numbers, written out (ui/Container's THE BAND SCALE —
 *  their census is tests/unit/design-scale.test.ts): the REFERENCE column,
 *  the CAP and THE STEP in px at this runner's 16px root (the premise asserts
 *  it). Spelled again on purpose: the census holds the source, these hold what
 *  the engine does. */
const REFERENCE = 1106;
const ROOT = 16;
const CAP = 96 * ROOT;
const STEP = Math.max(56 * ROOT, 896);

/** ui/Container's column from a 600px window: 80 % of it (10vw a side), less
 *  any scrollbar (Container.tsx's THE PHONE GUTTER). */
const COLUMN_SHARE = 0.8;

/** The pair's own lengths, in design pixels (BeforeAfter.tsx and the
 *  PostPhoto halves): the root's `@lg`, the line's thickness (step 1), the
 *  air beside it (`gap-6`), the 16px between a half's parts and between the
 *  pair's rows (`gap-4`, `@lg:gap-y-4`), the heading's step (`subhead`,
 *  text-2xl), and the article's 42rem measure. */
const SWITCH = 32 * ROOT;
const LINE = 4;
const AIR = 24;
const GAP = 16;
const HEADING_FONT = 24;
const MEASURE = 42 * ROOT;

/** A side-by-side picture's width in a root of `width` px at the unit `s`:
 *  half of what the line and its air leave. */
const halfOf = (width: number, s: number): number =>
  (width - (LINE + 2 * AIR) * s) / 2;

/** A side-by-side picture in the full 42rem measure — half the measure less
 *  the line and its air, (42 − 0.25 − 3) / 2 rem — in px at this runner's
 *  root. */
const HALF_MEASURE = 19.375 * ROOT;

/** TODAY'S PHONE — the stacked pair as it stood BEFORE its halves became blog
 *  photos, MEASURED in this runner on 2026-10-15 (the old figure, a flex
 *  column of its caption and its picture, under „Înainte" / „După", one line
 *  each; the same numbers in the real face and in the fallback face): each
 *  row is a root width, then each box's [top, height] from the root's top in
 *  px — the before heading, the before picture, the line, the after heading,
 *  the after picture — and the root's height. Every box began at x 0 and ran
 *  the root's whole width. THE PHONE, AS IT WAS holds the rebuild to them. */
const TODAY = [
  [288, [0, 32], [48, 216], [288, 4], [316, 32], [364, 216], 580],
  [
    351,
    [0, 32],
    [48, 263.25],
    [335.25, 4],
    [363.25, 32],
    [411.25, 263.25],
    674.5,
  ],
  [480, [0, 32], [48, 360], [432, 4], [460, 32], [508, 360], 868],
  [
    511.5,
    [0, 32],
    [48, 383.625],
    [455.625, 4],
    [483.625, 32],
    [531.625, 383.625],
    915.25,
  ],
] as const;

/** The demo article's pictures (src/content/blog/articles — copied, never
 *  imported), their alts the hero slides' own, Romanian with diacritics
 *  (§15.7). */
const IMAGES = {
  before: {
    src: '/images/hero/treatment-room.jpg',
    alt: 'Cabinet de tratament, cu scaunul stomatologic și, pe perete, un ecran cu o radiografie panoramică',
  },
  after: {
    src: '/images/hero/instruments.jpg',
    alt: 'Prim-plan cu instrumentele suspendate pe brațul unității dentare',
  },
} as const satisfies BeforeAfterPair<PostPhotoImage>;

/** The same pictures for a pair WITHOUT headings: each alt opens on its
 *  half's word, „Înainte:" / „După:" — without headings the alts alone say
 *  which half is which, the caller's duty (BeforeAfter.tsx's `images`). An
 *  alt moves no box: the picture fills its 4:3 box whatever it says. */
const HEADLESS_IMAGES = {
  before: {
    src: IMAGES.before.src,
    alt: 'Înainte: cabinet de tratament, cu scaunul stomatologic și, pe perete, un ecran cu o radiografie panoramică',
  },
  after: {
    src: IMAGES.after.src,
    alt: 'După: prim-plan cu instrumentele suspendate pe brațul unității dentare',
  },
} as const satisfies BeforeAfterPair<PostPhotoImage>;

const HEADINGS = {
  before: 'Înainte',
  after: 'După',
} as const satisfies BeforeAfterPair<string>;

/** The default notes, finished: ONE line each in a 310px half; in a 230px
 *  half — the switch's — the before note takes TWO lines and the after note
 *  one, in the real face (each case that needs it checks), each under 40
 *  characters. */
const NOTES = {
  before: 'Notă: fotografie din cabinetul nostru.',
  after: 'Notă: după igienizare.',
} as const satisfies BeforeAfterPair<string>;

/** A heading of several lines beside a one-line heading — 3 lines in a 310px
 *  half and 4 in a 230px one, in the real face (each case checks). */
const LONG_HEADINGS = {
  before:
    'Înainte de igienizarea profesională, cu tartru pe fața dinspre limbă',
  after: 'După',
} as const satisfies BeforeAfterPair<string>;

/** The parts a pair may have. */
type Words = Pick<BeforeAfterProps, 'headings' | 'notes'>;

/** The pictures a pair of these words is handed: the plain alts under
 *  headings, the ones that say which half is which without them. */
const imagesFor = (words: Words): BeforeAfterPair<PostPhotoImage> =>
  words.headings === undefined ? HEADLESS_IMAGES : IMAGES;

/** THE FOUR INSTANCES and how many rows each half spans side by side. */
const INSTANCES = [
  ['headings and notes', { headings: HEADINGS, notes: NOTES }, 3],
  ['headings alone', { headings: HEADINGS }, 2],
  ['notes alone', { notes: NOTES }, 2],
  ['neither', {}, 1],
] as const satisfies ReadonlyArray<readonly [string, Words, 1 | 2 | 3]>;

/** The node a step found, as an HTMLElement — or a failure that NAMES what
 *  went missing, instead of a TypeError further on. */
const htmlElement = (
  node: Element | null | undefined,
  name: string,
): HTMLElement => {
  if (!(node instanceof HTMLElement)) {
    throw new Error(`BeforeAfter, measured: no ${name}`);
  }
  return node;
};

const rect = (element: Element): DOMRect => element.getBoundingClientRect();

const fontSize = (element: Element): number =>
  parseFloat(getComputedStyle(element).fontSize);

/** How many lines an element's TEXT takes — off a Range over its contents,
 *  never its box: inside a subgrid row a note's box is stretched to the
 *  row's height whatever its text does. */
const linesOf = (element: Element): number => {
  const range = document.createRange();
  range.selectNodeContents(element);
  return Math.round(
    range.getBoundingClientRect().height /
      parseFloat(getComputedStyle(element).lineHeight),
  );
};

/** One half's parts, found by structure: its heading's <figcaption> when the
 *  pair has headings, its picture's box, its note's <p> when it has notes. */
const partsOfHalf = (figure: HTMLElement) => ({
  figure,
  heading: figure.querySelector(':scope > figcaption') ?? undefined,
  box: htmlElement(figure.querySelector(':scope > div'), 'picture box'),
  note: figure.querySelector(':scope > p') ?? undefined,
});

type Half = ReturnType<typeof partsOfHalf>;

/** The pair's boxes, found from its first figure by structure (paint and
 *  layout carry no role): the root, the grid, the line and the two halves. */
const sceneOf = () => {
  const [before, after] = screen.getAllByRole('figure');
  const grid = htmlElement(before.parentElement, 'grid');
  const root = htmlElement(grid.parentElement, 'root');
  const line = htmlElement(grid.children[1], 'line');
  return {
    root,
    grid,
    line,
    halves: [partsOfHalf(before), partsOfHalf(after)] as const,
  };
};

type Scene = ReturnType<typeof sceneOf>;

/** Is the grid side by side? Read off the engine: three column tracks. */
const besideOf = ({ grid }: Scene): boolean =>
  getComputedStyle(grid).gridTemplateColumns.split(' ').length === 3;

/** Every picture box is 4:3 — its height three quarters of its width — and
 *  its picture fills it (ui/Image's `fill`, the framed situation). */
const expectFourByThree = ({ halves }: Scene): void => {
  for (const { box } of halves) {
    const { width, height } = rect(box);
    expect(height, 'a picture box’s height').toBeCloseTo(width * 0.75, 1);
    const picture = htmlElement(box.querySelector('img'), 'picture');
    expect(rect(picture).width).toBeCloseTo(width, 1);
    expect(rect(picture).height).toBeCloseTo(height, 1);
  }
};

/** Inside one half at the unit `s`: the heading at its step and 16 × s above
 *  its OWN picture, the note 16 × s under it — whichever the pair has. */
const expectHalf = (
  { heading, box, note }: Half,
  s: number,
  at: string,
): void => {
  if (heading !== undefined) {
    expect(fontSize(heading), `${at}: the heading’s step`).toBeCloseTo(
      HEADING_FONT * s,
      2,
    );
    expect(
      rect(box).top - rect(heading).bottom,
      `${at}: the heading on its own picture`,
    ).toBeCloseTo(GAP * s, 1);
  }
  if (note !== undefined) {
    expect(
      rect(note).top - rect(box).bottom,
      `${at}: the note under its own picture`,
    ).toBeCloseTo(GAP * s, 1);
  }
};

/**
 * SIDE BY SIDE at the unit `s` (1 outside THE BAND SCALE): three tracks —
 * two equal halves and the line's own 4 × s — the rows 16 × s apart, each
 * half a SUBGRID stretched over the pair's whole height (its own box from the
 * pair's top to its floor, whatever its words — the one reading that tells
 * the subgrid from the fallback, where a shorter half ends above the floor),
 * the line STANDING the pair's whole height, 24 × s of air on either side,
 * both pictures LEVEL — one top, one bottom — each heading 16 × s above its
 * own picture and each note 16 × s under it, the notes' first lines level.
 */
const expectBeside = (scene: Scene, s: number): void => {
  const { root, grid, line, halves } = scene;
  const width = rect(root).width;
  const half = halfOf(width, s);
  const style = getComputedStyle(grid);
  const tracks = style.gridTemplateColumns.split(' ').map(parseFloat);
  expect(tracks, 'three tracks').toHaveLength(3);
  expect(tracks[0]).toBeCloseTo(half, 1);
  expect(tracks[1], 'the line’s track').toBeCloseTo(LINE * s, 1);
  expect(tracks[2]).toBeCloseTo(half, 1);
  expect(parseFloat(style.rowGap), 'the rows 16 apart').toBeCloseTo(GAP * s, 2);
  expect(parseFloat(style.columnGap), 'the line’s air').toBeCloseTo(AIR * s, 2);

  const pair = rect(grid);
  const standing = rect(line);
  expect(standing.width, 'the line’s thickness').toBeCloseTo(LINE * s, 1);
  expect(standing.top, 'the line starts with the pair').toBeCloseTo(
    pair.top,
    1,
  );
  expect(standing.height, 'the line runs the pair’s height').toBeCloseTo(
    pair.height,
    1,
  );
  const [first, second] = halves;
  expect(standing.left - rect(first.figure).right, 'air before').toBeCloseTo(
    AIR * s,
    1,
  );
  expect(rect(second.figure).left - standing.right, 'air after').toBeCloseTo(
    AIR * s,
    1,
  );
  for (const [index, { figure }] of halves.entries()) {
    expect(
      getComputedStyle(figure).gridTemplateRows,
      `half ${index + 1} takes the pair’s rows`,
    ).toMatch(/^subgrid/);
    expect(
      rect(figure).top,
      `half ${index + 1} from the pair’s top`,
    ).toBeCloseTo(pair.top, 1);
    expect(
      rect(figure).height,
      `half ${index + 1} over the pair’s whole height`,
    ).toBeCloseTo(pair.height, 1);
  }

  // THE PICTURES STAY LEVEL: one top, one bottom, one width.
  const [one, two] = [first.box, second.box].map(rect);
  expect(one.width).toBeCloseTo(half, 1);
  expect(two.width).toBeCloseTo(half, 1);
  expect(one.top, 'the two pictures’ tops').toBeCloseTo(two.top, 1);
  expect(one.bottom, 'the two pictures’ bottoms').toBeCloseTo(two.bottom, 1);
  for (const [index, part] of halves.entries()) {
    expectHalf(part, s, `half ${index + 1}`);
  }
  if (first.note !== undefined && second.note !== undefined) {
    expect(rect(first.note).top, 'the notes’ first lines').toBeCloseTo(
      rect(second.note).top,
      1,
    );
  }
  expectFourByThree(scene);
};

/**
 * STACKED: one track as wide as the root, the line LYING DOWN across it 4px
 * tall, 24px of air above and below it, each picture the root's full width,
 * each heading 16px above its picture and each note 16px under it.
 */
const expectStacked = (scene: Scene): void => {
  const { root, grid, line, halves } = scene;
  const width = rect(root).width;
  const tracks = getComputedStyle(grid)
    .gridTemplateColumns.split(' ')
    .map(parseFloat);
  expect(tracks, 'one track').toHaveLength(1);
  expect(tracks[0]).toBeCloseTo(width, 1);

  const lying = rect(line);
  const [first, second] = halves;
  expect(lying.width, 'the line runs the column’s width').toBeCloseTo(width, 1);
  expect(lying.height, 'the line’s thickness').toBeCloseTo(LINE, 1);
  expect(lying.top - rect(first.figure).bottom, 'air above').toBeCloseTo(
    AIR,
    1,
  );
  expect(rect(second.figure).top - lying.bottom, 'air below').toBeCloseTo(
    AIR,
    1,
  );
  for (const [index, part] of halves.entries()) {
    expect(rect(part.box).width).toBeCloseTo(width, 1);
    expectHalf(part, 1, `half ${index + 1}`);
  }
  expectFourByThree(scene);
};

/** The pair alone, in a box of exactly `width` px. */
const renderBox = (width: number, words: Words = {}) => {
  const { unmount } = render(
    <div style={{ width: `${width}px` }}>
      <BeforeAfter images={imagesFor(words)} {...words} />
    </div>,
  );
  const scene = sceneOf();
  expect(rect(scene.root).width, 'the root').toBeCloseTo(width, 1);
  return { ...scene, unmount };
};

/** THE ARTICLE'S SHAPE (the header): ui/Container's column, the rhythm box
 *  sections/PostPage wears — THE BAND SCALE's two strings, imported, never
 *  spelled — and the 42rem measure, a flex column like the page's. */
const renderArticle = (words: Words = { headings: HEADINGS, notes: NOTES }) => {
  const { unmount } = render(
    <Container>
      <div className={cx(bandColumnClasses, bandScaleClasses)}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: 'var(--container-2xl, 42rem)',
            marginInline: 'auto',
          }}
        >
          <BeforeAfter images={imagesFor(words)} {...words} />
        </div>
      </div>
    </Container>,
  );
  const scene = sceneOf();
  const measure = htmlElement(scene.root.parentElement, 'measure');
  const rhythm = htmlElement(measure.parentElement, 'rhythm box');
  const column = htmlElement(rhythm.parentElement, 'ui/Container column');
  return { ...scene, measure, rhythm, column, unmount };
};

/** IS THE THEME REMAPPED on this box? The scale redefines `--spacing` on the
 *  box that wears it; elsewhere a box inherits the root's (DoctorShowcase's
 *  and PriceList.scale's `remapped`). */
const remapped = (element: Element): boolean =>
  getComputedStyle(element).getPropertyValue('--spacing').trim() !==
  getComputedStyle(document.documentElement)
    .getPropertyValue('--spacing')
    .trim();

/** The classic scrollbar's width, read off the BODY (the header's THE
 *  SCROLLBAR IS READ): 15 on a Mac with a mouse attached, 0 with overlay
 *  scrollbars. */
const scrollbar = (): number => window.innerWidth - rect(document.body).width;

/** The first whole window whose column is at least `column` px — 0.8 × W −
 *  the scrollbar — from a 600px window up, where the column is 80 %. */
const windowFor = (column: number): number =>
  Math.ceil((column + scrollbar()) / COLUMN_SHARE);

/** ui/Container's gutter per side at this window, off a probe wearing the
 *  real class — the clamp is spelled once, in Container.tsx. */
const gutter = (): number => {
  const probe = document.createElement('div');
  probe.className = containerClasses;
  document.body.append(probe);
  try {
    return parseFloat(getComputedStyle(probe).marginLeft);
  } finally {
    probe.remove();
  }
};

/** The design pixel THE BAND SCALE gives a column — 1 under its step. */
const unitAt = (column: number): number =>
  column >= STEP ? Math.min(column, CAP) / REFERENCE : 1;

/**
 * The width a `sizes` string ANSWERS at this window: each entry's media
 * condition asked of the engine, the first that matches wins, the last entry
 * has none — read off the string itself, never re-spelled (PostPhoto.scale's
 * reader).
 */
const answerOf = (sizes: string): number => {
  for (const entry of sizes.split(/,\s*/)) {
    const at = entry.lastIndexOf(' ');
    const condition = at === -1 ? '' : entry.slice(0, at);
    const length = at === -1 ? entry : entry.slice(at + 1);
    if (condition !== '' && !window.matchMedia(condition).matches) continue;
    const value = /^([\d.]+)(vw|rem)$/.exec(length);
    if (value === null) throw new Error(`an unread length: ${length}`);
    return value[2] === 'vw'
      ? (Number(value[1]) / 100) * window.innerWidth
      : Number(value[1]) * ROOT;
  }
  throw new Error(`no entry of ${sizes} matched`);
};

/** The `sizes` both pictures carry — read off the rendered pair, so the
 *  derivation and the claims judge the string that ships. */
const shippedSizes = (scene: Scene): string => {
  const [one, two] = scene.halves.map(({ box }) =>
    htmlElement(box.querySelector('img'), 'picture').getAttribute('sizes'),
  );
  expect(one, 'the two pictures ask alike').toBe(two);
  if (one === null) throw new Error('BeforeAfter, measured: no sizes');
  return one;
};

/** THE POINTER, PARKED before each reading — a resting pointer is :hover
 *  (PostCard.test.tsx's helper, KEEP-IN-SYNC; PostPhoto's suites park the
 *  same way). Nothing in the pair answers hover today; the park keeps a
 *  reading from ever depending on where the last file left the mouse. A REAL
 *  pointer: a synthetic event cannot move :hover. Registers the calling
 *  block's own hooks. */
const parkBeforeEach = (): void => {
  let unpark: (() => void) | undefined;
  beforeEach(async () => {
    const parking = document.createElement('div');
    parking.style.cssText = 'width: 2rem; height: 2rem';
    document.body.prepend(parking);
    await realUser.hover(parking);
    unpark = () => parking.remove();
  });
  afterEach(() => {
    unpark?.();
    unpark = undefined;
  });
};

// The REAL typeface, as PostCard.titles.test.tsx and the route's notes test
// load it: the declaration .storybook/preview-fonts.css makes for Storybook,
// its URL served from the repo's root, `font-display: block` so a fallback is
// never measured.
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
`;
let injected: HTMLStyleElement | null = null;

const HEIGHT = 900;

describe('BeforeAfter — measured (the real sheet, the real face)', () => {
  parkBeforeEach();

  beforeAll(async () => {
    // THE PREMISE: the 16px root every number above is written at, an engine
    // that reads subgrid, and a place where THE BAND SCALE can apply — a fine
    // primary pointer and an engine that registers custom properties,
    // globals.css's THE SCALABLE VARIANT — so the cases that expect the scale
    // cannot pass for the wrong reason.
    expect(
      parseFloat(getComputedStyle(document.documentElement).fontSize),
      'the root font size',
    ).toBe(ROOT);
    expect(
      CSS.supports('grid-template-rows', 'subgrid'),
      'the engine reads subgrid',
    ).toBe(true);
    expect(
      window.matchMedia('(pointer: fine)').matches,
      'the runner’s primary pointer is fine — a mouse, as on a laptop',
    ).toBe(true);
    expect(
      CSS.supports('color', 'rgb(from red r g b)'),
      'the engine reads relative colour syntax — the scale’s @supports gate',
    ).toBe(true);
    injected = document.createElement('style');
    injected.textContent = INJECTED_CSS;
    document.head.append(injected);
    // load(), not just ready: nothing has rendered yet — and a 404 on the
    // subset REJECTS here, loudly.
    await document.fonts.load(`1rem "${SERIF}"`);
    await document.fonts.ready;
  });

  // Every case below sets its own window; the runner's default comes back
  // after the file, and the face leaves with it.
  afterAll(async () => {
    injected?.remove();
    injected = null;
    await page.viewport(414, 896);
  });

  describe('THE SWITCH — the root’s own 32rem, whatever the window', () => {
    it.each(INSTANCES)(
      '%s: stacks in a 288, 351, 480 and 511.5px root — one column, the line lying down across it',
      async (_label, words) => {
        await page.viewport(1280, HEIGHT);
        for (const width of [288, 351, 480, 511.5]) {
          const scene = renderBox(width, words);
          expect(besideOf(scene), `${width}px`).toBe(false);
          expectStacked(scene);
          scene.unmount();
        }
      },
    );

    it.each(INSTANCES)(
      '%s: stands side by side in a 512, 595.2 and 672px root — half | the line | half, as many rows as each half has parts',
      async (_label, words, parts) => {
        await page.viewport(1280, HEIGHT);
        for (const width of [SWITCH, 595.2, MEASURE]) {
          const scene = renderBox(width, words);
          expect(besideOf(scene), `${width}px`).toBe(true);
          expect(
            getComputedStyle(scene.grid).gridTemplateRows.split(' '),
            `${width}px: the pair's rows`,
          ).toHaveLength(parts);
          expectBeside(scene, 1);
          scene.unmount();
        }
      },
    );

    it('draws the pictures 230px wide at the switch and 310px in the full 42rem measure', async () => {
      await page.viewport(1280, HEIGHT);
      const atSwitch = renderBox(SWITCH, { headings: HEADINGS });
      expect(rect(atSwitch.halves[0].box).width).toBeCloseTo(230, 1);
      expect(rect(atSwitch.halves[0].box).height).toBeCloseTo(172.5, 1);
      atSwitch.unmount();
      const full = renderBox(MEASURE, { headings: HEADINGS });
      expect(rect(full.halves[0].box).width).toBeCloseTo(HALF_MEASURE, 1);
      expect(rect(full.halves[0].box).height).toBeCloseTo(232.5, 1);
    });
  });

  describe('THE PHONE, AS IT WAS — the stacked pair where it stood before its halves became blog photos', () => {
    it.each(TODAY)(
      'in a %spx root, under headings alone: every heading, picture and the line exactly where they stood',
      async (
        width,
        beforeHeading,
        beforePicture,
        line,
        afterHeading,
        afterPicture,
        height,
      ) => {
        await page.viewport(1280, HEIGHT);
        const scene = renderBox(width, { headings: HEADINGS });
        const [first, second] = scene.halves;
        const origin = rect(scene.root);
        const boxes = [
          [first.heading, beforeHeading],
          [first.box, beforePicture],
          [scene.line, line],
          [second.heading, afterHeading],
          [second.box, afterPicture],
        ] as const;
        for (const [index, [box, [top, tall]]] of boxes.entries()) {
          const at = rect(htmlElement(box, `box ${index + 1}`));
          expect(at.top - origin.top, `box ${index + 1}’s top`).toBeCloseTo(
            top,
            1,
          );
          expect(at.height, `box ${index + 1}’s height`).toBeCloseTo(tall, 1);
          expect(at.left - origin.left, `box ${index + 1}’s left`).toBeCloseTo(
            0,
            1,
          );
          expect(at.width, `box ${index + 1}’s width`).toBeCloseTo(width, 1);
        }
        expect(origin.height, 'the pair’s height').toBeCloseTo(height, 1);
      },
    );

    it.each(TODAY)(
      'in a %spx root, under headings and notes: the same, each note 16px under its own picture and pushing what follows down by its own height',
      async (
        width,
        beforeHeading,
        beforePicture,
        line,
        afterHeading,
        afterPicture,
        height,
      ) => {
        await page.viewport(1280, HEIGHT);
        const scene = renderBox(width, { headings: HEADINGS, notes: NOTES });
        const [first, second] = scene.halves;
        const origin = rect(scene.root);
        const top = (element: Element | undefined, name: string): number =>
          rect(htmlElement(element, name)).top - origin.top;
        const [beforeNote, afterNote] = [first.note, second.note].map(
          (note, index) => rect(htmlElement(note, `note ${index + 1}`)),
        );
        // What the before note adds above everything after it: its 16px and
        // its own height.
        const pushed = GAP + beforeNote.height;
        expect(top(first.heading, 'heading 1')).toBeCloseTo(
          beforeHeading[0],
          1,
        );
        expect(top(first.box, 'picture 1')).toBeCloseTo(beforePicture[0], 1);
        expect(beforeNote.top - origin.top, 'note 1').toBeCloseTo(
          beforePicture[0] + beforePicture[1] + GAP,
          1,
        );
        expect(top(scene.line, 'line')).toBeCloseTo(line[0] + pushed, 1);
        expect(top(second.heading, 'heading 2')).toBeCloseTo(
          afterHeading[0] + pushed,
          1,
        );
        expect(top(second.box, 'picture 2')).toBeCloseTo(
          afterPicture[0] + pushed,
          1,
        );
        expect(afterNote.top - origin.top, 'note 2').toBeCloseTo(
          afterPicture[0] + pushed + afterPicture[1] + GAP,
          1,
        );
        expect(origin.height, 'the pair’s height').toBeCloseTo(
          height + pushed + GAP + afterNote.height,
          1,
        );
      },
    );
  });

  describe('THE PICTURES STAY LEVEL — the halves on the pair’s rows (a subgrid)', () => {
    it.each([SWITCH, MEASURE])(
      'in a %ipx root, under HEADINGS of different line counts: both pictures level, the shorter heading seated on its own picture',
      async (width) => {
        await page.viewport(1280, HEIGHT);
        const scene = renderBox(width, {
          headings: LONG_HEADINGS,
          notes: NOTES,
        });
        const [first, second] = scene.halves;
        const [long, short] = [first.heading, second.heading].map((heading) =>
          linesOf(htmlElement(heading, 'heading')),
        );
        // THE PREMISE: the long heading really takes more lines.
        expect(long, 'the long heading’s lines').toBeGreaterThan(short);
        expect(short).toBe(1);
        expectBeside(scene, 1);
        // The shorter heading simply starts lower — on its own picture.
        expect(
          rect(htmlElement(second.heading, 'heading 2')).top,
        ).toBeGreaterThan(rect(htmlElement(first.heading, 'heading 1')).top);
      },
    );

    it('in a 512px root, under NOTES of different line counts: both pictures level, each note right under its own picture, their first lines level', async () => {
      await page.viewport(1280, HEIGHT);
      const scene = renderBox(SWITCH, {
        headings: HEADINGS,
        notes: NOTES,
      });
      const [first, second] = scene.halves;
      const [two, one] = [first.note, second.note].map((note) =>
        linesOf(htmlElement(note, 'note')),
      );
      // THE PREMISE: the notes really wrap differently — two lines at most,
      // the owner's rule, and one.
      expect(two, 'the long note’s lines').toBe(2);
      expect(one, 'the short note’s lines').toBe(1);
      expectBeside(scene, 1);
    });

    it('in a 512px root, under notes alone of different line counts: the pictures level at the pair’s top', async () => {
      await page.viewport(1280, HEIGHT);
      const scene = renderBox(SWITCH, { notes: NOTES });
      const [first, second] = scene.halves;
      expect(linesOf(htmlElement(first.note, 'note 1'))).toBe(2);
      expect(linesOf(htmlElement(second.note, 'note 2'))).toBe(1);
      expectBeside(scene, 1);
      expect(rect(first.box).top).toBeCloseTo(rect(scene.grid).top, 1);
    });

    it('ignores the halves’ own alignment while they are subgrids — a subgrid is always stretched — so the fallback’s lever costs nothing here', async () => {
      await page.viewport(1280, HEIGHT);
      const scene = renderBox(SWITCH, {
        headings: LONG_HEADINGS,
        notes: NOTES,
      });
      const boxes = (): number[][] =>
        scene.halves.flatMap(({ figure, heading, box, note }) =>
          [figure, heading, box, note].map((element) => {
            const at = rect(htmlElement(element, 'part'));
            return [at.left, at.top, at.width, at.height];
          }),
        );
      const asLaidOut = boxes();
      for (const [index, align] of ['end', 'center'].entries()) {
        scene.halves[index].figure.style.alignSelf = align;
      }
      expect(boxes()).toEqual(asLaidOut);
    });
  });

  describe('ENGINES WITHOUT SUBGRID — the halves’ subgrid taken off, as such an engine drops it', () => {
    /** The fallback, forced: the declaration such an engine drops leaves the
     *  property at its initial value — exactly this inline style. */
    const dropSubgrid = (scene: Scene): void => {
      for (const { figure } of scene.halves) {
        figure.style.gridTemplateRows = 'none';
        expect(getComputedStyle(figure).gridTemplateRows).not.toMatch(
          /subgrid/,
        );
      }
    };

    /** WHAT IT SHOWS, whatever the words: each half at the pair's top at its
     *  own height, its parts 16px apart in order (nothing overlaps), every
     *  part inside its half and both halves inside the pair (nothing is
     *  cut), the line the pair's height. */
    const expectFallback = (scene: Scene): void => {
      const pair = rect(scene.grid);
      for (const [
        index,
        { figure, heading, box, note },
      ] of scene.halves.entries()) {
        const at = `half ${index + 1}`;
        const half = rect(figure);
        expect(half.top, `${at} at the pair’s top`).toBeCloseTo(pair.top, 1);
        const parts = [heading, box, note].filter(
          (part): part is Element => part !== undefined,
        );
        for (const [step, part] of parts.slice(1).entries()) {
          expect(
            rect(part).top - rect(parts[step]).bottom,
            `${at}: part ${step + 2} 16px under part ${step + 1}`,
          ).toBeCloseTo(GAP, 1);
        }
        expect(
          rect(htmlElement(parts.at(-1), 'last part')).bottom,
          `${at} at its own height`,
        ).toBeCloseTo(half.bottom, 1);
        for (const part of parts) {
          expect(rect(part).top).toBeGreaterThanOrEqual(half.top - 0.05);
          expect(rect(part).bottom).toBeLessThanOrEqual(half.bottom + 0.05);
        }
        expect(figure.scrollHeight).toBeLessThanOrEqual(figure.clientHeight);
        expect(half.bottom).toBeLessThanOrEqual(pair.bottom + 0.05);
      }
      expect(rect(scene.line).top).toBeCloseTo(pair.top, 1);
      expect(rect(scene.line).height).toBeCloseTo(pair.height, 1);
      expect(scene.root.scrollHeight).toBeLessThanOrEqual(
        scene.root.clientHeight,
      );
      expectFourByThree(scene);
    };

    it('under headings that take as many lines: the pictures stay LEVEL, the notes hanging at their own lengths', async () => {
      await page.viewport(1280, HEIGHT);
      const scene = renderBox(SWITCH, {
        headings: HEADINGS,
        notes: NOTES,
      });
      dropSubgrid(scene);
      expectFallback(scene);
      const [first, second] = scene.halves;
      expect(rect(first.box).top).toBeCloseTo(rect(second.box).top, 1);
      // The shorter half ends above the pair's floor: it is not stretched.
      expect(rect(second.figure).bottom).toBeLessThan(
        rect(scene.grid).bottom - 1,
      );
    });

    it('under headings of different line counts: the pictures STEP by the difference — and nothing overlaps or is cut', async () => {
      await page.viewport(1280, HEIGHT);
      const scene = renderBox(SWITCH, {
        headings: LONG_HEADINGS,
        notes: NOTES,
      });
      dropSubgrid(scene);
      expectFallback(scene);
      const [first, second] = scene.halves;
      const [long, short] = [first.heading, second.heading].map((heading) =>
        rect(htmlElement(heading, 'heading')),
      );
      expect(rect(first.box).top - rect(second.box).top).toBeCloseTo(
        long.height - short.height,
        1,
      );
    });

    it('needs its lever — without `@lg:items-start` (the default stretch) the pictures step even under headings that take as many lines', async () => {
      await page.viewport(1280, HEIGHT);
      const scene = renderBox(SWITCH, {
        headings: HEADINGS,
        notes: NOTES,
      });
      dropSubgrid(scene);
      for (const { figure } of scene.halves) figure.style.alignSelf = 'stretch';
      const [first, second] = scene.halves;
      expect(
        Math.abs(rect(first.box).top - rect(second.box).top),
      ).toBeGreaterThan(1);
    });
  });

  describe('THE WINDOWS — the article’s shape in a real window, outside THE BAND SCALE', () => {
    it('stacks one window under the switch and stands side by side from it — 40rem of window, plus 1.25 × any scrollbar', async () => {
      await page.viewport(1280, HEIGHT);
      // The window whose column is the switch: 0.8 W − scrollbar = 32rem —
      // 640px with overlay scrollbars, 658.75 → 659 behind a classic bar.
      const bar = scrollbar();
      const switchWindow = windowFor(SWITCH);
      expect(switchWindow).toBe(Math.ceil((SWITCH + bar) / COLUMN_SHARE));

      await page.viewport(switchWindow - 1, HEIGHT);
      const under = renderArticle();
      expect(remapped(under.rhythm), 'no scale under its step').toBe(false);
      expect(rect(under.root).width).toBeLessThan(SWITCH);
      expect(besideOf(under)).toBe(false);
      expectStacked(under);
      under.unmount();

      await page.viewport(switchWindow, HEIGHT);
      const at = renderArticle();
      expect(rect(at.root).width).toBeGreaterThanOrEqual(SWITCH);
      expect(rect(at.root).width).toBeLessThan(SWITCH + 1);
      expect(besideOf(at)).toBe(true);
      expectBeside(at, 1);
    });

    it.each([
      [320, false],
      [390, false],
      [440, false],
      [600, false],
      [744, true],
      [768, true],
      [900, true],
      [1024, true],
      [1100, true],
    ] as const)(
      'at a %ipx window — side by side: %s — the root the column, capped at 42rem',
      async (width, beside) => {
        await page.viewport(width, HEIGHT);
        const scene = renderArticle();
        const column = width - scrollbar() - 2 * gutter();
        expect(rect(scene.column).width, 'the column').toBeCloseTo(column, 1);
        expect(remapped(scene.rhythm), 'no scale under its step').toBe(false);
        expect(rect(scene.root).width, 'the measure').toBeCloseTo(
          Math.min(column, MEASURE),
          1,
        );
        expect(besideOf(scene)).toBe(beside);
        if (beside) expectBeside(scene, 1);
        else expectStacked(scene);
        // NOTHING SIDEWAYS — measured against the root's own BOX, which ends
        // where the reserved scrollbar gutter begins, never its
        // `clientWidth`: in this runner that is the whole window, the 15px
        // gutter included (the header's THE SCROLLBAR IS READ: 640 at a 640px
        // window, the body 625), so it let up to 15px of real overflow
        // through (PostHeader.stories.tsx's NOTHING SIDEWAYS, the same
        // reading; the round-3 a11y review, 2026-10-20).
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
          Math.ceil(document.documentElement.getBoundingClientRect().width),
        );
      },
    );

    it('reaches the full 19.375rem picture where the measure reaches 42rem — a 52.5rem window, plus 1.25 × any scrollbar', async () => {
      await page.viewport(1280, HEIGHT);
      const capWindow = windowFor(MEASURE);

      await page.viewport(capWindow - 1, HEIGHT);
      const under = renderArticle();
      expect(rect(under.root).width).toBeLessThan(MEASURE);
      expect(rect(under.halves[0].box).width).toBeLessThan(HALF_MEASURE);
      under.unmount();

      await page.viewport(capWindow, HEIGHT);
      const at = renderArticle();
      expect(rect(at.root).width).toBeCloseTo(MEASURE, 1);
      expect(rect(at.halves[0].box).width).toBeCloseTo(HALF_MEASURE, 1);
    });
  });

  describe('THE BAND SCALE — inherited from the article’s rhythm box, never worn', () => {
    it.each([1140, 1280, 1401, 1536, 1920, 2560])(
      'at a %ipx window: the measure 672 × s, each picture 310 × s, the line 4 × s, the heading 24 × s, the gaps 16 × s — side by side',
      async (width) => {
        await page.viewport(width, HEIGHT);
        const scene = renderArticle();
        const column = rect(scene.column).width;
        const s = unitAt(column);
        expect(column, 'a column past the step').toBeGreaterThanOrEqual(STEP);
        expect(remapped(scene.rhythm), 'the rhythm box remaps').toBe(true);
        // The section wears no scale of its own: nothing below the rhythm
        // box re-declares the pixel.
        expect(
          getComputedStyle(scene.root).getPropertyValue('--spacing').trim(),
        ).toBe(
          getComputedStyle(scene.rhythm).getPropertyValue('--spacing').trim(),
        );
        expect(rect(scene.root).width, 'the measure, 672 × s').toBeCloseTo(
          MEASURE * s,
          1,
        );
        expect(besideOf(scene)).toBe(true);
        expectBeside(scene, s);
        expect(
          rect(scene.halves[0].box).width,
          'each picture, 310 × s',
        ).toBeCloseTo(HALF_MEASURE * s, 1);
      },
    );

    it('is NOT in the scale a pixel of column under its step — the theme’s 310px picture — and draws it 310 × s past it (the recorded jump)', async () => {
      await page.viewport(1280, HEIGHT);
      const stepWindow = windowFor(STEP);

      await page.viewport(stepWindow - 1, HEIGHT);
      const under = renderArticle();
      expect(rect(under.column).width).toBeLessThan(STEP);
      expect(remapped(under.rhythm)).toBe(false);
      expect(rect(under.halves[0].box).width).toBeCloseTo(HALF_MEASURE, 1);
      under.unmount();

      await page.viewport(stepWindow, HEIGHT);
      const at = renderArticle();
      const column = rect(at.column).width;
      expect(column).toBeGreaterThanOrEqual(STEP);
      expect(column).toBeLessThan(STEP + 1);
      expect(remapped(at.rhythm)).toBe(true);
      expect(rect(at.halves[0].box).width).toBeCloseTo(
        HALF_MEASURE * (column / REFERENCE),
        1,
      );
    });

    it('stops growing past the 96rem cap and centres the article in its column', async () => {
      await page.viewport(2560, HEIGHT);
      const scene = renderArticle();
      const column = rect(scene.column);
      const rhythm = rect(scene.rhythm);
      expect(rhythm.width).toBeCloseTo(CAP, 1);
      expect(rhythm.left - column.left).toBeCloseTo(
        column.right - rhythm.right,
        1,
      );
      expect(rect(scene.halves[0].box).width).toBeCloseTo(
        HALF_MEASURE * (CAP / REFERENCE),
        1,
      );
    });
  });

  describe('THE HALVES’ `sizes`, derived from where every number lives', () => {
    /** The one `const NAME = '…'` string of a source, or a failure naming it. */
    const constant = (code: string, name: string): string => {
      const value = new RegExp(`\\bconst ${name} =\\s*'([^']*)'`).exec(
        code,
      )?.[1];
      if (value === undefined) throw new Error(`no ${name} in the source`);
      return value;
    };
    /** A theme variable of the real stylesheet, in rem. */
    const themeRem = (name: string): number => {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
      const rems = /^([\d.]+)rem$/.exec(value)?.[1];
      if (rems === undefined) throw new Error(`${name} is ${value}, not rem`);
      return Number(rems);
    };
    /** The one token of `element` a pattern matches, its first group. */
    const token = (element: Element, pattern: RegExp): string => {
      const found = (element.getAttribute('class') ?? '')
        .split(/\s+/)
        .map((each) => pattern.exec(each)?.[1])
        .filter((each): each is string => each !== undefined);
      expect(found, `${pattern} on ${element.tagName}`).toHaveLength(1);
      return found[0];
    };

    // THE MEASURE: sections/PostPage's MEASURE names a container step of the
    // theme (`max-w-2xl`), and the theme says what that step is.
    const measureStep = /(?:^|\s)max-w-(\w+)(?:\s|$)/.exec(
      constant(postPageSource, 'MEASURE'),
    )?.[1];
    // THE BAND SCALE: the container step and its floor (the gate every regime
    // class opens with), the cap and the reference — off ui/Container's pixel
    // string, read in three parts: the design pixel's bracketed declaration is
    // never written here whole (tests/unit/design-scale.test.ts's THE D-LIT
    // RULE — Tailwind would ship it as a rule nobody wears).
    const gate = /^scalable:@(\w+):@min-\[(\d+)px\]:/.exec(bandScaleClasses);
    const cap = /min\(100cqw,(\d+)rem\)/.exec(bandScaleClasses)?.[1];
    const reference = /\)\/(\d+)\*var\(--band-zoom/.exec(bandScaleClasses)?.[1];
    // THE GUTTER: clamp(floor, clamp(P vw, R vw − K rem, T vw), cap).
    const gutterShares =
      /mx-\[clamp\([^,]+,clamp\(([\d.]+)vw,([\d.]+)vw_-_([\d.]+)rem,([\d.]+)vw\),/.exec(
        containerClasses,
      );
    // THE POINTER: the condition globals.css's `scalable:` variant asks.
    const pointer =
      /@custom-variant scalable \{[\s\S]*?@media (\([^)]*\))/.exec(
        globalsSource,
      )?.[1];

    /**
     * The width, in rem, of the container query a class compiles under — read
     * off the COMPILED sheet: Tailwind writes a container variant's size into
     * the `@container` rule itself, and no theme variable carries it (the
     * `--container-*` steps the site's utilities never read are not even
     * emitted). The rule's text is read whether the engine holds it flattened
     * (the query around the class) or nested (the query inside it).
     */
    const containerRemOf = (className: string): number => {
      const selector = `.${CSS.escape(className)}`;
      const size = /\((?:width >= |min-width: )([\d.]+)rem\)/;
      const found = new Set<number>();
      const walk = (rules: CSSRuleList): void => {
        for (const rule of Array.from(rules)) {
          if (
            rule instanceof CSSContainerRule &&
            Array.from(rule.cssRules).some(
              (inner) =>
                inner instanceof CSSStyleRule &&
                inner.selectorText === selector,
            )
          ) {
            const width = size.exec(rule.conditionText)?.[1];
            if (width !== undefined) found.add(Number(width));
          }
          if (rule instanceof CSSStyleRule && rule.selectorText === selector) {
            for (const inner of Array.from(rule.cssRules)) {
              if (inner instanceof CSSContainerRule) {
                const width = size.exec(inner.conditionText)?.[1];
                if (width !== undefined) found.add(Number(width));
              }
            }
          }
          if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules);
        }
      };
      for (const sheet of Array.from(document.styleSheets))
        walk(sheet.cssRules);
      expect([...found], `the container query of ${className}`).toHaveLength(1);
      return [...found][0];
    };

    /** THIS section's own numbers, off the pair it renders: the switch (the
     *  container query its grid's three columns compile under), the line's
     *  thickness (its standing width, in spacing steps) and the air (the
     *  grid's gap, in steps) — the steps through the theme's `--spacing`. */
    const ownNumbers = () => {
      const scene = renderBox(MEASURE, { headings: HEADINGS, notes: NOTES });
      const columns = token(scene.grid, /^(@\w+:grid-cols-.+)$/);
      const lineSteps = Number(token(scene.line, /^@\w+:w-(\d+)$/));
      const airSteps = Number(token(scene.grid, /^gap-(\d+)$/));
      const spacingRem = themeRem('--spacing');
      return {
        scene,
        switchRem: containerRemOf(columns),
        lineRem: lineSteps * spacingRem,
        airRem: airSteps * spacingRem,
      };
    };

    it('reads its inputs, never vacuous — the measure, the switch, the line and its air, the scale, the gutter, the pointer', async () => {
      await page.viewport(1280, HEIGHT);
      expect(measureStep, 'PostPage’s MEASURE names a container step').toBe(
        '2xl',
      );
      expect(themeRem(`--container-${measureStep}`)).toBe(42);
      const { switchRem, lineRem, airRem } = ownNumbers();
      expect(switchRem).toBe(32);
      expect(lineRem).toBe(0.25);
      expect(airRem).toBe(1.5);
      expect(gate, 'ui/Container’s gate').not.toBeNull();
      expect(themeRem(`--container-${gate?.[1]}`)).toBe(56);
      expect(Number(gate?.[2])).toBe(896);
      expect(Number(cap)).toBe(96);
      expect(Number(reference)).toBe(REFERENCE);
      expect(gutterShares, 'ui/Container’s gutter').not.toBeNull();
      expect(gutterShares?.slice(1).map(Number)).toEqual([5, 30, 7.5, 10]);
      expect(pointer).toBe('(pointer: fine)');
    });

    it('is exactly the string those numbers give', async () => {
      await page.viewport(1280, HEIGHT);
      const { scene, switchRem, lineRem, airRem } = ownNumbers();
      const measureRem = themeRem(`--container-${measureStep}`);
      const stepRem = themeRem(`--container-${gate?.[1]}`);
      const [phoneVw, rampVw, rampRem, tabletVw] =
        gutterShares?.slice(1).map(Number) ?? [];
      // The column's share of the window from the ramp's end up: 1 − 2 × T vw.
      const column = 1 - (2 * tabletVw) / 100;
      // The window, in rem, from which the gutter is T vw: R vw − K rem = T vw.
      const rampEnd = (100 * rampRem) / (rampVw - tabletVw);
      // A half side by side, in rem: what the line and its air leave of the
      // measure, halved.
      const halfRem = (measureRem - lineRem - 2 * airRem) / 2;
      // THE BAND SCALE: the half in design pixels — its rem × 16, the theme's
      // own multiplier (globals.css's THE DESIGN SCALE) — over the reference
      // column, which is 0.8 of the window.
      const scaled = Math.ceil(
        (100 * halfRem * 16 * column) / Number(reference),
      );
      // Side by side from the switch's window behind a scrollbar of up to
      // 1rem: (switch + 1rem) / 0.8.
      const besideFrom = (switchRem + 1) / column;

      expect(halfRem).toBe(19.375);
      expect(scaled).toBe(23);
      expect(stepRem / column).toBe(70);
      expect(besideFrom).toBe(41.25);
      expect(rampEnd).toBe(37.5);
      // Each answer asks from a narrower window than the one before it; the
      // 80vw stretch never meets the measure's cap (a stacked half is the
      // column there), and the beside answer starts past the switch behind a
      // classic 15px scrollbar.
      expect(stepRem / column).toBeGreaterThan(besideFrom);
      expect(besideFrom).toBeGreaterThan(rampEnd);
      expect(besideFrom).toBeLessThan(measureRem / column);
      expect(besideFrom * ROOT).toBeGreaterThanOrEqual(
        (switchRem * ROOT + 15) / column,
      );
      expect(shippedSizes(scene)).toBe(
        `(min-width: ${stepRem / column}rem) and ${pointer} ${scaled}vw, ` +
          `(min-width: ${besideFrom}rem) ${halfRem}rem, ` +
          `(min-width: ${rampEnd}rem) ${100 * column}vw, ` +
          `${100 - 2 * phoneVw}vw`,
      );
    });
  });

  describe('THE `sizes` CLAIMS — the answer against the box, window by window', () => {
    /** Windows across every regime and every edge the header names: the
     *  phones, the gutter's ramp and its end (480 / 599 / 600), the switch
     *  (640 / 659) and the 41.25rem answer, the measure's cap (840 / 859),
     *  the scale's 70rem answer and its step (1120 / 1139), the 1920 cap, and
     *  past it. */
    const WINDOWS = [
      320, 360, 390, 430, 480, 540, 599, 600, 620, 639, 640, 658, 659, 660, 700,
      744, 768, 800, 839, 840, 858, 859, 1024, 1119, 1120, 1138, 1139, 1140,
      1280, 1401, 1536, 1919, 1920, 2200, 2560,
    ];

    it('never under the box but by bound (2); over 1.37× only where 80vw meets a picture beside its twin, and there 2.3× at most', async () => {
      await page.viewport(1280, HEIGHT);
      const switchWindow = windowFor(SWITCH);
      const stepWindow = windowFor(STEP);
      for (const width of WINDOWS) {
        await page.viewport(width, HEIGHT);
        const scene = renderArticle();
        const picture = rect(scene.halves[0].box).width;
        const answer = answerOf(shippedSizes(scene));
        const ratio = answer / picture;
        const at = `at ${width}px — picture ${picture.toFixed(2)} · answer ${answer.toFixed(2)}`;
        if (width >= 70 * ROOT && width < stepWindow) {
          // BOUND (2): a classic scrollbar holds the scale's step past the
          // 70rem answer, so a mouse there is told 23vw of the theme's 310px
          // picture — never more than 17 % under (empty without a bar).
          expect(besideOf(scene), at).toBe(true);
          expect(remapped(scene.rhythm), at).toBe(false);
          expect(ratio, at).toBeGreaterThanOrEqual(0.83);
        } else {
          expect(answer, at).toBeGreaterThanOrEqual(picture - 0.05);
        }
        if (width >= switchWindow && width < 41.25 * ROOT) {
          // The 80vw answer for a picture already beside its twin: at most
          // 0.8 × 659 / 230.1 = 2.29 × the box behind a classic scrollbar.
          expect(besideOf(scene), at).toBe(true);
          expect(ratio, at).toBeLessThanOrEqual(2.3);
        } else {
          expect(ratio, at).toBeLessThanOrEqual(1.37);
        }
        scene.unmount();
      }
    }, 60_000);
  });
});
