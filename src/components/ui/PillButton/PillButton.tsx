import type {
  AriaAttributes,
  ComponentPropsWithRef,
  ReactElement,
  ReactNode,
} from 'react';
import { cx } from '@/lib/cx/cx';
import { BUTTON_ONLY_PROPS, slotClone } from '../slot';

// ui/PillButton — the SELECTABLE CHIP: a fully round-ended button with a thin
// lavender edge and the header pill's glow, one of a row of them, the current
// one filled. Built for the price page's phone and tablet menu (owner
// 2026-10-09, verbatim: "new button tipe with rounded left and right edge.
// current lillla other with aura shadwo and thin border like the dr cards and
// text inside"), where a horizontal strip of these replaces the stacked list
// of categories (sections/PriceList/PriceMenu) — and, since 2026-10-14, the
// same pill as a TAG, a label that answers nothing (THE TAG, below). Its file
// shape, its API and its doctrines are ui/TextButton's, which it sits beside:
// a quiet action TextButton keeps — chrome-less text — and this is the one
// with a ground.
//
// ── WHY AN ATOM AND NOT THE PRICE MENU'S CLASS STRING. The look is a
// primitive (§4's promotion rule: primitives are built in ui/ first, never
// inline in a section): it composes no other atom, holds no word, knows no
// price — a band that wants a row of choices takes it as it is. The menu is
// its first consumer and the blog card its second, whose categories wear it
// as tags; tests/unit/accent-census.test.ts names every renderer and the
// ground its chips sit on.
//
// ── THE API IS TextButton's, so a reader of one knows the other:
// `<button type="button">` by default; `asChild` through ui/slot.ts (the
// single child element — an `<a href="#…">` on the price page, an `<li>` on
// the blog card — BECOMES the chip and wears these classes; a tag requires
// it, THE TAG); `active` = the current look AND the `aria-current="page"`
// sugar, an explicitly passed `aria-current` winning (the price menu passes
// `location`, PriceMenu.tsx argues the pair); native props spread onto the
// root, `ref` a regular prop (React 19), `className` merged LAST (§6.8 —
// placement only: a margin, a scroll margin, never a restyle of the face). No
// outer margin (§6.4: the row's `gap` owns the spacing) and no string of its
// own (§8.1: the label arrives finished). Each atom adds named situations of
// its own beside that core: TextButton its `tone` and `hoverArea`, this one
// its `kind` (THE TAG).
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
// ── THE PAINT, two states, one hover and a tag's one face, each a measured
// pair (WCAG 2.2):
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
//   · TAG — that hover face, held still: the label and the edge in `accent`
//     on the white face, the same 5.06:1, under a pointer and away from one
//     (THE TAG).
// tests/unit/accent-census.test.ts counts the six `accent` spellings below
// and measures each pair from the tokens' own lines.
//
// ── THE GLOW IS ALWAYS ON (the owner: "they should have aura"): the header
// pill's `shadow-aura`, worn by every face — a chip is a small floating
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
// one 400ms movement. A tag never changes, so its clock never runs.
//
// ── THE FOCUS RING is TextButton's recipe — 2px of `--focus`, 2px off the
// box — and an outline follows `border-radius` in every current engine, so
// the ring is a pill too (SC 2.4.7). Never animated (above), never hidden.
//
// ── THE TAG (owner, 2026-10-14, on the blog card's categories, verbatim:
// "the pills with "sfaturi", "urgente" shold always have statically, so
// nothing on hover, the on hold aspect. so it should be in this case here not
// dependent on hove ,s oit hsould always have the current hover aspect on it
// no matter what and houls not be dinamic, i do not want to give impression
// of a button"): `kind` says WHAT the chip is. A `control` — the default,
// every chip the price strip draws — answers a hover and may be current. A
// `tag` is a LABEL: the resting control's hover face held still, with no
// `hover:` utility at all, so a pointer changes nothing and nothing promises
// a press; never current — `active` and `aria-current` on a tag are compile
// errors (PillButtonProps' union); and never a <button> — a tag REQUIRES
// `asChild` (the union again), so its element is always one of the caller's
// that is no control: the blog card puts each tag on an `<li>`, so its tags
// take no focus and are read as the items of a named list. (Rendered bare, a
// tag was the atom's own focusable <button>, read „igienă, button" — the G2
// review's finding, 2026-10-14.) One that still arrives bare, past the types,
// is put on a <span> (THE KIND RULE, below). Whatever reaches a tag past the
// types — a Storybook control, an untyped spread — changes neither its face
// nor the ARIA the ATOM emits; an attribute the slotted child declares itself
// stays the child's (ui/slot's child-wins rule), the caller's to answer for.
// A PROP, NEVER A className (§6.8): a className can only ADD classes, and
// what makes a tag is a class it does NOT wear — the resting row's hover pair
// would stay in the list and light the chip under a pointer — while a
// caller's lavender beside the resting row's ink would leave the label's
// colour to the stylesheet's order (THE PAINT's either/or exists to prevent
// exactly that). A `kind`, not TextButton's `tone`: it changes what the chip
// does — its hover, its state, its ARIA, its element — not only its ink. And
// a kind of THIS atom, not a ui/Tag of its own: a tag IS this chip — the same
// box, edge, glow, label and clock, its face the control's own hover face —
// so a second atom would be a copy kept in step by hand: one face, two kinds.
// CONTRAST (WCAG 2.2): the label is `accent` on the chip's own opaque white
// face, MEASURED 5.06:1 whatever lies behind the chip — the blog card floats
// its tags over a photograph — past SC 1.4.3's 4.5:1, the bar for any text
// short of large, at every size the label is drawn: down to the 12px floor of
// the blog card's chip scale (sections/PostCard's THE CHIPS FOLLOW THEIR
// CARD) and below it, to the 7.8px of the Home band's 65 % miniature, whose
// floor is that one × its share (PostCard's THE MINIATURE) — the colour pair
// being the same at every size. The lavender edge is
// decoration on a tag, like the glow: a tag is no control, and SC 1.4.11 asks
// nothing of it.
//
// No 'use client', no hook, no state, no t(): rendering a chip costs a band
// no island (§16) — the price menu that renders them is an island for its
// own reasons.

