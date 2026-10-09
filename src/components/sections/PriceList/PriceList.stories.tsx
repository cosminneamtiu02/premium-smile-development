import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor } from 'storybook/test';
import {
  PriceList,
  PRICE_MENU_ID,
  type PriceCategoryProps,
  type PriceListProps,
} from './PriceList';

// SIX stories: the everyday picture in both languages, and each of them pinned
// to the two widths §13 samples for this tier. The export NAMES are
// load-bearing — each one names a baseline file
// (`sections-pricelist--romanian`, `sections-pricelist--german-laptop1536`, …)
// — so renaming or adding an export re-records pictures; this list IS the
// section's contribution to the lane's visual manifest. The `Sections/*` title
// prefix routes every one of them to 390 + 1536
// (tests/visual/stories.spec.ts, §13).
//
// ── THE BAND TAKES ITS WHOLE CONTENT AS ARGS, because it is DUMB (owner
// fb-459, board §2c.1): no message file, no data module, no `t()`. So the
// fixtures below are the control surface — the locale toolbar changes nothing
// here, which is the §8.9 sweep PASSING rather than failing, and it is why the
// German stress is typed out as its own deck instead of produced by flipping
// the toolbar (the SectionHeading / PersonnelCard precedent).
// Every story still PINS ITS OWN LANGUAGE with `globals`, and that pin is
// load-bearing even so: .storybook/preview.tsx stamps `<html lang>` from it,
// and the body's site-wide `hyphens: auto` (§15.14) picks its hyphenation
// dictionary from the declared language — a German compound row name breaks
// differently under `lang="de"` than under `lang="ro"`, which is precisely
// what the German stories exist to photograph.
//
// ── EVERY STORY PINS ITS OWN VIEWPORT except the two workbench ones, because
// this band CHANGES SHAPE with the column it is given: the menu sits beside
// the cards, sticky, only from `@3xl` — 48rem of Container column, i.e. a
// viewport of ~960px — and below it the menu is simply the first thing on the
// page, a plain table of contents above the cards (board §5.2, option A). A
// manager canvas narrowed by the sidebar sits in the middle of that band.
// Playwright ignores the pin — it sets its own page size per project — which
// is exactly why the play functions DERIVE the expected arrangement from the
// measured column instead of assuming the pinned width (the PersonnelCard
// `sitsBeside` precedent).
//
// ── THE BAND SCALE (2026-10-02, CLAUDE.md §15.32 — PriceList.tsx's paragraph
// of that name). On a laptop or a desktop — a mouse or trackpad, in an engine
// that registers custom properties, from a column of max(56rem, 896px) — the
// whole band is one design drawn at a 1106px column and scaled to its own,
// never under the theme's own pixel (its THE FLOOR), so the plays never
// assume a size: `regimeOf` reads which side of the scale the play stands on
// off the browser and the band's own column (TeamRoster's recipe), never off
// the pinned window, and every expected length is its design length × the
// design pixel that side gives — s = max(rem / 16, min(column, 96rem) / 1106)
// inside the scale, the root's rem / 16 outside it. In the Vitest storybook
// project the pointer is Chromium's fine one, so the laptop pins are drawn
// past the reference (s ≈ 1.10 at 1536) and the unpinned stories' 1200px
// canvas inside the scale at its floor, s = 1 — the regime on, every pixel
// the theme's — and the phone pins are not in it at all. Under the floor the
// sizes alone cannot tell a regime that ran from one the sheet skipped (both
// draw the theme's pixels, and the design pixel reads `1px` either way), so
// `expectBandScale` reads what the SHEET did — the theme remapped on the
// rhythm box — and holds it equal to the play's own prediction, and
// `expectScaled` asserts that, wherever the window must be past the step, the
// sheet did run it. In the pixel net every 1536 frame is drawn past the
// reference and every 390 frame as before.
//
// ── WHAT THE PLAYS DELIBERATELY DO NOT DO: click. The band's island marks the
// category the visitor is at, and both of its inputs — a click and a scroll —
// MOVE THE PAGE, which would photograph a different frame than the one the
// baselines hold. So the plays assert the load-time state only (the first
// category marked, exactly once — on its link AND on its card, which is
// therefore the one card in the band that glows: the page is at it, and since
// the owner's 2026-09-29 word the others wear no glow at all); the pin and the
// scroll walk are exercised in PriceList.test.tsx and in src/lib/scroll-spy,
// where the runner owns the scroll position, and the glow's fade in
// tests/e2e/price-current-aura.spec.ts, against the built export.
//
// ── layout 'fullscreen' because the band is full-bleed and brings its own
// gutter clamp (ui/Container): Storybook's default canvas padding would add a
// second inset on top of it and put the story's ground and the band's margins
// on two different rulers.
//
// The tariff below is INVENTED — plausible Romanian dental treatments at
// plausible prices, not the clinic's sheet, which is the owner's to author
// (§15.17) and the page's to format. Romanian with full diacritics (§15.7),
// descriptive only: no superlative, no promise, no result guarantee (the CMSR
// advertising rules for dental practices, in force since 2025-07-01).

/** The Romanian deck. Every category carries an eyebrow — required in this
 *  band since the owner's 2026-09-14 round — and Endodonție carries the
 *  80-character row name that decides whether a name and its price can share a
 *  line at all; Protetică is the long card, with the four-digit prices that
 *  make `tabular-nums` visible. */
