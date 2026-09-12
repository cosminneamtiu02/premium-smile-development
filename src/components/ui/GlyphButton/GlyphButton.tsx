import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { cx } from '@/lib/cx/cx';
import { discBase, discBox } from '../disc';
import { BUTTON_ONLY_PROPS, slotClone } from '../slot';

// ui/GlyphButton — the icon-only control FAMILY (renamed from ui/RoundButton
// with the top-bar rework, issue #22; originally migrated per the approved
// 2026-08-05 canvas plan .claude/plans/icon-button.plan.md, round 5, which
// merged the old `ui/icon-button` and the round face of `floating-book-cta`
// into one atom). Circles (the call CTA, the footer socials) and squares (the
// Header burger) are cut from the SAME verified bundles — the name says glyph,
// not round, because shape is now an axis and not the identity.
// The floating placement itself is NOT here: it is `fixed …` classes passed by
// the locale shell later (plan §8 fb-47).
// §6 contract: the icon is a slot (children), variant/shape/size are typed
// props, semantic tokens only, no outer margins, parent className merged (§6.8).
// LIGHT GROUNDS ONLY — every variant, not just ghost: the focus ring paints
// --focus (#1a1714), which vanishes on dark surfaces (1.11:1 on
// inverse-surface, G2 a11y 2026-08-06). Before any dark-ground section ships,
// the ring needs a per-surface answer (two-layer indicator or a token remap).
//
// MORPH-READY, NOT MORPHING: the burger's open↔close animation adds no state
// and no code path in here. The parent owns the state and spreads
// aria-expanded/aria-controls through `rest` onto this root (§6.8); the only
// thing this atom guarantees in return is the `group` class on that root, so
// the parent's own child SVG can drive itself with `group-aria-expanded:*`
// utilities. The transforms live on that SVG, in the section — never in a
// bundle here, where they would break the one-animation hover contract below.

export type GlyphButtonVariant = 'solid' | 'outline' | 'ghost';
export type GlyphButtonShape = 'round' | 'square';
export type GlyphButtonSize = 'md' | 'lg';

type GlyphButtonOwnProps = {
  /**
   * REQUIRED — icon-only control, no visible text (§6.3). Already-translated
   * string. In asChild mode a child element's own (defined) aria-label wins
   * over this one — the child IS the control, most-specific wins.
   */
  'aria-label': string;
  /**
   * Named color-pair bundle. solid = filled call CTA, drains on hover ·
   * outline = socials, fills on hover · ghost = the quiet tone, transparent
   * at rest.
   * Borders live INSIDE a bundle (only outline has one), never on the shape.
   */
  variant?: GlyphButtonVariant;
  /**
   * Geometry ONLY — the radius, nothing else: round = the circle (call CTA,
   * socials) · square = the 6px-radius cell (the Header burger). Orthogonal to
   * variant and size, so every face is available in either outline.
   */
  shape?: GlyphButtonShape;
  /** Square box, rem-based, fixed: md = 2.75rem/44px (§9 target) · lg = 3.5rem/56px (primary CTA scale). */
  size?: GlyphButtonSize;
  /**
   * Same slot contract as Button: render no <button> of GlyphButton's own —
   * the single child element you nest (an <a href="tel:…">, an <a href> built
   * by localeHref()) BECOMES the control and the icon sits inside it.
   * Behaviour props (href, target, onClick…) belong on that child;
   * <button>-only props have no effect — `type` is silently swallowed by its
   * destructured default (it never reaches the slot's check), the rest
   * (disabled, form*, name, value) get a dev-only console.error.
   */
  asChild?: boolean;
  /**
   * The icon — always an inline SVG (owner decision fb-41). Normally a glyph
   * component (<Phone />), which bakes in aria-hidden + currentColor; a raw
   * <svg> stays legal. This atom never imports a glyph: the slot takes any
   * svg, which is also why the type is ReactNode — in asChild mode the child
   * is the <a>/<button> wrapper and the svg sits one level deeper.
   * Pass the icon UNLABELED (the glyphs' default): a labelled glyph inside an
   * asChild anchor double-announces in the a11y tree. Never put visible text
   * here — aria-label overrides content, so what users see and what they can
   * say would diverge (SC 2.5.3 Label in Name).
   */
  children: ReactNode;
};

export type GlyphButtonProps = GlyphButtonOwnProps &
  Omit<ComponentPropsWithRef<'button'>, keyof GlyphButtonOwnProps>;

