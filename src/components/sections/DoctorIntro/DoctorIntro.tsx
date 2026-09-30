import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { Container } from '@/components/ui/Container/Container';
import { Eyebrow } from '@/components/ui/Eyebrow/Eyebrow';
import { Heading } from '@/components/ui/Heading/Heading';
import { Image } from '@/components/ui/Image/Image';
import { cx } from '@/lib/cx/cx';
import type { ImagePath } from '@/lib/image-path/image-path';
import { CredoCard, type DoctorIntroCredo } from './CredoCard';

// sections/DoctorIntro — the doctor page's opener: the cutout photograph on
// one side, the specialty over the full name on the other, the doctor's credo
// card under them, and a free slot after the card. Built to the
// owner-approved composition contract of the doctor-pages run
// (.claude/section-runs/2026-09-21_11-58_doctor-pages — its ledger decisions
// D1 and D6, and round 2's D12, D51 and D54 in round2/ledger-round2.md, are the anchors
// other files cite, §17.7), whose first brief was one sentence: "outside of the card, on transparent
// background, the doctor photo on the left and on the right side … eyebrow
// and heading, heading is the dr name full name and on the eyebrow dr
// specialty like medic specialist in chirurgie bmf … the image doctor has no
// background … idk yet if i should place [the words] sticky to the top of
// respective div next to image, center or bottom."
//
// ── NO OLD COUNTERPART. The owner named jonaclinic.ro/en/despre-noi/
// drdan-boariu as the SHAPE he wants, and the old repo never had a per-doctor
// route at all (the run's old-repo survey: no page, no schedule, no courses,
// no portrait assets — a `/$lang/team` page lived briefly and was deleted).
// So §17.2 is satisfied by absence and nothing here is ported; every decision
// below is this run's, and the reference site is a description, not a source.
//
// ── D1 · A DUMB PROPS-IN BAND, the PriceList/Hero shape (run D1): zero
// message keys, zero data imports, no `t()`, no `Locale`. Every visible word
// — the name, the position, the credo's eyebrow, title and quote, whatever
// the consumer puts in the slot — arrives finished and already translated
// (§8.1), because only the page knows which doctor it is printing and in
// which language. The ONE populator is the doctor route, which walks lib/team
// for one language. Tier-wise this is §4's props-in SHARED COMPOSITION
// sub-kind: it composes four atoms plus its own in-folder CredoCard (which
// composes ui/Card and sections/SectionHeading — §4 lets a section compose
// another section's public component), which is what /classify-component
// rule 3 reads, and §4's dependency direction then forbids ui/ from importing
// it back.
//
// ── THE BAND NAMES NOTHING, ITSELF INCLUDED. The root <section> is a generic
// box and not a landmark: the band's OWN heading is the PAGE's <h1>, so
// naming the band by it would announce the doctor's name twice — once as the
// region, once as the heading — and would duplicate the boundary <main>
// already draws (PriceList.tsx's WHAT THE BAND DELIBERATELY DOES NOT NAME,
// same conclusion from the other side: there the PAGE names the band, here
// nothing does because the band holds the page's own title). `aria-label` and
// `aria-labelledby` are therefore OMITTED from the props rather than merely
// left unused — a caller's name would create exactly the region this band
// refuses, and the type is where that is said out loud (the ui/Modal and
// PersonnelCard precedent for refusing a naming attribute by type). The ONE
// region inside the band is the credo card's, named by its own <h2> (D12
// below) — a named piece of the band, not the band.
//
// ── D6 · THE `align` AXIS EXISTS BECAUSE THE OWNER IS STILL DECIDING: "idk
// yet if i should place [the words] sticky to the top of respective div next
// to image, center or bottom". It moves the words' column inside the row at
// the wide step — and only there, because below the step the column
// dissolves into the one-column stack (D51c, below), where there is no row
// left to align in. The default is 'start', the arrangement the referenced
// page uses; the three stories exist so the owner can compare the faces in
// the workbench and name one. When he does, the prop STAYS (a page that
// wants one doctor's words centred is then one prop away) and the page
// simply stops passing it.
//   THE FOURTH SEAT, `lowered` (round 2e, 2026-09-25 — the owner, on the
//   round-2 page: "push this a bit more down", pointing at the name, the
//   specialty and the credo card): the `start` seat dropped by 7rem —
//   `@3xl:self-start @3xl:pt-28`, D54 (round 2l, 2026-09-26, the owner: "push
//   like idk, 20% more down just textual part next to image in doctor hero
//   section. i'll adjust if needed"). THE ARITHMETIC: 20 % of D51a's figure
//   at 1280 (555px) is 111px, and the spacing scale's nearest step is
//   `pt-28` = 112px; the figure grows with the column and the drop does not,
//   so the same 7rem is 17 % of 1536's 673px figure and 15 % of 1920's 768px.
//   THE LEVER is that ONE token: the owner dials the seat by moving `pt-28`
//   along the spacing scale — the picture, the band's rhythm, the stacked
//   branch and the other three seats never read it. MEASURED in Chromium (the
//   story runner, its 15px scrollbar included): band top → words column 40px
//   and band top → specialty 152px at 1280, 1536 and 1920 (40 + 112; 64
//   under D38); the demo doctor's column 506 / 517 / 610px beside the 555 /
//   673 / 768px figure, so the figure stays the tall item and the band keeps
//   D51's 635 / 753 / 848px.
//   THE COLUMN CAN NOW OUTGROW THE FIGURE, because the padding is part of it.
//   The figure then still stands on the row's floor (`self-end`), so it moves
//   DOWN by the overshoot and the band grows with it. The German three-line
//   stress name does it at 1280 — 546 + 112 = 658px beside 555: figure top
//   40 → 143px, band 635 → 738, the feet at 98 + 143 + 555 = 796px of the
//   800px window (the pill's flow box above, D51a) — and at 1536 (692 beside
//   673: figure top 58px, band 772); at 1920 it fits (700 beside 768). Among
//   the SHIPPED pages (the clinic's six real doctors, measured 2026-09-30 on
//   the built export) MOST do it at 1280: 19 of the 30 doctor × language
//   pages, by 19px (ro „Dr. Malea (Sabău) Oana Bianca", 574 beside 555) to
//   75px (fr „Dr Ivașcu-Zugravu Cătălina", a two-line name over the credo card,
//   630 beside 555 — figure top 115px); at 1536 nine do, by 11 to 67px (the
//   three-line names of Malea and Ivașcu-Zugravu); at 1920 none, the closest
//   20px inside. Recorded for the owner, not changed: the levers are the
//   `lowered` seat's 7rem and the words column's 28rem cap. The plays measure
//   the row from the grid's content box, so they hold either way.
//   HISTORY: 3rem (`pt-12`) in round 2e; HALVED to 1.5rem (`pt-6`) in round
//   2g, 2026-09-26, the owner: "push it a little more upwards … but not too
//   much so that at rest it is not covered by the top bar" — the pill is IN
//   FLOW above this band, so no seat can sit under it at rest, at any drop
//   (D38). Still not `center`: centring hands the seat to the words' height,
//   which moves with every name and language (for the demo doctor ~80px at
//   1280 and ~134 at 1536, from round 2k's measures, and nothing once the
//   words are the taller item), where the ask is a distance the owner dials.
//   The page passes it; the Lowered story shows it beside the other three,
//   and `start` stays the default so a bare <DoctorIntro> is unchanged (§6.6).
//
// ── THE CUTOUT, AND WHY IT IS `artwork`. The owner's picture has no
// background, and ui/Image's `artwork` recipe is the one built for exactly
// that (its D4): `h-auto max-w-full object-contain` shows the whole figure,
// never upscales it past its intrinsic size, and `placeholder="empty"` keeps
// a blur ghost out of the transparent corners the design depends on.
// `framed` — PersonnelCard's portrait recipe — would crop the cutout into a
// 3:4 box and give it the atom's 12px radius, i.e. the opposite of "outside
// of the card, on transparent background". `photo` carries the path PLUS the
// intrinsic pixel size, which is the optimizer's srcset input and the
// reserved box: zero layout shift (§11).
//
// ── `alt=""` IS THE DECISION, not a missing string — PersonnelCard's D3,
// applied one tier up and for its reason: the <h1> beside the picture carries
// the doctor's name, so a portrait alt would be announced back-to-back with
// the heading ("Dr. Elena Marin, image · Dr. Elena Marin, heading level 1").
// WAI's decorative-images tutorial calls this the image with an adjacent text
// alternative. RE-OPEN TRIGGER, recorded identically to the card's: a
// photograph that carries information the name does not — a doctor at work —
// at which point `photo.alt` joins the shape additively, breaking nobody. The
// literal sits at the JSX call site rather than inside a spread because
// eslint-config-next maps <Image> to img for jsx-a11y/alt-text and a spread
// does not satisfy that rule (ui/Image's own fixture note).
//
// ── IT IS THE DOCTOR PAGE'S LCP ELEMENT (§10.6), so it preloads at high
// priority — sections/Hero's first slide, one band shape over. It is the only
// picture above the fold on that page, and every portrait further down stays
// lazy, so nothing competes with it. `sizes` states the two boxes the layout
// actually hands it, so the browser fetches a variant for the hole instead of
// assuming 100vw and downloading the widest file (§10.6, ui/Image's G2 a11y
// A5 note). The 60rem in it is the ONE place a media query stands in for the
// container step below, and it is not a second breakpoint: `sizes` is a hint
// the preload scanner reads before any layout exists, container queries
// cannot be spelled in it, and 60rem is precisely the viewport at which
// `@3xl` fires here under an overlay scrollbar (a classic one moves the
// step — the one window below) — 48rem of column plus the gutter's 2×10vw,
// i.e. column = 0.8 × viewport.
//   THE WIDE BRANCH IS `min(36rem, calc((80vw - 3rem) * 0.4333),
//   calc(80vw - 31rem))`, NOT A FLAT 36rem (G2 react, 2026-09-21 — the
//   principle; D51a, 2026-09-26 — the numbers). It is the picture box's own
//   formula (below) spelled in vw, the column being 0.8 × viewport: the
//   column-tied width, 1.3 × round 2j's ⅓ track (`(100cqi − 3rem) × 0.4333`),
//   capped at 36rem, and — the third term — what the row leaves after the
//   words' 28rem and the 3rem gap, which is the SMALLER of the two just above
//   the step (below a ~1050px viewport). The cap binds from ~1720px. MEASURED
//   in Chromium (the story runner, whose canvas carries a 15px classic
//   scrollbar that `vw` counts and the column does not — so the hint runs a
//   few px generous, never short, wherever the row stands): 1000 → 289px
//   (hint 304), 1100 → 354 (hint 361), 1280 → 416, 1536 → 505, 1760 / 1920
//   → 576, the cap. THE ONE WINDOW WHERE IT IS SHORT (G2 tier 2, react,
//   2026-09-26 — recorded, no second breakpoint): with a classic scrollbar
//   the `@3xl` step fires at ~979px of viewport while the `(min-width:
//   60rem)` branch fires at 960, so between 960 and 979 the hint says
//   272–287px for a picture rendered stacked at 320px; only DPR 1.25 picks a
//   different `srcset` candidate there (384 vs 640, a ~4 % upscale), and
//   every other DPR lands on the same file. A flat 36rem would overstate the
//   box by up to 304px through the 960–1720px band, and the two-term
//   spelling by up to ~40px just above the step. Math functions
//   are legal in a `sizes` source-size value, and the CAP still tells the
//   scanner the box stops growing. (Round 2j's `min(28rem, calc((80vw - 3rem)
//   / 3))` described the ⅓ track D51b retired; a German name token that
//   widens the words column past 28rem narrows the picture by a few pixels
//   only where the row binds, inside the scrollbar's slack.)
//
// ── THE HEADING IS THE PAGE'S <h1>, AND THIS BAND OWNS IT. A doctor page has
// exactly one outline root and it is the doctor's name; the Team page's
// roster owns its own, and the two never share a page. `Heading size="hero"`
// is the step — one fluid clamp, 32px at the 320 stress width up to the old
// site's 72px from 1600px on (the atom's own header) — worn through `asChild`
// onto a REAL <h1>, because the atom answers "how big is this title" and
// never "which element is it". The position goes through ui/Eyebrow, the only
// consumer of the §3 mono token, so the uppercase is CSS and the string stays
// sentence case (Ș/Ț case mapping is the browser's job, §8.2/§8.8) —
// PersonnelCard's D5 recipe, its `text-center` included BELOW THE STEP only:
// stacked, the pair stands centred ABOVE the picture (D51c), and beside it
// the words are start-aligned against the picture again — `@3xl:text-start`
// on each of the two elements, §15.15 b's per-element re-assertion (never
// `text-left`, never a wrapper blanket).
// `hyphens-none` on both lines: the site-wide `hyphens: auto` (§15.14) is for
// PROSE, and neither a person's name nor a medical title may break at a
// syllable — they wrap between words or not at all.
//   THE <h1> COMES FIRST IN THE DOM, and the eyebrow paints above it through
//   `flex-col-reverse` on the pair (G2 a11y, 2026-09-21 — this SUPERSEDES the
//   contract's DOM sketch, which had the eyebrow first in both orders). The
//   reason is the heading key: a screen-reader user pressing H lands on the
//   page's one heading, and with the eyebrow before it the first thing they
//   met on a doctor's page was „MEDIC SPECIALIST ORTODONȚIE" — a qualification
//   with nobody attached to it yet. Now the name comes first and the
//   qualification is the next line read. SC 1.3.2 (Meaningful Sequence) holds
//   because name → specialty is a correct reading of the pair, and it is the
//   order sections/PersonnelCard already uses one tier down, so the two
//   surfaces that print the same two facts agree. Nothing here is focusable,
//   so the reverse costs no tab order (the failure mode `flex-*-reverse`
//   usually carries) — and the same holds for the `-order-1` that lifts the
//   pair above the picture in the stack (D51c): the picture before it in the
//   DOM is decorative (`alt=""`), so the <h1> is still the first thing a
//   screen reader names.
//
// ── D12 · THE CREDO CARD IS REQUIRED, AND IT FILLS THE SPACE UNDER THE NAME.
// Round 2's brief (owner, 2026-09-25): "below [the specialty + the name] I
// need the card from reviews, but … the non current one … Within it I need
// just the internationalised quotations and … the original doctor text from
// the doctor card with bold text … So in that empty space next to photo below
// [the heading]. Within this card I also want a heading with eyebrow". So the
// words column reads PAIR → CARD → SLOT: the name (and its specialty), then
// what the doctor says, then whatever the page adds. `credo` is REQUIRED
// rather than optional because a doctor page without it is not the design —
// the empty space beside the cutout is exactly what the card was asked to
// fill — so a populator that forgot it fails `tsc`, not a pack review. The
// shape is `{ eyebrow, title, body }`: the eyebrow is Claude's pick („În
// cuvintele mele", round 2's D20), the title „Filozofia mea", and `body` is a
// ReactNode because it carries ui/Keyword's fragments — the doctor card's own
// quote with its key words, the page building it from lib/team's
// `philosophy` (D17). Everything about the card itself — ui/Card's `framed`
// tone (the reviews deck's idle card) in ui/Card's `aura` (D61, the owner's
// "add an aura around the filozofia mea card"; the glow's reach against this
// band's gaps is measured there), the named region, the <h2> through
// SectionHeading, the CSS quote marks, the justified quote (D22) and its
// `text-xl` step (D43b) — is argued in CredoCard.tsx's header. What THIS
// file decides is only where the card stands: inside the words column,
// between the pair and the slot, so beside the picture it shares the
// column's width and left edge with the <h1> and the column's `gap-6` puts it
// one step below the name; in the stack it follows the PICTURE instead,
// across the column's full width, the grid's `gap-8` above it (D51c:
// "filozofia mea sits well below photo"). The outline that results is h1
// (the name) → h2 (the credo) — one level, no gap (§9) — in both
// arrangements, because neither moves a node in the DOM.
//
// ── THE SLOT STAYS `children`, AND IT RENDERS AFTER THE CARD. The owner has
// not said what else stands under the name; the WithActions story shows one
// candidate — the Hero's two calls to action — without this band deciding for
// him. Whatever arrives is the CONSUMER's markup, so its text alignment is the
// consumer's too (§15.15 b's per-element canon: a <p> dropped in here inherits
// the globals' `start`); the band adds no prose rule and no wrapper-level
// blanket centring, which that canon bars in every spelling.
//
// ── THE STEP, MEASURED AGAINST THE COLUMN. `@3xl` is 48rem of ui/Container's
// box — a ~960px viewport — the same step ClinicLocation and PriceList flip
// on, so the site's bands flip together (§6.5: container queries for component
// responsiveness, media queries only for page-level layout), and it is the
// owner's adaptability rule (2026-09-25, round 2's D21): beside on the wide
// step, one above the other below it. At §7's sampling points: 390 → 312px of
// column and 768 → 614px are the stacked arrangement, 1280 → 1024px, 1536 →
// 1228px and 1920 → 1536px are the row.
//   BESIDE, the two tracks are CONTENT-SIZED (`minmax(0,auto) auto` — the
//   picture's with a zero floor since 2026-09-27, THE STACKED TRACK
//   paragraph below) and the pair of
//   them is centred in the row (`justify-content: center`, D51b below): the
//   picture's track is its own box — the column-tied width of D51a wherever
//   the row has room, whatever is left just above the step — and the words'
//   track is the words column's 28rem. With `center` the tracks never stretch (only
//   `normal`/`stretch` grow auto tracks), so the free space falls OUTSIDE the
//   pair, equally on both sides. The picture STANDS ON THE ROW'S FLOOR
//   (`@3xl:self-end`) whatever the words do, because a cutout is a person
//   standing and a person standing floats only by accident. (Round 1's
//   `@3xl:justify-self-center` is gone with the stretched tracks: a
//   content-sized track IS the picture's box, so there was nothing left in
//   it to centre — the centring moved to the pair.)
//   STACKED (D51c below), the words column dissolves (`display: contents`) and
//   its blocks join the grid as items of their own: the pair climbs above the
//   picture (`-order-1`), centred; the picture follows, capped at 20rem and
//   centred in the column — at every phone width the column is narrower than
//   that cap, so the figure fills it, and at the 320px stress width 241px of
//   column (the runner's scrollbar included) still hold the whole figure with
//   nothing scrolling sideways (§7, §9); then the credo card across the full
//   column, then the slot — the grid's `gap-8` between all of them.
//   THE PICTURE IS THE TALL ITEM at every laptop width (MEASURED in Chromium
//   after D51, the story runner's 15px scrollbar included — figure ‖ words
//   column, `lowered` excluded): 1280 → 555 ‖ 394px, 1536 → 673 ‖ 405, 1920
//   → 768 ‖ 498 (the name wraps to two lines in the 28rem column there), so
//   `align` has room to move the words — with the least of it at 1280, where
//   a three-line German name makes the column 546px beside the 555px figure
//   (and `lowered`'s 7rem tips that case over — D54, the FOURTH SEAT).
//   Just above the step the figure's track is only ~290px wide and ~385 tall
//   (a 1000px viewport, measured) while the words column keeps its 28rem and
//   ~382px of height, so the column can be the taller item — and once it is,
//   it IS the row, the
//   `align` values coincide (bar `lowered`'s own 7rem of padding), and the
//   figure still stands on the floor. That is the axis running out of room,
//   not a fifth state. The band owns its own `py` on container steps (the
//   PAGE-BAND RECIPE's rule 3, in Container.tsx's header) and no outer margin
//   at all — the page owns the rhythm between its bands (§6.4).
//
// ── THE STACKED TRACK IS `minmax(0,1fr)`, NEVER `auto` (2026-09-27, CI on PR
// #110, Linux Chromium). Below the step the grid had no template, so its one
// column was an implicit `auto` track — and an `auto` track's floor is its
// items' min-content. MEASURED on CI at 390×844 (Pages/Doctor › German, fonts
// loaded): ui/Container's column 39 → 336px (297px — Linux reserves a 15px
// scrollbar gutter), but the pair, the picture and the credo card all 320px
// wide, 39 → 359. The min-content was the picture BOX's, not its pixels: CI's
// diagnostic run measured that 320px track with the cutout ERRORED (complete,
// naturalWidth 0) — CI's Vitest step runs before any image optimizer, so
// ui/Image's variants do not exist there — and its diagnosis is the `<img>`'s
// width attribute under the box's `max-w-xs` cap (20rem), whether or not
// pixels ever arrive. The track grew to it, every item overflowed the column
// by 23px and the centred name sat 11.5px right of the column's centre; on a
// phone without a gutter (312px of column) the same overflow is 8px. It never
// showed on the Windows workstation. MEASURED here, the German story's cutout
// was still unsettled at the play's first read (no source chosen yet,
// incomplete) — so every play now waits for its pictures to SETTLE first, the
// stories' `picturesSettled`, loaded or errored alike — but the track read
// 297px both before and after the settle: the mask on this machine is the
// ENGINE. Its Chromium (Playwright 1.62.1's build 1234, CI's own) keeps the
// picture's min-content out of the track on every path measured — the
// optimizer's WEBP variant (natural 320px; the variants are gitignored and
// exist here from earlier builds) and the original PNG (natural 750px, loaded
// directly for the probe). A model item carrying a shrinkable 20rem
// min-content inside the picture's box reproduces CI's 23px exactly on this
// engine, and that is how the stories' new pins were proven to fail on the
// old class. THE CURE IS THE TRACK'S OWN FLOOR:
// `grid-cols-[minmax(0,1fr)]` makes the column exactly the Container's width
// whatever any item's min-content, so `w-full` on the picture's box resolves
// against the column and `max-w-xs` caps it only where the column is WIDER
// than 20rem (a tablet). At the step the two-track
// `@3xl:grid-cols-[minmax(0,auto)_auto]` replaces it — a compile probe of
// this repo's own stylesheet emits the base rule among the utilities and the
// `@3xl` rule after it, inside its container query, at equal specificity, so
// the step's tracks win.
//   THE STEP'S PICTURE TRACK HAD THE SAME FLOOR, AND GOT THE SAME CURE (the
//   coordinator's ruling, the same day). As `auto auto`, the picture's track
//   kept its min-content under the CI model (a static probe of this band's
//   structure, the stylesheet compiled from globals.css): the `cqi` cap, up to
//   0.4333 × (column − 3rem), beside the 28rem words and the 3rem gap — three
//   widths that only fit from a ~52.4rem column. The centred pair overflowed
//   both sides by 18.6px at a 985px window, 15.2 at 1000, 9.7 at 1024 and 3.8
//   at 1050, and fit from 1070; and that window, from the step to ~1070px, is
//   photographed by NO frame (§13: sections at 390 + 1536, pages at 320 · 390
//   · 768 · 1280 · 1536 · 1920; the plays run at 390, 1280 and 1536).
//   `minmax(0,auto)` gives the picture's track a zero floor and keeps `auto`
//   as its ceiling, so under `justify-content: center` it still never
//   stretches, and where the row is short the PICTURE gives way (the words
//   keep their definite 28rem): the probe kept every one of those widths
//   inside the column, and MEASURED it identical to the old tracks — box for
//   box, the tracks, the picture's box and the edges read back equal to the
//   tenth of a pixel — at every width sampled, 985 · 1000 · 1024 · 1050 ·
//   1070 · 1100 · 1280, and the stacked 390 · 320 — on this workstation's
//   Chromium, which already kept the picture out (picture track 277 / 289 /
//   308.2 / 329 / 343.6 / 354 / 416.4px either way). What the stories' plays
//   already expect beside the picture — its track = min(cap, what the row
//   leaves after the words and the gap) — is now what the tracks guarantee.
//
// ── D43a · THE RHYTHM HALVED (owner, 2026-09-26, round 2j: "it starts height
// wise too low. i need you to push it higher … with the above section
// starting higher i mean also the image, so the whole thing"): `py-6
// @lg:py-8 @3xl:py-10` — 24 / 32 / 40px — where round 1 had `py-12 @lg:py-16
// @3xl:py-20` (48 / 64 / 80). The PILL IS IN FLOW above this band (D38's
// finding), so the band's own top padding IS the air between the header and
// the figure's crown; halving it lifts the WHOLE opener — picture, specialty,
// name, card — by the same 24 / 32 / 40px, and nothing can slide under the
// pill because nothing here is positioned. The bottom padding halves with
// it: the recipe's `py` is one rhythm, and the next band's own top padding
// still stands between this figure's feet and the lilac fade. The `lowered`
// seat (`@3xl:pt-6` then, D38; `pt-28` since D54) is untouched — it moves the
// words INSIDE the row, this moves the row. MEASURED at 1280 / 1536 / 1920:
// band top → figure top 80 → 40px, band top → specialty 104 → 64px (152 since
// D54), band height 672 → 507, 757 →
// 598, 757 → 677 (the ⅓ track shortens the figure too). D51 keeps both tops
// exactly (40 and 64px) and grows the figure DOWNWARD: 635 / 753 / 848px.
//   D61 · THE PHONE FLOOR IS ONE STEP TALLER (round 2r, 2026-09-26): `pt-6
//   pb-8 @lg:py-8 @3xl:py-10` — the TOP keeps D43a's 24px on every phone (the
//   owner's "push it higher" is untouched), only the BOTTOM below `@lg` grows
//   24 → 32px. The reason is the credo card's aura (CredoCard.tsx's D61
//   paragraph): in the stack the card is the band's LAST item, its glow
//   reaches ~32px below it, and the next band (sections/TintedBand, a
//   `relative` outer that paints over an earlier sibling's shadow) cut that
//   tail at 24px — a ~5/255 step, measured at 320 and 390. 32px is the
//   tablet's floor already (`@lg:py-8`), where the last glow pixel before
//   the edge is 1/255 off the ground, so the phone now matches it. From
//   `@lg` up nothing changes: `@lg:py-8` and `@3xl:py-10` come later in the
//   sheet than the base `pt-6`/`pb-8` and win at their steps.
//
// ── D43b · THE WORDS TOOK ⅔ OF THE ROW — SUPERSEDED BY D51b (round 2k, the
// next paragraph); kept as the history the numbers there are measured
// against. The owner, round 2j: "put a bigger card for filozofia mea"; the
// tracks were `minmax(0,1fr)` ‖ `minmax(0,2fr)`. MEASURED: the picture box 384 → 320px at 1280, 448 →
// 389 at 1536 (the 28rem cap stopped binding there), 448 at 1920 (the cap
// still binds, the track is 491); the credo card 577 → 641, 700 → 777, 884
// → 982px wide. The figure shrinks by what the card gains, which is the
// trade the ask implies; `sizes` follows (the IT IS THE DOCTOR PAGE'S LCP
// paragraph above). The card's type and inset are argued in CredoCard.tsx's
// D43b paragraph — in short: the quote steps up to `text-xl`, and the inset
// is ui/Card's to grow, not this band's.
//
// ── D51 · THE OPENER RE-PROPORTIONED (owner, 2026-09-26, round 2k — three
// asks; D51 in round 2's ledger is the anchor other files cite, §17.7):
//   (a) "i want the photo to be like 30% larger all around. top start of
//   general section should remain the same, so do not push it upwards": the
//   picture box is round 2j's ⅓-track picture × 1.3, TIED TO THE COLUMN —
//   `@3xl:max-w-[min(36rem,calc((100cqi-3rem)*0.4333))]`, where `100cqi` is
//   ui/Container's width (the nearest `@container`; the Container has no
//   padding, so it IS the column) and 0.4333 = 1.3 / 3 — capped at 36rem
//   (1.3 × 28rem = 36.4, the scale's nearest step), and under (b)'s
//   content-sized tracks limited only by what the row leaves just above the
//   step. The coordinator's ruling on this builder's first cut: a FIXED cap
//   (`max-w-lg`, 32rem) could not do it, because the old box grew with its
//   track and a cap does not — it measured +60 % / +32 % / +14 % at 1280 /
//   1536 / 1920. The column-tied width MEASURES, against round 2j's box:
//   1280 → 320 × 427 → 416 × 555 (+30.0 %), 1536 → 389 × 518 → 505 × 673
//   (+30.0 %), 1920 → 448 × 597 → 576 × 768 (+28.6 %, the 36rem cap). THE
//   TOP DOES NOT MOVE: the band's rhythm is D43a's, untouched, so the crown
//   still sits 40px under the band's top and the specialty 64px (`lowered`
//   under D38; 152px since D54);
//   the figure grows downward and the band with it, 507 / 598 / 677 → 635 /
//   753 / 848px. THE FEET CLEAR THE FIRST SCREEN at both laptop screens §7
//   samples, under the pill's 98px flow box (Header.tsx's mount contract —
//   nothing stands between the pill and this band on the doctor page):
//   98 + 595 = 693px of an 800px-tall 1280 window, the band's bottom at 733;
//   98 + 713 = 811px of an 864px-tall 1536 window, the band's bottom at 851;
//   98 + 808 = 906px of a 1080px-tall 1920 window.
//   (b) "the philosophy card should be like 70% as wide as it is now and
//   taller rather" + "… left and right they have same as much space":
//   `@3xl:grid-cols-[auto_auto] @3xl:justify-center` (the picture's track
//   `minmax(0,auto)` since 2026-09-27) — the tracks no longer
//   stretch to the gutters and the free space splits evenly outside the pair
//   (MEASURED, left ‖ right: 48.3 ‖ 48.3px at 1280, 106.3 ‖ 106.3 at 1536,
//   224.5 ‖ 224.5 at 1920). The words column is
//   28rem and the pair and the card share it: 448px = 70 % of round 2j's
//   641px card at 1280 (58 % of 777 at 1536, 46 % of 982 at 1920), so the
//   quote wraps to five lines and the card grows TALLER by itself — 214 /
//   214 / 186px → 266px at all three.
//     `@3xl:w-md`, NOT A MERE `max-w-md` CAP — measured: an auto track sizes
//     to its item's max-content, and ui/Card's `@container` (inline-size
//     containment) contributes NOTHING to that, so under a cap alone the
//     column shrank to the NAME's width — 388px at 1280 for „Dr. Elena
//     Marin", ~314 for a short name — and the card with it. A definite 28rem
//     is the width the ask names, whatever the name.
//     `@3xl:min-w-min` — measured too: at the `hero` step a German name
//     token outgrows 28rem („Schwarzenbeck-" = 460px at 1536, 475 at 1920;
//     hyphenation is off on purpose), so the column widens to the name's
//     longest unbreakable line instead of letting the <h1> overflow it; the
//     card follows and the pair stays centred (100.4 ‖ 100.4px at 1536).
//     Every name that fits keeps exactly 28rem — the contract's `max-w-md`,
//     corrected on measurement and kept on the coordinator's ruling.
//     THE PRICE, STATED AND PINNED: the name shares the card's 28rem, so at
//     the `hero` step a name of ~15 characters is close to one line —
//     „Dr. Elena Marin" measures 388px at 1280 and 445.2 of 448 at 1536 (one
//     line each; two at 1920's 72px), „Dr. Andrei Șerban" 443.8 at 1280 (one
//     line) and two lines at 1536. The stories' Default and Notebook plays
//     assert the stories' demo doctor on ONE line at 1536 and 1280, so a
//     font-rendering drift that wraps her name fails a play instead of
//     slipping into a baseline.
//   (c) "on tablet/phone screens i want name and speciality of doctor to
//   appear above the photo and to be centered, not left based … filozofia mea
//   sits well below photo": D21's stacked branch reordered. The words column
//   is `contents` below the step, so the pair, the card and the slot become
//   the one-column grid's own items; the pair takes `-order-1` and climbs
//   above the picture, the card stays after it. The eyebrow and the <h1>
//   each carry `text-center @3xl:text-start` ON THE ELEMENT (§15.15 b), and
//   the pair box's `items-center @3xl:items-start` centres the two BOXES — a
//   wrapper may centre boxes, never blanket-centre prose. The DOM stays
//   picture → pair → card (the header's THE HEADING IS THE PAGE'S <h1>
//   paragraph says why that costs nothing). MEASURED, band top → pair /
//   picture / card: 390 → 24 · 124 · 552px, 768 → 32 · 146 · 604; the stack
//   8px taller than round 2j's (the grid's `gap-8` now stands where the
//   column's `gap-6` stood, above the card).
//
// ── D43c · TWO EYEBROWS, ONE SIZE — MEASURED, NOT ASSUMED. The owner asked
// (2026-09-26) why „În cuvintele mele" reads larger than „Medic specialist
// ortodonție" when both are the same component. They ARE the same
// component, and in Chromium at 1280×800 every typographic value is
// identical: font-size 14px, letter-spacing 1.4px (0.1em), weight 500, line
// height 20px, JetBrains Mono, uppercase, ink rgb(91 85 79), a 20px-tall box
// each — the Default story's play asserts that equality. The only measured
// differences are the words themselves (27 characters, 264.6px of ink, vs 17
// and 166.6px) and what stands around them, and those are why the eye
// disagrees: the specialty is a 14px label over a 61–72px name (the fluid
// `hero` step), roughly one to five, while the card's sits over the card's
// 30–36px title, one to two and a half — the same letters read small beside
// a giant and large beside a neighbour of their own order; and the card's
// eyebrow is ENCLOSED, on white inside a 3px lavender frame, where the
// specialty stands on the open page ground (rgb 250 249 247). The `Î`'s
// circumflex also rises above the capital line that „MEDIC SPECIALIST"
// never leaves. Changing either would break ui/Eyebrow's one-step law (its
// header: one step, no axes, a second size only for a measured consumer) to
// correct a perception, so nothing changed; if the owner still wants the
// card's label quieter, the levers are context — the title's step, the
// card's ground — never a second eyebrow size.
//
// ── ISLANDS (§16). No 'use client' in this file: no state, no handler and not
// one hook, so the band compiles into the page's static HTML. The credo card
// calls one hook, React's server-safe useId (for its name pair), and ships no
// directive either (CredoCard.test.tsx pins both). The ONE cost, stated
// rather than discovered: ui/Image wraps next-image-export-optimizer, which
// ships its own directive, so the cutout brings a small client island with it
// — PersonnelCard's D11, accepted here for the same reason (the photograph is
// why the band exists). DoctorIntro.test.tsx pins the directive's absence and
// the whole import surface from the source text, because no runtime assertion
// can see either.
//
// ── THE CREDO TYPE IS DECLARED IN CredoCard.tsx AND RE-EXPORTED HERE. The card
// reads the shape and may import nothing from its band (its import-surface
// pin — a band ↔ card import would be a cycle), so the declaration lives with
// the reader; the re-export is the band's public name for the shape, beside
// the other two prop shapes. The doctor page builds the `credo` literal
// inline and checks it against this re-export with `satisfies
// DoctorIntroCredo` — [slug]/page.tsx and its Pages/Doctor story twin both —
// while the populator (team/populate.ts) hands over only the quote node that
// becomes `body`, never the shape. DoctorIntro.test.tsx pins the re-export
// line.

