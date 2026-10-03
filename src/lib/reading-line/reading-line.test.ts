import { describe, expect, it } from 'vitest';
import {
  planReadingLine,
  READING_END_PACE,
  readingIndex,
  readingProbe,
  type ReadingFrame,
  type ReadingPlan,
} from './reading-line.ts';

// lib/reading-line — the arithmetic behind lib/scroll-spy's reading line,
// tested with NUMBERS ALONE: no element, no scroll, no timer. That is the
// reason the module exists apart from the spy (its header), and it is what
// lets this file prove the owner's two properties on the real page at every
// pixel of scrolling in a few milliseconds.
//
// ── THE MEASURED PAGE, EMBEDDED. The planner measured the built services page
// on 2026-09-29 (`.claude/section-runs/2026-09-29_price-current-aura/
// round5-geometry.json`): the eleven category cards' document tops and
// heights, the window, and where the document ends. Six of those windows are
// copied below, by hand and on purpose — a test that read the measurement file
// would pass or fail with a gitignored workspace, and a copy says in the
// suite itself what it proves things about. Every one has the shell's 96px of
// scroll padding and the cards' 40px of scroll margin. Above 1280px the cards
// sit at the same document y's in every window, so the four wide windows share
// one list of tops and heights; each window's own `maxScrollY` is what differs.
// `reference` is what the planner's reference implementation
// (`round5-simulate.mjs`, same folder) computes for each window's landings —
// the numbers this module must reproduce.

/** The shell's scroll-padding-top: 6rem, the header pill's reach. */
const PADDING = 96;
/** A category card's scroll-margin-top: `scroll-mt-[2.5rem]`. */
const FLOOR = 40;

type Measured = Readonly<{
  name: string;
  viewport: number;
  maxScrollY: number;
  tops: readonly number[];
  heights: readonly number[];
  reference: readonly number[];
}>;

const WIDE_TOPS = [
  178, 422, 707, 951, 1236, 1726, 2380, 2911, 3606, 4834, 5857,
] as const;
const WIDE_HEIGHTS = [
  212, 253, 212, 253, 458, 622, 499, 663, 1196, 991, 253,
] as const;

const MEASURED: readonly Measured[] = [
  {
    name: 'Romanian, laptop 1366×633',
    viewport: 633,
    maxScrollY: 6124,
    tops: WIDE_TOPS,
    heights: WIDE_HEIGHTS,
    reference: [0, 184, 448.5, 713, 1100, 1590, 2244, 2775, 3470, 4698, 5619],
  },
  {
    name: 'Romanian, MacBook 1440×789',
    viewport: 789,
    maxScrollY: 5968,
    tops: WIDE_TOPS,
    heights: WIDE_HEIGHTS,
    reference: [0, 122, 370.5, 635, 1022.5, 1590, 2187, 2775, 3470, 4698, 5541],
  },
  {
    name: 'Romanian, desktop 1920×945',
    viewport: 945,
    maxScrollY: 5808,
    tops: WIDE_TOPS,
    heights: WIDE_HEIGHTS,
    reference: [
      0, 122, 292.5, 557, 944.5, 1516.5, 2109, 2722, 3470, 4698, 5463,
    ],
  },
  {
    name: 'Romanian, UHD 3840×2000',
    viewport: 2000,
    maxScrollY: 4753,
    tops: WIDE_TOPS,
    heights: WIDE_HEIGHTS,
    reference: [
      0, 122, 264.5, 386.5, 529, 989, 1581.5, 2194.5, 3156, 4241.5, 4753,
    ],
  },
  {
    name: 'Romanian, phone 390×844',
    viewport: 844,
    maxScrollY: 11330,
    tops: [833, 1201, 1614, 1934, 2371, 3321, 4595, 5422, 6669, 8813, 10512],
    heights: [336, 381, 288, 405, 918, 1242, 795, 1215, 2112, 1667, 381],
    reference: [
      531, 921.5, 1288, 1666.5, 2235, 3185, 4459, 5286, 6533, 8677, 10232.5,
    ],
  },
  {
    name: 'German, phone 320×568',
    viewport: 568,
    maxScrollY: 13052,
    tops: [833, 1305, 1786, 2174, 2631, 3661, 5075, 6138, 7513, 9941, 11880],
    heights: [440, 449, 356, 425, 998, 1382, 1031, 1343, 2396, 1907, 461],
    reference: [
      697, 1169, 1632, 2038, 2495, 3525, 4939, 6002, 7377, 9805, 11744,
    ],
  },
];

