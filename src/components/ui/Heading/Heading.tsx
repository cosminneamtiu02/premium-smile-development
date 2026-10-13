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
// 'slogan' JOINED 2026-10-01 with sections/Hero as its measured consumer
// (owner, the hero-aura lane — verbatim: "on laptop it looks decent. on
// tablet it looks very good, on phone it loks good. so leave on phone as
// is, on tablet is perfect, but adapt text component raports in sizing for
// laptop and desktop as on tablet, as it looks very good there"): `hero`
// gave the opener's slogan the tablet's 42.88px — 5.58 % of a 768px
// viewport — and then FLATTENED: 4.75 % at 1280, 4.54 % at 1536 and 3.75 %
// at 1920, where the 72px cap bound (MEASURED on the built export; the
// words block was capped at 896px as well, so on a desktop the slogan
// wrapped inside the left half of the screen). The new step is TWO
// STRETCHES in one expression, `clamp(2rem, max(1rem + 3.5vw, 5.5833vw),
// 6.7rem)`: below the tablet `hero`'s own curve, byte-for-byte in VALUE
// (the phone's 32px floor; 42.88px at 768, where the two terms are equal
// and the first is the larger under it), and from the tablet up the
// tablet's own RATIO, 5.5833vw = 42.88 / 768 — the slogan is the tablet's
// slogan scaled: 71.5px at 1280, 85.8px at 1536, 107.2px at 1920, where the
// cap holds it (6.7rem IS that 1920 value; past the desktop sampling point
// the curve stops, as ui/Container's gutter stops at 12.5rem from 2000px —
// the cap is the lever if a wider screen should keep scaling). Still ONE
// curve and still no prefix: a `max()` inside a `clamp()` is one expression
// the engine evaluates per viewport, not a staircase, and the `vw` licence
// is `hero`'s. Under a larger root font size the `1rem` term carries the
// first stretch further right before the ratio takes over — continuous
// either way, since the max of two continuous terms is continuous.
// WHY A STEP BESIDE `hero` AND NOT `hero` RESHAPED: `hero` stopped being
// the slogan's alone on 2026-09-26 — §15.24 made it THE h1 step, worn by
// the doctor page's name (sections/DoctorIntro, then inside a 28rem words
// column) and the 404 title. The lane's first differential reshaped `hero`
// itself and moved 22 cells the owner never pointed at — Pages/Doctor,
// Sections/DoctorIntro and Pages/NotFound at 1280 and above, a doctor's
// name heading for 107px in a 448px column. A step named by its ROLE and
// added beside (§6.6's additive growth) moves exactly the opener; the
// relation is pinned in the test file (the slogan curve's floor and first
// stretch ARE `hero`'s), and `hero` emits byte-exactly what it always did.
// The SloganStep story's play reads the curve off the engine: the one
// proof that a nested `max()` reached the browser as valid CSS.
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
// 'inverse-aura' JOINED 2026-10-01 with sections/Hero as its measured
// consumer (owner, verbatim: "the ones that is white on interior and has a
// lila aura shadow as top bar around letters and with that lilla contour
// and i think it is in bold. implement that bold too. so a searate heading
// stile implemented here which is atm used only in this component but
// likely to be reused in the future"): the old page's slogan AS THE OWNER
// SEES IT. The old hero measured `font-bold tracking-tight` (its heading
// atom's level 1) + white ink + a 2px lavender stroke behind the fill + a
// 24px DARK drop shadow (`0 2px 24px rgba(20,15,30,.35)` — a blurred dark
// edge under a lilac rim, which the eye reads as a lilac aura); the owner
// named the pill's lavender glow (`--shadow-aura`, the aura of §15.1) as the
// thing around the letters, so this row carries THAT and not the dark
// shadow: the white, accent-stroked letterforms plus a lilac halo as the
// text-shadow — at the PLAIN weight: the bold he first described went on
// his word the same day, on the pack ("drop the bold."), and the tight
// tracking with it, as the pair came and as 'inverse-outlined' already
// pairs them, so the row is 'inverse-outlined' plus one token. TWO CENTRED
// LAYERS,
// in em: a wide one, 0.28em at 60 %, and a tight one, 0.08em at 40 %, both
// mixed from `--color-accent-decorative` (§15.1's display role; the aura
// token mixes from the same variable, so the hue confirm re-tints both at
// once). Em and not px, because the step this tone is worn on runs 32 →
// 107px: a 22px glow is a cloud round a phone's letters and a hairline
// round a desktop's, while 0.28em is 9px and 30px — the same share of the
// letter — judged on the built page at 390, 1280 and 1920 (the lane's
// probes, three glows compared at each). Centred (`0 0`), not the pill's
// `0 8px`: the pill's offset reads as a drop glow under a box; on letters
// the same value read as a drop shadow, and the owner's word was "around".
// `text-shadow` is painted by the ELEMENT, so this row's own declaration
// outranks the one a wrapper hands down (sections/Hero's `wordsShadow`,
// which its three older faces still inherit). A TONE and not a size, for
// 'inverse-stroked''s reason; the elders are byte-identical. axe reads the
// stroke as the foreground here as on the two stroked tones — the AuraTone
// story records the exemption with the measurement.
// The `accent`/`accent-idle` year tones of 2026-09-25/26 left with the doctor
// page's year timeline, 2026-10-13 — CLAUDE.md §15.23.
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
// (`containerClasses`) — 90 % of the viewport under a phone's 5vw gutters,
// 80 % under the 10vw ones from a 600px window (its THE PHONE GUTTER,
// 2026-10-09): 30px on every upright phone's column, 36px from a ~520px
// viewport (~558 under a classic scrollbar — the gutter's arithmetic; 560 and
// ~579 until that day) — every band on a tablet or wider. A title inside a
// ui/Card answers to the CARD, whose root carries
// `@container` (Card.tsx `cardClasses`), and a card's content box is its
// border-box less 25px per side on every tone (Card.tsx's SUM RULE: 1 + 24,
// or 3 + 22 for `framed`), so a card title reaches 36px only on a card at
// least 28rem + 50px = 498px wide. The category cards clear it from a tablet
// up (564px of content at 768, 702px at 1280 — PriceMenu.tsx's table); a
// 20rem card never does (270px of content at most, 30px everywhere — the
// doctor page's schedule card, until it was dropped on 2026-10-13). Two
// cards rest at 30px beside wider neighbours, RECORDED: the
// price menu's „Categorii" (its `minmax(15rem,1fr)` track, 190px of content
// at 1280 — "one step under", PriceMenu.tsx's THE TITLE'S STEP IS `band`
// paragraph) at every laptop width, and the credo card's „Filozofia mea" on
// the narrower laptops only: beside the picture at DoctorIntro's `@3xl` its
// words column was `@3xl:w-md` (28rem → 398px of content, 30px everywhere)
// until DoctorIntro's D63 gave the card a track of up to 36rem (2026-10-01,
// the owner's "like 30% wider") — MEASURED on the built page, 30px at 1024 and
// 1280 (313 / 412px of content) and 36px from ~1366 up (456px and more). Stacked at the column's full width it reads 36px from a
// ~623px viewport to the ~960px split — a 768px tablet: 614px of column, 564px
// of content — as before. Its size was the owner's open call (G2-R2 tier 1,
// react F1), with a `size` seam on SectionHeading or a wider words column as
// the roads; the owner's wider card took the second, and no atom change
// served it.
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
// 32px floor. Inside the band recipe the window is narrower: ui/Container's
// gutters (THE PHONE GUTTER, 2026-10-09: 5vw a side up to a 480px window, a
// ramp to 10vw at 600) make a 448px column at a ~520px viewport, where the
// h1 is 34.2px — up to 1.8px, over a ~51px strip of viewport widths, 520–571
// (under the 10vw gutters until that day it was under half a pixel over an
// 11px strip, 560–571; the doctor page is where the h1 stands beside band
// titles, and four of them answer to that column); a card sits inside that
// column and reaches the step later still. Unbolded like every elder; each
// named step brings its own line-height
// (36px, then 40px), so nothing else rides the row. The elders are
// byte-identical; only the union and one table row grew.
//
// 'name' JOINED 2026-10-10 with sections/PersonnelCard as its measured
// consumer (its D20 — the doctor card's phone header). The owner had the
// card's phone layout reworked (verbatim: "i'd go with bigger face but i
// also want eyebrow like 10% bigger. get to implementing it" — the picked
// rendition drew the name at 24px beside a round photo) while "On tablet and
// desktop it's fine and should remain as is". So the step is `band` with ONE
// size under it, spelled as `band` itself plus ONE override:
// `font-display text-3xl @md:text-4xl @max-sm:text-2xl/tight` — 24px
// (`/tight`, 1.25 → a 30px line) in a container narrower than 24rem (384px),
// where the name shares its row with the photo, and from there up `band` to
// the computed value: `section`'s 30px with its own 36px line, then `page`'s
// 36px with its 40px line from `@md`. The 24px is Tailwind's own `text-2xl`
// (§6.6 — no invented size); `/tight` is the line-height the step spells
// where the size is, the `hero` row's own modifier, and the step of
// Tailwind's leading scale nearest the 1.2 the picked rendition set its name
// on: each line of a wrapped name stands 1.2px taller than the rendition's,
// where text-2xl's own 32px pair would stand 3.2px taller.
// WHY TODAY'S LOOK PLUS AN OVERRIDE, and not the small size as the base with
// `@sm` lifting it (the step's first spelling, the G2 fold of 2026-10-10):
// an engine WITHOUT container queries (Safari and every iPadOS 15 browser)
// ignores every container row, so the base is what it draws — and spelled
// this way the base is `band`'s 30px, the name every such engine drew before
// the step existed, instead of a 24px name nothing else on its page reads at.
// With container queries the two spellings compute the same (the override's
// condition, under 24rem, and `@md`'s, from 28rem, never overlap; the test
// file measures the step EQUAL to `band` at 24rem, 27.9rem, 28rem and 40rem).
// Under 24rem a `/` modifier sets the line-height itself and no
// `--tw-leading`, so nothing of the 30px line reaches the rows above it.
// WHY A STEP AND NOT A CLASSNAME (§6.8): a consumer's className positions an
// atom, it never re-sizes one — and the card's name is spelled ONCE for both
// of its kinds (NAME_STEP), so a size overriding `band` there would have to
// out-rank the step's own container rows in the stylesheet's order, the very
// cascade accident the axis exists to keep out of call sites. Named by ROLE —
// a person's name on a doctor card — never by its smallest size, so the day
// another card wants its name to give way to a picture it wears this row.
// THE FAILURE MODE IS `band`'s, to the pixel: with no container above it —
// or no container queries at all — the variants never match and the heading
// is `band`'s 30px. The elders are byte-identical; only the union and one
// table row grew.
//
// Server-safe and zero-JS: no 'use client', no hooks, no state — slotClone is
// render-time cloneElement, which is why TextButton asChild already runs
// inside the zero-island Footer. Keep it that way.
// §6.3's typed-required aria-label does not bind here: the atom is
// non-interactive and its children are finished text (§8.1). It owns no
// hover/focus/disabled styling for the same reason — an asChild <a>'s focus
// ring belongs to the globals' :focus-visible net, not to this atom.

