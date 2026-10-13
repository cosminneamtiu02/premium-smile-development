import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Keywords, type KeywordSegment } from '@/components/ui/Keyword/Keyword';
import { DoctorProfile } from './DoctorProfile';

// The doctor page's third band — the biography beside the courses and
// specialisations, on the page ground (2026-10-13, CLAUDE.md §15.23 round 7;
// reworked the same evening on the owner's pack feedback: the biography on
// three fifths of the row, the two contents starting on one line, the
// paragraphs in the credo card's grey with their key words) — in SEVEN
// stories: the everyday picture at the laptop width (the two columns side by
// side, the whole band drawn in THE BAND SCALE), the notebook width with the
// biography the longer column (workbench only), the stacked arrangement a
// phone gets, the 320 stress width, the two expansion stresses (German,
// pseudo) and the biography alone, for a doctor with no courses yet. The
// export NAMES are load-bearing — each one names a baseline file
// (`sections-doctorprofile--default`, `sections-doctorprofile--smartphone`, …),
// so renaming or adding an export re-records pictures; this list IS the
// section's contribution to the visual manifest. The `Sections/*` title prefix
// routes every one of them to 390 + 1536 (tests/visual/stories.spec.ts, §13);
// the 'stress-320' tag adds the accessibility width to the three whose layout
// has something to say there (18px prose and course lines 288px wide on a 320
// phone, a German compound, a 40%-expanded heading); 'no-visual' keeps the
// notebook out of the net, whose two widths would only repeat Default's and
// Smartphone's frames (DoctorShowcase's Notebook precedent).
//
// ── EVERY STORY PINS ITS OWN LANGUAGE AND ITS OWN VIEWPORT with per-story
// `globals`, and both halves are load-bearing:
//   · the locale pin, even though this band reads no message file (its strings
//     are props, §8.1 — the doctor page owns the data): the preview decorator
//     stamps `<html lang>` from that global, and `hyphens: auto` (§15.14) picks
//     its dictionary from the declared language — which is the whole subject of
//     the German story, where a compound in a narrow column either breaks at a
//     syllable or pushes the layout open. Flip the toolbar to Pseudo over any
//     story here and nothing changes: that is the §8.9 sweep PASSING, and the
//     reason the pseudo stress below is typed out as a fixture instead of being
//     produced by the toolbar (the SectionHeading/PersonnelCard precedent);
//   · the viewport pin, because this band CHANGES SHAPE with the column it is
//     given: the biography and the courses sit side by side from `@3xl` = 48rem
//     of CONTAINER width, i.e. a ~960px window — the owner's adaptability rule,
//     beside on the wide step and one above the other below it. The Vitest
//     runner applies the pin; the visual runner ignores it and sets its own
//     page size per project — which is exactly why every geometry assertion
//     below DERIVES its branch from the measured column instead of assuming
//     the pinned width (the PersonnelCard `sitsBeside` idiom), while a story
//     pinned to a phone additionally proves it really took the stacked branch
//     there.
//
// ── `layout: 'fullscreen'` is load-bearing: the band is full-bleed and owns
// its own gutter clamp through ui/Container, so Storybook's default 1rem canvas
// padding would add a second inset on top of it.
//
// ── WHAT THE PLAYS MEASURE, and why it has to be here: none of it survives in
// DoctorProfile.test.tsx, because this project loads no stylesheet in the
// components runner. The arrangement — at the step the biography on THREE
// FIFTHS of the row and the courses on TWO, 48 apart, both starting at the
// top, the two regions SHARING the band's two rows, so the first paragraph's
// first line and the first idea's first line — and its dot — stand on one y,
// and every box in the two rows keeps its own height; one column below it,
// the biography over the courses, 64 apart; the biography alone across the
// row when there are no courses — THE BAND SCALE where the play finds itself,
// and the absence of any sideways scroll all live in the stories' play
// functions. And one fact of the composed courses: their FIRST IDEA IS LIT
// after mount (sections/DoctorCourses' island lights idea 1 one render after
// mount and holds it while the rail is off screen) — EXCEPT under reduced
// motion, where nothing is ever lit. The Vitest storybook project runs with
// motion allowed; the visual net runs with `reducedMotion: 'reduce'`
// (playwright.config.ts), so every frame it records is the NEUTRAL rail —
// nothing lit, nothing faded — and every play below asserts whichever of the
// two its runner gives it. Because the lit idea is drawn larger — the forward
// motion's `scale` from its left edge — the level-start check reads LAYOUT,
// never the drawn box: the first idea's top is the list's own top (the list is
// never transformed), its dot's centre that top plus the dot's own `top` and
// half its height, and only where nothing moves them (the neutral rail) are
// the drawn boxes read as well.
//
// ── THE BAND SCALE (CLAUDE.md §15.32 round 4 — the component header's
// paragraph of that name): on a laptop or desktop the whole band is ONE
// design, its every length the owner's 1401-window length × the design
// pixel. Every play reads it where it finds itself (`scaleOf`): the regime
// derived from the BROWSER — a fine primary pointer, an engine that registers
// custom properties, ui/Container's column at max(56rem, 896px) — never from
// the pin, and the rhythm box's own declaration read beside the derivation,
// so the two must agree (`expectBandScale`, ClinicLocation.stories' shape).
// Every geometric expectation is then written in that unit — the gap's 48,
// the stack's 64, both titles' 36 (30 on a column under 28rem), the eyebrows'
// 14, the prose's and the ideas' 18 — which is a sixteenth of a rem outside the
// scale, so the phone pins (outside it) assert the theme's own numbers: the
// proof that nothing moved there. `Default`'s laptop pin is INSIDE the scale in
// the Vitest runner (a 1536 window under its 15px classic scrollbar: a
// 1213.8px column, s ≈ 1.0975), and the visual net's 1536 frame of every story
// is too.
//
// Demo copy is INVENTED (no real doctor, no real clinic history): Romanian with
// diacritics (§15.7), third-person and factual — no superlatives, no promises,
// no result guarantees (CMSR advertising rules for dental practices, in force
// since 2025-07-01) — and D-DASH-clean. The real doctors, in five languages,
// are the owner's to author (§15.17).

// ── FIXTURES ───────────────────────────────────────────────────────────────

/** The biography's opener — the page's `team.doctor.about` pair, in
 *  Romanian. */
const ELENA_HEADING = {
  eyebrow: 'Biografie',
  title: 'Despre Dr. Elena Marin',
};

