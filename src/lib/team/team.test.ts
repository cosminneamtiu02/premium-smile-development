import { describe, expect, it } from 'vitest';
import {
  coursesByYear,
  doctors,
  findAuxiliary,
  findDoctor,
  splitKeywords,
  type AboutSegment,
  type Course,
  type Doctor,
} from './team';
import { locales, type Locale } from '../../i18n/locales';

// lib/team — the FUNCTIONS, beside the module (the lib-foldering lane). The
// data's own integrity — pictures on disk, five real languages, hours that
// make sense — lives in tests/unit/team-data.test.ts, which runs in node and
// can read the file system; everything here is pure and would run anywhere.
// It runs in the components project's real Chromium only because that is
// where `src/**/*.test.ts` runs, which costs nothing and keeps one convention.
//
// `splitKeywords` is the whole reason run ledger D2 could move a doctor's
// words out of the message files: the `<k>…</k>` marks PersonnelCard's D9
// authored inside a message key are authored beside the person now, in the
// field round 2 renamed `philosophy` (D17), and this function is what turns
// them back into the fragments ui/Keyword dresses. A page renders whatever it
// returns, so the shape of its output IS the contract.
//
// `coursesByYear` (D17) is the other half: the doctor page's courses band
// (D15) prints one year heading per group it returns, so the pins below are
// the band's reading order — years newest first, the file's order inside a
// year, one group per year however the rows were typed, `[]` for a doctor
// with none, and the data it read left exactly as it was.

/** The flags of a split, in order — the cheapest description of a sentence's shape. */
const flagsOf = (segments: readonly AboutSegment[]): readonly boolean[] =>
  segments.map((segment) => segment.keyword);

/** The key words alone, in order. */
const keywordsOf = (segments: readonly AboutSegment[]): readonly string[] =>
  segments.filter((segment) => segment.keyword).map((segment) => segment.text);

/** What a reader sees: every piece joined, which must be the source without its tags. */
const readingOf = (segments: readonly AboutSegment[]): string =>
  segments.map((segment) => segment.text).join('');

/** A shipped doctor by id, or a loud failure — a vacuous `?? ''` would pass. */
const shipped = (id: string): Doctor => {
  const doctor = findDoctor(id);
  if (doctor === undefined) throw new Error(`no shipped doctor "${id}"`);
  return doctor;
};

describe('splitKeywords — two shipped doctors’ own sentences (run ledger D2, D17)', () => {
  // The first two doctors of the owner's list (2026-09-30). Their quotes are
  // PLACEHOLDERS (lib/team's TODO(owner) block): replacing one with the
  // doctor's own words means updating the pin below in the same edit.
  const malea = shipped('malea-sabau-oana-bianca');
  const toma = shipped('toma-lucian');

  it('splits Dr. Malea’s Romanian into text · key word · text · key word · text', () => {
    const philosophy = malea.words.ro.philosophy;
    const segments = splitKeywords(philosophy);

    expect(flagsOf(segments)).toEqual([false, true, false, true, false]);
    expect(keywordsOf(segments)).toEqual(['sănătatea gingiei', 'explic']);
    expect(segments[0].text).toBe(
      'Înainte de orice lucrare protetică verific ',
    );
    expect(readingOf(segments)).toBe(philosophy.replaceAll(/<\/?k>/g, ''));
  });

  it('splits Dr. Toma’s Romanian the same way', () => {
    const philosophy = toma.words.ro.philosophy;
    const segments = splitKeywords(philosophy);

    expect(flagsOf(segments)).toEqual([false, true, false, true, false]);
    expect(keywordsOf(segments)).toEqual(['microscopul', 'dintele natural']);
    expect(segments[0].text).toBe('Lucrez cu ');
    expect(readingOf(segments)).toBe(philosophy.replaceAll(/<\/?k>/g, ''));
  });

  it('never returns an empty piece, in any locale of any doctor', () => {
    for (const doctor of doctors) {
      for (const words of Object.values(doctor.words)) {
        for (const segment of splitKeywords(words.philosophy)) {
          expect(segment.text, `${doctor.id}: ${segment.text}`).not.toBe('');
        }
      }
    }
  });
});

