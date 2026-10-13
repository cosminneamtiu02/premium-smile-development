import { describe, expect, it } from 'vitest';
import { locales } from '../../src/i18n/locales';
import de from '../../src/messages/privacy/de.json';
import en from '../../src/messages/privacy/en.json';
import fr from '../../src/messages/privacy/fr.json';
import it_ from '../../src/messages/privacy/it.json';
import ro from '../../src/messages/privacy/ro.json';

// THE PRIVACY POLICY'S OWN MESSAGE FILES, held to the main files' standard
// (CLAUDE.md §15.38). They live apart from src/messages/*.json so the policy
// rides only its own page (sections/PrivacyPolicy/messages.ts says why), which
// also puts them outside tests/unit/translation-parity.test.ts — so this file
// is that test again for them, plus three rules a legal text needs:
//   · the SAME KEYS, in the SAME ORDER — a translation that drops a paragraph
//     or moves one is a policy that says less, or says it elsewhere;
//   · the SAME ICU ARGUMENTS and the SAME LINK TAGS in every message — a
//     sentence that lost `<google>` would still read well and link nothing;
//   · no MID-SENTENCE DASH (the owner's D-DASH rule, PHASE4_SEO_PLAN.md),
//     the em and en dashes anywhere, a spaced hyphen inside a sentence;
//   · a TAG AND AN ARGUMENT NEVER SHARE A NAME: `t.rich` takes one values
//     object for both, so `<email>{email}</email>` cannot be filled — the
//     bug this lane met in its own first draft.

type Messages = { [key: string]: string | Messages };

/** Every message as [dotted key, value], in the file's own order. */
function entries(node: Messages, prefix = ''): Array<[string, string]> {
  return Object.entries(node).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string'
      ? [[path, value] as [string, string]]
      : entries(value, path);
  });
}

/**
 * The ICU ARGUMENT names a message declares — `{name}`, `{months, plural, …}`
 * → months — sorted and deduplicated. A plural branch's `{# …}` is not an
 * argument, and the `#` keeps it out.
 */
const argumentsOf = (value: string): string[] =>
  [
    ...new Set(
      [...value.matchAll(/\{\s*([A-Za-z]\w*)\s*[,}]/g)].map((m) => m[1]!),
    ),
  ].toSorted();

/** The rich-text TAG names a message opens — `<google>…</google>` → google. */
const tagsOf = (value: string): string[] =>
  [
    ...new Set([...value.matchAll(/<([A-Za-z]\w*)>/g)].map((m) => m[1]!)),
  ].toSorted();

const files: ReadonlyArray<[string, Messages]> = [
  ['ro', ro as Messages],
  ['en', en as Messages],
  ['de', de as Messages],
  ['fr', fr as Messages],
  ['it', it_ as Messages],
];
const reference = entries(ro as Messages);
const others = files.filter(([locale]) => locale !== 'ro');

describe('privacy policy — the five message files (ro is the reference)', () => {
  it('cover exactly the locales in the manifest', () => {
    expect(files.map(([locale]) => locale).toSorted()).toEqual(
      [...locales].toSorted(),
    );
  });

  it.each(others)('%s has ro’s keys, in ro’s order', (_locale, messages) => {
    expect(entries(messages).map(([key]) => key)).toEqual(
      reference.map(([key]) => key),
    );
  });

  it.each(others)(
    '%s declares ro’s ICU arguments in every message',
    (_locale, messages) => {
      const values = new Map(entries(messages));
      for (const [key, value] of reference) {
        expect(argumentsOf(values.get(key) ?? ''), key).toEqual(
          argumentsOf(value),
        );
      }
    },
  );

  it.each(others)(
    '%s keeps ro’s link tags in every message, each opened and closed once',
    (_locale, messages) => {
      const values = new Map(entries(messages));
      for (const [key, value] of reference) {
        const translated = values.get(key) ?? '';
        expect(tagsOf(translated), key).toEqual(tagsOf(value));
        for (const tag of tagsOf(value)) {
          expect(
            translated.split(`<${tag}>`).length - 1,
            `${key} <${tag}>`,
          ).toBe(1);
          expect(
            translated.split(`</${tag}>`).length - 1,
            `${key} </${tag}>`,
          ).toBe(1);
        }
      }
    },
  );

  it.each(files)(
    '%s never fills a tag and an argument of the same name in one message',
    (_locale, messages) => {
      for (const [key, value] of entries(messages)) {
        const clash = tagsOf(value).filter((tag) =>
          argumentsOf(value).includes(tag),
        );
        expect(clash, key).toEqual([]);
      }
    },
  );

  it.each(files)(
    '%s puts no dash inside a sentence (D-DASH)',
    (_locale, messages) => {
      for (const [key, value] of entries(messages)) {
        expect(value, key).not.toMatch(/[–—]/);
        expect(value, key).not.toMatch(/\s-\s/);
      }
    },
  );

  it.each(files)(
    '%s gives the cookie’s lifetime a plural with an `other` branch',
    (_locale, messages) => {
      const duration = new Map(entries(messages)).get('cookies.duration') ?? '';
      expect(duration).toMatch(/^\{months, plural, /);
      expect(duration).toMatch(/\bother \{# /);
    },
  );
});
