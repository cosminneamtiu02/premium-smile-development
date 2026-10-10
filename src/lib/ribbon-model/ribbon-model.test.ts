import { describe, expect, it } from 'vitest';
import { GOLDEN_CARDS, GOLDEN_RULE } from './ribbon-model.golden.ts';
import {
  buildCard,
  gaugeRule,
  lanes,
  penetration,
  UNIT_PX,
  type AtomName,
  type CardInput,
  type CardModel,
  type Segment,
  type SegmentKind,
  type Vec3,
} from './ribbon-model.ts';

// lib/ribbon-model — the port rebuilds the frozen record beside this file to
// nine decimals (the prototype the owner approved; since 2026-09-30 the port's
// own side waves where a keep-out holds them back; since 2026-10-01 the port's
// own TOP RIPPLE), and the path it draws is sound: continuous, without kinks,
// its width across its travel, its hidden pieces close to the card, its top
// ripple three low bumps inside the card — on every recorded card as it is,
// and as the LAST card of a column, under which the ribbon tucks (THE TUCK,
// 2026-10-01: the owner's "tucked in behind it"). Runs in the `components` project
// (real Chromium) only because every src/ test does; nothing here touches the
// DOM.
//
// ── WHAT THE RECORD IS. Six real layouts of the Team page, measured in a
// browser under the decided gauge rule, from the narrowest phone to the widest
// desktop (`ribbon-model.golden.ts`'s header). The model is rebuilt from each
// card's `input` ALONE — T, l and every other number derived here, never
// read from the record — and every recorded number must come back within
// NINE. The record's samples sit INSIDE segments, never on a joint, so the
// comparison is exact where exactness means something.
//
// ── NO CORNER, NO RULER LINE (wave()'s SMOOTH BESIDE A KEEP-OUT). A wave a
// keep-out holds back must still read as a wave: a corner where its base line
// meets the limit, or a ruler-straight run beside the block, is the
// "rectangle" the owner saw on 2026-09-30. The recorded cards and the layouts
// that showed the fault are measured for both, a seeded sweep of layouts
// nobody measured for corners, and every one of them for a keep-out entered —
// a smooth wave that covers a word is no cure. Since 2026-10-01 a card has ONE
// wave, the side wave: the top lane carries THE RIPPLE — three low bumps of
// normal-distribution shape, a valley, a crest, a valley (the owner: the top
// waves were "too much"; then "3 waves … pretty low, pretty smooth … well
// distributed normal distributions") — and "the path is sound" pins its shape
// instead. Every test that walks a wave carries a 60 s budget: a band takes
// about a second on the development machine, and the CI runner is about six
// times slower.

const NINE = 1e-9;

/** The design's nine pieces, and the five kinds a segment can be. */
const ATOMS: readonly AtomName[] = [
  'dropIn',
  'hookEntry',
  'wrapEntry',
  'leadOut',
  'rippleTop',
  'liftExit',
  'wrapExit',
  'reentry',
  'waveSide',
];
const KINDS: readonly SegmentKind[] = [
  'line',
  'arc',
  'fold',
  'sway',
  'wave',
  'ripple',
];

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

/** How deep the ribbon enters a keep-out, sampled finely: 200 points per unit
 *  along it, three across — its two edges and its centre line. */
function finePenetration(model: CardModel, boxes: CardInput['boxes']): number {
  const points: Vec3[] = [];
  const steps = Math.ceil(model.S * 200);
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    for (const v of [0, 0.5, 1]) points.push(model.surface(u, v));
  }
  return penetration(points, boxes, -model.T / 2);
}

/** The top ripple's turning points, in order — each a valley or a crest, at
 *  its share of the run — by the sign of the rise between 400 samples. */
