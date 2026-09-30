import type { Locale } from '../../i18n/locales';
import type { OpeningHours } from '../clinic/clinic';
import type { ImagePath } from '../image-path/image-path';

// lib/team — THE clinic's people: every doctor and every auxiliary member,
// their pictures, their week, their courses, their numbers and their words in
// all five languages. Site DATA in §4's foundation ring (the lib/clinic, lib/prices,
// lib/reviews and lib/hero-slides precedents): one file every consumer reads,
// nothing fetched, nothing mutated, React-free (fenced by
// tests/unit/lib-react-free.test.ts). The Team page, the per-doctor page and —
// since 2026-09-30 — the Home page's doctors band are built from DUMB bands
// (run ledger D1): app/[locale]/team/populate.ts imports this list, picks the
// visitor's language and hands finished strings over; no band ever sees this
// file.
//
// WHY A TYPESCRIPT MODULE AND NOT MESSAGE KEYS (run ledger D2 — the lib/prices
// argument, word for word). A doctor's biography is CONTENT, the way a price
// row and a review are content, so his pictures, his schedule, his courses and
// his words travel together in ONE object literal read top to bottom, and
// `Record<Locale, …>` makes a missing German position a failed `tsc` instead
// of a leaked Romanian one — the guarantee tests/unit/translation-parity.test.ts
// could never have given, because it checks the five message files against
// EACH OTHER and knows nothing about which person needs which key. The `team`
// namespace keeps only what is NOT a fact about a person: the doctors band's
// eyebrow and title and its card's one label (`team.showcase.*`, 2026-09-30),
// the doctor page's three eyebrow/title pairs — philosophy · about · courses
// (run ledger D20) — plus the schedule's title alone (its eyebrow struck in
// round 2g, D37), the „în cifre" band's eyebrow, title and lead
// (`team.doctor.stats.*`, D32), and the schedule's closed word. Where a key needs
// a person it takes him as an ICU ARGUMENT, never as a key of his own: the
// about band's title is „Despre {name}", and the name comes from here.
//
// ARRAYS, NOT OBJECTS KEYED BY ID (the lib/prices reasoning). Display order is
// designed here — the doctors band (sections/DoctorShowcase, on Home and on
// the Team page) walks `doctors` top to bottom and alternates the sides — so
// reordering the band means moving lines in this file.
// `findDoctor` and `findAuxiliary` below are the lookups TOOLS, TESTS and the
// doctor route's `generateMetadata` use — never the walk that builds a page:
// `generateStaticParams` maps `doctors` itself, and app/[locale]/team/
// populate.ts searches the `list` argument it was handed, which is its own
// test seam. They are not an excuse to turn the list into a map.
//
// A DOCTOR'S `id` IS A LIVE URL (run ledger D3): `/{locale}/team/{id}/`, the
// segment `generateStaticParams` emits. Renaming one renames five pages in
// five languages, which is a redirect question (§5's parked localized-slug
// decision), not an edit.
//
// TWO TEXTS PER DOCTOR, IN TWO VOICES (run ledger D17 — round 2, the owner's
// pack feedback of 2026-09-25). `philosophy` is the doctor speaking: first
// person, one or two sentences, `<k>…</k>` around the words a page dresses in
// bold. It is ONE string with TWO readers — the doctor card quotes it
// (sections/PersonnelCard, in the doctors band), and the doctor page's
// „Filozofia mea" card beside the opener's photograph quotes it again (D12) —
// so it is written once, here, and
// `splitKeywords` below cuts it for both. Round 1 called it `about`; the
// rename freed that word for what the doctor page's lilac band now holds.
// `about` is the clinic speaking ABOUT the doctor: third person, plain prose,
// ONE STRING PER PARAGRAPH, no marks (D14 prints one `<p>` per entry). An
// array rather than one string with blank lines in it, because a paragraph
// break is structure and a band should not have to parse it back out of the
// text; and plain, because the only thing that ever cuts a `<k>` is
// `splitKeywords`, which nothing calls on a paragraph — a mark there would
// reach the page as visible text, so tests/unit/team-data.test.ts fails on
// one. Every language carries the SAME number of paragraphs with the same
// facts in them: a language one paragraph short is a translation nobody
// finished.
//
// COURSES ARE ROWS, AND A YEAR IS A FACT (run ledger D17). Round 1 wrote each
// course as one finished line per language with „, 2024" at its end — five
// copies of one number, free to disagree with each other, and a year the page
// could only have grouped by parsing the tail of a sentence. A course is now
// the lib/prices row shape: the FACT once (`year`, a number) and the finished
// line in all five languages beside it (`words`), the year no longer inside
// the line — the doctor page prints it as the heading of the group the line
// sits in (D15), so inside the line it would be said twice. `coursesByYear`
// below does the grouping. The rows are written newest first, and within one
// year in the order the page should list them; tests/unit/team-data.test.ts
// pins that order (the design order, like the doctors'), while `coursesByYear`
// deliberately does not rely on it. A year never goes through
// `Intl.NumberFormat` on its way to a page — ro and de would print „2.024" —
// so the populator hands the band its plain digits.
//
// A DOCTOR'S NUMBERS ARE ROWS TOO (run ledger D32 — round 2f, the owner's „în
// cifre" band of 2026-09-26, D30). The doctor page gains four tiles, each an
// icon, a number, a label and one sentence, and the owner wants "each page
// populated like a dumb component" — so the NUMBER and the WORDS of a tile are
// facts about the doctor and live here, beside his courses, while the band's
// eyebrow, title and lead read the same on every doctor's page and are page
// keys (the WHY paragraph above). A stat is the course row's shape once more:
// the fact stored once — `value`, a whole number, and `suffix`, the „+" that
// turns an exact count into "at least" — and the finished words in all five
// languages beside it. The number is never inside the LABEL: the band prints
// it on a line of its own, through the page's `Intl.NumberFormat(locale)`
// (§8.3 — „3.000" in ro and de, „3,000" in en), and counts up to it (D31); a
// label that repeated it would say it twice, so the data test refuses a digit
// in one.
//
// `icon` IS AN ID, NEVER A DRAWING. This folder is React-free (the fence named
// at the top), so a row cannot hold a glyph component; it names which of the
// four drawings the tile's disc shows, and the PAGE owns the map from
// `StatIcon` to glyph — `STAT_ICONS`, a `Record<StatIcon, ReactNode>` in
// app/[locale]/team/[slug]/stat-tiles.tsx, the ONE module the doctor page
// and its story twin both import (G2-R2 tier 3: the two hand-twinned copies
// became one) — exhaustive by type, so a fifth id written here is a compile
// error there until somebody draws it. sections/DoctorStats itself takes a
// finished ReactNode per tile and imports no glyph (its D30 paragraph),
// which is what keeps the band DUMB; the exhaustiveness therefore rests on
// that one app-tier annotation staying `Record` (G2-R2 tier 1, typescript
// F2). One tile per
// drawing: the data test holds the icons unique per doctor, because two tiles
// wearing one picture would be two answers to one question.
//
// A SENTENCE MAY CARRY THE NUMBER, AND THEN THE TWO MUST AGREE. By the owner's
// own design the patients sentence repeats the tile's count („Peste 3000 de
// zâmbete…") — one number written in two places that are free to disagree,
// which is exactly what the course years stopped doing (COURSES above). It
// cannot leave the sentence without rewriting the owner's words, so
// tests/unit/team-data.test.ts holds it instead: every number a description
// carries IS its row's `value` (grouping marks allowed, so a future „10.000"
// reads as ten thousand and not as 10 and 000), and every language carries as
// many numbers as the Romanian, so no translation quietly drops it. For
// whoever edits a row: change `value` and that sentence in all five languages
// together, or CI goes red. The owner's paste said „Peste 10000"; the demo
// rows say their own `value` instead (3000, 2500), written unseparated the way
// he wrote his, which all five languages allow at four digits. The tile's
// number above the sentence prints the grouped form („3.000+" in ro); making
// the two spellings identical is a text edit the test accepts either way.
//
// ── TODO(owner): THESE ARE DEMO PEOPLE, NOT THE CLINIC'S STAFF ──────────────
// Both doctors and all three auxiliary members are INVENTED, exactly like
// lib/reviews' `demoReviews` and unlike lib/prices' rows: the two Romanian
// `philosophy` sentences are the PersonnelCard lane's own story fixtures
// (2026-09-10, written to exercise the card); the names, positions, courses
// and schedules were written for this run so the page could be built and
// photographed at all; and the three `about` paragraphs per doctor — THE
// ROMANIAN INCLUDED — were drafted by Claude in round 2 (2026-09-25). The text
// the owner showed for that band was another clinic's, offered as an example,
// and was NOT copied: the paragraphs follow the round-2 contract's shape only
// (since when at the clinic and how a first visit goes · how the doctor keeps
// learning, naming courses that really are in the rows, and how the doctor
// works with colleagues · one personal line), with every fact in them
// invented to agree with the rest of the row. The two course rows added in
// round 2 (one per doctor) are drafts in every language as well.
//
// The `stats` rows of round 2f (D32) are invented too. Their eight numbers
// were first set by the run's contract rather than counted and disagreed with
// their own rows; since round 2g (D39) they are RE-ALIGNED to what the page
// prints — Elena's experience tile says 10+ beside her philosophy's „de peste
// zece ani", and both `courses` tiles say 9 over the nine course rows each
// doctor lists — and tests/unit/team-data.test.ts pins the rule (a `courses`
// tile never claims fewer courses than the doctor's own rows list), so the
// two cannot drift apart unnoticed again. Still invented: nobody here is
// anybody. A real row's numbers are claims about a real person: each must be
// countable from the clinic's own records and agree with everything else the
// same page prints — the course rows, the years in the paragraphs, the
// philosophy. The stats' WORDS are the owner's, pasted from his reference
// site, and three of them were CMSR-SENSITIVE — „Intervenții reușite" and
// „Rezultate predictibile și sigure, …" described OUTCOMES (a count of
// successes, safety), „Recunoaștere pentru inovație, calitate și grijă
// autentică." asserted a recognition somebody must actually have given.
// Flagged for two rounds; REWRITTEN on 2026-09-27 (round 2s, the owner: "these
// are very sensible. add a step for checking for illegal guarantees or things
// aiming in that direction") to descriptive copy — „Intervenții", „Atenție la
// detalii, tehnologii moderne și …", „Formare continuă în tehnici și
// tehnologii moderne." — in all five languages (drafts, flagged like the
// rest), and tests/unit/cmsr-scan.test.ts now REFUSES the old shapes: a
// result promise, a success count, an undocumented award. A real award the
// clinic can document goes into that file's ALLOWED list verbatim, with the
// document named in the ledger.
//
// Before
// launch the owner replaces every row with real people — real names, real
// portraits (§11), real qualifications, real biographies, and each person's
// consent to being named and pictured (a name plus a face plus a biography is
// personal data; the lib/reviews consent precedent). Until then nothing here
// is a claim about anybody.
//
// THE OTHER FOUR LANGUAGES ARE DRAFTS (§15.17). Every EN/DE/FR/IT string below
// was written by Claude on this run's dispatch, translated faithfully from the
// Romanian, and is FLAGGED FOR THE OWNER'S CONFIRMATION — the shape the
// reviews, prices and hero lanes all ship in. That includes the stats' labels
// and sentences of round 2f (D32), kept as close to the owner's Romanian as
// each language allows, claims and all, so that he judges ONE text in five
// languages rather than five different texts. The honorific follows the
// language rather than the person („Dr." in ro/de/en · „Dr" in fr, French
// drops the point on a contraction that ends in its word's last letter ·
// „Dott.ssa"/„Dott." in it, after the article Italian sets before a title in
// running prose), and so do the quotation marks around a university name
// (ro „…” · de „…“ · fr « … » · it «…»); English takes the institution's own
// English form instead. City names are translated where the language has its
// own („București" → Bucharest/Bukarest/Bucarest, „Milano" → Milan/Mailand),
// and never where it does not (Cluj-Napoca, Timișoara, Iași). Years belong to
// no language at all: each is its row's fact, stored once (the COURSES
// paragraph above), so no translation can disagree about one.
//
// CMSR, the same rule lib/prices states: descriptive, never superlative, never
// a promise, never a comparison. A `philosophy` says how a doctor works; an
// `about` says since when, on what, how a first visit goes and how the doctor
// keeps learning. Neither claims an outcome — no „cel mai", no „garantat", no
// „fără durere", nor their equivalent in any of the other four languages. A
// stat's `label` and `description` are the one place that does, in the
// owner's own words, and the TODO(owner) block above flags each such claim
// instead of rewriting it; beyond them the type has no field a testimonial or
// a guarantee could hide in. CMSR is an AUTHORING RULE, the owner's — and,
// since 2026-09-27 (round 2s), a SCANNED one: tests/unit/cmsr-scan.test.ts
// walks every string this file ships (names excluded) and every `team.*`
// message value in the five languages against one narrow pattern list per
// language (superlatives, guarantees, pain/risk promises, percentages,
// "number one"/"leader"/"unique"/"excellent", a RESULT qualified as
// predictable/constant/safe/guaranteed, recognition and awards, a success
// count), with an owner-maintained ALLOWED list for documented exceptions.
// D-DASH is
// the other wording rule (the owner's, 2026-09-06: no dash inside a sentence,
// a comma, a colon or a full stop instead), and that one IS pinned —
// tests/unit/team-data.test.ts scans every shipped string in every language
// for a spaced dash or an em/en dash; a hyphen inside a word — „Cluj-Napoca",
// „exersat-o", „X-ray" — is not a dash and passes.
//
// PICTURES live under public/images/ — the folder the export optimizer scans
// (§11) — and carry their INTRINSIC pixel size, because ui/Image reserves the
// box from it (§11's zero-layout-shift rule); tests/unit/team-data.test.ts
// reads every file's own header (PNG IHDR, JPEG SOF) and refuses a row whose
// `width`/`height` are not the pixels on disk (G2-R2 tier 1, typescript F3).
// ONE per person: an auxiliary member's `portrait` is the 3:4 card photograph
// (PersonnelCard D3); a doctor's `cutout` is a transparent PNG, the subject
// from the waist up with no background — the doctor page's opener and, since
// 2026-09-30, the doctor card too (PersonnelCard D17).
// The demo files sit in public/images/demo/; the clinic's own go in
// public/images/team/ BY CONVENTION, which tests/unit/team-data.test.ts pins
// today as "every shipped path is a demo path" and will tighten to the team
// folder the day a real portrait lands (the lib/reviews and lib/hero-slides
// wording, deliberately) — while the TYPE stops at §11's folder, so a demo
// picture needs no cast.
//
// HOURS are lib/clinic's own `OpeningHours` shape, so lib/hours prints a
// doctor's week with exactly the machinery that prints the clinic's: seven
// rows, Monday → Sunday, closed days in their calendar place. Round 2 moved
// WHERE the week prints — into the white schedule card beside the `about`
// paragraphs in the doctor page's lilac band (run ledger D14), because the
// „Echipa mea" band it used to share with the assistants is gone (D13) — and
// nothing about its shape. A doctor's week is HIS, not the clinic's — Elena's
// late Tuesday and Andrei's Saturday are the reason this field exists at all
// rather than the page reading `clinic.hours`.
//
// NO ASSISTANTS (run ledger D13, round 2). Round 1 paired every doctor with
// exactly two auxiliary ids for the „Echipa mea" band; the owner dropped the
// band, and the pair left with it rather than stay behind as data no page
// reads — a field nothing prints still has to be kept true by somebody, and
// nobody would notice the day it stopped being. The auxiliary staff
// themselves stay: they are the Team page's grid.
//
// NO PORTRAIT AND NO SERVICES CATEGORY ON A DOCTOR (owner dispatch 2026-09-30,
// PersonnelCard D17) — D13's reason once more. Until that day a doctor carried
// a framed `portrait` for the Team page's card and an optional
// `servicesCategory`, the lib/prices category the card's „Vezi serviciile"
// link landed on. The card now wears the `cutout` and keeps ONE link, to the
// doctor's own page, so both fields lost their only reader and left with it
// (the owner's standing word: "i want no dead code"). The day a link to a
// doctor's prices returns — on his own page, say — `servicesCategory` returns
// with it, together with the data test's check that it names a category
// lib/prices really has.

