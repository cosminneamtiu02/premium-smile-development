import { useId, type ComponentPropsWithRef, type ReactElement } from 'react';
import {
  PersonnelCard,
  type PersonnelPhoto,
} from '@/components/sections/PersonnelCard/PersonnelCard';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import {
  Container,
  bandColumnClasses,
  bandScaleClasses,
} from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx/cx';

// sections/TeamRoster — the Team page's STAFF band: the auxiliary personnel
// under an eyebrow and an <h2> of their own, as a row of tiles of ONE width
// per regime — fixed on a tablet and a laptop, the column's own on a phone
// (D9). Built on
// the doctor-pages run's N2 composition contract
// (.claude/section-runs/2026-09-21_11-58_doctor-pages, unit 7); the D-numbers
// below are that run's ledger decisions and the anchors other files quote
// (§17.7 — never a line number).
//
// ── ONE JOB SINCE 2026-09-30. The owner, verbatim: "ok. make this the
// official dr card under personell card and i'll keep working on it.
// integrate it in the page and crete it as a section in the home page and in
// the personell page with heading and eyebrow smth in the direction of
// specialistii cu care ne mandrim familia premium smile." The doctors left
// this band for one of their own, sections/DoctorShowcase — the same band on
// Home and on Team, with its own eyebrow and title — and the page's title left
// with them: the Team page's <h1> is a bare `sr-only` element in the PAGE's
// markup now (the Services page's shape). So for two days this band printed
// no title, held no doctor and alternated nothing; what stayed was the grid
// the run built for the auxiliary staff — until the next paragraph.
//
// ── A TITLE OF ITS OWN, FIXED TILES AND THE BAND SCALE (2026-10-02, CLAUDE.md
// §15.32). The owner, verbatim: "the other page you have to implement the same
// thing once done is the team page. there you have little work. you hav eto
// create an eyebrow and headline for the 3 cars with helping staff, so create
// a new section with them with ta headline/eyebrow saying smth like our
// helping staff could't do it without them. and another huge issue, the cards
// for helping staff are always adjusting in width. that should not happen.
// they should be fixed and i have attatched the sizes i want for
// responsiveness to be mentained in desired screens and also here important
// for phone and tablet make them a fixed size or smth. i do not want them o
// nthose screens to widen or retract on those screens." (His screenshot: three
// tiles ≈ 404px wide, a 192 × 256 portrait, 30px names, 14px eyebrows, at a
// ≈ 1594px window.) Four changes, each argued in its own paragraph below: the
// band NAMES ITSELF by a new opener — `eyebrow` and `title`, REQUIRED, the
// page's `team.roster.eyebrow` / `team.roster.title` — the tiles are <h3>s
// under it, D9's stretching tracks are FIXED TILES, and the rhythm box wears
// ui/Container's THE BAND SCALE like every band of the Team page.
//
// ── D1 · DUMB, PROPS-IN, ZERO KEYS — the PriceList/Hero shape. Every string
// that arrives here is FINISHED: translated, in one language — the eyebrow and
// the title as much as every name and position. No t(), no message key, no
// `Locale`, no lib DATA — the one lib specifier is lib/cx, and the portrait's
// shape is PersonnelCard's own `PersonnelPhoto` (G2-R2 typescript F4). ONE
// hook, the server-safe useId, for the heading's id (the next paragraph). The
// Team page is the ONE populator; this file could not tell Romanian from
// German if it tried, which is what lets Storybook review it on invented
// people before the real team is written (§15.17).
//
// ── THE BAND NAMES ITSELF, BY ITS OWN <h2> (since 2026-10-02 — SUPERSEDES
// "THE BAND NAMES NOTHING, ITSELF INCLUDED": with no heading of its own the
// band had no visible title to name a region by, so it refused every name).
// Now the <section> is a named `region`: its `aria-labelledby` points at the
// <h2>, whose id comes from useId() — server-safe and hydration-stable, so two
// bands on one page never collide — and lands on the heading through
// SectionHeading's `id`, never on its root, so the region's name is the
// title's text ALONE, without the eyebrow (DoctorShowcase's D2, the
// DoctorStats shape). The two ARIA naming attributes stay OMITTED from the
// props — the name is the band's own, and a caller's pair would replace it —
// and the Omit alone is still not a refusal: TypeScript exempts a HYPHENATED
// attribute written in JSX from its excess-property check, so
// `<TeamRoster aria-label="…" />` compiles (G2 typescript, 2026-09-30,
// measured). Hence THE BELT after `{...rest}`: the band's own
// `aria-labelledby` rides after the spread, so a caller's never lands, and a
// caller's `aria-label` is reset to `undefined`, so no second name stands in
// the markup beside the heading's (aria-labelledby would win the name
// computation anyway; the reset keeps the stray attribute out of the DOM).
// `title` is an OWN prop now — the band's heading text — so the native `title`
// attribute leaves the props with it (DoctorStats' precedent: the two meanings
// would intersect into neither), and it can never reach the <section>:
// destructured before the spread, it is never in `rest`. The tooltip matters:
// MEASURED 2026-09-30, Chromium's accessibility tree exposes `<section
// title="…">` as a NAMED `region` — the reason it was refused while the band
// named nothing, and a second name now.
//
// ── THE OPENER — sections/SectionHeading at level 2, `align="start"` like
// every opener on the Team page, the eyebrow over the title. `hyphens-none`
// and `wrap-anywhere` ride its className merge (§6.8: they land on its root and
// inherit to the <h2> and the eyebrow) — DoctorStats' TITLE paragraph, the
// precedent: a title wraps between words and never inside one, and the belt
// breaks only a word too long for a line by itself, which at an ordinary text
// size never happens (the longest word of the five drafts is the French
// „arriverions", eleven letters, shorter than the thirteen-letter Italian word
// DoctorStats measured inside the 320 column).
//
// ── EACH TILE IS AN <h3> (since 2026-10-02 — SUPERSEDES "EACH TILE IS AN
// <h2>") — `headingLevel={3}`, PersonnelCard D4's axis at its default. The
// tiles sat under the page's <h1> as siblings of the doctors band's <h2>
// because no heading stood over them (D10, the owner's "as simple as
// possible"); now the band's own <h2> does, and a person is filed under it.
// The Team page's outline, one level at a time (§9): page h1 (sr-only) → the
// doctors band's h2 → an h3 per doctor → THIS band's h2 → an h3 per tile →
// the numbers band's h2 → the map's h2. The name keeps its look: since the same
// day PersonnelCard's NAME_STEP (its D4) dresses a level-3 auxiliary name in
// `band`, and a tile's own container stays under that step's 28rem at every
// width, so the name reads 30px — 30 design pixels inside the scale: the level
// is the outline's and never the look's (DoctorShowcase's D6, the doctors'
// rule).
//
// ── ONE LIST, AND NONE AT ALL WHEN IT IS EMPTY. `role="list"` on the <ul> is
// redundant in the spec and load-bearing in WebKit, which drops list semantics
// from any `list-style: none` list (the ui/SpeedDial precedent — configured as
// an exception in eslint.config.mjs's `jsx-a11y/no-redundant-roles` options).
// An EMPTY `members` renders NOTHING — `null`, the ReviewsCarousel / PriceList
// exit: a clinic with no auxiliary personnel yet is a state the populator can
// really produce, and a titled band over "list, 0 items" is a promise with
// nothing behind it (DoctorShowcase's D7). The early return sits AFTER useId():
// hooks run in the same order on every render (the Rules of Hooks).
//
// ── D9 · FIXED TILES (2026-10-02 — SUPERSEDES the tracks of 2026-09-21). The
// grid stated a FLOOR, `repeat(auto-fit, minmax(16rem, 1fr))`, and let the
// engine pick the count, and `auto-fit` COLLAPSES the tracks three tiles cannot
// fill — so each tile was a third of the row, the owner's "always adjusting in
// width". On develop's column a tile was 352.6px at a 1401 window, ≈ 404 at
// his ≈ 1594 (his screenshot: 404) and ≈ 491 at 1920, under a classic
// scrollbar, and 295.2 on a 768 tablet and 312 on a 390 phone: a new width at
// every window. Now the <ul> is a wrapping flex row that STARTS AT THE
// COLUMN'S START (TILES) and every <li> carries the width (TILE), ONE per
// regime:
//   · ON A PHONE — a column under Tailwind's named `md` step, 28rem (448px):
//     every phone held upright (the widest, 440, a 396px column) and the
//     ramp's windows up to ~520 (THE PHONE GUTTER — ui/Container, CLAUDE.md
//     §15.35): `@max-md:w-full`, THE COLUMN'S OWN WIDTH, the doctor cards'
//     width above it — 288px at 320, 351 at 390, 387 at 430 — one tile a row
//     (the next paragraph, the owner's of 2026-10-09).
//   · OFF A PHONE, OUTSIDE THE BAND SCALE — every tablet held either way, a
//     phone held sideways, any touch screen at any width, a column under the
//     step: `w-72`, 18rem = 288px, FIXED, 20px apart (`gap-x-5`). Such a
//     column is 28rem or more, so the tile always fits it with room to spare
//     — the `max-w-full` it wore until 2026-10-09 could only ever bind under
//     an 18rem column, and every such column is a phone's, where the tile is
//     the column now. A 768 window: two per row (596 of a 614px column on a
//     tablet, of 599.4 on a desktop with a classic scrollbar), the third
//     under the first; an iPad held sideways (1180): three, 904 of 944.
//   · INSIDE IT — a laptop or a desktop from a max(56rem, 896px) column:
//     `w-88`, 352 DESIGN pixels, 24 design pixels apart (`gap-x-6` behind the
//     regime's chain), three to the band's 1106-design-pixel row — 3 × 352 +
//     2 × 24 = 1104, 2 design pixels short of the column's end — at every
//     width, scaling with it: 352px at the 1401 window, ≈ 401 at the owner's
//     ≈ 1594 (his 404), ≈ 484 at 1920, the cap's ≈ 489 past it. Their
//     proportions never move again: the 192-design-pixel portrait, the
//     30-design-pixel name and the eyebrow grow with the tile.
// THE PHONE'S TILE IS THE COLUMN (2026-10-09 — SUPERSEDES, on a phone alone,
// the fixed 288 above and that morning's centring). The owner, verbatim, on
// THE PHONE GUTTER's preview: "also make "our support team" part readctive on
// phone as the doctor cards are". A doctor card is its column's own width on a
// phone — measured on the lane's build, 288px at 320, 351 at 390, 387 at 430 —
// and the halved gutter left the 288px tile 63px narrower than the doctor card
// above it at 390, 99px at 430, centred under it since the same day's first
// look ("it fucked up the dcentering of the 'our support team' section"). Read
// as WIDTH — follow the phone's screen the way the doctor cards do, the
// planner's reading, recorded: the tile takes the column, and, as the doctor
// card's cutout keeps its 18rem cell, the portrait keeps its 12rem one
// (PersonnelCard D3), centred in the wider surface — so a phone's tile grows
// sideways and never in height. A tile as wide as its line has nothing to
// centre, so that morning's centring (a `justify-center` behind the phone
// step) left again. The
// 2026-10-02 sentence this reverses on a phone ("also here important for phone
// and tablet make them a fixed size or smth. i do not want them o nthose
// screens to widen or retract on those screens") still holds on a tablet: 288
// at every tablet width. The phone's line is the named `md` step, the one the
// band's opener already answers (its <h2> 30px under it, 36 from it), never a
// number of the band's own.
// WHY 20 OUTSIDE THE SCALE AND 24 INSIDE IT (the planner's, the same day, on
// two measurements). A DESKTOP window held at 768 is not a tablet: its
// classic scrollbar takes 15px, which the shell reserves (globals.css,
// `scrollbar-gutter: stable`), so its column is 599.4px, 0.6px short of two
// tiles and a 24px gap (600) — with one `gap-6` it stood the two one a row; 20
// makes two need 596. Inside the scale 24 keeps three tiles on the band's
// edge to 2 design pixels. And the row is START-ALIGNED, never spread
// (`justify-between` was tried the same day and struck by the Opus review's
// measurement): a spread pushes ANY row of two to the column's two edges — a
// 228 to 319px hole between two tiles on a 1024 to 1138px mouse window, where
// the column is under the step and only two fit, and 367 to 553px between the
// two tiles of a two-member staff at every laptop width — while a start
// leaves the slack at the row's end, the way a line of text ends.
// The regime's width and gap RE-SPELL the band's gate chain, `scalable:@4xl:
// @min-[896px]:` — byte for byte bandScaleClasses' own — because Tailwind
// reads a class only whole, from source text, and cannot compose a variant out
// of an imported string. Their query reads the same container as the rhythm
// box's (ui/Container — no box between them is a container), so all three
// flip at the same column; TeamRoster.test.tsx holds the chains equal, and
// tests/unit/design-scale.test.ts the band-scale wearers and every re-spelled
// chain in src/.
// KNOWN CONSEQUENCES, stated rather than discovered: a short row leaves its
// END empty — the tablet's third tile alone under the first, the two-up rows
// of a 1024 to 1138px mouse window, a two-member staff's row on a laptop; a
// phone's row has no end to leave, its one tile being the row. At THE STEP the
// tile jumps: 1px under it two 288px tiles a row (three would need 904 of an
// 895px column), at it three 285px ones (s = 0.810) — the band scale's own
// jump (DoctorShowcase's D10, (3)). At the PHONE's step it jumps too: one
// pixel under a 448px column the tile is 447 wide, at it 288 at the column's
// start — a ~520px window, on the gutter's ramp, where no phone held upright
// and no tablet is. `justify-center` on TILES is the one-word change if the
// owner wants a short row centred instead.
//
// ── `h-full` ON EVERY TILE. A flex item is stretched to its line's height by
// default, and a stretched item's height is DEFINITE (CSS Flexbox §9.8), while
// the <article> inside it is an ordinary block — so without the class a taller
// neighbour lifts the <li> and leaves the shorter card's surface hanging short
// (the AuxiliaryTiles reasoning, G2 react; the grid's stretched items behaved
// the same). §6.8 placement: it rides the caller-slot className and never
// restyles the card's insides.
//
// ── THE BAND OWNS ALL THE SPACING (§6.4) AND THE CARDS OWN NONE: `gap-10`
// between the opener and the tiles — DoctorStats' opener-to-tiles gap, the
// band right after this one on the Team page, so the two openers stand alike
// — 20px between two tiles of a row outside the band scale and 24 design
// pixels inside it, 24 (design) px between rows (D9), the stepped `py` around
// them. The shape is
// ui/Container's PAGE-BAND RECIPE (the standing law in Container.tsx's header):
// the semantic full-bleed <section> owns the paint (`bg-page`) and nothing
// else — no gutter, no outer margin, because the PAGE owns the rhythm BETWEEN
// bands — and the Container inside owns the width and the container-query
// context. The stepped `py` cannot ride on Container itself (an element cannot
// query its own size), so it sits on the rhythm box one level in,
// ClinicLocation's spelling exactly.
//
// ── THE BAND SCALE (2026-10-02, CLAUDE.md §15.32 — ui/Container's THE BAND
// SCALE). The rhythm box wears BOTH of ui/Container's band-scale strings,
// `bandColumnClasses` and `bandScaleClasses` (that file's recipe rule 5), so on
// a laptop or a desktop this band draws in the SAME design pixel as every
// other band of the Team page — the column ÷ 1106, capped at a 96rem column —
// and caps and centres at the same width: its eyebrow (14 × s px) and its <h2>
// (36 × s px) have the doctors band's size and the doctors band's left edge at
// every width, and every gap, padding and tile inside it is drawn in that
// pixel. UNCONDITIONAL — no `scaled` prop, unlike a band that also stands on a
// page that does not scale: this band's only page is the Team page, and every
// band there scales (the owner, above: "the other page you have to implement
// the same thing once done is the team page"). Below the step, on every touch
// device and in an engine that cannot register custom properties, the strings
// declare nothing and remap nothing: the band is its rem self — its opener at
// the theme's sizes and its tiles at D9's two widths off the scale, 18rem on a
// tablet, the look the owner asked for in the same breath ("also here
// important for phone and tablet make them a fixed size or smth"), and the
// column's own on a phone since 2026-10-09 (D9's phone paragraph).
//
// ── `id` IS THE REACT KEY, and deliberately nothing else: the tiles are
// spelled prop by prop, so no id reaches the DOM. TRIGGER, recorded so the
// next lane can tell "not decided" from "decided no": the first consumer that
// wants `/{locale}/team/#gurgu-aurelia` spreads the id onto the card through
// PersonnelCard's native spread (its D10).
//
// ── ISLANDS (§16). No 'use client' in this file: no state, no handler, and ONE
// hook — useId, which is server-safe — so the band compiles into the Team
// page's static HTML. The ONE cost, stated rather than discovered: each tile's
// portrait brings ui/Image's small client island with it (PersonnelCard D11) —
// accepted there, unchanged here. TeamRoster.test.tsx pins the directive's
// absence, the one hook and the whole import surface from the source text,
// because no runtime assertion can see any of them.

