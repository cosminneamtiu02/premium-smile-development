import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor, within } from 'storybook/test';
import { DoctorCourses, type CourseGroup } from './DoctorCourses';

// SIX stories, and the count is the honest one: the everyday band at the
// laptop width, the phone, the two expansion stresses — and, since round 2g
// (D35), the two states of the current year: `Rest`, a page scrolled to its
// top where every year is grey and faded, and `Current`, the same page
// scrolled until the second year's top reaches the middle of the window
// (D49), brought forward. The export NAMES are load-bearing — each one names
// a baseline file
// (`sections-doctorcourses--default`, `sections-doctorcourses--rest`, …),
// so renaming or adding an export re-records pictures; this list IS the
// section's contribution to the visual manifest. The `Sections/*` title prefix
// routes every one of them to 390 + 1536 (tests/visual/stories.spec.ts, §13)
// — except `Current`, tagged 'no-visual' (its own comment says why); the
// 'stress-320' tag adds the accessibility width to the three whose layout has
// something to say there (a 256px column of 18px course lines, a German
// compound inside it, a 40%-expanded section title). Round 2e's `OneYear`
// story is GONE with the alternation it pictured (D34): a single year is now
// drawn exactly like any other, and the band's suite pins it.
//
// ── EVERY STORY PINS ITS OWN LANGUAGE AND ITS OWN VIEWPORT with per-story
// `globals`, and both halves are load-bearing:
//   · the locale pin, even though this band reads no message file (its strings
//     are props — the doctor page owns the keys and the data): the preview
//     decorator stamps `<html lang>` from that global, and `hyphens: auto`
//     (§15.14) picks its dictionary from the declared language. Flip the
//     toolbar to Pseudo over any story here and nothing changes — that is the
//     §8.9 sweep PASSING, and the reason the pseudo stress below is typed out
//     as a fixture instead of produced by the toolbar (the DoctorProfile /
//     PersonnelCard precedent);
//   · the viewport pin, because the rail's measure depends on the column it
//     is handed: as wide as the column on a phone, capped at 56rem
//     (`max-w-4xl`, D34) from a ~1120px viewport. The Vitest runner applies
//     the pin (addon-vitest sets the page to the story's `globals.viewport`
//     before the play runs); Playwright ignores it and sets its own page size
//     per project — which is why the arrangement assertion DERIVES the
//     expected rail width from the measured column instead of assuming the
//     pinned one.
//
// ── THE OWNER'S TIMELINE, round 2g ("now that i think about it, the line
// should be on the left side, not centered" — D34), round 2j (D44 — the
// years on the 30px `section` step, the gap between subsections doubled, the
// line drawn in one STRETCH per subsection) and round 2k (D50 — "keep some
// space empty until start of next subsection"): what to look at in every
// frame is the line down the left of the rail, a DOT on it at each year with
// a short break of bare ground above it, and every year's words 40px in from
// the line, one year under the other at every width, 80px between them. The
// play functions read the geometry back in numbers, because a dot a few
// pixels off its line is exactly the kind of flaw a screenshot reviewer's eye
// slides over: every stretch 1.5 spacing units in from the rail's edge,
// beginning at its dot's centre and ending 0.25rem ABOVE the next group's
// top, at least 8px clear of the next dot's ring (the last ends at its own
// box's end); every dot's centre ON its stretch within 1px and level with its
// year's line.
//
// ── THE CURRENT YEAR (D35 — "upon scrolling highlight top dot with year and
// dots … all are grayed out at rest"; D44c — "bring up front with a 'come
// for you' on a theoretical z axis animation and bring color to it, while
// others are fainter"; D49 — "move at the center of the screen on y axis the
// line activating 'current'"). The band's island, ./CourseTimeline, brings
// forward the LAST year whose top has crossed the MIDDLE of the window — the
// whole subsection at 1.04 and full colour — and fades every other.
//   · A CANVAS THAT OPENS ON THE BAND OPENS ON A CURRENT YEAR. In `Default`,
//     `Stacked`, `GermanLongest` and `PseudoLocale` the band sits at the top
//     of the canvas, the first years' tops above the middle from the first
//     frame, so the last of them comes forward at mount — the band's everyday
//     look once it is on screen, and since round 2k the honest picture
//     (rounds 2g–2j measured against the landing line 6rem under the header,
//     which the top of a canvas never reached, so those frames were all
//     rest). Their plays read the arrangement AS LAID OUT, the current
//     group's scale undone (`laidOut`), so the contract holds whichever year
//     is lit and at any instant of its forward motion.
//   · THE TWO STATE STORIES stand the band under a TALL INTRO (the page's
//     opener and profile band, played by a decorator), so the rail really
//     starts below the middle: `Rest` is what every doctor page's static HTML
//     holds; `Current` scrolls until the second year's top reaches the middle,
//     over a tail that keeps the document from ending first (the spy's bottom
//     rule would light the LAST year there). The spacers are in REM, never
//     `vh`: a full-page capture may lay the page out against a taller
//     viewport, and a `vh` spacer would grow with it.
//   · THAT SAME CAPTURE MAY MOVE THE MIDDLE. A viewport laid out as tall as
//     the page would put its middle at the PAGE's middle, and the spy
//     re-reads the window's height on every walk. The evidence says today's
//     Chromium capture does not relayout (CLAUDE.md §15.20 round 3: the price
//     menu's 1280×800 frames showed its `100dvh` belt clipped at the 800px
//     window's own height), but `Rest` is built not to care: it carries NO
//     tail, so its intro alone is taller than the band, which keeps the first
//     year's top below the page's own middle as well as the window's — its
//     play pins both premises — and the frame is rest whichever height a
//     capture lays it out at. The pixel net's reduced motion makes any
//     current-year switch instant, so no frame is caught mid-motion.
// Every story starts at the TOP of the page (the meta's `beforeEach`, which
// also puts the scroll back afterwards): the Vitest runner renders the
// stories one after another in one document, and a scroll left behind by
// `Current` would otherwise light a year in the next story.
//
// ── THE OWNER'S ADAPTABILITY RULE (2026-09-25, D21): anything side by side on
// the desktop MUST stack one above the other on phones. Since D34 nothing in
// this band stands side by side at any width, and the plays still assert it
// — each year's top at or under the previous year's bottom, every group on
// the rail's left edge and as wide as the rail — on every smartphone-pinned
// story and on the laptop one alike.
//
// ── `layout: 'fullscreen'` for the reason ClinicLocation and DoctorProfile set
// it: the band is full-bleed and owns its gutter through ui/Container, so
// Storybook's default canvas padding would add a second inset on top of it.
//
// ── NO MOCK MESSAGES AND NO `parameters.nextjs`: the band reads no message
// file and links nowhere; its one island reads the scroll position, nothing
// else (§16).
//
// Demo courses are INVENTED (no real doctor, no real certificate), in lib/team's
// round-2 shape (D17: the year left the line and became its group's label):
// Romanian with diacritics (§15.7), factual — no superlatives, no promises
// (CMSR advertising rules for dental practices, in force since 2025-07-01) —
// and D-DASH-clean, place after a comma. The real doctors, in five languages,
// are the owner's to author (§15.17).

