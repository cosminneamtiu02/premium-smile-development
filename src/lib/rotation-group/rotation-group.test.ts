import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClockEnv } from '../clock/clock.ts';
import { createRotation, liveRegion } from '../rotation/rotation.ts';
import type { Rotation } from '../rotation/rotation.ts';
import { createRotationGroup } from './rotation-group.ts';

// Runs in the `components` project (real chromium, vitest.config.ts) because
// the beat underneath calls the browser's own setTimeout — no React anywhere,
// which is what the ring buys (lib/scroll-lock precedent). Time is faked so a
// shared 6-second beat is a synchronous assertion; the environment is faked so
// no case ever touches the real prefers-reduced-motion query or the real tab.

const BEAT = 6_000;

/** A browser that never hides the tab, and reduces motion only on request. */
function quietEnv(reduced = false): ClockEnv {
  return {
    prefersReducedMotion: () => reduced,
    watchReducedMotion: () => () => {},
    isHidden: () => false,
    watchVisibility: () => () => {},
  };
}

/** A member of a group: an external-driver ring, already started. */
function createMember(count = 4, reduced = false): Rotation {
  const rotation = createRotation({
    count,
    // Ignored while the driver is external — the group owns the rhythm — but
    // required by the options, and a real consumer passes its own anyway.
    intervalMs: BEAT,
    driver: 'external',
    env: quietEnv(reduced),
  });
  rotation.start();
  return rotation;
}

