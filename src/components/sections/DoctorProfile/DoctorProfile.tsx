import {
  useId,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  DoctorCourses,
  type DoctorCoursesProps,
} from '@/components/sections/DoctorCourses/DoctorCourses';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import {
  Container,
  bandColumnClasses,
  bandScaleClasses,
} from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx/cx';

// sections/DoctorProfile — the doctor page's third band, under the opener
// (sections/DoctorIntro) and the numbers (sections/DoctorStats, „În cifre"):
// WHO THE DOCTOR IS beside WHAT THE DOCTOR HAS TRAINED IN. On the left, on
// three fifths of the row, the biography — „Biografie / Despre {name}" over
// third-person paragraphs in the credo card's grey, their key words marked; on
// the right, on two fifths, the courses and specialisations —
// sections/DoctorCourses, its eyebrow and <h2> over one idea per line, lit one
// at a time by an automatic cycle; both on the plain page ground, the two
// contents starting on one line. Reshaped on 2026-10-13 (CLAUDE.md §15.23
// round 7) from the lilac band it had been since the doctor-pages run
// (.claude/section-runs/2026-09-21_11-58_doctor-pages — round 1's D1, round
// 2's D17 and D21 and the G2-R2 review's tier-2 a11y F2 are the decisions
// still standing here; round 2's D14 stands in part, THE INK below; the rest
// is the HISTORY at the end), and reworked the same evening on the owner's
// pack feedback (THE BIOGRAPHY THREE FIFTHS, THE SHARED ROWS, THE INK).
//
// The owner, 2026-10-13, verbatim: "first of all, drop the schedule from the
// page. no more schedul box at all, drop it and remove anything related to
// it. then jsut below the "hero section" of the dr page […] i want to place
// the in numbers one. […] then below it i'd want the biography but
// rerffactored. this section would have biography as text on the left and on
// the right the courses and specialisations […] hero section, then Experience
// confirmed over time and below on the left biography and on the right the
// thing with the "Courses and specialisations" but hugely rectified. no year
// anymore." What the courses became — one idea per line, no years, lit one
// by one without a scroll — is sections/DoctorCourses' header; this file is
// the band that seats them beside the biography.
// And on the preview, the same evening, verbatim (the courses' own line is
// sections/DoctorCourses' business; the rest is this file's): "i want the
// "BIOGRAFIE / Despre Dr. Malea (Sabău) Oana Bianca" subsection of the
// biografie and formare section to be like 20% wider, so the whole thing with
// text 20% wider. […] i also want the effective text and the first dot of:
// [the six course ideas] to start at same y when they sit next to the other.
// i also wan thte text of biografie to be like the text at: "Înainte de orice
// lucrare protetică verific sănătatea gingiei, pentru că pe ea se sprijină tot
// restul. Planul îl stabilim împreună, iar fiecare etapă o explic înainte să
// începem." so gary-ish er and with tighlighted keywords".
//
// ── RUN D1 · IT IS A DUMB BAND, the PriceList/Hero shape: zero message keys,
// zero data imports, no `t()`, no `Locale`. Both openers, every paragraph and
// every course idea arrive FINISHED and already translated (§8.1) — a
// paragraph as a node the page has already rendered, its key words included
// (THE INK); the ONE populator is the doctor page, which walks lib/team for
// one language. This file ships no JavaScript of its own (§16): no 'use
// client', no state, no ref, no handler — its ONE hook is React's useId,
// server-safe and hydration-stable, which names the biography's region (TWO
// <h2>s, TWO REGIONS below). The band's one island is sections/DoctorCourses'
// cycle, composed here as that section's PUBLIC component (§4's section →
// section rule: never its internals) and handed exactly the three props it
// shows — `eyebrow`, `title`, `items` — plus the placement its own grid needs
// (THE SHARED ROWS), so its rhythm (`intervalMs`) stays its own default.
// DoctorProfile.test.tsx renders the band with NO NextIntlClientProvider, and
// that absence is the assertion: next-intl's hooks throw without one, so a
// green suite proves no t() is reachable from here, the island's included.
//
// ── THE GROUND IS THE PLAIN PAGE (2026-10-13 — the planner's default, a lever
// of the owner's). Until that day the band stood on sections/TintedBand's
// lilac (run D7's tint, D29's extraction). Two facts took it off:
//   · CONTRAST — a resting course idea is faded to 0.65 (sections/
//     DoctorCourses/CourseTimeline's CONTRAST, MEASURED): its ink reads
//     4.64:1 on `--page` and 3.94:1 on the 30 % lilac tint, under §9's 4.5:1
//     there (SC 1.4.3);
//   · THE NEIGHBOUR — the numbers band right above wears TintedBand's lilac,
//     and two TintedBands back to back each fade out to the page and back in:
//     a pale strip between two tints.
// So this is ui/Container's PAGE-BAND RECIPE exactly: the full-bleed
// <section> owns the paint (`bg-page`) and THE BELT, the Container owns the
// width, the gutter and the container-query context, the rhythm box one level
// in owns the `py` and THE BAND SCALE (recipe rule 5 — an element cannot query
// its own size, so the `py` cannot ride the Container itself). THE LEVER:
// lilac again needs the resting fade re-tuned first (~0.75 reads 5.1:1 on the
// tint; 0.70 is still 4.49), the dots' ring re-coloured (it is the ground's
// own colour) AND the paragraphs re-inked — their faint ink fails the tint
// (THE INK) — then TintedBand composed around the Container once more.
//
// ── THE INK — THE CREDO CARD'S GREY, AND ITS KEY WORDS (the owner's pack
// feedback, 2026-10-13: "like the text at [the credo quote] … so gary-ish er
// and with tighlighted keywords"). The paragraphs wear `text-ink-faint` —
// `--ink-faint` #766f69, §15.1's 19th role, the washed ink of the doctor
// quotes (D58), worn by sections/DoctorIntro/CredoCard's quote, the very
// sentence the owner pointed at. MEASURED (WCAG 2.2, the tokens' own values):
// 4.70:1 on `--page` #faf9f7 — body text's 4.5:1 kept at 18px regular (SC
// 1.4.3), with little room. It replaces `text-ink` #2b2724, 14.07:1, which
// round 2's D14 chose as reading prose for §1's 70-year-old, never muted:
// a third of that contrast, on the owner's word, and still over the bar. The
// role is BARRED from sections/TintedBand's 30 % lilac, where it reads 3.24:1:
// this band left that ground in round 7 (THE GROUND), and
// tests/unit/ink-faint-census.test.ts names this file a wearer on `bg-page`,
// so it cannot drift back unnoticed. The „Biografie" eyebrow keeps ui/Eyebrow's
// `ink-muted`, 6.99:1. AND ITS HIGH-CONTRAST LIFT (G2 a11y L1, 2026-10-13):
// `contrast-more:text-ink` gives the full ink back, 14.07:1, to a visitor
// whose system asks for more contrast (`prefers-contrast: more` — macOS and
// iOS "Increase contrast"); the key words keep their hue and weight. The
// default look is the owner's grey, untouched. The credo quotes, the role's
// other wearers, do not carry it yet — one class each, the lever.
// THE KEY WORDS come from the page, never from here: the doctor page's
// populator cuts lib/team's `<k>…</k>` marks with `splitKeywords` and the
// page renders each paragraph through ui/Keyword's <Keywords> — the credo
// card's own path (D12) — so a key word arrives as ui/Keyword's <b>, weight
// 650 in `--accent` #746894: 4.81:1 on `--page`, and 1.02:1 against the faint
// ink around it — it stands apart by hue and weight, not by lightness
// (§15.1's keyword rider; ui/Keyword's THE NUMBERS and THREE LIMITS). The
// band does nothing for that and imports neither ui/Keyword nor lib/team (run
// D1): a paragraph is any finished node. One rule for the page: a node is
// PHRASING content — it lands inside a <p>, where a block (a <div>, a second
// <p>) is invalid HTML.
//
// ── THE BIOGRAPHY THREE FIFTHS, THE COURSES TWO, FROM `@3xl` (the owner's
// pack feedback, 2026-10-13: "to be like 20% wider, so the whole thing with
// text 20% wider"). `@3xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]` — three
// shares and two of the row less the gap, so the biography is 1.2 × the equal
// half round 7's first cut gave it and the courses 0.8 × theirs; `minmax(0,…)`
// so a long word can never widen one column at the other's expense — across
// `@3xl:gap-x-12` (48px; 48 design pixels in THE BAND SCALE). `@3xl` is
// ui/Container's column at 48rem, ≈ a 960px window (5vw a side on a phone,
// 10vw from a 600px window — ui/Container's THE PHONE GUTTER): every phone and
// every tablet held upright stacks, and from there up — a tablet held
// sideways, the 1280 notebook, every laptop and desktop — the two sit side by
// side, at the same step every band of the site splits at. Below it ONE
// column, `gap-16` (64px) between the two: the biography first, the courses
// under it — DOM order = reading order = region order, the owner's
// adaptability rule (D21: "sections that are next to each other when in phone
// mode … must come one above the other"). A rem or px track would have held
// its width while THE BAND SCALE grew everything else; a share of the row
// scales with it. MEASURED (DoctorProfile.scale.test.tsx, the column a window
// leaves beside a classic 15px scrollbar) as the biography / the courses / the
// gap: 433.2 / 288.8 / 48 at a 770px column, just past the step; 499.2 /
// 332.8 / 48 at an 880px one (unscaled, a laptop window just under the
// regime's step); 579.1 / 386.1 / 43.8 at a 1280 window; 634.8 / 423.2 /
// 48.0 at the owner's 1401; 696.7 / 464.5 / 52.7 at 1536; 873.0 / 582.0 /
// 66.0 at 1920; 881.6 / 587.7 / 66.7 past the cap — 3 : 2 within a
// sixty-fourth of a pixel, the engine's layout unit. LEVERS: the split (one
// class) and the two gaps.
//
// ── THE SHARED ROWS (the owner's pack feedback, 2026-10-13: "the effective
// text and the first dot … to start at same y when they sit next to the
// other"). Beside, each column opens with its own SectionHeading, and the
// biography's title carries a PERSON'S NAME — „Despre Dr. Malea (Sabău) Oana
// Bianca" takes two lines where „Cursuri și specializări" takes one — so in a
// row of two flex columns its paragraphs started one title line below the
// first course idea. Fixed by CSS SUBGRID, from `@3xl` and only with courses:
// the band's grid gets two row tracks, `@3xl:grid-rows-[auto_auto]`, 24px
// apart (`@3xl:gap-y-6` — the 24px each region already keeps between its
// opener and its content), and EACH region spans both and ADOPTS them —
// SHARED_ROWS below — `@3xl:row-span-2 @3xl:grid @3xl:grid-rows-subgrid`, with
// the two belts that follow — on the biography's <section> and, through its `className` prop, on the courses'
// (DoctorCourses merges a caller's className onto its root <section>, §6.8:
// placement only — the parent owns how its children sit in its grid). Each
// region's two children land in row 1 and row 2 — SectionHeading's root, then
// the content (the paragraphs' block; the courses' list) — so row 1 is as tall
// as the TALLER opener, the shorter opener keeps its words at the row's top,
// and both contents start at row 2's top. Every opener is SectionHeading at
// level 2 and every content line `text-lg` on a 28px line box, so the first
// paragraph's first line and the first idea's first line share one y, and the
// first dot — centred on its idea's first line by the courses' own geometry
// (sections/DoctorCourses/CourseTimeline's THE DOT MARKS THE IDEA'S FIRST
// LINE) — on that line too. The region's own `gap-6` equals the band's row gap,
// so a subgrid's own gap adds no margin of its own; the regions stay BOXES with
// their roles (TWO REGIONS below) — the subgrid reaches into each without
// dissolving it. MEASURED (DoctorProfile.scale.test.tsx, the rail held
// neutral): the first paragraph's top and the first idea's top equal to a
// thousandth of a pixel at every column from 770 to 2000, the first dot's
// centre within 0.03px of the first line's (the layout unit's rounding); with a
// two-line biography title the ideas start 64px under their own opener at the
// reference instead of 24, level with the paragraphs; with one-line titles on
// both sides every content stands 24 × s under its own opener, as before the
// subgrid.
// THE ITEMS KEEP THEIR HEIGHTS (the DoctorCourses builder's measurement, the
// same evening). A grid item's default `align-self` is stretch, so in the
// shorter column each child of a region would be drawn as tall as its row —
// the courses' list a box hundreds of pixels taller than its ideas when the
// biography is the longer column — and the courses' island watches that list
// for its OFF-SCREEN HOLD (sections/DoctorCourses/CourseTimeline), which would
// go on counting while the ideas themselves had already left the screen. So
// both regions also wear `@3xl:items-start`: each child keeps its own height
// at its row's top, and the rows still align — a row is sized by its tallest
// item, whatever the items' alignment. MEASURED (the same suite, the reference
// column, three paragraphs beside two ideas): the list 152px round 152px of
// ideas, where stretched it was 284px, the paragraphs' height; the shorter
// opener 68px round its words beside a two-line name, where stretched it was
// 108. The trail under the last idea (CourseTimeline's THE TRAIL) is drawn
// absolutely, past the list's box, and changes none of it: it paints into the
// row's slack beside a longer biography, or else into the rhythm box's bottom
// padding (80 × s from `@3xl`, deeper than the trail's 36 × s).
// THE FALLBACK. An engine without subgrid (Chrome < 117, Safari < 16, Firefox
// < 71) drops the `grid-template-rows: subgrid` declaration, and each region
// becomes a grid of its own auto rows spanning the band's two — stretched to
// the taller region's height, as a grid item is. Left at that, the shorter
// region's own two rows would share the stretch: MEASURED in Chromium with the
// declaration knocked out inline (the reference column, a two-line biography
// title), its paragraphs drifted 26px down from their opener. So the regions
// also wear `@3xl:content-start`, which packs their rows at their top: in that
// engine each content stands 24px under its own opener — the layout before the
// subgrid, the two contents level only when the two openers are. Where subgrid
// works it changes nothing (a subgrid's rows are the band's, with no free space
// to share — measured: the same numbers with it and without it).
//
// ── ONE BRANCH, ON THE COURSES — a KEEP-IN-SYNC pair with sections/
// DoctorCourses' EMPTY rule. An empty `items` renders NOTHING there (no
// region, no heading — an empty „Cursuri și specializări" would announce
// nothing), so this grid takes its two columns and its two shared rows only
// when `items` has one — and the biography adopts the rows only then: with
// none it stands alone in ONE column at every width, a plain flex column,
// never in three fifths of a row beside nothing, and `max-w-4xl` is its
// measure. The conditions are one fact spelled in one place, `beside` — the
// suite renders both sides of it (a band with courses has two children, two
// columns and the shared rows, a band without has one of each and none of
// them). The paragraphs take no branch: an empty `about.paragraphs` is a page
// bug, not a state (lib/team's data test pins every doctor's text, D17), so
// the band prints what it is given, an empty block.
//
// ── THE KEYS ARE INDICES. A paragraph is a node now — <Keywords>' fragment,
// or a plain string — and a node cannot be a React key. The index is safe
// HERE, by React's own rule for index keys: the list is static, rendered on
// the server in the data's order, and never reordered, filtered or inserted
// into at runtime (this band has no state and no island of its own, §16), so
// an index names the same paragraph on every render, the server's and the
// browser's. The text key it replaces guarded against a reorder that cannot
// happen here.
//
// ── THE BAND SCALE (owner, 2026-10-13, CLAUDE.md §15.32 round 4: "take
// current heading and eyebrow from main page. look how reactive and nice it
// is. make the exact same thing with the heading and eyebrow from the
// individual dr page" — and, asked how far, "Whole page, like Home"). On a
// laptop or desktop the band draws as ONE design, the owner's 1401-window
// look scaled to its column, exactly as every Home band does: both openers,
// the paragraphs, the courses with their dots and lines, the two gaps and the
// rhythm grow and shrink together in the one design pixel every scaled band
// of the page draws in — so the two openers are the size of every other
// opener on the page, at every width. On every phone, every touch tablet,
// under the step and in an engine that cannot register custom properties
// nothing is declared and every pixel is the theme's own (§7). The rule and
// its numbers are ui/Container's (THE BAND SCALE, recipe rule 5): the rhythm
// box IMPORTS its two strings after its `py`, `bandColumnClasses` then
// `bandScaleClasses`, and spells neither (tests/unit/design-scale.test.ts) —
// worn UNCONDITIONALLY, no `scaled` prop: the band lives on the doctor page
// alone, and every band there scales. sections/DoctorCourses, inside it,
// wears no scale of its own: it inherits this box's design pixel, as every
// box inside a scaled band does. Every length here is a theme step, so all
// of it follows; the one px length in the band is the courses' dot ring, a
// box shadow (sections/DoctorCourses/CourseTimeline's THE RAIL AND ITS
// LINE).
// MEASURED — the engine's numbers on the real stylesheet, in the column a
// window leaves beside a classic 15px scrollbar (DoctorProfile.scale.test
// .tsx's harness), as both titles / both eyebrows / a paragraph and an idea /
// the biography and the courses / the gap and the row gap / the rhythm above
// and below, s in brackets — the two openers equal to the hundredth at every
// width:
//   · a 900px column, just past the step [0.814]: 29.3 / 11.4 / 14.6 /
//     516.6 and 344.4 / 39.0 and 19.5 / 65.1;
//   · 1280 [0.912]: 32.8 / 12.8 / 16.4 / 579.1 and 386.1 / 43.8 and 21.9 /
//     73.0;
//   · 1401 [1.000]: 36.0 / 14.0 / 18.0 / 634.8 and 423.2 / 48.0 and 24.0 /
//     80.0 — the owner's look;
//   · 1536 [1.097]: 39.5 / 15.4 / 19.75 / 696.7 and 464.5 / 52.7 and 26.3 /
//     87.8 — the stories' pin;
//   · 1920 [1.375]: 49.5 / 19.3 / 24.75 / 873.0 and 582.0 / 66.0 and 33.0 /
//     110.0;
//   · past a 96rem column [1.389, capped]: 50.0 / 19.4 / 25.0 / 881.6 and
//     587.7 / 66.7 and 33.3 / 111.1, the band 1536 wide and centred in its
//     column (232px in from each side of a 2000px one);
//   · unscaled, nothing declared — the theme's own: an 880px column (a
//     laptop window just under the regime's step, ≈ 1 100–1 115px) beside,
//     36 / 14 / 18 / 499.2 and 332.8 / 48 and 24 / 80; a tablet's 614.4 and a
//     390 phone's 351 stacked, 36 and 30 / 14 / 18 / the column / a 64px gap
//     between the two / 64 and 48;
//   · the courses' dot ring 4px at every one of them.
// THE TRADES, RECORDED (the regime's own — §15.25 round 2, §15.32 round 4):
// under the reference the band reads SMALLER than the theme — a paragraph
// 14.6px at 1140, 16.4 at 1280 — as every Home band's words do, and a
// browser zoom inside the regime enlarges it less than rem would (the owner,
// asked with the numbers on 2026-10-13: "Accept, like Home"); ui/Container's
// THE FLOOR is the one-class lever, for every scaled page at once.
//
// ── THE BELT (2026-10-09, ui/Container's THE PHONE GUTTER — moved HERE from
// sections/DoctorCourses' outer on 2026-10-13, when that section stopped being
// a band of its own). The lit course idea COMES FORWARD from its left edge —
// `scale-104` × the forward motion's overshoot, drawn ~1.065 at its peak
// (sections/DoctorCourses/CourseTimeline's THE FORWARD MOTION) — so on a
// phone, where the courses stack column-wide, it runs a few pixels past the
// screen's right edge for a few frames (2.6–3.5px measured at 320–430 on the
// timeline it replaced, with the page 3–5px wider than the screen for those
// frames). So this outer wears the reviews band's belt (sections/
// ReviewsCarousel's ONE DELIBERATE BREACH OF THAT RECIPE, AND ITS BELT):
// `overflow-x: clip` trims paint at the band's own box — the screen's width —
// and, unlike `hidden`, makes no scroll container, so nothing vertical
// changes; the `supports-[not_(overflow:clip)]` twin spells it `hidden` for
// Safari ≤ 15, which does not know `clip` (and rides ONLY behind that gate:
// emitted bare it would win on every engine and turn the band into a scroll
// container). It sits on the FULL-BLEED OUTER on purpose: there it trims only
// what passes the screen's edge, never an idea at rest; on a laptop the lit
// idea grows into the gutter and stays far inside the screen.
// `wrap-anywhere` (inherited by every text inside) is its other half (the G2
// a11y review, 2026-10-09): a clip HIDES what passes the edge, so a word
// wider than its column — only at a very large text size without a
// hyphenation dictionary — breaks instead of being cut. At ordinary sizes no
// word is that wide, and nothing moves. A clipped box still reports its
// overflow as its own `scrollWidth`, so the stories measure the DOCUMENT
// (what §7 protects) and each title and idea, whose own transform never
// counts toward its own `scrollWidth`. DoctorProfile.test.tsx pins the belt
// on this box and on no other in the band.
//
// ── THE PARAGRAPHS ARE JUSTIFIED — the owner's word, 2026-09-25, round 2c:
// "this text just isn't justified" (the credo card's quote had been justified
// on the same day's earlier sentence). §15.1's justify exception names the
// doctor page's prose — the credo <p> and each <p> here — as its third
// per-element case, and the utility rides EACH <p> (§15.15 b: on the element,
// never a wrapper-level blanket); nothing else in this band sets an
// alignment — the course ideas stay start-aligned (DoctorCourses' header).
// The body's site-wide `hyphens: auto` (§15.14) is INHERITED and left alone —
// it is what keeps rivers out of the justified lines, so a German compound
// may break at a syllable rather than open a gap. `text-lg` is the §15.1 body
// base (ui/Text's step is 16px) — a section writing utilities on its OWN
// markup is lawful (§6.7), the ClinicLocation row's <span> the precedent.
// THE ONE LEVER ON THE MEASURE is `max-w-4xl` (56rem; 896 design pixels in
// THE BAND SCALE) on the paragraphs' block, and beside the courses it binds
// only on a very wide UNSCALED screen: the biography's column is three fifths
// of the row less the gap — 634.8 design pixels at every laptop and desktop
// width (≈ 67 characters at 18 design pixels, an estimate), and, where the
// band does not scale, 433px just past the step, growing with the column
// (626.9px on a 1366 touch tablet held sideways, by the arithmetic) until it
// meets the cap past a ~1541px column — a touch screen ≈ 1 930px wide. It binds always when the biography
// stands ALONE (ONE BRANCH above): at every laptop and desktop width (the
// box's 1106 design pixels against 896) and on any unscaled column wider than
// 56rem — where a line would otherwise run the whole column. It sits on the
// paragraphs and not on the region, so the opener above keeps the whole
// track.
//
// ── TWO <h2>s, TWO REGIONS, and the page's <h1> is elsewhere
// (sections/DoctorIntro owns the doctor's name). Each column opens with
// sections/SectionHeading at level 2 — eyebrow over title, the pair every
// content band on this site opens with — and EACH COLUMN IS A NAMED REGION, by
// its own <h2>: the biography since the G2-R2 review (tier 2, a11y F2,
// 2026-09-26: until then a landmark walk over the doctor page skipped „Despre
// Dr. …", the band's main content, while announcing its 20rem sibling), the
// courses by sections/DoctorCourses' own <section aria-labelledby>. The
// biography's is the CredoCard idiom exactly: a bare <section
// aria-labelledby> whose id comes from useId() and rides SectionHeading's `id`
// prop onto the <h2>, never the opener's wrapper, so the region's name is the
// title alone and not the eyebrow read with it (SectionHeading's id
// paragraph); no `role` bolted on (a named <section> IS a region, §9 semantic
// HTML first); no tabIndex (no link jumps to it). DOM order is the region
// order: the biography, then the courses. A region stays a BOX at every width
// — `display: contents` on an element with a role is the accessibility-tree
// bug that drops its semantics along with its box — which is what lets the
// grid seat the two as its two items, and why THE SHARED ROWS reach into each
// region by subgrid rather than by dissolving it into the band's grid.
// The band's <section> ROOT takes NO accessible name: `aria-label` and
// `aria-labelledby` are refused by the types, because no single noun covers
// "who the doctor is" and "what the doctor has trained in", and a named root
// would wrap the two regions in a third, announced by a name that fits one of
// them. The two headings and the two regions are the structure a screen
// reader navigates by.
//
// ── NO DIVIDER. Nothing is drawn between the two columns: the gap separates
// them — 48px beside (48 design pixels in the scale), 64px stacked — and each
// column's own opener says where it begins. A rule beside an eyebrow would
// draw the same boundary twice.
//
// ── NO OUTER MARGIN (§6.4): the page owns the rhythm BETWEEN its bands, and
// the band's own air is the rhythm box's `py` — 48, 64 and 80px at the
// Container's three steps, × s in the scale (sections/DoctorCourses' rhythm
// when it was a band of its own, inherited with its belt). `{...rest}` rides
// FIRST, and `className` merges LAST onto the <section> (§6.8).
//
// ── HISTORY, one line each (§17.7 — the anchors other files quote): D7/D29's
// lilac ground, sections/TintedBand's tint and two fades — left 2026-10-13
// (THE GROUND above); D14's schedule card, D37's centring of it and D53's one
// 20rem width — dropped with the in-folder ScheduleCard and its suite on the
// owner's "no more schedul box at all" (2026-10-13); round 2d's prose outdent
// into the gutter — gone with the lilac, so THE BAND SCALE no longer needs
// the box of its own it rode between the column and the grid (the outdent and
// the centring could not share one element); round 2's D15, the courses'
// move to a band of their own — reversed: they stand beside the biography
// again, as sections/DoctorCourses' block; round 7's first cut, the same
// evening — two EQUAL columns, each region a flex column starting at the row's
// top, the paragraphs in D14's full ink and plain strings keyed by their own
// text — reworked on the owner's pack feedback into THE BIOGRAPHY THREE
// FIFTHS, THE SHARED ROWS, THE INK and THE KEYS ARE INDICES above.

