import { cleanup, render, screen, within } from '@testing-library/react';
import { createTranslator } from 'next-intl';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline — the
// reason this file exists apart from BlogCarousel.test.tsx, which pins the
// band's class tokens with no stylesheet loaded (one premise per file: the
// PostList and DoctorIntro suites' split).
import '@/styles/globals.css';
import {
  blogCarouselWordsFrom,
  populateBlogCarousel,
} from '@/app/[locale]/(home)/populate';
import {
  ARRANGEMENTS,
  SLOTS,
  drawnEdges,
} from '@/components/sections/CardCarousel/conveyor';
import carouselSource from '@/components/sections/CardCarousel/CardCarousel.tsx?raw';
import { DoctorStats } from '@/components/sections/DoctorStats/DoctorStats';
import { PostCard } from '@/components/sections/PostCard/PostCard';
import { PostList } from '@/components/sections/PostList/PostList';
import postListSource from '@/components/sections/PostList/PostList.tsx?raw';
import cardSource from '@/components/ui/Card/Card.tsx?raw';
import {
  bandScaleClasses,
  containerClasses,
} from '@/components/ui/Container/Container';
import type { Locale } from '@/i18n/locales';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import { BlogCarousel, type BlogCarouselProps } from './BlogCarousel';
import source from './BlogCarousel.tsx?raw';

// sections/BlogCarousel — THE BAND, COMPUTED AND MEASURED (BlogCarousel.tsx's
// THE WIDTH, THE MINIATURE, THE FIXED SHAPE, THE FLOOR, THE SIDES and THE
// `sizes`, DERIVED; the owner, 2026-10-17: "make it the width of the: ÎN
// CIFRE … section … i wnat the article cards to mentain same ratios as in
// blog, but while having 65% of the height … make them a fixed height so that
// they mentaiin same shape" — "Miniature (all 65%)").
//
// ── A MODEL OF THE CARD, built from the numbers the engine uses, each READ
// WHERE IT LIVES — the carousel's window from its conveyor, the list's card
// from ui/Container's REFERENCE and two tokens of sections/PostList's GRID
// (its base gap and its widest row's count: all a token reading sees), the
// share and the floor from the band's own source, the frame from ui/Card's
// framed row, ui/Container's gutter and THE BAND SCALE from their two strings
// — so the model fails when one of them moves. The list's card is MEASURED
// too: sections/PostList itself, rendered at the owner's window, its card
// held to the band's in design pixels, which catches what no token reading
// can — a gap or a count only the three-across row would wear (THE FIXED
// SHAPE's KEEP-IN-SYNC). Then PINNED TO THE ENGINE, the band
// rendered beside the clinic's numbers band exactly as Home renders it
// (sections/DoctorStats, `scaled`, the page ground, the opener at the start):
// on a FINE pointer at fifteen windows (this runner's, beside its classic
// scrollbar), on a TOUCH screen at six (THE TOUCH SCREEN, below), and at a
// 20px root at six — the column, the card, its picture, the room, the fade
// (never past the centre card's edge), the arrows' strips and chevrons held
// to the model's, to a thirty-second of a pixel, the centre card fully opaque
// and the arrows beside it wherever the column leaves their 24px floor; the carousel, its stage
// and its arrows held to the numbers band's column, to a hundredth. Then
// SWEPT: the hint the band ships, read off its pictures, against the model's
// picture at every window from 280 to 3840px — both pointers, a classic
// scrollbar and none, a 16px root and a 20px one.
//
// ── THE TOUCH SCREEN, WITHOUT TOUCHING THE TAB'S DEVICES. The browser
// projects share one Chromium tab, and switching its touch emulation on and
// off leaves a later file without a fine pointer or hover on CI's Linux
// (tests/unit/no-touch-emulation.test.ts, PR #166). So a touch screen is
// drawn through the CSSOM: every rule the stylesheet holds behind `(pointer:
// fine)` — THE BAND SCALE's three among them — switched off for the length of
// a case (its `media.mediaText` set to `not all`), and the classic scrollbar
// hidden (a touch screen's overlays the page); both restored after, and the
// restoration asserted. THE GATES case reads the same rules statically: the
// box round the carousel declares its pixel behind `@supports`, `(pointer:
// fine)` and both container steps, so a real touch screen never meets it.
//
// ── THE CARD'S HEIGHT, AND THE LANGUAGES: a card's height is its words', so
// the real typefaces are loaded (`font-display: block`, the PostList.scale
// declarations) and every language is measured under its own <html lang>,
// which `hyphens: auto` reads. Every transition is off, so nothing is read
// mid-move, and the carousel's first move — 1.5 s after it mounts — is far
// behind every reading here.

/** The root font size this runner draws at — the premise of every rem
 *  below (asserted in `beforeAll`). */
const ROOT = 16;

// ── THE NUMBERS, READ WHERE THEY LIVE ─────────────────────────────────────

/** A number a pattern captures from a source, or a failure naming what went
 *  missing. */
const read = (text: string, pattern: RegExp, name: string): number => {
  const found = pattern.exec(text)?.[1];
  if (found === undefined) throw new Error(`BlogCarousel: no ${name} found`);
  return Number(found);
};

/** sections/CardCarousel's five-card window (its conveyor): the stage's
 *  width and its fade's, in card widths. */
const R5 = ARRANGEMENTS[5].ratio;
const F5 = ARRANGEMENTS[5].fade;

/** The window's OUTERMOST pair — the next pair, two places from the centre
 *  (its conveyor's THE SLOTS): where it stands and how far its drawn outer
 *  edge reaches from the stage's centre, in card widths. */
const NEXT_PAIR = SLOTS[2];
const NEXT_PAIR_OUTER = drawnEdges(
  NEXT_PAIR.position,
  NEXT_PAIR.scale,
  NEXT_PAIR.turn,
).outer;

/** sections/CardCarousel's fixed card's ARROWS, out of its source (its
 *  FIXED_BAR and CHEVRON): a strip of nine theme steps where the column
 *  leaves that much beside the centre card, narrower where it leaves less,
 *  never under 24px; the chevron six steps wide, never wider than its strip
 *  less one step. */
const FIXED_BAR =
  /const FIXED_BAR =\s*'([^']*)'/.exec(carouselSource)?.[1] ?? '';
