import type { ReactElement, ReactNode } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Container } from '@/components/ui/Container/Container';
import { COURSES_INTERVAL_MS, DoctorCourses } from './DoctorCourses';

// SEVEN stories, and the count is the honest one: the everyday block at the
// laptop width and on the phone, the two stresses — German, the longest
// language, and the 320px accessibility width — a doctor with ONE course
// (the neutral rail: one idea has nothing to hand the light to), `Cycling`,
// the light moving from idea to idea at a short rhythm, for the eye and for
// the play that catches a hand-over, and `TrailLit`, the light on the LAST
// idea, whose stretch trails past the rail (CourseTimeline's THE TRAIL —
// round 7's pack, 2026-10-13), for the play that reads that trail through
// the whole forward motion. The export NAMES are load-bearing — each one
// names a baseline file (`sections-doctorcourses--default`,
// `sections-doctorcourses--single-idea`, …), so renaming or adding an export
// re-records pictures; this list IS the block's contribution to the visual
// manifest. The `Sections/*` title prefix routes every one of them to 390 +
// 1536 (tests/visual/stories.spec.ts, §13) — except `Cycling` and
// `TrailLit`, tagged 'no-visual' (a frame that moves by design is never a
// baseline); the 'stress-320' tag adds the accessibility width to the two
// whose layout has something to say there. The years, the scroll-driven
// light and their stories (`Rest`, `Current`) are history since 2026-10-13
// (CLAUDE.md §15.23 round 7).
//
// ── TWO WORLDS, ONE SET OF PLAYS. The pixel net runs with reduced motion
// (playwright.config.ts), so lib/clock declines the start and every frame it
// photographs is the NEUTRAL rail — every idea in full ink, every dot and
// stretch grey (CourseTimeline's THE STATES). The Vitest storybook project
// emulates no preference, so there the light runs: idea 1 lights after mount
// and moves on every COURSES_INTERVAL_MS. Every play therefore reads the
// arrangement AS LAID OUT (`laidOut` undoes a lit idea's scale), asserts the
// state that belongs to the world it finds itself in (`expectLight`), and
// never assumes WHICH idea is lit.
//
// ── THE DECORATOR IS WHAT sections/DoctorProfile GIVES THE BLOCK
// (DoctorCourses.tsx's A BLOCK, NOT A BAND): the page ground, ui/Container —
// its gutter, and the container the <h2>'s `band` step answers to — the BELT
// DoctorProfile's full-bleed outer wears, so a lit idea's forward overshoot
// is trimmed at the screen's edge here exactly as on the page, and the
// band's SHALLOWEST rhythm, `py-12`: 48px of ground above and below the
// block, the phone's (the band's `@lg:py-16` and `@3xl:py-20` are deeper).
// The ground below is load-bearing since 2026-10-13: the rail's TRAIL — the
// last idea's stretch, 2.25rem past the rail's box (CourseTimeline's THE
// TRAIL) — paints into it, and every play checks the trail against the least
// ground it will ever have (`expectTrail`). NOT the band scale: these
// stories draw the block in the theme's own sizes at every width (every
// number below is rem, read through `stepPx`), and DoctorProfile's stories
// show it scaled inside its band. Here the rail spans the whole column,
// where on the page it shares the row with the biography — so every course
// line is one line at 1536, and wraps on the phone pins.
//
// ── EVERY STORY PINS ITS OWN LANGUAGE AND ITS OWN VIEWPORT with per-story
// `globals`, and both halves are load-bearing:
//   · the locale pin, even though this block reads no message file (its
//     strings are props — the doctor page owns the keys and the data): the
//     preview decorator stamps `<html lang>` from that global, and `hyphens:
//     auto` (§15.14) picks its dictionary from the declared language. Flip the
//     toolbar to Pseudo over any story here and nothing changes — that is the
//     §8.9 sweep PASSING (the DoctorProfile / PersonnelCard precedent);
//   · the viewport pin, because the rail is as wide as the column it is
//     handed. The Vitest runner applies the pin (addon-vitest sets the page
//     to the story's `globals.viewport` before the play runs); Playwright
//     ignores it and sets its own page size per project — which is why every
//     assertion DERIVES what it expects from the measured boxes instead of
//     assuming the pinned width.
//
// ── THE OWNER'S RAIL (2026-10-13 — "jsut dot ideas, and each section will be
// jsut one dot … and maybe half the space"): what to look at in every frame
// is the line down the left of the rail, a DOT on it level with each idea's
// first line and a short break of bare ground above every dot, the words 40px
// in from the line, 40px between ideas — half the old 80px between years —
// and, the same evening, the line running on 36px past the last idea, "a
// stable trail. like the other ideas have". The play functions read the
// geometry back in numbers, because a dot a few pixels off its line is
// exactly the kind of flaw a screenshot reviewer's eye slides over
// (`expectRail`, `expectTrail`).
//
// ── `layout: 'fullscreen'` for the reason ClinicLocation and DoctorProfile set
// it: the decorator is full-bleed and owns its gutter through ui/Container,
// so Storybook's default canvas padding would add a second inset on top of
// it.
//
// ── NO MOCK MESSAGES AND NO `parameters.nextjs`: the block reads no message
// file and links nowhere; its one island reads the clock and whether the rail
// is on screen, nothing else (§16).
//
// Demo courses are INVENTED (no real doctor, no real certificate), in
// lib/team's shape — one course a line, the place after a comma: Romanian
// with diacritics (§15.7), factual — no superlatives, no promises (CMSR
// advertising rules for dental practices, in force since 2025-07-01) — and
// D-DASH-clean. The real doctors, in five languages, are the owner's to
// author (§15.17).

const EYEBROW = 'Repere din drumul meu spre specializare';
const TITLE = 'Cursuri și specializări';

/** Six ideas in the page's order — one course a line, the fourth long enough
 *  to wrap on a phone, so a play sees the dot stay on an idea's FIRST line. */
const ITEMS = [
  'Curs de reabilitare protetică pe implanturi, București',
  'Curs de chirurgie plastică parodontală, Cluj-Napoca',
  'Curs de endodonție sub microscop, Iași',
  'Curs de protetică digitală și amprentare optică, Timișoara',
  'Curs de restaurări adezive din ceramică, Sibiu',
  'Rezidențiat în protetică dentară',
] as const;

/** The same six in German (DRAFTED, §15.17), the longest language: its
 *  longest idea is 93 characters, with „computergestützter" and „Zahnersatz"
 *  inside it. The heading pair is the message file's own
 *  (`team.doctor.courses.*`). */
