import { act, render, screen, within } from '@testing-library/react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest';
import { CourseTimeline, type CourseTimelineProps } from './CourseTimeline';
import source from './CourseTimeline.tsx?raw';
import globalsCss from '@/styles/globals.css?raw';

// sections/DoctorCourses/CourseTimeline — THE ISLAND's suite (2026-10-13,
// CLAUDE.md §15.23 round 7): the rail of ideas, ONE lit at a time, the light
// moving on by itself through ui/use-rotation. It runs in the components
// project's real Chromium, so everything the island touches is the
// platform's own — EXCEPT the three things a test must hold still (the
// StatNumber.test.tsx shape, the doctor page's other island):
//   · `matchMedia`, stubbed per test, so the reduced-motion branch is chosen
//     by the test and not by the machine's settings (lib/reduced-motion reads
//     `window.matchMedia` on every call, never a cached list) — and the stub
//     can flip the preference mid-visit, the one path that reaches the
//     classes' `motion-reduce:` belt;
//   · `IntersectionObserver`, replaced by FakeObserver below, so "the rail
//     scrolled out of view" is a call the test makes rather than a layout it
//     hopes for (THE OFF-SCREEN HOLD);
//   · the clock — Vitest's fake timers, so "+ intervalMs" is an exact
//     advance. Every advance runs inside act(): the ring publishes from a
//     timer, and Testing Library runs with the act environment on.
// What is pinned here is the WIRING — the states, the rhythm, the hold, the
// class contracts; lib/clock and lib/rotation have their own suites, and the
// looks that need real CSS (the geometry, the colours, the motion) are read
// in DoctorCourses.stories.tsx's plays. The TOKENS those animations are
// minted from are pinned here, off globals.css's source text (the last
// describe).
//
// ── Fixtures are Romanian with diacritics (§15.7), invented course lines in
// lib/team's shape, D-DASH-clean.

const IDEAS = [
  'Curs de reabilitare protetică pe implanturi, București',
  'Curs de chirurgie plastică parodontală, Cluj-Napoca',
  'Curs de restaurări protetice din zirconiu, Sibiu',
  'Rezidențiat în parodontologie',
] as const;

/** The tests' rhythm: a round number, nothing to do with the page's 3 s. */
const INTERVAL = 1_000;

// ── THE BYTE PINS, all three states. The island's own class strings, written
// out so a silent edit fails here (the header's THE STATES, THE CLOCKS and
// THE RAIL). The idea's transition LIST is per state (react F1 of the G2-R2
// tier-2 review): neutral and idle ease `[opacity,scale]` (the fade at the
// first light, the recede after a light), lit eases `opacity` alone and
// wears the settled `scale-104` unprefixed (the entry starts at a drawn 1.0).
const RAIL = 'flex flex-col gap-10';
const IDEA_BASE =
  'relative origin-left ps-10 text-lg text-ink duration-300 motion-reduce:transition-none';
const IDEA_NEUTRAL = `${IDEA_BASE} transition-[opacity,scale]`;
const IDEA_IDLE = `${IDEA_BASE} transition-[opacity,scale] opacity-65 contrast-more:opacity-100`;
const IDEA_LIT = `${IDEA_BASE} scale-104 transition-opacity animate-forward motion-reduce:animate-none`;
const STRETCH_BASE =
  'absolute start-1.25 top-3.5 w-0.5 transition-colors motion-reduce:transition-none';
/** EVERY stretch's reach, the last's included: 2.25rem past its idea — where
 *  another idea follows, 0.25rem above its top (D50); under the last idea,
 *  THE TRAIL (the header's RAIL, round 7). ONE recipe, so one pin per state. */
const REACH = '-bottom-9';
const STRETCH_REST = `${STRETCH_BASE} ${REACH} bg-line`;
const STRETCH_LIT = `${STRETCH_BASE} ${REACH} bg-accent-decorative`;
/** The dot's transition list is per state too (the dot's twin of react F1):
 *  at rest it eases `[background-color,scale]`, lit its colours alone. */
const DOT_BASE =
  'absolute start-0 top-2 size-3 rounded-full ring-4 ring-page motion-reduce:transition-none';
