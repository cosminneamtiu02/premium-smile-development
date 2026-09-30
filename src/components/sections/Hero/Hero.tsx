'use client';

import type { ComponentProps, ReactElement } from 'react';
import { ContactModalTrigger } from '@/components/sections/ContactModal/ContactModalTrigger';
import { Button } from '@/components/ui/Button/Button';
import { Container } from '@/components/ui/Container/Container';
import { Heading } from '@/components/ui/Heading/Heading';
import { Image } from '@/components/ui/Image/Image';
import { focusManners, useRotation } from '@/components/ui/use-rotation';
import type { ClockEnv } from '@/lib/clock/clock';
import { cx } from '@/lib/cx/cx';
import type { ImagePath } from '@/lib/image-path/image-path';
import { liveRegion } from '@/lib/rotation/rotation';

// sections/Hero — the Home opener: the old site's auto-iterating photo frame,
// rebuilt as the site's SECOND rotator on lib/rotation (owner dispatch
// 2026-09-19, epic #103, board .claude/plans/hero.plan.md — the old
// `composite/hero` is the requirements source, §17.2; inventory row 43 had
// already dropped its clock). A full-bleed stage of grey-veiled photographs
// UNDER the Header pill, filling the whole first screen (pack round 2, owner
// 2026-09-20), each slide a slogan over its picture, two calls to action, a
// row of beads that pick a slide, and a fade into the page ground at the
// bottom — nothing else, on the owner's word: "no stop play etc, just the n
// number of beads".
//
// ── IT IS A DUMB BAND (owner: "I populate it with path and text"), the
// PriceList shape: zero message keys, zero data imports, no `t()`, no
// `Locale`. Every visible word arrives finished — the slides with their alt,
// slogan and accessible name; the region's, the picker's
// and the two buttons' names; the services URL already built by
// `localeHref`. The ONE populator is the Home page (app/[locale]/(home)/
// populate.ts walks lib/hero-slides for one language and formats the
// „{index} din {total}" sentence there). Tier-wise: §4's props-in SHARED
// COMPOSITION sub-kind, composing ANOTHER section's public component
// (sections/ContactModalTrigger — the dossier model Header practices with
// Wordmark) and five atoms.
//
// ── THE WHOLE BAND IS THE ISLAND ('use client' on this file; §16's list gains
// it in this lane), and that is a measured departure from the two split
// precedents. PriceList kept its rows as inert HTML because only the menu
// card depended on the visitor; the reviews band kept a server-rendered
// heading and Container around its deck. Here every box depends on the
// active index — which picture is opaque, which slogan is readable, which
// bead is current — and the ONE static part, the two buttons, hydrates
// anyway (ContactModalTrigger is a client component). The focus manners must
// sit on the region <section> itself, so a server wrapper would have owned
// nothing but a tag. The static HTML still carries every slide, both buttons
// and the beads: a client component pre-renders too, and the first snapshot
// is the same on both sides (§16 rule 2 — the store is built pure, index 0,
// idle).
//
// ── ROTATION: lib/rotation's consumption law through ui/use-rotation, the
// shared shell this lane extracted (its header says what is shared). What
// this consumer decides: `intervalMs` 5 500 — THE OLD SITE'S OWN RHYTHM (its
// `DEFAULT_INTERVAL_MS = 5500`), on the owner's round-4 word (2026-09-20:
// "it should be way shorter") — and a FIRST DWELL of 1 500, so the first
// change is seen the moment the page is entered (round 5, the same day:
// "instantly once you enter the page you see it"; round 4 had the first
// beat at the same 5 500). Rounds 1–3 ran 8 000 / 10 000: the reading-time rider (§15.18)
// against the longest slide — then a slogan plus one supporting line = 14 words
// at the ~120 wpm of an older reader ≈ 7 s, plus the 1 s crossfade (G2
// a11y) — and a longer first dwell for the LCP picture; the owner watched
// the band three times and never saw it move. RECORDED: 5.5 s is under that
// rider for the longest slide; the two constants below are the lever.
// Independent clock, no group (§15.18's site default). Reduced motion
// declines the automatic start in lib/clock and the crossfade snaps
// (`motion-reduce:transition-none`); a hidden tab DISARMS the clock and a
// return re-arms it with a full interval — so after the visitor switches
// back to the page, the first change comes 5.5 s later, never at once.
//
// ── NO ROTATION CONTROL, AND NOTHING STOPS IT FOR GOOD — ON THE OWNER'S
// WORD. Round 1 took the reviews deck's exception (ReviewsDeck.tsx, NO
// ROTATION CONTROL): no pause button, a bead press stops for good. Round 2
// (owner, 2026-09-20: "I do not see it autoscrolling") moved THE HOVER
// SUSPENSION FROM THE REGION TO THE BEADS ALONE: this band IS the whole first
// screen, so a pointer at rest anywhere on it — where every mouse sits the
// moment a page has loaded — held the first picture for ever (measured on
// the dev server: one mouse move, then 12 s on bead 1). Round 3 (owner, the
// same day: "i want it to automatically resume even if you interact with
// it") removed the STOP FOR GOOD: a bead press lands on its slide and buys
// a full interval (`rotation.goto` — the law's manner for a rotator WITH a
// control; the shell's `handNavigation` is deliberately not used), and
// keyboard focus inside the region is a TRANSIENT hold that lifts when focus
// leaves, not the APG's sticky pause. The same round DROPPED EVERY POINTER
// HOLD — round 2's hover hold on the beads AND the law's click-focus hold
// — because MEASURED on the dev server a click leaves both the hand and the
// focus on the bead it pressed, and either one held the ring for as long as
// they stayed: the owner's "resume even if you interact" cannot survive a
// hand that rests where it clicked. So: `focusManners(rotation, {
// keyboardEntry: 'suspend', pointerEntry: 'none' })` on the region and NO
// `pointerManners` anywhere. What holds the ring, then: keyboard focus
// inside the band, a hidden tab, and reduced motion (which declines the
// automatic start altogether). WHAT THIS COSTS, RECORDED: SC 2.2.2 (Level
// A) asks for a way to pause, stop or hide motion that runs longer than
// five seconds — a keyboard has Tab, but a MOUSE or TOUCH visitor has no
// way to stop this band. That is the owner's call (§17.5), the third
// departure from lib/rotation's law on this band, pointed to from the law
// and from ui/use-rotation. `rotationControl()` in lib/rotation still waits
// for its first consumer.
//
// ── THE BEADS ARE BUTTONS WITH aria-current, NOT A TABLIST — lib/rotation's
// law decided it ("every dot is a Tab stop either way and the grouped form
// needs no roving focus; re-open if a picker ever exceeds about six dots").
// Each bead's accessible name is the SAME string as its slide's — the page
// formats `home.hero.slide` once per row and the row carries it. The beads
// come FIRST in the DOM (the APG order: controls before slides — a keyboard
// visitor can stop the motion before reading) and LAST in the picture
// (absolute, 8 % up from the stage's bottom, over the fade's invisible
// start — round 6). Hit box 24 × 44 around an 8px bead (SC 2.5.8 with
// slack); the active one is a 28px pill; the only motion is the bead's width
// and ink (200 ms, off under reduced motion) — nothing scales, the Button
// doctrine. KEEP-IN-SYNC with the ground's 0.40 (`groundClasses` below —
// the old site's own veil since round 3, §15.1's rider): the idle bead is
// white at 80 % over the worst-case ground — a white photograph at its 80 %
// resting opacity over the page ground, under 0.40: #989898 — which measures
// 2.40:1 by the letter (SC 1.4.11's 3:1 held at 3.75:1 under round 2's 0.55
// floor). The bead therefore wears a soft drop shadow — paint, not motion —
// so an 8px white dot stays a dot over a pale photograph; axe cannot
// measure a shadow, and the number above is recorded as the owner's call
// with the veil that caused it. Lighten the ground and it moves again.
//
// ── THE STAGE (board §3 — the reasons, one per line, are what the numbers
// are made of; pack round 2, owner 2026-09-20, moved the band UNDER the pill,
// lightened the veil and added the fade — every bullet below is the round-2
// shape):
//   · UNDER THE PILL, THE WHOLE FIRST SCREEN: the band pulls itself up by
//     the Header's FLOW BOX — `-mt-[calc(6rem+2px)]` = the pill's `mt-4` +
//     its `h-20` row + two 1px borders — so the first photograph starts at
//     the viewport's top edge and the glass pill floats over it (the old
//     site's `-mt-4` under its zero-height bar, the same idea); the stage is
//     then `min-h-svh` (`min-h-screen` = 100vh first, for engines without
//     `svh`): the SMALL viewport unit, so the URL bar's collapse never
//     resizes the hero (`dvh` would; the shell's sticky footer wants `dvh`,
//     this does not). THE SIXTH COUPLED SPELLING of the pill's reach,
//     registered in Header.tsx's mount contract — now two numbers in this
//     one file: the margin above, and the `minmax(8rem, 1fr)` first row
//     below, the least air the words keep from the stage's top when the
//     content is taller than the screen (8rem clears the 98px pill with 30px
//     to spare). A NEGATIVE OUTER MARGIN ON A BAND is a recorded departure
//     from the band recipe's "the outer owns rhythm" (§6.4 itself is atom
//     law): the overlap is THIS band's nature, not a page's spacing choice,
//     and one file holding both numbers is what keeps the coupling one
//     spelling. Whoever mounts it — the page, its story twin, the band's own
//     stories — mounts the Header above it, because the band assumes the
//     pill's flow box is there to slide under (without it the band starts
//     98px above its container, which a story canvas would clip).
//   · A MINIMUM, never a fixed height, and every text box in NORMAL FLOW:
//     four grid rows — a `minmax(8rem, 1fr)` spacer that is the picture
//     alone (row 1), the slides' WORDS stacked in one cell (row 2, each
//     `[grid-area:1/1]`, so the row is as tall as the tallest slogan), the
//     buttons (row 3) and a second spacer, `minmax(9rem, 1fr)` (row 4). THE
//     TWO SPACERS SHARE THE SLACK EQUALLY, so the block they enclose — the
//     slogan, the two buttons — has its MEDIAN ON THE SCREEN'S
//     CENTRE (owner, round 6, 2026-09-20: "the median of the whole thing
//     should coincide with the center of the screen on oy axis") — PLUS 8 %
//     OF THE SCREEN (round 7, the same day: "moved a little more downwards,
//     like maybe 5-10%"): the stage wears `pt-[16svh]` (a `16vh` twin for
//     engines without `svh`), and a padding ABOVE two equal spacers moves
//     their shared centre down by half of it, so the median sits at 58 % of
//     the viewport. The buttons' row ends flush; the words' Container wears
//     `pt-10` — the room the struck supporting line and its gap took, moved
//     ABOVE the slogan on the owner's round-9 word ("push downwards the
//     heading until right above the button and keep buttons in place"): the
//     block keeps its height, so the buttons stay where round 7 put them and
//     the slogan sits 24px (`pb-4` + `pt-2`) above them. Default's play pins
//     the rows' median to 58 % ±3px. The padding is inside
//     the `min-h-svh` box (border-box), so the stage is still exactly the
//     first screen; in the content-tall case the words simply keep 16svh +
//     8rem from the top. The beads and the fade are OUT OF FLOW (absolute at the
//     bottom, next bullets) so they cannot pull the block down; the bottom
//     spacer's 9rem minimum keeps the buttons above them when the content is
//     taller than the screen, as the top spacer's 8rem keeps the words under
//     the pill. A long German slogan at 320px can only push the stage taller;
//     it can never overlap the buttons or clip. The old site positioned its
//     text block absolutely with a clamp'd bottom offset, and that is exactly
//     the class of collision this shape deletes. EVERY GRID ITEM NAMES ITS
//     COLUMN (`col-start-1`): the ground below spans rows 2–4, and grid auto-
//     placement moves a row-locked item whose cells are already taken into a
//     NEW implicit column instead of on top of them — only a placement
//     definite in both axes may overlap.
//   · THE PICTURE ESCAPES TO THE STAGE. `ui/Image fill` is `position:
//     absolute; inset: 0`, and its containing block is the nearest
//     POSITIONED ancestor: the slide and the slides container are
//     deliberately unpositioned, so the photograph resolves against the
//     stage (`relative`) and covers all four rows while the slide's own box
//     is row 2 alone. It stays OUTSIDE ui/Container — a SIBLING of the
//     words' Container inside each slide (the band recipe's rule 1:
//     full-bleed media is the outer's business) — and on an older engine it
//     HAS to: `container-type: inline-size` used to imply layout
//     containment, which makes the Container a containing block and would
//     gut the photograph. CORRECTED 2026-09-29 (the price-list lane's round
//     5; ui/Card's COSTS sentence has the dates and the measurement): this
//     bullet first said "CANNOT", of every engine. Chrome from 129 and
//     Safari from 18.4 no longer read containment into the mark; an iPhone
//     on iOS 16 to 18.3 still does. Outside the Container the picture
//     resolves against the stage in all of them.
//   · TWO OPACITIES PER SLIDE, IN LOCKSTEP — the picture's wrapper and the
//     words' Container each wear the 1 s crossfade (the old site's, ease-in-
//     out, `motion-reduce:transition-none`); THE SLIDE ELEMENT ITSELF NEVER
//     FADES. Round 1 faded the whole slide — one attribute — but a mid-fade
//     opacity makes the slide a stacking context, and a stacking context is
//     a box nothing inside can leave: the words could then never paint above
//     a ground that sits OUTSIDE the slides, and the ground must sit outside
//     (two bullets down). Same `current`, same transition string, one style
//     recalculation: the two halves cannot drift.
//   · THE PICTURE IS LIGHT (owner, round 2: "the filter … should not be that
//     dark, it should be lighter"): `grayscale blur-xs` ON the picture's
//     wrapper — the old site's `backdrop-filter: grayscale(1) blur(3px)`
//     overlay produces the same pixels over a static photograph, but a
//     backdrop filter is re-composited on every scroll and opens a
//     containing block that once forced the old corner button into a
//     portal; a plain filter costs one paint. `blur-xs` = 4px, the on-scale
//     neighbour of the old 3px (§3: untouched scales). A blur bleeds
//     transparency at the edge, so the wrapper overshoots by 4px (`-inset-1`)
//     and the band's `overflow-clip` trims it (with the Safari ≤ 15
//     `overflow-hidden` twin, the ReviewsCarousel belt). The old 20 % wash
//     RETURNS as the picture's resting opacity: `opacity-80` over the band's
//     `bg-page` ground is the page colour at 20 % over the photograph — the
//     old `--bg` wash, same arithmetic, one property (the crossfade runs
//     0 → 0.8). NOTHING DARKENS THE PICTURE ZONE; round 1's uniform 0.55
//     over the whole stage is what the owner saw as "that dark". Known and
//     accepted: at the crossfade's midpoint both pictures sit at 0.4 and
//     36 % of the ground shows for an instant instead of 20 % — a faint
//     brightening the old site had in the same place (its slides crossfaded
//     over `bg-bg-subtle`).
//   · THE GROUND IS ONE STATIC ELEMENT, NOT PER SLIDE — a grid item spanning
//     rows 2–4 (words, buttons, the bottom spacer — i.e. to the stage's
//     bottom edge, under the absolute beads and fade), pulled 9rem up into
//     row 1 by `-mt-36`, whose background is ONE gradient: transparent at its
//     top, the veil from 8rem down, held to the stage's bottom. So every word,
//     button and bead sits on the veil BY CONSTRUCTION, whatever the
//     content's height: the dark stop is anchored to the words' own row, not
//     to a percentage of a stage whose height changes with the language —
//     1rem of full veil above the first slogan line, an 8rem run-up over the
//     picture. THE VEIL IS THE OLD SITE'S OWN 0.40 (round 3, owner: "still a
//     little too dark the filter, i want it lighter like in old webpage" —
//     the old gradient peaked at 0.40 at its bottom; round 2 held §15.1's
//     0.55 floor here and the owner saw it as too dark). That is BELOW the
//     locked floor: the owner's amendment of the owner's lock, recorded as
//     §15.1's rider — the `--scrim` token itself stays 0.55 for the modal's
//     backdrop, which is why this file spells its own value instead of the
//     token. By the letter: 0.40 black over a WHITE photograph at 80 % over
//     the page ground is #989898, where white ink measures 2.88:1 (§9's
//     4.5:1 held at 4.81:1 under 0.55). The old page's own legibility aid
//     returns with its number — a `text-shadow` on the words' wrapper
//     (inherited by the slogan, so no atom is restyled; the
//     lavender text-stroke is NOT ported) — and axe can measure neither.
//     ONE element because two translucent boxes meeting at a fractional row
//     edge leave a lighter hairline where neither fully covers the pixel
//     (anti-aliased coverage composites, it does not add) — the "ugly thin
//     bar" the owner struck from the old fade, killed by construction here:
//     nothing meets anything; the ramp, the veil and the fade's underside
//     are one paint. Painted by DOM ORDER: after the slides (so above their
//     pictures, positioned at z-auto) and before the buttons and the fade;
//     the words and the beads carry `z-10` to sit above it. `groundClasses`
//     is the lever.
//   · THE FADE INTO THE PAGE (owner, round 2: "a transition part where it
//     fades … towards a background color … do not port that thin line";
//     round 3: "a little smoother … maybe 10% longer … not like a balcony
//     … start like a little lower"; round 6: "just as thin as in the old
//     page"): ABSOLUTE at the stage's bottom, `h-[10%]` of the stage — the
//     old page's own `h-[10%]`, ~86px on a laptop (round 3's in-flow `h-27`
//     row is gone with the centring), a gradient from transparent to
//     `--page` over the ground. Round 2 ported the old site's five
//     front-loaded stops (8 % at 30 %, 30 % at 55 %, 70 % at 80 %): a curve
//     that idles, then runs into the page in its last fifth — a shelf, the
//     owner's "balcony". Round 3 EASES it: ten stops on a slow-in curve
//     (1 % at 20 %, 4 % at 30 %, 10 % at 40 %, 20 % at 50 %, 34 % at 60 %,
//     52 % at 70 %, 72 % at 80 %, 90 % at 90 %) — the first fifth is
//     invisible, so the transition the eye sees starts LOWER although the
//     row is taller, and no segment is straight enough to show a corner.
//     Across ~108px the tone runs through ~150 steps, more levels than
//     pixels, so it cannot band. Its bottom edge is `bottom-0` of the
//     stage — the same box's own edge, no rounding between two boxes — and
//     the band's own ground is `bg-page`: the old line was an absolute fade
//     over a stage of ANOTHER colour meeting the next section at the band's
//     edge; here the fade's last pixel, the band's ground and the next
//     band's ground are all `--page`, so no rounding can expose a strip of
//     anything else. THE BEADS are absolute too, `bottom-[8%]` (owner, round
//     6: "move the dots … lower") — their box sits over the fade's invisible
//     first fifth, on the veil, as the old dots sat on the fade's top edge.
//   · `[--focus:var(--ink-inverse)]` on the band — the first dark band on the
//     site. Every control inside draws its ring from `outline-focus` =
//     `var(--focus)`, near-black, invisible on the scrim. Remapping the ONE
//     semantic variable on this subtree is §3's theme mechanism in miniature
//     ("themes remap the same variable names additively — no renames, no
//     component edits"): the atoms are untouched, the ring is white here.
//   · THE BUTTONS' ROW is intrinsic, no breakpoint: `flex-wrap` with `*:grow
//     *:basis-64` sets two 16rem bases side by side wherever ~33rem of
//     column exist (a tablet's 614px, a notebook's 1024px), grown to equal
//     widths and capped by `max-w-3xl`; narrower, each takes its own row at
//     full width — the 320px stress width included. The atoms' `min-h` lets
//     a long DE/FR label wrap between words (§8.4); syllable splits are the
//     atoms' own ban (§15.14). The words column is capped `max-w-4xl`, the
//     old block's measure (720 → 1040px), per-element as the Container's
//     prose rule wants.
//   · `viewport-fit: cover` stays dormant (FloatingActions' caveat): the band
//     now starts at the layout viewport's top edge, but without that meta the
//     status-bar strip is outside the layout viewport altogether, so nothing
//     here reaches under it and nothing asks for the `env()` terms yet.
//   · THE FIXED CORNER DISCS — the AA gate lib/rotation's law tells a hero
//     consumer to NAME (SC 2.4.11 against the FloatingActions corner). Round
//     1 computed an overlap: with the buttons' row 76px above the stage's
//     bottom, the outline button's last 33 × 52 px sat under the WhatsApp
//     disc on a phone's first screen (390 × 844). The fade row (6rem) and
//     the beads now sit between the buttons and the bottom edge, so the row
//     ends 172px up. MEASURED after round 2 on the dev server: at 390 × 844
//     the services link's bottom edge (y 672) clears the WhatsApp disc's top
//     (708) by 36 px, at 768 × 1024 by 36 px too (852 vs 888), and the beads
//     — centred, ~72 px wide — never reach the corner column at any width.
//     What remains is the 320 × 568 stress case only (a 320-wide screen
//     just 568 tall: the content is taller than the screen, so the rows sit
//     wherever the scroll puts them): at scroll 0 the link's last 40 × 48 px
//     lie under the disc and part with the first scroll. Not a failure of
//     2.4.11 (never entirely hidden) nor of 2.5.8; the three levers round 1
//     offered (`pb-18 @xl:pb-0` on the row's div · a ≥ 88 px right inset at
//     phone widths · accept) stay the OWNER'S CALL for that one width. No
//     net sees it — neither story mounts FloatingActions. ROUND 6 moved the
//     block to the screen's centre, so on every screen tall enough to hold
//     the content the buttons sit mid-screen, far from the corner discs.
//   · TAB ORDER runs beads → Contact → Services, i.e. the bottom of the
//     picture before its middle: the APG's controls-before-slides order is a
//     DOM decision, the beads' placement a picture one, and SC 2.4.3 asks for
//     a meaningful sequence, not a top-to-bottom one (G2 react NIT, recorded).
//   · THE SLOGAN'S FACE (owner, round 6: "create like in the old page the
//     thick heading with border and use it here … keep in mind the current
//     heading"): ui/Heading's NEW `tone: 'inverse-stroked'` — the old page's
//     bold, tight-tracked slogan with a 2px stroke in the accent — was the
//     default from round 6; round 7 added an 'alternate' comparison mode
//     (the faces by slide index, so the owner could choose on the rotating
//     band), round 8 a third face (`outlined`: thin + border, ui/Heading's
//     `inverse-outlined`), round 9 narrowed the cycle to plain and outlined,
//     and ROUND 10 (2026-09-21) IS THE PICK: "keep just the thin with no
//     border heading" — `slogan` defaults to 'plain', the page passes
//     nothing, the comparison mode is gone, and 'stroked' / 'outlined' stay
//     as values (tests + the atom's stories). The words' text-shadow rides
//     every face.
//
// ── ONE STATIC h1, OUTSIDE the slides (lib/rotation's law; §9's one-h1
// rule): the page owns it, `sr-only`, the Services page's precedent. The
// slogans are display text on ui/Heading's 'hero' step at its default <p>
// host — never an outline slot, so nothing is announced as a heading every
// five and a half seconds.
//
// ── PROP RULES. `slides.length === 0` renders NOTHING (the PriceList and
// ReviewsCarousel answer); ONE slide renders the picture and its words with
// no region role-description, no beads and no clock (lib/rotation's two-item
// floor, derived from COUNT). `intervalMs`, `startDelayMs` and `env` are READ
// ONCE, AT MOUNT (ui/use-rotation) — remount with a `key` to change them.

