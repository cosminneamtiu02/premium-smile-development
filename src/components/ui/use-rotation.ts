import {
  useEffect,
  useState,
  useSyncExternalStore,
  type FocusEvent,
} from 'react';
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
//     on). `active` is returned too, for a consumer that keys a lap counter
//     on it (the deck's remount trick).
//   · focusManners() / pointerManners(): the APG's three focus cases (a
//     keyboard entry is the STICKY pause, a pointer entry a transient one, a
//     move within the region neither) and the hover pair, as two objects —
//     SEPARATE, because the law splits them for a rotator WITH a control:
//     focus goes on the REGION (Tab landing on the control is an entry),
//     pointer on the hover WRAPPER that excludes the control. Today's two
//     consumers render no control (each on the owner's word), and since
//     2026-09-20 BOTH spread ONLY the focus pair, with `keyboardEntry:
//     'suspend'` (the transient hold instead of the law's sticky pause) and
//     `pointerEntry: 'none'` (a click-focused control holds nothing), and NO
//     pointer pair at all — the Hero first (round 2 had moved the hover hold
//     from the region to the beads: a band that is the whole first screen
//     cannot suspend under every resting cursor; round 3 dropped it: a hand
//     resting on the bead it just pressed would hold the ring the owner wants
//     moving — "automatically resume even if you interact with it"), the deck
//     the same evening on the owner's word ("like the slides"). Hero.tsx's NO
//     ROTATION CONTROL paragraph carries the measurements and the SC 2.2.2
//     record; ReviewsDeck.tsx's points to it.
//   · handNavigation(): the visitor's step, then `pause()` — the touch-
//     reachable stop SC 2.2.2 needs when there is no control (ReviewsDeck.tsx's
//     NO ROTATION CONTROL paragraph; Swiper's `disableOnInteraction`). A
//     rotator that DOES render the control calls rotation.next/prev/goto
//     directly and must not use this — the law's "buys a full interval" is
//     the right manner there. Both control-less rotators call goto/prev/next
//     directly on the owner's word (the Hero's round 3, the deck the same
//     evening — nothing stops for good on this site); this helper has NO
//     consumer today and stays as the law's stop-for-good for a future one.
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
 * A hand on the widget: the step the control names, then the STOP FOR GOOD.
 * `pause()` is the sticky one — the state only a play button could undo —
 * and a control-less rotator has none, so the first press ends the automatic
 * rotation and the visitor is in charge from then on. A no-op while the ring
 * is idle (reduced motion, too few), where there is nothing to stop.
 */
export function handNavigation(
  rotation: RotationRing,
  step: () => void,
): () => void {
  return () => {
    step();
    rotation.pause();
  };
}
