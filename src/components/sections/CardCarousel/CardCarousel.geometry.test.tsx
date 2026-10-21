import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CSSProperties, ReactNode } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { page, userEvent as realUser } from 'vitest/browser';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline — the
// reason this file exists apart from CardCarousel.test.tsx, which runs with
// none (the house pattern: PriceList.scale.test.tsx, ClinicLocation's).
import '@/styles/globals.css';
import { Container } from '@/components/ui/Container/Container';
import type { ClockEnv } from '@/lib/clock/clock';
import { CardCarousel, type CardCarouselLabels } from './CardCarousel';
import { ARRANGEMENTS, FIVE_FALLBACK, OUTER_SHARE, poseAt } from './conveyor';

// sections/CardCarousel — THE STAGE, COMPUTED (CardCarousel.tsx's THE
// GEOMETRY): what the engine draws with ./conveyor's numbers in a column of a
// given width — the card at `min(cap, column ÷ ratio)` (for five, the column
// less the two arrows' strips), the stage `ratio` cards wide and centred, the
// five-card window only while its card is at least 12rem — the switch at a
// 705.5px column — the cap, the floor and the strips in the theme's spacing
// (so THE BAND SCALE redraws them), the strips never under 24px wherever nine
// steps would be narrower; THE BARS' ROOM —
// a strip's width kept at each edge of the five-card stage always, and of a
// three-card one as far as the column's margin allows — with the mask's fade
// starting at it; THE LINE in both windows — every card's matrix that day's
// function list to the bit, every card's vertical centre on one line and
// every card upright, at rest and mid-glide; nothing widening the page or
// adding to its height; the two arrows — at the stage's edges, as tall as the
// cards' row, nothing painted but a tall chevron against each strip's outer
// edge, lilac at rest and under a REAL hover, larger there, grey and never
// larger for a disabled one — the fixed card and the cards' height; and the
// beads under the cards: their boxes, their colours and their contrast. The stories measure
// the same at the pinned widths; this file owns the THRESHOLDS, which a pinned
// width can only sample. No typeface is needed: the stand-in cards are 3:4
// boxes with no text that sets a size.

const LABELS: CardCarouselLabels = {
  region: 'Galeria clinicii',
  role: 'carusel',
  slideRole: 'diapozitiv',
  previous: 'Cardul anterior',
  next: 'Cardul următor',
  picker: 'Alege fotografia',
};

/** A browser that asks for less motion as far as lib/clock can tell: the
 *  ring never starts on its own (the CSS glides still run — the real
 *  preference is not reduced in this runner). */
const STILL: ClockEnv = {
  prefersReducedMotion: () => true,
  watchReducedMotion: () => () => {},
  isHidden: () => false,
  watchVisibility: () => () => {},
};

const ROOT = 16;
const CAP = 20 * ROOT;
const FIVE_FLOOR = 12 * ROOT;
/** An arrow's strip, `--bar`: nine theme steps. */
const BAR = 2.25 * ROOT;
/** Where the five-card window begins at the default root: the floor's card
 *  and the two strips. */
const SWITCH = FIVE_FLOOR * ARRANGEMENTS[5].ratio + 2 * BAR;

/** A point, px. */
type Point = readonly [x: number, y: number];

/** Seven 3:4 stand-in cards. */
const cards = (count = 7, className?: string): ReactNode[] =>
  Array.from({ length: count }, (_, index) => (
    <div key={index} className={className} style={{ aspectRatio: '3 / 4' }} />
  ));

/** The carousel in a frame `width` px wide — the column its root measures. */
function renderAt(
  width: number,
  visible: 3 | 5,
  frame: CSSProperties = {},
  mode: 'loop' | 'bounded' = 'loop',
): Readonly<{
  frame: HTMLElement;
  region: HTMLElement;
  stage: HTMLElement;
  slides: HTMLElement[];
  card: number;
  unmount: () => void;
}> {
  const { unmount } = render(
    <div data-testid="frame" style={{ width: `${width}px`, ...frame }}>
      <CardCarousel
        slides={cards()}
        slideLabels={Array.from({ length: 7 }, (_, i) => `${i + 1} din 7`)}
        labels={LABELS}
        mode={mode}
        visible={visible}
        env={STILL}
      />
    </div>,
  );
  const region = screen.getByRole('region', { name: LABELS.region });
  const stage = region.querySelector('[aria-live]');
  if (!(stage instanceof HTMLElement)) throw new Error('no stage');
  const slides = [...stage.children].filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );
  return {
    frame: screen.getByTestId('frame'),
    region,
    stage,
    slides,
    card: parseFloat(getComputedStyle(slides[0]).width),
    unmount,
  };
}

/** A length the engine laid out, against the arithmetic: layout rounds to a
 *  64th of a pixel. */
const expectLength = (actual: number, expected: number, label: string) => {
  expect(
    Math.abs(actual - expected),
    `${label}: ${actual} against ${expected}`,
  ).toBeLessThanOrEqual(1 / 32);
};

/** The card at signed slot `x`, found by the pose the island wrote. */
const at = (slides: HTMLElement[], x: number): HTMLElement => {
  const pose = poseAt(x);
  const found = slides.find(
    (slide) => Number(slide.style.getPropertyValue('--tx')) === pose.tx,
  );
  if (found === undefined) throw new Error(`no card at ${x}`);
  return found;
};

/** A point of a card's own box (px from its centre) where it is DRAWN, px
 *  from where its centre is laid out — through its computed transform. */
function drawnPoint(card: HTMLElement, x: number, y: number): Point {
  const matrix = new DOMMatrix(getComputedStyle(card).transform);
  const point = matrix.transformPoint(new DOMPoint(x, y, 0, 1));
  return [point.x / point.w, point.y / point.w];
}

/** A card's drawn outline, px from the stage's layout centre: its own box's
 *  four corners — top left, top right, bottom right, bottom left. */
function drawnOutline(card: HTMLElement): Point[] {
  const halfWidth = parseFloat(getComputedStyle(card).width) / 2;
  const halfHeight = parseFloat(getComputedStyle(card).height) / 2;
  const corners: readonly Point[] = [
    [-halfWidth, -halfHeight],
    [halfWidth, -halfHeight],
    [halfWidth, halfHeight],
    [-halfWidth, halfHeight],
  ];
  return corners.map(([x, y]) => drawnPoint(card, x, y));
}

/** THE LINE, as drawn: the largest spread of the cards' vertical centres, and
 *  the largest lean of any card's vertical edges (px). */
function lineOf(slides: HTMLElement[]): { spread: number; lean: number } {
  const centres = slides.map((slide) => drawnPoint(slide, 0, 0)[1]);
  const lean = Math.max(
    ...slides.map((slide) => {
      const [topLeft, topRight, bottomRight, bottomLeft] = drawnOutline(slide);
      return Math.max(
        Math.abs(topLeft[0] - bottomLeft[0]),
        Math.abs(topRight[0] - bottomRight[0]),
      );
    }),
  );
  return { spread: Math.max(...centres) - Math.min(...centres), lean };
}

/** Freeze every glide on the stage at `fraction` of its 700ms. */
function freezeAt(stage: HTMLElement, fraction: number): Animation[] {
  const gliding = stage.getAnimations({ subtree: true });
  for (const animation of gliding) {
    animation.pause();
    animation.currentTime = 700 * fraction;
  }
  return gliding;
}

/** Wait one frame. */
const frame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });

/** WCAG 2.2's contrast ratio of two `rgb(…)` colours as the engine computes
 *  them. */
