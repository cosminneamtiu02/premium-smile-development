import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { BUTTON_ONLY_PROPS, slotClone } from '../slot';

// ui/RoundButton — the round, icon-only control (migrated per the approved
// 2026-08-05 canvas plan .claude/plans/icon-button.plan.md, round 5; merges
// the old `ui/icon-button` and the round face of `floating-book-cta` into one
// atom). The floating placement itself is NOT here: it is `fixed …` classes
// passed by the locale shell later (plan §8 fb-47).
// §6 contract: the icon is a slot (children), variant/size are typed props,
// semantic tokens only, no outer margins, parent className merged (§6.8).

export type RoundButtonVariant = 'solid' | 'outline';
export type RoundButtonSize = 'md' | 'lg';

type RoundButtonOwnProps = {
  /**
   * REQUIRED — icon-only control, no visible text (§6.3). Already-translated
   * string. In asChild mode a child element's own (defined) aria-label wins
   * over this one — the child IS the control, most-specific wins.
   */
  'aria-label': string;
  /** Named color-pair bundle. solid = filled call CTA · outline = socials, fills on hover. */
  variant?: RoundButtonVariant;
  /** Round, rem-based, fixed: md = 2.75rem/44px (§9 target) · lg = 3.5rem/56px (primary CTA scale). */
  size?: RoundButtonSize;
  /**
   * Same slot contract as Button: render no <button> of RoundButton's own —
   * the single child element you nest (an <a href="tel:…">, a next-intl
   * <Link>) BECOMES the control and the icon sits inside it. Behaviour props
   * (href, target, onClick…) belong on that child; <button>-only props (type,
   * disabled, form*, name, value) have no effect and a dev-only console.error
   * says so.
   */
  asChild?: boolean;
  /**
   * The icon — always an inline SVG (owner decision fb-41). Normally
   * <Icon name="…" />, which bakes in aria-hidden + currentColor; a raw <svg>
   * stays legal. This atom never imports Icon: the slot takes any svg, which
   * is also why the type is ReactNode — in asChild mode the child is the
   * <a>/<button> wrapper and the svg sits one level deeper.
   * Pass the icon UNLABELED (Icon's default): a labelled Icon inside an
   * asChild anchor double-announces in the a11y tree. Never put visible text
   * here — aria-label overrides content, so what users see and what they can
   * say would diverge (SC 2.5.3 Label in Name).
   */
  children: ReactNode;
};

export type RoundButtonProps = RoundButtonOwnProps &
  Omit<ComponentPropsWithRef<'button'>, keyof RoundButtonOwnProps>;

// Hover contract — the same one Button carries (see Button.tsx for the full
// reasoning and the owner decisions behind it, canvas fb-37/fb-38). Exactly
// ONE animation: the colors fade on one shared clock, --fade ease-in-out, so
// in and out mirror each other. Nothing moves — the old round button's
// hover:scale-105 growth and its shadow-cta → shadow-cta-lg pop are both gone
// (fb-49/fb-50, plan D2/D5); "jumps at you" was two extra animations.
// KEEP IN SYNC with Button's --fade (fb-44): 400ms here and 400ms there is
// deliberate — the two files are independent on purpose (plan D7), so
// changing the system's feel is a two-file edit, never a drift. Button.tsx
// carries the matching pointer back to this one.
// The icon needs no hover logic of its own: <Icon> (and any well-formed svg)
// paints with currentColor, so `color` — which IS in the transition list —
// carries the glyph through the fade for free.
// solid lerps the ground only, between pairs that both pass AA (white over
// #008854 → #006b42 = 4.52:1 → 6.60:1). outline crossfades both, so its glyph
// and ground pass through each other mid-fade — the same knowingly-accepted
// window as Button's outline (fb-38); border-cta never transitions, holding
// 4.29:1 so the control stays identifiable throughout.
// active:duration-0 snaps press feedback; motion-reduce:transition-none gives
// clean snaps (§9). --fade is INTERNAL: className is merged last, so a caller
// could stretch it with nondeterministic precedence. Change it here instead.
// The list is exactly background-color,color and NOT `transition-colors` —
// that shorthand covers outline-color and would drag the focus ring onto the
// same clock.
const base =
  'inline-flex shrink-0 items-center justify-center ' +
  'rounded-full outline-offset-2 ' +
  'focus-visible:outline-2 focus-visible:outline-focus ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  '[--fade:400ms] transition-[background-color,color] ' +
  'duration-(--fade) ease-in-out active:duration-0 ' +
  'motion-reduce:transition-none';

// Named bundles, not four free color props: every rest AND hover pair is
// measured once, so §9 holds by construction and no call site can invent an
// illegal combination (plan §4a). A new look = a new variant, verified once.
const variantClasses: Record<RoundButtonVariant, string> = {
  solid: 'bg-cta text-ink-inverse hover:bg-cta-hover active:bg-cta-hover',
  outline:
    'border border-cta bg-surface text-cta ' +
    'hover:bg-cta hover:text-ink-inverse ' +
    'active:bg-cta-hover active:text-ink-inverse',
};

// Fixed square boxes (no `sm:` self-scaling inside an atom — §6.5), rem-based
// so browser zoom scales the whole control (§7): md 2.75rem/44px is the §9
// primary touch target, lg 3.5rem/56px matches Button's lg scale.
// [&_svg]:size-* is how the CIRCLE owns its icon's geometry: that descendant
// selector scores specificity (0,1,1) against Icon's own preset class (0,1,0),
// so it wins in every browser and call sites may pass <Icon name="…"/> with or
// without a size prop. Icon emits no width/height attributes, so nothing else
// is in the fight (proven in situ by the IconSizePrecedence story).
const sizeClasses: Record<RoundButtonSize, string> = {
  md: 'size-11 [&_svg]:size-5',
  lg: 'size-14 [&_svg]:size-7',
};

const cx = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(' ');

export function RoundButton({
  variant = 'solid',
  size = 'md',
  asChild = false,
  className,
  children,
  type = 'button',
  ...rest
}: RoundButtonProps): ReactElement {
  const ownClasses = cx(
    base,
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (asChild) {
    // The child element becomes the control — engine shared with Button in
    // ui/slot.ts (owner decision fb-64): single-child guard first, child-wins
    // merge, className merged last, dev-only warning for <button>-only props.
    // The required aria-label rides along in `rest`, so the anchor is named
    // unless the child names itself WITH a defined value — an
    // `aria-label={undefined}` child counts as unnamed and the owner's label
    // still lands (slot.ts merge rule).
    return slotClone(
      'RoundButton',
      children,
      ownClasses,
      rest,
      BUTTON_ONLY_PROPS,
    );
  }

  return (
    <button type={type} className={ownClasses} {...rest}>
      {children}
    </button>
  );
}
