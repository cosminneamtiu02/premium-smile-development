import type { CSSProperties } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { createTranslator } from 'next-intl';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
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
import { CARD_CAROUSEL_FLAT_QUERY } from '@/components/sections/CardCarousel/CardCarousel';
import {
  ARRANGEMENTS,
  SLOTS,
  drawnEdges,
  flatReach,
} from '@/components/sections/CardCarousel/conveyor';
import carouselSource from '@/components/sections/CardCarousel/CardCarousel.tsx?raw';
import { DoctorStats } from '@/components/sections/DoctorStats/DoctorStats';
import statsSource from '@/components/sections/DoctorStats/DoctorStats.tsx?raw';
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
// THE WIDTH, THE MINIATURE, THE FIXED SHAPE, THE CAROUSEL'S OWN PIXEL, THE
// SIDES, THE FLAT ROW, THE CLAMP IN THE ROW and THE `sizes`, DERIVED; the owner, 2026-10-17:
// "make it the width of the: ÎN CIFRE … section … i wnat the article cards to
// mentain same ratios as in blog, but while having 65% of the height … make
// them a fixed height so that they mentaiin same shape" — "Miniature (all
// 65%)"; and 2026-10-25: "On phone it looks perfect, it must reamin like
// that, but on tablet and above, i do not want it to be circular anymore …
// the normal text on card … must also always mentain text wise the size of
// "Peste 8000 de zâmbete îngrijite cu dedicare și profesionalism." … I also
// want this section to be as wide as the screen like the carrousell for
// reviews" — and, that evening: "try by cutting like 24% of the text and if
// the text is loger, place three dots", "Card 24% shorter, same text size").
//
// ── TWO PRESENTATIONS, ONE MODEL. Under the flat row's query (sections/
// CardCarousel's CARD_CAROUSEL_FLAT_QUERY: a window at least 37.5rem wide
// and either 32rem tall or driven by a fine pointer — two media queries in
// one list, the width clause in each) the band draws THE FLAT ROW — the
// carousel bled to the screen, its pixel the tile sentence's (THE TEXT RULE);
// everywhere else THE LINE, exactly as before 2026-10-25. So the line is
// measured where it still stands — every phone on either pointer, and on a
// TOUCH screen every window under 32rem of height, a phone held sideways
// among them — and the row at the windows a tablet, a laptop and a desktop
// give it, on a fine pointer at ANY height since 2026-10-26 (the query's
// pointer clause, the lane's a11y review: a laptop window a zoom made short
// keeps the row). The line's old growth past the owner's window (the band
// scale's regime) is gone with it: on a fine pointer the line stands only under
// 37.5rem, a column under the band scale's step, and a touch screen never
// meets the band scale — so the line's pixel is the theme's wherever it is
// drawn, and the model says so.
//
// ── A MODEL OF THE CARD, built from the numbers the engine uses, each READ
// WHERE IT LIVES — the carousel's window and its row's reach from its
// conveyor, its query from its own constant, the list's card from ui/
// Container's REFERENCE and two tokens of sections/PostList's GRID (its base
// gap and its widest row's count: all a token reading sees), the share, the
// row's pixel and its bleed from the band's own source, the tile
// sentence's zoom from sections/DoctorStats' source, the frame from ui/Card's
// framed row, ui/Container's gutter and THE BAND SCALE from their two strings
// — so the model fails when one of them moves. The list's card is MEASURED
// too: sections/PostList itself, rendered at the owner's window, its card
// held to the band's in design pixels, which catches what no token reading
// can — a gap or a count only the three-across row would wear (THE FIXED
// SHAPE's KEEP-IN-SYNC). Then PINNED TO THE ENGINE, the band rendered beside
// the clinic's numbers band exactly as Home renders it (sections/DoctorStats,
// `scaled`, the page ground, the opener at the start), on a FINE pointer
// (this runner's, beside its classic scrollbar), on a TOUCH screen (THE TOUCH
// SCREEN, below) and at a 20px root. Then SWEPT: the hint the band ships,
// read off its pictures, against the model's picture at every window from
// 280 to 3840px — both pointers, a classic scrollbar and none, a 16px root
// and a 20px one, heights above and below the row's.
//
// ── THE TOUCH SCREEN, WITHOUT TOUCHING THE TAB'S DEVICES. The browser
// projects share one Chromium tab, and switching its touch emulation on and
// off leaves a later file without a fine pointer or hover on CI's Linux
// (tests/unit/no-touch-emulation.test.ts, PR #166). So a touch screen is
// drawn through the CSSOM: every media query the stylesheet holds that asks
// for `(pointer: fine)` dropped from its rule's media list for the length of
// a case — THE BAND SCALE's three rules, which ask nothing else, then read
// `not all`; the row's, `(min-width: 37.5rem) and (min-height: 32rem),
// (min-width: 37.5rem) and (pointer: fine)`, keep their height clause, which
// a touch screen meets — the same reduction applied to every query the page
// asks of `matchMedia` (the carousel's reach and this file's own readings),
// and the classic scrollbar hidden (a touch screen's overlays the page); all
// restored after, and the restoration asserted. THE GATES cases read the
// same rules statically: the box round the carousel declares its band pixel
// behind `@supports`, `(pointer: fine)` and both container steps, so a real
// touch screen never meets it, and the row's nine classes — its pixel, its
// clamp, its zoom and its bleed — sit behind the row's query alone, the
// clamp's clip behind one `@supports` more in each of its two engines.
//
// ── THE CLAMP IN THE ROW, COUNTED IN LINES: a title's or a summary's lines
// are its content box — its height less THE CLAMP'S ROOM, the padding
// sections/PostCard's clamp adds — over its line height (PostCard.test.tsx's
// `linesOf`), and a card BEFORE the clamp is the same card with the row's
// four variables lifted INLINE on the row's box — each set to `initial`, a
// custom property's own guaranteed-invalid value, so every `var()` in the
// card falls back to today's value: the clamp's inert state, in the very
// layout it is compared with. Never a class: Tailwind reads tests too.
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

/** THE FLAT ROW's query (sections/CardCarousel's one spelling): its smallest
 *  window, in rem — its width in both clauses, its height in the first — and
 *  the clause a fine pointer meets at any height (the model's `flat` reads
 *  exactly these two clauses, held below). */
const ROW_MIN_WIDTH_REM = read(
  CARD_CAROUSEL_FLAT_QUERY,
  /\(min-width:([\d.]+)rem\)/,
  'the row’s width',
);
const ROW_MIN_HEIGHT_REM = read(
  CARD_CAROUSEL_FLAT_QUERY,
  /\(min-height:([\d.]+)rem\)/,
  'the row’s height',
);
const ROW_CLAUSES = CARD_CAROUSEL_FLAT_QUERY.split(',');

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
 *  spelled — and THE FLAT ROW's: the theme pixel's two
 *  divisors (`1rem / 16 / share`), the zoom's two numbers (`tile / share`)
 *  and the bleed's inset in rem. Every pattern touching a custom property's
 *  class is ASSEMBLED from parts: Tailwind reads tests too, and the census
 *  refuses any spelling of those classes but the classes themselves (THE
 *  D-LIT RULE). */
const SHARE = read(source, /^const MINIATURE = ([\d.]+);$/m, 'share');
const BAND_COLUMN = read(source, /^const LIST_COLUMN = (\d+);$/m, 'column');
const BAND_GAP = read(source, /^const LIST_GAP = (\d+);$/m, 'gap');
const BAND_COLUMNS = read(source, /^const LIST_COLUMNS = (\d+);$/m, 'columns');
const ROW_THEME = new RegExp(
  String.raw`\[` + '--scale-px' + String.raw`:calc\(1rem/(\d+)/([\d.]+)\)\]`,
).exec(source);
if (ROW_THEME === null) throw new Error('BlogCarousel: no row pixel found');
const [, ROW_REM_DIVISOR, ROW_THEME_SHARE] = ROW_THEME.map(Number);
const ROW_ZOOM_PARTS = new RegExp(
  String.raw`\[` + '--band-zoom' + String.raw`:calc\(([\d.]+)/([\d.]+)\)\]`,
).exec(source);
if (ROW_ZOOM_PARTS === null) throw new Error('BlogCarousel: no row zoom');
const [, ROW_TILE, ROW_ZOOM_SHARE] = ROW_ZOOM_PARTS.map(Number);
const ROW_INSET_REM = read(
  source,
  /mx-\[calc\(50%_-_50vw_\+_([\d.]+)rem\)\]/,
  'the bleed’s inset',
);

/** THE CLAMP IN THE ROW's four variables, by name (sections/PostCard's THE
 *  CLAMP reads them) — and what the band sets each to, read off its source,
 *  each pattern assembled from parts as above. Read wherever it is set, the
 *  row's variant or none: WHERE it holds is the engine's to show (THE GATES,
 *  and the line's cases below). */
const CLAMP_NAMES = [
  '--clamp-box',
  '--clamp-clip',
  '--title-lines',
  '--summary-lines',
] as const;
/** Every value the band sets a clamp variable to, each with the `@supports`
 *  condition its class names first — null for a plain one (the clip's two,
 *  THE CLIP, NOT A SCROLLER: one per engine). */
const clampSettings = (
  name: (typeof CLAMP_NAMES)[number],
): { where: string | null; value: string }[] =>
  [
    ...source.matchAll(
      new RegExp(
        String.raw`(?:supports-\[([^\]\s]+)\]:)?\[` +
          name +
          String.raw`:([^\]\s]+)\]`,
        'g',
      ),
    ),
  ].map((match) => ({ where: match[1] ?? null, value: match[2] ?? '' }));
const clampSetting = (name: (typeof CLAMP_NAMES)[number]): string => {
  const [only, ...more] = clampSettings(name);
  if (only === undefined || more.length > 0 || only.where !== null) {
    throw new Error(`BlogCarousel: not ONE plain ${name} set`);
  }
  return only.value;
};
const CLAMP_BOX = clampSetting('--clamp-box');
const TITLE_LINES = Number(clampSetting('--title-lines'));
const SUMMARY_LINES = Number(clampSetting('--summary-lines'));
/** The clip's two settings, by the engine that meets each — `clip` where
 *  `@supports (overflow: clip)` holds (this runner's Chromium, asserted in
 *  `beforeAll`), `hidden` where it does not. */
