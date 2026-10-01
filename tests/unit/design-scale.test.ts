import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { UNIT_PX } from '../../src/lib/ribbon-model/ribbon-model.ts';

// THE DESIGN SCALE'S CENSUS (owner, 2026-10-01 — "i want card and component
// and all contents to adjust in size harmonically all at once and mentain
// raports as on following sizes: 1401x1063"; CLAUDE.md §15.25 round 2).
// globals.css's `@utility design-scale` redraws every theme LENGTH of the box
// that wears it in one design pixel, `--scale-px`, by REMAPPING Tailwind's
// own variables — one line per step, `calc(var(--scale-px) * N)` — and
// sections/DoctorShowcase wears it behind its three GATES (its D10): the
// `scalable` variant — a mouse or trackpad, in an engine that registers
// custom properties — and a column of max(56rem, 896px). Four things can rot
// silently there, and this file is the machine for all four:
//   · A STEP LEFT BEHIND. A theme length with no remap line stays in rem
//     inside the band: the one utility that reads it keeps its size while
//     everything round it scales — exactly the "disproportioned" the owner
//     named, in one box, and no class diff shows it. Tailwind's default theme
//     (node_modules/tailwindcss/theme.css, read here, never retyped) and this
//     project's own are walked — EVERY `@theme` block of either sheet, plain,
//     `inline`, `default` or `reference`, as many as there are (G2
//     typescript, T4: the first cut read the first plain block alone, and a
//     length added to `@theme inline` or to a second block escaped it) — and
//     every length step of the four namespaces the utility claims must have
//     its line: the spacing step and any NAMED spacing key (`p-gutter` would
//     read `--spacing-gutter`), the text, container and radius steps.
//   · A WRONG MULTIPLIER. N must be the step's own default in px — its rem ×
//     16 — so that at the registered initial design pixel, 1px, the remap IS
//     the theme, and every ratio between two steps is Tailwind's (§3: the
//     SCALE stays untouched, only the unit moves). The body size (§15.1's
//     1.125rem) and the ribbon's unit (lib/ribbon-model's UNIT_PX, imported)
//     are held the same way.
//   · A SECOND WEARER, OR A SECOND SPELLING. The regime is ONE box's: the band
//     declares the design pixel and wears the remap behind ONE variant chain,
//     the gate first, once each; its cap is one number spelled twice in that
//     one class string and its chain one spelling worn twice (KEEP IN SYNC);
//     and the gate is ONE custom variant in globals.css with exactly its two
//     conditions. No other product file in src/ declares either.
//   · A PICTURE ASKED FOR AT THE WRONG SIZE (G2, T5/R7). PersonnelCard's
//     CUTOUT_SIZES tells the browser how wide the doctor's cutout is drawn,
//     and each number in it is derived from the band's: the vw share from
//     REFERENCE, the cell and ui/Container's gutters, the min-width from the
//     STEP and the gutters, the pointer condition from the gate. They are read
//     here where they live — the band's class string, the card's and the
//     Container's source, the stylesheet — so pulling one of D10's levers
//     fails a test instead of quietly blurring a picture.
// The two registrations (`@property`) are held too: an UNREGISTERED design
// pixel is pasted as text and its `cqw` measured again against whichever
// card reads it (globals.css, THE DESIGN SCALE — 86.48px where 100 was due).
// NOT held here, on purpose: what the engine does with all this — that is
// DoctorShowcase.test.tsx's "THE SCALE, measured", every box of the band
// against the reference render. COMMENTS ARE STRIPPED FIRST: the files
// explain the regime in prose that names the very tokens counted below.
// THE D-LIT RULE, for this file and every other: Tailwind reads class names
// out of every file it scans, tests and comments included, so a complete
// arbitrary class spelled anywhere but in the band ships as a rule only that
// file needs (globals.css, THE DESIGN SCALE — THE BARE RULE SHIPS). The
// design pixel's bracketed declaration is therefore never written here whole:
// its name is matched as a part, every sample is assembled from parts, and
// the last test below holds the rest of the repository to the same rule.

