import { Buffer } from 'node:buffer';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  auxiliaries,
  coursesByYear,
  doctors,
  splitKeywords,
  type AuxiliaryMember,
  type AuxiliaryWords,
  type Doctor,
  type DoctorStat,
  type DoctorStatWords,
  type DoctorWords,
  type StatIcon,
  type TeamPicture,
} from '../../src/lib/team/team';
import { clinic, type SchemaDay } from '../../src/lib/clinic/clinic';
import type { ImagePath } from '../../src/lib/image-path/image-path';
import { locales, type Locale } from '../../src/i18n/locales';

// lib/team INTEGRITY — the checks the compiler cannot make (the hero-slides,
// reviews and prices precedents). `tsc` proves every row HAS five languages
// and every field each of them needs; only a test can see that one of them is
// an empty string, that two people share an id, that a picture points at
// nothing on disk, that a language is one `about` paragraph short, or that a
// course row is dated outside any plausible career or filed out of order.
// (Until 2026-09-30 a doctor also carried a `servicesCategory`, held here to
// the categories lib/prices really has; the field left with the card's
// services link — lib/team's NO PORTRAIT AND NO SERVICES CATEGORY — and the
// check returns with it.)
//
// SINCE 2026-09-21 (the G2 fold) it also holds the checks a LAYOUT needs from
// its data, which no component can make about words it has not been given
// yet: the 320px ceilings on the unbreakable part of a name and of a position
// — a doctor's position has a tighter one of its own since the ribbon's mount,
// 2026-09-30 — (both lines opt out of hyphenation), the `<k>` marks staying inside
// `philosophy` where `splitKeywords` is the only thing that cuts them, and the
// lines a band keys its rows by being distinct — sections/DoctorProfile keys
// each `about` paragraph by its text (run ledger D14) and sections/
// DoctorCourses each course line by its text (D15).
//
// SINCE ROUND 2 (2026-09-25, run ledger D17) the words have a new shape —
// `philosophy` is the quote, `about` a list of third-person paragraphs, and a
// course a row with its year beside five finished lines — and the checks
// follow it: every `about` paragraph non-empty, trimmed, newline-free, unique
// within its language and as many in every language as in the Romanian;
// every doctor with at least one course row, each dated with a whole year in
// 1990 … 2026, each line finished and unique within its language, the rows
// written newest → oldest (the design order, like the doctors'); and
// `coursesByYear` over every doctor and language returning descending years
// with every line in it exactly once. The assistant pair and its two checks
// left with the „Echipa mea" band (D13).
//
// SINCE ROUND 2f (2026-09-26, run ledger D32) every doctor carries `stats`,
// the tiles of the doctor page's „în cifre" band (D30), and they get the
// checks a free number and a free sentence need: at least one tile per
// doctor, each of the four drawings at most once, a whole non-negative
// `value` with "+" or nothing after it, a label and a sentence in every
// language — non-empty, trimmed, one line, mark-free, the label digit-free
// and inside the 21-character ceiling — and THE PATIENTS RULE: a sentence may
// repeat the tile's number (the owner's „Peste 3000 de zâmbete…"), and then
// every number it carries must BE that `value`, in as many places in every
// language as in the Romanian. The last block pins the type the PAGE's glyph
// map (`STAT_ICONS` in app/[locale]/team/[slug]/stat-tiles.tsx, the one
// module the page and its story twin share; the band takes a finished
// ReactNode) is exhaustive over — `StatIcon`, exactly the four — and refuses
// a fifth.
//
// SINCE 2026-09-30 (the clinic's six real doctors, review folds): every
// doctor's week lies INSIDE the clinic's own (`clinic.hours`, lib/clinic —
// never a week typed here, so the check follows the real week when it lands
// and re-judges every doctor the day it changes), and every number an `about`
// paragraph carries is the same in all five languages, as the stat sentences'
// numbers already are.
//
// In the node `unit` project rather than beside the module: pure data, no DOM,
// and the existence checks read the file system. The FUNCTIONS
// (`splitKeywords`, `coursesByYear`, `findDoctor`, `findAuxiliary`) are pinned
// beside the module in src/lib/team/team.test.ts; this file only calls
// `splitKeywords` as the balanced-tag check it doubles as, and `coursesByYear`
// over the shipped rows.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const PUBLIC = join(ROOT, 'public');

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CLOCK = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/** A line break of either kind — a paragraph or a course line is ONE line of
 *  source; the band decides where it wraps (lib/hero-slides' own rule). */
const LINE_BREAK = /[\r\n]/;

/** schema.org's seven, spelled once here — lib/clinic exports the union as a
 *  TYPE only, and `satisfies` makes this list fail to compile the day the
 *  union changes rather than pass a stale week. */
const WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const satisfies readonly SchemaDay[];

