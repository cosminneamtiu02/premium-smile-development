import { render, screen, within } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline — the
// reason this file exists apart from PriceList.test.tsx (the header below).
// tests/setup/components.ts loads no CSS globally; the per-file import is the
// house pattern (Card, Container, ClinicLocation, DoctorShowcase).
import '@/styles/globals.css';
import { containerClasses } from '@/components/ui/Container/Container';
import { PriceList, type PriceCategoryProps } from './PriceList';

// sections/PriceList — THE BAND SCALE, COMPUTED (2026-10-02, CLAUDE.md
// §15.32; PriceList.tsx's paragraph of that name). The owner, verbatim: "i
// need this responsiveness refactor also on the prices page. the best ration i
// see is on 1392 x 1179. so i do not want the cards jsut to wide, i want the
// menu and cards to adapt too with the width of the screen" — and, the same
// day, THE FLOOR, his delegated decision ("decide for me on decisions and
// create pr"): the band never draws SMALLER than the theme.
//
// ── WHY A FILE OF ITS OWN. PriceList.test.tsx drives REAL scrolling, and it can
// do so honestly only because no stylesheet is loaded there: it sets the
// shell's `scroll-padding-top` on <html> itself, and globals.css's `scroll-
// behavior: smooth` (this runner asks for no reduced motion) would turn every
// one of its instant `scrollTo`s and fragment jumps into a glide its two-frame
// waits cannot see the end of. The scale, on the other hand, is a COMPUTED
// length — a class name cannot show a design pixel — so it needs the sheet. One
// premise per file: the class contract of the scale stays in PriceList.test.tsx
// (its THE BAND SCALE block), and what the engine draws with it lives here.
//
// ── WHAT IS MEASURED. The band in a box that hands its Container a column of
// exactly `width` px — the gutter read off a probe wearing the real class,
// never assumed (ClinicLocation's and DoctorShowcase's `renderColumn`) — and
// every length read back from the engine. Inside the scale (a mouse or
// trackpad in this runner, a column of max(56rem, 896px)) the band's design
// pixel is s = max(1rem / 16, min(column, 96rem) / 1106), and every theme
// length is its reference length × s — the menu's floor 240, the gap 32, a
// card's inset 24, the band's top step 80, the menu's title 30, its links 18
// on a 44 box, a card's <h2> 36, its eyebrow 14, a row's words 16 — with the
// grid's own arithmetic between them (the menu at its floor, the cards the
// rest of the band):
//   · UNDER THE REFERENCE the floor binds: s = 1 at the 16px root, every
//     length its reference EXACTLY — the theme's own look, the look develop
//     shipped — although the regime is ON (the rhythm box remaps the theme);
//   · PAST IT the band grows × s, and past a 96rem column stops at 1536px and
//     centres;
//   · AT A LARGER ROOT the floor rises with the theme: 1.25px at a 20px root,
//     every length the theme's rem look at that root;
//   · UNDER THE STEP nothing is declared: the theme's own rem;
//   · AT EVERY WIDTH the pair coupled to the header pill — the menu's sticky
//     line and the 2.5rem of air every jump leaves above its target — is rem
//     of the root, 136px and 40px at the 16px root: the pill does not scale,
//     so neither may they.
// No typeface is loaded and none is needed: a font SIZE, a grid track and a
// one-line link's box do not depend on glyph shapes (the fixture's labels are
// short enough to hold one line in any face this runner falls back to).
// Tolerance: a twentieth of a pixel on a box (layout rounds to 1/64px), a
// two-hundredth on a font size (a calc of px, never rounded).

const MENU_TITLE = 'Categorii';

/** Three short Romanian categories with diacritics (§15.7) — the smallest
 *  deck that holds a menu, a column of cards and a row in each. */
const CATEGORIES: readonly PriceCategoryProps[] = [
  {
    id: 'consultations',
    name: 'Consultații',
    eyebrow: 'Primul pas către tratament',
    rows: [
      { id: 'first-visit', name: 'Consultație inițială', price: '150 RON' },
    ],
  },
  {
    id: 'endodontics',
    name: 'Endodonție',
    eyebrow: 'Tratamente la microscop',
    rows: [{ id: 'one-canal', name: 'Un canal', price: '450 RON' }],
  },
  {
    id: 'prosthetics',
    name: 'Protetică',
    eyebrow: 'Lucrări fixe și mobile',
    rows: [{ id: 'crown', name: 'Coroană ceramică', price: '2.300 RON' }],
  },
];

