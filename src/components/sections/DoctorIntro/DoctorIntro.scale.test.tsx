import { render, screen, within } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline — the
// reason this file exists apart from DoctorIntro.test.tsx (the header below).
// tests/setup/components.ts loads no CSS globally; the per-file import is the
// house pattern (Card, Container, ClinicLocation, DoctorShowcase, PriceList).
import '@/styles/globals.css';
import { containerClasses } from '@/components/ui/Container/Container';
import { Keywords, type KeywordSegment } from '@/components/ui/Keyword/Keyword';
import {
  DoctorIntro,
  type DoctorIntroCredo,
  type DoctorIntroPhoto,
} from './DoctorIntro';

// sections/DoctorIntro — THE BAND SCALE, COMPUTED (2026-10-13, CLAUDE.md §15.32
// round 4; DoctorIntro.tsx's paragraph of that name). The owner, verbatim:
// "take current heading and eyebrow from main page. look how reactive and nice
// it is. make the exact same thing with the heading and eyebrow from the
// individual dr page" — and, asked how far, "Whole page, like Home".
//
// ── WHY A FILE OF ITS OWN. DoctorIntro.test.tsx pins the band's class TOKENS
// with no stylesheet loaded — its one premise, which every component suite in
// the repo shares. The scale, on the other hand, is a COMPUTED length — a
// class name cannot show a design pixel — so it needs the sheet. One premise
// per file (PriceList.scale.test.tsx's split): the class contract stays there,
// what the engine draws with it lives here.
//
// ── WHAT IS MEASURED. The band in a box that hands its Container a column of
// exactly `width` px — the gutter read off a probe wearing the real class,
// never assumed (ClinicLocation's, DoctorShowcase's and PriceList's
// `renderColumn`) — and every length of the opener that does NOT depend on a
// glyph's shape read back from the engine: THE BAND SCALE's box (its width
// and its offset in the column), the grid's paddings, inset and gap, the
// picture's track and its floor height, where the words begin and how wide
// they are, their inset and their top padding, the card's width and edge,
// the bottom container's paddings and gap, and the font SIZES of the name,
// the specialty and the card's words. A row's HEIGHT is left out on purpose:
// it follows how the words wrap, and no typeface is loaded here.
//   · OUTSIDE THE SCALE — under its step, or a phone's column — nothing is
//     declared and nothing remapped, and every length is the theme's rem,
//     written here with the rem literals the band wore until this lane (the
//     gap's 3rem and 10.5rem, the inset's 1.875rem cap, the card's 36rem): the
//     look develop shipped, to the twentieth of a pixel.
//   · AT THE REFERENCE — the owner's 1401 window, a 1106px column — the design
//     pixel is a CSS pixel and the opener is the 1401 design ITSELF: the gap
//     at its 168, the card in the words' 524.6, the name at the `hero` step's
//     65.04 there.
//   · INSIDE THE SCALE — under the reference, past it, and past the 96rem cap
//     — every one of those lengths is its REFERENCE value × s, s = min(column,
//     96rem) / 1106, the box capped and centred past the cap.
//   · THE ONE LENGTH THAT IS NOT: the card's TITLE. It answers to the card's
//     own `@container`, a step in CSS pixels, so it reads the `band` step's 36
//     design pixels only where the card's content box clears 28rem, and 30
//     under it — §15.24's card rule, re-measured here so the jump it makes on
//     a narrow laptop is a recorded fact, not a surprise.
// Tolerance: a twentieth of a pixel on a box (layout rounds to 1/64px) and a
// hundredth on a font size (a calc of px, never rounded).
//
// ── HARNESS NOTE — why a `process` shim, copied verbatim from
// DoctorIntro.test.tsx with its reason (which took it from Image.test.tsx).
// The `components` vitest project is bare Vite in a real chromium: no Next
// plugin, so nothing defines the `process` global. next/image reads
// process.env.__NEXT_IMAGE_OPTS at MODULE scope (image-component.js), so
// importing the real ExportedImage — which this band composes through ui/Image
// — throws "process is not defined" before a single test runs. vi.hoisted is
// the sanctioned pre-import seam (Vitest transforms static imports, so this
// really does execute first). Deliberately EMPTY env, not a copy of
// next.config.ts: with __NEXT_IMAGE_OPTS undefined next/image falls back to
// imageConfigDefault and the optimizer's own reads fall back to their
// documented defaults, i.e. the same shape the app ships.
vi.hoisted(() => {
  if (!('process' in globalThis)) {
    Object.defineProperty(globalThis, 'process', {
      value: { env: {} },
      configurable: true,
      writable: true,
    });
  }
});

