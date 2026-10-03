import { describe, expect, it } from 'vitest';
import {
  shadowOf,
  TILE_MARGIN,
} from '../../src/lib/ribbon-draw/ribbon-draw.ts';
import {
  buildCard,
  gaugeRule,
  lanes,
  UNIT_PX,
} from '../../src/lib/ribbon-model/ribbon-model.ts';
import { sourceOf, withoutComments } from './ribbon-fence.ts';

// THE CSS IS THE MODEL'S (CLAUDE.md §15.26; §4's sharing table, row 2 — a
// KEEP-IN-SYNC pair). ui/Ribbon declares the gauge and the lanes in CSS, so
// the browser computes them from the column's width before any script runs,
// and nothing jumps when the ribbon arrives; lib/ribbon-model spells the same
// rule in numbers for the ribbon itself. Two spellings of one rule, and this
// is the first of their two pins — the second is ui/Ribbon/Ribbon.test.tsx,
// which measures what the browser computes at nine widths.
//
// The numbers are read BACK FROM THE MODEL'S FUNCTIONS, never retyped here:
// each branch of each `max` is sampled where it is the one that wins, so a
// changed coefficient in the model fails this test until the CSS says the
// same thing — and a changed CSS string fails it too. They are looked for in
// the file with its comments stripped (tests/unit/ribbon-fence.ts, the
// ribbon fences' one reading): a declaration that survived only in prose
// would declare nothing.
//
// IN THE RIBBON'S UNIT (CLAUDE.md §15.25 round 2; ui/Ribbon's THE UNIT). The
// model's rule speaks px at its own UNIT_PX — lanes() returns 62 k + 8 px —
// and the CSS spells every such px as that SHARE OF `--ribbon-unit`, 100px
// unless a scaled design says otherwise: 8px is 0.08 of a unit, the gap's
// 60px 0.60, the gauge's 19.240px 0.19240. So a scaled design scales every
// one of them, and the last case below holds the column to it: no px is left
// in it but the unit's own fallback.

const source = withoutComments(sourceOf('src/components/ui/Ribbon/Ribbon.tsx'));

/** A straight line through two samples: its slope and its value at 0. */
function line(f: (x: number) => number, a: number, b: number) {
  const slope = (f(b) - f(a)) / (b - a);
  return { slope, offset: f(a) - slope * a };
}

/** A px floor as the CSS spells it — in rem. */
const rem = (px: number) => `${px / 16}rem`;
/** A coefficient of the gauge in px per unit, as a multiple of `--ribbon-k` (= k units). */
const times = (perUnit: number) => (perUnit / UNIT_PX).toFixed(2);
/** THE UNIT as the column reads it — its fallback the model's own UNIT_PX. */
const UNIT = `var(--ribbon-unit,${UNIT_PX}px)`;
/** A px of the model's rule, at UNIT_PX, as the CSS spells it: that share of the unit. */
const share = (px: number) => `${(px / UNIT_PX).toFixed(2)}*${UNIT}`;
/** The head and tail room's allowance for a tile's 2px margin and the shadow, in px at UNIT_PX — the 1rem it was until 2026-10-01. */
const ROOM = 16;
/** The tail room's allowance beyond the tuck's curl and shadow — a tile's 2px margin, the shadow's floors and a pixel of rounding — in px at UNIT_PX: the 8px of `0.13 × --ribbon-k + 8px` (the tuck, 2026-10-01). */
const TAIL_AIR = 8;

