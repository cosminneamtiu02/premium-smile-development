import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { formatHoursRows } from '@/lib/hours/hours';
import { DoctorProfile } from './DoctorProfile';

// The doctor page's tinted band — FIVE stories: the everyday picture at the
// laptop width (the prose beside the framed schedule card, the card one fixed
// width — D53: 20rem, 320 design pixels in THE BAND SCALE — and the whole
// band drawn in that scale), the stacked arrangement the phone gets, the same
// stack at the tablet width where the card is narrower than its column and
// sits centred (round 2k), and the two expansion stresses. The export NAMES
// are load-bearing — each one names a baseline file
// (`sections-doctorprofile--default`, `sections-doctorprofile--stacked`, …),
// so renaming or adding an export re-records pictures; this list IS the
// section's contribution to the run's visual manifest (round 2 deleted
// `NoCourses` with the courses, which left for sections/DoctorCourses — D15).
// The `Sections/*` title prefix routes every one of them to 390 + 1536
// (tests/visual/stories.spec.ts, §13); the 'stress-320' tag adds the
// accessibility width to the three whose layout has something to say there
// (18px prose 288px wide since 2026-10-09's phone gutter — 256 before — a
// white card under it at the same width, a German compound, a 40%-expanded
// heading).
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
//     given: the prose and the card sit side by side from `@3xl` = 48rem of
//     CONTAINER width, i.e. a ~960px viewport — the owner's adaptability rule,
//     beside on the wide step and one above the other below it. The Vitest
//     runner applies the pin; the visual runner ignores it and sets its own
//     page size per project — which is exactly why every geometry assertion
//     below DERIVES its branch from the measured column instead of assuming
//     the pinned width (the PersonnelCard `sitsBeside` idiom), while a story
//     pinned to the phone additionally proves it really took the stacked
//     branch there.
//
// ── `layout: 'fullscreen'` is load-bearing: the band is full-bleed and owns
// its own gutter clamp through ui/Container, so Storybook's default 1rem canvas
// padding would add a second inset on top of it — and, worse here than
// anywhere, would leave a page-coloured frame around the tint that the real
// page never shows.
//
// ── WHAT THE PLAYS MEASURE, and why it has to be here: none of it survives in
// DoctorProfile.test.tsx, because this project loads no stylesheet in the
// components runner. The arrangement (D14, as round 2k's D53 fixed it): the
// card's ONE width — exactly eighty spacing steps beside the prose (20rem, or
// 320 design pixels in the scale), 20rem centred under it wherever the
// stacked column allows, the column's own width only where the column is
// narrower — the outdent, the biography a named region that stays a
// BOX at every width (the G2-R2 review's a11y F2), the step's ONE row with the
// card's vertical middle on the band's (D37, round 2g, by construction since
// G2-R2), the card
// never stretched to the prose's height, and the one-column stack below the
// step, all live in the stories' play functions. The GROUND's
// measurement — the tint's alpha of exactly 0.3, the fades resolving to that
// same colour at their last stop — MOVED to TintedBand.stories with the ground
// itself (`expectTintedGround`, `parseColor`, `accentChannels`, run D29): the
// file that owns the thing measures it, and this band inherits it by composing
// the band.
//
// ── THE BAND SCALE (2026-10-13, CLAUDE.md §15.32 round 4 — the component
// header's paragraph of that name): on a laptop or desktop the whole band is
// ONE design, its every length the owner's 1401-window length × the design
// pixel. Every play reads it where it finds itself (`scaleOf`): the regime
// derived from the BROWSER — a fine primary pointer, an engine that registers
// custom properties, ui/Container's column at max(56rem, 896px) — never from
// the pin, and the box's own declaration read beside the derivation, so the
// two must agree (`expectBandScale`, ClinicLocation.stories' shape). Every
// geometric expectation is then written in that unit — the card's 320, the
// outdent's 32, the gap's 48, the titles' 36 and 30, the eyebrow's 14, the
// prose's 18, the rows' 16 — which is a sixteenth of a rem outside the scale,
// so the phone and tablet pins (outside it) assert exactly the numbers they
// always did: the proof that nothing moved there. `Default`'s laptop pin is
// INSIDE the scale in the Vitest runner (a 1536 window under its 15px classic
// scrollbar: a 1213.8px column, s ≈ 1.0975), and the visual net's 1536 frame
// of every story is too.
//
// Demo copy is INVENTED (no real doctor, no real clinic history): Romanian with
// diacritics (§15.7), third-person and factual — no superlatives, no promises,
// no result guarantees (CMSR advertising rules for dental practices, in force
// since 2025-07-01) — and D-DASH-clean. The real doctors, in five languages,
// are the owner's to author (§15.17). The weekday words come from `lib/hours`
// in each story's language, i.e. from the browser's own Intl data, exactly as
// the page gets them.