const EYEBROW = 'Formare continuă';
const TITLE = 'Cursuri și specializări';

/** Four years, newest first — the page's order — the first with two lines so
 *  one group shows two bullets (D17's demo rule). */
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

/** The same four years in German (DRAFTED, §15.17): the longest locale's long
 *  compounds — „Fachzahnarztausbildung", „Kieferorthopädie" — in a 256px
 *  column is the case this frame exists for. */
const GERMAN_GROUPS = [
  {
    year: '2024',
    courses: [
      'Kurs für Zahnkorrektur mit transparenten Schienen, Bukarest',
      'Fortbildung in digitaler Kieferorthopädie und intraoraler Scannertechnik, Cluj-Napoca',
    ],
  },
  {
    year: '2023',
    courses: [
      'Kongress der Europäischen Gesellschaft für Kieferorthopädie, Wien',
    ],
  },
  {
    year: '2021',
    courses: [
      'Kurs für interzeptive Kieferorthopädie bei Kindern, Cluj-Napoca',
    ],
  },
  {
    year: '2016',
    courses: [
      'Fachzahnarztausbildung für Kieferorthopädie und dentofaziale Orthopädie, Universität für Medizin und Pharmazie „Carol Davila“, Bukarest',
    ],
  },
] as const satisfies readonly CourseGroup[];

/** Nothing may require horizontal scrolling, at any sampled width (§7, §9). */
const expectNoSidewaysScroll = async (element: HTMLElement): Promise<void> => {
  await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
};

/**
 * A length in CSS pixels, read against the document's own font size rather
 * than a baked-in 16 — a visitor who has enlarged the browser's base font
 * moves every rem on the page (the DoctorProfile / PersonnelCard reasoning).
 */
const stepPx = (rem: number): number =>
  rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

/**
 * The box every `@`-variant in this band is read against: ui/Container's own
 * column, the band's first child, with no border or padding, so its
 * border-box IS the content box a container query asks about. The
 * FRACTIONAL box, never `clientWidth` — that integer would disagree with the
 * engine inside a sub-pixel window.
 */
const columnOf = (band: HTMLElement): DOMRect =>
  (band.firstElementChild as HTMLElement).getBoundingClientRect();

/** The year headings in DOM order — reached by their role. */
const yearsOf = (band: HTMLElement): HTMLElement[] =>
  within(band).getAllByRole('heading', { level: 3 });

/** The year groups in DOM order, one level up from the <h3> each opens. */
const groupsOf = (band: HTMLElement): HTMLElement[] =>
  yearsOf(band).map((year) => year.parentElement as HTMLElement);

/**
 * The rail — the column of groups itself since round 2j (D44c deleted the
 * continuous line and the box that held it) — one level up from any group.
 * Each group's stretch of line is its FIRST child and its dot the SECOND:
 * both are aria-hidden paint with no role to query by, so they are reached by
 * structure (CourseTimeline's RAIL paragraph).
 */
const railOf = (group: HTMLElement): HTMLElement =>
  group.parentElement as HTMLElement;

const stretchOf = (group: HTMLElement): HTMLElement =>
  group.children[0] as HTMLElement;

const dotOf = (group: HTMLElement): HTMLElement =>
  group.children[1] as HTMLElement;

/** The groups the island has lit — `data-current`, present only while lit. */
const litOf = (band: HTMLElement): HTMLElement[] =>
  groupsOf(band).filter((group) => group.hasAttribute('data-current'));

const centreX = (box: DOMRect): number => box.left + box.width / 2;
const centreY = (box: DOMRect): number => box.top + box.height / 2;

/**
 * Where every stretch's centre sits, measured from the rail's left edge:
 * `start-1.25` (1.25 spacing units) plus half of the 2px `w-0.5` —
 * CourseTimeline's arithmetic behind "on the line by construction".
 * 1.5 spacing units: 6px at the 16px root, and the same ratio at any other.
 */
const LINE_X = (): number => stepPx(0.375);

/** The ring every dot wears (`ring-4`): a 4px box-shadow at every root size,
 *  never rem — the one pixel length in the dot's geometry. */
const RING = 4;

/**
 * The scale a group is DRAWN at: 1 at rest, 1.04 once current — the
 * `scale-104` it wears in both motion worlds, under the forward motion's
 * final `transform` of 1 or under no animation at all — from 1.0 up to the
 * overshoot's ~1.065 while it comes forward, and between 1.04 and 1 while a
 * group that has just lost the light recedes (the G2-R2 tier-2 fold, react
 * F1). Read off the computed style, which reports an animation's and a
 * transition's CURRENT frame: the `transform` the keyframes write, times the
 * separate `scale` property Tailwind v4's `scale-*` sets (and the recede
 * eases).
 */
const drawnScaleOf = (group: HTMLElement): number => {
  const style = getComputedStyle(group);
  const transform =
    style.transform === 'none' ? 1 : new DOMMatrix(style.transform).a;
  const scale = style.scale === 'none' ? 1 : parseFloat(style.scale);
  return transform * scale;
};

