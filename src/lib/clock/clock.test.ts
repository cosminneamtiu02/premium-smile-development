import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClock } from './clock.ts';
import type { ClockEnv } from './clock.ts';

// Runs in the `components` project (real chromium, vitest.config.ts) because the
// module calls the browser's own setTimeout and, by default, matchMedia and
// document.visibilityState — no React anywhere near it, which is what a plain
// mechanics module in the ring buys (the lib/scroll-lock precedent).
//
// ── FAKE TIMERS, FIRST USE IN THIS REPO (board dispatch). Every rule below is
// about WHEN something happens, so the suite owns time: vi.useFakeTimers()
// replaces the page's setTimeout with a clock the test advances by hand. That
// makes a 5-second interval a synchronous assertion instead of a five-second
// wait, and it makes "the tick lands at 5000 ms and NOT at 4999" expressible at
// all. The first test below is the PROBE that proves the substitution reaches
// the browser's timers here; nothing after it means anything without it.
//
// ── THE ENVIRONMENT IS ALWAYS FAKED. Not one case flips the real
// prefers-reduced-motion query or hides the real tab: both are machine-level
// state a test may not own, and a suite that depended on them would pass on one
// workstation and fail on another. Every clock below is built with an `env`
// object of plain functions (the ClockEnv seam, board Q9's test seam), so the
// suite can flip the preference mid-run and count exactly how many watchers
// were installed and removed.

/** One rhythm for the whole suite; a dwell that differs from it where it matters. */
const INTERVAL = 5_000;

/** A fake browser environment: readable, flippable, and counted. */
function createEnv(initial: { reduced?: boolean; hidden?: boolean } = {}) {
  let reduced = initial.reduced ?? false;
  let hidden = initial.hidden ?? false;
  const reducedListeners = new Set<(reduced: boolean) => void>();
  const visibilityListeners = new Set<(hidden: boolean) => void>();
  const calls = {
    prefersReducedMotion: 0,
    isHidden: 0,
    watchReducedMotion: 0,
    watchVisibility: 0,
    unwatchReducedMotion: 0,
    unwatchVisibility: 0,
  };

  const env: ClockEnv = {
    prefersReducedMotion: () => {
      calls.prefersReducedMotion += 1;
      return reduced;
    },
    isHidden: () => {
      calls.isHidden += 1;
      return hidden;
    },
    watchReducedMotion: (listener) => {
      calls.watchReducedMotion += 1;
      reducedListeners.add(listener);
      return () => {
        calls.unwatchReducedMotion += 1;
        reducedListeners.delete(listener);
      };
    },
    watchVisibility: (listener) => {
      calls.watchVisibility += 1;
      visibilityListeners.add(listener);
      return () => {
        calls.unwatchVisibility += 1;
        visibilityListeners.delete(listener);
      };
    },
  };

  return {
    env,
    calls,
    /** How many watchers are live right now — dispose() must leave none. */
    watching: () => reducedListeners.size + visibilityListeners.size,
    flipReducedMotion(next: boolean) {
      reduced = next;
      for (const listener of [...reducedListeners]) listener(next);
    },
    flipVisibility(next: boolean) {
      hidden = next;
      for (const listener of [...visibilityListeners]) listener(next);
    },
  };
}

