import type { ComponentPropsWithRef, ReactElement } from 'react';

/**
 * Official Facebook glyph — the round mark with the "f" cut out of it, its
 * stem running off the disc's lower edge — single-path currentColor form.
 * Path data via Simple Icons `icons/facebook.svg` @ simple-icons 16.33.0
 * (CC0), retrieved 2026-10-14 from
 * https://cdn.jsdelivr.net/npm/simple-icons@16.33.0/icons/facebook.svg.
 * Nominative use: it names the network a share link opens; the trademark
 * belongs to its owner. The file's own `role="img"` and `<title>` are dropped —
 * the decorative/labelled branch below owns the semantics, as in every glyph.
 *
 * Whole-svg glyph component (pattern refactor, board 2026-08-16): the complete
 * `<svg>` lives in this file; call sites import it and hand it color/size from
 * code. Frame rules every glyph file must carry itself: see ./README.md.
 *
 * First consumer: sections/ShareLinks, the blog article's share row
 * (blog-article run, 2026-10-14) — the PR #68 Whatsapp precedent: a glyph
 * rides the lane that needs it, never a lane of its own. The owner, verbatim:
 * "the 4 share buttons above the image in the top right as in example, those
 * would be the rop button buttons with adjacent svgs in the button which on
 * hover tutn lilla and at base are black" — the reason the share glyphs paint
 * with currentColor and nothing else: the button's own label colour reaches
 * the drawing, ink at rest and lavender on hover, with no glyph code. Filled
 * family, one closed path, like Whatsapp.
 */

export type FacebookProps = {
  /** Box scale, rem-based (§7): sm 1rem · md 1.5rem (default) · lg 2rem. */
  size?: 'sm' | 'md' | 'lg';
} & Omit<
  ComponentPropsWithRef<'svg'>,
  'children' | 'size' | 'width' | 'height'
>;

const sizeClasses = { sm: 'size-4', md: 'size-6', lg: 'size-8' } as const;

export function Facebook({
  size = 'md',
  className,
  'aria-label': ariaLabel,
  ...rest
}: FacebookProps): ReactElement {
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
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  );
}
