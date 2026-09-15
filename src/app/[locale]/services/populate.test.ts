import { describe, expect, it, vi } from 'vitest';
import { PRICE_MENU_ID } from '@/components/sections/PriceList/PriceList';
import { priceCategories, type PriceCategory } from '@/lib/prices/prices';
import { populatePriceList, SERVICES_TITLE_ID } from './populate';

// populate — the page's whole arithmetic, tested without rendering anything.
// The function is pure and next-intl-free by design (see its header), so this
// suite needs no provider, no DOM and no mock beyond a spy standing in for the
// ICU sentence.
//
// TWO HALVES, and each answers a different question:
//   · against a FIXTURE — does the mapping do what it says? Ids through
//     untouched, the right language picked, an eyebrow on every category, and
//     every amount handed to the caller's formatter exactly once. A fixture is
//     what makes those assertions readable: two categories whose every value is
//     visible on this screen, so a failure names the rule that broke rather
//     than a row 900 lines away.
//   · against the REAL list — does the page really print the whole tariff? The
//     counts (11 categories, 102 rows) are the printed sheet's own, pinned
//     against the photograph in tests/unit/prices-data.test.ts; repeating them
//     HERE pins something else: that the walk reaches every row of whatever
//     list it is handed, i.e. that nothing is filtered, sliced or de-duplicated
//     on the way to the band.
//
// Beside the module it tests, like every other test in src/ (the lib-foldering
// convention, and src/app/[locale]/shell.test.tsx for the app tier). It runs in
// the `components` project, which is a real Chromium — harmless for a pure
// function, and the price of keeping the file where the repo keeps its tests.

/** Two categories, both with an eyebrow — required on both sides of the walk
 *  since the owner's 2026-09-14 round: the smallest list that can show every
 *  rule at once. Romanian with diacritics (§15.7), German as the second
 *  language the assertions read back; the words are invented, unlike the real
 *  tariff the second describe walks. */
const FIXTURE = [
  {
    id: 'consultations',
    name: {
      ro: 'Consultații',
      en: 'Consultations',
      de: 'Konsultationen',
      fr: 'Consultations',
      it: 'Visite',
    },
    eyebrow: {
      ro: 'Prima vizită la cabinet',
      en: 'The first visit to the practice',
      de: 'Der erste Besuch in der Praxis',
      fr: 'La première visite au cabinet',
      it: 'La prima visita in studio',
    },
    items: [
      {
        id: 'primary',
        name: {
          ro: 'Consultație primară',
          en: 'Initial consultation',
          de: 'Erstkonsultation',
          fr: 'Première consultation',
          it: 'Prima visita',
        },
        lei: 200,
      },
      {
        id: 'specialist',
        name: {
          ro: 'Consultație specialist',
          en: 'Specialist consultation',
          de: 'Facharztkonsultation',
          fr: 'Consultation spécialisée',
          it: 'Visita specialistica',
        },
        lei: 250,
      },
    ],
  },
  {
    id: 'endodontics',
    name: {
      ro: 'Endodonție',
      en: 'Endodontics',
      de: 'Endodontie',
      fr: 'Endodontie',
      it: 'Endodonzia',
    },
    eyebrow: {
      ro: 'Tratamente la microscop',
      en: 'Treatments under the microscope',
      de: 'Behandlungen unter dem Mikroskop',
      fr: 'Traitements sous microscope',
      it: 'Trattamenti al microscopio',
    },
    items: [
      {
        id: 'one-canal',
        name: {
          ro: 'Tratament endodontic pe un canal',
          en: 'Root canal treatment, one canal',
          de: 'Wurzelkanalbehandlung, ein Kanal',
          fr: 'Traitement endodontique, un canal',
          it: 'Trattamento endodontico, un canale',
        },
        lei: 450,
      },
    ],
  },
] as const satisfies readonly PriceCategory[];

/** The page hands over an ICU sentence; a spy is the honest stand-in — it
 *  proves WHO formats (the page, never the data and never the band) and WITH
 *  WHAT, which no rendered string could. */
const spyFormatter = () => vi.fn((lei: number) => `${lei} RON`);