const DOT_REST = `${DOT_BASE} transition-[background-color,scale] bg-line`;
const DOT_LIT = `${DOT_BASE} transition-colors scale-125 bg-accent-decorative animate-pop motion-reduce:animate-none`;

/** A stand-in IntersectionObserver the test drives by hand (StatNumber's). */
class FakeObserver {
  static instances: FakeObserver[] = [];
  readonly callback: IntersectionObserverCallback;
  readonly options: IntersectionObserverInit | undefined;
  readonly targets: Element[] = [];
  disconnected = false;

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.callback = callback;
    this.options = options;
    FakeObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.targets.push(target);
  }

  unobserve(): void {}

  disconnect(): void {
    this.disconnected = true;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /** Deliver one callback carrying one entry per state, in order, for the
   *  first target — even after `disconnect()`, as the spec allows for
   *  entries already queued. `true` is in view. */
  fire(...inView: boolean[]): void {
    const [target] = this.targets;
    const entries = inView.map(
      (intersecting) =>
        ({
          target,
          isIntersecting: intersecting,
          intersectionRatio: intersecting ? 1 : 0,
        }) as IntersectionObserverEntry,
    );
    act(() => {
      this.callback(entries, this as unknown as IntersectionObserver);
    });
  }
}

/** The ONE observer the mounted island created. */
const observer = (): FakeObserver => {
  expect(FakeObserver.instances).toHaveLength(1);
  return FakeObserver.instances[0];
};

/**
 * Stub the reduced-motion question: `matchMedia` answers `reduce` for the
 * one query lib/reduced-motion asks, and remembers the clock's change
 * listener so the test can flip the preference mid-visit (`turnOn`).
 */
