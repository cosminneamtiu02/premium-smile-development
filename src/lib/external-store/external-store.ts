// lib/external-store — THE publish protocol the ring's stores speak: subscribe
// · getSnapshot · getServerSnapshot, plus the sync() that decides whether
// anything actually changed. React-free (CLAUDE.md §4's foundation ring,
// fence-tested by tests/unit/lib-react-free.test.ts), no 'use client', no DOM,
// no class strings, no words. Extracted by the org-review board
// `.claude/plans/lib-rotation-org-review.plan.md` (finding F1, owner approval
// fb-425–430, 2026-09-09) out of the three copies named below.
//
// ── WHY IT EXISTS. lib/clock, lib/rotation and lib/rotation-group each wrote
// this protocol by hand: a Set of listeners, a subscribe that returns a delete,
// two getters, and a "compare the fields, then copy the set and notify"
// routine. Exactly one part of that differed per file — WHICH fields the
// equality check names (2, 4 and 3 flat values), which a shallow comparison
// covers exactly. The hand-written comparison is the fragile half: add a field
// to a snapshot, forget one `&&` clause, and the store silently stops
// republishing for that field. React then never re-renders on it, and no test
// that does not specifically exercise that field will say so.
//
// ── THE NAME. "External store" is React's own term for state that lives
// outside React and that a component watches through
// `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`. The trio
// in `ExternalStore` below IS that hook's signature — which is precisely why
// nothing in here has to know React exists.
//
// ── WHY IT LIVES IN lib/ (the two-question home test in lib/cx/cx.ts).
//   1. Does it import React, or exist to construct components? No — it is a Set
//      and a comparison; the hook that reads it lives in the consumer.
//   2. Does it encode a specific atom's look or API? No — no class string, no
//      message key, no DOM.
// Both answers put it in the foundation ring beside its consumers. It was
// extracted IN THE LANE where the second and third consumers were born, which
// is §4's sharing-table ROW 1 (identical MECHANICS, second consumer arrives →
// extract to the nearest tier both may import; the ui/slot.ts precedent,
// fb-64). Row 3's "dedicated promotion lane, never a drive-by" governs
// byte-identical copies DISCOVERED across already-merged code (lib/cx.ts,
// fb-307) — these three were written in one lane and never shipped.
//
// ── THE THREE SUBTLE RULES IT CENTRALISES, so they are explained once:
//
//   IDENTITY IS THE SIGNAL. useSyncExternalStore re-renders when getSnapshot
//   returns a DIFFERENT OBJECT — it compares references, not contents. A store
//   that minted a fresh object on every call would therefore report "changed"
//   on every render and loop forever; one that mutated its snapshot in place
//   would report "unchanged" forever and never re-render at all. So sync()
//   rebuilds, compares, and KEEPS THE OLD OBJECT whenever the new one says the
//   same thing.
//
//   COPY BEFORE NOTIFY. A listener may unsubscribe from inside its own
//   notification (a React island unmounting on the very status change it was
//   told about) or add another one. Iterating the live Set while it is being
//   edited is trouble nobody can reproduce on demand; iterating a copy makes
//   each round the round it started as.
//
//   THE SERVER SNAPSHOT IS FROZEN. `output: 'export'` renders every page in
//   Node, and getServerSnapshot has to keep answering with what the
//   pre-rendered HTML was built from for the rest of the store's life —
//   otherwise hydration compares a fresh browser value against markup built
//   from an older one (§16's hydration-safety rule). It is the construction
//   snapshot, kept forever.

/** React's external-store protocol: exactly the trio useSyncExternalStore takes. */
export type ExternalStore<S> = Readonly<{
  /** Register a "something changed" callback. @returns its unsubscribe. */
  subscribe(listener: () => void): () => void;
  /** The current snapshot — the SAME object until something really changed. */
  getSnapshot(): S;
  /** What a server render was built from; constant for the store's whole life. */
  getServerSnapshot(): S;
}>;

/**
 * Build a store around a snapshot builder.
 *
 * `build()` runs ONCE, right here: its result is both the first snapshot and
 * the server snapshot forever. Every later `sync()` runs it again and publishes
 * only if the result differs — see THE THREE SUBTLE RULES above.
 *
 * @param build reads the owner's mutable variables and returns one immutable,
 * FLAT snapshot. Flat matters: the comparison is shallow, so a nested object is
 * compared by identity and a builder that minted one per call would publish on
 * every sync.
 * @returns the protocol trio plus `sync`. Every one of those four identities is
 * stable for the store's life, which is what lets a consumer hand them around
 * detached — `clock.subscribe(store.sync)` is a bridge that never has to be
 * re-installed, and React's own hook compares `subscribe` by identity.
 */
export function createExternalStore<
  S extends Readonly<Record<string, unknown>>,
>(build: () => S): ExternalStore<S> & Readonly<{ sync(): void }> {
  const listeners = new Set<() => void>();
  /** The construction snapshot — what getServerSnapshot returns forever. */
  const serverSnapshot: S = build();
  let snapshot: S = serverSnapshot;

  /** Same own keys, same values — i.e. there is nothing to publish. */
  function unchanged(next: S): boolean {
    // Widened to the constraint rather than cast: the generic keeps each
    // consumer's snapshot type exact on the public surface, while the
    // comparison in here only ever needs "a bag of keys".
    const before: Readonly<Record<string, unknown>> = snapshot;
    const after: Readonly<Record<string, unknown>> = next;
    const keys = Object.keys(after);
    // The key COUNT as well as the values: a builder whose SHAPE changes (a
    // field present only in some states) must publish, and comparing the values
    // of the new object alone would miss a key that had simply vanished.
    if (keys.length !== Object.keys(before).length) return false;
    // Object.is, not ===: it reads NaN as equal to NaN, so a numeric field that
    // is NaN in both snapshots is correctly "no change" rather than an endless
    // republish; it also keeps +0 and -0 apart, which === does not.
    return keys.every((key) => Object.is(after[key], before[key]));
  }

  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    sync(): void {
      const next = build();
      if (unchanged(next)) return;
      snapshot = next;
      // A copy, so a listener that unsubscribes (or subscribes) mid-notification
      // cannot disturb this round.
      for (const listener of [...listeners]) listener();
    },
  };
}