/**
 * A picture under public/images/ with its INTRINSIC pixel size (§11 — what
 * ui/Image reserves the box from, and the optimizer's srcset input).
 */
export type TeamPicture = Readonly<{
  src: ImagePath;
  width: number;
  height: number;
}>;

/** The translated part of one auxiliary member — every locale, or it does not compile. */
export type AuxiliaryWords = Readonly<{
  /** The person's name. The same in every language, and still per-locale: a
   *  future row may carry a transliteration, and nothing else in this type
   *  would then have a place to put it. */
  name: string;
  /** What the person does, in sentence case — ui/Eyebrow does the shouting. */
  position: string;
}>;

/** The translated part of one doctor — every locale, or it does not compile. */
export type DoctorWords = Readonly<{
  /** Name WITH the language's honorific („Dr. Elena Marin" · „Dott.ssa Elena Marin"). */
  name: string;
  /** The specialty, sentence case — ui/Eyebrow uppercases it („Medic specialist ortodonție"). */
  position: string;
  /**
   * The doctor's own words, first person, with `<k>…</k>` around the one or
   * two words a page dresses (run ledger D2) — the doctor card's quote AND the
   * doctor page's „Filozofia mea" card (D12), one string for both (D17; round
   * 1 called it `about`). The marks are the PersonnelCard lane's D9
   * convention kept; what changed is WHERE they are authored — here, beside
   * the person, instead of inside a message key — and WHO splits them:
   * `splitKeywords` below, not next-intl's `t.rich`.
   */
  philosophy: string;
  /**
   * The doctor page's „Despre" band (run ledger D14, D17): third person,
   * PLAIN prose, ONE STRING PER PARAGRAPH, printed in this order. No `<k>`
   * marks — nothing splits a paragraph — and no newline inside one; the same
   * number of paragraphs in every language.
   */
  about: readonly string[];
}>;

