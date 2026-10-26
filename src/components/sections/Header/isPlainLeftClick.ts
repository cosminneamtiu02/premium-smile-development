// sections/Header — THE ONE QUESTION A NAVIGATING CLICK ASKS here: does it
// follow its link in THIS tab? The primary button, no modifier held — for a
// link with no `target` and no `download`, the only kind this folder renders
// (one with either opens elsewhere, or saves a file, whatever the click). A
// middle click, or a Ctrl, Cmd, Shift or Alt click, opens the link in another
// tab or window — the browser's own — and the page the visitor is on must
// stay exactly as it was. A keyboard's Enter on a link IS a plain left click:
// a click of button 0 (its `detail` 0), so it answers yes.
//
// ── TWO ASKERS IN THIS FOLDER since 2026-10-26 (CLAUDE.md §15.40 round 5):
// ./NavSectionEntry — an entry closes its card, or the whole phone menu, only
// for such a click — and ./NavAccordion — the phone row's word opens its list,
// or goes to its page once the list is open, only for such a click (the
// owner: "when i click it ONCE to open dropdown and ehn i click it twice to go
// to page top"). Until that day it was NavSectionEntry's private copy; the
// second asker moved it into a flat sibling module named for exactly what it
// exports — CLAUDE.md §4's sharing table, row 1 (identical MECHANICS, a second
// consumer: the nearest tier both may import), the shape of ui/slot.ts and
// ./useNavItems — so neither of its two callers takes it from the other:
// NavAccordion, which renders NavSectionEntry, never reaches into that
// component's file for a click rule, and a reader looking for the rule finds
// a file by its name. A choice, not a house rule: helpers ARE exported from
// component files elsewhere — sections/Footer's `socialEntries`,
// sections/DoctorStats' `countFrames` and `spokenNumber`, sections/Wordmark's
// `brandWords`.
// sections/PriceList's PriceMenu keeps its own copy — the original, which
// NavSectionEntry's was copied from — because a section never imports another
// section's internals (§4). Making the two one would take it to lib/ (it is
// React-free MECHANICS, which every tier may import): a repo-wide lane of its
// own, recorded here and not taken.
//
// The parameter is the five fields React's synthetic MouseEvent and the
// browser's own share, so either fits — PriceMenu's typing, copied. No
// 'use client' and no import: it holds no state and touches no React, and
// compiles into whichever island imports it — today HeaderNav's (through
// NavDropdown's entries) and NavMenu's.

/** A click that navigates THIS tab: the primary button, no modifier held —
 *  on a link with no `target` and no `download` (a `target` naming another
 *  tab or window, or a `download`, leaves this tab as it is, whatever the
 *  click). A keyboard's Enter on a link is one (a click of button 0). */
export function isPlainLeftClick(
  event: Readonly<
    Pick<
      globalThis.MouseEvent,
      'button' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'
    >
  >,
): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}
