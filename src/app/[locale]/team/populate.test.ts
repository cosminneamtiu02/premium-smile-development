import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { CourseGroup } from '@/components/sections/DoctorCourses/DoctorCourses';
import type { KeywordSegment } from '@/components/ui/Keyword/Keyword';
import { locales } from '@/i18n/locales';
import {
  auxiliaries,
  coursesByYear,
  doctors,
  splitKeywords,
  type AboutSegment,
  type Doctor,
} from '@/lib/team/team';
import {
  populateDoctorPage,
  populateTeamRoster,
  type DoctorPageContent,
  type TeamList,
} from './populate';

// populate — both team walks, tested without rendering anything. The module is
// pure, JSX-free and next-intl-free by design, and names no `react` specifier
// (see its header), so this suite needs no provider, no DOM and no mock beyond
// a spy standing in for the page's quote callback.
//
// TWO HALVES per walk, the services populator's shape
// (../services/populate.test.ts) for the same two reasons:
//   · against a FIXTURE — does the mapping do what it says? The right
//     language, both hrefs, the philosophy's segments handed over, the
//     paragraphs untouched, the week printed, and the course rows grouped by
//     year with the year turned into a LABEL — including the shapes the real
//     data may never happen to hold: rows written out of year order, a doctor
//     with no course at all, and the two malformed rows whose LIBRARY errors
//     must reach the caller unchanged (an unbalanced `<k>`, an unknown day —
//     the module header's "NO THROW OF ITS OWN", G2-R2 tier 3).
//   · against the REAL lists — does the page really print all the people and
//     all of each doctor's words? Counts, ids, paragraphs and years come from
//     lib/team itself rather than being retyped, so what is pinned here is
//     that nothing is filtered, sliced or reordered on the way to a band; the
//     data's own shape is tests/unit/team-data.test.ts' business.
//
// Round 2 (run ledger D13) deleted the four assistant tests with the thing
// they tested: the pair left lib/team, and the populator's two belts — a
// dangling id, one person named twice — left with it.
//
// Beside the module it tests, like every other test in src/ (the lib-foldering
// convention, and src/app/[locale]/shell.test.tsx for the app tier). It runs in
// the `components` project — a real Chromium, harmless for a pure function —
// which also PINS `process.env.PAGES_BASE_PATH` to '' (vitest.config.ts), so
// the hrefs below are the root-served shape. The prefixed branch belongs to
// tests/unit/href.test.ts, the one project that can flip an env var.

/**
 * Two doctors and two auxiliary members, every word invented and visible on
 * this screen. Romanian carries diacritics (§15.7) and German is the second
 * language the assertions read back; en/fr/it exist because the type refuses a
 * missing locale, and are deliberately distinct so a walk that picked the
 * wrong record cannot pass by accident.
 *
 * The SHAPES that matter: the first doctor has a `servicesCategory` and the
 * second has none (the two href branches); the first doctor's course rows are
 * written OUT of year order, with two rows in one year — so "newest first" and
 * "the file's order inside a year" are real assertions rather than a
 * coincidence of the fixture; the second doctor has NO course (D15: no group,
 * so the band renders nothing).
 */