const meta = {
  title: 'Sections/DoctorProfile',
  component: DoctorProfile,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    about: {
      control: false,
      description:
        'The „Despre" half: `eyebrow` + `title` (the opener every band on this site starts with) and `paragraphs`, FINISHED PLAIN strings, one `<p>` each, in the order given. The half is a region named by its `title` (the G2-R2 review’s a11y F2), so a landmark walk stops on the biography as well as on the card. Already translated (§8.1) — the band owns no message key',
    },
    schedule: {
      control: false,
      description:
        'The framed white card (ui/Card `framed`, D14): its own `title` — the h2 that names its region and the card’s ONLY heading row, no eyebrow (D37) — and `rows`, lib/hours’ seven printed days, already formatted in the visitor’s language by the page. The band never calls the formatter. The card has ONE width — eighty spacing steps: 20rem, or 320 design pixels inside THE BAND SCALE on a laptop or desktop — at every window whose column allows it (D53) — beside the prose at the wide step, where it sits centred on the band’s one row (D37), and centred under the prose below it',
    },
    className: {
      control: false,
      description:
        'Placement and spacing only, merged LAST onto the <section> (§6.4/§6.8). The band owns no outer margin — the page owns the rhythm between its bands, and the two 6rem fades are its ground’s own boxes (sections/TintedBand, which receives this className), not spacing',
    },
  },
} satisfies Meta<typeof DoctorProfile>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── FIXTURES ───────────────────────────────────────────────────────────────

/** The doctor-like week every story prints: mornings on Monday, Wednesday and
 *  Friday, afternoons on Tuesday and Thursday, the weekend closed — so both of
 *  ScheduleCard's row tones appear, in their calendar places. The INPUT shape
 *  lib/hours takes (schema.org entries); the page calls the formatter, never
 *  this band (run D1). */
const DOCTOR_WEEK = [
  { days: ['Monday', 'Wednesday', 'Friday'], opens: '09:00', closes: '17:00' },
  { days: ['Tuesday', 'Thursday'], opens: '12:00', closes: '20:00' },
] as const;

/** Three third-person paragraphs — D14's plain prose, drafted for the
 *  workbench (not lib/team's words, so a data edit never moves a baseline) at
 *  roughly the length of the real drafts, so the prose runs TALLER than the
 *  card (its title and seven rows) at the laptop width, as it will on the
 *  page: the frame then shows the card centred on the band at its own height
 *  (D37, `@3xl:self-center` in the one row) rather than a row the card
 *  happens to fill. */
const ELENA_ABOUT = {
  eyebrow: 'Biografie',
  title: 'Despre Dr. Elena Marin',
  paragraphs: [
    'Dr. Elena Marin este medic specialist în ortodonție și lucrează în clinica noastră din 2015. Tratează copii, adolescenți și adulți, cu aparate dentare fixe sau cu gutiere transparente, în funcție de ce arată examinarea. La fiecare control verifică evoluția tratamentului și notează în fișă schimbările față de vizita anterioară. La sfârșitul fiecărei vizite, pacientul primește un rezumat scris al observațiilor și al pașilor următori.',
    'La prima consultație ascultă ce își dorește pacientul, apoi face examenul clinic și cere radiografiile necesare. Planul de tratament se stabilește împreună, după ce toate întrebările au primit un răspuns, iar pacientul primește în scris etapele, durata estimată și costul fiecărei etape. Pentru copii, prima vizită este mai scurtă și se încheie cu o discuție separată cu părinții.',
    'Între ședințe, pacientul poate suna la clinică pentru orice nelămurire legată de tratament. Dr. Marin vorbește română și engleză, așa că pacienții veniți din străinătate pot discuta cu ea direct, fără interpret. În afara clinicii citește reviste de specialitate și pregătește materiale cu explicații simple pentru pacienții care poartă aparat dentar pentru prima dată.',
  ],
};

/** The card's content: the page's own Romanian draft of the title (D26) and
 *  the week — NO eyebrow since round 2g struck the „Program" line (D37). */
const ELENA_SCHEDULE = {
  title: 'Când mă găsiți la clinică',
  rows: formatHoursRows(DOCTOR_WEEK, 'ro', 'Închis'),
};

// ── HELPERS ────────────────────────────────────────────────────────────────

/** Nothing may require horizontal scrolling, at any sampled width (§7, §9). */
const expectNoSidewaysScroll = async (band: HTMLElement): Promise<void> => {
  await expect(band.scrollWidth).toBeLessThanOrEqual(band.clientWidth);
};

/** The band — the FIRST <section> in the frame (the card's own <section> is
 *  nested inside it, later in document order); its three children are
 *  TintedBand's fade in, tinted middle and fade out, in flow order (run D7,
 *  extracted in D29). */
