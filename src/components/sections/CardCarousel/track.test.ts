import { describe, expect, it } from 'vitest';
import { handOnTrack, placeOnTrack, trackLength } from './track';

// sections/CardCarousel/track — the bounded list's ping-pong as a ring (its
// header). Exhaustive: every list from two to nine cards, every ring index,
// every hand. The wiring — that the island drives the ring with lib/rotation's
// clock and lands a hand with goto — is CardCarousel.test.tsx's.

const COUNTS = [2, 3, 4, 5, 6, 7, 8, 9] as const;

/** The list positions a whole lap of the ring walks through, from k = 0. */
const lap = (count: number): number[] =>
  Array.from({ length: trackLength(count) }, (_, k) => placeOnTrack(k, count));

describe('track — the ring that walks out and back', () => {
  it('is 2(N − 1) steps long for every list from two cards up, and does not move under two', () => {
    for (const count of COUNTS)
      expect(trackLength(count)).toBe(2 * (count - 1));
    expect(trackLength(1)).toBe(1);
    expect(trackLength(0)).toBe(0);
    expect(placeOnTrack(0, 1)).toBe(0);
    expect(placeOnTrack(5, 0)).toBe(0);
  });

  it.each(COUNTS)(
    'walks %i cards out to the last and back to the first, one card a step, never wrapping',
    (count) => {
      const last = count - 1;
      const walk = lap(count);
      // Out: 0, 1, …, N−1. Back: N−2, …, 1. Then the ring starts over at 0.
      expect(walk).toEqual([
        ...Array.from({ length: count }, (_, p) => p),
        ...Array.from({ length: count - 2 }, (_, i) => last - 1 - i),
      ]);
      // Every step of the walk — the lap's own and the one that closes it —
      // moves the list by exactly one card: no jump from the last to the first.
      for (let k = 0; k < walk.length; k++) {
        const here = walk[k];
        const next = placeOnTrack(k + 1, count);
        expect(Math.abs(next - here), `${count} cards, step ${k}`).toBe(1);
      }
      // …and turns round only at the two ends.
      for (let k = 1; k < walk.length; k++) {
        const before = placeOnTrack(k - 1, count);
        const here = placeOnTrack(k, count);
        const after = placeOnTrack(k + 1, count);
        const turns = Math.sign(after - here) !== Math.sign(here - before);
        expect(turns, `${count} cards at ${here}`).toBe(
          here === 0 || here === last,
        );
      }
    },
  );

  it('walks two cards as a ring of two: 0, 1, 0, 1', () => {
    expect(Array.from({ length: 6 }, (_, k) => placeOnTrack(k, 2))).toEqual([
      0, 1, 0, 1, 0, 1,
    ]);
  });

  it('brings any integer index onto the ring first', () => {
    expect(placeOnTrack(-1, 5)).toBe(1);
    expect(placeOnTrack(8, 5)).toBe(0);
    expect(placeOnTrack(13, 5)).toBe(3);
  });
});

describe('track — a hand on it', () => {
  it.each(COUNTS)(
    'lands %i cards on the card the hand chose, kept on the list, and heads on the way the hand went',
    (count) => {
      const last = count - 1;
      const length = trackLength(count);
      for (let k = 0; k < length; k++) {
        const from = placeOnTrack(k, count);
        for (let steps = -(count + 1); steps <= count + 1; steps++) {
          if (steps === 0) continue;
          const landed = handOnTrack(k, steps, count);
          const label = `${count} cards, k ${k}, steps ${steps}`;
          // On the ring, and on the card the hand chose — clamped to the list.
          expect(Number.isInteger(landed), label).toBe(true);
          expect(landed, label).toBeGreaterThanOrEqual(0);
          expect(landed, label).toBeLessThan(length);
          const to = Math.min(Math.max(0, from + steps), last);
          expect(placeOnTrack(landed, count), label).toBe(to);
          // The next automatic step goes the way the hand went — or the only
          // way on from an end.
          const next = placeOnTrack(landed + 1, count);
          const heading = to === 0 ? 1 : to === last ? -1 : Math.sign(steps);
          expect(next - to, label).toBe(heading);
        }
      }
    },
  );

  it('leaves the ring where it was — direction and all — for a hand that moved nothing', () => {
    for (const count of COUNTS) {
      for (let k = 0; k < trackLength(count); k++) {
        expect(handOnTrack(k, 0, count)).toBe(k);
        expect(handOnTrack(k, Number.NaN, count)).toBe(k);
      }
    }
  });

  it('turns the walk round by hand: a step back while it walks out heads it back', () => {
    // Seven cards walking out, at the third (k = 2): one step back lands on
    // the second card heading BACK — the ring's far side, 2(N−1) − 1 = 11.
    expect(handOnTrack(2, -1, 7)).toBe(11);
    expect(placeOnTrack(12, 7)).toBe(0);
    // Walking back, at the third (k = 10): a step forward heads it OUT again.
    expect(placeOnTrack(10, 7)).toBe(2);
    expect(handOnTrack(10, 1, 7)).toBe(3);
    expect(placeOnTrack(4, 7)).toBe(4);
  });

  it('moves nothing on a list that cannot move', () => {
    expect(handOnTrack(0, 1, 1)).toBe(0);
    expect(handOnTrack(0, -3, 0)).toBe(0);
  });
});
