import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// THE STRIP NEVER MOVES THE PAGE (owner 2026-10-09 — the price strip "should
// take you to desired section and as you scroll it should iterate throug
// sections"; lib/strip-follow's header, NEVER MOVES THE PAGE). The follower
// slides the strip so its current item stays in view WHILE the page itself
// glides to a fragment or is scrolled by the visitor — and MEASURED (the
// planner's strip lab, 2026-10-09, Chromium 151 and WebKit 26.5): a
// `scrollIntoView` on an item 150ms into the page's glide cancels that glide
// in both engines. So the module may write exactly one thing — the STRIP's
// own `scrollLeft` — and never `scrollTo`, `scrollBy`, `scrollIntoView` or
// its WebKit/Blink cousin `scrollIntoViewIfNeeded`, a `scroll(` call,
// `scrollTop`, the document's scrolling element, `preventDefault` (a hand is
// never fought, and never cancelled), or any `.focus(` (an engine scrolls
// what it focuses, the page included — G2, 2026-10-09). The
// ribbon's fence (tests/unit/ribbon-never-moves-the-page.test.ts) is the
// shape; its reader, tests/unit/ribbon-fence.ts, serves the ribbon's fences
// only, so this file reads its one module itself.
//
// CODE ONLY: comments, strings and plain templates are removed first — the
// header explains in prose the very calls this refuses. The last case proves
// the matchers still have teeth.

const MODULE = new URL(
  '../../src/lib/strip-follow/strip-follow.ts',
  import.meta.url,
);

/** A comment, a string or a template — whichever starts first, whole. */
const TOKEN =
  /\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g;

/** CODE ONLY: comments and text removed; a template that interpolates (`${`)
 *  is code, and stays. */
const codeOnly = (source: string): string =>
  source.replace(TOKEN, (token) =>
    token.startsWith('`') && token.includes('${') ? token : ' ',
  );

const FORBIDDEN: ReadonlyArray<readonly [string, RegExp]> = [
  ['scrollTo', /\bscrollTo\b/],
  ['scrollBy', /\bscrollBy\b/],
  ['scrollIntoView', /\bscrollIntoView\b/],
  ['scrollIntoViewIfNeeded', /\bscrollIntoViewIfNeeded\b/],
  ['a focus() call — an engine scrolls what it focuses', /\.focus\s*\(/],
  ['a scroll() call', /\bscroll\s*\(/],
  ['scrollTop', /\bscrollTop\b/],
  ['the document’s scrolling element', /\bscrollingElement\b/],
  ['preventDefault', /\bpreventDefault\b/],
  [
    'a scrollLeft write on anything but the strip',
    /\b(?!strip\b|box\b)\w+\.scrollLeft\s*(?:[-+*/%]|\*\*)?=(?!=)/,
  ],
  [
    'a scrollLeft write through the window or the document',
    /\b(?:window|document|documentElement|body)\b[\w.]*\.scrollLeft\s*=(?!=)/,
  ],
];

/** What a source is caught by, code only. */
function caught(source: string): string[] {
  const code = codeOnly(source);
  return FORBIDDEN.filter(([, pattern]) => pattern.test(code)).map(
    ([what]) => what,
  );
}

describe('lib/strip-follow never moves the page', () => {
  it('writes the strip’s own scrollLeft and nothing that scrolls the page', () => {
    const source = readFileSync(MODULE, 'utf8');
    const code = codeOnly(source);
    // The fence never passes vacuously: the module is real code, and it DOES
    // write the strip — the one thing it is for.
    expect(code.length).toBeGreaterThan(2_000);
    expect(code).toMatch(/\b(?:strip|box)\.scrollLeft\s*=(?!=)/);
    expect(caught(source)).toEqual([]);
  });

  it('has teeth: every way of moving the page is caught, and the strip’s own write is not', () => {
    for (const move of [
      'window.scrollTo(0, 0);',
      'strip.scrollTo({ left: 40, behavior: "smooth" });',
      'window.scrollBy({ top: 40 });',
      'item.scrollIntoView({ inline: "center" });',
      'item.scrollIntoViewIfNeeded(true);',
      'item.focus();',
      'chip.focus({ preventScroll: true });',
      'document.activeElement?.focus ();',
      'window.scroll(0, 0);',
      'document.documentElement.scrollTop = 0;',
      'document.scrollingElement.scrollLeft = 4;',
      'page.scrollLeft = 8;',
      'event.preventDefault();',
      'const jump = `${window.scrollTo(0, 0)}`;',
    ]) {
      expect(caught(move), move).not.toEqual([]);
    }
    const allowed =
      'strip.scrollLeft = to;\n' +
      'box.scrollLeft = from + (to - from) * easeInOut(progress);\n' +
      'const left = strip.scrollLeft;\n' +
      'if (box.scrollLeft === 0) return;\n' +
      '// never window.scrollTo(0, 0) here\n' +
      "const words = 'call preventDefault';\n" +
      "element.addEventListener('focusin', onFocusIn);\n" +
      'function onFocusOut(event) { return keyboardMade(event.target); }\n' +
      "// the chip's own .focus() is the browser's, never ours";
    expect(caught(allowed)).toEqual([]);
    // …and each new matcher bites on its own (a teeth check per pattern).
    expect(caught('item.scrollIntoViewIfNeeded();')).toContain(
      'scrollIntoViewIfNeeded',
    );
    expect(caught('chip.focus();')).toEqual([
      'a focus() call — an engine scrolls what it focuses',
    ]);
  });
});
