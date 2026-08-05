import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { BUTTON_ONLY_PROPS, slotClone } from '../slot';

// ui/Button — the one button of the design system (migrated per the approved
// 2026-08-02 canvas plan; replaces the Phase 0 probe wholesale).
// §6 contract: content is a slot (children), variants/sizes are typed props,
// semantic tokens only, no outer margins, parent className merged (§6.8).

export type ButtonVariant = 'solid' | 'outline' | 'ghost';
export type ButtonSize = 'md' | 'lg' | 'xl';

type ButtonOwnProps = {
  /** Visual tone. solid = filled CTA · outline = bordered, fills on hover · ghost = quiet. */
  variant?: ButtonVariant;
  /** Box scale, rem-based: md ≥44px min-height (§9 primary target), lg ≥56px, xl ≥64px (hero). */
  size?: ButtonSize;
  /**
   * Render no <button> of Button's own — the single child element you nest
   * (an <a>, a next-intl <Link>) BECOMES the button: it receives Button's
   * classes on top of its own. The child must itself be one real interactive
   * element (never a Fragment), and behaviour props (href, target, onClick…)
   * belong on that child. <button>-only props (type, disabled, form*, name,
   * value) have no effect in asChild mode — a dev-only console.error says so.
   */
  asChild?: boolean;
  children: ReactNode;
};

export type ButtonProps = ButtonOwnProps &
  Omit<ComponentPropsWithRef<'button'>, keyof ButtonOwnProps>;

// Hover contract (owner decision 2026-08-04, canvas fb-37/fb-38, plan
// .claude/plans/button-hover-fade.plan.md). Exactly ONE animation: the colors
// fade on one shared clock, --fade (400ms) ease-in-out, so in and out mirror
// each other. Nothing moves — the v1 center-out sweep read as a second
// animation and is gone, taking its jitter and stranded-band bugs with it.
// solid/ghost lerp the ground only, between pairs that both pass AA (white
// over #008854 → #006b42 = 4.52:1 → 6.60:1; ink over #e9e6e2 = 11.9:1) — every
// frame safe. Ghost is bg-transparent, so its REST contrast belongs to the
// parent: light grounds only (on #24211e the label sits at 1.08:1).
// outline crossfades both, so its label and ground pass through each other:
// measured below 4.5:1 for ≈92% of the fade (both directions), 1:1 at the
// midpoint. KNOWINGLY ACCEPTED — SC 1.4.3 has no transient exemption, but the
// window is user-initiated and unfreezable (any interruption retargets to a
// discrete AA state) and border-cta never transitions, holding 4.29:1 so the
// control stays identifiable. This AMENDS v1's "text color never animates"
// rule; do not restore that rule without the owner.
// active:duration-0 snaps press feedback — visible only from a non-hover
// state (touch, keyboard) or mid-fade, since solid/ghost share one value for
// hover and active. motion-reduce:transition-none gives clean snaps (§9).
// --fade is INTERNAL: className is merged last, so a caller could stretch it
// with nondeterministic precedence. Change it here instead.
// The list is exactly background-color,color and NOT `transition-colors` —
// that shorthand covers outline-color and would drag the focus ring onto the
// same clock.
// KEEP IN SYNC with RoundButton's --fade: the two atoms deliberately carry
// byte-identical clocks (fb-44) so the whole system fades at one speed.
const base =
  'inline-flex items-center justify-center gap-2 ' +
  'rounded-md font-medium outline-offset-2 ' +
  'focus-visible:outline-2 focus-visible:outline-focus ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  '[--fade:400ms] transition-[background-color,color] ' +
  'duration-(--fade) ease-in-out active:duration-0 ' +
  'motion-reduce:transition-none';

const variantClasses: Record<ButtonVariant, string> = {
  solid: 'bg-cta text-ink-inverse hover:bg-cta-hover active:bg-cta-hover',
  // Rest→hover swaps BOTH colors as one crossfade on the shared --fade clock
  // (owner decision 2026-08-04, plan button-hover-fade.plan.md §4).
  outline:
    'border border-cta bg-surface text-cta ' +
    'hover:bg-cta hover:text-ink-inverse ' +
    'active:bg-cta-hover active:text-ink-inverse',
  ghost: 'bg-transparent text-ink hover:bg-line-subtle active:bg-line-subtle',
};

// min-heights (not fixed heights) so long DE/FR labels may wrap (§8.4);
// Tailwind spacing is rem-based, so browser zoom scales everything (§7).
const sizeClasses: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 text-lg',
  lg: 'min-h-14 px-7 text-lg',
  xl: 'min-h-16 px-10 text-xl',
};

const cx = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(' ');

export function Button({
  variant = 'solid',
  size = 'md',
  asChild = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps): ReactElement {
  const ownClasses = cx(
    base,
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (asChild) {
    // The child element becomes the button. The engine lives in ui/slot.ts
    // (owner decision fb-64) — single-child guard first, child-wins merge,
    // className merged last, dev-only warning for <button>-only props. Same
    // semantics as before the extraction, byte for byte; editing slot.ts
    // edits this atom too (see that file's standing rule).
    return slotClone('Button', children, ownClasses, rest, BUTTON_ONLY_PROPS);
  }

  return (
    <button type={type} className={ownClasses} {...rest}>
      {children}
    </button>
  );
}
