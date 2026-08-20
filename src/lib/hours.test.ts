import { describe, expect, it } from 'vitest';
import { clinic, type SchemaDay } from './clinic';
import { formatHoursRows } from './hours';

// lib/hours — a PURE formatter (no React, no Date.now): the schema.org day
// arrays in lib/clinic.ts become the rows the Footer prints — ONE ROW PER
// DAY, Monday first (owner amendment 2026-08-18; the grouped "Luni – Vineri"
// ranges are gone). Two properties carry the whole file and both are asserted
// below:
//
//  · DETERMINISM — weekday names come from a fixed reference week, so the
//    output depends on (data, locale) and nothing else. A snapshot taken on a
//    Tuesday equals one taken on a Sunday, which is what lets the visual
//    baselines hold.
//  · CALENDAR ORDER — all seven days, Monday → Sunday, each on its own row;
//    days no entry covers stay IN PLACE as closed rows with the caller's
//    already-translated label (§8.1: this module never sees a message key).
//
// Romanian with diacritics is the default fixture (§15.7); DE/FR/IT are spot
// checks that the day names really come from Intl and are not a hidden table.

/** U+2013 EN DASH with ordinary spaces — the exact separator the old site used. */
const EN_DASH = '–';
const CLOSED_RO = 'Închis';

/** The seven Romanian day names the formatter must produce, in week order. */
const WEEK_RO = [
  'Luni',
  'Marți',
  'Miercuri',
  'Joi',
  'Vineri',
  'Sâmbătă',
  'Duminică',
] as const;

describe('lib/hours — the shipped clinic schedule, one row per day', () => {
  it('prints all SEVEN days, Monday first, one row each', () => {
    const rows = formatHoursRows(clinic.hours, 'ro', CLOSED_RO);

    expect(rows).toEqual([
      { label: 'Luni', value: '09:00 – 19:00', closed: false },
      { label: 'Marți', value: '09:00 – 19:00', closed: false },
      { label: 'Miercuri', value: '09:00 – 19:00', closed: false },
      { label: 'Joi', value: '09:00 – 19:00', closed: false },
      { label: 'Vineri', value: '09:00 – 19:00', closed: false },
      { label: 'Sâmbătă', value: '09:00 – 14:00', closed: false },
      { label: 'Duminică', value: CLOSED_RO, closed: true },
    ]);
  });

  it('never prints a range — every label is a single, dash-free day name', () => {
    for (const row of formatHoursRows(clinic.hours, 'ro', CLOSED_RO)) {
      expect(row.label).not.toContain(EN_DASH);
      expect(row.label).not.toContain('-');
    }
  });

  it('spells the VALUE separator as an EN DASH between ordinary spaces', () => {
    const [monday] = formatHoursRows(clinic.hours, 'ro', CLOSED_RO);

    // Byte-exact on purpose: a hyphen, an em dash or a thin space would all
    // "look right" in a diff and none of them is what the old site printed.
    expect(monday?.value).toBe(`09:00 ${EN_DASH} 19:00`);
    expect(monday?.value).not.toContain('-');
    expect(monday?.value).not.toContain('—');
    // U+202F NARROW NO-BREAK SPACE, as an ESCAPE on purpose: pasted literally
    // it is indistinguishable from the ordinary spaces the value does contain.
    expect(monday?.value).not.toContain('\u202f');
  });

  it('is deterministic — same inputs, same rows, whatever day it is', () => {
    expect(formatHoursRows(clinic.hours, 'ro', CLOSED_RO)).toEqual(
      formatHoursRows(clinic.hours, 'ro', CLOSED_RO),
    );
  });
});

