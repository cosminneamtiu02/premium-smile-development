'use client';

import {
  type KeyboardEvent,
  type MouseEvent,
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
import { FOLLOW_AFTER_MS, REVEAL_AFTER_MS } from './accordionTiming';
import { isPlainLeftClick } from './isPlainLeftClick';
import type { NavSectionLink } from './navSectionLinks';
import { NavSectionEntry } from './NavSectionEntry';

// sections/Header — ONE row of the phone panel that carries a list of its
// page's sections: the word — a link to its page that, while its list is
// shut, opens the list instead — and the list under it (CLAUDE.md §15.40; the
// owner, 2026-10-15: "on phone it should open up a dropdown with the adjacent
// subsections and on click of subsection same thing. if you click on another
// section with other subsections and another section is open it should close
// the other open one and open this one … for phone you have as example
// dentestet.ro"). ./NavDropdown's twin for the burger panel: Servicii and
// Echipa wear it, Acasă and Blog stay plain rows. WHICH list is open is
// NavMenu's (`expandedPath` — one at a time); this file draws one row.
//
// ── THE ROW IS A LINK THAT OPENS ITS LIST FIRST (the owner, 2026-10-26,
// CLAUDE.md §15.40 round 5: "i want a small refactor on the dropdown menu on
// tighter screens like phone etc, when i click it ONCE to open dropdown and
// ehn i click it twice to go to page top, do not implement with a counter,
// but with an if dropdown open flag. so if dropdown of services open on click
// of it go to services page at top"). The row is ONE control: a ui/TextButton
// dressing a plain <a href> to the row's page through `asChild` — the menu
// buttons' box, label, ring and corner, full width (`w-full`, placement only,
// §6.8), its label centred like every row's — `aria-expanded` and
// `aria-controls` the list: „Servicii, link, collapsed". Its accessible name
// is its label alone (SC 2.5.3), so „Submeniul …" (`common.nav.submenu`)
// names nothing here; the bar row's ⌄ still wears it.
// THE OPEN FLAG decides a tap: `expanded` — NavMenu's "is this row's list the
// open one?" — read when the tap arrives, never a count of taps, so a row
// whose list the other row shut is a shut row again, and a tap on it opens
// the list. SHUT, the tap opens the list and goes nowhere: the click handler
// holds the link back (`preventDefault`) and asks NavMenu to open it
// (`onOpen`), which shuts the other row's — one list at a time. OPEN, the tap
// goes to the page: nothing is held back, NavMenu closes the whole menu first
// (`onFollow`, its closeForJump — the path an entry of the list takes) and
// the BROWSER follows the link — unless the tap comes within half a second of
// the opening: then it is held back and nothing moves (THE GUARD, below). So
// the word no longer shuts its own list: the ✕, Escape, the sheet, the other
// row's word or a navigation do.
// WHY A LINK: a control that goes to a page is a plain <a href> on this site,
// and the browser does the going (§9, §15.13 — zero navigation JavaScript;
// sections/Wordmark's home link, §15.33, is the same rule): no script here
// assigns a location. And "page top" needs no scroll code: a plain link to
// the page being viewed, with no fragment, loads a NEW document at its top —
// a navigation, not a reload (the planner's probe of the built export,
// Chromium, WebKit and Firefox, 2026-10-26: scrolled 2000px down, a click
// on the page's own link landed at 0) — so on the services page its own row
// takes the visitor back to the page's top from deep in its price list.
// ONLY A PLAIN LEFT CLICK DECIDES (./isPlainLeftClick, ./NavSectionEntry's
// rule for an entry): a middle click, or a Ctrl, Cmd, Shift or Alt click, is
// the browser's own — a new tab or window for the page — and nothing here
// moves: the list stays as it was, and so does the menu.
// THE KEYBOARD: Enter on a link is a click of the primary button (its
// `detail` 0), so Enter on the word opens its list while the list is shut
// and goes to the page while it is open — half a second after the opening
// Enter at the soonest (THE GUARD) — and an Enter HELD down opens the list
// once and goes nowhere (A HELD ENTER OPENS THE LIST ONCE, below). Space
// does not activate the row — a link does not answer Space: it scrolls the
// panel while the panel overflows, and otherwise does nothing (the page
// behind is scroll-locked) — which costs nothing SC 2.1.1 asks for: Enter
// reaches every function of the row. NVDA's Space in browse mode is not the
// key's but the reader's own activation, so there it opens the list and
// then goes to the page exactly as Enter does.
// THE COSTS, recorded (the accessibility review, 2026-10-26): (a) with the
// list open the ⌄ points UP — the web's usual "close" sign, and what this row
// did from 2026-10-16 to 2026-10-26 — but a tap on it (it is part of the
// link) now goes to the page, so someone who opened a list by mistake and
// taps the word to close it leaves the page; the ✕, Escape, the sheet and
// the other row's word are what close it. (b) A double tap, or a double
// click, opened the list and went to the page in one go — the owner's
// literal "click it twice" — and a guard on `event.detail` would have been
// the counter he refused; since his pick the same evening a second
// activation within half a second of the opening is held back, by TIME and
// never a count (THE GUARD, below), so a double tap faster than half a
// second opens the list and stays — a slower one still opens it and goes
// (what THE GUARD does not cover, below). And a slow press (about half a
// second) now brings up the browser's own link menu or preview, as on any
// link. (c) ARIA 1.2 allows `aria-expanded` on a link, but the ARIA
// Authoring Practices' example of a disclosure navigation menu with
// top-level links keeps the link and its toggle as two controls, so
// screen-reader users rarely meet this hybrid, and an outside audit may
// question it under SC 4.1.2; since the same evening the open word carries
// a description of what it does, which a screen reader may speak (THE
// HINT, below).
// The road here: on 2026-10-15 the word was a link and a ⌄ square at the
// row's end opened the list (dentestet.ro's way); on 2026-10-16 (the owner:
// "on phone on click of servicii it has to open it's respective dropdown")
// the word became a <button> of the atom's own that TOGGLED its list, the ⌄
// its decoration; since 2026-10-26 it is a link again, and the flag above
// decides whether a tap opens or goes.
// THE ⌄ IS DECORATION INSIDE IT, where the old ⌄ square stood — an
// `aria-hidden` box at the row's end, 44px wide and the row's height, holding
// the glyph; absolutely placed, so the centred label does not move, and a tap
// on it is a tap on the link. The glyph points down at rest and turns over to
// point up while the list is open — from React state: classes from
// `expanded` here (the bar's arrow turns from React state too, by an inline
// style — NavDropdown's THE LOAD RACE says why there and not here): the old
// reading of the button's own `aria-expanded` went through ui/GlyphButton's
// `group` marker, which left with the GlyphButton. It inherits the label's
// ink, so it turns lavender with it.
// THE CURRENT PAGE KEEPS ITS MARK — `active`, as on every row: the lavender
// label, the full rule and `aria-current="page"` („Servicii, current page,
// link, collapsed"), the visitor's orientation: on the services page the menu
// still says where they are, and with its list open the word takes them back
// to that page's top.
// THE HELD LOOK — `held={expanded}` (ui/TextButton's; the owner: "if a
// dropdown is being clicked or hovered it has to light up lilla and trigger
// animation and leave it on until card or section unfocus or change"): while
// the list is open the word keeps the hover's lavender label and full rule,
// sweeping in when it opens and out when the other row's list takes over (a
// closing menu takes the whole panel with it). Visual only — `aria-expanded`
// says it.
// THE CONSEQUENCE of 2026-10-16, RESOLVED: for those ten days the two words
// did not open their pages from the phone's menu — every entry still landed
// on its page, and the footer's site map linked both — and a first entry per
// list („Toate serviciile" / „Toată echipa", new keys ×5) stood as the
// recorded lever, never built. The open word goes to its page now: the menu
// links both pages again, through it, and that lever is retired.
//
// ── THE GUARD — A SECOND TAP TOO SOON GOES NOWHERE (the owner, 2026-10-26,
// the same evening, picking from the accessibility review's options: "Ignore
// a second tap that comes within about 0.5 s of opening. It's based on time,
// not a count, but a fast deliberate double tap would then do nothing." He
// took this one and THE HINT, below, and declined the other two: a → in
// place of the ⌄ while the list is open, and a first entry „Toate serviciile
// →"). With the list open, a plain activation of the word that comes less
// than FOLLOW_AFTER_MS (500ms) after the click that opened it is held back
// — `preventDefault`, and nothing else: the list stays open, the menu stays
// open over the frozen page, nothing navigates. Every plain activation
// alike: a tap, a mouse click, Enter, a screen reader's. The modifier check
// stays FIRST: a Ctrl, Cmd, Shift, Alt or middle click is the browser's own
// however soon it comes (ONLY A PLAIN LEFT CLICK DECIDES, above).
// TIME, NEVER A COUNT: the decision still reads THE OPEN FLAG — a shut
// list's word opens its list whenever it is tapped — and the guard asks only
// how long ago THIS list opened: the opening click's own `timeStamp`
// (`openedAt`, written at every opening and only then) against the next
// click's; no timer runs, and the click count, `event.detail`, plays no
// part in it. A held tap re-arms nothing: the half second runs from the
// opening, so a tap 400ms after it is held and one 600ms after it goes,
// however close behind the held one.
// ONE CLOCK (the React and TypeScript reviews, 2026-10-26): both stamps are
// read off the NATIVE event, the browser's own clock — never React's
// synthetic `timeStamp`, which falls back to `Date.now()`, the wall clock,
// wherever the native stamp is 0, and would set two clocks against each
// other. And only an elapsed time from 0 up to FOLLOW_AFTER_MS holds a tap
// back: a NEGATIVE one can only mean two clocks, and that tap goes, as a
// tap past the guard does.
// WHY 500ms: a double tap or a double click lands its second click well
// inside it — half a second is the longest gap Windows counts as one double
// click by default — while a visitor who opens a list and then means the
// word reads the list first, which takes longer. THE COST: a deliberate
// second tap within half a second is ignored, the list left open, and the
// visitor taps again; for a screen-reader user that held press is SILENT —
// no speech and no change — and they press again too.
// WHAT IT DOES NOT COVER (the accessibility review, 2026-10-26): it catches
// a double tap faster than half a second, and nothing slower. A slower
// double tap, a double click under a double-click setting slowed past half
// a second (Windows allows up to 900ms), a tremor's burst of taps that runs
// longer than half a second: each opens the list and then goes to the page,
// as CLAUDE.md §15.40 round 5 recorded for every double tap.
//
// ── A HELD ENTER OPENS THE LIST ONCE (the accessibility review's LOW-3,
// 2026-10-26). MEASURED by the planner on the built export: Enter held down
// on the shut word, the operating system's auto-repeat imitated — keydowns
// marked `repeat` every 33ms from 500ms to 1.5s. Chromium sent ONE click,
// the list opened and nothing more; WebKit and Firefox kept activating the
// link on the repeats, and the first repeat past THE GUARD's half second
// went to /ro/services/. So the word holds back (`preventDefault`) every
// Enter keydown the browser itself marks as auto-repeating (`event.repeat`)
// — an input-device fact, read as true or false and never counted, like
// THE REVEAL's `detail` — and a prevented keydown has no default action: no
// activation, no click. A held Enter opens the list once and stays; the
// visitor goes to the page with a fresh press, which is no repeat. Every
// other key is left alone — a held Space or arrow key still scrolls the
// panel while it overflows — and so is the first, unrepeated Enter, which
// opens or goes as THE OPEN FLAG says. VERIFIED on a bare page, the same
// rhythm in the three engines (Playwright, this lane's builder, 2026-10-26):
// without the hold Chromium made 1 click, WebKit 28 and Firefox 29; with
// it, 1 in all three. Chromium alone cannot show the difference — it
// already ignores a repeating Enter on a link — so the suite pins the hold
// itself: a repeating Enter keydown is prevented, an unrepeated one and a
// repeating Space or arrow key are not.
//
// ── THE HINT — WHAT THE OPEN WORD DOES, OFFERED TO A SCREEN READER (the
// owner, 2026-10-26, his second pick: "A spoken hint for screen readers
// while the list is open. It needs five translations from you."). While its
// list is open the word is DESCRIBED by a sentence of its own,
// `common.nav.pressAgain` („Apasă din nou pentru a deschide pagina." —
// Claude's drafts ×5, flagged for the owner, §15.17), translated by NavMenu
// and handed in finished (`pressAgainHint`, §8.1). It lives in a `hidden`
// <span> inside the <li>, beside the link and never in it — no part of the
// link's name, which stays its label (SC 2.5.3) — and the link's
// `aria-describedby` names it while the list is open, and nothing while it
// is shut. `hidden` keeps the sentence off the screen and out of the
// accessibility tree, so a screen reader reading the panel line by line
// never meets it on its own; and an element that `aria-describedby`
// references DIRECTLY still supplies its text as the description
// (accname 1.2: a hidden node is skipped unless a relation names it
// directly). So while the list is open — when a tap goes to the page — a
// reader MAY say „Servicii, link, expanded, Apasă din nou pentru a deschide
// pagina.", and while it is shut „Servicii, link, collapsed". MAY: the
// sentence is the word's DESCRIPTION, and WHEN a reader speaks a
// description — right after the press, or only on returning to the word —
// and WHETHER it speaks it at all — not with its hints switched off — are
// the reader's, never the page's; nothing here announces it. What the page
// owns is the exposure, MEASURED by the planner in the browser's own
// accessibility tree on the built export (Chromium, CDP, 2026-10-26): the
// shut word a link „Servicii", expanded false, no description; the open
// word expanded true, described by the sentence.
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
// ── THE REVEAL — A LIST THE KEYBOARD OPENED IS SCROLLED INTO VIEW, IN THE
// PANEL, NEVER THE PAGE. The panel caps its height and scrolls internally
// (NavMenu.tsx's B2), so a list opening near its bottom can end out of sight.
// Once the list has finished opening (REVEAL_AFTER_MS, in ./accordionTiming
// with THE GUARD's number since 2026-10-26 — the opening transition's 300ms,
// KEEP-IN-SYNC with `[transition-duration:300ms,0s]` below; at once under
// reduced motion, where nothing animates) the PANEL's own scrollTop moves
// just enough to show the list's end — smoothly unless reduced motion — and
// never so far that the row itself leaves the top. Never `scrollIntoView`:
// it scrolls every scrollable ancestor, the frozen page's root among them.
// FOR THE KEYBOARD ALONE since 2026-10-26 (CLAUDE.md §15.40 round 5; the
// React review's MEDIUM): once the open word goes to its page, a reveal
// slides that word out from under the finger before the second tap. MEASURED
// by the planner on the built export (Chromium, phone emulation): at
// 390×664, 375×667 and 844×390 a tap on „Servicii" opened its list and the
// panel then scrolled 100px, the word moving from y 222 to 122, so a second
// tap on the same spot landed on the entry „Urgențe" —
// /ro/services/#emergencies, not /ro/services/; at 390×844 nothing moved and
// that tap went to the page, and a double tap, its taps 150ms apart, went to
// the page as well (the reveal had not begun — measured before THE GUARD;
// since that evening such a double tap stays on its open list). So a list a
// POINTER opened stays where it opened, and the reveal runs for a list the
// KEYBOARD opened: focus stays on the word there, so an Enter with the list
// open goes to the page wherever the panel has scrolled. Which one opened it
// is the opening click's `detail`, recorded as the list opens: the browser's
// click count, 0 for the click Enter makes on a link and 1 or more for a
// mouse, a finger or a pen — the signal sections/PriceList's PriceMenu reads
// for its keyboard ring (§15.20 round 5). An INPUT-DEVICE CHECK, NOT A TAP
// COUNTER: read only as zero or not, and only to choose whether the panel
// scrolls; whether a tap opens the list or goes to the page reads `expanded`
// (THE OPEN FLAG — the owner refused a counter) and, with the list open, how
// long ago it opened (THE GUARD) — never this. THE COST: after a tap on a
// short phone, the end of a long list is reached by scrolling the panel by
// hand.
//
// ── THE TWO TIMINGS live in ./accordionTiming (REVEAL_AFTER_MS,
// FOLLOW_AFTER_MS): an import-free module, so the e2e runner reads the very
// numbers this row runs on, in Node, beside its suite.

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
  /** The word — already translated (§8.1); the row link's whole name. */
  label: string;
  /** The row's page, FINISHED — locale prefix, trailing slash and the
   *  interim base path already in it (./useNavItems' href, from
   *  src/i18n/href.ts, §15.13): where a tap goes once the list is open. This
   *  tier only prints it. */
  href: string;
  /** Is this row's page the one being viewed? The current-page mark and
   *  `aria-current="page"` (THE CURRENT PAGE KEEPS ITS MARK). */
  active: boolean;
  /** The list's entries, finished (Header.tsx's navSectionLinks). */
  links: readonly NavSectionLink[];
  /** Is THIS row's list the open one? THE OPEN FLAG: a plain tap on the word
   *  OPENS the list while this is false and GOES TO THE PAGE while it is
   *  true — read when the tap arrives, never a count of taps; a tap that
   *  comes less than FOLLOW_AFTER_MS after the opening one is held back
   *  instead (THE GUARD). */
  expanded: boolean;
  /** The word was tapped with its list SHUT — called only then, the link
   *  already held back: NavMenu opens this row's list, shutting the other
   *  row's. */
  onOpen: () => void;
  /** A link of this row is about to be followed by a plain left click — the
   *  word with its list open (past THE GUARD), or an entry of the list:
   *  NavMenu closes the whole menu there, BEFORE the browser follows the
   *  link. Never prevents the navigation. */
  onFollow: () => void;
  /** The sentence that describes the word while its list is open — already
   *  translated (§8.1), `common.nav.pressAgain`: „Apasă din nou pentru a
   *  deschide pagina." Never drawn; a screen reader MAY speak it as the
   *  word's description — when, and whether at all, are the reader's, never
   *  the page's (THE HINT). */
  pressAgainHint: string;
  /** The panel — the scroll container an opened list is revealed in. */
  panelRef: RefObject<HTMLElement | null>;
}>;