const ROMANIAN_CATEGORIES = [
  {
    id: 'consultations',
    name: 'Consultații',
    eyebrow: 'Primul pas către tratament',
    rows: [
      {
        id: 'consultation',
        name: 'Consultație și plan de tratament',
        price: '150 RON',
      },
      { id: 'recall', name: 'Reevaluare periodică', price: '100 RON' },
    ],
  },
  {
    id: 'endodontics',
    name: 'Endodonție',
    eyebrow: 'Tratamente la microscop',
    rows: [
      {
        id: 'composite',
        name: 'Obturație coronară definitivă cu material compozit (fizionomic) – două suprafețe',
        price: '350 RON',
      },
      {
        id: 'one-canal',
        name: 'Tratament endodontic pe un canal',
        price: '450 RON',
      },
      {
        id: 'three-canals',
        name: 'Tratament endodontic pe trei canale',
        price: '750 RON',
      },
      {
        id: 'fractured-instrument',
        name: 'Îndepărtarea unui instrument fracturat, sub microscop',
        price: '300 RON',
      },
    ],
  },
  {
    id: 'prosthetics',
    name: 'Protetică',
    eyebrow: 'Lucrări fixe și mobile',
    rows: [
      {
        id: 'zirconia-crown',
        name: 'Coroană din zirconiu, cu fațetare ceramică',
        price: '2.300 RON',
      },
      {
        id: 'metal-ceramic-crown',
        name: 'Coroană metalo-ceramică',
        price: '1.300 RON',
      },
      {
        id: 'monolithic-crown',
        name: 'Coroană din zirconiu monolitic',
        price: '2.000 RON',
      },
      { id: 'veneer', name: 'Fațetă ceramică', price: '2.300 RON' },
      { id: 'inlay', name: 'Inlay ceramic', price: '1.300 RON' },
      {
        id: 'flexible-denture',
        name: 'Proteză flexibilă totală',
        price: '3.000 RON',
      },
      {
        id: 'acrylic-denture',
        name: 'Proteză acrilică totală',
        price: '1.800 RON',
      },
      {
        id: 'denture-repair',
        name: 'Reparație proteză, per element',
        price: '250 RON',
      },
    ],
  },
  {
    id: 'orthodontics',
    name: 'Ortodonție',
    eyebrow: 'Aparate fixe și gutiere',
    rows: [
      {
        id: 'fixed-braces',
        name: 'Aparat dentar fix metalic, per arcadă',
        price: '2.500 RON',
      },
      { id: 'retainer', name: 'Gutieră de contenție', price: '600 RON' },
    ],
  },
] as const satisfies readonly PriceCategoryProps[];

/** The German deck — the CALIBRATION fixture. German runs 30–35% longer than
 *  English (§8.4) and its compounds are single unbreakable-looking words, so
 *  it is what decides whether the menu track's 15rem floor and the row's `@sm`
 *  reflow sit in the right place: „Kinderzahnheilkunde" is 19 letters that may
 *  not be syllable-split in the MENU (§15.14, `hyphens-none` on the link),
 *  while the ~90-character row name below may and must break in the CARD,
 *  where it is prose. The eyebrows are the second-longest line on each card
 *  and stress the same box. The fragment ids stay English in every language
 *  (owner fb-461) — a URL is not copy. */
const GERMAN_CATEGORIES = [
  {
    id: 'consultations',
    name: 'Beratung',
    eyebrow: 'Der erste Schritt zur Behandlung',
    rows: [
      {
        id: 'consultation',
        name: 'Beratung und Behandlungsplanung',
        price: '150 RON',
      },
      {
        id: 'recall',
        name: 'Regelmäßige Nachkontrolle',
        price: '100 RON',
      },
    ],
  },
  {
    id: 'pediatric',
    name: 'Kinderzahnheilkunde',
    eyebrow: 'Behandlung unter dem Mikroskop',
    rows: [
      {
        id: 'root-canal',
        name: 'Wurzelkanalbehandlung unter dem Mikroskop einschließlich definitiver Kronenversorgung je Zahn',
        price: '750 RON',
      },
      {
        id: 'sealant',
        name: 'Fissurenversiegelung je Zahn',
        price: '150 RON',
      },
      {
        id: 'filling',
        name: 'Kinderzahnfüllung, zweiflächig',
        price: '250 RON',
      },
    ],
  },
  {
    id: 'prosthetics',
    name: 'Prothetische Versorgung',
    eyebrow: 'Festsitzend und herausnehmbar',
    rows: [
      {
        id: 'zirconia-crown',
        name: 'Vollkeramikkrone aus Zirkonoxid mit Keramikverblendung',
        price: '2.300 RON',
      },
      {
        id: 'metal-ceramic-crown',
        name: 'Metallkeramikkrone',
        price: '1.300 RON',
      },
      {
        id: 'telescopic-denture',
        name: 'Teleskopprothese je Kiefer',
        price: '3.000 RON',
      },
      {
        id: 'denture-repair',
        name: 'Prothesenreparatur je Element',
        price: '250 RON',
      },
    ],
  },
  {
    id: 'orthodontics',
    name: 'Kieferorthopädie',
    eyebrow: 'Feste Spangen und Schienen',
    rows: [
      {
        id: 'fixed-braces',
        name: 'Festsitzende Zahnspange aus Metall je Kiefer',
        price: '2.500 RON',
      },
      { id: 'retainer', name: 'Retentionsschiene', price: '600 RON' },
    ],
  },
] as const satisfies readonly PriceCategoryProps[];