/** A measured window as the frame lib/scroll-spy would hand this module. */
function frameOf(page: Measured): ReadingFrame {
  return {
    viewport: page.viewport,
    maxScrollY: page.maxScrollY,
    padding: PADDING,
    targets: page.tops.map((top, index) => ({
      top,
      height: page.heights[index],
      floor: FLOOR,
    })),
  };
}

/** A made-up page of targets with the price page's padding and floor. */
function frame(
  viewport: number,
  maxScrollY: number,
  boxes: readonly (readonly [top: number, height: number])[],
): ReadingFrame {
  return {
    viewport,
    maxScrollY,
    padding: PADDING,
    targets: boxes.map(([top, height]) => ({ top, height, floor: FLOOR })),
  };
}

/**
 * The answers met walking the page from scroll 0 to its end one pixel at a
 * time, with each stretch of equal answers written once — `[0, 1, 2]` means
 * "the first, then the second, then the third", never a pixel of anything
 * else.
 */
function answersWalkingDown(value: ReadingFrame): number[] {
  const plan = planReadingLine(value);
  const answers: number[] = [];
  for (
    let scrollY = 0;
    scrollY <= Math.max(0, value.maxScrollY);
    scrollY += 1
  ) {
    const answer = readingIndex(value, plan, scrollY);
    if (answers[answers.length - 1] !== answer) answers.push(answer);
  }
  return answers;
}

/** The index a FIXED line would name — the old walk's shape, for contrast:
 *  the last target whose top is at or above `line + 1` at `scrollY`. */
function fixedLineIndex(
  value: ReadingFrame,
  line: number,
  scrollY: number,
): number {
  let index = -1;
  value.targets.forEach((target, position) => {
    if (target.top - scrollY <= line + 1) index = position;
  });
  return index;
}

/**
 * THE SAME-PAGE FIXTURE for the rest-and-probe claims, far from both ends so
 * nothing is moved: a short card, a card too tall to fit, and one at exactly
 * the boundary height — `viewport − padding − 2·floor` = 633 − 96 − 80 = 457.
 */
const QUIET = frame(633, 20_000, [
  [2_000, 200],
  [4_000, 1_000],
  [6_000, 457],
]);

describe('planReadingLine — the reading line is the middle of the CLEAR area', () => {
  it('puts it at (padding + viewport) / 2 — 364.5px on a 633px window under a 96px pill', () => {
    const plan = planReadingLine(frame(633, 0, []));

    expect(plan.line).toBe(364.5);
    // …48px below the screen's own middle, 316.5px: half the pill's reach.
    expect(plan.line - 633 / 2).toBe(PADDING / 2);
  });
});

describe('planReadingLine — where a jump comes to rest', () => {
  it('centres a target that fits: top − landing + height / 2 === line', () => {
    const plan = planReadingLine(QUIET);
    const [short] = QUIET.targets;

    expect(short.top - plan.landings[0] + short.height / 2).toBe(plan.line);
  });

  it('rests a target that does not fit with its top on its ceiling, padding + floor — where every jump used to land', () => {
    const plan = planReadingLine(QUIET);
    const tall = QUIET.targets[1];

    expect(tall.top - plan.landings[1]).toBe(PADDING + FLOOR);
  });

  it('at the boundary height, viewport − padding − 2·floor, a target is centred AND on its ceiling', () => {
    const plan = planReadingLine(QUIET);
    const boundary = QUIET.targets[2];

    expect(boundary.height).toBe(633 - PADDING - 2 * FLOOR);
    expect(boundary.top - plan.landings[2]).toBe(PADDING + FLOOR);
    expect(boundary.top - plan.landings[2] + boundary.height / 2).toBe(
      plan.line,
    );
  });

  it('anchors each target INSIDE itself, on the line at its landing', () => {
    // The anchor is the document y the line crosses when the target has
    // landed: its centre when it is centred, `line − ceiling` below its top
    // when it rests on its ceiling.
    const plan = planReadingLine(QUIET);

    QUIET.targets.forEach((target, index) => {
      expect(plan.anchors[index] - plan.landings[index]).toBe(plan.line);
      expect(plan.anchors[index]).toBeGreaterThanOrEqual(target.top);
      expect(plan.anchors[index]).toBeLessThanOrEqual(
        target.top + target.height,
      );
    });
    expect(plan.anchors[0]).toBe(2_000 + 200 / 2);
    expect(plan.anchors[1]).toBe(4_000 + (plan.line - (PADDING + FLOOR)));
  });
});

