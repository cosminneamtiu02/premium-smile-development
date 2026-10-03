// lib/reading-line — "WHERE SHOULD A JUMP TO THIS TARGET COME TO REST, AND
// WHICH TARGET IS BEING READ?", as pure arithmetic. The numbers
// lib/scroll-spy's third line measures with (`line: 'reading'`, that header's
// THE READING LINE): the spy reads the page, hands this module a FRAME of
// plain numbers and gets back a PLAN — where each target's jump should land,
// and what the walk should measure at any scroll position. No DOM, no window,
// no React and not one import: numbers in, numbers out, which is the whole
// reason it is a module of its own — its suite proves the design on the
// measured page with numbers alone (CLAUDE.md §4's foundation ring,
// fence-tested by tests/unit/lib-react-free.test.ts).
//
// ── WHY IT EXISTS (owner, 2026-09-29, on the price list's current-card glow):
// "when you scroll, it turns on the shadow highlight too late, once it already
// passes the that point at which you see the top of the card because it
// already passes below the top bar and you see it had been selected, but it
// was already past. i need a new scrolling or selecting of current card that
// keeps the line lower for currently selected items and also selects top one,
// like idk, maybe somehting based on size of card i think would be neccesary
// to be implemented, so smaller cars at top also get selection, but not to get
// selected once they are below the top bar as it is too late then. and also
// the go to card when you click on the meniu on an option should be more to
// the center of the screen the go to selected card, to be more visible."
// Two asks in one message — a LOWER line for "current", and a jump that lands
// a card nearer the middle — and they are ONE design here, because the only
// way a click and a scroll can agree about "current" is if the jump lands
// every card exactly where the scroll rule names it. So the rule that names a
// card and the place a jump puts it are computed together, in this file.
//
// The planner measured the built services page at twelve window sizes, in
// Romanian and in German (card tops, heights, where the document ends:
// `.claude/section-runs/2026-09-29_price-current-aura/round5-geometry.json`)
// and simulated this arithmetic against every one of them
// (`round5-simulate.mjs` beside it — the reference implementation this module
// reproduces, landing for landing): every card has a turn, in order, and every
// click lands where the walk agrees. What a visitor sees change, a card in the
// middle of the list on three of those windows:
//
//     window      reading line   a card becomes current when its top reaches
//     1366×633          364.5px   365px   (the landing line: 137px)
//     1920×945          520.5px   521px   (137px)
//      390×844          470px     471px   (137px)
//
// The alternatives the planner weighed and declined — the screen's own middle
// for the line, a pace of 3 for THE STEP below — stay runnable in the
// reference for the record.
//
// ── THE READING LINE is the middle of the part of the window the page keeps
// CLEAR: `line = (padding + viewport) / 2`, where `padding` is the document's
// `scroll-padding-top` (the header pill's reach, 96px on this site) and
// `viewport` is `innerHeight`. Not `innerHeight / 2` — that is lib/scroll-spy's
// MIDDLE line, the doctor page's course timeline (D49): under a 96px pill the
// middle of what the eye can actually see sits 48px below the middle of the
// screen.
//
// ── A TARGET'S REST — where a jump to it comes to rest, as the viewport y of
// its top edge. It is CENTRED on the line when it fits, and otherwise its top
// sits on its CEILING:
//     ceiling = padding + floor
//     restTop = max(ceiling, line − height / 2)
// `floor` is the target's own STYLESHEET `scroll-margin-top` (40px on a price
// card, its `scroll-mt-[2.5rem]`), so the ceiling is the 136px line the sticky
// price menu rests on — the line every jump landed on before this module
// existed. A card that fits between the ceiling and the ceiling's mirror image
// at the bottom of the window — a height up to `viewport − padding −
// 2·floor`, 457px on a 633px laptop — is centred between them; a taller one
// rests exactly where it rested before, and at that boundary height the two
// descriptions name the same place.
//
// ── ITS IDEAL LANDING is the scroll position that puts it there, `ideal = top
// − restTop` (`top` in DOCUMENT coordinates, `rect.top + scrollY`), and its
// ANCHOR is the document y that lies on the line at that moment, `anchor = top
// + (line − restTop)` — always inside the target: its centre when it is
// centred, `line − ceiling` below its top when it is not.
//
// ── THE PAGE HAS TWO ENDS, and near either of them an ideal landing lies
// outside what the page can scroll: `ideal < 0` for the first cards (at scroll
// 0 they already sit above the line), `ideal > maxScrollY` for the last ones
// (the document runs out before they rise to it). Clamped into the page, those
// cards would share one landing, and of several cards sharing a landing only
// the last could ever be current — exactly the owner's "smaller cars at top
// also get selection". So the landings are kept INSIDE the page and APART:
//   · THE STEP. `step[i] = (top[i] − top[i−1]) / READING_END_PACE` for i ≥ 1:
//     the least scroll distance between two neighbours' landings, a share of
//     the distance between their tops — the first one's size plus the gap
//     under it, which is the owner's own hunch, "based on size of card". A
//     pace of 2 means two neighbours' landings lie at least HALF the distance
//     between their tops apart. It bounds landings against tops and says
//     nothing of how fast the line itself travels: measured on this module's
//     own fixtures, all at scale 1, the probe moves 2.17 times as fast as the
//     page between the first two cards at 1440×789 and at 1920×945, and 2.72
//     times between the fourth and fifth at 3840×2000.
//   · THE SCALE. If the steps together need more than the page can scroll,
//     they are shrunk to fit: `scale = reach / Σ step` when `Σ step > reach`,
//     else 1, with `reach = max(0, maxScrollY)`. On such a page the pace gives
//     way — neighbours' landings sit closer than half the distance between
//     their tops — because every target keeping a turn matters more than the
//     room each one gets.
//   · THE FORWARD PASS pushes each landing at least a step past the one
//     before, from the top: `landing[0] = max(0, ideal[0])`, then `landing[i]
//     = max(ideal[i], landing[i−1] + step[i] × scale)`.
//   · THE BACKWARD PASS pulls each landing at least a step short of the one
//     after, from the end: `landing[n−1] = min(landing[n−1], reach)`, then
//     `landing[i] = min(landing[i], landing[i+1] − step[i+1] × scale)`.
//   · THE CLAMP. Scaled steps leave float noise, and noise can put a landing
//     a hair outside the page (the G2 typescript review's scaled frame, a
//     1810px window that scrolls 265px, planned its first landing at
//     −7.1e−15). So every landing is finally clamped into 0…reach, and the
//     margins are computed from the clamped landings.
// After the two passes and the clamp every landing lies in 0…reach and — for
// a column whose tops rise, on a page that scrolls at all — strictly above the
// one before. Away from the ends nothing moves: a card's landing IS its ideal.
//
// ── THE MARGIN that makes the BROWSER land a jump there is `margin = top −
// landing − padding`, because a fragment jump comes to rest where `rect.top =
// scroll-padding-top + scroll-margin-top`. That is the number lib/scroll-spy
// writes as each target's inline `scroll-margin-top` (its THE READING LINE:
// the one write it makes). It may be smaller than the floor — and negative, for
// a first target whose top already sits above its ceiling at scroll 0. That is
// correct: the browser clamps the jump at 0 anyway, and it takes a negative
// scroll margin at its word (measured in the test browser, 2026-09-29: the
// computed value of an inline `-46.25px` reads back as `-46.25px`).
//
// ── THE PROBE is the document y the walk measures at a scroll position: the
// straight line through every `(landing[i], anchor[i])`, continued with slope
// 1 before the first and after the last. It is computed the way it is best
// understood — the PLAIN line, `scrollY + line`, plus a BEND: each target's
// `anchor − landing − line`, which is zero wherever its landing was not moved,
// interpolated between neighbouring landings and held beyond the two ends.
// So away from the ends the probe IS the plain middle of the clear area, to
// the last bit, and near an end it bends — which is the whole point: it passes
// through every target in order, and through each one AT THAT TARGET'S OWN
// LANDING. On a run of equal landings (possible only on a page that cannot
// scroll, or for targets that share a top) the probe answers with the FIRST
// anchor of the run, so a page that cannot scroll answers its first target at
// scroll 0.
//
// ── THE INDEX is the last target whose top edge the probe has reached, with
// lib/scroll-spy's pixel of grace: the last `i` with `top[i] <= probe + 1`, or
// −1 while the probe is still above the first target (the spy's TOP FALLBACK
// decides what that means).
//
// ── WHAT THAT BUYS — the two properties the suite proves on the measured page,
// for every window it embeds:
//   (1) every target is the answer over some stretch of scrolling, and the
//       answers come in document order;
//   (2) at each target's landing the answer IS that target — so a click, which
//       lands a target on its landing, and the scroll rule, which names what
//       sits on the line, can never disagree.
// Why they hold, in one breath: the landings rise, each anchor lies inside its
// own target and above the next one's top, so the probe climbs through the
// anchors one after another and meets each at its landing.
// THE FOUR ASSUMPTIONS that breath rests on, stated so they are never
// rediscovered (the last two found by the G2 typescript review, 2026-09-29):
//   (1) the targets are a COLUMN in document order — each top at or below the
//       previous target's bottom (the price cards; lib/scroll-spy's own "the
//       walk trusts the order"; ReadingFrame's `targets`);
//   (2) the window is taller than `padding + 2 · floor` (176px on the price
//       page), so that the line lies below the ceiling — in a shorter window
//       no card could sit between the pill and the bottom edge in the first
//       place, and the second PROPERTY no longer holds;
//   (3) no target is 2px tall or less with no gap before the next one: its
//       anchor then sits within the walk's pixel of grace of that neighbour's
//       top, and it loses its own landing to the neighbour — [[1000, 300],
//       [1300, 2], [1302, 300]] as (top, height) answers index 2 at the
//       second target's landing;
//   (4) the page scrolls at least as many whole pixels as it has steps: a
//       page with fewer whole positions than targets cannot give each target
//       one (the review's four cards on a 2062px window that scrolls 2px walk
//       [0, 2, 3]). With real card sizes the review found whole-pixel
//       failures only under 10px of reach.
//
// ── WHAT IT DOES NOT DO: read the page (lib/scroll-spy measures), round
// (lib/scroll-spy rounds the margins it writes, to two decimals), clamp a
// scroll position (the spy passes the real one) or freeze its answers. A plan
// is a fresh set of arrays on every call, and the frame it was made from is
// never written to.