const FIXTURE = {
  doctors: [
    {
      id: 'ana-ardelean',
      portrait: {
        src: '/images/demo/portrait-1.jpg',
        width: 600,
        height: 800,
      },
      cutout: { src: '/images/demo/cutout-1.png', width: 900, height: 1200 },
      hours: [
        { days: ['Monday', 'Wednesday'], opens: '09:00', closes: '17:00' },
      ],
      servicesCategory: 'orthodontics',
      // Two tiles, one with a suffix and one without (round 2f, D32).
      stats: [
        {
          icon: 'experience',
          value: 12,
          suffix: '+',
          words: {
            ro: { label: 'Ani de experiență', description: 'Peste 12 ani.' },
            en: { label: 'Years of experience', description: 'Over 12 years.' },
            de: { label: 'Jahre Erfahrung', description: 'Über 12 Jahre.' },
            fr: {
              label: 'Années d’expérience',
              description: 'Plus de 12 ans.',
            },
            it: { label: 'Anni di esperienza', description: 'Oltre 12 anni.' },
          },
        },
        {
          icon: 'courses',
          value: 3,
          words: {
            ro: { label: 'Cursuri', description: 'Trei cursuri.' },
            en: { label: 'Courses', description: 'Three courses.' },
            de: { label: 'Kurse', description: 'Drei Kurse.' },
            fr: { label: 'Formations', description: 'Trois formations.' },
            it: { label: 'Corsi', description: 'Tre corsi.' },
          },
        },
      ],
      courses: [
        {
          year: 2021,
          words: {
            ro: 'Curs de ortodonție la copii, Iași',
            en: 'Orthodontics in children course, Iași',
            de: 'Kurs für Kieferorthopädie bei Kindern, Iași',
            fr: 'Formation en orthodontie chez l’enfant, Iași',
            it: 'Corso di ortodonzia pediatrica, Iași',
          },
        },
        {
          year: 2024,
          words: {
            ro: 'Curs de aliniere, Cluj-Napoca',
            en: 'Aligner course, Cluj-Napoca',
            de: 'Schienenkurs, Cluj-Napoca',
            fr: 'Formation aux gouttières, Cluj-Napoca',
            it: 'Corso di allineatori, Cluj-Napoca',
          },
        },
        {
          year: 2024,
          words: {
            ro: 'Curs de fotografie dentară, București',
            en: 'Dental photography course, Bucharest',
            de: 'Kurs für Dentalfotografie, Bukarest',
            fr: 'Formation en photographie dentaire, Bucarest',
            it: 'Corso di fotografia dentale, Bucarest',
          },
        },
      ],
      words: {
        ro: {
          name: 'Dr. Ana Ardelean',
          position: 'Medic ortodont',
          philosophy: 'Lucrez în <k>ortodonție</k> de zece ani.',
          about: [
            'Dr. Ana Ardelean lucrează în clinică din 2015.',
            'Își continuă formarea prin cursuri de specialitate.',
          ],
        },
        en: {
          name: 'Dr. Ana Ardelean',
          position: 'Orthodontist',
          philosophy: 'I have worked in <k>orthodontics</k> for ten years.',
          about: [
            'Dr. Ana Ardelean has worked at the clinic since 2015.',
            'She continues her training through specialist courses.',
          ],
        },
        de: {
          name: 'Dr. Ana Ardelean',
          position: 'Kieferorthopädin',
          philosophy:
            'Ich arbeite seit zehn Jahren in der <k>Kieferorthopädie</k>.',
          about: [
            'Dr. Ana Ardelean arbeitet seit 2015 in der Klinik.',
            'Sie bildet sich in Fachkursen weiter.',
          ],
        },
        fr: {
          name: 'Dr Ana Ardelean',
          position: 'Orthodontiste',
          philosophy: 'Je travaille en <k>orthodontie</k> depuis dix ans.',
          about: [
            'Dr Ana Ardelean exerce à la clinique depuis 2015.',
            'Elle poursuit sa formation par des cours spécialisés.',
          ],
        },
        it: {
          name: 'Dott.ssa Ana Ardelean',
          position: 'Ortodontista',
          philosophy: 'Lavoro in <k>ortodonzia</k> da dieci anni.',
          about: [
            'La Dott.ssa Ana Ardelean lavora nella clinica dal 2015.',
            'Continua la sua formazione con corsi specialistici.',
          ],
        },
      },
    },
    {
      id: 'vlad-oprea',
      portrait: {
        src: '/images/demo/portrait-2.jpg',
        width: 600,
        height: 800,
      },
      cutout: { src: '/images/demo/cutout-2.png', width: 900, height: 1200 },
      hours: [{ days: ['Saturday'], opens: '09:00', closes: '13:00' }],
      // NO `servicesCategory`: the page-level link branch. NO course: the
      // empty-band branch (D15).
      stats: [],
      courses: [],
      words: {
        ro: {
          name: 'Dr. Vlad Oprea',
          position: 'Medic dentist',
          philosophy: 'Fac <k>tratamente</k> de rutină.',
          about: ['Dr. Vlad Oprea lucrează în clinică din 2020.'],
        },
        en: {
          name: 'Dr. Vlad Oprea',
          position: 'Dentist',
          philosophy: 'I do routine <k>treatments</k>.',
          about: ['Dr. Vlad Oprea has worked at the clinic since 2020.'],
        },
        de: {
          name: 'Dr. Vlad Oprea',
          position: 'Zahnarzt',
          philosophy: 'Ich mache routinemäßige <k>Behandlungen</k>.',
          about: ['Dr. Vlad Oprea arbeitet seit 2020 in der Klinik.'],
        },
        fr: {
          name: 'Dr Vlad Oprea',
          position: 'Chirurgien-dentiste',
          philosophy: 'Je fais des <k>traitements</k> de routine.',
          about: ['Dr Vlad Oprea exerce à la clinique depuis 2020.'],
        },
        it: {
          name: 'Dott. Vlad Oprea',
          position: 'Odontoiatra',
          philosophy: 'Eseguo <k>trattamenti</k> di routine.',
          about: ['Il Dott. Vlad Oprea lavora nella clinica dal 2020.'],
        },
      },
    },
  ],
  auxiliaries: [
    {
      id: 'dana-fixture',
      portrait: {
        src: '/images/demo/portrait-3.jpg',
        width: 600,
        height: 800,
      },
      words: {
        ro: { name: 'Dana Fixture', position: 'Asistentă medicală' },
        en: { name: 'Dana Fixture', position: 'Dental nurse' },
        de: {
          name: 'Dana Fixture',
          position: 'Zahnmedizinische Fachangestellte',
        },
        fr: { name: 'Dana Fixture', position: 'Assistante dentaire' },
        it: { name: 'Dana Fixture', position: 'Assistente di studio' },
      },
    },
    {
      id: 'radu-fixture',
      portrait: {
        src: '/images/demo/portrait-1.jpg',
        width: 600,
        height: 800,
      },
      words: {
        ro: { name: 'Radu Fixture', position: 'Recepție și programări' },
        en: { name: 'Radu Fixture', position: 'Reception and appointments' },
        de: { name: 'Radu Fixture', position: 'Empfang und Terminvergabe' },
        fr: { name: 'Radu Fixture', position: 'Accueil et rendez-vous' },
        it: { name: 'Radu Fixture', position: 'Accoglienza e appuntamenti' },
      },
    },
  ],
} satisfies TeamList;

