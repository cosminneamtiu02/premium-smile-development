# Glyphs — whole-svg asset components

Pattern (owner decision, board 2026-08-16): each file holds ONE complete `<svg>`
exported as a component; call sites import it and parametrise color/size from code
(`<Phone className="text-cta" />`). There is no renderer and no registry anymore —
which is exactly why every file must keep the frame rules itself. What one file
(`ui/Icon`) used to guarantee for all glyphs is now this checklist.

## New-glyph checklist — every step, same commit

1. **One component per file**; file name = exported component name
   (`Phone.tsx` → `Phone`). Copy an existing file as the template.
2. **`viewBox="0 0 24 24"`** — the shared grid. **Never `width`/`height`
   attributes**: CSS owns the geometry, and composed controls (GlyphButton's
   `[&_svg]:size-*`) size their icon from outside. The prop type must `Omit`
   `'width' | 'height'` (and the own-prop name `'size'`) from the native side —
   copy the template — so a pasted attribute doesn't even compile.
3. **Paint with `currentColor` only** — no hex/rgb anywhere in the markup. Color is
   the call site's parameter; hover fades and any future theme depend on this.
   (Raw design-tool exports arrive with baked colors — strip them.)
4. **Decorative by default**: `aria-hidden`, unless a non-empty `aria-label` flips
   the glyph to `role="img"` — keep the exact branch from an existing file
   (empty/whitespace labels must stay decorative; a nameless image is an axe fail).
5. **Add the component to `all-glyphs.ts`** — the hand-maintained list that feeds
   the Gallery story and the frame-contract tests. Skipping this row = the new
   glyph silently escapes the visual net and the tests.
6. **Record source + license** in the header comment (§3: this project ships no
   icon package — paths are vectorized into the repo).
7. **No behavior in this folder.** Animated artwork is a *control* owned by its
   feature (the Header burger morph precedent) — assets stay inert pictures.

## Sizing rule

The `size` prop (sm 1rem · md 1.5rem · lg 2rem) emits exactly ONE size class.
Never pass `size-*` through `className` — two same-property utilities fight over
cascade order (house rule; TextButton.tsx documents it). Parents that must own the
geometry use the descendant utility (`[&_svg]:size-5`), which outranks the atom's
own class by specificity.
