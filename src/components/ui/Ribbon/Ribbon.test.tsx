import { createRef, StrictMode } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { page } from 'vitest/browser';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
// The REAL stylesheet: the lanes are registered custom properties computed by
// the browser, the column's head and tail room are calc()s, and the card
// takes its two-column step at a container width — none of it exists without
// the compiled CSS (the Card / Modal / ContactModal precedent).
import '@/styles/globals.css';
import {
  DRAW_MS,
  handOver,
  startRibbonDraw,
  type RibbonDrawEnv,
} from '@/lib/ribbon-draw/ribbon-draw';
import { measureColumn, placeColumn } from '@/lib/ribbon-layout/ribbon-layout';
import {
  buildCard,
  gaugeRule,
  lanes,
  penetration,
  UNIT_PX,
  type Vec3,
} from '@/lib/ribbon-model/ribbon-model';
import { buildStrip } from '@/lib/ribbon-paint/ribbon-paint';
import source from './Ribbon.tsx?raw';
import { Ribbon, RibbonStation } from './Ribbon';
import {
  DOCTORS_DE,
  DOCTORS_RO,
  LONG_QUOTE_DE,
  LONG_QUOTE_RO,
  StandInColumn,
  StandInFrame,
  type StandInDoctor,
} from './Ribbon.fixtures';

// ui/Ribbon — the component, on the real stylesheet and the real typefaces.
// What it promises: the static page is neutral; a station outside a ribbon
// says so, and its marker is its own; the column stays a list; the root is a
// faithful <div>; the drawing lives exactly as long as the ribbon; the
// canvases are decoration only and clicks fall through them; the lanes the
// CSS computes ARE lib/ribbon-model's; every tile lies inside the root's
// height; no text is ever covered, at any width from the 320px window's
// column to the widest the site can give.
//
// THE REAL TYPEFACES, for ContactModal.test.tsx's reason: next/font does not
// run here, so the token chain would measure every string in the default
// serif, and a card's height is the sum of its lines. The @font-face pair is
// .storybook/preview-fonts.css's, the URLs pointing at the committed subsets
// the way this runner serves them (from the repo's root).
const FONT_CSS = `
@font-face {
  font-family: 'Source Serif 4 SB';
  src: url('/src/fonts/SourceSerif4Variable-subset.woff2') format('woff2');
  font-weight: 200 900;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: 'JetBrains Mono SB';
  src: url('/src/fonts/JetBrainsMonoVariable-subset.woff2') format('woff2');
  font-weight: 100 800;
  font-style: normal;
  font-display: block;
}
:root {
  --font-source-serif: 'Source Serif 4 SB';
  --font-jetbrains-mono: 'JetBrains Mono SB';
}
`;

let injected: HTMLStyleElement[] = [];

beforeAll(async () => {
  const fonts = document.createElement('style');
  fonts.textContent = FONT_CSS;
  // THE STILLNESS RULE (the PR #45 rule): unlayered, so it beats every
  // @layer'd utility — the buttons' colour fades never run under a reading.
  const still = document.createElement('style');
  still.textContent =
    '*, *::before, *::after { transition: none !important; animation: none !important; }';
  document.head.append(fonts, still);
  injected = [fonts, still];
  await document.fonts.load('1rem "Source Serif 4 SB"');
  await document.fonts.load('1rem "JetBrains Mono SB"');
  await document.fonts.ready;
});

afterAll(() => {
  for (const style of injected) style.remove();
});

afterEach(() => {
  vi.restoreAllMocks();
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
});

/** The source with its prose removed — the pins below police code, not the header. */
const CODE = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');

/** The stand-in column's root — route B makes it the one `list` (Ribbon.fixtures.tsx). */
const rootOf = (container: HTMLElement): HTMLElement => {
  const root = container.querySelector<HTMLElement>('[role="list"]');
  if (root === null) throw new Error('no ribbon root');
  return root;
};
const layerOf = (root: HTMLElement): HTMLElement => {
  const layer = root.lastElementChild;
  if (!(layer instanceof HTMLElement)) throw new Error('no layer');
  return layer;
};
const canvasesOf = (container: HTMLElement) => [
  ...layerOf(rootOf(container)).querySelectorAll('canvas'),
];

/** How many pixels of a canvas carry paint. */
function painted(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d');
  if (ctx === null || canvas.width === 0) return 0;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let count = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
  return count;
}

