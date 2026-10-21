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
// reason this file exists apart from PostPhoto.test.tsx's box-level readings
// (the header below). The per-file import is the house pattern (BeforeAfter,
// PriceList, DoctorProfile and PostCover's `.scale` suites).
import '@/styles/globals.css';
import globalsSource from '@/styles/globals.css?raw';
import {
  bandColumnClasses,
  bandScaleClasses,
  Container,
  containerClasses,
} from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx/cx';
import { POST_PHOTO_SIZES, PostPhoto, type PostPhotoImage } from './PostPhoto';
import postPageSource from '../PostPage/PostPage.tsx?raw';

// sections/PostPhoto — THE `sizes`, DERIVED and THE BAND SCALE, computed in
// the article's own shape (PostPhoto.tsx's paragraphs of those names). The
// owner, verbatim (2026-10-15): "the image as it is now on inaite dupa as
// shape but wide as the article as it is a single standing blog section".
//
// ── WHY A FILE OF ITS OWN. The cases below set the WINDOW, window by window:
// what the picture's `sizes` answers depends on the window, and so do the
// measure, the gutter and THE BAND SCALE's design pixel. One premise per file
// (BeforeAfter.scale.test.tsx's and PriceList.scale.test.tsx's precedent):
// PostPhoto.test.tsx reads the figure in boxes of a fixed width.
//
// ── WHAT IS READ, three ways:
//   · THE DERIVATION: every number in POST_PHOTO_SIZES re-derived from where
//     it LIVES — the measure's step off sections/PostPage's MEASURE and the
//     theme, THE BAND SCALE's reference, step and cap off ui/Container's
//     strings, the gutter's shares off its clamp, the pointer condition off
//     globals.css's `scalable:` variant — so a change to any of them turns
//     this file red until the string is derived again;
//   · THE CLAIMS: at each window, the answer the string gives — its media
//     conditions asked of the engine through matchMedia — against the box the
//     picture really has, in the article's shape;
//   · THE BAND SCALE: the photo, its heading, its note and its gaps drawn in
//     the article's design pixel past the scale's step, and the theme's own
//     sizes under it — inherited from the rhythm box, never worn here.
// THE ARTICLE'S SHAPE: ui/Container's column, a box wearing THE BAND SCALE's
// two strings (sections/PostPage's rhythm box), and a stand-in for the 42rem
// measure reading `var(--container-2xl, 42rem)` — exactly what the measure's
// utility reads, so inside the scale it is the remapped 672 design pixels
// and outside it 42rem — with no class name of the page's spelled here
// (Tailwind would ship a rule for it). BeforeAfter.scale.test.tsx's shape.
// THE SCROLLBAR IS READ, NEVER ASSUMED: a Mac with a mouse attached draws a
// classic 15px scrollbar, which the root RESERVES even with nothing to scroll
// (globals.css's `scrollbar-gutter: stable`); the column loses it, so every
// window below is derived from the body's width.
// No typeface is loaded and none is needed: a box, a gap, a 4:3 ratio and a
// font SIZE do not depend on glyph shapes. Tolerance: a twentieth of a pixel
// on a box (layout rounds to 1/64px), a two-hundredth on a font size.

/** THE BAND SCALE's numbers at this runner's 16px root (the premise asserts
 *  it), spelled again on purpose: the derivation reads the source, these hold
 *  what the engine does (BeforeAfter.scale.test.tsx's constants). */
const ROOT = 16;
const REFERENCE = 1106;
const CAP = 96 * ROOT;
const STEP = Math.max(56 * ROOT, 896);

/** ui/Container's column from a 600px window: 80 % of it, less any
 *  scrollbar (Container.tsx's THE PHONE GUTTER). */
const COLUMN_SHARE = 0.8;

/** The photo's own lengths at the theme's sizes (PostPhoto.tsx): the measure,
 *  the heading's step, the note's step, the gap between the parts. */
const MEASURE = 42 * ROOT;
const HEADING_FONT = 24;
const NOTE_FONT = 16;
const GAP = 16;

/** The demo words (§15.7, with diacritics) and the clinic's treatment room. */
const IMAGE = {
  src: '/images/hero/treatment-room.jpg',
  alt: 'Cabinet de tratament, cu scaunul stomatologic și, pe perete, un ecran cu o radiografie panoramică',
} as const satisfies PostPhotoImage;
const HEADING = 'Cabinetul de tratament';
const NOTE = 'Notă: fotografie din cabinetul nostru.';

