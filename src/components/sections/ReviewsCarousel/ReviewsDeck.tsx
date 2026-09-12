'use client';

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactElement,
} from 'react';
import { ReviewCard } from '@/components/sections/ReviewCard/ReviewCard';
import { GlyphButton } from '@/components/ui/GlyphButton/GlyphButton';
import { ChevronLeft } from '@/assets/glyphs/ChevronLeft';
import { ChevronRight } from '@/assets/glyphs/ChevronRight';
import type { ClockEnv } from '@/lib/clock/clock';
import { cx } from '@/lib/cx/cx';
import type { Initials } from '@/lib/initials/initials';
import type { Rating } from '@/lib/rating/rating';
import {
  classifyFocusEntry,
  createRotation,
  leavesRegion,
  liveRegion,
  wrapIndex,
} from '@/lib/rotation/rotation';

// sections/ReviewsCarousel/ReviewsDeck — THE ISLAND: the fanned deck of review
// cards and the two controls under it. The site's FIRST rotator on
// lib/rotation, built to the owner-approved N3 composition contract (master
// board fb-432…448, dossier .claude/section-runs/2026-09-10_17-01_reviews-
// carousel/sections/ReviewsCarousel.md) and reshaped at the owner's pack
// round 2 (2026-09-12) — every paragraph that changed says so.
//
// ── WHY THE BAND IS SPLIT IN TWO FILES (the sections/Header and
// sections/ContactModal folder precedent). ReviewsCarousel.tsx is a SERVER
// component: it reads the reviews, resolves every string through next-intl and
// hands this file FINISHED props — so next-intl never enters the client graph
// and the only JavaScript the visitor downloads for this band is the rotation
// (§16: the island is the smallest component that needs the browser). Nothing
// in here calls t(); §8.1 holds by construction, because there is no message
// file within reach.
//
// ── THE CONSUMPTION RECIPE IS COPIED from lib/rotation.ts's header — it is
// LAW there, and this is the first file to obey it: the useState initializer,
// the useSyncExternalStore trio, the start/dispose effect, the setCount
// effect, the CLAMPED `shown`, the DOM order (the controls before the
// slides), the focus manners through classifyFocusEntry/leavesRegion, `inert`
// on every slide but one, aria-live from liveRegion(status), and no
// aria-current anywhere — with ONE owner-decided departure, the rotation
// control, which this deck does not render (the NO ROTATION CONTROL paragraph
// below carries the decision and what stands in for it). Two riders that law
// hands its FIRST consumer, both discharged here:
//   · the keyboard-entry interaction test driven by a real browser
//     (ReviewsDeck.test.tsx — only a trusted Tab sets the keyboard modality
//     :focus-visible reports);
//   · the two message keys `common.carousel.role` / `common.carousel.slideRole`
//     in all five files, owner-authored (§15.17) and flagged in the PR.
// THE NEXT ROTATOR LANE (the Hero's photo frame) is the one that extracts the
// shared shell and decides the shared hook's home — §4's second-consumer law,
// spelled out in rotation.ts. Until then this file is the pattern's only
// witness, and copying it is correct rather than lazy.
//
// ── NO ROTATION CONTROL, ON THE OWNER'S WORD (2026-09-12, pack round 2:
// "absolutely no pause button on the reviews iterator"). The law asks every
// rotator for a pause/play button — WCAG 2.2 SC 2.2.2: moving content that
// starts automatically and lasts over five seconds needs a way to pause, stop
// or hide it — and the first spelling of this deck had one. It is gone, and
// this is what stands in for it, one mechanism per way of arriving:
//   · POINTER: resting over the deck SUSPENDS the rotation (the hover
//     paragraph below), so a mouse user reading is never moved on; leaving
//     resumes it with a full interval owed (lib/clock's courtesy).
//   · KEYBOARD: focus entering the region by Tab is the APG's STICKY pause —
//     the deck stops and, having no play button, stays stopped; the visitor
//     reads with prev/next.
//   · TOUCH — the case hover and focus cannot cover, and the reason the two
//     buttons changed meaning: A HAND ON THE DECK STOPS IT FOR GOOD. prev and
//     next call rotation.pause() after their step, so the first tap ends the
//     automatic rotation and the visitor is in control from then on. That is
//     Swiper's own default (`autoplay.disableOnInteraction: true`) and the
//     APG's intent ("does not restart unless the user explicitly requests it")
//     applied to the one input that has neither hover nor :focus-visible. A
//     tap that merely RESET the timer — the previous spelling's "buy a full
//     interval" — left a phone visitor with no way to make the deck hold
//     still.
//   · PREFERENCE: `prefers-reduced-motion` declines the automatic start in
//     lib/clock, so the deck never moves on its own for a visitor who asked
//     for that at the OS.
// Recorded honestly: the letter of SC 2.2.2 wants a mechanism a visitor can
// find BEFORE the content moves, and a button is the canonical one; hover,
// focus and stop-on-hand are the mechanisms this deck offers instead. The way
// back — should the owner ever want it — is the control lib/rotation's header
// prescribes, whose `rotationControl(status)` still exists for the Hero
// frame. The ONE-LINE FLIP in the other direction (a hand navigation that
// only resets the timer instead of stopping) is the `rotation.pause()` in
// `stepThenStop` below.
//
// ── A SECOND, SMALLER DEPARTURE FROM THE RECIPE'S LETTER — this one the
// builder's, and its reason. The
// recipe destructures `{ active, count, status }` from the snapshot; this file
// takes `{ active, status }` and derives `count` from `slides.length`. The
// snapshot's count is updated by the setCount EFFECT, i.e. one frame after a
// list changes length, so for that frame the store would disagree with the
// array this render is mapping — and every geometric decision here (the signed
// offsets, the two-item floor, the z-order) is about the array that is
// actually on screen. It is the same argument the recipe makes for its own
// CLAMPED `shown` line, applied one field further. Lists are static on this
// site today; the cost is one line and the class of bug is gone.
//
// ── THE MARKUP IS THE APG'S, NOT A LIST (and this is measured, not taste).
// The dossier sketched the slides as <ul>/<li role="group">. axe-core's `list`
// rule (check `only-listitems`, messageKey `roleNotValid`) FAILS any <li> whose
// role is not `listitem` — read in node_modules/axe-core/axe.js this lane — and
// a11y violations fail the storybook project, i.e. the merge gate (§13). The
// WAI-ARIA APG's own carousel example uses plain <div role="group"> children
// inside a plain container, so that is what ships: the same accessibility tree,
// no rule bent, no role fighting an element. Reported as contract friction.
//
// ── THE STAGE RUNS UNDER THE GUTTERS, AND THE CARD IS A SHARE OF THE SCREEN
// (owner 2026-09-12, pack round 2: "on every device the cards proportionally
// smaller or bigger in function of screen, so that you can see a card like
// half of it left and right"). Two facts of the first spelling made that
// impossible on a phone, and both are gone:
//   · The stage was ui/Container's box, so at 390px of viewport it was 312px
//     wide and the selected card filled ALL of it — the neighbours had no
//     room to peek and were clipped to nothing (only their dropped bottoms
//     showed under the centre). The old deck ran EDGE TO EDGE; so does this
//     one now. The stage — and ONLY the stage; the heading above and the
//     buttons below keep the gutter — escapes the Container with the
//     full-bleed idiom `margin-inline: calc(50% − 50vw)`: its percentage
//     margins resolve against the Container's box, so the stage's edges land
//     on the viewport's edges and its width becomes 100vw, with no expression
//     of the gutter copied here (ui/Container stays the ONE gutter
//     definition, §15.15 a). With a classic vertical scrollbar 100vw
//     overshoots the visible width by the bar — SYMMETRICALLY, half a bar
//     each side, so the centre card stays centred — and the band's
//     `overflow-x-clip` (ReviewsCarousel.tsx) swallows the overshoot before
//     it can become a sideways page scroll (§7).
//   · The card had a fixed cap (`max-w-[22rem]`) and no relation to the
//     screen. Now `--deck-card` is `clamp(14rem, 66%, 8% + 20rem)` OF THE
//     STAGE — percentages, resolved by the slide against the stage's box, so
//     no JavaScript measures anything (D10's rule survives): two-thirds of a
//     phone (257px at 390, with a 14rem floor so 320px still gets a readable
//     224px column), half a tablet (381px at 768), and from ~552px up a gentle
//     line that keeps growing with the screen (422 at 1280 · 443 at 1536 ·
//     474 at 1920) instead of freezing. What that buys, with the neighbours
//     tucked 13% under the centre (`--fan-step: 87%`, the old deck's WIDE
//     spacing at every width now — the card width carries the responsiveness
//     the three fan steps used to): at 390 each neighbour shows ~66px past the
//     centre card (the old site's ~65px), at 768 half of itself, at 1280 the
//     whole of itself plus a sliver of the card behind, at 1536 and up the old
//     five-card spread. The band's stories measure all of this in a real
//     browser (centred, the width formula, both neighbours peeking, both
//     edges cut) at whatever width the runner opens them.
// The vertical numbers are the old deck's: `--fan-drop` 2.5rem on phones and
// 3.75rem from the `@md` container step (ui/Container's box ≥ 28rem, i.e.
// viewports from ~560px — the step is queried against the Container, which
// the stage is still a descendant of), `--fan-stagger` 0.9rem alternating,
// `--fan-tilt` ±2.5°. `overflow-x-clip` on the stage clips the outer cards at
// the viewport's edges without ever making the PAGE scroll sideways; the
// bottom padding is the dropped cards' room, since a translate moves paint
// and not layout.
//
// ── ONE HEIGHT, AT EVERY POSITION OF THE RING (owner 2026-09-12: "the
// dimension of the card should be consistent throughout … at some point the
// dimension changes and is also pulling the navigation higher"). Every slide
// sits in the SAME grid cell (`col-start-1 row-start-1`), so the tallest card
// sets the stage's height and the rest stretch to it (`h-full` on the card,
// `flex-1` twice inside it — ReviewCard.tsx pins the caption to the bottom).
// The first spelling then took the slides beyond ±2 OUT of the layout with
// `hidden`, so the tallest card contributed its height only while it was
// inside the window: as the ring turned, the stage grew and shrank by the
// difference and the buttons under it rode up and down — on a phone, where
// the German review is the tall one, visibly. Nothing is hidden now: every
// slide stays laid out and painted at its offset, the far ones simply sit
// beyond the clip (|offset| ≥ 3 is off-stage at every sampled width up to
// 1920 — on a wider screen a third card per side comes into view, which a
// ring may honestly show), and the height is the same number for every value
// of `shown`.
//
// ── WHY THE STAGE VARIABLES ARE NAMED `--fan-*` / `--deck-*` AND NOT
// `--spacing` (a trap worth one sentence): Tailwind v4 defines `--spacing:
// 0.25rem` in its own theme and every dynamic spacing utility is
// `calc(var(--spacing) * n)`, so setting `--spacing: 87%` on this element
// would rescale every padding, margin and gap inside the deck. The
// contract's draft spelled that name; these do not.
//
// ── THE CONTROLS SIT BELOW THE STAGE, IN ONE ROW (owner D12): [prev] [next],
// centred. In the DOM they come FIRST — the law's order, so a keyboard visitor
// meets the navigation before the reviews — and the region's grid puts the
// stage in row 1 and the buttons in row 2, so reading order and picture
// disagree only in the way the APG example's own do. Every button keeps its
// 44px box (ui/GlyphButton's `md`, §9).
//
// ── THE HOVER AREA IS THE REGION ITSELF. The law puts the pointer handlers on
// a wrapper that excludes the rotation control (hovering it must not suspend
// the very thing it offers to stop); with no control there is nothing to
// exclude, so the two pointer handlers sit on the region beside the two focus
// handlers, and the region's own grid box — stage, gap and buttons — is the
// whole hover area. A pointer resting anywhere in it, the gap included, keeps
// the deck still; the suite pins hover-a-slide, hover-a-button and
// hover-the-gap.
//
// ── THE MOVE, AND WHAT REDUCED MOTION DOES TO IT. `transition-[translate,
// rotate] duration-500` on each slide is the carousel's own essential
// animation (§9 permits it; nothing is conveyed by the motion that the cards do
// not also say in text), and `motion-reduce:transition-none` makes the change
// a SNAP rather than removing it. The other half of the preference lives in
// lib/clock, which declines the automatic start entirely — the visitor may
// still navigate by hand, and then the deck moves without transitions. 500ms
// is this deck's own number and deliberately NOT the `--fade` hover clock
// (400ms): a card traversing the stage is a different gesture from a colour
// fading under a pointer, and --fade is only declared where a component
// declares it.
//
// ── NO LAP KEYS, AND WHY (ledger D1 — the owner's morph pitfall). Every slide
// is keyed by its review id and NOTHING remounts: an advance changes `shown`,
// which changes three custom properties on the same nodes and ONE attribute on
// the card inside them (`tone`). React keeps the DOM, the browser keeps the
// downloaded photograph, and the text never re-renders under the reader. The
// lap-key exception rotation.ts describes is for a deck that must remount a
// wrapped card; this one never does, at any count.
//
// ── AND THEREFORE: THE WRAP-AROUND SWEEP, AND THE ONE RULE THAT KILLS IT (G2
// react 1, 2026-09-10). Not remounting has a price at SMALL COUNTS. Every
// advance moves each slide one step, except the one that wraps: with three
// reviews the card at −1 becomes +1, with five the card at −2 becomes +2. Those
// are jumps of two and four steps, and a jump is a TRANSITION — so that card
// would glide the full width of the stage, behind the fan, for half a second,
// on every advance. (The old deck never showed this because it remounted the
// wrapped card, i.e. it popped.) The rule: a slide whose offset changed by
// MORE THAN ONE step since the previous render is rendered with
// `transition-none` for THAT render — it lands on the far side instantly,
// exactly as the old deck's remount did, and gets its transition back on the
// next one. From seven reviews up the jump is between +3 and −3, both beyond
// the clip, and nobody sees it; with six the card at −2 becomes +3, i.e. it
// leaves the left edge instantly and re-enters from the right two advances
// later — the honest limit of a ring with no remounts, visible only on wide
// screens and once per lap. The comparison needs the LAST arrangement, which
// is what `painted` holds — state adjusted DURING render, React's documented
// pattern for deriving from the previous props (react.dev, "Adjusting some
// state when a prop changes"): no ref read in render, no lint exception, no
// extra paint (the code below says why); on the first mount nothing is
// suppressed and nothing is moving anyway.

