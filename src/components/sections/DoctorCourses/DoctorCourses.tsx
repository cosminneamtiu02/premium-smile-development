import { useId, type ComponentPropsWithRef, type ReactElement } from 'react';
import { SectionHeading } from '@/components/sections/SectionHeading/SectionHeading';
import { cx } from '@/lib/cx/cx';
import { CourseTimeline } from './CourseTimeline';

// sections/DoctorCourses — the doctor page's „Repere din drumul meu spre
// specializare / Cursuri și specializări" block (its eyebrow „Formare
// continuă" until 2026-10-13, round 7's rename): an eyebrow over an <h2>,
// then the doctor's courses as
// a rail of IDEAS — one dot per course on a line down the left — lit ONE BY
// ONE, automatically, by ./CourseTimeline. Since 2026-10-13 (CLAUDE.md §15.23
// round 7) it is a BLOCK, not a band: sections/DoctorProfile composes it in
// the right-hand column of its band, beside the biography, and owns every
// band-shaped thing this file used to own (A BLOCK, NOT A BAND, below).
// Rounds 2e–2k's scroll-driven timeline of YEARS is history — CLAUDE.md
// §15.23; the doctor-pages run's ledger (.claude/section-runs/
// 2026-09-21_11-58_doctor-pages/) keeps its D-numbers, and the ones still
// cited in this folder name the parts of that shape that survive (§17.7 —
// anchors, never line numbers).
//
// Owner's brief, 2026-10-13, verbatim: "this section would have biography as
// text on the left and on the right the courses and specialisations … there
// wont be any more years on the courses and specialisaation … no year
// anymore. jsut dot ideas, and each section will be jsut one dot, so an
// idea, a single idea per section of the current thing with the cv but with
// no years. and they have to circle automatically through the ideas and
// highlight them one by one. so the scrolll highiight has to be automatic
// now. and maybe half the space that is now between higlihhted and non
// highlighted section."
//
// ── ONE IDEA PER DOT, AND NO YEAR. Each item is one course line — one idea,
// one dot, one <li> — in the order the page hands them over: lib/team's own
// order of the doctor's course rows, flattened for one language by the
// page's populator, the year that used to label each group gone from the
// screen ("no year anymore"). The block prints the list as given and never
// sorts: an order of its own would be a second opinion about the data. The
// <h3> each year used to be went with the years — an idea is a list item,
// not a heading — so the outline under this block's <h2> is one list.
//
// ── DUMB, PROPS-IN, ZERO KEYS — the PriceList/Hero/DoctorProfile shape (the
// round-1 ledger's D1). Every string that arrives here is FINISHED: there is
// no t(), no message key, no `Locale` and no import of lib DATA; this file
// could not tell Romanian from German if it tried, which is what lets
// Storybook review it at every width on invented courses before the real
// doctors are written.
//
// ── EMPTY `items` RENDERS NOTHING — `null`, no landmark, no heading. A doctor
// with no courses yet has no block: an empty region titled „Cursuri și
// specializări" would be an announcement of nothing. The early return sits
// AFTER `useId()`, never before it: hooks run in the same order on every
// render (the Rules of Hooks), and a hook skipped by an early return is the
// kind of bug that only shows up the day the data changes.
//
// ── A BLOCK, NOT A BAND (2026-10-13). The owner's new page is DoctorIntro →
// DoctorStats → DoctorProfile → ClinicLocation, and the courses stand on the
// RIGHT of the biography inside DoctorProfile's one band. So DoctorProfile
// owns what this file owned while it was a band of its own: the full-bleed
// <section> on the page ground, ui/Container, the rhythm `py`, ui/Container's
// band-scale strings (this block is drawn in the design pixel on a laptop or
// desktop because it stands inside DoctorProfile's rhythm box, never because
// it wears the scale itself) and THE BELT that trims the lit idea's forward
// overshoot at the screen's edge (./CourseTimeline's THE FORWARD MOTION).
// What stays here is §4's props-in shared composition: a named region, its
// opener and its list. Its own box is a flex column with `gap-6` — 24px
// between the opener and the list, the same 24px the biography region beside
// it puts between its opener and its paragraphs, so the two columns start
// their content the same distance under their headings. No outer margin and
// no width: the band places the block (§6.4).
//
// ── THE RHYTHM, `COURSES_INTERVAL_MS`. §15.18: `intervalMs` is REQUIRED per
// consumer and the site keeps no default, so this consumer's number lives
// here, beside the block's other choices — the Hero keeps HERO_INTERVAL_MS
// and the reviews band REVIEWS_INTERVAL_MS the same way. 3 s a light, the
// planner's number (2026-10-13), and one line to change: a course line of
// six to twelve words reads in 2.5–5 s at the ~150 wpm §15.18's reading-time
// rider assumes, but here the rider does not bind — nothing is hidden when
// the light moves on, so every idea can still be read after it
// (./CourseTimeline's NOT THE APG CAROUSEL). The `intervalMs` prop is for the
// stories and the tests (a short rhythm to watch the cycle by); the page
// passes nothing. The value is READ ONCE, AT MOUNT (ui/use-rotation's
// options rule), and lib/clock refuses anything under 1 ms at construction —
// on the server too, so a bad number fails the build at its call site.
//
// ── ONE ISLAND, THE RAIL (§16). WHICH idea is lit depends on time, which
// only a browser has, so the rail crosses into ./CourseTimeline, a client
// island on ui/use-rotation — the site's third rotator, after sections/Hero
// and the reviews deck. This file stays a SERVER component: the <section>,
// its name, the eyebrow and the <h2> are identical for every visitor and
// compile to inert HTML. What crosses is `items` and `intervalMs`, finished
// strings and one number (CourseTimeline's WHAT CROSSES THE BOUNDARY). The
// island's server render is the NEUTRAL state — nothing lit, nothing faded —
// so the static HTML of every doctor page carries no lit idea (§16 rule 2).
//
// ── PROSE STAYS START-ALIGNED with no override anywhere in this block
// (§15.15 b, the text-align board): globals.css's `p, li, blockquote` fence is
// the whole rule. The body's site-wide `hyphens: auto` (§15.14) is INHERITED
// and left alone — course lines are prose, not control labels, so a German
// compound may break at a syllable rather than push the column open.
//
// ── A NAMED REGION: the `id` lands on the <h2>, which names the <section>
// through `aria-labelledby`. It comes from useId() rather than a hard-coded
// constant: one of this block exists per doctor page today, but a page that
// ever lists two would collide, and useId is server-safe and
// hydration-stable. `{...rest}` rides FIRST so a caller's stray attribute can
// never replace the name pair; `className` merges caller-last (§6.8).
//
// ── THIS FILE IS NOT THE ISLAND (§16). No 'use client', no state, no ref of
// its own, no handler: useId is the only hook, and it is server-safe. The
// block's shell compiles into the doctor page's static HTML; the JavaScript
// it ships is ./CourseTimeline's alone. DoctorCourses.test.tsx pins this
// file's directive's absence, what crosses and the whole import surface from
// the source text, because no runtime assertion can see any of them.