describe('splitKeywords — the shapes a sentence can take', () => {
  it('gives plain text one plain segment', () => {
    expect(splitKeywords('Fără niciun cuvânt-cheie.')).toEqual([
      { text: 'Fără niciun cuvânt-cheie.', keyword: false },
    ]);
  });

  it('opens on a key word with no empty lead', () => {
    expect(splitKeywords('<k>Ortodonția</k> începe devreme.')).toEqual([
      { text: 'Ortodonția', keyword: true },
      { text: ' începe devreme.', keyword: false },
    ]);
  });

  it('closes on a key word with no empty tail', () => {
    expect(splitKeywords('Vorbim despre <k>ascultare</k>')).toEqual([
      { text: 'Vorbim despre ', keyword: false },
      { text: 'ascultare', keyword: true },
    ]);
  });

  it('keeps adjacent key words apart without inventing a gap between them', () => {
    expect(splitKeywords('<k>chirurgie</k><k>orală</k>')).toEqual([
      { text: 'chirurgie', keyword: true },
      { text: 'orală', keyword: true },
    ]);
  });

  it('drops a key word with no word in it', () => {
    expect(splitKeywords('Un control<k></k> la o săptămână.')).toEqual([
      { text: 'Un control', keyword: false },
      { text: ' la o săptămână.', keyword: false },
    ]);
  });

  it('gives an empty sentence no segments at all', () => {
    expect(splitKeywords('')).toEqual([]);
  });

  it.each([
    ['an unclosed tag', 'Lucrez în <k>ortodonție de zece ani.'],
    ['a closing tag alone', 'Lucrez în ortodonție</k> de zece ani.'],
    ['nested tags', 'Lucrez în <k>orto<k>donție</k></k>.'],
    // The two shapes a plain lazy capture used to swallow whole: the first
    // `<k>` would run to the only `</k>`, eat the second opening tag into the
    // key word and leave a residue with nothing stray in it — so the sentence
    // shipped with a visible `<k>` inside a <b>. The tempered capture in
    // lib/team refuses to cross a mark, so both land here instead (G2
    // typescript, 2026-09-21).
    ['a second opening tag inside a pair', 'Text <k>foo <k>bar</k> more.'],
    ['a doubled opening tag', '<k><k>a</k>'],
    // An upper-case pair is not a pair (`keywordTag` is lowercase) and must
    // not pass as plain text either: the stray belt is `/i` (G2-R2 tier 1,
    // typescript F1).
    ['an upper-case pair', '<K>a</K>'],
  ])('throws on %s, naming the text', (_case, philosophy) => {
    // The data test calls splitKeywords on every `philosophy` in every
    // locale, so a typo dies in CI rather than shipping a visible <k> to a
    // patient.
    expect(() => splitKeywords(philosophy)).toThrow(/unbalanced <k>/);
    // …and the message carries the sentence itself, which is the only way a
    // reader of a red CI log knows WHICH `philosophy` field (one per doctor per
    // language) to open.
    expect(() => splitKeywords(philosophy)).toThrow(philosophy);
  });

  it('is pure — the same sentence splits identically twice (no shared lastIndex)', () => {
    const philosophy = 'Lucrez în <k>ortodonție</k> de peste zece ani.';
    expect(splitKeywords(philosophy)).toEqual(splitKeywords(philosophy));
  });
});

/**
 * One course row with a DIFFERENT line per language, so a group that read the
 * wrong language is visible in the assertion rather than equal by accident.
 */
const row = (year: number, line: string): Course => ({
  year,
  words: {
    ro: line,
    en: `${line} (en)`,
    de: `${line} (de)`,
    fr: `${line} (fr)`,
    it: `${line} (it)`,
  },
});

/** A shipped doctor wearing other course rows — the one field under test. */
const withCourses = (courses: readonly Course[]): Doctor => ({
  ...shipped('malea-sabau-oana-bianca'),
  id: 'medic-proba',
  courses,
});

/**
 * The rows typed OUT of order on purpose (2016, 2024, 2021, 2024): the data
 * test keeps the shipped file sorted, so only a fixture can show that the
 * grouping does not lean on that.
 */
const SHUFFLED: readonly Course[] = [
  row(2016, 'Specializare în endodonție, Iași'),
  row(2024, 'Curs de implantologie digitală, Brașov'),
  row(2021, 'Curs de restaurări estetice, Sibiu'),
  row(2024, 'Atelier de fotografie dentară, Constanța'),
];