/** One review, already translated and already formatted — nothing to decide. */
export type ReviewSlide = Readonly<{
  /** The stable review id: React's key here, the card's aria-labelledby seed. */
  id: string;
  /** Exactly two capitals — the reviewer's own (lib/initials). */
  initials: Initials;
  /** Optional portrait. Decorative in a deck: the band passes `alt=""`. */
  picture?: Readonly<{ src: `/images/${string}`; alt: string }>;
  /** Whole or half stars, 0 to 5 (lib/rating). */
  rating: Rating;
  /** Finished ICU output, e.g. "4,5 din 5 stele" — never a number (§8.1). */
  ratingLabel: string;
  /** The review's own title. */
  title: string;
  /** The quoted body, WITHOUT quote marks — ReviewCard generates them. */
  body: string;
  /** The patient's name, as they consented to have it shown. */
  name: string;
  /** The procedure label, sentence case — ui/Eyebrow uppercases in CSS. */
  procedure: string;
  /**
   * This slide's own accessible name: the finished "{index} of {total}"
   * string, e.g. „Recenzia 1 din 6". It lives ON the slide rather than in a
   * parallel array (G2 ts 2): two lists that must stay the same length and the
   * same order are a defect waiting for the first list that is filtered.
   * Pre-rendered by the band because a formatter is a function, and functions
   * cannot cross a server→client boundary.
   */
  label: string;
}>;

