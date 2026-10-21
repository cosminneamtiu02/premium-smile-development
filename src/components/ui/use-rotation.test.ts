import { act, renderHook } from '@testing-library/react';
import { useLayoutEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClockEnv } from '@/lib/clock/clock';
import {
  createRotation,
  type Rotation,
  type RotationSnapshot,
  type RotationStatus,
  type SuspendCause,
} from '@/lib/rotation/rotation';
import { handNavigation, useRotation } from './use-rotation';

// ui/use-rotation — the shared rotator shell's OWN suite, born 2026-10-17 with
// the one consumer of its STOP FOR GOOD: sections/CardCarousel, where every
// press goes through `handNavigation` (the owner's "OPTION 1" for SC 2.2.2 —
// CardCarousel.tsx's "SC 2.2.2 — THE OWNER'S OPTION 1" paragraph). Until that
// day the shell had no test file, and needed none for what every rotator runs:
// useRotation is driven through the four rotators' own suites (ReviewsDeck,
// Hero, CourseTimeline, CardCarousel), and focusManners through the three
// carousels' (CourseTimeline takes no focus manners).
//
// WHAT THOSE SUITES CANNOT SEE — the lane's G2 typescript review, MEASURED on
// 2026-10-17: with the helper's `pause()` swapped for `suspend()` (the
// TRANSIENT hold), every suite that renders the carousel stayed green
// (CardCarousel 104/104 and its geometry suite 102/102 among them). A carousel
// that takes no hover hold never calls resume('pointer'), so a hold nobody
// lifts looks, for as long as a test watches, exactly like a stop: the live
// region is polite either way and nothing moves. What tells the two apart is
// everything that LIFTS a hold or REBUILDS the clock — and that is precisely
// what the carousel's own life does around a press: the drag's release
// (CardCarousel's letGo: resume('drag') right after the stop — "the sticky
// pause outlives it"), the observer that holds it while it is off screen
// (resume('offscreen') when it comes back into view), keyboard focus leaving
// the region (resume('focus')), an effect re-run on the SAME store (dispose(),
// then start() — Fast Refresh, a late client mount; lib/rotation's
// dispose()/start() note) and the list falling under two and growing back
// (setCount's re-check, which begins again a clock it had idled). Each of
// those is a case below, and each turns RED when the stop is a suspend (shown
// on a scratch copy of the module the same day: 11 of the 13 cases red). The
// two IDLE cases at the end pin the JSDoc's other sentence — what a press does
// to a ring that is not running — which swapping the stop for a hold, or
// dropping it, cannot reach (a `play()` in its place turns one red too); the
// reduced-motion one turns red when the whole press is made a no-op while the
// ring is idle, what that sentence said until the same day.
//
// THE ORDER (2026-10-21, the card carousel's round-3 accessibility review —
// the handNavigation bullet in ./use-rotation.ts): the stop comes FIRST, in a
// commit of its own, and the step after it, so a live region the stop turns
// polite is polite before the slides change. Two cases pin it: the ring's own
// publications (the stop published before the step), and — the one case here
// with React — the commits a component reading the ring makes (the stop
// committed ALONE): the first turns red under the old order, the second under
// the old order and without the flushSync alike.
//
// It runs in the `components` project (real Chromium) beside the module —
// the unit project has no `@/` alias, and the module imports React — yet
// only that one case renders anything: the helper is plain composition over a
// ring, so the ring is lib/rotation's createRotation itself (the hook would
// add only the effect that calls start() and dispose(), which the re-run case
// calls by hand). Time is fake, as rotation.test.ts owns it; the environment
// is the quiet one every rotator suite fakes, because the real reduced-motion
// query and the real tab visibility are machine state a test may not flip.

const INTERVAL = 5_000;

/**
 * A browser that neither reduces motion nor hides the tab, unless asked —
 * the rotator suites' own copy, one more for §15.19's helper-promotion census.
 */
const quietEnv = (reduced = false): ClockEnv => ({
  prefersReducedMotion: () => reduced,
  watchReducedMotion: () => () => {},
  isHidden: () => false,
  watchVisibility: () => () => {},
});

/** A ring of `count` cards on the quiet browser, not yet started. */
const ringOf = (count: number, reduced = false): Rotation =>
  createRotation({ count, intervalMs: INTERVAL, env: quietEnv(reduced) });

/**
 * EVERY suspension cause, spelled as a Record so the compiler keeps the list
 * whole: a fifth cause added to lib/clock's SuspendCause fails to compile here
 * until it is listed — and so gets its cases — and a word that is not a cause
 * fails too.
 */
const CAUSE: { readonly [K in SuspendCause]: K } = {
  pointer: 'pointer',
  focus: 'focus',
  offscreen: 'offscreen',
  drag: 'drag',
};
const CAUSES = Object.values(CAUSE);

/** STOPPED, as fake time can show it: the sticky status, no timer behind it,
 *  and ten whole intervals later still on `card`. */
