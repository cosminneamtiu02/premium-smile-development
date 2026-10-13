import type { ComponentProps, ReactElement } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Text } from '@/components/ui/Text/Text';
import { cx } from '@/lib/cx/cx';

// sections/Pagination — the blog index's page navigation: back at the start,
// the counter „2 / 3" in the middle, forward at the end. The owner's brief
// (2026-10-11), verbatim: "create a page very much alike this
// one: https://www.infiniswiss.com/blog with navigation of pages and cards …
// remember these are just static pages, no pull from a server with assets of
// a page, but on clicking next of navigation it just pulls whole compiled
// thing from server". The reference's row, measured by the planner: "Previous"
// at the start, greyed out on page 1; the counter „1 / 7" centred; a solid
// "Next" at the end.
//
// ── IT IS A DUMB BAND (the PriceList shape, owner fb-459): every word arrives
// as a prop, finished — the landmark's name, the two labels and the counter's
// sentence, which the page formats through ICU („Pagina 2 din 3") — and every
// href arrives built, by the page's localeHref. No message key, no t(), no
// data, no 'use client': a Server Component that compiles into the static HTML
// of every blog page and ships no JavaScript (§16). The one thing it makes
// itself is the visible fraction, two numbers and a slash.
//
// ── EVERY CONTROL IS A WHOLE PAGE (§15.13, and the owner's own sentence above).
// A neighbour is a plain <a href> wearing ui/Button through `asChild`: a click
// loads the next pre-rendered document — `/ro/blog/` is page 1 and
// `/ro/blog/page/2/` page 2 — with no prefetch and no client routing. `rel`
// says which neighbour it is (prev, next), the relation HTML defines for a
// series of documents.
//
// ── THE ENDS ARE DISABLED BUTTONS, NOT MISSING LINKS (the reference's greyed
// Previous). On page 1 the back control is a real <button type="button"
// disabled>, and on the last page the forward one: the row keeps its shape on
// every page, a screen reader announces the control as unavailable, the
// keyboard skips it (a disabled button takes no focus), and ui/Button's own
// disabled face greys it — half opacity, no pointer. Its contrast is exempt by
// the letter of SC 1.4.3 ("part of an inactive user interface component"). It
// is never an <a> without an href: that is no control at all, and a link that
// goes nowhere would be one more stop for nothing.
//
// ── THE FACE: ui/Button's lavender solid family at the `md` size — 44px
// tall, the §9 target — the site's lilac controls (§15.30). No jump: these
// buttons are not on the owner's list of 2026-10-01, and
// tests/unit/jump-census.test.ts holds every caller to it. This file asks the
// atom for the lavender, so tests/unit/accent-census.test.ts, the census of
// who does, must name it with the ground the page sets it on (each face
// paints its own ground; what the band's ground meets is the face's edge).
//
// ── THE COUNTER SPEAKS A SENTENCE. The eye reads „2 / 3"; a screen reader
// would say "two slash three", or skip the slash and say "two three". So the
// fraction is `aria-hidden` and an `sr-only` twin carries the page's sentence
// beside it — what a listener hears is „Pagina 2 din 3". (sections/DoctorStats
// moved its own twin from `sr-only` to an invisible overlay on its digits, so
// that VoiceOver's touch exploration lands on it — §15.23 round 5; the same
// overlay is the lever here if this counter ever needs it.) The <p> is
// ui/Text, and it is centred ON THE ELEMENT (§15.15 b).
//
// ── THE ROW, AND WHERE IT GIVES WAY (measured in Chromium in the real face,
// Source Serif 4, 2026-10-11). The nav is its own size container, so the row
// reads the width it actually has wherever a page puts it.
//   · FROM 20rem OF NAV (`@xs`, Tailwind's named step) it is the reference's
//     ONE ROW: three tracks, the outer two equal shares and the middle as wide
//     as the counter, so the counter sits on the row's centre line and each
//     control at its own end.
//   · UNDER IT the row cannot hold. A label at the md face is its text plus
//     2.5rem of padding: „Anterior" 110.6px, „Următor" 111.0px, the counter
//     „1 / 3" 29.6px, and two 1rem gaps — 283.2px for the row, 299.8px with a
//     two-digit counter. A 320px window gives the column 288px, and only 273px
//     behind a classic scrollbar (Windows, and macOS with a mouse — so the
//     reflow case WCAG names, a desktop at 400 %, is the 273), where the row
//     would push the page 10px sideways (§7). The two-word stress labels,
//     „Pagina anterioară" and „Pagina următoare", need 315.5px even with each
//     label broken onto two lines. So below the step the row becomes TWO: the
//     controls side by side, the counter centred on its own line under them.
//     Each control shares its line at its narrowest (a label breaks between
//     words, never inside one — ui/Button's `hyphens-none`) and grows back up
//     to its natural width when the line has room; were even the two
//     narrowest controls too wide for one line (the stress pair below a ~270px
//     column), the forward control drops under the back one, still at its own
//     end.
//   · THE ORDER: the DOM keeps back → counter → forward, the reference's
//     reading order, and only the two-row picture shows the counter last. Only
//     the two controls take focus and their order never changes (SC 2.4.3);
//     the counter's place in the sequence carries no meaning to lose (SC
//     1.3.2).
//   · IN THE ONE ROW the counter is the last thing to give: the controls
//     shrink to their narrowest first, and only then may the counter break at
//     its spaces — a two-digit counter beside the stress pair between a 320
//     and a 332px nav — never the page scroll sideways.
//   · Every length is the theme's (rem), so a larger default font size and
//     browser zoom move the step together with the labels it was measured
//     against. (Inside a band that wears ui/Container's THE BAND SCALE the
//     labels are drawn in design pixels, but that scale starts at a 56rem
//     column, far past this step.)
//
// ── THE BELT. The page builds the hrefs and the band refuses a set that
// contradicts itself — a page number that is not a whole number from 1, a
// page past the last, a back link on page 1 or a missing one after it, a
// forward link on the last page or a missing one before it, an empty href —
// with a RangeError that names the field, at render, which on this site is
// `next build` (DoctorStats' countFrames is the precedent for a named
// refusal). A link that is there when it should not be, or missing when it
// should be there, is a broken page the visitor would otherwise find first.

