import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DECIDE_PX as SPY_DECIDE_PX,
  LOAD_WAIT_CEILING_MS,
  VERTICAL_PAN_RATIO as SPY_VERTICAL_PAN_RATIO,
} from '../scroll-spy/scroll-spy.ts';
import {
  centredScrollLeft,
  createStripFollow,
  DECIDE_PX,
  DEFAULT_FADE_MS,
  DEFAULT_QUIET_MS,
  easeInOut,
  fadeMs,
  GATE_CEILING_MS,
  HOVER_WAIT_MAX_MS,
  nearestScrollLeft,
  type StripFollow,
  VERTICAL_PAN_RATIO,
} from './strip-follow.ts';

// Runs in the `components` project (real chromium, vitest.config.ts) because
// the strip is a real scrolling box — a real `scrollLeft`, real rects, a real
// ResizeObserver and real animation frames. No React and no Testing Library:
// the fixture is a <ul> of links built by hand (lib/scroll-spy's precedent).
//
// ── FAKE TIMERS FOR THE QUIET WINDOW ONLY, `toFake` NAMED: the quiet window
// is a setTimeout the suite must own, while the glide rides the frame clock,
// which must stay real (lib/scroll-spy's suite measured that vitest's default
// `toFake` replaces requestAnimationFrame too, and every frame would hang).

/** The strip's visible width and each item's width, in test pixels: ten
 *  120px items in a 300px strip, so the strip scrolls 1200 − 300 = 900px and
 *  every rule has room to show. */
const STRIP_WIDTH = 300;
const ITEM_WIDTH = 120;
const COUNT = 10;
const MAX = COUNT * ITEM_WIDTH - STRIP_WIDTH;

/** Every follower a test starts, disposed in afterEach. */
const live: StripFollow[] = [];
let host: HTMLElement | undefined;

/** The fixture: a sideways-scrolling strip of `COUNT` links, `item-0`…, each
 *  `ITEM_WIDTH` wide, no gaps and no padding — so an item's start in the
 *  scrolled content is simply index × ITEM_WIDTH. */
function buildStrip(): HTMLElement {
  host = document.createElement('div');
  const strip = document.createElement('ul');
  strip.id = 'strip';
  strip.style.cssText = `display: flex; width: ${STRIP_WIDTH}px; overflow-x: auto; margin: 0; padding: 0; list-style: none; scrollbar-width: none;`;
  for (let index = 0; index < COUNT; index += 1) {
    const item = document.createElement('li');
    item.style.cssText = `flex: none; width: ${ITEM_WIDTH}px;`;
    const link = document.createElement('a');
    link.href = `#item-${index}`;
    link.textContent = `Categoria ${index}`;
    link.style.cssText = 'display: block; height: 44px;';
    item.append(link);
    strip.append(item);
  }
  host.append(strip);
  document.body.append(host);
  return strip;
}

/** Where THE RULE puts item `index` in the fixture. */
const centreOf = (index: number): number =>
  Math.min(
    MAX,
    Math.max(0, index * ITEM_WIDTH + ITEM_WIDTH / 2 - STRIP_WIDTH / 2),
  );

function makeFollow(): StripFollow {
  const follow = createStripFollow({ id: 'strip' });
  live.push(follow);
  return follow;
}

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));

/** The next frame's own timestamp — the clock every animation-frame
 *  callback of that frame shares, the glide's included. */
const nextFrameAt = (): Promise<number> =>
  new Promise((resolve) => requestAnimationFrame((time) => resolve(time)));

/** Real frames until `ms` of real time have passed — the glide's own clock. */
async function framesFor(ms: number): Promise<void> {
  const until = performance.now() + ms;
  while (performance.now() < until) await nextFrame();
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
  for (const follow of live) follow.dispose();
  live.length = 0;
  host?.remove();
  host = undefined;
  // The URL's fragment outlives a test (it is the page's address, not the
  // DOM) and closes THE BROWSER'S FRAGMENT JUMP gate of the next start().
  window.history.replaceState(
    null,
    '',
    window.location.pathname + window.location.search,
  );
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('centredScrollLeft — THE RULE: centred, clamped, never a ring', () => {
  it('centres an item in the middle of the visible box', () => {
    expect(
      centredScrollLeft({
        itemStart: 600,
        itemSize: 120,
        viewportSize: 300,
        scrollSize: 1200,
      }),
    ).toBe(600 + 60 - 150);
  });

  it('rests the first items at the strip’s start — never a negative scroll', () => {
    expect(
      centredScrollLeft({
        itemStart: 0,
        itemSize: 120,
        viewportSize: 300,
        scrollSize: 1200,
      }),
    ).toBe(0);
    expect(
      centredScrollLeft({
        itemStart: 60,
        itemSize: 120,
        viewportSize: 300,
        scrollSize: 1200,
      }),
    ).toBe(0);
  });

  it('rests the last items at the strip’s end — never past it, never round to the start', () => {
    expect(
      centredScrollLeft({
        itemStart: 1080,
        itemSize: 120,
        viewportSize: 300,
        scrollSize: 1200,
      }),
    ).toBe(900);
  });

  it('answers 0 for a strip that fits — nothing to scroll', () => {
    expect(
      centredScrollLeft({
        itemStart: 200,
        itemSize: 120,
        viewportSize: 800,
        scrollSize: 640,
      }),
    ).toBe(0);
  });

  it('centres an item wider than the box on its own middle', () => {
    expect(
      centredScrollLeft({
        itemStart: 400,
        itemSize: 500,
        viewportSize: 300,
        scrollSize: 2000,
      }),
    ).toBe(400 + 250 - 150);
  });
});

describe('fadeMs — the item’s own clock, read', () => {
  it.each([
    ['400ms', 400],
    ['0.4s', 400],
    [' 250ms ', 250],
    ['1.5s', 1500],
    ['0ms', 0],
  ] as const)('reads %j as %d', (value, ms) => {
    expect(fadeMs(value)).toBe(ms);
  });

  it.each(['', 'auto', 'var(--fade)', '-100ms', '400', 'NaNms'])(
    'falls back to the system’s 400ms for %j',
    (value) => {
      expect(fadeMs(value)).toBe(DEFAULT_FADE_MS);
    },
  );

  it('the fallback IS the system’s own clock', () => {
    expect(DEFAULT_FADE_MS).toBe(400);
  });
});

describe('easeInOut — CSS ease-in-out exactly, cubic-bezier(0.42, 0, 0.58, 1)', () => {
  it('starts at 0, ends at 1, and passes the middle at the middle', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 6);
    // Outside the clock it holds its ends.
    expect(easeInOut(-1)).toBe(0);
    expect(easeInOut(2)).toBe(1);
  });

  it('is symmetric about the middle — f(1 − x) = 1 − f(x)', () => {
    for (const x of [0.05, 0.1, 0.2, 0.3, 0.4]) {
      expect(easeInOut(1 - x)).toBeCloseTo(1 - easeInOut(x), 6);
    }
  });

  it('matches the curve’s own points — slow in, slow out', () => {
    // The Bézier's own parametric points, worked by hand from its control
    // points: at t = ¼, x = 3·(¾)²·¼·0.42 + 3·¾·(¼)²·0.58 + (¼)³ = 0.274375
    // and y = 3·¾·(¼)²·1 + (¼)³ = 0.15625; at t = ¾ the mirror image,
    // (0.725625, 0.84375) — so the solver is checked against the curve.
    expect(easeInOut(0.274375)).toBeCloseTo(0.15625, 4);
    expect(easeInOut(0.725625)).toBeCloseTo(0.84375, 4);
    // Slow in: a quarter of the time covers well under a quarter of the way.
    expect(easeInOut(0.25)).toBeLessThan(0.2);
  });

  it('never runs backwards', () => {
    let last = 0;
    for (let x = 0; x <= 1.0001; x += 0.01) {
      const y = easeInOut(Math.min(1, x));
      expect(y).toBeGreaterThanOrEqual(last - 1e-9);
      last = y;
    }
  });
});