const bandOf = (canvasElement: HTMLElement): HTMLElement =>
  canvasElement.querySelector('section') as HTMLElement;

const boxesOf = (canvasElement: HTMLElement): HTMLElement[] =>
  [...bandOf(canvasElement).children] as HTMLElement[];

/** ui/Container — the middle box's one child, and the column every `@`-step
 *  of the band asks, THE BAND SCALE's own `@4xl` included: the scale box
 *  between it and the grid is no container. */
const columnOf = (canvasElement: HTMLElement): HTMLElement =>
  boxesOf(canvasElement)[1].firstElementChild as HTMLElement;

/** THE BAND SCALE's box — the column's one child (the component header's
 *  paragraph of that name): ui/Container's two strings, no paint, no padding,
 *  holding the grid. */
const scaleBoxOf = (canvasElement: HTMLElement): HTMLElement =>
  columnOf(canvasElement).firstElementChild as HTMLElement;

/** The grid inside the scale box: its first child is the biography's region,
 *  its second the schedule card's (D14, G2-R2 a11y F2). */
const gridOf = (canvasElement: HTMLElement): HTMLElement =>
  scaleBoxOf(canvasElement).firstElementChild as HTMLElement;

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
 * WHERE THE TWO HALVES GO SIDE BY SIDE, derived rather than assumed: `@3xl`
 * is 48rem of CONTAINER width, and the container is ui/Container — the
 * column, found by structure, never as the grid's parent (since 2026-10-13
 * that is the scale box, which is no container). (The idiom is
 * PersonnelCard.stories' `sitsBeside`; only the box it measures differs.)
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
 * font — the titles, the eyebrow, the prose and the week.
 */
const realFaces = async (band: HTMLElement): Promise<void> => {
  const requests = new Map<string, string>();
  for (const element of band.querySelectorAll('h2, p, dt, dd')) {
    const style = getComputedStyle(element);
    const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    requests.set(font, `${requests.get(font) ?? ''}${element.textContent}`);
  }
  for (const [font, text] of requests) await document.fonts.load(font, text);
  await document.fonts.ready;
};

/**
 * THE BAND SCALE (the component header's paragraph of that name; §15.32
 * round 4), asserted where the play finds itself. The box's own declaration
 * must AGREE with the derivation: the theme remapped and the design pixel
 * declared inside the regime (to a ten-thousandth), nothing remapped and the
 * registered initial 1px outside it — and nothing around the box remaps. The
 * box is the column's width up to the 96rem cap and centred past it
 * (`bandColumnClasses`). Then every size the band prints is its 1401-window
 * size × the unit — the theme's own outside the scale: the „Despre" title on
 * `band`'s 36 (30 on a column under that step's 28rem `@md`), the eyebrow 14,
 * each paragraph 18, the card's title 30 (the card's own container, asked
 * the same way), each day 16, and the grid's rhythm — 40, 32 or 24 by its
 * container step.
 */
const expectBandScale = async (
  canvasElement: HTMLElement,
  about: HTMLElement,
  card: HTMLElement,
): Promise<void> => {
  const { regime, column, unit } = scaleOf(canvasElement);
  const box = scaleBoxOf(canvasElement);
  const columnBox = columnOf(canvasElement);

  await expect(remapped(box), 'the scale box remaps the theme').toBe(regime);
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

  // `band`'s step asks the NEAREST container: ui/Container for the
  // biography's title, the card itself for the card's (ui/Card is one).
  const step = (container: HTMLElement): number =>
    contentWidth(container) >= 28 * rem() ? 36 : 30;
  const title = within(about).getByRole('heading', { level: 2 });
  await near(fontSize(title), step(columnBox) * unit, 'the „Despre” title');
  await near(
    fontSize(title.previousElementSibling as HTMLElement),
    14 * unit,
    'the eyebrow',
  );
  for (const paragraph of (about.lastElementChild as HTMLElement).children) {
    await near(fontSize(paragraph), 18 * unit, 'a paragraph');
  }
  await near(
    fontSize(within(card).getByRole('heading', { level: 2 })),
    step(card) * unit,
    'the card’s title',
  );
  for (const day of card.querySelectorAll('dt')) {
    await near(fontSize(day), 16 * unit, 'a day');
  }
  const rhythm = column >= 48 * rem() ? 10 : column >= 32 * rem() ? 8 : 6;
  await near(
    parseFloat(getComputedStyle(gridOf(canvasElement)).paddingTop),
    rhythm * 4 * unit,
    'the band’s rhythm',
  );
};

/**
 * THE ARRANGEMENT (D14 + the owner's adaptability rule), asserted at whichever
 * one the runner lands in, so neither branch is ever silently skipped — every
 * length in the design unit (`scaleOf`), which outside THE BAND SCALE is the
 * theme's own.
 *
 * BOTH: the grid's two children are the biography's REGION and the card, in
 * that order, and the biography is a BOX in both arrangements — a flex column
 * with a real rect, never `display: contents` (the G2-R2 review's a11y F2: a
 * region that dissolved would lose its role in the engines ScheduleCard's THE
 * WEEK IS CENTRED paragraph names) — its opener over its paragraphs' block,
 * both inside its box.
 *
 * BESIDE (the wide step): ONE ROW. The card starts right of the biography,
 * `gap-x-12` — 48 in the unit — away; its width is EXACTLY eighty spacing
 * steps, 320 in the unit, at every window (round 2k, D53 — "fixed and remain
 * fixed"; the header's D53 · ONE WIDTH paragraph: 20rem outside the scale,
 * 320 design pixels in it), the prose track taking the rest; the grid is
 * outdented eight steps — 32 in the unit — past the scale box's edge while
 * the card's right edge stays on the box's (the column's, under the cap); the
 * biography fills the grid's content box from top to bottom (the row's tall
 * item, or stretched to the row if the card were taller) inside a symmetric
 * `py`, so the card's VERTICAL MIDDLE is the biography's middle within a pixel
 * AND the middle of the tinted box around the grid within a pixel (D37, round
 * 2g, the owner's "center it also verticaly in the lila section" — by
 * construction since G2-R2); and the card is NEVER STRETCHED — its border box
 * ends exactly where its content does (the <dl>'s bottom plus the card's own
 * padding and border), which fails the moment the card is pulled to the row's
 * height.
 *
 * STACKED (below the step — never in the scale, which starts at a 56rem
 * column): ONE column — the biography (the opener over the paragraphs) over
 * the card, the card's top at or below the biography's bottom, the
 * biography's, the opener's and the paragraphs' left edges within 1px of the
 * grid's and the biography's and the paragraphs' width the grid's own. The
 * CARD is D53's one width: 20rem wherever the column is at least that wide,
 * the column's own width only where it is narrower (a box cannot outgrow its
 * container without a sideways scroll, §7), and CENTRED on the grid within
 * 1px — so it shares the grid's left edge exactly when the column is narrower
 * than 20rem (the 320 frames; every phone until 2026-10-09's phone gutter,
 * ui/Container's THE PHONE GUTTER), and sits inset by the same margin on both
 * sides otherwise (the 390 frames since then, and the StackedTablet story).
 */
const expectArrangement = async (
  canvasElement: HTMLElement,
  about: HTMLElement,
  card: HTMLElement,
): Promise<void> => {
  const grid = gridOf(canvasElement);
  const opener = about.firstElementChild as HTMLElement;
  const prose = about.lastElementChild as HTMLElement;
  await expect(grid.children).toHaveLength(2);
  await expect(grid.firstElementChild).toBe(about);
  await expect(grid.lastElementChild).toBe(card);
  // A BOX at every width (G2-R2 a11y F2) — the one-row shape's premise.
  await expect(getComputedStyle(about).display).toBe('flex');

  const { unit } = scaleOf(canvasElement);
  const column = columnOf(canvasElement).getBoundingClientRect();
  const box = scaleBoxOf(canvasElement).getBoundingClientRect();
  const g = grid.getBoundingClientRect();
  const a = about.getBoundingClientRect();
  const o = opener.getBoundingClientRect();
  const p = prose.getBoundingClientRect();
  const c = card.getBoundingClientRect();
  await expect(a.height).toBeGreaterThan(0);
  await expect(o.height).toBeGreaterThan(0);
  await expect(p.height).toBeGreaterThan(0);
  // The opener over the paragraphs, both inside the biography's box.
  await expect(p.top).toBeGreaterThanOrEqual(o.bottom);
  await expect(o.top).toBeGreaterThanOrEqual(a.top - 1);
  await expect(p.bottom).toBeLessThanOrEqual(a.bottom + 1);

  // D53's one width — eighty spacing steps, the same in both arrangements:
  // 20rem outside THE BAND SCALE, 320 design pixels in it.
  const fixed = 320 * unit;

  if (sitsBeside(canvasElement)) {
    // THE PROSE OUTDENT (round 2d, on the grid since 2e): the grid starts
    // eight steps — 32 in the unit — LEFT of the scale box's edge, into the
    // gutter, and its right edge, where the card ends, is still the box's.
    await expect(Math.abs(box.left - g.left - 32 * unit)).toBeLessThanOrEqual(
      1,
    );
    await expect(Math.abs(g.right - box.right)).toBeLessThanOrEqual(1);
    await expect(Math.abs(c.right - g.right)).toBeLessThanOrEqual(1);
    await expect(Math.abs(a.left - g.left)).toBeLessThanOrEqual(1);
    await expect(Math.abs(o.left - g.left)).toBeLessThanOrEqual(1);
    await expect(Math.abs(p.left - g.left)).toBeLessThanOrEqual(1);
    await expect(c.left).toBeGreaterThan(a.right);
    // THE GAP between the prose's track and the card's: `gap-x-12`.
    await expect(Math.abs(c.left - a.right - 48 * unit)).toBeLessThanOrEqual(1);
    // ONE WIDTH (D53): exactly eighty steps, whatever the window — no share
    // of the free space, so no wider screen widens it but the design's own
    // pixel.
    await expect(Math.abs(c.width - fixed)).toBeLessThanOrEqual(1);
    // ONE ROW: the biography fills the grid's content box, top to bottom,
    // and the grid's rhythm is the same above and below it.
    const rhythm = getComputedStyle(grid);
    const above = parseFloat(rhythm.paddingTop);
    const below = parseFloat(rhythm.paddingBottom);
    await expect(above).toBe(below);
    await expect(Math.abs(a.top - (g.top + above))).toBeLessThanOrEqual(1);
    await expect(Math.abs(a.bottom - (g.bottom - below))).toBeLessThanOrEqual(
      1,
    );
    // D37 · CENTRED: the card's middle is the row's — the biography's — and
    // the tinted box's, the owner's actual words.
    const middle = (c.top + c.bottom) / 2;
    await expect(Math.abs(middle - (a.top + a.bottom) / 2)).toBeLessThanOrEqual(
      1,
    );
    const tinted = boxesOf(canvasElement)[1].getBoundingClientRect();
    await expect(
      Math.abs(middle - (tinted.top + tinted.bottom) / 2),
    ).toBeLessThanOrEqual(1);

    const list = card.querySelector('dl') as HTMLElement;
    const { paddingBottom, borderBottomWidth } = getComputedStyle(card);
    const contentEnd =
      list.getBoundingClientRect().bottom +
      parseFloat(paddingBottom) +
      parseFloat(borderBottomWidth);
    await expect(Math.abs(c.bottom - contentEnd)).toBeLessThanOrEqual(1);
    return;
  }

  await expect(c.top).toBeGreaterThanOrEqual(a.bottom);
  // No outdent below the step: the grid sits on the column's edge and the
  // biography starts on the grid's, at its full width.
  await expect(Math.abs(g.left - column.left)).toBeLessThanOrEqual(1);
  await expect(Math.abs(a.left - g.left)).toBeLessThanOrEqual(1);
  await expect(Math.abs(a.width - g.width)).toBeLessThanOrEqual(1);
  await expect(Math.abs(o.left - g.left)).toBeLessThanOrEqual(1);
  await expect(Math.abs(p.left - g.left)).toBeLessThanOrEqual(1);
  await expect(Math.abs(p.width - g.width)).toBeLessThanOrEqual(1);
  // THE CARD (D53): its 20rem, or the column where the column is narrower —
  // never wider than either — and centred on the grid, the same margin left
  // and right.
  await expect(
    Math.abs(c.width - Math.min(fixed, g.width)),
  ).toBeLessThanOrEqual(1);
  await expect(
    Math.abs((c.left + c.right) / 2 - (g.left + g.right) / 2),
  ).toBeLessThanOrEqual(1);
};

/**
 * THE PHONE PIN IS NOT VACUOUS: a story pinned to the smartphone must really
 * have taken the stacked branch above whenever the window is narrower than
 * the step — the column is narrower still, so beside is impossible there. At
 * a wider window (the visual runner's 1536) the derived branch stands alone.
 */
const expectStackedOnAPhone = async (
  canvasElement: HTMLElement,
): Promise<void> => {
  if (window.innerWidth < 48 * rem()) {
    await expect(sitsBeside(canvasElement)).toBe(false);
  }
};

/** The week as the card prints it: seven terms, seven values (lib/hours' ONE
 *  ROW PER DAY — closed days in place). */
const expectSevenDays = async (card: HTMLElement): Promise<void> => {
  await expect(card.querySelectorAll('dt')).toHaveLength(7);
  await expect(card.querySelectorAll('dd')).toHaveLength(7);
};

// ── STORIES ────────────────────────────────────────────────────────────────

/**
 * THE EVERYDAY PICTURE — three paragraphs about the doctor beside the white
 * card with her week, at the laptop width the §13 matrix samples, in Romanian.
 *
 * This is the frame where the whole design is visible at once: the soft
 * lavender arriving out of the page ground through the top fade, the prose
 * taking the whole row but the card's one fixed width (D53 — eighty spacing
 * steps; the header's measurements), the card centred on the band
 * at its own height rather than stretching to the prose's (D37), its title
 * alone above the week, and the tint leaving again
 * through the bottom fade (TintedBand's ground, run D29 — its own Default
 * story measures the tint's ratio and the seam). At the laptop pin the whole
 * band is drawn in THE BAND SCALE (§15.32 round 4): the frame the owner's
 * 1401-window design is proven at × s, not skipped. The play measures what a
 * picture cannot — the card's one width against the measured grid and every
 * other length in the design unit, the card's
 * middle against the band's, the card's own height, that the two openers
 * really are two <h2>s rather than styled text, that each half is a region
 * named by its own <h2> and the band is not (the G2-R2 review's a11y F2), and
 * that the card prints no eyebrow.
 *
 * **1536 · 320 (`stress-320`):** at the stress width the same markup is one
 * column 288px wide — the prose, then the card under it at the same width —
 * and 18px prose still has to fit without a sideways scroll.
 */
export const Default: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { about: ELENA_ABOUT, schedule: ELENA_SCHEDULE },
  play: async ({ canvas, canvasElement }) => {
    const headings = canvas.getAllByRole('heading', { level: 2 });
    await expect(headings.map((heading) => heading.textContent)).toEqual([
      ELENA_ABOUT.title,
      ELENA_SCHEDULE.title,
    ]);
    await expect(canvas.getByText(ELENA_ABOUT.eyebrow)).toBeVisible();
    for (const paragraph of ELENA_ABOUT.paragraphs) {
      await expect(canvas.getByText(paragraph)).toBeVisible();
    }

    // TWO REGIONS, biography then week, each named by its own <h2> title
    // ALONE (exact-match names — an eyebrow read into the name fails), and
    // never the band's root (G2-R2 a11y F2: a landmark walk stops on the
    // doctor's story as well as on the card).
    const about = canvas.getByRole('region', { name: ELENA_ABOUT.title });
    const card = canvas.getByRole('region', { name: ELENA_SCHEDULE.title });
    const regions = canvas.getAllByRole('region');
    await expect(regions).toHaveLength(2);
    await expect(regions[0]).toBe(about);
    await expect(regions[1]).toBe(card);
    await expect(regions).not.toContain(bandOf(canvasElement));
    // D37: the card's opener is its <h2> alone — no eyebrow row, so no <p>
    // anywhere in the card (the week is <dt>/<dd>).
    await expect(card.querySelectorAll('p')).toHaveLength(0);
    await expectSevenDays(card);
    await realFaces(bandOf(canvasElement));
    // THE SCALE IS NOT VACUOUS HERE: from a 1280 window — §7's Notebook — the
    // column clears the step even beside a classic scrollbar (1009px), so in a
    // runner with a mouse and a registering engine the laptop pin MUST land
    // the band in THE BAND SCALE, and the assertions below run × s.
    if (
      window.innerWidth >= 1280 &&
      window.matchMedia('(pointer: fine)').matches &&
      CSS.supports('color', 'rgb(from red r g b)')
    ) {
      await expect(scaleOf(canvasElement).regime).toBe(true);
    }
    await expectBandScale(canvasElement, about, card);
    await expectArrangement(canvasElement, about, card);
    // THE MIDPOINT AND OWN-HEIGHT PROOFS ARE NOT VACUOUS HERE: beside the
    // prose, the card is SHORTER than the paragraphs alone, so it sits
    // strictly inside the row — its top below the opener's, its bottom above
    // the last paragraph's. A stretched card would then fail
    // expectArrangement's natural-height check, and a card pinned to either
    // end of the row would miss the midpoint by more than half the prose's
    // surplus, instead of passing both by coincidence. (The story's
    // paragraphs are kept long enough for this — the contract's rule is to
    // lengthen the fixture, never loosen the assertion.)
    if (sitsBeside(canvasElement)) {
      const opener = (
        about.firstElementChild as HTMLElement
      ).getBoundingClientRect();
      const prose = about.lastElementChild as HTMLElement;
      const lastParagraph = (
        prose.lastElementChild as HTMLElement
      ).getBoundingClientRect();
      const c = card.getBoundingClientRect();
      await expect(c.height).toBeLessThan(prose.getBoundingClientRect().height);
      await expect(c.top).toBeGreaterThan(opener.top + 1);
      await expect(lastParagraph.bottom).toBeGreaterThan(c.bottom + 1);
    }
    await expectNoSidewaysScroll(bandOf(canvasElement));
  },
};

