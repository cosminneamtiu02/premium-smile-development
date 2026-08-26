import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { BUTTON_ONLY_PROPS, slotClone } from '../slot';

// ui/TextButton — the general-purpose QUIET action: chrome-less, text-first,
// no ground and no border (migrated per the approved dossier
// .claude/section-runs/2026-08-05_22-04_top-bar/atoms/TextButton.md, contract
// fb-125). It absorbs the *pattern* of the old `ui/link` nav variant and the
// old top bar's inline nav anchors; neither shipped as a component here.
// Today's caller is the Header nav (desktop row + panel list) via asChild
// with a plain <a href> child (§15.13); the atom stays a plain quiet button
// for any later use (fb-111). It is NOT part of an emphasis family (fb-126
// guardrail): Button keeps its name, and a future bordered look would be a
// new variant on THIS atom, never a rename anywhere.
// The atom NEVER owns navigation. The absorbed old anchors hijacked clicks
// (preventDefault + a JS router) and hardcoded target/rel on every link —
// both are required rewrites: real hrefs live on the child element, and
// target is set by the consumer only where a link is genuinely external.
// §6 contract: label is a slot (children), semantic tokens only, no outer
// margins, parent className merged (§6.8).

type TextButtonOwnProps = {
  /**
   * The current page/selection. Adds `aria-current="page"`, colors the label
   * the underline's own green and shows the underline STATICALLY at full
   * width — state is announced, colored and drawn, never conveyed by the
   * animation (§9). Label + underline share ONE green, exactly like the old
   * top bar's single `accent` (owner, canvas loop 2026-08-06).
   */
  active?: boolean;
  /**
   * Render no <button> of TextButton's own — the single child element you
   * nest (an <a href> built by localeHref(), an <a href="#top">) BECOMES the
   * control and wears these classes on top of its own. Behaviour props
   * (href, target, onClick…) belong on that child; <button>-only props have
   * no effect — disabled, form*, name and value draw a dev-only
   * console.error, while `type` is absorbed by its default before the merge
   * and dropped silently (slot.ts documents the invariant).
   */
  asChild?: boolean;
  /** The label — already-translated text (§8.1); markup is allowed. */
  children: ReactNode;
};

export type TextButtonProps = TextButtonOwnProps &
  Omit<ComponentPropsWithRef<'button'>, keyof TextButtonOwnProps>;

// Motion contract — the D5 EXCEPTION, owner-approved for this atom alone.
// Button and RoundButton share one calm 400ms ease-in-out --fade clock and
// deliberately move NOTHING (fb-44/49/50). TextButton is the one atom that
// clocks differently and the one atom where something moves, because a quiet
// text control has no ground or border to fade: the underline IS its
// affordance. Do NOT "harmonise" this to --fade — TextButton.test.tsx fails
// on the system clock's tokens on purpose.
//   · label color  ink → cta-hover, 200ms ease-out
//   · underline    scale-x 0 → 1 from origin-left, 300ms ease-out
// Two properties, two durations, both ease-out, both switched off under
// motion-reduce (§9) — with the transitions gone every state is still fully
// legible, because each one is a discrete value (a color, a full-width rule).
//
// COLOR INVARIANT — this atom paints with exactly ONE green: cta-hover, for
// the hover label, the active label AND the 2px underline. The old top bar
// used a single `accent` token for all three (top-bar.tsx:128-130) and the
// owner confirmed that unity on the 2026-08-06 canvas loop; the hover and
// active label states are ones a user can hold (or that simply ARE the rest
// state), so they owe SC 1.4.3 the full 4.5:1 — and cta #008854 measures
// 4.29:1 on --page #faf9f7 (FAIL), 4.52:1 on --surface. cta-hover #006b42 =
// 6.27:1 and 6.60:1, passing everywhere; as the underline (non-text,
// SC 1.4.11's 3:1) it clears with even more room than cta did. This is the
// one deviation from fb-125's letter ("ink → cta", "bg-cta underline") and
// it preserves fb-125's actual intent: label and rule in one shared green.
//
// The underline is a PSEUDO-ELEMENT, not a nested <span>, because asChild
// leaves no element of TextButton's own in the DOM — the whole look has to
// travel as classes on the caller's child element.
// The transition list is exactly `color`, never `transition-colors`: that
// shorthand also covers outline-color and would drag the focus ring onto the
// clock.
//
// BOX — text-first, so there is no width anywhere (§8.4: DE runs +30–35%
// longer and must wrap, never clip) and no outer margin (§6.4: the parent's
// gap owns the nav row's spacing). min-h-11 (2.75rem/44px, rem-based so zoom
// scales it — §7) clears the §9 target floor even if a parent shrinks the
// font; py-2 keeps that height honest when a label wraps to two lines, and it
// is also the underline's breathing room, since after:bottom-0 pins the rule
// to the bottom of the padded box. px-2 lets the full-bleed rule overhang the
// label by 8px a side — enough to read as deliberate, little enough that it
// still tracks the word.
const base =
  'relative inline-flex min-h-11 items-center justify-center ' +
  'px-2 py-2 text-lg font-medium ' +
  'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'transition-[color] duration-200 ease-out hover:text-cta-hover ' +
  'motion-reduce:transition-none ' +
  'after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 ' +
  "after:h-0.5 after:origin-left after:bg-cta-hover after:content-[''] " +
  'after:transition-transform after:duration-300 after:ease-out ' +
  'hover:after:scale-x-100 motion-reduce:after:transition-none';

// Kept out of `base` as an either/or so two same-property utilities never sit
// in one class list fighting over cascade order — for the underline's scale
// AND for the label color: hover:text-cta-hover / hover:after:scale-x-100
// outrank both rest values on specificity (a :hover pseudo-class), which is a
// rule of CSS — the ordering of two same-specificity utilities in the
// generated sheet is not.
const stateClasses = {
  resting: 'text-ink after:scale-x-0',
  active: 'text-cta-hover after:scale-x-100',
} as const;

const cx = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join(' ');

export function TextButton({
  active = false,
  asChild = false,
  className,
  children,
  type = 'button',
  'aria-current': ariaCurrent,
  ...rest
}: TextButtonProps): ReactElement {
  const ownClasses = cx(
    base,
    stateClasses[active ? 'active' : 'resting'],
    className,
  );

  // `active` is sugar for the ARIA state, so an explicitly passed
  // aria-current still wins (§6.8 native-element fidelity): a caller marking a
  // step/location keeps their word, and nothing but this attribute leaks —
  // `active` and `asChild` themselves never reach the DOM.
  const rootProps = {
    ...rest,
    'aria-current': ariaCurrent ?? (active ? 'page' : undefined),
  };

  if (asChild) {
    // The child element becomes the control. The engine lives in ui/slot.ts
    // (owner decision fb-64) — single-child guard first, child-wins merge,
    // className merged last, dev-only warning for <button>-only props. The
    // computed aria-current rides along in the merge, so an <a href> child
    // gets marked unless it declares its own defined value.
    return slotClone(
      'TextButton',
      children,
      ownClasses,
      rootProps,
      BUTTON_ONLY_PROPS,
    );
  }

  return (
    <button type={type} className={ownClasses} {...rootProps}>
      {children}
    </button>
  );
}
