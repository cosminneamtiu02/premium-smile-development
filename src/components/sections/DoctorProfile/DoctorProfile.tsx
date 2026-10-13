import { useId, type ComponentPropsWithRef, type ReactElement } from 'react';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import { TintedBand } from '@/components/sections/TintedBand/TintedBand';
import {
  bandColumnClasses,
  bandScaleClasses,
} from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx/cx';
import type { HoursRow } from '@/lib/hours/hours';
import { ScheduleCard } from './ScheduleCard';

// sections/DoctorProfile — the doctor page's tinted middle band: a longer text
// about the doctor on one side, the white card with the hours he is at the
// clinic on the other, laid on sections/TintedBand's lilac ground (the Hero's
// eased fade above and below, so the lavender arrives and leaves without an
// edge). Built to the owner-approved contract of the doctor-pages run
// (.claude/section-runs/2026-09-21_11-58_doctor-pages — round 1's D1 and D7,
// round 2's D14, D29, D37 and D53, and the G2-R2 review's tier-2 a11y F2 are
// the decisions this file implements; D7's ground now lives in TintedBand).
// Round 1's brief was the owner's own sentence:
// "this section as background should be a different colour than the previous
// 2 ones. like a soft mov [purple] and it should have that color transition
// used from hero to background on main page above and below". Round 2
// (2026-09-25) kept that ground "but not with current content": a „Despre"
// header with eyebrow over a more elaborate, multi-paragraph text about the
// doctor, ~80 % of the width,
// and on the right, ~20 %, "a simpler card, the one from reviews, the current
// one but I want it to be white", holding his schedule under its own heading
// and eyebrow. The courses left this band for their own (sections/DoctorCourses,
// D15), and the band that used to carry the schedule is gone (D13). Round 2g
// (2026-09-26, D37) took the card's eyebrow away again and centred the card
// vertically on the band: "remove the Program line from the program section
// and center it also verticaly in the lila section". Round 2k (the same day,
// D53) gave the card ONE width: "should not be widening as you widen the
// screen or tighten when you tighten it. so it should be fixed and remain
// fixed". The G2-R2 review (tier 2, a11y F2, 2026-09-26) then made the
// biography a named region of its own beside the card's, which put the step's
// grid back on ONE row (the D37 and TWO <h2>s, TWO REGIONS paragraphs below).
// Since 2026-10-13 the whole band draws in ui/Container's band scale on a
// laptop or desktop, like every Home band (CLAUDE.md §15.32 round 4; THE BAND
// SCALE paragraph below).
//
// ── RUN D1 · IT IS A DUMB BAND, the PriceList/Hero shape: zero message keys,
// zero data imports, no `t()`, no `Locale`. Both headings, every paragraph and
// every schedule row arrive FINISHED and already translated (§8.1); the ONE
// populator is the doctor page, which walks lib/team for one language and
// formats the week through lib/hours before handing it over. So this file
// also ships ZERO bytes of JavaScript (§16): no 'use client', no state, no ref
// of its own, no event handler — nothing here is visitor-dependent, so all of
// it compiles into the page's static HTML. Its ONE hook is React's useId,
// server-safe and hydration-stable (the CredoCard/ScheduleCard idiom), and
// all it does is name the biography's region (the TWO <h2>s, TWO REGIONS
// paragraph below); the suite pins it as the only hook.
// DoctorProfile.test.tsx renders it
// with NO NextIntlClientProvider, and that absence is the assertion:
// next-intl's hooks throw without one, so a green suite proves no t() is
// reachable from here. The one lib specifier is `import type { HoursRow }` —
// the ROW SHAPE from a MECHANICS module (§4's foundation ring, the
// ScheduleCard precedent), which erases to nothing at build time.
//
// ── RUN D29 · THE GROUND IS sections/TintedBand's. The soft-lilac ground this
// band was born with — round 1's D7 (the page colour, ONE `--tint` variable,
// the Hero's ten-stop fade in and out, no seam by construction) at round 2's
// D23 ratio (30 %) — climbed into its own composition on 2026-09-26, when the
// owner asked for "another lila section like the one below" under the courses
// (sections/DoctorStats): §4's first sharing row (identical mechanics, second
// consumer → the nearest tier both may import) and its section → section rule
// (a section composes another section's PUBLIC component, never its
// internals). So this file renders `<TintedBand>` and hands it the grid (in
// THE BAND SCALE's box since 2026-10-13). The tint, the two fades, the
// `relative bg-page` outer, ui/Container, the plain-page fallback, the
// KEEP-IN-SYNC pair with the Hero's `fadeClasses` and
// its `?raw` cross-pin all live THERE now — argued in TintedBand.tsx's header,
// pinned in TintedBand.test.tsx, measured in TintedBand.stories — and this
// band's suite only proves it IS one (the same outer and the same three boxes
// as a bare TintedBand). What stays HERE is what this band CHOOSES to put on
// that ground, with the contrast numbers beside each choice: the paragraphs'
// `text-ink` at 9.7:1 (THE INK paragraph below); the „Despre" eyebrow's
// `ink-muted` at 4.8:1 (the band's only eyebrow since D37 struck the card's),
// which is the line that CAPS the tint (TintedBand's D23 paragraph:
// 40 % would put it at 4.2:1 and fail §9, so a darker ground means a darker
// eyebrow ink first); and the schedule card (D14), white under ui/Card's
// `framed` row, its words on #ffffff at the surface's own contrasts
// (ScheduleCard's D14 paragraph has the frame measured on this ground).
//
// ── THE GRID IS THIS BAND'S CONTENT, and it sits in TintedBand's ui/Container
// (the PAGE-BAND RECIPE in Container.tsx's header), inside the band-scale box
// since 2026-10-13 (THE BAND SCALE, next): the ground owns the paint, the
// Container owns the width, the gutter and the container-query context, the
// scale box owns the design pixel, the cap and the centring, and the grid
// owns the band's vertical rhythm. The `py` cannot ride on Container itself —
// an element cannot query its OWN size — so it sits on the grid, two levels
// in now, the ClinicLocation precedent; TintedBand adds no padding of its own
// for exactly that reason. Two container steps, measured against the gutter
// box (the viewport less two gutters — 10vw a side from a 600px window, 5vw on
// a phone since 2026-10-09's phone gutter, ui/Container's THE PHONE GUTTER) —
// the scale box between is no container, so every `@`-step here still asks
// the column — and never a width media query (§6.5; the band's one media
// condition is the scale's pointer gate, ui/Container's, which asks no
// width):
//   · `@lg` (container 512px, ≈ a 640px viewport) buys the second `py` step;
//   · `@3xl` (container 768px, ≈ a 960px viewport) is where the prose and the
//     card go side by side. At §7's sampling points the box is 288 (320) · 351
//     (390) · 614 (768) · 1024 (1280) · 1229 (1536) · 1536 (1920), so phone
//     and tablet stack and notebook upward sits beside — the same split every
//     band on the site draws at this step, and the owner's adaptability rule:
//     beside on the wide step, one above the other below it. Stacked, the
//     biography comes first (DOM order = reading order), the card under it at
//     its one width, centred (D53), `gap-10` between them.
//
// ── THE BAND SCALE (owner, 2026-10-13, CLAUDE.md §15.32 round 4: "take
// current heading and eyebrow from main page. look how reactive and nice it
// is. make the exact same thing with the heading and eyebrow from the
// individual dr page" — and, asked how far, "Whole page, like Home"). On a
// laptop or desktop the band draws as ONE design, the owner's 1401-window look
// scaled to its column, exactly as every Home band does: the „Despre" eyebrow
// and title, the paragraphs, the grid's rhythm, the outdent, the gap and the
// schedule card with everything in it grow and shrink together, in the one
// design pixel every scaled band on the page draws in — so the opener is the
// size of theirs at every width. On every phone, every touch tablet, under
// the step and in an engine that cannot register custom properties nothing is
// declared, and every pixel is what it was (§7). The rule and its numbers are
// ui/Container's (THE BAND SCALE, recipe rule 5): this band IMPORTS its two
// strings, `bandColumnClasses` and `bandScaleClasses`, and spells neither
// (tests/unit/design-scale.test.ts). Three decisions are this band's own:
//   · THE STRINGS RIDE A BOX OF THEIR OWN, between ui/Container and the grid —
//     not the grid, the recipe's usual rhythm box. `bandColumnClasses` is
//     `mx-auto w-full` under its cap, and the grid wears THE PROSE OUTDENT, a
//     negative start margin (below). On one element the two fight: the
//     outdent replaces the start margin `mx-auto` sets, so past the cap the
//     band would not centre; and `w-full` fixes the box to the column's width,
//     so the outdent would stop widening the prose track leftward and pull the
//     card's right edge 2rem in instead. On the scale box the cap and the
//     centring are clean, and the grid inside it outdents from the box's edge
//     as it always did from the column's — by 32 design pixels in the scale.
//     The box is a plain <div>: no paint, no padding, no role; the grid keeps
//     the `py`.
//   · THE CARD'S ONE WIDTH IS EIGHTY SPACING STEPS (D53, re-spelled): the
//     track `calc(var(--spacing)*80)` beside the card's `max-w-80`, the same
//     eighty steps, KEEP-IN-SYNC. Outside the scale a step is 0.25rem, so the
//     card is the 20rem — 320px — it always was; inside, 320 DESIGN pixels.
//     The owner's "should not be widening as you widen the screen" holds in
//     the design's pixels: at every laptop and desktop width the card is the
//     same 320 of the design's 1106, the way the Team page's staff tiles keep
//     their one width in the same regime (sections/TeamRoster, §15.32). A
//     20rem literal would have held 320px while the prose, the gap and the
//     headings around it scaled — the disproportion the scale exists to end.
//   · WHAT STAYS IN rem, RECORDED. TintedBand's two 6rem fades: the ground's
//     own boxes, outside ui/Container (its NO OUTER MARGIN), so nothing in
//     them can read the column the design pixel comes from — at a 1920 window
//     the band between them is drawn at s ≈ 1.375 (a classic scrollbar) while
//     they stay 96px. The card's 3px frame, a px border by ui/Card's THE SUM
//     RULE. And the outdent stays the owner's own step off the column's edge,
//     32 design pixels now: the „Despre" opener sits that far left of the
//     other bands' openers at every width, one constant of the design.
// MEASURED — the engine's numbers on the real stylesheet (Chromium, the band
// in the column a window leaves beside a classic 15px scrollbar,
// DoctorProfile.scale.test.tsx's harness), as the „Despre" title / eyebrow /
// prose / the card / the outdent, s in brackets; before this change every
// laptop width drew 36 / 14 / 18 / 320 / 32:
//   · 1140 [0.811]: 29.2 / 11.4 / 14.6 / 259.5 / 26.0;
//   · 1280 [0.912]: 32.8 / 12.8 / 16.4 / 291.9 / 29.2;
//   · 1401 [1.000]: 36.0 / 14.0 / 18.0 / 319.9 / 32.0 — the owner's look;
//   · 1536 [1.097]: 39.5 / 15.4 / 19.8 / 351.2 / 35.1 — the stories' pin;
//   · 1920 [1.375]: 49.5 / 19.3 / 24.8 / 440.1 / 44.0;
//   · 2560 [1.389, capped]: 50.0 / 19.4 / 25.0 / 444.4 / 44.4, the scale box
//     1536 wide and centred, 304.5px in from the column's edge;
//   · 390 and 768: 30 and 36 / 14 / 18 / 320 / none (stacked) — the theme's
//     own, nothing declared, every pixel as before.
// THE TRADE, RECORDED (the regime's own — §15.25 round 2, §15.32): under the
// reference the biography reads SMALLER than its 18px — 14.6 at 1140, 16.4
// at 1280 — as every Home band's words do, and a browser zoom inside the
// regime enlarges it less than rem would. ui/Container's THE FLOOR (the price
// list's) is the one-class lever that would hold it at the theme's size under
// the reference — the owner's call, not taken here.
//
// ── D53 · ONE WIDTH, 20rem — 320 design pixels in THE BAND SCALE (owner,
// 2026-09-26, round 2k: "the cand ma gasesti la clinica [card] should not be
// widening as you widen the screen or tighten when you tighten it. so it
// should be fixed and remain fixed").
// Round 2e's D14 track was `minmax(20rem,1fr)` beside `3fr` — a quarter of the
// free space, floored at 20rem — so the card grew with the window once the
// floor let go (from a ~1620px window; 380px at 1920), and below the step it
// was a full-width stacked item, as wide as the column (614px on a tablet).
// Now it has ONE width, spelled twice in this file and pinned equal in
// DoctorProfile.test.tsx (a KEEP-IN-SYNC pair inside one file: the track's
// eighty spacing steps and `max-w-80`'s are the same length — 20rem, and 320
// design pixels inside THE BAND SCALE, whose paragraph re-spelled the track
// from a 20rem literal on 2026-10-13):
//   · at `@3xl` the second track is EXACTLY eighty steps —
//     `@3xl:grid-cols-[minmax(0,1fr)_calc(var(--spacing)*80)]` across a
//     `gap-x-12` (3rem) — and the prose takes every other pixel of the row
//     (`minmax(0,1fr)`: a long word can never push on the card's track);
//   · below it the card is `w-full max-w-80 mx-auto`: 20rem when the column
//     allows it, centred under the prose. It shrinks only where the column
//     ITSELF is narrower than 20rem — a box wider than its container would
//     scroll sideways (§7) — and since 2026-10-09 that is only the narrowest
//     phones: the column is the window less two 5vw gutters there
//     (ui/Container's THE PHONE GUTTER), so it reaches 20rem from a ~356px
//     window (~372 beside a classic 15px scrollbar) — under it at 320 (288px
//     of column), past it at 360 and 390 (324 and 351px), where the card keeps
//     its 20rem, centred. Until then it was every phone: two 10vw gutters
//     reached 20rem only from a ~400px window, past both 320 AND 390. `w-full`
//     is load-bearing: a grid item with auto inline margins no longer
//     stretches (it shrinks to fit), so without it the card would size to its
//     longest row. At the step the three change nothing — `w-full` of the
//     eighty-step track IS its width and the auto margins find no free space
//     — so none of them is gated. Stacked, the band is never in THE BAND
//     SCALE (the scale starts at a 56rem column, the stack ends at 48rem), so
//     every number in this bullet is the theme's own.
// MEASURED — the card's border box, before → after, in the Vitest storybook
// project's Chromium over the Default fixture. That frame draws a classic 15px
// scrollbar, so its column is the window − 15 − 2 × 10vw; the no-scrollbar
// arithmetic a phone's overlay scrollbar gives is in brackets:
//   · 320:  241 → 241 [256 → 256]  stacked, the column under 20rem;
//   · 390:  297 → 297 [312 → 312]  stacked, the column under 20rem;
//   · 768:  599 → 320 [614 → 320]  stacked, centred, ~140px of tint aside;
//   · 1280: 320 → 320              beside — the old floor already bound;
//   · 1536: 320 → 320              beside — likewise;
//   · 1920: 376 → 320 [380 → 320]  beside — the one width that had grown.
// So both of the owner's directions hold from a ~400px window up: a wider
// window no longer widens it (1920), and below the step the stacked card no
// longer follows the column (768) — it only ever yields to a column narrower
// than itself. (Since 2026-10-09's phone gutter — ui/Container's THE PHONE
// GUTTER, CLAUDE.md §15.35 — the two phone rows read 273 [288] at 320, still
// the column's width, and 320 [320] at 390, centred in a 336 [351]px
// column with ~8 [~15.5]px of tint aside, MEASURED on the built page; so the
// directions now hold from a ~356px window up, ~372 beside the scrollbar.)
// The narrower card at 1920 is TALLER (290 → 326, its title back
// on two lines) and still shorter than the capped prose (368), so D37's one
// caveat below does not fire. (Since 2026-10-13 the three beside rows are the
// design's 320 × s on a laptop or desktop — THE BAND SCALE's MEASURED line;
// the stacked rows did not move.) The GRID ITSELF is outdented eight steps
// into the gutter (`@3xl:-ms-8`, the PROSE OUTDENT paragraph), so its box is
// the scale box plus 32px — 32 design pixels in the scale — and its right
// edge, where the card ends, is the scale box's: the gutter's under the cap.
// A two-line „Când mă găsiți la clinică” over the seven rows needs ~270px of
// content box, which the one width less the frame and the inset gives
// (ScheduleCard's heading paragraph) — 270 design pixels in the scale, where
// the title and the rows scale with it.
// D37 · THE CARD IS CENTRED ON THE BAND (owner, 2026-09-26, round 2g: "center
// it also verticaly in the lila section" — superseding round 2e's "starts on y
// axis where text starts", where the card sat `row-start-2 self-start` with its
// top level with the first paragraph's). Round 2g first reached that middle
// ACROSS 2e's two rows: the about half dissolved at the step (`@3xl:contents`),
// the „Despre” opener took row 1 alone and the paragraphs row 2, and the card
// spanned both (`@3xl:row-start-1 @3xl:row-span-2`). G2-R2 tier 2 (a11y F2,
// 2026-09-26) RETIRED that placement: the about half is a named region now
// (the TWO <h2>s, TWO REGIONS paragraph below), and a region cannot dissolve —
// `display: contents` on an element WITH a role is the accessibility-tree bug
// ScheduleCard's THE WEEK IS CENTRED paragraph cites (engines that drop the
// element's semantics along with its box), so the biography stays ONE BOX at
// every width: a flex column (the opener, `gap-6`, the paragraphs' block),
// stacked and beside alike. The step's grid is therefore ONE ROW, round 2d's
// shape and the picture D37's own sentence describes, and the centring holds
// BY CONSTRUCTION with a single utility: the biography is the row's tall
// item, so the row is exactly its height; the card, `@3xl:self-center` in the
// second track, sets its vertical middle on the row's; the row fills the
// grid's content box, the grid's rhythm `py` is symmetric at every step
// (`py-6` · `@lg:py-8` · `@3xl:py-10`), the grid is the one thing inside the
// scale box, which adds no padding and is the one thing inside TintedBand's
// Container (THE BAND SCALE), and the two fades are boxes OUTSIDE the tinted
// one —
// so the row's middle IS the tinted box's, and the card sits centred "in the
// lila section" at every width above the step, whatever the heading's or the
// prose's height in any language (the stories measure it, within 1px). No
// column or row is named anywhere: two items, two tracks, and the DOM order
// seats them. The frame is round 2g's to the pixel: the opener, 24px and the
// paragraphs were row 1, `gap-y-6` and row 2, and are one flex column now,
// the same heights stacked the same way (the MEASURED line below).
// THE CARD KEEPS ITS OWN HEIGHT: a grid item stretches to its row by default,
// and a white card pulled to the biography's height would be mostly empty
// below the seventh row — `self-center` aligns, it never stretches (the
// stories pin the border box ending where the <dl> ends). The one input that
// changes the picture is a card TALLER than the biography: the row then takes
// the card's height, the card still sits on the band's middle (it IS the row),
// and the biography, stretched to the row by default, keeps its words at its
// top over a strip of tint. Recorded, not designed for: every shipped
// doctor's three paragraphs (~900 characters a doctor, lib/team D17) stand
// well taller than the card, and the Default story's vacuity guard holds a fixture
// of that length to it. Below the step the one placement utility is
// `@3xl:`-gated, so the card is an ordinary stacked item — its 20rem, centred
// (D53) — 40px under the biography (`gap-10`): opener, prose, card, one column
// (D21).
// MEASURED — G2-R2 tier 2, the card's vertical middle / the tinted box's, in
// Playwright's Chromium over the Storybook frame (a classic 15px scrollbar),
// px from the frame's top, before → after: Default at 1280 · 422 / 422 →
// 422 / 422; at 1536 · 366 / 366 → 366 / 366; GermanLongest, the tallest
// prose, at 1280 · 464 / 464 → 464 / 464; at 1536 · 394 / 394 → 394 / 394.
// Zero in all four, and the card's border box did not move a pixel (the same
// top, bottom and left before and after); the biography's box, new at the
// step, measures exactly the row (136 → 708 at 1280, the grid's 40px `py`
// inside the tinted box's 96 → 748), its middle the card's.
// THE PROSE OUTDENT — `@3xl:-ms-8` ON THE GRID (owner, 2026-09-25, round 2d:
// "move left margin of text a bit more to the left", and, asked which text,
// "only the lilac band's prose"): at the wide step the grid's box starts eight
// spacing steps LEFT of the scale box's edge — ui/Container's gutter, under
// THE BAND SCALE's cap — so the opener and the paragraphs — column 1 — reach
// into it, while the card in column 2 keeps its right edge on the box's
// (a negative margin-inline-start widens the box leftward and moves nothing on
// the right; the extra width lands in the prose track's `1fr`). It rode the
// about half until round 2e dissolved that box, and it STAYED on the grid when
// G2-R2 (a11y F2) made the half a box again: on the grid the extra 2rem widens
// the prose TRACK, while on the half it would pull the region 2rem out of its
// own grid area, a box overflowing its track. ONE spelling, on the box whose
// edge moved — and the reason THE BAND SCALE rides a box of its own: beside
// `mx-auto` on one element, the outdent would cancel the centring (that
// paragraph). A RECORDED DEPARTURE from the page-band recipe (Container.tsx:
// the Container owns the width and the gutter), the owner's call, kept to one
// utility on one element. Why the step only: below it the gutter is 1rem at
// 320 (since 2026-10-09's phone gutter; 2rem before) and ~4.8rem at 768, and
// a 2rem outdent there would push the prose 16px past the screen's edge at
// 320 or break the one-column alignment with the card under it — the owner
// was looking at the wide row. "A bit" = 2rem (32px) — 32 design pixels in
// the scale, the same step of the same design.
// THE ONE LEVER ON THE MEASURE is `max-w-4xl` (56rem; 896 design pixels in
// the scale) on the paragraphs' block. Since 2026-10-13 it binds only where
// the band is NOT scaled: in THE BAND SCALE the prose track is 770 design
// pixels at every laptop and desktop width (1106 + 32 − 48 − 320), under the
// cap, so every line keeps the measure of the owner's 1401 window — ~82
// characters at 18 design pixels (~9.4 per character of Source Serif at 18px,
// an estimate, not a measurement), the line drawn larger, never longer.
// Unscaled — a touch screen that wide, an engine that cannot register — the
// old arithmetic stands: at 1920 the track is ~1200px (1536 + 32 − 48 − 320,
// D53), a ~130-character line, far past a comfortable measure for §1's
// 70-year-old reader, and the cap holds it near 95, binding once the track
// passes 56rem — a 1232px column, a ~1540px window — and nowhere below. It
// sits on the paragraphs and not on the half, so the heading above keeps the
// whole track.
//
// ── NO DIVIDER. Round 1's thin line between the halves (one border that
// changed side at the step) is deleted with its constant: the white card's own
// edge now separates the two halves in both arrangements, and a line beside a
// card would draw the same boundary twice.
//
// ── THE PARAGRAPHS ARE JUSTIFIED — the owner's word, 2026-09-25, round 2c:
// "this text just isn't justified" (the credo card's quote had been justified
// on the same day's earlier sentence). Built start-aligned first, because
// §15.1's justify exception was scoped to the doctor card's one <blockquote>;
// now that exception names the doctor page's prose — the credo <p> and each
// <p> here — as its third per-element case. The utility rides EACH <p>
// (§15.15 b: on the element, never a wrapper-level blanket), and nothing else
// in this band sets an alignment. The body's site-wide `hyphens: auto`
// (§15.14) is INHERITED and left alone — it is what keeps rivers out of the
// justified lines, as on the card — so a German compound may break at a
// syllable rather than open a gap.
// THE INK IS `text-ink`, NOT MUTED (D14): three paragraphs of reading text
// for §1's 70-year-old, 9.7:1 on TintedBand's 30 % tint (its D23 table). The
// quiet ink belongs to the quoted philosophy in the intro's credo card, which
// is a different band with a different job; body prose here is read, not
// glanced at. `text-lg` is the
// §15.1 body base (ui/Text's step is 16px) — a section writing utilities on its
// OWN markup is lawful (§6.7), the ClinicLocation row's <span> is the
// precedent.
//
// ── NO BRANCHES. `about.paragraphs` empty is a page bug, not a state: the
// populator hands over at least one paragraph for every doctor (lib/team's
// data test pins it, D17), so this band renders what it is given — an empty
// block, no fallback copy, no conditional layout. Round 1's `hasCourses`
// branch left with the courses. Paragraphs are keyed by their own text:
// finished, distinct sentences (the data test pins uniqueness per locale), so
// an index key would survive a reorder by silently re-labelling every row.
//
// ── TWO <h2>s, TWO REGIONS, and the page's <h1> is elsewhere
// (sections/DoctorIntro owns the doctor's name). The prose opens with
// sections/SectionHeading at level 2 — eyebrow over title, the pair every
// content band on this site opens with — and the card opens with the same
// opener at the same level, its TITLE ALONE since D37 struck its eyebrow:
// siblings, because neither half owns the other. And EACH HALF IS A NAMED
// REGION, by its own <h2>: the card since round 2 (ScheduleCard's THE CARD IS
// A NAMED REGION paragraph), the biography since the G2-R2 review (tier 2,
// a11y F2, LOW, 2026-09-26). Until then the card was the band's ONLY region,
// so a landmark walk over the doctor page read credo · schedule · courses ·
// stats · map and skipped „Despre Dr. Elena Marin”, the band's main content,
// while announcing its 20rem sibling. No SC failed (2.4.1 is met by the
// shell's skip link, <main> and the <h2>), but the block a visitor looking for
// the doctor's story wants was the one the rotor left out. The fix is the
// CredoCard/ScheduleCard idiom exactly: a bare <section aria-labelledby>
// whose id comes from useId() and rides SectionHeading's `id` prop onto the
// <h2>, never the opener's wrapper, so the region's name is the title alone
// and not the eyebrow read with it (SectionHeading's id paragraph); no `role`
// bolted on (a named <section> IS a region, §9 semantic HTML first); no
// tabIndex (no link jumps to it). DOM order is the region order: biography,
// then week. The consequence is layout, and it is D37's paragraph above: a
// region stays a box, so the step's grid is one row.
// The band's <section> ROOT takes NO accessible name:
// `aria-label`/`aria-labelledby` are refused by the types because there is no
// single noun that covers both halves, and a named root would wrap the two
// regions in a third, announced by a name that fits one of them. The two
// headings and the two regions are the structure a screen reader navigates
// by. THE OMIT IS DoctorProfile's, NOT THE GROUND's:
// TintedBand itself passes both names through to its <section> (its NAMES PASS
// THROUGH paragraph — DoctorStats names its band by its own h2, D30), so the
// refusal lives in this file's props type, where the reason for it lives.
//
// ── NO OUTER MARGIN (§6.4): the page owns the rhythm between its bands. The
// two 6rem fade boxes that open and close the band are TintedBand's own
// in-flow boxes — its transition into and out of the page ground, not spacing
// (its NO OUTER MARGIN paragraph) — and `className` travels to it untouched,
// merged last onto the <section> there (§6.8).

