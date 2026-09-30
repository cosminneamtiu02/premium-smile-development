import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// THE `--ink-faint` CENSUS (doctor-pages lane, G2-R2 tier 1, a11y F1,
// 2026-09-26). The 19th semantic role — `--ink-faint` #766f69, the washed
// prose of the two doctor quotes (owner, round 2o: "what if you make the
// faint text lighter") — passes body text's 4.5:1 on white (4.94:1) and on
// the page ground (4.70:1) and FAILS it on the 30 % lilac tint (3.24:1). Its
// charter in globals.css and ui/Keyword's THREE LIMITS both say "never on the
// tint", and until this file nothing kept that promise but reading: the two
// consumer suites (PersonnelCard.test.tsx, CredoCard.test.tsx) pin the class
// on their own element and know nothing about a third wearer. The scenario
// this closes: a later lane puts `text-ink-faint` on a paragraph inside
// sections/TintedBand for the same washed look — body text at 3.24:1 on the
// export, and the only automated line before merge would be a per-story axe
// run over a `color-mix()` ground nobody has verified axe resolves.
//
// So this is the tests/unit/card-single-spelling.test.ts machine pointed at
// an INK: every wearer of the utility is named below with the ground it sits
// on, and a new one turns this file red until it is added here — with its
// ground, which is the whole point. Test and story files are outside the
// census on purpose (they pin the class as a STRING, on purpose, many times).
//
// COMMENTS ARE STRIPPED FIRST (the aura census's lesson): the wearers' own
// headers EXPLAIN the ink in prose containing the very spelling matched
// below, so a matcher over raw text would stay green after the class itself
// was deleted. The negative case in the last `it` proves the stripper strips.

const SRC_DIR = fileURLToPath(new URL('../../src', import.meta.url));

/** The one utility the role mints (`--color-ink-faint` in `@theme inline`). */
const UTILITY = 'text-ink-faint';

/**
 * Every wearer, with its ground — WHITE, never the tint. Growing this list is
 * a deliberate act: name the file AND the ground the ink sits on, and measure
 * (4.5:1 for body text) before the row goes in.
 */
const WEARERS: Readonly<Record<string, { count: number; ground: string }>> = {
  // The doctor card's <blockquote> — ui/Card `framed` since 2026-09-30 (the
  // owner: "the border of the non current review"), `surface` before it; white
  // either way (PersonnelCard D8, D17 + round 2o).
  'components/sections/PersonnelCard/PersonnelCard.tsx': {
    count: 1,
    ground: 'bg-surface',
  },
  // The credo card's <p> — ui/Card `framed`, white (DoctorIntro D12 + round 2o).
  'components/sections/DoctorIntro/CredoCard.tsx': {
    count: 1,
    ground: 'bg-surface',
  },
  // ui/Ribbon's stand-in doctor card — the doctor card's <blockquote>, stood
  // in for the stories and tests on the same white `bg-surface` (§15.26), so
  // the owner judges the card's own picture under the ribbon.
  'components/ui/Ribbon/Ribbon.fixtures.tsx': {
    count: 1,
    ground: 'bg-surface',
  },
};

/** Line and block comments out; strings and code stay. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

const sourceFiles = readdirSync(SRC_DIR, { recursive: true, encoding: 'utf8' })
  .filter((file) => /\.(ts|tsx|css)$/.test(file))
  .filter((file) => !/\.(test|stories)\.tsx?$/.test(file))
  .map((file) => file.replaceAll('\\', '/'));

describe('the `--ink-faint` ink has exactly its named wearers in src/ (G2-R2 a11y F1)', () => {
  it('is worn by the two doctor quotes and the ribbon’s stand-in, each once, on a white ground', () => {
    for (const [file, wearer] of Object.entries(WEARERS)) {
      const source = stripComments(readFileSync(join(SRC_DIR, file), 'utf8'));
      expect(count(source, UTILITY), file).toBe(wearer.count);
      // The ground travels with the wearer: the same file must still put the
      // quote on a surface, never on the tint.
      expect(source, `${file} ground ${wearer.ground}`).not.toContain('--tint');
    }
  });

  it('is worn nowhere else — a third wearer names itself and its ground here first', () => {
    const strangers = sourceFiles.filter((file) => {
      if (file in WEARERS) return false;
      const source = stripComments(readFileSync(join(SRC_DIR, file), 'utf8'));
      return count(source, UTILITY) > 0;
    });
    expect(strangers).toEqual([]);
  });

  it('never appears inside sections/TintedBand or the bands that compose it', () => {
    // The scenario this census exists for, spelled out: the lilac ground is
    // exactly where the ink fails 4.5:1 (3.24:1, measured).
    const tinted = [
      'components/sections/TintedBand/TintedBand.tsx',
      'components/sections/DoctorProfile/DoctorProfile.tsx',
      'components/sections/DoctorProfile/ScheduleCard.tsx',
      'components/sections/DoctorStats/DoctorStats.tsx',
    ];
    for (const file of tinted) {
      const source = stripComments(readFileSync(join(SRC_DIR, file), 'utf8'));
      expect(count(source, UTILITY), file).toBe(0);
    }
  });

  it('strips the prose mention, so the count is the class and not the comment', () => {
    // A guard that cannot fail is not a guard: the wearers' headers mention
    // the spelling in prose, and the raw text must therefore count MORE than
    // the stripped text does.
    const raw = readFileSync(
      join(SRC_DIR, 'components/sections/DoctorIntro/CredoCard.tsx'),
      'utf8',
    );
    expect(count(raw, UTILITY)).toBeGreaterThan(
      count(stripComments(raw), UTILITY),
    );
    expect(stripComments('a // text-ink-faint\n/* text-ink-faint */ b')).toBe(
      'a \n b',
    );
  });
});
