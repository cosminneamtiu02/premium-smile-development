import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { DoctorProfileProps } from '@/components/sections/DoctorProfile/DoctorProfile';
import type { KeywordSegment } from '@/components/ui/Keyword/Keyword';
import { locales } from '@/i18n/locales';
import {
  auxiliaries,
  clinicStats,
  doctors,
  splitKeywords,
  type AboutSegment,
  type Doctor,
  type Stat,
} from '@/lib/team/team';
import {
  populateDoctorPage,
  populateDoctorShowcase,
  populateStats,
  populateTeamRoster,
  type DoctorPageContent,
  type StatContent,
  type TeamList,
} from './populate';

// populate — the team walks (the doctors band's cards, the auxiliary tiles, a
// doctor's page, and since 2026-10-01 the „în cifre" rows on their own —
// `populateStats`, one walk for a doctor's rows and for the clinic's, which
// Home and the Team page show), tested without rendering anything. The module is
// pure, JSX-free and next-intl-free by design, and names no `react` specifier
// (see its header), so this suite needs no provider, no DOM and no mock beyond
// two spies standing in for the pages' render callbacks — the doctors band's
// quote (`renderQuote`) and the doctor page's key words (`renderKeywords`).
//
// TWO HALVES per walk, the services populator's shape
// (../services/populate.test.ts) for the same two reasons:
//   · against a FIXTURE — does the mapping do what it says? The right
//     language, the profile href, the SEGMENTS handed over — the
//     philosophy's for the card and the credo, and since 2026-10-13 every
//     biography paragraph's too (CLAUDE.md §15.23 round 7) — the caller's
//     nodes passed on untouched, and the course ideas handed over as this
//     language's lines in the data's own order — including the shapes the
//     real data may never happen to hold: a doctor with no course at all, a
//     paragraph with no mark, and the malformed rows whose LIBRARY error must
//     reach the caller unchanged (an unbalanced `<k>` in a philosophy or in a
//     paragraph — the module header's "NO THROW OF ITS OWN", G2-R2 tier 3).
//   · against the REAL lists — does the page really print all the people and
//     all of each doctor's words? Counts, ids, paragraphs and course lines
//     come from lib/team itself rather than being retyped, so what is pinned
//     here is that nothing is filtered, sliced or reordered on the way to a
//     band; the data's own shape is tests/unit/team-data.test.ts' business.
//
// Round 2 (run ledger D13) deleted the four assistant tests with the thing
// they tested: the pair left lib/team, and the populator's two belts — a
// dangling id, one person named twice — left with it. On 2026-10-13 the
// doctor's week and the course years left the page (lib/team's NO WEEK ON A
// DOCTOR and A COURSE IS ONE IDEA), and their tests — the seven rows, the
// day names, lib/hours' unknown-day error, the year groups and their plain
// digits — left with them.
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
 * The SHAPES that matter: the first doctor has THREE course ideas, each a
 * different line in every language — so "in the data's own order" and "in
 * the asked language" are real assertions rather than a coincidence of the
 * fixture; the second doctor has NO course at all. The first doctor's two
 * paragraphs carry key words — one, then two (lib/team's THE BIOGRAPHY'S KEY
 * WORDS) — and the second doctor's one paragraph carries NONE: the shape
 * tests/unit/team-data.test.ts refuses in shipped data, which the walk must
 * still pass through as one plain segment.
 */