describe('createStripFollow — construction is pure, and the options that cannot work throw', () => {
  it('touches no document and no timer before start()', () => {
    const lookup = vi.spyOn(document, 'getElementById');
    const timer = vi.spyOn(window, 'setTimeout');
    createStripFollow({ id: 'strip' });
    expect(lookup).not.toHaveBeenCalled();
    expect(timer).not.toHaveBeenCalled();
  });

  it('refuses an empty id, and calls a whitespace-only one BLANK', () => {
    expect(() => createStripFollow({ id: '' })).toThrow(
      /id must be a non-blank element id \(received an empty one\)/,
    );
    expect(() => createStripFollow({ id: '  ' })).toThrow(
      /id must be a non-blank element id \(received a blank one\)/,
    );
  });

  it.each([0, 0.5, -1, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 31])(
    'refuses a quiet window of %d',
    (quietMs) => {
      expect(() => createStripFollow({ id: 'strip', quietMs })).toThrow(
        /quietMs must be a finite number of milliseconds/,
      );
    },
  );

  it('inherits lib/scroll-spy’s 150ms settle window', () => {
    expect(DEFAULT_QUIET_MS).toBe(150);
  });

  it('gives up on a load WITH lib/scroll-spy — GATE_CEILING_MS is its LOAD_WAIT_CEILING_MS (KEEP-IN-SYNC)', () => {
    expect(GATE_CEILING_MS).toBe(LOAD_WAIT_CEILING_MS);
    expect(GATE_CEILING_MS).toBe(10_000);
  });

  it('judges a finger’s pan after lib/scroll-spy’s 10px — DECIDE_PX is the spy’s own (KEEP-IN-SYNC)', () => {
    expect(DECIDE_PX).toBe(SPY_DECIDE_PX);
    expect(DECIDE_PX).toBe(10);
  });

  it('lets go only of a CLEARLY vertical pan, as lib/scroll-spy drops its pin — VERTICAL_PAN_RATIO is the spy’s own, tan 35° (KEEP-IN-SYNC)', () => {
    expect(VERTICAL_PAN_RATIO).toBe(SPY_VERTICAL_PAN_RATIO);
    expect(VERTICAL_PAN_RATIO).toBeCloseTo(Math.tan((35 * Math.PI) / 180), 3);
  });
});

describe('createStripFollow — following', () => {
  it('is a no-op before start() and after dispose()', () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.follow('item-6');
    expect(strip.scrollLeft).toBe(0);
    follow.start();
    follow.dispose();
    follow.follow('item-6');
    expect(strip.scrollLeft).toBe(0);
  });

  it('places the FIRST item asked for at once — no glide in from the start', () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();

    follow.follow('item-5');

    // Synchronously, in the same task: a jump, not a frame later.
    expect(strip.scrollLeft).toBe(centreOf(5));
  });

  it('clamps at both ends: the first items at the start, the last at the end', () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-9');
    expect(strip.scrollLeft).toBe(MAX);
    follow.dispose();

    const again = makeFollow();
    again.start();
    again.follow('item-0');
    expect(strip.scrollLeft).toBe(0);
  });

  it('GLIDES to every later item, on ease-in-out, over the item’s own --fade — and ends exactly centred', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-5');
    const from = strip.scrollLeft;
    // The item's own clock: 240ms here, so the test reads the clock it set.
    const target = strip.querySelector<HTMLElement>('a[href="#item-2"]');
    target?.style.setProperty('--fade', '240ms');

    follow.follow('item-2');
    // Not a jump: the strip has not moved in this task.
    expect(strip.scrollLeft).toBe(from);

    // Sample the glide until it lands (with a guard well past the clock), on
    // the frames' OWN clock — the one the glide reads. The first sample is
    // the glide's first frame (its callback was registered first), so a
    // sample's time IS the glide's elapsed time. (Read with performance.now()
    // inside the callbacks, a busy machine — the full suite in parallel — once
    // made a 240ms glide look 219ms long: a frame's timestamp can predate
    // the code that runs in it by more than a frame.)
    const samples: { t: number; left: number }[] = [];
    let firstFrame: number | undefined;
    const guard = performance.now();
    while (performance.now() - guard < 1_000) {
      const time = await nextFrameAt();
      firstFrame ??= time;
      samples.push({ t: time - firstFrame, left: strip.scrollLeft });
      if (Math.abs(strip.scrollLeft - centreOf(2)) < 0.5) break;
    }
    const landedAt = samples[samples.length - 1].t;
    expect(Math.abs(strip.scrollLeft - centreOf(2))).toBeLessThan(0.5);
    // It took the item's clock — never the system's 400ms, never a jump: the
    // landing frame no earlier than the clock less the curve's own tail —
    // ease-in-out leaves under the loop's 0.5px of this 360px move for its
    // last 6.47ms, so a frame there already reads as landed. 7ms before the
    // end the strip is still more than 0.5px away, which this pins:
    const move = from - centreOf(2);
    expect(move * (1 - easeInOut(1 - 7 / 240))).toBeGreaterThan(0.5);
    expect(landedAt).toBeGreaterThanOrEqual(240 - 7);
    expect(landedAt).toBeLessThan(240 + 120);
    // In between it MOVED, monotonically toward the target, through values
    // strictly between the ends.
    const between = samples.filter(
      (sample) => sample.left < from - 0.5 && sample.left > centreOf(2) + 0.5,
    );
    expect(between.length).toBeGreaterThan(3);
    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index].left).toBeLessThanOrEqual(
        samples[index - 1].left + 0.5,
      );
    }
  });

  it('glides on the system’s 400ms when the item carries no clock of its own', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-7');
    const startedAt = performance.now();
    follow.follow('item-3');
    while (
      Math.abs(strip.scrollLeft - centreOf(3)) >= 0.5 &&
      performance.now() - startedAt < 1_500
    ) {
      await nextFrame();
    }
    const took = performance.now() - startedAt;
    expect(Math.abs(strip.scrollLeft - centreOf(3))).toBeLessThan(0.5);
    expect(took).toBeGreaterThanOrEqual(DEFAULT_FADE_MS - 20);
    expect(took).toBeLessThan(DEFAULT_FADE_MS + 150);
  });

  it('a new target mid-glide RETARGETS from where the strip is — never back to the old start', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    follow.follow('item-8');
    await framesFor(150);
    const midway = strip.scrollLeft;
    // The premise: it is on its way, between the two ends.
    expect(midway).toBeGreaterThan(centreOf(1) + 0.5);
    expect(midway).toBeLessThan(centreOf(8) - 0.5);

    follow.follow('item-4');
    await nextFrame();
    // From where it was, toward the new target — no snap back to item-1.
    expect(Math.abs(strip.scrollLeft - midway)).toBeLessThan(40);
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(Math.abs(strip.scrollLeft - centreOf(4))).toBeLessThan(0.5);
  });

  it('JUMPS under reduced motion — read at each move, so a preference set mid-visit is honoured', () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-2');
    const reduce = vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        }) as MediaQueryList,
    );

    follow.follow('item-7');

    expect(reduce).toHaveBeenCalled();
    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('leaves the strip where it is for null — nothing current', () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-6');
    follow.follow(null);
    expect(strip.scrollLeft).toBe(centreOf(6));
  });

  it('skips an item the strip does not hold — no throw, no move', () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-6');
    expect(() => follow.follow('elsewhere')).not.toThrow();
    expect(strip.scrollLeft).toBe(centreOf(6));
  });

  it('a HIDDEN strip is never written to — and when it is shown again its item is placed at once', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    strip.style.display = 'none';
    await nextFrame();
    await nextFrame();

    follow.follow('item-6');
    expect(strip.clientWidth).toBe(0);

    strip.style.display = 'flex';
    // The observer delivers after layout, in the next rendering step.
    await nextFrame();
    await nextFrame();
    expect(strip.scrollLeft).toBe(centreOf(6));
  });

  it('never moves the PAGE — its scroll position stays where it was', async () => {
    const tall = document.createElement('div');
    tall.style.height = '3000px';
    document.body.append(tall);
    try {
      window.scrollTo(0, 400);
      const strip = buildStrip();
      const follow = makeFollow();
      follow.start();
      follow.follow('item-2');
      follow.follow('item-8');
      await framesFor(DEFAULT_FADE_MS + 120);
      expect(strip.scrollLeft).toBe(centreOf(8));
      expect(window.scrollY).toBe(400);
    } finally {
      window.scrollTo(0, 0);
      tall.remove();
    }
  });
});

