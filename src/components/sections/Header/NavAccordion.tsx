'use client';

import {
  type ReactElement,
  type RefObject,
  useEffect,
  useId,
  useRef,
} from 'react';
import { ChevronRight } from '@/assets/glyphs/ChevronRight';
import { TextButton } from '@/components/ui/TextButton/TextButton';
import { cx } from '@/lib/cx/cx';
import { prefersReducedMotion } from '@/lib/reduced-motion/reduced-motion';
import type { NavSectionLink } from './navSectionLinks';
import { NavSectionEntry } from './NavSectionEntry';

// sections/Header — ONE row of the phone panel that carries a list of its
// page's sections: the word, which opens the list, and the list under it
// (CLAUDE.md §15.40; the owner, 2026-10-15: "on phone it should open up a
// dropdown with the adjacent subsections and on click of subsection same thing.
// if you click on another section with other subsections and another section
// is open it should close the other open one and open this one … for phone you
// have as example dentestet.ro"). ./NavDropdown's twin for the burger panel:
// Servicii and Echipa wear it, Acasă and Blog stay plain rows. WHICH list is
// open is NavMenu's (`expandedPath` — one at a time); this file draws one row.
//
// ── THE WORD OPENS THE LIST (owner, 2026-10-16: "on phone on click of
// servicii it has to open it's respective dropdown"). It reverses the
// 2026-10-15 pick — dentestet.ro's way, where the word navigated and a ⌄ at
// the row's end opened the list. The row is ONE control now: a ui/TextButton
// rendered as its own <button> — the menu buttons' box, label, ring and
// corner, full width (`w-full`, placement only, §6.8), its label centred like
// every row's — `aria-expanded` and `aria-controls` the list: „Servicii,
// button, collapsed". Its accessible name is its label alone (SC 2.5.3), so
// „Submeniul …" (`common.nav.submenu`) names nothing here any more; the bar
// row's ⌄ still wears it.
// THE ⌄ IS DECORATION INSIDE IT, where the old ⌄ square stood — an
// `aria-hidden` box at the row's end, 44px wide and the row's height, holding
// the glyph; absolutely placed, so the centred label does not move. The glyph
// points down at rest and turns over to point up while the list is open —
// from React state: classes from `expanded` here (the bar's arrow turns from
// React state too, by an inline style — NavDropdown's THE LOAD RACE says
// why there and not here): the old reading of the button's own
// `aria-expanded` went through ui/GlyphButton's `group` marker, which left
// with the GlyphButton. It inherits the label's ink, so it turns lavender
// with it.
// THE CURRENT PAGE KEEPS ITS MARK — `active`, as on every row: the lavender
// label, the full rule and `aria-current="page"` („Servicii, pagina curentă,
// buton, restrâns"). `aria-current` is a global ARIA state, legal on a
// button, and it is the visitor's orientation: on the services page the menu
// still says where they are, although the word no longer goes there.
// THE HELD LOOK — `held={expanded}` (ui/TextButton's; the owner: "if a
// dropdown is being clicked or hovered it has to light up lilla and trigger
// animation and leave it on until card or section unfocus or change"): while
// the list is open the word keeps the hover's lavender label and full rule,
// sweeping in when it opens and out when it closes or the other row's list
// takes over. Visual only — `aria-expanded` says it.
// THE CONSEQUENCE, recorded: on a phone the two words no longer open their
// pages from the menu. Every entry still lands on its page — a category on
// the services page, a doctor on the Team page — and the footer's site map
// links both pages. A first entry per list („Toate serviciile" / „Toată
// echipa", new keys ×5) is the recorded lever, not built.
//
// ── THE LIST OPENS IN PLACE, pushing the rows below it down: a one-row grid
// whose row grows `0fr → 1fr` (the one way to animate a box to its content's
// height), its inner box `min-h-0 overflow-hidden` so the list is revealed as
// the row grows. The timing is the desktop card's (./NavDropdown's THE
// MOTION, measured on apple.com): open over 300ms on cubic-bezier(0.25, 0.46,
// 0.45, 0.94), visible at once; close over 200ms ease-in-out 80ms after the
// entries begin to fade, `invisible` only once it has shut; the entries fade
// and drift exactly as on the card (./NavSectionEntry, through the same
// `group/nav-sections` + `data-state`). `motion-reduce:transition-none`:
// under reduced motion the list simply appears (§9).
// CLOSED IS UNREACHABLE: `inert` the moment it closes, `invisible` once the
// fade has ended — a collapsed list's links are neither focusable nor read.
// The list is framed by a hairline above and below (`border-y
// border-line-subtle`) so its entries read as one group inside a centred
// menu — NEVER a tinted ground: the entries' lavender hover label needs 4.5:1
// and reads 4.07:1 on line-subtle (§15.30). Its 4px of padding (`p-1`) is
// where the entries' focus rings fall (2px at a 2px offset): inside the box
// the overflow clips, so no ring is ever cut.
//
// ── AN OPENED LIST IS SCROLLED INTO VIEW — IN THE PANEL, NEVER THE PAGE. The
// panel caps its height and scrolls internally (NavMenu.tsx's B2), so a list
// opening near its bottom can end out of sight. Once the list has finished
// opening (REVEAL_AFTER_MS — the opening transition's 300ms, KEEP-IN-SYNC
// with `[transition-duration:300ms,0s]` below; at once under reduced motion,
// where nothing animates) the PANEL's own scrollTop moves just enough to show
// the list's end — smoothly unless reduced motion — and never so far that the
// row itself leaves the top. Never `scrollIntoView`: it scrolls every
// scrollable ancestor, the frozen page's root among them.