/** The doctor's single-string fields — `about` is a LIST and has its own test. */
const DOCTOR_WORD_KEYS = ['name', 'position', 'philosophy'] as const;

/** A `<k>` or `</k>` in a field that is not a `philosophy` — case-insensitive,
 *  because a stray `<K>` is just as visible to a patient (F10). */
const KEYWORD_MARK = /<\/?k>/i;

/**
 * THE WINDOW A COURSE YEAR MUST FALL IN (run ledger D17). The floor is older
 * than any course a practising doctor would still list; the ceiling is the
 * year this check was written in, because a course dated in the future is not
 * a qualification anybody holds yet (CMSR: the page may describe, never
 * anticipate). Raise the ceiling with the calendar the day a real row needs
 * it — deliberately a constant, never `new Date()`, so the suite gives the
 * same answer on every day it runs.
 */
const FIRST_COURSE_YEAR = 1990;
const LAST_COURSE_YEAR = 2026;

/**
 * The longest run of characters that CANNOT break. Whitespace is a break
 * opportunity and so is a hyphen (a browser wraps after „Ana-", and „Cluj-"
 * is where „Cluj-Napoca" splits), while the two lines this file measures wear
 * `hyphens-none` (PersonnelCard D4/D5) — so nothing else in them may break.
 */
const longestUnbreakable = (value: string): string =>
  value
    .split(/[\s-]+/)
    .reduce(
      (longest, token) => (token.length > longest.length ? token : longest),
      '',
    );

/**
 * THE TWO CEILINGS, measured rather than chosen (G2 a11y, 2026-09-21), both at
 * the 320px stress width where a card's content box is 206px and a roster
 * track's is 256px:
 *   · a NAME wears ui/Heading's fluid `hero` step on the doctor page — 32px at
 *     320 — so ~16 characters of it fill a 256px column. Longer, and the name
 *     protrudes into the gutter instead of wrapping, because the h1 opts out
 *     of the site-wide `hyphens: auto` (§15.14's rider);
 *   · a POSITION is the mono eyebrow, whose tracking makes every character
 *     wider than it looks: PersonnelCard D5 records 21 characters as the
 *     ceiling inside the card's own 206px box, and it opts out of hyphenation
 *     for the same reason.
 * A row over either is a DATA fix — a shorter word — never a letter-level
 * emergency break through a person's name or title (D5's own rule).
 */
const NAME_CEILING = 16;
const POSITION_CEILING = 21;

/**
 * A DOCTOR'S POSITION HAS A TIGHTER CEILING SINCE THE RIBBON'S MOUNT
 * (2026-09-30 — CLAUDE.md §15.26's "owed at the mount", re-derived for the
 * narrower line the lanes leave). The doctor card now sits inside ui/Ribbon,
 * whose two side lanes inset it (PersonnelCard D17's INSET), so at the 320px
 * stress window — a 241px column once the classic scrollbar gutter is
 * reserved — the name block's line is 174.5px where the plain card had 206px.
 * MEASURED on the built Team page (Chromium): the mono eyebrow advances 9.8px
 * a character (8.4px of glyph + 1.4px of tracking), so 17 characters are
 * 166.6px and fit, 18 are 176.4px and do not.
 *
 * WHAT A LONGER WORD COSTS, measured the same day rather than assumed: the
 * name block grows past its line, the ribbon's guard finds words in its lane
 * and WITHHOLDS THE WHOLE RIBBON at that window (every canvas 0 × 0) — a 22-
 * character word does it at 320 and at 360 alike. The page does not scroll
 * sideways and no word is lost; the decoration is. An auxiliary tile sits in
 * no ribbon and keeps the 21 above.
 *
 * A NAME is deliberately NOT given a card ceiling: a person cannot be renamed.
 * Measured on the same page at the `band` step's 30px: a 12-letter surname
 * („Alexandrescu", 178px) still leaves the ribbon drawn at 320, a 14-letter
 * one („Constantinescu", 202px) withholds it under a ~345px window and draws
 * from 360. The lever for a longer real surname is the card's — the name's
 * step on a narrow card (PersonnelCard's NAME_STEP) — never this file's.
 */
const DOCTOR_POSITION_CEILING = 17;

/**
 * A STAT LABEL'S CEILING — the position's 21, as run ledger D32's contract
 * sets it. The label is the tile's `<h3>`, one tile to a row at 320px (D21),
 * and it inherits the number the eyebrow was MEASURED at rather than being
 * measured itself: the band did not exist when this was written. Re-measure
 * against sections/DoctorStats the day a label is refused, before raising it.
 */
const STAT_LABEL_CEILING = POSITION_CEILING;

/**
 * The four drawings, spelled once here — lib/team exports `StatIcon` as a
 * TYPE only (the page owns the glyphs, lib is React-free), so, like WEEK
 * above, `satisfies` makes every entry a real icon and the type pin in the
 * last block makes the union no wider than this list.
 */
