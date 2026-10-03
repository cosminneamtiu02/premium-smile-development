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
  type ScrollSpy,
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
  /** A block of this many pixels ABOVE the first target — the doctor page's
   *  opener and profile band over its course timeline (`topFallback`). */
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
  window.history.replaceState(null, '', window.location.pathname);
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

  it('refuses a top fallback it does not know', () => {
    // The type admits two words; a plain-JS caller (or a cast) could hand it a
    // third, and a spy that silently fell back to one of the two would mark —
    // or not mark — for a reason nobody wrote down.
    const topFallback = 'last' as unknown as 'first';
    expect(() => createScrollSpy({ ids: [...IDS], topFallback })).toThrow(
      /topFallback/,
    );
    expect(() =>
      createScrollSpy({ ids: [...IDS], topFallback: 'none' }),
    ).not.toThrow();
  });

  it('refuses a line it does not know (D49)', () => {
    // The same guard as the fallback's: a third word — a cast, a plain-JS
    // caller's 'top' — must not fall silently to one of the two lines.
    const line = 'top' as unknown as 'landing';
    expect(() => createScrollSpy({ ids: [...IDS], line })).toThrow(/line/);
    expect(() =>
      createScrollSpy({ ids: [...IDS], line: 'landing' }),
    ).not.toThrow();
    expect(() =>
      createScrollSpy({ ids: [...IDS], line: 'middle' }),
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

describe('createScrollSpy — topFallback: a long intro above the first target', () => {
  // THE NAMED TRIGGER, FIRED (the header's POSITION WALK): the doctor page's
  // course timeline sits under the opener and the profile band, so at the top
  // of that page no year is being read and none may be marked — "all are
  // grayed out at rest" (owner, 2026-09-26; the doctor-pages run's D35). The
  // 600px intro below plays that opener: it keeps the first target well under
  // its landing line at scrollY 0.
  const INTRO = 600;

  it('defaults to "first" — the price menu’s answer, unchanged', () => {
    // PriceMenu passes no `topFallback`; its first category must stay marked
    // at the top of the page exactly as before the option existed, intro or
    // not.
    buildPage({ intro: INTRO });
    const spy = makeSpy();
    spy.start();

    const first = document.getElementById(IDS[0]) as HTMLElement;
    // The premise: the first target really is below its line.
    expect(first.getBoundingClientRect().top - MARGIN).toBeGreaterThan(
      PADDING + 1,
    );
    expect(spy.getSnapshot().current).toBe(IDS[0]);

    const explicit = makeSpy({ ids: IDS, topFallback: 'first' });
    explicit.start();
    expect(explicit.getSnapshot().current).toBe(IDS[0]);
  });

  it('"none": nothing is current while the first target is below its line', () => {
    buildPage({ intro: INTRO });
    const spy = makeSpy({ ids: IDS, topFallback: 'none' });
    spy.start();

    expect(window.scrollY).toBe(0);
    expect(spy.getSnapshot().current).toBeNull();
  });

  it('"none": reaching the first target’s line makes it current, one pixel short does not', async () => {
    buildPage({ intro: INTRO });
    const spy = makeSpy({ ids: IDS, topFallback: 'none' });
    spy.start();
    const landing = landingOf(IDS[0]);

    // The walk's own pixel of grace, and one pixel more — the same boundary
    // the default fallback test pins for the second target.
    await scrollToY(landing - 2);
    expect(spy.getSnapshot().current).toBeNull();

    await scrollToY(landing);
    expect(spy.getSnapshot().current).toBe(IDS[0]);

    await scrollToY(landingOf(IDS[1]));
    expect(spy.getSnapshot().current).toBe(IDS[1]);
  });

  it('"none": scrolling back above the first target returns to nothing', async () => {
    // "When not on current they should … return to on rest state" (owner):
    // the answer is a pure function of the scroll position, both ways.
    buildPage({ intro: INTRO });
    const spy = makeSpy({ ids: IDS, topFallback: 'none' });
    spy.start();

    await scrollToY(landingOf(IDS[1]));
    expect(spy.getSnapshot().current).toBe(IDS[1]);

    await scrollToY(0);
    expect(spy.getSnapshot().current).toBeNull();
  });

  it('"none": the bottom rule still wins at the end of the page', async () => {
    // The option replaces the TOP fallback only. A last target too short to
    // reach its line is still marked at the document's end.
    const ids = buildPage({ intro: INTRO, heights: [BLOCK, BLOCK, BLOCK, 40] });
    const spy = makeSpy({ ids, topFallback: 'none' });
    spy.start();
    const bottom = document.documentElement.scrollHeight - window.innerHeight;

    await scrollToY(bottom);
    expect(Math.round(window.scrollY)).toBe(bottom);
    expect(spy.getSnapshot().current).toBe(ids[3]);
  });

  it('"none": a page that FITS its viewport reports nothing', () => {
    // No scroll, so no bottom rule (the `maxScrollY > 0` guard) and no target
    // on its line — the rest state, not the first target.
    const ids = buildPage({
      heights: [40, 40, 40, 40],
      margin: 0,
      padding: 0,
      intro: 200,
    });
    const spy = makeSpy({ ids, topFallback: 'none' });
    spy.start();

    expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(
      window.innerHeight,
    );
    expect(spy.getSnapshot().current).toBeNull();
  });

  it('"none": select() and the load-time hash still pin', async () => {
    // The option is about the WALK's empty answer; the click's intent and the
    // URL's own #id outrank the walk exactly as before.
    buildPage({ intro: INTRO });
    const spy = makeSpy({ ids: IDS, topFallback: 'none' });
    spy.start();
    expect(spy.getSnapshot().current).toBeNull();

    spy.select(IDS[2]);
    expect(spy.getSnapshot().current).toBe(IDS[2]);
    spy.dispose();

    await scrollToY(landingOf(IDS[3]));
    window.history.replaceState(null, '', `#${IDS[3]}`);
    const hashed = makeSpy({ ids: IDS, topFallback: 'none' });
    hashed.start();
    expect(hashed.getSnapshot().current).toBe(IDS[3]);
  });

  it('"none" never leaks into the server snapshot — it is null either way', () => {
    buildPage({ intro: INTRO });
    const spy = makeSpy({ ids: IDS, topFallback: 'none' });

    expect(spy.getServerSnapshot()).toEqual({ current: null });
    expect(spy.getSnapshot()).toBe(spy.getServerSnapshot());
  });
});

describe("createScrollSpy — line: 'middle', where the reader's eye is (D49)", () => {
  // THE MIDDLE LINE (the header): "move at the center of the screen on y axis
  // the line activating 'current'" (owner, 2026-09-26, the doctor-pages run's
  // round 2k). The walk's line becomes `innerHeight / 2`, measured against a
  // target's BARE top — no scroll-margin-top, no scroll-padding-top — and the
  // top fallback and the pin's arrival check ask that same line. The fixture
  // keeps the price page's 96px padding and 40px margins on purpose: they are
  // still THERE, and the middle line must not read them.

  /**
   * The scroll offset that puts `id`'s bare top edge on the middle of the
   * window. The half is FLOORED, so an odd `innerHeight`'s half pixel lands
   * the top at most half a pixel ABOVE the line — inside it, never below.
   * Computed from the live element, like `landingOf`.
   */
  const middleOf = (id: string): number => {
    const target = document.getElementById(id) as HTMLElement;
    return (
      Math.round(target.getBoundingClientRect().top + window.scrollY) -
      Math.floor(window.innerHeight / 2)
    );
  };

  /** How far `id`'s top sits below the middle of the window, in pixels. */
  const belowMiddle = (id: string): number =>
    (document.getElementById(id) as HTMLElement).getBoundingClientRect().top -
    window.innerHeight / 2;

  it("the default is still the landing line — 'landing' spelled out answers the same", async () => {
    // A spy built with no `line` must answer byte-identically to the days
    // before the option — the landing line, the price menu's from 2026-09-14
    // until round 5 (2026-09-29), when it moved to 'reading'. At the position
    // below the third target's top sits ON the middle but far under its
    // landing line (96 + 40px), so the two lines give two different answers
    // at once.
    buildPage();
    const byDefault = makeSpy();
    const landing = makeSpy({ ids: IDS, line: 'landing' });
    const middle = makeSpy({ ids: IDS, line: 'middle' });
    for (const spy of [byDefault, landing, middle]) spy.start();

    const target = middleOf(IDS[2]);
    await scrollToY(target);
    expect(Math.round(window.scrollY)).toBe(target);

    expect(byDefault.getSnapshot().current).toBe(IDS[1]);
    expect(landing.getSnapshot().current).toBe(IDS[1]);
    expect(middle.getSnapshot().current).toBe(IDS[2]);

    // …and at the third target's LANDING position the two agree again.
    await scrollToY(landingOf(IDS[2]));
    expect(byDefault.getSnapshot().current).toBe(IDS[2]);
    expect(landing.getSnapshot().current).toBe(IDS[2]);
    expect(middle.getSnapshot().current).toBe(IDS[2]);
  });

  it('marks a target whose top is ABOVE or AT the middle, one pixel below by grace — never two', async () => {
    buildPage();
    const spy = makeSpy({ ids: IDS, line: 'middle' });
    spy.start();
    const onMiddle = middleOf(IDS[2]);

    // Above: 200px past the middle, it is the one being read.
    await scrollToY(onMiddle + 200);
    expect(belowMiddle(IDS[2])).toBeLessThan(-190);
    expect(spy.getSnapshot().current).toBe(IDS[2]);

    // At: on the middle (half a pixel above it for an odd window).
    await scrollToY(onMiddle);
    expect(Math.abs(belowMiddle(IDS[2]))).toBeLessThanOrEqual(0.5);
    expect(spy.getSnapshot().current).toBe(IDS[2]);

    // One pixel below: the walk's own grace, the landing line's same pixel.
    await scrollToY(onMiddle - 1);
    expect(belowMiddle(IDS[2])).toBeLessThanOrEqual(1);
    expect(spy.getSnapshot().current).toBe(IDS[2]);

    // Two pixels below: not yet — the target above is still the one.
    await scrollToY(onMiddle - 2);
    expect(belowMiddle(IDS[2])).toBeGreaterThan(1);
    expect(spy.getSnapshot().current).toBe(IDS[1]);
  });

  it('reads NEITHER scroll-margin-top NOR scroll-padding-top — the bare top against the middle', async () => {
    // Huge values that would move the landing line past the middle: the
    // landing spy marks the third target two pixels BELOW the middle, the
    // middle spy does not — the two CSS properties play no part on its line.
    buildPage({ margin: 300, padding: 400 });
    const landing = makeSpy({ ids: IDS, line: 'landing' });
    const middle = makeSpy({ ids: IDS, line: 'middle' });
    landing.start();
    middle.start();

    await scrollToY(middleOf(IDS[2]) - 2);
    expect(belowMiddle(IDS[2])).toBeGreaterThan(1);

    expect(landing.getSnapshot().current).toBe(IDS[2]);
    expect(middle.getSnapshot().current).toBe(IDS[1]);
  });

  it('moves the line with the window — a resize re-reads innerHeight', async () => {
    buildPage();
    const spy = makeSpy({ ids: IDS, line: 'middle' });
    spy.start();
    const height = window.innerHeight;

    // 50px past today's middle: current.
    await scrollToY(middleOf(IDS[2]) + 50);
    expect(spy.getSnapshot().current).toBe(IDS[2]);

    // A window 200px shorter puts the middle 100px higher — the third target
    // is now 50px BELOW it, and the resize listener's walk says so.
    const shorter = vi
      .spyOn(window, 'innerHeight', 'get')
      .mockReturnValue(height - 200);
    window.dispatchEvent(new Event('resize'));
    expect(spy.getSnapshot().current).toBe(IDS[1]);

    // Back to the old height: back to the old answer.
    shorter.mockRestore();
    expect(window.innerHeight).toBe(height);
    window.dispatchEvent(new Event('resize'));
    expect(spy.getSnapshot().current).toBe(IDS[2]);
  });

  it('keeps the bottom rule: the end of the page marks the last target, middle or not', async () => {
    // The timeline's own pair of options. A 40px last block never gets its top
    // up to the middle — the document runs out first — and the bottom rule,
    // which holds no line at all, still marks it there.
    const ids = buildPage({ heights: [BLOCK, BLOCK, BLOCK, 40] });
    const spy = makeSpy({ ids, line: 'middle', topFallback: 'none' });
    spy.start();
    const bottom = document.documentElement.scrollHeight - window.innerHeight;

    await scrollToY(bottom - 300);
    expect(spy.getSnapshot().current).toBe(ids[2]);

    await scrollToY(bottom);
    expect(Math.round(window.scrollY)).toBe(bottom);
    // Proof the rule — not the walk — did it: the last top is under the middle.
    expect(belowMiddle(ids[3])).toBeGreaterThan(1);
    expect(spy.getSnapshot().current).toBe(ids[3]);
  });

  it('"none" above the first target: nothing until its top reaches the middle', async () => {
    // The timeline's configuration: an intro taller than half the window
    // keeps the first year under the middle at scrollY 0.
    buildPage({ intro: 1_500 });
    const spy = makeSpy({ ids: IDS, line: 'middle', topFallback: 'none' });
    spy.start();

    expect(window.scrollY).toBe(0);
    expect(spy.getSnapshot().current).toBeNull();

    await scrollToY(middleOf(IDS[0]) - 2);
    expect(spy.getSnapshot().current).toBeNull();

    await scrollToY(middleOf(IDS[0]));
    expect(spy.getSnapshot().current).toBe(IDS[0]);

    await scrollToY(0);
    expect(spy.getSnapshot().current).toBeNull();
  });

  it('a hash pin ARRIVES on the middle — and a resize that moves the line does not drop it', async () => {
    // The arrival check asks THE line: a target sitting on the middle at the
    // settle has arrived, and the pin then holds like any other (a resize is
    // never a reason to drop it). A second, UNPINNED middle spy on the same
    // page is the control — it answers by the walk alone.
    buildPage();
    await scrollToY(middleOf(IDS[3]));
    const walkOnly = makeSpy({ ids: IDS, line: 'middle' });
    walkOnly.start();
    window.history.replaceState(null, '', `#${IDS[3]}`);
    const pinned = makeSpy({ ids: IDS, line: 'middle' });

    pinned.start();
    expect(pinned.getSnapshot().current).toBe(IDS[3]);
    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
    expect(pinned.getSnapshot().current).toBe(IDS[3]);

    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(
      window.innerHeight - 200,
    );
    window.dispatchEvent(new Event('resize'));

    expect(walkOnly.getSnapshot().current).toBe(IDS[2]);
    expect(pinned.getSnapshot().current).toBe(IDS[3]);
  });

  it('a jump that parks its target under the pill has NOT arrived on the middle — the walk answers', async () => {
    // THE MIDDLE LINE's CONSEQUENCE, pinned so it is never rediscovered: the
    // browser's jump lands on the LANDING line whatever this spy measures, so
    // at the settle the pin is checked against the middle, fails, and hands
    // the mark to the walk — here the short third target's neighbour, whose
    // top has already crossed the middle. A landing-line spy given the same
    // click and the same glide keeps it: that spy's line IS where jumps land.
    const ids = buildPage({ heights: [BLOCK, BLOCK, 40, BLOCK] });
    const landing = makeSpy({ ids, line: 'landing' });
    const middle = makeSpy({ ids, line: 'middle' });
    landing.start();
    middle.start();

    landing.select(ids[2]);
    middle.select(ids[2]);
    await scrollToY(landingOf(ids[2]));
    expect(middle.getSnapshot().current).toBe(ids[2]);

    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);

    expect(landing.getSnapshot().current).toBe(ids[2]);
    expect(belowMiddle(ids[3])).toBeLessThan(0);
    expect(middle.getSnapshot().current).toBe(ids[3]);
  });

  it('never leaks into the server snapshot — it is null either way', () => {
    buildPage();
    const spy = makeSpy({ ids: IDS, line: 'middle', topFallback: 'none' });

    expect(spy.getServerSnapshot()).toEqual({ current: null });
    expect(spy.getSnapshot()).toBe(spy.getServerSnapshot());
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

  it('refuses an unknown line still, and now names all three', () => {
    const line = 'top' as unknown as 'reading';

    expect(() => createScrollSpy({ ids: [...IDS], line })).toThrow(
      "createScrollSpy: line must be 'landing', 'middle' or 'reading' (received top)",
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

  it("writes nothing on 'landing' and 'middle' — no inline style on any target, ever", async () => {
    // Everything that makes a reading-line spy write — start(), a scroll, a
    // resize, a `#id`, a pin and its settle, dispose() — put through the two
    // other lines, and every target's style attribute is the one the fixture
    // gave it.
    const ids = buildReadingPage(READING_PAGE);
    const before = ids.map((id) => target(id).getAttribute('style'));
    const spies = [
      makeSpy({ ids }),
      makeSpy({ ids, line: 'landing' }),
      makeSpy({ ids, line: 'middle' }),
    ];
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
    // FLOORED, as the middle line's tests do it, so an odd window's half pixel
    // puts the top at most half a pixel ABOVE the line — inside it.
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
    // "so smaller cars at top also get selection" (owner). A middle-line spy
    // on the same page is the control: at scroll 0 — as high as the page goes
    // — it already names the THIRD card, so the first two never have a turn.
    const ids = buildReadingPage(READING_PAGE);
    const reading = makeSpy({ ids, line: 'reading' });
    const middle = makeSpy({ ids, line: 'middle' });
    reading.start();
    middle.start();

    expect(window.scrollY).toBe(0);
    expect(target(ids[1]).getBoundingClientRect().top).toBeLessThan(
      (PADDING + window.innerHeight) / 2,
    );
    expect(middle.getSnapshot().current).toBe(ids[2]);
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
    // ARRIVED is still there to hold the card the visitor jumped to — the
    // middle line's own resize test, ported (G2 typescript review: with
    // arrival hard-wired to false the suite passed without this).
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

  it('the load-time hash: a page RESTORED anywhere else is not moved — its pin is handed to the walk after two windows', async () => {
    // A reload or a Back restores the old position instead of jumping: that
    // page is not where the browser's jump would have put the target, so the
    // spy leaves it alone and the pin's own check does the rest (THE START
    // GRACE: a page that never moved is judged at the second window).
    const ids = buildReadingPage(READING_PAGE);
    await scrollToY(1_000);
    window.history.replaceState(null, '', `#${ids[4]}`);
    const spy = makeSpy({ ids, line: 'reading' });

    spy.start();

    expect(window.scrollY).toBe(1_000);
    expect(spy.getSnapshot().current).toBe(ids[4]);
    vi.advanceTimersByTime(2 * DEFAULT_SETTLE_MS);
    const { frame, plan } = expected(ids);
    expect(readingIndex(frame, plan, 1_000)).toBe(3);
    expect(spy.getSnapshot().current).toBe(ids[3]);
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

  it('the landing and middle lines never call scrollIntoView, whatever the page rests on', async () => {
    // The one scroll belongs to the reading line alone: the other two own no
    // margin, so there is no plan for a jump to have missed.
    const scrolls = vi.spyOn(Element.prototype, 'scrollIntoView');
    const ids = buildReadingPage(CLAMPED_PAGE);
    const spies = [
      makeSpy({ ids }),
      makeSpy({ ids, line: 'landing' }),
      makeSpy({ ids, line: 'middle' }),
    ];

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

  it("'none' above the first target answers null on this line too — and 'first' the first", async () => {
    const page = { heights: [150, 150, 400], intro: 1_500, outro: 1_500 };
    const ids = buildReadingPage(page);
    const none = makeSpy({ ids, line: 'reading', topFallback: 'none' });
    none.start();
    const { plan } = expected(ids);

    expect(window.scrollY).toBe(0);
    expect(none.getSnapshot().current).toBeNull();
    await scrollToY(Math.round(plan.landings[0]));
    expect(none.getSnapshot().current).toBe(ids[0]);

    // The default, on the same page — one reading spy at a time, since each
    // owns its targets' margins.
    none.dispose();
    await scrollToY(0);
    const first = makeSpy({ ids, line: 'reading' });
    first.start();
    expect(first.getSnapshot().current).toBe(ids[0]);
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
      'hashchange',
      'keydown',
      'resize',
      'scroll',
      'touchmove',
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