describe('lib/hours — day names come from Intl, capitalized per locale', () => {
  const spotChecks: ReadonlyArray<[string, string, string]> = [
    ['de', 'Montag', 'Samstag'],
    ['fr', 'Lundi', 'Samedi'],
    ['it', 'Lunedì', 'Sabato'],
    ['en', 'Monday', 'Saturday'],
  ];

  it.each(spotChecks)(
    '%s opens the week with "%s" and rows[5] is "%s"',
    (locale, monday, saturday) => {
      const rows = formatHoursRows(clinic.hours, locale, 'Closed');
      expect(rows[0]?.label).toBe(monday);
      expect(rows[5]?.label).toBe(saturday);
    },
  );

  it('uppercases only the FIRST letter, leaving the rest as Intl wrote it', () => {
    // Romanian and French print weekday names lowercase; the old design
    // capitalized them. Uppercasing the whole word would be a different design.
    const rows = formatHoursRows(clinic.hours, 'fr', 'Fermé');
    expect(rows[5]?.label).toBe('Samedi');
    expect(rows[5]?.label).not.toBe('SAMEDI');
  });
});

describe('lib/hours — per-day rules', () => {
  it('keeps a closed day IN ITS CALENDAR PLACE, never reordered to the end', () => {
    // The old grouped formatter appended closed rows after the open ones; a
    // per-day schedule reads like a calendar, so a closed Monday must stay
    // first even when the weekend is when the clinic opens.
    const rows = formatHoursRows(
      [{ days: ['Saturday', 'Sunday'], opens: '10:00', closes: '14:00' }],
      'ro',
      CLOSED_RO,
    );

    expect(rows.map((row) => [row.label, row.closed])).toEqual([
      ['Luni', true],
      ['Marți', true],
      ['Miercuri', true],
      ['Joi', true],
      ['Vineri', true],
      ['Sâmbătă', false],
      ['Duminică', false],
    ]);
  });

  it('marks NO row closed when every day is covered', () => {
    const rows = formatHoursRows(
      [
        {
          days: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
          opens: '08:00',
          closes: '20:00',
        },
      ],
      'ro',
      CLOSED_RO,
    );

    expect(rows).toHaveLength(7);
    expect(rows.some((row) => row.closed)).toBe(false);
    expect(rows.every((row) => row.value === `08:00 ${EN_DASH} 20:00`)).toBe(
      true,
    );
  });

  it('lets a LATER entry override an earlier one, day by day', () => {
    // Entries may overlap; the last one wins, exactly as a correction should —
    // and only for the days it names, the rest keep the earlier value.
    const rows = formatHoursRows(
      [
        {
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '09:00',
          closes: '19:00',
        },
        { days: ['Wednesday'], opens: '10:00', closes: '14:00' },
      ],
      'ro',
      CLOSED_RO,
    );

    expect(rows[2]).toEqual({
      label: 'Miercuri',
      value: `10:00 ${EN_DASH} 14:00`,
      closed: false,
    });
    expect(rows[1]).toEqual({
      label: 'Marți',
      value: `09:00 ${EN_DASH} 19:00`,
      closed: false,
    });
  });

  it('reports an empty schedule as SEVEN closed rows, not silence', () => {
    // The rule has no special case: every uncovered day is a closed row, so
    // empty data reads "Luni · Închis … Duminică · Închis" rather than
    // disappearing silently.
    const rows = formatHoursRows([], 'ro', CLOSED_RO);

    expect(rows).toHaveLength(7);
    expect(rows.every((row) => row.closed && row.value === CLOSED_RO)).toBe(
      true,
    );
    expect(rows.map((row) => row.label)).toEqual([...WEEK_RO]);
  });

  it('THROWS on a day name schema.org does not define', () => {
    // Loud at build time (the Footer is pre-rendered, §16) beats silently
    // telling patients the clinic is closed on a day it is open. The
    // SchemaDay union now fails typos at compile time, so the cast below
    // deliberately defeats the compiler to prove the runtime belt-and-braces.
    expect(() =>
      formatHoursRows(
        [{ days: ['Mondey' as SchemaDay], opens: '09:00', closes: '17:00' }],
        'ro',
        CLOSED_RO,
      ),
    ).toThrow(/Mondey/);
  });
});
