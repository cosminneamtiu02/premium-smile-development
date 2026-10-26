import { describe, expect, it } from 'vitest';
import {
  ARRANGEMENTS,
  BEYOND_PITCH,
  CARD_GAP,
  FIVE_FALLBACK,
  FLAT_PITCH,
  FLAT_SIDE_SCALE,
  FLAT_STEP,
  JUMP_LIMIT,
  OUTER_SHARE,
  PERSPECTIVE,
  SLOTS,
  STEP,
  drawnEdges,
  flatPoseAt,
  flatReach,
  jumpedSince,
  poseAt,
  stackOrder,
  type CardPose,
} from './conveyor';

// sections/CardCarousel/conveyor — the geometry as numbers (its header). What
// the engine DRAWS with these numbers is measured in CardCarousel.geometry.
// test.tsx and the stories; this suite proves the arithmetic itself: the
// line's slots solved for their air — checked against this suite's own
// reading of the CSS function list, a DOMMatrix — its two windows solved for
// the owner's "60 40", the five-card fallback the three-card window itself,
// every card drawn within the centre card's height and upright, every waiting
// card off its stage at rest and between, the pose, and the no-fly rule — and
// THE FLAT ROW (2026-10-25): its poses, their air at rest, their continuity and
// their mirror, and the reach — which cards stand clear of the arrows' strips,
// grown to the centre card's size — and THE GUARD (2026-10-26): what a number
// that is not finite draws, one rule for both poses and the reach.

/** A point in card widths from the stage's centre, y down. */
type Point = readonly [x: number, y: number];

/** A line card's drawn edges at a slot. */
const edgesOf = (slot: number) =>
  drawnEdges(SLOTS[slot].position, SLOTS[slot].scale, SLOTS[slot].turn);

/** A card's drawn edges at continuous position `x`, from the pose it wears —
 *  the right-hand mirror of a card left of the centre. */
const edgesAt = (x: number) => {
  const pose = poseAt(x);
  return drawnEdges(Math.abs(pose.tx), pose.sc, Math.abs(pose.ry));
};

/** Every thousandth of a position from `from` to `to`, both ends included. */
function walk(from: number, to: number): number[] {
  const steps = Math.round((to - from) * 1000);
  return Array.from({ length: steps + 1 }, (_, k) => from + k / 1000);
}

/**
 * THIS SUITE'S OWN READING of the function list CardCarousel.tsx writes —
 * perspective · translateX · rotateY · scale — as a DOMMatrix, the platform's
 * own CSS matrix arithmetic, in card widths: the module draws with
 * closed-form trigonometry, this with matrices, and the two must agree.
 */
function cssMatrix(pose: CardPose): DOMMatrix {
  const perspective = new DOMMatrix();
  perspective.m34 = -1 / PERSPECTIVE;
  return perspective
    .translate(pose.tx, 0, 0)
    .rotate(0, pose.ry, 0)
    .scale(pose.sc, pose.sc, 1);
}

/** A point of a card's own box (card widths from its centre, y down) where
 *  the CSS function list draws it, card widths from the stage's centre. */
function drawn(pose: CardPose, [u, v]: Point): Point {
  const point = cssMatrix(pose).transformPoint(new DOMPoint(u, v, 0, 1));
  return [point.x / point.w, point.y / point.w];
}

/** A 3:4 card's four corners, drawn: top left, top right, bottom right,
 *  bottom left. */
const outlineAt = (x: number, aspect = 4 / 3): Point[] =>
  (
    [
      [-0.5, -aspect / 2],
      [0.5, -aspect / 2],
      [0.5, aspect / 2],
      [-0.5, aspect / 2],
    ] as const
  ).map((corner) => drawn(poseAt(x), corner));

