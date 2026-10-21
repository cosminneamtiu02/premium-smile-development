import type { ComponentPropsWithRef, ReactElement } from 'react';
import {
  PostPhoto,
  type PostPhotoImage,
} from '@/components/sections/PostPhoto/PostPhoto';
import { cx } from '@/lib/cx/cx';
import {
  hasVisibleText,
  hasVisibleWord,
  spelled,
} from '@/lib/visible-text/visible-text';

// sections/BeforeAfter — a before/after pair inside a blog article: two blog
// photos, THE LINE between them — the faint lilac thread that also runs down
// the left of the article's closing words (sections/PostConclusion). The
// owner, verbatim (2026-10-14): "as another section i will want a before and
// after separated by the same line that will be osed in the section described
// with the doctor conclusion. left of the line will be a heading left oriented
// an with a photo with nice round cornrs as it is now on the current blog
// page" — and (2026-10-15): "now this section with before and after is to be
// derived from another section which is just like a "blog image section" …
// now i want you t refactor it as 2 section as the blog photo and then blog
// photo turns into a before and after section. do not rework nothing yet on
// phone." — and minutes later: "also add every instantiation possible of a
// inainte and dupa wher eboth left and right must be same instance of blog
// image, so no inaitnte with note and dupa without note and here headings
// sould be replaceble, not mandatory before and after and here headings should
// also be optional".
//
// ── TIER: THE SHARED-COMPOSITION SUB-KIND (§4) — DUMB PROPS-IN. It composes
// another section's PUBLIC component, sections/PostPhoto, once per half (§4:
// a section may compose another's public component, never its internals),
// binds no site data and calls no t(): the pictures, the headings and the
// notes arrive FINISHED (§8.1) — every note with its lead-in already written
// by the route („Notă: …", „Hinweis: …"). The article page maps an article's
// before/after block (lib/blog-article) onto `images`, `headings` and
// `notes`, and sections/PostPage places the pair in the article's 42rem
// measure. Reuse never promotes a composite (§4).
//
// ── EACH HALF IS A BLOG PHOTO — sections/PostPhoto, whole: a <figure>
// captioned by its heading (the <figcaption>, ui/Heading's `subhead` step,
// start-aligned, never hyphenated, over the picture — the figure's name
// under HTML-AAM's rule, which Chromium 151 does not apply: PostPhoto's THE
// HEADING), the picture in its 4:3 box with ui/Image's framed corner, and
// the grey note under it — PostPhoto's THE HEADING, THE PICTURE and THE
// NOTE. Not one of those recipes is spelled here; this section owns THE PAIR
// IS ONE SHAPE, THE LAYOUT, THE PICTURES STAY LEVEL, THE LINE and the halves'
// `sizes`, and nothing else. The captions' LOOK is an OPEN OWNER QUESTION —
// four of the demo article's six captions are these halves' — recorded with
// its two roads in PostPhoto's THE CAPTION'S LOOK.
//
// ── THE PAIR IS ONE SHAPE — the owner's "both left and right must be same
// instance of blog image". The props are grouped BY PART, never by half:
// `images`, and `headings` and `notes` only when the pair has them, each a
// BeforeAfterPair — the before first. So a heading over one half alone, or a
// note under one half alone, cannot even be written, and there are exactly
// four instances: headings and notes, headings alone, notes alone, neither.
// The headings are any words — „Înainte" / „După" as often as not, „Ianuarie"
// / „Aprilie" as well: "replaceble, not mandatory before and after".
// THE HOLES the types leave are strings that SHOW nothing — for a heading, no
// word — and halves that are no strings at all. PostPhoto prints nothing for
// an EMPTY string (its ABSENT OR EMPTY, NOTHING), so `{ before: 'Înainte',
// after: '' }` would print a heading over one half alone; and since round 2
// of lib/visible-text's review (2026-10-21, PostPhoto's AND PRESENT, IT
// SHOWS) it REFUSES any other string a half cannot stand behind — a heading
// with no letter or digit that shows, a note that shows nothing — with a
// RangeError that names ONE picture. So this section asks the same of
// the PAIR first, and refuses it in its own words, naming the pair: what a
// heading must show is lib/visible-text's `hasVisibleWord`, a letter or a
// digit outside its THE UNSEEN SET — „." or „…" over a picture is a caption
// that names nothing (SC 2.4.6), refused like a blank one (round 2 of
// lib/visible-text's review, 2026-10-21: until then a heading was asked
// `hasVisibleText` alone here, and a pair headed „." and „…" passed, to fail
// in PostPhoto under one picture's name) — and what a note must show is its
// `hasVisibleText`, any character outside the set (white space, the controls,
// Unicode's default-ignorable characters, the braille blank): the tests the
// blog's words are held to, by its parsers at build, by this section,
// sections/PostProse and sections/PostPhoto at render, and by the CMSR scan
// and lib/share beside them. Until the round-2 review (2026-10-20) this file
// counted white space and FORMAT characters as showing nothing, which let a
// Hangul filler and a variation selector pass as words — the typescript
// review measured both. So a part the pair HAS shows a word (the headings)
// or text (the notes) on both halves, or is EMPTY on both — the part absent
// from both, PostPhoto printing nothing for either; and the halves' row count
// follows (THE PICTURES STAY LEVEL's spans): a part that shows on both is one
// row for each. Anything else is refused at render, which on this site is
// `next build`, NAMING THE PAIR by its before picture's path — an article may
// hold four pairs, and two blank halves quote nothing that says which
// (sections/Pagination's THE BELT is the precedent) — and quoting both
// halves' words, every character a reader would not see in them spelled by
// its code point and a half that is no string named by its type
// (lib/visible-text's `spelled`: `"\u{200B}"`, `undefined`): a TypeError for
// a half that is no string at all — JavaScript's convention for a value of
// the wrong type, the split sections/PostProse makes — and a RangeError for
// an empty half beside words, a blank one, two blank halves or a heading of
// marks alone. A broken pair fails the build instead of reaching a reader.
//
// ── THE LAYOUT, CONTAINER-RELATIVE (§6.5). The root is its own `@container`
// — a box cannot query itself, so the grid is its one child — and the grid
// asks the root's width, never the window's:
//   · below the root's `@lg` (32rem, 512px) ONE COLUMN: the before half, the
//     line LYING DOWN across the column, the after half;
//   · from it THREE TRACKS — before | the line STANDING | after — spelled
//     `minmax(0,1fr) auto minmax(0,1fr)`: the two halves are equal shares of
//     what the line and its air leave (a zero floor, so a long heading word
//     can never push a half open), and the middle track is as wide as the line
//     itself (the fr tracks take every free pixel, so the `auto` track never
//     stretches).
// 1.5rem of air on both sides of the line, in both arrangements (`gap-6` —
// the air PostConclusion leaves beside the same line, so the thread stands
// the same distance from what it separates wherever it runs). The single
// column is `grid-cols-1`, `minmax(0,1fr)` too (PostCard's reason). DOM ORDER
// IS READING ORDER in both arrangements: before, the line (hidden from
// assistive technology), after — a screen reader meets two figures, each
// with its heading as its caption when the pair has headings: the figure's
// name under HTML-AAM's rule, a rule Chromium 151 does not apply (measured
// 2026-10-20; Firefox and WebKit not measured), while a screen reader still
// reads the caption inside its figure (PostPhoto's THE HEADING).
// WHERE THE SWITCH FALLS, in windows (BeforeAfter.scale.test.tsx measures it;
// default 16px root): outside THE BAND SCALE the root is the article's
// measure, min(column, 42rem), and ui/Container's column is 80 % of the
// window from a 600px window (its THE PHONE GUTTER), so the root reaches 512px
// at a 640px window — 658.75 behind a classic 15px scrollbar, which the column
// loses as well. So every phone held upright (440px at most) and a 7″ tablet
// (600px) read the pair stacked; an iPad mini (744), every 768 tablet and a
// phone held sideways from 640px read it side by side. Inside THE BAND SCALE
// the measure is 672 design pixels, at least 544px, so the pair is side by
// side at every laptop and desktop width. At a larger default font size the
// switch moves with it: 40rem of window, 800px at a 20px root.
//
// ── THE PHONE, AS IT WAS — the owner: "the way before and after look on
// phone is to be changed, but taht will come in a future refactor … do not
// rework nothing yet on phone". Below the root's `@lg` the pair is what it
// was before the halves became blog photos — the before half, the line lying
// down, the after half, 24px apart — every heading, picture and line where it
// stood (each half's 16px between its heading and its picture is PostPhoto's
// now, the same 16px); a pair that has notes adds nothing but each note, 16px
// under its own picture, pushing what follows down by as much.
// BeforeAfter.scale.test.tsx holds the old positions, written out.
//
// ── THE PICTURES STAY LEVEL — through a SUBGRID. Side by side, a heading
// that wraps to two lines beside a one-line heading, or a note of two lines
// beside a note of one, would put one picture lower than the other, and a
// before/after is read by comparing the two pictures straight across. So from
// the root's `@lg` each half takes, through `className` (placement only, §6.8
// — PostPhoto's THE SUBGRID names exactly this), a span of as many of the
// pair's rows as it has parts — the picture, plus the headings, plus the
// notes: 1 to 3, the same for both halves by THE PAIR IS ONE SHAPE — and those
// rows' tracks as its own (`grid-template-rows: subgrid`). Both halves then
// lay their parts on the SAME rows: one row holds the two headings, one the
// two pictures, one the two notes. So the two pictures share one top and one
// bottom whatever the words do; in the headings' row PostPhoto's `self-end`
// seats the shorter heading on its own picture, 16px above it like the taller
// one; each note starts 16px under its own picture, the notes' first lines
// level. THE LINE spans the same rows and stretches over them, as tall as the
// pair. The pair's row gap from `@lg` is the halves' own 1rem (`@lg:gap-y-4`)
// — a belt: with equal spans any row gap measures the same inside a subgrid
// (PostPhoto's THE SUBGRID), and only the halves' own 1rem would keep a note
// 1rem under its picture were the spans ever to differ. The spans come from
// ONE table keyed by the part count (ROWS): static strings, because Tailwind
// reads class names from source text, and a type that refuses a fourth count.
// A span to the last line, `1 / -1`, would be wrong here: the pair's rows are
// implicit, so its last EXPLICIT line is its first, and such a span shrinks to
// the first row alone (the PostPhoto lane measured it break the layout).
// Stacked, each half keeps its own row in the one column and nothing is
// aligned across.
// ENGINES WITHOUT SUBGRID drop `grid-template-rows: subgrid` — among the
// engines that read container queries (without which the pair never leaves
// the stack), only Chrome and Edge 106 to 116, Opera 94 to 102 and Samsung
// Internet 20 to 23 (caniuse; Safari read both from 16.0, Firefox subgrid from
// 71). Each half is then a grid of its own across the N rows, and
// `@lg:items-start` stands it at the top of the pair at its own height — a
// declaration that does NOTHING while the halves are subgrids, because a
// subgrid is always stretched in its subgridded axis
// (BeforeAfter.scale.test.tsx measures both): the two pictures stay level
// whenever the two headings take as many lines, or there are none, and step
// by the difference when they do not; each part keeps its 16px; the notes
// hang at their own lengths; nothing overlaps, nothing is cut, and the line
// still runs the pair's height. The floor of the old design (the halves on
// the row's floor) was weighed and declined for it: a note of two lines
// beside a note of one would then step the pictures, and notes differ in
// length more often than headings do.
//
// ── THE LINE — the owner's "the same line" — is ONE decorative span:
// `aria-hidden`, empty, no role, unfocusable. Lying down it is `h-1 w-full`,
// standing it is `@lg:h-auto @lg:w-1 @lg:self-stretch` across the halves'
// rows — 4px thick either way, as long as the column, or as tall as the pair —
// and in both it is `rounded-full bg-(--ribbon)`: the floss ribbon's colour,
// the thread that runs down the page beside the doctor cards (globals.css's
// `--ribbon`, whose header names this reader). KEEP IN SYNC with
// sections/PostConclusion's standing line — its shared tokens are exactly
// `rounded-full bg-(--ribbon)` and the thickness step 1 (the lane contract's
// THE LINE, CLAUDE.md §15.39 round 4's KEEP-IN-SYNC pair); the two spellings
// are pinned to each other by tests/unit/article-line-sync.test.ts, which
// reads LINE below — its span is added beside it, never spelled into it. A
// decoration, never a boundary anyone needs to see: 1.45:1 on the page ground,
// 1.53:1 on white, outside SC 1.4.11. No information rides on it: which half
// is which is said by the headings when the pair has them; otherwise by the
// alts. For the articles the site ships, that the alts SAY it is held by CI
// — tests/unit/blog-article-data.test.ts opens every heading-less pair's
// before alt on the language's before word and its after alt on its after
// word, the colon and the space included („Înainte: " and „După: " in
// Romanian) — and not by lib/blog-article's `parseArticle`, which takes any
// alt that holds a visible letter (lib/visible-text's `hasVisibleLetter`).
// This section checks neither (the caller's duty, written on `images` and
// `headings`; the a11y review, 2026-10-20).
//
// ── THE HALVES' `sizes`, DERIVED — four answers, the first that matches wins
// (`sizes` chooses the FILE; CSS sizes the box). Handed to each PostPhoto as
// its `sizes` (PostPhoto's own answers describe a photo as wide as the
// measure):
//   · `(min-width: 70rem) and (pointer: fine) 23vw` — THE BAND SCALE
//     (ui/Container's paragraph of that name; sections/PostPage wears it and
//     this section inherits it): on a mouse or trackpad from the window whose
//     column is the scale's 56rem step — 56 / 0.8 = 70rem, the gate
//     PersonnelCard's CUTOUT_SIZES asks with — every length of the article is
//     drawn in a design pixel s = min(column, 96rem) / 1106, so the measure is
//     672s and each picture (672 − 4 − 2 × 24)s / 2 = 310s = 310 × 0.8W / 1106
//     = 22.42 % of the window: ceil(100 × 310 × 0.8 / 1106) = `23vw`, the
//     derivation tests/unit/design-scale.test.ts applies to the cutout.
//   · `(min-width: 41.25rem) 19.375rem` — SIDE BY SIDE OUTSIDE THE SCALE
//     (every touch screen at any width, a mouse under 70rem): half of the
//     42rem measure less the line and its air, (42 − 0.25 − 2 × 1.5) / 2 =
//     19.375rem — in rem, so it follows the root as the measure does. The
//     picture reaches it once the measure reaches 42rem, from a 52.5rem window
//     (42 / 0.8), and stays under it before. The answer starts at the switch's
//     window behind a scrollbar of up to 1rem, (32 + 1) / 0.8 = 41.25rem —
//     past the switch with a classic 15px scrollbar (658.75px) as well as
//     without one (640px): no window is told 19.375rem while its picture still
//     spans the stacked column.
//   · `(min-width: 37.5rem) 80vw` — STACKED from a 600px window: the picture
//     spans the root, the column there, 80 % of the window (10vw a side, the
//     gutter's own share from its ramp's end) — PostPhoto's answer of the same
//     name, and the measure's 42rem cap is never reached under 41.25rem. Its
//     price: between the switch (640 / 659) and 41.25rem a picture already
//     beside its twin is told 80vw — a file a step larger, never a smaller
//     one (at most 2.3 × its 230–238px box, behind a classic scrollbar).
//   · `90vw` — STACKED on a phone: 5vw a side up to 30rem, the 1rem floor
//     below 320.
// THE BOUNDS, each a file a little larger or smaller than the box could use,
// never a wrong box: (1) past THE BAND SCALE's cap — the 1920 window's 1536px
// column, ≈ 1939px behind a classic scrollbar — the picture holds at 430.5px
// while `23vw` grows on (589px at a 2560 window, × 1.37); (2) a classic
// scrollbar moves the scale's step to a ≈ 1139px window, so between 1120 and
// 1139 a mouse is told 23vw of a picture still 310px wide, at most 17 % under
// — the candidate widths absorb it (384 at 1×, 640 at 2×, both wider than
// the box); (3) `sizes` cannot ask the scale's `@supports` gate, so in an
// engine that refuses it (Safari before 16.4, Firefox before 128, Chrome
// before 119) the picture stays 310px while a mouse from a 70rem window is
// told 23vw — under it to a ≈ 1348px window (310 / 0.23), over it beyond;
// (4) between 41.25rem and 52.5rem the rem answer over-asks — by at most 35 %,
// a 230.5px picture at a 660px window behind a classic scrollbar (238px and
// 30 % without one) — and on the gutter's ramp, 30rem to 37.5rem, `90vw`
// over-asks a column sliding from 90 % to 80 % of the window by at most
// 12.5 %, a classic scrollbar's 15px aside (16 % at a 599px window behind
// one); (5) a scrollbar WIDER than 1rem holds the switch past 41.25rem by
// 1.25px of window for every pixel over 16, and a window there is told
// 19.375rem of a picture still stacked across the column. And AT THE SCALE'S
// STEP the picture shrinks from 310px to ≈ 251px in one pixel of window — the
// band scale's recorded jump (CLAUDE.md §15.25 round 2 (c)), every theme
// length with it.
// THE SPACE BEFORE `23vw` IS LOAD-BEARING (PersonnelCard's THE SPACE BEFORE
// `21vw`): next/image (get-img-props, getWidths) reads the smallest
// WHOLE-NUMBER `vw` share that opens the string or follows a space — 23 here
// — and keeps only the candidates of at least 640 × 0.23 = 147.2px: 256, 384,
// 640 and up, every width a picture of 230px or more can use. A fractional
// share (22.5vw) or one glued to a bracket would not be read at all, and 80 or
// 90 alone would drop the 256 and 384 widths a 1× screen asks for.
//
// ── WHAT THIS SECTION DOES NOT OWN: its width and every margin (§6.4/§6.8 —
// the article's measure places it), the air above and below it (the
// measure's own gap), each half's heading, picture and note and the 16px
// between them (sections/PostPhoto's), the notes' lead-in and their two lines
// at most (the route's words, the data's test), and any heading level — a
// heading is a figure's label, not an outline slot, so the article's outline
// stays its <h1> and the prose's <h2>s.
//
// ── ZERO ISLANDS (§16): no 'use client', no hook, no handler, no state.
// ui/Image brings its optimizer's small island with each picture, through
// sections/PostPhoto, as on every page with a photograph. BeforeAfter.test.tsx
// pins the directive's absence and the import surface from the source text.

