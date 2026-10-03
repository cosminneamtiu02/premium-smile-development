import type { ComponentPropsWithRef, ReactElement } from 'react';

/**
 * Source: drawn for the doctor-pages run, round 2f, D30 (the „în cifre"
 * tiles of sections/DoctorStats). License: the project's own — no
 * third-party icon set, so no license rides with it (§3: this project ships
 * no icon package).
 *
 * A DRAFT the owner may replace with his own artwork: the swap is the six
 * shapes below and nothing else — every consumer paints the glyph through
 * `currentColor` and sizes it from outside.
 *
 * Whole-svg glyph component (pattern refactor, board 2026-08-16): the
 * complete `<svg>` lives in this file; call sites import it and hand it
 * color/size from code. Frame rules every glyph file must carry itself: see
 * ./README.md.
 *
 * Meaning: PATIENTS — three busts, the middle one in front and a little
 * taller, the two behind it shown by a head and an OUTER shoulder each. The
 * inner shoulders would sit behind the front figure, so they are not drawn:
 * crossing strokes at 3rem read as a tangle, not as depth. The „Pacienți"
 * tile. Stroked family at 1.5, the run's line weight (CalendarCheck's header).
 */

export type PeopleProps = {
  /** Box scale, rem-based (§7): sm 1rem · md 1.5rem (default) · lg 2rem. */
  size?: 'sm' | 'md' | 'lg';
} & Omit<
  ComponentPropsWithRef<'svg'>,
  'children' | 'size' | 'width' | 'height'
>;

const sizeClasses = { sm: 'size-4', md: 'size-6', lg: 'size-8' } as const;

export function People({
  size = 'md',
  className,
  'aria-label': ariaLabel,
  ...rest
}: PeopleProps): ReactElement {
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
      <circle cx="12" cy="8" r="3" />
      <path d="M6.5 20v-.5a5.5 5.5 0 0 1 11 0v.5" />
      <circle cx="5" cy="10" r="2.5" />
      <path d="M1.5 20v-.5A3.5 3.5 0 0 1 5 16" />
      <circle cx="19" cy="10" r="2.5" />
      <path d="M22.5 20v-.5A3.5 3.5 0 0 0 19 16" />
    </svg>
  );
}
