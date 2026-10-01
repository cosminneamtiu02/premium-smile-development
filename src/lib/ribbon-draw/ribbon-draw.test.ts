import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';
import { buildCard, gaugeRule } from '../ribbon-model/ribbon-model.ts';
import { GOLDEN_CARDS } from '../ribbon-model/ribbon-model.golden.ts';
import { buildStrip, type StripSample } from '../ribbon-paint/ribbon-paint.ts';
import {
  DPR_CAP,
  DRAW_MS,
  handOver,
  HURRY,
  LINE,
  startRibbonDraw,
  tileScale,
  type RibbonDraw,
  type RibbonDrawEnv,
  type RibbonView,
} from './ribbon-draw.ts';

// lib/ribbon-draw — WHEN a card's stretch is drawn: the owner's centre-line
// rule and its two additions, the queue and its hurry, the pen, reduced
// motion, a new geometry, the guard, and the one wrapper that keeps a throw
// off the page. Real DOM in a real Chromium (the column is laid out by
// inline styles this file owns, the canvases are real), but the CLOCK, THE
// FRAMES and THE WINDOW'S NUMBERS come through the env seam: no real scroll
// and no real wait decides anything below. `frames.run(t)` runs every frame
// requested so far at the time t — each unless it was cancelled meanwhile —
// as a browser does.
//
// THE COLUMN, in numbers these tests predict: a root whose padding puts the
// first card 100px down, cards 600 × 400 px, 150px apart. With a window 800px
// tall a 400px card is DUE when its top reaches 0.75 × 800 − 400 / 2 = 400px
// under the window's top — its centre line on the ribbon's line, a quarter
// of the screen above the window's bottom (LINE).

const HEIGHT = 800;
const FIRST_TOP = 100;
const CARD_H = 400;
const GAP = 150;
const SECOND_TOP = FIRST_TOP + CARD_H + GAP;
const TOKENS = { '--ribbon': '#8377a3', '--ribbon-shadow': '#2d263c' };
/** The window's y at which a card of height h is due: its centre on the line — or, taller than the screen, its top LINE under the window's top. */
const lineOf = (h: number) =>
  Math.max((1 - LINE) * HEIGHT - h / 2, LINE * HEIGHT);

type Harness = {
  root: HTMLElement;
  layer: HTMLElement;
  env: RibbonDrawEnv;
  view: { rootTop: number; height: number; atEnd: boolean };
  /** Every reading of the window's numbers the drawing makes. */
  looked: Mock<(root: HTMLElement) => RibbonView>;
  frames: { run(time: number): void; readonly pending: number };
  setReduced(reduced: boolean): void;
  /** The one start — startRibbonDraw on this column. */
  start(): RibbonDraw;
};

const hosts: HTMLElement[] = [];
const draws: RibbonDraw[] = [];

function card(height: number, extra = ''): string {
  return `<div data-ribbon-station><article style="height: ${height}px; position: relative">${extra}</article></div>`;
}

function harness(
  options: {
    cards?: string[];
    reduced?: boolean;
    rootTop?: number;
    atEnd?: boolean;
    tokens?: boolean;
    view?: (root: HTMLElement) => RibbonView;
  } = {},
): Harness {
  const cards = options.cards ?? [card(CARD_H), card(CARD_H)];
  const host = document.createElement('div');
  host.style.cssText = 'position: absolute; left: 0; top: 0; width: 600px';
  host.innerHTML = `
    <div style="position: relative">
      <div style="display: flex; flex-direction: column; gap: ${GAP}px; padding: ${FIRST_TOP}px 0 100px">${cards.join('')}</div>
      <div data-layer style="position: absolute; inset: 0"></div>
    </div>`;
  document.body.append(host);
  hosts.push(host);
  const layer = host.querySelector<HTMLElement>('[data-layer]');
  const root = layer?.parentElement;
  if (layer == null || root == null) throw new Error('no column');
  if (options.tokens !== false) {
    for (const [name, value] of Object.entries(TOKENS)) {
      root.style.setProperty(name, value);
    }
  }

  const pending = new Map<number, (time: number) => void>();
  let handle = 0;
  const frames = {
    run(time: number) {
      for (const [id, callback] of [...pending]) {
        if (pending.delete(id)) callback(time);
      }
    },
    get pending() {
      return pending.size;
    },
  };
  let reduced = options.reduced ?? false;
  let listener: ((reduced: boolean) => void) | undefined;
  const view = {
    rootTop: options.rootTop ?? 400,
    height: HEIGHT,
    atEnd: options.atEnd ?? false,
  };
  const looked = vi.fn(options.view ?? ((): RibbonView => ({ ...view })));
  const env: RibbonDrawEnv = {
    view: looked,
    requestFrame: (callback) => {
      pending.set(++handle, callback);
      return handle;
    },
    cancelFrame: (id) => {
      pending.delete(id);
    },
    prefersReducedMotion: () => reduced,
    watchReducedMotion: (next) => {
      listener = next;
      return () => {
        listener = undefined;
      };
    },
  };
  return {
    root,
    layer,
    env,
    view,
    looked,
    frames,
    setReduced(next) {
      reduced = next;
      listener?.(next);
    },
    start() {
      const draw = startRibbonDraw(layer, env);
      draws.push(draw);
      return draw;
    },
  };
}