/** Two of a kind — the before first. */
export type BeforeAfterPair<T> = Readonly<{ before: T; after: T }>;

export type BeforeAfterProps = {
  /** The two pictures — PostPhoto's picture shape; the left side by side,
   *  the upper stacked, first. THE CALLER'S DUTY: a pair WITHOUT headings
   *  says which half is which in these alts alone, so the before's opens on
   *  the language's before word and the after's on its after word
   *  („Înainte: …" / „După: …") — lib/blog-article's rule for the articles
   *  it ships, held by tests/unit/blog-article-data.test.ts. BeforeAfter
   *  checks none of it. */
  images: BeforeAfterPair<PostPhotoImage>;
  /** A heading over each picture, or none over either — any words („Înainte"
   *  / „După", or others), showing a word — a letter or a digit — on both
   *  halves, or two empty strings, the part absent from both (THE PAIR IS
   *  ONE SHAPE). THE
   *  CALLER'S DUTY: each heading is its figure's caption, the words a sighted
   *  reader and a screen reader meet over its picture — a screen reader reads
   *  it inside the figure — and the figure's name only under HTML-AAM's rule,
   *  which Chromium 151 does not apply (measured 2026-10-20; Firefox and
   *  WebKit not measured: PostPhoto's THE HEADING), so the two must tell the
   *  halves apart; without headings the alts must (`images`). BeforeAfter
   *  checks none of it. */
  headings?: BeforeAfterPair<string>;
  /** A note under each picture, FINISHED with its lead-in („Notă: …"), or
   *  none under either — showing text on both halves, or two empty strings,
   *  the part absent from both. A note is a paragraph in its figure, never
   *  its caption. */
  notes?: BeforeAfterPair<string>;
} & // The native <div> surface, minus `children` and `dangerouslySetInnerHTML`
  // (the content arrives as the three named parts; React throws on markup
  // set beside children, so one smuggled in through a spread still fails the
  // build, loudly — no reset of its own), `role` (`role="img"` would make the
  // pair ONE picture and hide both figures from assistive technology, its
  // children presentational; a landmark role would add a region nobody asked
  // for), `aria-label` / `aria-labelledby` (the root is a generic <div>,
  // which ARIA forbids to name — each figure is captioned by its own
  // heading), `aria-roledescription` (prohibited on a generic as well: a
  // description of a role the pair does not have) and `title` (a tooltip
  // spread across both figures, which a pointer may find and a keyboard or a
  // finger never does; the round-2 review, 2026-10-20). All five are reset
  // after the spread too (THE NATIVE SURFACE, below): a spread of a wider
  // object can still carry one, and TypeScript checks no hyphenated JSX
  // attribute against a props type that lacks it (sections/PageHero's belt;
  // the reviews, 2026-10-20). React 19 carries `ref` inside these props
  // (§6.8).
  Omit<
    ComponentPropsWithRef<'div'>,
    | 'children'
    | 'dangerouslySetInnerHTML'
    | 'role'
    | 'title'
    | 'aria-label'
    | 'aria-labelledby'
    | 'aria-roledescription'
  >;