/** One target, in DOCUMENT coordinates (rect.top + scrollY), plus the
 *  stylesheet's own scroll-margin-top for it. */
export type ReadingTarget = Readonly<{
  /** Its top edge, in document pixels: `rect.top + scrollY`. */
  top: number;
  /** Its height in pixels — never negative. */
  height: number;
  /** Its own STYLESHEET `scroll-margin-top` in pixels: the FLOOR (the header's
   *  A TARGET'S REST). */
  floor: number;
}>;

/** Everything a plan is computed from — plain numbers, read by the caller. */
export type ReadingFrame = Readonly<{
  /** `window.innerHeight` — above 0. */
  viewport: number;
  /** `scrollHeight − innerHeight`; below 0 counts as 0 (a page that fits). */
  maxScrollY: number;
  /** The document's `scroll-padding-top`, in pixels. */
  padding: number;
  /**
   * The targets, in document order — and their tops must RISE: each at or
   * below the bottom of the one before (a column, the header's first
   * ASSUMPTION). A list that does not is answered without a throw, and
   * wrongly: [[300, 100], [100, 100], [500, 100]] as (top, height) on a 633px
   * window plans the second landing at −100, clamped to 0 — the first one's.
   */
  targets: readonly ReadingTarget[];
}>;

/** What the arithmetic answers: one entry per target, in the frame's order. */
export type ReadingPlan = Readonly<{
  /** THE READING LINE, as a viewport y. */
  line: number;
  /** Where each target's jump comes to rest — scroll positions inside
   *  0…reach, strictly rising while reach > 0 and the targets' tops rise. */
  landings: readonly number[];
  /** The document y that lies on the line when each target has landed. */
  anchors: readonly number[];
  /** The `scroll-margin-top`, in CSS pixels, that makes the browser land each
   *  target's jump on its landing. */
  margins: readonly number[];
}>;