/**
 * One course a doctor followed — the lib/prices row shape (run ledger D17):
 * the year is a FACT, stored once, and `words` is the finished line in all
 * five languages WITHOUT the year, which the page prints as the heading of the
 * group the line sits in (D15).
 */
export type Course = Readonly<{
  /** The calendar year — an integer; the data test holds it to 1990 … 2026. */
  year: number;
  /** What and where, in every language — never when. */
  words: Readonly<Record<Locale, string>>;
}>;

/**
 * One year's courses in ONE language — what the doctor page's courses band
 * prints under each year heading (run ledger D15). The year stays a number
 * here; the populator turns it into the heading's text (the header's COURSES
 * paragraph: plain digits, never `Intl`).
 */
export type CourseGroup = Readonly<{
  year: number;
  courses: readonly string[];
}>;

/**
 * Which drawing the doctor page puts in a stat tile's disc (run ledger D30,
 * D32) — an ID, never a component: lib is React-free, so the PAGE owns the
 * map from these four to its glyphs (`STAT_ICONS` in
 * app/[locale]/team/[slug]/stat-tiles.tsx, shared by the page and its story
 * twin), exhaustively; the band takes a finished ReactNode. A fifth id is a compile error in that map
 * before it is ever a tile.
 */
export type StatIcon = 'experience' | 'patients' | 'courses' | 'interventions';

/** The translated part of one stat tile — every locale, or it does not compile. */
export type DoctorStatWords = Readonly<{
  /**
   * The tile's title, sentence case („Ani de experiență"). Never the number —
   * the band prints that on its own line (the header's A DOCTOR'S NUMBERS).
   * The data test holds its longest unbreakable run to 21 characters.
   */
  label: string;
  /**
   * The tile's one sentence. A number in it IS the row's `value` — the
   * owner's patients sentence carries one — which the data test pins.
   */
  description: string;
}>;

/**
 * One tile of the doctor page's „în cifre" band (run ledger D30, D32): the
 * lib/prices row shape once more — the FACT once (`value`, `suffix`), the
 * finished words in all five languages beside it.
 */
export type DoctorStat = Readonly<{
  /** Which of the four drawings sits in the tile's disc — unique per doctor. */
  icon: StatIcon;
  /** The final number, an integer ≥ 0 (the band counts up to it, D31). */
  value: number;
  /** Printed after the number — "+" for "at least"; absent for an exact count. */
  suffix?: '+';
  /** The tile's title and its one sentence, all five languages. */
  words: Readonly<Record<Locale, DoctorStatWords>>;
}>;

/** A member of the auxiliary staff: one portrait, one position, five languages. */
export type AuxiliaryMember = Readonly<{
  /** Stable English kebab-case id — the React key of the Team page's grid. */
  id: string;
  /** The 3:4 card photograph (PersonnelCard D3 — one ratio for the whole team). */
  portrait: TeamPicture;
  /** Name and position in all five locales. */
  words: Readonly<Record<Locale, AuxiliaryWords>>;
}>;

/** A doctor: the person a `/{locale}/team/{id}/` page is built for. */
export type Doctor = Readonly<{
  /** THE URL segment (run ledger D3) — stable, English, kebab-case, dot-free. */
  id: string;
  /** The transparent PNG — the doctor from the waist up, no background: the
   *  doctor page's opener (run ledger D6) and the doctor card (PersonnelCard
   *  D17). A doctor's ONE picture. */
  cutout: TeamPicture;
  /** The doctor's OWN week, in lib/clinic's shape — lib/hours turns it into rows. */
  hours: readonly OpeningHours[];
  /**
   * The courses, newest first (run ledger D17) — `coursesByYear` groups them
   * for one language. The TYPE allows none (a doctor without courses gets no
   * courses band, D15); the data test demands at least one of every shipped
   * doctor.
   */
  courses: readonly Course[];
  /**
   * The „în cifre" tiles (run ledger D32), in the order the band prints them.
   * The TYPE allows none, like `courses`; the data test demands at least one
   * of every shipped doctor, each drawing at most once.
   */
  stats: readonly DoctorStat[];
  /** Name, position, philosophy and the about paragraphs in all five locales. */
  words: Readonly<Record<Locale, DoctorWords>>;
}>;

// The committed demo pictures. The three portraits are the PersonnelCard
// lane's fixtures (600 × 800, the one team ratio) — one per auxiliary member
// today; the two cutouts were generated for the doctor-pages run (900 × 1200,
// alpha, obviously placeholders) — one per doctor. Demo faces are scarce, so
// the data test never demands unique pictures: two rows may share a file.
const PORTRAIT_1: TeamPicture = {
  src: '/images/demo/portrait-1.jpg',
  width: 600,
  height: 800,
};
const PORTRAIT_2: TeamPicture = {
  src: '/images/demo/portrait-2.jpg',
  width: 600,
  height: 800,
};
const PORTRAIT_3: TeamPicture = {
  src: '/images/demo/portrait-3.jpg',
  width: 600,
  height: 800,
};
const CUTOUT_1: TeamPicture = {
  src: '/images/demo/cutout-1.png',
  width: 900,
  height: 1200,
};
const CUTOUT_2: TeamPicture = {
  src: '/images/demo/cutout-2.png',
  width: 900,
  height: 1200,
};

/**
 * The auxiliary staff, in the order the Team page's grid prints them. Add rows
 * HERE — the type refuses a missing language, and tests/unit/team-data.test.ts
 * pins what a cast could smuggle past the compiler (an empty string, a
 * duplicate id, a portrait that does not exist on disk).
 */