/**
 * One member of the auxiliary personnel (PersonnelCard's `auxiliary` kind):
 * the portrait column alone, with no quote and no link to give.
 */
export type TeamRosterMember = Readonly<{
  /** Stable identity in the populator's data — the React key and nothing
   *  else (see the header's `id` paragraph). */
  id: string;
  /** The full name, finished text (§8.1) — becomes the tile's <h3> (see the
   *  header's outline paragraph). */
  name: string;
  /** The position, finished text — the card's all-caps eyebrow. */
  position: string;
  /** The portrait: a path under public/images/ plus its INTRINSIC pixel size,
   *  the optimizer's srcset input and the reserved box (§11). The TYPE is the
   *  card's own `PersonnelPhoto`, imported rather than re-spelled (G2-R2
   *  typescript F4), so a field the card's photo gains reaches this band and
   *  its populator in the same change-set instead of being silently dropped. */
  photo: PersonnelPhoto;
}>;

type TeamRosterOwnProps = Readonly<{
  /** The mono micro-label over the title, finished text (§8.1) — the page's
   *  `team.roster.eyebrow`. */
  eyebrow: string;
  /** The band's <h2> — and, through aria-labelledby, the region's name: the
   *  page's `team.roster.title`, finished text (§8.1). */
  title: string;
  /** The auxiliary personnel, in the order they should read. EMPTY renders
   *  nothing at all — no region, no heading (see the header). */
  members: readonly TeamRosterMember[];
}>;