const GERMAN_EYEBROW = 'Stationen meines Weges zur Spezialisierung';
const GERMAN_TITLE = 'Kurse und Spezialisierungen';
const GERMAN_ITEMS = [
  'Kurs für implantatgetragene prothetische Versorgung, Bukarest',
  'Kurs für plastische Parodontalchirurgie, Cluj-Napoca',
  'Kurs für mikroskopgestützte Endodontie, Iași',
  'Fortbildung in digitaler Prothetik und computergestützter Fertigung von Zahnersatz, Timișoara',
  'Kurs für adhäsive Keramikrestaurationen, Sibiu',
  'Fachzahnärztliche Weiterbildung in Prothetik',
] as const;

/** `Cycling`'s rhythm: short enough to watch, longer than the 450ms forward
 *  motion, so a light always settles before it moves on. */
const CYCLING_INTERVAL_MS = 900;

/** THE BELT sections/DoctorProfile's full-bleed outer wears — spelled again
 *  here on purpose, the decorator standing in for that band (the header):
 *  `clip` for every engine that knows it, `hidden` only behind the
 *  `@supports not` gate, and `wrap-anywhere` inherited by every word. */
const BELT =
  'overflow-x-clip supports-[not_(overflow:clip)]:overflow-x-hidden wrap-anywhere';

/** The band's SHALLOWEST rhythm, `py-12` (48px — the phone's), the ground
 *  the rail's trail paints into (the header's DECORATOR paragraph). In rem,
 *  for `expectTrail`'s premise. */
const GROUND_REM = 3;

const OnThePage = ({ children }: { children: ReactNode }): ReactElement => (
  <div className={`${BELT} bg-page`}>
    <Container className="py-12">{children}</Container>
  </div>
);

/** The decorator, typed `Decorator` (the PersonnelCard precedent): an inline
 *  `(Story) => …` would be typed over the meta's args and fold into every
 *  story's. */
const onThePage: Decorator = (Story) => (
  <OnThePage>
    <Story />
  </OnThePage>
);

/**
 * A length in CSS pixels, read against the document's own font size rather
 * than a baked-in 16 — a visitor who has enlarged the browser's base font
 * moves every rem on the page (the DoctorProfile / PersonnelCard reasoning).
 */
const stepPx = (rem: number): number =>
  rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

/** The ring every dot wears (`ring-4`): a 4px box-shadow at every root size,
 *  never rem — the one pixel length in the dot's geometry. */
const RING = 4;

/** `actual` within `tolerance` of `expected`, the label and both numbers in
 *  the failure (ClinicLocation's stories' `near`). */
const near = async (
  actual: number,
  expected: number,
  label: string,
  tolerance: number,
): Promise<void> => {
  await expect(
    Math.abs(actual - expected),
    `${label}: ${actual} against ${expected}`,
  ).toBeLessThanOrEqual(tolerance);
};

/** An element's computed length — the used value, before any transform, so
 *  a lit dot's `scale-125` or a lit idea's 1.04 never reads into it — and
 *  never `offsetWidth`, whose integer would round a fraction away. */
const usedPx = (element: Element, property: 'width' | 'height'): number =>
  parseFloat(getComputedStyle(element)[property]);

/** The rail — the one list in the block, reached by its role. */
const railOf = (block: HTMLElement): HTMLElement =>
  within(block).getByRole('list');

/** The ideas in DOM order, reached by their role. */
const ideasOf = (block: HTMLElement): HTMLElement[] =>
  within(block).getAllByRole('listitem');

/** An idea's stretch of line is its FIRST child and its dot the SECOND: both
 *  are aria-hidden paint with no role to query by, so they are reached by
 *  structure (CourseTimeline's RAIL paragraph). */
const stretchOf = (idea: HTMLElement): HTMLElement =>
  idea.children[0] as HTMLElement;

const dotOf = (idea: HTMLElement): HTMLElement =>
  idea.children[1] as HTMLElement;

/** The ideas the island has lit — `data-current`, present only while lit. */
const litOf = (block: HTMLElement): HTMLElement[] =>
  ideasOf(block).filter((idea) => idea.hasAttribute('data-current'));

/** The idea's first line of words, as drawn: the first box a Range over its
 *  text reports — the glyphs' own inline box, whose vertical centre is the
 *  line box's to within half a pixel (the leading is shared above and below
 *  it, round the face's ascent and descent in whole pixels). */
const firstLineOf = (idea: HTMLElement): DOMRect => {
  const words = idea.lastChild;
  if (words === null || words.nodeType !== Node.TEXT_NODE) {
    throw new Error('DoctorCourses story: an idea lost its words');
  }
  const range = document.createRange();
  range.selectNodeContents(words);
  const [first] = range.getClientRects();
  if (first === undefined) {
    throw new Error('DoctorCourses story: an idea’s words draw no box');
  }
  return first;
};

const centreX = (box: DOMRect): number => box.left + box.width / 2;
const centreY = (box: DOMRect): number => box.top + box.height / 2;

/**
 * Does this world ask for less motion? The pixel net's does (playwright
 * .config.ts), the Vitest storybook project's does not — and a person
 * reviewing in Storybook may have it on in the system's settings.
 */
const reducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The scale an idea is DRAWN at: 1 neutral or idle, 1.04 once lit — the
 * `scale-104` it wears, under the forward motion's final `transform` of 1 —
 * from 1.0 up to the overshoot's ~1.065 while it comes forward, and between
 * 1.04 and 1 while an idea that has just lost the light recedes. Read off
 * the computed style, which reports an animation's and a transition's
 * CURRENT frame: the `transform` the keyframes write, times the separate
 * `scale` property Tailwind v4's `scale-*` sets (and the recede eases).
 */
const drawnScaleOf = (idea: HTMLElement): number => {
  const style = getComputedStyle(idea);
  const transform =
    style.transform === 'none' ? 1 : new DOMMatrix(style.transform).a;
  const scale = style.scale === 'none' ? 1 : parseFloat(style.scale);
  return transform * scale;
};

/**
 * A box inside `idea` AS LAID OUT, before the idea's scale. A lit idea is
 * drawn scaled about `origin-left` — the middle of its left edge — and
 * getBoundingClientRect reports what is drawn, so every point is mapped back
 * through that one scale: x from the idea's left edge, y from its vertical
 * middle, the two lines the scale leaves where they are. A resting idea's
 * scale is 1 and the box comes back as measured. A dot's OWN scale (the lit
 * `scale-125` and its pop, about its own centre) is not undone — only the
 * dot's centre, which that scale keeps, is ever read.
 */
