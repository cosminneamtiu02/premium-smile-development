import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { cx } from '@/lib/cx/cx';
import { BUTTON_ONLY_PROPS, slotClone } from '../slot';

// ui/PillButton — the SELECTABLE CHIP: a fully round-ended button with a thin
// lavender edge and the header pill's glow, one of a row of them, the current
// one filled. Built for the price page's phone and tablet menu (owner
// 2026-10-09, verbatim: "new button tipe with rounded left and right edge.
// current lillla other with aura shadwo and thin border like the dr cards and
// text inside"), where a horizontal strip of these replaces the stacked list
// of categories (sections/PriceList/PriceMenu). Its file shape, its API and
// its doctrines are ui/TextButton's, which it sits beside: a quiet action
// TextButton keeps — chrome-less text — and this is the one with a ground.
//
// ── WHY AN ATOM AND NOT THE PRICE MENU'S CLASS STRING. The look is a
// primitive (§4's promotion rule: primitives are built in ui/ first, never
// inline in a section): it composes no other atom, holds no word, knows no
// price — a band that wants a row of choices (a blog's tags one day) takes it
// as it is. The menu is its first consumer; tests/unit/accent-census.test.ts
// names it and its ground.
//
// ── THE API IS TextButton's, LETTER FOR LETTER, so a reader of one knows the
// other: `<button type="button">` by default; `asChild` through ui/slot.ts
// (the single child element — an `<a href="#…">` on the price page — BECOMES
// the control and wears these classes); `active` = the current look AND the
// `aria-current="page"` sugar, an explicitly passed `aria-current` winning
// (the price menu passes `location`, PriceMenu.tsx argues the pair); native
// props spread onto the root, `ref` a regular prop (React 19), `className`
// merged LAST (§6.8 — placement only: a margin, a scroll margin, never a
// restyle of the face). No outer margin (§6.4: the row's `gap` owns the
// spacing) and no string of its own (§8.1: the label arrives finished).
//
// ── THE SHAPE (the owner: "rounded left and right edge … fully round"):
// `rounded-full`, a radius larger than any box, so the two ends are half
// circles at every height; `min-h-11` — 2.75rem = 44px, §9's aim for a
// primary target, in rem so zoom carries it — with the label centred in it;
// `px-5` of air either side; `whitespace-nowrap` because a chip in a strip
// that scrolls sideways must never wrap into a two-line lozenge (the strip
// scrolls instead); `hyphens-none` for §15.14's rider — an interactive label
// never syllable-splits (KEEP-IN-SYNC with ui/Button and ui/TextButton).
// `text-lg font-medium` is TextButton's label, so the chip reads at the size
// the rail's links read on a laptop.
//
// ── THE PAINT, two states and one hover, each a measured pair (WCAG 2.2):
//   · RESTING — the label in `ink` on the white `surface` (14.8:1), inside a
//     2px edge of `--card-tint`: the doctor card's frame colour, the
//     accent-decorative at 20% over the surface (globals.css's THE CARD TINT —
//     the role this atom's arrival promoted, CLAUDE.md §15.19 round 3's
//     trigger). The edge is DECORATION, like the card's frame (1.2:1 against
//     the page): what makes the chip a control is its label, and what marks
//     the current one is its fill — never the edge alone.
//   · ACTIVE — white `ink-inverse` on an `accent` face with an `accent` edge:
//     5.06:1, ui/Button's lavender family at rest (the owner: "the currently
//     selected one with current selected mecanism should be lilla"); the fill
//     against the page ground 4.81:1, past SC 1.4.11's 3:1 for the state.
//   · HOVER, RESTING ONLY — the label and the edge take `accent` (5.06:1 on
//     the white face) and nothing else moves; the current chip has no hover
//     look, because it is already what a hover would promise. Tailwind's
//     `hover:` answers only `(hover: hover)` devices, so a tap never leaves a
//     chip half-lit on a phone.
// tests/unit/accent-census.test.ts counts the four `accent` spellings below
// and measures each pair from the tokens' own lines.
//
// ── THE GLOW IS ALWAYS ON (the owner: "they should have aura"): the header
// pill's `shadow-aura`, worn by both states — a chip is a small floating
// surface, the pill's own idiom (tests/unit/aura-token.test.ts counts the
// wear). It reaches 14px above the box, 30px below it and 22px sideways, so
// a scroller that clips its overflow must leave that much padding round a
// row of chips — or know what it clips: the price strip leaves 32px below
// and, since 2026-10-10, 12px above, which clips only the glow's faintest
// tail, about 2 levels in 255 (sections/PriceList/PriceMenu's THE STRIP
// FLOATS UNDER THE BAR has the arithmetic).
//
// ── THE MOTION IS THE SYSTEM'S --fade CLOCK, one calm crossfade: the ground,
// the edge and the label fade together over 400ms ease-in-out when a chip
// becomes current or stops being so — `[--fade:400ms]` KEEP-IN-SYNC with
// ui/Button, ui/Card and ui/disc.ts (fb-44; PillButton.test.tsx holds this
// copy equal to Button's). The list is exactly
// `background-color,border-color,color` and never `transition-colors`, which
// would also put the focus ring's `outline-color` on the clock. Nothing
// moves — no scale, no shadow on the clock — and `motion-reduce:` snaps the
// colours (§9). The price strip slides a new current chip to its centre on
// the SAME clock (lib/strip-follow reads this very `--fade` off the chip), so
// the old chip fading out, the new one fading in and the strip's glide are
// one 400ms movement.
//
// ── THE FOCUS RING is TextButton's recipe — 2px of `--focus`, 2px off the
// box — and an outline follows `border-radius` in every current engine, so
// the ring is a pill too (SC 2.4.7). Never animated (above), never hidden.
//
// No 'use client', no hook, no state, no t(): rendering a chip costs a band
// no island (§16) — the price menu that renders them is an island for its
// own reasons.