const REPO = new URL('../../', import.meta.url);

/** A file's text, by its path from the repo's root. */
const read = (path: string): string =>
  readFileSync(new URL(path, REPO), 'utf8');

/** CSS without its comments. */
const cssCode = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, ' ');

/** TS without its comments (the soft-corner census's stripper: `//` opens a
 *  comment only at a line's start or after whitespace, so a `…/1106)` inside
 *  a class string survives). */
const tsCode = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|\s)\/\/[^\n]*/g, '$1');

/** The text between the brace at `open` and the one that closes it — braces
 *  counted, so a nested @keyframes inside a @theme never ends it early. */
function blockAt(css: string, open: number): string {
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  throw new Error(`the block opening at ${open} never closes`);
}

/** The text between the braces that follow `header`. */
function blockAfter(css: string, header: string): string {
  const start = css.indexOf(header);
  if (start === -1) throw new Error(`no block “${header}” in the stylesheet`);
  return blockAt(css, css.indexOf('{', start + header.length - 1));
}

/** EVERY `@theme` block of a sheet — plain, `inline`, `static`, `default`,
 *  `reference`, as many as it holds — in the order they are written (T4). */
function themeBlocks(css: string): string[] {
  return [...css.matchAll(/@theme\b[^{};]*\{/g)].map((match) =>
    blockAt(css, match.index + match[0].length - 1),
  );
}

/** Every `name: value;` at the TOP level of a block — a nested block (a
 *  @keyframes in a @theme) taken out first, so its declarations never read as
 *  the block's. Values are trimmed and their whitespace collapsed. */
function declarations(block: string): [string, string][] {
  let flat = block;
  for (;;) {
    const next = flat.replace(/[^{};]*\{[^{}]*\}/g, ' ');
    if (next === flat) break;
    flat = next;
  }
  return [...flat.matchAll(/([-\w]+)\s*:\s*([^;]+);/g)].map((match) => [
    match[1],
    match[2].trim().replace(/\s+/g, ' '),
  ]);
}

/** THE FOUR NAMESPACES the utility claims, one step each: the spacing step
 *  and every NAMED spacing key (T4), and every text, container and radius
 *  step — never a step's sub-property (`--text-xs--line-height`) and never a
 *  text SHADOW, which shares the `--text-` prefix and is no size. */
const STEP =
  /^--(?:spacing(?:-[a-z0-9]+)*|text-(?!shadow-)[a-z0-9]+(?:-[a-z0-9]+)*|container-[a-z0-9]+(?:-[a-z0-9]+)*|radius-[a-z0-9]+(?:-[a-z0-9]+)*)$/;

/** A theme length in CSS px at the 16px root — rem × 16, or px as written. */
function px(value: string, name: string): number {
  const rem = /^(\d*\.?\d+)rem$/.exec(value);
  if (rem) return Number(rem[1]) * 16;
  const plain = /^(\d*\.?\d+)px$/.exec(value);
  if (plain) return Number(plain[1]);
  throw new Error(
    `${name}: “${value}” is no plain length — the design scale cannot remap a step it cannot multiply`,
  );
}

/** Every length step of the four namespaces in a list of sheets, name → px:
 *  every `@theme` block of each sheet, read in order, a later value winning
 *  as it does in the compiled sheet. */
function stepsOf(sheets: readonly string[]): Map<string, number> {
  const found = new Map<string, number>();
  for (const sheet of sheets) {
    for (const block of themeBlocks(sheet)) {
      for (const [name, value] of declarations(block)) {
        if (STEP.test(name)) found.set(name, px(value, name));
      }
    }
  }
  return found;
}

/** THE REMAP LINE, spelled one way: the design pixel times the step's px. */
const REMAP = /^calc\(var\(--scale-px\) \* (\d+(?:\.\d+)?)\)$/;

const globals = cssCode(read('src/styles/globals.css'));
const tailwindTheme = cssCode(
  readFileSync(
    createRequire(import.meta.url).resolve('tailwindcss/theme.css'),
    'utf8',
  ),
);

/** Every length step of the four namespaces, name → px: Tailwind's default
 *  theme, then this project's own over it. */
const steps = stepsOf([tailwindTheme, globals]);
/** The project's own steps alone. */
const projectSteps = stepsOf([globals]);

const remap = declarations(blockAfter(globals, '@utility design-scale {'));

/** The two lines of the block that are no theme step, each held by a test of
 *  its own below: the box's own font size and the ribbon's unit. */
const OWN_LINES = ['font-size', '--ribbon-unit'];

/**
 * EVERY WAY THE REMAP CAN ROT, as words — empty when it holds: a line spelled
 * any other way than `calc(var(--scale-px) * N)`, a name declared twice, a
 * step with no line, a step at the wrong multiplier, a line for a name no
 * theme defines. A function of its two inputs, so the teeth tests below can
 * feed it a broken remap or a grown theme without touching the stylesheet.
 */
function audit(
  theme: ReadonlyMap<string, number>,
  lines: readonly (readonly [string, string])[],
): string[] {
  const problems: string[] = [];
  const multipliers = new Map<string, number>();
  for (const [name, value] of lines) {
    const match = REMAP.exec(value);
    if (match === null) problems.push(`${name}: “${value}” is spelled apart`);
    if (multipliers.has(name)) problems.push(`${name}: declared twice`);
    multipliers.set(name, Number(match?.[1]));
  }
  for (const [name, step] of theme) {
    const multiplier = multipliers.get(name);
    if (multiplier === undefined) problems.push(`${name}: no remap line`);
    else if (multiplier !== step) {
      problems.push(`${name}: × ${multiplier}, its step is ${step}px`);
    }
  }
  for (const name of multipliers.keys()) {
    if (!theme.has(name) && !OWN_LINES.includes(name)) {
      problems.push(`${name}: no theme step of that name`);
    }
  }
  return problems;
}

describe('the design scale — every theme length remapped, in its own px (§15.25 round 2)', () => {
  it('reads a real theme (the census never passes vacuously)', () => {
    // Tailwind's own default steps, as many as the theme defines — the
    // spacing step, 13 text steps, 13 containers, 8 radii — and the
    // project's one addition, the soft corner (§15.29). Both of Tailwind's
    // blocks and both of the project's are read (T4).
    expect(themeBlocks(tailwindTheme).length).toBeGreaterThanOrEqual(2);
    expect(themeBlocks(globals).length).toBeGreaterThanOrEqual(2);
    expect(steps.get('--spacing')).toBe(4);
    expect(steps.get('--text-lg')).toBe(18);
    expect(steps.get('--container-md')).toBe(448);
    expect(steps.get('--radius-md')).toBe(6);
    expect([...projectSteps.keys()]).toContain('--radius-soft');
    expect(steps.size).toBeGreaterThanOrEqual(1 + 13 + 13 + 8 + 1);
    expect(remap.length).toBeGreaterThan(steps.size);
  });

  it('remaps EVERY length step of the four namespaces once, ONE way, at its own px — the default rem × 16 — and nothing the themes do not define', () => {
    expect(audit(steps, remap)).toEqual([]);
    // The block's two other lines are exactly the two it owns.
    expect(
      remap
        .map(([name]) => name)
        .filter((name) => !steps.has(name))
        .toSorted(),
    ).toEqual(OWN_LINES.toSorted());
  });

  it('has teeth — a dropped step, a wrong multiplier, a stray name, a second spelling and a line written twice are each named', () => {
    // The real block, broken five ways in a copy: the stylesheet is never
    // touched.
    const broken: (readonly [string, string])[] = remap
      .filter(([name]) => name !== '--text-lg')
      .map(([name, value]): readonly [string, string] =>
        name === '--radius-md'
          ? [name, 'calc(var(--scale-px) * 5)']
          : [name, value],
      );
    broken.push(
      ['--blur-xs', 'calc(var(--scale-px) * 4)'],
      ['--container-md', 'calc(28 * var(--scale-px) * 16)'],
      ['--spacing', 'calc(var(--scale-px) * 4)'],
    );
    expect(audit(steps, broken).toSorted()).toEqual(
      [
        '--blur-xs: no theme step of that name',
        '--container-md: declared twice',
        '--container-md: “calc(28 * var(--scale-px) * 16)” is spelled apart',
        '--container-md: × NaN, its step is 448px',
        '--radius-md: × 5, its step is 6px',
        '--spacing: declared twice',
        '--text-lg: no remap line',
      ].toSorted(),
    );
  });

  it('has teeth for the THEME too — a length in `@theme inline`, in a second `@theme` block or under a named spacing key is a step that needs its line (T4)', () => {
    // The real stylesheet, grown three ways in a copy, every piece assembled
    // from parts (THE D-LIT RULE above): a named spacing key in the first
    // block, a radius in an inline block, a text step in a second plain one.
    const theme = '@theme';
    const colon = ':';
    const grown = [
      globals.replace(
        `${theme} {`,
        `${theme} { --spacing-gutter${colon} 2.5rem;`,
      ),
      `${theme} inline { --radius-card${colon} 1.25rem; }`,
      `${theme} { --text-display${colon} 3.5rem; }`,
    ].join('\n');
    const found = stepsOf([tailwindTheme, grown]);

    expect(found.get('--spacing-gutter')).toBe(40);
    expect(found.get('--radius-card')).toBe(20);
    expect(found.get('--text-display')).toBe(56);
    expect(audit(found, remap).toSorted()).toEqual([
      '--radius-card: no remap line',
      '--spacing-gutter: no remap line',
      '--text-display: no remap line',
    ]);
    // …while a sub-property and a text shadow stay no steps at all.
    expect(STEP.test('--text-xs--line-height')).toBe(false);
    expect(STEP.test('--text-shadow-2xs')).toBe(false);
    expect(STEP.test('--spacing--x')).toBe(false);
  });

  it('draws the body size in the design pixel at the body’s own 1.125rem (§15.1)', () => {
    const body = declarations(blockAfter(globals, 'body {'));
    const size = body.find(([name]) => name === 'font-size')?.[1];
    expect(size).toBe('1.125rem');
    const line = remap.find(([name]) => name === 'font-size')?.[1] ?? '';
    expect(Number(REMAP.exec(line)?.[1])).toBe(px(size ?? '', 'body'));
  });

  it('draws the ribbon’s unit as lib/ribbon-model’s UNIT_PX design pixels', () => {
    const line = remap.find(([name]) => name === '--ribbon-unit')?.[1] ?? '';
    expect(Number(REMAP.exec(line)?.[1])).toBe(UNIT_PX);
  });

  it.each([
    ['--scale-px', '1px'],
    ['--ribbon-unit', `${UNIT_PX}px`],
  ])(
    'registers %s as an inherited length whose initial value is %s',
    (name, initial) => {
      const registration = Object.fromEntries(
        declarations(blockAfter(globals, `@property ${name} {`)),
      );
      expect(registration).toEqual({
        syntax: "'<length>'",
        inherits: 'true',
        'initial-value': initial,
      });
    },
  );
});

/** A class read as its variant chain and its utility — split at every colon
 *  OUTSIDE brackets, so `@min-[896px]` stays one variant and an arbitrary
 *  property's own colon stays inside its utility. */
const parse = (token: string): { variants: string[]; utility: string } => {
  const variants: string[] = [];
  let depth = 0;
  let part = '';
  for (const char of token) {
    if (char === '[') depth += 1;
    else if (char === ']') depth -= 1;
    if (char === ':' && depth === 0) {
      variants.push(part);
      part = '';
    } else {
      part += char;
    }
  }
  return { variants, utility: part };
};

/** An ARBITRARY PROPERTY — a custom property's name and its value, colon
 *  between, inside one pair of brackets — read as its two parts, or null for
 *  any other utility. The pattern names no property: the design pixel's is
 *  matched by its NAME below, never written inside a bracket here (and this
 *  comment shows no bracketed sample either: Tailwind would ship it). */
const arbitrary = (utility: string): { name: string; value: string } | null => {
  const match = /^\[(--[\w-]+):([^\]\s]+)\]$/.exec(utility);
  return match === null ? null : { name: match[1], value: match[2] };
};

