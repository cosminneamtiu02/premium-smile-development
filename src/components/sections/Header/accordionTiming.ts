// sections/Header — THE PHONE ROW'S TWO TIMINGS, written once (CLAUDE.md
// §15.40 round 6; the React, TypeScript and test-coverage reviews,
// 2026-10-26): how long a list of the burger panel takes to open
// (REVEAL_AFTER_MS), and how long after the click that opened it its word
// holds a second activation back (FOLLOW_AFTER_MS). ./NavAccordion times its
// reveal and its guard by them; its suite (./Header.dropdowns.test.tsx) and
// the e2e (tests/e2e/nav-dropdowns.spec.ts) read them from HERE, never from
// a copy, so a retimed guard is retimed in the browser and in every test at
// once.
//
// IMPORT-FREE ON PURPOSE: no React, no `@/` alias, no import at all, and no
// 'use client' — the e2e runner imports this file in Node, where neither the
// alias nor a component resolves (sections/CardCarousel/conveyor.ts is the
// precedent: tests/e2e/card-carousel-touch.spec.ts imports its STEP the same
// way). Two numbers, compiled into the island that imports them: NavMenu's,
// through ./NavAccordion.

/** How long a list takes to open — KEEP-IN-SYNC with ./NavAccordion's
 *  region, `data-[state=open]:[transition-duration:300ms,0s]` (the 300ms
 *  half; ./Header.dropdowns.test.tsx's THE REVEAL'S CLOCK reads the computed
 *  duration against this number). Once it has passed, a list the KEYBOARD
 *  opened is revealed in the panel (./NavAccordion's THE REVEAL). */
export const REVEAL_AFTER_MS = 300;

/** THE GUARD (./NavAccordion's paragraph): with the list open, a plain
 *  activation of its word that comes less than this long after the click
 *  that opened it is held back — the list, the menu and the page stay as
 *  they are. Time, never a count: from the opening click's own `timeStamp`
 *  to the next click's, both read off the native event, one clock. The e2e
 *  (tests/e2e/nav-dropdowns.spec.ts) reads it from here. */
export const FOLLOW_AFTER_MS = 500;
