import { prefersReducedMotion } from '../reduced-motion/reduced-motion.ts';

// lib/strip-follow — "KEEP THE CURRENT ITEM OF A SIDEWAYS STRIP IN VIEW", as a
// React-free mechanic. A strip is a row of links that scrolls horizontally
// inside its own box (the price page's category chips on a phone or a tablet,
// sections/PriceList/PriceMenu); something else decides which item is CURRENT
// (lib/scroll-spy, as the page scrolls or when an item is tapped), and this
// module moves the STRIP — never the page — so that the current item sits in
// the middle of what the visitor can see. It renders nothing, writes nothing
// but the strip's own `scrollLeft`, names nothing and knows no word of any
// language (CLAUDE.md §4's foundation ring, fence-tested by
// tests/unit/lib-react-free.test.ts; its page is never moved, fence-tested by
// tests/unit/strip-follow-never-moves-the-page.test.ts).
//
// ── WHY IT EXISTS (owner, 2026-10-09, verbatim: "on click of menu item it
// should take you to desired section and as you scroll it should iterate
// throug sections. find or lookup a mekanism for making it look nice as you
// scroll through the items and to also be in concordance iwth the current as
// it highlight, to not look suddon or as you scroll to not make current
// disappear from the list. so the list should move with respect to current so
// it does not go off screen and i need a nice mekaisnm for this so that it
// looks nice"). Three asks, four rules below: the current item never leaves
// the strip (THE RULE), the strip's move and the item's highlight are one
// movement (THE MOTION), and neither a hand on the strip (THE HAND) nor a
// keyboard focus in it (THE KEYBOARD) is ever fought.
//
// ── THE RULE — CENTRE, CLAMPED, NEVER A RING. The current item is centred in
// the strip's visible box, and the result is clamped to what the strip can
// scroll, [0, scrollWidth − clientWidth]: so the first items rest at the
// strip's start and the last at its end, with every item between them in the
// middle. This is the convention of the scrollable tab rows the toolkits
// ship (the planner's research, 2026-10-09, read in their sources): Jetpack
// Compose's ScrollableTabRow places the selected tab "in the center… clamp to
// the min/max"; Android's TabLayout puts the tab's centre on the bar's
// centre; Flutter's TabBar scrolls to `clampDouble(tabCenter + paddingStart −
// viewportWidth / 2, minExtent, maxExtent)` — centredScrollLeft below, to the
// letter. Chosen over two others: "scroll only as far as needed" (MUI's
// Tabs, "nearest" — right for a selection made INSIDE the strip, but on a
// strip the page's scroll drives it parks the current item against an edge
// and hides the next one, exactly the "current disappear from the list" the
// owner named) and "align it to the start" (the items before it would vanish
// on every change, and the list would read as jumping). And never a ring: the
// owner — "do not make it a circular list". The arithmetic is
// centredScrollLeft below — pure numbers, unit-tested apart from the DOM.
//
// ── THE STRIP MOVES ONLY ON A SELECTION CHANGE — a NEW current item, or one
// that became current while following was paused (THE HAND, THE KEYBOARD).
// Never by itself after a hand lifts: that is the convention of every
// reference above — Compose, TabLayout, Flutter and MUI all scroll their bar
// only when the selected index changes. The one other movement is a
// re-placement when the strip's own SIZE changes (INSTANT, below): a new
// geometry, not a new choice.
//
// ── THE MOTION — THE ITEM'S OWN CLOCK. A change of current item is drawn as
// ONE movement: the old item's highlight fading out, the new one's fading in
// and the strip sliding the new one to the middle start together and end
// together. The item's highlight fades on the system's --fade clock (ui/
// PillButton's colours: 400ms, CSS `ease-in-out`), so the strip's glide reads
// its duration off THE TARGET ITEM'S OWN computed `--fade` and eases on the
// same curve, `ease-in-out` exactly — cubic-bezier(0.42, 0, 0.58, 1), solved
// below — in a requestAnimationFrame tween of the strip's `scrollLeft`. Not
// the browser's own smooth scroll (`scrollTo({ behavior: 'smooth' })`): its
// duration and its curve are each engine's own, so it could never be the same
// movement as a 400ms ease-in-out fade. And NEVER `scrollIntoView`: MEASURED
// (the planner's strip lab, 2026-10-09, Chromium 151 and WebKit 26.5, a phone
// window, the page's own smooth scrolling): called on an item 150ms into the
// page's glide to a fragment, it CANCELS the page's glide in both engines —
// Chromium stopped at 226 of 6559px, WebKit at 4897 — while a tween of the
// strip's `scrollLeft` (and a smooth `scrollTo` on the strip) left the page's
// glide whole and reached its own target, at 0ms and at 150ms, in both.
// A NEW TARGET MID-GLIDE retargets from wherever the strip is at that moment,
// on a full clock, so a quick run of changes reads as one continuous motion.
// THE TIMING IS THE HOUSE'S, NOT THE TOOLKITS' (the planner, 2026-10-09):
// the references glide shorter and decelerate — Compose Material 2's
// ScrollableTabRow 250ms on FastOutSlowIn (Material 3 its default spatial
// spring), Android's TabLayout 300ms, Flutter's TabBar 300ms on
// `Curves.ease`, MUI 300ms — and this follower keeps the house's 400ms
// `ease-in-out` on purpose: the strip's glide and the chips' colour crossfade
// are one movement only if they share one clock.
// THE RESIDUAL RISK, recorded: Chromium before about version 130 ran ONE
// smooth-scroll sequencer per frame — in Chromium 120's
// smooth_scroll_sequencer.cc a new programmatic scroll on ANY element aborted
// the running one (`FilterNewScrollOrAbortCurrent` → `AbortAnimations()`) —
// so there a write to the strip's `scrollLeft` during the page's own glide to
// a fragment could cut that glide short; the `MultiSmoothScrollIntoView`
// feature, enabled on 2024-09-11, removed the sequencer. CSSOM View cancels a
// smooth scroll only "for box" — the same element — current web-platform
// tests expect a fragment glide and another element's smooth scroll both to
// finish, and the lab measured both finishing (Chromium 151, WebKit 26.5). On
// such an old engine lib/scroll-spy's arrival check hands the mark back to the
// walk where the page stopped: a degraded jump, never a wrong mark.
//
// ── INSTANT, WHERE A MOVEMENT WOULD SAY NOTHING. The first placement — the
// first item asked for after start(), and the first after the strip has been
// hidden and shown again (its `clientWidth` 0 → more) — is a jump: there is
// no previous position on screen to move from, and gliding in from the start
// of the list on every page load would be motion for its own sake. BEFORE
// PAINT: follow() places synchronously — a jump writes `scrollLeft` at once —
// so a caller that tells it from a layout effect (PriceMenu does) shows the
// current item and the strip's position in the SAME frame, and the strip
// never paints its marked item at scrollLeft 0 to jump a frame later (Material
// Web and MUI jump at start-up too) — on every page but one that opened with a
// `#fragment`, where the browser's own jump comes first (THE BROWSER'S
// FRAGMENT JUMP GOES FIRST, next). A change of the strip's own SIZE — its
// width or its height: a phone rotated, a window resized, a zoom, a larger
// text size — re-places the current item at once, cancelling a glide in
// flight (Material Web and MUI jump on resize as well), unless following is
// paused. And reduced motion (§9) makes every move a jump — read through
// lib/reduced-motion at each move, so a preference changed mid-visit is
// honoured at the next one.
//
// ── THE BROWSER'S FRAGMENT JUMP GOES FIRST (2026-10-10, the deep-link
// defect the planner sent back: "a deep link that lands the card's top inside
// the stuck chips … would be a real visitor defect on a slow load"). When the
// URL has a fragment at start() — a page opened with a `#fragment`, a link
// someone sent, `/de/services/#prosthetics` — the BROWSER lands the page on
// that fragment, at load. MEASURED on the built price page (Chromium,
// `/debug-deep`, the webfont delayed by `page.route`): in Chromium, ANY
// scripted scroll of ANY box before that jump makes the browser skip it — the
// follower's first placement of this strip did, and so did a dummy scroller —
// and the page is then placed only by the focus the browser gives the
// fragment's target, which CENTRES it if needed, so a card taller than the
// window was left with its top 180 to 811px above its landing (prosthetics at
// −609px), 12 of 12 whenever the first frame came after hydration (a late
// webfont, a busy main thread) and 0 of 36 whenever it came before; and a
// scripted scroll after the jump but before the document has loaded stops the
// browser's later corrections for the webfont's reflow (20 to 48px). WebKit
// lands it either way; without JavaScript Chromium does too. So while the URL
// had a fragment at start() the follower writes NOTHING to the strip — no
// placement, no glide, no keyboard reveal — until THE GATE OPENS: the document
// has loaded and a frame has been drawn after it (two animation frames: a
// callback of the first runs before that frame's rendering, where the browser
// makes its jump). Then (the G2 review, 2026-10-10):
//   · the item current at that moment is placed AT ONCE, as a first placement
//     is — UNLESS the strip SCROLLED while the gate was closed (a swipe, a
//     sideways wheel, the engine's own reveal of a chip a Tab reached) AND
//     the current item has stayed the same since: then the strip stays where
//     the visitor put it (THE STRIP MOVES ONLY ON A SELECTION CHANGE). A press
//     that moved nothing — a tap, a click — keeps nothing, and a new current
//     item after a swipe is a selection change, and is placed;
//   · a chip holding a KEYBOARD focus is revealed, once (THE KEYBOARD'S
//     REVEAL) — the reveal its own `focusin` could not make while the gate
//     was closed;
//   · a hand still on the strip, or a keyboard focus in it, leaves the
//     placement as a change to draw when it lets go (THE HAND, THE KEYBOARD);
//   · A RESTING POINTER IS WAITED FOR — BRIEFLY: on a device whose pointer
//     hovers (`(hover: hover)`), a pointer that has MOVED over the strip
//     since start() and rests ON it (`:hover`) as the gate would open may be
//     aiming at a chip — a jump of the chips under it would land a click on
//     another one — so the gate stays closed while it rests. A pointer PARKED
//     there before the page loaded is not aiming, and is not waited for (the
//     G2 re-review, 2026-10-10, measured the unbounded wait FREEZING the strip:
//     a mouse left on the chips while the visitor wheel-scrolled the page, the
//     current item walking three categories with every current chip off
//     screen and the strip at its start — and a keyboard visitor with a parked
//     mouse kept that frozen strip for the whole visit). The wait ends at the
//     FIRST of: the pointer leaving the strip (`pointerleave`); a
//     `pointerdown` or `pointermove` that is a finger's, or that lands off
//     the strip (NEVER ON TOUCH: a finger never rests, but a tap leaves
//     `:hover` stuck on what it touched — on a touch screen beside a trackpad,
//     a hover-capable device, until the mouse next moves); a NEW current item
//     (the page has moved on under the pointer — placed at once); the first
//     `keydown`, or a keyboard focus in the strip (the visitor is on the keys —
//     that chip revealed); and HOVER_WAIT_MAX_MS, its bound — two seconds
//     after the pointer's LAST move over the strip, every move restarting it,
//     so a dwell clicker (eye gaze, a head pointer) or a slow aimer clicks
//     where it aimed (G2 a11y, 2026-10-10; one second from the gate's opening
//     before).
// THE CEILING: a document whose load never completes — a request left hanging
// — must not leave the strip unplaced for good, so GATE_CEILING_MS (10s) after
// start() the gate behaves as if the load had come (KEEP-IN-SYNC with
// lib/scroll-spy's LOAD_WAIT_CEILING_MS: the card and its chip give up on the
// load together) — and waits for no resting pointer: ten seconds is wait
// enough.
// The cost, recorded: on a deep link the strip shows its marked chip where it
// stands — at the start of the row — until the gate opens, which on a fast
// load is one frame and on a slow one lasts until the page has loaded (and,
// while a mouse that moved onto the strip rests there, up to HOVER_WAIT_MAX_MS
// after its last move). A URL without a fragment at start()
// has no browser jump to protect and keeps BEFORE PAINT. The browser's own
// jump can still go stale with motion allowed — a smooth jump is not re-aimed
// when the webfont reflows the page under it, with JavaScript off too — and
// lib/scroll-spy finishes that one at its settle (its THE READING LINE).
//
// ── THE HAND — NEVER FIGHT IT. A visitor may swipe the strip to look at the
// other items, or scroll it with a wheel or a trackpad. A press on the strip —
// `pointerdown`, `touchstart` (passive) — or a SIDEWAYS `wheel` over it
// (|deltaX| > |deltaY|, or Shift held; a vertical wheel over the stuck strip
// scrolls the page, and pauses nothing) cancels any
// glide at once and SUSPENDS following: while it is suspended, a change of
// current item is remembered, never drawn. Following RESUMES once the hand
// has let go — the last `pointerup` / `pointercancel` of a mouse or a pen, the
// last `touchend` / `touchcancel` of a finger (a finger's pan fires a
// `pointercancel` while the finger is still down, so for touch the TOUCH
// events decide) — and the strip has then had no scroll event of its own for
// QUIET_MS (150ms, lib/scroll-spy's settle window: a strip still coasting on
// its momentum is still the hand's). A press that never moved the strip — a
// tap or a click on an item — resumes at the release, with no wait: there is
// no momentum to outlast, and the item it chose must glide to the middle in
// step with its own highlight. A FINGER WHOSE PRESS TURNS INTO A PAN CLEARLY
// ALONG THE PAGE lets go at once (the G2 review, 2026-10-10): its axis is
// judged ONCE, when it has travelled DECIDE_PX (10px — lib/scroll-spy's, as
// the browser judges its own pan's axis after its slop), and a pan within 35°
// of vertical (VERTICAL_PAN_RATIO, |dx| ≤ 0.7 |dy|) scrolls the page, not the
// strip — so following resumes there and then, and the strip follows the
// current item live while the page moves under the finger; any flatter pan is
// ACROSS the strip and keeps following suspended until the hand lets go, as
// above. NOT 45°: MEASURED (the G2 re-review, 2026-10-10), Chromium hands a pan
// to the STRIP from about 37–40° off vertical, and in the band a 45° split
// let go of, the follower wrote the strip 67 times against the finger after a
// chip tap; iOS Safari's split was not measured. So, ENGINE-AGNOSTIC, THE HAND,
// WHATEVER THE AXIS SAID: while a finger is down, a scroll of the strip that
// is not this follower's own write is a hand on the strip, whatever the
// judgement — the hand is taken back, any glide cancelled, and nothing is
// written until it lets go. (A mouse never pans, and a pen's pan ends its
// press with its own `pointercancel`.) On resuming,
// an item that became current while
// the hand was on the strip is followed, smoothly; if none did, the strip
// stays where the hand left it — following again would be the strip
// snatching back what the visitor just looked at (THE STRIP MOVES ONLY ON A
// SELECTION CHANGE). The follower's own scroll
// events never count as a hand: a scroll event arrives a frame AFTER the write
// that caused it, so one that finds the strip still where this follower last
// put it is that write's, whenever it lands — even after a press; only a
// scroll that MOVED the strip, while a hand is down or after it while
// following is suspended, is the hand's.
//
// ── THE KEYBOARD — NEVER SLIDE A FOCUSED ITEM AWAY (the planner, 2026-10-09).
// While the strip holds a focus the KEYBOARD made, following is paused as it
// is under a hand: a change of current item is remembered, never drawn.
// Otherwise a page scrolled by the arrow keys while a chip holds focus would
// slide the focused chip off screen. lib/sticky-rail's ONLY THE KEYBOARD'S
// FOCUS IS ANSWERED, the same question asked the same way: at `focusin` the
// focused element is asked `:focus-visible` — false for a focus a pointer
// made (Chromium focuses a link on mousedown), true for every Tab — and an
// engine too old for the selector, which throws on it, pauses on every focus
// (Safari before 15.4, where a tap never focuses a link anyway). `focusin` is
// authoritative: a pointer's focus inside the strip ends a keyboard pause. A
// glide in flight when the keyboard arrives is cancelled, and remembered as
// a change still to draw. Following resumes on a `focusout` that LEAVES the
// strip — not one that moves to another chip, and not a window's blur, inside
// which `document.activeElement` is still the chip (the discriminator
// PriceMenu's arrival stamp measured, G2 a11y F1 + typescript M1) — and then
// draws the change it missed, if one arrived.
//
// ── THE KEYBOARD'S REVEAL — NEAREST, INSIDE THE SCROLL PADDING (the planner,
// 2026-10-09). The engines never scroll a PARTLY visible focused element into
// view sideways — Blink's element.cc sets `align_x->rect_partial = kNoScroll`
// on purpose ("This mostly matches behavior in WebKit and Gecko") — so a Tab
// could stop on a chip cut at the screen's edge: MEASURED, 2 to 5 of 11 stops
// on the built page. So on a focus the KEYBOARD made (THE KEYBOARD's
// question) the follower moves the strip AS LITTLE AS NEEDED for the whole
// chip to sit inside the strip's visible box less its computed
// `scroll-padding-inline`: a start left of that inner box goes to its left
// edge, an end right of it to its right edge, a chip wider than it is placed
// by the same rules in the FULL visible box (so a chip enlarged by a text
// zoom keeps its end on screen), a chip already inside moves nothing
// (nearestScrollLeft below). It
// glides on the chip's own `--fade` like a follow, jumps under reduced
// motion, runs WHILE the keyboard pauses following (the visitor's own act,
// where a pause holds the CURRENT chip still) and never under a hand; a
// pointer's focus never reveals. THE SPLIT, the research's reasoning:
// CENTRED for a selection that comes from OUTSIDE the strip — the page's
// scroll moves the current chip, and the chip in the middle keeps both its
// neighbours in sight (THE RULE); NEAREST for a movement made INSIDE the
// strip — the visitor is looking at the chips, and the least movement keeps
// what they see in place (MUI's scrollSelectedIntoView, Material Web's edge
// margin). THE ENGINES' OWN REVEAL IS PRE-EMPTED: an entirely hidden chip IS
// scrolled by the engine — CENTRED, and at once — MEASURED (strip lab,
// Chromium 151 and WebKit 26.5): Chromium scrolls BEFORE `focusin` fires,
// WebKit after the task and before the next frame. Either would turn a walk
// to the right into glide, jump, glide, jump (a chip revealed with its end on
// the inner edge leaves the next one, a gap further, wholly outside). So the
// reveal writes its target AT ONCE in `focusin` — WebKit's reveal then finds
// the chip inside and moves nothing, and Chromium's is overwritten in the same
// task — and in the next frame, before it paints, puts the strip back where
// the visitor SAW it and glides from there: the engine's position is never
// drawn. "Where the visitor saw it" is tracked here, not read in `focusin`
// (Chromium has already moved the strip by then): the strip's own scroll
// events and this follower's drawn writes keep it, and a reveal still waiting
// for its frame has drawn nothing yet.
//
// ── NEVER MOVES THE PAGE. The only write is the strip's `scrollLeft`; this
// module calls no `scrollTo`, no `scrollBy`, no `scrollIntoView`, touches no
// `scrollTop` and cancels no event — the source fence holds it.
//
// ── THE ITEM IS ITS LINK: an item is found as the strip's `a[href="#<id>"]` —
// the fragment link the menu already renders for it, so the id that names the
// current item (lib/scroll-spy's answer) is the only key, and no attribute is
// invented to find it. An item that is not in the strip is skipped.
//
// ── CONSTRUCTION IS PURE; start() IS THE FIRST BROWSER TOUCH (the lib/
// scroll-spy and lib/sticky-rail shape): createStripFollow() validates its
// options and touches nothing — it runs in Node during the static export —
// start() finds the strip by id and attaches the listeners and the observer
// (and takes a keyboard focus already inside the strip as a pause — a remount
// under Fast Refresh while a chip holds it),
// follow() is a no-op outside start()…dispose(), and dispose() cancels the
// glide, a reveal waiting for its frame, the quiet timer, the gate's frames,
// its ceiling and its wait for a resting pointer, every listener and the
// observer, re-entrantly, and
// start() works again afterwards (React re-runs an island's effect on Fast
// Refresh, and in Strict Mode).
//
// WHY THE IMPORT ABOVE SAYS `.ts`: the ring's plain-Node promise — see
// lib/clock/clock.ts's "WHY THE IMPORTS ABOVE SAY `.ts`" paragraph.

