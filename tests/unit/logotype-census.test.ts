import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// THE LOGOTYPE'S CENSUS (the wordmark-brand lane, owner 2026-10-01: "on the
// text use those colors as described … on Premium the gray and on smile the
// liliac"). Two semantic roles were minted for the clinic's own lettering —
// `--brand-grey` #939598 and `--brand-lilac` #8576b1, the two colours of the
// tooth mark — and they FAIL body text's 4.5:1 on both light grounds
// (measured, WCAG 2.2 relative luminance: grey 3.00:1 on white / 2.85:1 on
// the page; lilac 4.02:1 / 3.82:1). They are legal on exactly one thing: the
// brand name. WCAG 2.2 SC 1.4.3 — "Text that is part of a logo or brand name
// has no minimum contrast requirement" — and sections/Wordmark's two words are
// that text and nothing else on the site is. axe cannot tell a logotype from
// a paragraph, so the two words carry `data-logotype` and
// .storybook/preview.tsx narrows axe's color-contrast rule by that attribute.
//
// So this is tests/unit/ink-faint-census.test.ts's machine pointed at a
// LOGOTYPE: the two utilities and the marker are worn by sections/Wordmark
// and nowhere else (a third wearer would be body text at 2.85:1 with the
// gate looking away), the exemption in the Storybook config is keyed on the
// SAME marker (rename one and the other stops matching — this file turns
// red), and the .svg mark, which cannot read a token, is painted with the
// two values VERBATIM (a KEEP-IN-SYNC pair: the file and the stylesheet).
//
// COMMENTS ARE STRIPPED FIRST (the aura census's lesson): every guarded file
// explains the logotype in prose containing the very spellings matched
// below. The negative case in the last `it` proves the stripper strips.

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SRC_DIR = join(ROOT, 'src');

/** The two roles, as the owner spelled them (lower-cased, the stylesheet's case). */
const ROLES = {
  '--brand-grey': '#939598',
  '--brand-lilac': '#8576b1',
} as const;

/** The two utilities the roles mint (`--color-brand-*` in `@theme inline`). */
const UTILITIES = ['text-brand-grey', 'text-brand-lilac'] as const;

/** The attribute the two words carry, and the exemption is keyed on. */
const MARKER = 'data-logotype';

/** The one wearer: sections/Wordmark — one word per utility, two markers. */
const WEARER = 'components/sections/Wordmark/Wordmark.tsx';

/** The mark the wordmark draws — a file, so its colours are literals. */
const MARK = 'public/images/brand/mark.svg';

