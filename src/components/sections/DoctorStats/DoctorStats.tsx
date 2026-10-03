import {
  useId,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import { TintedBand } from '@/components/sections/TintedBand/TintedBand';
import {
  Container,
  bandColumnClasses,
  bandScaleClasses,
} from '@/components/ui/Container/Container';
import { Heading } from '@/components/ui/Heading/Heading';
import { Text } from '@/components/ui/Text/Text';
import { cx } from '@/lib/cx/cx';
import { StatNumber, type CountFrames } from './StatNumber';

// sections/DoctorStats — the doctor page's „în cifre" band: a second lilac
// ground under the courses, an eyebrow over a centred <h2> and a lead
// sentence, then a row of tiles — a line icon in a white disc, a big number
// that counts up once, a serif label and one sentence. Built to the round-2f
// composition contract of the doctor-pages run
// (.claude/section-runs/2026-09-21_11-58_doctor-pages/round2/DoctorStats.md);
// the D-numbers below are that round's ledger decisions (§17.7 — the anchors
// other files quote, never a line number).
//
// Owner's brief, 2026-09-25/26, verbatim: "a section below cursuri si
// specializari, another lila section like the one below" — the reference's
// shape: „Excelență confirmată în timp" over a lead sentence, then FOUR tiles
// („Ani de experiență", „Pacienți", „Cursuri", „Intervenții reușite") — and
// "I want each page to be populated like a dumb component." (The reference's
// title and its claims were rewritten to descriptive copy in round 2s, the
// owner's CMSR pass, 2026-09-27: „Experiență confirmată în timp",
// „Intervenții"; tests/unit/cmsr-scan.test.ts keeps them so.)
//
// ── THE SECOND AND THIRD PAGES — HOME AND TEAM (owner, 2026-10-01,
// verbatim: "i want it on home page too with just 3 components. experience,
// patients and nr of procedures. i want it without that gradient lilla
// background and to haave : [the eyebrow and the title] left alligned as
// other headings nad eyebrows on main page and without this: [the lead] so
// dorp that part" — and, minutes later: "i realised now i want same
// component as on main page with the stats on the team page between map and
// helping staff"). The same band, three props apart — four since 2026-10-02,
// `scaled` below — each with the doctor page's answer as its default, so that
// page's call did not change by a character (§6.6); Home and Team pass the
// same answers:
//   · `ground` — 'tint' (TintedBand, the GROUND paragraph) or 'page': the
//     shape of every other band on those two pages (DoctorShowcase,
//     TeamRoster, ClinicLocation, ReviewsCarousel — Container.tsx's page-BAND
//     recipe), a full-bleed `bg-page` <section> around ui/Container, so the
//     band sits on the page ground with no tint, no fade and no edge against
//     its neighbours;
//   · `align` — 'center' or 'start', sections/SectionHeading's own two
//     answers, so the eyebrow and the title stand where every neighbouring
//     band's do;
//   · `lead` — optional; Home and Team pass none, and then no <p> renders;
//   · `scaled` — false (the doctor page) or true: Home and Team draw the band
//     in THE BAND SCALE, the next paragraph.
// Everything else — the rhythm box, the tiles, the island, the way every
// string arrives — is one code path on all three pages (`scaled` adds classes
// to two of its boxes and nothing else). There the three tiles are the
// clinic's OWN numbers (lib/team's `clinicStats`), drawn by the doctor page's
// glyph map and worded like his tiles; the pages decide that, and this band
// still knows no doctor and no clinic. Three tiles have a row of their own
// (the STEPS paragraph's last bullet).
//
// ── THE BAND SCALE (2026-10-02, CLAUDE.md §15.32 — ui/Container's THE BAND
// SCALE). The owner, verbatim: "i want first of all in the section in numbers
// to take as a reference the point for the "Experience confirmed over time"
// section a point in which headings and eyebrows of "The specialists we are
// proud of" and "Experience confirmed over time" are the same in size or
// height. I want both section to in parallel on widening of screen to be
// responsive and adapt in parallel, so headings and eyebrows grow together,
// always have same size and extremley important for headings and eyebrows,
// same offset always. i want also the components of the section "Experience
// confirmed over time" to be responsive. so from sam starting point of
// height, go with that and i want the section to also mentain same reports
// and adapt in height and width. so these 2 should go together always in size
// and width, but i repeat. on phone and tablet it looks perfect atm, so do not
// touch those."
// THE REFERENCE POINT is his 1401 window, the width at which the doctors band
// (sections/DoctorShowcase's D10) is drawn at its own size: its design pixel
// is a CSS pixel at that window's 1106px column. There the two openers agree —
// MEASURED on develop's build, both read 36px / 14px (the <h2>, the eyebrow)
// — and they agree at every width below the step, where neither band scales.
// Above it they parted, because the doctors band scaled and this one stayed in
// rem: at an 1882 window the doctors <h2> read 48.5 beside this band's 36, and
// at 2560 the doctors opener sat at x 504.5, capped and centred, against this
// band's 200, the column's edge. `scaled`, which Home and Team pass, puts
// ui/Container's two band-scale strings on the RHYTHM box (its recipe rule 5),
// so this band draws in the very pixel the doctors band draws in — the column
// ÷ 1106, on a laptop or desktop column of max(56rem, 896px) — caps at the
// same 96rem column and centres in it on the same left edge. One SIZE and one
// OFFSET for the two openers at every laptop and desktop width, by
// construction rather than by matching numbers; and the band's height and
// width follow the column with them ("mentain same reports"), every theme
// length inside it a design length.
//   · THE TILES' ZOOM. The owner, verbatim: "Some other text that should
//     always mentain a ratio of 1 to 1 is for example from this "Înainte de
//     orice lucrare protetică verific sănătatea gingiei, pentru că pe ea se
//     sprijină tot restul. Planul îl stabilim împreună, iar fiecare etapă o
//     explic înainte să începem." and this "Peste 8000 de zâmbete îngrijite cu
//     dedicare și profesionalism." but raporst between  this "Peste 8000 de
//     zâmbete îngrijite cu dedicare și profesionalism."and this "Ani de
//     experiență" and this"11.000+" and svg in circle as they are now ar
//     eperfect. so they should be mentained in the responsiveness createing
//     process." The first sentence is a doctor card's quote —
//     sections/PersonnelCard's QUOTE, `text-lg`, 18 of the doctors band's
//     design pixels; the second is a tile's sentence, ui/Text's `text-base`,
//     16. So the WHOLE TILE draws at 9/8 of the band's pixel: the list wears
//     `bandScaleClasses` a second time with `TILE_ZOOM` beside it, computing
//     its pixel afresh from the same column (ui/Container's THE ZOOM says why
//     a box cannot multiply the pixel it inherits). A tile's sentence is then
//     16 × 9/8 = 18 design pixels, the doctor card's quote at every width; the
//     label 22.5, the number 40.5, the disc 126 with its glyph 54, the gaps
//     alike — every ratio INSIDE a tile is today's, the ones the owner called
//     perfect. The opener keeps the band's own pixel, so its <h2> and its
//     eyebrow stay the doctors band's.
//   · WHAT STAYS UNSCALED. The doctor page: `scaled` is false by default
//     (§6.6), because that page's other bands do not scale yet and its
//     headings must stay one size with theirs. Every phone and every tablet:
//     below the step, on every touch device and in an engine that cannot
//     register custom properties nothing is declared and nothing remapped,
//     every pixel as before — the owner's "on phone and tablet it looks
//     perfect atm". The list's `--band-zoom` is inert there: its one reader is
//     the pixel declaration the same gates hold back.
//   · WHAT DOES NOT MOVE INSIDE IT. The container steps (the STEPS paragraph)
//     still read ui/Container's column in plain rem — Tailwind writes a
//     container query's size into the sheet as a number, so the remap never
//     reaches it — and the regime starts at a column of max(56rem, 896px),
//     past the widest of them (`@3xl`, 48rem), so a row there is always the
//     count's widest: three across for three tiles, the four-column grid for
//     any other count. A border stays in px (globals.css's THE DESIGN SCALE):
//     the disc's 1px ring is a hairline at every width.
//
// ── D30 · DUMB, PROPS-IN, ZERO KEYS — the PriceList/Hero/DoctorProfile shape
// (the round-1 ledger's D1). Every string arrives FINISHED and translated:
// the eyebrow, the title, the lead and the `atLeast` word (the SUFFIX, SPOKEN
// paragraph below) are the page's `team.doctor.stats.*` keys, and each tile's
// number, label and sentence are facts that travel in lib/team — about the
// doctor on his page (D32), about the clinic on Home and Team
// (`clinicStats`). The icon arrives as a ReactNode — the page picks the
// glyph for the tile's `StatIcon` id — so this file imports NO glyph and
// knows no doctor: it could not tell „Pacienți" from „Patienten" if it
// tried. No t(), no message key, no `Locale`, no lib data.
//
// ── `format` IS THE PAGE'S, AND IT IS CALLED HERE, ON THE SERVER. A number
// becomes the visitor's digits through `Intl.NumberFormat(locale).format`
// (§8.3) — „3.000" in Romanian and German, „3,000" in English, „3 000" in
// French — and that is a question of the LOCALE, which only the page knows;
// the band never formats. But the count-up lives in a client island
// (StatNumber.tsx, D31), and a function cannot cross into one: React refuses
// to serialize it, and the static export would fail on the doctor page
// (ReviewsCarousel's WHAT CROSSES THE BOUNDARY paragraph, the precedent). So
// `countFrames` below runs the page's formatter HERE, once per step of the
// count, and hands the island finished strings. Recorded as contract friction
// — the contract drew `format` as an island prop — and resolved without
// changing this band's public API by one character.
//
// ── THE SUFFIX, SPOKEN — `atLeast` (the owner's decision, 2026-09-27, round
// 2s). A tile's number reads „3.000+" on screen, and NVDA, JAWS and VoiceOver
// read the sign as "plus": „3.000 plus" names the glyph, not what it means.
// The owner wants the meaning said out loud, so the island's twin (an
// invisible copy laid over the digits — StatNumber.tsx's THE TWIN) reads
// „peste 3.000" (ro), "over 3,000" (en), „über 3.000" (de), « plus de
// 3000 » (fr), « oltre 3.000 » (it). The WORD is the page's
// `team.doctor.stats.atLeast` key, arriving here FINISHED as the REQUIRED
// `atLeast` prop: never a data field (it is a fact about the language, not
// about the doctor, so it has no place in lib/team's rows) and never a string
// inside the island (§8.1: StatNumber knows no language). The band composes
// each tile's SPOKEN final here, ON THE SERVER, with the same formatter that
// spells the digits — any SPACE it groups them by dropped for the ear
// (`spokenNumber`: a voice or a braille table that does not take French's
// narrow no-break space for a thousands separator splits the number in two;
// the a11y review of 2026-10-01 and its re-review the same day),
//       tile.suffix ? `${atLeast} ${spokenNumber(…)}` : spokenNumber(…)
// and hands the island that one finished string as `spoken`: no formatter
// and no loose word crosses the boundary (the `format` paragraph's rule, the
// `countFrames` precedent). A tile without a suffix is an exact count and is
// spoken as its number alone („10"). The eye and the ear now get different
// text ON PURPOSE: the visible, aria-hidden span keeps „3.000+", the twin
// says „peste 3.000" (StatNumber.tsx's THE TWIN paragraph).
//   · ONE SUFFIX, ONE WORD. lib/team's row type allows exactly one suffix,
//     `'+'`, and the band reads any suffix a tile carries as that "+", "at
//     least". A second suffix kind (a "%", a "k") would need a second word
//     beside `atLeast`: a named trigger, not built.
//   · THE WORD FIRST, IN ALL FIVE. Every language here puts the word BEFORE
//     the number, so one order serves all five. A locale that puts it after
//     would need an ICU pattern with a `{number}` argument in place of the
//     bare word (§8.2: interpolation, never fragments): a second named
//     trigger, not built.
//
// ── THE GROUND IS sections/TintedBand (D29): the 30 % lilac and the Hero's
// two ten-stop fades, extracted from DoctorProfile at this, its second
// consumer (§4's sharing table, first row). This band names itself through
// it — `aria-labelledby` → the <h2>'s generated id, a named `region` — which
// is exactly why TintedBand passes the naming attributes through while
// DoctorProfile refuses them in its own props. (On the PAGE ground, the
// SECOND AND THIRD PAGES paragraph, the band's own <section> carries the same
// name pair and the same ui/Container sits inside it.) Everything below sits
// inside that ui/Container on either ground; the vertical rhythm is OURS, on
// the first box inside it, because an element cannot query its own size (the
// Container cannot carry its own container-stepped `py`): `py-12 @lg:py-16
// @3xl:py-20`, DoctorCourses' rhythm — and the Home and Team bands' — so the
// bands around it breathe alike. On Home and Team the same box is where THE
// BAND SCALE rides (ui/Container's recipe rule 5), so on a laptop or desktop
// its `py` is drawn in the band's design pixel, as its neighbours' is. NO
// OUTER MARGIN (§6.4): the page owns the space between bands.
//
// ── THE OPENER IS CENTRED BY DEFAULT, AND EVERY CENTRING IS PER ELEMENT
// (§15.15 b, the text-align board). sections/SectionHeading `align="center"`
// centres its own box and title; the lead is a <p> that carries its own
// `text-center`; in each tile the number <p>, the <h3> and the description <p>
// each carry theirs. With `align="start"` (Home, Team) the opener centres
// nothing: SectionHeading starts its own lines, the capped box stays at the
// column's start, and a lead, if one is ever passed, keeps the base rule's
// `text-align: start`. The TILES stay centred on every page — the owner named the eyebrow
// and the title, and a tile is a centred stack of four things either way.
// The <li> centres its children as BOXES (`items-center`) and never as text —
// no wrapper-level blanket, `[&_p]:` spellings included. The suite walks every
// element and pins exactly where `text-center` lives. The opener's column is
// capped at `max-w-3xl` (48rem — 768 design pixels inside THE BAND SCALE,
// which remaps the `--container-*` widths with every other theme length) on
// both alignments, and centred with `mx-auto` only when the band is: the lead
// is one long sentence, and at the laptop's 1229px column it would otherwise
// run ~130 characters wide — far past a comfortable measure for §1's older
// reader.
//
// ── THE TITLE NEVER SPLITS A WORD (the Opus a11y review of 2026-10-01,
// folded on the owner's delegation: "fix howver you fell like with that
// wcag"). The site-wide `hyphens: auto` (§15.14) broke the band's title on
// phones — „Experiență confir-mată în timp" — and a syllable split in a 30px
// heading is the hardest place to read one. SectionHeading gets
// `hyphens-none` through its className merge (§6.8: it lands on the root and
// inherits to the <h2> and the eyebrow); DoctorProfile's „Despre {name}" is
// the precedent. Safe by measure: the longest word of any title in the five
// languages is ~180px at the phone step against a 241px column at 320. Its
// cost, measured: at 320 the Romanian and the German titles take one line
// more (+36px, „Experiență / confirmată în / timp"). Its BELT, `wrap-anywhere`
// beside it (the Opus re-review the same day): a larger default text size eats
// that margin — ~268px at 150 % by the reviewer's arithmetic — and from about
// 175 % a word too long for a line by itself would push the page sideways
// where hyphenation used to break it. `overflow-wrap: anywhere` breaks ONLY
// such a word — it engages when a line holds no other break — so at every
// ordinary size not one line moves; the band's own idiom on its lead and its
// descriptions.
//
// ── THE TILES — ORDER, THEN DRESS. Inside the <li>, the reference's order ON
// SCREEN: disc → number → label → description. In the DOM the label comes
// before the number (the next bullet says why). All of it sits in a REAL list
// (`<ul role="list">` — four equal tiles are a list; the `role` survives
// WebKit's list-style-none heuristic, the DoctorCourses precedent, eslint's
// configured exception).
//   · THE ORDER, AND WHAT IT COSTS (G2-R2 tier 2, a11y F1 — this SUPERSEDES
//     the round-2f build, whose DOM was the painted order). The DOM reads disc
//     → <h3> → number → description, and the tile's own `flex flex-col`
//     paints the reference's order back with two order utilities: `-order-2`
//     on the disc and `-order-1` on the number, the <h3> and the description
//     left at the default 0, in their DOM order. The reason is the heading
//     key. With the number above its <h3>, a screen-reader user pressing H
//     landed on „Pacienți" with the tile's one fact, its number, already
//     BEHIND them, and arrowing on read the sentence and never the number;
//     now the heading is followed by its number, then the sentence. SC 1.3.2
//     (Meaningful Sequence) holds both ways: „Pacienți, peste 3.000, Peste
//     3000 de zâmbete…" read by the DOM (the twin's words since round 2s, the
//     SUFFIX, SPOKEN paragraph) is as meaningful as „3.000+ Pacienți" seen on
//     screen. What it costs: a screen reader's highlight box climbs from the
//     <h3> to the number above it, then drops to the sentence — and nothing
//     else, because nothing in the tile is focusable, so the split between
//     DOM and paint moves no tab stop (SC 2.4.3; DoctorIntro's
//     `flex-col-reverse` + `-order-1` on the doctor's name is the same move).
//     The suite pins the DOM order and the two order tokens;
//     DoctorStats.stories.tsx's plays read the painted order off the engine
//     (the number's bottom at or above the <h3>'s top).
//   · THE DISC — a 7rem circle (`size-28`; 126 design pixels on Home and Team
//     inside THE BAND SCALE, the tiles' 9/8), `bg-surface` white with a
//     `border-line` ring, the glyph at 3rem (54 there) through the README's
//     parent-owns-geometry rule (`[&_svg]:size-12`, which outranks the
//     glyph's own size class by specificity) in `text-accent-decorative` —
//     LILAC since 2026-10-01 (the owner: "paint it's svgs lilla"; the green
//     CTA family until then). The role is §15.1's for "graphics ONLY", the
//     hue the courses timeline lights its dots with one band above — and NOT
//     `--accent`, the menu buttons' lavender, which
//     tests/unit/accent-census.test.ts bars from every band that composes
//     TintedBand (as text it fails on the tint, 3.32:1); a drawing is a
//     graphic, the decorative role's own charter. Computed from the tokens:
//     #7a6d9c on the white disc is 4.67:1, where SC 1.4.11 would ask 3:1 of
//     a graphic that carried meaning — and this one is decoration. MEASURED
//     on the tint, and worth
//     knowing before a pack review: the tint is rgb(212 207 220); the white
//     disc stands off it at 1.53:1, and `line` (#d8d4cf) sits at 1.03:1
//     against the tint and 1.48:1 against the white — so the ring reads as
//     the disc's own soft edge rather than as a separate grey circle.
//     (`line-subtle` would be 1.24:1 against the white and 1.23:1 against
//     the tint, a midpoint that draws no edge at all.) A visibly separate
//     ring would need a darker token than the tint — the owner's call, one
//     class. The whole disc is `aria-hidden`: decoration, and the glyph
//     inside is aria-hidden by its own default as well. On Home's PAGE
//     ground (#faf9f7) the white disc all but vanishes (1.05:1, computed)
//     and the `line` ring is the edge (1.40:1 against the page): a thin grey
//     circle round a lilac drawing.
//   · THE NUMBER — ui/Heading's `page` step on a <p> through `asChild`
//     (36px, ink-strong — display text; a stat is not a heading OF anything,
//     so it takes the look and not the outline), `tabular-nums` so the digits
//     keep their width while they count, `text-center`. Inside it the island.
//     On Home and Team inside THE BAND SCALE the step is 36 × 9/8 = 40.5
//     design pixels: 40.5 × s, s the band's design pixel (40.5px at the
//     owner's 1401 window). THE ONE LEVER: 36px is the `page` step; the
//     reference's number is ~48px. A bigger number is a NEW Heading step, and
//     ui/Heading grows one step per measured consumer (its header) — this
//     band would be that consumer. Not built without the owner's word — and
//     on 2026-10-02 he called the tile's proportions perfect as they are (THE
//     BAND SCALE's zoom bullet).
//   · THE LABEL — an <h3> on ui/Heading's `title` step (20px; 22.5 design
//     pixels inside THE BAND SCALE) through `asChild`, `text-center
//     hyphens-none`: a title breaks between words, never inside one (the
//     §15.14 rider's reasoning for control labels, applied to a one- or
//     two-word heading). The outline: page <h1> (the doctor's name on his
//     page; the page's own `sr-only` <h1> on Home and Team) → this band's
//     <h2> → one <h3> per tile, no gaps (§9).
//   · THE DESCRIPTION — ui/Text `tone="muted"` (a <p> on its `text-base`,
//     16px — 18 design pixels inside THE BAND SCALE, a doctor card's quote),
//     `text-center` through the className merge (§6.8: it lands on the host
//     element). Measured ink on the tint: `ink-muted` 4.8:1, `ink-strong`
//     11.7:1 (TintedBand's D23 paragraph), both over §9's 4.5:1.
//
// ── THE STEPS, MEASURED ON ui/Container's COLUMN (§6.5 — no media query in
// this file). At §7's sampling points the column is 256 (320) · 312 (390) ·
// 614 (768) · 1024 (1280) · 1229 (1536) · 1536 (1920):
//   · below `@md` (28rem = 448px) — ONE column, one tile above the other (the
//     D21 rider: what stands side by side on the wide step stacks below it);
//   · `@md` to `@3xl` — TWO per row (the tablet: two tiles of ~287px);
//   · from `@3xl` (48rem = 768px) — FOUR on one row, `gap-8` (the notebook:
//     232px tiles; the laptop: 283px). At the step itself a tile is 168px
//     wide, and round 2f's „Intervenții reușite" took two lines (round 2s
//     shortened it to „Intervenții") — a label wraps between words, which
//     `hyphens-none` guarantees.
//   · THREE TILES — the clinic's band on Home and Team — have a row of their own
//     (`rowsFor`): ONE column below the column's `@xl` (36rem = 576px), all
//     THREE across from it (the tablet's 614px column: ~178px tiles; the
//     notebook's: ~320px). Never two and one: the four-tile steps would leave
//     the third tile alone on a row with half the band empty beside it.
// Any other count keeps the four-tile steps, the rest of the row empty: the
// grid does not stretch tiles over columns' worth of width it was not
// measured for. Inside THE BAND SCALE no step moves (that paragraph's last
// bullet); only the gap does, `gap-8` drawn at the tiles' 9/8 — 36 design
// pixels.
//
// ── NO TOKEN MAY PUSH THE PAGE SIDEWAYS (§7 — found by the PseudoLocale
// story, measured on round 2f's lead: its 70-character run of `·` padding,
// one unbreakable token, laid the band out 418px wide in a 375px window;
// round 2s's shorter lead pads to 49). The
// lead and every description carry `wrap-anywhere` (overflow-wrap: anywhere)
// on the element, and the choice between the two overflow-wrap values is the
// layout's, not taste. ui/Modal's slot picked `break-word` plus a zero
// minimum width, because its long word sits in a flex ROW; here the long
// token sits in two SHRINK-TO-FIT boxes — the centred opener column (the
// default `align`) sits on auto margins, so it is sized fit-content, and each description is a
// centred flex item inside a grid track that sizes itself from its items'
// min-content — and `break-word` does not lower min-content, so both boxes
// would still be as wide as the token. `anywhere` does, and in a box whose
// width comes from the space available it breaks a word only when the word
// cannot fit a line on its own — ordinary prose still wraps at spaces and at
// the hyphenation points §15.14 gives it. Real text rarely needs it (a
// German compound the dictionary lacks, a pasted address); the pseudo stress
// is the frame that proves it holds. The labels need none: `hyphens-none`
// keeps a title whole, and the data test caps an unbreakable label token at
// 21 characters (D32).
//
// ── NO EMPTY STATE. `tiles` empty is a page bug, not a state: lib/team's
// data test pins at least one stat per doctor (D32) and the clinic's three,
// so this band renders what it is given; its only branches are the four
// settings of the SECOND AND THIRD PAGES paragraph (`scaled` the fourth).
// Tiles are keyed by their `id`, never an index.
//
// ── Server-safe and zero-JS apart from the island: no 'use client', ONE hook
// (the server-safe useId, for the heading's id), no state, no handler. The
// suite proves it from the source text.

/** One tile — every field finished and already in the visitor's language. */
export type DoctorStatTile = Readonly<{
  /** Stable key — React's list key. No DOM id is emitted: nothing points at a
   *  tile, so the key is all the id this list needs today. */
  id: string;
  /** The decorative glyph inside the disc — a whole-svg glyph component
   *  instance from src/assets/glyphs (aria-hidden by default). */
  icon: ReactNode;
  /** The FINAL number, an integer ≥ 0 — the island counts up to it; the
   *  static HTML prints it. `countFrames` refuses anything else with a
   *  RangeError, so a bad tile fails `next build` (its JSDoc). */
  value: number;
  /**
   * Printed after the number ON SCREEN, finished text ("+"), or absent;
   * lib/team's rows allow `'+'` alone, meaning "at least". Never spoken: the
   * island's twin says the band's `atLeast` word BEFORE the number instead
   * („peste 3.000", the header's SUFFIX, SPOKEN paragraph), and a tile
   * without a suffix is spoken as its number alone. The G2-R2 tier 2 record
   * that stood here (the twin's „3.000+" read "plus" by NVDA, JAWS and
   * VoiceOver in all five languages, an explicit word left as the owner's
   * call) is superseded by the owner's word, 2026-09-27 (round 2s).
   */
  suffix?: string;
  /** The tile's title, finished text — becomes the <h3>. */
  label: string;
  /** One sentence, finished text. */
  description: string;
}>;

/** Where the band stands — the header's SECOND AND THIRD PAGES paragraph. */
export type DoctorStatsGround = 'tint' | 'page';

/** How the opener lines up — sections/SectionHeading's two answers. */
export type DoctorStatsAlign = 'center' | 'start';

type DoctorStatsOwnProps = Readonly<{
  /** The mono micro-label over the title, finished text (§8.1). */
  eyebrow: string;
  /** The band's <h2> — and, through aria-labelledby, the region's name. */
  title: string;
  /**
   * One sentence under the title, finished text — or none: the band on Home
   * and Team has no lead (owner 2026-10-01: "without this … so dorp that
   * part"), and an absent or empty lead renders no <p>. Optional on purpose,
   * so the doctor page's lead is pinned by src/app/[locale]/page-twins.test.ts
   * (that page's band carries `lead`) rather than by this type.
   */
  lead?: string;
  /**
   * The ground: 'tint' (default) is sections/TintedBand, the doctor page's
   * lilac with its two fades; 'page' is the plain page ground every other
   * band on Home and Team stands on (owner 2026-10-01: "without that
   * gradient lilla background").
   */
  ground?: DoctorStatsGround;
  /**
   * The opener's alignment: 'center' (default, the doctor page) or 'start'
   * (Home and Team — "left alligned as other headings nad eyebrows on main
   * page"). The tiles stay centred either way.
   */
  align?: DoctorStatsAlign;
  /**
   * Draws the band in THE BAND SCALE (the header's paragraph of that name;
   * ui/Container's THE BAND SCALE; CLAUDE.md §15.32): on a laptop or desktop
   * column of max(56rem, 896px) the band takes the design pixel every scaled
   * band on its page takes — the column ÷ 1106, capped at a 96rem column and
   * centred past it — so its eyebrow and <h2> are the doctors band's size and
   * stand on the doctors band's left edge at every width; and the tiles draw
   * at 9/8 of that pixel (`TILE_ZOOM`), so a tile's sentence reads a doctor
   * card's quote size. Home and Team pass it. FALSE by default (§6.6): the
   * doctor page's other bands do not scale yet and its headings must stay one
   * size with theirs, so that page's call did not change by a character.
   * Below the step, on every touch device and in an engine that cannot
   * register custom properties it changes no pixel.
   */
  scaled?: boolean;
  /** The tiles, 1..n, in the page's order (four on every doctor, three on
   *  the clinic's band). */
  tiles: readonly DoctorStatTile[];
  /**
   * Turns a number into the visitor's digits — `Intl.NumberFormat(locale)
   * .format` from the page (§8.3). The band never formats (a "3.000" vs
   * "3,000" question is the locale's); it CALLS this on the server for every
   * value and for every step of the count (the header's `format` paragraph).
   */
  format: (value: number) => string;
  /**
   * The word a screen reader hears for a tile's „+", finished text from the
   * page's `team.doctor.stats.atLeast` key (§8.1): „peste" (ro), "over" (en),
   * „über" (de), « plus de » (fr), « oltre » (it). The band puts it BEFORE
   * the formatted final value in the island's twin of every tile that carries
   * a suffix, `${atLeast} ${spokenNumber(value, format)}` = „peste 3.000", while the screen
   * keeps showing „3.000+". It names the ONE suffix the data shape allows
   * (`'+'`, "at least"); a second suffix kind would need a second word, a
   * named trigger not built (the header's SUFFIX, SPOKEN paragraph).
   */
  atLeast: string;
}>;

export type DoctorStatsProps = DoctorStatsOwnProps &
  // The native <section> surface, minus the band's own names and minus
  // `children` (content arrives as the props above; without the Omit a caller
  // could nest something, type-check, and watch it vanish — the SectionHeading
  // precedent). `title` leaves the native side with the own props: it is a
  // real HTML attribute (a tooltip), and the two meanings would otherwise
  // intersect into something that is neither. The two ARIA naming attributes
  // leave too: the band's name is its <h2>'s text ALONE, and a caller's pair
  // would silently replace the component's own. React 19 carries `ref` inside
  // these props, so it needs no mention of its own (§6.8).
  Omit<
    ComponentPropsWithRef<'section'>,
    keyof DoctorStatsOwnProps | 'children' | 'aria-label' | 'aria-labelledby'
  >;

/**
 * How many equal slices of the island's count the curve is sampled at: 45 =
 * 30 steps a second over StatNumber's 1.5 s — a new number every ~33 ms, every
 * other frame on a 60 Hz screen, which reads as a smooth count at the speed
 * the digits move. KEEP-IN-SYNC with `COUNT_DURATION_MS` in StatNumber.tsx:
 * the island maps its duration onto however many frames it is handed, so the
 * two only agree about "30 a second" while they move together — and that
 * RELATION is pinned, not only the two values: StatNumber.test.tsx's
 * `samples the count at 30 steps a second` (G2-R2 tier 2, typescript F2).
 */
const COUNT_STEPS = 45;

/**
 * The count, as the strings the visitor will see — made HERE, on the server,
 * with the page's own formatter, because a formatter cannot cross into the
 * island (the header's `format` paragraph). Step `i` of COUNT_STEPS shows
 * `value` eased by ease-out cubic, `1 − (1 − t)³` at `t = i / COUNT_STEPS`,
 * rounded to a whole number: fast at the start, settling slowly onto the
 * final value, so the last digits are readable before they stop. The LAST
 * frame is `format(value)` itself — never the curve's float at t = 1 — so
 * the final text is exactly what the static HTML prints, and the very number
 * the screen reader hears inside the tile's spoken form (the header's SUFFIX,
 * SPOKEN paragraph). Exported for the suites; the band is its only caller.
 *
 * @throws RangeError when `value` is not an integer ≥ 0 (G2-R2 tier 2,
 * typescript F1). The curve is rounded to whole numbers, so a fraction would
 * settle on the whole number below it and then jump to „6,5" on the last
 * frame, a negative value would print „-0" on the way up, and NaN would print
 * „NaN" 46 times. Negative zero needs its own clause: `Number.isInteger(-0)`
 * is true and `-0 < 0` is false, so the first two tests let it through, yet
 * `Intl.NumberFormat` prints it „-0" (on every frame, the final one included),
 * hence `Object.is(value, -0)`. The message spells it „-0" too, because a
 * template literal would print `-0` as "0", a value this guard accepts. This
 * runs on the SERVER, while the static export renders the doctor page, so a
 * bad tile kills `next build` at the call site instead of shipping a count
 * that lies (lib/scroll-spy's `createScrollSpy` is the precedent for refusing
 * at construction). lib/team's data test pins the same rule for the rows it
 * ships; this guard covers every other caller.
 */
export function countFrames(
  value: number,
  format: (value: number) => string,
): CountFrames {
  if (!Number.isInteger(value) || value < 0 || Object.is(value, -0)) {
    throw new RangeError(
      `countFrames: value must be an integer ≥ 0, got ${Object.is(value, -0) ? '-0' : value}`,
    );
  }
  const rising = Array.from({ length: COUNT_STEPS }, (_, step) => {
    const progress = step / COUNT_STEPS;
    return format(Math.round(value * (1 - (1 - progress) ** 3)));
  });
  return [...rising, format(value)];
}

/**
 * The number as the EAR gets it (the Opus a11y review of 2026-10-01 and its
 * re-review the same day, folded on the owner's delegation): the page's own
 * formatter, with every SPACE it puts BETWEEN TWO DIGITS dropped. French
 * groups thousands with U+202F, the narrow no-break space, and other locales
 * use U+00A0. Heard, such a space is a risk and its absence never is: a voice
 * that does not take it for a thousands separator — a French page read by
 * another language's voice among them — says „huit, zéro zéro zéro"; a
 * braille table may print a code for it, and in 6-dot literary braille a
 * space ENDS a number; and a plain space would be a line-break point inside
 * the number. „8000" is one number to every voice and every table, and it is
 * how the tiles' own sentences already write it („Plus de 8000 sourires").
 * Only a space between digits goes: the dots and commas ro, de, it and en
 * group by are untouched, and so is anything else the formatter prints. The
 * digits on screen keep the formatter's own spacing (§8.3) — only the twin
 * hears the number unspaced. Exported for the suites; the band is its only
 * caller.
 */
export function spokenNumber(
  value: number,
  format: (value: number) => string,
): string {
  return format(value).replace(/(?<=\d)[\u00a0\u202f](?=\d)/g, '');
}

/**
 * What `align` does to the opener (the header's CENTRING paragraph): the
 * capped box centres as a box, and a lead centres its own lines, only when
 * the band is centred. A Record keyed by the alignment, so a third one is a
 * compile error here rather than a silent `start` (SectionHeading's ALIGN,
 * the precedent; the TS review of 2026-10-01).
 */
const OPENER: Readonly<
  Record<DoctorStatsAlign, Readonly<{ box?: string; lead?: string }>>
> = {
  center: { box: 'mx-auto', lead: 'text-center' },
  start: {},
};

/**
 * The columns the tiles stand in, by how many there are (the header's STEPS
 * paragraph): three — the clinic's band on Home and Team, though the rule
 * reads only the count — one column below the container's `@xl` and all
 * three across from it; any other count, the doctor page's measured steps,
 * two from `@md` and four from `@3xl`. Whole class strings, so Tailwind's
 * scanner sees every one of them.
 */
function rowsFor(count: number): string {
  return count === 3 ? '@xl:grid-cols-3' : '@md:grid-cols-2 @3xl:grid-cols-4';
}

/**
 * THE TILES' ZOOM (the header's THE BAND SCALE, its zoom bullet): worn by the
 * list beside `bandScaleClasses`, only when the band is `scaled`. It sets the
 * multiple ui/Container's pixel declaration reads (`--band-zoom`, its THE
 * ZOOM), so the list computes its design pixel afresh from the column at 9/8
 * of the band's, and every tile draws at 9/8: its sentence, ui/Text's 16, at
 * 18 design pixels — a doctor card's quote — with every ratio inside it as it
 * is. 1.125 = 18 / 16, the quote over the sentence. Inert outside the regime:
 * its one reader is the pixel declaration the same gates hold back. The list
 * must keep ui/Container as its nearest size container (THE ZOOM's
 * precondition — no `@container` between them, which today none is): inside
 * another container the gate would read that box and the zoom would do
 * nothing. One whole static string, because Tailwind reads class names from
 * source text.
 */
const TILE_ZOOM = '[--band-zoom:1.125]';

export function DoctorStats({
  eyebrow,
  title,
  lead,
  tiles,
  format,
  atLeast,
  ground = 'tint',
  align = 'center',
  scaled = false,
  className,
  ...rest
}: DoctorStatsProps): ReactElement {
  const headingId = useId();
  const opener = OPENER[align];

  const content = (
    // The rhythm box — band-owned `py` on container steps (the header's
    // GROUND paragraph), and the gap between the opener and the tiles. The
    // same box, the same steps, on both grounds; `scaled`, it also wears
    // ui/Container's band-scale column and pixel, in that order (the header's
    // THE BAND SCALE; ui/Container's recipe rule 5).
    <div
      className={cx(
        'flex flex-col gap-10 py-12 @lg:py-16 @3xl:py-20',
        scaled && bandColumnClasses,
        scaled && bandScaleClasses,
      )}
    >
      {/* THE OPENER — capped as a BOX, centred as one only when the band is
          (`mx-auto`); each text centres itself (the header's CENTRING
          paragraph). */}
      <div className={cx('flex max-w-3xl flex-col gap-4', opener.box)}>
        {/* `hyphens-none` — the title wraps between words and never inside
            one; `wrap-anywhere` — unless a word cannot fit a line by itself
            (the header's TITLE paragraph). */}
        <SectionHeading
          level={2}
          id={headingId}
          eyebrow={eyebrow}
          title={title}
          align={align}
          className="hyphens-none wrap-anywhere"
        />
        {lead ? (
          <p
            className={cx('text-lg text-ink-muted wrap-anywhere', opener.lead)}
          >
            {lead}
          </p>
        ) : null}
      </div>
      {/* THE TILES — the columns by count (`rowsFor`, the header's STEPS
          paragraph). `role="list"` is load-bearing in WebKit (the header's
          TILES paragraph). Each tile's DOM is disc → label → number →
          description, painted disc → number → label → description (the
          header's ORDER bullet). `scaled`, the list wears the band-scale
          pixel a second time with the zoom beside it, and every tile draws at
          9/8 of the band's pixel (`TILE_ZOOM`, the header's zoom bullet). */}
      <ul
        role="list"
        className={cx(
          'grid gap-10 @3xl:gap-8',
          rowsFor(tiles.length),
          scaled && bandScaleClasses,
          scaled && TILE_ZOOM,
        )}
      >
        {tiles.map((tile) => (
          <li key={tile.id} className="flex flex-col items-center gap-4">
            {/* THE DISC — decoration (the header's DISC paragraph); painted
                  first by `-order-2`. */}
            <span
              aria-hidden="true"
              className="-order-2 flex size-28 items-center justify-center rounded-full border border-line bg-surface text-accent-decorative [&_svg]:size-12"
            >
              {tile.icon}
            </span>
            {/* THE LABEL — the tile's <h3>, FIRST in the DOM after the
                  decoration, so a heading jump lands before the number. */}
            <Heading size="title" asChild className="text-center hyphens-none">
              <h3>{tile.label}</h3>
            </Heading>
            {/* THE NUMBER — the `page` step on a <p>; the island inside;
                  painted above the label by `-order-1`. The island gets the
                  frames to SHOW and, in `spoken`, the one finished string to
                  be HEARD (the header's SUFFIX, SPOKEN paragraph). */}
            <Heading
              size="page"
              asChild
              className="-order-1 tabular-nums text-center"
            >
              <p>
                <StatNumber
                  frames={countFrames(tile.value, format)}
                  suffix={tile.suffix}
                  spoken={
                    tile.suffix
                      ? `${atLeast} ${spokenNumber(tile.value, format)}`
                      : spokenNumber(tile.value, format)
                  }
                />
              </p>
            </Heading>
            {/* THE DESCRIPTION — a muted <p>, centred on the element. */}
            <Text tone="muted" className="text-center wrap-anywhere">
              {tile.description}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  );

  // THE GROUND (the header's SECOND AND THIRD PAGES paragraph). Either way
  // `{...rest}` rides FIRST so a stray attribute can never replace the name
  // pair, and the caller's className merges LAST (§6.8) — through TintedBand
  // on the tint, through cx here on the page ground. A ternary hands anything
  // new to its else branch, so the next line stops compiling the day the
  // union gains a third ground (PersonnelCard's `kind` tripwire, the TS
  // review of 2026-10-01).
  void (ground satisfies 'tint' | 'page');
  return ground === 'tint' ? (
    <TintedBand {...rest} aria-labelledby={headingId} className={className}>
      {content}
    </TintedBand>
  ) : (
    // THE PAGE GROUND — the outer of the bands around it on Home and Team:
    // full-bleed, the paint and nothing else, ui/Container inside owning the
    // width and the container-query context the steps read.
    <section
      {...rest}
      aria-labelledby={headingId}
      className={cx('bg-page', className)}
    >
      <Container>{content}</Container>
    </section>
  );
}