/** One slide, every word finished (§8.1) — the page's populator builds these. */
export type HeroSlide = Readonly<{
  /** Stable id — the React key. */
  id: string;
  /** The picture under public/images/ (lib/image-path); rendered `fill`, 100vw. */
  src: ImagePath;
  /** What the picture shows (§11). */
  alt: string;
  /** The slogan — ui/Heading 'hero', inverse ink. */
  title: string;
  /**
   * The slide's accessible name AND its bead's — the same „{index} din
   * {total}" string (lib/rotation's law: one sentence, two uses), formatted
   * by the page because ICU formatting is a function and functions cannot
   * cross the server→client boundary.
   */
  label: string;
}>;

/** Every other word the band says, resolved by the page (§8.1). */
export type HeroLabels = Readonly<{
  /** The carousel region's accessible NAME — without it there is no region. */
  region: string;
  /** `common.carousel.role`, localized: what aria-roledescription announces. */
  role: string;
  /** `common.carousel.slideRole`, localized: the same, per slide. */
  slideRole: string;
  /** The beads' group name („Alege imaginea"). */
  picker: string;
  /** The primary call to action — opens the one contact dialog. */
  contact: string;
  /** The secondary call to action — the link to the services page. */
  services: string;
}>;

type HeroOwnProps = Readonly<{
  /** The ring, in order; the first row is the LCP picture. Empty renders nothing. */
  slides: readonly HeroSlide[];
  labels: HeroLabels;
  /**
   * The slogan's face: 'plain' (THE DEFAULT — the thin inverse ink, THE
   * OWNER'S PICK of 2026-09-21, round 10: "keep just the thin with no border
   * heading"), 'stroked' (the old page's bold slogan with a 2px accent
   * stroke, ui/Heading's `inverse-stroked`; round 6) or 'outlined' (the
   * plain weight with that border alone, ui/Heading's `inverse-outlined`;
   * round 8). Rounds 7–9 carried an 'alternate' comparison mode that cycled
   * the faces by slide so the owner could choose on the rotating band; the
   * choice made, it is gone. The two other faces stay as values (the tests
   * and the atom's stories exercise them) — the page passes nothing.
   */
  slogan?: 'plain' | 'stroked' | 'outlined';
  /** `localeHref(locale, '/services')`, built by the page (§15.13). */
  servicesHref: string;
  /** The rhythm in ms — this consumer's number (§15.18). READ ONCE, AT MOUNT. */
  intervalMs?: number;
  /** The first dwell in ms — longer than the rhythm on purpose. READ ONCE, AT MOUNT. */
  startDelayMs?: number;
  /**
   * TESTS AND STORIES ONLY — lib/clock's environment seam (reduced motion and
   * tab visibility as plain functions). The page never passes it: functions
   * do not cross the boundary, and the real browser is the right answer on
   * the real site. READ ONCE, AT MOUNT.
   */
  env?: ClockEnv;
}>;