describe('readingProbe — what the walk measures', () => {
  it('is the plain line, scrollY + line, wherever no landing was moved', () => {
    // Every landing of QUIET is its ideal, so the bend is zero from end to
    // end: before the first landing, between two, and after the last.
    const plan = planReadingLine(QUIET);

    for (const scrollY of [0, 1_000, 1_735.5, 2_500, 3_864, 5_000, 9_999]) {
      expect(readingProbe(plan, scrollY)).toBe(scrollY + plan.line);
    }
  });

  it('bends near the ends so that it passes through every anchor AT ITS OWN LANDING', () => {
    for (const page of MEASURED) {
      const plan = planReadingLine(frameOf(page));
      plan.landings.forEach((landing, index) => {
        expect(readingProbe(plan, landing)).toBe(plan.anchors[index]);
      });
    }
  });

  it('continues with slope 1 before the first landing and after the last — the end target’s bend held', () => {
    // Two windows whose END landings were MOVED, so the bend being held is
    // not zero: at 1920×945 the first card's ideal (−236.5) was pushed to 0,
    // at 3840×2000 the last card's ideal was pulled back to the page's end.
    const desktop = planReadingLine(frameOf(MEASURED[2]));
    const uhd = planReadingLine(frameOf(MEASURED[3]));
    const last = uhd.landings.length - 1;

    expect(desktop.anchors[0] - desktop.landings[0]).not.toBe(desktop.line);
    expect(readingProbe(desktop, desktop.landings[0] - 100)).toBe(
      desktop.anchors[0] - 100,
    );
    expect(uhd.anchors[last] - uhd.landings[last]).not.toBe(uhd.line);
    expect(readingProbe(uhd, uhd.landings[last] + 100)).toBe(
      uhd.anchors[last] + 100,
    );
  });

  it('interpolates BETWEEN two moved landings — halfway between them it is halfway between their anchors (1920×945)', () => {
    // Both bends are non-zero between the first two landings of this window
    // (the first card's ideal was pushed from −236.5 to 0), so a probe that
    // merely HELD the left bend would still meet every anchor at its landing
    // and still run at slope 1 past the ends — and would move the hand-over
    // between the first two cards (G2 typescript review: that mutation passed
    // every other test).
    const desktop = frameOf(MEASURED[2]);
    const plan = planReadingLine(desktop);
    const halfway = (plan.landings[0] + plan.landings[1]) / 2;

    expect(readingProbe(plan, halfway)).toBeCloseTo(
      (plan.anchors[0] + plan.anchors[1]) / 2,
      9,
    );
    // The reference's own stretches: the first card over 0…63, the second
    // from 64.
    expect(readingIndex(desktop, plan, 63)).toBe(0);
    expect(readingIndex(desktop, plan, 64)).toBe(1);
  });

  it('on an empty plan is the plain line, and nothing is ever current', () => {
    const empty = frame(633, 5_000, []);
    const plan = planReadingLine(empty);

    expect(plan).toEqual({
      line: 364.5,
      landings: [],
      anchors: [],
      margins: [],
    });
    expect(readingProbe(plan, 250)).toBe(250 + 364.5);
    expect(readingIndex(empty, plan, 250)).toBe(-1);
  });
});