const CLIP_SETTINGS = clampSettings('--clamp-clip');
const clipWhere = (where: string): string => {
  const found = CLIP_SETTINGS.find((setting) => setting.where === where);
  if (found === undefined) throw new Error(`BlogCarousel: no clip ${where}`);
  return found.value;
};
const CLAMP_CLIP = clipWhere('overflow:clip');
const CLAMP_CLIP_ELSEWHERE = clipWhere('not_(overflow:clip)');

/** sections/DoctorStats' TILE_ZOOM — the tile sentence's multiple of the
 *  band's pixel, its class assembled from parts as above. */
const TILE_ZOOM = read(
  statsSource,
  new RegExp(
    String.raw`const TILE_ZOOM = '\[` +
      '--band-zoom' +
      String.raw`:([\d.]+)\]';`,
  ),
  'tile zoom',
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

/** A miniature's words at the theme's pixel (PostCard's THE SMALLEST TEXT):
 *  the title, the author, the summary, the reading time, the read-more and a
 *  chip's label — every one of them × the pixel the card stands in. */
const MINIATURE_SIZES = [19.5, 9.1, 10.4, 10.4, 11.7, 7.8] as const;

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
  /** THE FLAT ROW is drawn (its query holds); THE LINE otherwise. */
  flat: boolean;
  /** ui/Container's column. */
  column: number;
  /** The carousel: on the line the column, capped at 96rem where the scale
   *  may apply; in the row the screen less the bleed's inset a side. */
  carousel: number;
  /** THE BAND SCALE applies (the opener's pixel is then the column's). */
  scaled: boolean;
  /** The opener's pixel — the rhythm box's. */
  bandPixel: number;
  /** The carousel's pixel (THE CAROUSEL'S OWN PIXEL) — on the line the
   *  theme's, the regime never reaching it; the tile sentence's over the
   *  share in the row (THE TEXT RULE). */
  pixel: number;
  /** A card's width. */
  card: number;
  /** The card is the carousel's, narrower than CARD (a 20px root on a phone). */
  clamped: boolean;
  /** The picture: the card less its two frames. */
  picture: number;
  /** What the carousel leaves beside the centre card, a side. */
  beside: number;
  /** The room a side, and the fade — never past the centre card's edge. */
  room: number;
  fade: number;
  /** An arrow's strip, and its chevron's width. */
  bar: number;
  chevron: number;
  /** The numbers band's tile sentence — and, in the row, every summary. */
  tile: number;
  /** The cards live in the row — the centre and the reach a side, held
   *  under half the ring; the centre alone on the line. */
  live: number;
}>;

/**
 * The band at a `w` × `h` px window, `sb` px of it a classic scrollbar, a
 * `pointer` and a `root` px root.
 *   · THE LINE (under the row's query — every window under 37.5rem, and on a
 *     coarse pointer every window under 32rem tall): the column
 *     (ui/Container), the regime (THE BAND SCALE: a fine pointer, a column of
 *     max(56rem, 896px) — which the line never meets since the query's
 *     pointer clause, the sweep below holds it), the carousel's pixel —
 *     min(column, 96rem) / 1106 inside the regime, the theme's 1rem / 16
 *     outside it — and the card CARD in it,
 *     never wider than the carousel (CardCarousel's THE FIXED CARD), the room
 *     the column leaves beside the five-card window, the fade — its outermost
 *     card's 40 %, but never past the centre card's edge — and each arrow's
 *     strip: nine steps, narrower where the column leaves less beside the
 *     card, never under 24px, its chevron six steps and never wider than the
 *     strip less one.
 *   · THE FLAT ROW (from its query up): the carousel the screen less the
 *     bleed's inset a side; its pixel — the tile sentence's over the share —
 *     min(column, 96rem) / 1106 × tile ÷ share inside the regime, 1rem / 16
 *     ÷ share outside it; the card CARD in it; no room, the fade the
 *     arrow's strip, the strip nine steps where the carousel leaves that much
 *     beside the card; and the reach — the side cards wholly between the
 *     strips even grown to the centre card's size (./conveyor's flatReach),
 *     held under half the ring.
 */
function modelAt(
  w: number,
  sb: number,
  pointer: Pointer,
  root = ROOT,
  h = 1000,
): Modelled {
  const column = w - sb - 2 * gutter(w, root);
  const scaled =
    pointer === 'fine' && column >= Math.max(STEP_REM * root, STEP_FLOOR);
  // THE QUERY's two clauses: the width in both, then the height — or a
  // fine pointer, at any height.
  const flat =
    w >= ROW_MIN_WIDTH_REM * root &&
    (h >= ROW_MIN_HEIGHT_REM * root || pointer === 'fine');
  const capped = Math.min(column, SCALE_CAP_REM * root);
  const bandPixel = scaled ? capped / REFERENCE : root / 16;
  const tile = 16 * (scaled ? bandPixel * TILE_ZOOM : root / 16);
  const carousel = flat
    ? w - 2 * ROW_INSET_REM * root
    : pointer === 'fine'
      ? capped
      : column;
  const pixel = flat
    ? scaled
      ? (capped / REFERENCE) * (TILE_ZOOM / SHARE)
      : root / 16 / SHARE
    : scaled
      ? capped / REFERENCE
      : root / 16;
  const full = CARD_DESIGN * pixel;
  const card = Math.min(full, carousel);
  const beside = (carousel - card) / 2;
  const room = flat ? 0 : Math.max(0, (carousel - R5 * card) / 2);
  const step = 4 * pixel;
  const bar = Math.max(BAR_MIN, Math.min(BAR_STEPS * step, beside));
  const reach = flat
    ? Math.min(
        flatReach((carousel / 2 - bar) / card),
        Math.floor((RING - 1) / 2),
      )
    : 0;
  return {
    flat,
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
    fade: flat ? bar : Math.min(F5 * card, Math.max(0, beside - room)),
    bar,
    chevron: Math.min(CHEVRON_STEPS * step, bar - step),
    tile,
    live: 1 + 2 * reach,
  };
}

/** The slot a `sizes` list gives at a `w` × `h` px window — its first entry
 *  whose conditions hold, the way a browser reads it (PostGallery.test.tsx's
 *  reader, with the touch screen's condition, the row's height and a `root`
 *  px rem). */
function slotAt(
  sizes: string,
  w: number,
  pointer: Pointer,
  root = ROOT,
  h = 1000,
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
      const minHeight = /^min-height:\s*([\d.]+)rem$/.exec(condition);
      if (minHeight) return h >= Number(minHeight[1]) * root;
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

/** The posts the band ships — the model's count of cards in a ring. */
const RING = propsFor('ro', ro).posts.length;

/** The five languages, each with its own words. */
const LANGUAGES = [
  ['ro', ro],
  ['en', en],
  ['de', de],
  ['fr', fr],
  ['it', it_],
] as const satisfies readonly (readonly [Locale, typeof ro])[];

/** THE NUMBERS BAND as Home mounts it (app/[locale]/(home)/page.tsx: scaled,
 *  the page ground, the opener at the start) — its column the one the line's
 *  carousel must match, its tile sentence the size the row's summaries must
 *  be. Fixture tiles: the column and the sentence's SIZE do not read them;
 *  the first sentence is the owner's reference words. */
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
        description:
          'Peste 8000 de zâmbete îngrijite cu dedicare și profesionalism.',
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
  // The clamp's clip this engine meets (THE CLIP, NOT A SCROLLER): `clip`.
  expect(
    CSS.supports('overflow', 'clip'),
    'the runner has overflow: clip',
  ).toBe(true);
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
 *  carousel's transforms (a side card is drawn smaller, and on the line
 *  turned). */
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

/** The two bands at a `w` × `h` px window, as Home stacks them, and every box
 *  the measurements read. `lang` is stamped on <html> the way the shell does.
 *  Two frames: the row measures its reach after it mounts (CardCarousel's
 *  THE REACH) and renders the live cards once more. */
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
  await frame();
  const stats = screen.getByRole('region', {
    name: 'Experiență confirmată în timp',
  });
  const statsRhythm = stats.firstElementChild?.firstElementChild;
  const band = screen.getByRole('region', { name: props.title });
  const column = band.firstElementChild;
  const rhythm = column?.firstElementChild;
  const rowBox = rhythm?.lastElementChild;
  const own = rowBox?.firstElementChild;
  const carousel = within(band).getByRole('region', {
    name: props.labels.region,
  });
  const stage = carousel.querySelector('[aria-live]');
  const tileSentence =
    within(stats).getAllByRole('listitem')[0]?.lastElementChild;
  if (
    !(statsRhythm instanceof HTMLElement) ||
    !(column instanceof HTMLElement) ||
    !(rhythm instanceof HTMLElement) ||
    !(rowBox instanceof HTMLElement) ||
    !(own instanceof HTMLElement) ||
    !(stage instanceof HTMLElement) ||
    !(tileSentence instanceof HTMLElement)
  ) {
    throw new Error('BlogCarousel: a box is missing');
  }
  const slides = [...stage.children].filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );
  // The centre card: in the row the one wearing the highlight, on the line
  // the one live card.
  const flat = window.matchMedia(CARD_CAROUSEL_FLAT_QUERY).matches;
  const centre = flat
    ? slides.find((slide) => auraOf(slide) === 1)
    : slides.find((slide) => !slide.hasAttribute('inert'));
  if (centre === undefined) throw new Error('no centred card');
  // The classic scrollbar this runner draws at this window: the window less
  // the page's own box, which ends where a reserved gutter begins.
  const scrollbar = window.innerWidth - box(document.documentElement).width;
  return {
    stats,
    statsRhythm,
    tileSentence,
    band,
    column,
    rhythm,
    rowBox,
    own,
    carousel,
    stage,
    slides,
    centre,
    flat,
    scrollbar,
  };
}

type Scene = Awaited<ReturnType<typeof renderAt>>;

/** A card box's highlight — its `::before` layer's opacity (CardCarousel's
 *  THE HIGHLIGHT): 1 where it shows, 0 where it does not. */
function auraOf(slide: HTMLElement): number {
  return Number(getComputedStyle(slide, '::before').opacity);
}

