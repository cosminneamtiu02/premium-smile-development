import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { TeamRoster, type TeamRosterMember } from './TeamRoster';

// FOUR stories since 2026-10-02: the everyday band at the laptop width, the
// German expansion stress on the phone — the two the pixel net photographs —
// and, for the owner's fixed tiles (TeamRoster's D9), the tablet and the
// narrowest window. The export NAMES are load-bearing — each one names a
// baseline file (`sections-teamroster--default`,
// `sections-teamroster--german-longest`), so renaming or adding a photographed
// export re-records pictures; this list IS the section's contribution to the
// visual manifest. The `Sections/*` title prefix routes the two to 390 + 1536
// (tests/visual/stories.spec.ts, §13), and the 'stress-320' tag adds the
// accessibility width to both (a phone's 288px column since 2026-10-09 — THE
// PHONE GUTTER, ui/Container, CLAUDE.md §15.35; 256 until then — and 273px
// under the classic scrollbar the baselines are recorded with, around a 192px
// portrait, a German compound in a mono eyebrow that never hyphenates).
// `Tablet` and `Narrowest` are 'no-visual' (DoctorShowcase's `Notebook` /
// `Desktop` precedent): the net sets its own window and ignores their pins, so
// at 390 and 1536 they would only repeat `Default`'s pixels — and `Default`'s
// 320 frame IS the narrowest picture. They exist for the workbench, where the
// owner flips between the widths, and for their plays, which run at the
// pinned width in the Vitest storybook project — and both wear a DEVICE'S
// scrollbar, which takes no width (`deviceScrollbar`), so they show a
// tablet's and a phone's own column, never a desktop window's at the same
// width (at 768 the two differ by 15px of column — still two tiles a row in
// both since D9's least gap became 20px).
//
// ── THREE STORIES LEFT WITH THE DOCTORS (owner, 2026-09-30 — TeamRoster.tsx's
// header quotes him): the doctors are a band of their own,
// sections/DoctorShowcase, and the page title is the page's own sr-only <h1>.
// `DoctorsOnly` had nothing left to show. `MembersOnly` — the staff half on
// its own — IS `Default` now, so keeping it would photograph the same pixels
// twice. `PseudoLocale` transformed exactly the page title and the doctors'
// two link labels, then the band's last message-key strings. Since 2026-10-02
// the band prints two such strings again — its eyebrow and its title, the
// page's `team.roster.*` keys — but they arrive as PROPS, which here are
// args: the toolbar's pseudo transform rewrites next-intl's messages and this
// band reads none, so a pseudo frame would still be `Default`. A missing or
// hard-coded key shows where the keys are read — the translation-parity test
// (§13) and the page twin, Pages/Team. The expansion stress is
// `GermanLongest`'s, the longest real language (§8.4), its opener in German
// too.
//
// ── THE BAND SCALE, IN EVERY PLAY (§15.32 — ui/Container's THE BAND SCALE).
// Wherever the scale's three gates hold — a mouse or trackpad (`pointer:
// fine`), an engine that registers custom properties, a column of max(56rem,
// 896px) — the band is drawn in its design pixel, s = min(column, 96rem) /
// 1106: the eyebrow 14 × s px, the title 36 × s, every tile 352 × s wide with
// a 192 × s portrait, 24 × s between tiles, three to a row — and past the
// 96rem cap the cap's band, centred in its column, the eyebrow and the title
// on the band's own left edge. Wherever one gate fails — every phone, every
// touch tablet held either way, a column under the step, an engine that
// cannot register — nothing is declared: the tile is the column's own on a
// phone (a column under the named `md` step, 28rem — the doctor cards' width,
// since 2026-10-09) and 18rem off one, its portrait 12rem either way, the
// title the theme's `band` step and the eyebrow 0.875rem.
// Every play reads its column, its pointer and its engine and asserts
// whichever of the two it is in (`regimeOf`), never the pinned width; in the
// Vitest storybook project the pointer is Chromium's fine one, so `Default`'s
// play there asserts the scale.
//
// ── EVERY STORY PINS ITS OWN LANGUAGE AND ITS OWN VIEWPORT with per-story
// `globals`, and both halves are load-bearing:
//   · the locale pin, even though this band reads no message file (its strings
//     are props, run D1 — the Team page owns the keys): the preview decorator
//     stamps `<html lang>` from that global, so every frame declares the
//     language its text is written in, as the shell does per locale (§8.10);
//     a story-level pin also beats the toolbar, so the §8.9 Pseudo sweep
//     cannot reach these frames — and would find nothing in them (the
//     PseudoLocale paragraph above; TeamRoster.test.tsx pins that no key path
//     is ever printed);
//   · the viewport pin, because the tiles have one width per regime (D9) — a
//     manager canvas narrowed by the sidebar can sit on either side of the
//     step, or between two tile counts, so an unpinned story would photograph
//     an accident. Playwright ignores the pin — it sets its own page size per
//     project — which is exactly why every expectation below is DERIVED from
//     the measured column instead of assuming the pinned width.
//
// ── NO DECORATOR, unlike PersonnelCard's stories: this component IS the band.
// It brings its own full-bleed <section>, its own ui/Container and its own
// vertical rhythm (the PAGE-BAND RECIPE in Container.tsx's header), so wrapping
// it in a second one would put the story's ground and the band's margins on two
// different rulers. `layout: 'fullscreen'` for the same reason ClinicLocation
// and DoctorProfile set it — Storybook's default canvas padding would falsify the
// gutter.
//
// ── NO MOCK MESSAGES AND NO `parameters.nextjs`: the band reads no message
// file and hydrates nothing of its own. The only islands in the frame are the
// ones ui/Image brings with the portraits (PersonnelCard D11) — which is also
// why the demo photographs are committed fixtures rather than a design-time
// placeholder.
//
// ── `expectNoSidewaysScroll` is the story tier's recorded duplication, not an
// oversight: the standing promotion trigger for a story/test helper module is
// the one §15.19's round-3 table names, and moving it is that lane's job, not
// this band's. So is `loadFace` (DoctorStats', the same recipe).
//
// Demo people are INVENTED and the portraits are synthetic silhouettes
// (public/images/demo/portrait-1…3.jpg, 600×800): no real patient or employee,
// nothing to license, obviously placeholders. Copy is Romanian with diacritics
// (§15.7); the opener's two strings are the page's drafts of
// `team.roster.eyebrow` / `team.roster.title` in Romanian and German. The real
// people, in five languages, are the owner's to author (§15.17).