const BAR_STEPS = read(
  FIXED_BAR,
  /min\(calc\(var\(--spacing\)\*([\d.]+)\)/,
  'strip steps',
);
const BAR_MIN = read(FIXED_BAR, /max\((\d+)px,/, 'strip minimum');
const CHEVRON_STEPS = read(
  carouselSource,
  /w-\[min\(calc\(var\(--spacing\)\*(\d+)\),calc\(var\(--bar\)_-_var\(--spacing\)\)\)\]/,
  'chevron steps',
);

/** ui/Container's gutter, out of its one spelling: a floor in rem, 5vw, a
 *  ramp of 30vw less 7.5rem, 10vw, a cap in rem. */
const GUTTER =
  /clamp\(([\d.]+)rem,clamp\(([\d.]+)vw,([\d.]+)vw_-_([\d.]+)rem,([\d.]+)vw\),([\d.]+)rem\)/.exec(
    containerClasses,
  );
if (GUTTER === null) throw new Error('BlogCarousel: no gutter found');
const [, FLOOR_REM, LOW_VW, RAMP_VW, RAMP_REM, HIGH_VW, CAP_REM] =
  GUTTER.map(Number);

/** THE BAND SCALE's numbers, out of its one spelling: the floor of its step
 *  in px, its cap in rem and its REFERENCE column — its step's name, `@4xl`,
 *  is Tailwind's 56rem container (tests/unit/design-scale.test.ts). */
const STEP_FLOOR = read(bandScaleClasses, /@min-\[(\d+)px\]/, 'step floor');
const SCALE_CAP_REM = read(
  bandScaleClasses,
  /min\(100cqw,([\d.]+)rem\)/,
  'scale cap',
);
const REFERENCE = read(
  bandScaleClasses,
  /min\(100cqw,[\d.]+rem\)\/(\d+)/,
  'reference',
);
const STEP_REM = 56;

/** sections/PostList's GRID: its gap in spacing steps and its widest row's
 *  count of cards — the list's three-across card the band's slot is a share
 *  of (THE FIXED SHAPE). */
const LIST_GRID = /const GRID =\s*'([^']*)'/.exec(postListSource)?.[1] ?? '';
const LIST_GAP_STEPS = read(LIST_GRID, /(?:^|\s)gap-(\d+)(?:\s|$)/, 'grid gap');
const LIST_COLUMNS = read(LIST_GRID, /@4xl:grid-cols-(\d+)/, 'widest row');

/** The band's own numbers, out of its source: the share, the list's card it
 *  spelled, and THE FLOOR in rem. */
const SHARE = read(source, /^const MINIATURE = ([\d.]+);$/m, 'share');
const BAND_COLUMN = read(source, /^const LIST_COLUMN = (\d+);$/m, 'column');
const BAND_GAP = read(source, /^const LIST_GAP = (\d+);$/m, 'gap');
const BAND_COLUMNS = read(source, /^const LIST_COLUMNS = (\d+);$/m, 'columns');
const BAND_FLOOR_REM = read(
  source,
  // Assembled from parts: Tailwind reads tests too, and the census refuses
  // any spelling of the floor's class but the class itself (THE D-LIT RULE).
  new RegExp(String.raw`\[` + '--band-floor' + String.raw`:([\d.]+)rem\]`),
  'carousel floor',
);

/** ui/Card's framed border, in CSS px — a frame the miniature never scales
 *  (PostCard's THE MINIATURE): the picture is the card less two of them. */
const FRAME = read(
  /framed:\s*'([^']*)'/.exec(cardSource)?.[1] ?? '',
  /border-\[(\d+)px\]/,
  'frame',
);

/** THE CARD in design pixels: the list's three-across card at the owner's
 *  window — the REFERENCE column less its gaps (each a spacing step, four
 *  design pixels), a third — at the share. */
const CARD_DESIGN =
  ((REFERENCE - (LIST_COLUMNS - 1) * LIST_GAP_STEPS * 4) / LIST_COLUMNS) *
  SHARE;

// ── THE MODEL ──────────────────────────────────────────────────────────────

type Pointer = 'fine' | 'coarse';

/** ui/Container's gutter a side at a `w` px window and a `root` px root
 *  (`vw` counts a classic scrollbar). */
const gutter = (w: number, root: number): number =>
  Math.max(
    FLOOR_REM * root,
    Math.min(
      Math.max(
        (LOW_VW / 100) * w,
        Math.min((RAMP_VW / 100) * w - RAMP_REM * root, (HIGH_VW / 100) * w),
      ),
      CAP_REM * root,
    ),
  );

/** Everything the model says about one window. */
type Modelled = Readonly<{
  /** ui/Container's column. */
  column: number;
  /** The carousel: the column, capped at 96rem where the scale may apply. */
  carousel: number;
  /** THE BAND SCALE applies (the opener's pixel is then the column's). */
  scaled: boolean;
  /** The opener's pixel — the rhythm box's, never floored. */
  bandPixel: number;
  /** The carousel's pixel — floored (THE FLOOR). */
  pixel: number;
  /** A card's width. */
  card: number;
  /** The card is the column's, narrower than CARD (a 20px root on a phone). */
  clamped: boolean;
  /** The picture: the card less its two frames. */
  picture: number;
  /** What the column leaves beside the centre card, a side. */
  beside: number;
  /** The room a side, and the fade — never past the centre card's edge. */
  room: number;
  fade: number;
  /** An arrow's strip, and its chevron's width. */
  bar: number;
  chevron: number;
}>;

/**
 * The band at a `w` px window, `sb` px of it a classic scrollbar, a `pointer`
 * and a `root` px root: the column (ui/Container), the regime (THE BAND
 * SCALE: a fine pointer, a column of max(56rem, 896px)), the carousel's pixel
 * — max(1rem / 16, min(column, 96rem) / 1106) inside the regime, the theme's
 * 1rem / 16 outside it — and the card CARD in it, never wider than the
 * carousel (CardCarousel's THE FIXED CARD), the room the column leaves beside
 * the five-card window, the fade — its outermost card's 40 %, but never past
 * the centre card's edge — and each arrow's strip: nine steps, narrower
 * where the column leaves less beside the card, never under 24px, its chevron
 * six steps and never wider than the strip less one.
 */
function modelAt(
  w: number,
  sb: number,
  pointer: Pointer,
  root = ROOT,
): Modelled {
  const column = w - sb - 2 * gutter(w, root);
  const scaled =
    pointer === 'fine' && column >= Math.max(STEP_REM * root, STEP_FLOOR);
  const carousel =
    pointer === 'fine' ? Math.min(column, SCALE_CAP_REM * root) : column;
  const bandPixel = scaled
    ? Math.min(column, SCALE_CAP_REM * root) / REFERENCE
    : root / 16;
  const pixel = scaled
    ? Math.max(
        BAND_FLOOR_REM * root,
        Math.min(column, SCALE_CAP_REM * root) / REFERENCE,
      )
    : root / 16;
  const full = CARD_DESIGN * pixel;
  const card = Math.min(full, carousel);
  const beside = (carousel - card) / 2;
  const room = Math.max(0, (carousel - R5 * card) / 2);
  const step = 4 * pixel;
  const bar = Math.min(BAR_STEPS * step, Math.max(BAR_MIN, beside));
  return {
    column,
    carousel,
    scaled,
    bandPixel,
    pixel,
    card,
    clamped: carousel < full,
    picture: card - 2 * FRAME,
    beside,
    room,
    fade: Math.min(F5 * card, Math.max(0, beside - room)),
    bar,
    chevron: Math.min(CHEVRON_STEPS * step, bar - step),
  };
}

/** The slot a `sizes` list gives at a `w` px window — its first entry whose
 *  conditions hold, the way a browser reads it (PostGallery.test.tsx's
 *  reader, with the touch screen's condition and a `root` px rem). */