/** THE BAND SCALE's numbers, written out (ui/Container's THE BAND SCALE —
 *  their census is tests/unit/design-scale.test.ts): the REFERENCE column,
 *  where a design pixel is a CSS pixel; the CAP and THE STEP in px at this
 *  runner's 16px root (the premise asserts it). Spelled again on purpose: the
 *  census holds the source, these hold what the engine does. */
const REFERENCE = 1106;
const ROOT = 16;
const CAP = 96 * ROOT;
const STEP = Math.max(56 * ROOT, 896);

/** The owner's window (§15.25 round 2: "1401x1063"), every case's window but
 *  the phone's, so ui/Heading's viewport clamp — the name outside the scale —
 *  reads the window the design was drawn at. */
const OWNER_WINDOW = { width: 1401, height: 1063 } as const;
const PHONE_WINDOW = { width: 390, height: 844 } as const;

const PHOTO: DoctorIntroPhoto = {
  src: '/images/demo/cutout-1.png',
  width: 900,
  height: 1200,
};
const NAME = 'Dr. Elena Marin';
const POSITION = 'Medic specialist ortodonție';
const SEGMENTS: readonly KeywordSegment[] = [
  { text: 'Ascultarea', keyword: true },
  { text: ' pacientului deschide fiecare consultație.', keyword: false },
];
const CREDO: DoctorIntroCredo = {
  eyebrow: 'În cuvintele mele',
  title: 'Filozofia mea',
  body: <Keywords segments={SEGMENTS} />,
};

/** ui/Container's gutter per side at this window, read off a probe wearing
 *  the real class — the clamp is spelled once, in Container.tsx. */
const gutter = (): number => {
  const probe = document.createElement('div');
  probe.className = containerClasses;
  document.body.append(probe);
  try {
    return parseFloat(getComputedStyle(probe).marginLeft);
  } finally {
    probe.remove();
  }
};

/** One `vw` of this window in px, read off a probe rather than inferred
 *  from `innerWidth` — what ui/Heading's `hero` clamp reads, whatever an
 *  engine counts into a viewport unit beside a classic scrollbar. */
const vw = (): number => {
  const probe = document.createElement('div');
  probe.style.width = '100vw';
  document.body.append(probe);
  try {
    return probe.getBoundingClientRect().width / 100;
  } finally {
    probe.remove();
  }
};

/** IS THE REGIME ON for this box? globals.css's `design-scale` remaps
 *  `--spacing` on the box that wears it; elsewhere the box inherits the
 *  root's (DoctorShowcase.test.tsx's and PriceList.scale.test.tsx's
 *  `remapped`). */
const remapped = (element: Element): boolean =>
  getComputedStyle(element).getPropertyValue('--spacing') !==
  getComputedStyle(document.documentElement).getPropertyValue('--spacing');

const px = (element: Element, property: string): number =>
  parseFloat(getComputedStyle(element).getPropertyValue(property));

/** The node a query found, as an HTMLElement — or a failure that NAMES what
 *  went missing (PriceList.scale.test.tsx's `htmlElement`). */
const htmlElement = (
  node: Element | null | undefined,
  name: string,
): HTMLElement => {
  if (!(node instanceof HTMLElement)) {
    throw new Error(`THE BAND SCALE: no ${name}`);
  }
  return node;
};

/** The band, Romanian, in a box whose Container gets a `width` px column, and
 *  its boxes by structure: section → ui/Container → THE BAND SCALE's box →
 *  the grid → the picture's container and the words' → the pair and the
 *  bottom container. The premise every number rests on is checked first. */
