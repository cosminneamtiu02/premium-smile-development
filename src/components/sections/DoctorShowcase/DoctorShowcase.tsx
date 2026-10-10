import {
  useId,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  PersonnelCard,
  type PersonnelLink,
  type PersonnelPhoto,
} from '@/components/sections/PersonnelCard/PersonnelCard';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import {
  Container,
  bandColumnClasses,
  bandScaleClasses,
} from '@/components/ui/Container/Container';
import { Ribbon, RibbonStation } from '@/components/ui/Ribbon/Ribbon';
import { cx } from '@/lib/cx/cx';

// sections/DoctorShowcase — the clinic's doctors as a band: an eyebrow over an
// <h2>, then every doctor as the doctor card (sections/PersonnelCard, its D17)
// in one column that the floss ribbon wraps (ui/Ribbon, CLAUDE.md §15.26). The
// SAME band on two pages — the Home page, under the Hero, and the Team page,
// which it opens. Built to the /new-section composition contract of
// 2026-09-30 on the owner's dispatch, verbatim: "ok. make this the official dr
// card under personell card and i'll keep working on it. integrate it in the
// page and crete it as a section in the home page and in the personell page
// with heading and eyebrow smth in the direction of specialistii cu care ne
// mandrim familia premium smile." The decision numbers below are that
// contract's D1–D8 — and D9, the first screen's eager picture, added the same
// day, D10, THE SCALE, on 2026-10-01, and D11, THE SLIMMER RIBBON, on
// 2026-10-02 — and are the anchors other files cite (§17.7 — never a line
// number; D10's GATES among them, and since 2026-10-02 ui/Container's THE BAND
// SCALE, which holds the regime D10 invented and cites D10 for its numbers
// and for what it trades).
//
// ── D1 · DUMB, PROPS-IN, ZERO KEYS — the PriceList / Hero / DoctorIntro shape.
// Every string that arrives here is FINISHED: the eyebrow, the title, each
// doctor's name, specialty and words, the link's label and its href — already
// locale-prefixed by the page's localeHref(). No t(), no message key, no
// import of lib DATA and no `Locale`: the PAGE is the populator — both pages,
// through app/[locale]/team/populate.ts's one walk — and this file could not
// tell Romanian from German if it tried, which is what lets Storybook review
// it at every width on invented doctors before the real team is written.
//
// ── D2 · A NAMED REGION. The `<section>` is named by its own <h2> through
// `aria-labelledby`: the id comes from useId() (server-safe, hydration-stable,
// so two bands on one page never collide) and lands on the heading through
// SectionHeading's `id`, never on the section, so the name is the title's text
// ALONE, without the eyebrow. The two ARIA naming attributes are Omitted from
// the props — a caller's pair would land after the band's own and silently
// replace it — and `{...rest}` rides FIRST as the belt behind that Omit: the
// Omit refuses a typed object, but TypeScript exempts a hyphenated attribute
// WRITTEN IN JSX from its excess-property check, so `aria-labelledby="…"` on
// the band compiles — and then loses to the band's own, which rides after
// the spread (G2 typescript, 2026-09-30).
//
// ── D3 · THE RIBBON, ROUTE B (SC 1.3.1; ui/Ribbon's THE COLUMN AS A LIST). A
// column of doctors is a list, and it stays one inside the ribbon:
// `<Ribbon role="list">` with WRAPPER stations, `<RibbonStation
// role="listitem">`, each card inside keeping its own <article>. The wrapper
// is what the ribbon measures — a station's first element child is its card
// (lib/ribbon-layout) — so the article is the station's ONLY child. Route A
// (`asChild` on an <li>) would clone a server-rendered child across the
// server→client boundary for no gain here, so it is not taken. The ribbon's
// LIMITS hold by construction: the first card fills the column (a station is
// a block in the ribbon's flex column, and the card owns no width, PersonnelCard
// D10), the list is static (rendered once from the page's data, never grown
// after mount), and the Ribbon gets NO className — a root className is
// placement only, and this band has nothing to place.
//
// ── D4 · THE RHYTHM — a deliberate departure from the usual `py` triple. The
// band opens with the standard band top (`pt-12 @lg:pt-16 @3xl:pt-20`) and
// carries NO bottom padding and NO gap between the heading and the ribbon:
// the ribbon's own column already reserves its HEAD room above the first card
// (`--ribbon-k` + 0.16 of the ribbon's unit — the drop-in's until 2026-10-01;
// the first card has no drop-in since, and the room is this band's air alone,
// kept at that measure, ui/Ribbon's TWO BOXES) and its TAIL room under the
// last — since 2026-10-01 only what the last card's tuck needs, its curl and
// shadow (`0.13 × --ribbon-k` + 0.08 of a unit, 12 to 30px at the default
// unit; it was 60px + 1rem while the tail hung there, removed on the owner's
// word: "remove that space") — and that room IS this band's air. The usual
// `pb` on top of it would double it, and so would a `gap`. The stepped `pt`
// sits on the rhythm box one level in, because an element cannot query its
// own size (the DoctorCourses / ClinicLocation spelling, ui/Container's recipe
// rule 3) — and inside the regime it is drawn in the band's design pixel like
// every other length (D10): the box that remaps the step is the box it sits on.
//
// ── D5 · SIDES ALTERNATE BY INDEX — `start`, `end`, `start`, … — because the
// ribbon mirrors every second card and its long side wave runs down the side
// of the picture's column (ui/Ribbon's stand-in column, Ribbon.fixtures.tsx,
// alternates exactly so, and the owner approved the ribbon over it). The
// mirror is PersonnelCard's visual-only one (its D7): the DOM order of every
// card is unchanged, so reading and focus order never move. It acts from the
// card's wide step alone — on a phone every card's photo is on the left
// (PersonnelCard D20's ONE SIDE ON A PHONE), while the ribbon, which mirrors
// by INDEX itself (lib/ribbon-layout), keeps alternating. Which way a card
// faces is the band's decision, never the data's: `DoctorShowcaseDoctor` has
// no `side`.
//
// ── D6 · HEADING LEVELS. The band's title is an <h2> (SectionHeading's
// default level, at its `band` step), each doctor's name an <h3>
// (`headingLevel={3}`) — the outline reads page <h1> → this band's <h2> → one
// <h3> per doctor, one level at a time on both pages (§9). The card keeps one
// size for the name at both levels — ui/Heading's `name` step since
// 2026-10-10, `band` from the card's 24rem up and 24px beside the phone
// header's round photo (PersonnelCard D4, D20) — so the level is the
// outline's and never the look's.
//
// ── D7 · EMPTY RENDERS NOTHING — `null`: no landmark, no heading, no ribbon.
// A titled band with no card is a promise with nothing behind it. The early
// return sits AFTER useId(), never before it: hooks run in the same order on
// every render (the Rules of Hooks).
//
// ── D8 · ISLANDS (§16). No 'use client' in this file, no state, no handler:
// useId is the only hook, and it is server-safe. The <section>, its name, the
// eyebrow, the <h2> and every card compile into the page's static HTML. The
// ONE island it mounts is ui/Ribbon — an effect starts the drawing after
// mount, and the server HTML carries the ribbon's empty layer and no canvas —
// plus ui/Image's optimizer island under each picture (PersonnelCard D11),
// which every page with a photograph already pays. The cards are
// server-rendered children handed THROUGH the ribbon, never re-rendered by it.
// DoctorShowcase.test.tsx pins the directive's absence, the one hook and the
// whole import surface from the source text, because no runtime assertion can
// see any of them.
//
// ── D9 · THE FIRST SCREEN — the page tells the band, the band tells ONE card
// (2026-09-30, MEASURED by the planner on this lane's built export with
// Chromium's largest-contentful-paint entries). On the Team page, which this
// band opens, the FIRST doctor's cutout is the page's LCP element (§10.6) —
// 226 × 302 on a 390 phone (since ui/Container's PHONE GUTTER of 2026-10-09:
// 276.6 × 368.8 on a 390 phone, 262.7 × 350.2 at a 390 window behind a
// classic scrollbar — the geometry the 226 × 302 was — still the LCP,
// re-measured), 288 × 384 at 1280 and 1920, still the LCP at 1366 × 633 —
// and it shipped lazy, with no `fetchpriority` and no preload link. (Since
// PersonnelCard's D20 of 2026-10-10 a PHONE draws that cutout in a 112px
// circle, and there the page's largest paint is the first card's quote —
// measured at 390: 45,870px² of quote against 12,544 of photo; every tablet,
// laptop and desktop keeps the cutout as the LCP. The preload stays: the
// circle is on the phone's first screen too, and the page cannot know the
// card's width before it is laid out — a phone `sizes` entry is D20's
// recorded lever.) On Home
// the band sits under the Hero and, since 2026-10-01, under the clinic's
// numbers too (the owner's order), the first cutout at y ≈ 1655 at a
// 1280 × 800 window (≈ 1103 right under the Hero, before the band scaled),
// and the hero's picture is the LCP: lazy is RIGHT there (§11 — "lazy-loading
// below the fold, eager + high-priority for the hero"). The band cannot tell
// the two pages apart — it knows no page (D1) — and it must not measure the
// window either: the eager attributes have to be in the static HTML the
// browser's preload scanner reads before any script runs (§16). So the PAGE
// says it, with `firstScreen` (default false), and when it is true the card
// at index 0 — and no other — takes PersonnelCard's `preload` (its D18), the
// pair sections/DoctorIntro gives its own cutout. ONE card: a page has one
// LCP element, and a second eager picture would only compete with it for the
// first bytes. `firstScreen` is destructured before `{...rest}`, so it never
// reaches the <section>.
//
// ── D10 · THE SCALE (2026-10-01). The owner, verbatim: "so about the doctors
// component with the line. i like how it looks on phone and tablet and i want
// to keep that unchanged. but on  laptop and desktop if you make it
// bigger/smaller in width it gets highly disproportioned. i want card and
// component and all contents to adjust in size harmonically all at once and
// mentain raports as on following sizes: 1401x1063. i might even make it
// myself smaller for it to fit in a different container or smth but i think
// i'd want same rations to still remian." MEASURED on develop's export before
// this change (a classic scrollbar): the band's lengths were rem, so a wider
// window made a WIDER card and nothing in it larger — a doctor card's height
// over its width went 0.679 at a 1136px window → 0.557 at 1401
// → 0.392 at 1920 → 0.283 at 2560, its picture's width over the card's 0.322
// → 0.260 → 0.189 → 0.134, and the quote's size, in thousandths of the card's
// width, 20.1 → 16.3 → 11.8 → 8.4: an ever wider card with the same small
// things in it.
// THE MECHANISM — ONE box: the rhythm box (RHYTHM, below) declares the
// band's DESIGN PIXEL, `--scale-px` = min(column, CAP) / REFERENCE — times
// `--band-zoom` since 2026-10-02, a factor nothing in this band sets, so 1
// (THE PROMOTION, below) — and wears `design-scale` (globals.css, THE DESIGN
// SCALE), which redraws every theme length on it and inside it in that
// pixel — the spacing step, the text, container and radius steps, the body
// size. Tailwind compiles each utility to its theme variable, so every
// `p-6`, `text-lg`, `max-w-md` and `rounded-soft` of the opener and of every
// card follows at once, and no atom is told. The few lengths no theme
// variable carried were respelled in one, each in its own file: the
// ribbon's (ui/Ribbon, THE UNIT: `design-scale` makes its unit 100 design
// pixels, so the ribbon is the reference ribbon, scaled — never a new ribbon
// for a wider column), ui/Card's `framed` padding (THE SUM RULE there: the
// frame stays a 3px border, the padding carries the step) and the doctor
// card's INSET, the card owning no scale of its own (PersonnelCard D19).
// `--scale-px` is a registered length: computed HERE, against ui/Container's
// width, and inherited as a plain length — never measured again against a
// card, which is a container of its own.
// THE PROMOTION (2026-10-02, CLAUDE.md §15.32) — the regime this band invented
// is SPELLED ONCE, in ui/Container (THE BAND SCALE), the day every band below
// the Home hero and every band of the Team page took the same scale. The
// owner, verbatim: "i want both section to in parallel on widening of screen
// to be responsive and adapt in parallel, so headings and eyebrows grow
// together, always have same size and extremley important for headings and
// eyebrows, same offset always". With the doctors band alone in a design
// pixel, its heading drew under the rem headings around it below the 1401
// window and over them above it (49.5px beside their 36 at 1920), and it
// centred past the cap while theirs kept the column's edge (ui/Container's
// THE BAND SCALE has the measurements); one pixel and one cap for every band
// make the size and the offset one by construction.
// ui/Container exports the rule as two strings — `bandScaleClasses`, the
// design pixel and the remap behind the variant chain, and
// `bandColumnClasses`, the cap and the centring — and this band WEARS both on
// its rhythm box like the others (RHYTHM, below; ui/Container's recipe rule
// 5) and spells none of the regime itself; tests/unit/design-scale.test.ts
// holds the spelling to Container.tsx and every wearer to an import of it.
// Two things came with the strings and move no pixel here: `w-full` on the
// box (a block box is full width already — it is for a rhythm box that sits
// in a flex column) and the zoom factor, 1 wherever no box sets it
// (ui/Container's THE ZOOM; DoctorShowcase.test.tsx pins that nothing in this
// band does). Everything else in D10 — the history, the measurements, the
// numbers' arguments, the owner's recorded calls — stays this band's record,
// and ui/Container points here for it: the trades below are the regime's, so
// every band that wears it makes them too, each at its own sizes.
// THE GATES — the regime applies only where ALL THREE hold. RHYTHM wears
// them through ui/Container's two strings: ONE variant chain,
// `scalable:@4xl:@min-[896px]:`, on both regime classes of
// `bandScaleClasses`, and the first two, `scalable:`, on THE CAP of
// `bandColumnClasses`:
//   · A MOUSE OR TRACKPAD — `(pointer: fine)`, the primary pointer: a laptop
//     or a desktop. G2 found every current iPad held sideways inside the
//     first cut's range — 1133 to 1366px wide, the quote 14.8 to 17.8px
//     where the same iPad upright keeps 18 — and the owner, asked the same
//     day "Tablets held sideways … fall into the new scaled 'laptop' range
//     … How should tablets be treated?", answered "Touch devices unchanged":
//     "Scale only on mouse/trackpad devices (laptops, desktops). Every touch
//     tablet, upright or sideways, keeps today's look at any width. Laptops
//     still scale from a ~1120px window." A width cannot tell a 1280px
//     tablet from a 1280px notebook; the primary pointer can. (Untested
//     here: a tablet with a trackpad attached — its `pointer` answer
//     decides.)
//   · AN ENGINE THAT REGISTERS CUSTOM PROPERTIES — `@supports (color:
//     rgb(from red r g b))`: relative colour syntax shipped in the same
//     releases as `@property` in Safari (16.4) and Firefox (128), and after
//     it in Chrome (119; `@property` 85) — read off caniuse-lite. Without
//     registration the design pixel is pasted as text and its `cqw` measured
//     again against each card: G2 emulated Firefox 110–127 (ESR 115 among
//     them) and Safari 16.0–16.3 and measured the cards' contents at ≈ 0.87
//     of the design — a 12.7px quote at a 1140 window. So an engine that
//     cannot register keeps today's rem band instead, and so does a Chrome
//     105–118, which could — it sees the rem band, harmlessly.
//     These first two are globals.css's `scalable` variant (THE SCALABLE
//     VARIANT), spelled there once.
//   · A COLUMN OF AT LEAST max(56rem, 896px) — THE STEP, below.
// Wherever one fails — on every phone, on every touch tablet held either
// way, below the step, and in an engine that cannot register custom
// properties — the band declares no design pixel, wears no remap and has no
// cap: it is today's band, every computed length as before, rem the unit
// (§7).
// THE NUMBERS — one token each, and the LEVERS. Since 2026-10-02 each token
// is spelled in ui/Container's two strings (THE PROMOTION), so a lever pulled
// there moves every band that wears the scale at once — never this one alone,
// which is the point of the promotion:
//   · REFERENCE 1106 — the band's column at the owner's 1401 × 1063 window
//     under a classic scrollbar, 1401 − 15 − 2 × 140.1 = 1105.81px (measured
//     on develop's export): at that column a design pixel IS a CSS pixel, and
//     the band is the one the owner approved, to the pixel. It assumes the
//     classic gutter it was measured with: under overlay scrollbars the same
//     window's column is 1120.81 and s = 1.0134 — the same band, 1.3 %
//     larger (the e2e reads the gutter and holds either).
//   · CAP 96rem — 1536px at the default root: the column of a 1920 window
//     under overlay scrollbars (0.8 × 1920), §7's largest sampling point, the
//     top of the owner's "laptop and desktop". Past it the band stops
//     growing — the `min()` in the design pixel, `scalable:max-w-[96rem]` on
//     the box — and centres in its column (`mx-auto`): every wider window
//     shows the 1920 band. IN REM, so the step and the cap keep their ratio
//     at any root font (G2 typescript, T2): with the cap in px a root of
//     ≈ 27.4px or more put the 56rem step past it, pinned the design pixel at
//     the cap's 1.389 and STACKED every card inside the regime — its inset
//     1329px, under the 48rem its grid asks for (measured through CDP's font
//     sizes, the browser's own setting, at 28 and 32px). LOWERED, before G2,
//     from the first round's 2160px — a 2560 window's column — on a
//     measurement: with the band growing to that column, a browser ZOOM
//     on a 2560 screen made the doctors' text SMALLER — the quote 34.91
//     device px at 100 % and ≈ 33.09 at 150 % and at 200 % — for a zoom
//     narrows the CSS viewport, the gutter leaves its 12.5rem cap and the
//     column shrinks faster than the zoom enlarges it (RECORDED FOR THE
//     OWNER, below).
//   · STEP max(`@4xl`, 896px) — `@4xl` is 56rem, the first of Tailwind's
//     NAMED container steps (ui/Container's recipe rule 2) past the doctor
//     card's own two-column flip, which falls at a column of ≈ 893px
//     unscaled; `@min-[896px]` FLOORS it in px (G2 react, R6): with the step
//     in rem alone a smaller root started the regime sooner and smaller — at
//     a 12px root from a 672px column, s 0.61 and the quote 10.9px, on
//     columns a tablet's width. At the default root both halves are 896.
//     Inside the regime the card's inset is ≈ 958.4 × s − 2px, at least the
//     48rem its grid asks for at `@3xl` wherever the band scales, at ANY
//     root: 774px at the step's s = 0.810 over a 16px root's 768 (thin, and
//     held at 896 by DoctorShowcase.test.tsx); ≈ 48.5 × root − 2 at a larger
//     root's 56rem step; ≈ 83.2 × root − 2 at the 96rem cap; and under a 16px
//     root the floor holds s at 0.81 or more, the inset at 774px over a 48rem
//     of less than 768. So wherever the band scales, the doctor card is
//     two-column. BELOW THE STEP NOTHING CHANGES (THE GATES).
//   · GATE `scalable:` — globals.css's variant: the first two of THE GATES.
// THE CHECKPOINTS (a mouse, a classic scrollbar, the default root):
// s = 1009 / 1106 = 0.912 at a 1280 window, 1213.8 / 1106 = 1.097 at 1536
// and 1521 / 1106 = 1.375 at 1920 — the quote 16.4 / 19.8 / 24.8px, a
// doctor's name 32.8 / 39.5 / 49.5px — and from a ≈ 1939px window (1920
// under overlay scrollbars) THE CAP's 1536 / 1106 = 1.389: the quote 25.0px,
// the name 50.0px, the band 1536px wide and centred (304.5px of its column
// either side at 2560) — every ratio of the 1401 band held throughout.
// MEASURED on the built pages (tests/e2e/doctor-showcase.spec.ts, THE SCALE,
// /ro/team/ and /de/, a classic scrollbar, the 3px frame): each card's height
// over its width — 0.5572 for the first at 1401 — within ≈ 0.12 % of its
// 1401 value at windows of 1140, 1280, 1536, 1920, 2560 and 2800 (0.1215 %
// at worst, re-measured on this build), and its picture's, link's, name's,
// specialty's and quote's share of its width within 0.005 % (the picture's
// 0.0042 % the worst); at 2560 and at 2800 one band, 1536px wide and centred
// in its column. DoctorShowcase.test.tsx holds every length of every box
// against the reference render. THE WORDS' LIMIT (G2 react, R2, verified): a
// card's height over its width holds so closely only while its quote is
// SHORTER than its picture (288 × 384 · s), which then sets the row's height.
// The quotes re-wrap across the regime — the typeface's optical size (below)
// draws the words a little wider at s < 1 and a little narrower at s > 1 —
// today between 3 and 4 lines in German, Italian, English and French (the
// /de/ second card has 4 lines at a 1366 window, 3 at 1401), unseen while
// the picture is the taller. A quote TALLER than its picture moves the card's
// height over its width by ≈ ± 4 % — a line gained at s < 1, lost at s > 1
// (measured with every quote × 5 and with ui/Ribbon's long fixtures) — so
// with real, longer biographies the band is the 1401 design to within a line
// of text. The e2e therefore holds every card's STRUCTURE — picture, link,
// name, specialty and quote over the card's width — to 0.3 %, and its height
// over its width only where the quote is the shorter.
// CONTAINER-RELATIVE, by construction: the design pixel reads the band's OWN
// column (`100cqw`, against ui/Container), never the window, so the band put
// in a narrower box is the same band, smaller — the owner's "i might even make
// it myself smaller for it to fit in a different container" (the
// NarrowContainer story).
// NOT the design's, on purpose: the container-query STEPS (a query's rem is
// the root's — `@3xl` still asks 48rem of a card's inset, and this band's
// `@4xl` 56rem of its column), the 1px of ui/Card's SUM RULE (a hairline
// stays a hairline), the focus ring §9 measured — and with it the ribbon
// guard's air: a keep-out grows by M / 2 card units, 4·s px inside the regime
// (3.24px at the step) against a ring's 4px, so there it is the model's own
// clearance, M = 8·s px, that keeps the strip off a ring (ui/Ribbon's LIMITS
// A CONSUMER MUST KNOW) — and ui/Card's 3px FRAME. An engine floors a
// border's width to whole pixels while it keeps a padding's fraction
// (2.9995px of frame drew 2px wide at the owner's own window when the frame
// was spelled in the step), so the frame stays a whole 3px border at every
// scale and the card's PADDING carries the step: six steps − 2px, the spend
// six steps + 1px EXACTLY (ui/Card's THE SUM RULE, where it is measured). Of
// the whole card only the hairline's pixel is therefore off the scaled
// reference — a card's words start (s − 1)px nearer its edge than the
// reference's × s: 0.39px at the cap, 0.09px further at a 1280 window. And
// the TYPEFACE'S OPTICAL SIZE: Source Serif 4 sets its `opsz` axis from the
// size each line is drawn at (the browser's `font-optical-sizing: auto`), so
// its words run narrower per em as they grow — a line hugged by its box is
// 3.3 % narrower than the reference's × s at THE CAP's s = 1.389, the
// largest the band draws (measured; DoctorShowcase.test.tsx's WORD_BOX), the
// display cut the face draws at that size. The boxes' ratios hold all the
// same; the quotes' line breaks do not (THE WORDS' LIMIT, above). A design
// that must keep its words' WIDTH too would pin the axis to the design size
// inside the regime — the quote at `'opsz' 18`: no re-wrap from 1140 to 2560
// in Chromium and WebKit, and 0.004 % off the reference look at 1401 (G2's
// R2 verifier; switching optical sizing off altogether would cost ≈ 2 %) —
// which no class here does.
// RECORDED FOR THE OWNER — what the regime trades, derived from the numbers
// above and checked on the built page (a zoom z: the CSS viewport is the
// screen ÷ z and a classic scrollbar 15 ÷ z CSS px; the column is the
// viewport less the scrollbar and 2 × clamp(1rem, 10vw, 12.5rem) — the
// gutter from a 600px viewport up, all the regime ever meets (ui/Container's
// PHONE GUTTER narrows it below since 2026-10-09); s = min(column, 96rem) /
// 1106 from a max(56rem, 896px) column; on screen a CSS px is z device px).
// Inside the regime the band's lengths follow its column, not the root font,
// so — and since 2026-10-02 the same holds for
// every band that wears ui/Container's THE BAND SCALE, each at its own sizes;
// the figures below are this band's quote and name (THE PROMOTION):
// (1) A BROWSER ZOOM narrows the column, in CSS px, by the very factor it
// enlarges a CSS px (the regime's gutter is 10vw, its 12.5rem cap aside), so
// between the step and the cap the band's text stays the SAME size
// on screen — WCAG's F94 pattern under SC 1.4.4. It grows only where the cap
// binds (a fixed design pixel there, like rem text) and once the column
// falls under the step (the theme's rem again — at a 16px root a jump of
// 1106 / 896 = 1.23 times). The quote, in device px: a 1920 screen — 24.75 at
// 100, 110, 125 and 150 %, 31.5 at 175 %, 36 at 200 % (×1.45); a 1440 laptop
// — 18.5 at 100, 110 and 125 %, 27 at 150 %, 36 at 200 %; a 2560 screen —
// 25.0 at 100 % (capped), 27.5 at 110 %, 31.25 at 125 %, 33.1 from 150 to
// 225 %, 45 at 250 % (under the step). THE FLOOR (G2 a11y, A2, verified on
// the built page) is a screen just wide enough that 200 % leaves its column
// at the step — ≈ 2240px under overlay scrollbars, ≈ 2259 under a classic
// one — where 200 % draws the quote at 36 × column / 1106 = 29.2, only ×1.17
// of its capped 25.0, rising to ×1.32 at 2560: a 24″ iMac at its default
// resolution ("looks like 2240 × 1260", overlay scrollbars) reads 25.0 /
// 27.5 / 29.2 / 29.2 / 29.2 / 29.2 / 45 at 100 / 110 / 125 / 150 / 175 /
// 200 / 250 % — four zoom presses that leave it unchanged.
// DOES IT EVER SHRINK? At the default root, nowhere. And the gutter makes it
// shrink at NO root now that the cap is in rem: the gutter stops at 12.5rem
// only from a 125rem viewport, whose column is at least 100rem less a
// scrollbar — past the 96rem cap — so a zoom that moves the gutter moves a
// CAPPED band, which grows like rem text. (Twice it did: the first round's
// 2160px cap, on a 2560 screen at the default root, 34.9 → 33.1 above; and
// the 1536px cap G2 reviewed, in px, at a root under ≈ 15.5px, where the
// gutter's cap bound under an uncapped band — Chrome's 'Small' font, 12px,
// on an 1800px screen: 24.2 → 23.7 → 23.2 device px at 100 / 110 / 125 %,
// G2 a11y's A4, by arithmetic. With the cap in rem that screen reads
// 18.75 / 20.6 / 23.2 / 23.2 / 23.6 / 27 at 100 / 110 / 125 / 150 / 175 /
// 200 %.) ONE shrink remains, at THE STEP under a root of ≈ 13px: the px
// floor holds the regime's smallest quote at 18 × 896 / 1106 = 14.6px while
// the theme's below the step is 1.125rem — 13.5px at a 12px root — so the
// one zoom press that carries the column under the step draws the quote up
// to 7 % smaller (a 1366 laptop, a classic scrollbar, a 12px root: 17.5
// device px at 100 and 110 %, 16.9 at 125 %), and every press after it
// enlarges it again (20.25 at 150 %). Every browser-zoom figure of the band
// as it ships re-measured on this build (Chromium 151, a zoom emulated as a
// narrower window at a higher pixel ratio); the two retired caps' figures
// are history.
// A TEXT-ONLY ZOOM (Firefox's "Zoom Text Only") multiplies every font size,
// px ones included, and no box: inside the regime the band's words grow
// while its boxes — every padding, gap and width a multiple of the column's
// design pixel — keep their size, and the words reflow inside the card,
// until the zoomed root carries the 56rem step past the column and the
// theme's rem band returns (≈ 1.7 × at a 1920 window, derived). Measured on
// this build in Firefox 153 at a 1920 window, a 150 % text zoom set through
// the system text size (which Gecko applies as a text zoom when told to):
// the quote 25.0 → 37.5px, a doctor's name 50 → 75px, the card's width,
// padding and picture unchanged.
// THE ZOOM CRITERION (WCAG 2.2 SC 1.4.4, F94's pattern) against the
// proportions the owner asked for is HIS RECORDED CALL; the levers are
// REFERENCE, CAP and STEP above — and A CAP AT THE REFERENCE (CAP = 1106px,
// s ≤ 1): the band would never draw larger than his own 1401 band, every
// wider window would show it at s = 1, and a zoom would enlarge it like rem
// text until its column came under 1106px — at 200 % the theme's 36px
// everywhere but on ≈ 2260–2780px screens, whose 200 % column stays between
// the step and the reference.
// (2) THE USER'S DEFAULT FONT SIZE (§7's "user font settings") is not
// followed inside the regime: the step and the cap are rem, so a larger root
// moves where the regime starts and where it stops (a 20px root from a
// 1120px column), but inside it the design pixel is the column's — a
// 20px-root reader at a given column gets the 16px-root band's sizes; a
// SMALLER root cannot start the regime under an 896px column (THE STEP's
// floor), so the band never draws under 0.81 of the design.
// (3) THE STEP is a jump: from an ≈ 893px column up to the step's 896 —
// 1 to 3px under it — the unscaled TWO-column card at 18px (it stacks only
// below ≈ 893px), and 1px over it the same card at 14.6px, its eyebrows
// 14 → 11.3px (s = 0.810).
// The levers, all told: REFERENCE, CAP, STEP and the gate (THE NUMBERS), a
// cap at the reference, and a floor on the design pixel — the first three
// spelled in ui/Container's strings, the last two to be spelled there if
// pulled, the gate's two conditions in globals.css — and each one, pulled,
// the same for every band that wears the scale (THE PROMOTION).
//
// ── D11 · THE SLIMMER RIBBON (2026-10-02). The owner, verbatim: "AND very
// important on desktop, laptops whatever screen larger than tablet make it
// 30% thinner. on tablet phone etc, the width is fine." RHYTHM's OWN string
// declares `--ribbon-width-share: 0.7` under the regime's very variant chain —
// a mouse or trackpad, an engine that registers custom properties, a column of
// at least max(56rem, 896px) — and ui/Ribbon's drawing reads it off its root
// (lib/ribbon-draw, THE WIDTH SHARE): the ribbon is drawn at 70 % of its
// width along the very same route, its waves, ripple and folds untouched, so
// it keeps MORE air beside every word, never less. "Larger than tablet" is
// read as the regime ON PURPOSE: it is where the band is the laptop and
// desktop design the owner shaped on 2026-10-01, and that day's answer,
// "Touch devices unchanged", puts every tablet, held either way, outside it;
// a narrow window on a laptop is a tablet's width and keeps a tablet's
// ribbon. The class is the BAND's, not ui/Container's: the ribbon is this
// band's alone, so a share in the strings every band wears would be a ribbon
// setting on bands that have none. It therefore RE-SPELLS the regime's chain
// in this file — the one shape tests/unit/design-scale.test.ts allows a class
// that must follow the regime but is none of its strings (TeamRoster's tile
// classes are the precedent), holding every such token to the regime's chain
// exactly, so the share can never switch at another width than the scale.
// The ribbon inside the regime is the 1401 design's, scaled (D10), so its
// width is a share of the band's like every other length: ≈ 21.9px at the
// owner's 1401 window before, ≈ 15.3px now — 0.25 k of the design's
// k = 0.877, × 0.7 — ≈ 12.4px at the step's s = 0.810 and ≈ 21.1px at a 1920
// window's 1.375 (tests/e2e/doctor-showcase.spec.ts measures the painted
// width). One class, one number: the lever.
//
// ── FIDELITY (§6.8). The remaining native props and `ref` land on the
// <section>; a caller's className merges LAST (placement only). The band owns
// no outer margin (§6.4) — the page owns the rhythm BETWEEN bands. Its own
// shape is ui/Container's page-band recipe: the semantic full-bleed <section>
// owns the paint (`bg-page`), the Container inside owns the width and the
// container-query context, and the rhythm box inside that wears the recipe's
// rule 5, THE BAND SCALE (D10's THE PROMOTION).