/**
 * THE END PACE (the header's THE STEP): two neighbours' landings lie at least
 * `(top[i] − top[i−1]) / READING_END_PACE` apart — half the distance between
 * their tops — unless the page is too short for that (THE SCALE). It bounds
 * landings against tops, not the speed of the line: that is the probe's, and
 * it reached 2.72 times the page's on the measured windows. The planner's
 * decided value, 2026-09-29.
 */
export const READING_END_PACE = 2;

/** lib/scroll-spy's pixel of grace: the sub-pixel arithmetic of a fractional
 *  device-pixel ratio or a zoomed page may leave a top a hair past the
 *  probe. */
const GRACE_PX = 1;

/** A frame number that is not a finite pixel count cannot be planned from. */
function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(
      `planReadingLine: ${name} must be a finite number of pixels (received ${String(value)}). A page is measured in pixels, and NaN or Infinity would reach every landing.`,
    );
  }
}

/**
 * THE PLAN: every target's landing, anchor and margin (the header, top to
 * bottom).
 *
 * @param frame the window, the document's end, its scroll padding and the
 * targets in document order — plain numbers.
 * @returns a fresh plan; the frame is never written to. An empty list of
 * targets is legal and plans nothing — empty arrays, the line alone.
 * @throws RangeError when `viewport`, `padding`, `maxScrollY` or any target's
 * `top`, `height` or `floor` is not a finite number, when `viewport` is not
 * above 0 — a window with no height has no clear area to find the middle of —
 * and when a `height` is negative, which no box on a page can be.
 */