/** Every `scroll` and `resize` listener the window was given or lost, as [type, function]. */
function listenersOf(spy: {
  mock: { calls: readonly (readonly unknown[])[] };
}) {
  return spy.mock.calls
    .filter(([type]) => type === 'scroll' || type === 'resize')
    .map(([type, listener]) => [type, listener]);
}

/** A card tall enough for the ribbon to wrap — a shorter one is refused, and
 *  the guard says so in the console (lib/ribbon-draw). */
const TALL = { minHeight: '25rem' };

describe('ui/Ribbon — the static page is neutral (§16 rule 2)', () => {
  it('renders on the server as three boxes and the stations — no canvas, the layer hidden', () => {
    const html = renderToString(
      <StandInColumn doctors={DOCTORS_RO.slice(0, 2)} />,
    );
    expect(html).not.toContain('<canvas');
    const host = document.createElement('div');
    host.innerHTML = html;
    const root = rootOf(host);
    expect(root.children).toHaveLength(2);
    expect(root.querySelectorAll('[data-ribbon-station]')).toHaveLength(2);
    const layer = layerOf(root);
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer.childElementCount).toBe(0);
  });

  it('hydrates that HTML without a warning, then draws its canvases into the empty box', () => {
    const column = <StandInColumn doctors={DOCTORS_RO.slice(0, 2)} />;
    const host = document.createElement('div');
    host.style.width = '1009px';
    document.body.append(host);
    host.innerHTML = renderToString(column);
    const recoverable = vi.fn();
    const complaints = vi.spyOn(console, 'error');
    let root: Root | undefined;
    try {
      act(() => {
        root = hydrateRoot(host, column, { onRecoverableError: recoverable });
      });
      expect(recoverable).not.toHaveBeenCalled();
      expect(complaints).not.toHaveBeenCalled();
      expect(layerOf(rootOf(host)).querySelectorAll('canvas')).toHaveLength(2);
    } finally {
      act(() => root?.unmount());
      host.remove();
    }
  });
});

describe('ui/Ribbon — RibbonStation', () => {
  it('throws outside a Ribbon, saying what to wrap it in', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <RibbonStation>
          <article>Dr. Elena Marin</article>
        </RibbonStation>,
      ),
    ).toThrow(/^RibbonStation must be rendered inside a <Ribbon>/);
  });

  it('wraps its card in a station — or, with asChild, makes the card itself the station', () => {
    const { container } = render(
      <Ribbon>
        <RibbonStation className="self-center">
          <article style={TALL}>Dr. Elena Marin</article>
        </RibbonStation>
        <RibbonStation asChild className="self-center">
          <article style={TALL} className="own">
            Dr. Andrei Șerban
          </article>
        </RibbonStation>
      </Ribbon>,
    );
    const [wrapper, card] = container.querySelectorAll('[data-ribbon-station]');
    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.getAttribute('data-ribbon-station')).toBe('');
    expect(wrapper.className).toBe('self-center');
    expect(wrapper.firstElementChild?.tagName).toBe('ARTICLE');
    expect(card.tagName).toBe('ARTICLE');
    expect(card.getAttribute('data-ribbon-station')).toBe('card');
    expect(card.className).toBe('self-center own');
  });

  it('keeps ITS marker over a caller’s — the marker tells the layout which box to measure', () => {
    const { container } = render(
      <Ribbon>
        <RibbonStation data-ribbon-station="card">
          <article style={TALL}>Dr. Cristina Țurcanu</article>
        </RibbonStation>
      </Ribbon>,
    );
    const station = container.querySelector('[data-ribbon-station]');
    expect(station?.tagName).toBe('DIV');
    expect(station?.getAttribute('data-ribbon-station')).toBe('');
  });
});