const renderColumn = (width: number) => {
  const { unmount } = render(
    <div style={{ width: `${width + 2 * gutter()}px` }}>
      <DoctorIntro
        name={NAME}
        position={POSITION}
        photo={PHOTO}
        credo={CREDO}
      />
    </div>,
  );
  const name = screen.getByRole('heading', { level: 1, name: NAME });
  const band = htmlElement(name.closest('section'), 'band');
  const column = htmlElement(band.firstElementChild, 'ui/Container column');
  const frame = htmlElement(column.firstElementChild, 'band-scale box');
  const grid = htmlElement(frame.firstElementChild, 'grid');
  const picture = htmlElement(grid.children[0], 'picture container');
  const words = htmlElement(grid.children[1], 'words container');
  const bottom = htmlElement(words.children[1], 'bottom container');
  const credo = screen.getByRole('region', { name: CREDO.title });
  const quote = htmlElement(
    within(credo).getByRole('blockquote').firstElementChild,
    'credo quote',
  );
  expect(column.getBoundingClientRect().width, 'the column').toBeCloseTo(
    width,
    1,
  );
  return {
    unmount,
    column,
    frame,
    grid,
    picture,
    words,
    bottom,
    credo,
    quote,
    name,
    position: screen.getByText(POSITION),
  };
};

type Scene = ReturnType<typeof renderColumn>;

/** Every length of the opener that does not follow how the words wrap, read
 *  from the engine (the header's WHAT IS MEASURED), each with its label. The
 *  geometry of the row needs the step (`@3xl`), so the stacked cases read a
 *  shorter list of their own. */
const lengthsOf = (scene: Scene): Record<string, number> => {
  const { column, frame, grid, picture, words, bottom, credo, quote } = scene;
  const box = frame.getBoundingClientRect();
  const wordsBox = words.getBoundingClientRect();
  const credoBox = credo.getBoundingClientRect();
  return {
    'the band-scale box’s width': box.width,
    'the band-scale box’s offset':
      box.left - column.getBoundingClientRect().left,
    'the band top': px(grid, 'padding-top'),
    'the band bottom': px(grid, 'padding-bottom'),
    'the inset before the picture': px(grid, 'padding-inline-start'),
    'the gap between the containers': px(grid, 'column-gap'),
    'the picture’s track': picture.getBoundingClientRect().width,
    'the picture’s floor height': px(picture, 'min-height'),
    'the words’ start': wordsBox.left - box.left,
    'the words’ width': wordsBox.width,
    'the words’ inset': px(words, 'padding-inline-start'),
    'the name’s drop': px(words, 'padding-top'),
    'the card’s width': credoBox.width,
    'the card’s edge': credoBox.left - wordsBox.left,
    'the card’s air': px(bottom, 'padding-top'),
    'the slot’s gap': px(bottom, 'row-gap'),
    'the name': px(scene.name, 'font-size'),
    'the specialty': px(scene.position, 'font-size'),
    'the card’s words': px(quote, 'font-size'),
  };
};

/** The three lengths above that are font SIZES — held to a hundredth of a
 *  pixel, a calc of px never rounded; every other to a twentieth. */
const FONT_SIZES = new Set(['the name', 'the specialty', 'the card’s words']);

/** The card's CONTENT box — what its `@container` title step asks. */
const contentOf = (card: HTMLElement): number =>
  card.getBoundingClientRect().width -
  px(card, 'padding-left') -
  px(card, 'padding-right') -
  px(card, 'border-left-width') -
  px(card, 'border-right-width');

const titleOf = (scene: Scene): number =>
  px(within(scene.credo).getByRole('heading', { level: 2 }), 'font-size');

/** `actual` within `tolerance` of `expected`, the label and both numbers in
 *  the failure. */
const near = (
  actual: number,
  expected: number,
  label: string,
  tolerance = 0.05,
): void => {
  expect(
    Math.abs(actual - expected),
    `${label}: ${actual} against ${expected}`,
  ).toBeLessThanOrEqual(tolerance);
};