/** The eyebrow/title pair the biography opens with — finished,
 *  already-translated text (§8.1): the doctor page hands over „Biografie" /
 *  „Despre Dr. Elena Marin". The courses carry their own pair inside
 *  `courses` (sections/DoctorCourses' `eyebrow`/`title`). */
export type ProfileHeading = Readonly<{ eyebrow: string; title: string }>;

type DoctorProfileOwnProps = Readonly<{
  /**
   * The biography — the LEFT column from `@3xl`, three fifths of the row, the
   * first one stacked: its opener and the doctor's text as FINISHED
   * paragraphs, one node each. The doctor page renders each through
   * ui/Keyword's <Keywords>, so its key words arrive as <b>s already (the
   * header's THE INK); a plain string is a node too. PHRASING content only:
   * each node becomes one `<p>`, in the order given, keyed by its index (THE
   * KEYS ARE INDICES). REQUIRED: the band exists for this column.
   */
  about: ProfileHeading & Readonly<{ paragraphs: readonly ReactNode[] }>;
  /**
   * The courses and specialisations — the RIGHT column from `@3xl`, two
   * fifths of the row, under the biography stacked: sections/DoctorCourses'
   * own three props, handed over as given — its eyebrow, its <h2> and its
   * `items`, one finished idea each. An EMPTY `items` renders no courses at
   * all, and the biography stands alone in one column (the header's ONE
   * BRANCH). The cycle's rhythm is DoctorCourses' own default, so
   * `intervalMs` is not part of this band.
   */
  courses: Readonly<Pick<DoctorCoursesProps, 'eyebrow' | 'title' | 'items'>>;
}>;

