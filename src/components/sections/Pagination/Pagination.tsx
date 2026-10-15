import type { ComponentProps, ReactElement } from 'react';
import { ChevronLeft } from '@/assets/glyphs/ChevronLeft';
import { ChevronRight } from '@/assets/glyphs/ChevronRight';
import { GlyphButton } from '@/components/ui/GlyphButton/GlyphButton';
import { Text } from '@/components/ui/Text/Text';
import { cx } from '@/lib/cx/cx';

// sections/Pagination — the blog list's page navigation: back, the counter
// „1 / 2", forward, in ONE row. The owner's brief for the blog's first page
// (2026-10-11), verbatim: "create a page very much alike this
// one: https://www.infiniswiss.com/blog with navigation of pages and cards …
// remember these are just static pages, no pull from a server with assets of
// a page, but on clicking next of navigation it just pulls whole compiled
// thing from server". Its second round (2026-10-14, CLAUDE.md §15.39) gave the
// row the face it wears now, verbatim: "there below it below the last item's
// bottom right corner i'd wnat the left right button from the reviews
// carrousell implemented instae of the current buttons from curent page at
// urmator posterior as they look horrible. obviously if on last page, you
// should not be able to go from first page more to the laft, so if not
// possible gray out putton and make unusabel as it is now. between them there
// should be as now current page and max page as in ixample: "1 / 3"."
//
// ── IT IS A DUMB BAND (the PriceList shape, owner fb-459): every word arrives
// as a prop, finished — the landmark's name, the two controls' names and the
// counter's sentence, which the page formats through ICU („Pagina 2 din 3") —
// and every href arrives built, by the page's localeHref. No message key, no
// t(), no data, no 'use client': a Server Component that compiles into the
// static HTML of every blog page and ships no JavaScript (§16). The one thing
// it makes itself is the visible fraction, two numbers and a slash.
//
// ── EVERY CONTROL IS A WHOLE PAGE (§15.13, and the owner's first sentence
// above). A neighbour is a plain <a href> wearing ui/GlyphButton through
// `asChild`: a click loads the next pre-rendered document — `/ro/blog/` is
// page 1 and `/ro/blog/page/2/` page 2 — with no prefetch and no client
// routing. `rel` says which neighbour it is (prev, next), the relation HTML
// defines for a series of documents.
//
// ── THE ENDS ARE DISABLED BUTTONS, NOT MISSING LINKS (the owner: "if not
// possible gray out putton and make unusabel as it is now"). On page 1 the back
// control is a real <button type="button" disabled>, and on the last page the
// forward one: the row keeps its shape on every page, a screen reader
// announces the control as unavailable, the keyboard skips it (a disabled
// button takes no focus), and ui/GlyphButton's own disabled face greys it —
// half opacity, no pointer. Its contrast is exempt by the letter of SC 1.4.3
// and SC 1.4.11 ("part of an inactive user interface component"). It is never
// an <a> without an href: that is no control at all, and a link that goes
// nowhere would be one more stop for nothing.
//
// ── THE FACE: THE REVIEWS DECK'S DISCS. Both ends are ui/GlyphButton with
// `variant="outline" tone="accent"` and the atom's defaults — `md`, the 44px
// circle of §9's target, round, still — holding the Lucide chevrons: exactly
// what sections/ReviewsCarousel/ReviewsDeck.tsx passes its prev and next, so
// the two pairs are one look. At rest a white disc with a lavender border and
// chevron; on hover it fills lavender under a white chevron (the atom's
// two-way mirror); a press is the deep violet. No jump: neither these discs
// nor the deck's are on the owner's list of 2026-10-01, and
// tests/unit/jump-census.test.ts holds every caller to it. This file asks the
// atom for the lavender, so tests/unit/accent-census.test.ts, the census of
// who does, names it with the ground the page sets it on.
//
// ── GLYPH-ONLY, SO THE LABELS ARE NAMES (§6.6 — a changed meaning, recorded):
// until 2026-10-14 `previousLabel` and `nextLabel` were the two buttons'
// visible words; now nothing but a chevron shows, and they are the controls'
// ACCESSIBLE NAMES — ui/GlyphButton's `aria-label`, which its type requires of
// every glyph-only control (§6.3). The chevron inside is aria-hidden (the
// glyphs' default), so a screen reader says „Pagina următoare, link" and voice
// control answers to the same words. SC 2.5.3 (Label in Name) binds a VISIBLE
// text label, and there is none to match.
//
// ── THE COUNTER SPEAKS A SENTENCE. The eye reads „2 / 3"; a screen reader
// would say "two slash three", or skip the slash and say "two three". So the
// fraction is `aria-hidden` and an `sr-only` twin carries the page's sentence
// beside it — what a listener hears is „Pagina 2 din 3". (sections/DoctorStats
// moved its own twin from `sr-only` to an invisible overlay on its digits, so
// that VoiceOver's touch exploration lands on it — §15.23 round 5; the same
// overlay is the lever here if this counter ever needs it.)
//
// ── THE ARROWS NEVER MOVE BETWEEN PAGES (measured in Chromium in the real
// face, Source Serif 4's committed subset, at the counter's 16px — ui/Text's
// `text-base`). The row stands at the grid's end edge on every page (THE ROW,
// below), so its forward control never moves; the back control stands one row
// width to its left, and holds still only while that width does.
//   · The face's DEFAULT figures already share one advance — each of the ten
//     digits 8.313px (0.52em) — so „1 / 3", „2 / 3" and „3 / 3" are all
//     29.547px and the row keeps one width on every page of a list.
//     `tabular-nums` asks for exactly that, so a face whose default figures
//     are proportional would keep it too.
//   · No figure can hold a page number that GAINS A DIGIT: „9 / 12" is
//     37.859px and „10 / 12" 46.172px, and the back control would step 8.3px
//     between page 9 and page 10. So the visible fraction shares one grid
//     cell with an invisible twin, „{total} / {total}" — the widest fraction
//     this list can print — and the cell is always the twin's width, the
//     fraction centred in it (FRACTION below). Both sit inside the
//     `aria-hidden` span, and the twin is `visibility: hidden`, so it never
//     reaches a screen reader, a find in the page or a copy.
//   · `whitespace-nowrap`: a fraction never breaks at its spaces.
//
// ── THE ROW. ONE flex line — back · counter · forward, the DOM order the eye
// reads (SC 1.3.2); only an end that is a link takes focus, back before
// forward (SC 2.4.3). It HUGS its content wherever it is put (`w-fit`); where
// it stands is the parent's (§6.4): sections/PostList passes `self-end`, so
// the forward disc's edge stands on the grid's end edge, under its last
// card's bottom-right corner, on every page. `items-center` levels the
// counter's middle with the discs', and `gap-3` spaces the three cells 12px
// apart — the reviews deck's own gap between its two discs. MEASURED: 141.56 ×
// 44px at any page of a list of three (44 + 12 + 29.56 + 12 + 44 — the
// counter's cell rounds to layout's 1/64px), 158.19 × 44px at any page of a
// list of twelve. The narrowest column a page hands it is 273px (a 320 window
// behind a classic scrollbar), so the row never meets an edge and needs no
// step: the two-row shape that labels in words once required, and the
// container query that chose it, left with the words.
//
// ── THE BAND SCALE (ui/Container's paragraph of that name; CLAUDE.md §15.32).
// sections/PostList wears the band scale, so on a laptop or a desktop this row
// is drawn in the band's design pixel. The gap and the counter are theme
// lengths and follow by themselves; ui/GlyphButton's box is not — it is
// `size-[var(--disc-size,2.75rem)]`, a rem literal no remap can redraw, and
// alone among the band's lengths it would stay 44 CSS px while the cards grew
// round it. So the row sets `--disc-size` to eleven spacing steps, ALWAYS —
// sections/ClinicLocation's DISC_SIZE, the precedent and the spelling: outside
// the scale `--spacing` is the theme's 0.25rem and the disc is 2.75rem, the
// atom's own fallback to the pixel; inside it the disc is 44 design pixels
// with a 20-design-pixel chevron, and the row is the 1401 design × s: 193.38 ×
// 60.5px at a 1920 window, 115.25 × 35.67px at a 1140 one. Only the counter
// strays, by the face's optical-size axis — set narrower per em as it grows,
// 39.38px at 1920 where × s would give 40.66 — so the row stays within 0.7 %
// of × s (Pagination.scale.test.tsx measures all of it). Like the map band's
// discs, a window under the 1401 reference draws them under 44px (35.67px at
// a 1140 window), still over SC 2.5.8's 24.
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
  /**
   * The back control's ACCESSIBLE NAME, e.g. „Pagina anterioară" — never
   * shown: the control is a chevron (the header's GLYPH-ONLY, SO THE LABELS
   * ARE NAMES).
   */
  previousLabel: string;
  /**
   * The forward control's ACCESSIBLE NAME, e.g. „Pagina următoare" — never
   * shown, like the back control's.
   */
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
 * THE ROW (the header's paragraphs of that name and THE BAND SCALE): one flex
 * line hugging its content, the three cells levelled on their middles and
 * 12px apart, and the discs' size handed down as eleven spacing steps
 * (sections/ClinicLocation's DISC_SIZE, byte for byte). One whole static
 * string, because Tailwind reads class names from source text.
 */
const ROW =
  'flex w-fit items-center gap-3 [--disc-size:calc(var(--spacing)*11)]';

/**
 * The counter's <p> (the header's THE ARROWS NEVER MOVE BETWEEN PAGES):
 * figures of one width, and never a break inside the fraction.
 */
const COUNTER = 'whitespace-nowrap tabular-nums';

/**
 * The fraction and its invisible twin in ONE grid cell — `*:` places each
 * child in column 1, row 1 — so the cell is as wide as the wider of the two,
 * always the twin, and the fraction is centred in it.
 */
const FRACTION = 'grid justify-items-center *:col-start-1 *:row-start-1';

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

/**
 * One end of the row (the header's THE ENDS and THE FACE): the neighbour page
 * as a link wearing the deck's disc, or — where the list has no page on this
 * side — the same disc as a disabled button. `label` is its accessible name
 * either way; `children` is the chevron.
 */
function Neighbour({
  label,
  href,
  rel,
  children,
}: Readonly<{
  label: string;
  href: string | undefined;
  rel: 'prev' | 'next';
  children: ReactElement;
}>): ReactElement {
  if (href === undefined) {
    return (
      <GlyphButton variant="outline" tone="accent" disabled aria-label={label}>
        {children}
      </GlyphButton>
    );
  }
  return (
    <GlyphButton asChild variant="outline" tone="accent" aria-label={label}>
      <a href={href} rel={rel}>
        {children}
      </a>
    </GlyphButton>
  );
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
    // smuggled `aria-labelledby` (which would outrank it) is reset.
    <nav
      {...rest}
      aria-label={label}
      aria-labelledby={undefined}
      className={cx(ROW, className)}
    >
      <Neighbour label={previousLabel} href={previousHref} rel="prev">
        <ChevronLeft />
      </Neighbour>
      <Text className={COUNTER}>
        <span aria-hidden="true" className={FRACTION}>
          <span>
            {current} / {total}
          </span>
          <span className="invisible">
            {total} / {total}
          </span>
        </span>
        <span className="sr-only">{status}</span>
      </Text>
      <Neighbour label={nextLabel} href={nextHref} rel="next">
        <ChevronRight />
      </Neighbour>
    </nav>
  );
}