/** The eyebrow/title pair the „Despre" half opens with — finished,
 *  already-translated text (§8.1): the doctor page hands over „Biografie" /
 *  „Despre Dr. Elena Marin". Until round 2g it was the shape of BOTH halves;
 *  D37 struck the schedule card's eyebrow, so `schedule` carries a `title`
 *  alone and this pair is the prose's. */
export type ProfileHeading = Readonly<{ eyebrow: string; title: string }>;

type DoctorProfileOwnProps = Readonly<{
  /**
   * The „Despre" half: its opener and the doctor's text as FINISHED PLAIN
   * paragraphs, one string each — no markup, no keyword fragments (those
   * belong to the credo card's quote, D12). REQUIRED: the band exists for this
   * half. Each string becomes one `<p>`, in the order given.
   */
  about: ProfileHeading & Readonly<{ paragraphs: readonly string[] }>;
  /**
   * The framed white card: its own `title` — the card's ONLY heading row, the
   * <h2> that names its region; no eyebrow (D37) — and lib/hours' seven rows,
   * already formatted in the visitor's language by the page (this band never
   * calls the formatter — run D1).
   */
  schedule: Readonly<{ title: string; rows: readonly HoursRow[] }>;
}>;

export type DoctorProfileProps = DoctorProfileOwnProps &
  // `children` is Omitted (the SectionHeading/PersonnelCard precedent):
  // content arrives as `about`/`schedule`, and without the Omit a caller could
  // nest something, type-check, and watch it vanish. `about` leaves the native
  // side with them — it is a real RDFa attribute on every HTML element, so
  // otherwise the two meanings would intersect into something that is neither.
  // Both ARIA naming attributes are refused for the reason in the header: the
  // band deliberately has no one name, and an attribute that gave it one would
  // wrap its two named halves (the biography, the week) in a third region
  // called after one of them. The Omit is
  // DoctorProfile's: TintedBand itself passes names through (run D29), so
  // this line is the only thing keeping the doctor's band unnamed.
  Omit<
    ComponentPropsWithRef<'section'>,
    keyof DoctorProfileOwnProps | 'children' | 'aria-label' | 'aria-labelledby'
  >;

