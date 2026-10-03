import type { ComponentPropsWithRef, ReactElement } from 'react';

/**
 * Source: drawn for the doctor-pages run, round 2f, D30 (the „în cifre"
 * tiles of sections/DoctorStats). License: the project's own — no
 * third-party icon set, so no license rides with it (§3: this project ships
 * no icon package).
 *
 * A DRAFT the owner may replace with his own artwork: the swap is the five
 * shapes below and nothing else — every consumer paints the glyph through
 * `currentColor` and sizes it from outside.
 *
 * Whole-svg glyph component (pattern refactor, board 2026-08-16): the
 * complete `<svg>` lives in this file; call sites import it and hand it
 * color/size from code. Frame rules every glyph file must carry itself: see
 * ./README.md.
 *
 * Meaning: COURSES — a cup with two handles on a stem and a flared base, the
 * „Cursuri" tile (the reference pairs that count with a recognition, which
 * is why the drawing is a trophy and not a book). Stroked family at 1.5, the
 * run's line weight (CalendarCheck's header). Five shapes: the cup, its two
 * handles, the stem, the base.
 */

export type TrophyProps = {
  /** Box scale, rem-based (§7): sm 1rem · md 1.5rem (default) · lg 2rem. */
  size?: 'sm' | 'md' | 'lg';
} & Omit<
  ComponentPropsWithRef<'svg'>,
  'children' | 'size' | 'width' | 'height'
>;

const sizeClasses = { sm: 'size-4', md: 'size-6', lg: 'size-8' } as const;

export function Trophy({
  size = 'md',
  className,
  'aria-label': ariaLabel,
  ...rest
}: TrophyProps): ReactElement {
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
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(labelled
        ? { role: 'img', 'aria-label': ariaLabel }
        : { 'aria-hidden': true })}
      {...rest}
    >
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 6H5a2 2 0 0 0 0 4h2.1" />
      <path d="M17 6h2a2 2 0 0 1 0 4h-2.1" />
      <path d="M12 14v3.5" />
      <path d="M9 17.5h6l1 3H8z" />
    </svg>
  );
}
