import type { ComponentPropsWithRef, ReactElement } from 'react';

/**
 * Source: Lucide `icons/chevron-left.svg` @ main (lucide.dev), retrieved 2026-09-10.
 * ISC license.
 *
 * Whole-svg glyph component (pattern refactor, board 2026-08-16): the complete
 * `<svg>` lives in this file; call sites import it and hand it color/size from
 * code. Frame rules every glyph file must carry itself: see ./README.md.
 *
 * First consumer: sections/ReviewsCarousel's deck controls (prev/next — the rotation control was struck on the owner's word at pack round 2, 2026-09-12: ReviewsDeck.tsx's NO ROTATION CONTROL paragraph) — the PR #68 Whatsapp / PR #93 Pin precedent: a
 * glyph rides the section lane that needs it, never a lane of its own
 * (reviews-deck run, master board fb-432…448, 2026-09-10). Stroked, like Pin.
 */

export type ChevronLeftProps = {
  /** Box scale, rem-based (§7): sm 1rem · md 1.5rem (default) · lg 2rem. */
  size?: 'sm' | 'md' | 'lg';
} & Omit<
  ComponentPropsWithRef<'svg'>,
  'children' | 'size' | 'width' | 'height'
>;

const sizeClasses = { sm: 'size-4', md: 'size-6', lg: 'size-8' } as const;

export function ChevronLeft({
  size = 'md',
  className,
  'aria-label': ariaLabel,
  ...rest
}: ChevronLeftProps): ReactElement {
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