export type HeroProps = HeroOwnProps &
  // The native <section> surface minus what the band sets AFTER the spread —
  // refused by the types rather than resolved by attribute order (the
  // ReviewCard / PersonnelCard precedent): the region's name and
  // role-description are the band's to set from `labels` (a caller's
  // `aria-labelledby` would outrank `aria-label` under accname and silently
  // rename the region); the two FOCUS manners are the shared shell's, spread
  // last, so a caller's handler would compile and never fire; and
  // `children` is not a slot here (content arrives as `slides`; without the
  // Omit a caller could nest something, type-check, and watch it vanish).
  // The pointer pair is NOT refused any more: since round 2 the band spreads
  // it on the beads, not the region, so a caller's `onPointerEnter` on the
  // section is an ordinary handler that fires.
  Omit<
    ComponentProps<'section'>,
    | keyof HeroOwnProps
    | 'children'
    | 'aria-label'
    | 'aria-labelledby'
    | 'aria-roledescription'
    | 'onFocus'
    | 'onBlur'
  >;

// The two numbers are exported for the tests. They leave a 'use client'
// module, so a SERVER module importing them would receive a client reference,
// not 5500 (the PRICE_MENU_ID lesson, §15.20 round 3) — the page never needs
// them: the defaults live in the destructuring below.
/**
 * The rhythm: the old site's own 5.5 s (owner, round 4, 2026-09-20 — "way
 * shorter"). The reading-time rider's number — 14 words at ~150 wpm = 5.6 s
 * plus the 1 s crossfade, 8 s at the ~120 wpm of an older reader — ran in
 * rounds 1–3 and is recorded in the header as superseded by the owner's word.
 */