/**
 * Three third-person paragraphs, CUT the way the doctor page cuts lib/team's
 * `<k>…</k>` marks before ui/Keyword's <Keywords> renders them — two key
 * words each, as the real drafts carry. SPELLED HERE rather than read from
 * lib/team (DoctorIntro.stories' precedent): a story that read the data
 * module would re-photograph every time a doctor's words were edited, and the
 * band never sees lib/team either — the page cuts the words and hands the
 * finished nodes over (the component header's THE INK). Drafted for the
 * workbench at roughly the length of the real drafts (~400 characters each;
 * the words are the plain fixture's, unchanged — only the marks are new); the
 * key words are plain nouns, the sentence complete without them (ui/
 * Keyword's THREE LIMITS: salience, never information). Beside the six
 * courses, on three fifths of the row against their two, the COURSES run the
 * longer column — by ~51px at the notebook pin and ~62px at the laptop's,
 * measured (the paragraphs 437.7 / 526.6px, the list 488.8 / 588.1) — so the
 * Default frame shows the two contents starting level and ending apart; the
 * Notebook story keeps three of the ideas for the other case.
 */
const ELENA_SEGMENTS: readonly (readonly KeywordSegment[])[] = [
  [
    { text: 'Dr. Elena Marin este medic specialist în ', keyword: false },
    { text: 'ortodonție', keyword: true },
    {
      text: ' și lucrează în clinica noastră din 2015. Tratează copii, adolescenți și adulți, cu aparate dentare fixe sau cu gutiere transparente, în funcție de ce arată examinarea. La fiecare control verifică evoluția tratamentului și notează în fișă schimbările față de vizita anterioară. La sfârșitul fiecărei vizite, pacientul primește un ',
      keyword: false,
    },
    { text: 'rezumat scris', keyword: true },
    { text: ' al observațiilor și al pașilor următori.', keyword: false },
  ],
  [
    {
      text: 'La prima consultație ascultă ce își dorește pacientul, apoi face examenul clinic și cere radiografiile necesare. ',
      keyword: false,
    },
    { text: 'Planul de tratament', keyword: true },
    {
      text: ' se stabilește împreună, după ce toate întrebările au primit un răspuns, iar pacientul primește ',
      keyword: false,
    },
    { text: 'în scris', keyword: true },
    {
      text: ' etapele, durata estimată și costul fiecărei etape. Pentru copii, prima vizită este mai scurtă și se încheie cu o discuție separată cu părinții.',
      keyword: false,
    },
  ],
  [
    {
      text: 'Între ședințe, pacientul poate suna la clinică pentru orice nelămurire legată de tratament. Dr. Marin vorbește ',
      keyword: false,
    },
    { text: 'română și engleză', keyword: true },
    {
      text: ', așa că pacienții veniți din străinătate pot discuta cu ea direct, fără interpret. În afara clinicii citește reviste de specialitate și pregătește materiale cu ',
      keyword: false,
    },
    { text: 'explicații simple', keyword: true },
    {
      text: ' pentru pacienții care poartă aparat dentar pentru prima dată.',
      keyword: false,
    },
  ],
];

/** The same three paragraphs as the words a reader hears — the segments
 *  joined, the marks gone. */
const ELENA_TEXTS = ELENA_SEGMENTS.map((segments) =>
  segments.map((segment) => segment.text).join(''),
);

/** The key words, in reading order — what the page's <Keywords> turns into
 *  ui/Keyword's <b>s. */
const ELENA_KEY_WORDS = ELENA_SEGMENTS.flatMap((segments) =>
  segments.filter((segment) => segment.keyword).map((segment) => segment.text),
);

/** THE BIOGRAPHY AS THE PAGE HANDS IT OVER — one finished node per
 *  paragraph, each ui/Keyword's <Keywords> over its segments (the component
 *  header's THE INK). The three everyday stories wear it. */
const ELENA_ABOUT = {
  ...ELENA_HEADING,
  paragraphs: ELENA_SEGMENTS.map((segments, index) => (
    <Keywords key={index} segments={segments} />
  )),
};

/** THE SAME WORDS AS PLAIN STRINGS — a string is a finished node too, and the
 *  stress and edge stories keep them: what they test is the column, not the
 *  key words. */
const ELENA_ABOUT_PLAIN = { ...ELENA_HEADING, paragraphs: ELENA_TEXTS };

/** Six courses, ONE IDEA EACH and no year (the owner, 2026-10-13: "no year
 *  anymore. jsut dot ideas") — the page's own Romanian drafts of the opener
 *  (`team.doctor.courses.*`) over invented lines in lib/team's shape. */
const ELENA_COURSES = {
  eyebrow: 'Repere din drumul meu spre specializare',
  title: 'Cursuri și specializări',
  items: [
    'Curs de reabilitare protetică pe implanturi, București',
    'Curs de ortodonție digitală și scanare intraorală, Cluj-Napoca',
    'Curs de ortodonție interceptivă la copii, Timișoara',
    'Curs de aliniere dentară cu gutiere transparente, Iași',
    'Curs de fotografie dentară pentru documentarea tratamentelor, Sibiu',
    'Specializare în ortodonție și ortopedie dento-facială',
  ],
};

const meta = {
  title: 'Sections/DoctorProfile',
  component: DoctorProfile,
  parameters: { layout: 'fullscreen' },
  args: { about: ELENA_ABOUT_PLAIN, courses: ELENA_COURSES },
  argTypes: {
    about: {
      control: false,
      description:
        'The biography — the LEFT column from the Container’s `@3xl`, three fifths of the row, the first one stacked: `eyebrow` + `title` (the opener every band on this site starts with) and `paragraphs`, FINISHED nodes, one justified `<p>` each, in the order given, in the credo card’s faint ink — the doctor page renders each through ui/Keyword’s `<Keywords>`, so its key words arrive as `<b>`s; a plain string is a node too. The column is a region named by its `title`. Already translated (§8.1) — the band owns no message key',
    },
    courses: {
      control: false,
      description:
        'The courses and specialisations — the RIGHT column from `@3xl`, two fifths of the row, under the biography stacked: sections/DoctorCourses’ own `eyebrow`, `title` (the h2 that names its region) and `items`, one finished idea each, lit one at a time by its island (never under reduced motion). An EMPTY `items` renders no courses, and the biography stands alone in one column. The two columns are 3 : 2, 48px apart (48 design pixels inside THE BAND SCALE on a laptop or desktop), and share the band’s two rows, so the first paragraph and the first idea start on one line',
    },
    className: {
      control: false,
      description:
        'Placement and spacing only, merged LAST onto the <section> (§6.4/§6.8). The band owns no outer margin — the page owns the rhythm between its bands',
    },
  },
} satisfies Meta<typeof DoctorProfile>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── HELPERS ────────────────────────────────────────────────────────────────

/** The band — the FIRST <section> in the frame (the two columns' own
 *  <section>s are nested inside it, later in document order). */