/** Where the words sit beside the picture at the wide step (D6). */
export type DoctorIntroAlign = 'start' | 'lowered' | 'center' | 'end';

/**
 * The cutout file: a path under public/images/ plus its INTRINSIC pixel size —
 * the optimizer's srcset input and the reserved box (§11, zero layout shift).
 * Transparent background, by the owner's brief. No alt: decorative by
 * construction, because the <h1> beside it IS the identity (PersonnelCard D3).
 *
 * `src` is lib/image-path's `ImagePath` rather than a `string` (G2 typescript,
 * 2026-09-21): public/images/ is the one folder the export optimizer scans, so
 * a path outside it — or one that lost its leading slash — would ship as a
 * broken picture with nothing to notice it. The TYPE is the shared thing here;
 * the SHAPE still is not.
 *
 * Structurally PersonnelCard's `PersonnelPhoto` and deliberately NOT imported
 * from it: §4 lets a section compose another section's public COMPONENT but
 * never reach into its internals, and a shared type would have to climb to a
 * tier both may import. Two four-line shapes that happen to agree are cheaper
 * than a promotion with one consumer on each side (§4's N ≥ 3 row) — and what
 * they now agree on, both sides import from the foundation ring.
 */
export type DoctorIntroPhoto = Readonly<{
  src: ImagePath;
  width: number;
  height: number;
}>;

