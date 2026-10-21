import type { ComponentPropsWithRef, ReactElement } from 'react';
import { Eyebrow } from '@/components/ui/Eyebrow/Eyebrow';
import { Heading } from '@/components/ui/Heading/Heading';
import { cx } from '@/lib/cx/cx';

// sections/PostHeader — the blog article's opener: the post's title as the
// page's one <h1> and under it the by-line in the eyebrow's mono micro-label,
// both on the column's START edge. The owner, verbatim (2026-10-14): "now i
// want also to have the individual blog page … i have attatched an example of
// what i want aproximatloey. i want the heading centered. i wnat the "by x"
// where x is the doctor but in eyebrows style" — and, asked whether the
// article page shows a date: no date. The example he attached (a real-estate
// blog) sets a centred title with "by Zack Jeniel" under it, then the share
// row and the wide photograph; this file is the first two of those, and
// sections/PostPage composes the rest (the build contract's §2). Built
// centred first; the owner, the same day, on the page: "i also think i'd
// prefer those left alligned: Cum îți alegi periuța de dinți / DE DR. NICU
// ELENA ALINA" — the centred opener is SUPERSEDED (START-ALIGNED, below).
//
// ── A DUMB PROPS-IN PIECE (the contract's §0, §4's shared-composition
// sub-kind): zero message keys, no t(), no data import, no hook. Both strings
// arrive FINISHED (§8.1): `title` is the post's own title, and `byline` the
// whole sentence the page words through ICU — „de Dr. Nicu Elena Alina", the
// preposition included, because only the page knows the language's word for
// "by" and where it goes. The uppercase is ui/Eyebrow's CSS, never the string
// (Ș and Ț map to their own capitals in the browser, §8.8). It composes two
// atoms, ui/Heading and ui/Eyebrow, and nothing else; PostHeader.test.tsx pins
// the import surface from the source text.
//
// ── THE <header>. Inside the page's <article> it is that article's
// introductory content — HTML's own meaning of the element — and NOT a banner
// landmark: a <header> scoped to an <article> maps to no landmark, so the
// shell's site header stays the page's only banner. It carries no name of
// its own: sections/PostPage names the ARTICLE by this <h1>, through
// `aria-labelledby` and the `titleId` handed in here (React's useId lives in
// the page, which owns the article). With no `titleId`, or an empty one, the
// <h1> simply has no id — never an empty `id` attribute, which HTML does not
// allow and which names nothing (the review, 2026-10-20). Nor can a caller
// make the <header> a landmark or name it: `role`, `aria-label` and
// `aria-labelledby` are refused by the type and reset after the spread (THE
// NATIVE SURFACE, at the render).
//
// ── THE HEADING IS THE PAGE'S <h1>, on ui/Heading's `hero-scaled` step —
// §15.24's one h1 step, `hero`, as it reads in a band that scales; the
// doctor page's name and the blog index's title wear it too (THE BAND SCALE,
// below) — worn through `asChild` by a real <h1>, because the atom answers
// "how big" and never "which element". DOM ORDER IS VISUAL ORDER: the title,
// then the by-line, as in the owner's example and as a by-line reads in print
// — the author signs what came before. (DoctorIntro paints its specialty
// ABOVE the doctor's name and keeps the name first in the DOM,
// `flex-col-reverse`; here the eyebrow-styled line is a signature, it belongs
// under the title, and no reversal is needed.)
//
// ── START-ALIGNED (the owner, 2026-10-14 — "i'd prefer those left
// alligned"). The <header> stacks both BOXES on the column's start edge
// (`items-start`, so each is a shrink-to-fit flex item laid at the start),
// and both LINES read from it with no utility of their own: the <h1>
// inherits `start`, text-align's initial value, which nothing above it
// changes, and the by-line is a <p>, which globals.css's base fence holds to
// `start` (§15.15 b). The first build, superseded the same day, centred
// both: `items-center` and `text-center` on the <header>, and `text-center`
// ON the by-line's element, since that fence beats an inherited centring.
// 16px apart (`gap-4`): a by-line stands a step further from a 32–90px title
// (the step's `hero` floor; its 65.04 design pixels at THE BAND SCALE's cap)
// than SectionHeading's 8px eyebrow does from a 30–36px one.
//
// ── THE TITLE'S FOUR UTILITIES, each on the <h1> itself (the slot merges
// them after the step's own):
//   · `max-w-4xl` — its MEASURE, 56rem (896px; 896 design pixels inside THE
//     BAND SCALE, below): at a 1920 desktop the column is 1536px wide, and an
//     uncapped title would run edge to edge in one line; capped, a long one
//     wraps into balanced lines a little wider than the article's 42rem text
//     column under it. On a phone and an upright tablet the column is
//     narrower than the cap, so it changes nothing there.
//   · `text-balance` — a title that wraps breaks where its lines come out
//     even, so a two-line title never strands one word on its second line
//     (DoctorIntro's name wears the same, D62). A title that fits keeps its
//     one line: balancing chooses WHERE a wrap falls, never whether one
//     happens. An engine without balanced line wrapping (Safari before 17.5)
//     wraps greedily.
//     THE BY-LINE DOES NOT WEAR IT — measured when the opener turned
//     start-aligned (2026-10-14; the centred by-line wore it for one round).
//     Two of the clinic's authors' by-lines wrap at 320, and balancing
//     breaks the one with a hyphenated surname AT ITS HYPHEN, „de Dr.
//     Ivașcu-" over „Zugravu Cătălina" — a hard hyphen stays a break
//     opportunity under `hyphens: none` — and parts „Malea" from „(Sabău)"
//     in the other, „de Dr. Malea" over „(Sabău) Oana Bianca". The greedy
//     wrap keeps „de Dr. Ivașcu-Zugravu" whole over „Cătălina"; its one cost
//     is a lone „Bianca" under „de Dr. Malea (Sabău) Oana". (The pretty
//     line wrapping, measured too, breaks at the same hyphen.)
//   · `hyphens-none` — the site-wide `hyphens: auto` (§15.14) is for PROSE;
//     a title wraps between words and never splits one at a syllable (the
//     doctor page's name and the hero's slogan, the same rule). The by-line
//     wears it too: a person's name is never hyphenated (PersonnelCard D4).
//   · `wrap-anywhere` — THE BELT, SC 1.4.12 (PostCard's THE TITLE'S BELT):
//     with hyphenation off, a word wider than its whole line would otherwise
//     run out of the column — under text spacing's 0.12em a letter, or in a
//     large default font on a phone. `overflow-wrap: anywhere` breaks only
//     such a word, after spaces have had their chance — MEASURED: in every
//     story, at every width the plays run, the title's lines are the ones it
//     has with the belt lifted (the stories' `expectWholeWords` holds it).
//
// ── THE BAND SCALE, AND THE STEP IT NEEDS HERE (CLAUDE.md §15.32). The
// page's rhythm box wears ui/Container's two band-scale strings, so on a
// laptop or a desktop — a mouse or trackpad, an engine that registers custom
// properties, a column of at least max(56rem, 896px) — every theme length
// inside it is redrawn in the page's one design pixel s = min(column, 96rem)
// / 1106: the by-line's 14px is 14 × s, the 16px gap 16 × s, the title's cap
// 896 × s, by inheritance, with nothing spelled here. ONE length escapes
// that remap: `hero` is a VIEWPORT clamp, clamp(2rem, 1rem + 3.5vw, 4.5rem),
// no theme variable at all. So the <h1> wears ui/Heading's `hero-scaled`
// step: `hero` byte for byte, and behind THE BAND SCALE's own gate chain the
// clamp's value at the owner's 1401 window, 16 + 3.5 × 14.01 = 65.035px, as
// 16.26 spacing steps (65.04 design pixels). Inside the scale the title is
// that design size × s, growing and shrinking with every heading and eyebrow
// on the page; outside it the step's one gated class never matches and the
// title is `hero`'s own clamp. The step is spelled ONCE, in the atom (its
// header's 'hero-scaled' JOINED), and worn by the doctor page's name
// (sections/DoctorIntro) and the page hero's heading (sections/PageHero —
// the blog list's and the Team page's) as well — this file spells no
// size: PostHeader.test.tsx holds the title to the step, and
// tests/unit/design-scale.test.ts holds the size to the atom and the chain
// to the regime's. Until 2026-10-15 this title wore the
// class itself, LAST, byte for byte the doctor's name's — a size handed to
// ui/Heading by className, the departure from §6.8 whose recorded lever was
// a step of the atom's own (DoctorIntro's THE BAND SCALE, THE NAME); as its
// third consumer, this title was the trigger the census had booked for it.
//   NO `@container` HERE — load-bearing. The step's two container steps
//   read the NEAREST size container above the <h1>. The page's rhythm box is
//   none, so that is ui/Container's column: the very box the band's own gate
//   reads, so the title's size opens and closes exactly with the band's
//   design pixel, at any root font size. A container on this <header> would
//   become what the title reads — the band's CAPPED box, which under a root
//   smaller than 9⅓px caps below the 896px floor and keeps the gate shut
//   while the band's opens (the bound DoctorIntro's THE NAME records for its
//   own box, and ui/Heading's THE BOUND with the step). PostHeader.test.tsx
//   pins the absence in the source and in the markup.
//
// ── MEASURED on the stories (Chromium, the real faces, behind the runner's
// classic 15px scrollbar — a 273, 336, 945, 1009 and 1214px column at 320,
// 390, 1200, 1280 and 1536; a mouse, so the scale's gate is open from the
// step): the title is `hero`'s 32px floor at 320 and 390 — the demo title on
// two balanced lines at 390 (175 and 214px), the stress title on three in
// every column from 273 to 375px, the longest by-line on two at 320 (245 and
// 58.8px, the greedy wrap — the by-line paragraph above); inside the scale,
// s = 0.854 / 0.912 / 1.097, the title is 55.57 / 59.34 / 71.38px on one
// line (652 / 690 / 828px wide, under its 765 / 817 / 983px measure) and the
// by-line 11.96 / 12.77 / 15.36px at 1200 / 1280 / 1536. Every box and every
// line starts on the <header>'s left edge within 1px; nothing scrolls
// sideways at any of them. The by-line under 12px at the step's low end is
// THE BAND SCALE's own trade, shared with every eyebrow of Home (CLAUDE.md
// §15.32 round 4's (a)).
//
// ── A LISTEN OWED (the review, 2026-10-20). The by-line's capitals are
// ui/Eyebrow's CSS, and Chromium and WebKit hand assistive technology the
// text as it is PAINTED (measured by the review): „DE DR. NICU ELENA ALINA",
// never the sentence case the page wrote. Some voices read a word in
// capitals as letters, so „DR" may be spelled out where "doctor" is meant.
// No test here can hear it — this suite reads the DOM's own sentence case —
// so it is a listen owed on a real screen reader, with BACKLOG.md entry 2's.
//
// ── WHAT THIS PIECE DOES NOT OWN: its margins (§6.4 — the page's rhythm box
// spaces it), the <article> and the id (the page's), the band scale (the
// page wears it), the date (the owner: none on the article page).
//
// ── ZERO ISLANDS (§16): no 'use client', no hook, no handler, no state — the
// opener compiles into the article's static HTML and ships no JavaScript.

