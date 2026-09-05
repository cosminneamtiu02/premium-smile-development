import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { BUTTON_ONLY_PROPS, slotClone } from '../slot';

// ui/Button — the one button of the design system (migrated per the approved
// 2026-08-02 canvas plan; replaces the Phase 0 probe wholesale).
// §6 contract: content is a slot (children), variants/sizes are typed props,
// semantic tokens only, no outer margins, parent className merged (§6.8).

export type ButtonVariant = 'solid' | 'outline' | 'ghost';
export type ButtonSize = 'md' | 'lg' | 'xl';

type ButtonOwnProps = {
  /** Visual tone. solid = filled CTA, drains on hover · outline = bordered, fills on hover · ghost = quiet. */
  variant?: ButtonVariant;
  /** Box scale, rem-based: md ≥44px min-height (§9 primary target), lg ≥56px, xl ≥64px (hero). */
  size?: ButtonSize;
  /**
   * Render no <button> of Button's own — the single child element you nest
   * (an <a href> built by localeHref(), an <a href="tel:…">) BECOMES the
   * button: it receives Button's classes on top of its own. The child must
   * itself be one real interactive element (never a Fragment), and behaviour
   * props (href, target, onClick…) belong on that child. <button>-only props
   * (type, disabled, form*, name, value) have no effect in asChild mode — a
   * dev-only console.error says so.
   */
  asChild?: boolean;
  children: ReactNode;
};

export type ButtonProps = ButtonOwnProps &
  Omit<ComponentPropsWithRef<'button'>, keyof ButtonOwnProps>;

// Hover contract (owner decision 2026-08-04, canvas fb-37/fb-38, plan
// .claude/plans/button-hover-fade.plan.md; solid AMENDED 2026-09-06 — the
// socials'-hover rework, owner: the corner discs and every Contact-type
// button adopt the Footer socials' fill/invert; nav TextButtons, the burger
// and SpeedDial explicitly keep their own contracts). Exactly ONE animation:
// the colors fade on one shared clock, --fade (400ms) ease-in-out, so in and
// out mirror each other. Nothing moves — the v1 center-out sweep read as a
// second animation and is gone, taking its jitter and stranded-band bugs
// with it.
// solid and outline are HOVER-MIRRORS: each variant's hover face is the
// other's rest face, and both press to the same deep-green active face.
// outline FILLS on hover (rest → bg-cta + ink-inverse, unchanged since
// fb-38); solid DRAINS on hover (rest → bg-surface + cta label + a 1px cta
// hairline, keeping the control's ≥3:1 boundary on white grounds,
// SC 1.4.11). The hairline is an INSET-RING — box-shadow, never a border —
// because a border arriving on hover would grow this auto-width box by 2px:
// movement, i.e. the second animation fb-49/fb-50 banned. inset-ring paints
// inside the box exactly where outline's border sits and joins the same fade
// as a transparent→cta color lerp; it is the ONLY reason box-shadow is in
// the transition list, and shadow-* utilities stay banned wholesale
// (Button.test's fb-50 twin ban).
// Contrast record: solid's hover face reuses outline's measured rest pairs —
// cta text on surface 4.52:1 (SC 1.4.3), the cta hairline 4.52:1 on surface
// as the non-text boundary; its press face is outline's press face (white
// over #006b42 = 6.60:1). ghost still lerps the ground only (ink over
// #e9e6e2 = 11.9:1) and rests bg-transparent, so its REST contrast belongs
// to the parent: light grounds only (on #24211e the label sits at 1.08:1).
// The crossfade window: solid and outline pass label and ground through each
// other mid-fade — measured below 4.5:1 for ≈92% of the fade (both
// directions), 1:1 at the midpoint. KNOWINGLY ACCEPTED for outline since
// fb-38 and extended to solid by the same reasoning with the 2026-09-06
// decision — SC 1.4.3 has no transient exemption, but the window is
// user-initiated and unfreezable (any interruption retargets to a discrete
// AA state), and a cta-colored edge holds the control's boundary throughout
// — outline's as its never-transitioning border, solid's as a COMPOSITE: the
// draining ground carries the edge early in the fade, the arriving hairline
// late (transparent→cta interpolates premultiplied, so the ring is cta-hued
// at every alpha), and their sum never drops below 75% cta strength — the
// minimum, at the midpoint, measures ≈3.0:1 on surface and ≈2.9:1 over
// --page for roughly 100ms (G2 a11y verification, 2026-09-06). Neither line
// alone holds the edge; the pair does. This AMENDS v1's "text color never
// animates" rule; do not restore that rule without the owner.
// active:duration-0 snaps press feedback. For solid the press is now visible
// from EVERY state — its active face differs from rest and hover alike (the
// drain re-fills deep green); ghost still shares one value for hover and
// active, so its snap shows only from a non-hover state (touch, keyboard) or
// mid-fade. motion-reduce:transition-none gives clean snaps (§9).
// --fade is INTERNAL: className is merged last, so a caller could stretch it
// with nondeterministic precedence. Change it here instead.
// The list is exactly background-color,color,box-shadow and NOT
// `transition-colors` — that shorthand covers outline-color and would drag
// the focus ring onto the same clock. box-shadow serves the solid hairline
// alone: outline and ghost set no shadow layers, so nothing of theirs can
// join the clock through it.
// KEEP IN SYNC with GlyphButton's --fade AND its byte-identical solid
// bundle: the two atoms deliberately carry the same clock and the same
// mirror law (fb-44) so the whole system fades at one speed.
// `hyphens-none` — INTERACTIVE LABELS NEVER SYLLABLE-SPLIT (owner, 2026-09-04:
// "text on menu buttons and on buttons in general is never allowed to be
// split"). §15.14 ships `hyphens: auto` at the body tier so long German
// compounds may break mid-word in PROSE; a control's label is not prose — it is
// the name of the thing you are about to press, and a hyphen through it reads
// as damage rather than as typesetting. This opts the atom's whole subtree back
// out. Wrapping BETWEEN words is untouched and still expected: §8.4's
// min-heights (never fixed heights) exist precisely so a two-line DE/FR label
// fits. KEEP-IN-SYNC with ui/TextButton, which carries the same class for the
// same rule; GlyphButton and SpeedDial are deliberately exempt — they render
// glyphs and 2–3 letter codes, which cannot hyphenate.
const base =
  'inline-flex items-center justify-center gap-2 ' +
  'rounded-md font-medium hyphens-none outline-offset-2 ' +
  'focus-visible:outline-2 focus-visible:outline-focus ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  '[--fade:400ms] transition-[background-color,color,box-shadow] ' +
  'duration-(--fade) ease-in-out active:duration-0 ' +
  'motion-reduce:transition-none';

const variantClasses: Record<ButtonVariant, string> = {
  // Rest→hover DRAINS to outline's rest face; the press re-fills deep green
  // (the 2026-09-06 mirror law — full reasoning in the contract above).
  solid:
    'bg-cta text-ink-inverse inset-ring inset-ring-transparent ' +
    'hover:bg-surface hover:text-cta hover:inset-ring-cta ' +
    'active:bg-cta-hover active:text-ink-inverse',
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
