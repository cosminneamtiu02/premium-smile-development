import type { Locale } from '../../i18n/locales';
import type { OpeningHours } from '../clinic/clinic';
import type { ImagePath } from '../image-path/image-path';

// lib/team — THE clinic's people: every doctor and every auxiliary member,
// their pictures, their week, their courses, their numbers and their words in
// all five languages — and, since 2026-10-01, the numbers of the clinic as a
// whole (`clinicStats`, the Home and Team pages' „în cifre" band). Site DATA in §4's
// foundation ring (the lib/clinic, lib/prices,
// lib/reviews and lib/hero-slides precedents): one file every consumer reads,
// nothing fetched, nothing mutated, React-free (fenced by
// tests/unit/lib-react-free.test.ts). The Team page, the per-doctor page and —
// since 2026-09-30 — the Home page's doctors band (since 2026-10-01 its
// numbers band too) are built from DUMB bands
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
// app/[locale]/team/stat-tiles.tsx, the ONE module the doctor, Team and Home
// pages and their three story twins import (G2-R2 tier 3: the two
// hand-twinned copies became one; it moved up from [slug]/ when the Team
// and Home pages began to draw tiles, 2026-10-01) — exhaustive by type, so a
// fifth id written here is a compile error there until somebody draws it.
// sections/DoctorStats itself takes a finished ReactNode per tile and imports
// no glyph (its D30 paragraph), which is what keeps the band DUMB; the
// exhaustiveness therefore rests on that one app-tier annotation staying
// `Record` (G2-R2 tier 1, typescript F2). One tile per drawing: the data test
// holds the icons unique per doctor (and in `clinicStats`), because two tiles
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
// together, or CI goes red. The owner's paste said „Peste 10000"; every row
// says its own `value` instead (3200, 2600, …), written unseparated the way
// he wrote his, which all five languages allow at four digits. The tile's
// number above the sentence prints the grouped form („3.000+" in ro); making
// the two spellings identical is a text edit the test accepts either way.
//
// ── TODO(owner): REAL DOCTORS, PLACEHOLDER DETAILS ─────────────────────────
// Since 2026-09-30 the six doctors below are the clinic's REAL doctors, in
// the owner's order, each name and specialty as he gave them: "these are non
// fictopnal and need to make up the actual list of doctors from the clinic,
// not dummy ones as so far". Two edits are Claude's and are flagged for his
// confirmation: the Romanian diacritics added to Ivașcu, Cătălina, Opriș and
// Horațiu (the list was typed with almost none — only „Sabău" carried its
// own; a name spelled without them on the person's own papers loses them here
// again), and ONE shape for every specialty, „Medic specialist în …" (his
// first line read „medic specialist protetică dentară și specialist în
// parodontologie"). His fourth line says „ortodonție și ortopedie facială",
// kept as written; the specialty's official name is „ortodonție și ortopedie
// dento-facială".
//
// EVERYTHING ELSE ABOUT THEM IS A RANDOM PLACEHOLDER, on his word of the same
// day ("what you do not have info yet, generate random"): the pictures (the
// demo silhouettes, handed out in list order), the weeks (each inside
// lib/clinic's own week), the course rows and their years, the four „în
// cifre" numbers, the `philosophy` quotes and the three `about` paragraphs,
// in all five languages, the Romanian included. None of it is a claim about
// the person it sits beside. So that none of it reads as one (the copy review
// of 2026-09-30): the placeholders name no university, society or congress,
// no year of joining the clinic and no hobby; a residency row carries no city,
// because a residency plus a city names a university in effect; what a first
// paragraph says a doctor does is on the clinic's own tariff (lib/prices), and
// nothing the price list does not offer — no aligners, no removable
// appliances, no ceramic veneers; and each doctor's third paragraph is
// practical advice for patients. They still agree with their own rows, so the
// page never contradicts itself while it waits: a `courses` tile counts the
// rows exactly and every week lies inside the clinic's (tests/unit/
// team-data.test.ts pins both), and — by how they were written, not by any
// test — an experience tile never outruns the doctor's earliest row and the
// courses a second paragraph names are rows of the list. Before launch every
// one of them is replaced by what each doctor confirms, together with each
// doctor's consent to being named, pictured and described (a name plus a face
// plus a biography is personal data; the lib/reviews consent precedent).
//
// NOBODY IS GENDERED. The owner gave names and specialties, not pronouns, and
// a name does not say how a person is referred to, so every text below is
// written without it: no pronoun for a doctor in any of the five languages,
// the honorific „Dr." in Italian as well, the German position as
// „Fachrichtung …" rather than „Fachzahnärztin für …" or „Fachzahnarzt für …",
// and the French and Italian positions as „Spécialiste en …" / „Specialista
// in …" — epicene nouns, and the right ones: in France and Italy a dentist is
// not a « médecin » or a „medico", so the Romanian „medic" is not carried
// over (the copy review of 2026-09-30). Italian paragraphs open with a null
// subject („Lavora in clinica …", under the band's „{name} in breve" title),
// because Italian prose wants an article before a title and the article is
// gendered. The gendered forms are one edit per row once the owner confirms
// each doctor's. Where Romanian agrees a word with the noun „medic"
// („specializat"), the agreement is the noun's, as in the owner's own second
// line.
//
// THE AUXILIARY STAFF ARE REAL since 2026-10-01, on the owner's word: "these
// are just the 3 standard personell cards. one of them is Stan
// Ioana-Ecaterina as registrator medical, Gurgu Aurelia as assistant so
// instead of Mihaela Crăciun and Cândea Angelica instead of Ana-Maria Dobre".
// Each person took the card the owner named, so the grid keeps the demo's
// order: Stan Ioana Ecaterina on Ioana Țepeș's card (the one left), Gurgu
// Aurelia on Mihaela Crăciun's, Cândea Angelica on Ana-Maria Dobre's, whose
// reception wording the owner confirmed the same day ("role is good already
// to what was before. receptionist, schedulings, etc"). The NAMES are the
// owner's, surname first as typed (the doctors' order, the diacritics the
// owner's own), the first one WITHOUT the hyphen the first message carried,
// on the owner's second word ("for ioana use just stan ioana ecaterina"): as
// „Ioana-Ecaterina" it broke into „Stan Ioana-" / „Ecaterina" at every width.
// The portraits are still the demo silhouettes, and the consent the doctors
// owe (above) is owed for the staff as well.
//
// THE STAFF'S TITLES ARE FEMININE, on the owner's word of the same day ("use
// feminine … and you translate job titels"): the confirmation NOBODY IS
// GENDERED above waits for, given for the staff, while every doctor still
// waits for it. „Registratoare medicală" and „Asistentă medicală", and in the
// other four languages the feminine JOB TITLES, translated by Claude on that
// word: German „Medizinische Rezeptionistin" and „Zahnmedizinische
// Fachangestellte", French „Secrétaire médicale" and „Assistante dentaire",
// Italian „Segretaria medica" and „Assistente di studio odontoiatrico" (an
// epicene noun, like both English titles). The reception card's wording
// names a role, not a person, and reads the same in every language.
//
// The stats' WORDS are the owner's, pasted from his reference site in round
// 2f (D32), and three of them were CMSR-SENSITIVE — „Intervenții reușite" and
// „Rezultate predictibile și sigure, …" described OUTCOMES (a count of
// successes, safety), „Recunoaștere pentru inovație, calitate și grijă
// autentică." asserted a recognition somebody must actually have given.
// REWRITTEN on 2026-09-27 (round 2s, the owner: "these are very sensible. add
// a step for checking for illegal guarantees or things aiming in that
// direction") to descriptive copy — „Intervenții", „Atenție la detalii,
// tehnologii moderne și …", „Formare continuă în tehnici și tehnologii
// moderne." — in all five languages, and tests/unit/cmsr-scan.test.ts now
// REFUSES the old shapes: a result promise, a success count, an undocumented
// award. A real award the clinic can document goes into that file's ALLOWED
// list verbatim, with the document named in the ledger. Every doctor wears
// the same four sentences, written out per doctor rather than shared: a real
// doctor's tiles are that doctor's own, and an edit to one row must never
// reach another. Only the numbers differ, and a real number is a claim about
// a real person that must be countable from the clinic's own records.
//
// THE OTHER FOUR LANGUAGES ARE DRAFTS (§15.17). Every EN/DE/FR/IT string below
// was written by Claude, translated faithfully from the Romanian, and is
// FLAGGED FOR THE OWNER'S CONFIRMATION — the shape the reviews, prices and
// hero lanes all ship in — the six specialties included. That includes the
// stats' labels and sentences of round 2f (D32), kept as close to the owner's
// Romanian as each language allows, so that he judges ONE text in five
// languages rather than five different texts. The honorific follows the
// language and never the person (NOBODY IS GENDERED, above): „Dr." in
// ro/de/en/it, „Dr" in fr, French dropping the point on a contraction that
// ends in its word's last letter. City names are translated where the
// language has its own („București" → Bucharest/Bukarest/Bucarest), and never
// where it does not (Cluj-Napoca, Sibiu, Timișoara, Iași). A course's year
// belongs to no language at all: it is its row's fact, stored once (the
// COURSES paragraph above), so no translation can disagree about one. A
// number INSIDE an `about` paragraph is written five times, once per
// language, and tests/unit/team-data.test.ts holds the five to the same
// numbers.
//
// CMSR, the same rule lib/prices states: descriptive, never superlative, never
// a promise, never a comparison. A `philosophy` says how a doctor works; an
// `about` says since when, on what, how a first visit goes and how the doctor
// keeps learning. Neither claims an outcome — no „cel mai", no „garantat", no
// „fără durere", nor their equivalent in any of the other four languages. A
// stat's `label` and `description` were the one place that did, in the
// owner's own words, until the rewrite of 2026-09-27 (the TODO(owner) block
// above); beyond them the type has no field a testimonial or a guarantee
// could hide in. CMSR is an AUTHORING RULE, the owner's — and,
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
// nothing about its shape. A doctor's week is the doctor's own, not the
// clinic's — four mornings for one, three afternoons and a morning for
// another — which is the reason this field exists at all rather than the page
// reading `clinic.hours`. Every week below sits inside lib/clinic's own week,
// and tests/unit/team-data.test.ts holds it there: a doctor's hours outside
// the clinic's would send a patient to a closed door.
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
  /** Name WITH the language's honorific („Dr. Toma Lucian" · „Dr Toma Lucian" in fr). */
  name: string;
  /** The specialty, sentence case — ui/Eyebrow uppercases it („Medic specialist în parodontologie"). */
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
 * Which drawing a stat tile's disc shows (run ledger D30, D32) — an ID, never
 * a component: lib is React-free, so the PAGES own the map from these four to
 * their glyphs (`STAT_ICONS` in app/[locale]/team/stat-tiles.tsx, shared by
 * the doctor, Team and Home pages and their three story twins),
 * exhaustively; the band takes a finished ReactNode. A fifth id is a compile
 * error in that map before it is ever a tile.
 */
