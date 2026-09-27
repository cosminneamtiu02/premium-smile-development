import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { Container } from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx/cx';

// sections/TintedBand — the doctor page's soft-lilac GROUND: the page colour,
// the Hero's eased fade into a lavender tint, the tinted middle that carries
// whatever a consumer puts in it, and the same fade back out. Nothing else —
// no heading, no words, no layout of its own. Built to the owner-approved
// contract of the doctor-pages run (.claude/section-runs/2026-09-21_11-58_doctor-pages
// — round 1's D7, round 2's D23 and D29 are the decisions this file
// implements). The ground was born inside sections/DoctorProfile on the
// owner's round-1 sentence ("this section as background should be a different
// colour than the previous 2 ones. like a soft mov [purple] and it should have
// that color transition used from hero to background on main page above and
// below") and lived there until it had a second consumer.
//
// ── RUN D29 · WHY IT IS ITS OWN COMPONENT NOW. Round 2f's ask (owner,
// 2026-09-26): "a section below cursuri si specializari, another lila section
// like the one below". Two bands spelling the same ground would be two more
// copies of the Hero's curve and two declarations of the tint that could drift
// apart one retune at a time. §4's sharing table has the row for it —
// IDENTICAL MECHANICS, SECOND CONSUMER ARRIVES → extract to the nearest tier
// both may import — and its section → section rule says which shape: a section
// MAY compose another section's PUBLIC COMPONENT, never import its internals.
// So the ground did not become a set of exported constants on DoctorProfile
// (DoctorStats would then be reaching into a sibling's internals); it climbed
// out whole, as a component both bands render. Its consumers:
//   · sections/DoctorProfile — the „Despre" prose beside the schedule card;
//   · sections/DoctorStats — the „în cifre" tiles under the courses (D30).
//
// ── TIER: SECTION, and a SHARED COMPOSITION rather than a band. It composes
// ui/Container, so /classify-component's rule 3 and §4's dependency direction
// keep it out of ui/ however primitive it looks (§4's "Promotion, corrected":
// a composite never promotes, reuse only schedules it earlier). Of §4's three
// sub-kinds it is the SectionHeading/Wordmark one — PROPS-IN, ZERO MESSAGE
// KEYS, zero data imports, no `t()`, no `Locale`: it has no words at all, so
// there is nothing to translate and no namespace it could belong to. No 'use
// client', no hook, no state, no handler either — it compiles into the static
// HTML of every page that uses it and ships zero bytes of JavaScript (§16).
// TintedBand.test.tsx proves the import surface and the absent directive from
// the source text, because no runtime assertion can see either.
//
// ── RUN D7 · THE GROUND: ONE VARIABLE, THREE BOXES, NO SEAM BY CONSTRUCTION.
// The band is `bg-page` throughout and declares ONE custom property, `--tint`
// (the accent-decorative at 30% over whatever is behind it — mixed with
// `transparent` rather than with a surface because this band paints over the
// page rather than over a card). Three boxes read it, in flow, top to bottom:
// the fade IN (page → tint), the tinted middle that carries the content, and
// the fade OUT (tint → page).
//   Why that cannot show the "ugly thin bar" the owner struck from the old
//   site's hero fade — the Hero's own argument, applied one tier out. There,
//   two translucent boxes meeting at a fractional row edge left a lighter
//   hairline where neither fully covered the pixel (anti-aliased coverage
//   composites, it does not add), and the cure was to make the veil ONE
//   element. Here the three boxes really are three, but every one of them is
//   the SAME translucent lavender over the SAME `bg-page`: the fade's last
//   stop is `var(--tint)` at 100%, which is byte-for-byte the middle box's
//   `bg-(--tint)`, and the fade's first stop is `transparent`, which is the
//   page the band is painted on. A rounding error at either seam can therefore
//   only expose a colour that is already there — the two sides of every edge
//   are equal by construction, not by two numbers that happen to agree.
//
// ── RUN D23 · 30 %, AND WHY THAT IS THE CEILING. The band shipped at ui/Card's
// 20% `--card-tint` ratio (the old site's own rgb(229 228 236)); the owner's
// round-2 pack verdict was "the faded section is too faded" (2026-09-25), so
// the ratio is half again the card's. THE MEASURED INK on the middle box
// (page #faf9f7 under 30% #7a6d9c = rgb(212 207 220), computed rather than
// eyeballed): `--ink` 9.7:1 · `--ink-strong` 11.7:1 · `--ink-muted` 4.8:1 —
// every text role clears §9's 4.5:1, the 14px mono eyebrow (ui/Eyebrow's
// `text-ink-muted`, which every consumer's SectionHeading puts on this ground)
// included. That eyebrow is the one line small enough for the question to be
// live, and it is the line that CAPS the tint: at 20% it read 5.5:1, at 40% it
// would read 4.2:1 and fail, so 30% is as far as this ground can go while the
// eyebrow keeps its muted ink. Darker still means a darker eyebrow ink first.
// The line tokens barely register on it — `line-subtle` 1.23:1, `line` 1.03:1
// — and the white `--surface` 1.53:1, so a white shape laid on this ground is
// edged by its own white far more than by any border it wears (DoctorProfile's
// ScheduleCard has the measurements for its framed card). A consumer choosing
// an ink for this ground reads it off this table; a consumer wanting a new one
// measures it first.
//
// ── THE FALLBACK IS THE PLAIN PAGE, and that is the deliberate trade. Every
// value above is a `color-mix()`, which an engine older than 2023 (Safari <
// 16.2, every iPhone frozen on iOS 15 — §1) cannot parse: `--tint` then
// resolves to nothing, `background-color: var(--tint)` is invalid at
// computed-value time and falls back to the initial `transparent`, and the
// two gradients drop out the same way — so such a visitor sees an untinted
// band on the page ground, with every word still on `--ink` over #faf9f7
// (14.1:1). ui/Card's own fallback — a SOLID accent — would be the wrong
// trade here: a card degrades to a lavender FRAME around white, while this
// band would degrade to body prose on solid #7a6d9c (2.4:1, unreadable).
// The unstyled band is the one that fails safe.
//
// ── THE TWO FADES ARE A KEEP-IN-SYNC PAIR, SPELLED OUT TWICE ON PURPOSE. Each
// is the Hero's ten-stop slow-in curve (`fadeClasses`, the shape the owner
// approved on the home page: invisible for its first fifth, never straight
// enough to show a corner, ~150 tonal steps over ~96px so it cannot band) with
// every `var(--color-page)` replaced by `var(--tint)` — nested `color-mix` is
// legal, and `color-mix(in srgb, var(--tint) 20%, transparent)` is simply the
// tint at a fifth of its strength. The only difference between the two
// constants is the gradient's direction. They are NOT built from one shared
// stop list at runtime, because Tailwind's scanner reads SOURCE TEXT: a class
// assembled from a template literal is a candidate no scanner ever sees, and
// the utility would silently never be generated. TintedBand.test.tsx pins the
// pair from the DOM instead — the fade-out's class must equal the fade-in's
// with `to_bottom` swapped for `to_top`, so the two can drift only through a
// test failure.
//   AND THE THIRD SPELLING IS THE HERO'S OWN, which makes this a KEEP-IN-SYNC
//   pair ACROSS FILES in §4's sense (bidirectional pointers, at least one side
//   test-pinned): sections/Hero's `fadeClasses` is the curve, this file's
//   `fadeInClasses`/`fadeOutClasses` are that curve with `var(--tint)` where
//   the Hero reads `var(--color-page)`. Hero.tsx carries the pointer back
//   (beside its own constant — repointed from DoctorProfile to this file in
//   D29's change-set), and TintedBand.test.tsx CROSS-PINS the two from the
//   Hero's source text: it reads the Hero's gradient through `?raw`,
//   substitutes the variable, and demands this band's fade-in equal it. A
//   retuned curve on the home page therefore turns this suite red in the same
//   change-set, which is the only thing that keeps „the Hero's curve" a true
//   sentence rather than a claim about the past. The extraction is what made
//   the pin cheap to keep: ONE spelling here serves every lilac band, where
//   two consumers would have meant two cross-pins and a third curve to forget.
//
// ── THE CONTENT SITS IN ui/Container (the PAGE-BAND RECIPE in Container.tsx's
// header): this semantic full-bleed <section> owns the paint, the Container
// owns the width, the gutter and the container-query context every
// consumer's @-steps measure. `children` lands straight inside the Container,
// with nothing of this band's own wrapped around it.
//   NO VERTICAL PADDING OF ITS OWN — the band's `py` rhythm is the
//   CONSUMER's, and it has to be: the padding cannot ride on the Container,
//   because an element cannot query its OWN size, so each consumer puts it on
//   the grid or column it renders one level in (the ClinicLocation precedent,
//   DoctorProfile's grid, DoctorStats' column). Two consumers with different
//   content want different rhythm, and a padding here would be one they both
//   had to undo. The fades are not that padding (next paragraph).
//
// ── NO OUTER MARGIN (§6.4): the page owns the rhythm between its bands. The
// two 6rem fade boxes are IN FLOW and belong to this band — they are its
// transition into and out of the page ground, not spacing — which is why they
// are ordinary children rather than absolute overlays: an absolute fade would
// have to overlap whatever band sits above, and its last pixel would then be
// over a colour this file does not control.
//
// ── NAMES PASS THROUGH. The native <section> surface is spread whole —
// `aria-label` and `aria-labelledby` INCLUDED — because whether the band is a
// region is a question about its CONTENT, and only the consumer has content:
// DoctorStats points `aria-labelledby` at its own h2 and becomes a named region;
// DoctorProfile refuses both attributes in ITS props (two equal halves, no one
// noun for both) and renders an unnamed <section>, which maps to a generic box.
// A ground that Omitted the names would force the first shape out; one that
// required them would force the second one out. It renders no heading of its
// own for the same reason — headings start at the consumer's h2.

