import { render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline — the
// reason this file exists apart from Pagination.test.tsx (the header below).
// tests/setup/components.ts loads no CSS globally; the per-file import is the
// house pattern (DoctorIntro, PriceList, ClinicLocation).
import '@/styles/globals.css';
import {
  Container,
  bandColumnClasses,
  bandScaleClasses,
  containerClasses,
} from '@/components/ui/Container/Container';
import { cx } from '@/lib/cx/cx';
import { Pagination, type PaginationProps } from './Pagination';

// sections/Pagination — THE ROW, COMPUTED: at the theme's size, and in THE
// BAND SCALE sections/PostList draws it in (Pagination.tsx's paragraphs THE
// ROW, THE ARROWS NEVER MOVE BETWEEN PAGES and THE BAND SCALE).
//
// ── WHY A FILE OF ITS OWN. Pagination.test.tsx pins the band's class TOKENS
// with no stylesheet loaded — its one premise, which every component suite in
// the repo shares. A length is a COMPUTED thing — a class name cannot show
// one — so it needs the sheet; and the counter's width needs the real FACE,
// because a fallback serif sets other figures. One premise per file
// (DoctorIntro.scale.test.tsx's split).
//
// ── WHAT IS MEASURED.
//   · AT THE THEME'S SIZE: the discs 44 × 44px with 20px chevrons, 12px
//     between each disc and the counter, the counter at ui/Text's 16px, the
//     row exactly as wide as its three cells and their two gaps; ONE width on
//     every page of a list — of three and of twelve — and, mounted as
//     sections/PostList mounts it (`self-end` in a flex column), both controls
//     on the same x on every page; the disabled end at half opacity, deaf to
//     the pointer; the row hugging its content in a wider block.
//   · IN THE BAND SCALE: the row inside a box wearing ui/Container's two
//     band-scale strings — sections/PostList's rhythm box — whose Container
//     gets a column of exactly `width` px (the gutter read off a probe wearing
//     the real class, never assumed): under the step and on a phone's column
//     nothing is remapped and every length is the theme's; from the step every
//     length is its theme value × s, s = min(column, 96rem) / 1106 — the discs
//     and their chevrons included, through the `--disc-size` the row sets.
//     THE ONE LENGTH THAT IS NOT × s is the counter's WIDTH: Source Serif 4 is
//     a variable face with an optical-size axis (`font-optical-sizing: auto`),
//     so a larger counter is set a little narrower per em (§15.25 round 2's
//     record (d)) — measured, 39.38px at a 1920 window's column where 29.56 ×
//     s would give 40.66, and 24.47px at a 1140 one's where it would give
//     23.98. So the row is held to the sum of its own cells, to within 1 % of
//     the reference row × s (the drift measured −0.7 % to +0.4 %), and to
//     one width on every page at its size.
// Tolerance: a twentieth of a pixel on a box (layout rounds to 1/64px) and a
// hundredth on a font size (a calc of px, never rounded).

/** THE BAND SCALE's numbers, written out (ui/Container's THE BAND SCALE —
 *  their census is tests/unit/design-scale.test.ts): the REFERENCE column,
 *  where a design pixel is a CSS pixel; the CAP and THE STEP in px at this
 *  runner's 16px root (the premise asserts it). Spelled again on purpose: the
 *  census holds the source, these hold what the engine does. */
const REFERENCE = 1106;
const ROOT = 16;
const CAP = 96 * ROOT;
const STEP = Math.max(56 * ROOT, 896);

/** The theme's lengths of the row, in px at the 16px root: GlyphButton's md
 *  disc (2.75rem) and its chevron (five elevenths of it), `gap-3`, and ui/Text's
 *  `text-base`. */
const DISC = 44;
const CHEVRON = 20;
const GAP = 12;
const COUNTER_SIZE = 16;

/** The counter's width at 16px in the committed face — every figure 8.313px
 *  (0.52em), measured: „1 / 3" and its twin „3 / 3" are 29.547px, „12 / 12"
 *  46.172px (the cell holding them rounds to layout's 1/64px: 29.5625 and
 *  46.1875). Read back below, so a face whose figures are not one width, or
 *  the fallback serif, fails by name. */
const FRACTION_OF_THREE = 29.547;
const FRACTION_OF_TWELVE = 46.172;

/** The row of a list of three at the theme's size: two discs, two gaps and
 *  the counter — 141.56px measured. */
const ROW_OF_THREE = 2 * DISC + 2 * GAP + FRACTION_OF_THREE;

const LABEL = 'Paginile articolelor';

/** The page's own addresses: page 1 at the blog's root, page n under /page/n/. */
const hrefOf = (page: number): string =>
  page === 1 ? '/ro/blog/' : `/ro/blog/page/${page}/`;

/** A CONSISTENT page — the shape the page builds, which the belt demands. */
const page = (current: number, total = 3): PaginationProps => ({
  label: LABEL,
  current,
  total,
  status: `Pagina ${current} din ${total}`,
  previousLabel: 'Pagina anterioară',
  nextLabel: 'Pagina următoare',
  ...(current > 1 ? { previousHref: hrefOf(current - 1) } : {}),
  ...(current < total ? { nextHref: hrefOf(current + 1) } : {}),
});

// The REAL typeface, as ContactModal.test.tsx loads it: the declaration
// .storybook/preview-fonts.css makes for Storybook, verbatim apart from the
// URL — this runner serves the repo from its root, so the committed subset
// sits at /src/fonts/… — and `font-display: block`, so a fallback is never
// measured. Then THE STILLNESS: an unlayered `transition: none` beats the
// layered utilities, so no length or opacity is read mid-fade.
const FONT_FAMILY = 'Source Serif 4 SB';
const INJECTED_CSS = `
@font-face {
  font-family: '${FONT_FAMILY}';
  src: url('/src/fonts/SourceSerif4Variable-subset.woff2') format('woff2');
  font-weight: 200 900;
  font-style: normal;
  font-display: block;
}
:root { --font-source-serif: '${FONT_FAMILY}'; }
nav, nav * { transition: none; }
`;
let injected: HTMLStyleElement | null = null;

beforeAll(async () => {
  injected = document.createElement('style');
  injected.textContent = INJECTED_CSS;
  document.head.append(injected);
  // load(), not just ready: nothing has rendered yet, so there is no pending
  // font for `ready` to wait on — and a 404 on the subset REJECTS here, loudly.
  await document.fonts.load(`1rem "${FONT_FAMILY}"`);
  await document.fonts.ready;
});

afterAll(() => {
  injected?.remove();
  injected = null;
});

/** The node a query found, as an HTMLElement — or a failure that NAMES what
 *  went missing (PriceList.scale.test.tsx's `htmlElement`). */
const htmlElement = (
  node: Element | null | undefined,
  name: string,
): HTMLElement => {
  if (!(node instanceof HTMLElement)) {
    throw new Error(`Pagination: no ${name}`);
  }
  return node;
};

/** A control's chevron — an SVG element, so not an HTMLElement — or a
 *  failure that names the control. */
const chevronOf = (control: HTMLElement, name: string): Element => {
  const svg = control.querySelector('svg');
  if (!svg) throw new Error(`Pagination: no chevron in the ${name}`);
  return svg;
};

/** The row's three cells, by structure: back · counter · forward. */
const rowOf = () => {
  const nav = screen.getByRole('navigation', { name: LABEL });
  return {
    nav,
    previous: htmlElement(nav.children[0], 'back control'),
    counter: htmlElement(nav.children[1], 'counter'),
    next: htmlElement(nav.children[2], 'forward control'),
  };
};

type Row = ReturnType<typeof rowOf>;

const box = (element: Element): DOMRect => element.getBoundingClientRect();

const fontSize = (element: Element): number =>
  parseFloat(getComputedStyle(element).fontSize);

/** Every length of the row, read from the engine, each with its label. */
const lengthsOf = (row: Row): Record<string, number> => {
  const previous = box(row.previous);
  const counter = box(row.counter);
  const next = box(row.next);
  return {
    'the back disc’s width': previous.width,
    'the back disc’s height': previous.height,
    'the forward disc’s width': next.width,
    'the forward disc’s height': next.height,
    'the back chevron': box(chevronOf(row.previous, 'back control')).width,
    'the forward chevron': box(chevronOf(row.next, 'forward control')).width,
    'the gap before the counter': counter.left - previous.right,
    'the gap after the counter': next.left - counter.right,
    'the row’s height': box(row.nav).height,
  };
};

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

/** The theme's lengths × s, the label of each as `lengthsOf` spells it. */
const expectedAt = (s: number): Record<string, number> => ({
  'the back disc’s width': DISC * s,
  'the back disc’s height': DISC * s,
  'the forward disc’s width': DISC * s,
  'the forward disc’s height': DISC * s,
  'the back chevron': CHEVRON * s,
  'the forward chevron': CHEVRON * s,
  'the gap before the counter': GAP * s,
  'the gap after the counter': GAP * s,
  'the row’s height': DISC * s,
});

/** The row is exactly its three cells and their two gaps — it hugs. */
const expectHugs = (row: Row): void => {
  const parts =
    box(row.previous).width +
    box(row.counter).width +
    box(row.next).width +
    (box(row.counter).left - box(row.previous).right) +
    (box(row.next).left - box(row.counter).right);
  near(box(row.nav).width, parts, 'the row hugs its cells');
};

describe('Pagination — the row at the theme’s size (the real stylesheet and face)', () => {
  it('stands on its premises: the real face, the 16px root', () => {
    expect(
      document.fonts.check(`1rem "${FONT_FAMILY}"`),
      'Source Serif 4 is loaded',
    ).toBe(true);
    expect(fontSize(document.documentElement), 'the default 16px root').toBe(
      ROOT,
    );
  });

  it('draws the deck’s 44px discs with 20px chevrons, 12px either side of a 16px counter, the cells levelled and the row hugging them', () => {
    render(<Pagination {...page(2)} />);
    const row = rowOf();

    const lengths = lengthsOf(row);
    for (const [label, expected] of Object.entries(expectedAt(1))) {
      near(lengths[label] ?? Number.NaN, expected, label);
    }
    near(fontSize(row.counter), COUNTER_SIZE, 'the counter’s size', 0.01);
    near(box(row.counter).width, FRACTION_OF_THREE, 'the counter’s width');
    near(box(row.nav).width, ROW_OF_THREE, 'the row’s width');
    expectHugs(row);
    // One line: the counter's middle level with both discs' middles.
    const middle = (element: Element): number =>
      box(element).top + box(element).height / 2;
    near(middle(row.counter), middle(row.previous), 'the counter’s middle');
    near(middle(row.next), middle(row.previous), 'the forward disc’s middle');
  });

  it.each([
    [3, [1, 2, 3], FRACTION_OF_THREE],
    [12, [1, 2, 9, 10, 11, 12], FRACTION_OF_TWELVE],
  ] as const)(
    'keeps ONE width on every page of a list of %i, and both controls on one x when mounted as PostList mounts it',
    (total, pages, fraction) => {
      const seen = pages.map((current) => {
        const { unmount } = render(
          // sections/PostList's group: a flex column, the pager `self-end`.
          <div className="flex flex-col" style={{ width: '640px' }}>
            <Pagination {...page(current, total)} className="self-end" />
          </div>,
        );
        const row = rowOf();
        const seenNow = {
          width: box(row.nav).width,
          counter: box(row.counter).width,
          previous: box(row.previous).left,
          next: box(row.next).left,
        };
        unmount();
        return seenNow;
      });
      const [first] = seen;
      if (!first) throw new Error('no page was rendered');
      near(first.counter, fraction, `the counter of a list of ${total}`);
      for (const [index, now] of seen.entries()) {
        const label = `page ${pages[index]} of ${total}`;
        near(now.width, first.width, `${label}: the row’s width`, 0.001);
        near(now.previous, first.previous, `${label}: the back control`, 0.001);
        near(now.next, first.next, `${label}: the forward control`, 0.001);
      }
    },
  );

  it('owes that one width, from page 10 of 12 on, to the invisible twin — the figures alone would step a figure wide', () => {
    for (const [current, visible] of [
      [9, 37.859],
      [10, FRACTION_OF_TWELVE],
    ] as const) {
      const { unmount } = render(<Pagination {...page(current, 12)} />);
      const row = rowOf();
      const fraction = screen.getByText(`${current} / 12`);
      near(box(fraction).width, visible, `„${current} / 12" alone`);
      // The cell is the twin's width; the fraction is centred in it.
      near(box(row.counter).width, FRACTION_OF_TWELVE, 'the counter’s cell');
      near(
        box(fraction).left + box(fraction).width / 2,
        box(row.counter).left + box(row.counter).width / 2,
        `„${current} / 12" centred`,
      );
      unmount();
    }
  });

  it('greys a missing neighbour at half opacity and leaves it deaf to the pointer', () => {
    render(<Pagination {...page(1)} />);
    const { previous } = rowOf();

    expect(previous.tagName).toBe('BUTTON');
    expect(getComputedStyle(previous).opacity).toBe('0.5');
    expect(getComputedStyle(previous).pointerEvents).toBe('none');
  });

  it('hugs its content in a wider block too — where it stands is the parent’s', () => {
    render(
      <div style={{ width: '640px' }}>
        <Pagination {...page(2)} />
      </div>,
    );
    const row = rowOf();

    near(box(row.nav).width, ROW_OF_THREE, 'the row’s width in a 640px block');
  });
});

describe('Pagination — THE BAND SCALE, computed (sections/PostList draws the row in it)', () => {
  beforeAll(() => {
    // THE PREMISE: this runner is a place where the regime CAN apply — a fine
    // primary pointer and an engine that registers custom properties, the two
    // conditions of globals.css's THE SCALABLE VARIANT. Otherwise every case
    // below that expects the scale would fail for a reason that reads as the
    // band's, and every case that expects none would pass for the wrong one.
    expect(
      window.matchMedia('(pointer: fine)').matches,
      'the runner’s primary pointer is fine — a mouse, as on a laptop',
    ).toBe(true);
    expect(
      CSS.supports('color', 'rgb(from red r g b)'),
      'the engine passes the registration gate (relative colour syntax)',
    ).toBe(true);
  });

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

  /** IS THE REGIME ON for this box? globals.css's `design-scale` remaps
   *  `--spacing` on the box that wears it; elsewhere a box inherits the
   *  root's (DoctorIntro.scale.test.tsx's `remapped`). */
  const remapped = (element: Element): boolean =>
    getComputedStyle(element).getPropertyValue('--spacing') !==
    getComputedStyle(document.documentElement).getPropertyValue('--spacing');

  /** The row inside sections/PostList's shape — ui/Container, then a rhythm
   *  box wearing the two band-scale strings — whose Container gets a column of
   *  exactly `width` px. The premise every number rests on is checked first. */
  const renderColumn = (width: number, props: PaginationProps = page(2)) => {
    const { unmount } = render(
      <div style={{ width: `${width + 2 * gutter()}px` }}>
        <Container>
          <div className={cx(bandColumnClasses, bandScaleClasses)}>
            <Pagination {...props} />
          </div>
        </Container>
      </div>,
    );
    const row = rowOf();
    const rhythm = htmlElement(row.nav.parentElement, 'rhythm box');
    const column = htmlElement(rhythm.parentElement, 'ui/Container column');
    near(box(column).width, width, 'the column', 0.1);
    return { unmount, row, rhythm };
  };

  it.each([
    ['a 390 phone’s column', 351],
    ['a column under the step', 880],
  ] as const)(
    'leaves %s at the theme’s size — nothing declared, nothing remapped',
    (_where, width) => {
      expect(width).toBeLessThan(STEP);
      const { unmount, row, rhythm } = renderColumn(width);

      expect(remapped(rhythm)).toBe(false);
      expect(remapped(row.nav)).toBe(false);
      const lengths = lengthsOf(row);
      for (const [label, expected] of Object.entries(expectedAt(1))) {
        near(lengths[label] ?? Number.NaN, expected, label);
      }
      near(fontSize(row.counter), COUNTER_SIZE, 'the counter’s size', 0.01);
      near(box(row.counter).width, FRACTION_OF_THREE, 'the counter’s width');
      expectHugs(row);
      unmount();
    },
  );

  it.each([
    ['a 1140 window’s column (the regime’s first)', 897],
    ['the owner’s 1401 window’s column (the reference)', REFERENCE],
    ['a 1920 window’s column', 1521],
    ['a column past the cap', 2000],
  ] as const)(
    'draws %s as the 1401 design × s — the discs and their chevrons too, through --disc-size',
    (_where, width) => {
      expect(width).toBeGreaterThanOrEqual(STEP);
      const s = Math.min(width, CAP) / REFERENCE;
      const { unmount, row, rhythm } = renderColumn(width);

      expect(remapped(rhythm)).toBe(true);
      expect(remapped(row.nav)).toBe(true);
      const lengths = lengthsOf(row);
      for (const [label, expected] of Object.entries(expectedAt(s))) {
        near(lengths[label] ?? Number.NaN, expected, label);
      }
      near(fontSize(row.counter), COUNTER_SIZE * s, 'the counter’s size', 0.01);
      expectHugs(row);
      // The counter's optical size (the header's THE ONE LENGTH THAT IS NOT ×
      // s) moves the row by under 1 % of the design × s.
      near(
        box(row.nav).width,
        ROW_OF_THREE * s,
        'the row against the design × s',
        0.01 * ROW_OF_THREE * s,
      );
      unmount();
    },
  );

  it('keeps one width on every page inside the scale too — the figures stay one width at every optical size', () => {
    const widths = [1, 2, 3].map((current) => {
      const { unmount, row } = renderColumn(1521, page(current));
      const width = box(row.nav).width;
      unmount();
      return width;
    });
    for (const width of widths) {
      near(width, widths[0] ?? Number.NaN, 'a page of three at 1521', 0.001);
    }
  });
});