/** THE BAND SCALE's numbers, written out (ui/Container's THE BAND SCALE —
 *  their census is tests/unit/design-scale.test.ts): the REFERENCE column,
 *  where a design pixel is a CSS pixel; the CAP and THE STEP in rem of the
 *  root; THE FLOOR, the band's own, one sixteenth of a rem. Spelled again on
 *  purpose: the census holds the source, these hold what the engine does. */
const REFERENCE = 1106;
const CAP_REM = 96;
const STEP_REM = 56;
const STEP_FLOOR = 896;
const FLOOR_REM = 1 / 16;

/** The default root every case but one is written at (the premise asserts
 *  it), and the CAP and THE STEP in px there. */
const ROOT = 16;
const CAP = CAP_REM * ROOT;
const STEP = Math.max(STEP_REM * ROOT, STEP_FLOOR);

/** The pair coupled to the header pill, in rem of the root: the menu's 8.5rem
 *  sticky line and the 2.5rem of air above every jump's target. */
const LINE_REM = 8.5;
const AIR_REM = 2.5;

/** The column from which the menu sits beside the cards — `@3xl`, in rem of
 *  the root. */
const SPLIT_REM = 48;

/** The band's own lengths at the reference column, in design pixels — what
 *  every case multiplies by its design pixel. Measured on develop 3bd21bd at
 *  the owner's 1401 window (a 1105.8px column, the planner's probe,
 *  2026-10-02): the menu card 240 wide, the gap 32, the menu's title 30, its
 *  links 18 on 44px boxes, a card's <h2> 36, its eyebrow 14, a row's <dt> 16. */
