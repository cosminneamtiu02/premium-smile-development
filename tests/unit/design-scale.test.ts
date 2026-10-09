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
// since 2026-10-02 (CLAUDE.md §15.32) ui/Container spells the regime ONCE as
// THE BAND SCALE — `bandScaleClasses` (the design pixel and the remap behind
// three GATES: the `scalable` variant — a mouse or trackpad, in an engine
// that registers custom properties — and a column of max(56rem, 896px)) and
// `bandColumnClasses` (the cap and the centring) — which every band under the
// Home hero and every band of the Team page wears, so all of their headings
// are one size and one offset (sections/DoctorShowcase's D10 invented it,
// alone, on 2026-10-01). Four things can rot silently there, and this file is
// the machine for all four:
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
//   · A SECOND SPELLING. The regime is spelled ONCE, in ui/Container: the
//     design pixel and the remap behind ONE variant chain, the gate first,
//     once each; the cap one number spelled twice across the two strings and
//     the chain one spelling worn twice (KEEP IN SYNC); the zoom one variable
//     with ONE setter (DoctorStats' tiles, at 9/8); and the gate ONE custom
//     variant in globals.css with exactly its two conditions. No other
//     product file in src/ declares the pixel or spells the remap — the five
//     wearers IMPORT both strings — and the one class that must re-spell the
//     chain as a literal (the staff tile's width) spells the same chain.
//   · A PICTURE ASKED FOR AT THE WRONG SIZE (G2, T5/R7). PersonnelCard's
//     CUTOUT_SIZES tells the browser how wide the doctor's cutout is drawn,
//     and each number in it is derived from the band's: the vw share from
//     REFERENCE, the cell and ui/Container's gutters, the min-width from the
//     STEP and the gutters, the pointer condition from the gate. They are read
//     here where they live — ui/Container's band-scale string, the card's
//     and the Container's source, the stylesheet — so pulling one of D10's
//     levers fails a test instead of quietly blurring a picture.
// The two registrations (`@property`) are held too: an UNREGISTERED design
// pixel is pasted as text and its `cqw` measured again against whichever
// card reads it (globals.css, THE DESIGN SCALE — 86.48px where 100 was due).
// NOT held here, on purpose: what the engine does with all this — that is
// DoctorShowcase.test.tsx's "THE SCALE, measured", every box of the band
// against the reference render. COMMENTS ARE STRIPPED FIRST: the files
// explain the regime in prose that names the very tokens counted below.
// THE D-LIT RULE, for this file and every other: Tailwind reads class names
// out of every file it scans, tests and comments included, so a complete
// arbitrary class spelled anywhere but in ui/Container ships as a rule only
// that file needs (globals.css, THE DESIGN SCALE — THE BARE RULE SHIPS). The
// design pixel's bracketed declaration is therefore never written here whole:
// its name is matched as a part, every sample is assembled from parts, and
// the last test below holds the rest of the repository to the same rule.

const REPO = new URL('../../', import.meta.url);

/** A file's text, by its path from the repo's root. */
const read = (path: string): string =>
  readFileSync(new URL(path, REPO), 'utf8');

/** CSS without its comments. */
const cssCode = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, ' ');

/** TS without its comments, in ONE left-to-right pass (the G2 typescript
 *  review, 2026-10-02): string literals are stepped over whole, and a `//`
 *  comment — which opens only at a line's start or after whitespace, so a
 *  regex literal or a URL in code survives — is consumed before a `/*` inside
 *  it could open a block that runs on to the next `*\/` (a `src/messages/*.json`
 *  in a line comment once hid whole page components from this census). */