export type StatIcon = 'experience' | 'patients' | 'courses' | 'interventions';

/** The translated part of one stat tile — every locale, or it does not compile. */
export type StatWords = Readonly<{
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
 * One tile of an „în cifre" band (run ledger D30, D32): the lib/prices row
 * shape once more — the FACT once (`value`, `suffix`), the finished words in
 * all five languages beside it. A doctor's rows are `Doctor.stats` (his page);
 * the clinic's own are `clinicStats` below (the Home and Team pages, owner
 * 2026-10-01).
 * Named for what it is, not whose it is: until that day it was `DoctorStat`.
 */
export type Stat = Readonly<{
  /** Which of the four drawings sits in the tile's disc — unique per list. */
  icon: StatIcon;
  /** The final number, an integer ≥ 0 (the band counts up to it, D31). */
  value: number;
  /** Printed after the number — "+" for "at least"; absent for an exact count. */
  suffix?: '+';
  /** The tile's title and its one sentence, all five languages. */
  words: Readonly<Record<Locale, StatWords>>;
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
  stats: readonly Stat[];
  /** Name, position, philosophy and the about paragraphs in all five locales. */
  words: Readonly<Record<Locale, DoctorWords>>;
}>;

// The committed demo pictures. The three portraits are the PersonnelCard
// lane's fixtures (600 × 800, the one team ratio); the two cutouts were
// generated for the doctor-pages run (900 × 1200, alpha, obviously
// placeholders). People share pictures on purpose — nine people, three demo
// portraits, two demo cutouts — so the data test must never demand unique
// pictures.
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
  // The clinic's three, each on the card the owner named (2026-10-01). The
  // NAMES and the ROLES are the owner's, the titles feminine on the owner's
  // word; the portraits are the demo silhouettes — the header's THE AUXILIARY
  // STAFF ARE REAL and THE STAFF'S TITLES ARE FEMININE paragraphs.
  {
    id: 'stan-ioana-ecaterina',
    portrait: PORTRAIT_2,
    words: {
      ro: { name: 'Stan Ioana Ecaterina', position: 'Registratoare medicală' },
      en: { name: 'Stan Ioana Ecaterina', position: 'Medical receptionist' },
      de: {
        name: 'Stan Ioana Ecaterina',
        position: 'Medizinische Rezeptionistin',
      },
      fr: { name: 'Stan Ioana Ecaterina', position: 'Secrétaire médicale' },
      it: { name: 'Stan Ioana Ecaterina', position: 'Segretaria medica' },
    },
  },
  {
    id: 'gurgu-aurelia',
    portrait: PORTRAIT_1,
    words: {
      ro: { name: 'Gurgu Aurelia', position: 'Asistentă medicală' },
      en: { name: 'Gurgu Aurelia', position: 'Dental nurse' },
      de: {
        name: 'Gurgu Aurelia',
        position: 'Zahnmedizinische Fachangestellte',
      },
      fr: { name: 'Gurgu Aurelia', position: 'Assistante dentaire' },
      it: {
        name: 'Gurgu Aurelia',
        position: 'Assistente di studio odontoiatrico',
      },
    },
  },
  {
    id: 'candea-angelica',
    portrait: PORTRAIT_3,
    words: {
      ro: {
        name: 'Cândea Angelica',
        position: 'Recepție, programări și comunicarea cu pacienții',
      },
      en: {
        name: 'Cândea Angelica',
        position: 'Reception, appointments and patient communication',
      },
      de: {
        name: 'Cândea Angelica',
        // „Patientenbetreuung" (18) rather than „Patientenkommunikation" (22):
        // the mono eyebrow never hyphenates (PersonnelCard D5), and that word
        // broke the 21-character ceiling tests/unit/team-data.test.ts now
        // holds every position to (G2 a11y, 2026-09-21).
        position: 'Empfang, Terminvergabe und Patientenbetreuung',
      },
      fr: {
        name: 'Cândea Angelica',
        position: 'Accueil, rendez-vous et communication avec les patients',
      },
      it: {
        name: 'Cândea Angelica',
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
  // The owner's six, in his order (2026-09-30). The NAME and the SPECIALTY of
  // each are real; every other field is a random placeholder — the header's
  // TODO(owner) block says what that covers and what replaces it.
  {
    id: 'malea-sabau-oana-bianca',
    cutout: CUTOUT_1,
    hours: [
      {
        days: ['Monday', 'Wednesday', 'Friday'],
        opens: '09:00',
        closes: '15:00',
      },
      { days: ['Tuesday'], opens: '13:00', closes: '19:00' },
    ],
    courses: [
      {
        year: 2025,
        words: {
          ro: 'Curs de reabilitare protetică pe implanturi, București',
          en: 'Implant-supported prosthetic rehabilitation course, Bucharest',
          de: 'Kurs für implantatgetragene prothetische Versorgung, Bukarest',
          fr: 'Formation en réhabilitation prothétique sur implants, Bucarest',
          it: 'Corso di riabilitazione protesica su impianti, Bucarest',
        },
      },
      {
        year: 2023,
        words: {
          ro: 'Curs de chirurgie plastică parodontală, Cluj-Napoca',
          en: 'Periodontal plastic surgery course, Cluj-Napoca',
          de: 'Kurs für plastische Parodontalchirurgie, Cluj-Napoca',
          fr: 'Formation en chirurgie plastique parodontale, Cluj-Napoca',
          it: 'Corso di chirurgia plastica parodontale, Cluj-Napoca',
        },
      },
      // Two rows in ONE year on purpose — the case the courses band has to lay
      // out (two lines under one year heading), kept from the demo rows.
      {
        year: 2023,
        words: {
          ro: 'Curs de restaurări protetice din zirconiu, Sibiu',
          en: 'Course on zirconia prosthetic restorations, Sibiu',
          de: 'Kurs für prothetische Versorgungen aus Zirkon, Sibiu',
          fr: 'Formation aux restaurations prothétiques en zircone, Sibiu',
          it: 'Corso di restauri protesici in zirconia, Sibiu',
        },
      },
      {
        year: 2019,
        words: {
          ro: 'Curs de tratament parodontal nechirurgical, Timișoara',
          en: 'Non-surgical periodontal treatment course, Timișoara',
          de: 'Kurs für nichtchirurgische Parodontalbehandlung, Timișoara',
          fr: 'Formation au traitement parodontal non chirurgical, Timișoara',
          it: 'Corso di trattamento parodontale non chirurgico, Timișoara',
        },
      },
      {
        year: 2017,
        words: {
          ro: 'Rezidențiat în parodontologie',
          en: 'Residency in periodontics',
          de: 'Fachzahnärztliche Weiterbildung in Parodontologie',
          fr: 'Spécialisation en parodontologie',
          it: 'Specializzazione in parodontologia',
        },
      },
      {
        year: 2012,
        words: {
          ro: 'Rezidențiat în protetică dentară',
          en: 'Residency in prosthodontics',
          de: 'Fachzahnärztliche Weiterbildung in Prothetik',
          fr: 'Spécialisation en prothèse dentaire',
          it: 'Specializzazione in protesi dentaria',
        },
      },
    ],
    stats: [
      {
        icon: 'experience',
        value: 14,
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
        value: 3200,
        suffix: '+',
        words: {
          ro: {
            label: 'Pacienți',
            description:
              'Peste 3200 de zâmbete îngrijite cu dedicare și profesionalism.',
          },
          en: {
            label: 'Patients',
            description:
              'More than 3200 smiles cared for with dedication and professionalism.',
          },
          de: {
            label: 'Patienten',
            description:
              'Über 3200 Lächeln, mit Hingabe und Professionalität betreut.',
          },
          fr: {
            label: 'Patients',
            description:
              'Plus de 3200 sourires soignés avec dévouement et professionnalisme.',
          },
          it: {
            label: 'Pazienti',
            description:
              'Oltre 3200 sorrisi curati con dedizione e professionalità.',
          },
        },
      },
      {
        icon: 'courses',
        value: 6,
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
        value: 2400,
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
        name: 'Dr. Malea (Sabău) Oana Bianca',
        position: 'Medic specialist în protetică dentară și parodontologie',
        philosophy:
          'Înainte de orice lucrare protetică verific <k>sănătatea gingiei</k>, pentru că pe ea se sprijină tot restul. Planul îl stabilim împreună, iar fiecare etapă o <k>explic</k> înainte să începem.',
        about: [
          'Dr. Malea lucrează în clinică și se ocupă de lucrările protetice și de tratamentul bolilor gingiei: coroane, punți și proteze, dar și igienizări și tratamente parodontale. Prima vizită începe cu o discuție despre ce îl deranjează pe pacient, continuă cu examinarea dinților și a gingiilor, iar la final medicul explică variantele de tratament și ordinea etapelor.',
          'Formarea continuă face parte din munca de zi cu zi: în ultimii ani, Dr. Malea a urmat cursuri de reabilitare protetică pe implanturi și de chirurgie plastică parodontală. Când un plan de tratament are nevoie și de alte specialități, se stabilește împreună cu colegii din chirurgie, endodonție și ortodonție, iar pacientul află de la început ce presupune fiecare etapă.',
          'La prima programare este util ca pacientul să aducă radiografiile mai vechi și lista medicamentelor pe care le ia. Controalele de după finalizarea unei lucrări protetice se stabilesc de la început, pentru ca atât lucrarea, cât și sănătatea gingiei să fie urmărite în timp.',
        ],
      },
      en: {
        name: 'Dr. Malea (Sabău) Oana Bianca',
        position: 'Specialist in prosthodontics and periodontics',
        philosophy:
          'Before any prosthetic work I check the <k>health of the gums</k>, because everything else rests on them. We draw up the plan together, and I <k>explain</k> each stage before we begin.',
        about: [
          'Dr. Malea works at the clinic, carrying out prosthetic work and treating gum disease: crowns, bridges and dentures, as well as professional cleaning and periodontal treatments. The first visit begins with a conversation about what troubles the patient, continues with an examination of the teeth and gums, and ends with the doctor explaining the treatment options and the order of the stages.',
          'Continuing training is part of everyday work: in recent years, Dr. Malea has taken courses in implant-supported prosthetic rehabilitation and in periodontal plastic surgery. When a treatment plan also needs other specialties, it is drawn up together with colleagues in surgery, endodontics and orthodontics, and the patient learns from the start what each stage involves.',
          'For the first appointment, it helps to bring any earlier X-rays and a list of current medication. Check-ups after a prosthetic treatment are scheduled from the start, so that both the restoration and the health of the gums are followed over time.',
        ],
      },
      de: {
        name: 'Dr. Malea (Sabău) Oana Bianca',
        position: 'Fachrichtung Prothetik und Parodontologie',
        philosophy:
          'Vor jeder prothetischen Arbeit prüfe ich die <k>Gesundheit des Zahnfleischs</k>, denn darauf baut alles andere auf. Den Plan legen wir gemeinsam fest, und jeden Schritt <k>erkläre</k> ich, bevor wir beginnen.',
        about: [
          'Dr. Malea arbeitet in der Klinik und ist für prothetische Arbeiten und die Behandlung von Zahnfleischerkrankungen zuständig: Kronen, Brücken und Prothesen, aber auch professionelle Zahnreinigungen und Parodontalbehandlungen. Der erste Besuch beginnt mit einem Gespräch darüber, welche Beschwerden der Patient hat, geht mit der Untersuchung von Zähnen und Zahnfleisch weiter und endet mit der Erklärung der Behandlungsmöglichkeiten und der Reihenfolge der Schritte.',
          'Fortbildung gehört zum Arbeitsalltag: In den letzten Jahren besuchte Dr. Malea Kurse zur implantatgetragenen prothetischen Versorgung und zur plastischen Parodontalchirurgie. Wenn ein Behandlungsplan auch andere Fachgebiete braucht, entsteht er gemeinsam mit den Kolleginnen und Kollegen aus Chirurgie, Endodontie und Kieferorthopädie, und der Patient erfährt von Anfang an, was jeder Schritt umfasst.',
          'Zum ersten Termin ist es hilfreich, frühere Röntgenbilder und eine Liste der eingenommenen Medikamente mitzubringen. Die Kontrollen nach einer prothetischen Behandlung werden von Anfang an vereinbart, damit die Versorgung und die Gesundheit des Zahnfleischs langfristig kontrolliert werden.',
        ],
      },
      fr: {
        name: 'Dr Malea (Sabău) Oana Bianca',
        position: 'Spécialiste en prothèse dentaire et en parodontologie',
        philosophy:
          'Avant tout travail prothétique, je vérifie la <k>santé des gencives</k>, car tout le reste repose sur elles. Nous établissons le plan ensemble, et <k>j’explique</k> chaque étape avant de commencer.',
        about: [
          'Dr Malea exerce à la clinique et prend en charge les travaux prothétiques et le traitement des maladies des gencives : couronnes, bridges et prothèses amovibles, mais aussi nettoyages professionnels et traitements parodontaux. La première visite commence par un échange sur ce qui gêne le patient, se poursuit par l’examen des dents et des gencives et se termine par l’explication des options de traitement et de l’ordre des étapes.',
          'La formation continue fait partie du travail quotidien. Dr Malea a suivi ces dernières années des formations en réhabilitation prothétique sur implants et en chirurgie plastique parodontale. Lorsqu’un plan de traitement fait appel à d’autres spécialités, il est établi avec les collègues de chirurgie, d’endodontie et d’orthodontie, et le patient sait dès le début ce que comprend chaque étape.',
          'Pour le premier rendez-vous, il est utile d’apporter les anciennes radiographies et la liste des médicaments pris. Les contrôles après un traitement prothétique sont fixés dès le départ, afin de suivre dans le temps la prothèse comme la santé des gencives.',
        ],
      },
      it: {
        name: 'Dr. Malea (Sabău) Oana Bianca',
        position: 'Specialista in protesi dentaria e parodontologia',
        philosophy:
          'Prima di ogni lavoro protesico controllo la <k>salute delle gengive</k>, perché tutto il resto poggia su di esse. Il piano lo stabiliamo insieme e <k>spiego</k> ogni fase prima di cominciare.',
        about: [
          'Lavora in clinica e si occupa di protesi e del trattamento delle malattie gengivali: corone, ponti e protesi mobili, ma anche igiene professionale e terapie parodontali. La prima visita inizia con un colloquio su ciò che disturba il paziente, prosegue con l’esame dei denti e delle gengive e si conclude con la spiegazione delle opzioni di trattamento e dell’ordine delle fasi.',
          'La formazione continua fa parte del lavoro quotidiano: negli ultimi anni con corsi di riabilitazione protesica su impianti e di chirurgia plastica parodontale. Quando un piano di trattamento richiede anche altre specialità, viene definito insieme ai colleghi di chirurgia, endodonzia e ortodonzia, e il paziente sa fin dall’inizio che cosa comporta ogni fase.',
          'Per il primo appuntamento è utile portare le radiografie precedenti e l’elenco dei farmaci che si assumono. I controlli dopo un trattamento protesico vengono fissati fin dall’inizio, per seguire nel tempo sia la protesi sia la salute delle gengive.',
        ],
      },
    },
  },
  {
    id: 'toma-lucian',
    cutout: CUTOUT_2,
    hours: [
      {
        days: ['Monday', 'Tuesday', 'Thursday'],
        opens: '12:00',
        closes: '19:00',
      },
      { days: ['Friday'], opens: '09:00', closes: '14:00' },
    ],
    courses: [
      {
        year: 2024,
        words: {
          ro: 'Curs de endodonție sub microscop, Cluj-Napoca',
          en: 'Microscope-assisted endodontics course, Cluj-Napoca',
          de: 'Kurs für Endodontie unter dem Mikroskop, Cluj-Napoca',
          fr: 'Formation en endodontie sous microscope, Cluj-Napoca',
          it: 'Corso di endodonzia al microscopio, Cluj-Napoca',
        },
      },
      {
        year: 2022,
        words: {
          ro: 'Curs de retratament endodontic, București',
          en: 'Endodontic retreatment course, Bucharest',
          de: 'Kurs für endodontische Revision, Bukarest',
          fr: 'Formation au retraitement endodontique, Bucarest',
          it: 'Corso di ritrattamento endodontico, Bucarest',
        },
      },
      {
        year: 2020,
        words: {
          ro: 'Curs de protetică digitală și amprentare optică, Timișoara',
          en: 'Digital prosthodontics and optical impressions course, Timișoara',
          de: 'Kurs für digitale Prothetik und optische Abformung, Timișoara',
          fr: 'Formation en prothèse numérique et empreinte optique, Timișoara',
          it: 'Corso di protesi digitale e impronta ottica, Timișoara',
        },
      },
      {
        year: 2018,
        words: {
          ro: 'Curs de restaurări adezive pe dinți tratați endodontic, Sibiu',
          en: 'Course on adhesive restorations for root-treated teeth, Sibiu',
          de: 'Kurs für adhäsive Restaurationen an wurzelbehandelten Zähnen, Sibiu',
          fr: 'Formation aux restaurations adhésives sur dents dévitalisées, Sibiu',
          it: 'Corso di restauri adesivi su denti trattati endodonticamente, Sibiu',
        },
      },
      {
        year: 2014,
        words: {
          ro: 'Rezidențiat în protetică dentară',
          en: 'Residency in prosthodontics',
          de: 'Fachzahnärztliche Weiterbildung in Prothetik',
          fr: 'Spécialisation en prothèse dentaire',
          it: 'Specializzazione in protesi dentaria',
        },
      },
    ],
    stats: [
      {
        icon: 'experience',
        value: 12,
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
        value: 2600,
        suffix: '+',
        words: {
          ro: {
            label: 'Pacienți',
            description:
              'Peste 2600 de zâmbete îngrijite cu dedicare și profesionalism.',
          },
          en: {
            label: 'Patients',
            description:
              'More than 2600 smiles cared for with dedication and professionalism.',
          },
          de: {
            label: 'Patienten',
            description:
              'Über 2600 Lächeln, mit Hingabe und Professionalität betreut.',
          },
          fr: {
            label: 'Patients',
            description:
              'Plus de 2600 sourires soignés avec dévouement et professionnalisme.',
          },
          it: {
            label: 'Pazienti',
            description:
              'Oltre 2600 sorrisi curati con dedizione e professionalità.',
          },
        },
      },
      {
        icon: 'courses',
        value: 5,
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
        value: 1900,
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
        name: 'Dr. Toma Lucian',
        position:
          'Medic specialist în protetică dentară, specializat în endodonție microscopică',
        philosophy:
          'Lucrez cu <k>microscopul</k> pentru că îmi arată detalii pe care ochiul liber nu le vede. Prefer să păstrez cât mai mult din <k>dintele natural</k> și să explic de ce aleg fiecare pas.',
        about: [
          'Dr. Toma lucrează în clinică și se ocupă de tratamentele de canal și de lucrările protetice: coroane, punți și restaurări pe dinți cu tratament de canal. Tratamentele de canal se fac la microscop, iar la prima vizită medicul analizează radiografia, examinează dintele și explică pe rând ce presupune tratamentul și câte ședințe sunt necesare.',
          'Formarea continuă include cursuri de endodonție sub microscop și de retratament endodontic, dar și de protetică digitală. Când un dinte cu tratament de canal are nevoie apoi de o coroană sau de o lucrare mai amplă, planul se stabilește împreună cu colegii din chirurgie și parodontologie, iar ordinea pașilor îi este explicată pacientului de la început.',
          'Un tratament de canal se face de obicei într-una sau două ședințe, în funcție de dinte. După tratament, pacientul primește recomandări pentru zilele următoare și o programare de control, la care dintele este verificat și se discută pasul următor.',
        ],
      },
      en: {
        name: 'Dr. Toma Lucian',
        position:
          'Specialist in prosthodontics with a focus on microscopic endodontics',
        philosophy:
          'I work with a <k>microscope</k> because it shows me details the naked eye cannot see. I prefer to keep as much of the <k>natural tooth</k> as possible and to explain why I choose each step.',
        about: [
          'Dr. Toma works at the clinic and carries out root canal treatments and prosthetic work: crowns, bridges and restorations on root-treated teeth. Root canal treatments are carried out under the microscope, and at the first visit the doctor reviews the X-ray, examines the tooth and explains step by step what the treatment involves and how many sessions are needed.',
          'Continuing training includes courses in microscope-assisted endodontics and endodontic retreatment, as well as in digital prosthodontics. When a root-treated tooth then needs a crown or more extensive work, the plan is drawn up together with colleagues in surgery and periodontics, and the order of the steps is explained to the patient from the start.',
          'A root canal treatment usually takes one or two sessions, depending on the tooth. Afterwards, the patient receives advice for the following days and a check-up appointment, at which the tooth is examined and the next step discussed.',
        ],
      },
      de: {
        name: 'Dr. Toma Lucian',
        position:
          'Fachrichtung Prothetik, Schwerpunkt mikroskopische Endodontie',
        philosophy:
          'Ich arbeite mit dem <k>Mikroskop</k>, weil es mir Details zeigt, die das bloße Auge nicht sieht. Ich möchte so viel wie möglich vom <k>natürlichen Zahn</k> erhalten und erklären, warum ich jeden Schritt wähle.',
        about: [
          'Dr. Toma arbeitet in der Klinik und ist für Wurzelkanalbehandlungen und prothetische Arbeiten zuständig: Kronen, Brücken und Restaurationen an wurzelbehandelten Zähnen. Wurzelkanalbehandlungen erfolgen unter dem Mikroskop, und beim ersten Besuch wertet Dr. Toma das Röntgenbild aus, untersucht den Zahn und erklärt Schritt für Schritt, was die Behandlung umfasst und wie viele Sitzungen nötig sind.',
          'Zur Fortbildung gehören Kurse zur Endodontie unter dem Mikroskop und zur endodontischen Revision sowie zur digitalen Prothetik. Wenn ein wurzelbehandelter Zahn danach eine Krone oder eine größere Versorgung braucht, entsteht der Plan gemeinsam mit den Kolleginnen und Kollegen aus Chirurgie und Parodontologie, und dem Patienten wird die Reihenfolge der Schritte von Anfang an erklärt.',
          'Eine Wurzelkanalbehandlung dauert je nach Zahn meist eine oder zwei Sitzungen. Danach erhält der Patient Hinweise für die folgenden Tage und einen Kontrolltermin, bei dem der Zahn untersucht und der nächste Schritt besprochen wird.',
        ],
      },
      fr: {
        name: 'Dr Toma Lucian',
        position:
          'Spécialiste en prothèse dentaire, pratique orientée vers l’endodontie microscopique',
        philosophy:
          'Je travaille au <k>microscope</k>, car il me montre des détails que l’œil nu ne voit pas. Je préfère conserver le plus possible la <k>dent naturelle</k> et expliquer pourquoi je choisis chaque étape.',
        about: [
          'Dr Toma exerce à la clinique et prend en charge les traitements canalaires et les travaux prothétiques : couronnes, bridges et restaurations sur dents dévitalisées. Les traitements canalaires sont réalisés sous microscope, et lors de la première visite la radiographie est analysée, la dent examinée, puis le traitement et le nombre de séances nécessaires sont expliqués point par point.',
          'La formation continue comprend des cours d’endodontie sous microscope et de retraitement endodontique, ainsi que de prothèse numérique. Lorsqu’une dent dévitalisée a ensuite besoin d’une couronne ou d’un travail plus important, le plan est établi avec les collègues de chirurgie et de parodontologie, et l’ordre des étapes est expliqué au patient dès le début.',
          'Un traitement canalaire se fait généralement en une ou deux séances, selon la dent. Ensuite, le patient reçoit des conseils pour les jours suivants et un rendez-vous de contrôle, lors duquel la dent est examinée et l’étape suivante discutée.',
        ],
      },
      it: {
        name: 'Dr. Toma Lucian',
        position:
          'Specialista in protesi dentaria, con attività dedicata all’endodonzia microscopica',
        philosophy:
          'Lavoro al <k>microscopio</k> perché mi mostra dettagli che l’occhio nudo non vede. Preferisco conservare il più possibile il <k>dente naturale</k> e spiegare perché scelgo ogni passaggio.',
        about: [
          'Lavora in clinica e si occupa di trattamenti canalari e di protesi: corone, ponti e restauri su denti devitalizzati. I trattamenti canalari vengono eseguiti al microscopio e alla prima visita il medico valuta la radiografia, esamina il dente e spiega passo per passo che cosa comporta il trattamento e quante sedute servono.',
          'La formazione continua comprende corsi di endodonzia al microscopio e di ritrattamento endodontico, oltre che di protesi digitale. Quando un dente devitalizzato ha poi bisogno di una corona o di un lavoro più ampio, il piano viene definito insieme ai colleghi di chirurgia e parodontologia e l’ordine delle fasi viene spiegato al paziente fin dall’inizio.',
          'Un trattamento canalare richiede di solito una o due sedute, a seconda del dente. Dopo il trattamento il paziente riceve indicazioni per i giorni successivi e un appuntamento di controllo, in cui si verifica il dente e si discute il passo successivo.',
        ],
      },
    },
  },
  {
    id: 'nicu-elena-alina',
    cutout: CUTOUT_1,
    hours: [
      { days: ['Tuesday', 'Thursday'], opens: '09:00', closes: '16:00' },
      { days: ['Wednesday'], opens: '12:00', closes: '19:00' },
    ],
    courses: [
      {
        year: 2025,
        words: {
          ro: 'Curs de terapie parodontală regenerativă, București',
          en: 'Regenerative periodontal therapy course, Bucharest',
          de: 'Kurs für regenerative Parodontaltherapie, Bukarest',
          fr: 'Formation en thérapie parodontale régénératrice, Bucarest',
          it: 'Corso di terapia parodontale rigenerativa, Bucarest',
        },
      },
      {
        year: 2023,
        words: {
          ro: 'Curs de chirurgie mucogingivală, Cluj-Napoca',
          en: 'Mucogingival surgery course, Cluj-Napoca',
          de: 'Kurs für mukogingivale Chirurgie, Cluj-Napoca',
          fr: 'Formation en chirurgie muco-gingivale, Cluj-Napoca',
          it: 'Corso di chirurgia mucogengivale, Cluj-Napoca',
        },
      },
      {
        year: 2021,
        words: {
          ro: 'Curs de tratament parodontal nechirurgical, Sibiu',
          en: 'Non-surgical periodontal treatment course, Sibiu',
          de: 'Kurs für nichtchirurgische Parodontalbehandlung, Sibiu',
          fr: 'Formation au traitement parodontal non chirurgical, Sibiu',
          it: 'Corso di trattamento parodontale non chirurgico, Sibiu',
        },
      },
      {
        year: 2019,
        words: {
          ro: 'Curs de prevenție și igienă orală la adulți, Timișoara',
          en: 'Course on prevention and oral hygiene in adults, Timișoara',
          de: 'Kurs für Prävention und Mundhygiene bei Erwachsenen, Timișoara',
          fr: 'Formation en prévention et hygiène bucco-dentaire chez l’adulte, Timișoara',
          it: 'Corso di prevenzione e igiene orale nell’adulto, Timișoara',
        },
      },
      {
        year: 2015,
        words: {
          ro: 'Rezidențiat în parodontologie',
          en: 'Residency in periodontics',
          de: 'Fachzahnärztliche Weiterbildung in Parodontologie',
          fr: 'Spécialisation en parodontologie',
          it: 'Specializzazione in parodontologia',
        },
      },
    ],
    stats: [
      {
        icon: 'experience',
        value: 11,
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
        value: 2100,
        suffix: '+',
        words: {
          ro: {
            label: 'Pacienți',
            description:
              'Peste 2100 de zâmbete îngrijite cu dedicare și profesionalism.',
          },
          en: {
            label: 'Patients',
            description:
              'More than 2100 smiles cared for with dedication and professionalism.',
          },
          de: {
            label: 'Patienten',
            description:
              'Über 2100 Lächeln, mit Hingabe und Professionalität betreut.',
          },
          fr: {
            label: 'Patients',
            description:
              'Plus de 2100 sourires soignés avec dévouement et professionnalisme.',
          },
          it: {
            label: 'Pazienti',
            description:
              'Oltre 2100 sorrisi curati con dedizione e professionalità.',
          },
        },
      },
      {
        icon: 'courses',
        value: 5,
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
        value: 1600,
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
        name: 'Dr. Nicu Elena Alina',
        position: 'Medic specialist în parodontologie',
        philosophy:
          'Încep mereu cu <k>prevenția</k>, pentru că o gingie sănătoasă ține dinții la locul lor. Le arăt pacienților cum să își îngrijească gingiile acasă, fiindcă <k>îngrijirea zilnică</k> contează la fel de mult ca tratamentul din cabinet.',
        about: [
          'Dr. Nicu lucrează în clinică și se ocupă de prevenția și tratamentul bolilor gingiei: igienizări profesionale, tratamente parodontale și controale periodice. La prima vizită, medicul evaluează starea gingiilor, analizează radiografiile și îi explică pacientului ce a găsit și ce etape urmează.',
          'Formarea continuă include cursuri de terapie parodontală regenerativă și de chirurgie mucogingivală. Pentru pacienții care au nevoie și de implanturi sau de lucrări protetice, planul se stabilește împreună cu colegii din chirurgie și protetică, astfel încât gingia să fie pregătită înaintea fiecărei etape.',
          'Tratamentul parodontal continuă și acasă, așa că fiecare pacient pleacă cu instrucțiuni de periaj și de folosire a aței dentare potrivite situației sale. Controalele periodice se programează de obicei la trei sau la șase luni, în funcție de cum evoluează gingia.',
        ],
      },
      en: {
        name: 'Dr. Nicu Elena Alina',
        position: 'Specialist in periodontics',
        philosophy:
          'I always start with <k>prevention</k>, because healthy gums keep the teeth in place. I show patients how to care for their gums at home, since <k>daily care</k> matters as much as the treatment in the clinic.',
        about: [
          'Dr. Nicu works at the clinic and focuses on the prevention and treatment of gum disease: professional cleaning, periodontal treatments and regular check-ups. At the first visit, the doctor assesses the condition of the gums, reviews the X-rays and explains to the patient what was found and which stages come next.',
          'Continuing training includes courses in regenerative periodontal therapy and mucogingival surgery. For patients who also need implants or prosthetic work, the plan is drawn up together with colleagues in surgery and prosthodontics, so that the gums are prepared before each stage.',
          'Periodontal treatment continues at home, so every patient leaves with brushing and flossing instructions suited to their situation. Regular check-ups are usually scheduled every three or six months, depending on how the gums respond.',
        ],
      },
      de: {
        name: 'Dr. Nicu Elena Alina',
        position: 'Fachrichtung Parodontologie',
        philosophy:
          'Ich beginne immer mit der <k>Vorbeugung</k>, denn gesundes Zahnfleisch hält die Zähne an ihrem Platz. Ich zeige den Patienten, wie sie ihr Zahnfleisch zu Hause pflegen, denn die <k>tägliche Pflege</k> zählt genauso viel wie die Behandlung in der Klinik.',
        about: [
          'Dr. Nicu arbeitet in der Klinik und ist für die Vorbeugung und Behandlung von Zahnfleischerkrankungen zuständig: professionelle Zahnreinigungen, Parodontalbehandlungen und regelmäßige Kontrollen. Beim ersten Besuch beurteilt Dr. Nicu den Zustand des Zahnfleischs, wertet die Röntgenbilder aus und erklärt dem Patienten, was festgestellt wurde und welche Schritte folgen.',
          'Zur Fortbildung gehören Kurse zur regenerativen Parodontaltherapie und zur mukogingivalen Chirurgie. Für Patienten, die auch Implantate oder prothetische Arbeiten brauchen, entsteht der Plan gemeinsam mit den Kolleginnen und Kollegen aus Chirurgie und Prothetik, damit das Zahnfleisch vor jedem Schritt vorbereitet ist.',
          'Die Parodontalbehandlung geht zu Hause weiter, deshalb erhält jeder Patient Anleitungen zum Zähneputzen und zur Anwendung von Zahnseide, die zu seiner Situation passen. Die regelmäßigen Kontrollen finden meist alle drei oder sechs Monate statt, je nachdem, wie sich das Zahnfleisch entwickelt.',
        ],
      },
      fr: {
        name: 'Dr Nicu Elena Alina',
        position: 'Spécialiste en parodontologie',
        philosophy:
          'Je commence toujours par la <k>prévention</k>, car des gencives saines maintiennent les dents en place. Je montre aux patients comment prendre soin de leurs gencives à la maison, car les <k>soins quotidiens</k> comptent autant que le traitement au cabinet.',
        about: [
          'Dr Nicu exerce à la clinique et prend en charge la prévention et le traitement des maladies des gencives : nettoyages professionnels, traitements parodontaux et contrôles réguliers. Lors de la première visite, l’état des gencives est évalué, les radiographies sont analysées, puis le patient apprend ce qui a été constaté et quelles étapes vont suivre.',
          'La formation continue comprend des cours de thérapie parodontale régénératrice et de chirurgie muco-gingivale. Pour les patients qui ont aussi besoin d’implants ou de prothèses, le plan est établi avec les collègues de chirurgie et de prothèse, afin que les gencives soient préparées avant chaque étape.',
          'Le traitement parodontal continue à la maison : chaque patient repart avec des consignes de brossage et d’utilisation du fil dentaire adaptées à sa situation. Les contrôles réguliers sont généralement prévus tous les trois ou six mois, selon l’évolution des gencives.',
        ],
      },
      it: {
        name: 'Dr. Nicu Elena Alina',
        position: 'Specialista in parodontologia',
        philosophy:
          'Comincio sempre dalla <k>prevenzione</k>, perché le gengive sane tengono i denti al loro posto. Mostro ai pazienti come curare le gengive a casa, perché la <k>cura quotidiana</k> conta quanto il trattamento in studio.',
        about: [
          'Lavora in clinica e si occupa della prevenzione e del trattamento delle malattie gengivali: igiene professionale, terapie parodontali e controlli periodici. Alla prima visita il medico valuta lo stato delle gengive, esamina le radiografie e spiega al paziente che cosa ha trovato e quali fasi seguiranno.',
          'La formazione continua comprende corsi di terapia parodontale rigenerativa e di chirurgia mucogengivale. Per i pazienti che hanno bisogno anche di impianti o di protesi, il piano viene definito insieme ai colleghi di chirurgia e protesi, in modo che le gengive siano preparate prima di ogni fase.',
          'La terapia parodontale continua a casa, per questo ogni paziente riceve istruzioni su spazzolino e filo interdentale adatte alla propria situazione. I controlli periodici si fissano di solito ogni tre o sei mesi, a seconda di come rispondono le gengive.',
        ],
      },
    },
  },
  {
    id: 'ivascu-zugravu-catalina',
    cutout: CUTOUT_2,
    hours: [
      { days: ['Monday', 'Wednesday'], opens: '13:00', closes: '19:00' },
      { days: ['Thursday'], opens: '09:00', closes: '15:00' },
    ],
    courses: [
      {
        year: 2025,
        words: {
          ro: 'Curs de tratament ortodontic cu aparate fixe estetice, București',
          en: 'Course on orthodontic treatment with aesthetic fixed appliances, Bucharest',
          de: 'Kurs für kieferorthopädische Behandlung mit ästhetischen festsitzenden Apparaturen, Bukarest',
          fr: 'Formation au traitement orthodontique par appareils fixes esthétiques, Bucarest',
          it: 'Corso di trattamento ortodontico con apparecchi fissi estetici, Bucarest',
        },
      },
      {
        year: 2023,
        words: {
          ro: 'Curs de ortodonție interceptivă la copii, Cluj-Napoca',
          en: 'Course on interceptive orthodontics in children, Cluj-Napoca',
          de: 'Kurs für interzeptive Kieferorthopädie bei Kindern, Cluj-Napoca',
          fr: 'Formation en orthodontie interceptive chez l’enfant, Cluj-Napoca',
          it: 'Corso di ortodonzia intercettiva in età pediatrica, Cluj-Napoca',
        },
      },
      {
        year: 2021,
        words: {
          ro: 'Curs de planificare digitală a tratamentului ortodontic, Timișoara',
          en: 'Digital orthodontic treatment planning course, Timișoara',
          de: 'Kurs für digitale kieferorthopädische Behandlungsplanung, Timișoara',
          fr: 'Formation à la planification numérique du traitement orthodontique, Timișoara',
          it: 'Corso di pianificazione digitale del trattamento ortodontico, Timișoara',
        },
      },
      {
        year: 2018,
        words: {
          ro: 'Curs de biomecanică în tratamentul cu aparate fixe, Iași',
          en: 'Course on biomechanics in fixed appliance treatment, Iași',
          de: 'Kurs für Biomechanik in der Behandlung mit festsitzenden Apparaturen, Iași',
          fr: 'Formation en biomécanique du traitement par appareils fixes, Iași',
          it: 'Corso di biomeccanica nel trattamento con apparecchi fissi, Iași',
        },
      },
      {
        year: 2013,
        words: {
          ro: 'Rezidențiat în ortodonție și ortopedie facială',
          en: 'Residency in orthodontics and facial orthopaedics',
          de: 'Fachzahnärztliche Weiterbildung in Kieferorthopädie',
          fr: 'Spécialisation en orthodontie et orthopédie faciale',
          it: 'Specializzazione in ortodonzia e ortopedia facciale',
        },
      },
    ],
    stats: [
      {
        icon: 'experience',
        value: 13,
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
        value: 1800,
        suffix: '+',
        words: {
          ro: {
            label: 'Pacienți',
            description:
              'Peste 1800 de zâmbete îngrijite cu dedicare și profesionalism.',
          },
          en: {
            label: 'Patients',
            description:
              'More than 1800 smiles cared for with dedication and professionalism.',
          },
          de: {
            label: 'Patienten',
            description:
              'Über 1800 Lächeln, mit Hingabe und Professionalität betreut.',
          },
          fr: {
            label: 'Patients',
            description:
              'Plus de 1800 sourires soignés avec dévouement et professionnalisme.',
          },
          it: {
            label: 'Pazienti',
            description:
              'Oltre 1800 sorrisi curati con dedizione e professionalità.',
          },
        },
      },
      {
        icon: 'courses',
        value: 5,
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
        value: 1200,
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
        name: 'Dr. Ivașcu-Zugravu Cătălina',
        position: 'Medic specialist în ortodonție și ortopedie facială',
        philosophy:
          'Un tratament ortodontic durează, așa că vreau ca pacientul să cunoască de la început <k>fiecare etapă</k>. Lucrez cu copii și cu adulți, iar pentru fiecare caut <k>soluția potrivită</k> vârstei și nevoilor sale.',
        about: [
          'Dr. Ivașcu-Zugravu lucrează în clinică și se ocupă de ortodonția copiilor și a adulților, cu aparate dentare fixe, metalice sau ceramice. Prima vizită începe cu o discuție despre ce și-ar dori pacientul să schimbe, continuă cu examinarea, fotografiile și amprentele, iar la final medicul explică variantele de tratament și durata fiecăreia.',
          'Formarea continuă include cursuri de ortodonție interceptivă la copii și de planificare digitală a tratamentului, dar și de tratament cu aparate fixe estetice. Când tratamentul ortodontic are nevoie și de alte specialități, planul se stabilește împreună cu colegii din chirurgie și protetică, iar ordinea etapelor este explicată de la început.',
          'Pentru copii, un prim control ortodontic este util încă de la vârsta de șapte ani, când problemele de creștere ale maxilarelor se pot observa din timp. Pe parcursul tratamentului, controalele se programează de obicei o dată la patru până la șase săptămâni.',
        ],
      },
      en: {
        name: 'Dr. Ivașcu-Zugravu Cătălina',
        position: 'Specialist in orthodontics and facial orthopaedics',
        philosophy:
          'Orthodontic treatment takes time, so I want patients to know <k>every stage</k> from the start. I work with children and adults, and for each one I look for the <k>right approach</k> for their age and needs.',
        about: [
          'Dr. Ivașcu-Zugravu works at the clinic and provides orthodontic care for children and adults, with fixed braces, metal or ceramic. The first visit begins with a conversation about what the patient would like to change, continues with the examination, photographs and impressions, and ends with the doctor explaining the treatment options and how long each one takes.',
          'Continuing training includes courses in interceptive orthodontics for children and in digital treatment planning, as well as in treatment with aesthetic fixed appliances. When orthodontic treatment also needs other specialties, the plan is drawn up together with colleagues in surgery and prosthodontics, and the order of the stages is explained from the start.',
          'For children, a first orthodontic check-up is useful from the age of seven, when problems with jaw growth can be spotted early. During treatment, check-ups are usually scheduled every four to six weeks.',
        ],
      },
      de: {
        name: 'Dr. Ivașcu-Zugravu Cătălina',
        position: 'Fachrichtung Kieferorthopädie',
        philosophy:
          'Eine kieferorthopädische Behandlung braucht Zeit, deshalb möchte ich, dass Patienten <k>jeden Schritt</k> von Anfang an kennen. Ich arbeite mit Kindern und Erwachsenen und suche für jeden den <k>passenden Weg</k>, je nach Alter und Bedürfnissen.',
        about: [
          'Dr. Ivașcu-Zugravu arbeitet in der Klinik und behandelt Kinder und Erwachsene kieferorthopädisch, mit festsitzenden Zahnspangen aus Metall oder Keramik. Der erste Besuch beginnt mit einem Gespräch darüber, was der Patient verändern möchte, geht mit der Untersuchung, den Fotos und den Abdrücken weiter und endet mit der Erklärung der Behandlungsmöglichkeiten und deren Dauer.',
          'Zur Fortbildung gehören Kurse zur interzeptiven Kieferorthopädie bei Kindern und zur digitalen Behandlungsplanung sowie zur Behandlung mit ästhetischen festsitzenden Apparaturen. Wenn eine kieferorthopädische Behandlung auch andere Fachgebiete braucht, entsteht der Plan gemeinsam mit den Kolleginnen und Kollegen aus Chirurgie und Prothetik, und die Reihenfolge der Schritte wird von Anfang an erklärt.',
          'Bei Kindern ist eine erste kieferorthopädische Kontrolle schon ab dem Alter von sieben Jahren sinnvoll, weil sich Wachstumsprobleme der Kiefer dann früh erkennen lassen. Während der Behandlung finden die Kontrollen meist alle vier bis sechs Wochen statt.',
        ],
      },
      fr: {
        name: 'Dr Ivașcu-Zugravu Cătălina',
        position: 'Spécialiste en orthodontie et orthopédie faciale',
        philosophy:
          'Un traitement orthodontique prend du temps, alors je tiens à ce que le patient connaisse <k>chaque étape</k> dès le début. Je travaille avec des enfants et des adultes, et pour chacun je cherche la <k>solution adaptée</k> à son âge et à ses besoins.',
        about: [
          'Dr Ivașcu-Zugravu exerce à la clinique et prend en charge l’orthodontie des enfants et des adultes, avec des appareils fixes, métalliques ou en céramique. La première visite commence par un échange sur ce que le patient souhaite changer, se poursuit par l’examen, les photographies et les empreintes et se termine par l’explication des options de traitement et de leur durée.',
          'La formation continue comprend des cours d’orthodontie interceptive chez l’enfant et de planification numérique du traitement, ainsi que de traitement par appareils fixes esthétiques. Lorsqu’un traitement orthodontique fait appel à d’autres spécialités, le plan est établi avec les collègues de chirurgie et de prothèse, et l’ordre des étapes est expliqué dès le début.',
          'Chez l’enfant, un premier contrôle orthodontique est utile dès l’âge de sept ans, quand les problèmes de croissance des mâchoires peuvent être repérés tôt. Pendant le traitement, les contrôles ont lieu en général toutes les quatre à six semaines.',
        ],
      },
      it: {
        name: 'Dr. Ivașcu-Zugravu Cătălina',
        position: 'Specialista in ortodonzia e ortopedia facciale',
        philosophy:
          'Un trattamento ortodontico richiede tempo, quindi voglio che il paziente conosca <k>ogni fase</k> fin dall’inizio. Lavoro con bambini e adulti e per ognuno cerco la <k>soluzione adatta</k> all’età e alle esigenze.',
        about: [
          'Lavora in clinica e si occupa di ortodonzia per bambini e adulti, con apparecchi fissi, metallici o in ceramica. La prima visita inizia con un colloquio su ciò che il paziente vorrebbe cambiare, prosegue con l’esame, le fotografie e le impronte e si conclude con la spiegazione delle opzioni di trattamento e della loro durata.',
          'La formazione continua comprende corsi di ortodonzia intercettiva in età pediatrica e di pianificazione digitale del trattamento, oltre che di trattamento con apparecchi fissi estetici. Quando un trattamento ortodontico richiede anche altre specialità, il piano viene definito insieme ai colleghi di chirurgia e protesi e l’ordine delle fasi viene spiegato fin dall’inizio.',
          'Per i bambini una prima visita ortodontica è utile già a partire dai sette anni, quando i problemi di crescita dei mascellari si possono notare per tempo. Durante il trattamento i controlli si fissano di solito a intervalli compresi tra le quattro e le sei settimane.',
        ],
      },
    },
  },
  {
    id: 'opris-mircea',
    cutout: CUTOUT_1,
    hours: [
      {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        opens: '09:00',
        closes: '15:00',
      },
    ],
    courses: [
      {
        year: 2024,
        words: {
          ro: 'Curs de implantologie ghidată digital, București',
          en: 'Digitally guided implantology course, Bucharest',
          de: 'Kurs für digital geführte Implantologie, Bukarest',
          fr: 'Formation en implantologie guidée numériquement, Bucarest',
          it: 'Corso di implantologia a guida digitale, Bucarest',
        },
      },
      {
        year: 2022,
        words: {
          ro: 'Curs de augmentare osoasă și regenerare tisulară ghidată, Sibiu',
          en: 'Bone augmentation and guided tissue regeneration course, Sibiu',
          de: 'Kurs für Knochenaugmentation und gesteuerte Geweberegeneration, Sibiu',
          fr: 'Formation en augmentation osseuse et régénération tissulaire guidée, Sibiu',
          it: 'Corso di aumento osseo e rigenerazione tissutale guidata, Sibiu',
        },
      },
      {
        year: 2020,
        words: {
          ro: 'Curs de extracție a molarilor de minte incluși, Cluj-Napoca',
          en: 'Impacted wisdom tooth extraction course, Cluj-Napoca',
          de: 'Kurs zur Entfernung retinierter Weisheitszähne, Cluj-Napoca',
          fr: 'Formation à l’extraction des dents de sagesse incluses, Cluj-Napoca',
          it: 'Corso di estrazione dei denti del giudizio inclusi, Cluj-Napoca',
        },
      },
      {
        year: 2016,
        words: {
          ro: 'Curs de chirurgie preprotetică, Timișoara',
          en: 'Pre-prosthetic surgery course, Timișoara',
          de: 'Kurs für präprothetische Chirurgie, Timișoara',
          fr: 'Formation en chirurgie préprothétique, Timișoara',
          it: 'Corso di chirurgia preprotesica, Timișoara',
        },
      },
      {
        year: 2010,
        words: {
          ro: 'Rezidențiat în chirurgie dento-alveolară',
          en: 'Residency in dentoalveolar surgery',
          de: 'Fachzahnärztliche Weiterbildung in dentoalveolärer Chirurgie',
          fr: 'Spécialisation en chirurgie dento-alvéolaire',
          it: 'Specializzazione in chirurgia dento-alveolare',
        },
      },
    ],
    stats: [
      {
        icon: 'experience',
        value: 16,
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
        value: 4100,
        suffix: '+',
        words: {
          ro: {
            label: 'Pacienți',
            description:
              'Peste 4100 de zâmbete îngrijite cu dedicare și profesionalism.',
          },
          en: {
            label: 'Patients',
            description:
              'More than 4100 smiles cared for with dedication and professionalism.',
          },
          de: {
            label: 'Patienten',
            description:
              'Über 4100 Lächeln, mit Hingabe und Professionalität betreut.',
          },
          fr: {
            label: 'Patients',
            description:
              'Plus de 4100 sourires soignés avec dévouement et professionnalisme.',
          },
          it: {
            label: 'Pazienti',
            description:
              'Oltre 4100 sorrisi curati con dedizione e professionalità.',
          },
        },
      },
      {
        icon: 'courses',
        value: 5,
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
        value: 3500,
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
        name: 'Dr. Opriș Mircea',
        position: 'Medic specialist în chirurgie dento-alveolară',
        philosophy:
          'Înaintea oricărei intervenții îi explic pacientului <k>fiecare pas</k>, ca să știe exact ce urmează. Lucrez fără grabă, iar la <k>controlul</k> de după verificăm împreună cum se vindecă zona.',
        about: [
          'Dr. Opriș lucrează în clinică și se ocupă de chirurgia dento-alveolară: extracții, inclusiv ale molarilor de minte, inserarea implanturilor și intervenții de augmentare osoasă. La prima vizită, medicul examinează zona, analizează radiografia sau tomografia și explică ce presupune intervenția, cât durează și cum decurge vindecarea.',
          'Formarea continuă include cursuri de implantologie ghidată digital și de augmentare osoasă. Când o intervenție chirurgicală face parte dintr-un plan mai amplu, lucrul se coordonează cu colegii din protetică și parodontologie, iar etapele se stabilesc înainte de începerea tratamentului.',
          'Înaintea unei intervenții, pacientul primește instrucțiuni despre alimentație și despre medicamentele pe care le ia. După intervenție, controlul se programează de obicei la o săptămână, când se verifică vindecarea și, dacă e cazul, se scot firele.',
        ],
      },
      en: {
        name: 'Dr. Opriș Mircea',
        position: 'Specialist in dentoalveolar surgery',
        philosophy:
          'Before any procedure I explain <k>every step</k> to the patient, so that they know exactly what comes next. I work without rushing, and at the <k>follow-up</k> visit we check together how the area is healing.',
        about: [
          'Dr. Opriș works at the clinic and practises dentoalveolar surgery: extractions, wisdom teeth included, implant placement and bone augmentation procedures. At the first visit, the doctor examines the area, reviews the X-ray or CT scan and explains what the procedure involves, how long it takes and how healing progresses.',
          'Continuing training includes courses in digitally guided implantology and bone augmentation. When a surgical procedure is part of a wider plan, the work is coordinated with colleagues in prosthodontics and periodontics, and the stages are set before treatment begins.',
          'Before a procedure, the patient receives instructions about eating and about any medication they take. After the procedure, the check-up is usually booked for a week later, when the healing is checked and the stitches are removed if needed.',
        ],
      },
      de: {
        name: 'Dr. Opriș Mircea',
        position: 'Fachrichtung dentoalveoläre Chirurgie',
        philosophy:
          'Vor jedem Eingriff erkläre ich dem Patienten <k>jeden Schritt</k>, damit genau klar ist, was als Nächstes kommt. Ich arbeite ohne Eile, und bei der <k>Nachkontrolle</k> prüfen wir gemeinsam, wie die Stelle heilt.',
        about: [
          'Dr. Opriș arbeitet in der Klinik und ist in der dentoalveolären Chirurgie tätig: Extraktionen, auch von Weisheitszähnen, das Setzen von Implantaten und Knochenaufbau. Beim ersten Besuch untersucht Dr. Opriș den betroffenen Bereich, wertet das Röntgenbild oder die dreidimensionale Aufnahme (DVT) aus und erklärt, was der Eingriff umfasst, wie lange er dauert und wie die Heilung verläuft.',
          'Zur Fortbildung gehören Kurse zur digital geführten Implantologie und zur Knochenaugmentation. Wenn ein chirurgischer Eingriff Teil eines größeren Plans ist, wird die Arbeit mit den Kolleginnen und Kollegen aus Prothetik und Parodontologie abgestimmt, und die Schritte werden vor Beginn der Behandlung festgelegt.',
          'Vor einem Eingriff erhält der Patient Hinweise zum Essen und zu den Medikamenten, die er einnimmt. Die Kontrolle nach dem Eingriff findet meist eine Woche später statt, dabei wird die Heilung geprüft, und falls nötig werden die Fäden entfernt.',
        ],
      },
      fr: {
        name: 'Dr Opriș Mircea',
        position: 'Spécialiste en chirurgie dento-alvéolaire',
        philosophy:
          'Avant chaque intervention, j’explique <k>chaque étape</k> au patient, pour qu’il sache exactement ce qui va suivre. Je travaille sans précipitation, et lors du <k>contrôle</k> nous vérifions ensemble la cicatrisation.',
        about: [
          'Dr Opriș exerce à la clinique et se consacre à la chirurgie dento-alvéolaire : extractions, dents de sagesse comprises, pose d’implants et interventions d’augmentation osseuse. Lors de la première visite, la zone est examinée, la radiographie ou le scanner est analysé, puis l’intervention, sa durée et le déroulement de la cicatrisation sont expliqués.',
          'La formation continue comprend des cours d’implantologie guidée numériquement et d’augmentation osseuse. Lorsqu’une intervention chirurgicale fait partie d’un plan plus large, le travail est coordonné avec les collègues de prothèse et de parodontologie, et les étapes sont fixées avant le début du traitement.',
          'Avant une intervention, le patient reçoit des consignes sur l’alimentation et sur les médicaments qu’il prend. Après l’intervention, le contrôle est généralement prévu une semaine plus tard, pour vérifier la cicatrisation et retirer les fils si nécessaire.',
        ],
      },
      it: {
        name: 'Dr. Opriș Mircea',
        position: 'Specialista in chirurgia dento-alveolare',
        philosophy:
          'Prima di ogni intervento spiego al paziente <k>ogni passaggio</k>, perché sappia esattamente che cosa succederà. Lavoro senza fretta e al <k>controllo</k> successivo verifichiamo insieme come guarisce la zona.',
        about: [
          'Lavora in clinica e si occupa di chirurgia dento-alveolare: estrazioni, compresi i denti del giudizio, inserimento di impianti e interventi di aumento osseo. Alla prima visita il medico esamina la zona, valuta la radiografia o la TAC e spiega in che cosa consiste l’intervento, quanto dura e come procede la guarigione.',
          'La formazione continua comprende corsi di implantologia a guida digitale e di aumento osseo. Quando un intervento chirurgico fa parte di un piano più ampio, il lavoro viene coordinato con i colleghi di protesi e parodontologia e le fasi vengono stabilite prima dell’inizio del trattamento.',
          'Prima di un intervento il paziente riceve indicazioni sull’alimentazione e sui farmaci che assume. Dopo l’intervento il controllo si fissa di solito a una settimana, quando si verifica la guarigione e, se serve, si rimuovono i punti.',
        ],
      },
    },
  },
  {
    id: 'bozdog-horatiu',
    cutout: CUTOUT_2,
    hours: [
      { days: ['Monday'], opens: '09:00', closes: '13:00' },
      {
        days: ['Wednesday', 'Thursday', 'Friday'],
        opens: '12:00',
        closes: '19:00',
      },
    ],
    courses: [
      {
        year: 2025,
        words: {
          ro: 'Curs de chirurgie piezoelectrică în stomatologie, Cluj-Napoca',
          en: 'Course on piezoelectric surgery in dentistry, Cluj-Napoca',
          de: 'Kurs für piezoelektrische Chirurgie in der Zahnmedizin, Cluj-Napoca',
          fr: 'Formation en chirurgie piézoélectrique en dentisterie, Cluj-Napoca',
          it: 'Corso di chirurgia piezoelettrica in odontoiatria, Cluj-Napoca',
        },
      },
      {
        year: 2023,
        words: {
          ro: 'Curs de sinus lift și augmentare de creastă, București',
          en: 'Sinus lift and ridge augmentation course, Bucharest',
          de: 'Kurs für Sinuslift und Kieferkammaufbau, Bukarest',
          fr: 'Formation au sinus lift et à l’augmentation de crête, Bucarest',
          it: 'Corso di rialzo del seno mascellare e aumento di cresta, Bucarest',
        },
      },
      {
        year: 2021,
        words: {
          ro: 'Curs de interpretare a tomografiei dentare CBCT, Sibiu',
          en: 'Dental CBCT interpretation course, Sibiu',
          de: 'Kurs zur Auswertung der dentalen DVT, Sibiu',
          fr: 'Formation à l’interprétation du CBCT dentaire, Sibiu',
          it: 'Corso di interpretazione della CBCT dentale, Sibiu',
        },
      },
      {
        year: 2019,
        words: {
          ro: 'Workshop de suturi și vindecare a plăgilor orale, Timișoara',
          en: 'Suturing and oral wound healing workshop, Timișoara',
          de: 'Workshop zu Nahttechniken und oraler Wundheilung, Timișoara',
          fr: 'Atelier sur les sutures et la cicatrisation des plaies buccales, Timișoara',
          it: 'Workshop su suture e guarigione delle ferite orali, Timișoara',
        },
      },
      {
        year: 2016,
        words: {
          ro: 'Rezidențiat în chirurgie dento-alveolară',
          en: 'Residency in dentoalveolar surgery',
          de: 'Fachzahnärztliche Weiterbildung in dentoalveolärer Chirurgie',
          fr: 'Spécialisation en chirurgie dento-alvéolaire',
          it: 'Specializzazione in chirurgia dento-alveolare',
        },
      },
    ],
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
        value: 1500,
        suffix: '+',
        words: {
          ro: {
            label: 'Pacienți',
            description:
              'Peste 1500 de zâmbete îngrijite cu dedicare și profesionalism.',
          },
          en: {
            label: 'Patients',
            description:
              'More than 1500 smiles cared for with dedication and professionalism.',
          },
          de: {
            label: 'Patienten',
            description:
              'Über 1500 Lächeln, mit Hingabe und Professionalität betreut.',
          },
          fr: {
            label: 'Patients',
            description:
              'Plus de 1500 sourires soignés avec dévouement et professionnalisme.',
          },
          it: {
            label: 'Pazienti',
            description:
              'Oltre 1500 sorrisi curati con dedizione e professionalità.',
          },
        },
      },
      {
        icon: 'courses',
        value: 5,
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
        value: 1300,
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
        name: 'Dr. Bozdog Horațiu',
        position: 'Medic specialist în chirurgie dento-alveolară',
        philosophy:
          'Pentru mine, o intervenție bine pregătită începe cu o <k>radiografie</k> citită atent și cu o discuție deschisă. Vreau ca pacientul să plece din cabinet știind ce are de făcut acasă, de aceea dau mereu <k>recomandări</k> scrise.',
        about: [
          'Dr. Bozdog lucrează în clinică și se ocupă de chirurgia dento-alveolară: extracții simple și chirurgicale, extracția molarilor de minte, inserarea implanturilor și intervenții la nivelul gingiei și al osului. La prima vizită, medicul examinează zona, citește radiografia sau tomografia și explică pe rând pașii intervenției și ce urmează după ea.',
          'Formarea continuă include cursuri de chirurgie piezoelectrică și de augmentare a crestei osoase, dar și de interpretare a tomografiei dentare. Pentru tratamentele care includ și lucrări protetice, planul se stabilește împreună cu colegii din protetică, astfel încât fiecare etapă să o pregătească pe următoarea.',
          'În ziua intervenției, pacientul primește recomandări scrise pentru îngrijirea de acasă și numărul clinicii, pentru orice întrebare. Controlul de după intervenție se programează de obicei la șapte până la zece zile, în funcție de tipul intervenției.',
        ],
      },
      en: {
        name: 'Dr. Bozdog Horațiu',
        position: 'Specialist in dentoalveolar surgery',
        philosophy:
          'For me, a well-prepared procedure starts with a carefully read <k>X-ray</k> and an open conversation. I want patients to leave knowing what to do at home, which is why I always give written <k>instructions</k>.',
        about: [
          'Dr. Bozdog works at the clinic and practises dentoalveolar surgery: simple and surgical extractions, wisdom tooth removal, implant placement and procedures on the gums and bone. At the first visit, the doctor examines the area, reads the X-ray or CT scan and explains the steps of the procedure one by one, along with what follows afterwards.',
          'Continuing training includes courses in piezoelectric surgery and alveolar ridge augmentation, as well as in reading dental CT scans. For treatments that also include prosthetic work, the plan is drawn up together with colleagues in prosthodontics, so that each stage prepares the next.',
          'On the day of the procedure, the patient receives written instructions for care at home and the clinic’s number for any questions. The check-up after the procedure is usually booked seven to ten days later, depending on the type of procedure.',
        ],
      },
      de: {
        name: 'Dr. Bozdog Horațiu',
        position: 'Fachrichtung dentoalveoläre Chirurgie',
        philosophy:
          'Für mich beginnt ein gut vorbereiteter Eingriff mit einem sorgfältig ausgewerteten <k>Röntgenbild</k> und einem offenen Gespräch. Patienten sollen wissen, was zu Hause zu tun ist, deshalb gebe ich immer schriftliche <k>Hinweise</k> mit.',
        about: [
          'Dr. Bozdog arbeitet in der Klinik und ist in der dentoalveolären Chirurgie tätig: einfache und chirurgische Extraktionen, die Entfernung von Weisheitszähnen, das Setzen von Implantaten und Eingriffe an Zahnfleisch und Knochen. Beim ersten Besuch untersucht Dr. Bozdog den betroffenen Bereich, wertet das Röntgenbild oder die dreidimensionale Aufnahme (DVT) aus und erklärt nacheinander die Schritte des Eingriffs und das, was danach folgt.',
          'Zur Fortbildung gehören Kurse zur piezoelektrischen Chirurgie und zum Kieferkammaufbau sowie zur Auswertung der dentalen DVT. Für Behandlungen, die auch prothetische Arbeiten umfassen, entsteht der Plan gemeinsam mit den Kolleginnen und Kollegen aus der Prothetik, damit jeder Schritt den nächsten vorbereitet.',
          'Am Tag des Eingriffs erhält der Patient schriftliche Hinweise für die Nachsorge zu Hause und die Telefonnummer der Klinik für Rückfragen. Die Kontrolle nach dem Eingriff findet meist sieben bis zehn Tage später statt, je nach Art des Eingriffs.',
        ],
      },
      fr: {
        name: 'Dr Bozdog Horațiu',
        position: 'Spécialiste en chirurgie dento-alvéolaire',
        philosophy:
          'Pour moi, une intervention bien préparée commence par une <k>radiographie</k> lue avec attention et une discussion ouverte. Je tiens à ce que le patient reparte en sachant quoi faire à la maison, c’est pourquoi je donne toujours des <k>consignes</k> écrites.',
        about: [
          'Dr Bozdog exerce à la clinique et se consacre à la chirurgie dento-alvéolaire : extractions simples et chirurgicales, extraction des dents de sagesse, pose d’implants et interventions sur la gencive et l’os. Lors de la première visite, la zone est examinée, la radiographie ou le scanner est lu, puis les étapes de l’intervention sont expliquées une à une, ainsi que ce qui se passe ensuite.',
          'La formation continue comprend des cours de chirurgie piézoélectrique et d’augmentation de la crête osseuse, ainsi que de lecture du scanner dentaire. Pour les traitements qui comprennent aussi des prothèses, le plan est établi avec les collègues de prothèse, afin que chaque étape prépare la suivante.',
          'Le jour de l’intervention, le patient reçoit des consignes écrites à suivre à la maison et le numéro de la clinique pour toute question. Le contrôle après l’intervention est généralement prévu sept à dix jours plus tard, selon le type d’intervention.',
        ],
      },
      it: {
        name: 'Dr. Bozdog Horațiu',
        position: 'Specialista in chirurgia dento-alveolare',
        philosophy:
          'Per me un intervento ben preparato comincia da una <k>radiografia</k> letta con attenzione e da un colloquio aperto. Voglio che il paziente esca sapendo che cosa fare a casa, per questo do sempre <k>indicazioni</k> scritte.',
        about: [
          'Lavora in clinica e si occupa di chirurgia dento-alveolare: estrazioni semplici e chirurgiche, estrazione dei denti del giudizio, inserimento di impianti e interventi su gengiva e osso. Alla prima visita il medico esamina la zona, legge la radiografia o la TAC e spiega passo per passo le fasi dell’intervento e che cosa succede dopo.',
          'La formazione continua comprende corsi di chirurgia piezoelettrica e di aumento della cresta ossea, oltre che di lettura della TAC dentale. Per i trattamenti che comprendono anche lavori protesici, il piano viene definito insieme ai colleghi di protesi, in modo che ogni fase prepari la successiva.',
          'Il giorno dell’intervento il paziente riceve indicazioni scritte per le cure a casa e il numero della clinica per qualsiasi domanda. Il controllo dopo l’intervento si fissa di solito tra i sette e i dieci giorni successivi, a seconda del tipo di intervento.',
        ],
      },
    },
  },
];