const EYEBROW_RO = 'Echipa de sprijin';
const TITLE_RO = 'Oamenii fără de care nu ne-am descurca';
const EYEBROW_DE = 'Unser Praxisteam';
const TITLE_DE = 'Die Menschen, ohne die es nicht ginge';

/** The three committed demo portraits, all at the ONE team ratio (3:4), keyed
 *  by the Romanian person who wears each one in `Default`. */
const PORTRAITS = {
  ioana: { src: '/images/demo/portrait-2.jpg', width: 600, height: 800 },
  mihaela: { src: '/images/demo/portrait-1.jpg', width: 600, height: 800 },
  anaMaria: { src: '/images/demo/portrait-3.jpg', width: 600, height: 800 },
} as const;

/** The three staff tiles. The third position is deliberately long enough to
 *  WRAP inside a tile, so the stories photograph — and their play proves —
 *  the equal-heights mechanism rather than three single-line fixtures that
 *  could never disagree. */
const MEMBERS = [
  {
    id: 'ioana-tepes',
    name: 'Ioana Țepeș',
    position: 'Asistentă medicală',
    photo: PORTRAITS.ioana,
  },
  {
    id: 'mihaela-craciun',
    name: 'Mihaela Crăciun',
    position: 'Asistentă medicală',
    photo: PORTRAITS.mihaela,
  },
  {
    id: 'ana-maria-dobre',
    name: 'Ana-Maria Dobre',
    position: 'Recepție, programări și comunicarea cu pacienții',
    photo: PORTRAITS.anaMaria,
  },
] as const satisfies readonly TeamRosterMember[];

/** The band scale's numbers, written out (ui/Container's THE BAND SCALE,
 *  argued in sections/DoctorShowcase's D10): the REFERENCE column, where a
 *  design pixel is a CSS pixel; the CAP, in rem of the root (1536px at the
 *  default 16px); THE STEP's two halves, `@4xl`'s 56rem and the 896px floor. */
const REFERENCE = 1106;
const CAP_REM = 96;
const STEP_REM = 56;
const STEP_FLOOR = 896;