/** Every word this island says, resolved by the band (§8.1). */
export type ReviewsDeckLabels = Readonly<{
  /** The carousel region's accessible NAME — without it there is no region. */
  region: string;
  /** `common.carousel.role`, localized: what aria-roledescription announces. */
  role: string;
  /** `common.carousel.slideRole`, localized: the same, per slide. */
  slideRole: string;
  /** The previous-review button's name. */
  previous: string;
  /** The next-review button's name. */
  next: string;
}>;

export type ReviewsDeckProps = Readonly<{
  /**
   * The deck, in order, each slide carrying its own name. Fewer than two and
   * no control is rendered at all.
   */
  slides: readonly ReviewSlide[];
  labels: ReviewsDeckLabels;
  /**
   * The rhythm in ms — the BAND's constant (owner D11), never a default here.
   *
   * READ ONCE, AT MOUNT: the ring is built in a `useState` initializer, so
   * changing this prop later has NO effect. To change the rhythm, remount the
   * deck with a different React `key`. (Rebuilding the store in an effect
   * instead would throw away the visitor's stop and the slide they are on,
   * which is a worse answer to a case this site does not have — the number is
   * a module constant.)
   */
  intervalMs: number;
  /**
   * The first dwell in ms; omitted, the ring uses `intervalMs`. READ ONCE, AT
   * MOUNT — same rule as `intervalMs` above, same remedy (`key`).
   */
  startDelayMs?: number;
  /**
   * TESTS AND STORIES ONLY — lib/clock's environment seam (the reduced-motion
   * query and the tab's visibility, as plain functions). The band never passes
   * it: functions do not cross a server→client boundary, and the real browser
   * is the right answer on the real site. READ ONCE, AT MOUNT — same rule as
   * the two numbers above, same remedy (`key`).
   */
  env?: ClockEnv;
}>;