// Hover contract — the same one Button carries (see Button.tsx for the full
// reasoning and the owner decisions behind it, canvas fb-37/fb-38). Exactly
// ONE animation: the colors fade on one shared clock, --fade ease-in-out, so
// in and out mirror each other. Nothing moves — the old round button's
// hover:scale-105 growth and its shadow-cta → shadow-cta-lg pop are both gone
// (fb-49/fb-50, plan D2/D5); "jumps at you" was two extra animations.
// KEEP IN SYNC with Button's --fade (fb-44): 400ms here and 400ms there is
// deliberate — the two files are independent on purpose (plan D7), so
// changing the system's feel is a multi-file edit, never a drift. Button.tsx
// carries the matching pointer back, and since 2026-09-10 there is a THIRD
// holder: ui/Card's tone crossfade runs on the same 400ms (see Card.tsx's
// "TONE CROSSFADE" paragraph, which points back here). The clock is what is
// shared — the property list is not: a card fades PAINT only
// (background-color, border-color), with no press snap and no box-shadow
// channel, because it has no hover state to snap out of. NOTE for anyone
// editing the number: this atom does not spell `--fade` itself — it arrives
// through `discBase` in ../disc.ts, which SpeedDial imports too, so the three
// LITERAL holders are Button.tsx, ../disc.ts and Card.tsx.
// The icon needs no hover logic of its own: <Icon> (and any well-formed svg)
// paints with currentColor, so `color` — which IS in the transition list —
// carries the glyph through the fade for free.
// solid and outline are HOVER-MIRRORS (owner, 2026-09-06 — the socials'-hover
// rework: the corner call + WhatsApp discs adopt the Footer socials'
// fill/invert): each one's hover face is the other's rest face. outline
// FILLS green (fb-38, unchanged); solid DRAINS to surface ground + cta glyph
// + a 1px cta inset-ring hairline sitting exactly where outline's border
// does; both press to the same deep green (white over #008854 → #006b42 =
// 4.52:1 → 6.60:1). ghost still lerps the ground only (ink over transparent
// → #e9e6e2 = 11.9:1 at the far end). Both crossfaders pass glyph and ground
// through each other mid-fade — the knowingly-accepted fb-38 window,
// extended to solid with the mirror decision; a cta line holds the edge
// throughout (outline's border never transitions, holding 4.29:1; solid's
// hairline fades toward full visibility). The hairline stays an inset-ring
// rather than a real border for BYTE-PARITY with Button's solid — this fixed
// border-box square could take a border with zero layout shift, but Button's
// auto-width box cannot, and one mirror language beats two spellings (the
// ghost pair's own discipline). Composition note: FloatingActions dresses
// the corner discs in `shadow-aura` through className (its AURA ON THE
// CORNER comment); Tailwind's shadow/ring layers compose into ONE box-shadow
// value, so the static aura rides along unmoved while the hairline lerps
// under it.
// active:duration-0 snaps press feedback; motion-reduce:transition-none gives
// clean snaps (§9). --fade is INTERNAL: className is merged last, so a caller
// could stretch it with nondeterministic precedence. Change it here instead.
// The list is exactly background-color,color,box-shadow and NOT
// `transition-colors` — that shorthand covers outline-color and would drag
// the focus ring onto the same clock. box-shadow exists for solid's hairline
// alone; border-color stays OUT of the list on purpose, so outline's border
// is immovable by construction, not merely by value-constancy.
// `group` is the morph hook and nothing else: a marker class that emits no CSS
// of its own, so it is free at rest and lets a parent's child SVG react to
// THIS root's state (`group-aria-expanded:*`) without any code in here.
// The box, the focus ring and the --fade clock now come from ../disc.ts, the
// flat module ui/SpeedDial shares them with (D17 Road 3, 2026-08-27) — a
// ZERO-PIXEL refactor: the token SET below is identical to the one this atom
// emitted before, only the file the strings are DEFINED in moved. What stays
// here on purpose: `group`, the disabled state, the radius (shape is this
// atom's axis alone) and the transition list — exactly three properties,
// border-color pointedly absent, so the outline's border never moves and the
// focus ring never joins the clock.
const base =
  'group ' +
  discBase +
  ' disabled:pointer-events-none disabled:opacity-50 ' +
  'transition-[background-color,color,box-shadow]';

