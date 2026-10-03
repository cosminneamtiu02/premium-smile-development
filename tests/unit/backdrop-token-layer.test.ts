import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The silent regression this prevents (Modal contract board D2·A′, risk §7.2):
// `ui/Modal`'s scrim is the browser-painted `::backdrop` pseudo-element, and
// `backdrop:bg-scrim` compiles to `background-color: var(--scrim)` (verified
// with Tailwind's own compiler). Engines older than 2024 — Chrome 122 /
// Safari 17.4 / Firefox 120, i.e. exactly the frozen phones the brief's
// audience carries — do NOT inherit custom properties into `::backdrop`, so
// unless the semantic tokens are declared ON the pseudo-element the variable
// resolves to nothing and the modal opens with NO dim at all: black text over
// live page content, silently, only on old devices no CI browser runs.
// One entry in one selector list is the whole fix. This test is its guard.
//
// COMMENTS ARE STRIPPED FIRST, and that is the point (G2 finding): the
// explanatory comment above that selector list contains the word `::backdrop`
// itself, so a matcher run against the raw file passes even after someone
// deletes the entry — a guard that cannot fail is not a guard. The negative
// case below proves the matcher still has teeth.

const globalsPath = fileURLToPath(
  new URL('../../src/styles/globals.css', import.meta.url),
);
const raw = readFileSync(globalsPath, 'utf8');
const css = raw.replace(/\/\*[\s\S]*?\*\//g, '');

/** The semantic block's selector list, spelled out — the thing under guard. */
const SEMANTIC_LIST = /^:root,\s*\[data-theme='light'\],\s*::backdrop\s*\{/m;

describe('semantic token layer (globals.css)', () => {
  it('declares the roles on :root, the light theme AND ::backdrop', () => {
    expect(SEMANTIC_LIST.test(css)).toBe(true);
  });

  it('fails when the ::backdrop entry is removed — the guard has teeth', () => {
    const trimmed = css.replace(/,\s*::backdrop\s*\{/, ' {');
    expect(trimmed).not.toBe(css);
    expect(SEMANTIC_LIST.test(trimmed)).toBe(false);
  });

  it('keeps --scrim inside that same block', () => {
    const block = SEMANTIC_LIST.exec(css);
    expect(block).not.toBeNull();
    const body = css.slice(block?.index ?? 0);
    expect(body.slice(0, body.indexOf('}'))).toContain('--scrim:');
  });

  it('still holds the LOCKED scrim value (§15.1 floor: never below 0.55)', () => {
    expect(css).toContain('--scrim: rgb(0 0 0 / 0.55)');
  });

  it('hides a closed <dialog> for engines that do not implement it (D1b)', () => {
    expect(css).toMatch(/dialog:not\(\[open\]\)\s*\{\s*display:\s*none;/);
  });
});