const bandOf = (canvasElement: HTMLElement): HTMLElement => {
  const band = canvasElement.querySelector('section');
  if (!(band instanceof HTMLElement)) {
    throw new Error('DoctorProfile story: no band');
  }
  return band;
};

/** ui/Container — the band's one child, and the column every `@`-step of the
 *  band asks, THE BAND SCALE's own `@4xl` included. */
const columnOf = (canvasElement: HTMLElement): HTMLElement =>
  bandOf(canvasElement).firstElementChild as HTMLElement;

/** The rhythm box — the column's one child: the band's `py` and THE BAND
 *  SCALE's two strings (ui/Container's recipe rule 5). */
const rhythmOf = (canvasElement: HTMLElement): HTMLElement =>
  columnOf(canvasElement).firstElementChild as HTMLElement;

/** The grid inside the rhythm box: its first child is the biography's region,
 *  its second — when there are courses — the courses' region. */
const gridOf = (canvasElement: HTMLElement): HTMLElement =>
  rhythmOf(canvasElement).firstElementChild as HTMLElement;

/** One rem at whatever the root font-size is, never a baked-in 16. */
const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/** An element's computed font size, in px. */
const fontSize = (element: Element): number =>
  parseFloat(getComputedStyle(element).fontSize);

/** THE BAND SCALE's numbers, written out (ui/Container's THE BAND SCALE —
 *  their census is tests/unit/design-scale.test.ts): the REFERENCE column,
 *  where a design pixel is a CSS pixel; the CAP, in rem of the root (1536px
 *  at the default 16px, a 1920 window's column); THE STEP's two halves,
 *  `@4xl`'s 56rem and the floor's 896px. Spelled again on purpose: the census
 *  holds the source, these hold what the engine draws. */
const REFERENCE = 1106;
const CAP_REM = 96;
const STEP_REM = 56;
const STEP_FLOOR = 896;

/** The biography's and the courses' shares of the row less the gap — the
 *  component header's THE BIOGRAPHY THREE FIFTHS. */
const BIOGRAPHY_SHARE = 3 / 5;
const COURSES_SHARE = 2 / 5;

/**
 * A box's CONTENT width — what a container query on it asks — from the
 * FRACTIONAL border box (`clientWidth` is an integer and would disagree with
 * the engine inside a sub-pixel window around a step), its own padding and
 * border taken off.
 */
const contentWidth = (element: HTMLElement): number => {
  const { paddingLeft, paddingRight, borderLeftWidth, borderRightWidth } =
    getComputedStyle(element);
  return (
    element.getBoundingClientRect().width -
    parseFloat(borderLeftWidth) -
    parseFloat(borderRightWidth) -
    parseFloat(paddingLeft) -
    parseFloat(paddingRight)
  );
};

/**
 * WHERE THE TWO COLUMNS GO SIDE BY SIDE, derived rather than assumed: `@3xl`
 * is 48rem of CONTAINER width, and the container is ui/Container — the
 * column, found by structure. (The idiom is PersonnelCard.stories'
 * `sitsBeside`; only the box it measures differs.)
 */
const sitsBeside = (canvasElement: HTMLElement): boolean =>
  contentWidth(columnOf(canvasElement)) >= 48 * rem();

/**
 * THE DESIGN PIXEL THE BAND IS DRAWN IN, derived from the BROWSER, never from
 * the pin (the visual runner ignores pins): the regime is a fine primary
 * pointer, an engine that registers custom properties (the relative colour
 * syntax that shipped with `@property` — globals.css's THE SCALABLE VARIANT)
 * and a column of max(56rem, 896px). Inside it the unit is min(column, 96rem)
 * / 1106; outside it a sixteenth of a rem — so an expectation written in this
 * unit is the theme's own number wherever the band does not scale.
 */
const scaleOf = (
  canvasElement: HTMLElement,
): Readonly<{ regime: boolean; column: number; unit: number }> => {
  const column = contentWidth(columnOf(canvasElement));
  const regime =
    window.matchMedia('(pointer: fine)').matches &&
    CSS.supports('color', 'rgb(from red r g b)') &&
    column >= Math.max(STEP_REM * rem(), STEP_FLOOR);
  return {
    regime,
    column,
    unit: regime ? Math.min(column, CAP_REM * rem()) / REFERENCE : rem() / 16,
  };
};

/** IS THE THEME REMAPPED on this box? The scale redefines `--spacing` on the
 *  box that wears it, so a box's `--spacing` differs from the root's exactly
 *  where the scale is drawn — the reading that still tells the two apart at
 *  the reference column, where the design pixel's number IS the registered
 *  initial 1px (DoctorShowcase.test.tsx's `remapped`). */
const remapped = (element: Element): boolean =>
  getComputedStyle(element).getPropertyValue('--spacing').trim() !==
  getComputedStyle(document.documentElement)
    .getPropertyValue('--spacing')
    .trim();

/** `actual` within `tolerance` of `expected`, the label and both numbers in
 *  the failure (a twentieth of a pixel by default: layout rounds to 1/64px
 *  and a design pixel keeps its fraction — ClinicLocation.stories' `near`). */
const near = async (
  actual: number,
  expected: number,
  label: string,
  tolerance = 0.05,
): Promise<void> => {
  await expect(
    Math.abs(actual - expected),
    `${label}: ${actual} against ${expected}`,
  ).toBeLessThanOrEqual(tolerance);
};

/**
 * Every face the band prints in, LOADED before a single box is read
 * (DoctorIntro.stories' `realFace`; PR #125's lesson): `document.fonts.ready`
 * can resolve before a face was even requested, and a box laid out in the
 * fallback serif is not the box the page draws. One request per distinct
 * font, read off what each element really wears — the titles, the eyebrows
 * (<p>s), the paragraphs, their key words (<b>s, a heavier instance of the
 * same face) and the course ideas.
 */
const realFaces = async (band: HTMLElement): Promise<void> => {
  const requests = new Map<string, string>();
  for (const element of band.querySelectorAll('h2, p, b, li')) {
    const style = getComputedStyle(element);
    const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    requests.set(font, `${requests.get(font) ?? ''}${element.textContent}`);
  }
  for (const [font, text] of requests) await document.fonts.load(font, text);
  await document.fonts.ready;
};

/** The ideas of the courses' rail, in order. */
const ideasOf = (courses: HTMLElement): HTMLElement[] =>
  within(courses).getAllByRole('listitem');

/** The ideas lit right now — `data-current`, the island's one mark. */
const litOf = (courses: HTMLElement): HTMLElement[] =>
  ideasOf(courses).filter((idea) => idea.hasAttribute('data-current'));

