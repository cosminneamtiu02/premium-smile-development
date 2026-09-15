import type { ComponentProps, ReactElement } from 'react';
import { Card } from '@/components/ui/Card/Card';
import { Container } from '@/components/ui/Container/Container';
import { Heading } from '@/components/ui/Heading/Heading';
import { cx } from '@/lib/cx/cx';
import { CategoryCard, type PriceCategoryProps } from './CategoryCard';
import { PriceMenu } from './PriceMenu';

// sections/PriceList — the Services page's price band: an in-page jump menu
// inside a card beside a column of category cards. Built to the owner-approved
// composition contract on the board .claude/plans/price-list.plan.md (rounds
// 1–4, 2026-09-13); §3 is the desktop layout, §4 the jump, §5 the phone
// adaptation, §2c the round-2 riders this file implements. Reshaped by the
// owner's pack round of 2026-09-14 — the menu title, the single price column,
// the glow on every card, the menu's new offset, the current-item marker and
// the removal of the "back to categories" link; every paragraph that changed
// says so.
//
// ── IT IS A DUMB BAND (owner fb-459, board §2c.1) — and that is the whole
// interface. It imports no data, calls no `t()`, holds no message key, formats
// nothing and does not know what a `Locale` is: every visible word arrives as
// a prop, finished and already translated. The ONE populator is the page
// (app/[locale]/services/page.tsx), which walks the price list once, picks the
// language's words, formats each amount with the one ICU sentence key and
// hands the result over (board §1.4). Consequences worth stating, because they
// are the reason for the shape: the band is reviewable in Storybook at every
// width and language before the real tariff exists, its tests can never be
// broken by an edit to the list or to a message file, and a Home teaser could
// one day print a single category through the same component.
// Tier-wise this is §4's props-in SHARED COMPOSITION sub-kind — the
// SectionHeading / ReviewCard / PersonnelCard group — not a wired page BAND
// like Header, Footer or ClinicLocation.
//
// ── ONE ISLAND, THE MENU LIST (§16; owner 2026-09-14, reversing board §4.3
// option A). This file ships NO JavaScript: no 'use client', no state, no
// hook, no handler — the band, the grid, the menu card, its <nav> landmark and
// <h2>, every category card and all its price rows compile into the static
// HTML of every locale's services page and stay inert. What the visitor now
// downloads is ./PriceMenu, the list of links alone, because ONE attribute on
// ONE link depends on this visitor: which category they are currently looking
// at. Its mechanics are lib/scroll-spy — scroll marks the menu, a click marks
// it too, and the click's mark survives the scrolling the jump itself causes
// (the pin). PriceList.test.tsx pins the split from the source text of all
// three files, because no runtime assertion can see a directive: this file and
// CategoryCard.tsx must carry none, PriceMenu.tsx exactly one.
//
// ── THE BAND RECIPE, APPLIED (the standing law in ui/Container's header, its
// "THE PAGE-BAND RECIPE" block): the semantic full-bleed outer owns the paint,
// <Container> owns the width and the container-query context, and the box one
// level in carries the band's own vertical rhythm. Here that box is ALSO the
// two-track grid — an element cannot query its own size (the ClinicLocation D7
// lesson), so every `@`-step in this file measures Container's column from
// inside it.
//
// ── THE TWO TRACKS, and why "20%" is really a floor (board §3.2, §8.4):
// `minmax(15rem,1fr) 4fr` gives the cards four shares of the free space for
// every one of the menu's — the owner's 20/80 — but never lets the menu track
// fall below 15rem. On every named viewport below 1920 the FLOOR is what
// actually decides the width (at 1536 the column is 1229px and 20% would be
// 239px, a hair under the floor); only at 1920 does the percentage win. The
// floor exists for GERMAN: a menu label is interactive text, so §15.14 forbids
// syllable-breaking it, and „Kinderzahnheilkunde" at the 1.125rem body size
// needs ~170px of the ~190px the floor leaves inside the card. The German
// stories are where that is measured, not asserted from a table.
//
// ── `@3xl:items-start` IS WHAT MAKES THE MENU STICKY AT ALL, and it looks
// like cosmetics (board §3.3): a grid item is STRETCHED to its row's height by
// default, so without it the menu card would be exactly as tall as the whole
// cards column and would have nothing left to stick against — `position:
// sticky` would apply and visibly do nothing. `items-start` on the grid (i.e.
// `align-self: start` on both tracks) gives the card its content height back,
// and the sticky then runs against the grid's own box.
//
// ── `@3xl:top-34` IS THE FIFTH COUPLED SPELLING OF THE HEADER PILL'S REACH,
// PLUS THE AIR THE GLOW NEEDS (owner 2026-09-14: move the menu "1-2 rem"
// down). KEEP-IN-SYNC with sections/Header.tsx's "THE MOUNT CONTRACT" block
// (item a) and with src/styles/globals.css's `scroll-padding-top` — cited by
// those anchors, never by line number (§17.7). The pill floats at `top-4`
// (1rem) and is `h-20` (5rem) at every width, so its reach is 6rem; what
// changed is how much air rides on top of it, and the number is MEASURED
// rather than chosen: the pill wears `--shadow-aura: 0 8px 22px …`, whose glow
// tints the page ground down to y = 126px (pixel-sampled under Chromium at
// 1280, 1536 and 1920, counting any channel that differs from the untinted
// ground by more than 1/255). The old 7rem put the menu's top edge at 112px —
// 14px INSIDE that glow, which is exactly what the owner saw. 8.5rem = 136px
// clears it by 10px, and it is the midpoint of the range they asked for.
// So: reach 6rem + 2.5rem of air = `top-34`. The mount contract's own words
// hold — the numbers move together or the debt reopens — and the board's
// recorded alternative (promote the reach to one `--bar-reach` token every
// spelling reads) stays a named trigger for a hygiene lane touching those
// files, deliberately not this band's business.
// THE SAME 2.5rem RIDES THE CARDS, which is the point of the pair: each
// CategoryCard carries `scroll-mt-10` over the global `scroll-padding-top:
// 6rem`, so a jumped-to card comes to rest with its top edge on the very line
// the stuck menu's top edge sits on. Two numbers, one visual line.
//
// ── THE HEIGHT BELT is the NavMenu precedent, and it engages only when it
// must (board §3.3): a stuck menu taller than the viewport minus its own
// offset would hide its last categories with no way to reach them.
// `max-h-[calc(100dvh-9.5rem)] overflow-y-auto` turns that case into a
// scrollable card — nested scrolling, which older visitors do find confusing,
// and still strictly better than unreachable links. The 9.5rem is the offset
// above (8.5rem) plus one rem of breathing room at the bottom, so the belt
// moves with the menu instead of being a number of its own. With eleven
// one-line categories the belt never engages above a ~800px-tall window. Both
// halves are `@3xl:`-gated: below the step the menu is not sticky, so capping
// its height would only mutilate a table of contents that is free to be as
// tall as it likes.
// TRAP, recorded because it is invisible: `overflow-x-hidden` anywhere above
// the menu would turn that ancestor into a scroll container and KILL the
// sticky. If this band ever needs a horizontal belt it takes the reviews
// band's `overflow-x-clip` spelling, which clips without creating one.
//
// ── BARE `#id` HREFS, NOT `localeHref` (board §4.1, §15.13). Inside the page
// the bare fragment is the robust spelling: the browser resolves it against
// the current document, whatever the locale prefix, the trailing slash or the
// interim base path happen to be. `localeHref` is for links from OTHER pages —
// a future Home teaser saying "see the endodontics prices" — and it keeps
// fragments for exactly that. Both halves of the jump are already global and
// need no line here: `scroll-padding-top: 6rem` lands the target below the
// pill, and `scroll-behavior: smooth` under `prefers-reduced-motion:
// no-preference` glides for those who allow motion and teleports for those who
// do not (§9).
//
// ── THE MENU LINKS ARE ui/TextButton, COMPOSED — not its class string copied.
// They are rendered by ./PriceMenu (the island), because the CURRENT one wears
// the atom's own `active` variant: the label in cta-hover green with the
// underline drawn at full width, statically — the END state of the hover
// animation, which is precisely what the owner asked the current item to look
// like. The Footer's nav list is otherwise the same object (a vertical column
// of quiet links through `asChild` onto a plain <a>, `-ml-2` pulling the
// label's optical edge back over the atom's `px-2` so it lines up with the
// card's title), and the atom is where that look is spelled ONCE. Three things
// this band would otherwise have had to restate and could have got wrong:
// `min-h-11` — 2.75rem = 44px, the §9 target floor for a primary action, in
// rem so browser zoom carries it — `hyphens-none` (§15.14: an interactive
// label never syllable-breaks), and the focus-visible ring. NEVER restyle
// these links to the `anchor` role token: #00a968 on white measures 3.05:1, a
// fail at 4.5:1 for 18px regular text (G2 a11y, measured) — the atom's
// ink-at-rest is what passes. The links are <a>s and not buttons because a
// jump is NAVIGATION the browser performs itself (§9: semantic HTML first).
//
// ── THE GLOW IS A CARD KIND, AND IT COSTS THE COLUMN A GAP (owner
// 2026-09-14: the aura on every card here). `aura` is ui/Card's own prop —
// chosen per card KIND in the section that composes it (fb-378/381), which is
// why this band passes it rather than naming a shadow utility of its own; the
// atom holds the single spelling of `--shadow-aura` and
// tests/unit/aura-token.test.ts's census counts it there. The consequence is
// the cards' `gap-8`: the glow is `0 8px 22px`, i.e. roughly 22px of blur
// around the box and ~30px below it, so the 24px of a `gap-6` column would
// have let two neighbouring glows stack into a grey seam between cards. 32px
// clears it.
//
// ── WHAT THE BAND DELIBERATELY DOES NOT NAME: itself. The root <section>
// carries no `aria-labelledby` of its own, and the naming attributes stay OPEN
// on the props (unlike CategoryCard, which Omits them): the page owns the
// intro heading above this band and names it from there, exactly as the board
// sketches it (`<section aria-labelledby="prices-title">`). What IS named here
// is the menu — a `<nav>` landmark labelled by its own visible title, the
// Footer's pattern, which also keeps the house rule that the role word never
// appears in the name.

