import { describe, expect, it } from 'vitest';
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

  it('keeps the ribbon’s head and tail room: the drop-in starts k above the first card, the tail ends in the air under the last', () => {
    // The model's own geometry, on the approved desktop card: where the
    // ribbon begins over the card's top edge, and — under the LAST card,
    // whose gap is the lanes' own — where it ends under the bottom one.
    const W = 10.09;
    const k = gaugeRule(W);
    const H = 5;
    const model = buildCard({ W, H, G: lanes(k).gap / UNIT_PX, k, boxes: [] });
    const head = (model.evaluate(0).z - H / 2) * UNIT_PX;
    const tail = -(model.evaluate(1).z + H / 2) * UNIT_PX;
    expect(head).toBeCloseTo(k * UNIT_PX, 9);
    expect(tail).toBeCloseTo(lanes(k).gap - k * UNIT_PX, 9);
    // …and the column's padding makes room for both, each with 1rem more
    // for a tile's margin and the shadow.
    expect(source).toContain('pt-[calc(var(--ribbon-k)_+_1rem)]');
    expect(source).toContain(
      `pb-[calc(${px(lanes(k).gap - k * UNIT_PX)}_+_1rem)]`,
    );
  });
});