/**
 * THE COURSES LIGHT EXACTLY ONE IDEA AFTER MOUNT — sections/DoctorCourses'
 * island lights idea 1 one render after mount and then moves on every 3 s,
 * so a play asks for ONE lit idea and never assumes WHICH (the courses'
 * own stories' rule): a rail on screen runs its first dwell, and a play that
 * starts a beat late — a CI machine under load — finds the light already
 * moved on (G2 react L2, 2026-10-13). Only a rail that starts BELOW THE FOLD
 * must still show idea 1: the island holds it there (its OFF-SCREEN HOLD).
 * UNDER REDUCED MOTION nothing is ever lit (the neutral rail): the visual
 * net's runner, which emulates it, takes that branch, and the Vitest
 * storybook project, which does not, takes this one. Called FIRST in a play,
 * before the faces load.
 */
const expectOneIdeaLit = async (courses: HTMLElement): Promise<void> => {
  const ideas = ideasOf(courses);
  await expect(ideas.length).toBeGreaterThan(1);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Two frames: the island's start() has run, and declined.
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    await expect(litOf(courses)).toEqual([]);
    return;
  }
  const belowTheFold =
    courses.getBoundingClientRect().top >= window.innerHeight;
  await waitFor(async () => {
    const lit = litOf(courses);
    await expect(lit).toHaveLength(1);
    if (belowTheFold) await expect(lit).toEqual([ideas[0]]);
  });
};

/**
 * NOTHING MAY REQUIRE HORIZONTAL SCROLLING, at any sampled width (§7, §9) —
 * read on the DOCUMENT, which is what §7 protects, and on each title and
 * each idea: THE BELT on the band's outer clips the lit idea's forward
 * overshoot at the screen's edge, so the band's own box may still REPORT a
 * few clipped pixels as its `scrollWidth` for a few frames (the reviews and
 * courses stories' finding), while a box's OWN transform never counts toward
 * its own `scrollWidth` — each title and each idea is a race-free witness
 * that its words fit its box.
 */
const expectNoSidewaysScroll = async (
  canvasElement: HTMLElement,
): Promise<void> => {
  const page = document.documentElement;
  await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
  const band = bandOf(canvasElement);
  for (const element of band.querySelectorAll('h2, li')) {
    await expect(
      element.scrollWidth,
      `${element.tagName}: ${element.textContent ?? ''}`,
    ).toBeLessThanOrEqual(element.clientWidth);
  }
};

/**
 * THE BAND SCALE (the component header's paragraph of that name; §15.32
 * round 4), asserted where the play finds itself. The rhythm box's own
 * declaration must AGREE with the derivation: the theme remapped and the
 * design pixel declared inside the regime (to a ten-thousandth), nothing
 * remapped and the registered initial 1px outside it — and nothing around the
 * box remaps. The box is the column's width up to the 96rem cap and centred
 * past it (`bandColumnClasses`). Then every size the band prints is its
 * 1401-window size × the unit — the theme's own outside the scale: BOTH titles
 * on `band`'s 36 (30 on a column under that step's 28rem `@md` — both read
 * ui/Container, the courses' block being no container), both eyebrows 14,
 * each paragraph and each idea 18, and the rhythm — 80, 64 or 48 by the
 * Container's step.
 */
const expectBandScale = async (
  canvasElement: HTMLElement,
  regions: readonly HTMLElement[],
): Promise<void> => {
  const { regime, column, unit } = scaleOf(canvasElement);
  const box = rhythmOf(canvasElement);
  const columnBox = columnOf(canvasElement);

  await expect(remapped(box), 'the rhythm box remaps the theme').toBe(regime);
  await expect(remapped(columnBox), 'ui/Container stays the root’s').toBe(
    false,
  );
  if (regime) {
    await near(
      parseFloat(getComputedStyle(box).getPropertyValue('--scale-px')),
      unit,
      'the design pixel',
      0.0001,
    );
  } else {
    await expect(getComputedStyle(box).getPropertyValue('--scale-px')).toBe(
      '1px',
    );
  }
  const b = box.getBoundingClientRect();
  const c = columnBox.getBoundingClientRect();
  await near(
    b.width,
    regime ? Math.min(column, CAP_REM * rem()) : column,
    'the band’s width',
  );
  await near(b.left - c.left, (c.width - b.width) / 2, 'the band’s centring');

  const titleStep = column >= 28 * rem() ? 36 : 30;
  for (const region of regions) {
    const title = within(region).getByRole('heading', { level: 2 });
    await near(fontSize(title), titleStep * unit, `${title.textContent} title`);
    await near(
      fontSize(title.previousElementSibling as HTMLElement),
      14 * unit,
      `${title.textContent} eyebrow`,
    );
  }
  // The biography's paragraphs — its region's last child, the block under
  // the opener.
  const prose = regions[0]?.lastElementChild;
  await expect(prose?.children.length ?? 0).toBeGreaterThan(0);
  for (const paragraph of prose?.children ?? []) {
    await near(fontSize(paragraph), 18 * unit, 'a paragraph');
  }
  for (const idea of regions[1] ? ideasOf(regions[1]) : []) {
    await near(fontSize(idea), 18 * unit, 'a course idea');
  }
  const rhythm = column >= 48 * rem() ? 20 : column >= 32 * rem() ? 16 : 12;
  await near(
    parseFloat(getComputedStyle(box).paddingTop),
    rhythm * 4 * unit,
    'the band’s rhythm',
  );
};

/** A box's LAYOUT height — its used `height`, which no transform touches
 *  (the lit idea is drawn larger than it is laid out). */
const layoutHeightOf = (element: Element): number =>
  parseFloat(getComputedStyle(element).height);

/**
 * The height a flex column's children take, with its gaps — what the box
 * HUGS when nothing stretches it (SectionHeading's root, the paragraphs'
 * block, the courses' list). Layout heights throughout; a trail drawn
 * absolutely inside the last idea is no child of the list and adds nothing.
 */
const hugHeightOf = (box: Element): number => {
  const children = [...box.children];
  const gap = parseFloat(getComputedStyle(box).rowGap) || 0;
  return (
    children.reduce((sum, child) => sum + layoutHeightOf(child), 0) +
    Math.max(0, children.length - 1) * gap
  );
};

/** Nothing moves this box right now: no transform, no `scale`, no running
 *  animation or transition — so its drawn box IS its layout box. */
const isStill = (element: Element): boolean => {
  const style = getComputedStyle(element);
  return (
    style.transform === 'none' &&
    style.scale === 'none' &&
    element.getAnimations().length === 0
  );
};

/** An idea's dot — the one box inside it that wears the ring (a computed
 *  `0 0 0 Npx` shadow), found by what it draws rather than by its classes. */
