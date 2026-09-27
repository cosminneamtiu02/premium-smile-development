import type { ComponentPropsWithRef, ReactElement } from 'react';

/**
 * Source: drawn for the doctor-pages run, round 2f, D30 (the „în cifre"
 * tiles of sections/DoctorStats). License: the project's own — no
 * third-party icon set, so no license rides with it (§3: this project ships
 * no icon package).
 *
 * A DRAFT the owner may replace with his own artwork: the swap is the two
 * shapes below and nothing else — every consumer paints the glyph through
 * `currentColor` and sizes it from outside.
 *
 * Whole-svg glyph component (pattern refactor, board 2026-08-16): the
 * complete `<svg>` lives in this file; call sites import it and hand it
 * color/size from code. Frame rules every glyph file must carry itself: see
 * ./README.md.
 *
 * Meaning: SUCCESSFUL INTERVENTIONS — a molar (a rounded crown over two
 * roots, mirror-symmetric about the grid's vertical centre line x = 12) with
 * a check inside the crown, the „Intervenții reușite" tile. Stroked family at
 * 1.5, the run's line weight (CalendarCheck's header). Two shapes: the tooth
 * outline as ONE closed path, and the check.
 */

export type ToothCheckProps = {
  /** Box scale, rem-based (§7): sm 1rem · md 1.5rem (default) · lg 2rem. */
  size?: 'sm' | 'md' | 'lg';
} & Omit<
  ComponentPropsWithRef<'svg'>,
  'children' | 'size' | 'width' | 'height'
>;

const sizeClasses = { sm: 'size-4', md: 'size-6', lg: 'size-8' } as const;

export function ToothCheck({
  size = 'md',
  className,
  'aria-label': ariaLabel,
  ...rest
}: ToothCheckProps): ReactElement {
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
      <path d="M7.5 3C5 3 3.5 5 3.5 7.5c0 2.2.9 3.6 1.6 5.4.6 1.6.7 3.2 1.1 5.1.3 1.6 1 3 2.1 3 1.4 0 1.7-2 2-3.6.2-1.2.6-2.4 1.7-2.4s1.5 1.2 1.7 2.4c.3 1.6.6 3.6 2 3.6 1.1 0 1.8-1.4 2.1-3 .4-1.9.5-3.5 1.1-5.1.7-1.8 1.6-3.2 1.6-5.4C20.5 5 19 3 16.5 3c-1.9 0-2.7 1-4.5 1S9.4 3 7.5 3z" />
      <path d="m9 8.5 2 2 4-4" />
    </svg>
  );
}