function contrast(a: string, b: string): number {
  const luminance = (colour: string): number => {
    const channels = (colour.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const [r, g, bl] = channels.map((value) => {
      const c = value / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** The stage mask's first two stops, px from the stage's left edge: where it
 *  stops being transparent, and where it is opaque. */
function maskStops(stage: HTMLElement): readonly [number, number] {
  const mask = getComputedStyle(stage).maskImage;
  const found =
    /^linear-gradient\(to right, rgba\(0, 0, 0, 0\) ([-\d.e+]+)px, rgb\(0, 0, 0\) ([-\d.e+]+)px/.exec(
      mask,
    );
  if (found === null) throw new Error(`an unexpected mask: ${mask}`);
  return [Number(found[1]), Number(found[2])];
}

/** A token's colour as the engine computes it. */
function token(name: string): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  document.body.append(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
}

/** One style rule, as the CSSOM holds it: its selector, the media conditions
 *  it sits under, and the `display` and `border-width` it declares (empty for
 *  none). */
type StyleRule = {
  selector: string;
  media: string[];
  display: string;
  borderWidth: string;
};

/** Every style rule of the page's sheets, in document order, with the media
 *  conditions it sits under — the CSSOM walked, never a state forced. */
function styleRules(): StyleRule[] {
  const found: StyleRule[] = [];
  const walk = (rules: CSSRuleList, media: string[]): void => {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        found.push({
          selector: rule.selectorText,
          media,
          display: rule.style.getPropertyValue('display'),
          borderWidth: rule.style.getPropertyValue('border-width'),
        });
        walk(rule.cssRules, media);
      } else if (rule instanceof CSSMediaRule) {
        walk(rule.cssRules, [...media, rule.conditionText]);
      } else if (rule instanceof CSSGroupingRule) {
        walk(rule.cssRules, media);
      }
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      walk(sheet.cssRules, []);
    } catch {
      // A sheet from another origin cannot be read; none of ours is one.
    }
  }
  return found;
}

/** The index of the one rule whose selector names `escaped` — a class name
 *  as the CSSOM serializes it. */
function ruleIndex(rules: { selector: string }[], escaped: string): number {
  const indices = rules.flatMap((rule, index) =>
    rule.selector.includes(escaped) ? [index] : [],
  );
  expect(indices, escaped).toHaveLength(1);
  return indices[0];
}

/** Every colour and size read at its end value, not mid-fade: transitions
 *  off for the page until the returned function puts them back. */
function withoutTransitions(): () => void {
  const still = document.createElement('style');
  // transition-property, never the shorthand: the shorthand's name is a
  // Tailwind utility, and a scanned file would ship its rule.
  still.textContent = '* { transition-property: none !important; }';
  document.head.append(still);
  return () => still.remove();
}

/** An element as the runner photographs it: its PNG, decoded in the page.
 *  (The runner shoots at its own scale — 0.81 of a CSS pixel here — so the
 *  pixel tests compare a drawing with and without its halo, never a pixel
 *  with a CSS length.) */
async function pixelsOf(element: Element): Promise<ImageData> {
  const base64 = await page.screenshot({ element, save: false });
  const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext('2d');
  if (context === null) throw new Error('no 2D context');
  context.drawImage(bitmap, 0, 0);
  return context.getImageData(0, 0, bitmap.width, bitmap.height);
}

/** A pixel's relative luminance (WCAG 2.2), from its 8-bit sRGB channels. */
function luminanceAt(image: ImageData, x: number, y: number): number {
  const at = (y * image.width + x) * 4;
  const [r, g, b] = [0, 1, 2].map((channel) => {
    const c = image.data[at + channel] / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * PARK THE REAL POINTER (the reviews deck's recipe): the arrows' and beads'
 * tests below hover and click, and a mouse left resting where a carousel is
 * about to appear is page-level state a later test would inherit.
 */
let parking: HTMLElement;

beforeAll(() => {
  parking = document.createElement('div');
  parking.textContent = 'parcare';
  document.body.prepend(parking);
});

afterAll(() => {
  parking.remove();
});

beforeEach(async () => {
  await page.viewport(1400, 900);
  await realUser.hover(parking);
  expect(parseFloat(getComputedStyle(document.documentElement).fontSize)).toBe(
    ROOT,
  );
});

describe('CardCarousel — the stage, computed', () => {
  it('draws three cards at the article’s 42rem measure: the card at the 20rem cap, the stage 1.7521 cards wide and a strip’s room a side — 632.7px — centred', () => {
    const { frame, stage, card } = renderAt(672, 3);
    expectLength(card, CAP, 'the card');
    const box = stage.getBoundingClientRect();
    expectLength(box.width, ARRANGEMENTS[3].ratio * CAP + 2 * BAR, 'the stage');
    expect(box.width).toBeCloseTo(632.66, 1);
    const frameBox = frame.getBoundingClientRect();
    expect(box.left - frameBox.left).toBeCloseTo(
      (frameBox.width - box.width) / 2,
      1,
    );
  });

  it('shows THREE for five at the same measure — a five-card card would be 181.8px, under the 12rem floor — the very window `visible: 3` draws', () => {
    expect((672 - 2 * BAR) / ARRANGEMENTS[5].ratio).toBeCloseTo(181.84, 1);
    const five = renderAt(672, 5);
    const fiveStage = five.stage.getBoundingClientRect().width;
    const fiveCard = five.card;
    five.unmount();
    const three = renderAt(672, 3);
    expectLength(fiveCard, three.card, 'the card');
    expectLength(
      fiveStage,
      three.stage.getBoundingClientRect().width,
      'the stage',
    );
  });

  it('switches to the five-card window at a 705.5px column: three under it, five from it', () => {
    expect(SWITCH).toBeCloseTo(705.51, 1);
    const under = renderAt(705, 5);
    expectLength(under.card, CAP, 'the three-card card');
    expectLength(
      under.stage.getBoundingClientRect().width,
      FIVE_FALLBACK.ratio * CAP + 2 * BAR,
      'the three-card stage',
    );
    under.unmount();
    const over = renderAt(706, 5);
    expectLength(
      over.card,
      (706 - 2 * BAR) / ARRANGEMENTS[5].ratio,
      'the five-card card',
    );
    expect(over.card).toBeGreaterThanOrEqual(FIVE_FLOOR);
    expectLength(
      over.stage.getBoundingClientRect().width,
      706,
      'the five-card stage',
    );
  });

  it.each([
    [1024, 288.527, 1024],
    [1400, CAP, ARRANGEMENTS[5].ratio * CAP + 2 * BAR],
  ] as const)(
    'draws five in a %ipx column: the card %fpx, the stage %fpx — capped and centred past a 1127.8px column',
    (width, card, stageWidth) => {
      const drawn = renderAt(width, 5);
      expectLength(drawn.card, card, 'the card');
      const box = drawn.stage.getBoundingClientRect();
      expectLength(box.width, stageWidth, 'the stage');
      const frameBox = drawn.frame.getBoundingClientRect();
      expect(box.left - frameBox.left).toBeCloseTo(
        (frameBox.width - box.width) / 2,
        1,
      );
    },
  );

  it.each([
    [351, 200.334],
    [288, 164.377],
  ] as const)(
    'draws the fallback’s card at the column ÷ 1.7521 on a phone, its stage the column — no margin to take — a %ipx column, a %fpx card',
    (width, card) => {
      const drawn = renderAt(width, 5);
      expectLength(
        drawn.card,
        width / FIVE_FALLBACK.ratio,
        'the fallback card',
      );
      expectLength(drawn.card, card, 'the card, recorded');
      expectLength(
        drawn.stage.getBoundingClientRect().width,
        width,
        'the stage',
      );
    },
  );

  it('spells the cap, the strips and the five-card floor in the theme’s spacing, so THE BAND SCALE redraws them', () => {
    // A band in the scale remaps `--spacing`; 0.3rem stands in for one whose
    // design pixel is 1.2 CSS pixels: the cap is then 24rem, a strip 2.7rem —
    // 43.2px — and the floor 14.4rem — 230.4px, met from an 846.6px column.
    const scaled = { '--spacing': '0.3rem' } as CSSProperties;
    const three = renderAt(1200, 3, scaled);
    expectLength(three.card, 24 * ROOT, 'the scaled cap');
    three.unmount();
    // 840px: a five-card card would be 228.4px, under the 230.4px floor.
    const under = renderAt(840, 5, scaled);
    expectLength(under.card, 24 * ROOT, 'three, under the scaled floor');
    under.unmount();
    // 850px: 231.4px, over it — five.
    const over = renderAt(850, 5, scaled);
    expectLength(
      over.card,
      (850 - 2 * 1.2 * BAR) / ARRANGEMENTS[5].ratio,
      'five, over it',
    );
  });

  it.each([
    // [what, the frame's spacing step, the room expected under the cards]
    ['at the default root', undefined, 40],
    // THE BAND SCALE at its smallest design pixel (≈ 0.81, a 1140px laptop
    // window): ten steps would be 32.4px, under the shadow's 40px.
    ['in a band scaled to 0.81', '0.2025rem', 40],
    // …and past the reference the step is the larger, and wins.
    ['in a band scaled to 1.2', '0.3rem', 48],
  ] as const)(
    'keeps room under the cards for the house’s deepest shadow, shadow-xl’s 40px — %s, in both windows',
    (_what, spacing, room) => {
      for (const [width, visible] of [
        [672, 3],
        [1024, 5],
      ] as const) {
        const { unmount } = render(
          <div
            style={
              {
                width: `${width}px`,
                ...(spacing === undefined ? {} : { '--spacing': spacing }),
              } as CSSProperties
            }
          >
            <CardCarousel
              slides={cards(7, 'shadow-xl')}
              slideLabels={Array.from(
                { length: 7 },
                (_, i) => `${i + 1} din 7`,
              )}
              labels={LABELS}
              mode="bounded"
              visible={visible}
              env={STILL}
            />
          </div>,
        );
        const region = screen.getByRole('region', { name: LABELS.region });
        const stage = region.querySelector('[aria-live]');
        const centre = stage?.firstElementChild;
        const card = centre?.firstElementChild;
        if (
          !(stage instanceof HTMLElement) ||
          !(centre instanceof HTMLElement) ||
          !(card instanceof HTMLElement)
        ) {
          throw new Error('no stage, centre or card');
        }
        // The shadow's reach below its card, read off the engine: for each
        // shadow, its offset + its blur + its spread; the deepest wins.
        const reach = Math.max(
          ...[
            ...getComputedStyle(card).boxShadow.matchAll(
              /(-?[\d.]+)px (-?[\d.]+)px (-?[\d.]+)px (-?[\d.]+)px/g,
            ),
          ].map(
            ([, , y, blur, spread]) =>
              Number(y) + Number(blur) + Number(spread),
          ),
        );
        expect(reach).toBe(40);
        expectLength(
          parseFloat(getComputedStyle(stage).paddingBottom),
          room,
          `the room under ${visible} cards`,
        );
        // The centre card is the stage's lowest box: what is under it is the
        // shadow's room, and the mask clips nothing of the shadow.
        const below =
          stage.getBoundingClientRect().bottom -
          centre.getBoundingClientRect().bottom;
        expect(below).toBeGreaterThanOrEqual(reach - 1 / 64);
        unmount();
      }
    },
  );

  it.each([3, 5] as const)(
    'wears the fade as a mask on the stage, and never widens the page or adds to its height — %i cards',
    (visible) => {
      for (const width of [320, 351, 672, 1024]) {
        const { frame, stage, unmount } = renderAt(width, visible, {
          overflow: 'auto',
        });
        const style = getComputedStyle(stage);
        expect(
          `${style.maskImage} ${style.getPropertyValue('-webkit-mask-image')}`,
        ).toMatch(/linear-gradient/);
        expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
        expect(frame.scrollHeight).toBeLessThanOrEqual(frame.clientHeight);
        unmount();
      }
    },
  );
});

describe('CardCarousel — THE LINE, drawn in both windows', () => {
  it.each([
    // [column, cards asked, the outermost slot shown, its window, the room]
    [351, 3, 1, ARRANGEMENTS[3], 0],
    [672, 3, 1, ARRANGEMENTS[3], BAR],
    [672, 5, 1, FIVE_FALLBACK, BAR],
    [706, 5, 2, ARRANGEMENTS[5], BAR],
    [1024, 5, 2, ARRANGEMENTS[5], BAR],
  ] as const)(
    'leaves two fifths of each outermost card inside the cards’ window — the stage less its strips’ room: a %ipx column, %i cards asked, slot %i',
    (width, visible, slot, window, room) => {
      const { stage, slides, card } = renderAt(width, visible);
      const box = stage.getBoundingClientRect();
      const inset = (box.width - window.ratio * card) / 2;
      expect(inset).toBeCloseTo(room, 1);
      const right = at(slides, slot).getBoundingClientRect();
      const left = at(slides, -slot).getBoundingClientRect();
      expect(
        Math.abs(box.right - inset - right.left - OUTER_SHARE * right.width),
      ).toBeLessThanOrEqual(2);
      expect(
        Math.abs(left.right - (box.left + inset) - OUTER_SHARE * left.width),
      ).toBeLessThanOrEqual(2);
    },
  );

  it.each([
    [672, 3],
    [1024, 5],
    [351, 5],
  ] as const)(
    'draws every card with the line’s function list, to the bit — perspective · translateX · rotateY · scale — a %ipx column, %i cards asked',
    (width, visible) => {
      const { stage, slides } = renderAt(width, visible);
      // The transform the line has worn since 2026-10-14, on a probe in the
      // same stage, wearing each card's own pose.
      const probe = document.createElement('div');
      probe.style.width = 'var(--card)';
      probe.style.transform =
        'perspective(calc(var(--card) * var(--k))) translateX(calc(var(--card) * var(--tx))) rotateY(calc(var(--ry) * 1deg)) scale(var(--sc))';
      stage.append(probe);
      try {
        for (const slide of slides) {
          for (const name of ['--tx', '--ry', '--sc']) {
            probe.style.setProperty(name, slide.style.getPropertyValue(name));
          }
          expect(getComputedStyle(slide).transform).toBe(
            getComputedStyle(probe).transform,
          );
        }
      } finally {
        probe.remove();
      }
    },
  );

  it.each([
    [672, 3],
    [1024, 5],
  ] as const)(
    'stands every card’s centre on ONE horizontal line and every card UPRIGHT — at rest and frozen mid-glide — a %ipx column, %i cards',
    async (width, visible) => {
      const { stage, slides } = renderAt(width, visible);
      const rest = lineOf(slides);
      expect(rest.spread).toBeLessThanOrEqual(1e-6);
      expect(rest.lean).toBeLessThanOrEqual(1e-6);

      fireEvent.click(screen.getByRole('button', { name: LABELS.next }));
      await frame();
      const gliding = stage.getAnimations({ subtree: true });
      expect(gliding.length).toBeGreaterThan(0);
      for (const fraction of [0.15, 0.5, 0.85]) {
        freezeAt(stage, fraction);
        const moving = lineOf(slides);
        expect(
          moving.spread,
          `at ${fraction} of the glide`,
        ).toBeLessThanOrEqual(1e-6);
        expect(moving.lean, `at ${fraction} of the glide`).toBeLessThanOrEqual(
          1e-6,
        );
      }
      for (const animation of gliding) animation.finish();
    },
  );
});

describe('CardCarousel — THE BARS’ ROOM', () => {
  /** The stage, its arrows and the outermost card on each side of a window. */
  function readRoom(width: number, visible: 3 | 5, slot: 1 | 2) {
    const drawn = renderAt(width, visible);
    const previous = screen
      .getByRole('button', { name: LABELS.previous })
      .getBoundingClientRect();
    const next = screen
      .getByRole('button', { name: LABELS.next })
      .getBoundingClientRect();
    return {
      ...drawn,
      box: drawn.stage.getBoundingClientRect(),
      previous,
      next,
      right: at(drawn.slides, slot).getBoundingClientRect(),
      left: at(drawn.slides, -slot).getBoundingClientRect(),
    };
  }

  it.each([
    // [what, column, cards, the outermost slot, its window, the room a side,
    //  the stage]
    ['five just over the floor', 706, 5, 2, ARRANGEMENTS[5], BAR, 706],
    ['five in a 64rem column', 1024, 5, 2, ARRANGEMENTS[5], BAR, 1024],
    [
      'five at the cap, centred',
      1400,
      5,
      2,
      ARRANGEMENTS[5],
      BAR,
      ARRANGEMENTS[5].ratio * CAP + 2 * BAR,
    ],
    [
      'the line at the article’s measure',
      672,
      3,
      1,
      ARRANGEMENTS[3],
      BAR,
      ARRANGEMENTS[3].ratio * CAP + 2 * BAR,
    ],
    [
      'five asked at the article’s measure — three shown',
      672,
      5,
      1,
      FIVE_FALLBACK,
      BAR,
      FIVE_FALLBACK.ratio * CAP + 2 * BAR,
    ],
    [
      'the line, part of a margin',
      600,
      3,
      1,
      ARRANGEMENTS[3],
      (600 - ARRANGEMENTS[3].ratio * CAP) / 2,
      600,
    ],
    ['the line on a phone', 351, 3, 1, ARRANGEMENTS[3], 0, 351],
    ['the line at 288px', 288, 3, 1, ARRANGEMENTS[3], 0, 288],
    ['five’s three on a phone', 351, 5, 1, FIVE_FALLBACK, 0, 351],
    ['five’s three at 288px', 288, 5, 1, FIVE_FALLBACK, 0, 288],
  ] as const)(
    'keeps the arrows their room — %s: the stage, a strip at each edge, the mask clear across the room and fading the outermost card’s 40 % in beside it',
    (_what, width, visible, slot, window, room, stageWidth) => {
      const { box, card, stage, previous, next, right, left } = readRoom(
        width,
        visible,
        slot,
      );
      expectLength(box.width, stageWidth, 'the stage');
      const inset = (box.width - window.ratio * card) / 2;
      expect(inset, 'the room a side').toBeCloseTo(room, 1);
      // The arrows: one strip wide, at the stage's two edges.
      expect(previous.width).toBeCloseTo(BAR, 1);
      expect(next.width).toBeCloseTo(BAR, 1);
      expect(previous.left).toBeCloseTo(box.left, 1);
      expect(next.right).toBeCloseTo(box.right, 1);
      // The mask: transparent across the room, opaque a fade further in.
      const [clear, opaque] = maskStops(stage);
      expect(Math.abs(clear - inset)).toBeLessThanOrEqual(1 / 16);
      expect(Math.abs(opaque - inset - window.fade * card)).toBeLessThanOrEqual(
        1 / 16,
      );
      // The outermost card: its 40 % inside the cards' window, and of it
      // what the strip does not cover — all of it where the room is a whole
      // strip, the 40 % less what the room lacks where it is not.
      const covered = Math.max(0, BAR - inset);
      for (const [beyond, drawn] of [
        [next.left - right.left, right.width],
        [left.right - previous.right, left.width],
      ] as const) {
        expect(
          Math.abs(beyond - (OUTER_SHARE * drawn - covered)),
          `${beyond} beside the strip, of a card ${drawn} wide`,
        ).toBeLessThanOrEqual(1);
      }
    },
  );

  it('never lets a strip cover a five-card outermost card: just over the floor each shows its whole 40 % — 46px — beside its strip', () => {
    const { previous, next, right, left } = readRoom(706, 5, 2);
    expect(next.left - right.left).toBeCloseTo(OUTER_SHARE * right.width, 0);
    expect(next.left - right.left).toBeCloseTo(46, 0);
    expect(right.left).toBeLessThan(next.left);
    expect(left.right - previous.right).toBeCloseTo(
      OUTER_SHARE * left.width,
      0,
    );
    expect(left.right).toBeGreaterThan(previous.right);
  });
});

describe('CardCarousel — the arrows: two tall chevrons, always there, nothing painted behind them', () => {
  /** The carousel between two focusable neighbours, as on a page. */
  function mountOnPage(
    mode: 'loop' | 'bounded',
    visible: 3 | 5,
    frameStyle: CSSProperties = {},
    width = 1024,
  ) {
    render(
      <div style={{ width: `${width}px`, ...frameStyle }}>
        <button type="button">Înainte</button>
        <CardCarousel
          slides={cards()}
          slideLabels={Array.from({ length: 7 }, (_, i) => `${i + 1} din 7`)}
          labels={LABELS}
          mode={mode}
          visible={visible}
          env={STILL}
        />
        <button type="button">După</button>
      </div>,
    );
    const region = screen.getByRole('region', { name: LABELS.region });
    const stage = region.querySelector('[aria-live]');
    if (!(stage instanceof HTMLElement)) throw new Error('no stage');
    const previous = screen.getByRole('button', { name: LABELS.previous });
    const next = screen.getByRole('button', { name: LABELS.next });
    const picker = screen.getByRole('group', { name: LABELS.picker });
    return { region, stage, previous, next, picker };
  }

  /** The cards' row: the stage's content box, between its top padding and
   *  its room. */
  function rowOf(stage: HTMLElement): { top: number; bottom: number } {
    const box = stage.getBoundingClientRect();
    const style = getComputedStyle(stage);
    return {
      top: box.top + parseFloat(style.paddingTop),
      bottom: box.bottom - parseFloat(style.paddingBottom),
    };
  }

  /** An arrow's chevron. */
  const chevronOf = (control: HTMLElement): SVGSVGElement => {
    const svg = control.querySelector('svg');
    if (svg === null) throw new Error('no chevron');
    return svg;
  };

  /** An arrow's two paths: its halo, drawn first, and its line on top. */
  const pathsOf = (
    control: HTMLElement,
  ): readonly [SVGPathElement, SVGPathElement] => {
    const [halo, line] = chevronOf(control).querySelectorAll('path');
    if (halo === undefined || line === undefined) {
      throw new Error('the chevron lost its halo or its line');
    }
    return [halo, line];
  };

  it.each([
    ['loop', 3],
    ['loop', 5],
    ['bounded', 3],
    ['bounded', 5],
  ] as const)(
    'stands them at rest over the stage’s two edges, as tall as the cards’ row, above the cards — the root only the stage and the beads’ row (%s, %i cards)',
    (mode, visible) => {
      const { region, stage, previous, next, picker } = mountOnPage(
        mode,
        visible,
      );
      const box = stage.getBoundingClientRect();
      const row = rowOf(stage);
      const left = previous.getBoundingClientRect();
      const right = next.getBoundingClientRect();
      expect(left.left).toBeCloseTo(box.left, 1);
      expect(right.right).toBeCloseTo(box.right, 1);
      for (const bar of [left, right]) {
        expect(bar.width).toBeCloseTo(BAR, 1);
        expect(bar.top).toBeCloseTo(row.top, 1);
        expect(bar.bottom).toBeCloseTo(row.bottom, 1);
      }
      // The cards' row IS the centre card's height.
      const centre = [...stage.children].find(
        (child) => !child.hasAttribute('inert'),
      );
      if (!(centre instanceof HTMLElement)) throw new Error('no centre');
      expect(row.bottom - row.top).toBeCloseTo(
        parseFloat(getComputedStyle(centre).height),
        1,
      );
      // Above the cards: the topmost element at an arrow's centre is the
      // arrow — a DISABLED one too, which keeps its pointer events, so a
      // press on it never falls through to the card under it; between the
      // arrows the cards take the pointer.
      for (const control of [previous, next]) {
        const bar = control.getBoundingClientRect();
        const top = document.elementFromPoint(
          bar.left + bar.width / 2,
          bar.top + bar.height / 2,
        );
        expect(control.contains(top)).toBe(true);
      }
      const middle = document.elementFromPoint(
        box.left + box.width / 2,
        (row.top + row.bottom) / 2,
      );
      expect(stage.contains(middle)).toBe(true);
      // Nothing of the overlay in the flow: the root is the stage, then the
      // beads' row — the stage's box reaching THE LIFT, a twentieth of a
      // card, above the root, handed back by its negative margin.
      const root = region.getBoundingClientRect();
      const beads = picker.getBoundingClientRect();
      const lift = 0.05 * parseFloat(getComputedStyle(centre).width);
      expect(root.top - box.top).toBeCloseTo(lift, 1);
      expect(row.top - root.top).toBeCloseTo(8, 1);
      expect(beads.top).toBeCloseTo(box.bottom, 2);
      expect(root.bottom).toBeCloseTo(beads.bottom, 2);
    },
  );

  it.each([
    // [what, the frame's spacing step, the strip's width]
    ['at the default root', undefined, BAR],
    // THE BAND SCALE at its smallest design pixel (≈ 0.81) and past the
    // reference: the strips follow the band, nine of its steps wide.
    ['in a band scaled to 0.81', '0.2025rem', BAR * 0.81],
    ['in a band scaled to 1.2', '0.3rem', BAR * 1.2],
  ] as const)(
    'sizes the strips nine spacing steps wide, so THE BAND SCALE redraws them — %s',
    (_what, spacing, width) => {
      const { stage, previous, next } = mountOnPage(
        'bounded',
        3,
        spacing === undefined
          ? {}
          : ({ '--spacing': spacing } as CSSProperties),
        672,
      );
      const row = rowOf(stage);
      for (const control of [previous, next]) {
        const bar = control.getBoundingClientRect();
        expect(bar.width).toBeCloseTo(width, 1);
        expect(bar.height).toBeCloseTo(row.bottom - row.top, 1);
      }
    },
  );

  it('never draws a strip under 24px — SC 2.5.8’s minimum target — where nine theme steps would be narrower: a 9px default font size (Chrome’s „Very small”) draws them 20.25px; the chevron stays inside', () => {
    // 0.140625rem in this 16px runner is a 9px root's quarter rem: 2.25px.
    const tiny = { '--spacing': '0.140625rem' } as CSSProperties;
    expect(9 * 0.140625 * ROOT).toBeCloseTo(20.25, 5);
    for (const visible of [3, 5] as const) {
      const { stage, previous, next } = mountOnPage(
        'bounded',
        visible,
        tiny,
        visible === 3 ? 672 : 1024,
      );
      const row = rowOf(stage);
      const box = stage.getBoundingClientRect();
      for (const control of [previous, next]) {
        const bar = control.getBoundingClientRect();
        expect(bar.width, `${visible} cards`).toBeCloseTo(24, 1);
        expect(bar.height).toBeCloseTo(row.bottom - row.top, 1);
        const glyph = chevronOf(control).getBoundingClientRect();
        expect(glyph.left).toBeGreaterThanOrEqual(bar.left - 0.01);
        expect(glyph.right).toBeLessThanOrEqual(bar.right + 0.01);
      }
      expect(previous.getBoundingClientRect().left).toBeCloseTo(box.left, 1);
      expect(next.getBoundingClientRect().right).toBeCloseTo(box.right, 1);
      cleanup();
    }
  });

  it('paints nothing but the chevron: a transparent, borderless button; the chevron 24 × 144px against its strip’s OUTER edge, 2px in, the whole drawing inside the strip; in the lavender — 4.81:1 on the page, 5.06:1 on white — its stroke 1.7px however it is stretched, over a 5.7px halo of the page ground', () => {
    const restore = withoutTransitions();
    try {
      const { previous, next } = mountOnPage('loop', 5);
      const accent = token('--accent');
      expect(accent).toBe('rgb(116, 104, 148)');
      expect(contrast(accent, token('--page'))).toBeCloseTo(4.81, 2);
      expect(contrast(accent, 'rgb(255, 255, 255)')).toBeCloseTo(5.06, 2);
      for (const [control, outward] of [
        [previous, -1],
        [next, 1],
      ] as const) {
        const style = getComputedStyle(control);
        expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(style.backgroundImage).toBe('none');
        for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
          expect(
            style.getPropertyValue(`border-${side.toLowerCase()}-width`),
          ).toBe('0px');
        }
        expect(style.boxShadow).toBe('none');
        expect(style.color).toBe(accent);
        const svg = chevronOf(control);
        const glyph = svg.getBoundingClientRect();
        const strip = control.getBoundingClientRect();
        expect(glyph.width).toBeCloseTo(24, 1);
        expect(glyph.height).toBeCloseTo(144, 1);
        // Against the OUTER edge, 2px in — 4px out from the strip's centre.
        expect(
          outward < 0 ? glyph.left - strip.left : strip.right - glyph.right,
        ).toBeCloseTo(2, 1);
        expect(
          Math.abs(
            glyph.left + glyph.width / 2 - (strip.left + strip.width / 2),
          ),
        ).toBeCloseTo(4, 1);
        expect(glyph.top + glyph.height / 2).toBeCloseTo(
          strip.top + strip.height / 2,
          1,
        );
        expect(getComputedStyle(svg).opacity).toBe('1');
        expect(getComputedStyle(svg).scale).toBe('none');
        const [halo, line] = pathsOf(control);
        expect(getComputedStyle(line).strokeWidth).toBe('1.7px');
        expect(getComputedStyle(line).stroke).toBe(accent);
        expect(getComputedStyle(line).opacity).toBe('1');
        // THE HALO: the page's own colour — the body's ground — the line's
        // width and 2px more a side, drawn first.
        expect(getComputedStyle(halo).strokeWidth).toBe('5.7px');
        // The whole drawing inside the strip: the tip, a unit in from the
        // box's outer edge, its line and its halo round it.
        const unit = glyph.width / 24;
        const tip = outward < 0 ? glyph.left + unit : glyph.right - unit;
        const reach = (path: SVGPathElement): number =>
          parseFloat(getComputedStyle(path).strokeWidth) / 2;
        const inside = (edge: number): number =>
          outward < 0 ? edge - strip.left : strip.right - edge;
        expect(inside(tip + outward * reach(line))).toBeCloseTo(2.15, 1);
        expect(inside(tip + outward * reach(halo))).toBeCloseTo(0.15, 1);
        expect(inside(tip + outward * reach(halo))).toBeGreaterThan(0);
        expect(getComputedStyle(halo).stroke).toBe(token('--page'));
        expect(getComputedStyle(halo).stroke).toBe(
          getComputedStyle(document.body).backgroundColor,
        );
        expect(getComputedStyle(halo).display).not.toBe('none');
        for (const path of [halo, line]) {
          expect(getComputedStyle(path).getPropertyValue('vector-effect')).toBe(
            'non-scaling-stroke',
          );
          expect(getComputedStyle(path).strokeLinecap).toBe('round');
          expect(getComputedStyle(path).strokeLinejoin).toBe('round');
        }
      }
    } finally {
      restore();
    }
  });

  it('keeps an enabled arrow LILAC at rest and under a REAL pointer — only its chevron 1.1× larger there, the strip unmoved, the grown box and its line still inside it — and a disabled one GREY: the ink, its line at half strength over a whole halo, never lilac, never larger', async () => {
    const restore = withoutTransitions();
    try {
      expect(matchMedia('(hover: hover)').matches).toBe(true);
      const { previous, next } = mountOnPage('bounded', 5);
      const ink = token('--ink');
      const page = token('--page');
      const accent = token('--accent');
      // The first card of a bounded list: previous is disabled — the ink,
      // its LINE at half strength, its halo and its box whole.
      expect(previous).toBeDisabled();
      expect(getComputedStyle(previous).color).toBe(ink);
      expect(getComputedStyle(chevronOf(previous)).opacity).toBe('1');
      const [greyHalo, greyLine] = pathsOf(previous);
      expect(getComputedStyle(greyLine).opacity).toBe('0.5');
      expect(getComputedStyle(greyHalo).opacity).toBe('1');
      // That grey, composited over its halo — the page's colour: the ink at
      // half, rgb(147 144 142), 3.02:1 on the page, and 1.60:1 lighter than
      // the lilac (the faint ink would be 1.02:1 — hue alone).
      const half = (ink.match(/[\d.]+/g) ?? [])
        .slice(0, 3)
        .map((channel, index) =>
          Math.round(
            (Number(channel) + Number((page.match(/[\d.]+/g) ?? [])[index])) /
              2,
          ),
        );
      expect(half).toEqual([147, 144, 142]);
      const grey = `rgb(${half.join(', ')})`;
      expect(contrast(grey, page)).toBeCloseTo(3.015, 3);
      expect(contrast(accent, grey)).toBeCloseTo(1.595, 3);
      expect(contrast(accent, token('--ink-faint'))).toBeCloseTo(1.024, 3);

      // At rest an enabled arrow is already lilac.
      expect(getComputedStyle(next).color).toBe(accent);
      const strip = next.getBoundingClientRect();
      await realUser.hover(next);
      // Under the pointer: the same lilac, the chevron a little larger.
      expect(getComputedStyle(next).color).toBe(accent);
      const [halo, line] = pathsOf(next);
      expect(getComputedStyle(line).stroke).toBe(accent);
      expect(getComputedStyle(halo).stroke).toBe(page);
      expect(getComputedStyle(chevronOf(next)).scale).toBe('1.1');
      const glyph = chevronOf(next).getBoundingClientRect();
      expect(glyph.width).toBeCloseTo(26.4, 1);
      expect(glyph.height).toBeCloseTo(158.4, 1);
      // THE CHEVRON GROWS, NOT THE BOX: the strip is where it was, the
      // grown chevron's box 0.8px inside its outer edge, the line's tip
      // 1.05px inside it.
      const hovered = next.getBoundingClientRect();
      expect(hovered.width).toBeCloseTo(strip.width, 3);
      expect(hovered.height).toBeCloseTo(strip.height, 3);
      expect(glyph.left).toBeGreaterThan(hovered.left);
      expect(hovered.right - glyph.right).toBeCloseTo(0.8, 1);
      const tip = glyph.right - glyph.width / 24;
      const lineReach = parseFloat(getComputedStyle(line).strokeWidth) / 2;
      expect(hovered.right - (tip + lineReach)).toBeCloseTo(1.05, 1);

      // …and under the pointer a disabled arrow neither turns lilac nor
      // grows; the enabled one, left, keeps its lilac at its own size.
      await realUser.hover(previous);
      expect(getComputedStyle(previous).color).toBe(ink);
      expect(getComputedStyle(chevronOf(previous)).scale).toBe('none');
      expect(getComputedStyle(next).color).toBe(accent);
      expect(getComputedStyle(chevronOf(next)).scale).toBe('none');
    } finally {
      restore();
    }
  });

  it('draws NOTHING on the page ground: an arrow’s pixels with and without its halo differ by a few levels of 255 at most — rounding at the line’s anti-aliased edge', async () => {
    // Five cards in a 760px column: the strips stand in the room the stage
    // keeps, over the page ground.
    const { unmount } = renderAt(760, 5);
    try {
      const previous = screen.getByRole('button', { name: LABELS.previous });
      const [halo] = pathsOf(previous);
      const shown = await pixelsOf(previous);
      halo.style.display = 'none';
      const hidden = await pixelsOf(previous);
      halo.style.removeProperty('display');
      expect([shown.width, shown.height]).toEqual([
        hidden.width,
        hidden.height,
      ]);
      // MEASURED here: two levels of 255, on about a thousand channels along
      // the line's anti-aliased edge — the line blended over the halo's page
      // colour instead of the page itself, the same colour, rounded once
      // more. Invisible; the bound allows one level more for another
      // engine's rasteriser (CI's Linux).
      let most = 0;
      for (let i = 0; i < shown.data.length; i++) {
        most = Math.max(most, Math.abs(shown.data[i] - hidden.data[i]));
      }
      expect(most).toBeLessThanOrEqual(3);
    } finally {
      unmount();
    }
  });

  it.each([288, 351] as const)(
    'keeps the line on the PAGE COLOUR over a black photograph where the three-card window keeps no room — a %ipx column: the halo beside the line, the photograph’s grey without it',
    async (width) => {
      // Black stand-in cards: the worst photograph, faded by the stage's mask
      // under the strips.
      const { unmount } = render(
        <div style={{ width: `${width}px` }}>
          <CardCarousel
            slides={Array.from({ length: 7 }, (_, index) => (
              <div
                key={index}
                style={{ aspectRatio: '3 / 4', background: '#000' }}
              />
            ))}
            slideLabels={Array.from({ length: 7 }, (_, i) => `${i + 1} din 7`)}
            labels={LABELS}
            mode="loop"
            visible={3}
            env={STILL}
          />
        </div>,
      );
      try {
        const previous = screen.getByRole('button', { name: LABELS.previous });
        const [halo] = pathsOf(previous);
        /**
         * The line where the photograph shows most — rows by the arm ends,
         * taken along the CHEVRON's own height (the strip is the cards' row,
         * the chevron 9rem of it) — found where its own drawing puts the arm:
         * previous's arms run from (23, 1) and (23, 143) to its tip (1, 72)
         * in the 24 × 144 box. Per row: the line's core, the darkest pixel
         * within a CSS pixel and a half of that x, and the WORSE of its two
         * sides two CSS pixels out — inside the halo's 2px (0.85 to 2.85px
         * from the line's centre), and, on the card's side, where the
         * photograph is darkest.
         */
        const read = async () => {
          const image = await pixelsOf(previous);
          const strip = previous.getBoundingClientRect();
          const glyph = chevronOf(previous).getBoundingClientRect();
          const scale = image.width / strip.width;
          const out = Math.round(2 * scale);
          return [0.05, 0.1, 0.9, 0.95].map((fraction) => {
            const y = Math.round(
              (glyph.top - strip.top + glyph.height * fraction) * scale,
            );
            const across = 1 + (22 * Math.abs(144 * fraction - 72)) / 71;
            const expected =
              (glyph.left - strip.left + (across * glyph.width) / 24) * scale;
            let core = Math.round(expected);
            const reach = 1.5 * scale;
            for (
              let x = Math.floor(expected - reach);
              x <= Math.ceil(expected + reach);
              x++
            ) {
              if (luminanceAt(image, x, y) < luminanceAt(image, core, y)) {
                core = x;
              }
            }
            const worst = Math.min(
              luminanceAt(image, core - out, y),
              luminanceAt(image, core + out, y),
            );
            return { core: luminanceAt(image, core, y), worst };
          });
        };
        const withHalo = await read();
        halo.style.display = 'none';
        const without = await read();
        halo.style.removeProperty('display');
        // MEASURED in this runner (its screenshots are 0.81 of a CSS pixel,
        // so a 1.7px line and its 2px of halo a side are softened into each
        // other and into the photograph): with the halo the line's worse side
        // reads 0.57–0.84 — the page is 0.948 — and the lilac line, 0.16–0.26,
        // stands at 2.0–4.2:1 against it; without it the card's side is the
        // photograph's grey, 0.21–0.34, the line 1.2–1.9:1, all but lost.
        // (The colours themselves, line on halo, are 4.81:1 — what a phone's
        // three device pixels to the CSS pixel draw; this blurred reading
        // pins only that the halo is there and the photograph is not.)
        for (const { core, worst } of withHalo) {
          expect(worst).toBeGreaterThanOrEqual(0.5);
          expect(core).toBeLessThan(0.3);
          expect((worst + 0.05) / (core + 0.05)).toBeGreaterThanOrEqual(1.8);
        }
        for (const { worst } of without) {
          expect(worst).toBeLessThan(0.4);
        }
      } finally {
        unmount();
      }
    },
  );

  it('does not draw the halo in forced colours — the system colours own that mode', () => {
    const rules = styleRules();
    const hidden = rules[ruleIndex(rules, 'forced-colors\\:hidden')];
    expect(hidden.media).toContain('(forced-colors: active)');
    expect(hidden.display).toBe('none');
  });

  it('orders the rules so the press and reduced motion win: the chevron’s press and reduced-motion sizes after its hover size, under the same weight — the reduced one only under prefers-reduced-motion; the press’s and the disabled arrow’s colours outweigh the rest’s', () => {
    const rules = styleRules();
    const hover = ruleIndex(rules, 'enabled\\:hover\\:\\*\\:scale-110');
    const press = ruleIndex(rules, 'enabled\\:active\\:\\*\\:scale-100');
    const reduced = ruleIndex(
      rules,
      'motion-reduce\\:enabled\\:hover\\:\\*\\:scale-100',
    );
    expect(press).toBeGreaterThan(hover);
    expect(reduced).toBeGreaterThan(hover);
    expect(rules[hover].media).toContain('(hover: hover)');
    expect(rules[reduced].media).toEqual(
      expect.arrayContaining([
        '(prefers-reduced-motion: reduce)',
        '(hover: hover)',
      ]),
    );
    // The colours: no hover of their own (the owner's "always lilla"); the
    // press's and the disabled arrow's each answer a state, so each outweighs
    // the rest colour's one class wherever the sheet puts them; the disabled
    // line's half strength answers its arrow's :disabled.
    const pressed =
      rules[ruleIndex(rules, 'enabled\\:active\\:text-accent-strong')];
    expect(pressed.selector).toContain(':enabled:active');
    const disabled = rules[ruleIndex(rules, '.disabled\\:text-ink:disabled')];
    expect(disabled.selector).toContain(':disabled');
    const halfLine =
      rules[ruleIndex(rules, 'group-disabled\\/arrow\\:opacity-50')];
    expect(halfLine.selector).toContain('.group\\/arrow):disabled *');
  });

  it('rings the keyboard’s focus INSIDE the strip — the house’s 2px of --focus on its outermost 2px — and none for a click', async () => {
    const { previous, next } = mountOnPage('loop', 5);
    await realUser.click(screen.getByRole('button', { name: 'Înainte' }));
    await realUser.tab();
    expect(document.activeElement).toBe(previous);
    const ring = getComputedStyle(previous);
    expect(ring.outlineStyle).toBe('solid');
    expect(ring.outlineWidth).toBe('2px');
    expect(ring.outlineOffset).toBe('-2px');
    expect(ring.outlineColor).toBe('rgb(26, 23, 20)');
    // A pointer's press focuses the arrow without the ring.
    await realUser.click(next);
    expect(document.activeElement).toBe(next);
    expect(next.matches(':focus-visible')).toBe(false);
    expect(getComputedStyle(next).outlineStyle).toBe('none');
  });
});

describe('CardCarousel — THE LIFT: a card that grows is never cut flat at the stage’s top', () => {
  /** A large FIXED card: 93 theme steps, 372px at the default root — the
   *  five-card window's widest card in a 1300px column, where the lifted cap
   *  drew it until that option left (2026-10-20). */
  const LARGE = 'calc(var(--spacing)*93)';

  /** The carousel over seven dark stand-in cards — every painted pixel of a
   *  card is told from the page ground at a glance — at the cap's share, or
   *  one fixed width. */
  function mountDark(width: number, visible: 3 | 5, cardWidth?: string) {
    const drawn = render(
      <div style={{ width: `${width}px`, marginTop: '48px' }}>
        <CardCarousel
          slides={Array.from({ length: 7 }, (_, index) => (
            <div
              key={index}
              style={{ aspectRatio: '3 / 4', background: '#2b2724' }}
            />
          ))}
          slideLabels={Array.from({ length: 7 }, (_, i) => `${i + 1} din 7`)}
          labels={LABELS}
          mode="loop"
          visible={visible}
          env={STILL}
          {...(cardWidth === undefined ? {} : { cardWidth })}
        />
      </div>,
    );
    const region = screen.getByRole('region', { name: LABELS.region });
    const stage = region.querySelector('[aria-live]');
    if (!(stage instanceof HTMLElement)) throw new Error('no stage');
    const slide = [...stage.children].find(
      (child) => !child.hasAttribute('inert'),
    );
    const card = slide?.firstElementChild;
    if (!(card instanceof HTMLElement)) throw new Error('no centre card');
    return { ...drawn, region, stage, card };
  }

  /** The lift taken away — the stage as it stood before it: two steps of
   *  padding, no margin. */
  function withoutLift(stage: HTMLElement): () => void {
    stage.style.paddingTop = 'calc(var(--spacing) * 2)';
    stage.style.marginTop = '0px';
    return () => {
      stage.style.removeProperty('padding-top');
      stage.style.removeProperty('margin-top');
    };
  }

  /** What the page shows inside a box, px in the page: a transparent probe
   *  laid over it and photographed (the runner shoots elements, not
   *  rectangles). */
  async function shotOf(box: {
    left: number;
    top: number;
    width: number;
    height: number;
  }): Promise<ImageData> {
    const probe = document.createElement('div');
    Object.assign(probe.style, {
      position: 'absolute',
      left: `${box.left + window.scrollX}px`,
      top: `${box.top + window.scrollY}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
      pointerEvents: 'none',
    });
    document.body.append(probe);
    try {
      return await pixelsOf(probe);
    } finally {
      probe.remove();
    }
  }

  /** How many rows of a shot hold a dark pixel — the card's. */
  function darkRows(image: ImageData): number {
    let rows = 0;
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        if (image.data[(y * image.width + x) * 4] < 128) {
          rows++;
          break;
        }
      }
    }
    return rows;
  }

  it.each([
    // [what, column, cards, a fixed width, the card's growth above its top, px]
    ['five, a 372px fixed card', 1300, 5, LARGE, 12.4],
    ['the article’s three', 672, 3, undefined, 10.7],
  ] as const)(
    'paints a card grown to 105 %% WHOLE above its resting top — %s: the growth past the old two steps of padding painted, where without the lift it is cut at 8px',
    async (_what, width, visible, cardWidth, growth) => {
      const restore = withoutTransitions();
      const { stage, card } = mountDark(width, visible, cardWidth);
      try {
        const rest = card.getBoundingClientRect();
        card.style.scale = '1.05';
        await frame();
        const grown = card.getBoundingClientRect();
        expect(rest.top - grown.top).toBeCloseTo(growth, 1);
        // The band above the card's resting top, across its middle half (its
        // round corners aside).
        const band = {
          left: rest.left + rest.width / 4,
          top: rest.top - 24,
          width: rest.width / 2,
          height: 24,
        };
        const lifted = await shotOf(band);
        const scale = lifted.height / band.height;
        const putBack = withoutLift(stage);
        await frame();
        const cut = await shotOf(band);
        putBack();
        // Every row of the growth painted (one row of edge allowance), and
        // more of them than the old padding let through.
        expect(darkRows(lifted)).toBeGreaterThanOrEqual(
          Math.floor(growth * scale) - 1,
        );
        expect(darkRows(cut)).toBeLessThanOrEqual(Math.ceil(8 * scale) + 1);
        expect(darkRows(lifted)).toBeGreaterThan(darkRows(cut));
      } finally {
        card.style.removeProperty('scale');
        restore();
      }
    },
  );

  it.each([
    // [what, column, cards, a fixed width]
    ['the article’s three', 672, 3, undefined],
    ['five in a 64rem column', 1024, 5, undefined],
    ['five, a 372px fixed card', 1300, 5, LARGE],
  ] as const)(
    'moves NOTHING at rest — %s: the carousel and the strip above it, photographed with and without the lift, the same pixels, the fade at the edges included',
    async (_what, width, visible, cardWidth) => {
      const { region, stage } = mountDark(width, visible, cardWidth);
      const box = region.getBoundingClientRect();
      const still = {
        left: box.left,
        top: box.top - 40,
        width: box.width,
        height: box.height + 40,
      };
      const lifted = await shotOf(still);
      const putBack = withoutLift(stage);
      await frame();
      const before = await shotOf(still);
      putBack();
      expect([lifted.width, lifted.height]).toEqual([
        before.width,
        before.height,
      ]);
      // MEASURED: the same bytes in Chromium and Firefox; WebKit differs by
      // one level of 255 here and there, the mask sampled over a taller box.
      let most = 0;
      for (let i = 0; i < lifted.data.length; i++) {
        most = Math.max(most, Math.abs(lifted.data[i] - before.data[i]));
      }
      expect(most).toBeLessThanOrEqual(1);
    },
  );

  it('takes NO pointer in its strip: what stands right above the carousel keeps its presses there, a side card lets a press through to the hand’s box, and the centre card takes its own — grown into the strip as well', () => {
    const restore = withoutTransitions();
    render(
      <div style={{ width: '1300px' }}>
        <button
          type="button"
          style={{ display: 'block', width: '100%', height: '48px' }}
        >
          Deasupra
        </button>
        <CardCarousel
          slides={Array.from({ length: 7 }, (_, index) => (
            <div
              key={index}
              style={{ aspectRatio: '3 / 4', background: '#2b2724' }}
            />
          ))}
          slideLabels={Array.from({ length: 7 }, (_, i) => `${i + 1} din 7`)}
          labels={LABELS}
          mode="loop"
          visible={5}
          cardWidth={LARGE}
          env={STILL}
        />
      </div>,
    );
    const above = screen.getByRole('button', { name: 'Deasupra' });
    const region = screen.getByRole('region', { name: LABELS.region });
    const stage = region.querySelector('[aria-live]');
    if (!(stage instanceof HTMLElement)) throw new Error('no stage');
    const hand = stage.parentElement;
    const slides = [...stage.children].filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    );
    const centreSlide = slides.find((slide) => !slide.hasAttribute('inert'));
    const card = centreSlide?.firstElementChild;
    if (!(card instanceof HTMLElement)) throw new Error('no centre card');
    try {
      const top = region.getBoundingClientRect().top;
      const strip = stage.getBoundingClientRect();
      const lift = top - strip.top;
      // The premise: the strip is there, the button's last pixels under it.
      expect(lift).toBeGreaterThan(16);
      expect(above.getBoundingClientRect().bottom).toBeCloseTo(top, 1);
      const rest = card.getBoundingClientRect();
      const middle = rest.left + rest.width / 2;
      // In the strip: the button's.
      expect(document.elementFromPoint(middle, top - lift / 2)).toBe(above);
      // A side card — the centre one's right neighbour, at its middle row,
      // past the centre card's right edge: through to the hand's box, the
      // one with the drag's cursor.
      const right = slides
        .filter((slide) => slide !== centreSlide)
        .map((slide) => slide.getBoundingClientRect())
        .filter((box) => box.left + box.width / 2 > middle)
        .sort((a, b) => a.left - b.left)[0];
      const x = (rest.right + right.right) / 2;
      const y = right.top + right.height / 2;
      expect(x).toBeGreaterThan(rest.right);
      expect(x).toBeLessThan(strip.right - 36);
      const through = document.elementFromPoint(x, y);
      expect(through).toBe(hand);
      expect(through && getComputedStyle(through).cursor).toBe('grab');
      // The centre card: its own, at rest and grown into the strip.
      expect(
        document.elementFromPoint(middle, rest.top + rest.height / 2),
      ).toBe(card);
      card.style.scale = '1.05';
      const grown = card.getBoundingClientRect();
      expect(grown.top).toBeLessThan(top - 2);
      expect(document.elementFromPoint(middle, top - 2)).toBe(card);
    } finally {
      card.style.removeProperty('scale');
      restore();
    }
  });

  it.each([320, 390] as const)(
    'never paints past the screen’s edge with a card grown — a %ipx screen, three cards and five asked',
    async (screenWidth) => {
      await page.viewport(screenWidth, 900);
      for (const visible of [3, 5] as const) {
        const { card, unmount } = mountDark(screenWidth - 32, visible);
        card.style.scale = '1.05';
        await frame();
        const root = document.documentElement;
        expect(root.scrollWidth, `${visible} cards`).toBeLessThanOrEqual(
          root.clientWidth,
        );
        unmount();
      }
    },
  );
});

describe('CardCarousel — THE FIXED CARD: one width, the stage the column, a narrow column cut from the faded sides', () => {
  /** The Home band's miniature: 56.45 theme steps, 225.8px at the default
   *  root. */
  const WIDTH = 'calc(var(--spacing)*56.45)';
  const CARD = 225.8;

  /** The carousel of fixed cards in a frame `column` px wide. */
  function mountFixed(column: number, visible: 3 | 5) {
    const drawn = render(
      <div style={{ width: `${column}px` }}>
        <CardCarousel
          slides={cards()}
          slideLabels={Array.from({ length: 7 }, (_, i) => `${i + 1} din 7`)}
          labels={LABELS}
          mode="loop"
          visible={visible}
          cardWidth={WIDTH}
          env={STILL}
        />
      </div>,
    );
    const region = screen.getByRole('region', { name: LABELS.region });
    const stage = region.querySelector('[aria-live]');
    if (!(stage instanceof HTMLElement)) throw new Error('no stage');
    const slides = [...stage.children].filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    );
    const centre = slides.find((slide) => !slide.hasAttribute('inert'));
    if (centre === undefined) throw new Error('no centre card');
    return { ...drawn, region, stage, slides, centre };
  }

  /** The centre card whole — inside the stage — and on its middle. */
  function expectCentred(stage: HTMLElement, centre: HTMLElement): void {
    const box = stage.getBoundingClientRect();
    const card = centre.getBoundingClientRect();
    expect(card.left).toBeGreaterThanOrEqual(box.left - 0.01);
    expect(card.right).toBeLessThanOrEqual(box.right + 0.01);
    expect(card.left + card.width / 2).toBeCloseTo(box.left + box.width / 2, 1);
  }

  it.each([1106, 900, 817, 745, 614, 395.6, 351, 288])(
    'keeps the five-card window in a %spx column: every card 225.8px, the stage the column, the room what the column leaves beside the window, the fade the outermost card’s 40 %, the arrows at the column’s edges, the centre card whole and centred',
    (column) => {
      const { region, stage, slides, centre } = mountFixed(column, 5);
      const { ratio, fade } = ARRANGEMENTS[5];
      // Every card the given width — what the drag's step reads, too.
      for (const slide of slides) {
        expect(parseFloat(getComputedStyle(slide).width)).toBeCloseTo(CARD, 1);
      }
      // The stage the column, the root the column.
      const box = stage.getBoundingClientRect();
      expect(box.width).toBeCloseTo(column, 1);
      expect(region.getBoundingClientRect().width).toBeCloseTo(column, 1);
      // The room a side, then the fade — the outermost card's 40 %, never
      // past the centre card's edge — read off the mask itself.
      const [clear, opaque] = maskStops(stage);
      const room = Math.max(0, (column - ratio * CARD) / 2);
      expect(clear).toBeCloseTo(room, 1);
      expect(opaque - clear).toBeCloseTo(
        Math.min(fade * CARD, Math.max(0, (column - CARD) / 2 - room)),
        1,
      );
      // The arrows at the stage's — the column's — two edges.
      const previous = screen
        .getByRole('button', { name: LABELS.previous })
        .getBoundingClientRect();
      const next = screen
        .getByRole('button', { name: LABELS.next })
        .getBoundingClientRect();
      expect(previous.left).toBeCloseTo(box.left, 1);
      expect(next.right).toBeCloseTo(box.right, 1);
      expectCentred(stage, centre);
      // THE LIFT: a twentieth of the given card above the root.
      expect(region.getBoundingClientRect().top - box.top).toBeCloseTo(
        0.05 * CARD,
        1,
      );
    },
  );

  it.each([1106, 395.6, 351])(
    'keeps the three-card window in a %spx column, its room what the column leaves and none past the window',
    (column) => {
      const { stage, centre } = mountFixed(column, 3);
      const { ratio, fade } = ARRANGEMENTS[3];
      const [clear, opaque] = maskStops(stage);
      expect(stage.getBoundingClientRect().width).toBeCloseTo(column, 1);
      const room = Math.max(0, (column - ratio * CARD) / 2);
      expect(clear).toBeCloseTo(room, 1);
      expect(opaque - clear).toBeCloseTo(
        Math.min(fade * CARD, Math.max(0, (column - CARD) / 2 - room)),
        1,
      );
      expectCentred(stage, centre);
    },
  );

  it.each([320, 390] as const)(
    'never scrolls sideways — a %ipx screen, five cards and three, the sides cut from the fade',
    async (screenWidth) => {
      await page.viewport(screenWidth, 900);
      for (const visible of [3, 5] as const) {
        const { stage, centre, unmount } = mountFixed(
          screenWidth - 32,
          visible,
        );
        const root = document.documentElement;
        expect(root.scrollWidth, `${visible} cards`).toBeLessThanOrEqual(
          root.clientWidth,
        );
        expectCentred(stage, centre);
        unmount();
      }
    },
  );

  /**
   * The fixed carousel of BLACK cards in ui/Container's column on a `screen`
   * px window — the site's own gutter — or, for comparison, the article's
   * three-card capped gallery in the same column.
   */
  async function mountOnScreen(screenWidth: number, fixed: boolean) {
    await page.viewport(screenWidth, 900);
    // A phone's scrollbars are overlays: no gutter, the column the window
    // less ui/Container's own (this runner draws classic ones). Put back
    // after each test.
    document.documentElement.style.setProperty('scrollbar-width', 'none');
    const drawn = render(
      <Container>
        <CardCarousel
          slides={Array.from({ length: 7 }, (_, index) => (
            <div
              key={index}
              style={{ aspectRatio: '3 / 4', background: '#000' }}
            />
          ))}
          slideLabels={Array.from({ length: 7 }, (_, i) => `${i + 1} din 7`)}
          labels={LABELS}
          mode="loop"
          visible={fixed ? 5 : 3}
          env={STILL}
          {...(fixed ? { cardWidth: WIDTH } : {})}
        />
      </Container>,
    );
    const region = screen.getByRole('region', { name: LABELS.region });
    const stage = region.querySelector('[aria-live]');
    if (!(stage instanceof HTMLElement)) throw new Error('no stage');
    const centre = [...stage.children].find(
      (child) => !child.hasAttribute('inert'),
    );
    if (!(centre instanceof HTMLElement)) throw new Error('no centre card');
    const previous = screen.getByRole('button', { name: LABELS.previous });
    const next = screen.getByRole('button', { name: LABELS.next });
    return { ...drawn, stage, centre, previous, next };
  }

  afterEach(() => {
    document.documentElement.style.removeProperty('scrollbar-width');
  });

  it.each([280, 320, 360, 375, 390] as const)(
    'keeps the centre card WHOLE on a %ipx phone: the fade ends at its edge, never inside it, and the arrows’ strips stand beside it — 24px at the least',
    async (screenWidth) => {
      const { stage, centre, previous, next } = await mountOnScreen(
        screenWidth,
        true,
      );
      const box = stage.getBoundingClientRect();
      const card = centre.getBoundingClientRect();
      const beside = card.left - box.left;
      expect(box.right - card.right).toBeCloseTo(beside, 1);
      // THE FADE: the five-card window's 40 %, short of the centre card.
      const [clear, opaque] = maskStops(stage);
      expect(clear).toBeCloseTo(0, 1);
      expect(opaque - clear).toBeCloseTo(
        Math.min(ARRANGEMENTS[5].fade * CARD, Math.max(0, beside - clear)),
        1,
      );
      expect(opaque).toBeLessThanOrEqual(beside + 0.05);
      // THE STRIPS: the whole bar where there is room for it beside the
      // card, what there is down to 24px, 24px below that.
      const strip = Math.min(BAR, Math.max(24, beside));
      for (const control of [previous, next]) {
        expect(control.getBoundingClientRect().width).toBeCloseTo(strip, 1);
      }
      const over = Math.max(0, 24 - beside);
      expect(previous.getBoundingClientRect().right - card.left).toBeCloseTo(
        over > 0 ? over : Math.min(0, strip - beside),
        1,
      );
      expect(card.right - next.getBoundingClientRect().left).toBeCloseTo(
        over > 0 ? over : Math.min(0, strip - beside),
        1,
      );
      if (over === 0) {
        // The card's edge takes a press, never the arrow over it…
        expect(
          centre.contains(
            document.elementFromPoint(
              card.left + 1,
              card.top + card.height / 2,
            ),
          ),
        ).toBe(true);
        // …and the card's own edges are as dark as its middle: no part of it
        // faded, and no part of a chevron over it.
        const image = await pixelsOf(stage);
        const scale = image.width / box.width;
        for (const fraction of [0.08, 0.5, 0.92]) {
          const row = Math.round(
            (card.top - box.top + card.height * fraction) * scale,
          );
          const at = (x: number): number =>
            luminanceAt(image, Math.round((x - box.left) * scale), row);
          const middle = at(card.left + card.width / 2);
          expect(at(card.left + 1)).toBeCloseTo(middle, 2);
          expect(at(card.right - 2)).toBeCloseTo(middle, 2);
        }
      }
      // The chevron's whole drawing — its box, the arm ends' halo — inside
      // its strip at every width: the box narrows with a narrowed strip.
      for (const [control, outward] of [
        [previous, -1],
        [next, 1],
      ] as const) {
        const svg = control.querySelector('svg');
        const halo = svg?.querySelector('path');
        if (!svg || !halo) throw new Error('no chevron');
        const glyph = svg.getBoundingClientRect();
        const bar = control.getBoundingClientRect();
        const reach =
          parseFloat(getComputedStyle(halo).strokeWidth) / 2 - glyph.width / 24;
        expect(glyph.left).toBeGreaterThanOrEqual(bar.left - 0.01);
        expect(glyph.right).toBeLessThanOrEqual(bar.right + 0.01);
        if (outward < 0) {
          expect(glyph.right + reach).toBeLessThanOrEqual(bar.right + 0.1);
        } else {
          expect(glyph.left - reach).toBeGreaterThanOrEqual(bar.left - 0.1);
        }
      }
    },
  );

  it('never draws a fixed card’s strip under 24px either: at a 9px default font size, nine theme steps are 20.25px, and a column with room to spare beside the card keeps the floor', () => {
    // 0.140625rem in this 16px runner is a 9px root's quarter rem: the card
    // 127px, a 1024px column leaving 448.5px beside it — the bar the binding
    // term, under the floor.
    render(
      <div
        style={{ width: '1024px', '--spacing': '0.140625rem' } as CSSProperties}
      >
        <CardCarousel
          slides={cards()}
          slideLabels={Array.from({ length: 7 }, (_, i) => `${i + 1} din 7`)}
          labels={LABELS}
          mode="loop"
          visible={5}
          cardWidth={WIDTH}
          env={STILL}
        />
      </div>,
    );
    const region = screen.getByRole('region', { name: LABELS.region });
    const stage = region.querySelector('[aria-live]');
    if (!(stage instanceof HTMLElement)) throw new Error('no stage');
    const centre = [...stage.children].find(
      (child) => !child.hasAttribute('inert'),
    );
    if (!(centre instanceof HTMLElement)) throw new Error('no centre card');
    expect(parseFloat(getComputedStyle(centre).width)).toBeCloseTo(
      56.45 * 2.25,
      1,
    );
    for (const name of [LABELS.previous, LABELS.next]) {
      const bar = screen.getByRole('button', { name }).getBoundingClientRect();
      expect(bar.width, name).toBeCloseTo(24, 1);
    }
  });

  it.each([768, 1401] as const)(
    'changes nothing on a %ipx window: the whole fade, the whole bar',
    async (screenWidth) => {
      const { stage, previous, next } = await mountOnScreen(screenWidth, true);
      const [clear, opaque] = maskStops(stage);
      expect(opaque - clear).toBeCloseTo(ARRANGEMENTS[5].fade * CARD, 1);
      for (const control of [previous, next]) {
        expect(control.getBoundingClientRect().width).toBeCloseTo(BAR, 1);
      }
    },
  );

  it.each([280, 320, 360, 375, 390] as const)(
    'leaves the article’s three-card capped gallery as it was on a %ipx phone: the whole bar, the whole fade',
    async (screenWidth) => {
      const { stage, previous, next } = await mountOnScreen(screenWidth, false);
      const [clear, opaque] = maskStops(stage);
      const width = parseFloat(getComputedStyle(stage.children[0]).width);
      expect(opaque - clear).toBeCloseTo(ARRANGEMENTS[3].fade * width, 1);
      for (const control of [previous, next]) {
        expect(control.getBoundingClientRect().width).toBeCloseTo(BAR, 1);
      }
    },
  );
});

describe('CardCarousel — THE CARDS’ HEIGHT: their own, or the tallest’s', () => {
  /** Seven stand-ins of unequal shape — the 3:5 one the tallest — each
   *  filling its box's height where the box is stretched (`h-full`). */
  const SHAPES = [
    [3, 4],
    [1, 1],
    [2, 3],
    [4, 5],
    [3, 5],
    [1, 1],
    [3, 4],
  ] as const;

  function mountShapes(cardHeight?: 'own' | 'tallest') {
    const drawn = render(
      <div style={{ width: '1024px' }}>
        <CardCarousel
          slides={SHAPES.map(([w, h], index) => (
            <div
              key={index}
              className="h-full"
              style={{ aspectRatio: `${w} / ${h}` }}
            />
          ))}
          slideLabels={Array.from({ length: 7 }, (_, i) => `${i + 1} din 7`)}
          labels={LABELS}
          mode="loop"
          visible={5}
          env={STILL}
          {...(cardHeight === undefined ? {} : { cardHeight })}
        />
      </div>,
    );
    const region = screen.getByRole('region', { name: LABELS.region });
    const stage = region.querySelector('[aria-live]');
    if (!(stage instanceof HTMLElement)) throw new Error('no stage');
    const slides = [...stage.children].filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    );
    const cards = slides.map((slide) => {
      const card = slide.firstElementChild;
      if (!(card instanceof HTMLElement)) throw new Error('an empty card box');
      return card;
    });
    return { ...drawn, stage, slides, cards };
  }

  /** A box's layout height, its transform aside. */
  const heightOf = (element: HTMLElement): number =>
    parseFloat(getComputedStyle(element).height);

  /** A box's layout middle, its transform aside. */
  const middleOf = (element: HTMLElement): number =>
    element.offsetTop + element.offsetHeight / 2;

  it("stretches every card’s box — and every card that says h-full — to the TALLEST card’s height with 'tallest': one height, one centre line", () => {
    const { slides, cards } = mountShapes('tallest');
    const width = parseFloat(getComputedStyle(slides[0]).width);
    const tallest = (width * 5) / 3;
    for (const box of [...slides, ...cards]) {
      expect(heightOf(box)).toBeCloseTo(tallest, 1);
    }
    const middle = middleOf(slides[0]);
    for (const slide of slides) expect(middleOf(slide)).toBeCloseTo(middle, 0);
  });

  it("keeps each card at its OWN height by default — and with 'own' — every one centred on the one line", () => {
    for (const cardHeight of [undefined, 'own'] as const) {
      const { slides, unmount } = mountShapes(cardHeight);
      const width = parseFloat(getComputedStyle(slides[0]).width);
      slides.forEach((slide, index) => {
        const [w, h] = SHAPES[index];
        expect(heightOf(slide)).toBeCloseTo((width * h) / w, 1);
      });
      const middle = middleOf(slides[0]);
      for (const slide of slides) {
        expect(middleOf(slide)).toBeCloseTo(middle, 0);
      }
      unmount();
    }
  });

  it('grows every card TOGETHER when one grows — a longer translation, a reader’s text spacing — layout alone, nothing measured', async () => {
    const { slides, cards } = mountShapes('tallest');
    const width = parseFloat(getComputedStyle(slides[0]).width);
    cards[1].style.aspectRatio = '1 / 2';
    await frame();
    for (const box of [...slides, ...cards]) {
      expect(heightOf(box)).toBeCloseTo(width * 2, 1);
    }
  });
});

describe('CardCarousel — THE ROW of beads: as wide as its beads, centred on the column, into the page’s gutter where the column is the narrower', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('scrollbar-width');
  });

  /**
   * `count` cards in ui/Container's column on a `screenWidth` px window, a
   * phone's overlay scrollbars (no gutter): the Home band's twelve fixed
   * cards, or the article's eight in its three-card capped gallery.
   */
  async function mountRow(screenWidth: number, count: 8 | 12, fixed: boolean) {
    await page.viewport(screenWidth, 900);
    document.documentElement.style.setProperty('scrollbar-width', 'none');
    render(
      <Container>
        <CardCarousel
          slides={cards(count)}
          slideLabels={Array.from(
            { length: count },
            (_, i) => `${i + 1} din ${count}`,
          )}
          labels={LABELS}
          mode="loop"
          visible={fixed ? 5 : 3}
          env={STILL}
          {...(fixed ? { cardWidth: 'calc(var(--spacing)*56.45)' } : {})}
        />
      </Container>,
    );
    const region = screen.getByRole('region', { name: LABELS.region });
    const stage = region.querySelector('[aria-live]');
    if (!(stage instanceof HTMLElement)) throw new Error('no stage');
    const centre = [...stage.children].find(
      (child) => !child.hasAttribute('inert'),
    );
    if (!(centre instanceof HTMLElement)) throw new Error('no centre card');
    const picker = screen.getByRole('group', { name: LABELS.picker });
    const beads = [...picker.querySelectorAll('button')];
    return { region, centre, picker, beads };
  }

  /** The beads' lines: each line's beads, top to bottom. */
  function linesOf(beads: HTMLElement[]): DOMRect[][] {
    const lines = new Map<number, DOMRect[]>();
    for (const bead of beads) {
      const box = bead.getBoundingClientRect();
      const top = Math.round(box.top);
      lines.set(top, [...(lines.get(top) ?? []), box]);
    }
    return [...lines.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, boxes]) => boxes);
  }

  /** The middle of a line of beads. */
  const middleOf = (line: DOMRect[]): number =>
    (Math.min(...line.map((box) => box.left)) +
      Math.max(...line.map((box) => box.right))) /
    2;

  /** No width may make the page scroll sideways (§7). */
  const expectNoSidewaysScroll = (): void => {
    const root = document.documentElement;
    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  };

  it.each([320, 360, 390, 440] as const)(
    'keeps the Home band’s TWELVE beads on ONE line on a %ipx phone — centred under the centre card, into the gutter but never past it, each hit box 24 × 44 (the current pill’s 44 × 44)',
    async (screenWidth) => {
      const { region, centre, picker, beads } = await mountRow(
        screenWidth,
        12,
        true,
      );
      expect(beads).toHaveLength(12);
      const lines = linesOf(beads);
      expect(lines).toHaveLength(1);
      const card = centre.getBoundingClientRect();
      expect(middleOf(lines[0])).toBeCloseTo(card.left + card.width / 2, 1);
      // Into the page's gutter by 1rem at the most, never past the screen.
      const row = picker.getBoundingClientRect();
      const column = region.getBoundingClientRect();
      expect(row.left).toBeGreaterThanOrEqual(column.left - 16 - 0.01);
      expect(row.right).toBeLessThanOrEqual(column.right + 16 + 0.01);
      expect(row.left).toBeGreaterThanOrEqual(-0.01);
      expect(row.right).toBeLessThanOrEqual(screenWidth + 0.01);
      for (const bead of beads) {
        const box = bead.getBoundingClientRect();
        expect(box.height).toBeCloseTo(44, 1);
        expect(box.width).toBeCloseTo(
          bead.getAttribute('aria-current') === 'true' ? 44 : 24,
          1,
        );
      }
      expectNoSidewaysScroll();
    },
  );

  it('wraps the twelve beads on a 280px phone, where the screen is narrower than the row: ten over two, both lines centred, nothing sideways', async () => {
    const { centre, picker, beads } = await mountRow(280, 12, true);
    const lines = linesOf(beads);
    expect(lines.map((line) => line.length)).toEqual([10, 2]);
    const card = centre.getBoundingClientRect();
    for (const line of lines) {
      expect(middleOf(line)).toBeCloseTo(card.left + card.width / 2, 1);
    }
    expect(picker.getBoundingClientRect().width).toBeLessThanOrEqual(280.01);
    expectNoSidewaysScroll();
  });

  it.each([320, 390, 768] as const)(
    'leaves the article’s EIGHT beads where they stood on a %ipx window: one line, the row only as wide as they are, centred on the column',
    async (screenWidth) => {
      const { region, picker, beads } = await mountRow(screenWidth, 8, false);
      const lines = linesOf(beads);
      expect(lines).toHaveLength(1);
      const column = region.getBoundingClientRect();
      expect(middleOf(lines[0])).toBeCloseTo(column.left + column.width / 2, 1);
      // Seven 24px boxes and the current pill's 44.
      expect(picker.getBoundingClientRect().width).toBeCloseTo(7 * 24 + 44, 1);
      expectNoSidewaysScroll();
    },
  );
});

describe('CardCarousel — the beads, drawn', () => {
  /** A seven-card loop in a 1024px column, with its beads. */
  function mountBeads() {
    renderAt(1024, 5);
    const picker = screen.getByRole('group', { name: LABELS.picker });
    const beads = [...picker.querySelectorAll('button')];
    const region = screen.getByRole('region', { name: LABELS.region });
    const stage = region.querySelector('[aria-live]');
    if (!(stage instanceof HTMLElement)) throw new Error('no stage');
    const dotOf = (bead: HTMLElement): HTMLElement => {
      const dot = bead.querySelector('span');
      if (dot === null) throw new Error('no dot');
      return dot;
    };
    return { picker, beads, stage, dotOf };
  }

  it('lays the beads in a row centred under the stage, below its room — never over a card', () => {
    const { picker, stage } = mountBeads();
    const row = picker.getBoundingClientRect();
    const box = stage.getBoundingClientRect();
    expect(row.top).toBeGreaterThanOrEqual(box.bottom - 1 / 64);
    const beads = [...picker.querySelectorAll('button')].map((bead) =>
      bead.getBoundingClientRect(),
    );
    const left = Math.min(...beads.map((bead) => bead.left));
    const right = Math.max(...beads.map((bead) => bead.right));
    expect((left + right) / 2).toBeCloseTo(box.left + box.width / 2, 1);
    // One row: every bead on the same line.
    expect(new Set(beads.map((bead) => Math.round(bead.top))).size).toBe(1);
  });

  it('draws the Hero’s boxes: a 24 × 44 hit box round an 8px dot, the current card’s a 28px pill', () => {
    const restore = withoutTransitions();
    try {
      const { beads, dotOf } = mountBeads();
      for (const bead of beads) {
        const current = bead.getAttribute('aria-current') === 'true';
        const box = bead.getBoundingClientRect();
        const dot = dotOf(bead).getBoundingClientRect();
        expect(box.height).toBeCloseTo(44, 1);
        expect(box.width).toBeCloseTo(current ? 44 : 24, 1);
        expect(dot.height).toBeCloseTo(8, 1);
        expect(dot.width).toBeCloseTo(current ? 28 : 8, 1);
        expect(dot.top + dot.height / 2).toBeCloseTo(
          box.top + box.height / 2,
          1,
        );
      }
    } finally {
      restore();
    }
  });

  it.each([
    // [what, the frame's spacing step: the theme's quarter rem × s]
    ['a band scaled to 0.81 — an article at a 1140px window', '0.2025rem'],
    ['a band scaled to 0.912 — at a 1280px window', '0.228rem'],
    // A 12px default font size — Chrome's „Small" — draws every theme step at
    // 3px: the same 0.1875rem of this 16px runner (the Hero's case too).
    ['the rem steps of a 12px default font size', '0.1875rem'],
  ] as const)(
    'keeps every bead’s hit box at least 24px wide in %s, where the theme’s steps alone would draw it narrower — SC 2.5.8’s floor, unscaled, the dot centred in it, the box eleven steps tall',
    (_what, spacing) => {
      const restore = withoutTransitions();
      try {
        renderAt(1024, 5, { '--spacing': spacing } as CSSProperties);
        const picker = screen.getByRole('group', { name: LABELS.picker });
        const step = parseFloat(spacing) * ROOT;
        const beads = [...picker.querySelectorAll('button')];
        expect(beads).toHaveLength(7);
        for (const bead of beads) {
          const current = bead.getAttribute('aria-current') === 'true';
          const box = bead.getBoundingClientRect();
          const dot = bead.querySelector('span')?.getBoundingClientRect();
          if (dot === undefined) throw new Error('no dot');
          // The premise: the theme's steps alone would draw an idle box
          // narrower than 24px (two steps a side and a two-step dot).
          if (!current) expect(6 * step).toBeLessThan(24);
          expect(box.width).toBeGreaterThanOrEqual(24 - 1 / 64);
          expect(box.width).toBeCloseTo(current ? 11 * step : 24, 1);
          expect(box.height).toBeCloseTo(11 * step, 1);
          expect(box.height).toBeGreaterThanOrEqual(24);
          expect(dot.width).toBeCloseTo((current ? 7 : 2) * step, 1);
          expect(dot.left + dot.width / 2).toBeCloseTo(
            box.left + box.width / 2,
            1,
          );
        }
      } finally {
        restore();
      }
    },
  );

  it('borders the hit box in forced colours — where the dot’s ground is the system’s own and draws nothing to rely on', () => {
    // The plain utility alone (ui/PillButton wears its coloured siblings).
    const found = styleRules().filter(
      (rule) => rule.selector === '.forced-colors\\:border',
    );
    expect(found).toHaveLength(1);
    expect(found[0].media).toContain('(forced-colors: active)');
    expect(found[0].borderWidth).toBe('1px');
  });

  it('paints them for the page ground: the idle dot `--ink-faint` — 3:1 kept on the page and on white — darker under a REAL pointer, the current pill the lavender', async () => {
    const restore = withoutTransitions();
    try {
      const { beads, dotOf } = mountBeads();
      const page = token('--page');
      const white = token('--surface');
      const faint = token('--ink-faint');
      const muted = token('--ink-muted');
      const accent = token('--accent');
      expect(faint).toBe('rgb(118, 111, 105)');
      expect(contrast(faint, page)).toBeCloseTo(4.7, 2);
      expect(contrast(faint, white)).toBeCloseTo(4.94, 2);
      expect(contrast(muted, page)).toBeCloseTo(6.99, 2);
      expect(contrast(accent, page)).toBeCloseTo(4.81, 2);
      expect(contrast(accent, white)).toBeCloseTo(5.06, 2);
      for (const bead of beads) {
        const current = bead.getAttribute('aria-current') === 'true';
        expect(getComputedStyle(dotOf(bead)).backgroundColor).toBe(
          current ? accent : faint,
        );
      }
      const idle = beads[3];
      await realUser.hover(idle);
      expect(getComputedStyle(dotOf(idle)).backgroundColor).toBe(muted);
      await realUser.hover(beads[0]);
      expect(getComputedStyle(dotOf(beads[0])).backgroundColor).toBe(accent);
      expect(getComputedStyle(dotOf(idle)).backgroundColor).toBe(faint);
    } finally {
      restore();
    }
  });

  it('rings a bead for the keyboard: the house’s 2px of --focus, 2px outside its hit box', async () => {
    const { beads } = mountBeads();
    // A real Tab from the bead before it: the keyboard's modality.
    beads[1].focus();
    await realUser.tab();
    expect(document.activeElement).toBe(beads[2]);
    const ring = getComputedStyle(beads[2]);
    expect(ring.outlineStyle).toBe('solid');
    expect(ring.outlineWidth).toBe('2px');
    expect(ring.outlineOffset).toBe('2px');
    expect(ring.outlineColor).toBe('rgb(26, 23, 20)');
  });
});

describe('CardCarousel — THE CLICK RESPONDER brings no tap flash', () => {
  it('leaves the hand’s box, its responder set, and every card without a tap highlight: the page’s own preflight turns it off on <html> for the whole document', () => {
    const { stage, slides, unmount } = renderAt(1024, 3);
    const hand = stage.parentElement;
    if (!(hand instanceof HTMLElement)) throw new Error('no hand’s box');
    // The responder iOS needs for a tap's click (CardCarousel.tsx's THE
    // HAND) makes the box "clickable", and iOS flashes a clickable element
    // under a tap in its computed highlight colour — which, inherited from
    // <html>, is none here. Should the page ever bring the highlight back,
    // this turns red: the box would then want its own transparent one.
    expect(hand.onclick).toBeTypeOf('function');
    const highlight = (element: Element): string =>
      getComputedStyle(element).getPropertyValue('-webkit-tap-highlight-color');
    const none = 'rgba(0, 0, 0, 0)';
    expect(highlight(document.documentElement)).toBe(none);
    expect(highlight(hand)).toBe(none);
    for (const slide of slides) expect(highlight(slide)).toBe(none);
    unmount();
  });
});