describe('ui/Ribbon — the column stays a list (SC 1.3.1)', () => {
  it('reads as a list by route B: the root the list, each station an item holding its card', () => {
    render(<StandInColumn doctors={DOCTORS_RO} />);
    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(DOCTORS_RO.length);
    items.forEach((item, i) => {
      expect(item).toHaveAttribute('data-ribbon-station', '');
      expect(
        within(item).getByRole('article', { name: DOCTORS_RO[i].name }),
      ).toBe(item.firstElementChild);
    });
  });

  it('reads as a list by route A too: the consumer’s own list directly in the ribbon, each item the station, spaced by the model’s gap', () => {
    render(
      <div style={{ width: '599px' }}>
        <Ribbon>
          <ul role="list" className="flex flex-col gap-(--ribbon-gap)">
            {DOCTORS_RO.slice(0, 2).map((doctor) => (
              <RibbonStation key={doctor.name} asChild>
                <li>
                  <article style={TALL}>{doctor.name}</article>
                </li>
              </RibbonStation>
            ))}
          </ul>
        </Ribbon>
      </div>,
    );
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(item).toHaveAttribute('data-ribbon-station', 'card');
    }
    // `--ribbon-gap` is not registered: the list resolves it at itself, and
    // with no container between it and the column it is the column's number.
    const laid =
      items[1].getBoundingClientRect().top -
      items[0].getBoundingClientRect().bottom;
    expect(
      Math.abs(laid - lanes(gaugeRule(599 / UNIT_PX)).gap),
    ).toBeLessThanOrEqual(1 / 64);
  });
});

describe('ui/Ribbon — a faithful <div> (§6.8)', () => {
  it('spreads native props on the root, hands it the ref, and merges className LAST', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Ribbon ref={ref} id="doctors" data-band="team" className="mt-4">
        <RibbonStation>
          <article style={TALL}>Dr. Elena Marin</article>
        </RibbonStation>
      </Ribbon>,
    );
    const root = container.firstElementChild;
    if (!(root instanceof HTMLElement)) throw new Error('no root');
    expect(ref.current).toBe(root);
    expect(root.id).toBe('doctors');
    expect(root.dataset.band).toBe('team');
    expect(root.className).toBe('@container relative isolate mt-4');
  });

  it('is its own layer, above its cards without a number from the site’s stacking order', () => {
    const { container } = render(
      <StandInColumn doctors={DOCTORS_RO.slice(0, 2)} />,
    );
    const root = rootOf(container);
    const style = getComputedStyle(root);
    expect(style.position).toBe('relative');
    expect(style.isolation).toBe('isolate');
    expect(style.zIndex).toBe('auto');
    // The canvases' box comes AFTER the column, so it paints above the cards.
    expect(
      root.firstElementChild?.querySelectorAll('[data-ribbon-station]'),
    ).toHaveLength(2);
    expect(getComputedStyle(layerOf(root)).zIndex).toBe('auto');
  });
});