/** A box's design pixel: its registered `--scale-px` where a design scale
 *  redraws it — its `--spacing` no longer the root's — the theme's 1rem / 16
 *  where nothing is declared. */
function pixelOf(element: HTMLElement): number {
  const remapped =
    getComputedStyle(element).getPropertyValue('--spacing') !==
    getComputedStyle(document.documentElement).getPropertyValue('--spacing');
  return remapped
    ? px(element, '--scale-px')
    : parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
}

/** The centre card's six words — the title, the author, the summary, the
 *  reading time, the read-more and a chip's label (none for a post without
 *  tags). */
function wordsOf(slide: HTMLElement) {
  const article = slide.querySelector('article');
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
  const chip = article?.querySelector('ul li');
  if (
    !author ||
    !summary ||
    !(reading instanceof HTMLElement) ||
    !(readMore instanceof HTMLElement)
  ) {
    throw new Error('a word is missing');
  }
  return {
    title,
    author,
    summary,
    reading,
    readMore,
    chip: chip instanceof HTMLElement ? chip : null,
  };
}

/** THE CLAMP IN THE ROW, lifted — or put back: the row's four variables set
 *  INLINE on the row's box to `initial`, a custom property's own
 *  guaranteed-invalid value, so every card's `var()` falls back to today's
 *  value (the header's THE CLAMP IN THE ROW, COUNTED IN LINES). */
function liftClamp(rowBox: HTMLElement, lifted: boolean): void {
  for (const name of CLAMP_NAMES) {
    if (lifted) rowBox.style.setProperty(name, 'initial');
    else rowBox.style.removeProperty(name);
  }
}

/** The page's four variables as the band's row sets them — INLINE, for a
 *  card standing outside the band (the blog list's own, `listTallest`). */
const CLAMP_INLINE = {
  '--clamp-box': CLAMP_BOX,
  '--clamp-clip': CLAMP_CLIP,
  '--title-lines': String(TITLE_LINES),
  '--summary-lines': String(SUMMARY_LINES),
} as CSSProperties;

/** A box's LINES: its content box — its height less its padding, THE
 *  CLAMP'S ROOM where the clamp is set — over its line height
 *  (PostCard.test.tsx's `linesOf`); layout values. */
function linesOf(element: Element): number {
  const style = getComputedStyle(element);
  return (
    (parseFloat(style.height) -
      parseFloat(style.paddingTop) -
      parseFloat(style.paddingBottom)) /
    parseFloat(style.lineHeight)
  );
}

/** THE OPENER — the numbers band's size and left edge, and the opener's
 *  pixel the band's own: the column's where the scale holds — so neither the
 *  carousel's own pixel nor the row's ever reaches it. */
function expectOpener(scene: Scene, model: Modelled, where: string): void {
  const { band, stats, rhythm } = scene;
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
  expect(
    Math.abs(pixelOf(rhythm) - model.bandPixel),
    `${where}: the opener's pixel`,
  ).toBeLessThanOrEqual(1e-4);
}

/** THE FIXED SHAPE — every card of the ring the model's width and ONE
 *  height, every card filling its box, the picture the card less its
 *  frames. */
function expectShape(scene: Scene, model: Modelled, where: string): void {
  const { slides, centre } = scene;
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
}

/** The arrows' strips and chevrons — each strip the model's, each chevron
 *  never wider than its strip less a step — and the two arrows. */
function arrowsOf(scene: Scene, model: Modelled, where: string) {
  const [previous, next] = within(scene.carousel)
    .getAllByRole('button')
    .slice(0, 2);
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
  return { previous, next };
}

/** NO SIDEWAYS SCROLL (§7) — by the root's own box, never `clientWidth`. */
function expectNoSidewaysScroll(where: string): void {
  const root = document.documentElement;
  expect(root.scrollWidth, `${where}: no sideways scroll`).toBeLessThanOrEqual(
    Math.ceil(box(root).width),
  );
}

/**
 * THE LINE — everything the band promises at one window under the row's
 * query, against the model and against the numbers band beside it, exactly
 * as before THE FLAT ROW:
 *   · THE WIDTH — the carousel, its stage and the arrows' two outer edges on
 *     the numbers band's column (its rhythm box), to a hundredth;
 *   · THE OPENER — the <h2> and the eyebrow the numbers band's size and edge;
 *   · THE CAROUSEL'S OWN PIXEL — the model's, the theme's; the row's box
 *     round it declaring nothing, no card glowing, the centre alone live;
 *   · THE FIXED SHAPE — every card of the ring the model's width and ONE
 *     height, every card filling its box, the picture the card less its frames;
 *   · THE SIDES — the room and the fade the model's, and where there is no
 *     room the window cut at both edges, the centre card whole and centred;
 *   · no sideways scroll.
 */
function expectBand(scene: Scene, model: Modelled, where: string): void {
  const { statsRhythm, rowBox, own, carousel, stage, slides, centre, flat } =
    scene;
  expect(flat, `${where}: the line, under the row's query`).toBe(false);
  expect(model.flat, `${where}: the model's line`).toBe(false);
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
  const { previous, next } = arrowsOf(scene, model, where);
  expect(
    Math.abs(box(previous).left - column.left),
    `${where}: the previous arrow on the column’s edge`,
  ).toBeLessThanOrEqual(0.01);
  expect(
    Math.abs(column.right - box(next).right),
    `${where}: the next arrow on the column’s edge`,
  ).toBeLessThanOrEqual(0.01);

  // THE OPENER.
  expectOpener(scene, model, where);

  // THE CAROUSEL'S OWN PIXEL — and the row's box, idle: its
  // spacing the rhythm box's round it (the band's pixel, or the root's),
  // so it redraws nothing of its own.
  expect(
    Math.abs(pixelOf(own) - model.pixel),
    `${where}: the carousel’s pixel`,
  ).toBeLessThanOrEqual(1e-4);
  expect(
    getComputedStyle(rowBox).getPropertyValue('--spacing'),
    `${where}: the row's box declares nothing`,
  ).toBe(getComputedStyle(scene.rhythm).getPropertyValue('--spacing'));
  expect(slides.map(auraOf), `${where}: no card glows on the line`).toEqual(
    slides.map(() => 0),
  );
  expect(
    slides.filter((slide) => !slide.hasAttribute('inert')),
    `${where}: the centre card alone live`,
  ).toEqual([centre]);

  // THE FIXED SHAPE.
  expectShape(scene, model, where);

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
  // Each strip's inner edge stands `bar − beside` past the card's edge —
  // a gap where that is negative, an overlap where the floor binds. BESIDE
  // the card wherever the column leaves 24px; past that floor, over its edge
  // by the floor's want — a 280px window's case (RECORDED in the band's
  // header).
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

  expectNoSidewaysScroll(where);
}

/**
 * THE FLAT ROW — everything the band promises at one window from the row's
 * query up:
 *   · THE BLEED — the carousel the screen less the inset a side, centred on
 *     the page; its stage the whole of it, the arrows on its two edges, the
 *     mask clear at the stage's edge and opaque at the strip's inner edge;
 *   · THE OPENER — still every Home band's size and edge;
 *   · THE TEXT RULE — the carousel's pixel the model's, the centre card's
 *     summary the numbers band's tile sentence to a hundredth of a pixel, and
 *     every word of the card the theme's miniature × that pixel, so every
 *     ratio inside the card is the miniature's;
 *   · THE FIXED SHAPE, as on the line;
 *   · THE HIGHLIGHT — the centre card's aura shown, and only there;
 *   · THE REACH — the live cards the model's count, the centre among them;
 *   · no sideways scroll, and the band as wide as the page.
 */
function expectRow(scene: Scene, model: Modelled, where: string): void {
  const { band, own, carousel, stage, slides, centre, tileSentence, flat } =
    scene;
  expect(flat, `${where}: the row, from its query up`).toBe(true);
  expect(model.flat, `${where}: the model's row`).toBe(true);
  // THE BLEED.
  const pageBox = box(document.documentElement);
  const root = box(carousel);
  expect(
    Math.abs(root.width - model.carousel),
    `${where}: the carousel the screen less the inset a side`,
  ).toBeLessThanOrEqual(1 / 32);
  expect(
    Math.abs(root.left + root.width / 2 - pageBox.width / 2),
    `${where}: the carousel centred on the page`,
  ).toBeLessThanOrEqual(0.01);
  expect(root.left, `${where}: inside the page`).toBeGreaterThanOrEqual(-0.01);
  expect(root.right).toBeLessThanOrEqual(pageBox.width + 0.01);
  expect(
    Math.abs(box(stage).width - root.width),
    `${where}: the stage the whole carousel`,
  ).toBeLessThanOrEqual(0.01);
  const { previous, next } = arrowsOf(scene, model, where);
  expect(
    Math.abs(box(previous).left - root.left),
    `${where}: the previous arrow on the carousel’s edge`,
  ).toBeLessThanOrEqual(0.01);
  expect(
    Math.abs(root.right - box(next).right),
    `${where}: the next arrow on the carousel’s edge`,
  ).toBeLessThanOrEqual(0.01);
  const [clear, opaque] = maskStops(stage);
  expect(Math.abs(clear), `${where}: no room`).toBeLessThanOrEqual(1 / 32);
  expect(
    Math.abs(opaque - model.bar),
    `${where}: opaque at the strip’s inner edge`,
  ).toBeLessThanOrEqual(1 / 32);

  // THE OPENER.
  expectOpener(scene, model, where);

  // THE TEXT RULE.
  const pixel = pixelOf(own);
  expect(
    Math.abs(pixel - model.pixel),
    `${where}: the carousel’s pixel`,
  ).toBeLessThanOrEqual(1e-4);
  const words = wordsOf(centre);
  expect(
    Math.abs(px(words.summary, 'font-size') - px(tileSentence, 'font-size')),
    `${where}: the summary the tile sentence’s size`,
  ).toBeLessThanOrEqual(0.01);
  expect(
    Math.abs(px(tileSentence, 'font-size') - model.tile),
    `${where}: the tile sentence the model’s`,
  ).toBeLessThanOrEqual(0.01);
  for (const [element, size, name] of [
    [words.title, MINIATURE_SIZES[0], 'the title'],
    [words.author, MINIATURE_SIZES[1], 'the author'],
    [words.summary, MINIATURE_SIZES[2], 'the summary'],
    [words.reading, MINIATURE_SIZES[3], 'the reading time'],
    [words.readMore, MINIATURE_SIZES[4], 'the read-more'],
    [words.chip, MINIATURE_SIZES[5], 'a chip’s label'],
  ] as const) {
    if (element === null) continue;
    expect(
      Math.abs(px(element, 'font-size') - size * pixel),
      `${where}: ${name}, the miniature’s ${size} × ${pixel.toFixed(4)}`,
    ).toBeLessThanOrEqual(0.01);
  }

  // THE FIXED SHAPE.
  expectShape(scene, model, where);

  // THE HIGHLIGHT.
  expect(
    slides.map(auraOf),
    `${where}: the centre card’s aura, and only there`,
  ).toEqual(slides.map((slide) => (slide === centre ? 1 : 0)));

  // THE REACH.
  const live = slides.filter((slide) => !slide.hasAttribute('inert'));
  expect(live, `${where}: the live cards`).toHaveLength(model.live);
  expect(live).toContain(centre);

  // NO SIDEWAYS SCROLL, and the band the page's own width.
  expectNoSidewaysScroll(where);
  expect(
    Math.abs(box(band).width - pageBox.width),
    `${where}: the band as wide as the page`,
  ).toBeLessThanOrEqual(0.01);
}

