import { describe, expect, it } from 'vitest';
import { GOLDEN_CARDS, GOLDEN_RULE } from './ribbon-model.golden.ts';
import {
  buildCard,
  gaugeRule,
  lanes,
  penetration,
  type AtomName,
  type CardModel,
  type SegmentKind,
  type Vec3,
} from './ribbon-model.ts';

// lib/ribbon-model — the port is the prototype the owner approved, to nine
// decimals (the frozen record beside this file), and the path it draws is
// sound: continuous, without kinks, its width across its travel, its hidden
// pieces close to the card. Runs in the `components` project (real Chromium)
// only because every src/ test does; nothing here touches the DOM.
//
// ── WHAT THE RECORD IS. Six real layouts of the Team page, measured in a
// browser under the decided gauge rule, from the narrowest phone to the widest
// desktop (`ribbon-model.golden.ts`'s header). The model is rebuilt from each
// card's `input` ALONE — T, l and every other number derived here, never
// read from the record — and every recorded number must come back within
// NINE. The record's samples sit INSIDE segments, never on a joint, so the
// comparison is exact where exactness means something.

const NINE = 1e-9;

/** The design's nine pieces, and the five kinds a segment can be. */
const ATOMS: readonly AtomName[] = [
  'dropIn',
  'hookEntry',
  'wrapEntry',
  'leadOut',
  'waveTop',
  'liftExit',
  'wrapExit',
  'reentry',
  'waveSide',
];
const KINDS: readonly SegmentKind[] = ['line', 'arc', 'fold', 'sway', 'wave'];

/** The largest absolute difference between two equal-length lists. */
function worst(actual: readonly number[], expected: readonly number[]): number {
  expect(actual).toHaveLength(expected.length);
  return actual.reduce(
    (most, value, i) => Math.max(most, Math.abs(value - expected[i])),
    0,
  );
}

/** A point along the centre line, by ARC LENGTH (never by u: a step in u is a
 *  step of S × du along the ribbon, and S differs from card to card). */
function at(model: CardModel, s: number) {
  return model.evaluate(s / model.S);
}

function point(model: CardModel, s: number): Vec3 {
  const { x, y, z } = at(model, s);
  return [x, y, z];
}

const minus = (a: Vec3, b: Vec3): Vec3 => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const size = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);

describe('lib/ribbon-model — the prototype, to nine decimals (GOLDEN_CARDS)', () => {
  it('covers the six recorded cards (the record never passes vacuously)', () => {
    expect(GOLDEN_CARDS.map((card) => card.name)).toEqual([
      'desktop',
      'desktopMirrored',
      'tabletStacked',
      'phoneMirrored',
      'narrowestLongGerman',
      'widestMirrored',
    ]);
  });

  describe.each(GOLDEN_CARDS)('$name — $why', (card) => {
    const model = buildCard(card.input);

    it('derives what follows from the gauge: T = 0.5 k, l = 2.3 (0.8 / k)^0.6, the width 0.25 k', () => {
      expect(Math.abs(model.T - card.derived.T)).toBeLessThan(NINE);
      expect(Math.abs(model.l - card.derived.l)).toBeLessThan(NINE);
      expect(Math.abs(model.width - card.width)).toBeLessThan(NINE);
      expect(Math.abs(model.S - card.S)).toBeLessThan(NINE);
    });

    it('cuts the chain into the same nine atoms', () => {
      expect(card.atoms.map(([name]) => name)).toEqual(ATOMS);
      expect(Object.keys(model.atoms)).toEqual(ATOMS);
      expect(
        worst(
          ATOMS.flatMap((name) => [model.atoms[name].u0, model.atoms[name].u1]),
          card.atoms.flatMap(([, u0, u1]) => [u0, u1]),
        ),
      ).toBeLessThan(NINE);
      for (const name of ATOMS) {
        const atom = model.atoms[name];
        expect(Math.abs(atom.length - (atom.u1 - atom.u0) * model.S)).toBe(0);
      }
    });

    it('travels the same segments, each carrying its KIND (never a class name)', () => {
      expect(
        model.segments.map((segment) => [segment.name, segment.kind]),
      ).toEqual(card.segments.map(([name, kind]) => [name, kind]));
      // Every one of the five kinds, and no other: the painter's samplesOf
      // answers exactly these.
      expect(new Set(model.segments.map((segment) => segment.kind))).toEqual(
        new Set(KINDS),
      );
      expect(
        worst(
          model.segments.flatMap((segment) => [segment.start, segment.length]),
          card.segments.flatMap(([, , start, length]) => [start, length]),
        ),
      ).toBeLessThan(NINE);
    });

    it('lays the one half twist over the hidden S', () => {
      expect(
        worst(
          [model.twist.start, model.twist.length, model.twist.dpsi],
          [card.twist.start, card.twist.length, card.twist.dpsi],
        ),
      ).toBeLessThan(NINE);
    });

    it('solves the hidden S and the entry the same way', () => {
      const { hidden, entry } = card;
      expect(
        worst(
          [model.hidden.hMid, model.hidden.rho, model.hidden.L],
          [hidden.hMid, hidden.rho, hidden.L],
        ),
      ).toBeLessThan(NINE);
      expect(
        worst(
          [
            model.entry.sway,
            model.entry.dropL,
            model.entry.sideOut,
            model.entry.hookLow,
            model.entry.reach,
          ],
          [entry.sway, entry.dropL, entry.sideOut, entry.hookLow, entry.reach],
        ),
      ).toBeLessThan(NINE);
    });

    it('passes through every recorded sample: position and frame, 75 of them', () => {
      expect(card.samples).toHaveLength(75);
      const actual: number[] = [];
      const expected: number[] = [];
      for (const [u, x, y, z, phi, psi] of card.samples) {
        const frame = model.evaluate(u);
        actual.push(frame.x, frame.y, frame.z, frame.phi, frame.psi);
        expected.push(x, y, z, phi, psi);
      }
      expect(worst(actual, expected)).toBeLessThan(NINE);
    });
  });

  it('reproduces GOLDEN_RULE: the gauge, and the lanes that follow from it', () => {
    expect(GOLDEN_RULE.length).toBeGreaterThan(0);
    for (const [W, k, , , top, side, gap] of GOLDEN_RULE) {
      expect(Math.abs(gaugeRule(W) - k)).toBeLessThan(NINE);
      const lane = lanes(gaugeRule(W));
      // The px columns are recorded to six decimals.
      expect(
        worst([lane.top, lane.side, lane.gap], [top, side, gap]),
      ).toBeLessThan(1e-6);
    }
  });
});