describe('planReadingLine — the two ends of the page', () => {
  it('the owner’s case: at 1920×945 the first card rests at scroll 0 and IS the answer there — the screen’s own middle would have skipped it', () => {
    // "so smaller cars at top also get selection" (owner, 2026-09-29). At
    // scroll 0 — as high as the page goes — the SECOND card's top (422px) is
    // already above the screen's middle (472.5px), so a fixed middle line
    // names the second card from the first frame and the first card is never
    // current at all. The bend keeps the probe inside the first card there.
    const desktop = frameOf(MEASURED[2]);
    const plan = planReadingLine(desktop);

    expect(plan.landings[0]).toBe(0);
    expect(readingIndex(desktop, plan, 0)).toBe(0);
    expect(fixedLineIndex(desktop, 945 / 2, 0)).toBe(1);
    // …and not even the plain middle of the CLEAR area would have saved it.
    expect(fixedLineIndex(desktop, plan.line, 0)).toBe(1);
  });

  it('keeps neighbouring landings at least a step apart, inside 0…reach, on every measured window', () => {
    for (const page of MEASURED) {
      const value = frameOf(page);
      const plan = planReadingLine(value);
      const reach = Math.max(0, page.maxScrollY);
      // None of the measured pages is too short for its steps: scale 1.
      plan.landings.forEach((landing, index) => {
        expect(landing).toBeGreaterThanOrEqual(0);
        expect(landing).toBeLessThanOrEqual(reach);
        if (index === 0) return;
        const step =
          (page.tops[index] - page.tops[index - 1]) / READING_END_PACE;
        expect(landing - plan.landings[index - 1]).toBeGreaterThanOrEqual(step);
      });
    }
  });

  it('clamps every landing into 0…reach — scaled steps leave float noise, and the measured windows are untouched by it', () => {
    // THE CLAMP (the header). The G2 typescript review's frame: eight cards on
    // a 1810px window that scrolls 265px, steps scaled to fit — and before the
    // clamp its first landing came out at −7.1e−15.
    const noisy = frame(1_810, 265, [
      [25, 394],
      [442, 186],
      [640, 167],
      [829, 125],
      [977, 312],
      [1_305, 333],
      [1_663, 117],
      [1_803, 213],
    ]);
    const plan = planReadingLine(noisy);

    for (const landing of plan.landings) {
      expect(landing).toBeGreaterThanOrEqual(0);
      expect(landing).toBeLessThanOrEqual(265);
    }
    // No measured window's landing moves: each still equals the reference
    // implementation's, which knows no clamp.
    for (const page of MEASURED) {
      expect(planReadingLine(frameOf(page)).landings).toEqual(page.reference);
    }
  });

  it('never lets the last landing past the end of the page (the UHD window, where the last card rests at maxScrollY)', () => {
    const uhd = MEASURED[3];
    const plan = planReadingLine(frameOf(uhd));

    expect(plan.landings[plan.landings.length - 1]).toBe(uhd.maxScrollY);
  });

  it('a page too short for its steps SCALES them — and every target still has its turn, in order', () => {
    // Five 300px cards back to back need 5 × 150 − 150 = 600px of steps, and
    // the page scrolls 200: the scale is a third, the landings are spread
    // over the whole 0…200, and the line travels six times as fast as the
    // page (THE SCALE: the pace gives way so that no card loses its turn).
    const short = frame(633, 200, [
      [0, 300],
      [300, 300],
      [600, 300],
      [900, 300],
      [1_200, 300],
    ]);
    const plan = planReadingLine(short);

    expect(plan.landings).toEqual([0, 50, 100, 150, 200]);
    expect(answersWalkingDown(short)).toEqual([0, 1, 2, 3, 4]);
  });

  it('a page that cannot scroll lands everything at 0 and answers its FIRST target there', () => {
    // A page that fits its window (maxScrollY below 0 counts as 0): every
    // landing is 0, the probe sits on the FIRST anchor of that run of equal
    // landings, and the first short card is the answer.
    const fits = frame(633, -200, [
      [8, 100],
      [120, 100],
      [240, 100],
    ]);
    const plan = planReadingLine(fits);

    expect(plan.landings).toEqual([0, 0, 0]);
    expect(readingProbe(plan, 0)).toBe(plan.anchors[0]);
    expect(readingIndex(fits, plan, 0)).toBe(0);
  });
});