/** A media query that asks for a fine pointer. */
const FINE = /\(pointer:\s*fine\)/;

/** A media query LIST as a touch screen answers it (the header's THE TOUCH
 *  SCREEN): every query in it that asks for a fine pointer dropped, the rest
 *  kept — so THE FLAT ROW's list keeps its height clause — and `not all`
 *  where none is left. The list as the engine serializes it, its queries
 *  separated by ", " (sections/CardCarousel's geometry test reads it so). */
const asOnTouch = (list: string): string => {
  const kept = list.split(', ').filter((query) => !FINE.test(query));
  return kept.length > 0 ? kept.join(', ') : 'not all';
};

/** A TOUCH SCREEN, drawn through the CSSOM and `matchMedia` (the header's THE
 *  TOUCH SCREEN): every rule's media list and every query the page asks
 *  answered as a touch screen answers it, and the scrollbar hidden, while
 *  `run` runs — all restored after, and the restoration asserted. */
async function asOnATouchScreen<T>(run: () => Promise<T>): Promise<T> {
  const switched: { rule: CSSMediaRule; was: string }[] = [];
  const walk = (rules: CSSRuleList): void => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSMediaRule && FINE.test(rule.media.mediaText)) {
        switched.push({ rule, was: rule.media.mediaText });
      }
      if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) walk(sheet.cssRules);
  // Never vacuous: THE BAND SCALE's three rules at least — and the row's,
  // its pointer clause dropped and its height clause kept.
  expect(switched.length).toBeGreaterThanOrEqual(3);
  const row = window.matchMedia(CARD_CAROUSEL_FLAT_QUERY).media;
  expect(
    switched.filter(({ was }) => was === row).length,
    'the row’s rules among them',
  ).toBeGreaterThan(0);
  const real = window.matchMedia.bind(window);
  const root = document.documentElement;
  const asked = vi
    .spyOn(window, 'matchMedia')
    .mockImplementation((query: string) => real(asOnTouch(real(query).media)));
  try {
    for (const { rule, was } of switched) rule.media.mediaText = asOnTouch(was);
    root.style.scrollbarWidth = 'none';
    // The premise, named: the row's query answered by its height clause.
    expect(window.matchMedia(CARD_CAROUSEL_FLAT_QUERY).media).toBe(
      row.split(', ')[0],
    );
    return await run();
  } finally {
    asked.mockRestore();
    for (const { rule, was } of switched) rule.media.mediaText = was;
    root.style.scrollbarWidth = '';
    expect(
      switched.every(({ rule, was }) => rule.media.mediaText === was),
      'every rule restored',
    ).toBe(true);
    expect(window.matchMedia(CARD_CAROUSEL_FLAT_QUERY).media, 'restored').toBe(
      row,
    );
  }
}

/** `run` on the pointer a case names: this runner's own fine one as it is,
 *  a coarse one through `asOnATouchScreen`. */
const onPointer = <T,>(pointer: Pointer, run: () => Promise<T>): Promise<T> =>
  pointer === 'coarse' ? asOnATouchScreen(run) : run();

/** Every rule the stylesheet holds for a class, with the conditions it sits
 *  under (its @media, @supports and @container text) and its place in the
 *  sheet's order. */
