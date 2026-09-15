import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
// target carries 40px of scroll-margin-top (a CategoryCard's `scroll-mt-10`,
// 2.5rem). Pixels rather than rem because a test that re-derived the root font
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
}>;

/** Build a tall document of fragment targets and hand back their ids. */
function buildPage(page: PageOptions = {}): readonly string[] {
  const ids = page.ids ?? IDS;
  const margin = page.margin ?? MARGIN;

  document.documentElement.style.scrollPaddingTop = `${page.padding ?? PADDING}px`;
  host = document.createElement('div');
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

    vi.advanceTimersByTime(DEFAULT_SETTLE_MS);
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
