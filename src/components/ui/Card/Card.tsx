import type { ComponentProps, ReactElement } from 'react';
import { cx } from '@/lib/cx/cx';
import { slotClone } from '../slot';

// ui/Card — THE card surface, and the only place its geometry is spelled.
// Promoted 2026-09-09 on the owner-approved board .claude/plans/card-atom.plan.md
// (verdict fb-415), the moment the surface stopped being one section's
// business: the two approved dossiers — TeamMemberCard and ServiceCard — plus
// the archived ServicesTeaser <li> had each arrived at the SAME root, byte for
// byte, from three independent readings of the old site. That is §4's
// "identical mechanics, second consumer arrives → extract to the nearest tier
// both may import" row, with the third and fourth consumers already named
// (PostCard on the blog index, ReviewCard when the reviews band ships) and the
// ClinicLocation breakdown's D2 trigger fired exactly as it was written.
// The old repo's composite/card is NOT the ancestor: it took a `title` string
// and rendered its own heading — the shape §6.2's "slots over modes" replaces —
// and had zero app consumers, so the same inventory pass that opened this row
// dropped it. What the old repo actually had was five divergent inline
// spellings of one idea; this file is the reply.
//
// ── WHAT THIS ATOM OWNS: the paint (a background and a border — 1px on the
// flat rows, 3px for `framed`), the corner radius (§15.1's 6px default), the
// inner padding, the inner COLUMN —
// children stack vertically with one rhythm between them — and the
// `@container` context that stack is measured against.
//
// ── WHAT IT DELIBERATELY DOES NOT OWN, each rejection with a named re-open
// trigger, so a section lane can tell "not decided yet" from "decided no":
//   · WIDTH (D3) — the parent's, always: a card fills the grid track, the
//     flex slot or the block flow it is placed in. TRIGGER: a consumer that
//     needs a card NARROWER than its slot re-opens width as an additive prop
//     with a board note — until then `max-w-*` rides className as placement.
//   · HEIGHT / MIN-HEIGHT (D4) — equal-looking cards in a row are the GRID's
//     doing (`align-items: stretch` is the default) plus `flex-1` on the child
//     that should absorb the slack, which is also what pins a price or a CTA
//     line to the bottom of every card in the row. That pair is §8.4's
//     expansion mechanism — German runs 30–35% longer and the tallest card
//     sets the row — and a `minHeight` prop would freeze a number the longest
//     language then overflows. A LONE card's floor is placement: `min-h-*`
//     through className.
//   · PER-SIDE PADDING (D5) — rejected twice over: `paddingTop`-style knobs
//     are CSS with a prop's clothes on (the named-situations doctrine below),
//     and a left/right pair would be the physical spelling §3's logical
//     properties exist to avoid. TRIGGER: a `density` AXIS OF ITS OWN
//     (`regular | compact`, its own lookup — padding AND gap move together as
//     ONE situation, D8) joins when a SECOND proven card kind measures a
//     different inset; never as a row of `tone`, which would couple paint to
//     inset and make every future combination a new row. One lane's wish is
//     not a second measurement.
//   · A RADIUS PROP — ui/Image's D3 reasoning, inherited: the radius is
//     internal to the look, one value for the whole site, and a per-call knob
//     turns a design decision into call-site variance.
//   · TEXT COLOUR — ink is inherited from the body, so a card reads the same
//     wherever it lands and a section can still tone individual lines through
//     ui/Text (§6.1: closed system, no styling of other people's insides).
//
// ── WHY className CANNOT BE THE PADDING OR COLOUR API — measured on the board
// against this repo's own Tailwind (4.3.3) rather than assumed: the sheet emits
// `p-4` before `p-6` before `p-8`, `rounded-lg` before `rounded-md`,
// `bg-black` before `bg-white`. One flat layer, single-class selectors, equal
// specificity — and `cx` is a plain join (lib/cx/cx.ts), so the attribute order
// it produces is a convention, never a cascade. CSS picks the LATER rule in
// the STYLESHEET, which means a caller's `p-4` can never beat this atom's
// padding while `p-8` happens to win: an "override" that works in one
// direction only is worse than none, because it reads as an API. On a `framed`
// card not even that half survives: ARBITRARY values are emitted AFTER the
// whole named scale, so `p-[calc(1.5rem-2px)]` outranks `p-4`, `p-6` and `p-8`
// alike and no caller `p-*` wins in either direction. The conclusion is the
// same one, only stronger: className is PLACEMENT only (§6.8 — `h-full`,
// `max-w-*`, `col-span-*`, a grid area), and anything that must be able to win
// in BOTH directions is a prop here or it is nothing.
//
// ── THE CONTAINER MARK IS BUNDLED WITH THE SURFACE (D10), for ui/Container's
// reason rather than a new one: splitting them has a silent failure mode. A
// card that took the padding but forgot the mark would leave its consumers'
// `@sm:`/`@md:` variants with no queryable ancestor — the nearest context
// would be the BAND's column, so a card-level step would silently measure the
// whole band — and container-gated styles then match at the wrong width or
// never. No error, no console line: exactly the regression class the §13 nets
// exist for. COSTS, stated here rather than discovered later: `container-type:
// inline-size` opens a stacking context AND a positioning scope on every card
// (benign — the app-shell z-map keeps scopes flat at body level, and an
// absolutely-positioned badge inside a card now resolves against the card,
// which is what a badge wants), and it applies INLINE-SIZE CONTAINMENT, so a
// Card must always sit in a width-giving parent: a grid track, a `flex-1`
// item, ordinary block flow. GRID TRACKS ARE SAFE even when they are implicit
// and `auto`-sized — a grid's default `justify-content: normal` behaves as
// stretch, so the track fills its container; the InAGrid story's 320 frame is
// the proof (three full-width cards in one implicit auto column). The REAL
// collapse cases are the ones where nothing hands the box a width and the
// contents may no longer be consulted for one: a direct child of a `flex` ROW
// with no `flex-1`, `basis-*` or `w-full` (flex-basis stays `auto`, the
// contained content contributes 0, and the card shrinks to roughly 50px of
// padding and border); a grid whose `justify-items`/`justify-content` is
// anything other than stretch; `w-fit`/`w-max`; a float; an absolutely
// positioned box with no inset pair. In every one of those, hand the card a
// width — the rule does not change, only the list of places that break it.
//
// ── `tone` NAMES SITUATIONS, NEVER CSS KNOBS (ui/Image's D1 doctrine): a
// section asks for `emphasized`, not for a background and a border colour, so
// the day the palette moves this file moves once. Two rules hold the axis
// together.
// (1) THE SUM RULE — every row spends the same 25px per side on BORDER WIDTH
// PLUS PADDING: 1 + 24 for the three flat rows, 3 + 22 for `framed`. Content
// therefore starts at the same place whatever tone a card wears, so switching
// one moves nothing by a pixel and a framed card in a grid row keeps its text
// edges aligned with its neighbours' — the property the old repo's cards did
// not have. It also explains why the PADDING lives in the rows rather than in
// `cardClasses`: a row that had to correct the shared `p-6` would emit a
// second `p-*` on the same element, and which of the two wins is decided by
// their order in the compiled sheet, not by the code — a coin toss. One
// padding utility per rendered card, chosen by the row, and the question never
// arises. (Radius stays `rounded-md`: the old review card's 16px corner is NOT
// imported, §15.1's 6px default holds for every card on the site.)
// (2) EMPHASIS IS FILL AND BORDER COLOUR, NOT THICKNESS — with exactly one
// owner-decided exception, `framed` (fb-423, pack round 1: "the old website
// had also a thicker border on the review card. I liked that very much"). For
// that row the THICKNESS IS THE SITUATION — the old site's frame around a
// quoted voice, at its own 3px — and the sum rule is what lets it join without
// costing the axis its promise: the extra 2px of border come out of the
// padding, not out of the content box. `emphasized` keeps the flat treatment,
// which is why the old carousel's ring was never imported onto IT: a 3px
// border with `p-6` would have shrunk that card's inner box by 4px against its
// neighbours.
// AND WHAT A TONE DOES NOT DO: it conveys nothing to assistive technology —
// this atom adds no semantics, and fill, border colour and border width are
// all colour and geometry. A section that gives a tone MEANING (a recommended
// tier, a featured review) owes that meaning in TEXT as well — an eyebrow, a
// badge, a word in the heading — because colour may never be the sole
// indicator (§9, SC 1.4.1).
//
// ── `aura` IS A PROP BY OWNER DECISION (fb-378/381): the lavender glow the
// Header pill and the fixed corner discs wear is chosen per card KIND in the
// section that composes it, not per card instance and not by the atom. This
// file therefore NAMES the shared utility, which is the opposite of what
// ui/SpeedDial does — and the difference is geometric, not doctrinal: the
// dial's className lands on a square wrapper around a round bulb, so a shadow
// there would glow a rectangle, and the section feeds it a CSS variable
// instead. A card's className lands on the card itself, so the utility is
// simply worn. tests/unit/aura-token.test.ts's census counts this file as a
// consumer wearing it exactly once — the lookup below is that one wear, and
// prose (stripped before counting) may discuss it freely.
//
// ── `asChild` PUTS THE LOOK ON THE CONSUMER'S OWN ELEMENT (D2, the
// Heading/Button precedent through ui/slot.ts): a team card IS an <article>
// with its own aria-labelledby, a services card IS an <li> inside a real list,
// and a wrapper div between the <ul> and its items would cost the list its
// semantics. The default host is a plain <div>, like ui/Container's — the
// honest element for a box that adds no meaning. There is no `as` prop: the
// tag-generic surface ui/Text's D5 documents (ref variance, unions across
// tags) buys nothing that cloning the consumer's own element does not already
// give.
//
// No 'use client', no hooks, no state, no t() and no message key (§8.1 — the
// children arrive finished): composing a card must not cost a band its
// zero-island contract, and Card.test.tsx's ?raw guard pins the directive's
// absence mechanically because no runtime assertion can see it (§16). Cards
// are not interactive — no hover state, no focus ring, nothing to focus. When
// a whole card must be clickable, the consumer nests a real <a>/<button>
// inside it (§9: semantic HTML first), which brings its own focus-visible
// styling with it.

