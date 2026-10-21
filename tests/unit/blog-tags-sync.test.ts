import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// THE BLOG'S TAGS — ONE placement and ONE chip pixel in two sections
// (KEEP-IN-SYNC, CLAUDE.md §4's second sharing row: values that must agree
// while the files stay independent). The owner, verbatim (2026-10-15):
// "reuse all component from it that have been patched on the other branch" —
// the blog-cards lane (#166), which put each post's categories over its
// card's picture as ui/PillButton TAGS and drew them in a design pixel of the
// card's own. sections/PostCard wears them on the blog's list; the article
// page's cover, sections/PostCover, wears the same ones over its big picture.
// A section never imports another section's internals (§4), so the two files
// spell the same strings, and this test holds what must agree:
//   · TAGS — the placement over the picture's top-right corner, BYTE-EQUAL;
//   · CHIP_SCALE — the card's chip pixel, `--scale-px` declared as the larger
//     of a 12px label's floor and the box's width over the owner's reference,
//     and `design-scale` beside it, both behind the container-units guard.
//     The cover wears the card's formula VERBATIM inside one more term, a cap
//     at the page's own pixel (`min(var(CAP), FORMULA)` — PostCover's THE
//     TAGS: uncapped, the cover's width would draw 94.8px chips at the
//     owner's 1401 window), the same guard on both tokens, and the cap it
//     reads is the one its picture's box captures (TAGS_CAP).
// What the engine makes of the strings is each section's own suite:
// PostCard.test.tsx and PostCover.scale.test.tsx measure the chips.
// THE D-LIT RULE (tests/unit/design-scale.test.ts): Tailwind reads tests too,
// so no bracketed declaration of the design pixel is written here whole — its
// pieces are assembled from parts — and every broken sample below is the
// REAL string, broken at run time, never a class-shaped literal (a literal
// would ship a rule nobody wears).

const SRC = fileURLToPath(new URL('../../src/', import.meta.url));
const CARD = 'components/sections/PostCard/PostCard.tsx';
const COVER = 'components/sections/PostCover/PostCover.tsx';

/** TS without its comments, in ONE left-to-right pass — the design-scale
 *  census's `tsCode` (string literals stepped over whole, a `//` comment
 *  consumed before a `/*` inside it can open a block): both files explain
 *  these strings in prose that names every token counted below. */
const tsCode = (source: string): string =>
  source.replace(
    /('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|(?<=^|\s)\/\/[^\n]*/gm,
    (match: string, literal: string | undefined) => literal ?? ' ',
  );

/** A file's code, by its path under src/. */
const codeOf = (file: string): string =>
  tsCode(readFileSync(`${SRC}${file}`, 'utf8'));

/** A `const NAME = '…' (+ '…')*;` of a source — its string literals joined,
 *  as the browser gets them. Throws by name when the constant is gone. */
function constantOf(code: string, file: string, name: string): string {
  const match = new RegExp(`\\bconst ${name} =([^;]*);`).exec(code);
  if (match === null) throw new Error(`${file}: no \`const ${name} = …\``);
  const literals = [...(match[1] ?? '').matchAll(/'([^']*)'/g)];
  if (literals.length === 0) {
    throw new Error(`${file}: ${name} is no string literal`);
  }
  return literals.map((literal) => literal[1]).join('');
}

/** The pieces, never one literal (THE D-LIT RULE above). */
const PIXEL = '--scale-px';
const GUARD = 'supports-[width:1cqw]:';
const REMAP = 'design-scale';
const OPEN = '[';

/** The formula a card's pixel declaration carries — the value between
 *  `${OPEN}${PIXEL}:` and the closing bracket — or null. */
const declaredValue = (token: string): string | null => {
  const head = `${GUARD}${OPEN}${PIXEL}:`;
  return token.startsWith(head) && token.endsWith(']')
    ? token.slice(head.length, -1)
    : null;
};

/** THE CARD'S FORMULA, its one shape: the larger of the floor — N rem over D
 *  — and the box's width over the reference. */
const FORMULA =
  /^max\(calc\(\d+(?:\.\d+)?rem\/\d+\),calc\(100cqw\/\d+(?:\.\d+)?\)\)$/;

/** The cover's cap around it: `min(var(<name>),<formula>)`. */
const CAPPED = /^min\(var\((--[\w-]+)\),(.+)\)$/;

type Sources = {
  cardTags: string;
  coverTags: string;
  cardScale: string;
  coverScale: string;
  coverCap: string;
};

/**
 * EVERYTHING THAT MUST AGREE, as words — empty when it holds. A function of
 * the five strings, so the teeth below can feed it broken copies without
 * touching either source.
 */
function problems(sources: Sources): string[] {
  const found: string[] = [];
  if (sources.coverTags !== sources.cardTags) {
    found.push(
      `TAGS differ: card “${sources.cardTags}”, cover “${sources.coverTags}”`,
    );
  }
  const tokensOf = (classes: string): string[] =>
    classes.split(/\s+/).filter(Boolean);
  /** Exactly two tokens, each behind the guard: the declaration, then the
   *  remap — and the declaration's value. */
  const scaleOf = (who: string, classes: string): string | null => {
    const tokens = tokensOf(classes);
    if (tokens.length !== 2) {
      found.push(
        `${who}: ${tokens.length} tokens, not the declaration and the remap`,
      );
    }
    const value = declaredValue(tokens[0] ?? '');
    if (value === null) {
      found.push(
        `${who}: no guarded pixel declaration first — “${tokens[0] ?? ''}”`,
      );
    }
    if (tokens[1] !== `${GUARD}${REMAP}`) {
      found.push(
        `${who}: no guarded ${REMAP} beside it — “${tokens[1] ?? ''}”`,
      );
    }
    return value;
  };
  const card = scaleOf('the card', sources.cardScale);
  const cover = scaleOf('the cover', sources.coverScale);
  if (card !== null && !FORMULA.test(card)) {
    found.push(`the card's formula moved: “${card}”`);
  }
  if (cover !== null) {
    const capped = CAPPED.exec(cover);
    if (capped === null) {
      found.push(`the cover's pixel is not capped: “${cover}”`);
    } else {
      if (capped[2] !== card) {
        found.push(
          `the cover's formula is not the card's: “${capped[2] ?? ''}” against “${card ?? ''}”`,
        );
      }
      const set = /^\[(--[\w-]+):[^\]]+\]$/.exec(sources.coverCap)?.[1];
      if (set !== capped[1]) {
        found.push(
          `the cover reads the cap ${capped[1] ?? ''}, its picture sets ${set ?? 'nothing'}`,
        );
      }
    }
  }
  return found;
}