export const auxiliaries: readonly AuxiliaryMember[] = [
  {
    id: 'ioana-tepes',
    portrait: PORTRAIT_2,
    words: {
      ro: { name: 'Ioana Țepeș', position: 'Asistentă medicală' },
      en: { name: 'Ioana Țepeș', position: 'Dental nurse' },
      de: {
        name: 'Ioana Țepeș',
        position: 'Zahnmedizinische Fachangestellte',
      },
      fr: { name: 'Ioana Țepeș', position: 'Assistante dentaire' },
      it: {
        name: 'Ioana Țepeș',
        position: 'Assistente di studio odontoiatrico',
      },
    },
  },
  {
    id: 'mihaela-craciun',
    portrait: PORTRAIT_1,
    words: {
      ro: { name: 'Mihaela Crăciun', position: 'Asistentă medicală' },
      en: { name: 'Mihaela Crăciun', position: 'Dental nurse' },
      de: {
        name: 'Mihaela Crăciun',
        position: 'Zahnmedizinische Fachangestellte',
      },
      fr: { name: 'Mihaela Crăciun', position: 'Assistante dentaire' },
      it: {
        name: 'Mihaela Crăciun',
        position: 'Assistente di studio odontoiatrico',
      },
    },
  },
  {
    id: 'ana-maria-dobre',
    portrait: PORTRAIT_3,
    words: {
      ro: {
        name: 'Ana-Maria Dobre',
        position: 'Recepție, programări și comunicarea cu pacienții',
      },
      en: {
        name: 'Ana-Maria Dobre',
        position: 'Reception, appointments and patient communication',
      },
      de: {
        name: 'Ana-Maria Dobre',
        // „Patientenbetreuung" (18) rather than „Patientenkommunikation" (22):
        // the mono eyebrow never hyphenates (PersonnelCard D5), and that word
        // broke the 21-character ceiling tests/unit/team-data.test.ts now
        // holds every position to (G2 a11y, 2026-09-21).
        position: 'Empfang, Terminvergabe und Patientenbetreuung',
      },
      fr: {
        name: 'Ana-Maria Dobre',
        position: 'Accueil, rendez-vous et communication avec les patients',
      },
      it: {
        name: 'Ana-Maria Dobre',
        position: 'Accoglienza, appuntamenti e comunicazione con i pazienti',
      },
    },
  },
];

/**
 * The doctors, in the order the doctors band prints them on Home and on the
 * Team page (the sides alternate from this order) and the order
 * `generateStaticParams` emits their pages in.
 * Add rows HERE — the type refuses a missing language and a course without
 * all five of its lines, and tests/unit/team-data.test.ts checks what only the
 * file system and the words themselves know: that the pictures exist, that
 * every language carries as many `about` paragraphs as the Romanian,
 * that the course rows run newest → oldest, and that every number a stat's
 * sentence carries is that stat's own `value` (D32).
 */
