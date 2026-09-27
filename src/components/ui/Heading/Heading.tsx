import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { cx } from '@/lib/cx/cx';
import { slotClone } from '../slot';

// ui/Heading — the display-type step, with the ELEMENT left entirely to the
// consumer (migrated per the approved contract board
// .claude/plans/heading-atom-contract-v2.plan.md, owner-approved 2026-08-19).
// It answers exactly one question — "how big is this title" — never "which
// element is it": the Footer renders its column titles as <p>, the Header
// wears the same look inline on its brand anchor, and sections will pass real
// h1–h6. The old repo's ui/heading had the right instinct (level vs
// visualLevel as independent axes) but hardcoded `Tag = h${level}`, which
// makes the Footer's <p> titles impossible by construction.
//
// The scale grows ADDITIVELY, one step per measured consumer (§6.6: never
// invent display sizes without one), and the default stays 'title' forever, so
// growth can never silently restyle a bare <Heading> (§6.6 again — a changed
// default is a break at every existing call site at once).
// v1 shipped ONE step, `title`. `section` joined it on 2026-09-01 with
// sections/SectionHeading as its measured consumer (epic #54, breakdown
// decision D2 — the issue is the durable anchor; the run workspace is
// machine-local and gitignored, fb-317): the old
// site's section title measured `text-3xl font-bold tracking-tight
// sm:text-4xl`, of which only the 30px step survives here. `sm:text-4xl` went
// because an atom scaling ITSELF per viewport is the §6.5 smell `title`
// already refused; `font-bold` + `tracking-tight` went because they dressed the
// old sans-serif — the Source Serif 4 display axis carries presence at 30px
// unbolded, which is why `title` ships unbolded too.
// 'page' JOINED 2026-09-07 by that exact rule: the 404 hero band is the
// measured consumer (owner, live round — "make both text and heading larger"
// on the centred error band), and `text-4xl` — 36px, ONE additive step over
// section's 30px — is its number. Unbolded for the same Source-Serif-4 reason
// as both elders, no self-scaling, no margins, same ink. The rule stays live
// for the step after this one: it joins when a page run brings ITS measured
// number, and not before.
//
// ZERO-DIFF-REWIRE INVARIANT — `title` renders byte-exactly
// `font-display text-xl text-ink-strong`: the string the Footer holds in its
// columnTitleClasses constant and the Header spells inline on the brand
// anchor. The rewires that follow (their own lanes, not this one) are accepted
// on ZERO visual diff, so any extra utility is a defect, not polish — no
// leading-*, no tracking-*, no text-balance, and no margin ever (§6.4: the
// parent's gap/padding owns spacing; the Footer brand row's `pb-8 text-center`
// rides in through className, §6.8). text-xl is an owner decision, not a
// default: the nav labels beneath these titles are TextButtons at text-lg, and
// that one-step gap is what makes a title read as a title.
// No `sm:`/`lg:` self-scaling either — the old heading scaled itself per
// viewport; §6.5 leaves responsive judgement to the section/page, never to an
// atom that cannot see its container. (The `band` row further down responds
// to the container it CAN see — the other half of that same sentence.)
//
// 'hero' JOINED 2026-09-19 with sections/Hero as its measured consumer (epic
// #103, the owner's dispatch of the same day): the old site's full-screen
// slogan measured 30px → 36 → 60 → 72 across four viewport prefixes. That
// staircase is the very self-scaling `title` refused — so the step is FLUID
// instead: `clamp(2rem, 1rem + 3.5vw, 4.5rem)` runs 32px at the 320px stress
// width, 43px on a tablet, 61px on a notebook, 70px on a laptop and caps at
// the old 72px from 1600px on (where 1rem + 3.5vw = 4.5rem); no prefix, no
// staircase. The `vw` term is the ONE place this atom
// looks at the viewport, and it is the same licence ui/Container's gutter
// already holds: page-scale geometry follows the page, not a container it
// cannot see — a hero slogan IS page-level layout (§6.5's own carve-out), the
// way the gutter is. Unbolded like every elder; `leading-tight` is NOT a
// breach of the zero-diff rule above — an arbitrary size carries no
// line-height of its own (the named steps get theirs from Tailwind's
// `--text-*--line-height` pairs), so the `/tight` modifier is the step's
// line-height, spelled where the size is, not an extra utility on an existing
// step. The three elders emit byte-exactly what they always did.
//
// THE TONE AXIS joined in the same lane (the "one foreseeable exception" this
// paragraph used to promise): `tone` is the ink — 'default' = ink-strong, the
// ink every earlier call site already wears, pinned as the default FOREVER so
// growth restyles no bare <Heading>; 'inverse' = ink-inverse, for display text
// over the §15.1 scrim (sections/Hero is the consumer; the scrim's 0.55 floor
// is what makes white ink readable there). An additive prop, never a caller
// className override (restyling an atom's internals is banned, §6.8). The two
// axes are orthogonal — any size may wear either ink — and the class string
// is size + tone in that order, which is what keeps the elders byte-exact.
// 'inverse-stroked' JOINED 2026-09-20 (owner, the hero lane's round 6:
// "create like in the old page the thick heading with border and use it
// here"): the old site's slogan face — `font-bold tracking-tight` from its
// heading atom, plus the 2px `-webkit-text-stroke` in the accent with
// `paint-order: stroke fill` (the stroke behind the fill, so the letterforms
// keep their weight) that its hero put on top. The ink is still ink-inverse;
// the stroke is `--color-accent-decorative`, §15.1's role for large display
// text and graphics — a hero slogan is exactly that. It is a TONE and not a
// size because it changes how the ink is painted, not how big the step is,
// and any step may wear it. Sections/Hero is the consumer (its `slogan`
// prop picks this or 'inverse'); the two elders are byte-identical.
// 'inverse-outlined' JOINED 2026-09-21 (owner, round 8: "the third slide
// make it as the initial thin, but with that border that the old style
// has"): the stroke ALONE — the plain weight and tracking of 'inverse', the
// 2px accent stroke of 'inverse-stroked' — so the three faces the Hero
// compares are plain, bold-and-stroked, and stroked. Same tone reasoning,
// same consumer, the elders still byte-identical.
// 'accent' JOINED 2026-09-25 with sections/DoctorCourses as its measured
// consumer (the doctor-pages run's round 2, D16): the year labels over a
// doctor's courses, "bold and lilac" in the owner's words.
// `--color-accent-decorative` is §15.1's role for LARGE display text (≥ 3:1)
// and graphics, never body copy — MEASURED: #7a6d9c on `--page` #faf9f7 is
// 4.44:1, under the 4.5:1 body text needs. So the tone is BOLD BY
// CONSTRUCTION: at the `title` step (20px) bold is what makes the text
// "large" in WCAG's definition (≥ 18.67px bold), where 3:1 binds and 4.44:1
// clears it with room; at `section`/`band`/`page`/`hero` it is large by size
// alone.
// The consumer joined at `title` and has worn `section` — 30px, large by
// size alone — since round 2j (D44a: the year's <h3> in
// sections/DoctorCourses/CourseTimeline.tsx). The AccentTone and
// AccentIdleTone stories still photograph the 20px `title` step ON PURPOSE:
// it is the harder case, the one where the weight is what makes the text
// large, so a frame that passes there passes at every step above it.
// A caller may not pair this tone with a smaller step because there is none —
// and the step that joins below `title` one day, if it ever does, must be
// argued against this paragraph first. The weight rides the TONE row, not the
// caller's className, so the pair cannot be split at a call site (§6.8 — a
// caller never restyles an atom's internals). The other grounds it may meet
// were measured with it: 4.67:1 on the white `--surface`, and 3.06:1 on
// sections/TintedBand's lilac ground (the 30 % tint of the doctor-pages run's
// D23 — still over the 3:1 large text needs, with almost nothing to spare; it
// was 3.48:1 at the 20 % the ground first shipped with). A darker ground than
// that tint is a new measurement, not a given.
// The elders are byte-identical; only the union and one table row grew.
// 'accent-idle' JOINED 2026-09-26 as the accent tone's REST TWIN, with the
// same consumer (the doctor-pages run's round 2g, D35): the course timeline
// greys every year at rest and lights only the one being read — "all are
// grayed out at rest … the current should have a non grayed out jump at you
// animation" (owner). It is `font-bold text-ink-muted`: the SAME weight as
// 'accent' in the body copy's muted ink, and the weight is the whole reason
// it is a row of its own rather than 'default' plus a colour. The timeline
// switches ONE year between the two as the visitor scrolls, and a lit/unlit
// pair that differed in weight would re-measure the line on every switch —
// the year growing wider, a long German label re-wrapping, every course
// under it nudged. So the pair differs in the INK ALONE (the test file pins
// exactly one token of difference at every step). The contrast is not what
// the bold is for this time: `--ink-muted` #5b554f on `--page` #faf9f7 is
// 6.99:1 at full opacity, over body text's 4.5:1 at any weight.
// KEEP-IN-SYNC with sections/DoctorCourses/CourseTimeline.tsx (its CONTRAST,
// MEASURED paragraph and `groupIdle`): the one consumer fades the whole
// resting group to 0.65, where this ink blends to rgb(147 142 138) and reads
// 3.07:1 on `--page` — the large-text bar, which every step of this atom
// meets by construction (the smallest, `title`, is 20px, and this row is
// bold: ≥ 18.67px bold is large) — so no consumer may fade it below 0.65
// without re-measuring (at 0.50 it would read 2.27:1, a failure).
// Same tone reasoning as its twin (the weight rides the row, never a
// caller's className, §6.8); the elders, 'accent' included, are
// byte-identical.
//
// 'band' JOINED 2026-09-26 as THE h2 STEP (the doctor-pages run's round 2j,
// D48), under §15.24's one-size-per-outline-level rule: the owner asked for
// the band titles "to the next order of heading height … i do not want them
// so large [as the h1], but larger definitely". The next order up is
// `page`'s 36px — but the h1 wears `hero`, whose curve bottoms out at 32px,
// and 1rem + 3.5vw only reaches 36px at a 571px viewport (16 + 0.035 × 571.4
// = 36). A fixed 36px h2 would OUTRANK the page's own h1 on every phone. So
// the step is `text-3xl @md:text-4xl`: `section`'s 30px in a container
// narrower than its `@md` step (28rem = 448px), `page`'s 36px from it. It
// invents no size (§6.6): below the step it IS the section row byte for
// byte, from it the page row's own token — the test file pins both halves.
// And it is, recognisably, the old site's section title (`text-3xl …
// sm:text-4xl`, `section`'s paragraph above) with the viewport prefix
// traded for a container step.
// THE STEP ANSWERS TO THE NEAREST `@container`, and that decides who reads
// which size. A band title answers to ui/Container's column
// (`containerClasses`), 80 % of the viewport under its 10vw gutters: 30px on
// every phone column, 36px from a 560px viewport — every band on a tablet or
// wider. A title inside a ui/Card answers to the CARD, whose root carries
// `@container` (Card.tsx `cardClasses`), and a card's content box is its
// border-box less 25px per side on every tone (Card.tsx's SUM RULE: 1 + 24,
// or 3 + 22 for `framed`), so a card title reaches 36px only on a card at
// least 28rem + 50px = 498px wide. The category cards clear it from a tablet
// up (564px of content at 768, 702px at 1280 — PriceMenu.tsx's table); the
// 20rem schedule card never does (270px of content at most, 30px
// everywhere). Two cards rest at 30px beside wider neighbours, RECORDED: the
// price menu's „Categorii" (its `minmax(15rem,1fr)` track, 190px of content
// at 1280 — "one step under", PriceMenu.tsx's THE TITLE'S STEP IS `band`
// paragraph) and the credo card's „Filozofia mea" at DoctorIntro's `@3xl`
// (the words column is `@3xl:w-md`, 28rem → 398px of content; the
// `@3xl:min-w-min` widening for a long German name, 475px at most as
// measured there, stays under 498). Below that step the credo card stacks at
// the column's full width, so it reads 36px from a ~623px viewport to the
// ~960px split — a 768px tablet: 614px of column, 564px of content — and
// 30px on every laptop and desktop: the INVERSE of the page's other h2s. The
// credo card's size is the owner's open call (G2-R2 tier 1, react F1) — a
// `size` seam on SectionHeading or a wider words column are the roads; no
// atom change serves either.
// Why a container step does not reopen the self-scaling `title` refused: that
// refusal was of VIEWPORT prefixes — an atom guessing its width from a screen
// it cannot see. `@md:` queries the NEAREST ANCESTOR container — the band's
// ui/Container column, a ui/Card — both of which carry the mark by
// construction; that is the component responsiveness §6.5 prescribes, and
// `hero`'s `vw` term is already the precedent for a step that responds at
// all. The failure mode is the safe one: with no container above it the variant never
// matches and the heading stays 30px — it can fail small, never large.
// THE RESIDUAL WINDOW, accepted: a column reaches 448px at a viewport of 448px
// plus whatever surrounds it, while the h1 reaches 36px only at 571px. In
// between, the h2 may exceed the h1 by at most 4px — that ceiling needs a
// container as wide as the viewport itself at 448px, where the h1 sits on its
// 32px floor. Inside the band recipe the window is far narrower:
// ui/Container's 10vw gutters make a 448px column at a 560px viewport, where
// the h1 is already 35.6px — under half a pixel, over an 11px strip of
// viewport widths; a card sits inside that column and reaches the step later
// still. Unbolded like every elder; each named step brings its own line-height
// (36px, then 40px), so nothing else rides the row. The elders are
// byte-identical; only the union and one table row grew.
//
// Server-safe and zero-JS: no 'use client', no hooks, no state — slotClone is
// render-time cloneElement, which is why TextButton asChild already runs
// inside the zero-island Footer. Keep it that way.
// §6.3's typed-required aria-label does not bind here: the atom is
// non-interactive and its children are finished text (§8.1). It owns no
// hover/focus/disabled styling for the same reason — an asChild <a>'s focus
// ring belongs to the globals' :focus-visible net, not to this atom.