/** The one label the page owns as a message key — here, a finished string. */
const ROMANIAN = {
  menuTitle: 'Categorii',
  categories: ROMANIAN_CATEGORIES,
} satisfies PriceListProps;

const GERMAN = {
  menuTitle: 'Kategorien',
  categories: GERMAN_CATEGORIES,
} satisfies PriceListProps;

const meta = {
  title: 'Sections/PriceList',
  component: PriceList,
  parameters: { layout: 'fullscreen' },
  args: ROMANIAN,
} satisfies Meta<typeof PriceList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The band must never make the page scroll sideways (§7), in any language.
 *  Band-scoped: nothing here clips or overflows on purpose, so the band's own
 *  box is the honest thing to measure. */
const expectNoSidewaysScroll = async (band: HTMLElement): Promise<void> => {
  await expect(band.scrollWidth).toBeLessThanOrEqual(band.clientWidth);
};

/** The band root, from the one element every play starts at. */
const bandOf = (menu: HTMLElement): HTMLElement =>
  menu.closest('section') as HTMLElement;

/** The root font size, which is what `rem` resolves against everywhere —
 *  including inside a container query. globals.css keeps <html> at 16px on
 *  purpose (§7: user zoom must scale everything), but reading it is what makes
 *  these assertions survive a visitor who changed it. */
const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/**
 * WHERE THE LAYOUT SPLITS, derived rather than assumed. `@3xl` is 48rem of
 * ui/Container's column, and a container query asks that box's CONTENT width —
 * Container has neither padding nor border, so its border-box width IS the
 * queried number, taken fractionally (`clientWidth` is an integer and would
 * disagree with the engine inside a sub-pixel window around the step). The
 * visual runner renders every `Sections/*` story at 390 AND 1536 regardless of
 * the story's own viewport pin, so a play that assumed the pinned width would
 * be green in the workbench and wrong in the net.
 */
const splitHasFired = (band: HTMLElement): boolean =>
  (band.firstElementChild as HTMLElement).getBoundingClientRect().width >=
  48 * rem();

/** THE BAND SCALE's numbers (PriceList.tsx's THE BAND SCALE; ui/Container's),
 *  written out as the other scaled bands' plays write them: the REFERENCE
 *  column, where a design pixel is a CSS pixel; the CAP in rem of the root
 *  (1536px at the default 16px, a 1920 window's column); THE STEP's two
 *  halves, `@4xl`'s 56rem and the 896px floor. */
const REFERENCE = 1106;
const CAP_REM = 96;
const STEP_REM = 56;
const STEP_FLOOR = 896;

/** The scale's two GATES — globals.css's `scalable:` — read off the browser
 *  the play runs in: a fine primary pointer (a mouse or a trackpad), in an
 *  engine that registers custom properties (the relative colour syntax
 *  shipped with `@property`). */
const scaleGatesOpen = (): boolean =>
  window.matchMedia('(pointer: fine)').matches &&
  CSS.supports('color', 'rgb(from red r g b)');

/** The column from which the scale applies — max(56rem, 896px). */
const scaleStepPx = (): number => Math.max(STEP_REM * rem(), STEP_FLOOR);

/** Which side of the band scale this play stands on, read off the browser and
 *  the band's own column (ui/Container, the band's first box), never off the
 *  pinned window — and the DESIGN PIXEL every theme length is drawn in: `s`
 *  inside the scale, never under the root's rem / 16 (the band's floor,
 *  PriceList.tsx's THE FLOOR — the theme's own pixel at any root), and that
 *  same rem / 16 outside it (TeamRoster's `regimeOf`, floored). */
type Regime = Readonly<{
  scalable: boolean;
  s: number;
  unit: number;
  column: DOMRect;
  rhythm: HTMLElement;
}>;

const regimeOf = (band: HTMLElement): Regime => {
  const column = band.firstElementChild;
  const rhythm = column?.firstElementChild;
  if (!(column instanceof HTMLElement) || !(rhythm instanceof HTMLElement)) {
    throw new Error('PriceList story: the band lost its column');
  }
  const box = column.getBoundingClientRect();
  const scalable = scaleGatesOpen() && box.width >= scaleStepPx();
  const s = scalable
    ? Math.max(rem() / 16, Math.min(box.width, CAP_REM * rem()) / REFERENCE)
    : 1;
  return {
    scalable,
    s,
    unit: scalable ? s : rem() / 16,
    column: box,
    rhythm,
  };
};

/** `actual` within `tolerance` of `expected`, the message naming both. */
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

const fontSizeOf = (element: Element): number =>
  parseFloat(getComputedStyle(element).fontSize);

/** The node a query found, as an HTMLElement — or a failure that NAMES what
 *  went missing (`regimeOf`'s own check, for one node at a time), so a lost
 *  node fails with its name instead of a TypeError further on. */
const htmlElement = (
  node: Element | null | undefined,
  name: string,
): HTMLElement => {
  if (!(node instanceof HTMLElement)) {
    throw new Error(`PriceList story: no ${name}`);
  }
  return node;
};