/**
 * The rhythm: 3 s a light (the header's THE RHYTHM). Exported for the tests
 * and the stories; the page passes nothing and gets this default.
 */
export const COURSES_INTERVAL_MS = 3_000;

type DoctorCoursesOwnProps = Readonly<{
  /** The mono micro-label over the title, finished text (§8.1). */
  eyebrow: string;
  /** The block's <h2> — and, through aria-labelledby, the region's name. */
  title: string;
  /**
   * The ideas — one finished, distinct course line per dot, in the page's
   * order, printed as given. EMPTY renders nothing at all: no region, no
   * heading (see the header).
   */
  items: readonly string[];
  /**
   * The rhythm in ms, at least 1 — this consumer's number (§15.18). Defaults
   * to COURSES_INTERVAL_MS; the stories and the tests pass a shorter one.
   * READ ONCE, AT MOUNT.
   */
  intervalMs?: number;
}>;

export type DoctorCoursesProps = DoctorCoursesOwnProps &
  // The native <section> surface, minus the block's own names and minus
  // `children` (content arrives as `items`; without the Omit a caller could
  // nest something, type-check, and watch it vanish — the SectionHeading
  // precedent). `title` leaves the native side with the own props: it is a
  // real HTML attribute (a tooltip), and the two meanings would otherwise
  // intersect into something that is neither. The two ARIA naming attributes
  // leave too: the block's name is its <h2>'s text ALONE, and a caller's pair
  // would land after the component's own and silently replace it. React 19
  // carries `ref` inside these props, so it needs no mention of its own (§6.8).
  Omit<
    ComponentPropsWithRef<'section'>,
    keyof DoctorCoursesOwnProps | 'children' | 'aria-label' | 'aria-labelledby'
  >;

export function DoctorCourses({
  eyebrow,
  title,
  items,
  intervalMs = COURSES_INTERVAL_MS,
  className,
  ...rest
}: DoctorCoursesProps): ReactElement | null {
  // Hooks first, the early return after (the header's EMPTY paragraph).
  const headingId = useId();

  if (items.length === 0) return null;

  return (
    // THE BLOCK: the semantic element, a flex column spacing its opener and
    // its list by the biography's own 24px (the header's A BLOCK, NOT A
    // BAND). `{...rest}` rides FIRST so a caller's stray attribute can never
    // replace the name pair; className is merged caller-last (§6.8).
    <section
      {...rest}
      aria-labelledby={headingId}
      className={cx('flex flex-col gap-6', className)}
    >
      <SectionHeading
        level={2}
        id={headingId}
        eyebrow={eyebrow}
        title={title}
      />
      {/* THE RAIL — the ONE island: the ideas, their dots and their stretches
          of line, lit one by one. `items` and `intervalMs` cross as given,
          strings and a number, and nothing else does (the header's ONE
          ISLAND). */}
      <CourseTimeline items={items} intervalMs={intervalMs} />
    </section>
  );
}