/**
 * The fixture list with its first doctor, Ana, ALONE and changed — the shapes
 * tests/unit/team-data.test.ts refuses in the shipped data, which the walks
 * must still answer for without a word of their own (the module header's "NO
 * THROW OF ITS OWN"). The second doctor is left out on purpose: the roster
 * walk visits every doctor, and a throw must be HIS, not a neighbour's.
 */
const withAna = (ana: Doctor): TeamList => ({ ...FIXTURE, doctors: [ana] });

/** Ana with her Romanian philosophy replaced — the unbalanced-`<k>` belt. */
const withPhilosophy = (philosophy: string): TeamList => {
  const [ana] = FIXTURE.doctors;
  return withAna({
    ...ana,
    words: { ...ana.words, ro: { ...ana.words.ro, philosophy } },
  });
};

/** Ana with her week replaced — the unknown-day belt. */
const withHours = (hours: Doctor['hours']): TeamList =>
  withAna({ ...FIXTURE.doctors[0], hours });

/** An opening `<k>` that never closes — lib/team's `splitKeywords` refuses it
 *  (its "ANY MARK THAT IS NOT PART OF A FLAT, BALANCED PAIR THROWS"). */
const UNBALANCED = 'Lucrez în <k>ortodonție de zece ani.';

/** lib/team's OWN message for {@link UNBALANCED}, anchored at its start: a
 *  walk that caught the error and threw one of its own — even one that only
 *  prefixed the original — would no longer match. */