/** D9's tile widths — the column's own on a phone (a column under PHONE_REM,
 *  Tailwind's named `md` step), 18rem off one outside the band scale, 352
 *  design pixels inside it — the gap between two tiles of a row (`gap-x-5` =
 *  1.25rem outside, the gated `gap-x-6` = 24 design pixels inside), the gap
 *  between rows (`gap-y-6`) in each, and the portrait's cell (PersonnelCard's
 *  `w-48`: 12rem outside the scale, 192 design pixels inside it). */
const PHONE_REM = 28;
const TILE_REM = 18;
const TILE_DESIGN = 352;
const GAP_X_REM = 1.25;
const GAP_X_DESIGN = 24;
const GAP_Y_REM = 1.5;
const GAP_Y_DESIGN = 24;
const PORTRAIT_REM = 12;
const PORTRAIT_DESIGN = 192;

/** A length in CSS px per rem, read off the document — a visitor who has
 *  enlarged the browser's base font moves every rem on the page. */
const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/** A computed length of an element, in px. */
const px = (element: Element, property: string): number =>
  parseFloat(getComputedStyle(element).getPropertyValue(property));

/** `actual` within `tolerance` of `expected`, the numbers in the message. */
const near = async (
  actual: number,
  expected: number,
  tolerance: number,
  label: string,
): Promise<void> => {
  await expect(
    Math.abs(actual - expected),
    `${label}: ${actual} against ${expected}`,
  ).toBeLessThanOrEqual(tolerance);
};

/** Nothing may require horizontal scrolling, at any sampled width (§7, §9) —
 *  neither inside the band nor on the page around it. */
const expectNoSidewaysScroll = async (element: HTMLElement): Promise<void> => {
  await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
  const root = element.ownerDocument.documentElement;
  await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
};

/**
 * THE REAL FACE BEFORE ANY TEXT IS MEASURED (the CI failure of 2026-10-01,
 * Sections/Hero's `loadFace`, DoctorStats' recipe): Storybook's faces are
 * `font-display: block`, so a play that measures right after the render may
 * lay text out in the FALLBACK serif, whose words are wider — and whether the
 * real face has arrived depends on which stories ran before in the same
 * browser. `load()` fetches the exact face the element asks for.
 */
