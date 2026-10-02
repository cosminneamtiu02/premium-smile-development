'use client';

import {
  createContext,
  use,
  useEffect,
  useRef,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cx } from '@/lib/cx/cx';
import { startRibbonDraw } from '@/lib/ribbon-draw/ribbon-draw';
import { STATION } from '@/lib/ribbon-layout/ribbon-layout';
import { slotClone } from '../slot';

// ui/Ribbon — THE FLOSS RIBBON (CLAUDE.md §15.26): a decorative ribbon that
// wraps a column of cards — over the first card's top edge and across its
// top lane in a low ripple, behind the card, back round the opposite edge
// and down the side lane to the next card, which it wraps mirrored: down
// into its top corner, round its edge, across its top lane, and on — until
// the last card, under whose bottom edge it tucks, out of sight — painted
// on ordinary 2D canvases and DRAWN LIVE, card by card,
// as the visitor scrolls; once drawn it stays drawn. The mathematics,
// the page, the pixels and the moment are four lib modules (ribbon-model,
// ribbon-layout, ribbon-paint, ribbon-draw); this file is the markup they
// work on and the one effect that starts them.
//
// ── NO PROPS BEYOND children, `asChild` ON THE STATION, AND THE NATIVE ONES.
// One look, one motion (fb-505: "looks perfect now, I do not need
// alternatives or rebuilds"): a lever is a constant in one file, never a
// prop.
//
// ── TWO BOXES, AND WHY. The ribbon's gauge follows the COLUMN's width, which
// CSS reads in container units (`cqw`) — and an element cannot measure
// ITSELF that way, only an ancestor can. So the root is the container, and
// the inner box — the one that lays the cards out — declares the gauge and
// the lanes (globals.css, THE RIBBON'S LANES): the two lanes are registered
// custom properties, computed there and inherited by every card as plain
// lengths, so a box inside a card — itself a container — reads the column's
// numbers, not its own; the gauge and the gap are read on the column itself,
// and are not registered. A card spells its padding
// `max(P, var(--ribbon-lane-top, P))` on top and the same with
// `--ribbon-lane-side` either side, P its own padding outside a ribbon — for
// a card on ui/Card's step, `calc(var(--spacing) * 6)`: 1.5rem, and the
// design's 24px inside a scaled design (THE UNIT). The fallback serves an
// engine without `@property`, and the `max` a root font above 16px outside a
// ribbon, where the registered initial value is 24px while ui/Card gives
// 1.5rem. The column spaces its stations by `--ribbon-gap`. The lanes are
// spelled in the ribbon's UNIT and `cqw` ON PURPOSE — an exception to
// CLAUDE.md §7's "all sizing in rem": the ribbon follows the column's width
// and the design's scale, not the text's size, and only the 1.5rem floors
// follow the font. The inner box also owns the ribbon's HEAD and TAIL room
// as its padding, so every tile lies inside the root's height
// (Ribbon.test.tsx). THE HEAD ROOM is k above the first card (`--ribbon-k`,
// k units) and 0.16 of a unit more for a tile's 2px margin and the shadow;
// it was the drop-in's, which started k above the first card, until
// 2026-10-01 — since then the first card has no drop-in (lib/ribbon-draw,
// THE FIRST CARD HAS NO HEAD — its ribbon is first seen over its top edge,
// 0.08 k above it) and the room is the band's air alone, kept at that
// measure so no page moved — one spelling to shrink, the owner's. THE TAIL
// ROOM is only what the last card's TUCK needs (lib/ribbon-model — the
// ribbon goes under the card's bottom edge and behind it): its bend's curl,
// 0.056 k under the edge, and the shadow under that, 0.03 k down and blurred
// 0.04 k (lib/ribbon-draw's THE COLOURS) — 0.126 k, spelled 0.13 ×
// `--ribbon-k` — and 0.08 of a unit (8px at the default) for the tile's 2px
// margin, the shadow's floors and a pixel of rounding: about 13px on a
// phone, 18px on a laptop, 30px at the widest column at the default unit.
// Until 2026-10-01 it was 60px + 1rem, where the tail HUNG under the last
// card; the owner, the day the tail was tucked: "remove that space". Across,
// a tile may
// overhang the column by the few px the ribbon sticks out round a card's
// edge; at a 320px window that never scrolls the page sideways (the
// Narrowest story's test).
//
// ── THE UNIT (CLAUDE.md §15.25 round 2, §15.26). Every length of the ribbon
// is a multiple of ONE CARD UNIT — lib/ribbon-model's UNIT_PX, the 100 CSS px
// of the design the owner approved — and the column reads it as
// `--ribbon-unit`, a registered length whose initial value is those 100px
// (globals.css, THE RIBBON'S UNIT). A SCALED DESIGN sets it: globals.css's
// `design-scale` (THE DESIGN SCALE) makes it 100 of the design's pixels,
// and the doctors band wears that utility from its step
// (sections/DoctorShowcase, THE SCALE), so its cards and their ribbon grow
// and shrink together — the owner, 2026-10-01: "i want card and component
// and all contents to adjust in size harmonically all at once". That is why
// COLUMN's constants are FRACTIONS OF THE UNIT, not px: the gauge's straight
// line, the lanes' offsets, the gap's 60px, the head and tail room. At the
// default unit each is the px it always was — every computed value and every
// laid-out box the same to the last digit, measured in Chromium and WebKit at
// every 8px of column from 241 to 2 145 (2026-10-01) — and in a design
// scaled by s each is the reference's ×s, while the gauge's `cqw` reads a
// column scaled by s too: the ribbon inside a scaled design is the reference
// ribbon, scaled — the same shape, the same waves, the lanes ×s — never a
// new ribbon for a wider column (in px, the lanes' +8px and the gap's +60px
// stood still while the column grew, and the waves crowded in).
// lib/ribbon-draw reads the same unit off the root (its THE UNIT), and
// lib/ribbon-layout divides the page's px by it. NOT the unit's: the two
// 1.5rem FLOORS — a card's padding outside a ribbon (§7), which every
// column the site has clears by far — and the fallback in each
// `var(--ribbon-unit, 100px)`: today's column in an engine without
// `@property`, where the unit has no initial value and no scaled design
// declares it, for the band scales only where the engine registers custom
// properties (sections/DoctorShowcase, D10's gates —
// `@supports (color: rgb(from red r g b))`, registration's companion
// feature in every engine). There the unit is that 100px, and
// lib/ribbon-draw reads the same; an unregistered scaled design would paste
// its unit as text where it is read, while lib/ribbon-draw would read
// UNIT_PX under cards drawn scaled — the gate is what keeps one off the
// page. The head and tail room follow the unit, not the font, since that
// change: their 0.16 of a unit was 1rem — the same 16px at the default root,
// but no longer more at a larger user font. It holds a tile's 2px margin and
// the shadow, and the shadow follows the unit.
//
// ── THE WIDTH SHARE (CLAUDE.md §15.26 round 6). A consumer may declare
// `--ribbon-width-share` — a plain number above 0 and at most 1 — on the
// ribbon or above it, and the ribbon is then drawn at that share of its width
// along the very same route: lib/ribbon-draw reads it off the root as it
// reads the unit, lib/ribbon-paint draws the strip that much narrower. The
// lanes, the gap and the room keep the design's width, so a thinner ribbon
// only ever has more air. Its one declaration is the doctors band's, on a
// laptop or a desktop (sections/DoctorShowcase, D11): 0.7, the owner's "30%
// thinner" (2026-10-02).
//
// ── THE SEAM TO A CARD — all the two share. The card marks four blocks with
// the LITERAL attribute `data-ribbon-keepout` (the quote, the name block,
// the buttons row) and `data-ribbon-keepout="portrait"` (the portrait's
// cell), and reads the two lanes. A card is found per station: the station
// itself with `asChild` — this atom stamps it `card` through ui/slot.ts —
// otherwise the station's first element child (lib/ribbon-layout).
//
// ── THE COLUMN AS A LIST (SC 1.3.1). A roster of cards is a list, and it
// stays one inside a ribbon, by either of two routes — both riding what
// this atom already spreads: (A) NATIVE — nest your own `<ul>` directly in
// `<Ribbon>`, space it with `gap-(--ribbon-gap)` (the column's gap spaces
// its own children, and the list is its one child; the gap is not
// registered, so it resolves where it is read, and only a list with no
// container between it and the column reads the column's number), and make
// each `<li>` the station with `asChild`: the `<li>` then IS the measured
// card, so it carries no padding of its own; (B) ARIA — `<Ribbon role="list">` with
// wrapper stations, `<RibbonStation role="listitem">`, each card inside
// keeping its own role. The stand-in column takes route B
// (Ribbon.fixtures.tsx), and Ribbon.test.tsx reads it back by role.
//
// ── LIMITS A CONSUMER MUST KNOW. A root `className` is placement only:
// `static`, a border or an `overflow-*` on the root breaks the canvases'
// box. The FIRST card must fill the column — the CSS gauge reads the root's
// width, the painted gauge the first card's. The column is STATIC: a card's
// progress and its mirror are kept by its index, so a station added or
// removed after mount is not supported. Children that are not stations are
// not kept out. Forced colours and print hide the canvases by the class
// string — pinned end to end on the built pages since the mount
// (tests/e2e/doctor-showcase.spec.ts). A button's focus ring reaches 4px
// outside its row. At the default unit that is exactly the guard's air —
// lib/ribbon-model's `penetration` grows a keep-out by M / 2, 4px — so the
// guard keeps the ring clear by construction: at rest the ribbon may touch a
// ring, never cross it. Inside a scaled design the guard's air is 4·s px
// (3.24 at the band's smallest s, 0.81) while a ring stays 4 CSS px
// (globals.css, THE DESIGN SCALE, leaves outlines alone), so there it is the
// model's own clearance, M = 8·s px — 6.48 at that smallest s — that keeps
// the strip off a ring: measured on the built Team page, the closest
// approach to a name block is 7.33px at s 0.811, 7.80 at a 1280 window and
// 8.44 at 1401 — nothing crossed. A button that GROWS on hover (ui/Button's
// `motion="jump"`, 105 % — the doctor card's link) is measured at rest, so
// where it fills the content box's width — the stacked card — its hovered
// edge and ring can slide a few px under the side wave, which paints above
// the cards: never wholly hidden (SC 2.4.11); growing its keep-out by the
// jump is the owner's call (CLAUDE.md §15.26 round 5).
//
// ── DECORATIVE. The canvases' box is `aria-hidden`, nothing in it is
// focusable, clicks fall through it, and it is hidden in forced-colours mode
// and in print. ITS OWN LAYER: `relative isolate` — no number from the
// site's closed stacking order (30 / 40 / 45 / 50); the canvases' box comes
// AFTER the column in the markup, so it paints above the cards without a
// z-index.
//
// ── THE STATIC PAGE IS NEUTRAL (§16 rule 2): the server's HTML is the three
// boxes and the stations. The drawing starts after mount: it creates the
// canvases inside the empty box React never renders into, and nothing React
// renders reads its snapshot, so hydration has nothing to disagree about.
// §16's island list gained this atom at its first mount — sections/
// DoctorShowcase, on Home and on the Team page (2026-09-30, §15.25).
//
// ── 'use client' because it is inherently stateful: an effect starts the
// drawing and a context tells a station it stands in a ribbon. §6.8: the
// remaining native props land on the root, `ref` with them (React 19), and a
// caller's className is merged LAST — placement only.

