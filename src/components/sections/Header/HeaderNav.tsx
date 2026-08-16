'use client';

import type { ReactElement } from 'react';
import { useTranslations } from 'next-intl';
import { NavItem } from './NavItem';
import { useNavItems } from './useNavItems';

// sections/Header — the link row. Built to the owner-approved N2 contract
// board .claude/plans/header-n2-contract.plan.md (2026-08-12); since the F1
// extraction (org-review board, owner approval fb-169, 2026-08-17) this file
// is ONLY the row. The three-way split of one nav, stated once:
//   DATA     ./useNavItems — one route source for this row AND NavMenu's panel
//   CONTROL  ./NavItem     — one entry, the owner's 2026-08-13 seam
//   ROW      this file     — the horizontal bar-row arrangement of the data
// All three are client leaves of one section talking to itself — §4's
// direction (app → sections → ui) is untouched.
//
// ── Why this file is an island (board §1.1). A component only needs
// 'use client' if it must react to something that happens AFTER the page is
// painted. Nothing here reacts to a click — but the row must know WHICH PAGE
// YOU ARE ON to underline it, which is useNavItems' job, and hooks only run
// in client code (the full static-export reasoning lives in that file's
// header). So this leaf hydrates; the bar around it stays inert HTML with
// zero JavaScript attached (§16 — fewer, smaller islands = less code on a
// patient's phone).
//
// §8.1 holds: translation happens in the section tier — nav.ariaLabel here,
// the entry labels inside useNavItems — and the atoms below NavItem receive
// finished strings. They never see a key.

export function HeaderNav(): ReactElement {
  const t = useTranslations('common');
  const items = useNavItems();

  return (
    // `hidden @3xl:flex` is one half of the entire breakpoint (the burger's
    // `@3xl:hidden` is the other): both exist in the HTML at every width and
    // CSS decides which is drawn. @3xl is Tailwind's own container step for
    // 48rem/768px — C1, no custom value introduced — and it measures the BAR,
    // not the viewport (§6.5), so the row behaves correctly wherever the
    // section is placed and can be tested at any width in Storybook.
    // aria-label names the landmark: "Navigare principală, navigation" instead
    // of a bare "navigation" once the Footer adds a second nav.
    //
    // The third class is the single-menu rule (owner, fb-164/166): while the
    // panel is open this row disappears at every width, because the panel
    // already carries these exact four links and showing both reads as two
    // menus at once. Zero JS — the panel exists in the bar's subtree exactly
    // while it is open, so `:has()` on the named `group/bar` root (Header.tsx)
    // is the whole mechanism, and the state never crosses a component
    // boundary. It outranks `@3xl:flex` by specificity (an id inside `:has()`
    // → (1,1,0) vs (0,1,0)), not by source order.
    // A11y consequence, deliberate: display:none is unfocusable, so while the
    // panel is open the Tab cycle tightens to brand → ✕ → panel — the same
    // shape the phone always had, and the panel carries the same links. The
    // elements stay in the DOM, though, which is why the tests still scope
    // their queries with within() (board §5·B7).
    <nav
      aria-label={t('nav.ariaLabel')}
      className="hidden @3xl:flex group-has-[#header-menu]/bar:hidden"
    >
      {/* A list, because it IS one: screen readers announce "list, 4 items"
          and offer item-by-item navigation. The section owns the spacing
          (§6.4) — gap here, no margins on the atoms. */}
      <ul className="flex items-center gap-2">
        {items.map((item) => (
          <li key={item.href}>
            {/* One <a> per entry — NavItem renders it through TextButton's
                asChild slot, so the atom leaves no tag of its own. No
                className from here: the row's spacing is the <ul>'s gap
                (§6.4), and this section passes NO colors (Wave-1
                constraint 6). */}
            <NavItem {...item} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