/**
 * One doctor's card, finished: translated words, the cutout, the link already
 * locale-prefixed by the page (D1). No `side`: which way a card faces is the
 * band's decision (D5).
 */
export type DoctorShowcaseDoctor = Readonly<{
  /** The React key, nothing else — lib/team's id. */
  id: string;
  /** The full name, finished text — the card's <h3> (D6). */
  name: string;
  /** The specialty, finished text — the card's eyebrow. */
  position: string;
  /** The transparent cutout — the doctor from the waist up (PersonnelCard D17). */
  photo: PersonnelPhoto;
  /** The doctor's own words, ui/Keyword fragments inside; the quotation marks are CSS. */
  about: ReactNode;
  /** The ONE link, to the doctor's own page — a finished href and label. */
  profile: PersonnelLink;
}>;

type DoctorShowcaseOwnProps = Readonly<{
  /** The mono micro-label over the title, finished text (§8.1). */
  eyebrow: string;
  /** The band's <h2> — and, through aria-labelledby, the region's name (D2). */
  title: string;
  /**
   * Every doctor, in the page's order, printed as given. EMPTY renders
   * nothing at all: no region, no heading, no ribbon (D7).
   */
  doctors: readonly DoctorShowcaseDoctor[];
  /**
   * True when the band is on the FIRST SCREEN of its page — the Team page,
   * which it opens: the FIRST card's picture then preloads at high priority,
   * because it is the page's LCP element (D9). Home mounts the band under the
   * Hero and leaves it off.
   * @default false
   */
  firstScreen?: boolean;
}>;