/**
 * A box inside `group` AS LAID OUT, before the group's scale. A current group
 * is drawn scaled about `origin-left` — the middle of its left edge — and
 * getBoundingClientRect reports what is drawn, so every point is mapped back
 * through that one scale: x from the group's left edge, y from its vertical
 * middle, the two lines the scale leaves where they are. A resting group's
 * scale is 1 and the box comes back as measured — or, for the 300ms of its
 * recede, its eased scale is undone like any other. A dot's OWN scale (the lit
 * `scale-125` and its pop, about its own centre) is not undone — only the
 * dot's centre, which that scale keeps, is ever read.
 */
const laidOut = (box: DOMRect, group: HTMLElement): DOMRect => {
  const drawn = group.getBoundingClientRect();
  const scale = drawnScaleOf(group);
  const middle = drawn.top + drawn.height / 2;
  return DOMRect.fromRect({
    x: drawn.left + (box.left - drawn.left) / scale,
    y: middle + (box.top - middle) / scale,
    width: box.width / scale,
    height: box.height / scale,
  });
};

/**
 * THE ARRANGEMENT CONTRACT, ONE RECIPE AT EVERY WIDTH (D34, D44, D50),
 * derived rather than assumed, and read AS LAID OUT (`laidOut`) — so it holds
 * at rest and with a year current alike, which since D49 is what every
 * top-of-canvas story opens on (the header's CURRENT YEAR); the current
 * year's DRAWN geometry is `Current`'s to read:
 *   · the rail starts on the column's left edge and is as wide as the column
 *     up to the 56rem cap (`max-w-4xl`);
 *   · one year per row — each group's top 5rem under the previous group's
 *     bottom (the doubled `gap-20`, D44b) — every group on the rail's left
 *     edge and as wide as the rail: the D21 rider, one above the other;
 *   · every STRETCH's centre 1.5 spacing units in from the rail's left edge;
 *     it begins at its dot's centre (nothing of the line above the first
 *     dot) and ends 0.25rem ABOVE the next group's top (D50), with at least
 *     8px of bare ground between its end and the next dot's ring — 12px at
 *     the 16px root: the break above every dot — the last one at its own
 *     group's bottom;
 *   · EVERY dot's centre is ON its stretch — x within 1px of the stretch's
 *     centre — and inside its year's <h3> box vertically, so it marks the
 *     year.
 * Every box is read in ONE synchronous pass before the first assertion, so a
 * year coming forward mid-play cannot mix two frames. Tolerances are 1px
 * because boxes land on fractional pixels.
 */
const expectArrangement = async (band: HTMLElement): Promise<void> => {
  const years = yearsOf(band);
  const groups = groupsOf(band);
  const rail = railOf(groups[0]).getBoundingClientRect();
  const boxes = groups.map((group) =>
    laidOut(group.getBoundingClientRect(), group),
  );
  const stretches = groups.map((group) =>
    laidOut(stretchOf(group).getBoundingClientRect(), group),
  );
  const dots = groups.map((group) =>
    laidOut(dotOf(group).getBoundingClientRect(), group),
  );
  const yearBoxes = groups.map((group, index) =>
    laidOut(years[index].getBoundingClientRect(), group),
  );
  /** A dot's laid-out half height — `size-3`, before any scale of its own. */
  const dotHalf = (index: number): number =>
    dotOf(groups[index]).offsetHeight / 2;

  // A collapsed box would satisfy the comparisons below by accident — every
  // group, every stretch and every dot must occupy real space first.
  for (const box of [...boxes, ...stretches, ...dots]) {
    await expect(box.height).toBeGreaterThan(0);
    await expect(box.width).toBeGreaterThan(0);
  }

  // The rail: the column's left edge, the column's width up to the cap.
  const column = columnOf(band);
  await expect(Math.abs(rail.left - column.left)).toBeLessThanOrEqual(1);
  await expect(
    Math.abs(rail.width - Math.min(column.width, stepPx(56))),
  ).toBeLessThanOrEqual(1);

  // The line starts at the FIRST dot's centre — nothing above it.
  await expect(
    Math.abs(stretches[0].top - centreY(dots[0])),
  ).toBeLessThanOrEqual(1);

  for (const [index, box] of boxes.entries()) {
    const stretch = stretches[index];
    const dot = dots[index];
    if (index > 0) {
      // One year per row, 5rem apart — the doubled gap (D44b).
      await expect(
        Math.abs(box.top - boxes[index - 1].bottom - stepPx(5)),
      ).toBeLessThanOrEqual(1);
    }
    await expect(Math.abs(box.left - rail.left)).toBeLessThanOrEqual(1);
    await expect(Math.abs(box.width - rail.width)).toBeLessThanOrEqual(1);

    // The stretch: down the left, from its dot's centre…
    const stretchX = centreX(stretch);
    await expect(Math.abs(stretchX - rail.left - LINE_X())).toBeLessThanOrEqual(
      1,
    );
    await expect(Math.abs(stretch.top - centreY(dot))).toBeLessThanOrEqual(1);
    const next = boxes[index + 1];
    if (next) {
      // …to 0.25rem above the next group's top (D50)…
      await expect(
        Math.abs(stretch.bottom - (next.top - stepPx(0.25))),
      ).toBeLessThanOrEqual(1);
      // …so bare ground separates it from the next dot's ring: 0.25rem + the
      // dot's `top-3` − its 4px ring, 12px at the 16px root, never under 8.
      const ringTop = centreY(dots[index + 1]) - dotHalf(index + 1) - RING;
      await expect(ringTop - stretch.bottom).toBeGreaterThanOrEqual(8);
    } else {
      // …or, the last, to its own group's end.
      await expect(Math.abs(stretch.bottom - box.bottom)).toBeLessThanOrEqual(
        1,
      );
    }

    // The dot sits ON its stretch, level with its year.
    await expect(Math.abs(centreX(dot) - stretchX)).toBeLessThanOrEqual(1);
    const year = yearBoxes[index];
    await expect(centreY(dot)).toBeGreaterThanOrEqual(year.top);
    await expect(centreY(dot)).toBeLessThanOrEqual(year.bottom);
  }
};

/** The facts a picture cannot show: a named region, its one <h2>, one <h3>
 *  per year in order, one list per year — each year's computed size the
 *  `section` step's 1.875rem (D44a: "at least the size of what is now
 *  current heading", 30px, large text by size alone) and its computed weight
 *  at 700 or more, current or not, because the bold is the `accent` tone's
 *  construction (ui/Heading, D16) and what keeps its grey twin from
 *  reflowing when it lights (`accent-idle`, D35). */