const UNBALANCED_ERROR = /^lib\/team: unbalanced <k> in "Lucrez în <k>/;

/**
 * The page hands over `<Keywords segments={…} />`; a spy returning a marked-up
 * STRING is the honest stand-in. It proves two things no rendered node could:
 * that the populator cut the philosophy itself (the spy sees SEGMENTS, never a
 * `<k>`), and that whatever the caller builds is what travels to the band.
 */
const spyRenderQuote = () =>
  vi.fn((segments: readonly AboutSegment[]) =>
    segments
      .map((segment) => (segment.keyword ? `[${segment.text}]` : segment.text))
      .join(''),
  );

const LABELS = { services: 'Vezi serviciile', profile: 'Vezi profilul' };

/** A year label is the plain digits of a calendar year — never „2.024", which
 *  is what `Intl.NumberFormat` would print for ro and de. */
const YEAR_LABEL = /^\d{4}$/;

describe('populate — the shapes pinned where both sides are importable', () => {
  it('keeps lib/team’s AboutSegment and ui/Keyword’s KeywordSegment identical', () => {
    // THE PIN lib/team's `AboutSegment` comment points at (F11, 2026-09-21).
    // The two shapes are structurally identical and deliberately NOT one
    // import: lib never imports ui (§4's dependency direction), and ui/Keyword
    // knows nothing about lib/team — so neither side can pin the pair, and
    // ui/Keyword's own suite never could. The APP tier may import both, and
    // this page is the place where the segments really do cross from one to
    // the other (`splitKeywords` → `<Keywords segments={…} />`), so the
    // assertion belongs here. A field added to either shape fails at
    // `tsc --noEmit`, naming it.
    expectTypeOf<AboutSegment>().toEqualTypeOf<KeywordSegment>();
  });

  it('hands the doctor page’s courses over in sections/DoctorCourses’ OWN shape', () => {
    // The band's `CourseGroup` (year: string) and not lib/team's namesake
    // (year: number): the populator is where the year becomes a label (D15,
    // D17), and a DoctorPageContent that ever carried lib/team's groups
    // through would fail here before it failed on a page.
    expectTypeOf<DoctorPageContent['courses']>().toEqualTypeOf<
      readonly CourseGroup[]
    >();
  });
});