function rippleTurns(
  model: CardModel,
): readonly Readonly<{ kind: 'valley' | 'crest'; at: number }>[] {
  const run = model.atoms.rippleTop;
  const steps = 400;
  const z: number[] = [];
  for (let i = 0; i <= steps; i++) {
    z.push(at(model, (run.u0 + (run.u1 - run.u0) * (i / steps)) * model.S).z);
  }
  const turns: { kind: 'valley' | 'crest'; at: number }[] = [];
  for (let i = 1; i < steps; i++) {
    const before = z[i] - z[i - 1];
    const after = z[i + 1] - z[i];
    if (before < 0 && after > 0) turns.push({ kind: 'valley', at: i / steps });
    if (before > 0 && after < 0) turns.push({ kind: 'crest', at: i / steps });
  }
  return turns;
}

describe('lib/ribbon-model — the record, to nine decimals (GOLDEN_CARDS)', () => {
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

/** The recorded cards as the LAST card of a column: G null — the ribbon tucks
 *  under them (THE TUCK). Everything "the path is sound" asks of a card, it
 *  asks of these too. */
const AS_LAST = GOLDEN_CARDS.map((card) => ({
  ...card,
  name: `${card.name}, as the last card`,
  why: 'the same card as the last of its column: G null, the ribbon tucks under it',
  input: { ...card.input, G: null },
}));

describe('lib/ribbon-model — the path is sound', () => {
  describe.each([...GOLDEN_CARDS, ...AS_LAST])('$name', (card) => {
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
    // is ANALYTIC — straights, arcs, bends, the sway — to 1e-3; the side wave
    // apart. A wave's humps rise towards the viewer (its bulge) while the
    // ribbon rolls with them, and its heading is a central difference, so its
    // width vector leans off the 3D travel by a few degrees: 0.062 at worst
    // on these six cards (0.070 while the top wave ran — the prototype's
    // number to the digit — until the top run was made straight on
    // 2026-10-01) — a property of the approved design, not of the port.
    const PERPENDICULAR = { wave: 0.08, other: 1e-3 };

    it('keeps the width vector across the travel: < 1e-3, the side wave < 0.08', () => {
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
      expect(finePenetration(model, card.input.boxes)).toBe(0);
    });

    // THE TOP RIPPLE (the owner, 2026-10-01): between its two corner arcs the
    // ribbon runs flat on the face in a VALLEY, a CREST and a VALLEY — three
    // turning points, in that order and no other — levelled at both ends,
    // "pretty low" (a valley at most DIP = 3 % of the run deep, the crest at
    // most CREST = 1.5 % high), and the whole of it inside the card: its
    // upper edge never nearer the top edge than HEADROOM_AIR (0.04 k), its
    // lower edge never nearer the lane's floor than M (0.08 units). Its
    // heading is analytic, so the width-vector test above holds it to 1e-3
    // like a straight, and "no kink" holds its two joints with the arcs.
    it('ripples along the top lane — a valley, a crest, a valley — low, and inside the card', () => {
      const run = model.atoms.rippleTop;
      expect(run.length).toBeGreaterThan(0);
      const first = at(model, run.u0 * model.S + 1e-7);
      const last = at(model, run.u1 * model.S - 1e-7);
      expect(Math.abs(last.z - first.z)).toBeLessThan(1e-3);
      expect(first.y).toBeLessThan(-model.T / 2);
      const steps = 400;
      const z: number[] = [];
      // The depth below the CHORD at each step — the line between the two
      // ends, which the arcs leave a hair apart.
      const dips: number[] = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const frame = at(model, (run.u0 + (run.u1 - run.u0) * t) * model.S);
        expect(Math.abs(frame.y - first.y)).toBeLessThan(NINE);
        expect(Math.abs(frame.B[1])).toBeLessThan(NINE);
        z.push(frame.z);
        dips.push(first.z + t * (last.z - first.z) - frame.z);
      }
      expect(rippleTurns(model).map((turn) => turn.kind)).toEqual([
        'valley',
        'crest',
        'valley',
      ]);
      const lowest = Math.min(...z);
      const highest = Math.max(...z);
      expect(Math.max(...dips)).toBeLessThan(0.03 * run.length + 1e-6);
      expect(-Math.min(...dips)).toBeLessThan(0.015 * run.length + 1e-6);
      const lane = lanes(k).top / UNIT_PX;
      expect(H / 2 - (highest + model.width / 2)).toBeGreaterThanOrEqual(
        0.04 * k - 1e-9,
      );
      expect(lowest - model.width / 2 - (H / 2 - lane)).toBeGreaterThanOrEqual(
        0.08 - 1e-9,
      );
    });
  });
});

/** A layout these tests pin, told the way the record tells its cards. */
type PinnedCard = Readonly<{ name: string; why: string; input: CardInput }>;

// ── THE LAYOUTS THAT SHOWED THE FAULT (W, H, G and k to six decimals, the
// boxes to four; k is gaugeRule(W)). Three are as lib/ribbon-layout measured
// them in a browser on 2026-09-30: a name block that reaches the side lane
// holds the side wave's base line back — on `ownerCard`, the card the owner
// was looking at when he reported the "rectangle" (a 1280 window, the second
// doctor). `twoBlocksARampApart` was never on a page: a generated layout,
// kept for what the three lack — two blocks whose plateaus cross — and its
// blocks start 3 px inside the side lane.
const PINNED: readonly PinnedCard[] = [
  {
    name: 'ownerCard',
    why: 'the card of the report: the name block spans its column, at the side lane',
    input: {
      W: 10.09,
      H: 4.235938,
      G: 1.399844,
      k: 0.8,
      boxes: [
        { x: -2.6805, z: 0.38, w: 0.576, h: 0.896 },
        { x: -2.6805, z: -1.483, w: 1.6804, h: 0.385 },
        { x: 1.8404, z: 0.252, w: 2.5207, h: 0.42 },
        { x: 1.8405, z: -1.508, w: 1.92, h: 0.28 },
      ],
    },
  },
  {
    name: 'germanShortWave',
    why: 'a German card in a 1536 window: a short side wave, the steepest drift, the sharpest corner (10.5°)',
    input: {
      W: 12.138125,
      H: 4.336563,
      G: 1.562344,
      k: 0.962389,
      boxes: [
        { x: -3.2141, z: 0.3297, w: 0.576, h: 0.896 },
        { x: -3.2141, z: -1.5333, w: 2.0362, h: 0.385 },
        { x: 2.1962, z: 0.2017, w: 3.0541, h: 0.42 },
        { x: 2.1963, z: -1.5583, w: 1.92, h: 0.28 },
      ],
    },
  },
  {
    name: 'twoBlocksARampApart',
    why: 'two blocks at the lane with a gap between them: their plateaus cross, and a hump rises into the gap',
    input: {
      W: 10.09,
      H: 6.086143,
      G: 1.596609,
      k: 0.8,
      boxes: [
        { x: -2.0078, z: -1.9313, w: 2.3933, h: 0.3679 },
        { x: -1.5411, z: 1.1086, w: 2.86, h: 0.9212 },
      ],
    },
  },
  {
    name: 'phone',
    why: 'a 390 phone as laid out until 2026-10-09 (a 297px column, 336 since the phone gutter): every block is as wide as the card, so the side wave is held back all the way down',
    input: {
      W: 2.97,
      H: 7.130156,
      G: 0.971094,
      k: 0.37125,
      boxes: [
        { x: 0, z: 1.0929, w: 0.576, h: 0.896 },
        { x: 0, z: 2.7949, w: 1.1323, h: 0.45 },
        { x: 0, z: -1.5351, w: 1.1323, h: 0.98 },
        { x: 0, z: -3.0351, w: 1.1323, h: 0.28 },
      ],
    },
  },
];

/** A point of a wave's centre line seen from the front: [x, z]. */
type Point = readonly [number, number];

/** A card's ONE wave, the side wave (the top run has been straight since
 *  2026-10-01). */
function waveOf(model: CardModel): Segment {
  const waves = model.segments.filter((segment) => segment.kind === 'wave');
  expect(waves).toHaveLength(1);
  return waves[0];
}

/** A wave's centre line seen from the front, `perPx` points per CSS px of its
 *  run, by ARC LENGTH. */
function walk(model: CardModel, segment: Segment, perPx: number): Point[] {
  const steps = Math.ceil(segment.length * UNIT_PX * perPx);
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const { x, z } = at(model, segment.start + (segment.length * i) / steps);
    points.push([x, z]);
  }
  return points;
}

