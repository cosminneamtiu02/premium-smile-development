import type { ComponentPropsWithRef, ReactElement } from 'react';

/**
 * Source: the old site's own `ui/stars` component (`STAR_PATH`,
 * apps/frontend/src/shared/components/ui/stars/stars.tsx) — the clinic's own
 * artwork, not a third-party icon set, so no license rides with it.
 *
 * INTERIM SHAPE (owner decision D4, master board fb-432…448): this five-point
 * polygon stands in until the owner supplies the real full-star SVG. The swap
 * is this ONE path string and nothing else — every consumer paints it through
 * `currentColor`, and ui/StarRating derives full, half and empty from this one
 * shape rather than from three drawings (see StarRating.tsx's header). Should
 * the owner's half/empty drawings ever carry a DIFFERENT OUTLINE, they become
 * glyph files of their own here and the atom composes them; that is the only
 * variant of this decision that adds files.
 *
 * Whole-svg glyph component (pattern refactor, board 2026-08-16): the complete
 * `<svg>` lives in this file; call sites import it and hand it color/size from
 * code. Frame rules every glyph file must carry itself: see ./README.md.
 *
 * First consumer: ui/StarRating (the reviews-carousel run) — the PR #68
 * Whatsapp / Pin precedent: a glyph rides the lane that needs it, never a lane
 * of its own. Filled family, one closed path.
 */

export type StarProps = {
  /** Box scale, rem-based (§7): sm 1rem · md 1.5rem (default) · lg 2rem. */
  size?: 'sm' | 'md' | 'lg';
} & Omit<
  ComponentPropsWithRef<'svg'>,
  'children' | 'size' | 'width' | 'height'
>;

const sizeClasses = { sm: 'size-4', md: 'size-6', lg: 'size-8' } as const;

export function Star({
  size = 'md',
  className,
  'aria-label': ariaLabel,
  ...rest
}: StarProps): ReactElement {
  // Decorative by default (§9): a non-empty label flips the glyph to a named
  // image; empty/whitespace stays hidden — a nameless role="img" is an axe fail.
  const labelled = typeof ariaLabel === 'string' && ariaLabel.trim() !== '';
  return (
    <svg
      viewBox="0 0 24 24"
      className={[sizeClasses[size], 'shrink-0', className]
        .filter(Boolean)
        .join(' ')}
      fill="currentColor"
      {...(labelled
        ? { role: 'img', 'aria-label': ariaLabel }
        : { 'aria-hidden': true })}
      {...rest}
    >
      <path d="M12 2.5l2.95 6.18 6.8.66-5.07 4.65 1.5 6.61L12 17.27 5.82 20.6l1.5-6.61L2.25 9.34l6.8-.66L12 2.5z" />
    </svg>
  );
}