const FIXTURE = {
  doctors: [
    {
      id: 'ana-ardelean',
      cutout: { src: '/images/demo/cutout-1.png', width: 900, height: 1200 },
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
          words: {
            ro: 'Curs de ortodonție la copii, Iași',
            en: 'Orthodontics in children course, Iași',
            de: 'Kurs für Kieferorthopädie bei Kindern, Iași',
            fr: 'Formation en orthodontie chez l’enfant, Iași',
            it: 'Corso di ortodonzia pediatrica, Iași',
          },
        },
        {
          words: {
            ro: 'Curs de aliniere, Cluj-Napoca',
            en: 'Aligner course, Cluj-Napoca',
            de: 'Schienenkurs, Cluj-Napoca',
            fr: 'Formation aux gouttières, Cluj-Napoca',
            it: 'Corso di allineatori, Cluj-Napoca',
          },
        },
        {
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
            'Dr. Ana Ardelean lucrează în <k>clinică</k> din 2015.',
            'Își continuă <k>formarea</k> prin <k>cursuri de specialitate</k>.',
          ],
        },
        en: {
          name: 'Dr. Ana Ardelean',
          position: 'Orthodontist',
          philosophy: 'I have worked in <k>orthodontics</k> for ten years.',
          about: [
            'Dr. Ana Ardelean has worked at the <k>clinic</k> since 2015.',
            'She continues her <k>training</k> through <k>specialist courses</k>.',
          ],
        },
        de: {
          name: 'Dr. Ana Ardelean',
          position: 'Kieferorthopädin',
          philosophy:
            'Ich arbeite seit zehn Jahren in der <k>Kieferorthopädie</k>.',
          about: [
            'Dr. Ana Ardelean arbeitet seit 2015 in der <k>Klinik</k>.',
            'Sie bildet sich in <k>Fachkursen</k> weiter.',
          ],
        },
        fr: {
          name: 'Dr Ana Ardelean',
          position: 'Orthodontiste',
          philosophy: 'Je travaille en <k>orthodontie</k> depuis dix ans.',
          about: [
            'Dr Ana Ardelean exerce à la <k>clinique</k> depuis 2015.',
            'Elle poursuit sa <k>formation</k> par des <k>cours spécialisés</k>.',
          ],
        },
        it: {
          name: 'Dott.ssa Ana Ardelean',
          position: 'Ortodontista',
          philosophy: 'Lavoro in <k>ortodonzia</k> da dieci anni.',
          about: [
            'La Dott.ssa Ana Ardelean lavora nella <k>clinica</k> dal 2015.',
            'Continua la sua <k>formazione</k> con <k>corsi specialistici</k>.',
          ],
        },
      },
    },
    {
      id: 'vlad-oprea',
      cutout: { src: '/images/demo/cutout-2.png', width: 900, height: 1200 },
      // NO course and NO tile: the empty lists the walk must still answer —
      // and a paragraph with NO key word, which must pass as plain text.
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
 * THROW OF ITS OWN"). The second doctor is left out on purpose: the showcase
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

/** Ana with her SECOND Romanian biography paragraph replaced — the same belt,
 *  one field over: since 2026-10-13 the doctor walk cuts every paragraph too
 *  (lib/team's THE BIOGRAPHY'S KEY WORDS). */
const withParagraph = (paragraph: string): TeamList => {
  const [ana] = FIXTURE.doctors;
  const [first] = ana.words.ro.about;
  return withAna({
    ...ana,
    words: { ...ana.words, ro: { ...ana.words.ro, about: [first, paragraph] } },
  });
};

/** An opening `<k>` that never closes — lib/team's `splitKeywords` refuses it
 *  (its "ANY MARK THAT IS NOT PART OF A FLAT, BALANCED PAIR THROWS"). */
const UNBALANCED = 'Lucrez în <k>ortodonție de zece ani.';

/** lib/team's OWN message for {@link UNBALANCED}, anchored at its start: a
 *  walk that caught the error and threw one of its own — even one that only
 *  prefixed the original — would no longer match. */
const UNBALANCED_ERROR = /^lib\/team: unbalanced <k> in "Lucrez în <k>/;

/**
 * The pages hand over `<Keywords segments={…} />`; a marked-up STRING is the
 * honest stand-in, and this is it — key words in brackets. It proves two
 * things no rendered node could: that the populator cut the text itself (the
 * callback sees SEGMENTS, never a `<k>`), and that whatever the caller builds
 * is what travels to the band. Pure, so a test can also compute what the walk
 * should hand over for a text it never cut itself.
 */
const markUp = (segments: readonly AboutSegment[]): string =>
  segments
    .map((segment) => (segment.keyword ? `[${segment.text}]` : segment.text))
    .join('');

/** The doctors band's `renderQuote` (one doctor's philosophy → his card's
 *  quote), as a spy over {@link markUp}. */
const spyRenderQuote = () => vi.fn(markUp);

/** The doctor page's `renderKeywords` (the credo's quote AND every biography
 *  paragraph, CLAUDE.md §15.23 round 7), as a spy over {@link markUp}. */
const spyRenderKeywords = () => vi.fn(markUp);

/** The card's one button — finished text, as the page reads it from `team.showcase.profile`. */
const PROFILE_LABEL = 'Mai multe despre mine';

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

  it('hands the doctor page’s profile over in sections/DoctorProfile’s OWN shapes', () => {
    // The page passes `page.profile.paragraphs` to the biography and
    // `page.profile.courses` to the courses column as they are, so the two
    // must BE the band's prop types — the paragraphs the caller's rendered
    // nodes since 2026-10-13 (their key words), the courses plain lines — and
    // a populator that ever handed over a course ROW (its five languages) or a
    // grouped list again would fail here, naming the field, before it failed
    // on a page.
    expectTypeOf<DoctorPageContent['profile']['paragraphs']>().toEqualTypeOf<
      DoctorProfileProps['about']['paragraphs']
    >();
    expectTypeOf<DoctorPageContent['profile']['courses']>().toEqualTypeOf<
      DoctorProfileProps['courses']['items']
    >();
  });

  it('takes ONE option, the key-word renderer — `renderQuote` until its second text, the biography, arrived; the closed-day word left with the doctor’s week (2026-10-13)', () => {
    expectTypeOf<
      keyof Parameters<typeof populateDoctorPage>[2]
    >().toEqualTypeOf<'renderKeywords'>();
    // What it hands back lands in BOTH bands — the credo card's quote and a
    // biography paragraph — so it must fit both their props.
    type Rendered = ReturnType<
      Parameters<typeof populateDoctorPage>[2]['renderKeywords']
    >;
    expectTypeOf<Rendered>().toExtend<DoctorPageContent['intro']['credo']>();
    expectTypeOf<Rendered>().toExtend<
      DoctorProfileProps['about']['paragraphs'][number]
    >();
  });
});

