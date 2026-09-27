import type { ComponentPropsWithRef, ReactElement } from 'react';

/**
 * Source: drawn for the doctor-pages run, round 2i, on the owner's word of
 * 2026-09-26 ("get another svg at Ani de experiență, i do not like that one
 * at all") — it replaces the round-2f `PersonCheck` draft (a bust with a
 * check badge), which is deleted. License: the project's own — no
 * third-party icon set, so no license rides with it (§3: this project ships
 * no icon package).
 *
 * Still a DRAFT the owner may replace with his own artwork: the swap is the
 * four shapes below and nothing else — every consumer paints the glyph
 * through `currentColor` and sizes it from outside.
 *
 * Whole-svg glyph component (pattern refactor, board 2026-08-16): the
 * complete `<svg>` lives in this file; call sites import it and hand it
 * color/size from code. Frame rules every glyph file must carry itself: see
 * ./README.md.
 *
 * Meaning: EXPERIENCE — a calendar page with a check on it, the „Ani de
 * experiență" tile: years, counted and done. Stroked family, drawn at 1.5 on
 * the 24-unit grid — the run's line weight for all four of its glyphs (D30):
 * the tiles paint them at 3rem, where the template's 2-unit stroke reads
 * heavy beside the unbolded serif numbers. Four shapes: the page (a rounded
 * frame), the two binding rings, the header rule and the check.
 */

export type CalendarCheckProps = {
  /** Box scale, rem-based (§7): sm 1rem · md 1.5rem (default) · lg 2rem. */
  size?: 'sm' | 'md' | 'lg';
} & Omit<
  ComponentPropsWithRef<'svg'>,
  'children' | 'size' | 'width' | 'height'
>;

const sizeClasses = { sm: 'size-4', md: 'size-6', lg: 'size-8' } as const;

export function CalendarCheck({
  size = 'md',
  className,
  'aria-label': ariaLabel,
  ...rest
}: CalendarCheckProps): ReactElement {
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
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4" />
      <path d="M3 10h18" />
      <path d="m9 15.5 2 2 4-4" />
    </svg>
  );
}
