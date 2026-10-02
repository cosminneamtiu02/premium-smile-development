import {
  prefersReducedMotion,
  watchReducedMotion,
} from '../reduced-motion/reduced-motion.ts';
import {
  buildCard,
  penetration,
  UNIT_PX,
  type CardModel,
  type Vec3,
} from '../ribbon-model/ribbon-model.ts';
import {
  KEEPOUT,
  measureColumn,
  placeColumn,
  STATION,
  type PlacedCard,
} from '../ribbon-layout/ribbon-layout.ts';
import {
  buildStrip,
  outlineStretch,
  paintShadow,
  paintStretch,
  type Rgb,
  type Stretch,
  type StripSample,
} from '../ribbon-paint/ribbon-paint.ts';

// lib/ribbon-draw — WHEN THE RIBBON IS DRAWN, React-free: the owner's rule
// for the moment a card's stretch starts, the queue, the pen that draws it,
// reduced motion, a new geometry, and the guard that paints nothing at all
// rather than a ribbon over a doctor's words. It owns the canvases — one per
// card — and nothing else of the page: it measures through
// lib/ribbon-layout, builds through lib/ribbon-model, paints through
// lib/ribbon-paint (CLAUDE.md §4's foundation ring, fence-tested by
// tests/unit/lib-react-free.test.ts; the floss-ribbon run, §15.26). ui/Ribbon
// is the one consumer.
//
// ── ONE CALL STARTS IT, ONE FUNCTION STOPS IT. startRibbonDraw(layer) is the
// first browser touch and the whole start: it measures, paints what is due
// and listens. The `dispose` it returns removes every listener, the
// observer, a pending frame and the canvases; a second call does nothing.
// This is NOT the construct → start() → dispose() shape of the ring's stores
// (lib/scroll-spy's, lib/sticky-rail's): those are built during render, in a
// useState initializer, and React renders from them through
// useSyncExternalStore, so their construction must stay pure and apart from
// their first touch. Nothing here is built before the effect and nothing
// renders from it — ui/Ribbon calls this inside its effect and hands
// `dispose` back as the cleanup — so there is no construction to keep apart,
// no restart, and no subscribe; getSnapshot() serves the tests.
//
// ── A DECORATION NEVER TAKES THE PAGE DOWN. Every entry from the browser —
// the start itself, each frame, the observer's report, the scroll and resize
// listeners, the reduced-motion listener — runs through ONE wrapper,
// `safely`: a throw disposes everything (the ribbon disappears, the page
// stays) and goes to the global reportError(), where the console and any
// error reporting see it — or to console.error in a browser that has no
// reportError (Safari before 15.4, Chrome before 95, Firefox before 93).
// Those browsers are outside the stylesheet's own baseline, but the page is
// still readable there, and keeping it so is the guard's whole job: a report
// that threw would carry the error into React after all. So
// startRibbonDraw() never throws. A column that cannot carry a ribbon is not
// a throw: the model and the layout say so with a RangeError — a card too
// small for its gauge, a station holding no card — and that becomes THE
// GUARD's refusal. Only a RangeError does, so a programming error is never
// reported as "this card is too small".
//
// ── THE OWNER'S RULE, in the owner's words (fb-507): "if you reach like with
// scrolling the fixxed center line of the screen the center line of the card
// drawn on the y axis, so horizontally from left to right, then it fires this
// animation"; (fb-502) "drawn while scrolling but remains drawn"; and, on
// 2026-10-01, THE LINE MOVED DOWN: "move lower the start animation for
// generating the ribbon, a little lower, because it starts generating it on
// some screens just after you are past it, so idk, move it at the 25% of the
// bottom of the screen, not at the half of the screen". As code, a card is
// DUE when
//     cardTop ≤ max((1 − LINE) × innerHeight − cardHeight / 2, LINE × innerHeight)
//     or the page is scrolled to its end (within END_PX)
// with cardTop in viewport px and LINE = 0.25: the line sits a quarter of
// the screen above its bottom edge, and a card is due when its centre line
// reaches it. The `max` is the first addition the owner agreed to (fb-509),
// re-derived for the lower line: for a card TALLER THAN THE SCREEN the centre
// lines would meet with its top — where the ribbon's first stroke is — less
// than LINE of the screen under the screen's top, or above it, so its line is
// its top reaching LINE under the screen's top. ONE NUMBER FOR BOTH HALVES,
// on purpose: a card exactly as tall as the screen is due at the same scroll
// by either, so the rule hands over from the centre to the top without a
// jump. (With the line at the screen's centre the floor was a second number,
// 12 %, binding from three quarters of the screen's height — and on a phone
// it put a card's top under the header pill, which reaches 112px down: the
// same "after you are past it".) The second addition is the end of the page:
// there EVERY waiting card becomes due, in order — a last card whose centre
// cannot reach the line is drawn when the page stops. lib/scroll-spy's bottom
// rule allows 1px and applies only to a page that can scroll; this one allows
// 2px and asks nothing more, ON PURPOSE: on a page that cannot scroll no card
// can ever reach its line, so every card is due at load. Once every card is
// drawn, a scroll reads nothing at all.
//
// ── THE LINE IS A SHARE OF THE WHOLE SCREEN, ON PURPOSE. Its neighbour,
// lib/reading-line (the price list's lane), puts ITS line in the middle of
// the CLEAR part of the window, under the header pill, and moves where a
// jump lands. This rule is the owner's own sentence and, since 2026-10-01,
// the owner's own number — until that day the line was the screen's centre,
// the prototype's `innerHeight / 2` — and it is a ONE-WAY latch: due once,
// drawn for good, which a reading line is not. Neither module borrows from
// the other; §15.26 records moving this line to the clear part's centre as a
// WAIT trigger, on the owner's word only — the move of 2026-10-01 was to a
// share of the screen, not to the clear part.
//
// ── IN ORDER, ONE AT A TIME. The ribbon is one ribbon: the walk stops at the
// first card that is not due. A due card is queued, and one card is drawn at
// a time. Two behaviours came with the prototype the owner approved and are
// kept as it had them: HURRY — a card is drawn over DRAW_MS / (1 + HURRY ×
// waiting), so 1.3 s alone, 0.81 s with one card waiting and 0.59 s with two,
// and a visitor who scrolls fast is not kept waiting for a ribbon they have
// scrolled past — and the AT-START rule (below). DRAW_MS was 2 000 until
// 2026-10-01, the prototype's own pace; the owner asked for the drawing
// "twice as fast", then, shown 1 s, for "30% slower" — 1 300, that one
// constant (§15.26 round 3); the hurry and the rule are as they were.
//
// ── SC 2.2.2, COUNTED. A stretch lasts at most DRAW_MS and never repeats,
// but cards drawn one after another are one movement: n cards due at once
// draw for DRAW_MS × Σ 1 / (1 + HURRY × j), j = 0 … n − 1 — 2.11 s for two,
// 3.17 s for four, 3.88 s for the clinic's SIX (a visitor who jumps to the
// page's end with every card still waiting), and the five seconds after
// which WCAG asks for a way to stop a movement are reached at ELEVEN cards
// due at once (ten draw for 4.83 s). At the 2 s pace six drew for 5.96 s,
// and §15.26's WAIT trigger for a bound by construction had FIRED with the
// six-doctor roster; this pace discharges it by arithmetic, and a column of
// eleven doctors re-arms it. ribbon-draw.test.ts pins six under 5 000 ms.
//
// ── THE PEN. Progress is e(t) = ½ − ½ cos(π (0.12 + 0.76 t)), normalised to
// run 0 → 1 — a gentle start and stop, a steady pen between. It is kept as a
// SHARE of the stretch, so it survives a new geometry. A frame ends on a
// WHOLE sample of the strip: drawing piece by piece then paints the very
// shapes painting at once does (the prototype measured 155 differing pixels
// before this and 0 after; ribbon-paint.test.ts pins it).
//
// ── AT START a card already wholly above the screen is simply there — there
// is nothing to watch; the others follow the rule. "At start" lasts until
// the first build that passes THE GUARD has been walked, so a column refused
// at mount keeps the rule for the build that finally paints it. DRAWN IS FOR
// GOOD: scrolling up undoes nothing, nothing is ever pinned, and the page's
// scroll is never touched (tests/unit/ribbon-never-moves-the-page.test.ts).
//
// ── REDUCED MOTION (lib/reduced-motion, read at start and watched): the whole
// ribbon is painted at once. One function finishes everything unfinished in
// the column's order — the stretch being drawn, the queue, every waiting
// card — and runs when the preference switches on mid-visit AND at the end
// of every build that passes THE GUARD while it is on: a column that was
// refused when the switch came is finished once it paints, never animated.
// Switching it off starts nothing: what is drawn stays drawn, and the rest
// follows the rule again.
//
// ── A NEW GEOMETRY — a window resize, a font arriving, a picture loading. A
// ResizeObserver on the root, on every station and on every keep-out (a font
// can move a quote without resizing its card), plus the window's `resize`,
// all coalesced into ONE animation frame: measure, place — and rebuild,
// repaint what was drawn, and RE-POINT the stretch being drawn and the queue
// at the new cards, by index. The prototype's second bug was a resize while
// drawing that left that card unfinished: it kept drawing the card it had
// measured before the window changed. Progress crosses a rebuild as a share.
// A `display: contents` keep-out has no box, so the observer cannot watch
// it: its contents resizing ALONE rebuilds nothing unless the card or its
// station resizes too. Each element is observed ONCE: a rebuild observes
// the stations and keep-outs that arrived and unobserves those that left —
// observing an element twice is "unobserve, then observe" in the
// specification's letter, which reports it again, and a report is a
// rebuild.
//
// ── NO REBUILD WITHOUT A NEW GEOMETRY. When the placed column, the unit (THE
// UNIT), the width share (THE WIDTH SHARE), the device's pixel ratio and the
// two colour tokens are what the last good build had, no canvas is touched: the observer's first report repeats
// the build the start has just made, and a phone fires `resize` when its
// address bar folds away mid-scroll, where only the window's height moved.
// That frame still walks the rule, because the window's height moves the
// line. In every frame the unit is read first and the window's numbers with
// the column, before the first canvas is written — one layout, not two.
//
// ── THE UNIT (CLAUDE.md §15.25 round 2, §15.26). The model counts in card
// units, the page in CSS px, and the px of one unit are read off the root at
// every build: its computed `--ribbon-unit` (globals.css, THE RIBBON'S
// UNIT) — the same getComputedStyle that serves THE COLOURS, read FIRST so
// the column is measured in it. It is 100px, the model's UNIT_PX — the
// registered initial value — unless a scaled design says otherwise
// (ui/Ribbon, THE UNIT); a value that is not a number above 0 reads as
// UNIT_PX, which is the ribbon as it was. On the site that is ONE case: an
// engine without `@property`, where the unit is nothing at all — no
// registration, so no initial value, and no scaled design to declare it, for
// the band scales only where the engine registers custom properties
// (sections/DoctorShowcase, D10's gates:
// `@supports (color: rgb(from red r g b))`, relative colour syntax, which
// shipped with `@property` or after it in every engine — Safari 16.4,
// Firefox 128, Chrome 119). There the ribbon reads UNIT_PX as its column
// reads the 100px of `var(--ribbon-unit, 100px)`: the two agree. An
// UNREGISTERED declaration of the unit would be text — read as UNIT_PX here
// while the cards drew scaled — and the band's gate is what keeps one off
// the page. The unit divides the page's px into the model's numbers
// (lib/ribbon-layout's placeColumn), multiplies the model's points back into
// canvas px, and scales THE SHADOW, so a ribbon inside a design scaled by s
// is the reference ribbon scaled by s — its waves, its lanes and its shadow
// alike — and at the default unit every number is the one it was, bit for
// bit. What does NOT follow it: TILE_MARGIN, the rasteriser's 2px of air,
// CSS px at any unit; and the pen's EFFORT, which lib/ribbon-paint counts in
// the design's px — a pace is a share of the stretch, so a scaled ribbon
// draws in the same time.
//
// ── THE WIDTH SHARE (CLAUDE.md §15.26 round 6 — the owner, 2026-10-02: "on
// desktop, laptops whatever screen larger than tablet make it 30% thinner. on
// tablet phone etc, the width is fine"). The ribbon is drawn at a SHARE of
// its width — the root's computed `--ribbon-width-share`, a plain number,
// read with the unit — along the very same route (lib/ribbon-paint's THE
// WIDTH SHARE). It is 1, the design's width, unless the page declares less:
// the doctors band does, on a laptop or a desktop, 0.7 — sections/
// DoctorShowcase, D11, under the very gates of its scale, so a phone, a
// tablet held either way and a narrow window keep the whole width. A value
// that is not a number above 0 and at most 1 reads as 1: a share above 1
// would ask for a ribbon wider than the lanes its cards keep for it. Not
// registered (globals.css): a number needs no computing where it is
// declared, so the root inherits it as written and reads the number. THE
// GUARD measures the strip as drawn, so a thinner ribbon only ever has more
// air; THE SHADOW keeps the gauge's numbers, its shape is the thinner strip.
//
// ── THE GUARD: NO LANES, NO RIBBON. After every build, if any card's strip —
// the painter's own samples, edges and centre — enters its own keep-outs by
// more than GUARD_DEPTH (lib/ribbon-model's `penetration`), or the model or
// the layout refuses the column, or the colours cannot be read, or the
// browser gives a canvas no 2D context, NOTHING is painted for the whole
// column, never one card: the canvases are emptied, and a development build
// warns, saying what happened — once, until a build passes again, so a
// column hidden at mount does not spend the one warning. A ribbon over a
// doctor's words is worse than no ribbon.
//
// ── THE COLOURS — the ribbon's ONE colour and its shadow's — are read from
// the root's computed `--ribbon` and `--ribbon-shadow` (globals.css; one
// colour since 2026-09-30, on the owner's word, and since 2026-10-02 the lilac
// band's tint, which lib/ribbon-paint's THE ANCHORED LIGHT shows as itself
// wherever the ribbon faces the viewer) and normalised by a canvas of
// their own: a CSS colour assigned to a 2D context's `fillStyle` reads back
// as `#rrggbb`. A missing or unreadable token, or a translucent one: nothing
// is painted. The ribbon's shadow is the prototype's — 0 max(1px, 3k px)
// down, blurred max(1.5px, 4k px), in the shadow token's colour at 0.38;
// px at the default unit, and scaled with the unit (THE UNIT) —
// and since 2026-10-01 it is PAINTED into each canvas under the ribbon
// (lib/ribbon-paint's THE SHADOW IS PAINTED), never a CSS filter on it: the
// owner saw the filter's "balcony" while a stretch was being drawn, and
// wanted the ribbon "directly generated as smooth". So a tile is repainted
// from what is drawn, every frame — its pieces, then ONE shadow under them
// (REPAINT, below) — and what the visitor sees in any frame is the canvas's
// own bitmap, final the moment it is painted. Each tile is grown by the
// shadow's reach (its offset and its blur) so no shadow is clipped.
//
// ── TILES: ONE CANVAS PER CARD, JOINED WHERE NOBODY SEES — BEHIND THE CARD.
// One canvas for the page would pass what iOS gives ONE canvas (16.7 million
// pixels) on a column of doctors on a tablet, so each card has its own. A
// card's strip is cut in two at its HAND-OVER point: the strip sample nearest
// the middle of its `wrapEntry` (by arc length) — behind the card's top
// corner, more than 0.56 k behind its face (ribbon-draw.test.ts pins it on
// the strips of the six recorded cards; a reviewer's sweep of 9 474 built
// cards, both mirrors, found 0.5685 k at the least). The HEAD — the drop-in
// and the hook, over the card's own top corner — is painted on the canvas
// BEFORE this card's; the BODY — from the hand-over to the next card's
// drop-in, or on the last card to its tuck behind its bottom edge — on this
// card's. So canvas i holds card i's body and card i+1's
// head: every visible run, a side wave into the next card's drop-in
// included, lies on ONE canvas, where the additive blend closes its seams
// (lib/ribbon-paint), and two canvases meet only behind a card, where
// nothing is painted — no seam to hide, and no canvas's shadow across
// another's ribbon. A card's stretch is still ONE unit of drawing — the
// rule, the queue, the pen and the effort know nothing of the cut: painting
// [from, to] paints what falls in the head on the canvas before and what
// falls in the body on its own, and a frame still ends on a whole sample.
// THE FIRST CARD HAS NO HEAD. A head is the ribbon ARRIVING from the card
// before — its side wave's end becomes the drop-in — and the first card has
// no card before it: its drop-in and hook hung in the air over its top
// corner, and the owner (2026-10-01) saw a ribbon that "starts from
// nowhere" — "on first card and first card only … should not have that top
// right component … it should just spawn as first step the traversal
// section". So card 0's stretch is its BODY alone: its effort is counted
// from the hand-over point, behind the card, and the first stroke the
// visitor sees is the ribbon coming over the card's top edge into the top
// ripple — 0.5 to 2 % of the stretch in, the hidden S that leads to the edge
// at HIDDEN_PACE (measured on the six recorded cards; the head that is gone
// was 4 to 15 % of the whole). The model still builds every card's whole
// chain (lib/ribbon-model's record stands, and the hidden S is laid from the
// entry's end); the head is simply never painted, and the room ui/Ribbon
// keeps above the first card is the band's air. The column's OTHER END is the
// model's, not this module's: the last card's ribbon tucks under it
// (lib/ribbon-model's THE TUCK, 2026-10-01), so its stretch ends behind the
// card as card 0's begins there, and nothing here treats it apart.
// REPAINT: a tile's picture is
// rebuilt from `drawn` whenever a card on it moves — cleared, each half's
// drawn range painted, and ONE shadow of
// all of it laid under — so the shadow is never a filter's afterthought and
// never seamed between pieces; the finished tiles are not touched. A tile is
// the bounding box of the samples it holds, grown by TILE_MARGIN px and the
// shadow's reach and snapped outward to whole CSS px, at the device's pixel
// ratio capped at DPR_CAP — and lower for a tile that would still pass 16
// million pixels or 16 384 px on a side. Measured on the stand-in column
// (three doctors, German, long quotes): a tile is 0.63 to 2.44 million CSS px
// from a 241 to a 2 145px column, the widest the site gives — 2.5 to 9.8
// million canvas pixels at a ratio of 2, so the cap never has to come down —
// and the tallest is 2 715px, at the narrowest. Tiles are appended in
// the column's order. WAIT trigger (§15.26): two canvases per card — a top
// band and a side band, a third of the memory — when a column of more than
// six doctors or a measured memory complaint arrives.
//
// ── LISTENERS: `scroll` on the window, passive (nothing here ever cancels a
// scroll); `resize` on the window; the observer; the reduced-motion watch.
//
// ── THE ENV SEAM (lib/clock's): the window's numbers the rule reads, the
// frame scheduler — whose timestamp is the pen's clock — and the
// reduced-motion pair come through `env`, real by default, so the rule and
// the pen are tested without a real scroll or a real wait.
//
// WHY THE IMPORTS ABOVE SAY `.ts`: lib/clock/clock.ts's "WHY THE IMPORTS
// ABOVE SAY `.ts`" paragraph.

