'use client';

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type ReactElement,
} from 'react';
import { Card } from '@/components/ui/Card/Card';
import { Heading } from '@/components/ui/Heading/Heading';
import { TextButton } from '@/components/ui/TextButton/TextButton';
import { createScrollSpy } from '@/lib/scroll-spy/scroll-spy';
import { createStickyRail } from '@/lib/sticky-rail/sticky-rail';
import type { PriceCategoryProps } from './CategoryCard';

// sections/PriceList/PriceMenu — THE ISLAND: the jump menu's card — the
// sticky <nav> landmark, its <h2> title and its list of links — and the only
// JavaScript this band ships. Built on the owner's pack round (2026-09-14):
// "the on hover animation for current item … normal scrolling also dictates
// menu item, but menu item click takes you also to navigation item. plz craft
// carefully so it doesn't break when it goes both ways" — the mechanics of
// BOTH directions live in lib/scroll-spy, whose header is the law and whose
// first consumer this file is. Widened from the list to the whole card on the
// owner's 2026-09-18 verdict on the menu's sticky behaviour — the paragraph
// after next, and lib/sticky-rail's header, carry the argument.
//
// ── WHY THE ISLAND IS THE <nav> AND NOT THE LIST (§16: the island is the
// smallest component that needs the browser — and since 2026-09-18 that is
// the card). Everything around this file is identical for every visitor and
// is compiled into the static HTML of every locale's services page: the band,
// the grid, every category card and all 102 price rows. Two things DEPEND ON
// THIS VISITOR. One attribute on one link — which category they are looking
// at (lib/scroll-spy). And, new, where the menu card itself is held: the
// menu is 653px tall with eleven categories, Romanian and German alike, and
// under its 136px sticky offset plus 16px of bottom air a window must be
// 805px tall for the whole card to fit. Measured on the built export:
//
//     window                      innerHeight   usable   fits?
//     1366×768 laptop                     633      481      no
//     1080p at 125% scaling               737      585      no
//     1280×800 MacBook                    688      536      no
//     1440×900 MacBook                    789      637      no
//     1080p desktop at 100%               945      793     yes
//
// The first answer was a HEIGHT BELT on the card — `max-h` + `overflow-y-auto`
// — which made the card its own scroll container on every laptop: the wheel
// scrolled the menu instead of the page, with a nested scrollbar inside it.
// "That should absolutely not be possible" (owner). The replacement is
// direction-aware PINNING: scrolling down the card rides with the page until
// its bottom edge meets the window's bottom line and pins there; scrolling up
// it rides until its top edge meets the 8.5rem line and pins there; between
// the two, after a reversal, it holds a frozen relative offset so it never
// jumps. That decision is a fact about the window, so it is made after mount
// (§16's hydration-safety rule) — and the element it positions is the <nav>,
// so the <nav> is the island. Hoisting one level higher, to the band, would
// drag eleven cards of static rows into the client bundle for nothing;
// keeping the island at the list would leave the card it must move on the
// server side of the boundary.
// The band stays a server component and PriceList.tsx's "ONE ISLAND, THE MENU
// CARD" paragraph is the other half of this note. CLAUDE.md §16's runtime
// list names this file — the ReviewsDeck precedent: every island is named
// there, in its own lane.
//
// ── WHAT THE RAIL WRITES, AND WHAT THE STYLESHEET ALREADY KNOWS. lib/
// sticky-rail publishes a mode and one number; this file renders them as ONE
// attribute and ONE inline property, and the static classes stay untouched:
//   · `data-rail` carries the mode — absent for 'fits', so a desktop that
//     fits shows the server HTML byte for byte; 'top' is attribute-only and
//     paints nothing (the base `@3xl:sticky @3xl:top-34` IS the top pin);
//   · `@3xl:data-[rail=travel]:relative` is the one rule the stylesheet gains,
//     and it wears the SAME container-query gate as the base sticky — so
//     below the step, where the menu is a stacked table of contents, the mode
//     can name 'travel' and the layout does not move. That gate is why the
//     position rides a class rather than the style prop: an inline `position:
//     relative` would follow the attribute below the step too — a tablet
//     rotated mid-travel would show the menu displaced over its own cards;
//   · `style={{ top }}` is the number, for 'bottom' (negative: the pin by the
//     bottom edge) and 'travel' (the frozen in-flow offset). On a static
//     element `top` is inert, which is the same gate again.
// The rail reads the 8.5rem line back from the computed `top` rather than
// being told it — the FIFTH coupled spelling of the pill's reach stays the
// fifth (Header.tsx's "THE MOUNT CONTRACT", PriceList.tsx's `@3xl:top-34`
// paragraph) and this file spells no number of its own.
//
// ── STILL DUMB (owner fb-459, board §2c.1). Props in, HTML out: `title` and
// `items` are FINISHED strings — translated, in one language — plus the
// fragment id each link points at, and `id` is the card's own public address
// (PRICE_MENU_ID, exported by the band). No `t()`, no message key, no import
// of the price list, no `Locale`. And note WHAT DOES NOT CROSS: the band hands
// this file `{ id, name }` pairs, never whole categories. Props that cross a
// server→client boundary are serialized into the page's own HTML, so passing
// the categories through would print all 102 name/price rows a second time
// inside the flight payload — for data this component never reads.
//
// ── THE TITLE'S id IS DERIVED FROM THE CARD'S, the CategoryCard idiom
// (`headingId = \`${id}-title\``): the landmark's `aria-labelledby` and the
// <h2>'s `id` are one expression, so the pair can never drift, and a page
// that links to `#price-categories` finds the title at a guessable address.
//
// ── THE TITLE'S STEP IS `band` (D48, 2026-09-26) — AND BESIDE THE CARDS IT
// READS ONE STEP UNDER THEM. Every page <h2> wears ui/Heading's `band` step,
// §15.24's one size per outline level: 30px on a column narrower than the
// container's 28rem `@md` step, 36px from it — the step is Heading's, and the
// arithmetic is in Heading.tsx's `'band' JOINED` paragraph. It replaced
// `page` (D46) after an hour, because a FIXED 36px <h2> outranked the page's
// own <h1> on every phone, where Heading's fluid `hero` step sits on its 32px
// floor.
// The step answers to the NEAREST container, and this title's container is
// the menu card itself (ui/Card's `@container`, landed on the <nav>) — not
// the band's column. Beside the cards that card is the 15rem track
// (PriceList.tsx's `minmax(15rem,1fr) 4fr` paragraph): 190px of content
// inside ui/Card's 25px sides, so „Categorii" reads 30px while every category
// card — its own container, four shares of the row — reads 36px. By the
// band's own arithmetic at the named widths (ui/Container's 10vw gutters, the
// grid's gap-8; the stories' expectHeadingOutline reads each title back from
// real CSS against its own container):
//
//     viewport   arrangement   menu content   card content   menu / cards
//          390   stacked              262px          262px     30 / 30
//          768   stacked              564px          564px     36 / 36
//         1280   beside               190px          702px     30 / 36
//         1536   beside               190px          907px     30 / 36
//         1920   beside               251px         1153px     30 / 36
//
// (Read back in the Storybook test browser, whose classic scrollbar takes
// 15px off the column, 2026-09-26: 247/247px → 30/30 at 390, 190/892px →
// 30/36 at 1536, 190/623px → 30/36 on its 1200px default canvas — the 15rem
// floor holds the menu at 190px beside the cards up to a ~1540px viewport,
// where its 1fr share takes over.)
//
// So "one step under" holds wherever the menu sits BESIDE the cards — from
// the split to a ~2922px viewport, where the 1fr share would finally carry
// the card past 28rem — bar a 2.5px sliver at the split itself (a 960px
// viewport), where the cards' track is still under 498px and both read 30px.
// STACKED, the menu spans the same column as the cards and wears the SAME
// step: 30/30 on a phone, 36/36 from a ~622px viewport. That is the honest
// reading of a 15rem track, not a size of this file's own (§6.6): the title
// is still a sibling of the card titles — the owner's 2026-09-14 decision, a
// TITLE and not the first item — and the rule over the <ul> is what separates
// it from its links at either step.
//
// ── THE CONSUMPTION IDIOM IS lib/rotation's RECIPE, COPIED — twice now, once
// per store (ReviewsDeck was its first witness; the two stores here are
// different, the three lines around each are the same):
//   · each store is built in a useState INITIALIZER, which runs once per
//     render tree — once in Node during the static export and once in the
//     browser at hydration. That is safe only because construction is PURE:
//     createScrollSpy validates its ids and createStickyRail its id, and
//     neither touches a window, so both builds publish the same first
//     snapshots (`{ current: null }`, `{ mode: 'fits' }`) and the server HTML
//     carries no `aria-current`, no `data-rail` and no `style` at all.
//   · useSyncExternalStore is React's own way to read state that lives outside
//     React — subscribe, getSnapshot, getServerSnapshot, exactly the trio each
//     store exposes, so no custom hook is needed and lib/ stays React-free.
//   · start() in an effect, dispose() in its cleanup: the effect runs after the
//     card is on screen (so the targets and the rail exist to be measured) and
//     the cleanup removes every listener, which React also calls on a Fast
//     Refresh re-run. The rail finds its element by the card's id — the spy's
//     own idiom — which is why no ref appears in this file.
//
// ── THE LIST IS STATIC, AND THAT IS A DECISION, NOT A GAP. The spy is built
// from the ids at mount and never told about a new list: page data on this
// site is compiled at build time (§16), so a price menu cannot change length
// while a visitor watches it. lib/scroll-spy's header records `setIds()` as
// the named trigger the day a consumer can; the band's `key` on this island
// is what remounts it — and with it the rail's element — in the workbench.
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
  /** The card's `id` — its public address (`#price-categories`), which the
   *  band owns as PRICE_MENU_ID and hands down so that the one spelling stays
   *  in the band's entry file. The title's id is derived from it here. */
  id: string;
  /** The card's visible title (an <h2>) and, through `aria-labelledby`, the
   *  name of the navigation landmark. Finished, already-translated text
   *  (§8.1): „Categorii", "Kategorien". */
  title: string;
  /** The categories, in the order the cards appear — the same array the band
   *  prints as cards, so an entry without a card is impossible by
   *  construction. At least one — a menu with nothing to point at has no
   *  current item, and createScrollSpy refuses an empty list out loud. The
   *  band is what keeps that promise: PriceList returns null before it reaches
   *  this component (its AN EMPTY TARIFF paragraph), because a guard here
   *  would have to sit above four hooks. */
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