/** How many parts each half has: the picture, and a heading, and a note. */
type PartCount = 1 | 2 | 3;

/** One column below the root's `@lg`, before | the line | after from it, the
 *  rows 1rem apart and each half at the top of the pair where it is no
 *  subgrid (THE LAYOUT, THE PICTURES STAY LEVEL). One static string: Tailwind
 *  reads class names from source text. */
const GRID =
  'grid grid-cols-1 gap-6 ' +
  '@lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] @lg:gap-y-4 @lg:items-start';

/** THE LINE: lying down in the stack, standing beside — 4px of the floss
 *  ribbon's colour, round at both ends. KEEP IN SYNC with
 *  sections/PostConclusion's line (`rounded-full bg-(--ribbon)`, step 1); its
 *  span rides beside it, from ROWS. */
const LINE =
  'h-1 w-full rounded-full bg-(--ribbon) @lg:h-auto @lg:w-1 @lg:self-stretch';

/** THE PICTURES STAY LEVEL's spans, keyed by the halves' part count: each
 *  half spans that many of the pair's rows from `@lg` and takes them as its
 *  own; THE LINE spans as many. A fourth count does not compile. */
const ROWS = {
  1: { half: '@lg:row-span-1 @lg:grid-rows-subgrid', line: '@lg:row-span-1' },
  2: { half: '@lg:row-span-2 @lg:grid-rows-subgrid', line: '@lg:row-span-2' },
  3: { half: '@lg:row-span-3 @lg:grid-rows-subgrid', line: '@lg:row-span-3' },
} as const satisfies Record<
  PartCount,
  Readonly<{ half: string; line: string }>
