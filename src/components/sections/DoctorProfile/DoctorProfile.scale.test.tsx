import { render, screen, within } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline — the
// reason this file exists apart from DoctorProfile.test.tsx (the header
// below). tests/setup/components.ts loads no CSS globally; the per-file import
// is the house pattern (Card, Container, ClinicLocation, DoctorShowcase,
// PriceList.scale).
import '@/styles/globals.css';
import { containerClasses } from '@/components/ui/Container/Container';
import { formatHoursRows } from '@/lib/hours/hours';
import { DoctorProfile } from './DoctorProfile';

// sections/DoctorProfile — THE BAND SCALE, COMPUTED (2026-10-13, CLAUDE.md
// §15.32 round 4; DoctorProfile.tsx's paragraph of that name). The owner,
// verbatim: "take current heading and eyebrow from main page. look how
// reactive and nice it is. make the exact same thing with the heading and
// eyebrow from the individual dr page" — and, asked how far, "Whole page,
// like Home". So on a laptop or desktop this band is ONE design, the owner's
// 1401-window look scaled to its column; on every phone and tablet not one
// pixel may move.
//
// ── WHY A FILE OF ITS OWN. DoctorProfile.test.tsx's premise is that NO
// stylesheet is loaded: the utility tokens are its contract, and its pins say
// so (the name's `hyphens-none` is read as a class because a computed value
// would be the browser's default there). The scale, on the other hand, is a
// COMPUTED length — a class name cannot show a design pixel — so it needs the
// sheet. One premise per file (PriceList.scale.test.tsx's precedent): the
// scale's class contract stays in DoctorProfile.test.tsx, what the engine
// draws with it lives here, and the arrangement at the pinned windows lives
// in the stories' plays.
//
// ── WHAT IS MEASURED. The band in a box that hands its Container a column of
// exactly `width` px — the gutter read off a probe wearing the real class,
// never assumed (ClinicLocation's and DoctorShowcase's `renderColumn`) — and
// every length read back from the engine. Inside the scale (a mouse or
// trackpad in this runner, a column of max(56rem, 896px)) the design pixel is
// s = min(column, 96rem) / 1106, and every length of the band is its
// reference length × s: the card 320, the outdent 32, the gap 48, the rhythm
// 40, the „Despre" title 36, its eyebrow 14, the prose 18, the card's title
// 30, a day 16 — and the prose track the rest, 770, under its `max-w-4xl`'s
// 896, so the measure is the reference's at every width. Past a 96rem column
// the scale box stops at 1536px and centres. Outside the scale — every
// phone's column, a tablet's, a laptop's under the step — nothing is
// declared and every length is the theme's own. AND AT EVERY WIDTH the two
// fades stay 6rem: TintedBand's boxes, outside ui/Container — the recorded
// trade (DoctorProfile.tsx's WHAT STAYS IN rem).
// No typeface is loaded and none is needed: a font SIZE, a grid track and a
// margin do not depend on glyph shapes, and the one height-based check (the
// card's middle on the biography's, D37) holds by construction in any face.
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
 *  in design pixels (DoctorProfile.tsx: D53's eighty-step card, THE PROSE
 *  OUTDENT's eight steps, `gap-x-12`, `@3xl:py-10`, `band`'s 36, ui/Eyebrow's
 *  14, `text-lg`, the card's title one step under, ui/Text's 16). */
const DESIGN = {
  card: 320,
  outdent: 32,
  gap: 48,
  rhythm: 40,
  title: 36,
  eyebrow: 14,
  prose: 18,
  cardTitle: 30,
  day: 16,
} as const;

/** The prose track at the reference, in design pixels: the scale box's 1106,
 *  the outdent's 32 added, the gap and the card taken off — 770, under the
 *  measure's `max-w-4xl` (896 design pixels), so the cap never binds in the
 *  scale (DoctorProfile.tsx's THE ONE LEVER ON THE MEASURE). */
const PROSE_TRACK = REFERENCE + DESIGN.outdent - DESIGN.gap - DESIGN.card;
const MEASURE = 896;

/** TintedBand's fades, 6rem each — rem at every width (the header). */
const FADE = 6 * ROOT;

/** A short Romanian biography (§15.7), factual and CMSR-clean, drafted for
 *  this suite — never lib/team's words, so a data edit moves no number here. */
const ABOUT = {
  eyebrow: 'Biografie',
  title: 'Despre Dr. Elena Marin',
  paragraphs: [
    'Dr. Elena Marin este medic specialist în ortodonție și lucrează în clinica noastră din 2015. Tratează copii, adolescenți și adulți, cu aparate fixe sau cu gutiere transparente, după caz.',
    'La prima consultație ascultă ce își dorește pacientul, apoi face examenul clinic și cere radiografiile necesare. Planul de tratament se stabilește împreună, după ce toate întrebările au primit un răspuns.',
    'Fiecare etapă este explicată înainte de a începe, cu durata estimată și costul ei. Între ședințe, pacientul poate suna la clinică pentru orice nelămurire legată de tratament.',
  ],
} as const;