const tsCode = (source: string): string =>
  source.replace(
    /('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|(?<=^|\s)\/\/[^\n]*/gm,
    (match: string, literal: string | undefined) => literal ?? ' ',
  );

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

/** ui/Container's source, raw and without its comments — THE BAND SCALE's
 *  one spelling since 2026-10-02 (§15.32). */
const containerSource = read('src/components/ui/Container/Container.tsx');
const container = tsCode(containerSource);

/** An exported string constant as the browser gets it — its string
 *  literals, joined (a constant may be written over several `+`ed
 *  literals). Throws by name when the constant is gone. */
const exported = (code: string, name: string): string => {
  const match = new RegExp(`\\bexport const ${name} =([^;]*);`).exec(code);
  if (match === null) throw new Error(`no exported ${name} in the source`);
  return [...match[1].matchAll(/'([^']*)'/g)].map((m) => m[1]).join('');
};

/** THE BAND SCALE's two strings: the design pixel with the remap, and the
 *  column (the cap and the centring). */
const scaleString = exported(container, 'bandScaleClasses');
const columnString = exported(container, 'bandColumnClasses');
/** Each string's classes, each read as its chain and its utility. */
const scaleClasses = scaleString.split(/\s+/).filter(Boolean).map(parse);
const columnClasses = columnString.split(/\s+/).filter(Boolean).map(parse);

/** The two regime classes — the design pixel's declaration and the remap —
 *  in the order bandScaleClasses writes them. */
const regime = scaleClasses.filter(
  ({ utility }) =>
    utility === 'design-scale' || arbitrary(utility)?.name === PIXEL,
);

/** The design pixel's value,
 *  `max(var(FLOOR,FLOOR_DEFAULT),calc(min(100cqw,CAP)/REFERENCE*var(ZOOM,DEFAULT)))`,
 *  read as its parts: the floor's name and its default, THE CAP as written,
 *  REFERENCE, the zoom's name and its default. */
const pixel = ((): {
  floor: string;
  floorDefault: string;
  cap: string;
  reference: number;
  zoom: string;
  zoomDefault: number;
} => {
  const value =
    regime.map(({ utility }) => arbitrary(utility)).find(Boolean)?.value ?? '';
  const match =
    /^max\(var\((--[\w-]+),([\d.]+px)\),calc\(min\(100cqw,(\d+(?:\.\d+)?rem)\)\/(\d+)\*var\((--[\w-]+),(\d+(?:\.\d+)?)\)\)\)$/.exec(
      value,
    );
  if (match === null) {
    throw new Error(
      `the design pixel reads “${value}”, not a floored min()/N times a zoom`,
    );
  }
  return {
    floor: match[1],
    floorDefault: match[2],
    cap: match[3],
    reference: Number(match[4]),
    zoom: match[5],
    zoomDefault: Number(match[6]),
  };
})();

/** The product files under src/ — tests and stories render the utility on
 *  purpose, to measure it, and are left out. */
const productFiles = readdirSync(new URL('src/', REPO), {
  recursive: true,
  encoding: 'utf8',
})
  .map((name) => name.replaceAll('\\', '/'))
  .filter((name) => /\.(ts|tsx)$/.test(name))
  .filter((name) => !/\.(test|stories)\.tsx?$/.test(name));

/** The bands that wear THE BAND SCALE (§15.32): every band under the Home
 *  hero and every band of the Team page — the doctors, the numbers, the map,
 *  the reviews' opener and the staff — and, since round 2 the same evening,
 *  the Services page's one band, the price list (its menu and its cards). */
const WEARERS = [
  'components/sections/ClinicLocation/ClinicLocation.tsx',
  'components/sections/DoctorShowcase/DoctorShowcase.tsx',
  'components/sections/DoctorStats/DoctorStats.tsx',
  'components/sections/PriceList/PriceList.tsx',
  'components/sections/ReviewsCarousel/ReviewsCarousel.tsx',
  'components/sections/TeamRoster/TeamRoster.tsx',
];

/** Every class-like token in a source's string literals — single, double AND
 *  backtick (a template literal's `${…}` read as a gap) — each read as its
 *  chain and its utility: what Tailwind's scanner can see in a quoted class
 *  string (the Opus review's census probe: backticks were missed). */
const tokensOf = (code: string): { variants: string[]; utility: string }[] =>
  [...code.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g)]
    .flatMap((match) =>
      (
        match[1] ??
        match[2] ??
        (match[3] ?? '').replace(/\$\{[^}]*\}/g, ' ')
      ).split(/\s+/),
    )
    .filter(Boolean)
    .map(parse);