/**
 * THE CLINIC'S OWN NUMBERS — the „în cifre" band of the Home and Team pages
 * (owner, 2026-10-01, verbatim: "i want it on home page too with just 3
 * components. experience, patients and nr of procedures" · "same component
 * as on main page with the stats on the team page between map and helping
 * staff"). The doctor page's band, on
 * the page ground, over three tiles: a doctor's row shape (`Stat`), three of
 * his four drawings, and the very words his tiles wear — the owner's round-2f
 * sentences as round 2s rewrote them for CMSR — because they were already
 * written in the clinic's own voice („Punem grija …", "We put care …"), so
 * the band says the same thing on every page. Display order is this list's,
 * and the TYPE is the owner's "just 3": a tuple of exactly three rows, so a
 * fourth (which would also switch the band's row shape — DoctorStats'
 * `rowsFor`) is a compile error here, the DoctorTeam two-member tuple's
 * precedent.
 *
 * TODO(owner): THE THREE NUMBERS ARE PLACEHOLDERS. No clinic-wide count exists
 * anywhere in the repository or on the old site, so each is a round "at
 * least" chosen not to contradict the doctors' own placeholder rows: the
 * years at least the longest-serving doctor's (16+), the procedures under
 * what the six doctors' rows add up to (11.900). Replace them from the
 * clinic's records — and the patients sentence's number with its row:
 * tests/unit/team-data.test.ts holds a number in a description to its row's
 * `value`, in every language. The
 * EN/DE/FR/IT words are the doctors' tiles' drafts (§15.17), flagged with them.
 */