/** DID THE SHEET RUN THE REGIME on this box — read off what the CSS did,
 *  never off the play's own prediction: globals.css's `design-scale` remaps
 *  `--spacing` on the box that wears it, and only there does the box hold a
 *  value other than the root's (PriceList.scale.test.tsx's `remapped`). The
 *  design pixel cannot answer it under the band's floor: at s = 1 a declared
 *  `--scale-px` reads `1px` — exactly the registered initial value an
 *  undeclared one reads. */
const remapped = (element: Element): boolean =>
  getComputedStyle(element).getPropertyValue('--spacing').trim() !==
  getComputedStyle(document.documentElement)
    .getPropertyValue('--spacing')
    .trim();

/**
 * The arrangement contract, in the branch the measured column actually puts us
 * in (board §3.3, §5.2):
 *   · beside the cards — the menu is `sticky` at 8.5rem, the header pill's
 *     6rem reach plus the 2.5rem that clears the glow around it (the FIFTH
 *     coupled spelling of that reach, measured in PriceList.tsx's header);
 *   · stacked — the menu is a plain static table of contents at the top of the
 *     band, which is the whole phone design.
 * In EITHER, the menu's own 2.5rem of air over a jump to its id. Both numbers
 * are rem of the root on purpose — inside the band scale too, where every
 * other length is a design length: the pill they clear does not scale
 * (PriceList.tsx's `@3xl:top-[8.5rem]` paragraph). This is the assertion that
 * needs REAL CSS, which is why it lives in a play function: the components
 * project loads no stylesheet (PriceList.test.tsx's header says so) and can
 * only see class tokens — the one file there that loads it,
 * PriceList.scale.test.tsx, holds the same pair at five columns.
 */
const expectArrangement = async (
  band: HTMLElement,
  menu: HTMLElement,
): Promise<void> => {
  await expect(getComputedStyle(menu).scrollMarginTop).toBe(`${2.5 * rem()}px`);
  if (splitHasFired(band)) {
    await expect(getComputedStyle(menu).position).toBe('sticky');
    await expect(getComputedStyle(menu).top).toBe(`${8.5 * rem()}px`);
  } else {
    await expect(getComputedStyle(menu).position).toBe('static');
  }
  // The way back to the menu was dropped entirely (owner 2026-09-14): in
  // EITHER arrangement there is no link to the menu's own id anywhere in the
  // band — not hidden, not display:none, simply absent.
  await expect(
    band.querySelectorAll(`a[href="#${PRICE_MENU_ID}"]`),
  ).toHaveLength(0);
};

/** The menu and the cards are the same array printed twice (board §1.3), so
 *  every link must land on a card that exists, named by its own <h2>, and
 *  focusable as a fragment target (board §4.2). */
const expectMenuMatchesCards = async (
  band: HTMLElement,
  categories: readonly PriceCategoryProps[],
): Promise<void> => {
  const menu = band.querySelector('nav') as HTMLElement;
  const links = Array.from(menu.querySelectorAll('a'));
  const document_ = band.ownerDocument;

  await expect(links).toHaveLength(categories.length);
  await expect(links.map((link) => link.textContent)).toEqual(
    categories.map((category) => category.name),
  );

  for (const [index, link] of links.entries()) {
    const category = categories[index];
    await expect(link).toHaveAttribute('href', `#${category.id}`);

    const card = document_.getElementById(category.id) as HTMLElement;
    await expect(card.tagName).toBe('SECTION');
    await expect(card).toHaveAttribute('tabindex', '-1');

    const heading = document_.getElementById(`${category.id}-title`);
    await expect(card).toHaveAttribute(
      'aria-labelledby',
      `${category.id}-title`,
    );
    await expect(heading?.tagName).toBe('H2');
    await expect(heading?.textContent).toBe(category.name);
  }
};

/**
 * THE CURRENT CATEGORY, at load: exactly one link is marked, it is the FIRST,
 * and it wears ui/TextButton's `active` look (owner 2026-09-14 — the hover END
 * state, drawn statically). `location` and not `page`: this is where you are
 * WITHIN the page (PriceMenu.tsx argues the pair). Nothing here clicks or
 * scrolls — see the header's note on what the plays deliberately do not do.
 */
const expectCurrentIsFirst = async (
  band: HTMLElement,
  categories: readonly PriceCategoryProps[],
): Promise<void> => {
  const links = Array.from(
    (band.querySelector('nav') as HTMLElement).querySelectorAll('a'),
  );
  const marked = links.filter(
    (link) => link.getAttribute('aria-current') !== null,
  );

  await expect(marked).toHaveLength(1);
  await expect(marked[0]).toBe(links[0]);
  await expect(marked[0]).toHaveAttribute('aria-current', 'location');
  await expect(marked[0].textContent).toBe(categories[0].name);
  // WHAT THIS PLAY DOES NOT MEASURE, and why: the PAINT of that marker. The
  // link flips from resting to active one frame after mount (the island's
  // effect), and ui/TextButton puts `color` on a 200ms clock and the
  // underline's scale on a 300ms one — so any computed value read here is an
  // interpolated frame, not the end state (measured in this lane: both links
  // read the same ink at play time). The TOKENS are pinned where they can be
  // read honestly, in PriceList.test.tsx, and the end state is what the
  // baselines photograph.
};