describe('ui/Ribbon — the drawing lives exactly as long as the ribbon', () => {
  it('starts after mount and stops at unmount: every listener it added is removed, no canvas is left', () => {
    const added = vi.spyOn(window, 'addEventListener');
    const removed = vi.spyOn(window, 'removeEventListener');
    const { container, unmount } = render(
      <StandInColumn doctors={DOCTORS_RO.slice(0, 2)} />,
    );
    const layer = layerOf(rootOf(container));
    const on = listenersOf(added);
    expect(on.map(([type]) => type).sort()).toEqual(['resize', 'scroll']);
    expect(layer.querySelectorAll('canvas')).toHaveLength(2);

    unmount();
    expect(listenersOf(removed)).toEqual(expect.arrayContaining(on));
    expect(layer.querySelectorAll('canvas')).toHaveLength(0);
  });

  it('leaves ONE drawing in StrictMode’s double start: a canvas per station, one pair of listeners', () => {
    const added = vi.spyOn(window, 'addEventListener');
    const removed = vi.spyOn(window, 'removeEventListener');
    const { container } = render(
      <StrictMode>
        <StandInColumn doctors={DOCTORS_RO.slice(0, 2)} />
      </StrictMode>,
    );
    expect(canvasesOf(container)).toHaveLength(2);
    expect(listenersOf(added).length - listenersOf(removed).length).toBe(2);
  });

  it('keeps the SAME canvases when it renders again with the same tree', () => {
    const { container, rerender } = render(
      <StandInColumn doctors={DOCTORS_RO.slice(0, 2)} />,
    );
    const before = canvasesOf(container);
    rerender(<StandInColumn doctors={DOCTORS_RO.slice(0, 2)} />);
    const after = canvasesOf(container);
    expect(after).toHaveLength(2);
    after.forEach((canvas, i) => expect(canvas).toBe(before[i]));
  });

  it('is a client island: the directive is its first statement', () => {
    expect(CODE.trimStart()).toMatch(/^['"]use client['"];/);
  });
});

describe('ui/Ribbon — decorative, and only that', () => {
  afterAll(async () => {
    await page.viewport(414, 896);
  });

  it('hides its canvases from assistive technology, from the pointer, in forced colours and in print', () => {
    const { container } = render(
      <StandInColumn doctors={DOCTORS_RO.slice(0, 2)} />,
    );
    const layer = layerOf(rootOf(container));
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer.className).toBe(
      'pointer-events-none absolute inset-0 forced-colors:hidden print:hidden',
    );
    expect(getComputedStyle(layer).pointerEvents).toBe('none');
    const canvases = layer.querySelectorAll('canvas');
    expect(canvases).toHaveLength(2);
    for (const canvas of canvases) {
      expect(canvas.tabIndex).toBe(-1);
      expect(getComputedStyle(canvas).pointerEvents).toBe('none');
    }
    expect(
      layer.querySelectorAll('a, button, input, select, textarea, [tabindex]'),
    ).toHaveLength(0);
  });

  it('lets every click through: a link’s centre, under a canvas, is the link', async () => {
    await page.viewport(1280, 800);
    const { container } = render(
      <StandInFrame width="desktop">
        <StandInColumn doctors={DOCTORS_RO} />
      </StandInFrame>,
    );
    const canvases = canvasesOf(container);
    const controls = [
      ...rootOf(container).querySelectorAll<HTMLElement>('a, button'),
    ];
    expect(controls).toHaveLength(2 * DOCTORS_RO.length);
    for (const control of controls) {
      control.scrollIntoView({ block: 'center', behavior: 'instant' });
      const box = control.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      // A canvas's box lies over the control — the click must pass through it.
      expect(
        canvases.some((canvas) => {
          const tile = canvas.getBoundingClientRect();
          return (
            x > tile.left && x < tile.right && y > tile.top && y < tile.bottom
          );
        }),
        control.id,
      ).toBe(true);
      const hit = document.elementFromPoint(x, y);
      expect(hit === control || control.contains(hit), control.id).toBe(true);
    }
  });

  it('paints every canvas at once when reduced motion is switched on mid-visit — through the real seam', () => {
    // lib/reduced-motion's own query, answered by a list whose `change` this
    // test fires, the way the system settings pane would.
    const events = new EventTarget();
    let reduce = false;
    const list: MediaQueryList = {
      get matches() {
        return reduce;
      },
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: events.dispatchEvent.bind(events),
    };
    vi.spyOn(window, 'matchMedia').mockReturnValue(list);
    const { container } = render(
      <div style={{ padding: '100vh 0' }}>
        <StandInFrame width="tablet">
          <StandInColumn doctors={DOCTORS_RO.slice(0, 2)} />
        </StandInFrame>
      </div>,
    );
    const canvases = canvasesOf(container);
    expect(canvases.map(painted)).toEqual([0, 0]);

    reduce = true;
    list.dispatchEvent(Object.assign(new Event('change'), { matches: true }));
    for (const canvas of canvases) expect(painted(canvas)).toBeGreaterThan(0);
  });
});

describe('ui/Ribbon — the lanes the CSS computes are lib/ribbon-model’s (KEEP IN SYNC, measured)', () => {
  it.each([241, 297, 305, 599, 818, 893, 1009, 1200, 1521])(
    'at a %ipx column: on the card, on a box inside it, and between two cards',
    (width) => {
      // A card tall enough for the ribbon to wrap, so the drawing runs too.
      const card = (probe: boolean) => (
        <article
          className="@container"
          style={{
            minHeight: '25rem',
            padding: 'var(--ribbon-lane-top) var(--ribbon-lane-side) 1.5rem',
          }}
        >
          <div
            data-probe={probe ? '' : undefined}
            style={{
              paddingTop: 'var(--ribbon-lane-top)',
              paddingLeft: 'var(--ribbon-lane-side)',
            }}
          >
            Dr. Elena Marin
          </div>
        </article>
      );
      const { container } = render(
        <div style={{ width: `${width}px` }}>
          <Ribbon>
            <RibbonStation>{card(true)}</RibbonStation>
            <RibbonStation>{card(false)}</RibbonStation>
          </Ribbon>
        </div>,
      );
      const rule = lanes(gaugeRule(width / UNIT_PX));
      const [first, second] = container.querySelectorAll('article');
      const probe = container.querySelector('[data-probe]');
      if (probe === null) throw new Error('no probe');
      for (const box of [first, probe]) {
        const style = getComputedStyle(box);
        expect(Math.abs(parseFloat(style.paddingTop) - rule.top)).toBeLessThan(
          0.01,
        );
        expect(
          Math.abs(parseFloat(style.paddingLeft) - rule.side),
        ).toBeLessThan(0.01);
      }
      // The gap as the browser COMPUTES it (the column's row-gap); laid out,
      // it is also where the second card begins — to layout's own 1/64px.
      const column = first.parentElement?.parentElement;
      if (!(column instanceof HTMLElement)) throw new Error('no column');
      const gap = parseFloat(getComputedStyle(column).rowGap);
      expect(Math.abs(gap - rule.gap)).toBeLessThan(0.01);
      const laid =
        second.getBoundingClientRect().top -
        first.getBoundingClientRect().bottom;
      expect(Math.abs(laid - rule.gap)).toBeLessThanOrEqual(1 / 64);
    },
  );
});

describe('ui/Ribbon — the stand-in card is the card the owner saw', () => {
  it('lays out, at the 1009px column, what the prototype measured on the real card', () => {
    const { container } = render(
      <StandInFrame width="desktop">
        <StandInColumn doctors={DOCTORS_RO.slice(0, 2)} />
      </StandInFrame>,
    );
    const article = rootOf(container).querySelector('article');
    if (article === null) throw new Error('no card');
    const card = article.getBoundingClientRect();
    const cx = card.left + card.width / 2;
    const block = (selector: string) => {
      const found = article.querySelector(selector);
      if (found === null) throw new Error(`no ${selector}`);
      const box = found.getBoundingClientRect();
      return { dx: box.left + box.width / 2 - cx, ...box.toJSON() };
    };
    const quote = block('blockquote');
    const name = block('[data-ribbon-keepout=""]:has(h2)');
    const buttons = block('[data-ribbon-keepout=""]:has(a)');
    const portrait = block('[data-ribbon-keepout="portrait"]');
    // What layout decides alone — the lanes, the grid's tracks, the
    // portrait's cell, the row's max width — to a pixel, on any machine.
    const exact = (actual: number, expected: number) =>
      expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
    exact(card.width, 1009);
    exact(quote.dx, 184);
    exact(quote.width, 504);
    exact(name.dx, -268);
    exact(portrait.dx, -268);
    exact(portrait.width, 192);
    exact(portrait.height, 256);
    exact(buttons.dx, 0);
    exact(buttons.width, 768);
    exact(buttons.height, 56);
    // What the typeface decides — how many lines a string takes — within one
    // line of the quote (28px): another platform's raster may wrap a word
    // differently, and the ribbon follows whatever it measures.
    const line = (actual: number, expected: number) =>
      expect(Math.abs(actual - expected)).toBeLessThanOrEqual(28);
    line(card.height, 504);
    line(quote.height, 84);
    line(name.width, 265);
    line(name.height, 72);
    // And the order the card PAINTS its blocks in: the block and the quote
    // side by side, the buttons under both.
    expect(buttons.top).toBeGreaterThan(Math.max(quote.bottom, name.bottom));
    expect(quote.left).toBeGreaterThan(name.right);
  });

  it('takes its two-column step where the real card does — at a card about 893px wide', () => {
    const sideBySide = (width: number) => {
      const { container, unmount } = render(
        <div style={{ width: `${width}px` }}>
          <StandInColumn doctors={DOCTORS_RO.slice(0, 1)} />
        </div>,
      );
      const quote = container.querySelector('blockquote');
      const cell = container.querySelector('[data-ribbon-keepout="portrait"]');
      if (quote === null || cell === null) throw new Error('no card');
      const beside =
        quote.getBoundingClientRect().top < cell.getBoundingClientRect().bottom;
      unmount();
      return beside;
    };
    expect(sideBySide(889)).toBe(false);
    expect(sideBySide(897)).toBe(true);
  });
});

describe('ui/Ribbon — every tile lies inside the root’s height', () => {
  it.each([241, 297, 599, 1009, 1521, 2145])('at a %ipx column', (width) => {
    for (const doctors of [
      DOCTORS_RO,
      DOCTORS_DE.map((doctor) => ({ ...doctor, quote: LONG_QUOTE_DE })),
    ]) {
      const { container, unmount } = render(
        <div style={{ width: `${width}px` }}>
          <StandInColumn doctors={doctors} />
        </div>,
      );
      const root = rootOf(container);
      const canvases = canvasesOf(container);
      expect(canvases).toHaveLength(doctors.length);
      for (const canvas of canvases) {
        const top = parseFloat(canvas.style.top);
        const height = parseFloat(canvas.style.height);
        expect(top).toBeGreaterThanOrEqual(0);
        expect(top + height).toBeLessThanOrEqual(root.clientHeight);
      }
      unmount();
    }
  });
});

describe('ui/Ribbon — two canvases meet where nobody sees: behind the card', () => {
  /**
   * A second drawing of a rendered column, into a layer of its own, on the
   * env seam's clock: every card on screen and the page at its end, so all
   * of them are due at once. `reduced` paints the whole ribbon at start;
   * otherwise `run` walks the pen frame by frame.
   */
  async function probe(root: HTMLElement, reduced: boolean) {
    const layer = document.createElement('div');
    layer.style.cssText = 'position: absolute; inset: 0';
    root.append(layer);
    const pending = new Map<number, (time: number) => void>();
    let handle = 0;
    const env: RibbonDrawEnv = {
      view: () => ({ rootTop: 0, height: 800, atEnd: true }),
      requestFrame: (callback) => {
        pending.set(++handle, callback);
        return handle;
      },
      cancelFrame: (id) => {
        pending.delete(id);
      },
      prefersReducedMotion: () => reduced,
      watchReducedMotion: () => () => {},
    };
    const draw = startRibbonDraw(layer, env);
    // The observer's first reports come with the next real frames: let them
    // arrive now, before anything is drawn piece by piece.
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    const run = (time: number) => {
      for (const [id, callback] of [...pending]) {
        if (pending.delete(id)) callback(time);
      }
    };
    run(0);
    return { draw, run, canvases: () => [...layer.querySelectorAll('canvas')] };
  }

  /** Every pixel of a canvas. */
  const pixels = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (ctx === null) throw new Error('no context');
    return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  };

  const COLUMNS = [
    ['two doctors at the desktop column', 'desktop', DOCTORS_RO.slice(0, 2)],
    ['three doctors at the desktop column', 'desktop', DOCTORS_RO],
    ['three doctors at the narrowest column', 'narrowest', DOCTORS_RO],
  ] as const;

  it.each(COLUMNS)(
    '%s: nothing is painted within 1px of any hand-over, on either canvas',
    async (_, width, doctors) => {
      const { container, unmount } = render(
        <StandInFrame width={width}>
          <StandInColumn doctors={doctors} />
        </StandInFrame>,
      );
      const root = rootOf(container);
      const whole = await probe(root, true);
      const canvases = whole.canvases();
      expect(canvases).toHaveLength(doctors.length);
      for (const canvas of canvases) {
        expect(pixels(canvas).some((channel) => channel > 0)).toBe(true);
      }

      // Card i's hand-over joins canvas i − 1 (its head) to canvas i (its
      // body); the first card's head and body share canvas 0.
      const colour = [0.6, 0.6, 0.6] as const;
      for (const placed of placeColumn(measureColumn(root)).slice(1)) {
        const model = buildCard(placed.input);
        const strip = buildStrip(model, placed.mirror, colour);
        const { u0, u1 } = model.atoms.wrapEntry;
        const split = handOver(strip, (u0 + u1) / 2);
        expect(split).toBeGreaterThan(0);
        const { l, r } = strip[split];
        const cx = placed.card.left + placed.card.width / 2;
        const cy = placed.card.top + placed.card.height / 2;
        const xs = [l[0], r[0]].map((x) => cx + x * UNIT_PX);
        const ys = [l[2], r[2]].map((z) => cy - z * UNIT_PX);
        const box = {
          left: Math.min(...xs) - 1,
          top: Math.min(...ys) - 1,
          right: Math.max(...xs) + 1,
          bottom: Math.max(...ys) + 1,
        };
        for (const canvas of [
          canvases[placed.index - 1],
          canvases[placed.index],
        ]) {
          const left = parseFloat(canvas.style.left);
          const top = parseFloat(canvas.style.top);
          const scale = canvas.width / parseFloat(canvas.style.width);
          // The hand-over lies inside both canvases — the test reads real
          // pixels, never the air around a canvas.
          expect(box.left).toBeGreaterThanOrEqual(left);
          expect(box.top).toBeGreaterThanOrEqual(top);
          expect(box.right).toBeLessThanOrEqual(left + canvas.width / scale);
          expect(box.bottom).toBeLessThanOrEqual(top + canvas.height / scale);
          const ctx = canvas.getContext('2d');
          if (ctx === null) throw new Error('no context');
          const x = Math.floor((box.left - left) * scale);
          const y = Math.floor((box.top - top) * scale);
          const region = ctx.getImageData(
            x,
            y,
            Math.ceil((box.right - left) * scale) - x,
            Math.ceil((box.bottom - top) * scale) - y,
          ).data;
          expect(region.every((channel) => channel === 0)).toBe(true);
        }
      }
      whole.draw.dispose();
      unmount();
    },
  );

  it.each(COLUMNS)(
    '%s: drawn piece by piece, every canvas ends on the picture painted at once',
    async (_, width, doctors) => {
      const { container, unmount } = render(
        <StandInFrame width={width}>
          <StandInColumn doctors={doctors} />
        </StandInFrame>,
      );
      const root = rootOf(container);
      const pieces = await probe(root, false);
      for (
        let time = 16;
        pieces.draw.getSnapshot().drawn < doctors.length;
        time += 16
      ) {
        pieces.run(time);
        expect(time).toBeLessThan(20_000);
      }
      const whole = await probe(root, true);
      const [a, b] = [pieces.canvases(), whole.canvases()];
      expect(a).toHaveLength(doctors.length);
      a.forEach((canvas, i) => {
        const [one, other] = [pixels(canvas), pixels(b[i])];
        expect(one.length).toBe(other.length);
        let differing = 0;
        for (let j = 0; j < one.length; j++)
          if (one[j] !== other[j]) differing++;
        expect(differing, `canvas ${i}`).toBe(0);
      });
      pieces.draw.dispose();
      whole.draw.dispose();
      unmount();
    },
  );
});

