import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { localeHref } from '../../src/i18n/href';
import {
  fallbackLocale,
  LOCALE_COOKIE,
  locales,
  type Locale,
} from '../../src/i18n/locales';
import { matchLocale } from '../../src/i18n/match';

// THE DUAL-RUN FIXTURE — the machine half of a KEEP-IN-SYNC pair (§4 sharing
// table). One question, "which of our five locales does this visitor already
// read?", is answered by TWO implementations that cannot be merged:
//
//   · src/i18n/match.ts — a module, imported by the language-suggestion banner
//     and running in the visitor's browser after hydration;
//   · the `prefs` walk inside the <script> tools/generate-root-redirect.ts
//     emits into out/index.html — five lines of ES5 TEXT in a page that loads
//     no modules at all, because it runs before anything else exists.
//
// Extraction is impossible (one of them is a string), so the pair is held by
// pointer comments plus this file. Letting them drift would give one visitor
// two answers: a banner suggesting German where the root redirect would have
// sent them to English. So ONE fixture table is asserted against BOTH — the
// function directly, and the tool's script read out of its own source text and
// executed.
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
 * ANCHORED ON THE IIFE, not on the opening tag alone — a bug this lane hit
 * MID-BUILD: a draft of the tool's KEEP-IN-SYNC pointer spelled the tag in its
 * prose, and a `<script>`-to-`</script>` match happily started inside that
 * comment and handed `new Function` a paragraph of English. The SHIPPED
 * comment says "the inline script below" and never spells the tag, so the
 * plain match would work today — the anchor stays because any future prose
 * that spells it again would re-create the hazard without failing anything.
 * Requiring `(function` after the tag can only match the emitted one; if that
 * shape ever changes, the throw below names the pair instead of leaving a
 * syntax error to be puzzled over.
 */
const rawScript = (() => {
  const match = toolSource.match(/<script>(\s*\(function[\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error(
      'tools/generate-root-redirect.ts no longer emits a <script> this test can find — ' +
        'the KEEP-IN-SYNC pair with src/i18n/match.ts needs re-wiring, not deleting.',
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
    ['${fallbackLocale}', fallbackLocale],
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
 * Run the EMITTED script the way a browser runs it — three stubbed globals and
 * nothing else — and hand back every URL it tried to go to.
 *
 * `location.replace`, not `href`: the stub is a plain object, so the redirect
 * is a recorded call rather than a navigation. An array (not a `let`) so "it
 * redirected exactly once" is assertable, and so TypeScript keeps the value's
 * type across the closure boundary.
 */
function redirectsFor(prefs: readonly string[]): string[] {
  const replaced: string[] = [];
  const navigatorStub = { languages: prefs, language: prefs[0] ?? '' };
  // No cookie: the fixture is about the SECOND branch of the script, the one
  // this test's module twin implements. The #62 outside-in convention (a
  // 'NEXT_LOCALE' literal asserted from outside) deliberately does NOT apply
  // in this file — an empty jar carries no name to spell, and the script's own
  // copy arrives through the hole-fill, which must use the constant because it
  // reproduces the TOOL's recipe. The literal pins live where a value is
  // actually written: LanguageBanner.test.tsx's cookieFor and
  // LanguageSwitcher.test.tsx.
  const documentStub = { cookie: '' };
  const locationStub = {
    replace: (href: string) => {
      replaced.push(href);
    },
  };

  new Function('navigator', 'document', 'location', script)(
    navigatorStub,
    documentStub,
    locationStub,
  );

  return replaced;
}

/**
 * ONE TABLE, BOTH IMPLEMENTATIONS. Ranked lists exactly as a browser hands them
 * over (`navigator.languages`), with the cases the two rules must agree on:
 * exact tag · region subtag · ranking · casing · empty list · no match at all.
 */
const CASES: ReadonlyArray<readonly [readonly string[], Locale | null]> = [
  [['de'], 'de'],
  [['de-AT'], 'de'],
  // RANKED: Hungarian first, but we have no Hungarian — so the visitor is
  // offered the best of what we DO have, not the least of it.
  [['hu', 'ro'], 'ro'],
  // Casing is the browser's, not ours: some engines report 'DE-at'.
  [['DE-at'], 'de'],
  // THE DRIFT DETECTOR (G2 ts review, 2026-09-04 — probe-proven necessary):
  // every other row answers the same under `slice(0, 2)` and under the
  // "honest" `split('-')[0]`, so a rewrite of ONE side's arithmetic kept this
  // suite green. A 3-letter primary subtag is the input that tells the two
  // parses apart — North Frisian truncates to our 'fr' (the recorded
  // limitation in src/i18n/match.ts' header, here made load-bearing): both
  // implementations must keep OVER-matching it the same way, and the side
  // that drifts to a real parse goes red on this row first.
  [['frr'], 'fr'],
  [[], null],
  [['pl'], null],
  [['pt-BR'], null],
];

describe('the fixture is never vacuous', () => {
  it('extracted a real script out of the tool, with its own walk in it', () => {
    expect(rawScript.length).toBeGreaterThan(200);
    expect(rawScript).toContain('navigator.languages');
    expect(rawScript).toContain('location.replace');
    // THE ARITHMETIC THIS PAIR IS ABOUT, asserted verbatim — the alarm bell of
    // the KEEP-IN-SYNC pair. If the tool's walk is rewritten or reformatted,
    // this line fails and names the pair, instead of the suite quietly running
    // a fixture against a rule it no longer describes.
    expect(rawScript).toContain('.slice(0, 2).toLowerCase()');
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

describe('matchLocale and the emitted root script return ONE verdict', () => {
  it.each(CASES)('%j → %s', (prefs, expected) => {
    // ① the module, called directly.
    expect(matchLocale(prefs)).toBe(expected);

    // ② the shipped script, executed. Its verdict is not a return value — it is
    // the URL it sends the visitor to — so the table it indexes is what turns
    // one back into the other.
    const replaced = redirectsFor(prefs);
    expect(replaced).toHaveLength(1);
    expect(replaced[0]).toBe(localeHref(expected ?? fallbackLocale, '/'));
  });

  it('sends an unmatched visitor to the FALLBACK locale, and only from the root (D1)', () => {
    // The asymmetry this whole lane rests on. "/" is not a page, so the root
    // stub must land the visitor somewhere and does: fallbackLocale, English —
    // a visitor matching none of the five is by construction not
    // Romanian-reading (owner, 2026-09-02).
    expect(redirectsFor(['pl'])).toEqual([localeHref(fallbackLocale, '/')]);
    // The module has no such branch, and must not grow one: a DEEP link is an
    // address the visitor was given, and `null` there means the banner stays
    // silent (D3, src/i18n/match.ts' header).
    expect(matchLocale(['pl'])).toBeNull();
  });
});
