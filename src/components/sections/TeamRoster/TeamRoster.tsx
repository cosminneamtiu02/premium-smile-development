import type { ComponentPropsWithRef, ReactElement } from 'react';
import {
  PersonnelCard,
  type PersonnelPhoto,
} from '@/components/sections/PersonnelCard/PersonnelCard';
import { Container } from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx/cx';

// sections/TeamRoster — the Team page's STAFF band: the auxiliary personnel as
// a grid of tiles, and nothing else. Built on the doctor-pages run's N2
// composition contract (.claude/section-runs/2026-09-21_11-58_doctor-pages,
// unit 7); the D-numbers below are that run's ledger decisions and the anchors
// other files quote (§17.7 — never a line number).
//
// ── ONE JOB SINCE 2026-09-30. The owner, verbatim: "ok. make this the
// official dr card under personell card and i'll keep working on it.
// integrate it in the page and crete it as a section in the home page and in
// the personell page with heading and eyebrow smth in the direction of
// specialistii cu care ne mandrim familia premium smile." The doctors left
// this band for one of their own, sections/DoctorShowcase — the same band on
// Home and on Team, with its own eyebrow and title — and the page's title left
// with them: the Team page's <h1> is a bare `sr-only` element in the PAGE's
// markup now (the Services page's shape). So this band prints no title, holds
// no doctor and alternates nothing; what stayed is the grid the run built for
// the auxiliary staff.
//
// ── D1 · DUMB, PROPS-IN, ZERO KEYS — the PriceList/Hero shape. Every string
// that arrives here is FINISHED: translated, in one language. No t(), no
// message key, no `Locale`, no lib DATA — the one lib specifier is lib/cx, and
// the portrait's shape is PersonnelCard's own `PersonnelPhoto` (G2-R2
// typescript F4). Not one hook either, not even useId: the band names nothing
// (next paragraph). The Team page is the ONE populator; this file could not
// tell Romanian from German if it tried, which is what lets Storybook review
// it on invented people before the real team is written (§15.17).
//
// ── THE BAND NAMES NOTHING, ITSELF INCLUDED. It has no heading of its own —
// its only headings are the tiles', one per person — so there is no visible
// title to name a region by, and a name on the <section> would draw a
// landmark whose label nobody sees. The root is a generic box: no `role`, no
// `aria-label`, no `aria-labelledby`, no `title` — the last three OMITTED from
// the props (the ui/Modal and PersonnelCard precedent for refusing a naming
// attribute by type) AND RESET after the spread, because the Omit alone is
// not a refusal: TypeScript exempts a HYPHENATED attribute written in JSX
// from its excess-property check, so `<TeamRoster aria-label="…" />` compiles
// — and, with nothing of the band's own riding after `{...rest}`, it rendered
// a named region (G2 typescript, 2026-09-30, measured). The three
// `undefined`s after the spread are what make the refusal real for every
// spelling: a JSX attribute, a cast, a spread of unknown shape.
// The native `title` counts: MEASURED 2026-09-30, Chromium's
// accessibility tree exposes `<section title="…">` as a NAMED `region` (a bare
// one stays `generic`) — the ReviewCard / CategoryCard Omit, for that reason.
//
// ── EACH TILE IS AN <h2> — `headingLevel={2}`, PersonnelCard D4's additive
// axis (default 3). The tiles sit under the page's <h1> as SIBLINGS of the
// doctors band's <h2>, never under it: the Team page's outline is h1 (the
// page) → h2 (the doctors band) → h3 (each doctor) → h2 (each tile). A
// level-3 tile would file the staff under the doctors band's title, which is
// not what they are — and there is no sub-heading over the staff either (D10,
// the owner's "as simple as possible").
//
// ── ONE LIST, AND NONE AT ALL WHEN IT IS EMPTY. `role="list"` on the <ul> is
// redundant in the spec and load-bearing in WebKit, which drops list semantics
// from any `list-style: none` list (the ui/SpeedDial precedent — configured as
// an exception in eslint.config.mjs's `jsx-a11y/no-redundant-roles` options).
// An EMPTY `members` renders NOTHING — `null`, the ReviewsCarousel / PriceList
// exit: a clinic with no auxiliary personnel yet is a state the populator can
// really produce, and the band would otherwise paint a padded page-ground box
// around "list, 0 items".
//
// ── D9 · THE TRACKS ARE `repeat(auto-fit, minmax(16rem, 1fr))`, AND THAT IS
// A DELIBERATE DEPARTURE FROM `AuxiliaryTiles`. PersonnelCard.stories' helper
// calls its two lines "the two lines [the page] must copy exactly", and this
// band does not copy them: `@md:grid-cols-2 @3xl:grid-cols-3` divides the
// COLUMN, so at the `@md` edge (28rem = 448px of column) each track is 212px —
// under the 16rem floor PersonnelCard D5 needs to keep a mono position from
// protruding, because that atom's eyebrow never hyphenates. `auto-fit` +
// `minmax(16rem, 1fr)` states the floor instead of the count, and the count
// falls out of it. Measured on ui/Container's own column at §7's sampling
// points, with this band's 24px gap: 320 → 256px → 1 track · 390 → 312 → 1 ·
// 768 → 614 → 2 · 1280 → 1024 → 3 · 1536 → 1228 → 4 · 1920 → 1536 → 5.
// KNOWN CONSEQUENCE, stated rather than discovered: `auto-fit` COLLAPSES the
// tracks it cannot fill, so three members at 1920 become three ~496px cards
// rather than three 256px cards beside two holes. That is the wanted face for
// a roster (the row stays full), and it is also why the tiles keep their own
// centred portrait column: a wide track is a wide card, never a wide portrait.
// `auto-fill` — holes instead — is the one-word change if the owner ever wants
// the tracks pinned.
//
// ── `h-full` ON EVERY TILE. A grid item is stretched by default while the
// <article> inside it is an ordinary block, so without the class a taller
// neighbour lifts the <li> and leaves the shorter card's surface hanging short
// (the AuxiliaryTiles reasoning, G2 react). §6.8 placement: it rides the
// caller-slot className and never restyles the card's insides.
//
// ── THE BAND OWNS ALL THE SPACING (§6.4) AND THE CARDS OWN NONE: `gap-6`
// between the tiles, the stepped `py` around them. The shape is ui/Container's
// PAGE-BAND RECIPE (the standing law in Container.tsx's header): the semantic
// full-bleed <section> owns the paint (`bg-page`) and nothing else — no gutter,
// no outer margin, because the PAGE owns the rhythm BETWEEN bands and the map
// comes after this one — and the Container inside owns the width and the
// container-query context. The stepped `py` cannot ride on Container itself
// (an element cannot query its own size), so it sits on the rhythm box one
// level in, ClinicLocation's spelling exactly.
//
// ── `id` IS THE REACT KEY, and deliberately nothing else: the tiles are
// spelled prop by prop, so no id reaches the DOM. TRIGGER, recorded so the
// next lane can tell "not decided" from "decided no": the first consumer that
// wants `/{locale}/team/#gurgu-aurelia` spreads the id onto the card through
// PersonnelCard's native spread (its D10).
//
// ── ISLANDS (§16). No 'use client' in this file: no state, no handler, not
// one hook, so the band compiles into the Team page's static HTML. The ONE
// cost, stated rather than discovered: each tile's portrait brings ui/Image's
// small client island with it (PersonnelCard D11) — accepted there, unchanged
// here. TeamRoster.test.tsx pins the directive's absence and the whole import
// surface from the source text, because no runtime assertion can see either.

