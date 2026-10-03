import type { ComponentPropsWithRef, ReactElement } from 'react';

/**
 * Flag of Romania — three equal vertical bands, blue · yellow · red, official
 * 2:3 ratio. Drawn from the public-domain construction (hex values are the
 * commonly published web triad), 2026-09-04, for the speed-dial-flags lane
 * (.claude/plans/speed-dial-flags.plan.md).
 *
 * Folder law (flags/, the glyphs-law inversion): fixed colors REQUIRED —
 * `currentColor` is FORBIDDEN here, because a flag is not tintable artwork;
 * `preserveAspectRatio="xMidYMid slice"` makes the drawing COVER whatever box
 * the consumer gives it (a round disc crops it with overflow-hidden); NEVER
 * width/height attributes — the consumer owns geometry entirely, which is why
 * the prop type Omits them.
 */

export type RomaniaFlagProps = Omit<
  ComponentPropsWithRef<'svg'>,
  'children' | 'width' | 'height'
>;

export function RomaniaFlag({
  className,
  'aria-label': ariaLabel,
  ...rest
}: RomaniaFlagProps): ReactElement {
  // Decorative by default (§9): a non-empty label flips the flag to a named
  // image; empty/whitespace stays hidden — a nameless role="img" is an axe
  // fail. Same branch as every glyph (assets/glyphs/README.md, rule 4).
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
      <rect x="0" width="1" height="2" fill="#002B7F" />
      <rect x="1" width="1" height="2" fill="#FCD116" />
      <rect x="2" width="1" height="2" fill="#CE1126" />
    </svg>
  );
}
