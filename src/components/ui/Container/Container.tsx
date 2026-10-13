import type { ComponentProps, ReactElement } from 'react';
import { cx } from '@/lib/cx/cx';

// ui/Container — THE page gutter, and the only place it is spelled. Promoted
// 2026-09-04 on the owner-approved board .claude/plans/container-gutter.plan.md
// (fb-343, zero annotations) when the Footer's recorded rule-of-two promise
// came due: two sections shared the clamp by copy, the first Phase-4 page band
// is the THIRD consumer, and §15.15's SEQUENCING item (a) exists precisely so
// that page lane never improvises a third copy (§4's N≥3 row, the lib/cx/cx.ts
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
// ── THE NUMBERS THE CLAMP ACTUALLY PRODUCES. The middle term has two slopes
// since 2026-10-09 (THE PHONE GUTTER, next): 5vw up to a 480px window, 10vw
// from 600px to 2000px, a straight ramp between; the 1rem floor only exists
// below 320, the 12.5rem ceiling only above 2000. Gutter per side: 320→16px
// · 390→19.5px · 440→22px · 480→24px · 540→42px · 600→60px · 768→77px ·
// 1280→128px · 1536→154px · 1920→192px · ≥2000→200px cap. Content column
// (no scrollbar, as on a phone): 288px at the 320px accessibility stress
// width (§7), 351px at the 390 Smartphone, 480px at 600, 614px at the 768
// Tablet, 1536px at 1920. ABOVE 2000px the column grows unbounded —
// practiced policy, accepted by both shipped bands because their grids are
// fr-based. Prose MEASURE is explicitly NOT this atom's problem (see the
// trigger list at the end).
//
// ── THE PHONE GUTTER (2026-10-09, CLAUDE.md §15.35). The owner, verbatim:
// "on phones there is smth like an allignment of left and right space that is
// established by an imaginary line … i want that space to remain but to be
// like 50% thinner … so that they cover the recovered space in width. this
// must be done only on phones." Until that day the middle term was one slope,
// 10vw at every width — 39px a side at 390, 32 at 320. It is now a clamp of
// its own, `clamp(5vw, 30vw − 7.5rem, 10vw)`:
//   · 5vw — EXACTLY HALF — up to a 30rem (480px) window: every phone held
//     upright (the largest, an iPhone Pro Max, is 440px wide). The column
//     grows 39px at 390 and 32px at 320, and every band, the Header pill and
//     the Footer with it.
//   · 10vw — EXACTLY THE OLD GUTTER — from a 37.5rem (600px) window: every
//     tablet held upright (the narrowest, a 7″ Android, is 600px; the iPad
//     mini 744) and everything wider draw byte-identical, the 12.5rem cap
//     included (Container.test.tsx measures both halves and the ramp).
//   · between them the straight line 30vw − 7.5rem, which meets 5vw at 30rem
//     and 10vw at 37.5rem — in the gap between the largest phone and the
//     narrowest tablet, where only a phone held sideways lands. The first cut
//     ran the ramp from 40rem to 48rem, Tailwind's own `sm` and `md`; the G2
//     react review (the same day) measured it reaching real tablets — an iPad
//     mini held upright went 74.4 → 68.4px a side and its staff tiles from one
//     a row to two, and a 7″ tablet got the whole phone half — against the
//     owner's "only on phones", so the ramp moved below 600.
// WHY A RAMP, NOT A STEP. "Half below 600, whole from it" is shorter to say,
// but at 600 the gutter would double in one pixel and the column SHRINK by
// 59px while the window grows (539 → 480) — a jolt in a widening window or an
// unfolding foldable. On the ramp the column grows at every width, per pixel
// of window: 1.0 below 320 (the floor holds), 0.9 to 480, 0.4 on the ramp,
// 0.8 to 2000, 1.0 past the cap.
// WHY NO MEDIA QUERY. This box carries no viewport variant (§6.5; the test
// "carries no viewport variant" pins it). The gutter was always written in
// viewport units — the one page-level number here — and the inner clamp keeps
// it a single expression with no breakpoint in the markup.
// WHY rem IN THE RAMP. 30rem and 37.5rem move WITH every rem step when a
// reader enlarges the browser's default font size: at a 20px default the
// ramp runs from 600 to 750px, and a 744 iPad mini then takes part of the
// phone gutter — more room for larger text, the way every `@`-step on the
// site already treats a large-text reader as a narrower screen. At the
// default 16px no tablet moves by a pixel.
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
//   5. A BAND THAT SCALES on a laptop or desktop wears BOTH band-scale strings
//      below — `bandColumnClasses` and `bandScaleClasses` — on its RHYTHM box,
//      the first box inside this one (the box that already carries its `py`).
//      A band that scales its OPENER alone wears them one box further in, on
//      a box holding the opener with the band's top step — the reviews band,
//      whose deck stays outside them (sections/ReviewsCarousel's THE OPENER'S
//      SCALE). THE BAND SCALE paragraph has the rule; it is never spelled in
//      a band.
//
// ── THE BAND SCALE (2026-10-02, CLAUDE.md §15.32 — promoted from
// sections/DoctorShowcase's D10 at its second, third, fourth and fifth
// consumers, §4's sharing table, first row). The owner, verbatim: "i want both
// section to in parallel on widening of screen to be responsive and adapt in
// parallel, so headings and eyebrows grow together, always have same size and
// extremley important for headings and eyebrows, same offset always". On a
// laptop or desktop the doctors band was drawn in a DESIGN PIXEL — its column ÷
// 1106, the column of the owner's 1401 × 1063 window — while the bands around it
// stayed in rem, so above that window its heading grew and theirs did not (36 →
// 49.5px at 1920 beside 36), and past the cap it centred while theirs stayed on
// the column's edge (x 504.5 against 200 at 2560, measured on develop's build).
// One rule, worn by every band below the Home hero and every band of the Team
// page, makes the two facts — one SIZE, one OFFSET — true by construction:
// every band draws in the SAME pixel, and caps and centres at the SAME width.
//   · `bandScaleClasses` — the design pixel and the remap, behind ONE variant
//     chain: globals.css's `scalable:` (a mouse or trackpad, in an engine that
//     registers custom properties) and THIS box's `@4xl` step floored at
//     896px. There the box declares `--scale-px` = min(column, 96rem) / 1106 —
//     `100cqw` read against THIS atom, the nearest container — and wears
//     `design-scale` (globals.css, THE DESIGN SCALE), which redraws every theme
//     length on it and inside it in that pixel. Below the step, on every touch
//     device and in an engine that cannot register, nothing is declared and
//     nothing remapped: the band is its rem self (§7), every pixel as before.
//   · `bandColumnClasses` — the cap and the centring: `mx-auto w-full` with
//     `scalable:max-w-[96rem]`, so past a 1536px column (the 1920 window's) the
//     band stops growing and centres in its column, as every scaled band does,
//     on one left edge. `w-full` keeps a rhythm box that sits in a FLEX column
//     from shrinking to its content (auto margins on a flex item size it to its
//     content); in the block flow of this box it changes nothing.
//   · THE ZOOM, `--band-zoom` (default 1): a box INSIDE a scaled band that must
//     draw at a fixed multiple of the band's pixel wears `bandScaleClasses`
//     again and sets a `--band-zoom` of its own beside it (an arbitrary
//     property class — never spelled here, where Tailwind would ship it as a
//     rule nobody wears) — its `--scale-px` is computed
//     afresh from the same column (a box cannot multiply its own inherited
//     value: `--scale-px: calc(var(--scale-px) * …)` is a cycle), so the
//     multiple holds at every width. ONE wearer: sections/DoctorStats' tiles,
//     at 9/8, so a tile's sentence reads the doctor card's quote size (16 × 9/8
//     = 18 design pixels) while the tile keeps its own proportions. ITS
//     PRECONDITION (the Opus review, 2026-10-02): the zoomed box must have
//     THIS atom as its nearest size container — `100cqw` and the `@4xl` gate
//     both read the nearest one, so inside a ui/Card, a doctor card's inset or
//     a ribbon station (each a container of its own) the gate would test that
//     box, never open, and the zoom would silently do nothing.
//   · THE FLOOR, `--band-floor` (default 0px): a band that must never draw
//     SMALLER than the theme sets a `--band-floor` of its own on its rhythm
//     box, beside the two strings (an arbitrary property class again — never
//     spelled here), and its pixel is max(floor, column / 1106 × zoom): under
//     the reference the band draws exactly as the theme does, past it it grows
//     like every scaled band. ONE wearer: sections/PriceList, at 0.0625rem —
//     1rem / 16, the theme's own pixel at ANY root, so under the reference a
//     larger default font size and a browser zoom enlarge the price rows as
//     rem does (the owner's delegated decision, 2026-10-02: "decide for me on
//     decisions and create pr" — his own BACKLOG entry asks for LARGER price
//     text for older patients, never smaller; CLAUDE.md §15.32 round 2).
//     Unregistered and INHERITED like the zoom, so tests/unit/design-scale.test.ts
//     fences who may name it; it is read where `--scale-px` is declared, so
//     it belongs on the box that wears `bandScaleClasses`. It is NOT
//     multiplied by the zoom: a zoomed box inside a floored band would floor
//     at the band's own pixel, not at its multiple — so the two must not nest,
//     and today they cannot (the census holds the floor's one setter and the
//     zoom's to two other files).
// THE NUMBERS — REFERENCE 1106, CAP 96rem, STEP max(@4xl, 896px) — and what
// the regime trades (a browser zoom, the user's default font size, the jump at
// the step, the typeface's optical size) are argued and measured where they
// were born: sections/DoctorShowcase's D10. tests/unit/design-scale.test.ts
// holds both strings to ONE spelling, here, and every wearer to an import of
// them.
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
// COST, stated honestly rather than discovered later — and CORRECTED on
// 2026-09-29 (the price-list lane's round 5, on the owner's word; ui/Card's
// own COSTS sentence carries the dates and the first measurement). This
// paragraph first said that `container-type: inline-size` opens a stacking
// context AND a positioning scope on every band inner, "usually WANTED, since
// absolutely-positioned children then resolve against the column". That is
// true of only SOME of the engines that read it. The mark used to imply
// LAYOUT containment; the CSS Working Group took that out in July 2024 and
// engines followed — Chrome from 129, Safari from 18.4 — while an iPhone on
// iOS 16 to 18.3 still does the opposite. MEASURED on the built services
// page, Chromium 151 and WebKit 26.5, in a 1366×633 window: a `fixed inset-0`
// box placed inside a band's Container measures the whole window. So a band
// inner's scope DEPENDS ON THE ENGINE, and nothing may rely on it either way:
// a band that positions something against its column says `relative` itself,
// and one whose box must ESCAPE the column keeps that box outside the
// Container (sections/Hero's picture). AUDITED the same day — every page
// type, at 390 and at 1366, both engines: no painted box on this site
// resolves differently under the two models (four 1px `sr-only` spans on the
// doctor page are the only boxes that do). What the mark applies in EVERY
// engine is inline-size containment and an independent formatting context.
// No opt-out prop ships until a consumer proves the need.
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
 * below. Quoted nowhere else in src/, by construction and by test. The
 * margins are half as wide on a phone (THE PHONE GUTTER, the header).
 */