describe('populateTeamRoster — the mapping, against a fixture', () => {
  it('keeps every person, in the lists’ own order (the band walks these arrays)', () => {
    const roster = populateTeamRoster('ro', LABELS, spyRenderQuote(), FIXTURE);

    expect(roster.doctors.map((doctor) => doctor.id)).toEqual([
      'ana-ardelean',
      'vlad-oprea',
    ]);
    expect(roster.members.map((member) => member.id)).toEqual([
      'dana-fixture',
      'radu-fixture',
    ]);
  });

  it('picks the words of the locale it was given — Romanian', () => {
    const [ana] = populateTeamRoster(
      'ro',
      LABELS,
      spyRenderQuote(),
      FIXTURE,
    ).doctors;

    expect(ana.name).toBe('Dr. Ana Ardelean');
    expect(ana.position).toBe('Medic ortodont');
  });

  it('picks the words of the locale it was given — German (same people, other words)', () => {
    const roster = populateTeamRoster('de', LABELS, spyRenderQuote(), FIXTURE);

    expect(roster.doctors.map((doctor) => doctor.position)).toEqual([
      'Kieferorthopädin',
      'Zahnarzt',
    ]);
    expect(roster.members.map((member) => member.position)).toEqual([
      'Zahnmedizinische Fachangestellte',
      'Empfang und Terminvergabe',
    ]);
  });

  it('hands the doctor’s card the PORTRAIT, never the opener’s cutout', () => {
    const [ana] = populateTeamRoster(
      'ro',
      LABELS,
      spyRenderQuote(),
      FIXTURE,
    ).doctors;

    expect(ana.photo).toEqual(FIXTURE.doctors[0].portrait);
  });

  it('builds the services link on the doctor’s category — and on the page itself when he has none', () => {
    const roster = populateTeamRoster('ro', LABELS, spyRenderQuote(), FIXTURE);

    // The fragment rides AFTER the trailing slash, where a URL keeps it, and
    // the id stays English in every language (owner fb-461).
    expect(roster.doctors[0].actions.services.href).toBe(
      '/ro/services/#orthodontics',
    );
    expect(roster.doctors[1].actions.services.href).toBe('/ro/services/');
  });

  it('builds the profile link as the route generateStaticParams emits (run D3)', () => {
    const roster = populateTeamRoster('de', LABELS, spyRenderQuote(), FIXTURE);

    expect(roster.doctors.map((doctor) => doctor.actions.profile.href)).toEqual(
      ['/de/team/ana-ardelean/', '/de/team/vlad-oprea/'],
    );
  });

  it('puts the page’s two labels on the two faces, never the other way round', () => {
    const [ana] = populateTeamRoster(
      'ro',
      LABELS,
      spyRenderQuote(),
      FIXTURE,
    ).doctors;

    expect(ana.actions.services.label).toBe('Vezi serviciile');
    expect(ana.actions.profile.label).toBe('Vezi profilul');
  });

  it('cuts the philosophy’s <k> marks itself and hands the caller SEGMENTS, once per doctor', () => {
    const renderQuote = spyRenderQuote();
    const roster = populateTeamRoster('ro', LABELS, renderQuote, FIXTURE);

    expect(renderQuote).toHaveBeenCalledTimes(2);
    expect(renderQuote.mock.calls[0][0]).toEqual([
      { text: 'Lucrez în ', keyword: false },
      { text: 'ortodonție', keyword: true },
      { text: ' de zece ani.', keyword: false },
    ]);
    // …and what the caller built is what reaches the band, untouched — on the
    // card's `about` prop, whose name PersonnelCard kept (round 2 renamed the
    // DATA field, not the card's API). No markup survives the walk: a `<k>` in
    // the output would mean the page printed the tag instead of a keyword.
    expect(roster.doctors[0].about).toBe('Lucrez în [ortodonție] de zece ani.');
    for (const doctor of roster.doctors)
      expect(String(doctor.about)).not.toContain('<k>');
  });

  it('lets lib/team’s unbalanced-<k> error surface unchanged — the roster walk', () => {
    // The walk cuts every doctor's philosophy for his card, so a stray mark
    // must stop it in lib/team's own words, not print as a visible `<k>`.
    const renderQuote = spyRenderQuote();
    expect(() =>
      populateTeamRoster('ro', LABELS, renderQuote, withPhilosophy(UNBALANCED)),
    ).toThrow(UNBALANCED_ERROR);
    // …and the refusal comes BEFORE the caller renders anything.
    expect(renderQuote).not.toHaveBeenCalled();
  });

  it('says nothing about which way a card faces — alternation is the band’s (PersonnelCard D7)', () => {
    const roster = populateTeamRoster('ro', LABELS, spyRenderQuote(), FIXTURE);

    for (const doctor of roster.doctors) {
      expect(Object.hasOwn(doctor, 'side')).toBe(false);
      expect(Object.keys(doctor).toSorted()).toEqual([
        'about',
        'actions',
        'id',
        'name',
        'photo',
        'position',
      ]);
    }
  });
});

describe('populateTeamRoster — the real people, walked whole', () => {
  it('prints every doctor and every auxiliary member of lib/team', () => {
    const roster = populateTeamRoster('ro', LABELS, spyRenderQuote());

    expect(roster.doctors.map((doctor) => doctor.id)).toEqual(
      doctors.map((doctor) => doctor.id),
    );
    expect(roster.members.map((member) => member.id)).toEqual(
      auxiliaries.map((member) => member.id),
    );
  });

  it('gives every shipped doctor both links, in every language', () => {
    for (const locale of locales) {
      const roster = populateTeamRoster(locale, LABELS, spyRenderQuote());
      for (const doctor of roster.doctors) {
        expect(doctor.actions.profile.href).toBe(
          `/${locale}/team/${doctor.id}/`,
        );
        expect(doctor.actions.services.href).toMatch(
          new RegExp(`^/${locale}/services/(#[a-z-]+)?$`),
        );
      }
    }
  });
});