export type HeadingSize = 'title' | 'section' | 'band' | 'page' | 'hero';
export type HeadingTone =
  | 'default'
  | 'inverse'
  | 'inverse-stroked'
  | 'inverse-outlined'
  | 'accent'
  | 'accent-idle';

type HeadingOwnProps = {
  /**
   * Step on the display scale: 'title' — the Footer/Header title treatment —
   * 'section' — the section-title look SectionHeading passes (D2) —
   * 'band' — THE h2 step (2026-09-26, D48): 30px on a column narrower than
   * the container's 28rem `@md` step, 36px from it, so an h2 never outranks
   * the `hero` h1's 32px floor on a phone — the axis's one
   * container-responsive row (see the header) —
   * 'page' — the page-hero step the 404 band measured in (2026-09-07) — or
   * 'hero' — the fluid full-screen slogan step sections/Hero measured in
   * (2026-09-19; 32px → 72px with the viewport, see the header). The
   * axis is named by ROLE, not magnitude, so a step landing between two
   * existing ones is an addition instead of a rename (§6.6).
   */
  size?: HeadingSize;
  /**
   * Ink axis: 'default' → text-ink-strong, the ink every title wears ·
   * 'inverse' → text-ink-inverse, display text over the §15.1 scrim (the
   * Hero's slogans) · 'inverse-stroked' → the same white ink, bold and
   * tight, with the old page's 2px accent stroke behind the letterforms
   * (the Hero's default slogan face since 2026-09-20) · 'inverse-outlined' →
   * the same white ink at the plain weight with that stroke alone (the
   * Hero's third face, 2026-09-21) · 'accent' → text-accent-decorative,
   * ALWAYS bold: the lilac year labels over a doctor's courses
   * (sections/DoctorCourses, 2026-09-25). The ink is 4.44:1 on the page
   * ground — large-text only (§15.1) — and bold is what makes the 20px
   * `title` step large, so the weight ships inside the tone (see the
   * header) · 'accent-idle' → the same bold in text-ink-muted, accent's REST
   * twin: the course timeline's grey years (2026-09-26). The pair differs in
   * the ink alone, so a year switching between them never reflows.
   * Orthogonal to `size`.
   * @default 'default'
   */
  tone?: HeadingTone;
  /**
   * Render no element of Heading's own — the single child element you nest
   * (an <h2>, an <a href> built by localeHref()) BECOMES the heading and wears
   * these classes on top of its own. This is how a real document outline slot,
   * or the Header's brand anchor, gets the look: the atom never picks a
   * heading tag itself, and it can therefore never fake structure.
   */
  asChild?: boolean;
  /** The finished, already-translated text (§8.1); markup is allowed. */
  children: ReactNode;
};