/** How long a list takes to open — KEEP-IN-SYNC with the region's
 *  `data-[state=open]:[transition-duration:300ms,0s]` (the 300ms half). */
export const REVEAL_AFTER_MS = 300;

const regionClasses =
  'group/nav-sections grid grid-rows-[0fr] invisible ' +
  '[transition-property:grid-template-rows,visibility] ' +
  '[transition-duration:200ms] [transition-timing-function:ease-in-out] ' +
  '[transition-delay:80ms] ' +
  'data-[state=open]:grid-rows-[1fr] data-[state=open]:visible ' +
  'data-[state=open]:[transition-duration:300ms,0s] ' +
  'data-[state=open]:[transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)] ' +
  'data-[state=open]:[transition-delay:0s] ' +
  'motion-reduce:transition-none';

// The glyph's turn: over the TextButton underline's 300ms, at once under
// reduced motion — KEEP-IN-SYNC with NavDropdown's own `glyphMotion`, the bar
// word's arrow since 2026-10-16, spelled alike (Header.test.tsx pins the two
// strings byte-equal). The turn itself stays a class pair here: this glyph
// mounts with the opened panel, after the sheet — NavDropdown's THE LOAD RACE
// cannot reach it.
const glyphMotion =
  'transition-transform duration-300 ease-out motion-reduce:transition-none';

/**
 * Scroll `panel` — its own scrollTop, never the page — so that `list`'s end
 * is in view, without pushing `row`'s top out of it, keeping the panel's own
 * bottom padding as air at the edge. The list's own box is read, never its
 * clipping region's: it is laid out whole even while that region grows.
 */
function revealInPanel(
  panel: HTMLElement,
  row: HTMLElement,
  list: HTMLElement,
): void {
  const box = panel.getBoundingClientRect();
  const pad = parseFloat(getComputedStyle(panel).paddingBottom) || 0;
  const visibleTop = box.top + panel.clientTop;
  const visibleBottom = visibleTop + panel.clientHeight;
  const needed = list.getBoundingClientRect().bottom + pad - visibleBottom;
  const room = row.getBoundingClientRect().top - visibleTop - pad;
  const delta = Math.min(needed, room);
  if (delta <= 0) return;
  panel.scrollBy({
    top: delta,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

export type NavAccordionProps = Readonly<{
  /** The word — already translated (§8.1); the row button's whole name. */
  label: string;
  /** Is this row's page the one being viewed? The current-page mark and
   *  `aria-current="page"` (THE CURRENT PAGE KEEPS ITS MARK). */
  active: boolean;
  /** The list's entries, finished (Header.tsx's navSectionLinks). */
  links: readonly NavSectionLink[];
  /** Is THIS row's list the open one? */
  expanded: boolean;
  /** The row — the word — was pressed. */
  onToggle: () => void;
  /** An entry was activated — NavMenu closes the whole menu, before the
   *  browser follows the link. */
  onEntryActivate: () => void;
  /** The panel — the scroll container an opened list is revealed in. */
  panelRef: RefObject<HTMLElement | null>;
}>;

export function NavAccordion({
  label,
  active,
  links,
  expanded,
  onToggle,
  onEntryActivate,
  panelRef,
}: NavAccordionProps): ReactElement {
  const listId = useId();
  const rowRef = useRef<HTMLLIElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // THE REVEAL (the header's last paragraph): after the list has opened,
  // scroll the PANEL so its end shows. A close before then cancels it.
  useEffect(() => {
    if (!expanded) return;
    const reveal = () => {
      const panel = panelRef.current;
      const row = rowRef.current;
      const list = listRef.current;
      if (panel && row && list) revealInPanel(panel, row, list);
    };
    const timer = window.setTimeout(
      reveal,
      prefersReducedMotion() ? 0 : REVEAL_AFTER_MS,
    );
    return () => window.clearTimeout(timer);
  }, [expanded, panelRef]);

  return (
    <li ref={rowRef}>
      {/* THE WORD OPENS THE LIST — one <button>, its label its name; `w-full`
          is placement only (§6.8), the atom's box, ring and corner untouched.
          The ⌄ box is positioned against the atom's own `relative` box. */}
      <TextButton
        active={active}
        held={expanded}
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={onToggle}
        className="w-full"
      >
        {label}
        <span
          aria-hidden="true"
          className="absolute inset-y-0 end-0 flex w-11 items-center justify-center"
        >
          <ChevronRight
            className={cx(glyphMotion, expanded ? '-rotate-90' : 'rotate-90')}
          />
        </span>
      </TextButton>

      <div
        id={listId}
        data-state={expanded ? 'open' : 'closed'}
        inert={!expanded}
        className={regionClasses}
      >
        <div className="min-h-0 overflow-hidden">
          {/* `role="list"`: the site's convention for a `list-style:
              none` list, whose semantics Safari's VoiceOver otherwise
              drops. */}
          <ul
            ref={listRef}
            role="list"
            className="flex flex-col gap-1 border-y border-line-subtle p-1"
          >
            {links.map((link, index) => (
              <NavSectionEntry
                key={link.href}
                link={link}
                index={index}
                onActivate={onEntryActivate}
                className="w-full"
              />
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}