describe('conveyor — THE LINE: the slots, solved for their air', () => {
  it('pins the centre straight and largest, the neighbours at 0.9 and 14°, the next pair at 0.81 and 18°', () => {
    expect(SLOTS[0]).toEqual({ position: 0, scale: 1, turn: 0 });
    expect(SLOTS[1]).toMatchObject({ scale: 0.9, turn: 14 });
    expect(SLOTS[2]).toMatchObject({ scale: 0.81, turn: 18 });
  });

  it('stands every card CARD_GAP of air beyond the drawn edge of the card before it', () => {
    // The centre card is straight and unscaled: its edge is half a card out.
    expect(edgesOf(1).inner - 0.5).toBeCloseTo(CARD_GAP, 12);
    expect(edgesOf(2).inner - edgesOf(1).outer).toBeCloseTo(CARD_GAP, 12);
  });

  it('records the solved numbers (card widths) — a change here is a change of the picture', () => {
    expect(SLOTS[1].position).toBeCloseTo(0.972247, 6);
    expect(SLOTS[2].position).toBeCloseTo(1.724677, 6);
    expect(STEP).toBe(SLOTS[1].position);
    expect(BEYOND_PITCH).toBeCloseTo(0.75243, 5);
    expect(PERSPECTIVE).toBe(2.5);
  });

  it('draws a turned card’s inner edge out and its outer edge in — the projection', () => {
    // Unturned, a card's edges are its position ± half its scale.
    const flat = drawnEdges(1, 0.9, 0);
    expect(flat.inner).toBeCloseTo(0.55, 12);
    expect(flat.outer).toBeCloseTo(1.45, 12);
    // Turned, the inner edge comes towards the viewer (projected outward)
    // and the outer edge recedes (projected inward): the drawn card narrows.
    const turned = drawnEdges(1, 0.9, 14);
    expect(turned.outer - turned.inner).toBeLessThan(0.9);
  });

  it('draws exactly what the CSS function list draws — drawnEdges and a DOMMatrix agree to a millionth of a card width, at every position a card can take', () => {
    for (const x of walk(-7, 7).filter((_, k) => k % 50 === 0)) {
      const [topLeft, topRight, bottomRight, bottomLeft] = outlineAt(x);
      const edges = edgesAt(x);
      // A card right of the centre: its left edge is the inner one. Both
      // sides read the same six-decimal pose; the engine's matrix arithmetic
      // parts from the closed form by about 1e-7 far out (|tx| ≈ 5.5), a
      // three-hundredth of a pixel on a 320px card.
      const [innerX, outerX] =
        x >= 0 ? [topLeft[0], topRight[0]] : [-topRight[0], -topLeft[0]];
      expect(Math.abs(innerX - edges.inner), `inner at ${x}`).toBeLessThan(
        1e-6,
      );
      expect(Math.abs(outerX - edges.outer), `outer at ${x}`).toBeLessThan(
        1e-6,
      );
      // The two corners of each vertical edge share their x: the edge is
      // drawn vertical — the card UPRIGHT, never rolled.
      expect(Math.abs(topLeft[0] - bottomLeft[0])).toBeLessThan(1e-12);
      expect(Math.abs(topRight[0] - bottomRight[0])).toBeLessThan(1e-12);
    }
  });
});