/** The mark the band's island stamps on the category card the visitor is at —
 *  the attribute ui/Card's `aura="current"` answers to. Spelled here and never
 *  imported, PriceList.test.tsx's CURRENT for the same reason: a silent rename
 *  must fail in the plays too. */
const CURRENT = 'data-current';

/**
 * Leave the band at REST before a painted value is read — ui/Card's own
 * settle (its ToneMorph and AuraOnCurrent plays), with `subtree`, which is
 * what includes a pseudo-element's transition. One frame first, so the style
 * change that starts a fade has been seen; then every animation in the band is
 * awaited to its last frame. No timeout, because these plays run in TWO
 * runners: Vitest's storybook project, where motion is allowed and the glow
 * really fades, and the visual net, which sets `prefers-reduced-motion:
 * reduce` — nothing animates there, the list is empty and this resolves at
 * once.
 * IN ROUNDS, not one look (release gate, 2026-10-03): a fade can START after
 * the first look — the island stamps its mark in a passive effect, a task of
 * its own after the commit that wrote the link's aria-current — and one look
 * then awaits only the fades already running. CI read the first card's layer
 * at 0 twice that way (2026-09-30, and the release container 2026-10-03);
 * with the stamp held back 150ms every story caught the glow mid-fade
 * (measured). So: a frame, every animation then running, and again, until a
 * frame passes with nothing running. A fade interrupted by a mark that moves
 * on is not a failure here (its `finished` rejects; the next round looks
 * again), and the rounds are bounded, so a looping animation fails the
 * assertion that follows instead of hanging the run.
 */
const settle = async (band: HTMLElement): Promise<void> => {
  for (let round = 0; round < 10; round += 1) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
    const running = band.getAnimations({ subtree: true });
    if (running.length === 0) return;
    await Promise.all(
      running.map((animation) => animation.finished.catch(() => undefined)),
    );
  }
};

/**
 * THE GLOW, at load (owner 2026-09-29: "add aura shadow just to currently
 * selected/viewed price box … what category card is not selected gets no
 * aura"). The page is at the FIRST category, so the island has stamped the
 * mark on exactly one card — the first — and ui/Card's `aura="current"` shows
 * that card's glow layer and no other's. END STATES ONLY, after the settle:
 * the plays run in two runners and only one of them lets anything move, so
 * nothing here asserts that a fade exists (the fade is
 * tests/e2e/price-current-aura.spec.ts's, on the built export). Unlike the
 * link's paint (expectCurrentIsFirst's note), the glow IS read as a painted
 * value here — the settle is what makes that honest. It lives on each card's
 * `::before` layer, so no category card paints a shadow on its own box, while
 * the MENU card wears its glow for good, on the <nav> itself, and is never
 * marked.
 */
const expectGlowOnCurrentOnly = async (
  band: HTMLElement,
  categories: readonly PriceCategoryProps[],
): Promise<void> => {
  const cards = categories.map(
    (category) => band.ownerDocument.getElementById(category.id) as HTMLElement,
  );
  // The mark is a STATE to wait for, not one to assume: expectCurrentIsFirst
  // saw the link's aria-current, which React writes in its commit, and the
  // island stamps the card in a passive effect after it (settle's IN ROUNDS).
  await waitFor(() => expect(cards[0]).toHaveAttribute(CURRENT));
  await settle(band);

  const marked = cards.filter((card) => card.hasAttribute(CURRENT));

  await expect(marked).toHaveLength(1);
  await expect(marked[0]).toBe(cards[0]);
  for (const [index, card] of cards.entries()) {
    await expect(getComputedStyle(card, '::before').opacity).toBe(
      index === 0 ? '1' : '0',
    );
    await expect(getComputedStyle(card).boxShadow).toBe('none');
  }

  const menu = band.querySelector('nav') as HTMLElement;
  await expect(getComputedStyle(menu).boxShadow).not.toBe('none');
  await expect(menu).not.toHaveAttribute(CURRENT);
};

/** One <dt> and one <dd> per row, in the deck's order, plus the eyebrow rule:
 *  EVERY category has one since the owner's 2026-09-14 round, and it is the
 *  card's only <p>. */
const expectCardContents = async (
  band: HTMLElement,
  categories: readonly PriceCategoryProps[],
): Promise<void> => {
  for (const category of categories) {
    const card = band.ownerDocument.getElementById(category.id) as HTMLElement;
    const rows = Array.from((card.querySelector('dl') as HTMLElement).children);

    await expect(rows).toHaveLength(category.rows.length);
    for (const [index, row] of rows.entries()) {
      await expect(row.querySelector('dt')?.textContent).toBe(
        category.rows[index].name,
      );
      await expect(row.querySelector('dd')?.textContent).toBe(
        category.rows[index].price,
      );
    }

    await expect(
      Array.from(card.querySelectorAll('p'), (p) => p.textContent),
    ).toEqual([category.eyebrow]);
  }
};

/** The query container a heading's `@md:` step answers to: the nearest
 *  ancestor that carries a container-type. For every title in this band that
 *  is ITS OWN CARD (ui/Card puts `@container` on the element it lands on) —
 *  never the band's column — which is the whole reason the menu's title and
 *  the card titles can read different sizes side by side. */
