// sections/CardCarousel/track — THE BOUNDED LIST'S PING-PONG, as a ring: how
// the 'bounded' mode moves by itself on lib/rotation's clock without wrapping,
// and where a hand on it leaves the scroll heading. React-free, DOM-free —
// CardCarousel.tsx feeds it the ring's index and the hand's steps;
// track.test.ts proves it for every list from two to nine cards.
//
// Owner, verbatim (2026-10-16): "i also want them to have a simple list of
// articles with max left and max right. once an end i reached, it goes in the
// other direction. you can still controll them through swiping left right like
// now" — and of the instances: "i want for each also to. have simple list with
// cange direction onc eend reached".
//
// ── THE TRACK. A list of N cards is walked 0, 1, …, N−1, N−2, …, 1, 0, 1, …
// — out to the last card, back to the first, never wrapping, so no card ever
// crosses the stage. That walk is a RING of 2(N−1) steps, which lib/rotation
// already knows how to run (its clock, its holds, its full interval after a
// hand): ring index k stands the list at
//   p(k) = k            while k ≤ N − 1,
//   p(k) = 2(N−1) − k   after it,
// so the ring's own +1 IS the list's next step, in whichever direction the
// walk is going. lib/rotation stays untouched. Two cards are a ring of two —
// 0, 1, 0, 1. Under two there is no track: one card is no carousel.
//
// ── A HAND ON THE TRACK. A drag let go by `steps`, or a press on previous or
// next, moves the list from p to q = p + steps, kept on the list — on the
// ring index whose walk goes on IN THE DIRECTION THE HAND MOVED: forwards
// after a step forwards, backwards after one back — except at an end, where
// there is only one way on (forwards from the first card, backwards from the
// last). Since 2026-10-17 every such hand also stops the walk for good (the
// owner's OPTION 1 — CardCarousel.tsx's THE CONSUMPTION LAW), so nothing walks
// on from there on the page today; the heading stays the honest choice of the
// two ring indices that stand the list at q — the one a play would resume,
// should a rotation control ever come (lib/rotation's rotationControl) — and
// the arithmetic is unchanged. On the ring that is
//   k' = 0                when q is the first card,
//   k' = N − 1            when q is the last,
//   k' = q                when the hand moved forwards,
//   k' = 2(N−1) − q       when it moved back,
// and a hand that moved nothing (`steps` 0 — a spring back) leaves k as it
// was, direction and all.

/** The track's ring length for a list of `count` cards: 2(count − 1) from two
 *  cards up; the count itself (0 or 1) below — a list that cannot move. */
export function trackLength(count: number): number {
  const cards = Math.max(0, Math.trunc(count));
  return cards >= 2 ? 2 * (cards - 1) : cards;
}

/**
 * THE TRACK (the header): the list position ring index `k` stands at, for a
 * list of `count` cards. Any integer `k` is first brought onto the ring.
 */
export function placeOnTrack(k: number, count: number): number {
  const length = trackLength(count);
  if (length < 2) return 0;
  const step = ((Math.trunc(k) % length) + length) % length;
  const last = count - 1;
  return step <= last ? step : length - step;
}

/**
 * A HAND ON THE TRACK (the header): the ring index a hand moving the list by
 * `steps` from ring index `k` lands on — the list kept on its cards, and the
 * walk heading the way the hand went.
 */
export function handOnTrack(k: number, steps: number, count: number): number {
  const length = trackLength(count);
  if (length < 2 || steps === 0 || !Number.isFinite(steps)) return k;
  const last = count - 1;
  const target = Math.min(
    Math.max(0, placeOnTrack(k, count) + Math.trunc(steps)),
    last,
  );
  // The first card needs its own answer: backwards onto it, 2(N − 1) − 0
  // would name the ring's length, one past its last index. The LAST card does
  // not: there the two rules agree, 2(N − 1) − (N − 1) = N − 1, whichever way
  // the hand moved — the header's third line falls out of the other two.
  if (target === 0) return 0;
  return steps > 0 ? target : length - target;
}