function slotAt(
  sizes: string,
  w: number,
  pointer: Pointer,
  root = ROOT,
): number {
  for (const entry of sizes.split(',').map((part) => part.trim())) {
    const conditions = [...entry.matchAll(/\(([^)]+)\)/g)].map(
      (match) => match[1] ?? '',
    );
    const length = entry
      .replace(/\([^)]*\)/g, '')
      .replace(/\band\b/g, '')
      .trim();
    const holds = conditions.every((condition) => {
      const minWidth = /^min-width:\s*([\d.]+)rem$/.exec(condition);
      if (minWidth) return w >= Number(minWidth[1]) * root;
      const kind = /^pointer:\s*(fine|coarse)$/.exec(condition);
      if (kind) return pointer === kind[1];
      throw new Error(`an unknown media condition: ${condition}`);
    });
    if (!holds) continue;
    const vw = /^(\d+)vw$/.exec(length);
    if (vw) return (Number(vw[1]) / 100) * w;
    const rem = /^([\d.]+)rem$/.exec(length);
    if (rem) return Number(rem[1]) * root;
    throw new Error(`an unknown length: ${length}`);
  }
  throw new Error(`no entry of „${sizes}" holds at ${w}px`);
}

// ── THE BANDS, AS HOME HANDS THEM OVER ──────────────────────────────────────

/** The Home page's words and cards in `locale` — the band's props from Home's
 *  own populator, app/[locale]/(home)/populate.ts' `populateBlogCarousel`,
 *  its words through `blogCarouselWordsFrom`, the ONE mapping the page and
 *  the Home story twin call too, here fed next-intl's `createTranslator` over
 *  the message files (BlogCarousel.stories.tsx's `propsFor`, the same call):
 *  the very props Home hands the band, never a copy of the mapping. */
function propsFor(locale: Locale, messages: typeof ro): BlogCarouselProps {
  return populateBlogCarousel(
    locale,
    blogCarouselWordsFrom(
      createTranslator({ locale, messages, namespace: 'home' }),
      createTranslator({ locale, messages, namespace: 'blog' }),
      createTranslator({ locale, messages, namespace: 'common' }),
    ),
  );
}

/** The five languages, each with its own words. */
const LANGUAGES = [
  ['ro', ro],
  ['en', en],
  ['de', de],
  ['fr', fr],
  ['it', it_],
] as const satisfies readonly (readonly [Locale, typeof ro])[];

/** THE NUMBERS BAND as Home mounts it (app/[locale]/(home)/page.tsx: scaled,
 *  the page ground, the opener at the start) — its column the one the
 *  carousel must match. Fixture tiles: the column does not read them. */