type TintedBandOwnProps = Readonly<{
  /**
   * The consumer's content, rendered INSIDE ui/Container in the tinted middle
   * box — its own heading, its own grid, its own `py` rhythm (this band adds
   * none, the header's NO VERTICAL PADDING paragraph). REQUIRED as a key: a
   * lilac ground with nothing on it is a stripe of paint, and `<TintedBand />`
   * does not compile.
   */
  children: ReactNode;
}>;

export type TintedBandProps = TintedBandOwnProps &
  // Only `children` is Omitted from the native side (and re-added above as
  // REQUIRED). The two ARIA naming attributes deliberately STAY — the header's
  // NAMES PASS THROUGH paragraph: a consumer names its band by its own h2, or
  // refuses a name in its OWN props, and this ground serves both.
  Omit<ComponentPropsWithRef<'section'>, keyof TintedBandOwnProps>;

/**
 * THE TINT — the band's one variable, read by all three boxes (run D7).
 * `--accent-decorative` at 30% — half again ui/Card's 20% `--card-tint`
 * ratio, the owner's "too faded" verdict of 2026-09-25 (the header's D23
 * paragraph has the contrast arithmetic and why 30% is the ceiling) — mixed
 * with `transparent` rather than with a surface because this lavender is laid
 * over the page ground the band already paints.
 */