const STAT_ICONS = [
  'experience',
  'patients',
  'courses',
  'interventions',
] as const satisfies readonly StatIcon[];

/**
 * A NUMBER as a sentence writes it: a plain run of digits, or groups of three
 * joined by the grouping marks the five languages use — the dot of ro/de, the
 * comma of en, the no-break spaces French sets (U+00A0, U+202F) — so a future
 * „Peste 10.000" is read as ten thousand and not as the two numbers 10 and
 * 000. An ordinary space is deliberately NOT a grouping mark: „în 12 100 de…"
 * is likelier two numbers than one, and a French thousands space that can end
 * a line is a typo of its own.
 */
const NUMBER_IN_TEXT = /\d{1,3}(?:[.,  ]\d{3})+(?!\d)|\d+/g;

/** Every number a sentence carries, in order, as the value it spells. */
const numbersIn = (text: string): number[] =>
  [...text.matchAll(NUMBER_IN_TEXT)].map((match) =>
    Number(match[0].replaceAll(/\D/g, '')),
  );

/** Every picture the two lists ship, labelled for a readable failure. */
const pictures: [string, TeamPicture][] = [
  ...auxiliaries.map((member): [string, TeamPicture] => [
    `${member.id}.portrait`,
    member.portrait,
  ]),
  ...doctors.map((doctor): [string, TeamPicture] => [
    `${doctor.id}.cutout`,
    doctor.cutout,
  ]),
];

describe('lib/team — the people are well-formed', () => {
  it('ships both lists with rows (the fence never passes vacuously)', () => {
    expect(doctors.length).toBeGreaterThan(0);
    expect(auxiliaries.length).toBeGreaterThan(0);
  });

  it('gives every person a unique kebab-case id — a doctor’s IS his URL (D3)', () => {
    const ids = [...doctors, ...auxiliaries].map((person) => person.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(KEBAB_CASE);
  });
});

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/**
 * The pixel size a PNG or JPEG declares in its OWN header — PNG: the IHDR
 * chunk's two big-endian 32-bit words right after the 8-byte signature; JPEG:
 * the first SOFn marker's height then width (16-bit each) — with no image
 * library in the loop, so the unit project stays pure Node (G2-R2 tier 1,
 * typescript F3).
 */
function readPixelSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  if (bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes.readUInt16BE(0) === 0xffd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        throw new Error(`${path}: not a JPEG marker at byte ${offset}`);
      }
      const marker = bytes[offset + 1];
      const isSof =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc;
      if (isSof) {
        return {
          height: bytes.readUInt16BE(offset + 5),
          width: bytes.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + bytes.readUInt16BE(offset + 2);
    }
    throw new Error(`${path}: no SOF marker`);
  }
  throw new Error(`${path}: neither PNG nor JPEG`);
}

describe('lib/team — the pictures', () => {
  it.each(pictures)(
    '%s exists on disk under public/ (§11)',
    (_label, picture) => {
      expect(picture.src.startsWith('/images/')).toBe(true);
      expect(existsSync(join(PUBLIC, picture.src)), picture.src).toBe(true);
    },
  );

  it.each(pictures)(
    '%s carries its intrinsic size — the pixels on disk (§11)',
    (_label, picture) => {
      expect(Number.isInteger(picture.width)).toBe(true);
      expect(Number.isInteger(picture.height)).toBe(true);
      expect(picture.width).toBeGreaterThan(0);
      expect(picture.height).toBeGreaterThan(0);
      // The row's numbers are what ui/Image reserves the box from, so they
      // must BE the file's: a row typed from memory, or a file re-exported
      // under an untouched row, would ship layout shift on the doctor page's
      // LCP element. Read off the file's own header, never trusted.
      expect(readPixelSize(join(PUBLIC, picture.src)), picture.src).toEqual({
        width: picture.width,
        height: picture.height,
      });
    },
  );

  it('keeps every team picture at the ONE ratio, 3:4 — portraits and cutouts alike (§11, PersonnelCard D3, D17)', () => {
    // Uniform team photos are §11's rule and the card's own. An auxiliary's
    // portrait that arrives at another ratio is CROPPED by its tile (D3); a
    // doctor's cutout is drawn WHOLE (D17), so another ratio would make one
    // doctor card taller than the next. Either way the data is where the
    // disagreement has to surface.
    for (const [label, picture] of pictures) {
      expect(picture.width * 4, label).toBe(picture.height * 3);
    }
  });

  it('keeps every cutout a PNG — the opener and the card need the alpha channel (D6, PersonnelCard D17)', () => {
    for (const doctor of doctors) {
      expect(doctor.cutout.src.endsWith('.png'), doctor.id).toBe(true);
    }
  });

  it('still ships DEMO pictures only — tighten to /images/team/ with the first real one', () => {
    // The convention record, the lib/reviews and lib/hero-slides wording: the
    // clinic's own portraits go in public/images/team/, and the day a
    // non-demo path appears in either list this assertion becomes
    // `startsWith('/images/team/')`. Until then it says out loud that every
    // face on the site is a placeholder (the module header's TODO(owner)).
    for (const [label, picture] of pictures) {
      expect(picture.src.startsWith('/images/demo/'), label).toBe(true);
    }
  });
});