const STATS = (
  <DoctorStats
    scaled
    ground="page"
    align="start"
    eyebrow="În cifre"
    title="Experiență confirmată în timp"
    atLeast="peste"
    tiles={[
      {
        id: 'ani',
        icon: <span />,
        value: 16,
        suffix: '+',
        label: 'Ani de experiență',
        description: 'O propoziție.',
      },
      {
        id: 'pacienti',
        icon: <span />,
        value: 8000,
        suffix: '+',
        label: 'Pacienți',
        description: 'O propoziție.',
      },
      {
        id: 'proceduri',
        icon: <span />,
        value: 11000,
        suffix: '+',
        label: 'Proceduri',
        description: 'O propoziție.',
      },
    ]}
    format={new Intl.NumberFormat('ro').format}
  />
);

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
*, *::before, *::after { transition: none !important; animation: none !important; }
`;

/** SC 1.4.12's four overrides, the W3C bookmarklet's: line height 1.5,
 *  letter spacing 0.12em, word spacing 0.16em, paragraph spacing 2em. */
const TEXT_SPACING_CSS = `
* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
p { margin-bottom: 2em !important; }
`;

let injected: HTMLStyleElement | null = null;
let window0 = { width: 0, height: 0 };
let lang0: string | null = null;

beforeAll(async () => {
  window0 = { width: window.innerWidth, height: window.innerHeight };
  lang0 = document.documentElement.getAttribute('lang');
  expect(
    parseFloat(getComputedStyle(document.documentElement).fontSize),
    'the runner’s root font size',
  ).toBe(ROOT);
  injected = document.createElement('style');
  injected.textContent = INJECTED_CSS;
  document.head.append(injected);
  await document.fonts.load(`1rem "${SERIF}"`);
  await document.fonts.load(`1rem "${MONO}"`);
  await document.fonts.ready;
});

afterEach(() => {
  cleanup();
  if (lang0 === null) document.documentElement.removeAttribute('lang');
  else document.documentElement.setAttribute('lang', lang0);
});

afterAll(async () => {
  injected?.remove();
  injected = null;
  await page.viewport(window0.width, window0.height);
});

const box = (element: Element): DOMRect => element.getBoundingClientRect();

const px = (element: Element, property: string): number =>
  parseFloat(getComputedStyle(element).getPropertyValue(property));

/** A box's LAYOUT size — its computed width or height, which ignores the
 *  carousel's transforms (a side card is drawn smaller and turned). */
const layout = (element: Element, side: 'width' | 'height'): number =>
  parseFloat(getComputedStyle(element)[side]);

/** The primary pointer this runner reports — the model's other input. */
const pointerNow = (): string =>
  (['fine', 'coarse', 'none'] as const).find(
    (kind) => window.matchMedia(`(pointer: ${kind})`).matches,
  ) ?? 'unknown';

/** The mask's first two stops: where the stage turns from clear to opaque —
 *  the room a side, then the room and the fade (CardCarousel.geometry's
 *  reader). */
function maskStops(stage: HTMLElement): readonly [number, number] {
  const mask = getComputedStyle(stage).maskImage;
  const found =
    /^linear-gradient\(to right, rgba\(0, 0, 0, 0\) ([-\d.e+]+)px, rgb\(0, 0, 0\) ([-\d.e+]+)px/.exec(
      mask,
    );
  if (found === null) throw new Error(`an unexpected mask: ${mask}`);
  return [Number(found[1]), Number(found[2])];
}

/** Wait one frame. */
const frame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });

/** The two bands at a `w` px window, as Home stacks them, and every box the
 *  measurements read. `lang` is stamped on <html> the way the shell does. */
async function renderAt(
  w: number,
  props: BlogCarouselProps = propsFor('ro', ro),
  lang: Locale = 'ro',
  h = 1000,
) {
  await page.viewport(w, h);
  document.documentElement.setAttribute('lang', lang);
  render(
    <>
      {STATS}
      <BlogCarousel {...props} />
    </>,
  );
  await document.fonts.ready;
  await frame();
  const stats = screen.getByRole('region', {
    name: 'Experiență confirmată în timp',
  });
  const statsRhythm = stats.firstElementChild?.firstElementChild;
  const band = screen.getByRole('region', { name: props.title });
  const column = band.firstElementChild;
  const rhythm = column?.firstElementChild;
  const own = rhythm?.lastElementChild;
  const carousel = within(band).getByRole('region', {
    name: props.labels.region,
  });
  const stage = carousel.querySelector('[aria-live]');
  if (
    !(statsRhythm instanceof HTMLElement) ||
    !(column instanceof HTMLElement) ||
    !(rhythm instanceof HTMLElement) ||
    !(own instanceof HTMLElement) ||
    !(stage instanceof HTMLElement)
  ) {
    throw new Error('BlogCarousel: a box is missing');
  }
  const slides = [...stage.children].filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );
  const centre = slides.find((slide) => !slide.hasAttribute('inert'));
  if (centre === undefined) throw new Error('no centred card');
  // The classic scrollbar this runner draws at this window: the window less
  // the page's own box, which ends where a reserved gutter begins.
  const scrollbar = window.innerWidth - box(document.documentElement).width;
  return {
    stats,
    statsRhythm,
    band,
    column,
    rhythm,
    own,
    carousel,
    stage,
    slides,
    centre,
    scrollbar,
  };
}

type Scene = Awaited<ReturnType<typeof renderAt>>;

/** A box's design pixel: its registered `--scale-px` where THE BAND SCALE
 *  redraws it, the theme's 1rem / 16 where nothing is declared. */
function pixelOf(element: HTMLElement): number {
  const remapped =
    getComputedStyle(element).getPropertyValue('--spacing') !==
    getComputedStyle(document.documentElement).getPropertyValue('--spacing');
  return remapped
    ? px(element, '--scale-px')
    : parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
}

/**
 * Everything the band promises at one window, against the model and against
 * the numbers band beside it:
 *   · THE WIDTH — the carousel, its stage and the arrows' two outer edges on
 *     the numbers band's column (its rhythm box), to a hundredth;
 *   · THE OPENER — the <h2> and the eyebrow the numbers band's size and edge;
 *   · THE FLOOR — the carousel's pixel the model's;
 *   · THE FIXED SHAPE — every card of the ring the model's width and ONE
 *     height, every card filling its box, the picture the card less its frames;
 *   · THE SIDES — the room and the fade the model's, and where there is no
 *     room the window cut at both edges, the centre card whole and centred;
 *   · no sideways scroll.
 */
async function expectBand(
  scene: Scene,
  model: Modelled,
  where: string,
): Promise<void> {
  const {
    statsRhythm,
    band,
    rhythm,
    own,
    carousel,
    stage,
    slides,
    centre,
    stats,
  } = scene;
  // THE WIDTH.
  const column = box(statsRhythm);
  for (const [name, element] of [
    ['the carousel', carousel],
    ['its stage', stage],
  ] as const) {
    const drawn = box(element);
    expect(
      Math.abs(drawn.left - column.left),
      `${where}: ${name}’s left`,
    ).toBeLessThanOrEqual(0.01);
    expect(
      Math.abs(drawn.width - column.width),
      `${where}: ${name}’s width`,
    ).toBeLessThanOrEqual(0.01);
  }
  expect(
    Math.abs(box(carousel).width - model.carousel),
    `${where}: the carousel against the model`,
  ).toBeLessThanOrEqual(1 / 32);
  const [previous, next] = within(carousel).getAllByRole('button').slice(0, 2);
  expect(
    Math.abs(box(previous).left - column.left),
    `${where}: the previous arrow on the column’s edge`,
  ).toBeLessThanOrEqual(0.01);
  expect(
    Math.abs(column.right - box(next).right),
    `${where}: the next arrow on the column’s edge`,
  ).toBeLessThanOrEqual(0.01);

  // THE OPENER — the numbers band's size and left edge.
  const ours = within(band).getByRole('heading', { level: 2 });
  const theirs = within(stats).getByRole('heading', { level: 2 });
  for (const [a, b, name] of [
    [ours, theirs, 'the <h2>'],
    [ours.previousElementSibling, theirs.previousElementSibling, 'the eyebrow'],
  ] as const) {
    if (!(a instanceof HTMLElement) || !(b instanceof HTMLElement)) {
      throw new Error(`${where}: no ${name}`);
    }
    expect(
      Math.abs(px(a, 'font-size') - px(b, 'font-size')),
      `${where}: ${name}’s size`,
    ).toBeLessThanOrEqual(0.01);
    expect(
      Math.abs(box(a).left - box(b).left),
      `${where}: ${name}’s edge`,
    ).toBeLessThanOrEqual(0.01);
  }
  // …and the opener's pixel the band's own — the column's, unfloored, where
  // the scale holds — so the floor never reaches it.
  expect(
    Math.abs(pixelOf(rhythm) - model.bandPixel),
    `${where}: the opener's pixel`,
  ).toBeLessThanOrEqual(1e-4);

  // THE FLOOR — the carousel's own pixel.
  expect(
    Math.abs(pixelOf(own) - model.pixel),
    `${where}: the carousel’s pixel`,
  ).toBeLessThanOrEqual(1e-4);

  // THE FIXED SHAPE.
  const widths = slides.map((slide) => layout(slide, 'width'));
  const heights = slides.map((slide) => layout(slide, 'height'));
  for (const width of widths) {
    expect(
      Math.abs(width - model.card),
      `${where}: a card’s width`,
    ).toBeLessThanOrEqual(1 / 32);
  }
  expect(
    Math.max(...heights) - Math.min(...heights),
    `${where}: one height across the ring`,
  ).toBeLessThanOrEqual(0.01);
  for (const slide of slides) {
    const article = slide.querySelector('article');
    if (article === null) throw new Error(`${where}: a card is missing`);
    expect(
      Math.abs(layout(article, 'height') - layout(slide, 'height')),
      `${where}: a card fills its box`,
    ).toBeLessThanOrEqual(0.01);
  }
  const picture = centre.querySelector('img')?.parentElement;
  if (!(picture instanceof HTMLElement)) throw new Error('no picture');
  expect(
    Math.abs(layout(picture, 'width') - model.picture),
    `${where}: the picture`,
  ).toBeLessThanOrEqual(1 / 32);

  // THE SIDES.
  const [clear, opaque] = maskStops(stage);
  expect(
    Math.abs(clear - model.room),
    `${where}: the room`,
  ).toBeLessThanOrEqual(1 / 32);
  expect(
    Math.abs(opaque - clear - model.fade),
    `${where}: the fade`,
  ).toBeLessThanOrEqual(1 / 32);
  const edges = box(stage);
  const middle = box(centre);
  expect(middle.left, `${where}: the centre card whole`).toBeGreaterThanOrEqual(
    edges.left - 0.01,
  );
  expect(middle.right).toBeLessThanOrEqual(edges.right + 0.01);
  expect(
    Math.abs(middle.left + middle.width / 2 - (edges.left + edges.width / 2)),
  ).toBeLessThanOrEqual(0.5);
  // …and FULLY OPAQUE: the mask is opaque from the room plus the fade on,
  // which never passes the centre card's edge (CardCarousel's THE FIXED CARD).
  expect(
    opaque,
    `${where}: the mask opaque by the centre card's edge`,
  ).toBeLessThanOrEqual(middle.left - edges.left + 1 / 32);
  // THE ARROWS' STRIPS AND CHEVRONS: each strip the model's — nine steps,
  // narrower where the column leaves less beside the card, never under 24px —
  // and each chevron never wider than its strip less a step. BESIDE the card
  // wherever the column leaves 24px; past that floor, over its edge by the
  // floor's want — a 280px window's case (RECORDED in the band's header).
  for (const arrow of [previous, next]) {
    expect(
      Math.abs(box(arrow).width - model.bar),
      `${where}: an arrow's strip`,
    ).toBeLessThanOrEqual(1 / 32);
    const chevron = arrow.firstElementChild;
    if (chevron === null) throw new Error(`${where}: no chevron`);
    expect(
      Math.abs(layout(chevron, 'width') - model.chevron),
      `${where}: a chevron`,
    ).toBeLessThanOrEqual(1 / 32);
  }
  // Each strip's inner edge stands `bar − beside` past the card's edge —
  // a gap where that is negative, an overlap where the floor binds.
  const reach = model.bar - model.beside;
  expect(
    Math.abs(box(previous).right - middle.left - reach),
    `${where}: the previous arrow, ${reach.toFixed(2)}px past the card's edge`,
  ).toBeLessThanOrEqual(1 / 16);
  expect(
    Math.abs(middle.right - box(next).left - reach),
    `${where}: the next arrow likewise`,
  ).toBeLessThanOrEqual(1 / 16);
  if (model.beside >= BAR_MIN) {
    expect(
      box(previous).right,
      `${where}: beside the card`,
    ).toBeLessThanOrEqual(middle.left + 1 / 32);
    expect(box(next).left).toBeGreaterThanOrEqual(middle.right - 1 / 32);
  }
  // The window's outermost pair, read by its pose (the inline `--tx` its
  // conveyor gives it): CUT by the stage's edges — its drawn box past them —
  // exactly where half the column is narrower than its drawn outer edge, so
  // its hidden 60 % is no longer under room; wholly inside the stage where the
  // room holds it.
  const pair = slides.filter(
    (slide) =>
      Math.abs(
        Math.abs(Number(slide.style.getPropertyValue('--tx'))) -
          NEXT_PAIR.position,
      ) < 1e-3,
  );
  expect(pair, `${where}: the outermost pair`).toHaveLength(2);
  const cut = model.carousel / 2 < NEXT_PAIR_OUTER * model.card;
  for (const slide of pair) {
    const drawn = box(slide);
    const outside =
      drawn.left < edges.left - 0.5 || drawn.right > edges.right + 0.5;
    expect(
      outside,
      `${where}: the outermost pair ${cut ? 'cut' : 'whole'}`,
    ).toBe(cut);
  }

  // NO SIDEWAYS SCROLL (§7) — by the root's own box, never `clientWidth`.
  const root = document.documentElement;
  expect(root.scrollWidth, `${where}: no sideways scroll`).toBeLessThanOrEqual(
    Math.ceil(box(root).width),
  );
}

