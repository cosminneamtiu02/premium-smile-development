import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createStickyRail,
  type StickyRail,
  type StickyRailSnapshot,
} from './sticky-rail.ts';

// Runs in the `components` project (real chromium, vitest.config.ts) because
// every rule in this module is about LAYOUT — a real sticky element, a real
// scroll position, real getBoundingClientRect answers. There is no React
// anywhere near it and no Testing Library either: the fixture below is a
// grid built by hand, the lib/scroll-spy precedent, plus a FAKE CONSUMER that
// does what the island does with each snapshot (an attribute, an inline
// `top`, and `position: relative` for 'travel'), so the geometry the
// assertions read is the geometry a visitor would see.
//
// ── NO FAKE TIMERS. This module has none; its one scheduling device is
// requestAnimationFrame, which the scroll events it reacts to ride anyway.
// Waiting for a real frame (two, to be safe — one for the event, one for
// anything it scheduled) is the honest wait, exactly as in scroll-spy.test.
//
// ── THE FIXTURE IS THE PRICE BAND, IN NUMBERS THIS FILE OWNS: a spacer above
// the band (so the rail starts below the fold), a grid with padding-top (so
// the "containing block's content edge" reading is exercised, not assumed),
// the rail as the grid's first, start-aligned item, a tall column beside it,
// and a footer below (so the containing block ends before the document
// does). The static sticky rules live in a <style> element, never inline —
// the consumer overrides inline and clears its overrides by writing '', which
// would erase an inline base rule.

/** The rail's static offset (the price menu's 8.5rem line, in test pixels). */
const LINE = 100;
/** The air under the bottom pin, passed explicitly for arithmetic the test
 *  can predict; the default (one root em) has its own test. */
const GAP = 16;
/** Everything above the band. */
const SPACER = 300;
/** The grid's own padding-top — the content edge the rail's flow position
 *  is read from. */
const PADDING = 24;
/** The cards column: tall enough that the rail meets both pins twice. */
const COLUMN = 4_000;
const FOOTER = 600;
const RAIL_ID = 'rail';

/** Every rail a test starts, disposed in afterEach. */
const live: StickyRail[] = [];
let host: HTMLElement | undefined;
let sheet: HTMLStyleElement | undefined;

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));

async function settle(): Promise<void> {
  await nextFrame();
  await nextFrame();
}

/** Scroll, then let the browser deliver its scroll event and the rail its
 *  frame. */
async function scrollToY(y: number): Promise<void> {
  window.scrollTo(0, y);
  await settle();
}

/** The scroll position at which the rail's static sticky engages. */
const engageY = (): number => SPACER + PADDING - LINE;

/**
 * Build the page. `height` is the rail's; `links` puts focusable children in
 * it (the reveal tests); `position` overrides the static rule (the stand-down
 * test).
 */
function buildPage(
  options: Readonly<{
    height: number;
    links?: number;
    position?: 'sticky' | 'static';
  }>,
): HTMLElement {
  sheet = document.createElement('style');
  sheet.textContent = `#${RAIL_ID} { position: ${options.position ?? 'sticky'}; top: ${LINE}px; margin: 0; box-sizing: border-box; }`;
  document.head.append(sheet);

  host = document.createElement('div');
  const spacer = document.createElement('div');
  spacer.style.height = `${SPACER}px`;
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = '1fr 3fr';
  grid.style.alignItems = 'start';
  grid.style.paddingTop = `${PADDING}px`;
  const rail = document.createElement('nav');
  rail.id = RAIL_ID;
  rail.style.height = `${options.height}px`;
  rail.tabIndex = -1;
  for (let index = 0; index < (options.links ?? 0); index += 1) {
    const link = document.createElement('a');
    link.href = `#target-${index}`;
    link.textContent = `link ${index}`;
    link.style.display = 'block';
    link.style.position = 'absolute';
    // Spread the links down the rail's whole height — the first at its top
    // edge, the last ending at its bottom edge — so that some sit below the
    // fold and some above the line, whatever the viewport.
    link.style.height = '20px';
    link.style.top = `${Math.round(((options.height - 20) / Math.max(1, (options.links ?? 1) - 1)) * index)}px`;
    rail.append(link);
  }
  rail.style.position = '';
  const column = document.createElement('div');
  column.style.height = `${COLUMN}px`;
  const footer = document.createElement('div');
  footer.style.height = `${FOOTER}px`;
  grid.append(rail, column);
  host.append(spacer, grid, footer);
  document.body.append(host);
  return rail;
}