const dotOf = (idea: HTMLElement): HTMLElement => {
  const dot = [...idea.querySelectorAll('*')].find((element) =>
    /0px 0px 0px [1-9]/.test(getComputedStyle(element).boxShadow),
  );
  if (!(dot instanceof HTMLElement)) {
    throw new Error('DoctorProfile story: no dot on the first idea');
  }
  return dot;
};

/**
 * THE SHARED ROWS, beside (the component header's paragraph of that name):
 * both regions adopt the band's two rows — a subgrid, not a look-alike — so
 * the first paragraph's first line box and the first idea start on ONE y and
 * the first dot's centre sits on that line's centre, within half a pixel; and
 * THE ITEMS KEEP THEIR HEIGHTS — each region's opener and content hug what
 * they hold instead of stretching to their row (the courses' island watches
 * its list for the off-screen hold). Read in LAYOUT (the file header): the
 * first idea's top is the list's own content top, its dot's centre that top
 * plus the dot's `top` and half its height; the drawn boxes are compared too
 * wherever nothing moves them. Returns which column is the longer, for a
 * story that claims one.
 */
const expectSharedRows = async (
  about: HTMLElement,
  courses: HTMLElement,
): Promise<{ biographyLonger: boolean }> => {
  for (const region of [about, courses]) {
    await expect(getComputedStyle(region).display).toBe('grid');
    await expect(getComputedStyle(region).gridTemplateRows).toMatch(
      /^subgrid\b/,
    );
  }
  const prose = about.lastElementChild as HTMLElement;
  const paragraph = prose.firstElementChild as HTMLElement;
  const list = within(courses).getByRole('list');
  const idea = ideasOf(courses)[0] as HTMLElement;
  const dot = dotOf(idea);

  const p = paragraph.getBoundingClientRect();
  const lineCentre =
    p.top + parseFloat(getComputedStyle(paragraph).lineHeight) / 2;
  const listStyle = getComputedStyle(list);
  const ideaTop =
    list.getBoundingClientRect().top +
    parseFloat(listStyle.borderTopWidth) +
    parseFloat(listStyle.paddingTop);
  const dotStyle = getComputedStyle(dot);
  const dotCentre =
    ideaTop + parseFloat(dotStyle.top) + parseFloat(dotStyle.height) / 2;
  await near(ideaTop, p.top, 'the first idea against the first paragraph', 0.5);
  await near(
    dotCentre,
    lineCentre,
    'the first dot against the first paragraph’s first line',
    0.5,
  );
  if (isStill(idea) && isStill(dot)) {
    const d = dot.getBoundingClientRect();
    await near(
      idea.getBoundingClientRect().top,
      ideaTop,
      'the first idea, drawn',
      0.5,
    );
    await near(d.top + d.height / 2, dotCentre, 'the first dot, drawn', 0.5);
  }

  // THE ITEMS KEEP THEIR HEIGHTS.
  await near(
    layoutHeightOf(list),
    hugHeightOf(list),
    'the courses’ list hugs its ideas',
    0.5,
  );
  await near(
    prose.getBoundingClientRect().height,
    hugHeightOf(prose),
    'the paragraphs’ block hugs its paragraphs',
    0.5,
  );
  for (const region of [about, courses]) {
    const opener = region.firstElementChild as HTMLElement;
    await near(
      opener.getBoundingClientRect().height,
      hugHeightOf(opener),
      'an opener hugs its words',
      0.5,
    );
  }
  return { biographyLonger: hugHeightOf(prose) > hugHeightOf(list) };
};

/**
 * THE ARRANGEMENT (the header's THE BIOGRAPHY THREE FIFTHS + THE SHARED ROWS
 * + the owner's adaptability rule), asserted at whichever one the runner
 * lands in, so neither branch is ever silently skipped — every length in the
 * design unit (`scaleOf`), which outside THE BAND SCALE is the theme's own.
 *
 * BOTH: the grid's two children are the biography's REGION and the courses'
 * region, in that order, each a BOX with a real rect, its opener first.
 *
 * BESIDE (the wide step): ONE ROW of two columns — the biography THREE FIFTHS
 * of the row less the gap, the courses TWO, the biography on the rhythm box's
 * left edge, the courses ending on its right, `gap-x-12` (48 in the unit)
 * between — both starting at the grid's top, the two eyebrows level, and THE
 * SHARED ROWS (`expectSharedRows`). Each region a GRID there, a subgrid of the
 * band's rows.
 *
 * STACKED (below the step — never in the scale, which starts at a 56rem
 * column): ONE column — the biography over the courses, `gap-16` (64 in the
 * unit) between, both as wide as the grid on its left edge, each a plain FLEX
 * column.
 */
const expectArrangement = async (
  canvasElement: HTMLElement,
  about: HTMLElement,
  courses: HTMLElement,
): Promise<{ biographyLonger: boolean } | null> => {
  const grid = gridOf(canvasElement);
  await expect(grid.children).toHaveLength(2);
  await expect(grid.firstElementChild).toBe(about);
  await expect(grid.lastElementChild).toBe(courses);
  for (const region of [about, courses]) {
    await expect(region.getBoundingClientRect().height).toBeGreaterThan(0);
  }

  const { unit } = scaleOf(canvasElement);
  const box = rhythmOf(canvasElement).getBoundingClientRect();
  const g = grid.getBoundingClientRect();
  const a = about.getBoundingClientRect();
  const c = courses.getBoundingClientRect();

  if (sitsBeside(canvasElement)) {
    const row = g.width - 48 * unit;
    await near(a.left, box.left, 'the biography’s left edge', 1);
    await near(c.right, box.right, 'the courses’ right edge', 1);
    await near(c.left - a.right, 48 * unit, 'the gap', 1);
    await near(a.width, row * BIOGRAPHY_SHARE, 'the biography: 3/5', 1);
    await near(c.width, row * COURSES_SHARE, 'the courses: 2/5', 1);
    await near(a.width / c.width, 1.5, '3 : 2', 0.01);
    await near(a.top, g.top, 'the biography’s top', 1);
    await near(c.top, g.top, 'the courses’ top', 1);
    const eyebrow = (region: HTMLElement): number =>
      (
        within(region).getByRole('heading', { level: 2 })
          .previousElementSibling as HTMLElement
      ).getBoundingClientRect().top;
    await near(eyebrow(courses), eyebrow(about), 'the two eyebrows', 1);
    return expectSharedRows(about, courses);
  }

  for (const region of [about, courses]) {
    await expect(getComputedStyle(region).display).toBe('flex');
  }
  await near(c.top - a.bottom, 64 * unit, 'the stack’s gap', 1);
  for (const [name, rect] of [
    ['the biography', a],
    ['the courses', c],
  ] as const) {
    await near(rect.left, g.left, `${name}’s left edge`, 1);
    await near(rect.width, g.width, `${name}’s width`, 1);
  }
  return null;
};

