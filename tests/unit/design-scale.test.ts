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
// alone, on 2026-10-01), and with them the Services page's price list (round
// 2) and every band of a doctor's page (round 4, 2026-10-13). Four things can rot silently there, and this file is
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
//     product file in src/ declares the band's pixel or spells its remap —
//     every wearer (WEARERS below) IMPORTS both strings, and the two other
//     declarers draw tag chips in a pixel of their own — sections/PostCard
//     its CARD's (THE CHIPS' PIXEL, 2026-10-14), sections/PostCover the
//     card's under a cap at the page's own (THE COVER'S CHIPS, 2026-10-15)
//     — and the few classes that must
//     re-spell the chain as a literal (the staff tile's width and gap, the
//     doctors band's ribbon share, ui/Heading's `hero-scaled` step — the
//     `hero` size the doctor page's name, the page hero's heading and the
//     blog article's title ask for, spelled once since 2026-10-15 — and the
//     page hero, sections/PageHero (the blog list's, the Team page's since
//     2026-10-15): its <h1>, which reaches past its column, and both of its
//     blocks, the <h1> and the lead, which keep the copy's line breaks on a
//     laptop, the stairway of 2026-10-15) spell the same chain.
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
// arbitrary class spelled anywhere but in the one file that wears it
// (ui/Container; sections/PostCard and sections/PostCover for their chip
// pixels) ships as a rule only that file needs (globals.css, THE DESIGN SCALE
// — THE BARE RULE SHIPS). The
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
 *  the Services page's one band, the price list (its menu and its cards);
 *  and, since round 4 (2026-10-13), every band of a doctor's page — the two
 *  that live only there wear it themselves (the opener, and the band with the
 *  biography beside the courses — the courses block inside it inherits the
 *  scale and wears none of its own since round 7 the same day), the numbers
 *  and the map take `scaled` from the page; and, since 2026-10-14, the blog's
 *  list band (CLAUDE.md §15.39 round 2: its hero, its three-across grid and
 *  its pager), the map under it `scaled` like everywhere else, and the blog
 *  article's one band, sections/PostPage (round 4) — the blocks inside it
 *  inherit the scale, and its title asks ui/Heading for the `hero-scaled`
 *  step (the census below). */
