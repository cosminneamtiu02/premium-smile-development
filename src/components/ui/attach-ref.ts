import type { Ref, RefCallback, RefObject } from 'react';

// ui/attach-ref.ts — the shared INTERNAL+CALLER REF MERGE: one callback ref
// that writes the node into the atom's own ref AND hands the same node to
// whatever the caller passed, because an element takes exactly one `ref`.
// Extracted when the second consumer arrived — the repo's stated extraction
// moment (org-review F4, fb-320 round, 2026-09-02: Modal's `attachRef` and
// SpeedDial's `setRoot` were the same mechanics twice, differing only in the
// node type; the ui/slot.ts play, owner fb-64, and ui/disc.ts D17 Road 3 are
// the precedents).
//
// NOT a component and NOT public API: ui-layer plumbing that sits flat beside
// the atom folders and may be imported by `ui/` modules ONLY — never by
// `sections/`, never by `app/`. A section composes atoms, not their internals
// (§4 dependency direction, §6.1).
//
// STANDING RULE — editing this file = editing every atom that imports it
// (Modal and SpeedDial today). The editing run's visual manifest must declare
// all consumer atoms' stories: the visual net is what turns a silent
// cross-atom regression into a loud undeclared diff.

/**
 * Builds the one callback ref an atom hands to its root element, merging the
 * atom's OWN ref — the node it needs for its own work (Modal calls
 * showModal()/close() on it, SpeedDial measures "outside" against it) — with
 * the caller's, which §6.8 promises reaches that same root. Both shapes of
 * caller ref are served: a callback ref is called, a ref object gets its
 * `current` written, and `undefined`/`null` means the caller wants nothing.
 *
 * Call it inside the consumer's own `useCallback(…, [ref])`: memoising on the
 * caller's ref is what stops React detaching and re-attaching the ref on every
 * render.
 *
 * STANDING RULE — this function IS the ref contract of every atom that imports
 * it, so changing the merge semantics is a deliberate API change for all of
 * them at once, never a drive-by edit (the lib/cx.ts convention).
 *
 * @param internal the atom's own ref object, kept in step with the caller's.
 * @param ref      whatever the caller passed as `ref`: a callback ref, a ref
 *                 object, null, or nothing at all.
 */
export function makeAttachRef<T>(
  internal: RefObject<T | null>,
  ref: Ref<T> | undefined,
): RefCallback<T> {
  return (node) => {
    internal.current = node;
    if (typeof ref === 'function') {
      // React 19 lets a callback ref RETURN a cleanup, and when it does React
      // calls that cleanup instead of re-invoking the ref with null. Passing
      // the caller's cleanup up is therefore the only way their ref detaches
      // the way they wrote it; swallowing it silently downgrades them to the
      // legacy null-call they did not ask for.
      const cleanup = ref(node);
      if (typeof cleanup === 'function') {
        return () => {
          cleanup();
          internal.current = null;
        };
      }
    } else if (ref) {
      ref.current = node;
    }
    return undefined;
  };
}