/**
 * THE SHARED ROWS (the header's paragraph of that name): from `@3xl` a region
 * spans the band's two rows and ADOPTS them as a subgrid, so its opener lands
 * in row 1 and its content in row 2 — the two contents start level; its two
 * children keep their own heights (`@3xl:items-start`, THE ITEMS KEEP THEIR
 * HEIGHTS), and `@3xl:content-start` is the belt for an engine without
 * subgrid (THE FALLBACK). Worn by the biography's region whenever the courses
 * render, and handed to sections/DoctorCourses as its className. ONE static
 * string: Tailwind reads class names from the source text.
 */
const SHARED_ROWS =
  '@3xl:row-span-2 @3xl:grid @3xl:grid-rows-subgrid @3xl:items-start @3xl:content-start';

export type DoctorProfileProps = DoctorProfileOwnProps &
  // `children` is Omitted (the SectionHeading/PersonnelCard precedent):
  // content arrives as `about`/`courses`, and without the Omit a caller could
  // nest something, type-check, and watch it vanish. `about` leaves the native
  // side with them — it is a real RDFa attribute on every HTML element, so
  // otherwise the two meanings would intersect into something that is neither.
  // Both ARIA naming attributes are refused for the reason in the header: the
  // band deliberately has no one name, and an attribute that gave it one would
  // wrap its two named columns (the biography, the courses) in a third region
  // called after one of them.
  Omit<
    ComponentPropsWithRef<'section'>,
    keyof DoctorProfileOwnProps | 'children' | 'aria-label' | 'aria-labelledby'
  >;

