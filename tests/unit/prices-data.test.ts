import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  priceCategories,
  type LocalizedName,
  type PriceCategory,
  type PriceItem,
} from '../../src/lib/prices/prices';
import { locales, type Locale } from '../../src/i18n/locales';

// lib/prices INTEGRITY — the checks the compiler cannot make, and the ones only
// the printed sheet knows. `tsc` already proves that every `name` HAS five
// languages; only a test can see that one of them is an empty string, that two
// rows share an id, or that a transcription lost four rows on the way in. The
// counts are pinned on purpose: the requirement here is a PHYSICAL document —
// the owner's „LISTĂ DE PREȚURI" photographed 2026-09-13, 11 categories and 102
// rows (board §2b) — so a diff that silently drops or duplicates a row must
// fail in CI, not on the rendered page. Runtime guards are repeated after the
// type-level ones for the same reason lib/reviews repeats them: a cast can
// smuggle a bad row past the compiler, and this file is the braces.
//
// In the node `unit` project rather than beside the module (the reviews-data
// precedent): the module is pure data with no DOM, and one check below reads
// the source file itself.
//
// WHY THERE IS NO "BARE NUMBER" RULE. The one thing a name must never carry is
// the PRICE — the amount is a number here and becomes a sentence exactly once,
// in the page, through `services.prices.amount` (board §2.4). But digits are
// ordinary inside a treatment name on this sheet („Membrană titan 20×25",
// „recall la 3–6 luni", „Chiuretaj parodontal în câmp deschis 1–3 dinți",
// „grad 1"), so a `\d{2,}` rule would fail on legitimate rows. What is
// forbidden is the CURRENCY WORD, which is what a smuggled amount brings with
// it. `€` sits outside the `\b…\b` group deliberately: it is not a word
// character, so `\b€\b` can never match.
const CURRENCY = /\b(?:RON|lei|EUR)\b|€/iu;
const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The sheet's own shape (board §2b) — a dropped row has to be loud. */
const SHEET = { categories: 11, rows: 102 } as const;

/**
 * The four ⚠ entries of board §2c.4, as five rows: the photograph is skewed and
 * its price column sits about one row lower than the names in places, so these
 * amounts were recorded AS READ on the owner's „decide for me" (fb-455) with a
 * `TODO(owner)` line beside each. Pinning id AND amount here means the doubt
 * cannot quietly become certainty — a changed number fails until this table is
 * changed with it, which is the moment to say the sheet was checked.
 */
const FLAGGED = [
  { category: 'endodontics', id: 'foreign-body-file', lei: 300 },
  { category: 'endodontics', id: 'foreign-body-post', lei: 220 },
  { category: 'prosthetics', id: 'kemeny-flexible', lei: 550 },
  { category: 'prosthetics', id: 'repositioning-splint', lei: 1100 },
  { category: 'implantology', id: 'implant-bredent', lei: 3200 },
] as const;

const everyItem: readonly (PriceItem & { category: string })[] =
  priceCategories.flatMap((category) =>
    category.items.map((item) => ({ ...item, category: category.id })),
  );

/** Every translated field a category carries: its name, its eyebrow — one per
 *  category since the owner's 2026-09-14 round, which is why it is no longer a
 *  conditional entry here — and one name per row. */
function namedFields(
  category: PriceCategory,
): readonly { where: string; name: LocalizedName }[] {
  return [
    { where: `${category.id}.name`, name: category.name },
    { where: `${category.id}.eyebrow`, name: category.eyebrow },
    ...category.items.map((item) => ({
      where: `${category.id}/${item.id}.name`,
      name: item.name,
    })),
  ];
}

