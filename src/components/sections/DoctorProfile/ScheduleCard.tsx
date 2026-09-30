import { useId, type ComponentPropsWithRef, type ReactElement } from 'react';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import { Card } from '@/components/ui/Card/Card';
import { Text } from '@/components/ui/Text/Text';
import type { HoursRow } from '@/lib/hours/hours';

// sections/DoctorProfile/ScheduleCard — the doctor's own week: a white card on
// the band's lavender, opened by its own title and holding one printed row per
// day, Monday → Sunday. MOVED here in round 2 of the
// doctor-pages run (.claude/section-runs/2026-09-21_11-58_doctor-pages/round2 —
// the ledger's D13 dropped the DoctorTeam band that first hosted it, and D14
// seats it beside the „Despre" prose). It lives INSIDE the band's folder
// because it has exactly one consumer, DoctorProfile, and nothing about it is
// shared (the CategoryCard-in-PriceList and ReviewsDeck-in-ReviewsCarousel
// precedent: a band's own piece stays in the band's folder until a second
// consumer exists). Exported all the same, so the tests can mount it alone.
//
// ── D14 · THE CARD WEARS ui/Card's `framed` ROW (round 2e, owner: "switch the
// card with schedule from the current one with the one with the non current
// review, the one with border") — the reviews deck's IDLE card: the 3px
// `--card-tint` frame on `bg-surface`, the same face the credo card in the
// opener wears (DoctorIntro's CredoCard, D12), so the doctor page's two cards
// are one kind. It shipped as the flat `surface` row from round 2 to round 2d
// ("the current one, but white"); the owner then asked to try the frame.
// Choosing a tone is the section's job (fb-378/381); spelling a colour would
// be restyling an atom's internals (§6.8). MEASURED on the band's 30 % tint
// (rgb 212 207 220): the frame's `--card-tint` is the accent at 20 % over the
// SURFACE — rgb(229 228 236), LIGHTER than the ground it sits on, 1.1:1 — so
// the 3px frame reads as a pale halo around the white card rather than as a
// dark line; the white ground (1.5:1) is still the edge the eye finds. A
// decorative boundary, not a UI component (nothing here is interactive), so
// SC 1.4.11 does not bind; the grouping is carried by the region's name and
// heading, which is what a screen reader navigates by.
// No `aura`: the glow is the PriceList band's per-card decision, and one
// framed card on a tinted band already separates itself.
//
// ── THE CARD IS A NAMED REGION, the CategoryCard idiom exactly: `ui/Card
// asChild` puts the surface, the inset and the `@container` context ON the
// <section> this file chose, so nothing sits between the band's grid and the
// element being named. `aria-labelledby` → the heading's id is what turns a
// bare <section> into a `region` in the accessibility tree, which is how a
// screen-reader user finds the timetable without reading the prose first.
// NO `tabIndex={-1}` here, unlike CategoryCard: that card is a FRAGMENT TARGET
// a menu link jumps to and its focus is what makes the arrival audible. This
// card is nobody's jump target; adding the attribute would buy an announcement
// no link triggers and cost a focus ring nobody asked for.
//
// ── THE HEADING IS AN <h2> THROUGH sections/SectionHeading — the TITLE ALONE,
// at level 2 (D14, as amended by D37). It is the SIBLING of the „Despre" h2
// beside it, not its child: the prose and the schedule are two halves of one
// band and neither owns the other, so the page's outline reads h1 (the doctor,
// sections/DoctorIntro) → h2 (about) → h2 (schedule), one level, no gaps
// (§9). In round 1 this card was an <h3> among two PersonnelCard tiles under
// the DoctorTeam band's h2; that band is gone (D13), and an h3 with no h2 of
// its own would now skip a level. The LEVEL is fixed, deliberately not an axis
// (§6.6): the band that composes this card is the band that owns the outline.
// D37 · NO EYEBROW (owner, 2026-09-26, round 2g: "remove the Program line from
// the program section"). Round 2e had renamed the pair to „Program" over „Când
// mă găsiți la clinică" (D26), and the mono kicker then said, in one word, what
// the title under it says in a sentence; the owner struck the line. The prop is
// GONE, not made optional: a prop no caller passes is public API that costs
// review, tests and compatibility forever (SectionHeading's fb-300 YAGNI
// paragraph), and a card that could still grow an eyebrow on one page and not
// on another would read two ways. SectionHeading's own `eyebrow?` contract is
// what makes the omission clean — omitted, it renders NO row at all, never an
// empty <p> (a stray stop for a screen reader, a phantom child for the flex
// gap) — so the opener is the <h2> alone inside its wrapper, and the prose
// half's eyebrow beside it is the only one left in the band.
// Round 1's `hyphens-none` on the title does not survive the move, and on
// purpose: SectionHeading owns the heading element and exposes no class seam
// to it, so the title inherits the site-wide `hyphens: auto` (§15.14) —
// deliberately, as its words are ordinary words; the biography's title beside
// it opts out because it carries a person's name (DoctorProfile's THE NAME IS
// NEVER SPLIT comment). The title is a short sentence now („Când mă
// găsiți la clinică", „Wann Sie mich in der Praxis finden"), and it WRAPS
// between words in the card's content box — the card's ONE width, 20rem (the
// band's D53), less 2 × 25px of frame and inset, 270px — to two lines at the
// `band` step (30px in this card), and narrower only on a phone, whose column
// is under 20rem (206px at 320), where the Romanian title does break once at a
// syllable („gă-siți", measured 2026-09-30) — ordinary words, which §15.14
// allows; only a person's name is never split, and there is none here.
// The id comes from React's useId(), which is server-safe and
// hydration-stable, so two schedules on one page can never collide; it rides
// SectionHeading's `id` prop, which lands it on the HEADING and never on the
// opener's wrapper (SectionHeading's id paragraph) — the region's name is
// therefore the title alone, exactly as it was while an eyebrow still sat above
// it (D37 changed what the card shows, not what it is called). A caller's own
// `id` lands on the <section> through the spread and never touches the name
// pair (the PersonnelCard precedent, pinned in both suites).
//
// ── THE WEEK IS A <dl>, IN THE FOOTER's OWN RECIPE (COLUMN 4 · OPENING
// HOURS), copied because it is the same data in the same shape: each <dt> is a
// day and each <dd> is what happens on it. The <div> wrappers are HTML5's own
// way to pair one term with one value, and they are what lets a row be a
// baseline-justified flex box without costing the list its semantics.
// CLOSED DAYS RECEDE BY TOKEN, never by opacity — the Footer's reasoning
// verbatim: `--ink-muted` is a measured 7.35:1 on the surface, while an
// opacity multiplier lands wherever the stack happens to put it (§9). The tone
// is COMPUTED HERE and worn by each element, because ui/Text emits its ink
// explicitly (its D4), so the wrapper keeps layout only.
// `tabular-nums` on the value so 09:00 and 12:00 line up as a column, and
// `text-end` in the logical spelling (§3) so the hours sit on the row's end
// edge.
// THE RULE CAME AND WENT: round 2c put the price menu's line under the
// heading ("a thin line like there is already in the project below heading and
// above effective schedule"), round 2e struck it ("remove thin line") — the
// <dl> carries no border now, and the band's own test again forbids a border
// anywhere in it.
// THE WEEK IS CENTRED IN ITS CARD, AND SO IS THE OPENER (owner, round 2c:
// "schedule centered in its section"; round 2e: "it should be centered in the
// section with equal space left and right in the section … make the schedule
// a bit broader" — and the card IS the <section>): the `<dl>` is a two-column
// GRID, `grid-cols-[auto_auto] justify-center`, so the days column and the
// hours column are each as wide as their longest entry and the pair sits
// centred as one block whatever the card's width — `gap-x-10` (40px, up from
// 24 in round 2c) is the "bit broader" between the two columns; and
// SectionHeading takes `align="center"`, so the title sits on the same centre
// line as the week (round 2e centred an eyebrow with it; D37 struck the
// eyebrow) and the card's content has equal air left and right instead of a
// left-bound title over a centred block. The `<div>`
// pairs are `display: contents` (`contents`), which keeps HTML5's term/value
// pairing in the DOM while the grid places the <dt> and <dd> directly; a <div>
// carries no role, so the one `display: contents` accessibility caveat
// (elements WITH semantics losing them in older WebKit) does not apply.
// `items-baseline` on the grid keeps each day and its hours on one baseline.
// THE 24rem CAP IS GONE with the reason for it: G2 a11y F4 capped a
// full-width `<dl>` whose day was pinned to one edge and hours to the other;
// a content-sized block is never wider than its longest day plus its longest
// hours plus `gap-x-10` (~220px), so day and hours share one magnifier window
// by construction.
//
// ── DUMB, LIKE THE BAND (run D1). Props in, HTML out: every string that
// arrives here is FINISHED — translated and formatted, in one language. No
// t(), no message key, no import of lib/clinic, no `Locale` anywhere. The one
// lib specifier is `import type { HoursRow }` — the ROW SHAPE from a MECHANICS
// module (§4's foundation ring), which erases to nothing at build time. This
// file never calls the formatter: the page does, and hands the rows over.
//
// ── ZERO ISLANDS (§16). No 'use client', no state, no ref and no handler;
// useId is the only hook and it is server-safe, so this card compiles into the
// doctor page's static HTML and ships zero bytes of JavaScript.
// ScheduleCard.test.tsx pins the directive's absence and the whole import
// surface from the source text, because no runtime assertion can see either.
//
// ── THE CARD OWNS NO WIDTH AND NO OUTER MARGIN (§6.4). Its place in the band
// — the second track of the band's ONE row and `@3xl:self-center` (D37: its
// vertical middle on the band's; one row since the G2-R2 review's a11y F2
// made the biography beside it a region, DoctorProfile's D37 paragraph) —
// and, since round 2k, its ONE width (D53:
// `w-full max-w-80 mx-auto`, 20rem centred wherever the column allows, inside
// an exact 20rem track at the step) arrive as the band's className, merged
// caller-last by ui/slot.ts: a width is a placement decision, so the band that
// owns the grid owns it, and this card stays mountable at any width on its
// own. The card's height stays its own: centring is the band's decision about
// WHERE the card sits, never a stretch of the card.