/** Line and block comments out; strings and code stay. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

const read = (relative: string): string =>
  readFileSync(join(ROOT, relative), 'utf8');

const sourceFiles = readdirSync(SRC_DIR, { recursive: true, encoding: 'utf8' })
  .filter((file) => /\.(ts|tsx|css)$/.test(file))
  .filter((file) => !/\.(test|stories)\.tsx?$/.test(file))
  .map((file) => file.replaceAll('\\', '/'));

describe('the two brand roles (globals.css)', () => {
  const css = stripComments(read('src/styles/globals.css'));

  it("declares both with the owner's values, verbatim, on the light theme", () => {
    for (const [role, value] of Object.entries(ROLES)) {
      expect(count(css, `${role}: ${value};`), role).toBe(1);
    }
  });

  it('mints exactly the two utilities in `@theme inline`, one per role', () => {
    for (const role of Object.keys(ROLES)) {
      const utility = `--color-${role.slice(2)}: var(${role});`;
      expect(count(css, utility), utility).toBe(1);
    }
  });
});

describe('the mark (public/images/brand/mark.svg)', () => {
  const svg = read(MARK);

  it('is painted with the two brand values and no other colour', () => {
    const colours = new Set(
      [...svg.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((m) => m[0].toLowerCase()),
    );
    expect(colours).toEqual(new Set(Object.values(ROLES)));
    // Two fills, one per colour — no stroke, no stylesheet, no gradient
    // could carry a third colour past the census above.
    expect(svg.match(/fill="[^"]+"/g)).toHaveLength(2);
    expect(svg).not.toMatch(/stroke=|<style|<linearGradient|<radialGradient/);
  });

  it('carries no text, no script and no reference outside itself', () => {
    // The lettering is LIVE text beside the mark (sections/Wordmark) — the
    // file is the tooth alone. A <text> here would be a second, silent
    // spelling of the clinic's name; a script or an href would make an
    // <img> src into something other than a picture.
    expect(svg).not.toMatch(/<text|<script|href=|<image|<foreignObject/);
  });

  it('sizes itself by viewBox only — the <img> owns the box (§11)', () => {
    const root = /<svg\b[^>]*>/.exec(svg)?.[0] ?? '';
    expect(root).toMatch(/viewBox="0 0 (\d+) (\d+)"/);
    expect(root).not.toMatch(/\swidth=|\sheight=/);
  });

  it('matches the width/height sections/Wordmark declares for it', () => {
    // §11's zero-CLS attributes are only honest when they describe the file:
    // the viewBox is the ink's own box plus one unit of air on each side, and
    // the component's BRAND_MARK spells the same two numbers.
    const [, w, h] = /viewBox="0 0 (\d+) (\d+)"/.exec(svg) ?? [];
    const wordmark = stripComments(read(`src/${WEARER}`));
    expect(wordmark).toMatch(new RegExp(`width:\\s*${w},`));
    expect(wordmark).toMatch(new RegExp(`height:\\s*${h},`));
    expect(wordmark).toContain(`'/${MARK.replace(/^public\//, '')}'`);
  });
});

/** The browser tab's icon, through Next's own file conventions in src/app. */
const TAB_ICON = 'src/app/icon.svg';
const TAB_FALLBACK = 'src/app/favicon.ico';
/**
 * The SHA-256 of the mark favicon.ico was RENDERED from (CLAUDE.md §15.31's
 * recipe). A raster cannot be compared with the .svg byte for byte, so the
 * ICO's provenance is pinned instead: re-cut the mark and this turns red
 * until the ICO is regenerated from the new file and this hash moves with it.
 */
const ICO_SOURCE_SHA256 =
  '703f1941b08cad31493cf612f8111bbf29bbd4f65d1a2a8e3074514af038c1dd';
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

