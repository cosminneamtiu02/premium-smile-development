// lib/reduced-motion — the `prefers-reduced-motion` SEAM: read it, and watch it
// change. Two functions, no React, no 'use client' (the React-free foundation
// ring, CLAUDE.md §4 — fence-tested by tests/unit/lib-react-free.test.ts), so
// an atom, a section and a plain-Node tool may all ask the same question the
// same way.
//
// ── WHY A MODULE AT ALL, WHEN CSS ALREADY HAS THE ANSWER. The preference has
// two halves and they live in different machines. Its CSS half is Tailwind's
// `motion-reduce:` variant — the browser evaluates the query inside the
// build-time stylesheet (§16) and a transition snaps instead of sliding; no
// JavaScript is involved and none should be. Its JAVASCRIPT half is every
// motion a stylesheet cannot see: a timer that changes what is on screen on its
// own. `lib/clock` is that timer, and this is where it asks. Each half sits
// where its mechanism is (rotation board Q8.7).
//
// ── WHY IT IS ITS OWN FOLDER AND NOT SIX LINES INSIDE THE CLOCK (board Q9c,
// owner fb-424). The clock is the first consumer, not the only conceivable
// one: any future JavaScript motion decision — a reveal-on-scroll, a marquee,
// an auto-playing gallery — asks exactly this and must not re-derive the query
// string, the missing-matchMedia branch or the unsubscribe. Naming it once is
// also what makes the clock's own tests honest: they inject a fake through
// `ClockEnv` and never touch the real query (see clock.ts, THE ENV SEAM).
//
// ── SSR-SAFE BY CONSTRUCTION. `output: 'export'` pre-renders every page in
// Node, where `window` does not exist, and §16's hydration-safety rule says
// visitor-dependent UI must render a neutral default and decide after mount.
// So the no-window answer is `false` — "no stated preference, assume motion is
// fine" — and it is the same answer an ancient engine without matchMedia gets.
// Callers never branch on availability; they get a boolean and a no-op
// unsubscribe.

/** The media query, spelled once. */
const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * The MediaQueryList for the reduce query, or null where the platform has no
 * matchMedia (server render, ancient engines).
 *
 * Resolved on every call rather than cached at module load: a cached list would
 * be created the moment the module is imported — a browser touch during import,
 * which is exactly what the ring's "construction is pure" rule forbids of the
 * clock built on top of it.
 */
function reduceQuery(): MediaQueryList | null {
  if (typeof window === 'undefined') return null;
  if (typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(REDUCE_QUERY);
}

/**
 * Does this visitor ask for reduced motion right now?
 *
 * @returns true only when the query actively matches; false when it does not,
 * and false when there is no window or no matchMedia to ask.
 */
export function prefersReducedMotion(): boolean {
  return reduceQuery()?.matches ?? false;
}

/**
 * Watch the preference for the rest of this page's life.
 *
 * The OS setting can be flipped mid-visit (macOS, Windows and both mobile
 * platforms all expose it in a settings pane the visitor can reach while the
 * tab stays open), and a widget that read the value once at mount would keep
 * moving for someone who has just asked it to stop. Listening is three lines;
 * the reaction is the caller's own (the clock's: stop, and never auto-resume —
 * see clock.ts, ENV REACTIONS).
 *
 * @param listener called with the NEW value on every change — never on
 * subscribe, so a caller that has just read the value is not told twice.
 * @returns unsubscribe. Idempotent by the platform (removing an absent listener
 * is a no-op) and a genuine no-op where the query is unsupported.
 */
export function watchReducedMotion(
  listener: (reduced: boolean) => void,
): () => void {
  const query = reduceQuery();
  // The addEventListener check is for Safari < 14, whose MediaQueryList carries
  // only the deprecated addListener pair: unsupported means unwatched, never a
  // TypeError on someone's older iPhone.
  if (query === null || typeof query.addEventListener !== 'function') {
    return () => {};
  }

  const onChange = (event: MediaQueryListEvent): void =>
    listener(event.matches);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