// Named bundles, not four free color props: every rest AND hover pair is
// measured once, so §9 holds by construction and no call site can invent an
// illegal combination (plan §4a). A new look = a new variant, verified once.
// KEEP-IN-SYNC (ClinicLocation board D6, 2026-09-09): sections/ClinicLocation's
// `ROW_HOVER` spells solid's `hover:`/`active:` members with the `group-`
// prefix — a decorative disc (this atom in asChild mode) driven by the ROW
// link around it, the old site's whole-row hover. ClinicLocation.test.tsx
// derives its expectation from a rendered instance of THIS bundle, so editing
// solid's hover face fails that test until the section moves with it.
const variantClasses: Record<GlyphButtonVariant, string> = {
  // Rest→hover DRAINS to outline's rest face; the press re-fills deep green
  // (the 2026-09-06 mirror law — see the contract above and Button.tsx).
  // Byte-identical to Button's solid, like the ghost pair below.
  solid:
    'bg-cta text-ink-inverse inset-ring inset-ring-transparent ' +
    'hover:bg-surface hover:text-cta hover:inset-ring-cta ' +
    'active:bg-cta-hover active:text-ink-inverse',
  outline:
    'border border-cta bg-surface text-cta ' +
    'hover:bg-cta hover:text-ink-inverse ' +
    'active:bg-cta-hover active:text-ink-inverse',
  // The quiet tone — byte-identical to Button's ghost bundle, on purpose: the
  // two atoms speak ONE ghost language, so a ghost square beside a ghost text
  // button reads as one control strip. CONSTRAINT: the hover tray is
  // `bg-line-subtle`, never `bg-raised` — --raised is #ffffff, i.e. an
  // invisible tray on the white surface. ink over #e9e6e2 = 11.9:1; the full
  // contrast record lives in Button.tsx. Rest is transparent, so ghost's REST
  // contrast belongs to the parent: light grounds only.
  ghost: 'bg-transparent text-ink hover:bg-line-subtle active:bg-line-subtle',
};

// Geometry, split out of `base` so the two faces cannot drift into two atoms:
// same box, same bundles, same fade — only the radius differs. rounded-md is
// 6px, the project's default component radius (§15.1), which is what makes the
// square burger cell sit flush with Button and the input fields around it.
const shapeClasses: Record<GlyphButtonShape, string> = {
  round: 'rounded-full',
  square: 'rounded-md',
};

// Fixed square boxes — fixed BY RULE (no `sm:` self-scaling inside an atom,
// §6.5), rem-based so browser zoom scales the whole control (§7): md
// 2.75rem/44px is the §9 primary touch target, lg 3.5rem/56px matches Button's
// lg scale. The box is the same in both shapes — size is orthogonal to shape,
// so a square burger cell hits the same 44px target as the round call CTA.
// Since ../disc.ts (D16 · F2) each step is the FALLBACK of one variable a HOST
// may set per screen type through className: `[--disc-size:4rem]` on the corner
// pair scales the call CTA and the language bulb together, from one number, in
// the section that owns their placement. Nothing moves at the fallback — 44 and
// 56, exactly as before.
// [&_svg]:size-* is how the CONTROL owns its icon's geometry: that descendant
// selector scores specificity (0,1,1) against a glyph's own preset class
// (0,1,0), so it wins in every browser and call sites may pass <Phone /> with
// or without a size prop. Glyphs emit no width/height attributes, so nothing
// else is in the fight (proven in situ by the IconSizePrecedence story). The
// glyph follows the BOX through the same variable — 2.75rem × 5/11 = 1.25rem
// and 3.5rem ÷ 2 = 1.75rem are the old size-5 / size-7 to the pixel, so a
// bigger disc gets a bigger icon instead of a small one adrift in it.
const sizeClasses: Record<GlyphButtonSize, string> = {
  md: `${discBox.md} [&_svg]:size-[calc(var(--disc-size,2.75rem)*5/11)]`,
  lg: `${discBox.lg} [&_svg]:size-[calc(var(--disc-size,3.5rem)/2)]`,
};

export function GlyphButton({
  variant = 'solid',
  shape = 'round',
  size = 'md',
  asChild = false,
  className,
  children,
  type = 'button',
  ...rest
}: GlyphButtonProps): ReactElement {
  const ownClasses = cx(
    base,
    variantClasses[variant],
    shapeClasses[shape],
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
      'GlyphButton',
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
