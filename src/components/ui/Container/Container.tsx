import type { ComponentProps, ReactElement } from 'react';
import { cx } from '@/lib/cx';

// ui/Container — THE page gutter, and the only place it is spelled. Promoted
// 2026-09-04 on the owner-approved board .claude/plans/container-gutter.plan.md
// (fb-343, zero annotations) when the Footer's recorded rule-of-two promise
// came due: two sections shared the clamp by copy, the first Phase-4 page band
// is the THIRD consumer, and §15.15's SEQUENCING item (a) exists precisely so
// that page lane never improvises a third copy (§4's N≥3 row, the lib/cx.ts
// fb-307 precedent).
//
// ONE definition, TWO consumption modes — both live in this file:
//   · bands COMPOSE <Container>: a transparent measuring column inside their
//     own semantic, full-bleed outer (the recipe below). sections/Footer is
//     the first, every page band after it the rest.
//   · sections/Header IMPORTS `containerClasses`: its pill fuses the clamp
//     into the chrome element itself (sticky + z-50 + glass + the bar's OWN
//     container step), so it cannot compose this box without restructuring.
//     What it shares is the NUMBER, not the column — the parked dossier's own
//     recorded exception ("NOT the Header — the pill deliberately uses
//     margin-clamp, not a column"), kept visible rather than smoothed over.
// After this promotion the clamp has ONE definition in src/ — this file. Two
// test-side spellings exist ON PURPOSE and are not copies of the definition:
// Container.test.tsx's written-out byte-pin (the Eyebrow RECIPE convention)
// and Footer.test.tsx's cross-section pin. Container.test.tsx's own counter
// guards only THIS file; the src-WIDE fence — no fourth spelling anywhere —
// is tests/unit/gutter-single-spelling.test.ts (the fb-307 lesson: the cx
// promotion's aftermath was seven regrown copies nobody's file-local guard
// could see).
//
// ── THE NUMBERS THE CLAMP ACTUALLY PRODUCES. 10vw governs from a 160px
// viewport up to a 2000px one; the 1rem floor only exists below that, the
// 12.5rem ceiling only above it. Gutter per side: 320→32px · 390→39px ·
// 768→77px · 1280→128px · 1536→154px · 1920→192px · ≥2000→200px cap. Content
// column: 256px at the 320px accessibility stress width (§7), 1536px at 1920.
// ABOVE 2000px the column grows unbounded — practiced policy, accepted by both
// shipped bands because their grids are fr-based. Prose MEASURE is explicitly
// NOT this atom's problem (see the trigger list at the end).
//
// ── THE PAGE-BAND RECIPE (board Q3) — standing law; every page lane consumes
// it as a precondition, starting with Hero:
//
//   <main id="main" className="flex-1">      ← shell, full-bleed (approved, #69)
//     <section className="bg-…">             ← BAND outer: semantic element;
//       <Container className="py-…">           full-bleed paint + own vertical
//         …content…                            rhythm; NO gutter here
//       </Container>                         ← THE column: gutter + the
//     </section>                               container context every @-step
//     <section …>                            ← next band, same shape
//   </main>
//
//   1. THE OUTER OWNS PAINT AND RHYTHM; CONTAINER OWNS WIDTH AND MEASUREMENT.
//      Full-bleed media (the Hero's LCP image) is the outer's business; the
//      gutted text and controls ride inside. A band may place SEVERAL
//      Containers — text gutted, media bleeding — and the gutter definition
//      stays ONE.
//   2. COMPONENT RESPONSIVENESS = CONTAINER STEPS AGAINST THIS BOX, and
//      Tailwind's NAMED steps only (@3xl, @5xl — §3's untouched default scale;
//      the Header row-flip and the Footer info grid are the precedents),
//      calibrated against GERMAN, the longest language (§8.4 — the
//      GermanStress-story discipline). Media queries stay page-level layout
//      only (§6.5).
//   3. BANDS OWN THEIR OWN `py`, handed in through className — or worn by the
//      outer; the Footer precedent puts it on this inner box (`py-10`). PAGES
//      own any EXTRA inter-band rhythm (§6.4). No band ships outer margins.
//   4. SC 2.4.11 RIDES ALONG unchanged (app-shell board E13): at wide widths
//      the ≥128px gutters keep band content clear of the fixed corner discs
//      for free; at narrow widths a page lane still owes the "no standalone
//      focusable flush against the margins" keyboard walkthrough.
//
// ── THE CONTAINER MARK IS BUNDLED WITH THE GUTTER — the load-bearing choice
// (board Q2). Both original copies paired them, and SPLITTING them has a
// silent failure mode: a band that takes the gutter but forgets the mark
// leaves its `@3xl:`/`@5xl:` variants with no queryable ancestor — since the
// Phase-4 shell mount (#69) nothing above a band renders a container context —
// and container-gated styles then simply never match. The band renders its
// single-column mobile layout at every width, with no error and no console
// line: exactly the silent-regression class the §13 nets exist for. The
// pairing deletes it by construction.
// COST, stated honestly rather than discovered later: `container-type:
// inline-size` opens a stacking context AND a positioning scope on every band
// inner (the Header's own §4b consequence, known since NavMenu had to portal
// its sheet). Benign here — the app-shell layer board keeps z-scopes flat at
// body level (P1–P3), and a band's inner context only scopes its own
// descendants — and usually WANTED, since absolutely-positioned children then
// resolve against the column rather than the page. No opt-out prop ships until
// a consumer proves the need.
//
// ── THE §6.4 NUANCE, argued so no reviewer flags it blind. `mx-[clamp…]`
// LOOKS like the outer margin §6.4 bans, but the ban's intent is an atom
// fighting its parent over sibling spacing — and here the margin IS the atom's
// product: a parent composes Container precisely to buy this spacing policy,
// the way it composes Eyebrow to buy a mono micro-label. (The parked dossier
// recorded the same argument for the old `mx-auto`, one promotion earlier.)
//
// ── WHAT THIS ATOM DELIBERATELY DOES NOT OWN, each rejection with a named
// re-open trigger, so a page lane can tell "not decided yet" from "decided no":
//   · VERTICAL PADDING — band rhythm, the caller's (recipe rule 3).
//   · BACKGROUND — the full-bleed outer's job (recipe rule 1).
//   · WIDTH PRESETS — the clamp IS the width policy (fb-171: "chrome edges
//     align, no second width system"), which supersedes the parked dossier's
//     `max-w-*` draft explicitly rather than silently. TRIGGER: the first page
//     lane whose content wants a NARROWER column than the clamp column
//     re-opens width as an ADDITIVE prop with a board note (§6.6 — a changed
//     default would be a break at every call site at once).
//   · `as` / `asChild` — landmarks stay the band's own markup, and the two-box
//     split IS the pattern; Footer.test.tsx pins it from the other side
//     (`not.toContain('@container')` on the footer root). An `asChild` would
//     exist to fuse the boxes back together, i.e. to reproduce the Header-pill
//     fusion that is this file's constant-export instead. TRIGGER: a real
//     fusion consumer arrives → `asChild` joins additively, board note first.
//   · PROSE MEASURE — a 1536px column at 1920 is no place for 1.125rem body
//     text, but the cure is PER-ELEMENT (`max-w-prose`-class utilities on the
//     text block inside the band), page-lane material adjacent to the
//     text-align doctrine (§15.15 b). Recorded here so no page lane bends the
//     gutter for it.
//
// No message keys and no t() (§8.1 — the children arrive finished), no state,
// no hooks, no 'use client': composing this atom must not cost the Footer its
// zero-island contract, and Container.test.tsx guards the directive's absence
// mechanically because no runtime assertion can see it (§16). §6.3's
// typed-required aria-label does not bind either — nothing here is
// interactive, and the box adds no semantics of its own.

/**
 * THE page gutter pair — the container context and the side margins, together,
 * as one string. Exported for the ONE consumer that needs the number without
 * the box (sections/Header's pill); everything else composes the component
 * below. Quoted nowhere else in src/, by construction and by test.
 */
export const containerClasses = '@container mx-[clamp(1rem,10vw,12.5rem)]';

/**
 * Props are the native `<div>` surface, unmodified: React 19 puts `ref` in
 * there as a regular prop, so there is no forwardRef ceremony and no own-props
 * layer to Omit against (§6.8). Not exported — the type IS
 * `ComponentProps<'div'>`, and re-exporting an alias would only invite a
 * second name for it.
 */
type ContainerProps = ComponentProps<'div'>;

export function Container({
  className,
  ...rest
}: ContainerProps): ReactElement {
  // §6.8 merge order: the atom's own classes first, the caller's className
  // LAST. A deterministic convention the tests pin — NOT a cascade mechanism
  // (attribute order never decides CSS specificity) — and the reason the
  // Footer's retrofit is byte-identical: `py-10` simply lands after the pair.
  return <div className={cx(containerClasses, className)} {...rest} />;
}
