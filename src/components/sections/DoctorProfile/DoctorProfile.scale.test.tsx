import { render, screen, within } from '@testing-library/react';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline — the
// reason this file exists apart from DoctorProfile.test.tsx (the header
// below). tests/setup/components.ts loads no CSS globally; the per-file import
// is the house pattern (Card, Container, ClinicLocation, DoctorShowcase,
// PriceList.scale).
import '@/styles/globals.css';
import { containerClasses } from '@/components/ui/Container/Container';
import { DoctorProfile, type DoctorProfileProps } from './DoctorProfile';

// sections/DoctorProfile — THE BAND SCALE and THE SHARED ROWS, COMPUTED
// (CLAUDE.md §15.32 round 4, §15.23 round 7; DoctorProfile.tsx's paragraphs
// of those names), over the band as it stands since 2026-10-13: the biography
// on three fifths of the row beside the courses on two, on the page ground,
// the two contents starting on one line. The owner, verbatim, on the scale:
// "take current heading and eyebrow from main page. look how reactive and nice
// it is. make the exact same thing with the heading and eyebrow from the
// individual dr page" — and, asked how far, "Whole page, like Home"; and on
// the preview the same evening: "to be like 20% wider" and "the effective text
// and the first dot … to start at same y when they sit next to the other". So
// on a laptop or desktop this band is ONE design, the owner's 1401-window look
// scaled to its column; on every phone and tablet not one pixel may move; and
// beside, at every width, the two contents start level.
//
// ── WHY A FILE OF ITS OWN. DoctorProfile.test.tsx's premise is that NO
// stylesheet is loaded: the utility tokens are its contract, and its pins say
// so (the name's `hyphens-none` is read as a class because a computed value
// would be the browser's default there). The scale and the shared rows, on
// the other hand, are COMPUTED lengths — a class name cannot show a design
// pixel or where a subgrid's row begins — so they need the sheet. One premise
// per file (PriceList.scale.test.tsx's precedent): the class contract stays in
// DoctorProfile.test.tsx, what the engine draws with it lives here, and the
// arrangement at the pinned windows lives in the stories' plays.
//
// ── WHAT IS MEASURED. The band in a box that hands its Container a column of
// exactly `width` px — the gutter read off a probe wearing the real class,
// never assumed (ClinicLocation's and DoctorShowcase's `renderColumn`) — and
// every length read back from the engine. Inside the scale (a mouse or
// trackpad in this runner, a column of max(56rem, 896px)) the design pixel is
// s = min(column, 96rem) / 1106, and every length of the band is its
// reference length × s: both titles 36, both eyebrows 14, a paragraph and a
// course idea 18, the gap between the two columns 48 and the one between the
// two rows 24, the rhythm 80 — and the two columns THREE FIFTHS and TWO of the
// row less the gap, 634.8 and 423.2 design pixels, so the measure of either is
// the reference's at every width. Past a 96rem column the band stops at
// 1536px and centres. Outside the scale — every phone's column, a tablet's, a
// laptop's under the step — nothing is declared and every length is the
// theme's own: stacked below the Container's `@3xl` step (a 64px gap between
// the biography and the courses under it), side by side from it. AND AT EVERY
// WIDTH the courses' dot ring stays 4px: a box shadow in px, the one length in
// the band the design pixel does not redraw.
// THE SHARED ROWS, beside: the first paragraph's top and the first idea's top
// on ONE line, the first dot's centre on that line's centre, whatever either
// title's length — with one-line titles each content 24 × s under its own
// opener, with a title of two lines the OTHER column's content that much lower
// under its own — and THE ITEMS KEEP THEIR HEIGHTS: each region's two
// children hug what they hold, never their row — the courses' list as tall
// as its ideas when the biography is the longer column (the courses' island
// watches that list for its off-screen hold), the paragraphs' block as tall as
// its paragraphs when the courses are. And THE FALLBACK: with the subgrid
// declaration knocked out, as an engine without subgrid drops it, each content
// still stands 24 × s under its own opener.
// THE RAIL IS HELD NEUTRAL: `matchMedia` answers `reduce` for the one query
// lib/reduced-motion asks (every other query reaches the real engine — the
// pointer premise below among them), so sections/DoctorCourses' cycle never
// starts, no idea is lit, and nothing is scaled by the forward motion: every
// box reads where layout put it — the visual net's own state.
// No typeface is loaded and none is needed: a font SIZE, a grid track, a gap
// and a padding do not depend on glyph shapes, and the height-based checks
// compare boxes in one face. Tolerance: a twentieth of a pixel on a box
// (layout rounds to 1/64px), a two-hundredth on a font size (a calc of px,
// never rounded).

