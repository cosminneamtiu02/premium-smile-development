import {
  useEffect,
  useState,
  useSyncExternalStore,
  type FocusEvent,
} from 'react';
import { flushSync } from 'react-dom';
import {
  classifyFocusEntry,
  createRotation,
  leavesRegion,
  type Rotation,
  type RotationOptions,
  type RotationStatus,
} from '@/lib/rotation/rotation';

// ui/use-rotation — THE SHARED SHELL of every rotator on this site: the React
// half of lib/rotation's consumption law, written once. Extracted 2026-09-19
// by the hero lane (epic #103), which is the moment the law itself named for
// it: "copied verbatim UNTIL THE SECOND ROTATOR LANE, which extracts the
// shared shell (and decides the shared hook's home) IN THAT SAME LANE"
// (rotation.ts, THE CONSUMPTION RECIPE — org-review F3b/F9, owner-approved
// 2026-09-09). Two consumers — sections/ReviewsCarousel/ReviewsDeck and
// sections/Hero — are what told which lines are the pattern and which were one
// band's taste; the lines below are exactly the ones both bands had typed.
// A THIRD arrived on 2026-10-13: the doctor page's course timeline
// (sections/DoctorCourses/CourseTimeline, CLAUDE.md §15.23 round 7), which
// takes useRotation ALONE — it hides nothing and nothing in it can take focus,
// so neither manners object below has anything to answer; its one hold, while
// the list is off screen, is lib/clock's `'offscreen'` cause, set from its own
// IntersectionObserver.
// A FOURTH arrived on 2026-10-14: sections/CardCarousel, the cards of a blog
// article's gallery (sections/PostGallery) and, since 2026-10-17, of the Home
// page's articles band (sections/BlogCarousel) — a carousel again, so it
// takes useRotation WITH the same focus pair the other two carousels spread
// (below), plus two holds of its own: off screen (CourseTimeline's way) and a
// hand PRESSING it, a drag included, from the press to its end (lib/clock's
// `'drag'` cause; a drag alone until 2026-10-20). Since 2026-10-17 every activation
// on it goes through handNavigation, whose one consumer it is.
//
// ── WHY ui/ AND NOT lib/ (lib/cx/cx.ts's two questions, in order). Question 1:
// this module imports React — useState, useEffect, useSyncExternalStore — so
// it cannot live in the foundation ring, which is held to "loads bare under
// Node with no React runtime" (tests/unit/lib-react-free.test.ts). Question 2:
// it encodes no atom's look or API; it is plumbing two SECTIONS share, and
// §4 says such plumbing "climbs to lib/ or ui/" — lib/ being closed by
// question 1, ui/ is the home, beside slot.ts and attach-ref.ts (the two
// other React-touching mechanics modules that live here for the same reason).
// A hook is a MODULE, not an atom: no story, no visual manifest, and no
// §6.3 typed aria-label — it renders nothing.
//
// ── NO 'use client' HERE, deliberately (the useContactModal precedent): a
// hook module renders nothing and is pulled into the client graph by the
// islands that import it, each carrying the directive itself. A Server
// Component reaching for it fails loudly at build time, which is the honest
// outcome for code that asks a server-rendered tree for browser-time state.
//
// ── WHAT IS SHARED, AND WHAT DELIBERATELY IS NOT.
//   · useRotation(): the store built ONCE in a useState initializer (pure
//     construction — no timer, no media query, no document until start() —
//     which is what keeps hydration safe: the server's store and the
//     browser's publish the same first snapshot), the external-store trio,
//     the start/dispose effect, the setCount effect, and the CLAMPED `shown`
//     (the recipe's own guard: setCount() runs one frame after a list
//     shrinks, so `active` may point past the end for that frame — clamp,
//     never wrap, so that frame shows the slide setCount() is about to land
//     on). `active` is returned too, and NONE of the four consumers reads it:
//     each renders from `shown`, and the two that lay their cards out on a
//     ring never remount one — the deck keys every slide by its review id
//     (ReviewsDeck.tsx's NO LAP KEYS), the card carousel every card by its
//     place in the list. It stays for the one case lib/rotation's THE MOVE
//     ITSELF names: a deck whose visible window EQUALS its count, which
//     needs a lap counter bumped on every `active` change.
//   · focusManners() / pointerManners(): the APG's three focus cases (a
//     keyboard entry is the STICKY pause, a pointer entry a transient one, a
//     move within the region neither) and the hover pair, as two objects —
//     SEPARATE, because the law splits them for a rotator WITH a control:
//     focus goes on the REGION (Tab landing on the control is an entry),
//     pointer on the hover WRAPPER that excludes the control. The three
//     carousels render no control (each on the owner's word), and all three
//     spread ONLY the focus pair, with `keyboardEntry: 'suspend'` (the
//     transient hold instead of the law's sticky pause) and `pointerEntry:
//     'none'` (a click-focused control holds nothing), and NO pointer pair at
//     all — the Hero first (round 2 had moved the hover hold from the region
//     to the beads: a band that is the whole first screen cannot suspend
//     under every resting cursor; round 3 dropped it: a hand resting on the
//     bead it just pressed would hold the ring the owner wants moving —
//     "automatically resume even if you interact with it"), the deck the same
//     evening, 2026-09-20, on the owner's word ("like the slides"), the card
//     carousel from its first day (a resting cursor is not a request). The
//     course timeline spreads neither — nothing in it can take focus — so
//     `pointerManners` has had no caller since that evening; it stays the
//     law's hover pair (lib/rotation's THE HOVER WRAPPER). Hero.tsx's NO
//     ROTATION CONTROL paragraph carries the measurements and the SC 2.2.2
//     record of the first two carousels, and ReviewsDeck.tsx's points to it;
//     the card carousel's record is the handNavigation bullet's, below.
//   · handNavigation(): `pause()` FIRST, committed on its own, THEN the
//     visitor's step — the touch-reachable stop SC 2.2.2 needs when there is
//     no control (Swiper's `disableOnInteraction`). WHY THAT ORDER (2026-10-21,
//     the card carousel's round-3 accessibility review): the stop is what turns
//     a carousel's live region from 'off' to 'polite' (lib/rotation's
//     liveRegion), the step is what swaps its slides, and called together they
//     land in ONE commit, in which React applies a parent's attributes AFTER
//     its children's — so the slides' `inert` and `aria-hidden` changed while
//     the region still said 'off', the worst order for an engine that judges
//     politeness at the moment of a mutation (possibly WebKit): the visitor's
//     own move could go unannounced. MEASURED by the carousel's suite with a
//     MutationObserver on a click while the ring ran: inert → inert →
//     aria-live, under the old order (the step, then the pause). Now the stop
//     is flushed first (react-dom's flushSync, the shell's one call of it), so
//     the region is polite before the step's commit begins; the step then
//     lands on a stopped clock, whose restart() is a no-op, and the ring ends
//     where the old order left it. A drag's release was never in question —
//     the press's hold had made the region polite already. A rotator that
//     DOES render the control calls rotation.next/prev/goto directly and must
//     not use this — the law's "buys a full interval" is the right manner
//     there. The Hero and the
//     reviews deck call goto/prev/next directly on the owner's word (the
//     Hero's round 3, the deck the same evening — neither stops for good);
//     this helper's one consumer is sections/CardCarousel, since 2026-10-17
//     — the owner's "OPTION 1" for SC 2.2.2 — where every ACTIVATION, by hand or
//     by key, goes through it: an enabled arrow, a bead, a drag's release, a
//     tap on the stage or on a card. A press on a 'bounded' gallery's
//     DISABLED end arrow stops nothing: a disabled button runs no click
//     handler, and the arrows sit outside the box around the stage whose
//     click capture turns a click into a tap. The record is CardCarousel.tsx's
//     "SC 2.2.2 — THE OWNER'S OPTION 1" paragraph and BACKLOG.md entry 2,
//     with their caveat: nothing visible or audible SAYS that a press stops
//     it, and a screen reader's reading cursor is not a press (the card it
//     reads is still swapped), so an auditor may still ask for the control.
//     The deck's NO ROTATION CONTROL paragraph keeps this stop as its history
//     only (its first manner, from 2026-09-12 to 2026-09-20).
//     ./use-rotation.test.ts pins the sticky half — the review that asked for
//     it measured every carousel suite still green with the stop swapped for
//     a transient hold — and, since 2026-10-21, the order: the stop published
//     and committed before the step.
//   NOT shared: the markup (the deck fans cards, the hero crossfades photos),
//   the live-region attribute (a one-liner from lib/rotation's liveRegion —
//   a consumer decides which container carries it), and the rhythm (owned
//   per consumer, §15.18: "intervalMs is REQUIRED per consumer — no site
//   default").
//
// RECORDED TRIGGER: the first rotator that renders the rotation control
// (rotationControl() in lib/rotation is waiting for it) is where a
// `useRotationControl`-style helper, if any, gets its shape — not before.