const laidOut = (box: DOMRect, idea: HTMLElement): DOMRect => {
  const drawn = idea.getBoundingClientRect();
  const scale = drawnScaleOf(idea);
  const middle = drawn.top + drawn.height / 2;
  return DOMRect.fromRect({
    x: drawn.left + (box.left - drawn.left) / scale,
    y: middle + (box.top - middle) / scale,
    width: box.width / scale,
    height: box.height / scale,
  });
};

/**
 * Nothing may require horizontal scrolling, at any sampled width (§7, §9) —
 * checked where it can be seen WITHOUT timing: the DOCUMENT (what a visitor
 * would pan) and every box whose words could overflow, the block's title and
 * each idea. The decorator's belt hides whatever passes the screen's edge, so
 * the document alone could not see a word too wide for the column; a box's
 * OWN transform never counts toward its own `scrollWidth`, so each idea is a
 * race-free witness of its words while the light comes forward.
 */
const expectNoSidewaysScroll = async (block: HTMLElement): Promise<void> => {
  const root = document.documentElement;
  await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  const boxes = [
    within(block).getByRole('heading', { level: 2 }),
    ...ideasOf(block),
  ];
  // Never vacuous: the title and every idea are read.
  await expect(boxes.length).toBeGreaterThan(1);
  for (const box of boxes) {
    await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
  }
};

/**
 * The block's faces loaded before a box is read — the display face of the
 * <h2>, the mono face of the eyebrow, the body face of the ideas. The plays
 * read boxes whose height follows how the words wrap, and the preview's
 * faces are `font-display: block`: until a face arrives its text is laid out
 * in the fallback. `load()` asks for the exact face each element wears
 * (DoctorStats' `loadFace`); `ready` settles the relayout.
 */
const loadFaces = async (block: HTMLElement): Promise<void> => {
  const title = within(block).getByRole('heading', { level: 2 });
  const wearers = [title, title.previousElementSibling, ideasOf(block)[0]];
  for (const element of wearers) {
    if (!(element instanceof HTMLElement)) {
      throw new Error('DoctorCourses story: a face’s wearer is missing');
    }
    const style = getComputedStyle(element);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      element.textContent ?? '',
    );
  }
  await document.fonts.ready;
};

/**
 * The facts a picture cannot show: a named region, its one <h2> — 36px from
 * the column's 28rem, 30px under it (ui/Heading's `band` step answers to
 * ui/Container) — the eyebrow on the one eyebrow step, ONE list of the
 * ideas in the given order and words, each idea 18px on a 28px line, and no
 * other heading (the years and their <h3>s are gone).
 */
const expectOutline = async (
  block: HTMLElement,
  title: string,
  items: readonly string[],
): Promise<void> => {
  const heading = within(block).getByRole('heading', { level: 2, name: title });
  await expect(within(block).getAllByRole('heading')).toEqual([heading]);
  const column = (block.parentElement as HTMLElement).getBoundingClientRect();
  const fontSize = (element: Element): number =>
    parseFloat(getComputedStyle(element).fontSize);
  await near(
    fontSize(heading),
    stepPx(column.width >= stepPx(28) ? 2.25 : 1.875),
    'the h2',
    0.05,
  );
  const eyebrow = heading.previousElementSibling;
  await expect(eyebrow?.tagName).toBe('P');
  await near(fontSize(eyebrow as Element), stepPx(0.875), 'the eyebrow', 0.05);
  await expect(within(block).getAllByRole('list')).toHaveLength(1);
  const ideas = ideasOf(block);
  await expect(ideas.map((idea) => idea.textContent)).toEqual([...items]);
  for (const idea of ideas) {
    await near(fontSize(idea), stepPx(1.125), 'an idea’s words', 0.05);
    await near(
      parseFloat(getComputedStyle(idea).lineHeight),
      stepPx(1.75),
      'an idea’s line',
      0.05,
    );
  }
};

/**
 * THE ARRANGEMENT CONTRACT (CourseTimeline's RAIL paragraph), derived rather
 * than assumed, and read AS LAID OUT (`laidOut`) — so it holds with the rail
 * neutral, with an idea lit and in the middle of a hand-over alike. Every
 * box is read in ONE synchronous pass before the first assertion, so a light
 * moving on mid-play cannot mix two frames:
 *   · the rail as wide as the block and on its left edge, 24px (1.5rem)
 *     under the opener — the block's `gap-6`;
 *   · one idea per row, each on the rail's left edge and as wide as the
 *     rail, 40px (2.5rem) under the one before — `gap-10`, half the old gap;
 *   · every STRETCH 2px wide with its centre 1.5 spacing units (6px) in from
 *     the rail's edge; it begins at its dot's centre (nothing of the line
 *     above the first dot) and ends 2.25rem (36px) below its own idea's
 *     bottom — EVERY stretch, the last's included: one recipe, so under the
 *     last idea it is THE TRAIL (`expectTrail` reads where it paints) — which,
 *     where another idea follows, is one spacing unit (4px) ABOVE that idea's
 *     top, with 8px of bare ground between its end and the next dot's ring
 *     (0.25rem + 0.5rem less the 4px ring): the break above every dot;
 *   · EVERY dot 12px, its centre ON its stretch and ON its idea's first
 *     line: within half a pixel of the line box's centre (the idea's top +
 *     half its line height — measured 0) and within a pixel of the drawn
 *     glyphs' own (`firstLineOf` — measured 0.5).
 * Tolerances are 1px where boxes land on fractional pixels and meet, half a
 * pixel where the contract names it.
 */
