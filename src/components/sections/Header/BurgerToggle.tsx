import type { ReactElement } from 'react';

// ── sections/Header/BurgerToggle — the burger's ☰ ⇄ ✕ morph (D12), whole.
//
// One svg, BOTH poses: the closed pose is the three bars drawn below; the open
// pose is not a second drawing but TRANSFORMS of the same bars — the outer two
// travel 6 units to the middle and rotate ±45° about their own centres into
// the ✕ while the middle bar fades. The transitions are armed on the bars
// permanently, so the flip of ONE attribute — aria-expanded on the GlyphButton
// around this svg — plays the morph forward on open and backward on close,
// with zero JavaScript of its own. `motion-reduce` turns both directions into
// an instant swap.
//
// ── WHY THIS LIVES IN THE HEADER FOLDER, NOT assets/glyphs/ (§3c placement,
// owner 2026-08-16). assets/ holds NOUNS — inert, behavior-free artwork
// (glyphs README rule 7). This control is a VERB: its classes ARE Header
// behavior (the D5/D12 clocks), so artwork and behavior co-live in one
// section-owned file beside the component that drives it. It is also why this
// is JSX and not a `.svg` file: an image document cannot see `aria-expanded`
// on the button around it and no page CSS reaches inside one (fb-83) — the
// bars must be elements of the page's own DOM.
//
// ── THE CONTRACT WITH GlyphButton. The atom guarantees exactly one thing:
// the `group` marker class on its root. The bars' `group-aria-expanded:*`
// utilities read THAT root's state. Wave-1 constraint 3 travels with this
// file: no `group` may appear on any wrapper between that root and these
// bars, or the unnamed outer group captures the utilities and the morph
// freezes (Header.tsx names its own group `group/bar` for exactly this
// reason; Header.test.tsx asserts the seam).
//
// ── [transform-box:fill-box] IS LOAD-BEARING (G2 review, 2026-08-13). An SVG
// child's transform-box defaults to `view-box`, which resolves origin-center
// to the centre of the 24×24 VIEWBOX for every bar alike — each bar would
// rotate about a point that is not on it and the two diagonals land
// off-centre: a lopsided, right-shifted ✕ (confirmed in Chromium, fixed by
// exactly this declaration). fill-box re-anchors each rotation to that bar's
// own bounding box; a stroked horizontal path has a zero-HEIGHT fill box —
// the geometric bounding box ignores stroke width — so its centre is the
// midpoint of the rule itself, and both diagonals centre on (12,12).
//
// ── THE TRANSITION PROPERTY IS PER BAR, never in the shared string: the
// middle bar animates opacity and the outer two animate the transform set
// (Tailwind v4 emits the individual `translate`/`rotate` properties, and
// `transition-transform` covers exactly that set). Two same-property
// utilities in one class list would fight over cascade order (house rule —
// TextButton.tsx carries it).
//
// Geometry: bespoke, drawn for this project (D12) — no icon package ships an
// animatable three-bar set. Bars at y = 6 / 12 / 18 on the shared 24-unit
// grid; stroke inherits currentColor, so the button's ink recolors the glyph.
// Decorative always (aria-hidden): the button's aria-label names the control,
// and a labelled child would double-announce. No props on purpose — this is
// bespoke Header machinery, not a reusable atom.

const barMotion =
  '[transform-box:fill-box] origin-center ' +
  'duration-300 ease-out motion-reduce:transition-none';

export function BurgerToggle(): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path
        d="M4 6h16"
        className={`${barMotion} transition-transform group-aria-expanded:translate-y-[6px] group-aria-expanded:rotate-45`}
      />
      <path
        d="M4 12h16"
        className={`${barMotion} transition-opacity group-aria-expanded:opacity-0`}
      />
      <path
        d="M4 18h16"
        className={`${barMotion} transition-transform group-aria-expanded:-translate-y-[6px] group-aria-expanded:-rotate-45`}
      />
    </svg>
  );
}
