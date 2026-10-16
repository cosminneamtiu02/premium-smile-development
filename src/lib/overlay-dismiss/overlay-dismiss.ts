// lib/overlay-dismiss — the two ways every open overlay on this site closes by
// itself: the Escape key, and the page being left (or restored from the
// back/forward cache). ONE implementation for the three stateful overlays that
// own an `open` state: the phone menu (sections/Header/NavMenu), the language
// dial (ui/SpeedDial) and the top bar's dropdowns (sections/Header/HeaderNav).
//
// ── WHY NOW (CLAUDE.md §15.15's standing trigger, FIRED 2026-10-15). The menu
// and the dial each wrote these two effects by hand, as a KEEP-IN-SYNC pair
// (fb-44) — "merge ONLY when a third stateful overlay ships … a doctors
// dropdown under „Echipa" in the navigation", the trigger named. The top bar's
// dropdowns are that third overlay (§15.40), so the pair is written once here
// instead of a third time. What stays in each consumer, divergent by design:
// the FOCUS RETURN (each puts focus back on its own toggle, with its own
// guards — NavMenu's display:none fallback, SpeedDial's hover-open guard).
//
// A MODULE, not a hook: plain DOM listeners with no React in them, so the lib
// fence holds (tests/unit/lib-react-free.test.ts) and each consumer calls it
// from the effect it already owns, returning the cleanup this hands back.
// React's `flushSync` — the one React-specific step of a departure — stays in
// the consumer: this module only says WHICH departure happened.

/**
 * Call `onEscape` whenever Escape is pressed anywhere in the document.
 *
 * Bound to the DOCUMENT, not the overlay, because focus may legitimately sit
 * outside an open overlay — the ✕ beside the phone menu, the logo, a dropdown
 * opened by the pointer while focus stayed where it was (§9; WCAG 1.4.13 asks
 * that content shown on hover be dismissible without moving the pointer or
 * focus — Escape is that way).
 *
 * @returns the cleanup — return it from the same effect, so the listener lives
 * exactly as long as the caller's effect: an overlay's open state for the
 * phone menu and the language dial, the island's whole life for the bar's
 * dropdowns (a pending intent is no open card — useNavDropdowns' THE
 * DISMISSALS).
 */
export function listenForEscape(onEscape: () => void): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onEscape();
  };
  document.addEventListener('keydown', onKeyDown);
  return () => {
    document.removeEventListener('keydown', onKeyDown);
  };
}

/**
 * Which way the page was left: `'leave'` on EVERY departure (`pagehide` — a
 * navigation away, or entry into the back/forward cache), `'restore'` when a
 * frozen document comes back from that cache (`pageshow` with `persisted`).
 */
export type PageExit = 'leave' | 'restore';

/**
 * Call `onExit` when the page is left, or restored from the back/forward cache.
 *
 * ── THE BACK/FORWARD CACHE. Browsers keep the document you LEAVE frozen in
 * memory — DOM and state — and restore it whole on Back; an overlay open at
 * departure would come back open over a page nobody is touching. So a consumer
 * closes on `'leave'`, and applies that close NOW (React's `flushSync`): the
 * snapshot the browser freezes is then already closed, where a close on the way
 * back in would show one frame of the open overlay first. `pagehide` fires on
 * every departure and only on departures; `visibilitychange` would also fire on
 * a tab switch, and merely listening for `unload` disqualifies a page from the
 * cache. `'restore'` is the belt to those braces, for an engine that freezes
 * without delivering `pagehide` first — `persisted` is true only for a cache
 * restore, so a first load never reports it.
 *
 * No `persisted` check on the way OUT, on purpose: at `pagehide` the flag is an
 * intention, not a fact, and closing an overlay on a page being left costs
 * nothing either way.
 *
 * @returns the cleanup — return it from the same effect.
 */
export function listenForPageExit(
  onExit: (exit: PageExit) => void,
): () => void {
  const onPageHide = () => {
    onExit('leave');
  };
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) onExit('restore');
  };
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
  return () => {
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('pageshow', onPageShow);
  };
}
