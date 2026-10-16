'use client';

import {
  type FocusEvent,
  type PointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import {
  listenForEscape,
  listenForPageExit,
} from '@/lib/overlay-dismiss/overlay-dismiss';
import { PANEL_ID } from './NavMenu';
import type { SectionedPath } from './navSectionLinks';

// sections/Header — THE STATE of the bar row's dropdowns: which card is open,
// how it was opened, and every way it opens and closes (CLAUDE.md §15.40; the
// owner, 2026-10-15: "i want to implement a navigation dropdown on hover JUST
// ON THE TOP BAR ELEMNTS which drops down smoothly with sections of that
// particular page … you have an example of what should happen here on the top
// bar: apple.com as an idea of opening animation with hover and unhover of top
// bar element"). HeaderNav owns it — ONE state for the whole row, so only one
// card is ever open and moving between two words SWAPS them — and ./NavDropdown
// draws one item from it. A hook in a file of its own, the folder's
// ./useNavItems precedent: shared machinery named for what it exports.
//
// ── TWO MODES, ONE OPEN CARD.
//   hover    the mouse opened it; the mouse closes it (leaving, after a grace)
//   pinned   the ⌄ opened it — the keyboard's way in (Apple's): leaving with
//            the pointer does not close it, nor does the pointer on another
//            word swap it away (THE SWAP); the ⌄ again, Escape, focus
//            leaving the item or a press outside the row does
//
// ── THE CLOCKS, measured on apple.com's top bar (headless Chromium,
// 2026-10-15): its panel starts ~0.15s after the pointer arrives and swaps
// INSTANTLY to the next item — no close and reopen, no delay. Here the swap
// waits for the pointer to be on the next item's WORD (THE SWAP, in
// `onPointerMove`: our cards reach under the neighbouring words, Apple's
// full-width panel reaches under none). So:
//   HOVER_INTENT_MS  120 — with no card open, a pointer that rests this long
//                    on an item (its word, or the bands above and below it)
//                    opens its card; one only passing over the row opens
//                    nothing
//   HOVER_GRACE_MS   250 — a pointer that leaves the item (its card included)
//                    closes the card this long after; coming back cancels
//                    it, and so does reaching another dropdown's WORD, which
//                    swaps — a neighbour's band does not
// Intent, not animation: §9's reduced motion leaves both clocks alone (the
// motion is the CSS's, in ./NavDropdown and ./NavSectionEntry).
//
// ── MOUSE ONLY. `pointerType === 'mouse'` — a finger and a pen never open a
// card by hovering. On a touch screen wide enough to show the row (a 13″ iPad
// held sideways) a tap on the word therefore just navigates, and iOS Safari's
// "the content changed on hover" heuristic, which turns the first tap into a
// hover, never sees a change. That screen gets no dropdown at all: the ⌄ is
// the keyboard's (./NavDropdown's THE TOGGLE) — the owner's lever, recorded
// there.
//
// ── A POINTER THAT HAS NOT MOVED HAS HOVERED NOTHING (ui/SpeedDial's hover
// lesson, kept): the first MOVE inside a word's item starts the intent, never
// the bare enter. Chromium re-delivers pointerenter whenever the layout moves
// under a RESTING cursor — a font swapping in, the page settling — and an
// enter-armed card would unfold under a mouse parked on the row with no hand
// on it. Enter does one thing: it starts a VISIT (and cancels a pending grace —
// the pointer came back). A visit ends on leave, and is SPENT when the card is
// dismissed under the pointer — Escape, a ⌄ pressed closed, an entry clicked:
// the card then stays shut until the pointer leaves the item and comes back
// (SC 1.4.13's "dismissible" would mean little if the next twitch reopened
// it). One consequence, stated: a cursor already resting on a word when the
// page loads was never delivered an enter, so jiggling it there opens nothing
// until it leaves and returns — the dial's documented trade, the same here.
//
// ── THE MIXED-INPUT BELT (ui/SpeedDial's, kept): a pointer-driven close —
// the grace, or a swap to the next word — never takes a card away from a
// keyboard focus INSIDE it; closing would hide the focused link and drop the
// visitor on <body> (SC 2.4.3). The keyboard's own ways out stay open, and
// focus leaving the item then closes the card the pointer had already left.
//
// ── THE DISMISSALS. Escape anywhere and the page being left are
// lib/overlay-dismiss's (§15.15's consolidation, fired by these dropdowns):
// Escape closes, and puts focus back on the item's ⌄ when it was inside the
// card (the APG disclosure pattern; `preventScroll`, NavMenu.tsx's focus-return
// paragraph says why — a focus return restores the keyboard's place, never the
// viewport's); leaving closes NOW (flushSync), so a page frozen into the
// back/forward cache is frozen closed. BOTH LISTEN FOR THE ISLAND'S WHOLE LIFE,
// not only while a card is open: a pending intent is no open card, and a word
// clicked inside its first 120ms leaves a timer that would otherwise fire on
// the frozen page — the card unfolding after Back, under no pointer — or let a
// card open after Escape. Two listeners, one of each, for the life of the
// page. The rest are effects that live while a card is open: a press outside
// the row closes it, and so does a resize that changes the window's width
// (the row may cross the bar's step — Header.tsx's THE BREAKPOINT IS A
// CONTAINER STEP).

/** The intent — how long a mouse rests on a word before its card opens. */
export const HOVER_INTENT_MS = 120;
/** The grace — how long a card outlives the mouse leaving its item. */
export const HOVER_GRACE_MS = 250;

/** The open card, if any: the path of its item — one with sections, so a
 *  card can never be filed under Acasă or Blog — and its mode. */
export type OpenDropdown = Readonly<{ path: SectionedPath; pinned: boolean }>;

/** The handlers one dropdown item wears on its <li>. */
export type DropdownItemHandlers = Readonly<{
  onPointerEnter: (event: PointerEvent<HTMLLIElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLLIElement>) => void;
  onPointerLeave: (event: PointerEvent<HTMLLIElement>) => void;
  onBlur: (event: FocusEvent<HTMLLIElement>) => void;
}>;

export type NavDropdowns = Readonly<{
  /** The open card — `null` while every card is closed. */
  open: OpenDropdown | null;
  /** The pointer and focus handlers of the item filed under `path`. */
  itemHandlers: (path: SectionedPath) => DropdownItemHandlers;
  /** The ⌄: opens the item's card PINNED, or closes it if it is open. */
  toggle: (path: SectionedPath) => void;
  /** An entry was activated: close at once, the visit spent. */
  dismiss: () => void;
}>;

/**
 * The bar row's dropdown state.
 *
 * @param navRef the row's <nav> — "outside" for a press, and the scope every
 * item is looked up in (`[data-nav-dropdown="<path>"]`, ./NavDropdown).
 */
export function useNavDropdowns(
  navRef: RefObject<HTMLElement | null>,
): NavDropdowns {
  const [open, setOpen] = useState<OpenDropdown | null>(null);

  // THE COMMITTED STATE, readable the instant it changes (ui/SpeedDial's
  // `openRef`): between an event that flips `open` and the render that
  // publishes it, every handler still closes over the OLD value — a timer and
  // a move landing in the same instant would each judge the row by a state
  // that is already gone. This ref is never behind.
  const openRef = useRef<OpenDropdown | null>(null);
  // The item the mouse is visiting, while its hover may still open a card —
  // null between visits and once a visit is spent (the header's paragraph).
  const visit = useRef<SectionedPath | null>(null);
  const intent = useRef<{ path: SectionedPath; timer: number } | null>(null);
  const grace = useRef<number | undefined>(undefined);

  // ONE place where the state flips, so the ref and React can never disagree.
  const commit = useCallback((next: OpenDropdown | null) => {
    openRef.current = next;
    setOpen(next);
  }, []);

  // clearTimeout on an absent id is a no-op by spec.
  const cancelIntent = useCallback(() => {
    if (intent.current) window.clearTimeout(intent.current.timer);
    intent.current = null;
  }, []);
  const cancelGrace = useCallback(() => {
    window.clearTimeout(grace.current);
    grace.current = undefined;
  }, []);

  // The item, its ⌄ and its card, looked up in the row by the item's path —
  // the ⌄ is the item's one <button>, the card what it controls.
  const partsOf = useCallback(
    (path: SectionedPath) => {
      const item = navRef.current?.querySelector<HTMLElement>(
        `[data-nav-dropdown="${path}"]`,
      );
      const toggleButton =
        item?.querySelector<HTMLButtonElement>('button[aria-controls]') ?? null;
      const cardId = toggleButton?.getAttribute('aria-controls');
      const card = cardId ? document.getElementById(cardId) : null;
      return { item: item ?? null, toggleButton, card };
    },
    [navRef],
  );

  // THE BELT: is the keyboard inside this item's card right now?
  const cardHoldsFocus = useCallback(
    (path: SectionedPath) =>
      partsOf(path).card?.contains(document.activeElement) ?? false,
    [partsOf],
  );

  // Every close that leaves the visit spent and no clock running.
  const shut = useCallback(() => {
    cancelIntent();
    cancelGrace();
    visit.current = null;
    commit(null);
  }, [cancelIntent, cancelGrace, commit]);

  // FOCUS INSIDE A CARD THAT IS ABOUT TO CLOSE goes back to its ⌄ FIRST,
  // while the card is still drawn — the APG disclosure pattern — or it would
  // be hidden with the card and dropped on <body>. Escape and the ⌄ pressed
  // closed (Safari and Firefox on a Mac do not focus a clicked button, so
  // focus can still sit in an entry) call it before they close — a width
  // change has its own rule, beside its listener, since the row itself may
  // be gone (A PRESS OUTSIDE THE ROW, and A RESIZE); `preventScroll` for
  // NavMenu.tsx's focus-return reason — a focus return restores the
  // keyboard's place, never the viewport's. Focus anywhere else — the word,
  // the ⌄ itself, the page — stays where it is.
  const returnFocusFrom = useCallback(
    (path: SectionedPath) => {
      const { card, toggleButton } = partsOf(path);
      if (card?.contains(document.activeElement)) {
        toggleButton?.focus({ preventScroll: true });
      }
    },
    [partsOf],
  );

  const itemHandlers = useCallback(
    (path: SectionedPath): DropdownItemHandlers => ({
      onPointerEnter: (event) => {
        if (event.pointerType !== 'mouse') return;
        visit.current = path;
        // The pointer came back to the OPEN item before the grace ran out.
        // Entering ANOTHER item cancels nothing: only the swap, on its WORD,
        // takes the open card's place (THE SWAP, below) — a pointer crossing
        // a neighbour's band on its way into the card leaves the grace
        // running, and lingering there lets the card close.
        if (openRef.current?.path === path) cancelGrace();
      },
      onPointerMove: (event) => {
        if (event.pointerType !== 'mouse') return;
        if (visit.current !== path) return; // no visit, or a spent one
        const current = openRef.current;
        if (current?.path === path) return;
        if (current) {
          // THE SWAP — another card is open: this one takes its place at
          // once, no intent (Apple's), but ONLY with the pointer on this
          // item's WORD — the link: its own box, 44px tall, and the arrow
          // drawn inside it, whose 16px box reaches 8px past the link into
          // the row's gap (./NavDropdown's THE ARROW) — never on the bands
          // above and below it that make the item as tall as the row. A card
          // here is two columns wide and reaches under the neighbouring
          // words, which apple.com's full-width panel never has to handle: a
          // pointer heading from „Servicii" for the card's right column
          // crosses the band under „Echipa", and an item-wide swap would hand
          // it Echipa's card on the way. On the word, the visitor meant the
          // word. Nor does a move on the band arm an intent while a card is
          // open — the grace decides first; once it has closed the card, the
          // next move here is a closed bar's and opens this item after the
          // 120ms like any other. Never while the keyboard is inside the
          // open card (THE MIXED-INPUT BELT). And NEVER AWAY FROM A PINNED
          // CARD: a pinned card belongs to the keyboard — the ⌄ opened it,
          // and the ⌄, Escape, focus leaving the item or a press outside
          // close it (the header's TWO MODES), never a hover. Its focus can
          // sit on the ⌄, OUTSIDE the card, where the belt cannot see it:
          // swapped, that ⌄ would say "collapsed" under the keyboard and the
          // next Tab land on „Echipa" (the accessibility review, 2026-10-16).
          const word = event.currentTarget.querySelector(':scope > a');
          const onWord =
            word !== null &&
            event.target instanceof Node &&
            word.contains(event.target);
          if (!onWord || current.pinned || cardHoldsFocus(current.path)) {
            return;
          }
          cancelIntent();
          cancelGrace();
          commit({ path, pinned: false });
          return;
        }
        // THE INTENT — armed by the first move and not restarted by later
        // ones: a dwell any jitter could reset would never elapse.
        if (intent.current?.path === path) return;
        cancelIntent();
        intent.current = {
          path,
          timer: window.setTimeout(() => {
            intent.current = null;
            // Something opened meanwhile (the ⌄), or the visit ended.
            if (openRef.current !== null || visit.current !== path) return;
            commit({ path, pinned: false });
          }, HOVER_INTENT_MS),
        };
      },
      onPointerLeave: (event) => {
        if (event.pointerType !== 'mouse') return;
        if (visit.current === path) visit.current = null;
        if (intent.current?.path === path) cancelIntent();
        const current = openRef.current;
        if (current?.path !== path || current.pinned) return;
        cancelGrace();
        grace.current = window.setTimeout(() => {
          grace.current = undefined;
          const now = openRef.current;
          if (now?.path !== path || now.pinned) return;
          if (cardHoldsFocus(path)) return; // THE BELT
          commit(null);
        }, HOVER_GRACE_MS);
      },
      // React's onBlur is delegated `focusout`, which bubbles: one handler on
      // the item sees every control inside it. FOCUS LEAVING THE ITEM closes
      // a PINNED card — the keyboard opened it, the keyboard left it. A hover
      // card belongs to the pointer, and stays while the pointer is still
      // visiting the item; one the pointer has already left closes too — the
      // mixed-input belt above kept it open only for the focus inside it, and
      // with that focus gone nothing else would. A null relatedTarget is
      // ignored, ui/SpeedDial's rule: focus going nowhere is a window losing
      // focus (a tab switch) or a press on the page, which the outside-press
      // listener answers.
      // The close here is THIS item's alone: the timers and the hover
      // visit are cleared only where they belong to it. Focus Tabbing from a
      // card onto „Echipa" while the mouse rests there must leave Echipa's
      // visit standing, so the mouse's next move opens Echipa's card after the
      // intent — `shut()` would have spent it.
      onBlur: (event) => {
        const current = openRef.current;
        if (current?.path !== path) return;
        if (!current.pinned && visit.current === path) return;
        const next = event.relatedTarget;
        if (next === null || event.currentTarget.contains(next)) return;
        if (intent.current?.path === path) cancelIntent();
        cancelGrace(); // only ever the open card's — this one
        if (visit.current === path) visit.current = null;
        commit(null);
      },
    }),
    [cancelGrace, cancelIntent, cardHoldsFocus, commit],
  );

  const toggle = useCallback(
    (path: SectionedPath) => {
      if (openRef.current?.path === path) {
        returnFocusFrom(path);
        shut();
        return;
      }
      cancelIntent();
      cancelGrace();
      commit({ path, pinned: true });
    },
    [cancelGrace, cancelIntent, commit, returnFocusFrom, shut],
  );

  // ── ESCAPE and THE PAGE EXIT — for the island's whole life (the header's
  // THE DISMISSALS says why not only while open).
  useEffect(
    () =>
      listenForEscape(() => {
        const current = openRef.current;
        if (!current) {
          // A pending intent and no card yet: Escape cancels the opening and
          // spends the visit, so the resting pointer does not open it after.
          if (intent.current) shut();
          return;
        }
        returnFocusFrom(current.path);
        shut();
      }),
    [returnFocusFrom, shut],
  );

  useEffect(
    () =>
      listenForPageExit((exit) => {
        cancelIntent();
        cancelGrace();
        if (openRef.current === null) return;
        // Leaving: applied NOW, so the snapshot the back/forward cache
        // freezes is closed (NavMenu.tsx's DEPARTURE paragraph).
        if (exit === 'leave') flushSync(() => commit(null));
        else commit(null);
      }),
    [cancelGrace, cancelIntent, commit],
  );

  // ── A PRESS OUTSIDE THE ROW, and A RESIZE — while a card is open. A press
  // anywhere but the row closes whichever card is open (a pinned one is the
  // case that needs it; a hover card is already on its grace, and closing it
  // at once costs nothing). `pointerdown`, so a touch on the page counts too.
  // A resize closes it when the window's WIDTH moved — the reason is the bar's
  // step, which reads a width (the row may be about to vanish under the
  // card); a height-only resize (a mobile URL bar, a docked panel, a
  // full-page screenshot) leaves an open card alone.
  useEffect(() => {
    if (!open) return;
    const nav = navRef.current;
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (nav && event.target instanceof Node && nav.contains(event.target)) {
        return;
      }
      shut();
    };
    // THE DROPPED FOCUS. A width change under the bar's step hides the whole
    // row, and the browser takes the focus away from a control it no longer
    // draws — in Chromium BEFORE the resize event arrives (measured,
    // 2026-10-16: a focusout to nowhere 10ms ahead of the resize, by which
    // time `document.activeElement` is <body>). So the row remembers, for as
    // long as this card is open, that its focus was DROPPED: a focusout to
    // nowhere from a control that is no longer drawn (no client rects). One
    // to nowhere from a control still drawn — a press on the page, the window
    // losing focus — is not that, and is not remembered.
    let dropped = false;
    const onFocusOut = (event: globalThis.FocusEvent) => {
      if (
        event.relatedTarget === null &&
        event.target instanceof Element &&
        event.target.getClientRects().length === 0
      ) {
        dropped = true;
      }
    };
    const width = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === width) return;
      // WHERE THE KEYBOARD IS, read BEFORE anything closes: shut() makes the
      // card inert, and a focus left there — or on a row the step has just
      // hidden — would be stranded on a control nobody can reach, then on
      // <body>. While the row is still drawn, focus in the card goes back to
      // its ⌄ (every close's manner) and focus on a word or a ⌄ stays put.
      // Under the bar's step the row, words, ⌄s and cards, is `display:
      // none` (the ⌄'s offsetParent null) and the BURGER is drawn in its
      // place — NavMenu's `@min-[62rem]:hidden`, the other half of the same
      // breakpoint, the way into the same links — so focus anywhere in the
      // row goes to the burger: in the card, on the ⌄ itself (where Enter
      // leaves it once the card is pinned), and a focus already DROPPED from
      // the row onto <body> (above). `preventScroll`, for the focus-return
      // paragraph's reason.
      const current = openRef.current;
      if (current) {
        const { toggleButton, card } = partsOf(current.path);
        const focused = document.activeElement;
        if (toggleButton?.offsetParent) {
          if (card?.contains(focused)) {
            toggleButton.focus({ preventScroll: true });
          }
        } else if (
          nav?.contains(focused) ||
          (dropped && (focused === null || focused === document.body))
        ) {
          document
            .querySelector<HTMLButtonElement>(
              `button[aria-controls="${PANEL_ID}"]`,
            )
            ?.focus({ preventScroll: true });
        }
      }
      shut();
    };
    document.addEventListener('pointerdown', onPointerDown);
    nav?.addEventListener('focusout', onFocusOut);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      nav?.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('resize', onResize);
    };
  }, [open, navRef, partsOf, shut]);

  // No clock outlives the island.
  useEffect(
    () => () => {
      cancelIntent();
      cancelGrace();
    },
    [cancelGrace, cancelIntent],
  );

  return { open, itemHandlers, toggle, dismiss: shut };
}