describe('populateDoctorShowcase — the mapping, against a fixture', () => {
  it('keeps every doctor, in the list’s own order (the band walks this array)', () => {
    const cards = populateDoctorShowcase(
      'ro',
      PROFILE_LABEL,
      spyRenderQuote(),
      FIXTURE,
    );

    expect(cards.map((doctor) => doctor.id)).toEqual([
      'ana-ardelean',
      'vlad-oprea',
    ]);
  });

  it('picks the words of the locale it was given — Romanian', () => {
    const [ana] = populateDoctorShowcase(
      'ro',
      PROFILE_LABEL,
      spyRenderQuote(),
      FIXTURE,
    );

    expect(ana.name).toBe('Dr. Ana Ardelean');
    expect(ana.position).toBe('Medic ortodont');
  });

  it('picks the words of the locale it was given — German (same people, other words)', () => {
    const cards = populateDoctorShowcase(
      'de',
      PROFILE_LABEL,
      spyRenderQuote(),
      FIXTURE,
    );

    expect(cards.map((doctor) => doctor.position)).toEqual([
      'Kieferorthopädin',
      'Zahnarzt',
    ]);
  });

  it('hands the doctor’s card the CUTOUT — a doctor’s one picture (PersonnelCard D17)', () => {
    // The card shows the doctor from the waist up with no background — the
    // file the doctor page's opener shows too (owner, 2026-09-30). Until that
    // day this walk handed over a framed PORTRAIT, a field a doctor no longer
    // carries (lib/team's NO PORTRAIT AND NO SERVICES CATEGORY).
    const [ana] = populateDoctorShowcase(
      'ro',
      PROFILE_LABEL,
      spyRenderQuote(),
      FIXTURE,
    );

    expect(ana.photo).toEqual(FIXTURE.doctors[0].cutout);
  });

  it('builds the profile link as the route generateStaticParams emits (run D3)', () => {
    const cards = populateDoctorShowcase(
      'de',
      PROFILE_LABEL,
      spyRenderQuote(),
      FIXTURE,
    );

    expect(cards.map((doctor) => doctor.profile.href)).toEqual([
      '/de/team/ana-ardelean/',
      '/de/team/vlad-oprea/',
    ]);
  });

  it('puts the page’s label on every card’s one link', () => {
    const cards = populateDoctorShowcase(
      'ro',
      PROFILE_LABEL,
      spyRenderQuote(),
      FIXTURE,
    );

    for (const doctor of cards) {
      expect(doctor.profile.label).toBe('Mai multe despre mine');
    }
  });

  it('cuts the philosophy’s <k> marks itself and hands the caller SEGMENTS, once per doctor', () => {
    const renderQuote = spyRenderQuote();
    const cards = populateDoctorShowcase(
      'ro',
      PROFILE_LABEL,
      renderQuote,
      FIXTURE,
    );

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
    expect(cards[0].about).toBe('Lucrez în [ortodonție] de zece ani.');
    for (const doctor of cards)
      expect(String(doctor.about)).not.toContain('<k>');
  });

  it('lets lib/team’s unbalanced-<k> error surface unchanged — the showcase walk', () => {
    // The walk cuts every doctor's philosophy for his card, so a stray mark
    // must stop it in lib/team's own words, not print as a visible `<k>`.
    const renderQuote = spyRenderQuote();
    expect(() =>
      populateDoctorShowcase(
        'ro',
        PROFILE_LABEL,
        renderQuote,
        withPhilosophy(UNBALANCED),
      ),
    ).toThrow(UNBALANCED_ERROR);
    // …and the refusal comes BEFORE the caller renders anything.
    expect(renderQuote).not.toHaveBeenCalled();
  });

  it('says nothing about which way a card faces — alternation is the band’s (PersonnelCard D7)', () => {
    const cards = populateDoctorShowcase(
      'ro',
      PROFILE_LABEL,
      spyRenderQuote(),
      FIXTURE,
    );

    for (const doctor of cards) {
      expect(Object.keys(doctor).toSorted()).toEqual([
        'about',
        'id',
        'name',
        'photo',
        'position',
        'profile',
      ]);
    }
  });
});