export type HeadingSize =
  'title' | 'section' | 'band' | 'name' | 'page' | 'hero' | 'slogan';
export type HeadingTone =
  | 'default'
  | 'inverse'
  | 'inverse-stroked'
  | 'inverse-outlined'
  | 'inverse-aura';

type HeadingOwnProps = {
  /**
   * Step on the display scale: 'title' — the Footer/Header title treatment —
   * 'section' — the section-title look SectionHeading passes (D2) —
   * 'band' — THE h2 step (2026-09-26, D48): 30px on a column narrower than
   * the container's 28rem `@md` step, 36px from it, so an h2 never outranks
   * the `hero` h1's 32px floor on a phone — the axis's first
   * container-responsive row (see the header) —
   * 'name' — a person's name on a doctor card (2026-10-10, PersonnelCard
   * D20): `band`, one size smaller in a container under 24rem — 24px on a
   * 30px line — where the name shares its row with the round photo; `band`
   * itself on an engine without container queries (see the header) —
   * 'page' — the page-hero step the 404 band measured in (2026-09-07) —
   * 'hero' — the fluid full-screen step sections/Hero measured in
   * (2026-09-19; 32px → 72px with the viewport, see the header), THE h1
   * step since §15.24 (the doctor page's name, the 404 title) — or
   * 'slogan' — the Home opener's slogan step (2026-10-01): `hero`'s curve to
   * the tablet, the tablet's own ratio of the viewport from there, 32px →
   * 107px (see the header). The
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
   * Hero's third face, 2026-09-21) · 'inverse-aura' → the outlined face,
   * the plain weight, plus a lilac halo in two em-scaled layers mixed from
   * the display lilac (the Hero's DEFAULT face since 2026-10-01: "a lila
   * aura … around letters", then "drop the bold."). Orthogonal to `size`.
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
  // A doctor card's name (header, 'name' JOINED): `band`, and 24px on a
  // `/tight` 30px line in a container under 24rem — `band` itself wherever
  // container queries are not understood.
  name: 'font-display text-3xl @md:text-4xl @max-sm:text-2xl/tight',
  page: 'font-display text-4xl',
  // Fluid: 32px floor (the 320px column), 3.5vw slope, 72px cap — the old
  // site's four-prefix staircase as one curve (header). `/tight` = 1.25.
  hero: 'font-display text-[clamp(2rem,1rem+3.5vw,4.5rem)]/tight',
  // The Home opener's slogan (header, 'slogan' JOINED): `hero`'s curve to
  // the tablet — the same floor, the same slope — and the tablet's own RATIO
  // from there, 5.5833vw, held at the desktop sampling point's 6.7rem.
  slogan:
    'font-display text-[clamp(2rem,max(1rem+3.5vw,5.5833vw),6.7rem)]/tight',
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
  // The old page's slogan AS THE OWNER SEES IT (header, 2026-10-01): the
  // outlined face — the plain weight, the owner's "drop the bold." on the
  // pack — plus a lilac HALO: two centred glows mixed from the display
  // lilac, in em so the halo keeps its share of the letter at 32px and at
  // 107px alike. The <p>'s own shadow outranks a wrapper's inherited one.
  'inverse-aura':
    'text-ink-inverse [-webkit-text-stroke:2px_var(--color-accent-decorative)] [paint-order:stroke_fill] [text-shadow:0_0_0.28em_color-mix(in_srgb,var(--color-accent-decorative)_60%,transparent),0_0_0.08em_color-mix(in_srgb,var(--color-accent-decorative)_40%,transparent)]',
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