describe('conveyor — THE LINE: its two windows, solved for the owner’s “60 40”', () => {
  it.each([
    ['three', 3, 1],
    ['five', 5, 2],
  ] as const)(
    'ends the %s-card stage where its outermost card shows 40 %% of its drawn width — and fades exactly that 40 %%',
    (_name, visible, slot) => {
      const { inner, outer } = edgesOf(slot);
      const { ratio, fade } = ARRANGEMENTS[visible];
      const edge = ratio / 2;
      expect((edge - inner) / (outer - inner)).toBeCloseTo(OUTER_SHARE, 12);
      // …and the fade covers exactly that 40 %, from the card's inner edge
      // (opaque) to the stage's edge (gone).
      expect(fade).toBeCloseTo(edge - inner, 12);
    },
  );

  it('records the windows (card widths): three 1.7521 / 0.3160, five 3.2995 / 0.2397 — the next pair drawn 0.5992 wide', () => {
    expect(ARRANGEMENTS[3].ratio).toBeCloseTo(1.752072, 6);
    expect(ARRANGEMENTS[3].fade).toBeCloseTo(0.316036, 6);
    expect(ARRANGEMENTS[5].ratio).toBeCloseTo(3.299523, 6);
    expect(ARRANGEMENTS[5].fade).toBeCloseTo(0.239672, 6);
    const { inner, outer } = edgesOf(2);
    expect(outer - inner).toBeCloseTo(0.59918, 5);
  });

  it('falls back from five to the THREE-card window itself — the same object, on the same line', () => {
    expect(FIVE_FALLBACK).toBe(ARRANGEMENTS[3]);
  });

  it('keeps the five-card neighbours wholly inside the stage and clear of its fade — and the centre clear of either window’s fade', () => {
    const half = ARRANGEMENTS[5].ratio / 2;
    const clear = half - ARRANGEMENTS[5].fade;
    expect(edgesOf(1).outer).toBeLessThan(clear);
    // The fade begins exactly where the next pair's drawn box does.
    expect(clear).toBeCloseTo(edgesOf(2).inner, 12);
    expect(0.5).toBeLessThan(clear);
    expect(0.5).toBeLessThan(ARRANGEMENTS[3].ratio / 2 - ARRANGEMENTS[3].fade);
  });

  it.each([
    ['three', 3, 2, 0.534054],
    ['five', 5, 3, 0.55241],
  ] as const)(
    'keeps every card beyond the %s-card window wholly off its stage — every position from %i out to |x| = 7, at rest and between',
    (_name, visible, from, least) => {
      const half = ARRANGEMENTS[visible].ratio / 2;
      let clearance = Number.POSITIVE_INFINITY;
      for (const x of walk(from, 7)) {
        clearance = Math.min(clearance, edgesAt(x).inner - half);
        // The mirror, left of the centre.
        clearance = Math.min(clearance, edgesAt(-x).inner - half);
      }
      expect(clearance).toBeGreaterThan(0);
      expect(clearance).toBeCloseTo(least, 5);
    },
  );

  it('draws every card within the centre card’s height at every position: a turned card’s near edge is drawn taller, but never past the unscaled centre — 0.9410 of it for a neighbour, 0.8527 for the next pair', () => {
    const nearEdge = (x: number): number => {
      const [topLeft, topRight, bottomRight, bottomLeft] = outlineAt(x, 1);
      return Math.max(bottomLeft[1] - topLeft[1], bottomRight[1] - topRight[1]);
    };
    expect(nearEdge(0)).toBeCloseTo(1, 12);
    expect(nearEdge(1)).toBeCloseTo(0.940976, 6);
    expect(nearEdge(2)).toBeCloseTo(0.852686, 6);
    for (const x of walk(-7, 7)) {
      if (x === 0) continue;
      expect(nearEdge(x), `the card at ${x}`).toBeLessThan(1);
    }
  });

  it('stands every card’s drawn centre on the centre card’s middle line, at every position', () => {
    for (const x of walk(-7, 7).filter((_, k) => k % 10 === 0)) {
      expect(drawn(poseAt(x), [0, 0])[1], `the card at ${x}`).toBeCloseTo(
        0,
        12,
      );
    }
  });
});

