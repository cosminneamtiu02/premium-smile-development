import { Buffer } from 'node:buffer';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  auxiliaries,
  clinicStats,
  doctors,
  splitKeywords,
  type AuxiliaryMember,
  type AuxiliaryWords,
  type Course,
  type Doctor,
  type Stat,
  type StatWords,
  type DoctorWords,
  type StatIcon,
  type TeamPicture,
} from '../../src/lib/team/team';
import type { ImagePath } from '../../src/lib/image-path/image-path';
import { locales, type Locale } from '../../src/i18n/locales';

// lib/team INTEGRITY — the checks the compiler cannot make (the hero-slides,
// reviews and prices precedents). `tsc` proves every row HAS five languages
// and every field each of them needs; only a test can see that one of them is
// an empty string, that two people share an id, that a picture points at
// nothing on disk, that a language is one `about` paragraph short, or that
// one course idea is listed twice for one doctor.
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
// the fields `splitKeywords` cuts — `philosophy`, and since 2026-10-13 the
// `about` paragraphs (below) — and the lines a band keys its rows by being
// distinct: sections/DoctorCourses keys each course idea by its text (one
// idea per dot since 2026-10-13, CLAUDE.md §15.23 round 7). The `about`
// paragraphs stay distinct too, judged by what a reader sees of them: sections/
// DoctorProfile keyed each one by its text (run ledger D14) until they became
// rendered nodes on 2026-10-13, and a paragraph said twice in one biography is
// a paste nobody meant either way.
//
// SINCE 2026-10-13 (CLAUDE.md §15.23 round 7, the owner: "i also wan thte
// text of biografie to be like the text at [Dr. Malea's philosophy] … so
// gary-ish er and with tighlighted keywords") an `about` paragraph carries
// `<k>…</k>` marks the way the philosophy does, and the rule that REFUSED a
// mark there became the rule that SHAPES one (lib/team's THE BIOGRAPHY'S KEY
// WORDS): every paragraph balanced — `splitKeywords` is the check, as for the
// philosophy — with one or two marks, each one to four words, no digit, no
// word of the doctor's own name, never cutting into a word, and as many marks
// in every language as in the Romanian paragraph of the same index.
//
// SINCE ROUND 2 (2026-09-25, run ledger D17) the words have a new shape —
// `philosophy` is the quote, `about` a list of third-person paragraphs, and a
// course a row of five finished lines — and the checks follow it: every
// `about` paragraph non-empty, trimmed, newline-free, unique within its
// language and as many in every language as in the Romanian; every doctor
// with at least one course row, each line finished and unique within its
// language. The assistant pair and its two checks left with the „Echipa mea"
// band (D13), and on 2026-10-13 the course YEARS left lib/team (lib/team's A
// COURSE IS ONE IDEA), taking with them their three checks here — a whole
// year in 1990 … 2026, the rows newest → oldest, `coursesByYear`'s groups.
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
// language as in the Romanian. The last block pins the type the PAGES' glyph
// map (`STAT_ICONS` in app/[locale]/team/stat-tiles.tsx, the one module every
// page that draws tiles and its story twin share; the band takes a finished
// ReactNode) is exhaustive over — `StatIcon`, exactly the four — and refuses
// a fifth.
//
// SINCE 2026-10-01 (owner: "i want it on home page too with just 3
// components. experience, patients and nr of procedures", then the same band
// on the Team page) the clinic has numbers of its OWN — `clinicStats`, the
// rows of the Home and Team pages' band — and every stat rule above walks
// them exactly as it walks a doctor's: STAT_LISTS below is the one list of
// lists those rules read, the clinic's labelled `clinic`. The clinic's rows
// add three checks of their own: exactly the owner's three drawings in his
// order, a label ceiling TIGHTER than a doctor's (the three-across row's
// narrowest tile — CLINIC_STAT_LABEL_CEILING). And, DELIBERATELY, no bound
// against a doctor's own tiles: a doctor's years, patients and procedures may
// count a career before the clinic, so a clinic number below one doctor's can
// be true — a rule demanding otherwise would refuse the owner's real figures
// (proposed in the build, removed in review, 2026-10-01).
//
// SINCE 2026-09-30 (the clinic's six real doctors, review folds): every
// number an `about` paragraph carries is the same in all five languages, as
// the stat sentences' numbers already are. (Every doctor's week was held
// inside the clinic's own here too, until the weeks left lib/team with the
// doctor page's schedule card on 2026-10-13 — lib/team's NO WEEK ON A DOCTOR.)
//
// In the node `unit` project rather than beside the module: pure data, no DOM,
// and the existence checks read the file system. The FUNCTIONS
// (`splitKeywords`, `findDoctor`, `findAuxiliary`) are pinned beside the
// module in src/lib/team/team.test.ts; this file calls `splitKeywords` only
// as the balanced-tag check it doubles as and as the reader of a marked
// text — its key words, and what a visitor sees of it with the marks gone.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const PUBLIC = join(ROOT, 'public');

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A line break of either kind — a paragraph or a course line is ONE line of
 *  source; the band decides where it wraps (lib/hero-slides' own rule). */
const LINE_BREAK = /[\r\n]/;

/** The doctor's single-string fields — `about` is a LIST and has its own test. */
const DOCTOR_WORD_KEYS = ['name', 'position', 'philosophy'] as const;

/** A `<k>` or `</k>` in a field `splitKeywords` never cuts — every field but
 *  `philosophy` and the `about` paragraphs — and a mark LEFT OVER in a piece
 *  of one it does cut. Case-insensitive, because a stray `<K>` is just as
 *  visible to a patient (F10). */
const KEYWORD_MARK = /<\/?k>/i;

/**
 * THE BIOGRAPHY'S KEY WORDS (lib/team's paragraph of that name; CLAUDE.md
 * §15.23 round 7): the philosophy's manner — "sănătatea gingiei", „explic" —
 * one or two marks per paragraph, each a phrase of one to four words.
 */
const ABOUT_MARKS = { min: 1, max: 2 } as const;
const MARK_WORDS_MAX = 4;

/** What a reader sees of a marked text: its pieces joined, the marks gone. */
const readingOf = (text: string): string =>
  splitKeywords(text)
    .map((segment) => segment.text)
    .join('');

/** The key words of a marked text, in order — the pieces ui/Keyword dresses. */
const keywordsOf = (text: string): readonly string[] =>
  splitKeywords(text)
    .filter((segment) => segment.keyword)
    .map((segment) => segment.text);

/**
 * A mark that CUTS INTO A WORD: a letter or a digit right before `<k>` or
 * right after `</k>` — „gingi<k>ei</k>" would set half a word apart — and so
 * is a hyphen between a letter and the pair, „Cluj-<k>Napoca</k>" (since
 * 2026-10-13, G2 typescript NIT). An elision's apostrophe is a word's edge,
 * so French and Italian mark the article with its noun („l’ordre des
 * étapes", „l’ordine delle fasi").
 */
const MARK_CUTS_A_WORD = /[\p{L}\p{N}]-?<k>|<\/k>-?[\p{L}\p{N}]/u;

/** A word as the name rule compares it: its punctuation gone and lower-cased,
 *  so „Malea," and „(Sabău)" inside a mark are still the doctor's name (G2
 *  typescript NIT; a hyphen between two letters is INSIDE a word for the cut
 *  rule above — „Cluj-<k>Napoca</k>" sets half a name apart). */
const bareWord = (word: string): string =>
  word.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();

/**
 * The words of a person's name a mark must never carry — the honorific
 * („Dr.", „Dr") and the parentheses and hyphens of „Dr. Malea (Sabău) Oana
 * Bianca" or „Ivașcu-Zugravu" dropped, lower-cased for the comparison.
 */
const nameWordsOf = (name: string): ReadonlySet<string> =>
  new Set(
    name
      .split(/[\s()-]+/)
      .filter((word) => word !== '' && !/^dr\.?$/i.test(word))
      .map((word) => word.toLowerCase()),
  );

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
 * RE-MEASURED 2026-10-09, after ui/Container's THE PHONE GUTTER (§15.35): at
 * 320 the column is 288px on a phone (273 under the runner's scrollbar), a
 * tile 288px with a 238px content box (273 / 223), so ~18 name characters
 * fill the column (15.35px a character at 32px) and 24 position characters
 * fit the box (22 in 223px). Both ceilings stand, with room.
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
 *
 * RE-MEASURED 2026-10-09 by the same method on the built Team page, after
 * ui/Container's THE PHONE GUTTER (§15.35) widened a phone's column: at the
 * 320px stress window the column is 273px under the runner's scrollbar and
 * the name block's line 204.2px, so 20 characters fit (196px; 21 are
 * 205.8px) — on a phone, with no scrollbar, 288px and 218.1px, where 22 fit
 * (215.6px; 23 are 225.4px). The ceiling stayed 17, with room. A 22-character
 * word withheld the ribbon only at the runner's 320 — it was drawn from a
 * 324px window, and on a real 320 phone; „Constantinescu" (202.3px) at every
 * window from 320 (withheld under ~345 before), „Alexandrescu" (178.4px) as
 * before.
 *
 * RE-DERIVED 2026-10-10 FOR THE PHONE HEADER (PersonnelCard D20), where the
 * ceiling now comes from: on a phone the specialty is a line of its own
 * across the whole INSET, on ui/Eyebrow's `card` step — 13.2px, where JetBrains
 * Mono advances 0.6em (7.92px) and the `tracking-widest` adds 0.1em (1.32px),
 * 9.24px a character (MEASURED on the Team page's story twin at 320:
 * „Kieferorthopädie", 16 characters, 147.8px). AND IT IS TAKEN WITH SC
 * 1.4.12'S LETTER-SPACING OVERRIDE ON (the G2 fold of the same day): a reader
 * who sets letter spacing to 0.12em REPLACES the 0.1em tracking, so a
 * character advances 0.6em + 0.12em = 0.72em, 9.504px at 13.2px. The narrowest
 * line a 100 %-zoom phone frame gives the specialty is the runner's 320 frame
 * behind a classic scrollbar — a desktop zoomed to 400 %, the pixel net's 320
 * cell — 204.2px, where floor(204.2 / 9.504) = 21 characters fit (199.6px; 22
 * are 209.1px): THE CEILING IS 21. A real 320 phone's 218.1px holds 22, and
 * without the override 22 and 23 (9.24px a character) — the 21 holds in every
 * frame with the spacing on. From the INSET's 24rem up (every tablet) the
 * specialty is 14px again in a line of at least 384px — 38 characters with
 * the override on (10.08px each) — so a phone binds. Today's longest is German
 * „Kieferorthopädie" (16); the other four languages' longest are 14.
 *
 * A NAME is still not given a ceiling here, and D20 moved where it binds: on
 * a phone the name stands BESIDE the round photo at 24px, in a column of
 * 128px on a 320 phone and 146.6 on a 390 one (inside the ribbon), and never
 * under 110px — D20's FLOOR: under a 200px INSET (a zoomed phone, the Galaxy
 * Fold's 280px cover screen) the card stacks and the name has the INSET's
 * whole line. Measured 2026-10-10, the six real doctors' widest word is
 * „Cătălina", 87.6px — 110.6 with SC 1.4.12's letter spacing on. The lever
 * for a longer real surname is the card's (PersonnelCard D20's RECORDED
 * list), never this file's.
 */
const DOCTOR_POSITION_CEILING = 21;

/**
 * A STAT LABEL'S CEILING — the position's 21, as run ledger D32's contract
 * sets it. The label is the tile's `<h3>`, one tile to a row at 320px (D21),
 * and it inherits the number the eyebrow was MEASURED at rather than being
 * measured itself: the band did not exist when this was written. Re-measure
 * against sections/DoctorStats the day a label is refused, before raising it.
 */
const STAT_LABEL_CEILING = POSITION_CEILING;

/**
 * THE CLINIC'S LABELS HAVE A TIGHTER CEILING (the a11y review of 2026-10-01,
 * LOW-2). A doctor's tile stands one to a row on a phone and two or four on
 * wider columns; the clinic's three stand three across from the container's
 * `@xl` — and where that row STARTS, a 576px column less two 40px gaps, each
 * tile is about 165px wide. A label is a 20px Source Serif 4 `<h3>` wearing
 * `hyphens-none`, so ~16–17 characters fill that tile, and a longer word would
 * overflow it rather than break. 16 for the longest unbreakable run, in all
 * five languages; today's longest are „Interventions" (13) and „d’expérience"
 * (12). Re-measure on the built band before raising it.
 */
const CLINIC_STAT_LABEL_CEILING = 16;

/**
 * The four drawings, spelled once here — lib/team exports `StatIcon` as a
 * TYPE only (the page owns the glyphs, lib is React-free), so `satisfies`
 * makes every entry a real icon and the type pin in the last block makes the
 * union no wider than this list.
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

/**
 * EVERY LIST OF „ÎN CIFRE" ROWS the site ships, labelled for a readable
 * failure: each doctor's own (his page) and, since 2026-10-01, the clinic's
 * (`clinicStats`, the Home and Team pages' band) under the label `clinic`.
 * Every stat rule below walks THIS, so a clinic row is held to exactly what
 * a doctor's is.
 */
const STAT_LISTS: readonly (readonly [string, readonly Stat[]])[] = [
  ...doctors.map((doctor) => [doctor.id, doctor.stats] as const),
  ['clinic', clinicStats],
];

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
      // Every tile's `<h3>`, a doctor's and the clinic's (run ledger D32 —
      // the contract's ceiling; the clinic's tighter one has its own case).
      for (const [owner, stats] of STAT_LISTS) {
        for (const stat of stats) {
          expect(
            longestUnbreakable(stat.words[locale].label).length,
            `${owner}.stats.${stat.icon}.${locale}.label`,
          ).toBeLessThanOrEqual(STAT_LABEL_CEILING);
        }
      }
    },
  );

  it.each(locales)(
    'keeps every CLINIC tile label inside the three-across row’s ceiling for "%s" (the a11y review of 2026-10-01)',
    (locale: Locale) => {
      // ~165px tiles where the row starts (CLINIC_STAT_LABEL_CEILING says
      // how that was measured); the label never hyphenates.
      for (const stat of clinicStats) {
        expect(
          longestUnbreakable(stat.words[locale].label).length,
          `clinic.stats.${stat.icon}.${locale}.label: ${stat.words[locale].label}`,
        ).toBeLessThanOrEqual(CLINIC_STAT_LABEL_CEILING);
      }
    },
  );

  it.each(locales)(
    'leaves the `<k>` marks to `philosophy` and `about` — no other field carries one for "%s"',
    (locale: Locale) => {
      // The marks are a convention of the two texts `splitKeywords` cuts —
      // the `philosophy` (run ledger D2, D17) and, since 2026-10-13, the
      // `about` paragraphs (lib/team's THE BIOGRAPHY'S KEY WORDS) — and
      // nothing else splits them: a `<k>` that wandered into a name, a
      // position, a course line or a stat's label or sentence would reach the
      // page as visible text, because only `splitKeywords` ever cuts one out
      // (F10).
      for (const doctor of doctors) {
        const words = doctor.words[locale];
        expect(words.name, `${doctor.id}.${locale}.name`).not.toMatch(
          KEYWORD_MARK,
        );
        expect(words.position, `${doctor.id}.${locale}.position`).not.toMatch(
          KEYWORD_MARK,
        );
        for (const [index, course] of doctor.courses.entries()) {
          expect(
            course.words[locale],
            `${doctor.id}.courses[${index}].${locale}`,
          ).not.toMatch(KEYWORD_MARK);
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
      // Every tile's words, a doctor's and the clinic's.
      for (const [owner, stats] of STAT_LISTS) {
        for (const stat of stats) {
          const { label, description } = stat.words[locale];
          const where = `${owner}.stats.${stat.icon}.${locale}`;
          expect(label, `${where}.label`).not.toMatch(KEYWORD_MARK);
          expect(description, `${where}.description`).not.toMatch(KEYWORD_MARK);
        }
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
        // …and nothing a MANGLED tag left: `<k >` or `<k/>` is no pair to
        // splitKeywords and would print as written (G2 typescript L1).
        expect(
          readingOf(philosophy),
          `${doctor.id}.${locale}.philosophy`,
        ).not.toMatch(/[<>]/);
      }
    },
  );

  it.each(locales)(
    'marks one or two key ideas in every `about` paragraph for "%s" — balanced, short, digit-free, nameless, whole words, as many as the Romanian',
    (locale: Locale) => {
      // lib/team's THE BIOGRAPHY'S KEY WORDS (CLAUDE.md §15.23 round 7): the
      // marks the owner asked for — "with tighlighted keywords", like the
      // philosophy's — held to what a machine can read of the philosophy's
      // manner. Which idea a mark sets apart is the author's; that the SAME
      // idea is marked in all five languages is held by its proxy, the count.
      for (const doctor of doctors) {
        const words = doctor.words[locale];
        const name = nameWordsOf(words.name);
        expect(words.about.length, `${doctor.id}.${locale}.about`).toBe(
          doctor.words.ro.about.length,
        );
        for (const [index, paragraph] of words.about.entries()) {
          const where = `${doctor.id}.${locale}.about[${index}]`;
          // splitKeywords throws on a half-open or nested tag, naming the
          // text — so this single call is the balanced-tag check as well.
          const segments = splitKeywords(paragraph);
          const marks = segments
            .filter((segment) => segment.keyword)
            .map((segment) => segment.text);
          expect(marks.length, where).toBeGreaterThanOrEqual(ABOUT_MARKS.min);
          expect(marks.length, where).toBeLessThanOrEqual(ABOUT_MARKS.max);
          // Every pair a reader sees: an empty `<k></k>` vanishes from the
          // page (splitKeywords drops it) and would still count as a mark in
          // the source.
          expect(paragraph.match(/<k>/g)?.length ?? 0, where).toBe(
            marks.length,
          );
          // A mark that survived the split would reach the page as visible
          // text — the philosophy's rule, the same pattern.
          for (const segment of segments) {
            expect(segment.text, where).not.toMatch(KEYWORD_MARK);
          }
          // …and nothing a MANGLED tag left (G2 typescript L1).
          expect(readingOf(paragraph), where).not.toMatch(/[<>]/);
          // A mark never cuts into a word: the edges of every pair are a
          // word's edges.
          expect(paragraph, where).not.toMatch(MARK_CUTS_A_WORD);
          for (const mark of marks) {
            const at = `${where}: „${mark}"`;
            // A phrase, trimmed: whitespace inside the pair would bold a gap.
            expect(mark, at).toBe(mark.trim());
            const markWords = mark.split(/\s+/);
            expect(markWords.length, at).toBeLessThanOrEqual(MARK_WORDS_MAX);
            // Never a number…
            expect(mark, at).not.toMatch(/\d/);
            // …and never the doctor's own name, its punctuation no disguise.
            for (const word of markWords.flatMap((part) => part.split('-'))) {
              expect(name.has(bareWord(word)), at).toBe(false);
            }
          }
          // The same idea(s) in every language: as many marks as the
          // Romanian paragraph of the same index carries.
          expect(marks.length, `${where}: marks vs ro`).toBe(
            keywordsOf(doctor.words.ro.about[index]).length,
          );
        }
      }
    },
  );

  it('reads a cut-into word and a name as the key-word rule above means them', () => {
    // The two readers the rule leans on, on their own: both must refuse
    // what they exist for and let the shipped shapes through.
    expect('verific <k>sănătatea gingiei</k>, pentru').not.toMatch(
      MARK_CUTS_A_WORD,
    );
    expect('et <k>l’ordre des étapes</k> est').not.toMatch(MARK_CUTS_A_WORD);
    expect('gingi<k>ei</k>').toMatch(MARK_CUTS_A_WORD);
    expect('<k>gingi</k>ei').toMatch(MARK_CUTS_A_WORD);
    // A hyphen between two letters is inside the word…
    expect('Cluj-<k>Napoca</k>').toMatch(MARK_CUTS_A_WORD);
    expect('<k>Cluj</k>-Napoca').toMatch(MARK_CUTS_A_WORD);
    // …and a name's punctuation hides nothing from the name rule.
    expect(bareWord('Malea,')).toBe('malea');
    expect(bareWord('(Sabău)')).toBe('sabău');
    expect([...nameWordsOf('Dr. Malea (Sabău) Oana Bianca')]).toEqual([
      'malea',
      'sabău',
      'oana',
      'bianca',
    ]);
    expect([...nameWordsOf('Dr Ivașcu-Zugravu Cătălina')]).toEqual([
      'ivașcu',
      'zugravu',
      'cătălina',
    ]);
  });

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
        // No paragraph said twice in one biography — judged by what a READER
        // sees, the marks gone, so two paragraphs that differ only in where
        // their key words sit still count as one paragraph twice. (Until
        // 2026-10-13 sections/DoctorProfile keyed each paragraph by its text,
        // and two equal ones would have collapsed into one React key; since
        // the paragraphs became rendered nodes the rule is the copy's own: a
        // paste nobody meant.)
        const readings = about.map(readingOf);
        expect(new Set(readings).size, `${doctor.id}.${locale}.about`).toBe(
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
      // language: five copies, free to disagree, which is the very thing a
      // stat's `value`, stored once, cannot do (lib/team's A DOCTOR'S NUMBERS
      // ARE ROWS TOO). The placeholders carry none today; the owner's real
      // biographies will („din 2016"), and that is exactly when one language
      // can drift.
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

describe('lib/team — the course rows (run ledger D17; one idea each since 2026-10-13)', () => {
  it('gives every doctor at least one row — the courses column never stands empty', () => {
    for (const doctor of doctors) {
      expect(doctor.courses.length, doctor.id).toBeGreaterThan(0);
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
          // NO YEAR — the owner's "there wont be any more years on the
          // courses … this must stand" (2026-10-13): the field left the
          // type, and a year typed into the words is the way back this
          // refuses (G2 typescript M2).
          expect(line, where).not.toMatch(/\b(?:19|20)\d{2}\b/);
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
});

describe('lib/team — the „în cifre" tiles (run ledger D32; the clinic’s since 2026-10-01)', () => {
  it('walks every list of tiles — each doctor’s and the clinic’s (the fence never passes vacuously)', () => {
    expect(STAT_LISTS).toHaveLength(doctors.length + 1);
    expect(STAT_LISTS.at(-1)?.[0]).toBe('clinic');
    expect(STAT_LISTS.at(-1)?.[1]).toBe(clinicStats);
  });

  it('gives every list at least one tile, each of the four drawings at most once', () => {
    for (const [owner, stats] of STAT_LISTS) {
      expect(stats.length, owner).toBeGreaterThan(0);
      const icons = stats.map((stat) => stat.icon);
      for (const icon of icons) {
        // A cast could smuggle an id the page has no glyph for past the
        // compiler; the page's exhaustive map would then have nothing to draw.
        expect(STAT_ICONS, `${owner}: ${icon}`).toContain(icon);
      }
      // Two tiles wearing one drawing would be two answers to one question —
      // and the drawing is the natural key the band has for its tiles.
      expect(new Set(icons).size, `${owner}: ${icons.join(' · ')}`).toBe(
        icons.length,
      );
    }
  });

  it('gives the clinic exactly the owner’s three — experience, patients, procedures — in that order', () => {
    // The owner, 2026-10-01: "just 3 components. experience, patients and nr
    // of procedures". The TYPE already refuses a fourth row (a three-tuple);
    // this holds WHICH three, and their order, which is the band's.
    expect(clinicStats.map((stat) => stat.icon)).toEqual([
      'experience',
      'patients',
      'interventions',
    ]);
  });

  it('counts with a whole number ≥ 0, followed by "+" or by nothing', () => {
    for (const [owner, stats] of STAT_LISTS) {
      for (const stat of stats) {
        const where = `${owner}.stats.${stat.icon}: ${stat.value}${stat.suffix ?? ''}`;
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
      for (const [owner, stats] of STAT_LISTS) {
        // "They are one list": `Record<Locale, …>` makes a missing language a
        // failed `tsc`, but a cast can still drop one — and the band would
        // then print fewer tiles in one language than in the others.
        const present = stats.filter(
          (stat) => stat.words[locale] !== undefined,
        );
        expect(present.length, `${owner}.stats.${locale}`).toBe(stats.length);
        for (const stat of present) {
          const { label, description } = stat.words[locale];
          const where = `${owner}.stats.${stat.icon}.${locale}`;
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
      // itself inside one tile. The clinic's patients sentence is the same
      // sentence with the clinic's own count.
      for (const [owner, stats] of STAT_LISTS) {
        for (const stat of stats) {
          const where = `${owner}.stats.${stat.icon}.${locale}`;
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

  it('exercises the patients rule on a doctor’s tiles AND on the clinic’s — a shipped sentence carries its number in each', () => {
    // Without this, a data edit that removed every number from every sentence
    // would leave the rule above passing over nothing — for the doctors, or
    // for the clinic's own rows, whose number is the one most likely to be
    // replaced (lib/team's TODO(owner)).
    const carries = (stats: readonly Stat[]): boolean =>
      stats.some((stat) => numbersIn(stat.words.ro.description).length > 0);
    expect(doctors.some((doctor) => carries(doctor.stats))).toBe(true);
    expect(carries(clinicStats)).toBe(true);
  });
});

describe('lib/team — what the types guarantee (run ledger D2)', () => {
  it('types every picture path through lib/image-path, the promoted spelling', () => {
    expectTypeOf<TeamPicture['src']>().toEqualTypeOf<ImagePath>();
    expectTypeOf<Doctor['words']>().toEqualTypeOf<
      Readonly<Record<Locale, DoctorWords>>
    >();
  });

  it('keeps a course its words alone — no year comes back through the type (2026-10-13)', () => {
    // The owner: "there wont be any more years on the courses … this must
    // stand". A `year` written back into `Course` would type-check, pass
    // every check on the words, and print nowhere (G2 typescript M2).
    expectTypeOf<Course>().toEqualTypeOf<
      Readonly<{ words: Readonly<Record<Locale, string>> }>
    >();
    expectTypeOf<Doctor['courses']>().toEqualTypeOf<readonly Course[]>();
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
    expectTypeOf<Stat['words']>().toEqualTypeOf<
      Readonly<Record<Locale, Readonly<{ label: string; description: string }>>>
    >();
    expectTypeOf<Doctor['stats']>().toEqualTypeOf<readonly Stat[]>();
    // The clinic's rows are a doctor's row shape, and EXACTLY three of them —
    // the owner's "just 3 components", a fourth a compile error in lib/team.
    // Pinned as two plain facts — the length TYPE is the literal 3 (a tuple's,
    // never an array's `number`) and every row is a `Stat` — rather than one
    // deep tuple comparison, which the editor's bundled TypeScript and the
    // project's pinned one disagreed about (2026-10-01).
    expectTypeOf<(typeof clinicStats)['length']>().toEqualTypeOf<3>();
    expectTypeOf<(typeof clinicStats)[number]>().toEqualTypeOf<Stat>();
  });

  it('refuses a fifth drawing, a suffix other than "+", and a tile with a missing language', () => {
    const words: StatWords = {
      label: 'Premii',
      description: 'Recunoaștere pentru calitate.',
    };
    const all = { ro: words, en: words, de: words, fr: words, it: words };
    const fifth: Stat = {
      // @ts-expect-error — no fifth drawing: the band has a glyph for four
      icon: 'awards',
      value: 3,
      words: all,
    };
    const approximately: Stat = {
      icon: 'patients',
      value: 3000,
      // @ts-expect-error — only "+" is a suffix: it means "at least", nothing else is defined
      suffix: '~',
      words: all,
    };
    const fourLanguages: Stat = {
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
    // The stats band and the courses stand on the same page — since 2026-10-13
    // the tiles right under the opener, the courses below them beside the
    // biography: a tile that says „5 cursuri" over a column of six ideas would
    // contradict itself in the visitor's face. The tile may say MORE (a doctor
    // lists a selection), never less — and a bare count (no `+`) must equal
    // the rows exactly.
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
 * philosophy of everyone, a doctor's paragraphs and course lines, and the
 * words of every stat tile — a doctor's and, since 2026-10-01, the clinic's.
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
  }
  for (const [, stats] of STAT_LISTS) {
    for (const stat of stats) {
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
