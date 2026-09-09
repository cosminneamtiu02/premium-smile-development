import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClockEnv } from '../clock/clock.ts';
import {
  classifyFocusEntry,
  createRotation,
  leavesRegion,
  liveRegion,
  rotationControl,
  wrapIndex,
} from './rotation.ts';
import type { FocusLike } from './rotation.ts';

// Runs in the `components` project (real chromium, vitest.config.ts) because
// the clock underneath calls the browser's own setTimeout — there is no React
// in here at all, which is the point of the ring (lib/scroll-lock precedent).
//
// Time is the suite's to own: vi.useFakeTimers() replaces the page's setTimeout
// so "the next slide arrives a FULL interval after the visitor pressed next,
// not 500 ms later" is a synchronous assertion. The environment is always
// faked (see quietEnv) — the real prefers-reduced-motion query and the real tab
// visibility are machine state a test may not flip.

const INTERVAL = 5_000;

/** A browser that never reduces motion and never hides the tab. */
function quietEnv(reduced = false): ClockEnv {
  return {
    prefersReducedMotion: () => reduced,
    watchReducedMotion: () => () => {},
    isHidden: () => false,
    watchVisibility: () => () => {},
  };
}

function createTestRotation(
  options: {
    count?: number;
    initial?: number;
    step?: number;
    startDelayMs?: number;
    driver?: 'internal' | 'external';
    reduced?: boolean;
  } = {},
) {
  return createRotation({
    count: options.count ?? 3,
    intervalMs: INTERVAL,
    startDelayMs: options.startDelayMs,
    initial: options.initial,
    step: options.step,
    driver: options.driver,
    env: quietEnv(options.reduced ?? false),
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('wrapIndex — the ring arithmetic', () => {
  it('leaves an index that is already inside the ring alone', () => {
    expect(wrapIndex(0, 3)).toBe(0);
    expect(wrapIndex(2, 3)).toBe(2);
  });

  it('wraps past the end and before the start', () => {
    expect(wrapIndex(3, 3)).toBe(0);
    expect(wrapIndex(7, 3)).toBe(1);
    expect(wrapIndex(-1, 3)).toBe(2);
    expect(wrapIndex(-4, 3)).toBe(2);
  });

  it('answers 0 for an empty ring instead of NaN', () => {
    expect(wrapIndex(0, 0)).toBe(0);
    expect(wrapIndex(5, 0)).toBe(0);
    expect(wrapIndex(-5, 0)).toBe(0);
    expect(wrapIndex(1, -3)).toBe(0);
  });

  it('answers 0 for a NaN or infinite ring — the promise is NEVER NaN', () => {
    expect(wrapIndex(1, Number.NaN)).toBe(0);
    expect(wrapIndex(1, Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('answers 0 for a NaN or infinite INDEX, for the same promise', () => {
    expect(wrapIndex(Number.NaN, 3)).toBe(0);
    expect(wrapIndex(Number.POSITIVE_INFINITY, 3)).toBe(0);
    expect(wrapIndex(Number.NEGATIVE_INFINITY, 3)).toBe(0);
  });
});

describe('createRotation — the options it does not take on trust', () => {
  it('truncates the count and floors it at zero', () => {
    expect(createTestRotation({ count: 3.7 }).getSnapshot().count).toBe(3);
    expect(createTestRotation({ count: -2 }).getSnapshot().count).toBe(0);
    expect(createTestRotation({ count: Number.NaN }).getSnapshot().count).toBe(
      0,
    );
    // Infinity is not a length either: it would enable the clock while the
    // index never moves.
    expect(
      createTestRotation({ count: Number.POSITIVE_INFINITY }).getSnapshot()
        .count,
    ).toBe(0);
  });

  it('truncates the initial index and reads nonsense as the first item', () => {
    expect(
      createTestRotation({ count: 3, initial: 2.9 }).getSnapshot().active,
    ).toBe(2);
    expect(
      createTestRotation({ count: 3, initial: Number.NaN }).getSnapshot()
        .active,
    ).toBe(0);
    expect(
      createTestRotation({
        count: 3,
        initial: Number.POSITIVE_INFINITY,
      }).getSnapshot().active,
    ).toBe(0);
  });

  it('normalises whatever goto() receives — the index is ALWAYS valid', () => {
    const rotation = createTestRotation({ count: 3 });
    rotation.goto(1.5);
    expect(rotation.getSnapshot().active).toBe(1);
    rotation.goto(Number.NaN);
    expect(rotation.getSnapshot().active).toBe(0);
    rotation.goto(Number.POSITIVE_INFINITY);
    expect(rotation.getSnapshot().active).toBe(0);
    rotation.goto(-1);
    expect(rotation.getSnapshot().active).toBe(2);
  });

  it('refuses a step that is not a non-zero integer', () => {
    // step 0 is a clock that ticks forever and never moves — nothing in any
    // snapshot would reveal it; a fractional step is not an index at all.
    expect(() => createTestRotation({ step: 0 })).toThrow(RangeError);
    for (const step of [0, 1.5, Number.NaN]) {
      expect(() => createTestRotation({ step })).toThrow(/step/);
    }
    expect(() => createTestRotation({ step: -1 })).not.toThrow();
    expect(() => createTestRotation({ step: 2 })).not.toThrow();
  });
});

describe('liveRegion — what a screen reader is told to announce', () => {
  it('is off while the rotation moves by itself, polite otherwise', () => {
    expect(liveRegion('running')).toBe('off');
    expect(liveRegion('idle')).toBe('polite');
    expect(liveRegion('suspended')).toBe('polite');
    expect(liveRegion('stopped')).toBe('polite');
  });
});

describe('rotationControl — the face the pause/play button wears', () => {
  it('offers PAUSE while the rotation is running or merely suspended', () => {
    // The dominant activation path: a pointer user hovers the widget to reach
    // the button, which suspends the clock. A control that flipped to "play"
    // there would offer to start something still moving — SC 2.2.2 inverted,
    // and the name/action divergence of SC 4.1.2.
    expect(rotationControl('running')).toBe('pause');
    expect(rotationControl('suspended')).toBe('pause');
  });

  it('offers PLAY only where the rotation genuinely is not moving', () => {
    expect(rotationControl('stopped')).toBe('play');
    expect(rotationControl('idle')).toBe('play');
  });
});

describe('createRotation — the automatic advance', () => {
  it('starts at 0, then steps by one and wraps on every tick', () => {
    const rotation = createTestRotation({ count: 3 });

    expect(rotation.getSnapshot()).toEqual({
      active: 0,
      count: 3,
      status: 'idle',
      idleReason: 'not-started',
    });

    rotation.start();
    vi.advanceTimersByTime(INTERVAL);
    expect(rotation.getSnapshot().active).toBe(1);
    vi.advanceTimersByTime(INTERVAL);
    expect(rotation.getSnapshot().active).toBe(2);
    vi.advanceTimersByTime(INTERVAL);
    expect(rotation.getSnapshot().active).toBe(0);
  });

  it('wraps the initial index into the ring', () => {
    expect(
      createTestRotation({ count: 3, initial: 7 }).getSnapshot().active,
    ).toBe(1);
    expect(
      createTestRotation({ count: 3, initial: -1 }).getSnapshot().active,
    ).toBe(2);
  });

  it('reverses the automatic direction on step -1', () => {
    const rotation = createTestRotation({ count: 4, step: -1 });

    rotation.start();
    vi.advanceTimersByTime(INTERVAL);
    expect(rotation.getSnapshot().active).toBe(3);
    vi.advanceTimersByTime(INTERVAL);
    expect(rotation.getSnapshot().active).toBe(2);
  });

  it('honours the first dwell, then the interval', () => {
    const rotation = createTestRotation({ startDelayMs: 1_000 });

    rotation.start();
    vi.advanceTimersByTime(999);
    expect(rotation.getSnapshot().active).toBe(0);
    vi.advanceTimersByTime(1);
    expect(rotation.getSnapshot().active).toBe(1);
    vi.advanceTimersByTime(INTERVAL);
    expect(rotation.getSnapshot().active).toBe(2);
  });

  it('declines the automatic start under reduced motion, and play() overrides', () => {
    const rotation = createTestRotation({ reduced: true });

    rotation.start();
    expect(rotation.getSnapshot()).toEqual({
      active: 0,
      count: 3,
      status: 'idle',
      idleReason: 'reduced-motion',
    });

    rotation.play();
    vi.advanceTimersByTime(INTERVAL);
    expect(rotation.getSnapshot()).toEqual({
      active: 1,
      count: 3,
      status: 'running',
      idleReason: null,
    });
  });
});

describe('the two-item floor — nothing rotates below it', () => {
  it('idles as too-few when the list is too short to rotate', () => {
    const rotation = createTestRotation({ count: 1 });

    rotation.start();
    expect(rotation.getSnapshot()).toEqual({
      active: 0,
      count: 1,
      status: 'idle',
      idleReason: 'too-few',
    });

    vi.advanceTimersByTime(10 * INTERVAL);
    expect(rotation.getSnapshot().active).toBe(0);
    expect(rotation.getSnapshot().status).toBe('idle');
  });

  it('runs as soon as a started rotation grows past the floor', () => {
    const rotation = createTestRotation({ count: 1 });

    rotation.start();
    rotation.setCount(3);
    expect(rotation.getSnapshot()).toEqual({
      active: 0,
      count: 3,
      status: 'running',
      idleReason: null,
    });

    vi.advanceTimersByTime(INTERVAL);
    expect(rotation.getSnapshot().active).toBe(1);
  });

  it('falls back to too-few when the list shrinks below it', () => {
    const rotation = createTestRotation({ count: 3 });

    rotation.start();
    rotation.setCount(1);
    expect(rotation.getSnapshot()).toEqual({
      active: 0,
      count: 1,
      status: 'idle',
      idleReason: 'too-few',
    });

    vi.advanceTimersByTime(10 * INTERVAL);
    expect(rotation.getSnapshot().active).toBe(0);
  });

  it('clamps the active index onto the nearest surviving item', () => {
    const rotation = createTestRotation({ count: 5 });

    rotation.goto(4);
    rotation.setCount(2);
    expect(rotation.getSnapshot()).toEqual({
      active: 1,
      count: 2,
      status: 'idle',
      idleReason: 'not-started',
    });

    rotation.setCount(0);
    expect(rotation.getSnapshot().active).toBe(0);
  });
});

describe('user navigation — wraps, and buys a full interval', () => {
  it('steps by one in either direction and wraps', () => {
    const rotation = createTestRotation({ count: 3 });

    rotation.next();
    expect(rotation.getSnapshot().active).toBe(1);
    rotation.prev();
    expect(rotation.getSnapshot().active).toBe(0);
    rotation.prev();
    expect(rotation.getSnapshot().active).toBe(2);
    rotation.next();
    expect(rotation.getSnapshot().active).toBe(0);
  });

  it('steps by ONE even when the automatic step is larger or reversed', () => {
    const rotation = createTestRotation({ count: 5, step: -2 });

    rotation.next();
    expect(rotation.getSnapshot().active).toBe(1);
    rotation.prev();
    expect(rotation.getSnapshot().active).toBe(0);
  });

  it('wraps goto() into the ring', () => {
    const rotation = createTestRotation({ count: 3 });

    rotation.goto(2);
    expect(rotation.getSnapshot().active).toBe(2);
    rotation.goto(4);
    expect(rotation.getSnapshot().active).toBe(1);
    rotation.goto(-1);
    expect(rotation.getSnapshot().active).toBe(2);
  });

  it('re-arms a FULL interval while running (the old tickKey trick, once)', () => {
    const rotation = createTestRotation({ count: 3 });

    rotation.start();
    vi.advanceTimersByTime(INTERVAL * 0.9);
    rotation.next();
    expect(rotation.getSnapshot().active).toBe(1);

    vi.advanceTimersByTime(INTERVAL - 1);
    expect(rotation.getSnapshot().active).toBe(1);
    vi.advanceTimersByTime(1);
    expect(rotation.getSnapshot().active).toBe(2);
  });

  it('moves the index only while stopped or idle — it never restarts a stopped rotation', () => {
    const rotation = createTestRotation({ count: 3 });

    rotation.start();
    rotation.pause();
    rotation.next();
    expect(rotation.getSnapshot()).toEqual({
      active: 1,
      count: 3,
      status: 'stopped',
      idleReason: null,
    });
    expect(vi.getTimerCount()).toBe(0);

    vi.advanceTimersByTime(10 * INTERVAL);
    expect(rotation.getSnapshot().active).toBe(1);

    const idle = createTestRotation({ count: 3 });
    idle.goto(2);
    expect(idle.getSnapshot()).toEqual({
      active: 2,
      count: 3,
      status: 'idle',
      idleReason: 'not-started',
    });
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('hover and the rotation control, seen from the ring', () => {
  it('suspends and resumes with a full interval, and pause() is sticky', () => {
    const rotation = createTestRotation({ count: 3 });

    rotation.start();
    rotation.suspend();
    expect(rotation.getSnapshot().status).toBe('suspended');
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(rotation.getSnapshot().active).toBe(0);

    rotation.resume();
    vi.advanceTimersByTime(INTERVAL);
    expect(rotation.getSnapshot().active).toBe(1);

    rotation.pause();
    rotation.resume();
    expect(rotation.getSnapshot().status).toBe('stopped');
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(rotation.getSnapshot().active).toBe(1);

    rotation.play();
    vi.advanceTimersByTime(INTERVAL);
    expect(rotation.getSnapshot().active).toBe(2);
  });

  it('passes the suspension CAUSE through to the clock', () => {
    const rotation = createTestRotation({ count: 3 });

    rotation.start();
    rotation.suspend('focus');
    rotation.suspend('pointer');

    // The pointer leaves while keyboard focus is still inside the widget.
    rotation.resume('pointer');
    expect(rotation.getSnapshot().status).toBe('suspended');
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(rotation.getSnapshot().active).toBe(0);

    rotation.resume('focus');
    expect(rotation.getSnapshot().status).toBe('running');
    vi.advanceTimersByTime(INTERVAL);
    expect(rotation.getSnapshot().active).toBe(1);
  });
});

describe('the store protocol — what useSyncExternalStore reads', () => {
  it('rebuilds the snapshot on active, count and status changes only', () => {
    const rotation = createTestRotation({ count: 3 });

    const atRest = rotation.getSnapshot();
    expect(rotation.getSnapshot()).toBe(atRest);

    rotation.start();
    const running = rotation.getSnapshot();
    expect(running).not.toBe(atRest);
    expect(rotation.getSnapshot()).toBe(running);

    vi.advanceTimersByTime(INTERVAL);
    const advanced = rotation.getSnapshot();
    expect(advanced).not.toBe(running);
    expect(advanced.active).toBe(1);

    rotation.setCount(3);
    expect(rotation.getSnapshot()).toBe(advanced);

    rotation.goto(1);
    expect(rotation.getSnapshot()).toBe(advanced);

    rotation.setCount(4);
    expect(rotation.getSnapshot()).not.toBe(advanced);
  });

  it('notifies subscribers until they unsubscribe', () => {
    const rotation = createTestRotation({ count: 3 });
    let notified = 0;

    const unsubscribe = rotation.subscribe(() => {
      notified += 1;
    });
    rotation.start();
    expect(notified).toBe(1);

    vi.advanceTimersByTime(INTERVAL);
    expect(notified).toBe(2);

    unsubscribe();
    vi.advanceTimersByTime(INTERVAL);
    expect(notified).toBe(2);
    expect(rotation.getSnapshot().active).toBe(2);
  });

  it('keeps the server snapshot constant forever', () => {
    const rotation = createTestRotation({ count: 3, initial: 1 });
    const server = rotation.getServerSnapshot();

    rotation.start();
    vi.advanceTimersByTime(INTERVAL);
    rotation.pause();

    expect(rotation.getServerSnapshot()).toBe(server);
    expect(server).toEqual({
      active: 1,
      count: 3,
      status: 'idle',
      idleReason: 'not-started',
    });
  });
});

describe('dispose() — re-entrant with start(), as StrictMode client mounts and Fast Refresh demand', () => {
  it('stops the clock, keeps the index, and lets start() arm again', () => {
    const rotation = createTestRotation({ count: 3 });

    rotation.start();
    vi.advanceTimersByTime(INTERVAL);
    rotation.dispose();

    expect(rotation.getSnapshot()).toEqual({
      active: 1,
      count: 3,
      status: 'idle',
      idleReason: 'not-started',
    });
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(rotation.getSnapshot().active).toBe(1);

    rotation.start();
    vi.advanceTimersByTime(INTERVAL);
    expect(rotation.getSnapshot()).toEqual({
      active: 2,
      count: 3,
      status: 'running',
      idleReason: null,
    });
  });
});

describe("the external driver — a ring on someone else's beat", () => {
  it('exposes its driver and arms no timer of its own', () => {
    const rotation = createTestRotation({ count: 3, driver: 'external' });

    expect(rotation.driver).toBe('external');
    expect(createTestRotation({ count: 3 }).driver).toBe('internal');

    rotation.start();
    expect(rotation.getSnapshot().status).toBe('running');
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(100 * INTERVAL);
    expect(rotation.getSnapshot().active).toBe(0);
  });

  it('advances one step per tick(), and only while running', () => {
    const rotation = createTestRotation({ count: 3, driver: 'external' });

    rotation.tick();
    expect(rotation.getSnapshot().active).toBe(0);

    rotation.start();
    rotation.tick();
    expect(rotation.getSnapshot().active).toBe(1);
    rotation.tick();
    expect(rotation.getSnapshot().active).toBe(2);

    rotation.suspend();
    rotation.tick();
    expect(rotation.getSnapshot().active).toBe(2);
  });

  it('swallows exactly one beat after a hand navigation, then rejoins', () => {
    const rotation = createTestRotation({ count: 4, driver: 'external' });

    rotation.start();
    rotation.goto(2);
    expect(rotation.getSnapshot().active).toBe(2);

    rotation.tick();
    expect(rotation.getSnapshot().active).toBe(2);
    rotation.tick();
    expect(rotation.getSnapshot().active).toBe(3);
  });
});

describe('classifyFocusEntry / leavesRegion — the APG focus manners, as code', () => {
  // Real elements in the real Chromium this project already runs (org-review
  // F3a, owner approval fb-425–430, 2026-09-09): these two functions took the
  // twenty-three lines of handler prose out of the consumption recipe, so what
  // they decide is now pinned once instead of re-typed per rotator.
  //
  // What is NOT pinned here: the browser's own :focus-visible verdict — whether
  // THIS focus came from the keyboard or from a click. Producing that needs a
  // real Tab and a real press, which is the first consumer lane's interaction
  // test ("play, then Tab within the region: still running"). These cases stub
  // the verdict and pin the three branches around it.

  let region: HTMLElement;
  let inside: HTMLButtonElement;
  let alsoInside: HTMLButtonElement;
  let outside: HTMLButtonElement;

  beforeEach(() => {
    region = document.createElement('section');
    inside = document.createElement('button');
    alsoInside = document.createElement('button');
    outside = document.createElement('button');
    region.append(inside, alsoInside);
    document.body.append(region, outside);
  });

  afterEach(() => {
    // The elements go, and every own `matches` stubbed onto one goes with them.
    region.remove();
    outside.remove();
  });

  /** A focus event as the REGION's own handler receives it. */
  function focusEvent(
    target: EventTarget | null,
    relatedTarget: EventTarget | null,
  ): FocusLike {
    return { currentTarget: region, target, relatedTarget };
  }

  /**
   * Install an OWN `matches` on one element, shadowing Element.prototype's.
   * 'throws' is the Safari/iOS < 15.4 shape: an engine that does not know
   * :focus-visible raises on the selector instead of answering false.
   */
  function stubMatches(element: Element, verdict: boolean | 'throws'): void {
    Object.defineProperty(element, 'matches', {
      configurable: true,
      value: (selector: string) => {
        if (verdict === 'throws') {
          throw new SyntaxError(`unsupported selector: ${selector}`);
        }
        return verdict;
      },
    });
  }

  it('reads a move WITHIN the region as no entry at all', () => {
    // focusin bubbles, so Tabbing from one control of the region to the next
    // fires it again — and re-pausing there would undo a play() the visitor
    // had just pressed.
    expect(classifyFocusEntry(focusEvent(alsoInside, inside))).toBe('within');
  });

  it('reads a keyboard entry as keyboard — the sticky one', () => {
    stubMatches(inside, true);
    expect(classifyFocusEntry(focusEvent(inside, outside))).toBe('keyboard');
  });

  it('reads a pointer entry as pointer — the transient one', () => {
    // Chrome and Firefox focus a button when it is clicked; a mouse press must
    // not stop the rotation for good.
    stubMatches(inside, false);
    expect(classifyFocusEntry(focusEvent(inside, outside))).toBe('pointer');
  });

  it('falls back to keyboard when :focus-visible throws', () => {
    // Sticky is the SAFE default: a thrown handler would leave the rotation
    // moving under keyboard focus.
    stubMatches(inside, 'throws');
    expect(classifyFocusEntry(focusEvent(inside, outside))).toBe('keyboard');
  });

  it('falls back to keyboard when there is no element to ask', () => {
    expect(classifyFocusEntry(focusEvent(null, outside))).toBe('keyboard');
  });

  it('classifies an entry from NOWHERE by the same probe', () => {
    // relatedTarget null — focus arriving from the page itself or another
    // window — is an entry, so it falls through to the :focus-visible branch.
    stubMatches(inside, false);
    expect(classifyFocusEntry(focusEvent(inside, null))).toBe('pointer');

    stubMatches(alsoInside, true);
    expect(classifyFocusEntry(focusEvent(alsoInside, null))).toBe('keyboard');
  });

  it('leavesRegion is true only when focus really left', () => {
    // focusout bubbles exactly as focusin does: without this guard every Tab
    // inside the region produces resume → suspend and one transient 'running'
    // frame, flipping the slides' live region off → polite → off.
    expect(leavesRegion(focusEvent(inside, alsoInside))).toBe(false);
    expect(leavesRegion(focusEvent(inside, outside))).toBe(true);
    expect(leavesRegion(focusEvent(inside, null))).toBe(true);
    // The region itself counts as inside it (Node.contains includes the node).
    expect(leavesRegion(focusEvent(inside, region))).toBe(false);
  });
});