type PostHeaderOwnProps = {
  /** The post's title, finished text (§8.1) — the page's one <h1>. */
  title: string;
  /**
   * The by-line, the whole finished sentence (§8.1) — „de Dr. Nicu Elena
   * Alina": the preposition is the page's ICU message, the name the post's
   * author. Written in sentence case; ui/Eyebrow uppercases it in CSS.
   */
  byline: string;
  /**
   * The <h1>'s id — the page's useId, which names its <article> through
   * `aria-labelledby`. Absent or empty, the <h1> carries no id.
   */
  titleId?: string;
};

export type PostHeaderProps = PostHeaderOwnProps &
  // The native <header> surface minus this piece's own names — `title` is
  // HTML's tooltip attribute and would mean two things at the call site —
  // and minus `children` and `dangerouslySetInnerHTML`: the content arrives
  // as the two named strings, and React throws on markup set beside
  // children. Minus `role` too — a `role="banner"` would make the opener a
  // second banner landmark beside the shell's header (THE <header>) — and
  // `aria-label` / `aria-labelledby`: a <header> scoped to the page's
  // <article> is a GENERIC element, which ARIA forbids to name (axe's
  // aria-prohibited-attr), and the page names the ARTICLE, by the <h1>. The
  // last three are reset after the spread as well (THE NATIVE SURFACE, at the
  // render), since TypeScript checks no hyphenated attribute written in JSX
  // against this type, and the spread of a wider object can carry a `role`
  // (the review, 2026-10-20 — sections/PageHero's belt, the same refusal).
  // React 19 carries `ref` inside these props (§6.8).
  Omit<
    ComponentPropsWithRef<'header'>,
    | keyof PostHeaderOwnProps
    | 'children'
    | 'dangerouslySetInnerHTML'
    | 'role'
    | 'aria-label'
    | 'aria-labelledby'
  >;