/** A TOUCH SCREEN, drawn through the CSSOM (the header's THE TOUCH SCREEN):
 *  every `(pointer: fine)` rule switched off and the scrollbar hidden while
 *  `run` runs, both restored after — and the restoration asserted. */
async function asOnATouchScreen<T>(run: () => Promise<T>): Promise<T> {
  const switched: { rule: CSSMediaRule; was: string }[] = [];
  const walk = (rules: CSSRuleList): void => {
    for (const rule of Array.from(rules)) {
      if (
        rule instanceof CSSMediaRule &&
        /\(pointer:\s*fine\)/.test(rule.media.mediaText)
      ) {
        switched.push({ rule, was: rule.media.mediaText });
      }
      if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) walk(sheet.cssRules);
  // Never vacuous: THE BAND SCALE's three rules at least.
  expect(switched.length).toBeGreaterThanOrEqual(3);
  const root = document.documentElement;
  try {
    for (const { rule } of switched) rule.media.mediaText = 'not all';
    root.style.scrollbarWidth = 'none';
    return await run();
  } finally {
    for (const { rule, was } of switched) rule.media.mediaText = was;
    root.style.scrollbarWidth = '';
    expect(
      switched.every(({ rule, was }) => rule.media.mediaText === was),
      'every rule restored',
    ).toBe(true);
  }
}

describe('BlogCarousel — THE MODEL, read where it lives', () => {
  it('rests on the numbers the engine uses: the band’s list card IS sections/PostList’s three-across card at ui/Container’s REFERENCE, its floor the price list’s', () => {
    // THE FIXED SHAPE's KEEP-IN-SYNC: the band's three spelled numbers are
    // the band scale's REFERENCE and the list's GRID.
    expect(BAND_COLUMN).toBe(REFERENCE);
    expect(BAND_GAP).toBe(LIST_GAP_STEPS * 4);
    expect(BAND_COLUMNS).toBe(LIST_COLUMNS);
    expect([REFERENCE, LIST_GAP_STEPS, LIST_COLUMNS, SHARE]).toEqual([
      1106, 8, 3, 0.65,
    ]);
    expect(CARD_DESIGN).toBeCloseTo(225.7667, 4);
    expect(BAND_FLOOR_REM).toBe(1 / 16);
    expect(FRAME).toBe(3);
    expect([FLOOR_REM, LOW_VW, RAMP_VW, RAMP_REM, HIGH_VW, CAP_REM]).toEqual([
      1, 5, 30, 7.5, 10, 12.5,
    ]);
    expect([STEP_FLOOR, SCALE_CAP_REM]).toEqual([896, 96]);
    expect(bandScaleClasses).toContain(`@4xl:@min-[${STEP_FLOOR}px]:`);
    expect(R5).toBeCloseTo(3.299523, 5);
    expect(F5).toBeCloseTo(0.2397, 4);
    // The fixed card's arrows: a nine-step strip never under 24px, a
    // six-step chevron.
    expect([BAR_STEPS, BAR_MIN, CHEVRON_STEPS]).toEqual([9, 24, 6]);
  });

  it('MEASURES sections/PostList’s own card at the owner’s 1401 window — three across, each the band’s list card, 347.33 design pixels — so a gap or a count only the three-across row would wear, which the token reading above never sees, fails HERE (THE FIXED SHAPE’s KEEP-IN-SYNC)', async () => {
    await page.viewport(1401, 1000);
    document.documentElement.setAttribute('lang', 'ro');
    // The list as the blog prints it: the band's twelve cards — the list's
    // own, the two populators sharing one `postCard` — under the blog's own
    // hero, every word the message file's; one page, so sections/Pagination
    // draws nothing.
    const blog = createTranslator({
      locale: 'ro',
      messages: ro,
      namespace: 'blog',
    });
    const band = propsFor('ro', ro);
    const { container } = render(
      <PostList
        title={blog('hero.title')}
        lead={blog('hero.lead')}
        posts={band.posts}
        tagsLabel={band.tagsLabel}
        readMore={band.readMore}
        pagination={{
          label: blog('pagination.label'),
          current: 1,
          total: 1,
          status: blog('pagination.status', { page: 1, total: 1 }),
          previousLabel: blog('pagination.previous'),
          nextLabel: blog('pagination.next'),
        }}
      />,
    );
    await document.fonts.ready;
    await frame();
    // The grid, by what it holds: the list whose items are the cards.
    const grid = [...container.querySelectorAll('ul')].find(
      (list) => list.querySelector(':scope > li > article') !== null,
    );
    if (!(grid instanceof HTMLElement)) throw new Error('no list grid');
    const items = [...grid.children].filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    );
    expect(items.length, 'a second row under the first').toBeGreaterThan(
      BAND_COLUMNS,
    );
    // The premise, named: the list in THE BAND SCALE at this window, its
    // pixel the model's — so its card reads in design pixels.
    const model = modelAt(
      1401,
      window.innerWidth - box(document.documentElement).width,
      'fine',
    );
    expect(model.scaled, 'the owner’s window inside the regime').toBe(true);
    expect(
      Math.abs(pixelOf(grid) - model.bandPixel),
      'the list’s design pixel',
    ).toBeLessThanOrEqual(1e-4);
    // THREE ACROSS: the band's count of cards on the first row, the next
    // card under them.
    const tops = items.map((item) => box(item).top);
    for (const top of tops.slice(1, BAND_COLUMNS)) {
      expect(Math.abs(top - tops[0]), 'one row').toBeLessThanOrEqual(0.01);
    }
    expect(tops[BAND_COLUMNS], 'the next row').toBeGreaterThan(tops[0] + 1);
    // …and every card the band's list card, from its own three numbers.
    const listCard =
      (BAND_COLUMN - (BAND_COLUMNS - 1) * BAND_GAP) / BAND_COLUMNS;
    for (const item of items) {
      const design = layout(item, 'width') / pixelOf(grid);
      expect(
        Math.abs(design - listCard),
        `a list card, ${design} design px against the band's ${listCard}`,
      ).toBeLessThanOrEqual(1 / 32);
    }
  });

  it('puts the box round the carousel behind THE BAND SCALE’s gates in the real stylesheet — `@supports (color: rgb(from red r g b))`, `@media (pointer: fine)` and both container steps — so a touch screen never meets it (THE GATES)', async () => {
    const { own } = await renderAt(1401);
    const tokens = [...own.classList].filter((token) =>
      token.startsWith('scalable:'),
    );
    // The pixel's declaration and the remap — the band scale's string.
    expect(tokens).toHaveLength(2);
    const found = new Map<string, string[][]>(tokens.map((t) => [t, []]));
    const walk = (
      rules: CSSRuleList,
      conditions: string[],
      token: string | null,
    ): void => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule) {
          const mine =
            token ??
            tokens.find(
              (name) => rule.selectorText === `.${CSS.escape(name)}`,
            ) ??
            null;
          if (mine !== null && rule.style.length > 0) {
            found.get(mine)?.push(conditions);
          }
          walk(rule.cssRules, conditions, mine);
        } else if (rule instanceof CSSMediaRule) {
          walk(
            rule.cssRules,
            [...conditions, `media ${rule.media.mediaText}`],
            token,
          );
        } else if (rule instanceof CSSSupportsRule) {
          walk(
            rule.cssRules,
            [...conditions, `supports ${rule.conditionText}`],
            token,
          );
        } else if (rule instanceof CSSContainerRule) {
          walk(
            rule.cssRules,
            [...conditions, `container ${rule.conditionText}`],
            token,
          );
        } else if ('cssRules' in rule) {
          walk((rule as CSSGroupingRule).cssRules, conditions, token);
        } else if (token !== null && 'style' in rule) {
          found.get(token)?.push(conditions);
        }
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      walk(sheet.cssRules, [], null);
    }
    for (const token of tokens) {
      const sets = found.get(token) ?? [];
      expect(sets.length, token).toBeGreaterThan(0);
      for (const conditions of sets) {
        const text = conditions.join(' | ');
        expect(text, token).toMatch(/supports .*rgb\(from red r g b\)/);
        expect(text, token).toMatch(/media \(pointer: fine\)/);
        expect(text, token).toMatch(/container .*56rem/);
        expect(text, token).toMatch(/container .*896px/);
      }
    }
  });
});