describe('conveyor — the pose', () => {
  it('lands exactly on every slot, mirrored left of the centre', () => {
    for (const slot of [1, 2] as const) {
      const pose = poseAt(slot);
      expect(pose.tx).toBeCloseTo(SLOTS[slot].position, 6);
      expect(pose.sc).toBeCloseTo(SLOTS[slot].scale, 6);
      expect(pose.ry).toBeCloseTo(SLOTS[slot].turn, 6);
      expect(poseAt(-slot)).toEqual({
        tx: -pose.tx,
        ry: -pose.ry,
        sc: pose.sc,
      });
    }
  });

  it('draws the centre as the identity — and never a −0 in a custom property', () => {
    const centre = poseAt(0);
    expect(centre).toEqual({ tx: 0, ry: 0, sc: 1 });
    for (const value of [
      ...Object.values(centre),
      ...Object.values(poseAt(-0)),
    ]) {
      expect(Object.is(value, -0)).toBe(false);
    }
  });

  it('draws a position that is NOT A FINITE NUMBER at the centre, at rest — never a NaN or an Infinity in a custom property (THE GUARD, flatReach’s rule)', () => {
    for (const x of [Number.NaN, Infinity, -Infinity]) {
      expect(poseAt(x), String(x)).toEqual({ tx: 0, ry: 0, sc: 1 });
    }
  });

  it('is piecewise LINEAR: half-way between two whole positions is half-way in every number (what the browser’s glide draws)', () => {
    for (let from = -6; from < 6; from++) {
      const to = from + 1;
      const a = poseAt(from);
      const b = poseAt(to);
      const mid = poseAt((from + to) / 2);
      for (const key of ['tx', 'ry', 'sc'] as const) {
        expect(mid[key], `${key} between ${from} and ${to}`).toBeCloseTo(
          (a[key] + b[key]) / 2,
          5,
        );
      }
    }
  });

  it('moves every card along the line, shrinking and turning away as it leaves the centre', () => {
    let previous = poseAt(0);
    for (let x = 0.25; x <= 4; x += 0.25) {
      const pose = poseAt(x);
      expect(pose.tx).toBeGreaterThan(previous.tx);
      expect(pose.sc).toBeLessThanOrEqual(previous.sc);
      expect(pose.ry).toBeGreaterThanOrEqual(previous.ry);
      previous = pose;
    }
    // Past the next pair the pose holds; only the shift goes on.
    expect(poseAt(3)).toMatchObject({ sc: 0.81, ry: 18 });
    expect(poseAt(3.5).tx - poseAt(3).tx).toBeCloseTo(BEYOND_PITCH / 2, 5);
  });

  it('stacks the centre on top, then the neighbours, and so on out', () => {
    expect(stackOrder(0)).toBeGreaterThan(stackOrder(1));
    expect(stackOrder(1)).toBe(stackOrder(-1));
    expect(stackOrder(-1)).toBeGreaterThan(stackOrder(2));
    expect(stackOrder(2.6)).toBeLessThan(stackOrder(2.4));
    expect(Number.isInteger(stackOrder(1.37))).toBe(true);
  });
});

describe('conveyor — the no-fly rule', () => {
  it('lets a card that moved one step glide', () => {
    // Seven cards, one step on: everyone moves one place to the left.
    expect(jumpedSince([0, 1, 2, 3, -3, -2, -1], [-1, 0, 1, 2, 3, -3, -2]))
      // …but the card at −3 reappears at +3: it crossed the ring.
      .toEqual([false, false, false, false, true, false, false]);
  });

  it('lets a released drag glide: at most half a step, or most of one for a flick', () => {
    expect(jumpedSince([0.4, 1.4, -0.6], [0, 1, -1])).toEqual([
      false,
      false,
      false,
    ]);
    expect(jumpedSince([-0.9], [0])).toEqual([false]);
  });

  it('lands a card that crossed the ring at once, whatever the ring’s size', () => {
    // Three cards: the card at −1 becomes +1 — a jump of two.
    expect(jumpedSince([0, 1, -1], [-1, 0, 1])).toEqual([false, false, true]);
    expect(JUMP_LIMIT).toBeGreaterThan(1);
    expect(JUMP_LIMIT).toBeLessThan(2);
  });

  it('lands every card at once when a bead picks a card two away — the list jumps, it never streams past', () => {
    // A bounded list of five, from its first card to its third.
    expect(jumpedSince([0, 1, 2, 3, 4], [-2, -1, 0, 1, 2])).toEqual([
      true,
      true,
      true,
      true,
      true,
    ]);
  });

  it('flags nothing on the first arrangement (no painted entry to compare)', () => {
    expect(jumpedSince([], [0, 1, -1])).toEqual([false, false, false]);
  });
});