/**
 * Where a slide sits relative to the selected one: 0 is the centre, negative
 * is left, positive is right, and the ring is split as evenly as it divides —
 * with six slides the offsets are 0, ±1, ±2 and one +3 (the one beyond the
 * stage's right edge).
 *
 * `wrapIndex` (lib/rotation) is the modular half; the comparison is what turns
 * "five steps forward on a ring of six" into "one step back", which is the
 * difference between a card sliding one place and a card flying across the
 * whole stage.
 */
function signedOffset(index: number, shown: number, count: number): number {
  const distance = wrapIndex(index - shown, count);
  return distance > count / 2 ? distance - count : distance;
}

/**
 * Which slides JUMPED between two arrangements — more than one step, i.e. the
 * ring wrapped underneath them (see the header's wrap-around note). A
 * module-level pure function, so the render body reads as one comparison.
 *
 * @param painted the offsets of the last arrangement stored.
 */
function wrappedSince(
  painted: readonly number[],
  offsets: readonly number[],
): boolean[] {
  return offsets.map((offset, index) => {
    const was = painted[index];
    return was !== undefined && Math.abs(offset - was) > 1;
  });
}

/** The arrangement last stored, and which slides jumped INTO it. */
type Painted = Readonly<{
  offsets: readonly number[];
  wrapped: readonly boolean[];
}>;