export const HERO_INTERVAL_MS = 5_500;
/**
 * The first dwell: 1.5 s — the first change is seen at once on entering the
 * page (owner, round 5, 2026-09-20). A return from a hidden tab re-arms with
 * the delay that was pending, normally the full 5.5 s (lib/clock's rule).
 */
export const HERO_FIRST_DWELL_MS = 1_500;

/**
 * The 1 s crossfade the old site had — paint only, snapped under reduced
 * motion. Worn by the picture's wrapper AND the words' Container of every
 * slide, never by the slide itself (the header's TWO OPACITIES bullet).
 */
const slideMotion =
  'transition-opacity duration-1000 ease-in-out motion-reduce:transition-none';

/**
 * THE GROUND: transparent at the top, the veil from 8rem down, held to the
 * bottom — one paint under every word, button and bead (the header's THE
 * GROUND bullet). `-mt-36` pulls it 9rem into the picture row, so the veil
 * is reached 1rem above the first slogan line. THE VEIL IS 0.40, the old
 * site's own, spelled here and not as the `--scrim` token (0.55, the modal's
 * dim): §15.1's rider, the owner's call of 2026-09-20 — THE LEVER.
 */
const groundClasses =
  'relative col-start-1 row-start-2 row-end-5 -mt-36 bg-[linear-gradient(to_bottom,transparent,rgb(0_0_0_/_0.4)_8rem,rgb(0_0_0_/_0.4))]';