describe('createStripFollow — THE HAND is never fought', () => {
  const press = (strip: HTMLElement, pointerType = 'mouse'): void => {
    strip.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerType }),
    );
  };
  const release = (pointerType = 'mouse'): void => {
    window.dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, pointerType }),
    );
  };

  it('a press cancels a running glide at once, and nothing moves while the hand is down', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    follow.follow('item-8');
    await framesFor(120);
    press(strip);
    const held = strip.scrollLeft;
    // A change of current item while the hand is down is remembered, not drawn.
    follow.follow('item-5');
    await framesFor(DEFAULT_FADE_MS + 100);
    expect(strip.scrollLeft).toBe(held);
  });

  it('a TAP — a press that never moved the strip — resumes at the release, and the item it chose glides', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    press(strip);
    release();
    // The click that follows a tap names the item; no quiet window to wait.
    follow.follow('item-6');
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(centreOf(6));
  });

  it('a DRAG resumes only once the strip has been quiet for 150ms after the release — momentum included', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    press(strip);
    // The hand moves the strip.
    strip.scrollLeft = 500;
    await nextFrame();
    await nextFrame();
    follow.follow('item-8');
    release();
    // Momentum: the strip still scrolls after the release.
    strip.scrollLeft = 520;
    await nextFrame();
    await nextFrame();
    vi.advanceTimersByTime(DEFAULT_QUIET_MS - 1);
    await framesFor(60);
    expect(strip.scrollLeft).toBe(520);

    vi.advanceTimersByTime(1);
    await framesFor(DEFAULT_FADE_MS + 120);
    // The item that became current meanwhile is followed, smoothly.
    expect(strip.scrollLeft).toBe(centreOf(8));
  });

  it('after a hand with NO new item, the strip stays where the hand left it', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    press(strip);
    strip.scrollLeft = 640;
    await nextFrame();
    await nextFrame();
    release();
    vi.advanceTimersByTime(DEFAULT_QUIET_MS);
    await framesFor(DEFAULT_FADE_MS);
    expect(strip.scrollLeft).toBe(640);
  });

  it('a WHEEL suspends too, and resumes 150ms after its last scroll', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    strip.dispatchEvent(new WheelEvent('wheel', { deltaX: 40, bubbles: true }));
    strip.scrollLeft = 300;
    await nextFrame();
    await nextFrame();
    follow.follow('item-7');
    await framesFor(60);
    expect(strip.scrollLeft).toBe(300);
    vi.advanceTimersByTime(DEFAULT_QUIET_MS);
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('a VERTICAL wheel over the strip pauses nothing — it scrolls the page, and the follower keeps following', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    strip.dispatchEvent(
      new WheelEvent('wheel', { deltaX: 4, deltaY: 120, bubbles: true }),
    );

    follow.follow('item-7');
    await framesFor(DEFAULT_FADE_MS + 120);

    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('Shift with a vertical wheel IS sideways (every engine turns it): it suspends', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    strip.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 120, shiftKey: true, bubbles: true }),
    );

    follow.follow('item-7');
    await framesFor(DEFAULT_FADE_MS + 120);

    expect(strip.scrollLeft).toBe(centreOf(1));
  });

  it('a FINGER: its pan’s pointercancel is not a release — the touch events decide', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    strip.dispatchEvent(
      new TouchEvent('touchstart', { bubbles: true, touches: [] }),
    );
    press(strip, 'touch');
    // The browser takes the touch for panning: a pointercancel, finger down.
    window.dispatchEvent(
      new PointerEvent('pointercancel', {
        bubbles: true,
        pointerType: 'touch',
      }),
    );
    follow.follow('item-6');
    vi.advanceTimersByTime(DEFAULT_QUIET_MS * 4);
    await framesFor(DEFAULT_FADE_MS);
    expect(strip.scrollLeft).toBe(centreOf(1));

    // The finger lifts — no movement, so following resumes at once.
    window.dispatchEvent(
      new TouchEvent('touchend', { bubbles: true, touches: [] }),
    );
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(centreOf(6));
  });

  it('a press right after an instant placement is still a TAP — that placement’s own late scroll event is not the hand’s', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    // The placement writes now; its scroll event is delivered a frame later —
    // AFTER the press below.
    follow.follow('item-3');
    press(strip);
    await nextFrame();
    await nextFrame();
    release();
    follow.follow('item-8');
    // Resumed at the release (no quiet window armed, none advanced here).
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(centreOf(8));
  });

  it('the glide’s own scroll events never count as a hand', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-0');
    follow.follow('item-6');
    await framesFor(DEFAULT_FADE_MS / 2);
    // Mid-glide, a new current item: followed at once from where the strip
    // is — no 150ms wait, which a scroll counted as a hand would impose.
    follow.follow('item-9');
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(MAX);
  });

  /** A finger at (x, y) — a real Touch, so the follower can read where the
   *  gesture began and how far it has travelled. */
  const touchAt = (
    type: 'touchstart' | 'touchmove',
    strip: HTMLElement,
    x: number,
    y: number,
  ): void => {
    const touch = new Touch({
      identifier: 1,
      target: strip,
      clientX: x,
      clientY: y,
    });
    strip.dispatchEvent(
      new TouchEvent(type, {
        bubbles: true,
        touches: [touch],
        changedTouches: [touch],
      }),
    );
  };

  it('a finger whose press turns into a pan ALONG the page lets go at once — and the strip follows live under it, the finger still down', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    touchAt('touchstart', strip, 100, 20);
    // Under DECIDE_PX no pan has begun — a wobble: still the hand's.
    touchAt('touchmove', strip, 101, 20 + DECIDE_PX - 2);
    follow.follow('item-4');
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(centreOf(1));

    // Past DECIDE_PX, mostly downwards: the page's pan, judged once.
    touchAt('touchmove', strip, 103, 20 + DECIDE_PX + 6);
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(centreOf(4));
    // …and every later change follows live — no touchend yet.
    follow.follow('item-7');
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('a pan ACROSS the strip keeps following suspended until the hand lets go — its axis judged ONCE, a later downward drift changing nothing', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    touchAt('touchstart', strip, 100, 20);
    touchAt('touchmove', strip, 100 - DECIDE_PX - 6, 23);
    touchAt('touchmove', strip, 100 - DECIDE_PX - 8, 60);
    follow.follow('item-7');
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(centreOf(1));

    // The finger lifts — the strip never scrolled, so following resumes now.
    window.dispatchEvent(
      new TouchEvent('touchend', { bubbles: true, touches: [] }),
    );
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  /** Where a finger that set off from (100, 20) is after 20px at `degrees`
   *  off vertical — downwards and to the right. */
  const offVertical = (degrees: number): { x: number; y: number } => ({
    x: 100 + 20 * Math.sin((degrees * Math.PI) / 180),
    y: 20 + 20 * Math.cos((degrees * Math.PI) / 180),
  });

  it('only a CLEARLY vertical pan lets go: 40° off vertical is the strip’s — following stays suspended (Chromium hands such a pan to the strip from ~37–40°) — and 30° lets go', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    touchAt('touchstart', strip, 100, 20);
    const at40 = offVertical(40);
    touchAt('touchmove', strip, at40.x, at40.y);
    follow.follow('item-6');
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(centreOf(1));
    // The finger lifts — the strip never scrolled: the change is drawn.
    window.dispatchEvent(
      new TouchEvent('touchend', { bubbles: true, touches: [] }),
    );
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(centreOf(6));

    // A new press, 30° off vertical: the page's — it lets go at once, and
    // the strip follows live with the finger still down.
    touchAt('touchstart', strip, 100, 20);
    const at30 = offVertical(30);
    touchAt('touchmove', strip, at30.x, at30.y);
    follow.follow('item-2');
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(centreOf(2));
  });

  it('THE HAND, WHATEVER THE AXIS SAID: after a pan was judged the page’s, the strip moving under the finger — not by the follower — takes the hand back: the glide stops, nothing is written until it lets go', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    touchAt('touchstart', strip, 100, 20);
    // Straight down: judged the page's — the hand lets go…
    touchAt('touchmove', strip, 101, 40);
    // …and the strip follows live: a glide toward the new item begins.
    follow.follow('item-8');
    await framesFor(DEFAULT_FADE_MS / 3);
    const gliding = strip.scrollLeft;
    expect(gliding).toBeGreaterThan(centreOf(1));
    expect(gliding).toBeLessThan(centreOf(8));

    // The engine hands the pan to the strip after all: the finger moves it.
    const byFinger = Math.round(gliding) - 37;
    strip.scrollLeft = byFinger;
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(byFinger);

    // The finger lifts: the strip moved under the hand, so the quiet window
    // decides — and with no new item, it stays where the hand left it.
    window.dispatchEvent(
      new TouchEvent('touchend', { bubbles: true, touches: [] }),
    );
    vi.advanceTimersByTime(DEFAULT_QUIET_MS);
    await framesFor(DEFAULT_FADE_MS);
    expect(strip.scrollLeft).toBe(byFinger);
  });
});

