import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { cx } from '@/lib/cx/cx';
import { BUTTON_ONLY_PROPS, slotClone } from '../slot';

// ui/TextButton — the general-purpose QUIET action: chrome-less, text-first,
// no ground and no border (migrated per the approved dossier
// .claude/section-runs/2026-08-05_22-04_top-bar/atoms/TextButton.md, contract
// fb-125). It absorbs the *pattern* of the old `ui/link` nav variant and the
// old top bar's inline nav anchors; neither shipped as a component here.
// Today's callers go through asChild onto a plain <a href>: the site's own
// pages, built by i18n/href (§15.13), for the Header nav (desktop row + panel
// list, via NavItem), the top bar's dropdown entries (NavSectionEntry) and
// the Footer's links (its phone a tel:, its „Înapoi sus" a #top); a #fragment
// of their own page for the price menu's categories; and OUTSIDE addresses
// for the blog article's share links (sections/ShareLinks) — Facebook's
// sharer, WhatsApp's api.whatsapp.com/send and a mailto:, which lib/share
// builds at build time and which open in the same tab — the privacy policy's
// rule for its links out, applied there, not every link's on this site
// (ShareLinks' THE SAME TAB). Two plain <button>s of the atom's own are the
// exceptions: the phone panel's section rows (NavAccordion, since
// 2026-10-16) and the article's copy control (CopyLinkButton). And since
// 2026-10-15 one caller dresses a <span>: the LABEL of the blog card's
// „Citește mai mult…", inside the card's own <a href>. That link lays a
// layer over the whole card, which a positioned box would keep inside
// itself, and this atom's box is `relative` (its underline is drawn against
// it) — so the atom dresses the label and the card owns the link
// (sections/PostCard's THE LINK). The label wears the whole look and
// underlines on hover — its own, or the whole card's (THE HOVER AREA) — and
// leaves the name, the state and the focus ring to its link (`asChild`'s own
// doc, below). From 2026-10-14 to that day the card's child was an <a> with
// NO href, HTML's placeholder link, no control at all; no caller ships that
// shape now (THE PROMISE, HALF KEPT, below). The atom stays a plain quiet
// button for any later use (fb-111). It is NOT part of an emphasis family
// (fb-126 guardrail): Button keeps its name, and a future bordered look
// would be a new variant on THIS atom, never a rename anywhere.
// The atom NEVER owns navigation. The absorbed old anchors hijacked clicks
// (preventDefault + a JS router) and hardcoded target/rel on every link —
// both are required rewrites: real hrefs live on the child element, and
// target is set by the consumer only where a link is genuinely external.
// §6 contract: label is a slot (children), semantic tokens only, no outer
// margins, parent className merged (§6.8).

/** WHICH INK the label wears AT REST — a named situation, never a colour knob
 *  (ui/Card's `tone` doctrine). */
export type TextButtonTone = 'ink' | 'accent';

/** WHOSE HOVER draws the hover look — `self`, the button's own, or `area`, a
 *  wider area the caller marks with `TEXT_BUTTON_HOVER_AREA` (a named
 *  situation). */
export type TextButtonHoverArea = 'self' | 'area';

/**
 * The class a caller puts on the ANCESTOR whose hover should also draw this
 * button's hover look (`hoverArea="area"`) — Tailwind's NAMED group, so an
 * unrelated `group` higher up (ui/GlyphButton is one) can never trigger it.
 * The blog card's article wears it, so hovering the card underlines its
 * „Citește mai mult…" (owner, 2026-10-14: "on hover of a card the underline
 * from citeste mai mult animation to trigger").
 */
export const TEXT_BUTTON_HOVER_AREA = 'group/text-button-area';