/** What the drawing has reached: the cards measured, the cards drawn for good,
 *  the card being drawn (−1: none), and whether the column passed its guard. */
type RibbonDrawSnapshot = Readonly<{
  cards: number;
  drawn: number;
  drawing: number;
  painted: boolean;
}>;

/** The window's numbers the rule reads: the root's top in viewport px, the
 *  window's height, and whether the page is scrolled to its end. */
export type RibbonView = Readonly<{
  rootTop: number;
  height: number;
  atEnd: boolean;
}>;

/** THE ENV SEAM — the drawing's browser dependencies, injectable; each defaults to the real browser. */
export type RibbonDrawEnv = Readonly<{
  view?: (root: HTMLElement) => RibbonView;
  /** The frame scheduler; its timestamp is the pen's clock. */
  requestFrame?: (callback: (time: number) => void) => number;
  cancelFrame?: (handle: number) => void;
  prefersReducedMotion?: () => boolean;
  watchReducedMotion?: (listener: (reduced: boolean) => void) => () => void;
}>;

/** A started drawing (ONE CALL STARTS IT, ONE FUNCTION STOPS IT). */
export type RibbonDraw = Readonly<{
  /** Remove every listener, the observer, a pending frame and the canvases; a second call does nothing. */
  dispose: () => void;
  /** What the drawing has reached — after dispose(), where it stopped. */
  getSnapshot: () => RibbonDrawSnapshot;
}>;