/**
 * One member of the auxiliary personnel (PersonnelCard's `auxiliary` kind):
 * the portrait column alone, with no quote and no link to give.
 */
export type TeamRosterMember = Readonly<{
  /** Stable identity in the populator's data — the React key and nothing
   *  else (see the header's `id` paragraph). */
  id: string;
  /** The full name, finished text (§8.1) — becomes the tile's <h2> (see the
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
  /** The auxiliary personnel, in the order they should read. EMPTY renders
   *  nothing at all (see the header). */
  members: readonly TeamRosterMember[];
}>;

export type TeamRosterProps = TeamRosterOwnProps &
  // The native <section> surface, minus the band's own prop and minus
  // `children` (content arrives as `members`; without the Omit a caller could
  // nest something, type-check, and watch it vanish — the SectionHeading
  // precedent). The three naming attributes leave too — the two ARIA ones and
  // the native `title`, which names a <section> just as well (see the
  // header): this band names nothing on purpose, so a caller's name would
  // invent the region it refuses. React 19 carries `ref` inside these props,
  // so it needs no mention of its own (§6.8).
  Omit<
    ComponentPropsWithRef<'section'>,
    | keyof TeamRosterOwnProps
    | 'children'
    | 'title'
    | 'aria-label'
    | 'aria-labelledby'
  >;

/** The auxiliary grid's tracks (D9) — the FLOOR, not the count: the number of
 *  columns falls out of the column width, and the 16rem minimum is the one
 *  PersonnelCard D5 needs at every width. The header has the measured table
 *  and the recorded departure from `AuxiliaryTiles`. */
const AUXILIARY_GRID =
  'grid gap-6 grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]';

export function TeamRoster({
  members,
  className,
  ...rest
}: TeamRosterProps): ReactElement | null {
  // Nothing to show, nothing painted (the header's list paragraph).
  if (members.length === 0) return null;

  return (
    // BAND OUTER: the semantic element, full-bleed, owning the paint and
    // nothing else. No name of any kind — the three resets ride AFTER the
    // spread, so nothing that dodged the Omit can name it (see the header);
    // className is merged caller-last (§6.8).
    <section
      {...rest}
      aria-label={undefined}
      aria-labelledby={undefined}
      title={undefined}
      className={cx('bg-page', className)}
    >
      <Container>
        {/* The rhythm box — the band-owned `py` on container steps (§6.4: the
            section owns ALL child spacing; the tiles own no margin at all). */}
        <div className="py-12 @lg:py-16 @3xl:py-20">
          <ul role="list" className={AUXILIARY_GRID}>
            {members.map((member) => (
              <li key={member.id}>
                <PersonnelCard
                  kind="auxiliary"
                  headingLevel={2}
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