export const doctors: readonly Doctor[] = [
  {
    id: 'elena-marin',
    cutout: CUTOUT_1,
    // Long mornings three days a week, late shifts on the other two — the
    // reason a doctor carries his own week instead of the clinic's.
    hours: [
      {
        days: ['Monday', 'Wednesday', 'Friday'],
        opens: '09:00',
        closes: '17:00',
      },
      { days: ['Tuesday', 'Thursday'], opens: '12:00', closes: '20:00' },
    ],
    // Round 1's four lines with their „, YEAR" tails lifted into `year` (D17),
    // plus ONE row drafted in round 2 — the digital photography course — so
    // the 2024 group shows two lines, the case the band has to lay out — and
    // FOUR more drafted in round 2g (D39, the owner: "add more examples"), so
    // the timeline has nine rows over eight years.
    courses: [
      {
        year: 2025,
        words: {
          ro: 'Curs de ortodonție digitală și planificare 3D a tratamentului, Cluj-Napoca',
          en: 'Digital orthodontics and 3D treatment planning course, Cluj-Napoca',
          de: 'Kurs für digitale Kieferorthopädie und 3D-Behandlungsplanung, Cluj-Napoca',
          fr: 'Formation en orthodontie numérique et planification 3D du traitement, Cluj-Napoca',
          it: 'Corso di ortodonzia digitale e pianificazione 3D del trattamento, Cluj-Napoca',
        },
      },
      {
        year: 2024,
        words: {
          ro: 'Curs de aliniere dentară cu gutiere transparente, București',
          en: 'Clear aligner therapy course, Bucharest',
          de: 'Kurs für Zahnkorrektur mit transparenten Schienen, Bukarest',
          fr: 'Formation à l’alignement dentaire par gouttières transparentes, Bucarest',
          it: 'Corso di allineamento dentale con mascherine trasparenti, Bucarest',
        },
      },
      {
        year: 2024,
        words: {
          ro: 'Curs de fotografie dentară digitală, București',
          en: 'Digital dental photography course, Bucharest',
          de: 'Kurs für digitale Dentalfotografie, Bukarest',
          fr: 'Formation en photographie dentaire numérique, Bucarest',
          it: 'Corso di fotografia dentale digitale, Bucarest',
        },
      },
      {
        year: 2023,
        words: {
          ro: 'Congresul Asociației Europene de Ortodonție, Viena',
          en: 'European Orthodontic Society congress, Vienna',
          de: 'Kongress der Europäischen Gesellschaft für Kieferorthopädie, Wien',
          fr: 'Congrès de la Société européenne d’orthodontie, Vienne',
          it: 'Congresso della Società Europea di Ortodonzia, Vienna',
        },
      },
      {
        year: 2022,
        words: {
          ro: 'Curs de management al pacientului adult în ortodonție, Timișoara',
          en: 'Adult patient management in orthodontics course, Timișoara',
          de: 'Kurs zur Betreuung erwachsener Patienten in der Kieferorthopädie, Timișoara',
          fr: 'Formation à la prise en charge du patient adulte en orthodontie, Timișoara',
          it: 'Corso di gestione del paziente adulto in ortodonzia, Timișoara',
        },
      },
      {
        year: 2021,
        words: {
          ro: 'Curs de ortodonție interceptivă la copii, Cluj-Napoca',
          en: 'Interceptive orthodontics in children course, Cluj-Napoca',
          de: 'Kurs für interzeptive Kieferorthopädie bei Kindern, Cluj-Napoca',
          fr: 'Formation en orthodontie interceptive chez l’enfant, Cluj-Napoca',
          it: 'Corso di ortodonzia intercettiva in età pediatrica, Cluj-Napoca',
        },
      },
      {
        year: 2019,
        words: {
          ro: 'Congresul Societății Române de Ortodonție, București',
          en: 'Romanian Society of Orthodontics congress, Bucharest',
          de: 'Kongress der Rumänischen Gesellschaft für Kieferorthopädie, Bukarest',
          fr: 'Congrès de la Société roumaine d’orthodontie, Bucarest',
          it: 'Congresso della Società Romena di Ortodonzia, Bucarest',
        },
      },
      {
        year: 2018,
        words: {
          ro: 'Curs de biomecanică în tratamentul cu aparate fixe, Iași',
          en: 'Biomechanics in fixed appliance treatment course, Iași',
          de: 'Kurs für Biomechanik in der Behandlung mit festsitzenden Apparaturen, Iași',
          fr: 'Formation en biomécanique du traitement par appareils fixes, Iași',
          it: 'Corso di biomeccanica nel trattamento con apparecchi fissi, Iași',
        },
      },
      {
        year: 2016,
        words: {
          ro: 'Specializare în ortodonție și ortopedie dento-facială, UMF „Carol Davila”, București',
          en: 'Specialisation in orthodontics and dentofacial orthopaedics, Carol Davila University of Medicine and Pharmacy, Bucharest',
          de: 'Fachausbildung für Kieferorthopädie und dentofaziale Orthopädie, Universität für Medizin und Pharmazie „Carol Davila“, Bukarest',
          fr: 'Spécialisation en orthodontie et orthopédie dento-faciale, Université de médecine et de pharmacie « Carol Davila », Bucarest',
          it: 'Specializzazione in ortodonzia e ortopedia dento-facciale, Università di medicina e farmacia «Carol Davila», Bucarest',
        },
      },
    ],
    // DEMO numbers set by the round-2f contract (D32), not counted — the
    // TODO(owner) block says where they disagree with the rest of this row.
    // The Romanian words are the owner's paste, verbatim, the patients
    // sentence's number aligned with its `value` (3000 for his 10000); the
    // other four languages are drafts. The reference's order: experience ·
    // patients · courses · interventions.
    stats: [
      {
        icon: 'experience',
        value: 10,
        suffix: '+',
        words: {
          ro: {
            label: 'Ani de experiență',
            description:
              'Punem grija, expertiza și empatia în fiecare detaliu.',
          },
          en: {
            label: 'Years of experience',
            description:
              'We put care, expertise and empathy into every detail.',
          },
          de: {
            label: 'Jahre Erfahrung',
            description:
              'Wir legen Sorgfalt, Fachwissen und Einfühlungsvermögen in jedes Detail.',
          },
          fr: {
            label: 'Années d’expérience',
            description:
              'Nous mettons le soin, l’expertise et l’empathie dans chaque détail.',
          },
          it: {
            label: 'Anni di esperienza',
            description:
              'Mettiamo cura, competenza ed empatia in ogni dettaglio.',
          },
        },
      },
      {
        icon: 'patients',
        value: 3000,
        suffix: '+',
        words: {
          ro: {
            label: 'Pacienți',
            description:
              'Peste 3000 de zâmbete îngrijite cu dedicare și profesionalism.',
          },
          en: {
            label: 'Patients',
            description:
              'More than 3000 smiles cared for with dedication and professionalism.',
          },
          de: {
            label: 'Patienten',
            description:
              'Über 3000 Lächeln, mit Hingabe und Professionalität betreut.',
          },
          fr: {
            label: 'Patients',
            description:
              'Plus de 3000 sourires soignés avec dévouement et professionnalisme.',
          },
          it: {
            label: 'Pazienti',
            description:
              'Oltre 3000 sorrisi curati con dedizione e professionalità.',
          },
        },
      },
      {
        icon: 'courses',
        value: 9,
        words: {
          ro: {
            label: 'Cursuri',
            description: 'Formare continuă în tehnici și tehnologii moderne.',
          },
          en: {
            label: 'Courses',
            description:
              'Continuing training in modern techniques and technologies.',
          },
          de: {
            label: 'Kurse',
            description:
              'Laufende Fortbildung in modernen Techniken und Technologien.',
          },
          fr: {
            label: 'Formations',
            description:
              'Formation continue aux techniques et technologies modernes.',
          },
          it: {
            label: 'Corsi',
            description:
              'Formazione continua in tecniche e tecnologie moderne.',
          },
        },
      },
      {
        icon: 'interventions',
        value: 1000,
        suffix: '+',
        words: {
          ro: {
            label: 'Intervenții',
            description:
              'Atenție la detalii, tehnologii moderne și o abordare personalizată pentru fiecare pacient.',
          },
          en: {
            label: 'Procedures',
            description:
              'Attention to detail, modern technology and a personalised approach for every patient.',
          },
          de: {
            label: 'Eingriffe',
            description:
              'Aufmerksamkeit für Details, moderne Technologien und ein individueller Ansatz für jeden Patienten.',
          },
          fr: {
            label: 'Interventions',
            description:
              'Le souci du détail, des technologies modernes et une approche personnalisée pour chaque patient.',
          },
          it: {
            label: 'Interventi',
            description:
              'Attenzione ai dettagli, tecnologie moderne e un approccio personalizzato per ogni paziente.',
          },
        },
      },
    ],
    words: {
      ro: {
        name: 'Dr. Elena Marin',
        position: 'Medic specialist ortodonție',
        // VERBATIM the PersonnelCard story fixture (2026-09-10), with D9's
        // `<k>` marks back in the source where D2 put them.
        philosophy:
          'Lucrez în <k>ortodonție</k> de peste zece ani și explic fiecare etapă a tratamentului. Consultația începe cu <k>ascultarea</k> pacientului, apoi construim împreună un plan potrivit.',
        // DRAFT (round 2, D17), the Romanian too — the TODO(owner) block.
        about: [
          'Dr. Elena Marin lucrează în clinică din 2018 și se ocupă de ortodonția copiilor și a adulților, cu aparate dentare fixe și cu gutiere transparente. Prima vizită începe cu o discuție despre ce îl deranjează pe pacient, continuă cu examinarea clinică și cu fotografiile dentare, iar la final medicul explică variantele de tratament și etapele fiecăreia.',
          'Își continuă formarea prin cursuri și congrese de specialitate: în 2023 a participat la Congresul Asociației Europene de Ortodonție de la Viena, iar în 2024 a urmat la București un curs despre gutierele transparente și unul de fotografie dentară digitală. Când un tratament ortodontic are nevoie și de alte specialități, stabilește planul împreună cu colegii din clinică, iar ordinea pașilor îi este explicată pacientului de la început.',
          'În afara clinicii, Elena Marin fotografiază natura și face drumeții pe munte. Vorbește română, engleză și franceză, așa că pacienții veniți din străinătate pot discuta cu ea direct în una dintre aceste limbi.',
        ],
      },
      en: {
        name: 'Dr. Elena Marin',
        position: 'Specialist in orthodontics',
        philosophy:
          'I have worked in <k>orthodontics</k> for over ten years and I explain every stage of the treatment. A consultation begins with <k>listening</k> to the patient, and then we build a suitable plan together.',
        about: [
          'Dr. Elena Marin has worked at the clinic since 2018 and provides orthodontic care for children and adults, with fixed braces and clear aligners. The first visit begins with a conversation about what troubles the patient, continues with a clinical examination and dental photographs, and ends with the doctor explaining the treatment options and the stages of each one.',
          'She continues her training through specialist courses and congresses: in 2023 she attended the European Orthodontic Society congress in Vienna, and in 2024 she took a clear aligner course and a digital dental photography course in Bucharest. When orthodontic treatment also needs other specialties, she draws up the plan together with her colleagues at the clinic, and the order of the steps is explained to the patient from the start.',
          'Outside the clinic, Elena Marin photographs nature and goes hiking in the mountains. She speaks Romanian, English and French, so patients who come from abroad can talk with her directly in one of these languages.',
        ],
      },
      de: {
        name: 'Dr. Elena Marin',
        position: 'Fachzahnärztin für Kieferorthopädie',
        philosophy:
          'Ich arbeite seit über zehn Jahren in der <k>Kieferorthopädie</k> und erkläre jeden Schritt der Behandlung. Die Beratung beginnt mit dem <k>Zuhören</k>, danach erstellen wir gemeinsam einen passenden Plan.',
        about: [
          'Dr. Elena Marin arbeitet seit 2018 in der Klinik und behandelt Kinder und Erwachsene kieferorthopädisch, mit festen Zahnspangen und transparenten Schienen. Der erste Besuch beginnt mit einem Gespräch darüber, was den Patienten stört, geht mit der klinischen Untersuchung und den Zahnfotos weiter und endet damit, dass die Ärztin die Behandlungsmöglichkeiten und ihre einzelnen Schritte erklärt.',
          'Sie bildet sich in Fachkursen und auf Kongressen weiter: 2023 nahm sie am Kongress der Europäischen Gesellschaft für Kieferorthopädie in Wien teil, 2024 besuchte sie in Bukarest einen Kurs über transparente Schienen und einen Kurs für digitale Dentalfotografie. Wenn eine kieferorthopädische Behandlung auch andere Fachgebiete braucht, erstellt sie den Plan gemeinsam mit ihren Kolleginnen und Kollegen in der Klinik, und dem Patienten wird die Reihenfolge der Schritte von Anfang an erklärt.',
          'Außerhalb der Klinik fotografiert Elena Marin die Natur und wandert in den Bergen. Sie spricht Rumänisch, Englisch und Französisch, sodass Patienten aus dem Ausland direkt in einer dieser Sprachen mit ihr sprechen können.',
        ],
      },
      fr: {
        name: 'Dr Elena Marin',
        position: 'Médecin spécialiste en orthodontie',
        philosophy:
          'Je travaille en <k>orthodontie</k> depuis plus de dix ans et j’explique chaque étape du traitement. La consultation commence par l’<k>écoute</k> du patient, puis nous construisons ensemble un plan adapté.',
        about: [
          'Dr Elena Marin exerce à la clinique depuis 2018 et prend en charge l’orthodontie des enfants et des adultes, avec des appareils fixes et des gouttières transparentes. La première visite commence par un échange sur ce qui gêne le patient, se poursuit par l’examen clinique et les photographies dentaires, puis la praticienne explique les options de traitement et les étapes de chacune.',
          'Elle poursuit sa formation par des cours et des congrès spécialisés : en 2023, elle a participé au congrès de la Société européenne d’orthodontie à Vienne, et en 2024 elle a suivi à Bucarest une formation aux gouttières transparentes et une formation en photographie dentaire numérique. Lorsqu’un traitement orthodontique fait appel à d’autres spécialités, elle établit le plan avec ses collègues de la clinique, et l’ordre des étapes est expliqué au patient dès le début.',
          'En dehors de la clinique, Elena Marin photographie la nature et fait de la randonnée en montagne. Elle parle roumain, anglais et français, ce qui permet aux patients venus de l’étranger d’échanger directement avec elle dans l’une de ces langues.',
        ],
      },
      it: {
        name: 'Dott.ssa Elena Marin',
        position: 'Medico specialista in ortodonzia',
        philosophy:
          'Lavoro in <k>ortodonzia</k> da oltre dieci anni e spiego ogni fase del trattamento. La visita inizia <k>ascoltando</k> il paziente, poi costruiamo insieme un piano adatto.',
        about: [
          'La Dott.ssa Elena Marin lavora nella clinica dal 2018 e si occupa di ortodonzia per bambini e adulti, con apparecchi fissi e mascherine trasparenti. La prima visita inizia con un colloquio su ciò che disturba il paziente, prosegue con l’esame clinico e le fotografie dentali e si conclude con la spiegazione delle opzioni di trattamento e delle fasi di ciascuna.',
          'Continua la sua formazione con corsi e congressi specialistici: nel 2023 ha partecipato al congresso della Società Europea di Ortodonzia a Vienna e nel 2024 ha seguito a Bucarest un corso sulle mascherine trasparenti e uno di fotografia dentale digitale. Quando un trattamento ortodontico richiede anche altre specialità, definisce il piano insieme ai colleghi della clinica e l’ordine delle fasi viene spiegato al paziente fin dall’inizio.',
          'Fuori dalla clinica, Elena Marin fotografa la natura e fa escursioni in montagna. Parla rumeno, inglese e francese, così i pazienti che arrivano dall’estero possono parlare con lei direttamente in una di queste lingue.',
        ],
      },
    },
  },
  {
    id: 'andrei-serban',
    cutout: CUTOUT_2,
    hours: [
      {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '10:00',
        closes: '18:00',
      },
      { days: ['Saturday'], opens: '09:00', closes: '13:00' },
    ],
    // Round 1's four lines with their „, YEAR" tails lifted into `year` (D17),
    // plus ONE row drafted in round 2 — the suturing workshop — so the 2022
    // group shows two lines — and FOUR more drafted in round 2g (D39), nine
    // rows over eight years.
    courses: [
      {
        year: 2025,
        words: {
          ro: 'Curs de implantologie ghidată digital, București',
          en: 'Digitally guided implantology course, Bucharest',
          de: 'Kurs für digital geführte Implantologie, Bukarest',
          fr: 'Formation en implantologie guidée numériquement, Bucarest',
          it: 'Corso di implantologia a guida digitale, Bucarest',
        },
      },
      {
        year: 2024,
        words: {
          ro: 'Curs de chirurgie ghidată și implantologie, Cluj-Napoca',
          en: 'Guided surgery and implantology course, Cluj-Napoca',
          de: 'Kurs für geführte Chirurgie und Implantologie, Cluj-Napoca',
          fr: 'Formation en chirurgie guidée et implantologie, Cluj-Napoca',
          it: 'Corso di chirurgia guidata e implantologia, Cluj-Napoca',
        },
      },
      {
        year: 2023,
        words: {
          ro: 'Congresul Societății Române de Chirurgie Orală, Cluj-Napoca',
          en: 'Romanian Society of Oral Surgery congress, Cluj-Napoca',
          de: 'Kongress der Rumänischen Gesellschaft für Oralchirurgie, Cluj-Napoca',
          fr: 'Congrès de la Société roumaine de chirurgie orale, Cluj-Napoca',
          it: 'Congresso della Società Romena di Chirurgia Orale, Cluj-Napoca',
        },
      },
      {
        year: 2022,
        words: {
          ro: 'Curs de extracții complexe și chirurgia molarilor de minte, Milano',
          en: 'Complex extractions and wisdom tooth surgery course, Milan',
          de: 'Kurs für komplexe Extraktionen und Weisheitszahnchirurgie, Mailand',
          fr: 'Formation aux extractions complexes et à la chirurgie des dents de sagesse, Milan',
          it: 'Corso di estrazioni complesse e chirurgia dei denti del giudizio, Milano',
        },
      },
      {
        year: 2022,
        words: {
          ro: 'Workshop de suturi și vindecare a plăgilor orale, Milano',
          en: 'Suturing and oral wound healing workshop, Milan',
          de: 'Workshop zu Nahttechniken und oraler Wundheilung, Mailand',
          fr: 'Atelier sur les sutures et la cicatrisation des plaies buccales, Milan',
          it: 'Workshop su suture e guarigione delle ferite orali, Milano',
        },
      },
      {
        year: 2021,
        words: {
          ro: 'Curs de regenerare osoasă și augmentare de creastă, Timișoara',
          en: 'Bone regeneration and ridge augmentation course, Timișoara',
          de: 'Kurs für Knochenregeneration und Kieferkammaufbau, Timișoara',
          fr: 'Formation en régénération osseuse et augmentation de crête, Timișoara',
          it: 'Corso di rigenerazione ossea e aumento di cresta, Timișoara',
        },
      },
      {
        year: 2020,
        words: {
          ro: 'Curs de sedare conștientă în stomatologie, Timișoara',
          en: 'Conscious sedation in dentistry course, Timișoara',
          de: 'Kurs für Sedierung bei Bewusstsein in der Zahnmedizin, Timișoara',
          fr: 'Formation à la sédation consciente en dentisterie, Timișoara',
          it: 'Corso di sedazione cosciente in odontoiatria, Timișoara',
        },
      },
      {
        year: 2019,
        words: {
          ro: 'Curs de extracție a molarilor de minte incluși, Iași',
          en: 'Impacted wisdom tooth extraction course, Iași',
          de: 'Kurs zur Entfernung retinierter Weisheitszähne, Iași',
          fr: 'Formation à l’extraction des dents de sagesse incluses, Iași',
          it: 'Corso di estrazione dei denti del giudizio inclusi, Iași',
        },
      },
      {
        year: 2018,
        words: {
          ro: 'Rezidențiat în chirurgie dento-alveolară, UMF „Grigore T. Popa”, Iași',
          en: 'Residency in dentoalveolar surgery, Grigore T. Popa University of Medicine and Pharmacy, Iași',
          de: 'Facharztweiterbildung für dentoalveoläre Chirurgie, Universität für Medizin und Pharmazie „Grigore T. Popa“, Iași',
          fr: 'Internat en chirurgie dento-alvéolaire, Université de médecine et de pharmacie « Grigore T. Popa », Iași',
          it: 'Specializzazione in chirurgia dento-alveolare, Università di medicina e farmacia «Grigore T. Popa», Iași',
        },
      },
    ],
    // DEMO numbers (D32), as Elena's: the owner's Romanian words once more,
    // written out again rather than shared, because a real doctor's tiles are
    // his own and an edit to one row must never reach the other — the
    // patients sentence's number aligned with this row's 2500.
    stats: [
      {
        icon: 'experience',
        value: 8,
        suffix: '+',
        words: {
          ro: {
            label: 'Ani de experiență',
            description:
              'Punem grija, expertiza și empatia în fiecare detaliu.',
          },
          en: {
            label: 'Years of experience',
            description:
              'We put care, expertise and empathy into every detail.',
          },
          de: {
            label: 'Jahre Erfahrung',
            description:
              'Wir legen Sorgfalt, Fachwissen und Einfühlungsvermögen in jedes Detail.',
          },
          fr: {
            label: 'Années d’expérience',
            description:
              'Nous mettons le soin, l’expertise et l’empathie dans chaque détail.',
          },
          it: {
            label: 'Anni di esperienza',
            description:
              'Mettiamo cura, competenza ed empatia in ogni dettaglio.',
          },
        },
      },
      {
        icon: 'patients',
        value: 2500,
        suffix: '+',
        words: {
          ro: {
            label: 'Pacienți',
            description:
              'Peste 2500 de zâmbete îngrijite cu dedicare și profesionalism.',
          },
          en: {
            label: 'Patients',
            description:
              'More than 2500 smiles cared for with dedication and professionalism.',
          },
          de: {
            label: 'Patienten',
            description:
              'Über 2500 Lächeln, mit Hingabe und Professionalität betreut.',
          },
          fr: {
            label: 'Patients',
            description:
              'Plus de 2500 sourires soignés avec dévouement et professionnalisme.',
          },
          it: {
            label: 'Pazienti',
            description:
              'Oltre 2500 sorrisi curati con dedizione e professionalità.',
          },
        },
      },
      {
        icon: 'courses',
        value: 9,
        words: {
          ro: {
            label: 'Cursuri',
            description: 'Formare continuă în tehnici și tehnologii moderne.',
          },
          en: {
            label: 'Courses',
            description:
              'Continuing training in modern techniques and technologies.',
          },
          de: {
            label: 'Kurse',
            description:
              'Laufende Fortbildung in modernen Techniken und Technologien.',
          },
          fr: {
            label: 'Formations',
            description:
              'Formation continue aux techniques et technologies modernes.',
          },
          it: {
            label: 'Corsi',
            description:
              'Formazione continua in tecniche e tecnologie moderne.',
          },
        },
      },
      {
        icon: 'interventions',
        value: 1500,
        suffix: '+',
        words: {
          ro: {
            label: 'Intervenții',
            description:
              'Atenție la detalii, tehnologii moderne și o abordare personalizată pentru fiecare pacient.',
          },
          en: {
            label: 'Procedures',
            description:
              'Attention to detail, modern technology and a personalised approach for every patient.',
          },
          de: {
            label: 'Eingriffe',
            description:
              'Aufmerksamkeit für Details, moderne Technologien und ein individueller Ansatz für jeden Patienten.',
          },
          fr: {
            label: 'Interventions',
            description:
              'Le souci du détail, des technologies modernes et une approche personnalisée pour chaque patient.',
          },
          it: {
            label: 'Interventi',
            description:
              'Attenzione ai dettagli, tecnologie moderne e un approccio personalizzato per ogni paziente.',
          },
        },
      },
    ],
    words: {
      ro: {
        name: 'Dr. Andrei Șerban',
        position: 'Medic dentist, chirurgie orală',
        // VERBATIM the PersonnelCard story fixture (2026-09-10).
        philosophy:
          'Mă ocup de <k>chirurgie orală</k>: extracții și mici intervenții. Înainte de fiecare procedură explic pașii și răspund la întrebări, iar <k>controlul</k> de după se programează la o săptămână.',
        // DRAFT (round 2, D17), the Romanian too — the TODO(owner) block.
        about: [
          'Dr. Andrei Șerban lucrează în clinică din 2019 și se ocupă de chirurgia orală: extracții, inclusiv ale molarilor de minte, și intervenții mici la nivelul gingiei și al osului. La prima vizită, medicul examinează zona, analizează radiografia și explică pe rând ce presupune intervenția, cât durează și ce urmează după ea.',
          'Își completează formarea prin cursuri de specialitate: la Cluj-Napoca a urmat un curs de chirurgie ghidată și implantologie, iar la Milano un curs despre extracțiile complexe și un workshop despre suturi. Când o extracție face parte dintr-un plan care include și alte tratamente, lucrează împreună cu colegii din ortodonție și din protetică, iar etapele se stabilesc înainte de începerea tratamentului.',
          'În timpul liber, Andrei Șerban aleargă și merge cu bicicleta. Vorbește română, engleză și italiană, o limbă pe care a exersat-o în timpul cursurilor de la Milano.',
        ],
      },
      en: {
        name: 'Dr. Andrei Șerban',
        position: 'Dentist, oral surgery',
        philosophy:
          'I work in <k>oral surgery</k>: extractions and minor procedures. Before each procedure I explain the steps and answer questions, and the <k>check-up</k> afterwards is booked for a week later.',
        about: [
          'Dr. Andrei Șerban has worked at the clinic since 2019 and practises oral surgery: extractions, wisdom teeth included, and minor procedures on the gums and the bone. At the first visit, the doctor examines the area, reviews the X-ray and explains one by one what the procedure involves, how long it takes and what follows afterwards.',
          'He keeps up his training through specialist courses: in Cluj-Napoca he took a guided surgery and implantology course, and in Milan a course on complex extractions and a workshop on suturing. When an extraction is part of a plan that includes other treatments, he works together with his colleagues in orthodontics and prosthodontics, and the stages are set before the treatment begins.',
          'In his free time, Andrei Șerban runs and cycles. He speaks Romanian, English and Italian, a language he practised during his courses in Milan.',
        ],
      },
      de: {
        name: 'Dr. Andrei Șerban',
        position: 'Zahnarzt, Oralchirurgie',
        philosophy:
          'Ich arbeite in der <k>Oralchirurgie</k>: Extraktionen und kleine Eingriffe. Vor jedem Eingriff erkläre ich die Schritte und beantworte Fragen, und die <k>Nachkontrolle</k> wird für eine Woche später vereinbart.',
        about: [
          'Dr. Andrei Șerban arbeitet seit 2019 in der Klinik und ist in der Oralchirurgie tätig: Extraktionen, auch von Weisheitszähnen, und kleine Eingriffe an Zahnfleisch und Knochen. Beim ersten Besuch untersucht der Arzt den Bereich, wertet das Röntgenbild aus und erklärt nacheinander, was der Eingriff umfasst, wie lange er dauert und was danach folgt.',
          'Er bildet sich in Fachkursen weiter: In Cluj-Napoca besuchte er einen Kurs für geführte Chirurgie und Implantologie, in Mailand einen Kurs über komplexe Extraktionen und einen Workshop zu Nahttechniken. Wenn eine Extraktion Teil eines Plans mit weiteren Behandlungen ist, arbeitet er mit den Kolleginnen und Kollegen aus Kieferorthopädie und Prothetik zusammen, und die Schritte werden vor Beginn der Behandlung festgelegt.',
          'In seiner Freizeit läuft Andrei Șerban und fährt Rad. Er spricht Rumänisch, Englisch und Italienisch, eine Sprache, die er während seiner Kurse in Mailand geübt hat.',
        ],
      },
      fr: {
        name: 'Dr Andrei Șerban',
        position: 'Chirurgien-dentiste, chirurgie orale',
        philosophy:
          'Je m’occupe de <k>chirurgie orale</k> : extractions et petites interventions. Avant chaque intervention, j’explique les étapes et je réponds aux questions, et le <k>contrôle</k> qui suit est prévu une semaine plus tard.',
        about: [
          'Dr Andrei Șerban exerce à la clinique depuis 2019 et se consacre à la chirurgie orale : extractions, dents de sagesse comprises, et petites interventions sur la gencive et l’os. Lors de la première visite, le praticien examine la zone, analyse la radiographie et explique point par point en quoi consiste l’intervention, combien de temps elle dure et ce qui suit.',
          'Il poursuit sa formation par des cours spécialisés : à Cluj-Napoca, il a suivi une formation en chirurgie guidée et implantologie, et à Milan une formation aux extractions complexes ainsi qu’un atelier sur les sutures. Lorsqu’une extraction fait partie d’un plan qui comprend d’autres traitements, il travaille avec ses collègues en orthodontie et en prothèse, et les étapes sont fixées avant le début du traitement.',
          'Pendant son temps libre, Andrei Șerban court et fait du vélo. Il parle roumain, anglais et italien, une langue qu’il a pratiquée pendant ses formations à Milan.',
        ],
      },
      it: {
        name: 'Dott. Andrei Șerban',
        position: 'Odontoiatra, chirurgia orale',
        philosophy:
          'Mi occupo di <k>chirurgia orale</k>: estrazioni e piccoli interventi. Prima di ogni procedura spiego i passaggi e rispondo alle domande, e il <k>controllo</k> successivo viene fissato a una settimana.',
        about: [
          'Il Dott. Andrei Șerban lavora nella clinica dal 2019 e si occupa di chirurgia orale: estrazioni, compresi i denti del giudizio, e piccoli interventi su gengiva e osso. Alla prima visita il medico esamina la zona, valuta la radiografia e spiega passo per passo in che cosa consiste l’intervento, quanto dura e che cosa succede dopo.',
          'Continua la sua formazione con corsi specialistici: a Cluj-Napoca ha seguito un corso di chirurgia guidata e implantologia, a Milano un corso sulle estrazioni complesse e un workshop sulle suture. Quando un’estrazione fa parte di un piano che comprende altri trattamenti, lavora insieme ai colleghi di ortodonzia e di protesi e le fasi vengono stabilite prima dell’inizio del trattamento.',
          'Nel tempo libero Andrei Șerban corre e va in bicicletta. Parla rumeno, inglese e italiano, una lingua che ha praticato durante i corsi a Milano.',
        ],
      },
    },
  },
];