export function DoctorProfile({
  about,
  schedule,
  className,
  ...rest
}: DoctorProfileProps): ReactElement {
  // Names the biography's region — the header's TWO <h2>s, TWO REGIONS
  // paragraph; server-safe and hydration-stable, so no 'use client'.
  const aboutId = useId();

  return (
    // THE GROUND is TintedBand's (the header's D29 paragraph): the <section>,
    // its tint, the two fades and the Container are all rendered there, and
    // the native props and `className` travel to that <section> untouched —
    // TintedBand merges the caller's className LAST (§6.8).
    <TintedBand {...rest} className={className}>
      {/* THE BAND SCALE — ui/Container's two strings, imported, on a box of
          their own between the column and the grid (the header's paragraph
          of that name: on the grid, `mx-auto` and THE PROSE OUTDENT would
          fight over one start margin). No paint, no padding, no role. */}
      <div className={cx(bandColumnClasses, bandScaleClasses)}>
        {/* Two tracks — the prose, then EXACTLY eighty spacing steps, 20rem
            or 320 design pixels (the header's D53 · ONE WIDTH paragraph, with
            the measurements) — and ONE row (D37's THE CARD IS CENTRED ON THE
            BAND, one row since G2-R2 a11y F2); THE PROSE OUTDENT is the
            `-ms-8`. Below `@3xl` one column: the biography, then the card. */}
        <div className="grid gap-10 py-6 @lg:py-8 @3xl:-ms-8 @3xl:grid-cols-[minmax(0,1fr)_calc(var(--spacing)*80)] @3xl:gap-x-12 @3xl:py-10">
          {/* THE BIOGRAPHY — a region named by its own <h2> (G2-R2 a11y F2),
              and therefore a BOX at every width: never `contents`, which would
              cost the region its role. The opener over the paragraphs' block,
              24px apart, stacked and beside alike. */}
          <section aria-labelledby={aboutId} className="flex flex-col gap-6">
            {/* THE NAME IS NEVER SPLIT (2026-09-30). This title carries a
                PERSON'S NAME, and a name wraps between words or not at all —
                the rule PersonnelCard, DoctorIntro and ReviewCard keep
                wherever one is printed. Inheriting the body's `hyphens: auto`
                (§15.14), it did not: MEASURED on the built export over the six
                real doctors of lib/team (Range.getClientRects()), Chromium
                broke „Sa-bău" at 390 (ro, de), „Ele-na" at 360 (ro) and
                320–335 (de), „Ali-na" and „Hora-țiu" at 320–335 (fr, it),
                „Cătă-lina" at 390–430 (fr, it). `hyphens-none` rides
                SectionHeading's ROOT, the one element it merges a className
                onto, and reaches the <h2> because `hyphens` is inherited (the
                one-word eyebrow takes it too, harmlessly). It cannot push the
                column open: tests/unit/team-data.test.ts holds every
                unbreakable token of a name to NAME_CEILING, 16 characters
                measured for the larger `hero` step, and the title's other
                words are short. */}
            <SectionHeading
              className="hyphens-none"
              level={2}
              id={aboutId}
              eyebrow={about.eyebrow}
              title={about.title}
            />
            {/* `max-w-4xl` is the header's ONE LEVER ON THE MEASURE. */}
            <div className="flex max-w-4xl flex-col gap-4">
              {about.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-lg text-ink text-justify">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
          {/* THE CARD — ONE width, eighty spacing steps: `max-w-80` is the
              track's eighty above, KEEP-IN-SYNC (D53) — 20rem, or 320 design
              pixels in THE BAND SCALE — centred when stacked and yielding only
              to a column narrower than itself; at the step the second track of
              the one row, its own height, its middle the band's (D37). */}
          <ScheduleCard
            className="w-full max-w-80 mx-auto @3xl:self-center"
            title={schedule.title}
            rows={schedule.rows}
          />
        </div>
      </div>
    </TintedBand>
  );
}