export function NavAccordion({
  label,
  href,
  active,
  links,
  expanded,
  onOpen,
  onFollow,
  pressAgainHint,
  panelRef,
}: NavAccordionProps): ReactElement {
  const listId = useId();
  const hintId = useId();
  const rowRef = useRef<HTMLLIElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // WHO OPENED THE LIST, for THE REVEAL (the header's paragraph): true
  // when a pointer's click opened it — a mouse, a finger or a pen — false
  // when the keyboard's Enter did. Written as the list opens, read by the
  // reveal's effect alone; never read to decide whether a tap opens or goes.
  const openedByPointer = useRef(false);
  // WHEN THE LIST OPENED, for THE GUARD (the header's paragraph): the opening
  // click's own `timeStamp`, read off the NATIVE event (ONE CLOCK) — the
  // browser's clock, the one every later click is stamped by. Written at
  // every opening and only then: a click the guard holds back re-arms
  // nothing, so the half second runs from the opening. Minus infinity only
  // until this row's FIRST click-opening in this panel — the menu mounts a
  // new panel, and new rows with it, each time it opens — and from then on
  // the LATEST click-opening's: a click on the word is the one way a list
  // opens today, and each such click rewrites this before the guard can
  // read it. A way to open a list added later must write it too, or a tap
  // would be measured from the row's last click-opening.
  const openedAt = useRef(Number.NEGATIVE_INFINITY);

  // THE OPEN FLAG (the header's THE ROW IS A LINK THAT OPENS ITS LIST FIRST):
  // a plain tap on a SHUT list's word opens the list and goes nowhere — the
  // link held back; on an OPEN list's word it goes to the page — the menu
  // closed first, nothing held back, the browser following — unless it comes
  // within FOLLOW_AFTER_MS of the opening (THE GUARD), when it too is held
  // back and nothing moves. Any other click is the browser's own, and nothing
  // here moves.
  const onWordClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    if (!isPlainLeftClick(event)) return;
    // ONE CLOCK (the header's THE GUARD): the NATIVE event's stamp — never
    // React's synthetic one, which reads `Date.now()` where this is 0.
    const at = event.nativeEvent.timeStamp;
    if (expanded) {
      // THE GUARD: TIME since the opening, never a count — the flag above
      // already said "open"; this asks only how long ago. Held only from 0
      // up to FOLLOW_AFTER_MS: a negative time can only mean two clocks, and
      // that tap goes.
      const elapsed = at - openedAt.current;
      if (elapsed >= 0 && elapsed < FOLLOW_AFTER_MS) {
        event.preventDefault();
        return;
      }
      onFollow();
      return;
    }
    event.preventDefault();
    openedAt.current = at;
    // AN INPUT-DEVICE CHECK, NOT A TAP COUNTER: `detail` is the browser's
    // click count — 0 for the click Enter makes on a link, 1 or more for a
    // pointer — read only as zero or not, and only to choose whether THE
    // REVEAL scrolls the panel. Open or go is `expanded`'s, above, and hold
    // or go the guard's clock — never this count.
    openedByPointer.current = event.detail > 0;
    onOpen();
  };

  // A HELD ENTER OPENS THE LIST ONCE (the header's paragraph): an Enter
  // keydown the browser itself marks as auto-repeating is held back, so its
  // default action — the link's activation, the click — never comes, and
  // only a fresh press of Enter opens the list or goes to the page. An
  // input-device fact, read as true or false and never counted; every other
  // key, and the first Enter of a press, untouched.
  const onWordKeyDown = (event: KeyboardEvent<HTMLAnchorElement>): void => {
    if (event.key === 'Enter' && event.repeat) event.preventDefault();
  };

  // THE REVEAL (the header's paragraph): after a list the KEYBOARD
  // opened has finished opening, scroll the PANEL so its end shows; a list a
  // pointer opened stays where it opened, under the finger. A close before
  // then cancels it.
  useEffect(() => {
    if (!expanded || openedByPointer.current) return;
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
      {/* THE ROW IS A LINK THAT OPENS ITS LIST FIRST — one <a href>, its
          label its name, the atom's look through asChild (TextButton leaves
          no tag of its own); `w-full` is placement only (§6.8), the atom's
          box, ring and corner untouched. The ⌄ box is positioned against the
          atom's own `relative` box. */}
      <TextButton asChild active={active} held={expanded} className="w-full">
        <a
          href={href}
          aria-expanded={expanded}
          aria-controls={listId}
          aria-describedby={expanded ? hintId : undefined}
          onClick={onWordClick}
          onKeyDown={onWordKeyDown}
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
        </a>
      </TextButton>

      {/* THE HINT — the word's description while its list is open, and
          only then (`aria-describedby` above). Beside the link, never in
          it, so it is no part of the link's name; `hidden`, so it is never
          drawn and never met in the accessibility tree, while the direct
          reference still reads its text (the header's paragraph). */}
      <span id={hintId} hidden>
        {pressAgainHint}
      </span>

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
                onActivate={onFollow}
                className="w-full"
              />
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}