export type TeamRosterProps = TeamRosterOwnProps &
  // The native <section> surface, minus the band's own props and minus
  // `children` (content arrives as `members`; without the Omit a caller could
  // nest something, type-check, and watch it vanish — the SectionHeading
  // precedent). The native `title` leaves with the own props — the band's
  // `title` is its heading, and the two meanings would otherwise intersect —
  // and the two ARIA naming attributes leave too: the band's name is its
  // <h2>'s text ALONE (see the header). React 19 carries `ref` inside these
  // props, so it needs no mention of its own (§6.8).
  Omit<
    ComponentPropsWithRef<'section'>,
    keyof TeamRosterOwnProps | 'children' | 'aria-label' | 'aria-labelledby'
  >;

/** THE RHYTHM BOX — the band-owned `py` on container steps and the opener's
 *  gap to the tiles (the header's SPACING paragraph), with ui/Container's two
 *  band-scale strings after them (the header's THE BAND SCALE): imported,
 *  never re-spelled — the cap and the design pixel live in Container.tsx
 *  alone. */
const RHYTHM = cx(
  'flex flex-col gap-10 py-12 @lg:py-16 @3xl:py-20',
  bandColumnClasses,
  bandScaleClasses,
);

/** The tiles' row (D9): a wrapping flex row that starts at the column's start
 *  — 20px between two tiles of a row outside the band scale (`gap-x-5`), 24
 *  design pixels inside it (the gated `gap-x-6`, the regime's chain, KEEP IN
 *  SYNC like TILE's), 24 (design) px between rows (`gap-y-6`). Never spread
 *  (`justify-between` opened holes, the G2 review of 2026-10-02), and on a
 *  phone nothing to align: its one tile is the whole row (TILE). */
