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