export type RibbonProps = { children: ReactNode } & Omit<
  ComponentPropsWithRef<'div'>,
  'children'
>;

export type RibbonStationProps = {
  children: ReactNode;
  /**
   * Make the single child — the card — the station itself (ui/slot.ts), so no
   * wrapper stands between a list and its items (THE COLUMN AS A LIST). The
   * child keeps every attribute it declares, the station marker included —
   * give it none. ui/Card's two caveats hold here too: a component child
   * must land the props it does not know on its root element, or the marker
   * never reaches the page; and a `ref` on the station reaches the clone only
   * when the child declares none, typed for a <div> — for an <li> or an
   * <article>, put the ref on the child.
   */
  asChild?: boolean;
} & Omit<ComponentPropsWithRef<'div'>, 'children'>;

/** Inside a Ribbon, a station knows it; outside, it is `null` and it says so. */
const RibbonScope = createContext<true | null>(null);

const ROOT = '@container relative isolate';

// THE GAUGE AND THE LANES, in CSS (TWO BOXES, in the header), in the ribbon's
// UNIT (THE UNIT) — KEEP IN SYNC with lib/ribbon-model's gaugeRule() and
// lanes(): `--ribbon-k` is k units, `max(RATIO × 100cqw, (BOLD − SLOPE ×
// 2.97) units + SLOPE × 100cqw)`; the lanes are `max(24, 62 k + 8)`,
// `max(24, 60 k + 12, 83 k + 1)` and `100 k + 60` px at the default unit —
// so each px is a hundredth of a unit here, and each 24px floor 1.5rem. The
// head room is k + 0.16 of a unit, the tail room 0.13 k + 0.08 of a unit —
// the tuck's curl and shadow (TWO BOXES says why).
// Pinned three times: tests/unit/ribbon-lanes-sync.test.ts reads the model's
// numbers back from its functions and finds them here, Ribbon.test.tsx
// measures what the browser computes at nine widths, and — in a scaled design
// — that every one of these lengths is the plain column's, scaled. Static
// strings, so Tailwind's scanner sees every one.
const COLUMN =
  'flex flex-col gap-(--ribbon-gap) ' +
  'pt-[calc(var(--ribbon-k)_+_0.16*var(--ribbon-unit,100px))] pb-[calc(0.13*var(--ribbon-k)_+_0.08*var(--ribbon-unit,100px))] ' +
  '[--ribbon-k:max(7.9286cqw,calc(0.19240*var(--ribbon-unit,100px)_+_6.0218cqw))] ' +
  '[--ribbon-lane-top:max(1.5rem,calc(0.62*var(--ribbon-k)_+_0.08*var(--ribbon-unit,100px)))] ' +
  '[--ribbon-lane-side:max(1.5rem,calc(0.60*var(--ribbon-k)_+_0.12*var(--ribbon-unit,100px)),calc(0.83*var(--ribbon-k)_+_0.01*var(--ribbon-unit,100px)))] ' +
  '[--ribbon-gap:calc(var(--ribbon-k)_+_0.60*var(--ribbon-unit,100px))]';

