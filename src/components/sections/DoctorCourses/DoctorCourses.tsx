import { useId, type ComponentPropsWithRef, type ReactElement } from 'react';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import { Container } from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx/cx';
import { CourseTimeline } from './CourseTimeline';

// sections/DoctorCourses — the doctor page's „Formare continuă / Cursuri și
// specializări" band: an eyebrow over an <h2>, then the doctor's courses in
// sub-sections by YEAR, newest first — a bold year over the bulleted lines
// of that year — hung on a CV TIMELINE: one vertical line down the left, a
// dot on it per year, and the ONE year the visitor is reading lit while every
// other rests grey. Built to the round-2 composition contract of the
// doctor-pages run (.claude/section-runs/2026-09-21_11-58_doctor-pages/
// round2, unit R4), reshaped into the timeline by that round's contract R6
// (round 2e), given its line on the left and its lit year by contract R10
// (round 2g), and its larger years, doubled gaps and forward-coming current
// subsection by builder A5 (round 2j, D44); the D-numbers cited below are
// that run's ledger decisions and are the anchors other files quote (§17.7 —
// never a line number).
//
// Owner's brief, verbatim: "organised in a form of sub-sections, each
// sub-section having just the heading without eyebrow with the year and then
// in each sub-section with dot as they are now the courses. The year headings
// have to be in bold and lilac. Maybe they shouldn't even be headings, maybe
// just a larger bold text in lilac could suffice — you decide."
//
// ── D15 · THE YEARS ARE HEADINGS — <h3>s, the owner's open question closed.
// A year is the LABEL of the list beneath it, which is exactly what a heading
// is; a screen-reader user's H key then stops on every year, and the outline
// reads page <h1> (the doctor's name, sections/DoctorIntro) → this band's <h2>
// → one <h3> per year, one level at a time, no gaps (§9). A larger bold <p>
// would LOOK identical and mean nothing: the structure a sighted visitor gets
// from the lilac would be invisible to everyone else. The sub-section has no
// eyebrow, as the owner asked — which is also why it is ui/Heading and not a
// second sections/SectionHeading (that opener exists to pair an eyebrow with a
// title; a year alone is the atom's job).
//
// ── D16 · THE INK IS THE ATOM'S — `tone="accent"`, never a className. The
// "bold and lilac" ships as ONE row of ui/Heading's tone table (`font-bold
// text-accent-decorative`), added for this band and argued in Heading.tsx's
// header: the accent is 4.44:1 on the page ground, large-text contrast only
// (§15.1), so the weight and the colour travel together inside the atom and
// no call site can split them. Handing the colour in through className
// instead would be the restyle §6.8 bans. Since round 2g the lilac is the LIT
// year's only (D35): a resting year wears the tone's twin `accent-idle` (the
// same bold in ink-muted), and the island (./CourseTimeline) switches between
// the two. Since round 2j (D44a — "years have to be at least the size of what
// is now current heading") the years sit on the `section` step, 30px — the
// step the band's own title used to wear — large text by size alone, where
// round 2g's 20px `title` step was large only by its bold.
//
// ── DUMB, PROPS-IN, ZERO KEYS — the PriceList/Hero/DoctorProfile shape (the
// round-1 ledger's D1). Every string that arrives here is FINISHED: the page
// groups lib/team's course rows by year for ONE language (`coursesByYear`,
// D17) and hands the groups over already ordered. There is no t(), no message
// key, no `Locale` and no import of lib DATA; this file could not tell
// Romanian from German if it tried, which is what lets Storybook review it at
// every width on invented courses before the real doctors are written.
//
// ── `year` IS A STRING ON PURPOSE. A year is a LABEL, not a quantity: run
// through `Intl.NumberFormat` — the §8.3 tool for numbers — Romanian and
// German print „2.024", English „2,024" and French „2 024" (measured), a
// thousands separator no one writes in a year. So the page hands it over
// finished (`String(year)`, the data's number made text once, at the one
// populator) and the band prints it verbatim; a `number` prop would invite
// exactly the formatting that breaks it.
//
// ── THE KEYS. A group is keyed by its year: `coursesByYear` folds every row
// of one year into ONE group, so a doctor's years are unique by construction.
// A line is keyed by its own text: finished, distinct sentences from a data
// module (tests/unit/team-data.test.ts pins them unique per doctor and
// locale), and an index key would survive a reorder by silently re-labelling
// every bullet. A group always carries at least one line for the same
// reason — it exists only because a row of that year does — so this band
// prints no "empty year" branch; an empty `courses` would be a populator bug
// and would show as a year over nothing.
//
// ── EMPTY `groups` RENDERS NOTHING — `null`, no landmark, no heading. A doctor
// with no courses yet has no band: an empty region titled „Cursuri și
// specializări" would be an announcement of nothing. The early return sits
// AFTER `useId()`, never before it: hooks run in the same order on every
// render (the Rules of Hooks), and a hook skipped by an early return is the
// kind of bug that only shows up the day the data changes.
//
// ── D28 → D34 · THE TIMELINE, AND WHERE ITS LINE RUNS. Round 2e (the
// owner's pack verdict of 2026-09-25: "make the part with the cv more like
// you know those things like in a cv with a timeline. like central a line
// with a line. dots at year left and right alternatively") hung the years on
// a CENTRAL line from the Container's `@3xl` step, alternating left and
// right of it, one column with the line down the left below the step. Round
// 2g struck the alternation on the owner's next word — "now that i think
// about it, the line should be on the left side, not centered" — so the
// left-hand recipe that used to be the phone's is now the ONLY recipe, at
// every width, and the even/odd parity is gone with it (D34). The rail also
// gained `max-w-4xl`, DoctorProfile's prose measure, because one column at
// the laptop width would otherwise run a course line ~1200px. D15's first
// shape (two years per row in a grid) and D28's are history.
// The rail, its line, the dots and the lit year now live in ./CourseTimeline
// — its header carries the geometry (the line's centre = the dot's centre,
// the stretches, `top-3`, the doubled `gap-20`) and the states; this file
// renders it and nothing of it.
//
// ── D35 · ONE ISLAND, THE TIMELINE (round 2g — "upon scrolling highlight top
// dot with year and dots … all are grayed out at rest … the current should
// have a non grayed out jump at you animation"). WHICH year is lit depends on
// where this visitor has scrolled, which only a browser knows, so the rail
// and its groups cross into ./CourseTimeline, a client island on
// lib/scroll-spy (the price menu's mechanic, its second consumer). This file
// stays a SERVER component: the <section>, its name, the eyebrow and the
// <h2> are identical for every visitor and compile to inert HTML (§16). What
// crosses is `groups` alone, exactly as this band received it — finished
// strings, no class name, no callback (CourseTimeline's WHAT CROSSES THE
// BOUNDARY). The island's server render is the rest state, all grey, so the
// static HTML of every doctor page carries no lit year (§16 rule 2). Round
// 2j (D44c) reworked the LOOK of the two states — the current subsection
// comes forward whole, its stretch of line with it, the others fade — and
// left the mechanic exactly as it was; CourseTimeline's TWO STATES paragraph
// carries both. Round 2k moved the mechanic's line to the MIDDLE of the
// window (D49 — a year lights as its top crosses it) and broke the line a
// quarter rem above every dot (D50); CourseTimeline's MECHANIC and RAIL
// paragraphs carry those.
//
// ── THE STEPS, MEASURED ON ui/Container's COLUMN (§6.5 — a section measures
// its own box, never the window; no media query anywhere in this band). The
// owner's adaptability rule (D21) holds trivially now: nothing stands side by
// side at any width, so nothing has to stack.
//   · at every width — ONE column: the line down the left edge, every year
//     under the last, each group as wide as the rail with its words 40px in
//     from the line (the phone at 312px of column, the tablet at 614px);
//   · `@lg` (32rem of column, ≈ a 640px viewport) — the second rhythm step,
//     `py` and the rail's top margin opening up;
//   · `@3xl` (48rem of column, ≈ a 960px viewport) — the third, the same
//     step DoctorProfile and ClinicLocation draw their splits at; the rail
//     reaches its 56rem cap soon after (the column is 80 % of the viewport
//     between the gutters, so at a ~1120px one), and from there on a course
//     line wraps at ~836px of text (56rem less the group's 40px and the
//     list's 20px) instead of the laptop column's full ~1230.
//
// ── THE LIST IS DoctorProfile's ROUND-1 RECIPE — `list-disc ps-5`, the
// owner's "with dot as they are now" — its lines in `ink` in both states
// since round 2j (D44c): a resting year's lines are greyed by their group's
// 0.65 fade (4.64:1 on the page ground, still body-text contrast — the
// island's CONTRAST paragraph has the arithmetic), the current year's are the
// same ink at full opacity (14.1:1) with its bullets in the accent, a graphic
// adjunct inside §15.1's charter. The
// lines stay `text-lg`, the §15.1 1.125rem body base: reading text for §1's
// older visitor, not a caption. `role="list"` is belt-and-braces here (the
// G2-R2 tier-2 a11y review): WebKit drops list semantics from a
// list-style-less list, which Tailwind's preflight makes of every <ul>, but
// `list-disc` restores the `list-style-type`, so WebKit keeps these
// semantics anyway; the role keeps them independent of the bullets, and it is
// load-bearing on DoctorStats' and TeamRoster's bullet-less lists
// (eslint.config.mjs configures the `no-redundant-roles` exception). The
// recipes live in ./CourseTimeline.
//
// ── PROSE STAYS START-ALIGNED with no override anywhere in this band (§15.15
// b, the text-align board): globals.css's `p, li, blockquote` fence is the
// whole rule. The body's site-wide `hyphens: auto` (§15.14) is INHERITED and
// left alone — course lines are prose, not control labels, so a German
// compound may break at a syllable rather than push the column open.
//
// ── THE BAND'S OWN SHAPE IS ui/Container's PAGE-BAND RECIPE (the standing law
// in Container.tsx's header): the semantic full-bleed <section> owns the paint
// (`bg-page`) and nothing else — no gutter, no outer margin, because the page
// owns the rhythm BETWEEN bands (§6.4, D18/D33: this band follows
// DoctorProfile's fade-out and precedes DoctorStats' fade-in). The
// Container inside owns the width and the container-query context; the stepped
// `py` sits on the rhythm box one level in, because an element cannot query
// its own size (ClinicLocation's spelling, and DoctorIntro's).
//
// ── A NAMED REGION: the `id` lands on the <h2>, which names the <section>
// through `aria-labelledby`. It comes from useId() rather than a hard-coded
// constant: one of this band exists per doctor page today, but a page that
// ever lists two would collide, and useId is server-safe and hydration-stable.
// `{...rest}` rides FIRST so a caller's stray attribute can never replace the
// name pair; `className` merges caller-last (§6.8).
//
// ── THIS FILE IS NOT THE ISLAND (§16). No 'use client', no state, no ref of
// its own, no handler: useId is the only hook, and it is server-safe. The
// band's shell compiles into the doctor page's static HTML; the JavaScript it
// ships is ./CourseTimeline's alone (D35 above). DoctorCourses.test.tsx pins
// this file's directive's absence, the one prop that crosses and the whole
// import surface from the source text, because no runtime assertion can see
// any of them.