/**
 * THE RHYTHM BOX (D4, D10) — the band's own rhythm, then ui/Container's two
 * band-scale strings (D10's THE PROMOTION; ui/Container's THE BAND SCALE and
 * its recipe rule 5, §15.32), composed once, here, at module scope. Tailwind
 * reads class names from source text, so every class stands whole inside a
 * string literal: the band's own in this file, the scale's in Container.tsx.
 *   · THE BAND'S OWN: a flex column, the band top and nothing below it (D4),
 *     and the ribbon drawn at 0.7 of its width under the regime's chain
 *     (D11) — the one class of the band's own that the regime decides.
 *   · `bandColumnClasses`: `mx-auto` and `w-full`, and THE CAP behind
 *     `scalable:` — the first two of D10's GATES, a mouse or trackpad in an
 *     engine that registers custom properties — on the box's maximum width,
 *     96rem, so past the cap the box centres in its column (`w-full` changes
 *     nothing in this block flow; it is there for a rhythm box in a flex
 *     column).
 *   · `bandScaleClasses`: THE REGIME, `scalable:` and the Container's `@4xl`
 *     step floored at 896px as ONE variant chain on both of its classes — the
 *     design pixel, min(column, CAP) / REFERENCE times `--band-zoom` (1:
 *     nothing in this band sets it), declared on this box, and every theme
 *     length on this box and inside it measured in it (`design-scale`).
 * The band spells none of the regime's strings: tests/unit/design-scale.test.ts
 * holds the two to their one spelling in Container.tsx (the cap twice there,
 * KEEP IN SYNC), and D11's class — the chain re-spelled once, here — to that
 * same chain; DoctorShowcase.test.tsx holds this composition byte for byte. The classes this box wore until 2026-10-02, in a new order (an
 * attribute's order never decides a style), plus `w-full` and the zoom
 * factor — and neither moves a pixel.
 */