/**
 * THE PHONE PIN IS NOT VACUOUS: a story pinned to a phone must really have
 * taken the stacked branch above whenever the window is narrower than the
 * step — the column is narrower still, so beside is impossible there. At a
 * wider window (the visual runner's 1536) the derived branch stands alone.
 */
const expectStackedOnAPhone = async (
  canvasElement: HTMLElement,
): Promise<void> => {
  if (window.innerWidth < 48 * rem()) {
    await expect(sitsBeside(canvasElement)).toBe(false);
  }
};

/** The two regions the band always shows when it has courses — found by their
 *  own <h2>s' names, in DOM order, and never the band's root. */
const regionsOf = async (
  canvasElement: HTMLElement,
  aboutTitle: string,
  coursesTitle: string,
): Promise<readonly [HTMLElement, HTMLElement]> => {
  const canvas = within(canvasElement);
  const about = canvas.getByRole('region', { name: aboutTitle });
  const courses = canvas.getByRole('region', { name: coursesTitle });
  const regions = canvas.getAllByRole('region');
  await expect(regions).toEqual([about, courses]);
  await expect(regions).not.toContain(bandOf(canvasElement));
  return [about, courses];
};

/**
 * THE WHOLE PLAY for a band with courses: the first idea lit (or none under
 * reduced motion), the two regions, the faces, the scale, the arrangement and
 * no sideways scroll — in that order, so the light is read before anything
 * slow is awaited. Hands back the two regions and, beside, which column is
 * the longer.
 */
const playBand = async (
  canvasElement: HTMLElement,
  aboutTitle: string,
  coursesTitle: string,
): Promise<
  readonly [HTMLElement, HTMLElement, { biographyLonger: boolean } | null]
> => {
  const courses = within(canvasElement).getByRole('region', {
    name: coursesTitle,
  });
  await expectOneIdeaLit(courses);
  const [about] = await regionsOf(canvasElement, aboutTitle, coursesTitle);
  await realFaces(bandOf(canvasElement));
  await expectBandScale(canvasElement, [about, courses]);
  const beside = await expectArrangement(canvasElement, about, courses);
  await expectNoSidewaysScroll(canvasElement);
  return [about, courses, beside];
};

/**
 * THE INK AND THE KEY WORDS (the component header's THE INK), read off what
 * the engine paints: every paragraph in the credo card's faint ink —
 * `--ink-faint`, resolved through a probe so no colour is retyped here — its
 * words the page's, in order, and its key words ui/Keyword's <b>s, inside
 * their paragraphs, in the button's lavender (`--accent`) at weight 650.
 */
const expectInkAndKeyWords = async (about: HTMLElement): Promise<void> => {
  const colourOf = (token: string): string => {
    const probe = document.createElement('span');
    probe.style.color = `var(${token})`;
    about.append(probe);
    try {
      return getComputedStyle(probe).color;
    } finally {
      probe.remove();
    }
  };
  const prose = about.lastElementChild as HTMLElement;
  const paragraphs = [...prose.children] as HTMLElement[];
  await expect(paragraphs.map((p) => p.textContent)).toEqual(ELENA_TEXTS);
  for (const paragraph of paragraphs) {
    await expect(getComputedStyle(paragraph).color).toBe(
      colourOf('--ink-faint'),
    );
  }
  const keyWords = [...prose.querySelectorAll('b')];
  await expect(keyWords.map((b) => b.textContent)).toEqual(ELENA_KEY_WORDS);
  for (const keyWord of keyWords) {
    await expect(paragraphs).toContain(keyWord.parentElement);
    await expect(getComputedStyle(keyWord).color).toBe(colourOf('--accent'));
    await expect(getComputedStyle(keyWord).fontWeight).toBe('650');
  }
};

// ── STORIES ────────────────────────────────────────────────────────────────

/**
 * THE EVERYDAY PICTURE — three paragraphs about the doctor beside her six
 * courses, at the laptop width the §13 matrix samples, in Romanian, the way
 * the page hands them over: the biography on the left, on three fifths of the
 * row, its paragraphs justified in the credo card's grey with their key words
 * in the lavender; the courses on the right, on two fifths, one idea per dot
 * on the line down their left, idea 1 lit (in the workbench — the net's frame
 * shows the neutral rail); the two openers level, and the first paragraph's
 * first line level with the first idea's and its dot. At the laptop pin the
 * whole band is drawn in THE BAND SCALE (§15.32 round 4): the frame the
 * owner's 1401-window design is proven at × s, not skipped. The play measures
 * what a picture cannot — the two columns against each other and the rhythm
 * box, every size in the design unit, the two contents' first lines, that the
 * two openers really are two <h2>s rather than styled text, and that each
 * column is a region named by its own <h2> while the band is not.
 */
export const Default: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { about: ELENA_ABOUT },
  play: async ({ canvas, canvasElement }) => {
    const [about, courses] = await playBand(
      canvasElement,
      ELENA_HEADING.title,
      ELENA_COURSES.title,
    );
    await expect(
      canvas
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual([ELENA_HEADING.title, ELENA_COURSES.title]);
    await expect(canvas.getByText(ELENA_HEADING.eyebrow)).toBeVisible();
    await expect(canvas.getByText(ELENA_COURSES.eyebrow)).toBeVisible();
    await expectInkAndKeyWords(about);
    await expect(ideasOf(courses).map((idea) => idea.textContent)).toEqual(
      ELENA_COURSES.items,
    );
    // No week anywhere: the schedule card is gone ("no more schedul box at
    // all", 2026-10-13).
    await expect(canvasElement.querySelector('dl')).toBeNull();
    // THE SCALE IS NOT VACUOUS HERE: from a 1280 window — §7's Notebook — the
    // column clears the step even beside a classic scrollbar (1009px), so in a
    // runner with a mouse and a registering engine the laptop pin MUST land
    // the band in THE BAND SCALE, and the assertions above ran × s.
    if (
      window.innerWidth >= 1280 &&
      window.matchMedia('(pointer: fine)').matches &&
      CSS.supports('color', 'rgb(from red r g b)')
    ) {
      await expect(scaleOf(canvasElement).regime).toBe(true);
    }
    // AND THE BESIDE BRANCH IS NOT VACUOUS: at the laptop pin the column is
    // past the 48rem step, so the two columns MUST sit side by side — on the
    // shared rows, the two contents level.
    if (window.innerWidth >= 1280) {
      await expect(sitsBeside(canvasElement)).toBe(true);
    }
  },
};