const queryContainerOf = (element: HTMLElement): HTMLElement | null => {
  let node = element.parentElement;
  while (node !== null && getComputedStyle(node).containerType === 'normal') {
    node = node.parentElement;
  }
  return node;
};

/** The box a container query measures: the CONTENT width — border and
 *  padding off — taken fractionally, for splitHasFired's sub-pixel reason. */
const contentWidth = (element: HTMLElement): number => {
  const style = getComputedStyle(element);
  return (
    element.getBoundingClientRect().width -
    parseFloat(style.borderInlineStartWidth) -
    parseFloat(style.borderInlineEndWidth) -
    parseFloat(style.paddingInlineStart) -
    parseFloat(style.paddingInlineEnd)
  );
};

/**
 * The outline: the menu's title and one title per card, all <h2>, nothing
 * skipped and nothing invented (§9). The page's own <h1> lives above the band,
 * which is why there is none here.
 *
 * THE SIZES, read back from real CSS and derived per element rather than
 * assumed per story. Every title wears ui/Heading's `band` step (D48, §15.24's
 * one size per outline level): 30 on a container narrower than 28rem, 36 from
 * it — and each title's container is its own card. So the expectation is
 * computed from THAT card's measured content box, which keeps the play true at
 * whatever width the canvas or the visual runner gives it (the splitHasFired
 * precedent) — and drawn in the band's DESIGN PIXEL (`regimeOf`): 30 or 36
 * design pixels inside the band scale, 30 or 36px outside it, while the 28rem
 * the query asks is ALWAYS the root's (a container query never reads the
 * band's pixel). What that implies, in PriceMenu.tsx's "THE TITLE'S STEP IS
 * `band`" paragraph: beside the cards, „Categorii" sits in the menu's track at
 * its floor and reads 30 next to 36 card titles — px without the scale, design
 * pixels inside it; stacked, the menu spans the cards' column and reads their
 * size exactly (30px on the phone). Two relations are pinned on top of the
 * per-element sizes, because they are the design claims and not the engine's
 * arithmetic: beside, the menu's title never outranks a card title; stacked,
 * every title in the band is one size.
 */
const expectHeadingOutline = async (
  band: HTMLElement,
  categories: readonly PriceCategoryProps[],
): Promise<void> => {
  const headings = Array.from(
    band.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6'),
  );

  await expect(headings.map((heading) => heading.tagName)).toEqual(
    Array<string>(categories.length + 1).fill('H2'),
  );

  // Each title paired with the card it belongs to — the menu's with the <nav>,
  // each category's with its <section> — in DOM order, which is the outline's.
  const document_ = band.ownerDocument;
  const menu = band.querySelector('nav') as HTMLElement;
  const pairs: ReadonlyArray<readonly [HTMLElement, HTMLElement]> = [
    [menu.querySelector('h2') as HTMLElement, menu],
    ...categories.map(
      (category) =>
        [
          document_.getElementById(`${category.id}-title`) as HTMLElement,
          document_.getElementById(category.id) as HTMLElement,
        ] as const,
    ),
  ];
  for (const [index, [title]] of pairs.entries()) {
    await expect(title).toBe(headings[index]);
  }

  const sizeOf = (title: HTMLElement): number =>
    parseFloat(getComputedStyle(title).fontSize);
  const { unit } = regimeOf(band);
  for (const [title, card] of pairs) {
    await expect(queryContainerOf(title)).toBe(card);
    const step = contentWidth(card) >= 28 * rem() ? 36 : 30;
    await near(
      sizeOf(title),
      step * unit,
      0.05,
      `the title „${title.textContent}"`,
    );
  }

  const [menuTitle, ...cardTitles] = headings;
  for (const cardTitle of cardTitles) {
    if (splitHasFired(band)) {
      await expect(sizeOf(menuTitle)).toBeLessThanOrEqual(sizeOf(cardTitle));
    } else {
      await expect(sizeOf(cardTitle)).toBe(sizeOf(menuTitle));
    }
  }
};

/**
 * THE BAND SCALE (2026-10-02, §15.32 — PriceList.tsx's paragraph), asserted
 * on whichever side of it the play finds itself (`regimeOf`): the menu AND the
 * cards in one design pixel. Inside the scale the rhythm box declares
 * s = max(rem / 16, min(column, 96rem) / 1106) — the band's floor first, so
 * under the reference s is the theme's own pixel — and is the column capped
 * at 96rem and centred in it; outside it nothing is declared — the registered
 * 1px — and the box is the column. Either way, beside the cards the menu's
 * track is its floor, sixty spacing steps (240 design pixels, or 15rem),
 * unless its 1fr share is wider — which inside the scale it never is — and
 * the cards' column the rest; every card's eyebrow reads 14 and every row 16; every menu link's
 * label 18 on a box of at least 44 (`min-h-11`, the §9 floor, drawn in the
 * design pixel: a label that wraps onto a second line — „Prothetische
 * Versorgung" — makes its box taller, never shorter). No face to load: a font
 * SIZE, a grid track and a minimum box do not depend on which face has
 * arrived.
 * FIRST, WHAT THE SHEET DID (the G2 review, 2026-10-02): the remap on the
 * rhythm box (`remapped`), held EQUAL to the play's own prediction — so a
 * regime the sheet skipped, or ran where the play says it must not, fails
 * here by name, even under the floor, where every number of the theme and of
 * the scale agree. Returns what the sheet did, for `expectScaled`.
 */
