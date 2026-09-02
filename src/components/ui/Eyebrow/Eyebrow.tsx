import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { cx } from '@/lib/cx';

// ui/Eyebrow — the mono micro-label that sits above a section title
// ("NE GĂSEȘTI" over "Vizitează clinica noastră"). Migrated from the old
// repo's ui/eyebrow, which was already a clean leaf: props in, UI out, no
// i18n read, no state. The rewrite is about vocabulary, not structure.
//
// This atom is the ONLY consumer of the JetBrains Mono token — §3 puts that
// font in the stack for "eyebrows/micro-labels" and nothing else, and
// src/fonts/index.ts says so in its own comment while declining to preload it.
// Everything mono in this codebase should route through here rather than
// re-typing the recipe: the old repo did re-type it (reviews-carousel spelled
// the identical five utilities inline on a live region), which is exactly the
// drift an atom exists to stop.
//
// v1 ships ONE step and no axes, following ui/Heading's rule — never invent a
// step without a measured consumer. The old repo carried a SECOND mono recipe
// (review-card's reviewer credential, 0.6875rem/0.12em) but neither ReviewCard
// nor ReviewsCarousel exists here yet; when their lane lands and measures a
// genuine second size, it joins as an additive `size` union with the default
// pinned forever (§6.6 — a changed default is a break at every call site at
// once). Until then a second step would be speculation with no consumer.
//
// The host is a hardcoded <p> — there is no `as` axis (owner fb-300,
// 2026-09-01: "best practice, like a senior react dev would want"). The old
// atom offered p|span|div, but every real site — SectionHeading's eyebrow,
// the carousel's live-region status, the review-card credential — is a <p>,
// so the axis had zero callers and would have shipped ui/Text's whole
// tag-generic escape hatch as dead API surface (§6.6: props are a public API,
// and an unused one still costs review, tests and compatibility forever).
// If an inline consumer ever materialises, `as` joins ADDITIVELY with the
// default pinned to 'p' — the same growth rule Heading uses for its size
// union — breaking nobody.
//
// THE RECIPE, and why it is not the old site's:
//   font-mono      the §3 role font, this atom's whole reason to exist
//   text-sm        14px. Owner decision 2026-09-01. The old site ran 12px
//                  against a 16px body; §15.1 raised the body base to
//                  1.125rem/18px for the §1 older audience, so holding 12px
//                  would have made the eyebrow proportionally SMALLER than it
//                  ever was (0.67 vs the old 0.75 ratio). 14px/18px = 0.78
//                  restores it.
//   font-medium    500, as the old atom had. The mono subset carries 100–800.
//   tracking-widest 0.1em. Owner decision 2026-09-01. The old site used an
//                  arbitrary tracking-[0.18em]; this repo has ZERO arbitrary
//                  tracking values and §3 leans deliberately on Tailwind's
//                  untouched default scale, so the eyebrow stays on the scale.
//                  Tighter than the old site — a deliberate, recorded change.
//   text-ink-muted #5b554f on #ffffff = 7.35:1, clearing §9's 4.5:1 with room.
//                  The old `text-fg-muted` token does not exist in this repo.
//   uppercase      CSS, never the string — see below.
//
// UPPERCASE IS A CLASS, NOT A toUpperCase() CALL. The message files hold
// "Ne găsești" in sentence case and CSS does the shouting. Three reasons, all
// load-bearing here: translators keep authoring natural Romanian instead of
// SHOUTED strings; a locale that must not uppercase drops one utility rather
// than forking a message; and case mapping stays the browser's job, which
// matters for a Romanian site whose Ș/Ț have their own comma-below uppercase
// forms (U+0218/U+021A — both in the subset, verified by the diacritics
// fixture in the tests).
//
// Ink is fixed at muted: all three mono sites in the old repo are muted, and
// no second ink has a consumer. A hero eyebrow over the §15.1 scrim would
// arrive as this atom's OWN additive tone prop when that consumer exists,
// never as a caller className override (§6.8 bans restyling internals).
//
// No leading-*, no margin (§6.4 — the consuming section's root gap owns the
// distance to the title: SectionHeading's `flex flex-col gap-2`), no sm:/lg:
// self-scaling (§6.5 — an atom cannot see its container).
// Server-safe and zero-JS: no 'use client', no hooks, no state — an <Eyebrow>
// costs the visitor zero bytes of JavaScript (§16).
// §6.3's typed-required aria-label does not bind: the atom is non-interactive
// and its children are finished text (§8.1). Native aria-* attributes still
// spread through for genuine edge cases (a live-region eyebrow passes
// aria-live and it lands on the <p>).

type EyebrowOwnProps = {
  /** Finished, already-translated text (§8.1) — never a key, never t(). */
  children: ReactNode;
};

export type EyebrowProps = EyebrowOwnProps &
  Omit<ComponentPropsWithRef<'p'>, keyof EyebrowOwnProps>;

// One step, one string. Named rather than inlined so the tests can assert the
// whole className byte-for-byte and catch a silent utility creeping in.
const RECIPE =
  'font-mono text-sm font-medium tracking-widest text-ink-muted uppercase';

export function Eyebrow({
  className,
  children,
  ...rest
}: EyebrowProps): ReactElement {
  return (
    // §6.8 merge order: the atom's own classes first, the caller's className
    // LAST. A deterministic convention the tests pin — NOT a cascade
    // mechanism: attribute order never decides CSS specificity, and §6.8
    // limits caller utilities to positioning/spacing, so a real conflict has
    // no way to arise.
    <p className={cx(RECIPE, className)} {...rest}>
      {children}
    </p>
  );
}