const linkOf = (strip: HTMLElement, index: number): HTMLElement =>
  strip.querySelector<HTMLElement>(`a[href="#item-${index}"]`) as HTMLElement;

/** Focus a chip the way `by` would have — `:focus-visible` answered as that
 *  input's (the engine's own answer at `focusin`, which a test cannot press a
 *  real key for), every other selector the element's own. preventScroll, so
 *  the browser's own reveal never moves the strip under the test. */
function focusAs(link: HTMLElement, by: 'keyboard' | 'pointer'): void {
  const own = Element.prototype.matches;
  vi.spyOn(link, 'matches').mockImplementation(function (
    this: Element,
    selector: string,
  ) {
    return selector === ':focus-visible'
      ? by === 'keyboard'
      : own.call(this, selector);
  });
  link.focus({ preventScroll: true });
}

/** Something to take the focus OUT of the strip — a real move, so the browser
 *  fires the real `focusout` with the real relatedTarget. */
function outsideButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = 'în afara benzii';
  (host as HTMLElement).append(button);
  return button;
}

/** The reduced-motion preference, set for the rest of a test. */
function preferReducedMotion(): void {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

describe('createStripFollow — THE KEYBOARD: a focused item is never slid away (the planner, 2026-10-09)', () => {
  it('a KEYBOARD focus in the strip pauses following: a change of current item is remembered, never drawn', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    focusAs(linkOf(strip, 1), 'keyboard');

    follow.follow('item-7');
    await framesFor(DEFAULT_FADE_MS + 120);

    expect(strip.scrollLeft).toBe(centreOf(1));
  });

  it('focus moving on to another chip keeps the pause; focus LEAVING the strip draws the change it missed', async () => {
    const strip = buildStrip();
    const outside = outsideButton();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    focusAs(linkOf(strip, 1), 'keyboard');
    follow.follow('item-7');
    // Tab to the next chip: still the keyboard's strip. Its end was cut at
    // the edge (360 > 30 + 300), so THE KEYBOARD'S REVEAL brings it in — the
    // least movement, its end onto the edge, 60 — and nothing else moves.
    focusAs(linkOf(strip, 2), 'keyboard');
    follow.follow('item-8');
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(3 * ITEM_WIDTH - STRIP_WIDTH);

    outside.focus();
    await framesFor(DEFAULT_FADE_MS + 120);

    // The LATEST current item, smoothly — the one the pause remembered.
    expect(strip.scrollLeft).toBe(centreOf(8));
  });

  it('a POINTER’s focus pauses nothing — Chromium focuses a link on mousedown', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    focusAs(linkOf(strip, 1), 'pointer');

    follow.follow('item-6');
    await framesFor(DEFAULT_FADE_MS + 120);

    expect(strip.scrollLeft).toBe(centreOf(6));
  });

  it('a pointer’s focus inside the strip ENDS a keyboard pause — `focusin` is authoritative', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    focusAs(linkOf(strip, 1), 'keyboard');
    follow.follow('item-6');
    await framesFor(60);
    expect(strip.scrollLeft).toBe(centreOf(1));

    focusAs(linkOf(strip, 2), 'pointer');
    await framesFor(DEFAULT_FADE_MS + 120);

    expect(strip.scrollLeft).toBe(centreOf(6));
  });

  it('a WINDOW’s blur keeps the pause — the chip is still the document’s active element', async () => {
    const strip = buildStrip();
    const outside = outsideButton();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    const chip = linkOf(strip, 1);
    focusAs(chip, 'keyboard');
    follow.follow('item-6');

    // What a tab switch delivers: a focusout to nowhere, the chip still active.
    chip.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: null }),
    );
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(document.activeElement).toBe(chip);
    expect(strip.scrollLeft).toBe(centreOf(1));

    // The real departure, later: the change is drawn then.
    outside.focus();
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(centreOf(6));
  });

  it('an engine too old for `:focus-visible` pauses on EVERY focus (it throws on the selector)', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    const chip = linkOf(strip, 1);
    const own = Element.prototype.matches;
    vi.spyOn(chip, 'matches').mockImplementation(function (
      this: Element,
      selector: string,
    ) {
      if (selector === ':focus-visible') {
        throw new SyntaxError(`'${selector}' is not a valid selector`);
      }
      return own.call(this, selector);
    });
    chip.focus({ preventScroll: true });

    follow.follow('item-6');
    await framesFor(DEFAULT_FADE_MS + 120);

    expect(strip.scrollLeft).toBe(centreOf(1));
  });

  it('the keyboard arriving MID-GLIDE stops the strip where it is — and the glide is finished once focus leaves', async () => {
    const strip = buildStrip();
    const outside = outsideButton();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    follow.follow('item-8');
    await framesFor(120);
    // The chip in the MIDDLE of what is drawn — wholly inside, so the
    // keyboard's own reveal moves nothing and the stop is the pause's alone.
    const at = strip.scrollLeft;
    focusAs(
      linkOf(strip, Math.floor((at + STRIP_WIDTH / 2) / ITEM_WIDTH)),
      'keyboard',
    );
    const stopped = strip.scrollLeft;
    expect(stopped).toBe(at);
    // The premise: caught on its way.
    expect(stopped).toBeGreaterThan(centreOf(1) + 0.5);
    expect(stopped).toBeLessThan(centreOf(8) - 0.5);

    await framesFor(DEFAULT_FADE_MS);
    expect(strip.scrollLeft).toBe(stopped);

    outside.focus();
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(centreOf(8));
  });

  it('after a keyboard pause with NO new item, the strip stays where it was left', async () => {
    const strip = buildStrip();
    const outside = outsideButton();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    focusAs(linkOf(strip, 1), 'keyboard');
    // The arrow keys scroll the strip under the focused chip.
    strip.scrollLeft = 640;
    await nextFrame();
    await nextFrame();

    outside.focus();
    await framesFor(DEFAULT_FADE_MS + 120);

    expect(strip.scrollLeft).toBe(640);
  });

  it('start() takes a keyboard focus ALREADY inside the strip as a pause — a remount while a chip holds it', async () => {
    const strip = buildStrip();
    const outside = outsideButton();
    focusAs(linkOf(strip, 0), 'keyboard');
    const follow = makeFollow();
    follow.start();

    follow.follow('item-6');
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(0);

    outside.focus();
    // Never placed yet: the first placement is a jump, at the departure.
    expect(strip.scrollLeft).toBe(centreOf(6));
  });

  it('dispose() takes the focus listeners with it — the very functions start() attached', () => {
    const strip = buildStrip();
    const added = vi.spyOn(strip, 'addEventListener');
    const removed = vi.spyOn(strip, 'removeEventListener');
    const follow = makeFollow();
    follow.start();
    follow.dispose();

    for (const type of ['focusin', 'focusout']) {
      const attached = added.mock.calls.filter(([name]) => name === type);
      const detached = removed.mock.calls.filter(([name]) => name === type);
      expect(attached).toHaveLength(1);
      expect(detached).toHaveLength(1);
      expect(detached[0][1]).toBe(attached[0][1]);
    }
  });
});

