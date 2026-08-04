import { instagram } from './instagram';
import { phone } from './phone';
import { tiktok } from './tiktok';

// src/assets/glyphs/ — the site's glyph data: an assets-style folder that
// lives on the CODE side of the fence (owner decision fb-84, 2026-08-05).
// TypeScript on purpose: every glyph compiles INLINE into the page, which is
// what lets currentColor recolor it — served from public/ it would be a
// sealed <img> no CSS color can reach (canvas fb-83).
// Import rule: consumed by ui/Icon ONLY — call sites always go through
// <Icon name="…">, never read this registry directly.
// ONE glyph per file: the file name IS the export name IS the registry key,
// so `IconName` (= keyof typeof GLYPHS in Icon.tsx) grows the moment a file
// is added AND registered below (import + re-export + one GLYPHS entry, all
// in this file). Consumers and stories never change for a new glyph.
// Every file records where its path data came from and under which license
// (§3: this project ships no icon package — paths are vectorized into the
// repo). Brand glyphs are nominative use: they identify the clinic's own
// official profiles; the trademarks belong to their owners.
// A glyph carries geometry only, never a color: `mode` tells Icon how to
// paint the path, and both families draw with currentColor (plan §4d).

export type Glyph = {
  /** How Icon paints it: 'stroke' = outline family · 'fill' = solid-shape family. */
  readonly mode: 'stroke' | 'fill';
  /** SVG path data, normalized to the shared viewBox "0 0 24 24". */
  readonly d: string;
};

export { instagram } from './instagram';
export { phone } from './phone';
export { tiktok } from './tiktok';

export const GLYPHS = { phone, instagram, tiktok } as const;
