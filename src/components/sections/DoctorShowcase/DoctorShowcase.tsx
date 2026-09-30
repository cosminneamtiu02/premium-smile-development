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
import { Container } from '@/components/ui/Container/Container';
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
// day — and are the anchors other files cite (§17.7 — never a line number).
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
// (the drop-in's, `--ribbon-k` + 1rem) and its TAIL room under the last
// (60px + 1rem) — ui/Ribbon's TWO BOXES — and that room IS this band's air.
// The usual `pb` on top of it would double it; a `gap` would push the drop-in
// away from the title it falls from. The stepped `pt` sits on the rhythm box
// one level in, because an element cannot query its own size (the
// DoctorCourses / ClinicLocation spelling, ui/Container's recipe rule 3).
//
// ── D5 · SIDES ALTERNATE BY INDEX — `start`, `end`, `start`, … — because the
// ribbon mirrors every second card and its long side wave runs down the side
// of the picture's column (ui/Ribbon's stand-in column, Ribbon.fixtures.tsx,
// alternates exactly so, and the owner approved the ribbon over it). The
// mirror is PersonnelCard's visual-only one (its D7): the DOM order of every
// card is unchanged, so reading and focus order never move. Which way a card
// faces is the band's decision, never the data's: `DoctorShowcaseDoctor` has
// no `side`.
//
// ── D6 · HEADING LEVELS. The band's title is an <h2> (SectionHeading's
// default level, at its `band` step), each doctor's name an <h3>
// (`headingLevel={3}`) — the outline reads page <h1> → this band's <h2> → one
// <h3> per doctor, one level at a time on both pages (§9). The card keeps the
// name's `band` size at both levels (PersonnelCard D17), so the level is the
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
// 226 × 302 on a 390 phone, 288 × 384 at 1280 and 1920, still the LCP at
// 1366 × 633 — and it shipped lazy, with no `fetchpriority` and no preload
// link. On Home the band sits under the Hero, the first cutout at y ≈ 1103,
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
// ── FIDELITY (§6.8). The remaining native props and `ref` land on the
// <section>; a caller's className merges LAST (placement only). The band owns
// no outer margin (§6.4) — the page owns the rhythm BETWEEN bands. Its own
// shape is ui/Container's page-band recipe: the semantic full-bleed <section>
// owns the paint (`bg-page`), the Container inside owns the width and the
// container-query context.

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
            head and tail room are the band's air (D4). */}
        <div className="flex flex-col pt-12 @lg:pt-16 @3xl:pt-20">
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