/** The quiet time that ends a hand's scrolling, in milliseconds — lib/scroll-
 *  spy's DEFAULT_SETTLE_MS, for the same reason: a scroll still streaming
 *  events every frame is still moving, and 150ms without one means it has
 *  stopped. */
export const DEFAULT_QUIET_MS = 150;

/** The glide's duration where the target item's `--fade` cannot be read — the
 *  system's own 400ms (ui/Button, ui/Card, ui/PillButton). */
export const DEFAULT_FADE_MS = 400;

/** How long THE BROWSER'S FRAGMENT JUMP GOES FIRST waits for the document's
 *  `load`, in milliseconds after start(), before it behaves as if the load
 *  had come (the header's THE CEILING): a load that never completes must not
 *  leave the strip unplaced for good. KEEP-IN-SYNC with lib/scroll-spy's
 *  LOAD_WAIT_CEILING_MS — a deep link's card and its chip wait for the same
 *  load and give up on it together; strip-follow.test pins the two equal. */
export const GATE_CEILING_MS = 10_000;

/** How far a finger must travel before a press on the strip is judged a pan
 *  ACROSS the strip or ALONG the page (THE HAND), in CSS pixels — under it no
 *  pan has begun: a tap, a wobble. Judged ONCE. KEEP-IN-SYNC with
 *  lib/scroll-spy's DECIDE_PX, which judges the same gesture for the page's
 *  pin; strip-follow.test pins the two equal. */