/**
 * Same ring positions, index for index — the guard that keeps the render-time
 * adjustment below from ever running twice for one arrangement.
 */
function sameOffsets(a: readonly number[], b: readonly number[]): boolean {
  return (
    a.length === b.length && a.every((offset, index) => offset === b[index])
  );
}

// THE STAGE — row 1 of the region's grid, and the ONE element on the site
// that runs under the gutters (the header's STAGE paragraph). `col-start-1
// row-start-1` on every slide (below) stacks them all in this grid's single
// cell, so the tallest card sets the height and the rest stretch to it — at
// every position of the ring, because nothing is ever hidden (the header's
// ONE HEIGHT paragraph).
//
// ── THE DIALS, all of them percentages of a box the browser measures:
//   · `--deck-card` — the card's width as a share of the stage:
//     clamp(14rem, 66%, 8% + 20rem). Two-thirds of a phone with a 14rem
//     floor, half a tablet, then a slow line that keeps growing.
//   · `--fan-step` — how far a neighbour sits from the centre, as a share of
//     the CARD's own width (a translate percentage resolves against the
//     element itself): 87% = the old deck's wide spacing, i.e. 13% tucked
//     under the centre card, at every width.
//   · `--fan-drop` / `--fan-stagger` / `--fan-tilt` — how far the neighbours
//     hang below the centre (stepping up at ui/Container's `@md`), the ±
//     alternation of that drop, and the ±2.5° tilt.
// `mx-[calc(50%_-_50vw)]` is the full-bleed idiom (the header). `overflow-x-
// clip` is what lets the outer cards run off the edges the way the old deck's
// did without ever making the PAGE scroll sideways (§7).
const stageClasses = cx(
  'row-start-1 grid overflow-x-clip mx-[calc(50%_-_50vw)]',
  '[--deck-card:clamp(14rem,66%,8%_+_20rem)]',
  '[--fan-step:87%] [--fan-drop:2.5rem] [--fan-stagger:0.9rem] [--fan-tilt:2.5deg]',
  '@md:[--fan-drop:3.75rem]',
  'pt-2',
);