/**
 * The doctor a URL segment names, against the SHIPPED list (run ledger D3).
 * The page's WALK does not call it — `generateStaticParams` maps `doctors`
 * itself and the populator searches the list it was handed — so its callers
 * are the doctor route's `generateMetadata`, tools, stories and tests, for
 * which "the real Elena" is exactly the lookup they want. `undefined` means
 * nobody wears that id, which on the built site cannot happen:
 * `dynamicParams = false` means only the emitted slugs exist as files.
 */
export function findDoctor(id: string): Doctor | undefined {
  return doctors.find((doctor) => doctor.id === id);
}

/**
 * The auxiliary member an id names, against the SHIPPED list. Its callers are
 * `findDoctor`'s kind — tools, stories and tests that want "the real Ioana" —
 * and never the Team page's walk, which prints `auxiliaries` in order. It
 * outlived the assistant pairs it was first written to resolve (run ledger
 * D13) because a lookup by id is still the natural way for a test to name a
 * person. `undefined` means nobody wears that id.
 */
export function findAuxiliary(id: string): AuxiliaryMember | undefined {
  return auxiliaries.find((member) => member.id === id);
}

/**
 * A doctor's course rows grouped by year, for ONE language (run ledger D17 —
 * the doctor page's courses band prints one heading per group, D15).
 *
 * YEARS DESCENDING, newest first: the band reads like the top of a CV, what
 * the doctor learned lately before what the doctor learned first. INSIDE a
 * year, the FILE's order: two courses of one year have no order of their own
 * except the one written here.
 *
 * It does not trust the file's order to do the grouping. The data test pins
 * the rows newest → oldest, which keeps the file readable, but a row pasted in
 * out of place must still land under its OWN year — once, and not as a second
 * heading for the same year further down the page (the band keys its groups
 * by the year). So one pass collects each year's lines into a Map in file
 * order — a Map keeps insertion order, which is exactly "the file's order
 * inside a year" — and only the distinct YEARS are sorted afterwards, as a
 * fresh array. `doctor.courses` is never sorted and never touched: a
 * `readonly` array sorted in place would be a data change hiding inside a
 * read, and every page built after it in the same process would inherit it.
 *
 * A doctor with no rows gets `[]` — no groups, so the band renders nothing
 * (D15). Pure: everything is built per call from the two arguments, so two
 * calls agree.
 */
