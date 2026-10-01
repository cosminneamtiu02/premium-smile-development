import {
  UNIT_PX,
  type CardModel,
  type Segment,
  type Vec3,
} from '../ribbon-model/ribbon-model.ts';

// lib/ribbon-paint — NUMBERS → PIXELS: one card's ribbon (lib/ribbon-model) as
// a STRIP of samples, each with its two edge points, its colour and the
// effort the pen has spent to reach it; and the painter that fills the strip
// between two efforts onto an ordinary 2D canvas. React-free and DOM-free
// apart from the context it is handed (CLAUDE.md §4's foundation ring):
// lib/ribbon-draw owns the canvases, the page and the clock (§15.26).
//
// ── WHY A 2D CANVAS CAN DO WHAT NEEDED A DEPTH BUFFER (the consult, fb-508):
// the ribbon has no loops (fb-489), so on screen it never crosses itself, and
// the only thing it goes behind is the card — a box. "Behind" is therefore a
// plane test — deeper than the card's front face, y > −T/2 — not a
// per-pixel comparison. Measured against the approved WebGL picture: area
// 0.03 % apart, colour within one level in 255 for 95 % of pixels.
//
// ── THE LIGHT is the approved picture's fragment shader, line for line, as a
// function of the surface's normal (`shade`). A ribbon is flat across its
// width, so its colour changes ALONG it only: one colour per sample, and a
// gradient between two samples is what the graphics chip computed per pixel.
// The ribbon is ONE colour (globals.css's `--ribbon`; the owner, 2026-09-30:
// "drop the dark mauve,/ black one and use the mov"). Until that day its two
// sides wore two, and lib/ribbon-model's hidden half twist showed them in
// turn; now the light simply falls on whichever side is turned to the viewer.
//
// ── A STRIP IS IN THE CARD'S OWN COORDINATES — card units, origin at the
// card's centre, mirrored when the column mirrors the card. Where it lands in
// a canvas is a function the caller hands over (`Stretch.place`), with the
// card's front face; that is what lets the recorded strips
// (`ribbon-paint.golden.ts`) be compared without a page. Each sample also
// says where it lies along the centre line (`u`), which is how lib/ribbon-draw
// finds the hidden point where it hands a card from one canvas to the next.
//
// ── HOW FINELY: by what a segment IS, never by its name (`samplesOf` reads
// the segment's `kind`; lib/ribbon-model's header says why that matters).
// A bend round an edge 16 · an arc 16 per quarter turn · a wave or the top
// ripple 32 per unit · the sway 32 · a straight 24 per unit — a straight is flat, but the pen
// must be SEEN to travel along it. (The design's shortest arc turns 20° and
// still gets 4; every length is positive, so nothing gets fewer than 1.)
//
// ── THE EFFORT is px of ribbon, a hidden stretch counted at HIDDEN_PACE of
// its length: the pen does not dwell on what nobody sees.
//
// ── NO HAIRLINES, INSIDE A CANVAS: ADDITIVE BLENDING. Neighbouring pieces
// share an edge exactly, and each paints that edge anti-aliased — "half
// covered". Painted one over the other, half over half is three quarters: a
// hairline between every two pieces. Painted with 'lighter', half PLUS half
// is one — to the rasteriser's own rounding of each half: measured in
// Chromium, the ribbon's inside stays at 245 … 255 of 255, where painting one
// over the other drops its seams to ~190. No overlap is needed, so the
// ribbon's outer edges are painted once, and drawing piece by piece ends on
// the picture of drawing at once, pixel for pixel (ribbon-paint.test.ts pins
// both).
//
// ── THE SHADOW IS PAINTED, NOT FILTERED (the owner, 2026-10-01: "when ribbon
// is generated … it's shadow is squareish and after a while it rerenders and
// transforms into a smooth one. i want it directly generated as smooth"). Until
// that day each canvas wore a CSS `filter: drop-shadow(…)`, and what the
// visitor saw while a stretch was being drawn was the engine's filter on a
// layer that changed every frame — an approximation that the engine replaced
// by the real thing once the canvas held still: the "balcony". Now the shadow
// is pixels of the canvas like the ribbon: `outlineStretch` collects the
// visible pieces of a stretch as ONE path, and `paintShadow` lays that path's
// drop shadow UNDER whatever the canvas holds ('destination-over'), with the
// canvas's own shadow — the same offset and blur the filter had, the shape
// itself drawn far above the canvas where it is clipped away, so only its
// shadow lands. One path, one shadow: no seam between pieces, and a frame's
// picture is final the moment it is painted.
//
// ── WHAT IS BEHIND THE CARD IS NOT PAINTED — and that is the whole truth,
// not a shortcut. A piece that crosses the card's front face is cut there
// (one plane of Sutherland–Hodgman) and only its front part is painted. Every
// piece behind the face lies within 0.056 k of the card's outline — the
// model's own bound, pinned in ribbon-model.test.ts — and the picture the
// owner approved never showed anything that close to a card: its painter
// drew what was behind the face only outside the outline grown by 0.07 k,
// which changed 0 to 4 pixels per card, measured on the six recorded cards
// before that branch was removed.