describe('lib/team — the words, in all five languages', () => {
  it.each(locales)('every doctor has real text for "%s"', (locale: Locale) => {
    for (const doctor of doctors) {
      const words = doctor.words[locale];
      for (const key of DOCTOR_WORD_KEYS) {
        const value = words[key];
        expect(value, `${doctor.id}.${locale}.${key}`).not.toBe('');
        expect(value, `${doctor.id}.${locale}.${key}`).toBe(value.trim());
      }
    }
  });

  it.each(locales)(
    'every auxiliary member has real text for "%s"',
    (locale: Locale) => {
      for (const member of auxiliaries) {
        const words = member.words[locale];
        for (const key of ['name', 'position'] as const) {
          const value = words[key];
          expect(value, `${member.id}.${locale}.${key}`).not.toBe('');
          expect(value, `${member.id}.${locale}.${key}`).toBe(value.trim());
        }
      }
    },
  );

  it.each(locales)(
    'keeps every name, position and stat label inside its 320px ceiling for "%s"',
    (locale: Locale) => {
      // The lines that never hyphenate, measured as their longest
      // UNBREAKABLE run (see the ceilings above). A German draft is the
      // realistic offender — „Patientenkommunikation" was one, and became
      // „Patientenbetreuung" on this finding.
      for (const doctor of doctors) {
        const words = doctor.words[locale];
        expect(
          longestUnbreakable(words.name).length,
          `${doctor.id}.${locale}.name`,
        ).toBeLessThanOrEqual(NAME_CEILING);
        // The doctor card's line inside the ribbon's lanes — the tighter one.
        expect(
          longestUnbreakable(words.position).length,
          `${doctor.id}.${locale}.position`,
        ).toBeLessThanOrEqual(DOCTOR_POSITION_CEILING);
        // The tile's `<h3>` (run ledger D32 — the contract's ceiling).
        for (const stat of doctor.stats) {
          expect(
            longestUnbreakable(stat.words[locale].label).length,
            `${doctor.id}.stats.${stat.icon}.${locale}.label`,
          ).toBeLessThanOrEqual(STAT_LABEL_CEILING);
        }
      }
      for (const member of auxiliaries) {
        const words = member.words[locale];
        expect(
          longestUnbreakable(words.name).length,
          `${member.id}.${locale}.name`,
        ).toBeLessThanOrEqual(NAME_CEILING);
        expect(
          longestUnbreakable(words.position).length,
          `${member.id}.${locale}.position`,
        ).toBeLessThanOrEqual(POSITION_CEILING);
      }
    },
  );

  it.each(locales)(
    'leaves the `<k>` marks to `philosophy` alone — no other field carries one for "%s"',
    (locale: Locale) => {
      // The marks are a `philosophy` convention (run ledger D2, D17) and
      // nothing else splits them: a `<k>` that wandered into a name, a
      // position, an `about` paragraph, a course line or a stat's label or
      // sentence would reach the page as visible text, because only
      // `splitKeywords` ever cuts one out (F10).
      for (const doctor of doctors) {
        const words = doctor.words[locale];
        expect(words.name, `${doctor.id}.${locale}.name`).not.toMatch(
          KEYWORD_MARK,
        );
        expect(words.position, `${doctor.id}.${locale}.position`).not.toMatch(
          KEYWORD_MARK,
        );
        for (const [index, paragraph] of words.about.entries()) {
          expect(
            paragraph,
            `${doctor.id}.${locale}.about[${index}]`,
          ).not.toMatch(KEYWORD_MARK);
        }
        for (const [index, course] of doctor.courses.entries()) {
          expect(
            course.words[locale],
            `${doctor.id}.courses[${index}].${locale}`,
          ).not.toMatch(KEYWORD_MARK);
        }
        for (const stat of doctor.stats) {
          const { label, description } = stat.words[locale];
          const where = `${doctor.id}.stats.${stat.icon}.${locale}`;
          expect(label, `${where}.label`).not.toMatch(KEYWORD_MARK);
          expect(description, `${where}.description`).not.toMatch(KEYWORD_MARK);
        }
      }
      for (const member of auxiliaries) {
        const words = member.words[locale];
        expect(words.name, `${member.id}.${locale}.name`).not.toMatch(
          KEYWORD_MARK,
        );
        expect(words.position, `${member.id}.${locale}.position`).not.toMatch(
          KEYWORD_MARK,
        );
      }
    },
  );

  it.each(locales)(
    'every `philosophy` splits into balanced segments with at least one key word for "%s"',
    (locale: Locale) => {
      for (const doctor of doctors) {
        const philosophy = doctor.words[locale].philosophy;
        // splitKeywords throws on a half-open or nested tag, naming the text —
        // so this single call is the balanced-tag check as well.
        const segments = splitKeywords(philosophy);
        expect(
          segments.some((segment) => segment.keyword),
          `${doctor.id}.${locale}.philosophy`,
        ).toBe(true);
        for (const segment of segments) {
          expect(segment.text, `${doctor.id}.${locale}.philosophy`).not.toBe(
            '',
          );
          // A mark that survived the split would reach the page as visible
          // text — the failure mode D2 moved the marks into the data to risk.
          // The same case-insensitive pattern the other fields are held to.
          expect(segment.text, `${doctor.id}.${locale}.philosophy`).not.toMatch(
            KEYWORD_MARK,
          );
        }
      }
    },
  );

  it.each(locales)(
    'every doctor has `about` paragraphs, one finished paragraph each, as many as the Romanian, for "%s"',
    (locale: Locale) => {
      for (const doctor of doctors) {
        const { about } = doctor.words[locale];
        expect(about.length, `${doctor.id}.${locale}.about`).toBeGreaterThan(0);
        for (const [index, paragraph] of about.entries()) {
          const where = `${doctor.id}.${locale}.about[${index}]`;
          expect(paragraph, where).not.toBe('');
          expect(paragraph, where).toBe(paragraph.trim());
          // One paragraph is one `<p>` (D14): a newline inside one would
          // wrap where the string says rather than where the column does.
          expect(paragraph, where).not.toMatch(LINE_BREAK);
        }
        // sections/DoctorProfile keys its paragraphs by their text, so two
        // equal ones would collapse into one React key — a paragraph silently
        // missing from the page.
        expect(new Set(about).size, `${doctor.id}.${locale}.about`).toBe(
          about.length,
        );
        // A language one paragraph short is a translation nobody finished.
        expect(about.length, `${doctor.id}.${locale}.about`).toBe(
          doctor.words.ro.about.length,
        );
      }
    },
  );

  it.each(locales)(
    'carries the same numbers in every `about` paragraph as the Romanian, for "%s"',
    (locale: Locale) => {
      // A number inside a paragraph — a year, a count — is written once per
      // language: five copies, free to disagree, which is the very thing
      // storing a course's year ONCE stopped (lib/team's COURSES paragraph).
      // The placeholders carry none today; the owner's real biographies will
      // („din 2016"), and that is exactly when one language can drift.
      for (const doctor of doctors) {
        for (const [index, paragraph] of doctor.words[locale].about.entries()) {
          expect(
            numbersIn(paragraph),
            `${doctor.id}.${locale}.about[${index}]`,
          ).toEqual(numbersIn(doctor.words.ro.about[index]));
        }
      }
    },
  );
});