/**
 * THE FADE into the page ground: ten stops on a slow-in curve — invisible
 * for its first fifth, never straight enough to show a corner, solid `--page`
 * at its last pixel (the header's THE FADE bullet). Absolute at the stage's
 * bottom, a tenth of the stage tall — the old page's own thinness (round 6).
 *
 * KEEP-IN-SYNC PAIR (§4's sharing table: bidirectional pointers, one side
 * test-pinned) with sections/TintedBand's `fadeInClasses`/`fadeOutClasses`
 * — the SAME ten stops with `var(--tint)` in place of `var(--color-page)`,
 * because the doctor page's lilac ground arrives and leaves the way the home
 * page's stage does. That ground is ONE component every lilac band composes
 * (DoctorProfile, DoctorStats — extracted from DoctorProfile in the
 * doctor-pages run's D29), so the curve has one other spelling, not one per
 * band. The pin lives on that side: TintedBand.test.tsx reads THIS constant
 * through `?raw`, substitutes the variable and demands the two gradients
 * match, so retuning the curve here turns that suite red in the same
 * change-set instead of leaving two curves that only used to agree (G2 react,
 * 2026-09-21; moved with the ground, D29). The BOXES are each file's own —
 * this one is absolute at 10 % of the stage, that one is 6rem in flow — and
 * only the stop list travels.
 */
