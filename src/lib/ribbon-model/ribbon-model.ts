// lib/ribbon-model — THE FLOSS RIBBON'S MATHEMATICS: one card's ribbon as a
// chain of segments along its own arc length, the gauge rule that sizes it,
// the lanes it runs in, and the one number that says whether it covers a
// word. No DOM, no canvas, no React, no import at all (CLAUDE.md §4's
// foundation ring, fence-tested by tests/unit/lib-react-free.test.ts): numbers
// in, numbers out. lib/ribbon-layout turns a page into this module's input,
// lib/ribbon-paint turns its output into pixels, lib/ribbon-draw decides when
// (CLAUDE.md §15.26 — the floss-ribbon run).
//
// ── WHAT THE RIBBON DOES, looking at a card from the front: it comes down from
// above just left of the top-right corner, swaying a little (`drop`); curves
// right on a circle and bends round the card's right edge (`hook`, `rfold1`);
// crosses the side face, goes behind the card — where its ONE half twist is,
// where nobody sees it — and over the top face (`rside` … `tcross`); comes
// down over the top edge and eases into the top lane (`tfold2`, `lead`); runs
// right to left across the top lane in a low ripple, flat on the face — a
// valley, a crest, a valley (`t`, THE TOP RIPPLE); curls up out of the last
// valley and over the top edge again (`lift` … `xfold2`); goes behind the
// card on a diagonal to the back-left edge (`dturn`, `dback`); round that edge
// onto the front at 35° from the vertical (`fold1` … `dease`); and runs down
// the left lane as a calm wave to where the next card's drop-in begins (`d`).
// The next card is the same ribbon MIRRORED (lib/ribbon-layout), so the column
// is one ribbon — and the FIRST card's drop-in and hook, built here like every
// card's, are never drawn: nothing arrives from above it, and the owner saw a
// ribbon that "starts from nowhere" (lib/ribbon-draw, THE FIRST CARD HAS NO
// HEAD, 2026-10-01) — its ribbon is first seen coming over its top edge into
// the ripple. No loops (fb-489), the hook lower (fb-492), the drop-in a
// little wavy (fb-494), the tail in the air (fb-504) — the owner's words are
// in §15.26. Until 2026-10-01 the top lane carried a second calm wave, which
// ran four to five humps across a desktop card's top edge, rolling as it
// went; the owner found it "too much" and asked for "something simpler, more
// physically plausible" — then, shown a straight run, for "a second degree
// function", and shown that bow, for "3 waves … pretty low, pretty smooth"
// (§15.26 round 3).
//
// ── COORDINATES AND UNITS. Card-centred: x right, z up, y depth — the viewer
// at −y, the card's front face at y = −T/2. One card unit is UNIT_PX = 100 CSS
// px. Every size of the ribbon is a multiple of the GAUGE k (its width is
// 0.25 k), and the gauge follows from the column's width by gaugeRule().
//
// ── THE CHAIN. A segment lives on [start, start + length] of the centre line's
// arc length; its local time is t = clamp((S u − start) / length, 0, 1), S the
// whole length and u ∈ [0, 1]. Every segment contributes a displacement, a
// heading increment φ and a roll increment ψ, each CONSTANT outside its own
// window, so the sum over all segments is a continuous path. The ribbon's
// surface is
//     R(u, v) = P(u) + 0.25 k (v − ½) B(u),
//     B = cos ψ (−sin φ, 0, cos φ) + sin ψ (0, 1, 0)      — the width vector.
// The half twist is the one OVERLAY: a roll of π eased over the hidden S,
// contributing ψ and nothing else (`twist`).
//
// ── A PORT, TO NINE DECIMALS. The ribbon began as the owner's own design
// package — a verified mathematical model, pasted on 2026-09-29, the owner's
// and never part of this repository. The package had more levers than the
// approved ribbon uses; a throwaway prototype in plain JavaScript turned it
// into the ribbon the owner approved ("it looks good, moves good, feels good",
// fb-511 · "build it", fb-512), and wrote out its own numbers for six real
// layouts: `ribbon-model.golden.ts`, a frozen record this module's test
// rebuilds to 1e-9. From the day that test passes this file is the ribbon's
// single source; a change of the DESIGN, on the owner's word, re-writes the
// record from here and the change-set shows every number that moved. That has
// happened twice: on 2026-09-30 the waves were made SMOOTH BESIDE A KEEP-OUT
// (wave(), on the owner's word), and the record's numbers on the four cards
// whose side wave a keep-out holds back were written again from this module;
// on 2026-10-01 the TOP WAVE BECAME THE TOP RIPPLE (buildCard, on the owner's
// word), which moves, on every card, the `t` segment's kind and shape, the
// two arcs beside it (they turn less), S and every later start — the chain is
// a little longer, the arcs a little shorter — and the heading of every
// sample before the run by 5.1e-5 rad (the old wave's finite-difference
// heading at its start was not exactly zero, and a segment's start value is
// added to every point before it). The painter's record (lib/ribbon-paint)
// moves from the lead arc on.
//
// ── NO DEAD CODE (the approval's own sentence: "i want no dead code"). Only
// the ribbon is ported, not the package: the loop-era segments (`Shift`,
// `HFold`), the tucked tail the owner rejected ("ends in the air all day"),
// and every lever that does nothing at its approved value are absent. The
// wave's drifts are zero in the approved design, so its hump profile is
// plain sin(x) and its tilt the constant T_0 — `1 · sin(x + 0)` and `sin(x)`
// are the same number, and the record agrees. Likewise the hidden S behind the
// entry corner: every length at that corner is a multiple of the gauge, so the
// heading the design wishes for (H_MID) solves every card, and the
// prototype's search over its neighbours never left the wish — this module
// solves once, and the test pins the answer on all six cards.
//
// ── NO CLASS, AND NO NAME IS EVER READ. The prototype's one serious bug: it
// recognised a segment by `constructor.name`, a minifier renamed the classes,
// and the first minified page drew every wave as a straight bar. Here every
// segment is a plain object made by a small factory and carries its `kind`
// as data — 'line' | 'arc' | 'fold' | 'sway' | 'wave' — which is what
// lib/ribbon-paint reads; nothing reads `.constructor`, a function's `.name`
// or a segment's own `name` (tests/unit/ribbon-no-names.test.ts). The builder
// steps below return the segment they lay, so buildCard holds each one by
// its variable, never looks one up.

/** A point or a direction in card space: x right, y depth, z up. */
export type Vec3 = readonly [number, number, number];

/** A keep-out box in card coordinates: its centre and its HALF sizes, in card units. */
export type KeepOut = Readonly<{ x: number; z: number; w: number; h: number }>;

/**
 * What the page gives one card, in card units: its width W (the column's, the
 * first card's — lib/ribbon-layout), its height H, the gap G under it to the
 * next card's top (or the tail's room), the gauge k, and the blocks the ribbon
 * must never cover — already mirrored into this card's frame.
 */
export type CardInput = Readonly<{
  W: number;
  H: number;
  G: number;
  k: number;
  boxes: readonly KeepOut[];
}>;

/** What a segment IS — the painter reads this, never a name (the header). */
export type SegmentKind = 'line' | 'arc' | 'fold' | 'sway' | 'wave' | 'ripple';