>;

/** Each half's `sizes` (THE HALVES' `sizes`, DERIVED): THE BAND SCALE's share
 *  for a mouse from 70rem, half the measure side by side, the column stacked.
 *  The space before each `vw` is load-bearing. */
const PICTURE_SIZES =
  '(min-width: 70rem) and (pointer: fine) 23vw, (min-width: 41.25rem) 19.375rem, (min-width: 37.5rem) 80vw, 90vw';

/** What each part shows on both halves to be printed (THE PAIR IS ONE
 *  SHAPE): a heading a WORD — a letter or a digit, lib/visible-text's
 *  `hasVisibleWord`, PostPhoto's own rule for a caption — and a note any
 *  TEXT, its `hasVisibleText`. */
const SHOWS = {
  headings: { test: hasVisibleWord, rule: 'show a letter or a digit' },
  notes: { test: hasVisibleText, rule: 'show text' },
} as const satisfies Record<
  'headings' | 'notes',
  Readonly<{ test: (text: string) => boolean; rule: string }>
>;

/**
 * Is a part on both halves (true) or on neither (false)? On both when both
 * halves SHOW what the part must (SHOWS: a heading a word, a note text),
 * PostPhoto then printing both, one row each; on neither when the pair has no
 * such part or holds it as two EMPTY strings, which PostPhoto prints as
 * nothing. Anything else is REFUSED, naming the pair by `before`, its before
 * picture's path, and the part, and quoting both halves `spelled` (THE PAIR
 * IS ONE SHAPE's holes): a TypeError for a half that is no string, a
 * RangeError for an empty half beside words, a blank half, two blank halves
 * or a heading of marks alone.
 */
