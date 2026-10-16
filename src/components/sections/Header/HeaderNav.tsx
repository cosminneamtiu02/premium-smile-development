'use client';

import { type ReactElement, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { NavDropdown } from './NavDropdown';
import { NavItem } from './NavItem';
import type { NavSectionsByPath, SectionedPath } from './navSectionLinks';
import { useNavDropdowns } from './useNavDropdowns';
import { useNavItems } from './useNavItems';

// sections/Header — the link row. Built to the owner-approved N2 contract
// board .claude/plans/header-n2-contract.plan.md (2026-08-12); since the F1
// extraction (org-review board, owner approval fb-169, 2026-08-17) this file
// is ONLY the row. The three-way split of one nav, stated once:
//   DATA     ./useNavItems — one route source for this row AND NavMenu's panel
//   CONTROL  ./NavItem     — one entry, the owner's 2026-08-13 seam
//   ROW      this file     — the horizontal bar-row arrangement of the data
// All three are client leaves of one section talking to itself — §4's
// direction (app → sections → ui) is untouched. Since 2026-10-15 (§15.40) the
// row also has its dropdowns: ./useNavDropdowns (the one open card — STATE),
// ./NavDropdown (an item with its ⌄ and its card) and ./NavSectionEntry (one
// entry of a card, shared with the panel's lists).
//
// ── Why this file is an island (board §1.1). A component only needs
// 'use client' if it must react to something that happens AFTER the page is
// painted. Until 2026-10-15 nothing here reacted to a click — the row had to
// know WHICH PAGE YOU ARE ON to underline it, which is useNavItems' job, and
// hooks only run in client code (the full static-export reasoning lives in
// that file's header). Since then it also opens the cards (below), which is a
// reaction by any measure. So this leaf hydrates; the bar around it stays
// inert HTML with zero JavaScript attached (§16 — fewer, smaller islands =
// less code on a patient's phone).
//
// §8.1 holds: translation happens in the section tier — nav.ariaLabel here,
// the entry labels inside useNavItems — and the atoms below NavItem receive
// finished strings. They never see a key.
//
// ── AND SINCE 2026-10-15 IT OPENS A CARD (CLAUDE.md §15.40; the owner: "a
// navigation dropdown on hover JUST ON THE TOP BAR ELEMNTS which drops down
// smoothly with sections of that particular page … blog and home should not
// have this"). Servicii and Echipa are ./NavDropdown items — the word (with
// its arrow since 2026-10-16), Apple's ⌄ for the keyboard, and a card of the
// page's sections — while Acasă and Blog stay plain NavItems. The ONE open card is this island's state
// (./useNavDropdowns): one card at a time, a hover on the next word swaps them
// at once. The entries arrive FINISHED from Header.tsx (`sections`, built on
// the server by ./navSectionLinks — this file imports its TYPES only, so the
// tariff and the team never ride into the page's JavaScript), and a row finds
// its own by its path (./useNavItems' NavEntry).
// THE ROW IS AS WIDE AS IT WAS, TO THE PIXEL: the <nav>, the <ul> and every
// <li> now stretch to the bar's full 5rem (`@min-[62rem]:self-stretch`,
// `h-full items-stretch`) so a dropdown item can be hovered above and below its
// word and can hang its card from the row's bottom edge, and every <li> centres
// its word (`flex items-center`) on the very line the row's `items-center` put
// it before; the ⌄, the card and the word's arrow are absolutely placed and
// take no inline space. Header.step.test.tsx holds the step's arithmetic on
// it.

export type HeaderNavProps = Readonly<{
  /** Every dropdown's finished entries, keyed by its row's path. */
  sections: NavSectionsByPath;
}>;

export function HeaderNav({ sections }: HeaderNavProps): ReactElement {
  const t = useTranslations('common');
  const items = useNavItems();
  const navRef = useRef<HTMLElement>(null);
  const dropdowns = useNavDropdowns(navRef);
  // THE ONE NARROWING, where a row's path meets the sections map: a path the
  // map holds is a SectionedPath, the type the dropdowns' state is keyed by
  // (./useNavDropdowns), so Acasă and Blog can never reach it.
  const isSectioned = (path: string): path is SectionedPath =>
    Object.hasOwn(sections, path);

  return (
    // `hidden @min-[62rem]:flex` is one half of the entire breakpoint (the
    // burger's `@min-[62rem]:hidden` in NavMenu.tsx is the other): both exist
    // in the HTML at every width and CSS decides which is drawn. The step is a
    // MEASURED container step, 62rem of bar since 2026-10-01 (60rem from the
    // header-nav-gap lane, the owner's ask, 2026-09-26 — Tailwind's named
    // `@3xl`, 48rem, before), at which every language keeps 70 % of its
    // first link as air between the brand and that link — the owner's floor,
    // read per language since every row has four links (2026-10-14; French,
    // with the widest first link, sits nearest it — Header.tsx's THE FIVE ROWS
    // GREW, which also records the lower step that arithmetic would now allow,
    // not taken). Header.tsx's "THE BREAKPOINT IS A CONTAINER STEP" block
    // carries the arithmetic; the number is spelled in exactly three files,
    // and Header.test.tsx pins that they agree. It measures the BAR, not the
    // viewport (§6.5), so the row behaves correctly wherever the section is
    // placed and can be tested at any width in Storybook.
    // aria-label names the landmark: "Navigare principală, navigation" instead
    // of a bare "navigation" once the Footer adds a second nav.
    //
    // The third class is the single-menu rule (owner, fb-164/166): while the
    // panel is open this row disappears at every width, because the panel
    // already carries these exact links and showing both reads as two menus
    // at once. Zero JS — the panel exists in the bar's subtree exactly
    // while it is open, so `:has()` on the named `group/bar` root (Header.tsx)
    // is the whole mechanism, and the state never crosses a component
    // boundary. It outranks the step's `flex` by specificity (an id inside
    // `:has()` → (1,1,0) vs (0,1,0)), not by source order.
    // A11y consequence, deliberate: display:none is unfocusable, so while the
    // panel is open the Tab cycle tightens to the brand link → ✕ → panel — the
    // brand corner is sections/Wordmark's home link again since 2026-10-02
    // (its D9), and it sits in the bar, which is never frozen, so it is a
    // live stop in that cycle (NavMenu.tsx carries the same correction) — the
    // same shape the phone always had, and the panel carries the same links.
    // The elements stay in the DOM, though, which is why the tests still scope
    // their queries with within() (board §5·B7).
    // `col-start-2 justify-self-center` at the step is this element's placement
    // in Header's three-cell grid (owner, 2026-09-04 — the nav row sits on the
    // screen's centre line). It lives HERE rather than on a wrapper in
    // Header.tsx because this file renders the grid item: the <nav> IS cell 2,
    // and a wrapper added only to carry two classes would put a box between the
    // grid and its own child for nothing. The centring itself is the grid's
    // `1fr auto 1fr` — Header.tsx argues why that equals the SCREEN's centre;
    // these classes only say "you are the middle column, sit in the middle of
    // it", which is what keeps the two halves independent.
    // Both are step-scoped because the row is a plain flex line below the step
    // (Header.tsx explains what auto-placement did to the phone), and the
    // explicit column is what keeps the OTHER cells honest when the single-menu
    // rule takes this one to display:none — a hidden element is not a grid item
    // at all, so without `col-start-*` the right cell would slide into column 2.
    <nav
      ref={navRef}
      aria-label={t('nav.ariaLabel')}
      className="hidden @min-[62rem]:col-start-2 @min-[62rem]:flex @min-[62rem]:self-stretch @min-[62rem]:justify-self-center group-has-[#header-menu]/bar:hidden"
    >
      {/* A list, because it IS one: screen readers announce "list, 4 items"
          — in every language since the blog joined all five (2026-10-14) —
          and offer item-by-item navigation. The section owns the spacing
          (§6.4) — gap here, no margins on the atoms. `h-full items-stretch`:
          every item as tall as the row (the header's THE ROW IS AS WIDE AS IT
          WAS). */}
      <ul className="flex h-full items-stretch gap-2">
        {items.map(({ path, ...route }) => {
          // An item with sections — and at least one: an empty list draws
          // the plain word — no arrow, no ⌄, no card.
          if (isSectioned(path) && sections[path].length > 0) {
            return (
              <NavDropdown
                key={route.href}
                path={path}
                route={route}
                links={sections[path]}
                toggleLabel={t('nav.submenu', { label: route.label })}
                open={dropdowns.open?.path === path}
                pinned={dropdowns.open?.path === path && dropdowns.open.pinned}
                handlers={dropdowns.itemHandlers(path)}
                onToggle={() => dropdowns.toggle(path)}
                onEntryActivate={dropdowns.dismiss}
              />
            );
          }
          return (
            <li key={route.href} className="relative flex items-center">
              {/* One <a> per entry — a plain anchor since §15.13, rendered
                  through TextButton's asChild slot so the atom leaves no tag
                  of its own. No className from here: the row's spacing is
                  the <ul>'s gap (§6.4), and this section passes NO colors
                  (Wave-1 constraint 6). */}
              <NavItem {...route} />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