/** At every inner point of a walk, the degrees the line turns per CSS px of
 *  ribbon: the heading of the step after it, less the heading of the step
 *  before it, over the length of the step after it. */
function turns(points: readonly Point[]): number[] {
  const heading = (a: Point, b: Point) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  const rates: number[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const turn =
      heading(points[i], points[i + 1]) - heading(points[i - 1], points[i]);
    // Wrapped to ±180°: a heading that crosses ±π has not turned a circle.
    const wrapped = turn - 2 * Math.PI * Math.round(turn / (2 * Math.PI));
    const step =
      Math.hypot(
        points[i + 1][0] - points[i][0],
        points[i + 1][1] - points[i][1],
      ) * UNIT_PX;
    rates.push(Math.abs((wrapped * 180) / Math.PI) / step);
  }
  return rates;
}

/** A wave's sharpest turn, in degrees per CSS px, looked at `perPx` points per px. */
function sharpest(model: CardModel, segment: Segment, perPx: number): number {
  return turns(walk(model, segment, perPx)).reduce(
    (most, rate) => Math.max(most, rate),
    0,
  );
}

/** The longest ruler-straight run in a wave's MIDDLE, in CSS px: consecutive
 *  points that turn by less than 0.01° per px, a tenth of the way in from its
 *  start and a twentieth from its end. A wave starts and ends on its anchors,
 *  where it IS straight by design — hence the middle. */