describe('coursesByYear — the courses band’s groups (run ledger D15, D17)', () => {
  it('groups Dr. Malea’s Romanian as 2025 · 2023 ×2 · 2019 · 2017 · 2012, the two 2023 lines in file order', () => {
    // Six placeholder rows over five years (lib/team's TODO(owner) block) —
    // the one shipped doctor with two courses in one year, kept on purpose.
    const groups = coursesByYear(shipped('malea-sabau-oana-bianca'), 'ro');

    expect(groups.map((group) => group.year)).toEqual([
      2025, 2023, 2019, 2017, 2012,
    ]);
    expect(groups.map((group) => group.courses.length)).toEqual([
      1, 2, 1, 1, 1,
    ]);
    expect(groups[1].courses).toEqual([
      'Curs de chirurgie plastică parodontală, Cluj-Napoca',
      'Curs de restaurări protetice din zirconiu, Sibiu',
    ]);
  });

  it('sorts shuffled rows into descending years, one group per year, the two 2024 rows in file order', () => {
    expect(coursesByYear(withCourses(SHUFFLED), 'ro')).toEqual([
      {
        year: 2024,
        courses: [
          'Curs de implantologie digitală, Brașov',
          'Atelier de fotografie dentară, Constanța',
        ],
      },
      { year: 2021, courses: ['Curs de restaurări estetice, Sibiu'] },
      { year: 2016, courses: ['Specializare în endodonție, Iași'] },
    ]);
  });

  it('reads the asked language and no other', () => {
    const [newest] = coursesByYear(withCourses(SHUFFLED), 'de');
    expect(newest.courses).toEqual([
      'Curs de implantologie digitală, Brașov (de)',
      'Atelier de fotografie dentară, Constanța (de)',
    ]);
  });

  it('gives a doctor with no rows no groups at all — the band renders nothing', () => {
    expect(coursesByYear(withCourses([]), 'ro')).toEqual([]);
  });

  it('is pure — two calls agree, and the doctor’s rows are left exactly as they were', () => {
    const doctor = withCourses(SHUFFLED);
    const before = structuredClone(doctor.courses);

    const first = coursesByYear(doctor, 'ro');
    const second = coursesByYear(doctor, 'ro');

    expect(second).toEqual(first);
    // The file's order survives — a sort in place would have moved the 2024
    // rows to the front of the ARRAY the next page reads.
    expect(doctor.courses).toEqual(before);
    expect(doctor.courses.map((course) => course.year)).toEqual([
      2016, 2024, 2021, 2024,
    ]);
  });

  it.each(locales)(
    'gives every group of every doctor as many lines as that year has rows, for "%s"',
    (locale: Locale) => {
      for (const doctor of [...doctors, withCourses(SHUFFLED)]) {
        for (const group of coursesByYear(doctor, locale)) {
          const rows = doctor.courses.filter(
            (course) => course.year === group.year,
          );
          expect(group.courses, `${doctor.id}.${locale}.${group.year}`).toEqual(
            rows.map((course) => course.words[locale]),
          );
        }
      }
    },
  );
});

// The two finders search the SHIPPED lists. Their callers are the doctor
// route's `generateMetadata`, tools, stories and tests — never the walk that
// builds a page: `generateStaticParams` maps `doctors` itself and the
// populator searches the `list` it was handed (team.ts's ARRAYS paragraph).
describe('findDoctor / findAuxiliary — the lookups metadata and tests use', () => {
  it('finds a doctor by the URL segment (run ledger D3)', () => {
    expect(findDoctor('malea-sabau-oana-bianca')?.words.ro.name).toBe(
      'Dr. Malea (Sabău) Oana Bianca',
    );
    expect(findDoctor('bozdog-horatiu')?.words.ro.name).toBe(
      'Dr. Bozdog Horațiu',
    );
  });

  it('returns undefined for a segment no doctor owns', () => {
    expect(findDoctor('nimeni')).toBeUndefined();
    expect(findDoctor('')).toBeUndefined();
    // Not a prefix match and not a case-insensitive one: the URL is exact.
    expect(findDoctor('nicu')).toBeUndefined();
    expect(findDoctor('Nicu-Elena-Alina')).toBeUndefined();
  });

  it('finds an auxiliary member by id', () => {
    expect(findAuxiliary('ioana-tepes')?.words.ro.name).toBe('Ioana Țepeș');
    expect(findAuxiliary('ana-maria-dobre')?.words.ro.position).toBe(
      'Recepție, programări și comunicarea cu pacienții',
    );
  });

  it('returns undefined for an id no member owns', () => {
    expect(findAuxiliary('ioana')).toBeUndefined();
    // A doctor's id names no auxiliary member: the two lists are apart.
    expect(findAuxiliary('toma-lucian')).toBeUndefined();
  });
});
