import type { ComponentPropsWithRef, ReactElement } from 'react';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import { Card } from '@/components/ui/Card/Card';
import { Text } from '@/components/ui/Text/Text';
import { cx } from '@/lib/cx/cx';

// sections/PriceList/CategoryCard — ONE category of the tariff: the card the
// menu jumps to, holding its own heading and a description list of
// name/price rows. It lives inside the band's folder rather than beside it
// because it has exactly one consumer, PriceList, and nothing about it is
// shared (the ReviewsDeck-in-ReviewsCarousel precedent: a band's own piece
// stays in the band's folder until a second consumer exists).
//
// ── DUMB, LIKE THE BAND (owner fb-459, board §2c.1). Props in, HTML out:
// every string that arrives here is FINISHED — translated and formatted, in
// one language. No `t()`, no message key, no import of the price list, no
// `Locale` anywhere. The page is the one populator (board §1.4); this file
// could not tell Romanian from German if it tried, which is precisely what
// lets Storybook review it at every width on invented rows before the real
// tariff is verified.
//
// ── THE ROW TYPES LIVE HERE, with the component that renders them, and
// PriceList.tsx re-exports them so a page imports the whole contract from the
// band's entry file. One definition, one direction of import (PriceList →
// CategoryCard), no cycle.
//
// ── THE CARD IS THE TARGET — one element doing three jobs (board §3.5):
//   · `id` makes it the fragment the menu link points at (`#endodontics`);
//   · `aria-labelledby` → the heading's id turns the <section> into a named
//     `region`, which is what a screen reader announces on arrival;
//   · `tabIndex={-1}` is what makes that arrival AUDIBLE (board §4.2): the
//     browser runs the focusing steps on a fragment target, and a target that
//     cannot hold focus moves only the sequential focus start point — a
//     sighted keyboard user is fine, a screen-reader user hears nothing. -1 is
//     focusable-by-script-only, so the card never joins the Tab order. This is
//     the WAI skip-link technique (board §4.2). NOT the shell's `#main`, which
//     deliberately carries no tabindex (layout.tsx: a fragment jump moves the
//     sequential-focus start point natively) — a skip target is left by one
//     Tab, a category card is READ, so this tier wants the announcement the
//     focus buys and accepts the ring it costs (G2 react L1).
// ui/Card's `asChild` is what puts the surface, the inset and the @container
// context ON that <section> (Card D2 / ui/slot.ts) instead of on a wrapper div
// between the band's column and the thing being named. `aura` rides with it
// (owner 2026-09-14, the pack round: the pill's lavender glow on every card in
// this band) — it is the atom's own prop, chosen per card KIND in the section
// that composes it (fb-378/381), so no shadow utility is ever spelled here;
// what the band owes it is the `gap-8` between cards, argued in PriceList.tsx.
//
// ── `scroll-mt-10` IS THE CARD'S OWN RIDER on the shell's global
// `scroll-padding-top: 6rem` (src/styles/globals.css, the "the deepest thing a
// focusable must be scrolled clear of" block — §17.7 anchors, never line
// numbers). The global number equals the header pill's reach exactly, so a
// jumped-to card would come to rest with its top edge flush against the pill's
// bottom edge; this is the air that makes it read as "below the bar" rather
// than "glued to it". 2.5rem rather than the 1rem it shipped with on
// 2026-09-13, because the number now has a SECOND job (owner 2026-09-14): it
// is the same 2.5rem the sticky menu adds to that same 6rem reach
// (`@3xl:top-34`), so a jumped-to card's top edge and the stuck menu's top
// edge come to rest on ONE line instead of a hand's width apart. The two
// numbers are a pair — PriceList.tsx's `@3xl:top-34` paragraph carries the
// measurement they share. It is `scroll-mt-*` — margin on the TARGET — not
// more padding on the scroller, because only these elements want the extra gap.
//
// ── THE HEAD IS sections/SectionHeading (board §2c.2, owner fb-453): eyebrow
// over title, `level={2}`, the `id` on the heading element. The eyebrow is
// REQUIRED here (owner 2026-09-14: "why in categories is it only in some
// places heading + eyebrow. i want that in all of them") — the ATOM's prop
// stays optional, because a section is free to open without one; it is THIS
// band's contract that tightens, so a category whose eyebrow the owner has not
// written yet is a compile error in the data rather than a card that quietly
// reads differently from its neighbours. Precisely: a MISSING eyebrow is the
// compiler's; an EMPTY one (`''`) satisfies `string` and would reach
// SectionHeading's `{eyebrow && …}` and vanish — that case is
// tests/unit/prices-data.test.ts's (`trim().length > 0` in every locale). The outline stays h1 (the page's own
// intro) → h2 per category, one level, no gaps (§9); the eyebrow is a <p>, so
// it never enters the outline.
//
// ── THE ROWS ARE A <dl>, the Footer's opening-hours shape exactly
// (`<dl><div><dt/><dd/></div></dl>`, board §3.5, owner fb-464): each <dt> is a
// treatment and each <dd> is what it costs. The <div> wrappers are HTML5's own
// way to pair one term with one value, and they are what lets a row be a flex
// box — side by side when the card is wide, stacked when it is narrow —
// without costing the list its semantics. A <table> was the alternative and
// was declined: it would buy visible column headers and lose the reflow.
//
// ── ONE COLUMN, ALWAYS (owner 2026-09-14: "I do not like having 2 columns for
// prices. always make only one"). The wide card used to flow its rows into two
// CSS columns (board §2c.3, owner fb-463); that is reversed, and with it the
// `break-inside-avoid` each row wore to survive a column break. Nothing
// replaces them: a `<dl>` with no class of its own is a block, and a block
// stacks.
//
// ── THE ONE RESPONSIVE STEP LEFT HERE MEASURES THE CARD, never the window
// (§6.5). ui/Card marks its root `@container`, and `@sm` is read against that
// box's CONTENT width — the card minus its own 25px per side: at 24rem =
// 384px of inner width a row stops stacking. At the 390 viewport the column is
// 312px and the card's inside is ~262px, so the row stacks — name on one line,
// price under it, right-aligned — because 80-character treatment names are the
// NORMAL case here, not the exception (board §5.3), and a name sharing a line
// with its price in 262px would be a two-word column beside a number. From the
// tablet up the inside clears 384px and the pair shares a baseline-aligned
// line.
// Deliberately NO leaders (the dotted restaurant-menu rule): two shorter lines
// beat one long dotted one, and the row rule already pairs name with price.
// THE RULE RIDES EACH ROW (`border-b` on the pair), not the list (`divide-y`):
// `divide-y` draws BETWEEN children and so skips the last one, leaving the
// list hanging open under its final price. One rule under every pair closes it
// like a printed tariff. (That difference was first measured against the
// two-column flow, where column one ended with a rule and column two without
// it — builder B, 1536; the flow is gone, the reason survives it.)
//
// ── THE PRICE'S THREE UTILITIES, one reason each: `text-end` puts the number
// on the row's end edge in the logical spelling (§3), `tabular-nums` makes
// every digit the same width so consecutive four-digit prices line up as a
// column, and `hyphens-none` opts the number out of the body's site-wide
// `hyphens: auto` (§15.14) so „1.300 RON" can never break across lines.
// `shrink-0` keeps the number whole when a long name pushes at it.
//
// No 'use client', no hook, no state, no handler: this compiles into the
// static HTML of the services page and ships zero bytes of JavaScript (§16).
// The band's ONE island is the menu list (sections/PriceList/PriceMenu), and
// PriceList.test.tsx pins the directive's absence from this file's source
// text, because no runtime assertion can see one.

