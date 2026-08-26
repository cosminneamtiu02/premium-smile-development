import type { ReactElement } from 'react';
import { TextButton } from '@/components/ui/TextButton/TextButton';

// sections/Header — ONE primary-navigation entry: a plain anchor wearing the
// quiet TextButton look, marked when it is the page you are on. Plain because
// every internal link on this site is (§15.13): the href arrives finished from
// ./useNavItems and the browser does the rest, so this file imports no router
// and attaches no click handler.
//
// ── WHY THIS FILE EXISTS (owner, 2026-08-13).
// It is a SEAM, not a new capability. The row and the panel render the same
// control twice, and a nav entry is expected to grow per-item behavior later —
// a dropdown for a service group, most likely. Extracting it now means that
// change lands in ONE file with two call sites already pointing at it, instead
// of being a two-place edit invented under time pressure. Until that day this
// component adds NOTHING: no state, no variant, no mode prop. If it ever needs
// a disclosure, that arrives as its own decision, on the board.
//
// Deliberately NOT here: the route list and the active rule (they live in
// ./useNavItems, one source for both call sites), any spacing (the
// parent owns it, §6.4), and any color (TextButton paints itself — Wave-1
// constraint 6).
//
// No 'use client' directive: this holds no state and calls no hook, so it is
// environment-agnostic and simply compiles into whichever caller renders it —
// today two client islands, HeaderNav and NavMenu.

export interface NavRoute {
  /**
   * The FINAL href: locale prefix, trailing slash and the interim base path are
   * already in it, from src/i18n/href.ts (§15.13). This tier only prints it.
   */
  href: string;
  /** Already-translated label (§8.1) — this tier never sees a message key. */
  label: string;
  /** True when this entry IS the page being viewed. */
  active: boolean;
}

export type NavItemProps = NavRoute & {
  /**
   * Layout from the parent, and nothing else (§6.4/§6.8): the panel passes
   * `w-full` so each row spans the dropdown; the bar row passes nothing. Never
   * a restyle of the atom's internals.
   */
  className?: string;
};

export function NavItem({
  href,
  label,
  active,
  className,
}: NavItemProps): ReactElement {
  return (
    // asChild: TextButton leaves no tag of its own, so this emits ONE <a>
    // wearing the atom's classes — the DOM is exactly what the two call sites
    // produced before the extraction.
    // `active` is sugar for aria-current="page" + the static full-width
    // underline + the cta-hover green: the same fact told to screen readers
    // and to eyes.
    <TextButton asChild active={active} className={className}>
      <a href={href}>{label}</a>
    </TextButton>
  );
}