describe('BlogCarousel — THE WIDTH, THE FIXED SHAPE, THE FLOOR and THE SIDES, measured beside the numbers band', () => {
  it.each([
    // [window, what it samples]
    [280, 'under every phone: the window cut, the centre card whole'],
    [320, '§7’s narrowest'],
    [390, 'a phone'],
    [600, 'a small tablet'],
    [768, 'a tablet, the window still cut'],
    [1024, 'room beside the window'],
    [1138, 'just under the scale’s step, behind the scrollbar'],
    [1140, 'just past it: the opener scaled, the carousel on its floor'],
    [1280, 'a laptop, on the floor'],
    [1401, 'the owner’s reference window'],
    [1536, 'past the reference: the carousel grows'],
    [1920, 'a desktop'],
    [1940, 'just past the cap'],
    [2560, 'capped and centred'],
    [3000, 'capped and centred'],
  ] as const)(
    'holds the model at a %ipx window on a fine pointer (%s)',
    async (w, what) => {
      const scene = await renderAt(w);
      expect(pointerNow(), 'the runner’s primary pointer').toBe('fine');
      await expectBand(
        scene,
        modelAt(w, scene.scrollbar, 'fine'),
        `${w}px (${what})`,
      );
    },
  );

  it.each([
    [320, '§7’s narrowest phone: the strips the room beside the card'],
    [360, 'a phone: the fade and the strips beside the card'],
    [390, 'a phone'],
    [768, 'a tablet held upright'],
    [1180, 'a tablet held sideways'],
    [2560, 'a touch screen wider than the band scale’s cap'],
  ] as const)(
    'holds the model at a %ipx window on a TOUCH screen (%s) — the theme’s pixel, the opener unscaled',
    async (w, what) => {
      await asOnATouchScreen(async () => {
        const scene = await renderAt(w);
        expect(scene.scrollbar, 'no scrollbar on a touch screen').toBe(0);
        expect(pixelOf(scene.rhythm), 'the opener unscaled').toBe(1);
        await expectBand(
          scene,
          modelAt(w, 0, 'coarse'),
          `${w}px touch (${what})`,
        );
      });
    },
  );

  it.each([
    [1100, 'under the step a 20px root moves to 1120px'],
    [1400, 'just under it'],
    [1440, 'in the regime, on the floor — 1.25px'],
    [1760, 'past the floor'],
    [2400, 'the 96rem cap, 1920px at this root'],
    [2560, 'capped'],
  ] as const)(
    'holds the model at a %ipx window at a 20px root (%s)',
    async (w, what) => {
      const root = document.documentElement;
      root.style.fontSize = '20px';
      try {
        const scene = await renderAt(w);
        const model = modelAt(w, scene.scrollbar, 'fine', 20);
        const picture = scene.centre.querySelector('img')?.parentElement;
        if (!(picture instanceof HTMLElement)) throw new Error('no picture');
        const where = `${w}px at a 20px root (${what})`;
        expect(
          Math.abs(box(scene.carousel).width - model.carousel),
          where,
        ).toBeLessThanOrEqual(1 / 32);
        expect(
          Math.abs(pixelOf(scene.own) - model.pixel),
          where,
        ).toBeLessThanOrEqual(1e-4);
        expect(
          Math.abs(layout(scene.centre, 'width') - model.card),
          where,
        ).toBeLessThanOrEqual(1 / 32);
        expect(
          Math.abs(layout(picture, 'width') - model.picture),
          where,
        ).toBeLessThanOrEqual(1 / 32);
      } finally {
        root.style.fontSize = '';
      }
    },
  );
});