function onBoth(
  part: 'headings' | 'notes',
  pair: BeforeAfterPair<string> | undefined,
  before: string,
): boolean {
  if (pair === undefined) return false;
  const named = `BeforeAfter: the pair whose before picture is ${spelled(before)}`;
  const quoted = `${spelled(pair.before)} (before) and ${spelled(pair.after)} (after)`;
  if (typeof pair.before !== 'string' || typeof pair.after !== 'string') {
    throw new TypeError(
      `${named} holds ${part} that are not two strings; they are ${quoted}`,
    );
  }
  if (pair.before === '' && pair.after === '') return false;
  const { test, rule } = SHOWS[part];
  if (test(pair.before) && test(pair.after)) return true;
  throw new RangeError(
    `${named} is one shape — its ${part} must ${rule} on both halves, or be empty on both; they are ${quoted}`,
  );
}

/** The halves' part count — the same for both, by THE PAIR IS ONE SHAPE;
 *  `before` is the before picture's path, which names a refused pair. */
function partCountOf(
  headings: BeforeAfterPair<string> | undefined,
  notes: BeforeAfterPair<string> | undefined,
  before: string,
): PartCount {
  const withHeadings = onBoth('headings', headings, before);
  const withNotes = onBoth('notes', notes, before);
  if (withHeadings && withNotes) return 3;
  return withHeadings || withNotes ? 2 : 1;
}