/**
 * The ring as a consumer may drive it: navigation and manners only. The
 * lifecycle — start(), dispose(), setCount() — is the hook's (its effects call
 * all three), so it is cut from the type rather than left as a door a handler
 * could open twice.
 */
export type RotationRing = Omit<Rotation, 'start' | 'dispose' | 'setCount'>;

/** What a rotator reads each render: the ring, and the three numbers it renders from. */
export type RotationHandle = Readonly<{
  rotation: RotationRing;
  /** The store's index — may lag a shrinking list by one frame; render from `shown`. */
  active: number;
  /** `active` clamped to the list this render is mapping. */
  shown: number;
  status: RotationStatus;
}>;

/**
 * Build the ring once, subscribe to it, start it after mount and dispose it
 * on unmount; keep its count honest as the list changes. Options are READ
 * ONCE, AT MOUNT — to change the rhythm, remount the consumer with a new
 * React `key` (rebuilding the store in an effect would throw away the
 * visitor's stop and the slide they are on).
 */
export function useRotation(options: RotationOptions): RotationHandle {
  const [rotation] = useState(() => createRotation(options));
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
    rotation.setCount(options.count);
  }, [rotation, options.count]);

  const shown = Math.min(active, Math.max(0, options.count - 1));

  return { rotation, active, shown, status };
}

