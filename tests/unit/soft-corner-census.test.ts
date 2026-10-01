import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// THE SOFT CORNER'S CENSUS (owner 2026-10-01, §15.28 — "i want that rounded
// corner effect that the doctor card from old webpage has … implemented in
// all mentioned parts"). The old site's card radius — `rounded-2xl`, 1rem —
// ships as ONE token, `--radius-soft`, worn by exactly four parts: ui/Card's
// `corners="soft"` row (sections/PersonnelCard asks for it, both kinds), the
// Header pill with NavMenu's panel, ui/TextButton's box and ui/Modal's box.
// §15.1's 6px default holds everywhere else — the services page's cards
// included, by the owner's taste (tried and reverted the same evening, the
// ASKERS note below). Two things can rot silently
// here, and this file is the machine for both (the aura-token census's shape
// for the value and the counts, the ink-faint census's src-wide sweep for the
// strays):
//   · THE VALUE — repaint one wearer's corner from a pasted `rounded-2xl`, or
//     move the token on another wearer's wish, and the four drift apart by a
//     class nobody diffs; the pixel net sees a 16px corner against a 12px one
//     only where a baseline exists and is looked at.
//   · THE WEARERS — a fifth part taking the soft corner "to match" is a
//     design decision (the owner named four); a wearer dropping it is a
//     regression. Both turn this file red until the lists below are edited.
// COMMENTS ARE STRIPPED FIRST: every wearer explains the corner in prose
// spelling the very utility matched below, so a matcher over raw text would
// stay green after the class itself was deleted. The negative case at the
// end proves the stripper strips.

const SRC_DIR = fileURLToPath(new URL('../../src', import.meta.url));

const read = (relative: string): string =>
  readFileSync(join(SRC_DIR, relative), 'utf8');

/** Block AND line comments out, whitespace collapsed (the aura census's
 * stripper, verbatim: `//` opens a comment only at a line start or after
 * whitespace, so a `https://…` inside a string literal survives). */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|\s)\/\/[^\n]*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The declaration, spelled out — an independent copy of what the token
 * layer must carry (the Eyebrow RECIPE convention). */
const DECLARATION = '--radius-soft: 1rem;';

/** The utilities Tailwind mints from it that the site wears: the whole
 * corner, and the bottom pair ui/Modal's body needs. The word boundary keeps
 * `rounded-b-soft` from counting as the first; ANY_FORM catches every other
 * side and corner form (`rounded-t-soft`, `rounded-ss-soft`) as a wear this
 * census has to be told about. */
const UTILITY = /\brounded-soft\b/g;
const BOTTOM_UTILITY = /\brounded-b-soft\b/g;
const ANY_FORM = /\brounded-(?:[a-z]{1,2}-)?soft\b/g;

const count = (source: string, form: RegExp): number =>
  (source.match(form) ?? []).length;

/** Every wearer, with its EXPECTED post-strip counts and the reason it is
 * one. Growing this list is a design decision — the owner named four parts —
 * never a paste: name the file AND the part, and record it in §15.28. */
const WEARERS: Readonly<
  Record<string, { whole: number; bottom: number; part: string }>
> = {
  'components/ui/Card/Card.tsx': {
    whole: 1,
    bottom: 0,
    part: 'the `soft` row of the corner axis (the personnel card asks for it)',
  },
  'components/ui/TextButton/TextButton.tsx': {
    whole: 1,
    bottom: 0,
    part: 'the TEXT button’s box — its focus ring today',
  },
  'components/sections/Header/Header.tsx': {
    whole: 1,
    bottom: 0,
    part: 'the top bar’s pill',
  },
  'components/sections/Header/NavMenu.tsx': {
    whole: 1,
    bottom: 0,
    part: 'the pill’s panel, matching it',
  },
  'components/ui/Modal/Modal.tsx': {
    whole: 1,
    bottom: 1,
    part: 'the contact dialog’s box, and the body that reaches its bottom edge',
  },
};