const expectRail = async (block: HTMLElement): Promise<void> => {
  const opener = block.firstElementChild as HTMLElement;
  const rail = railOf(block);
  const ideas = ideasOf(block);
  const blockBox = block.getBoundingClientRect();
  const openerBox = opener.getBoundingClientRect();
  const railBox = rail.getBoundingClientRect();
  const boxes = ideas.map((idea) =>
    laidOut(idea.getBoundingClientRect(), idea),
  );
  const stretches = ideas.map((idea) =>
    laidOut(stretchOf(idea).getBoundingClientRect(), idea),
  );
  const dots = ideas.map((idea) =>
    laidOut(dotOf(idea).getBoundingClientRect(), idea),
  );
  const lines = ideas.map((idea) => laidOut(firstLineOf(idea), idea));
  const lineHeights = ideas.map((idea) =>
    parseFloat(getComputedStyle(idea).lineHeight),
  );
  const dotSizes = ideas.map((idea) => usedPx(dotOf(idea), 'height'));
  const stretchWidths = ideas.map((idea) => usedPx(stretchOf(idea), 'width'));

  // A collapsed box would satisfy the comparisons below by accident — every
  // idea, every stretch and every dot must occupy real space first.
  for (const box of [...boxes, ...stretches, ...dots]) {
    await expect(box.height).toBeGreaterThan(0);
    await expect(box.width).toBeGreaterThan(0);
  }

  await near(railBox.left, blockBox.left, 'the rail’s left edge', 1);
  await near(railBox.width, blockBox.width, 'the rail’s width', 1);
  await near(
    railBox.top - openerBox.bottom,
    stepPx(1.5),
    'the opener → rail gap',
    1,
  );

  for (const [index, box] of boxes.entries()) {
    const stretch = stretches[index];
    const dot = dots[index];
    const label = `idea ${index + 1}`;
    if (index > 0) {
      await near(
        box.top - boxes[index - 1].bottom,
        stepPx(2.5),
        `${label}: the gap above`,
        1,
      );
    }
    await near(box.left, railBox.left, `${label}: its left edge`, 1);
    await near(box.width, railBox.width, `${label}: its width`, 1);

    // The stretch: 2px, down the left, from its dot's centre…
    await near(stretchWidths[index], stepPx(0.125), `${label}: the line`, 0.05);
    await near(
      centreX(stretch) - railBox.left,
      stepPx(0.375),
      `${label}: the line's x`,
      1,
    );
    await near(stretch.top, centreY(dot), `${label}: the line's start`, 1);
    // …to 2.25rem past its own idea — EVERY stretch, the last's included:
    // one recipe, so under the last idea it is THE TRAIL…
    await near(
      stretch.bottom,
      box.bottom + stepPx(2.25),
      `${label}: the line's end`,
      1,
    );
    const next = boxes[index + 1];
    if (next) {
      // …which is one spacing unit above the next idea's top (D50)…
      await near(
        stretch.bottom,
        next.top - stepPx(0.25),
        `${label}: the line's end above the next idea`,
        1,
      );
      // …so bare ground separates it from the next dot's ring.
      const ringTop = centreY(dots[index + 1]) - dotSizes[index + 1] / 2 - RING;
      await near(
        ringTop - stretch.bottom,
        stepPx(0.75) - RING,
        `${label}: the break above the next dot`,
        1,
      );
    }

    // The dot: 12px, ON its stretch, level with the idea's FIRST line.
    await near(dotSizes[index], stepPx(0.75), `${label}: the dot`, 0.05);
    await near(centreX(dot), centreX(stretch), `${label}: the dot's x`, 1);
    await near(
      centreY(dot),
      box.top + lineHeights[index] / 2,
      `${label}: the dot on the first line box`,
      0.5,
    );
    // The glyphs' own box sits 0.5px off its line box's centre (measured, at
    // every width and in both languages: Chromium rounds the face's ascent and
    // descent to whole pixels and splits the leading around them), so the
    // words are held to a pixel — the line box above is the half-pixel pin.
    await near(
      centreY(dot),
      centreY(lines[index]),
      `${label}: the dot on the first line's words`,
      1,
    );
  }
};

/**
 * THE TRAIL STAYS ON THE GROUND BELOW THE RAIL (CourseTimeline's THE TRAIL).
 * The last idea's stretch reaches 2.25rem past the rail's box, and no layout
 * reserves that room: the trail paints into whatever ground lies under the
 * block — on the page sections/DoctorProfile's bottom padding, here the
 * decorator's, the band's shallowest (`GROUND_REM`). Read DRAWN — whatever
 * the light is doing, a lit last idea's 1.04 included — and in ONE
 * synchronous pass, as `expectRail` reads: the premise first (the ground
 * really is that deep, so a decorator that lost it fails by name), then the
 * trail's end below the block's own box — it really trails — and above the
 * ground's lower edge — it never paints past the ground it was given.
 */
const expectTrail = async (block: HTMLElement): Promise<void> => {
  const ground = block.parentElement as HTMLElement;
  const ideas = ideasOf(block);
  const trail = stretchOf(ideas[ideas.length - 1]).getBoundingClientRect();
  const blockBox = block.getBoundingClientRect();
  const groundBox = ground.getBoundingClientRect();
  const depth = parseFloat(getComputedStyle(ground).paddingBottom);

  await near(depth, stepPx(GROUND_REM), 'the ground below the block', 0.05);
  await expect(
    trail.bottom,
    `the trail's end (${trail.bottom}) past the block's bottom (${blockBox.bottom})`,
  ).toBeGreaterThan(blockBox.bottom);
  await expect(
    trail.bottom,
    `the trail's end (${trail.bottom}) above the ground's lower edge (${groundBox.bottom})`,
  ).toBeLessThan(groundBox.bottom);
};

/** The page's grey and lilac, as the engine serializes the two tokens:
 *  `--line` #d8d4cf and `--accent-decorative` #7a6d9c. */
const LINE_RGB = 'rgb(216, 212, 207)';
const ACCENT_RGB = 'rgb(122, 109, 156)';

/** The fade a resting idea wears, as the engine serializes it. */
const IDLE_OPACITY = '0.65';

/** The CSS animations of one name running (or held by their fill) on an
 *  element — `forward` on a lit idea, `pop` on its dot. */
const animationsOn = (element: Element, name: string): Animation[] =>
  element
    .getAnimations()
    .filter(
      (animation) =>
        animation instanceof CSSAnimation && animation.animationName === name,
    );

/**
 * THE STATE THIS WORLD OWES (the header's TWO WORLDS). Less motion: the
 * NEUTRAL rail — nothing lit, every idea at full opacity and unscaled, every
 * stretch and dot grey, nothing animating. Motion allowed: exactly ONE idea
 * lit — whichever the clock has reached — at full opacity with its stretch
 * and its dot in the accent, every other idea faded to 0.65 and grey, once
 * the 300ms fades have settled (`waitFor` re-reads the light each time, so a
 * hand-over mid-check only delays the answer).
 */
