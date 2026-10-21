// sections/CardCarousel/conveyor — THE GEOMETRY of the card carousel as plain
// numbers: where a card stands at any position on THE LINE, how large it is
// drawn and how far it is turned, how wide the stage must be for its two
// outermost cards to show exactly the owner's "60 40", and which moves are a
// card crossing the ring rather than gliding along it. React-free, DOM-free —
// CardCarousel.tsx writes these numbers into custom properties and the
// stylesheet draws them; conveyor.test.ts proves them, and the stories and
// CardCarousel.geometry.test.tsx measure what the engine draws with them.
//
// Owner, verbatim (2026-10-14): "i want to have most left and most right card
// like appear/disappear into a gradient … like 60% disappeard in width, rest
// appeared and obviously gradient disappearing … 5 cards 3 intact, most left
// and most right disappearing and center one straight … and the one letf and
// right to central one in 5 option slightly tilted in adjacent direction" —
// and on the motion, the same evening: "they should always rotate like in a
// line while bringin center one a bit up front, no up and down as reviews
// carrousell". His screenshot (a three-card "Rotating Gallery", described to
// this builder): the centre card the largest and straight, the two beside it
// about 0.9 of it and turned in 3D with their OUTER edge receding.
// And on 2026-10-17, of the five-card window, which had stood on a wheel and
// then on a ring for a day: "Imagine there is a horizontal line in the center
// of the central card. all cards centers must sit on that line and all must
// stand up right as the central one, not the left and right ones being
// slilghtly tilted like in "Când o schimbi". i want 0 designs that look like
// "Când o schimbi". i want all of them to look like "Pentru copii" as a
// frontal aspect" — „Când o schimbi" the demo article's five-card ring,
// „Pentru copii" its three-card line. So BOTH windows stand on THE LINE: one
// conveyor, and the window decides only how much of it the stage shows.
//
// ── THE LINE. Every card is ONE transform of its continuous POSITION x on the
// ring (0 the centre, ±1 the neighbours, ±2 the next pair, fractional while a
// hand drags or a move glides): a sideways shift, a turn about its own
// vertical axis and a uniform scale, seen through a perspective centred on the
// card's own LAYOUT box — which is the stage's centre, since every card is
// laid out in the stage's one cell. Nothing moves a card up or down, and none
// of the three can: the shift is horizontal, the turn's axis is vertical
// through the card's centre, the scale is about that centre, and the
// projection is symmetric about the horizontal line through it — so the
// vertical centre of every card's drawn box is the same line at every moment
// of a move, a drag and a snap (the owner's "like in a line … no up and down"
// and "all cards centers must sit on that line"). And every card stands
// UPRIGHT: a turn about a vertical axis keeps each vertical edge at one depth,
// so the projection draws it as a vertical line — nothing ever rolls a card
// in the screen's plane (the stories and the geometry test measure both,
// mid-move too).
//
// ── THE SLOTS. The pose is pinned at three positions and drawn on straight
// lines between them — piecewise linear in x, exactly what the browser's
// glide draws between two whole positions when it interpolates the functions,
// so a glide and a drag pass through the same poses:
//   · 0 — THE CENTRE: straight, scale 1, the largest card ("a bit up front");
//   · 1 — THE NEIGHBOURS: scale 0.9 (the screenshot's "≈ 0.9"), turned 14° —
//     the brief's "~12–15°" — outer edge away;
//   · 2 — THE NEXT PAIR (the five-card window's outermost cards, and where the
//     three-card window's waiting cards stand): scale 0.81 (0.9 × 0.9, the
//     same step again) and turned 18° — "the faded outermost pair may continue
//     the turn a little";
//   · beyond 2 — the next pair's pose, the shift continuing at the last pitch:
//     the cards waiting off the stage.
// Each slot's position is SOLVED, not chosen: the card stands so that its
// drawn inner edge keeps CARD_GAP of air from the drawn outer edge of the card
// before it. Measured in card widths at the default numbers: the neighbour at
// 0.9722, the next pair at 1.7247, the pitch beyond 0.7524 — tighter than the
// first because a smaller, more turned card is narrower on screen (the
// coverflow's own crowding at the sides).
//
// ── THE PERSPECTIVE is 2.5 card widths. Strong enough that a 14° turn READS as
// a turn (the neighbour's near edge is drawn 9 % taller than its far edge) and
// weak enough that the far pair does not warp. Expressed in card widths so the
// picture is the same at every size: everything here is a ratio of the card,
// which is a ratio of the stage.
//
// ── THE STAGE (ARRANGEMENTS, FIVE_FALLBACK). A window ends where its outermost
// card shows OUTER_SHARE (40 %) of its DRAWN width inside the stage and 60 %
// past it, and the mask's fade covers exactly that 40 %, from the card's inner
// edge (opaque) to the stage's edge (gone). So each window is two numbers, in
// card widths: the stage's width (`ratio`) and the fade's (`fade`). THREE ends
// on the neighbours: 1.7521 / 0.3160. FIVE ends on the next pair — the
// neighbours whole, the next pair the fading one: 3.2995 / 0.2397 (the next
// pair is drawn 0.5992 card widths wide, so its 40 % is 0.2397). THE
// FIVE-CARD FALLBACK — the three cards a `visible: 5` carousel shows in a
// narrow column — IS the three-card window, on the same line: the poses are
// the window's own whatever the stylesheet chose, so the script and the
// stylesheet can never disagree about what a card looks like.
// No room is kept under the cards for the cards themselves: the line never
// draws a card lower than the centre card's bottom — a turned card's near edge
// comes towards the viewer and is drawn taller, but never past the unscaled
// centre (0.9410 of it for a neighbour, 0.8527 for the next pair) — so the
// room under the cards is the drop shadow's alone (CardCarousel.tsx's THE
// ROOM). The windows here are the cards' alone, in card widths; the room the
// stage keeps for its two arrows is the stylesheet's, in theme steps
// (CardCarousel.tsx's THE BARS' ROOM).
//
// ── HISTORY, so nobody rebuilds it. From 2026-10-16 to 2026-10-17 the
// five-card window stood on its own shapes — first a WHEEL (the cards on the
// top arc of a circle in the screen's plane), then a RING (the front arc of a
// large circle lying flat, every card rolled a little in its own plane). The
// owner rejected both ("i want 0 designs that look like "Când o schimbi""),
// and they are gone, with their pivot, their roll and the room their corners
// asked for.