/**
 * The dropped cards' room under the stage — a translate moves paint and not
 * layout, so the neighbours hanging below the centre need it reserved. Worn
 * only when there ARE neighbours: a lone review keeps `pb-2` (G3 react N3).
 */
const stageDropRoom =
  'pb-[calc(var(--fan-drop)_+_var(--fan-stagger)_+_0.75rem)]';

// ONE SLIDE. The two independent transform properties (`translate` and
// `rotate`, not a `transform` shorthand) so the transition list can name them
// separately and neither can clobber the other. Every value is arithmetic over
// the three per-slide variables and the stage's dials — no px in sight, and
// the width is the stage's `--deck-card` share.
const slideClasses = cx(
  'col-start-1 row-start-1 w-(--deck-card) justify-self-center',
  '[translate:calc(var(--offset)_*_var(--fan-step))_calc(var(--dropped)_*_var(--fan-drop)_+_var(--parity)_*_var(--fan-stagger))]',
  '[rotate:calc(var(--parity)_*_var(--fan-tilt))]',
);

/** A slide that moved ONE step: it travels, on the deck's own clock. */
const slideMotion =
  'transition-[translate,rotate] duration-500 ease-in-out motion-reduce:transition-none';

/**
 * A slide that WRAPPED this render: it lands instantly (see the header's
 * wrap-around note). Two separate class strings rather than one string plus an
 * override, because `transition-none` and `transition-[translate,rotate]` set
 * the same property and which one won would then depend on Tailwind's emission
 * order rather than on this file. `motion-reduce:` rides along redundantly on
 * purpose: whichever branch a future edit keeps, the preference survives it.
 */
const slideSnap = 'transition-none motion-reduce:transition-none';