const expectLight = async (block: HTMLElement): Promise<void> => {
  const ideas = ideasOf(block);
  if (reducedMotion()) {
    await expect(litOf(block)).toEqual([]);
    for (const idea of ideas) {
      await expect(getComputedStyle(idea).opacity).toBe('1');
      await expect(drawnScaleOf(idea)).toBeCloseTo(1, 3);
      await expect(getComputedStyle(stretchOf(idea)).backgroundColor).toBe(
        LINE_RGB,
      );
      await expect(getComputedStyle(dotOf(idea)).backgroundColor).toBe(
        LINE_RGB,
      );
      await expect(idea.getAnimations()).toEqual([]);
    }
    return;
  }
  await waitFor(async () => {
    const lit = litOf(block);
    await expect(lit).toHaveLength(1);
    for (const idea of ideas) {
      const on = idea === lit[0];
      await expect(getComputedStyle(idea).opacity).toBe(
        on ? '1' : IDLE_OPACITY,
      );
      await expect(getComputedStyle(stretchOf(idea)).backgroundColor).toBe(
        on ? ACCENT_RGB : LINE_RGB,
      );
      await expect(getComputedStyle(dotOf(idea)).backgroundColor).toBe(
        on ? ACCENT_RGB : LINE_RGB,
      );
    }
  });
};

/** The times, in ms after the swap, the hand-over's clocks are SEEKED to. */
type HandOverMs = 0 | 40 | 150 | 300;

/** The four sizes a hand-over moves, at one seeked time: each idea's drawn
 *  scale and each dot's DRAWN — its own scale × its idea's. */
type Drawn = Readonly<{
  entering: number;
  receding: number;
  enteringDot: number;
  recedingDot: number;
}>;

/** How far an element is scaled: its drawn width over its laid-out width —
 *  the USED width (`usedPx`), never `offsetWidth`. */
const scaleOf = (element: HTMLElement): number =>
  element.getBoundingClientRect().width / usedPx(element, 'width');

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
 * THE HAND-OVER, CAUGHT AT ITS COMMIT (react F1 of the G2-R2 tier-2 review —
 * the scroll-driven rail's play, kept for the clock-driven one). A
 * MutationObserver on the two ideas fires as a microtask straight after
 * React writes the swap, before the browser renders a frame of it, and
 * resolves once `entering` is lit and `receding` is not — the one commit
 * that hands the light over; `holdSizeClocks` then takes it from there.
 * Rejects after `timeoutMs`, so a hand-over that never comes fails HERE, by
 * name, rather than timing the whole play out. A play that waits for ONE
 * PARTICULAR hand-over gives it a whole lap of the ring: a play that starts
 * a beat late — a CI machine under load — has missed the first one and
 * catches the same swap on the next lap (G2 react L2, 2026-10-13).
 */
const catchHandOver = (
  receding: HTMLElement,
  entering: HTMLElement,
  timeoutMs = 3_000,
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
      reject(
        new Error(`catchHandOver: no hand-over commit within ${timeoutMs}ms`),
      );
    }, timeoutMs);
    for (const idea of [receding, entering]) {
      observer.observe(idea, { attributeFilter: ['class', 'data-current'] });
    }
  });

/**
 * THE CLOCKS THAT DRAW THE SIZES, waited for and then held (the G2-R2
 * full-run flake). Checked at once, then once a frame for at most a second,
 * until every labelled [element, kind] in `wanted` has run; then EVERY
 * animation the `elements` carry is paused. Only the SIZE clocks are waited
 * for, because only they are certain: a fade whose start and end values are
 * equal starts no transition at all, so the transition LISTS are pinned off
 * the computed style (`transitionListOf`), never off the live clocks.
 * Returns the kinds still missing at the deadline (none, on a pass) and the
 * held clocks.
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
 * Seek the held clocks together through the four HandOverMs times, reading
 * the four drawn sizes at each. Seeked, not timed: the numbers are the
 * stylesheet's arithmetic, never a busy runner's frame rate.
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
  return { 0: at(0), 40: at(40), 150: at(150), 300: at(300) };
};

/**
 * THE LIT STRETCH THROUGH THE WHOLE FORWARD MOTION (CourseTimeline's RAIL —
 * "a lit stretch still stops short of the next dot"). The held clocks are
 * seeked every 10ms from the swap to the motion's end (450ms), and at each
 * step the lit idea's DRAWN stretch end is read against the next idea's
 * resting dot's ring, which nothing moves. Returns the drawn scale and the
 * bare ground left at every step, then the clocks' last position.
 */
const sweepLitStretch = (
  held: readonly Animation[],
  lit: HTMLElement,
  next: HTMLElement,
): ReadonlyArray<Readonly<{ ms: number; scale: number; ground: number }>> => {
  const samples: { ms: number; scale: number; ground: number }[] = [];
  for (let ms = 0; ms <= 450; ms += 10) {
    for (const animation of held) animation.currentTime = ms;
    const end = stretchOf(lit).getBoundingClientRect().bottom;
    const ringTop = dotOf(next).getBoundingClientRect().top - RING;
    samples.push({ ms, scale: drawnScaleOf(lit), ground: ringTop - end });
  }
  return samples;
};

/** One step of `sweepTrail`: the lit last idea's drawn scale and laid-out
 *  height, how far its trail's drawn end reaches below the idea's laid-out
 *  bottom, and how much ground is left under that end. */
type TrailSample = Readonly<{
  ms: number;
  scale: number;
  height: number;
  reach: number;
  left: number;
}>;

/**
 * THE TRAIL THROUGH THE WHOLE FORWARD MOTION (CourseTimeline's THE TRAIL) —
 * `sweepLitStretch`'s twin for the LAST idea, which has no next dot to stop
 * short of, only the ground below the rail. The held clocks are seeked every
 * 5ms from the swap to the motion's end (450ms — the overshoot peaks between
 * two 10ms steps), and at each step the trail's DRAWN end is read against
 * the idea's LAID-OUT bottom (`laidOut`) and against the ground's lower edge
 * (`ground`, the decorator's Container), every box re-read at every step.
 */
const sweepTrail = (
  held: readonly Animation[],
  last: HTMLElement,
  ground: HTMLElement,
): readonly TrailSample[] => {
  const samples: TrailSample[] = [];
  for (let ms = 0; ms <= 450; ms += 5) {
    for (const animation of held) animation.currentTime = ms;
    const end = stretchOf(last).getBoundingClientRect().bottom;
    const box = laidOut(last.getBoundingClientRect(), last);
    samples.push({
      ms,
      scale: drawnScaleOf(last),
      height: box.height,
      reach: end - box.bottom,
      left: ground.getBoundingClientRect().bottom - end,
    });
  }
  return samples;
};

