import type { ComponentPropsWithRef, ReactElement } from 'react';

/**
 * Flag of Germany — three equal horizontal bands, black · red · gold, official
 * 3:5 ratio ("for german the germany flag", owner 2026-09-04,
 * speed-dial-flags lane). Public-domain construction; hex values are the
 * federal web triad (gold is #FFCC00, not yellow).
 *
 * Folder law (flags/): fixed colors REQUIRED, `currentColor` FORBIDDEN;
 * `preserveAspectRatio="xMidYMid slice"` covers the consumer's box; never
 * width/height attributes — the prop type Omits them.
 */

export type GermanyFlagProps = Omit<
  ComponentPropsWithRef<'svg'>,
  'children' | 'width' | 'height'
>;

export function GermanyFlag({
  className,
  'aria-label': ariaLabel,
  ...rest
}: GermanyFlagProps): ReactElement {
  // Decorative by default (§9) — the glyphs-README rule-4 branch.
  const labelled = typeof ariaLabel === 'string' && ariaLabel.trim() !== '';
  return (
    <svg
      viewBox="0 0 5 3"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      {...(labelled
        ? { role: 'img', 'aria-label': ariaLabel }
        : { 'aria-hidden': true })}
      {...rest}
    >
      <rect y="0" width="5" height="1" fill="#000000" />
      <rect y="1" width="5" height="1" fill="#DD0000" />
      <rect y="2" width="5" height="1" fill="#FFCC00" />
    </svg>
  );
}
