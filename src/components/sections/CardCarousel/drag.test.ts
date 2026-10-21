import { describe, expect, it } from 'vitest';
import { DECIDE_PX, VERTICAL_PAN_RATIO } from '@/lib/strip-follow/strip-follow';
import {
  BOUNDED_RESISTANCE,
  DRAG_DECIDE_PX,
  DRAG_VERTICAL_RATIO,
  FLICK_MIN_STEPS,
  FLICK_MS,
  judgeAxis,
  releaseSteps,
  resist,
} from './drag';

// sections/CardCarousel/drag — the hand's rules as numbers (its header). The
// wiring — that the stage feeds them real pointer events, captures, swallows
// the click — is CardCarousel.test.tsx's; this suite proves the rules.

describe('drag — the axis, judged once', () => {
  it('judges with the house’s own numbers (KEEP-IN-SYNC with lib/strip-follow)', () => {
    expect(DRAG_DECIDE_PX).toBe(DECIDE_PX);
    expect(DRAG_VERTICAL_RATIO).toBe(VERTICAL_PAN_RATIO);
  });

  it('decides nothing under 10px — a tap or a wobble', () => {
    expect(judgeAxis(0, 0)).toBe('pending');
    expect(judgeAxis(6, 7)).toBe('pending');
    expect(judgeAxis(-9.9, 0)).toBe('pending');
  });

  it('takes a sideways travel as a drag ACROSS the carousel, either way', () => {
    expect(judgeAxis(10, 0)).toBe('across');
    expect(judgeAxis(-40, 3)).toBe('across');
  });

  it('leaves a pan within 35° of vertical to the page', () => {
    expect(judgeAxis(0, 10)).toBe('along');
    expect(judgeAxis(7, 10)).toBe('along'); // |dx| = 0.7 |dy|: on the line
    expect(judgeAxis(-7, -10)).toBe('along');
    expect(judgeAxis(7.1, 10)).toBe('across'); // just flatter
  });
});

describe('drag — the release', () => {
  it('lands on the nearest card: the travel rounded to whole steps', () => {
    expect(releaseSteps(0.6, 1_000)).toBe(1);
    expect(releaseSteps(-0.6, 1_000)).toBe(-1);
    expect(releaseSteps(1.4, 1_000)).toBe(1);
    expect(releaseSteps(2.5, 1_000)).toBe(3);
    expect(releaseSteps(0.4, 1_000)).toBe(0);
  });

  it('defines the flick as the header does: let go within 300 ms, a tenth of a step at least', () => {
    expect(FLICK_MS).toBe(300);
    expect(FLICK_MIN_STEPS).toBe(0.1);
  });

  it('moves one card for a QUICK flick of at least a tenth of a step', () => {
    expect(releaseSteps(0.2, FLICK_MS)).toBe(1);
    expect(releaseSteps(-FLICK_MIN_STEPS, 120)).toBe(-1);
    expect(releaseSteps(0.4, 50)).toBe(1);
  });

  it('snaps back a slow short slide, and a quick touch that barely moved', () => {
    expect(releaseSteps(0.3, FLICK_MS + 1)).toBe(0);
    expect(releaseSteps(0.09, 50)).toBe(0);
    expect(Object.is(releaseSteps(-0.4, 1_000), 0)).toBe(true);
  });

  it('moves nothing for a travel that is not a number', () => {
    expect(releaseSteps(Number.NaN, 10)).toBe(0);
    expect(releaseSteps(Number.POSITIVE_INFINITY, 10)).toBe(0);
  });
});

describe('drag — the full stop', () => {
  it('follows the hand inside the list', () => {
    expect(resist(0, 7)).toBe(0);
    expect(resist(3.4, 7)).toBe(3.4);
    expect(resist(6, 7)).toBe(6);
  });

  it('follows a third of the hand past either end', () => {
    expect(BOUNDED_RESISTANCE).toBeCloseTo(1 / 3, 12);
    expect(resist(-0.6, 7)).toBeCloseTo(-0.2, 12);
    expect(resist(6.9, 7)).toBeCloseTo(6.3, 12);
  });
});