/** Named SITUATIONS — which look, never which CSS. */
export type CardTone = 'surface' | 'tinted' | 'emphasized' | 'framed';

type CardOwnProps = {
  /** Render the single child element AS the card (Heading/Button precedent, ui/slot.ts):
   *  the child keeps its element, attributes and classes and wears the card's classes.
   *  <Card asChild><article aria-labelledby="t">…</article></Card>
   *  A `ref` meant for the slotted element goes ON the child element — it wins, and the
   *  engine never disallows `ref`; a `ref` on <Card> reaches the clone only when the child
   *  declares none, and it is typed for a <div>, so for an <article>/<li> put it on the
   *  child. */
  asChild?: boolean;
  /** Which look this card sits in. @default 'surface' */
  tone?: CardTone;
  /** The pill's / corner discs' lavender glow on this card — chosen per card KIND in its
   *  section (owner fb-381). @default false */
  aura?: boolean;
};

export type CardProps = CardOwnProps &
  Omit<ComponentProps<'div'>, keyof CardOwnProps>; // React 19: ref is a prop

// THE card surface's geometry — ONE spelling in src/ (fence test). Not exported.
// The PADDING is not here: it rides each tone row, so a rendered card carries exactly one
// `p-*` utility and a thicker frame can compensate its own border (see below).
const cardClasses = '@container flex flex-col gap-3 rounded-md';