/**
 * THE NOTEBOOK — §7's 1280 sampling point, under the owner's reference: the
 * band at about 0.91 of it, every ratio of his 1401 band kept, so the whole
 * band draws a little SMALLER than the theme (the component header's THE
 * TRADES). It shows the everyday biography beside THREE of the six courses,
 * so the BIOGRAPHY IS THE LONGER COLUMN — the case THE ITEMS KEEP THEIR
 * HEIGHTS exists for: the courses' list hugs its three ideas while the row
 * runs on beside the paragraphs, and the island's off-screen hold watches
 * that list, never the row. The play asserts that premise, then the list.
 * For the workbench: 'no-visual' (the file header says why).
 */
export const Notebook: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro', viewport: { value: 'notebook' } },
  args: {
    about: ELENA_ABOUT,
    courses: { ...ELENA_COURSES, items: ELENA_COURSES.items.slice(0, 3) },
  },
  play: async ({ canvasElement }) => {
    const [about, courses, beside] = await playBand(
      canvasElement,
      ELENA_HEADING.title,
      ELENA_COURSES.title,
    );
    await expectInkAndKeyWords(about);
    if (window.innerWidth >= 1280) {
      await expect(sitsBeside(canvasElement)).toBe(true);
      // THE PREMISE, so the list's pin is not vacuous: the paragraphs run
      // on below the last idea — a stretched list would have been the row.
      await expect(beside?.biographyLonger).toBe(true);
      const list = within(courses).getByRole('list');
      await expect(
        (about.lastElementChild as HTMLElement).getBoundingClientRect().bottom,
      ).toBeGreaterThan(list.getBoundingClientRect().bottom + 100);
    }
  },
};

/**
 * THE STACKED ARRANGEMENT — the phone, where the column (351px at 390) is far
 * under the 48rem step, so the biography comes first and the courses follow
 * it, 64px below: the owner's adaptability rule, "one above the other" below
 * the step. The courses stand below the first screen here, so the island
 * lights idea 1 and HOLDS it until the rail is scrolled into view
 * (DoctorCourses' OFF-SCREEN HOLD) — which is why the play still finds idea 1
 * lit.
 *
 * It is the same markup as `Default` and deliberately so: the subject is the
 * ONE grid changing its track list at the step — no shared rows below it —
 * with DOM order = reading order in both arrangements. The play derives the
 * arrangement from the measured column, so it proves the stacked branch here
 * and the beside branch when the visual runner renders this same story at
 * 1536.
 */
export const Smartphone: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  args: { about: ELENA_ABOUT },
  play: async ({ canvasElement }) => {
    const [about, courses] = await playBand(
      canvasElement,
      ELENA_HEADING.title,
      ELENA_COURSES.title,
    );
    await expectInkAndKeyWords(about);
    // Stacked or beside, the doctor's words come FIRST — in the DOM and in the
    // reading order a screen reader follows, region before region.
    await expect(
      about.compareDocumentPosition(courses) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await expectStackedOnAPhone(canvasElement);
  },
};

/**
 * THE NARROWEST WINDOW — 320px, the accessibility stress width (§7): a 288px
 * column on a phone (ui/Container's PHONE GUTTER; 273 under the classic
 * scrollbar the net photographs it with), 18px prose and 18px course lines in
 * it, and nothing — no word, no lit idea's forward overshoot — scrolling the
 * page sideways. Pinned there in the workbench and photographed there too
 * ('stress-320'). Its paragraphs are the plain strings: the column is the
 * subject.
 */
export const Narrowest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  play: async ({ canvasElement }) => {
    await playBand(canvasElement, ELENA_HEADING.title, ELENA_COURSES.title);
    await expectStackedOnAPhone(canvasElement);
  },
};