/** Let the browser deliver what it owes — a ResizeObserver's callbacks come
 *  with the next real frame. */
const settle = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

/** How many pixels of a canvas carry any paint. */
function paintedPixels(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d');
  if (ctx === null || canvas.width === 0) return 0;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let count = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
  return count;
}

const tiles = (h: Harness) => [...h.layer.querySelectorAll('canvas')];
const scrollTo = (h: Harness, rootTop: number) => {
  h.view.rootTop = rootTop;
  window.dispatchEvent(new Event('scroll'));
};
const resize = () => window.dispatchEvent(new Event('resize'));
const warnings = () => vi.mocked(console.warn).mock.calls.map(([text]) => text);

/** Every `scroll` and `resize` listener the window was given, as [type, function]. */
function listenersOf(spy: {
  mock: { calls: readonly (readonly unknown[])[] };
}) {
  return spy.mock.calls
    .filter(([type]) => type === 'scroll' || type === 'resize')
    .map(([type, listener]) => [type, listener]);
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  for (const draw of draws.splice(0)) draw.dispose();
  for (const host of hosts.splice(0)) host.remove();
  vi.restoreAllMocks();
});

describe('startRibbonDraw — one call starts it', () => {
  it('measures at start: one canvas per card, the column painted, nothing due yet', () => {
    const h = harness();
    const draw = h.start();
    expect(draw.getSnapshot()).toEqual({
      cards: 2,
      drawn: 0,
      drawing: -1,
      painted: true,
    });
    expect(tiles(h)).toHaveLength(2);
    expect(tiles(h).every((tile) => paintedPixels(tile) === 0)).toBe(true);
    expect(h.frames.pending).toBe(0);
  });

  it('gives every canvas the ribbon’s shadow, in the shadow token’s colour — not the ribbon’s', () => {
    const h = harness();
    h.start();
    for (const tile of tiles(h)) {
      // THE SHADOW IS PAINTED: no filter on the tile — the shadow is pixels
      // of the canvas, under the ribbon (lib/ribbon-paint).
      expect(tile.style.filter).toBe('');
    }
  });

  it('listens to the page’s scroll PASSIVELY — it never cancels one', () => {
    const added = vi.spyOn(window, 'addEventListener');
    harness().start();
    const scroll = added.mock.calls.filter(([type]) => type === 'scroll');
    expect(scroll).toHaveLength(1);
    expect(scroll[0][2]).toEqual({ passive: true });
  });
});