describe('populateDoctorShowcase — the real doctors, walked whole', () => {
  it('prints every doctor of lib/team', () => {
    const cards = populateDoctorShowcase('ro', PROFILE_LABEL, spyRenderQuote());

    expect(cards.map((doctor) => doctor.id)).toEqual(
      doctors.map((doctor) => doctor.id),
    );
  });

  it('gives every shipped doctor the link to his own page and his cutout, in every language', () => {
    for (const locale of locales) {
      const cards = populateDoctorShowcase(
        locale,
        PROFILE_LABEL,
        spyRenderQuote(),
      );
      for (const [index, doctor] of cards.entries()) {
        expect(doctor.profile.href).toBe(`/${locale}/team/${doctor.id}/`);
        expect(doctor.photo).toEqual(doctors[index].cutout);
      }
    }
  });
});

describe('populateTeamRoster — the auxiliary tiles', () => {
  it('keeps every member, in the list’s own order (the band walks this array)', () => {
    expect(
      populateTeamRoster('ro', FIXTURE).map((member) => member.id),
    ).toEqual(['dana-fixture', 'radu-fixture']);
  });

  it('picks the words of the locale it was given', () => {
    expect(
      populateTeamRoster('de', FIXTURE).map((member) => member.position),
    ).toEqual([
      'Zahnmedizinische Fachangestellte',
      'Empfang und Terminvergabe',
    ]);
  });

  it('hands every tile the member’s own portrait and nothing a doctor’s card has', () => {
    for (const [index, member] of populateTeamRoster('ro', FIXTURE).entries()) {
      expect(member.photo).toEqual(FIXTURE.auxiliaries[index].portrait);
      expect(Object.keys(member).toSorted()).toEqual([
        'id',
        'name',
        'photo',
        'position',
      ]);
    }
  });

  it('prints every auxiliary member of lib/team', () => {
    expect(populateTeamRoster('ro').map((member) => member.id)).toEqual(
      auxiliaries.map((member) => member.id),
    );
  });
});