function longestStraight(model: CardModel, segment: Segment): number {
  const perPx = 8;
  const rates = turns(walk(model, segment, perPx));
  let run = 0;
  let longest = 0;
  rates.forEach((rate, i) => {
    const t = (i + 1) / (rates.length + 1);
    run = rate < 0.01 && t >= 0.1 && t <= 0.95 ? run + 1 : 0;
    longest = Math.max(longest, run);
  });
  return longest / perPx;
}

describe('lib/ribbon-model — smooth beside a keep-out (SMOOTH BESIDE A KEEP-OUT)', () => {
  describe.each([...GOLDEN_CARDS, ...AS_LAST, ...PINNED])(
    '$name — $why',
    (card) => {
      const model = buildCard(card.input);

      it('turns no corner: its sharpest turn does not grow when looked at four times closer', () => {
        // A corner is a JUMP of heading: looked at four times closer, the same
        // jump falls on a step a quarter as long, so its rate per px grows
        // with the sampling (×2.3 to ×3.8 on the seven of these cards that had
        // the fault, before wave() was made smooth). A bend's rate is the
        // curve's own, and does not (×1.00 to ×1.01).
        const wave = waveOf(model);
        expect(
          sharpest(model, wave, 32) / sharpest(model, wave, 8),
        ).toBeLessThan(1.2);
      }, 60_000);

      it('draws no ruler line: beside a keep-out the wave goes on', () => {
        // 0.15 of the wave's period, in px. The ruler lines of the fault were
        // 50 to 60 px of a 130 to 185 px period; on these cards the straightest
        // stretch is now under 3 px.
        expect(longestStraight(model, waveOf(model))).toBeLessThan(
          0.15 * model.l * card.input.k * UNIT_PX,
        );
      }, 60_000);
    },
  );

  // The recorded cards are held to this in "the path is sound"; the layouts
  // that showed the fault, here.
  describe.each(PINNED)('$name', (card) => {
    const model = buildCard(card.input);

    it('never enters a keep-out: fine penetration is 0 (200 per unit, three across)', () => {
      expect(finePenetration(model, card.input.boxes)).toBe(0);
    }, 60_000);
  });
});

