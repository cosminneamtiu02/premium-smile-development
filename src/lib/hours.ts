import type { ClinicInfo, SchemaDay } from './clinic';

// lib/hours — the opening-hours FORMATTER: schema.org day arrays in, printable
// rows out. Pure data work, no React and no 'use client', so the Footer's
// Server Component can call it while it is pre-rendered into static HTML
// (§16) and a unit test can call it with no DOM at all.
//
// ── ONE ROW PER DAY (owner amendment 2026-08-18). The formatter used to
// collapse consecutive days into ranges ("Luni – Vineri"); the owner asked for
// a calendar instead: seven rows, Monday → Sunday, every day named, closed
// days IN PLACE rather than appended. A range machine and its edge cases
// (week-boundary wrap, non-consecutive splits) died with the change.
//
// ── DETERMINISM IS THE POINT (and the reason there is no `new Date()` here).
// Weekday names are read out of a FIXED reference week, never out of today, so
// the output depends on exactly two things: the schedule and the locale. A
// visual baseline shot on a Tuesday therefore equals one shot on a Sunday, and
// the build produces identical bytes on every run (§16's "same inputs ⇒ same
// output" rule, the same one tools/generate-root-redirect.ts states).
//
// ── §8.1: this module never sees a message key. `closedLabel` arrives as
// FINISHED text from the section that called t() — which is what lets the same
// function serve all five locales without importing next-intl.

/** One printed line: a day and what happens on it. */
export interface HoursRow {
  /** "Luni", "Sâmbătă" — one day, already capitalized for the locale. */
  label: string;
  /** "09:00 – 19:00", or the caller's already-translated closed label. */
  value: string;
  /** True when no entry covers this day — the row the Footer dims. */
  closed: boolean;
}

/**
 * WEEK ORDER, Monday-first — Romanian (and every other locale this site
 * speaks) starts the week on Monday, and the rows below read this array top
 * to bottom, so the printed schedule is the reader's own calendar week.
 */
const WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const satisfies readonly SchemaDay[];

/** U+2013 EN DASH, between ordinary spaces — the old site's exact separator. */
const EN_DASH = '–';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 2024-01-01 was a Monday, in UTC. Adding whole days to it walks the week in
 * order, and formatting in UTC keeps the machine's own timezone out of the
 * result — without that, a negative-offset zone would shift every name one day
 * back and the Footer would print Sunday's word for Monday.
 */
const REFERENCE_MONDAY = Date.UTC(2024, 0, 1);

/**
 * The locale's own word for weekday `index`, first letter uppercased — Romanian
 * ("luni"), French and Italian print weekday names lowercase, and the old
 * design capitalized them. Only the first letter: uppercasing the whole word
 * would be a different design, not a translation.
 */
function weekdayName(index: number, locale: string): string {
  const name = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(new Date(REFERENCE_MONDAY + index * DAY_MS));
  return name.slice(0, 1).toLocaleUpperCase(locale) + name.slice(1);
}

/**
 * The clinic's schedule as printable rows: ONE ROW PER DAY, Monday → Sunday,
 * always seven. A day no entry covers becomes a closed row in its calendar
 * place — never reordered, never grouped, never dropped (an empty schedule is
 * seven closed rows, not silence).
 *
 * @param hours       the schema.org entries from lib/clinic.ts — the single
 *                    source of NAP (§10.1). Entries may overlap days; the last
 *                    one wins, exactly as a later correction should.
 * @param locale      BCP-47 tag for Intl — decides the weekday words.
 * @param closedLabel already-translated "Închis" (§8.1 — no key reaches here).
 */
export function formatHoursRows(
  hours: ClinicInfo['hours'],
  locale: string,
  closedLabel: string,
): HoursRow[] {
  const byDay: (string | undefined)[] = new Array(WEEK.length).fill(undefined);

  for (const entry of hours) {
    const value = `${entry.opens} ${EN_DASH} ${entry.closes}`;
    for (const day of entry.days) {
      const index = WEEK.indexOf(day);
      // Belt-and-braces BEHIND the SchemaDay union: the compiler now rejects
      // typos outright, so this guards only data that dodged it (a deliberate
      // cast, future JSON-sourced hours). Still loud at build time — silently
      // printing "closed" on a day the clinic is open is real-world harm, not
      // a cosmetic bug (§10.1).
      if (index === -1) {
        throw new Error(
          `lib/hours: "${day}" is not a schema.org day name. Expected one of: ${WEEK.join(', ')}.`,
        );
      }
      byDay[index] = value;
    }
  }

  return byDay.map((value, index) => ({
    label: weekdayName(index, locale),
    value: value ?? closedLabel,
    closed: value === undefined,
  }));
}