const SCHEDULE = {
  title: 'Când mă găsiți la clinică',
  rows: formatHoursRows(
    [
      {
        days: ['Monday', 'Wednesday', 'Friday'],
        opens: '09:00',
        closes: '17:00',
      },
      { days: ['Tuesday', 'Thursday'], opens: '12:00', closes: '20:00' },
    ],
    'ro',
    'Închis',
  ),
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

/** The band, Romanian, in a box whose Container gets a `width` px column —
 *  every box found from the two regions up, by structure (paint and layout
 *  carry no role) — and the premise every number rests on, checked first. */
const renderColumn = (width: number) => {
  render(
    <div style={{ width: `${width + 2 * gutter()}px` }}>
      <DoctorProfile about={ABOUT} schedule={SCHEDULE} />
    </div>,
  );
  const about = screen.getByRole('region', { name: ABOUT.title });
  const card = screen.getByRole('region', { name: SCHEDULE.title });
  const grid = htmlElement(about.parentElement, 'grid');
  const box = htmlElement(grid.parentElement, 'scale box');
  const column = htmlElement(box.parentElement, 'ui/Container column');
  const middle = htmlElement(column.parentElement, 'tinted middle box');
  const band = htmlElement(middle.parentElement, 'band');
  expect(column.getBoundingClientRect().width, 'the column').toBeCloseTo(
    width,
    1,
  );
  return { band, middle, column, box, grid, about, card };
};

type Scene = ReturnType<typeof renderColumn>;

/** What the band draws, read from the engine. */
const sizesOf = ({ band, column, box, grid, about, card }: Scene) => {
  const title = within(about).getByRole('heading', { level: 2 });
  const prose = htmlElement(about.lastElementChild, 'paragraphs’ block');
  const [fadeIn, , fadeOut] = [...band.children];
  const a = about.getBoundingClientRect();
  const c = card.getBoundingClientRect();
  return {
    column: column.getBoundingClientRect(),
    box: box.getBoundingClientRect(),
    grid: grid.getBoundingClientRect(),
    about: a,
    card: c,
    prose: prose.getBoundingClientRect(),
    gap: c.left - a.right,
    rhythm: parseFloat(getComputedStyle(grid).paddingTop),
    rhythmBelow: parseFloat(getComputedStyle(grid).paddingBottom),
    title: fontSize(title),
    eyebrow: fontSize(htmlElement(title.previousElementSibling, 'eyebrow')),
    paragraphs: [...prose.children].map(fontSize),
    cardTitle: fontSize(within(card).getByRole('heading', { level: 2 })),
    days: [...card.querySelectorAll('dt')].map(fontSize),
    fades: [fadeIn, fadeOut].map(
      (fade) => htmlElement(fade, 'fade').getBoundingClientRect().height,
    ),
  };
};

describe('DoctorProfile — THE BAND SCALE, computed (§15.32 round 4 — the real stylesheet)', () => {
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
    // …and the arithmetic the scaled cases rest on: the prose track at the
    // reference is 770 design pixels, under the measure's 896, so the
    // paragraphs' block IS the track at every scaled width.
    expect(PROSE_TRACK).toBe(770);
    expect(PROSE_TRACK).toBeLessThan(MEASURE);
  });

  it.each([
    {
      where: 'a 320 phone’s column, 288px — stacked, the card the column',
      width: 288,
    },
    {
      where: 'a 390 phone’s column, 351px — stacked, the card 320 centred',
      width: 351,
    },
    { where: 'a 768 tablet’s column, 614.4px — stacked', width: 614.4 },
    { where: 'an 880px column — beside, under the step', width: 880 },
  ])(
    'declares NOTHING at $where — the theme’s own lengths, every pixel as before',
    ({ width }) => {
      const scene = renderColumn(width);
      const sizes = sizesOf(scene);
      const beside = width >= 48 * ROOT;

      expect(remapped(scene.box), 'the scale box remaps nothing').toBe(false);
      // The registered property's initial value: nothing declared it.
      expect(getComputedStyle(scene.box).getPropertyValue('--scale-px')).toBe(
        '1px',
      );
      // The box is the column, edge to edge.
      expect(sizes.box.width).toBeCloseTo(width, 1);
      expect(sizes.box.left).toBeCloseTo(sizes.column.left, 1);
      // `band`'s step reads the column against 28rem; the rhythm steps at
      // `@lg` (32rem) and `@3xl` (48rem).
      expect(sizes.title).toBe(width >= 28 * ROOT ? 36 : 30);
      expect(sizes.eyebrow).toBe(14);
      for (const size of sizes.paragraphs) expect(size).toBe(18);
      expect(sizes.cardTitle).toBe(30);
      for (const size of sizes.days) expect(size).toBe(16);
      expect(sizes.rhythm).toBe(beside ? 40 : width >= 32 * ROOT ? 32 : 24);
      expect(sizes.fades).toEqual([FADE, FADE]);

      if (beside) {
        // D53's 20rem and THE PROSE OUTDENT's 2rem, exactly as before.
        expect(sizes.card.width).toBeCloseTo(DESIGN.card, 1);
        expect(sizes.box.left - sizes.grid.left).toBeCloseTo(DESIGN.outdent, 1);
        expect(sizes.grid.right).toBeCloseTo(sizes.box.right, 1);
        expect(sizes.gap).toBeCloseTo(DESIGN.gap, 1);
        return;
      }
      // Stacked: no outdent, the card its 20rem or the column, centred.
      expect(sizes.grid.left).toBeCloseTo(sizes.column.left, 1);
      expect(sizes.card.width).toBeCloseTo(Math.min(DESIGN.card, width), 1);
      expect(sizes.card.left - sizes.grid.left).toBeCloseTo(
        sizes.grid.right - sizes.card.right,
        1,
      );
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
    'draws the WHOLE band in the design pixel at $where — every length × s, capped and centred past 96rem',
    ({ width }) => {
      const scene = renderColumn(width);
      const sizes = sizesOf(scene);
      const band = Math.min(width, CAP);
      const s = band / REFERENCE;

      // THE REGIME: declared on the scale box — and inherited inside it —
      // never on the column around it.
      expect(remapped(scene.box), 'the scale box remaps the theme').toBe(true);
      expect(remapped(scene.grid), 'the grid inherits it').toBe(true);
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

      // THE PROSE OUTDENT, from the scale box's edge, and the card's right
      // edge on the box's — the reason the scale rides a box of its own.
      expect(sizes.box.left - sizes.grid.left, 'the outdent').toBeCloseTo(
        DESIGN.outdent * s,
        1,
      );
      expect(sizes.grid.right, 'the grid’s right edge').toBeCloseTo(
        sizes.box.right,
        1,
      );
      expect(sizes.card.right, 'the card’s right edge').toBeCloseTo(
        sizes.box.right,
        1,
      );
      // D53's one width, in the design's pixels — and the gap, and the prose
      // track the rest: 770 design pixels at every width, under the measure's
      // 896, so the line is the reference's line, drawn larger.
      expect(sizes.card.width, 'the card').toBeCloseTo(DESIGN.card * s, 1);
      expect(sizes.gap, 'the gap').toBeCloseTo(DESIGN.gap * s, 1);
      expect(sizes.about.width, 'the prose track').toBeCloseTo(
        PROSE_TRACK * s,
        1,
      );
      expect(sizes.prose.width, 'the paragraphs’ block').toBeCloseTo(
        PROSE_TRACK * s,
        1,
      );
      // The rhythm, symmetric, × s.
      expect(sizes.rhythm, 'the rhythm').toBeCloseTo(DESIGN.rhythm * s, 1);
      expect(sizes.rhythmBelow).toBeCloseTo(sizes.rhythm, 2);

      // Every word, × s: the opener, the prose, the card.
      expect(sizes.title, 'the „Despre” title').toBeCloseTo(
        DESIGN.title * s,
        2,
      );
      expect(sizes.eyebrow, 'the eyebrow').toBeCloseTo(DESIGN.eyebrow * s, 2);
      expect(sizes.paragraphs).toHaveLength(ABOUT.paragraphs.length);
      for (const size of sizes.paragraphs) {
        expect(size, 'a paragraph').toBeCloseTo(DESIGN.prose * s, 2);
      }
      expect(sizes.cardTitle, 'the card’s title').toBeCloseTo(
        DESIGN.cardTitle * s,
        2,
      );
      expect(sizes.days).toHaveLength(7);
      for (const size of sizes.days) {
        expect(size, 'a day').toBeCloseTo(DESIGN.day * s, 2);
      }

      // D37 holds in the scale: the card's middle on the biography's.
      expect(
        (sizes.card.top + sizes.card.bottom) / 2,
        'the card’s middle',
      ).toBeCloseTo((sizes.about.top + sizes.about.bottom) / 2, 0);

      // RECORDED, NOT SCALED: TintedBand's fades stay 6rem — boxes outside
      // ui/Container, which cannot read the column (DoctorProfile.tsx's WHAT
      // STAYS IN rem).
      expect(sizes.fades).toEqual([FADE, FADE]);
    },
  );
});