export const DECIDE_PX = 10;

/** THE CLEARLY VERTICAL PAN (THE HAND): a finger's pan lets go of the strip
 *  only when its sideways travel is at most this share of its vertical
 *  travel — within 35° of vertical (tan 35° ≈ 0.700); anything flatter is
 *  the strip's. MEASURED (the G2 re-review, 2026-10-10, Chromium): the engine
 *  hands a pan to the STRIP from about 37–40° off vertical, so the 45° split
 *  this replaced let go of pans the strip then took. iOS Safari's own split
 *  was NOT measured. KEEP-IN-SYNC with lib/scroll-spy's VERTICAL_PAN_RATIO,
 *  which judges the same finger for the page's pin; strip-follow.test pins
 *  the two equal. */
export const VERTICAL_PAN_RATIO = 0.7;

/** The longest the gate waits for a pointer resting on the strip to leave it
 *  (the header's A RESTING POINTER), in milliseconds after its LAST move over
 *  the strip — every move restarts it, so a dwell clicker (eye gaze, a head
 *  pointer) or a slow aimer clicks where it aimed (G2 a11y, 2026-10-10). */
export const HOVER_WAIT_MAX_MS = 2_000;

export type StripFollowOptions = Readonly<{
  /** The strip element's `id` — the scrolling box whose `a[href="#…"]`
   *  children are the items — looked up at start(). Non-blank. */
  id: string;
  /** Quiet time after the hand's last scroll event that resumes following, in
   *  milliseconds: finite, at least 1, at most 2_147_483_647 (setTimeout's
   *  ceiling). @default DEFAULT_QUIET_MS */
  quietMs?: number;
}>;

