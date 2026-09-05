import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// THE AURA TOKEN'S PIN (board .claude/plans/header-aura.plan.md, fb-359, owner
// 2026-09-04 — "the old top bar has like a shadow around it. like an aura.
// looks very good, import that too"). The old bar's lavender glow ships as ONE
// static value — the old scrolled-state shadow, worn permanently by the Header
// pill and by NavMenu's dropdown panel (board D1·A + D4).
//
// WHAT THIS GUARDS IS THE HALF PIXELS CANNOT SEE: the tint SOURCE. Repaint the
// glow from a pasted rgb(131,119,163), from the green --cta, or from a plain
// neutral black, and the visual baselines barely flinch — a few RGB values
// buried in a 22px blur — while §15.1's still-open "confirm the purple hue
// against the real logo" silently stops reaching the bar. The board bought that
// automatic re-tint by mixing from --accent-decorative (D2); this test is what
// keeps it bought. Second half: both consumers must actually wear the utility,
// because a token nobody names is invisible in every direction.
//
// COMMENTS ARE STRIPPED FIRST, and that is the point — the lesson
// tests/unit/backdrop-token-layer.test.ts records for the ::backdrop entry,
// inherited verbatim. All three files under guard EXPLAIN the aura in prose
// containing the very strings matched below, so a matcher over raw text stays
// green long after someone deletes the declaration or the class. A guard that
// cannot fail is not a guard; the negative case in the second `it` proves this
// one still has teeth, and each consumer's EXACTLY-ONCE count proves the
// stripper stripped (the prose mention is gone) in the same breath as it
// proves the class is worn (G2 fold — the first draft's stripped-shorter-than-
// raw length check could never fail, so it guarded nothing).
//
// What it deliberately does not prove: that Tailwind mints a `.shadow-aura`
// rule out of the `--shadow-*` namespace. That is Tailwind's own documented
// contract — the same mechanism `bg-surface` rides — verified in this lane
// twice over: the token compiled with the repo's own pipeline (which is how
// the rule-site comment can describe the @supports color-mix fallback instead
// of guessing), and the painted shadow read back from the visual net's own
// Chromium as color(srgb …/0.4) 0px 8px 22px. What the visual net CANNOT do
// here (measured, this lane): tell the aura from its absence — a 40% lavender
// blur over the warm page sits at or under Playwright's default per-pixel
// threshold, so all 169 frames passed unchanged both WITH and WITHOUT the
// glow. The 8 Header baselines carry the true pixels anyway (re-recorded at
// build), but no pixel gate protects this shadow in either direction — which
// is why THIS file is the aura's only automated guard, and why it pins the
// tint source too.

const read = (relative: string): string =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

/** Block AND line comments out, whitespace collapsed. The collapse is why the
 * declaration below can be spelled as one line however prettier BREAKS a value
 * too long for 80 columns — with one documented limit (G2): if the value ever
 * outgrows the width so far that prettier explodes the color-mix() ARGUMENTS
 * across lines, the collapsed text gains `( ` / ` )` spacing and the one-line
 * pin goes loudly red until AURA_DECLARATION is re-spelled to match. `//` is
 * only treated as a comment opener at a line start or after whitespace, so a
 * `https://…` inside a future string literal survives. */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|\s)\/\/[^\n]*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The declaration, spelled out — an independent copy of what the token layer
 * must carry (the Eyebrow RECIPE convention: a silent edit to globals.css
 * fails against a second spelling, not against itself). */
const AURA_DECLARATION =
  '--shadow-aura: 0 8px 22px ' +
  'color-mix(in srgb, var(--accent-decorative) 40%, transparent);';

/** The utility Tailwind names after it — how both consumers must spell it. */
const AURA_UTILITY = 'shadow-aura';

const globals = code(read('../../src/styles/globals.css'));

/** The pill and the panel: the token's only two consumers on day one (board
 * §4 — "identical mechanics, second consumer → extract"). */
const CONSUMERS = [
  ['Header.tsx (the pill)', '../../src/components/sections/Header/Header.tsx'],
  [
    'NavMenu.tsx (the panel)',
    '../../src/components/sections/Header/NavMenu.tsx',
  ],
] as const;

describe('the aura token (header-aura board, fb-359)', () => {
  it('declares the exact value inside @theme, where the utility is minted', () => {
    // `@theme {`, never `@theme inline {` — a LAYER CONVENTION pinned for
    // uniformity with the font tokens, not a behavioral guard: for --shadow-*
    // Tailwind inlines and transforms the value into the utility under BOTH
    // flavors (verified with the repo's own compiler — the token's rule-site
    // comment tells the story), and the inner var(--accent-decorative)
    // resolves at paint time either way.
    expect(globals).toContain('@theme {');
    const theme = globals.slice(globals.indexOf('@theme {'));
    // The first `}` closes the block only while @theme holds no nested braces
    // (true today; a future @keyframes-inside-@theme would truncate this slice
    // and fail LOUDLY — cure then with a brace-aware extractor, G2 note).
    expect(theme.slice(0, theme.indexOf('}'))).toContain(AURA_DECLARATION);
  });

  it('has teeth — and the value has exactly ONE spelling in the sheet', () => {
    const without = globals.replace(AURA_DECLARATION, '');
    expect(without).not.toBe(globals);
    expect(without).not.toContain('--shadow-aura:');
  });

  it('is worn by BOTH consumers — the pill and the panel (D4)', () => {
    for (const [name, path] of CONSUMERS) {
      const stripped = code(read(path));
      expect(stripped, `${name}: the stripper ate the code`).toContain(
        'className=',
      );
      // EXACTLY once (G2 fold): each consumer names the utility twice in the
      // raw file — once in its decision-record comment, once in the class
      // list — so a count of 1 proves the stripper removed the prose mention
      // AND the class is worn, in one assertion that can actually fail in
      // both directions (0 = class dropped; 2 = stripper broke, or a second
      // wear this file's one-root design does not expect).
      expect(
        stripped.split(AURA_UTILITY).length - 1,
        `${name}: wears ${AURA_UTILITY} exactly once outside prose`,
      ).toBe(1);
    }
  });
});
