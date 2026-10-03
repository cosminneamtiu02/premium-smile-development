import type { Locale } from '../../i18n/locales';

// lib/time-ago — "how long ago", the way Google's review list says it,
// React-free (CLAUDE.md §4's foundation ring; fenced by
// tests/unit/lib-react-free.test.ts). Born in the real-reviews lane (owner,
// 2026-09-30: "instead of the procedure … just say how long ago it took place
// like it says in the google reviews, like, 2 years ago").
//
// A FACT IN, WORDS OUT. The data list stores the DAY a review was posted —
// `YYYY-MM-DD`, the same in every language — never the phrase. `timeAgo`
// reduces the distance to ONE unit and a whole number the way Google's list
// does: whole years once twelve whole months have passed, else whole months,
// else whole weeks, else days, always rounded DOWN (so "a year ago" covers 12
// to 23 months, as it does on Google). `formatTimeAgo` hands that pair to
// `Intl.RelativeTimeFormat`, which owns the grammar of all five languages —
// „acum 2 ani", "2 years ago", „vor 2 Jahren", « il y a 2 ans », „2 anni fa",
// the Romanian „de" from twenty up included (§8.3: formatting through Intl,
// never by hand). `numeric: 'always'` keeps the digit Google keeps („acum 1
// an", not „anul trecut", which would mean the previous CALENDAR year); only a
// review from today reads „azi" / "today".
//
// WHEN "NOW" IS. The caller passes it. On the static site that is the BUILD —
// the band renders once, at `next build` — so the phrase is exact on the day
// the site was built and every rebuild refreshes it; stories and tests pin a
// date so a baseline never ages. Computing it in the browser instead would
// mean a second render of every card after hydration (§16's rule 2) for a
// label whose unit changes a few times a year. All arithmetic is in UTC
// calendar days, so the build machine's time zone cannot move a boundary.

/** One decimal digit — the building block of the day's template below. */
type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

/**
 * A calendar day spelled `YYYY-MM-DD`. The template is the compile-time half:
 * a missing dash, a missing zero („2025-6-14") or the day written first
 * („14-06-2025") is a red squiggle (G2 typescript, 2026-09-30). `isIsoDate`
 * is the runtime half — only it can tell that 2025-02-30 is not a day, or
 * that there is no month 13.
 */
export type IsoDate =
  `${number}-${'0' | '1'}${Digit}-${'0' | '1' | '2' | '3'}${Digit}`;

/** The four units Google's list uses, largest first. */
export type TimeAgoUnit = 'year' | 'month' | 'week' | 'day';

/** How long ago, reduced to one unit and a whole number (0 = today). */
export type TimeAgo = Readonly<{ value: number; unit: TimeAgoUnit }>;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const DAY_MS = 86_400_000;

/** The day's three numbers, or `null` when `value` is not a real calendar day. */
function parseDay(
  value: string,
): Readonly<{ year: number; month: number; day: number }> | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // Date.UTC rolls an impossible day over (Feb 30 → Mar 2), so a day that
  // does not survive the round trip does not exist.
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
    ? { year, month, day }
    : null;
}

/** Whether `value` is a real calendar day spelled `YYYY-MM-DD`. */
export function isIsoDate(value: string): value is IsoDate {
  return parseDay(value) !== null;
}

/**
 * How long before `now` the day `then` was — one unit and a whole number,
 * rounded down the way Google's review list rounds.
 * @throws RangeError when `now` is an Invalid Date, when `then` is not a real
 *   day, or when it lies after `now`'s day (a review from the future is a
 *   data error, and a loud one).
 */
export function timeAgo(then: IsoDate, now: Date): TimeAgo {
  // Without this an Invalid Date slips through every comparison below (each
  // is false against NaN) and dies later inside Intl with a message that
  // names neither the clock nor the review (G2 typescript, 2026-09-30).
  if (Number.isNaN(now.getTime())) {
    throw new RangeError(
      'timeAgo: "now" is an Invalid Date — the clock a caller passed is not one.',
    );
  }
  const posted = parseDay(then);
  if (posted === null) {
    throw new RangeError(
      `timeAgo: "${then}" is not a calendar day spelled YYYY-MM-DD.`,
    );
  }
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const start = Date.UTC(posted.year, posted.month - 1, posted.day);
  const today = Date.UTC(year, month - 1, day);
  if (start > today) {
    throw new RangeError(
      `timeAgo: "${then}" lies after ${now.toISOString().slice(0, 10)} — a date from the future, or a pinned "now" older than the data.`,
    );
  }
  // Whole calendar months: a month counts once its day of the month is
  // reached again (14 June → 14 July is one month; → 13 July is not yet).
  const months =
    (year - posted.year) * 12 +
    (month - posted.month) -
    (day < posted.day ? 1 : 0);
  if (months >= 12) return { value: Math.floor(months / 12), unit: 'year' };
  if (months >= 1) return { value: months, unit: 'month' };
  const days = Math.round((today - start) / DAY_MS);
  if (days >= 7) return { value: Math.floor(days / 7), unit: 'week' };
  return { value: days, unit: 'day' };
}

/**
 * The finished phrase in the page's language, e.g. „acum 2 ani" / "2 years
 * ago" / „vor 2 Jahren".
 * @throws RangeError as `timeAgo` does.
 */
export function formatTimeAgo(
  locale: Locale,
  then: IsoDate,
  now: Date,
): string {
  const { value, unit } = timeAgo(then, now);
  // `auto` only for today, where it says „azi" instead of „acum 0 zile";
  // everywhere else the digit stays, as it does on Google.
  const format = new Intl.RelativeTimeFormat(locale, {
    numeric: value === 0 ? 'auto' : 'always',
  });
  return format.format(value === 0 ? 0 : -value, unit);
}