/** WHAT the chip is — a named situation: a `control` (a button or a link that
 *  answers a hover) or a `tag` (a label that answers nothing). */
export type PillButtonKind = 'control' | 'tag';

type PillButtonOwnProps = {
  /**
   * What the chip is. `control` (the default) is every chip the price strip
   * draws: white at rest, the lavender edge and label under a hover. `tag` is
   * a LABEL — the control's hover face (the lavender edge and label on white)
   * held still, with no hover at all, so nothing suggests a press: the blog
   * card's categories (the header's THE TAG has the owner's words). A tag is
   * never current and never bare: `active` or `aria-current` beside
   * `kind="tag"` does not compile, and neither does a tag without `asChild`.
   * @default 'control'
   */
  kind?: PillButtonKind;
  /**
   * The current choice. Fills the chip with the `accent` lavender (white
   * label, lavender edge) and adds `aria-current="page"` — an explicitly
   * passed `aria-current` wins (the price menu passes `location`). State is
   * announced and painted, never conveyed by the fade alone (§9). A control's
   * alone: a tag is never current.
   */
  active?: boolean;
  /**
   * Render no element of PillButton's own — the single child element you
   * nest WEARS the chip, these classes on top of its own. A control's child
   * (an `<a href="#…">`) becomes the control; a tag's (an `<li>`, a `<span>`)
   * stays what it is, a label that takes no focus. REQUIRED for a tag (THE
   * TAG). Behaviour props (href, onClick…) belong on that child;
   * <button>-only props have no effect — disabled, form*, name and value draw
   * a dev-only console.error, while `type` is absorbed by its default before
   * the merge (ui/slot.ts documents the invariant).
   */
  asChild?: boolean;
  /** The label — already-translated text (§8.1); markup is allowed. */
  children: ReactNode;
};

/**
 * A TAG IS NEVER CURRENT AND NEVER A BUTTON, as a union on `kind` (THE TAG):
 * a control — named or by default — takes `active`, `aria-current` and an
 * optional `asChild`; a tag takes no state and REQUIRES `asChild`, so
 * `<PillButton kind="tag" active>` and a bare `<PillButton kind="tag">` are
 * compile errors, not review notes.
 */
type PillButtonKindProps =
  | { kind?: 'control' }
  | { kind: 'tag'; asChild: true; active?: never; 'aria-current'?: never };

export type PillButtonProps = PillButtonOwnProps &
  PillButtonKindProps &
  Omit<ComponentPropsWithRef<'button'>, keyof PillButtonOwnProps>;

// THE BOX, THE GLOW, THE RING, THE CLOCK — shared by every face, both states
// and the tag (the header's THE SHAPE, THE GLOW IS ALWAYS ON, THE FOCUS RING
// and THE MOTION). ONE `rounded-*`, ONE `border-*` width and ONE `shadow-*`
// on the box, never a second: two utilities on one property are decided by
// the sheet's order.
const base =
  'inline-flex min-h-11 items-center justify-center rounded-full border-2 ' +
  'px-5 text-lg font-medium whitespace-nowrap hyphens-none shadow-aura ' +
  'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  '[--fade:400ms] transition-[background-color,border-color,color] ' +
  'duration-(--fade) ease-in-out motion-reduce:transition-none';