const meta = {
  title: 'Sections/DoctorCourses',
  component: DoctorCourses,
  parameters: { layout: 'fullscreen' },
  decorators: [onThePage],
  args: {
    eyebrow: EYEBROW,
    title: TITLE,
    items: ITEMS,
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
        'The block’s real <h2> and, through aria-labelledby, the region’s accessible name',
    },
    items: {
      control: false,
      description:
        'The ideas — one finished course line per dot, in the page’s order (lib/team’s own order of the course rows), printed as given; no year (owner, 2026-10-13: "no year anymore"). Each is a <li> on a line down the left, its dot level with its first line, a short break above every dot, 40px between ideas, and the line trailing 36px past the last idea, like every other idea’s stretch (owner, the same evening: "a stable trail"). ONE idea is lit at a time — brought forward at 1.04 with an overshoot, its stretch and dot in the accent — and the light moves on by itself every intervalMs, from the last idea back to the first; the others recede to 0.65 (the island ./CourseTimeline on ui/use-rotation). Nothing lights under reduced motion or for a single idea. EMPTY renders nothing at all — no region, no heading',
    },
    intervalMs: {
      control: false,
      description: `The rhythm in ms, READ ONCE AT MOUNT — the page passes nothing and gets COURSES_INTERVAL_MS (${COURSES_INTERVAL_MS}); \`Cycling\` passes ${CYCLING_INTERVAL_MS}`,
    },
    className: {
      control: false,
      description:
        'Placement only, merged LAST onto the <section> (§6.4/§6.8). The band around the block — sections/DoctorProfile — owns the ground, the gutter, the rhythm and the scale',
    },
  },
} satisfies Meta<typeof DoctorCourses>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE EVERYDAY BLOCK — Romanian, at the laptop width: the opener over a grey
 * line down the left of the rail, a dot on it level with each idea, a short
 * break above every dot, the six ideas 40px apart. In the Vitest runner the
 * light runs — idea 1 lit after mount, brought forward in lilac, the others
 * faded — and moves on every 3 s; in the pixel net's reduced motion the rail
 * is neutral, every idea in full ink. The play reads back what a picture
 * cannot: the outline, the sizes, the light this world owes, and the
 * geometry against the measured boxes.
 */
export const Default: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvas }) => {
    const block = canvas.getByRole('region', { name: TITLE });

    await loadFaces(block);
    await expect(canvas.getByText(EYEBROW)).toBeVisible();
    await expectOutline(block, TITLE, ITEMS);
    await expectLight(block);
    await expectRail(block);
    await expectTrail(block);
    await expectNoSidewaysScroll(block);
  },
};

/**
 * THE PHONE — where the block stacks under the biography on the page: the
 * same line down the left and the ideas one under the other, the rail as
 * wide as the column (351px on a 390 phone, 336 beside a classic scrollbar),
 * the ideas wrapping onto a second line with their dots still on the first.
 * The play pins the geometry and the light.
 */
export const Smartphone: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  play: async ({ canvas }) => {
    const block = canvas.getByRole('region', { name: TITLE });

    await loadFaces(block);
    await expectOutline(block, TITLE, ITEMS);
    await expectLight(block);
    await expectRail(block);
    await expectTrail(block);
    await expectNoSidewaysScroll(block);
  },
};

/**
 * GERMAN, THE LONGEST LANGUAGE (§8.4: ≈ +30–35% over English) — the phone
 * width carrying the words this block is most likely to break on, the
 * longest idea 93 characters („Fortbildung in digitaler Prothetik und
 * computergestützter Fertigung von Zahnersatz, Timișoara"), under the message
 * file's own heading pair „Stationen meines Weges zur Spezialisierung" /
 * „Kurse und Spezialisierungen" (the ideas DRAFTED, §15.17).
 *
 * `lang="de"` rides the native prop spread onto the BLOCK and inherits to
 * every child, which is the whole mechanism: `hyphens: auto` (§15.14) picks
 * the German dictionary, so a compound breaks at a syllable instead of
 * pushing the column open.
 *
 * **390 · 320 (`stress-320`):** every dot on the line and on its idea's first
 * line however many lines the idea takes (the play pins it), and nothing
 * scrolls sideways.
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  args: {
    eyebrow: GERMAN_EYEBROW,
    title: GERMAN_TITLE,
    items: GERMAN_ITEMS,
    lang: 'de',
  },
  play: async ({ canvas }) => {
    const block = canvas.getByRole('region', { name: GERMAN_TITLE });

    await loadFaces(block);
    await expect(block).toHaveAttribute('lang', 'de');
    await expect(canvas.getByText(GERMAN_EYEBROW)).toBeVisible();
    await expectOutline(block, GERMAN_TITLE, GERMAN_ITEMS);
    await expectLight(block);
    await expectRail(block);
    await expectTrail(block);
    await expectNoSidewaysScroll(block);
  },
};

/**
 * THE ACCESSIBILITY STRESS WIDTH (§7) — Romanian at 320: a 288px column
 * (less beside a classic scrollbar), the ideas wrapping 40px in from the
 * line, the <h2> on its 30px step, nothing scrolling sideways. Pinned there
 * in the workbench and photographed there too ('stress-320').
 */
export const Narrowest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  play: async ({ canvas }) => {
    const block = canvas.getByRole('region', { name: TITLE });

    await loadFaces(block);
    await expectOutline(block, TITLE, ITEMS);
    await expectLight(block);
    await expectRail(block);
    await expectTrail(block);
    await expectNoSidewaysScroll(block);
  },
};

/**
 * A DOCTOR WITH ONE COURSE — the NEUTRAL rail in every world: one idea has
 * nothing to hand the light to (lib/rotation's two-item floor), so nothing
 * lights, nothing fades and nothing moves. Its stretch of line is the same
 * as every idea's — one recipe — so the lone dot hangs THE TRAIL, 2.25rem
 * past its idea, with no next dot to stop above (`expectRail`,
 * `expectTrail`). The picture the pixel net takes of every other story,
 * here for a reason of its own.
 */
