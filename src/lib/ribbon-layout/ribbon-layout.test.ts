import { afterEach, describe, expect, it } from 'vitest';
import { gaugeRule, lanes, UNIT_PX } from '../ribbon-model/ribbon-model.ts';
import {
  measureColumn,
  placeColumn,
  type MeasuredCard,
  type Rect,
} from './ribbon-layout.ts';

// lib/ribbon-layout — the page → the model's numbers, on real DOM in a real
// Chromium. No stylesheet is loaded in this project, so every box below is
// laid out by inline styles this file owns, in numbers it can predict.
//
// The one rule every case below leans on: a block is found by its MARKER,
// never by its place in the markup. The doctor card PAINTS its blocks in an
// order that is not the markup's (`flex-col-reverse` below its step, the
// columns swapped on a mirrored card), so a reader that walked the markup
// would put the ribbon's keep-outs where the words are not.

const hosts: HTMLElement[] = [];

afterEach(() => {
  for (const host of hosts.splice(0)) host.remove();
  window.scrollTo(0, 0);
});

/** Mount markup in a root that sits 40px down and 30px in from the page. */
function mount(html: string): HTMLElement {
  const host = document.createElement('div');
  host.style.cssText =
    'position: absolute; left: 30px; top: 40px; width: 800px;';
  host.innerHTML = `<div style="position: relative">${html}</div>`;
  document.body.append(host);
  hosts.push(host);
  const root = host.firstElementChild;
  if (!(root instanceof HTMLElement)) throw new Error('no root');
  return root;
}

/** A card 800 × 300 px: a 100 × 50 block marked `name` over a 200 × 40 block marked `quote` — in markup order; `reverse` paints them the other way up. */
const CARD = (reverse: boolean, attributes = '') => `
  <article ${attributes} style="height: 300px; display: flex; flex-direction: ${reverse ? 'column-reverse' : 'column'}; align-items: flex-start; justify-content: flex-start;">
    <div data-ribbon-keepout style="width: 100px; height: 50px"></div>
    <blockquote data-ribbon-keepout style="margin: 0; width: 200px; height: 40px"></blockquote>
  </article>`;

describe('measureColumn — the blocks are found by their markers', () => {
  it('measures a station, its card and its keep-outs RELATIVE TO THE ROOT', () => {
    const root = mount(`<div data-ribbon-station>${CARD(false)}</div>`);
    const [card] = measureColumn(root);

    expect(card.card).toEqual({ left: 0, top: 0, width: 800, height: 300 });
    expect(card.keepouts).toEqual([
      { left: 0, top: 0, width: 100, height: 50 },
      { left: 0, top: 50, width: 200, height: 40 },
    ]);
  });

  it('reads where a block is PAINTED, not where it is written', () => {
    // The same markup, painted bottom-up: the first marker in the markup is
    // now the LOWEST block in the card.
    const root = mount(`<div data-ribbon-station>${CARD(true)}</div>`);
    const [card] = measureColumn(root);
    const painted: readonly Rect[] = [
      { left: 0, top: 250, width: 100, height: 50 },
      { left: 0, top: 210, width: 200, height: 40 },
    ];

    expect(card.keepouts).toEqual(painted);
  });

  it('takes the scroll position out: the numbers stand still while the page moves', () => {
    const root = mount(
      `<div data-ribbon-station>${CARD(false)}</div><div style="height: 3000px"></div>`,
    );
    const still = measureColumn(root);
    window.scrollTo(0, 500);
    expect(window.scrollY).toBe(500);
    expect(measureColumn(root)).toEqual(still);
  });

  it('reduces a `portrait` keep-out to the central 60 % × 70 % of its cell, 5 % of its height up', () => {
    const root = mount(`
      <div data-ribbon-station>
        <article style="height: 400px">
          <div data-ribbon-keepout="portrait" style="margin-left: 100px; width: 200px; height: 300px"></div>
        </article>
      </div>`);
    const [card] = measureColumn(root);

    // The cell: 100 … 300 across, 0 … 300 down; its centre (200, 150).
    // 60 % of 200 = 120 wide, 70 % of 300 = 210 tall, the centre raised by
    // 5 % of 300 = 15 → (200, 135).
    expect(card.keepouts).toEqual([
      { left: 140, top: 30, width: 120, height: 210 },
    ]);
  });

  it('takes the station ITSELF as the card when the station carries the card (`asChild`)', () => {
    const root = mount(
      `<div style="padding-top: 20px">${CARD(false, 'data-ribbon-station="card"')}</div>`,
    );
    const [card] = measureColumn(root);

    expect(card.card).toEqual({ left: 0, top: 20, width: 800, height: 300 });
    expect(card.keepouts).toHaveLength(2);
  });

  it('finds the stations in document order', () => {
    const root = mount(`
      <div data-ribbon-station><article style="height: 100px"></article></div>
      <div style="height: 50px"></div>
      <div data-ribbon-station><article style="height: 200px"></article></div>`);
    expect(
      measureColumn(root).map(({ card }) => [card.top, card.height]),
    ).toEqual([
      [0, 100],
      [150, 200],
    ]);
  });

  it('answers an empty list for a root without stations', () => {
    expect(measureColumn(mount('<p>no stations</p>'))).toEqual([]);
  });

  it('refuses a column with a station that holds no card — a RangeError naming it', () => {
    const root = mount(
      `<div data-ribbon-station>${CARD(false)}</div><div data-ribbon-station>words only</div>`,
    );
    expect(() => measureColumn(root)).toThrow(RangeError);
    expect(() => measureColumn(root)).toThrow(/station 1 holds no card/);
  });
});

