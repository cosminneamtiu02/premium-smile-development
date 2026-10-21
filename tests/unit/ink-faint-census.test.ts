import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// THE `--ink-faint` CENSUS (doctor-pages lane, G2-R2 tier 1, a11y F1,
// 2026-09-26). The 19th semantic role — `--ink-faint` #766f69, the washed
// prose of the two doctor quotes (owner, round 2o: "what if you make the
// faint text lighter"), since 2026-10-13 of the doctor page's biography
// (§15.23 round 7), since 2026-10-15 of the note under a blog photo
// (sections/PostPhoto) and since 2026-10-17 of the card carousel's idle
// progress dots, its one GRAPHIC use (sections/CardCarousel) — passes body
// text's 4.5:1 on white (4.94:1) and on the page ground (4.70:1) and FAILS it
// on the 30 % lilac tint (3.24:1). Its charter in globals.css and ui/Keyword's
// THREE LIMITS both say "never on the tint", and until this file nothing kept
// that promise but reading: the two consumer suites (PersonnelCard.test.tsx,
// CredoCard.test.tsx) pin the class on their own element and know nothing
// about a third wearer. The scenario this closes: a later lane puts the ink on
// a paragraph inside sections/TintedBand for the same washed look — body text
// at 3.24:1 on the export, and the only automated line before merge would be a
// per-story axe run over a `color-mix()` ground nobody has verified axe
// resolves.
//
// So this is the tests/unit/card-single-spelling.test.ts machine pointed at
// an INK: every wearer is named below with the ground it sits on and the KIND
// of thing it paints, and a new one turns this file red until it is added
// here — with its ground, which is the whole point. Test and story files are
// outside the census on purpose (they pin the class as a STRING, on purpose,
// many times).
//
// TEXT OR GRAPHIC (G2 typescript and react, 2026-10-17 — the blog-article
// lane's review). The kind sets the bar the ground must give: body text owes
// SC 1.4.3's 4.5:1, a graphic SC 1.4.11's 3:1 — the carousel's idle dot is the
// only visible part of its dot <button>, so the user-interface-component
// clause applies. The tint is barred for TEXT: 3.24:1 is under 4.5:1 and over
// 3:1, so a graphic there would pass its bar — but the tinted-band `it` still
// refuses every reading inside those bands, so the day one is wanted it is a
// decision recorded in this file first, never a drive-by. The measuring `it`
// computes every pair from the tokens' own lines in globals.css, like the
// accent census.
//
// THE MATCHER AND THE STRIPPER, REBUILT (the same review). Until that day
// this file matched ONE spelling, the text utility, and stripped block
// comments first. Measured by the typescript reviewer, three wearers walked
// past it green: (a) a second file painting the ink as a GROUND — the
// carousel's idle dots already did, unnamed; (b) the ink read through
// Tailwind's variable shorthand inside sections/TintedBand — prose on the
// forbidden tint; and (c) a stray class after a full-line comment that names
// a glob, `src/messages/*.json`: the block pass read the glob's opener as a
// comment and deleted the real code up to the next closer — 651, 461 and 279
// non-blank characters of the team, 404 and services pages (measured
// 2026-10-17). So the matcher is now EVERY colour utility Tailwind mints from
// the role, with or without an opacity modifier, plus every CSS read of the
// variable, and the stripper is tests/unit/accent-census.test.ts's three-step
// one (its fix of 2026-10-02). The minted list is the compiler's own: 51
// utilities in Tailwind 4.3.3, read off its design system's class list on
// 2026-10-17 — MINTED below, which the last `it` runs through the matcher.
// The accent census's prefix list, copied here, misses six of the 51 (the
// accent-colour utility, the ring offset, the two logical block-side borders
// and the two scrollbar colours — measured against the same list); this one
// carries all of them. A colour utility a later Tailwind minor adds joins
// MINTED and the matcher on that crossing, a recorded decision (§3).
//
// COMMENTS ARE STRIPPED FIRST (the aura census's lesson): the wearers' own
// headers EXPLAIN the ink in prose containing the very spellings matched
// below, so a matcher over raw text would stay green after the class itself
// was deleted. The last `it` proves the stripper strips — the glob case
// included.
//
// THIS FILE IS SCANNED BY TAILWIND like every text file in the repository,
// and every class-shaped string in it would ship a CSS rule. So every whole
// class spelled here is one the stylesheet already carries; every other
// spelling the matcher is tested on is built at run time from pieces that are
// not classes (the gutter census's two halves), and MINTED writes the role as
// `@`. Measured 2026-10-17: the stylesheet compiled with this file's words
// and without them is the same, rule for rule.

