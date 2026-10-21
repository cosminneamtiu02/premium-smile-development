import type { CSSProperties, ReactElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import { userEvent as realUser } from 'vitest/browser';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline — the
// reason this file exists apart from PostCover.test.tsx (the header below).
// tests/setup/components.ts loads no CSS globally; the per-file import is the
// house pattern (PostList.scale, Pagination.scale, BeforeAfter.scale).
import '@/styles/globals.css';
import {
  bandColumnClasses,
  bandScaleClasses,
} from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx/cx';
import { PostCover, type PostCoverOwnProps } from './PostCover';

// sections/PostCover — THE CHIPS FOLLOW THEIR COVER, COMPUTED (PostCover.tsx's
// THE TAGS): the tag list draws in its own design pixel — sections/PostCard's
// formula, the cover's width over 513.40625 never under 0.75rem / 18, capped
// at the page's own pixel — and in it every chip is the atom's own: 44 tall,
// 20 of padding, an 18 label, the list three steps (12) into the picture's
// top-right corner, its chips three steps apart.
//
// ── WHY A FILE OF ITS OWN. PostCover.test.tsx's premise is that NO
// stylesheet is loaded: the utility tokens are its contract. A chip's height,
// its label's size and the pixel the engine computes are COMPUTED lengths — a
// class name cannot show one — so they need the sheet. One premise per file
// (PriceList.scale.test.tsx's precedent).
//
// ── WHAT IS MEASURED:
//   · THE FORMULA, cover-relative: the cover alone in a box of exactly `width`
//     px — its root is the list's nearest container, so its width is the one
//     `100cqw` reads, whatever the window — on the floor (288, a 320 phone's
//     cover), on the card's ratio (351, a 390 phone's), exactly on the
//     reference (513.40625) and over it, capped at the page's own pixel (614,
//     a 768 tablet's; 1200);
//   · THE CAP, under an ancestor that draws the page in a design pixel of its
//     own — `design-scale` with the pixel set INLINE (a style, never an
//     arbitrary class: Tailwind reads tests too), as ui/Container's THE BAND
//     SCALE draws sections/PostPage's rhythm box: on covers wider than the
//     reference × that pixel the chips are 44 × the pixel (0.81 at the band's
//     step, 0.912 at a 1280 window, 1.389 past its cap), and on a cover
//     narrower than the reference × the pixel the card's ratio passes under
//     the cap;
//   · THE REAL CHAIN, once: the cover inside a rhythm box wearing
//     ui/Container's two band strings in a 1280px container — the classes the
//     page wears, behind their real gates (a fine pointer, an engine that
//     registers custom properties — named as premises first);
//   · THE ROOT: the cap is the page's spacing step over four, so it follows
//     the reader's default font size as every theme length does — at a 20px
//     root the cover's ratio passes under it, at a 30px root the floor holds
//     (a cap read off `--scale-px` itself would stay 1px and cut under it);
//   · THE GUARD, read from the compiled rules: the pixel and the remap style
//     the list only inside `@supports (width: 1cqw)`;
//   · THE LABELS: the chips keep the tag's face and size under a real hover,
//     and no chip shows a pointer cursor;
//   · THE ROW (PostCover.tsx's THE READING TIME'S BOX): a slot that grows
//     UNDER its 44px controls — sections/ShareLinks' status line, which opens
//     at the first press of the copy button and keeps its height — moves the
//     reading time by nothing, on one line and in THE BAND SCALE, its WORDS
//     level with the controls; wrapped, the box is the reading time's own; a
//     reading time taller than the cap (SC 1.4.12's paragraph spacing) grows
//     its box instead of overflowing it; and beside a line at rest — an empty
//     paragraph, which that spacing gives 2em — it sits 10 of the page's
//     pixels high, PostCover's recorded paragraph-spacing case.
// The real face is loaded first — Source Serif 4, the chips' face (the body's),
// as .storybook/preview-fonts.css declares it for Storybook, `font-display:
// block` so a fallback is never measured — beside the house's THE STILLNESS
// RULE in the same unlayered sheet. The pointer is parked off the cover
// before each case (PostCard.test.tsx's parkPointer, the house's rule: a
// resting pointer is :hover). Tolerances, as Vitest's `toBeCloseTo(x, n)`
// reads them — it passes within HALF of 10^−n: n = 1, ±0.05px, on a box, whose
// edges layout rounds to 1/64px (0.016) each; n = 2, ±0.005px, on a computed
// length (a calc of px, never rounded in Chromium — WebKit rounds a computed
// margin to 1/64px) and on the cover's own width, which
// its box's exact px width sets; n = 4, ±0.00005, on the pixel itself.

/** sections/PostCard's numbers, the formula both lists compute (KEEP-IN-SYNC
 *  — tests/unit/blog-tags-sync.test.ts holds the two sources equal): the
 *  label's floor, 0.75rem over 18, and the card's content width at the
 *  owner's 723 window, where the chips are the atom's own. */
const FLOOR_REM = 0.75;
const DIVISOR = 18;
const REFERENCE = 513.40625;

/** The atom's own lengths at a pixel of 1 (ui/PillButton): `min-h-11`,
 *  `px-5`, `text-lg`; and the list's three-step inset and gap. */
const CHIP = { height: 44, padding: 20, label: 18, inset: 12, gap: 12 };

/** The design pixel's NAME — the token itself is never spelled here
 *  (tests/unit/design-scale.test.ts's D-LIT RULE); the pixel an ancestor
 *  draws the page in is set as an inline style. */
const PIXEL = '--scale-px';

/** THE BAND SCALE's REFERENCE column (ui/Container's) — the real chain's
 *  design pixel is its container's width over it, below the 96rem cap. */
const BAND_REFERENCE = 1106;

const SERIF = 'Source Serif 4 SB';
const INJECTED_CSS = `
@font-face {
  font-family: '${SERIF}';
  src: url('/src/fonts/SourceSerif4Variable-subset.woff2') format('woff2');
  font-weight: 200 900;
  font-style: normal;
  font-display: block;
}
:root { --font-source-serif: '${SERIF}'; }
*, *::before, *::after { transition: none !important; animation: none !important; }
`;
let injected: HTMLStyleElement | null = null;
let unpark: (() => void) | undefined;

beforeAll(async () => {
  injected = document.createElement('style');
  injected.textContent = INJECTED_CSS;
  document.head.append(injected);
  // load(), not just ready: nothing has rendered yet — and a 404 on the
  // subset REJECTS here, loudly. The chips' weight, `font-medium`.
  await document.fonts.load(`500 1rem "${SERIF}"`);
  await document.fonts.ready;
});

afterAll(() => {
  injected?.remove();
});

// THE POINTER, PARKED off the cover before each case — PostCard.test.tsx's
// parkPointer, KEEP-IN-SYNC: a 2rem box prepended to the body and the REAL
// pointer on it (vitest/browser's userEvent — a synthetic event cannot move
// :hover), so nothing measured is hovered.
beforeEach(async () => {
  const parking = document.createElement('div');
  parking.style.cssText = 'width: 2rem; height: 2rem';
  document.body.prepend(parking);
  await realUser.hover(parking);
  unpark = () => parking.remove();
});

afterEach(() => {
  unpark?.();
  unpark = undefined;
  document.documentElement.style.fontSize = '';
});

/** The cover as the article page hands it over, in Romanian (§15.7). */
const COVER = {
  readingTime: '4 min de citit',
  image: { src: '/images/hero/lobby.jpg', alt: '' },
  tags: ['igienă', 'sfaturi'],
  tagsLabel: 'Categorii',
  share: null,
} as const satisfies PostCoverOwnProps;

/** The root's font size, in px — 16 in this runner unless a case moves it. */
const rootPx = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/** THE CHIPS FOLLOW THEIR COVER, the arithmetic the stylesheet runs: the
 *  smaller of the cap and the larger of the floor and the cover's width over
 *  the reference. */
const expectedPixel = (coverWidth: number, cap: number): number =>
  Math.min(
    cap,
    Math.max((FLOOR_REM * rootPx()) / DIVISOR, coverWidth / REFERENCE),
  );

/** The node a step found, as an HTMLElement — or a failure that NAMES what
 *  went missing, instead of a TypeError further on. */
const htmlElement = (
  node: Element | null | undefined,
  name: string,
): HTMLElement => {
  if (!(node instanceof HTMLElement)) {
    throw new Error(`PostCover, measured: no ${name}`);
  }
  return node;
};

/** The tag list and what the engine drew: the cover's width, the list's own
 *  pixel, its inset from the picture's top-right corner, its gap, and each
 *  chip's height, padding and label. */
const measure = () => {
  const list = screen.getByRole('list', { name: COVER.tagsLabel });
  const picture = htmlElement(list.parentElement, 'picture box');
  const cover = htmlElement(picture.parentElement, 'cover root');
  const listStyle = getComputedStyle(list);
  const listBox = list.getBoundingClientRect();
  const pictureBox = picture.getBoundingClientRect();
  return {
    list,
    coverWidth: cover.getBoundingClientRect().width,
    pixel: parseFloat(listStyle.getPropertyValue(PIXEL)),
    inset: {
      top: listBox.top - pictureBox.top,
      right: pictureBox.right - listBox.right,
    },
    gap: parseFloat(listStyle.columnGap),
    chips: within(list)
      .getAllByRole('listitem')
      .map((item) => {
        const style = getComputedStyle(item);
        return {
          item,
          height: item.getBoundingClientRect().height,
          padding: parseFloat(style.paddingInlineStart),
          label: parseFloat(style.fontSize),
        };
      }),
  };
};

/** Every length the list and its chips draw, each the atom's own × `pixel`. */
const expectChipsAt = (m: ReturnType<typeof measure>, pixel: number): void => {
  expect(m.pixel).toBeCloseTo(pixel, 4);
  expect(m.inset.top).toBeCloseTo(CHIP.inset * pixel, 1);
  expect(m.inset.right).toBeCloseTo(CHIP.inset * pixel, 1);
  expect(m.gap).toBeCloseTo(CHIP.gap * pixel, 2);
  expect(m.chips).toHaveLength(COVER.tags.length);
  for (const chip of m.chips) {
    expect(chip.height).toBeCloseTo(CHIP.height * pixel, 1);
    expect(chip.padding).toBeCloseTo(CHIP.padding * pixel, 2);
    expect(chip.label).toBeCloseTo(CHIP.label * pixel, 2);
  }
};

/** A style that may carry the design pixel's custom property by NAME. */
type PageStyle = CSSProperties & { [PIXEL]?: string };

/**
 * THE PAGE a case draws the cover in — the props of its <div>, shared by the
 * chips' cases and THE ROW's: exactly `width` px wide, the width-giving parent
 * the cover's inline-size containment needs, and either bare (the page drawn
 * in the theme's own step) or a design drawn at `pagePx` — globals.css's real
 * `design-scale`, the utility ui/Container's THE BAND SCALE switches on for
 * the page's band, the pixel set inline (the header).
 */
const pageProps = ({
  width,
  pagePx,
}: {
  width: number;
  pagePx?: number;
}): { className?: string; style: PageStyle } => ({
  className: pagePx === undefined ? undefined : 'design-scale',
  style: {
    width: `${width}px`,
    ...(pagePx === undefined ? {} : { [PIXEL]: `${pagePx}px` }),
  },
});

/** The cover alone on THE PAGE (`pageProps`), measured. */
const renderInBox = ({ width, pagePx }: { width: number; pagePx?: number }) => {
  render(
    <div {...pageProps({ width, pagePx })}>
      <PostCover {...COVER} />
    </div>,
  );
  return measure();
};

describe('PostCover — the chips follow their cover, measured (real stylesheet)', () => {
  it.each([
    {
      width: 288,
      shape: 'floor',
      design: 'a 320 phone’s cover — the floor: 29.3px chips, a 12px label',
    },
    {
      width: 351,
      shape: 'ratio',
      design: 'a 390 phone’s cover — the card’s ratio: ≈30.1px, ≈12.3px',
    },
    {
      width: REFERENCE,
      shape: 'reference',
      design: 'a cover exactly the card’s reference — the atom’s own',
    },
    {
      width: 614,
      shape: 'capped',
      design: 'a 768 tablet’s cover — capped at the page’s pixel: 44px, 18px',
    },
    {
      width: 1200,
      shape: 'capped',
      design: 'a wide cover drawn in the theme’s step — still the atom’s own',
    },
  ] as const)(
    'draws every chip at the atom × min(page, max(floor, cover ÷ 513.40625)) — $design',
    ({ width, shape }) => {
      const m = renderInBox({ width });
      const page = rootPx() / 16;
      const floor = (FLOOR_REM * rootPx()) / DIVISOR;
      const pixel = expectedPixel(m.coverWidth, page);

      expect(m.coverWidth).toBeCloseTo(width, 2);
      expectChipsAt(m, pixel);
      // …and what each case is FOR.
      if (shape === 'floor') {
        expect(m.coverWidth / REFERENCE).toBeLessThan(floor);
        expect(m.pixel).toBeCloseTo(floor, 4);
        for (const chip of m.chips) {
          expect(chip.label).toBeCloseTo(12, 2);
          expect(chip.height).toBeCloseTo(29.33, 1);
        }
      }
      if (shape === 'ratio') {
        expect(m.pixel).toBeGreaterThan(floor);
        expect(m.pixel).toBeLessThan(page);
        expect(m.pixel).toBeCloseTo(width / REFERENCE, 4);
        for (const chip of m.chips) {
          expect(chip.height).toBeCloseTo(30.08, 1);
          expect(chip.label).toBeCloseTo(12.31, 2);
        }
      }
      if (shape === 'reference') expect(m.pixel).toBe(1);
      if (shape === 'capped') {
        expect(m.coverWidth / REFERENCE).toBeGreaterThan(page);
        expect(m.pixel).toBe(page);
        for (const chip of m.chips) {
          expect(chip).toMatchObject({
            height: CHIP.height,
            padding: CHIP.padding,
            label: CHIP.label,
          });
        }
      }
    },
  );

  it.each([
    {
      width: 896,
      pagePx: 896 / BAND_REFERENCE,
      under: false,
      design: 'the band scale’s first column (0.81px) — 35.6px chips',
    },
    {
      width: 1009,
      pagePx: 0.912,
      under: false,
      design: 'a 1280 window’s band (0.912px) — 40.1px chips, a 16.4px label',
    },
    {
      width: 1229,
      pagePx: 1.389,
      under: false,
      design: 'a band past its cap (1.389px) — 61.1px chips, a 25px label',
    },
    {
      width: 600,
      pagePx: 1.389,
      under: true,
      design:
        'a cover narrower than the reference × the page’s pixel — the card’s ratio passes UNDER the cap',
    },
  ] as const)(
    'caps the chips at the PAGE’S own pixel, 44 × it on a cover wider than the reference × the page’s pixel — $design',
    ({ width, pagePx, under }) => {
      const m = renderInBox({ width, pagePx });

      expectChipsAt(m, expectedPixel(m.coverWidth, pagePx));
      if (under) {
        expect(m.coverWidth / REFERENCE).toBeLessThan(pagePx);
        expect(m.pixel).toBeCloseTo(width / REFERENCE, 4);
      } else {
        // The cap binds: 44 design pixels of the page, whatever the cover's
        // own ratio would draw (here up to 2.39 — a 105px chip).
        expect(m.coverWidth / REFERENCE).toBeGreaterThan(pagePx);
        expect(m.pixel).toBeCloseTo(pagePx, 4);
        for (const chip of m.chips) {
          expect(chip.height).toBeCloseTo(CHIP.height * pagePx, 1);
          expect(chip.label).toBeCloseTo(CHIP.label * pagePx, 2);
        }
      }
    },
  );

  it('reads the page’s pixel through the REAL chain — a rhythm box wearing ui/Container’s band strings, in a 1280px column: the chips are 44 of the band’s design pixels', () => {
    // THE PREMISES, named first: the band scale's gates — a fine primary
    // pointer and an engine that registers custom properties (globals.css's
    // `scalable` variant). Neither is this cover's to provide.
    expect(window.matchMedia('(pointer: fine)').matches, 'a fine pointer').toBe(
      true,
    );
    expect(
      CSS.supports('color', 'rgb(from red r g b)'),
      'relative colour syntax — an engine that registers custom properties',
    ).toBe(true);
    const column = 1280;
    render(
      <div className="@container" style={{ width: `${column}px` }}>
        <div
          className={cx(bandColumnClasses, bandScaleClasses, 'flex flex-col')}
        >
          <PostCover {...COVER} />
        </div>
      </div>,
    );
    const m = measure();
    const rhythm = htmlElement(
      m.list.parentElement?.parentElement?.parentElement,
      'rhythm box',
    );
    const band = parseFloat(getComputedStyle(rhythm).getPropertyValue(PIXEL));

    // The band's design pixel: the column over the REFERENCE (under the cap).
    expect(band).toBeCloseTo(column / BAND_REFERENCE, 4);
    // The cover spans the column, far past the card's reference, so the cap
    // binds and the chips are 44 of the band's pixels.
    expect(m.coverWidth).toBeCloseTo(column, 2);
    expect(m.coverWidth / REFERENCE).toBeGreaterThan(band);
    expectChipsAt(m, band);
  });

  it.each([
    {
      root: 20,
      design:
        'a 20px root — the cap is 1.25px, so the cover’s ratio passes under it: a 21.5px label',
    },
    {
      root: 30,
      design:
        'a 30px root — the floor, 1.25px, holds under the 1.875px cap: a 22.5px label, never less',
    },
  ] as const)(
    'follows the reader’s default font size — the cap is the page’s spacing step over four, never under the floor — $design',
    ({ root }) => {
      document.documentElement.style.fontSize = `${root}px`;
      const m = renderInBox({ width: 614 });
      const page = root / 16;
      const floor = (FLOOR_REM * root) / DIVISOR;

      expect(rootPx()).toBe(root);
      expectChipsAt(m, expectedPixel(m.coverWidth, page));
      // The floor — 0.75rem — always holds: the cap is 0.0625rem, over it.
      for (const chip of m.chips) {
        expect(chip.label).toBeGreaterThanOrEqual(FLOOR_REM * root - 0.01);
      }
      expect(m.pixel).toBeLessThanOrEqual(page);
      expect(m.pixel).toBeGreaterThanOrEqual(floor - 1e-4);
      // A 1px cap — `--scale-px` read outside the band scale — would hold
      // the chips at 44px with an 18px label at both roots: under the
      // floor's 22.5px at 30px.
      expect(m.pixel).toBeGreaterThan(1);
    },
  );

  it('compiles THE GUARD into the sheet — the pixel and the remap each inside `@supports (width: 1cqw)`, and nowhere outside it', () => {
    render(<PostCover {...COVER} />);
    // Every style rule of the document's sheets, each with the at-rules
    // around it (PostCard.test.tsx's walker).
    const rules: { trail: string[]; selector: string }[] = [];
    const walk = (list: CSSRuleList, trail: string[]): void => {
      for (const rule of Array.from(list)) {
        if (rule instanceof CSSStyleRule) {
          rules.push({ trail, selector: rule.selectorText });
          walk(rule.cssRules, [...trail, rule.selectorText]);
        } else if (rule instanceof CSSSupportsRule) {
          walk(rule.cssRules, [...trail, `@supports ${rule.conditionText}`]);
        } else if (rule instanceof CSSMediaRule) {
          walk(rule.cssRules, [...trail, `@media ${rule.conditionText}`]);
        } else if (rule instanceof CSSGroupingRule) {
          walk(rule.cssRules, trail);
        }
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        walk(sheet.cssRules, []);
      } catch {
        // A sheet the page may not read is not this cover's.
      }
    }
    const guard = 'supports-[width:1cqw]:';
    const guarded = (
      screen
        .getByRole('list', { name: COVER.tagsLabel })
        .getAttribute('class') ?? ''
    )
      .split(/\s+/)
      .filter((token) => token.startsWith(guard));
    expect(guarded).toHaveLength(2);
    for (const token of guarded) {
      const found = rules.filter(
        ({ selector }) => selector === `.${CSS.escape(token)}`,
      );
      expect(found, token).toHaveLength(1);
      expect(
        found[0]?.trail.map((at) => at.replace(/\s+/g, '')),
        token,
      ).toContain('@supports(width:1cqw)');
    }
  });

  it('keeps the chips LABELS — the tag’s face and size under a real hover of each chip, and no pointer cursor', async () => {
    // THE PREMISE: a device that hovers — where a hover rule would show.
    expect(matchMedia('(hover: hover)').matches).toBe(true);
    const m = renderInBox({ width: 614 });
    const faceOf = (item: Element) => {
      const style = getComputedStyle(item);
      return {
        edge: style.borderTopColor,
        label: style.color,
        ground: style.backgroundColor,
        height: style.height,
        size: style.fontSize,
        cursor: style.cursor,
      };
    };
    const items = m.chips.map((chip) => chip.item);
    const rest = items.map(faceOf);
    for (const face of rest) expect(face.cursor).not.toBe('pointer');

    for (const item of items) {
      await realUser.hover(item);
      expect(item.matches(':hover')).toBe(true);
      expect(items.map(faceOf)).toEqual(rest);
    }
  });
});

// ── THE ROW, MEASURED (PostCover.tsx's THE READING TIME'S BOX). A STAND-IN
// SLOT, so every case is the cover's alone: the share controls' 44px band —
// the theme step, `calc(var(--spacing) * 11)`, so THE BAND SCALE redraws it as
// it redraws ui/TextButton's — over a line that opens to a given height, as
// sections/ShareLinks' status line does from the first press of the copy
// button and keeps: 32px in Romanian, 56px in German (two lines) on a phone,
// 29.2px at a 1280 window in the band scale (ShareLinks.tsx's THE LINE).
// THE READING TIME IS READ ON ITS WORDS — the middle of a Range around its
// text — never on its paragraph's box alone: without `items-center` the
// paragraph is stretched to the 44px track, so its box's middle stays on the
// controls' while its words sit at its top (the review, 2026-10-21, MEASURED:
// 12 against 22 at 351). Every case that says "level" reads the words, and
// that the paragraph is shorter than its box. Every rectangle of a reading is
// taken at once, before anything is asserted. Inline styles, never classes:
// Tailwind reads tests too.

/** The controls' band: the theme's 44px step, as the controls draw it. */
const CONTROLS_STEP = 'calc(var(--spacing) * 11)';

/** The controls' height in theme steps' pixels — 44, PostCover's cap. */
const CONTROLS = 44;

/** The slot's stand-in: the controls' band, 200px wide — four 44px targets
 *  8px apart, ShareLinks' icons-only row — and under it a line `opened` px
 *  tall, 0 at rest. */
function GrowingSlot({ opened }: { opened: number }): ReactElement {
  return (
    <div style={{ width: '200px' }}>
      <div data-testid="controls" style={{ height: CONTROLS_STEP }} />
      <div style={{ height: `${opened}px` }} />
    </div>
  );
}

/** The slot's stand-in with sections/ShareLinks' THE LINE AT REST: the
 *  controls' band and under it an EMPTY paragraph — 0px tall, on ui/Text's
 *  body step as the line is — to which SC 1.4.12's paragraph spacing gives
 *  2em, as it gives every paragraph (PostCover's recorded paragraph-spacing
 *  case). */
function LineAtRestSlot(): ReactElement {
  return (
    <div style={{ width: '200px' }}>
      <div data-testid="controls" style={{ height: CONTROLS_STEP }} />
      <p data-testid="line" style={{ fontSize: 'var(--text-base)' }} />
    </div>
  );
}

/** SC 1.4.12's four overrides — line height 1.5, letter spacing 0.12em, word
 *  spacing 0.16em, paragraph spacing 2em — on everything under a
 *  `data-text-spacing` box (sections/ShareLinks' stories' idiom). */
const TEXT_SPACING = `
[data-text-spacing] * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
[data-text-spacing] p { margin-bottom: 2em !important; }
`;

/** Runs `measure` with TEXT_SPACING's sheet in the document, and removes the
 *  sheet whatever happens. */
const withTextSpacing = (measure: () => void): void => {
  const sheet = document.createElement('style');
  sheet.textContent = TEXT_SPACING;
  document.head.append(sheet);
  try {
    measure();
  } finally {
    sheet.remove();
  }
};

/**
 * The cover on THE PAGE (`pageProps`), its slot `slot(opened)` — the growing
 * stand-in unless a case names another — under SC 1.4.12's overrides when
 * `spacing`. Returns `open`, which re-renders the same cover with the line at
 * another height.
 */
const renderRow = ({
  width,
  pagePx,
  spacing = false,
  slot = (opened) => <GrowingSlot opened={opened} />,
}: {
  width: number;
  pagePx?: number;
  spacing?: boolean;
  slot?: (opened: number) => ReactElement;
}) => {
  const cover = (opened: number): ReactElement => (
    <div
      {...pageProps({ width, pagePx })}
      data-text-spacing={spacing ? '' : undefined}
    >
      <PostCover {...COVER} data-testid="cover" share={slot(opened)} />
    </div>
  );
  const { rerender } = render(cover(0));
  return { open: (opened: number) => rerender(cover(opened)) };
};

/**
 * The row's boxes, all read at once, each against the ROW's top-left corner:
 * the row; the reading time's box (its first child); the reading time — its
 * paragraph and its WORDS, a Range around its text; the slot and the
 * controls in it; and the picture's top, which an opened line DOES move (the
 * press's own shift, ShareLinks.tsx's THE ONE SHIFT). Then the lengths the
 * cases derive their numbers from: the row's gap between lines, and the
 * paragraph's font size and the margin under it. The reading time is found
 * by its words, so a row without the box — the paragraph the row's first
 * child, as until 2026-10-21 — is read too.
 */
const rowOf = () => {
  const cover = screen.getByTestId('cover');
  const row = htmlElement(cover.children[0], 'row');
  const box = htmlElement(row.children[0], 'reading time’s box');
  const slot = htmlElement(row.children[1], 'slot');
  const picture = htmlElement(cover.children[1], 'picture box');
  const time = screen.getByText(COVER.readingTime);
  const controls = screen.getByTestId('controls');
  const words = document.createRange();
  words.selectNodeContents(time);
  const rects = {
    row: row.getBoundingClientRect(),
    box: box.getBoundingClientRect(),
    time: time.getBoundingClientRect(),
    words: words.getBoundingClientRect(),
    slot: slot.getBoundingClientRect(),
    controls: controls.getBoundingClientRect(),
    picture: picture.getBoundingClientRect(),
  };
  const origin = rects.row;
  const at = (r: DOMRect) => ({
    top: r.top - origin.top,
    bottom: r.bottom - origin.top,
    middle: (r.top + r.bottom) / 2 - origin.top,
    left: r.left - origin.left,
    right: r.right - origin.left,
    height: r.height,
  });
  const timeStyle = getComputedStyle(time);
  return {
    row: at(rects.row),
    box: at(rects.box),
    time: at(rects.time),
    words: at(rects.words),
    slot: at(rects.slot),
    controls: at(rects.controls),
    pictureTop: at(rects.picture).top,
    rowGap: parseFloat(getComputedStyle(row).rowGap),
    timeFont: parseFloat(timeStyle.fontSize),
    timeMargin: parseFloat(timeStyle.marginBottom),
  };
};

type Row = ReturnType<typeof rowOf>;

/** The pixel a case draws the page in: `pagePx`, or the theme's own — a
 *  sixteenth of the root. */
const pixelOf = (pagePx?: number): number => pagePx ?? rootPx() / 16;

/** THE PREMISE every row case names first: the page is drawn in the pixel
 *  the case says — the controls' 44 theme steps are 44 × it (the chips'
 *  cases hold theirs through `expectChipsAt`). Without it, a band case whose
 *  page lost `design-scale` would pass in the theme's step. */
const expectDrawnAt = (row: Row, pagePx?: number): void => {
  expect(
    row.controls.height,
    'the controls, 44 of the page’s pixels',
  ).toBeCloseTo(CONTROLS * pixelOf(pagePx), 1);
};

/** THE READING TIME LEVEL WITH THE CONTROLS, read on its WORDS (the header):
 *  their middle within 1px of the controls' — Chromium floors the line's
 *  half-leading to a whole pixel, so the words sit up to 63/64px above their
 *  line's middle (MEASURED: 0.984375 at 13.32, 14.64, 15.32, 16.64 and
 *  17.32px; 0.953 at the band case's 14.592px, 0.047 to spare — WebKit and
 *  Firefox under 0.02), so 1px is the mechanism's own bound, not slack — and
 *  the paragraph shorter than its box, never stretched to it. */
const expectLevel = (row: Row): void => {
  expect(
    Math.abs(row.words.middle - row.controls.middle),
    'the words’ middle, against the controls’',
  ).toBeLessThanOrEqual(1);
  expect(row.time.height, 'the paragraph, shorter than its box').toBeLessThan(
    row.box.height,
  );
};

describe('PostCover — THE ROW, measured: the reading time keeps its place whatever the slot’s height (real stylesheet)', () => {
  it.each([
    {
      width: 351,
      pagePx: undefined,
      lines: [32, 56],
      design: 'a 390 phone’s cover (351px), the Romanian and German lines',
    },
    {
      width: 1009,
      pagePx: 0.912,
      lines: [29.19],
      design: 'a 1280 window’s band (0.912px), the line in the design pixel',
    },
  ] as const)(
    'ONE LINE — the line opening under the controls moves the reading time’s words by NOTHING — $design',
    ({ width, pagePx, lines }) => {
      const { open } = renderRow({ width, pagePx });
      const rest = rowOf();
      // THE PREMISES: the page in the case's pixel, and one line — the slot
      // beside the reading time.
      expectDrawnAt(rest, pagePx);
      expect(rest.slot.top).toBeLessThan(rest.time.bottom);
      expectLevel(rest);

      for (const opened of lines) {
        open(opened);
        const now = rowOf();
        // NOTHING MOVES: the reading time — its words and its paragraph — its
        // box's top, the controls.
        expect(now.words.top).toBe(rest.words.top);
        expect(now.time.top).toBe(rest.time.top);
        expect(now.box.top).toBe(rest.box.top);
        expect(now.controls.top).toBe(rest.controls.top);
        expectLevel(now);
        // …but the press's own shift is real: the row grows by the line, and
        // the picture moves down with it.
        expect(now.row.height).toBeCloseTo(rest.row.height + opened, 1);
        expect(now.pictureTop).toBeCloseTo(rest.pictureTop + opened, 1);
        // The box itself is stretched to the taller line; it is its row
        // TRACK, capped at the controls' step, that keeps the reading time
        // where it was.
        expect(now.box.height).toBe(now.row.height);
      }
    },
  );

  it.each([
    { width: 351, pagePx: undefined, design: 'a 390 phone’s cover' },
    { width: 1009, pagePx: 0.912, design: 'a 1280 window’s band' },
  ] as const)(
    'ONE LINE, AT REST — the box IS the line, the controls’ height; the words centred on them — $design',
    ({ width, pagePx }) => {
      renderRow({ width, pagePx });
      const rest = rowOf();

      expectDrawnAt(rest, pagePx);
      expect(rest.slot.top).toBe(0);
      expect(rest.controls.top).toBe(0);
      expect(rest.row.height).toBe(rest.controls.height);
      expect(rest.box.top).toBe(0);
      expect(rest.box.height).toBe(rest.controls.height);
      expectLevel(rest);
    },
  );

  it.each([
    { width: 273, design: 'the 320 stress cover behind a classic scrollbar' },
    { width: 288, design: 'the 320 stress cover on a phone' },
  ] as const)(
    'WRAPPED — the reading time on its own line, its box its own height, the slot a row gap under it — $design',
    ({ width }) => {
      renderRow({ width });
      const rest = rowOf();
      // THE PREMISES: the page in the theme's pixel, and two lines — the slot
      // under the reading time.
      expectDrawnAt(rest);
      expect(rest.slot.top).toBeGreaterThanOrEqual(rest.time.bottom);

      // Nothing stretched the box: its line is its own, the paragraph's — the
      // cap's `min(100%, …)` at work, where a bare 44px cap made that line 44
      // and the slot sat 20px lower (PostCover's THE ROW).
      expect(rest.box.top).toBe(0);
      expect(rest.box.height).toBe(rest.time.height);
      expect(rest.time.top).toBe(0);
      // The slot one row gap (`gap-y-2`) under it, at the row's END.
      expect(rest.slot.top).toBeCloseTo(rest.box.bottom + rest.rowGap, 1);
      expect(rest.slot.right).toBeCloseTo(rest.row.right, 1);
    },
  );

  it.each([
    { width: 273, oneLine: false, design: 'wrapped, the 320 stress cover' },
    { width: 614, oneLine: true, design: 'one line, a 768 tablet’s cover' },
  ] as const)(
    'A READING TIME TALLER THAN THE CAP — SC 1.4.12’s paragraph spacing, 2em under the paragraph — grows its box instead of overflowing it, and still never moves — $design',
    ({ width, oneLine }) => {
      withTextSpacing(() => {
        const { open } = renderRow({ width, spacing: true });
        const rest = rowOf();
        // THE PREMISES: the page in the theme's pixel; the override reached
        // the paragraph — 2em under it, two of its font sizes — and the line
        // is the one this case is for.
        expectDrawnAt(rest);
        expect(rest.timeMargin).toBeCloseTo(2 * rest.timeFont, 2);
        expect(rest.slot.top < rest.time.bottom).toBe(oneLine);

        // NOTHING HANGS OUT of the box, above or below: the paragraph's whole
        // margin box inside it — the floor at its content won over the 44px
        // cap (an `auto` floor would clamp the track to the cap and centre
        // the deeper paragraph over both its edges).
        expect(rest.time.top).toBeGreaterThanOrEqual(rest.box.top);
        expect(rest.time.bottom + rest.timeMargin).toBeLessThanOrEqual(
          rest.box.bottom,
        );
        expect(rest.box.height).toBeCloseTo(
          rest.time.height + rest.timeMargin,
          1,
        );
        expect(rest.box.height).toBeGreaterThan(rest.controls.height);
        if (!oneLine) {
          // Wrapped, the slot one row gap under the box's FULL height —
          // exactly where the bare paragraph's margin box put it.
          expect(rest.slot.top).toBeCloseTo(rest.box.bottom + rest.rowGap, 1);
        }

        open(32);
        const now = rowOf();
        expect(now.time.top).toBe(rest.time.top);
        // Still nothing hanging out.
        expect(now.time.top).toBeGreaterThanOrEqual(now.box.top);
        expect(now.time.bottom + now.timeMargin).toBeLessThanOrEqual(
          now.box.bottom,
        );
      });
    },
  );

  it.each([
    { width: 614, pagePx: undefined, design: 'a 768 tablet’s cover' },
    { width: 1009, pagePx: 0.912, design: 'a 1280 window’s band (0.912px)' },
  ] as const)(
    'THE RECORDED CASE — paragraph spacing beside an empty line puts the words 10 of the page’s pixels high — $design',
    ({ width, pagePx }) => {
      withTextSpacing(() => {
        renderRow({
          width,
          pagePx,
          spacing: true,
          slot: () => <LineAtRestSlot />,
        });
        const rest = rowOf();
        const line = screen.getByTestId('line');
        const lineHeight = line.getBoundingClientRect().height;
        const lineStyle = getComputedStyle(line);
        const lineMargin = parseFloat(lineStyle.marginBottom);
        // THE PREMISES: the page in the case's pixel; one line; the override
        // reached BOTH paragraphs — the reading time's, and the slot's empty
        // line, 0px tall with 2em under it — so the slot is the controls and
        // that 2em, taller than the reading time's own margin box.
        expectDrawnAt(rest, pagePx);
        expect(rest.slot.top).toBeLessThan(rest.time.bottom);
        expect(rest.timeMargin).toBeCloseTo(2 * rest.timeFont, 2);
        expect(lineHeight).toBe(0);
        expect(lineMargin).toBeCloseTo(2 * parseFloat(lineStyle.fontSize), 2);
        expect(rest.slot.height).toBeCloseTo(
          rest.controls.height + lineMargin,
          1,
        );
        expect(rest.row.height).toBeGreaterThan(
          rest.time.height + rest.timeMargin,
        );

        // THE BOX: stretched to that line, its track the reading time's
        // margin box — the floor's, taller than the cap — and the paragraph
        // at its top, the row's.
        expect(rest.box.top).toBe(0);
        expect(rest.box.height).toBeCloseTo(rest.row.height, 1);
        expect(rest.time.top).toBe(0);
        // THE PIN — PostCover's recorded paragraph-spacing case: the words' middle half the
        // reading time's 24-pixel line (16 × the override's 1.5) under the
        // row's top, the controls' half their 44 — 12 against 22, 10 of the
        // page's pixels high, within `expectLevel`'s pixel. Until 2026-10-21
        // the row centred the paragraph's margin box on this line, and the
        // two met by coincidence; should they meet again, the record must say
        // why.
        expect(
          Math.abs(
            rest.words.middle - rest.controls.middle + 10 * pixelOf(pagePx),
          ),
          'the words, 10 of the page’s pixels above the controls’ middle',
        ).toBeLessThanOrEqual(1);
      });
    },
  );
});