/** mulberry32 — a small seeded generator: the same numbers on every engine,
 *  every run. */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The column widths the sweep draws from, in card units: from the narrowest
 *  recorded card's (a 320 window) to the widest's (a 1920 window). */
const WIDTHS: readonly number[] = [
  2.41, 2.97, 3.6, 4.5, 5.99, 7.5, 8.93, 10.09, 12.14, 15.21,
];

/** The sweep: four bands of ten cards, a band to a seed. */
const BANDS: readonly number[] = [1, 2, 3, 4];
const PER_BAND = 10;

/**
 * `count` cards from `seed`. The ORDER of the draws is part of the sweep — per
 * card: its width, H, G, how many keep-outs; then per keep-out: its width, its
 * height, where it is anchored (and, anchored anywhere, where), its bottom.
 */
function sweep(seed: number, count: number): CardInput[] {
  const random = mulberry32(seed);
  const between = (a: number, b: number) => a + (b - a) * random();
  return Array.from({ length: count }, () => {
    const W = WIDTHS[Math.floor(random() * WIDTHS.length)];
    const k = gaugeRule(W);
    const lane = lanes(k);
    const top = lane.top / UNIT_PX + 0.01;
    const side = lane.side / UNIT_PX + 0.01;
    const H = between(W < 5 ? 5 : 4.2, W < 5 ? 12 : 8);
    const G = (lane.gap / UNIT_PX) * between(1, 1.2);
    // The content box: inside both lanes, and above the card's bottom padding.
    const [x0, x1] = [-W / 2 + side, W / 2 - side];
    const [z0, z1] = [-H / 2 + 0.24, H / 2 - top];
    const boxes = Array.from({ length: 2 + Math.floor(random() * 5) }, () => {
      const width = (x1 - x0) * between(0.15, 1);
      const height = Math.min(z1 - z0, between(0.2, 2.5));
      const anchor = random();
      const left =
        anchor < 0.4 ? x0 : anchor < 0.8 ? x1 - width : between(x0, x1 - width);
      const bottom = between(z0, z1 - height);
      return {
        x: left + width / 2,
        z: bottom + height / 2,
        w: width / 2,
        h: height / 2,
      };
    });
    return { W, H, G, k, boxes };
  });
}

describe('lib/ribbon-model — smooth on layouts nobody measured (a seeded sweep)', () => {
  // The fault was found on a page, not by a test: three of the six recorded
  // cards had it, and three samples a wave cannot show a corner. So the cure
  // is held on layouts nobody measured too: forty cards from four seeds, as
  // narrow as the narrowest recorded card and as wide as the widest, each with
  // two to six keep-outs from 15 % of the content box's width to all of it,
  // anchored left, right or anywhere. Every keep-out lies inside the lanes'
  // content box — a card owes the ribbon its lanes (CLAUDE.md §15.26). Every
  // wave in the sweep is at least 0.86 periods long (measured); a much shorter
  // side wave is a steep S of its own, outside this claim.
  it.each(BANDS)(
    'band %i: ten cards, no corner, no keep-out entered',
    (seed) => {
      sweep(seed, PER_BAND).forEach((input, index) => {
        const model = buildCard(input);
        const card = `card ${index + 1} (W ${input.W}, H ${input.H.toFixed(2)})`;
        const wave = waveOf(model);
        expect(
          sharpest(model, wave, 32) / sharpest(model, wave, 8),
          card,
        ).toBeLessThan(1.2);
        expect(finePenetration(model, input.boxes), card).toBe(0);
      });
    },
    60_000,
  );

  it('is not one kind of card: its forty include a column under 5 units wide and one over 10', () => {
    const widths = BANDS.flatMap((seed) =>
      sweep(seed, PER_BAND).map((input) => input.W),
    );
    expect(widths).toHaveLength(40);
    expect(widths.some((W) => W < 5)).toBe(true);
    expect(widths.some((W) => W > 10)).toBe(true);
  });
});

