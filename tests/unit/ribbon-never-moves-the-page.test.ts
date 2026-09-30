import { describe, expect, it } from 'vitest';
import { codeOnly, RIBBON_FILES, sourceOf } from './ribbon-fence.ts';

// THE RIBBON NEVER MOVES THE PAGE (CLAUDE.md §15.26; lib/ribbon-draw's AT
// START paragraph: "the page's scroll is never touched"). The ribbon is drawn
// BECAUSE the visitor scrolls, so it reads the scroll — `window.scrollY`, a
// root's rect — and must never answer it: a decoration that scrolls the page,
// or cancels a scroll, takes the page out of the visitor's hand. So none of
// the ribbon's product files names `scrollTo`, `scrollBy` or
// `scrollIntoView`, writes `scrollTop` or `scrollLeft`, or calls
// `preventDefault`. The other half is behaviour, and lives where a browser
// is: its one scroll listener is registered `{ passive: true }`, pinned by
// lib/ribbon-draw's own test ("listens to the page's scroll PASSIVELY").
//
// The files and the reading are tests/unit/ribbon-fence.ts's — RIBBON_FILES,
// every module of the ribbon but its tests and its recorded numbers, and the
// atom (the list itself is pinned in ribbon-no-names.test.ts); CODE ONLY,
// comments and text stripped, a template that interpolates kept as code. The
// last case proves the matchers still have teeth.

const FORBIDDEN: ReadonlyArray<readonly [string, RegExp]> = [
  ['scrollTo', /\bscrollTo\b/],
  ['scrollBy', /\bscrollBy\b/],
  ['scrollIntoView', /\bscrollIntoView\b/],
  [
    'a write to scrollTop or scrollLeft',
    /\bscroll(?:Top|Left)\s*(?:\*\*|<<|>>>?|&&|\|\||\?\?|[-+*/%&|^])?=(?!=)/,
  ],
  ['preventDefault', /\bpreventDefault\b/],
];

/** What a source is caught by, code only. */
function caught(source: string): string[] {
  const code = codeOnly(source);
  return FORBIDDEN.filter(([, pattern]) => pattern.test(code)).map(
    ([what]) => what,
  );
}

describe('the ribbon never moves the page (§15.26)', () => {
  it.each(RIBBON_FILES)('%s — no scroll moved, none cancelled', (file) => {
    const source = sourceOf(file);
    // The fence never passes vacuously: every file is real code.
    expect(codeOnly(source).length).toBeGreaterThan(1_000);
    expect(caught(source)).toEqual([]);
  });

  it('has teeth: every way of moving the page is caught, and reading it is not', () => {
    for (const move of [
      'window.scrollTo(0, 0);',
      'window.scrollBy({ top: 40 });',
      'card.scrollIntoView({ block: "center" });',
      'document.documentElement.scrollTop = 0;',
      'root.scrollLeft += 8;',
      'event.preventDefault();',
      'const jump = `${window.scrollTo(0, 0)}`;',
    ]) {
      expect(caught(move), move).not.toEqual([]);
    }
    const reading =
      'const y = window.scrollY + root.scrollTop;\n' +
      'if (root.scrollTop === 0 || root.scrollLeft >= 8) return;\n' +
      '// never window.scrollTo(0, 0) here\n' +
      "const words = 'call preventDefault';";
    expect(caught(reading)).toEqual([]);
  });
});