const TILES =
  'flex flex-wrap gap-x-5 gap-y-6 scalable:@4xl:@min-[896px]:gap-x-6';

/** One tile's width (D9), one per regime: on a phone — a column under the
 *  named `md` step, 28rem — the COLUMN'S OWN (`@max-md:w-full`), the width
 *  of the doctor cards above it (the owner, 2026-10-09: "as the doctor cards
 *  are"); off a phone and outside the band scale 18rem FIXED, in a column of
 *  28rem or more that always holds it; 352 design pixels inside the scale,
 *  three to the 1106-design-pixel row. The regime's chain is
 *  bandScaleClasses' own, re-spelled because Tailwind reads classes whole from
 *  source text — KEEP IN SYNC with Container.tsx (TeamRoster.test.tsx holds
 *  the two chains equal). */
const TILE = 'w-72 @max-md:w-full scalable:@4xl:@min-[896px]:w-88';

export function TeamRoster({
  eyebrow,
  title,
  members,
  className,
  ...rest
}: TeamRosterProps): ReactElement | null {
  // Hooks first, the early return after (the header's list paragraph).
  const headingId = useId();

  // Nothing to show, nothing painted — no region, no heading.
  if (members.length === 0) return null;

  return (
    // BAND OUTER: the semantic element, full-bleed, owning the paint and
    // nothing else. THE BELT (see the header): `{...rest}` rides FIRST, the
    // band's own name after it, and a smuggled `aria-label` is reset;
    // className is merged caller-last (§6.8).
    <section
      {...rest}
      aria-label={undefined}
      aria-labelledby={headingId}
      className={cx('bg-page', className)}
    >
      <Container>
        {/* The rhythm box — the band-owned `py` on container steps (§6.4: the
            section owns ALL child spacing; the tiles own no margin at all)
            and the band scale (the header's THE BAND SCALE). */}
        <div className={RHYTHM}>
          {/* THE OPENER — the eyebrow over the band's <h2>, at the start;
              `hyphens-none` keeps every word of the title whole and
              `wrap-anywhere` breaks only one too long for a line (the
              header's OPENER paragraph). */}
          <SectionHeading
            level={2}
            id={headingId}
            eyebrow={eyebrow}
            title={title}
            align="start"
            className="hyphens-none wrap-anywhere"
          />
          <ul role="list" className={TILES}>
            {members.map((member) => (
              <li key={member.id} className={TILE}>
                <PersonnelCard
                  kind="auxiliary"
                  headingLevel={3}
                  className="h-full"
                  name={member.name}
                  position={member.position}
                  photo={member.photo}
                />
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