/** A clock plus its tick counter and its fake environment. */
function createTestClock(
  options: {
    intervalMs?: number;
    startDelayMs?: number;
    driver?: 'internal' | 'external';
    reduced?: boolean;
    hidden?: boolean;
    /** Runs inside onTick, after the counter — for consumers that misbehave. */
    onTick?: () => void;
  } = {},
) {
  const env = createEnv({ reduced: options.reduced, hidden: options.hidden });
  let ticks = 0;
  const clock = createClock({
    intervalMs: options.intervalMs ?? INTERVAL,
    startDelayMs: options.startDelayMs,
    driver: options.driver,
    onTick: () => {
      ticks += 1;
      options.onTick?.();
    },
    env: env.env,
  });
  return { clock, env, ticks: () => ticks };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('PROBE — fake timers reach the browser project timers', () => {
  it('fires a setTimeout only when the test advances the clock', () => {
    let fired = false;
    setTimeout(() => {
      fired = true;
    }, 1_000);

    expect(fired).toBe(false);
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(999);
    expect(fired).toBe(false);

    vi.advanceTimersByTime(1);
    expect(fired).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('createClock — construction touches nothing', () => {
  it('arms no timer, calls no env function, and reads idle(not-started)', () => {
    const { clock, env, ticks } = createTestClock();

    expect(vi.getTimerCount()).toBe(0);
    expect(env.calls).toEqual({
      prefersReducedMotion: 0,
      isHidden: 0,
      watchReducedMotion: 0,
      watchVisibility: 0,
      unwatchReducedMotion: 0,
      unwatchVisibility: 0,
    });
    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'not-started',
    });

    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);
  });

  it('refuses an intervalMs that is not a usable delay', () => {
    // The old repo's "0 means disabled" convention would become a 0 ms chain
    // here: a flashing widget with a pinned CPU. So would Infinity, NaN and
    // anything above 2^31 − 1 — WebIDL converts every one of them to 0.
    expect(() => createTestClock({ intervalMs: 0 })).toThrow(RangeError);
    for (const intervalMs of [
      0,
      0.5,
      -1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      2 ** 31,
    ]) {
      expect(() => createTestClock({ intervalMs })).toThrow(/intervalMs/);
    }
  });

  it('refuses a startDelayMs that is not a usable delay', () => {
    expect(() => createTestClock({ startDelayMs: 0 })).toThrow(RangeError);
    for (const startDelayMs of [
      0,
      0.5,
      -250,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      2 ** 31,
    ]) {
      expect(() => createTestClock({ startDelayMs })).toThrow(/startDelayMs/);
    }
  });

  it('accepts the largest delay setTimeout can actually hold', () => {
    expect(() => createTestClock({ intervalMs: 2_147_483_647 })).not.toThrow();
    expect(() =>
      createTestClock({ startDelayMs: 2_147_483_647 }),
    ).not.toThrow();
  });
});

describe('start() — the automatic start and its first dwell', () => {
  it('runs, ticks first at startDelayMs, then every intervalMs', () => {
    const { clock, ticks } = createTestClock({ startDelayMs: 1_000 });

    clock.start();
    expect(clock.getSnapshot()).toEqual({
      status: 'running',
      idleReason: null,
    });

    vi.advanceTimersByTime(999);
    expect(ticks()).toBe(0);
    vi.advanceTimersByTime(1);
    expect(ticks()).toBe(1);

    vi.advanceTimersByTime(INTERVAL - 1);
    expect(ticks()).toBe(1);
    vi.advanceTimersByTime(1);
    expect(ticks()).toBe(2);

    vi.advanceTimersByTime(INTERVAL);
    expect(ticks()).toBe(3);
  });

  it('defaults the first dwell to a full interval', () => {
    const { clock, ticks } = createTestClock();

    clock.start();
    vi.advanceTimersByTime(INTERVAL - 1);
    expect(ticks()).toBe(0);
    vi.advanceTimersByTime(1);
    expect(ticks()).toBe(1);
  });

  it('is a no-op unless the clock is idle — one timer, one watcher pair', () => {
    const { clock, env, ticks } = createTestClock({ startDelayMs: 1_000 });

    clock.start();
    vi.advanceTimersByTime(500);
    clock.start();

    expect(vi.getTimerCount()).toBe(1);
    expect(env.calls.watchReducedMotion).toBe(1);
    expect(env.calls.watchVisibility).toBe(1);
    expect(env.watching()).toBe(2);

    // The dwell was not restarted by the second call.
    vi.advanceTimersByTime(500);
    expect(ticks()).toBe(1);
  });

  it('never undoes a play() the visitor asked for under reduced motion', () => {
    const { clock, ticks } = createTestClock({ reduced: true });

    clock.play();
    clock.start(); // e.g. a second mount effect firing after the press

    expect(clock.getSnapshot()).toEqual({
      status: 'running',
      idleReason: null,
    });
    vi.advanceTimersByTime(INTERVAL);
    expect(ticks()).toBe(1);
  });
});

describe('reduced motion — a default the user can override', () => {
  it('declines the automatic start and play() overrides it', () => {
    const { clock, ticks } = createTestClock({ reduced: true });

    clock.start();
    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'reduced-motion',
    });
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);

    clock.play();
    expect(clock.getSnapshot()).toEqual({
      status: 'running',
      idleReason: null,
    });
    vi.advanceTimersByTime(INTERVAL);
    expect(ticks()).toBe(1);
  });

  it('lets the structural gate outrank the preference', () => {
    const { clock } = createTestClock({ reduced: true });

    clock.setEnabled(false);
    clock.start();

    // 'disabled' is the reason a consumer's control acts on (there is nothing
    // to rotate); 'reduced-motion' would invite a play button that cannot work.
    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'disabled',
    });
  });

  it('stops a running clock when the preference flips TO reduce', () => {
    const { clock, env, ticks } = createTestClock();

    clock.start();
    env.flipReducedMotion(true);

    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'reduced-motion',
    });
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);
  });

  it('stops a clock the visitor had PLAYED, too — the flip is newer', () => {
    const { clock, env, ticks } = createTestClock();

    clock.play();
    env.flipReducedMotion(true);

    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'reduced-motion',
    });
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);
  });

  it('stops a SUSPENDED clock on the flip as well', () => {
    const { clock, env } = createTestClock();

    clock.start();
    clock.suspend('pointer');
    env.flipReducedMotion(true);

    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'reduced-motion',
    });
  });

  it('demotes an earlier play() so a later re-enable does not start moving', () => {
    const { clock, env, ticks } = createTestClock();

    clock.play(); // the visitor asked for motion…
    clock.setEnabled(false);
    env.flipReducedMotion(true); // …and then asked the OS to stop it
    clock.setEnabled(true);

    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'reduced-motion',
    });
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);
  });

  it('never auto-resumes when the preference flips back', () => {
    const { clock, env, ticks } = createTestClock();

    clock.start();
    env.flipReducedMotion(true);
    env.flipReducedMotion(false);

    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'reduced-motion',
    });
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);

    clock.play();
    vi.advanceTimersByTime(INTERVAL);
    expect(ticks()).toBe(1);
  });
});