export const containerClasses =
  '@container mx-[clamp(1rem,clamp(5vw,30vw_-_7.5rem,10vw),12.5rem)]';

/**
 * THE BAND SCALE's pixel (the header's THE BAND SCALE): on a laptop or desktop
 * column of max(56rem, 896px) the box wearing it declares the design pixel —
 * min(column, 96rem) / 1106, times `--band-zoom` (1 unless a box says
 * otherwise), never under `--band-floor` (0px unless a band says otherwise)
 * — and redraws every theme length on it and inside it in that pixel. The CAP is spelled here and in `bandColumnClasses` (KEEP IN SYNC;
 * tests/unit/design-scale.test.ts holds the two equal). ONE static string per
 * class: Tailwind reads class names from source text.
 */
export const bandScaleClasses =
  'scalable:@4xl:@min-[896px]:[--scale-px:max(var(--band-floor,0px),calc(min(100cqw,96rem)/1106*var(--band-zoom,1)))] ' +
  'scalable:@4xl:@min-[896px]:design-scale';

/**
 * THE BAND SCALE's column (the header's THE BAND SCALE): a full-width box,
 * capped at 96rem wherever a scaled design may apply, centred past it — one
 * left edge for every scaled band on the page.
 */
export const bandColumnClasses = 'mx-auto w-full scalable:max-w-[96rem]';

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