const fadeClasses =
  'absolute inset-x-0 bottom-0 z-10 h-[10%] bg-[linear-gradient(to_bottom,transparent_0%,color-mix(in_srgb,var(--color-page)_1%,transparent)_20%,color-mix(in_srgb,var(--color-page)_4%,transparent)_30%,color-mix(in_srgb,var(--color-page)_10%,transparent)_40%,color-mix(in_srgb,var(--color-page)_20%,transparent)_50%,color-mix(in_srgb,var(--color-page)_34%,transparent)_60%,color-mix(in_srgb,var(--color-page)_52%,transparent)_70%,color-mix(in_srgb,var(--color-page)_72%,transparent)_80%,color-mix(in_srgb,var(--color-page)_90%,transparent)_90%,var(--color-page)_100%)]';

/**
 * The old page's own legibility aid for white words over a 0.40 veil — its
 * number, on the words' WRAPPER: `text-shadow` inherits, so the slogan wears
 * it without any atom being restyled (§6.8).
 */
const wordsShadow = '[text-shadow:0_2px_24px_rgb(0_0_0_/_0.35)]';

export function Hero({
  slides,
  labels,
  slogan = 'plain',
  servicesHref,
  intervalMs = HERO_INTERVAL_MS,
  startDelayMs = HERO_FIRST_DWELL_MS,
  env,
  className,
  ...rest
}: HeroProps): ReactElement | null {
  const count = slides.length;
  const { rotation, shown, status } = useRotation({
    count,
    intervalMs,
    startDelayMs,
    env,
  });

  // AFTER the hook, never before it (hooks are unconditional); the render is
  // what an empty ring skips.
  if (count === 0) return null;

  // Derived from COUNT, never from idleReason (which also carries reduced
  // motion): one picture is not a carousel, and announces itself as none.
  const isCarousel = count >= 2;

  return (
    <section
      {...rest}
      aria-label={labels.region}
      aria-roledescription={isCarousel ? labels.role : undefined}
      // The FOCUS pair on the region — a keyboard entry HOLDS the ring only
      // while focus is inside, a click-focused bead holds nothing (the
      // owner's round-3 word; the law's defaults are the sticky pause and
      // the click hold). No pointer pair anywhere (the header's NO ROTATION
      // CONTROL paragraph).
      {...focusManners(rotation, {
        keyboardEntry: 'suspend',
        pointerEntry: 'none',
      })}
      className={cx(
        'relative isolate overflow-clip supports-[not_(overflow:clip)]:overflow-hidden',
        // UNDER THE PILL: up by the Header's flow box (mt-4 + h-20 + 2 × 1px
        // border) — the sixth coupled spelling's first number (the header's
        // STAGE paragraph). `bg-page`: the ground the pictures rest on at
        // 80 %, and the colour the fade ends in.
        '-mt-[calc(6rem+2px)] bg-page [--focus:var(--ink-inverse)]',
        className,
      )}
    >
      {/* THE STAGE: four rows — two spacers around the words and the
          buttons, so the block's median is the screen's centre — the whole
          first screen as a MINIMUM (the header's STAGE paragraph — every
          number is argued there). */}
      <div className="relative grid min-h-screen grid-rows-[minmax(8rem,1fr)_auto_auto_minmax(9rem,1fr)] pt-[16vh] supports-[height:100svh]:min-h-svh supports-[height:100svh]:pt-[16svh]">
        {/* THE BEADS — first in the DOM, at the bottom of the picture
            (absolute, 8 % up, over the fade's invisible start). One press
            picks the slide and the ring goes on from there a full interval
            later, with the hand and the focus still on the bead (nothing
            stops it for good, nothing pointer-driven holds it — the owner's
            round-3 word). */}
        {isCarousel && (
          <div
            role="group"
            aria-label={labels.picker}
            className="absolute inset-x-0 bottom-[8%] z-10 flex justify-center"
          >
            {slides.map((slide, index) => {
              const current = index === shown;
              return (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={slide.label}
                  aria-current={current ? 'true' : undefined}
                  // goto lands and buys a full interval; the shell's
                  // handNavigation (goto, then pause for good) is NOT used.
                  onClick={() => rotation.goto(index)}
                  // 24 × 44 hit box around the bead (px-2 + h-11); the ring
                  // is the remapped white `--focus`, offset outside the box.
                  className="group/bead flex h-11 items-center rounded-md px-2 outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus"
                >
                  <span
                    aria-hidden="true"
                    className={cx(
                      // The drop shadow is paint (the BEADS paragraph): a
                      // white dot over a pale photograph under a 0.40 veil.
                      'block h-2 rounded-full shadow-[0_1px_3px_rgb(0_0_0_/_0.45)] transition-[width,background-color] duration-200 ease-out motion-reduce:transition-none',
                      current
                        ? 'w-7 bg-ink-inverse'
                        : 'w-2 bg-ink-inverse/80 group-hover/bead:bg-ink-inverse',
                    )}
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* THE SLIDES — their words in row 2, stacked in one cell; their
            pictures escape to the whole stage. 'off' while the band moves on
            its own, 'polite' once it stops: from then on a change means the
            visitor asked for it. */}
        <div
          aria-live={isCarousel ? liveRegion(status) : undefined}
          className="col-start-1 row-start-2 grid"
        >
          {slides.map((slide, index) => {
            const current = index === shown;
            return (
              <div
                key={slide.id}
                role={isCarousel ? 'group' : undefined}
                aria-roledescription={isCarousel ? labels.slideRole : undefined}
                aria-label={isCarousel ? slide.label : undefined}
                // `inert` takes the transparent slides out of the tree and
                // the Tab order; aria-hidden is the Safari ≤ 15.5 belt (no
                // slide holds anything focusable, so the pair is safe);
                // pointer-events-none keeps a transparent slide painted
                // later in DOM order from swallowing a press meant for the
                // one showing, on the same old engines. NO opacity on this
                // box — its two children fade (the header's TWO OPACITIES).
                inert={!current || undefined}
                aria-hidden={!current || undefined}
                className={cx(
                  '[grid-area:1/1]',
                  !current && 'pointer-events-none',
                )}
              >
                {/* THE PICTURE — escapes to the stage (unpositioned slide),
                    overshoots by 4px for the blur's edge, veiled grey, and
                    rests at 80 % over the page ground (the old 20 % wash).
                    The first row is the LCP element and preloads (§10.6). */}
                <div
                  className={cx(
                    'absolute -inset-1 grayscale blur-xs',
                    slideMotion,
                    current ? 'opacity-80' : 'opacity-0',
                  )}
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    sizes="100vw"
                    preload={index === 0}
                    fetchPriority={index === 0 ? 'high' : undefined}
                    className="object-cover"
                  />
                </div>
                {/* THE WORDS — gutted, above the ground (z-10), fading in
                    lockstep with the picture. */}
                <Container
                  className={cx(
                    // pt-10: the struck line's room, above the slogan (the
                    // header's STAGE paragraph — the buttons stay put).
                    'relative z-10 pt-10 pb-4',
                    slideMotion,
                    current ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  <div
                    className={cx('flex max-w-4xl flex-col gap-3', wordsShadow)}
                  >
                    <Heading
                      size="hero"
                      tone={
                        slogan === 'stroked'
                          ? 'inverse-stroked'
                          : slogan === 'outlined'
                            ? 'inverse-outlined'
                            : 'inverse'
                      }
                      // A SLOGAN IS NEVER SPLIT AT A SYLLABLE: the site-wide
                      // `hyphens: auto` (§15.14) broke „Te aș-teptăm" across
                      // two lines at 390 on the clinic's own copy (measured
                      // 2026-10-01, the hero-photos lane) — the DoctorProfile
                      // name precedent, one utility on the element (§15.15 b).
                      // Safe by data: lib/hero-slides' test holds every slogan
                      // word under the 320px column, so wrapping between
                      // words always has room.
                      className="hyphens-none"
                    >
                      {slide.title}
                    </Heading>
                  </div>
                </Container>
              </div>
            );
          })}
        </div>

        {/* THE GROUND — one static gradient under the words, the buttons
            and the bottom spacer (rows 2–4, to the stage's bottom edge,
            pulled 9rem into the picture row). After the slides in the DOM:
            above their pictures, below everything that carries z-10. */}
        <div aria-hidden="true" className={groundClasses} />

        {/* THE TWO CALLS TO ACTION — row 3, static across slides, above the
            ground; no bottom padding, so the block the two spacers centre
            ends at the buttons' own edge. Contact opens the one dialog;
            services is a plain locale anchor wearing the outline face
            (§15.13). */}
        <Container className="relative z-10 col-start-1 row-start-3 pt-2">
          <div className="flex max-w-3xl flex-wrap gap-3 *:grow *:basis-64">
            <ContactModalTrigger variant="solid" size="lg">
              {labels.contact}
            </ContactModalTrigger>
            <Button variant="outline" size="lg" asChild>
              <a href={servicesHref}>{labels.services}</a>
            </Button>
          </div>
        </Container>

        {/* THE FADE — absolute at the stage's bottom, the last thing in the
            band: from the veiled photograph into the page ground, no line. */}
        <div aria-hidden="true" className={fadeClasses} />
      </div>
    </section>
  );
}