export const SingleIdea: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { items: ITEMS.slice(-1) },
  play: async ({ canvas }) => {
    const block = canvas.getByRole('region', { name: TITLE });
    const [only] = ideasOf(block);

    await loadFaces(block);
    await expectOutline(block, TITLE, ITEMS.slice(-1));
    await expect(litOf(block)).toEqual([]);
    await expect(getComputedStyle(only).opacity).toBe('1');
    await expect(drawnScaleOf(only)).toBeCloseTo(1, 3);
    await expect(getComputedStyle(dotOf(only)).backgroundColor).toBe(LINE_RGB);
    await expectRail(block);
    await expectTrail(block);
    await expectNoSidewaysScroll(block);
  },
};

/**
 * THE LIGHT MOVING ON — the owner's "circle automatically through the ideas
 * and highlight them one by one", at a rhythm short enough to watch (900ms;
 * the page's is COURSES_INTERVAL_MS). The play catches the FIRST hand-over —
 * idea 1 to idea 2 — at its commit, holds the clocks that draw the sizes and
 * SEEKS them (`catchHandOver`, `holdSizeClocks`, `seekHandOver`), each
 * state's transition list read off the computed style: the new idea drawn at
 * exactly 1.0 at the swap and rising past 1.05, the old one easing back from
 * 1.04, never snapping (react F1 of the G2-R2 tier-2 review) — and each
 * idea's dot with it, the new one popping from its first keyframe, the old
 * one shrinking from 1.25 × 1.04. It then sweeps the forward motion every
 * 10ms and reads the lit stretch's DRAWN end against the next dot's ring
 * (`sweepLitStretch`): the 1.04 and its overshoot carry it a few pixels on,
 * never into the ring. Under reduced motion it asserts the neutral rail
 * instead — there is no hand-over to catch.
 *
 * 'no-visual': a frame that moves by design is never a baseline
 * (tests/visual/stories.spec.ts). Its play and its per-story axe run in the
 * Vitest storybook project, which checks the lit idea's contrast where it is
 * lit and the faded ideas' where they are faded.
 */
export const Cycling: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  args: { intervalMs: CYCLING_INTERVAL_MS },
  play: async ({ canvas }) => {
    const block = canvas.getByRole('region', { name: TITLE });
    const ideas = ideasOf(block);

    if (reducedMotion()) {
      await expectLight(block);
      return;
    }

    // Catch the hand-over from idea 1 to idea 2 BEFORE anything else is
    // awaited, so its commit cannot slip past the observer — the first one,
    // 900ms after the ring started, or, for a play that starts late, the
    // same swap one lap later.
    const handedOver = catchHandOver(
      ideas[0],
      ideas[1],
      ideas.length * CYCLING_INTERVAL_MS + 1_000,
    );
    const litAtStart = litOf(block);
    await handedOver;
    const [entering, receding, next] = [ideas[1], ideas[0], ideas[2]];
    const { missing, held } = await holdSizeClocks(
      [entering, dotOf(entering), receding, dotOf(receding)],
      [
        ['entering idea', entering, 'animation:forward'],
        ['entering dot', dotOf(entering), 'animation:pop'],
        ['receding idea', receding, 'transition:scale'],
        ['receding dot', dotOf(receding), 'transition:scale'],
      ],
    );
    // EVERYTHING the light decides is read in this one synchronous stretch —
    // no await until the next tick could not matter any more: the hand-over's
    // seeked sizes, the sweep of the forward motion, the transition lists,
    // then (the clocks finished, every fade done) the settled state.
    const drawn = seekHandOver(held, entering, receding);
    const sweep = sweepLitStretch(held, entering, next);
    const lists = {
      entering: transitionListOf(entering),
      receding: transitionListOf(receding),
      enteringDot: transitionListOf(dotOf(entering)),
      recedingDot: transitionListOf(dotOf(receding)),
    };
    for (const animation of held) animation.finish();
    const others = ideas.filter((idea) => idea !== entering);
    const settled = {
      lit: litOf(block),
      scale: scaleOf(entering),
      dot: scaleOf(dotOf(entering)),
      forward: animationsOn(entering, 'forward').length,
      pop: animationsOn(dotOf(entering), 'pop').length,
      others: others.map((other) => ({
        scale: scaleOf(other),
        moving:
          animationsOn(other, 'forward').length +
          animationsOn(dotOf(other), 'pop').length,
      })),
    };

    // The premise: at most one idea was lit when the play began — WHICH is
    // never assumed — and the light went from idea 1 to idea 2, the one
    // hand-over this play caught.
    await expect(litAtStart.length).toBeLessThanOrEqual(1);
    await expect(settled.lit).toEqual([entering]);
    // Every clock that draws a size was running at the swap.
    await expect(missing).toEqual([]);

    // THE HAND-OVER (react F1 of the G2-R2 tier-2 review, and its twin on
    // the dot). Each state carries its own transition LIST — pinned off the
    // computed style, which is deterministic — so the new idea and its dot
    // never shrink before they grow and the old ones never snap; the SIZES
    // are the seeked clocks'.
    await expect(lists.entering).toEqual(['opacity']);
    await expect(drawn[0].entering).toBeCloseTo(1, 3);
    await expect(drawn[40].entering).toBeGreaterThan(drawn[0].entering);
    await expect(drawn[150].entering).toBeGreaterThan(1.05);
    await expect(lists.receding).toEqual(['opacity', 'scale']);
    await expect(drawn[0].receding).toBeCloseTo(1.04, 3);
    await expect(drawn[40].receding).toBeGreaterThan(1.03);
    await expect(drawn[150].receding).toBeLessThan(drawn[40].receding);
    await expect(drawn[150].receding).toBeGreaterThan(1);
    await expect(drawn[300].receding).toBeCloseTo(1, 3);
    await expect(lists.enteringDot).toContain('background-color');
    await expect(lists.enteringDot).not.toContain('scale');
    await expect(drawn[0].enteringDot).toBeCloseTo(0.875, 2);
    await expect(drawn[40].enteringDot).toBeGreaterThan(drawn[0].enteringDot);
    await expect(lists.recedingDot).toEqual(['background-color', 'scale']);
    await expect(drawn[0].recedingDot).toBeCloseTo(1.3, 2);
    await expect(drawn[40].recedingDot).toBeGreaterThan(1.1);
    await expect(drawn[150].recedingDot).toBeLessThan(drawn[40].recedingDot);
    await expect(drawn[300].recedingDot).toBeCloseTo(1, 2);

    // THE LIT STRETCH STOPS SHORT OF THE NEXT DOT at every step of the
    // forward motion — through its overshoot (~1.065) and settled at 1.04.
    const peak = Math.max(...sweep.map((sample) => sample.scale));
    const tightest = sweep.reduce((low, sample) =>
      sample.ground < low.ground ? sample : low,
    );
    await expect(peak).toBeGreaterThan(1.06);
    await expect(
      tightest.ground,
      `the tightest ground above the next ring, at ${tightest.ms}ms`,
    ).toBeGreaterThan(0);

    // SETTLED: the lit idea drawn at 1.04, its dot 1.25 × 1.04, the forward
    // motion on the lit idea alone and the pop on its dot alone; the others
    // at 1 — SHAPE, not only colour.
    await expect(settled.scale).toBeCloseTo(1.04, 2);
    await expect(settled.dot).toBeCloseTo(1.3, 2);
    await expect(settled.forward).toBe(1);
    await expect(settled.pop).toBe(1);
    for (const other of settled.others) {
      await expect(other.scale).toBeCloseTo(1, 3);
      await expect(other.moving).toBe(0);
    }

    // What holds whichever idea the light has reached by now — the real faces
    // loaded first, here and not before the hand-over, whose clocks a font
    // wait could let run out before they were held.
    await loadFaces(block);
    await expectLight(block);
    await expectRail(block);
    await expectTrail(block);
    await expectNoSidewaysScroll(block);
    // Nothing here is navigation, and nothing is announced: the light is
    // emphasis only (CourseTimeline's NOT THE APG CAROUSEL).
    await expect(block.querySelector('[aria-current]')).toBeNull();
    await expect(block.querySelector('[aria-live]')).toBeNull();
  },
};