/** One year and its finished lines — grouped and translated by the page (run
 *  D1), newest year first. `year` is a LABEL, already a string (see the
 *  header): the band prints it verbatim and formats nothing. Strings only,
 *  because the groups cross into the client island (./CourseTimeline). */
export type CourseGroup = Readonly<{
  /** The year as finished text — „2024", never a number to be formatted. */
  year: string;
  /** That year's course lines, finished and distinct, in the data's order. */
  courses: readonly string[];
}>;

type DoctorCoursesOwnProps = Readonly<{
  /** The mono micro-label over the title, finished text (§8.1). */
  eyebrow: string;
  /** The band's <h2> — and, through aria-labelledby, the region's name. */
  title: string;
  /**
   * The year groups, newest first — the page's order, printed as given.
   * EMPTY renders nothing at all: no region, no heading (see the header).
   */
  groups: readonly CourseGroup[];
}>;

export type DoctorCoursesProps = DoctorCoursesOwnProps &
  // The native <section> surface, minus the band's own names and minus
  // `children` (content arrives as `groups`; without the Omit a caller could
  // nest something, type-check, and watch it vanish — the SectionHeading
  // precedent). `title` leaves the native side with the own props: it is a
  // real HTML attribute (a tooltip), and the two meanings would otherwise
  // intersect into something that is neither. The two ARIA naming attributes
  // leave too: the band's name is its <h2>'s text ALONE, and a caller's pair
  // would land after the component's own and silently replace it. React 19
  // carries `ref` inside these props, so it needs no mention of its own (§6.8).
  Omit<
    ComponentPropsWithRef<'section'>,
    keyof DoctorCoursesOwnProps | 'children' | 'aria-label' | 'aria-labelledby'
  >;

export function DoctorCourses({
  eyebrow,
  title,
  groups,
  className,
  ...rest
}: DoctorCoursesProps): ReactElement | null {
  // Hooks first, the early return after (the header's EMPTY paragraph).
  const headingId = useId();

  if (groups.length === 0) return null;

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
        {/* The rhythm box — band-owned `py` on container steps (see the
            header for why it cannot sit on Container itself). */}
        <div className="py-12 @lg:py-16 @3xl:py-20">
          <SectionHeading
            level={2}
            id={headingId}
            eyebrow={eyebrow}
            title={title}
          />
          {/* THE TIMELINE — the ONE island (D35): the rail, its line on the
              left (D34) and the year groups, with the year being read lit.
              `groups` crosses as given, strings only, and nothing else does
              (the header's D35 paragraph). */}
          <CourseTimeline groups={groups} />
        </div>
      </Container>
    </section>
  );
}