const expectBandScale = async (
  band: HTMLElement,
  categories: readonly PriceCategoryProps[],
): Promise<boolean> => {
  const { scalable, s, unit, column, rhythm } = regimeOf(band);
  const document_ = band.ownerDocument;
  const menu = htmlElement(band.querySelector('nav'), 'menu <nav>');

  const applied = remapped(rhythm);
  await expect(
    applied,
    'the sheet ran the regime exactly where the play predicts it',
  ).toBe(scalable);

  const pixel = getComputedStyle(rhythm).getPropertyValue('--scale-px');
  if (scalable) {
    await near(parseFloat(pixel), s, 0.0001, 'the design pixel');
  } else {
    await expect(pixel).toBe('1px');
  }

  // THE COLUMN — the Container's, or the cap's centred in it.
  const box = rhythm.getBoundingClientRect();
  await near(
    box.width,
    scalable ? Math.min(column.width, CAP_REM * rem()) : column.width,
    0.5,
    'the band’s column',
  );
  await near(
    box.left - column.left,
    column.right - box.right,
    1,
    'the band’s centring',
  );

  // THE TWO TRACKS, beside the cards (PriceList.tsx's THE TWO TRACKS).
  if (splitHasFired(band)) {
    const gap = 32 * unit;
    const menuTrack = Math.max(240 * unit, (box.width - gap) / 5);
    const firstCard = htmlElement(
      document_.getElementById(categories[0].id),
      `card #${categories[0].id}`,
    );
    const cards = htmlElement(firstCard.parentElement, 'cards’ column');
    await near(
      menu.getBoundingClientRect().width,
      menuTrack,
      0.5,
      'the menu’s track',
    );
    await near(
      cards.getBoundingClientRect().width,
      box.width - gap - menuTrack,
      0.5,
      'the cards’ column',
    );
  }

  // A card's words, and the menu's links — the titles are
  // expectHeadingOutline's.
  for (const category of categories) {
    const card = htmlElement(
      document_.getElementById(category.id),
      `card #${category.id}`,
    );
    await near(
      fontSizeOf(
        htmlElement(card.querySelector('p'), `eyebrow of #${category.id}`),
      ),
      14 * unit,
      0.05,
      `${category.name}: the eyebrow`,
    );
    for (const cell of card.querySelectorAll('dt, dd')) {
      await near(fontSizeOf(cell), 16 * unit, 0.05, `${category.name}: a row`);
    }
  }
  for (const link of menu.querySelectorAll('a')) {
    await near(fontSizeOf(link), 18 * unit, 0.05, `${link.textContent}: label`);
    await expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(
      44 * unit - 0.5,
    );
  }
  return applied;
};

/**
 * THE SCALE IS NOT VACUOUS where the story is drawn to see it (DoctorStats'
 * `expectScaled`): under open gates, a window whose column MUST be past the
 * step — 80 % of it less 17px of classic scrollbar at most, the gutter never
 * more than 10vw a side up to its 2000px cap (exactly that from a 600px
 * window, half of it on a phone since ui/Container's THE PHONE GUTTER,
 * 2026-10-09 — a narrower gutter only widens the column) and the column only
 * wider beyond — must have drawn the scale. `applied` is what the SHEET did
 * (`expectBandScale`'s remap), never the play's prediction, so a regime the
 * sheet skipped fails here even where the band's floor makes every size of
 * the theme and of the scale agree — the unpinned stories' 1200px canvas.
 * Conditioned on the live window and browser, so a runner photographing the
 * story at a phone's width runs it without a false failure.
 */
const expectScaled = async (applied: boolean): Promise<void> => {
  if (scaleGatesOpen() && window.innerWidth >= (scaleStepPx() + 17) / 0.8) {
    await expect(applied).toBe(true);
  }
};

/** Everything every story checks, against the deck it was handed. Written once
 *  because the band's contract does not change with the language — only the
 *  words and the box do, and those are what each story pins. */
const playDeck =
  (deck: PriceListProps): NonNullable<Story['play']> =>
  async ({ canvas }) => {
    // The role query is the a11y assertion: the menu is a NAVIGATION landmark
    // named by its own visible title (board §3.4), not a generic box.
    const menu = canvas.getByRole('navigation', { name: deck.menuTitle });
    const band = bandOf(menu);

    await expect(menu).toHaveAttribute('id', PRICE_MENU_ID);

    await expectMenuMatchesCards(band, deck.categories);
    await expectCardContents(band, deck.categories);
    // The scale BEFORE any size that depends on it: if the sheet skipped the
    // regime, the first failure says so, not a heading size it threw off.
    await expectScaled(await expectBandScale(band, deck.categories));
    await expectHeadingOutline(band, deck.categories);
    await expectCurrentIsFirst(band, deck.categories);
    await expectGlowOnCurrentOnly(band, deck.categories);
    await expectArrangement(band, menu);
    await expectNoSidewaysScroll(band);
  };

/** The longest row name in a deck — the German stories assert their stress is
 *  real rather than trusting a number in a comment to stay true. */
const longestRowName = (categories: readonly PriceCategoryProps[]): number =>
  Math.max(
    ...categories.flatMap((category) =>
      category.rows.map((row) => row.name.length),
    ),
  );

