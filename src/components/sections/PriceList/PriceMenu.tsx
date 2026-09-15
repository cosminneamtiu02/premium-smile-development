'use client';

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type ReactElement,
} from 'react';
import { TextButton } from '@/components/ui/TextButton/TextButton';
import { createScrollSpy } from '@/lib/scroll-spy/scroll-spy';
import type { PriceCategoryProps } from './CategoryCard';

// sections/PriceList/PriceMenu — THE ISLAND: the jump menu's list of links,
// and the only JavaScript this band ships. Built on the owner's pack round
// (2026-09-14): "the on hover animation for current item … normal scrolling
// also dictates menu item, but menu item click takes you also to navigation
// item. plz craft carefully so it doesn't break when it goes both ways". That
// reverses the price-list board's §4.3 option A — the band shipped with no
// current-item marker because marking one needs a browser — and the mechanics
// of BOTH directions live in lib/scroll-spy, which is where the "so it doesn't
// break" argument is written out in full (its header is the law; this file is
// its first consumer).
//
// ── WHY THE ISLAND IS THE LIST AND NOT THE BAND, NOR EVEN THE <nav> (§16: the
// island is the smallest component that needs the browser). Everything around
// these links is identical for every visitor and is therefore compiled into
// the static HTML of every locale's services page: the band, the grid, the
// card surface, the <nav> landmark, its <h2>, every category card and all 102
// price rows. What DEPENDS ON THIS VISITOR is one attribute on one link — which
// category they are currently looking at — so that is what ships as
// JavaScript. Hoisting the island one level to the <nav> would drag the
// landmark, its heading and the aria-labelledby pair into the client bundle
// for nothing; pushing it one level down to a single link would mean eleven
// islands each subscribing to the same store.
// The band stays a server component and PriceList.tsx's "ONE ISLAND, THE MENU
// LIST" paragraph is the other half of this note. CLAUDE.md §16's runtime list
// gains this file in the same change-set — the ReviewsDeck precedent: every
// island is named there, in its own lane.
//
// ── STILL DUMB (owner fb-459, board §2c.1). Props in, HTML out: `items` are
// FINISHED strings — translated, in one language — plus the fragment id each
// link points at. No `t()`, no message key, no import of the price list, no
// `Locale`. And note WHAT DOES NOT CROSS: the band hands this file `{ id, name }`
// pairs, never whole categories. Props that cross a server→client boundary are
// serialized into the page's own HTML, so passing the categories through would
// print all 102 name/price rows a second time inside the flight payload — for
// data this component never reads.
//
// ── THE CONSUMPTION IDIOM IS lib/rotation's RECIPE, COPIED (ReviewsDeck was
// its first witness, this is its second reader — the two stores are different,
// the three lines around them are the same):
//   · the store is built in a useState INITIALIZER, which runs once per render
//     tree — once in Node during the static export and once in the browser at
//     hydration. That is safe only because construction is PURE: createScrollSpy
//     validates its ids and touches no window, so both builds publish the same
//     first snapshot (`{ current: null }`) and the server HTML carries no
//     `aria-current` at all.
//   · useSyncExternalStore is React's own way to read state that lives outside
//     React — subscribe, getSnapshot, getServerSnapshot, exactly the trio the
//     store exposes, so no custom hook is needed and lib/ stays React-free.
//   · start() in an effect, dispose() in its cleanup: the effect runs after the
//     list is on screen (so the targets exist to be measured) and the cleanup
//     removes every listener, which React also calls on a Fast Refresh re-run.
//
// ── THE LIST IS STATIC, AND THAT IS A DECISION, NOT A GAP. The spy is built
// from the ids at mount and never told about a new list: page data on this
// site is compiled at build time (§16), so a price menu cannot change length
// while a visitor watches it. lib/scroll-spy's header records `setIds()` as
// the named trigger the day a consumer can.
//
// ── `aria-current="location"`, PASSED EXPLICITLY — not TextButton's `active`
// sugar, which spells `page`. The two are different claims: `page` says "this
// link points at the document you are reading" (the Header's nav item for
// /ro/services), `location` says "this is where you are WITHIN the page",
// which is exactly what a table of contents marks. The atom documents the
// precedence this relies on: "an explicitly passed aria-current still wins".
// `active` still rides along for the LOOK — the atom's own rest-state variant,
// the label in cta-hover green with the underline drawn at full width and no
// animation to wait for, which is the hover END state the owner asked the
// current item to wear. Colour is never the only signal (§9, SC 1.4.1): the
// attribute is the announcement, the underline is the shape.
//
// ── ONLY A PLAIN LEFT CLICK PINS. A middle click, or a Cmd/Ctrl/Shift/Alt
// click, opens the link somewhere else — a new tab, a new window — and this
// document must not mark a category the visitor never went to in THIS tab.
// isPlainLeftClick below is that filter; every OTHER way of reaching a
// fragment (Back, Forward, a pasted link, the address bar) arrives as a
// `hashchange`, which lib/scroll-spy listens for itself.
// The link is never prevented, never intercepted: the jump stays the browser's
// own same-document navigation (§15.13, board §4.1), so the URL takes the
// fragment, the card receives focus through its tabindex="-1", and the scroll
// glides or teleports according to the visitor's motion preference. The pin is
// a marker laid over that, never a replacement for it.