/** `TrailLit`'s two ideas: the light reaches the LAST after one beat, and the
 *  last is the long one, wrapping onto a second line on the phone — a taller
 *  lit idea carries its trail further down than a one-line one does. */
const TRAIL_ITEMS = [ITEMS[0], ITEMS[3]] as const;

/**
 * THE TRAIL, LIT — the owner's "stable trail" under the last idea (round 7's
 * pack, 2026-10-13: "the last dot idea has to have a longer line beneath"),
 * with the light ON it: a lit last idea comes forward like any other, and
 * its whole trail turns the accent and comes forward with it, reaching
 * further into the ground below the rail than at rest. Two ideas on the
 * phone (`TRAIL_ITEMS`) at `Cycling`'s rhythm, so the light reaches the last
 * after one beat. The play catches that hand-over at its commit, holds the
 * clocks and SEEKS them every 5ms through the forward motion (`sweepTrail`):
 * at every step the trail is carried on exactly as far as the idea's scale
 * carries a point 2.25rem under it — a box scaled about the middle of its
 * left edge — so the trail moves WITH its idea, and its drawn end stays
 * above the decorator's lower edge, inside the 48px of ground the band gives
 * the block at its shallowest, through the overshoot's peak; settled, the
 * idea is drawn at 1.04 and its trail is the accent. Under reduced motion it
 * asserts the neutral rail instead — the last idea never lights.
 *
 * 'no-visual': a frame that moves by design is never a baseline
 * (tests/visual/stories.spec.ts). Its play and its per-story axe run in the
 * Vitest storybook project.
 */
export const TrailLit: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  args: { items: TRAIL_ITEMS, intervalMs: CYCLING_INTERVAL_MS },
  play: async ({ canvas }) => {
    const block = canvas.getByRole('region', { name: TITLE });
    const ground = block.parentElement as HTMLElement;
    const [first, last] = ideasOf(block);

    if (reducedMotion()) {
      await loadFaces(block);
      await expectLight(block);
      await expectRail(block);
      await expectTrail(block);
      return;
    }

    // Catch the hand-over to the last idea BEFORE anything else is awaited
    // (`Cycling`'s order), so its commit cannot slip past the observer — on
    // whichever lap it comes, a late start included.
    const handedOver = catchHandOver(
      first,
      last,
      TRAIL_ITEMS.length * CYCLING_INTERVAL_MS + 1_000,
    );
    const litAtStart = litOf(block);
    await handedOver;
    const { missing, held } = await holdSizeClocks(
      [last, dotOf(last), stretchOf(last)],
      [['the last idea', last, 'animation:forward']],
    );
    // Read in ONE synchronous stretch: the sweep, then — every held clock
    // left at the motion's end, the trail's colour eased with them — the
    // settled trail's colour.
    const sweep = sweepTrail(held, last, ground);
    const settledColour = getComputedStyle(stretchOf(last)).backgroundColor;
    for (const animation of held) animation.finish();

    // The premise: at most one idea was lit when the play began — WHICH is
    // never assumed — and the light went to the last, the one hand-over this
    // play caught, with the forward motion running at the swap.
    await expect(litAtStart.length).toBeLessThanOrEqual(1);
    await expect(missing).toEqual([]);

    const peak = sweep.reduce((high, sample) =>
      sample.scale > high.scale ? sample : high,
    );
    const tightest = sweep.reduce((low, sample) =>
      sample.left < low.left ? sample : low,
    );
    const settled = sweep[sweep.length - 1];
    // Never vacuous: the sweep passed through the overshoot.
    await expect(peak.scale).toBeGreaterThan(1.06);
    // THE TRAIL COMES FORWARD WITH ITS IDEA: at every step its drawn end is
    // as far below the idea's laid-out bottom as the scale carries a point
    // 2.25rem under it, about the middle of the idea's left edge…
    for (const sample of sweep) {
      await near(
        sample.reach,
        stepPx(2.25) + (sample.scale - 1) * (sample.height / 2 + stepPx(2.25)),
        `the trail's reach at ${sample.ms}ms`,
        0.5,
      );
    }
    // …and it never paints past the ground below the rail, overshoot and all.
    await expect(
      tightest.left,
      `the ground left under the trail at ${tightest.ms}ms`,
    ).toBeGreaterThan(0);
    // SETTLED: the idea drawn at 1.04, its whole trail in the accent.
    await expect(settled.scale).toBeCloseTo(1.04, 2);
    await expect(settledColour).toBe(ACCENT_RGB);

    // What holds whichever idea the light has reached by now (`Cycling`'s
    // tail): the real faces, the light, the arrangement, the trail at rest
    // or lit, and nothing sideways.
    await loadFaces(block);
    await expectLight(block);
    await expectRail(block);
    await expectTrail(block);
    await expectNoSidewaysScroll(block);
  },
};