type TextButtonOwnProps = {
  /**
   * Whose hover draws the hover look (the lavender label and the underline,
   * on their own clocks). `self` (the default) is the button's alone; `area`
   * ALSO draws it while the pointer is over an ancestor wearing
   * `TEXT_BUTTON_HOVER_AREA` — any such ancestor, not only the nearest, so
   * areas do not nest — and never on a disabled button (THE HOVER AREA,
   * below). @default 'self'
   */
  hoverArea?: TextButtonHoverArea;
  /**
   * The label's ink AT REST. `ink` (the default, every menu button's) is the
   * body's ink, turning lavender on hover. `accent` wears that hover lavender
   * at rest too, so a hover draws only the underline — the blog card's
   * „Citește mai mult…" (owner, 2026-10-14: "so basivally the top bar button,
   * but always lilla, the lilla from hover"). `active` outranks it: the
   * current page is lavender and underlined whatever the tone. @default 'ink'
   */
  tone?: TextButtonTone;
  /**
   * The current page/selection. Adds `aria-current="page"`, colors the label
   * the underline's own lavender and shows the underline STATICALLY at full
   * width — state is announced, colored and drawn, never conveyed by the
   * animation (§9). Label + underline share ONE colour, exactly like the old
   * top bar's single `accent` (owner, canvas loop 2026-08-06) — and since
   * 2026-10-01 that accent's own lavender, not green (the colour invariant
   * below).
   */
  active?: boolean;
  /**
   * The hover look, HELD — the lavender label and the full underline — for
   * as long as what this button opens stays open
   * (the top bar's dropdowns: the word of the open card, the phone panel's
   * row of the open list). Its caller switches it at run time, so it plays
   * the hover's own two clocks in and out; under reduced motion, at once.
   * VISUAL ONLY: it adds no ARIA — the control that opens the section says
   * so itself (`aria-expanded`). With `active`, it is `active` (THE HELD
   * LOOK, below). @default false
   */
  held?: boolean;
  /**
   * Render no <button> of TextButton's own — the single child element you
   * nest (an <a href> built by localeHref(), an <a href="#top">, an outside
   * address) BECOMES the control and wears these classes on top of its own.
   * Behaviour props (href, target, onClick…) belong on that child;
   * <button>-only props have no effect — disabled, form*, name and value
   * draw a dev-only console.error, while `type` is absorbed by its default
   * before the merge and dropped silently (slot.ts documents the invariant).
   *
   * A <span> child is a LABEL, never a control: it wears the whole look and
   * has no role and no tab stop — the blog card's „Citește mai mult…", inside
   * the card's own <a href> (sections/PostCard's THE LINK). The link round it
   * is the control, so three things are its caller's: the NAME, the link's
   * own, read off the label by `aria-labelledby` (the card reads the label
   * first and its title after it, SC 2.5.3); the STATE — `active` would set
   * `aria-current="page"` on the <span>, an element no one operates, so a
   * current link says so on itself and leaves `active` off its label; and
   * the FOCUS RING — the atom's answers `:focus-visible`, which this label,
   * never focused, cannot match, so a ring is drawn by the link, round what
   * a press opens. `held`, `tone` and `hoverArea` add no ARIA anywhere: on a
   * label they are paint, which is all a label is. So with a <span> child
   * pass ONLY the look — `tone`, `hoverArea`, `held`, `className`: the types
   * still accept `tabIndex`, `role`, handlers and ARIA beside it, and the
   * slot forwards each onto the span (a `tabIndex` alone would make it
   * focusable and wear the atom's ring), which no caller does.
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
//   · label color  ink → accent, 200ms ease-out (the `ink` tone; an `accent`
//                  label wears the lavender already — THE TONE, below)
//   · underline    scale-x 0 → 1 from origin-left, 300ms ease-out
// Two properties, two durations, both ease-out, both switched off under
// motion-reduce (§9) — with the transitions gone every state is still fully
// legible, because each one is a discrete value (a color, a full-width rule).
//
// COLOR INVARIANT — this atom paints with exactly ONE colour: `accent`, the
// lavender, for the hover label, the active label, the `accent` tone's
// resting label (THE TONE, below) AND the 2px underline. The old top bar used
// a single `accent` token for its hover label, its active label and its
// underline (top-bar.tsx:128-130) and the owner confirmed that unity on the
// 2026-08-06 canvas loop; those labels are states a user can hold or that
// simply ARE the rest state, so they owe SC 1.4.3 the full 4.5:1.
// THE ONE COLOUR WAS GREEN until 2026-10-01: cta-hover #006b42 (6.27:1 on
// --page, 6.60:1 on --surface), because fb-125's letter, cta #008854,
// measures 4.29:1 on --page #faf9f7 (FAIL) and 4.52:1 on --surface. Then the
// owner (2026-10-01): "i need them not to be that green. i want them to be
// same color as in old website on the same top bar buttons". The old
// `accent` is the lavender #8377a3 — 4.09:1 on white, 3.89:1 on --page, both
// under the bar, and axe would fail every story that shows a current item —
// so the atom wears the `accent` ROLE instead: that lavender's hue and
// chroma, its lightness lowered to the lightest step that passes on THE
// GLASS FLOOR. Every ground the atom sits on today is white or nearly — the
// Footer, the price menu's card, the top bar's dropdown card and the blog
// card on bg-surface, the blog article's share row on --page, the pill and
// the phone panel (its rows and its section lists) at bg-surface/95;
// tests/unit/accent-census.test.ts's RENDERERS keeps the whole list, every
// file beside its ground — but "nearly" is 95% white over whatever
// is behind the glass, and with the menu open that is the scrim-dimmed page:
// axe measured the panel at #f8f8f8, and over a dark photograph it goes
// down to 95% white over black, #f2f2f2. So #746894 = 4.52:1 on #f2f2f2,
// 4.76:1 on #f8f8f8, 4.81:1 on --page, 5.06:1 on --surface; as the underline
// (non-text, SC 1.4.11's 3:1) it clears with room. Never on the 30% lilac
// tint, where the role reads 3.32:1 (its charter in globals.css;
// tests/unit/accent-census.test.ts names every wearer with its ground and
// measures the value on each).
//
// THE TONE (owner, 2026-10-14, on the blog card's read-more: "that is just
// text with 3 dots at the end whhich when hovered gets underlined, so
// basivally the top bar button, but always lilla, the lilla from hover"):
// `tone` names the ink the label wears AT REST — `ink`, the default and every
// menu button's, or `accent`, the hover's lavender held at rest — so in the
// `accent` tone a hover changes one thing: the underline still sweeps in from
// the left on its 300ms clock, exactly as on a menu button. A prop, never a
// className (§6.8: a parent positions the atom, it never restyles it): a
// caller's text-accent would land in one class list beside the rest row's
// text-ink, and the generated sheet's order — not the list's — would pick the
// label's colour (the either/or below exists to prevent exactly that).
// `active` outranks it: the current page is lavender and underlined whatever
// the tone. And it is NOT a second colour: the resting `accent` label is the
// very ink the hover and active labels already wear — 5.06:1 on white,
// 4.81:1 on --page — so the COLOR INVARIANT's ONE colour holds; the tone adds
// a state that wears it. It is for STANDALONE controls only — a read-more on
// a line of its own, never a link inside a sentence: with no underline at
// rest only the hue would tell it from the words around it, and `--accent`
// reads 2.93:1 against `--ink`, under the 3:1 WCAG's technique G183 asks of a
// colour-only difference (SC 1.4.1; TextButton.test.tsx measures it).
//
// THE HOVER AREA (owner, 2026-10-14, on the blog page: "i also want on hover
// of a card the underline from citeste mai mult animation to trigger"):
// `hoverArea="area"` draws the hover look — the label's lavender (the `ink`
// tone's change; an `accent` label wears it already) and the underline's
// sweep — ALSO while the pointer is over an ancestor wearing
// `TEXT_BUTTON_HOVER_AREA`. The blog card's article wears it, so a pointer
// anywhere on the card underlines its read-more; the element's own hover —
// on the card, its label's — still draws it too. The caller writes both
// halves and neither acts alone: the class leaves a `self` button inside the
// area quiet, and the prop with no area round it is its own hover alone.
// The value names the situation — a marked area — never the Tailwind
// mechanism under it. A NAMED group (`group/text-button-area`, exported so
// no caller spells it), because Tailwind's plain `group` is a marker other
// components wear for hovers of their own — ui/GlyphButton's disc,
// ui/SpeedDial, the map band's contact rows — and an unnamed `group-hover:`
// here would light the button under any of them. A `:hover` reaches every
// ancestor of the pointer, so ANY hovered ancestor wearing the class draws
// it, not only the nearest: areas do not nest — one per card. A DISABLED
// button stays quiet: its own `:hover` never
// matches (`disabled:pointer-events-none`), but its ancestor's still does,
// and a hovered area lit a disabled button (the React review, measured) — so
// each half of the pair asks `not-disabled:` before it lights. Never
// `enabled:`, which neither an <a> nor a <span> ever matches — the area's one
// caller today dresses a <span>, the blog card's label — and neither is ever
// disabled, so `not-disabled:` always lets it light.
// (TextButton.test.tsx's THE HOVER AREA measures each of these with a real
// pointer.)
// `self`, the default, adds NOTHING — the empty answer, which cx drops — so
// every menu button's class string is the one it always wore, byte for byte.
// The area row is the two END values alone, no transition, duration or
// easing of its own: the area's hover runs on the two clocks above, 200ms
// for the label and 300ms for the underline, and the same two
// `motion-reduce` resets switch both off — under reduced motion a hovered
// card draws the state at once. Like the base row's hover pair, the area
// pair outranks every rest value on specificity (the `:hover` inside the
// `:is()` the variant compiles to), and like it, it compiles under
// `@media (hover: hover)`: a touch screen draws neither.
// THE PRECONDITION: an area must BE its control's hit area. A hover look is
// a promise of what a press THERE does, so an area wider than the control it
// lights would underline presses that open nothing. The blog card keeps it
// by construction, all but its four corners: its one link lays an empty
// layer over the whole card (sections/PostCard's THE LINK), so every point
// of the <article> that wears the class is a point of that link — but for a
// spot at each corner, where the layer's rounded corner leaves the article's
// square one lit and opening nothing (THE LINK measures them, about 55–61
// px² each, and names the lever). A caller with no such layer marks the link
// itself (the AsLinkLabel story). HoverEndArea, the story, shows the
// mechanism on a
// SIMPLER teaser whose summary is no link — its note says so.
// THE PROMISE, HALF KEPT (the a11y review's L1, 2026-10-14; re-read
// 2026-10-17). Until 2026-10-15 the card's hover underlined an <a> with no
// href — HTML's placeholder link, no link at all — a hover that promised a
// destination the card could not give. That day the card became ONE link
// (sections/PostCard's THE LINK), so a press anywhere on it now opens the
// page its `href` names. But WHICH page is the populator's, and it is not
// always the post's: app/[locale]/blog/populate.ts asks lib/blog-article's
// `articleSlugFor` for every card, which answers the post's own article
// where one is registered and THE STAND-IN, „Cum îți alegi periuța de
// dinți", for every other post — the owner's interim, verbatim (2026-10-15):
// "for now it should be a dummy article and all should point to same
// article" (BACKLOG.md entry 7). So the record is CLOSED for the one post
// whose article exists — its card opens it — and OPEN for the other eleven
// of the twelve: each of their links is named „Citește mai mult… <its own
// title>" and opens another post's article. The purpose a link announces and
// the page it opens differ — the SC 2.4.4 mismatch, the owner's recorded
// interim, not this atom's to mend. It closes card by card as each post
// gains its article: `articleSlugFor` then answers the post's own slug, with
// no edit here or in the card.
//
// THE HELD LOOK (owner, 2026-10-16, on the top bar's dropdowns: "if a
// dropdown is being clicked or hovered it has to light up lilla and trigger
// animation and leave it on until card or section unfocus or change. so also
// while button triggered cards is open, button must behave as if focused"):
// `held` wears the hover's END values while what the button opens stays open
// — the pointer may have left the word for the card long ago. It IS
// `active`'s row, `activeClasses` below — the lavender label and the full rule —
// without `active`'s aria-current: the look of a selection, nothing said. The
// difference is time. `active` is there on first paint and never animates in
// (§9: state is never told by motion); `held` is switched on and off by its
// caller at run time, so the two clocks above play — the label over 200ms,
// the rule's sweep over 300ms, and the way back when it lets go — exactly as
// a hover does, and the same two `motion-reduce` resets make both instant.
// The state itself is the caller's to announce, on the control that opens
// the section (`aria-expanded`): the phone panel's row is that button; on the
// bar, the word is a link and its ⌄ beside it is. `active` and `held`
// together are `active`.
//
// The underline is a PSEUDO-ELEMENT, not a nested <span>, because asChild
// leaves no element of TextButton's own in the DOM — the whole look has to
// travel as classes on the caller's child element. RECORDED, not changed
// (the a11y review's L2; §15.20 round 4 noted it first — older than the tone
// and the area, a lane of its own): the rule is a BACKGROUND, and forced
// colours repaint every background and every label in the system's own
// colours — MEASURED in Chromium with forced colours emulated, the rule is
// still drawn but in Canvas, the page's own colour, and the label in the
// system's text colour, so the current page keeps only its aria-current and
// a hover changes nothing on screen.
// The transition list is exactly `color`, never `transition-colors`: that
// shorthand also covers outline-color and would drag the focus ring onto the
// clock.
//
// BOX — text-first, so there is no width anywhere (§8.4: DE runs +30–35%
// longer and must wrap, never clip) and no outer margin (§6.4: the parent's
// gap owns the nav row's spacing). min-h-11 (2.75rem/44px) clears the §9
// target floor even if a parent shrinks the font, and, rem-based, follows
// zoom (§7) — WHEREVER THE THEME'S PIXEL HOLDS. Inside a `design-scale`
// remap the step is 44 of the remap's DESIGN pixels instead. In THE BAND
// SCALE (§15.32) the blog article's share row (sections/ShareLinks, in
// sections/PostPage's band, which has no floor) never falls under 35.6 CSS
// px — 896/1106 × 44, the regime's narrowest column, about a 1140 window
// behind a classic scrollbar: over SC 2.5.8's 24px, under §9's 44 aim, and
// only for a mouse or a trackpad. The price menu's band floors its pixel at
// the theme's (ui/Container's THE FLOOR), so its links never fall under 44.
// And in the Home carousel's 65 % miniature (sections/BlogCarousel) the blog
// card's label box is 0.65 of its length — 28.6px in the theme's pixel, and
// never less, that band's own floor holding it there — but no target: the
// target is the whole card, its link's layer over it (sections/PostCard's
// THE LINK). The same holds for that label on the blog LIST, whose band has
// no floor: its box falls to 35.6px at a 1140 window, and it is no target
// there either. py-2 keeps that height honest when a label wraps to two lines,
// and it is also the underline's breathing room, since after:bottom-0 pins
// the rule to the bottom of the padded box. px-2 lets the full-bleed rule
// overhang the label by 8px a side — enough to read as deliberate, little
// enough that it still tracks the word.
// `hyphens-none` — INTERACTIVE LABELS NEVER SYLLABLE-SPLIT (owner, 2026-09-04:
// "no split in syllables in top bar menu items"). The site ships
// `hyphens: auto` at the body tier (§15.14) so German compounds may break
// mid-word in PROSE; a nav item's label is not prose, and "Leistun-gen" across
// two lines in the bar reads as a rendering fault. This class opts the whole
// control back out. Wrapping BETWEEN words is untouched — `min-h-11` plus
// `py-2` above exist so a wrapped two-line label still has an honest height
// (§8.4). KEEP-IN-SYNC with ui/Button, which carries the same class for the
// same owner rule.
// THE CORNER (owner 2026-10-01, §15.29: "that rounded corner effect that the
// doctor card from old webpage has … implemented in all mentioned parts" —
// the TEXT buttons among them): the box wears `rounded-soft`, the ONE token
// (1rem, globals.css) the personnel card, the Header pill and the contact
// dialog wear. A chrome-less control has no ground and no border to round, so
// today the corner shows on exactly one thing — the focus ring, which follows
// `border-radius` in every current engine — and it is what any future ground
// (fb-126's "bordered look would be a new variant on THIS atom") inherits.
// The underline pseudo-element is a straight 2px rule pinned to the box's
// bottom edge; nothing clips it to the corner (no overflow-hidden here). ONE
// `rounded-*` on the box and never a second (ui/Card's own rule: two of one
// property would leave the stylesheet's order to pick the corner).
const base =
  'relative inline-flex min-h-11 items-center justify-center rounded-soft ' +
  'px-2 py-2 text-lg font-medium hyphens-none ' +
  'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'transition-[color] duration-200 ease-out hover:text-accent ' +
  'motion-reduce:transition-none ' +
  'after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 ' +
  "after:h-0.5 after:origin-left after:bg-accent after:content-[''] " +
  'after:transition-transform after:duration-300 after:ease-out ' +
  'hover:after:scale-x-100 motion-reduce:after:transition-none';

// Kept out of `base` as an either/or — the active row, or the tone's REST
// row, one of them per render — so two same-property utilities never sit in
// one class list fighting over cascade order: for the underline's scale AND
// for the label color, hover:text-accent / hover:after:scale-x-100 — and THE
// HOVER AREA's pair beside them — outrank every rest value on specificity (a
// :hover pseudo-class), which is a rule of CSS — the ordering of two
// same-specificity utilities in the generated sheet is not.
const activeClasses = 'text-accent after:scale-x-100';
// The `ink` rest row is the string every menu button has always worn
// (TextButton.test.tsx pins the whole class string, byte for byte) — and the
// answer for a tone past the types (restingClasses, below).
const inkRest = 'text-ink after:scale-x-0';
const accentRest = 'text-accent after:scale-x-0';

// THE REST ROW per tone, TOTAL over `TextButtonTone` and failing CLOSED
// (ui/Card's `glowClasses` pattern): the `never` line stops a third tone
// compiling until it names its ink here, and a tone that escaped the types —
// a Storybook control, an untyped spread — wears the INK row. No row at all
// is the one wrong answer: MEASURED before this guard, such a label took the
// ink of whatever sat above it and the underline, its scale unset, spanned
// the whole box at rest — the current page's mark on a button that is not
// current. Not exported.
function restingClasses(tone: TextButtonTone): string {
  if (tone === 'ink') return inkRest;
  if (tone === 'accent') return accentRest;
  const unclassified: never = tone;
  void unclassified;
  return inkRest;
}

// THE HOVER AREA's pair: the base row's two hover END values under the
// area's named group, each asking `not-disabled:` first. Static string
// literals: Tailwind reads class names from source text.
const areaHover =
  'group-hover/text-button-area:not-disabled:text-accent ' +
  'group-hover/text-button-area:not-disabled:after:scale-x-100';

// THE HOVER AREA's row, total and failing closed like the rest row: nothing
// for `self` (the base row's own `hover:` pair), the pair for `area`, and
// nothing for an area that escaped the types — the button's own hover. Not
// exported.
function hoverAreaClasses(area: TextButtonHoverArea): string {
  if (area === 'self') return '';
  if (area === 'area') return areaHover;
  const unclassified: never = area;
  void unclassified;
  return '';
}

export function TextButton({
  active = false,
  held = false,
  hoverArea = 'self',
  tone = 'ink',
  asChild = false,
  className,
  children,
  type = 'button',
  'aria-current': ariaCurrent,
  ...rest
}: TextButtonProps): ReactElement {
  const ownClasses = cx(
    base,
    // THE HELD LOOK is the active row, aria-current aside (below).
    active || held ? activeClasses : restingClasses(tone),
    hoverAreaClasses(hoverArea),
    className,
  );

  // `active` is sugar for the ARIA state, so an explicitly passed
  // aria-current still wins (§6.8 native-element fidelity): a caller marking a
  // step/location keeps their word, and nothing but this attribute leaks —
  // `active`, `held`, `tone`, `hoverArea` and `asChild` themselves never
  // reach the DOM. `held` says nothing at all.
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
