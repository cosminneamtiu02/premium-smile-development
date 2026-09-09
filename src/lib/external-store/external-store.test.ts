import { describe, expect, it } from 'vitest';
import { createExternalStore } from './external-store.ts';

// Runs in the `components` project (real chromium, vitest.config.ts) like every
// other suite beside a lib module — there is nothing browser-specific in here
// (no timer, no DOM, no React), only the protocol useSyncExternalStore reads.
//
// What each case pins is one of the three rules the module's header explains:
// identity is the signal, copy before notify, and the server snapshot is
// frozen. They are the rules the three hand-written copies (clock, rotation,
// rotation-group) each had to get right on their own before org-review F1
// (owner approval fb-425–430, 2026-09-09) gave them one home.

/**
 * A store over fields the test replaces by hand.
 *
 * The builder returns a FRESH object every time, exactly as every real builder
 * in the ring does (`() => ({ status, idleReason })`) — which is what makes
 * "hands back the SAME object" a real assertion rather than a tautology.
 */
function createTestStore(initial: Record<string, unknown>) {
  let fields: Record<string, unknown> = { ...initial };
  let builds = 0;

  const store = createExternalStore(() => {
    builds += 1;
    return { ...fields };
  });

  return {
    store,
    /** How many times build() has run — construction included. */
    builds: () => builds,
    /** Replace the source fields, then ask the store to publish (or not). */
    set(next: Record<string, unknown>) {
      fields = next;
      store.sync();
    },
  };
}

describe('createExternalStore — construction', () => {
  it('calls build() exactly once, and no getter calls it again', () => {
    const { store, builds } = createTestStore({ status: 'idle', count: 0 });

    expect(builds()).toBe(1);
    expect(store.getSnapshot()).toEqual({ status: 'idle', count: 0 });
    store.getSnapshot();
    store.getServerSnapshot();
    expect(builds()).toBe(1);
  });

  it('hands back the same object from getSnapshot until something changes', () => {
    const { store, set } = createTestStore({ status: 'idle' });

    const first = store.getSnapshot();
    expect(store.getSnapshot()).toBe(first);

    set({ status: 'running' });
    const second = store.getSnapshot();
    expect(second).not.toBe(first);
    expect(store.getSnapshot()).toBe(second);
  });

  it('freezes the server snapshot: the construction object, forever', () => {
    // Hydration compares the browser's first read against markup the server
    // render built — so this getter must keep answering with the value that
    // markup came from, however far the live snapshot has since moved (§16).
    const { store, set } = createTestStore({ status: 'idle' });
    const server = store.getServerSnapshot();

    expect(server).toBe(store.getSnapshot());

    set({ status: 'running' });
    set({ status: 'stopped' });

    expect(store.getServerSnapshot()).toBe(server);
    expect(server).toEqual({ status: 'idle' });
  });
});

describe('sync() — publish only on a real change', () => {
  it('keeps the same object and notifies nobody when every field is equal', () => {
    const { store, set } = createTestStore({ status: 'idle', count: 2 });
    let notified = 0;
    store.subscribe(() => {
      notified += 1;
    });

    const before = store.getSnapshot();
    set({ status: 'idle', count: 2 });

    // A fresh object with identical fields is NOT a change: useSyncExternalStore
    // reads identity, so republishing here would re-render on every sync and,
    // for a store synced from a render, loop forever.
    expect(store.getSnapshot()).toBe(before);
    expect(notified).toBe(0);
  });

  it('mints a new object and notifies each subscriber exactly once per change', () => {
    const { store, set } = createTestStore({ status: 'idle', count: 0 });
    const seen: string[] = [];
    store.subscribe(() => seen.push('first'));
    store.subscribe(() => seen.push('second'));

    set({ status: 'running', count: 0 });
    expect(seen).toEqual(['first', 'second']);
    expect(store.getSnapshot()).toEqual({ status: 'running', count: 0 });

    // One field is enough — and it is still exactly one round per sync.
    set({ status: 'running', count: 1 });
    expect(seen).toEqual(['first', 'second', 'first', 'second']);
  });

  it('stops notifying a listener that unsubscribed', () => {
    const { store, set } = createTestStore({ status: 'idle' });
    let notified = 0;
    const unsubscribe = store.subscribe(() => {
      notified += 1;
    });

    set({ status: 'running' });
    expect(notified).toBe(1);

    unsubscribe();
    set({ status: 'stopped' });
    expect(notified).toBe(1);
    // …and the snapshot still moved: unsubscribing is about hearing, not about
    // the store's own bookkeeping.
    expect(store.getSnapshot()).toEqual({ status: 'stopped' });
  });

  it('finishes the round when a listener unsubscribes DURING it', () => {
    // React runs store listeners synchronously, so an island that unmounts on
    // the very change it is being told about edits the Set mid-notification.
    // The copy taken before the loop is what keeps the round the round it
    // started as — without it the Set's own iterator skips the next listener.
    const { store, set } = createTestStore({ status: 'idle' });
    const seen: string[] = [];

    const unsubscribeFirst = store.subscribe(() => {
      seen.push('first');
      unsubscribeFirst();
    });
    store.subscribe(() => seen.push('second'));

    set({ status: 'running' });
    expect(seen).toEqual(['first', 'second']);

    // The one that left really is gone from the next round.
    set({ status: 'stopped' });
    expect(seen).toEqual(['first', 'second', 'second']);
  });

  it('does not deliver to a listener that subscribed DURING the round', () => {
    // The same copy, seen from the other side: a listener added while the round
    // is in flight hears the NEXT change, not the one already being delivered.
    const { store, set } = createTestStore({ status: 'idle' });
    const seen: string[] = [];

    store.subscribe(() => {
      seen.push('first');
      store.subscribe(() => seen.push('late'));
    });

    set({ status: 'running' });
    expect(seen).toEqual(['first']);

    set({ status: 'stopped' });
    expect(seen).toEqual(['first', 'first', 'late']);
  });
});

describe('the comparison itself', () => {
  it('reads NaN as equal to NaN (Object.is, not ===)', () => {
    // `NaN === NaN` is false, so a === comparison would republish on every
    // single sync for as long as the field held NaN — an endless re-render.
    const { store, set } = createTestStore({ active: Number.NaN });
    let notified = 0;
    store.subscribe(() => {
      notified += 1;
    });

    const before = store.getSnapshot();
    set({ active: Number.NaN });

    expect(store.getSnapshot()).toBe(before);
    expect(notified).toBe(0);

    set({ active: 1 });
    expect(notified).toBe(1);
  });

  it('publishes when the KEY SET changes, not only when a value does', () => {
    const { store, set } = createTestStore({ status: 'idle' });
    let notified = 0;
    store.subscribe(() => {
      notified += 1;
    });

    // A field appears…
    set({ status: 'idle', idleReason: 'not-started' });
    expect(notified).toBe(1);
    expect(store.getSnapshot()).toEqual({
      status: 'idle',
      idleReason: 'not-started',
    });

    // …and a field vanishes, which a values-only comparison of the NEW object
    // would have missed entirely.
    set({ status: 'idle' });
    expect(notified).toBe(2);
    expect(store.getSnapshot()).toEqual({ status: 'idle' });
  });
});
