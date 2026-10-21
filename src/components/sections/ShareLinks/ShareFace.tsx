import type { ReactElement } from 'react';

// sections/ShareLinks/ShareFace — what every share control SHOWS: the glyph
// beside its word. ONE spelling for the four controls, because two files draw
// them — ShareLinks.tsx (a server component) prints the three links, and
// CopyLinkButton.tsx prints the copy button (a client island, one of the two
// the article page adds: sections/CardCarousel, the gallery's carousel, is
// the other — CLAUDE.md §16) — and a class string copied into both would
// drift. No hook, no state and no 'use client', so it renders on the server
// for the links and in the browser for the island alike (sections/PriceList's
// arrival.ts is the precedent for a shape that a server file and an island
// share).
//
// ── THE FACE, `inline-flex items-center gap-2` (the build contract's span):
// the glyph and the word on one line, centred on each other, 8px apart — a
// third of the 24px that separates one control's word from the next control's
// glyph (ShareLinks.tsx's THE ROW), so each pair reads as one control. The
// glyph arrives at ui's `sm` size, 16px, and paints `currentColor`, so it
// takes the control's own colour: ink at rest and the lavender on hover, with
// the word, in one transition (ui/TextButton's colour clock). Decorative
// (`aria-hidden`, every glyph's default): the control is named by its word or
// by its `aria-label`, never by the picture.
//
// ── THE WORD, `sr-only` under its container's 42rem and visible from it
// (ShareLinks.tsx's THE LABELS' STEP has the measurement), on all four
// controls in every state. Hidden the screen-reader-only way and never with
// `display: none`: a word taken out of the accessibility tree would take the
// copy button's NAME with it, since that button is named by its content
// (CopyLinkButton.tsx). The step is a CONTAINER query and this piece declares
// no container: it reads the nearest one above it — on the article page,
// sections/PostCover's root. The copy button's word never changes: what a
// press did is said on the row's status line, under the four controls
// (CopyLinkButton.tsx's WHAT THE VISITOR LEARNS). Until 2026-10-20 a failed
// copy showed its sentence HERE, in the button, at every width, which widened
// the button and moved the link beside it under the visitor's finger (round 2
// of the reviews, measured); the exception is gone with the failure's word.

/**
 * THE HIT AREA's width floor: 44px (2.75rem), the §9 target, on every control.
 * ui/TextButton guarantees the height (`min-h-11`) and owns no width (§8.4: a
 * label must never be clipped); with its word hidden a control is the 16px
 * glyph plus the atom's 8px a side — 32px wide, under the 44px aim — so the
 * call site raises the floor. A floor, never a width: a labelled control
 * stays as wide as its word. In ui/TextButton's own words, `className` here
 * sizes the BOX the parent places (§6.8); nothing inside the atom is restyled.
 */
export const CONTROL = 'min-w-11';

/** The glyph and its word side by side (THE FACE). */
export const FACE = 'inline-flex items-center gap-2';

/** The word: screen-reader-only under the container's 42rem, visible from it (THE WORD). */
export const WORD = 'sr-only @2xl:not-sr-only';

export type ShareFaceProps = Readonly<{
  /** The control's glyph at the `sm` size — decorative, it paints `currentColor`. */
  glyph: ReactElement;
  /** The control's word, finished (§8.1). */
  children: string;
}>;

export function ShareFace({ glyph, children }: ShareFaceProps): ReactElement {
  return (
    <span className={FACE}>
      {glyph}
      <span className={WORD}>{children}</span>
    </span>
  );
}
