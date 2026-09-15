import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  defaultLocale,
  isLocale,
  locales,
  nativeNames,
  type Locale,
} from '../../src/i18n/locales';

// THE data invariant the language dial is built on: every endonym STARTS WITH
// its own locale code — Ro mână · En glish · De utsch · Fr ançais · It aliano.
//
// ── Why a test, and not a comment.
// ui/SpeedDial prints a 1–3-letter abbreviation inside each disc and takes its
// spoken name from a separate string: the bulb is named "Română · schimbă
// limba" while it shows "RO". WCAG 2.2 SC 2.5.3 Label in Name requires the
// accessible name to CONTAIN the visible text, so that a voice-control user who
// reads "RO" and says "click RO" actually hits the control. Here that holds
// only because of the coincidence above. The atom does tripwire it at dev time
// (it sees each option's code and label side by side) — but that is a console
// line, not a gate — and the section cannot fix it (endonyms are nobody's to
// rewrite). It is a property of THIS DATA, so this is where it must break, in
// CI: add a sixth language whose endonym does not start with its code —
// Hungarian is the ready example, `hu` → "Magyar" — and this file says so
// before any a11y audit, any pack shot or any patient does.
//
// ── Why in tests/unit/ and not beside the module.
// locales.ts is pure data with zero imports; asserting on it needs no DOM and
// no browser, and the `unit` project (node) is where the other manifest-shaped
// gates already live (the translation-parity check, href.test.ts).

describe('nativeNames — Label in Name holds by data (SC 2.5.3)', () => {
  it.each(locales)(
    '%s: the endonym starts with the code the disc prints',
    (locale) => {
      expect(nativeNames[locale].toLowerCase().startsWith(locale)).toBe(true);
    },
  );

  it('names every routed locale, in itself, exactly once', () => {
    // A missing endonym would render an EMPTY disc name; a duplicate would give
    // two discs the same spoken name, which is the same bug one step later.
    const names = locales.map((locale) => nativeNames[locale]);
    expect(names.every((name) => name.trim().length > 0)).toBe(true);
    expect(new Set(names).size).toBe(locales.length);
  });

  it('names the default locale too — the bulb on a fresh visit', () => {
    expect(locales).toContain(defaultLocale);
    expect(nativeNames[defaultLocale]).toBe('Română');
  });
});

// isLocale — the guard §15.19 named as the trigger "at the next
// `Record<Locale, …>` band", built in the price-list lane because lib/prices is
// that band (board §2.6). The page reads its language out of the URL as a plain
// `string`; every `LocalizedName` in the tariff is a `Record<Locale, string>`.
// Between the two there is either this guard or a cast, and a cast is exactly
// as happy with `'ro-RO'` as with `'ro'`.
describe('isLocale — a route parameter becomes a Locale, or it does not', () => {
  it.each(locales)('accepts %s, the locale the router routes', (locale) => {
    expect(isLocale(locale)).toBe(true);
  });

  it.each([
    // The Storybook toolbar's sixth entry — a real string in this repo, and the
    // one nearest to passing.
    'pseudo',
    // Case matters: the URL segment, the cookie and the message filenames are
    // all lowercase, so an upper-case 'EN' is a bug upstream, not a locale.
    'EN',
    // A missing segment reads as '' long before it reads as Romanian.
    '',
    // A BCP-47 tag from `navigator.language`: the site routes bare languages.
    'ro-RO',
  ])('refuses %j', (candidate) => {
    expect(isLocale(candidate)).toBe(false);
  });

  it('narrows well enough to index a Record<Locale, …> with no cast', () => {
    // The whole point, as the compiler sees it: `table[fromTheRoute]` is a type
    // ERROR on a `string`, and legal on the true branch of the guard. Deleting
    // the `if` breaks `tsc`, which is the regression this case exists to catch.
    const table: Record<Locale, string> = nativeNames;
    const fromTheRoute: string = 'de';
    if (isLocale(fromTheRoute)) {
      expectTypeOf(fromTheRoute).toEqualTypeOf<Locale>();
      expect(table[fromTheRoute]).toBe('Deutsch');
    } else {
      throw new Error("'de' is a routed locale — the guard said otherwise.");
    }
    // And the false branch stays useful: a rejected value is still a `string`,
    // never `never` (the trap lib/initials' isTwoLetters header measured).
    const unknown: string = 'ro-RO';
    if (!isLocale(unknown)) expectTypeOf(unknown).toEqualTypeOf<string>();
  });
});