export function ReviewsDeck({
  slides,
  labels,
  intervalMs,
  startDelayMs,
  env,
}: ReviewsDeckProps): ReactElement {
  // The initializer runs ONCE per render tree — once on the server during the
  // static export and once in the browser at hydration — and construction is
  // PURE (lib/clock: no timer, no media query, no document until start()), so
  // both stores publish the same first snapshot and hydration stays safe.
  const [rotation] = useState(() =>
    createRotation({ count: slides.length, intervalMs, startDelayMs, env }),
  );
  const { active, status } = useSyncExternalStore(
    rotation.subscribe,
    rotation.getSnapshot,
    rotation.getServerSnapshot,
  );

  useEffect(() => {
    rotation.start();
    return () => rotation.dispose();
  }, [rotation]);

  useEffect(() => {
    rotation.setCount(slides.length);
  }, [rotation, slides.length]);

  const count = slides.length;
  // CLAMP, not wrap: setCount() runs one frame after a list shrinks, so this
  // frame shows the slide setCount() is about to land on rather than jumping
  // through slide 0 on the way (the recipe's own guard).
  const shown = Math.min(active, Math.max(0, count - 1));
  // Derived from COUNT, never from idleReason — which also carries reduced
  // motion. The same number decides the SEMANTICS (G2 a11y, item E): a single
  // review is not a carousel, so it announces itself as one review inside a
  // named region — no roledescription, no slide group, no live region, and
  // nothing to press. Every one of those would describe a widget that does
  // not exist.
  const isCarousel = count >= 2;

  // THE FAN'S GEOMETRY FOR THIS RENDER, and the one comparison that needs a
  // memory: a slide that moved more than one step WRAPPED, and a wrap must not
  // glide across the stage (see the header's wrap-around note). Computed as a
  // list because the state below stores one, and stored by INDEX rather than
  // by id because a reordered list is a different deck, not a moved slide.
  const offsets = slides.map((_, index) => signedOffset(index, shown, count));
  // THE LAST ARRANGEMENT, AS STATE ADJUSTED DURING RENDER — React's documented
  // pattern for "derive something from the previous props" (react.dev,
  // "Adjusting some state when a prop changes"). When the offsets this render
  // computed differ from the ones stored, the store is updated RIGHT HERE and
  // React re-runs this component immediately, before anything is committed —
  // so the DOM the browser sees is the one render that carries the new
  // offsets AND the flags computed against the old ones, in ONE commit, with
  // nothing painted in between. That single-commit property is the whole
  // point: the wrapping slide's `transition-none` must reach the browser in
  // the same style recalculation as its new `translate`. The flags then last
  // until the NEXT change of offsets, which the browser cannot tell from "one
  // render" — the transition-property in force when a value changes is what
  // governs that move. The first spelling read a ref during render (a
  // documented `usePrevious` shape) under a `react-hooks/refs` exception;
  // this one needs no exception, and travels cleanly into the shared shell
  // the second rotator lane will extract (G3 react L3). `sameOffsets` is the
  // guard that keeps the adjustment from running twice for one arrangement.
  const [painted, setPainted] = useState<Painted>(() => ({
    offsets,
    wrapped: offsets.map(() => false),
  }));
  if (!sameOffsets(painted.offsets, offsets)) {
    setPainted({ offsets, wrapped: wrappedSince(painted.offsets, offsets) });
  }
  const wrapped = painted.wrapped;

  /**
   * A HAND ON THE DECK: the step the button names, then the STOP FOR GOOD —
   * `pause()` is the sticky one, the state only a play button could undo, and
   * this deck has none (the header's NO ROTATION CONTROL paragraph: this call
   * is the touch-reachable stop SC 2.2.2 needs, and the one-line flip back).
   * A no-op while the ring is idle (reduced motion, too few), where there is
   * nothing to stop.
   */
  const stepThenStop = (step: () => void) => (): void => {
    step();
    rotation.pause();
  };

  return (
    <section
      aria-label={labels.region}
      aria-roledescription={isCarousel ? labels.role : undefined}
      // BOTH focus handlers on the REGION: a Tab landing on prev or next IS an
      // entry. The three cases — a move within, a keyboard entry, a pointer
      // one — are lib/rotation's two functions. A keyboard entry is the sticky
      // pause, and with no play button it is final: the visitor reads with
      // the buttons under their fingers.
      onFocus={(event) => {
        const entry = classifyFocusEntry(event);
        if (entry === 'keyboard') rotation.pause();
        else if (entry === 'pointer') rotation.suspend('focus');
      }}
      onBlur={(event) => {
        if (leavesRegion(event)) rotation.resume('focus');
      }}
      // …and BOTH pointer handlers on the region too (the header's HOVER
      // paragraph): stage, gap and buttons are one hover area, because there
      // is no rotation control to keep out of it.
      onPointerEnter={() => rotation.suspend('pointer')}
      onPointerLeave={() => rotation.resume('pointer')}
      className="grid gap-y-4"
    >
      {/* THE NAVIGATION — FIRST in the DOM (the law's order: a keyboard
          visitor meets the controls before the reviews), row 2 in the
          picture (owner D12: the buttons sit under the deck). Each press
          steps AND stops the automatic rotation — see `stepThenStop`. */}
      {isCarousel && (
        <div className="row-start-2 flex justify-center gap-3">
          <GlyphButton
            variant="outline"
            aria-label={labels.previous}
            onClick={stepThenStop(rotation.prev)}
          >
            <ChevronLeft />
          </GlyphButton>
          <GlyphButton
            variant="outline"
            aria-label={labels.next}
            onClick={stepThenStop(rotation.next)}
          >
            <ChevronRight />
          </GlyphButton>
        </div>
      )}
      {/* THE SLIDES CONTAINER — 'off' while the deck moves on its own
          (announcing a review every half minute would talk over whatever the
          visitor is reading) and 'polite' the moment it stops, because from
          then on a change means somebody asked for one. */}
      <div
        aria-live={isCarousel ? liveRegion(status) : undefined}
        className={cx(stageClasses, isCarousel ? stageDropRoom : 'pb-2')}
      >
        {slides.map((slide, index) => {
          const offset = offsets[index];
          const depth = Math.abs(offset);
          // The alternation the old deck had: neighbours drop a little
          // further and tilt one way, the pair behind them sits back up and
          // tilts the other — a hand of cards rather than a staircase.
          const parity = depth === 0 ? 0 : depth % 2 === 1 ? 1 : -1;

          return (
            <div
              key={slide.id}
              role={isCarousel ? 'group' : undefined}
              aria-roledescription={isCarousel ? labels.slideRole : undefined}
              aria-label={isCarousel ? slide.label : undefined}
              // `inert` removes a slide from the accessibility tree AND from
              // the Tab order, so the cards stacked behind the centre never
              // hand a visitor a link they cannot see. Un-inerting the new
              // one is exactly the change the polite live region announces
              // after a hand navigation.
              inert={offset !== 0 || undefined}
              // The belt (G2 a11y, item D): `inert` is unsupported before
              // Safari 15.5, where a stacked card would otherwise stay in the
              // accessibility tree behind the one on top. aria-hidden is
              // understood everywhere, removing it announces exactly what
              // un-inerting announces, and no slide holds anything focusable
              // — so the pair cannot produce axe's aria-hidden-focus defect.
              // NO `hidden` for the far slides, ever: every slide stays in
              // the layout so the stage's height never changes (the header's
              // ONE HEIGHT paragraph); the far ones are simply off-stage.
              aria-hidden={offset !== 0 || undefined}
              style={
                {
                  '--offset': offset,
                  '--dropped': depth === 0 ? 0 : 1,
                  '--parity': parity,
                  // The centre on top, its neighbours behind it, and so on
                  // out to the edges — the fan's whole illusion.
                  zIndex: count - depth,
                } as CSSProperties
              }
              className={cx(
                slideClasses,
                wrapped[index] ? slideSnap : slideMotion,
              )}
            >
              {/* ONE attribute changes when the selection moves: `tone`.
                  Same node, same photograph, same words (ledger D1) —
                  ui/Card's sum rule (border + padding = 25px on every row)
                  is what makes the swap cost zero pixels.
                  EVERY PROP IS SPELLED (G2 ts 2): a `{...slide}` spread would
                  hand ReviewCard whatever ReviewSlide grows next, and that
                  card spreads its own rest onto the <article> — so a new
                  field would silently become a DOM attribute. `label` is
                  already the proof: it belongs to the SLIDE (its group name),
                  never to the card. */}
              <ReviewCard
                id={slide.id}
                initials={slide.initials}
                picture={slide.picture}
                rating={slide.rating}
                ratingLabel={slide.ratingLabel}
                title={slide.title}
                body={slide.body}
                name={slide.name}
                procedure={slide.procedure}
                tone={offset === 0 ? 'emphasized' : 'framed'}
                className="h-full"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