/** One card's stretch, in ms, with no other card waiting (IN ORDER, ONE AT A TIME; 2 000 until 2026-10-01). */
export const DRAW_MS = 1_300;
/** THE LINE: this share of the screen above its bottom edge, where a card's centre makes it due — and, for a card taller than the screen, the same share under the screen's top, where its top does (THE OWNER'S RULE). */
export const LINE = 0.25;
/** How much faster the pen draws for each card waiting in the queue. */
export const HURRY = 0.6;
/** The most canvas pixels per CSS px. */
export const DPR_CAP = 2;

/** The end of the page, within this many px — and nothing more asked (THE OWNER'S RULE says why). */
const END_PX = 2;
/** How deep a strip may reach into a keep-out before the guard refuses the column, in card units (0.1 px at the default unit). */
const GUARD_DEPTH = 0.001;
/** The px a tile keeps around its strip, beyond the shadow's reach — CSS px at any unit (THE UNIT); read by ui/Ribbon's tests, whose tail room must hold it. */
export const TILE_MARGIN = 2;
/** THE SHADOW's offset down and blur, in CSS px, for the gauge k — the prototype's drop-shadow at UNIT_PX, scaled with the page's unit (THE UNIT); read by ui/Ribbon's tests, whose tail room must hold it. */
export const shadowOf = (k: number, unit: number) => {
  const scale = unit / UNIT_PX;
  return {
    dy: Math.max(1, 3 * k) * scale,
    blur: Math.max(1.5, 4 * k) * scale,
  };
};
/** What one canvas may hold: under iOS's 16.7 million pixels, and every engine's side. */
const MAX_TILE_PIXELS = 16_000_000;
const MAX_TILE_SIDE = 16_384;

