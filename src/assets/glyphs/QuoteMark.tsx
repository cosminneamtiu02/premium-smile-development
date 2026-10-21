import type { ComponentPropsWithRef, ReactElement } from 'react';

/**
 * Source: Lucide `icons/quote.svg` @ lucide-static 1.49.0 (lucide.dev),
 * retrieved 2026-10-14 from
 * https://cdn.jsdelivr.net/npm/lucide-static@1.49.0/icons/quote.svg.
 * ISC license. Named QuoteMark, not Quote: it is the PUNCTUATION drawn large,
 * an ornament — the quotation itself is the consumer's `<blockquote>`.
 *
 * Whole-svg glyph component (pattern refactor, board 2026-08-16): the complete
 * `<svg>` lives in this file; call sites import it and hand it color/size from
 * code. Frame rules every glyph file must carry itself: see ./README.md.
 *
 * First consumer: sections/PostConclusion, the doctor's closing words at the
 * end of a blog article (blog-article run, 2026-10-14; the owner, verbatim:
 * "with that faint quote which will be the color of the thread that extends
 * on the page as you scroll the doctor cards, that failt liliac to pink") —
 * the PR #68 Whatsapp precedent: a glyph rides the lane that needs it, never
 * a lane of its own. The faint colour is the CALL SITE's (the floss ribbon's
 * token, handed in through currentColor) and so is the large size (from the
 * parent, the README's sizing rule) — this file stays the template. The FILL
 * and the half TURN are the call site's too: PostConclusion's figure fills
 * both shapes with the colour of their outline and turns the glyph 180° (its
 * THE QUOTE MARK paragraph), so the closing "99" pair drawn below reads there
 * as a solid opening mark (“) — allowed because neither enters this file: a
 * CSS fill outranks the `fill="none"` attribute without rewriting it and is
 * still currentColor (README rule 3), and the turn is geometry the parent
 * owns the way it owns the size (the sizing rule's descendant utility).
 *
 * Stroked family at 2, the Lucide weight (Phone's): the two marks are drawn
 * as OUTLINES. Two shapes, one per mark, each a block with its tail curling
 * down to the left — the "99" pair (”) as Lucide draws it, Romanian's
 * closing mark.
 */

export type QuoteMarkProps = {
  /** Box scale, rem-based (§7): sm 1rem · md 1.5rem (default) · lg 2rem. */
  size?: 'sm' | 'md' | 'lg';
} & Omit<
  ComponentPropsWithRef<'svg'>,
  'children' | 'size' | 'width' | 'height'
>;

const sizeClasses = { sm: 'size-4', md: 'size-6', lg: 'size-8' } as const;

export function QuoteMark({
  size = 'md',
  className,
  'aria-label': ariaLabel,
  ...rest
}: QuoteMarkProps): ReactElement {
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
      <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />
      <path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />
    </svg>
  );
}
