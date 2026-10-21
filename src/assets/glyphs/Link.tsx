import type { ComponentPropsWithRef, ReactElement } from 'react';

/**
 * Source: Lucide `icons/link.svg` @ lucide-static 1.49.0 (lucide.dev),
 * retrieved 2026-10-14 from
 * https://cdn.jsdelivr.net/npm/lucide-static@1.49.0/icons/link.svg.
 * ISC license.
 *
 * Whole-svg glyph component (pattern refactor, board 2026-08-16): the complete
 * `<svg>` lives in this file; call sites import it and hand it color/size from
 * code. Frame rules every glyph file must carry itself: see ./README.md.
 *
 * A PICTURE of a chain link, not a navigation component: this site has no
 * Link component at all (every internal link is a plain `<a href>`, brief
 * §15.13, and next/link is a lint error), so the name is free — a call site
 * that reads ambiguously may still import it under an alias.
 *
 * First consumer: sections/ShareLinks' copy button (CopyLinkButton), the
 * blog article's copy-the-address control (blog-article run, 2026-10-14; why
 * the share glyphs paint with currentColor alone: Facebook.tsx's header
 * quotes the owner) — the PR #68 Whatsapp precedent: a glyph rides the lane
 * that needs it, never a lane of its own. Stroked family at 2, the Lucide
 * weight (Phone's). Two shapes: the two interlocked links.
 */

export type LinkProps = {
  /** Box scale, rem-based (§7): sm 1rem · md 1.5rem (default) · lg 2rem. */
  size?: 'sm' | 'md' | 'lg';
} & Omit<
  ComponentPropsWithRef<'svg'>,
  'children' | 'size' | 'width' | 'height'
>;

const sizeClasses = { sm: 'size-4', md: 'size-6', lg: 'size-8' } as const;

export function Link({
  size = 'md',
  className,
  'aria-label': ariaLabel,
  ...rest
}: LinkProps): ReactElement {
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
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