/** The follower's public surface — a lifecycle and the one instruction. */
export type StripFollow = Readonly<{
  /** First browser touch: find the strip by id, attach the listeners and the
   *  observer. Idempotent while started; a no-op without a browser or without
   *  the element. */
  start(): void;
  /** Keep the item whose link points at `#itemId` in view — centred, clamped
   *  (THE RULE), gliding on the item's own clock (THE MOTION), or remembered
   *  while a hand is on the strip (THE HAND) or a keyboard focus is in it
   *  (THE KEYBOARD). Places synchronously, so a caller in a layout effect
   *  places before the browser paints (INSTANT) — except while the URL had a
   *  fragment at start(), when nothing is written until the browser's own
   *  jump has been made (THE BROWSER'S FRAGMENT JUMP GOES FIRST). `null` —
   *  nothing is current — leaves the strip where it is. A no-op outside
   *  start()…dispose(). */
  follow(itemId: string | null): void;
  /** Cancel the glide, the timers, the gate's waits, every listener and the
   *  observer, and forget the item. Re-entrant; start() works again
   *  afterwards. */
  dispose(): void;
}>;

/** The four numbers THE RULE needs, all in CSS pixels along the strip's
 *  scrolling axis. */
export type StripGeometry = Readonly<{
  /** Where the item starts in the strip's SCROLLED content: the strip's
   *  `scrollLeft` plus the item's offset from the strip's visible start. */
  itemStart: number;
  /** The item's width. */
  itemSize: number;
  /** The strip's visible width (`clientWidth`). */
  viewportSize: number;
  /** The strip's scrollable width (`scrollWidth`). */
  scrollSize: number;
}>;

/**
 * THE RULE: the `scrollLeft` that centres the item in the strip's visible
 * box, clamped to [0, scrollSize − viewportSize] — the start for the first
 * items, the end for the last, never past either.
 */
export function centredScrollLeft({
  itemStart,
  itemSize,
  viewportSize,
  scrollSize,
}: StripGeometry): number {
  const max = Math.max(0, scrollSize - viewportSize);
  const ideal = itemStart + itemSize / 2 - viewportSize / 2;
  return Math.min(max, Math.max(0, ideal));
}

/** What THE KEYBOARD'S REVEAL needs beyond THE RULE's four numbers: where the
 *  strip is, and its scroll padding at either end — all CSS pixels. */
export type StripReveal = StripGeometry &
  Readonly<{
    /** Where the strip is now (`scrollLeft`). */
    scrollLeft: number;
    /** The strip's computed `scroll-padding-inline-start`. */
    paddingStart: number;
    /** The strip's computed `scroll-padding-inline-end`. */
    paddingEnd: number;
  }>;

/**
 * THE KEYBOARD'S REVEAL: the `scrollLeft` that moves the strip AS LITTLE AS
 * NEEDED for the whole item to sit inside its visible box less its scroll
 * padding — a start left of that inner box onto its start edge, an end right
 * of it onto its end edge, an item wider than it with its start on the start
 * edge, an item already inside where the strip is — clamped to [0,
 * scrollSize − viewportSize]. AN ITEM WIDER THAN THE PADDED BOX is placed in
 * the FULL visible box instead, by the same three rules (G2 a11y, 2026-10-09:
 * at 200% text-only zoom „Kieferorthopädie" is ≈370px against a 312px inner
 * box, and aligning its start inside the padding left its end off screen;
 * inside the 390px window it fits whole). IN WHOLE PIXELS, rounded so the
 * item is never short of its edge (down for a start, up for an end): WebKit
 * holds a scroll position in whole pixels, and a fractional target lost its
 * fraction the wrong way — MEASURED on the built page, a chip 0.67px past the
 * inner edge.
 */
export function nearestScrollLeft({
  itemStart,
  itemSize,
  viewportSize,
  scrollSize,
  scrollLeft,
  paddingStart,
  paddingEnd,
}: StripReveal): number {
  const max = Math.max(0, scrollSize - viewportSize);
  const wide = itemSize > viewportSize - paddingStart - paddingEnd;
  const startEdge = wide ? 0 : paddingStart;
  const endEdge = wide ? 0 : paddingEnd;
  const innerStart = scrollLeft + startEdge;
  const innerEnd = scrollLeft + viewportSize - endEdge;
  const itemEnd = itemStart + itemSize;
  let to = scrollLeft;
  if (itemSize > innerEnd - innerStart || itemStart < innerStart) {
    to = Math.floor(itemStart - startEdge);
  } else if (itemEnd > innerEnd) {
    to = Math.ceil(itemEnd - (viewportSize - endEdge));
  }
  return Math.min(max, Math.max(0, to));
}

/**
 * A `--fade` value as milliseconds: "400ms" → 400, "0.4s" → 400. Anything
 * else — empty, a keyword, a negative (the pattern takes no sign) or a
 * non-finite number — is DEFAULT_FADE_MS, so an item that lost its clock
 * still glides on the system's own.
 */