type PillButtonOwnProps = {
  /**
   * The current choice. Fills the chip with the `accent` lavender (white
   * label, lavender edge) and adds `aria-current="page"` — an explicitly
   * passed `aria-current` wins (the price menu passes `location`). State is
   * announced and painted, never conveyed by the fade alone (§9).
   */
  active?: boolean;
  /**
   * Render no <button> of PillButton's own — the single child element you
   * nest (an `<a href="#…">`) BECOMES the control and wears these classes on
   * top of its own. Behaviour props (href, onClick…) belong on that child;
   * <button>-only props have no effect — disabled, form*, name and value draw
   * a dev-only console.error, while `type` is absorbed by its default before
   * the merge (ui/slot.ts documents the invariant).
   */
  asChild?: boolean;
  /** The label — already-translated text (§8.1); markup is allowed. */
  children: ReactNode;
};

export type PillButtonProps = PillButtonOwnProps &
  Omit<ComponentPropsWithRef<'button'>, keyof PillButtonOwnProps>;

// THE BOX, THE GLOW, THE RING, THE CLOCK — shared by both states (the header's
// THE SHAPE, THE GLOW IS ALWAYS ON, THE FOCUS RING and THE MOTION). ONE
// `rounded-*`, ONE `border-*` width and ONE `shadow-*` on the box, never a
// second: two utilities on one property are decided by the sheet's order.
const base =
  'inline-flex min-h-11 items-center justify-center rounded-full border-2 ' +
  'px-5 text-lg font-medium whitespace-nowrap hyphens-none shadow-aura ' +
  'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  '[--fade:400ms] transition-[background-color,border-color,color] ' +
  'duration-(--fade) ease-in-out motion-reduce:transition-none';

// THE PAINT (the header's THE PAINT), as an either/or so two same-property
// utilities never sit in one class list fighting over cascade order — and so
// the HOVER lives in the resting state alone: the current chip has none.
// THE CURRENT CHIP IN FORCED COLOURS (G2 a11y, 2026-10-09): Windows High
// Contrast and every forced-colours mode replace the author's colours with
// the system's, so the current chip lost its lavender fill and looked like
// the rest — the one cue it had besides `aria-current`. The ACTIVE state
// alone opts out (`forced-color-adjust: none`) and paints itself in the
// SYSTEM's own selection pair — `Highlight` ground and border,
// `HighlightText` label — with its glow off (an opted-out box keeps an
// author shadow) and a `CanvasText` focus ring that stands clear of a
// Highlight chip on any system ground; the resting chips keep every system
// colour the mode gives them. Each is a `forced-colors:` variant, emitted
// after the base utilities, so the sheet's order decides it deliberately.
const stateClasses = {
  resting:
    'border-card-tint bg-surface text-ink hover:border-accent hover:text-accent',
  active:
    'border-accent bg-accent text-ink-inverse ' +
    'forced-colors:[forced-color-adjust:none] forced-colors:border-[color:Highlight] ' +
    'forced-colors:bg-[color:Highlight] forced-colors:text-[color:HighlightText] ' +
    'forced-colors:shadow-none forced-colors:focus-visible:outline-[color:CanvasText]',
} as const;

export function PillButton({
  active = false,
  asChild = false,
  className,
  children,
  type = 'button',
  'aria-current': ariaCurrent,
  ...rest
}: PillButtonProps): ReactElement {
  const ownClasses = cx(
    base,
    stateClasses[active ? 'active' : 'resting'],
    className,
  );

  // `active` is sugar for the ARIA state, so an explicitly passed
  // aria-current still wins (§6.8 native-element fidelity — TextButton's
  // precedence): a caller marking a location keeps its word, and nothing but
  // this attribute leaks — `active` and `asChild` never reach the DOM.
  const rootProps = {
    ...rest,
    'aria-current': ariaCurrent ?? (active ? 'page' : undefined),
  };

  if (asChild) {
    // The child element becomes the control (ui/slot.ts, owner decision
    // fb-64): single-child guard first, child-wins merge, className merged
    // last, dev-only warning for <button>-only props.
    return slotClone(
      'PillButton',
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
