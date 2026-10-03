# Flags — whole-svg fixed-color asset components

Backgrounds for the language dial's discs (speed-dial-flags lane, owner-approved
2026-09-04, treatment tuned live 2026-09-05): each file holds ONE complete national
flag `<svg>` exported as a component. The pattern is `assets/glyphs/` law with ONE
deliberate inversion — a flag is not tintable artwork, so **fixed colors are
REQUIRED and `currentColor` is FORBIDDEN** (`Flags.test.tsx` enforces both
directions). §8.5 note: flags here are decorative art behind visible codes and
endonym names — never themselves the identification of a language; the full §8.5
amendment rides the SpeedDial wiring lane.

## New-flag checklist — every step, same commit

1. **One component per file**; file name = exported component name
   (`RomaniaFlag.tsx` → `RomaniaFlag`). Copy an existing file as the template.
2. **The official construction on its own ratio** — the `viewBox` IS the flag's
   ratio (2:3 vertical tricolors, 3:5 Germany, 1:2 Union Jack); there is no
   shared grid, unlike glyphs. **`preserveAspectRatio="xMidYMid slice"` is
   REQUIRED**: it makes the drawing COVER whatever box the consumer gives it —
   the cover-crop is the folder's whole contract.
3. **Fixed colors only** — record the hex triad and the construction source
   (national flag constructions are public domain) in the header comment.
   `currentColor` anywhere in the markup fails the test suite.
4. **Never `width`/`height` attributes**: the consumer owns geometry entirely —
   a crop box with `[&_svg]:size-full` (see the Gallery story). The prop type
   must `Omit` `'width' | 'height' | 'children'` — copy the template so a pasted
   attribute doesn't even compile.
5. **Decorative by default**: `aria-hidden`, unless a non-empty `aria-label`
   flips the flag to `role="img"` — keep the exact trim-guard branch from an
   existing file (empty/whitespace labels stay decorative).
6. **Add the component to `all-flags.ts`** — the registry feeds the Gallery
   story and `Flags.test.tsx`; the test's folder-glob completeness check fails a
   skipped row loudly (stronger than the glyphs hand-list).
7. **No behavior in this folder.** Flags are inert pictures; state and hover
   manners belong to the control that wears them.

## Sizing rule

There is no `size` prop, on purpose: flags are backgrounds, not icons. The
consumer decides the box and crops it (`overflow-hidden rounded-full` for the
dial's discs); the svg fills it via rule 2's slice.