/**
 * The menu card's `id`. Exported because it is a PUBLIC address: it shows up
 * in the URL bar as `#price-categories`, a page may link to it, and a test or
 * a story asserting that link should not have to retype the string. English,
 * like every fragment id in this band (owner fb-461).
 */
export const PRICE_MENU_ID = 'price-categories';

/** Half of the menu landmark's `aria-labelledby` pair — derived from the id
 *  above so the two can never drift, and not exported: nothing outside this
 *  file has business pointing at the title element. */
const MENU_TITLE_ID = `${PRICE_MENU_ID}-title`;

// The row and category shapes live with the component that renders them
// (CategoryCard.tsx) and are re-exported here so a page imports the band's
// whole contract from one path. A re-export, never a second declaration.
export type { PriceCategoryProps, PriceRowProps } from './CategoryCard';

type PriceListOwnProps = Readonly<{
  /**
   * The menu card's visible title (an <h2>) — and, through
   * `aria-labelledby`, the name of the navigation landmark it sits in.
   * Finished, already-translated text (§8.1): „Categorii", "Kategorien".
   */
  menuTitle: string;
  /**
   * The tariff, in the order it should be read. The SAME array prints the menu
   * and the cards, which is what makes a menu entry without a card (or the
   * reverse) impossible by construction — no test has to check for it.
   * An empty list renders NOTHING at all (see the guard in the body).
   */
  categories: readonly PriceCategoryProps[];
}>;