/** One pinned pose of THE LINE: where the card's centre stands, in card
 *  widths from the stage's centre, how large it is drawn, and how far it is
 *  turned, in degrees (positive turns a right-hand card's outer edge away). */
export type ConveyorSlot = Readonly<{
  position: number;
  scale: number;
  turn: number;
}>;

/** What CardCarousel.tsx writes onto one card — `--tx`, `--ry`, `--sc`: the
 *  sideways shift in card widths, the 3D turn about the card's own vertical
 *  axis in degrees, and the scale. */
export type CardPose = Readonly<{
  tx: number;
  ry: number;
  sc: number;
}>;

/** One window's stage, in card widths: its width and its fade's width (THE
 *  STAGE). */
export type Arrangement = Readonly<{
  ratio: number;
  fade: number;
}>;

/** The two windows the owner chooses between — `visible`. */
export type ConveyorWindow = 3 | 5;

/** The perspective's distance from the stage, in card widths (THE PERSPECTIVE). */
export const PERSPECTIVE = 2.5;

/** The air between two neighbouring cards' DRAWN edges at rest, in card
 *  widths: 19px between 320px cards, 12px between 200px ones. */
export const CARD_GAP = 0.06;

/** The share of the outermost card's drawn width left inside the stage — the
 *  owner's "60 40", 60 % gone past the edge, 40 % fading out inside it. */
export const OUTER_SHARE = 0.4;

/** The neighbours' pose (THE SLOTS): the screenshot's "≈ 0.9", turned 14°. */
const NEIGHBOUR = { scale: 0.9, turn: 14 } as const;

/** The next pair's pose: the same scale step again, the turn a little further. */
const NEXT_PAIR = { scale: 0.81, turn: 18 } as const;

/** Degrees to radians. */
const radians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * The drawn left and right edges of a card standing RIGHT of the centre at
 * `position`, scaled and turned as given — in card widths from the stage's
 * centre. Its inner (left) edge comes towards the viewer and its outer
 * (right) edge goes away, so the projection, x·d/(d − z), pushes the inner
 * edge out a little and pulls the outer one in. A card left of the centre is
 * the mirror.
 */
export function drawnEdges(
  position: number,
  scale: number,
  turn: number,
): Readonly<{ inner: number; outer: number }> {
  const half = scale / 2;
  const across = half * Math.cos(radians(turn));
  const depth = half * Math.sin(radians(turn));
  return {
    inner: ((position - across) * PERSPECTIVE) / (PERSPECTIVE - depth),
    outer: ((position + across) * PERSPECTIVE) / (PERSPECTIVE + depth),
  };
}

/** Where a card of this pose must stand for its drawn inner edge to sit
 *  CARD_GAP beyond `previousOuter` — drawnEdges' inner edge, solved for x. */
function standAfter(
  previousOuter: number,
  scale: number,
  turn: number,
): number {
  const half = scale / 2;
  const across = half * Math.cos(radians(turn));
  const depth = half * Math.sin(radians(turn));
  return (
    ((previousOuter + CARD_GAP) * (PERSPECTIVE - depth)) / PERSPECTIVE + across
  );
}