function expectStoppedOn(ring: Rotation, card: number): void {
  expect(ring.getSnapshot()).toMatchObject({ active: card, status: 'stopped' });
  expect(vi.getTimerCount()).toBe(0);
  vi.advanceTimersByTime(10 * INTERVAL);
  expect(ring.getSnapshot()).toMatchObject({ active: card, status: 'stopped' });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('handNavigation — a press on a control-less rotator: the STOP FOR GOOD, then the step', () => {
  it('builds a handler that does nothing until it is called — then steps the ring and STOPS it, the sticky state', () => {
    const ring = ringOf(3);
    ring.start();

    // The card carousel builds its handlers on every render: building one
    // must neither step the ring nor stop it.
    const press = handNavigation(ring, ring.next);
    expect(ring.getSnapshot()).toEqual({
      active: 0,
      count: 3,
      status: 'running',
      idleReason: null,
    });

    press();
    expect(ring.getSnapshot()).toEqual({
      active: 1,
      count: 3,
      status: 'stopped',
      idleReason: null,
    });
    expectStoppedOn(ring, 1);
  });

  it('publishes the STOP before the STEP: the ring stopped where it stood, then moved — never a moment moved and still running', () => {
    const ring = ringOf(3);
    ring.start();
    const published: Pick<RotationSnapshot, 'active' | 'status'>[] = [];
    const unsubscribe = ring.subscribe(() => {
      const { active, status } = ring.getSnapshot();
      published.push({ active, status });
    });
    handNavigation(ring, ring.next)();
    unsubscribe();
    expect(published).toEqual([
      { active: 0, status: 'stopped' },
      { active: 1, status: 'stopped' },
    ]);
  });

  it('COMMITS the stop on its own, before the step’s commit — so a live region the stop turns polite is polite in the DOM before the slides change', () => {
    // A rotator's render, reduced to what it commits: the status and the
    // card, logged once per commit.
    const commits: string[] = [];
    const { result } = renderHook(() => {
      const handle = useRotation({
        count: 3,
        intervalMs: INTERVAL,
        env: quietEnv(),
      });
      useLayoutEffect(() => {
        commits.push(`${handle.status} at ${handle.active}`);
      });
      return handle;
    });
    expect(commits.at(-1)).toBe('running at 0');
    const before = commits.length;
    const { rotation } = result.current;
    act(() => {
      handNavigation(rotation, rotation.next)();
    });
    expect(commits.slice(before)).toEqual(['stopped at 0', 'stopped at 1']);
  });

  it.each(CAUSES)(
    'a release AFTER the stop — resume(%s), and the argument-less resume() — lifts nothing',
    (cause) => {
      const ring = ringOf(3);
      ring.start();
      handNavigation(ring, ring.next)();

      ring.resume(cause);
      ring.resume();
      expectStoppedOn(ring, 1);
    },
  );

  it.each(CAUSES)(
    'a hold taken BEFORE the press — suspend(%s) — gives way to the stop, and its release starts nothing: no instant of running between them (the order of CardCarousel’s letGo)',
    (cause) => {
      const ring = ringOf(3);
      ring.start();
      ring.suspend(cause);
      expect(ring.getSnapshot().status).toBe('suspended');

      const published: RotationStatus[] = [];
      const unsubscribe = ring.subscribe(() => {
        published.push(ring.getSnapshot().status);
      });
      handNavigation(ring, ring.next)();
      ring.resume(cause);
      unsubscribe();

      expect(published).toContain('stopped');
      expect(published).not.toContain('running');
      expectStoppedOn(ring, 1);
    },
  );

  it('an effect re-run on the SAME store — dispose(), then start() — does not undo it', () => {
    const ring = ringOf(3);
    ring.start();
    handNavigation(ring, ring.next)();

    ring.dispose();
    ring.start();
    expect(ring.getSnapshot()).toEqual({
      active: 1,
      count: 3,
      status: 'stopped',
      idleReason: null,
    });
    expectStoppedOn(ring, 1);
  });

  it('the list falling under two and growing back — setCount(1), then setCount(3) — does not undo it', () => {
    const ring = ringOf(3);
    ring.start();
    handNavigation(ring, ring.next)();

    ring.setCount(1);
    ring.setCount(3);
    // setCount(1) clamped the index onto the one card it left; the stop
    // outlived both counts.
    expect(ring.getSnapshot()).toEqual({
      active: 0,
      count: 3,
      status: 'stopped',
      idleReason: null,
    });
    expectStoppedOn(ring, 0);
  });

  it('under reduced motion the STEP still lands and nothing starts — only the stop has nothing to do', () => {
    const ring = ringOf(3, true);
    ring.start();
    expect(ring.getSnapshot()).toEqual({
      active: 0,
      count: 3,
      status: 'idle',
      idleReason: 'reduced-motion',
    });

    handNavigation(ring, ring.next)();
    expect(ring.getSnapshot()).toEqual({
      active: 1,
      count: 3,
      status: 'idle',
      idleReason: 'reduced-motion',
    });
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ring.getSnapshot().active).toBe(1);
  });

  it('on a ring too short to rotate a press starts nothing — lib/rotation’s two-card minimum keeps the clock idle', () => {
    const ring = ringOf(1);
    ring.start();

    handNavigation(ring, ring.next)();
    expect(ring.getSnapshot()).toEqual({
      active: 0,
      count: 1,
      status: 'idle',
      idleReason: 'too-few',
    });
    expect(vi.getTimerCount()).toBe(0);
  });
});