type DoctorIntroOwnProps = Readonly<{
  /** The doctor's full name, finished text (§8.1) — becomes the page's <h1>. */
  name: string;
  /**
   * The specialty, finished text — the mono eyebrow above the name. Authored
   * in SENTENCE case: the uppercase is ui/Eyebrow's CSS.
   */
  position: string;
  photo: DoctorIntroPhoto;
  /**
   * The credo card under the name (D12) — REQUIRED: eyebrow + title (the
   * card's <h2> and its region's name) + the doctor's own words, `body` a
   * ReactNode carrying ui/Keyword's fragments. No quotation marks inside —
   * they are CSS, in the document's language.
   */
  credo: DoctorIntroCredo;
  /** Where the words sit beside the picture at the wide step: the row's top,
   *  7rem under it (`lowered`, round 2e — 1.5rem under D38, 7rem since D54),
   *  its middle, or its floor.
   *  @default 'start' */
  align?: DoctorIntroAlign;
  /**
   * Free slot AFTER the credo card — the owner is still deciding what else
   * goes here (the WithActions story shows one candidate). Its own text
   * alignment is the consumer's, per §15.15 b.
   */
  children?: ReactNode;
}>;

// The card's words shape, re-exported as part of the band's public surface
// (see the header's THE CREDO TYPE paragraph).
export type { DoctorIntroCredo };

