import type { CourseGroup } from '@/components/sections/DoctorCourses/DoctorCourses';
import type {
  DoctorIntroCredo,
  DoctorIntroPhoto,
} from '@/components/sections/DoctorIntro/DoctorIntro';
import type { DoctorShowcaseDoctor } from '@/components/sections/DoctorShowcase/DoctorShowcase';
import type { TeamRosterMember } from '@/components/sections/TeamRoster/TeamRoster';
import { localeHref } from '@/i18n/href';
import type { Locale } from '@/i18n/locales';
import { formatHoursRows, type HoursRow } from '@/lib/hours/hours';
import {
  auxiliaries,
  coursesByYear,
  doctors,
  splitKeywords,
  type AboutSegment,
  type AuxiliaryMember,
  type Doctor,
  type StatIcon,
} from '@/lib/team/team';

// app/[locale]/team/populate — THE walk from lib/team's people to the finished
// props of the pages that show them — the Team page, every doctor page and,
// since 2026-09-30, the Home page's doctors band — in ONE language. Pure: a
// locale, a couple of callbacks and (for tests) a list go in, plain objects
// come out. JSX-free and
// next-intl-free, no DOM — React reaches it only through the sections' prop
// types it already imports (`DoctorShowcaseDoctor['about']`,
// `DoctorIntroCredo['body']`); the `react` specifier itself is gone (G2-R2
// tier 3, react F3 — by tests/unit/lib-react-free.test.ts' definition a
// type-only `react` import is still a React import, and nothing here needs
// one). The services and home populators' shape (./../services/populate.ts,
// ./../(home)/populate.ts), copied for the same three reasons those files
// argue:
//
//   · THE BANDS ARE DUMB (run ledger D1). sections/DoctorShowcase, TeamRoster,
//     DoctorIntro, DoctorProfile, DoctorCourses and DoctorStats hold zero
//     message keys and import no data; none of them knows what a `Locale` is.
//     Somebody still has to pick the visitor's words, build the link to a
//     doctor's page, cut the `<k>`
//     marks out of a doctor's philosophy, print his week, group his courses by
//     year and pick his numbers' words — and the PAGE is that somebody. This
//     file is the page's arithmetic, lifted out of the JSX.
//
//   · IT CANNOT LIVE IN lib/team, whose return type would then have to name
//     `sections/` types (`DoctorShowcaseDoctor`, DoctorCourses' `CourseGroup`) —
//     the one arrow §4's dependency direction forbids, since the foundation
//     ring is importable BY every tier and imports none of them. Restating
//     those prop shapes inside lib/ instead would give a contract that
//     deliberately has one declaration a second one. (lib/team exports a
//     `CourseGroup` of its own — the year still a NUMBER — and this file
//     imports only its `coursesByYear`, never that type: the name below is
//     the band's, the year a finished string.)
//
//   · IT CANNOT BE INLINE IN THE page.tsx FILES. Each has a KEEP-IN-SYNC
//     story twin beside it (./Team.stories.tsx, ./[slug]/Doctor.stories.tsx,
//     ../(home)/Home.stories.tsx)
//     that must perform the SAME mapping and cannot import an async Server
//     Component (those modules await next-intl/server, which no browser runner
//     executes). A module both import is what keeps each walk written ONCE
//     instead of twinned by hand and left to drift — and ./populate.test.ts
//     then exercises both without rendering anything at all. The doctor
//     page's one step that IS JSX — a stat id becoming its glyph — follows
//     the same argument into a module of its own, ./[slug]/stat-tiles.tsx,
//     because this file builds no element (G2-R2 tier 3).
//
// ── WHY CALLBACKS AND NOT A `t` (run ledger D1's second half). `renderQuote`
// and `closedLabel` are the two places this module would otherwise have to
// know about React and about next-intl:
//   · `renderQuote` receives SEGMENTS, never a string with markup in it — the
//     cutting happens here (lib/team's `splitKeywords`), the rendering in the
//     caller's `<Keywords>` (ui/Keyword). That is what keeps this file JSX-free
//     while the `<k>` marks still become <b> fragments on the page. It renders
//     ONE text in both walks: a doctor's `philosophy` (round 2's D17), which
//     the showcase's card quotes and the doctor page's credo card quotes again
//     (D12) — hence the name; round 1 spelled it `renderAbout` while the
//     quoted field was still called `about`.
//   · `closedLabel` is finished text for lib/hours, which has refused message
//     keys since the Footer first called it (§8.1).
// Both callers reach next-intl through different APIs — `getTranslations` on
// the server, `useTranslations` in the story twin — so a callback is the seam
// both satisfy, and this module needs neither a provider nor a mock to test.
//
// ── NO `TEAM_TITLE_ID` HERE, unlike the services populator. Since 2026-09-30
// the Team page owns its <h1> the way that page does — a bare `sr-only`
// element in the page's markup, the visible opener being the doctors band's
// own <h2> — and on a doctor page the <h1> is DoctorIntro's. Both twins find
// the heading by role and name, which needs no handle and is the stronger
// assertion anyway (§9, §13).
//
// ── THE LIST IS AN ARGUMENT, and lib/team's `findDoctor` is therefore NOT
// called here. It searches the SHIPPED array; the one lookup below searches the
// list it was HANDED, because that argument is this module's test seam — it is
// how ./populate.test.ts hands the walks
// course rows written out of year order, or no courses at all: shapes the real
// data need not hold on the day the suite runs. On the default list the two
// are the same search. Calling the lib helper here would make the `list`
// parameter a lie for the one lookup this file makes.
//
// ── NO ASSISTANTS, AND NO THROW OF ITS OWN (run ledger D13, round 2). Round 1
// resolved each doctor's two assistant ids here for the „Echipa mea" band and
// threw on a dangling or a doubled id; the owner dropped the band, lib/team
// dropped the pair, and both belts left with them. What can still throw on the
// way through is lib/team's `splitKeywords` (an unbalanced `<k>`) and
// lib/hours' formatter (an unknown day) — each naming its own input, each
// already refused in the shipped data by tests/unit/team-data.test.ts, and
// each surfacing HERE UNCHANGED, never caught or reworded: ./populate.test.ts
// feeds both shapes through the `list` seam and pins the libraries' own
// messages (its „lets lib/team’s unbalanced-<k> error surface unchanged",
// once for the showcase walk and once for the doctor walk, and „lets lib/hours’
// unknown-day error surface unchanged"; G2-R2 tier 3, typescript F4). A
// try/catch that quietly printed the raw text instead would turn those three
// red.