const expectOutline = async (
  band: HTMLElement,
  title: string,
  years: readonly string[],
): Promise<void> => {
  await expect(
    within(band).getByRole('heading', { level: 2, name: title }),
  ).toBeInTheDocument();
  const headings = within(band).getAllByRole('heading', { level: 3 });
  await expect(headings.map((heading) => heading.textContent)).toEqual([
    ...years,
  ]);
  for (const heading of headings) {
    await expect(
      Math.abs(parseFloat(getComputedStyle(heading).fontSize) - stepPx(1.875)),
    ).toBeLessThanOrEqual(0.5);
    await expect(
      Number(getComputedStyle(heading).fontWeight),
    ).toBeGreaterThanOrEqual(700);
  }
  await expect(within(band).getAllByRole('list')).toHaveLength(years.length);
};

/** The page's `scroll-padding-top` in pixels — the LANDING line's height
 *  (the header pill's reach), which the middle line ignores; `Current` reads
 *  it only to show a year lit far below it. READ, never asserted: its value
 *  is the pill's reach, spelled in Header.tsx's mount contract and nowhere
 *  else (the G2-R2 tier-2 typescript review, F3). */
const scrollPadding = (): number =>
  parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);

/** The middle of the window — the spy's `line: 'middle'` (D49). */
const middleY = (): number => window.innerHeight / 2;

/**
 * The scroll offset at which `group`'s top sits ON the middle of the window —
 * the spy's own arithmetic (`rect.top ≤ innerHeight / 2`, bare top, no margin
 * and no padding), independent of where the page is now. The half is
 * FLOORED, so an odd window's half pixel lands the top just inside the line.
 * Read it while the group is at REST: a current group's drawn top sits above
 * its laid-out top.
 */
const middleOf = (group: HTMLElement): number =>
  Math.round(group.getBoundingClientRect().top + window.scrollY) -
  Math.floor(middleY());

/** Jump, never glide: the shell's `scroll-behavior: smooth` would stream the
 *  page there over several frames, and the assertion would chase it. */
const jumpTo = (top: number): void => {
  window.scrollTo({ top, behavior: 'instant' });
};

/**
 * Make the island WALK, then give it a frame to publish: a scroll event the
 * spy's own listener answers with a fresh reading of the page. Without it a
 * "nothing is lit" could be read before the island's effect had started the
 * spy at all — true, and proving nothing.
 */
const walked = async (): Promise<void> => {
  window.dispatchEvent(new Event('scroll'));
  for (let frame = 0; frame < 2; frame += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

/** The page's grey and lilac, as the engine serializes the two tokens:
 *  `--line` #d8d4cf and `--accent-decorative` #7a6d9c. */
const LINE_RGB = 'rgb(216, 212, 207)';
const ACCENT_RGB = 'rgb(122, 109, 156)';

/** The CSS animations of one name running (or held by their fill) on an
 *  element — `forward` on a current group, `pop` on its dot. */
const animationsOn = (element: Element, name: string): Animation[] =>
  element
    .getAnimations()
    .filter(
      (animation) =>
        animation instanceof CSSAnimation && animation.animationName === name,
    );

/** The fade a resting subsection wears (D44c), as the engine serializes it. */
const REST_OPACITY = '0.65';

/** How far a group is scaled: its drawn width over its laid-out width. */
const scaleOf = (element: HTMLElement): number =>
  element.getBoundingClientRect().width / element.offsetWidth;

/** The times, in ms after the swap, the hand-over's clocks are SEEKED to. */
const HAND_OVER_MS = [0, 40, 150, 300] as const;

type HandOverMs = (typeof HAND_OVER_MS)[number];

/** The four sizes a hand-over moves, at one seeked time: each group's drawn
 *  scale and each dot's DRAWN — its own scale × its group's. */
type Drawn = Readonly<{
  entering: number;
  receding: number;
  enteringDot: number;
  recedingDot: number;
}>;

const kindOf = (animation: Animation): string => {
  if (animation instanceof CSSTransition) {
    return `transition:${animation.transitionProperty}`;
  }
  if (animation instanceof CSSAnimation) {
    return `animation:${animation.animationName}`;
  }
  return 'other';
};

/** An element's transition LIST as the stylesheet resolves it — read off the
 *  computed style, so it holds however the clocks themselves fared. */
const transitionListOf = (element: HTMLElement): string[] =>
  getComputedStyle(element).transitionProperty.split(/,\s*/);

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));

/**
 * THE CLOCKS THAT DRAW THE SIZES, waited for and then held (the G2-R2
 * full-run flake). Checked at once, then once a frame for at most a second,
 * until every labelled [element, kind] in `wanted` has run; then EVERY
 * animation the `elements` carry is paused. Only the SIZE clocks are waited
 * for, because only they are certain: a year lit and handed on within about
 * a frame (this play's own two jumps can land that close under load) has its
 * entry fade cancelled while still at its start value, and CSS then starts no
 * reverse fade at all — the group's `opacity`, the dot's `background-color`
 * (measured, and forced in a variant of this play: the full run's
 * `['transition:scale']`, three times in three). So the transition LISTS are
 * pinned off the computed style (`transitionListOf`), never off the live
 * clocks. Returns the kinds still missing at the deadline (none, on a pass)
 * and the held clocks.
 */
const holdSizeClocks = async (
  elements: readonly HTMLElement[],
  wanted: ReadonlyArray<
    readonly [label: string, element: HTMLElement, kind: string]
  >,
): Promise<Readonly<{ missing: readonly string[]; held: Animation[] }>> => {
  // A clock counts once SEEN, so one late clock cannot make a short one that
  // ended while the loop waited read as missing too.
  const seen = new Set<string>();
  const missingNow = (): string[] => {
    for (const [label, element, kind] of wanted) {
      if (element.getAnimations().some((clock) => kindOf(clock) === kind)) {
        seen.add(label);
      }
    }
    return wanted
      .filter(([label]) => !seen.has(label))
      .map(([label, , kind]) => `${label}: ${kind}`);
  };
  const deadline = performance.now() + 1_000;
  let missing = missingNow();
  while (missing.length > 0 && performance.now() < deadline) {
    await nextFrame();
    missing = missingNow();
  }
  const held = elements.flatMap((element) => element.getAnimations());
  for (const animation of held) animation.pause();
  return { missing, held };
};