export type FocusManners = Readonly<{
  onFocus: (event: FocusEvent<HTMLElement>) => void;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
}>;

export type FocusMannersOptions = Readonly<{
  /**
   * What a KEYBOARD entry does. 'pause' (the default) is the law — the APG's
   * sticky pause, undone only by an explicit play. 'suspend' is the transient
   * hold a pointer entry gets: the ring waits while focus is inside and goes
   * on when it leaves — the Hero's owner exception (round 3, 2026-09-20).
   */
  keyboardEntry?: 'pause' | 'suspend';
  /**
   * What a POINTER entry does — a control focused by a CLICK (Chrome and
   * Firefox focus a clicked button; lib/rotation's classifyFocusEntry).
   * 'suspend' (the default) is the law: the ring waits while the clicked
   * control keeps focus and goes on when focus leaves the region. 'none'
   * ignores it: a visitor who clicks a bead and leaves the hand there sees
   * the ring go on a full interval later — the Hero's owner exception
   * (round 3, 2026-09-20: "automatically resume even if you interact with
   * it"; measured: the default held the ring for as long as the bead kept
   * focus after a click).
   */
  pointerEntry?: 'suspend' | 'none';
}>;

/**
 * The region's two focus handlers: a keyboard entry is the sticky pause (or,
 * on a consumer's recorded word, the same transient hold a pointer entry
 * gets), a pointer entry a transient suspension, and leaving the region
 * resumes only what was suspended (lib/rotation's classifyFocusEntry /
 * leavesRegion carry the reasoning and the tests).
 */
export function focusManners(
  rotation: RotationRing,
  {
    keyboardEntry = 'pause',
    pointerEntry = 'suspend',
  }: FocusMannersOptions = {},
): FocusManners {
  return {
    onFocus: (event) => {
      const entry = classifyFocusEntry(event);
      if (entry === 'keyboard') {
        if (keyboardEntry === 'pause') rotation.pause();
        else rotation.suspend('focus');
      } else if (entry === 'pointer' && pointerEntry === 'suspend') {
        rotation.suspend('focus');
      }
    },
    onBlur: (event) => {
      if (leavesRegion(event)) rotation.resume('focus');
    },
  };
}

export type PointerManners = Readonly<{
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}>;

/** The hover pair: resting over the widget suspends it, leaving resumes it. */
export function pointerManners(rotation: RotationRing): PointerManners {
  return {
    onPointerEnter: () => rotation.suspend('pointer'),
    onPointerLeave: () => rotation.resume('pointer'),
  };
}

/**
 * A hand on the widget: the STOP FOR GOOD, committed on its own, then the step
 * the control names. `pause()` is the sticky one — the state only a play
 * button could undo: no resume of any cause, no effect re-run (dispose(), then
 * start()) and no list growing back past two lifts it — and a control-less
 * rotator has no play button, so the first press ends the automatic rotation
 * and the visitor is in charge from then on.
 *
 * THE ORDER (the header's handNavigation bullet): the stop FIRST, flushed
 * through react-dom's flushSync, so a live region the stop turns polite is
 * polite in the DOM before the step's commit swaps the slides; the step then
 * lands on a stopped clock, whose restart() is a no-op, so the ring ends where
 * the old order left it, card for card. While the ring is idle (reduced
 * motion, too few) the stop is a no-op — nothing is running to stop — and the
 * STEP still lands: goto moves an idle ring and starts nothing. Building the
 * handler does neither (the card carousel builds its handlers on every
 * render); calling it does both — from an event, never during a render, where
 * flushSync cannot flush. ./use-rotation.test.ts pins all of it.
 */
export function handNavigation(
  rotation: RotationRing,
  step: () => void,
): () => void {
  return () => {
    flushSync(() => {
      rotation.pause();
    });
    step();
  };
}
