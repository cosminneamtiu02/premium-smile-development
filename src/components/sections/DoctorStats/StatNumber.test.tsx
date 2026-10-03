import { act, render, screen } from '@testing-library/react';
// The real stylesheet, for the one test that MEASURES the twin's box (THE
// TWIN): tests/setup/components.ts loads no CSS globally, and the per-file
// import is the house pattern (Card, Avatar, SpeedDial, the shell).
import '@/styles/globals.css';
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
import { countFrames } from './DoctorStats';
import {
  COUNT_DURATION_MS,
  StatNumber,
  type CountFrames,
  type StatNumberProps,
} from './StatNumber';
import source from './StatNumber.tsx?raw';

// sections/DoctorStats/StatNumber — the island's suite (D31). It runs in the
// components project's real Chromium, so everything the island touches is the
// platform's own — EXCEPT the three things a test must hold still:
//   · `matchMedia`, stubbed per test, so the reduced-motion branch is chosen
//     by the test and not by the machine's settings (lib/reduced-motion reads
//     `window.matchMedia` on every call, never a cached list);
//   · `IntersectionObserver`, replaced by FakeObserver below, so "the tile
//     scrolled half into view" is a call the test makes rather than a layout
//     it hopes for;
//   · the clock — Vitest's fake timers, whose default set fakes
//     `requestAnimationFrame` and `performance` in the browser too: each
//     `advanceTimersByTime(16)` runs one frame, and the frame's timestamp is
//     the fake `performance.now()`, which is exactly what the island reads.
// Every advance runs inside act(): the island sets state from a frame
// callback, and React Testing Library runs with the act environment on.
//
// Fixtures are Romanian (§15.7): the frames are built by the BAND's own
// `countFrames` with the Romanian formatter, so this suite sees the strings
// the page would really send („3.000"), and SPOKEN is what the band would
// compose for a „+" tile from the page's `atLeast` word („peste 3.000", round
// 2s); the one formatter that is not Romanian is the `X${n}` probe, which
// exists to prove that every visible number came from the page's formatter
// and none from the island.

const RO = (value: number): string => new Intl.NumberFormat('ro').format(value);
const FRAMES = countFrames(3000, RO);
const FINAL = '3.000';
const SUFFIX = '+';
/** What the band hands the island for a „+" tile (round 2s): the page's
 *  `atLeast` word before the page's number — never „3.000+", never the sign. */
const SPOKEN = 'peste 3.000';

/** The island's box and its two spans — the visible count and the twin laid
 *  over it (THE TWIN). Reached by structure: the visible one is aria-hidden
 *  on purpose and has no role. */
const spans = (container: HTMLElement) => {
  const box = container.firstElementChild as HTMLElement;
  const [visible, twin] = [...box.children] as HTMLElement[];
  return { box, visible, twin };
};

/** The twin's classes since 2026-10-01: the digits' own box, invisible, on
 *  one line, clipped and unselectable — never `sr-only` again (THE TWIN). */
const TWIN_CLASSES =
  'absolute inset-0 overflow-hidden whitespace-nowrap opacity-0 select-none';

/** One frame on the fake clock: rAF fires on 16 ms boundaries. */
const FRAME_MS = 16;
const frame = (): void => {
  act(() => {
    vi.advanceTimersByTime(FRAME_MS);
  });
};