/**
 * Seek the held clocks together through HAND_OVER_MS, reading the four drawn
 * sizes at each, then play them again from zero, so the hand-over still plays
 * out on screen as a visitor would see it. Seeked, not timed: the numbers are
 * the stylesheet's arithmetic, never a busy runner's frame rate.
 */
const seekHandOver = (
  held: readonly Animation[],
  entering: HTMLElement,
  receding: HTMLElement,
): Readonly<Record<HandOverMs, Drawn>> => {
  const at = (ms: number): Drawn => {
    for (const animation of held) animation.currentTime = ms;
    return {
      entering: drawnScaleOf(entering),
      receding: drawnScaleOf(receding),
      enteringDot: scaleOf(dotOf(entering)),
      recedingDot: scaleOf(dotOf(receding)),
    };
  };
  const drawn = { 0: at(0), 40: at(40), 150: at(150), 300: at(300) };
  for (const animation of held) {
    animation.currentTime = 0;
    animation.play();
  }
  return drawn;
};

/**
 * THE HAND-OVER, CAUGHT AT ITS COMMIT (react F1 of the G2-R2 tier-2 review).
 * A MutationObserver on the two groups fires as a microtask straight after
 * React writes the swap, before the browser renders a frame of it, and
 * resolves once `entering` is lit and `receding` is not — the one commit
 * that hands the light over; `holdSizeClocks` then takes it from there.
 * Rejects after two seconds, so a hand-over that never comes fails HERE, by
 * name, rather than timing the whole play out.
 */
const catchHandOver = (
  receding: HTMLElement,
  entering: HTMLElement,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      if (
        !entering.hasAttribute('data-current') ||
        receding.hasAttribute('data-current')
      ) {
        return;
      }
      window.clearTimeout(timer);
      observer.disconnect();
      resolve();
    });
    const timer = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error('catchHandOver: no hand-over commit within 2s'));
    }, 2_000);
    for (const group of [receding, entering]) {
      observer.observe(group, { attributeFilter: ['class', 'data-current'] });
    }
  });

/**
 * THE INTRO (`Rest`'s decorator): 81rem of page above the band — ~150 % of
 * the laptop's 864px, standing in for the doctor's opener and profile band —
 * and NOTHING below it: taller than the band at every sampled width, so the
 * first year's top sits below the middle of the window AND of the page (the
 * header's CURRENT YEAR, on the full-page capture). REM, not `vh`.
 */
const withIntro: Decorator = (Story) => (
  <>
    <div style={{ height: '81rem' }} />
    <Story />
  </>
);

/**
 * THE INTRO AND THE TAIL (`Current`'s decorator): the same intro, and 54rem
 * below the band, so that the second year's top can reach the middle of the
 * window without the document ending first (the spy's bottom rule would
 * light the LAST year there). REM, not `vh` — see the header.
 */
const withIntroAndTail: Decorator = (Story) => (
  <>
    <div style={{ height: '81rem' }} />
    <Story />
    <div style={{ height: '54rem' }} />
  </>
);

const meta = {
  title: 'Sections/DoctorCourses',
  component: DoctorCourses,
  parameters: { layout: 'fullscreen' },
  // Every story starts at the top of the page and leaves it there (the
  // header's LIT YEAR paragraph): one document, many stories.
  beforeEach: () => {
    jumpTo(0);
    return () => jumpTo(0);
  },
  args: {
    eyebrow: EYEBROW,
    title: TITLE,
    groups: GROUPS,
  },
  argTypes: {
    eyebrow: {
      control: 'text',
      description:
        'The mono micro-label over the title, finished and already translated (§8.1) — authored in SENTENCE case, because the uppercase is ui/Eyebrow’s CSS',
    },
    title: {
      control: 'text',
      description:
        'The band’s real <h2> and, through aria-labelledby, the region’s accessible name',
    },
    groups: {
      control: false,
      description:
        'The year groups, newest first — the page’s order, printed as given (lib/team’s `coursesByYear`, D17). `year` is a finished LABEL string, never a number: Intl.NumberFormat would print „2.024" in Romanian. Each year becomes an <h3> in ui/Heading’s section step (D44a) over a bulleted list of its lines, with a dot on its own stretch of the timeline’s line down the left (D34, D44c), each stretch ending a quarter rem above the next year so a short break sits above every dot (D50), 5rem between years (D44b). The year being read — the last whose top has crossed the MIDDLE of the window (D49) — COMES FORWARD as the visitor scrolls: the whole subsection scaled to 1.04 with an overshoot, its stretch and dot in the accent (the dot at 1.25 with a pop), the accent tone, the lines in full ink — and every other recedes, faded to 0.65 and grey (the accent-idle tone, D35): the band’s one island, ./CourseTimeline, on lib/scroll-spy. EMPTY renders nothing at all — no region, no heading',
    },
    className: {
      control: false,
      description:
        'Placement only, merged LAST onto the <section> (§6.4/§6.8). The band owns its paint, gutter and vertical rhythm; the page owns the space BETWEEN bands',
    },
  },
} satisfies Meta<typeof DoctorCourses>;

export default meta;
type Story = StoryObj<typeof meta>;

const YEARS = GROUPS.map((group) => group.year);

/**
 * THE EVERYDAY BAND — Romanian, at the laptop width: a grey line down the
 * left of the rail, a dot on it at each year, each year a bold 30px label
 * over the bullets of that year, newest first, one under the other, 5rem
 * apart (D34, D44). The rail stops at 56rem, so a course line reads at a
 * prose measure rather than across the whole ~1230px column. At the top of
 * the canvas the first years' tops already sit above the middle of the
 * window, so the last of them is CURRENT from the first frame — brought
 * forward in lilac, the others faded (D49; `Rest` is the all-grey static
 * HTML, `Current` the hand-over on scroll). Between the years the line breaks
 * a quarter rem above each dot (D50).
 *
 * **1536 · 320 (`stress-320`):** the same markup at every width — at the
 * stress width a 256px column of 18px course lines wrapping 40px in from the
 * line, nothing scrolling sideways. The play reads back what a picture
 * cannot: the outline, the computed bold, and the geometry against the
 * measured column.
 */
