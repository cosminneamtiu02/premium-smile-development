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
// keeps it bought. Second half: every consumer must actually wear its expected
// count of the utility, because a token nobody names is invisible in every
// direction.
//
// COMMENTS ARE STRIPPED FIRST, and that is the point — the lesson
// tests/unit/backdrop-token-layer.test.ts records for the ::backdrop entry,
// inherited verbatim. Every file under guard EXPLAINS the aura in prose
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

/** Every wearer, with its EXPECTED post-strip count of the utility's name.
 * Day one was the pill + the panel (board §4 — "identical mechanics, second
 * consumer → extract"); the fixed corner joined on the owner's 2026-09-05
 * "implement that aura on the buttons for calling and whatsapp and for the
 * language switcher" — FloatingActions counts THREE: `shadow-aura` on each of
 * the two GlyphButton discs, plus `var(--shadow-aura)` feeding the dial bulb's
 * `--bulb-shadow` knob (the substring counts, which is the point — the feed
 * line is a wear). */
const CONSUMERS = [
  [
    'Header.tsx (the pill)',
    '../../src/components/sections/Header/Header.tsx',
    1,
  ],
  [
    'NavMenu.tsx (the panel)',
    '../../src/components/sections/Header/NavMenu.tsx',
    1,
  ],
  [
    'FloatingActions.tsx (the fixed corner: call + WhatsApp discs, dial feed)',
    '../../src/components/sections/FloatingActions/FloatingActions.tsx',
    3,
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

  it('is worn by EVERY consumer, each exactly its expected number of times', () => {
    for (const [name, path, count] of CONSUMERS) {
      const stripped = code(read(path));
      expect(stripped, `${name}: the stripper ate the code`).toContain(
        'className=',
      );
      // EXACT count (G2 fold, extended for the corner): each consumer also
      // names the utility in its decision-record comments, so matching the
      // expected count proves the stripper removed the prose mentions AND the
      // class/feed is worn, in one assertion that can fail in both directions
      // (low = a wear dropped; high = the stripper broke, or a wear this
      // file's census does not expect — update CONSUMERS deliberately).
      expect(
        stripped.split(AURA_UTILITY).length - 1,
        `${name}: wears ${AURA_UTILITY} exactly ${count}× outside prose`,
      ).toBe(count);
    }
  });

  it('reaches the dial bulb through its --bulb-shadow knob, atom kept token-agnostic', () => {
    // The dial's aura cannot ride className: LanguageSwitcher parks the host
    // string on its <nav>, and SpeedDial's own className lands on the ROOT
    // WRAPPER — a square box around a round bulb, so a shadow there would
    // glow a rectangle. The atom instead exposes a third public CSS variable
    // (--bulb-shadow, the --disc-size/--stem-inset idiom) with an invisible
    // fallback, and the SECTION feeds it the aura — inheritance carries the
    // custom property from the corner const down to the bulb. Two pins:
    // the hook exists in the atom, and the atom itself never names the
    // TOKEN — dressing decisions stay in sections (§6.1/§8.1 spirit).
    const dial = code(read('../../src/components/ui/SpeedDial/SpeedDial.tsx'));
    expect(dial).toContain('var(--bulb-shadow');
    expect(dial).not.toContain(AURA_UTILITY);
    const corner = code(
      read('../../src/components/sections/FloatingActions/FloatingActions.tsx'),
    );
    expect(corner).toContain('[--bulb-shadow:var(--shadow-aura)]');
  });
});