/**
 * THE FAKE CONSUMER — what sections/PriceList/PriceMenu renders from a
 * snapshot, written by hand: `data-rail` for every mode but 'fits', inline
 * `top` for 'bottom' and 'travel', and `position: relative` for 'travel' (the
 * island does that through a container-gated class; no stylesheet exists
 * here, so it is inline). Returns the snapshots it saw, in order.
 */
function attach(rail: StickyRail, element: HTMLElement): StickyRailSnapshot[] {
  const seen: StickyRailSnapshot[] = [];
  const apply = (): void => {
    const snapshot = rail.getSnapshot();
    seen.push(snapshot);
    if (snapshot.mode === 'fits') delete element.dataset.rail;
    else element.dataset.rail = snapshot.mode;
    element.style.top =
      snapshot.mode === 'bottom' || snapshot.mode === 'travel'
        ? `${snapshot.topPx}px`
        : '';
    element.style.position = snapshot.mode === 'travel' ? 'relative' : '';
  };
  rail.subscribe(apply);
  return seen;
}

function makeRail(
  options: Parameters<typeof createStickyRail>[0] = { id: RAIL_ID, gapPx: GAP },
): StickyRail {
  const rail = createStickyRail(options);
  live.push(rail);
  return rail;
}

/** A rail taller than the window by a margin: always tall, whatever the
 *  runner's viewport. */
const tallHeight = (): number => window.innerHeight;
/** A rail that fits under LINE with GAP to spare. */
const shortHeight = (): number => window.innerHeight - LINE - GAP - 50;

const flowTop = (element: HTMLElement): number =>
  (element.parentElement as HTMLElement).getBoundingClientRect().top + PADDING;

afterEach(() => {
  for (const rail of live) rail.dispose();
  live.length = 0;
  host?.remove();
  host = undefined;
  sheet?.remove();
  sheet = undefined;
  window.scrollTo(0, 0);
  vi.restoreAllMocks();
});

describe('createStickyRail — construction is pure (§16)', () => {
  it('touches no window, no document, no observer', () => {
    // The island builds its rail in a useState initializer, which runs on the
    // SERVER during the static export as well as in the browser. A single
    // browser read here would be a hydration hazard and an SSR crash.
    buildPage({ height: tallHeight() });
    const listen = vi.spyOn(window, 'addEventListener');
    const lookup = vi.spyOn(document, 'getElementById');
    const observe = vi.spyOn(window, 'ResizeObserver');

    makeRail();

    expect(listen).not.toHaveBeenCalled();
    expect(lookup).not.toHaveBeenCalled();
    expect(observe).not.toHaveBeenCalled();
  });

  it("reports 'fits' — and that IS the server snapshot, forever", async () => {
    const element = buildPage({ height: tallHeight() });
    const rail = makeRail();
    attach(rail, element);

    expect(rail.getSnapshot()).toEqual({ mode: 'fits', topPx: 0 });
    expect(rail.getServerSnapshot()).toEqual({ mode: 'fits', topPx: 0 });
    const server = rail.getServerSnapshot();

    rail.start();
    await scrollToY(engageY() + 400);

    // The browser has long since moved on; the static export's answer has
    // not (lib/external-store's frozen-server-snapshot rule).
    expect(rail.getSnapshot().mode).not.toBe('fits');
    expect(rail.getServerSnapshot()).toBe(server);
  });

  it('keeps ONE snapshot object while nothing has changed', async () => {
    buildPage({ height: shortHeight() });
    const rail = makeRail();
    rail.start();
    const first = rail.getSnapshot();

    await scrollToY(engageY() + 200);

    expect(rail.getSnapshot()).toBe(first);
  });
});