export const Default: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: TITLE });

    await expect(canvas.getByText(EYEBROW)).toBeVisible();
    await expectOutline(band, TITLE, YEARS);
    await expectArrangement(band);
    await expectNoSidewaysScroll(band);
  },
};

/**
 * THE PHONE — the owner's adaptability rule, held by construction (D21,
 * D34): the same line down the left, every year stacked under the last, its
 * dot on the line and its words 40px in from it. At 390 the column is 312px
 * and the rail fills it. The play pins the geometry: the line 1.5 spacing
 * units in from the rail's edge, every dot on it, one year per row.
 */
export const Stacked: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: TITLE });

    await expectOutline(band, TITLE, YEARS);
    await expectArrangement(band);
    await expectNoSidewaysScroll(band);
  },
};

/**
 * GERMAN, THE LONGEST LOCALE (§8.4: ≈ +30–35% over English) — the phone
 * width carrying the words this band is most likely to break on:
 * „Fachzahnarztausbildung für Kieferorthopädie und dentofaziale Orthopädie"
 * in an 18px serif line, under the heading pair „Fortbildung" / „Kurse und
 * Spezialisierungen" (DRAFTED, §15.17).
 *
 * `lang="de"` rides the native prop spread onto the BAND and inherits to every
 * child, which is the whole mechanism: `hyphens: auto` (§15.14) picks the
 * German dictionary, so a compound breaks at a syllable instead of pushing
 * the column open. The years are the same four digits in every language —
 * the page hands them over as finished labels.
 *
 * **390 · 320 (`stress-320`):** the line down the left edge and every dot on
 * it (the play pins it), and nothing scrolls sideways.
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  args: {
    eyebrow: 'Fortbildung',
    title: 'Kurse und Spezialisierungen',
    groups: GERMAN_GROUPS,
    lang: 'de',
  },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', {
      name: 'Kurse und Spezialisierungen',
    });

    await expect(band).toHaveAttribute('lang', 'de');
    await expect(canvas.getByText('Fortbildung')).toBeVisible();
    await expectOutline(
      band,
      'Kurse und Spezialisierungen',
      GERMAN_GROUPS.map((group) => group.year),
    );
    await expectArrangement(band);
    await expectNoSidewaysScroll(band);
  },
};

/**
 * PSEUDO-LOCALE (§8.9) — accented and ~40% expanded, TYPED OUT as a fixture
 * rather than produced by the toolbar, because the toolbar transforms message
 * files and this band reads none (its strings are props). Flipping any other
 * story here to Pseudo changes nothing, which is that sweep passing.
 *
 * WHAT IS TRANSFORMED IS EXACTLY WHAT A MESSAGE KEY WOULD BE: the eyebrow and
 * the title live in the `team` namespace, so they carry the accents and the
 * `·`-padding; the course lines and the years are DATA travelling with the
 * doctor in `lib/team` (D17), which never pass through a message file — so
 * they stay themselves here, as they would on the site (the DoctorProfile
 * precedent). The two strings are the Romanian originals put through the
 * preview's OWN transform (the same ACCENT map, the same `·`-padding at 40%
 * of the source length), so what is sampled is the width the real pipeline
 * produces.
 *
 * **390 · 320 (`stress-320`):** the expanded h2 has to absorb the growth by
 * WRAPPING inside a 312px — then 256px — column; every dot on the line (the
 * play pins it), nothing sideways.
 */
export const PseudoLocale: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  args: {
    eyebrow: 'Fórmáré çóñťíñúă ·······',
    title: 'Çúršúrí șí špéçíálížărí ··········',
  },
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', {
      name: 'Çúršúrí șí špéçíálížărí ··········',
    });

    await expect(canvas.getByText('Fórmáré çóñťíñúă ·······')).toBeVisible();
    // The data half stayed itself — that is the point of the frame.
    await expect(canvas.getByText(GROUPS[0].courses[0])).toBeVisible();
    await expectOutline(band, 'Çúršúrí șí špéçíálížărí ··········', YEARS);
    await expectArrangement(band);
    await expectNoSidewaysScroll(band);
  },
};

/**
 * ONE YEAR CURRENT (D35, D44c, D49) — the band under a tall intro, scrolled
 * by the play until the SECOND year's top sits on the MIDDLE of the window:
 * that whole subsection comes FORWARD — scaled to 1.04 from its left edge
 * with an overshoot, at full opacity, its stretch of line and its dot in the
 * accent (the dot bigger, popping), its label lilac, its lines in full ink —
 * and every other year recedes, faded to 0.65 and grey. The play walks the
 * owner's sentence in order: at the top nothing is current; two pixels short
 * of the middle still nothing; the first year's top reaches the middle and it
 * comes forward — while it is still far below the header, where rounds 2g–2j
 * lit it; the second reaches the middle and takes over, and the first
 * "returns to rest" — and that hand-over is caught at its commit, its size
 * clocks held and SEEKED (`catchHandOver`, `holdSizeClocks`,
 * `seekHandOver`) and each state's transition list read off the computed
 * style: the new year drawn at exactly 1.0 at the swap and rising past 1.04,
 * the old one easing back from 1.04, never snapping (react F1 of the G2-R2
 * tier-2 review) — and each group's dot with it, the new one popping from
 * its first keyframe as before, the old one shrinking from 1.25 × 1.04
 * instead of dropping to the group's size. It then reads the lit stretch's
 * DRAWN end against the next dot (D50): the 1.04 carries it a few pixels on,
 * never under the ring.
 *
 * 'no-visual': the frame depends on a scroll the play makes, and the pixel
 * net photographs the page without waiting for a play to finish — a picture
 * of this story would be a race between the two (and the forward motion,
 * mid-flight, a second one). Its play and its per-story axe run in the
 * Vitest storybook project, which checks the current year's contrast where
 * it is current and the faded years' where they are faded.
 */
