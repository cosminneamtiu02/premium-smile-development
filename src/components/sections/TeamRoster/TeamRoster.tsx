import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import {
  PersonnelCard,
  type PersonnelActions,
  type PersonnelPhoto,
} from '@/components/sections/PersonnelCard/PersonnelCard';
import { Container } from '@/components/ui/Container/Container';
import { Heading } from '@/components/ui/Heading/Heading';
import { cx } from '@/lib/cx/cx';

// sections/TeamRoster — the Team page's ONE band: the page's title, the
// doctors under it with their sides alternating, and the auxiliary personnel
// in a grid below them. Built to the owner-approved N2 composition contract of
// the doctor-pages run (.claude/section-runs/2026-09-21_11-58_doctor-pages,
// unit 7); the D-numbers cited below are that run's ledger decisions and are
// the anchors other files quote (§17.7 — never a line number).
//
// Owner's brief, verbatim: "build personnel page as simple as possible as it
// is now in team composition and add at the end the map so i can test how it
// goes back and forth on the page" — the map is the PAGE's (ClinicLocation
// after this band), so this file is the first half of that sentence and
// nothing else.
//
// ── NO OLD COUNTERPART, AND NO NEW DESIGN EITHER. The run's old-repo survey
// found no team page there at all (a `/$lang/team` route lived briefly and was
// deleted in 244192f), so §17.2 is satisfied by absence — and the SHAPE was
// already drawn in this repo: PersonnelCard.stories.tsx's `TeamComposition`
// story, "what the Team band will actually stack: two doctors alternating
// sides, then the auxiliary grid under them, one 24px rhythm all the way
// down". This band is that frame turned into a component, which is why the
// story's own play (five articles, two blockquotes, four links) reads almost
// word for word like this suite's.
//
// ── D1 · DUMB, PROPS-IN, ZERO KEYS — the PriceList/Hero/DoctorIntro shape
// (run D1). Every string that arrives here is FINISHED: translated, formatted,
// in one language. There is no t(), no message key, no `Locale`, and no import
// of lib DATA (no lib/team, no lib/clinic, no lib/routes) — the one lib
// specifier is lib/cx. lib/image-path's TYPE, imported here on 2026-09-21,
// left on 2026-09-26 (G2-R2 typescript F4): the portrait's shape is now
// PersonnelCard's own `PersonnelPhoto`, which carries `ImagePath` inside it.
// Not one hook either, not even useId — this band names nothing, so it needs
// no generated id (see the next paragraph). `app/[locale]/team/page.tsx` is
// the ONE populator; this file could not tell Romanian from German if it
// tried, which is exactly what lets Storybook review it at every width on
// invented people before the real team is written (§15.17).
//
// ── THE BAND NAMES NOTHING, ITSELF INCLUDED — the Services precedent, reached
// again from the doctor page's side by DoctorIntro. The only heading in this
// band is the PAGE's <h1>, so naming the <section> by it would announce the
// title twice (once as a region, once as the heading) over a boundary <main>
// already draws. The root is therefore a generic box with no `role`, no
// `aria-label` and no `aria-labelledby` — and those two attributes are OMITTED
// from the props rather than merely left unused, because a caller's name would
// create exactly the region this band refuses (the ui/Modal and PersonnelCard
// precedent for refusing a naming attribute by type).
//
// ── THE TITLE IS THE PAGE'S <h1>, AND THIS BAND OWNS IT. `Heading
// size="hero"` — THE ONE h1 STEP every page shares since 2026-09-26 (owner:
// "all headings and eyebrows app wide … the same size as they are on the
// [doctor] page", CLAUDE.md §15.24): the fluid clamp sections/Hero and
// DoctorIntro wear, 32 → 72px with the viewport. Until then this h1 wore the
// `page` step (text-4xl — the 404 band's 36px) on the argument that a
// roster's title is a label rather than a stage; the owner's rule — one size
// per outline level, the doctor page's — supersedes it. Worn through
// `asChild` onto a REAL <h1>, because the atom answers "how big is this
// title" and never "which element is it" (ui/Heading's own header).
// `hyphens-none` on the h1: the site-wide `hyphens: auto` (§15.14) is for
// PROSE, and a page title may wrap between words but never break at a
// syllable. No eyebrow above it and no sub-headings anywhere below (D10, the
// owner's "as simple as possible"): the outline is h1 → ONE h2 PER PERSON.
// THE CARDS ARE HANDED `headingLevel={2}` (both lists): with the sub-headings
// struck, a card's default level-3 title would sit directly under the page's
// <h1> and skip a level — §9's "logical heading order", and axe's
// heading-order rule fired on every story of this band before the prop
// existed. That is the trigger PersonnelCard D4 recorded, fired in its
// inverted form on this run (2026-09-21): the prop is ADDITIVE, default 3, so
// every other placement (a card under a band's own h2) keeps the default.
// The rejected alternatives: switching the rule off for this band's stories
// (a finding hidden, not resolved), or growing the two sub-headings D10 struck
// (two keys ×5 and the owner's "as simple as possible" reversed).
//
// ── D10 · TWO LISTS, IN THE ORDER THE OWNER NAMED, AND NEITHER IS TITLED.
// Doctors first, auxiliary personnel after them — the `TeamComposition` order.
// `role="list"` rides on both <ul>s: redundant in the spec, load-bearing in
// WebKit, which drops list semantics from any `list-style: none` list (the
// ui/SpeedDial precedent — configured as an exception in eslint.config.mjs's
// `jsx-a11y/no-redundant-roles` options, so the lint gate expects it here).
// An EMPTY list is not rendered at all: a `<ul>` with no children announces
// "list, 0 items" and photographs as a hole in the rhythm, and a clinic with
// no auxiliary personnel yet is a real state the populator can produce.
//
// ── SIDES ALTERNATE BY INDEX — `i % 2 === 0 ? 'start' : 'end'`, which is
// PersonnelCard D7's VISUAL-ONLY mirror: the columns swap, the DOM order never
// does (block → quote → actions in both), so a screen reader and the stacked
// phone layout read every card in the same sequence. The rhythm is the point
// (the owner's shape, via `TeamComposition`), and it is computed rather than
// authored so a doctor added to lib/team cannot break it by arriving with the
// wrong `side` in the data.
//
// ── D9 · THE AUXILIARY TRACKS ARE `repeat(auto-fit, minmax(16rem, 1fr))`, AND
// THAT IS A DELIBERATE DEPARTURE FROM `AuxiliaryTiles`. PersonnelCard.stories'
// helper calls its two lines "the two lines [the page] must copy exactly", and
// this band does not copy them: `@md:grid-cols-2 @3xl:grid-cols-3` divides the
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
// a roster (the row stays centred and full), and it is also why the auxiliary
// cards keep their own centred portrait column: a wide track is a wide card,
// never a wide portrait. `auto-fill` — holes instead — is the one-word change
// if the owner ever wants the tracks pinned.
// sections/DoctorProfile keeps FIXED tracks for the opposite reason: it always
// holds exactly two cells of two different kinds, the prose and the schedule
// card, sized 4 : 1 over a floor, which an auto-fit track list cannot express.
//
// ── `h-full` ON THE AUXILIARY CARDS ONLY. A grid item is stretched by default
// while the <article> inside it is an ordinary block, so without the class a
// taller neighbour lifts the <li> and leaves the shorter card's surface
// hanging short (the AuxiliaryTiles reasoning, G2 react). The doctors' list is
// a flex COLUMN — one card per row, each as tall as its own words — so there
// is nothing to equalise and the class would say nothing. §6.8 placement in
// both readings: it rides the caller-slot className and never restyles an
// atom's insides.
//
// ── THE BAND OWNS ALL THE SPACING (§6.4) AND THE CARDS OWN NONE. `gap-8`
// between the three blocks (title · doctors · auxiliaries), `gap-6` inside
// each list — the 24px rhythm `TeamComposition` photographed. The shape is
// ui/Container's PAGE-BAND RECIPE (the standing law in Container.tsx's
// header): the semantic full-bleed <section> owns the paint (`bg-page`) and
// nothing else — no gutter, no outer margin, because the PAGE owns the rhythm
// BETWEEN bands and the map comes after this one — and the Container inside
// owns the width and the container-query context. The stepped `py` cannot ride
// on Container itself (an element cannot query its own size), so it sits on
// the rhythm box one level in, ClinicLocation's spelling exactly.
//
// ── THE DOCTORS' WORDS ARRIVE ALREADY RENDERED. `about` is a ReactNode, so
// this band never sees a `<k>` mark or imports ui/Keyword: run D2 splits the
// source in `lib/team` and the page's populator turns the segments into
// fragments through `<Keywords>` before they reach these props (§8.1 — a
// consumer's fragments are finished by the time a section receives them).
// PersonnelCard D9 says the same from one tier down.
//
// ── `id` IS THE REACT KEY, and deliberately nothing else. PersonnelCard's
// native spread (its D10) would carry an `id` onto the <article> for a band
// whose page links at one card; here the cards are spelled prop by prop and no id
// reaches the DOM — this page's per-doctor link is a ROUTE (`/{locale}/team/
// {id}/`, run D3) that the populator has already built into each card's
// profile action, so a fragment anchor would be a second, weaker way to the
// same person. TRIGGER, recorded so the next lane can tell "not decided" from
// "decided no": the first consumer that wants `/{locale}/team/#elena-marin`
// spreads the id onto the card through that same native spread.
//
// ── ISLANDS (§16). No 'use client' in this file: no state, no handler, not
// one hook, so the band compiles into the Team page's static HTML. The ONE
// cost, stated rather than discovered: each PersonnelCard's portrait brings
// ui/Image's small client island with it (PersonnelCard D11) — accepted there,
// unchanged here. TeamRoster.test.tsx pins the directive's absence and the
// whole import surface from the source text, because no runtime assertion can
// see either.