describe('createStickyRail — the options that cannot work throw at once', () => {
  it('refuses a blank id', () => {
    expect(() => createStickyRail({ id: '  ' })).toThrow(/non-blank/);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    'refuses gapPx = %s',
    (gapPx) => {
      expect(() => createStickyRail({ id: RAIL_ID, gapPx })).toThrow(/gapPx/);
    },
  );

  it('takes zero air, and no option at all', () => {
    expect(() => createStickyRail({ id: RAIL_ID, gapPx: 0 })).not.toThrow();
    expect(() => createStickyRail({ id: RAIL_ID })).not.toThrow();
  });
});

describe('createStickyRail — a rail that fits, or that is not sticky, stands down', () => {
  it("stays 'fits' through a whole scroll, and tells nobody anything", async () => {
    const element = buildPage({ height: shortHeight() });
    const rail = makeRail();
    const seen = attach(rail, element);
    rail.start();

    for (let y = 0; y <= SPACER + COLUMN; y += 250) await scrollToY(y);
    await scrollToY(0);

    expect(rail.getSnapshot()).toEqual({ mode: 'fits', topPx: 0 });
    expect(seen).toEqual([]);
    expect(element.dataset.rail).toBeUndefined();
    expect(element.getAttribute('style')).toBe(`height: ${shortHeight()}px;`);
  });

  it("stays 'fits' where the CSS sticky is not acting (below the container step)", async () => {
    // A phone's stacked layout: the menu is a static table of contents and
    // the rail must render nothing at all, however tall the card is.
    const element = buildPage({ height: tallHeight(), position: 'static' });
    const rail = makeRail();
    const seen = attach(rail, element);
    rail.start();

    await scrollToY(engageY() + 600);
    await scrollToY(engageY() + 200);

    expect(rail.getSnapshot().mode).toBe('fits');
    expect(seen).toEqual([]);
  });

  it('is a no-op when the element is not on the page', async () => {
    buildPage({ height: tallHeight() });
    const listen = vi.spyOn(window, 'addEventListener');
    const rail = makeRail({ id: 'nobody-home' });

    rail.start();
    await scrollToY(engageY() + 400);

    expect(listen).not.toHaveBeenCalled();
    expect(rail.getSnapshot().mode).toBe('fits');
  });
});

describe('createStickyRail — the four modes, scrolling down and back up', () => {
  it("starts a tall rail in 'top': the static sticky is what the page shows", () => {
    const element = buildPage({ height: tallHeight() });
    const rail = makeRail();
    attach(rail, element);

    rail.start();

    expect(rail.getSnapshot()).toEqual({ mode: 'top', topPx: 0 });
    expect(element.dataset.rail).toBe('top');
    // Attribute only — no override, the CSS sticky untouched.
    expect(element.style.top).toBe('');
    expect(element.style.position).toBe('');
  });

  it("scrolling DOWN: 'top' → 'travel' the moment the sticky holds it, without a jump", async () => {
    const element = buildPage({ height: tallHeight() });
    const rail = makeRail();
    attach(rail, element);
    rail.start();

    // Still in normal flow: scrolling down changes nothing.
    await scrollToY(engageY() - 50);
    expect(rail.getSnapshot().mode).toBe('top');

    // The sticky engages; the very next downward frame opens 'travel' with
    // the rail's offset inside its grid frozen — here the 30px the sticky
    // pushed it down by.
    await scrollToY(engageY() + 30);
    const before = element.getBoundingClientRect().top;
    expect(rail.getSnapshot()).toEqual({ mode: 'travel', topPx: 30 });
    expect(element.style.position).toBe('relative');
    expect(element.style.top).toBe('30px');
    expect(element.getBoundingClientRect().top).toBe(before);
    expect(element.getBoundingClientRect().top).toBeCloseTo(LINE, 0);
  });

  it("'travel' → 'bottom' when the bottom edge meets the window's bottom line", async () => {
    const element = buildPage({ height: tallHeight() });
    const rail = makeRail();
    attach(rail, element);
    rail.start();
    const floor = window.innerHeight - GAP;

    await scrollToY(engageY() + 30);
    // Ride with the page in wheel-sized steps until the pin.
    for (let y = engageY() + 30; y <= engageY() + 600; y += 60) {
      await scrollToY(y);
      if (rail.getSnapshot().mode === 'bottom') break;
    }

    expect(rail.getSnapshot()).toEqual({
      mode: 'bottom',
      topPx: floor - tallHeight(),
    });
    expect(rail.getSnapshot().topPx).toBeLessThan(0);
    expect(element.style.position).toBe('');
    expect(element.getBoundingClientRect().bottom).toBeCloseTo(floor, 0);

    // …and it STAYS pinned there while the page keeps going down.
    await scrollToY(engageY() + 1_500);
    expect(rail.getSnapshot().mode).toBe('bottom');
    expect(element.getBoundingClientRect().bottom).toBeCloseTo(floor, 0);
  });

  it("scrolling UP: 'bottom' → 'travel' with the offset frozen, no jump", async () => {
    const element = buildPage({ height: tallHeight() });
    const rail = makeRail();
    attach(rail, element);
    rail.start();

    await scrollToY(engageY() + 30);
    await scrollToY(engageY() + 1_500);
    expect(rail.getSnapshot().mode).toBe('bottom');
    const pinnedTop = element.getBoundingClientRect().top;

    await scrollToY(engageY() + 1_440);

    const snapshot = rail.getSnapshot();
    expect(snapshot.mode).toBe('travel');
    // The frozen offset is where the rail sat inside its grid at the
    // reversal — its viewport top minus the grid's content edge — and
    // applying it leaves the rail exactly where the pin had it.
    const rect = element.getBoundingClientRect();
    expect(snapshot.topPx).toBeCloseTo(rect.top - flowTop(element), 0);
    expect(rect.top).toBeCloseTo(pinnedTop, 0);
    expect(snapshot.topPx).toBeGreaterThan(0);
  });

  it("'travel' → 'top' when the top edge reaches the line, and rests ON the line", async () => {
    const element = buildPage({ height: tallHeight() });
    const rail = makeRail();
    attach(rail, element);
    rail.start();

    await scrollToY(engageY() + 30);
    await scrollToY(engageY() + 1_500);
    await scrollToY(engageY() + 1_440);
    expect(rail.getSnapshot().mode).toBe('travel');

    for (let y = engageY() + 1_440; y >= engageY(); y -= 60) {
      await scrollToY(y);
      if (rail.getSnapshot().mode === 'top') break;
    }

    expect(rail.getSnapshot()).toEqual({ mode: 'top', topPx: 0 });
    expect(element.style.position).toBe('');
    expect(element.style.top).toBe('');
    expect(element.getBoundingClientRect().top).toBeCloseTo(LINE, 0);

    // …and it STAYS at the line while the page keeps going up, until its
    // normal flow returns and it simply scrolls with the band.
    await scrollToY(engageY() - 100);
    expect(rail.getSnapshot().mode).toBe('top');
    expect(element.getBoundingClientRect().top).toBeCloseTo(LINE + 100, 0);
  });

  it('a second reversal mid-travel simply turns the rail around', async () => {
    // Down from 'top', up before the bottom pin, down again: the rail rides
    // with the page each way and lands on 'bottom' the way it would have.
    const element = buildPage({ height: tallHeight() });
    const rail = makeRail();
    attach(rail, element);
    rail.start();

    await scrollToY(engageY() + 30);
    await scrollToY(engageY() + 60);
    expect(rail.getSnapshot().mode).toBe('travel');
    const frozen = rail.getSnapshot().topPx;

    await scrollToY(engageY() + 40);
    expect(rail.getSnapshot()).toEqual({ mode: 'travel', topPx: frozen });

    for (let y = engageY() + 40; y <= engageY() + 900; y += 60) {
      await scrollToY(y);
      if (rail.getSnapshot().mode === 'bottom') break;
    }
    expect(rail.getSnapshot().mode).toBe('bottom');
  });

  it("one LARGE jump opens 'travel' with the rail still at its line — it never moves on its own", async () => {
    // A fragment jump under reduced motion, an End key, a restored position:
    // one scroll event. The rail is where the page left it; the next hand
    // scroll rides it up (the header's paragraph on large jumps).
    const element = buildPage({ height: tallHeight() });
    const rail = makeRail();
    attach(rail, element);
    rail.start();

    await scrollToY(engageY() + 1_000);

    expect(rail.getSnapshot().mode).toBe('travel');
    expect(element.getBoundingClientRect().top).toBeCloseTo(LINE, 0);

    await scrollToY(engageY() + 1_060);
    expect(element.getBoundingClientRect().top).toBeCloseTo(LINE - 60, 0);
  });

  it('tells its subscribers once per transition, never per scroll event', async () => {
    const element = buildPage({ height: tallHeight() });
    const rail = makeRail();
    const seen = attach(rail, element);
    rail.start();

    for (let y = 0; y <= engageY() + 1_500; y += 40) await scrollToY(y);

    // 'top' at start(), then travel, then bottom: exactly the three
    // transitions, over forty-odd scroll events.
    expect(seen.map((snapshot) => snapshot.mode)).toEqual([
      'top',
      'travel',
      'bottom',
    ]);
  });
});

describe('createStickyRail — a resize re-evaluates', () => {
  it("a window that grows lets a tall rail fall back to 'fits'", async () => {
    const element = buildPage({ height: tallHeight() });
    const rail = makeRail();
    attach(rail, element);
    rail.start();
    await scrollToY(engageY() + 30);
    expect(rail.getSnapshot().mode).toBe('travel');

    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(
      tallHeight() + LINE + GAP + 10,
    );
    window.dispatchEvent(new Event('resize'));
    await settle();

    expect(rail.getSnapshot()).toEqual({ mode: 'fits', topPx: 0 });
    expect(element.dataset.rail).toBeUndefined();
    expect(element.style.position).toBe('');
    expect(element.style.top).toBe('');
  });

  it("a rail that grows taller than the window leaves 'fits' — through the ResizeObserver", async () => {
    const element = buildPage({ height: shortHeight() });
    const rail = makeRail();
    attach(rail, element);
    rail.start();
    expect(rail.getSnapshot().mode).toBe('fits');

    element.style.height = `${tallHeight()}px`;
    // ResizeObserver delivers after layout, then the rail takes a frame.
    await settle();
    await settle();

    expect(rail.getSnapshot().mode).toBe('top');
  });

  it("re-pins 'bottom' at the new bottom line when the window changes height", async () => {
    const element = buildPage({ height: tallHeight() });
    const rail = makeRail();
    attach(rail, element);
    rail.start();
    await scrollToY(engageY() + 30);
    await scrollToY(engageY() + 1_500);
    expect(rail.getSnapshot().mode).toBe('bottom');
    const height = tallHeight();
    const shorter = window.innerHeight - 100;

    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(shorter);
    window.dispatchEvent(new Event('resize'));
    await settle();

    expect(rail.getSnapshot()).toEqual({
      mode: 'bottom',
      topPx: shorter - GAP - height,
    });
  });

  it('keeps one root em of air under the bottom pin by default, read live', async () => {
    const element = buildPage({ height: tallHeight() });
    const rail = makeRail({ id: RAIL_ID });
    attach(rail, element);
    rail.start();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

    await scrollToY(engageY() + 30);
    await scrollToY(engageY() + 1_500);

    expect(rail.getSnapshot()).toEqual({
      mode: 'bottom',
      topPx: window.innerHeight - rem - tallHeight(),
    });
  });
});

describe('createStickyRail — a focused descendant must be on screen', () => {
  it("pins 'bottom' for a link below the fold while top-pinned, at once", async () => {
    const element = buildPage({ height: tallHeight(), links: 8 });
    const rail = makeRail();
    attach(rail, element);
    rail.start();
    // Down to the bottom pin, up to the top pin: the sticky now HOLDS the
    // rail at its line, so the browser's own scroll-into-view cannot reveal a
    // link below the fold — only a pin can.
    await scrollToY(engageY() + 30);
    await scrollToY(engageY() + 1_500);
    for (let y = engageY() + 1_440; y >= engageY(); y -= 60) {
      await scrollToY(y);
      if (rail.getSnapshot().mode === 'top') break;
    }
    expect(rail.getSnapshot().mode).toBe('top');
    const last = element.querySelectorAll('a')[7];
    expect(last.getBoundingClientRect().bottom).toBeGreaterThan(
      window.innerHeight,
    );

    last.focus();

    // Synchronous — no frame was awaited: the pin is published inside the
    // focusin listener itself.
    expect(rail.getSnapshot().mode).toBe('bottom');
    const rect = last.getBoundingClientRect();
    expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight - GAP + 1);
    expect(rect.top).toBeGreaterThanOrEqual(0);
  });

  it('needs no pin while travelling: the rail rides with the page, so the browser reveals the link itself', async () => {
    // Measured here: Chromium performs its scroll-into-view BEFORE it
    // dispatches focusin, and a travelling rail moves with that scroll. The
    // listener then reads a link already on screen and leaves the mode alone
    // — the header's "pins only what is still hidden".
    const element = buildPage({ height: tallHeight(), links: 8 });
    const rail = makeRail();
    attach(rail, element);
    rail.start();
    await scrollToY(engageY() + 30);
    await scrollToY(engageY() + 60);
    expect(rail.getSnapshot().mode).toBe('travel');
    const last = element.querySelectorAll('a')[7];
    expect(last.getBoundingClientRect().bottom).toBeGreaterThan(
      window.innerHeight,
    );

    last.focus();

    const rect = last.getBoundingClientRect();
    expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight + 1);
    expect(rect.top).toBeGreaterThanOrEqual(0);
    expect(['travel', 'bottom']).toContain(rail.getSnapshot().mode);
  });

  it("pins 'top' for a link above the line while bottom-pinned", async () => {
    const element = buildPage({ height: tallHeight(), links: 8 });
    const rail = makeRail();
    attach(rail, element);
    rail.start();
    await scrollToY(engageY() + 30);
    await scrollToY(engageY() + 1_500);
    expect(rail.getSnapshot().mode).toBe('bottom');
    const first = element.querySelectorAll('a')[0];
    expect(first.getBoundingClientRect().top).toBeLessThan(0);

    first.focus();

    expect(rail.getSnapshot().mode).toBe('top');
    expect(first.getBoundingClientRect().top).toBeGreaterThanOrEqual(LINE - 1);
  });

  it("pins 'top' when the rail itself takes focus — a fragment jump to its own id", async () => {
    const element = buildPage({ height: tallHeight(), links: 2 });
    const rail = makeRail();
    attach(rail, element);
    rail.start();
    await scrollToY(engageY() + 30);
    await scrollToY(engageY() + 1_500);
    expect(rail.getSnapshot().mode).toBe('bottom');

    element.focus();

    expect(rail.getSnapshot().mode).toBe('top');
  });

  it('leaves a link that is already on screen alone', async () => {
    const element = buildPage({ height: tallHeight(), links: 8 });
    const rail = makeRail();
    const seen = attach(rail, element);
    rail.start();
    await scrollToY(engageY() + 30);
    const before = seen.length;

    element.querySelectorAll('a')[1].focus();

    expect(seen.length).toBe(before);
  });

  it("does nothing in 'fits' — the CSS sticky already shows the whole rail", () => {
    const element = buildPage({ height: shortHeight(), links: 3 });
    const rail = makeRail();
    const seen = attach(rail, element);
    rail.start();

    element.querySelectorAll('a')[2].focus();

    expect(seen).toEqual([]);
  });
});

