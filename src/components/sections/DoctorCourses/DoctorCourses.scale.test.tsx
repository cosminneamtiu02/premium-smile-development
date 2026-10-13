import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline — the
// reason this file exists apart from DoctorCourses.test.tsx (the header
// below). tests/setup/components.ts loads no CSS globally; the per-file import
// is the house pattern (Card, Container, ClinicLocation, DoctorShowcase,
// PriceList.scale, DoctorProfile.scale).
import '@/styles/globals.css';
import { containerClasses } from '@/components/ui/Container/Container';
import { DoctorCourses, type CourseGroup } from './DoctorCourses';

// sections/DoctorCourses — THE BAND SCALE, COMPUTED (2026-10-13, CLAUDE.md
// §15.32 round 4; DoctorCourses.tsx's paragraph of that name). The owner,
// verbatim: "take current heading and eyebrow from main page. look how
// reactive and nice it is. make the exact same thing with the heading and
// eyebrow from the individual dr page" — and, asked how far, "Whole page,
// like Home". So on a laptop or desktop the course timeline is ONE design,
// the owner's 1401-window look scaled to its column; on every phone and
// tablet not one pixel may move.
//
// ── WHY A FILE OF ITS OWN. DoctorCourses.test.tsx's premise is that NO
// stylesheet is loaded: the utility tokens are its contract, and its header
// says so. The scale, on the other hand, is a COMPUTED length — a class name
// cannot show a design pixel — so it needs the sheet. One premise per file
// (PriceList.scale.test.tsx's precedent, DoctorProfile.scale.test.tsx's the
// same day): the scale's class contract stays in DoctorCourses.test.tsx (its
// THE BAND SCALE block, with the audit that every length is a theme step),
// what the engine draws with it lives here, and the arrangement at the pinned
// windows — the stretches, the dots on them, the lit year's motion — lives in
// the stories' plays, which read the same sizes at the 1536 laptop and the
// 390 phone.
//
// ── WHAT IS MEASURED. The band in a box that hands its Container a column of
// exactly `width` px — the gutter read off a probe wearing the real class,
// never assumed (ClinicLocation's and DoctorShowcase's `renderColumn`) — and
// every length read back from the engine, AT REST: one window-tall block
// stands above the band, as the doctor's opener and profile band do on the
// page, so no year is lit (the island's `topFallback: 'none'`) and every
// group is drawn at its laid-out size. Inside the scale (a mouse or trackpad
// in this runner, a column of max(56rem, 896px)) the design pixel is
// s = min(column, 96rem) / 1106, and every length of the band is its
// reference length × s: the <h2> 36, the eyebrow 14, a year 30, a course
// line 18, a dot 12, the line 2, a group's indent 40, the 80 between years,
// the rail's 896 cap, the band's top step 80 and the rail's top margin 48 —
// the rail always 896 of the box's 1106, so the current year's forward
// motion keeps the room the stories measure. Past a 96rem column the box
// stops at 1536px and centres. Outside the scale — every phone's column, a
// tablet's, a laptop's under the step — nothing is declared and every length
// is the theme's own. AND AT EVERY WIDTH the dots' ring stays 4px: a box
// shadow in px, the one length the design pixel does not redraw (the band's
// WHAT DOES NOT).
// No typeface is loaded and none is needed: a font SIZE, a box's width, a
// padding and the gap between two boxes do not depend on glyph shapes.
// Tolerance: a twentieth of a pixel on a box (layout rounds to 1/64px), a
// two-hundredth on a font size (a calc of px, never rounded).

/** THE BAND SCALE's numbers, written out (ui/Container's THE BAND SCALE —
 *  their census is tests/unit/design-scale.test.ts): the REFERENCE column,
 *  where a design pixel is a CSS pixel; the CAP and THE STEP in px at this
 *  runner's 16px root (the premise asserts it). Spelled again on purpose: the
 *  census holds the source, these hold what the engine does. */
const REFERENCE = 1106;
const ROOT = 16;
const CAP = 96 * ROOT;
const STEP = Math.max(56 * ROOT, 896);

/** The band's own lengths at the reference column — the owner's 1401 window —
 *  in design pixels: ui/Heading's `band` step past its `@md` and ui/Eyebrow's
 *  14 (the opener), the `section` step (D44a) and `text-lg` (the years and
 *  the lines), `size-3`, `w-0.5` and `ps-10` (a dot, the line, a group's
 *  indent), `gap-20` (D44b), `max-w-4xl` (D34), the rhythm box's `@3xl:py-20`
 *  and the rail's `@3xl:mt-12`. */