describe('the owner’s rule (fb-507; since 2026-10-01 the line is a quarter of the screen above its bottom): the card’s centre line reaches the line', () => {
  it('queues a card when its top reaches the line, and not a pixel before', () => {
    const h = harness();
    const draw = h.start();
    scrollTo(h, lineOf(CARD_H) - FIRST_TOP + 1);
    expect(draw.getSnapshot().drawing).toBe(-1);
    expect(h.frames.pending).toBe(0);

    scrollTo(h, lineOf(CARD_H) - FIRST_TOP);
    h.frames.run(1_000);
    expect(draw.getSnapshot().drawing).toBe(0);
  });

  it('draws a card over DRAW_MS, and it STAYS DRAWN on the way back up', () => {
    const h = harness();
    const draw = h.start();
    scrollTo(h, lineOf(CARD_H) - FIRST_TOP);
    h.frames.run(1_000);
    h.frames.run(1_000 + DRAW_MS / 2);
    const half = paintedPixels(tiles(h)[0]);
    expect(half).toBeGreaterThan(0);
    expect(draw.getSnapshot()).toMatchObject({ drawn: 0, drawing: 0 });

    h.frames.run(1_000 + DRAW_MS);
    expect(draw.getSnapshot()).toMatchObject({ drawn: 1, drawing: -1 });
    const whole = paintedPixels(tiles(h)[0]);
    expect(whole).toBeGreaterThan(half);

    // Back up the page: nothing is undone, nothing is scheduled.
    scrollTo(h, 2_000);
    h.frames.run(5_000);
    expect(draw.getSnapshot()).toMatchObject({ drawn: 1, drawing: -1 });
    expect(paintedPixels(tiles(h)[0])).toBe(whole);
  });

  it('draws a card taller than the screen when its top is LINE under the screen’s top (fb-509, re-derived for the lower line)', () => {
    const tall = 1_400;
    const h = harness({ cards: [card(tall), card(CARD_H)] });
    const draw = h.start();
    // Its centre line would reach the line only with its top 100px ABOVE
    // the window — where the ribbon's first stroke is. The floor is LINE
    // under the top instead — the SAME quarter, so the two halves of the rule
    // meet, without a jump, at a card exactly as tall as the screen.
    expect(lineOf(tall)).toBe(LINE * HEIGHT);
    expect((1 - LINE) * HEIGHT - HEIGHT / 2).toBe(LINE * HEIGHT);
    scrollTo(h, LINE * HEIGHT - FIRST_TOP + 1);
    expect(h.frames.pending).toBe(0);
    scrollTo(h, LINE * HEIGHT - FIRST_TOP);
    h.frames.run(1_000);
    expect(draw.getSnapshot().drawing).toBe(0);
  });

  it('makes EVERY waiting card due at the page’s end, in order — though their centres never reach the line', () => {
    const h = harness();
    const draw = h.start();
    // Both cards on screen, both still below their line — and the page can
    // scroll no further.
    h.view.atEnd = true;
    scrollTo(h, 0);
    h.frames.run(1_000);
    expect(draw.getSnapshot().drawing).toBe(0);
    h.frames.run(1_000 + DRAW_MS);
    h.frames.run(4_000);
    expect(draw.getSnapshot().drawing).toBe(1);
  });

  it('draws every card on a page that cannot scroll — due at load, no guard asked', () => {
    const h = harness({ atEnd: true });
    const draw = h.start();
    expect(h.frames.pending).toBe(1);
    h.frames.run(1_000);
    expect(draw.getSnapshot()).toMatchObject({ drawn: 0, drawing: 0 });
  });

  it('draws in order — the ribbon is one ribbon — and HURRIES while others wait: DRAW_MS / (1 + HURRY × waiting)', () => {
    const h = harness();
    const draw = h.start();
    scrollTo(h, lineOf(CARD_H) - SECOND_TOP); // both cards due at once
    h.frames.run(1_000);
    expect(draw.getSnapshot().drawing).toBe(0);
    const hurried = DRAW_MS / (1 + HURRY * 1);
    h.frames.run(1_000 + hurried - 1);
    expect(draw.getSnapshot()).toMatchObject({ drawn: 0, drawing: 0 });
    h.frames.run(1_000 + hurried);
    expect(draw.getSnapshot()).toMatchObject({ drawn: 1, drawing: -1 });
    h.frames.run(3_000);
    expect(draw.getSnapshot()).toMatchObject({ drawn: 1, drawing: 1 });
    // The last card waits for nobody: a whole DRAW_MS.
    h.frames.run(3_000 + DRAW_MS - 1);
    expect(draw.getSnapshot().drawing).toBe(1);
    h.frames.run(3_000 + DRAW_MS);
    expect(draw.getSnapshot()).toMatchObject({ drawn: 2, drawing: -1 });
    expect(h.frames.pending).toBe(0);
  });

  it('keeps six cards due together — the clinic’s roster — under five seconds of movement (SC 2.2.2, the header’s count)', () => {
    const h = harness({
      cards: Array.from({ length: 6 }, () => card(CARD_H)),
      atEnd: true,
    });
    const draw = h.start();
    let time = 0;
    for (; draw.getSnapshot().drawn < 6; time += 16) {
      h.frames.run(time);
      expect(time).toBeLessThan(10_000);
    }
    // 1.3 s × (1 + 1/1.6 + 1/2.2 + 1/2.8 + 1/3.4 + 1/4) = 3 875 ms, and a
    // frame per card. (At the prototype's 2 s pace six took 5 962 ms — past
    // the criterion's five seconds; four took 4 873.)
    expect(time - 16).toBeGreaterThanOrEqual(3_875);
    expect(time - 16).toBeLessThan(5_000);
  });

  it('draws a card’s head — its drop-in and hook — on the canvas before its own, and the rest on its own', () => {
    const h = harness();
    const draw = h.start();
    scrollTo(h, lineOf(CARD_H) - SECOND_TOP); // both due
    h.frames.run(1_000);
    h.frames.run(1_000 + DRAW_MS); // the first card, hurried: done
    expect(draw.getSnapshot()).toMatchObject({ drawn: 1, drawing: -1 });
    const [first, second] = tiles(h);
    const before = paintedPixels(first);
    expect(paintedPixels(second)).toBe(0);

    h.frames.run(4_000); // the second card begins…
    h.frames.run(4_000 + DRAW_MS * 0.1); // …with its head, on the FIRST canvas
    expect(paintedPixels(first)).toBeGreaterThan(before);
    expect(paintedPixels(second)).toBe(0);
    h.frames.run(4_000 + DRAW_MS); // and the rest, on its own
    expect(paintedPixels(second)).toBeGreaterThan(0);
  });

  it('draws the FIRST card with no head: its canvas reaches no higher than the ribbon over its top edge, and its first stroke is on its own canvas', () => {
    const h = harness();
    const draw = h.start();
    const [first, second] = tiles(h);
    // A 600px column: k = gaugeRule(6). The drop-in started a whole k above
    // the first card's top; the ribbon over the top edge reaches R_FOLD k
    // (0.08 k) above it, plus the shadow's blur (4 k px) and the tile's 2px
    // margin — under 0.3 k in all.
    const k = gaugeRule(6);
    const above = FIRST_TOP - parseFloat(first.style.top);
    expect(above).toBeGreaterThan(0);
    expect(above).toBeLessThan(0.3 * k * 100);

    scrollTo(h, lineOf(CARD_H) - FIRST_TOP);
    h.frames.run(1_000);
    h.frames.run(1_000 + DRAW_MS * 0.15);
    // A sixth of the way in the pen is past the hidden S behind the card
    // (about 2 % of the stretch) and its first stroke — over the top edge,
    // into the ripple — is on the first canvas, and on no other.
    expect(paintedPixels(first)).toBeGreaterThan(0);
    expect(paintedPixels(second)).toBe(0);
    h.frames.run(1_000 + DRAW_MS);
    expect(draw.getSnapshot()).toMatchObject({ drawn: 1, drawing: -1 });
  });

  it('shows a card that is already above the screen at start at once — there is nothing to watch', () => {
    const h = harness({ rootTop: -(SECOND_TOP - 10) });
    const draw = h.start();
    expect(draw.getSnapshot().drawn).toBe(1);
    expect(paintedPixels(tiles(h)[0])).toBeGreaterThan(0);
    // The second card follows the rule: its top is on screen, above its line.
    expect(h.frames.pending).toBe(1);
    h.frames.run(1_000);
    expect(draw.getSnapshot().drawing).toBe(1);
  });

  it('keeps that at-start rule for the first build that paints, when the column was refused at mount', () => {
    const h = harness({ rootTop: -(SECOND_TOP - 10), tokens: false });
    const draw = h.start();
    expect(draw.getSnapshot()).toMatchObject({ painted: false, drawn: 0 });

    for (const [name, value] of Object.entries(TOKENS)) {
      h.root.style.setProperty(name, value);
    }
    resize();
    h.frames.run(500);
    expect(draw.getSnapshot()).toMatchObject({ painted: true, drawn: 1 });
    expect(paintedPixels(tiles(h)[0])).toBeGreaterThan(0);
    h.frames.run(1_000);
    expect(draw.getSnapshot().drawing).toBe(1);
  });
});