/** The prototype's nine pieces of a card's ribbon. */
export type AtomName =
  | 'dropIn'
  | 'hookEntry'
  | 'wrapEntry'
  | 'leadOut'
  | 'rippleTop'
  | 'liftExit'
  | 'wrapExit'
  | 'reentry'
  | 'waveSide';

/** What every segment is: a window of arc length and three increments. */
type Piece = Readonly<{
  name: string;
  start: number;
  length: number;
  /** The displacement from where the segment starts, at its local time t. */
  xyz(t: number): Vec3;
  /** The heading increment at t. */
  phi(t: number): number;
  /** The roll increment at t. */
  psi(t: number): number;
}>;

/** One segment of the chain — `kind` says what it IS; an arc also says how far it turns (radians). */
export type Segment =
  | (Piece & Readonly<{ kind: Exclude<SegmentKind, 'arc'> }>)
  | (Piece & Readonly<{ kind: 'arc'; turn: number }>);

/** The card's one half twist: a roll of `dpsi`, eased over [start, start + length]. */
type Twist = Readonly<{ start: number; length: number; dpsi: number }>;

/** A piece of the ribbon as a range of u — one of the prototype's nine atoms. */
type Atom = Readonly<{ u0: number; u1: number; length: number }>;

/** The centre line at one u: position, heading, roll, and the width vector. */
type Frame = Readonly<{
  x: number;
  y: number;
  z: number;
  phi: number;
  psi: number;
  B: Vec3;
}>;

export type CardModel = Readonly<{
  /** The card's thickness in the model, 0.5 k: the front face is at y = −T/2. */
  T: number;
  /** The waves' period, as a multiple of the gauge: 2.3 (0.8 / k)^0.6. */
  l: number;
  /** The centre line's whole length. */
  S: number;
  /** The ribbon's width, 0.25 k. */
  width: number;
  /** The nine pieces, by name. */
  atoms: Readonly<Record<AtomName, Atom>>;
  /** In the order they are travelled. */
  segments: readonly Segment[];
  twist: Twist;
  /** The hidden S behind the entry corner: its middle heading (degrees), its arcs' radius, its straight. */
  hidden: Readonly<{ hMid: number; rho: number; L: number }>;
  /** The entry's measures: the sway, the drop, how far below the top edge the hook leaves, and reaches. */
  entry: Readonly<{
    sway: number;
    dropL: number;
    sideOut: number;
    hookLow: number;
    reach: number;
  }>;
  evaluate(u: number): Frame;
  /** A point of the ribbon: u along it, v ∈ [0, 1] across it. */
  surface(u: number, v: number): Vec3;
}>;

/** One card unit, in CSS px (the prototype's PX). */
export const UNIT_PX = 100;

// ── THE GAUGE RULE (fb-489, fb-501, fb-510 "agree"). The desktop keeps the
// ratio of the picture the owner approved — k = 0.8 on a card 10.09 units
// wide; the phone is BOLDER — k = 0.125 W on a card 2.97 wide ("b all day");
// one straight line between the two, the desktop's own ratio above the
// desktop's card: no jump anywhere, and no breakpoint.
// KEEP IN SYNC with ui/Ribbon's `--ribbon-k` (`COLUMN` there), which spells
// this rule in CSS as `max(RATIO × 100cqw, 100 (BOLD − SLOPE × 2.97) px +
// SLOPE × 100cqw)`; tests/unit/ribbon-lanes-sync.test.ts reads the numbers
// back from gaugeRule() and finds them in that class string, and
// ui/Ribbon/Ribbon.test.tsx measures the result in a browser.
const DESKTOP_W = 10.09;
const DESKTOP_K = 0.8;
const PHONE_W = 2.97;
const RATIO = DESKTOP_K / DESKTOP_W;
const BOLD = 0.125 * PHONE_W;
const SLOPE = (DESKTOP_K - BOLD) / (DESKTOP_W - PHONE_W);

// ── THE DESIGN: every number of the approved ribbon, each spelled once. A
// length marked (× k) is a multiple of the gauge.
/** The card's thickness in the model (× k). */
const THICKNESS = 0.5;
/** The waves' period on the approved desktop (× k), and how much longer it grows on a narrower gauge. */
const WAVELENGTH = 2.3;
const WAVELENGTH_GROWTH = 0.6;
/** R — the diagonal the re-entry runs on the front face (× k). */
const R = 0.4;
/** θ — the re-entry's angle from the vertical (degrees). */
const THETA = 35;
/** r_1 — the hook's circle, the old entry loop's own (× k). */
const R_1 = 0.5;
/** Where that circle sat, in r_1: its centre 0.51 r_1 inside the right edge and 0.07 r_1 above the top edge. */
const LOOP_X = 0.51;
const LOOP_Z = 0.07;
/** r_2 — the old exit loop; the turn onto the hidden diagonal is 0.8 of it (× k). */
const R_2 = 0.5;
/** t_0 — the tilt every hump leans by. */
const T_0 = -0.3;
/** A — the waves' amplitude (× k). */
const A = 0.2;
/** r — how much a wave rolls with its humps. */
const ROLL = 0.5;
/** M — the air kept between the ribbon and a keep-out, in card units. */
const M = 0.08;
/** D — how much of a hump survives beside a keep-out the wave meets: on the
 *  side AWAY from it, and — the base line keeps that hump's room (wave()) —
 *  towards it too. */
const D = 0.35;
/** The half-width over which a hinge is rounded (× k): where a wave's base
 *  line eases onto a limit, and where a hump fades in or becomes whole
 *  (wave()'s SMOOTH BESIDE A KEEP-OUT). */
const SOFT = 0.05;
/** p_d — the side wave's phase (radians). */
const P_D = 1.2;
/** THE TOP RIPPLE's three bumps (the owner, 2026-10-01: "3 waves … like some
 *  pretty well distributed normal distributions … of slightly different
 *  widths so that they do not look that mechanical"): where each sits along
 *  the run (a share of it), its standard deviation (a share of the run), and
 *  which way it bends — a VALLEY into the card (+1) or the CREST towards the
 *  top edge (−1). Not quite even, not quite alike, on purpose. */
const RIPPLE = [
  { at: 0.22, width: 0.1, sense: 1 },
  { at: 0.52, width: 0.115, sense: -1 },
  { at: 0.79, width: 0.095, sense: 1 },
] as const;
/** How deep a valley hangs and how high the crest rises, as shares of the
 *  run — "pretty low" — before the lane's room and the top edge's headroom
 *  cap them (THE TOP RIPPLE, in buildCard). */
const DIP = 0.03;
const CREST = 0.015;
/** The air kept between the crest's upper edge and the card's top edge (× k):
 *  the whole ripple stays inside the card. */