describe('THE BAND SCALE — spelled ONCE, in ui/Container, worn by every band of Home and Team (§15.32)', () => {
  const count = (token: string): number => container.split(token).length - 1;

  it('declares the design pixel once and wears the remap once, behind ONE variant chain — the gate first, then the Container’s `@4xl` step floored at 896px', () => {
    expect(
      regime.map(({ utility }) => arbitrary(utility)?.name ?? utility),
    ).toEqual([PIXEL, 'design-scale']);
    for (const { variants } of regime) {
      expect(variants).toEqual(['scalable', '@4xl', '@min-[896px]']);
    }
    // …nothing else rides in that string,
    expect(scaleClasses).toEqual(regime);
    // …and the file names neither anywhere else in its code — no inline
    // style, no second reading, no second wearing.
    expect(count('design-scale')).toBe(1);
    expect(count(PIXEL)).toBe(1);
  });

  it('caps and centres in a string of its own — `mx-auto w-full`, and the cap behind the gate alone', () => {
    expect(
      columnClasses.map(({ variants, utility }) =>
        [...variants, utility].join(':'),
      ),
    ).toEqual(['mx-auto', 'w-full', `scalable:max-w-[${pixel.cap}]`]);
  });

  it('wears the gate on exactly THREE classes — the cap and the two regime classes — and always as the outermost variant', () => {
    const gated = [...columnClasses, ...scaleClasses].filter(({ variants }) =>
      variants.includes('scalable'),
    );
    expect(gated).toHaveLength(3);
    for (const { variants } of gated) expect(variants[0]).toBe('scalable');
    expect(count('scalable:')).toBe(3);
  });

  it('spells the CAP in rem, once in the design pixel and once in the column’s width — the same number (KEEP IN SYNC, G2 typescript T2)', () => {
    const inBox = columnClasses
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

  it('multiplies the pixel by THE ZOOM — 1 unless a box says otherwise, and ONE box says otherwise: DoctorStats’ tiles, at 9/8', () => {
    expect(pixel.zoom).toBe('--band-zoom');
    expect(pixel.zoomDefault).toBe(1);
    // Assembled from parts, never one literal (THE D-LIT RULE's spirit).
    const opener = `[${pixel.zoom}:`;
    const setters = productFiles
      .filter((name) => tsCode(read(`src/${name}`)).includes(opener))
      .toSorted();
    expect(setters).toEqual([
      'components/sections/DoctorStats/DoctorStats.tsx',
    ]);
    const stats = tsCode(
      read('src/components/sections/DoctorStats/DoctorStats.tsx'),
    );
    const at = stats.indexOf(opener) + opener.length;
    // 9/8: a tile's sentence (text-base, 16) reads the doctor card's quote
    // (text-lg, 18) — the owner's "1 to 1" — and the tile keeps its ratios.
    expect(Number(stats.slice(at, stats.indexOf(']', at)))).toBe(9 / 8);
  });

  it('never lets a pixel fall under THE FLOOR — 0px unless a band says otherwise, and ONE band says otherwise: the price list, at 1rem / 16', () => {
    expect(pixel.floor).toBe('--band-floor');
    expect(pixel.floorDefault).toBe('0px');
    // Assembled from parts, never one literal (THE D-LIT RULE's spirit).
    const opener = `[${pixel.floor}:`;
    const setters = productFiles
      .filter((name) => tsCode(read(`src/${name}`)).includes(opener))
      .toSorted();
    expect(setters).toEqual(['components/sections/PriceList/PriceList.tsx']);
    const list = tsCode(
      read('src/components/sections/PriceList/PriceList.tsx'),
    );
    const at = list.indexOf(opener) + opener.length;
    // 1rem / 16: the theme's own pixel at ANY root — the price rows never
    // draw smaller than the theme (the owner's delegated decision, §15.32
    // round 2), and a larger root lifts the floor with it.
    expect(list.slice(at, list.indexOf(']', at))).toBe('0.0625rem');
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
      `scalable:@4xl:@min-[896px]:${open}${PIXEL}:max(var(--band-floor,0px),calc(min(100cqw,96rem)/1106*var(--band-zoom,1)))]`,
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

  it('is the ONLY product file in src/ that declares a design pixel or spells the remap — and every band of Home and Team and the price list wears it by IMPORTING both strings', () => {
    const spellers = productFiles
      .filter((name) =>
        /design-scale|--scale-px/.test(tsCode(read(`src/${name}`))),
      )
      .toSorted();
    expect(spellers).toEqual(['components/ui/Container/Container.tsx']);
    const wearers = productFiles
      .filter((name) => name !== 'components/ui/Container/Container.tsx')
      .filter((name) =>
        /\bbandScaleClasses\b/.test(tsCode(read(`src/${name}`))),
      )
      .toSorted();
    expect(wearers).toEqual(WEARERS);
    for (const name of WEARERS) {
      expect(tsCode(read(`src/${name}`)), name).toMatch(
        /\bbandColumnClasses\b/,
      );
    }
  });

  it('lets the GATE CHAIN be re-spelled only where Tailwind needs a literal of its own — and only as the regime’s chain', () => {
    // A class that must follow the regime but is none of its strings — the
    // staff tile's width and its row's gap, and the doctors band's ribbon
    // drawn 30 % thinner (DoctorShowcase D11, §15.26 round 6) — spells the
    // chain itself, because Tailwind reads class names from source text. Every such token must carry
    // the SAME chain, gate first, so a tile can never switch at another width
    // than the band. The gate is looked for ANYWHERE in a chain (a reordered
    // `@4xl:scalable:` is caught as itself) and in backtick literals too (the
    // Opus review's census probe).
    const chain = regime[0]?.variants ?? [];
    const gatedTokens = productFiles.flatMap((name) =>
      tokensOf(tsCode(read(`src/${name}`)))
        .filter(({ variants }) => variants.includes('scalable'))
        .map((token) => ({ name, ...token })),
    );
    for (const { name, variants, utility } of gatedTokens) {
      expect(variants[0], `${name}: ${utility} — the gate first`).toBe(
        'scalable',
      );
    }
    expect(
      [...new Set(gatedTokens.map(({ name }) => name))].toSorted(),
    ).toEqual([
      'components/sections/DoctorShowcase/DoctorShowcase.tsx',
      'components/sections/TeamRoster/TeamRoster.tsx',
      'components/ui/Container/Container.tsx',
    ]);
    for (const { name, variants, utility } of gatedTokens) {
      // The cap alone wears the gate bare (bandColumnClasses).
      if (variants.length === 1) {
        expect(name).toBe('components/ui/Container/Container.tsx');
        continue;
      }
      expect(variants, `${name}: ${utility}`).toEqual(chain);
    }
    expect(
      gatedTokens
        .filter(({ name }) => name.endsWith('TeamRoster.tsx'))
        .map(({ variants, utility }) => [...variants, utility].join(':'))
        .toSorted(),
    ).toEqual([
      'scalable:@4xl:@min-[896px]:gap-x-6',
      'scalable:@4xl:@min-[896px]:w-88',
    ]);
    // The doctors band's one: its ribbon's width share, 0.7 — the owner's
    // "30% thinner" on a laptop or a desktop, and nowhere a phone or a touch
    // tablet stands (D11).
    const share = gatedTokens.filter(({ name }) =>
      name.endsWith('DoctorShowcase.tsx'),
    );
    expect(
      share.map(({ variants, utility }) => [...variants, utility].join(':')),
    ).toEqual(['scalable:@4xl:@min-[896px]:[--ribbon-width-share:0.7]']);
    expect(arbitrary(share[0]?.utility ?? '')).toEqual({
      name: '--ribbon-width-share',
      value: '0.7',
    });
  });

  it('has a gate-chain reader with teeth — a backtick class and a reordered chain are both seen', () => {
    // Assembled from parts, never one literal (THE D-LIT RULE's spirit).
    const gate = 'scalable';
    const tick = '`';
    const probe = [
      `const A = ${tick}w-72 ${gate}:@3xl:w-88${tick};`,
      `const B = '@3xl:${gate}:w-88';`,
    ].join('\n');
    const seen = tokensOf(probe)
      .filter(({ variants }) => variants.includes(gate))
      .map(({ variants, utility }) => [...variants, utility].join(':'));
    expect(seen).toEqual([`${gate}:@3xl:w-88`, `@3xl:${gate}:w-88`]);
  });

  it('lets ONE box set the zoom — no other product code names `--band-zoom` but ui/Container’s own read', () => {
    // An unregistered custom property INHERITS: a setter on any wrapping box
    // would rescale every band inside it. So outside ui/Container's
    // `var(--band-zoom,1)` read and DoctorStats' one class (the zoom test
    // above), no product code may name it — class, inline style or CSS.
    const name = pixel.zoom;
    const offenders = productFiles.filter((file) => {
      const code = tsCode(read(`src/${file}`));
      const uses = code.split(name).length - 1;
      if (file === 'components/ui/Container/Container.tsx') return uses !== 1;
      if (file === 'components/sections/DoctorStats/DoctorStats.tsx')
        return uses !== 1;
      return uses !== 0;
    });
    expect(offenders).toEqual([]);
    // …nor the stylesheet: a `:root` declaration would scale every band.
    expect(cssCode(globals).split(name).length - 1, 'globals.css').toBe(0);
  });

  it('lets ONE band set the floor — no other product code names `--band-floor` but ui/Container’s own read', () => {
    // Unregistered and INHERITED like the zoom: a setter on any wrapping box
    // would lift every band inside it. So outside ui/Container's
    // `var(--band-floor,0px)` read and the price list's one class (the floor
    // test above), no product code may name it — class, inline style or CSS.
    const name = pixel.floor;
    const offenders = productFiles.filter((file) => {
      const code = tsCode(read(`src/${file}`));
      const uses = code.split(name).length - 1;
      if (file === 'components/ui/Container/Container.tsx') return uses !== 1;
      if (file === 'components/sections/PriceList/PriceList.tsx')
        return uses !== 1;
      return uses !== 0;
    });
    expect(offenders).toEqual([]);
    // …nor the stylesheet: a `:root` declaration would floor every band.
    expect(cssCode(globals).split(name).length - 1, 'globals.css').toBe(0);
  });

  it('strips its comments — ui/Container’s own prose names the regime many times', () => {
    expect(containerSource.split('design-scale').length - 1).toBeGreaterThan(1);
    expect(count('design-scale')).toBe(1);
  });

  it('lets no scanned file spell the design pixel’s declaration but as ui/Container’s own class (THE D-LIT RULE)', () => {
    // Tailwind scans comments and tests too, so a bracketed declaration in
    // any other spelling would ship a rule nobody wears. Every occurrence in
    // src/, tests/ and .storybook/ — raw text, comments included — must be
    // ui/Container's own regime class, whole. Never vacuous: Container's own
    // source is among the occurrences.
    const own = scaleString
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

  it('lets no scanned file spell a floor or a zoom setter but as its one wearer’s class, whole (THE D-LIT RULE, the setters)', () => {
    // The same reason, for the two variables a band may set (the G2
    // typescript review): a stale literal in a test or a story — say the old
    // value after the wearer's changed — would ship a rule nobody wears.
    const setterOf = (file: string, name: string): string => {
      const code = tsCode(read(`src/${file}`));
      const at = code.indexOf(`[${name}:`);
      return at === -1 ? '' : code.slice(at, code.indexOf(']', at) + 1);
    };
    const cases = [
      {
        name: pixel.floor,
        own: setterOf(
          'components/sections/PriceList/PriceList.tsx',
          pixel.floor,
        ),
      },
      {
        name: pixel.zoom,
        own: setterOf(
          'components/sections/DoctorStats/DoctorStats.tsx',
          pixel.zoom,
        ),
      },
    ];
    for (const { name, own } of cases) {
      // The wearer may assemble its class from parts (the price list does);
      // then its code holds no whole literal and the value is the census's.
      const opener = `[${name}:`;
      const found: string[] = [];
      for (const root of ['src/', 'tests/', '.storybook/']) {
        for (const file of readdirSync(new URL(root, REPO), {
          recursive: true,
          encoding: 'utf8',
        })) {
          if (!/\.(ts|tsx|mts|mjs|js|css|mdx)$/.test(file)) continue;
          const raw = read(`${root}${file.replaceAll('\\', '/')}`);
          for (let at = raw.indexOf(opener); at !== -1;) {
            const end = raw.indexOf(']', at) + 1;
            found.push(raw.slice(at, end));
            at = raw.indexOf(opener, end);
          }
        }
      }
      const expected =
        own ||
        (name === pixel.floor ? `[${name}:0.0625rem]` : `[${name}:1.125]`);
      expect(
        found.filter((token) => token !== expected),
        `every ${opener}…] in a scanned file`,
      ).toEqual([]);
    }
  });
});

describe('the cutout’s `sizes` — every number derived from the band’s, read where it lives (G2, T5/R7)', () => {
  const card = tsCode(
    read('src/components/sections/PersonnelCard/PersonnelCard.tsx'),
  );
  // ui/Container's code (`container`, read once above) holds both the gutter
  // these numbers divide by and, since 2026-10-02, THE BAND SCALE they derive
  // from (§15.32) — REFERENCE and the STEP are read off its regime.

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
  /** ui/Container's gutter, `clamp(floor, clamp(Pvw, Rvw − Krem, Tvw), cap)`:
   *  P vw on a phone, T vw from the tablet up, the ramp R vw − K rem between
   *  (THE PHONE GUTTER, CLAUDE.md §15.35). */
  const gutter =
    /mx-\[clamp\([^,]+,clamp\((\d+)vw,(\d+)vw_-_([\d.]+)rem,(\d+)vw\),/.exec(
      container,
    );
  const tabletVw = Number(gutter?.[4]);
  /** The window, in rem, from which the gutter is T vw: R vw − K rem = T vw. */
  const rampEndRem =
    (100 * Number(gutter?.[3])) / (Number(gutter?.[2]) - tabletVw);
  /** The share of a window ui/Container leaves its column from the ramp's
   *  end up — where every window these hints ask from lies: 1 − 2 × T vw. */
  const column = 1 - (2 * tabletVw) / 100;

  it('reads its inputs (never vacuous): REFERENCE 1106, the 56rem step, the 288px cell, a 0.8 column', () => {
    expect(reference).toBe(1106);
    expect(stepRem).toBe(56);
    expect(cell).toBe(288);
    expect(column).toBe(0.8);
    // The 0.8 holds only from the ramp's end (37.5rem) up, and both hints ask
    // from a 70rem window — past it, so the phone half never enters them.
    expect(rampEndRem).toBe(37.5);
    expect(stepRem / column).toBeGreaterThanOrEqual(rampEndRem);
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

  it('derives the STAFF portrait’s `sizes` the same way — its 192px cell scaled in the staff band since 2026-10-02 (§15.32, PersonnelCard D19)', () => {
    const portrait =
      /^\(min-width: (\d+)rem\) and (\(pointer: fine\)) (\d+)vw, (\d+)rem$/.exec(
        constant(card, 'PORTRAIT_SIZES'),
      );
    // The tile's portrait cell, its `w-N` beside the 3:4 ratio, in px.
    const tile =
      Number(/aspect-3\/4 w-(\d+)\b/.exec(card)?.[1]) *
      (steps.get('--spacing') ?? NaN);
    expect(tile).toBe(192);
    expect(portrait).not.toBeNull();
    expect(Math.ceil((100 * tile * column) / reference)).toBe(
      Number(portrait?.[3]),
    );
    expect(stepRem / column).toBe(Number(portrait?.[1]));
    expect(portrait?.[2]).toBe(parts?.[2]);
    expect(Number(portrait?.[4]) * 16).toBe(tile);
  });
});