describe('populateDoctorPage — the mapping, against a fixture', () => {
  const OPTIONS = { renderKeywords: spyRenderKeywords() };

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

  it('cuts the PHILOSOPHY for the credo card and EVERY biography paragraph after it, handing the caller SEGMENTS in page order (D12, D14; 2026-10-13)', () => {
    const renderKeywords = spyRenderKeywords();
    const page = populateDoctorPage(
      'de',
      'ana-ardelean',
      { renderKeywords },
      FIXTURE,
    );

    // Once for the credo — the one place a doctor page quotes him — then once
    // per paragraph of his biography, which carries key words of its own
    // since 2026-10-13 (CLAUDE.md §15.23 round 7): the order the page prints
    // them in. The callback sees SEGMENTS, never a `<k>`.
    expect(renderKeywords.mock.calls.map(([segments]) => segments)).toEqual([
      [
        { text: 'Ich arbeite seit zehn Jahren in der ', keyword: false },
        { text: 'Kieferorthopädie', keyword: true },
        { text: '.', keyword: false },
      ],
      [
        { text: 'Dr. Ana Ardelean arbeitet seit 2015 in der ', keyword: false },
        { text: 'Klinik', keyword: true },
        { text: '.', keyword: false },
      ],
      [
        { text: 'Sie bildet sich in ', keyword: false },
        { text: 'Fachkursen', keyword: true },
        { text: ' weiter.', keyword: false },
      ],
    ]);
    // What the caller built is what the opener receives — nothing re-wrapped,
    // and no `<k>` left for a patient to read.
    expect(page?.intro.credo).toBe(
      'Ich arbeite seit zehn Jahren in der [Kieferorthopädie].',
    );
    expect(String(page?.intro.credo)).not.toContain('<k>');
  });

  it('hands the band the caller’s node for every „Despre" paragraph, in the data’s own order (D14; key words since 2026-10-13)', () => {
    const ro = populateDoctorPage('ro', 'ana-ardelean', OPTIONS, FIXTURE);
    const de = populateDoctorPage('de', 'ana-ardelean', OPTIONS, FIXTURE);

    // One node per paragraph, the key words where the data marks them — two
    // in the second Romanian paragraph, side by side with plain text.
    expect(ro?.profile.paragraphs).toEqual([
      'Dr. Ana Ardelean lucrează în [clinică] din 2015.',
      'Își continuă [formarea] prin [cursuri de specialitate].',
    ]);
    expect(de?.profile.paragraphs).toEqual(
      FIXTURE.doctors[0].words.de.about.map((paragraph) =>
        markUp(splitKeywords(paragraph)),
      ),
    );
    // Nothing joined, split or dropped on the way — and no `<k>` left in any.
    expect(ro?.profile.paragraphs).toHaveLength(2);
    for (const paragraph of ro?.profile.paragraphs ?? [])
      expect(String(paragraph)).not.toContain('<k>');
  });

  it('passes a paragraph with NO key word through the caller as one plain segment', () => {
    // Shipped data always marks one (tests/unit/team-data.test.ts); the walk
    // does not depend on it — a plain paragraph is a sentence with nothing
    // set apart, and the caller still renders it.
    const renderKeywords = spyRenderKeywords();
    const page = populateDoctorPage(
      'ro',
      'vlad-oprea',
      { renderKeywords },
      FIXTURE,
    );

    expect(renderKeywords).toHaveBeenLastCalledWith([
      { text: 'Dr. Vlad Oprea lucrează în clinică din 2020.', keyword: false },
    ]);
    expect(page?.profile.paragraphs).toEqual([
      'Dr. Vlad Oprea lucrează în clinică din 2020.',
    ]);
  });

  it('hands the course IDEAS over as this language’s lines, in the data’s own order — no year, no grouping (the owner, 2026-10-13)', () => {
    const ro = populateDoctorPage('ro', 'ana-ardelean', OPTIONS, FIXTURE);
    const de = populateDoctorPage('de', 'ana-ardelean', OPTIONS, FIXTURE);

    // One finished line per idea, in the order the rows were written — the
    // order the courses column prints them and highlights them one by one.
    expect(ro?.profile.courses).toEqual([
      'Curs de ortodonție la copii, Iași',
      'Curs de aliniere, Cluj-Napoca',
      'Curs de fotografie dentară, București',
    ]);
    // The asked language and no other: every fixture line differs by language.
    expect(de?.profile.courses).toEqual([
      'Kurs für Kieferorthopädie bei Kindern, Iași',
      'Schienenkurs, Cluj-Napoca',
      'Kurs für Dentalfotografie, Bukarest',
    ]);
  });

  it('gives a doctor with no course an EMPTY list of ideas', () => {
    const page = populateDoctorPage('ro', 'vlad-oprea', OPTIONS, FIXTURE);

    expect(page).toBeDefined();
    expect(page?.profile.courses).toEqual([]);
  });

  it('hands over the three bands’ content and nothing else — the profile the paragraphs and the ideas alone (no week, no year groups since 2026-10-13)', () => {
    const page = populateDoctorPage('ro', 'ana-ardelean', OPTIONS, FIXTURE);
    if (!page) throw new Error('fixture doctor missing');

    expect(Object.keys(page).toSorted()).toEqual(['intro', 'profile', 'stats']);
    expect(Object.keys(page.profile).toSorted()).toEqual([
      'courses',
      'paragraphs',
    ]);
  });

  it('lets lib/team’s unbalanced-<k> error surface unchanged — the doctor walk’s philosophy', () => {
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

  it('lets lib/team’s unbalanced-<k> error surface unchanged — the doctor walk’s paragraph (2026-10-13)', () => {
    // Every biography paragraph is cut since its key words arrived (lib/team's
    // THE BIOGRAPHY'S KEY WORDS), so a stray mark in one stops the page walk
    // in lib/team's own words too — never printed as a visible `<k>`.
    expect(() =>
      populateDoctorPage(
        'ro',
        'ana-ardelean',
        { renderKeywords: spyRenderKeywords() },
        withParagraph(UNBALANCED),
      ),
    ).toThrow(UNBALANCED_ERROR);
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
        const renderKeywords = spyRenderKeywords();
        const page = populateDoctorPage(locale, doctor.id, { renderKeywords });
        const where = `${locale}/${doctor.id}`;
        const { philosophy, about } = doctor.words[locale];

        expect(page, where).toBeDefined();
        expect(page?.intro.name, where).toBe(doctor.words[locale].name);

        // THE CREDO AND THE PARAGRAPHS through the one callback: the
        // philosophy's segments first, then every paragraph's, in order.
        expect(
          renderKeywords.mock.calls.map(([segments]) => segments),
          where,
        ).toEqual([philosophy, ...about].map((text) => splitKeywords(text)));

        // THE PARAGRAPHS are the data's, every one, in order — each the
        // caller's node over its cut-up text, and no `<k>` left in any.
        expect(page?.profile.paragraphs, where).toEqual(
          about.map((paragraph) => markUp(splitKeywords(paragraph))),
        );
        for (const paragraph of page?.profile.paragraphs ?? [])
          expect(String(paragraph), where).not.toContain('<k>');

        // THE COURSE IDEAS are the data's lines in this language, every one,
        // in lib/team's order — not one lost, merged or moved on the way.
        expect(page?.profile.courses, where).toEqual(
          doctor.courses.map((course) => course.words[locale]),
        );
      }
    }
  });

  it('returns undefined for a slug lib/team does not have', () => {
    expect(
      populateDoctorPage('ro', 'dr-nobody', {
        renderKeywords: spyRenderKeywords(),
      }),
    ).toBeUndefined();
  });
});

