import type { ComponentPropsWithRef, ReactElement } from 'react';

/**
 * Source: Lucide `icons/mail.svg` @ lucide-static 1.49.0 (lucide.dev),
 * retrieved 2026-10-14 from
 * https://cdn.jsdelivr.net/npm/lucide-static@1.49.0/icons/mail.svg.
 * ISC license.
 *
 * Whole-svg glyph component (pattern refactor, board 2026-08-16): the complete
 * `<svg>` lives in this file; call sites import it and hand it color/size from
 * code. Frame rules every glyph file must carry itself: see ./README.md.
 *
 * First consumer: sections/ShareLinks, the e-mail link of the blog article's
 * share row (blog-article run, 2026-10-14; why the share glyphs paint with
 * currentColor alone: Facebook.tsx's header quotes the owner) — the PR #68
 * Whatsapp precedent: a glyph rides the lane that needs it, never a lane of
 * its own. Stroked family at 2, the Lucide weight (Phone's). Two shapes: the
 * envelope (a rounded frame) and its flap.
 */

export type MailProps = {
  /** Box scale, rem-based (§7): sm 1rem · md 1.5rem (default) · lg 2rem. */
  size?: 'sm' | 'md' | 'lg';
} & Omit<
  ComponentPropsWithRef<'svg'>,
  'children' | 'size' | 'width' | 'height'
>;

const sizeClasses = { sm: 'size-4', md: 'size-6', lg: 'size-8' } as const;

export function Mail({
  size = 'md',
  className,
  'aria-label': ariaLabel,
  ...rest
}: MailProps): ReactElement {
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
      <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
      <rect x="2" y="4" width="20" height="16" rx="2" />
    </svg>
  );
}