describe('populateDoctorPage — the mapping, against a fixture', () => {
  const OPTIONS = { renderQuote: spyRenderQuote(), closedLabel: 'Închis' };

  it('returns undefined for a slug no doctor wears — the page’s notFound() branch', () => {
    expect(
      populateDoctorPage('ro', 'nobody-at-all', OPTIONS, FIXTURE),
    ).toBeUndefined();
    // …and an empty string is a slug like any other, not a "give me the first".
    expect(populateDoctorPage('ro', '', OPTIONS, FIXTURE)).toBeUndefined();
  });

  it('opens with the CUTOUT, the doctor’s own words and his credo (run D6, D12)', () => {
    const page = populateDoctorPage('ro', 'ana-ardelean', OPTIONS, FIXTURE);

    expect(page?.intro).toEqual({
      name: 'Dr. Ana Ardelean',
      position: 'Medic ortodont',
      photo: FIXTURE.doctors[0].cutout,
      credo: 'Lucrez în [ortodonție] de zece ani.',
    });
  });

  it('quotes the PHILOSOPHY on the credo card, cut here and rendered by the caller (D12)', () => {
    const renderQuote = spyRenderQuote();
    const page = populateDoctorPage(
      'de',
      'ana-ardelean',
      { renderQuote, closedLabel: 'Geschlossen' },
      FIXTURE,
    );

    // Once per page — the credo is the one place a doctor page quotes him.
    expect(renderQuote).toHaveBeenCalledTimes(1);
    expect(renderQuote.mock.calls[0][0]).toEqual([
      { text: 'Ich arbeite seit zehn Jahren in der ', keyword: false },
      { text: 'Kieferorthopädie', keyword: true },
      { text: '.', keyword: false },
    ]);
    // What the caller built is what the opener receives — nothing re-wrapped,
    // and no `<k>` left for a patient to read.
    expect(page?.intro.credo).toBe(
      'Ich arbeite seit zehn Jahren in der [Kieferorthopädie].',
    );
    expect(String(page?.intro.credo)).not.toContain('<k>');
  });

  it('passes the „Despre" paragraphs through untouched, in the data’s own order (D14)', () => {
    const ro = populateDoctorPage('ro', 'ana-ardelean', OPTIONS, FIXTURE);
    const de = populateDoctorPage('de', 'ana-ardelean', OPTIONS, FIXTURE);

    expect(ro?.profile.paragraphs).toEqual([
      'Dr. Ana Ardelean lucrează în clinică din 2015.',
      'Își continuă formarea prin cursuri de specialitate.',
    ]);
    expect(de?.profile.paragraphs).toEqual(FIXTURE.doctors[0].words.de.about);
    // Plain prose passes as prose: nothing cut, joined, split or trimmed.
    expect(ro?.profile.paragraphs).toHaveLength(2);
  });

  it('groups the courses by YEAR, newest first, the file’s order inside a year (D15, D17)', () => {
    const page = populateDoctorPage('ro', 'ana-ardelean', OPTIONS, FIXTURE);

    // The rows were written 2021 · 2024 · 2024; the band receives 2024 then
    // 2021, the two 2024 lines in the order they were written, and ONE
    // heading per year.
    expect(page?.courses).toEqual([
      {
        year: '2024',
        courses: [
          'Curs de aliniere, Cluj-Napoca',
          'Curs de fotografie dentară, București',
        ],
      },
      { year: '2021', courses: ['Curs de ortodonție la copii, Iași'] },
    ]);
  });

  it('STRINGIFIES the year as plain digits — „2024", never „2.024" (D17)', () => {
    // German is the case that would show it: `Intl.NumberFormat('de')` groups
    // thousands with a point, and so does Romanian.
    const page = populateDoctorPage('de', 'ana-ardelean', OPTIONS, FIXTURE);

    for (const group of page?.courses ?? []) {
      expect(typeof group.year).toBe('string');
      expect(group.year).toMatch(YEAR_LABEL);
    }
    expect(page?.courses.map((group) => group.year)).toEqual(['2024', '2021']);
    expect(page?.courses[0].courses).toEqual([
      'Schienenkurs, Cluj-Napoca',
      'Kurs für Dentalfotografie, Bukarest',
    ]);
  });

  it('gives a doctor with no course NO group — the band then renders nothing (D15)', () => {
    const page = populateDoctorPage('ro', 'vlad-oprea', OPTIONS, FIXTURE);

    expect(page).toBeDefined();
    expect(page?.courses).toEqual([]);
  });

  it('prints the doctor’s OWN week: seven rows, Monday → Sunday, closed days in place', () => {
    const rows = populateDoctorPage('ro', 'ana-ardelean', OPTIONS, FIXTURE)
      ?.profile.rows;

    expect(rows).toHaveLength(7);
    expect(rows?.map((row) => row.value)).toEqual([
      '09:00 – 17:00',
      'Închis',
      '09:00 – 17:00',
      'Închis',
      'Închis',
      'Închis',
      'Închis',
    ]);
    expect(rows?.map((row) => row.closed)).toEqual([
      false,
      true,
      false,
      true,
      true,
      true,
      true,
    ]);
    // The page's own word, never one lib/hours invented (§8.1).
    expect(rows?.[1].value).toBe(OPTIONS.closedLabel);
  });

  it('names the days in the visitor’s language, from lib/hours’ fixed week', () => {
    const ro = populateDoctorPage('ro', 'ana-ardelean', OPTIONS, FIXTURE);
    const de = populateDoctorPage('de', 'ana-ardelean', OPTIONS, FIXTURE);

    expect(ro?.profile.rows[0].label).toBe('Luni');
    expect(ro?.profile.rows[6].label).toBe('Duminică');
    expect(de?.profile.rows[0].label).toBe('Montag');
    expect(de?.profile.rows[6].label).toBe('Sonntag');
  });

  it('lets lib/team’s unbalanced-<k> error surface unchanged — the doctor walk', () => {
    // The credo card quotes the same philosophy (D12), so the page walk meets
    // the same stray mark and must stop in the same words.
    expect(() =>
      populateDoctorPage(
        'ro',
        'ana-ardelean',
        OPTIONS,
        withPhilosophy(UNBALANCED),
      ),
    ).toThrow(UNBALANCED_ERROR);
  });

  it('lets lib/hours’ unknown-day error surface unchanged', () => {
    // The day-name union refuses a typo at compile time — which the directive
    // below asserts, since it is itself an error the day the line compiles.
    // What the walk must still do is let the formatter's RUNTIME belt, the one
    // for data that dodged the union (lib/hours' comment at its throw: "a
    // deliberate cast, future JSON-sourced hours"), reach the caller in
    // lib/hours' own words.
    const hours: Doctor['hours'] = [
      // @ts-expect-error — 'Funday' is no schema.org day; the union refuses it
      { days: ['Funday'], opens: '09:00', closes: '17:00' },
    ];

    expect(() =>
      populateDoctorPage('ro', 'ana-ardelean', OPTIONS, withHours(hours)),
    ).toThrow(/^lib\/hours: "Funday" is not a schema\.org day name\./);
  });
});