/**
 * The everyday picture, Romanian, at whatever width the canvas gives it.
 *
 * What to look at: the menu card on the left, its „Categorii" title one step
 * under the card titles beside it — 30 to their 36, the `band` step read
 * against the menu's own card at its floor (PriceMenu.tsx's header) — with a
 * rule under it, then four links, each a 44 row — the first one lavender and
 * underlined, because that is where the page currently is; on a laptop or a
 * desktop all of them in the band's design pixel, so the menu and the cards
 * grow together with the window (PriceList.tsx's THE BAND SCALE); the cards
 * on the right, each opening with its own eyebrow and <h2> — the first one
 * wearing the header pill's lavender glow, because the page is at it, and the
 * others none (owner 2026-09-29: the glow follows the menu's mark, fading in
 * and out);
 * the price column right-aligned with tabular digits so „2.300 RON" and
 * „150 RON" line up, one column however wide the card gets. Click a menu entry
 * and the browser jumps — the jump itself is still the browser's, and the only
 * JavaScript involved is the one line that marks the item you chose.
 */
export const Romanian: Story = {
  globals: { locale: 'ro' },
  play: playDeck(ROMANIAN),
};

/**
 * The same band in German — the CALIBRATION story (§8.4).
 *
 * The three things to look at, all of them reasons the numbers in
 * PriceList.tsx are what they are: „Kinderzahnheilkunde" must fit the menu
 * track's floor on ONE line, because §15.14 forbids syllable-breaking an
 * interactive label; „Prothetische Versorgung" must not push the card's
 * heading into its rows; and the ~90-character compound row name must wrap
 * inside the card without ever colliding with its price. If a label ever stops
 * fitting, the FLOOR moves — never the architecture, and never in this file
 * alone.
 * MEASURED 2026-10-02 (Source Serif 4 at the link's weight 500): the stress
 * word is 181.4px wide at 18px, and its LINK — the word plus the atom's right
 * padding, less the `-ml-2` pull — has 182px of the menu's content box at the
 * reference: one line with 0.6px to spare. The band's floor (PriceList.tsx's
 * THE FLOOR) never lets the design pixel fall under 1, so under the reference
 * the word keeps exactly those numbers, and past it the typeface's optical
 * size draws the word NARROWER per em as it grows, so its room only widens:
 * ≈ 5px at 1536, ≈ 10px at the cap. It never overruns. (The plain scale,
 * before the floor, drew it under s ≈ 0.986 and let the link's right padding
 * run a few pixels past the content edge — 5.5px at the scale's step.) It is a
 * STRESS word, on no real page: the real tariff's longest single word,
 * „Kieferorthopädie" (142.2px), keeps ≈ 40px of room up to the reference and
 * more past it.
 */
export const German: Story = {
  globals: { locale: 'de' },
  args: GERMAN,
  play: async (context) => {
    await playDeck(GERMAN)(context);
    // The stress is real, not a fixture that drifted short over time.
    await expect(longestRowName(GERMAN_CATEGORIES)).toBeGreaterThanOrEqual(85);
  },
};

/**
 * The phone, Romanian — one of the two widths §13 samples for this tier.
 *
 * Below the split the band is ONE column: the menu card first, as a plain
 * table of contents (board §5.2, option A — the pattern every printed
 * brochure uses, one DOM, no second menu), then the cards. Inside a card the
 * rows stack — the name on its line, the price under it — because at 390 the
 * card's inside is ~301px (~262 until ui/Container's THE PHONE GUTTER halved
 * a phone's margins, 2026-10-09; 286px in the test runner, under its 15px
 * scrollbar) and an 80-character treatment name needs the whole of it
 * (board §5.3).
 */
export const Smartphone390: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  play: playDeck(ROMANIAN),
};

/**
 * The laptop, Romanian — the other sampled width, and the one that shows the
 * design the owner asked for: the menu beside the cards, stuck 8.5rem down so
 * it clears the header pill AND the glow around it, while the price cards
 * scroll past it and the marked link follows them — and, since 2026-10-02,
 * the band past the reference in its design pixel (s ≈ 1.10 at 1536): menu
 * and cards one design, grown together, the 8.5rem line alone left at the
 * pill's. At 1280 the same band holds the theme's own pixels (its floor).
 */
export const Laptop1536: Story = {
  globals: { locale: 'ro', viewport: { value: 'laptop' } },
  play: playDeck(ROMANIAN),
};

/** German on the phone: the compound row names at their narrowest measure,
 *  where `hyphens: auto` under `lang="de"` is what keeps them inside the
 *  card — and where the menu labels, which may NOT break, still have to fit. */
export const GermanSmartphone390: Story = {
  globals: { locale: 'de', viewport: { value: 'smartphone' } },
  args: GERMAN,
  play: playDeck(GERMAN),
};

/** German on the laptop: the split layout at its most expansive, and the
 *  measurement that decides the menu track's floor — „Kinderzahnheilkunde" on
 *  one unbroken line inside the menu's card at its floor (240 design pixels
 *  here, past the reference, where the word's room has grown to ≈ 5px). */
export const GermanLaptop1536: Story = {
  globals: { locale: 'de', viewport: { value: 'laptop' } },
  args: GERMAN,
  play: playDeck(GERMAN),
};