describe('setEnabled() — the structural gate (a list too short to rotate)', () => {
  it('idles a running clock as disabled and re-runs when enabled again', () => {
    const { clock, ticks } = createTestClock();

    clock.start();
    clock.setEnabled(false);
    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'disabled',
    });
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);

    clock.setEnabled(true);
    expect(clock.getSnapshot()).toEqual({
      status: 'running',
      idleReason: null,
    });
    vi.advanceTimersByTime(INTERVAL);
    expect(ticks()).toBe(1);
  });

  it('re-applies the reduced-motion gate for an AUTOMATIC start', () => {
    const { clock } = createTestClock({ reduced: true });

    clock.setEnabled(false);
    clock.start();
    clock.setEnabled(true);

    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'reduced-motion',
    });
  });

  it('honours a standing play() when the list grows, even under reduce', () => {
    const { clock, ticks } = createTestClock({ reduced: true });

    clock.play();
    clock.setEnabled(false);
    clock.setEnabled(true);

    expect(clock.getSnapshot()).toEqual({
      status: 'running',
      idleReason: null,
    });
    vi.advanceTimersByTime(INTERVAL);
    expect(ticks()).toBe(1);
  });

  it('installs its watchers once across repeated begins', () => {
    const { clock, env } = createTestClock();

    clock.start();
    clock.setEnabled(false);
    clock.setEnabled(true);

    expect(env.calls.watchReducedMotion).toBe(1);
    expect(env.calls.watchVisibility).toBe(1);
  });

  it('declines start() and play() while disabled', () => {
    const { clock, ticks } = createTestClock();

    clock.setEnabled(false);
    clock.start();
    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'disabled',
    });

    clock.play();
    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'disabled',
    });
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);
  });

  it('does not start by itself when enabled before anyone called start()', () => {
    const { clock, ticks } = createTestClock();

    clock.setEnabled(false);
    clock.setEnabled(true);

    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'not-started',
    });
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);
  });

  it('stops calling itself disabled once the gate re-opens after a dispose', () => {
    const { clock, env, ticks } = createTestClock();

    clock.start();
    clock.setEnabled(false);
    clock.dispose();
    clock.setEnabled(true);

    // A stale 'disabled' would have a consumer render its "too few items" state
    // for a list that is perfectly fine — and nothing may arm behind a dispose.
    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'not-started',
    });
    expect(vi.getTimerCount()).toBe(0);
    expect(env.watching()).toBe(0);
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);
  });

  it('does not start by itself after dispose() either', () => {
    const { clock, ticks } = createTestClock();

    clock.start();
    clock.dispose();
    clock.setEnabled(false);
    clock.setEnabled(true);

    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);
  });
});