describe('lib/team — the course rows (run ledger D17)', () => {
  it('gives every doctor at least one row, each dated with a whole year in 1990 … 2026', () => {
    for (const doctor of doctors) {
      expect(doctor.courses.length, doctor.id).toBeGreaterThan(0);
      for (const [index, course] of doctor.courses.entries()) {
        const where = `${doctor.id}.courses[${index}]: ${course.year}`;
        expect(Number.isInteger(course.year), where).toBe(true);
        expect(course.year, where).toBeGreaterThanOrEqual(FIRST_COURSE_YEAR);
        expect(course.year, where).toBeLessThanOrEqual(LAST_COURSE_YEAR);
      }
    }
  });

  it('writes every doctor’s rows newest → oldest — the design order, like the doctors’', () => {
    // `coursesByYear` does not need this (its own suite feeds it shuffled
    // rows); the FILE does — read top to bottom it is the page's order, and
    // the owner edits the file, not the page.
    for (const doctor of doctors) {
      const years = doctor.courses.map((course) => course.year);
      expect(years, doctor.id).toEqual(years.toSorted((a, b) => b - a));
    }
  });

  it.each(locales)(
    'gives every row one finished line, unique within the doctor’s list, for "%s"',
    (locale: Locale) => {
      for (const doctor of doctors) {
        const lines = doctor.courses.map((course) => course.words[locale]);
        for (const [index, line] of lines.entries()) {
          const where = `${doctor.id}.courses[${index}].${locale}`;
          expect(line, where).not.toBe('');
          expect(line, where).toBe(line.trim());
          // One line each: the band prints them as list items (lib/hero-
          // slides' own rule).
          expect(line, where).not.toMatch(LINE_BREAK);
        }
        // sections/DoctorCourses keys its <li>s by the line itself, so a
        // duplicate would collapse two courses into one React key — one row
        // silently missing from a doctor's page (F10).
        expect(new Set(lines).size, `${doctor.id}.courses.${locale}`).toBe(
          lines.length,
        );
      }
    },
  );

  it.each(locales)(
    'groups every doctor’s rows through coursesByYear in descending years, every line once, for "%s"',
    (locale: Locale) => {
      for (const doctor of doctors) {
        const groups = coursesByYear(doctor, locale);
        const where = `${doctor.id}.${locale}`;
        // STRICTLY descending: one heading per year, never the same year twice.
        for (let index = 1; index < groups.length; index += 1) {
          expect(groups[index - 1].year, where).toBeGreaterThan(
            groups[index].year,
          );
        }
        const printed = groups.flatMap((group) => group.courses);
        expect(printed.length, where).toBe(doctor.courses.length);
        expect(printed.toSorted(), where).toEqual(
          doctor.courses.map((course) => course.words[locale]).toSorted(),
        );
      }
    },
  );
});

