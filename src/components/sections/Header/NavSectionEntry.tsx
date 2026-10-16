import type {
  CSSProperties,
  MouseEvent,
  MouseEventHandler,
  ReactElement,
} from 'react';
import { TextButton } from '@/components/ui/TextButton/TextButton';
import type { NavSectionLink } from './navSectionLinks';

// sections/Header — ONE entry of a dropdown: a list item holding a plain
// anchor that wears the top bar's own quiet TextButton, underline and all
// (CLAUDE.md §15.40 round 4; the owner, 2026-10-16: "maybe on hover of a
// element of a dropdown also add underline animation as on top bar buttons?"
// — the day after his first word, "the buttons in this subsection should look
// and behacve identically like the ones from top bar, but on hover they should
// not get underlined but rather just light up lilla on hover and back to
// normal on unhover", which the entries wore until then through ui/TextButton's
// `underline` set to none). NavItem's sibling, and for NavItem's reason
// (that file's WHY THIS FILE EXISTS): the bar row's card and the phone panel's
// list render the same entry, so it is ONE component with two call sites,
// never two spellings that drift.
//
// ── THE LOOK IS THE ATOM'S, NEVER THIS FILE'S — the menu button's default,
// every prop left alone: the same box, label, focus ring and corner as every
// menu button; on hover the lavender label on its 200ms clock and the 2px
// rule swept in from the left on its 300ms one, both back on unhover; on a
// touch screen neither (the atom's hover values compile under hover: hover).
// No entry is ever `active`, so no rule stands at rest — the lists mark no
// current section (§15.40's SC 1.4.1 note).
// Nothing here passes a colour (Wave-1 constraint 6, the row's rule). The one
// className a caller may hand down is LAYOUT — the phone panel's `w-full`,
// every row as wide as the panel (§6.4/§6.8).
//
// ── THE MOTION RIDES THE <li>, NOT THE LINK. An entry fades in and drifts
// 4px down into place each time its list opens, and fades out when it closes
// — the timing measured on apple.com (2026-10-15): in over 240ms ease-in-out,
// 50ms after the list starts opening and 20ms later per entry (`--i`, the
// entry's index, set inline: Tailwind reads class names from source text, so
// the per-entry number travels as data); out over 150ms ease-in, all at once.
// It reads the OPEN STATE off the nearest list that wears the NAMED group
// `group/nav-sections` with `data-state="open"` — the desktop card's wrapper
// (./NavDropdown) or the phone list's region (./NavAccordion) — so the entry
// knows nothing about which one holds it. On the <li> because the atom already
// owns its link's `transition-property` (the label's colour): a second
// property list in one class list would be decided by the sheet's order, not
// the code's (TextButton.tsx's house rule). Spelled as the three transition
// LONGHANDS, never Tailwind's transition-[…] / duration-* / ease-* shorthands,
// for the same reason (ui/GlyphButton's THE JUMP); the open state sets only
// the timing and the end values, never the property list, so
// `motion-reduce:transition-none` always wins and an entry under reduced
// motion simply appears and disappears with its list (§9). No information
// rides the motion.
//
// ── ONLY A PLAIN LEFT CLICK CLOSES ANYTHING. `onActivate` — the card's
// close, or the whole phone menu's — runs for the primary button with no
// modifier held, and a keyboard's Enter is one of those (a click of button 0).
// A middle click, or a Ctrl, Cmd, Shift or Alt click, opens the link in
// another tab or window, and THIS page must stay exactly as it was — the card
// open, the menu open. The link itself is never prevented either way.
// `isPlainLeftClick` is sections/PriceList's own filter, copied rather than
// imported: a section never imports another section's internals (§4).
//
// No 'use client': no state and no hook, so it compiles into whichever island
// renders it — today HeaderNav's and NavMenu's.

const entryMotion =
  'opacity-0 -translate-y-1 ' +
  '[transition-property:opacity,translate] [transition-duration:150ms] ' +
  '[transition-timing-function:ease-in] ' +
  'group-data-[state=open]/nav-sections:opacity-100 ' +
  'group-data-[state=open]/nav-sections:translate-y-0 ' +
  'group-data-[state=open]/nav-sections:[transition-duration:240ms] ' +
  'group-data-[state=open]/nav-sections:[transition-timing-function:ease-in-out] ' +
  'group-data-[state=open]/nav-sections:[transition-delay:calc(50ms_+_var(--i)_*_20ms)] ' +
  'motion-reduce:transition-none';

/** A click that navigates THIS tab: the primary button, no modifier held
 *  (sections/PriceList's PriceMenu, copied — the file header says why). */
function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export type NavSectionEntryProps = Readonly<{
  /** The finished link — href and label, from Header.tsx (navSectionLinks). */
  link: NavSectionLink;
  /** Its place in the list, from 0 — the stagger's step. */
  index: number;
  /**
   * Called on a PLAIN LEFT activation — a primary-button click or a
   * keyboard's Enter, no modifier — BEFORE the browser follows the href: the
   * island closes its card or its menu there. Never prevents the navigation.
   */
  onActivate: MouseEventHandler<HTMLAnchorElement>;
  /** Layout from the parent, and nothing else (§6.4/§6.8): `w-full` in the
   *  phone panel; nothing on the bar row's card. */
  className?: string;
}>;

export function NavSectionEntry({
  link,
  index,
  onActivate,
  className,
}: NavSectionEntryProps): ReactElement {
  return (
    <li className={entryMotion} style={{ '--i': index } as CSSProperties}>
      {/* asChild: TextButton leaves no tag of its own, so this is ONE <a>
          wearing the atom's classes — a plain anchor, the browser does the
          navigating (§15.13). */}
      <TextButton asChild className={className}>
        <a
          href={link.href}
          onClick={(event) => {
            if (isPlainLeftClick(event)) onActivate(event);
          }}
        >
          {link.label}
        </a>
      </TextButton>
    </li>
  );
}