describe('ui/Ribbon — the scroll drawing, on a real scroll', () => {
  it('draws nothing before a card meets the line, completes its stretch in DRAW_MS when it does, and it stays drawn on the way back up', async () => {
    // The Drawing story's page: a screen of room above three doctors.
    const { container } = render(
      <div style={{ padding: '100vh 0' }}>
        <StandInFrame width="tablet">
          <StandInColumn doctors={DOCTORS_RO} />
        </StandInFrame>
      </div>,
    );
    const [first] = canvasesOf(container);
    // The observer's first report, and the frame it asks for, on the real clock.
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(painted(first)).toBe(0);

    // From here THE PEN'S FRAMES are this test's: the scroll is real, the
    // browser's own `scroll` event reaches the rule, and the frames the pen
    // asks for run on a clock the test moves.
    const frames = new Map<number, FrameRequestCallback>();
    let handle = 0;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.set(++handle, callback);
      return handle;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      frames.delete(id);
    });
    const run = (time: number) => {
      for (const [id, callback] of [...frames]) {
        if (frames.delete(id)) callback(time);
      }
    };

    // The first card's centre past the ribbon's line (a quarter of the screen
    // above its bottom): the screen's centre is past it too — a real scroll.
    const card = rootOf(container).querySelector('article');
    if (card === null) throw new Error('no card');
    card.scrollIntoView({ block: 'center', behavior: 'instant' });
    window.scrollBy({ top: 40, behavior: 'instant' });
    await vi.waitFor(() => expect(frames.size).toBe(1), { timeout: 2_000 });

    run(1_000); // the pen starts
    run(1_000 + DRAW_MS / 2);
    const half = painted(first);
    expect(half).toBeGreaterThan(0);
    run(1_000 + DRAW_MS - 1);
    expect(frames.size).toBe(1); // still drawing
    run(1_000 + DRAW_MS);
    // The stretch is COMPLETE: the pen asks for no further frame.
    expect(frames.size).toBe(0);
    const drawn = painted(first);
    expect(drawn).toBeGreaterThan(half);

    // …and back to the top: nothing drawn is undone, nothing is asked for.
    window.scrollTo({ top: 0, behavior: 'instant' });
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(frames.size).toBe(0);
    expect(painted(first)).toBe(drawn);
  });
});