const HEADROOM_AIR = 0.04;
/** How finely the ripple is scanned for its extremes before each is refined (THE TOP RIPPLE). */
const RIPPLE_GRID = 200;
/** The golden-section steps that refine an extreme: 0.618^60 of a grid cell, far under nine decimals. */
const PEAK_STEPS = 60;
/** The ribbon's width (× k). */
const WIDTH = 0.25;
/** How far a wave's humps rise towards the viewer (× k), and their pace against the wave's own. */
const BULGE = 0.12;
const BULGE_PACE = 0.7;
/** The arc that eases the re-entry to vertical (× k). */
const R_EASE = 0.9;
/** The radius of a bend round an edge (× k). */
const R_FOLD = 0.08;
/** How far beyond the card's edge a bend round it runs (× k). */
const EPS = 0.006;
/** β — the angle, from the edge, at which the ribbon crosses the top edge (degrees). */
const BETA = 35;
/** The arcs that ease the ribbon onto and off the top edge (× k). */
const R_LEAD = 0.9;
/** The air between the returning ribbon and the drop-in line (× k). */
const M_E = 0.08;
/** The heading of the hidden S behind the entry corner (degrees). */
const H_MID = 85;
/** The hidden diagonal's reach behind the exit corner (× k). */
const D_B = 0.15;
/** fb-492 "like 100% lower": how much farther below the top edge the hook leaves, as a share of where the old loop's circle put it. */
const LOWER = 1;
/** fb-494 "a little wavy": the drop-in's sway (× k), its periods along the drop, and the roll that goes with it (radians). */
const A_E = 0.06;
const N_E = 1;
const R_E = 0.15;
/** The length over which the side wave fades before the next drop-in (× k). */
const TAIL_D = 1;
/** The taper of a wave's window, and of the window that pins its keep-out pushes to zero at its ends. */
const TAPER = 0.3;
const TAPER0 = 0.12;
/** The finite-difference step for a wave's heading. */
const FD_H = 0.002;
/** How the side wave runs: FREE at its own phase, its humps' bulge at theirs,
 *  and it fades out over a TAIL before the next drop-in. (Until 2026-10-01 a
 *  second, BONDED shape ran the top lane — it ended on a hump pointing into
 *  the card, where the lift curled up out of it; the top run is straight now,
 *  and that branch is gone with it.) */
type WaveShape = Readonly<{ bulgePhase: number; phase: number; tail: number }>;

/**
 * The gauge the owner approved for a column `W` card units wide.
 * k = max(RATIO · W, BOLD + SLOPE · (W − 2.97)).
 */
export function gaugeRule(W: number): number {
  return Math.max(RATIO * W, BOLD + SLOPE * (W - PHONE_W));
}

/**
 * The lanes the ribbon runs in, in CSS px, for the gauge k: the card's top
 * padding, its side padding, and the gap between two cards. Never under the
 * 24px (1.5rem) a card keeps outside a ribbon.
 * KEEP IN SYNC with ui/Ribbon's `--ribbon-lane-top`, `--ribbon-lane-side` and
 * `--ribbon-gap` (`COLUMN` there) — the same pair of pins as gaugeRule().
 */
export function lanes(k: number): Readonly<{
  top: number;
  side: number;
  gap: number;
}> {
  return {
    top: Math.max(24, 62 * k + 8),
    side: Math.max(24, 60 * k + 12, 83 * k + 1),
    gap: 100 * k + 60,
  };
}

/**
 * How deep any VISIBLE point (y ≤ frontY) sits inside any keep-out grown by
 * M / 2 — the deepest one, in card units, measured to the box's nearer side;
 * 0 means clear. The prototype's clearance check as one pure number, for two
 * callers: lib/ribbon-draw's guard (on the painter's own strip) and the tests
 * (fine sampling).
 */
export function penetration(
  points: readonly Vec3[],
  boxes: readonly KeepOut[],
  frontY: number,
): number {
  let deepest = 0;
  for (const [x, y, z] of points) {
    if (y > frontY) continue;
    for (const box of boxes) {
      const dx = box.w + M / 2 - Math.abs(x - box.x);
      const dz = box.h + M / 2 - Math.abs(z - box.z);
      if (dx > 0 && dz > 0) deepest = Math.max(deepest, Math.min(dx, dz));
    }
  }
  return deepest;
}

// ── SCALAR AND VECTOR HELPERS ────────────────────────────────────────────────

const PI = Math.PI;
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);
/** A half-cosine ease from 0 to 1. */
const ease = (t: number) => 0.5 * (1 - Math.cos(PI * t));
/** A window pinned at both ends: rises over `taper`, falls over `endTaper`. */
function pinned(t: number, taper: number, endTaper: number): number {
  const s = Math.sin(0.5 * PI * Math.min(t / taper, (1 - t) / endTaper, 1));
  return s * s;
}

/** A smooth step from 0 to 1. */
const smoothstep = (u: number) => u * u * (3 - 2 * u);

/**
 * max(0, x) with its corner rounded: 0 below −w, x above +w, and between
 * them the integral of a smooth step — never below max(0, x).
 */
function knee(x: number, w: number): number {
  if (x <= -w) return 0;
  if (x >= w) return x;
  const s = (x + w) / (2 * w);
  return 2 * w * s * s * s * (1 - 0.5 * s);
}

/**
 * The share of a whole hump that fits in a room of x amplitudes: never below
 * 0, never above max(0, x), never above 1, and eased over the width w at
 * both ends — a hump fades in over its first w of room, and becomes whole
 * over ± w round 1 (that second easing never wider than 1: no room is no hump).
 */
function fit(x: number, w: number): number {
  const g = x <= 0 ? 0 : x >= w ? x : x * smoothstep(x / w);
  return g - knee(g - 1, Math.min(w, 1));
}

/** A direction in the card plane, with the rounding noise of an axis snapped
 *  to zero — so a run along an axis is exactly along it. */
const snap = (c: number) => Math.round(c * 1e12) / 1e12;
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/**
 * Where an arc of radius 1 in the card plane takes the ribbon while its
 * heading turns from `from` to `to` — signed so the radius is positive either
 * way round. The hidden S solves with the same chords the arcs are laid with.
 */
function bend(from: number, to: number): readonly [number, number] {
  const sense = to >= from ? 1 : -1;
  return [
    sense * (Math.sin(to) - Math.sin(from)),
    -sense * (Math.cos(to) - Math.cos(from)),
  ];
}

/** The card's x and z axes — the two directions an edge of the card runs in. */
const AXES = { x: [1, 0, 0], z: [0, 0, 1] } as const satisfies Record<
  string,
  Vec3
>;
type Axis = keyof typeof AXES;

/** Rotate v about the card's x or z axis by the angle a (right-handed). */
function rotate(axis: Axis, a: number, v: Vec3): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return axis === 'z'
    ? [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]
    : [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
}

/** The width vector of the heading φ and the roll ψ. */
function frameB(phi: number, psi: number): Vec3 {
  return [
    -Math.cos(psi) * Math.sin(phi),
    Math.sin(psi),
    Math.cos(psi) * Math.cos(phi),
  ];
}

/**
 * The (φ, ψ) that spell the width vector B, on the branch nearest to a
 * reference pair. cos ψ keeps its sign through a quarter turn (|B_y| < 1
 * there), which is what picks the branch.
 */
function frameAngles(
  B: Vec3,
  phiRef: number,
  psiRef: number,
): readonly [number, number] {
  const up = Math.cos(psiRef) >= 0;
  // Clamped: a rotated unit vector can land a rounding error past ±1, where
  // asin has no answer.
  const a = Math.asin(Math.max(-1, Math.min(1, B[1])));
  let psi = up ? a : PI - a;
  let phi = up ? Math.atan2(-B[0], B[2]) : Math.atan2(B[0], -B[2]);
  psi += 2 * PI * Math.round((psiRef - psi) / (2 * PI));
  phi += 2 * PI * Math.round((phiRef - phi) / (2 * PI));
  return [phi, psi];
}

// ── THE BUILDER: a pen that lays segments one after another ──────────────────

