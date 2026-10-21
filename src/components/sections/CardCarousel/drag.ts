import type {
  DECIDE_PX,
  VERTICAL_PAN_RATIO,
} from '@/lib/strip-follow/strip-follow';

// sections/CardCarousel/drag — THE HAND, as plain numbers: when a press on the
// stage becomes a drag, how far the ring travels under it, where it lands when
// let go, and how a bounded list resists a pull past its ends. React-free and
// DOM-free; CardCarousel.tsx feeds it pointer coordinates and times, and
// drag.test.ts proves every rule.
//
// Owner, verbatim (2026-10-14): "must be dragable and a smooth thransition form
// one to the other auto rotating" — and, of the second mode, "one with iamges
// left and right with full stop".
//
// ── THE AXIS, judged ONCE (the house's rule, lib/strip-follow's THE HAND):
// nothing is decided until the pointer has travelled DRAG_DECIDE_PX from where
// it pressed — under that it is a tap or a wobble, and a tap on a card's own
// link must still be a click — and then a pan within 35° of vertical
// (|dx| ≤ 0.7 |dy|) belongs to the PAGE, anything flatter to the carousel.
// For a mouse and a pen this judgement decides. On a touch screen the browser
// decides FIRST: the hand's box — the stage's box as it stood before
// CardCarousel.tsx's THE LIFT, and the one that takes the pointer — wears
// `touch-action: pan-y pinch-zoom`, so a pan the browser takes for the page
// arrives here as a `pointercancel` and the ring snaps back. 35° is the
// stricter side of any split a browser makes from there up (lib/strip-follow
// measured Chromium handing a pan to a sideways scroller from about 37–40°
// off vertical): a gesture between the two splits is the page's, never one
// that moves nothing.
//
// ── THE RELEASE. The ring lands on the card nearest to where the hand let go
// — the travel rounded to whole steps — and a short QUICK flick (at least a
// tenth of a step, let go within 300 ms of the press) moves one card in its
// direction even when it travelled under half a step: the "one step for a quick
// flick" of the brief. Anything else snaps back.
//
// ── THE FULL STOP (the bounded mode's ends): a pull past the first or the last
// card moves the ring a third as far as the hand (BOUNDED_RESISTANCE), and the
// release springs it back — the list says "there is no more" with the hand's
// own movement, not with a sound or a jump.

/** How far a press travels before its axis is judged, in CSS pixels.
 *  KEEP-IN-SYNC with lib/strip-follow's DECIDE_PX (drag.test.ts pins the
 *  pair). */
export const DRAG_DECIDE_PX: typeof DECIDE_PX = 10;

/** THE CLEARLY VERTICAL PAN: a press whose sideways travel is at most this
 *  share of its vertical travel — within 35° of vertical — is the page's.
 *  KEEP-IN-SYNC with lib/strip-follow's VERTICAL_PAN_RATIO (drag.test.ts pins
 *  the pair). */
export const DRAG_VERTICAL_RATIO: typeof VERTICAL_PAN_RATIO = 0.7;

/** A flick: let go within this many milliseconds of the press. */
export const FLICK_MS = 300;

/** …having travelled at least this share of a step. Under it, a quick touch
 *  that slid a little is not a request to move. */
export const FLICK_MIN_STEPS = 0.1;

/** How far a bounded ring follows a hand pulling past its ends (THE FULL
 *  STOP): a third of the hand's travel. */
export const BOUNDED_RESISTANCE = 1 / 3;

/** What a press has become: not judged yet, a drag ACROSS the carousel, or a
 *  pan ALONG the page that the carousel lets go. */
export type DragAxis = 'pending' | 'across' | 'along';

/**
 * THE AXIS (the header), from the travel since the press.
 *
 * @param dx sideways travel in CSS pixels.
 * @param dy vertical travel in CSS pixels.
 */
export function judgeAxis(dx: number, dy: number): DragAxis {
  if (Math.hypot(dx, dy) < DRAG_DECIDE_PX) return 'pending';
  return Math.abs(dx) > DRAG_VERTICAL_RATIO * Math.abs(dy) ? 'across' : 'along';
}

/**
 * THE RELEASE (the header): how many cards the ring moves when the hand lets
 * go. Positive moves towards the NEXT card (the hand dragged leftwards).
 *
 * @param travelled the hand's travel in steps, positive towards the next card.
 * @param elapsedMs the time from the press to the release.
 */
export function releaseSteps(travelled: number, elapsedMs: number): number {
  if (!Number.isFinite(travelled)) return 0;
  // Math.round(-0.4) is −0 — but −0 === 0, so it falls through to the flick
  // below, whose answers are ±1 or a plain 0: no −0 ever leaves.
  const steps = Math.round(travelled);
  if (steps !== 0) return steps;
  const quick = elapsedMs <= FLICK_MS;
  return quick && Math.abs(travelled) >= FLICK_MIN_STEPS
    ? Math.sign(travelled)
    : 0;
}

/**
 * THE FULL STOP (the header): where a bounded ring of `count` cards stands
 * when the hand would put it at `place` — itself inside the list, a third of
 * the overshoot past either end.
 */
export function resist(place: number, count: number): number {
  const last = Math.max(0, count - 1);
  if (place < 0) return place * BOUNDED_RESISTANCE;
  if (place > last) return last + (place - last) * BOUNDED_RESISTANCE;
  return place;
}