/** The natural height of every card of a ring: each card's `h-full` lifted
 *  for the reading (all at once, so the row — the tallest card's — never
 *  moves), then put back. */
function naturalHeights(slides: readonly HTMLElement[]): number[] {
  const articles = slides.map((slide) => {
    const article = slide.querySelector('article');
    if (article === null) throw new Error('a card is missing');
    return article;
  });
  for (const article of articles) article.style.height = 'auto';
  const heights = articles.map((article) => layout(article, 'height'));
  for (const article of articles) article.style.height = '';
  return heights;
}

/** The blog list's own tallest card — PostCard in its three-across slot at
 *  the owner's window, in this runner's theme pixel. */
async function listTallest(props: BlogCarouselProps): Promise<number> {
  let tallest = 0;
  for (const post of props.posts) {
    const { container, unmount } = render(
      <div style={{ width: `${CARD_DESIGN / SHARE}px` }}>
        <PostCard
          href={post.href}
          title={post.title}
          summary={post.summary}
          author={post.author}
          readingTime={post.readingTime}
          image={post.image}
          tags={post.tags}
          tagsLabel={props.tagsLabel}
          readMore={props.readMore}
        />
      </div>,
    );
    await document.fonts.ready;
    const article = container.querySelector('article');
    if (article === null) throw new Error('no list card');
    tallest = Math.max(tallest, layout(article, 'height'));
    unmount();
  }
  return tallest;
}

describe('BlogCarousel — ONE HEIGHT, in every language', () => {
  it.each(LANGUAGES)(
    '%s at the owner’s window: every card of the ring the TALLEST card’s height — the share of the list’s own tallest card, within a line',
    async (locale, messages) => {
      const props = propsFor(locale, messages);
      const { slides } = await renderAt(1401, props, locale);
      const ring = layout(slides[0], 'height');
      for (const slide of slides) {
        expect(Math.abs(layout(slide, 'height') - ring)).toBeLessThanOrEqual(
          0.01,
        );
      }
      // The row IS the tallest natural card, and the cards were not all one
      // height to begin with — the stretch did the work.
      const natural = naturalHeights(slides);
      expect(Math.abs(Math.max(...natural) - ring)).toBeLessThanOrEqual(0.01);
      expect(Math.min(...natural)).toBeLessThan(ring - 1);
      cleanup();
      // Against the list's own tallest card: the share of it less the frames'
      // px (PostCard's THE MINIATURE: 2 × (1 − share)px), within one line of
      // the miniature's title — the list card's 36px title line at the share
      // — because the optical size gives a miniature a line more at times
      // (PostCard's THE OPTICAL SIZE MOVES A LINE), and CI's Linux may break
      // one line otherwise. MEASURED on this Mac: ro 392.88, en 408.48 (a
      // summary line more), de 439.70, fr 424.09, it 408.48.
      document.documentElement.setAttribute('lang', locale);
      const list = await listTallest(props);
      const share = SHARE * list - 2 * (1 - SHARE);
      expect(
        Math.abs(ring - share),
        `${locale}: the ring ${ring} against the list's ${list}`,
      ).toBeLessThanOrEqual(SHARE * 36);
    },
  );
});

describe('BlogCarousel — SC 1.4.12, the four text-spacing overrides', () => {
  it.each(
    LANGUAGES.flatMap(([locale, messages]) =>
      [390, 1401].map((w) => [locale, w, messages] as const),
    ),
  )(
    '%s at a %ipx window: every card grows with the others, no text leaves its card, the progress dots stay clear of the cards',
    async (locale, w, messages) => {
      const props = propsFor(locale, messages);
      const before = layout(
        (await renderAt(w, props, locale)).slides[0],
        'height',
      );
      cleanup();
      const spacing = document.createElement('style');
      spacing.textContent = TEXT_SPACING_CSS;
      document.head.append(spacing);
      try {
        const { slides, centre, carousel } = await renderAt(w, props, locale);
        const ring = layout(slides[0], 'height');
        expect(ring, 'the cards grew').toBeGreaterThan(before);
        for (const slide of slides) {
          expect(Math.abs(layout(slide, 'height') - ring)).toBeLessThanOrEqual(
            0.01,
          );
          const article = slide.querySelector('article');
          const card = article?.firstElementChild;
          if (
            !(article instanceof HTMLElement) ||
            !(card instanceof HTMLElement)
          ) {
            throw new Error('a card is missing');
          }
          // Nothing spills out of the card's box, down or sideways.
          expect(card.scrollHeight).toBeLessThanOrEqual(card.clientHeight + 1);
          for (const text of article.querySelectorAll<HTMLElement>(
            'h3, p, li, a > span',
          )) {
            expect(
              text.scrollWidth,
              text.textContent ?? '',
            ).toBeLessThanOrEqual(text.clientWidth + 1);
          }
        }
        // The centre card, drawn: every text inside its box.
        const article = centre.querySelector('article');
        if (article === null) throw new Error('no centre card');
        const frame = box(article);
        for (const text of article.querySelectorAll('h3, p, li, a > span')) {
          const drawn = box(text);
          expect(drawn.left, text.textContent ?? '').toBeGreaterThanOrEqual(
            frame.left - 0.5,
          );
          expect(drawn.right).toBeLessThanOrEqual(frame.right + 0.5);
          expect(drawn.top).toBeGreaterThanOrEqual(frame.top - 0.5);
          expect(drawn.bottom).toBeLessThanOrEqual(frame.bottom + 0.5);
        }
        // The dots under every card, never over one.
        const dots = within(carousel).getByRole('group', {
          name: props.labels.picker,
        });
        const lowest = Math.max(...slides.map((slide) => box(slide).bottom));
        expect(box(dots).top).toBeGreaterThanOrEqual(lowest);
        const root = document.documentElement;
        expect(root.scrollWidth).toBeLessThanOrEqual(
          Math.ceil(box(root).width),
        );
      } finally {
        spacing.remove();
      }
    },
  );
});

