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

const source = withoutComments(sourceOf('src/components/ui/Ribbon/Ribbon.tsx'));

/** A straight line through two samples: its slope and its value at 0. */
function line(f: (x: number) => number, a: number, b: number) {
  const slope = (f(b) - f(a)) / (b - a);
  return { slope, offset: f(a) - slope * a };
}

/** A px floor as the CSS spells it — in rem. */
const rem = (px: number) => `${px / 16}rem`;
/** A coefficient of the gauge in px per unit, as a multiple of `--ribbon-k` (= 100 k px). */
const times = (perUnit: number) => (perUnit / UNIT_PX).toFixed(2);
const px = (value: number) => `${Math.round(value)}px`;

describe('ui/Ribbon’s CSS spells lib/ribbon-model’s rule (KEEP IN SYNC)', () => {
  it('declares the gauge: max(RATIO × 100cqw, 100 (BOLD − 2.97 SLOPE) px + SLOPE × 100cqw)', () => {
    // Far above the desktop's knee the ratio wins; near the phone the line.
    const ratio = gaugeRule(100) / 100;
    const straight = line(gaugeRule, 3, 4);
    const k = `[--ribbon-k:max(${(ratio * 100).toFixed(4)}cqw,calc(${(straight.offset * 100).toFixed(3)}px_+_${(straight.slope * 100).toFixed(4)}cqw))]`;
    expect(k).toBe('[--ribbon-k:max(7.9286cqw,calc(19.240px_+_6.0218cqw))]');
    expect(source).toContain(k);
  });

  it('declares the lanes from the gauge — top, side and the gap', () => {
    const top = line((k) => lanes(k).top, 1, 2);
    const sideLow = line((k) => lanes(k).side, 0.3, 0.4);
    const sideHigh = line((k) => lanes(k).side, 1, 2);
    const gap = line((k) => lanes(k).gap, 1, 2);
    const floor = lanes(0).top;
    expect(lanes(0).side).toBe(floor);

    const laneTop = `[--ribbon-lane-top:max(${rem(floor)},calc(${times(top.slope)}*var(--ribbon-k)_+_${px(top.offset)}))]`;
    const laneSide = `[--ribbon-lane-side:max(${rem(floor)},calc(${times(sideLow.slope)}*var(--ribbon-k)_+_${px(sideLow.offset)}),calc(${times(sideHigh.slope)}*var(--ribbon-k)_+_${px(sideHigh.offset)}))]`;
    // The gap's coefficient is exactly one: `--ribbon-k` itself.
    expect(gap.slope).toBe(UNIT_PX);
    const laneGap = `[--ribbon-gap:calc(var(--ribbon-k)_+_${px(gap.offset)})]`;

    expect([laneTop, laneSide, laneGap]).toEqual([
      '[--ribbon-lane-top:max(1.5rem,calc(0.62*var(--ribbon-k)_+_8px))]',
      '[--ribbon-lane-side:max(1.5rem,calc(0.60*var(--ribbon-k)_+_12px),calc(0.83*var(--ribbon-k)_+_1px))]',
      '[--ribbon-gap:calc(var(--ribbon-k)_+_60px)]',
    ]);
    for (const declaration of [laneTop, laneSide, laneGap]) {
      expect(source).toContain(declaration);
    }
  });

  it('keeps the ribbon’s head room — the drop-in’s measure above the first card — and a tail room that is only the tuck under the last: its curl and its shadow', () => {
    // The model's own geometry. Every card's chain still begins k above it
    // (the drop-in — never drawn on the first card since 2026-10-01,
    // lib/ribbon-draw), and the head room keeps that measure.
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
    expect(source).toContain('pt-[calc(var(--ribbon-k)_+_1rem)]');
    // The LAST card (G null) ends tucked under its own bottom edge
    // (lib/ribbon-model's THE TUCK): its lowest point is the bend's curl, and
    // lib/ribbon-draw grows the last tile past it by its margin, the shadow's
    // blur and its offset, and rounds up a pixel (`shadowOf`, TILE_MARGIN —
    // read here, never retyped). The tail room `0.13 × --ribbon-k + 8px`
    // holds that at every gauge from the 320 window's column to the 2 560
    // window's (ui/Ribbon/Ribbon.test.tsx measures the real tiles at six).
    expect(source).toContain('pb-[calc(0.13*var(--ribbon-k)_+_8px)]');
    for (let W = 2.41; W <= 21.45; W += 0.5) {
      const k = gaugeRule(W);
      const H = 6;
      const last = buildCard({ W, H, G: null, k, boxes: [] });
      let lowest = Infinity;
      for (let i = 0; i <= 4_000; i++) {
        for (const v of [0, 0.5, 1]) {
          lowest = Math.min(lowest, last.surface(i / 4_000, v)[2]);
        }
      }
      const curl = (-H / 2 - lowest) * UNIT_PX;
      expect(curl, `${W} units`).toBeLessThan(0.056 * k * UNIT_PX);
      const { dy, blur } = shadowOf(k);
      const reach = curl + TILE_MARGIN + blur + dy + 1;
      expect(reach, `${W} units`).toBeLessThanOrEqual(0.13 * k * UNIT_PX + 8);
    }
    // ONE bottom padding on the column: the room the tail HUNG in until
    // 2026-10-01 (60px + 1rem) is gone — the owner: "remove that space". (Not
    // spelled out here: a class-like string in any scanned file is a class
    // Tailwind ships.)
    expect(source.match(/\bpb-\[/g)).toHaveLength(1);
  });
});