export function PriceMenu({ id, title, items }: PriceMenuProps): ReactElement {
  const titleId = `${id}-title`;
  const [spy] = useState(() =>
    createScrollSpy({ ids: items.map((item) => item.id) }),
  );
  const [rail] = useState(() => createStickyRail({ id }));
  const { current } = useSyncExternalStore(
    spy.subscribe,
    spy.getSnapshot,
    spy.getServerSnapshot,
  );
  const { mode, topPx } = useSyncExternalStore(
    rail.subscribe,
    rail.getSnapshot,
    rail.getServerSnapshot,
  );

  useEffect(() => {
    spy.start();
    return () => spy.dispose();
  }, [spy]);

  useEffect(() => {
    rail.start();
    return () => rail.dispose();
  }, [rail]);

  return (
    <Card asChild aura>
      {/* The <nav> IS the card (ui/slot.ts): the surface lands on the
          landmark itself, so a screen reader can jump to it by role and hears
          its visible title as the name. Sticky and its 8.5rem offset ride
          here through className, which ui/slot.ts merges LAST — placement
          only (§6.8), never a restyle of the atom's paint — and so does the
          one rule the rail's 'travel' mode needs (WHAT THE RAIL WRITES, in
          the header). `tabIndex={-1}` + `scroll-mt-10`: the id is a public
          address — the URL bar, a link from another page — so arriving at it
          gets the same treatment a card's arrival gets (CategoryCard.tsx, THE
          FRAGMENT TARGET): real focus, hence an announcement by name, and the
          same 2.5rem of air that puts its top edge on the stuck menu's own
          line (G2 a11y M1); the rail answers that focus by pinning 'top', so
          the visitor arrives at the title. */}
      <nav
        id={id}
        aria-labelledby={titleId}
        tabIndex={-1}
        data-rail={mode === 'fits' ? undefined : mode}
        style={
          mode === 'bottom' || mode === 'travel'
            ? { top: `${topPx}px` }
            : undefined
        }
        className="scroll-mt-10 @3xl:sticky @3xl:top-34 @3xl:data-[rail=travel]:relative"
      >
        {/* ui/Heading's `band` step on a REAL <h2> — the step every page <h2>
            wears (D48, over D46's hour-long `page`), the category card titles
            included through sections/SectionHeading, which is the owner's
            2026-09-14 decision in one word: „Categorii" is the TITLE of this
            navigation, an honest sibling of the card titles beside it, not
            the first of its own items. Beside them it reads one step under,
            30px to their 36px, because the step answers to this card's own
            15rem container (THE TITLE'S STEP IS `band`, in the header, has
            the measurements). A visible title and an outline entry are two
            independent decisions, which is what `asChild` exists for; the id
            closes the landmark's aria-labelledby pair, and the rule that
            separates the title from the list rides the <ul> below. */}
        <Heading asChild size="band">
          <h2 id={titleId}>{title}</h2>
        </Heading>
        {/* A list, because it IS one: a screen reader announces "list, N
            items" and offers item-by-item navigation. No `role="list"` needed
            — WebKit only drops list semantics from an unstyled-marker list
            OUTSIDE a <nav> (the eslint config's jsx-a11y/list-role-for-webkit
            note), and this one is inside. `items-start` so each link hugs its
            own label instead of stretching to the card's width.
            THE RULE ABOVE IT is what makes the card's <h2> read as the TITLE
            of this navigation rather than as its first item (owner,
            2026-09-14): the title wears the category cards' own `band` step
            (D48) — the same size wherever the menu stacks above them, one
            step under wherever it sits beside them — so the border and the
            matching `mt-4`/`pt-4` are what separate the two. */}
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
      </nav>
    </Card>
  );
}