const SRC_DIR = fileURLToPath(new URL('../../src', import.meta.url));

/** The role's own name — the one spelling every reading below ends on. */
const ROLE = 'ink-faint';

/**
 * Every Tailwind utility minted from `--color-ink-faint`, whatever its variant
 * prefix or opacity modifier — never `ink-muted` or `ink-inverse`, which the
 * name refuses — plus every CSS read of the variable: Tailwind's parenthesised
 * shorthand (with or without a type hint), a `var()` (with or without a
 * fallback), the `--color-` mapping or the role itself — and the legacy dotted
 * `theme()` read, which Tailwind still compiles to the same variable.
 */
const WEARS_INK_FAINT =
  /\b(?:text|bg|accent|caret|decoration|divide|fill|stroke|outline|placeholder|ring(?:-offset)?|shadow|from|via|to|border(?:-(?:[trblxyse]|bs|be))?|scrollbar-(?:thumb|track))-ink-faint(?:\/\d+)?(?![\w-])|\((?:[a-z-]+:)?--(?:color-)?ink-faint(?![\w-])|theme\(colors\.ink-faint(?![\w-])/g;

/**
 * The 51 utilities Tailwind 4.3.3 mints from the role, as its design system
 * lists them (2026-10-17), the role written `@` so that this file never
 * spells one whole and ships its rule. The prefixes the matcher above does
 * not name are caught by a word boundary inside the class: the inset ring and
 * shadow, the drop and text shadows, and every mask's from and to.
 */
const MINTED = `
  accent-@ bg-@ border-@ border-b-@ border-be-@ border-bs-@ border-e-@
  border-l-@ border-r-@ border-s-@ border-t-@ border-x-@ border-y-@ caret-@
  decoration-@ divide-@ drop-shadow-@ fill-@ from-@ inset-ring-@
  inset-shadow-@ mask-b-from-@ mask-b-to-@ mask-conic-from-@ mask-conic-to-@
  mask-l-from-@ mask-l-to-@ mask-linear-from-@ mask-linear-to-@ mask-r-from-@
  mask-r-to-@ mask-radial-from-@ mask-radial-to-@ mask-t-from-@ mask-t-to-@
  mask-x-from-@ mask-x-to-@ mask-y-from-@ mask-y-to-@ outline-@
  placeholder-@ ring-@ ring-offset-@ scrollbar-thumb-@ scrollbar-track-@
  shadow-@ stroke-@ text-@ text-shadow-@ to-@ via-@
`
  .trim()
  .split(/\s+/)
  .map((spelling) => spelling.replace('@', ROLE));

/** What a wearer paints, and so the bar its ground must give it. */
type Kind = 'text' | 'graphic';

/** Body text owes SC 1.4.3's 4.5:1; non-text — a user-interface component's
 *  indicator or a graphic — SC 1.4.11's 3:1. */
const BAR: Readonly<Record<Kind, number>> = { text: 4.5, graphic: 3 };

/**
 * Every wearer, with its ground — white or the page ground — and its kind.
 * Growing this list is a deliberate act: name the file, the ground the ink
 * sits on and what it paints, and the measuring `it` below holds the pair to
 * the kind's bar before the row can stay in.
 */
const WEARERS: Readonly<
  Record<
    string,
    { count: number; ground: 'bg-page' | 'bg-surface'; kind: Kind }
  >
> = {
  // The doctor page's biography paragraphs — on the band's PAGE ground since
  // round 7 left the tint (2026-10-13), the owner the same evening: "i also
  // want the text of biografie to be like the text at [the credo quote] … so
  // gary-ish er and with tighlighted keywords". 4.70:1 on `--page` #faf9f7,
  // body text's 4.5:1 kept (the header's numbers); one class in the source,
  // worn by every paragraph of the map.
  'components/sections/DoctorProfile/DoctorProfile.tsx': {
    count: 1,
    ground: 'bg-page',
    kind: 'text',
  },
  // The doctor card's <blockquote> — ui/Card `framed` since 2026-09-30 (the
  // owner: "the border of the non current review"), `surface` before it; white
  // either way (PersonnelCard D8, D17 + round 2o).
  'components/sections/PersonnelCard/PersonnelCard.tsx': {
    count: 1,
    ground: 'bg-surface',
    kind: 'text',
  },
  // The credo card's <p> — ui/Card `framed`, white (DoctorIntro D12 + round 2o).
  'components/sections/DoctorIntro/CredoCard.tsx': {
    count: 1,
    ground: 'bg-surface',
    kind: 'text',
  },
  // ui/Ribbon's stand-in doctor card — the doctor card's <blockquote>, stood
  // in for the stories and tests on the same white `bg-surface` (§15.26), so
  // the owner judges the card's own picture under the ribbon.
  'components/ui/Ribbon/Ribbon.fixtures.tsx': {
    count: 1,
    ground: 'bg-surface',
    kind: 'text',
  },
  // The blog photo's note — the owner's "abosultley no emphasis here, jsut the
  // gray text" (2026-10-15), under the picture on the article's PAGE ground:
  // 4.70:1 on `--page`, body text's 4.5:1 kept; no article stands on the tint.
  'components/sections/PostPhoto/PostPhoto.tsx': {
    count: 1,
    ground: 'bg-page',
    kind: 'text',
  },
  // The card carousel's idle progress dot (2026-10-17, the owner: "progress
  // dots like on home hero") — the ink as a GROUND, the only visible part of
  // each dot <button>, so SC 1.4.11's 3:1 is its bar: 4.70:1 on the page
  // (and 4.94:1 on white). Every ground it stands on is the page:
  // sections/BlogCarousel's band is `bg-page`, sections/PostGallery sits on
  // the article's body. One spelling, worn by every idle dot.
  'components/sections/CardCarousel/CardCarousel.tsx': {
    count: 1,
    ground: 'bg-page',
    kind: 'graphic',
  },
};

/** The lilac band and every band that composes it — where the ink fails body
 *  text's bar (3.24:1, measured below). DoctorProfile and its schedule card
 *  left the tint on 2026-10-13 (CLAUDE.md §15.23 round 7); the numbers band
 *  is the one that composes it now. */
const TINTED = [
  'components/sections/TintedBand/TintedBand.tsx',
  'components/sections/DoctorStats/DoctorStats.tsx',
];

/** The role's one DEFINITION — `@theme inline`'s mapping READS the variable
 *  to mint the utilities above; defining is not wearing, and it is the only
 *  reading globals.css may carry. */
const DEFINITION = '--color-ink-faint: var(--ink-faint);';

// Line and block comments out; strings and code stay — the accent census's
// three steps, KEEP-IN-SYNC with tests/unit/accent-census.test.ts. FULL-LINE
// line comments go FIRST: a line comment may carry a block opener of its own
// — a path like src/messages/*.json — and a block pass run first reads it as
// one and deletes real code up to the next closer (THE MATCHER AND THE
// STRIPPER, REBUILT, above). Then the block comments, then the line comments
// that trail code. ITS LIMIT (the lane's TypeScript review, 2026-10-20): a
// block opener inside a TRAILING line comment or inside a string still hides
// the code after it; none of the shipped files has one (TypeScript's own
// comment ranges agree with this stripper on all 183), and the scanner is the
// lever if one ever does.
function stripComments(source: string): string {
  return source
    .replace(/^[ \t]*\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

function wearings(source: string): number {
  return source.match(WEARS_INK_FAINT)?.length ?? 0;
}

function read(file: string): string {
  return readFileSync(join(SRC_DIR, file), 'utf8');
}

/** A file's code, comments out — and, for globals.css, its one definition
 *  out too, once it has been found there exactly once. */
function codeOf(file: string): string {
  const code = stripComments(read(file));
  if (file !== 'styles/globals.css') return code;
  expect(code.split(DEFINITION).length - 1, `${file} — ${DEFINITION}`).toBe(1);
  return code.replace(DEFINITION, '');
}

/** WCAG 2.2 relative luminance of an sRGB `#rrggbb`. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** `share` of `fg` over `bg`, as a browser composites a translucent colour. */
function over(fg: string, share: number, bg: string): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16);
  return (
    '#' +
    [1, 3, 5]
      .map((i) =>
        Math.round(share * channel(fg, i) + (1 - share) * channel(bg, i))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

/** A token's hex literal, read off its own declaration line in globals.css. */
function token(css: string, name: string): string {
  const lines = css.match(
    new RegExp(`^\\s*--${name}:\\s*(#[0-9a-f]{6});`, 'gm'),
  );
  expect(
    lines,
    `--${name} declared exactly once as a hex literal`,
  ).toHaveLength(1);
  return lines![0]!.replace(/^[^#]*/, '').replace(';', '');
}

const sourceFiles = readdirSync(SRC_DIR, { recursive: true, encoding: 'utf8' })
  .filter((file) => /\.(ts|tsx|css)$/.test(file))
  .filter((file) => !/\.(test|stories)\.tsx?$/.test(file))
  .map((file) => file.replaceAll('\\', '/'));

describe('the `--ink-faint` ink has exactly its named wearers in src/ (G2-R2 a11y F1)', () => {
  it('is worn by the two doctor quotes, the ribbon’s stand-in, the doctor page’s biography, the blog photo’s note and the carousel’s idle dots, each once — the text never on the tint', () => {
    for (const [file, wearer] of Object.entries(WEARERS)) {
      const source = codeOf(file);
      expect(wearings(source), file).toBe(wearer.count);
      // The ground travels with EVERY wearer: the same file must still put
      // its ink on a surface or the page, never on the tint. A graphic would
      // clear its 3:1 there (TEXT OR GRAPHIC, above) — but `kind` is declared
      // here, not derived from the code, so a wearer relabelled 'graphic'
      // must not buy its way onto the tint; a real graphic on the tint is
      // a new row and a decision, not a silent pass.
      const ground = `${file} — ${wearer.kind} on ${wearer.ground}`;
      expect(source, ground).not.toContain('--tint');
      expect(source, ground).not.toMatch(/TintedBand/);
    }
  });

  it('is worn nowhere else — another wearer names itself, its ground and its kind here first', () => {
    // globals.css is read too: its one definition is taken out (codeOf), so
    // a rule there that paints with the ink is a stranger like any other.
    const strangers = sourceFiles.filter(
      (file) => !(file in WEARERS) && wearings(codeOf(file)) > 0,
    );
    expect(strangers).toEqual([]);
  });

  it('never appears inside sections/TintedBand or the bands that compose it', () => {
    // The scenario this census exists for, spelled out: the lilac ground is
    // exactly where the ink fails 4.5:1 (3.24:1, measured below). Any
    // reading counts here, a graphic's too — one on the tint is a decision
    // to record in this file first, never a drive-by.
    for (const file of TINTED) {
      expect(wearings(codeOf(file)), file).toBe(0);
    }
  });

  it('meets its kind’s bar on every named ground — 4.5:1 for text, 3:1 for a graphic — and fails body text’s on the tint', () => {
    const css = read('styles/globals.css');
    const ink = token(css, ROLE);
    for (const [file, { ground, kind }] of Object.entries(WEARERS)) {
      const hex = token(css, ground.replace(/^bg-/, ''));
      const ratio = contrast(ink, hex);
      expect(
        ratio,
        `${file} — ${kind} on ${ground} ${hex}: ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(BAR[kind]);
    }
    // sections/TintedBand: accent-decorative at 30 % over the page ground.
    // The reason the tint is barred for text, measured: if this ever passes,
    // the charter's "not for the tint" can be revisited — until then it
    // stands.
    const tint = over(token(css, 'accent-decorative'), 0.3, token(css, 'page'));
    const onTint = contrast(ink, tint);
    expect(onTint, `on the tint ${tint}: ${onTint.toFixed(2)}:1`).toBeLessThan(
      BAR.text,
    );
  });

  it('strips the prose mention and catches every spelling, so the count is the class and not the comment', () => {
    // A guard that cannot fail is not a guard: the wearers' headers mention
    // the spelling in prose, and the raw text must therefore count MORE than
    // the stripped text does.
    const raw = read('components/sections/DoctorIntro/CredoCard.tsx');
    expect(wearings(raw)).toBeGreaterThan(wearings(stripComments(raw)));
    expect(stripComments('a // text-ink-faint\n/* text-ink-faint */ b')).toBe(
      'a \n b',
    );
    // …and a block opener inside a line comment opens nothing: the class
    // after it is code, and counted — (c) above, the shape that hid real
    // code of three pages from the old stripper.
    const afterGlob =
      "// src/messages/*.json\nconst stray = 'bg-ink-faint';\n/* x */";
    expect(wearings(stripComments(afterGlob))).toBe(1);

    // …and every utility the compiler mints from the role is ONE wearing,
    // bare, under a variant and with an opacity modifier — (a) above.
    expect(MINTED).toHaveLength(51);
    for (const spelling of MINTED) {
      expect(wearings(spelling), spelling).toBe(1);
      expect(wearings(`group-hover/x:${spelling}/40 x`), spelling).toBe(1);
    }
    // …and every CSS read of the variable is one too — (b) above.
    for (const reading of [
      'text-(--' + 'ink-faint)',
      'bg-(color:' + '--ink-faint)',
      'fill-[var(--' + 'ink-faint)]',
      'color: var(--' + 'ink-faint, #000);',
      'color: var(--color-' + 'ink-faint);',
      'text-[theme(colors.' + 'ink-faint)]',
    ]) {
      expect(wearings(reading), reading).toBe(1);
    }
    // …and the siblings, the declaration and a script's read are not.
    expect(
      wearings(
        'text-ink-muted text-ink-inverse text-ink text-ink-strong ' +
          "--ink-faint: #766f69; getPropertyValue('--ink-faint')",
      ),
    ).toBe(0);
  });
});