describe('BlogCarousel — THE LIFT, on this band’s cards', () => {
  /** The centre card grown to the jump's end — PostCard's 105 % — held
   *  inside the box the stage's mask clips at (CardCarousel's THE LIFT). */
  async function expectLiftWhole(
    w: number,
    locale: Locale,
    messages: typeof ro,
  ): Promise<void> {
    const { stage, centre } = await renderAt(
      w,
      propsFor(locale, messages),
      locale,
    );
    const article = centre.querySelector('article');
    if (!(article instanceof HTMLElement)) throw new Error('no article');
    article.style.scale = '1.05';
    try {
      const grown = box(article);
      const edges = box(stage);
      expect(
        grown.top,
        `${locale} at ${w}: the grown card’s top`,
      ).toBeGreaterThanOrEqual(edges.top);
      expect(grown.bottom).toBeLessThanOrEqual(edges.bottom);
    } finally {
      article.style.scale = '';
    }
  }

  it.each([390, 1401, 1920])(
    'paints the hovered centre card whole at a %ipx window, in every language',
    async (w) => {
      for (const [locale, messages] of LANGUAGES) {
        await expectLiftWhole(w, locale, messages);
        cleanup();
      }
    },
  );

  it.each([390, 1401])(
    'paints it whole under SC 1.4.12’s overrides too, at a %ipx window — cards up to 2.63 times as tall as wide',
    async (w) => {
      const spacing = document.createElement('style');
      spacing.textContent = TEXT_SPACING_CSS;
      document.head.append(spacing);
      try {
        for (const [locale, messages] of LANGUAGES) {
          await expectLiftWhole(w, locale, messages);
          cleanup();
        }
      } finally {
        spacing.remove();
      }
    },
  );
});

describe('BlogCarousel — THE TEXT, with the carousel’s pixel', () => {
  it('sets every word of the centre card at one size from a phone to the owner’s window — THE FLOOR — and grows it with the screen past it', async () => {
    const sizes = async (w: number) => {
      const { centre, own } = await renderAt(w);
      const article = centre.querySelector('article');
      const title = article?.querySelector('h3');
      const words = title?.parentElement;
      if (!(words instanceof HTMLElement) || !(title instanceof HTMLElement)) {
        throw new Error('no words');
      }
      const parts = [...words.children] as HTMLElement[];
      const author = parts[1];
      const summary = parts.find(
        (part, index) => index > 1 && part.tagName === 'P',
      );
      const footer = parts.at(-1);
      const reading = footer?.firstElementChild;
      const readMore = footer?.querySelector('a span');
      if (
        !author ||
        !summary ||
        !(reading instanceof HTMLElement) ||
        !(readMore instanceof HTMLElement)
      ) {
        throw new Error('a word is missing');
      }
      const out = {
        pixel: pixelOf(own),
        sizes: [title, author, summary, reading, readMore].map((element) =>
          px(element, 'font-size'),
        ),
      };
      cleanup();
      return out;
    };
    const phone = await sizes(390);
    const owner = await sizes(1401);
    const desktop = await sizes(1920);
    expect(phone.sizes).toEqual(owner.sizes);
    // The miniature's sizes at the theme's pixel (PostCard's THE MINIATURE):
    // the title 19.5px, the author 9.1, the summary and the reading time
    // 10.4, the read-more 11.7.
    expect(owner.sizes.map((size) => Math.round(size * 100) / 100)).toEqual([
      19.5, 9.1, 10.4, 10.4, 11.7,
    ]);
    // Past the reference, every size × the carousel's pixel.
    for (const [index, size] of desktop.sizes.entries()) {
      expect(size / (owner.sizes[index] ?? NaN)).toBeCloseTo(
        desktop.pixel / owner.pixel,
        3,
      );
    }
  });
});

describe('BlogCarousel — THE `sizes`, DERIVED', () => {
  /** The band's picture hint, read off its first picture. */
  const shippedHint = (carousel: HTMLElement): string => {
    const hint = carousel.querySelector('img')?.getAttribute('sizes');
    if (!hint) throw new Error('a card carries no `sizes`');
    return hint;
  };

  it('never hints a picture narrower than the one drawn at any window from 280 to 3840px — both pointers, a classic scrollbar and none, a 16px root and a 20px one — and as tight as whole numbers allow', async () => {
    const { carousel } = await renderAt(1401);
    const hint = shippedHint(carousel);
    expect(hint).toBe(
      '(min-width: 115rem) and (pointer: fine) 19.5rem, (min-width: 87.5rem) and (pointer: fine) 17vw, 14rem',
    );
    const failures: string[] = [];
    const worst = new Map<string, number>();
    for (const pointer of ['fine', 'coarse'] as const) {
      for (const scrollbar of [0, 15]) {
        for (const root of [16, 20]) {
          for (let w = 280; w <= 3840; w += 2) {
            const model = modelAt(w, scrollbar, pointer, root);
            const slot = slotAt(hint, w, pointer, root);
            const key = `${pointer} ${root}px ${model.clamped ? 'clamped' : 'whole'}`;
            worst.set(key, Math.max(worst.get(key) ?? 1, slot / model.picture));
            if (slot < model.picture - 0.01) {
              failures.push(
                `${pointer}, scrollbar ${scrollbar}, root ${root}, ${w}px: picture ${model.picture.toFixed(2)}, hint ${slot.toFixed(2)}`,
              );
            }
          }
        }
      }
    }
    expect(failures).toEqual([]);
    // The bounds, MEASURED, each root on its own (the band's THE `sizes`,
    // DERIVED, quotes them): a whole card on a fine pointer at most 1.084 at a
    // 16px root — 17vw of a 1402px window over its 219.9px picture — and
    // 1.075 at a 20px one — 17vw of a 1750px window over its 276.7px
    // picture; on a touch screen 1.019 and 1.014; a card clamped to a column
    // narrower than it (a 20px root under a ≈ 322px window) 1.279, where
    // 14rem holds while the picture shrinks with the column.
    expect(worst.get('fine 16px whole')).toBeLessThanOrEqual(1.085);
    expect(worst.get('fine 20px whole')).toBeLessThanOrEqual(1.076);
    expect(worst.get('coarse 16px whole')).toBeLessThanOrEqual(1.02);
    expect(worst.get('coarse 20px whole')).toBeLessThanOrEqual(1.015);
    expect(worst.get('fine 20px clamped')).toBeLessThanOrEqual(1.28);
    expect(worst.get('coarse 20px clamped')).toBeLessThanOrEqual(1.28);
    // A 16px root never clamps the card from 280px up.
    for (let w = 280; w <= 3840; w += 2) {
      expect(modelAt(w, 15, 'fine').clamped).toBe(false);
      expect(modelAt(w, 0, 'coarse').clamped).toBe(false);
    }
  });

  it('spells every `vw` after a space, as a whole number — next/image reads the smallest such share as the floor of its candidates', async () => {
    const { carousel } = await renderAt(1401);
    const hint = shippedHint(carousel);
    const shares = [...hint.matchAll(/(.)(\d+(?:\.\d+)?)vw/g)];
    expect(shares.length).toBeGreaterThan(0);
    for (const [, before, share] of shares) {
      expect(before).toBe(' ');
      expect(share).toMatch(/^\d+$/);
    }
    // Every picture of the ring carries the one hint.
    const hints = [...carousel.querySelectorAll('img')].map((img) =>
      img.getAttribute('sizes'),
    );
    expect(new Set(hints)).toEqual(new Set([hint]));
  });
});
