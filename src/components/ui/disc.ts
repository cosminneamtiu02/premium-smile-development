// ui/disc.ts — shared CONTROL-BOX GEOMETRY: what a fixed-box control's box IS,
// independent of what sits inside it (an svg, two letters), of its radius, and
// of the colours it wears. Extracted when the second consumer arrived — the
// repo's stated extraction moment (the ui/slot.ts play, owner fb-64; language-
// dial board .claude/plans/language-dial.plan.md D17 Road 3, 2026-08-27).
//
// NOT a component and NOT public API: ui-layer plumbing that sits flat beside
// the atom folders and may be imported by `ui/` atoms ONLY — never by
// `sections/`, never by `app/`. Importing a class-string module is not
// composing a component, which is what keeps both consumers leaves under the
// /classify-component rubric.
//
// STANDING RULE — editing this file = editing every atom that imports it
// (GlyphButton and SpeedDial today). The editing run's visual manifest must
// declare all consumers' stories: the visual net is what turns a silent
// cross-atom regression into a loud undeclared diff.

/**
 * The box, the ring and the clock — everything two disc-shaped controls share.
 *
 * · `inline-flex shrink-0 items-center justify-center` — a box that centres one
 *   thing and never collapses in a flex row.
 * · the focus ring (§9, SC 2.4.7): 2px, offset OUTSIDE the box, painted with
 *   --focus. LIGHT GROUNDS ONLY — the ring vanishes on dark surfaces (1.11:1 on
 *   inverse-surface); GlyphButton.tsx carries the full standing caveat.
 * · `--fade` — ONE clock for the whole system (Button ↔ GlyphButton fb-44), with
 *   `active:duration-0` snapping press feedback and `motion-reduce:transition-none`
 *   giving clean snaps to anyone who asked for less motion (§9).
 *
 * What is deliberately NOT in here: the `transition-[…]` PROPERTY LIST. Each
 * atom names its own — GlyphButton fades exactly background-color and color
 * (its border must not move), SpeedDial adds border-color and box-shadow for
 * the creep. A shared list would drag one atom's animation into the other.
 */
export const discBase =
  'inline-flex shrink-0 items-center justify-center ' +
  'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus ' +
  '[--fade:400ms] duration-(--fade) ease-in-out active:duration-0 motion-reduce:transition-none';

/**
 * The square box, in rem so browser zoom scales the whole control (§7).
 *
 * D16 · F2: the step is the FALLBACK of one variable, `--disc-size`, that a HOST
 * may set per screen type through className — `[--disc-size:4rem] xl:…` on the
 * corner pair, so the call CTA and the language bulb scale from ONE number and
 * keep reading as one row. The atoms themselves query nothing (§6.5: an atom
 * never reads the screen); `size` picks which number the fallback is.
 *
 * md 2.75rem/44px is the §9 touch target · lg 3.5rem/56px is the primary-CTA
 * scale. Both are pixel-identical to the `size-11` / `size-14` they replaced.
 * There is no `sm` step: SpeedDial's stem discs derive from the bulb's own
 * variable (`--disc`), so a third entry would have no consumer.
 */
export const discBox = {
  md: 'size-[var(--disc-size,2.75rem)]',
  lg: 'size-[var(--disc-size,3.5rem)]',
} as const;