// THE SUM RULE: border-width + padding = 25px per side on EVERY row (1 + 24, or 3 + 22 for
// `framed`), so switching tone never moves content and a framed card's text edges still line
// up with its neighbours'. `framed` is the ONE thickness situation (owner fb-423).
const toneClasses: Record<CardTone, string> = {
  surface: 'border border-line-subtle bg-surface p-6',
  tinted: 'border border-transparent bg-page p-6',
  emphasized: 'border border-accent-decorative/40 bg-accent-decorative/10 p-6',
  framed:
    'border-[3px] border-accent-decorative/40 bg-surface p-[calc(1.5rem-2px)]',
};

export function Card({
  asChild = false,
  tone = 'surface',
  aura = false,
  className,
  children,
  ...rest
}: CardProps): ReactElement {
  // §6.8 merge order: the atom's own classes first, the caller's className
  // LAST — the geometry, then the tone row, then the optional glow. A
  // deterministic convention the tests pin, NOT a cascade mechanism (see the
  // className paragraph above: attribute order never decides CSS specificity,
  // which is precisely why the paint and the padding are props).
  const own = cx(
    cardClasses,
    toneClasses[tone],
    aura && 'shadow-aura',
    className,
  );

  if (asChild) {
    // The child element becomes the card. The engine lives in ui/slot.ts
    // (owner decision fb-64) — single-child guard first, child-wins merge,
    // className merged last. NO disallow set, unlike Button's
    // BUTTON_ONLY_PROPS: a <div> has no element-only props, so everything the
    // caller passes is equally meaningful on an <article> or an <li> —
    // including `id`, which a section's aria-labelledby pairs with.
    return slotClone('Card', children, own, rest);
  }

  return (
    <div className={own} {...rest}>
      {children}
    </div>
  );
}