/**
 * THE STACKED ARRANGEMENT — the phone, where the column (351px at 390) is far
 * under the 48rem step, so the prose comes first and the white card follows
 * it: the owner's adaptability rule, "one above the other" below the step.
 * Since 2026-10-09's phone gutter (ui/Container's THE PHONE GUTTER) the
 * column is WIDER than the card's 20rem here (D53) — 351px, 336 beside the
 * runner's classic scrollbar, where it was 312 — so the card keeps its one
 * width, centred under the prose, ~15.5px of tint aside (~8 beside the
 * scrollbar). It yields to the column only at the 320 stress width (288px),
 * because a wider box would scroll sideways (§7). StackedTablet is the same
 * stack with more room to spare.
 *
 * It is the same markup as `Default` and deliberately so: the subject is the
 * ONE grid changing its track list at the step, with DOM order = reading order
 * in both arrangements. The play derives the arrangement from the measured
 * column, so it proves the stacked branch here and the beside branch when the
 * visual runner renders this same story at 1536.
 */
export const Stacked: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  args: { about: ELENA_ABOUT, schedule: ELENA_SCHEDULE },
  play: async ({ canvas, canvasElement }) => {
    const card = canvas.getByRole('region', { name: ELENA_SCHEDULE.title });
    const about = canvas.getByRole('region', { name: ELENA_ABOUT.title });

    // Stacked or beside, the doctor's words come FIRST — in the DOM and in the
    // reading order a screen reader follows, region before region.
    await expect(
      about.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await realFaces(bandOf(canvasElement));
    await expectStackedOnAPhone(canvasElement);
    await expectBandScale(canvasElement, about, card);
    await expectArrangement(canvasElement, about, card);
    await expectSevenDays(card);
    await expectNoSidewaysScroll(bandOf(canvasElement));
  },
};