/** The pen: a half-cosine over the middle 76 % of its turn, normalised to 0 → 1. */
const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * (0.12 + 0.76 * t));
const EASE_START = ease(0);
const EASE_SPAN = ease(1) - EASE_START;
const pen = (t: number) => (ease(t) - EASE_START) / EASE_SPAN;

/**
 * A tile's canvas pixels per CSS px: the device's ratio capped at DPR_CAP,
 * and lower for a tile that would still pass MAX_TILE_PIXELS, or
 * MAX_TILE_SIDE on a side.
 */
export function tileScale(
  width: number,
  height: number,
  deviceRatio: number,
): number {
  return Math.min(
    DPR_CAP,
    deviceRatio,
    Math.sqrt(MAX_TILE_PIXELS / (width * height)),
    MAX_TILE_SIDE / width,
    MAX_TILE_SIDE / height,
  );
}

/** A card's HAND-OVER point (TILES, in the header): the index of the strip sample nearest `u` along the ribbon. */
export function handOver(strip: readonly StripSample[], u: number): number {
  let nearest = 0;
  strip.forEach((sample, i) => {
    if (Math.abs(sample.u - u) < Math.abs(strip[nearest].u - u)) nearest = i;
  });
  return nearest;
}

/** The real window's numbers (THE ENV SEAM's default). */
function readView(root: HTMLElement): RibbonView {
  return {
    rootTop: root.getBoundingClientRect().top,
    height: window.innerHeight,
    atEnd:
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - END_PX,
  };
}