export function coursesByYear(
  doctor: Doctor,
  locale: Locale,
): readonly CourseGroup[] {
  const byYear = new Map<number, string[]>();
  for (const course of doctor.courses) {
    const line = course.words[locale];
    const lines = byYear.get(course.year);
    if (lines === undefined) byYear.set(course.year, [line]);
    else lines.push(line);
  }
  return [...byYear]
    .sort(([newer], [older]) => older - newer)
    .map(([year, courses]) => ({ year, courses }));
}

/**
 * One piece of a `philosophy` sentence: plain text, or a key word. The NAME is
 * round 1's (the field was `about` then, run ledger D17) and is kept on
 * purpose: this type is ui/Keyword's `KeywordSegment`'s structural twin, and
 * the pin between the two — in app/[locale]/team/populate.test.ts, the one
 * tier that may import BOTH (`expectTypeOf<AboutSegment>().toEqualTypeOf<
 * KeywordSegment>()`) — names it. It is deliberately NOT imported from
 * ui/Keyword: lib never imports ui (§4's dependency direction), and
 * ui/Keyword's own suite knows nothing about this module.
 */
export type AboutSegment = Readonly<{ text: string; keyword: boolean }>;

/**
 * Built per call, never shared. A `g` regex carries `lastIndex` between uses,
 * and a pure function whose second call disagreed with its first would be the
 * worst kind of bug to find in a page that renders five languages.
 *
 * THE CAPTURE IS TEMPERED — `(?:(?!<\/?k>)[\s\S])*?` rather than `[\s\S]*?` —
 * so a pair can never swallow a mark: the inner group refuses to consume a
 * position where `<k>` or `</k>` begins, which means only a `<k>…</k>` with no
 * mark of any kind between its ends is a match. That is what makes the residue
 * check below total (G2 typescript, 2026-09-21): with a plain lazy capture
 * „Text <k>foo <k>bar</k> more." matched from the FIRST `<k>` to the only
 * `</k>`, ate the second opening tag into the key word, left a clean residue
 * and shipped a visible `<k>` to a patient.
 */
