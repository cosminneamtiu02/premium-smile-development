import { describe, expect, it } from 'vitest';
import { GOLDEN_CARDS } from '../ribbon-model/ribbon-model.golden.ts';
import {
  buildCard,
  UNIT_PX,
  type CardModel,
  type Vec3,
} from '../ribbon-model/ribbon-model.ts';
import { GOLDEN_LIGHT, GOLDEN_STRIPS } from './ribbon-paint.golden.ts';
import {
  buildStrip,
  HIDDEN_PACE,
  paintStretch,
  samplesOf,
  shade,
  type Faces,
  type Rgb,
  type Shade,
  type Stretch,
  type StripSample,
} from './ribbon-paint.ts';

// lib/ribbon-paint — the strip and its light equal the prototype's record,
// the painter paints only what is in front of the card's face, and it joins
// its pieces without a seam: inside one canvas (the additive blend) and
// across a frame (whole samples). Where two CANVASES meet is lib/ribbon-draw's
// (behind the card, where nothing is painted) and is pinned on the stand-in
// column in ui/Ribbon/Ribbon.test.tsx. Real Chromium, real 2D canvases, no
// stylesheet: every assertion reads pixels back with getImageData.

/** The two faces the record was written with — the old site's palette,
 *  globals.css's --ribbon-dark / --ribbon-light. */
const hex = (value: number): Rgb => [
  ((value >> 16) & 255) / 255,
  ((value >> 8) & 255) / 255,
  (value & 255) / 255,
];
const FACES: Faces = { dark: hex(0x2d263c), light: hex(0x8377a3) };
const NINE = 1e-9;
const FOUR = 1e-4;

const modelOf = (name: string): CardModel => {
  const card = GOLDEN_CARDS.find((golden) => golden.name === name);
  if (card === undefined) throw new Error(`no golden card ${name}`);
  return buildCard(card.input);
};

describe('lib/ribbon-paint — the strip, as recorded (GOLDEN_STRIPS)', () => {
  it('covers the six recorded cards', () => {
    expect(GOLDEN_STRIPS.map((strip) => strip.name)).toEqual(
      GOLDEN_CARDS.map((card) => card.name),
    );
  });

  describe.each(GOLDEN_STRIPS)('$name', (golden) => {
    const model = modelOf(golden.name);
    const strip = buildStrip(model, golden.mirror, FACES);

    it('cuts every segment by what it IS — a bend finely, a straight coarsely', () => {
      expect(
        model.segments.map((segment) => [segment.name, samplesOf(segment)]),
      ).toEqual(golden.samplesPerSegment);
      expect(strip).toHaveLength(golden.count);
    });

    it('spends the same effort over the whole stretch', () => {
      expect(
        Math.abs(strip[strip.length - 1].effort - golden.total),
      ).toBeLessThan(FOUR);
    });

    it('matches the nine recorded samples: edges to 1e-9, colour and effort to 1e-4', () => {
      for (const [
        index,
        lx,
        ly,
        lz,
        rx,
        ry,
        rz,
        red,
        green,
        blue,
        effort,
      ] of golden.samples) {
        const sample = strip[index];
        const edges = [...sample.l, ...sample.r];
        [lx, ly, lz, rx, ry, rz].forEach((value, i) =>
          expect(Math.abs(edges[i] - value)).toBeLessThan(NINE),
        );
        [red, green, blue].forEach((value, i) =>
          expect(Math.abs(sample.colour[i] - value)).toBeLessThan(FOUR),
        );
        expect(Math.abs(sample.effort - effort)).toBeLessThan(FOUR);
      }
    });
  });

  it('counts a hidden stretch at HIDDEN_PACE of its length', () => {
    // The desktop card's efforts, rebuilt by hand from the strip's own
    // points: a step with both ends behind the front face costs 0.35 of its
    // length in px, every other step its whole length.
    const model = modelOf('desktop');
    const strip = buildStrip(model, false, FACES);
    const frontY = -model.T / 2;
    const middle = (sample: StripSample): Vec3 => [
      (sample.l[0] + sample.r[0]) / 2,
      (sample.l[1] + sample.r[1]) / 2,
      (sample.l[2] + sample.r[2]) / 2,
    ];
    let effort = 0;
    let hidden = 0;
    for (let i = 1; i < strip.length; i++) {
      const [a, b] = [middle(strip[i - 1]), middle(strip[i])];
      const behind = a[1] > frontY && b[1] > frontY;
      if (behind) hidden++;
      effort +=
        Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) *
        UNIT_PX *
        (behind ? HIDDEN_PACE : 1);
      expect(Math.abs(strip[i].effort - effort)).toBeLessThan(1e-6);
    }
    expect(hidden).toBeGreaterThan(0);
  });
});