describe('lib/ribbon-model — three waves at every width (the owner, 2026-10-01: "on widening still just 3 waves … not more but wider")', () => {
  // Every column width ui/Container gives and narrower, 241 to 2 145px, every
  // 8px (the stand-in sweep of Ribbon.test.tsx — 241 was the 320 window's
  // column under the runner's scrollbar until 2026-10-09, 273 since: THE
  // PHONE GUTTER, §15.35), at three card heights: a valley, a
  // crest and a valley on each one, at the SAME share of the run — the bumps
  // are shares of the run (RIPPLE), so a wider card gets wider waves, never
  // more of them. The shares are the levelled sum's own extremes, a hair off
  // the bumps' centres; one sample is 1/400 of the run.
  it('ripples as a valley, a crest and a valley from 241px to 2 145px, the three at the same shares of the run', () => {
    const SHARES = [0.2175, 0.515, 0.794];
    let built = 0;
    for (let px = 241; px <= 2145; px += 8) {
      const W = px / UNIT_PX;
      const k = gaugeRule(W);
      for (const H of [3.5, 5.5, 9]) {
        const model = buildCard({
          W,
          H,
          G: lanes(k).gap / UNIT_PX,
          k,
          boxes: [],
        });
        const turns = rippleTurns(model);
        expect(
          turns.map((turn) => turn.kind),
          `${px}px × ${H}`,
        ).toEqual(['valley', 'crest', 'valley']);
        turns.forEach((turn, i) => {
          expect(
            Math.abs(turn.at - SHARES[i]),
            `${px}px × ${H}, turn ${i}`,
          ).toBeLessThanOrEqual(1 / 400 + 1e-12);
        });
        built++;
      }
    }
    expect(built).toBe(717);
  }, 60_000);
});