const HEIGHT = 900;

/** The node a step found, as an HTMLElement — or a failure that NAMES what
 *  went missing, instead of a TypeError further on. */
const htmlElement = (
  node: Element | null | undefined,
  name: string,
): HTMLElement => {
  if (!(node instanceof HTMLElement)) {
    throw new Error(`PostPhoto, measured: no ${name}`);
  }
  return node;
};

const rect = (element: Element): DOMRect => element.getBoundingClientRect();

const fontSize = (element: Element): number =>
  parseFloat(getComputedStyle(element).fontSize);

/** THE ARTICLE'S SHAPE (the header): the column, the rhythm box with the band
 *  strings — imported, never spelled — and the measure's stand-in. */
const renderArticle = () => {
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
          <PostPhoto heading={HEADING} image={IMAGE} note={NOTE} />
        </div>
      </div>
    </Container>,
  );
  const figure = screen.getByRole('figure');
  const [caption, box, note] = [...figure.children].map((child, index) =>
    htmlElement(child, ['caption', 'picture box', 'note'][index]),
  );
  const measure = htmlElement(figure.parentElement, 'measure');
  const rhythm = htmlElement(measure.parentElement, 'rhythm box');
  const column = htmlElement(rhythm.parentElement, 'ui/Container column');
  return { figure, caption, box, note, measure, rhythm, column, unmount };
};

type Article = ReturnType<typeof renderArticle>;

/** IS THE THEME REMAPPED on this box? The scale redefines `--spacing` on the
 *  box that wears it; elsewhere a box inherits the root's (BeforeAfter's and
 *  PriceList.scale's `remapped`). */
const remapped = (element: Element): boolean =>
  getComputedStyle(element).getPropertyValue('--spacing').trim() !==
  getComputedStyle(document.documentElement)
    .getPropertyValue('--spacing')
    .trim();

/** The classic scrollbar's width, read off the BODY: 15 on a Mac with a mouse
 *  attached, 0 with overlay scrollbars. */
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
 * has none — read off the string itself, never re-spelled.
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

/**
 * THE PHOTO AT THE UNIT `s` (1 outside THE BAND SCALE) in a measure `width`
 * px wide: the photo spans the measure, its picture box 4:3, the heading at
 * 24 × s and 16 × s over the picture, the note at 16 × s and 16 × s under it.
 */
const expectPhoto = (article: Article, width: number, s: number): void => {
  const { figure, caption, box, note } = article;
  expect(rect(figure).width, 'the photo spans the measure').toBeCloseTo(
    width,
    1,
  );
  expect(rect(box).width, 'the picture spans the photo').toBeCloseTo(width, 1);
  expect(rect(box).height, '4:3').toBeCloseTo(width * 0.75, 1);
  expect(fontSize(caption), 'the heading’s step').toBeCloseTo(
    HEADING_FONT * s,
    2,
  );
  expect(fontSize(note), 'the note’s step').toBeCloseTo(NOTE_FONT * s, 2);
  expect(rect(box).top - rect(caption).bottom, 'heading → picture').toBeCloseTo(
    GAP * s,
    1,
  );
  expect(rect(note).top - rect(box).bottom, 'picture → note').toBeCloseTo(
    GAP * s,
    1,
  );
};

/** THE POINTER, PARKED before each reading — a resting pointer is :hover
 *  (PostCard.test.tsx's helper, KEEP-IN-SYNC; PostPhoto.test.tsx parks the
 *  same way). A REAL pointer: a synthetic event cannot move :hover. */
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