const LAYER =
  'pointer-events-none absolute inset-0 forced-colors:hidden print:hidden';

export function Ribbon({
  children,
  className,
  ...rest
}: RibbonProps): ReactElement {
  const layer = useRef<HTMLDivElement>(null);
  // Started after mount, stopped at unmount — StrictMode's second run in
  // development starts a second drawing after the first is disposed.
  useEffect(() => {
    const element = layer.current;
    if (element === null) return;
    const draw = startRibbonDraw(element);
    return draw.dispose;
  }, []);
  return (
    <div className={cx(ROOT, className)} {...rest}>
      <RibbonScope value>
        <div className={COLUMN}>{children}</div>
      </RibbonScope>
      <div ref={layer} aria-hidden="true" className={LAYER} />
    </div>
  );
}

export function RibbonStation({
  children,
  asChild = false,
  className,
  ...rest
}: RibbonStationProps): ReactElement {
  if (use(RibbonScope) === null) {
    throw new Error(
      'RibbonStation must be rendered inside a <Ribbon> — it marks one card of the column the ribbon wraps: <Ribbon><RibbonStation>…a card…</RibbonStation></Ribbon>.',
    );
  }
  // The atom's marker LAST: a caller's own never replaces it, for it tells
  // lib/ribbon-layout which box to measure. With asChild the CHILD's own
  // attributes win (ui/slot.ts) — the JSDoc above says so.
  const station = { [STATION]: asChild ? 'card' : '' };
  if (asChild) {
    return slotClone('RibbonStation', children, cx(className), {
      ...rest,
      ...station,
    });
  }
  return (
    <div className={className} {...rest} {...station}>
      {children}
    </div>
  );
}
