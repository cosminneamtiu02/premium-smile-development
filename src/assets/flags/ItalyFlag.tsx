import type { ComponentPropsWithRef, ReactElement } from 'react';

/**
 * Flag of Italy — three equal vertical bands, green · white · red, official
 * 2:3 ratio. Public-domain construction; hex values are the commonly
 * published web triad.
 *
 * Folder law (flags/): fixed colors REQUIRED, `currentColor` FORBIDDEN;
 * `preserveAspectRatio="xMidYMid slice"` covers the consumer's box; never
 * width/height attributes — the prop type Omits them.
 */

export type ItalyFlagProps = Omit<
  ComponentPropsWithRef<'svg'>,
  'children' | 'width' | 'height'
>;

export function ItalyFlag({
  className,
  'aria-label': ariaLabel,
  ...rest
}: ItalyFlagProps): ReactElement {
  // Decorative by default (§9) — the glyphs-README rule-4 branch.
  const labelled = typeof ariaLabel === 'string' && ariaLabel.trim() !== '';
  return (
    <svg
      viewBox="0 0 3 2"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      {...(labelled
        ? { role: 'img', 'aria-label': ariaLabel }
        : { 'aria-hidden': true })}
      {...rest}
    >
      <rect x="0" width="1" height="2" fill="#009246" />
      <rect x="1" width="1" height="2" fill="#FFFFFF" />
      <rect x="2" width="1" height="2" fill="#CE2B37" />
    </svg>
  );
}