/**
 * THE STACK WITH ROOM TO SPARE — the tablet, where the column (614px at 768)
 * is still under the 48rem step, so the arrangement is `Stacked`'s, but now
 * WIDER than the card's 20rem: the width where round 2k's D53 is visible
 * below the step. Before it the card followed the column to its full 614px;
 * now it keeps its one 20rem and sits centred under the prose, the tint
 * showing on both sides of it — "should not be widening … or tighten", the
 * owner's words, in the stacked half of the page.
 *
 * WHY A STORY OF ITS OWN: every other stacked frame here is pinned to the
 * phone, whose column was narrower than 20rem until 2026-10-09 (312px at 390,
 * 256 at 320) — so there the card took the column's width and "centred" was
 * true by construction, proving nothing. Since the phone gutter
 * (ui/Container's THE PHONE GUTTER) the 390 frames centre a card narrower than
 * their column too, by ~8px a side in the runner — a margin a pixel's
 * tolerance can still tell; this story keeps the wide case, ~140px of tint
 * aside, and the guard below, which fires only between a 30rem and a 48rem
 * window. Pinned to the tablet, the play measures a card strictly narrower
 * than its column and centres it for real. The visual runner photographs
 * `Sections/*` at 390 + 1536 only (§13), where this frame is `Stacked`'s and
 * `Default`'s; the width it exists for is the Vitest pin.
 */