describe('populateDoctorPage — the real doctors', () => {
  it('builds a page for every shipped doctor in every language', () => {
    // The route is locale × slug (run D3), and this is the whole grid: every
    // page the export emits comes out of exactly this call. A missing
    // translation or an unbalanced `<k>` would throw HERE, before a build ever
    // reached it.
    for (const locale of locales) {
      for (const doctor of doctors) {
        const renderQuote = spyRenderQuote();
        const page = populateDoctorPage(locale, doctor.id, {
          renderQuote,
          closedLabel: 'x',
        });
        const where = `${locale}/${doctor.id}`;

        expect(page, where).toBeDefined();
        expect(page?.intro.name, where).toBe(doctor.words[locale].name);
        expect(page?.profile.rows, where).toHaveLength(7);

        // THE CREDO is the philosophy's segments through the callback, once.
        expect(renderQuote, where).toHaveBeenCalledTimes(1);
        expect(renderQuote, where).toHaveBeenCalledWith(
          splitKeywords(doctor.words[locale].philosophy),
        );

        // THE PARAGRAPHS are the data's, every one, in order.
        expect(page?.profile.paragraphs, where).toEqual(
          doctor.words[locale].about,
        );

        // THE COURSES are lib/team's groups with each year made a label —
        // descending, plain digits — and not one line lost on the way.
        const years = page?.courses.map((group) => group.year) ?? [];
        expect(years, where).toEqual(
          coursesByYear(doctor, locale).map((group) => String(group.year)),
        );
        for (const year of years) expect(year, where).toMatch(YEAR_LABEL);
        expect(
          years
            .map(Number)
            .every((year, index, all) =>
              index === 0 ? true : all[index - 1] > year,
            ),
          where,
        ).toBe(true);
        expect(
          page?.courses.flatMap((group) => group.courses),
          where,
        ).toEqual(
          coursesByYear(doctor, locale).flatMap((group) => group.courses),
        );
        expect(
          page?.courses.flatMap((group) => group.courses).length,
          where,
        ).toBe(doctor.courses.length);
      }
    }
  });

  it('returns undefined for a slug lib/team does not have', () => {
    expect(
      populateDoctorPage('ro', 'dr-nobody', {
        renderQuote: spyRenderQuote(),
        closedLabel: 'x',
      }),
    ).toBeUndefined();
  });
});