describe('lib/ribbon-paint — the light, as recorded (GOLDEN_LIGHT)', () => {
  it('shades each face by the direction its surface looks in', () => {
    expect(GOLDEN_LIGHT.length).toBeGreaterThan(0);
    for (const [face, nx, ny, nz, red, green, blue] of GOLDEN_LIGHT) {
      const colour = shade(face === 'dark' ? FACES.dark : FACES.light, [
        nx,
        ny,
        nz,
      ]);
      [red, green, blue].forEach((value, i) =>
        expect(Math.abs(colour[i] - value)).toBeLessThan(FOUR),
      );
    }
  });
});

// ── THE PAINTER, on real canvases ───────────────────────────────────────────

/** A canvas in the test page, 1 device pixel per CSS px. */
function canvasOf(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('no 2D context in the test browser');
  return { canvas, ctx };
}

/** Card units → px of a canvas whose card centre sits at (cx, cy). */
const placeAt =
  (cx: number, cy: number) =>
  (point: Vec3): readonly [number, number] => [
    cx + point[0] * UNIT_PX,
    cy - point[2] * UNIT_PX,
  ];

/** A card's stretch on a canvas, the card's centre at (cx, cy). */
function stretchOf(
  model: CardModel,
  mirror: boolean,
  cx: number,
  cy: number,
): Stretch {
  return {
    strip: buildStrip(model, mirror, FACES),
    place: placeAt(cx, cy),
    frontY: -model.T / 2,
  };
}

const alphaAt = (ctx: CanvasRenderingContext2D, x: number, y: number) =>
  ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data[3];

