import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// THE RIBBON WEARS THE LILAC BAND'S GROUND (CLAUDE.md §15.26 round 6 — the
// owner, 2026-10-02, with a screenshot of that ground: "i want it on every
// screen to be the shade that the background of "IN NUMBERS …" is"). The
// band's ground is a MIX — sections/TintedBand's `--tint`, --accent-decorative
// at a share over transparent, laid on the page ground — while globals.css's
// `--ribbon` is a LITERAL, because lib/ribbon-draw reads its colour through a
// canvas round-trip that answers #rrggbb (its THE COLOURS). Two spellings of
// one colour, and this is their KEEP-IN-SYNC pin: it reads the share out of
// TintedBand's own class and both tokens out of globals.css, mixes them as
// the browser composites them — per channel, in sRGB, rounded to a level —
// and must find `--ribbon`. So the day §15.1's hue confirm moves
// --accent-decorative, or the band's share moves, this test names the
// ribbon's new value. (The owner's screenshot measured that ground at
// rgb(212 207 220), every one of its 30 400 pixels.)
//
// …AND WHO READS IT IN CSS (G2 typescript M2, react and a11y LOW, 2026-10-17
// — the blog-article lane's review). The token's record in globals.css says
// TWO CSS READERS since 2026-10-14, "Decorations, never ink": the
// conclusion's quote mark (sections/PostConclusion) and THE LINE it shares
// with sections/BeforeAfter — three spellings in two files. The colour reads
// 1.45:1 on the page ground and 1.53:1 on white, a decoration's colour that
// carries nothing, so a third file painting TEXT with it would print words
// nobody can read — and until this census nothing would have noticed:
// tests/unit/article-line-sync.test.ts reads the line's two named constants,
// never the tree. The second `describe` below reads every shipped file in
// src/ (comments stripped — the accent census's three steps; test and story
// files out, they pin the classes as strings, on purpose) for a CSS read of
// the variable — Tailwind's parenthesised shorthand, with or without a type
// hint, or a `var()`, with or without a fallback — and finds exactly the two
// files, each as many times as named; and it holds the record's other half:
// `@theme inline` mints no utility for either ribbon colour. lib/ribbon-draw,
// the token's owner, reads it from a script (`getPropertyValue`), which is no
// CSS read. HERE, not in the line's test: the census is about the TOKEN — the
// value its readers follow, held above — and the quote mark is no part of the
// line.

const REPO = new URL('../../', import.meta.url);
const read = (file: string) => readFileSync(new URL(file, REPO), 'utf8');
const globals = read('src/styles/globals.css');
const band = read('src/components/sections/TintedBand/TintedBand.tsx');

/** A colour token's value as globals.css declares it — exactly once. */
function token(name: string): string {
  const found = [
    ...globals.matchAll(new RegExp(`^\\s*${name}:\\s*([^;]+);`, 'gm')),
  ];
  expect(found, `${name} is declared once`).toHaveLength(1);
  return found[0][1].trim();
}

