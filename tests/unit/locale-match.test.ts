import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { localeHref } from '../../src/i18n/href';
import {
  defaultLocale,
  LOCALE_COOKIE,
  locales,
  type Locale,
} from '../../src/i18n/locales';
import { matchLocale } from '../../src/i18n/match';

// THE TWO i18n FRONT DOORS, each pinned to its own contract. Until 2026-09-06
// this file was the machine half of a KEEP-IN-SYNC pair: one preference walk
// implemented twice (src/i18n/match.ts as a module, the root stub's <script>
// as ES5 text), one fixture table run through both. The owner's root-first
// decision (2026-09-06, superseding D1/#67) dissolved the pair by deleting one
// of the two answers — the stub no longer walks `navigator.languages` at all —
// so the file now holds two SEPARATE contracts:
//
//   · src/i18n/match.ts — the ONLY implementation of the walk left, imported
//     by sections/LanguageBanner (§8.6), which OFFERS a language and never
//     redirects. Its fixture table is unchanged from the pair era.
//   · the <script> tools/generate-root-redirect.ts emits into out/index.html —
//     shrunk to one question: a valid §8.7 cookie → that locale, anything
//     else → defaultLocale. Asserted below by executing the emitted text with
//     stubbed globals, plus the negative that matters most: the text never
//     references `navigator` again.
//
// ── WHY THE TOOL IS READ, NEVER IMPORTED. tools/generate-root-redirect.ts runs
// at module scope: it looks for out/, and calls process.exit(1) when the
// directory is missing. Importing it here would end the test run. Reading it as
// TEXT is also the more honest test — what ships to a visitor IS text, and this
// is that text, filled with the same values the tool fills it with.
//
// ── WHY IN tests/unit/ AND NOT BESIDE THE MODULE: node only (readFileSync,
// `new Function`) and no DOM, which is where locales.test.ts, href.test.ts and
// the parity gate already live.

const TOOL_PATH = fileURLToPath(
  new URL('../../tools/generate-root-redirect.ts', import.meta.url),
);
const toolSource = readFileSync(TOOL_PATH, 'utf8');

/**
 * The emitted script's body exactly as it sits in the tool's `html` template —
 * holes and template-literal escapes still in it.
 *
 * ANCHORED ON THE IIFE, not on the opening tag alone — a bug the banner lane
 * hit MID-BUILD: a draft of a tool comment spelled the tag in its prose, and a
 * `<script>`-to-`</script>` match happily started inside that comment and
 * handed `new Function` a paragraph of English. The SHIPPED comments never
 * spell the tag, so the plain match would work today — the anchor stays
 * because any future prose that spells it again would re-create the hazard
 * without failing anything. Requiring `(function` after the tag can only match
 * the emitted one; if that shape ever changes, the throw below names this
 * suite instead of leaving a syntax error to be puzzled over.
 */
