import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { cx } from '@/lib/cx/cx';

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
// v1 shipped ONE step and no axes, following ui/Heading's rule — never invent a
// step without a measured consumer. The old repo carried a SECOND mono recipe
// (review-card's reviewer credential, 0.6875rem/0.12em) but neither ReviewCard
// nor ReviewsCarousel existed here then; the rule recorded for the day a lane
// measured a genuine second size was that it joins as an additive `size`
// union with the default pinned forever (§6.6 — a changed default is a break
// at every call site at once).
//
// 'card' JOINED 2026-10-10 by that rule, with sections/PersonnelCard as its
// measured consumer (its D20 — the doctor card's phone header). On a phone
// the doctor's specialty now spans the card ABOVE a row of a round photo and
// the name, and the owner picked the rendition that drew it at 12px — then
// asked for it "like 10% bigger" (verbatim: "i'd go with bigger face but i
// also want eyebrow like 10% bigger. get to implementing it"): 12 × 1.1 =
// 13.2px, 0.825rem, on a `snug` 1.375 line (18.15px) — the rendition's
// 1.38 ratio on Tailwind's own leading scale — in a container under 24rem,
// and the default's 14px on its own 20px line from there up, because the
// owner's other sentence was "On tablet and desktop it's fine and should
// remain as is". So 'card' is the DEFAULT RECIPE plus ONE token, a container
// override, `@max-sm:text-[0.825rem]/snug`, every utility of the default
// kept; the test file pins the two strings apart by exactly that token, and
// measures 13.2px under a 24rem container and the default's 14px from it.
// WHY TODAY'S LOOK PLUS AN OVERRIDE (the G2 fold of 2026-10-10, ui/Heading's
// `name` row the twin): an engine WITHOUT container queries (Safari and every
// iPadOS 15 browser) ignores every container row, so it draws the base — and
// with the default as the base it draws the site's one 14px eyebrow, as it
// did before the step existed. With container queries the base and the
// override compute exactly as a `@sm` step would.
// It is the one step of this atom under 14px, and the default's own
// arithmetic (THE RECIPE below — 14px against the 18px body) does not bind it:
// on a phone the card's specialty no longer stands over a section title but
// over a 24px name beside a 112px photo, and the owner judged that pairing by
// eye, on the rendered card.
// WHY A CONTAINER STEP IN AN ATOM: the size answers to the box the eyebrow
// is in, never to the screen — the override queries the nearest
// `@container`, the doctor card's INSET (PersonnelCard D17) — which is the
// component responsiveness §6.5 prescribes, and ui/Heading's `band` row is
// the precedent for an atom that reads its container. The failure mode is the
// safe one: with no container above it — or no container queries at all —
// the override never matches and the label is the default's 14px. Named by
// ROLE (a card's specialty on a phone), never by its pixel size, so a third
// step joins beside it without a rename.
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
// No leading-* utility on either step — the default's `text-sm` brings its
// own line-height, and the 'card' row's one line-height rides its size token
// as a `/snug` modifier, where the size is (the ui/Heading `hero` row's
// shape), under 24rem only — no margin (§6.4 — the consuming section's root
// gap owns the distance to the title: SectionHeading's `flex flex-col
// gap-2`), no sm:/lg: self-scaling (§6.5 — an atom cannot see the viewport's
// meaning for its box; the 'card' row's one CONTAINER override is the answer
// §6.5 allows, above).
// Server-safe and zero-JS: no 'use client', no hooks, no state — an <Eyebrow>
// costs the visitor zero bytes of JavaScript (§16).
// §6.3's typed-required aria-label does not bind: the atom is non-interactive
// and its children are finished text (§8.1). Native aria-* attributes still
// spread through for genuine edge cases (a live-region eyebrow passes
// aria-live and it lands on the <p>).

/** The eyebrow's steps, by ROLE: 'default' — every eyebrow on the site, the
 *  one 14px step — and 'card' — a doctor card's specialty on a phone, 13.2px
 *  in a container under 24rem and the default's own 14px from it, and
 *  wherever container queries are not understood (2026-10-10, PersonnelCard
 *  D20; see the header). */
export type EyebrowSize = 'default' | 'card';

type EyebrowOwnProps = {
  /**
   * The step (see the header): 'default' — the site's one eyebrow, 14px —
   * or 'card' — the doctor card's specialty: 13.2px on a snug line in a
   * container under 24rem, exactly 'default' from it. Pinned to 'default'
   * FOREVER, so growth never restyles a bare <Eyebrow> (§6.6).
   * @default 'default'
   */
  size?: EyebrowSize;
  /** Finished, already-translated text (§8.1) — never a key, never t(). */
  children: ReactNode;
};

export type EyebrowProps = EyebrowOwnProps &
  Omit<ComponentPropsWithRef<'p'>, keyof EyebrowOwnProps>;

// One string per step, each WHOLE: Tailwind reads class names from source
// text, so a step assembled at runtime would ship no CSS. Named rather than
// inlined so the tests can assert the whole className byte-for-byte and
// catch a silent utility creeping in. `default` is the v1 recipe to the byte;
// `card` is that recipe plus ONE container override, the 13.2px size under
// 24rem, last (the header's 'card' JOINED paragraph). A Record<EyebrowSize,
// …>, so a third step cannot compile until it names its string (the
// ui/Heading growth gate).
const RECIPE: Record<EyebrowSize, string> = {
  default:
    'font-mono text-sm font-medium tracking-widest text-ink-muted uppercase',
  card: 'font-mono text-sm font-medium tracking-widest text-ink-muted uppercase @max-sm:text-[0.825rem]/snug',
};

export function Eyebrow({
  size = 'default',
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
    <p className={cx(RECIPE[size], className)} {...rest}>
      {children}
    </p>
  );
}