const keywordTag = (): RegExp => /<k>((?:(?!<\/?k>)[\s\S])*?)<\/k>/g;

/**
 * Any `<k>` or `</k>` left over once the balanced pairs are removed — in
 * EITHER case: `keywordTag` matches lowercase pairs only, so an upper-case
 * `<K>…</K>` is refused here rather than shipped to a patient as text (the
 * data test's `KEYWORD_MARK` is `/i` for the same reason; G2-R2 tier 1,
 * typescript F1).
 */
const STRAY_TAG = /<\/?k>/i;

/**
 * „Lucrez în <k>ortodonție</k> de…" → `[{ text: 'Lucrez în ', keyword: false },
 * { text: 'ortodonție', keyword: true }, …]` — the segments ui/Keyword's
 * `Keywords` turns into text and `<b>` fragments (run ledger D2: the marks are
 * authored beside the person now, and split HERE instead of by next-intl's
 * `t.rich`). Its input is a doctor's `philosophy` (D17), the one field that
 * carries marks, split for the doctor card's quote and for the doctor page's
 * credo card (D12) alike.
 *
 * A piece with no text is dropped — the empty lead of a sentence that opens on
 * a key word, the empty gap between two adjacent tags, and an empty
 * `<k></k>` alike: there is nothing to render, and a segment nobody can see
 * would only make the consumer's `key={index}` lie.
 *
 * ANY MARK THAT IS NOT PART OF A FLAT, BALANCED PAIR THROWS, naming the text.
 * The data test calls this function on every `philosophy` in every locale, so
 * the throw is what a typo hits in CI; it exists at runtime as well because a
 * `string` field cannot be checked by the compiler, and a stray tag would
 * otherwise reach the page as a visible `<k>`. The check is exhaustive because
 * the matcher above is TEMPERED: every mark a match consumes is one of that
 * pair's own two ends, so a doubled opening tag, a nested pair, a half-open
 * tag and a lone `</k>` all survive into the residue, where `STRAY_TAG` sees
 * them.
 */
export function splitKeywords(philosophy: string): readonly AboutSegment[] {
  if (STRAY_TAG.test(philosophy.replace(keywordTag(), ''))) {
    throw new Error(
      `lib/team: unbalanced <k> in ${JSON.stringify(philosophy)} — every <k> needs its </k>, and the pairs never nest.`,
    );
  }

  const segments: AboutSegment[] = [];
  const push = (text: string, keyword: boolean): void => {
    if (text !== '') segments.push({ text, keyword });
  };

  let cursor = 0;
  for (const match of philosophy.matchAll(keywordTag())) {
    push(philosophy.slice(cursor, match.index), false);
    push(match[1], true);
    cursor = match.index + match[0].length;
  }
  push(philosophy.slice(cursor), false);

  return segments;
}