type PaginationOwnProps = Readonly<{
  /**
   * The navigation landmark's accessible name, e.g. „Paginile articolelor" —
   * the shipped `blog.pagination.label` (G2 react, 2026-10-14: this example
   * and the suites' fixtures once spelled another name than the page ships).
   * Finished text (§8.1), and never containing the role's own word: a screen
   * reader already says "navigation".
   */
  label: string;
  /** The page this is, counted from 1. */
  current: number;
  /** How many pages there are. ONE page renders NOTHING — no landmark at all. */
  total: number;
  /**
   * The counter as the ear hears it, e.g. „Pagina 2 din 3" — the page formats
   * it through ICU. The eye reads the fraction „2 / 3" instead (the header's
   * THE COUNTER SPEAKS A SENTENCE).
   */
  status: string;
  /** The back control's visible label, e.g. „Anterior" — and its name. */
  previousLabel: string;
  /** The forward control's visible label, e.g. „Următor" — and its name. */
  nextLabel: string;
  /**
   * Page `current − 1`, built by the page (localeHref). ABSENT on page 1,
   * where the back control renders disabled, and REQUIRED on every later
   * page — the belt refuses either mistake.
   */
  previousHref?: string;
  /**
   * Page `current + 1`, built by the page (localeHref). ABSENT on the last
   * page, where the forward control renders disabled, and REQUIRED before it
   * — the belt refuses either mistake.
   */
  nextHref?: string;
}>;

export type PaginationProps = PaginationOwnProps &
  // The native <nav> surface, minus the band's own props, minus `children`
  // (the band renders its own three cells) and minus the two ARIA naming
  // attributes: the landmark's name is `label`, and a caller's pair would
  // replace it. The Omit alone does not refuse a hyphenated attribute written
  // in JSX — TypeScript exempts those from its excess-property check — hence
  // THE BELT on the <nav> below (sections/TeamRoster's precedent). className
  // is merged last, for placement (§6.8). React 19 carries `ref` inside these
  // props.
  Omit<
    ComponentProps<'nav'>,
    keyof PaginationOwnProps | 'children' | 'aria-label' | 'aria-labelledby'
  >;

/**
 * THE ROW (the header's THE ROW, AND WHERE IT GIVES WAY): below the nav's
 * `@xs` step a wrapping flex line — the two controls, then the counter on a
 * line of its own; from it the reference's three tracks, the counter's in the
 * middle. `items-center` aligns the cells' middles in both shapes, `gap-4`
 * spaces them (§6.4: the band owns its children's spacing). One whole static
 * string, because Tailwind reads class names from source text.
 */
const ROW =
  'flex flex-wrap items-center gap-4 @xs:grid @xs:grid-cols-[1fr_auto_1fr]';