const rawScript = (() => {
  const match = toolSource.match(/<script>(\s*\(function[\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error(
      'tools/generate-root-redirect.ts no longer emits a <script> this test can find — ' +
        "the stub's contract suite here needs re-wiring, not deleting.",
    );
  }
  return match[1];
})();

/**
 * The `${…}` holes, each paired with the value the TOOL puts there. Written out
 * rather than evaluated: this file may not import the tool, so the only honest
 * way to fill a hole is to reproduce the expression beside the text that
 * contains it — which is also what makes a change to either side visible here.
 *
 * `hrefs` is the tool's own line: one entry per locale, built by localeHref, so
 * the visitor's browser performs no URL arithmetic of its own (org review D12).
 */
let hrefs: Record<string, string>;
let script: string;
let holes: ReadonlyArray<readonly [string, string]>;

beforeAll(() => {
  // Cleared for the same reason href.test.ts clears it: a developer who had
  // exported PAGES_BASE_PATH for a Pages-shaped local build would otherwise see
  // this suite assert about a machine's environment rather than about the code
  // (G2 review D4). Both sides read it at call time, so one place is enough.
  vi.stubEnv('PAGES_BASE_PATH', undefined);

  hrefs = Object.fromEntries(
    locales.map((locale): [string, string] => [
      locale,
      localeHref(locale, '/'),
    ]),
  );
  holes = [
    ['${JSON.stringify(hrefs)}', JSON.stringify(hrefs)],
    ['${JSON.stringify([...locales])}', JSON.stringify([...locales])],
    ['${LOCALE_COOKIE}', LOCALE_COOKIE],
    ['${defaultLocale}', defaultLocale],
  ];

  script = holes.reduce(
    (text, [hole, value]) => text.replaceAll(hole, value),
    // The one template-literal escape in the emitted script: the source text
    // reads `\\s` and the evaluated template hands the browser `\s`. Without
    // this the cookie pattern below would look for a literal backslash.
    rawScript.replaceAll('\\\\', '\\'),
  );
});

afterAll(() => {
  vi.unstubAllEnvs();
});

/**
 * Run the EMITTED script the way a browser runs it — two stubbed globals and
 * nothing else — and hand back every URL it tried to go to.
 *
 * `location.replace`, not `href`: the stub is a plain object, so the redirect
 * is a recorded call rather than a navigation. An array (not a `let`) so "it
 * redirected exactly once" is assertable, and so TypeScript keeps the value's
 * type across the closure boundary.
 *
 * `navigator` is deliberately NOT a parameter — but its absence here proves
 * nothing on its own, because Node ≥21.2 ships a global `navigator` with
 * `language`/`languages`: a leftover reference in the script would quietly
 * read the test machine's own browser identity instead of throwing. The real
 * guard is the TEXT assertion at the bottom of the contract suite.
 *
 * The #62 outside-in convention (a 'NEXT_LOCALE' literal asserted from
 * outside) deliberately does NOT apply in this file — the cookie strings below
 * are built from the constant because they reproduce what the TOOL emits,
 * which interpolates that same constant. The literal pins live where a value
 * is actually written: LanguageBanner.test.tsx's cookieFor and
 * LanguageSwitcher.test.tsx.
 */
function redirectsFor(cookie: string): string[] {
  const replaced: string[] = [];
  const documentStub = { cookie };
  const locationStub = {
    replace: (href: string) => {
      replaced.push(href);
    },
  };

  new Function('document', 'location', script)(documentStub, locationStub);

  return replaced;
}

/**
 * THE MODULE'S TABLE — sections/LanguageBanner's question, unchanged from the
 * pair era. Ranked lists exactly as a browser hands them over
 * (`navigator.languages`), with the cases that define the walk: exact tag ·
 * region subtag · ranking · casing · empty list · no match at all.
 */
const CASES: ReadonlyArray<readonly [readonly string[], Locale | null]> = [
  [['de'], 'de'],
  [['de-AT'], 'de'],
  // RANKED: Hungarian first, but we have no Hungarian — so the visitor is
  // offered the best of what we DO have, not the least of it.
  [['hu', 'ro'], 'ro'],
  // Casing is the browser's, not ours: some engines report 'DE-at'.
  [['DE-at'], 'de'],
  // THE TRUNCATION PIN (G2 ts review, 2026-09-04 — probe-proven necessary):
  // every other row answers the same under `slice(0, 2)` and under the
  // "honest" `split('-')[0]`, so a rewrite of the arithmetic would keep this
  // suite green without it. A 3-letter primary subtag is the input that tells
  // the two parses apart — North Frisian truncates to our 'fr' (the recorded
  // limitation in src/i18n/match.ts' header, here made load-bearing). A drift
  // to a real parse goes red on this row first.
  [['frr'], 'fr'],
  [[], null],
  // `null` is an ORDINARY answer, not a failure (D3): the banner says nothing,
  // and the module must never grow a fallback — a deep link is already
  // somewhere.
  [['pl'], null],
  [['pt-BR'], null],
];

describe('the fixture is never vacuous', () => {
  it('extracted a real script out of the tool, with the cookie read in it', () => {
    expect(rawScript.length).toBeGreaterThan(200);
    expect(rawScript).toContain('document.cookie');
    expect(rawScript).toContain('location.replace');
  });

  it('filled every hole and resolved the template escapes', () => {
    // Each hole must EXIST before it can be filled: a renamed variable in the
    // tool would otherwise leave a `${…}` behind, `new Function` would throw a
    // syntax error, and the reason would be a mystery.
    for (const [hole] of holes) expect(rawScript).toContain(hole);
    expect(script).not.toContain('${');
    // The escape really was resolved — `\\s` in the source, `\s` in the script.
    expect(rawScript).toContain('\\\\s*');
    expect(script).toContain('(?:^|;\\s*)');
    // And every locale's href is in the table the script indexes into.
    for (const locale of locales) expect(script).toContain(hrefs[locale]);
  });
});

describe('matchLocale — the banner walk, the only implementation left', () => {
  it.each(CASES)('%j → %s', (prefs, expected) => {
    expect(matchLocale(prefs)).toBe(expected);
  });
});

describe('the emitted root script — a valid cookie, else defaultLocale', () => {
  // The whole contract (owner, 2026-09-06 — root Romanian-first): the stub
  // asks ONE question, the §8.7 cookie the visitor set by explicit click.
  // Auto-detection is the §8.6 banner's job, ON the page the visitor landed
  // on — never this redirect's.

  it.each([...locales])(
    'cookie %s → that locale, exactly one replace',
    (locale) => {
      expect(redirectsFor(`${LOCALE_COOKIE}=${locale}`)).toEqual([
        localeHref(locale, '/'),
      ]);
    },
  );

  it('finds the cookie among other cookies (the (?:^|;\\s*) prefix)', () => {
    expect(redirectsFor(`foo=1; ${LOCALE_COOKIE}=it; bar=2`)).toEqual([
      localeHref('it', '/'),
    ]);
  });

  it('a substring cookie name is not ours (the prefix discriminates)', () => {
    // Probe-proven load-bearing (G2 ts review, 2026-09-06): a prefix-less
    // regex would read a MY_-prefixed jar entry and send this visitor to
    // /de/; the shipped (?:^|;\s*) falls through to defaultLocale instead.
    expect(redirectsFor(`MY_${LOCALE_COOKIE}=de`)).toEqual([
      localeHref(defaultLocale, '/'),
    ]);
  });

  it('no cookie → defaultLocale', () => {
    expect(redirectsFor('')).toEqual([localeHref(defaultLocale, '/')]);
  });

  it('a well-formed value outside the manifest → defaultLocale', () => {
    // 'xx' passes the regex ([a-z]{2}) and fails the locales.indexOf validity
    // check — the branch that keeps a hand-edited cookie from indexing hrefs
    // at undefined and replacing to a broken URL.
    expect(redirectsFor(`${LOCALE_COOKIE}=xx`)).toEqual([
      localeHref(defaultLocale, '/'),
    ]);
  });

  it('casing is not forgiven → defaultLocale', () => {
    // The regex is [a-z]{2} on purpose: setLocaleCookie only ever writes
    // manifest values, so anything else is not ours and falls through.
    expect(redirectsFor(`${LOCALE_COOKIE}=DE`)).toEqual([
      localeHref(defaultLocale, '/'),
    ]);
  });

  it('never consults the browser language — the walk left this script (2026-09-06)', () => {
    // On the TEXT, both raw and filled, per the header note: Node's own global
    // `navigator` would absorb a leftover reference at runtime without a
    // trace, so only the source can prove the walk is gone.
    expect(rawScript).not.toMatch(/navigator/);
    expect(script).not.toMatch(/navigator/);
  });
});