describe('measureColumn — a keep-out is what is PAINTED', () => {
  it('skips a marker that paints nothing, and measures a `display: contents` one by what it holds — at any scroll', () => {
    const root = mount(
      `<div data-ribbon-station><article style="height: 300px">` +
        `<div data-ribbon-keepout style="display: none; width: 100px; height: 50px"></div>` +
        `<div data-ribbon-keepout style="display: contents">` +
        `<div style="margin-left: 100px; width: 200px; height: 40px"></div>` +
        `<div style="margin-left: 50px; width: 60px; height: 30px"></div>` +
        `</div></article></div><div style="height: 3000px"></div>`,
    );
    const still = measureColumn(root);
    // Only the second marker is painted: its two children, 50 … 300 across
    // and 0 … 70 down — never an all-zero rect at the window's corner.
    expect(still[0].keepouts).toEqual([
      { left: 50, top: 0, width: 250, height: 70 },
    ]);
    window.scrollTo(0, 500);
    expect(window.scrollY).toBe(500);
    expect(measureColumn(root)).toEqual(still);
  });

  it('widens a keep-out by the content that overflows it — a child box, and a line of text', () => {
    const root = mount(
      `<div data-ribbon-station><article style="height: 300px">` +
        `<div data-ribbon-keepout style="width: 100px; height: 50px"><div style="width: 400px; height: 20px"></div></div>` +
        `<div data-ribbon-keepout style="width: 100px; height: 20px; white-space: nowrap; font: 16px monospace">Dr. Andrei Șerban, chirurgie orală</div>` +
        `</article></div>`,
    );
    const [box, text] = measureColumn(root)[0].keepouts;
    expect(box).toEqual({ left: 0, top: 0, width: 400, height: 50 });
    expect(text.left).toBe(0);
    expect(text.top).toBe(50);
    expect(text.width).toBeGreaterThan(200);
  });

  it('keeps a portrait’s OWN cell — never its contents — and skips a boxless one', () => {
    const root = mount(`
      <div data-ribbon-station>
        <article style="height: 400px">
          <div data-ribbon-keepout="portrait" style="margin-left: 100px; width: 200px; height: 300px"><div style="width: 700px; height: 10px"></div></div>
          <div data-ribbon-keepout="portrait" style="display: none; width: 200px; height: 300px"></div>
        </article>
      </div>`);
    expect(measureColumn(root)[0].keepouts).toEqual([
      { left: 140, top: 30, width: 120, height: 210 },
    ]);
  });
});

describe('placeColumn — the numbers the model takes, one card at a time', () => {
  /** A measured card: 1009 × 504 px at `top`, one keep-out 100 × 60 px whose centre sits 250 px right of and 100 px above the card's. */
  const measured = (top: number): MeasuredCard => ({
    card: { left: 10, top, width: 1009, height: 504 },
    keepouts: [
      {
        left: 10 + 504.5 + 250 - 50,
        top: top + 252 - 100 - 30,
        width: 100,
        height: 60,
      },
    ],
  });

  it('shares the FIRST card’s width and its gauge with the whole column', () => {
    const cards = [
      measured(0),
      {
        ...measured(700),
        card: { left: 10, top: 700, width: 900, height: 504 },
      },
    ];
    const placed = placeColumn(cards);
    const W = 1009 / UNIT_PX;
    for (const card of placed) {
      expect(card.input.W).toBe(W);
      expect(card.input.k).toBe(gaugeRule(W));
    }
  });

  it('keeps every box relative to its card’s centre, in card units, z up', () => {
    const [first] = placeColumn([measured(0)]);
    expect(first.input.H).toBeCloseTo(5.04, 12);
    expect(first.input.boxes).toHaveLength(1);
    const [box] = first.input.boxes;
    expect(box.x).toBeCloseTo(2.5, 12);
    expect(box.z).toBeCloseTo(1, 12);
    expect(box.w).toBeCloseTo(0.5, 12);
    expect(box.h).toBeCloseTo(0.3, 12);
  });

  it('mirrors every second card, by INDEX: its boxes’ x flips, nothing else', () => {
    const placed = placeColumn([measured(0), measured(700), measured(1400)]);
    expect(placed.map((card) => card.mirror)).toEqual([false, true, false]);
    expect(placed.map((card) => card.index)).toEqual([0, 1, 2]);
    expect(placed[1].input.boxes[0].x).toBeCloseTo(-2.5, 12);
    expect(placed[1].input.boxes[0].z).toBeCloseTo(1, 12);
    expect(placed[2].input.boxes[0].x).toBeCloseTo(2.5, 12);
  });

  it('measures G to the next card’s top, and gives the last card the tail’s room — the tail ends in the air (fb-504)', () => {
    const placed = placeColumn([measured(0), measured(700)]);
    expect(placed[0].input.G).toBeCloseTo((700 - 504) / UNIT_PX, 12);
    expect(placed[1].input.G).toBe(lanes(gaugeRule(10.09)).gap / UNIT_PX);
  });

  it('hands each card’s own rect through — it places the card’s ribbon', () => {
    const [first] = placeColumn([measured(0)]);
    expect(first.card).toEqual(measured(0).card);
  });

  it('places nothing for nothing measured', () => {
    expect(placeColumn([])).toEqual([]);
  });
});