export function DoctorProfile({
  about,
  courses,
  className,
  ...rest
}: DoctorProfileProps): ReactElement {
  // Names the biography's region — the header's TWO <h2>s, TWO REGIONS
  // paragraph; server-safe and hydration-stable, so no 'use client'.
  const aboutId = useId();
  // THE ONE BRANCH: the courses render — and sit beside the biography from
  // `@3xl`, on the shared rows — exactly when they have an idea to show.
  const beside = courses.items.length > 0;

  return (
    // THE BAND OUTER: the semantic element, full-bleed, owning the paint and
    // THE BELT (the header's paragraph of that name — the clip, its Safari ≤ 15
    // twin behind its gate, and `wrap-anywhere`) and nothing else. `{...rest}`
    // rides FIRST; className is merged caller-last (§6.8).
    <section
      {...rest}
      className={cx(
        'overflow-x-clip supports-[not_(overflow:clip)]:overflow-x-hidden wrap-anywhere bg-page',
        className,
      )}
    >
      <Container>
        {/* The rhythm box — the band's `py` on the Container's steps, then
            ui/Container's band-scale column and pixel, in that order (the
            header's THE BAND SCALE; ui/Container's recipe rule 5). */}
        <div
          className={cx(
            'py-12 @lg:py-16 @3xl:py-20',
            bandColumnClasses,
            bandScaleClasses,
          )}
        >
          {/* From `@3xl`, THREE FIFTHS AND TWO across the gap and TWO SHARED
              ROWS — only when the courses render (the header's ONE BRANCH,
              THE BIOGRAPHY THREE FIFTHS, THE SHARED ROWS); one column below
              the step and whenever they do not, the biography first. */}
          <div
            className={cx(
              'grid gap-16',
              beside &&
                '@3xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @3xl:grid-rows-[auto_auto] @3xl:gap-x-12 @3xl:gap-y-6',
            )}
          >
            {/* THE BIOGRAPHY — a region named by its own <h2> (G2-R2 a11y F2),
                a BOX at every width: the opener over the paragraphs' block,
                24px apart — a flex column, and beside the courses a subgrid
                of the band's two rows (THE SHARED ROWS). */}
            <section
              aria-labelledby={aboutId}
              className={cx('flex flex-col gap-6', beside && SHARED_ROWS)}
            >
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
                  measured for the larger `hero` step, the title's other words
                  are short — and THE BELT's `wrap-anywhere` would break a word
                  wider than the whole line rather than let it run past it. The
                  courses' title beside it keeps the inheritance: ordinary
                  words. */}
              <SectionHeading
                className="hyphens-none"
                level={2}
                id={aboutId}
                eyebrow={about.eyebrow}
                title={about.title}
              />
              {/* `max-w-4xl` is the header's ONE LEVER ON THE MEASURE. Each
                  paragraph: the body base, the credo card's faint ink and
                  JUSTIFIED on the element (THE INK; THE PARAGRAPHS ARE
                  JUSTIFIED), keyed by its index (THE KEYS ARE INDICES). */}
              <div className="flex max-w-4xl flex-col gap-4">
                {about.paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-lg text-ink-faint contrast-more:text-ink text-justify"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
            {/* THE COURSES — sections/DoctorCourses' public component, handed
                its three props as given: a region named by its own <h2>, the
                ideas lit one at a time by its island, and NOTHING when `items`
                is empty (the header's ONE BRANCH). Its className is THE SHARED
                ROWS, placement in this grid and nothing else (§6.8); it wears
                no band classes of its own — the page ground, the belt, the
                `py` and the scale are this band's. */}
            <DoctorCourses
              eyebrow={courses.eyebrow}
              title={courses.title}
              items={courses.items}
              className={SHARED_ROWS}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