const RHYTHM = cx(
  'flex flex-col pt-12 @lg:pt-16 @3xl:pt-20 scalable:@4xl:@min-[896px]:[--ribbon-width-share:0.7]',
  bandColumnClasses,
  bandScaleClasses,
);

export type DoctorShowcaseProps = DoctorShowcaseOwnProps &
  // The native <section> surface, minus the band's own names and minus
  // `children` (content arrives as `doctors`; without the Omit a caller could
  // nest something, type-check, and watch it vanish — the SectionHeading
  // precedent). `title` leaves with the own props: it is a real HTML
  // attribute (a tooltip), and the two meanings would otherwise intersect.
  // The two ARIA naming attributes leave too (D2). React 19 carries `ref`
  // inside these props (§6.8).
  Omit<
    ComponentPropsWithRef<'section'>,
    keyof DoctorShowcaseOwnProps | 'children' | 'aria-label' | 'aria-labelledby'
  >;

export function DoctorShowcase({
  eyebrow,
  title,
  doctors,
  firstScreen = false,
  className,
  ...rest
}: DoctorShowcaseProps): ReactElement | null {
  // Hooks first, the early return after (D7).
  const headingId = useId();

  if (doctors.length === 0) return null;

  return (
    // BAND OUTER: the semantic element, full-bleed, owning the paint and
    // nothing else. `{...rest}` rides FIRST so a caller's stray attribute can
    // never replace the name pair; className is merged caller-last (§6.8).
    <section
      {...rest}
      aria-labelledby={headingId}
      className={cx('bg-page', className)}
    >
      <Container>
        {/* The rhythm box — the band top and nothing below: the ribbon's own
            head and tail room are the band's air (D4) — and, wherever D10's
            three GATES hold, the band's scale: ui/Container's THE BAND SCALE,
            which every band of Home and Team wears (D10's THE PROMOTION). */}
        <div className={RHYTHM}>
          <SectionHeading eyebrow={eyebrow} title={title} id={headingId} />
          {/* THE RIBBON, ROUTE B (D3): the root is the list, each station a
              wrapper item holding ONE card, the sides alternating (D5) and,
              on the first screen, the first card's picture eager (D9). */}
          <Ribbon role="list">
            {doctors.map((doctor, index) => (
              <RibbonStation key={doctor.id} role="listitem">
                <PersonnelCard
                  kind="doctor"
                  headingLevel={3}
                  side={index % 2 === 0 ? 'start' : 'end'}
                  preload={firstScreen && index === 0}
                  name={doctor.name}
                  position={doctor.position}
                  photo={doctor.photo}
                  about={doctor.about}
                  profile={doctor.profile}
                />
              </RibbonStation>
            ))}
          </Ribbon>
        </div>
      </Container>
    </section>
  );
}