export const clinicStats: readonly [Stat, Stat, Stat] = [
  {
    icon: 'experience',
    value: 16,
    suffix: '+',
    words: {
      ro: {
        label: 'Ani de experiență',
        description: 'Punem grija, expertiza și empatia în fiecare detaliu.',
      },
      en: {
        label: 'Years of experience',
        description: 'We put care, expertise and empathy into every detail.',
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
        description: 'Mettiamo cura, competenza ed empatia in ogni dettaglio.',
      },
    },
  },
  {
    icon: 'patients',
    value: 8000,
    suffix: '+',
    words: {
      ro: {
        label: 'Pacienți',
        description:
          'Peste 8000 de zâmbete îngrijite cu dedicare și profesionalism.',
      },
      en: {
        label: 'Patients',
        description:
          'More than 8000 smiles cared for with dedication and professionalism.',
      },
      de: {
        label: 'Patienten',
        description:
          'Über 8000 Lächeln, mit Hingabe und Professionalität betreut.',
      },
      fr: {
        label: 'Patients',
        description:
          'Plus de 8000 sourires soignés avec dévouement et professionnalisme.',
      },
      it: {
        label: 'Pazienti',
        description:
          'Oltre 8000 sorrisi curati con dedizione e professionalità.',
      },
    },
  },
  {
    icon: 'interventions',
    value: 11000,
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
];

/**
 * The doctor a URL segment names, against the SHIPPED list (run ledger D3).
 * The page's WALK does not call it — `generateStaticParams` maps `doctors`
 * itself and the populator searches the list it was handed — so its callers
 * are the doctor route's `generateMetadata`, tools, stories and tests, for
 * which "the real Dr. Nicu" is exactly the lookup they want. `undefined` means
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