const neighbourAt = standAfter(0.5, NEIGHBOUR.scale, NEIGHBOUR.turn);
const nextPairAt = standAfter(
  drawnEdges(neighbourAt, NEIGHBOUR.scale, NEIGHBOUR.turn).outer,
  NEXT_PAIR.scale,
  NEXT_PAIR.turn,
);

/** THE SLOTS, solved (the header): the centre, the neighbours, the next pair. */
export const SLOTS: readonly [ConveyorSlot, ConveyorSlot, ConveyorSlot] = [
  { position: 0, scale: 1, turn: 0 },
  { position: neighbourAt, ...NEIGHBOUR },
  { position: nextPairAt, ...NEXT_PAIR },
];

/** One step of THE LINE, in card widths — the centre-to-neighbour distance,
 *  and therefore how far a dragging hand travels to move the ring one card,
 *  in either window. */
export const STEP = SLOTS[1].position;

/** The pitch past the neighbours, where the next pair and the waiting cards
 *  stand. */
export const BEYOND_PITCH = SLOTS[2].position - SLOTS[1].position;

/** Six decimals: the custom properties stay short and identical in the server
 *  HTML and the browser's first render. `+ 0` turns a −0 into 0. */
const tidy = (value: number): number => Math.round(value * 1e6) / 1e6 + 0;

/**
 * The pose of a card at continuous position `x` on THE LINE (THE SLOTS): drawn
 * on straight lines between the pinned poses, mirrored left of the centre —
 * the same in both windows, which differ only in how much of the line the
 * stage shows.
 */
export function poseAt(x: number): CardPose {
  const side = x < 0 ? -1 : 1;
  const distance = Math.abs(x);
  const [centre, neighbour, nextPair] = SLOTS;
  let position: number;
  let turn: number;
  let scale: number;
  if (distance <= 1) {
    position = neighbour.position * distance;
    turn = neighbour.turn * distance;
    scale = centre.scale + (neighbour.scale - centre.scale) * distance;
  } else if (distance <= 2) {
    const along = distance - 1;
    position = neighbour.position + BEYOND_PITCH * along;
    turn = neighbour.turn + (nextPair.turn - neighbour.turn) * along;
    scale = neighbour.scale + (nextPair.scale - neighbour.scale) * along;
  } else {
    position = nextPair.position + BEYOND_PITCH * (distance - 2);
    turn = nextPair.turn;
    scale = nextPair.scale;
  }
  return {
    tx: tidy(side * position),
    ry: tidy(side * turn),
    sc: tidy(scale),
  };
}

/** A window ending on the pair at `slot` (THE STAGE): the slot card's drawn
 *  inner edge plus the 40 % of it left inside, mirrored. */
function lineArrangement(slot: 1 | 2): Arrangement {
  const { position, scale, turn } = SLOTS[slot];
  const { inner, outer } = drawnEdges(position, scale, turn);
  const fade = OUTER_SHARE * (outer - inner);
  return { ratio: 2 * (inner + fade), fade };
}

/** The owner's two windows (THE STAGE): three cards, ending on the
 *  neighbours; five, ending on the next pair. */
export const ARRANGEMENTS: Readonly<Record<ConveyorWindow, Arrangement>> = {
  3: lineArrangement(1),
  5: lineArrangement(2),
};

/** THE FIVE-CARD FALLBACK (THE STAGE): the window a `visible: 5` carousel
 *  shows in a narrow column — the three-card window itself, on the same
 *  line. */
export const FIVE_FALLBACK: Arrangement = ARRANGEMENTS[3];

/**
 * A card's stacking rank: the centre on top, then the neighbours, and so on
 * out — so a card gliding past another always passes in front of the one
 * further from the centre.
 */
export function stackOrder(x: number): number {
  return 100 - Math.round(Math.abs(x) * 10);
}

/**
 * The longest move a card makes ALONG the conveyor, in positions: one step,
 * plus the rest of a drag let go (at most half a step, or nearly one for a
 * flick). Anything longer is a card CROSSING the ring — from its last place on
 * one side to its first on the other — or a bead pressed two or more cards
 * away, and must not glide across the stage (CardCarousel.tsx's THE NO-FLY
 * RULE).
 */
export const JUMP_LIMIT = 1.5;

/**
 * Which cards JUMPED between two arrangements (the reviews deck's wrap-around
 * rule, ReviewsDeck.tsx's THE WRAP-AROUND SWEEP, on continuous positions):
 * each such card lands at once, while the rest glide.
 *
 * @param painted the positions of the arrangement last drawn.
 */
export function jumpedSince(
  painted: readonly number[],
  positions: readonly number[],
): boolean[] {
  return positions.map((position, index) => {
    const was = painted[index];
    return was !== undefined && Math.abs(position - was) > JUMP_LIMIT;
  });
}