const DESIGN = {
  title: 36,
  eyebrow: 14,
  year: 30,
  line: 18,
  dot: 12,
  stretch: 2,
  indent: 40,
  gap: 80,
  rail: 896,
  rhythm: 80,
  railTop: 48,
} as const;

/** The ring every dot wears (`ring-4`), in px at every width and every scale. */
const RING = 4;

const EYEBROW = 'Formare continuă';
const TITLE = 'Cursuri și specializări';

/** Four years, newest first — DoctorCourses.test.tsx's fixture (§15.7:
 *  Romanian with diacritics; invented courses, D-DASH-clean). */
const GROUPS = [
  {
    year: '2024',
    courses: [
      'Curs de aliniere dentară cu gutiere transparente, București',
      'Curs de ortodonție digitală și scanare intraorală, Cluj-Napoca',
    ],
  },
  {
    year: '2023',
    courses: ['Congresul Asociației Europene de Ortodonție, Viena'],
  },
  {
    year: '2021',
    courses: ['Curs de ortodonție interceptivă la copii, Cluj-Napoca'],
  },
  {
    year: '2016',
    courses: [
      'Specializare în ortodonție și ortopedie dento-facială, UMF „Carol Davila”, București',
    ],
  },
] as const satisfies readonly CourseGroup[];

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

/** IS THE THEME REMAPPED on this box? The scale redefines `--spacing` on the
 *  box that wears it; elsewhere a box inherits the root's. Asked of the
 *  declaration, never of a number: at the reference the design pixel IS the
 *  registered initial 1px, and only the remap says which one drew
 *  (DoctorShowcase.test.tsx's `remapped`). */
const remapped = (element: Element): boolean =>
  getComputedStyle(element).getPropertyValue('--spacing').trim() !==
  getComputedStyle(document.documentElement)
    .getPropertyValue('--spacing')
    .trim();

const fontSize = (element: Element): number =>
  parseFloat(getComputedStyle(element).fontSize);

/** An element's used length — never `offsetWidth`, whose integer would round
 *  a design pixel away. */
const usedPx = (element: Element, property: 'width' | 'height'): number =>
  parseFloat(getComputedStyle(element)[property]);

/** The widest spread among an element's computed box shadows, in px — a
 *  dot's ring (`ring-4` composes it into the box-shadow list). */
const ringSpread = (element: Element): number =>
  Math.max(
    0,
    ...[
      ...getComputedStyle(element).boxShadow.matchAll(
        /0px 0px 0px (\d+(?:\.\d+)?)px/g,
      ),
    ].map((match) => Number(match[1])),
  );

/** The node a step found, as an HTMLElement — or a failure that NAMES what
 *  went missing, instead of a TypeError further on. */
const htmlElement = (
  node: Element | null | undefined,
  name: string,
): HTMLElement => {
  if (!(node instanceof HTMLElement)) {
    throw new Error(`THE BAND SCALE: no ${name}`);
  }
  return node;
};

// ── THE PAGE ABOVE THE BAND (DoctorCourses.test.tsx's paragraph of that
// name): the island lights the year whose top has crossed the middle of the
// window (D49), and a lit group is DRAWN at 1.04 — so one window-tall block,
// inserted before Testing Library's own container, keeps every year below
// that middle and every group at rest, its boxes its laid-out ones.
let pageAbove: HTMLElement | undefined;

beforeEach(() => {
  pageAbove = document.createElement('div');
  pageAbove.style.height = '100vh';
  document.body.prepend(pageAbove);
});

afterEach(() => {
  pageAbove?.remove();
  pageAbove = undefined;
});

/** The band, Romanian, in a box whose Container gets a `width` px column —
 *  every box found from the region down, by structure (paint and layout
 *  carry no role) — and the premises every number rests on, checked first:
 *  the column is the width asked for, and no year is lit. */
const renderColumn = (width: number) => {
  render(
    <div style={{ width: `${width + 2 * gutter()}px` }}>
      <DoctorCourses eyebrow={EYEBROW} title={TITLE} groups={GROUPS} />
    </div>,
  );
  const band = screen.getByRole('region', { name: TITLE });
  const column = htmlElement(band.firstElementChild, 'ui/Container column');
  const box = htmlElement(column.firstElementChild, 'rhythm box');
  const years = within(band).getAllByRole('heading', { level: 3 });
  const groups = years.map((year) => htmlElement(year.parentElement, 'group'));
  const rail = htmlElement(groups[0]?.parentElement, 'rail');
  expect(column.getBoundingClientRect().width, 'the column').toBeCloseTo(
    width,
    1,
  );
  expect(band.querySelector('[data-current]'), 'a lit year').toBeNull();
  return { band, column, box, rail, groups, years };
};