describe('ui/Ribbon’s CSS spells lib/ribbon-model’s rule (KEEP IN SYNC)', () => {
  it('declares the gauge: max(RATIO × 100cqw, (BOLD − 2.97 SLOPE) units + SLOPE × 100cqw)', () => {
    // Far above the desktop's knee the ratio wins; near the phone the line —
    // whose value at 0 is in units already, `--ribbon-k` being k units.
    const ratio = gaugeRule(100) / 100;
    const straight = line(gaugeRule, 3, 4);
    const k = `[--ribbon-k:max(${(ratio * 100).toFixed(4)}cqw,calc(${straight.offset.toFixed(5)}*${UNIT}_+_${(straight.slope * 100).toFixed(4)}cqw))]`;
    expect(k).toBe(
      '[--ribbon-k:max(7.9286cqw,calc(0.19240*var(--ribbon-unit,100px)_+_6.0218cqw))]',
    );
    expect(source).toContain(k);
  });

  it('declares the lanes from the gauge — top, side and the gap', () => {
    const top = line((k) => lanes(k).top, 1, 2);
    const sideLow = line((k) => lanes(k).side, 0.3, 0.4);
    const sideHigh = line((k) => lanes(k).side, 1, 2);
    const gap = line((k) => lanes(k).gap, 1, 2);
    const floor = lanes(0).top;
    expect(lanes(0).side).toBe(floor);

    const laneTop = `[--ribbon-lane-top:max(${rem(floor)},calc(${times(top.slope)}*var(--ribbon-k)_+_${share(top.offset)}))]`;
    const laneSide = `[--ribbon-lane-side:max(${rem(floor)},calc(${times(sideLow.slope)}*var(--ribbon-k)_+_${share(sideLow.offset)}),calc(${times(sideHigh.slope)}*var(--ribbon-k)_+_${share(sideHigh.offset)}))]`;
    // The gap's coefficient is exactly one: `--ribbon-k` itself.
    expect(gap.slope).toBe(UNIT_PX);
    const laneGap = `[--ribbon-gap:calc(var(--ribbon-k)_+_${share(gap.offset)})]`;

    expect([laneTop, laneSide, laneGap]).toEqual([
      '[--ribbon-lane-top:max(1.5rem,calc(0.62*var(--ribbon-k)_+_0.08*var(--ribbon-unit,100px)))]',
      '[--ribbon-lane-side:max(1.5rem,calc(0.60*var(--ribbon-k)_+_0.12*var(--ribbon-unit,100px)),calc(0.83*var(--ribbon-k)_+_0.01*var(--ribbon-unit,100px)))]',
      '[--ribbon-gap:calc(var(--ribbon-k)_+_0.60*var(--ribbon-unit,100px))]',
    ]);
    for (const declaration of [laneTop, laneSide, laneGap]) {
      expect(source).toContain(declaration);
    }
  });

  it('keeps the ribbon’s head room — the drop-in’s measure above the first card — and a tail room that is only the tuck under the last: its curl and its shadow, both in the unit', () => {
    // The model's own geometry. Every card's chain still begins k above it
    // (the drop-in — never drawn on the first card since 2026-10-01,
    // lib/ribbon-draw), and the head room keeps that measure, with ROOM more
    // for a tile's 2px margin and the shadow — in the unit, like the rest.
    const desktop = gaugeRule(10.09);
    const model = buildCard({
      W: 10.09,
      H: 5,
      G: lanes(desktop).gap / UNIT_PX,
      k: desktop,
      boxes: [],
    });
    expect((model.evaluate(0).z - 2.5) * UNIT_PX).toBeCloseTo(
      desktop * UNIT_PX,
      9,
    );
    const pt = `pt-[calc(var(--ribbon-k)_+_${share(ROOM)})]`;
    expect(pt).toBe(
      'pt-[calc(var(--ribbon-k)_+_0.16*var(--ribbon-unit,100px))]',
    );
    expect(source).toContain(pt);
    // The LAST card (G null) ends tucked under its own bottom edge
    // (lib/ribbon-model's THE TUCK): its lowest point is the bend's curl, and
    // lib/ribbon-draw grows the last tile past it by its margin, the shadow's
    // blur and its offset, and rounds up a pixel (`shadowOf`, TILE_MARGIN —
    // read here, never retyped). The tail room `0.13 × --ribbon-k` + TAIL_AIR
    // of the unit — 8px at the default unit — holds that at every gauge from
    // the 320 window's column to the 2 560 window's (ui/Ribbon/Ribbon.test.tsx
    // measures the real tiles at six).
    const pb = `pb-[calc(0.13*var(--ribbon-k)_+_${share(TAIL_AIR)})]`;
    expect(pb).toBe(
      'pb-[calc(0.13*var(--ribbon-k)_+_0.08*var(--ribbon-unit,100px))]',
    );
    expect(source).toContain(pb);
    const reachOf = (W: number, unit: number) => {
      const k = gaugeRule(W);
      const H = 6;
      const last = buildCard({ W, H, G: null, k, boxes: [] });
      let lowest = Infinity;
      for (let i = 0; i <= 4_000; i++) {
        for (const v of [0, 0.5, 1]) {
          lowest = Math.min(lowest, last.surface(i / 4_000, v)[2]);
        }
      }
      const curl = (-H / 2 - lowest) * unit;
      expect(curl, `${W} units`).toBeLessThan(0.056 * k * unit);
      const { dy, blur } = shadowOf(k, unit);
      return {
        reach: curl + TILE_MARGIN + blur + dy + 1,
        room: (0.13 * k * UNIT_PX + TAIL_AIR) * (unit / UNIT_PX),
      };
    };
    for (let W = 2.41; W <= 21.45; W += 0.5) {
      const { reach, room } = reachOf(W, UNIT_PX);
      expect(reach, `${W} units`).toBeLessThanOrEqual(room);
    }
    // INSIDE A SCALED DESIGN (§15.25 round 2) the column is always the
    // reference's in units (1106 / 100 = 11.06), the curl and the shadow grow
    // with the unit, and TILE_MARGIN and the pixel of rounding stay CSS px —
    // so the room, all of it in the unit, must still hold at the band's
    // smallest scale (896 / 1106) and its largest (96rem / 1106).
    for (const s of [896 / 1106, 1, 1536 / 1106]) {
      const { reach, room } = reachOf(11.06, s * UNIT_PX);
      expect(reach, `s ${s.toFixed(3)}`).toBeLessThanOrEqual(room);
    }
    // ONE bottom padding on the column: the room the tail HUNG in until
    // 2026-10-01 (60px + 1rem) is gone — the owner: "remove that space". (Not
    // spelled out here: a class-like string in any scanned file is a class
    // Tailwind ships.)
    expect(source.match(/\bpb-\[/g)).toHaveLength(1);
  });

  it('spells no px in the column but the unit’s own fallback — every other length is a share of the unit or of the column, and the two floors are rem', () => {
    // COLUMN's literal, its pieces joined as the code joins them.
    const declared = /const COLUMN =([^;]*);/.exec(source)?.[1];
    if (declared === undefined) throw new Error('no COLUMN in ui/Ribbon');
    const column = [...declared.matchAll(/'([^']*)'/g)]
      .map(([, piece]) => piece)
      .join('');
    expect(column).toContain(UNIT);
    // A px left beside the unit would stand still while a scaled design
    // grows — the lanes' +8px, the gap's +60px and the tail's +8px did, until
    // 2026-10-01.
    expect(column.replaceAll(UNIT, '')).not.toMatch(/\d(?:\.\d+)?px/);
    expect(column.match(/\d(?:\.\d+)?rem/g)).toEqual(['1.5rem', '1.5rem']);
  });
});