/** THE BAND SCALE's numbers, written out (ui/Container's THE BAND SCALE —
 *  their census is tests/unit/design-scale.test.ts): the REFERENCE column,
 *  where a design pixel is a CSS pixel; the CAP and THE STEP in px at this
 *  runner's 16px root (the premise asserts it). Spelled again on purpose: the
 *  census holds the source, these hold what the engine does. */
const REFERENCE = 1106;
const ROOT = 16;
const CAP = 96 * ROOT;
const STEP = Math.max(56 * ROOT, 896);
/** The Container's `@3xl` — where the two columns go side by side. */
const BESIDE = 48 * ROOT;
/** The design pixel at a column: the scale's past THE STEP, 1 under it. */
const unitAt = (width: number): number =>
  width >= STEP ? Math.min(width, CAP) / REFERENCE : 1;

/** The band's own lengths at the reference column — the owner's 1401 window —
 *  in design pixels (DoctorProfile.tsx: `band`'s 36 past its `@md` and
 *  ui/Eyebrow's 14 on both openers, `text-lg` on a paragraph and on an idea,
 *  `@3xl:gap-x-12` and `@3xl:gap-y-6`, `@3xl:py-20`; and, stacked, `gap-16`;
 *  between an opener and its content, both regions' own `gap-6`). */
const DESIGN = {
  title: 36,
  eyebrow: 14,
  prose: 18,
  idea: 18,
  gap: 48,
  rowGap: 24,
  rhythm: 80,
  stackGap: 64,
  openerGap: 24,
} as const;

/** The biography's and the courses' shares of the row less the gap — the
 *  header's THE BIOGRAPHY THREE FIFTHS. */
const BIOGRAPHY_SHARE = 3 / 5;
const COURSES_SHARE = 2 / 5;
/** Each column at the reference, in design pixels: 634.8 and 423.2 — the
 *  biography under the paragraphs' `max-w-4xl` (896), so that cap never binds
 *  beside the courses inside the scale (DoctorProfile.tsx's THE ONE LEVER ON
 *  THE MEASURE). */
const BIOGRAPHY = (REFERENCE - DESIGN.gap) * BIOGRAPHY_SHARE;
const COURSES_COLUMN = (REFERENCE - DESIGN.gap) * COURSES_SHARE;
const MEASURE = 896;

/** The ring every course dot wears, in px at every width and every scale. */
const RING = 4;

/** A short Romanian biography and five courses (§15.7), factual and
 *  CMSR-clean, drafted for this suite — never lib/team's words, so a data edit
 *  moves no number here. */
const ABOUT = {
  eyebrow: 'Biografie',
  title: 'Despre Dr. Elena Marin',
  paragraphs: [
    'Dr. Elena Marin este medic specialist în ortodonție și lucrează în clinica noastră din 2015. Tratează copii, adolescenți și adulți, cu aparate fixe sau cu gutiere transparente, după caz.',
    'La prima consultație ascultă ce își dorește pacientul, apoi face examenul clinic și cere radiografiile necesare. Planul de tratament se stabilește împreună, după ce toate întrebările au primit un răspuns.',
    'Fiecare etapă este explicată înainte de a începe, cu durata estimată și costul ei. Între ședințe, pacientul poate suna la clinică pentru orice nelămurire legată de tratament.',
  ],
} as const;

// ── THE TITLES THE SHARED-ROWS CASES CHOOSE. No webfont reaches this runner,
// so a title is set in the platform's default serif — Times on a Mac, a wider
// face on the Linux CI runner — and how many lines a title of ordinary length
// takes is the face's business. So the cases that need a premise about lines
// pick titles whose line count holds in ANY face: 14 and 7 characters take
// ONE line in the narrowest beside columns (433px and 289px at a 770px
// column) even at 0.6em a character, and 55 and 52 characters take at least
// TWO in the widest (634.8 and 423.2 design pixels at 36) even at 0.4em. The
// main cases keep the everyday fixture and assert the shared rows whatever
// either title does.
/** One line, in any face, in every beside column — the short-name fixture. */
const SHORT_NAME = 'Despre Dr. Pop';
/** One line, in any face, in every beside column. */
const SHORT_COURSES_TITLE = 'Cursuri';
/** At least TWO lines of the biography's title beside the courses — the
 *  owner's case („Despre Dr. Malea (Sabău) Oana Bianca"), with an invented
 *  name long enough to wrap in any face. */
const LONG_NAME = 'Despre Dr. Ana-Maria (Popescu-Ionescu) Elena Ecaterina';
/** At least TWO lines of the courses' title — the other direction: the
 *  courses' opener the taller. */