/** The pen's state while one card's chain is laid, and the card's own sizes. */
type Pen = {
  readonly k: number;
  readonly T: number;
  /** The radius of a bend round an edge (R_FOLD × k). */
  readonly gap: number;
  readonly width: number;
  readonly boxes: readonly KeepOut[];
  /** The waves' period, in card units. */
  readonly period: number;
  /** Where the pen is in the card plane. (Its depth is never needed: every
   *  move that follows is laid from x and z alone.) */
  x: number;
  z: number;
  phi: number;
  psi: number;
  /** The heading in the card plane that the next straight or arc follows. */
  th: number;
  /** The arc length laid so far. */
  s: number;
  /** The direction of travel in 3D, and the outward normal of the face the ribbon lies on. */
  tan: Vec3;
  out: Vec3;
  readonly segments: Segment[];
};

function lay(pen: Pen, segment: Segment): Segment {
  pen.segments.push(segment);
  pen.s += segment.length;
  return segment;
}

/** A straight run by `disp`, of length L; the direction of travel is left as it was. */
function straight(pen: Pen, name: string, disp: Vec3, L: number): Segment {
  pen.x += disp[0];
  pen.z += disp[2];
  return lay(pen, {
    kind: 'line',
    name,
    start: pen.s,
    length: L,
    xyz: (t) => [disp[0] * t, disp[1] * t, disp[2] * t],
    phi: () => 0,
    psi: () => 0,
  });
}

/** A straight run of length L along the current heading in the card plane. */
function line(pen: Pen, name: string, L: number): Segment {
  return straight(
    pen,
    name,
    [L * Math.cos(pen.th), 0, L * Math.sin(pen.th)],
    L,
  );
}

/** A straight run by `disp` that also sets the direction of travel. */
function lineDisp(pen: Pen, name: string, disp: Vec3, L: number): Segment {
  pen.tan = [disp[0] / L, disp[1] / L, disp[2] / L];
  return straight(pen, name, disp, L);
}

/** Straight across a side face or the top face, until the ribbon has crossed the card's thickness. */
function across(pen: Pen, name: string): Segment {
  const L = pen.T / Math.abs(pen.tan[1]);
  return lineDisp(
    pen,
    name,
    [pen.tan[0] * L, pen.tan[1] * L, pen.tan[2] * L],
    L,
  );
}

/** A circular arc in the card plane: radius `rad`, turning the heading by `dth`. */
function arc(pen: Pen, name: string, rad: number, dth: number): Segment {
  const th0 = pen.th;
  const th1 = th0 + dth;
  const [cx, cz] = bend(th0, th1);
  const segment = lay(pen, {
    kind: 'arc',
    name,
    turn: dth,
    start: pen.s,
    length: rad * Math.abs(dth),
    xyz: (t) => {
      const [a, b] = bend(th0, th0 + dth * t);
      return [rad * a, 0, rad * b];
    },
    phi: (t) => dth * t,
    psi: () => 0,
  });
  pen.x += rad * cx;
  pen.z += rad * cz;
  pen.phi += dth;
  pen.th = th1;
  pen.tan = [Math.cos(th1), 0, Math.sin(th1)];
  return segment;
}

/**
 * A quarter turn round the edge that runs along `axis`, from the face the
 * ribbon is on to the next — vertical edges (axis z) and horizontal ones
 * (axis x), in either sense. The centre line is a quarter helix of radius
 * R_FOLD k about the edge; the frame is the EXACT rotation of the width vector
 * about that edge.
 */
function fold(pen: Pen, name: string, axis: Axis): Segment {
  const r = pen.gap;
  const e = AXES[axis];
  const T0 = pen.tan;
  const par = dot(T0, e);
  const perp: Vec3 = [
    T0[0] - par * e[0],
    T0[1] - par * e[1],
    T0[2] - par * e[2],
  ];
  const sp = Math.hypot(perp[0], perp[1], perp[2]);
  // The radial direction of a right-handed turn; the ribbon stays on its
  // face's OUTER side, which picks the sense.
  const side = cross([perp[0] / sp, perp[1] / sp, perp[2] / sp], e);
  const turn = dot(side, pen.out) >= 0 ? 1 : -1;
  const c0: Vec3 = [turn * side[0], turn * side[1], turn * side[2]];
  const arcLength = 0.5 * PI * r;
  /** How far the ribbon travels ALONG the edge while it turns. */
  const advance = (arcLength * par) / sp;
  const phi0 = pen.phi;
  const psi0 = pen.psi;
  const B0 = frameB(phi0, psi0);
  const angles = (t: number) =>
    frameAngles(rotate(axis, turn * 0.5 * PI * t, B0), phi0, psi0);
  const xyz = (t: number): Vec3 => {
    const c = rotate(axis, turn * 0.5 * PI * t, c0);
    return [
      r * (c[0] - c0[0]) + advance * t * e[0],
      r * (c[1] - c0[1]) + advance * t * e[1],
      r * (c[2] - c0[2]) + advance * t * e[2],
    ];
  };
  const segment = lay(pen, {
    kind: 'fold',
    name,
    start: pen.s,
    length: arcLength / sp,
    xyz,
    phi: (t) => angles(t)[0] - phi0,
    psi: (t) => angles(t)[1] - psi0,
  });
  const [dx, , dz] = xyz(1);
  pen.x += dx;
  pen.z += dz;
  [pen.phi, pen.psi] = angles(1);
  pen.tan = rotate(axis, turn * 0.5 * PI, T0);
  pen.out = rotate(axis, turn * 0.5 * PI, c0);
  // Back on the front or the back face: the heading in the card plane is
  // meaningful again.
  if (Math.abs(pen.out[1]) > 0.5) pen.th = Math.atan2(pen.tan[2], pen.tan[0]);
  return segment;
}

/**
 * The drop-in (fb-494, "a little wavy"): a straight run of length L along the
 * current heading that SWAYS — a small lateral sine under a window pinned at
 * both ends, so it starts and ends on its own line, heading along it. The
 * first lobe leans AWAY from the card's edge, above the card; the second
 * leans TOWARD it, across the top edge, turning the way the hook turns. The
 * heading is the curve's own, from the analytic derivative; the roll follows
 * the sway, as it does in the waves.
 */
function sway(pen: Pen, name: string, L: number): Segment {
  const d = [snap(Math.cos(pen.th)), snap(Math.sin(pen.th))] as const;
  const p = [-d[1], d[0]] as const;
  const amp = -A_E * pen.k;
  const window = (t: number) => pinned(t, TAPER, TAPER);
  const slope = (t: number) => {
    if (t >= TAPER && t <= 1 - TAPER) return 0;
    return (
      (t < 0.5 ? 1 : -1) *
      ((0.5 * PI) / TAPER) *
      Math.sin((PI * Math.min(t, 1 - t)) / TAPER)
    );
  };
  const lat = (t: number) => amp * window(t) * Math.sin(2 * PI * N_E * t);
  const dlat = (t: number) => {
    const th = 2 * PI * N_E * t;
    return (
      amp * (slope(t) * Math.sin(th) + window(t) * 2 * PI * N_E * Math.cos(th))
    );
  };
  const segment = lay(pen, {
    kind: 'sway',
    name,
    start: pen.s,
    length: L,
    xyz: (t) => {
      const a = lat(t);
      const run = L * t;
      return [d[0] * run + p[0] * a, 0, d[1] * run + p[1] * a];
    },
    phi: (t) => Math.atan2(dlat(t), L),
    psi: (t) => Math.sign(amp) * R_E * window(t) * Math.sin(2 * PI * N_E * t),
  });
  pen.x += d[0] * L;
  pen.z += d[1] * L;
  return segment;
}