export type PriceListProps = PriceListOwnProps &
  // The native <section> surface, minus the band's own names and minus
  // `children` (content arrives as `categories`; without the Omit a caller
  // could nest something, type-check, and watch it vanish — the SectionHeading
  // precedent). React 19 carries `ref` inside these props, so it needs no
  // mention of its own (§6.8).
  Omit<ComponentProps<'section'>, keyof PriceListOwnProps | 'children'>;

export function PriceList({
  menuTitle,
  categories,
  className,
  ...rest
}: PriceListProps): ReactElement | null {
  // AN EMPTY TARIFF RENDERS NOTHING — the sections/ReviewsCarousel answer,
  // verbatim (its own `reviews.length === 0` exit), because the two bands are
  // the same kind of object: a props-in composition whose content is a list
  // somebody else owns. Without it the prop type advertises a value the band
  // dies on: ./PriceMenu builds its scroll-spy from these ids, and
  // lib/scroll-spy refuses an empty list out loud (rightly — a navigation with
  // nothing to point at has no current item), so `<PriceList categories={[]} />`
  // type-checks and then kills `next build` with a RangeError named three
  // levels below the API that was misused (G2 typescript, 2026-09-14). The
  // guard belongs HERE and not in the island: an early return there would sit
  // above three hooks. It is also why the band, not the menu, owns the empty
  // case — a header teaser printing one filtered category is the caller this
  // is really for.
  if (categories.length === 0) return null;

  return (
    // BAND OUTER: the semantic element, full-bleed, owning the paint and
    // nothing else — no gutter here, no outer margin (§6.4: the page owns the
    // rhythm between its bands). `bg-page` is the ground every content band on
    // this site stands on. className is merged caller-last (§6.8).
    <section {...rest} className={cx('bg-page', className)}>
      <Container>
        {/* The rhythm box AND the grid, one element: the band's own stepped
            `py` (the recipe's rule 3) plus the two tracks. Both steps measure
            Container's column from inside it — `@lg` = 32rem of column, `@3xl`
            = 48rem, which with the 10vw gutters is a viewport of ~960px, the
            same step ClinicLocation flips on so the site's bands flip
            together. `gap-8` is the section owning ALL child spacing (§6.4).
            `items-start` is load-bearing for the sticky menu — see the header. */}
        <div className="grid gap-8 py-12 @lg:py-16 @3xl:py-20 @3xl:grid-cols-[minmax(15rem,1fr)_4fr] @3xl:items-start">
          <Card asChild aura>
            {/* The <nav> IS the card (ui/slot.ts): the surface lands on the
                landmark itself, so a screen reader can jump to it by role and
                hears its visible title as the name. Sticky, its 8.5rem offset
                and the height belt all ride here through className, which
                ui/slot.ts merges LAST — placement only (§6.8), never a
                restyle of the atom's paint.
                `tabIndex={-1}` + `scroll-mt-10`: PRICE_MENU_ID is a public
                address — the URL bar, a link from another page — so arriving
                at it gets the same treatment a card's arrival gets
                (CategoryCard.tsx, THE FRAGMENT TARGET): real focus, hence an
                announcement by name, and the same 2.5rem of air that puts its
                top edge on the stuck menu's own line (G2 a11y M1). */}
            <nav
              id={PRICE_MENU_ID}
              aria-labelledby={MENU_TITLE_ID}
              tabIndex={-1}
              className="scroll-mt-10 @3xl:sticky @3xl:top-34 @3xl:max-h-[calc(100dvh-9.5rem)] @3xl:overflow-y-auto"
            >
              {/* ui/Heading's `section` step on a REAL <h2> — the same step
                  every category card's title wears, which is the owner's
                  2026-09-14 decision in one word: „Categorii" is the TITLE of
                  this navigation, an honest sibling of the card titles beside
                  it, not the first of its own items. A visible title and an
                  outline entry are two independent decisions, which is what
                  `asChild` exists for; the id closes the landmark's
                  aria-labelledby pair, and the rule that separates the title
                  from the list rides the <ul> in ./PriceMenu. */}
              <Heading asChild size="section">
                <h2 id={MENU_TITLE_ID}>{menuTitle}</h2>
              </Heading>
              {/* THE ISLAND. Only the pairs it renders cross the boundary —
                  never the rows, which are server HTML (PriceMenu.tsx says
                  why). */}
              {/* THE KEY IS THE RING'S IDENTITY (G2 react, 2026-09-14). The
                island freezes the ids it watches in a useState initializer and
                has no `setIds` — deliberately, because page data on this site
                is compiled at build time (§16) and a tariff cannot change
                while a visitor reads it. The one place that is not true is the
                workbench: Storybook controls can swap one deck's categories
                for another's on a MOUNTED story, and the spy would go on
                walking ids no link carries, marking nothing. Keying the island
                by its own id list makes React remount it exactly when the ring
                would otherwise go stale — and on the real page the key never
                changes, so it costs nothing there. */}
              <PriceMenu
                key={JSON.stringify(categories.map((category) => category.id))}
                items={categories.map(({ id, name }) => ({ id, name }))}
              />
            </nav>
          </Card>
          {/* The cards column. `gap-8` between cards is the section owning its
              children's spacing (§6.4) — and it is the aura's number, see the
              header; the cards themselves own no height — each is as tall as
              its rows (ui/Card D4). */}
          <div className="flex flex-col gap-8">
            {categories.map((category) => (
              <CategoryCard key={category.id} {...category} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