/**
 * The two lists a walk reads. Defaulted to the real people, so every shipping
 * caller passes it nothing and only tests pass a fixture (the services
 * populator's `categories` parameter, same purpose).
 */
export type TeamList = Readonly<{
  doctors: readonly Doctor[];
  auxiliaries: readonly AuxiliaryMember[];
}>;

const SITE_LIST: TeamList = { doctors, auxiliaries };

/**
 * Everything a `/{locale}/team/{id}/` page's four content bands need, in one
 * language (run ledger D18, extended by D33: the opener → the tinted band →
 * the courses → the „în cifre" tiles; the map reads lib/clinic itself). Only
 * FACTS ABOUT THE PERSON travel here: every eyebrow and title, and the
 * closed-day word, are the page's own `team.doctor.*` keys (D20), which this
 * module never sees.
 */
export type DoctorPageContent = Readonly<{
  /** sections/DoctorIntro — the cutout, the specialty, the name, and the
   *  credo card's quote (D12): `renderQuote`'s node over the philosophy,
   *  typed as the card's own `body` so no `react` import is needed here. */
  intro: Readonly<{
    name: string;
    position: string;
    photo: DoctorIntroPhoto;
    credo: DoctorIntroCredo['body'];
  }>;
  /** sections/DoctorProfile — the „Despre" paragraphs (D14: plain prose, one
   *  string each) and the schedule card's week, lib/hours' seven rows. */
  profile: Readonly<{
    paragraphs: readonly string[];
    rows: readonly HoursRow[];
  }>;
  /** sections/DoctorCourses — the year groups, newest first, each year a
   *  finished LABEL string (D15, D17). Empty when the doctor has no course,
   *  and the band then renders nothing. */
  courses: readonly CourseGroup[];
  /** sections/DoctorStats — one row per tile (D32), the WORDS in this language
   *  and the drawing as an ID: ./[slug]/stat-tiles.tsx maps it to a glyph
   *  (lib is React-free, the band takes a ReactNode, and this file builds no
   *  element), and the page formats the number and hands the tiles over. */
  stats: readonly DoctorStatContent[];
}>;