/** A lateral profile along a run: its offset at t (card units, positive
 *  towards the run's LEFT — into the card on the top run) and its slope
 *  d(offset)/dt. */
type Profile = Readonly<{
  h: (t: number) => number;
  dh: (t: number) => number;
}>;

/**
 * The largest value of `f` on [t0, t1], where it rises then falls — a
 * golden-section search over a fixed number of steps, so every engine lands
 * on the same number.
 */
function peak(f: (t: number) => number, t0: number, t1: number): number {
  const G = (Math.sqrt(5) - 1) / 2;
  let a = t0;
  let b = t1;
  let c = b - G * (b - a);
  let d = a + G * (b - a);
  let fc = f(c);
  let fd = f(d);
  for (let i = 0; i < PEAK_STEPS; i++) {
    if (fc < fd) {
      a = c;
      c = d;
      fc = fd;
      d = a + G * (b - a);
      fd = f(d);
    } else {
      b = d;
      d = c;
      fd = fc;
      c = b - G * (b - a);
      fc = f(c);
    }
  }
  return Math.max(fc, fd, f(t0), f(t1));
}

/** The largest value of `f` on [0, 1]: a scan of RIPPLE_GRID cells, then the best cell's neighbourhood refined. */
function largest(f: (t: number) => number): number {
  let best = 0;
  let at = 0;
  for (let j = 0; j <= RIPPLE_GRID; j++) {
    const value = f(j / RIPPLE_GRID);
    if (value > best) {
      best = value;
      at = j;
    }
  }
  if (best <= 0) return 0;
  return peak(
    f,
    Math.max(0, (at - 1) / RIPPLE_GRID),
    Math.min(1, (at + 1) / RIPPLE_GRID),
  );
}

/** A normal-distribution bump: exp(−((t − at) / width)² / 2), and its slope. */
const bell = (t: number, at: number, width: number) =>
  Math.exp(-0.5 * ((t - at) / width) ** 2);
const bellSlope = (t: number, at: number, width: number) =>
  (-(t - at) / (width * width)) * bell(t, at, width);

/**
 * The ripple's two shapes, each LEVELLED — the straight line through its two
 * end values taken away, so it is 0 at both ends and the run lands where it
 * is aimed: a(t), the valleys together; b(t), the crest alone. The profile is
 * D a(t) − U b(t) for a depth D and a height U (THE TOP RIPPLE).
 */
function rippleShapes(): Readonly<{ a: Profile; b: Profile }> {
  const shape = (sense: 1 | -1): Profile => {
    const bumps = RIPPLE.filter((bump) => bump.sense === sense);
    const raw = (t: number) =>
      bumps.reduce((sum, bump) => sum + bell(t, bump.at, bump.width), 0);
    const rawSlope = (t: number) =>
      bumps.reduce((sum, bump) => sum + bellSlope(t, bump.at, bump.width), 0);
    const h0 = raw(0);
    const h1 = raw(1);
    return {
      h: (t) => raw(t) - (1 - t) * h0 - t * h1,
      dh: (t) => rawSlope(t) + h0 - h1,
    };
  };
  return { a: shape(1), b: shape(-1) };
}

/**
 * THE RIPPLE (the owner, 2026-10-01): a run from the pen to `end` = [x, z]
 * whose lateral offset is `profile`, flat on the face, no roll; its heading
 * is the profile's own, so it is tangent to an arc that arrives at its start
 * slope and leaves at its end slope. The chord sets the direction.
 */
function ripple(
  pen: Pen,
  name: string,
  end: readonly [number, number],
  profile: Profile,
): Segment {
  const dx = end[0] - pen.x;
  const dz = end[1] - pen.z;
  const L = Math.hypot(dx, dz);
  const d = [snap(dx / L), snap(dz / L)] as const;
  const p = [-d[1], d[0]] as const;
  const slope = (t: number) => Math.atan2(profile.dh(t), L);
  const s0 = slope(0);
  const segment = lay(pen, {
    kind: 'ripple',
    name,
    start: pen.s,
    length: L,
    xyz: (t) => {
      const run = L * t;
      const a = profile.h(t);
      return [d[0] * run + p[0] * a, 0, d[1] * run + p[1] * a];
    },
    phi: (t) => slope(t) - s0,
    psi: () => 0,
  });
  const turned = slope(1) - s0;
  pen.x = end[0];
  pen.z = end[1];
  pen.phi += turned;
  pen.th += turned;
  pen.tan = [Math.cos(pen.th), 0, Math.sin(pen.th)];
  return segment;
}

/**
 * A calm wave from the pen to `end` = [x, z], along the current heading (an
 * axis of the card): a run of length L with a lateral hump profile sin θ and
 * a shear T_0 sin θ along it, under a window pinned at both ends, kept clear
 * of every keep-out — and SMOOTH beside one (below). The side wave is its one
 * consumer since 2026-10-01: the top run is straight (buildCard).
 *
 *   θ(t) = 2π n t + phase
 *   n = L / (l k), and A_eff = A k min(1, 0.7 n)² — a short wave is a calmer one.
 *
 * Keep-outs: box i projects on the run to [a1, a2] (in t) and has a lateral
 * limit lmax_i = (its near edge) − w/2 − M, which no part of the wave may
 * pass; its plateau p_i(t) is 1 over the box with smooth ramps, pinned to
 * zero at the wave's ends. Beside box i the wave keeps the share
 *   keep_i = 1 − eng_i (1 − D),  eng_i = clamp((2 A_eff − lmax_i) / A_eff)
 * of a hump — D of one beside a box it meets, a whole one beside a box its
 * base line only drifts towards — and its BASE LINE stays that hump's
 * amplitude short of the limit: limit_i = lmax_i − A_eff keep_i. With the
 * boxes in the order of their limits, the nearest first, and
 *   ∪(ask) = Σ_i (ask_i − ask_{i+1}) (1 − Π_{j ≤ i} (1 − p_j))      THE LAYERED UNION
 * the wave is
 *   route(t) = δ′ ease(t) − ∪(knee(δ′ ease(t) − limit_i))           the base line, held off every limit
 *   C+ (toward a box) = 1 − ∪(1 − fit((lmax_i − route) / A_eff))     a hump never larger than its room
 *   C− (away)         = 1 − ∪(1 − keep_i)
 *   lat(t) = route + A_eff Env(t) sin θ (C− + (C+ − C−) σ),  σ = ease(clamp((sin θ + 0.3) / 0.6))
 * The heading is atan2(d lat, d along) by central differences; the roll is
 * r Env sin θ C−; the humps rise towards the viewer by
 * y = −bulge Env (1 + sin(0.7 · 2π n t + bulgePhase)) / 2.
 *
 * ── SMOOTH BESIDE A KEEP-OUT (the owner, 2026-09-30: "it looks like a
 * rectangle … i want a smooth one"). Until that day the base line was
 * clamped ON the limit by a hard max(0, ·): where its drift met a limit it
 * turned a CORNER — 4.75° on the card the owner was looking at, 10.5° on a
 * German card with a short side wave, 5° to 8° on a phone — and from there
 * it lay on the limit with no room left, so the hump towards the card was
 * cancelled and the ribbon ran as a ruler line for half a wavelength, evenly
 * lit: a rectangle. Three things changed, and a wave no keep-out touches —
 * no hump of it damped, its base line free — is the same to the last bit
 * (one that a box only damps differs by rounding beside a single box, and
 * by hundredths of a px where two boxes' plateaus overlap):
 *   · THE KNEE. knee(x) is max(0, x) with its corner rounded over ± SOFT k —
 *     never below max(0, x), so a rounded push only ever pushes more.
 *   · THE HUMP'S ROOM. The base line stops keep_i of an amplitude short of
 *     the limit, so the hump towards the box has exactly the room the hump
 *     away from it keeps: beside a block the wave goes on, a calmer one, and
 *     its crest comes up to the limit instead of lying on it. fit(x) is the
 *     share of a hump that fits in x amplitudes of room, eased over SOFT k.
 *   · THE LAYERED UNION. `min` over the boxes, and the eighth-power sum that
 *     pushed the base line, turned a corner wherever two boxes' plateaus
 *     crossed. In the union, what box i asks for BEYOND the next-nearest box
 *     applies wherever ANY box at least as near is present — 1 − Π (1 − p),
 *     a union of plateaus with no corner where two of them cross. It asks
 *     for no more than the nearest box does alone, and never for less than
 *     any box does by itself.
 * The ribbon never comes closer to a keep-out than the clamp allowed: the
 * base line only moves away from a limit, and a hump towards a box is never
 * larger than its room (ribbon-model.test.ts pins no corner, no ruler line
 * and no keep-out entered on the recorded cards and on the layouts that
 * showed the fault, and no corner and no keep-out entered on a seeded
 * sweep).
 */