/**
 * A control's placement, the same in both shapes. `flex-1` with `max-w-max`:
 * on the two-row line each control asks for its narrowest width when the line
 * is shared out, then grows back toward its natural width, never past it; in
 * a grid track the same cap keeps the face as wide as its label rather than
 * its track (a stretched item held by its max-width sits at the track's
 * start), which is all the back control needs — it is first in both shapes.
 * The forward control's auto start margin pushes it to the end: of the flex
 * line, and of its track, as an auto margin on a grid item does. Placement
 * only (§6.8): the face is ui/Button's.
 */
const PREVIOUS = 'flex-1 max-w-max';
const NEXT = 'ms-auto flex-1 max-w-max';

/**
 * The counter's <p>: centred on the element (§15.15 b); under the step a
 * line of its own, after the controls (`order-last basis-full`); from it back
 * in the middle track (`@xs:order-none` — `order` also steers a grid's
 * placement).
 */
const COUNTER = 'order-last basis-full text-center @xs:order-none';

/** A number the way a refusal prints it: `-0` spelled, never "0" (countFrames' lesson). */
function shown(value: number): string {
  return Object.is(value, -0) ? '-0' : String(value);
}

/**
 * THE BELT (the header's paragraph). Throws a RangeError naming the first
 * thing the props get wrong; returns nothing when they agree.
 */
function refuseInconsistent(
  current: number,
  total: number,
  previousHref: string | undefined,
  nextHref: string | undefined,
): void {
  if (!Number.isInteger(total) || total < 1) {
    throw new RangeError(
      `Pagination: total must be an integer ≥ 1, got ${shown(total)}`,
    );
  }
  if (!Number.isInteger(current) || current < 1) {
    throw new RangeError(
      `Pagination: current must be an integer ≥ 1, got ${shown(current)}`,
    );
  }
  if (current > total) {
    throw new RangeError(
      `Pagination: current must not pass total, got page ${current} of ${total}`,
    );
  }
  if (current === 1 && previousHref !== undefined) {
    throw new RangeError(
      `Pagination: page 1 has no previous page, got previousHref "${previousHref}"`,
    );
  }
  if (current > 1 && previousHref === undefined) {
    throw new RangeError(
      `Pagination: page ${current} of ${total} needs a previousHref`,
    );
  }
  if (current === total && nextHref !== undefined) {
    throw new RangeError(
      `Pagination: page ${current} of ${total} is the last, got nextHref "${nextHref}"`,
    );
  }
  if (current < total && nextHref === undefined) {
    throw new RangeError(
      `Pagination: page ${current} of ${total} needs a nextHref`,
    );
  }
  if (previousHref === '' || nextHref === '') {
    throw new RangeError(
      `Pagination: an empty href on page ${current} of ${total} would reload the page it is on`,
    );
  }
}

export function Pagination({
  label,
  current,
  total,
  status,
  previousLabel,
  nextLabel,
  previousHref,
  nextHref,
  className,
  ...rest
}: PaginationProps): ReactElement | null {
  refuseInconsistent(current, total, previousHref, nextHref);

  // One page: nothing to page through, so no landmark at all (the belt has
  // already refused anything under one).
  if (total === 1) return null;

  return (
    // THE BELT ON THE NAME: `{...rest}` rides FIRST and the band's own name
    // after it, so a smuggled `aria-label` cannot rename the landmark and a
    // smuggled `aria-labelledby` (which would outrank it) is reset. `@container`
    // makes the nav the box the row measures; `w-full` keeps that box the
    // width of its parent even inside a flex or grid that sizes children to
    // their content, where a size container would collapse to nothing.
    <nav
      {...rest}
      aria-label={label}
      aria-labelledby={undefined}
      className={cx('@container w-full', className)}
    >
      <div className={ROW}>
        {previousHref === undefined ? (
          <Button
            variant="solid"
            tone="accent"
            size="md"
            disabled
            className={PREVIOUS}
          >
            {previousLabel}
          </Button>
        ) : (
          <Button
            asChild
            variant="solid"
            tone="accent"
            size="md"
            className={PREVIOUS}
          >
            <a href={previousHref} rel="prev">
              {previousLabel}
            </a>
          </Button>
        )}
        <Text className={COUNTER}>
          <span aria-hidden="true">
            {current} / {total}
          </span>
          <span className="sr-only">{status}</span>
        </Text>
        {nextHref === undefined ? (
          <Button
            variant="solid"
            tone="accent"
            size="md"
            disabled
            className={NEXT}
          >
            {nextLabel}
          </Button>
        ) : (
          <Button
            asChild
            variant="solid"
            tone="accent"
            size="md"
            className={NEXT}
          >
            <a href={nextHref} rel="next">
              {nextLabel}
            </a>
          </Button>
        )}
      </div>
    </nav>
  );
}