/** One stat tile's content for ONE language — lib/team's row with its words
 *  picked; the icon stays an id for the page to draw (D30/D32). */
export type DoctorStatContent = Readonly<{
  icon: StatIcon;
  value: number;
  suffix?: string;
  label: string;
  description: string;
}>;

/**
 * The doctors band's cards for ONE language — sections/DoctorShowcase's
 * `doctors`, on the Home page and on the Team page alike (owner, 2026-09-30):
 * every doctor with his cutout, his quoted philosophy and the ONE link to his
 * own page.
 *
 * Order passes through UNCHANGED — display order is designed in lib/team (its
 * header says so), and the band alternates the cards' sides from the index it
 * receives. Alternation is NOT this function's business: it is a visual mirror
 * the band owns (PersonnelCard D7), and nothing here tells a card which way to
 * face.
 *
 * @param locale the visitor's language, already narrowed by `isLocale` — the
 *   page receives a route `string`, and indexing a `Record<Locale, …>` with an
 *   unchecked string is a cast that type-checks a typo just as happily as a
 *   locale (§15.19's recorded trigger, the services page's precedent).
 * @param profileLabel the button's words, finished text from
 *   `team.showcase.profile`.
 * @param renderQuote one doctor's cut-up philosophy → the node the card
 *   quotes (the card's prop is still called `about` — PersonnelCard's API).
 *   The page hands over ui/Keyword's `<Keywords segments={…} />`; this module
 *   never builds an element (run ledger D1).
 * @param list the people to walk. Defaults to lib/team's own.
 */
export function populateDoctorShowcase(
  locale: Locale,
  profileLabel: string,
  renderQuote: (
    segments: readonly AboutSegment[],
  ) => DoctorShowcaseDoctor['about'],
  list: TeamList = SITE_LIST,
): readonly DoctorShowcaseDoctor[] {
  return list.doctors.map((doctor) => {
    const words = doctor.words[locale];
    return {
      id: doctor.id,
      name: words.name,
      position: words.position,
      // THE CUTOUT — a doctor's one picture (lib/team): the card shows the
      // doctor from the waist up with no background, the file the doctor
      // page's opener shows too (owner, 2026-09-30; PersonnelCard D17).
      photo: doctor.cutout,
      about: renderQuote(splitKeywords(words.philosophy)),
      // THE PROFILE LINK is the route `generateStaticParams` emits for this
      // doctor — `/{locale}/team/{id}/`, run ledger D3 — spelled through the
      // one URL rule (§15.13: prefix, trailing slash, interim base path)
      // rather than concatenated here. It is the card's ONLY link, and the
      // only link to a doctor's page anywhere on the site.
      profile: {
        href: localeHref(locale, `/team/${doctor.id}`),
        label: profileLabel,
      },
    };
  });
}

/**
 * The Team page's auxiliary personnel for ONE language — sections/TeamRoster's
 * tiles, in lib/team's own order.
 *
 * @param locale the visitor's language, already narrowed by `isLocale`.
 * @param list the people to walk. Defaults to lib/team's own.
 */
