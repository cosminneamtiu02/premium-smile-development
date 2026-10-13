import type {
  DoctorIntroCredo,
  DoctorIntroPhoto,
} from '@/components/sections/DoctorIntro/DoctorIntro';
import type { DoctorProfileProps } from '@/components/sections/DoctorProfile/DoctorProfile';
import type { DoctorShowcaseDoctor } from '@/components/sections/DoctorShowcase/DoctorShowcase';
import type { TeamRosterMember } from '@/components/sections/TeamRoster/TeamRoster';
import { localeHref } from '@/i18n/href';
import type { Locale } from '@/i18n/locales';
import {
  auxiliaries,
  doctors,
  splitKeywords,
  type AboutSegment,
  type AuxiliaryMember,
  type Doctor,
  type Stat,
  type StatIcon,
} from '@/lib/team/team';

// app/[locale]/team/populate — THE walk from lib/team's people to the finished
// props of the pages that show them — the Team page, every doctor page and,
// since 2026-09-30, the Home page's doctors band (and since 2026-10-01 the
// clinic's numbers band on Home and Team, `populateStats` over lib/team's
// `clinicStats`) — in ONE language. Pure: a locale, a finished label, one
// callback and (for tests) a list go in, plain objects come out. JSX-free and
// next-intl-free, no DOM — React reaches it only through the sections' prop
// types it already imports (`DoctorShowcaseDoctor['about']`,
// `DoctorIntroCredo['body']`, `DoctorProfileProps['about']['paragraphs']`);
// the `react` specifier itself is gone (G2-R2
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
//     doctor's page, cut the `<k>` marks out of a doctor's philosophy and his
//     biography's paragraphs, pick his course ideas and his numbers' words —
//     and the PAGE is that
//     somebody. This file is the page's arithmetic, lifted out of the JSX.
//
//   · IT CANNOT LIVE IN lib/team, whose return type would then have to name
//     `sections/` types (`DoctorShowcaseDoctor`, `TeamRosterMember`,
//     DoctorIntro's `DoctorIntroPhoto`) — the one arrow §4's dependency
//     direction forbids, since the foundation ring is importable BY every
//     tier and imports none of them. Restating those prop shapes inside lib/
//     instead would give a contract that deliberately has one declaration a
//     second one.
//
//   · IT CANNOT BE INLINE IN THE page.tsx FILES. Each has a KEEP-IN-SYNC
//     story twin beside it (./Team.stories.tsx, ./[slug]/Doctor.stories.tsx,
//     ../(home)/Home.stories.tsx)
//     that must perform the SAME mapping and cannot import an async Server
//     Component (those modules await next-intl/server, which no browser runner
//     executes). A module both import is what keeps each walk written ONCE
//     instead of twinned by hand and left to drift — and ./populate.test.ts
//     then exercises both without rendering anything at all. The one step
//     that IS JSX — a stat id becoming its glyph, on the doctor, Team and
//     Home pages — follows the same argument into a module of its own,
//     ./stat-tiles.tsx, because this file builds no element (G2-R2 tier 3).
//
// ── WHY CALLBACKS AND NOT A `t` (run ledger D1's second half). A render
// callback is the one place this module would otherwise have to know about
// React: it receives SEGMENTS, never a string with markup in it — the cutting
// happens here (lib/team's `splitKeywords`), the rendering in the caller's
// `<Keywords>` (ui/Keyword). That is what keeps this file JSX-free while the
// `<k>` marks still become <b> fragments on the page. The showcase walk's
// `renderQuote` renders ONE text, a doctor's `philosophy` (round 2's D17),
// which his card quotes — hence the name; round 1 spelled it `renderAbout`
// while the quoted field was still called `about`. The doctor walk's callback
// renders MORE than a quote since 2026-10-13 (CLAUDE.md §15.23 round 7, the
// owner's pack feedback the same evening, verbatim: "i also wan thte text of
// biografie to be like the text at: "Înainte de orice lucrare protetică
// verific sănătatea gingiei, …" so gary-ish er and with tighlighted
// keywords"): the same philosophy for the credo card (D12) AND every
// paragraph of the biography, which carries `<k>` marks of its own since that
// day (lib/team's THE BIOGRAPHY'S KEY WORDS). So it is `renderKeywords` —
// `renderQuote` until that day — and what it hands back must be a node BOTH
// bands take (`KeywordsNode` below). Words from the message files never need
// a callback: they arrive FINISHED — the showcase's one label as
// `profileLabel` — or stay with the page, which spells every eyebrow and
// title of a doctor's page itself. (Until 2026-10-13 the doctor walk took a
// second option, `closedLabel`, the finished „Închis" lib/hours printed on a
// day the doctor did not work; it left with the doctor's week — lib/team's NO
// WEEK ON A DOCTOR.) Both callers reach next-intl through different APIs —
// `getTranslations` on the server, `useTranslations` in the story twin — so
// finished strings and one callback per walk are the seam both satisfy, and
// this module needs neither a provider nor a mock to test.
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
// how ./populate.test.ts hands the walks a doctor with no course at all, a
// paragraph with no mark, or a philosophy or a paragraph with an unbalanced
// `<k>`: shapes the real data need not hold on the day the suite runs. On the
// default list the two are the same search.
// Calling the lib helper here would make the `list` parameter a lie for the
// one lookup this file makes.
//
// ── NO ASSISTANTS, AND NO THROW OF ITS OWN (run ledger D13, round 2). Round 1
// resolved each doctor's two assistant ids here for the „Echipa mea" band and
// threw on a dangling or a doubled id; the owner dropped the band, lib/team
// dropped the pair, and both belts left with them. What can still throw on the
// way through is lib/team's `splitKeywords` (an unbalanced `<k>`) — in a
// doctor's philosophy, which both walks cut, or, since 2026-10-13, in one of
// his biography's paragraphs, which the doctor walk cuts too — naming its own
// input, already refused in the shipped data by
// tests/unit/team-data.test.ts, and surfacing HERE UNCHANGED, never caught or
// reworded: ./populate.test.ts feeds that shape through the `list` seam and
// pins the library's own message (its „lets lib/team’s unbalanced-<k> error
// surface unchanged", for the showcase walk, the doctor walk's philosophy and
// the doctor walk's paragraph; G2-R2 tier 3, typescript F4). A try/catch that
// quietly printed the raw text instead would turn all three red. (lib/hours'
// unknown-day error was the second such shape until the doctor's week left
// the page, 2026-10-13.)

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
 * What the doctor walk's `renderKeywords` hands back: ONE node for its two
 * receivers — the credo card's quote (DoctorIntro's `body`) and every
 * biography paragraph (DoctorProfile's `paragraphs`) — so it is spelled as
 * both bands' own prop types at once, and a band that ever narrowed its own
 * would fail here, at the callback, before it failed on a page. Typed through
 * the sections' props, the credo precedent, so no `react` import is needed.
 */
type KeywordsNode = DoctorIntroCredo['body'] &
  DoctorProfileProps['about']['paragraphs'][number];

/**
 * Everything a `/{locale}/team/{id}/` page's three content bands need, in one
 * language — since 2026-10-13 (the owner's reshape, CLAUDE.md §15.23 round 7)
 * the opener → the „în cifre" tiles → the biography beside the courses; the
 * map reads lib/clinic itself. Only FACTS ABOUT THE PERSON travel here: every
 * eyebrow and title is the page's own `team.doctor.*` key (D20), which this
 * module never sees.
 */
export type DoctorPageContent = Readonly<{
  /** sections/DoctorIntro — the cutout, the specialty, the name, and the
   *  credo card's quote (D12): `renderKeywords`' node over the philosophy,
   *  typed as the card's own `body` so no `react` import is needed here. */
  intro: Readonly<{
    name: string;
    position: string;
    photo: DoctorIntroPhoto;
    credo: DoctorIntroCredo['body'];
  }>;
  /** sections/DoctorProfile — the „Despre" paragraphs (D14), one node each:
   *  `renderKeywords`' node over the paragraph's cut-up text, since
   *  2026-10-13 a paragraph carries `<k>` marks (lib/team's THE BIOGRAPHY'S
   *  KEY WORDS), typed as the band's own `paragraphs` so no `react` import is
   *  needed here — and, for the courses column it composes
   *  (sections/DoctorCourses), the course IDEAS: one finished line each, in
   *  lib/team's order, the order the column prints them and highlights them
   *  one by one (the owner, 2026-10-13: "jsut dot ideas … a single idea per
   *  section"). No year and no grouping — lib/team's A COURSE IS ONE IDEA.
   *  Empty when the doctor has no course. */
  profile: Readonly<{
    paragraphs: DoctorProfileProps['about']['paragraphs'];
    courses: readonly string[];
  }>;
  /** sections/DoctorStats — one row per tile (D32), the WORDS in this language
   *  and the drawing as an ID: ./stat-tiles.tsx maps it to a glyph
   *  (lib is React-free, the band takes a ReactNode, and this file builds no
   *  element), and the page formats the number and hands the tiles over. */
  stats: readonly StatContent[];
}>;

/** One stat tile's content for ONE language — lib/team's row with its words
 *  picked; the icon stays an id for the page to draw (D30/D32). A doctor's
 *  row or the clinic's, so it is named for what it is: `DoctorStatContent`
 *  until 2026-10-01, beside lib/team's `DoctorStat` → `Stat`. */
export type StatContent = Readonly<{
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
 * @param options `renderKeywords` cuts nothing and renders everything — the
 *   credo card's quote AND every biography paragraph, one call each, in that
 *   order (see the file header; `renderQuote` until 2026-10-13, when the
 *   paragraphs gained their key words) — the one option since the doctor's
 *   week, and with it `closedLabel`, left the page the same day.
 * @param list the people to walk. Defaults to lib/team's own.
 */
export function populateDoctorPage(
  locale: Locale,
  slug: string,
  options: Readonly<{
    renderKeywords: (segments: readonly AboutSegment[]) => KeywordsNode;
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
      credo: options.renderKeywords(splitKeywords(words.philosophy)),
    },
    profile: {
      // THE PARAGRAPHS, in lib/team's order (D14, D17), each CUT here and
      // RENDERED by the caller exactly as the credo's quote is: since
      // 2026-10-13 a paragraph carries `<k>` marks of its own (CLAUDE.md
      // §15.23 round 7 — the owner: "… so gary-ish er and with tighlighted
      // keywords"; lib/team's THE BIOGRAPHY'S KEY WORDS), so each one leaves
      // as the caller's node, one per <p>, and no `<k>` ever reaches the band.
      // A fresh array, so the band can never reach the data's own.
      paragraphs: words.about.map((paragraph) =>
        options.renderKeywords(splitKeywords(paragraph)),
      ),
      // THE COURSE IDEAS, one finished line each in this language, in
      // lib/team's order — the design order the courses column prints them
      // and highlights them in, one by one (the owner, 2026-10-13: "jsut dot
      // ideas, and each section will be jsut one dot"). Nothing grouped,
      // nothing sorted, no year: a course is one idea (lib/team's A COURSE IS
      // ONE IDEA). A fresh array, so the band can never reach the data's own.
      courses: doctor.courses.map((course) => course.words[locale]),
    },
    // THE NUMBERS — his own rows, through the one stats walk below (the Home
    // page's band walks the clinic's rows through the same function).
    stats: populateStats(locale, doctor.stats),
  };
}

/**
 * One list of „în cifre" rows → the tiles' content for ONE language: a
 * doctor's own (`Doctor.stats`, through `populateDoctorPage` above) or the
 * clinic's (lib/team's `clinicStats`, the band on the Home and Team pages —
 * owner 2026-10-01: "i want it on home page too with just 3 components" ·
 * "same component as on main page with the stats on the team page"). One
 * walk for every band, so no two can word a row differently.
 *
 * THE NUMBERS pass through as numbers — the band's island counts up to them
 * and the page's `format` (Intl, §8.3) prints them; the words are this
 * language's, the icon an id ./stat-tiles.tsx turns into a glyph (D30/D32). A
 * row without a suffix carries no `suffix` KEY, which is what lets that module
 * spread the row whole. Order passes through unchanged: display order is the
 * list's.
 */
export function populateStats(
  locale: Locale,
  stats: readonly Stat[],
): readonly StatContent[] {
  return stats.map((stat) => ({
    icon: stat.icon,
    value: stat.value,
    ...(stat.suffix === undefined ? {} : { suffix: stat.suffix }),
    label: stat.words[locale].label,
    description: stat.words[locale].description,
  }));
}