describe("the browser tab's icon (src/app — Next's icon + favicon conventions)", () => {
  // THE LOGO IN THE TAB (owner, 2026-10-01: "use the logo from top bar also in
  // the tab"). Next writes one <link rel="icon"> per file into every page's
  // head: icon.svg (`sizes="any"`) for the browsers that draw an SVG tab icon
  // — Chrome 80+, Firefox 41+, Safari 26+ — and favicon.ico (`sizes="48x48"`)
  // for the ones that do not, which is every Safari up to 18.7 on the Mac AND
  // on the iPhone (caniuse link-icon-svg), and for the browser's own
  // `/favicon.ico` request on the two documents Next does not write (the root
  // redirect and the 404 dispatcher, tools/) — a request to the DOMAIN root,
  // so it finds the file on a root-served host and misses it on the interim
  // Pages host's base path. Measured on the build: both links carry that base
  // path, unlike the Wordmark's own <img> (Wordmark.tsx's KNOWN DEBT ·
  // basePath).

  it('is the mark itself, byte for byte (src/app/icon.svg)', () => {
    // A COPY, because Next's convention reads a file inside src/app while the
    // <img> needs the mark in public/ — so this is the KEEP-IN-SYNC pin, and
    // the mark's census above covers the copy too (two brand fills, no text,
    // no script, no reference outside itself). A re-cut mark that forgets the
    // tab turns this red: copy it here, and regenerate favicon.ico from it
    // (the recipe is CLAUDE.md §15.31).
    const icon = readFileSync(join(ROOT, TAB_ICON));
    expect(icon.equals(readFileSync(join(ROOT, MARK))), TAB_ICON).toBe(true);
  });

  it('falls back to a 16 · 32 · 48px PNG-in-ICO of THIS mark (src/app/favicon.ico)', () => {
    const source = createHash('sha256')
      .update(readFileSync(join(ROOT, MARK)))
      .digest('hex');
    expect(
      source,
      `${TAB_FALLBACK} was rendered from another ${MARK}: regenerate it from the current mark (CLAUDE.md §15.31) and update ICO_SOURCE_SHA256`,
    ).toBe(ICO_SOURCE_SHA256);

    const ico = readFileSync(join(ROOT, TAB_FALLBACK));
    // Every read below is bounds-checked first, so a short or truncated file
    // fails with a NAMED assertion rather than a bare RangeError — and
    // `subarray`, which clamps silently, can never hand over half a PNG.
    expect(ico.length, 'the ICO header').toBeGreaterThanOrEqual(6);
    expect(ico.readUInt16LE(0)).toBe(0); // reserved
    expect(ico.readUInt16LE(2)).toBe(1); // 1 = an icon (2 would be a cursor)
    const count = ico.readUInt16LE(4);
    expect(ico.length, 'the ICO directory').toBeGreaterThanOrEqual(
      6 + 16 * count,
    );
    const sizes = Array.from({ length: count }, (_, i) => {
      const entry = 6 + 16 * i;
      const width = ico.readUInt8(entry) || 256; // 0 encodes 256
      const height = ico.readUInt8(entry + 1) || 256;
      const length = ico.readUInt32LE(entry + 8);
      const offset = ico.readUInt32LE(entry + 12);
      expect(offset + length, `the ${width}px entry`).toBeLessThanOrEqual(
        ico.length,
      );
      const png = ico.subarray(offset, offset + length);
      // A WHOLE PNG — what every engine that reads an ICO decodes: the
      // signature, the IHDR chunk first (its tag at byte 12, then width and
      // height, big-endian) saying what the directory says, and the IEND chunk
      // last (its tag 8 bytes from the end, before its CRC).
      expect(png.subarray(0, 8).equals(PNG_SIGNATURE), `${width}px`).toBe(true);
      expect(png.toString('latin1', 12, 16)).toBe('IHDR');
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([
        width,
        height,
      ]);
      expect(png.toString('latin1', png.length - 8, png.length - 4)).toBe(
        'IEND',
      );
      expect(height).toBe(width);
      return width;
    });
    expect(sizes).toEqual([16, 32, 48]);
  });
});

describe('the logotype has exactly one wearer in src/ (WCAG 2.2 SC 1.4.3)', () => {
  it('is sections/Wordmark: one word per utility, the marker on both', () => {
    const source = stripComments(read(`src/${WEARER}`));
    for (const utility of UTILITIES) {
      expect(count(source, utility), utility).toBe(1);
    }
    expect(count(source, MARKER)).toBe(2);
  });

  it('is worn nowhere else — the exemption covers the brand name, never body text', () => {
    const strangers = sourceFiles.filter((file) => {
      if (file === WEARER) return false;
      const source = stripComments(read(`src/${file}`));
      return (
        UTILITIES.some((utility) => count(source, utility) > 0) ||
        count(source, MARKER) > 0
      );
    });
    expect(strangers).toEqual([]);
  });

  it('is what the Storybook a11y config exempts — the same marker, color-contrast only', () => {
    // parameters.a11y.config goes to axe.configure: the rule keeps its
    // default reach except for the marked nodes. Keyed on the SAME literal,
    // so renaming the marker in either file turns this red instead of
    // silently widening (every node) or voiding (no node) the exemption.
    const preview = stripComments(read('.storybook/preview.tsx'));
    expect(preview).toContain(`id: 'color-contrast'`);
    expect(preview).toContain(`selector: '*:not([${MARKER}])'`);
    // …and only that rule is touched: a second rule entry here would be a
    // second exemption riding on this one's justification.
    expect(preview.match(/\bid: '[a-z-]+'/g)).toEqual([`id: 'color-contrast'`]);
  });

  it('strips the prose mention, so the count is the class and not the comment', () => {
    const raw = read(`src/${WEARER}`);
    expect(count(raw, MARKER)).toBeGreaterThan(
      count(stripComments(raw), MARKER),
    );
    expect(stripComments('a // data-logotype\n/* data-logotype */ b')).toBe(
      'a \n b',
    );
  });
});
