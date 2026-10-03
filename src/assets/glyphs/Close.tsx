import type { ComponentPropsWithRef, ReactElement } from 'react';

/**
 * Source: Lucide `icons/x.svg` @ main (lucide.dev), retrieved 2026-08-17.
 * ISC license.
 *
 * The static ✕ — kept as an inert reference model on the owner's ask
 * (2026-08-17), the noun counterpart of the Header burger morph's OPEN pose.
 * Deliberately drawn as TWO strokes, not three transformed bars: the morph's
 * ✕ is a byproduct of animating the burger (see
 * components/sections/Header/BurgerToggle.tsx); a standalone close glyph is
 * its own honest drawing. Future call sites that need a plain ✕ (a modal's
 * close button, a dismissable banner) import THIS; anything that must morph
 * copies the BurgerToggle technique instead (README rule 7).
 *
 * Whole-svg glyph component (pattern refactor, board 2026-08-16): the complete
 * `<svg>` lives in this file; call sites import it and hand it color/size from
 * code. Frame rules every glyph file must carry itself: see ./README.md.
 */

export type CloseProps = {
  /** Box scale, rem-based (§7): sm 1rem · md 1.5rem (default) · lg 2rem. */
  size?: 'sm' | 'md' | 'lg';
} & Omit<
  ComponentPropsWithRef<'svg'>,
  'children' | 'size' | 'width' | 'height'
>;

const sizeClasses = { sm: 'size-4', md: 'size-6', lg: 'size-8' } as const;

export function Close({
  size = 'md',
  className,
  'aria-label': ariaLabel,
  ...rest
}: CloseProps): ReactElement {
  // Decorative by default (§9): a non-empty label flips the glyph to a named
  // image; empty/whitespace stays hidden — a nameless role="img" is an axe fail.
  const labelled = typeof ariaLabel === 'string' && ariaLabel.trim() !== '';
  return (
    <svg
      viewBox="0 0 24 24"
      className={[sizeClasses[size], 'shrink-0', className]
        .filter(Boolean)
        .join(' ')}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(labelled
        ? { role: 'img', 'aria-label': ariaLabel }
        : { 'aria-hidden': true })}
      {...rest}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