describe('PostPhoto — THE `sizes`, derived from where every number lives', () => {
  /** The one `const NAME = '…'` string of a source, or a failure naming it. */
  const constant = (code: string, name: string): string => {
    const value = new RegExp(`\\bconst ${name} =\\s*'([^']*)'`).exec(code)?.[1];
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
  const pointer = /@custom-variant scalable \{[\s\S]*?@media (\([^)]*\))/.exec(
    globalsSource,
  )?.[1];

  it('reads its inputs (never vacuous): a 42rem measure, REFERENCE 1106, the 56rem step floored at 896px, a 96rem cap, gutters of 5vw and 10vw with the ramp between, a fine pointer', () => {
    expect(
      parseFloat(getComputedStyle(document.documentElement).fontSize),
      'the root font size',
    ).toBe(ROOT);
    expect(measureStep, 'PostPage’s MEASURE names a container step').toBe(
      '2xl',
    );
    expect(themeRem(`--container-${measureStep}`)).toBe(42);
    expect(gate, 'ui/Container’s gate').not.toBeNull();
    expect(themeRem(`--container-${gate?.[1]}`)).toBe(56);
    expect(Number(gate?.[2])).toBe(896);
    expect(Number(cap)).toBe(96);
    expect(Number(reference)).toBe(REFERENCE);
    expect(gutterShares, 'ui/Container’s gutter').not.toBeNull();
    expect(gutterShares?.slice(1).map(Number)).toEqual([5, 30, 7.5, 10]);
    expect(pointer).toBe('(pointer: fine)');
  });

  it('is exactly the string those numbers give — ceil(100 × 672 × 0.8 / 1106) vw from 56 / 0.8 rem on a fine pointer, the 42rem measure from 42 / 0.8 rem, the column from the ramp’s end, a phone’s column below it', () => {
    const measureRem = themeRem(`--container-${measureStep}`);
    const stepRem = themeRem(`--container-${gate?.[1]}`);
    const [phoneVw, rampVw, rampRem, tabletVw] =
      gutterShares?.slice(1).map(Number) ?? [];
    // The column's share of the window from the ramp's end up: 1 − 2 × T vw.
    const column = 1 - (2 * tabletVw) / 100;
    // The window, in rem, from which the gutter is T vw: R vw − K rem = T vw.
    const rampEnd = (100 * rampRem) / (rampVw - tabletVw);
    // THE BAND SCALE: the measure in design pixels — its rem × 16, the theme's
    // own multiplier (globals.css's THE DESIGN SCALE) — over the reference
    // column, which is 0.8 of the window.
    const scaled = Math.ceil(
      (100 * measureRem * 16 * column) / Number(reference),
    );

    expect(scaled).toBe(49);
    expect(stepRem / column).toBe(70);
    expect(measureRem / column).toBe(52.5);
    expect(rampEnd).toBe(37.5);
    // The 0.8 share holds only from the ramp's end up, and the two answers
    // that lean on it ask from 70rem and 52.5rem — past it, both.
    expect(stepRem / column).toBeGreaterThanOrEqual(rampEnd);
    expect(measureRem / column).toBeGreaterThanOrEqual(rampEnd);
    expect(POST_PHOTO_SIZES).toBe(
      `(min-width: ${stepRem / column}rem) and ${pointer} ${scaled}vw, ` +
        `(min-width: ${measureRem / column}rem) ${measureRem}rem, ` +
        `(min-width: ${rampEnd}rem) ${100 * column}vw, ` +
        `${100 - 2 * phoneVw}vw`,
    );
  });
});

describe('PostPhoto — in the article, window by window (the real stylesheet)', () => {
  parkBeforeEach();

  // Every case below sets its own window; the runner's default comes back
  // after the file.
  afterAll(async () => {
    await page.viewport(414, 896);
  });

  beforeAll(() => {
    // THE PREMISE: the 16px root every number above is written at, and a place
    // where THE BAND SCALE can apply — a fine primary pointer and an engine
    // that registers custom properties, globals.css's THE SCALABLE VARIANT —
    // so the cases that expect the scale cannot pass for the wrong reason.
    expect(
      parseFloat(getComputedStyle(document.documentElement).fontSize),
      'the root font size',
    ).toBe(ROOT);
    expect(
      window.matchMedia('(pointer: fine)').matches,
      'the runner’s primary pointer is fine — a mouse, as on a laptop',
    ).toBe(true);
    expect(
      CSS.supports('color', 'rgb(from red r g b)'),
      'the engine reads relative colour syntax — the scale’s @supports gate',
    ).toBe(true);
  });

  describe('outside THE BAND SCALE — the photo spans min(column, 42rem) at the theme’s sizes', () => {
    it.each([320, 390, 440, 600, 744, 768, 900, 1024, 1100])(
      'at a %ipx window',
      async (width) => {
        await page.viewport(width, HEIGHT);
        const article = renderArticle();
        const column = width - scrollbar() - 2 * gutter();
        expect(rect(article.column).width, 'the column').toBeCloseTo(column, 1);
        expect(remapped(article.rhythm), 'no scale under its step').toBe(false);
        expectPhoto(article, Math.min(column, MEASURE), 1);
        // Nothing sideways — measured by the root's own BOX, which ends where
        // a reserved scrollbar gutter begins; never by its `clientWidth`,
        // which in this runner's frame is the whole window, the 15px gutter
        // included, and would let 15px of overflow through
        // (PostList.stories.tsx's expectNoSidewaysScroll).
        const root = document.documentElement;
        expect(root.scrollWidth).toBeLessThanOrEqual(
          Math.ceil(root.getBoundingClientRect().width),
        );
      },
    );
  });

  describe('THE BAND SCALE — inherited from the article’s rhythm box, never worn', () => {
    it.each([1140, 1280, 1401, 1536, 1920, 2560])(
      'at a %ipx window: the photo 672 × s, the heading 24 × s, the note 16 × s, the gaps 16 × s',
      async (width) => {
        await page.viewport(width, HEIGHT);
        const article = renderArticle();
        const column = rect(article.column).width;
        const s = unitAt(column);
        expect(column, 'a column past the step').toBeGreaterThanOrEqual(STEP);
        expect(remapped(article.rhythm), 'the rhythm box remaps').toBe(true);
        // The section wears no scale of its own: nothing below the rhythm box
        // re-declares the pixel.
        expect(
          getComputedStyle(article.figure).getPropertyValue('--spacing').trim(),
        ).toBe(
          getComputedStyle(article.rhythm).getPropertyValue('--spacing').trim(),
        );
        expectPhoto(article, MEASURE * s, s);
      },
    );

    it('is NOT in the scale a pixel of column under its step — the theme’s 672px photo — and draws it 672 × s past it (the recorded jump)', async () => {
      await page.viewport(1280, HEIGHT);
      const stepWindow = windowFor(STEP);

      await page.viewport(stepWindow - 1, HEIGHT);
      const under = renderArticle();
      expect(rect(under.column).width).toBeLessThan(STEP);
      expect(remapped(under.rhythm)).toBe(false);
      expectPhoto(under, MEASURE, 1);
      under.unmount();

      await page.viewport(stepWindow, HEIGHT);
      const at = renderArticle();
      const column = rect(at.column).width;
      expect(column).toBeGreaterThanOrEqual(STEP);
      expect(column).toBeLessThan(STEP + 1);
      expect(remapped(at.rhythm)).toBe(true);
      expectPhoto(at, MEASURE * (column / REFERENCE), column / REFERENCE);
    });
  });

  describe('THE `sizes` CLAIMS — the answer against the box, window by window', () => {
    /** Windows across every regime and every edge the header names: the
     *  phones, the gutter's ramp (480 / 600), the measure's cap (840 / 859),
     *  the scale's 70rem answer and its step (1120 / 1139), the 1920 cap, and
     *  past it. */
    const WINDOWS = [
      320, 360, 390, 430, 480, 540, 599, 600, 700, 744, 768, 800, 839, 840, 858,
      859, 1024, 1119, 1120, 1138, 1139, 1140, 1280, 1401, 1536, 1919, 1920,
      2200, 2560,
    ];

    it('never answers less than the picture’s box but where the header’s bound (2) says, and over-asks by more than 1.35× nowhere', async () => {
      await page.viewport(1280, HEIGHT);
      const stepWindow = windowFor(STEP);
      for (const width of WINDOWS) {
        await page.viewport(width, HEIGHT);
        const article = renderArticle();
        const picture = rect(article.box).width;
        const answer = answerOf(POST_PHOTO_SIZES);
        const ratio = answer / picture;
        const at = `at ${width}px — picture ${picture.toFixed(2)} · answer ${answer.toFixed(2)}`;
        if (width >= 70 * ROOT && width < stepWindow) {
          // BOUND (2): a classic scrollbar holds the scale's step past the
          // 70rem answer, so a mouse there is told 49vw of the theme's 672px
          // photo — never more than 19 % under (empty without a bar).
          expect(remapped(article.rhythm), at).toBe(false);
          expect(ratio, at).toBeGreaterThanOrEqual(0.81);
        } else {
          expect(answer, at).toBeGreaterThanOrEqual(picture - 0.05);
        }
        // BOUND (1) is the largest over-ask: 1254 / 933 at 2560.
        expect(ratio, at).toBeLessThanOrEqual(1.35);
        article.unmount();
      }
    }, 60_000);
  });
});