const card = codeOf(CARD);
const cover = codeOf(COVER);
const real: Sources = {
  cardTags: constantOf(card, CARD, 'TAGS'),
  coverTags: constantOf(cover, COVER, 'TAGS'),
  cardScale: constantOf(card, CARD, 'CHIP_SCALE'),
  coverScale: constantOf(cover, COVER, 'CHIP_SCALE'),
  coverCap: constantOf(cover, COVER, 'TAGS_CAP'),
};

describe('THE BLOG’S TAGS — the article’s cover wears the card’s, KEEP-IN-SYNC', () => {
  it('reads both sources (never vacuous): the card’s placement, its pixel’s floor and reference, the cover’s cap', () => {
    expect(real.cardTags).toBe(
      'absolute start-3 end-3 top-3 flex flex-row-reverse flex-wrap gap-3',
    );
    const formula = declaredValue(real.cardScale.split(/\s+/)[0] ?? '');
    expect(formula).toBe('max(calc(0.75rem/18),calc(100cqw/513.40625))');
    expect(real.coverCap.startsWith(`${OPEN}--tags-cap:`)).toBe(true);
  });

  it('holds the placement BYTE-EQUAL, and the cover’s chip pixel the card’s formula verbatim inside its cap — the same guard on both tokens, `design-scale` beside', () => {
    expect(problems(real)).toEqual([]);
  });

  it('applies both where the card does — the placement and the pixel on the tag list, the cover’s cap on the list’s own parent', () => {
    // The card: `className={cx(TAGS, CHIP_SCALE)}` on its <ul>.
    expect(card).toMatch(/<ul\b[^>]*className=\{cx\(TAGS, CHIP_SCALE\)\}/);
    // The cover: the same on its <ul>, inside the picture's box, which wears
    // the cap — read ABOVE the list, which re-declares the pixel.
    expect(cover).toMatch(
      /<div className=\{cx\(PICTURE, TAGS_CAP\)\}>(?:(?!<\/div>)[\s\S])*<ul\b[^>]*className=\{cx\(TAGS, CHIP_SCALE\)\}/,
    );
    // The cap named twice in the cover's code — set once, read once — and
    // nowhere in the card.
    expect(cover.split('--tags-cap').length - 1).toBe(2);
    expect(card).not.toContain('--tags-cap');
  });

  it('has teeth — a moved placement, another formula, an uncapped or unguarded pixel, a missing remap and a cap read by another name are each named', () => {
    const cases: [string, Partial<Sources>, string][] = [
      [
        'the placement',
        { coverTags: real.coverTags.replace('gap-3', `gap-${2}`) },
        'TAGS differ',
      ],
      [
        'another reference',
        { coverScale: real.coverScale.replace('513.40625', '500') },
        "the cover's formula is not the card's",
      ],
      [
        'no floor',
        {
          coverScale: real.coverScale.replace(
            /max\(calc\([^)]*\),(calc\(100cqw\/[\d.]+\))\)/,
            '$1',
          ),
        },
        "the cover's formula is not the card's",
      ],
      [
        'uncapped',
        {
          coverScale: real.coverScale.replace(
            /min\(var\(--[\w-]+\),(.+)\)\]/,
            '$1]',
          ),
        },
        "the cover's pixel is not capped",
      ],
      [
        'the remap unguarded',
        { coverScale: real.coverScale.replace(`${GUARD}${REMAP}`, REMAP) },
        `the cover: no guarded ${REMAP} beside it`,
      ],
      [
        'the declaration unguarded',
        {
          coverScale: real.coverScale.replace(`${GUARD}${OPEN}`, OPEN),
        },
        'the cover: no guarded pixel declaration first',
      ],
      [
        'no remap',
        { coverScale: real.coverScale.split(/\s+/)[0] ?? '' },
        'the cover: 1 tokens',
      ],
      [
        'a cap by another name',
        { coverCap: real.coverCap.replace('--tags-cap', '--chips-cap') },
        'the cover reads the cap --tags-cap, its picture sets --chips-cap',
      ],
      [
        'the card’s formula moved alone',
        { cardScale: real.cardScale.replace('513.40625', '500') },
        "the cover's formula is not the card's",
      ],
    ];
    for (const [name, broken, expected] of cases) {
      const found = problems({ ...real, ...broken });
      expect(
        found.some((problem) => problem.startsWith(expected)),
        `${name}: ${found.join(' | ') || 'nothing found'}`,
      ).toBe(true);
    }
  });
});