type Scene = ReturnType<typeof renderColumn>;

/** What the band draws, read from the engine. */
const sizesOf = ({ band, column, box, rail, groups, years }: Scene) => {
  const title = within(band).getByRole('heading', { level: 2 });
  const boxes = groups.map((group) => group.getBoundingClientRect());
  return {
    column: column.getBoundingClientRect(),
    box: box.getBoundingClientRect(),
    rail: rail.getBoundingClientRect(),
    title: fontSize(title),
    eyebrow: fontSize(htmlElement(title.previousElementSibling, 'eyebrow')),
    years: years.map(fontSize),
    lines: within(band).getAllByRole('listitem').map(fontSize),
    dots: groups.map((group) =>
      usedPx(htmlElement(group.children[1], 'dot'), 'width'),
    ),
    rings: groups.map((group) =>
      ringSpread(htmlElement(group.children[1], 'dot')),
    ),
    stretches: groups.map((group) =>
      usedPx(htmlElement(group.children[0], 'stretch'), 'width'),
    ),
    indents: groups.map((group) =>
      parseFloat(getComputedStyle(group).paddingInlineStart),
    ),
    gaps: boxes.slice(1).map((next, index) => next.top - boxes[index].bottom),
    rhythm: parseFloat(getComputedStyle(box).paddingTop),
    rhythmBelow: parseFloat(getComputedStyle(box).paddingBottom),
    railTop: parseFloat(getComputedStyle(rail).marginTop),
  };
};