function rulesFor(token: string): { conditions: string[]; order: number }[] {
  const found: { conditions: string[]; order: number }[] = [];
  let order = 0;
  const walk = (
    rules: CSSRuleList,
    conditions: string[],
    mine: boolean,
  ): void => {
    for (const rule of Array.from(rules)) {
      order += 1;
      if (rule instanceof CSSStyleRule) {
        const hit = mine || rule.selectorText === `.${CSS.escape(token)}`;
        if (hit && rule.style.length > 0) found.push({ conditions, order });
        walk(rule.cssRules, conditions, hit);
      } else if (rule instanceof CSSMediaRule) {
        walk(
          rule.cssRules,
          [...conditions, `media ${rule.media.mediaText}`],
          mine,
        );
      } else if (rule instanceof CSSSupportsRule) {
        walk(
          rule.cssRules,
          [...conditions, `supports ${rule.conditionText}`],
          mine,
        );
      } else if (rule instanceof CSSContainerRule) {
        walk(
          rule.cssRules,
          [...conditions, `container ${rule.conditionText}`],
          mine,
        );
      } else if ('cssRules' in rule) {
        walk((rule as CSSGroupingRule).cssRules, conditions, mine);
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    walk(sheet.cssRules, [], false);
  }
  return found;
}

describe('BlogCarousel — THE MODEL, read where it lives', () => {
  it('rests on the numbers the engine uses: the band’s list card IS sections/PostList’s three-across card at ui/Container’s REFERENCE', () => {
    // THE FIXED SHAPE's KEEP-IN-SYNC: the band's three spelled numbers are
    // the band scale's REFERENCE and the list's GRID.
    expect(BAND_COLUMN).toBe(REFERENCE);
    expect(BAND_GAP).toBe(LIST_GAP_STEPS * 4);
    expect(BAND_COLUMNS).toBe(LIST_COLUMNS);
    expect([REFERENCE, LIST_GAP_STEPS, LIST_COLUMNS, SHARE]).toEqual([
      1106, 8, 3, 0.65,
    ]);
    expect(CARD_DESIGN).toBeCloseTo(225.7667, 4);
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

  it('reads THE FLAT ROW’s numbers where they live: the query sections/CardCarousel spells, the theme pixel over the share, the tile sentence’s zoom over the share, half a rem in from each edge, the clamp’s two lines of each (THE TEXT RULE, THE BLEED, THE CLAMP IN THE ROW)', () => {
    expect([ROW_MIN_WIDTH_REM, ROW_MIN_HEIGHT_REM]).toEqual([37.5, 32]);
    // The two clauses the model's `flat` reads — the width in both, then the
    // height, or a fine pointer at any height — and nothing else.
    expect(ROW_CLAUSES).toEqual([
      `(min-width:${ROW_MIN_WIDTH_REM}rem) and (min-height:${ROW_MIN_HEIGHT_REM}rem)`,
      `(min-width:${ROW_MIN_WIDTH_REM}rem) and (pointer:fine)`,
    ]);
    // The clamp the row switches on: the engine's line-clamp box, the clip
    // that hides the lines past it — `clip` where the engine has it, never
    // a scroll container, and `hidden` where it has not (THE CLIP, NOT A
    // SCROLLER) — and the owner's two lines of each.
    expect([CLAMP_BOX, CLAMP_CLIP, TITLE_LINES, SUMMARY_LINES]).toEqual([
      '-webkit-box',
      'clip',
      2,
      2,
    ]);
    expect(CLIP_SETTINGS).toEqual([
      { where: 'overflow:clip', value: 'clip' },
      { where: 'not_(overflow:clip)', value: 'hidden' },
    ]);
    expect(CLAMP_CLIP_ELSEWHERE).toBe('hidden');
    // The row's theme pixel: 1rem / 16 — sixteen theme pixels to the rem —
    // over the band's own share.
    expect(ROW_REM_DIVISOR).toBe(16);
    expect(ROW_THEME_SHARE).toBe(SHARE);
    // The row's zoom: sections/DoctorStats' tile zoom over the same share, so
    // a summary (text-base at the share) is the tile sentence (text-base at
    // the zoom).
    expect(TILE_ZOOM).toBe(9 / 8);
    expect(ROW_TILE).toBe(TILE_ZOOM);
    expect(ROW_ZOOM_SHARE).toBe(SHARE);
    expect(ROW_INSET_REM).toBe(0.5);
    // The model's two pixels at the owner's window: the theme's over the
    // share outside the regime, the column's at 9/8 over it inside.
    expect(modelAt(1024, 15, 'fine', ROOT, 768).pixel).toBeCloseTo(
      1 / 0.65,
      10,
    );
    expect(modelAt(1401, 15, 'fine', ROOT, 1063).pixel).toBeCloseTo(
      (1105.8 / 1106) * (1.125 / 0.65),
      4,
    );
    // Under 32rem tall, the pointer decides: a mouse keeps the row (the same
    // pixel as at full height), a touch screen draws the line.
    expect(modelAt(1401, 15, 'fine', ROOT, 500)).toEqual(
      modelAt(1401, 15, 'fine', ROOT, 1063),
    );
    expect(modelAt(1401, 0, 'coarse', ROOT, 500).flat).toBe(false);
    expect(modelAt(599, 15, 'fine', ROOT, 1000).flat).toBe(false);
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
    for (const token of tokens) {
      const sets = rulesFor(token);
      expect(sets.length, token).toBeGreaterThan(0);
      for (const { conditions } of sets) {
        const text = conditions.join(' | ');
        expect(text, token).toMatch(/supports .*rgb\(from red r g b\)/);
        expect(text, token).toMatch(/media \(pointer: fine\)/);
        expect(text, token).toMatch(/container .*56rem/);
        expect(text, token).toMatch(/container .*896px/);
      }
    }
  });

  it('puts THE FLAT ROW’s nine classes behind its query alone — the row’s pixel, its clamp, its zoom and the bleed, the clamp’s clip behind one `@supports` more in each of its two engines — and sets NO floor: no class of the band names it and the box round the carousel computes none, in the row and on the line (THE GATES, THE FLOOR, REMOVED)', async () => {
    const { band, rowBox, own, carousel } = await renderAt(1401);
    // The query as the engine serializes it — its two clauses, ", " apart.
    const query = `media ${window.matchMedia(CARD_CAROUSEL_FLAT_QUERY).media}`;
    expect(query).toBe(
      `media ${ROW_CLAUSES.map((clause) => clause.replaceAll(':', ': ')).join(', ')}`,
    );
    const variant = `[@media${CARD_CAROUSEL_FLAT_QUERY.replaceAll(' ', '_')}]:`;
    const behindTheQuery = (element: HTMLElement): string[] =>
      [...element.classList].filter((token) => token.startsWith(variant));
    // The row's box: its pixel and the remap, then the clamp's five — its
    // four variables, the clip one per engine — nothing else; the box round
    // the carousel: the zoom; the carousel's root: the bleed, beside
    // sections/CardCarousel's own two row classes (its room and its fade,
    // which its own suites hold).
    const ownRoot = behindTheQuery(carousel).filter(
      (token) => !/--inset|--fade/.test(token),
    );
    expect(behindTheQuery(rowBox)).toEqual([...rowBox.classList]);
    const nine = [
      ...behindTheQuery(rowBox),
      ...behindTheQuery(own),
      ...ownRoot,
    ];
    expect(nine).toHaveLength(9);
    // The clamp's four variables among them, each setting its own variable
    // (its class's property is the variable), the clip twice: the phone never
    // meets one.
    for (const name of CLAMP_NAMES) {
      expect(
        behindTheQuery(rowBox).filter((token) =>
          new RegExp(
            String.raw`^\S*\]:(?:supports-\[[^\]]+\]:)?\[` + name + ':',
          ).test(token),
        ),
        name,
      ).toHaveLength(name === '--clamp-clip' ? 2 : 1);
    }
    for (const token of nine) {
      const sets = rulesFor(token);
      expect(sets.length, token).toBeGreaterThan(0);
      for (const { conditions } of sets) {
        if (token.includes(`[--clamp-clip:`)) {
          // The clip's two: the row's query, then the engine's own — `clip`
          // where `@supports (overflow: clip)` holds, `hidden` where it does
          // not, so every engine meets exactly ONE and no order decides.
          const [media, supports, ...more] = conditions;
          expect(media, token).toBe(query);
          expect(more, token).toEqual([]);
          expect(supports, token).toMatch(
            token.endsWith(':clip]')
              ? /^supports \(overflow: ?clip\)$/
              : /^supports not \(overflow: ?clip\)$/,
          );
        } else {
          expect(conditions, token).toEqual([query]);
        }
      }
    }
    // THE FLOOR, REMOVED: no class of the band SETS the floor variable, at
    // any depth — a setter's own property is the variable; the band scale's
    // pixel class only reads it — and the box round the carousel computes
    // none: unset, so that read takes its own 0px. Here in the row and on the
    // line (a phone) alike. The name assembled from parts (THE D-LIT RULE).
    const name = ['--band', 'floor'].join('-');
    const setting = (root: Element): string[] =>
      [root, ...root.querySelectorAll('*')].flatMap((element) =>
        [...element.classList].filter((token) => token.includes(`[${name}:`)),
      );
    expect(setting(band), 'the row: no class sets the floor').toEqual([]);
    expect(getComputedStyle(own).getPropertyValue(name), 'the row').toBe('');
    cleanup();
    const phone = await renderAt(390);
    expect(phone.flat, 'the line').toBe(false);
    expect(setting(phone.band), 'the line: no class sets it').toEqual([]);
    expect(getComputedStyle(phone.own).getPropertyValue(name), 'the line').toBe(
      '',
    );
  });
});

describe('BlogCarousel — THE LINE: the phone’s look — every phone, and on a touch screen every window under the row’s height — exactly as before', () => {
  it.each([
    // [window, height, what it samples]
    [280, 1000, 'under every phone: the window cut, the centre card whole'],
    [320, 1000, '§7’s narrowest'],
    [390, 1000, 'a phone'],
    [599, 1000, 'the line’s widest on a mouse, a pixel under the row’s width'],
    [599, 500, 'the same window, short — the height never asked on a mouse'],
  ] as const)(
    'holds the model at a %i × %ipx window on a fine pointer (%s)',
    async (w, h, what) => {
      const scene = await renderAt(w, undefined, undefined, h);
      expect(pointerNow(), 'the runner’s primary pointer').toBe('fine');
      expectBand(
        scene,
        modelAt(w, scene.scrollbar, 'fine', ROOT, h),
        `${w} × ${h} (${what})`,
      );
    },
  );

  it.each([
    [320, 1000, '§7’s narrowest phone: the strips the room beside the card'],
    [360, 1000, 'a phone: the fade and the strips beside the card'],
    [390, 1000, 'a phone'],
    [844, 390, 'a phone held sideways'],
    [932, 430, 'the largest phone held sideways'],
    [1024, 500, 'a tablet’s width under the row’s height: room beside it'],
    [1401, 500, 'the owner’s width under the row’s height: the theme’s pixel'],
    [2560, 500, 'a touch screen past the band scale’s cap: never capped'],
  ] as const)(
    'holds the model at a %i × %ipx window on a TOUCH screen (%s) — the theme’s pixel, the opener unscaled',
    async (w, h, what) => {
      await asOnATouchScreen(async () => {
        const scene = await renderAt(w, undefined, undefined, h);
        expect(scene.scrollbar, 'no scrollbar on a touch screen').toBe(0);
        expect(pixelOf(scene.rhythm), 'the opener unscaled').toBe(1);
        expectBand(
          scene,
          modelAt(w, 0, 'coarse', ROOT, h),
          `${w} × ${h} touch (${what})`,
        );
      });
    },
  );

  it.each([
    [320, 'the card the column’s: narrower than the band’s card at this root'],
    [390, 'a phone'],
    [599, 'the line’s widest on a mouse'],
  ] as const)(
    'holds the model at a %ipx window at a 20px root, on a fine pointer (%s)',
    async (w, what) => {
      const root = document.documentElement;
      root.style.fontSize = '20px';
      try {
        // A root font size set on <html> moves every rem a container query
        // and a length read — but not a MEDIA query's, which reads the
        // initial font size (the user's default, 16px in this runner), so
        // the row's query here still counts 37.5rem as 600px: the model,
        // which counts 750, and the engine agree only on a window under
        // both.
        const scene = await renderAt(w, undefined, undefined, 1000);
        expect(scene.flat).toBe(false);
        const model = modelAt(w, scene.scrollbar, 'fine', 20, 1000);
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

describe('BlogCarousel — THE FLAT ROW: bled to the screen, its summaries the tile sentence, its centre card highlighted', () => {
  it.each([
    // [window, height, what it samples]
    [600, 1000, 'the row’s narrowest window'],
    [768, 1024, 'a tablet held upright'],
    [1024, 768, 'a tablet held sideways'],
    [1138, 900, 'just under the scale’s step, behind the scrollbar'],
    [1140, 900, 'just past it: the row in the band’s pixel at 9/8'],
    [1180, 820, 'a sideways tablet’s window on a laptop'],
    [1280, 800, 'a laptop'],
    [1401, 1063, 'the owner’s reference window'],
    [1536, 864, 'past the reference'],
    [1920, 1080, 'a desktop'],
    [1940, 1080, 'just past the cap'],
    [2560, 1440, 'capped: the cards stop growing, the row widens'],
    [3000, 1200, 'capped'],
    // THE QUERY's pointer clause (2026-10-26): on a mouse the row at ANY
    // height — a laptop window a zoom made short keeps it, its text growing
    // with the zoom instead of falling to the line's.
    [1093, 506, 'a 1366 × 633 laptop at 125 %: under 32rem tall, the row'],
    [911, 422, 'the same laptop at 150 %'],
    [844, 390, 'a laptop window as short as a phone held sideways'],
    [1401, 500, 'the owner’s width, short: his window’s row'],
    [1920, 500, 'a desktop, short'],
  ] as const)(
    'holds the model at a %i × %ipx window on a fine pointer (%s)',
    async (w, h, what) => {
      const scene = await renderAt(w, undefined, undefined, h);
      expect(pointerNow(), 'the runner’s primary pointer').toBe('fine');
      expectRow(
        scene,
        modelAt(w, scene.scrollbar, 'fine', ROOT, h),
        `${w} × ${h} (${what})`,
      );
    },
  );

  it.each([
    [600, 960, 'a 7″ tablet held upright'],
    [768, 1024, 'a tablet held upright'],
    [1024, 768, 'a tablet held sideways'],
    [1180, 820, 'an iPad held sideways: one card live a side'],
    [1366, 1024, 'a 13″ iPad held sideways'],
    [2560, 1440, 'a touch screen wider than the band scale’s cap'],
  ] as const)(
    'holds the model at a %i × %ipx window on a TOUCH screen (%s) — the row’s theme pixel, the opener unscaled',
    async (w, h, what) => {
      await asOnATouchScreen(async () => {
        const scene = await renderAt(w, undefined, undefined, h);
        expect(scene.scrollbar, 'no scrollbar on a touch screen').toBe(0);
        expect(pixelOf(scene.rhythm), 'the opener unscaled').toBe(1);
        expectRow(
          scene,
          modelAt(w, 0, 'coarse', ROOT, h),
          `${w} × ${h} touch (${what})`,
        );
      });
    },
  );

  it.each([
    [800, 1000, 'the row from 37.5rem at this root (750px)'],
    [1100, 1000, 'under the step a 20px root moves to 1120px'],
    [1440, 1000, 'in the regime'],
    [1760, 1000, 'past the reference'],
    [2400, 1000, 'the 96rem cap, 1920px at this root'],
    [2560, 1000, 'capped'],
    // Under 32rem tall at either rem (512 or 640px): the pointer clause.
    [1440, 500, 'in the regime, short'],
    [2560, 500, 'capped, short'],
  ] as const)(
    'holds the model at a %i × %ipx window at a 20px root (%s)',
    async (w, h, what) => {
      const root = document.documentElement;
      root.style.fontSize = '20px';
      try {
        const scene = await renderAt(w, undefined, undefined, h);
        const model = modelAt(w, scene.scrollbar, 'fine', 20, h);
        const where = `${w} × ${h}px at a 20px root (${what})`;
        expect(scene.flat, where).toBe(true);
        expect(
          Math.abs(box(scene.carousel).width - model.carousel),
          `${where}: the carousel`,
        ).toBeLessThanOrEqual(1 / 32);
        expect(
          Math.abs(pixelOf(scene.own) - model.pixel),
          `${where}: the pixel`,
        ).toBeLessThanOrEqual(1e-4);
        expect(
          Math.abs(layout(scene.centre, 'width') - model.card),
          `${where}: the card`,
        ).toBeLessThanOrEqual(1 / 32);
        const words = wordsOf(scene.centre);
        expect(
          Math.abs(
            px(words.summary, 'font-size') -
              px(scene.tileSentence, 'font-size'),
          ),
          `${where}: the summary the tile sentence’s size`,
        ).toBeLessThanOrEqual(0.01);
        expect(
          scene.slides.filter((slide) => !slide.hasAttribute('inert')),
          `${where}: the live cards`,
        ).toHaveLength(model.live);
        expectNoSidewaysScroll(where);
      } finally {
        root.style.fontSize = '';
      }
    },
  );

  it('jumps WITH the tile sentence at the band scale’s step — a window a pixel under it the row’s theme pixel, a pixel over it the column’s (1138 and 1140 behind a 15px scrollbar): the card 347.33 → 316.91px, the summary 16 → 14.6, exactly as the numbers band’s text does (THE TEXT RULE’s consequence)', async () => {
    const at = async (w: number) => {
      const scene = await renderAt(w, undefined, undefined, 900);
      const out = {
        card: layout(scene.centre, 'width'),
        summary: px(wordsOf(scene.centre).summary, 'font-size'),
        tile: px(scene.tileSentence, 'font-size'),
        scaled: pixelOf(scene.rhythm) !== ROOT / 16,
        scrollbar: scene.scrollbar,
      };
      cleanup();
      return out;
    };
    // THE STEP'S WINDOW, from the scrollbar this runner draws: the first
    // whole window whose column reaches the regime's step — (896 + bar) ÷
    // 0.8 under ui/Container's 10vw gutters — read off the model, never
    // assumed (a classic 15px bar puts it at 1139, overlay scrollbars at
    // 1120); then a window a pixel either side of it.
    const { scrollbar } = await at(1200);
    let step = 1000;
    while (!modelAt(step, scrollbar, 'fine', ROOT, 900).scaled) step += 1;
    expect(step, 'the step’s window').toBeLessThan(1200);
    const [below, above] = [step - 1, step + 1];
    expect(
      modelAt(below, scrollbar, 'fine', ROOT, 900).scaled,
      `${below}: under the step, behind a ${scrollbar}px scrollbar`,
    ).toBe(false);
    expect(
      modelAt(above, scrollbar, 'fine', ROOT, 900).scaled,
      `${above}: past it`,
    ).toBe(true);
    const under = await at(below);
    const over = await at(above);
    // The premises, named: the engine draws the regime exactly where the
    // model puts it, behind the same scrollbar.
    expect([under.scrollbar, over.scrollbar], 'one scrollbar').toEqual([
      scrollbar,
      scrollbar,
    ]);
    expect([under.scaled, over.scaled], 'the regime’s side').toEqual([
      false,
      true,
    ]);
    expect(under.summary).toBeCloseTo(under.tile, 2);
    expect(over.summary).toBeCloseTo(over.tile, 2);
    expect(
      Math.abs(under.card - CARD_DESIGN / SHARE),
      'the row’s theme pixel: the blog list’s own card',
    ).toBeLessThanOrEqual(1 / 32);
    expect(over.card).toBeLessThan(under.card);
    expect(over.summary).toBeLessThan(under.summary);
  });
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
 *  the owner's window, in this runner's theme pixel, or with every theme
 *  length in a design pixel of `pixel` px — set INLINE, never by a class (the
 *  census's rule for a test), with globals.css's design scale beside it; and,
 *  when `clamped`, `clampable` with the row's four variables set inline round
 *  it, as THE CLAMP IN THE ROW sets them round the band's cards. */
async function listTallest(
  props: BlogCarouselProps,
  pixel?: number,
  clamped = false,
): Promise<number> {
  let tallest = 0;
  for (const post of props.posts) {
    const { container, unmount } = render(
      <div
        className={pixel === undefined ? undefined : 'design-scale'}
        style={
          {
            width: `${(CARD_DESIGN / SHARE) * (pixel ?? 1)}px`,
            ...(pixel === undefined ? {} : { ['--scale-px']: `${pixel}px` }),
            ...(clamped ? CLAMP_INLINE : {}),
          } as CSSProperties
        }
      >
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
          clampable={clamped}
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
    '%s at the owner’s width: the ring the TALLEST card’s height — on the line (a touch screen under the row’s height) the list’s tallest card’s share, within a line; in the row the list’s tallest card clamped alike, and whole with the clamp lifted',
    async (locale, messages) => {
      const props = propsFor(locale, messages);
      const ringOf = async (h: number) => {
        const { slides, own, rowBox, flat } = await renderAt(
          1401,
          props,
          locale,
          h,
        );
        const ringNow = (): number => layout(slides[0], 'height');
        const ring = ringNow();
        for (const slide of slides) {
          expect(Math.abs(layout(slide, 'height') - ring)).toBeLessThanOrEqual(
            0.01,
          );
        }
        // The ring IS the tallest natural card. In the row THE CLAMP IN THE
        // ROW leaves every card two lines of each title and summary, so today
        // the twelve stand one height by themselves (MEASURED, every language)
        // and the stretch is their belt: its own work is read with the clamp
        // lifted — on the line, where there is nothing to lift, on the cards
        // as they are.
        const natural = naturalHeights(slides);
        expect(Math.abs(Math.max(...natural) - ring)).toBeLessThanOrEqual(0.01);
        liftClamp(rowBox, true);
        const whole = ringNow();
        const wholeNatural = naturalHeights(slides);
        const summaryLine = parseFloat(
          getComputedStyle(wordsOf(slides[0]).summary).lineHeight,
        );
        liftClamp(rowBox, false);
        // The whole cards were not all one height to begin with — the
        // stretch did the work.
        expect(Math.abs(Math.max(...wholeNatural) - whole)).toBeLessThanOrEqual(
          0.01,
        );
        expect(Math.min(...wholeNatural)).toBeLessThan(whole - 1);
        const pixel = pixelOf(own);
        cleanup();
        return { ring, whole, summaryLine, pixel, flat };
      };
      // The line at the owner's width is a TOUCH screen's alone now — under
      // the row's height; a mouse keeps the row at any height (THE QUERY).
      const line = await asOnATouchScreen(() => ringOf(500));
      const row = await ringOf(1063);
      expect([line.flat, row.flat]).toEqual([false, true]);
      // THE LINE: nothing to lift — the clamp is the row's alone.
      expect(
        Math.abs(line.whole - line.ring),
        `${locale}: the line unclamped`,
      ).toBeLessThanOrEqual(0.01);
      // THE ROW: a miniature in a pixel P IS its full card drawn in its card
      // pixel, share × P — every theme length the same, and the frame, the
      // ring and the picture's 2px the same CSS px in both (PostCard's THE
      // MINIATURE: the residuals are the share against the theme's pixel,
      // never against its own), and the clamp's room in the face's ems — so
      // the row's tallest card is the blog list's own tallest card in that
      // pixel, clamped as the row clamps it, to the layout's rounding, its
      // lines the same lines; and with the clamp lifted, the list's whole
      // card. MEASURED on this Mac at 1401 × 1063: 559.83 in every language,
      // where the whole cards stood ro 681.33, en 681.33, de 721.83, fr
      // 735.33, it 681.33 (17.8, 17.8, 22.4, 23.9, 17.8 % shorter).
      document.documentElement.setAttribute('lang', locale);
      const listClamped = await listTallest(props, SHARE * row.pixel, true);
      expect(
        Math.abs(row.ring - listClamped),
        `${locale}: the row's ring ${row.ring} against the list's clamped ${listClamped}`,
      ).toBeLessThanOrEqual(0.5);
      document.documentElement.setAttribute('lang', locale);
      const listInRow = await listTallest(props, SHARE * row.pixel);
      expect(
        Math.abs(row.whole - listInRow),
        `${locale}: the row's whole ring ${row.whole} against the list's ${listInRow}`,
      ).toBeLessThanOrEqual(0.5);
      // THE CLAMP'S WORK: every summary runs four lines or more whole in the
      // row (MEASURED: four to eight) and keeps two, so the ring is at least
      // two summary lines under the whole ring — a bound no engine's line
      // breaks can move short of a summary of three lines.
      expect(
        row.ring,
        `${locale}: the ring ${row.ring} against the whole ${row.whole}`,
      ).toBeLessThanOrEqual(row.whole - 2 * row.summaryLine + 0.01);
      // THE LINE, against the list's own tallest card: the share of it less
      // the frames' px (PostCard's THE MINIATURE: 2 × (1 − share)px), within
      // one line of the miniature's title — the list card's 36px title line
      // at the share — because the optical size gives a miniature a line more
      // at times, and CI's Linux may break one line otherwise. MEASURED on
      // this Mac: ro 392.88, en 408.48 (a summary line more), de 439.70, fr
      // 424.09, it 408.48.
      document.documentElement.setAttribute('lang', locale);
      const list = await listTallest(props);
      const share = SHARE * list - 2 * (1 - SHARE);
      expect(
        Math.abs(line.ring - share),
        `${locale}: the ring ${line.ring} against the list's ${list}`,
      ).toBeLessThanOrEqual(SHARE * 36);
    },
  );
});

describe('BlogCarousel — THE CLAMP IN THE ROW', () => {
  /** The row's windows the owner looks at: a tablet held upright, a laptop,
   *  his own window and a desktop — and, on a mouse, his width at a short
   *  window (THE QUERY's pointer clause) — every language at each. */
  const ROW_WINDOWS = [
    [768, 1024],
    [1280, 800],
    [1401, 1063],
    [1920, 1080],
    [1401, 500],
  ] as const;

  it.each(
    LANGUAGES.flatMap(([locale, messages]) =>
      ROW_WINDOWS.map(([w, h]) => [locale, w, h, messages] as const),
    ),
  )(
    '%s at a %i × %ipx window: at most two lines of each title and summary, the text whole, every summary cut („…”), the summary the tile sentence, the tallest card two summary lines shorter at least',
    async (locale, w, h, messages) => {
      const props = propsFor(locale, messages);
      const { slides, rowBox, tileSentence, flat } = await renderAt(
        w,
        props,
        locale,
        h,
      );
      const where = `${locale} at ${w} × ${h}`;
      expect(flat, `${where}: the row`).toBe(true);
      const cards = slides.map((slide) => wordsOf(slide));
      expect(cards).toHaveLength(props.posts.length);
      // THE CLAMP, SET — on every title and summary the engine's line clamp
      // at the row's lines and the clip past them; never more lines than
      // that; and THE TEXT STAYS WHOLE in the DOM (the card's name, a screen
      // reader's reading).
      const shown = cards.map(({ title, summary }, index) => {
        const post = props.posts[index];
        if (post === undefined) throw new Error(`${where}: no post ${index}`);
        for (const [element, lines, text, name] of [
          [title, TITLE_LINES, post.title, 'the title'],
          [summary, SUMMARY_LINES, post.summary, 'the summary'],
        ] as const) {
          const style = getComputedStyle(element);
          const at = `${where}, card ${index + 1}: ${name}`;
          expect(style.getPropertyValue('-webkit-line-clamp'), at).toBe(
            String(lines),
          );
          expect(style.overflow, at).toBe(CLAMP_CLIP);
          // THE CLIP, NOT A SCROLLER: no scroll container, so nothing — a
          // find-in-page, a screen reader's caret, a script — scrolls the
          // hidden lines into the box (under `hidden` this moved it).
          element.scrollTop = element.scrollHeight;
          expect(element.scrollTop, `${at}: never scrolled`).toBe(0);
          expect(linesOf(element), `${at}’s lines`).toBeLessThanOrEqual(
            lines + 0.01,
          );
          expect(element.textContent, `${at}, whole`).toBe(text);
        }
        return { title: linesOf(title), summary: linesOf(summary) };
      });
      // THE TEXT RULE still holds: every summary the tile sentence's size.
      for (const { summary } of cards) {
        expect(
          Math.abs(px(summary, 'font-size') - px(tileSentence, 'font-size')),
          `${where}: the summary the tile sentence’s size`,
        ).toBeLessThanOrEqual(0.01);
      }
      const ring = layout(slides[0], 'height');
      // BEFORE THE CLAMP, in the very same layout: the row's variables
      // lifted inline (the header's COUNTED IN LINES).
      liftClamp(rowBox, true);
      try {
        const whole = layout(slides[0], 'height');
        const summaryLine = parseFloat(
          getComputedStyle(cards[0].summary).lineHeight,
        );
        for (const [index, { title, summary }] of cards.entries()) {
          const at = `${where}, card ${index + 1}`;
          // Every summary longer than its two lines — so every one ends,
          // clamped, in the engine's „…" (PostCard's WHAT A SET CLAMP DOES):
          // MEASURED, four to eight lines whole.
          expect(linesOf(summary), `${at}: a summary cut`).toBeGreaterThan(
            SUMMARY_LINES + 0.5,
          );
          // Every summary shows its two lines, and a title its whole lines up
          // to two — never fewer.
          expect(Math.round(shown[index].summary), at).toBe(SUMMARY_LINES);
          expect(
            Math.round(shown[index].title),
            `${at}: the title’s lines shown`,
          ).toBe(Math.min(Math.round(linesOf(title)), TITLE_LINES));
        }
        // The tallest card: at least two summary lines shorter than the
        // whole card (ONE HEIGHT's bound). MEASURED on this Mac — the
        // clamped ring against the whole one: 497.44 against 605.44 (ro,
        // en), 641.44 (de), 653.44 (fr), 629.44 (it) on a tablet; 510.67
        // against 621.5 to 670.75 at 1280; 559.83 against 681.33 (ro, en,
        // it), 721.83 (de), 735.33 (fr) at the owner's window; 770.8 against
        // 937.86 to 993.55 at 1920 — 17.8 to 23.9 % shorter.
        expect(
          ring,
          `${where}: the ring ${ring} against the whole ${whole}`,
        ).toBeLessThanOrEqual(whole - 2 * summaryLine + 0.01);
      } finally {
        liftClamp(rowBox, false);
      }
      // …and back: the ring the clamped one again.
      expect(
        Math.abs(layout(slides[0], 'height') - ring),
        `${where}: the clamp put back`,
      ).toBeLessThanOrEqual(0.01);
    },
  );

  it.each(
    LANGUAGES.flatMap(([locale, messages]) =>
      (
        [
          [390, 844, 'fine'],
          [844, 390, 'coarse'],
          [1401, 500, 'coarse'],
        ] as const
      ).map(([w, h, pointer]) => [locale, w, h, pointer, messages] as const),
    ),
  )(
    '%s at a %i × %ipx window on a %s pointer, on THE LINE: no card clamped — every title and summary today’s block, no clip, no clamp, no room, no variable set — and lifting the clamp moves nothing',
    async (locale, w, h, pointer, messages) =>
      onPointer(pointer, async () => {
        const props = propsFor(locale, messages);
        const { slides, rowBox, flat } = await renderAt(w, props, locale, h);
        const where = `${locale} at ${w} × ${h} (${pointer})`;
        expect(flat, `${where}: the line`).toBe(false);
        for (const [index, slide] of slides.entries()) {
          const { title, summary } = wordsOf(slide);
          for (const [element, name] of [
            [title, 'the title'],
            [summary, 'the summary'],
          ] as const) {
            const style = getComputedStyle(element);
            const at = `${where}, card ${index + 1}: ${name}`;
            expect(
              {
                display: style.display,
                overflow: style.overflow,
                clamp: style.getPropertyValue('-webkit-line-clamp'),
                padding: style.padding,
                margin: style.margin,
              },
              at,
            ).toEqual({
              display: 'block',
              overflow: 'visible',
              clamp: 'none',
              padding: '0px',
              margin: '0px',
            });
            for (const variable of CLAMP_NAMES) {
              expect(
                style.getPropertyValue(variable),
                `${at}, ${variable}`,
              ).toBe('');
            }
          }
        }
        // EVERY NUMBER OF THE LINE UNCHANGED: the ring and every card's own
        // height the same with the clamp lifted — there is nothing to lift.
        const ring = layout(slides[0], 'height');
        const natural = naturalHeights(slides);
        liftClamp(rowBox, true);
        try {
          expect(
            Math.abs(layout(slides[0], 'height') - ring),
            `${where}: the ring`,
          ).toBeLessThanOrEqual(0.01);
          expect(naturalHeights(slides), `${where}: every card`).toEqual(
            natural,
          );
        } finally {
          liftClamp(rowBox, false);
        }
      }),
  );
});

describe('BlogCarousel — SC 1.4.12, the four text-spacing overrides', () => {
  it.each(
    LANGUAGES.flatMap(([locale, messages]) =>
      (
        [
          [390, 844, 'fine'],
          // The owner's width under the row's height: the line on a touch
          // screen, the row on a mouse (THE QUERY's pointer clause).
          [1401, 500, 'coarse'],
          [1401, 500, 'fine'],
          [768, 1024, 'fine'],
          [1401, 1063, 'fine'],
        ] as const
      ).map(([w, h, pointer]) => [locale, w, h, pointer, messages] as const),
    ),
  )(
    '%s at a %i × %ipx window on a %s pointer: every card grows with the others, no text leaves its card, the progress dots stay clear of the cards — and in the row the clamp still shows two lines of each',
    async (locale, w, h, pointer, messages) =>
      onPointer(pointer, async () => {
        const props = propsFor(locale, messages);
        const before = layout(
          (await renderAt(w, props, locale, h)).slides[0],
          'height',
        );
        cleanup();
        const spacing = document.createElement('style');
        spacing.textContent = TEXT_SPACING_CSS;
        document.head.append(spacing);
        try {
          const { slides, centre, carousel, flat } = await renderAt(
            w,
            props,
            locale,
            h,
          );
          const ring = layout(slides[0], 'height');
          expect(ring, 'the cards grew').toBeGreaterThan(before);
          for (const slide of slides) {
            expect(
              Math.abs(layout(slide, 'height') - ring),
            ).toBeLessThanOrEqual(0.01);
            // THE CLAMP IN THE ROW holds under the overrides: two lines of
            // each title and summary, each line 1.5 of its size now.
            if (flat) {
              const { title, summary } = wordsOf(slide);
              expect(linesOf(title), 'the title’s lines').toBeLessThanOrEqual(
                TITLE_LINES + 0.01,
              );
              expect(
                linesOf(summary),
                'the summary’s lines',
              ).toBeLessThanOrEqual(SUMMARY_LINES + 0.01);
            }
            const article = slide.querySelector('article');
            const card = article?.firstElementChild;
            if (
              !(article instanceof HTMLElement) ||
              !(card instanceof HTMLElement)
            ) {
              throw new Error('a card is missing');
            }
            // Nothing spills out of the card's box, down or sideways.
            expect(card.scrollHeight).toBeLessThanOrEqual(
              card.clientHeight + 1,
            );
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
          expectNoSidewaysScroll(`${locale} at ${w} × ${h} (${pointer})`);
        } finally {
          spacing.remove();
        }
      }),
  );
});

describe('BlogCarousel — THE LIFT, on this band’s card boxes', () => {
  /** A card box grown to its hover's end — the centre card's to 105 %, and
   *  in the row a live side card's to the centre card's own size
   *  (CardCarousel's THE HOVER: the box grows, the card inside never) —
   *  painted whole inside the box the stage's mask clips at (CardCarousel's
   *  THE LIFT), and in the row a grown side card still clear of the arrows'
   *  strips (its THE REACH). */
  async function expectLiftWhole(
    w: number,
    h: number,
    locale: Locale,
    messages: typeof ro,
  ): Promise<void> {
    const scene = await renderAt(w, propsFor(locale, messages), locale, h);
    const { stage, centre, slides, flat } = scene;
    const grown: [HTMLElement, number][] = [[centre, 1.05]];
    if (flat) {
      const side = slides.find(
        (slide) => slide !== centre && !slide.hasAttribute('inert'),
      );
      if (side !== undefined) {
        const scale = Number(side.style.getPropertyValue('--fsc'));
        grown.push([side, 1 / scale]);
      }
    }
    try {
      for (const [slide, scale] of grown) slide.style.scale = String(scale);
      const edges = box(stage);
      const [previous, next] = within(scene.carousel)
        .getAllByRole('button')
        .slice(0, 2);
      for (const [slide] of grown) {
        const drawn = box(slide);
        const where = `${locale} at ${w} × ${h}`;
        expect(
          drawn.top,
          `${where}: a grown card’s top`,
        ).toBeGreaterThanOrEqual(edges.top);
        expect(drawn.bottom).toBeLessThanOrEqual(edges.bottom);
        if (flat) {
          expect(
            drawn.left,
            `${where}: clear of the arrows`,
          ).toBeGreaterThanOrEqual(box(previous).right - 0.01);
          expect(drawn.right).toBeLessThanOrEqual(box(next).left + 0.01);
        }
      }
      // A live side card grown to the centre card's own size.
      if (grown.length > 1) {
        const [, side] = grown;
        if (side !== undefined) {
          expect(
            Math.abs(box(side[0]).width - layout(centre, 'width')),
          ).toBeLessThanOrEqual(0.05);
        }
      }
    } finally {
      for (const [slide] of grown) slide.style.scale = '';
    }
  }

  // Only a fine pointer grows a box (`hover:` answers `(hover: hover)`), so
  // the line is sampled where a mouse meets it — under 37.5rem — and the row
  // at full height and short (THE QUERY's pointer clause).
  it.each([
    [390, 844],
    [599, 1000],
    [1401, 500],
    [1401, 1063],
    [1920, 1080],
  ] as const)(
    'paints the hovered card whole at a %i × %ipx window, in every language',
    async (w, h) => {
      for (const [locale, messages] of LANGUAGES) {
        await expectLiftWhole(w, h, locale, messages);
        cleanup();
      }
    },
  );

  it.each([
    [390, 844],
    [1401, 1063],
  ] as const)(
    'paints it whole under SC 1.4.12’s overrides too, at a %i × %ipx window — cards up to 2.63 times as tall as wide',
    async (w, h) => {
      const spacing = document.createElement('style');
      spacing.textContent = TEXT_SPACING_CSS;
      document.head.append(spacing);
      try {
        for (const [locale, messages] of LANGUAGES) {
          await expectLiftWhole(w, h, locale, messages);
          cleanup();
        }
      } finally {
        spacing.remove();
      }
    },
  );
});

describe('BlogCarousel — THE TEXT, with the carousel’s pixel', () => {
  /** The centre card's five words' sizes and the carousel's pixel. */
  const sizesAt = async (w: number, h: number) => {
    const { centre, own } = await renderAt(w, undefined, undefined, h);
    const { title, author, summary, reading, readMore } = wordsOf(centre);
    const out = {
      pixel: pixelOf(own),
      sizes: [title, author, summary, reading, readMore].map((element) =>
        px(element, 'font-size'),
      ),
    };
    cleanup();
    return out;
  };

  it('on THE LINE sets every word of the centre card at ONE size wherever it stands — a phone on a mouse, and on a touch screen the owner’s width and a desktop’s under the row’s height — the theme’s miniature: the line never meets the band scale since the query’s pointer clause (THE CAROUSEL’S OWN PIXEL)', async () => {
    const phone = await sizesAt(390, 844);
    const widest = await sizesAt(599, 1000);
    const [owner, desktop] = await asOnATouchScreen(async () => [
      await sizesAt(1401, 500),
      await sizesAt(1920, 500),
    ]);
    for (const reading of [phone, widest, owner, desktop]) {
      expect(reading.pixel, 'the theme’s pixel').toBe(ROOT / 16);
      expect(reading.sizes).toEqual(phone.sizes);
    }
    // The miniature's sizes at the theme's pixel (PostCard's THE MINIATURE):
    // the title 19.5px, the author 9.1, the summary and the reading time
    // 10.4, the read-more 11.7.
    expect(phone.sizes.map((size) => Math.round(size * 100) / 100)).toEqual(
      MINIATURE_SIZES.slice(0, 5),
    );
  });

  it('in THE FLAT ROW sets every word at the miniature’s size × the row’s pixel — the summary 16px wherever the band scale does not hold, 18 design pixels wherever it does — one ratio between the words at every width', async () => {
    const tablet = await sizesAt(768, 1024);
    const owner = await sizesAt(1401, 1063);
    const desktop = await sizesAt(1920, 1080);
    expect(tablet.sizes.map((size) => Math.round(size * 100) / 100)).toEqual([
      30, 14, 16, 16, 18,
    ]);
    for (const reading of [tablet, owner, desktop]) {
      for (const [index, size] of reading.sizes.entries()) {
        expect(size / (MINIATURE_SIZES[index] ?? NaN)).toBeCloseTo(
          reading.pixel,
          3,
        );
      }
    }
    expect(owner.sizes[2]).toBeCloseTo(18 * (1105.81 / 1106), 1);
  });
});

describe('BlogCarousel — THE `sizes`, DERIVED', () => {
  /** The band's picture hint, read off its first picture. */
  const shippedHint = (carousel: HTMLElement): string => {
    const hint = carousel.querySelector('img')?.getAttribute('sizes');
    if (!hint) throw new Error('a card carries no `sizes`');
    return hint;
  };

  it('never hints a picture narrower than the one drawn at any window from 280 to 3840px — both pointers, a classic scrollbar and none, a 16px root and a 20px one, heights above and below the row’s — and as tight as whole numbers allow', async () => {
    const { carousel } = await renderAt(1401);
    const hint = shippedHint(carousel);
    expect(hint).toBe(
      '(min-width: 117.5rem) and (pointer: fine) 34rem, ' +
        '(min-width: 74rem) and (pointer: fine) 29vw, ' +
        '(min-width: 37.5rem) and (pointer: fine) 21.5rem, ' +
        '(min-width: 37.5rem) and (min-height: 32rem) 21.5rem, 14rem',
    );
    const failures: string[] = [];
    const worst = new Map<string, number>();
    // The line never inside the band scale's regime (THE CAROUSEL'S OWN
    // PIXEL — the reason THE FLOOR left).
    const lineScaled: string[] = [];
    for (const pointer of ['fine', 'coarse'] as const) {
      for (const scrollbar of [0, 15]) {
        for (const root of [16, 20]) {
          for (const h of [400, 600, 1000]) {
            for (let w = 280; w <= 3840; w += 2) {
              const model = modelAt(w, scrollbar, pointer, root, h);
              const slot = slotAt(hint, w, pointer, root, h);
              const key = `${model.flat ? 'row' : 'line'} ${pointer} ${root}px ${model.clamped ? 'clamped' : 'whole'}`;
              worst.set(
                key,
                Math.max(worst.get(key) ?? 1, slot / model.picture),
              );
              if (!model.flat && model.scaled) {
                lineScaled.push(`${pointer}, ${root}px, ${w} × ${h}`);
              }
              if (slot < model.picture - 0.01) {
                failures.push(
                  `${pointer}, scrollbar ${scrollbar}, root ${root}, ${w} × ${h}: picture ${model.picture.toFixed(2)}, hint ${slot.toFixed(2)}`,
                );
              }
            }
          }
        }
      }
    }
    expect(failures).toEqual([]);
    expect(lineScaled, 'the line inside the regime').toEqual([]);
    // The bounds, MEASURED, each presentation and root on its own (the
    // band's THE `sizes`, DERIVED, quotes them). THE LINE, at the theme's
    // pixel wherever it stands, on either pointer: a whole card at most 1.019
    // at a 16px root — 14rem over its 219.77px picture — and 1.014 at a 20px
    // one — 14rem over 276.21 (the 1.084 and 1.075 of a mouse's 17vw went
    // with the short laptop windows it served, the row's since the query's
    // pointer clause); a card clamped to a column narrower than it (a 20px
    // root under a ≈ 322px window) 1.279, where 14rem holds while the picture
    // shrinks with the column. THE ROW: on a fine pointer 1.108 at a 16px
    // root — 21.5rem over the 310.6px picture of a 1120px window, the
    // regime's first, where 29vw cannot yet serve an engine without it — and
    // 1.104 at a 20px one (430px over the 389.7px picture of a 1400px
    // window); on a touch screen 1.008 and 1.005, the theme pixel's picture
    // against its 21.5rem.
    expect(worst.get('line fine 16px whole')).toBeLessThanOrEqual(1.02);
    expect(worst.get('line fine 20px whole')).toBeLessThanOrEqual(1.014);
    expect(worst.get('line coarse 16px whole')).toBeLessThanOrEqual(1.02);
    expect(worst.get('line coarse 20px whole')).toBeLessThanOrEqual(1.014);
    expect(worst.get('line fine 20px clamped')).toBeLessThanOrEqual(1.28);
    expect(worst.get('line coarse 20px clamped')).toBeLessThanOrEqual(1.28);
    expect(worst.get('row fine 16px whole')).toBeLessThanOrEqual(1.108);
    expect(worst.get('row fine 20px whole')).toBeLessThanOrEqual(1.104);
    expect(worst.get('row coarse 16px whole')).toBeLessThanOrEqual(1.008);
    expect(worst.get('row coarse 20px whole')).toBeLessThanOrEqual(1.005);
    // The row never clamps its card: the screen is always wider.
    expect(worst.has('row fine 16px clamped')).toBe(false);
    expect(worst.has('row fine 20px clamped')).toBe(false);
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