describe('pause() — sticky, the way the rotation control is', () => {
  it('stops the clock and survives resume() and start()', () => {
    const { clock, ticks } = createTestClock();

    clock.start();
    clock.pause();
    expect(clock.getSnapshot()).toEqual({
      status: 'stopped',
      idleReason: null,
    });
    expect(vi.getTimerCount()).toBe(0);

    clock.resume();
    expect(clock.getSnapshot()).toEqual({
      status: 'stopped',
      idleReason: null,
    });
    clock.start();
    expect(clock.getSnapshot()).toEqual({
      status: 'stopped',
      idleReason: null,
    });

    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);
  });

  it('only play() undoes it, and it re-arms a FULL interval', () => {
    const { clock, ticks } = createTestClock({ startDelayMs: 1_000 });

    clock.start();
    clock.pause();
    clock.play();

    expect(clock.getSnapshot()).toEqual({
      status: 'running',
      idleReason: null,
    });
    vi.advanceTimersByTime(INTERVAL - 1);
    expect(ticks()).toBe(0);
    vi.advanceTimersByTime(1);
    expect(ticks()).toBe(1);
  });
});

describe('suspend()/resume() — the transient pause of hover and focus', () => {
  it('holds the clock while suspended and re-arms a FULL interval on resume', () => {
    const { clock, ticks } = createTestClock();

    clock.start();
    vi.advanceTimersByTime(INTERVAL * 0.9);
    clock.suspend();
    expect(clock.getSnapshot()).toEqual({
      status: 'suspended',
      idleReason: null,
    });
    expect(vi.getTimerCount()).toBe(0);

    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);

    clock.resume();
    expect(clock.getSnapshot()).toEqual({
      status: 'running',
      idleReason: null,
    });
    vi.advanceTimersByTime(INTERVAL - 1);
    expect(ticks()).toBe(0);
    vi.advanceTimersByTime(1);
    expect(ticks()).toBe(1);
  });

  it('never suspends from idle', () => {
    const { clock } = createTestClock({ reduced: true });

    clock.start();
    clock.suspend();
    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'reduced-motion',
    });
  });
});

describe('suspension is CAUSE-KEYED — hover and focus are separate flags', () => {
  it('stays suspended while any cause remains', () => {
    const { clock, ticks } = createTestClock();

    clock.start();
    clock.suspend('focus');
    clock.suspend('pointer');

    // The pointer leaves, but keyboard focus is still inside the widget: the
    // APG's reason for two flags, and the bug a single boolean shipped.
    clock.resume('pointer');
    expect(clock.getSnapshot().status).toBe('suspended');
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);

    clock.resume('focus');
    expect(clock.getSnapshot().status).toBe('running');
    vi.advanceTimersByTime(INTERVAL);
    expect(ticks()).toBe(1);
  });

  it('is idempotent per cause (browsers deliver unbalanced enter/leave)', () => {
    const { clock } = createTestClock();

    clock.start();
    clock.suspend('pointer');
    clock.suspend('pointer');
    clock.resume('pointer');

    expect(clock.getSnapshot().status).toBe('running');
  });

  it('defaults both sides to the pointer', () => {
    const { clock } = createTestClock();

    clock.start();
    clock.suspend();
    expect(clock.getSnapshot().status).toBe('suspended');
    clock.resume('pointer');
    expect(clock.getSnapshot().status).toBe('running');
  });

  it('lets play() clear every cause — an explicit request outranks the courtesy', () => {
    const { clock, ticks } = createTestClock();

    clock.start();
    clock.suspend('pointer');
    clock.suspend('focus');
    clock.play();

    expect(clock.getSnapshot().status).toBe('running');
    vi.advanceTimersByTime(INTERVAL);
    expect(ticks()).toBe(1);

    // A stale leave arriving afterwards must not disturb the running clock.
    clock.resume('pointer');
    expect(clock.getSnapshot().status).toBe('running');
  });

  it('forgets its causes when the clock stops or idles', () => {
    const { clock } = createTestClock();

    clock.start();
    clock.suspend('focus');
    clock.pause();
    clock.play();
    expect(clock.getSnapshot().status).toBe('running');

    clock.suspend('focus');
    clock.setEnabled(false);
    clock.setEnabled(true);
    expect(clock.getSnapshot().status).toBe('running');
  });
});

