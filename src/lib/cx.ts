// lib/cx.ts — THE class-join helper, moved to the foundation ring so every
// tier may import it (cx-to-lib lane, org-review F2 decision a′, 2026-09-02).
// History: promoted into ui/ on owner order fb-307 (2026-09-01: the G2
// advisory on the Eyebrow lane counted 3 private copies, a full grep found
// TEN byte-identical ones — every atom plus slot.ts — so §4's used-by-2+
// promotion rule applied many times over); the org-review round then caught
// the ui-only fence forcing sections to hand-roll the same join, and the
// owner moved the file here.
//
// ── WHY cx MOVED AND ITS ui/ SIBLINGS DID NOT (owner-answered, 2026-09-02;
// two questions, in order):
//   1. Does the module import React / exist to construct components? slot.ts
//      (the cloneElement engine + atom API law: BUTTON_ONLY_PROPS, the
//      aria-label merge) and attach-ref.ts (React 19 callback-ref cleanup)
//      both do — they live with the components in ui/. lib/ stays REACT-FREE
//      on purpose: plain-Node build tooling already loads foundation-ring
//      modules bare — `node tools/generate-root-redirect.ts` (the build's
//      last step) imports i18n/ ring modules under Node's native type
//      stripping — and lib/ is held to that same bar, so everything here
//      must load without a React runtime.
//   2. Does it encode a specific atom's look or API? disc.ts is two atoms'
//      literal class strings (pixels); a section importing it would restyle
//      atom internals, banned by §6.8 — its ui-only fence is enforcement,
//      not tidiness.
// cx alone passes both (no React import, no atom knowledge) — the only
// mover. Recorded trigger: the day a SECTION island needs the same ref-merge
// as attach-ref.ts, that module's home gets re-decided the way cx's was.
//
// ── THE GLYPH CARVE-OUT: the five inline joins in src/assets/glyphs/* stay
// hand-rolled DELIBERATELY and are not drift for a future sweep — that
// folder's README is template law (each glyph file is a complete, standalone
// copy of the template; the checklist replaced shared plumbing when ui/Icon
// died). Everything else joins classes through this file.

/**
 * Builds one className string: each part is either a string of utility
 * classes or the falsy result of a conditional (`bold && 'font-bold'`);
 * falsy parts are dropped and the rest space-joined, so
 * `cx('text-base', undefined, 'col-span-2')` → `'text-base col-span-2'`.
 *
 * STANDING RULE — every atom imports this, so widening the accepted types
 * (numbers, arrays, null, …) is a deliberate API change for all of them at
 * once, never a drive-by edit.
 */
export const cx = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(' ');
