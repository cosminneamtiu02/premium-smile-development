import type { ComponentPropsWithRef, ReactElement } from 'react';

/**
 * Flag of France — three equal vertical bands, blue · white · red, official
 * 2:3 ratio. Public-domain construction. The blue is the CLASSIC #0055A4
 * triad, deliberately NOT the darker navy re-adopted by the Élysée in 2020:
 * at 32–56px disc sizes the lighter blue is the recognizable one (recorded in
 * the speed-dial-flags board; the owner may flip the value later by hand).
 *
 * Folder law (flags/): fixed colors REQUIRED, `currentColor` FORBIDDEN;
 * `preserveAspectRatio="xMidYMid slice"` covers the consumer's box; never
 * width/height attributes — the prop type Omits them.
 */

export type FranceFlagProps = Omit<
  ComponentPropsWithRef<'svg'>,
  'children' | 'width' | 'height'
>;

export function FranceFlag({
  className,
  'aria-label': ariaLabel,
  ...rest
}: FranceFlagProps): ReactElement {
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
      <rect x="0" width="1" height="2" fill="#0055A4" />
      <rect x="1" width="1" height="2" fill="#FFFFFF" />
      <rect x="2" width="1" height="2" fill="#EF4135" />
    </svg>
  );
}