describe('lib/ribbon-model — the path is sound', () => {
  describe.each(GOLDEN_CARDS)('$name', (card) => {
    const model = buildCard(card.input);
    const { k, W, H } = card.input;
    // One micro-unit either side of a joint, in ARC LENGTH. Neighbours agree
    // to 2e-9 in position and 1e-7 in frame at a joint (the record's header),
    // so anything that is truly continuous moves by about 2 × DELTA × speed,
    // and a real break is orders of magnitude larger.
    const DELTA = 1e-6;

    it('is continuous at every joint — position and frame', () => {
      for (const segment of model.segments.slice(1)) {
        const s = segment.start;
        const before = at(model, s - DELTA);
        const after = at(model, s + DELTA);
        const moved = size(
          minus([after.x, after.y, after.z], [before.x, before.y, before.z]),
        );
        expect(moved, segment.name).toBeLessThan(4 * DELTA + 1e-8);
        const turned = size(minus(after.B, before.B));
        expect(turned, segment.name).toBeLessThan(1e-4);
      }
    });

    it('has no kink: the direction of travel is continuous at every joint', () => {
      const h = 1e-5;
      for (const segment of model.segments.slice(1)) {
        const s = segment.start;
        const incoming = minus(point(model, s - h), point(model, s - 2 * h));
        const outgoing = minus(point(model, s + 2 * h), point(model, s + h));
        const cosine =
          dot(incoming, outgoing) / (size(incoming) * size(outgoing));
        expect(Math.acos(Math.min(1, cosine)), segment.name).toBeLessThan(2e-3);
      }
    });

    // THE WIDTH ACROSS THE TRAVEL, measured the way the consult's checks
    // measured the prototype ("ribbon-ness |B·T|"): every piece whose heading
    // is ANALYTIC — straights, arcs, bends, the sway — to 1e-3; the two waves
    // apart. A wave's humps rise towards the viewer
    // (its bulge) while the ribbon rolls with them, and its heading is a
    // central difference, so its width vector leans off the 3D travel by a
    // few degrees: 0.070 at worst on these six cards, the prototype's number
    // to the digit — a property of the approved design, not of the port.
    const PERPENDICULAR = { wave: 0.08, other: 1e-3 };

    it('keeps the width vector across the travel: < 1e-3, the waves < 0.08', () => {
      const h = 1e-6;
      const most = { wave: 0, other: 0 };
      for (const segment of model.segments) {
        const kind = segment.kind === 'wave' ? 'wave' : 'other';
        const steps = Math.max(20, Math.ceil(segment.length * 400));
        for (let i = 1; i < steps; i++) {
          const s = segment.start + (segment.length * i) / steps;
          const travel = minus(point(model, s + h), point(model, s - h));
          const lean = Math.abs(dot(at(model, s).B, travel)) / size(travel);
          most[kind] = Math.max(most[kind], lean);
        }
      }
      expect(most.other).toBeLessThan(PERPENDICULAR.other);
      expect(most.wave).toBeLessThan(PERPENDICULAR.wave);
    });

    it('keeps every hidden piece within 0.056 k of the card’s outline — why the painter may skip them', () => {
      // "Hidden" = deeper than the card's front face. lib/ribbon-paint does
      // not paint such a piece at all, and this bound is the reason that is
      // the approved picture: the prototype showed a hidden piece only
      // OUTSIDE the outline grown by 0.07 k, and none reaches that far — the
      // centre line AND both edges, 0.05594 k at worst on every card (the
      // corners are the same shape at every gauge).
      const frontY = -model.T / 2;
      let reach = -Infinity;
      const steps = Math.ceil(model.S * 400);
      for (let i = 0; i <= steps; i++) {
        for (const v of [0, 0.5, 1]) {
          const [x, y, z] = model.surface(i / steps, v);
          if (y <= frontY) continue;
          reach = Math.max(reach, Math.abs(x) - W / 2, Math.abs(z) - H / 2);
        }
      }
      expect(reach).toBeLessThan(0.056 * k);
    });

    it('never enters a keep-out: fine penetration is 0 (200 per unit, three across)', () => {
      const points: Vec3[] = [];
      const steps = Math.ceil(model.S * 200);
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        for (const v of [0, 0.5, 1]) points.push(model.surface(u, v));
      }
      expect(penetration(points, card.input.boxes, -model.T / 2)).toBe(0);
    });
  });
});

