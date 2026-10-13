import { describe, expect, it } from 'vitest';
import {
  doctors,
  findAuxiliary,
  findDoctor,
  splitKeywords,
  type AboutSegment,
  type Doctor,
} from './team';

// lib/team — the FUNCTIONS, beside the module (the lib-foldering lane). The
// data's own integrity — pictures on disk, five real languages, numbers that
// agree with their rows — lives in tests/unit/team-data.test.ts, which runs in
// node and can read the file system; everything here is pure and would run
// anywhere. It runs in the components project's real Chromium only because
// that is where `src/**/*.test.ts` runs, which costs nothing and keeps one
// convention.
//
// `splitKeywords` is the whole reason run ledger D2 could move a doctor's
// words out of the message files: the `<k>…</k>` marks PersonnelCard's D9
// authored inside a message key are authored beside the person now, in the
// field round 2 renamed `philosophy` (D17) — and, since 2026-10-13, in every
// paragraph of his `about` (lib/team's THE BIOGRAPHY'S KEY WORDS, CLAUDE.md
// §15.23 round 7) — and this function is what turns them back into the
// fragments ui/Keyword dresses. A page renders whatever it
// returns, so the shape of its output IS the contract. (Its old companion,
// `coursesByYear`, left with the course years on 2026-10-13 — lib/team's A
// COURSE IS ONE IDEA — and its pins with it.)

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

  it('never returns an empty piece, in any locale of any doctor — the quote and every biography paragraph', () => {
    for (const doctor of doctors) {
      for (const words of Object.values(doctor.words)) {
        // The two marked texts (lib/team's THE BIOGRAPHY'S KEY WORDS): the
        // philosophy, and since 2026-10-13 each `about` paragraph.
        for (const text of [words.philosophy, ...words.about]) {
          for (const segment of splitKeywords(text)) {
            expect(segment.text, `${doctor.id}: ${segment.text}`).not.toBe('');
          }
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
    // The data test calls splitKeywords on every `philosophy` and every
    // `about` paragraph in every locale, so a typo dies in CI rather than
    // shipping a visible <k> to a patient.
    expect(() => splitKeywords(philosophy)).toThrow(/unbalanced <k>/);
    // …and the message carries the text itself, which is the only way a
    // reader of a red CI log knows WHICH marked field — a `philosophy` or one
    // `about` paragraph, per doctor per language — to open.
    expect(() => splitKeywords(philosophy)).toThrow(philosophy);
  });

  it('is pure — the same sentence splits identically twice (no shared lastIndex)', () => {
    const philosophy = 'Lucrez în <k>ortodonție</k> de peste zece ani.';
    expect(splitKeywords(philosophy)).toEqual(splitKeywords(philosophy));
  });
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
    expect(findAuxiliary('stan-ioana-ecaterina')?.words.ro.name).toBe(
      'Stan Ioana Ecaterina',
    );
    expect(findAuxiliary('gurgu-aurelia')?.words.ro.position).toBe(
      'Asistentă medicală',
    );
  });

  it('returns undefined for an id no member owns', () => {
    expect(findAuxiliary('stan')).toBeUndefined();
    // A doctor's id names no auxiliary member: the two lists are apart.
    expect(findAuxiliary('toma-lucian')).toBeUndefined();
  });
});