describe('nearestScrollLeft — THE KEYBOARD’S REVEAL: the least movement, inside the scroll padding', () => {
  // A 300px strip scrolled to 300, with 20px of scroll padding at each end:
  // the inner box is [320, 580] in the scrolled content.
  const at = {
    viewportSize: 300,
    scrollSize: 1200,
    scrollLeft: 300,
    paddingStart: 20,
    paddingEnd: 20,
  };

  it('an item whose START is left of the inner box: its start onto the inner start edge', () => {
    expect(nearestScrollLeft({ ...at, itemStart: 280, itemSize: 120 })).toBe(
      280 - 20,
    );
  });

  it('an item whose END is right of it: its end onto the inner end edge', () => {
    expect(nearestScrollLeft({ ...at, itemStart: 500, itemSize: 120 })).toBe(
      620 - (300 - 20),
    );
  });

  it('an item already inside moves nothing', () => {
    expect(nearestScrollLeft({ ...at, itemStart: 350, itemSize: 120 })).toBe(
      300,
    );
    // Exactly on both edges is inside too.
    expect(nearestScrollLeft({ ...at, itemStart: 320, itemSize: 260 })).toBe(
      300,
    );
  });

  it('an item WIDER than the inner box is placed in the FULL visible box instead — so its end is never left off screen', () => {
    // 280px against a 260px inner box, inside the 300px window [300, 600]:
    // already wholly inside the window — nothing moves…
    expect(nearestScrollLeft({ ...at, itemStart: 310, itemSize: 280 })).toBe(
      300,
    );
    // …its end past the window's: its end onto the window's own edge…
    expect(nearestScrollLeft({ ...at, itemStart: 330, itemSize: 280 })).toBe(
      610 - 300,
    );
    // …its start before the window's: its start onto the window's own edge.
    expect(nearestScrollLeft({ ...at, itemStart: 200, itemSize: 280 })).toBe(
      200,
    );
  });

  it('…and one wider than the WHOLE window aligns its start with the window’s', () => {
    expect(nearestScrollLeft({ ...at, itemStart: 330, itemSize: 320 })).toBe(
      330,
    );
  });

  it('the case that found it: „Kieferorthopädie" at 200% text-only zoom, ≈370px in a 312px inner box of a 390px window', () => {
    const phone = {
      viewportSize: 390,
      scrollSize: 2400,
      scrollLeft: 1000,
      paddingStart: 39,
      paddingEnd: 39,
    };
    const to = nearestScrollLeft({ ...phone, itemStart: 1100, itemSize: 370 });
    // Its end (1470) past the window's (1390): onto the window's own edge, its
    // start still inside — the whole chip on screen.
    expect(to).toBe(1470 - 390);
    expect(1100 - to).toBeGreaterThanOrEqual(0);
    expect(1470 - to).toBeLessThanOrEqual(390);
  });

  it('clamps at both ends — never a negative scroll, never past the end', () => {
    expect(
      nearestScrollLeft({ ...at, scrollLeft: 50, itemStart: 0, itemSize: 100 }),
    ).toBe(0);
    expect(
      nearestScrollLeft({
        ...at,
        scrollLeft: 500,
        itemStart: 1100,
        itemSize: 100,
      }),
    ).toBe(1200 - 300);
  });

  it('in WHOLE pixels, never short of the edge — a start rounds down, an end rounds up (WebKit holds whole-pixel scroll positions)', () => {
    expect(nearestScrollLeft({ ...at, itemStart: 280.4, itemSize: 120 })).toBe(
      260,
    );
    expect(nearestScrollLeft({ ...at, itemStart: 500.6, itemSize: 120 })).toBe(
      341,
    );
  });

  it('with no scroll padding, the plain visible box', () => {
    const plain = { ...at, paddingStart: 0, paddingEnd: 0 };
    expect(nearestScrollLeft({ ...plain, itemStart: 590, itemSize: 50 })).toBe(
      640 - 300,
    );
    expect(nearestScrollLeft({ ...plain, itemStart: 300, itemSize: 300 })).toBe(
      300,
    );
  });
});

describe('createStripFollow — THE KEYBOARD’S REVEAL: a focused chip, whole (the planner, 2026-10-09)', () => {
  /** The fixture with 20px of scroll padding at each end — the inner box. */
  const PADDING = 20;
  function paddedStrip(): HTMLElement {
    const strip = buildStrip();
    strip.style.scrollPaddingInline = `${PADDING}px`;
    return strip;
  }
  /** Where the reveal puts item `index` whose END was cut at the right. */
  const endOnEdge = (index: number): number =>
    (index + 1) * ITEM_WIDTH - (STRIP_WIDTH - PADDING);

  it('a chip cut at the edge GLIDES in by the least movement — its end onto the inner edge, on its own clock, never drawn at the target first', async () => {
    const strip = paddedStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    expect(strip.scrollLeft).toBe(centreOf(1));
    const chip = linkOf(strip, 2);
    chip.style.setProperty('--fade', '240ms');

    const startedAt = performance.now();
    focusAs(chip, 'keyboard');
    // AT ONCE, the target: the engine's own reveal, still to come in WebKit,
    // finds the chip inside…
    expect(strip.scrollLeft).toBe(endOnEdge(2));
    // …and before the next frame paints, the strip is back where it was seen.
    await nextFrame();
    expect(strip.scrollLeft).toBe(centreOf(1));

    const samples: number[] = [];
    while (performance.now() - startedAt < 1_000) {
      await nextFrame();
      samples.push(strip.scrollLeft);
      if (Math.abs(strip.scrollLeft - endOnEdge(2)) < 0.5) break;
    }
    const tookMs = performance.now() - startedAt;
    expect(Math.abs(strip.scrollLeft - endOnEdge(2))).toBeLessThan(0.5);
    // The least movement — not the centre.
    expect(endOnEdge(2)).not.toBe(centreOf(2));
    // A glide on the chip's clock, monotonic, through values in between.
    expect(tookMs).toBeGreaterThanOrEqual(240 - 20);
    expect(tookMs).toBeLessThan(240 + 150);
    expect(
      samples.filter(
        (left) => left > centreOf(1) + 0.5 && left < endOnEdge(2) - 0.5,
      ).length,
    ).toBeGreaterThan(3);
    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index]).toBeGreaterThanOrEqual(samples[index - 1] - 0.5);
    }
  });

  it('runs WHILE the keyboard pauses following — and the current chip still never moves the strip', async () => {
    const strip = paddedStrip();
    const outside = outsideButton();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    focusAs(linkOf(strip, 1), 'keyboard');
    focusAs(linkOf(strip, 2), 'keyboard');
    follow.follow('item-8');
    await framesFor(DEFAULT_FADE_MS + 120);
    // The focused chip, revealed; the current one, held.
    expect(strip.scrollLeft).toBe(endOnEdge(2));

    outside.focus();
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(centreOf(8));
  });

  it('JUMPS under reduced motion — no glide, no return to where it was', async () => {
    const strip = paddedStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    preferReducedMotion();

    focusAs(linkOf(strip, 3), 'keyboard');

    expect(strip.scrollLeft).toBe(endOnEdge(3));
    await nextFrame();
    await nextFrame();
    expect(strip.scrollLeft).toBe(endOnEdge(3));
  });

  it('a POINTER’s focus never reveals — the pointer is already on what it pressed', async () => {
    const strip = paddedStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');

    focusAs(linkOf(strip, 2), 'pointer');
    await framesFor(DEFAULT_FADE_MS + 120);

    expect(strip.scrollLeft).toBe(centreOf(1));
  });

  it('a chip already inside moves nothing — and an engine’s own scroll for it is undone', async () => {
    const strip = paddedStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    // An engine scrolls in the same task as the focus (Chromium, before
    // `focusin`), for a chip that was already inside.
    strip.scrollLeft = 200;
    focusAs(linkOf(strip, 1), 'keyboard');

    expect(strip.scrollLeft).toBe(centreOf(1));
    await framesFor(DEFAULT_FADE_MS);
    expect(strip.scrollLeft).toBe(centreOf(1));
  });

  it('an engine that scrolled BEFORE `focusin` (Chromium) is overwritten — the glide starts from where the visitor SAW the strip', async () => {
    const strip = paddedStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    await nextFrame();
    await nextFrame();
    // The engine centres the next chip in the focus's own task: no scroll
    // event yet, so nothing has been drawn there.
    strip.scrollLeft = 500;
    focusAs(linkOf(strip, 3), 'keyboard');

    expect(strip.scrollLeft).toBe(endOnEdge(3));
    await nextFrame();
    // Back where it was SEEN — never at the engine's 500, never at the target.
    expect(strip.scrollLeft).toBe(centreOf(1));
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(endOnEdge(3));
  });

  it('two keyboard focuses before a frame: the second glides from where the visitor saw the strip, not from the first one’s target', async () => {
    const strip = paddedStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');

    focusAs(linkOf(strip, 2), 'keyboard');
    focusAs(linkOf(strip, 3), 'keyboard');
    expect(strip.scrollLeft).toBe(endOnEdge(3));

    await nextFrame();
    expect(strip.scrollLeft).toBe(centreOf(1));
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(endOnEdge(3));
  });

  it('a chip cut at the START comes in by its start, onto the inner start edge', async () => {
    const strip = paddedStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-6');
    // item-4 starts at 480; the inner box starts at centreOf(6) + 20 = 650.
    focusAs(linkOf(strip, 4), 'keyboard');
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(4 * ITEM_WIDTH - PADDING);
  });

  it('a hand on the strip: a keyboard focus reveals nothing (never fight the hand)', async () => {
    const strip = paddedStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    strip.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
    );

    focusAs(linkOf(strip, 3), 'keyboard');
    await framesFor(DEFAULT_FADE_MS + 120);

    expect(strip.scrollLeft).toBe(centreOf(1));
  });
});