/**
 * One doctor's card (PersonnelCard's `doctor` kind, finished): the words are
 * already rendered and the two links already locale-prefixed by the page.
 */
export type TeamRosterDoctor = Readonly<{
  /** Stable identity in the populator's data — this band uses it as the React
   *  key and nothing else (see the header's `id` paragraph). */
  id: string;
  /** The full name, finished text (§8.1) — becomes the card's <h2>: this band
   *  passes `headingLevel={2}` so every name sits directly under the page's
   *  h1 (D10). */
  name: string;
  /** The specialisation, finished text — the card's all-caps eyebrow. */
  position: string;
  /** The portrait: a path under public/images/ (lib/image-path's `ImagePath`,
   *  so a file outside the one folder the export optimizer scans cannot
   *  compile) plus its INTRINSIC pixel size, which is the optimizer's srcset
   *  input and the reserved box (§11). The TYPE is the card's own
   *  `PersonnelPhoto`, imported rather than re-spelled (G2-R2 typescript F4),
   *  so the two shapes can never drift apart: a field the card's photo gains —
   *  its recorded RE-OPEN TRIGGER, an optional `alt` — reaches this band and
   *  its populator in the same change-set instead of being silently dropped,
   *  which a narrower local copy would do without a compile error. */
  photo: PersonnelPhoto;
  /** The doctor's own words, ALREADY rendered — ui/Keyword fragments inside,
   *  quotation marks outside (they are CSS, PersonnelCard D8/D9). */
  about: ReactNode;
  /** The two calls to action under the words — REQUIRED on this kind
   *  (PersonnelCard D15 / run D5). The TYPE is imported from the card, like
   *  `photo` above, so the two shapes can never drift apart. */
  actions: PersonnelActions;
}>;