export function fadeMs(value: string): number {
  const match = /^\s*(\d*\.?\d+)\s*(ms|s)\s*$/i.exec(value);
  if (match === null) return DEFAULT_FADE_MS;
  const amount = Number(match[1]) * (match[2].toLowerCase() === 's' ? 1000 : 1);
  return Number.isFinite(amount) ? amount : DEFAULT_FADE_MS;
}

/**
 * A CSS `cubic-bezier(x1, y1, x2, y2)` as a function of progress: x in
 * [0, 1] → y. The curve's x is solved for the progress by Newton's method,
 * falling back to bisection where the slope is too flat to trust — the
 * same approach the engines' own timing functions take — so the tween eases
 * on the curve the browser draws the colour fade with.
 */
function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (progress: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number): number => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number): number => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number): number => (3 * ax * t + 2 * bx) * t + cx;
  const solveX = (x: number): number => {
    let t = x;
    for (let i = 0; i < 8; i += 1) {
      const error = sampleX(t) - x;
      if (Math.abs(error) < 1e-7) return t;
      const slope = slopeX(t);
      if (Math.abs(slope) < 1e-6) break;
      t -= error / slope;
    }
    let low = 0;
    let high = 1;
    t = x;
    while (high - low > 1e-7) {
      const value = sampleX(t);
      if (Math.abs(value - x) < 1e-7) return t;
      if (value < x) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return t;
  };
  return (progress: number): number => {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    return sampleY(solveX(progress));
  };
}

/** CSS `ease-in-out`, exactly: cubic-bezier(0.42, 0, 0.58, 1) — the curve
 *  ui/PillButton's colours fade on (THE MOTION). */
export const easeInOut = cubicBezier(0.42, 0, 0.58, 1);

/** setTimeout's ceiling: 2^31 − 1 ms (lib/clock argues the bound in full). */
const MAX_DELAY_MS = 2_147_483_647;

/** Under half a pixel the strip is where it should be: nothing to move. */
const STILL_PX = 0.5;

/** The resting pointer's watch listens in the capture phase, passively — it
 *  must hear a press or a move wherever it lands, and cancels nothing. */
const CAPTURE = { capture: true, passive: true } as const;

/** A computed CSS length in pixels; anything unreadable (`auto`) is 0. */
function cssPixels(value: string): number {
  const pixels = parseFloat(value);
  return Number.isNaN(pixels) ? 0 : pixels;
}

/**
 * Build a follower. Touches nothing until start().
 *
 * @throws when `id` is blank — a strip that cannot be found would never move,
 * silently — or when `quietMs` is not a finite number of milliseconds inside
 * setTimeout's own range.
 */