export function planReadingLine(frame: ReadingFrame): ReadingPlan {
  const { viewport, maxScrollY, padding, targets } = frame;
  assertFinite('viewport', viewport);
  assertFinite('padding', padding);
  assertFinite('maxScrollY', maxScrollY);
  if (viewport <= 0) {
    throw new RangeError(
      `planReadingLine: viewport must be above 0 (received ${String(viewport)}). A window with no height has no clear area to find the middle of.`,
    );
  }
  targets.forEach((target, index) => {
    assertFinite(`targets[${index}].top`, target.top);
    assertFinite(`targets[${index}].height`, target.height);
    assertFinite(`targets[${index}].floor`, target.floor);
    if (target.height < 0) {
      throw new RangeError(
        `planReadingLine: targets[${index}].height must be at least 0 (received ${String(target.height)}). No box on a page is shorter than nothing.`,
      );
    }
  });

  const line = (padding + viewport) / 2;

  // A TARGET'S REST, ITS IDEAL LANDING and its ANCHOR (the header).
  const ideals: number[] = [];
  const anchors: number[] = [];
  for (const { top, height, floor } of targets) {
    const restTop = Math.max(padding + floor, line - height / 2);
    ideals.push(top - restTop);
    anchors.push(top + (line - restTop));
  }

  // THE PAGE HAS TWO ENDS: the steps, their scale, and the two passes.
  const reach = Math.max(0, maxScrollY);
  const steps = targets.map((target, index) =>
    index === 0 ? 0 : (target.top - targets[index - 1].top) / READING_END_PACE,
  );
  const total = steps.reduce((sum, step) => sum + step, 0);
  // `total > reach` means `total > 0` — reach is never negative — so the
  // division is safe; and when every step is 0 the scale multiplies nothing,
  // whatever it is.
  const scale = total > reach ? reach / total : 1;
  const landings: number[] = [];
  for (let index = 0; index < ideals.length; index += 1) {
    landings.push(
      index === 0
        ? Math.max(0, ideals[0])
        : Math.max(ideals[index], landings[index - 1] + steps[index] * scale),
    );
  }
  for (let index = landings.length - 1; index >= 0; index -= 1) {
    landings[index] =
      index === landings.length - 1
        ? Math.min(landings[index], reach)
        : Math.min(
            landings[index],
            landings[index + 1] - steps[index + 1] * scale,
          );
  }
  // THE CLAMP (the header): float noise from scaled steps can leave a landing
  // a hair outside the page.
  for (let index = 0; index < landings.length; index += 1) {
    landings[index] = Math.min(reach, Math.max(0, landings[index]));
  }

  // THE MARGIN (the header): what makes the browser's own jump land there,
  // from the clamped landings.
  const margins = targets.map(
    (target, index) => target.top - landings[index] - padding,
  );
  return { line, landings, anchors, margins };
}

/**
 * THE PROBE (the header): the document y the walk measures at `scrollY` — the
 * plain line, `scrollY + line`, plus the plan's bend.
 *
 * @param plan a plan from planReadingLine.
 * @param scrollY the page's scroll position.
 * @returns the probe's document y; on an empty plan, `scrollY + line`.
 */
export function readingProbe(plan: ReadingPlan, scrollY: number): number {
  const { line, landings, anchors } = plan;
  const count = landings.length;
  if (count === 0) return scrollY + line;
  /** A target's BEND: how far its anchor sits off the plain line when it has
   *  landed — zero wherever its landing was not moved. */
  const bend = (index: number): number =>
    anchors[index] - landings[index] - line;

  // The first landing AT OR PAST scrollY: the right-hand end of the stretch
  // that holds it.
  let right = 0;
  while (right < count && landings[right] < scrollY) right += 1;
  // ON a landing: exactly that target's anchor — and, `right` being the FIRST
  // landing at or past scrollY, the first of a run of equal landings (targets
  // that share a top). A page that cannot scroll does not rest on this
  // branch: at its one position, 0, the `right === 0` branch below answers the
  // same first anchor.
  if (right < count && landings[right] === scrollY) return anchors[right];
  // Before the first landing and past the last: slope 1, the end's bend held.
  if (right === 0) return scrollY + line + bend(0);
  if (right === count) return scrollY + line + bend(count - 1);
  // Between two landings, the bend is interpolated. The span is positive:
  // landings[left] < scrollY < landings[right].
  const left = right - 1;
  const share = (scrollY - landings[left]) / (landings[right] - landings[left]);
  return scrollY + line + bend(left) + share * (bend(right) - bend(left));
}

/**
 * THE INDEX (the header): the last target whose top edge the probe has
 * reached, with the pixel of grace.
 *
 * @param frame the frame the plan was made from.
 * @param plan its plan.
 * @param scrollY the page's scroll position.
 * @returns that target's index, or −1 while the probe is above the first
 * target (and on an empty frame).
 */
export function readingIndex(
  frame: ReadingFrame,
  plan: ReadingPlan,
  scrollY: number,
): number {
  const probe = readingProbe(plan, scrollY);
  let index = -1;
  frame.targets.forEach((target, position) => {
    if (target.top <= probe + GRACE_PX) index = position;
  });
  return index;
}