/** THE UNIT: the CSS px of one card unit on the ribbon's root — its computed
 *  `--ribbon-unit` — or UNIT_PX where that is not a number above 0; so never
 *  a unit lib/ribbon-layout's placeColumn refuses. */
function unitOf(style: CSSStyleDeclaration): number {
  const unit = parseFloat(style.getPropertyValue('--ribbon-unit'));
  return Number.isFinite(unit) && unit > 0 ? unit : UNIT_PX;
}

/** THE WIDTH SHARE: the share of its width the ribbon is drawn at — the
 *  root's computed `--ribbon-width-share` — or 1 where that is not a number
 *  above 0 and at most 1. */
function widthShareOf(style: CSSStyleDeclaration): number {
  const share = parseFloat(style.getPropertyValue('--ribbon-width-share'));
  return Number.isFinite(share) && share > 0 && share <= 1 ? share : 1;
}

/** A RangeError is a column the model or the layout refuses — its text is the
 *  reason; anything else is a bug, thrown on (A DECORATION NEVER TAKES THE PAGE DOWN). */
function reasonOf(error: unknown): string {
  if (!(error instanceof RangeError)) throw error;
  return String(error);
}

/** A CSS colour as three channels, 0 … 1 — or null when it is not one opaque colour (THE COLOURS). */
function opaque(probe: CanvasRenderingContext2D, value: string): Rgb | null {
  probe.fillStyle = '#000000';
  probe.fillStyle = value;
  const overBlack = String(probe.fillStyle);
  probe.fillStyle = '#ffffff';
  probe.fillStyle = value;
  // An unreadable value is ignored — each probe colour stays — and a
  // translucent one reads back as rgba(…): neither matches.
  const hex =
    overBlack === String(probe.fillStyle)
      ? /^#([0-9a-f]{6})$/.exec(overBlack)
      : null;
  if (hex === null) return null;
  const n = parseInt(hex[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

type Status = 'waiting' | 'queued' | 'drawn';

/** One card as THE GUARD passed it: its strip — what the pen walks — and its
 *  two halves, the head up to the hand-over sample and the body from it
 *  (TILES); the first card's head is empty (THE FIRST CARD HAS NO HEAD). */
type Planned = Readonly<{
  placed: PlacedCard;
  strip: readonly StripSample[];
  head: readonly StripSample[];
  body: readonly StripSample[];
  frontY: number;
}>;

/** A half of a card's stretch, and the tile that holds it. */
type Part = Readonly<{ tile: number; stretch: Stretch }>;

/** One canvas of the column: its context, its shadow, and which halves it holds (REPAINT). */
type Tile = Readonly<{
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  shadow: Rgb;
  dy: number;
  blur: number;
}>;

/** One card, built for the current geometry. */
type Built = Readonly<{
  placed: PlacedCard;
  /** The whole strip, which the pen walks. */
  strip: readonly StripSample[];
  total: number;
  /** The effort at the hand-over point: the head is [0, split], the body [split, total]. */
  split: number;
  head: Part;
  body: Part;
}>;

/**
 * Start drawing the ribbon whose canvases go in `layer` — the EMPTY box inside
 * the ribbon's root; its parent, the root, is what is measured and observed,
 * and carries the two colour tokens. Measures, paints what is due, listens —
 * and never throws (A DECORATION NEVER TAKES THE PAGE DOWN).
 */
export function startRibbonDraw(
  layer: HTMLElement,
  env: RibbonDrawEnv = {},
): RibbonDraw {
  const viewOf = env.view ?? readView;
  const requestFrame =
    env.requestFrame ??
    ((callback: (time: number) => void) =>
      window.requestAnimationFrame(callback));
  const cancelFrame =
    env.cancelFrame ??
    ((handle: number) => window.cancelAnimationFrame(handle));

  /** What dispose() takes away: every listener, the observer and the watch, as they were attached. */
  const attached: (() => void)[] = [];
  const canvases: HTMLCanvasElement[] = [];
  /** The tiles as last laid, by index (REPAINT). */
  let tiles: readonly Tile[] = [];
  /** The stations and keep-outs the observer watches — each once. */
  let observed = new Set<Element>();
  /** The column as last built. */
  let cards: readonly Built[] = [];
  /** Per card, by index — they outlive a rebuild. */
  let status: Status[] = [];
  /** The effort painted so far, per card, in the last good build's px. */
  let drawn: number[] = [];
  /** Each card's whole effort in the last good build — what turns `drawn` into a share. */
  let totals: number[] = [];
  let queue: number[] = [];
  /** The card being drawn, and since when. */
  let running: Readonly<{ index: number; t0: number }> | null = null;
  let painted = false;
  /** The last good build's key (NO REBUILD WITHOUT A NEW GEOMETRY) — empty while THE GUARD refuses the column. */
  let built = '';
  let reduced = false;
  /** AT START's rule holds until the first good build has been walked. */
  let first = true;
  let warned = false;
  let penFrame: number | undefined;
  let buildFrame: number | undefined;
  /** A context of its own that turns any CSS colour into `#rrggbb` (THE COLOURS). */
  let probe: CanvasRenderingContext2D | null = null;

  function getSnapshot(): RibbonDrawSnapshot {
    return {
      cards: status.length,
      drawn: status.filter((state) => state === 'drawn').length,
      drawing: running?.index ?? -1,
      painted,
    };
  }

  /** THE ONE WRAPPER every entry from the browser runs through (A DECORATION NEVER TAKES THE PAGE DOWN). */
  function safely<A extends unknown[]>(
    entry: (...args: A) => void,
  ): (...args: A) => void {
    return (...args) => {
      try {
        entry(...args);
      } catch (error) {
        dispose();
        if (typeof reportError === 'function') reportError(error);
        else console.error(error);
      }
    };
  }

  function dispose(): void {
    for (const detach of attached.splice(0)) detach();
    if (penFrame !== undefined) cancelFrame(penFrame);
    if (buildFrame !== undefined) cancelFrame(buildFrame);
    for (const canvas of canvases.splice(0)) canvas.remove();
  }

  function warn(reason: string): void {
    if (warned || process.env.NODE_ENV === 'production') return;
    warned = true;
    console.warn(`lib/ribbon-draw: the ribbon is not painted — ${reason}.`);
  }

  /** THE GUARD's verdict: nothing painted for the whole column, and one warning. */
  function refuse(reason: string): void {
    for (const canvas of canvases) {
      canvas.width = 0;
      canvas.height = 0;
    }
    painted = false;
    built = '';
    if (penFrame !== undefined) cancelFrame(penFrame);
    penFrame = undefined;
    warn(reason);
  }

  /** Observe the stations and keep-outs that arrived, unobserve those that left (A NEW GEOMETRY). */
  function watch(root: HTMLElement, observer: ResizeObserver): void {
    const now = new Set(root.querySelectorAll(`[${STATION}], [${KEEPOUT}]`));
    for (const element of now) {
      if (!observed.has(element)) observer.observe(element);
    }
    for (const element of observed) {
      if (!now.has(element)) observer.unobserve(element);
    }
    observed = now;
  }

  /** Every card of the column built at the width share and checked by THE GUARD — or what refuses the column. */
  function plan(
    column: readonly PlacedCard[],
    tokens: readonly [string, string],
    unit: number,
    share: number,
  ): Readonly<{ shadow: Rgb; planned: readonly Planned[] }> | string {
    probe ??= document.createElement('canvas').getContext('2d');
    if (probe === null) {
      return 'the browser gave no 2D canvas context to read the colour tokens with';
    }
    const colour = opaque(probe, tokens[0]);
    const shadow = opaque(probe, tokens[1]);
    if (colour === null || shadow === null) {
      return "the colour tokens --ribbon and --ribbon-shadow are missing, unreadable or translucent on the ribbon's root";
    }
    const planned: Planned[] = [];
    for (const placed of column) {
      let model: CardModel;
      try {
        model = buildCard(placed.input);
      } catch (error) {
        return `card ${placed.index}: ${reasonOf(error)}`;
      }
      const frontY = -model.T / 2;
      // The painter's own samples — both edges and the centre, at the width
      // drawn — against the card's keep-outs, mirrored into the strip's frame.
      const strip = buildStrip(model, placed.mirror, colour, share);
      const points = strip.flatMap(({ l, r }): Vec3[] => [
        l,
        r,
        [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2, (l[2] + r[2]) / 2],
      ]);
      const boxes = placed.mirror
        ? placed.input.boxes.map((box) => ({ ...box, x: -box.x }))
        : placed.input.boxes;
      const depth = penetration(points, boxes, frontY);
      if (depth > GUARD_DEPTH) {
        return `card ${placed.index} would enter its keep-outs by ${depth.toFixed(4)} card units (${(depth * unit).toFixed(1)}px) — a card owes the ribbon its lanes, --ribbon-lane-top and --ribbon-lane-side, and a ribbon over a card's words is worse than no ribbon (§15.26)`;
      }
      const wrap = model.atoms.wrapEntry;
      const cut = handOver(strip, (wrap.u0 + wrap.u1) / 2);
      if (placed.index === 0) {
        // THE FIRST CARD HAS NO HEAD: its stretch is its body alone, the
        // effort counted from the hand-over point.
        const from = strip[cut].effort;
        const body = strip
          .slice(cut)
          .map((sample) => ({ ...sample, effort: sample.effort - from }));
        planned.push({ placed, strip: body, head: [], body, frontY });
      } else {
        planned.push({
          placed,
          strip,
          head: strip.slice(0, cut + 1),
          body: strip.slice(cut),
          frontY,
        });
      }
    }
    return { shadow, planned };
  }

  /** TILES (the header): the canvases laid and sized, each card handed its two halves — or which canvas the browser refused. */
  function lay(
    planned: readonly Planned[],
    shadow: Rgb,
    ratio: number,
    unit: number,
  ): readonly Built[] | string {
    // Card i's head goes on canvas i − 1 (card 0 has none), its body on
    // canvas i — each half with its card's centre, in root px, which is what
    // places it.
    const halves = planned.flatMap(({ placed, head, body, frontY }, i) => {
      const cx = placed.card.left + placed.card.width / 2;
      const cy = placed.card.top + placed.card.height / 2;
      return [
        { tile: Math.max(0, i - 1), cx, cy, frontY, samples: head },
        { tile: i, cx, cy, frontY, samples: body },
      ];
    });
    const laid: Tile[] = [];
    const places: Readonly<{ left: number; top: number }>[] = [];
    for (let t = 0; t < planned.length; t++) {
      // The bounding box of every sample the tile holds, in root px.
      let [minX, maxX, minY, maxY] = [Infinity, -Infinity, Infinity, -Infinity];
      for (const { tile, cx, cy, samples } of halves) {
        if (tile !== t) continue;
        for (const { l, r } of samples) {
          for (const [x, , z] of [l, r]) {
            minX = Math.min(minX, cx + x * unit);
            maxX = Math.max(maxX, cx + x * unit);
            minY = Math.min(minY, cy - z * unit);
            maxY = Math.max(maxY, cy - z * unit);
          }
        }
      }
      // Grown by the shadow's reach: its blur all round, its offset below.
      const { k } = planned[t].placed.input;
      const { dy, blur } = shadowOf(k, unit);
      const left = Math.floor(minX - TILE_MARGIN - blur);
      const top = Math.floor(minY - TILE_MARGIN - blur);
      const width = Math.ceil(maxX + TILE_MARGIN + blur) - left;
      const height = Math.ceil(maxY + TILE_MARGIN + blur + dy) - top;

      let canvas = canvases[t];
      if (canvas === undefined) {
        canvas = document.createElement('canvas');
        canvases.push(canvas);
        layer.append(canvas);
      }
      const scale = tileScale(width, height, ratio);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      if (ctx === null) return `the browser gave canvas ${t} no 2D context`;
      ctx.setTransform(
        canvas.width / width,
        0,
        0,
        canvas.height / height,
        0,
        0,
      );
      Object.assign(canvas.style, {
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      });
      laid.push({ ctx, canvas, shadow, dy, blur });
      places.push({ left, top });
    }
    for (const canvas of canvases.splice(planned.length)) canvas.remove();
    tiles = laid;

    const parts = halves.map(({ tile, cx, cy, frontY, samples }): Part => {
      const { left, top } = places[tile];
      return {
        tile,
        stretch: {
          strip: samples,
          place: (p) => [cx + p[0] * unit - left, cy - p[2] * unit - top],
          frontY,
        },
      };
    });
    return planned.map(({ placed, strip, body }, i) => ({
      placed,
      strip,
      total: strip[strip.length - 1].effort,
      split: body[0].effort,
      head: parts[2 * i],
      body: parts[2 * i + 1],
    }));
  }

  /** Measure and place the column; rebuild only for A NEW GEOMETRY; then walk the rule. */
  function rebuild(root: HTMLElement, observer: ResizeObserver): void {
    watch(root, observer);
    // THE UNIT first — the column is measured in it — and the rest read with
    // the column, before the first canvas write: one layout.
    const style = getComputedStyle(root);
    const unit = unitOf(style);
    const share = widthShareOf(style);
    let column: readonly PlacedCard[];
    try {
      column = placeColumn(measureColumn(root), unit);
    } catch (error) {
      refuse(reasonOf(error));
      return;
    }
    status = column.map((_, i) => status[i] ?? 'waiting');
    const view = !reduced && status.includes('waiting') ? viewOf(root) : null;
    const tokens = [
      style.getPropertyValue('--ribbon'),
      style.getPropertyValue('--ribbon-shadow'),
    ] as const;
    const ratio = window.devicePixelRatio;
    const key = JSON.stringify([column, unit, share, ratio, tokens]);
    if (key !== built) {
      // Progress crosses the rebuild by index, as a share of the stretch.
      const shares = column.map((_, i) =>
        i < drawn.length ? drawn[i] / totals[i] : 0,
      );
      if (running !== null && running.index >= column.length) running = null;
      queue = queue.filter((index) => index < column.length);
      const outcome = plan(column, tokens, unit, share);
      const laid =
        typeof outcome === 'string'
          ? outcome
          : lay(outcome.planned, outcome.shadow, ratio, unit);
      if (typeof laid === 'string') {
        refuse(laid);
        return;
      }
      cards = laid;
      totals = cards.map((card) => card.total);
      drawn = cards.map((card, i) => shares[i] * card.total);
      painted = true;
      built = key;
      tiles.forEach((_, t) => repaint(t));
      if (reduced) finishAll();
      else if (running !== null || queue.length > 0) schedulePen();
    }
    if (view !== null) check(view);
    first = false;
    warned = false;
  }

  /** REPAINT (the header): tile `t`'s picture from what is drawn — cleared, each half's drawn range painted, ONE shadow under all of it. */
  function repaint(t: number): void {
    const tile = tiles[t];
    if (tile === undefined) return;
    const { ctx, canvas } = tile;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    const outline = new Path2D();
    let any = false;
    cards.forEach((card, i) => {
      // The head's range is [0, split], the body's [split, total]; each
      // clipped to what is drawn.
      const halves: readonly (readonly [Part, number, number])[] = [
        [card.head, 0, Math.min(drawn[i], card.split)],
        [card.body, card.split, drawn[i]],
      ];
      for (const [part, from, to] of halves) {
        if (part.tile !== t || !(to > from)) continue;
        paintStretch(ctx, part.stretch, from, to);
        outlineStretch(outline, part.stretch, from, to);
        any = true;
      }
    });
    if (any) paintShadow(ctx, outline, tile.shadow, tile.dy, tile.blur);
  }

  /** The tiles a card's stretch touches between two efforts, repainted — its head's tile, its body's (TILES). */
  function repaintCard(card: Built, from: number, to: number): void {
    const touched = new Set<number>();
    if (from < card.split) touched.add(card.head.tile);
    if (to > card.split) touched.add(card.body.tile);
    for (const t of touched) repaint(t);
  }

  /** Paint the rest of a card's stretch at once; it is drawn for good. */
  function finish(index: number): void {
    const card = cards[index];
    if (drawn[index] < card.total) {
      const from = drawn[index];
      drawn[index] = card.total;
      repaintCard(card, from, card.total);
    }
    status[index] = 'drawn';
  }

  /** REDUCED MOTION (the header): everything unfinished, painted at once, in the column's order. */
  function finishAll(): void {
    if (penFrame !== undefined) cancelFrame(penFrame);
    penFrame = undefined;
    running = null;
    queue = [];
    cards.forEach((_, index) => finish(index));
  }

  /** THE OWNER'S RULE, walked in order (the header). */
  function check(view: RibbonView): void {
    for (const [index, card] of cards.entries()) {
      if (status[index] !== 'waiting') continue;
      const { top, height } = card.placed.card;
      const cardTop = view.rootTop + top;
      const line = Math.max(
        (1 - LINE) * view.height - height / 2,
        LINE * view.height,
      );
      if (!(cardTop <= line || view.atEnd)) break;
      if (first && cardTop + height < 0) {
        finish(index);
      } else {
        status[index] = 'queued';
        queue.push(index);
      }
    }
    if (queue.length > 0) schedulePen();
  }

  /** At most one pen frame pending. */
  function schedulePen(): void {
    penFrame ??= requestFrame(step);
  }

  /** One frame of the pen (THE PEN, in the header). */
  const step = safely((now: number) => {
    penFrame = undefined;
    if (running === null) {
      const next = queue.shift();
      if (next === undefined) return;
      running = { index: next, t0: now };
    }
    const { index, t0 } = running;
    const card = cards[index];
    const t = Math.min(1, ((now - t0) * (1 + HURRY * queue.length)) / DRAW_MS);
    const wish = card.total * pen(t);
    // The last whole sample the pen has reached — at t = 1, the last sample.
    let j = 0;
    while (j < card.strip.length - 1 && card.strip[j + 1].effort <= wish) j++;
    const to = card.strip[j].effort;
    if (to > drawn[index]) {
      const from = drawn[index];
      drawn[index] = to;
      repaintCard(card, from, to);
    }
    if (t >= 1) {
      status[index] = 'drawn';
      running = null;
    }
    if (running !== null || queue.length > 0) schedulePen();
  });

  safely(() => {
    const root = layer.parentElement;
    if (root === null) {
      throw new TypeError(
        "startRibbonDraw: the layer must be the empty box inside the ribbon's root",
      );
    }
    reduced = (env.prefersReducedMotion ?? prefersReducedMotion)();
    // One frame for any number of reports (A NEW GEOMETRY).
    const onResize = safely(() => {
      buildFrame ??= requestFrame(
        safely(() => {
          buildFrame = undefined;
          rebuild(root, observer);
        }),
      );
    });
    const observer = new ResizeObserver(onResize);
    const onScroll = safely(() => {
      if (painted && status.includes('waiting')) check(viewOf(root));
    });
    const onReducedMotion = safely((next: boolean) => {
      reduced = next;
      if (reduced && painted) finishAll();
    });
    attached.push(
      (env.watchReducedMotion ?? watchReducedMotion)(onReducedMotion),
    );
    observer.observe(root);
    attached.push(() => observer.disconnect());
    window.addEventListener('scroll', onScroll, { passive: true });
    attached.push(() => window.removeEventListener('scroll', onScroll));
    window.addEventListener('resize', onResize);
    attached.push(() => window.removeEventListener('resize', onResize));
    rebuild(root, observer);
  })();

  return { dispose, getSnapshot };
}