const tintClasses =
  '[--tint:color-mix(in_srgb,var(--color-accent-decorative)_30%,transparent)]';

/**
 * THE FADE IN — page ground → tint, the Hero's ten-stop slow-in curve with
 * `var(--tint)` where the Hero reads `var(--color-page)`. In flow, 6rem tall,
 * no `absolute` and no `z-`: it is a box of the band, not an overlay over the
 * band above it (the header's NO OUTER MARGIN paragraph).
 *
 * KEEP-IN-SYNC with `fadeClasses` in sections/Hero — cross-pinned from the
 * Hero's source in TintedBand.test.tsx (the header's third-spelling
 * paragraph).
 */
const fadeInClasses =
  'h-24 bg-[linear-gradient(to_bottom,transparent_0%,color-mix(in_srgb,var(--tint)_1%,transparent)_20%,color-mix(in_srgb,var(--tint)_4%,transparent)_30%,color-mix(in_srgb,var(--tint)_10%,transparent)_40%,color-mix(in_srgb,var(--tint)_20%,transparent)_50%,color-mix(in_srgb,var(--tint)_34%,transparent)_60%,color-mix(in_srgb,var(--tint)_52%,transparent)_70%,color-mix(in_srgb,var(--tint)_72%,transparent)_80%,color-mix(in_srgb,var(--tint)_90%,transparent)_90%,var(--tint)_100%)]';

/**
 * THE FADE OUT — the same ten stops read upwards (`to_top`), so its TOP edge
 * is the full tint the middle box ends on and its bottom edge is the page.
 * Spelled out in full rather than derived from the constant above: Tailwind's
 * scanner reads source text, and a class built from a template literal is a
 * candidate it never sees (the header's KEEP-IN-SYNC paragraph; the test pins
 * the two against each other).
 */
const fadeOutClasses =
  'h-24 bg-[linear-gradient(to_top,transparent_0%,color-mix(in_srgb,var(--tint)_1%,transparent)_20%,color-mix(in_srgb,var(--tint)_4%,transparent)_30%,color-mix(in_srgb,var(--tint)_10%,transparent)_40%,color-mix(in_srgb,var(--tint)_20%,transparent)_50%,color-mix(in_srgb,var(--tint)_34%,transparent)_60%,color-mix(in_srgb,var(--tint)_52%,transparent)_70%,color-mix(in_srgb,var(--tint)_72%,transparent)_80%,color-mix(in_srgb,var(--tint)_90%,transparent)_90%,var(--tint)_100%)]';

export function TintedBand({
  children,
  className,
  ...rest
}: TintedBandProps): ReactElement {
  return (
    // `relative` is the band's own positioning scope, declared with the tint
    // rather than discovered later: the three boxes are in normal flow today,
    // and anything a consumer pins to this band (a portrait bleeding out of
    // the intro above it) resolves against the band instead of the page.
    // §6.8 merge order: the band's classes first, the caller's className LAST.
    <section
      className={cx('relative bg-page', tintClasses, className)}
      {...rest}
    >
      {/* Page ground → tint. aria-hidden because it is paint: there is nothing
          in it to read, and an unlabelled box in the accessibility tree is one
          more stop on the way down the page. */}
      <div aria-hidden="true" className={fadeInClasses} />
      <div className="bg-(--tint)">
        <Container>{children}</Container>
      </div>
      {/* Tint → page ground, the mirror of the first box. */}
      <div aria-hidden="true" className={fadeOutClasses} />
    </section>
  );
}