function wave(
  pen: Pen,
  name: string,
  end: readonly [number, number],
  shape: WaveShape,
): Segment {
  const { k, period, boxes } = pen;
  const d = [snap(Math.cos(pen.th)), snap(Math.sin(pen.th))] as const;
  const p = [-d[1], d[0]] as const;
  const x0 = pen.x;
  const z0 = pen.z;
  const dx = end[0] - x0;
  const dz = end[1] - z0;
  const L = dx * d[0] + dz * d[1];
  const delta = dx * p[0] + dz * p[1];
  const n = L / period;
  const Aeff = A * k * Math.pow(Math.min(1, 0.7 * n), 2);
  const bulge = BULGE * k;
  // The end taper: the wave fades over its tail (a length), never over more
  // than the usual share.
  const endTaper = (taper: number) => Math.min(taper, shape.tail / L);
  const window = (t: number, taper = TAPER) =>
    pinned(t, taper, endTaper(taper));
  const theta = (t: number) => 2 * PI * n * t + shape.phase;

  // The boxes in the order of their limits, THE NEAREST FIRST — the order THE
  // LAYERED UNION is laid in (limit and keep both grow with lmax, so one
  // order serves the base line and both sides of a hump).
  const edges = boxes
    .map((box) => {
      const X1 = box.x - box.w;
      const X2 = box.x + box.w;
      const Z1 = box.z - box.h;
      const Z2 = box.z + box.h;
      // The box's extent along a direction of the card plane, from the start.
      const extent = (v: readonly [number, number]) =>
        Math.abs(v[1]) < 1e-12
          ? [(X1 - x0) * v[0], (X2 - x0) * v[0]]
          : [(Z1 - z0) * v[1], (Z2 - z0) * v[1]];
      const along = extent(d);
      const later = extent(p);
      const lmax = Math.min(...later) - pen.width / 2 - M;
      const eng = clamp01((2 * Aeff - lmax) / (Aeff + 0.001));
      /** The share of a hump the wave keeps beside this box. */
      const keep = 1 - eng * (1 - D);
      /** Where the BASE LINE may run beside it: that hump's amplitude short of the limit. */
      const limit = lmax - Aeff * keep;
      return {
        a1: Math.min(...along) / L,
        a2: Math.max(...along) / L,
        lmax,
        limit,
        keep,
        ramp: Math.max(0.5 * period, 1.8 * Math.max(0, -lmax)) / L,
      };
    })
    .sort((a, b) => a.lmax - b.lmax);
  const soft = SOFT * k;
  /** THE LAYERED UNION of what each box asks for, the boxes in `edges`' order. */
  const union = (plateaus: readonly number[], asks: readonly number[]) => {
    // `none`: no box at least this near is present.
    let none = 1;
    let total = 0;
    asks.forEach((ask, i) => {
      none *= 1 - plateaus[i];
      total += (ask - (i + 1 < asks.length ? asks[i + 1] : 0)) * (1 - none);
    });
    return total;
  };

  const latAndDamp = (t: number) => {
    const plateaus = edges.map(
      (edge) =>
        ease(clamp01((t - edge.a1 + edge.ramp) / edge.ramp)) *
        ease(clamp01((edge.a2 + edge.ramp - t) / edge.ramp)) *
        window(t, TAPER0),
    );
    const r0 = delta * ease(t);
    const route =
      r0 -
      union(
        plateaus,
        edges.map((edge) => knee(r0 - edge.limit, soft)),
      );
    const toward =
      1 -
      union(
        plateaus,
        edges.map(
          (edge) =>
            1 -
            fit((edge.lmax - route) / (Aeff + 0.001), soft / (Aeff + 0.001)),
        ),
      );
    const away =
      1 -
      union(
        plateaus,
        edges.map((edge) => 1 - edge.keep),
      );
    const hump = Math.sin(theta(t));
    const sigma = ease(clamp01((hump + 0.3) / 0.6));
    return {
      lat: route + Aeff * window(t) * hump * (away + (toward - away) * sigma),
      away,
      hump,
    };
  };
  const lat = (t: number) => latAndDamp(t).lat;
  const shear = (t: number) => Aeff * window(t) * Math.sin(theta(t)) * T_0;
  const h = FD_H * Math.min(1, shape.tail / L / TAPER);

  const segment = lay(pen, {
    kind: 'wave',
    name,
    start: pen.s,
    length: L,
    xyz: (t) => {
      const run = L * t + shear(t);
      const across = lat(t);
      const y =
        (-bulge *
          window(t) *
          (1 + Math.sin(BULGE_PACE * 2 * PI * n * t + shape.bulgePhase))) /
        2;
      return [d[0] * run + p[0] * across, y, d[1] * run + p[1] * across];
    },
    phi: (t) =>
      Math.atan2(
        lat(t + h) - lat(t - h),
        2 * h * L + shear(t + h) - shear(t - h),
      ),
    // The roll uses the pinned window: the frame lies flat again at both ends.
    psi: (t) => {
      const { away, hump } = latAndDamp(t);
      return ROLL * window(t) * hump * away;
    },
  });
  pen.x = end[0];
  pen.z = end[1];
  return segment;
}

/** Every number in the input finite, and the four sizes above 0 — or a RangeError that says so. */
function validate(input: CardInput): void {
  for (const field of ['W', 'H', 'G', 'k'] as const) {
    const value = input[field];
    if (!(Number.isFinite(value) && value > 0)) {
      throw new RangeError(
        `buildCard: ${field} must be a finite number of card units above 0 (received ${String(value)}).`,
      );
    }
  }
  input.boxes.forEach((box, index) => {
    if (![box.x, box.z, box.w, box.h].every(Number.isFinite)) {
      throw new RangeError(
        `buildCard: keep-out ${index} needs finite x, z, w and h (received x ${box.x}, z ${box.z}, w ${box.w}, h ${box.h}) — a centre and two half sizes in card units.`,
      );
    }
  });
}