const DESIGN = {
  menu: 240,
  gap: 32,
  inset: 24,
  rhythmTop: 80,
  menuTitle: 30,
  linkFont: 18,
  linkHeight: 44,
  cardTitle: 36,
  eyebrow: 14,
  term: 16,
  price: 16,
} as const;

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
 *  `--spacing` on the box that wears it; elsewhere the box inherits the
 *  root's. Asked of the declaration, never of a number: under the reference
 *  the floor makes the two agree to the last digit, and only the remap says
 *  which one drew (DoctorShowcase.test.tsx's `remapped`). */
const remapped = (element: Element): boolean =>
  getComputedStyle(element).getPropertyValue('--spacing') !==
  getComputedStyle(document.documentElement).getPropertyValue('--spacing');

const fontSize = (element: Element): number =>
  parseFloat(getComputedStyle(element).fontSize);

/** The node a query found, as an HTMLElement — or a failure that NAMES what
 *  went missing, so a lost node fails with its name instead of a TypeError
 *  further on (PriceList.stories.tsx's `regimeOf` check, one node at a time). */
const htmlElement = (
  node: Element | null | undefined,
  name: string,
): HTMLElement => {
  if (!(node instanceof HTMLElement)) {
    throw new Error(`THE BAND SCALE: no ${name}`);
  }
  return node;
};

/** The band, Romanian, in a box whose Container gets a `width` px column —
 *  and the premise every number rests on, checked before any is read. */
const renderColumn = (width: number) => {
  render(
    <div style={{ width: `${width + 2 * gutter()}px` }}>
      <PriceList menuTitle={MENU_TITLE} categories={CATEGORIES} />
    </div>,
  );
  const menu = screen.getByRole('navigation', { name: MENU_TITLE });
  // The nav's nearest <section> is the band's own: the category cards are its
  // siblings' children, never its ancestors.
  const band = menu.closest('section');
  if (band === null) throw new Error('THE BAND SCALE: no band rendered');
  const column = htmlElement(band.firstElementChild, 'ui/Container column');
  const rhythm = htmlElement(column.firstElementChild, 'rhythm box');
  expect(column.getBoundingClientRect().width, 'the column').toBeCloseTo(
    width,
    1,
  );
  return {
    column,
    rhythm,
    menu,
    // The category cards are the band's named regions; the band itself is not
    // named (PriceList.tsx's WHAT THE BAND DELIBERATELY DOES NOT NAME).
    cards: screen.getAllByRole('region'),
  };
};

type Scene = ReturnType<typeof renderColumn>;

/** What the band draws, read from the engine. */
const sizesOf = ({ rhythm, menu, cards }: Scene) => {
  const [first] = cards;
  const link = within(menu).getAllByRole('link')[0];
  const cardsColumn = htmlElement(
    first.parentElement,
    'cards’ column',
  ).getBoundingClientRect();
  const menuBox = menu.getBoundingClientRect();
  return {
    rhythm: rhythm.getBoundingClientRect(),
    rhythmTop: parseFloat(getComputedStyle(rhythm).paddingTop),
    menu: menuBox,
    cardsColumn,
    gap: cardsColumn.left - menuBox.right,
    menuTitle: fontSize(within(menu).getByRole('heading', { level: 2 })),
    linkFont: fontSize(link),
    linkHeight: link.getBoundingClientRect().height,
    inset: parseFloat(getComputedStyle(first).paddingTop),
    cardTitle: fontSize(within(first).getByRole('heading', { level: 2 })),
    eyebrow: fontSize(within(first).getByText(CATEGORIES[0].eyebrow)),
    term: fontSize(htmlElement(first.querySelector('dt'), 'row <dt>')),
    price: fontSize(htmlElement(first.querySelector('dd'), 'row <dd>')),
  };
};

/** THE DESIGN PIXEL the regime gives a `width` px column at a `root` px root:
 *  the column's — capped at 96rem — over the reference, never under THE
 *  FLOOR's 1rem / 16. */
const pixelAt = (width: number, root: number): number =>
  Math.max(FLOOR_REM * root, Math.min(width, CAP_REM * root) / REFERENCE);

/**
 * Every length of the band, against its design pixel `s`, at a `width` px
 * column whose band is `band` px wide (the column, capped at 96rem): the
 * regime declared on the rhythm box and on no box around it, the band capped
 * and centred, the menu's track at its floor (sixty spacing steps) and the
 * cards' column the rest of the band, and every other theme length its
 * reference × s.
 */
const expectDrawnAt = (
  scene: Scene,
  { width, band, s }: Readonly<{ width: number; band: number; s: number }>,
): void => {
  const sizes = sizesOf(scene);

  // THE REGIME: declared on the rhythm box — the grid itself, the box one
  // level inside ui/Container (recipe rule 5) — and nowhere else.
  expect(remapped(scene.rhythm), 'the rhythm box remaps the theme').toBe(true);
  expect(remapped(scene.column), 'ui/Container stays the root’s').toBe(false);
  expect(
    parseFloat(getComputedStyle(scene.rhythm).getPropertyValue('--scale-px')),
    'the design pixel',
  ).toBeCloseTo(s, 4);
  // bandColumnClasses: as wide as the column up to the cap, centred past it.
  expect(sizes.rhythm.width, 'the band').toBeCloseTo(band, 1);
  expect(
    sizes.rhythm.left - scene.column.getBoundingClientRect().left,
    'the band’s centring',
  ).toBeCloseTo((width - band) / 2, 1);

  // THE TWO TRACKS — the menu at its floor, sixty spacing steps, unless its
  // fifth of the band is wider (it never is inside the scale), and the cards
  // the rest of the band, a gap away.
  const gap = DESIGN.gap * s;
  const menu = Math.max(DESIGN.menu * s, (band - gap) / 5);
  expect(menu, 'the floor decides the menu’s track').toBeCloseTo(
    DESIGN.menu * s,
    4,
  );
  expect(sizes.menu.width, 'the menu card').toBeCloseTo(menu, 1);
  expect(sizes.cardsColumn.width, 'the cards’ column').toBeCloseTo(
    band - gap - menu,
    1,
  );
  expect(sizes.gap, 'the gap').toBeCloseTo(gap, 1);
  expect(sizes.rhythmTop, 'the band’s top step').toBeCloseTo(
    DESIGN.rhythmTop * s,
    1,
  );
  expect(sizes.inset, 'a card’s inset').toBeCloseTo(DESIGN.inset * s, 1);
  // The menu: its title one step under the cards' (its own container, the
  // menu's track, never reaches `@md`), its links on the 44 design px box.
  expect(sizes.menuTitle, 'the menu’s title').toBeCloseTo(
    DESIGN.menuTitle * s,
    2,
  );
  expect(sizes.linkFont, 'a link’s label').toBeCloseTo(DESIGN.linkFont * s, 2);
  expect(sizes.linkHeight, 'a link’s box').toBeCloseTo(
    DESIGN.linkHeight * s,
    1,
  );
  // A card: its title at the `band` step's 36, its eyebrow, its rows.
  expect(sizes.cardTitle, 'a card’s <h2>').toBeCloseTo(DESIGN.cardTitle * s, 2);
  expect(sizes.eyebrow, 'a card’s eyebrow').toBeCloseTo(DESIGN.eyebrow * s, 2);
  expect(sizes.term, 'a row’s treatment').toBeCloseTo(DESIGN.term * s, 2);
  expect(sizes.price, 'a row’s price').toBeCloseTo(DESIGN.price * s, 2);
};

/** The pair coupled to the header pill, read at a `root` px root: the menu's
 *  own air over a jump to its id, every card's stylesheet air — the floor
 *  lib/scroll-spy's reading line plans every landing from — and, beside the
 *  cards, the menu's sticky line. */
const expectPillPairAt = (
  { menu, cards }: Scene,
  { width, root }: Readonly<{ width: number; root: number }>,
): void => {
  const air = `${AIR_REM * root}px`;
  // The menu is not one of the spy's targets: nothing writes over its air.
  expect(getComputedStyle(menu).scrollMarginTop, 'the menu’s air').toBe(air);
  // The spy has written each card's planned landing over its air inline
  // (round 5), so the inline value is lifted for the read and put back after.
  for (const card of cards) {
    const planned = card.style.getPropertyValue('scroll-margin-top');
    expect(planned, 'the spy wrote a landing — the lift is real').toMatch(
      /^-?\d+(\.\d+)?px$/,
    );
    card.style.removeProperty('scroll-margin-top');
    try {
      expect(getComputedStyle(card).scrollMarginTop, 'a card’s air').toBe(air);
    } finally {
      card.style.setProperty('scroll-margin-top', planned);
    }
  }

  if (width >= SPLIT_REM * root) {
    // Beside the cards: sticky at the 8.5rem line. The menu FITS this
    // runner's window, so lib/sticky-rail writes nothing over it — no mode,
    // no inline `top` — and the computed line is the stylesheet's.
    expect(menu).not.toHaveAttribute('data-rail');
    expect(menu.style.getPropertyValue('top')).toBe('');
    expect(getComputedStyle(menu).position).toBe('sticky');
    expect(getComputedStyle(menu).top, 'the menu’s line').toBe(
      `${LINE_REM * root}px`,
    );
  } else {
    // Stacked: a plain table of contents, the line not asked.
    expect(getComputedStyle(menu).position).toBe('static');
  }
};

describe('PriceList — THE BAND SCALE, computed (§15.32 — the real stylesheet)', () => {
  beforeAll(() => {
    // THE PREMISE: this runner is a place where the regime CAN apply — a fine
    // primary pointer and an engine that registers custom properties, the two
    // conditions of globals.css's THE SCALABLE VARIANT — at the 16px root
    // every number above is written at. Otherwise every case that expects the
    // scale would fail for a reason that reads as the band's, and every case
    // that expects none would pass for the wrong one.
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
      'the default 16px root',
    ).toBe(ROOT);
  });

  it.each([
    // Just past the step — not ON it: the column is set through a box and a
    // gutter, and a sixty-fourth of a pixel under 896 would read as "under".
    { where: 'a column just past the step, 900px', width: STEP + 4 },
    {
      where:
        'the owner’s 1392 × 1179 window — 1392 − 15 − 2 × 139.2 = 1098.6px of column under a classic scrollbar',
      width: 1098.6,
    },
    {
      where: 'the reference column (the owner’s 1401 × 1063 window)',
      width: REFERENCE,
    },
  ])(
    'holds the THEME’S OWN pixels under the reference — THE FLOOR binds at $where: the regime on, s = 1, every length its reference exactly',
    ({ width }) => {
      // The premise: the column alone would draw the band at or under the
      // reference — the floor, not the column, is what decides here.
      expect(Math.min(width, CAP) / REFERENCE).toBeLessThanOrEqual(1);
      expect(pixelAt(width, ROOT)).toBe(1);

      expectDrawnAt(renderColumn(width), { width, band: width, s: 1 });
    },
  );

  it.each([
    { where: 'a wider laptop column', width: 1300 },
    { where: 'a column past the cap', width: 1800 },
  ])(
    'grows menu AND cards past the reference at $where — every length its reference × s, capped and centred',
    ({ width }) => {
      const s = pixelAt(width, ROOT);
      // The premise: past the reference, the column's pixel is the larger.
      expect(s).toBeGreaterThan(1);
      expect(s).toBeCloseTo(Math.min(width, CAP) / REFERENCE, 10);

      expectDrawnAt(renderColumn(width), {
        width,
        band: Math.min(width, CAP),
        s,
      });
    },
  );

  it('lifts the floor with a LARGER ROOT — at a 20px root and a 1200px column the pixel is 1.25, the theme’s rem look at that root, and the pill’s pair is that root’s rem', () => {
    // A 20px root moves the regime's step to 56rem = 1120px and its cap to
    // 96rem = 1920px, so a 1200px column is INSIDE the regime and under the
    // cap. The column alone would give 1200 / 1106 = 1.085; THE FLOOR's
    // 1rem / 16 is 1.25px there — the theme's own pixel at that root — so
    // every length is the rem look a 20px root gives the theme: the card's
    // <h2> 36 × 1.25 = 45px, where the plain scale would draw 39.06.
    const root = 20;
    const width = 1200;
    document.documentElement.style.fontSize = `${root}px`;
    try {
      expect(width).toBeGreaterThanOrEqual(
        Math.max(STEP_REM * root, STEP_FLOOR),
      );
      expect(width).toBeLessThan(CAP_REM * root);
      const s = pixelAt(width, root);
      expect(s).toBe(1.25);
      expect(width / REFERENCE).toBeLessThan(s);

      const scene = renderColumn(width);
      expectDrawnAt(scene, { width, band: width, s });
      expect(
        fontSize(within(scene.cards[0]).getByRole('heading', { level: 2 })),
        'the card’s <h2>, the theme’s rem look at a 20px root',
      ).toBeCloseTo(45, 2);
      expectPillPairAt(scene, { width, root });
    } finally {
      document.documentElement.style.fontSize = '';
    }
  });

  it('declares NOTHING under the step — the theme’s own rem, the menu on its 15rem floor', () => {
    // A column 16px short of the step: the menu still sits beside the cards
    // (the split is 48rem), and every length is the theme's, in rem of the
    // 16px root — the band as it was before 2026-10-02, to the pixel.
    const width = STEP - 16;
    const scene = renderColumn(width);
    const sizes = sizesOf(scene);

    expect(remapped(scene.rhythm)).toBe(false);
    // The registered property's initial value: nothing declared it.
    expect(getComputedStyle(scene.rhythm).getPropertyValue('--scale-px')).toBe(
      '1px',
    );
    expect(sizes.rhythm.width).toBeCloseTo(width, 1);
    // 15rem — (880 − 32) / 5 = 169.6 is far under the floor.
    expect(sizes.menu.width).toBeCloseTo(DESIGN.menu, 1);
    expect(sizes.cardsColumn.width).toBeCloseTo(
      width - DESIGN.menu - DESIGN.gap,
      1,
    );
    expect(sizes.gap).toBeCloseTo(DESIGN.gap, 1);
    expect(sizes.rhythmTop).toBe(DESIGN.rhythmTop);
    expect(sizes.inset).toBe(DESIGN.inset);
    expect(sizes.menuTitle).toBe(DESIGN.menuTitle);
    expect(sizes.linkFont).toBe(DESIGN.linkFont);
    expect(sizes.linkHeight).toBeCloseTo(DESIGN.linkHeight, 1);
    expect(sizes.cardTitle).toBe(DESIGN.cardTitle);
    expect(sizes.eyebrow).toBe(DESIGN.eyebrow);
    expect(sizes.term).toBe(DESIGN.term);
    expect(sizes.price).toBe(DESIGN.price);
  });

  it.each([
    { where: 'a phone-width column, stacked', width: 600 },
    { where: 'a column under the step', width: STEP - 16 },
    { where: 'a column just past the step, at the floor', width: STEP + 4 },
    { where: 'the owner’s 1392 window', width: 1098.6 },
    { where: 'a wider laptop column', width: 1300 },
    { where: 'a column past the cap', width: 1800 },
  ])(
    'keeps the pair coupled to the header pill at 136px and 40px at $where — the pill does not scale, so neither do they',
    ({ width }) => {
      expectPillPairAt(renderColumn(width), { width, root: ROOT });
    },
  );
});
