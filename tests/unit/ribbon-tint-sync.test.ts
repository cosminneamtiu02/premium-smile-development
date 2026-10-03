import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// THE RIBBON WEARS THE LILAC BAND'S GROUND (CLAUDE.md §15.26 round 6 — the
// owner, 2026-10-02, with a screenshot of that ground: "i want it on every
// screen to be the shade that the background of "IN NUMBERS …" is"). The
// band's ground is a MIX — sections/TintedBand's `--tint`, --accent-decorative
// at a share over transparent, laid on the page ground — while globals.css's
// `--ribbon` is a LITERAL, because lib/ribbon-draw reads its colour through a
// canvas round-trip that answers #rrggbb (its THE COLOURS). Two spellings of
// one colour, and this is their KEEP-IN-SYNC pin: it reads the share out of
// TintedBand's own class and both tokens out of globals.css, mixes them as
// the browser composites them — per channel, in sRGB, rounded to a level —
// and must find `--ribbon`. So the day §15.1's hue confirm moves
// --accent-decorative, or the band's share moves, this test names the
// ribbon's new value. (The owner's screenshot measured that ground at
// rgb(212 207 220), every one of its 30 400 pixels.)

const REPO = new URL('../../', import.meta.url);
const read = (file: string) => readFileSync(new URL(file, REPO), 'utf8');
const globals = read('src/styles/globals.css');
const band = read('src/components/sections/TintedBand/TintedBand.tsx');

/** A colour token's value as globals.css declares it — exactly once. */
function token(name: string): string {
  const found = [
    ...globals.matchAll(new RegExp(`^\\s*${name}:\\s*([^;]+);`, 'gm')),
  ];
  expect(found, `${name} is declared once`).toHaveLength(1);
  return found[0][1].trim();
}

/** `#rrggbb` → its three channels, 0 … 255. */
function channels(hex: string): readonly number[] {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (match === null) throw new Error(`“${hex}” is not #rrggbb`);
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

describe('--ribbon is the lilac band’s ground (KEEP IN SYNC with sections/TintedBand)', () => {
  it('mixes --accent-decorative over --page at the band’s own share — and finds --ribbon', () => {
    const tint =
      /\[--tint:color-mix\(in_srgb,var\(--color-accent-decorative\)_(\d+)%,transparent\)\]/.exec(
        band,
      );
    if (tint === null) {
      throw new Error(
        'sections/TintedBand no longer mixes its --tint from --color-accent-decorative over transparent — re-derive --ribbon from what it does now',
      );
    }
    const share = Number(tint[1]) / 100;
    expect(share).toBe(0.3);
    const accent = channels(token('--accent-decorative'));
    const page = channels(token('--page'));
    const ground = accent.map((value, i) =>
      Math.round(share * value + (1 - share) * page[i]),
    );
    expect(channels(token('--ribbon'))).toEqual(ground);
  });

  it('reads each token by its whole name — the ribbon’s colour is never its shadow’s', () => {
    // The reader anchors `--ribbon:` at a declaration's start: the shadow's
    // token, which begins with the same nine characters, is its own.
    expect(channels(token('--ribbon-shadow'))).toEqual([45, 38, 60]);
    expect(token('--ribbon')).not.toBe(token('--ribbon-shadow'));
  });
});