/**
 * The ribbon of one card, UNMIRRORED — it enters at the top-right corner.
 * (A mirrored card is this card with x → −x, its keep-outs mirrored into it
 * first: lib/ribbon-layout.)
 *
 * @throws RangeError for input that is not finite and positive, and for a
 * card too small for its gauge — one whose top or side wave would run
 * backwards (a column of cards under about 1 unit wide, or a card shorter
 * than about 2.3 k with the gap under it).
 */
export function buildCard(input: CardInput): CardModel {
  validate(input);
  const { W, H, G, k, boxes } = input;
  const T = THICKNESS * k;
  const l = WAVELENGTH * Math.pow(DESKTOP_K / k, WAVELENGTH_GROWTH);
  const alpha = (THETA * PI) / 180;
  const ca = Math.cos(alpha);
  const sa = Math.sin(alpha);
  const beta = (BETA * PI) / 180;
  const cb = Math.cos(beta);
  const sb = Math.sin(beta);
  const r1 = R_1 * k;
  const gap = R_FOLD * k;
  const width = WIDTH * k;
  const rLead = R_LEAD * k;
  /** A bend round an edge starts this far inside that edge. */
  const inset = gap - EPS * k;
  /** What crossing the top edge costs ALONG it: two bends and the top face. */
  const over = ((PI * gap + T) * cb) / sb;
  /** The height at which a bend round the top edge starts or ends. */
  const top = H / 2 - inset;

  // The drop-in line: the leftmost point of the old entry loop's circle.
  const reach = (1 + LOOP_X) * r1;
  const xDrop = W / 2 - reach;
  const PHI0 = 1.5 * PI;
  const x0: Vec3 = [xDrop, -T / 2 - gap, H / 2 + k];
  const pen: Pen = {
    k,
    T,
    gap,
    width,
    boxes,
    period: l * k,
    x: x0[0],
    z: x0[2],
    phi: PHI0,
    psi: 0,
    th: PHI0,
    s: 0,
    tan: [Math.cos(PHI0), 0, Math.sin(PHI0)],
    out: [0, -1, 0],
    segments: [],
  };

  // The hook: the old loop's circle, followed until the centre line is
  // `inset` short of the edge. On that circle the ribbon left round the side
  // edge `sideOut` below the card's top; fb-492 slides the WHOLE hook down by
  // LOWER times that — the same circle, the same angle at the edge, a longer
  // straight drop above it.
  const hook = Math.asin((LOOP_X * r1 - inset) / r1);
  const sideOut =
    r1 * (Math.cos(hook) - LOOP_Z) - 0.5 * PI * gap * Math.tan(hook);
  const dropL = k - LOOP_Z * r1 + LOWER * sideOut;

  const drop = sway(pen, 'drop', dropL); //         comes down from above the card
  const hookArc = arc(pen, 'hook', r1, 0.5 * PI + hook);
  const rfold1 = fold(pen, 'rfold1', 'z'); //        round the right edge
  const rside = across(pen, 'rside'); //             the side face, still climbing at the hook's angle
  fold(pen, 'rfold2', 'z'); //                       onto the back

  // THE HIDDEN S, behind the card: an arc to the heading H_MID, a straight,
  // an arc to π − β, landing where the ribbon comes back over the top — left
  // of the drop-in line by half a ribbon, the air m_e, and the returning
  // ribbon's own footprint along the edge.
  const xOut =
    xDrop - width / 2 - M_E * k - width / 2 / sb - (0.5 * PI * gap * cb) / sb;
  const hMid = (H_MID * PI) / 180;
  const hEnd = PI - beta;
  const [c1x, c1z] = bend(pen.th, hMid);
  const [c2x, c2z] = bend(hMid, hEnd);
  const cx = c1x + c2x;
  const cz = c1z + c2z;
  const dx = xOut + over - pen.x;
  const dz = top - pen.z;
  const det = cx * Math.sin(hMid) - cz * Math.cos(hMid);
  const rho = (dx * Math.sin(hMid) - dz * Math.cos(hMid)) / det;
  const hiddenL = (cx * dz - cz * dx) / det;
  const h1 = arc(pen, 'h1', rho, hMid - pen.th);
  line(pen, 'h2', hiddenL);
  const h3 = arc(pen, 'h3', rho, hEnd - hMid);
  // The card's one half twist, where nobody sees it.
  const twist: Twist = {
    start: h1.start,
    length: h3.start + h3.length - h1.start,
    dpsi: PI,
  };
  pen.psi += PI;

  fold(pen, 'tfold1', 'x'); //                        over the top edge
  const tcross = across(pen, 'tcross');
  const tfold2 = fold(pen, 'tfold2', 'x'); //         down onto the front, heading down-left at β

  // The exit corner is laid out BACKWARDS from the back-left edge, where the
  // re-entry has to start.
  const gamma = 0.5 * PI - alpha - beta;
  const rTurn = 0.8 * R_2 * k;
  const dDiag = D_B * k;
  const turnDx = rTurn * (Math.sin(1.5 * PI - alpha) - Math.sin(PI + beta));
  /** Where the lift ends and the ribbon goes back over the top edge, at `top`. */
  const xExit = -W / 2 + inset + dDiag - turnDx + over;

  // THE TOP RIPPLE (the owner, 2026-10-01: "3 waves, so once it enters the
  // card from behind with the parabola top pointed downwards, then one with
  // the parabola head pointed upwards and then with the parabola head pointed
  // downwards again … pretty low, pretty smooth … inbounds of the card …
  // well distributed normal distributions … slightly different widths … bind
  // with each other in a harmonised manner"): between the two corners the
  // ribbon runs flat on the face in a VALLEY, a CREST and a VALLEY — three
  // normal-distribution bumps (RIPPLE) whose sum is levelled at both ends —
  // and the two corner arcs ease the ribbon only to the ripple's own end
  // slopes, so fold, arc, ripple, arc and fold are one tangent-continuous
  // curve with no flat stretch. The valleys hang DIP of the run and the crest
  // rises CREST of it, so the ripple reads the same on every screen — and
  // never more than the ROOM the top lane leaves above its floor (the lane,
  // less the ribbon's depth at the deeper end, its half width and the air M)
  // nor more than the HEADROOM under the card's top edge (the ribbon's depth
  // at the shallower end, less its half width and HEADROOM_AIR): the whole
  // ripple stays inside the card, clear of every word. The end slopes, the
  // chord, the room and the headroom depend on one another through the arcs
  // (an arc that turns less ends higher and reaches less far), so they are
  // solved together by a fixed point — a contraction, iterated a fixed number
  // of times, far past the record's nine decimals.
  const chord0 = pen.x - rLead * sb - (xExit + rLead * sb);
  if (!(chord0 > 0)) {
    throw new RangeError(
      `buildCard: a card ${W} units wide is too narrow for the gauge ${k}: its top ripple would span ${chord0.toFixed(3)} units. At this gauge a card must be wider than ${(W - chord0).toFixed(3)} units; gaugeRule(${W}) is ${gaugeRule(W).toFixed(3)}.`,
    );
  }
  const lane = lanes(k).top / UNIT_PX;
  const shapes = rippleShapes();
  const xEntry = pen.x;
  let sLead = 0;
  let sLift = 0;
  let depth = 0;
  let height = 0;
  let rippleEnd: readonly [number, number] = [xExit + rLead * sb, pen.z];
  for (let i = 0; i < 40; i++) {
    const z1 = top - rLead * (Math.cos(sLead) - cb);
    const z2 = top - rLead * (Math.cos(sLift) - cb);
    const x1 = xEntry - rLead * (sb - Math.sin(sLead));
    const x2 = xExit + rLead * (sb - Math.sin(sLift));
    rippleEnd = [x2, z2];
    const chord = Math.hypot(x2 - x1, z2 - z1);
    const deeper = Math.max(H / 2 - z1, H / 2 - z2);
    const shallower = Math.min(H / 2 - z1, H / 2 - z2);
    const room = Math.max(0, lane - M - deeper - width / 2);
    const headroom = Math.max(0, shallower - width / 2 - HEADROOM_AIR * k);
    // What the ripple may reach: a valley DIP of the run deep or the room,
    // the crest CREST of the run high or the headroom — whichever is less.
    const valleyCap = Math.min(DIP * chord, room);
    const crestCap = Math.min(CREST * chord, headroom);
    if (i === 0) {
      depth = valleyCap;
      height = crestCap;
    }
    // The profile's EXTREMES with these sizes (the levelled valleys lift the
    // middle a little, so the crest is more than its own bump), and the two
    // sizes scaled so the extremes meet their caps.
    const h = (t: number) => depth * shapes.a.h(t) - height * shapes.b.h(t);
    const valley = largest(h);
    if (valley > 0) depth *= valleyCap / valley;
    const crest = largest((t) => -h(t));
    if (crest > crestCap) {
      // Scale the crest's bump down; what the valleys lift by themselves is
      // taken off the valleys when the bump alone cannot give the room back.
      const lifted = largest((t) => -depth * shapes.a.h(t));
      if (lifted >= crestCap) {
        height = 0;
        depth *= lifted > 0 ? crestCap / lifted : 1;
      } else {
        height *= (crestCap - lifted) / Math.max(crest - lifted, 1e-12);
      }
    }
    // The ripple's own end slopes, from the chord; the arcs end where the
    // chord's tilt puts those slopes against the card's x axis.
    const tilt = Math.atan2(z2 - z1, x1 - x2);
    const slope0 = Math.atan2(
      depth * shapes.a.dh(0) - height * shapes.b.dh(0),
      chord,
    );
    const slope1 = Math.atan2(
      depth * shapes.a.dh(1) - height * shapes.b.dh(1),
      chord,
    );
    sLead = slope0 - tilt;
    sLift = -slope1 + tilt;
  }
  const lead = arc(pen, 'lead', rLead, -(beta - sLead)); // eases to the ripple's first slope
  const rippleTop = ripple(pen, 't', rippleEnd, {
    h: (t) => depth * shapes.a.h(t) - height * shapes.b.h(t),
    dh: (t) => depth * shapes.a.dh(t) - height * shapes.b.dh(t),
  });
  const lift = arc(pen, 'lift', rLead, -(beta - sLift)); // eases up out of its last valley
  const xfold1 = fold(pen, 'xfold1', 'x'); //         over the top edge
  const xcross = across(pen, 'xcross');
  fold(pen, 'xfold2', 'x'); //                        behind the card, heading down-left
  arc(pen, 'dturn', rTurn, gamma); //                 turns onto the diagonal, θ from the vertical
  const dback = lineDisp(
    pen,
    'dback',
    [-dDiag, 0, (-dDiag * ca) / sa],
    dDiag / sa,
  );
  const fold1 = fold(pen, 'fold1', 'z'); //           round the back-left edge (hidden)
  across(pen, 'side'); //                             across the side face, hugging it
  fold(pen, 'fold2', 'z'); //                         onto the front face
  const Lf = R * k;
  lineDisp(pen, 'dfront', [Lf * sa, 0, -Lf * ca], Lf); // the diagonal on the front face
  const dease = arc(pen, 'dease', R_EASE * k, -alpha); // eases to vertical
  const waveSide = wave(
    pen,
    'd',
    [-W / 2 + reach, -H / 2 - G + k], // ends at the next card's drop-in (mirrored)
    { bulgePhase: 2.2, phase: P_D, tail: TAIL_D * k },
  );
  if (!(waveSide.length > 0)) {
    throw new RangeError(
      `buildCard: a card ${H} units tall with ${G} under it is too short for the gauge ${k}: its side wave would be ${waveSide.length.toFixed(3)} units long. At this gauge H + G must exceed ${(H + G - waveSide.length).toFixed(3)} units.`,
    );
  }

  const segments = pen.segments;
  const S = pen.s;
  const atom = (first: Segment, last: Segment): Atom => {
    const u0 = first.start / S;
    const u1 = (last.start + last.length) / S;
    return { u0, u1, length: (u1 - u0) * S };
  };
  const atoms: Readonly<Record<AtomName, Atom>> = {
    dropIn: atom(drop, drop),
    hookEntry: atom(hookArc, rfold1),
    wrapEntry: atom(rside, tcross),
    leadOut: atom(tfold2, lead),
    rippleTop: atom(rippleTop, rippleTop),
    liftExit: atom(lift, xfold1),
    wrapExit: atom(xcross, dback),
    reentry: atom(fold1, dease),
    waveSide: atom(waveSide, waveSide),
  };

  // Every term is CONSTANT outside its window, so its two end contributions
  // are computed once, and evaluate() runs only the segment u is inside —
  // the same numbers, three times faster.
  const ends = segments.map((segment) =>
    [0, 1].map((t) => ({
      d: segment.xyz(t),
      phi: segment.phi(t),
      psi: segment.psi(t),
    })),
  );
  function evaluate(u: number): Frame {
    const s = u * S;
    let x = x0[0];
    let y = x0[1];
    let z = x0[2];
    let phi = PHI0;
    let psi = 0;
    segments.forEach((segment, i) => {
      const t = clamp01((s - segment.start) / segment.length);
      if (t <= 0 || t >= 1) {
        const end = ends[i][t <= 0 ? 0 : 1];
        x += end.d[0];
        y += end.d[1];
        z += end.d[2];
        phi += end.phi;
        psi += end.psi;
        return;
      }
      const d = segment.xyz(t);
      x += d[0];
      y += d[1];
      z += d[2];
      phi += segment.phi(t);
      psi += segment.psi(t);
    });
    psi += twist.dpsi * ease(clamp01((s - twist.start) / twist.length));
    return { x, y, z, phi, psi, B: frameB(phi, psi) };
  }

  const hookLow =
    (1 + LOWER) * sideOut +
    0.5 * PI * gap * Math.tan(hook) +
    r1 * (1 - Math.cos(hook)) +
    width / 2;
  return {
    T,
    l,
    S,
    width,
    atoms,
    segments,
    twist,
    hidden: { hMid: H_MID, rho, L: hiddenL },
    entry: {
      sway: A_E * k,
      dropL,
      sideOut: (1 + LOWER) * sideOut,
      hookLow,
      reach: reach + width / 2,
    },
    evaluate,
    surface(u, v) {
      const frame = evaluate(u);
      const w = width * (v - 0.5);
      return [
        frame.x + w * frame.B[0],
        frame.y + w * frame.B[1],
        frame.z + w * frame.B[2],
      ];
    },
  };
}
