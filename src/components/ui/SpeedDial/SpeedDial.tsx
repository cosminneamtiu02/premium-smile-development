'use client';

import {
  type ComponentPropsWithRef,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  // ALIASED, and it has to be: the DOM's own PointerEvent is still the type of
  // the outside-pointerdown listener further down, and an unaliased import
  // would shadow it — React's synthetic event is not assignable to a document
  // listener, so the shadowing shows up as a type error a page away from its
  // cause.
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import { makeAttachRef } from '../attach-ref';
import { cx } from '@/lib/cx';
import { discBase, discBox } from '../disc';

// ui/SpeedDial — a chooser shaped like a mercury thermometer: one filled disc
// (the BULB) that unfolds a capsule of smaller discs (the STEM) in one of four
// directions. Built to the owner-approved design board
// .claude/plans/language-dial.plan.md (2026-08-27, decisions D1–D17); its first
// consumer is sections/LanguageSwitcher, which fans out the five site locales.
//
// The name is Material's, for exactly this geometry (D14) — with one honest
// caveat: MUI's Speed Dial fans out ACTIONS, this one fans out CHOICES with the
// chosen one sitting in the bulb. That is model C (D1): the current option is
// never a stem disc, so the disc under your finger keeps its identity through
// the animation and the bulb is always the toggle ("tap it again" = close,
// nothing happens). One rider since hover-open: if HOVERING opened it, the
// first POINTER click on the bulb claims the dial instead of closing it — the
// aimer who rested on the target gets the dial they were reaching for — and
// the second click closes it. A key press never claims; Enter closes at once.
//
// DUMB BY CONSTRUCTION (§6.1, D2): it knows its props and nothing else — not
// that these are languages, not what a URL means, not that a cookie exists. An
// option carries its own outcome: an `href` makes the disc an <a> and the
// BROWSER navigates (§15.13 — no client-side routing anywhere on this site);
// no `href` makes it a <button> whose whole outcome is `onSelect(option)`. The
// atom never builds, reads or compares a URL, the way <option value="ro"> never
// knows what its value means.
//
// 'use client' because it is INHERENTLY stateful (D13): open/close plus the
// document-level Esc and outside-pointer listeners, and — since 2026-09-04 —
// the two hover timers below. Everything it renders is in the build-time HTML
// either way — the stem is always mounted (D8 = M) and only two attributes
// change on open — so the pre-hydration and post-hydration documents are
// identical (§16.2) and search engines see the alternate-language links on
// every page.
//
// NOT copied from NavMenu, on purpose: the page freeze, the scroll lock and the
// dimming sheet. A five-disc popover blocks nothing, so it takes that file's
// MANNERS (Esc, focus return after the commit, bfcache close) and none of its
// heavy machinery. No portal either: the stem is positioned against the bulb.
// It has since grown one manner NavMenu deliberately does not share — opening
// on hover and closing on hover-away (see the two clocks below).
//
// ── THE ART SLOT (owner, 2026-09-04; board .claude/plans/speed-dial-flags.plan.md,
// treatment tuned live over six rounds on 2026-09-05). An option may carry
// `art`: a decorative ReactNode this atom clips to the circle, covers, hides
// from the a11y tree and dims under an ink scrim so the code stays readable on
// top of it. It is D2 all over again — the atom does not know these are
// COUNTRY FLAGS any more than it knows its options are languages; a section
// hands it a node and the atom dresses it. Four things worth knowing here:
//  · ARTLESS DIALS ARE BYTE-IDENTICAL BY CONSTRUCTION. Every art string is a
//    REPLACEMENT chosen at the render site, never an addition: with no `art`
//    the same class tables are joined in the same order as before this lane and
//    the control's whole content is still one text node. That is what lets the
//    lane's manifest promise sixteen unchanged ui/speeddial baselines, and
//    SpeedDial.test.tsx's "art backgrounds" suite asserts it both ways round.
//  · THE INK RIM IS A HALO, NOT A STROKE. Eight 1px `text-shadow` copies border
//    each glyph from OUTSIDE; a centered `-webkit-text-stroke` eats half its
//    width into the letter body, which is what made rounds 3–5 read "way too
//    thick" and then too thin. Plain inherited properties, every shipping
//    engine, and the owner tunes them by hand — so the fragments are kept
//    obvious rather than clever.
//  · AXE CANNOT AUDIT THIS. Automated contrast checks read a background COLOUR;
//    letters over an image return "incomplete", never a pass or a fail. So the
//    scrim + halo pair is the measured mechanism (white on the FR/IT white
//    bands is the worst case), the visual net freezes the result, and the
//    lane's pack carries the manual note. §9 is met by argument here, not by a
//    green check — and the argument's normative footing is WCAG 2.2's
//    "contrast ratio" glossary note: a NARROW border around the letter is
//    measured as part of the LETTER, which is exactly what the 1px halo is
//    (the pack carries the field-by-field table; site minimum 5.2:1, DE red).
//  · FORCED COLORS YIELD. In forced-colors mode (Windows High Contrast)
//    `text-shadow` computes to `none` while inline-svg fills are deliberately
//    NOT forced — the flag would survive exactly as both halves of the
//    measured pair died. So both decorative layers carry
//    `forced-colors:hidden`: decoration yields, and the codes render in the
//    forced palette on plain ButtonFace — the exact pre-flag WHC picture
//    (G2 a11y MEDIUM, folded 2026-09-05).
//  · IT IS ORTHOGONAL TO HOVER-OPEN. The art layer adds no pointer handler and
//    no state: its hover manner is one CSS `group-hover:` on a scrim, while the
//    two clocks below own opening and closing. Neither can be edited into the
//    other by accident.

// ── PUBLIC CSS VARIABLES — the two knobs a HOST turns through `className`
// (§6.8: placement and sizing are the parent's; the atom never reads the
// screen, §6.5). Each has its fallback baked into every token that reads it,
// so a dial with neither set is exactly the `size` step it declares.
//   --disc-size   the bulb's box; default = the `size` step (2.75rem md ·
//                 3.5rem lg). FloatingActions sets it per screen type on BOTH
//                 corners (D16 · F2); GlyphButton reads the same variable
//                 through ui/disc.ts, so the call CTA and the bulb scale from
//                 one number.
//   --stem-inset  how much of the viewport the extreme-zoom cap must leave
//                 alone (default 1rem): the host's own offset from the edge
//                 plus anything that must stay clear (safe area, the Header
//                 pill's reach). The atom adds half a bulb, because the stem
//                 is anchored at the bulb's CENTRE. Read by the cap tokens in
//                 the `direction` rows.

export type SpeedDialDirection = 'up' | 'down' | 'left' | 'right';
export type SpeedDialSize = 'md' | 'lg';
/** NAMED bundles, never a free colour (the GlyphButton rule): each member is a measured pair. */
export type SpeedDialTone = 'ink' | 'cta';

export interface SpeedDialOption<V extends string = string> {
  /**
   * THE UNIQUE IDENTIFIER — 'ro', 'en', … Never printed; it is what `value` is
   * compared against and what the parent gets handed back. Named `value`, not
   * `id`, because that is the word HTML itself uses for an option's identity
   * (<option value="ro">) and `id` on a React prop reads as a DOM id.
   */
  value: V;
  /**
   * The 1–3 letters printed INSIDE the disc, already in final form ('RO', not
   * 'ro'): the DOM text must equal the visible text (fb-133 — no CSS uppercase,
   * so what a voice-control user says is what the DOM contains).
   */
  code: string;
  /**
   * REQUIRED — the disc shows an abbreviation, so its spoken name comes from
   * here (§6.3): the endonym for a language ('Română'). Becomes aria-label.
   * It must CONTAIN `code` (SC 2.5.3 Label in Name — a voice-control user who
   * reads "RO" and says "click RO" has to hit this disc); a dev-only tripwire
   * names any option where it does not.
   */
  label: string;
  /**
   * The disc's OUTCOME, carried by the data (D2 = B′). Present → the disc is an
   * <a href> and the browser goes there on click (the FINAL href — locale
   * prefix, trailing slash and base path already in it, built by localeHref()
   * in the section). Absent → the disc is a <button type="button"> and
   * `onSelect` is the only thing that happens.
   */
  href?: string;
  /**
   * BCP-47 tag of the label's OWN language → `lang` (and `hreflang` on an
   * anchor), so a screen reader switches voice to say "Français" in French.
   * Optional: a non-language use of the dial simply omits it.
   */
  lang?: string;
  /**
   * Decorative ART behind this disc's letters — the atom clips it to the
   * circle, covers the box (the svg's own preserveAspectRatio does the
   * cropping), hides it from the a11y tree, and dims it under an ink scrim so
   * the code stays legible. The atom never interprets it (D2: it has never
   * heard of flags, either).
   *
   * `undefined` — and ONLY `undefined` — means artless. The type legally
   * admits null/false/'', and any of those is a PRESENT (empty) artwork that
   * takes the full art dressing; `hasArt` below is the one predicate every
   * decision site reads, so content shape and dressing can never split.
   */
  art?: ReactNode;
}

type SpeedDialOwnProps<V extends string> = {
  /** Every option in the order they unfold — the current one INCLUDED (it is filtered into the bulb). */
  options: readonly SpeedDialOption<V>[];
  /**
   * The current option's value: it lives in the bulb and is never a link, and
   * it must match one of `options`.
   *
   * `NoInfer` is what makes that a COMPILE error rather than a shrug: without
   * it `value` is itself an inference site, so `value="rp"` simply widens V to
   * include 'rp' and the typo compiles. The one trade-off, spelled out because
   * it looks like a bug when it bites: with an inline, non-`as const` `options`
   * literal AND a plainly-`string`-typed `value`, V now resolves from `options`
   * alone and the assignment errors. Type that call site's data as
   * `SpeedDialOption[]` (V = string) and it passes again.
   */
  value: NoInfer<V>;
  /**
   * REQUIRED — the bulb's spoken name (§6.3), STATE-INVARIANT (the burger rule:
   * never "Deschide/Închide" swapping; aria-expanded already tells the state).
   * Already translated, and it must START with the current option's label so
   * the visible code is contained in it (SC 2.5.3): 'Română · schimbă limba'.
   * The types cannot check that, but the atom DOES, in dev: a tripwire names
   * the bulb whose spoken name omits its own code. tests/unit/locales.test.ts
   * pins the shipped Romanian data the section builds that name from.
   */
  'aria-label': string;
  /**
   * Which way the stem unfolds from the bulb. Each direction's extreme-zoom
   * cap reads `--stem-inset` (public CSS variables, above). @default 'up'
   */
  direction?: SpeedDialDirection;
  /**
   * The BULB's box: md 2.75rem/44px · lg 3.5rem/56px. The stem's discs are one
   * step smaller — md → 2rem/32px · lg → 2.75rem/44px — and the stem tube is
   * the bulb minus 2px, `inset-x-px` a side (D12's mercury thermometer; the
   * board's 0.25rem became 2px so every disc's 2px-offset focus ring fits
   * inside the tube, which clips at its padding box — G2).
   *
   * (D16 · F2) The step is the FALLBACK of one CSS variable, `--disc-size`,
   * that a HOST may set per screen type through className — FloatingActions
   * will, on BOTH corners, so the call CTA and this bulb scale together. The
   * atom itself never reads the screen: same look everywhere, the size is the
   * host's placement decision.
   *
   * The second host variable, `--stem-inset`, belongs to the zoom cap, not to
   * the size — see the public CSS variables block above. Only the host knows
   * its number: Lane B passes the corner's bottom offset + the safe area + the
   * Header pill's reach.
   * @default 'md'
   */
  size?: SpeedDialSize;
  /**
   * The colour the BULB is filled with — "chosen": ink = inverse-surface /
   * ink-strong · cta = the locked green pair. It stops at the bulb: since the
   * owner's 2026-08-27 Storybook review the stem discs wear GlyphButton's
   * ghost manner in every tone (see the disc classes below), so a dial's tone
   * changes one disc, not five. @default 'ink'
   */
  tone?: SpeedDialTone;
  /**
   * Fires with the WHOLE picked option — value, code, label, href — from the
   * disc's onClick, BEFORE the browser follows the href, with the default NOT
   * prevented. The place for a side effect (the section writes its cookie
   * here). For an href-less disc it is the ONLY outcome. Never fires for the
   * bulb: tapping that only closes.
   *
   * The click EVENT rides along as a second argument because a modified click
   * is a different act: ctrl/cmd/shift/middle opens the option in a NEW tab or
   * window, alt saves it — in every case this document stays exactly as it was,
   * so a side effect that assumes "we are leaving" would be wrong. The section
   * skips its cookie write on `event.metaKey || event.ctrlKey ||
   * event.shiftKey || event.altKey`. Additive: a handler that ignores the
   * argument is unaffected.
   */
  onSelect?: (
    option: SpeedDialOption<V>,
    event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  ) => void;
  /** Reports every open/close flip. The atom OWNS the state (uncontrolled, D13). */
  onOpenChange?: (open: boolean) => void;
};

export type SpeedDialProps<V extends string = string> = SpeedDialOwnProps<V> &
  Omit<ComponentPropsWithRef<'div'>, keyof SpeedDialOwnProps<V> | 'children'>;

// THE ROOT carries no position utility of its own, on purpose. Tailwind emits
// `.relative` AFTER `.fixed`, so an atom-owned `relative` here would silently
// defeat the host's `fixed … left-4 z-40` — which is exactly what the corner
// passes through className (§6.8). The inner box is the positioning scope
// instead, and `--bulb` / `--disc` are set here so every box below derives from
// one number (D16 · F2: `--disc-size` is the PUBLIC override, the step its
// fallback).
const rootSize: Record<SpeedDialSize, string> = {
  md: '[--bulb:var(--disc-size,2.75rem)] [--disc:calc(var(--bulb)*8/11)]', // 44 → 32
  lg: '[--bulb:var(--disc-size,3.5rem)] [--disc:calc(var(--bulb)*11/14)]', // 56 → 44
};

// The two exact fractions above are D12's "one step smaller" written as
// arithmetic: 2.75rem × 8/11 = 2rem (32px) and 3.5rem × 11/14 = 2.75rem (44px).
// The board's "× 0.786" was the lg-derived approximation of the same idea; the
// fractions are used because a token that cannot move without changing output
// keeps its exact value. A host override scales both proportionally.

// The letters (D3 = C): real mono text, never a picture of letters (SC 1.4.5).
// The size is derived from the BOX, not from the screen, so a host override
// keeps the same look at every scale: bulb × 2/7 = exactly 1rem at the lg
// fallback (the placeholder pill's text-base, owner-approved), with 0.875rem as
// the floor so the 44px md bulb stays legible. Tailwind infers `font-size` from
// the max() value without a `length:` type hint (verified in the compiled CSS).
const letterClasses =
  'font-mono font-medium tracking-wide leading-none ' +
  'text-[max(0.875rem,calc(var(--bulb)*2/7))]';

// ── THE ART BUNDLES. Three strings that only ever ship together, and the first
// thing to know is what they are NOT: they never JOIN `letterClasses`, they
// REPLACE it. Two font-weight utilities (or two font-size, or two colour) on
// one element are decided by the STYLESHEET's emission order, not by the order
// they were written in the class attribute — so "override the shared letters"
// would be a look nobody in this file could predict or fix. Every art string is
// therefore chosen at the render site, which is also what keeps an artless dial
// byte-identical (see the header).
//
// The values are the owner's, walked live on 2026-09-05 and frozen in
// src/assets/flags/Flags.stories.tsx (the TreatmentPreview story is the
// approved picture; these are the same fragments): weight 640 on JetBrains
// Mono's variable wght axis (round 5's 800 ceiling × 0.8 — "20% thinner
// again"), one size step above the artless 2/7 arithmetic, white letters on
// every flag and in every tone, and the ink rim drawn as an 8-way 1px halo.
const artLetterClasses =
  'font-mono font-[640] tracking-wide leading-none ' +
  'text-[max(1rem,calc(var(--bulb)*9/28))] text-ink-inverse ' +
  '[text-shadow:1px_0_var(--color-ink),-1px_0_var(--color-ink),' +
  '0_1px_var(--color-ink),0_-1px_var(--color-ink),1px_1px_var(--color-ink),' +
  '1px_-1px_var(--color-ink),-1px_1px_var(--color-ink),' +
  '-1px_-1px_var(--color-ink)]';

// The art itself: absolutely positioned over the whole control, round, and
// clipping whatever it was handed. The CIRCLE is what crops the flag, so a
// consumer's 3:2 rectangle needs no cropping of its own — `[&_svg]:size-full`
// stretches the node to the box and the svg's own `preserveAspectRatio` slice
// covers it. `overflow-hidden` lives HERE and never on the control: the focus
// ring is drawn outside the box and must stay unclipped (SC 2.4.7).
// `forced-colors:hidden` on BOTH decorative layers — see the header's FORCED
// COLORS YIELD bullet; the utility compiles to a media-query rule the visual
// runner never activates, so no baseline can move.
const artLayerClasses =
  'absolute inset-0 overflow-hidden rounded-full [&_svg]:size-full ' +
  'forced-colors:hidden';

// The scrim — a whisper of ink over the art (owner: "they are too dark … still
// lighter", /35 → /15 → /5), deepening on hover and press. That deepening IS a
// flagged disc's hover manner: the ghost tray and the tone fill underneath are
// still in the class list, simply covered by an opaque flag, and nothing here
// strips them. The clock is `--fade`, which discBase sets on the CONTROL and
// custom properties inherit down to this child, so a flagged disc fades on
// exactly the system clock every other disc uses.
// `rounded-full` is NOT decoration — it is the scrim's OWN clip. The art layer
// clips itself; this sibling span does not inherit that, and without a radius
// its tint painted the control's square padding box: faint dark CORNERS
// outside the circle, deepening on hover ("that black square is like
// incastrating the circle … i do not want to see it", owner 2026-09-05 — the
// board fragment omitted the radius and the preview masked it, because the
// preview's wrapper clipped everything round; the atom's control deliberately
// clips nothing, SC 2.4.7).
const artScrimClasses =
  'absolute inset-0 rounded-full bg-ink/5 transition-[background-color] ' +
  'duration-(--fade) ease-in-out ' +
  'group-hover:bg-ink/20 group-active:bg-ink/20 ' +
  'motion-reduce:transition-none forced-colors:hidden';

// THE BULB'S scrim is the same whisper, STATIC (owner round 12, 2026-09-05:
// "ro should not get darker on hover, but the other ones yes"): a stem disc
// is a CHOICE, so its deepen is the invitation; the bulb is the language you
// are already reading — not a choice, no invitation. No transition either:
// nothing about it ever changes, so it needs no clock.
const artBulbScrimClasses =
  'absolute inset-0 rounded-full bg-ink/5 forced-colors:hidden';

/**
 * What sits INSIDE a disc, bulb and stem alike — one function so the two can
 * never drift apart.
 *
 * With no art it returns the bare code: the same single text node this atom has
 * always rendered, which is the DOM half of the byte-identical promise. With
 * art it stacks three spans, and the third is why the code stays on top without
 * a single z-index: the two decorative layers are `absolute` (positioned,
 * z-index auto) and the text is `relative` (positioned too) and LAST in DOM
 * order, so paint order alone puts it above.
 *
 * `scrimDeepens` is the round-12 split: the STEM discs pass true (their scrim
 * answers hover/press), the BULB passes false (static scrim — the current
 * language gives no hover invitation). The selector lives HERE so the two
 * call sites cannot drift.
 */
/**
 * THE one artless test (G2 ts LOW, 2026-09-05): `undefined` is the sentinel —
 * see the `art` field's doc. Every decision site (content here, the bulb
 * letter ternary, both disc class ternaries) reads THIS predicate, so a
 * future edit cannot split content shape from dressing.
 */
const hasArt = (art: ReactNode): boolean => art !== undefined;

function discContent(
  code: string,
  art: ReactNode,
  scrimDeepens: boolean,
): ReactNode {
  if (!hasArt(art)) return code;
  return (
    <>
      <span aria-hidden="true" className={artLayerClasses}>
        {art}
      </span>
      <span
        aria-hidden="true"
        className={scrimDeepens ? artScrimClasses : artBulbScrimClasses}
      />
      <span className="relative">{code}</span>
    </>
  );
}

// THIS atom's transition list — never `transition-colors` (that shorthand
// covers outline-color and would drag the focus ring onto the fade clock) and
// never `transition-all`. Exactly two properties, and deliberately the SAME two
// GlyphButton fades, character for character: since the owner reversed D5 (see
// the disc classes below) both atoms animate one ground and one text colour, so
// a ghost disc beside a ghost glyph button reads as one system with one fade.
// It stays SpeedDial's OWN constant rather than moving into ui/disc.ts — the
// KEEP-IN-SYNC convention Button and GlyphButton already use for --fade
// (fb-44): two independent files that agree on purpose, so changing the
// system's feel is a deliberate multi-file edit and never a drift. The clock,
// the easing, the press snap and the reduced-motion escape hatch all come from
// discBase.
const discTransition = 'transition-[background-color,color]';

// EVERY stem disc, in every tone (D5, REVERSED by the owner at the Storybook
// review on 2026-08-27: "i do not like the new animation … drop it and use just
// old on hover" → "replace it with ghost glyph but with a border").
//
// What the board had (D5 = S, fb-271) was a "partially selected" creep: an
// inset box-shadow whose blur grew from zero so the tone crept in from the disc
// edge on hover, reading as 0% → on its way → 100% (the filled bulb). What
// ships instead is GlyphButton's GHOST bundle plus a resting ring: transparent
// at rest with a thin `border-line` outline, and on hover/press the quiet tray
// the rest of the system already uses.
//
//  · the tray is `bg-line-subtle`, NEVER `bg-raised` — --raised is #ffffff,
//    i.e. an invisible tray on a white surface (GlyphButton's ghost carries the
//    same constraint, and Button.tsx the contrast record). ink over #e9e6e2 =
//    11.9:1;
//  · the border stays `border-line` in EVERY state: nothing recolours on hover,
//    so the ring reads as the outline of the box and not as a second signal;
//  · keyboard focus shows discBase's outline ring and nothing else — exact
//    parity with GlyphButton ghost, which is the point of the reversal;
//  · rest is TRANSPARENT, so the ground under a disc belongs to its parent —
//    here the stem's own 95% surface (struck and restored 2026-09-05, see
//    stemBase). Light grounds only: ghost's standing caveat, inherited with
//    the bundle.
//
// Hover therefore reads as "ready" and chosen stays the filled bulb: still two
// clearly different looks (tray vs fill), just not a progression any more.
//
// SPLIT IN THREE, and the split is the only thing the art lane changed here:
// `text-ink` is the ONE token a flagged disc must not merely cover but replace
// (white letters and ink letters cannot both be declared and left to the
// cascade — see the art bundles above), so the ground and the tray are named
// around it. `discRest` below is the same string it always was, character for
// character; the pieces exist so the flagged path can rebuild it minus one
// token instead of fighting it.
const discRestGround =
  'size-(--disc) rounded-full border border-line bg-transparent';
const discRestTray = 'hover:bg-line-subtle active:bg-line-subtle';

const discRest = `${discRestGround} text-ink ${discRestTray}`;

// Nothing in a disc's clothes depends on props any more — the tone stops at the
// bulb — so the whole string is built once, at module scope, like every other
// class table in this file.
const discClasses = cx(discBase, discRest, letterClasses, discTransition);

// …and its flagged twin, chosen per option at the render site. `group` is the
// marker the scrim's `group-hover:` reads (GlyphButton's precedent: a marker
// class emits no CSS of its own, so it is free at rest) and `relative` is the
// scope both layers are absolute against — the bulb already carries one.
const artDiscClasses = cx(
  discBase,
  'group relative',
  discRestGround,
  discRestTray,
  artLetterClasses,
  discTransition,
);

// The stem, minus its direction. `absolute` inside the isolated inner box with
// `-z-10` so the tube's round start end hides BEHIND the bulb (fb-262); the
// bulb is `relative z-10` and paints over it. Chrome copied from NavMenu's
// panel: full border, 95% surface, static blur — STRUCK and RESTORED within
// one day (2026-09-05): the owner's "translucent square" complaint was
// misread as this capsule and the chrome came off, but the real square was
// the SCRIM's missing circle clip (see artScrimClasses); on seeing the discs
// float free the owner corrected it — "the container of the round flag
// buttons is [gone] too … there was just a translucid black flag" — and the
// capsule chrome is back verbatim, the scrim clip kept.
// `items-center` centres the discs across the tube — exact at both steps
// (54 tube − 2 border − 8 padding = 44 = the lg disc) and still right when a
// host override makes the tube wider than the disc it derives.
// Both clip-path states live in the direction table below, never here: two
// unvariant `[clip-path:…]` utilities on one element would fight over emission
// order instead of over state.
//
// `inert:invisible` is the BELT to `inert`'s braces (SC 4.1.2 / 2.4.7). The
// stencil hides the closed stem from sight and `inert` kills it for the
// keyboard and for screen readers — but only in an engine that IMPLEMENTS
// `inert` (2022+). On the older cohort globals.css already writes rules for,
// `inert` is an unknown attribute: the discs would be invisible-but-tabbable,
// which parks a focus ring on nothing. Tailwind's `inert:` variant is a plain
// ATTRIBUTE selector, so this rule applies in those engines too, and
// `visibility: hidden` is the one property that removes an element from the
// tab order without unmounting it. Its timing is the classic "delay the hide"
// idiom: `visibility` is in the transition list with a ZERO duration, so on
// open it flips to visible in the very recalc that removes `inert` (a keyboard
// user — or a play function — can Tab into the discs at once), and the INERT
// state adds a 300ms transition-DELAY to it, so on close the discs stay
// visible until the clip-path sweep has finished and go dead at 300ms. Two
// rejected shapes, both probed (G2 follow-ups): a symmetric 300ms visibility
// transition starts the OPENING at progress 0 = hidden, and a Tab in that
// first frame skips every disc; and letting the `inert:` variant set the
// transition PROPERTY list compiles to a (0,2,0) selector that outranks
// `motion-reduce:transition-none` (0,1,0), so the closing film played for
// visitors who asked for less motion. Here the inert rule sets ONLY the delay,
// which is moot once reduced motion sets the property list to none — the
// escape hatch wins in both states, with no specificity fight to lose.
const stemBase =
  'absolute -z-10 flex items-center gap-1.5 p-1 ' +
  'rounded-full border border-line-subtle bg-surface/95 backdrop-blur-md ' +
  'inert:invisible ' +
  'transition-[clip-path,visibility] [transition-duration:300ms,0s] ease-out ' +
  'inert:[transition-delay:0s,300ms] motion-reduce:transition-none ' +
  // The capsule's own scrollbar (it becomes a scroll container when the
  // extreme-zoom cap below bites) is hidden: a classic bar rendered INSIDE the
  // ~52px tube and squeezed the 44px discs (a11y M2 follow-up, 2026-09-01).
  '[scrollbar-width:none]';

// Direction = position + flow + the closed stencil + the extreme-zoom cap, in
// one row per direction so a fifth direction cannot ship half-dressed.
//
// · the tube starts at the BULB'S CENTRE (`bottom-1/2` and friends) and is
//   inset 1px on the cross axis, so it is the bulb minus 2px — 54 at the lg
//   fallback, 42 at md (D12: a hair narrower than the bulb, the thermometer).
//   NOT the 0.125rem it started as: the cap below makes this element a SCROLL
//   CONTAINER, and a scroll container clips at its PADDING box, so whatever
//   room a disc's focus ring needs has to exist inside the tube. The ring is
//   `outline-offset-2` + `outline-2` = 4px; a 52px padding box around a 44px
//   disc left 3 and shaved the ring on both sides (G2 a11y). 2px wider gives
//   exactly 4 (a computed-style test pins it), and the discs still fit flush:
//   54 − 2 border − 8 padding = 44;
// · the flow puts the first disc NEAREST the bulb, which is also the Tab order
//   and the animation order (D7) — the HTML order never changes and no letter
//   is ever rotated;
// · the start padding clears the bulb's own half plus 0.375rem of air. It
//   overrides `p-1` because Tailwind emits `padding` before `padding-bottom`
//   (pinned by a computed-style test);
// · the closed stencil cuts everything in from the FAR edge, so the reveal
//   sweeps outward FROM the bulb (D9). Both states are four-value insets with
//   `round`, which is what makes them interpolate;
// · the cap is NavMenu's B2 rule, measured from the right edge. The stem hangs
//   off the bulb's CENTRE, not off the viewport, so the space it may occupy is
//   the viewport minus half a bulb minus whatever the HOST keeps clear —
//   `--stem-inset`, default 1rem (see the `size` doc). `100dvh − 1rem` alone
//   overshot by exactly that much and let the top of the scroll box climb past
//   the viewport, where its content cannot be reached at 400% zoom (SC 1.4.10
//   / 2.4.11). There is deliberately NO `overscroll-contain`: on a container
//   that is not overflowing, Chromium still treats it as a scroll boundary and
//   swallows page scroll over the open stem — NavMenu's own cap carries none
//   either. On a column-reverse stem the initial scroll position sits at the
//   flow's start — the bulb's side — so the nearest discs stay visible when the
//   cap does bite. The capsule draws NO scrollbar of its own
//   (`[scrollbar-width:none]` in stemBase): on classic-scrollbar platforms the
//   bar took its ~15px INSIDE the tube and squeezed the discs. Wheel/touch
//   still scroll it, and tabbing between discs scrolls each into view — at
//   400% zoom the keyboard path never needed the bar.
const directionClasses: Record<SpeedDialDirection, string> = {
  up:
    'bottom-1/2 inset-x-px flex-col-reverse pb-[calc(var(--bulb)/2+0.375rem)] ' +
    'peer-aria-expanded:[clip-path:inset(0_0_0_0_round_9999px)] ' +
    '[clip-path:inset(100%_0_0_0_round_9999px)] ' +
    'max-h-[calc(100dvh-var(--bulb)/2-var(--stem-inset,1rem))] overflow-y-auto',
  down:
    'top-1/2 inset-x-px flex-col pt-[calc(var(--bulb)/2+0.375rem)] ' +
    'peer-aria-expanded:[clip-path:inset(0_0_0_0_round_9999px)] ' +
    '[clip-path:inset(0_0_100%_0_round_9999px)] ' +
    'max-h-[calc(100dvh-var(--bulb)/2-var(--stem-inset,1rem))] overflow-y-auto',
  right:
    'left-1/2 inset-y-px flex-row pl-[calc(var(--bulb)/2+0.375rem)] ' +
    'peer-aria-expanded:[clip-path:inset(0_0_0_0_round_9999px)] ' +
    '[clip-path:inset(0_100%_0_0_round_9999px)] ' +
    'max-w-[calc(100dvw-var(--bulb)/2-var(--stem-inset,1rem))] overflow-x-auto',
  left:
    'right-1/2 inset-y-px flex-row-reverse pr-[calc(var(--bulb)/2+0.375rem)] ' +
    'peer-aria-expanded:[clip-path:inset(0_0_0_0_round_9999px)] ' +
    '[clip-path:inset(0_0_0_100%_round_9999px)] ' +
    'max-w-[calc(100dvw-var(--bulb)/2-var(--stem-inset,1rem))] overflow-x-auto',
};

// The stagger (D9), keyed off `inert:` and NOT off the bulb's `peer-*`: the
// <li>s are not the bulb's siblings, but they ARE inside the list that gains
// and loses `inert`, and Tailwind's `inert:` variant is `&:is([inert],[inert] *)`.
// Transition-delay is read from the DESTINATION state, so the reversed formula
// on the inert side makes closing play the film backwards: the farthest disc
// leaves first, the nearest last.
const stemItemClasses =
  'opacity-100 inert:opacity-0 transition-opacity duration-300 ease-out ' +
  'delay-[calc(var(--i)*60ms)] inert:delay-[calc((var(--n)-1-var(--i))*60ms)] ' +
  'motion-reduce:transition-none';

// Named bundles, not free colour props: each rest AND hover pair is measured
// once, so §9 holds by construction and no call site can invent an illegal
// combination. The table dresses the BULB and only the bulb — since the owner's
// reversal of D5 the stem wears one ghost manner whatever the tone, so this is
// a Record of one string rather than a chosen/creep pair.
const toneClasses: Record<SpeedDialTone, string> = {
  // 15.9:1 — reads as STATE ("this is what is set") and leaves green reserved
  // for "do something" (§1's one conversion goal).
  ink: 'bg-inverse-surface text-ink-inverse hover:bg-ink-strong active:bg-ink-strong',
  // The locked green pair, GlyphButton solid's measured values: white over
  // #008854 → #006b42 = 4.52:1 → 6.60:1.
  cta: 'bg-cta text-ink-inverse hover:bg-cta-hover active:bg-cta-hover',
};

// ── THE TWO HOVER CLOCKS (owner request, 2026-09-04: "i want language switcher
// also on hover to open, not just on click"; built to the lane plan
// .claude/plans/speed-dial-hover.plan.md). Timers rather than CSS, because what
// opens the dial is INTENT, and intent is only legible as time.
//
// WHY A DWELL, AND NOT "the pointer arrives, it opens". Every mouse click is
// PRECEDED by the pointer arriving — a pointerenter and a pointermove carrying
// pointerType 'mouse', both the trusted kind Playwright drives over CDP and the
// synthetic kind user-event dispatches before its own click. An arrive-opens
// design would therefore turn every click-to-open into open-then-toggle-CLOSED,
// and take with it the eleven `openPlay` stories, the test suite's `open()`
// helper and the visual runner's `openDisclosure` poll
// (tests/visual/stories.spec.ts). A dwell plus a bulb click that CANCELS both
// timers keeps every click path exactly as it was: nobody clicks a control they
// have been resting on for a sixth of a second.
//
// The leave grace is deliberately the stem sweep's own 300ms — one timing
// family, so the pill is still fading when the grace runs out. It is NOT a
// KEEP-IN-SYNC pair (fb-44): that convention names two FILES that must agree,
// and this number has no twin. It restates a duration that lives in `stemBase`
// a few lines up, in the same file, where a reader can see both at once.
//
// NOT MIRRORED TO NavMenu, and the asymmetry is the decision: the burger opens
// a full-page panel over the document, and a panel that unfolds because a mouse
// crossed it ambushes the reader. Esc and the bfcache close ARE twins across
// those two files; this manner belongs to a five-disc corner popover and to
// nothing else, so there is nothing to keep in sync.
//
// ALWAYS ON, with a named trigger: no opt-out prop ships today because no
// consumer wants one. The first host that must NOT hover-open — a dial in a
// dense toolbar, say — is the moment `hoverOpen={false}` becomes a real prop.
// Not before (§6.2: props are for genuine variants, and a variant with one
// value is a guess).
const HOVER_OPEN_DELAY_MS = 150;
const HOVER_CLOSE_DELAY_MS = 300;

// Dev tripwires fire ONCE PER DISTINCT MESSAGE per session. The once-per-
// session PRECEDENT is NavMenu's `mountContractWarned` — one module-scope
// boolean guarding one tripwire — and this file KEYS the guard by MESSAGE
// instead, an improvement NavMenu's shape never needed: it has a single check,
// while a dial can fail three. A dial that re-renders forty times must not
// print forty identical lines, and two different problems must not silence each
// other — and the second half is precisely what one boolean cannot promise,
// since whichever check fires first mutes the rest for the session.
// (Not the ui/slot.ts convention, whatever this comment used to claim: that
// file's asChild warning has no guard at all and fires on every clone.)
// Never in production: each tripwire EFFECT returns before any string work on
// `process.env.NODE_ENV === 'production'` — Next inlines the constant, so the
// bundler drops the whole block — and this helper's own guard is the belt to
// that.
const warnedMessages = new Set<string>();

function warnOnce(message: string): void {
  if (process.env.NODE_ENV === 'production' || warnedMessages.has(message)) {
    return;
  }
  warnedMessages.add(message);
  console.error(message);
}

export function SpeedDial<V extends string = string>({
  options,
  value,
  'aria-label': ariaLabel,
  direction = 'up',
  size = 'md',
  tone = 'ink',
  onSelect,
  onOpenChange,
  className,
  ref,
  onBlur,
  // CHAINED, never replaced (§6.8, exactly like `onBlur` above): a host that
  // watches its own corner must not lose an event because this atom took the
  // same three props for itself.
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
  ...rest
}: SpeedDialProps<V>): ReactElement {
  // THE TWO-LINE ALGORITHM (D1 = C) — no sorting, no rotation. `options` order
  // is the manifest's, so the stem reads RO-less, EN-less, … whichever is
  // chosen, and after a pick the NEXT document renders with the new value as
  // its bulb. Cheap enough to run every render; memoising it would cost more
  // than it saves on a five-item list.
  const bulb = options.find((option) => option.value === value);
  const stem = options.filter((option) => option.value !== value);

  const listId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const bulbRef = useRef<HTMLButtonElement>(null);

  // Set by close(), consumed by the focus-return effect: it records "this close
  // came from the USER", which is also what tells a real close apart from the
  // first render, where the same effect runs with the dial already closed and
  // must not pull focus onto the bulb.
  const returningFocus = useRef(false);

  // The other half of that question, and new with hover-open: WHERE focus was
  // when the close happened. Captured in close(), honoured in the effect — the
  // argument for it is written at the effect.
  const focusWasInside = useRef(false);

  // ── HOVER STATE. `hoverOpened` is the whole answer to "what may hovering
  // close?": it is set ONLY when the open-timer fires, and cleared on every
  // open→false transition, so HOVER CLOSES ONLY WHAT HOVER OPENED. A
  // click-opened dial therefore keeps exactly today's persistence, in every
  // browser and in every runner — which is not a nicety: the visual runner
  // click-opens each `pin-open` story and then parks its mouse at 0,0
  // (openDisclosure), i.e. a pointerleave over an open dial. Without this flag
  // every open baseline would race the grace against `openPlay`'s trailing
  // `bulb.blur()`, and a focus-only guard would lose that race.
  const hoverOpened = useRef(false);
  // "This pointer visit may still open the dial." Set when the pointer ENTERS,
  // cleared on every open→false transition — so a dial dismissed with Esc, with
  // a bulb tap or by picking a disc stays dismissed while the pointer is still
  // sitting on it, and only a fresh visit can open it again (SC 1.4.13's
  // dismissable half: dismissing must not be undone by the same hover).
  const hoverMayOpen = useRef(false);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);

  // THE COMMITTED STATE, readable the instant it changes. `open` is a render
  // value: between an event that flips it and the render that publishes it,
  // every handler still closes over the OLD boolean — so two acts in the same
  // instant (a leave racing the dwell's commit; the pre-existing Esc landing
  // with an outside pointerdown) each judge the dial by a state that is already
  // gone. This ref is the one thing that is never behind.
  const openRef = useRef(false);

  // Stable, so the hygiene effects below depend on nothing that changes.
  // clearTimeout on an undefined or already-fired id is a no-op by spec.
  const cancelHoverOpen = useCallback(() => {
    window.clearTimeout(openTimer.current);
    openTimer.current = undefined;
  }, []);

  const cancelHoverClose = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = undefined;
  }, []);

  // The caller's ref and ours point at the same node: theirs is the §6.8
  // promise (ref reaches the root), ours is what the outside-pointer listener
  // measures "outside" against. Memoised on the caller's ref so React does not
  // detach and re-attach it on every render.
  // The merge itself — including React 19's callback-ref cleanup protocol —
  // lives in `makeAttachRef` (ui/attach-ref.ts), shared with Modal.
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => makeAttachRef(rootRef, ref)(node),
    [ref],
  );

  // One place where the switch flips, so `onOpenChange` can never miss a change
  // — and it is called from the EVENT, never from an effect (an effect would
  // report React's rendering, not the visitor's action).
  const setOpenState = useCallback(
    (next: boolean) => {
      // …and the flip is now REAL or it is nothing: a caller asking for the
      // state the dial already holds is dropped here, before React and before
      // the consumer hear about it. That is what makes "exactly once per real
      // flip" a property of this function rather than of every call site
      // remembering to check first.
      if (next === openRef.current) return;
      openRef.current = next;
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  /**
   * Every close the USER performs with the keyboard — Esc, or picking an
   * href-less disc — puts focus back on the bulb. An outside pointer press does
   * NOT come through here: the visitor is pointing somewhere else, and stealing
   * focus back would fight them.
   */
  const close = useCallback(() => {
    returningFocus.current = true;
    // Read HERE and not in the effect: by the time the effect runs the dial is
    // closed, `inert` has come back over the stem, and a browser blurs whatever
    // it just made inert — so the effect would find focus on <body> in the very
    // case this flag exists to recognise.
    focusWasInside.current =
      rootRef.current?.contains(document.activeElement) ?? false;
    setOpenState(false);
  }, [setOpenState]);

  // ── HOVER TIMER HYGIENE, in one place. A timer waits for a flip, so the flip
  // itself makes it moot; killing them here rather than at each call site is
  // what makes the invariants checkable at a glance:
  //  1. the open-timer exists only while the dial is CLOSED with the pointer
  //     inside — killed by leaving, by any bulb click, by `open` becoming true,
  //     and by unmount;
  //  2. the close-timer exists only while it is OPEN (and hover-opened) with
  //     the pointer outside — killed by re-entering, by `open` becoming false,
  //     and by unmount;
  //  3. therefore no timer can ever re-report a state the dial is already in,
  //     and `onOpenChange` still fires exactly once per real flip. The hygiene
  //     above makes the double report unreachable by ARGUMENT; `openRef`, read
  //     and written inside setOpenState, makes it unreachable by CONSTRUCTION —
  //     which is what also seals the pre-existing analog this lane did not
  //     create, an Esc landing in the same instant as an outside pointerdown.
  //
  // The effects below stay keyed on `open`, deliberately: their job is to react
  // to a COMMITTED flip (bind Esc, clear a spent timer), and post-commit is
  // exactly when that should happen. Only the pointer handlers, which race the
  // commit, read the ref.
  useEffect(() => {
    if (open) {
      cancelHoverOpen();
      return;
    }
    cancelHoverClose();
    // Whatever opened this dial, that open is over: the next one starts with
    // hover owning nothing, and with this pointer visit spent — a dismissal
    // the pointer is still resting on must not undo itself.
    hoverOpened.current = false;
    hoverMayOpen.current = false;
  }, [open, cancelHoverOpen, cancelHoverClose]);

  // …and nothing outlives the component: an unmount mid-dwell would otherwise
  // wake up and set state on a tree that is gone.
  useEffect(
    () => () => {
      cancelHoverOpen();
      cancelHoverClose();
    },
    [cancelHoverOpen, cancelHoverClose],
  );

  // The dev tripwire for a `value` that matches no option. It lives in an
  // EFFECT, not in the render body, because touching module state while
  // rendering is a side effect the React rules — and react-hooks/globals —
  // reject; NavMenu's mount-contract warning is the same shape. Not a useState:
  // nothing about it belongs on screen.
  // In PRODUCTION nothing is said and the bulb still renders the raw value: it
  // is honest (never invent a code) but it is NOT contained in the consumer's
  // aria-label, so SC 2.5.3 is broken for as long as it ships. A misuse path
  // caught in dev, never a supported state.
  const unmatched = bulb === undefined;
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || !unmatched) return;
    warnOnce(
      `SpeedDial: value "${value}" matches no option — the bulb prints it raw ` +
        'and every option got a disc. Pass a value that exists in `options`.',
    );
  }, [unmatched, value]);

  // LABEL IN NAME, checked where the two strings finally meet (SC 2.5.3, G2
  // a11y). Every ingredient is in this component's props — each option carries
  // both what it PRINTS (`code`) and what it is CALLED (`label`), and the bulb
  // carries `code` plus the required `aria-label` — so the rule the whole
  // design leans on is checkable here rather than only in a consumer's test.
  // A voice-control user reads the two letters on screen and says them; if the
  // accessible name does not contain them, the control cannot be reached by
  // voice at all. Dev-only, once per distinct message.
  // A third check used to live here — "3 letters need size=lg" — and went out
  // with the creep it existed for: the hover fill no longer reaches under the
  // letters at any size, so a long code is a layout judgement call and not a
  // contrast failure the atom can name.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    for (const option of options) {
      if (!option.label.toLowerCase().includes(option.code.toLowerCase())) {
        warnOnce(
          `SpeedDial: the option printed "${option.code}" is named ` +
            `"${option.label}", which does not contain it — a voice-control ` +
            'user who says the visible code cannot reach this disc (SC 2.5.3).',
        );
      }
    }
    if (bulb && !ariaLabel.toLowerCase().includes(bulb.code.toLowerCase())) {
      warnOnce(
        `SpeedDial: the bulb prints "${bulb.code}" but is named ` +
          `"${ariaLabel}", which does not contain it — the spoken name must ` +
          'start with the current option’s label (SC 2.5.3).',
      );
    }
  }, [options, bulb, ariaLabel]);

  // The focus return runs AFTER the close is committed, not inside close(),
  // because a close can hide the very button we want to focus (NavMenu's
  // row-4 → row-3 lesson). offsetParent is null exactly when the element or an
  // ancestor is display:none; unlike the burger this atom hides nothing of its
  // own, so there is no fallback target to walk to — it simply does not steal
  // focus from wherever the page put it.
  useEffect(() => {
    if (open || !returningFocus.current) return;
    returningFocus.current = false;
    // GUARDED since hover-open (2026-09-04): the focus goes back to the bulb
    // only if it was INSIDE this dial when the close happened. Unconditional
    // was right for as long as the only ways in were a click and a key press —
    // both leave focus on the bulb or on a disc, so "return it" and "leave it
    // alone" were the same instruction. A dial that opens because a mouse came
    // to rest on it can now be open while the visitor types somewhere else
    // entirely, and Esc — document-bound, as SC 1.4.13's dismissable half
    // requires — would YANK their focus into the corner of the screen. Every
    // pinned behaviour survives the guard: in an engine that focuses a <button>
    // on click — Chromium, Firefox, and every runner in this repo — a real
    // click leaves focus on the bulb or on the disc it landed on, so
    // Esc-after-click and the href-less pick still hand focus back.
    // The Safari consequence, stated rather than worked around: WebKit does not
    // focus a button on click (the same fact `handleBlur` already leans on), so
    // there a POINTER-opened dial closes into the no-return branch and focus
    // stays where the visitor put it. That is the pointer-close doctrine of
    // this file, not a regression — and keyboard activation, which focuses the
    // bulb everywhere, still returns focus in every engine.
    if (!focusWasInside.current) return;
    // `preventScroll` — a focus return restores the KEYBOARD position, never
    // the viewport's (owner-reported close-jump, 2026-09-04). focus() scrolls
    // its target into view by default, and the shell's `scroll-padding-bottom`
    // asks the browser to clear the corner band for a target that IS in that
    // band and is `fixed` — a clearance it can never reach, so it nudges the
    // page on every close. The bulb is on screen by construction (it is a fixed
    // corner control), so nothing is hidden by suppressing that scroll.
    // KEEP-IN-SYNC (fb-44) — and this pointer names ONE option, `preventScroll`:
    // NavMenu's focus-return effect took it in the same edit, and that half of
    // the twins' shape stays identical. The `focusWasInside` guard above is
    // deliberately NOT mirrored: it exists to answer hover-open, which lives in
    // this file alone. A burger opens only on a click or a key press, so focus
    // is always inside it at close time and NavMenu's unconditional return is
    // still the correct code there. Divergence by argument, not by drift.
    const button = bulbRef.current;
    if (button && button.offsetParent !== null) {
      button.focus({ preventScroll: true });
    }
  }, [open]);

  // Esc closes (§9). Bound to the document, not the root, because focus may
  // legitimately have moved elsewhere while the stem is open.
  // KEEP-IN-SYNC (fb-44): NavMenu's own "Esc closes (§9)" effect is this
  // manner's twin — the two files stay independent on purpose, so a change to
  // the SHAPE here (the document binding, the close-on-Escape semantics)
  // belongs on both sides in the same edit, never on one.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  // A pointer press anywhere else dismisses it — the popover manner NavMenu
  // gets from its dimming sheet, which this atom deliberately does not have (a
  // five-disc pill blocks nothing). `pointerdown`, not `click`: dismissal
  // should feel immediate and must not wait for a press that ends elsewhere.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      const target = event.target;
      if (!root || !(target instanceof Node) || root.contains(target)) return;
      setOpenState(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, setOpenState]);

  // ── BACK, WITH THE DIAL STILL OPEN — the bfcache (NavMenu's D1, same shape).
  // Browsers keep the document you LEAVE frozen in memory and restore it whole
  // on Back, state included. `pagehide` fires on every departure and only on
  // departures, so closing there means the SNAPSHOT itself is clean;
  // `flushSync` is what applies that close now rather than scheduling it for a
  // turn that may never come on a page about to be frozen. `pageshow` with
  // persisted=true is the belt to those braces, for engines that freeze without
  // delivering pagehide first. Both live only while open, like every other
  // listener here.
  // KEEP-IN-SYNC (fb-44): NavMenu's "BACK, WITH THE MENU STILL OPEN" block
  // (D1) is the twin — same pagehide/flushSync + pageshow-persisted pair, and
  // the reasoning is argued in full there. A change to the shape belongs on
  // both sides.
  useEffect(() => {
    if (!open) return;
    const onPageHide = () => {
      flushSync(() => close());
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) close();
    };
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [open, close]);

  /**
   * Focus leaving the root closes it: no orphan open pill behind a keyboard
   * user who tabbed past the last disc.
   *
   * `relatedTarget === null` is IGNORED on purpose — Safari does not focus a
   * <button> on click, so a perfectly ordinary tap on a disc arrives here as a
   * blur with no destination. Real outside clicks are covered by the pointer
   * listener above. React's onBlur is delegated `focusout`, which bubbles, so
   * one handler on the root sees every control inside it.
   */
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    onBlur?.(event);
    if (!open) return;
    const next = event.relatedTarget;
    if (next === null || rootRef.current?.contains(next)) return;
    setOpenState(false);
  };

  /**
   * ENTERING does two small things and deliberately not the big one: it opens
   * a pointer VISIT (which a later move may cash in) and it cancels a pending
   * close — the "came back" half of the grace. It does NOT arm the dwell; that
   * is the move handler's job, for the reason argued there.
   *
   * ONE CASE WITNESSES NO ENTER AT ALL: a cursor already parked on the corner
   * when the page loads. The browser computed hover before this component's
   * listeners existed, so no enter is ever delivered to them and the visit is
   * never opened — jiggling in place cannot arm the dwell until the pointer
   * leaves the dial and comes back. That reads as the same rule from the other
   * side ("a pointer that has not moved has hovered nothing") and costs the
   * visitor nothing: clicking the bulb works exactly as it always has.
   */
  const handlePointerEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    onPointerEnter?.(event);
    if (event.pointerType !== 'mouse') return;
    hoverMayOpen.current = true;
    cancelHoverClose();
  };

  /**
   * MOVEMENT is what arms the dwell, and this is the one place where movement
   * and the boundary event come apart. Chromium re-computes hover whenever the
   * LAYOUT changes beneath a resting cursor and delivers a full
   * pointerover/pointerenter pair for whatever arrived there — with no
   * pointermove at all (probed in this repo's own Chromium, 2026-09-04). Arming
   * on `enter` therefore let a FIXED corner dial unfold itself the moment it
   * mounted under somebody's parked mouse, hand nowhere near it; the component
   * suite caught the same thing as a freshly rendered dial opening under the
   * cursor the previous case left behind, so the next click closed it instead
   * of opening it. Hovering is something a VISITOR does — a pointer that has
   * not moved has hovered nothing.
   *
   * MOUSE ONLY. A finger that lands on the dial and drags — the first frames of
   * a page scroll — does dispatch pointermove, with pointerType 'touch', and
   * would otherwise unfold a dial the tap's own click then toggles shut. Pen is
   * excluded WITH touch on purpose rather than probed for: a stylus taps far
   * more often than it hovers, and guessing wrong for the taps is the more
   * expensive mistake.
   *
   * The FIRST move inside the root starts the clock and later ones do not
   * restart it (`openTimer` is the guard): a dwell any jitter could reset would
   * never elapse under a real hand.
   */
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    if (event.pointerType !== 'mouse') return;
    // `openRef`, not `open`: a move landing in the same instant as the dwell's
    // own commit must see the dial as already opening, or it would arm a second
    // dwell over an open dial.
    if (openRef.current) return;
    // A spent visit (this dial was dismissed under this very pointer) and a
    // dwell already running are both "nothing to do".
    if (!hoverMayOpen.current || openTimer.current !== undefined) return;
    openTimer.current = window.setTimeout(() => {
      openTimer.current = undefined;
      hoverOpened.current = true;
      // ACCEPTED STALENESS, recorded not machineried: this fires the
      // `setOpenState` captured when the dwell was armed, so a consumer that
      // swapped `onOpenChange` mid-dwell would hear the flip through the old
      // closure. Latent today — no consumer wires the prop at all — and the
      // cure (a ref-held callback) buys indirection nobody is paying for yet.
      setOpenState(true);
    }, HOVER_OPEN_DELAY_MS);
  };

  /**
   * LEAVING closes what hovering opened, after a grace long enough to cross a
   * gap or overshoot a disc.
   *
   * SC 1.4.13, all three halves, and none of them cost anything here:
   * HOVERABLE — the stem is a DOM descendant anchored at the bulb's centre, so
   * travelling bulb → disc never leaves this root and never starts the clock;
   * DISMISSABLE — Esc is already bound to the document while open;
   * PERSISTENT — nothing dismisses it on a timer of its own, it stays for as
   * long as the pointer does. The SC's focus half is not in play at all: focus
   * alone never opens this dial, the disclosure keeps Enter/Space.
   * Reduced motion is untouched — these clocks are intent, not animation.
   */
  const handlePointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(event);
    if (event.pointerType !== 'mouse') return;
    cancelHoverOpen();
    // `openRef`, not `open`: a pointer that leaves in the very instant the
    // dwell commits would otherwise judge the dial closed, skip the grace, and
    // strand an open dial the mouse has already abandoned.
    if (!openRef.current || !hoverOpened.current) return;
    cancelHoverClose();
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = undefined;
      // The same accepted staleness as the dwell above: `setOpenState` is the
      // one captured when the grace was armed.
      // THE MIXED-INPUT BELT: a mouse parked outside while somebody walks the
      // stem with the keyboard. Closing there would hand `inert` a focused disc
      // and dump the visitor on <body> — so the leave is dropped and the
      // keyboard keeps the dial (SC 2.4.3).
      if (rootRef.current?.contains(document.activeElement)) return;
      // setOpenState, never close(): a pointer-driven close must not move
      // focus, exactly as the outside-pointerdown listener above does not.
      setOpenState(false);
    }, HOVER_CLOSE_DELAY_MS);
  };

  const handleSelect = (
    option: SpeedDialOption<V>,
    event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  ) => {
    onSelect?.(option, event);
    // A LINK pick is left alone: the browser is already leaving, and closing
    // would animate a pill on a page that is being replaced.
    // An href-LESS pick (D2 = B′) has no navigation to end the interaction, so
    // the dial closes and hands focus back to the bulb wherever the engine
    // focused the disc that was clicked — everywhere but WebKit, which does not
    // focus a button on click, so the guarded return there finds focus outside
    // and leaves it alone (see the focus-return effect). The alternative is
    // leaving focus on a disc the parent may re-render away. (Builder-level
    // rule: the board decided the element, not this consequence.)
    if (option.href === undefined) close();
  };

  return (
    <div
      ref={setRoot}
      className={cx('inline-flex', rootSize[size], className)}
      onBlur={handleBlur}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...rest}
    >
      {/* The positioning scope AND the stacking group: `isolate` keeps the
          stem's -z-10 below the bulb without sinking it below the page. */}
      <div className="relative isolate inline-flex">
        <button
          type="button"
          ref={bulbRef}
          aria-expanded={open}
          aria-controls={listId}
          aria-label={ariaLabel}
          // The DECISION starts at the press, not at the click: a press begun
          // while the dwell is still running kills both clocks here, so the
          // dial never flashes open under a finger that is already committing
          // to a click. Nothing to chain — the bulb is this atom's own element,
          // not a consumer's (§6.8 stops at the root).
          onPointerDown={() => {
            cancelHoverOpen();
            cancelHoverClose();
          }}
          // A tap is a DECISION, so it beats both clocks: cancelling them first
          // is what makes the click path identical to the one that shipped
          // before hover-open — the pointermove that always precedes a click
          // has already armed the dwell by the time we get here, and a pending
          // grace from a pointer that left and came back must not close the
          // dial this very click is opening.
          onClick={(event) => {
            cancelHoverOpen();
            cancelHoverClose();
            // THE CLAIM. A slow aimer — §1's seventy-year-old on a phone, and
            // anyone whose hand parks on a target before pressing it — rests on
            // the bulb for longer than the dwell, so the dial is ALREADY open
            // by the time the click they planned arrives. Snapping it shut in
            // their face would punish them for aiming carefully; instead the
            // click CLAIMS the dial as click-opened (hoverOpened goes false), so
            // it now stays put like any clicked-open dial and hover-away can no
            // longer take it. The very next click closes it, as it always did.
            //
            // `event.detail > 0` is what keeps the keyboard honest: Enter and
            // Space arrive as clicks with detail === 0 and fall straight
            // through to the toggle, so `aria-expanded` never lies to a
            // keyboard user about what the next press does. Every pinned path
            // is untouched: a test's or a runner's click lands INSIDE the dwell,
            // where `hoverOpened` is still false.
            if (open && hoverOpened.current && event.detail > 0) {
              hoverOpened.current = false;
              return;
            }
            if (open) close();
            else setOpenState(true);
          }}
          className={cx(
            'peer relative z-10 rounded-full',
            // No `group` marker here any more: it existed only to drive the
            // bulb scrim's hover deepen, and round 12 made the bulb's scrim
            // STATIC (the current language is not a choice — see
            // artBulbScrimClasses). The stem discs keep theirs inside
            // artDiscClasses.
            discBase,
            discBox[size],
            hasArt(bulb?.art) ? artLetterClasses : letterClasses,
            // The tone rides along untouched even under a flag: its fill is
            // covered, not conditioned away, and both bundles already paint
            // `text-ink-inverse` — the same declaration twice is not a
            // conflict, and a tone bundle that ever stopped being
            // white-on-fill would be the bug, not this repeat.
            toneClasses[tone],
            discTransition,
          )}
        >
          {bulb ? discContent(bulb.code, bulb.art, false) : value}
        </button>

        {/* A plain list — no role="menu", no role="dialog", no aria-current
            (D10): the discs navigate, and the chosen one IS the button above.
            `role="list"` is NOT redundant here, whatever the name of the lint
            rule says (eslint.config.mjs configures the exception): WebKit
            strips list semantics from any <ul> with `list-style: none` outside
            a <nav>, and Tailwind's preflight sets exactly that on every list in
            the project. Without the explicit role, VoiceOver announces four
            loose links instead of "list, 4 items" — the count is the thing a
            blind visitor needs before deciding to walk it (SC 1.3.1).
            OPEN flips exactly two switches: aria-expanded on the bulb (the CSS
            reads it through `peer-aria-expanded:` and sweeps the stencil) and
            `inert` leaving this list (the discs come alive, the Tab key sees
            them, screen readers mention them). Nothing mounts, nothing
            unmounts — which is what gives the CLOSING animation something to
            animate and keeps the pre-hydration HTML honest (D8 = M). */}
        <ul
          id={listId}
          role="list"
          inert={!open}
          className={cx(stemBase, directionClasses[direction])}
        >
          {stem.map((option, index) => (
            <li
              key={option.value}
              // The two numbers the stagger reads: this disc's place in the
              // stem, and how many there are (so closing can count backwards).
              style={{ '--i': index, '--n': stem.length } as CSSProperties}
              className={stemItemClasses}
            >
              {option.href === undefined ? (
                <button
                  type="button"
                  lang={option.lang}
                  aria-label={option.label}
                  onClick={(event) => handleSelect(option, event)}
                  className={hasArt(option.art) ? artDiscClasses : discClasses}
                >
                  {discContent(option.code, option.art, true)}
                </button>
              ) : (
                <a
                  href={option.href}
                  lang={option.lang}
                  hrefLang={option.lang}
                  aria-label={option.label}
                  onClick={(event) => handleSelect(option, event)}
                  className={hasArt(option.art) ? artDiscClasses : discClasses}
                >
                  {discContent(option.code, option.art, true)}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
