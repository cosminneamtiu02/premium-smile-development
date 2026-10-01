import type {
  ComponentPropsWithRef,
  CSSProperties,
  ReactElement,
  ReactNode,
} from 'react';
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
// respective div next to image, center or bottom." Its laptop and desktop
// arrangement has been the owner's own since 2026-10-01 — D62 to D64 below:
// two containers across the whole column, a third of it for the picture and
// the rest for the words, the picture grown down to the words' floor.
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
// ── D6 · THE `align` AXIS — RETIRED BY D62 (2026-10-01). It existed because
// the owner was still deciding where the words sit beside the picture: "idk
// yet if i should place [the words] sticky to the top of respective div next
// to image, center or bottom" — `start` (the default, the referenced page's
// arrangement), `center`, `end`, and the fourth seat `lowered`, which the
// page passed: the top seat dropped 3rem in round 2e ("push this a bit more
// down"), 1.5rem in round 2g (D38, "push it a little more upwards"), 7rem in
// round 2l (D54, "push like idk, 20% more down just textual part"). Each
// value was one `@3xl:self-*` token that moved the words' column inside the
// row. D62 answers the question with a STRUCTURE instead of a seat — the
// eyebrow and the name TOP the words' container and the credo card centres in
// the height they leave — so no value had anything left to move, and the
// axis left whole rather than staying as dead API (§6.6: the prop, its
// table, its three stories — Centered, Lowered, Bottom — and the page's
// `align="lowered"`, in one change). The name's height beside the picture
// is one token again since D63: the words' container's top padding (D64
// spells it), the kind D54's `pt-28` was.
//
// ── THE CUTOUT: ui/Image's `artwork` RECIPE IN THE STACK, THE BAND'S OWN
// GEOMETRY BESIDE THE WORDS (D64). The owner's picture has no background, and
// ui/Image's `artwork` recipe is the one built for exactly that (its D4):
// `h-auto max-w-full object-contain` shows the whole figure, never upscales
// it past its intrinsic size, and `placeholder="empty"` keeps a blur ghost
// out of the transparent corners the design depends on. From the step the
// figure must do what no variant does — stand on the row's floor and grow
// with the row's height (D64) — so the band takes `variant="plain"` and owns
// the geometry, the atom's own rule for a consumer whose geometry differs
// (Image.tsx's merge-order note: className positions, it never out-styles a
// variant). It spells the recipe's three utilities itself as the stacked
// geometry, `artwork`'s `placeholder="empty"` as an explicit prop, and its
// `@3xl:` tokens after them; DoctorIntro.test.tsx DERIVES the stacked half
// from the atom's `artwork` row, so the stack is the variant to the byte.
// Beside the words the cutout is as tall as the row and never past its file:
// the picture's track is capped at the cutout's own width (D63), so where the
// picture sets the row the cutout is at most its intrinsic size (953px tall at
// 2560, 1200 from a ~3115px window up), and where the words set it the row is
// a laptop's ~600–750px.
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
// lazy, so nothing competes with it. `sizes` states the boxes the layout
// actually hands it, so the browser fetches a variant for the hole instead of
// assuming 100vw and downloading the widest file (§10.6, ui/Image's G2 a11y
// A5 note). The 60rem in it is the ONE place a media query stands in for the
// container step below, and it is not a second breakpoint: `sizes` is a hint
// the preload scanner reads before any layout exists, container queries
// cannot be spelled in it, and 60rem is precisely the viewport at which
// `@3xl` fires here under an overlay scrollbar (a classic one moves the
// step — the one window below) — 48rem of column plus the gutter's 2×10vw,
// i.e. column = 0.8 × viewport.
//   THE TWO WIDE BRANCHES ARE D64's CAP spelled in viewport units: beside
//   the words the cutout grows to at most 1.4 × the picture's third, i.e.
//   7/15 of ui/Container's column — `calc(80vw * 7 / 15)` while the gutter
//   is 10vw (the column 0.8 × the viewport), `calc((100vw - 25rem) * 7 /
//   15)` from a 125rem = 2000px window, where the gutter's 12.5rem cap binds
//   and the column is the viewport less 25rem. The CAP and not the third, on
//   purpose: at a laptop width the cutout IS grown (449px wide at 1280
//   against a 336px third — D64's table), and a hint at the third would
//   fetch a file the browser then stretches. Where it is not grown (a
//   desktop, the picture the taller container) the hint runs up to 40 %
//   generous, which at DPR 2 changes nothing — every box from ~415px up
//   takes the same full-size file, because the variants past 828px are the
//   900px original (the optimizer never enlarges) — and at DPR 1 costs one
//   step of the width ladder. Both branches also run a few px generous
//   because `vw` counts a classic scrollbar's 15px and the column does not.
//   Math functions are legal in a `sizes` source-size value.
//   EVERY `vw` HERE FOLLOWS A `(`, NEVER A SPACE — load-bearing, MEASURED
//   2026-10-01: Next's srcset builder (next/dist/shared/lib/get-img-props'
//   `getWidths`) scans `sizes` with `/(^|\s)(1?\d?\d)vw/` and reads every
//   match as a FLOOR on the picture's width, dropping every file under 640px
//   × that share from the srcset. D62's first spelling, `calc((max(80vw,
//   100vw - 25rem) - 3rem) * 0.35)`, put a space before `100vw`: the 16–384px
//   files left the srcset, a phone's 320px box fetched the 640px file, and
//   its rounded ratio moved the stacked picture 0.2px. DoctorIntro.test.tsx
//   pins the 384px file in the srcset. (History: D51a's centred pair spelled it
//   `min(36rem, calc((80vw - 3rem) * 0.4333), calc(80vw - 31rem))` — the
//   column-tied picture under its 36rem cap; G2 react, 2026-09-21, the
//   principle that the hint follows the box rather than a flat width.)
//   THE ONE WINDOW WHERE IT IS WRONG (G2 tier 2, react, 2026-09-26 — recorded
//   again for D64, no second breakpoint): with a classic scrollbar the `@3xl`
//   step fires at ~979px of viewport while the `(min-width: 60rem)` branch
//   fires at 960, so between 960 and 979 the hint says ~358–365px for a
//   picture rendered stacked at 320px — GENEROUS since D64, where D62's 35 %
//   share had it short. At DPR 1 to 1.5 the browser picks the very file the
//   320px box asks for (384, 640, 640), at DPR 2 one step larger (750 for
//   640). Moving the condition to the classic step instead would make the
//   overlay-scrollbar window the wrong one — a lever, not taken.
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
// `@3xl:text-balance` on both lines (D62): beside the picture a line that
// wraps is BALANCED, so a name too long for one line of the words' container
// breaks where its two halves come out even — „Dr. Malea (Sabău)" over „Oana
// Bianca", where a greedy fill would strand „Bianca" alone under „Dr. Malea
// (Sabău) Oana" — and a two-line specialty does not end on one word. A name
// that fits keeps its one line: balancing only chooses WHERE a wrap falls,
// never whether one happens. The `@3xl:` prefix keeps the stacked branch's
// wrapping exactly what it was. An engine without `text-wrap: balance`
// (Safari before 17.5) simply wraps greedily.
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
// file decides is only where the card stands: beside the picture in the
// words' BOTTOM container (D62), up to 36rem wide (D63) on the left edge it
// shares with the name (D64), and centred in the height the name leaves; in
// the stack it follows the PICTURE instead, across the column's
// full width, the grid's `gap-8` above it (D51c: "filozofia mea sits well
// below photo"). The outline that results is h1 (the name) → h2 (the credo)
// — one level, no gap (§9) — in both arrangements, because neither moves a
// node in the DOM.
//
// ── THE SLOT STAYS `children`, AND IT RENDERS AFTER THE CARD. The owner has
// not said what else stands under the name; the WithActions story shows one
// candidate — the Hero's two calls to action — without this band deciding for
// him. Beside the picture it shares the bottom container with the card (D62):
// the card and the slot are centred TOGETHER in the height the name leaves,
// `gap-6` between them. Whatever arrives is the CONSUMER's markup, so its text
// alignment is the consumer's too (§15.15 b's per-element canon: a <p> dropped
// in here inherits the globals' `start`); the band adds no prose rule and no
// wrapper-level blanket centring, which that canon bars in every spelling.
//
// ── THE STEP, MEASURED AGAINST THE COLUMN. `@3xl` is 48rem of ui/Container's
// box — a ~960px viewport — the same step ClinicLocation and PriceList flip
// on, so the site's bands flip together (§6.5: container queries for component
// responsiveness, media queries only for page-level layout), and it is the
// owner's adaptability rule (2026-09-25, round 2's D21): beside on the wide
// step, one above the other below it. At §7's sampling points: 390 → 312px of
// column and 768 → 614px are the stacked arrangement, 1280 → 1024px, 1536 →
// 1228px and 1920 → 1536px are the row.
//   BESIDE is D62's two containers across the whole column, spaced by D63
//   and standing on D64's one floor — their own paragraphs below.
//   STACKED (D51c below), the words column dissolves (`display: contents`) and
//   its blocks join the grid as items of their own — the bottom container
//   too, so the card and the slot are the grid's own items, exactly as they
//   were before D62 gave them a box of their own beside the picture: the
//   pair climbs above the
//   picture (`-order-1`), centred; the picture follows, capped at 20rem and
//   centred in the column — at every phone width the column is narrower than
//   that cap, so the figure fills it, and at the 320px stress width 241px of
//   column (the runner's scrollbar included) still hold the whole figure with
//   nothing scrolling sideways (§7, §9); then the credo card across the full
//   column, then the slot — the grid's `gap-8` between all of them. The band
//   owns its own `py` on container steps (the PAGE-BAND RECIPE's rule 3, in
//   Container.tsx's header) and no outer margin at all — the page owns the
//   rhythm between its bands (§6.4).
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
// than 20rem (a tablet). At the step D63's two tracks,
// `@3xl:grid-cols-[minmax(0,var(--picture))_minmax(auto,1fr)]`, replace it — a
// compile probe of this repo's own stylesheet emits the base rule among the
// utilities and the `@3xl` rule after it, inside its container query, at
// equal specificity, so the step's tracks win.
//   THE PICTURE'S TRACK KEEPS A ZERO FLOOR, THE WORDS' AN `auto` ONE (D62,
//   D63; the words' floor from the Opus a11y review, 2026-10-01). A track's
//   default floor is `auto` — its item's min-content — and the picture's
//   item would bring the `<img>`'s 900px width attribute into it exactly as
//   above (the coordinator's ruling of 2026-09-27 gave D51's content-sized
//   picture track `minmax(0,auto)` for that reason), so the picture's is
//   `minmax(0,var(--picture))`: its third, exact wherever the words fit, and
//   never wider. Since D64 the cutout is out of that track's flow from the
//   step (absolutely placed), so its zero floor now guards the track against
//   whatever in-flow child arrives there next. The words' track is
//   `minmax(auto,1fr)`: what is left, and never less than the pair's longest
//   unbreakable run plus the 1.5rem inset (the bottom container's one track
//   and ui/Card's inline-size containment add nothing to that floor). At the
//   step's narrowest — a ~979px window: a 768px column, a 256px third, a
//   128px gap, a 14px inset — the pair has ~346px, about seven `hero` ems
//   (50px type there), a little more up to a ~1390px window; lib/team's data
//   test allows a name token of sixteen characters, a ceiling written for
//   the 320px phone. Such a name (none ships: the longest run is eight,
//   „Cătălina", and a hyphen breaks „Ivașcu-Zugravu") would have crossed the
//   words' right edge into the gutter from the step to ~1390px, further
//   under SC 1.4.12's letter spacing. With the `auto` floor the PICTURE's
//   track gives way instead — the cutout's cap is a share of its own track,
//   so D64's no-overlap arithmetic still holds — and at every width a real
//   name meets, the floor (~240px at 1280) sits far under the track (~490px),
//   so it moves no pixel. The `AtTheStep` story pins the give.
//
// ── D43a · THE RHYTHM HALVED (owner, 2026-09-26, round 2j: "it starts height
// wise too low. i need you to push it higher … with the above section
// starting higher i mean also the image, so the whole thing"): `py-6
// @lg:py-8 @3xl:py-10` — 24 / 32 / 40px — where round 1 had `py-12 @lg:py-16
// @3xl:py-20` (48 / 64 / 80). The PILL IS IN FLOW above this band (D38's
// finding), so the band's own top padding IS the air between the header and
// the figure's crown; halving it lifts the WHOLE opener — picture, specialty,
// name, card — by the same 24 / 32 / 40px, and nothing can slide under the
// pill: the boxes positioned here since D64 — the cutout, its container and
// the words' container, all `relative`/`absolute` with no z-index — start on
// the row's top inside the band's own padding and stay in their row, and a
// scroll that brings them under the sticky pill paints them beneath the
// pill's own z-50 layer. The bottom padding halves with
// it: the recipe's `py` is one rhythm, and the next band's own top padding
// still stands between this figure's feet and the lilac fade. D62–D64 left
// it alone: the row starts 40px under the band's top at every laptop and
// desktop width — the picture's box on that line, the specialty a ninth of
// the column under it (D63, D64). MEASURED at 1280 /
// 1536 / 1920 when it was halved: band top → figure top 80 → 40px, band top
// → specialty 104 → 64px, band height 672 → 507, 757 → 598, 757 → 677 (the
// ⅓ track shortens the figure too).
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
// ── D43b · THE WORDS TOOK ⅔ OF THE ROW — SUPERSEDED BY D51b, and D51b by D62;
// kept as history. The owner, round 2j: "put a bigger card for filozofia
// mea"; the tracks were `minmax(0,1fr)` ‖ `minmax(0,2fr)`. MEASURED: the
// picture box 384 → 320px at 1280, 448 → 389 at 1536 (the 28rem cap stopped
// binding there), 448 at 1920 (the cap still binds, the track is 491); the
// credo card 577 → 641, 700 → 777, 884 → 982px wide. The card's type and
// inset are argued in CredoCard.tsx's D43b paragraph — in short: the quote
// steps up to `text-xl`, and the inset is ui/Card's to grow, not this band's.
//
// ── D51 · THE OPENER RE-PROPORTIONED (owner, 2026-09-26, round 2k — three
// asks; D51 in round 2's ledger is the anchor other files cite, §17.7). (a)
// and (b) are SUPERSEDED BY D62 for the arrangement beside the picture; (c),
// the stacked order, is the phone and the tablet as they still are.
//   (a) "i want the photo to be like 30% larger all around": the picture box
//   was round 2j's ⅓-track picture × 1.3, tied to the column —
//   `@3xl:max-w-[min(36rem,calc((100cqi-3rem)*0.4333))]`, capped at 36rem —
//   and MEASURED 416 × 555 at 1280, 505 × 673 at 1536 and 576 × 768 at 1920.
//   (b) "the philosophy card should be like 70% as wide as it is now and
//   taller rather" + "… left and right they have same as much space": two
//   CONTENT-SIZED tracks centred in the row (`@3xl:grid-cols-[auto_auto]
//   @3xl:justify-center`, the picture's track `minmax(0,auto)` from
//   2026-09-27), the free space outside the pair (48.3 / 106.3 / 224.5px a
//   side at 1280 / 1536 / 1920), and a definite 28rem words column
//   (`@3xl:w-md`, widened only by a name token wider still, `@3xl:min-w-min`)
//   shared by the name and the card. THE CARD'S 28rem SURVIVED D62 as the
//   bottom container's one track, until D63 widened it to 36rem. What did
//   not survive D62 is the NAME sharing it: at the `hero` step „Dr. Malea (Sabău) Oana Bianca" took three
//   lines in it at 1366, 1536 and 1920 — the owner's "i want eyebrow and
//   heading to be way wider".
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
// ── D62 · THE LAPTOP AND DESKTOP OPENER AS TWO CONTAINERS (owner, 2026-10-01,
// verbatim: "on phone and tablet it's perfect how they behave and look now,
// so i want to mentain that, but the issue is desktop and laptop looks. i
// want this organization. one big container on the area where the hero is.
// in it there are another 2 containers. one handles the image. the image
// container takes up about 35% of the left side of the large container and
// imag esits centered in it and on bigger screen or on tab adjustment it
// adjusts in width with the container. the other container that takes up
// 65% of the large container also coordinates with the image container and
// wit hthe dimentions of the stuff within it in function of the width and is
// also split into 2 containers that sit one above the other. the top one
// handles the heading and eyebrow and bottom one handles the "philosophy". i
// want eyebrow and heading to be way wider and allow for a further extention
// potentialli in a single line on longest example if possible of "Dr. Malea
// (Sabău) Oana Bianca" on heading and fallback on 2 rows of the heading when
// not wide enough, maybe 3. philosophy has to have same space between it and
// headings and eyebrow contianer as to bottom of container it is within. so
// eyebr. and heading container can adjust in height in function of width,
// philosop. contaier adjusts with it in avalable height and leaves if there
// is space equally below and above it in container. both heading and
// philosophy are sticky to left side of respective containers"). From the
// `@3xl` step only: every class below it is the one it was, so a phone and a
// tablet are byte-identical. D62 is the STRUCTURE — the two containers and
// what each holds; the numbers that space them are D63's and the floor they
// share is D64's (both below). Its first numbers, 35 ‖ 65 of what a 3rem gap
// left, lasted one round.
//   THE BIG CONTAINER is the grid itself, across ui/Container's WHOLE column:
//   two tracks and no free space outside them (D51b's `@3xl:justify-center`
//   left with its content-sized tracks).
//   THE PICTURE'S CONTAINER is the first track, the picture's box: `w-full`
//   of it, `@3xl:max-w-none` lifting the stacked 20rem cap, the cutout
//   centred on it ("imag esits centered in it … adjusts in width with the
//   container").
//   THE WORDS' CONTAINER is the second track, a flex column stretched to the
//   row's height (a grid item's default stretch), holding the owner's two
//   containers one above the other. THE TOP ONE is the pair — eyebrow over
//   name — as wide as the words' content box, both lines start-aligned on its
//   left edge and wrapping only where the row runs out (balanced when they
//   do — the header's THE HEADING paragraph). THE BOTTOM ONE takes the rest
//   of the height (`@3xl:flex-1`) and is a one-track grid — the card's track,
//   on the container's left edge (an explicit track is never stretched, so
//   it stays at the start) — whose content is CENTRED in its height
//   (`@3xl:content-center`) over 1.5rem of padding above and below
//   (`@3xl:py-6`, the old `gap-6` between the name and the card). So the
//   space between the name's container and the card always EQUALS the space
//   between the card and the row's floor, and is never less than 1.5rem
//   ("leaves if there is space equally below and above it"). Below the step
//   the bottom container is `display: contents` like the words' container,
//   which is what keeps the stack's grid items — and so the phone and the
//   tablet — exactly what they were.
//
// ── D63 · THE SPACING AND THE CARD (owner, 2026-10-01, the two rounds after
// D62's — verbatim: "push this [the specialty, the name and the card] more
// to the right. ialso want a little more distance but like 15% extra space
// on ledft side of picture and 250% more space between photo and right
// container. disregard before mentioned sizings in contaners, procentages
// etc and find best practices to adapt as described. al also want headin and
// eyebrow to start around middle of picture?" — then: "i need heading and
// eyebrow at media artitmetica compared to where it was before. make
// filozofia mea card stay a little more to the right and like 30% wider").
// D62's shares and its 3rem gap gave way to numbers read off ui/Container's
// column — `cqi`, because the Container is the nearest size container, so
// the grid's own tokens resolve against its width:
//   THE INSET, `@3xl:ps-[min(1.875cqi,1.875rem)]` — "15 % extra space on the
//   left side of the picture", taken as 15 % of the page GUTTER the column
//   already stands in (10vw ≈ 12.5cqi, capped at 12.5rem): 18.9 / 22.2 /
//   28.5px at 1280 / 1500 / 1920.
//   THE PICTURE'S ONE WIDTH, `--picture`: a third of the column and the first
//   track — one number the cutout's floor (D64) reads as well — so the
//   picture keeps one proportion of the page at every width, where D62's
//   shares bent with the gap. Capped at the cutout's OWN width, which rides
//   in on the grid as `--cutout-width` from `photo.width` (the Opus React
//   review): past a ~3115px window a third of the column outgrows the 900px
//   file, and a 3440px ultrawide would draw it at 1008 × 1344 — enlarged, the
//   soft edge `artwork`'s "never upscaled" promise exists to rule out. Under
//   the cap nothing moves; over it the picture keeps its file's size and the
//   words take the rest.
//   THE GAP, `@3xl:gap-x-[clamp(3rem,calc(100cqi/6),10.5rem)]` — "250 % more
//   space between photo and right container": D62's 3rem three and a half
//   times over, 10.5rem = 168px, which a sixth of the column reaches at a
//   ~1280px window; under it the gap shrinks with the column (134px at 1024)
//   and never below D62's 3rem.
//   THE CARD, the bottom container's one track `minmax(0,36rem)` — "like 30 %
//   wider": 28rem × 1.3 ≈ 36.4, the nearest rem — taking what the words
//   leave under it: 363px at 1024, 462 at 1280, 506 at 1366, 576 from 1500
//   up. "A little more to the right" was 1.5rem, which D64 gave the name too.
//   And the name's height: "middle of the picture", then "media aritmetica" —
//   the mean of develop's top and that middle, a quarter of the way down the
//   picture — which D64 spells from the column alone.
//   THE CARD'S TITLE FOLLOWS ITS WIDTH: „Filozofia mea" wears SectionHeading's
//   container-responsive `band` step, which answers to ui/Card's own
//   `@container` (§15.24) — 36px once the card's content box reaches 28rem,
//   a card of ~498px. MEASURED on the built page: 30px at 1024 and 1280
//   (363 / 462px cards), 36px from 1366 up (506 / 545 / 576px). That is the
//   "wider words column" road of the owner's open call on the card's size
//   (G2-R2 tier 1, react F1 — ui/Heading's `'band' JOINED` paragraph), taken
//   by the owner's wider card rather than by a title seam.
//
// ── D64 · ONE FLOOR, ONE LEFT EDGE (owner, 2026-10-01, the fourth round —
// verbatim: "actually heading and filozofie have to have same offset. and
// heading soes not have to stay at middle of card. currrent positioning is
// good, but at same time image is separated as asset and has to adjust
// height wise while both large containers share same floor"; on the result:
// "for the moment it feels perfect").
//   ONE LEFT EDGE: D63's 1.5rem moved from the bottom container up to the
//   words' container (`@3xl:ps-6`), so the specialty, the name and the card
//   start on one line, 1.5rem in from the words' track — the card where D63
//   put it and the name joining it, the reading of "same offset" that keeps
//   the card's "a little more to the right" (the other reading, the card back
//   on the name's old edge, is the same token one box down).
//   THE NAME'S HEIGHT, OFF THE COLUMN: `@3xl:pt-[calc(100cqi/9)]` on the
//   words' container — D63's quarter of the picture's height, which for the
//   3:4 cutout every lib/team doctor ships (the team-data test) is a ninth of
//   the column to the pixel, so "current positioning is good" holds at every
//   width. It is spelled from the column alone because the picture's height
//   now FOLLOWS the words' (below), and a padding read off it would be a
//   loop.
//   ONE FLOOR — "image is separated as asset": the picture's container
//   stretches to the row (`@3xl:self-stretch`) and is never shorter than the
//   cutout at its third (`@3xl:min-h-[calc(var(--picture)*var(--cutout-ratio))]`,
//   the photo's own height ÷ width riding in on the grid as
//   `--cutout-ratio`), so the row is the TALLER of the words and the picture
//   at its third, as before D64. The cutout then leaves the row's sizing
//   (`@3xl:absolute`) and is drawn into the container it is given: as tall as
//   it (`@3xl:h-full`), as wide as its own proportion makes that
//   (`@3xl:w-auto`), centred on it (`@3xl:left-1/2 @3xl:-translate-x-1/2` —
//   D62's "centered in it", the growth shared by the inset and the gap) and
//   standing on its floor (`@3xl:bottom-0`). Where the words are the taller
//   container the figure GROWS until its feet stand on their floor; where
//   the picture is the taller one nothing moves.
//   WHY OUT OF FLOW: a picture whose width followed the row's height while
//   the words' width followed the picture's would be a loop no CSS layout
//   closes (grid's re-resolution of its columns runs once, and not alike in
//   every engine). Out of flow, the picture's TRACK keeps its third and the
//   words keep their width — the card keeps its 36rem — and only the
//   figure's box spills past its track, into the inset and the gap.
//   THE CAP, `@3xl:max-w-[140%]`: the box never wider than 1.4 × its third,
//   so its spill is at most a fifth of the third a side, a fifteenth of the
//   column (54px at 1024, 67 at 1280) — short of the words wherever the gap
//   is wider than that, i.e. on every column up to 2520px (a ~2900px window;
//   on a column that wide the picture is the taller container and spills
//   nothing), and short of the window's edge, whose gutter alone is at least
//   98px from the step up. Past
//   the cap (the 1024 window under a three-line name) `object-contain` fits
//   the figure into the capped box and `@3xl:object-bottom` stands it on the
//   floor, with air above its crown. By that arithmetic the box overlaps
//   no word, and the words' container is `@3xl:relative` as the belt (the
//   Opus a11y review): a positioned box paints above the in-flow content it
//   overlaps, and of two positioned boxes the later in the DOM paints on
//   top, so were a future spacing ever to let the figure reach the words,
//   the words would paint over it — with no `z-index` and no pixel moved
//   today, and the figure never takes a pointer the words need.
//   MEASURED on the built page (the longest name the clinic ships, Romanian,
//   classic scrollbar): the cutout 449 × 598 at 1280 (1.33 × its 336px
//   third), 463 × 617 at 1366, 445 × 593 at 1500, 450 × 599 at 1536; at 1920
//   and 2560 the picture is the taller container (507 × 676, 715 × 953) and
//   the card stands centred under the name, 42.5 and 191.5px above and
//   below; at 1024 the cap binds — 375 × 500 on the floor, 146px of air
//   above. At every width the cutout's bottom, its container's and the
//   words' are ONE line, 0px apart; the phone and the tablet pixel-identical
//   to develop (320 / 390 / 768, five pages each). The demo figure's
//   shoulders reach up to ~17px past the column's left edge at 1024–1366,
//   where the top bar's edge stands — the owner's look, approved at 1280 and
//   1500.
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