export type DoctorIntroProps = DoctorIntroOwnProps &
  // The native <section> surface, minus this band's own names and minus the
  // two ARIA naming attributes: the band is a generic box on purpose, and a
  // caller's name would turn it into the region it refuses to be (see the
  // header). React 19 carries `ref` inside these props, so it needs no
  // mention of its own (§6.8).
  Omit<
    ComponentPropsWithRef<'section'>,
    keyof DoctorIntroOwnProps | 'aria-label' | 'aria-labelledby'
  >;

// Record<> rather than a ternary — ui/Heading's growth gate, the one the whole
// repo uses: widening DoctorIntroAlign cannot compile until this table names
// the new value, where a ternary would map anything new onto the start row in
// silence. Every row is a single `@3xl:self-*` token, because the axis moves
// the words INSIDE the row and changes nothing else — not the tracks, not the
// picture, not the gap. Every row is `@3xl:`-prefixed on purpose: below the
// step the words column is `display: contents` (D51c), a box that no longer
// exists, so a seat there would have nothing to seat.
const ALIGN: Record<DoctorIntroAlign, string> = {
  start: '@3xl:self-start',
  // The top seat dropped 7rem (D54: 20 % of the figure at 1280; 1.5rem under
  // D38, 3rem in round 2e) — the padding rides the words column itself, so
  // the figure keeps its floor and, while the column stays the shorter item,
  // the row keeps its height (D6's FOURTH SEAT). `pt-28` is the owner's one
  // lever: move it along the spacing scale and nothing else changes.
  lowered: '@3xl:self-start @3xl:pt-28',
  center: '@3xl:self-center',
  end: '@3xl:self-end',
};