/** A stand-in IntersectionObserver the test drives by hand. */
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

  /** Deliver one entry per target at the given visible share — even after
   *  `disconnect()`, as the spec allows for entries already queued. */
  fire(ratio: number): void {
    const entries = this.targets.map(
      (target) =>
        ({
          target,
          isIntersecting: ratio > 0,
          intersectionRatio: ratio,
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

const stubReducedMotion = (reduce: boolean): void => {
  vi.stubGlobal(
    'matchMedia',
    (query: string): MediaQueryList =>
      ({
        matches: reduce && query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
};

const mount = (props: Partial<StatNumberProps> = {}) =>
  render(
    <StatNumber frames={FRAMES} suffix={SUFFIX} spoken={SPOKEN} {...props} />,
  );

beforeEach(() => {
  FakeObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', FakeObserver);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('StatNumber — §16 rule 2: the static HTML prints the FINAL value', () => {
  it('server-renders the final value in the visible span and the spoken form in the twin, the visible one aria-hidden', () => {
    // renderToString IS the static export's render: no effect runs, so what
    // it prints is what a crawler and a no-JS visitor get — and what a
    // screen reader hears before any script (round 2s: the spoken form).
    const host = document.createElement('div');
    host.innerHTML = renderToString(
      <StatNumber frames={FRAMES} suffix={SUFFIX} spoken={SPOKEN} />,
    );

    const { box, visible, twin } = spans(host);
    // ONE box, the digits' own, holding the two spans (THE TWIN).
    expect(host.children).toHaveLength(1);
    expect(box.tagName).toBe('SPAN');
    expect(box.className).toBe('relative inline-block');
    expect(box.children).toHaveLength(2);
    expect(visible.tagName).toBe('SPAN');
    expect(visible).toHaveAttribute('aria-hidden', 'true');
    expect(visible.textContent).toBe(`${FINAL}${SUFFIX}`);
    expect(twin.tagName).toBe('SPAN');
    expect(twin.className).toBe(TWIN_CLASSES);
    expect(twin).toHaveAttribute('data-spoken', '');
    expect(twin).not.toHaveAttribute('aria-hidden');
    expect(twin.textContent).toBe(SPOKEN);
  });

  it('hydrates that HTML with no mismatch, still showing the final value', () => {
    stubReducedMotion(false);
    const host = document.createElement('div');
    document.body.append(host);
    host.innerHTML = renderToString(
      <StatNumber frames={FRAMES} suffix={SUFFIX} spoken={SPOKEN} />,
    );
    const recoverable = vi.fn();

    let root: Root | undefined;
    act(() => {
      root = hydrateRoot(
        host,
        <StatNumber frames={FRAMES} suffix={SUFFIX} spoken={SPOKEN} />,
        { onRecoverableError: recoverable },
      );
    });

    // A mismatch would surface here (React 19 reports it as a recoverable
    // error and re-renders on the client) — none may.
    expect(recoverable).not.toHaveBeenCalled();
    expect(spans(host).visible.textContent).toBe(`${FINAL}${SUFFIX}`);
    expect(spans(host).twin.textContent).toBe(SPOKEN);
    act(() => root?.unmount());
    host.remove();
  });

  it('prints the final value on the first client render, before any count', () => {
    stubReducedMotion(false);
    const { container } = mount();

    const { visible, twin } = spans(container);
    expect(visible.textContent).toBe(`${FINAL}${SUFFIX}`);
    expect(twin.textContent).toBe(SPOKEN);
    // …and mounting alone starts nothing: the observer is waiting.
    expect(observer().targets).toEqual([visible]);
  });

  it('prints no suffix when none is given — an exact count, spoken as the number alone', () => {
    // The band hands a suffix-less tile its formatted value as `spoken`.
    stubReducedMotion(false);
    const { container } = mount({ suffix: undefined, spoken: FINAL });

    expect(spans(container).visible.textContent).toBe(FINAL);
    expect(spans(container).twin.textContent).toBe(FINAL);
  });
});

describe('StatNumber — THE TWIN says `spoken` and nothing else (round 2s)', () => {
  it('is the spoken form, never the suffix — the eye keeps the sign, the ear gets the word', () => {
    // The owner's decision, 2026-09-27: „3.000+" on screen, „peste 3.000"
    // in the screen reader; the two differ on purpose.
    stubReducedMotion(false);
    const { container } = mount();
    const { visible, twin } = spans(container);

    expect(visible.textContent).toBe(`${FINAL}${SUFFIX}`);
    expect(twin.textContent).toBe(SPOKEN);
    expect(twin.textContent).not.toContain(SUFFIX);
    expect(twin.textContent).not.toBe(visible.textContent);
  });

  it('adds nothing of its own — a probe string comes back byte for byte, in one text node', () => {
    // A string no band would compose: had the island appended the suffix,
    // or any word, the twin would not equal it.
    stubReducedMotion(false);
    const { container } = mount({ spoken: 'Z' });
    const { twin } = spans(container);

    expect(twin.textContent).toBe('Z');
    expect(twin.childNodes).toHaveLength(1);
    expect(twin.firstChild?.nodeType).toBe(Node.TEXT_NODE);
  });
});

describe('StatNumber — reduced motion: no animation is the answer', () => {
  it('never observes, never schedules a frame, never changes the number', () => {
    vi.useFakeTimers();
    stubReducedMotion(true);
    const { container } = mount();

    expect(FakeObserver.instances).toHaveLength(0);
    act(() => {
      vi.advanceTimersByTime(COUNT_DURATION_MS * 2);
    });
    expect(vi.getTimerCount()).toBe(0);
    expect(spans(container).visible.textContent).toBe(`${FINAL}${SUFFIX}`);
    expect(spans(container).twin.textContent).toBe(SPOKEN);
  });

  it('asks again when the count would start — a preference turned on after mount stops it (G2-R2 tier 2, react F2)', () => {
    // Motion allowed at mount, so the island observes; the visitor then
    // turns "reduce motion" on while reading the bands above, and the tile
    // arrives half on screen afterwards. The count must not start.
    vi.useFakeTimers();
    stubReducedMotion(false);
    const { container } = mount();
    expect(observer().targets).toEqual([spans(container).visible]);

    stubReducedMotion(true);
    observer().fire(0.6);

    // The first entry over the share still ends the observation…
    expect(observer().disconnected).toBe(true);
    // …but no frame is scheduled, now or later, and the number never moves.
    expect(vi.getTimerCount()).toBe(0);
    act(() => {
      vi.advanceTimersByTime(COUNT_DURATION_MS * 2);
    });
    expect(vi.getTimerCount()).toBe(0);
    expect(spans(container).visible.textContent).toBe(`${FINAL}${SUFFIX}`);
    expect(spans(container).twin.textContent).toBe(SPOKEN);

    // The decision was taken once: a later entry, the preference off again,
    // starts nothing either.
    stubReducedMotion(false);
    observer().fire(1);
    frame();
    expect(vi.getTimerCount()).toBe(0);
    expect(spans(container).visible.textContent).toBe(`${FINAL}${SUFFIX}`);
  });
});

describe('StatNumber — the count (D31)', () => {
  it('samples the count at 30 steps a second — COUNT_STEPS ↔ COUNT_DURATION_MS, the KEEP-IN-SYNC pair (G2-R2 tier 2, typescript F2)', () => {
    // COUNT_STEPS (DoctorStats.tsx, the band's sampling of the curve) and
    // COUNT_DURATION_MS (this island's clock) name each other, and each
    // VALUE is pinned elsewhere; this pins what the pair exists for. Move
    // one without the other and the count stutters (15 a second at 3 s) or
    // skips frames, while both value pins stay green. COUNT_STEPS is read
    // through the frames it produces, so it need not be exported: one rising
    // frame per step, plus the final value.
    expect(countFrames(1, String).length - 1).toBe(
      (COUNT_DURATION_MS / 1000) * 30,
    );
  });

  it('waits until HALF the number is on screen', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const { container } = mount();

    expect(observer().options).toEqual({ threshold: 0.5 });
    observer().fire(0.3);
    expect(observer().disconnected).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    frame();
    expect(spans(container).visible.textContent).toBe(`${FINAL}${SUFFIX}`);
  });

  it('counts from 0 up to the final value once half is in view, the twin never moving', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const { container } = mount();
    const twinAtRest = spans(container).twin;

    observer().fire(0.6);
    // The first entry at or over the share ends the observation for good.
    expect(observer().disconnected).toBe(true);

    const seen: string[] = [];
    for (let elapsed = 0; elapsed <= COUNT_DURATION_MS + FRAME_MS * 2;) {
      frame();
      elapsed += FRAME_MS;
      const { visible, twin } = spans(container);
      seen.push(visible.textContent ?? '');
      // What the screen reader hears is the SPOKEN final at every moment
      // (round 2s): the same node, the same words, never a count and never
      // the sign.
      expect(twin).toBe(twinAtRest);
      expect(twin.textContent).toBe(SPOKEN);
      expect(twin.textContent).not.toContain(SUFFIX);
    }

    // It started at the first frame, from 0…
    expect(seen[0]).toBe(`0${SUFFIX}`);
    // …climbed through numbers the band's frames hold, never downwards…
    const numbers = seen.map((text) => Number(text.replace(/\D/g, '')));
    for (let index = 1; index < numbers.length; index += 1) {
      expect(numbers[index]).toBeGreaterThanOrEqual(numbers[index - 1]);
    }
    expect(new Set(seen).size).toBeGreaterThan(10);
    for (const text of seen) {
      expect(FRAMES).toContain(text.slice(0, -SUFFIX.length));
    }
    // …and landed on the final value, with nothing left scheduled.
    expect(seen.at(-1)).toBe(`${FINAL}${SUFFIX}`);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('runs for COUNT_DURATION_MS: a frame still pending just before, none just after', () => {
    // The loop's LENGTH is asserted, not the text near its end: the ease-out
    // curve rounds onto the final number a few steps early (for 3000 from
    // ~94 % of the time), which is the settling the easing exists for.
    vi.useFakeTimers();
    stubReducedMotion(false);
    const { container } = mount();
    observer().fire(1);

    frame(); // the first frame — the count's start
    act(() => {
      vi.advanceTimersByTime(COUNT_DURATION_MS / 2);
    });
    // Half the time in, well under the final value.
    expect(spans(container).visible.textContent).not.toBe(`${FINAL}${SUFFIX}`);
    act(() => {
      vi.advanceTimersByTime(COUNT_DURATION_MS / 2 - FRAME_MS * 2);
    });
    expect(vi.getTimerCount()).toBe(1); // still running
    act(() => {
      vi.advanceTimersByTime(FRAME_MS * 3);
    });
    expect(vi.getTimerCount()).toBe(0); // ended
    expect(spans(container).visible.textContent).toBe(`${FINAL}${SUFFIX}`);
  });

  it('shows ONLY the page formatter’s strings — the island formats nothing', () => {
    // The `X${n}` probe: a formatter no Intl locale could ever produce. If the
    // island formatted a single frame itself, that frame would lack the X.
    vi.useFakeTimers();
    stubReducedMotion(false);
    const probe = vi.fn((value: number) => `X${value}`);
    const frames = countFrames(3000, probe);
    // The band would compose the spoken form from the same formatter.
    const { container } = mount({ frames, spoken: 'peste X3000' });
    observer().fire(1);

    const seen = new Set<string>();
    for (let elapsed = 0; elapsed <= COUNT_DURATION_MS + FRAME_MS;) {
      frame();
      elapsed += FRAME_MS;
      seen.add(spans(container).visible.textContent ?? '');
    }

    expect(seen.size).toBeGreaterThan(10);
    for (const text of seen) expect(text).toMatch(/^X\d+\+$/);
    expect(spans(container).visible.textContent).toBe('X3000+');
    expect(spans(container).twin.textContent).toBe('peste X3000');
  });

  it('counts ONCE — a second entry, even one the platform had queued, starts nothing', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const { container } = mount();
    observer().fire(1);
    act(() => {
      vi.advanceTimersByTime(COUNT_DURATION_MS + FRAME_MS * 2);
    });
    expect(spans(container).visible.textContent).toBe(`${FINAL}${SUFFIX}`);

    observer().fire(1);
    expect(vi.getTimerCount()).toBe(0);
    frame();
    expect(spans(container).visible.textContent).toBe(`${FINAL}${SUFFIX}`);
  });

  it('lands on the final value when the frames resume late (a tab hidden mid-count)', () => {
    // A hidden tab stops calling rAF; the next frame's timestamp is past the
    // end, so the count finishes instead of resuming a stale climb. Faked by
    // jumping the clock between two frames.
    vi.useFakeTimers();
    stubReducedMotion(false);
    const { container } = mount();
    observer().fire(1);
    frame();
    frame();
    expect(spans(container).visible.textContent).not.toBe(`${FINAL}${SUFFIX}`);

    act(() => {
      vi.setSystemTime(Date.now() + COUNT_DURATION_MS * 4);
      vi.advanceTimersByTime(COUNT_DURATION_MS * 4);
    });
    expect(spans(container).visible.textContent).toBe(`${FINAL}${SUFFIX}`);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does nothing for a single frame — there is nothing to count', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const { container } = mount({ frames: ['7'] });

    expect(FakeObserver.instances).toHaveLength(0);
    expect(spans(container).visible.textContent).toBe(`7${SUFFIX}`);
  });

  it('stays final without an IntersectionObserver (an older engine)', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    vi.stubGlobal('IntersectionObserver', undefined);
    const { container } = mount();

    act(() => {
      vi.advanceTimersByTime(COUNT_DURATION_MS * 2);
    });
    expect(vi.getTimerCount()).toBe(0);
    expect(spans(container).visible.textContent).toBe(`${FINAL}${SUFFIX}`);
  });
});

describe('StatNumber — unmount', () => {
  it('cancels the pending frame and disconnects the observer', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const cancel = vi.spyOn(window, 'cancelAnimationFrame');
    const { unmount } = mount();
    observer().fire(1);
    frame();
    frame();
    expect(vi.getTimerCount()).toBe(1); // the next frame, pending

    unmount();

    expect(cancel).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(observer().disconnected).toBe(true);
  });

  it('ignores an entry delivered after unmount — nothing is scheduled', () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const { unmount } = mount();
    const queued = observer();

    unmount();
    queued.fire(1);

    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('StatNumber — accessibility (§9)', () => {
  it('exposes the spoken final exactly once to assistive technology, the sign never', () => {
    stubReducedMotion(false);
    render(
      <p>
        <StatNumber frames={FRAMES} suffix={SUFFIX} spoken={SPOKEN} />
      </p>,
    );

    // The paragraph's accessible text is the twin alone: the visible span is
    // aria-hidden, so the number is never read twice. Queried by its text —
    // Testing Library skips aria-hidden subtrees only for role queries, so
    // the visible span is filtered out by the attribute itself.
    const readable = screen
      .getAllByText(SPOKEN)
      .filter((element) => element.closest('[aria-hidden="true"]') === null);
    expect(readable).toHaveLength(1);
    expect(readable[0].className).toBe(TWIN_CLASSES);
    // „3.000+" exists ONLY inside the aria-hidden span (round 2s).
    const signed = screen.getAllByText(`${FINAL}${SUFFIX}`);
    expect(signed).toHaveLength(1);
    expect(signed[0]).toHaveAttribute('aria-hidden', 'true');
  });

  /** The island inside a paragraph at the band's number step, centred in a
   *  phone-wide column — the three measuring tests' one layout. */
  const measured = () => {
    stubReducedMotion(false);
    const { container } = render(
      <p style={{ fontSize: '36px', textAlign: 'center', width: '320px' }}>
        <StatNumber frames={FRAMES} suffix={SUFFIX} spoken={SPOKEN} />
      </p>,
    );
    const paragraph = container.firstElementChild as HTMLElement;
    return { paragraph, ...spans(paragraph) };
  };

  it('lays the twin EXACTLY over the digits it speaks for, and never paints it (the a11y review, 2026-10-01)', () => {
    // What a screen reader's cursor outlines and what VoiceOver finds under a
    // finger is the twin's BOX, so the box must be the number's: until that
    // day the twin was `sr-only`, a 1×1px speck. Measured in this browser
    // project, where layout is real. The twin IS the island's box (one line
    // tall), and the box sits on the digits: the same left edge and width,
    // and the same vertical CENTRE — the line spreads its leading evenly above
    // and below the glyphs' own inline box, which may be shorter or taller
    // than the line, so edges differ and centres never do.
    const { box, visible, twin } = measured();
    const outer = box.getBoundingClientRect();
    const seen = visible.getBoundingClientRect();
    const heard = twin.getBoundingClientRect();
    expect(seen.width).toBeGreaterThan(20);
    for (const side of ['left', 'top', 'width', 'height'] as const) {
      expect(heard[side], `twin ${side} = box ${side}`).toBeCloseTo(
        outer[side],
        0,
      );
    }
    const centre = (rect: DOMRect): number => (rect.top + rect.bottom) / 2;
    expect(
      Math.abs(heard.left - seen.left),
      'on the digits',
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(heard.width - seen.width),
      'as wide as the digits',
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(centre(heard) - centre(seen)),
      'centred on the digits',
    ).toBeLessThanOrEqual(1);
    const style = getComputedStyle(twin);
    expect(style.opacity).toBe('0');
    expect(style.overflow).toBe('hidden');
    expect(style.userSelect).toBe('none');
    // Still THERE for assistive technology — opacity hides nothing from it.
    expect(style.visibility).toBe('visible');
    expect(style.display).not.toBe('none');
  });

  it('speaks on ONE line — the twin never wraps inside the digits’ box (the Opus re-review, 2026-10-01)', () => {
    // `sr-only` carried `white-space: nowrap`, and the overlay must keep it:
    // the box is as wide as „3.000+", the spoken words are longer, and
    // wrapped they stood „peste" over „3.000" — so a screen reader reading by
    // VISUAL LINE (NVDA's mouse tracking, VoiceOver's rotor, a braille line)
    // split the number from its word, or ran the two together. A Range over
    // the twin's text reports one rectangle per line box it crosses: on one
    // line they all share a top.
    const { paragraph, visible, twin } = measured();
    // The words DO outrun the digits — else one line would prove nothing.
    const probe = document.createElement('span');
    probe.style.whiteSpace = 'nowrap';
    probe.textContent = SPOKEN;
    paragraph.append(probe);
    expect(
      probe.getBoundingClientRect().width,
      'the spoken words are wider than the digits',
    ).toBeGreaterThan(visible.getBoundingClientRect().width);
    probe.remove();

    const range = document.createRange();
    range.selectNodeContents(twin);
    const tops = new Set(
      [...range.getClientRects()].map((rect) => Math.round(rect.top)),
    );
    expect(
      [...tops],
      'every fragment of the spoken text on one line',
    ).toHaveLength(1);
    expect(getComputedStyle(twin).whiteSpace).toBe('nowrap');
  });

  it('is what a finger finds on the number — it takes the pointer, above the digits (the Opus re-review, 2026-10-01)', () => {
    // VoiceOver's touch exploration asks the engine what lies under the
    // finger. That is the twin only while it takes pointer events and sits
    // above the visible digits — a `pointer-events-none` or a z-index change
    // would keep every box assertion above green while the finger fell
    // through to the paragraph, so the platform's own hit test is asked.
    const { twin } = measured();
    const rect = twin.getBoundingClientRect();
    expect(getComputedStyle(twin).pointerEvents).toBe('auto');
    expect(
      document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      ),
    ).toBe(twin);
  });
});

describe('StatNumber — source pins (§16)', () => {
  const CODE = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '');

  it('is a client island: the directive is its first statement', () => {
    expect(CODE.trimStart()).toMatch(/^['"]use client['"];/);
  });

  it('imports react and lib/reduced-motion — nothing else', () => {
    const specifiers = [
      ...CODE.matchAll(/^import\s[^'"]*from\s*['"]([^'"]+)['"]/gm),
    ]
      .map((match) => match[1])
      .toSorted();

    expect(specifiers).toEqual([
      '@/lib/reduced-motion/reduced-motion',
      'react',
    ]);
    expect(CODE).not.toMatch(/^import\s*['"]/m);
    expect(CODE).not.toMatch(/^export\s[^=]*\sfrom\s/m);
  });

  it('formats nothing and knows no language', () => {
    expect(CODE).not.toMatch(/\bIntl\b/);
    expect(CODE).not.toMatch(/next-intl|\buseTranslations\b|\bt\(/);
    expect(CODE).not.toMatch(/\btoLocaleString\b/);
  });

  it('does not watch the preference — a read at mount and again when the count starts', () => {
    // Two reads, no listener (the header's LIFECYCLE, steps 1 and 3; G2-R2
    // tier 2, react F2): the cheap path at mount, the deciding read at the
    // first intersection.
    expect(CODE.match(/\bprefersReducedMotion\(\)/g)).toHaveLength(2);
    expect(CODE).not.toMatch(/\bwatchReducedMotion\b/);
  });
});

describe('StatNumber — type-level pins', () => {
  it('takes finished strings, never a formatter (the boundary rule)', () => {
    expectTypeOf<StatNumberProps['frames']>().toEqualTypeOf<CountFrames>();
    expectTypeOf<StatNumberProps['suffix']>().toEqualTypeOf<
      string | undefined
    >();
    expectTypeOf<StatNumberProps['spoken']>().toEqualTypeOf<string>();
    expectTypeOf<StatNumberProps>().not.toHaveProperty('format');
    // The word crosses already inside `spoken`, never on its own (round 2s).
    expectTypeOf<StatNumberProps>().not.toHaveProperty('atLeast');
  });

  it('refuses an empty frame list, a function and a missing spoken form', () => {
    // Every bad shape stays on ONE line (DoctorCourses.test.tsx's TS2578
    // finding), so the one good shape the function rides on is named first.
    const ONE: StatNumberProps = { frames: ['1'], spoken: '1' };
    // @ts-expect-error — the last frame IS the final value; an empty list has none
    const empty: StatNumberProps = { frames: [], spoken: '0' };
    // @ts-expect-error — a function cannot cross into a client island
    const formatter: StatNumberProps = { ...ONE, format: RO };
    // @ts-expect-error — `spoken` is REQUIRED; the island composes no words (round 2s)
    const unspoken: StatNumberProps = { frames: ['1'] };
    expect([empty, formatter, unspoken]).toHaveLength(3);
  });
});
