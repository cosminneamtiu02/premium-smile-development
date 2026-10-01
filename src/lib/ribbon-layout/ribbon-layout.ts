import {
  gaugeRule,
  UNIT_PX,
  type CardInput,
  type KeepOut,
} from '../ribbon-model/ribbon-model.ts';

// lib/ribbon-layout — THE PAGE → THE MODEL'S NUMBERS. A column of cards, as
// laid out by the browser, becomes one `CardInput` per card for
// lib/ribbon-model: the card's size, the gap under it, the gauge, and the
// blocks the ribbon must never cover. React-free (CLAUDE.md §4's foundation
// ring, fence-tested by tests/unit/lib-react-free.test.ts); one function
// reads the DOM, the other is pure (§15.26).
//
// ── THE SEAM TO A CARD, and the whole of it. ui/Ribbon marks each STATION —
// `data-ribbon-station` — and a card marks the blocks the ribbon must keep
// out of with the LITERAL attribute `data-ribbon-keepout`: the quote, the
// name block, the buttons row, and `data-ribbon-keepout="portrait"` on the
// portrait's cell. Nothing else about a card is known here.
//
// ── NEVER LOCATE A BLOCK BY ITS PLACE IN THE MARKUP. The prototype found the
// name block as "the heading's parent" and the portrait as "the other child
// of the block"; the doctor card PAINTS its blocks in an order its markup
// does not have (`flex-col-reverse` below its step, the columns swapped on a
// mirrored card), so a reader that walked the markup would put a keep-out
// where the words are not. A marker is found wherever it is painted.
//
// ── A STATION AND ITS CARD. The card is the station itself when the station
// carries it (`<RibbonStation asChild>` marks the card with the value
// `card`), otherwise the station's first element child. A station holding
// no element is a column the ribbon cannot wrap: measureColumn throws a
// RangeError naming it, which lib/ribbon-draw's guard turns into a refusal
// (nothing painted, a development warning).
//
// ── A KEEP-OUT IS WHAT IS PAINTED, not only the marked element's box: the
// UNION of the element's own box and its contents' — a Range over the
// contents brings the text nodes and the boxes of the children, so a
// `display: contents` marker is measured by what it holds, and content
// that overflows its block (a long label at a large root font) is kept out
// too. A marker that paints nothing at all (`display: none`) has no rect
// and is SKIPPED. The portrait keeps its cell's OWN box — a picture's
// corners are background — inset as below, and is skipped when boxless.
// A `display: contents` marker is measured, but has no box for
// lib/ribbon-draw's ResizeObserver to watch: its contents resizing alone is
// noticed only when the card or its station resizes too.
//
// ── EVERY RECT IS IN CSS PX, RELATIVE TO THE ROOT — the ribbon's own box,
// where its canvases live — and every rect comes from something the browser
// lays out, so the scroll position never enters a measurement (a boxless
// marker read as the all-zero rect would be the one exception: the window's
// corner, which moves with the scroll — hence SKIPPED, above). The root
// wears no border (its classes are ui/Ribbon's own; a caller's className
// is placement, §6.8), so its border box IS the canvases' box.
//
// ── THE UNIT CONVERTS (§15.25 round 2, §15.26). A rect is the page's px; the
// model counts in card units. placeColumn divides by how many CSS px one
// unit is on THIS page — the ribbon's `--ribbon-unit`, which lib/ribbon-draw
// reads off the root: the model's UNIT_PX, 100, unless a scaled design says
// otherwise (ui/Ribbon, THE UNIT). In a design scaled by s every rect is s
// times the reference's and so is the unit, so the model is handed the
// reference's numbers — and draws the reference's ribbon, scaled. The one
// number no rect gives — the LAST card's gap, which nothing on the page
// measures — is the model's own, lanes(k).gap over UNIT_PX: already units.
// The unit is the CALLER'S to give, every time — no default, which would let
// a forgotten unit measure a scaled column in the reference's px, silently —
// and one that is not a finite number of px above 0 is refused by name, a
// RangeError like a station's that holds no card, rather than surfacing as a
// card's W that lib/ribbon-model refuses. lib/ribbon-draw never hands it
// one: the unit it reads off the root is UNIT_PX for anything else (its
// THE UNIT).
//
// ── THE PORTRAIT'S INSET. A portrait's corners are background, and the owner
// approved pictures drawn with exactly this inset: the central 60 % × 70 % of
// the cell, 5 % of its height up.
//
// ── THE COLUMN. The FIRST card's width is the column's W and sets the gauge
// (lib/ribbon-model's gaugeRule); every second card is MIRRORED, by index —
// the ribbon enters it at the other corner, so its keep-outs are mirrored
// into the model's frame; the gap G under a card is measured to the next
// card's top, and under the LAST card there is none — null, and the model
// tucks the ribbon under it (lib/ribbon-model's THE TUCK, 2026-10-01; until
// that day the last card was given the lanes' own gap, and the tail ended in
// the air, fb-504).

/** A box in CSS px, relative to the ribbon's root. */
export type Rect = Readonly<{
  left: number;
  top: number;
  width: number;
  height: number;
}>;

