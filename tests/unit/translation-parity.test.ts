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

const reference = flattenKeys(ro as Messages);
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
