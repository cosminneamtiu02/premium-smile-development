import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import {
  planReadingLine,
  readingIndex,
  type ReadingFrame,
  type ReadingPlan,
} from '../reading-line/reading-line.ts';
import {
  createScrollSpy,
  DEFAULT_SETTLE_MS,
  LOAD_WAIT_CEILING_MS,
  type ScrollSpy,
  STALE_FINISH_REACH,
} from './scroll-spy.ts';

// Runs in the `components` project (real chromium, vitest.config.ts) because
// every rule in this module is about the DOCUMENT — a real scroll position, a
// real getBoundingClientRect, real computed styles. There is no React anywhere
// near it and no Testing Library either: the fixture below is four <section>
// blocks built by hand, which is exactly what a plain mechanics module in the
// foundation ring buys (the lib/scroll-lock precedent).
//
// ── FAKE TIMERS, WITH AN EXPLICIT `toFake` — MEASURED, NOT COPIED. The settle
// window is a timer, so the suite must own it; but the SCROLL EVENTS this
// module reacts to are the browser's own, and waiting for one means waiting
// for a real animation frame. Probed in this lane: vitest 4.1's DEFAULT
// `toFake` DOES replace requestAnimationFrame (it comes back as sinon's
// `function () { return clock[method].apply(clock, arguments); }`), so a frame
// would never arrive and every scroll assertion would hang. Naming
// setTimeout/clearTimeout alone leaves rAF — and the scroll events that ride
// the frame clock — real. The PROBE below pins both halves; nothing after it
// means anything without it.
//
// ── THE FIXTURE IS THE PRICE PAGE, IN NUMBERS: <html> keeps 96px of
// scroll-padding-top (globals.css's 6rem, the header pill's reach) and every
// target carries 40px of scroll-margin-top (a CategoryCard's
// `scroll-mt-[2.5rem]`). Pixels rather than rem because a test that re-derived the root font
// size would be testing arithmetic; what matters here is that BOTH properties
// are read and that the landing line is their sum.

/** The shell's own scroll-padding-top, in test pixels (6rem). */
const PADDING = 96;
/** A card's scroll-margin-top rider, in test pixels (2.5rem). */
const MARGIN = 40;
/** Taller than any test viewport, so the targets are reached one at a time. */
const BLOCK = 1_200;

const IDS = [
  'consultations',
  'endodontics',
  'prosthetics',
  'orthodontics',
] as const;

/** Every spy a test starts, disposed in afterEach — a leaked listener would
 *  make the NEXT test's scrolling mean something it does not mean. */
const live: ScrollSpy[] = [];

let host: HTMLElement | undefined;

type PageOptions = Readonly<{
  ids?: readonly string[];
  /** One height per id; short blocks make a target unreachable on purpose. */
  heights?: readonly number[];
  margin?: number;
  padding?: number;
  /** A block of this many pixels ABOVE the first target — a long intro, which
   *  keeps the first target under its line at scroll 0 (THE TOP FALLBACK). */
  intro?: number;
}>;

/** Build a tall document of fragment targets and hand back their ids. */
function buildPage(page: PageOptions = {}): readonly string[] {
  const ids = page.ids ?? IDS;
  const margin = page.margin ?? MARGIN;

  document.documentElement.style.scrollPaddingTop = `${page.padding ?? PADDING}px`;
  host = document.createElement('div');
  if (page.intro !== undefined) {
    const intro = document.createElement('div');
    intro.style.height = `${page.intro}px`;
    host.append(intro);
  }
  for (const [index, id] of ids.entries()) {
    const section = document.createElement('section');
    section.id = id;
    section.style.scrollMarginTop = `${margin}px`;
    section.style.height = `${page.heights?.[index] ?? BLOCK}px`;
    host.append(section);
  }
  document.body.append(host);
  return ids;
}

/** A spy the suite will dispose, whatever the test does. */
function makeSpy(
  options: Parameters<typeof createScrollSpy>[0] = { ids: IDS },
): ScrollSpy {
  const spy = createScrollSpy(options);
  live.push(spy);
  return spy;
}

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));

/**
 * The scroll position the BROWSER's own jump to `#id` would produce:
 * `rect.top − scroll-margin-top === scroll-padding-top`, solved for the scroll
 * offset. Computed from the live element at whatever position the page is in,
 * so it is never a number this file has to keep in sync with the fixture.
 */
const landingOf = (id: string): number => {
  const target = document.getElementById(id) as HTMLElement;
  return Math.round(
    target.getBoundingClientRect().top + window.scrollY - MARGIN - PADDING,
  );
};

/** Scroll, then let the browser deliver its scroll event: it is dispatched at
 *  the next rendering opportunity, never synchronously, so two frames is the
 *  honest wait (one for the event, one for anything it scheduled). */