/** A colour: three channels, 0 … 1. */
export type Rgb = readonly [number, number, number];

/** A shaded colour: three channels, 0 … 255, not rounded. */
export type Shade = readonly [number, number, number];

/**
 * One sample of the strip: where it lies along the centre line (`u`, 0 … 1),
 * the ribbon's two edge points (card units, the card's own coordinates), its
 * colour (0 … 255, NOT rounded) and the effort spent to reach it (px).
 */
export type StripSample = Readonly<{
  u: number;
  l: Vec3;
  r: Vec3;
  colour: Shade;
  effort: number;
}>;

/** What the painter needs of a stretch of one card's ribbon, in one canvas. */
export type Stretch = Readonly<{
  strip: readonly StripSample[];
  /** Card units → this canvas's CSS px. */
  place: (point: Vec3) => readonly [number, number];
  /** The card's front face, y = −T/2: anything deeper is behind the card, and not painted. */
  frontY: number;
}>;

/** How much a hidden stretch costs the pen, per px of ribbon. */
export const HIDDEN_PACE = 0.35;

/** The shadow's opacity — the prototype's drop-shadow at 0.38 (THE SHADOW IS PAINTED). */
export const SHADOW_ALPHA = 0.38;
/** How far above the canvas the shadow's shape is drawn, in CSS px: past any tile's height, so only the shadow lands. */
const SHADOW_LIFT = 100_000;

// ── THE LIGHT (the approved picture's shader). A key light from the upper
// left, a fill from the right, the eye straight on; a warm ground bounce.
const unit = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const KEY = unit([-3, -6, 5]);
const FILL = unit([5, -2, 2]);
const EYE: Vec3 = [0, -1, 0];
const HALF_KEY = unit([KEY[0] + EYE[0], KEY[1] + EYE[1], KEY[2] + EYE[2]]);
const HALF_FILL = unit([FILL[0] + EYE[0], FILL[1] + EYE[1], FILL[2] + EYE[2]]);
const GAMMA = 2.2;
const GROUND = [0.6, 0.525, 0.435].map((c) => Math.pow(c, GAMMA));
const SHININESS = 30;

/**
 * A colour under the light, 0 … 255 per channel and not rounded, for the
 * direction the surface looks in (`normal`, a unit vector pointing out of
 * the side that is looked at).
 */
export function shade(base: Rgb, normal: Vec3): Shade {
  const kd = Math.max(dot(normal, KEY), 0);
  const fd = Math.max(dot(normal, FILL), 0);
  const sky = 0.5 + 0.5 * normal[1];
  const shine =
    Math.pow(Math.max(dot(normal, HALF_KEY), 0), SHININESS) * 1.4 * kd +
    Math.pow(Math.max(dot(normal, HALF_FILL), 0), SHININESS) * 0.5 * fd;
  const channel = (value: number, i: number) => {
    const linear =
      (Math.pow(value, GAMMA) *
        ((GROUND[i] + (1 - GROUND[i]) * sky) * 1.1 + 1.4 * kd + 0.5 * fd)) /
        Math.PI +
      0.076 * shine;
    return 255 * Math.pow(Math.min(1, Math.max(0, linear)), 1 / GAMMA);
  };
  return [channel(base[0], 0), channel(base[1], 1), channel(base[2], 2)];
}