export const StackedTablet: Story = {
  globals: { locale: 'ro', viewport: { value: 'tablet' } },
  args: { about: ELENA_ABOUT, schedule: ELENA_SCHEDULE },
  play: async ({ canvas, canvasElement }) => {
    const card = canvas.getByRole('region', { name: ELENA_SCHEDULE.title });
    const about = canvas.getByRole('region', { name: ELENA_ABOUT.title });
    const grid = gridOf(canvasElement);
    await realFaces(bandOf(canvasElement));

    // NOT VACUOUS: whenever the window is no wider than the step (48rem) yet
    // wide enough that its column clears 20rem (a 30rem window: its column is
    // 27rem under the 2026-10-09 phone gutter — 24 before — a little less
    // beside a classic scrollbar), the arrangement MUST be stacked and
    // the card MUST sit strictly inside its column, a margin on each side. At
    // the visual runner's 390 and 1536 this guard stands down and the derived
    // branch in expectArrangement stands alone.
    if (window.innerWidth >= 30 * rem() && window.innerWidth <= 48 * rem()) {
      await expect(sitsBeside(canvasElement)).toBe(false);
      const g = grid.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      await expect(g.width).toBeGreaterThan(20 * rem() + 1);
      await expect(c.left).toBeGreaterThan(g.left + 1);
      await expect(g.right).toBeGreaterThan(c.right + 1);
    }
    await expectBandScale(canvasElement, about, card);
    await expectArrangement(canvasElement, about, card);
    await expectSevenDays(card);
    await expectNoSidewaysScroll(bandOf(canvasElement));
  },
};