/** One priced treatment. Both strings arrive FINISHED (§8.1) — the name in the
 *  visitor's language, the price already formatted with its unit word. `id` is
 *  the row's stable key inside its category, never rendered. */
export type PriceRowProps = Readonly<{
  id: string;
  name: string;
  price: string;
}>;

/** One category of the tariff: the fragment id the menu points at, the name
 *  that is BOTH the menu label and the card's heading (one short word, board
 *  §3.3), the eyebrow above it — required in this band, see the head
 *  paragraph — and its rows. */
export type PriceCategoryProps = Readonly<{
  id: string;
  name: string;
  eyebrow: string;
  rows: readonly PriceRowProps[];
}>;

export type CategoryCardProps = PriceCategoryProps &
  // The native <section> surface minus what this component owns (§6.8
  // fidelity, the PersonnelCard/ReviewCard Omit idiom). `children` goes
  // because content arrives as `rows` — without the Omit a caller could nest
  // something, type-check, and watch it vanish. The three NAMING attributes go
  // because the card's name is its heading's text alone: a caller's
  // `aria-labelledby` would silently replace the pair, an `aria-label` would
  // silently win over it, and a `title` would add a tooltip nobody asked for —
  // all three better refused by the types than resolved by attribute order.
  Omit<
    ComponentPropsWithRef<'section'>,
    | keyof PriceCategoryProps
    | 'children'
    | 'aria-label'
    | 'aria-labelledby'
    | 'title'
    // …and the FOCUS half of the trio: the render pins `tabIndex={-1}` (the
    // fragment target must be focusable-by-script only), so a caller's value
    // would type-check and vanish — refused here like the naming attributes.
    | 'tabIndex'
  >;

export function CategoryCard({
  id,
  name,
  eyebrow,
  rows,
  className,
  ...rest
}: CategoryCardProps): ReactElement {
  // Derived, not generated: the band needs no id of its own here, and a
  // useId() pair would make the fragment link unguessable — the whole point of
  // `id` being a prop is that a link elsewhere can point at it (board §4.4:
  // /ro/services/#endodontics is a URL you can paste into WhatsApp).
  const headingId = `${id}-title`;

  return (
    <Card asChild aura>
      {/* The <section> IS the card: surface, inset and the @container context
          land on the element that is also the fragment target and the named
          region. `{...rest}` rides FIRST so a caller's stray attribute can
          never replace the id/name/focus trio the jump depends on; className
          is merged caller-last (§6.8 — placement only, the atom's own classes
          arrive through ui/slot.ts before it). */}
      <section
        {...rest}
        id={id}
        aria-labelledby={headingId}
        tabIndex={-1}
        className={cx('scroll-mt-10', className)}
      >
        <SectionHeading
          level={2}
          id={headingId}
          eyebrow={eyebrow}
          title={name}
        />
        <dl>
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-1 border-b border-line-subtle py-2 @sm:flex-row @sm:items-baseline @sm:justify-between @sm:gap-4"
            >
              <Text as="dt">{row.name}</Text>
              <Text
                as="dd"
                tone="strong"
                className="shrink-0 text-end tabular-nums hyphens-none"
              >
                {row.price}
              </Text>
            </div>
          ))}
        </dl>
      </section>
    </Card>
  );
}