const WEARERS = [
  // The Home page's articles band (2026-10-17) — its opener on the rhythm box,
  // and its carousel, its cards 65 % miniatures, on a box of its own that
  // wears `bandScaleClasses` again: since 2026-10-25 a flat row as wide as the
  // screen from a tablet up, at the tiles' zoom over its miniature's share
  // (THE ZOOM below), so a card's summary reads a tile's sentence.
  'components/sections/BlogCarousel/BlogCarousel.tsx',
  'components/sections/ClinicLocation/ClinicLocation.tsx',
  'components/sections/DoctorIntro/DoctorIntro.tsx',
  'components/sections/DoctorProfile/DoctorProfile.tsx',
  'components/sections/DoctorShowcase/DoctorShowcase.tsx',
  'components/sections/DoctorStats/DoctorStats.tsx',
  'components/sections/PostList/PostList.tsx',
  'components/sections/PostPage/PostPage.tsx',
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

/** Every token round each occurrence of `opener` in a raw text, read WHOLE —
 *  back to the white space, quote or backtick before it and on to the one
 *  after — so a declaration is read with the variant chain it rides behind,
 *  never from its bracket alone: read that way, a setter behind another
 *  variant, or behind none, passed for a worn class (the G2 typescript
 *  review, 2026-10-26). Both D-LIT rules below read through it. */
const wholeTokens = (text: string, opener: string): string[] => {
  const out: string[] = [];
  for (let at = text.indexOf(opener); at !== -1;) {
    let start = at;
    let end = at;
    while (start > 0 && !/[\s'"`]/.test(text[start - 1] ?? '')) start -= 1;
    while (end < text.length && !/[\s'"`]/.test(text[end] ?? '')) end += 1;
    out.push(text.slice(start, end));
    at = text.indexOf(opener, end);
  }
  return out;
};

/** THE FLAT ROW'S VARIANT (2026-10-25): from a tablet's screen up the Home
 *  articles band's carousel lies flat, and every class that rides that row —
 *  the carousel's own and the band's round it — wears ONE arbitrary media
 *  variant: sections/CardCarousel's exported query, the one its matchMedia
 *  reads, with Tailwind's underscores for its spaces. Derived here and never
 *  retyped, so the band's classes are held to the carousel's query (the G2
 *  reviews moved it once already: a fine pointer joined the height). */
const FLAT_ROW = `[@media${exported(
  tsCode(read('src/components/sections/CardCarousel/CardCarousel.tsx')),
  'CARD_CAROUSEL_FLAT_QUERY',
).replaceAll(' ', '_')}]`;

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

  it('multiplies the pixel by THE ZOOM — 1 unless a box says otherwise, and TWO boxes say otherwise: DoctorStats’ tiles at 9/8, and the Home articles band’s flat row at the tiles’ zoom over its miniature’s share', () => {
    expect(pixel.zoom).toBe('--band-zoom');
    expect(pixel.zoomDefault).toBe(1);
    // Assembled from parts, never one literal (THE D-LIT RULE's spirit).
    const opener = `[${pixel.zoom}:`;
    const setters = productFiles
      .filter((name) => tsCode(read(`src/${name}`)).includes(opener))
      .toSorted();
    expect(setters).toEqual([
      'components/sections/BlogCarousel/BlogCarousel.tsx',
      'components/sections/DoctorStats/DoctorStats.tsx',
    ]);
    const stats = tsCode(
      read('src/components/sections/DoctorStats/DoctorStats.tsx'),
    );
    const at = stats.indexOf(opener) + opener.length;
    // 9/8: a tile's sentence (text-base, 16) reads the doctor card's quote
    // (text-lg, 18) — the owner's "1 to 1" — and the tile keeps its ratios.
    const tiles = Number(stats.slice(at, stats.indexOf(']', at)));
    expect(tiles).toBe(9 / 8);
    // THE FLAT ROW (2026-10-25, sections/BlogCarousel's paragraph of that
    // name — the owner: the card's text "must also always mentain text wise
    // the size of "Peste 8000 de zâmbete…"", a tile's sentence): from a
    // tablet's screen up the box round the carousel draws in the tiles' zoom
    // over its cards' miniature share, so a miniature's summary (text-base ×
    // the share) IS a tile's sentence. Its value, read where it lives, is
    // that quotient — DoctorStats' number over BlogCarousel's MINIATURE — and
    // it rides the flat row's query alone, never the line's.
    const band = tsCode(
      read('src/components/sections/BlogCarousel/BlogCarousel.tsx'),
    );
    const share = Number(/\bconst MINIATURE = ([\d.]+);/.exec(band)?.[1]);
    expect(share).toBe(0.65);
    const from = band.indexOf(opener) + opener.length;
    const value = band.slice(from, band.indexOf(']', from));
    expect(value).toBe(`calc(${tiles}/${share})`);
    // ONE zoom class in the band, read whole: behind THE FLAT ROW'S VARIANT,
    // the carousel's own query, and behind nothing else.
    expect(wholeTokens(band, opener)).toEqual([
      `${FLAT_ROW}:${opener}${value}]`,
    ]);
  });

  it('never lets a pixel fall under THE FLOOR — 0px unless a band says otherwise, and ONE says otherwise, at 1rem / 16: the price list', () => {
    expect(pixel.floor).toBe('--band-floor');
    expect(pixel.floorDefault).toBe('0px');
    // Assembled from parts, never one literal (THE D-LIT RULE's spirit).
    const opener = `[${pixel.floor}:`;
    const setters = productFiles
      .filter((name) => tsCode(read(`src/${name}`)).includes(opener))
      .toSorted();
    // The price list alone. The Home articles band held its carousel's
    // miniatures to the same floor from 2026-10-17 (§15.39 round 4) and let
    // it go on 2026-10-26: its flat row now takes every fine-pointer window
    // from a tablet's width up, so the band scale — the floor's one reader —
    // never meets its line, and in the row the floor was already taken off
    // again (sections/BlogCarousel's THE FLAT ROW). Both classes changed
    // nothing, and left with the dead code they had become.
    expect(setters).toEqual(['components/sections/PriceList/PriceList.tsx']);
    // 1rem / 16: the theme's own pixel at ANY root — the price rows never
    // draw smaller than the theme (the owner's delegated decision, §15.32
    // round 2), and a larger root lifts the floor with it. ONE class, read
    // whole: bare, behind no variant.
    expect(
      wholeTokens(
        tsCode(read('src/components/sections/PriceList/PriceList.tsx')),
        opener,
      ),
    ).toEqual([`${opener}0.0625rem]`]);
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

  it('is the ONLY product file in src/ that declares the BAND’s design pixel or spells its remap — sections/PostCard’s card-relative chip pixel and sections/PostCover’s capped copy of it the two sanctioned others — and every band of Home, Team, the price list, a doctor’s page, the blog’s list and a blog article wears it by IMPORTING both strings', () => {
    const spellers = productFiles
      .filter((name) =>
        /design-scale|--scale-px/.test(tsCode(read(`src/${name}`))),
      )
      .toSorted();
    // THE BAND SCALE is spelled once, in ui/Container. The three other
    // spellers are NOT band scales: sections/PostCard's chips draw in a pixel
    // of their own CARD (THE CHIPS' PIXEL, the next `it`), sections/
    // PostCover's in the same pixel of its COVER, capped at the page's (THE
    // COVER'S CHIPS, the `it` after it), and since 2026-10-25 the Home
    // articles band's FLAT ROW draws its carousel, where the band scale does
    // not apply, in the theme's pixel over its miniature's share — so a
    // card's summary reads a tile's 1rem sentence (THE FLAT ROW'S PIXEL, the
    // `it` after those).
    expect(spellers).toEqual([
      'components/sections/BlogCarousel/BlogCarousel.tsx',
      'components/sections/PostCard/PostCard.tsx',
      'components/sections/PostCover/PostCover.tsx',
      'components/ui/Container/Container.tsx',
    ]);
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

  it('lets ONE card draw in a pixel of its own — sections/PostCard’s chips: the card’s width over the owner’s 723px reference, floored at a 12px label, behind the container-units guard (THE CHIPS’ PIXEL)', () => {
    // The owner (2026-10-14): "the perfect ratio of photo - menu item category
    // … is at 723px x 1123 px". The chip list redraws its theme lengths in a
    // pixel of its CARD (`100cqw` — the card's content box, 513.40625px at
    // that window behind a classic scrollbar), never of the band; a label
    // under 12px is refused (`0.75rem / 18`); an engine without container
    // units keeps the theme's chips (`supports-[width:1cqw]:`, Safari 15).
    // Ungated by `scalable:` — it holds on phones and touch tablets too.
    // THE MINIATURE (2026-10-17 — the owner's Home cards at "65% of the
    // height", PostCard's paragraph of that name) adds the card's SECOND
    // spelling, sanctioned here: the card's own wrapper round ui/Card (a
    // miniature's alone — ui/Card's className stays its placement, §6.8)
    // redrawn in a pixel the <article> captures — the spacing step it
    // INHERITS over four, times the share —
    // never the band's and never `--scale-px` read back (the cover's
    // `--tags-cap` idiom, the next case), so no regime gate either: it is a
    // calc of the inherited step, which every engine computes. Its chips'
    // pixel rides INLINE (a style object, no class — the tag list's class
    // stays CHIP_SCALE byte for byte, tests/unit/blog-tags-sync.test.ts), so
    // no token of it stands here.
    // Assembled from parts, never one literal (THE D-LIT RULE).
    const card = tokensOf(
      tsCode(read('src/components/sections/PostCard/PostCard.tsx')),
    ).filter(
      ({ utility }) =>
        utility === 'design-scale' || arbitrary(utility)?.name === PIXEL,
    );
    expect(
      card.map(({ variants, utility }) => [...variants, utility].join(':')),
    ).toEqual([
      `supports-[width:1cqw]:[${PIXEL}:max(calc(0.75rem/18),calc(100cqw/513.40625))]`,
      'supports-[width:1cqw]:design-scale',
      `[${PIXEL}:var(--miniature-px)]`,
      'design-scale',
    ]);
  });

  it('lets ONE cover wear the card’s chip pixel, capped at the page’s own — sections/PostCover’s tags: the card’s formula verbatim inside `min(var(--tags-cap), …)`, behind the same guard; the cap read off the page’s spacing step, never off the pixel (THE COVER’S CHIPS)', () => {
    // The owner (2026-10-15): "reuse all component from it that have been
    // patched on the other branch". The article's cover wears sections/
    // PostCard's tag list whole (tests/unit/blog-tags-sync.test.ts holds the
    // two files together); its chips draw in the card's pixel measured
    // against the COVER, which spans the page's column, so the pixel is
    // capped at the page's own — the band's design pixel inside the scale,
    // the theme's 0.0625rem outside it — or a 1401 window would draw 94.8px
    // chips. Ungated by `scalable:`, like the card's. Assembled from parts,
    // never one literal (THE D-LIT RULE).
    const coverCode = tsCode(
      read('src/components/sections/PostCover/PostCover.tsx'),
    );
    const cover = tokensOf(coverCode).filter(
      ({ utility }) =>
        utility === 'design-scale' || arbitrary(utility)?.name === PIXEL,
    );
    expect(
      cover.map(({ variants, utility }) => [...variants, utility].join(':')),
    ).toEqual([
      `supports-[width:1cqw]:[${PIXEL}:min(var(--tags-cap),max(calc(0.75rem/18),calc(100cqw/513.40625)))]`,
      'supports-[width:1cqw]:design-scale',
    ]);
    // THE CAP'S READ: the page's spacing step over four, captured on the
    // tag list's parent — never `--scale-px` itself, which outside the band
    // scale is 1px at any root and would cut under the 12px label's floor
    // above a 24px root (PostCover's THE TAGS). So the cover names the
    // design pixel exactly once in its code — its declaration — and the
    // card likewise: the two chip pixels read no other pixel.
    const capture = tokensOf(coverCode).filter(
      ({ utility }) => arbitrary(utility)?.name === '--tags-cap',
    );
    expect(
      capture.map(({ variants, utility }) => [...variants, utility].join(':')),
    ).toEqual(['[--tags-cap:calc(var(--spacing)/4)]']);
    expect(coverCode.split(PIXEL).length - 1).toBe(1);
    // The card names it THREE times since THE MINIATURE (2026-10-17), each a
    // DECLARATION: its chips' class, its miniature's remap on the wrapper
    // round ui/Card (the previous case) and its miniature's chips, inline — and READS it
    // nowhere: the miniature's pixel is captured from the inherited spacing
    // step, the cover's idiom above.
    const cardCode = tsCode(
      read('src/components/sections/PostCard/PostCard.tsx'),
    );
    expect(cardCode.split(PIXEL).length - 1).toBe(3);
    expect(cardCode).not.toContain(`var(${PIXEL})`);
  });

  it('lets ONE band draw its carousel in the flat row’s pixel — the Home articles band: the theme’s pixel over its miniature’s share, from a tablet’s screen up, where no band scale applies (THE FLAT ROW’S PIXEL)', () => {
    // The owner (2026-10-25): the card's text "must also always mentain text
    // wise the size of "Peste 8000 de zâmbete…"" — a tile's sentence, 1rem
    // where the band scale does not apply. A miniature's summary is 1rem ×
    // its share in the pixel it inherits, so the box round the carousel
    // declares 1rem / 16 / the share: the summary is 1rem again. Inside the
    // regime the carousel's own box re-declares the band's pixel at the
    // tiles' zoom over the share (THE ZOOM above), whose `design-scale`
    // overrides this one for its subtree — so no rule order decides. Behind
    // the flat row's query alone: the phone's line keeps the theme's pixel.
    // Assembled from parts, never one literal (THE D-LIT RULE).
    const code = tsCode(
      read('src/components/sections/BlogCarousel/BlogCarousel.tsx'),
    );
    const row = tokensOf(code).filter(
      ({ utility }) =>
        utility === 'design-scale' || arbitrary(utility)?.name === PIXEL,
    );
    const share = Number(/\bconst MINIATURE = ([\d.]+);/.exec(code)?.[1]);
    expect(share).toBe(0.65);
    expect(
      row.map(({ variants, utility }) => [...variants, utility].join(':')),
    ).toEqual([
      `${FLAT_ROW}:[${PIXEL}:calc(1rem/16/${share})]`,
      `${FLAT_ROW}:design-scale`,
    ]);
    // It declares the pixel once and reads it nowhere.
    expect(code.split(PIXEL).length - 1).toBe(1);
    expect(code).not.toContain(`var(${PIXEL})`);
  });

  /** THE STEP'S SIZE (ui/Heading's 'hero-scaled' JOINED, 2026-10-15): the
   *  one size class the regime's chain carries, spelled whole in ui/Heading
   *  alone — `hero`'s value at the owner's 1401 window, 16 + 3.5 × 14.01 =
   *  65.035px, as 16.26 spacing steps, 65.04 design pixels. A byte pin of a
   *  WORN class, so it ships no rule of its own; its bare utility is never
   *  written here whole (THE D-LIT RULE — the census below derives it). */
  const STEP_SIZE =
    'scalable:@4xl:@min-[896px]:text-[length:calc(var(--spacing)*16.26)]';
  /** The one product file that spells it. */
  const HEADING = 'components/ui/Heading/Heading.tsx';
  /** The three <h1>s that ask for the step, each through ONE `<Heading
   *  size="hero-scaled" asChild>` around it — every page <h1> of a band that
   *  scales (the step's own THE PRECONDITION): the doctor page's name, the
   *  page hero's heading (the blog list's, and the Team page's since it moved
   *  out of sections/PostList on 2026-10-15) and an article's title. */
  const STEP_ASKERS = [
    'components/sections/DoctorIntro/DoctorIntro.tsx',
    'components/sections/PageHero/PageHero.tsx',
    'components/sections/PostHeader/PostHeader.tsx',
  ];

  /** Every product file's code, its comments stripped (`tsCode`) — what the
   *  two censuses below read. */
  const productCode = (): Map<string, string> =>
    new Map(productFiles.map((name) => [name, tsCode(read(`src/${name}`))]));

  /** THE STEP'S NAME, wherever code spells it: `hero-scaled` itself, and
   *  every `-scaled` that OPENS a string piece — right after a quote, a
   *  backtick or the `}` closing a template's gap — the half a computed
   *  spelling appends to `hero`: `` size={`hero${scaled ? '-scaled' : ''}`} ``
   *  passes tsc and was no ask to the literal-only census of 2026-10-15 (the
   *  G2 typescript review, 2026-10-20, measured on a scratch copy). A
   *  `-scaled` after a word (a `data-` attribute's name) or after an
   *  operator (a negated number called `scaled`) builds no name and is not
   *  counted. Measured that day: in product code the step's name stands in
   *  ui/Heading (its type and its row) and in its three asks, and no other
   *  `-scaled` stands anywhere. A name built with no `-scaled` piece at all —
   *  `'hero-'` and a bare `'scaled'` joined — is past this text census. */
  const STEP_NAME = /hero-scaled|(?<=['"`}])-scaled/g;

  /** Code read as JSX STRUCTURE: every string literal emptied, but a JSX
   *  attribute's own value — a quoted string written straight after ` name=`
   *  that holds no markup. `tsCode` keeps string literals, so an ask kept IN
   *  A STRING (`'<Heading size="hero-scaled"><h1>'`) read to the census of
   *  2026-10-15 as an ask around an <h1> (the G2 typescript review,
   *  2026-10-20); emptied, it is markup no more, while the real
   *  `size="hero-scaled"` on a real tag survives. A template literal is never
   *  an attribute's value (JSX takes one only in braces), so it is always
   *  emptied. Its one input is `tsCode`'s output: no comment is left in it to
   *  hide a quote. */
  const jsxOf = (code: string): string =>
    code.replace(
      /'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g,
      (literal: string, offset: number) =>
        literal[0] !== '`' &&
        !/[<>]/.test(literal) &&
        /\s[\w-]+=$/.test(code.slice(Math.max(0, offset - 64), offset))
          ? literal
          : `${literal[0]}${literal[0]}`,
    );

  /**
   * EVERY WAY THE STEP'S SIZE CAN ROT, as words — empty when it holds (the
   * `audit` shape above, so the teeth test below can feed it a broken tree):
   * the size worn anywhere but ui/Heading, under the regime's chain, another
   * or none; a second size behind the gate (another font-size arbitrary
   * value with the length hint — the 56 design pixels of one afternoon,
   * 2026-10-15); ui/Heading spelling the size other than exactly once; one of
   * the three <h1>s not asking for the step around it; an asker naming the
   * step ANYWHERE ELSE — a second ask, on an <h2> or on nothing, or a piece
   * that builds one — since its one <h1> is its only ask: each of the three
   * names the step exactly once in all, and that once is the ask on the
   * <Heading> around its <h1>, the attributes in any order; and a fourth
   * file naming the step at all, literally or through a `-scaled` piece
   * (STEP_NAME). Every file is read as code — an ask or a class left in a
   * comment is neither — and the ask around the <h1> as JSX STRUCTURE
   * (`jsxOf`), so markup kept in a string is none either. (A class left in a
   * comment is not nothing to Tailwind, which reads every source file as
   * text: this comment names the arbitrary value in words, so it ships no
   * rule of its own.)
   */
  const stepCensus = (code: ReadonlyMap<string, string>): string[] => {
    const problems: string[] = [];
    const size = parse(STEP_SIZE).utility;
    for (const [name, text] of code) {
      for (const { variants, utility } of tokensOf(text)) {
        const spelled = [...variants, utility].join(':');
        const gatedSize =
          variants.includes('scalable') && utility.startsWith('text-[length:');
        if (utility !== size && !gatedSize) continue;
        if (name !== HEADING) {
          problems.push(
            `${name}: wears ${spelled} — a size behind the gate is ui/Heading’s step’s alone`,
          );
        } else if (spelled !== STEP_SIZE) {
          problems.push(`${name}: spells ${spelled}, not the step’s size`);
        }
      }
    }
    const once = tokensOf(code.get(HEADING) ?? '').filter(
      ({ variants, utility }) => [...variants, utility].join(':') === STEP_SIZE,
    ).length;
    if (once !== 1) {
      problems.push(`${HEADING}: spells the step’s size ${once} times`);
    }
    for (const [name, text] of code) {
      if (name === HEADING) continue;
      const named = text.match(STEP_NAME) ?? [];
      if (!STEP_ASKERS.includes(name)) {
        if (named.length > 0) {
          problems.push(
            `${name}: names the step (${named.join(', ')}) — not one of its <h1>s`,
          );
        }
        continue;
      }
      const around = [
        ...jsxOf(text).matchAll(
          /<Heading\b[^>]*\bsize="hero-scaled"[^>]*>\s*<h1\b/g,
        ),
      ].length;
      if (named.length !== 1 || around !== 1) {
        problems.push(
          `${name}: names the step ${named.length}×, ${around}× as the ask on a <Heading> around an <h1> — it may name it once, as that ask`,
        );
      }
    }
    for (const name of STEP_ASKERS) {
      if (!code.has(name)) problems.push(`${name}: not in the tree`);
    }
    return problems;
  };

  it('lets the GATE CHAIN be re-spelled only where Tailwind needs a literal of its own — and only as the regime’s chain', () => {
    // A class that must follow the regime but is none of its strings — the
    // staff tile's width and its row's gap, the doctors band's ribbon drawn
    // 30 % thinner (DoctorShowcase D11, §15.26 round 6), the page hero's
    // three (sections/PageHero's THE STAIRWAY and THE HEADING'S REACH — the
    // blog list's hero, CLAUDE.md §15.39, shared with the Team page since
    // 2026-10-15): the pre-line white-space its two blocks wear, the <h1>'s
    // max-content width and that width's cap, the column plus 135 design
    // pixels a side — and ui/Heading's `hero-scaled` step, the size of every
    // page <h1> of a band that scales (its header's 'hero-scaled' JOINED,
    // 2026-10-15: `hero` reads the viewport, the one size the remap cannot
    // redraw) — spells the chain itself, because Tailwind reads class names
    // from source text. Every such token must carry the SAME chain, gate
    // first, so a tile can never switch at another width than the band (the
    // step's size reads the nearest size container: for the page hero's
    // <h1> and an article's title ui/Container's own column, as the regime's
    // classes on their band's rhythm box do — PostHeader's NO `@container`
    // HERE; for the doctor page's name the opener's own box, capped at 96rem,
    // so for it that holds at any root of 9⅓px or more — DoctorIntro's THE
    // NAME and ui/Heading's THE BOUND record the bound). The gate is looked
    // for ANYWHERE in a chain (a reordered `@4xl:scalable:` is caught as
    // itself) and in backtick literals too (the Opus review's census probe).
    const chain = regime[0]?.variants ?? [];
    const code = productCode();
    const gatedTokens = [...code].flatMap(([name, text]) =>
      tokensOf(text)
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
      'components/sections/PageHero/PageHero.tsx',
      'components/sections/TeamRoster/TeamRoster.tsx',
      'components/ui/Container/Container.tsx',
      HEADING,
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
    // The page hero's three (sections/PageHero's THE STAIRWAY and THE
    // HEADING'S REACH — the blog list's hero until 2026-10-15, when it moved
    // out of sections/PostList to open the Team page too): both hero blocks
    // keep the copy's own line breaks behind the chain (the pre-line
    // white-space, spelled once, in PageHero.tsx's STAIRWAY constant, and
    // worn twice — on the <h1> and on the lead, which this census of source
    // literals cannot see: PageHero.test.tsx holds it, the one white-space
    // token on each block and the lead's one gated class), and the <h1> as
    // wide as its longest line up to the column's full width plus 67.5
    // spacing steps — 135 design pixels a side since 2026-10-16, 100 until
    // then (PageHero's THE HEADING'S REACH: the fallback face's layout
    // shift). Its SIZE is not the hero's to spell: the <h1> asks for
    // ui/Heading's `hero-scaled` step (the census below). The blog list's
    // grid needs no token of its own: its three columns start at the
    // Container's `@4xl`, the regime's own step — so sections/PostList itself
    // spells none, nor does sections/DoctorShowcase for the hero it composes
    // on the Team page (its one token above).
    expect(
      gatedTokens
        .filter(({ name }) => name.endsWith('PageHero.tsx'))
        .map(({ variants, utility }) => [...variants, utility].join(':')),
    ).toEqual([
      'scalable:@4xl:@min-[896px]:whitespace-pre-line',
      'scalable:@4xl:@min-[896px]:w-max',
      'scalable:@4xl:@min-[896px]:max-w-[calc(100%+var(--spacing)*67.5)]',
    ]);
    // ui/Heading's one: the `hero-scaled` step's size — the `hero` step's
    // value at the owner's 1401 window, 16 + 3.5 × 14.01 = 65.035px, as 16.26
    // spacing steps, so inside the scale every page <h1> of a band that
    // scales is that design size × s like everything round it. In the
    // SPACING step, never in `--scale-px`, which only ui/Container may name
    // (the test above).
    expect(
      gatedTokens
        .filter(({ name }) => name === HEADING)
        .map(({ variants, utility }) => [...variants, utility].join(':')),
    ).toEqual([STEP_SIZE]);
    // THE STEP'S SIZE, SPELLED ONCE (stepCensus above): the size token in
    // exactly ONE product file, ui/Heading; the doctor page's name, the page
    // hero's heading and an article's title each asking for
    // `size="hero-scaled"` around their <h1> and naming the step nowhere
    // else, read as code with the comments stripped and the ask as JSX, never
    // as markup in a string; no other file naming the step, literally or
    // through a `-scaled` piece; and nothing else in src/ wearing the size,
    // under any chain or none, nor a second size behind the gate. History,
    // 2026-10-13 to -15: the doctor's name spelled this class on its own <h1>
    // (§15.32 round 4); the blog list's heading took it byte for byte — after
    // a few hours on 14 steps of its own, until the owner took that back,
    // verbatim: "tbh i kinda liked it how it looked before. so if it is
    // larger but still fits in page and looks good it should not be
    // constrained by a div so that it has same space left and right as the
    // articles seciton", so the room came from the heading's reach, never
    // from its size — and an article's title made a THIRD consumer, the
    // trigger this census had booked for a sibling step in ui/Heading. The
    // step joined; the three ask for it — the list's heading through
    // sections/PageHero since that hero also opens the Team page
    // (2026-10-15), still ONE asker, however many pages wear it.
    expect(stepCensus(code)).toEqual([]);
  });

  it('has a step-size census with teeth — a re-spelled size, a bare one, a second size behind the gate, a lost ask, an ask left in a comment or kept in a string, a second ask, a fourth asker, a name built from a `-scaled` piece and a step that spells none are each named; an ask with its attributes in another order and a `-scaled` that builds no name are not', () => {
    // The real tree first, so the census is never vacuous: it holds, and the
    // one speller and the three askers are all in it.
    const real = productCode();
    expect(stepCensus(real)).toEqual([]);
    for (const name of [HEADING, ...STEP_ASKERS]) {
      expect(real.has(name), name).toBe(true);
    }
    /** The real tree with ONE file's RAW source edited, then read as code —
     *  comments stripped as the census strips them. */
    const edited = (
      name: string,
      edit: (raw: string) => string,
    ): Map<string, string> =>
      new Map(real).set(name, tsCode(edit(read(`src/${name}`))));
    const [doctor, hero, article] = STEP_ASKERS;
    // Assembled at run time from the worn class, never written whole (THE
    // D-LIT RULE: a bare or a second size spelled here would ship a rule).
    const size = parse(STEP_SIZE).utility;
    const quote = "'";
    const probe = 'components/sections/Probe/Probe.tsx';
    const cases: readonly (readonly [string, Map<string, string>, string])[] = [
      [
        'the size re-spelled on a consumer’s <h1>',
        edited(doctor, (raw) =>
          raw.replace('<h1 className="', `<h1 className="${STEP_SIZE} `),
        ),
        doctor,
      ],
      [
        'the size bare, under no chain',
        edited(hero, (raw) => `${raw}\nconst B = ${quote}${size}${quote};`),
        hero,
      ],
      [
        'a second size behind the gate',
        edited(
          hero,
          (raw) =>
            `${raw}\nconst G = ${quote}${STEP_SIZE.replace('16.26', '14')}${quote};`,
        ),
        hero,
      ],
      [
        'the bare `hero` asked for instead',
        edited(hero, (raw) =>
          raw.replaceAll('size="hero-scaled"', 'size="hero"'),
        ),
        hero,
      ],
      [
        'the ask left only in a comment',
        edited(article, (raw) =>
          raw.replace(
            '<Heading size="hero-scaled" asChild>',
            '{/* <Heading size="hero-scaled" asChild> */}<Heading size="hero" asChild>',
          ),
        ),
        article,
      ],
      [
        // The G2 typescript review's mutant, 2026-10-20: an asker's <h1> on
        // the bare `hero`, the ask kept as markup in a string — which
        // `tsCode` keeps, so the census of 2026-10-15 read one ask around an
        // <h1> and stayed green (`jsxOf` empties the string).
        'the ask kept in a string, the <h1> on the bare `hero`',
        edited(
          hero,
          (raw) =>
            `${raw.replaceAll('size="hero-scaled"', 'size="hero"')}\nconst M = ${quote}<Heading size="hero-scaled" asChild><h1>${quote};`,
        ),
        hero,
      ],
      [
        // The same markup as an attribute's VALUE: a quoted string after
        // ` name=`, kept by `jsxOf` only when it holds no markup.
        'the ask kept in an attribute’s string, the <h1> on the bare `hero`',
        edited(
          article,
          (raw) =>
            `${raw.replaceAll('size="hero-scaled"', 'size="hero"')}\nexport const A = () => <i title=${quote}<Heading size="hero-scaled" asChild><h1>${quote} />;`,
        ),
        article,
      ],
      [
        // The review's second mutant: the <h1>'s ask kept, and the step asked
        // for AGAIN — on an <h2> — in the same file (DoctorIntro's own suite
        // caught it; this census did not).
        'a second ask in an asker’s file',
        edited(
          doctor,
          (raw) =>
            `${raw}\nexport const H = () => (<Heading size="hero-scaled" asChild><h2>T</h2></Heading>);`,
        ),
        doctor,
      ],
      [
        'a fourth file asking for the step',
        new Map(real).set(
          probe,
          tsCode(
            'export const P = () => (<Heading size="hero-scaled" asChild><h1>T</h1></Heading>);',
          ),
        ),
        probe,
      ],
      [
        // The review's third mutant: the name COMPUTED — passes tsc, and the
        // literal-only census of 2026-10-15 saw no ask in it.
        'a fourth file building the name in a template literal',
        new Map(real).set(
          probe,
          tsCode(
            'export const P = ({ scaled }: { scaled: boolean }) => (<Heading size={`hero${scaled ? "-scaled" : ""}`} asChild><h2>T</h2></Heading>);',
          ),
        ),
        probe,
      ],
      [
        'a fourth file building the name by concatenation',
        new Map(real).set(
          probe,
          tsCode(
            "export const P = () => (<Heading size={('hero' + '-scaled') as HeadingSize} asChild><h2>T</h2></Heading>);",
          ),
        ),
        probe,
      ],
      [
        'a step that spells no size',
        edited(HEADING, (raw) => raw.replaceAll(STEP_SIZE, '')),
        HEADING,
      ],
    ];
    for (const [what, tree, file] of cases) {
      // Each mutation really changed what the census reads…
      expect(tree.get(file), what).not.toBe(real.get(file));
      // …and is named, once, by the file it broke.
      const problems = stepCensus(tree);
      expect(problems, what).toHaveLength(1);
      expect(problems[0], what).toContain(file);
    }
    // …and what is no ask, or the same ask, names nothing: the attributes in
    // another order (sections/Wordmark writes `asChild` first — the same
    // element), and every `-scaled` that builds no name (STEP_NAME) — a `data-`
    // attribute's name, a negated number called `scaled`, and the bands'
    // own `scaled` flag beside them.
    const holds: readonly (readonly [string, Map<string, string>, string])[] = [
      [
        'the ask with its attributes in another order',
        edited(article, (raw) =>
          raw.replace(
            '<Heading size="hero-scaled" asChild>',
            '<Heading asChild size="hero-scaled">',
          ),
        ),
        article,
      ],
      [
        'a `-scaled` that builds no name',
        new Map(real).set(
          probe,
          tsCode(
            'export const P = ({ scaled }: { scaled: number }) => (<div data-scaled="" style={{ marginTop: -scaled }}><ClinicLocation scaled /></div>);',
          ),
        ),
        probe,
      ],
    ];
    for (const [what, tree, file] of holds) {
      expect(tree.get(file), what).not.toBe(real.get(file));
      expect(stepCensus(tree), what).toEqual([]);
    }
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

  it('lets TWO boxes set the zoom, once each — no other product code names `--band-zoom` but ui/Container’s own read', () => {
    // An unregistered custom property INHERITS: a setter on any wrapping box
    // would rescale every band inside it. So outside ui/Container's
    // `var(--band-zoom,1)` read and its two setters' one class each (the zoom
    // test above) — DoctorStats' tiles, and the Home articles band's box
    // round its carousel alone, in its flat row (2026-10-25) — no product
    // code may name it: class, inline style or CSS. What it reads: every
    // .ts/.tsx file under src/ and globals.css — a new .css or .jsx file
    // would escape it (none exists; widen the readers with one).
    const name = pixel.zoom;
    const offenders = productFiles.filter((file) => {
      const code = tsCode(read(`src/${file}`));
      const uses = code.split(name).length - 1;
      if (file === 'components/ui/Container/Container.tsx') return uses !== 1;
      if (file === 'components/sections/DoctorStats/DoctorStats.tsx')
        return uses !== 1;
      if (file === 'components/sections/BlogCarousel/BlogCarousel.tsx')
        return uses !== 1;
      return uses !== 0;
    });
    expect(offenders).toEqual([]);
    // …nor the stylesheet: a `:root` declaration would scale every band.
    expect(cssCode(globals).split(name).length - 1, 'globals.css').toBe(0);
  });

  it('lets ONE band set the floor — the price list, once — no other product code names `--band-floor` but ui/Container’s own read', () => {
    // Unregistered and INHERITED like the zoom: a setter on any wrapping box
    // would lift every band inside it. So outside ui/Container's
    // `var(--band-floor,0px)` read and its one setter (the floor test above),
    // the price list's one class on its rhythm box — the Home articles band's
    // two, its floor and its flat row's reset of it, left on 2026-10-26 — no
    // product code may name it: class, inline style or CSS (read as the
    // zoom's fence reads them: .ts/.tsx under src/ and globals.css).
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

  it('lets no scanned file spell a design pixel’s declaration but as its one wearer’s class — ui/Container’s, sections/PostCard’s chip pixel and sections/PostCover’s capped one (THE D-LIT RULE)', () => {
    // Tailwind scans comments and tests too, so a bracketed declaration in
    // any other spelling would ship a rule nobody wears. Every occurrence in
    // src/, tests/ and .storybook/ — raw text, comments included — must be
    // ui/Container's own regime class, whole, or a chip pixel in its own
    // file: PostCard's in PostCard.tsx, PostCover's in PostCover.tsx (below).
    // Never vacuous: Container's own source is among the occurrences.
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
        for (const token of wholeTokens(text, opener)) {
          found.push(`${root}${name}: ${token}`);
        }
      }
    }
    // The other declarations allowed are the chip pixels — sections/
    // PostCard's (THE CHIPS' PIXEL above) and sections/PostCover's capped
    // copy of it (THE COVER'S CHIPS above) — since 2026-10-17 the card's
    // second, its MINIATURE's remap on the wrapper round ui/Card (THE CHIPS'
    // PIXEL's case names it), and since 2026-10-25 the Home articles band's
    // FLAT ROW pixel (THE FLAT ROW'S PIXEL above): each whole, in its own
    // file alone — two in the card's, one in the cover's, one in the band's.
    const ownsOf = (file: string): string[] =>
      tokensOf(tsCode(read(file)))
        .map(({ variants, utility }) => [...variants, utility].join(':'))
        .filter((token) => token.includes(opener));
    const chipFiles = [
      'src/components/sections/PostCard/PostCard.tsx',
      'src/components/sections/PostCover/PostCover.tsx',
      'src/components/sections/BlogCarousel/BlogCarousel.tsx',
    ];
    const chipOwn = chipFiles.flatMap((file) =>
      ownsOf(file).map((token) => `${file}: ${token}`),
    );
    expect(own).toBeDefined();
    expect(chipFiles.map((file) => ownsOf(file).length)).toEqual([2, 1, 1]);
    expect(found.length).toBeGreaterThan(0);
    expect(
      found.filter(
        (entry) =>
          !entry.endsWith(`: ${own ?? ''}`) && !chipOwn.includes(entry),
      ),
    ).toEqual([]);
  });

  it('lets no scanned file spell a floor or a zoom setter but as its wearers’ one class, whole (THE D-LIT RULE, the setters)', () => {
    // The same reason, for the two variables a band may set (the G2
    // typescript review): a stale literal in a test or a story — say the old
    // value after the wearer's changed — would ship a rule nobody wears.
    const setterOf = (file: string, name: string): string => {
      const code = tsCode(read(`src/${file}`));
      const at = code.indexOf(`[${name}:`);
      return at === -1 ? '' : code.slice(at, code.indexOf(']', at) + 1);
    };
    // THE FLAT ROW (2026-10-25): the Home articles band's box round its
    // carousel sets the zoom once more, from a tablet's screen up — at the
    // tiles' over its miniature's share (THE ZOOM above) — a whole class of
    // its own behind THE FLAT ROW'S VARIANT. (It set the floor too, the price
    // list's very class and the row's reset of it, until 2026-10-26: THE
    // FLOOR above.) Every spelling below is read WHOLE, with the variant
    // chain it rides behind (the G2 typescript review, 2026-10-26: read from
    // its bracket alone, a row value behind another variant, or behind none,
    // passed — and would ship a rule nobody wears), and the row's class is
    // allowed in the band's own file alone.
    const band = 'components/sections/BlogCarousel/BlogCarousel.tsx';
    const rowOf = (name: string): string[] =>
      tokensOf(tsCode(read(`src/${band}`)))
        .filter(
          ({ variants, utility }) =>
            variants.length > 0 && arbitrary(utility)?.name === name,
        )
        .map(({ variants, utility }) => [...variants, utility].join(':'));
    const rowZoom = rowOf(pixel.zoom);
    expect(rowZoom).toEqual([`${FLAT_ROW}:[${pixel.zoom}:calc(1.125/0.65)]`]);
    const cases = [
      {
        name: pixel.floor,
        own: setterOf(
          'components/sections/PriceList/PriceList.tsx',
          pixel.floor,
        ),
        row: [] as string[],
      },
      {
        name: pixel.zoom,
        own: setterOf(
          'components/sections/DoctorStats/DoctorStats.tsx',
          pixel.zoom,
        ),
        row: rowZoom,
      },
    ];
    for (const { name, own, row } of cases) {
      // The wearer may assemble its class from parts (the price list does);
      // then its code holds no whole literal and the value is the census's.
      const opener = `[${name}:`;
      const found: { path: string; token: string }[] = [];
      for (const root of ['src/', 'tests/', '.storybook/']) {
        for (const file of readdirSync(new URL(root, REPO), {
          recursive: true,
          encoding: 'utf8',
        })) {
          if (!/\.(ts|tsx|mts|mjs|js|css|mdx)$/.test(file)) continue;
          const path = `${root}${file.replaceAll('\\', '/')}`;
          for (const token of wholeTokens(read(path), opener)) {
            found.push({ path, token });
          }
        }
      }
      const expected =
        own ||
        (name === pixel.floor ? `[${name}:0.0625rem]` : `[${name}:1.125]`);
      expect(
        found
          .filter(
            ({ path, token }) =>
              token !== expected &&
              !(path === `src/${band}` && row.includes(token)),
          )
          .map(({ path, token }) => `${path}: ${token}`),
        `every ${opener}…] in a scanned file, read whole`,
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

  it('derives the blog conclusion’s CIRCLE_SIZES the same way — its picture 165 % of the circle’s 28 steps, 184.8px, scaled in the article’s band (sections/PostConclusion’s THE `sizes`)', () => {
    // Until 2026-10-20 the string was pinned only by a copy of itself (the
    // react and typescript reviews): every number now read where it lives —
    // the circle's ceiling and the crop's share in the conclusion, the band's
    // numbers here.
    const conclusion = tsCode(
      read('src/components/sections/PostConclusion/PostConclusion.tsx'),
    );
    /** A `const NAME = '…';` of the conclusion — its string may sit on the
     *  next line. */
    const string = (name: string): string => {
      const value = new RegExp(`\\bconst ${name} =\\s*'([^']*)';`).exec(
        conclusion,
      )?.[1];
      if (value === undefined) {
        throw new Error(`no ${name} in sections/PostConclusion`);
      }
      return value;
    };
    const circleSizes =
      /^\(min-width: (\d+)rem\) and (\(pointer: fine\)) (\d+)vw, ([\d.]+)rem$/.exec(
        string('CIRCLE_SIZES'),
      );
    // The circle at its full size — its clamp's ceiling, in spacing steps —
    // and the crop's width, a share of the circle: the picture's box.
    const ceiling = Number(
      /,calc\(var\(--spacing\)\*(\d+)\)\)\]/.exec(string('CIRCLE'))?.[1],
    );
    const share =
      Number(
        /(?:^|\s)w-\[(\d+(?:\.\d+)?)%\](?:\s|$)/.exec(string('CROP'))?.[1],
      ) / 100;
    const picture = ceiling * (steps.get('--spacing') ?? NaN) * share;
    expect(ceiling).toBe(28);
    expect(share).toBe(1.65);
    expect(picture).toBeCloseTo(184.8, 10);
    expect(circleSizes).not.toBeNull();
    // A mouse is asked for the scaled picture, ceil(100 × 184.8 × 0.8 /
    // REFERENCE) vw = 14, from the window whose column is the step, under the
    // gate's own pointer condition; everywhere else for the picture itself.
    expect(Math.ceil((100 * picture * column) / reference)).toBe(
      Number(circleSizes?.[3]),
    );
    expect(stepRem / column).toBe(Number(circleSizes?.[1]));
    expect(circleSizes?.[2]).toBe(parts?.[2]);
    expect(Number(circleSizes?.[4]) * 16).toBeCloseTo(picture, 10);
  });

  it('derives the blog article COVER’s `sizes` from the same sources — ui/Container’s whole column, phone, ramp and tablet, and THE BAND SCALE’s cap on the gate’s pointer (sections/PostCover’s THE `sizes`, DERIVED; the a11y review, 2026-10-20)', () => {
    // The cover spans ui/Container's column at every width, so its four
    // entries are the gutter's three regimes and the band's cap: every number
    // read off the gutter's clamp (P, R, K and T above), the cap and the
    // gate, never retyped — until 2026-10-20 the string was pinned only by a
    // copy of itself, and a gutter change turned nothing red. COVER_SIZES is
    // written over several `+`ed literals, joined as the browser gets them.
    const code = tsCode(
      read('src/components/sections/PostCover/PostCover.tsx'),
    );
    const literals = /\bconst COVER_SIZES =([^;]*);/.exec(code)?.[1] ?? '';
    const cover = [...literals.matchAll(/'([^']*)'/g)]
      .map((match) => match[1])
      .join('');
    const entries =
      /^\(min-width: ([\d.]+)rem\) and (\(pointer: fine\)) ([\d.]+)rem, \(min-width: ([\d.]+)rem\) (\d+)vw, \(min-width: ([\d.]+)rem\) calc\((\d+)vw \+ ([\d.]+)rem\), (\d+)vw$/.exec(
        cover,
      );
    expect(entries, `COVER_SIZES reads “${cover}”`).not.toBeNull();
    expect(gutter, 'ui/Container’s gutter, read').not.toBeNull();
    const [phoneVw, rampVw, rampRem] = [1, 2, 3].map((index) =>
      Number(gutter?.[index]),
    );
    // A phone: P vw a side, a column of 100 − 2P vw — until the ramp's
    // R vw − K rem passes P vw, at a 100K / (R − P) rem window. (Every
    // QUOTIENT is held to three decimals, never `toBe`: a derived division
    // owes nothing to binary floating point's exactness.)
    expect(Number(entries?.[9])).toBe(100 - 2 * phoneVw);
    expect(Number(entries?.[6])).toBeCloseTo(
      (100 * rampRem) / (rampVw - phoneVw),
      3,
    );
    // The ramp: the window less two of R vw − K rem, (100 − 2R) vw + 2K rem.
    expect(Number(entries?.[7])).toBe(100 - 2 * rampVw);
    expect(Number(entries?.[8])).toBe(2 * rampRem);
    // From the ramp's end, T vw a side: the 0.8 column the cutout reads.
    expect(Number(entries?.[4])).toBeCloseTo(rampEndRem, 3);
    expect(Number(entries?.[5])).toBe(100 - 2 * tabletVw);
    // THE BAND SCALE's cap, from the window whose 0.8 column reaches it, on
    // the gate's own pointer condition.
    expect(`${entries?.[3] ?? ''}rem`).toBe(pixel.cap);
    expect(Number(entries?.[1])).toBeCloseTo(
      (100 * Number(entries?.[3])) / (100 - 2 * tabletVw),
      3,
    );
    expect(entries?.[2]).toBe(
      /@media (\(pointer: fine\))/.exec(
        blockAfter(globals, '@custom-variant scalable {'),
      )?.[1],
    );

    // THE BOUNDS sections/PostCover quotes beside the string rest on the
    // gutter's OUTER clamp too — its floor (the clamp's first term, F rem)
    // and its cap (the last, C rem) — so both are read here, where they
    // live, and a change to either turns this red until the section's
    // numbers follow (the typescript review, 2026-10-20). In px at the
    // default 16px root, as the section's prose counts them.
    const outer = /mx-\[clamp\(([\d.]+)rem,clamp\([^)]*\),([\d.]+)rem\)\]/.exec(
      container,
    );
    expect(outer, 'ui/Container’s outer floor and cap, read').not.toBeNull();
    const floorPx = Number(outer?.[1]) * 16;
    const capPx = Number(outer?.[2]) * 16;
    // The floor holds below the window where P vw reaches it — 320px — and
    // there 90vw over-asks the column by at most 4px down to a 280px window
    // (a Galaxy Fold's cover screen: a 248px cover, asked as 252).
    expect((100 * floorPx) / phoneVw).toBeCloseTo(320, 3);
    expect(280 - 2 * floorPx).toBeCloseTo(248, 3);
    expect(
      (Number(entries?.[9]) / 100) * 280 - (280 - 2 * floorPx),
    ).toBeCloseTo(4, 3);
    // The cap holds past the window where T vw reaches it — 2000px — so on a
    // touch screen the column outgrows 80vw: by 5 % at 2560.
    expect((100 * capPx) / tabletVw).toBeCloseTo(2000, 3);
    expect(
      Math.round(
        100 * ((2560 - 2 * capPx) / ((Number(entries?.[5]) / 100) * 2560) - 1),
      ),
    ).toBe(5);
  });
});
