import { describe, expect, it } from 'vitest';
import { formatTimeAgo, isIsoDate, timeAgo, type IsoDate } from './time-ago';

// lib/time-ago — the unit Google's review list would pick, rounded down, and
// the phrase Intl builds from it in all five languages. Every boundary is
// pinned from both sides: the last day before a unit changes and the day it
// does. `now` is always explicit, as it is for every caller.

const NOW = new Date('2026-09-30T12:00:00Z');

describe('lib/time-ago — isIsoDate', () => {
  it.each(['2026-09-30', '2024-02-29', '1999-12-31'])('accepts %s', (day) => {
    expect(isIsoDate(day)).toBe(true);
  });

  it.each([
    ['a day that does not exist', '2025-02-29'],
    ['month 13', '2025-13-01'],
    ['day zero', '2025-06-00'],
    ['a missing zero', '2025-6-14'],
    ['a time of day', '2025-06-14T10:00'],
    ['the other order', '14-06-2025'],
    ['an empty string', ''],
  ])('refuses %s', (_, value) => {
    expect(isIsoDate(value)).toBe(false);
  });
});

describe('lib/time-ago — timeAgo, rounded down like Google', () => {
  it.each<[IsoDate, number, string]>([
    ['2026-09-30', 0, 'day'],
    ['2026-09-24', 6, 'day'],
    ['2026-09-23', 1, 'week'],
    ['2026-08-31', 4, 'week'],
    ['2026-08-30', 1, 'month'],
    ['2025-10-01', 11, 'month'],
    ['2025-09-30', 1, 'year'],
    ['2024-10-01', 1, 'year'],
    ['2024-09-30', 2, 'year'],
    ['2006-09-30', 20, 'year'],
  ])('%s → %i %s', (then, value, unit) => {
    expect(timeAgo(then, NOW)).toEqual({ value, unit });
  });

  it('counts a month only once its day of the month comes round again', () => {
    expect(timeAgo('2026-01-31', new Date('2026-02-28T00:00:00Z'))).toEqual({
      value: 4,
      unit: 'week',
    });
    expect(timeAgo('2026-01-31', new Date('2026-03-31T00:00:00Z'))).toEqual({
      value: 2,
      unit: 'month',
    });
  });

  it('works in UTC calendar days: the hour of `now` never moves a boundary', () => {
    const lateNight = new Date('2026-09-29T23:59:59Z');
    const earlyMorning = new Date('2026-09-30T00:00:01Z');
    expect(timeAgo('2025-09-30', lateNight)).toEqual({
      value: 11,
      unit: 'month',
    });
    expect(timeAgo('2025-09-30', earlyMorning)).toEqual({
      value: 1,
      unit: 'year',
    });
  });

  it('throws, naming both days, for a date after now', () => {
    expect(() => timeAgo('2026-10-01', NOW)).toThrow(/2026-10-01.*2026-09-30/);
  });

  it('throws for a day that does not exist (a cast past the template type)', () => {
    expect(() => timeAgo('2025-02-30' as IsoDate, NOW)).toThrow(RangeError);
  });

  it('throws, naming the clock, for an Invalid Date as now (never a NaN into Intl)', () => {
    const broken = new Date('not a date');
    expect(() => timeAgo('2026-09-30', broken)).toThrow(
      /"now" is an Invalid Date/,
    );
    expect(() => formatTimeAgo('ro', '2026-09-30', broken)).toThrow(
      /"now" is an Invalid Date/,
    );
  });

  it('the template type refuses the common misspellings at compile time', () => {
    const fine: IsoDate = '2026-09-30';
    // @ts-expect-error — a missing zero in the month
    const missingZero: IsoDate = '2025-6-14';
    // @ts-expect-error — the day written first
    const dayFirst: IsoDate = '14-06-2025';
    // @ts-expect-error — no dashes at all
    const noDashes: IsoDate = '20250614';
    expect([fine, missingZero, dayFirst, noDashes]).toHaveLength(4);
  });
});

describe('lib/time-ago — formatTimeAgo, the grammar is Intl’s', () => {
  it.each([
    ['ro', '2024-09-30', 'acum 2 ani'],
    ['en', '2024-09-30', '2 years ago'],
    ['de', '2024-09-30', 'vor 2 Jahren'],
    ['fr', '2024-09-30', 'il y a 2 ans'],
    ['it', '2024-09-30', '2 anni fa'],
    ['ro', '2025-09-30', 'acum 1 an'],
    ['ro', '2006-09-30', 'acum 20 de ani'],
    ['ro', '2026-06-30', 'acum 3 luni'],
    ['de', '2026-09-16', 'vor 2 Wochen'],
  ] as const)('%s, %s → „%s"', (locale, then, phrase) => {
    expect(formatTimeAgo(locale, then, NOW)).toBe(phrase);
  });

  it.each([
    ['ro', 'azi'],
    ['en', 'today'],
    ['de', 'heute'],
  ] as const)(
    '%s says „%s" for a review from today, never „0 days ago"',
    (locale, phrase) => {
      expect(formatTimeAgo(locale, '2026-09-30', NOW)).toBe(phrase);
    },
  );
});