export const Current: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  decorators: [withIntroAndTail],
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: TITLE });
    const groups = groupsOf(band);
    const years = yearsOf(band);
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    // The premise, asserted rather than assumed: the rail starts below the
    // middle of the window, and nothing is current.
    await expect(groups[0].getBoundingClientRect().top).toBeGreaterThan(
      middleY() + 1,
    );
    await walked();
    await expect(litOf(band)).toEqual([]);

    // Two pixels short of the middle: still nothing — the spy's one pixel of
    // grace, and no more.
    jumpTo(middleOf(groups[0]) - 2);
    await walked();
    await expect(litOf(band)).toEqual([]);

    // The first year's top reaches the MIDDLE (D49): it comes forward — its
    // top still far below the shell's scroll padding, the landing line under
    // the header pill that rounds 2g–2j lit a year at.
    jumpTo(middleOf(groups[0]));
    await waitFor(async () => {
      await expect(litOf(band)).toEqual([groups[0]]);
    });
    await expect(groups[0].getBoundingClientRect().top).toBeGreaterThan(
      scrollPadding() + stepPx(10),
    );

    // The second's top reaches it: it takes over, the first rests again. The
    // target is read BEFORE the jump, while the second group is at rest, and
    // the hand-over is caught at its commit (`catchHandOver`); its size clocks
    // are then held and SEEKED before anything else is awaited — microtasks
    // only, and frames only if a size clock is late (`holdSizeClocks`).
    const target = middleOf(groups[1]);
    const handedOver = catchHandOver(groups[0], groups[1]);
    jumpTo(target);
    await handedOver;
    const [entering, receding] = [groups[1], groups[0]];
    const { missing, held } = await holdSizeClocks(
      [entering, dotOf(entering), receding, dotOf(receding)],
      reduced
        ? []
        : [
            ['entering group', entering, 'animation:forward'],
            ['entering dot', dotOf(entering), 'animation:pop'],
            ['receding group', receding, 'transition:scale'],
            ['receding dot', dotOf(receding), 'transition:scale'],
          ],
    );
    const drawn = seekHandOver(held, entering, receding);
    await waitFor(async () => {
      await expect(litOf(band)).toEqual([groups[1]]);
    });
    // The jump really landed where the spy looks — not clamped short.
    await expect(Math.abs(window.scrollY - target)).toBeLessThanOrEqual(1);

    // THE HAND-OVER (react F1 of the G2-R2 tier-2 review, and its twin on the
    // dot). Each state carries its own transition LIST — pinned off the
    // computed style, which is deterministic — so the new year and its dot
    // never shrink before they grow and the old ones never snap; the SIZES
    // are the seeked clocks'.
    const lists = {
      entering: transitionListOf(entering),
      receding: transitionListOf(receding),
      enteringDot: transitionListOf(dotOf(entering)),
      recedingDot: transitionListOf(dotOf(receding)),
    };
    if (reduced) {
      // Less motion: no list and no clock at all, both ways at once — the new
      // year 1.04 and its dot 1.25 × 1.04, the old ones 1, at every instant.
      await expect(held).toEqual([]);
      for (const list of Object.values(lists)) {
        await expect(list).toEqual(['none']);
      }
      for (const ms of HAND_OVER_MS) {
        await expect(drawn[ms].entering).toBeCloseTo(1.04, 3);
        await expect(drawn[ms].receding).toBeCloseTo(1, 3);
        await expect(drawn[ms].enteringDot).toBeCloseTo(1.3, 2);
        await expect(drawn[ms].recedingDot).toBeCloseTo(1, 2);
      }
    } else {
      // Every clock that draws a size was running at the swap.
      await expect(missing).toEqual([]);
      // ENTRY: the current state eases opacity ALONE — no `scale` transition
      // to start under the animation's 0.9615 — so the new year is drawn at
      // exactly 1.0 at the swap, grows, and overshoots its settled 1.04.
      await expect(lists.entering).toEqual(['opacity']);
      await expect(drawn[0].entering).toBeCloseTo(1, 3);
      await expect(drawn[40].entering).toBeGreaterThan(drawn[0].entering);
      await expect(drawn[150].entering).toBeGreaterThan(1.05);
      // EXIT: the resting state eases opacity AND scale, so the old year
      // recedes from 1.04 — still nearly all of it at 40ms, where the first
      // cut read a flat 1 (the snap) — and is back at 1 by 300ms.
      await expect(lists.receding).toEqual(['opacity', 'scale']);
      await expect(drawn[0].receding).toBeCloseTo(1.04, 3);
      await expect(drawn[40].receding).toBeGreaterThan(1.03);
      await expect(drawn[150].receding).toBeLessThan(drawn[40].receding);
      await expect(drawn[150].receding).toBeGreaterThan(1);
      await expect(drawn[300].receding).toBeCloseTo(1, 3);
      // THE DOT, the same rule on its own 150ms clock. ENTRY unchanged: its
      // colours eased alone (`transition-colors`, no `scale`), so the
      // `scale-125` lands at once and the pop draws it from its first
      // keyframe — 0.7 × 1.25 × the group's 1.0.
      await expect(lists.enteringDot).toContain('background-color');
      await expect(lists.enteringDot).not.toContain('scale');
      await expect(drawn[0].enteringDot).toBeCloseTo(0.875, 2);
      await expect(drawn[40].enteringDot).toBeGreaterThan(drawn[0].enteringDot);
      // EXIT: at rest it eases its colour AND scale, so the old dot shrinks
      // from 1.25 × 1.04 — still far above the group's 1.04 at 40ms, where
      // the first cut had dropped it in one frame — and is 1 by 300ms.
      await expect(lists.recedingDot).toEqual(['background-color', 'scale']);
      await expect(drawn[0].recedingDot).toBeCloseTo(1.3, 2);
      await expect(drawn[40].recedingDot).toBeGreaterThan(1.1);
      await expect(drawn[150].recedingDot).toBeLessThan(drawn[40].recedingDot);
      await expect(drawn[300].recedingDot).toBeCloseTo(1, 2);
    }

    const current = groups[1];
    const others = groups.filter((group) => group !== current);

    // THE COLOURS AND THE FADE — the stylesheet's, once the 150ms colour
    // fades and the 300ms opacity fade have settled.
    await waitFor(async () => {
      await expect(getComputedStyle(current).opacity).toBe('1');
      await expect(getComputedStyle(stretchOf(current)).backgroundColor).toBe(
        ACCENT_RGB,
      );
      await expect(getComputedStyle(dotOf(current)).backgroundColor).toBe(
        ACCENT_RGB,
      );
      await expect(getComputedStyle(years[1]).color).toBe(ACCENT_RGB);
      for (const other of others) {
        await expect(getComputedStyle(other).opacity).toBe(REST_OPACITY);
        await expect(getComputedStyle(stretchOf(other)).backgroundColor).toBe(
          LINE_RGB,
        );
        await expect(getComputedStyle(dotOf(other)).backgroundColor).toBe(
          LINE_RGB,
        );
      }
    });

    // THE FORWARD MOTION (D44c) on the current group alone, and the pop
    // (D36) on its dot alone — unless the visitor asked for less motion, when
    // `motion-reduce:animate-none` leaves the colours and the fade to switch
    // by themselves. The year no longer pops on its own: it comes forward
    // with its subsection.
    await expect(animationsOn(current, 'forward')).toHaveLength(
      reduced ? 0 : 1,
    );
    await expect(animationsOn(dotOf(current), 'pop')).toHaveLength(
      reduced ? 0 : 1,
    );
    await expect(animationsOn(years[1], 'pop')).toHaveLength(0);
    for (const other of others) {
      await expect(animationsOn(other, 'forward')).toHaveLength(0);
      await expect(animationsOn(dotOf(other), 'pop')).toHaveLength(0);
    }

    // SETTLED FORWARD, in both motion worlds: the current subsection drawn at
    // 1.04 (the `scale-104` it wears, under the forward motion's final
    // `transform` of 1, or under no animation when motion is reduced), every
    // other one at 1 once its recede has eased out — and the current dot
    // 1.25 × 1.04 the size of a resting one: SHAPE, not only colour.
    await waitFor(async () => {
      await expect(scaleOf(current)).toBeCloseTo(1.04, 2);
      for (const other of others) {
        await expect(scaleOf(other)).toBeCloseTo(1, 3);
      }
      await expect(dotOf(current).getBoundingClientRect().width).toBeCloseTo(
        dotOf(others[0]).getBoundingClientRect().width * 1.25 * 1.04,
        0,
      );
    });

    // THE LIT STRETCH STOPS SHORT OF THE NEXT DOT (D50 — "the last few
    // millimetres of the line end, wipe them so that they do not cross the
    // next subsection"). DRAWN, once the forward motion has settled: it starts
    // at its own dot's centre (the group's one transform moves both alike),
    // and its end — laid out 0.25rem above the next group — is carried a few
    // pixels further by the 1.04 about the group's middle, yet stays clear of
    // the next year's resting dot AND its ring. The resting stretch below it
    // keeps the laid-out break (neither of its groups is scaled).
    await Promise.all(current.getAnimations().map(async (a) => a.finished));
    const own = stretchOf(current).getBoundingClientRect();
    const ownDot = dotOf(current).getBoundingClientRect();
    const nextTop = groups[2].getBoundingClientRect().top;
    const nextRingTop = dotOf(groups[2]).getBoundingClientRect().top - RING;
    await expect(Math.abs(own.top - centreY(ownDot))).toBeLessThanOrEqual(1);
    await expect(own.bottom).toBeGreaterThanOrEqual(nextTop - stepPx(0.25) - 1);
    await expect(own.bottom).toBeLessThan(nextRingTop);
    await expect(
      Math.abs(
        stretchOf(groups[2]).getBoundingClientRect().bottom -
          (groups[3].getBoundingClientRect().top - stepPx(0.25)),
      ),
    ).toBeLessThanOrEqual(1);

    // Coming forward opens no sideways scroll (§7): the 4 % lands in the
    // column's own free width, never past the band.
    await expectNoSidewaysScroll(band);
    // Nothing here is navigation: the state is emphasis only (D35).
    await expect(band.querySelector('[aria-current]')).toBeNull();
    // The scroll is left where it is, so the per-story axe checks the
    // CURRENT year's contrast and the faded years'; the meta's cleanup
    // returns the page to the top.
  },
};