/** `#rrggbb` → its three channels, 0 … 255. */
function channels(hex: string): readonly number[] {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (match === null) throw new Error(`“${hex}” is not #rrggbb`);
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

describe('--ribbon is the lilac band’s ground (KEEP IN SYNC with sections/TintedBand)', () => {
  it('mixes --accent-decorative over --page at the band’s own share — and finds --ribbon', () => {
    const tint =
      /\[--tint:color-mix\(in_srgb,var\(--color-accent-decorative\)_(\d+)%,transparent\)\]/.exec(
        band,
      );
    if (tint === null) {
      throw new Error(
        'sections/TintedBand no longer mixes its --tint from --color-accent-decorative over transparent — re-derive --ribbon from what it does now',
      );
    }
    const share = Number(tint[1]) / 100;
    expect(share).toBe(0.3);
    const accent = channels(token('--accent-decorative'));
    const page = channels(token('--page'));
    const ground = accent.map((value, i) =>
      Math.round(share * value + (1 - share) * page[i]),
    );
    expect(channels(token('--ribbon'))).toEqual(ground);
  });

  it('reads each token by its whole name — the ribbon’s colour is never its shadow’s', () => {
    // The reader anchors `--ribbon:` at a declaration's start: the shadow's
    // token, which begins with the same nine characters, is its own.
    expect(channels(token('--ribbon-shadow'))).toEqual([45, 38, 60]);
    expect(token('--ribbon')).not.toBe(token('--ribbon-shadow'));
  });
});

/**
 * Every file that reads `--ribbon` in CSS, and how many times — the two
 * decorations of the blog article (CLAUDE.md §15.39 round 4), both
 * `aria-hidden`. A third reader names itself, what it paints and why that is
 * a decoration here first.
 */
const RIBBON_READERS: Readonly<Record<string, number>> = {
  // THE LINE between the two pictures — its ground, horizontal while they
  // stack and vertical side by side.
  'components/sections/BeforeAfter/BeforeAfter.tsx': 1,
  // THE LINE down the left of the doctor's closing words (its ground) and the
  // quote mark's ink, the QuoteMark glyph.
  'components/sections/PostConclusion/PostConclusion.tsx': 2,
};

/**
 * A CSS read of `--ribbon`: Tailwind's parenthesised shorthand, with or
 * without a type hint, or a `var()`, with or without a fallback — never of
 * `--ribbon-shadow`, `--ribbon-unit` or the lanes, which the name refuses.
 */
const READS_RIBBON = /\((?:[a-z-]+:)?--ribbon(?![\w-])/g;

const readings = (source: string) => source.match(READS_RIBBON)?.length ?? 0;

// Line and block comments out; strings and code stay — the accent census's
// three steps, KEEP-IN-SYNC with tests/unit/accent-census.test.ts: full-line
// line comments FIRST (one that names a glob, src/messages/*.json, would
// otherwise open a block and hide real code up to the next closer), then the
// blocks, then the line comments that trail code. Its limit, as the ink-faint
// census records: a block opener inside a TRAILING line comment or a string
// still hides what follows — none of the shipped files has one.
function stripComments(source: string): string {
  return source
    .replace(/^[ \t]*\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

const sourceFiles = readdirSync(fileURLToPath(new URL('src/', REPO)), {
  recursive: true,
  encoding: 'utf8',
})
  .filter((file) => /\.(ts|tsx|css)$/.test(file))
  .filter((file) => !/\.(test|stories)\.tsx?$/.test(file))
  .map((file) => file.replaceAll('\\', '/'));

describe('--ribbon has exactly its two named CSS readers in src/ — decorations, never ink (G2, 2026-10-17)', () => {
  it('is read by the before/after and the conclusion only, each as many times as named — and no theme utility mints it', () => {
    const found = Object.fromEntries(
      sourceFiles
        .map(
          (file) =>
            [file, readings(stripComments(read(`src/${file}`)))] as const,
        )
        .filter(([, count]) => count !== 0),
    );
    expect(found).toEqual(RIBBON_READERS);
    // The record's other half: `@theme inline` names neither ribbon colour,
    // so no `text-…` or `bg-…` class can paint with one by its name.
    expect(
      stripComments(globals),
      'globals.css mints a utility for a ribbon colour',
    ).not.toMatch(/--color-ribbon/);
  });

  it('has teeth — every CSS form is one reading, the siblings and a script’s read none, and a glob in a comment hides nothing', () => {
    // Spellings no shipped file wears are built from two halves: this file
    // is scanned by Tailwind, and written whole each would ship a rule.
    for (const reading of [
      'text-(--ribbon)',
      'bg-(--ribbon)',
      'bg-(color:' + '--ribbon)',
      'fill-[var(--' + 'ribbon)]',
      'color: var(--' + 'ribbon, #000);',
    ]) {
      expect(readings(reading), reading).toBe(1);
    }
    expect(
      readings(
        "var(--ribbon-shadow) var(--ribbon-unit) --ribbon: #d4cfdc; getPropertyValue('--ribbon')",
      ),
    ).toBe(0);
    expect(
      readings(
        stripComments(
          "// src/messages/*.json\nconst stray = 'text-(--ribbon)';\n/* x */",
        ),
      ),
    ).toBe(1);
  });
});