describe('restart() — the full-interval courtesy after user navigation', () => {
  it('pushes the next tick a whole interval away (0.9T → 1.9T)', () => {
    const { clock, ticks } = createTestClock();

    clock.start();
    vi.advanceTimersByTime(INTERVAL * 0.9);
    clock.restart();

    vi.advanceTimersByTime(INTERVAL - 1);
    expect(ticks()).toBe(0);
    vi.advanceTimersByTime(1);
    expect(ticks()).toBe(1);
  });

  it('is a no-op unless the clock is running', () => {
    const { clock, ticks } = createTestClock();

    clock.restart();
    expect(vi.getTimerCount()).toBe(0);
    clock.start();
    clock.pause();
    clock.restart();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);
  });
});

describe('tab visibility — timer hygiene, not a pause', () => {
  it('clears the timer while hidden and leaves the status alone', () => {
    const { clock, env, ticks } = createTestClock();

    clock.start();
    env.flipVisibility(true);

    expect(clock.getSnapshot()).toEqual({
      status: 'running',
      idleReason: null,
    });
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);
  });

  it('re-arms a FULL interval when the tab comes back, only if running', () => {
    const { clock, env, ticks } = createTestClock();

    clock.start();
    vi.advanceTimersByTime(INTERVAL * 0.9);
    env.flipVisibility(true);
    env.flipVisibility(false);

    vi.advanceTimersByTime(INTERVAL - 1);
    expect(ticks()).toBe(0);
    vi.advanceTimersByTime(1);
    expect(ticks()).toBe(1);

    clock.pause();
    env.flipVisibility(true);
    env.flipVisibility(false);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(1);
  });

  it('arms nothing when start() happens in an already-hidden tab', () => {
    const { clock, env, ticks } = createTestClock({ hidden: true });

    clock.start();
    expect(clock.getSnapshot()).toEqual({
      status: 'running',
      idleReason: null,
    });
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);

    env.flipVisibility(false);
    vi.advanceTimersByTime(INTERVAL);
    expect(ticks()).toBe(1);
  });

  it('arms the ORDINARY interval once the dwell has been spent', () => {
    const { clock, env, ticks } = createTestClock({ startDelayMs: 12_000 });

    clock.start();
    vi.advanceTimersByTime(12_000);
    expect(ticks()).toBe(1);

    env.flipVisibility(true);
    env.flipVisibility(false);

    // What is owed now is a plain interval — the dwell was a one-time courtesy.
    vi.advanceTimersByTime(INTERVAL - 1);
    expect(ticks()).toBe(1);
    vi.advanceTimersByTime(1);
    expect(ticks()).toBe(2);
  });

  it('keeps the FIRST DWELL owed across a tab switch', () => {
    const { clock, env, ticks } = createTestClock({
      hidden: true,
      startDelayMs: 12_000,
    });

    clock.start();
    env.flipVisibility(false);

    // The dwell the band chose, not the plain interval it would have decayed to.
    vi.advanceTimersByTime(12_000 - 1);
    expect(ticks()).toBe(0);
    vi.advanceTimersByTime(1);
    expect(ticks()).toBe(1);

    // And the rhythm afterwards is the ordinary one.
    vi.advanceTimersByTime(INTERVAL);
    expect(ticks()).toBe(2);
  });
});