describe('populatePriceList — the mapping, against a fixture', () => {
  it('keeps every id, in the list’s own order (the menu and the cards are this array)', () => {
    const categories = populatePriceList('ro', spyFormatter(), FIXTURE);

    expect(categories.map((category) => category.id)).toEqual([
      'consultations',
      'endodontics',
    ]);
    expect(
      categories.map((category) => category.rows.map((row) => row.id)),
    ).toEqual([['primary', 'specialist'], ['one-canal']]);
  });

  it('picks the names of the locale it was given — Romanian', () => {
    const [consultations, endodontics] = populatePriceList(
      'ro',
      spyFormatter(),
      FIXTURE,
    );

    expect(consultations.name).toBe('Consultații');
    expect(consultations.rows.map((row) => row.name)).toEqual([
      'Consultație primară',
      'Consultație specialist',
    ]);
    expect(endodontics.name).toBe('Endodonție');
    expect(endodontics.eyebrow).toBe('Tratamente la microscop');
  });

  it('picks the names of the locale it was given — German (the same rows, other words)', () => {
    const [consultations, endodontics] = populatePriceList(
      'de',
      spyFormatter(),
      FIXTURE,
    );

    expect(consultations.name).toBe('Konsultationen');
    expect(consultations.rows.map((row) => row.name)).toEqual([
      'Erstkonsultation',
      'Facharztkonsultation',
    ]);
    expect(consultations.eyebrow).toBe('Der erste Besuch in der Praxis');
    expect(endodontics.name).toBe('Endodontie');
    expect(endodontics.eyebrow).toBe('Behandlungen unter dem Mikroskop');
  });

  it('gives EVERY category an eyebrow — one card, one sub-label (owner 2026-09-14)', () => {
    const categories = populatePriceList('ro', spyFormatter(), FIXTURE);

    // `hasOwn`, not truthiness: what the band is handed must carry the KEY on
    // every category, because CategoryCard's `PriceCategoryProps` requires it
    // since the owner's round and a card missing one would open differently
    // from its neighbours. The conditional spread this walked through — and
    // the case that pinned „absent, not empty" — died with the optional field.
    expect(
      categories.filter((category) => Object.hasOwn(category, 'eyebrow')),
    ).toHaveLength(FIXTURE.length);
    expect(categories.map((category) => category.eyebrow)).toEqual([
      'Prima vizită la cabinet',
      'Tratamente la microscop',
    ]);
  });

  it('formats every amount through the caller’s callback — once per row, with that row’s lei', () => {
    const formatAmount = spyFormatter();
    const categories = populatePriceList('ro', formatAmount, FIXTURE);

    expect(
      categories.flatMap((category) => category.rows.map((row) => row.price)),
    ).toEqual(['200 RON', '250 RON', '450 RON']);
    // One call per row, in row order, each with the number the data holds —
    // the band never sees a number, and this file never sees an `Intl`.
    expect(formatAmount.mock.calls).toEqual([[200], [250], [450]]);
    expect(formatAmount).toHaveBeenCalledTimes(3);
  });
});

describe('populatePriceList — the real tariff, walked whole', () => {
  it('prints every category and every row of lib/prices, each with a price', () => {
    const formatAmount = spyFormatter();
    const categories = populatePriceList('ro', formatAmount);

    expect(categories).toHaveLength(11);
    expect(categories).toHaveLength(priceCategories.length);

    const rows = categories.flatMap((category) => category.rows);
    expect(rows).toHaveLength(102);
    expect(rows).toHaveLength(
      priceCategories.reduce(
        (total, category) => total + category.items.length,
        0,
      ),
    );
    expect(formatAmount).toHaveBeenCalledTimes(rows.length);
    for (const row of rows) expect(row.price.length).toBeGreaterThan(0);
  });

  it('hands the band unique category ids — every one of them a DOM id and an #href', () => {
    const ids = populatePriceList('ro', spyFormatter()).map(
      (category) => category.id,
    );

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe('consultations');
  });

  it('shares ONE DOM-id namespace with the page and the band, and nothing collides', () => {
    // The page composes ids from three modules: its own h1 (SERVICES_TITLE_ID),
    // the band's menu (PRICE_MENU_ID and its `-title` heading) and, per card,
    // the category id plus its `-title` heading (CategoryCard's headingId).
    // A category named `services` would name its card by the page title; one
    // named `price-categories` would hijack every back link; `foo` beside
    // `foo-title` would pair the wrong heading — none of which the data test
    // alone can see, because it does not know the page's constants (G2 ts M2).
    const ids = populatePriceList('ro', spyFormatter()).map(
      (category) => category.id,
    );
    const namespace = [
      SERVICES_TITLE_ID,
      PRICE_MENU_ID,
      `${PRICE_MENU_ID}-title`,
      ...ids,
      ...ids.map((id) => `${id}-title`),
    ];

    expect(new Set(namespace).size).toBe(namespace.length);
  });
});