describe('conveyor — THE FLAT ROW: its poses', () => {
  /** A flat card's drawn edges at continuous position `x`: its position ±
   *  half its scale — nothing projected, the row lies in the screen's
   *  plane. */
  const flatEdgesAt = (x: number) => {
    const { tx, sc } = flatPoseAt(x);
    return { left: tx - sc / 2, right: tx + sc / 2 };
  };

  it('pins the centre at scale 1 and every other card at THE LINE’s own neighbour step, 0.9 — the step 1.01 card widths, the pitch beyond it 0.96', () => {
    expect(FLAT_SIDE_SCALE).toBe(SLOTS[1].scale);
    expect(FLAT_SIDE_SCALE).toBe(0.9);
    expect(FLAT_STEP).toBeCloseTo(1.01, 12);
    expect(FLAT_PITCH).toBeCloseTo(0.96, 12);
    // Both derived from the line's own air, never respelled.
    expect(FLAT_STEP).toBe(0.5 + CARD_GAP + FLAT_SIDE_SCALE / 2);
    expect(FLAT_PITCH).toBe(FLAT_SIDE_SCALE + CARD_GAP);
  });

  it('draws the centre as the identity — no shift, scale 1 — and never a −0 in a custom property', () => {
    expect(flatPoseAt(0)).toEqual({ tx: 0, sc: 1 });
    for (const value of [
      ...Object.values(flatPoseAt(0)),
      ...Object.values(flatPoseAt(-0)),
    ]) {
      expect(Object.is(value, -0)).toBe(false);
    }
  });

  it('draws a position that is NOT A FINITE NUMBER at the centre, at rest — never a NaN or an Infinity in a custom property: THE GUARD, the one rule flatReach and poseAt keep too', () => {
    for (const x of [Number.NaN, Infinity, -Infinity]) {
      expect(flatPoseAt(x), String(x)).toEqual({ tx: 0, sc: 1 });
      expect(poseAt(x), String(x)).toEqual({ tx: 0, ry: 0, sc: 1 });
      expect(flatReach(x), String(x)).toBe(0);
    }
  });

  it('keeps CARD_GAP of air between every two cards’ drawn edges at rest — the centre and its neighbour, and every pair beyond', () => {
    expect(flatEdgesAt(1).left - 0.5).toBeCloseTo(CARD_GAP, 6);
    for (let x = 1; x < 7; x++) {
      expect(
        flatEdgesAt(x + 1).left - flatEdgesAt(x).right,
        `between ${x} and ${x + 1}`,
      ).toBeCloseTo(CARD_GAP, 6);
      expect(
        flatEdgesAt(-x).left - flatEdgesAt(-(x + 1)).right,
        `between −${x} and −${x + 1}`,
      ).toBeCloseTo(CARD_GAP, 6);
    }
  });

  it('lands exactly on the neighbour — continuous at |x| = 1, where the step meets the pitch', () => {
    expect(flatPoseAt(1)).toEqual({ tx: 1.01, sc: 0.9 });
    for (const side of [-1, 1]) {
      const below = flatPoseAt(side * (1 - 1e-6));
      const above = flatPoseAt(side * (1 + 1e-6));
      expect(above.tx - below.tx).toBeCloseTo(0, 5);
      expect(above.sc - below.sc).toBeCloseTo(0, 5);
    }
    // Past the neighbour the scale holds; only the shift goes on.
    expect(flatPoseAt(2)).toEqual({ tx: 1.97, sc: 0.9 });
    expect(flatPoseAt(3.5).tx - flatPoseAt(3).tx).toBeCloseTo(
      FLAT_PITCH / 2,
      5,
    );
  });

  it('mirrors every pose left of the centre', () => {
    for (const x of walk(0, 6).filter((_, k) => k % 37 === 0)) {
      const right = flatPoseAt(x);
      expect(flatPoseAt(-x), `at ${x}`).toEqual({
        tx: right.tx === 0 ? 0 : -right.tx,
        sc: right.sc,
      });
    }
  });

  it('is piecewise LINEAR: half-way between two whole positions is half-way in both numbers (what the browser’s glide draws)', () => {
    for (let from = -6; from < 6; from++) {
      const a = flatPoseAt(from);
      const b = flatPoseAt(from + 1);
      const mid = flatPoseAt(from + 0.5);
      for (const key of ['tx', 'sc'] as const) {
        expect(mid[key], `${key} between ${from} and ${from + 1}`).toBeCloseTo(
          (a[key] + b[key]) / 2,
          5,
        );
      }
    }
  });

  it('moves every card outward along the row, never growing as it leaves the centre — and never shifts a card above or below another: the row has no turn and no vertical term', () => {
    let previous = flatPoseAt(0);
    for (let x = 0.25; x <= 6; x += 0.25) {
      const pose = flatPoseAt(x);
      expect(pose.tx).toBeGreaterThan(previous.tx);
      expect(pose.sc).toBeLessThanOrEqual(previous.sc);
      expect(Object.keys(pose).sort()).toEqual(['sc', 'tx']);
      previous = pose;
    }
  });
});

