// lib/scroll-lock — the page's scroll freeze, as ONE tested implementation
// (Modal contract board D7 → A, owner-approved 2026-08-26).
//
// WHY IT IS HERE AND NOT IN THE ATOM: `showModal()` gives the modal the top
// layer, inertness and Esc for free — but NOT the scroll lock: the wheel and a
// finger still scroll the page under the scrim. NavMenu already writes these
// three lines by hand (NavMenu.tsx, THE FREEZE) with the promise "when
// ContactModal needs the same, this becomes a shared helper (rule of two)".
// This is that helper; the menu adopts it in its own follow-up lane, never in
// the atom's branch (§17.3 — one component per commit).
//
// It is a MODULE, not a component and not a hook: a plain DOM function with no
// React in it, so it is testable without rendering anything and both consumers
// call it from the effect they already own. `ui/` may reach for it because it
// is not app logic (§6.1 bans state and app imports, not the platform):
// clinic.ts and routes.ts are DATA about this clinic, this is twelve lines of
// browser mechanics. It is nonetheless the repo's first ui → lib import, hence
// the paper trail.
//
// The sideways lurch this used to cause on classic scrollbars — scrollbar gone
// → viewport wider → every vw-derived box recomputes — is cured site-wide by
// `scrollbar-gutter: stable` on <html> (globals.css @layer base, shipped early
// for exactly this).
//
// ── THE BOTTOM CLEARANCE GOES WITH THE FREEZE (fix lane
// `fix/dialog-scroll-forced-colors`, 2026-10-26). `overflow: hidden` stops the
// wheel and the finger, NOT the browser's own scroll-into-view: a focus can
// still move a frozen root. And on a frozen page one thing is focusable that
// lives in no scroll the root could ever help — the phone menu's panel, which
// hangs off the STICKY bar and moves with the viewport. globals.css's
// `scroll-padding-bottom` (THE TWO-SIDED FOCUS CLEARANCE: 10.5 / 11.5 / 12.5rem,
// kept clear for the corner discs) asks every reveal to keep a control above
// that band, so each panel entry that lands in it scrolled the frozen page down
// to clear it — and since the panel moves with the page, the next one did again.
// MEASURED on develop's built export, /ro/team/ at scrollY 1200, the menu open
// with its Servicii list, Tab down the entries: the page under the scrim ended
// 1605px lower in Chromium (1200 → 2805), 533 in WebKit and 1778 in Firefox,
// and stayed there when the menu closed. While the page is frozen that band has
// nothing to protect — the discs are `inert` behind the menu's sheet or the
// dialog's top layer — so the lock takes it off with the overflow and puts back
// what it found. ONLY the bottom half: the panel starts 6.5rem down, below the
// TOP clearance, the bar's own controls carry their own cancel (sections/
// Header's THE BAR'S OWN CONTROLS CANCEL THE PAGE'S TOP CLEARANCE), and
// lib/scroll-spy reads the root's TOP padding while a page lives — a frozen one
// included, on a rotation. MEASURED after: zero movement, all three engines, at
// 390×844 and 390×600. For the dialog it is a no-op (nothing in the top layer
// ever scrolls the root), which is why the module stays one function for both.

/**
 * Freeze the document's scrolling and hand back the key.
 *
 * Save/restore, never a counter: the returned `unlock` puts back the inline
 * `overflow` and `scroll-padding-bottom` values that were there when the lock
 * was taken (the second one: THE BOTTOM CLEARANCE GOES WITH THE FREEZE, above).
 * That is what makes nesting safe in the only order that can actually happen
 * (last opened, first closed): the menu locks (saves ''), the modal locks on
 * top (saves 'hidden'), the modal's unlock restores 'hidden' — the page stays
 * frozen for the menu — and the menu's unlock finally restores ''. The bottom
 * padding rides the same pairs: '' → '0px' → '0px' → ''.
 *
 * Calling one `unlock` twice is a no-op, so a stale key can never clear a lock
 * that someone else has since taken. Unlocking OUT of order still leaves the
 * page frozen (the outer key restores 'hidden'): inherent to save/restore, and
 * the reason both consumers unlock from an effect cleanup rather than by hand.
 * The order matters to the padding too: NavMenu's tap on an entry closes the
 * menu synchronously BEFORE the browser follows the link (its closeForJump), so
 * a jump to a section of the same page lands with the bottom clearance back.
 *
 * @returns the `unlock` function — call it exactly once, from the cleanup of
 * the same effect that took the lock.
 */
export function lockScroll(): () => void {
  const root = document.documentElement;
  const previousOverflow = root.style.overflow;
  const previousPaddingBottom = root.style.scrollPaddingBottom;
  root.style.overflow = 'hidden';
  root.style.scrollPaddingBottom = '0px';

  let released = false;
  return function unlock(): void {
    if (released) return;
    released = true;
    root.style.overflow = previousOverflow;
    root.style.scrollPaddingBottom = previousPaddingBottom;
  };
}