/** The design pixel's name — the one custom property the regime declares. */
const PIXEL = '--scale-px';

/** The band's source, raw and without its comments. */
const bandSource = read(
  'src/components/sections/DoctorShowcase/DoctorShowcase.tsx',
);
const band = tsCode(bandSource);

/** RHYTHM as the browser gets it — its string literals, joined. */
const rhythm = ((): string => {
  const match = /\bconst RHYTHM =([^;]*);/.exec(band);
  if (match === null) throw new Error('no RHYTHM in the band’s source');
  return [...match[1].matchAll(/'([^']*)'/g)].map((m) => m[1]).join('');
})();
/** RHYTHM's classes, each read as its chain and its utility. */
const classes = rhythm.split(/\s+/).filter(Boolean).map(parse);

/** The two regime classes — the design pixel's declaration and the remap —
 *  in the order RHYTHM writes them. */
const regime = classes.filter(
  ({ utility }) =>
    utility === 'design-scale' || arbitrary(utility)?.name === PIXEL,
);

/** The design pixel's value, `calc(min(100cqw,CAP)/REFERENCE)`, read as its
 *  two numbers: THE CAP as written, and REFERENCE. */
const pixel = ((): { cap: string; reference: number } => {
  const value =
    regime.map(({ utility }) => arbitrary(utility)).find(Boolean)?.value ?? '';
  const match = /^calc\(min\(100cqw,(\d+(?:\.\d+)?rem)\)\/(\d+)\)$/.exec(value);
  if (match === null) {
    throw new Error(`the design pixel reads “${value}”, not min()/N`);
  }
  return { cap: match[1], reference: Number(match[2]) };
})();