export type HeadingProps = HeadingOwnProps &
  Omit<ComponentPropsWithRef<'p'>, keyof HeadingOwnProps>;

// The size rows carry the face and the step; the ink moved to its own table
// when the tone axis joined (2026-09-19). Concatenated size-then-tone, so
// `title` still emits `font-display text-xl text-ink-strong` byte for byte —
// the zero-diff-rewire invariant above, now pinned across two tables.
const sizeClasses: Record<HeadingSize, string> = {
  title: 'font-display text-xl',
  section: 'font-display text-3xl',
  // Container-responsive (header, D48): section's 30px under a 28rem column,
  // page's 36px from it — never over the hero h1's 32px floor on a phone.
  band: 'font-display text-3xl @md:text-4xl',
  page: 'font-display text-4xl',
  // Fluid: 32px floor (the 320px column), 3.5vw slope, 72px cap — the old
  // site's four-prefix staircase as one curve (header). `/tight` = 1.25.
  hero: 'font-display text-[clamp(2rem,1rem+3.5vw,4.5rem)]/tight',
};

const toneClasses: Record<HeadingTone, string> = {
  default: 'text-ink-strong',
  inverse: 'text-ink-inverse',
  // The old page's slogan face (header): bold, tight, the accent stroke
  // painted BEHIND the fill so the white letterforms keep their weight.
  'inverse-stroked':
    'text-ink-inverse font-bold tracking-tight [-webkit-text-stroke:2px_var(--color-accent-decorative)] [paint-order:stroke_fill]',
  // The stroke alone on the plain weight (header): thin letterforms, the
  // same accent edge behind them.
  'inverse-outlined':
    'text-ink-inverse [-webkit-text-stroke:2px_var(--color-accent-decorative)] [paint-order:stroke_fill]',
  // The lilac year labels (header, D16): the accent ink is 4.44:1 on the
  // page ground, so it travels with `font-bold` — the weight that makes the
  // 20px title step "large" text, where 3:1 binds. Never one without the other.
  accent: 'font-bold text-accent-decorative',
  // Its REST twin (header, D35): the same weight, the muted ink — so a year
  // switching between the two changes colour and nothing else.
  'accent-idle': 'font-bold text-ink-muted',
};

export function Heading({
  size = 'title',
  tone = 'default',
  asChild = false,
  className,
  children,
  ...rest
}: HeadingProps): ReactElement {
  const ownClasses = cx(sizeClasses[size], toneClasses[tone], className);

  if (asChild) {
    // The child element becomes the heading. The engine lives in ui/slot.ts
    // (owner decision fb-64) — single-child guard first, child-wins merge,
    // className merged last. NO disallow set, unlike Button's
    // BUTTON_ONLY_PROPS: a <p> has no element-only props, so everything the
    // caller passes is equally meaningful on an <h2> or an <a> — including
    // `id`, which a section's aria-labelledby pairs with.
    return slotClone('Heading', children, ownClasses, rest);
  }

  // Default host <p>, chosen by the dominant real consumer rather than by
  // semantics theory: all three non-asChild sites are the Footer's titles,
  // which deliberately open no outline slot.
  return (
    <p className={ownClasses} {...rest}>
      {children}
    </p>
  );
}