describe('createStickyRail — one evaluation per frame', () => {
  it('coalesces any number of events into ONE geometry read', async () => {
    const element = buildPage({ height: tallHeight() });
    const rail = makeRail();
    attach(rail, element);
    rail.start();
    await scrollToY(engageY() + 30);
    await settle();
    const read = vi.spyOn(element, 'getBoundingClientRect');

    for (let index = 0; index < 5; index += 1) {
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('resize'));
    }
    await settle();

    expect(read).toHaveBeenCalledTimes(1);
  });

  it("asks the browser NOT to wait for it: the scroll listener is passive, and 'fits' does not even schedule", async () => {
    const element = buildPage({ height: shortHeight() });
    const listen = vi.spyOn(window, 'addEventListener');
    const rail = makeRail();
    attach(rail, element);
    rail.start();
    const scroll = listen.mock.calls.find(([type]) => type === 'scroll');
    expect(scroll?.[2]).toEqual({ passive: true });
    // The ResizeObserver delivers one initial observation after observe();
    // let that frame pass so the spy below counts scrolling alone.
    await settle();
    await settle();

    const read = vi.spyOn(element, 'getBoundingClientRect');
    await scrollToY(engageY() + 200);

    expect(read).not.toHaveBeenCalled();
  });
});

describe('createStickyRail — start and dispose', () => {
  it('attaches exactly one set of listeners, however often start() is called', () => {
    const element = buildPage({ height: tallHeight() });
    const listen = vi.spyOn(window, 'addEventListener');
    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const rail = makeRail();

    rail.start();
    rail.start();

    expect(
      listen.mock.calls
        .map(([type]) => type)
        .sort((a, b) => a.localeCompare(b)),
    ).toEqual(['resize', 'scroll']);
    expect(observe).toHaveBeenCalledTimes(1);
    expect(observe).toHaveBeenCalledWith(element);
  });

  it("dispose() detaches everything, cancels the frame and answers 'fits' again", async () => {
    const element = buildPage({ height: tallHeight() });
    const rail = makeRail();
    attach(rail, element);
    rail.start();
    await scrollToY(engageY() + 30);
    await scrollToY(engageY() + 1_500);
    expect(rail.getSnapshot().mode).toBe('bottom');
    const disconnect = vi.spyOn(ResizeObserver.prototype, 'disconnect');
    const cancel = vi.spyOn(window, 'cancelAnimationFrame');
    // A frame is pending when dispose() lands — it must not run afterwards.
    window.dispatchEvent(new Event('scroll'));

    rail.dispose();

    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(rail.getSnapshot()).toEqual({ mode: 'fits', topPx: 0 });
    expect(element.dataset.rail).toBeUndefined();
    expect(element.style.top).toBe('');
    // …and the page moving no longer says anything to it.
    await scrollToY(engageY() + 1_400);
    await scrollToY(engageY() + 30);
    expect(rail.getSnapshot().mode).toBe('fits');
  });

  it('is re-entrant, and start() works again afterwards', async () => {
    const element = buildPage({ height: tallHeight() });
    const rail = makeRail();
    attach(rail, element);
    rail.start();
    rail.dispose();
    rail.dispose();
    expect(rail.getSnapshot().mode).toBe('fits');

    rail.start();

    expect(rail.getSnapshot().mode).toBe('top');
    await scrollToY(engageY() + 30);
    expect(rail.getSnapshot().mode).toBe('travel');
  });

  it("dispose() before start() is a no-op that still answers 'fits'", () => {
    buildPage({ height: tallHeight() });
    const remove = vi.spyOn(window, 'removeEventListener');
    const rail = makeRail();

    rail.dispose();

    expect(remove).not.toHaveBeenCalled();
    expect(rail.getSnapshot()).toEqual({ mode: 'fits', topPx: 0 });
  });
});