/** One card as the page lays it out. */
export type MeasuredCard = Readonly<{
  card: Rect;
  keepouts: readonly Rect[];
}>;

/** One card as the model takes it, and where its box is — which places its ribbon. */
export type PlacedCard = Readonly<{
  index: number;
  mirror: boolean;
  input: CardInput;
  card: Rect;
}>;

/** The station marker ui/Ribbon writes; its value `card` says the station IS the card. */
export const STATION = 'data-ribbon-station';
/** The keep-out marker a card writes; its value `portrait` asks for the portrait's inset. */
export const KEEPOUT = 'data-ribbon-keepout';

/** The central 60 % × 70 % of a portrait's cell, 5 % of its height up. */
function portraitInset(cell: Rect): Rect {
  const width = cell.width * 0.6;
  const height = cell.height * 0.7;
  const cx = cell.left + cell.width / 2;
  const cy = cell.top + cell.height / 2 - 0.05 * cell.height;
  return { left: cx - width / 2, top: cy - height / 2, width, height };
}

/**
 * The column as the browser lays it out: every station inside `root`, in
 * document order, with its card's box and keep-outs — the ONLY
 * function in the ribbon that measures the page.
 *
 * @returns an empty list for a root without stations.
 * @throws RangeError naming the first station that holds no card — a column
 * the ribbon cannot wrap (A STATION AND ITS CARD).
 */
export function measureColumn(root: HTMLElement): readonly MeasuredCard[] {
  const origin = root.getBoundingClientRect();
  /** The smallest box holding every rect given, relative to the root — or null for none. */
  const union = (rects: readonly DOMRectReadOnly[]): Rect | null => {
    if (rects.length === 0) return null;
    const left = Math.min(...rects.map((rect) => rect.left));
    const top = Math.min(...rects.map((rect) => rect.top));
    return {
      left: left - origin.left,
      top: top - origin.top,
      width: Math.max(...rects.map((rect) => rect.right)) - left,
      height: Math.max(...rects.map((rect) => rect.bottom)) - top,
    };
  };
  const contents = root.ownerDocument.createRange();
  /** A KEEP-OUT IS WHAT IS PAINTED (the header) — or null for a marker that paints nothing. */
  const keepout = (block: Element): Rect | null => {
    const own = [...block.getClientRects()];
    if (block.getAttribute(KEEPOUT) === 'portrait') {
      const cell = union(own);
      return cell === null ? null : portraitInset(cell);
    }
    contents.selectNodeContents(block);
    return union([...own, ...contents.getClientRects()]);
  };
  const cards: MeasuredCard[] = [];
  for (const [index, station] of root
    .querySelectorAll(`[${STATION}]`)
    .entries()) {
    const card =
      station.getAttribute(STATION) === 'card'
        ? station
        : station.firstElementChild;
    if (card === null) {
      throw new RangeError(
        `measureColumn: station ${index} holds no card — a station marks one card of the column (ui/Ribbon)`,
      );
    }
    const box = card.getBoundingClientRect();
    cards.push({
      card: {
        left: box.left - origin.left,
        top: box.top - origin.top,
        width: box.width,
        height: box.height,
      },
      keepouts: [...card.querySelectorAll(`[${KEEPOUT}]`)].flatMap((block) => {
        const rect = keepout(block);
        return rect === null ? [] : [rect];
      }),
    });
  }
  return cards;
}

/**
 * Each measured card as lib/ribbon-model takes it — pure arithmetic, no DOM.
 * W and the gauge are the first card's; every second card is mirrored.
 *
 * @param unitPx the CSS px of one card unit on this page, REQUIRED — the
 * ribbon's `--ribbon-unit`, which lib/ribbon-draw reads off the root; the
 * model's own UNIT_PX unless a scaled design says otherwise (THE UNIT
 * CONVERTS).
 * @throws RangeError naming a unit that is not a finite number of CSS px
 * above 0 — whatever the column, an empty one included (THE UNIT CONVERTS).
 */
export function placeColumn(
  cards: readonly MeasuredCard[],
  unitPx: number,
): readonly PlacedCard[] {
  if (!(Number.isFinite(unitPx) && unitPx > 0)) {
    throw new RangeError(
      `placeColumn: unitPx must be a finite number of CSS px above 0 (received ${unitPx})`,
    );
  }
  if (cards.length === 0) return [];
  const W = cards[0].card.width / unitPx;
  const k = gaugeRule(W);
  return cards.map(({ card, keepouts }, index) => {
    const mirror = index % 2 === 1;
    const next = cards[index + 1];
    const G =
      next === undefined
        ? null
        : (next.card.top - (card.top + card.height)) / unitPx;
    const cx = card.left + card.width / 2;
    const cy = card.top + card.height / 2;
    const boxes = keepouts.map((block): KeepOut => {
      const x = (block.left + block.width / 2 - cx) / unitPx;
      return {
        x: mirror ? -x : x,
        z: -(block.top + block.height / 2 - cy) / unitPx,
        w: block.width / 2 / unitPx,
        h: block.height / 2 / unitPx,
      };
    });
    return {
      index,
      mirror,
      input: { W, H: card.height / unitPx, G, k, boxes },
      card,
    };
  });
}