const loadFace = async (element: Element): Promise<void> => {
  const style = getComputedStyle(element);
  await document.fonts.load(
    `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    element.textContent ?? '',
  );
  await document.fonts.ready;
};

/** Which side of the band scale this play stands on, read off the browser and
 *  the band's own column (ui/Container, the band's first box), never off the
 *  pinned window — and, inside the scale, its design pixel `s`. */
type Regime = Readonly<{
  scalable: boolean;
  s: number;
  column: DOMRect;
  rhythm: HTMLElement;
}>;

const regimeOf = (band: HTMLElement): Regime => {
  const column = band.firstElementChild;
  const rhythm = column?.firstElementChild;
  if (!(column instanceof HTMLElement) || !(rhythm instanceof HTMLElement)) {
    throw new Error('TeamRoster story: the band lost its column');
  }
  const box = column.getBoundingClientRect();
  const scalable =
    window.matchMedia('(pointer: fine)').matches &&
    CSS.supports('color', 'rgb(from red r g b)') &&
    box.width >= Math.max(STEP_REM * rem(), STEP_FLOOR);
  return {
    scalable,
    s: scalable ? Math.min(box.width, CAP_REM * rem()) / REFERENCE : 1,
    column: box,
    rhythm,
  };
};

type Expected = Readonly<{
  eyebrow: string;
  title: string;
  members: readonly TeamRosterMember[];
}>;

/**
 * The facts a picture cannot show, in one place: a region named by the band's
 * own <h2> — its title alone — with the eyebrow above it; no <h1> here (it is
 * the page's, sr-only, in the page's own markup); ONE list, the tiles in DOM
 * order, each an `article` named by its own <h3>, and no other heading; and
 * nothing to follow (PersonnelCard D2: an auxiliary tile brings no link).
 * Returns the band.
 */
const expectRoster = async (
  canvasElement: HTMLElement,
  expected: Expected,
): Promise<HTMLElement> => {
  const band = within(canvasElement).getByRole('region', {
    name: expected.title,
  });
  const canvas = within(band);

  await expect(canvas.queryAllByRole('heading', { level: 1 })).toHaveLength(0);
  const heading = canvas.getByRole('heading', {
    level: 2,
    name: expected.title,
  });
  const eyebrow = canvas.getByText(expected.eyebrow);
  for (const element of [eyebrow, heading]) {
    await loadFace(element);
    await expect(element).toBeVisible();
  }
  await expect(eyebrow.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    heading.getBoundingClientRect().top + 0.5,
  );

  await expect(canvas.getAllByRole('list')).toHaveLength(1);
  const articles = canvas.getAllByRole('article');
  await expect(articles).toHaveLength(expected.members.length);
  for (const [index, member] of expected.members.entries()) {
    await expect(articles[index]).toBe(
      canvas.getByRole('article', { name: member.name }),
    );
    const name = within(articles[index]).getByRole('heading', {
      name: member.name,
    });
    await expect(name.tagName).toBe('H3');
    await expect(name).toBeVisible();
  }
  await expect(canvas.getAllByRole('heading')).toHaveLength(
    1 + expected.members.length,
  );
  await expect(canvas.queryAllByRole('link')).toHaveLength(0);
  return band;
};

/**
 * THE OPENER — ONE SIZE AND ONE LEFT EDGE (§15.32, the owner: "headings and
 * eyebrows grow together, always have same size and extremley important for
 * headings and eyebrows, same offset always"). Inside the scale the design
 * pixel is the one ui/Container's band-scale strings declare, the title 36 × s
 * and the eyebrow 14 × s; outside it the design pixel is the registered 1px,
 * the title the theme's `band` step (30px under a 28rem column, 36px from it)
 * and the eyebrow 0.875rem. Either way the band's rhythm box is the column —
 * or, past the cap, the cap's width centred in it — and the eyebrow and the
 * title stand on ITS left edge, read in the real faces.
 */
const expectOpener = async (
  band: HTMLElement,
  regime: Regime,
  expected: Expected,
): Promise<void> => {
  const { scalable, s, column, rhythm } = regime;
  const heading = within(band).getByRole('heading', { level: 2 });
  const eyebrow = within(band).getByText(expected.eyebrow);

  if (scalable) {
    await near(px(rhythm, '--scale-px'), s, 0.0001, 'the design pixel');
    await near(px(heading, 'font-size'), 36 * s, 0.1, 'the title');
    await near(px(eyebrow, 'font-size'), 14 * s, 0.1, 'the eyebrow');
  } else {
    await expect(getComputedStyle(rhythm).getPropertyValue('--scale-px')).toBe(
      '1px',
    );
    await near(
      px(heading, 'font-size'),
      (column.width >= 28 * rem() ? 2.25 : 1.875) * rem(),
      0.1,
      'the title, unscaled',
    );
    await near(
      px(eyebrow, 'font-size'),
      0.875 * rem(),
      0.1,
      'the eyebrow, unscaled',
    );
  }

  const width = scalable
    ? Math.min(column.width, CAP_REM * rem())
    : column.width;
  const left = column.left + (column.width - width) / 2;
  const box = rhythm.getBoundingClientRect();
  await near(box.width, width, 0.5, 'the band’s width');
  await near(box.left, left, 0.5, 'the band’s left edge');
  for (const [element, label] of [
    [eyebrow, 'the eyebrow’s left edge'],
    [heading, 'the title’s left edge'],
  ] as const) {
    await near(element.getBoundingClientRect().left, left, 1, label);
    await expect(getComputedStyle(element).textAlign).toBe('start');
  }
};

/**
 * THE TILES' CONTRACT (D9), DERIVED FROM THE MEASURED COLUMN — never from the
 * pinned window, so the one helper holds at every width the net or the
 * workbench samples:
 *   · every tile has THE width of its regime — 352 × s inside the scale, with
 *     a 192 × s portrait; on a phone (a column under 28rem) the column's own,
 *     like the doctor cards above it on the page (the owner, 2026-10-09: "as
 *     the doctor cards are"), and 18rem off one, with a 12rem portrait either
 *     way — so a phone's tile grows sideways, never in height — whatever its
 *     words;
 *   · the row holds as many as fit, one gap apart — 20px outside the scale,
 *     24 design pixels inside it: three inside the scale at every width
 *     (3 × 352 + 2 × 24 = 1104 of 1106 design pixels), two on any 768 window,
 *     one on a phone — and every row starts at the column's start, its slack
 *     at its end (never spread: D9);
 *   · the tiles that share a row share a TOP and a HEIGHT, the card's surface
 *     with them (the `h-full`-in-a-stretched-item mechanism), and a tile past
 *     the row starts a new one, 24 (design) px lower.
 * The words are in the real faces first: a row's height is a text measure.
 */
const expectTiles = async (
  band: HTMLElement,
  regime: Regime,
): Promise<void> => {
  const { scalable, s, column } = regime;
  const list = within(band).getByRole('list');
  const tiles = [...list.children] as HTMLElement[];
  for (const text of list.querySelectorAll('h3, p')) await loadFace(text);

  const row = list.getBoundingClientRect();
  // The phone's line is the container query's own: ui/Container's width
  // against the named `md` step (TeamRoster's TILE).
  const phone = column.width < PHONE_REM * rem();
  const tileWidth = scalable
    ? TILE_DESIGN * s
    : phone
      ? row.width
      : TILE_REM * rem();
  const portraitWidth = scalable ? PORTRAIT_DESIGN * s : PORTRAIT_REM * rem();
  const gap = scalable ? GAP_X_DESIGN * s : GAP_X_REM * rem();
  const rowGap = scalable ? GAP_Y_DESIGN * s : GAP_Y_REM * rem();

  const boxes = tiles.map((tile) => tile.getBoundingClientRect());
  for (const [index, tile] of tiles.entries()) {
    await near(boxes[index].width, tileWidth, 0.5, `tile ${index + 1}’s width`);
    const card = tile.firstElementChild;
    if (!(card instanceof HTMLElement)) {
      throw new Error(`TeamRoster story: tile ${index + 1} lost its card`);
    }
    await near(
      card.getBoundingClientRect().height,
      boxes[index].height,
      0.5,
      `tile ${index + 1}’s card fills it`,
    );
    const portrait = tile.querySelector('img');
    if (portrait === null) {
      throw new Error(`TeamRoster story: tile ${index + 1} has no portrait`);
    }
    await near(
      portrait.getBoundingClientRect().width,
      portraitWidth,
      0.5,
      `tile ${index + 1}’s portrait`,
    );
  }

  const perRow = Math.max(
    1,
    Math.floor((row.width + gap + 0.5) / (tileWidth + gap)),
  );
  if (scalable) await expect(perRow).toBe(3);
  for (let start = 0; start < boxes.length; start += perRow) {
    const line = boxes.slice(start, start + perRow);
    const tops = line.map((box) => box.top);
    await expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(1);
    const heights = line.map((box) => box.height);
    await expect(
      Math.max(...heights) - Math.min(...heights),
    ).toBeLessThanOrEqual(1);
    // Every row starts at the column (D9) — and a phone's one tile, the
    // column's width, ends at its end too.
    await near(line[0].left, row.left, 0.5, 'a row starts at the column');
    // Start-aligned, one fixed gap — never spread (D9): no hole can open
    // between two tiles, the row's slack stays at its end.
    for (let index = 1; index < line.length; index += 1) {
      await near(
        line[index].left - line[index - 1].right,
        gap,
        0.5,
        'the gap between two tiles',
      );
    }
    const next = boxes[start + perRow];
    if (next !== undefined) {
      await near(
        next.top - Math.max(...line.map((box) => box.bottom)),
        rowGap,
        1,
        'the gap between two rows',
      );
    }
  }
};

/** Every story's play: the facts, the opener, the tiles, no sideways scroll.
 *  Returns the band. */
const expectBand = async (
  canvasElement: HTMLElement,
  expected: Expected,
): Promise<HTMLElement> => {
  const band = await expectRoster(canvasElement, expected);
  const regime = regimeOf(band);
  await expectOpener(band, regime, expected);
  await expectTiles(band, regime);
  await expectNoSidewaysScroll(band);
  return band;
};

/**
 * A DEVICE'S SCROLLBAR — the `Tablet` and `Narrowest` stories' `beforeEach`.
 * A phone's or a tablet's scrollbar overlays the page and takes no width; a
 * desktop browser's classic one takes 15px, which the shell's
 * `scrollbar-gutter: stable` (globals.css) reserves — and the workbench with a
 * mouse connected and the Vitest storybook project both run with the classic
 * one (measured there: a 599.4px column at 768, 273px at 320 — 241 before THE
 * PHONE GUTTER, 2026-10-09). At 768 it was,
 * until the same day's fold, the whole difference between the two faces of
 * D9: 599.4px is 0.6px short of two 288px tiles and a 24px gap (600), so a
 * DESKTOP window held at 768 stood its tiles one a row while the TABLET, with
 * its 614.4px column, showed two — which is why D9's least gap between two
 * tiles of a row is 20px now (596), and both show two. The device stories
 * still show the DEVICE's column, the one a visitor's phone or tablet has, so
 * they hide the document's scrollbar for their own
 * run — `scrollbar-width: none` on the root, which takes the bar and its
 * reserved gutter away, as a browser's device emulation does — and the
 * function returned is the cleanup Storybook runs before the next story
 * (stories share one document; DoctorShowcase's `top` is the precedent).
 */
const deviceScrollbar = (): (() => void) => {
  const root = document.documentElement;
  const before = root.style.getPropertyValue('scrollbar-width');
  root.style.setProperty('scrollbar-width', 'none');
  return () => {
    if (before) root.style.setProperty('scrollbar-width', before);
    else root.style.removeProperty('scrollbar-width');
  };
};

/** The device's scrollbar took no width (`deviceScrollbar`): the band's column
 *  and ui/Container's two margins span the whole window, edge to edge. Never
 *  vacuous — a classic bar leaves them 15px short. */
const expectEdgeToEdge = async (band: HTMLElement): Promise<void> => {
  const column = band.firstElementChild;
  if (!(column instanceof HTMLElement)) {
    throw new Error('TeamRoster story: the band lost its column');
  }
  const { marginLeft, marginRight } = getComputedStyle(column);
  await near(
    column.getBoundingClientRect().width +
      parseFloat(marginLeft) +
      parseFloat(marginRight),
    window.innerWidth,
    0.5,
    'the column and its gutter, edge to edge',
  );
};

const meta = {
  title: 'Sections/TeamRoster',
  component: TeamRoster,
  parameters: {
    layout: 'fullscreen',
  },
  args: { eyebrow: EYEBROW_RO, title: TITLE_RO, members: MEMBERS },
  argTypes: {
    eyebrow: {
      control: 'text',
      description:
        'The mono micro-label over the title, finished and already translated (§8.1) — the page’s `team.roster.eyebrow`, authored in SENTENCE case, because the uppercase is ui/Eyebrow’s CSS',
    },
    title: {
      control: 'text',
      description:
        'The band’s real <h2> — the page’s `team.roster.title` — and, through aria-labelledby, the region’s accessible name, its text alone. A title wraps between words and never inside one',
    },
    members: {
      control: false,
      description:
        'The auxiliary personnel, in reading order, as tiles of ONE width per regime in a wrapping row (run D9, since 2026-10-02): on a phone the column’s own width, one a row, like the doctor cards (since 2026-10-09); 18rem (288px) on every tablet and touch screen and under the band scale’s step — two on a 768 tablet, three on an iPad held sideways — and 352 design pixels on a laptop or a desktop from a max(56rem, 896px) column, three to a row at every width, growing with the band (§15.32). Each tile’s name is an <h3> under the band’s own <h2>. EMPTY renders nothing at all. Not a live control: a text knob over portraits and their intrinsic sizes would only ever produce a broken tile',
    },
    className: {
      control: false,
      description:
        'Placement only, merged LAST onto the <section> (§6.4/§6.8). The band owns its own paint, gutter and vertical rhythm; the page owns the space BETWEEN bands — the numbers band comes after this one',
    },
  },
} satisfies Meta<typeof TeamRoster>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * THE BAND — Romanian, at the laptop width: the eyebrow over the band's <h2>,
 * then the three staff tiles on one row, each 352 design pixels wide — the
 * band scale's design pixel, so at 1536 the tiles, the portraits, the names,
 * the title and the eyebrow are all ≈ 1.1 times the owner's 1401 window's
 * (§15.32), and three tiles fill the row at every laptop and desktop width.
 *
 * The equal heights are not a `minHeight` prop the card refuses to own: the
 * row stretches its ITEM (`align-items: stretch`), and `h-full` on the
 * <article> inside the stretched <li> is what makes the surface follow, so the
 * third tile's wrapping position lifts the whole row instead of leaving its
 * neighbours short.
 *
 * **1536 · 390 · 320 (`stress-320`):** one row of three at 1536; at the phone
 * widths one tile a row, the column's own width like the doctor cards' —
 * 336px in the photographed frame at 390 and 273 at 320 (a phone's own column
 * is 351 and 288 since THE PHONE GUTTER, ui/Container) — its 192px portrait
 * centred in it, and nothing scrolling sideways. The play reads back what a
 * picture cannot — the region named by its <h2>, no <h1>, ONE list, the tiles
 * in DOM order each named by its own <h3>, no link — and every size DERIVED
 * from the measured column, so the one assertion holds at every width.
 */
export const Default: Story = {
  tags: ['stress-320'],
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: async ({ canvasElement, args }) => {
    await expectBand(canvasElement, args);
  },
};

/**
 * GERMAN, THE LONGEST LOCALE (§8.4: ≈ +30–35% over English) — the phone width
 * carrying the words this band is most likely to break on: „Zahnmedizinische
 * Fachangestellte" in a mono eyebrow that never hyphenates (PersonnelCard D5),
 * under names that wear `hyphens-none` one tier down too, and the opener's
 * German drafts — every line here may only wrap between words.
 *
 * **390 · 1536 · 320 (`stress-320`):** one tile a row at the phone widths,
 * the column's own width (336px at 390 and 273 at 320 in the frame) — the
 * position wrapping inside it without protruding;
 * at 1536 the two tiles share one row from its start, two-thirds of it, the
 * tile the size it is in `Default` (start-aligned, D9: no hole between them).
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  args: {
    eyebrow: EYEBROW_DE,
    title: TITLE_DE,
    members: [
      {
        id: 'ioana-tepes',
        name: 'Friederike Obermüller',
        position: 'Zahnmedizinische Fachangestellte',
        photo: PORTRAITS.ioana,
      },
      {
        id: 'mihaela-craciun',
        name: 'Margarethe Baumgartner',
        position: 'Zahnmedizinische Fachangestellte',
        photo: PORTRAITS.mihaela,
      },
    ],
  },
  play: async ({ canvasElement, args }) => {
    await expectBand(canvasElement, args);
  },
};

/**
 * THE TABLET — §7's 768 sampling point, held upright, with the tablet's own
 * scrollbar, which takes no width (`deviceScrollbar`): two tiles a row, 288px
 * each and 20px apart from the start of a 614px column, and the third under
 * the first, never stretched to fill its row (D9; the owner: "important for
 * phone and tablet make them a fixed size or smth" — on a phone the tile is
 * the column's own since 2026-10-09, on a tablet still 288). A
 * desktop window held at 768 has 15px less column and shows the same two a
 * row (the helper says why). For the workbench and its play: 'no-visual' (the
 * header says why).
 */
export const Tablet: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro', viewport: { value: 'tablet' } },
  beforeEach: deviceScrollbar,
  play: async ({ canvasElement, args }) => {
    await expectEdgeToEdge(await expectBand(canvasElement, args));
  },
};

/**
 * THE NARROWEST WINDOW — 320px, the accessibility stress width (§7), with a
 * phone's own scrollbar, which takes no width (`deviceScrollbar`): a 288px
 * column since 2026-10-09 (THE PHONE GUTTER, ui/Container; 256 until then),
 * every tile the column's own width like the doctor cards' on the page (D9's
 * phone rule, the same day) — one a row, its 192px portrait centred, and
 * nothing — no tile, no word of the opener — scrolling the page sideways. The
 * pixel net photographs `Default` and `GermanLongest` at 320 already
 * ('stress-320', under the classic scrollbar its baselines are recorded with —
 * a 273px column); this story holds the play at the phone's own width in the
 * Vitest storybook project: 'no-visual' (the header).
 */
export const Narrowest: Story = {
  tags: ['no-visual'],
  globals: { locale: 'ro', viewport: { value: 'stress320' } },
  beforeEach: deviceScrollbar,
  play: async ({ canvasElement, args }) => {
    await expectEdgeToEdge(await expectBand(canvasElement, args));
  },
};