describe('the design scale — ONE wearer, the doctors band, behind its gates (D10)', () => {
  const count = (token: string): number => band.split(token).length - 1;

  it('declares the design pixel once and wears the remap once, behind ONE variant chain — the gate first, then the Container’s `@4xl` step floored at 896px', () => {
    expect(
      regime.map(({ utility }) => arbitrary(utility)?.name ?? utility),
    ).toEqual([PIXEL, 'design-scale']);
    for (const { variants } of regime) {
      expect(variants).toEqual(['scalable', '@4xl', '@min-[896px]']);
    }
    // …and names neither anywhere else in its code — no inline style, no
    // second reading, no second wearing.
    expect(count('design-scale')).toBe(1);
    expect(count(PIXEL)).toBe(1);
  });

  it('wears the gate on exactly THREE classes — the cap and the two regime classes — and always as the outermost variant', () => {
    const gated = classes.filter(({ variants }) =>
      variants.includes('scalable'),
    );
    expect(gated).toHaveLength(3);
    for (const { variants } of gated) expect(variants[0]).toBe('scalable');
    // The cap: the gate alone, nothing between it and the box's width.
    const [cap, ...rest] = gated;
    expect(cap?.variants).toEqual(['scalable']);
    expect(cap?.utility.startsWith('max-w-')).toBe(true);
    expect(rest).toEqual(regime);
    // The token is spelled as many times as it is worn, and no more.
    expect(count('scalable:')).toBe(3);
    // …and the box centres in a wider column.
    expect(classes.map(({ utility }) => utility)).toContain('mx-auto');
  });

  it('spells the CAP in rem, once in the design pixel and once in the box’s width — the same number (KEEP IN SYNC, G2 typescript T2)', () => {
    const inBox = classes
      .filter(({ variants }) => variants.includes('scalable'))
      .map(({ utility }) => /^max-w-\[(\d+(?:\.\d+)?rem)\]$/.exec(utility))
      .find(Boolean)?.[1];
    expect(pixel.cap).toBe('96rem');
    expect(inBox).toBe(pixel.cap);
    expect(count('max-w-[')).toBe(1);
  });

  it('reads REFERENCE and THE STEP off its own classes — 1106, and 56rem floored at 896px, one number at the default root', () => {
    expect(pixel.reference).toBe(1106);
    // `@4xl` is Tailwind's container step of that name (its theme's
    // `--container-4xl`), `@min-[896px]` the floor in px (G2 react, R6).
    const [, named, floor] = regime[0]?.variants ?? [];
    expect(named).toBe('@4xl');
    expect(steps.get('--container-4xl')).toBe(896);
    expect(Number(/^@min-\[(\d+)px\]$/.exec(floor ?? '')?.[1])).toBe(
      steps.get('--container-4xl'),
    );
  });

  it('is ONE custom variant in globals.css, with exactly its two conditions — a mouse or trackpad, in an engine that registers custom properties', () => {
    expect(globals.split('@custom-variant scalable').length - 1).toBe(1);
    expect(
      blockAfter(globals, '@custom-variant scalable {')
        .replace(/\s+/g, ' ')
        .trim(),
    ).toBe(
      '@supports (color: rgb(from red r g b)) { @media (pointer: fine) { @slot; } }',
    );
  });

  it('reads a class under any chain of variants or none — the reader has teeth', () => {
    // A declaration bare or under another chain must surface with its own
    // variants; another property's must not read as the design pixel's.
    // Assembled from parts, never one literal (THE D-LIT RULE).
    const open = '[';
    const samples = [
      `scalable:@4xl:@min-[896px]:${open}${PIXEL}:calc(min(100cqw,96rem)/1106)]`,
      `@5xl:${open}${PIXEL}:2px]`,
      `${open}${PIXEL}:1px]`,
      `${open}--ribbon-unit:100px]`,
    ].map(parse);
    expect(
      samples
        .filter(({ utility }) => arbitrary(utility)?.name === PIXEL)
        .map(({ variants }) => variants.join(':') || '(none)'),
    ).toEqual(['scalable:@4xl:@min-[896px]', '@5xl', '(none)']);
    expect(arbitrary(samples[3]?.utility ?? '')?.name).toBe('--ribbon-unit');
  });

  it('is the ONLY product file in src/ that declares a design pixel or wears the remap', () => {
    const wearers = readdirSync(new URL('src/', REPO), {
      recursive: true,
      encoding: 'utf8',
    })
      .map((name) => name.replaceAll('\\', '/'))
      .filter((name) => /\.(ts|tsx)$/.test(name))
      // Tests and stories render the utility on purpose, to measure it.
      .filter((name) => !/\.(test|stories)\.tsx?$/.test(name))
      .filter((name) =>
        /design-scale|--scale-px/.test(tsCode(read(`src/${name}`))),
      )
      .toSorted();
    expect(wearers).toEqual([
      'components/sections/DoctorShowcase/DoctorShowcase.tsx',
    ]);
  });

  it('strips its comments — the band’s own prose names the regime many times', () => {
    expect(bandSource.split('design-scale').length - 1).toBeGreaterThan(1);
    expect(count('design-scale')).toBe(1);
  });

  it('lets no scanned file spell the design pixel’s declaration but as the band’s own class (THE D-LIT RULE)', () => {
    // Tailwind scans comments and tests too, so a bracketed declaration in
    // any other spelling would ship a rule nobody wears. Every occurrence in
    // src/, tests/ and .storybook/ — raw text, comments included — must be
    // the band's own regime class, whole. Never vacuous: the band's own
    // source is among the occurrences.
    const own = rhythm
      .split(/\s+/)
      .find((token) => arbitrary(parse(token).utility)?.name === PIXEL);
    const opener = `[${PIXEL}:`;
    const found: string[] = [];
    for (const root of ['src/', 'tests/', '.storybook/']) {
      for (const name of readdirSync(new URL(root, REPO), {
        recursive: true,
        encoding: 'utf8',
      })) {
        if (!/\.(ts|tsx|mts|mjs|js|css|mdx)$/.test(name)) continue;
        const text = read(`${root}${name.replaceAll('\\', '/')}`);
        for (let at = text.indexOf(opener); at !== -1;) {
          let start = at;
          let end = at;
          while (start > 0 && !/[\s'"`]/.test(text[start - 1] ?? '')) {
            start -= 1;
          }
          while (end < text.length && !/[\s'"`]/.test(text[end] ?? '')) {
            end += 1;
          }
          found.push(`${root}${name}: ${text.slice(start, end)}`);
          at = text.indexOf(opener, end);
        }
      }
    }
    expect(own).toBeDefined();
    expect(found.length).toBeGreaterThan(0);
    expect(found.filter((entry) => !entry.endsWith(`: ${own ?? ''}`))).toEqual(
      [],
    );
  });
});

describe('the cutout’s `sizes` — every number derived from the band’s, read where it lives (G2, T5/R7)', () => {
  const card = tsCode(
    read('src/components/sections/PersonnelCard/PersonnelCard.tsx'),
  );
  const container = tsCode(read('src/components/ui/Container/Container.tsx'));

  /** A `const NAME = '…';` of a source, its one string literal. */
  const constant = (code: string, name: string): string => {
    const value = new RegExp(`\\bconst ${name} = '([^']*)';`).exec(code)?.[1];
    if (value === undefined) throw new Error(`no ${name} in the source`);
    return value;
  };

  const sizes = constant(card, 'CUTOUT_SIZES');
  const parts =
    /^\(min-width: (\d+)rem\) and (\(pointer: fine\)) (\d+)vw, (\d+)rem$/.exec(
      sizes,
    );

  /** The band's REFERENCE, off its design pixel, and its STEP in rem, off
   *  the theme's step of the name its chain wears. */
  const reference = pixel.reference;
  const stepRem =
    (steps.get(`--container-${regime[0]?.variants[1]?.slice(1) ?? ''}`) ??
      NaN) / 16;
  /** The cutout's cell, its `w-N` in px (the default spacing step). */
  const cell =
    Number(/(?:^|\s)w-(\d+)(?:\s|$)/.exec(constant(card, 'PICTURE'))?.[1]) *
    (steps.get('--spacing') ?? NaN);
  /** The share of a window ui/Container leaves its column: 1 − 2 × the
   *  gutter's vw. */
  const column =
    1 - (2 * Number(/mx-\[clamp\([^,]+,(\d+)vw,/.exec(container)?.[1])) / 100;

  it('reads its inputs (never vacuous): REFERENCE 1106, the 56rem step, the 288px cell, a 0.8 column', () => {
    expect(reference).toBe(1106);
    expect(stepRem).toBe(56);
    expect(cell).toBe(288);
    expect(column).toBe(0.8);
  });

  it('is exactly the string the band’s numbers give', () => {
    expect(sizes).toBe('(min-width: 70rem) and (pointer: fine) 21vw, 18rem');
    expect(parts).not.toBeNull();
  });

  it('asks a mouse for the scaled cell — ceil(100 × 288 × 0.8 / REFERENCE) vw, 21', () => {
    expect(Math.ceil((100 * cell * column) / reference)).toBe(
      Number(parts?.[3]),
    );
  });

  it('asks from the window whose column is the step — 56 / 0.8 = 70rem', () => {
    expect(stepRem / column).toBe(Number(parts?.[1]));
  });

  it('asks with the gate’s own pointer condition, and falls back to the cell itself', () => {
    expect(
      /@media (\(pointer: fine\))/.exec(
        blockAfter(globals, '@custom-variant scalable {'),
      )?.[1],
    ).toBe(parts?.[2]);
    expect(Number(parts?.[4]) * 16).toBe(cell);
  });
});