function createTestGroup(reduced = false) {
  return createRotationGroup({ intervalMs: BEAT, env: quietEnv(reduced) });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('add() — membership is external-driver only', () => {
  it('refuses a rotation that runs its own clock', () => {
    const group = createTestGroup();
    const soloist = createRotation({
      count: 3,
      intervalMs: BEAT,
      env: quietEnv(),
    });

    expect(() => group.add(soloist)).toThrow(/external/);
    expect(group.getSnapshot().members).toBe(0);
  });

  it('counts members, and the returned remove function drops one', () => {
    const group = createTestGroup();
    const first = createMember();
    const second = createMember();

    const removeFirst = group.add(first);
    group.add(second);
    expect(group.getSnapshot().members).toBe(2);

    removeFirst();
    expect(group.getSnapshot().members).toBe(1);

    group.start();
    vi.advanceTimersByTime(BEAT);
    expect(first.getSnapshot().active).toBe(0);
    expect(second.getSnapshot().active).toBe(1);

    // Removing twice is a no-op, never a second decrement.
    removeFirst();
    expect(group.getSnapshot().members).toBe(1);
  });
});

describe('the beat — one clock, many rings', () => {
  it('advances every member together', () => {
    const group = createTestGroup();
    const first = createMember(4);
    const second = createMember(3);
    group.add(first);
    group.add(second);

    group.start();
    vi.advanceTimersByTime(BEAT);
    expect(first.getSnapshot().active).toBe(1);
    expect(second.getSnapshot().active).toBe(1);

    vi.advanceTimersByTime(BEAT);
    expect(first.getSnapshot().active).toBe(2);
    expect(second.getSnapshot().active).toBe(2);

    // Each ring keeps its own length: the beat is shared, the wrap is not.
    vi.advanceTimersByTime(BEAT);
    expect(first.getSnapshot().active).toBe(3);
    expect(second.getSnapshot().active).toBe(0);
  });

  it('lets a suspended member sit out while the others move', () => {
    const group = createTestGroup();
    const hovered = createMember();
    const other = createMember();
    group.add(hovered);
    group.add(other);
    group.start();

    hovered.suspend();
    vi.advanceTimersByTime(BEAT);
    expect(hovered.getSnapshot().active).toBe(0);
    expect(other.getSnapshot().active).toBe(1);

    // Resuming pays the same courtesy a hand navigation does, in beats: the
    // visitor has just been reading this slide, so the next beat is not theirs.
    hovered.resume();
    vi.advanceTimersByTime(BEAT);
    expect(hovered.getSnapshot().active).toBe(0);
    expect(other.getSnapshot().active).toBe(2);

    vi.advanceTimersByTime(BEAT);
    expect(hovered.getSnapshot().active).toBe(1);
    expect(other.getSnapshot().active).toBe(3);
  });

  it('lets a stopped member stay stopped for good', () => {
    const group = createTestGroup();
    const stopped = createMember();
    const other = createMember();
    group.add(stopped);
    group.add(other);
    group.start();

    stopped.pause();
    vi.advanceTimersByTime(3 * BEAT);
    expect(stopped.getSnapshot()).toMatchObject({
      active: 0,
      status: 'stopped',
    });
    expect(other.getSnapshot().active).toBe(3);
  });

  it('lets a hand-navigated member skip exactly one beat, then rejoin', () => {
    const group = createTestGroup();
    const navigated = createMember();
    const other = createMember();
    group.add(navigated);
    group.add(other);
    group.start();

    navigated.next();
    expect(navigated.getSnapshot().active).toBe(1);

    // The full-interval courtesy, paid in beats: this one is not for them.
    vi.advanceTimersByTime(BEAT);
    expect(navigated.getSnapshot().active).toBe(1);
    expect(other.getSnapshot().active).toBe(1);

    vi.advanceTimersByTime(BEAT);
    expect(navigated.getSnapshot().active).toBe(2);
    expect(other.getSnapshot().active).toBe(2);
  });

  it('keeps beating for the others when one member throws', () => {
    const group = createTestGroup();
    const throwing = createMember();
    const other = createMember();
    // A member's subscribers are React components. One that blows up must not
    // leave the rest of the set frozen mid-page for that beat.
    throwing.subscribe(() => {
      throw new Error('subscriber blew up');
    });
    group.add(throwing);
    group.add(other);
    group.start();

    expect(() => vi.advanceTimersByTime(BEAT)).toThrow(/subscriber blew up/);
    expect(other.getSnapshot().active).toBe(1);

    // …and the beat itself survives the round, so the next one lands too.
    expect(() => vi.advanceTimersByTime(BEAT)).toThrow(/subscriber blew up/);
    expect(other.getSnapshot().active).toBe(2);
  });

  it('holds the first dwell for the whole group', () => {
    const group = createRotationGroup({
      intervalMs: BEAT,
      startDelayMs: 1_000,
      env: quietEnv(),
    });
    const member = createMember();
    group.add(member);

    group.start();
    vi.advanceTimersByTime(999);
    expect(member.getSnapshot().active).toBe(0);
    vi.advanceTimersByTime(1);
    expect(member.getSnapshot().active).toBe(1);
    vi.advanceTimersByTime(BEAT);
    expect(member.getSnapshot().active).toBe(2);
  });
});

describe("the group's own control — its clock, mirrored", () => {
  it('reports the beat status and the member count in its snapshot', () => {
    const group = createTestGroup();
    expect(group.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'not-started',
      members: 0,
    });

    const member = createMember();
    group.add(member);
    expect(group.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'not-started',
      members: 1,
    });

    group.start();
    expect(group.getSnapshot()).toEqual({
      status: 'running',
      idleReason: null,
      members: 1,
    });
  });

  it('pauses and plays the whole beat', () => {
    const group = createTestGroup();
    const member = createMember();
    group.add(member);
    group.start();

    group.pause();
    expect(group.getSnapshot().status).toBe('stopped');
    vi.advanceTimersByTime(10 * BEAT);
    expect(member.getSnapshot().active).toBe(0);

    group.play();
    expect(group.getSnapshot().status).toBe('running');
    vi.advanceTimersByTime(BEAT);
    expect(member.getSnapshot().active).toBe(1);
  });

  it('FANS OUT pause() to the members, so none of them claims to run', () => {
    const group = createTestGroup();
    const first = createMember();
    const second = createMember();
    group.add(first);
    group.add(second);
    group.start();

    group.pause();

    // Without the fan-out a member kept reporting 'running' while the beat was
    // silent — and its live region stayed 'off', announcing nothing at all.
    for (const member of [first, second]) {
      expect(member.getSnapshot().status).toBe('stopped');
      expect(liveRegion(member.getSnapshot().status)).toBe('polite');
    }
  });

  it('FANS OUT play() so the one control can move a set that reduced motion idled', () => {
    const group = createTestGroup(true);
    const first = createMember(4, true);
    const second = createMember(4, true);
    group.add(first);
    group.add(second);
    group.start();

    // The automatic start is declined everywhere — beat and members alike.
    expect(group.getSnapshot()).toMatchObject({
      status: 'idle',
      idleReason: 'reduced-motion',
    });
    for (const member of [first, second]) {
      expect(member.getSnapshot()).toMatchObject({
        status: 'idle',
        idleReason: 'reduced-motion',
      });
    }
    vi.advanceTimersByTime(10 * BEAT);
    expect(first.getSnapshot().active).toBe(0);

    // One press of the GROUP's control — the only control a grouped set shows.
    group.play();
    expect(group.getSnapshot().status).toBe('running');
    for (const member of [first, second]) {
      expect(member.getSnapshot().status).toBe('running');
      expect(liveRegion(member.getSnapshot().status)).toBe('off');
    }

    vi.advanceTimersByTime(BEAT);
    expect(first.getSnapshot().active).toBe(1);
    expect(second.getSnapshot().active).toBe(1);
  });

  it('brings a member the visitor had paused back with the group control', () => {
    const group = createTestGroup();
    const member = createMember();
    group.add(member);
    group.start();

    member.pause();
    group.pause();
    expect(member.getSnapshot().status).toBe('stopped');

    // One control for the set: it speaks for a member that stopped itself too.
    group.play();
    expect(member.getSnapshot().status).toBe('running');
    vi.advanceTimersByTime(BEAT);
    expect(member.getSnapshot().active).toBe(1);
  });

  it('notifies subscribers and keeps the server snapshot constant', () => {
    const group = createTestGroup();
    let notified = 0;
    const unsubscribe = group.subscribe(() => {
      notified += 1;
    });
    const server = group.getServerSnapshot();

    group.add(createMember());
    expect(notified).toBe(1);
    group.start();
    expect(notified).toBe(2);

    unsubscribe();
    group.pause();
    expect(notified).toBe(2);

    expect(group.getServerSnapshot()).toBe(server);
    expect(server).toEqual({
      status: 'idle',
      idleReason: 'not-started',
      members: 0,
    });
  });
});

describe('dispose() — the beat stops, the members are left alone', () => {
  it('clears the timer and touches no member state', () => {
    const group = createTestGroup();
    const member = createMember();
    group.add(member);
    group.start();
    vi.advanceTimersByTime(BEAT);

    group.dispose();
    expect(vi.getTimerCount()).toBe(0);
    expect(group.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'not-started',
      members: 1,
    });
    expect(member.getSnapshot()).toEqual({
      active: 1,
      count: 4,
      status: 'running',
      idleReason: null,
    });

    vi.advanceTimersByTime(10 * BEAT);
    expect(member.getSnapshot().active).toBe(1);
  });

  it('keeps its membership, so a StrictMode client-mount remount just starts again', () => {
    const group = createTestGroup();
    const member = createMember();
    group.add(member);

    group.start();
    group.dispose();
    group.start();

    vi.advanceTimersByTime(BEAT);
    expect(member.getSnapshot().active).toBe(1);
  });
});
