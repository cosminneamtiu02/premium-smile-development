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
// wraps a column of cards — down into each card's top corner, round its
// edge, along the top lane as a calm wave, behind the card, back round the
// opposite edge and down the side lane to the next card, which it wraps
// mirrored — painted on ordinary 2D canvases and DRAWN LIVE, card by card,
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
// `max(1.5rem, var(--ribbon-lane-top, 1.5rem))` on top and the same with
// `--ribbon-lane-side` either side: the fallback serves an engine without
// `@property`, and the `max` a root font above 16px outside a ribbon, where
// the registered initial value is 24px while ui/Card gives 1.5rem. The
// column spaces its stations by `--ribbon-gap`. The lanes are px and `cqw`
// ON PURPOSE — an exception to CLAUDE.md §7's "all sizing in rem": the
// ribbon follows the column's width, not the text's size, and only the
// 1.5rem floor follows the font. The inner box also owns the ribbon's HEAD
// and TAIL room as its padding: the drop-in starts k above the first card
// (100 k px — `--ribbon-k`), the tail ends 60px under the last one (lanes'
// gap under the last card, less the gauge the side wave stops short by), and
// each gets 1rem more for a tile's 2px margin and the shadow — so every tile
// lies inside the root's height (Ribbon.test.tsx). Across, a tile may
// overhang the column by the few px the ribbon sticks out round a card's
// edge; at a 320px window that never scrolls the page sideways (the
// Narrowest story's test).
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
// string alone in this lane — the behaviour is an end-to-end check owed at
// the mount. A button's focus ring reaches 4px outside its row, which is
// exactly the guard's air (lib/ribbon-model's keep-outs are grown by 4px):
// the ribbon may touch a ring, never cross it.
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
// §16's island list gains this atom in the lane that mounts it (§15.26:
// this lane mounts it nowhere).
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

// THE GAUGE AND THE LANES, in CSS (TWO BOXES, in the header) — KEEP IN SYNC
// with lib/ribbon-model's gaugeRule() and lanes(): `--ribbon-k` is 100 k in
// px, `max(RATIO × 100cqw, 100 (BOLD − SLOPE × 2.97) px + SLOPE × 100cqw)`;
// the lanes are `max(24, 62 k + 8)`, `max(24, 60 k + 12, 83 k + 1)` and
// `100 k + 60` px. Pinned twice: tests/unit/ribbon-lanes-sync.test.ts reads
// the model's numbers back from its functions and finds them here, and
// Ribbon.test.tsx measures what the browser computes at nine widths. Static
// strings, so Tailwind's scanner sees every one.
const COLUMN =
  'flex flex-col gap-(--ribbon-gap) ' +
  'pt-[calc(var(--ribbon-k)_+_1rem)] pb-[calc(60px_+_1rem)] ' +
  '[--ribbon-k:max(7.9286cqw,calc(19.240px_+_6.0218cqw))] ' +
  '[--ribbon-lane-top:max(1.5rem,calc(0.62*var(--ribbon-k)_+_8px))] ' +
  '[--ribbon-lane-side:max(1.5rem,calc(0.60*var(--ribbon-k)_+_12px),calc(0.83*var(--ribbon-k)_+_1px))] ' +
  '[--ribbon-gap:calc(var(--ribbon-k)_+_60px)]';

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