describe('a consumer callback that misbehaves', () => {
  it('keeps the chain alive when onTick throws', () => {
    let thrown = 0;
    const { clock, ticks } = createTestClock({
      onTick: () => {
        thrown += 1;
        if (thrown === 1) throw new Error('consumer blew up');
      },
    });

    clock.start();
    expect(() => vi.advanceTimersByTime(INTERVAL)).toThrow(/consumer blew up/);

    // A 'running' status with no timer behind it is the one state nothing
    // recovers from without a dispose()/start() cycle.
    expect(clock.getSnapshot().status).toBe('running');
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(INTERVAL);
    expect(ticks()).toBe(2);
  });

  it('leaves no timer behind when onTick pauses the clock', () => {
    const { clock } = createTestClock({
      onTick: () => clock.pause(),
    });

    clock.start();
    vi.advanceTimersByTime(INTERVAL);

    expect(clock.getSnapshot().status).toBe('stopped');
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('the store protocol — what useSyncExternalStore reads', () => {
  it('notifies subscribers on change and stops after unsubscribe', () => {
    const { clock } = createTestClock();
    let notified = 0;

    const unsubscribe = clock.subscribe(() => {
      notified += 1;
    });
    clock.start();
    expect(notified).toBe(1);

    clock.pause();
    expect(notified).toBe(2);

    unsubscribe();
    clock.play();
    expect(notified).toBe(2);
  });

  it('hands back the SAME snapshot object until something changes', () => {
    const { clock } = createTestClock();

    const atRest = clock.getSnapshot();
    expect(clock.getSnapshot()).toBe(atRest);

    clock.start();
    const running = clock.getSnapshot();
    expect(running).not.toBe(atRest);

    vi.advanceTimersByTime(3 * INTERVAL);
    expect(clock.getSnapshot()).toBe(running);

    clock.restart();
    expect(clock.getSnapshot()).toBe(running);
  });

  it('keeps the server snapshot constant forever', () => {
    const { clock } = createTestClock();
    const server = clock.getServerSnapshot();

    clock.start();
    clock.pause();
    clock.play();

    expect(clock.getServerSnapshot()).toBe(server);
    expect(server).toEqual({ status: 'idle', idleReason: 'not-started' });
  });

  it('leaves no timer alive when a subscriber disposes on the first running', () => {
    // React runs store listeners synchronously, so a component that unmounts on
    // the same status change must not leave the timer it was just handed.
    const { clock, env, ticks } = createTestClock();
    let disposed = false;

    clock.subscribe(() => {
      if (disposed || clock.getSnapshot().status !== 'running') return;
      disposed = true;
      clock.dispose();
    });
    clock.start();

    expect(vi.getTimerCount()).toBe(0);
    expect(env.watching()).toBe(0);
    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'not-started',
    });
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);
  });

  it('leaves no timer alive when a subscriber disposes on a RESUME', () => {
    // resume() arms before it publishes, for the same reason begin() does.
    const { clock, env, ticks } = createTestClock();
    clock.start();
    clock.suspend('pointer');

    let disposed = false;
    clock.subscribe(() => {
      if (disposed || clock.getSnapshot().status !== 'running') return;
      disposed = true;
      clock.dispose();
    });
    clock.resume('pointer');

    expect(vi.getTimerCount()).toBe(0);
    expect(env.watching()).toBe(0);
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);
  });

  it('leaves no timer alive when a subscriber pauses on the first running', () => {
    const { clock, ticks } = createTestClock();
    let paused = false;

    clock.subscribe(() => {
      if (paused || clock.getSnapshot().status !== 'running') return;
      paused = true;
      clock.pause();
    });
    clock.start();

    expect(vi.getTimerCount()).toBe(0);
    expect(clock.getSnapshot().status).toBe('stopped');
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);
  });
});

describe('dispose() — re-entrant with start(), as a remounting island demands', () => {
  it('clears the timer and every watcher, and idles as not-started', () => {
    const { clock, env, ticks } = createTestClock();

    clock.start();
    expect(env.watching()).toBe(2);

    clock.dispose();
    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'not-started',
    });
    expect(vi.getTimerCount()).toBe(0);
    expect(env.watching()).toBe(0);
    expect(env.calls.unwatchReducedMotion).toBe(1);
    expect(env.calls.unwatchVisibility).toBe(1);

    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);
  });

  it('lets start() arm again afterwards (mount → cleanup → mount)', () => {
    const { clock, env, ticks } = createTestClock();

    clock.start();
    clock.dispose();
    clock.start();

    expect(clock.getSnapshot()).toEqual({
      status: 'running',
      idleReason: null,
    });
    expect(env.watching()).toBe(2);
    vi.advanceTimersByTime(INTERVAL);
    expect(ticks()).toBe(1);
  });

  it('is idempotent, and leaves a stopped clock stopped', () => {
    const { clock, env } = createTestClock();

    clock.start();
    clock.dispose();
    clock.dispose();
    expect(env.calls.unwatchReducedMotion).toBe(1);
    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'not-started',
    });

    clock.start();
    clock.pause();
    clock.dispose();
    expect(clock.getSnapshot()).toEqual({
      status: 'stopped',
      idleReason: null,
    });
  });
});