describe('lib/team — the „în cifre" tiles (run ledger D32)', () => {
  it('gives every doctor at least one tile, each of the four drawings at most once', () => {
    for (const doctor of doctors) {
      expect(doctor.stats.length, doctor.id).toBeGreaterThan(0);
      const icons = doctor.stats.map((stat) => stat.icon);
      for (const icon of icons) {
        // A cast could smuggle an id the page has no glyph for past the
        // compiler; the page's exhaustive map would then have nothing to draw.
        expect(STAT_ICONS, `${doctor.id}: ${icon}`).toContain(icon);
      }
      // Two tiles wearing one drawing would be two answers to one question —
      // and the drawing is the natural key the band has for its tiles.
      expect(new Set(icons).size, `${doctor.id}: ${icons.join(' · ')}`).toBe(
        icons.length,
      );
    }
  });

  it('counts with a whole number ≥ 0, followed by "+" or by nothing', () => {
    for (const doctor of doctors) {
      for (const stat of doctor.stats) {
        const where = `${doctor.id}.stats.${stat.icon}: ${stat.value}${stat.suffix ?? ''}`;
        // Number.isInteger also refuses NaN and ±Infinity — the band counts
        // up to this number frame by frame (D31), and neither is a target.
        expect(Number.isInteger(stat.value), where).toBe(true);
        expect(stat.value, where).toBeGreaterThanOrEqual(0);
        expect([undefined, '+'], where).toContain(stat.suffix);
      }
    }
  });

  it.each(locales)(
    'gives every tile a finished label and sentence for "%s" — the five languages read ONE list',
    (locale: Locale) => {
      for (const doctor of doctors) {
        // "They are one list": `Record<Locale, …>` makes a missing language a
        // failed `tsc`, but a cast can still drop one — and the band would
        // then print fewer tiles in one language than in the others.
        const present = doctor.stats.filter(
          (stat) => stat.words[locale] !== undefined,
        );
        expect(present.length, `${doctor.id}.stats.${locale}`).toBe(
          doctor.stats.length,
        );
        for (const stat of present) {
          const { label, description } = stat.words[locale];
          const where = `${doctor.id}.stats.${stat.icon}.${locale}`;
          for (const [field, value] of [
            ['label', label],
            ['description', description],
          ] as const) {
            expect(value, `${where}.${field}`).not.toBe('');
            expect(value, `${where}.${field}`).toBe(value.trim());
            // One line each: the band decides where the tile's text wraps.
            expect(value, `${where}.${field}`).not.toMatch(LINE_BREAK);
          }
          // The number is printed on its own line above the label; a label
          // that carried one would say it twice (lib/team's A DOCTOR'S
          // NUMBERS).
          expect(label, `${where}.label`).not.toMatch(/\d/);
        }
      }
    },
  );

  it('reads a grouped number as ONE number — the reader the patients rule below relies on', () => {
    expect(
      numbersIn(
        'Peste 10.000, over 3,000, plus de 3 000 et 2 500, oltre 2500.',
      ),
    ).toEqual([10000, 3000, 3000, 2500, 2500]);
    // An ordinary space separates two numbers; a decimal is two runs, never
    // the whole number a tile counts to.
    expect(numbersIn('în 12 100 de cazuri, 1,5 ore')).toEqual([12, 100, 1, 5]);
    expect(numbersIn('Punem grija în fiecare detaliu.')).toEqual([]);
  });

  it.each(locales)(
    'makes every number a sentence carries its tile’s own value, as many times as the Romanian, for "%s"',
    (locale: Locale) => {
      // THE PATIENTS RULE (lib/team's A SENTENCE MAY CARRY THE NUMBER): the
      // owner's sentence repeats the tile's count, so the two are one fact
      // written twice — a `value` edited without its sentence, or a sentence
      // translated with a different number, is a page that contradicts
      // itself inside one tile.
      for (const doctor of doctors) {
        for (const stat of doctor.stats) {
          const where = `${doctor.id}.stats.${stat.icon}.${locale}`;
          const numbers = numbersIn(stat.words[locale].description);
          for (const number of numbers) {
            expect(number, `${where}: ${stat.words[locale].description}`).toBe(
              stat.value,
            );
          }
          // A translation that dropped the number („Thousands of smiles")
          // would pass the loop above by carrying none at all.
          expect(numbers.length, `${where}: numbers vs ro`).toBe(
            numbersIn(stat.words.ro.description).length,
          );
        }
      }
    },
  );

  it('exercises the patients rule — at least one shipped sentence carries its number', () => {
    // Without this, a data edit that removed every number from every sentence
    // would leave the rule above passing over nothing.
    expect(
      doctors.some((doctor) =>
        doctor.stats.some(
          (stat) => numbersIn(stat.words.ro.description).length > 0,
        ),
      ),
    ).toBe(true);
  });
});