const stubReducedMotion = (reduce: boolean): { turnOn: () => void } => {
  let reduced = reduce;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  vi.stubGlobal('matchMedia', (query: string): MediaQueryList => {
    const asked = query === '(prefers-reduced-motion: reduce)';
    return {
      get matches() {
        return asked && reduced;
      },
      media: query,
      onchange: null,
      addEventListener: (
        _type: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        if (asked) listeners.add(listener);
      },
      removeEventListener: (
        _type: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        listeners.delete(listener);
      },
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  });
  return {
    turnOn: () => {
      reduced = true;
      act(() => {
        for (const listener of [...listeners]) {
          listener({ matches: true } as MediaQueryListEvent);
        }
      });
    },
  };
};

const advance = (ms: number): void => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

const mount = (props: Partial<CourseTimelineProps> = {}) =>
  render(<CourseTimeline items={IDEAS} intervalMs={INTERVAL} {...props} />);

/** The rail: the island's root. */
const railOf = (container: HTMLElement): HTMLElement =>
  container.firstElementChild as HTMLElement;
/** The ideas, in DOM order. */
const ideasOf = (rail: HTMLElement): HTMLElement[] =>
  [...rail.children] as HTMLElement[];
/** The ideas the island has lit — `data-current`, present only while lit. */
const litOf = (rail: HTMLElement): HTMLElement[] =>
  ideasOf(rail).filter((idea) => idea.hasAttribute('data-current'));
/** The one lit idea's index, or null when none is lit. */
const litIndex = (rail: HTMLElement): number | null => {
  const ideas = ideasOf(rail);
  const lit = litOf(rail);
  expect(lit.length).toBeLessThanOrEqual(1);
  return lit.length === 0 ? null : ideas.indexOf(lit[0]);
};

/** One idea's parts: its stretch of line, the painted dot, its words. */
const partsOf = (idea: HTMLElement) => {
  const [stretch, dot] = [...idea.children] as HTMLElement[];
  return { stretch, dot };
};

/** The whole rail in one state: `lit` the lit index, null for NEUTRAL. Every
 *  idea's parts are pinned the same way whatever its place in the list — the
 *  last's stretch included (THE TRAIL). */
const expectRail = (rail: HTMLElement, lit: number | null): void => {
  for (const [index, idea] of ideasOf(rail).entries()) {
    const { stretch, dot } = partsOf(idea);
    if (lit === null) {
      expect(idea).not.toHaveAttribute('data-current');
      expect(idea.className).toBe(IDEA_NEUTRAL);
      expect(stretch.className).toBe(STRETCH_REST);
      expect(dot.className).toBe(DOT_REST);
    } else if (index === lit) {
      expect(idea).toHaveAttribute('data-current', '');
      expect(idea.className).toBe(IDEA_LIT);
      expect(stretch.className).toBe(STRETCH_LIT);
      expect(dot.className).toBe(DOT_LIT);
    } else {
      expect(idea).not.toHaveAttribute('data-current');
      expect(idea.className).toBe(IDEA_IDLE);
      expect(stretch.className).toBe(STRETCH_REST);
      expect(dot.className).toBe(DOT_REST);
    }
  }
};

/** The source with its prose removed — the island guards below police code,
 *  not the header that discusses `aria-live` and `'use client'` by name. */
const CODE = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');

beforeEach(() => {
  FakeObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', FakeObserver);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CourseTimeline — §16 rule 2: the static HTML is the NEUTRAL rail', () => {
  it('server-renders every idea neutral — nothing lit, nothing faded, nothing forward', () => {
    // renderToString IS the static export's render: no effect runs, the
    // ring's frozen server snapshot is idle, so what a crawler, a no-JS
    // visitor and hydration all see is the plain CV — every idea in full ink,
    // every stretch and every dot grey.
    const html = renderToString(
      <CourseTimeline items={IDEAS} intervalMs={INTERVAL} />,
    );

    expect(html).not.toContain('data-current');
    expect(html).not.toContain('opacity-65');
    expect(html).not.toContain('scale-104');
    expect(html).not.toContain('scale-125');
    expect(html).not.toContain('accent-decorative');
    expect(html).not.toContain('animate-');
    expect(html).not.toContain('aria-current');
    expect(html.match(/ transition-\[opacity,scale\]"/g)).toHaveLength(
      IDEAS.length,
    );
    expect(html.match(/ bg-line"/g)).toHaveLength(IDEAS.length * 2);

    const host = document.createElement('div');
    host.innerHTML = html;
    expectRail(railOf(host), null);
  });

  it('hydrates that HTML with no mismatch, then lights the first idea once the ring starts', () => {
    // A mismatch would surface as a recoverable error (React 19 re-renders on
    // the client) — none may: the browser's first render is the server's
    // neutral rail. The first light comes one render later, after start().
    stubReducedMotion(false);
    const host = document.createElement('div');
    document.body.append(host);
    host.innerHTML = renderToString(
      <CourseTimeline items={IDEAS} intervalMs={INTERVAL} />,
    );
    const recoverable = vi.fn();

    let root: Root | undefined;
    act(() => {
      root = hydrateRoot(
        host,
        <CourseTimeline items={IDEAS} intervalMs={INTERVAL} />,
        { onRecoverableError: recoverable },
      );
    });

    expect(recoverable).not.toHaveBeenCalled();
    expectRail(railOf(host), 0);
    act(() => root?.unmount());
    host.remove();
  });
});

describe('CourseTimeline — the light moves on by itself (ui/use-rotation)', () => {
  it('lights the first idea after mount, every other one receding', () => {
    stubReducedMotion(false);
    const { container } = mount();

    expectRail(railOf(container), 0);
  });

  it('hands the light to the next idea after exactly one interval', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const { container } = mount();
    const rail = railOf(container);

    advance(INTERVAL - 1);
    expectRail(rail, 0);
    advance(1);
    expectRail(rail, 1);
  });

  it('circles — from the last idea back to the first, one light at a time', () => {
    // The owner's "circle automatically through the ideas": lib/rotation's
    // wrapIndex, never a stop at the end.
    vi.useFakeTimers();
    stubReducedMotion(false);
    const { container } = mount();
    const rail = railOf(container);

    const seen: (number | null)[] = [litIndex(rail)];
    for (let step = 0; step < IDEAS.length + 1; step += 1) {
      advance(INTERVAL);
      seen.push(litIndex(rail));
    }
    expect(seen).toEqual([0, 1, 2, 3, 0, 1]);
  });

  it('keeps the words and the outline the same in every state — one list, no heading, nothing navigational', () => {
    // The light is visual emphasis only (the header's NOT THE APG CAROUSEL):
    // a screen reader reads the same list whichever idea is lit.
    vi.useFakeTimers();
    stubReducedMotion(false);
    const { container } = mount();
    const rail = railOf(container);
    const words = (): string[] =>
      within(rail)
        .getAllByRole('listitem')
        .map((idea) => idea.textContent ?? '');

    const before = words();
    advance(INTERVAL);
    expect(words()).toEqual(before);
    expect(words()).toEqual([...IDEAS]);
    expect(screen.getAllByRole('list')).toEqual([rail]);
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
    for (const attribute of [
      'aria-current',
      'aria-live',
      'aria-roledescription',
      'inert',
      'aria-label',
    ]) {
      expect(container.querySelector(`[${attribute}]`), attribute).toBeNull();
    }
  });
});

describe('CourseTimeline — THE OFF-SCREEN HOLD (lib/clock’s `offscreen` cause)', () => {
  it('watches the rail — ONE observer, the <ul> its one target, the platform’s defaults', () => {
    stubReducedMotion(false);
    const { container } = mount();

    expect(observer().targets).toEqual([railOf(container)]);
    expect(observer().options).toBeUndefined();
  });

  it('holds the lit idea while the rail is out of view — then a FULL interval once it is back', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const { container } = mount();
    const rail = railOf(container);

    advance(INTERVAL);
    expectRail(rail, 1);

    // Scrolled away: the light holds where it was, through many intervals.
    observer().fire(false);
    advance(INTERVAL * 10);
    expectRail(rail, 1);

    // Back in view: still that idea, until a whole interval has passed.
    observer().fire(true);
    advance(INTERVAL - 1);
    expectRail(rail, 1);
    advance(1);
    expectRail(rail, 2);
  });

  it('holds from mount when the rail starts below the fold — the cycle begins once it is seen', () => {
    // The doctor page's usual case: the block is third on the page.
    vi.useFakeTimers();
    stubReducedMotion(false);
    const { container } = mount();
    const rail = railOf(container);

    observer().fire(false);
    advance(INTERVAL * 10);
    expectRail(rail, 0);

    observer().fire(true);
    advance(INTERVAL - 1);
    expectRail(rail, 0);
    advance(1);
    expectRail(rail, 1);
  });

  it('keeps the first dwell for a rail already on screen — a resume while running changes nothing', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const { container } = mount();
    const rail = railOf(container);

    advance(400);
    observer().fire(true);
    advance(INTERVAL - 400 - 1);
    expectRail(rail, 0);
    advance(1);
    expectRail(rail, 1);
  });

  it('applies a callback’s entries in order — the newest has the last word', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const { container } = mount();
    const rail = railOf(container);

    // Out, then back in, within one delivery: running again, a full interval
    // from the delivery.
    advance(400);
    observer().fire(false, true);
    advance(INTERVAL - 1);
    expectRail(rail, 0);
    advance(1);
    expectRail(rail, 1);

    // In, then out: held.
    observer().fire(true, false);
    advance(INTERVAL * 5);
    expectRail(rail, 1);
  });

  it('runs without a hold where the platform has no IntersectionObserver', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    vi.stubGlobal('IntersectionObserver', undefined);
    const { container } = mount();

    advance(INTERVAL);
    expectRail(railOf(container), 1);
  });

  it('disconnects the observer on unmount — and an entry queued before it changes nothing', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const { unmount } = mount();
    const queued = observer();

    unmount();
    expect(queued.disconnected).toBe(true);
    expect(vi.getTimerCount()).toBe(0);

    // The spec delivers entries already queued even after `disconnect()`:
    // they land on a disposed ring, where suspend and resume do nothing.
    queued.fire(true);
    queued.fire(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('CourseTimeline — nothing lights where nothing may move (the NEUTRAL rail)', () => {
  it('stays neutral forever under reduced motion — no light, no fade, no timer', () => {
    vi.useFakeTimers();
    stubReducedMotion(true);
    const { container } = mount();
    const rail = railOf(container);

    expectRail(rail, null);
    expect(vi.getTimerCount()).toBe(0);
    advance(INTERVAL * 10);
    expectRail(rail, null);
    // Coming into view starts nothing either: lib/clock declined the start.
    observer().fire(true);
    advance(INTERVAL * 10);
    expectRail(rail, null);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('snaps to neutral when the visitor turns reduced motion ON mid-visit', () => {
    // The one path that reaches the classes' `motion-reduce:` belt (the
    // header's THE CLOCKS): lib/clock watches the preference and idles.
    vi.useFakeTimers();
    const preference = stubReducedMotion(false);
    const { container } = mount();
    const rail = railOf(container);

    advance(INTERVAL);
    expectRail(rail, 1);
    preference.turnOn();
    expectRail(rail, null);
    advance(INTERVAL * 10);
    expectRail(rail, null);
  });

  it('stays neutral for a single idea — there is nothing to hand the light to', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const { container } = mount({ items: [IDEAS[3]] });
    const rail = railOf(container);

    expectRail(rail, null);
    // Its stretch trails like every idea's — ONE recipe (THE TRAIL).
    expect(partsOf(ideasOf(rail)[0]).stretch.className).toBe(STRETCH_REST);
    advance(INTERVAL * 10);
    expectRail(rail, null);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('CourseTimeline — the rail (D34: the line on the left; D44c: one stretch per idea; D50: a break above every dot)', () => {
  it('is ONE `<ul role="list">` of the ideas, 40px apart — `gap-10`, half the old 5rem', () => {
    // `role="list"` is LOAD-BEARING (the header's SEMANTICS): no bullets, so
    // preflight's `list-style: none` stands and WebKit would drop the list.
    stubReducedMotion(false);
    const { container } = mount();
    const rail = railOf(container);

    expect(rail.tagName).toBe('UL');
    expect(rail).toHaveAttribute('role', 'list');
    expect(rail.className).toBe(RAIL);
    expect(ideasOf(rail).map((idea) => idea.tagName)).toEqual(
      IDEAS.map(() => 'LI'),
    );
  });

  it('gives every idea its stretch, then its dot, then its words — the two spans empty, aria-hidden paint', () => {
    // The stretch FIRST, so the dot paints over it (tree order).
    stubReducedMotion(false);
    const { container } = mount();
    const rail = railOf(container);

    for (const [index, idea] of ideasOf(rail).entries()) {
      const { stretch, dot } = partsOf(idea);
      expect(idea.children).toHaveLength(2);
      for (const paint of [stretch, dot]) {
        expect(paint.tagName).toBe('SPAN');
        expect(paint).toHaveAttribute('aria-hidden', 'true');
        expect(paint).toBeEmptyDOMElement();
      }
      // The words are the idea's own text node, after the paint.
      expect(idea.lastChild?.nodeType).toBe(Node.TEXT_NODE);
      expect(idea.textContent).toBe(IDEAS[index]);
    }
    // Pure paint, nothing to read: the stretches and the dots, nothing else.
    expect([...rail.querySelectorAll('[aria-hidden]')]).toEqual(
      ideasOf(rail).flatMap((idea) => {
        const { stretch, dot } = partsOf(idea);
        return [stretch, dot];
      }),
    );
  });

  it('gives EVERY stretch the one reach, the last idea’s included — reach = gap − 1, KEEP-IN-SYNC (D50), and under the last idea the trail', () => {
    // A stretch runs 2.25rem down past its idea. Where another idea follows,
    // that is 0.25rem short of its top, so it never runs under the next dot:
    // `-bottom-R` must equal `gap-G` − 1, or the break above every dot grows
    // (a wider gap) or closes (a narrower one). Under the LAST idea the same
    // reach is THE TRAIL — the owner's "stable trail … like the other ideas
    // have" (round 7's pack, 2026-10-13) — so it is pinned on EVERY stretch,
    // the last's included. Read off the RENDERED classes, so the relation is
    // checked as it ships, not as this file spells it.
    stubReducedMotion(false);
    const { container } = mount();
    const rail = railOf(container);
    const step = (classes: string, prefix: string): number =>
      Number(
        new RegExp(`(?:^| )${prefix}(\\d+(?:\\.\\d+)?)(?: |$)`).exec(
          classes,
        )?.[1],
      );
    const gap = step(rail.className, 'gap-');
    const ideas = ideasOf(rail);

    expect(gap).toBe(10);
    // Never vacuous: the last idea is among the stretches read.
    expect(ideas).toHaveLength(IDEAS.length);
    for (const idea of ideas) {
      expect(step(partsOf(idea).stretch.className, '-bottom-')).toBe(gap - 1);
    }
    // ONE recipe, no branch on the idea's place in the list: the island
    // never asks which idea is the last, and no stretch ends at its own box.
    expect(CODE).not.toMatch(/\bisLast\b|items\.length - 1|\bbottom-0\b/);
  });

  it('seats the dot on the first line’s centre and starts the stretch at the dot’s centre — top-2 + half of size-3 = top-3.5', () => {
    // `text-lg` is 18px on a 28px line box, so the first line's centre is
    // 3.5 spacing units down; the dot's `top-2` + half its `size-3` lands
    // there, and the stretch's `top-3.5` begins at that same point, under
    // the dot (the header's RAIL). Read off the rendered classes; the stories
    // measure it.
    stubReducedMotion(false);
    const { container } = mount();

    for (const idea of ideasOf(railOf(container))) {
      const { stretch, dot } = partsOf(idea);
      expect(idea.className.split(' ')).toContain('text-lg');
      expect(dot.className.split(' ')).toEqual(
        expect.arrayContaining(['top-2', 'size-3']),
      );
      expect(stretch.className.split(' ')).toContain('top-3.5');
    }
  });

  it('keys every idea by its own words — a reorder MOVES the <li>s, never re-labels them', () => {
    // With an index key React would keep each <li> in place and rewrite its
    // text; keyed by the words, each <li> travels with its idea.
    stubReducedMotion(false);
    const { container, rerender } = mount();
    const rail = railOf(container);
    const before = new Map(
      ideasOf(rail).map((idea) => [idea.textContent, idea] as const),
    );

    const reordered = [IDEAS[2], IDEAS[0], IDEAS[3], IDEAS[1]];
    rerender(<CourseTimeline items={reordered} intervalMs={INTERVAL} />);

    const after = ideasOf(rail);
    expect(after.map((idea) => idea.textContent)).toEqual(reordered);
    for (const idea of after) {
      expect(idea).toBe(before.get(idea.textContent));
    }
  });
});

describe('CourseTimeline — every length a theme step, in every state (the band-scale audit)', () => {
  it('spells no arbitrary length, and the dots’ 4px ring is the one px utility — so the design pixel reaches the whole rail', () => {
    // sections/DoctorProfile's rhythm box wears the band scale (CLAUDE.md
    // §15.32 round 4) and this rail stands inside it: the design pixel
    // redraws the theme's variables — the spacing step, the text steps — so
    // every length spelled on a step grows and shrinks with the band, and a
    // length spelled as a bracketed literal would not. Read in all three
    // states: neutral (a separate mount) and an idea lit beside idle ones.
    // The only bracketed classes are the two per-state transition LISTS (THE
    // CLOCKS), none a length; the only fixed-px utility is the dots'
    // `ring-4`, which stays 4px by design.
    vi.useFakeTimers();
    stubReducedMotion(false);
    const { container } = mount();
    // A second stub for the second mount: the first ring keeps its light (the
    // first stub's listeners are never told), the second never lights.
    stubReducedMotion(true);
    const { container: neutral } = mount();
    expect(litOf(railOf(container))).toHaveLength(1);
    expect(litOf(railOf(neutral))).toHaveLength(0);

    const tokens = [container, neutral].flatMap((host) =>
      [...host.querySelectorAll('*')].flatMap((element) =>
        (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean),
      ),
    );
    const distinct = (list: string[]): string[] =>
      [...new Set(list)].toSorted();

    // Never vacuous: all three states' classes are really read.
    expect(tokens).toEqual(
      expect.arrayContaining(['scale-104', 'opacity-65', 'top-2', 'gap-10']),
    );
    expect(
      tokens.filter((token) => token === 'transition-[opacity,scale]'),
    ).not.toHaveLength(0);
    expect(distinct(tokens.filter((token) => token.includes('[')))).toEqual([
      'transition-[background-color,scale]',
      'transition-[opacity,scale]',
    ]);
    expect(
      distinct(
        tokens.filter((token) =>
          /(^|:)-?(border|ring|outline|divide|ring-offset|outline-offset|underline-offset|decoration)(-[xytrblse])?(-\d+)?$|-px$/.test(
            token,
          ),
        ),
      ),
    ).toEqual(['ring-4']);
  });
});

describe('CourseTimeline — source pins (§16)', () => {
  it('is a client island: the directive is its first statement', () => {
    expect(CODE.trimStart()).toMatch(/^['"]use client['"];/);
  });

  it('imports react, ui/use-rotation and lib/cx — nothing else, and no scroll position', () => {
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/components/ui/use-rotation',
      '@/lib/cx/cx',
      'react',
    ]);
    // The scroll-driven light of rounds 2g–2k is history (the header).
    expect(CODE).not.toMatch(/scroll-spy|createScrollSpy/);
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('builds ONE ring through the shared shell, its count the ideas and its rhythm the block’s', () => {
    expect(CODE.match(/\buseRotation\(/g)).toHaveLength(1);
    expect(CODE).toMatch(
      /useRotation\(\{\s*count: items\.length,\s*intervalMs,\s*\}\)/,
    );
    expect(CODE).not.toMatch(/\bcreateRotation\b|\bcreateClock\b/);
  });

  it('holds for the off-screen cause alone — no pointer manners, no focus manners, nothing to press', () => {
    // The header's NO POINTER, NO FOCUS MANNERS: the owner's rotators hold
    // for nobody, and nothing in the rail is focusable.
    expect(CODE).toMatch(/rotation\.resume\('offscreen'\)/);
    expect(CODE).toMatch(/rotation\.suspend\('offscreen'\)/);
    expect(CODE.match(/\.(suspend|resume)\(/g)).toHaveLength(2);
    expect(CODE).toMatch(/typeof IntersectionObserver === 'undefined'/);
    expect(CODE).not.toMatch(/focusManners|pointerManners|handNavigation/);
    expect(CODE).not.toMatch(/\bon[A-Z]\w*=/);
    expect(CODE).not.toMatch(/\.(pause|play|next|prev|goto)\(/);
  });

  it('carries none of the APG carousel’s markup — nothing is hidden, nothing navigates', () => {
    // The header's NOT THE APG CAROUSEL.
    expect(CODE).not.toMatch(
      /aria-live|aria-roledescription|aria-current|\binert\b|tabIndex/,
    );
    expect(CODE).not.toMatch(/\bliveRegion\b|\brotationControl\b/);
  });

  it('formats nothing and knows no language', () => {
    expect(CODE).not.toMatch(/\bIntl\b/);
    expect(CODE).not.toMatch(/next-intl|\buseTranslations\b|\bt\(/);
    expect(CODE).not.toMatch(/@\/lib\/(clinic|prices|reviews|team|routes)/);
  });

  it('names nothing of THE BAND SCALE — DoctorProfile’s rhythm box wears it, and the remapped theme reaches every class here', () => {
    // Naming the scale here would be a second spelling
    // (tests/unit/design-scale.test.ts holds every product file to one), and
    // wearing it again would compute a second, unzoomed pixel.
    expect(CODE).not.toMatch(/scalable:|design-scale|--scale-px/);
    expect(CODE).not.toMatch(
      /bandScaleClasses|bandColumnClasses|--band-zoom|--band-floor/,
    );
  });
});

describe('CourseTimeline — the tokens its animations are minted from (globals.css @theme)', () => {
  // Tailwind v4 mints `animate-forward` / `animate-pop` from `--animate-*`
  // declarations inside `@theme` and emits their keyframes only where worn:
  // a renamed or deleted token would leave the class silently inert (no
  // runtime error, no lint error), so the source text is the guard. Comments
  // are stripped first — the token layer explains itself in prose that names
  // both values.
  const css = globalsCss.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\s+/g, ' ');
  const theme = css.slice(
    css.indexOf('@theme {'),
    css.indexOf('@theme inline'),
  );

  it('declares --animate-forward inside @theme — the overshoot RELATIVE to the wearer’s scale-104: 0.9615 → 1.0192 → 1, drawn 1 → ~1.06 (measured ~1.065) → 1.04 (D44c, react F1)', () => {
    // The lit idea WEARS its settled 1.04 as `scale-104`, a transitioned
    // property, so an idea that loses the light can ease back to 1; the
    // animation multiplies with it on `transform` and carries only the
    // overshoot — the drawn sizes divided by 1.04, ending at 1.
    expect(css.indexOf('@theme {')).toBeGreaterThanOrEqual(0);
    expect(theme).toContain(
      '--animate-forward: forward 450ms cubic-bezier(0.2, 0.9, 0.3, 1.25) both;',
    );
    expect(theme).toContain(
      '@keyframes forward { from { transform: scale(0.9615); } 60% { transform: scale(1.0192); } to { transform: scale(1); } }',
    );
  });

  it('keeps those keyframes and the lit idea’s scale-104 in step — drawn 1 at the start, 1.06 at the 60 % keyframe, 1.04 settled (KEEP-IN-SYNC)', () => {
    // Two numbers in two files, one relation: the keyframes are the drawn
    // sizes over the size the island's lit idea wears. Read BOTH off their
    // sources, so a retuned `scale-*` without its keyframes (or the reverse)
    // fails here instead of drawing an idea that jumps at the swap or
    // settles at the wrong size.
    const keyframes = theme.slice(theme.indexOf('@keyframes forward'));
    const frame = (selector: string): number => {
      const opening = `${selector} { transform: scale(`;
      const start = keyframes.indexOf(opening);
      expect(start).toBeGreaterThanOrEqual(0);
      const value = start + opening.length;
      return Number(keyframes.slice(value, keyframes.indexOf(')', value)));
    };
    const worn = /\blit:\s*'([^']*)'/.exec(CODE)?.[1] ?? '';
    const size =
      Number(/(?:^| )scale-(\d+)(?: |$)/.exec(worn)?.[1] ?? Number.NaN) / 100;

    expect(worn).toContain('animate-forward');
    expect(size).toBe(1.04);
    expect(frame('from') * size).toBeCloseTo(1, 3);
    expect(frame('60%') * size).toBeCloseTo(1.06, 3);
    expect(frame('to')).toBe(1);
  });

  it('still declares --animate-pop inside @theme — the lit dot’s (D36)', () => {
    expect(theme).toContain(
      '--animate-pop: pop 450ms cubic-bezier(0.2, 0.9, 0.3, 1.25) both;',
    );
    expect(theme).toContain(
      '@keyframes pop { from { transform: scale(0.7); } 60% { transform: scale(1.25); } to { transform: scale(1); } }',
    );
  });

  it('declares both AFTER the aura — the aura pin reads @theme to its first brace', () => {
    // tests/unit/aura-token.test.ts slices @theme up to its first `}`; a
    // keyframes block moved above the aura would truncate that slice.
    const aura = theme.indexOf('--shadow-aura:');
    expect(aura).toBeGreaterThanOrEqual(0);
    expect(theme.indexOf('--animate-pop:')).toBeGreaterThan(aura);
    expect(theme.indexOf('--animate-forward:')).toBeGreaterThan(aura);
    expect(theme.indexOf('}')).toBeGreaterThan(aura);
  });

  it('wears the forward motion and the pop ONLY with their reduced-motion pair (§9)', () => {
    // Source-level: every `animate-*` token in this island's code travels in
    // the same string as `motion-reduce:animate-none`.
    const wearers = [
      ...CODE.matchAll(/'[^'\n]*animate-(?:forward|pop)[^'\n]*'/g),
    ];
    expect(wearers.length).toBe(2);
    for (const [string] of wearers) {
      expect(string).toContain('motion-reduce:animate-none');
    }
  });
});

describe('CourseTimeline — type-level pins', () => {
  it('takes the finished ideas and the rhythm, nothing else — strings and a number cross', () => {
    expectTypeOf<CourseTimelineProps>().toEqualTypeOf<
      Readonly<{ items: readonly string[]; intervalMs: number }>
    >();
  });
});