describe("the external driver — someone else's beat", () => {
  it('runs without arming any timer of its own', () => {
    const { clock, ticks } = createTestClock({ driver: 'external' });

    clock.start();
    expect(clock.getSnapshot()).toEqual({
      status: 'running',
      idleReason: null,
    });
    expect(vi.getTimerCount()).toBe(0);

    vi.advanceTimersByTime(100 * INTERVAL);
    expect(ticks()).toBe(0);
  });

  it('ticks only while running', () => {
    const { clock, ticks } = createTestClock({ driver: 'external' });

    clock.tick();
    expect(ticks()).toBe(0);

    clock.start();
    clock.tick();
    clock.tick();
    expect(ticks()).toBe(2);

    clock.suspend();
    clock.tick();
    expect(ticks()).toBe(2);

    clock.pause();
    clock.tick();
    expect(ticks()).toBe(2);
  });

  it('swallows exactly one tick after restart(), then rejoins the beat', () => {
    const { clock, ticks } = createTestClock({ driver: 'external' });

    clock.start();
    clock.restart();

    clock.tick();
    expect(ticks()).toBe(0);
    clock.tick();
    expect(ticks()).toBe(1);
    clock.tick();
    expect(ticks()).toBe(2);
  });

  it('pays the hover courtesy in beats when it resumes', () => {
    // The external twin of the internal "resume arms a FULL interval": the
    // visitor has just been reading this slide, so the next shared beat is not
    // for them.
    const { clock, ticks } = createTestClock({ driver: 'external' });

    clock.start();
    clock.suspend('pointer');
    clock.resume('pointer');

    clock.tick();
    expect(ticks()).toBe(0);
    clock.tick();
    expect(ticks()).toBe(1);
  });

  it('lets play() clear a skip owed to an earlier navigation', () => {
    const { clock, ticks } = createTestClock({ driver: 'external' });

    clock.start();
    clock.restart();
    clock.play(); // the newest statement wins

    clock.tick();
    expect(ticks()).toBe(1);
  });
});