/** The sections that ASK ui/Card for the soft corner: the atom wears the
 * class, the section names the situation, so a new asker is a new wearer in
 * all but spelling. Each asks ONCE — two `<Card corners="soft">` in one
 * section would be two card kinds, and that is a row here, not a count. */
const ASKERS = [
  // The doctor and staff cards. The services page's menu and category cards
  // were askers for one evening (owner: "apply to all cards on services page
  // too") and are NOT any more (owner, the same evening: "i liked card from
  // before better for services. it looked perfect.") — a taste decision,
  // §15.28; adding them back is one word on each call site and one row here.
  'components/sections/PersonnelCard/PersonnelCard.tsx',
];
const ASK = /corners=(?:"soft"|\{'soft'\}|\{"soft"\})/g;

const sourceFiles = readdirSync(SRC_DIR, {
  recursive: true,
  encoding: 'utf8',
})
  .filter((name) => /\.(ts|tsx)$/.test(name))
  // Test and story files pin the classes as STRINGS on purpose, many times.
  .filter((name) => !/\.(test|stories)\.tsx?$/.test(name))
  .map((name) => name.replaceAll('\\', '/'))
  .sort();

describe('the soft corner — ONE token, four wearers (owner 2026-10-01, §15.28)', () => {
  const globals = code(read('styles/globals.css'));

  it('declares exactly 1rem inside @theme, where Tailwind mints rounded-soft from it', () => {
    expect(globals).toContain('@theme {');
    const theme = globals.slice(globals.indexOf('@theme {'));
    // Up to the first `}`: the token sits before the keyframes, like the aura
    // (aura-token.test.ts records why).
    expect(theme.slice(0, theme.indexOf('}'))).toContain(DECLARATION);
    expect(globals.split('--radius-soft:').length - 1).toBe(1);
  });

  it('scans a real tree (the census never passes vacuously)', () => {
    expect(sourceFiles.length).toBeGreaterThan(40);
    expect(sourceFiles).toEqual(
      expect.arrayContaining([...Object.keys(WEARERS), ...ASKERS]),
    );
  });

  it('is worn by EVERY wearer exactly its expected number of times, outside prose', () => {
    for (const [path, { whole, bottom, part }] of Object.entries(WEARERS)) {
      const stripped = code(read(path));
      expect(stripped, `${path}: the stripper ate the code`).toContain(
        'className',
      );
      expect(
        count(stripped, UTILITY),
        `${path} (${part}): rounded-soft ×${whole}`,
      ).toBe(whole);
      expect(
        count(stripped, BOTTOM_UTILITY),
        `${path} (${part}): rounded-b-soft ×${bottom}`,
      ).toBe(bottom);
    }
  });

  it('is worn NOWHERE else in src/ — a fifth part is a decision, not a paste', () => {
    const wearing = sourceFiles.filter(
      (name) => count(code(read(name)), ANY_FORM) > 0,
    );
    expect(wearing).toEqual(Object.keys(WEARERS).sort());
  });

  it('is asked of ui/Card by exactly the sections named here, once each', () => {
    const asking = sourceFiles.filter(
      (name) => count(code(read(name)), ASK) > 0,
    );
    expect(asking).toEqual([...ASKERS].sort());
    for (const path of ASKERS) {
      expect(count(code(read(path)), ASK), `${path}: asks once`).toBe(1);
    }
  });

  it('has teeth — the stripper strips, so a dropped wear is seen through the prose', () => {
    const header = read('components/sections/Header/Header.tsx');
    // The raw file names the utility in its decision record too…
    expect(count(header, UTILITY)).toBeGreaterThan(1);
    // …and with the ONE class gone the stripped count is zero, not "still
    // mentioned somewhere": the prose cannot keep a wearer green.
    const withoutClass = header.replace("'mt-4 rounded-soft ", "'mt-4 ");
    expect(withoutClass).not.toBe(header);
    expect(count(code(withoutClass), UTILITY)).toBe(0);
  });
});