describe('reduced motion (lib/reduced-motion)', () => {
  it('paints the whole ribbon at once when it is asked for at start', () => {
    const h = harness({ reduced: true });
    const draw = h.start();
    expect(draw.getSnapshot()).toMatchObject({ drawn: 2, drawing: -1 });
    expect(tiles(h).every((tile) => paintedPixels(tile) > 0)).toBe(true);
    expect(h.frames.pending).toBe(0);
  });

  it('finishes whatever is unfinished when it is switched on mid-visit', () => {
    const h = harness();
    const draw = h.start();
    scrollTo(h, lineOf(CARD_H) - FIRST_TOP);
    h.frames.run(1_000);
    h.frames.run(1_500);
    expect(draw.getSnapshot()).toMatchObject({ drawn: 0, drawing: 0 });

    h.setReduced(true);
    expect(draw.getSnapshot()).toMatchObject({ drawn: 2, drawing: -1 });
    expect(h.frames.pending).toBe(0);
  });

  it('undoes nothing and starts nothing when it is switched off again', () => {
    const h = harness({ reduced: true });
    const draw = h.start();
    h.setReduced(false);
    expect(draw.getSnapshot()).toMatchObject({ drawn: 2, drawing: -1 });
    expect(h.frames.pending).toBe(0);
  });

  it('finishes — in order, never animated — a column that was refused when the switch came, once it paints', () => {
    const h = harness({ cards: [card(CARD_H), card(CARD_H), card(CARD_H)] });
    const draw = h.start();
    scrollTo(h, lineOf(CARD_H) - SECOND_TOP); // cards 0 and 1 due, 2 waiting
    h.frames.run(1_000);
    h.frames.run(1_400);
    expect(draw.getSnapshot()).toMatchObject({ drawn: 0, drawing: 0 });

    h.root.style.removeProperty('--ribbon-shadow');
    resize();
    h.frames.run(1_500);
    expect(draw.getSnapshot().painted).toBe(false);
    h.setReduced(true);
    expect(draw.getSnapshot()).toMatchObject({ drawn: 0, drawing: 0 });

    const fills = vi.spyOn(CanvasRenderingContext2D.prototype, 'fill');
    h.root.style.setProperty('--ribbon-shadow', TOKENS['--ribbon-shadow']);
    resize();
    h.frames.run(1_600);
    expect(draw.getSnapshot()).toEqual({
      cards: 3,
      drawn: 3,
      drawing: -1,
      painted: true,
    });
    expect(h.frames.pending).toBe(0);
    // In the column's order: canvas i holds card i's body and card i+1's
    // head, so the canvases painted on never step back.
    const order = fills.mock.contexts.map((context) =>
      context instanceof CanvasRenderingContext2D
        ? tiles(h).indexOf(context.canvas)
        : -1,
    );
    expect(order.length).toBeGreaterThan(0);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});

describe('a new geometry — the prototype’s second bug', () => {
  it('re-points the stretch being drawn at the new card: a resize mid-draw still finishes it', async () => {
    const h = harness();
    const draw = h.start();
    await settle(); // the observer's first report, delivered
    h.frames.run(500);
    scrollTo(h, lineOf(CARD_H) - FIRST_TOP);
    h.frames.run(1_000);
    h.frames.run(1_000 + DRAW_MS / 2);
    expect(draw.getSnapshot()).toMatchObject({ drawn: 0, drawing: 0 });

    // The card grows mid-draw — a font arriving, a picture loading.
    const first = h.root.querySelector('article');
    if (first === null) throw new Error('no card');
    first.style.height = '500px';
    await settle();
    h.frames.run(1_000 + DRAW_MS * 0.6);
    h.frames.run(1_000 + DRAW_MS);
    expect(draw.getSnapshot()).toMatchObject({ drawn: 1, drawing: -1 });

    // The whole NEW stretch is on its canvas: the same paint the same column
    // shows when that card is already above the screen at start — drawn at
    // once, the next card not begun — give or take the one split piece.
    const drawnLive = paintedPixels(tiles(h)[0]);
    const fresh = harness({
      cards: [card(500), card(CARD_H)],
      rootTop: -(FIRST_TOP + 500 + 10),
    });
    expect(fresh.start().getSnapshot()).toMatchObject({
      drawn: 1,
      drawing: -1,
    });
    const drawnAtOnce = paintedPixels(tiles(fresh)[0]);
    expect(Math.abs(drawnLive - drawnAtOnce) / drawnAtOnce).toBeLessThan(0.01);
  });

  it('builds ONCE for one geometry — the observer’s first report touches no canvas — reading the window before the first canvas write', async () => {
    const widths = vi.spyOn(HTMLCanvasElement.prototype, 'width', 'set');
    const h = harness();
    h.start();
    expect(h.looked.mock.invocationCallOrder[0]).toBeLessThan(
      widths.mock.invocationCallOrder[0],
    );
    await settle();
    h.frames.run(500);
    expect(widths).toHaveBeenCalledTimes(2);
  });

  it('touches no canvas on a resize that moves nothing — and a taller window still queues a card', async () => {
    const widths = vi.spyOn(HTMLCanvasElement.prototype, 'width', 'set');
    const h = harness();
    const draw = h.start();
    await settle();
    h.frames.run(500);
    resize();
    h.frames.run(600);
    expect(widths).toHaveBeenCalledTimes(2);
    expect(h.frames.pending).toBe(0);

    // An address bar folding away: only the window's height moves — and
    // with it the line, which the first card's top (at 500) now reaches.
    h.view.height = 1_400;
    resize();
    h.frames.run(700);
    expect(widths).toHaveBeenCalledTimes(2);
    expect(h.frames.pending).toBe(1);
    h.frames.run(800);
    expect(draw.getSnapshot().drawing).toBe(0);
  });

  it('rebuilds for a real change of geometry', async () => {
    const widths = vi.spyOn(HTMLCanvasElement.prototype, 'width', 'set');
    const h = harness();
    h.start();
    await settle();
    h.frames.run(500);
    const [first] = h.root.querySelectorAll('article');
    first.style.height = '450px';
    await settle();
    h.frames.run(600);
    expect(widths).toHaveBeenCalledTimes(4);
  });

  it('observes each station and keep-out ONCE, and lets go of those that leave', async () => {
    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const unobserve = vi.spyOn(ResizeObserver.prototype, 'unobserve');
    const h = harness({
      cards: [
        card(CARD_H),
        card(
          CARD_H,
          '<div data-ribbon-keepout style="position: absolute; left: 250px; top: 150px; width: 100px; height: 100px"></div>',
        ),
      ],
    });
    h.start();
    await settle();
    h.frames.run(500); // the observer's first reports
    resize();
    h.frames.run(600); // and a window's
    const watched = [
      h.root,
      ...h.root.querySelectorAll(
        '[data-ribbon-station], [data-ribbon-keepout]',
      ),
    ];
    expect(watched).toHaveLength(4);
    for (const element of watched) {
      expect(
        observe.mock.calls.filter(([target]) => target === element),
      ).toHaveLength(1);
    }
    expect(unobserve).not.toHaveBeenCalled();

    const [, second] = h.root.querySelectorAll('[data-ribbon-station]');
    const keepout = second.querySelector('[data-ribbon-keepout]');
    second.remove();
    await settle();
    h.frames.run(700);
    expect(unobserve.mock.calls.map(([target]) => target)).toEqual([
      second,
      keepout,
    ]);
  });

  it('stops cleanly when the column loses its cards mid-draw', async () => {
    const h = harness();
    const draw = h.start();
    await settle();
    h.frames.run(500);
    scrollTo(h, lineOf(CARD_H) - SECOND_TOP); // both due: one drawing, one waiting
    h.frames.run(1_000);
    expect(draw.getSnapshot()).toMatchObject({ drawing: 0 });

    for (const station of h.root.querySelectorAll('[data-ribbon-station]')) {
      station.remove();
    }
    await settle();
    h.frames.run(1_100);
    h.frames.run(1_200);
    expect(draw.getSnapshot()).toEqual({
      cards: 0,
      drawn: 0,
      drawing: -1,
      painted: true,
    });
    expect(tiles(h)).toHaveLength(0);
    expect(h.frames.pending).toBe(0);
  });

  it('coalesces a burst of changes into ONE rebuild, one frame later', async () => {
    const h = harness();
    h.start();
    await settle();
    h.frames.run(500);
    resize();
    resize();
    resize();
    expect(h.frames.pending).toBe(1);
  });
});

describe('the guard: no lanes, no ribbon', () => {
  const covered = card(
    CARD_H,
    '<div data-ribbon-keepout style="position: absolute; inset: 0"></div>',
  );

  it('paints nothing for the WHOLE column when one card’s ribbon would cover its words — and warns once', async () => {
    const h = harness({ cards: [card(CARD_H), covered], reduced: true });
    const draw = h.start();
    expect(draw.getSnapshot()).toMatchObject({ cards: 2, painted: false });
    expect(tiles(h).every((tile) => paintedPixels(tile) === 0)).toBe(true);
    expect(warnings()).toHaveLength(1);
    expect(warnings()[0]).toMatch(/card 1 .* by \d+\.\d+ card units/);
    expect(warnings()[0]).toMatch(/worse than no ribbon/);

    // Measured again — still refused, still only the one warning.
    await settle();
    h.frames.run(500);
    resize();
    h.frames.run(600);
    expect(draw.getSnapshot().painted).toBe(false);
    expect(warnings()).toHaveLength(1);
  });

  it('refuses a keep-out whose content overflows into the lanes — the guard sees what is painted', () => {
    const overflowing = card(
      CARD_H,
      '<div data-ribbon-keepout style="position: absolute; left: 250px; top: 150px; width: 100px; height: 100px"><div style="margin-left: -250px; width: 600px; height: 100px"></div></div>',
    );
    const h = harness({ cards: [card(CARD_H), overflowing], reduced: true });
    expect(h.start().getSnapshot().painted).toBe(false);
    expect(warnings()[0]).toMatch(/card 1 would enter its keep-outs/);
  });

  it('paints nothing when the two colour tokens are missing — and says so, not more', () => {
    const h = harness({ tokens: false, reduced: true });
    expect(h.start().getSnapshot()).toMatchObject({ painted: false });
    expect(tiles(h).every((tile) => paintedPixels(tile) === 0)).toBe(true);
    expect(warnings()[0]).toMatch(/--ribbon-shadow/);
    expect(warnings()[0]).not.toMatch(/words/);
  });

  it('paints nothing for a card too small for its gauge — the model refuses it', () => {
    const h = harness({ cards: [card(20), card(CARD_H)], reduced: true });
    expect(h.start().getSnapshot()).toMatchObject({ painted: false });
    expect(vi.mocked(console.warn).mock.calls[0][0]).toMatch(
      /card 0: RangeError: buildCard: a card/,
    );
  });

  it('paints nothing for a station that holds no card, and says which', () => {
    const h = harness({
      cards: [card(CARD_H), '<div data-ribbon-station></div>'],
      reduced: true,
    });
    expect(h.start().getSnapshot()).toMatchObject({ painted: false });
    expect(warnings()[0]).toMatch(/station 1 holds no card/);
  });

  it('tells a canvas the browser refuses from a missing token', () => {
    const real = HTMLCanvasElement.prototype.getContext;
    const context = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    // No context anywhere: the colours cannot even be read.
    context.mockReturnValue(null);
    expect(harness({ reduced: true }).start().getSnapshot().painted).toBe(
      false,
    );
    expect(warnings()[0]).toMatch(/no 2D canvas context to read the colour/);

    // A context for the colours, none for a canvas on the page.
    context.mockImplementation(function (
      this: HTMLCanvasElement,
      ...args: Parameters<HTMLCanvasElement['getContext']>
    ) {
      return this.isConnected ? null : real.apply(this, args);
    });
    expect(harness({ reduced: true }).start().getSnapshot().painted).toBe(
      false,
    );
    expect(warnings()[1]).toMatch(/gave canvas 0 no 2D context/);
  });

  it('warns again once a build has passed — a column hidden at mount does not spend the one warning', () => {
    const h = harness({ tokens: false, reduced: true });
    h.start();
    expect(warnings()).toHaveLength(1);
    for (const [name, value] of Object.entries(TOKENS)) {
      h.root.style.setProperty(name, value);
    }
    resize();
    h.frames.run(500);
    h.root.style.removeProperty('--ribbon');
    resize();
    h.frames.run(600);
    expect(warnings()).toHaveLength(2);
  });
});

describe('a decoration never takes the page down', () => {
  it('reports a throw at start and throws nothing: no listener, no observer, no canvas is left', () => {
    const added = vi.spyOn(window, 'addEventListener');
    const removed = vi.spyOn(window, 'removeEventListener');
    const disconnect = vi.spyOn(ResizeObserver.prototype, 'disconnect');
    const reported = vi
      .spyOn(window, 'reportError')
      .mockImplementation(() => {});
    const failure = new Error('the window cannot be read');
    const h = harness({
      view: () => {
        throw failure;
      },
    });
    let draw: RibbonDraw | undefined;
    expect(() => {
      draw = h.start();
    }).not.toThrow();
    expect(listenersOf(added)).toHaveLength(2);
    expect(listenersOf(removed)).toEqual(listenersOf(added));
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(tiles(h)).toHaveLength(0);
    expect(reported).toHaveBeenCalledTimes(1);
    expect(reported).toHaveBeenCalledWith(failure);
    // The reduced-motion watch is gone too: switching it reaches nothing.
    h.setReduced(true);
    expect(draw?.getSnapshot().drawn).toBe(0);
  });

  it('reports a throw inside a frame the same way — and no frame is scheduled after it', () => {
    const removed = vi.spyOn(window, 'removeEventListener');
    const reported = vi
      .spyOn(window, 'reportError')
      .mockImplementation(() => {});
    const h = harness();
    h.start();
    scrollTo(h, lineOf(CARD_H) - FIRST_TOP);
    h.frames.run(1_000);
    vi.spyOn(CanvasRenderingContext2D.prototype, 'fill').mockImplementation(
      () => {
        throw new Error('the canvas is lost');
      },
    );
    expect(() => h.frames.run(1_500)).not.toThrow();
    expect(reported).toHaveBeenCalledTimes(1);
    expect(tiles(h)).toHaveLength(0);
    expect(h.frames.pending).toBe(0);
    expect(listenersOf(removed)).toHaveLength(2);
    scrollTo(h, 0);
    resize();
    expect(h.frames.pending).toBe(0);
  });

  it('reads only a RangeError as a refusal — any other error is a bug, and is reported', () => {
    const reported = vi
      .spyOn(window, 'reportError')
      .mockImplementation(() => {});
    const measure = vi.spyOn(Element.prototype, 'getBoundingClientRect');

    measure.mockImplementationOnce(() => {
      throw new RangeError('measured nothing');
    });
    expect(harness().start().getSnapshot().painted).toBe(false);
    expect(warnings()[0]).toMatch(/RangeError: measured nothing/);
    expect(reported).not.toHaveBeenCalled();

    const bug = new TypeError('a bug');
    measure.mockImplementationOnce(() => {
      throw bug;
    });
    const h = harness();
    h.start();
    expect(reported).toHaveBeenCalledWith(bug);
    expect(warnings()).toHaveLength(1);
    expect(tiles(h)).toHaveLength(0);
  });

  it('reports a layer that is not inside a root — and throws nothing', () => {
    const reported = vi
      .spyOn(window, 'reportError')
      .mockImplementation(() => {});
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const layer = document.createElement('div');
    expect(() => startRibbonDraw(layer).dispose()).not.toThrow();
    expect(reported).toHaveBeenCalledTimes(1);
    expect(String(reported.mock.calls[0][0])).toMatch(/inside the ribbon/);
    expect(logged).not.toHaveBeenCalled();
  });

  it('reports through console.error in a browser without reportError — and still throws nothing', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    // The global lives on the window itself (a [Global] interface's
    // operation); removed here as Safari before 15.4 never had it.
    const own = Object.getOwnPropertyDescriptor(window, 'reportError');
    if (own === undefined) throw new Error('no reportError on the window');
    Reflect.deleteProperty(window, 'reportError');
    try {
      expect('reportError' in window).toBe(false);
      const layer = document.createElement('div');
      expect(() => startRibbonDraw(layer).dispose()).not.toThrow();
      expect(logged).toHaveBeenCalledTimes(1);
      expect(String(logged.mock.calls[0][0])).toMatch(/inside the ribbon/);
    } finally {
      Object.defineProperty(window, 'reportError', own);
    }
    expect(typeof window.reportError).toBe('function');
  });
});

describe('dispose()', () => {
  it('removes its canvases and listeners and cancels its frames — and a second call does nothing', () => {
    const h = harness();
    const draw = h.start();
    scrollTo(h, lineOf(CARD_H) - FIRST_TOP);
    expect(h.frames.pending).toBe(1);

    draw.dispose();
    expect(tiles(h)).toHaveLength(0);
    expect(h.frames.pending).toBe(0);
    // The listeners are gone: nothing wakes up.
    scrollTo(h, 0);
    resize();
    expect(h.frames.pending).toBe(0);
    expect(() => draw.dispose()).not.toThrow();
    expect(tiles(h)).toHaveLength(0);
  });
});

describe('an idle page does nothing on scroll', () => {
  it('reads the window only while a card still waits — once every card is drawn, a scroll reads nothing', () => {
    const h = harness();
    const draw = h.start();
    scrollTo(h, lineOf(CARD_H) - SECOND_TOP); // both due
    h.frames.run(1_000); // the first card begins
    h.frames.run(3_000); // …and is done
    h.frames.run(4_000); // the second begins
    h.frames.run(4_000 + DRAW_MS); // …and is done
    expect(draw.getSnapshot()).toMatchObject({ drawn: 2, drawing: -1 });

    h.looked.mockClear();
    scrollTo(h, 0);
    scrollTo(h, 2_000);
    expect(h.looked).not.toHaveBeenCalled();
  });

  it('reads nothing at all under reduced motion — the whole ribbon is already there', () => {
    const h = harness({ reduced: true });
    h.start();
    scrollTo(h, 0);
    expect(h.looked).not.toHaveBeenCalled();
  });
});

describe('handOver — where a card passes from one canvas to the next', () => {
  it('is the sample nearest the point asked for, along the ribbon', () => {
    const sample = (u: number): StripSample => ({
      u,
      l: [0, 0, 0],
      r: [0.1, 0, 0],
      colour: [0, 0, 0],
      effort: 100 * u,
    });
    const strip = [sample(0), sample(0.25), sample(0.5), sample(0.75)];
    expect(handOver(strip, 0.3)).toBe(1);
    expect(handOver(strip, 0.45)).toBe(2);
  });

  it.each(GOLDEN_CARDS.map((golden) => [golden.why, golden] as const))(
    'lies more than 0.56 k behind the card’s face — %s',
    (_, golden) => {
      const model = buildCard(golden.input);
      // Mirroring moves x alone, so one strip answers for both sides.
      const strip = buildStrip(model, false, [0.6, 0.6, 0.6]);
      const { u0, u1 } = model.atoms.wrapEntry;
      const { l, r } = strip[handOver(strip, (u0 + u1) / 2)];
      const behind = Math.min(l[1], r[1]) + model.T / 2;
      expect(behind).toBeGreaterThan(0.56 * golden.input.k);
    },
  );
});

describe('tileScale — the canvas’s pixels per CSS px', () => {
  it('follows the screen, never above DPR_CAP', () => {
    expect(tileScale(300, 400, 1)).toBe(1);
    expect(tileScale(300, 400, 3)).toBe(DPR_CAP);
  });

  it('comes down for a tile that would pass 16 million pixels or 16 384 on a side', () => {
    expect(tileScale(3_000, 3_000, 2)).toBeCloseTo(Math.sqrt(16e6 / 9e6), 12);
    expect(tileScale(300, 20_000, 2)).toBeCloseTo(16_384 / 20_000, 12);
  });
});