/**
 * GERMAN, THE LONGEST LOCALE (§8.4: ≈ +30–35% over English) — the phone width,
 * carrying the words this band is most likely to break on: three paragraphs
 * built out of `Kieferorthopädie`, `Röntgenaufnahmen`, `Behandlungsdauer` and
 * `Behandlungsschritte`, and a 94-character course line built out of
 * `implantatgetragenen`, the longest idea a column of the rail has to wrap.
 *
 * `lang="de"` rides the native prop spread onto the <section> (the
 * Card/Heading/PersonnelCard precedent) and inherits to every child, which is
 * the whole mechanism: the body's site-wide `hyphens: auto` (§15.14) picks the
 * GERMAN dictionary, so a compound in a 288px column breaks at a syllable
 * instead of pushing the layout open. ONE element in this band opts out of it:
 * the biography's title, because it carries a person's name (DoctorProfile's
 * THE NAME IS NEVER SPLIT, 2026-09-30) — so this story's „Über Dr. Elena Marin"
 * wraps between words and never as „Ma-rin", while the courses' title beside
 * it keeps the dictionary.
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  args: {
    lang: 'de',
    about: {
      eyebrow: 'Biografie',
      title: 'Über Dr. Elena Marin',
      paragraphs: [
        'Dr. Elena Marin ist Fachärztin für Kieferorthopädie und arbeitet seit 2015 in unserer Praxis. Sie behandelt Kinder, Jugendliche und Erwachsene, je nach Befund mit festsitzenden Zahnspangen oder mit transparenten Schienen. Bei jeder Kontrolle prüft sie den Behandlungsverlauf und vermerkt die Veränderungen seit dem letzten Termin. Am Ende jedes Besuchs erhält die Patientin oder der Patient eine schriftliche Zusammenfassung der Beobachtungen und der nächsten Schritte.',
        'Bei der ersten Beratung hört sie zu, was sich die Patientin oder der Patient wünscht, untersucht anschließend und veranlasst die notwendigen Röntgenaufnahmen. Den Behandlungsplan legen beide gemeinsam fest, sobald alle Fragen beantwortet sind, und die Behandlungsschritte, die voraussichtliche Behandlungsdauer und die Kosten jedes Abschnitts werden schriftlich übergeben. Bei Kindern ist der erste Besuch kürzer und endet mit einem eigenen Gespräch mit den Eltern.',
        'Zwischen den Terminen kann man die Praxis bei jeder Unklarheit zur Behandlung anrufen. Dr. Marin spricht Rumänisch und Englisch, sodass Patientinnen und Patienten aus dem Ausland direkt mit ihr sprechen können, ohne Dolmetscher. Außerhalb der Praxis liest sie Fachzeitschriften und bereitet einfach erklärte Unterlagen für Patientinnen und Patienten vor, die zum ersten Mal eine Zahnspange tragen.',
      ],
    },
    courses: {
      eyebrow: 'Stationen meines Weges zur Spezialisierung',
      title: 'Kurse und Spezialisierungen',
      items: [
        'Fortbildung zur implantatgetragenen prothetischen Rehabilitation und digitalen Abformung, Iași',
        'Kurs für digitale Kieferorthopädie und intraorale Scans, Cluj-Napoca',
        'Kurs für kieferorthopädische Frühbehandlung bei Kindern, Timișoara',
        'Kurs für Zahnkorrektur mit transparenten Schienen, Bukarest',
        'Fachzahnärztliche Weiterbildung in Kieferorthopädie',
      ],
    },
  },
  play: async ({ canvas, canvasElement }) => {
    const band = bandOf(canvasElement);
    await expect(band).toHaveAttribute('lang', 'de');
    const [about, courses] = await playBand(
      canvasElement,
      'Über Dr. Elena Marin',
      'Kurse und Spezialisierungen',
    );
    await expect(
      canvas.getByText(
        'Fortbildung zur implantatgetragenen prothetischen Rehabilitation und digitalen Abformung, Iași',
      ),
    ).toBeVisible();
    // THE NAME IS NEVER SPLIT, the courses' words may be: the biography's
    // title reads `hyphens: none`, inherited from its opener, while the
    // courses' title keeps the body's `auto` (§15.14).
    await expect(
      getComputedStyle(within(about).getByRole('heading', { level: 2 }))
        .hyphens,
    ).toBe('none');
    await expect(
      getComputedStyle(within(courses).getByRole('heading', { level: 2 }))
        .hyphens,
    ).toBe('auto');
    await expectStackedOnAPhone(canvasElement);
  },
};

/**
 * PSEUDO-LOCALE (§8.9) — accented and ~40% expanded, TYPED OUT as a fixture
 * rather than produced by the toolbar, because the toolbar transforms message
 * files and this band reads none (its strings are props, §8.1). Flipping any
 * other story here to Pseudo changes nothing, which is that sweep passing; the
 * expansion stress still has to happen somewhere, and this is it.
 *
 * WHAT IS TRANSFORMED IS EXACTLY WHAT A MESSAGE KEY WOULD BE (round 2's D17
 * and D20 split): the two eyebrows and the two titles are `team.doctor.*`
 * keys, so they carry the preview's own ACCENT map and the `·` padding at 40%
 * of the source length; the PARAGRAPHS and the COURSE IDEAS are data
 * travelling with the doctor in `lib/team`, which never pass through a message
 * file, so pseudo-ing them would be a picture of a pipeline this site does not
 * have. The biography's title is the ICU message `Despre {name}` put through
 * the transform: the argument passes through untouched and the doctor's name
 * is inserted afterwards, which is why it stays itself between the accented
 * word and the padding. What is sampled is the width the real pipeline would
 * produce, not a longer string someone invented.
 *
 * **390 · 320 (`stress-320`):** the padded courses title — „Cursuri și
 * specializări" put through the transform — has to wrap inside a 288px column
 * without pushing it open.
 */
export const PseudoLocale: Story = {
  tags: ['stress-320'],
  globals: { locale: 'pseudo', viewport: { value: 'smartphone' } },
  args: {
    about: {
      eyebrow: 'Bíógráfíé ····',
      title: 'Déšpré Dr. Elena Marin ······',
      paragraphs: ELENA_TEXTS,
    },
    courses: {
      eyebrow: 'Répéré díñ drúmúl méú špré špéçíálížáré ················',
      title: 'Çúršúrí șí špéçíálížărí ··········',
      items: ELENA_COURSES.items,
    },
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getAllByRole('heading', { level: 2 })).toHaveLength(2);
    await expect(canvas.getByText('Bíógráfíé ····')).toBeVisible();
    await expect(
      canvas.getByText(
        'Répéré díñ drúmúl méú špré špéçíálížáré ················',
      ),
    ).toBeVisible();
    // The padded titles name the two regions, padding and all; the data
    // stayed itself — that is the point of the frame.
    const [, courses] = await playBand(
      canvasElement,
      'Déšpré Dr. Elena Marin ······',
      'Çúršúrí șí špéçíálížărí ··········',
    );
    await expect(ideasOf(courses).map((idea) => idea.textContent)).toEqual(
      ELENA_COURSES.items,
    );
    await expectStackedOnAPhone(canvasElement);
  },
};

/**
 * THE BIOGRAPHY ALONE — a doctor with no courses yet: sections/DoctorCourses
 * renders nothing for an empty list (no region, no heading), and the band's
 * grid keeps ONE column at every width (the component header's ONE BRANCH),
 * so the biography never stands in three fifths of a row beside nothing, and
 * shares no rows. At the laptop pin the paragraphs stop at `max-w-4xl` — 896
 * design pixels in THE BAND SCALE — the one arrangement in which that measure
 * binds on a laptop (beside the courses the biography's column is narrower
 * than it).
 */
export const NoCourses: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { courses: { ...ELENA_COURSES, items: [] } },
  play: async ({ canvas, canvasElement }) => {
    const about = canvas.getByRole('region', { name: ELENA_HEADING.title });
    await expect(canvas.getAllByRole('region')).toEqual([about]);
    await expect(canvas.getAllByRole('heading')).toHaveLength(1);
    await expect(canvas.queryByRole('list')).toBeNull();
    await expect(canvas.queryByText(ELENA_COURSES.title)).toBeNull();
    await realFaces(bandOf(canvasElement));
    await expectBandScale(canvasElement, [about]);

    // ONE column at every width: the biography IS the grid's one item, as
    // wide as the rhythm box — a plain flex column, no shared rows — and its
    // paragraphs stop at 56rem — 896 in the design unit — or at the box,
    // whichever is narrower.
    const grid = gridOf(canvasElement);
    await expect([...grid.children]).toEqual([about]);
    await expect(getComputedStyle(about).display).toBe('flex');
    const { unit } = scaleOf(canvasElement);
    const box = rhythmOf(canvasElement).getBoundingClientRect();
    const a = about.getBoundingClientRect();
    const prose = (
      about.lastElementChild as HTMLElement
    ).getBoundingClientRect();
    await near(a.left, box.left, 'the biography’s left edge', 1);
    await near(a.width, box.width, 'the biography’s width', 1);
    await near(
      prose.width,
      Math.min(box.width, 896 * unit),
      'the paragraphs’ measure',
      1,
    );
    // …and that cap really binds at the laptop pin (a 1213.8px band against
    // 983.3px of measure), so the check above is not the box's width twice.
    if (window.innerWidth >= 1280) {
      await expect(prose.width).toBeLessThan(box.width - 1);
    }
    await expectNoSidewaysScroll(canvasElement);
  },
};