/** How many samples a segment needs — by what it IS (its `kind`). */
export function samplesOf(segment: Segment): number {
  switch (segment.kind) {
    case 'fold':
      return 16;
    case 'arc':
      return Math.ceil((Math.abs(segment.turn) / (Math.PI / 2)) * 16);
    case 'wave':
    case 'ripple':
      return Math.ceil(segment.length * 32);
    case 'sway':
      return 32;
    case 'line':
      return Math.ceil(segment.length * 24);
  }
}

/**
 * One card's ribbon as a strip ready to paint, in the card's OWN coordinates,
 * mirrored when the column mirrors the card.
 */
export function buildStrip(
  model: CardModel,
  mirror: boolean,
  base: Rgb,
): readonly StripSample[] {
  const half = model.width / 2;
  const sx = mirror ? -1 : 1;
  const frontY = -model.T / 2;
  const us = [0];
  for (const segment of model.segments) {
    const n = samplesOf(segment);
    for (let i = 1; i <= n; i++) {
      us.push((segment.start + (segment.length * i) / n) / model.S);
    }
  }
  const points = us.map((u) => {
    const frame = model.evaluate(u);
    const p: Vec3 = [sx * frame.x, frame.y, frame.z];
    const B: Vec3 = [sx * frame.B[0], frame.B[1], frame.B[2]];
    return { u, p, B };
  });

  const strip: StripSample[] = [];
  let effort = 0;
  points.forEach(({ u, p, B }, i) => {
    const a = points[Math.max(0, i - 1)].p;
    const b = points[Math.min(points.length - 1, i + 1)].p;
    const along = unit([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
    const normal = unit([
      along[1] * B[2] - along[2] * B[1],
      along[2] * B[0] - along[0] * B[2],
      along[0] * B[1] - along[1] * B[0],
    ]);
    // The side turned to the viewer — the winding test, as geometry. The
    // ribbon is one colour, so the side only says which way its surface looks.
    const front = normal[1] < 0;
    if (i > 0) {
      const o = points[i - 1].p;
      const hidden = p[1] > frontY && o[1] > frontY;
      effort +=
        Math.hypot(p[0] - o[0], p[1] - o[1], p[2] - o[2]) *
        UNIT_PX *
        (hidden ? HIDDEN_PACE : 1);
    }
    strip.push({
      u,
      l: [p[0] - half * B[0], p[1] - half * B[1], p[2] - half * B[2]],
      r: [p[0] + half * B[0], p[1] + half * B[1], p[2] + half * B[2]],
      colour: shade(
        base,
        front ? normal : [-normal[0], -normal[1], -normal[2]],
      ),
      effort,
    });
  });
  return strip;
}

/** Between two points — or two colours, which are three numbers too. */
const mix = (a: Vec3, b: Vec3, f: number): Vec3 => [
  a[0] + (b[0] - a[0]) * f,
  a[1] + (b[1] - a[1]) * f,
  a[2] + (b[2] - a[2]) * f,
];

const css = (colour: Shade) =>
  `rgb(${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])})`;

/** The part of a polygon in front of the card's face (Sutherland–Hodgman, one plane). */
function inFront(polygon: readonly Vec3[], frontY: number): Vec3[] {
  const kept: Vec3[] = [];
  polygon.forEach((a, i) => {
    const b = polygon[(i + 1) % polygon.length];
    if (a[1] <= frontY) kept.push(a);
    if (a[1] <= frontY !== b[1] <= frontY) {
      const f = (frontY - a[1]) / (b[1] - a[1]);
      kept.push([a[0] + (b[0] - a[0]) * f, frontY, a[2] + (b[2] - a[2]) * f]);
    }
  });
  return kept;
}

/** One visible piece of a stretch: its polygon (card units, in front of the
 *  face) and the centre line's two ends and colours. */
type Piece = Readonly<{
  polygon: readonly Vec3[];
  from: Vec3;
  to: Vec3;
  colourFrom: Shade;
  colourTo: Shade;
}>;

/** The visible pieces of the stretch between the efforts `from` and `to`, in
 *  the order the ribbon travels — the one loop painting and outlining share. */
function* piecesOf(
  stretch: Stretch,
  from: number,
  to: number,
): Generator<Piece> {
  const { strip, frontY } = stretch;
  const last = strip.length - 1;
  let i = 0;
  while (i < last - 1 && strip[i + 1].effort <= from) i++;
  for (; i < last && strip[i].effort < to; i++) {
    const a = strip[i];
    const b = strip[i + 1];
    const span = b.effort - a.effort;
    const at = (f: number) => ({
      l: mix(a.l, b.l, f),
      r: mix(a.r, b.r, f),
      colour: mix(a.colour, b.colour, f),
    });
    const q0 = at(Math.max(0, (from - a.effort) / span));
    const q1 = at(Math.min(1, (to - a.effort) / span));
    const polygon = inFront([q0.l, q0.r, q1.r, q1.l], frontY);
    if (polygon.length < 3) continue;
    yield {
      polygon,
      from: mix(q0.l, q0.r, 0.5),
      to: mix(q1.l, q1.r, 0.5),
      colourFrom: q0.colour,
      colourTo: q1.colour,
    };
  }
}

/**
 * Paint the stretch between the efforts `from` and `to`, in the order the
 * ribbon travels — the part of it in front of the card's face. Painting
 * 0 … total at once, or the same range in pieces that end on whole samples,
 * gives the same pixels.
 */
export function paintStretch(
  ctx: CanvasRenderingContext2D,
  stretch: Stretch,
  from: number,
  to: number,
): void {
  const { place } = stretch;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const piece of piecesOf(stretch, from, to)) {
    const [x0, y0] = place(piece.from);
    const [x1, y1] = place(piece.to);
    if (Math.hypot(x1 - x0, y1 - y0) > 0.01) {
      const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      gradient.addColorStop(0, css(piece.colourFrom));
      gradient.addColorStop(1, css(piece.colourTo));
      ctx.fillStyle = gradient;
    } else {
      // Too short for a gradient to have a direction: its first colour.
      ctx.fillStyle = css(piece.colourFrom);
    }
    ctx.beginPath();
    piece.polygon.forEach((point, j) => {
      const [x, y] = place(point);
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * THE SHADOW's shape: the visible pieces of the stretch between the efforts
 * `from` and `to`, added to `path` as subpaths in canvas px — exactly what
 * paintStretch paints for the same range, as one path.
 */
export function outlineStretch(
  path: Path2D,
  stretch: Stretch,
  from: number,
  to: number,
): void {
  for (const piece of piecesOf(stretch, from, to)) {
    piece.polygon.forEach((point, j) => {
      const [x, y] = stretch.place(point);
      if (j === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    });
    path.closePath();
  }
}

/**
 * THE SHADOW, painted under whatever the canvas holds: `path`'s drop shadow,
 * `dy` CSS px down and blurred by `blur` CSS px (the drop-shadow's own two
 * numbers; the blur's standard deviation is half of it, as the filter's was),
 * in `colour` at SHADOW_ALPHA — and nothing else lands. A canvas's shadow
 * offset and blur ignore its transform, so the canvas's own scale is applied
 * to both here.
 */
export function paintShadow(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  colour: Rgb,
  dy: number,
  blur: number,
): void {
  const { a: scaleX, d: scaleY } = ctx.getTransform();
  const channels = colour.map((c) => Math.round(c * 255)).join(', ');
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  ctx.shadowColor = `rgba(${channels}, ${SHADOW_ALPHA})`;
  ctx.shadowBlur = blur * Math.max(scaleX, scaleY);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = (SHADOW_LIFT + dy) * scaleY;
  ctx.translate(0, -SHADOW_LIFT);
  ctx.fillStyle = '#000000';
  ctx.fill(path);
  ctx.restore();
}