describe('DoctorCourses — THE BAND SCALE, computed (§15.32 round 4 — the real stylesheet)', () => {
  beforeAll(() => {
    // THE PREMISE: this runner is a place where the scale CAN apply — a fine
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
    { where: 'a 320 phone’s column, 288px', width: 288 },
    { where: 'a 390 phone’s column, 351px', width: 351 },
    { where: 'a 768 tablet’s column, 614.4px', width: 614.4 },
    { where: 'an 880px column — a laptop’s, under the step', width: 880 },
  ])(
    'declares NOTHING at $where — the theme’s own lengths, every pixel as before',
    ({ width }) => {
      const scene = renderColumn(width);
      const sizes = sizesOf(scene);

      expect(remapped(scene.box), 'the rhythm box remaps nothing').toBe(false);
      // The registered property's initial value: nothing declared it.
      expect(getComputedStyle(scene.box).getPropertyValue('--scale-px')).toBe(
        '1px',
      );
      // The box is the column, edge to edge; the rail the column up to 56rem.
      expect(sizes.box.width).toBeCloseTo(width, 1);
      expect(sizes.box.left).toBeCloseTo(sizes.column.left, 1);
      expect(sizes.rail.width).toBeCloseTo(Math.min(width, DESIGN.rail), 1);
      expect(sizes.rail.left).toBeCloseTo(sizes.column.left, 1);
      // `band`'s step reads the column against 28rem; the rhythm and the
      // rail's top margin step at `@lg` (32rem) and `@3xl` (48rem).
      expect(sizes.title).toBe(width >= 28 * ROOT ? 36 : 30);
      expect(sizes.eyebrow).toBe(14);
      for (const size of sizes.years) expect(size).toBe(30);
      expect(sizes.lines.length).toBeGreaterThan(0);
      for (const size of sizes.lines) expect(size).toBe(18);
      for (const size of sizes.dots) expect(size).toBe(12);
      for (const size of sizes.stretches) expect(size).toBe(2);
      for (const size of sizes.indents) expect(size).toBe(40);
      for (const gap of sizes.gaps) expect(gap).toBeCloseTo(80, 1);
      const step = width >= 48 * ROOT ? 2 : width >= 32 * ROOT ? 1 : 0;
      expect(sizes.rhythm).toBe([48, 64, 80][step]);
      expect(sizes.rhythmBelow).toBe(sizes.rhythm);
      expect(sizes.railTop).toBe([32, 40, 48][step]);
      // The ring: 4px.
      for (const spread of sizes.rings) expect(spread).toBe(RING);
    },
  );

  it.each([
    // Just past the step — not ON it: the column is set through a box and a
    // gutter, and a sixty-fourth of a pixel under 896 would read as "under".
    { where: 'a column just past the step, 900px', width: STEP + 4 },
    {
      where:
        'the owner’s 1401 window — the reference column, 1106px (s = 1, the look the scale keeps)',
      width: REFERENCE,
    },
    {
      where:
        'a 1536 window’s column beside a classic scrollbar — 1536 − 15 − 2 × 153.6 = 1213.8px',
      width: 1213.8,
    },
    {
      where: 'a 1920 window’s — 1920 − 15 − 2 × 192 = 1521px',
      width: 1521,
    },
    { where: 'a column past the cap, 2000px', width: 2000 },
  ])(
    'draws the WHOLE band in the design pixel at $where — every length × s, capped and centred past 96rem, the ring still 4px',
    ({ width }) => {
      const scene = renderColumn(width);
      const sizes = sizesOf(scene);
      const band = Math.min(width, CAP);
      const s = band / REFERENCE;

      // THE REGIME: declared on the rhythm box — and inherited inside it —
      // never on the column around it.
      expect(remapped(scene.box), 'the rhythm box remaps the theme').toBe(true);
      expect(remapped(scene.rail), 'the rail inherits it').toBe(true);
      expect(remapped(scene.column), 'ui/Container stays the root’s').toBe(
        false,
      );
      expect(
        parseFloat(getComputedStyle(scene.box).getPropertyValue('--scale-px')),
        'the design pixel',
      ).toBeCloseTo(s, 4);
      // bandColumnClasses: as wide as the column up to the cap, centred past.
      expect(sizes.box.width, 'the band').toBeCloseTo(band, 1);
      expect(sizes.box.left - sizes.column.left, 'the centring').toBeCloseTo(
        (width - band) / 2,
        1,
      );

      // The rail: on the box's left edge, `max-w-4xl` in the design's pixels
      // — 896 of the box's 1106 at every width, so the current year's 1.04
      // and its ~1.065 overshoot always grow into the box's own free width
      // (DoctorCourses.tsx's THE FORWARD MOTION STAYS IN THE BAND'S BOX).
      expect(sizes.rail.left, 'the rail’s left edge').toBeCloseTo(
        sizes.box.left,
        1,
      );
      expect(sizes.rail.width, 'the rail').toBeCloseTo(DESIGN.rail * s, 1);
      expect(
        (sizes.box.right - sizes.rail.left) / sizes.rail.width,
        'the room the box leaves a group, as a scale',
      ).toBeCloseTo(REFERENCE / DESIGN.rail, 2);

      // The rhythm, symmetric, and the rail's top margin, × s.
      expect(sizes.rhythm, 'the rhythm').toBeCloseTo(DESIGN.rhythm * s, 1);
      expect(sizes.rhythmBelow).toBeCloseTo(sizes.rhythm, 2);
      expect(sizes.railTop, 'the rail’s top margin').toBeCloseTo(
        DESIGN.railTop * s,
        1,
      );

      // Every word, × s: the opener, the years, the course lines.
      expect(sizes.title, 'the <h2>').toBeCloseTo(DESIGN.title * s, 2);
      expect(sizes.eyebrow, 'the eyebrow').toBeCloseTo(DESIGN.eyebrow * s, 2);
      expect(sizes.years).toHaveLength(GROUPS.length);
      for (const size of sizes.years) {
        expect(size, 'a year').toBeCloseTo(DESIGN.year * s, 2);
      }
      expect(sizes.lines.length).toBeGreaterThan(0);
      for (const size of sizes.lines) {
        expect(size, 'a course line').toBeCloseTo(DESIGN.line * s, 2);
      }

      // The timeline's paint and spacing, × s — the 80 between years
      // included — while the ring stays 4px (the band's WHAT DOES NOT).
      for (const size of sizes.dots) {
        expect(size, 'a dot').toBeCloseTo(DESIGN.dot * s, 1);
      }
      for (const size of sizes.stretches) {
        expect(size, 'the line').toBeCloseTo(DESIGN.stretch * s, 1);
      }
      for (const size of sizes.indents) {
        expect(size, 'a group’s indent').toBeCloseTo(DESIGN.indent * s, 1);
      }
      expect(sizes.gaps).toHaveLength(GROUPS.length - 1);
      for (const gap of sizes.gaps) {
        expect(gap, 'the gap between years').toBeCloseTo(DESIGN.gap * s, 1);
      }
      for (const spread of sizes.rings) expect(spread, 'the ring').toBe(RING);
    },
  );
});
