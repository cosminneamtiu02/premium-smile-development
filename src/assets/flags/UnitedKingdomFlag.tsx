import type { ComponentPropsWithRef, ReactElement } from 'react';

/**
 * Flag of the United Kingdom (Union Jack) — the owner's explicit pick for the
 * `en` locale ("go with union jack", 2026-09-04, speed-dial-flags lane;
 * "the english flag so not usa"). Official 1:2 ratio on the standard 60×30
 * construction grid, public domain: blue field, white St Andrew saltire, red
 * St Patrick saltire COUNTERCHANGED (offset within the white — the detail that
 * separates a real Union Jack from a naive X), white-fimbriated St George
 * cross on top.
 *
 * The counterchange uses the canonical clipped-stroke construction: the red
 * diagonal is clipped by four quarter-triangles so each red band hugs the
 * correct side of its white band. The clip id is a FIXED string, accepted
 * duplicate: every instance carries byte-identical clip geometry, so
 * first-id-wins resolution renders every copy correctly (axe-core no longer
 * flags non-ARIA duplicate ids; revisit with useId if that ever changes —
 * React 19's «r» id alphabet inside `url(#…)` is the reason it is not used
 * today).
 *
 * Folder law (flags/): fixed colors REQUIRED, `currentColor` FORBIDDEN;
 * `preserveAspectRatio="xMidYMid slice"` covers the consumer's box (the svg
 * root itself clips the stroke overshoot at the viewBox edges); never
 * width/height attributes — the prop type Omits them.
 */

export type UnitedKingdomFlagProps = Omit<
  ComponentPropsWithRef<'svg'>,
  'children' | 'width' | 'height'
>;

export function UnitedKingdomFlag({
  className,
  'aria-label': ariaLabel,
  ...rest
}: UnitedKingdomFlagProps): ReactElement {
  // Decorative by default (§9) — the glyphs-README rule-4 branch.
  const labelled = typeof ariaLabel === 'string' && ariaLabel.trim() !== '';
  return (
    <svg
      viewBox="0 0 60 30"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      {...(labelled
        ? { role: 'img', 'aria-label': ariaLabel }
        : { 'aria-hidden': true })}
      {...rest}
    >
      <clipPath id="uk-flag-counterchange">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
      <path
        d="M0,0 L60,30 M60,0 L0,30"
        clipPath="url(#uk-flag-counterchange)"
        stroke="#C8102E"
        strokeWidth="4"
      />
      <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}