describe('DoctorIntro — THE BAND SCALE, computed (§15.32 round 4 — the real stylesheet)', () => {
  let window0: { width: number; height: number };

  beforeAll(async () => {
    // Recorded FIRST, so `afterAll` can put the window back even when a
    // premise below fails (G2 typescript, a nit).
    window0 = { width: window.innerWidth, height: window.innerHeight };
    // THE PREMISE: this runner is a place where the regime CAN apply — a fine
    // primary pointer and an engine that registers custom properties, the two
    // conditions of globals.css's THE SCALABLE VARIANT — at the 16px root
    // CAP is written at. Otherwise every case below that expects the scale
    // would fail for a reason that reads as the band's, and every case that
    // expects none would pass for the wrong one.
    expect(
      window.matchMedia('(pointer: fine)').matches,
      'the runner’s primary pointer is fine — a mouse, as on a laptop',
    ).toBe(true);
    expect(
      CSS.supports('color', 'rgb(from red r g b)'),
      'the engine passes the registration gate (relative colour syntax)',
    ).toBe(true);
    expect(
      parseFloat(getComputedStyle(document.documentElement).fontSize),
      'the default 16px root (CAP is spelled at it)',
    ).toBe(ROOT);
    await page.viewport(OWNER_WINDOW.width, OWNER_WINDOW.height);
  });

  afterAll(async () => {
    await page.viewport(window0.width, window0.height);
  });

  it('leaves a column UNDER the step as develop drew it — nothing declared, the theme’s rem: the gap’s 3rem and 10.5rem, the inset’s 1.875rem, the card’s 36rem, the name on `hero`’s clamp', () => {
    const width = 880;
    expect(width).toBeLessThan(STEP);
    const scene = renderColumn(width);
    const { frame, grid } = scene;

    expect(remapped(frame)).toBe(false);
    expect(remapped(grid)).toBe(false);
    // The registered initial value: nothing declared it.
    expect(getComputedStyle(frame).getPropertyValue('--scale-px')).toBe('1px');
    // Beside the picture (48rem of column is the step), every share of the
    // opener read off the column itself — the box is the column's width.
    const lengths = lengthsOf(scene);
    const rem = ROOT;
    const inset = Math.min(0.01875 * width, 1.875 * rem);
    const third = width / 3;
    const gap = Math.min(Math.max(3 * rem, width / 6), 10.5 * rem);
    const wordsWidth = width - inset - third - gap;
    near(lengths['the band-scale box’s width'], width, 'the box');
    near(lengths['the band-scale box’s offset'], 0, 'the box’s offset');
    near(lengths['the band top'], 2.5 * rem, 'the band top');
    near(lengths['the band bottom'], 2.5 * rem, 'the band bottom');
    near(lengths['the inset before the picture'], inset, 'the inset');
    near(lengths['the gap between the containers'], gap, 'the gap');
    near(lengths['the picture’s track'], third, 'the third');
    near(lengths['the picture’s floor height'], (third * 4) / 3, 'the floor');
    near(lengths['the words’ start'], inset + third + gap, 'the words’ start');
    near(lengths['the words’ width'], wordsWidth, 'the words’ width');
    near(lengths['the words’ inset'], 1.5 * rem, 'the words’ inset');
    near(lengths['the name’s drop'], width / 9, 'the name’s drop');
    near(
      lengths['the card’s width'],
      Math.min(36 * rem, wordsWidth - 1.5 * rem),
      'the card',
    );
    near(lengths['the card’s edge'], 1.5 * rem, 'the card’s edge');
    near(lengths['the card’s air'], 1.5 * rem, 'the card’s air');
    near(lengths['the slot’s gap'], 1.5 * rem, 'the slot’s gap');
    near(
      lengths['the name'],
      Math.min(4.5 * rem, Math.max(2 * rem, rem + 3.5 * vw())),
      'the name, `hero`’s clamp',
      0.01,
    );
    near(lengths['the specialty'], 0.875 * rem, 'the specialty', 0.01);
    near(lengths['the card’s words'], 1.25 * rem, 'the card’s words', 0.01);
  });

  it('leaves a PHONE’s column as develop drew it — the stack, the box the column’s own width, the name on `hero`’s floor', async () => {
    await page.viewport(PHONE_WINDOW.width, PHONE_WINDOW.height);
    try {
      const width = 351;
      const scene = renderColumn(width);
      const { frame, grid, name } = scene;

      expect(remapped(frame)).toBe(false);
      expect(getComputedStyle(frame).getPropertyValue('--scale-px')).toBe(
        '1px',
      );
      near(frame.getBoundingClientRect().width, width, 'the box');
      // ONE track, the column's width; the rhythm `pt-6 pb-8` under `@lg`.
      expect(
        getComputedStyle(grid).gridTemplateColumns.split(' '),
      ).toHaveLength(1);
      near(px(grid, 'padding-top'), 1.5 * ROOT, 'the band top');
      near(px(grid, 'padding-bottom'), 2 * ROOT, 'the band bottom');
      near(px(name, 'font-size'), 2 * ROOT, 'the name, `hero`’s floor', 0.01);
    } finally {
      await page.viewport(OWNER_WINDOW.width, OWNER_WINDOW.height);
    }
  });

  it('draws the 1401 design ITSELF at the reference column — the design pixel a CSS pixel, the gap at its 168, the name at `hero`’s value in the owner’s window', () => {
    const scene = renderColumn(REFERENCE);
    const { frame } = scene;

    expect(remapped(frame)).toBe(true);
    near(px(frame, '--scale-px'), 1, 'the design pixel', 0.0001);
    const lengths = lengthsOf(scene);
    const inset = 0.01875 * REFERENCE;
    const third = REFERENCE / 3;
    const wordsWidth = REFERENCE - inset - third - 168;
    near(lengths['the band-scale box’s width'], REFERENCE, 'the box');
    near(lengths['the band top'], 40, 'the band top');
    near(lengths['the inset before the picture'], inset, 'the inset');
    // A sixth of the design is 184.3 of its pixels: its 168 cap binds.
    near(lengths['the gap between the containers'], 168, 'the gap');
    near(lengths['the picture’s track'], third, 'the third');
    near(lengths['the words’ width'], wordsWidth, 'the words’ width');
    near(lengths['the name’s drop'], REFERENCE / 9, 'the name’s drop');
    // The words leave less than the card's 576: it takes their whole room.
    near(lengths['the card’s width'], wordsWidth - 24, 'the card');
    // The owner's look: the name at the `hero` step's value in his window.
    near(
      lengths['the name'],
      ROOT + 3.5 * 14.01,
      'the name, against `hero` at 1401',
      0.01,
    );
    near(lengths['the specialty'], 14, 'the specialty', 0.01);
    near(lengths['the card’s words'], 20, 'the card’s words', 0.01);
    // The card's content box clears 28rem here: its title on `band`'s 36.
    expect(contentOf(scene.credo)).toBeGreaterThanOrEqual(28 * ROOT);
    near(titleOf(scene), 36, 'the card’s title', 0.01);
  });

  it.each([
    { where: 'the step’s first columns', width: 900 },
    { where: 'a laptop past the reference', width: 1382.5 },
    { where: 'a column past the 96rem cap', width: 2000 },
  ])(
    'draws every length at $where as the reference × s — the box capped and centred past the cap',
    ({ width }) => {
      expect(width).toBeGreaterThanOrEqual(STEP);
      const reference = renderColumn(REFERENCE);
      const design = lengthsOf(reference);
      reference.unmount();
      const scene = renderColumn(width);
      const s = Math.min(width, CAP) / REFERENCE;

      expect(remapped(scene.frame)).toBe(true);
      near(px(scene.frame, '--scale-px'), s, 'the design pixel', 0.0001);
      const lengths = lengthsOf(scene);
      for (const [label, value] of Object.entries(lengths)) {
        if (label === 'the band-scale box’s offset') continue;
        near(
          value,
          design[label] * s,
          `${label} at ${width}px`,
          FONT_SIZES.has(label) ? 0.01 : 0.05,
        );
      }
      // bandColumnClasses: as wide as the column up to the cap, centred past
      // it — and every share above read off the CAPPED box, the reason the
      // box is the opener's own size container.
      near(
        lengths['the band-scale box’s offset'],
        (width - Math.min(width, CAP)) / 2,
        'the box’s centring',
      );
    },
  );

  it('keeps the card’s TITLE on its own container’s CSS-pixel step — the one length that is not the design × s on a narrow laptop (§15.24’s card rule)', () => {
    // At the step's first columns the card's content box is under 28rem, so
    // its title reads `band`'s 30 design pixels where the reference reads 36:
    // a container step is a CSS length the scale does not redraw. Pinned, so
    // the jump stays a recorded fact (DoctorIntro.tsx's THE BAND SCALE).
    const scene = renderColumn(900);
    const s = 900 / REFERENCE;

    expect(contentOf(scene.credo)).toBeLessThan(28 * ROOT);
    near(titleOf(scene), 30 * s, 'the card’s title at 900px', 0.01);
    scene.unmount();
    const wide = renderColumn(1382.5);
    expect(contentOf(wide.credo)).toBeGreaterThanOrEqual(28 * ROOT);
    near(
      titleOf(wide),
      36 * (1382.5 / REFERENCE),
      'the card’s title at 1382.5px',
      0.01,
    );
  });
});