describe('lib/team — the weeks lib/hours prints', () => {
  it('names only schema.org days, never the same day twice', () => {
    for (const doctor of doctors) {
      const seen: string[] = [];
      for (const entry of doctor.hours) {
        expect(entry.days.length, doctor.id).toBeGreaterThan(0);
        for (const day of entry.days) {
          expect(WEEK, `${doctor.id}: ${day}`).toContain(day);
          // lib/hours lets a later entry overwrite an earlier one ("the last
          // one wins"), so a repeat would silently drop a whole shift.
          expect(seen, `${doctor.id}: ${day} twice`).not.toContain(day);
          seen.push(day);
        }
      }
    }
  });

  it('opens before it closes, on a 24h clock', () => {
    for (const doctor of doctors) {
      for (const entry of doctor.hours) {
        const where = `${doctor.id}: ${entry.opens}–${entry.closes}`;
        expect(entry.opens, where).toMatch(CLOCK);
        expect(entry.closes, where).toMatch(CLOCK);
        // Zero-padded "HH:MM" compares correctly as text.
        expect(entry.opens < entry.closes, where).toBe(true);
      }
    }
  });

  it('keeps every doctor’s week inside the clinic’s own (lib/clinic) — never a patient at a closed door', () => {
    // A doctor's week is the doctor's own (lib/team's HOURS paragraph), but it
    // can only be a PART of the clinic's: a day the clinic is closed, or an
    // hour before it opens or after it closes, would send a patient to a
    // locked door. Judged against `clinic.hours` rather than a week typed
    // here, so the check follows the clinic's real week the day it lands and
    // re-judges every doctor whenever it changes. Like lib/hours, a later
    // clinic entry for the same day wins.
    const open = new Map<SchemaDay, { opens: string; closes: string }>();
    for (const entry of clinic.hours) {
      for (const day of entry.days) {
        open.set(day, { opens: entry.opens, closes: entry.closes });
      }
    }
    for (const doctor of doctors) {
      for (const entry of doctor.hours) {
        for (const day of entry.days) {
          const clinicDay = open.get(day);
          expect(
            clinicDay,
            `${doctor.id}: ${day}, the clinic is closed`,
          ).toBeDefined();
          if (!clinicDay) continue;
          expect(
            entry.opens >= clinicDay.opens,
            `${doctor.id}: ${day} opens ${entry.opens}, the clinic at ${clinicDay.opens}`,
          ).toBe(true);
          expect(
            entry.closes <= clinicDay.closes,
            `${doctor.id}: ${day} closes ${entry.closes}, the clinic at ${clinicDay.closes}`,
          ).toBe(true);
        }
      }
    }
  });
});