describe('ui/Ribbon — text is never covered', () => {
  const withQuote = (doctors: readonly StandInDoctor[], quote: string) =>
    doctors.map((doctor) => ({ ...doctor, quote }));
  const VARIANTS: ReadonlyArray<
    readonly [string, string, readonly StandInDoctor[]]
  > = [
    ['ro', 'short quotes', DOCTORS_RO.slice(0, 2)],
    ['ro', 'long quotes', withQuote(DOCTORS_RO.slice(0, 2), LONG_QUOTE_RO)],
    ['de', 'short quotes', DOCTORS_DE.slice(0, 2)],
    ['de', 'long quotes', withQuote(DOCTORS_DE.slice(0, 2), LONG_QUOTE_DE)],
  ];
  /** From the 320px window's column to the widest ui/Container gives — about 2 145px at a 2 560px window. */
  const NARROWEST = 241;
  const WIDEST = 2_145;
  /** The 239 widths in FOUR BANDS of about sixty, each its own test: the
   *  whole sweep ran in 2.0 to 2.4 s on the development machine and timed
   *  out at 12 s on the GitHub runner (PR #113's first CI run) — a slower
   *  machine is not a covered card, so the budget is per band and generous. */
  const BANDS: ReadonlyArray<readonly [number, number]> = [
    [241, 713],
    [721, 1_193],
    [1_201, 1_673],
    [1_681, WIDEST],
  ];
  const BAND_TIMEOUT_MS = 60_000;
  let lang = '';

  beforeEach(() => {
    lang = document.documentElement.lang;
  });

  afterEach(() => {
    document.documentElement.lang = lang;
  });

  it('has long quotes of about 1 100 characters', () => {
    expect(LONG_QUOTE_RO.length).toBeGreaterThan(1_000);
    expect(LONG_QUOTE_RO.length).toBeLessThan(1_200);
    expect(LONG_QUOTE_DE.length).toBeGreaterThan(LONG_QUOTE_RO.length);
  });

  it('sweeps every 8px of column from 241 to 2 145 across its bands, with no gap and no overlap', () => {
    expect(BANDS[0][0]).toBe(NARROWEST);
    expect(BANDS[BANDS.length - 1][1]).toBe(WIDEST);
    BANDS.forEach(([from, to], i) => {
      expect((from - NARROWEST) % 8).toBe(0);
      expect((to - NARROWEST) % 8).toBe(0);
      if (i > 0) expect(from).toBe(BANDS[i - 1][1] + 8);
    });
  });

  it.each(
    VARIANTS.flatMap(([language, quotes, doctors]) =>
      BANDS.map(([from, to]) => [language, quotes, from, to, doctors] as const),
    ),
  )(
    '%s, %s: fine penetration is 0 on every card, at every 8px of column from %ipx to %ipx',
    (language, _, from, to, doctors) => {
      document.documentElement.lang = language;
      const { container, unmount } = render(
        <div style={{ width: `${from}px` }}>
          <StandInColumn doctors={doctors} />
        </div>,
      );
      const frame = container.firstElementChild;
      if (!(frame instanceof HTMLElement)) throw new Error('no frame');
      const root = rootOf(container);
      let cards = 0;
      for (let width = from; width <= to; width += 8) {
        frame.style.width = `${width}px`;
        for (const placed of placeColumn(measureColumn(root))) {
          const model = buildCard(placed.input);
          // 200 points per unit along the ribbon, three across it — both
          // edges and the centre — in the model's own frame, where the
          // keep-outs of a mirrored card already stand mirrored.
          const points: Vec3[] = [];
          const steps = Math.ceil(model.S * 200);
          const half = model.width / 2;
          for (let i = 0; i <= steps; i++) {
            const { x, y, z, B } = model.evaluate(i / steps);
            points.push(
              [x - half * B[0], y - half * B[1], z - half * B[2]],
              [x, y, z],
              [x + half * B[0], y + half * B[1], z + half * B[2]],
            );
          }
          const depth = penetration(points, placed.input.boxes, -model.T / 2);
          expect(depth, `${width}px, card ${placed.index}`).toBe(0);
          cards++;
        }
      }
      expect(cards).toBe(((to - from) / 8 + 1) * doctors.length);
      unmount();
    },
    BAND_TIMEOUT_MS,
  );
});

describe('ui/Ribbon — the Narrowest story at a real 320px window', () => {
  afterAll(async () => {
    await page.viewport(414, 896);
  });

  it('never makes the page scroll sideways', async () => {
    await page.viewport(320, 568);
    const { container } = render(
      <StandInFrame width="narrowest">
        <StandInColumn doctors={DOCTORS_RO.slice(0, 2)} />
      </StandInFrame>,
    );
    expect(canvasesOf(container)).toHaveLength(2);
    const page_ = document.documentElement;
    expect(page_.scrollWidth).toBeLessThanOrEqual(page_.clientWidth);
  });
});