export function populateTeamRoster(
  locale: Locale,
  list: TeamList = SITE_LIST,
): readonly TeamRosterMember[] {
  return list.auxiliaries.map((member) => {
    const words = member.words[locale];
    return {
      id: member.id,
      name: words.name,
      position: words.position,
      photo: member.portrait,
    };
  });
}

/**
 * One doctor's page for ONE language, or `undefined` when no doctor wears that
 * slug — the page's `notFound()` branch. With `dynamicParams = false` the
 * export never builds an unknown segment, so `undefined` only ever reaches a
 * caller that invented an id (a story, a test, a hand-typed URL in `next dev`).
 *
 * @param locale the visitor's language, already narrowed (see the showcase walk).
 * @param slug the `[slug]` segment — a doctor's `id` in lib/team, which IS the
 *   URL (run ledger D3).
 * @param options `renderQuote` cuts nothing and renders everything (see the
 *   file header); `closedLabel` is the finished „Închis" lib/hours prints on a
 *   day the doctor does not work.
 * @param list the people to walk. Defaults to lib/team's own.
 */
export function populateDoctorPage(
  locale: Locale,
  slug: string,
  options: Readonly<{
    renderQuote: (
      segments: readonly AboutSegment[],
    ) => DoctorIntroCredo['body'];
    closedLabel: string;
  }>,
  list: TeamList = SITE_LIST,
): DoctorPageContent | undefined {
  const doctor = list.doctors.find((row) => row.id === slug);
  if (doctor === undefined) return undefined;

  const words = doctor.words[locale];

  return {
    intro: {
      name: words.name,
      position: words.position,
      // The CUTOUT: the opener stands the subject on the page ground with no
      // card behind him (run ledger D6) — the same file the doctors band's
      // card shows (PersonnelCard D17).
      photo: doctor.cutout,
      // THE CREDO CARD's quote (D12): the SAME philosophy the doctor card
      // quotes, cut here and rendered by the caller, so the two pages can
      // never quote the doctor differently.
      credo: options.renderQuote(splitKeywords(words.philosophy)),
    },
    profile: {
      // The paragraphs pass through FINISHED, in lib/team's order (D14, D17):
      // plain prose, one string per <p>, nothing to cut — a `<k>` in one is
      // refused by tests/unit/team-data.test.ts, never parsed here.
      paragraphs: words.about,
      // THE DOCTOR'S OWN WEEK, through the same formatter that prints the
      // clinic's in the Footer: seven rows, Monday → Sunday, closed days in
      // their calendar place, weekday names from a fixed reference week (so a
      // baseline shot on a Tuesday equals one shot on a Sunday). `locale` is a
      // BCP-47 tag to `Intl` here, which our five plain codes already are.
      rows: formatHoursRows(doctor.hours, locale, options.closedLabel),
    },
    // THE NUMBERS pass through as numbers — the band's island counts up to
    // them and the page's `format` (Intl, §8.3) prints them; the words are this
    // language's, the icon an id ./[slug]/stat-tiles.tsx turns into a glyph
    // (D30/D32). A row without a suffix carries no `suffix` KEY, which is what
    // lets that module spread the row whole.
    stats: doctor.stats.map((stat) => ({
      icon: stat.icon,
      value: stat.value,
      ...(stat.suffix === undefined ? {} : { suffix: stat.suffix }),
      label: stat.words[locale].label,
      description: stat.words[locale].description,
    })),
    // THE YEARS BECOME LABELS HERE, and nowhere else (D15, D17). lib/team's
    // `coursesByYear` groups the rows — newest year first, the file's order
    // inside a year — and hands each year back as the NUMBER it is; the band
    // prints a finished string and formats nothing. `String(year)` is the
    // conversion on purpose: `Intl.NumberFormat`, or an ICU `{year, number}`,
    // would group the digits by locale and print „2.024" in Romanian and in
    // German. A calendar year is a name for a year, not a quantity.
    courses: coursesByYear(doctor, locale).map(({ year, courses }) => ({
      year: String(year),
      courses,
    })),
  };
}
