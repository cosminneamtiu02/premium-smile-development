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
// atom that cannot see its container.
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
//
// Server-safe and zero-JS: no 'use client', no hooks, no state — slotClone is
// render-time cloneElement, which is why TextButton asChild already runs
// inside the zero-island Footer. Keep it that way.
// §6.3's typed-required aria-label does not bind here: the atom is
// non-interactive and its children are finished text (§8.1). It owns no
// hover/focus/disabled styling for the same reason — an asChild <a>'s focus
// ring belongs to the globals' :focus-visible net, not to this atom.

export type HeadingSize = 'title' | 'section' | 'page' | 'hero';
export type HeadingTone =
  'default' | 'inverse' | 'inverse-stroked' | 'inverse-outlined';

type HeadingOwnProps = {
  /**
   * Step on the display scale: 'title' — the Footer/Header title treatment —
   * 'section' — the section-title look SectionHeading passes (D2) —
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
   * Hero's third face, 2026-09-21). Orthogonal to `size`.
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