// THE FACES (the header's THE PAINT) — a control's two states and a tag's one
// face — as an either/or so two same-property utilities never sit in one
// class list fighting over cascade order, and so the HOVER lives in the
// resting face alone: the current chip and the tag have none.
// THE CURRENT CHIP IN FORCED COLOURS (G2 a11y, 2026-10-09): Windows High
// Contrast and every forced-colours mode replace the author's colours with
// the system's, so the current chip lost its lavender fill and looked like
// the rest — the one cue it had besides `aria-current`. The ACTIVE state
// alone opts out (`forced-color-adjust: none`) and paints itself in the
// SYSTEM's own selection pair — `Highlight` ground and border,
// `HighlightText` label — with its glow off (an opted-out box keeps an
// author shadow) and a `CanvasText` focus ring that stands clear of a
// Highlight chip on any system ground; the resting chips and the tags, which
// have no state to keep, take every system colour the mode gives them. Each
// is a `forced-colors:` variant, emitted after the base utilities, so the
// sheet's order decides it deliberately.
const faceClasses = {
  resting:
    'border-card-tint bg-surface text-ink hover:border-accent hover:text-accent',
  active:
    'border-accent bg-accent text-ink-inverse ' +
    'forced-colors:[forced-color-adjust:none] forced-colors:border-[color:Highlight] ' +
    'forced-colors:bg-[color:Highlight] forced-colors:text-[color:HighlightText] ' +
    'forced-colors:shadow-none forced-colors:focus-visible:outline-[color:CanvasText]',
  // A TAG: the resting chip's hover face, at rest and for good — no `hover:`
  // utility, so nothing changes under a pointer.
  tag: 'border-accent bg-surface text-accent',
} as const;

type AriaCurrent = AriaAttributes['aria-current'];

// THE KIND RULE — WHAT A KIND IS, decided in ONE place: its face by state,
// the aria-current the atom emits, and the element it renders when no
// `asChild` hands it one. A CONTROL: the resting or the current face; the
// caller's aria-current, else `active`'s "page" sugar (§6.8 native-element
// fidelity — TextButton's precedence: a caller marking a location keeps its
// word); a <button>. A TAG: its one face, whatever state reaches it; no
// aria-current, ever; and a <span> — THE BELT for a tag that arrives without
// the `asChild` the types require: never a <button>.
type KindRule = Readonly<{
  face: (active: boolean) => string;
  current: (passed: AriaCurrent, active: boolean) => AriaCurrent;
  bare: 'button' | 'span';
}>;

const CONTROL_RULE: KindRule = {
  face: (active) => faceClasses[active ? 'active' : 'resting'],
  current: (passed, active) => passed ?? (active ? 'page' : undefined),
  bare: 'button',
};

const TAG_RULE: KindRule = {
  face: () => faceClasses.tag,
  current: () => undefined,
  bare: 'span',
};

// WHICH RULE a kind follows — TOTAL over PillButtonKind, ui/Card's
// `glowClasses` shape: the `never` line stops a third kind compiling until it
// is classified here, and at run time a value that escaped the types (a
// Storybook control, an untyped spread) is read as a TAG — the kind that
// claims nothing: no hover, no current state, no <button>. It fails CLOSED:
// never a TypeError, never a control nobody named. Not exported.
function ruleOf(kind: PillButtonKind): KindRule {
  if (kind === 'control') return CONTROL_RULE;
  if (kind === 'tag') return TAG_RULE;
  const unclassified: never = kind;
  void unclassified;
  return TAG_RULE;
}

export function PillButton({
  kind = 'control',
  active = false,
  asChild = false,
  className,
  children,
  type = 'button',
  'aria-current': ariaCurrent,
  ...rest
}: PillButtonProps): ReactElement {
  const rule = ruleOf(kind);
  const ownClasses = cx(base, rule.face(active), className);

  // The ARIA the atom emits is the kind's (THE KIND RULE). Nothing else
  // leaks: `kind`, `active` and `asChild` never reach the DOM.
  const rootProps = {
    ...rest,
    'aria-current': rule.current(ariaCurrent, active),
  };

  if (asChild) {
    // The child element wears the chip (ui/slot.ts, owner decision fb-64):
    // single-child guard first, child-wins merge, className merged last,
    // dev-only warning for <button>-only props.
    return slotClone(
      'PillButton',
      children,
      ownClasses,
      rootProps,
      BUTTON_ONLY_PROPS,
    );
  }

  if (rule.bare === 'span') {
    // THE BELT (THE KIND RULE): a tag that arrives without `asChild`, past
    // the types, goes on a <span> of the atom's own through the same engine —
    // exactly what `asChild` onto a <span> gives, never a <button>.
    return slotClone(
      'PillButton',
      <span>{children}</span>,
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