const LONG_COURSES_TITLE =
  'Cursuri, specializări și alte repere din drumul profesional';

const COURSES = {
  eyebrow: 'Repere din drumul meu spre specializare',
  title: 'Cursuri și specializări',
  items: [
    'Curs de reabilitare protetică pe implanturi, București',
    'Curs de ortodonție digitală și scanare intraorală, Cluj-Napoca',
    'Curs de ortodonție interceptivă la copii, Timișoara',
    'Curs de aliniere dentară cu gutiere transparente, Iași',
    'Specializare în ortodonție și ortopedie dento-facială',
  ],
} as const satisfies DoctorProfileProps['courses'];

/** The one query lib/reduced-motion asks. */
const REDUCE = '(prefers-reduced-motion: reduce)';

/**
 * THE RAIL HELD NEUTRAL (the header): `matchMedia` answers `reduce` for the
 * reduced-motion query and hands every other query to the real engine.
 */
const holdTheRail = (): void => {
  const real = window.matchMedia.bind(window);
  vi.stubGlobal('matchMedia', (query: string): MediaQueryList => {
    if (query !== REDUCE) return real(query);
    const list: Partial<MediaQueryList> = {
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    };
    return list as MediaQueryList;
  });
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

/** The widest spread among an element's computed box shadows, in px — a
 *  ring utility composes a `0 0 0 N` shadow into the list, beside the
 *  transparent `0 0 0 0` placeholders Tailwind keeps for the shadows the
 *  element does not wear (so 0 for an element with no ring at all). */
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

/** The band, Romanian, in a box whose Container gets a `width` px column —
 *  every box found from the biography's region up, by structure (paint and
 *  layout carry no role) — and the premise every number rests on, checked
 *  first. `courses` is the band's prop: with no items there is no second
 *  column at all; `title` is the biography's. */
const renderColumn = (
  width: number,
  {
    courses = COURSES,
    title = ABOUT.title,
    paragraphs = ABOUT.paragraphs,
  }: Readonly<{
    courses?: DoctorProfileProps['courses'];
    title?: string;
    paragraphs?: readonly string[];
  }> = {},
) => {
  render(
    <div style={{ width: `${width + 2 * gutter()}px` }}>
      <DoctorProfile
        about={{ ...ABOUT, title, paragraphs }}
        courses={courses}
      />
    </div>,
  );
  const about = screen.getByRole('region', { name: title });
  const grid = htmlElement(about.parentElement, 'grid');
  const box = htmlElement(grid.parentElement, 'rhythm box');
  const column = htmlElement(box.parentElement, 'ui/Container column');
  const band = htmlElement(column.parentElement, 'band');
  const coursesRegion = screen.queryByRole('region', { name: courses.title });
  expect(column.getBoundingClientRect().width, 'the column').toBeCloseTo(
    width,
    1,
  );
  return { band, column, box, grid, about, courses: coursesRegion };
};

type Scene = ReturnType<typeof renderColumn>;

/** An opener's two sizes — its <h2> and the eyebrow over it. */
const openerOf = (region: HTMLElement) => {
  const title = within(region).getByRole('heading', { level: 2 });
  return {
    title: fontSize(title),
    eyebrow: fontSize(htmlElement(title.previousElementSibling, 'eyebrow')),
  };
};

/**
 * Where an opener's words stand: its eyebrow's top, its title's bottom, the
 * height the two take together and the title's LINES (its height over its own
 * line box) — read off the eyebrow and the <h2>, the words themselves.
 */
const wordsOf = (region: HTMLElement) => {
  const heading = within(region).getByRole('heading', { level: 2 });
  const title = heading.getBoundingClientRect();
  const eyebrow = htmlElement(
    heading.previousElementSibling,
    'eyebrow',
  ).getBoundingClientRect();
  return {
    top: eyebrow.top,
    titleBottom: title.bottom,
    height: title.bottom - eyebrow.top,
    lines: Math.round(
      title.height / parseFloat(getComputedStyle(heading).lineHeight),
    ),
  };
};

/**
 * THE FIRST LINES — where each column's content begins: the first paragraph's
 * first line box (the <p>'s top; its line box is `text-lg`'s 28 × s) and its
 * centre, the first idea's <li> and the centre of the dot on its first line.
 * The rail is NEUTRAL here (the header), so the <li> and the dot are drawn
 * where layout put them.
 */
const firstLinesOf = (about: HTMLElement, courses: HTMLElement) => {
  const prose = htmlElement(about.lastElementChild, 'paragraphs’ block');
  const paragraph = htmlElement(prose.firstElementChild, 'first paragraph');
  const idea = htmlElement(
    within(courses).getAllByRole('listitem')[0],
    'first idea',
  );
  const dot = htmlElement(
    [...idea.querySelectorAll('*')].find((element) => ringSpread(element) > 0),
    'first dot',
  );
  const p = paragraph.getBoundingClientRect();
  const d = dot.getBoundingClientRect();
  return {
    paragraphTop: p.top,
    lineCentre: p.top + parseFloat(getComputedStyle(paragraph).lineHeight) / 2,
    ideaTop: idea.getBoundingClientRect().top,
    listTop: within(courses).getByRole('list').getBoundingClientRect().top,
    dotCentre: d.top + d.height / 2,
    lit: idea.hasAttribute('data-current'),
  };
};

/**
 * The height a flex column's children take, with its gaps — what the box
 * HUGS when nothing stretches it (SectionHeading's root, the paragraphs'
 * block, the courses' list: each a flex column; a trail drawn absolutely
 * inside the last idea is no child of the list and adds nothing).
 */
const contentHeightOf = (box: HTMLElement): number => {
  const children = [...box.children];
  const gap = parseFloat(getComputedStyle(box).rowGap) || 0;
  return (
    children.reduce(
      (sum, child) => sum + child.getBoundingClientRect().height,
      0,
    ) +
    Math.max(0, children.length - 1) * gap
  );
};

/**
 * THE SHARED ROWS, asserted beside at the unit `s`: the two contents level —
 * the first paragraph's top on the first idea's, the first dot's centre on the
 * first line's — both eyebrows on one line, and the contents 24 × s under the
 * TALLER opener's words, so the shorter opener's content stands lower under
 * its own words by exactly the difference. AND THE ITEMS KEEP THEIR HEIGHTS:
 * each region's two children — its opener, its content — hug what they hold
 * instead of stretching to their row (`@3xl:items-start`). Returns the two
 * titles' line counts, so a case can assert its own premise.
 */
const expectSharedRows = (
  scene: Scene,
  s: number,
): { about: number; courses: number } => {
  const courses = htmlElement(scene.courses, 'courses region');
  // Both regions really adopt the band's two rows — a subgrid, not a
  // look-alike (Chromium reports the keyword and the adopted lines).
  for (const region of [scene.about, courses]) {
    expect(getComputedStyle(region).display, 'a region beside').toBe('grid');
    expect(getComputedStyle(region).gridTemplateRows).toMatch(/^subgrid\b/);
  }
  expect(
    parseFloat(getComputedStyle(scene.grid).rowGap),
    'the row gap',
  ).toBeCloseTo(DESIGN.rowGap * s, 1);

  const lines = firstLinesOf(scene.about, courses);
  expect(lines.lit, 'the rail is neutral').toBe(false);
  expect(
    Math.abs(lines.ideaTop - lines.listTop),
    'the idea opens the list',
  ).toBeLessThanOrEqual(0.05);
  expect(
    Math.abs(lines.ideaTop - lines.paragraphTop),
    `the first idea’s top ${lines.ideaTop} against the first paragraph’s ${lines.paragraphTop}`,
  ).toBeLessThanOrEqual(0.05);
  expect(
    Math.abs(lines.dotCentre - lines.lineCentre),
    `the first dot’s centre ${lines.dotCentre} against the first line’s ${lines.lineCentre}`,
  ).toBeLessThanOrEqual(0.05);

  const a = wordsOf(scene.about);
  const c = wordsOf(courses);
  expect(Math.abs(a.top - c.top), 'the two eyebrows').toBeLessThanOrEqual(0.05);
  const taller = Math.max(a.height, c.height);
  expect(
    Math.abs(lines.paragraphTop - (a.top + taller + DESIGN.openerGap * s)),
    'the contents 24 × s under the taller opener',
  ).toBeLessThanOrEqual(0.05);
  // Each content under its OWN words: 24 × s plus whatever the other
  // opener is taller by.
  expect(lines.paragraphTop - a.titleBottom).toBeCloseTo(
    DESIGN.openerGap * s + (taller - a.height),
    1,
  );
  expect(lines.listTop - c.titleBottom).toBeCloseTo(
    DESIGN.openerGap * s + (taller - c.height),
    1,
  );
  // THE ITEMS KEEP THEIR HEIGHTS: an opener as tall as its words, a content
  // box as tall as its paragraphs or its ideas — never the row's height.
  for (const region of [scene.about, courses]) {
    expect(region.children, 'a region’s two children').toHaveLength(2);
    for (const child of region.children) {
      const box = htmlElement(child, 'a region’s child');
      expect(
        box.getBoundingClientRect().height,
        `${box.tagName} in ${region.getAttribute('aria-labelledby') ?? ''}`,
      ).toBeCloseTo(contentHeightOf(box), 1);
    }
  }
  return { about: a.lines, courses: c.lines };
};

/** What the band draws with its courses, read from the engine. */
const sizesOf = (scene: Scene) => {
  const { column, box, grid, about } = scene;
  const courses = htmlElement(scene.courses, 'courses region');
  const prose = htmlElement(about.lastElementChild, 'paragraphs’ block');
  const a = about.getBoundingClientRect();
  const c = courses.getBoundingClientRect();
  return {
    column: column.getBoundingClientRect(),
    box: box.getBoundingClientRect(),
    about: a,
    courses: c,
    prose: prose.getBoundingClientRect(),
    gap: c.left - a.right,
    stackGap: c.top - a.bottom,
    rhythm: parseFloat(getComputedStyle(box).paddingTop),
    rhythmBelow: parseFloat(getComputedStyle(box).paddingBottom),
    gridGap: parseFloat(getComputedStyle(grid).columnGap),
    biography: openerOf(about),
    coursesOpener: openerOf(courses),
    paragraphs: [...prose.children].map(fontSize),
    ideas: within(courses).getAllByRole('listitem').map(fontSize),
    // Every ringed element of the courses — one dot per idea.
    rings: [...courses.querySelectorAll('*')]
      .map(ringSpread)
      .filter((spread) => spread > 0),
  };
};

describe('DoctorProfile — THE BAND SCALE and THE SHARED ROWS, computed', () => {
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
      CSS.supports('grid-template-rows', 'subgrid'),
      'the engine draws subgrids (THE FALLBACK case knocks the declaration out by hand)',
    ).toBe(true);
    expect(
      parseFloat(getComputedStyle(document.documentElement).fontSize),
      'the default 16px root',
    ).toBe(ROOT);
    // …and the arithmetic the scaled cases rest on: the biography at the
    // reference is 634.8 design pixels and the courses 423.2 — 3 : 2 — the
    // biography under the measure's 896, so the paragraphs' block IS its
    // column at every scaled width.
    expect(BIOGRAPHY).toBeCloseTo(634.8, 6);
    expect(COURSES_COLUMN).toBeCloseTo(423.2, 6);
    expect(BIOGRAPHY / COURSES_COLUMN).toBeCloseTo(1.5, 9);
    expect(BIOGRAPHY).toBeLessThan(MEASURE);
  });

  beforeEach(() => holdTheRail());
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    {
      where:
        'a 320 phone’s column, 288px — stacked, the biography over the courses',
      width: 288,
    },
    {
      where: 'a 390 phone’s column, 351px — stacked',
      width: 351,
    },
    { where: 'a 768 tablet’s column, 614.4px — stacked', width: 614.4 },
    {
      where: 'a 770px column — side by side, just past the `@3xl` step',
      width: 770,
    },
    {
      where: 'an 880px column — side by side, under the scale’s step',
      width: 880,
    },
  ])(
    'declares NOTHING at $where — the theme’s own lengths, every pixel as the theme draws it',
    ({ width }) => {
      const scene = renderColumn(width);
      const sizes = sizesOf(scene);
      const beside = width >= BESIDE;

      expect(remapped(scene.box), 'the rhythm box remaps nothing').toBe(false);
      // The registered property's initial value: nothing declared it.
      expect(getComputedStyle(scene.box).getPropertyValue('--scale-px')).toBe(
        '1px',
      );
      // The rhythm box is the column, edge to edge.
      expect(sizes.box.width).toBeCloseTo(width, 1);
      expect(sizes.box.left).toBeCloseTo(sizes.column.left, 1);
      // `band`'s step reads ui/Container's column against 28rem — for BOTH
      // titles, the courses' included (its block is no container) — so the
      // two openers are one size at every width; the rhythm steps at `@lg`
      // (32rem) and `@3xl` (48rem).
      const title = width >= 28 * ROOT ? 36 : 30;
      for (const opener of [sizes.biography, sizes.coursesOpener]) {
        expect(opener.title).toBe(title);
        expect(opener.eyebrow).toBe(14);
      }
      expect(sizes.paragraphs).toHaveLength(ABOUT.paragraphs.length);
      for (const size of sizes.paragraphs) expect(size).toBe(18);
      expect(sizes.ideas).toHaveLength(COURSES.items.length);
      for (const size of sizes.ideas) expect(size).toBe(18);
      expect(sizes.rhythm).toBe(beside ? 80 : width >= 32 * ROOT ? 64 : 48);
      expect(sizes.rhythmBelow).toBe(sizes.rhythm);
      // The ring: 4px, one on every idea's dot.
      expect(sizes.rings).toEqual(COURSES.items.map(() => RING));

      if (beside) {
        // THREE FIFTHS AND TWO, 48px apart, on the shared rows.
        const row = width - DESIGN.gap;
        expect(sizes.gridGap).toBe(DESIGN.gap);
        expect(sizes.gap).toBeCloseTo(DESIGN.gap, 1);
        expect(sizes.about.width).toBeCloseTo(row * BIOGRAPHY_SHARE, 1);
        expect(sizes.courses.width).toBeCloseTo(row * COURSES_SHARE, 1);
        expect(sizes.about.width / sizes.courses.width).toBeCloseTo(1.5, 3);
        expect(sizes.about.left).toBeCloseTo(sizes.box.left, 1);
        expect(sizes.courses.right).toBeCloseTo(sizes.box.right, 1);
        expect(sizes.courses.top).toBeCloseTo(sizes.about.top, 1);
        // THE SHARED ROWS, whatever either title does in this face.
        expectSharedRows(scene, 1);
        return;
      }
      // Stacked: one column, the biography over the courses, 64px between,
      // both the column's own width on its own left edge — and both plain
      // flex columns: the shared rows are a `@3xl` arrangement.
      expect(sizes.stackGap).toBeCloseTo(DESIGN.stackGap, 1);
      for (const rect of [sizes.about, sizes.courses]) {
        expect(rect.width).toBeCloseTo(width, 1);
        expect(rect.left).toBeCloseTo(sizes.column.left, 1);
      }
      for (const region of [
        scene.about,
        htmlElement(scene.courses, 'courses region'),
      ]) {
        expect(getComputedStyle(region).display).toBe('flex');
      }
    },
  );

  it.each([
    // Just past the step — not ON it: the column is set through a box and a
    // gutter, and a sixty-fourth of a pixel under 896 would read as "under".
    { where: 'a column just past the step, 900px', width: STEP + 4 },
    {
      where:
        'a 1280 window’s column beside a classic scrollbar — 1280 − 15 − 2 × 128 = 1009px',
      width: 1009,
    },
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

      // THE REGIME: declared on the rhythm box — and inherited inside it, by
      // the courses too — never on the column around it.
      expect(remapped(scene.box), 'the rhythm box remaps the theme').toBe(true);
      expect(remapped(scene.grid), 'the grid inherits it').toBe(true);
      expect(
        remapped(htmlElement(scene.courses, 'courses')),
        'the courses inherit it',
      ).toBe(true);
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

      // THREE FIFTHS AND TWO: 634.8 and 423.2 design pixels — the biography
      // 1.5 × the courses — the biography on the band's left edge, the
      // courses ending on its right, the gap between; both on the row's top.
      const gap = DESIGN.gap * s;
      expect(sizes.gridGap, 'the column gap').toBeCloseTo(gap, 1);
      expect(sizes.gap, 'the gap').toBeCloseTo(gap, 1);
      expect(sizes.about.width, 'the biography').toBeCloseTo(BIOGRAPHY * s, 1);
      expect(sizes.courses.width, 'the courses').toBeCloseTo(
        COURSES_COLUMN * s,
        1,
      );
      expect(sizes.about.width / sizes.courses.width, '3 : 2').toBeCloseTo(
        1.5,
        3,
      );
      expect(sizes.about.left, 'the biography’s left edge').toBeCloseTo(
        sizes.box.left,
        1,
      );
      expect(sizes.courses.left, 'the courses’ left edge').toBeCloseTo(
        sizes.about.right + gap,
        1,
      );
      expect(sizes.courses.right, 'the courses’ right edge').toBeCloseTo(
        sizes.box.right,
        1,
      );
      expect(sizes.courses.top, 'the two tops').toBeCloseTo(sizes.about.top, 1);
      // The measure: the paragraphs' block IS the biography's column —
      // `max-w-4xl` (896 design pixels) never binds beside the courses.
      expect(sizes.prose.width, 'the paragraphs’ block').toBeCloseTo(
        BIOGRAPHY * s,
        1,
      );
      // The rhythm, symmetric, × s.
      expect(sizes.rhythm, 'the rhythm').toBeCloseTo(DESIGN.rhythm * s, 1);
      expect(sizes.rhythmBelow).toBeCloseTo(sizes.rhythm, 2);

      // Every word, × s: both openers one size, every paragraph and every
      // idea one size.
      for (const [name, opener] of [
        ['the biography', sizes.biography],
        ['the courses', sizes.coursesOpener],
      ] as const) {
        expect(opener.title, `${name}’s title`).toBeCloseTo(
          DESIGN.title * s,
          2,
        );
        expect(opener.eyebrow, `${name}’s eyebrow`).toBeCloseTo(
          DESIGN.eyebrow * s,
          2,
        );
      }
      expect(sizes.paragraphs).toHaveLength(ABOUT.paragraphs.length);
      for (const size of sizes.paragraphs) {
        expect(size, 'a paragraph').toBeCloseTo(DESIGN.prose * s, 2);
      }
      expect(sizes.ideas).toHaveLength(COURSES.items.length);
      for (const size of sizes.ideas) {
        expect(size, 'a course idea').toBeCloseTo(DESIGN.idea * s, 2);
      }

      // THE SHARED ROWS, × s, whatever either title does in this face.
      expectSharedRows(scene, s);

      // RECORDED, NOT SCALED: the courses' dot ring, a 4px box shadow at
      // every s — the one px length in the band — one on every idea's dot.
      expect(sizes.rings, 'the rings').toEqual(COURSES.items.map(() => RING));
    },
  );

  it.each([
    { where: 'a 770px column, unscaled', width: 770 },
    { where: 'an 880px column, unscaled', width: 880 },
    { where: 'a column just past the scale’s step', width: STEP + 4 },
    { where: 'the reference column', width: REFERENCE },
    { where: 'a 1920 window’s column', width: 1521 },
    { where: 'a column past the cap', width: 2000 },
  ])(
    'moves NOTHING when both titles take one line, at $where — each content 24 × s under its own opener, the two level (the short-name fixture)',
    ({ width }) => {
      const scene = renderColumn(width, {
        title: SHORT_NAME,
        courses: { ...COURSES, title: SHORT_COURSES_TITLE },
      });
      const lines = expectSharedRows(scene, unitAt(width));
      // THE PREMISE: one line each, so row 1 is each opener's own height.
      expect(lines).toEqual({ about: 1, courses: 1 });
    },
  );

  it.each([
    { where: 'an 880px column, unscaled', width: 880 },
    { where: 'a 1280 window’s column', width: 1009 },
    { where: 'the reference column', width: REFERENCE },
    { where: 'a 1920 window’s column', width: 1521 },
  ])(
    'starts the two contents LEVEL under a two-line biography title at $where — the courses’ ideas lower under their own opener by the name’s extra lines (the owner’s case)',
    ({ width }) => {
      const scene = renderColumn(width, {
        title: LONG_NAME,
        courses: { ...COURSES, title: SHORT_COURSES_TITLE },
      });
      const lines = expectSharedRows(scene, unitAt(width));
      // THE PREMISE, so the case is not one-line titles twice: the name took
      // more lines than the courses' title.
      expect(lines.courses).toBe(1);
      expect(lines.about).toBeGreaterThanOrEqual(2);
    },
  );

  it.each([
    { where: 'an 880px column, unscaled', width: 880 },
    { where: 'the reference column', width: REFERENCE },
  ])(
    'starts the two contents LEVEL under a two-line COURSES title at $where — the other direction, the paragraphs lower under their own opener',
    ({ width }) => {
      const scene = renderColumn(width, {
        title: SHORT_NAME,
        courses: { ...COURSES, title: LONG_COURSES_TITLE },
      });
      const lines = expectSharedRows(scene, unitAt(width));
      expect(lines.about).toBe(1);
      expect(lines.courses).toBeGreaterThanOrEqual(2);
    },
  );

  it.each([
    { where: 'an 880px column, unscaled', width: 880 },
    { where: 'the reference column', width: REFERENCE },
    { where: 'a 1920 window’s column', width: 1521 },
  ])(
    'keeps the courses’ list its OWN height when the biography is the longer column, at $where (THE ITEMS KEEP THEIR HEIGHTS — the off-screen hold watches that list)',
    ({ width }) => {
      // Three paragraphs beside two ideas: row 2 is the biography's.
      const scene = renderColumn(width, {
        courses: { ...COURSES, items: COURSES.items.slice(0, 2) },
      });
      const s = unitAt(width);
      expectSharedRows(scene, s);
      const courses = htmlElement(scene.courses, 'courses region');
      const list = within(courses).getByRole('list');
      const prose = htmlElement(
        scene.about.lastElementChild,
        'paragraphs’ block',
      );
      const listHeight = list.getBoundingClientRect().height;
      // THE PREMISE, so the pin is not vacuous: the row is far taller than
      // the ideas — a stretched list would have been the row's height.
      expect(prose.getBoundingClientRect().height).toBeGreaterThan(
        contentHeightOf(list) + 100 * s,
      );
      // The list hugs its ideas: the island's off-screen hold watches a box
      // that ends where the last idea does.
      expect(listHeight).toBeCloseTo(contentHeightOf(list), 1);
      expect(
        listHeight,
        'the list ends well above the paragraphs’ end',
      ).toBeLessThan(prose.getBoundingClientRect().height - 100 * s);
    },
  );

  it.each([
    { where: 'an 880px column, unscaled', width: 880 },
    { where: 'the reference column', width: REFERENCE },
  ])(
    'keeps the paragraphs’ block its OWN height when the courses are the longer column, at $where (THE ITEMS KEEP THEIR HEIGHTS, the other direction)',
    ({ width }) => {
      // One short paragraph beside five ideas: row 2 is the courses'.
      const scene = renderColumn(width, { paragraphs: [ABOUT.paragraphs[0]] });
      const s = unitAt(width);
      expectSharedRows(scene, s);
      const list = within(
        htmlElement(scene.courses, 'courses region'),
      ).getByRole('list');
      const prose = htmlElement(
        scene.about.lastElementChild,
        'paragraphs’ block',
      );
      expect(list.getBoundingClientRect().height).toBeGreaterThan(
        contentHeightOf(prose) + 100 * s,
      );
      expect(prose.getBoundingClientRect().height).toBeCloseTo(
        contentHeightOf(prose),
        1,
      );
    },
  );

  it.each([
    { where: 'an 880px column, unscaled', width: 880 },
    { where: 'the reference column', width: REFERENCE },
  ])(
    'falls back to each content under its OWN opener where subgrid is missing, at $where (THE FALLBACK — `@3xl:content-start`)',
    ({ width }) => {
      // An engine without subgrid DROPS the declaration; knocking it out
      // inline is that engine's computed style in this one.
      const scene = renderColumn(width, {
        title: LONG_NAME,
        courses: { ...COURSES, title: SHORT_COURSES_TITLE },
      });
      const courses = htmlElement(scene.courses, 'courses region');
      for (const region of [scene.about, courses]) {
        region.style.gridTemplateRows = 'none';
        expect(getComputedStyle(region).gridTemplateRows).not.toMatch(
          /subgrid/,
        );
      }
      const s = unitAt(width);
      const lines = firstLinesOf(scene.about, courses);
      const a = wordsOf(scene.about);
      const c = wordsOf(courses);
      // Each content 24 × s under its own title — the layout before the
      // subgrid — and so, with a two-line name, NOT level with the other.
      expect(lines.paragraphTop - a.titleBottom).toBeCloseTo(
        DESIGN.openerGap * s,
        1,
      );
      expect(lines.listTop - c.titleBottom).toBeCloseTo(
        DESIGN.openerGap * s,
        1,
      );
      expect(lines.paragraphTop - lines.listTop).toBeGreaterThan(10 * s);
      // …and the band is as tall as the taller region, the shorter one
      // stretched to it — which is what `@3xl:content-start` keeps out of
      // its rows.
      expect(scene.about.getBoundingClientRect().height).toBeCloseTo(
        courses.getBoundingClientRect().height,
        1,
      );
    },
  );

  it.each([
    { where: 'a 768 tablet’s column, 614.4px — unscaled', width: 614.4 },
    { where: 'an 880px column — unscaled, past the step', width: 880 },
    { where: 'the reference column, 1106px', width: REFERENCE },
    { where: 'a column past the cap, 2000px', width: 2000 },
  ])(
    'with NO courses: the biography alone in ONE column at $where — `max-w-4xl` its measure, a plain flex column',
    ({ width }) => {
      const scene = renderColumn(width, {
        courses: { ...COURSES, items: [] },
      });
      const scaled = width >= STEP;
      const s = unitAt(width);
      const box = scene.box.getBoundingClientRect();
      const about = scene.about.getBoundingClientRect();
      const prose = htmlElement(
        scene.about.lastElementChild,
        'paragraphs’ block',
      ).getBoundingClientRect();

      expect(scene.courses).toBeNull();
      expect(scene.grid.children).toHaveLength(1);
      expect(remapped(scene.box)).toBe(scaled);
      // No shared rows to adopt: the region stays a flex column.
      expect(getComputedStyle(scene.about).display).toBe('flex');
      // The biography takes the whole row — never three fifths of it beside
      // nothing.
      expect(about.width, 'the biography').toBeCloseTo(box.width, 1);
      // The paragraphs stop at 56rem — 896 design pixels in the scale.
      expect(prose.width, 'the measure').toBeCloseTo(
        Math.min(box.width, MEASURE * s),
        1,
      );
    },
  );
});