/** The opener (START-ALIGNED): both boxes stacked on the column's start
 *  edge, 16px apart; the lines start-aligned by inheritance and the fence. */
const OPENER = 'flex flex-col items-start gap-4';

/** The title's four utilities (the header's THE TITLE'S FOUR UTILITIES) —
 *  and NO SIZE: its size is ui/Heading's `hero-scaled` step's, in and out of
 *  the band scale (THE BAND SCALE). */
const TITLE = 'max-w-4xl text-balance hyphens-none wrap-anywhere';

/** The by-line's unbroken name, ON THE ELEMENT — greedy wrap, no balancing
 *  (the header's THE BY-LINE DOES NOT WEAR IT). */
const BYLINE = 'hyphens-none';

export function PostHeader({
  title,
  byline,
  titleId,
  className,
  ...rest
}: PostHeaderProps): ReactElement {
  return (
    // THE NATIVE SURFACE: the caller's native props ride FIRST; then a `role`
    // or a name that slipped past the Omit — written in JSX, or in the spread
    // of a wider object — is reset, since the opener is never a landmark of
    // its own and is named by nothing (its <h1> names the page's <article>);
    // then the opener's own classes, merged with a caller's className LAST
    // (§6.8), so a page's placement utility lands on the <header> itself.
    // The <h1> takes `titleId` only when it holds an id: an empty one prints
    // none (THE <header>).
    <header
      {...rest}
      role={undefined}
      aria-label={undefined}
      aria-labelledby={undefined}
      className={cx(OPENER, className)}
    >
      <Heading size="hero-scaled" asChild>
        <h1 id={titleId || undefined} className={TITLE}>
          {title}
        </h1>
      </Heading>
      <Eyebrow className={BYLINE}>{byline}</Eyebrow>
    </header>
  );
}