describe('the two properties, on the measured page', () => {
  describe.each(MEASURED)('$name', (page) => {
    const value = frameOf(page);

    it('reproduces the reference implementation’s landings', () => {
      expect(planReadingLine(value).landings).toEqual(page.reference);
    });

    it('(1) every card is the answer over some stretch of scrolling, and the answers come in document order', () => {
      // Walked one pixel at a time from 0 to the end: the eleven cards follow
      // one another, each at least once, none skipped, none revisited. The
      // phone windows open ABOVE the first card (the menu stacks over the
      // cards there), which is −1 — the spy's top fallback turns it into the
      // first card or into nothing — and only ever before the first card.
      const cards = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const answers = answersWalkingDown(value);

      expect(answers).toEqual(answers[0] === -1 ? [-1, ...cards] : cards);
    });

    it('(2) a click and the scroll rule agree: at each card’s landing, the answer is that card', () => {
      // Rounded, because a browser rests on whole pixels (measured: a
      // planned 780.55 landed at 781) — and still the same answer.
      const plan = planReadingLine(value);

      plan.landings.forEach((landing, index) => {
        expect(readingIndex(value, plan, Math.round(landing))).toBe(index);
      });
    });

    it('its margins reproduce its landings: top − padding − margin === landing', () => {
      const plan = planReadingLine(value);

      value.targets.forEach((target, index) => {
        expect(target.top - PADDING - plan.margins[index]).toBe(
          plan.landings[index],
        );
      });
    });
  });
});

describe('planReadingLine — the margins it hands the spy', () => {
  it('may name a margin below the floor, negative even, for a first target already above its ceiling at scroll 0', () => {
    // A first card at y = 50: its ceiling is 136px down, so at scroll 0 it
    // already sits above it and the only landing the page has for it is 0.
    // The browser clamps a jump at 0 anyway; the margin just says so.
    const early = frame(633, 5_000, [
      [50, 150],
      [1_000, 150],
    ]);
    const plan = planReadingLine(early);

    expect(plan.landings[0]).toBe(0);
    expect(plan.margins[0]).toBe(50 - 0 - PADDING);
    expect(plan.margins[0]).toBeLessThan(0);
  });

  it('never writes to the frame it was given', () => {
    const value = frameOf(MEASURED[0]);
    const before = JSON.stringify(value);
    const frozen: ReadingFrame = Object.freeze({
      ...value,
      targets: Object.freeze(value.targets.map((t) => Object.freeze({ ...t }))),
    });

    const plan: ReadingPlan = planReadingLine(frozen);

    expect(JSON.stringify(frozen)).toBe(before);
    expect(plan.landings).toHaveLength(11);
  });
});

describe('planReadingLine — a frame that cannot be planned throws at once', () => {
  it.each([
    ['viewport', Number.NaN],
    ['viewport', Number.POSITIVE_INFINITY],
    ['padding', Number.NaN],
    ['padding', Number.NEGATIVE_INFINITY],
    ['maxScrollY', Number.NaN],
    ['maxScrollY', Number.POSITIVE_INFINITY],
  ] as const)(
    'refuses %s = %s, naming the field and the value',
    (field, value) => {
      const broken = { ...frameOf(MEASURED[0]), [field]: value };

      expect(() => planReadingLine(broken)).toThrow(RangeError);
      expect(() => planReadingLine(broken)).toThrow(
        `planReadingLine: ${field} must be a finite number of pixels (received ${String(value)})`,
      );
    },
  );

  it.each([0, -1])(
    'refuses a window with no height — viewport = %s',
    (viewport) => {
      expect(() => planReadingLine(frame(viewport, 1_000, []))).toThrow(
        `planReadingLine: viewport must be above 0 (received ${viewport})`,
      );
    },
  );

  it.each(['top', 'height', 'floor'] as const)(
    'refuses a target whose %s is not finite, naming which target',
    (field) => {
      const value = frameOf(MEASURED[0]);
      const broken: ReadingFrame = {
        ...value,
        targets: value.targets.map((target, index) =>
          index === 3 ? { ...target, [field]: Number.NaN } : target,
        ),
      };

      expect(() => planReadingLine(broken)).toThrow(RangeError);
      expect(() => planReadingLine(broken)).toThrow(
        `planReadingLine: targets[3].${field} must be a finite number of pixels (received NaN)`,
      );
    },
  );

  it('refuses a target with a negative height', () => {
    expect(() =>
      planReadingLine(
        frame(633, 1_000, [
          [0, 100],
          [100, -1],
        ]),
      ),
    ).toThrow(
      'planReadingLine: targets[1].height must be at least 0 (received -1)',
    );
  });

  it('takes an empty list of targets, a zero-height target and a page that cannot scroll', () => {
    expect(() => planReadingLine(frame(633, 0, []))).not.toThrow();
    expect(() => planReadingLine(frame(633, -50, [[0, 0]]))).not.toThrow();
  });
});