describe('the default environment — the real document and the real media query', () => {
  // Every OTHER clock in this file injects a fake `env`, and that is exactly
  // what leaves the two DEFAULT adapters unexecuted: documentIsHidden and
  // watchDocumentVisibility over the real document, lib/reduced-motion over the
  // real window.matchMedia, and the `env.x ?? default` wiring that reaches
  // them. A typo in any of it would have passed the whole suite (org-review
  // F2a, owner approval fb-425–430, 2026-09-09). These cases therefore build
  // clocks WITHOUT the seam — and still never touch the machine's real
  // preference or the real tab, because both browser surfaces are stubbed the
  // way reduced-motion.test.ts already stubs them: an OWN property shadowing
  // the real one, deleted again in the local afterEach so the prototype's
  // accessor comes back.

  type MediaHandler = (event: MediaQueryListEvent) => void;

  /** The stub list's live 'change' handlers — the watcher's install/remove proof. */
  let mediaHandlers = new Set<MediaHandler>();
  /** What the stubbed document.visibilityState currently answers. */
  let visibility: DocumentVisibilityState = 'visible';

  /** Install a matchMedia whose list reports `matches` and records handlers. */
  function stubMatchMedia(matches: boolean): void {
    const handlers = new Set<MediaHandler>();
    mediaHandlers = handlers;
    const list = {
      matches,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: (type: string, handler: MediaHandler) => {
        if (type === 'change') handlers.add(handler);
      },
      removeEventListener: (type: string, handler: MediaHandler) => {
        if (type === 'change') handlers.delete(handler);
      },
    } as unknown as MediaQueryList;

    Object.defineProperty(window, 'matchMedia', {
      value: () => list,
      configurable: true,
      writable: true,
    });
  }

  /** The OS-level flip, delivered exactly as the browser delivers it. */
  function flipReducedMotion(matches: boolean): void {
    for (const handler of [...mediaHandlers]) {
      handler({ matches } as MediaQueryListEvent);
    }
  }

  /** Shadow document.visibilityState with a value this test owns. */
  function stubVisibility(state: DocumentVisibilityState): void {
    visibility = state;
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });
  }

  /** Move the tab, then fire the document's own event — no fake in between. */
  function flipVisibility(state: DocumentVisibilityState): void {
    visibility = state;
    document.dispatchEvent(new Event('visibilitychange'));
  }

  /** A clock whose environment is whatever the browser says (or half of it). */
  function createDefaultClock(env?: ClockEnv) {
    let ticks = 0;
    const clock = createClock({
      intervalMs: INTERVAL,
      onTick: () => {
        ticks += 1;
      },
      env,
    });
    return { clock, ticks: () => ticks };
  }

  afterEach(() => {
    // The own properties go, and Window.prototype.matchMedia and Document's
    // own visibilityState getter become visible again.
    Reflect.deleteProperty(window, 'matchMedia');
    Reflect.deleteProperty(document, 'visibilityState');
  });

  it("reacts to the document's own visibilitychange, and unhooks on dispose", () => {
    stubMatchMedia(false);
    stubVisibility('visible');
    const { clock, ticks } = createDefaultClock();

    clock.start();
    expect(clock.getSnapshot()).toEqual({
      status: 'running',
      idleReason: null,
    });
    expect(vi.getTimerCount()).toBe(1);

    // Hidden: the timer goes and the STATUS stays — a background tab is not a
    // pause (clock.ts, ENV REACTIONS).
    flipVisibility('hidden');
    expect(vi.getTimerCount()).toBe(0);
    expect(clock.getSnapshot().status).toBe('running');
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);

    // Back again: a whole interval, then the ordinary rhythm.
    flipVisibility('visible');
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(INTERVAL - 1);
    expect(ticks()).toBe(0);
    vi.advanceTimersByTime(1);
    expect(ticks()).toBe(1);

    // dispose() must take the document listener back off — otherwise every
    // mount of an island would leave one behind on the page's document.
    const removeListener = vi.spyOn(document, 'removeEventListener');
    clock.dispose();
    expect(vi.getTimerCount()).toBe(0);
    expect(
      removeListener.mock.calls.some(([type]) => type === 'visibilitychange'),
    ).toBe(true);
    removeListener.mockRestore();

    // …and a later flip reaches nobody: same snapshot object, no timer.
    const afterDispose = clock.getSnapshot();
    flipVisibility('hidden');
    flipVisibility('visible');
    expect(vi.getTimerCount()).toBe(0);
    expect(clock.getSnapshot()).toBe(afterDispose);
  });

  it('watches the real reduce query, and removes that handler on dispose', () => {
    stubVisibility('visible');
    stubMatchMedia(false);
    const { clock, ticks } = createDefaultClock();

    clock.start();
    expect(clock.getSnapshot().status).toBe('running');
    // The default watchReducedMotion really did subscribe to the query object.
    expect(mediaHandlers.size).toBe(1);

    flipReducedMotion(true);
    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'reduced-motion',
    });
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);

    clock.dispose();
    expect(mediaHandlers.size).toBe(0);
  });

  it('falls back per FUNCTION, so a PARTIAL env still meets the real query', () => {
    // `env.x ?? default` is resolved one function at a time, not one object at
    // a time: an env that names only isHidden leaves the other three to the
    // browser.
    stubVisibility('visible');
    stubMatchMedia(true); // the OS is asking for less motion
    let hiddenReads = 0;
    const { clock, ticks } = createDefaultClock({
      isHidden: () => {
        hiddenReads += 1;
        return false;
      },
    });

    clock.start();

    // The injected half was used…
    expect(hiddenReads).toBe(1);
    // …and the real query declined the automatic start all the same.
    expect(clock.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'reduced-motion',
    });
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10 * INTERVAL);
    expect(ticks()).toBe(0);

    // The default WATCHER was installed too (begin() watches before it gates),
    // and dispose() takes it off.
    expect(mediaHandlers.size).toBe(1);
    clock.dispose();
    expect(mediaHandlers.size).toBe(0);
  });
});