describe('createStripFollow — A NEW GEOMETRY re-places at once (the planner, 2026-10-09)', () => {
  it('a change of the strip’s WIDTH re-centres its item at once — and cancels a glide in flight', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    follow.follow('item-8');
    await framesFor(100);
    // The premise: mid-glide.
    expect(strip.scrollLeft).toBeLessThan(centreOf(8) - 0.5);

    // A phone rotated: the strip is narrower now.
    strip.style.width = '200px';
    await nextFrame();
    await nextFrame();
    const centred = 8 * ITEM_WIDTH + ITEM_WIDTH / 2 - 200 / 2;
    expect(strip.scrollLeft).toBe(centred);

    // Not a glide resumed on the old numbers: it stays where the new size put it.
    await framesFor(DEFAULT_FADE_MS);
    expect(strip.scrollLeft).toBe(centred);
  });

  it('a change of its HEIGHT alone re-places too — a larger text size widens every item under an unchanged width', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-5');
    expect(strip.scrollLeft).toBe(centreOf(5));

    // Larger text: every item wider AND taller; the strip's width unchanged.
    for (const item of strip.querySelectorAll<HTMLElement>('li')) {
      item.style.width = '150px';
    }
    for (const link of strip.querySelectorAll<HTMLElement>('a')) {
      link.style.height = '60px';
    }
    await nextFrame();
    await nextFrame();

    expect(strip.clientWidth).toBe(STRIP_WIDTH);
    expect(strip.scrollLeft).toBe(5 * 150 + 150 / 2 - STRIP_WIDTH / 2);
  });

  it('a change of size while following is PAUSED moves nothing — the hand or the keyboard holds the strip', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-1');
    strip.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
    );
    strip.scrollLeft = 400;
    await nextFrame();
    await nextFrame();

    strip.style.width = '200px';
    await nextFrame();
    await nextFrame();

    expect(strip.scrollLeft).toBe(400);
  });
});

