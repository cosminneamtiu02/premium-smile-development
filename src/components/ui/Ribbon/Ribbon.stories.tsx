import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, spyOn, waitFor } from 'storybook/test';
import { prefersReducedMotion } from '@/lib/reduced-motion/reduced-motion';
import { Ribbon } from './Ribbon';
import {
  DOCTORS_DE,
  DOCTORS_RO,
  LONG_QUOTE_RO,
  StandInColumn,
  StandInFrame,
} from './Ribbon.fixtures';

// NINE stories, EIGHT pictures (§15.26's manifest): seven photographed at the
// `UI/*` tier's one window width, 1280, and the Narrowest also at a real 320
// window ('stress-320'). Two are never photographed ('no-visual'): Drawing
// MOVES by design, and ReducedMotion's picture IS Desktop's — the net asks
// for reduced motion itself, so a second baseline would hold the same
// pixels. The export NAMES are load-bearing: each names a baseline file
// (`ui/ribbon/long-quote-…`).
//
// ── THE RIBBON FOLLOWS THE COLUMN, NOT THE WINDOW. So each story draws its
// column at a fixed width in rem inside the one window the net uses
// (Ribbon.fixtures.tsx's StandInFrame): 1009px, the approved desktop · 599px,
// the stacked card · 297px, the bolder phone · 241px, the column a 320px
// window leaves. The cards are the fixture's stand-in for the doctor card the
// owner saw under the prototype.
//
// ── STILL IN THE NET, LIVE IN THE WORKBENCH. The net's projects ask for
// reduced motion (playwright.config.ts, THE STILLNESS LEVER), under which the
// ribbon is painted whole at once — so every photograph is the finished
// ribbon, and none is caught mid-stroke. In Storybook itself the ribbon draws
// as a visitor would see it: scroll a card's centre to the ribbon's line, a
// quarter of the screen above its bottom (lib/ribbon-draw's LINE).
// ReducedMotion asks for it in the workbench too; Drawing leaves room to
// scroll.
//
// ── NO CONTROLS: the ribbon's one prop is its column of stations, and every
// story composes its own (fb-505 — one look, one motion; a lever is a
// constant, never a prop). No PseudoLocale story either: the atom renders no
// word of its own (§8.1); German is the stress language for the words the
// CARDS carry.
//
// Every story starts at the top of the page and leaves it there: stories are
// rendered one after another in one document — the Vitest runner's and the
// workbench's alike — and a scroll left behind (the Drawing story's, by
// hand) would decide which card is due in the next one.

const top = () => window.scrollTo({ top: 0, behavior: 'instant' });

const meta = {
  title: 'UI/Ribbon',
  component: Ribbon,
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  // `children` is a REQUIRED prop, so StoryObj demands it of every story unless meta gives it; each story's render composes its own column.
  args: { children: null },
  beforeEach: () => {
    top();
    return top;
  },
} satisfies Meta<typeof Ribbon>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The ribbon's own box — the stand-in column's one `list` — and the box its canvases live in. */
function parts(canvasElement: HTMLElement) {
  const root = canvasElement.querySelector<HTMLElement>('[role="list"]');
  const layer = root?.lastElementChild;
  if (root === null || !(layer instanceof HTMLElement)) {
    throw new Error('no ribbon in the story');
  }
  return { root, layer };
}

/** How many pixels of a canvas carry paint. */
function painted(canvas: HTMLCanvasElement): number {
  const context = canvas.getContext('2d');
  if (context === null || canvas.width === 0) return 0;
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let count = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
  return count;
}

/** What every story promises: one canvas per card, decorative and nothing more. */
async function expectDecorative(canvasElement: HTMLElement, cards: number) {
  const { root, layer } = parts(canvasElement);
  await expect(root.querySelectorAll('[data-ribbon-station]')).toHaveLength(
    cards,
  );
  await waitFor(() =>
    expect(layer.querySelectorAll('canvas')).toHaveLength(cards),
  );
  await expect(layer).toHaveAttribute('aria-hidden', 'true');
  await expect(
    layer.querySelectorAll('a, button, input, select, textarea, [tabindex]'),
  ).toHaveLength(0);
}

/**
 * The picture the owner approved: two doctors at the desktop's 1009px column,
 * each card in two columns — the portrait and the name beside the quote, the
 * buttons under both. The ribbon is 20px wide (k = 0.8): it comes over the
 * first card's top edge — the first card alone has no drop-in (the owner,
 * 2026-10-01: it "starts from nowhere") — across the top lane in a low
 * ripple — a valley, a crest, a valley — behind the card, back round the
 * left edge and down the side lane as a calm wave into the second card's
 * top-left corner, which it wraps mirrored.
 */
export const Desktop: Story = {
  render: () => (
    <StandInFrame width="desktop">
      <StandInColumn doctors={DOCTORS_RO.slice(0, 2)} />
    </StandInFrame>
  ),
  play: async ({ canvasElement }) => {
    await expectDecorative(canvasElement, 2);
  },
};

/** The stacked card at a 599px column — the block over the quote — and a
 *  ribbon 13.8px wide, on the gauge rule's straight line below the desktop. */
