import { afterEach, describe, expect, it } from 'vitest';
import { prefersReducedMotion, watchReducedMotion } from './reduced-motion.ts';

// Runs in the `components` project (real chromium, vitest.config.ts) because it
// touches window.matchMedia — there is no React in here at all, which is the
// whole point of a plain seam module (the lib/scroll-lock precedent).
//
// The REAL query is never read and never flipped: an OS-level preference is not
// something a test may set, and a suite that depended on the machine's setting
// would pass on one workstation and fail on another. So every case installs a
// STUB matchMedia on window and afterEach removes it again, handing the
// prototype's real method back.

/** The one query this module exists for — asserted, so a typo fails here. */
const QUERY = '(prefers-reduced-motion: reduce)';

type Handler = (event: MediaQueryListEvent) => void;

interface Stub {
  /** Every query string matchMedia was called with. */
  queries: string[];
  /** The 'change' handlers currently registered. */
  handlers: Set<Handler>;
  /** Fire a change, exactly as the browser would. */
  change(matches: boolean): void;
}

/** Install a fake matchMedia whose list reports `matches`. */
function stubMatchMedia(matches: boolean): Stub {
  const handlers = new Set<Handler>();
  const stub: Stub = {
    queries: [],
    handlers,
    change(next: boolean) {
      for (const handler of [...handlers]) {
        handler({ matches: next } as MediaQueryListEvent);
      }
    },
  };

  const list = {
    matches,
    media: QUERY,
    addEventListener: (type: string, handler: Handler) => {
      if (type === 'change') handlers.add(handler);
    },
    removeEventListener: (type: string, handler: Handler) => {
      if (type === 'change') handlers.delete(handler);
    },
  } as unknown as MediaQueryList;

  Object.defineProperty(window, 'matchMedia', {
    value: (query: string) => {
      stub.queries.push(query);
      return list;
    },
    configurable: true,
    writable: true,
  });

  return stub;
}

/**
 * Install a matchMedia whose list predates addEventListener — Safari < 14,
 * which carries only the deprecated addListener pair.
 */
function stubLegacyMatchMedia(matches: boolean): void {
  const list = {
    matches,
    media: QUERY,
    addListener: () => {},
    removeListener: () => {},
  } as unknown as MediaQueryList;

  Object.defineProperty(window, 'matchMedia', {
    value: () => list,
    configurable: true,
    writable: true,
  });
}

/** Shadow matchMedia with `undefined` — the server shape. */
function stubNoMatchMedia(): void {
  Object.defineProperty(window, 'matchMedia', {
    value: undefined,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  // Delete the OWN property the stub installed; Window.prototype's real
  // matchMedia becomes visible again.
  Reflect.deleteProperty(window, 'matchMedia');
});

describe('prefersReducedMotion — reading the preference', () => {
  it('is false when matchMedia does not exist (server, ancient engines)', () => {
    stubNoMatchMedia();
    expect(prefersReducedMotion()).toBe(false);
  });

  it('is true when the reduce query matches', () => {
    const stub = stubMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
    expect(stub.queries).toEqual([QUERY]);
  });

  it('is false when the reduce query does not match', () => {
    stubMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('watchReducedMotion — reacting to a mid-visit flip', () => {
  it('calls the listener with the new value on every change', () => {
    const stub = stubMatchMedia(false);
    const seen: boolean[] = [];

    watchReducedMotion((reduced) => seen.push(reduced));
    stub.change(true);
    stub.change(false);

    expect(seen).toEqual([true, false]);
  });

  it('removes the listener when the returned unsubscribe is called', () => {
    const stub = stubMatchMedia(false);
    const seen: boolean[] = [];

    const unwatch = watchReducedMotion((reduced) => seen.push(reduced));
    stub.change(true);
    unwatch();
    stub.change(false);

    expect(seen).toEqual([true]);
    expect(stub.handlers.size).toBe(0);
  });

  it('hands back a no-op unsubscribe when matchMedia is unsupported', () => {
    stubNoMatchMedia();
    const seen: boolean[] = [];

    const unwatch = watchReducedMotion((reduced) => seen.push(reduced));

    expect(() => unwatch()).not.toThrow();
    expect(seen).toEqual([]);
  });

  it('yields quietly on Safari < 14, whose list has no addEventListener', () => {
    // Unsupported means UNWATCHED, never a TypeError on someone's older iPhone:
    // the preference is still readable, only the change events are missing.
    stubLegacyMatchMedia(true);
    const seen: boolean[] = [];

    expect(prefersReducedMotion()).toBe(true);
    const unwatch = watchReducedMotion((reduced) => seen.push(reduced));

    expect(() => unwatch()).not.toThrow();
    expect(seen).toEqual([]);
  });
});