describe('lib/ribbon-paint — paintStretch, on a real canvas', () => {
  it('paints only what is in front of the card’s face: a piece behind it, nothing; a piece that crosses it, its front part', () => {
    // A synthetic straight ribbon, 0.2 units wide, from x = −1 to x = +1.
    // The card's face is y = 0; `depth` says where each end sits.
    const colour: Shade = [120, 100, 140];
    const end = (u: number, x: number, depth: number): StripSample => ({
      u,
      l: [x, depth, -0.1],
      r: [x, depth, 0.1],
      colour,
      effort: 100 * (x + 1),
    });
    const paint = (from: number, to: number) => {
      const { ctx } = canvasOf(400, 300);
      paintStretch(
        ctx,
        {
          strip: [end(0, -1, from), end(1, 1, to)],
          place: placeAt(200, 150),
          frontY: 0,
        },
        0,
        200,
      );
      return ctx;
    };

    // Wholly behind: the card is opaque — not one pixel.
    const behind = paint(0.3, 0.3);
    expect(
      behind
        .getImageData(0, 0, 400, 300)
        .data.every((channel) => channel === 0),
    ).toBe(true);
    // Crossing the face half-way along (behind at x = −1, in front at x = +1):
    // cut at x = 0, the front half painted and the other half not.
    const crossing = paint(0.3, -0.3);
    expect(alphaAt(crossing, 200 - 50, 150)).toBe(0);
    expect(alphaAt(crossing, 200 + 50, 150)).toBe(255);
    // Wholly in front: all of it.
    const front = paint(-0.3, -0.3);
    expect(alphaAt(front, 200 - 50, 150)).toBe(255);
  });

  it('leaves no hairline between neighbouring pieces: the ribbon’s inside stays opaque', () => {
    // The additive blend: two anti-aliased neighbours cover their shared edge
    // "half and half", and half PLUS half is one — up to the rasteriser's
    // own rounding of each half, measured in this Chromium at 245 … 255 of
    // 255 on all six recorded cards. The same pieces painted one OVER the
    // other (a context that refuses 'lighter', below) leave a seam at every
    // joint, down to 188: three quarters, the hairline the blend exists to
    // remove. So "no hairline" is pinned as: never under OPAQUE_ENOUGH, where
    // painting over drops far below it.
    const OPAQUE_ENOUGH = 240;
    const model = modelOf('desktop');
    const frontY = -model.T / 2;
    const interior = (ctx: CanvasRenderingContext2D) => {
      const stretch = stretchOf(model, false, 600, 400);
      paintStretch(
        ctx,
        stretch,
        0,
        stretch.strip[stretch.strip.length - 1].effort,
      );
      let least = 255;
      for (const segment of model.segments) {
        // A bend round an edge is seen nearly edge-on: its inside is a pixel
        // or two wide, all of it anti-aliased edge.
        if (segment.kind === 'fold') continue;
        const steps = Math.max(40, Math.ceil(segment.length * 400));
        for (let i = 2; i < steps - 1; i++) {
          const u = (segment.start + (segment.length * i) / steps) / model.S;
          // The stretch's own two ends are real edges, not seams.
          if (u < 0.002 || u > 0.998) continue;
          if (model.evaluate(u).y > frontY) continue;
          for (const v of [0.3, 0.5, 0.7]) {
            const [x, y] = stretch.place(model.surface(u, v));
            least = Math.min(least, alphaAt(ctx, x, y));
          }
        }
      }
      return least;
    };

    expect(interior(canvasOf(1200, 900).ctx)).toBeGreaterThanOrEqual(
      OPAQUE_ENOUGH,
    );
    // The guard has teeth: the same painting, but every assignment of the
    // blend ignored, so the pieces go on one over the other.
    const { ctx: real } = canvasOf(1200, 900);
    const over = new Proxy(real, {
      get: (target, key) => {
        const value: unknown = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
      set: (target, key, value) =>
        key === 'globalCompositeOperation' ||
        Reflect.set(target, key, value, target),
    });
    expect(interior(over)).toBeLessThan(200);
  });

  it('paints piece by piece exactly what it paints at once, pixel for pixel', () => {
    const model = modelOf('desktop');
    const whole = canvasOf(1200, 900);
    const pieces = canvasOf(1200, 900);
    const stretch = stretchOf(model, false, 600, 400);
    const efforts = stretch.strip.map((sample) => sample.effort);
    const total = efforts[efforts.length - 1];

    paintStretch(whole.ctx, stretch, 0, total);
    // Frames that end on WHOLE samples, of uneven sizes, as a pen draws.
    let from = 0;
    for (let j = 7; j < efforts.length - 1; j += 5 + (j % 11)) {
      paintStretch(pieces.ctx, stretch, from, efforts[j]);
      from = efforts[j];
    }
    paintStretch(pieces.ctx, stretch, from, total);

    const a = whole.ctx.getImageData(0, 0, 1200, 900).data;
    const b = pieces.ctx.getImageData(0, 0, 1200, 900).data;
    let differing = 0;
    for (let i = 0; i < a.length; i += 4) {
      if (
        a[i] !== b[i] ||
        a[i + 1] !== b[i + 1] ||
        a[i + 2] !== b[i + 2] ||
        a[i + 3] !== b[i + 3]
      ) {
        differing++;
      }
    }
    expect(differing).toBe(0);
  });
});