export function BeforeAfter({
  images,
  headings,
  notes,
  className,
  ...rest
}: BeforeAfterProps): ReactElement {
  const rows = ROWS[partCountOf(headings, notes, images.before.src)];

  return (
    // THE NATIVE SURFACE: the caller's native props ride FIRST; then a
    // `role`, a name, a role description or a `title` that slipped past the
    // Omit — written, or in the spread of a wider object — is reset: the pair
    // is never one picture, never a landmark, named by nothing and described
    // by nothing, and it carries no tooltip across its two figures, each
    // captioned by its own heading (sections/PageHero's belt, the same
    // refusal); then the root's own class, merged with a caller's className
    // LAST — placement only (§6.8).
    <div
      {...rest}
      role={undefined}
      title={undefined}
      aria-label={undefined}
      aria-labelledby={undefined}
      aria-roledescription={undefined}
      className={cx('@container', className)}
    >
      <div className={GRID}>
        <PostPhoto
          image={images.before}
          heading={headings?.before}
          note={notes?.before}
          sizes={PICTURE_SIZES}
          className={rows.half}
        />
        {/* THE LINE (the header): a decoration, hidden from assistive
            technology. Which half is which is said by the headings when the
            pair has them; otherwise by the alts — for the articles the site
            ships, held by CI to open on the language's before or after word
            with its colon and space („Înainte: ", tests/unit/
            blog-article-data.test.ts), while lib/blog-article's
            `parseArticle` takes any alt with a visible letter. This section
            checks neither. */}
        <span aria-hidden="true" className={cx(LINE, rows.line)} />
        <PostPhoto
          image={images.after}
          heading={headings?.after}
          note={notes?.after}
          sizes={PICTURE_SIZES}
          className={rows.half}
        />
      </div>
    </div>
  );
}