export function createStripFollow(options: StripFollowOptions): StripFollow {
  const { id, quietMs = DEFAULT_QUIET_MS } = options;

  if (id.trim() === '') {
    throw new RangeError(
      `createStripFollow: id must be a non-blank element id (received ${id === '' ? 'an empty' : 'a blank'} one). A strip that cannot be found would never follow, silently.`,
    );
  }
  if (!(Number.isFinite(quietMs) && quietMs >= 1 && quietMs <= MAX_DELAY_MS)) {
    throw new RangeError(
      `createStripFollow: quietMs must be a finite number of milliseconds, at least 1 and at most ${MAX_DELAY_MS} (received ${String(quietMs)}). Omit it to inherit DEFAULT_QUIET_MS.`,
    );
  }

  let started = false;
  let strip: HTMLElement | null = null;
  /** The item last asked for — null while nothing is current. */
  let target: string | null = null;
  /** Has the strip shown the target since it was last displayed? */
  let placed = false;
  /** A hand is on the strip (THE HAND). */
  let held = false;
  /** Following is suspended: a hand, or the scrolling it left behind. */
  let suspended = false;
  /** Did the strip scroll while the hand was down? */
  let movedWhileHeld = false;
  /** The strip holds a focus the KEYBOARD made (THE KEYBOARD). */
  let keyboard = false;
  /** Did an item become current while following was paused? */
  let pending = false;
  /** The strip's client size at the observer's last delivery. */
  let lastWidth = -1;
  let lastHeight = -1;
  /** Where this follower last put the strip — a scroll event that finds it
   *  still there is this follower's own, delivered a frame after the write,
   *  and never the hand's (THE HAND's last sentence). */
  let lastWritten: number | null = null;
  /** Where the visitor last SAW the strip (THE KEYBOARD'S REVEAL): its scroll
   *  events and this follower's drawn writes keep it; a pre-empting write,
   *  which no frame draws, does not. */
  let shown = 0;
  let quietTimer: ReturnType<typeof setTimeout> | undefined;
  let frame: number | undefined;
  /** What the running glide is for: a FOLLOW (the current chip) or a REVEAL
   *  (a keyboard focus) — only an interrupted follow is a change still to
   *  draw. */
  let gliding: 'follow' | 'reveal' | null = null;
  /** A keyboard reveal waiting for the frame that draws it, and where the
   *  strip stood on screen when it was asked for. */
  let revealFrame: number | undefined;
  let revealOrigin = 0;
  let observer: ResizeObserver | undefined;
  // THE BROWSER'S FRAGMENT JUMP GOES FIRST (the header).
  /** May the follower write the strip yet? Closed by start() while the URL
   *  has a fragment, until the document has loaded and drawn a frame — and,
   *  briefly, a pointer that moved onto the strip has left it. */
  let gateOpen = true;
  /** The frame callback that opens the gate, while it waits. */
  let gateFrame: number | undefined;
  /** THE CEILING's timer, while the gate waits for `load`. */
  let ceilingTimer: ReturnType<typeof setTimeout> | undefined;
  /** The gate waits for a pointer resting on the strip to leave it. */
  let waitingForLeave = false;
  /** The wait's bound (HOVER_WAIT_MAX_MS), while it runs. */
  let hoverTimer: ReturnType<typeof setTimeout> | undefined;
  /** Has a hovering pointer MOVED over the strip since start()? Only such a
   *  pointer can be aiming at a chip — one parked there before the page
   *  loaded is not. */
  let aimed = false;
  /** Did THE CEILING open the gate? Then no resting pointer is waited for. */
  let ceilingFired = false;
  /** Did the strip SCROLL while the gate was closed, with the current item
   *  unchanged since? Then the gate opens without placing: the strip stays
   *  where the visitor put it. Set by the strip's own scroll events — never
   *  by a press — and cleared by a new current item. */
  let scrolledWhileClosed = false;
  /** A finger's press on the strip: where it began, and — once it has
   *  travelled DECIDE_PX — whether it pans ACROSS the strip, i.e. anything
   *  but CLEARLY vertical (THE HAND). */
  let gesture: { x: number; y: number; sideways: boolean | null } | null = null;
  /** A finger is down on the strip, from its `touchstart` to the last
   *  `touchend` (THE HAND, WHATEVER THE AXIS SAID). */
  let fingerDown = false;

  /** The strip has a box to scroll — `clientWidth` 0 while it is hidden. */
  function displayed(): boolean {
    return strip !== null && strip.clientWidth > 0;
  }

  /** Following is paused: a hand, the scrolling it left behind (THE HAND), or
   *  a keyboard focus in the strip (THE KEYBOARD). */
  function paused(): boolean {
    return held || suspended || keyboard;
  }

  /** The item whose link points at `#itemId`, inside the strip. */
  function itemOf(itemId: string): HTMLElement | null {
    if (strip === null) return null;
    const fragment =
      typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(itemId)
        : itemId.replace(/["\\]/g, '\\$&');
    return strip.querySelector<HTMLElement>(`a[href="#${fragment}"]`);
  }

  /** THE RULE, measured: the strip's `scrollLeft` that centres `item`. */
  function centreOf(box: HTMLElement, item: HTMLElement): number {
    const stripRect = box.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    return centredScrollLeft({
      itemStart:
        box.scrollLeft + (itemRect.left - (stripRect.left + box.clientLeft)),
      itemSize: itemRect.width,
      viewportSize: box.clientWidth,
      scrollSize: box.scrollWidth,
    });
  }

  /** THE KEYBOARD'S REVEAL, measured: the strip's `scrollLeft` that shows
   *  all of `item` inside its scroll padding, seen from `from`. */
  function nearestOf(
    box: HTMLElement,
    item: HTMLElement,
    from: number,
  ): number {
    const style = getComputedStyle(box);
    const stripRect = box.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    return nearestScrollLeft({
      itemStart:
        box.scrollLeft + (itemRect.left - (stripRect.left + box.clientLeft)),
      itemSize: itemRect.width,
      viewportSize: box.clientWidth,
      scrollSize: box.scrollWidth,
      scrollLeft: from,
      paddingStart: cssPixels(style.scrollPaddingLeft),
      paddingEnd: cssPixels(style.scrollPaddingRight),
    });
  }

  function cancelGlide(): void {
    gliding = null;
    if (frame === undefined) return;
    cancelAnimationFrame(frame);
    frame = undefined;
  }

  function cancelReveal(): void {
    if (revealFrame === undefined) return;
    cancelAnimationFrame(revealFrame);
    revealFrame = undefined;
  }

  function clearQuiet(): void {
    if (quietTimer === undefined) return;
    clearTimeout(quietTimer);
    quietTimer = undefined;
  }

  /** The ONE write: the strip's own `scrollLeft`, remembered as this
   *  follower's — what the strip then really holds (an engine may round) —
   *  and, unless it is a pre-emption no frame will draw, as what the visitor
   *  sees. */
  function write(box: HTMLElement, left: number, drawn = true): void {
    box.scrollLeft = left;
    lastWritten = box.scrollLeft;
    if (drawn) shown = lastWritten;
  }

  /** Put the strip at `to` now. */
  function jump(box: HTMLElement, to: number): void {
    cancelGlide();
    if (Math.abs(box.scrollLeft - to) >= STILL_PX) write(box, to);
  }

  /** THE MOTION: glide the strip to `to` over `durationMs`, on ease-in-out,
   *  from wherever it is now — a FOLLOW or a REVEAL (`kind`). */
  function glide(
    box: HTMLElement,
    to: number,
    durationMs: number,
    kind: 'follow' | 'reveal',
  ): void {
    cancelGlide();
    const from = box.scrollLeft;
    if (Math.abs(to - from) < STILL_PX) return;
    if (!(durationMs > 0)) {
      write(box, to);
      return;
    }
    gliding = kind;
    let startedAt: number | undefined;
    const step = (now: number): void => {
      startedAt ??= now;
      const progress = Math.min(1, Math.max(0, (now - startedAt) / durationMs));
      write(box, from + (to - from) * easeInOut(progress));
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        frame = undefined;
        gliding = null;
      }
    };
    frame = requestAnimationFrame(step);
  }

  /**
   * Show the target: a jump for the first placement, a size change and
   * reduced motion (INSTANT, WHERE A MOVEMENT WOULD SAY NOTHING), a glide on
   * the item's own clock otherwise.
   */
  function place(smoothly: boolean): void {
    const box = strip;
    if (box === null || target === null) return;
    // THE BROWSER'S FRAGMENT JUMP GOES FIRST: nothing is written until the
    // gate opens, which places the target then (openGate).
    if (!gateOpen) return;
    if (!displayed()) {
      placed = false;
      cancelGlide();
      return;
    }
    const item = itemOf(target);
    if (item === null) return;
    const to = centreOf(box, item);
    if (!placed || !smoothly || prefersReducedMotion()) {
      jump(box, to);
      placed = true;
      return;
    }
    glide(
      box,
      to,
      fadeMs(getComputedStyle(item).getPropertyValue('--fade')),
      'follow',
    );
  }

  /**
   * THE KEYBOARD'S REVEAL (the header): the focused `item` wholly inside the
   * strip's scroll padding, the strip moved as little as needed — a jump under
   * reduced motion, otherwise a glide from where the visitor SAW the strip,
   * the engine's own reveal pre-empted and never drawn.
   */
  function reveal(item: HTMLElement): void {
    const box = strip;
    // While the gate is closed the engine's own reveal is the only one: a
    // write of ours would cost the page its fragment jump.
    if (box === null || !displayed() || held || !gateOpen) return;
    // A reveal still waiting for its frame has drawn nothing yet.
    const origin = revealFrame !== undefined ? revealOrigin : shown;
    cancelReveal();
    cancelGlide();
    const to = nearestOf(box, item, origin);
    if (prefersReducedMotion()) {
      jump(box, to);
      return;
    }
    if (Math.abs(to - origin) < STILL_PX) {
      // Inside already — undo an engine that scrolled anyway.
      if (Math.abs(box.scrollLeft - origin) >= STILL_PX) write(box, origin);
      return;
    }
    // The target AT ONCE: WebKit's reveal, still to come, then finds the chip
    // inside, and Chromium's, already done, is overwritten in this same task.
    write(box, to, false);
    revealOrigin = origin;
    revealFrame = requestAnimationFrame(() => {
      revealFrame = undefined;
      // Before this frame paints: back where the visitor saw it, and glide.
      write(box, origin);
      glide(
        box,
        to,
        fadeMs(getComputedStyle(item).getPropertyValue('--fade')),
        'reveal',
      );
    });
  }

  function follow(itemId: string | null): void {
    if (!started) return;
    const changed = itemId !== target;
    // A new current item: a scroll of the strip while the gate was closed no
    // longer says where the visitor wants it (THE BROWSER'S FRAGMENT JUMP
    // GOES FIRST)…
    if (changed) scrolledWhileClosed = false;
    target = itemId;
    // …and a pointer resting on the strip is waited for no longer: the page
    // has moved on under it (A RESTING POINTER). The gate opens, and places.
    if (changed && waitingForLeave) {
      endWait();
      return;
    }
    if (itemId === null) return;
    if (paused()) {
      pending = true;
      return;
    }
    place(true);
  }

  /** Draw the change that arrived while following was paused — if one did,
   *  and once nothing pauses it any more (THE STRIP MOVES ONLY ON A SELECTION
   *  CHANGE: without one, the strip stays where it was left). */
  function drawPending(): void {
    // A closed gate spends nothing: the change waits for the gate, which
    // decides it (openNow).
    if (paused() || !pending || !gateOpen) return;
    pending = false;
    place(true);
  }

  // ── THE HAND (the header).

  function suspend(): void {
    suspended = true;
    cancelReveal();
    cancelGlide();
    clearQuiet();
  }

  function resume(): void {
    quietTimer = undefined;
    if (held) return;
    suspended = false;
    drawPending();
  }

  function armQuiet(): void {
    clearQuiet();
    quietTimer = setTimeout(resume, quietMs);
  }

  function onHandDown(): void {
    held = true;
    movedWhileHeld = false;
    suspend();
  }

  /** A finger lands on the strip: a hand, and the start of a gesture whose
   *  axis is judged once it has travelled DECIDE_PX. */
  function onTouchStart(event: TouchEvent): void {
    fingerDown = true;
    const touch = event.touches.length === 1 ? event.touches[0] : undefined;
    gesture =
      touch === undefined
        ? null
        : { x: touch.clientX, y: touch.clientY, sideways: null };
    onHandDown();
  }

  /** THE HAND'S AXIS, judged once: a pan CLEARLY along the page — within 35°
   *  of vertical — lets go at once, so the strip follows live under it;
   *  anything flatter is a pan ACROSS the strip, and keeps following
   *  suspended. */
  function onTouchMove(event: TouchEvent): void {
    if (gesture === null || gesture.sideways !== null || !held) return;
    const touch = event.touches.length === 1 ? event.touches[0] : undefined;
    if (touch === undefined) {
      // A second finger: a pinch, the page's zoom — no pan to judge.
      gesture = null;
      return;
    }
    const dx = touch.clientX - gesture.x;
    const dy = touch.clientY - gesture.y;
    // Not a pan yet: a tap, a wobble — nothing to judge.
    if (Math.hypot(dx, dy) < DECIDE_PX) return;
    gesture.sideways = Math.abs(dx) > VERTICAL_PAN_RATIO * Math.abs(dy);
    if (gesture.sideways) return;
    // Along the page: the finger scrolls the PAGE, not the strip.
    held = false;
    movedWhileHeld = false;
    suspended = false;
    clearQuiet();
    drawPending();
  }

  function onHandUp(): void {
    if (!held) return;
    held = false;
    if (movedWhileHeld) armQuiet();
    else resume();
  }

  /** A mouse or a pen lets go; a finger's own release is its touch events'. */
  function onPointerUp(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    onHandUp();
  }

  function onTouchEnd(event: TouchEvent): void {
    if (event.touches.length > 0) return;
    fingerDown = false;
    gesture = null;
    onHandUp();
  }

  /** Only a SIDEWAYS wheel is a hand on the strip: |deltaX| > |deltaY|, or
   *  Shift held (every engine turns it sideways). A vertical wheel over the
   *  stuck strip scrolls the PAGE, and must not pause the follower (G2
   *  typescript, 2026-10-09). */
  function onWheel(event: WheelEvent): void {
    if (!(Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey)) {
      return;
    }
    suspend();
    armQuiet();
  }

  function onStripScroll(): void {
    const box = strip;
    // What the visitor is about to see this frame (THE KEYBOARD'S REVEAL).
    if (box !== null) shown = box.scrollLeft;
    // This follower's own write, delivered a frame late: the strip is still
    // where it was put, so no hand moved it.
    if (
      box !== null &&
      lastWritten !== null &&
      Math.abs(box.scrollLeft - lastWritten) < 1
    ) {
      return;
    }
    // The strip moved while the gate was closed — a hand, a wheel, the
    // engine's own reveal of a chip a Tab reached: where the visitor wants it.
    if (!gateOpen) scrolledWhileClosed = true;
    // THE HAND, WHATEVER THE AXIS SAID: the strip moving under a finger that
    // is still down — and not by this follower — is a hand on the strip, even
    // after its pan was judged the page's: take it back, cancel any glide,
    // write nothing until it lets go.
    if (fingerDown && !held) {
      held = true;
      suspend();
    }
    if (held) {
      movedWhileHeld = true;
      return;
    }
    if (suspended) armQuiet();
  }

  // ── THE KEYBOARD (the header).

  /**
   * Did the KEYBOARD make this focus? lib/sticky-rail's question, asked its
   * way: `:focus-visible` is the engine's own answer at the moment of
   * `focusin` — false for a pointer's focus, true for every Tab.
   */
  function keyboardMade(element: Element): boolean {
    try {
      return element.matches(':focus-visible');
    } catch {
      // An engine too old for the selector throws on it (Safari before
      // 15.4, where a tap never focuses a link): pause on every focus.
      return true;
    }
  }

  function onFocusIn(event: FocusEvent): void {
    const element = event.target;
    if (!(element instanceof Element)) return;
    if (!keyboardMade(element)) {
      // A pointer's focus pauses nothing and reveals nothing — and ends a
      // keyboard pause before it.
      if (!keyboard) return;
      keyboard = false;
      drawPending();
      return;
    }
    if (!keyboard) {
      keyboard = true;
      // A FOLLOW the keyboard interrupts is a change still to draw.
      if (gliding === 'follow') {
        cancelGlide();
        pending = true;
      }
    }
    // A keyboard focus ends a resting pointer's wait — the visitor is on the
    // keys — and the gate, opening, reveals this chip (A RESTING POINTER).
    if (waitingForLeave) {
      endWait();
      return;
    }
    // THE KEYBOARD'S REVEAL: the focused chip, whole — while the pause holds
    // the current chip still.
    const item = element.closest('a[href^="#"]');
    if (item instanceof HTMLElement && strip?.contains(item) === true) {
      reveal(item);
    }
  }

  function onFocusOut(event: FocusEvent): void {
    const box = strip;
    if (!keyboard || box === null) return;
    // Focus moving on to another chip: still the keyboard's strip.
    const next = event.relatedTarget;
    if (next instanceof Node && box.contains(next)) return;
    // A window's blur: the chip is still the document's active element, and
    // focuses again the moment the visitor comes back.
    if (box.contains(document.activeElement)) return;
    keyboard = false;
    drawPending();
  }

  /** The strip's size changed — shown, hidden, rotated, resized, zoomed, its
   *  text enlarged: re-place the target at once, cancelling a glide in flight,
   *  unless following is paused (INSTANT, in the header). */
  function onResize(): void {
    const box = strip;
    if (box === null) return;
    const width = box.clientWidth;
    const height = box.clientHeight;
    if (width === lastWidth && height === lastHeight) return;
    lastWidth = width;
    lastHeight = height;
    if (!displayed()) {
      placed = false;
      cancelReveal();
      cancelGlide();
      return;
    }
    if (paused()) return;
    cancelGlide();
    place(false);
  }

  // ── THE BROWSER'S FRAGMENT JUMP GOES FIRST (the header).

  function clearCeiling(): void {
    if (ceilingTimer === undefined) return;
    clearTimeout(ceilingTimer);
    ceilingTimer = undefined;
  }

  /** A pointer RESTING on the strip, on a device whose pointer hovers: the
   *  chips would jump under it (the header's A RESTING POINTER). */
  function pointerRests(box: HTMLElement): boolean {
    return window.matchMedia('(hover: hover)').matches && box.matches(':hover');
  }

  /** The frame after the load's: THE GATE OPENS — or waits, briefly, for a
   *  pointer that moved over the strip and rests on it to leave it; never
   *  after THE CEILING (ten seconds is wait enough). */
  function openGate(): void {
    gateFrame = undefined;
    const box = strip;
    if (box !== null && aimed && !ceilingFired && pointerRests(box)) {
      waitForLeave(box);
      return;
    }
    openNow();
  }

  /** THE GATE OPENS (the header): a chip holding a keyboard focus is
   *  revealed, then the current item is placed AT ONCE, as a first placement
   *  is (INSTANT) — unless the strip scrolled while the gate was closed and
   *  the current item has stayed the same since (then the strip stays where
   *  the visitor put it), or a hand or a keyboard focus pauses following
   *  (then it is a change to draw when they let go). */
  function openNow(): void {
    gateOpen = true;
    const kept = scrolledWhileClosed;
    scrolledWhileClosed = false;
    revealKeyboardFocus();
    if (target === null || kept) {
      // The strip has been on screen where the visitor put it, so a later
      // change GLIDES from there (THE MOTION), never jumps as a first one.
      if (kept && displayed()) placed = true;
      pending = false;
      return;
    }
    if (paused()) {
      pending = true;
      return;
    }
    pending = false;
    place(false);
  }

  /** A chip holding a KEYBOARD focus as the gate opens is revealed once — as
   *  its own `focusin` would have revealed it, had the gate been open. */
  function revealKeyboardFocus(): void {
    const box = strip;
    if (!keyboard || box === null) return;
    const active = document.activeElement;
    const item =
      active instanceof Element ? active.closest('a[href^="#"]') : null;
    if (item instanceof HTMLElement && box.contains(item)) reveal(item);
  }

  /** A RESTING POINTER IS WAITED FOR — BRIEFLY (the header): until it leaves
   *  the strip, a finger or a press elsewhere, a new current item (follow), a
   *  key or a keyboard focus (onFocusIn), or HOVER_WAIT_MAX_MS. */
  function waitForLeave(box: HTMLElement): void {
    if (waitingForLeave) return;
    waitingForLeave = true;
    box.addEventListener('pointerleave', endWait);
    window.addEventListener('pointerdown', onPointerElsewhere, CAPTURE);
    window.addEventListener('pointermove', onPointerElsewhere, CAPTURE);
    window.addEventListener('keydown', endWait, CAPTURE);
    hoverTimer = setTimeout(endWait, HOVER_WAIT_MAX_MS);
  }

  function stopWaitingForLeave(): void {
    if (!waitingForLeave) return;
    waitingForLeave = false;
    strip?.removeEventListener('pointerleave', endWait);
    window.removeEventListener('pointerdown', onPointerElsewhere, CAPTURE);
    window.removeEventListener('pointermove', onPointerElsewhere, CAPTURE);
    window.removeEventListener('keydown', endWait, CAPTURE);
    clearTimeout(hoverTimer);
    hoverTimer = undefined;
  }

  /** The wait ends, whichever way, and THE GATE OPENS. */
  function endWait(): void {
    stopWaitingForLeave();
    openNow();
  }

  /** A hovering pointer MOVING over the strip may be aiming at a chip (A
   *  RESTING POINTER); a finger never hovers. */
  function onAim(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    aimed = true;
    // Still aiming: the wait's bound runs from the LAST move.
    if (waitingForLeave) {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(endWait, HOVER_WAIT_MAX_MS);
    }
  }

  function onPointerElsewhere(event: PointerEvent): void {
    const box = strip;
    if (box === null) return;
    const onStrip = event.target instanceof Node && box.contains(event.target);
    // The resting pointer itself, moving or pressing on the chips: still on
    // the strip, so still waited for.
    if (onStrip && event.pointerType !== 'touch') return;
    endWait();
  }

  /** Two frames: a callback of the first runs BEFORE that frame's rendering
   *  — where the browser makes its fragment jump — and one of the second
   *  after it, so the gate opens once a frame has been drawn. */
  function openAfterAFrame(): void {
    gateFrame = requestAnimationFrame(() => {
      gateFrame = requestAnimationFrame(openGate);
    });
  }

  function onLoad(): void {
    window.removeEventListener('load', onLoad);
    clearCeiling();
    if (started && !gateOpen) openAfterAFrame();
  }

  /** THE CEILING (the header): the load never came — behave as if it had. */
  function onCeiling(): void {
    ceilingTimer = undefined;
    ceilingFired = true;
    window.removeEventListener('load', onLoad);
    if (started && !gateOpen) openAfterAFrame();
  }

  function start(): void {
    if (started) return;
    // A no-op where there is no browser: the module stays loadable by plain
    // Node (the ring's promise) even though nothing calls start() there.
    if (typeof window === 'undefined') return;
    const element = document.getElementById(id);
    if (element === null) return;
    started = true;
    strip = element;
    lastWidth = element.clientWidth;
    lastHeight = element.clientHeight;
    shown = element.scrollLeft;
    // THE BROWSER'S FRAGMENT JUMP GOES FIRST: while the URL has a fragment,
    // the page is the browser's to land before this strip may be written.
    scrolledWhileClosed = false;
    aimed = false;
    ceilingFired = false;
    fingerDown = false;
    gateOpen = window.location.hash === '';
    if (!gateOpen) {
      if (document.readyState === 'complete') {
        openAfterAFrame();
      } else {
        window.addEventListener('load', onLoad);
        ceilingTimer = setTimeout(onCeiling, GATE_CEILING_MS);
      }
    }
    // A keyboard focus already inside — a remount while a chip holds it.
    const active = document.activeElement;
    keyboard =
      active !== null && element.contains(active) && keyboardMade(active);
    element.addEventListener('pointerdown', onHandDown);
    element.addEventListener('pointermove', onAim, { passive: true });
    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: true });
    element.addEventListener('wheel', onWheel, { passive: true });
    element.addEventListener('scroll', onStripScroll, { passive: true });
    element.addEventListener('focusin', onFocusIn);
    element.addEventListener('focusout', onFocusOut);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    observer = new ResizeObserver(onResize);
    observer.observe(element);
  }

  function dispose(): void {
    cancelReveal();
    cancelGlide();
    clearQuiet();
    clearCeiling();
    stopWaitingForLeave();
    if (gateFrame !== undefined) {
      cancelAnimationFrame(gateFrame);
      gateFrame = undefined;
    }
    window.removeEventListener('load', onLoad);
    if (started && strip !== null) {
      strip.removeEventListener('pointerdown', onHandDown);
      strip.removeEventListener('pointermove', onAim);
      strip.removeEventListener('touchstart', onTouchStart);
      strip.removeEventListener('touchmove', onTouchMove);
      strip.removeEventListener('wheel', onWheel);
      strip.removeEventListener('scroll', onStripScroll);
      strip.removeEventListener('focusin', onFocusIn);
      strip.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      observer?.disconnect();
      observer = undefined;
    }
    started = false;
    strip = null;
    target = null;
    placed = false;
    held = false;
    suspended = false;
    movedWhileHeld = false;
    keyboard = false;
    pending = false;
    lastWidth = -1;
    lastHeight = -1;
    lastWritten = null;
    shown = 0;
    revealOrigin = 0;
    gateOpen = true;
    scrolledWhileClosed = false;
    gesture = null;
    aimed = false;
    ceilingFired = false;
    fingerDown = false;
  }

  return { start, follow, dispose };
}