describe('lib/prices — the list matches the printed sheet', () => {
  it('is a non-empty array of exactly the sheet’s categories', () => {
    expect(Array.isArray(priceCategories)).toBe(true);
    expect(priceCategories.length).toBe(SHEET.categories);
  });

  it('carries every row of the sheet, and no more', () => {
    expect(everyItem.length).toBe(SHEET.rows);
  });

  it('gives every category at least one row (an empty card is a bug, not a state)', () => {
    for (const category of priceCategories) {
      expect(category.items.length, category.id).toBeGreaterThan(0);
    }
  });

  it('gives every category an eyebrow — eleven of eleven, in all five locales (owner 2026-09-14)', () => {
    // The owner made the sub-label required across the band („why in
    // categories is it only in some places heading + eyebrow. i want that in
    // all of them"), so „all of them" is the assertion, stated in its own case
    // rather than left to the sweep below: `tsc` refuses a category with no
    // `eyebrow` key, but a cast can smuggle one past it and an empty string
    // gets past it honestly — and either one renders as a card that opens
    // differently from its ten neighbours, which is the exact thing the round
    // was about. Unlike the counts above, these words are NOT the printed
    // sheet's: all eleven are drafted and flagged for confirmation in
    // prices.ts' header. The test pins that they EXIST and say something, never
    // what they say.
    expect(
      priceCategories.filter((category) => Object.hasOwn(category, 'eyebrow'))
        .length,
    ).toBe(SHEET.categories);

    for (const category of priceCategories) {
      for (const locale of locales) {
        expect(
          category.eyebrow[locale].trim().length,
          `${locale}: ${category.id}.eyebrow`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('category ids are unique and kebab-case (the card’s DOM id, the menu’s #href, the React key)', () => {
    const ids = priceCategories.map((category) => category.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(KEBAB_CASE);
  });

  it('item ids are kebab-case and unique inside their own category (the row’s React key)', () => {
    for (const category of priceCategories) {
      const ids = category.items.map((item) => item.id);
      expect(new Set(ids).size, category.id).toBe(ids.length);
      for (const id of ids) expect(id, category.id).toMatch(KEBAB_CASE);
    }
  });

  it.each(priceCategories)(
    '$id names every heading, eyebrow and row in all five locales',
    (category) => {
      for (const { where, name } of namedFields(category)) {
        for (const locale of locales) {
          const value = name[locale];
          expect(value.trim().length, `${locale}: ${where}`).toBeGreaterThan(0);
          // Trimmed, not merely non-empty: a stray space would ride into the
          // menu link, the heading and the `<dt>` unnoticed.
          expect(value, `${locale}: ${where}`).toBe(value.trim());
        }
      }
    },
  );

  it.each(priceCategories)(
    '$id prices whole lei as positive integers (the page formats them, this file never does)',
    (category) => {
      for (const item of category.items) {
        expect(Number.isInteger(item.lei), `${category.id}/${item.id}`).toBe(
          true,
        );
        expect(item.lei, `${category.id}/${item.id}`).toBeGreaterThan(0);
      }
    },
  );

  it.each(priceCategories)(
    '$id keeps the currency out of every name (the sentence is the page’s job — board §2.4)',
    (category) => {
      for (const { where, name } of namedFields(category)) {
        for (const locale of locales) {
          expect(name[locale], `${locale}: ${where}`).not.toMatch(CURRENCY);
        }
      }
    },
  );
});

describe('lib/prices — the type is the first gate', () => {
  it('a name is all five locales, or it is not a name', () => {
    expectTypeOf<PriceItem['name']>().toEqualTypeOf<LocalizedName>();
    expectTypeOf<LocalizedName>().toEqualTypeOf<
      Readonly<Record<Locale, string>>
    >();
    const fourLanguages: PriceItem = {
      id: 'probe',
      // @ts-expect-error — `de` is missing: four languages are not a LocalizedName
      name: { ro: 'R', en: 'E', fr: 'F', it: 'I' },
      lei: 1,
    };
    expect(fourLanguages.id).toBe('probe');
  });
});

describe('lib/prices — the transcription’s own doubts stay visible', () => {
  it.each(FLAGGED)(
    '$category/$id is still the amount read off the photo',
    ({ category, id, lei }) => {
      const row = everyItem.find(
        (item) => item.category === category && item.id === id,
      );
      expect(row, `${category}/${id} left the list`).toBeDefined();
      expect(row?.lei).toBe(lei);
    },
  );

  it('each flagged row still carries its TODO(owner) line (board §2c.4)', () => {
    // The rows above prove the NUMBERS survive; only the source text proves the
    // DOUBT survives with them. A stray reformat cannot break this — the
    // comment sits in the three lines above the row's `id:`, whatever width
    // Prettier chooses.
    const source = readFileSync(
      fileURLToPath(new URL('../../src/lib/prices/prices.ts', import.meta.url)),
      'utf8',
    ).split('\n');
    const todo = /^\s*\/\/ TODO\(owner\): verify against the printed sheet/;

    expect(source.filter((line) => todo.test(line)).length).toBe(
      FLAGGED.length,
    );
    for (const { id } of FLAGGED) {
      const at = source.findIndex((line) => line.includes(`id: '${id}'`));
      expect(at, `${id} left the list`).toBeGreaterThan(-1);
      expect(
        source.slice(Math.max(0, at - 3), at).some((line) => todo.test(line)),
        `${id} lost its verify comment`,
      ).toBe(true);
    }
  });
});
