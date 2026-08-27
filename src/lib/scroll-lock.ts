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

/**
 * Freeze the document's scrolling and hand back the key.
 *
 * Save/restore, never a counter: the returned `unlock` puts back the inline
 * `overflow` value that was there when the lock was taken. That is what makes
 * nesting safe in the only order that can actually happen (last opened, first
 * closed): the menu locks (saves ''), the modal locks on top (saves 'hidden'),
 * the modal's unlock restores 'hidden' — the page stays frozen for the menu —
 * and the menu's unlock finally restores ''.
 *
 * Calling one `unlock` twice is a no-op, so a stale key can never clear a lock
 * that someone else has since taken. Unlocking OUT of order still leaves the
 * page frozen (the outer key restores 'hidden'): inherent to save/restore, and
 * the reason both consumers unlock from an effect cleanup rather than by hand.
 *
 * @returns the `unlock` function — call it exactly once, from the cleanup of
 * the same effect that took the lock.
 */
export function lockScroll(): () => void {
  const root = document.documentElement;
  const previousOverflow = root.style.overflow;
  root.style.overflow = 'hidden';

  let released = false;
  return function unlock(): void {
    if (released) return;
    released = true;
    root.style.overflow = previousOverflow;
  };
}