/**
 * GERMAN, THE LONGEST LOCALE (§8.4: ≈ +30–35% over English) — the phone width,
 * carrying the words this band is most likely to break on: three paragraphs
 * built out of `Kieferorthopädie`, `Röntgenaufnahmen`, `Behandlungsdauer` and
 * `Behandlungsschritt`, and „Geschlossen" as the closed-day value, the longest
 * word any row of the card can print beside a weekday.
 *
 * `lang="de"` rides the native prop spread onto the <section> (the
 * Card/Heading/PersonnelCard precedent) and inherits to every child, which is
 * the whole mechanism: the body's site-wide `hyphens: auto` (§15.14) picks the
 * GERMAN dictionary, so a compound in a 288px column breaks at a syllable
 * instead of pushing the layout open. ONE element in this band opts out of it:
 * the biography's title, because it carries a person's name (DoctorProfile's
 * THE NAME IS NEVER SPLIT, 2026-09-30) — so this story's „Über Dr. Elena Marin"
 * wraps between words and never as „Ma-rin". Everything else here is prose or
 * a heading that may break at a syllable, and the §15.14 rider's "never split a
 * control label" covers no element in the frame.
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
    schedule: {
      title: 'Wann Sie mich in der Praxis finden',
      rows: formatHoursRows(DOCTOR_WEEK, 'de', 'Geschlossen'),
    },
  },
  play: async ({ canvas, canvasElement }) => {
    const band = bandOf(canvasElement);
    await expect(band).toHaveAttribute('lang', 'de');
    await expect(
      canvas.getByRole('heading', { level: 2, name: 'Über Dr. Elena Marin' }),
    ).toBeVisible();

    // The biography's region takes its German title as its name, exactly.
    const about = canvas.getByRole('region', { name: 'Über Dr. Elena Marin' });
    const card = canvas.getByRole('region', {
      name: 'Wann Sie mich in der Praxis finden',
    });
    await expect(canvas.getByText('Montag')).toBeVisible();
    await expect(canvas.getAllByText('Geschlossen')).toHaveLength(2);
    await expectSevenDays(card);
    await realFaces(band);
    await expectStackedOnAPhone(canvasElement);
    await expectBandScale(canvasElement, about, card);
    await expectArrangement(canvasElement, about, card);
    await expectNoSidewaysScroll(band);
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
 * and D20 split, the DoctorCourses pseudo story's rule): the „Despre" eyebrow
 * (the card has none since D37), the two titles and the closed-day word are
 * `team.doctor.*` keys, so they carry the
 * preview's own ACCENT map and the `·` padding at 40% of the source length;
 * the PARAGRAPHS are data travelling with the doctor in `lib/team`, and the
 * weekday words are the browser's own Intl output — neither ever passes
 * through a message file, so pseudo-ing them would be a picture of a pipeline
 * this site does not have. The about title is the ICU message `Despre {name}`
 * put through the transform: the argument passes through untouched and the
 * doctor's name is inserted afterwards, which is why it stays itself between
 * the accented word and the padding. What is sampled is the width the real
 * pipeline would produce, not a longer string someone invented.
 *
 * **390 · 320 (`stress-320`):** the padded schedule title — the page's
 * „Când mă găsiți la clinică" put through the transform — has to wrap inside
 * the card's content box, and the padded closed value has to share its row
 * with a weekday without either one clipping.
 */
