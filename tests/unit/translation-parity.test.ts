import { describe, expect, it } from 'vitest';
import { defaultLocale, locales } from '../../src/i18n/locales';
import de from '../../src/messages/de.json';
import en from '../../src/messages/en.json';
import fr from '../../src/messages/fr.json';
import it_ from '../../src/messages/it.json';
import ro from '../../src/messages/ro.json';

// The silent classic this prevents (§13, GITHUB_SETUP §8.1): a key added in ro
// but forgotten in de leaks English (or nothing) into production. All five
// files must share ONE identical key set — a missing translation fails CI.

type Messages = { [key: string]: string | Messages };

function flattenKeys(node: Messages, prefix = ''): string[] {
  return Object.entries(node)
    .flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof value === 'string' ? [path] : flattenKeys(value, path);
    })
    .sort();
}

/** The same walk, keeping the VALUES — what the ICU case below compares. */
function flattenEntries(node: Messages, prefix = ''): Map<string, string> {
  const entries = new Map<string, string>();
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      entries.set(path, value);
    } else {
      for (const [nested, text] of flattenEntries(value, path)) {
        entries.set(nested, text);
      }
    }
  }
  return entries;
}

/**
 * The ICU ARGUMENT NAMES a message declares, deduplicated and sorted —
 * "{name}, schimbă limba" → ['{name}'].
 *
 * Sorted because languages reorder a sentence's arguments freely (German may
 * put the closing time first); deduplicated because ICU lets one argument
 * appear twice in a sentence without changing the contract. What must match is
 * the SET of names the section has to pass, nothing about their placement.
 */
const placeholders = (value: string): string[] =>
  [...new Set(value.match(/\{[^}]+\}/g) ?? [])].toSorted();

const reference = flattenKeys(ro as Messages);
const referenceEntries = flattenEntries(ro as Messages);
const others: ReadonlyArray<[string, Messages]> = [
  ['en', en as Messages],
  ['de', de as Messages],
  ['fr', fr as Messages],
  ['it', it_ as Messages],
];

describe('translation parity (ro is the reference)', () => {
  it('ro has at least one key', () => {
    expect(reference.length).toBeGreaterThan(0);
  });

  it('message files cover exactly the locales in the manifest', () => {
    const covered = [defaultLocale, ...others.map(([locale]) => locale)];
    expect(covered.toSorted()).toEqual([...locales].toSorted());
  });

  it.each(others)(
    '%s shares the exact key set with ro',
    (_locale, messages) => {
      expect(flattenKeys(messages)).toEqual(reference);
    },
  );

  it.each(others)(
    '%s declares ro’s ICU arguments in every message',
    (locale, messages) => {
      // The key set can match perfectly while a VALUE's arguments do not, and
      // next-intl does not throw for that either: a message asking for
      // {weekOpen} when the section passes weekOpens renders the literal braces
      // to that locale's visitors, and only to them. `contact.callHours` is the
      // repo's first multi-argument message (four times in one line), which is
      // exactly where a retranslation drops or renames one (G2 ts fold).
      const entries = flattenEntries(messages);
      for (const [path, value] of referenceEntries) {
        expect(
          placeholders(entries.get(path) ?? ''),
          `${locale}:${path}`,
        ).toEqual(placeholders(value));
      }
    },
  );

  it('no locale has an empty string value', () => {
    for (const [locale, messages] of [
      ['ro', ro as Messages] as const,
      ...others,
    ]) {
      const walk = (node: Messages, path: string) => {
        for (const [key, value] of Object.entries(node)) {
          const p = path ? `${path}.${key}` : key;
          if (typeof value === 'string') {
            expect(value.trim(), `${locale}:${p}`).not.toBe('');
          } else {
            walk(value, p);
          }
        }
      };
      walk(messages, '');
    }
  });
});