type ScheduleCardOwnProps = Readonly<{
  /** The card's title, finished and already translated (§8.1) — „Când mă
   *  găsiți la clinică". Becomes the real <h2>, the card's ONLY heading row
   *  (D37 struck the eyebrow above it — there is no `eyebrow` prop), and,
   *  through aria-labelledby, the region's accessible name. */
  title: string;
  /**
   * One printed line per day, already formatted by `lib/hours` in the
   * visitor's language: seven of them, Monday → Sunday, closed days in their
   * calendar place. `readonly` because this card only ever reads them.
   */
  rows: readonly HoursRow[];
}>;

export type ScheduleCardProps = ScheduleCardOwnProps &
  // The native <section> surface minus what this component owns (§6.8
  // fidelity, the CategoryCard/PersonnelCard Omit idiom). `children` goes
  // because content arrives as `title`/`rows` — without the Omit a caller
  // could nest something, type-check, and watch it vanish. (`eyebrow` needs
  // no Omit: it is no native attribute, so since D37 a caller still handing
  // one over fails as an excess property rather than landing on the DOM.)
  // `title` leaves the native side with the own props: here the word means the
  // heading's text, not HTML's tooltip. The two ARIA naming attributes go
  // because the region's name is its heading's text ALONE: a caller's
  // `aria-labelledby` would land after the component's own and silently
  // replace the pair, while an `aria-label` would silently win over it — both
  // better refused by the types than resolved by attribute order.
  Omit<
    ComponentPropsWithRef<'section'>,
    keyof ScheduleCardOwnProps | 'children' | 'aria-label' | 'aria-labelledby'
  >;