export const Tablet: Story = {
  render: () => (
    <StandInFrame width="tablet">
      <StandInColumn doctors={DOCTORS_RO.slice(0, 2)} />
    </StandInFrame>
  ),
  play: async ({ canvasElement }) => {
    await expectDecorative(canvasElement, 2);
  },
};

/** The bolder phone (fb-501, "b all day"): a 297px column and a ribbon
 *  9.3px wide — thicker, for its card, than the desktop's ratio would give. */
export const Phone: Story = {
  render: () => (
    <StandInFrame width="phone">
      <StandInColumn doctors={DOCTORS_RO.slice(0, 2)} />
    </StandInFrame>
  ),
  play: async ({ canvasElement }) => {
    await expectDecorative(canvasElement, 2);
  },
};

/**
 * The narrowest column the site has — the 241px a 320px window leaves — and a
 * ribbon 8.4px wide. Photographed at 1280 AND at a real 320 window
 * ('stress-320'): a tile overhangs the column by the few px the ribbon sticks
 * out round a card's edge, and that must never scroll the page sideways.
 */
export const Narrowest: Story = {
  tags: ['stress-320'],
  render: () => (
    <StandInFrame width="narrowest">
      <StandInColumn doctors={DOCTORS_RO.slice(0, 2)} />
    </StandInFrame>
  ),
  play: async ({ canvasElement }) => {
    await expectDecorative(canvasElement, 2);
    const page = canvasElement.ownerDocument.documentElement;
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
  },
};

/** A quote of about 1 100 characters on the first card: the tallest card, the
 *  longest side wave, and the lanes still keep every word clear. */
export const LongQuote: Story = {
  render: () => (
    <StandInFrame width="desktop">
      <StandInColumn
        doctors={[{ ...DOCTORS_RO[0], quote: LONG_QUOTE_RO }, DOCTORS_RO[1]]}
      />
    </StandInFrame>
  ),
  play: async ({ canvasElement }) => {
    await expectDecorative(canvasElement, 2);
  },
};

/** Three doctors: the second card mirrored, the third the mirror of the mirror
 *  — the column is one ribbon, however long. */
export const ThreeDoctors: Story = {
  render: () => (
    <StandInFrame width="desktop">
      <StandInColumn doctors={DOCTORS_RO} />
    </StandInFrame>
  ),
  play: async ({ canvasElement }) => {
    await expectDecorative(canvasElement, 3);
  },
};

/** German, the longest language, at the desktop column: longer names, longer
 *  quotes, longer buttons — the cards grow, the lanes do not. */
export const German: Story = {
  globals: { locale: 'de' },
  render: () => (
    <StandInFrame width="desktop">
      <StandInColumn doctors={DOCTORS_DE.slice(0, 2)} />
    </StandInFrame>
  ),
  play: async ({ canvasElement }) => {
    await expectDecorative(canvasElement, 2);
  },
};

/**
 * For a visitor who asks for less motion (§9): the whole ribbon at once, no
 * card waiting for the ribbon's line. The story asks for it itself —
 * `matchMedia` answers "reduce" for as long as the story is on screen — so the
 * workbench shows what the pixel net photographs everywhere; the net itself
 * never photographs it ('no-visual'), for that picture is Desktop's.
 */
export const ReducedMotion: Story = {
  tags: ['no-visual'],
  beforeEach: () => {
    const reduce = spyOn(window, 'matchMedia').mockImplementation(
      (query: string): MediaQueryList => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    );
    return () => reduce.mockRestore();
  },
  render: () => (
    <StandInFrame width="desktop">
      <StandInColumn doctors={DOCTORS_RO.slice(0, 2)} />
    </StandInFrame>
  ),
  play: async ({ canvasElement }) => {
    await expectDecorative(canvasElement, 2);
    const { layer } = parts(canvasElement);
    for (const canvas of layer.querySelectorAll('canvas')) {
      await expect(painted(canvas)).toBeGreaterThan(0);
    }
  },
};

/**
 * THE SCROLL DRAWING, live (fb-502, fb-507): a screen of room above three
 * doctors and a screen below them — scroll it with your own hand. A card's
 * stretch is drawn when the card's centre line reaches a quarter of the
 * screen above its bottom — 1.3 seconds, in order, faster while others wait
 * — and it stays
 * drawn on the way back up. The play scrolls nothing, so the story opens
 * with nothing drawn (and with the whole ribbon at once for a viewer whose
 * system asks for reduced motion); the scrolling itself is
 * Ribbon.test.tsx's, on a real scroll. Never photographed ('no-visual'): its
 * frames move by design.
 */
export const Drawing: Story = {
  tags: ['no-visual'],
  render: () => (
    <div className="py-[100svh]">
      <StandInFrame width="desktop">
        <StandInColumn doctors={DOCTORS_RO} />
      </StandInFrame>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expectDecorative(canvasElement, 3);
    // A screen of room above: no card has met the line. Under reduced
    // motion the premise does not hold — the whole ribbon is there at once
    // (ReducedMotion's story) — and nothing is asked of it.
    if (prefersReducedMotion()) return;
    const { layer } = parts(canvasElement);
    for (const canvas of layer.querySelectorAll('canvas')) {
      await expect(painted(canvas)).toBe(0);
    }
  },
};
