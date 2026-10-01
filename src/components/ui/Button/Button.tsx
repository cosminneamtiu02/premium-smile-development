import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { cx } from '@/lib/cx/cx';
import { BUTTON_ONLY_PROPS, slotClone } from '../slot';

// ui/Button — the one button of the design system (migrated per the approved
// 2026-08-02 canvas plan; replaces the Phase 0 probe wholesale).
// §6 contract: content is a slot (children), variants/sizes are typed props,
// semantic tokens only, no outer margins, parent className merged (§6.8).

export type ButtonVariant = 'solid' | 'outline' | 'ghost';
export type ButtonTone = 'cta' | 'accent';
export type ButtonMotion = 'still' | 'jump';
export type ButtonSize = 'md' | 'lg' | 'xl';

type ButtonOwnProps = {
  /** The face's shape. solid = filled, drains on hover · outline = bordered, greys on hover · ghost = quiet. */
  variant?: ButtonVariant;
  /**
   * The colour FAMILY the face is cut from (THE TWO FAMILIES below): `cta`,
   * the green of the one conversion goal — THE DEFAULT, every call site that
   * says nothing — or `accent`, the lavender the menu buttons wear, chosen
   * per call site on the owner's word (2026-10-01). ghost paints with ink and
   * ignores it.
   */
  tone?: ButtonTone;
  /**
   * What MOVES on hover (THE JUMP below): `still` — THE DEFAULT, nothing;
   * the colours fade and the box holds — or `jump`, the old site's pop: the
   * box scales to 105 % on its own 200ms ease-out clock while the colours
   * keep their 400ms fade, drops back to rest on press, and never moves
   * under reduced motion. Chosen per call site on the owner's word
   * (2026-10-01); tests/unit/jump-census.test.ts names every one.
   */
  motion?: ButtonMotion;
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
// with it. (One exception since 2026-10-01, opt-in per call site: THE JUMP,
// its own paragraph below.)
// solid and outline WERE HOVER-MIRRORS: each variant's hover face the
// other's rest face, both pressing to the same deep-green active face.
// AMENDED 2026-09-20 (owner, hero pack round 3 — "the vezi serviciile
// button should not turn green, but rather gray out a little"): outline no
// longer fills. It GREYS — ground → line-subtle, label → cta-hover — and
// its press shares that face (the ghost precedent: the snap shows from a
// non-hover state). The label darkens ONE step because it must: cta itself
// measures 3.63:1 on line-subtle, under SC 1.4.3's 4.5:1, while cta-hover
// measures 5.31:1 there; the border stays cta (3.63:1 on the grey clears
// SC 1.4.11's 3:1 boundary, and border-color is not on the fade clock, so
// a border that changed would snap). The mirror law now holds in ONE
// direction only: solid's hover face is STILL outline's rest face; the
// outline half is its own grey. This variant is worn by the Hero's services
// link; GlyphButton's outline — the Footer's discs, the reviews deck's
// prev/next — keeps its own two-way mirror, so those discs FILL on hover
// while this button greys (one look per atom, §6.6). solid DRAINS on hover (rest →
// bg-surface + cta label + a 1px cta hairline, keeping the control's ≥3:1
// boundary on white grounds, SC 1.4.11). The hairline is an INSET-RING — box-shadow, never a border —
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
// The crossfade window: solid passes label and ground through each
// other mid-fade — measured below 4.5:1 for ≈92% of the fade (both
// directions), 1:1 at the midpoint. KNOWINGLY ACCEPTED for outline since
// fb-38 (its old fill; since the 2026-09-20 grey the outline fade only
// runs surface → line-subtle under cta → cta-hover, and never drops below
// ~3.6:1) and extended to solid by the same reasoning with the 2026-09-06
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
// mirror law (fb-44) so the whole system fades at one speed. The 400ms is
// spelled in THREE files, deliberately independently: this one, ui/disc.ts
// (which serves GlyphButton and SpeedDial), and — since 2026-09-10 —
// ui/Card, whose tone crossfade runs on the same clock (its "TONE CROSSFADE"
// paragraph carries the reasoning and the pointer back). Changing the
// system's feel is therefore a three-file edit that nothing can do by
// accident. What Card does NOT copy is the property list: it fades PAINT
// only — background-color and border-color — because it has no hover, no
// press and no focus ring, so this file's box-shadow channel and
// `active:duration-0` would be clocks for states a card does not have.
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
// `text-center` — A LABEL THAT WRAPS STAYS CENTRED (2026-09-30). The flex
// container centres the label's BOX, not its LINES, so a two-line label was
// laid out start-aligned inside a centred box. First asked for by the
// ContactModal's WhatsApp label (owner, 2026-09-05), which carried the class
// at its call site; promoted here at the SECOND consumer, the doctor card's
// „Mai multe despre mine" on a 390px phone (sections/PersonnelCard D17). A
// single-line label is pixel-identical.
// ── THE TWO FAMILIES (owner, 2026-10-01 — "there is a set of buttons i need
// you to make lilla, like the one that the latest menu buttons are"): every
// bundle below exists in TWO colour families, selected by `tone`. `cta` is
// the locked green of the one conversion goal (§15.1) and the DEFAULT — a
// call site that says nothing is byte-identical to the day before the axis
// existed. `accent` is the lavender role minted for ui/TextButton on
// 2026-10-01 (globals.css carries its charter), cut to the SAME faces with
// three substitutions and nothing else: cta → accent, cta-hover →
// accent-strong (the family's one-step-darker ink, the violet of ui/Keyword),
// the hairline → inset-ring-accent. The hover contract, the fade clock, the
// press snap and the mirror law are unchanged — only the hue (Button.test
// derives one family from the other, so a fourth substitution cannot hide).
// Who wears it is a per-call-site decision, each on the owner's word, and
// tests/unit/accent-census.test.ts names every one: the doctor card's one
// link (sections/PersonnelCard, solid) and the Hero's two calls to action
// (its contact trigger, solid — "when on hover it must still turn white" —
// and its services link, outline — "border and text at rest, but not
// background color and on hover it should still turn current slight gray")
// — and, since the same evening, the Header's Contact button (solid, in the
// bar and in the burger panel): it had been pinned GREEN that morning on the
// owner's "contact button MUST STAY GREEN AS IT MUST JUMP INTO YOUR EYES",
// and the owner reversed his own rule in the evening — "also paint the
// contact button from top bar a lilla and make it wider, more seszable and
// adjust to widest language form" (Header.tsx carries the width; Header.test
// pins the lilac now). NOT the contact dialog's own two buttons: the green is
// what the CTA family is still FOR.
// Contrast record for the lavender, measured (WCAG 2.2 relative luminance):
// solid rest = white on accent #746894 → 5.06:1 (SC 1.4.3 for the 18px
// medium label; the green reads 4.52:1); solid hover = outline's rest face,
// accent on surface 5.06:1, the inset-ring hairline 5.06:1 on surface as the
// non-text boundary; solid press = white on accent-strong #4b3a86 → 9.34:1
// (the green's 6.60:1); outline rest = accent on surface 5.06:1, its border
// 4.81:1 over --page (SC 1.4.11's 3:1 with room); outline hover = the label
// darkens ONE step for the very reason the green does — accent itself reads
// 4.07:1 on line-subtle, under 4.5:1, while accent-strong reads 7.51:1 — and
// the border stays accent (4.07:1 on the grey clears 3:1). The crossfade
// window is the green's own, knowingly accepted. On the Hero's dark veil the
// outline's lavender border reads 1.75:1 against the worst-case photograph
// (the green read 1.57:1 there): the control's boundary is its own white box,
// not the line — unchanged by this axis.
// A consumer may dress a face in the top bar's `shadow-aura` through
// className (the Hero's services link does, owner 2026-10-01 — the
// GlyphButton/FloatingActions precedent): the ring and shadow layers compose
// into ONE box-shadow value, and because outline sets no shadow layer of its
// own, a static aura on it holds still by value-constancy even though
// box-shadow rides the fade clock (ui/disc.ts argues the same for the corner
// discs); on solid the hairline lerps UNDER an unmoving aura. On a face
// that JUMPS the aura rides the scale with the box, 5 % larger at the top of
// the hover — the box-shadow is drawn in the element's own space — which is
// the only growth the glow gets (THE JUMP below).
const base =
  'inline-flex items-center justify-center gap-2 text-center ' +
  'rounded-md font-medium hyphens-none outline-offset-2 ' +
  'focus-visible:outline-2 focus-visible:outline-focus ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  '[--fade:400ms] active:duration-0 motion-reduce:transition-none';

// ── THE JUMP (owner, 2026-10-01 — "like in old webpage i want the book
// consultation, see our services, call hover button in bottom right and
// whatsapp button, contact button in top bar, more about me button in doctor
// card, to have that jump at you animation on hover. this should not affect
// buttons from footer"). The old site's primary actions grew on hover —
// `hover:scale-105 active:scale-100` on a 200ms ease-out `transition-all`
// (top-bar.tsx, home-page.tsx, icon-button.tsx) — and this atom's hover
// contract above had cut exactly that as "two animations" (fb-49/fb-50, the
// 2026-08-05 GlyphButton board's D2). The owner brought it back for SIX named
// buttons and no others, so it is an AXIS, `motion`, never the base: `still`
// (the default, every elder byte-identical) keeps the one colour fade;
// `jump` adds the SCALE as a second, named clock — `--jump` 200ms ease-out,
// the old site's own numbers — beside the colours' `--fade` 400ms ease-in-out,
// spelled as per-property lists on the three transition longhands so neither
// clock stretches the other (one `duration-*` utility would give the scale
// the fade's 400ms, and a swell is not a jump). The press snaps the box back
// to rest (`active:scale-100`, under base's `active:duration-0`), and under
// reduced motion the box never moves at all (`motion-reduce:hover:scale-100`
// beside base's `transition-none` — the Hero's rule, "the colours without
// movement"). NOT ported from the old pop: its second half, the glow's growth
// (`shadow-cta` → `shadow-cta-lg`) — shadow utilities stay banned in every
// bundle (Button.test's fb-50 twin ban), and a consumer's static `shadow-aura`
// simply scales with the box. The jump cell is the ONE place `scale` enters
// the transition list, and the three longhands are ARBITRARY PROPERTIES on
// purpose: `transition-[…]` + `duration-*` + `ease-*` would set the same
// three properties a second time, and two utilities on one property are
// decided by the sheet's order, not by the caller (Header.tsx's `display`
// lesson). KEEP-IN-SYNC with GlyphButton's `motionClasses` — byte-identical
// cells, GlyphButton.test pins the equality — and with the lists in
// tests/unit/jump-census.test.ts (who wears it: the Hero's two calls to
// action, the doctor card's link, the Header's bar Contact — through
// ui/GlyphButton, the fixed corner's two discs; NOT the Footer's discs, the
// reviews deck's prev/next, the map band's row discs, the burger panel's
// full-width Contact or the dialog's buttons).
const motionClasses: Record<ButtonMotion, string> = {
  // The colour fade alone — the tokens the base row carried until the axis
  // existed, moved here unchanged. The list is exactly
  // background-color,color,box-shadow (the contract above says why).
  still:
    'transition-[background-color,color,box-shadow] duration-(--fade) ease-in-out',
  jump:
    '[--jump:200ms] ' +
    '[transition-property:background-color,color,box-shadow,scale] ' +
    '[transition-duration:var(--fade),var(--fade),var(--fade),var(--jump)] ' +
    '[transition-timing-function:ease-in-out,ease-in-out,ease-in-out,ease-out] ' +
    'hover:scale-105 active:scale-100 motion-reduce:hover:scale-100',
};

// The quiet tone paints with ink, not with a family: ONE bundle, both cells,
// so the table stays total and a ghost reads the same under either tone
// (Button.test pins the equality).
const ghost =
  'bg-transparent text-ink hover:bg-line-subtle active:bg-line-subtle';

// Every cell is a LITERAL class string, never assembled from the tone name:
// Tailwind's scanner emits only the complete utilities it can read in the
// source, and a `bg-${tone}` template would ship no CSS at all.
const variantClasses: Record<ButtonVariant, Record<ButtonTone, string>> = {
  // Rest→hover DRAINS to outline's rest face; the press re-fills deep green —
  // deep violet in the lavender family (the 2026-09-06 mirror law — full
  // reasoning in the contract above).
  solid: {
    cta:
      'bg-cta text-ink-inverse inset-ring inset-ring-transparent ' +
      'hover:bg-surface hover:text-cta hover:inset-ring-cta ' +
      'active:bg-cta-hover active:text-ink-inverse',
    accent:
      'bg-accent text-ink-inverse inset-ring inset-ring-transparent ' +
      'hover:bg-surface hover:text-accent hover:inset-ring-accent ' +
      'active:bg-accent-strong active:text-ink-inverse',
  },
  // Rest→hover GREYS a little on the shared --fade clock: the ground to
  // line-subtle, the label one step darker (owner, 2026-09-20 — the
  // contract above; supersedes the 2026-08-04 fill, fb-38). The press
  // shares the hover face, like ghost.
  outline: {
    cta:
      'border border-cta bg-surface text-cta ' +
      'hover:bg-line-subtle hover:text-cta-hover ' +
      'active:bg-line-subtle active:text-cta-hover',
    // The lavender cell's grey is ONE STEP DARKER than the green's — `line`
    // #d8d4cf, not `line-subtle` #e9e6e2 (owner, 2026-10-01, on the Hero's
    // services link: "on hover of vezi serviciile i want little darker shade
    // of gray"): the family's FOURTH substitution, declared in Button.test's
    // derivation and scoped to this variant. The green cell cannot follow it:
    // cta-hover reads 4.47:1 on `line`, under SC 1.4.3's 4.5:1, while
    // accent-strong reads 6.33:1 there and the accent border 3.43:1 (SC
    // 1.4.11's 3:1 cleared) — tests/unit/accent-census.test.ts measures them.
    accent:
      'border border-accent bg-surface text-accent ' +
      'hover:bg-line hover:text-accent-strong ' +
      'active:bg-line active:text-accent-strong',
  },
  ghost: { cta: ghost, accent: ghost },
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
  tone = 'cta',
  motion = 'still',
  size = 'md',
  asChild = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps): ReactElement {
  const ownClasses = cx(
    base,
    motionClasses[motion],
    variantClasses[variant][tone],
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