export function ScheduleCard({
  title,
  rows,
  className,
  ...rest
}: ScheduleCardProps): ReactElement {
  const headingId = useId();

  return (
    <Card tone="framed" asChild>
      {/* The <section> IS the card (Card D2 / ui/slot.ts): the surface, the
          inset and the @container context land on the element that is also the
          named region. `{...rest}` rides FIRST so a caller's stray attribute
          can never replace the name pair; className is merged caller-last by
          the slot engine (§6.8 — placement only). */}
      <section {...rest} aria-labelledby={headingId} className={className}>
        {/* The title ALONE — no eyebrow (D37), so SectionHeading renders no
            kicker row at all: the <h2> is its wrapper's one child. */}
        <SectionHeading level={2} id={headingId} title={title} align="center" />
        {/* The centred two-column week — see the header's THE WEEK IS CENTRED
            paragraph (the round-2c rule under the heading is gone, 2e). */}
        <dl className="grid grid-cols-[auto_auto] items-baseline justify-center gap-x-10 gap-y-1">
          {rows.map((row) => {
            // Computed HERE and worn by both halves of the pair — see the
            // header's closed-days paragraph.
            const tone = row.closed ? 'muted' : 'default';
            return (
              <div key={row.label} className="contents">
                <Text as="dt" tone={tone}>
                  {row.label}
                </Text>
                <Text as="dd" tone={tone} className="text-end tabular-nums">
                  {row.value}
                </Text>
              </div>
            );
          })}
        </dl>
      </section>
    </Card>
  );
}