/**
 * One entry: the fragment id it points at and its finished label (§8.1).
 * DERIVED from the band's contract rather than spelled a second time (§4's
 * "one definition" rule — PriceList.tsx re-exports CategoryCard's types for
 * the same reason): a rename or a widening on the band flows here or fails
 * here, loudly, instead of two declarations drifting apart. `import type` is
 * erased at compile time, so no server module enters this island's bundle and
 * no 'use client' boundary is crossed (G2 typescript, Fable, 2026-09-15).
 */
export type PriceMenuItem = Readonly<Pick<PriceCategoryProps, 'id' | 'name'>>;

export type PriceMenuProps = Readonly<{
  /** The categories, in the order the cards appear — the same array the band
   *  prints as cards, so an entry without a card is impossible by
   *  construction. At least one — a menu with nothing to point at has no
   *  current item, and createScrollSpy refuses an empty list out loud. The
   *  band is what keeps that promise: PriceList returns null before it reaches
   *  this component (its AN EMPTY TARIFF paragraph), because a guard here
   *  would have to sit above three hooks. */
  items: readonly PriceMenuItem[];
}>;

/** A click that navigates THIS tab: the primary button, no modifier held. */
function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export function PriceMenu({ items }: PriceMenuProps): ReactElement {
  const [spy] = useState(() =>
    createScrollSpy({ ids: items.map((item) => item.id) }),
  );
  const { current } = useSyncExternalStore(
    spy.subscribe,
    spy.getSnapshot,
    spy.getServerSnapshot,
  );

  useEffect(() => {
    spy.start();
    return () => spy.dispose();
  }, [spy]);

  return (
    // A list, because it IS one: a screen reader announces "list, N items" and
    // offers item-by-item navigation. No `role="list"` needed — WebKit only
    // drops list semantics from an unstyled-marker list OUTSIDE a <nav> (the
    // eslint config's jsx-a11y/list-role-for-webkit note), and this one is
    // inside. `items-start` so each link hugs its own label instead of
    // stretching to the card's width.
    // THE RULE ABOVE IT is what makes the card's <h2> read as the TITLE of
    // this navigation rather than as its first item (owner, 2026-09-14): the
    // title now wears the same `section` step the category cards wear, so the
    // border and the matching `mt-4`/`pt-4` are what separate the two.
    <ul className="mt-4 flex flex-col items-start gap-1 border-t border-line-subtle pt-4">
      {items.map((item) => {
        const isCurrent = current === item.id;
        return (
          <li key={item.id}>
            <TextButton
              asChild
              active={isCurrent}
              aria-current={isCurrent ? 'location' : undefined}
              className="-ml-2"
            >
              <a
                href={`#${item.id}`}
                onClick={(event) => {
                  if (isPlainLeftClick(event)) spy.select(item.id);
                }}
              >
                {item.name}
              </a>
            </TextButton>
          </li>
        );
      })}
    </ul>
  );
}