export const PseudoLocale: Story = {
  tags: ['stress-320'],
  globals: { locale: 'pseudo', viewport: { value: 'smartphone' } },
  args: {
    about: {
      eyebrow: 'Bíógráfíé ····',
      title: 'Déšpré Dr. Elena Marin ······',
      paragraphs: ELENA_ABOUT.paragraphs,
    },
    schedule: {
      title: 'Çâñd mă găšíțí lá çlíñíçă ··········',
      rows: formatHoursRows(DOCTOR_WEEK, 'ro', 'Îñçhíš ···'),
    },
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getAllByRole('heading', { level: 2 })).toHaveLength(2);
    await expect(canvas.getByText('Bíógráfíé ····')).toBeVisible();

    // The padded title names the biography's region, padding and all.
    const about = canvas.getByRole('region', {
      name: 'Déšpré Dr. Elena Marin ······',
    });
    const card = canvas.getByRole('region', {
      name: 'Çâñd mă găšíțí lá çlíñíçă ··········',
    });
    // The data half stayed itself — that is the point of the frame.
    await expect(canvas.getByText('Luni')).toBeVisible();
    await expect(canvas.getAllByText('Îñçhíš ···')).toHaveLength(2);
    await expectSevenDays(card);
    await realFaces(bandOf(canvasElement));
    await expectStackedOnAPhone(canvasElement);
    await expectBandScale(canvasElement, about, card);
    await expectArrangement(canvasElement, about, card);
    await expectNoSidewaysScroll(bandOf(canvasElement));
  },
};