describe('lib/team — what the types guarantee (run ledger D2)', () => {
  it('types every picture path through lib/image-path, the promoted spelling', () => {
    expectTypeOf<TeamPicture['src']>().toEqualTypeOf<ImagePath>();
    expectTypeOf<Doctor['words']>().toEqualTypeOf<
      Readonly<Record<Locale, DoctorWords>>
    >();
  });

  it('refuses a doctor with a missing language', () => {
    const words: DoctorWords = {
      name: 'Dr. Probă',
      position: 'Medic dentist',
      philosophy: 'Lucrez în <k>ortodonție</k>.',
      about: ['Dr. Probă lucrează în clinică din 2020.'],
    };
    const fourLanguages: Doctor = {
      id: 'proba',
      cutout: { src: '/images/demo/cutout-1.png', width: 900, height: 1200 },
      hours: [],
      courses: [],
      stats: [],
      // @ts-expect-error — `de` is missing: a four-language doctor is not a Doctor
      words: { ro: words, en: words, fr: words, it: words },
    };
    expect(fourLanguages.id).toBe('proba');
  });

  it('names exactly the four drawings the page has glyphs for, and keeps the contract’s word shape (D30, D32)', () => {
    // Both directions: `satisfies` on STAT_ICONS refuses an entry the union
    // lacks; this refuses a member the list lacks — so the list the tests
    // check against and the union the page's glyph map is exhaustive over
    // cannot drift apart.
    expectTypeOf<StatIcon>().toEqualTypeOf<(typeof STAT_ICONS)[number]>();
    // (D-DASH, the other wording rule, is scanned in its own block below.)
    expectTypeOf<DoctorStat['words']>().toEqualTypeOf<
      Readonly<Record<Locale, Readonly<{ label: string; description: string }>>>
    >();
    expectTypeOf<Doctor['stats']>().toEqualTypeOf<readonly DoctorStat[]>();
  });

  it('refuses a fifth drawing, a suffix other than "+", and a tile with a missing language', () => {
    const words: DoctorStatWords = {
      label: 'Premii',
      description: 'Recunoaștere pentru calitate.',
    };
    const all = { ro: words, en: words, de: words, fr: words, it: words };
    const fifth: DoctorStat = {
      // @ts-expect-error — no fifth drawing: the band has a glyph for four
      icon: 'awards',
      value: 3,
      words: all,
    };
    const approximately: DoctorStat = {
      icon: 'patients',
      value: 3000,
      // @ts-expect-error — only "+" is a suffix: it means "at least", nothing else is defined
      suffix: '~',
      words: all,
    };
    const fourLanguages: DoctorStat = {
      icon: 'courses',
      value: 10,
      // @ts-expect-error — `fr` is missing: a four-language tile is not a tile
      words: { ro: words, en: words, de: words, it: words },
    };
    expect([fifth.value, approximately.value, fourLanguages.value]).toEqual([
      3, 3000, 10,
    ]);
  });

  it('refuses an auxiliary member with a missing language', () => {
    const words: AuxiliaryWords = {
      name: 'Probă',
      position: 'Asistentă medicală',
    };
    const fourLanguages: AuxiliaryMember = {
      id: 'proba',
      portrait: { src: '/images/demo/portrait-2.jpg', width: 600, height: 800 },
      // @ts-expect-error — `it` is missing: a four-language member is not a member
      words: { ro: words, en: words, de: words, fr: words },
    };
    expect(fourLanguages.id).toBe('proba');
  });
});

describe('lib/team — the numbers agree with the page they sit on (round 2f)', () => {
  it('never claims fewer courses than the doctor’s own rows list', () => {
    // The stats band sits UNDER the courses band on the same page: a tile that
    // says „5 cursuri" over a timeline of six rows would contradict itself in
    // the visitor's face. The tile may say MORE (a doctor lists a selection),
    // never less — and a bare count (no `+`) must equal the rows exactly.
    for (const doctor of doctors) {
      const tile = doctor.stats.find((stat) => stat.icon === 'courses');
      if (!tile) continue;
      expect(tile.value, doctor.id).toBeGreaterThanOrEqual(
        doctor.courses.length,
      );
      if (tile.suffix === undefined) {
        expect(tile.value, `${doctor.id}: an exact count`).toBe(
          doctor.courses.length,
        );
      }
    }
  });
});

/**
 * Every string a language ships for the team: the names, positions and
 * philosophy of everyone, a doctor's paragraphs, course lines and stat words.
 */
function shippedStrings(locale: Locale): readonly string[] {
  const strings: string[] = [];
  for (const member of auxiliaries) {
    strings.push(member.words[locale].name, member.words[locale].position);
  }
  for (const doctor of doctors) {
    const words = doctor.words[locale];
    strings.push(words.name, words.position, words.philosophy, ...words.about);
    for (const course of doctor.courses) strings.push(course.words[locale]);
    for (const stat of doctor.stats) {
      strings.push(stat.words[locale].label, stat.words[locale].description);
    }
  }
  return strings;
}

describe('lib/team — D-DASH, the owner’s wording rule of 2026-09-06', () => {
  // No dash INSIDE a sentence: a spaced dash of any kind, or an em/en dash
  // anywhere, is refused — a comma, a colon or a full stop instead. A hyphen
  // inside a word („Cluj-Napoca", „exersat-o", „X-ray") is not a dash and
  // passes. Pinned since G2-R2 tier 1 (typescript F4): the module's header
  // promised the rule and nothing kept it; the owner's real biographies are
  // the strings this is for.
  const DASH = /\s[—–-]\s|[—–]/;

  it.each(locales)('keeps every dash out of every %s sentence', (locale) => {
    const strings = shippedStrings(locale);
    expect(strings.length).toBeGreaterThan(0);
    for (const string of strings) {
      expect(string, string).not.toMatch(DASH);
    }
  });

  it('is a scan with teeth', () => {
    expect('Cluj-Napoca, exersat-o').not.toMatch(DASH);
    expect('o pauză - apoi').toMatch(DASH);
    expect('o pauză — apoi').toMatch(DASH);
    expect('o pauză–apoi').toMatch(DASH);
  });
});