describe('populateDoctorPage — the stats tiles (round 2f, D32)', () => {
  const STATS_OPTIONS = {
    renderKeywords: (segments: readonly AboutSegment[]) =>
      segments.map((segment) => segment.text).join(''),
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

describe('populateStats — one walk for a doctor’s rows and the clinic’s (owner, 2026-10-01)', () => {
  /** The fixture doctor's two rows — one with a suffix, one without. */
  const ROWS: readonly Stat[] = FIXTURE.doctors[0].stats;

  it('takes lib/team’s row shape and gives the band’s content shape', () => {
    expectTypeOf(populateStats).parameter(1).toEqualTypeOf<readonly Stat[]>();
    expectTypeOf(populateStats).returns.toEqualTypeOf<readonly StatContent[]>();
  });

  it('picks the words of the locale it was given, the icon an id, the number a number', () => {
    expect(populateStats('de', ROWS)).toEqual([
      {
        icon: 'experience',
        value: 12,
        suffix: '+',
        label: 'Jahre Erfahrung',
        description: 'Über 12 Jahre.',
      },
      { icon: 'courses', value: 3, label: 'Kurse', description: 'Drei Kurse.' },
    ]);
    expect(populateStats('ro', ROWS).map((tile) => tile.label)).toEqual([
      'Ani de experiență',
      'Cursuri',
    ]);
  });

  it('passes the numbers through untouched — formatting is the page’s (§8.3)', () => {
    for (const locale of locales) {
      for (const [index, tile] of populateStats(locale, ROWS).entries()) {
        expect(typeof tile.value).toBe('number');
        expect(tile.value).toBe(ROWS[index].value);
      }
    }
  });

  it('keeps the list’s own order — display order is the data’s, never sorted', () => {
    expect(
      populateStats('ro', ROWS.toReversed()).map((tile) => tile.icon),
    ).toEqual(['courses', 'experience']);
  });

  it('carries a `suffix` KEY exactly when the row has one — none at all otherwise', () => {
    const [plus, exact] = populateStats('ro', ROWS);
    expect(plus.suffix).toBe('+');
    // An own `suffix: undefined` would still be a key, and ./stat-tiles.tsx
    // spreads the row whole.
    expect(Object.hasOwn(exact, 'suffix')).toBe(false);
    expect(Object.keys(exact).toSorted()).toEqual([
      'description',
      'icon',
      'label',
      'value',
    ]);
  });

  it('returns an empty list for no rows', () => {
    expect(populateStats('ro', [])).toEqual([]);
  });

  it('IS the doctor page’s stats walk — the fixture doctor’s page carries exactly its output', () => {
    for (const locale of locales) {
      expect(
        populateDoctorPage(
          locale,
          FIXTURE.doctors[0].id,
          { renderKeywords: spyRenderKeywords() },
          FIXTURE,
        )?.stats,
      ).toEqual(populateStats(locale, ROWS));
    }
  });

  it('IS the doctor page’s stats walk for every shipped doctor, in every language', () => {
    for (const doctor of doctors) {
      for (const locale of locales) {
        expect(
          populateDoctorPage(locale, doctor.id, {
            renderKeywords: spyRenderKeywords(),
          })?.stats,
          `${locale}/${doctor.id}`,
        ).toEqual(populateStats(locale, doctor.stats));
      }
    }
  });

  it('walks the clinic’s own three for Home and the Team page — in their order, every language’s words, every number as written', () => {
    // Read off `clinicStats` itself, never retyped: the numbers are the
    // owner's to replace (lib/team's TODO(owner)), and a copy here would be
    // the first thing to go stale.
    for (const locale of locales) {
      const tiles = populateStats(locale, clinicStats);
      expect(tiles.map((tile) => tile.icon)).toEqual([
        'experience',
        'patients',
        'interventions',
      ]);
      expect(tiles).toEqual(
        clinicStats.map((stat) => ({
          icon: stat.icon,
          value: stat.value,
          ...(stat.suffix === undefined ? {} : { suffix: stat.suffix }),
          label: stat.words[locale].label,
          description: stat.words[locale].description,
        })),
      );
    }
  });
});