describe('createStripFollow — THE BROWSER’S FRAGMENT JUMP GOES FIRST (2026-10-10)', () => {
  // Measured on the built price page: in Chromium, ANY scripted scroll of ANY
  // box before the browser's own jump to a URL's `#fragment` makes it skip
  // that jump — and a write before the document has loaded stops its later
  // corrections — so a deep-linked card was left 4 to 811px off its landing.
  // While the URL has a fragment at start(), the page is therefore the
  // browser's to land first: nothing is written until the document has
  // loaded and drawn a frame — and a pointer resting on the strip has left.

  /** The document still loading: the gate waits for its `load`, which the
   *  returned function fires — and then for the frame drawn after it. */
  function documentLoading(): () => Promise<void> {
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('interactive');
    return async () => {
      readyState.mockReturnValue('complete');
      window.dispatchEvent(new Event('load'));
      await nextFrame();
      await nextFrame();
    };
  }

  /** A device whose pointer cannot hover — a phone, a tablet: `(hover:
   *  hover)` false, every other query the browser's own. */
  function pointerCannotHover(): void {
    const own = window.matchMedia.bind(window);
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) =>
      query === '(hover: hover)'
        ? ({
            matches: false,
            media: query,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => false,
          } as MediaQueryList)
        : own(query),
    );
  }

  it('the URL has a #fragment at start(): nothing is written until a frame has been drawn after load — then the item is placed AT ONCE', async () => {
    const strip = buildStrip();
    window.history.replaceState(null, '', '#item-7');
    const follow = makeFollow();
    follow.start();

    follow.follow('item-7');
    expect(strip.scrollLeft).toBe(0);
    // The first frame: its callbacks run before the browser's rendering,
    // where its fragment jump is made — still nothing of ours…
    await nextFrame();
    expect(strip.scrollLeft).toBe(0);
    // …and in the frame after it, the placement: one jump, no glide.
    await nextFrame();
    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('while the document still LOADS, the gate waits for its load event — and then for a drawn frame; the load takes THE CEILING’s timer with it', async () => {
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('interactive');
    const strip = buildStrip();
    window.history.replaceState(null, '', '#item-7');
    const follow = makeFollow();
    follow.start();
    follow.follow('item-7');
    expect(vi.getTimerCount()).toBe(1);

    await framesFor(100);
    expect(strip.scrollLeft).toBe(0);

    readyState.mockReturnValue('complete');
    window.dispatchEvent(new Event('load'));
    expect(vi.getTimerCount()).toBe(0);
    await nextFrame();
    expect(strip.scrollLeft).toBe(0);
    await nextFrame();
    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('THE CEILING: a load that never comes is given up on GATE_CEILING_MS after start() — and the gate opens as if it had come', async () => {
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('interactive');
    const strip = buildStrip();
    window.history.replaceState(null, '', '#item-7');
    const follow = makeFollow();
    follow.start();
    follow.follow('item-7');

    vi.advanceTimersByTime(GATE_CEILING_MS - 1);
    await framesFor(60);
    expect(strip.scrollLeft).toBe(0);

    vi.advanceTimersByTime(1);
    // As after a load: a frame drawn first, then the placement.
    await nextFrame();
    expect(strip.scrollLeft).toBe(0);
    await nextFrame();
    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('a hand that SCROLLED the strip while the gate was closed, the current item unchanged since: the gate opens without placing — the strip stays where the hand left it', async () => {
    const strip = buildStrip();
    window.history.replaceState(null, '', '#item-7');
    const follow = makeFollow();
    follow.start();
    follow.follow('item-7');

    strip.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    strip.scrollLeft = 100;
    window.dispatchEvent(
      new PointerEvent('pointerup', { pointerType: 'mouse' }),
    );
    await nextFrame();
    vi.advanceTimersByTime(DEFAULT_QUIET_MS);
    await nextFrame();
    await nextFrame();

    expect(strip.scrollLeft).toBe(100);
  });

  it('…and a later change GLIDES from where the visitor put it — the strip has been on screen, so it is no first placement', async () => {
    const finishLoading = documentLoading();
    const strip = buildStrip();
    window.history.replaceState(null, '', '#item-7');
    const follow = makeFollow();
    follow.start();
    follow.follow('item-7');
    strip.dispatchEvent(new WheelEvent('wheel', { deltaX: 60, bubbles: true }));
    strip.scrollLeft = 100;
    await framesFor(50);
    vi.advanceTimersByTime(DEFAULT_QUIET_MS);
    await finishLoading();
    expect(strip.scrollLeft).toBe(100);

    follow.follow('item-6');
    await framesFor(DEFAULT_FADE_MS / 2);
    // Mid-glide: between where the visitor left it and where it is going.
    expect(strip.scrollLeft).toBeGreaterThan(100);
    expect(strip.scrollLeft).toBeLessThan(centreOf(6));
    await framesFor(DEFAULT_FADE_MS);
    expect(strip.scrollLeft).toBe(centreOf(6));
  });

  it('a press that moved NOTHING while the gate was closed keeps nothing — a tap, a click: the gate places the current item', async () => {
    const finishLoading = documentLoading();
    const strip = buildStrip();
    window.history.replaceState(null, '', '#item-7');
    const follow = makeFollow();
    follow.start();
    follow.follow('item-7');

    strip.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    window.dispatchEvent(
      new PointerEvent('pointerup', { pointerType: 'mouse' }),
    );
    await framesFor(50);
    await finishLoading();

    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('a NEW current item after the swipe is a selection change — the gate places it after all', async () => {
    const finishLoading = documentLoading();
    const strip = buildStrip();
    window.history.replaceState(null, '', '#item-7');
    const follow = makeFollow();
    follow.start();
    follow.follow('item-7');

    strip.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    strip.scrollLeft = 100;
    window.dispatchEvent(
      new PointerEvent('pointerup', { pointerType: 'mouse' }),
    );
    // The swipe's scroll event lands: the strip scrolled while closed…
    await framesFor(50);
    vi.advanceTimersByTime(DEFAULT_QUIET_MS);
    // …and then the page names another category.
    follow.follow('item-2');
    await finishLoading();

    expect(strip.scrollLeft).toBe(centreOf(2));
  });

  it('a hand STILL on the strip as the gate opens leaves the placement as a change to draw when it lets go', async () => {
    const finishLoading = documentLoading();
    const strip = buildStrip();
    window.history.replaceState(null, '', '#item-7');
    const follow = makeFollow();
    follow.start();
    follow.follow('item-7');
    strip.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

    await finishLoading();
    await framesFor(60);
    expect(strip.scrollLeft).toBe(0);

    window.dispatchEvent(
      new PointerEvent('pointerup', { pointerType: 'mouse' }),
    );
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('a chip holding a KEYBOARD focus as the gate opens is revealed, once — the reveal its own focusin could not make while the gate was closed', async () => {
    const finishLoading = documentLoading();
    const strip = buildStrip();
    window.history.replaceState(null, '', '#item-7');
    const follow = makeFollow();
    follow.start();
    follow.follow('item-7');
    // Wholly outside the strip's 0–300px: its 360–480px.
    focusAs(linkOf(strip, 3), 'keyboard');
    await framesFor(60);
    expect(strip.scrollLeft).toBe(0);

    await finishLoading();
    await framesFor(DEFAULT_FADE_MS + 120);
    // The focused chip whole, by the least movement — its end onto the
    // strip's end — while the keyboard's pause still holds the current item.
    expect(strip.scrollLeft).toBe(3 * ITEM_WIDTH + ITEM_WIDTH - STRIP_WIDTH);
  });

  // ── A RESTING POINTER IS WAITED FOR — BRIEFLY (the header). "Aimed" is a
  // pointer that MOVED onto the strip after start(); one parked there before
  // is not. NO REAL POINTER MOVES IN THIS FILE: the browser page's one mouse
  // is shared with every test file running beside it, and this suite's real
  // hovers once broke another file's real click (Hero.test.tsx's bead: the
  // mouse moved between its press and its release). The follower asks the
  // strip `:hover` and hears its `pointermove` — so the strip is told it is
  // hovered (a stub of that one selector) and is sent the move. The real
  // mouse is tests/e2e/price-strip.spec.ts's, where each test owns its page.

  /** The strip under a resting pointer — `:hover`, as the engine answers it. */
  function hovered(strip: HTMLElement): void {
    const own = Element.prototype.matches;
    vi.spyOn(strip, 'matches').mockImplementation(function (
      this: Element,
      selector: string,
    ) {
      return selector === ':hover' ? true : own.call(this, selector);
    });
  }

  /** A pointer that MOVES onto the strip after start() and rests on it. */
  function aimAt(strip: HTMLElement): void {
    hovered(strip);
    strip.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse' }),
    );
  }

  /** The strip of a deep link, its document loaded, a pointer resting on it
   *  that moved there after start() — the gate WAITING. */
  async function waitingForTheRestingPointer(): Promise<
    Readonly<{ strip: HTMLElement; follow: StripFollow }>
  > {
    const finishLoading = documentLoading();
    const strip = buildStrip();
    window.history.replaceState(null, '', '#item-7');
    const follow = makeFollow();
    follow.start();
    follow.follow('item-7');
    aimAt(strip);
    await finishLoading();
    await framesFor(60);
    expect(window.matchMedia('(hover: hover)').matches).toBe(true);
    expect(strip.scrollLeft, 'the premise: the gate waits').toBe(0);
    return { strip, follow };
  }

  it('a pointer PARKED on the strip before start() — never moved since — is no aim: the gate places at once (a parked mouse froze the strip for a keyboard visitor)', async () => {
    const finishLoading = documentLoading();
    const strip = buildStrip();
    window.history.replaceState(null, '', '#item-7');
    hovered(strip);
    const follow = makeFollow();
    follow.start();
    follow.follow('item-7');

    await finishLoading();

    expect(strip.matches(':hover')).toBe(true);
    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('a pointer that MOVED onto the strip and rests there is waited for — the chips never jump under it — and the gate opens as it leaves', async () => {
    const { strip } = await waitingForTheRestingPointer();

    strip.dispatchEvent(
      new PointerEvent('pointerleave', { pointerType: 'mouse' }),
    );

    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('…and the wait is BOUNDED: HOVER_WAIT_MAX_MS on, the pointer still resting, the strip is placed', async () => {
    const { strip } = await waitingForTheRestingPointer();

    vi.advanceTimersByTime(HOVER_WAIT_MAX_MS - 1);
    expect(strip.scrollLeft).toBe(0);
    vi.advanceTimersByTime(1);

    expect(strip.matches(':hover')).toBe(true);
    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('…and the bound runs from the LAST move over the strip: a pointer still aiming — a dwell clicker, a slow hand — keeps the wait until HOVER_WAIT_MAX_MS after it', async () => {
    const { strip } = await waitingForTheRestingPointer();

    vi.advanceTimersByTime(HOVER_WAIT_MAX_MS - 100);
    strip.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse' }),
    );
    vi.advanceTimersByTime(100);
    expect(strip.scrollLeft).toBe(0);
    vi.advanceTimersByTime(HOVER_WAIT_MAX_MS - 101);
    expect(strip.scrollLeft).toBe(0);
    vi.advanceTimersByTime(1);

    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('…a NEW current item during the wait opens it at once — the page has moved on under the pointer', async () => {
    const { strip, follow } = await waitingForTheRestingPointer();

    follow.follow('item-9');

    expect(strip.scrollLeft).toBe(MAX);
  });

  it('…a KEYBOARD focus in the strip during the wait opens it — and the focused chip is revealed whole', async () => {
    const { strip } = await waitingForTheRestingPointer();

    // Wholly outside the strip's 0–300px: its 360–480px.
    focusAs(linkOf(strip, 3), 'keyboard');
    await framesFor(DEFAULT_FADE_MS + 120);

    expect(strip.scrollLeft).toBe(3 * ITEM_WIDTH + ITEM_WIDTH - STRIP_WIDTH);
  });

  it('…the first KEYDOWN during the wait opens it — the visitor is on the keys', async () => {
    const { strip } = await waitingForTheRestingPointer();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('while it waits, the resting pointer moving ON the chips keeps the wait — and a FINGER, even on the strip, opens it (a tap leaves `:hover` stuck)', async () => {
    const { strip } = await waitingForTheRestingPointer();

    linkOf(strip, 2).dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse' }),
    );
    expect(strip.scrollLeft).toBe(0);

    linkOf(strip, 2).dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, pointerType: 'touch' }),
    );
    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('while it waits, a press anywhere OFF the strip opens it — the pointer is not resting on the chips', async () => {
    const { strip } = await waitingForTheRestingPointer();

    document.body.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
    );

    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('NEVER ON TOUCH: where no pointer can hover, a `:hover` on the strip is no resting pointer — the gate places at once, even after a move', async () => {
    const finishLoading = documentLoading();
    const strip = buildStrip();
    window.history.replaceState(null, '', '#item-7');
    pointerCannotHover();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-7');
    aimAt(strip);

    await finishLoading();

    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('THE CEILING waits for no resting pointer: a load that never comes, a pointer that moved onto the strip and rests there — the strip is placed at the ceiling, as after a load', async () => {
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('interactive');
    const strip = buildStrip();
    window.history.replaceState(null, '', '#item-7');
    const follow = makeFollow();
    follow.start();
    follow.follow('item-7');
    aimAt(strip);

    vi.advanceTimersByTime(GATE_CEILING_MS);
    await nextFrame();
    await nextFrame();

    expect(strip.matches(':hover')).toBe(true);
    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('dispose() while the gate waits takes THE CEILING, the load listener and the resting pointer’s watch — its listeners and its bound — with it', async () => {
    const strip = buildStrip();
    const addedOnStrip = vi.spyOn(strip, 'addEventListener');
    const removedOnStrip = vi.spyOn(strip, 'removeEventListener');
    const addedOnWindow = vi.spyOn(window, 'addEventListener');
    const removedOnWindow = vi.spyOn(window, 'removeEventListener');
    window.history.replaceState(null, '', '#item-7');
    // First life: still loading — the load listener and THE CEILING.
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('interactive');
    const loading = makeFollow();
    loading.start();
    expect(vi.getTimerCount()).toBe(1);
    loading.dispose();
    expect(vi.getTimerCount()).toBe(0);
    // Second life: a pointer that moved onto the strip while it loaded, then
    // the load — the watch (its listeners and its bound).
    const resting = makeFollow();
    resting.start();
    resting.follow('item-7');
    aimAt(strip);
    readyState.mockReturnValue('complete');
    window.dispatchEvent(new Event('load'));
    await nextFrame();
    await nextFrame();
    expect(vi.getTimerCount(), 'the wait’s bound').toBe(1);
    resting.dispose();
    expect(vi.getTimerCount()).toBe(0);

    const unpaired = (
      added: typeof addedOnStrip,
      removed: typeof removedOnStrip,
      types: readonly string[],
    ): string[] =>
      added.mock.calls
        .filter(([type]) => types.includes(String(type)))
        .filter(
          ([type, listener]) =>
            !removed.mock.calls.some(
              ([gone, fn]) => gone === type && fn === listener,
            ),
        )
        .map(([type]) => String(type));
    const watched = ['load', 'pointerdown', 'pointermove', 'keydown'];
    // A load listener per life, and the watch's three.
    expect(
      addedOnWindow.mock.calls.filter(([type]) =>
        watched.includes(String(type)),
      ).length,
    ).toBe(5);
    expect(unpaired(addedOnWindow, removedOnWindow, watched)).toEqual([]);
    expect(
      unpaired(addedOnStrip, removedOnStrip, ['pointerleave', 'pointermove']),
    ).toEqual([]);
    expect(
      addedOnStrip.mock.calls.some(([type]) => type === 'pointerleave'),
    ).toBe(true);
    // The wait is gone: a pointer leaving now places nothing.
    strip.dispatchEvent(
      new PointerEvent('pointerleave', { pointerType: 'mouse' }),
    );
    expect(strip.scrollLeft).toBe(0);
  });

  it('a URL WITHOUT a fragment at start() places before the paint, as ever — synchronously', () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();

    follow.follow('item-7');

    expect(strip.scrollLeft).toBe(centreOf(7));
  });
});

describe('createStripFollow — start and dispose', () => {
  it('start() without its element LATCHES NOTHING — follow() stays a no-op even once the strip appears, and a later start() finds it', () => {
    const follow = makeFollow();
    expect(() => follow.start()).not.toThrow();
    const strip = buildStrip();
    // The strip is on the page now, but the first start() found nothing to
    // start with: still not started, so nothing follows.
    follow.follow('item-6');
    expect(strip.scrollLeft).toBe(0);
    // A start() WITH the element works — proof the first one latched nothing
    // (a latched start would make this one a no-op, and follow() inert).
    follow.start();
    follow.follow('item-6');
    expect(strip.scrollLeft).toBe(centreOf(6));
  });

  it('start() is IDEMPOTENT while started: a second call registers nothing — one set of listeners, one observation', async () => {
    const strip = buildStrip();
    const onStrip = vi.spyOn(strip, 'addEventListener');
    const onWindow = vi.spyOn(window, 'addEventListener');
    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const follow = makeFollow();

    follow.start();
    const afterFirst = {
      strip: onStrip.mock.calls.length,
      window: onWindow.mock.calls.length,
      observe: observe.mock.calls.length,
    };
    follow.start();

    expect(afterFirst).toEqual({ strip: 8, window: 4, observe: 1 });
    expect(onStrip.mock.calls.length).toBe(afterFirst.strip);
    expect(onWindow.mock.calls.length).toBe(afterFirst.window);
    expect(observe.mock.calls.length).toBe(afterFirst.observe);
    // …and the one follower still follows, once: placed, then glided.
    follow.follow('item-1');
    follow.follow('item-6');
    await framesFor(DEFAULT_FADE_MS + 120);
    expect(strip.scrollLeft).toBe(centreOf(6));
  });

  it('dispose() stops a running glide where it is', async () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-0');
    follow.follow('item-9');
    await framesFor(120);
    follow.dispose();
    const stopped = strip.scrollLeft;
    await framesFor(DEFAULT_FADE_MS);
    expect(strip.scrollLeft).toBe(stopped);
    expect(stopped).toBeLessThan(MAX);
  });

  it('dispose() takes EVERY listener with it — strip and window alike, the very functions start() attached — and the observer', () => {
    const strip = buildStrip();
    const addedOnStrip = vi.spyOn(strip, 'addEventListener');
    const removedOnStrip = vi.spyOn(strip, 'removeEventListener');
    const addedOnWindow = vi.spyOn(window, 'addEventListener');
    const removedOnWindow = vi.spyOn(window, 'removeEventListener');
    const disconnect = vi.spyOn(ResizeObserver.prototype, 'disconnect');
    const follow = makeFollow();
    follow.start();
    follow.dispose();

    const pairs = (
      added: typeof addedOnStrip,
      removed: typeof removedOnStrip,
    ): Array<[string, boolean]> =>
      added.mock.calls.map(([type, listener]) => [
        String(type),
        removed.mock.calls.some(
          ([gone, fn]) => gone === type && fn === listener,
        ),
      ]);
    expect(pairs(addedOnStrip, removedOnStrip)).toEqual([
      ['pointerdown', true],
      ['pointermove', true],
      ['touchstart', true],
      ['touchmove', true],
      ['wheel', true],
      ['scroll', true],
      ['focusin', true],
      ['focusout', true],
    ]);
    expect(pairs(addedOnWindow, removedOnWindow)).toEqual([
      ['pointerup', true],
      ['pointercancel', true],
      ['touchend', true],
      ['touchcancel', true],
    ]);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('a press, a touch, a sideways wheel and a scroll AFTER dispose() reach nothing — the next life starts with no hand on the strip', () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.follow('item-2');
    follow.dispose();

    // Every input a surviving listener would hear — and would turn into a
    // hand held (pointerdown, touchstart) or a suspension (wheel, scroll).
    strip.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }),
    );
    strip.dispatchEvent(
      new TouchEvent('touchstart', { bubbles: true, touches: [] }),
    );
    strip.dispatchEvent(new WheelEvent('wheel', { deltaX: 80, bubbles: true }));
    strip.scrollLeft = 333;
    strip.dispatchEvent(new Event('scroll'));

    follow.start();
    follow.follow('item-7');
    // Placed AT ONCE: a hand left over from the old life would have paused it.
    expect(strip.scrollLeft).toBe(centreOf(7));
  });

  it('is re-entrant: dispose() twice, and start() works again afterwards', () => {
    const strip = buildStrip();
    const follow = makeFollow();
    follow.start();
    follow.dispose();
    expect(() => follow.dispose()).not.toThrow();
    follow.start();
    follow.follow('item-4');
    expect(strip.scrollLeft).toBe(centreOf(4));
  });
});
