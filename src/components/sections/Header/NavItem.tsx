import type { ReactElement, ReactNode } from 'react';
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
// THAT DAY CAME (2026-10-15, CLAUDE.md §15.40 — the cards under Servicii and
// Echipa), and the decision kept this file a WORD: the disclosure arrived
// BESIDE it, never inside it — ./NavDropdown (the bar row) renders this entry
// and adds the ⌄ and the card around it, and the lists' own entries are
// ./NavSectionEntry. The word still navigates; its underline and its
// current-page mark are what they were. Since 2026-10-16 it also takes `held`
// from its dropdown (the owner: "while button triggered cards is open, button
// must behave as if focused"): ui/TextButton's THE HELD LOOK, the hover's
// lavender label and full rule kept on while ITS card is open. Still no state
// of its own — the open card is ./useNavDropdowns', and the prop is that state
// handed down. The phone panel's Servicii and Echipa rows stopped rendering
// this file the same day: there the word OPENS ITS LIST, so it is a button,
// not a link (./NavAccordion's THE WORD OPENS THE LIST); Acasă and Blog are
// still this entry in both places.
// And later that day a SLOT (the owner: "place an svg on the right side of
// the text with an arrow pointing downwards. hinting it is a dropdown menu"):
// `trailing`, drawn INSIDE the link after the label — §6.2's slots over
// modes, never an `arrow` switch; today ./NavDropdown's arrow (its THE
// ARROW), and nothing anywhere else. Inside the link it IS the word: it wears
// the label's ink, a click on it follows the link, a hover on it is the
// link's hover. Decoration the caller marks `aria-hidden` and places
// absolutely, so the link's accessible name and its box are the word's alone
// — the box's width to the pixel, which the bar's step arithmetic stands on
// (Header.tsx's THE BREAKPOINT IS A CONTAINER STEP; Header.step.test.tsx).
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
   * The hover look HELD — the lavender label and the full rule — while what
   * this word opens stays open: the bar row's card (./NavDropdown passes its
   * `open`). Switched at run time, so it sweeps in and out on the hover's own
   * clocks (ui/TextButton's THE HELD LOOK). Visual only — the ⌄ beside the
   * word says `aria-expanded`. @default false
   */
  held?: boolean;
  /**
   * A SLOT drawn INSIDE the link, after the label (§6.2): decoration that
   * belongs to the word — the bar row's dropdown arrow (./NavDropdown's THE
   * ARROW). The caller marks it `aria-hidden`, so the link's accessible name
   * stays its label, and places it ABSOLUTELY against the atom's own
   * `relative` box, so it takes no inline space and the word's box keeps its
   * width to the pixel. It inherits the label's ink in every state. Nothing
   * is drawn without it. @default undefined
   */
  trailing?: ReactNode;
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
  held = false,
  trailing,
  className,
}: NavItemProps): ReactElement {
  return (
    // asChild: TextButton leaves no tag of its own, so this emits ONE <a>
    // wearing the atom's classes — the DOM is exactly what the two call sites
    // produced before the extraction.
    // `active` is sugar for aria-current="page" + the static full-width
    // underline + the `accent` lavender: the same fact told to screen readers
    // and to eyes. `held` is that look with nothing told — the open card's.
    // `trailing` after the label, inside the link: without it the <a> holds
    // the label alone, the markup it always had.
    <TextButton asChild active={active} held={held} className={className}>
      <a href={href}>
        {label}
        {trailing}
      </a>
    </TextButton>
  );
}
