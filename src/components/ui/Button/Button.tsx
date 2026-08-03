import { cloneElement, isValidElement } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';

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

// Hover invariant (a11y audit, 2026-08-03): text color NEVER animates. Both
// end states pass AA with zero headroom, so a time-based color lerp under a
// space-based sweep leaves a wide label's outer glyphs sub-AA for most of the
// transition. The center-out sweep therefore only ever moves between grounds
// that BOTH pass 4.5:1 with the text painted at that moment: solid/outline
// sweep --cta-hover under constant white (4.51:1 → 6.60:1), ghost sweeps
// --line-subtle under constant ink (11.9:1). Outline's fill+label flip is an
// instant swap for the same reason. Paint moves, the box never does — the old
// site's scale/translate hover bugs stay impossible by construction.
// `isolate` + before:-z-10 keeps the sweep above the button's own background
// but under the content, with no wrapper element around the slot.
const base =
  'relative isolate inline-flex items-center justify-center gap-2 overflow-hidden ' +
  'rounded-md font-medium outline-offset-2 ' +
  'focus-visible:outline-2 focus-visible:outline-focus ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'before:absolute before:inset-0 before:-z-10 before:origin-center before:scale-x-0 ' +
  'before:transition-transform before:duration-[240ms] before:ease-out ' +
  "before:content-[''] hover:before:scale-x-100 " +
  'motion-reduce:before:transition-none';

const variantClasses: Record<ButtonVariant, string> = {
  solid: 'bg-cta text-ink-inverse before:bg-cta-hover active:bg-cta-hover',
  // Rest→hover (green-on-white → white-on-green) swaps instantly — see the
  // frame-safety invariant above — then the same --cta-hover sweep as solid
  // plays over the filled ground: one hover grammar across variants.
  outline:
    'border border-cta bg-surface text-cta before:bg-cta-hover ' +
    'hover:bg-cta hover:text-ink-inverse ' +
    'active:bg-cta-hover active:text-ink-inverse',
  ghost: 'bg-transparent text-ink before:bg-line-subtle active:bg-line-subtle',
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

// <button>-only props that must never land on a slotted child: anchors have
// no disabled state and no form association. ('type' can never actually reach
// the merge loop — it is destructured away with a default — but is listed so
// the invariant reads complete in one place.)
const BUTTON_ONLY_PROPS = new Set([
  'type',
  'disabled',
  'form',
  'formAction',
  'formEncType',
  'formMethod',
  'formNoValidate',
  'formTarget',
  'name',
  'value',
]);

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
    // This guard must run FIRST so misuse (text, arrays, nothing) surfaces
    // this actionable message — React's own Children.only would preempt it
    // with a generic one, which is why it is not used here.
    if (
      !isValidElement<{ className?: string; [key: string]: unknown }>(children)
    ) {
      throw new Error(
        'Button with asChild expects exactly one element child (e.g. an <a> or <Link>).',
      );
    }
    // The child element becomes the button: every prop the child declares is
    // kept (child wins conflicts — React 19 exposes `ref` inside props, so
    // this check covers ref too; never add 'ref' to BUTTON_ONLY_PROPS), then
    // Button's remaining props are added and the class strings merged —
    // parent positioning classes stay routed through Button (§6.8).
    const merged: Record<string, unknown> = {};
    const ignored: string[] = [];
    for (const [key, value] of Object.entries(
      rest as Record<string, unknown>,
    )) {
      if (BUTTON_ONLY_PROPS.has(key)) {
        ignored.push(key);
        continue;
      }
      if (!(key in children.props)) merged[key] = value;
    }
    if (ignored.length > 0 && process.env.NODE_ENV !== 'production') {
      console.error(
        `Button: ${ignored.join(', ')} has no effect with asChild — put behaviour props on the child element itself.`,
      );
    }
    merged.className = cx(ownClasses, children.props.className);
    return cloneElement(children, merged);
  }

  return (
    <button type={type} className={ownClasses} {...rest}>
      {children}
    </button>
  );
}