async function scrollToY(y: number): Promise<void> {
  window.scrollTo(0, y);
  await nextFrame();
  await nextFrame();
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
  for (const spy of live) spy.dispose();
  live.length = 0;
  host?.remove();
  host = undefined;
  document.documentElement.style.scrollPaddingTop = '';
  // The hash survives a test file (it is the page's URL, not the DOM), so put
  // it back — a leftover `#endodontics` would pin the next spy at start().
  window.history.replaceState(
    null,
    '',
    window.location.pathname + window.location.search,
  );
  window.scrollTo(0, 0);
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('PROBE — the suite owns the timer and NOT the frame clock', () => {
  it('fakes setTimeout while leaving requestAnimationFrame real', async () => {
    let fired = false;
    setTimeout(() => {
      fired = true;
    }, DEFAULT_SETTLE_MS);

    expect(vi.getTimerCount()).toBe(1);
    // A real frame still arrives without the test advancing anything — which
    // is what makes every scroll assertion below possible.
    await nextFrame();
    expect(fired).toBe(false);

    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(fired).toBe(true);
  });
});

describe('createScrollSpy — construction is pure (§16)', () => {
  it('touches no window, no document and no timer', () => {
    // The island builds its spy in a useState initializer, which runs on the
    // SERVER during the static export as well as in the browser. A single
    // browser read here would be a hydration hazard and an SSR crash.
    buildPage();
    const listen = vi.spyOn(window, 'addEventListener');
    const lookup = vi.spyOn(document, 'getElementById');

    makeSpy();

    expect(listen).not.toHaveBeenCalled();
    expect(lookup).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports nothing current — and that IS the server snapshot, forever', async () => {
    buildPage();
    const spy = makeSpy();

    expect(spy.getSnapshot()).toEqual({ current: null });
    expect(spy.getServerSnapshot()).toEqual({ current: null });

    const server = spy.getServerSnapshot();
    spy.start();
    await scrollToY(landingOf(IDS[2]));

    // The browser has long since moved on; the static export's answer has not
    // (lib/external-store's frozen-server-snapshot rule), so hydration
    // compares like with like.
    expect(spy.getSnapshot().current).toBe(IDS[2]);
    expect(spy.getServerSnapshot()).toBe(server);
    expect(spy.getServerSnapshot()).toEqual({ current: null });
  });

  it('keeps ONE snapshot object while nothing has changed', () => {
    // Identity is the signal useSyncExternalStore reads: a store that minted a
    // fresh object per call would re-render forever.
    buildPage();
    const spy = makeSpy();
    spy.start();

    const first = spy.getSnapshot();
    expect(spy.getSnapshot()).toBe(first);
    window.dispatchEvent(new Event('scroll'));
    expect(spy.getSnapshot()).toBe(first);
  });
});

describe('createScrollSpy — the options that cannot work throw at once', () => {
  it('refuses an empty list of ids', () => {
    expect(() => createScrollSpy({ ids: [] })).toThrow(/at least one target/);
  });

  it('refuses a blank id', () => {
    expect(() => createScrollSpy({ ids: ['a', '  '] })).toThrow(/non-blank/);
  });

  it('refuses a duplicate id', () => {
    expect(() => createScrollSpy({ ids: ['a', 'b', 'a'] })).toThrow(/unique/);
  });

  it.each([0, 0.5, -1, Number.NaN, Number.POSITIVE_INFINITY, 2_147_483_648])(
    'refuses settleMs = %s',
    (settleMs) => {
      // The lib/clock bound, inherited rather than re-argued: WebIDL converts
      // a delay to a 32-bit long, so every one of these arrives as a 0 ms
      // timer that would end the pin on the jump's own first scroll event.
      expect(() => createScrollSpy({ ids: [...IDS], settleMs })).toThrow(
        /settleMs/,
      );
    },
  );

  it('takes a settle window inside the range', () => {
    expect(() => createScrollSpy({ ids: [...IDS], settleMs: 1 })).not.toThrow();
    expect(DEFAULT_SETTLE_MS).toBe(150);
  });

  it('refuses a line it does not know — the retired middle line among them', () => {
    // A word the type does not admit — a cast, a plain-JS caller's 'top', or
    // 'middle', the doctor page's year timeline's line until 2026-10-13 —
    // must not fall silently to one of the two lines.
    for (const word of ['top', 'middle']) {
      const line = word as unknown as 'landing';
      expect(() => createScrollSpy({ ids: [...IDS], line })).toThrow(/line/);
    }
    expect(() =>
      createScrollSpy({ ids: [...IDS], line: 'landing' }),
    ).not.toThrow();
  });
});

describe('createScrollSpy — the position walk', () => {
  it('starts on the FIRST target: at the top of the page, that is what you see', async () => {
    buildPage();
    const spy = makeSpy();
    spy.start();

    expect(window.scrollY).toBe(0);
    expect(spy.getSnapshot().current).toBe(IDS[0]);
  });

  it('follows the page: the target at its landing line becomes current', async () => {
    buildPage();
    const spy = makeSpy();
    spy.start();

    for (const index of [1, 2]) {
      const landing = landingOf(IDS[index]);
      await scrollToY(landing);
      // The premise, asserted rather than assumed: a clamped scroll (a page
      // shorter than the fixture expects) would make the rest meaningless.
      expect(Math.round(window.scrollY)).toBe(landing);
      expect(spy.getSnapshot().current).toBe(IDS[index]);
    }
  });

  it('grants one pixel of grace, and one pixel more belongs to the target above', async () => {
    // `rect.top − margin <= padding + 1`: the grace absorbs the sub-pixel
    // arithmetic a fractional device-pixel ratio produces, and nothing more.
    buildPage();
    const spy = makeSpy();
    spy.start();
    const landing = landingOf(IDS[2]);

    await scrollToY(landing - 1);
    expect(spy.getSnapshot().current).toBe(IDS[2]);

    await scrollToY(landing - 2);
    expect(spy.getSnapshot().current).toBe(IDS[1]);
  });

  it('reads BOTH CSS properties — a target with more margin lands earlier', async () => {
    // The landing line is scroll-padding-top + the target's own
    // scroll-margin-top. Double the margin on one target and its line moves by
    // exactly that much, with no number in this module to update.
    buildPage();
    const spy = makeSpy();
    spy.start();
    const target = document.getElementById(IDS[2]) as HTMLElement;
    const landing = landingOf(IDS[2]);

    target.style.scrollMarginTop = `${MARGIN * 2}px`;
    await scrollToY(landing - MARGIN);
    expect(spy.getSnapshot().current).toBe(IDS[2]);
  });

  it('THE BOTTOM RULE: the end of the page means the last target, reachable or not', async () => {
    // Measured on the real page at 1920×1080: the last category card runs out
    // of document before it can reach its line, so without this rule it could
    // never become current by scrolling. Here the last block is 40px tall,
    // which reproduces that exactly.
    const ids = buildPage({ heights: [BLOCK, BLOCK, BLOCK, 40] });
    const spy = makeSpy();
    spy.start();
    const bottom = document.documentElement.scrollHeight - window.innerHeight;

    await scrollToY(bottom - 300);
    expect(spy.getSnapshot().current).toBe(ids[2]);

    await scrollToY(bottom);
    expect(Math.round(window.scrollY)).toBe(bottom);
    // Proof the rule — not the walk — did it: the last target is nowhere near
    // its line.
    const last = document.getElementById(ids[3]) as HTMLElement;
    expect(last.getBoundingClientRect().top - MARGIN).toBeGreaterThan(
      PADDING + 1,
    );
    expect(spy.getSnapshot().current).toBe(ids[3]);
  });

  it('leaves a page that FITS its viewport on the top rule', async () => {
    // `maxScrollY > 0` is the guard: a document with nothing to scroll is at
    // its own end from the first frame, and without the guard the last target
    // would be current forever on a short page. Padding and margin are zeroed
    // here so the line sits at the very top and no target has reached it.
    const ids = buildPage({
      heights: [40, 40, 40, 40],
      margin: 0,
      padding: 0,
    });
    const spy = makeSpy();
    spy.start();

    expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(
      window.innerHeight,
    );
    expect(spy.getSnapshot().current).toBe(ids[0]);
  });

  it('skips an id with no element on the page', async () => {
    // A menu may legitimately outlive a card for a frame (a hot reload, a
    // consumer rendering its list before its content).
    buildPage();
    const spy = makeSpy({ ids: ['nowhere', ...IDS] });
    spy.start();

    expect(spy.getSnapshot().current).toBe(IDS[0]);
    await scrollToY(landingOf(IDS[1]));
    expect(spy.getSnapshot().current).toBe(IDS[1]);
  });

  it('reports nothing when not one of its ids is on the page', () => {
    const spy = makeSpy({ ids: ['nowhere', 'nor-here'] });
    spy.start();

    expect(spy.getSnapshot().current).toBeNull();
  });
});

describe('createScrollSpy — the top fallback: a long intro above the first target', () => {
  // THE TOP FALLBACK (the header's POSITION WALK): while no target has
  // reached its line, the walk answers the FIRST target — the price menu's
  // answer at the top of its page since 2026-09-14. The 600px intro below
  // keeps the first target well under its landing line at scrollY 0, so the
  // answer there is the fallback's and not the walk's.
  const INTRO = 600;

  it('answers the FIRST target while it is still below its line — the price menu’s answer', () => {
    // At the top of the page the first target is what the visitor is looking
    // at, intro or not.
    buildPage({ intro: INTRO });
    const spy = makeSpy();
    spy.start();

    const first = document.getElementById(IDS[0]) as HTMLElement;
    // The premise: the first target really is below its line.
    expect(first.getBoundingClientRect().top - MARGIN).toBeGreaterThan(
      PADDING + 1,
    );
    expect(spy.getSnapshot().current).toBe(IDS[0]);
  });
});

describe("createScrollSpy — line: 'reading' (owner 2026-09-29)", () => {
  // THE READING LINE (the header): the middle of the CLEAR area, bent near
  // both ends of the page, with every target's landing planned to match and
  // WRITTEN as its scroll-margin-top — "keeps the line lower for currently
  // selected items and also selects top one … and also the go to card when
  // you click on the meniu on an option should be more to the center of the
  // screen" (owner, 2026-09-29). The arithmetic has its own suite
  // (src/lib/reading-line) and is only USED here, to say what the spy should
  // have done: every expectation below is planned from the fixture's own
  // numbers and the live rects, never read back from the spy.
  //
  // ── THE FLOOR LIVES IN A STYLESHEET HERE, not inline as in buildPage. The
  // reading line writes the inline `scroll-margin-top` itself and lifts it
  // again to read the floor, so an inline floor would be the very value it
  // writes over — which is also why a reading-line target on the site keeps
  // its floor in a class (the price card's `scroll-mt-[2.5rem]`).

  /** THE READING PAGE: two short cards at the very top — the second's top
   *  already ABOVE the line at scroll 0 — then one that fits, one far too tall
   *  to, two more that fit, and 400px of page under the last: too little for
   *  the landing line ever to reach it. */
  const READING_PAGE = {
    heights: [150, 150, 400, 1_400, 300, 200],
    outro: 400,
  } as const;

  let sheet: HTMLStyleElement | undefined;

  afterEach(() => {
    sheet?.remove();
    sheet = undefined;
  });

  const spacer = (height: number): HTMLElement => {
    const block = document.createElement('div');
    block.style.height = `${height}px`;
    return block;
  };

  /** Build a column of `reading-N` targets whose floor is a STYLESHEET rule. */
  function buildReadingPage(
    page: Readonly<{
      heights: readonly number[];
      intro?: number;
      outro?: number;
    }>,
  ): readonly string[] {
    const ids = page.heights.map((_, index) => `reading-${index}`);
    document.documentElement.style.scrollPaddingTop = `${PADDING}px`;
    sheet = document.createElement('style');
    sheet.textContent = `.reading-target { scroll-margin-top: ${MARGIN}px; }`;
    document.head.append(sheet);
    host = document.createElement('div');
    if (page.intro !== undefined) host.append(spacer(page.intro));
    for (const [index, id] of ids.entries()) {
      const section = document.createElement('section');
      section.id = id;
      section.className = 'reading-target';
      section.style.height = `${page.heights[index]}px`;
      host.append(section);
    }
    if (page.outro !== undefined) host.append(spacer(page.outro));
    document.body.append(host);
    return ids;
  }

  const target = (id: string): HTMLElement =>
    document.getElementById(id) as HTMLElement;

  /** What the spy has written on a target — '' when nothing. */
  const writtenOn = (id: string): string =>
    target(id).style.getPropertyValue('scroll-margin-top');

  /** A margin as the spy spells it: CSS pixels to two decimals. */
  const px = (margin: number): string => `${Math.round(margin * 100) / 100}px`;

  /** A target's top edge in DOCUMENT coordinates. */
  const documentTop = (id: string): number =>
    target(id).getBoundingClientRect().top + window.scrollY;

  const maxScrollY = (): number =>
    document.documentElement.scrollHeight - window.innerHeight;

  /**
   * What the spy SHOULD be working to: the page as lib/reading-line reads it,
   * built here from first principles — the fixture's own padding and floor,
   * the live rects and the window — and planned.
   */
  function expected(
    ids: readonly string[],
    floor = MARGIN,
  ): Readonly<{ frame: ReadingFrame; plan: ReadingPlan }> {
    const frame: ReadingFrame = {
      viewport: window.innerHeight,
      maxScrollY: maxScrollY(),
      padding: PADDING,
      targets: ids.map((id) => ({
        top: documentTop(id),
        height: target(id).getBoundingClientRect().height,
        floor,
      })),
    };
    return { frame, plan: planReadingLine(frame) };
  }

  it('refuses an unknown line still, and names both', () => {
    const line = 'top' as unknown as 'reading';

    expect(() => createScrollSpy({ ids: [...IDS], line })).toThrow(
      "createScrollSpy: line must be 'landing' or 'reading' (received top)",
    );
    expect(() =>
      createScrollSpy({ ids: [...IDS], line: 'reading' }),
    ).not.toThrow();
  });

  it('writes each target’s planned scroll-margin-top at start(), and takes it off in dispose() — the stylesheet’s 40px returns', () => {
    const ids = buildReadingPage(READING_PAGE);
    for (const id of ids) expect(writtenOn(id)).toBe('');
    const spy = makeSpy({ ids, line: 'reading' });

    spy.start();

    const { plan } = expected(ids);
    ids.forEach((id, index) => {
      expect(writtenOn(id)).toBe(px(plan.margins[index]));
    });
    // The premise that makes this a test: the plan moved the landings — the
    // short first cards below the floor (negative, the first two), the tall
    // one exactly ON it.
    expect(plan.margins[0]).toBeLessThan(0);
    expect(writtenOn(ids[3])).toBe(`${MARGIN}px`);

    spy.dispose();

    for (const id of ids) {
      expect(writtenOn(id)).toBe('');
      expect(getComputedStyle(target(id)).scrollMarginTop).toBe(`${MARGIN}px`);
    }
  });

  it("writes nothing on 'landing' — no inline style on any target, ever", async () => {
    // Everything that makes a reading-line spy write — start(), a scroll, a
    // resize, a `#id`, a pin and its settle, dispose() — put through the
    // landing line, by default and by name, and every target's style
    // attribute is the one the fixture gave it.
    const ids = buildReadingPage(READING_PAGE);
    const before = ids.map((id) => target(id).getAttribute('style'));
    const spies = [makeSpy({ ids }), makeSpy({ ids, line: 'landing' })];
    for (const spy of spies) spy.start();

    await scrollToY(600);
    window.dispatchEvent(new Event('resize'));
    window.history.replaceState(null, '', `#${ids[2]}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    spies[0].select(ids[4]);
    vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);
    for (const spy of spies) spy.dispose();

    expect(ids.map((id) => target(id).getAttribute('style'))).toEqual(before);
  });

  it('a target that fits becomes current as its top crosses the middle of the CLEAR area — with the walk’s pixel of grace, and not a pixel more', async () => {
    // The fourth card fits and sits far from both ends, so nothing bends
    // there: the line is exactly (padding + innerHeight) / 2. The half is
    // FLOORED, so an odd window's half pixel puts the top at most half a pixel
    // ABOVE the line — inside it.
    const ids = buildReadingPage(READING_PAGE);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    const line = (PADDING + window.innerHeight) / 2;
    const onLine = Math.round(documentTop(ids[4])) - Math.floor(line);
    const belowLine = (): number =>
      target(ids[4]).getBoundingClientRect().top - line;
    // The premise: it fits the clear area, so it is a CENTRED card.
    expect(READING_PAGE.heights[4]).toBeLessThanOrEqual(
      window.innerHeight - PADDING - 2 * MARGIN,
    );

    await scrollToY(onLine);
    expect(Math.abs(belowLine())).toBeLessThanOrEqual(0.5);
    expect(spy.getSnapshot().current).toBe(ids[4]);

    await scrollToY(onLine - 1);
    expect(belowLine()).toBeLessThanOrEqual(1);
    expect(spy.getSnapshot().current).toBe(ids[4]);

    await scrollToY(onLine - 2);
    expect(belowLine()).toBeGreaterThan(1);
    expect(spy.getSnapshot().current).toBe(ids[3]);
  });

  it('the first target is current at scroll 0 — on a page whose second target’s top is already ABOVE the line there', () => {
    // "so smaller cars at top also get selection" (owner). A fixed line at the
    // screen's middle is the control, counted from the live rects with the
    // walk's pixel of grace: at scroll 0 — as high as the page goes — the
    // last top it has passed is the THIRD card's, so the first two would
    // never have a turn.
    const ids = buildReadingPage(READING_PAGE);
    const reading = makeSpy({ ids, line: 'reading' });
    reading.start();

    expect(window.scrollY).toBe(0);
    expect(target(ids[1]).getBoundingClientRect().top).toBeLessThan(
      (PADDING + window.innerHeight) / 2,
    );
    const passedTheMiddle = ids.filter(
      (id) =>
        target(id).getBoundingClientRect().top <= window.innerHeight / 2 + 1,
    );
    expect(passedTheMiddle[passedTheMiddle.length - 1]).toBe(ids[2]);
    expect(reading.getSnapshot().current).toBe(ids[0]);
  });

  it('every target has its turn, in order, scrolling from 0 to the end — and the last is current at the page’s end with no bottom rule involved', async () => {
    const ids = buildReadingPage(READING_PAGE);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    const end = maxScrollY();
    // The premise: the landing line could never reach the last card — its
    // landing lies past the page's end — so on that line only the bottom rule
    // ever marked it.
    expect(documentTop(ids[5]) - PADDING - MARGIN).toBeGreaterThan(end);

    // Every pixel from 0 to the end. The spy's own scroll listener runs at
    // each one, synchronously; the browser's event would bring the same
    // answer a frame later.
    const turns: (string | null)[] = [];
    for (let y = 0; y <= end; y += 1) {
      window.scrollTo(0, y);
      window.dispatchEvent(new Event('scroll'));
      const { current } = spy.getSnapshot();
      if (turns[turns.length - 1] !== current) turns.push(current);
    }
    expect(turns).toEqual(ids);

    // The last card's turn begins at its OWN landing, well before the pixel
    // at which the bottom rule would speak (`end − 1`), and lasts to the end.
    const { plan } = expected(ids);
    const lastLanding = plan.landings[ids.length - 1];
    expect(lastLanding).toBeLessThan(end - 1);
    await scrollToY(Math.round(lastLanding));
    expect(spy.getSnapshot().current).toBe(ids[5]);
    await scrollToY(end);
    expect(spy.getSnapshot().current).toBe(ids[5]);
  });

  it('a real fragment jump lands where the plan says — a target that fits, CENTRED on the line', async () => {
    // "the go to card when you click on the meniu on an option should be more
    // to the center of the screen" (owner). The browser's own jump, driven by
    // the margin the spy wrote.
    const ids = buildReadingPage(READING_PAGE);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    const { plan } = expected(ids);

    window.location.hash = ids[4];
    await nextFrame();
    await nextFrame();

    expect(Math.abs(window.scrollY - plan.landings[4])).toBeLessThanOrEqual(2);
    const rect = target(ids[4]).getBoundingClientRect();
    expect(
      Math.abs(rect.top + rect.height / 2 - plan.line),
    ).toBeLessThanOrEqual(2);
    expect(spy.getSnapshot().current).toBe(ids[4]);
  });

  it('a pin that has ARRIVED holds through a resize that moves the line — where the walk alone would name another card', async () => {
    // At a landing a held pin and a dropped one publish the SAME id (property
    // (2)), so arrival cannot be seen there. A resize is where it shows: the
    // line moves, a fresh walk moves with it, and only a pin the settle found
    // ARRIVED is still there to hold the card the visitor jumped to (G2
    // typescript review: with arrival hard-wired to false the suite passed
    // without this).
    const ids = buildReadingPage(READING_PAGE);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    window.location.hash = ids[4];
    await nextFrame();
    await nextFrame();
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(ids[4]);

    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(
      window.innerHeight + 400,
    );
    window.dispatchEvent(new Event('resize'));

    const { frame, plan } = expected(ids);
    expect(readingIndex(frame, plan, window.scrollY)).not.toBe(4);
    expect(spy.getSnapshot().current).toBe(ids[4]);
  });

  it.each([
    ['a short target', 1, 1_000],
    ['a tall one', 3, 0],
    ['the first', 0, 500],
    ['the last', 5, 0],
  ] as const)(
    'THE AGREEMENT — %s: after its jump settles, a one-pixel hand scroll (which drops the pin) leaves the SAME target current',
    async (_, index, from) => {
      // Property (2) of lib/reading-line, end to end: the jump lands the
      // target on its landing, the pin holds through the settle, and when the
      // visitor's own pixel of scrolling hands the answer back to the walk,
      // the walk names the target the click chose. (That a hand scroll drops
      // a settled pin is 'drops the pin on the first hand scroll after the
      // settle', above; here it is the answer afterwards that is the claim.)
      const ids = buildReadingPage(READING_PAGE);
      const spy = makeSpy({ ids, line: 'reading' });
      await scrollToY(from);
      spy.start();
      const { frame, plan } = expected(ids);

      window.location.hash = ids[index];
      await nextFrame();
      await nextFrame();
      vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
      expect(
        Math.abs(window.scrollY - plan.landings[index]),
      ).toBeLessThanOrEqual(2);
      expect(spy.getSnapshot().current).toBe(ids[index]);

      // One pixel down — or up, where the page has no pixel left below.
      const hand = window.scrollY < maxScrollY() ? 1 : -1;
      await scrollToY(window.scrollY + hand);

      expect(readingIndex(frame, plan, window.scrollY)).toBe(index);
      expect(spy.getSnapshot().current).toBe(ids[index]);
    },
  );

  it('re-reads the floor on a resize — and only then: the ceiling follows the stylesheet', async () => {
    // The tall card rests ON its ceiling, so its margin IS the floor. Change
    // the stylesheet: a scroll does not look (never on a scroll event), a
    // resize does — with the spy's own write lifted first, so the stylesheet
    // is what it reads.
    const ids = buildReadingPage(READING_PAGE);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    expect(writtenOn(ids[3])).toBe(`${MARGIN}px`);

    (sheet as HTMLStyleElement).textContent =
      '.reading-target { scroll-margin-top: 60px; }';
    await scrollToY(300);
    expect(writtenOn(ids[3])).toBe(`${MARGIN}px`);

    window.dispatchEvent(new Event('resize'));

    expect(writtenOn(ids[3])).toBe('60px');
    const { plan } = expected(ids, 60);
    ids.forEach((id, index) => {
      expect(writtenOn(id)).toBe(px(plan.margins[index]));
    });
  });

  it('a target that grows re-measures through the ResizeObserver — no scroll, no resize', async () => {
    const ids = buildReadingPage(READING_PAGE);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    // Let the observer's first delivery (every observe() makes one) pass.
    await nextFrame();
    await nextFrame();
    const before = writtenOn(ids[4]);

    target(ids[4]).style.height = '500px';
    // The observer delivers after layout, in the next rendering step.
    await nextFrame();
    await nextFrame();

    const { plan } = expected(ids);
    expect(writtenOn(ids[4])).toBe(px(plan.margins[4]));
    expect(writtenOn(ids[4])).not.toBe(before);
  });

  it('the load-time hash: a page resting where the BROWSER’s jump put its target — on the stylesheet’s margin — is re-landed on the plan’s', async () => {
    // The browser follows a link's `#id` at load, before any script runs, so
    // it lands on the 40px stylesheet margin. start() finishes the jump.
    const ids = buildReadingPage(READING_PAGE);
    const stylesheetLanding = Math.round(
      documentTop(ids[4]) - PADDING - MARGIN,
    );
    await scrollToY(stylesheetLanding);
    window.history.replaceState(null, '', `#${ids[4]}`);
    const spy = makeSpy({ ids, line: 'reading' });
    const { plan } = expected(ids);
    expect(Math.abs(stylesheetLanding - plan.landings[4])).toBeGreaterThan(2);

    spy.start();

    // No stylesheet glide in this runner, so the jump is a teleport.
    expect(Math.abs(window.scrollY - plan.landings[4])).toBeLessThanOrEqual(2);
    await nextFrame();
    await nextFrame();
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(ids[4]);
  });

  it('the load-time hash: a short last card the stylesheet could only park at the page’s end is re-landed too', async () => {
    // The stylesheet's landing for the last card lies past the page's end,
    // so the browser's jump rests AT the end with the card below its line —
    // "below that with the page at its end", the rule's second half.
    const ids = buildReadingPage(READING_PAGE);
    const end = maxScrollY();
    expect(documentTop(ids[5]) - PADDING - MARGIN).toBeGreaterThan(end);
    await scrollToY(end);
    window.history.replaceState(null, '', `#${ids[5]}`);
    const spy = makeSpy({ ids, line: 'reading' });
    const { plan } = expected(ids);

    spy.start();

    expect(Math.abs(window.scrollY - plan.landings[5])).toBeLessThanOrEqual(2);
    expect(window.scrollY).toBeLessThan(end - 2);
  });

  /** The navigation that brought this document, as Navigation Timing reports
   *  it — the spy reads it to tell a link followed from a restored position
   *  (THE READING LINE's stale load-time jump). PINNED to a fresh navigation
   *  for every test of this block (the beforeEach below): the runner's own
   *  page happens to be one, and a test that means otherwise says so. Restored
   *  by the suite's afterEach. */
  function navigationIs(type: NavigationTimingType): void {
    vi.spyOn(performance, 'getEntriesByType').mockImplementation((kind) =>
      kind === 'navigation'
        ? [{ type } as unknown as PerformanceNavigationTiming]
        : [],
    );
  }

  beforeEach(() => {
    navigationIs('navigate');
  });

  /** A load-time pin on the fourth target resting a few pixels OFF its
   *  landing — the stale jump the G2 round measured (4 to 56px) — and off the
   *  stylesheet's line too, so only the stale finish could land it. */
  async function parkedNearTheLanding(): Promise<
    Readonly<{ ids: readonly string[]; landing: number; parked: number }>
  > {
    const ids = buildReadingPage(READING_PAGE);
    const landing = Math.round(expected(ids).plan.landings[4]);
    const parked = landing + 40;
    const stylesheetLanding = Math.round(
      documentTop(ids[4]) - PADDING - MARGIN,
    );
    expect(Math.abs(parked - stylesheetLanding)).toBeGreaterThan(2);
    await scrollToY(parked);
    expect(window.scrollY).toBe(parked);
    window.history.replaceState(null, '', `#${ids[4]}`);
    return { ids, landing, parked };
  }

  for (const restored of ['reload', 'back_forward'] as const) {
    it(`the load-time hash: a page RESTORED — a ${restored} — is not moved, even a few pixels off its landing; its pin is handed to the walk after two windows`, async () => {
      // A reload or a Back restores the old position instead of jumping: that
      // page is not where the browser's jump would have put the target, so the
      // spy leaves it alone and the pin's own check does the rest (THE START
      // GRACE: a page that never moved is judged at the second window).
      // Parked NEAR the landing — in the clear area, focus on nothing — so that
      // only the navigation's type keeps it from the stale finish.
      navigationIs(restored);
      const { ids, parked } = await parkedNearTheLanding();
      const spy = makeSpy({ ids, line: 'reading' });

      spy.start();

      expect(spy.getSnapshot().current).toBe(ids[4]);
      vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);
      expect(window.scrollY).toBe(parked);
      const { frame, plan } = expected(ids);
      expect(spy.getSnapshot().current).toBe(
        ids[readingIndex(frame, plan, parked)],
      );
    });
  }

  it('THE LOAD-TIME JUMP THAT WENT STALE: on a FRESH navigation, a load-time pin resting a few pixels off its landing is landed at the settle — never by start() — and then holds', async () => {
    // Measured on the built price page (2026-10-10): Chromium's smooth
    // fragment jump at load is not re-aimed when a late webfont reflows the
    // page under it, and leaves the card 4–56px off its landing — with
    // JavaScript off too. The settle, the one moment the page has provably
    // stopped, lands it where the plan says. RE-DERIVED in the G2 round: the
    // page used to be parked at 1000px, 754px off and the card below the
    // window — a page the BOUNDED finish now rightly leaves alone (the
    // visitor has moved on); 40px off, the card in the clear area, is the
    // stale jump it exists for.
    const { ids, landing, parked } = await parkedNearTheLanding();
    const spy = makeSpy({ ids, line: 'reading' });

    spy.start();

    // start() leaves the page alone: a scroll before the browser's own jump
    // would cost the page that jump.
    expect(window.scrollY).toBe(parked);
    // The start grace's two windows, then the finish (a teleport in this
    // runner, which glides nothing)…
    vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);
    expect(Math.abs(window.scrollY - landing)).toBeLessThanOrEqual(2);
    // …whose own scroll event re-arms the settle, which finds it arrived.
    await nextFrame();
    await nextFrame();
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(ids[4]);
  });

  it('…but not before the document has LOADED: while it still loads, the settle keeps the pin and looks again', async () => {
    // A webfont still to come would move the target again (preloaded fonts
    // hold the load event back), so the finish waits for it.
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('interactive');
    const { ids, landing, parked } = await parkedNearTheLanding();
    const spy = makeSpy({ ids, line: 'reading' });

    spy.start();
    vi.advanceTimersByTime(6 * DEFAULT_SETTLE_MS);

    expect(window.scrollY).toBe(parked);
    expect(spy.getSnapshot().current).toBe(ids[4]);

    // Loaded: now it is judged — the start grace's one window for a page that
    // never moved, then the finish.
    readyState.mockReturnValue('complete');
    vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);

    expect(Math.abs(window.scrollY - landing)).toBeLessThanOrEqual(2);
  });

  it('…and a pin that had ARRIVED before the load is judged after it: a late reflow that moved its FITTING card 30px off the landing is still finished', async () => {
    // Measured on the built page: the browser's short glide to the second
    // card had ended — on its landing — when the webfont, 1200ms late,
    // reflowed the page under it, and no scroll event followed. Judged before
    // the load, that pin would have been ARRIVED, and the card left off. The
    // BOUNDED finish still lands it: the card is in the clear area, and the
    // page never moved (the reflow moved the card, not the page).
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('interactive');
    const ids = buildReadingPage(READING_PAGE);
    await scrollToY(Math.round(expected(ids).plan.landings[4]));
    window.history.replaceState(null, '', `#${ids[4]}`);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    vi.advanceTimersByTime(3 * DEFAULT_SETTLE_MS);

    // The webfont arrives: a card above grows 30px, the target with it — with
    // no scroll anchoring to follow it, as in WebKit, which has none (and as on
    // the real page in Chromium, whose anchor did not hold the card: 20px off).
    document.documentElement.style.overflowAnchor = 'none';
    try {
      target(ids[1]).style.height = `${READING_PAGE.heights[1] + 30}px`;
      await nextFrame();
      await nextFrame();
      const { plan } = expected(ids);
      expect(Math.abs(window.scrollY - plan.landings[4])).toBeGreaterThan(2);

      readyState.mockReturnValue('complete');
      vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);

      expect(Math.abs(window.scrollY - plan.landings[4])).toBeLessThanOrEqual(
        2,
      );
      await nextFrame();
      await nextFrame();
      vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
      expect(spy.getSnapshot().current).toBe(ids[4]);
    } finally {
      document.documentElement.style.overflowAnchor = '';
    }
  });

  it('…and a CLICK’s pin is never finished this way — after the load-time one, a select() resting a few pixels off its landing is handed to the walk', async () => {
    const ids = buildReadingPage(READING_PAGE);
    const parked = Math.round(expected(ids).plan.landings[1]) + 40;
    await scrollToY(parked);
    window.history.replaceState(null, '', `#${ids[4]}`);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();

    // A click on another target before the load-time pin was judged: that
    // pin is no longer the URL's, and the page — left 40px off the clicked
    // card's landing, in the clear area — has not arrived. The start grace's
    // two windows, then the walk.
    spy.select(ids[1]);
    vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);

    expect(window.scrollY).toBe(parked);
    const { frame, plan } = expected(ids);
    expect(spy.getSnapshot().current).toBe(
      ids[readingIndex(frame, plan, parked)],
    );
  });

  // ── BOUNDED (G2, 2026-10-10): a visitor who moved on is never pulled back.

  it('BOUNDED: the visitor moved the page 1500px on and focus to another control before the load — the page is NOT moved after it', async () => {
    // The G2 reviewers measured the unbounded finish pulling such a page
    // 5660px back (Chromium) and 4410px (WebKit): a Tab's focus scroll, an
    // iPhone's status-bar tap, VoiceOver's three-finger scroll — none of them
    // a wheel, a touch or a key this spy hears.
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('interactive');
    const { ids, parked } = await parkedNearTheLanding();
    const elsewhere = document.createElement('button');
    host?.append(elsewhere);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);

    elsewhere.focus();
    await scrollToY(parked - 1_500);
    const away = window.scrollY;
    vi.advanceTimersByTime(3 * DEFAULT_SETTLE_MS);
    readyState.mockReturnValue('complete');
    vi.advanceTimersByTime(4 * DEFAULT_SETTLE_MS);

    expect(window.scrollY).toBe(away);
  });

  it('BOUNDED: a page already AWAY from the card when the spy starts — the card below the window, focus on nothing — is not pulled to it', async () => {
    // The visitor scrolled before the island hydrated (or the browser's jump
    // never happened): the page never moves while the spy watches, so only
    // the clear area keeps the finish from yanking it 754px down.
    const ids = buildReadingPage(READING_PAGE);
    await scrollToY(1_000);
    expect(
      target(ids[4]).getBoundingClientRect().top,
      'the premise: the card lies below the window',
    ).toBeGreaterThan(window.innerHeight);
    window.history.replaceState(null, '', `#${ids[4]}`);
    const spy = makeSpy({ ids, line: 'reading' });

    spy.start();
    vi.advanceTimersByTime(4 * DEFAULT_SETTLE_MS);

    expect(window.scrollY).toBe(1_000);
    expect(spy.getSnapshot().current).not.toBe(ids[4]);
  });

  it('BOUNDED: the page moved back to the TOP during the load stays at the top — the card out of the clear area is not pulled back', async () => {
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('interactive');
    const { ids } = await parkedNearTheLanding();
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);

    await scrollToY(0);
    vi.advanceTimersByTime(3 * DEFAULT_SETTLE_MS);
    readyState.mockReturnValue('complete');
    vi.advanceTimersByTime(4 * DEFAULT_SETTLE_MS);

    expect(window.scrollY).toBe(0);
  });

  it('BOUNDED: a page that left the card DURING the wait drops the pin once it has STOPPED there — two quiet windows in a row — the walk answers, the mark follows what the visitor sees', async () => {
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('interactive');
    const { ids } = await parkedNearTheLanding();
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(ids[4]);

    // Still loading: the page goes back up to the first cards and stops.
    await scrollToY(0);
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current, 'one quiet window is no stop').toBe(
      ids[4],
    );
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);

    const { frame, plan } = expected(ids);
    expect(spy.getSnapshot().current).toBe(ids[readingIndex(frame, plan, 0)]);
    expect(spy.getSnapshot().current).not.toBe(ids[4]);
  });

  it('BOUNDED: a focus that LEFT the card ends the claim for good — even with focus back on nothing and the card still in view, the page is not moved', async () => {
    // A Tab to the footer and a press on the page's own ground (focus back on
    // the body): the visitor has moved on, though the card is still on screen.
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('interactive');
    const { ids, parked } = await parkedNearTheLanding();
    const elsewhere = document.createElement('button');
    host?.append(elsewhere);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();

    // Without scrolling to it: the card must stay in view, so that only the
    // focus rule keeps the page where it is.
    elsewhere.focus({ preventScroll: true });
    elsewhere.blur();
    expect(document.activeElement).toBe(document.body);
    readyState.mockReturnValue('complete');
    vi.advanceTimersByTime(4 * DEFAULT_SETTLE_MS);

    expect(window.scrollY).toBe(parked);
  });

  it('BOUNDED: focus already elsewhere when the spy starts — moved before the island hydrated — keeps the page where it is', async () => {
    const { ids, parked } = await parkedNearTheLanding();
    const elsewhere = document.createElement('button');
    host?.append(elsewhere);
    elsewhere.focus({ preventScroll: true });
    const spy = makeSpy({ ids, line: 'reading' });

    spy.start();
    vi.advanceTimersByTime(4 * DEFAULT_SETTLE_MS);

    expect(document.activeElement).toBe(elsewhere);
    expect(window.scrollY).toBe(parked);
  });

  it('THE CEILING: a load that never completes stops being waited for after LOAD_WAIT_CEILING_MS — the pin is judged, and the stale jump finished', async () => {
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('interactive');
    const { ids, landing, parked } = await parkedNearTheLanding();
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();

    vi.advanceTimersByTime(LOAD_WAIT_CEILING_MS - DEFAULT_SETTLE_MS);
    expect(window.scrollY).toBe(parked);
    expect(spy.getSnapshot().current).toBe(ids[4]);

    vi.advanceTimersByTime(3 * DEFAULT_SETTLE_MS);
    expect(Math.abs(window.scrollY - landing)).toBeLessThanOrEqual(2);
  });

  it('BOUNDED: a LONG TASK mid-glide during the load — 200ms without a scroll event — is no stop: the pin holds through it, and the glide arrives', async () => {
    // G2 typescript (2026-10-10): one quiet window used to decide "stopped",
    // and a long task holding the glide's scroll events back faked one — the
    // card still below the window, the pin dropped mid-glide.
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('interactive');
    const ids = buildReadingPage(READING_PAGE);
    const landing = Math.round(expected(ids).plan.landings[4]);
    window.history.replaceState(null, '', `#${ids[4]}`);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();

    // The browser's glide to the card: a few steps down…
    await scrollToY(120);
    await scrollToY(240);
    expect(
      target(ids[4]).getBoundingClientRect().top,
      'the premise: the card still below the window',
    ).toBeGreaterThan(window.innerHeight);
    // …then a long task: no scroll event for 200ms.
    vi.advanceTimersByTime(200);
    expect(spy.getSnapshot().current).toBe(ids[4]);
    // The glide goes on, still short of the card, and a SECOND long task
    // comes: the first one's quiet window must not count towards it.
    await scrollToY(360);
    await scrollToY(480);
    expect(target(ids[4]).getBoundingClientRect().top).toBeGreaterThan(
      window.innerHeight,
    );
    vi.advanceTimersByTime(200);
    expect(spy.getSnapshot().current).toBe(ids[4]);

    // The glide resumes, and arrives; the document loads.
    await scrollToY(Math.round((480 + landing) / 2));
    await scrollToY(landing);
    readyState.mockReturnValue('complete');
    vi.advanceTimersByTime(3 * DEFAULT_SETTLE_MS);

    expect(window.scrollY).toBe(landing);
    expect(spy.getSnapshot().current).toBe(ids[4]);
  });

  it('BOUNDED: a page moved 900px WITHIN a card taller than the clear area before the load — a screen reader reading down it — is not pulled back after it (STALE_FINISH_REACH)', async () => {
    // G2 a11y (2026-10-10): a card taller than the clear area passes the
    // clear-area test across a scroll as long as itself — four price cards
    // pass 1000px on a phone whose clear area is 690px — so only the distance
    // from the landing tells a reader from a stale jump (4 to 56px, measured).
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('interactive');
    const ids = buildReadingPage(READING_PAGE);
    const landing = Math.round(expected(ids).plan.landings[3]);
    await scrollToY(landing);
    window.history.replaceState(null, '', `#${ids[3]}`);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);

    await scrollToY(landing + 900);
    const read = window.scrollY;
    expect(read).toBe(landing + 900);
    const card = target(ids[3]).getBoundingClientRect();
    expect(card.bottom, 'the premise: still in the clear area').toBeGreaterThan(
      PADDING,
    );
    expect(card.top).toBeLessThan(window.innerHeight);
    expect(900).toBeGreaterThan(STALE_FINISH_REACH * window.innerHeight);
    vi.advanceTimersByTime(3 * DEFAULT_SETTLE_MS);
    readyState.mockReturnValue('complete');
    vi.advanceTimersByTime(4 * DEFAULT_SETTLE_MS);

    expect(window.scrollY).toBe(read);
  });

  it('…but a page that has NOT MOVED since it rested near its landing — the LAYOUT moved under it, by more than a quarter of a window — is finished from any distance (UNMOVED: WebKit, no scroll anchoring, 378px measured)', async () => {
    // The round's own e2e (2026-10-10): WebKit jumped to #oral-surgery before
    // the webfont arrived, and the reflow left the card 378px off with the
    // page never moving again; the quarter window alone refused to finish it.
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('interactive');
    const ids = buildReadingPage(READING_PAGE);
    const landing = Math.round(expected(ids).plan.landings[4]);
    await scrollToY(landing);
    window.history.replaceState(null, '', `#${ids[4]}`);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);

    // The webfont arrives: a card above grows by 400px — with no scroll
    // anchoring (WebKit has none), so the page stays and the card moves.
    document.documentElement.style.overflowAnchor = 'none';
    try {
      target(ids[1]).style.height = `${READING_PAGE.heights[1] + 400}px`;
      await nextFrame();
      await nextFrame();
      expect(window.scrollY, 'the premise: the page never moved').toBe(landing);
      const { plan } = expected(ids);
      expect(Math.abs(window.scrollY - plan.landings[4])).toBeGreaterThan(
        STALE_FINISH_REACH * window.innerHeight,
      );
      expect(
        target(ids[4]).getBoundingClientRect().top,
        'the premise: still in the clear area',
      ).toBeLessThan(window.innerHeight);

      readyState.mockReturnValue('complete');
      vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);

      expect(Math.abs(window.scrollY - plan.landings[4])).toBeLessThanOrEqual(
        2,
      );
    } finally {
      document.documentElement.style.overflowAnchor = '';
    }
  });

  it('…UNMOVED counts from where the page last RESTED near its landing — a browser jump that came after the island started, then the reflow under it', async () => {
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('interactive');
    const ids = buildReadingPage(READING_PAGE);
    const landing = Math.round(expected(ids).plan.landings[4]);
    window.history.replaceState(null, '', `#${ids[4]}`);
    const spy = makeSpy({ ids, line: 'reading' });
    // The island starts at the top: the browser has not jumped yet…
    spy.start();
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    // …then it does, and comes to rest on the landing.
    await scrollToY(landing);
    vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);

    document.documentElement.style.overflowAnchor = 'none';
    try {
      target(ids[1]).style.height = `${READING_PAGE.heights[1] + 400}px`;
      await nextFrame();
      await nextFrame();
      expect(window.scrollY).toBe(landing);
      const { plan } = expected(ids);
      expect(Math.abs(window.scrollY - plan.landings[4])).toBeGreaterThan(
        STALE_FINISH_REACH * window.innerHeight,
      );

      readyState.mockReturnValue('complete');
      vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);

      expect(Math.abs(window.scrollY - plan.landings[4])).toBeLessThanOrEqual(
        2,
      );
    } finally {
      document.documentElement.style.overflowAnchor = '';
    }
  });

  it('…and UNMOVED skips the clear area too: a reflow that pushed the card OUT of the window under a page that never moved is finished (WebKit: 587, 917 and 1211px, 3 of 24 loads of a probe)', async () => {
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('interactive');
    const ids = buildReadingPage(READING_PAGE);
    const landing = Math.round(expected(ids).plan.landings[4]);
    await scrollToY(landing);
    window.history.replaceState(null, '', `#${ids[4]}`);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);

    document.documentElement.style.overflowAnchor = 'none';
    try {
      const push = window.innerHeight + 200;
      target(ids[1]).style.height = `${READING_PAGE.heights[1] + push}px`;
      await nextFrame();
      await nextFrame();
      expect(window.scrollY, 'the premise: the page never moved').toBe(landing);
      expect(
        target(ids[4]).getBoundingClientRect().top,
        'the premise: the card pushed out of the window',
      ).toBeGreaterThanOrEqual(window.innerHeight);

      readyState.mockReturnValue('complete');
      vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);

      const { plan } = expected(ids);
      expect(Math.abs(window.scrollY - plan.landings[4])).toBeLessThanOrEqual(
        2,
      );
    } finally {
      document.documentElement.style.overflowAnchor = '';
    }
  });

  it('…but a page that HAS MOVED, its card out of the clear area, is not finished — the visitor moved on', async () => {
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('interactive');
    const ids = buildReadingPage(READING_PAGE);
    const landing = Math.round(expected(ids).plan.landings[4]);
    await scrollToY(landing);
    window.history.replaceState(null, '', `#${ids[4]}`);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);

    // Loaded — and before the next settle the page goes back up to the first
    // cards, the pinned card below the window.
    readyState.mockReturnValue('complete');
    await scrollToY(0);
    expect(target(ids[4]).getBoundingClientRect().top).toBeGreaterThanOrEqual(
      window.innerHeight,
    );
    vi.advanceTimersByTime(3 * DEFAULT_SETTLE_MS);

    expect(window.scrollY).toBe(0);
  });

  it('…and for a MOVED page the clear area still decides, even within the quarter window: a short last card a small move after the load pushed below the window is not finished', async () => {
    // The one geometry where the two bounds part: a short card resting at the
    // page's end, a move of 130px — inside the quarter window — hides it.
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('interactive');
    const ids = buildReadingPage({ heights: [400, 400, 400, 120] });
    const last = ids.length - 1;
    const landing = Math.round(expected(ids).plan.landings[last]);
    await scrollToY(landing);
    expect(
      target(ids[last]).getBoundingClientRect().bottom,
      'the premise: the card shows at its landing',
    ).toBeLessThanOrEqual(window.innerHeight);
    window.history.replaceState(null, '', `#${ids[last]}`);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);

    readyState.mockReturnValue('complete');
    await scrollToY(landing - 130);
    expect(130).toBeLessThan(STALE_FINISH_REACH * window.innerHeight);
    expect(
      target(ids[last]).getBoundingClientRect().top,
      'the premise: the move hid the card',
    ).toBeGreaterThanOrEqual(window.innerHeight);
    vi.advanceTimersByTime(3 * DEFAULT_SETTLE_MS);

    expect(window.scrollY).toBe(landing - 130);
  });

  it('…and FOCUS is required ALWAYS: an UNMOVED page whose card a reflow moved off its landing is not finished while focus is elsewhere', async () => {
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('interactive');
    const ids = buildReadingPage(READING_PAGE);
    const landing = Math.round(expected(ids).plan.landings[4]);
    await scrollToY(landing);
    window.history.replaceState(null, '', `#${ids[4]}`);
    // Focus moved before the island hydrated: no focusin for the spy to hear,
    // so only the finish's own focus rule keeps the page where it is.
    const elsewhere = document.createElement('button');
    host?.append(elsewhere);
    elsewhere.focus({ preventScroll: true });
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);

    document.documentElement.style.overflowAnchor = 'none';
    try {
      target(ids[1]).style.height = `${READING_PAGE.heights[1] + 400}px`;
      await nextFrame();
      await nextFrame();
      expect(window.scrollY).toBe(landing);

      readyState.mockReturnValue('complete');
      vi.advanceTimersByTime(3 * DEFAULT_SETTLE_MS);

      expect(document.activeElement).toBe(elsewhere);
      expect(window.scrollY).toBe(landing);
    } finally {
      document.documentElement.style.overflowAnchor = '';
    }
  });

  it('THE HYBRID: a page already AWAY at start, its card still IN VIEW — a webfont reflow before the island hydrated (WebKit) — is finished from beyond the quarter window', async () => {
    // The start's rest point for a page away skips only the distance bound;
    // the AWAY-at-start test above keeps the clear area (its card below the
    // window). Without it the WebKit SLOW LOAD e2e passed 1 run in 4.
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('interactive');
    const ids = buildReadingPage(READING_PAGE);
    const landing = Math.round(expected(ids).plan.landings[4]);
    await scrollToY(landing);
    window.history.replaceState(null, '', `#${ids[4]}`);
    document.documentElement.style.overflowAnchor = 'none';
    try {
      // The reflow BEFORE start: the card 400px below its landing, in view.
      target(ids[1]).style.height = `${READING_PAGE.heights[1] + 400}px`;
      await nextFrame();
      await nextFrame();
      expect(window.scrollY).toBe(landing);
      const { plan } = expected(ids);
      expect(Math.abs(window.scrollY - plan.landings[4])).toBeGreaterThan(
        STALE_FINISH_REACH * window.innerHeight,
      );
      expect(target(ids[4]).getBoundingClientRect().top).toBeLessThan(
        window.innerHeight,
      );
      const spy = makeSpy({ ids, line: 'reading' });
      spy.start();

      readyState.mockReturnValue('complete');
      vi.advanceTimersByTime(3 * DEFAULT_SETTLE_MS);

      expect(Math.abs(window.scrollY - plan.landings[4])).toBeLessThanOrEqual(
        2,
      );
    } finally {
      document.documentElement.style.overflowAnchor = '';
    }
  });

  for (const loading of [false, true] as const) {
    it(`THE HYBRID'S DIRECTION: a reader 900px DOWN the tall card before the island hydrated, focus on the card${loading ? ', the document still loading' : ', the document already loaded'} — is not pulled back (the page sits BELOW the landing)`, async () => {
      // G2 react (2026-10-10): a start rest point for a page away, card in
      // view, pulled such a reader back to the card's top — 900px in WebKit.
      const readyState = vi
        .spyOn(document, 'readyState', 'get')
        .mockReturnValue(loading ? 'interactive' : 'complete');
      const ids = buildReadingPage(READING_PAGE);
      const landing = Math.round(expected(ids).plan.landings[3]);
      await scrollToY(landing + 900);
      const read = window.scrollY;
      expect(read).toBe(landing + 900);
      window.history.replaceState(null, '', `#${ids[3]}`);
      target(ids[3]).tabIndex = -1;
      target(ids[3]).focus({ preventScroll: true });
      expect(
        target(ids[3]).getBoundingClientRect().bottom,
        'the premise: the card still in view',
      ).toBeGreaterThan(PADDING);
      const spy = makeSpy({ ids, line: 'reading' });
      spy.start();
      vi.advanceTimersByTime(3 * DEFAULT_SETTLE_MS);
      readyState.mockReturnValue('complete');
      vi.advanceTimersByTime(4 * DEFAULT_SETTLE_MS);

      expect(document.activeElement).toBe(target(ids[3]));
      expect(window.scrollY).toBe(read);
    });
  }

  for (const jump of ['after start()', 'before start()'] as const) {
    it(`STEP 0 KEEPS A PIN STILL AT ITS REST POINT (the browser's jump ${jump}): a reflow that pushes the card OUT of the window settles before the load is no stop — the UNMOVED finish lands it after the load`, async () => {
      // G2 typescript (2026-10-10, its H5): step 0's "moved" meant ever, the
      // finish means since the last rest point within reach — and step 0
      // dropped the very pin the finish exists to land.
      const readyState = vi
        .spyOn(document, 'readyState', 'get')
        .mockReturnValue('interactive');
      const ids = buildReadingPage(READING_PAGE);
      const landing = Math.round(expected(ids).plan.landings[4]);
      window.history.replaceState(null, '', `#${ids[4]}`);
      if (jump === 'before start()') await scrollToY(landing);
      const spy = makeSpy({ ids, line: 'reading' });
      spy.start();
      vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
      if (jump === 'after start()') await scrollToY(landing);
      vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);
      expect(spy.getSnapshot().current).toBe(ids[4]);

      document.documentElement.style.overflowAnchor = 'none';
      try {
        target(ids[1]).style.height =
          `${READING_PAGE.heights[1] + window.innerHeight + 200}px`;
        await nextFrame();
        await nextFrame();
        expect(window.scrollY, 'the premise: the page never moved').toBe(
          landing,
        );
        expect(
          target(ids[4]).getBoundingClientRect().top,
          'the premise: the card out of the window',
        ).toBeGreaterThanOrEqual(window.innerHeight);
        // A later resource still holds the load: three more settles.
        vi.advanceTimersByTime(3 * DEFAULT_SETTLE_MS);
        expect(spy.getSnapshot().current).toBe(ids[4]);
        readyState.mockReturnValue('complete');
        vi.advanceTimersByTime(3 * DEFAULT_SETTLE_MS);

        const { plan } = expected(ids);
        expect(Math.abs(window.scrollY - plan.landings[4])).toBeLessThanOrEqual(
          2,
        );
      } finally {
        document.documentElement.style.overflowAnchor = '';
      }
    });
  }

  it('dispose() of a WAITING fresh pin takes EVERY listener with it — the very functions start() attached — and every timer, its ceiling’s included', async () => {
    // G2 typescript (2026-10-10): before this test, deleting dispose()'s
    // endLoadWait(), its focusin removal or its keydown removal survived the
    // whole suite.
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('interactive');
    const { ids } = await parkedNearTheLanding();
    const added = vi.spyOn(window, 'addEventListener');
    const removed = vi.spyOn(window, 'removeEventListener');
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    // Waiting for the load: the pin's settle and its ceiling.
    expect(vi.getTimerCount()).toBe(2);

    spy.dispose();

    expect(vi.getTimerCount()).toBe(0);
    expect(
      added.mock.calls
        .map(([type]) => String(type))
        .sort((a, b) => a.localeCompare(b)),
    ).toEqual([
      'focusin',
      'hashchange',
      'keydown',
      'resize',
      'scroll',
      'touchmove',
      'touchstart',
      'wheel',
    ]);
    const unpaired = added.mock.calls
      .filter(
        ([type, listener]) =>
          !removed.mock.calls.some(
            ([gone, fn]) => gone === type && fn === listener,
          ),
      )
      .map(([type]) => String(type));
    expect(unpaired).toEqual([]);
  });

  it('start() leaves a fresh load-time pin resting on its STYLESHEET line alone while the document still loads — the settle after the load finishes it, once', async () => {
    // G2 react and typescript (2026-10-10): finished at start(), with the
    // webfont still to come, the jump was spent on a layout about to change —
    // fitting cards 10 to 20px off with the scripts 700ms late.
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('interactive');
    const ids = buildReadingPage(READING_PAGE);
    const scrolls = vi.spyOn(Element.prototype, 'scrollIntoView');
    const stylesheetLanding = Math.round(
      documentTop(ids[4]) - PADDING - MARGIN,
    );
    await scrollToY(stylesheetLanding);
    window.history.replaceState(null, '', `#${ids[4]}`);
    const spy = makeSpy({ ids, line: 'reading' });
    const { plan } = expected(ids);

    spy.start();
    expect(scrolls).not.toHaveBeenCalled();
    expect(window.scrollY).toBe(stylesheetLanding);

    readyState.mockReturnValue('complete');
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(scrolls).toHaveBeenCalledTimes(1);
    expect(Math.abs(window.scrollY - plan.landings[4])).toBeLessThanOrEqual(2);
  });

  // THE JUMP THAT DID NOT KNOW THE PLAN (the header's THE ONE SCROLL THIS
  // MODULE MAKES; planner's amendment, 2026-09-29). Chromium GLIDES to the
  // fragment at load, the island hydrates mid-glide, and the glide ends on
  // the STYLESHEET's line — the browser fixed its destination before any
  // margin was written. The settle is where the spy catches it.

  /**
   * That glide, replayed: `#reading-4` in the URL, the island hydrating while
   * the page is still at 1000px — the glide in flight — then real scroll
   * events carrying the page onto the fourth card's stylesheet line, where it
   * comes to rest. No settle has fired yet when it hands back.
   */
  async function glideOntoTheStylesheetLine(): Promise<
    Readonly<{
      ids: readonly string[];
      spy: ScrollSpy;
      frame: ReadingFrame;
      plan: ReadingPlan;
      stylesheetLanding: number;
      scrolls: MockInstance<Element['scrollIntoView']>;
    }>
  > {
    const ids = buildReadingPage(READING_PAGE);
    const scrolls = vi.spyOn(Element.prototype, 'scrollIntoView');
    const stylesheetLanding = Math.round(
      documentTop(ids[4]) - PADDING - MARGIN,
    );
    await scrollToY(1_000);
    window.history.replaceState(null, '', `#${ids[4]}`);
    const spy = makeSpy({ ids, line: 'reading' });
    const { frame, plan } = expected(ids);
    spy.start();
    await scrollToY(1_500);
    await scrollToY(stylesheetLanding);
    return { ids, spy, frame, plan, stylesheetLanding, scrolls };
  }

  it('HYDRATION MID-GLIDE: a load-time glide that ends on the stylesheet’s line is finished at the settle — and the pin holds on its own card', async () => {
    // The fourth card is SHORTER than line − ceiling, so where the glide ends
    // the walk names its NEIGHBOUR: without the finish the URL would say one
    // card and the mark would sit on the next.
    const { ids, spy, frame, plan, stylesheetLanding, scrolls } =
      await glideOntoTheStylesheetLine();
    expect(readingIndex(frame, plan, stylesheetLanding)).toBe(5);
    // start() found the page still moving and left it; the pin stands.
    expect(scrolls).not.toHaveBeenCalled();
    expect(spy.getSnapshot().current).toBe(ids[4]);

    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);

    expect(scrolls).toHaveBeenCalledTimes(1);
    expect(Math.abs(window.scrollY - plan.landings[4])).toBeLessThanOrEqual(2);
    // The finishing scroll's own event re-arms, and the next settle finds
    // the target arrived: the pin holds, with nothing left to wait for.
    await nextFrame();
    await nextFrame();
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(ids[4]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('ONCE PER PIN: a page carried back onto the stylesheet’s line after the spy’s own scroll is not scrolled again — the pin is dropped and the walk answers', async () => {
    const { ids, spy, stylesheetLanding, scrolls } =
      await glideOntoTheStylesheetLine();
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(scrolls).toHaveBeenCalledTimes(1);

    // Before the next settle, something that is not the visitor — no wheel,
    // no touch, no key — carries the page back onto the stylesheet's line. A
    // second scroll would only fight it.
    await scrollToY(stylesheetLanding);
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);

    expect(scrolls).toHaveBeenCalledTimes(1);
    expect(window.scrollY).toBe(stylesheetLanding);
    expect(spy.getSnapshot().current).toBe(ids[5]);
  });

  it('a select() renews it — a second pin may be finished once more', async () => {
    const { ids, spy, plan, stylesheetLanding, scrolls } =
      await glideOntoTheStylesheetLine();
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    await scrollToY(stylesheetLanding);
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    // The first pin, finished once and then dropped.
    expect(spy.getSnapshot().current).toBe(ids[5]);

    spy.select(ids[4]);
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);

    expect(scrolls).toHaveBeenCalledTimes(2);
    expect(Math.abs(window.scrollY - plan.landings[4])).toBeLessThanOrEqual(2);
    await nextFrame();
    await nextFrame();
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(ids[4]);
  });

  /** A page whose second and third cards already sit ABOVE their stylesheet
   *  line at scroll 0 — the browser's own jump to either could only stop at
   *  scroll 0, and the plan lands both lower. */
  const CLAMPED_PAGE = {
    heights: [60, 60, 400, 1_400, 300, 200],
    outro: 400,
  } as const;

  it('the jump the browser CLAMPED at scroll 0 — a card above its stylesheet line with the page at its start — is finished too', async () => {
    const ids = buildReadingPage(CLAMPED_PAGE);
    window.history.replaceState(null, '', `#${ids[1]}`);
    const spy = makeSpy({ ids, line: 'reading' });
    const { plan } = expected(ids);
    expect(window.scrollY).toBe(0);
    expect(target(ids[1]).getBoundingClientRect().top).toBeLessThan(
      PADDING + MARGIN - 2,
    );
    expect(plan.landings[1]).toBeGreaterThan(2);

    spy.start();

    expect(Math.abs(window.scrollY - plan.landings[1])).toBeLessThanOrEqual(2);
    await nextFrame();
    await nextFrame();
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(ids[1]);
  });

  it('the landing line never calls scrollIntoView, whatever the page rests on', async () => {
    // The one scroll belongs to the reading line alone: the landing line owns
    // no margin, so there is no plan for a jump to have missed.
    const scrolls = vi.spyOn(Element.prototype, 'scrollIntoView');
    const ids = buildReadingPage(CLAMPED_PAGE);
    const spies = [makeSpy({ ids }), makeSpy({ ids, line: 'landing' })];

    // Resting ON a card's stylesheet line, with that card in the URL…
    await scrollToY(Math.round(documentTop(ids[4]) - PADDING - MARGIN));
    window.history.replaceState(null, '', `#${ids[4]}`);
    for (const spy of spies) spy.start();
    vi.advanceTimersByTime(3 * DEFAULT_SETTLE_MS);
    // …and at the page's start, pinned to a card above its stylesheet line.
    await scrollToY(0);
    for (const spy of spies) spy.select(ids[1]);
    vi.advanceTimersByTime(3 * DEFAULT_SETTLE_MS);

    expect(scrolls).not.toHaveBeenCalled();
  });

  it('above the first target the plan answers −1, and THE TOP FALLBACK makes it the first target on this line too', () => {
    // A 1500px intro keeps the first card far under the line at scroll 0,
    // where lib/reading-line's index is −1 — the premise, checked, so that
    // the first card here is the fallback's answer and not the plan's.
    const page = { heights: [150, 150, 400], intro: 1_500, outro: 1_500 };
    const ids = buildReadingPage(page);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    const { frame, plan } = expected(ids);

    expect(window.scrollY).toBe(0);
    expect(readingIndex(frame, plan, 0)).toBe(-1);
    expect(spy.getSnapshot().current).toBe(ids[0]);
  });

  it('a window with no height keeps the answer it had instead of throwing from a listener', async () => {
    // planReadingLine refuses a viewport of 0 — a collapsed frame has no clear
    // area to find the middle of — so the evaluation stands still rather than
    // throw inside a scroll or resize listener.
    const ids = buildReadingPage(READING_PAGE);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    await scrollToY(Math.round(expected(ids).plan.landings[3]));
    const before = spy.getSnapshot();
    expect(before.current).toBe(ids[3]);

    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(0);
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('scroll'));

    expect(spy.getSnapshot()).toBe(before);
  });

  // ── THE REFRESH (the header; owner 2026-10-09 — the price strip): a consumer
  // that rewrites what the spy measures against — the price menu's island,
  // writing the root's scroll-padding-top while its strip is shown — asks the
  // spy to measure again, with no resize to say so.

  /** The plan lib/reading-line makes of the page at `padding` — the header's
   *  `expected`, with the root's scroll padding as a parameter. */
  const plannedAt = (ids: readonly string[], padding: number): ReadingPlan =>
    planReadingLine({
      viewport: window.innerHeight,
      maxScrollY: maxScrollY(),
      padding,
      targets: ids.map((id) => ({
        top: documentTop(id),
        height: target(id).getBoundingClientRect().height,
        floor: MARGIN,
      })),
    });

  it('refresh() re-plans every landing for a root scroll-padding the consumer just changed — where, without it, the old plan stands', () => {
    const ids = buildReadingPage(READING_PAGE);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    const before = ids.map(writtenOn);
    expect(before).toEqual(
      plannedAt(ids, PADDING).margins.map((margin) => px(margin)),
    );

    // The consumer's write — the strip's pills' bottom edge, 154px.
    document.documentElement.style.scrollPaddingTop = '154px';
    // The premise: nothing re-planned by itself — no scroll, no resize.
    expect(ids.map(writtenOn)).toEqual(before);

    spy.refresh();

    const after = plannedAt(ids, 154);
    expect(ids.map(writtenOn)).toEqual(
      after.margins.map((margin) => px(margin)),
    );
    // …and the plan really moved: a card too tall to centre now rests on the
    // NEW ceiling, 154 + its 40px floor below the top — its margin is the
    // floor still, so the change shows on the cards that fit, centred lower.
    expect(ids.map(writtenOn)).not.toEqual(before);
  });

  it('refresh() re-reads every floor, as a resize does — the stylesheet’s new margin is planned from', () => {
    const ids = buildReadingPage(READING_PAGE);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    expect(writtenOn(ids[3])).toBe(`${MARGIN}px`);

    (sheet as HTMLStyleElement).textContent =
      '.reading-target { scroll-margin-top: 60px; }';
    spy.refresh();

    expect(writtenOn(ids[3])).toBe('60px');
  });

  it('refresh() never drops a pin — the visitor’s choice outranks a re-plan', () => {
    const ids = buildReadingPage(READING_PAGE);
    const spy = makeSpy({ ids, line: 'reading' });
    spy.start();
    spy.select(ids[4]);
    expect(spy.getSnapshot().current).toBe(ids[4]);

    document.documentElement.style.scrollPaddingTop = '154px';
    spy.refresh();

    expect(spy.getSnapshot().current).toBe(ids[4]);
  });

  it('refresh() is a no-op before start() and after dispose() — nothing written, nothing published, no throw', () => {
    const ids = buildReadingPage(READING_PAGE);
    const spy = makeSpy({ ids, line: 'reading' });
    const listener = vi.fn();
    spy.subscribe(listener);

    expect(() => spy.refresh()).not.toThrow();
    for (const id of ids) expect(writtenOn(id)).toBe('');
    expect(spy.getSnapshot().current).toBeNull();

    spy.start();
    spy.dispose();
    listener.mockClear();
    spy.refresh();
    for (const id of ids) expect(writtenOn(id)).toBe('');
    expect(spy.getSnapshot().current).toBeNull();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('createScrollSpy — refresh() on the landing line', () => {
  it('re-walks against the root scroll-padding as it is NOW — a target the new line reaches becomes current without a scroll', async () => {
    const ids = buildPage();
    const spy = makeSpy();
    spy.start();
    // A position where the second target sits 30px BELOW its landing line.
    const y = landingOf(ids[1]) - 30;
    await scrollToY(y);
    expect(spy.getSnapshot().current).toBe(ids[0]);

    // The consumer moves the line 60px down: the second target is past it.
    document.documentElement.style.scrollPaddingTop = `${PADDING + 60}px`;
    expect(spy.getSnapshot().current).toBe(ids[0]);
    spy.refresh();

    expect(window.scrollY).toBe(y);
    expect(spy.getSnapshot().current).toBe(ids[1]);
  });

  it('writes nothing on the landing line — refresh() lifts no margin it never wrote', () => {
    const ids = buildPage();
    const before = ids.map((id) =>
      document.getElementById(id)?.getAttribute('style'),
    );
    const spy = makeSpy();
    spy.start();
    spy.refresh();
    expect(
      ids.map((id) => document.getElementById(id)?.getAttribute('style')),
    ).toEqual(before);
  });
});

describe('createScrollSpy — the pin (both directions, safely)', () => {
  it('marks a selected id at once, even one the walk would never choose', () => {
    buildPage();
    const spy = makeSpy();
    spy.start();
    expect(spy.getSnapshot().current).toBe(IDS[0]);

    spy.select(IDS[3]);

    expect(spy.getSnapshot().current).toBe(IDS[3]);
  });

  it('survives the jump’s own scrolling and the settle that ends it', async () => {
    buildPage();
    const spy = makeSpy();
    spy.start();

    spy.select(IDS[3]);
    // The glide: the browser scrolls, one event per frame, and every one of
    // them re-arms the settle instead of dropping the visitor's choice…
    await scrollToY(landingOf(IDS[1]));
    expect(spy.getSnapshot().current).toBe(IDS[3]);

    // …until it lands where a jump lands, and the settle then finds the
    // target ON its line and keeps the pin (THE PIN VERIFIES ARRIVAL).
    await scrollToY(landingOf(IDS[3]));
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(IDS[3]);
  });

  it('drops a pin whose glide stopped SHORT of its line — a scroll lock, a frozen jump', async () => {
    // Measured on the built page: the contact modal's scroll lock engaging
    // 250ms into a click glide froze the page at y = 2153 with Endodonție on
    // screen and Ortodonție marked; no further scroll event ever came. The
    // settle is the moment scrolling has provably stopped, so it is where the
    // pin is checked against the page (G2 react, Fable, 2026-09-15).
    buildPage();
    const spy = makeSpy();
    spy.start();

    spy.select(IDS[3]);
    await scrollToY(landingOf(IDS[1]));
    expect(spy.getSnapshot().current).toBe(IDS[3]);

    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);

    expect(spy.getSnapshot().current).toBe(IDS[1]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps a pin the browser could not reach but went as far as it could', async () => {
    // A SHORT category before the last: its line lies beyond the document's
    // end, so a jump to it scrolls to the bottom — where the walk's bottom
    // rule would say the LAST target. The settle sees the target still below
    // its line with the page at its end, i.e. arrived as far as it can, and
    // keeps the visitor's choice.
    const ids = buildPage({ heights: [BLOCK, BLOCK, 40, 40] });
    const spy = makeSpy();
    spy.start();

    spy.select(ids[2]);
    await scrollToY(document.documentElement.scrollHeight - window.innerHeight);
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);

    expect(spy.getSnapshot().current).toBe(ids[2]);
  });

  it('drops the pin on the first hand scroll after the settle', async () => {
    buildPage();
    const spy = makeSpy();
    spy.start();

    spy.select(IDS[3]);
    await scrollToY(landingOf(IDS[3]));
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);

    await scrollToY(landingOf(IDS[2]));

    expect(spy.getSnapshot().current).toBe(IDS[2]);
    expect(vi.getTimerCount()).toBe(0);
  });

  /** A pin on the last target, its jump landed and its settle passed — the
   *  page RESTING, `settledY` taken (THE RESIZE KEEPS THE PIN's starting
   *  point). */
  async function settledOnTheLast(): Promise<ScrollSpy> {
    buildPage();
    const spy = makeSpy();
    spy.start();
    spy.select(IDS[3]);
    await scrollToY(landingOf(IDS[3]));
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(IDS[3]);
    expect(vi.getTimerCount()).toBe(0);
    return spy;
  }

  /** The browser moving the page AS PART OF a resize, in the order it does it
   *  (measured on the built price page, 2026-10-10): the page has moved, the
   *  `resize` event comes first, the `scroll` event at the next frame. */
  async function resizeThatMovesThePage(by: number): Promise<void> {
    window.scrollTo(0, window.scrollY + by);
    window.dispatchEvent(new Event('resize'));
    await nextFrame();
    await nextFrame();
  }

  it('THE RESIZE KEEPS THE PIN: a resize that MOVED the page — its scroll event after it — leaves a settled pin where it was', async () => {
    // Mobile-mode Chromium keeps the node at the window's top-centre in place
    // across a rotation: on the price page's 1180×820 touch tablet the page
    // moved 667 → 675px, and the settled pin read that `scroll` as a hand. The
    // move here is UPWARDS, 8px, so a dropped pin would show: the last
    // target's edge then sits below its line and the walk names the one before.
    const spy = await settledOnTheLast();

    await resizeThatMovesThePage(-8);

    expect(spy.getSnapshot().current).toBe(IDS[3]);
    // …and the rest is simply taken again: no settle re-armed, nothing to judge.
    expect(vi.getTimerCount()).toBe(0);
  });

  it('THE LAST PIXELS OF A GLIDE: a settled pin keeps through a 2px trailing step — WebKit ending its smooth scroll in two steps', async () => {
    const spy = await settledOnTheLast();

    await scrollToY(window.scrollY - 2);

    expect(spy.getSnapshot().current).toBe(IDS[3]);
  });

  it('…and drops at the THIRD pixel from where it settled — measured from the settled position, never re-taken, so a slow scrollbar drag still takes it away', async () => {
    const spy = await settledOnTheLast();
    const settled = window.scrollY;

    await scrollToY(settled - 2);
    expect(spy.getSnapshot().current).toBe(IDS[3]);
    await scrollToY(settled - 3);

    expect(spy.getSnapshot().current).toBe(IDS[2]);
  });

  it('…and after that resize, a hand that moves the page past the new rest still drops the pin — at once', async () => {
    const spy = await settledOnTheLast();
    await resizeThatMovesThePage(-8);
    expect(spy.getSnapshot().current).toBe(IDS[3]);

    await scrollToY(landingOf(IDS[2]));

    expect(spy.getSnapshot().current).toBe(IDS[2]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('a resize WHILE the jump still glides changes nothing about the settle — the glide’s next scroll is still the jump’s, and the settle judges as before', async () => {
    buildPage();
    const spy = makeSpy();
    spy.start();
    spy.select(IDS[3]);
    // Mid-glide: the settle armed, no rest taken yet.
    await scrollToY(landingOf(IDS[1]));
    expect(vi.getTimerCount()).toBe(1);

    window.dispatchEvent(new Event('resize'));

    expect(vi.getTimerCount()).toBe(1);
    expect(spy.getSnapshot().current).toBe(IDS[3]);
    // The glide goes on: its next scroll event re-arms the settle, it does not
    // drop the visitor's choice…
    await scrollToY(landingOf(IDS[2]));
    expect(spy.getSnapshot().current).toBe(IDS[3]);
    // …and it lands, where the settle finds the target arrived.
    await scrollToY(landingOf(IDS[3]));
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(IDS[3]);
  });

  it('drops the pin the moment the visitor touches the wheel, mid-glide', async () => {
    // THE CASE THAT FAILED ON THE REAL PAGE before this listener existed: a
    // click on the last category glides for over two seconds, and a wheel
    // turned during that glide arrives as a scroll event indistinguishable
    // from the jump's own — so it re-armed the settle and the abandoned item
    // stayed marked for the whole gesture. A `wheel` event has no such
    // ambiguity: no programmatic scroll produces one.
    buildPage();
    const spy = makeSpy();
    spy.start();

    spy.select(IDS[3]);
    await scrollToY(landingOf(IDS[1]));
    expect(spy.getSnapshot().current).toBe(IDS[3]);

    // Still gliding — the settle has NOT run, which is exactly the state the
    // old code could not escape.
    expect(vi.getTimerCount()).toBe(1);
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: -120 }));

    expect(spy.getSnapshot().current).toBe(IDS[1]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('leaves the pin alone for a key a CONTROL swallowed', async () => {
    // Space on a <button> activates it; it scrolls nothing. Treating that as
    // the visitor scrolling would drop their choice while the page stood still
    // (G2 react, 2026-09-14) — the header's Contact button and the burger are
    // one Tab away from this menu on the real page.
    buildPage();
    const button = document.createElement('button');
    host?.append(button);
    const spy = makeSpy();
    spy.start();

    spy.select(IDS[3]);
    await scrollToY(landingOf(IDS[1]));

    button.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );
    expect(spy.getSnapshot().current).toBe(IDS[3]);

    // …while the same key from the page itself still means scrolling.
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(spy.getSnapshot().current).toBe(IDS[1]);
  });

  it('drops the pin on a scrolling key, and on no other key', async () => {
    buildPage();
    const spy = makeSpy();
    spy.start();

    spy.select(IDS[3]);
    await scrollToY(landingOf(IDS[1]));

    // Enter is how a keyboard visitor ACTIVATED that link in the first place,
    // and Tab is how they walk the menu: neither may undo their own choice.
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(spy.getSnapshot().current).toBe(IDS[3]);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' }));
    expect(spy.getSnapshot().current).toBe(IDS[1]);
  });

  it('drops the pin on a touch drag — the phone’s wheel', async () => {
    buildPage();
    const spy = makeSpy();
    spy.start();

    spy.select(IDS[3]);
    await scrollToY(landingOf(IDS[1]));
    window.dispatchEvent(new Event('touchmove'));

    expect(spy.getSnapshot().current).toBe(IDS[1]);
  });

  it('a wheel with no pin in play costs nothing and changes nothing', async () => {
    buildPage();
    const spy = makeSpy();
    spy.start();
    await scrollToY(landingOf(IDS[2]));

    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 120 }));

    expect(spy.getSnapshot().current).toBe(IDS[2]);
  });

  it('keeps the pin through a scroll event that moved nothing', async () => {
    buildPage();
    const spy = makeSpy();
    spy.start();

    spy.select(IDS[3]);
    await scrollToY(landingOf(IDS[3]));
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    // A bounce at the end of a page, or a programmatic scroll to where we
    // already are: an event, but no movement, so no hand.
    window.dispatchEvent(new Event('scroll'));

    expect(spy.getSnapshot().current).toBe(IDS[3]);
  });

  it('a scrolling key delivered to a <dialog> leaves the pin alone', async () => {
    // ui/Modal focuses the <dialog> itself; the arrows there scroll the
    // dialog's content, never the page (G2 react, Fable, 2026-09-15).
    buildPage();
    const dialog = document.createElement('dialog');
    host?.append(dialog);
    const spy = makeSpy();
    spy.start();

    spy.select(IDS[3]);
    await scrollToY(landingOf(IDS[3]));
    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );

    expect(spy.getSnapshot().current).toBe(IDS[3]);
  });

  it('walks silently while pinned, so the answer is ready the moment it drops', async () => {
    buildPage();
    const spy = makeSpy();
    spy.start();

    spy.select(IDS[0]);
    // The page moves away while the pin stands: the walk keeps running under
    // it, unpublished…
    await scrollToY(landingOf(IDS[2]));
    expect(spy.getSnapshot().current).toBe(IDS[0]);

    // …so when the settle finds the pinned target nowhere near its line and
    // drops the pin, the walk's answer is already there.
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);

    expect(spy.getSnapshot().current).toBe(IDS[2]);
  });

  it('ignores a select() for an id it does not know', () => {
    buildPage();
    const spy = makeSpy();
    spy.start();

    spy.select('not-a-category');

    expect(spy.getSnapshot().current).toBe(IDS[0]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('tells its subscribers once per real change', () => {
    buildPage();
    const spy = makeSpy();
    spy.start();
    let told = 0;
    const unsubscribe = spy.subscribe(() => {
      told += 1;
    });

    spy.select(IDS[2]);
    expect(told).toBe(1);
    spy.select(IDS[2]);
    expect(told).toBe(1);

    unsubscribe();
    spy.select(IDS[1]);
    expect(told).toBe(1);
  });

  // THE START GRACE (the header; owner 2026-09-29, "fix them for me"). The
  // defect it fixes, measured by the planner on the built page: a main thread
  // busy for 160ms or more right after a click fires the settle BEFORE the
  // jump's first scroll event, finds the target not arrived and drops the pin
  // — WebKit 12 of 12, Chromium in a scratch harness 19 of 40 — and both marks
  // then walk through every card the glide passes. Every case below is
  // judged in a single task, the way a busy thread would see it.

  it('THE START GRACE: a pin whose page has not moved survives ONE settle window and is dropped at the second', async () => {
    buildPage();
    await scrollToY(landingOf(IDS[1]));
    const spy = makeSpy();
    spy.start();

    spy.select(IDS[3]);
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    // A page that has not moved looks exactly like a jump that has not begun:
    // one window more, and the pin still stands.
    expect(spy.getSnapshot().current).toBe(IDS[3]);
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(IDS[1]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('THE START GRACE: a page that moved between two checks with no scroll event delivered is looked at again, not judged', async () => {
    // The busy thread's whole story: the jump starts late — the first window
    // passes with the page still, and the grace is spent on it — and then it
    // moves while its scroll event is still queued behind the long task. The
    // position is mid-glide, short of the target, with no grace left: only
    // the "has the page moved since the pin last looked?" question keeps the
    // pin (mutation-checked: without it this test goes red).
    buildPage();
    const spy = makeSpy();
    spy.start();
    spy.select(IDS[3]);

    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(IDS[3]);

    // Moved and judged in the same task: no frame, so no scroll event yet.
    window.scrollTo(0, landingOf(IDS[2]));
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(IDS[3]);
    expect(vi.getTimerCount()).toBe(1);

    // The glide goes on and lands; the next settle finds the target there.
    await scrollToY(landingOf(IDS[3]));
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(IDS[3]);
  });

  it('THE START GRACE: a page that moved and then stopped short is judged at the next window — it DID move, so no grace', () => {
    // The settle that saw the page move remembers it: when the page then rests
    // short of the target, the pin is handed back after one more window, not
    // two.
    buildPage();
    const spy = makeSpy();
    spy.start();
    spy.select(IDS[3]);

    window.scrollTo(0, landingOf(IDS[2]));
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(IDS[3]);

    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(IDS[2]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('THE START GRACE: a glide that stopped short after real scroll events is dropped after ONE window, as before', async () => {
    // The scroll events prove the page moved, so there is nothing to wait
    // for: today's timing, unchanged (the scroll-lock case above is the same
    // claim from the other side).
    buildPage();
    const spy = makeSpy();
    spy.start();

    spy.select(IDS[3]);
    await scrollToY(landingOf(IDS[1]));
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);

    expect(spy.getSnapshot().current).toBe(IDS[1]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('THE START GRACE: a second select() renews it', async () => {
    buildPage();
    await scrollToY(landingOf(IDS[1]));
    const spy = makeSpy();
    spy.start();

    spy.select(IDS[3]);
    // The first pin's grace, spent — and then the visitor clicks again.
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    spy.select(IDS[2]);

    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(IDS[2]);

    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(IDS[1]);
  });
});

describe('createScrollSpy — the URL’s own #id', () => {
  it('pins the hash a visitor arrived with, at start()', async () => {
    // The browser's own load-time jump has already happened when start() runs
    // — so the page is AT the fragment, and the settle finds it there.
    buildPage();
    await scrollToY(landingOf(IDS[3]));
    window.history.replaceState(null, '', `#${IDS[3]}`);
    const spy = makeSpy();

    spy.start();
    expect(spy.getSnapshot().current).toBe(IDS[3]);

    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(IDS[3]);
  });

  it('drops a hash pin the RESTORED page never reached — reload, Back, a WebKit same-document Back', async () => {
    // Measured on the built page: a reload with `#orthodontics` in the URL
    // after a hand scroll restores y = 1681 (Endodonție on screen) instead of
    // jumping; a full-document Back does the same; WebKit's same-document Back
    // restores where Chromium re-scrolls — the iPhone audience. The intent is
    // honoured for one settle, then checked against the page (G2 react,
    // Fable, 2026-09-15).
    buildPage();
    await scrollToY(landingOf(IDS[1]));
    window.history.replaceState(null, '', `#${IDS[3]}`);
    const spy = makeSpy();

    spy.start();
    expect(spy.getSnapshot().current).toBe(IDS[3]);

    // TWO settle windows, not one (THE START GRACE, 2026-09-29): a restored
    // page never MOVES after the pin, and a page that has not moved looks
    // exactly like a jump that has not begun yet — so it gets one window
    // more before it is judged.
    vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);
    expect(spy.getSnapshot().current).toBe(IDS[1]);
  });

  it('follows a hashchange — Back, Forward, a pasted link', () => {
    buildPage();
    const spy = makeSpy();
    spy.start();

    window.history.replaceState(null, '', `#${IDS[2]}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(spy.getSnapshot().current).toBe(IDS[2]);
  });

  it('drops a live pin when the visitor jumps somewhere it does not own', async () => {
    // The skip link, a footer anchor: the page went somewhere this menu has no
    // target for, so the pin must not outlive it (G2 react, 2026-09-14). The
    // dangerous window is the one below — the first jump is still settling, so
    // its scroll events only re-arm and nothing else would ever contradict the
    // stale mark.
    buildPage();
    const spy = makeSpy();
    spy.start();

    spy.select(IDS[3]);
    await scrollToY(landingOf(IDS[1]));
    expect(spy.getSnapshot().current).toBe(IDS[3]);

    window.history.replaceState(null, '', '#main');
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(spy.getSnapshot().current).toBe(IDS[1]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('ignores a hash that is none of its ids', () => {
    buildPage();
    const spy = makeSpy();
    spy.start();

    window.history.replaceState(null, '', '#main');
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(spy.getSnapshot().current).toBe(IDS[0]);
  });
});

describe('createScrollSpy — horizontalScrollers: sideways input inside a strip is not page scrolling (G2 react, 2026-10-09)', () => {
  /** A horizontal scroller inside the page, with a child to aim events at. */
  function addStrip(): HTMLElement {
    const strip = document.createElement('ul');
    strip.id = 'strip';
    const chip = document.createElement('li');
    chip.textContent = 'Profilaxie';
    strip.append(chip);
    host?.append(strip);
    return chip;
  }

  /** A pin in play, mid-glide — the state a tap leaves. */
  async function pinnedMidGlide(): Promise<ScrollSpy> {
    const spy = makeSpy({ ids: IDS, horizontalScrollers: ['strip'] });
    spy.start();
    spy.select(IDS[3]);
    await scrollToY(landingOf(IDS[1]));
    expect(spy.getSnapshot().current).toBe(IDS[3]);
    return spy;
  }

  const touchAt = (target: Element, x: number, y: number): Touch =>
    new Touch({ identifier: 1, target, clientX: x, clientY: y });

  function swipe(target: Element, to: { dx: number; dy: number }): void {
    target.dispatchEvent(
      new TouchEvent('touchstart', {
        bubbles: true,
        touches: [touchAt(target, 100, 100)],
      }),
    );
    for (let step = 1; step <= 4; step += 1) {
      target.dispatchEvent(
        new TouchEvent('touchmove', {
          bubbles: true,
          touches: [
            touchAt(target, 100 + (to.dx * step) / 4, 100 + (to.dy * step) / 4),
          ],
        }),
      );
    }
  }

  it('a SIDEWAYS wheel over the strip leaves the pin alone — and so does Shift with a vertical wheel', async () => {
    buildPage();
    const chip = addStrip();
    const spy = await pinnedMidGlide();

    chip.dispatchEvent(
      new WheelEvent('wheel', { deltaX: 80, deltaY: 10, bubbles: true }),
    );
    expect(spy.getSnapshot().current).toBe(IDS[3]);
    chip.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 120, shiftKey: true, bubbles: true }),
    );
    expect(spy.getSnapshot().current).toBe(IDS[3]);
  });

  it('a VERTICAL wheel over the strip scrolls the page: it drops the pin', async () => {
    buildPage();
    const chip = addStrip();
    const spy = await pinnedMidGlide();

    chip.dispatchEvent(
      new WheelEvent('wheel', { deltaX: 5, deltaY: 120, bubbles: true }),
    );

    expect(spy.getSnapshot().current).toBe(IDS[1]);
  });

  it('a sideways wheel ELSEWHERE still drops it — only the named scrollers are excused', async () => {
    buildPage();
    addStrip();
    const spy = await pinnedMidGlide();

    window.dispatchEvent(new WheelEvent('wheel', { deltaX: 80 }));

    expect(spy.getSnapshot().current).toBe(IDS[1]);
  });

  it('a touch gesture that starts on the strip and pans SIDEWAYS never drops the pin', async () => {
    buildPage();
    const chip = addStrip();
    const spy = await pinnedMidGlide();

    swipe(chip, { dx: -120, dy: 12 });

    expect(spy.getSnapshot().current).toBe(IDS[3]);
  });

  it('a VERTICAL gesture that starts on the strip scrolls the page: it still counts as a hand', async () => {
    buildPage();
    const chip = addStrip();
    const spy = await pinnedMidGlide();

    swipe(chip, { dx: 8, dy: -120 });

    expect(spy.getSnapshot().current).toBe(IDS[1]);
  });

  it('a wobble under the 10px decision is no pan at all — nothing is judged yet', async () => {
    buildPage();
    const chip = addStrip();
    const spy = await pinnedMidGlide();

    swipe(chip, { dx: 2, dy: 6 });

    expect(spy.getSnapshot().current).toBe(IDS[3]);
  });

  it('a gesture that starts OFF the strip drops the pin as before, sideways or not', async () => {
    buildPage();
    addStrip();
    const spy = await pinnedMidGlide();
    const elsewhere = document.getElementById(IDS[2]) as HTMLElement;

    swipe(elsewhere, { dx: -120, dy: 0 });

    expect(spy.getSnapshot().current).toBe(IDS[1]);
  });

  it('a second finger is a pinch, the page’s — never the strip’s pan', async () => {
    buildPage();
    const chip = addStrip();
    const spy = await pinnedMidGlide();
    chip.dispatchEvent(
      new TouchEvent('touchstart', {
        bubbles: true,
        touches: [touchAt(chip, 100, 100)],
      }),
    );

    chip.dispatchEvent(
      new TouchEvent('touchmove', {
        bubbles: true,
        touches: [
          touchAt(chip, 60, 100),
          new Touch({
            identifier: 2,
            target: chip,
            clientX: 160,
            clientY: 100,
          }),
        ],
      }),
    );

    expect(spy.getSnapshot().current).toBe(IDS[1]);
  });

  it('judges a gesture ONCE — a sideways pan that turns vertical afterwards is still the strip’s, and keeps the pin', async () => {
    buildPage();
    const chip = addStrip();
    const spy = await pinnedMidGlide();
    const move = (x: number, y: number): boolean =>
      chip.dispatchEvent(
        new TouchEvent('touchmove', {
          bubbles: true,
          touches: [touchAt(chip, x, y)],
        }),
      );
    chip.dispatchEvent(
      new TouchEvent('touchstart', {
        bubbles: true,
        touches: [touchAt(chip, 100, 100)],
      }),
    );

    move(70, 101); // 30px sideways: judged sideways
    move(70, 220); // then far down — cumulatively vertical, never re-judged

    expect(spy.getSnapshot().current).toBe(IDS[3]);
  });

  it('…and a VERTICAL pan that turns sideways afterwards stays the page’s: it drops even a pin made after its judgment', async () => {
    buildPage();
    const chip = addStrip();
    const spy = await pinnedMidGlide();
    const move = (x: number, y: number): boolean =>
      chip.dispatchEvent(
        new TouchEvent('touchmove', {
          bubbles: true,
          touches: [touchAt(chip, x, y)],
        }),
      );
    chip.dispatchEvent(
      new TouchEvent('touchstart', {
        bubbles: true,
        touches: [touchAt(chip, 100, 100)],
      }),
    );
    move(101, 70); // judged vertical: the page — the pin goes
    expect(spy.getSnapshot().current).toBe(IDS[1]);

    // A new pin in the middle of that same gesture, which then sweeps far
    // sideways: were the gesture re-judged, the sweep would keep it.
    spy.select(IDS[3]);
    move(-200, 80);

    expect(spy.getSnapshot().current).toBe(IDS[1]);
  });

  it('a gesture that STARTS with two fingers is never the strip’s pan — it drops the pin, sideways or not', async () => {
    buildPage();
    const chip = addStrip();
    const spy = await pinnedMidGlide();
    chip.dispatchEvent(
      new TouchEvent('touchstart', {
        bubbles: true,
        touches: [
          touchAt(chip, 100, 100),
          new Touch({
            identifier: 2,
            target: chip,
            clientX: 160,
            clientY: 100,
          }),
        ],
      }),
    );

    chip.dispatchEvent(
      new TouchEvent('touchmove', {
        bubbles: true,
        touches: [touchAt(chip, 40, 100)],
      }),
    );

    expect(spy.getSnapshot().current).toBe(IDS[1]);
  });

  /** A 60px pan at `degrees` off vertical — downwards and to the right. */
  const offVertical = (degrees: number): { dx: number; dy: number } => ({
    dx: 60 * Math.sin((degrees * Math.PI) / 180),
    dy: 60 * Math.cos((degrees * Math.PI) / 180),
  });

  it('only a CLEARLY vertical pan is the page’s: a gesture 40° off vertical — which Chromium hands to the strip from ~37–40° — keeps the pin (VERTICAL_PAN_RATIO)', async () => {
    buildPage();
    const chip = addStrip();
    const spy = await pinnedMidGlide();

    swipe(chip, offVertical(40));

    expect(spy.getSnapshot().current).toBe(IDS[3]);
  });

  it('…and a gesture 30° off vertical is clearly the page’s: it drops the pin', async () => {
    buildPage();
    const chip = addStrip();
    const spy = await pinnedMidGlide();

    swipe(chip, offVertical(30));

    expect(spy.getSnapshot().current).toBe(IDS[1]);
  });

  it('refuses a repeated scroller id, like a repeated target id', () => {
    expect(() =>
      createScrollSpy({ ids: IDS, horizontalScrollers: ['strip', 'strip'] }),
    ).toThrow(
      /horizontalScrollers ids must be unique \(received "strip" twice\)/,
    );
  });

  it('refuses a blank scroller id — one that could never be found', () => {
    expect(() =>
      createScrollSpy({ ids: IDS, horizontalScrollers: [''] }),
    ).toThrow(/an empty one/);
    expect(() =>
      createScrollSpy({ ids: IDS, horizontalScrollers: ['  '] }),
    ).toThrow(/a blank one/);
  });
});

describe('createScrollSpy — start and dispose', () => {
  it('attaches exactly one set of listeners, however often start() is called', () => {
    buildPage();
    const listen = vi.spyOn(window, 'addEventListener');
    const spy = makeSpy();

    spy.start();
    spy.start();

    expect(
      listen.mock.calls
        .map(([type]) => type)
        .sort((a, b) => a.localeCompare(b)),
    ).toEqual([
      'focusin',
      'hashchange',
      'keydown',
      'resize',
      'scroll',
      'touchmove',
      'touchstart',
      'wheel',
    ]);
  });

  it('asks the browser NOT to wait for it: the scroll listener is passive', () => {
    buildPage();
    const listen = vi.spyOn(window, 'addEventListener');
    makeSpy().start();

    const scroll = listen.mock.calls.find(([type]) => type === 'scroll');
    expect(scroll?.[2]).toEqual({ passive: true });
  });

  it('dispose() detaches everything, clears the timer and forgets the pin', async () => {
    buildPage();
    const spy = makeSpy();
    spy.start();
    spy.select(IDS[3]);
    expect(vi.getTimerCount()).toBe(1);

    spy.dispose();

    expect(vi.getTimerCount()).toBe(0);
    expect(spy.getSnapshot()).toEqual({ current: null });
    // …and the page moving no longer says anything to it.
    await scrollToY(landingOf(IDS[2]));
    expect(spy.getSnapshot().current).toBeNull();
  });

  it('select() is a no-op before start() and after dispose()', () => {
    // The type permits both calls; the implementation must make them mean
    // nothing (G2 typescript, 2026-09-14). After dispose(), re-pinning would
    // report a current item for a page the store has stopped watching — the
    // very thing dispose()'s reset exists to prevent. Before start(), arming
    // the settle would schedule a callback that reads `window.scrollY`, which
    // is a ReferenceError anywhere the ring is loaded by plain Node.
    buildPage();
    const spy = makeSpy();

    spy.select(IDS[2]);
    expect(spy.getSnapshot()).toEqual({ current: null });
    expect(vi.getTimerCount()).toBe(0);

    spy.start();
    spy.select(IDS[2]);
    expect(spy.getSnapshot().current).toBe(IDS[2]);

    spy.dispose();
    spy.select(IDS[3]);
    expect(spy.getSnapshot()).toEqual({ current: null });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('is re-entrant, and start() works again afterwards', async () => {
    buildPage();
    const spy = makeSpy();
    spy.start();
    spy.dispose();
    spy.dispose();

    spy.start();

    expect(spy.getSnapshot().current).toBe(IDS[0]);
    await scrollToY(landingOf(IDS[1]));
    expect(spy.getSnapshot().current).toBe(IDS[1]);
  });
});