/**
 * One member of the auxiliary personnel (PersonnelCard's `auxiliary` kind):
 * the portrait column alone, with no quote and no links to give.
 */
export type TeamRosterMember = Readonly<{
  /** Stable identity in the populator's data — the React key (see above). */
  id: string;
  /** The full name, finished text (§8.1) — becomes the card's <h2>: this band
   *  passes `headingLevel={2}` so every name sits directly under the page's
   *  h1 (D10). */
  name: string;
  /** The position, finished text — the card's all-caps eyebrow. */
  position: string;
  /** The portrait: the card's own `PersonnelPhoto`, the doctors' rule one type
   *  up — imported, never re-spelled, so the two shapes cannot drift apart. */
  photo: PersonnelPhoto;
}>;

type TeamRosterOwnProps = Readonly<{
  /** The Team page's own <h1>, finished text (§8.1). Visible — this band has
   *  no eyebrow and no sub-headings above or below it (D10). */
  title: string;
  /** The doctors, in the order they should read; sides alternate by index. */
  doctors: readonly TeamRosterDoctor[];
  /** The auxiliary personnel, in the order they should read. */
  members: readonly TeamRosterMember[];
}>;

export type TeamRosterProps = TeamRosterOwnProps &
  // The native <section> surface, minus the band's own names and minus
  // `children` (content arrives as `doctors`/`members`; without the Omit a
  // caller could nest something, type-check, and watch it vanish — the
  // SectionHeading precedent). The two ARIA naming attributes leave too, and
  // for this band that is the STRONGER of the two rules: it names nothing on
  // purpose (see the header), so a caller's name would invent a region around
  // the page's own <h1>. React 19 carries `ref` inside these props, so it
  // needs no mention of its own (§6.8).
  Omit<
    ComponentPropsWithRef<'section'>,
    keyof TeamRosterOwnProps | 'children' | 'aria-label' | 'aria-labelledby'
  >;

/** The auxiliary grid's tracks (D9) — the FLOOR, not the count: the number of
 *  columns falls out of the column width, and the 16rem minimum is the one
 *  PersonnelCard D5 needs at every width. The header has the measured table
 *  and the recorded departure from `AuxiliaryTiles`. */
const AUXILIARY_GRID =
  'grid gap-6 grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]';

export function TeamRoster({
  title,
  doctors,
  members,
  className,
  ...rest
}: TeamRosterProps): ReactElement {
  return (
    // BAND OUTER: the semantic element, full-bleed, owning the paint and
    // nothing else. No name of any kind (see the header); className is merged
    // caller-last (§6.8).
    <section {...rest} className={cx('bg-page', className)}>
      <Container>
        {/* The rhythm box — band-owned `py` on container steps, and the 32px
            column the three blocks stand in (§6.4: the section owns ALL child
            spacing; the cards own no margin at all). */}
        <div className="flex flex-col gap-8 py-12 @lg:py-16 @3xl:py-20">
          <Heading size="hero" asChild>
            <h1 className="hyphens-none">{title}</h1>
          </Heading>
          {doctors.length > 0 && (
            <ul role="list" className="flex flex-col gap-6">
              {doctors.map((doctor, index) => (
                <li key={doctor.id}>
                  <PersonnelCard
                    kind="doctor"
                    headingLevel={2}
                    side={index % 2 === 0 ? 'start' : 'end'}
                    name={doctor.name}
                    position={doctor.position}
                    photo={doctor.photo}
                    about={doctor.about}
                    actions={doctor.actions}
                  />
                </li>
              ))}
            </ul>
          )}
          {members.length > 0 && (
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
          )}
        </div>
      </Container>
    </section>
  );
}