describe('lib/ribbon-model — penetration, the one number the guard reads', () => {
  const box = { x: 0, z: 0, w: 1, h: 0.5 };

  it('is 0 for a visible point outside every box grown by M / 2', () => {
    expect(penetration([[2, -1, 0]], [box], -0.2)).toBe(0);
  });

  it('is the depth of the deepest visible point, measured to the nearer side', () => {
    // Grown by M / 2 = 0.04: the box reaches x = ±1.04, z = ±0.54.
    expect(penetration([[0.94, -1, 0]], [box], -0.2)).toBeCloseTo(0.1, 12);
    expect(
      penetration(
        [
          [0.94, -1, 0],
          [0, -1, 0.34],
        ],
        [box],
        -0.2,
      ),
    ).toBeCloseTo(0.2, 12);
  });

  it('ignores a point behind the card’s front face — the card hides it', () => {
    expect(penetration([[0, 0, 0]], [box], -0.2)).toBe(0);
    expect(penetration([[0, -0.2, 0]], [box], -0.2)).toBeGreaterThan(0);
  });
});

describe('lib/ribbon-model — input it cannot wrap is refused, loudly', () => {
  const desktop = GOLDEN_CARDS[0].input;

  it.each([
    ['W', { ...desktop, W: Number.NaN }],
    ['H', { ...desktop, H: 0 }],
    ['G', { ...desktop, G: -1 }],
    ['k', { ...desktop, k: Number.POSITIVE_INFINITY }],
  ])('refuses a %s that is not a finite number above 0', (field, input) => {
    expect(() => buildCard(input)).toThrow(RangeError);
    expect(() => buildCard(input)).toThrow(
      new RegExp(`^buildCard: ${field} must be a finite number`),
    );
  });

  it('refuses a keep-out with a coordinate that is not finite', () => {
    const boxes = [...desktop.boxes, { x: 0, z: Number.NaN, w: 1, h: 1 }];
    expect(() => buildCard({ ...desktop, boxes })).toThrow(
      /^buildCard: keep-out 4 needs finite x, z, w and h/,
    );
  });

  it('refuses a card too narrow for its gauge — the top wave would run backwards', () => {
    expect(() => buildCard({ ...desktop, W: 2 })).toThrow(
      /^buildCard: a card 2 units wide is too narrow for the gauge 0\.8/,
    );
  });

  it('refuses a card too short for its gauge — the side wave would run backwards', () => {
    expect(() => buildCard({ ...desktop, H: 0.5, G: 0.2 })).toThrow(
      /^buildCard: a card 0\.5 units tall with 0\.2 under it is too short/,
    );
  });
});