describe('populateDoctorPage — the stats tiles (round 2f, D32)', () => {
  const STATS_OPTIONS = {
    renderQuote: (segments: readonly AboutSegment[]) =>
      segments.map((segment) => segment.text).join(''),
    closedLabel: 'Închis',
  };
  it('hands over one row per tile with THIS language’s words, the icon as an id, the number as a number', () => {
    const page = populateDoctorPage(
      'de',
      FIXTURE.doctors[0].id,
      STATS_OPTIONS,
      FIXTURE,
    );
    if (!page) throw new Error('fixture doctor missing');

    expect(page.stats).toEqual([
      {
        icon: 'experience',
        value: 12,
        suffix: '+',
        label: 'Jahre Erfahrung',
        description: 'Über 12 Jahre.',
      },
      { icon: 'courses', value: 3, label: 'Kurse', description: 'Drei Kurse.' },
    ]);
    // A tile without a suffix carries NO `suffix` key at all — the band prints
    // nothing after the number, and an `undefined` would still be a key.
    expect('suffix' in page.stats[1]).toBe(false);
  });

  it('gives a doctor without tiles an empty list', () => {
    const page = populateDoctorPage(
      'ro',
      FIXTURE.doctors[1].id,
      STATS_OPTIONS,
      FIXTURE,
    );
    expect(page?.stats).toEqual([]);
  });

  it('builds every shipped doctor’s tiles in every language', () => {
    for (const doctor of doctors) {
      for (const locale of locales) {
        const page = populateDoctorPage(locale, doctor.id, STATS_OPTIONS);
        if (!page) throw new Error(`no page for ${doctor.id}`);
        expect(page.stats.map((tile) => tile.icon)).toEqual(
          doctor.stats.map((stat) => stat.icon),
        );
        for (const [index, tile] of page.stats.entries()) {
          expect(tile.label).toBe(doctor.stats[index].words[locale].label);
          expect(tile.value).toBe(doctor.stats[index].value);
        }
      }
    }
  });
});