/**
 * AT REST — the band under the same intro as `Current`, NOT scrolled, and
 * with no tail (the header's CURRENT YEAR says why): the rail starts far
 * below the middle of the window, so no year is current and every one is
 * grey and faded to 0.65 (D44c). This is the `topFallback: 'none'` proof
 * (D35): with the spy's default the FIRST year would be current here,
 * although the visitor is still reading the intro above it. The play pins the
 * premises too — the first year's top below the middle of the window AND of
 * the page, the page nowhere near its end (so the spy's bottom rule is out of
 * play) — and then the rest state itself: every group faded and unscaled,
 * every stretch and every dot grey, nothing moving, and the line broken a
 * quarter rem above every dot (D50, the arrangement contract).
 */
export const Rest: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  decorators: [withIntro],
  play: async ({ canvas }) => {
    const band = canvas.getByRole('region', { name: TITLE });
    const groups = groupsOf(band);

    await expect(window.scrollY).toBe(0);
    await expect(groups[0].getBoundingClientRect().top).toBeGreaterThan(
      middleY() + 1,
    );
    // Below the middle of the PAGE as well: a full-page capture laying the
    // page out against a viewport as tall as itself still reaches no year.
    await expect(groups[0].getBoundingClientRect().top).toBeGreaterThan(
      document.documentElement.scrollHeight / 2 + 1,
    );
    await expect(window.scrollY).toBeLessThan(
      document.documentElement.scrollHeight - window.innerHeight - 1,
    );

    await walked();
    await expect(litOf(band)).toEqual([]);
    await expect(band.querySelectorAll('[data-current]')).toHaveLength(0);
    for (const group of groups) {
      await expect(getComputedStyle(group).opacity).toBe(REST_OPACITY);
      await expect(scaleOf(group)).toBeCloseTo(1, 3);
      await expect(getComputedStyle(stretchOf(group)).backgroundColor).toBe(
        LINE_RGB,
      );
      await expect(getComputedStyle(dotOf(group)).backgroundColor).toBe(
        LINE_RGB,
      );
      await expect(animationsOn(group, 'forward')).toHaveLength(0);
      await expect(animationsOn(dotOf(group), 'pop')).toHaveLength(0);
    }
    await expectOutline(band, TITLE, YEARS);
    await expectArrangement(band);
  },
};