describe('conveyor — THE FLAT ROW: the reach', () => {
  /** The j-th side card's outer edge, grown to the centre card's size, card
   *  widths from the centre — read off the pose it wears. */
  const grownEdge = (j: number): number => flatPoseAt(j).tx + 0.5;

  it('reads the grown edge off the row itself: FLAT_STEP + (j − 1) · FLAT_PITCH + ½, a straight line in j', () => {
    for (let j = 1; j <= 5; j++) {
      expect(grownEdge(j), `card ${j}`).toBeCloseTo(
        FLAT_STEP + (j - 1) * FLAT_PITCH + 0.5,
        6,
      );
    }
    expect(grownEdge(1)).toBeCloseTo(1.51, 6);
    expect(grownEdge(2)).toBeCloseTo(2.47, 6);
  });

  it('counts a card exactly at its limit as inside, and loses it a hair before — at every boundary from the first to the fifth card', () => {
    for (let j = 1; j <= 5; j++) {
      const edge = grownEdge(j);
      expect(flatReach(edge), `at card ${j}’s edge`).toBe(j);
      expect(flatReach(edge - 1e-6), `just short of card ${j}`).toBe(j - 1);
      expect(flatReach(edge + 0.5), `half a card past card ${j}`).toBe(j);
    }
  });

  it('reaches no side card where even the first does not fit — and nothing for a reading that is not a finite number', () => {
    expect(flatReach(grownEdge(1) - 1e-3)).toBe(0);
    expect(flatReach(0)).toBe(0);
    expect(flatReach(-3)).toBe(0);
    for (const reading of [Number.NaN, Infinity, -Infinity]) {
      expect(flatReach(reading), String(reading)).toBe(0);
    }
  });

  it('records the BARE carousel’s arithmetic at two screens — a 347.33px card, 36px strips, the stage the whole screen: none at 768, one a side at 1280 (not the Home band’s own row, which draws 55.38px strips at a tablet on a stage 1rem narrower than the screen: sections/BlogCarousel measures that)', () => {
    const card = (1106 - 2 * 32) / 3;
    const reach = (screen: number): number =>
      flatReach((screen / 2 - 36) / card);
    expect(reach(768)).toBe(0);
    expect(reach(1280)).toBe(1);
    // Two a side from about a 1788px screen: card 2's grown edge, 2.47 card
    // widths, and a strip.
    expect(reach(2 * (grownEdge(2) * card + 36) - 1)).toBe(1);
    expect(reach(2 * (grownEdge(2) * card + 36) + 1)).toBe(2);
  });
});