export function DoctorIntro({
  name,
  position,
  photo,
  credo,
  align = 'start',
  className,
  children,
  ...rest
}: DoctorIntroProps): ReactElement {
  return (
    // BAND OUTER: the semantic element, full-bleed, owning the paint and
    // nothing else (the PAGE-BAND RECIPE's rule 1). `bg-page` IS the
    // "transparent background" of the brief — the page ground the cutout's
    // own transparency then lets through. className is merged caller-last
    // (§6.8), so a page's placement utility wins where placement is allowed.
    <section {...rest} className={cx('bg-page', className)}>
      <Container>
        {/* The rhythm box AND the row, one element: the band's own stepped
            `py` (the recipe's rule 3 — halved in round 2j, D43a, untouched by
            D51; below `@lg` the floor is `pb-8`, one step above the top, for
            the credo card's aura — D61, the header's D43a paragraph) plus, at
            the step, two CONTENT-SIZED tracks centred in the row (D51b).
            Below the step ONE `minmax(0,1fr)` track, the column's width
            exactly — never an `auto` track the picture's box can widen (the
            header's THE STACKED TRACK paragraph, 2026-09-27).
            `gap-8` is the section owning ALL child spacing (§6.4) — below
            the step between all four stacked items (D51c); the children keep
            no outer margins of their own. */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 pt-6 pb-8 @lg:py-8 @3xl:grid-cols-[minmax(0,auto)_auto] @3xl:justify-center @3xl:gap-12 @3xl:py-10">
          {/* THE PICTURE'S BOX. Stacked: capped at 20rem and centred in the
              column, under the pair (D51c). Beside: round 2j's ⅓ track ×
              1.3, tied to the column through `cqi` and capped at 36rem
              (D51a) — its track IS its box, since the tracks are
              content-sized — standing on the row's floor (see the header). */}
          <div className="mx-auto w-full max-w-xs @3xl:mx-0 @3xl:max-w-[min(36rem,calc((100cqi-3rem)*0.4333))] @3xl:self-end">
            <Image
              variant="artwork"
              src={photo.src}
              width={photo.width}
              height={photo.height}
              alt=""
              preload
              fetchPriority="high"
              sizes="(min-width: 60rem) min(36rem, calc((80vw - 3rem) * 0.4333), calc(80vw - 31rem)), 20rem"
            />
          </div>
          {/* THE WORDS: PAIR → CARD → SLOT (D12). Beside the picture it is a
              28rem flex column (D51b — `w-md`, widened only by a name token
              that is wider still, `min-w-min`): `gap-6` between the three
              blocks, the card stretching to the column's width (a flex
              COLUMN item — ui/Card D3), so the pair and the card share one
              width and one left edge. Below the step it is `contents` (D51c):
              the box dissolves and its three blocks become the grid's own
              items, so the pair can climb above the picture while the card
              stays after it. ALIGN's rows are all `@3xl:`, so the seat
              exists only where the column does.
              THE PAIR IS `flex-col-reverse`: the <h1> comes FIRST in the DOM
              and the eyebrow paints above it (see the header's THE HEADING IS
              THE PAGE'S <h1> paragraph); `-order-1` lifts it above the
              picture in the stack, `items-center` centres its two boxes
              there, and each line centres its own text ON THE ELEMENT
              (§15.15 b), back to `start` beside the picture. */}
          <div
            className={cx(
              'contents @3xl:flex @3xl:w-md @3xl:min-w-min @3xl:flex-col @3xl:gap-6',
              ALIGN[align],
            )}
          >
            <div className="-order-1 flex flex-col-reverse items-center gap-2 @3xl:order-none @3xl:items-start">
              <Heading size="hero" asChild>
                <h1 className="text-center hyphens-none @3xl:text-start">
                  {name}
                </h1>
              </Heading>
              <Eyebrow className="text-center hyphens-none @3xl:text-start">
                {position}
              </Eyebrow>
            </div>
            <CredoCard {...credo} />
            {children}
          </div>
        </div>
      </Container>
    </section>
  );
}