export function DoctorIntro({
  name,
  position,
  photo,
  credo,
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
        {/* THE BIG CONTAINER (D62, D63): the rhythm box AND the row, one
            element — the band's own stepped `py` (the recipe's rule 3; halved
            in round 2j, D43a; below `@lg` the floor is `pb-8`, one step above
            the top, for the credo card's aura — D61) plus, at the step, the
            owner's two containers (D62) spaced by D63: an inset of 15 % of the
            page gutter before the picture, the picture's ONE width
            (`--picture`, a third of the column, never wider than the cutout's
            own file) as the first track, the 1/6-of-the-column gap clamped to
            3rem–10.5rem, and the words in whatever is left — the picture's
            track with a zero floor, the words' never narrower than their
            longest unbreakable run (the header's THE STACKED TRACK
            paragraph). The cutout's own proportion rides in as
            `--cutout-ratio` (height ÷ width), which the picture's container
            reads for its floor height (D64), and its own width as
            `--cutout-width`, the cap on `--picture` (D63). Below the step ONE
            `minmax(0,1fr)` track, the column's width exactly — never an
            `auto` track the picture's box can widen (the header's THE STACKED
            TRACK paragraph, 2026-09-27) — and no `@3xl:` token reaches it;
            the two variables are set there but read by `@3xl:` tokens alone.
            `gap-8` is the section owning ALL child spacing (§6.4) — below the
            step between all four stacked items (D51c); the children keep no
            outer margins of their own. */}
        <div
          className="grid grid-cols-[minmax(0,1fr)] gap-8 pt-6 pb-8 @lg:py-8 @3xl:[--picture:min(calc(100cqi/3),var(--cutout-width))] @3xl:grid-cols-[minmax(0,var(--picture))_minmax(auto,1fr)] @3xl:gap-x-[clamp(3rem,calc(100cqi/6),10.5rem)] @3xl:py-10 @3xl:ps-[min(1.875cqi,1.875rem)]"
          style={
            {
              '--cutout-ratio': photo.height / photo.width,
              '--cutout-width': `${photo.width}px`,
            } as CSSProperties
          }
        >
          {/* THE PICTURE'S CONTAINER. Stacked: capped at 20rem and centred
              in the column, under the pair (D51c), the cutout in ui/Image's
              `artwork` recipe, spelled here because the band owns the
              geometry beside the words (the header's THE CUTOUT paragraph).
              Beside (D62–D64): the whole first track, the cap lifted,
              stretched to the row and never shorter than the cutout at its
              third — and the cutout drawn into it out of flow: as tall as
              the row, as wide as its proportion makes that (up to 1.4 × the
              track), centred on the track and standing on the floor the
              words stand on (D64). */}
          <div className="mx-auto w-full max-w-xs @3xl:relative @3xl:min-h-[calc(var(--picture)*var(--cutout-ratio))] @3xl:max-w-none @3xl:self-stretch">
            <Image
              src={photo.src}
              width={photo.width}
              height={photo.height}
              alt=""
              placeholder="empty"
              preload
              fetchPriority="high"
              sizes="(min-width: 125rem) calc((100vw - 25rem) * 7 / 15), (min-width: 60rem) calc(80vw * 7 / 15), 20rem"
              className="h-auto max-w-full object-contain @3xl:absolute @3xl:bottom-0 @3xl:left-1/2 @3xl:h-full @3xl:w-auto @3xl:max-w-[140%] @3xl:-translate-x-1/2 @3xl:object-bottom"
            />
          </div>
          {/* THE WORDS' CONTAINER: PAIR → CARD → SLOT (D12). Beside the
              picture (D62) the second track, a flex column as tall as the row
              holding the owner's two containers — the pair on top, the
              bottom container under it taking the rest of the height — inset
              1.5rem, the ONE left edge the pair and the card share (D64),
              padded down by a ninth of the column, D63's quarter of the
              picture's height spelled from the column alone (D64), and
              positioned — `relative`, no z-index — so it paints above the
              cutout should the two ever meet (D64's cap paragraph). Below the
              step it is
              `contents` (D51c), and so is the bottom container: both boxes
              dissolve and their blocks become the grid's own items, so the
              pair can climb above the picture while the card stays after it.
              THE PAIR IS `flex-col-reverse`: the <h1> comes FIRST in the DOM
              and the eyebrow paints above it (see the header's THE HEADING
              IS THE PAGE'S <h1> paragraph); `-order-1` lifts it above the
              picture in the stack, `items-center` centres its two boxes
              there, and each line centres its own text ON THE ELEMENT
              (§15.15 b), back to `start` — and balanced — beside the
              picture. */}
          <div className="contents @3xl:relative @3xl:flex @3xl:flex-col @3xl:ps-6 @3xl:pt-[calc(100cqi/9)]">
            <div className="-order-1 flex flex-col-reverse items-center gap-2 @3xl:order-none @3xl:items-start">
              <Heading size="hero" asChild>
                <h1 className="text-center hyphens-none @3xl:text-start @3xl:text-balance">
                  {name}
                </h1>
              </Heading>
              <Eyebrow className="text-center hyphens-none @3xl:text-start @3xl:text-balance">
                {position}
              </Eyebrow>
            </div>
            {/* THE BOTTOM CONTAINER (D62, D63): the rest of the row's
                height, one 36rem track on its left edge, the card (and a
                slot) centred in that height over 1.5rem above and below — so
                the space over the card equals the space under it. */}
            <div className="contents @3xl:grid @3xl:flex-1 @3xl:grid-cols-[minmax(0,36rem)] @3xl:content-center @3xl:gap-6 @3xl:py-6">
              <CredoCard {...credo} />
              {children}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