describe('lib/ribbon-model — the last card tucks the ribbon under it (THE TUCK)', () => {
  // The owner, 2026-10-01: "as on the first card of the list where it starts
  // from behind the card, i want the ribbon to also end on the last card
  // behind the bottom side of the last card tucked in behind it, not just
  // hanging as it is now". Under the LAST card (G null) the side wave runs
  // straight down its lane, and the ribbon turns on the hook's circle (r_1,
  // 0.5 k) towards the card's middle, crosses the bottom edge at 35° — the
  // angle of every crossing of the top edge — and bends onto the back, where
  // its end is out of sight. "The path is sound" holds the recorded cards to
  // the chain's every property as the last card too (AS_LAST); here, what
  // the tuck IS, on the recorded cards and on the layouts that showed the
  // keep-out fault.
  const BETA = (35 * Math.PI) / 180;

  describe.each([...GOLDEN_CARDS, ...PINNED])('$name', (card) => {
    const withNext = buildCard(card.input);
    const model = buildCard({ ...card.input, G: null });
    const { W, H, k } = card.input;
    const segment = (name: string): Segment => {
      const found = model.segments.find((each) => each.name === name);
      if (found === undefined) throw new Error(`no segment ${name}`);
      return found;
    };

    it('is the chain of a card with a next one down to its side wave — the tuck changes nothing above it', () => {
      const d = model.segments.findIndex((each) => each.name === 'd');
      expect(d).toBe(withNext.segments.length - 1);
      const above = (of: CardModel) =>
        of.segments
          .slice(0, d)
          .map((each) => [each.name, each.kind, each.start, each.length]);
      expect(above(model)).toEqual(above(withNext));
      expect(model.twist).toEqual(withNext.twist);
    });

    it('runs its side wave straight down, then turns on the hook’s circle, bends under the bottom edge, crosses the bottom face and bends onto the back', () => {
      expect(
        model.segments.slice(-5).map((each) => [each.name, each.kind]),
      ).toEqual([
        ['d', 'wave'],
        ['tuck', 'arc'],
        ['bfold1', 'fold'],
        ['bcross', 'line'],
        ['bfold2', 'fold'],
      ]);
      const d = segment('d');
      expect(
        Math.abs(at(model, d.start + d.length).x - at(model, d.start).x),
      ).toBeLessThan(1e-12);
      const turn = segment('tuck');
      if (turn.kind !== 'arc') throw new Error('the turn is an arc');
      expect(turn.turn).toBeCloseTo(Math.PI / 2 - BETA, 12);
      expect(turn.length / turn.turn).toBeCloseTo(0.5 * k, 12);
    });

    it('crosses the bottom edge at 35°, towards the card’s middle — the angle it crosses the top edge at', () => {
      // The secant over the turn's last 1e-7 units: off its tangent by under
      // 3e-7 on the tightest of these circles (r_1 on narrowestLongGerman,
      // measured 2.9e-7 rad) — inside the six-digit tolerance (5e-7).
      const s = segment('bfold1').start;
      const travel = minus(point(model, s), point(model, s - 1e-7));
      const length = size(travel);
      expect(travel[0] / length).toBeCloseTo(Math.cos(BETA), 6);
      expect(travel[1] / length).toBeCloseTo(0, 6);
      expect(travel[2] / length).toBeCloseTo(-Math.sin(BETA), 6);
      // The unmirrored card's side wave runs down its LEFT lane: +x is the
      // card's middle. The bend starts where every bend round an edge does,
      // 0.074 k inside the edge (R_FOLD less EPS).
      const start = at(model, s);
      expect(start.x).toBeLessThan(0);
      expect(Math.abs(start.z - (-H / 2 + 0.074 * k))).toBeLessThan(NINE);
    });

    it('is tucked: no point of it lies more than 0.056 k under the card’s bottom edge — a card with a next one runs on under it', () => {
      const lowest = (of: CardModel) => {
        let z = Infinity;
        const steps = Math.ceil(of.S * 400);
        for (let i = 0; i <= steps; i++) {
          for (const v of [0, 0.5, 1])
            z = Math.min(z, of.surface(i / steps, v)[2]);
        }
        return z;
      };
      expect(-H / 2 - lowest(model)).toBeLessThan(0.056 * k);
      expect(-H / 2 - lowest(withNext)).toBeGreaterThan(0.5);
    });

    it('ends on the back of the card, where nobody sees its end — the chain closes with the tuck, its nine atoms as every card’s', () => {
      const end = model.evaluate(1);
      expect(end.y).toBeGreaterThan(model.T / 2);
      expect(Math.abs(end.x)).toBeLessThan(W / 2);
      expect(Math.abs(end.z)).toBeLessThan(H / 2);
      const back = segment('bfold2');
      expect(back.start + back.length).toBe(model.S);
      expect(Object.keys(model.atoms)).toEqual(ATOMS);
      expect(model.atoms.waveSide.u1).toBe(segment('tuck').start / model.S);
    });

    it('never enters a keep-out: fine penetration is 0 (200 per unit, three across)', () => {
      expect(finePenetration(model, card.input.boxes)).toBe(0);
    }, 60_000);
  });

  // THE MOST A CARD CAN HOLD. Under a card there is no lane, only the card's
  // own bottom padding, so the tuck's promise is the card's: a block filling
  // the WHOLE content box — inside both lanes, and down to the card's bottom
  // padding (0.24 units, the seeded sweep's own; a real card keeps 25 px,
  // ui/Card's 1.5rem and its border) — is entered by no part of the ribbon,
  // at every 8px of column from 241px (the 320 window's under the runner's
  // scrollbar until 2026-10-09, 273 since — THE PHONE GUTTER, §15.35) to the
  // 2 560 window's, on a card of two heights. The hook's circle passes it by
  // about a quarter of a px at the widest of these columns (measured): the
  // lead's 0.9 k would sweep some 13 px into it there — why the tuck turns on
  // the hook's circle.
  // Wider columns are THE TUCK'S LIMIT (below). Four bands, each its own 60 s
  // budget (PR #113's lesson: a slower runner is not a covered card).
  it.each([
    [241, 713],
    [721, 1_193],
    [1_201, 1_673],
    [1_681, 2_145],
  ])(
    'a block filling the content box is never entered, at every 8px of column from %ipx to %ipx',
    (from, to) => {
      let built = 0;
      for (let px = from; px <= to; px += 8) {
        const W = px / UNIT_PX;
        const k = gaugeRule(W);
        const lane = lanes(k);
        const top = lane.top / UNIT_PX + 0.01;
        const side = lane.side / UNIT_PX + 0.01;
        for (const H of [5, 8]) {
          const [x0, x1] = [-W / 2 + side, W / 2 - side];
          const [z0, z1] = [-H / 2 + 0.24, H / 2 - top];
          const boxes = [
            {
              x: (x0 + x1) / 2,
              z: (z0 + z1) / 2,
              w: (x1 - x0) / 2,
              h: (z1 - z0) / 2,
            },
          ];
          const model = buildCard({ W, H, G: null, k, boxes });
          expect(finePenetration(model, boxes), `${px}px × ${H}`).toBe(0);
          built++;
        }
      }
      expect(built).toBe(((to - from) / 8 + 1) * 2);
    },
    60_000,
  );
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

  it('refuses a card too narrow for its gauge — the top ripple would span backwards', () => {
    expect(() => buildCard({ ...desktop, W: 2 })).toThrow(
      /^buildCard: a card 2 units wide is too narrow for the gauge 0\.8/,
    );
  });

  it('refuses a card too short for its gauge — the side wave would run backwards', () => {
    expect(() => buildCard({ ...desktop, H: 0.5, G: 0.2 })).toThrow(
      /^buildCard: a card 0\.5 units tall with 0\.2 under it is too short/,
    );
  });

  it('takes no gap under the LAST card — G null — and refuses a last card too short to tuck the ribbon under it', () => {
    expect(() => buildCard({ ...desktop, G: null })).not.toThrow();
    // A last card must hold the turn under it too: taller than about 2.8 k.
    expect(() => buildCard({ ...desktop, H: 2, G: null })).toThrow(
      /^buildCard: the last card, 2 units tall, is too short for the gauge 0\.8\d* to tuck the ribbon under it/,
    );
    expect(() => buildCard({ ...desktop, H: 2.3, G: null })).not.toThrow();
  });

  it('meets THE TUCK’S LIMIT on the widest windows — the last card of the built Team page at 3 328px still holds the turn, at 3 840px it is refused by name', () => {
    // Measured on the built export (/ro/team/, the six doctors): the gauge
    // grows with the column while a doctor card hardly grows, so from a
    // window of about 3 400 CSS px the last card is under the ~2.8 k the turn
    // needs, and the guard withholds the ribbon (lib/ribbon-model's THE TUCK;
    // the levers are the owner's, §15.26 round 5). With a gap under it — the
    // hanging tail's room — the same card still draws.
    const at3328 = { W: 29.13, H: 6.451875, G: null, boxes: [] };
    const at3840 = { W: 34.25, H: 6.703594, G: null, boxes: [] };
    expect(() =>
      buildCard({ ...at3328, k: gaugeRule(at3328.W) }),
    ).not.toThrow();
    const k = gaugeRule(at3840.W);
    expect(() => buildCard({ ...at3840, k })).toThrow(
      /^buildCard: the last card, 6\.703594 units tall, is too short for the gauge 2\.71\d* to tuck the ribbon under it/,
    );
    expect(() =>
      buildCard({ ...at3840, k, G: lanes(k).gap / UNIT_PX }),
    ).not.toThrow();
  });
});
