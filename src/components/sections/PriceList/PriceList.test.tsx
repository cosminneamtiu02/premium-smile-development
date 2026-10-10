import { createRef, StrictMode } from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  bandColumnClasses,
  bandScaleClasses,
  containerClasses,
} from '@/components/ui/Container/Container';
import { PillButton } from '@/components/ui/PillButton/PillButton';
import { TextButton } from '@/components/ui/TextButton/TextButton';
import arrivalSource from './arrival.ts?raw';
import cardSource from './CategoryCard.tsx?raw';
import {
  PriceList,
  PRICE_MENU_ID,
  type PriceCategoryProps,
  type PriceListProps,
  type PriceRowProps,
} from './PriceList';
import source from './PriceList.tsx?raw';
import { PriceMenu } from './PriceMenu';
import menuSource from './PriceMenu.tsx?raw';

// sections/PriceList — the interaction suite. Role-based queries on purpose
// (§9, §13): a passing suite doubles as proof of accessible markup. Every
// fixture is Romanian with diacritics (§15.7) and every visible word is a
// PROP, because that is the band's whole contract (owner fb-459, board
// §2c.1) — there is no message file to check against here, and the sweep at
// the bottom proves the band adds no word of its own (§17.4).
//
// Styles are NOT loaded in this project (tests/setup/components.ts imports no
// stylesheet), so computed values would read back as browser defaults: the
// utility TOKENS are the contract here, the convention every component test in
// this repo follows (Footer, GlyphButton, ClinicLocation). The facts that only
// real CSS can prove — that the menu is `position: sticky` at 8.5rem once the
// split fires, and, since 2026-10-02, what THE BAND SCALE draws (every length
// in the band's design pixel, never under the theme's own — THE FLOOR — and
// the pill's pair at 136px and 40px at every width) — are asserted where
// globals.css is loaded and the box can be
// measured: PriceList.stories.tsx's play functions and the file beside this
// one, PriceList.scale.test.tsx. That file loads the sheet, so it lives apart:
// this one must keep its stylesheet-free premise for the scrolling below (its
// header says why). The scale's CLASS contract stays here (THE BAND SCALE
// block, after the jump menu's).
//
// ── WHAT IS DIFFERENT SINCE THE PACK ROUND (owner 2026-09-14): the band now
// has ONE island, ./PriceMenu, so this file also drives a REAL SCROLL. The
// stylesheet's absence is what makes that possible to write honestly: the
// suite sets `scroll-padding-top` on <html> and stretches the cards itself,
// so the landing arithmetic it exercises is the page's own (lib/scroll-spy
// reads those two properties and nothing else) with numbers this file owns.
// The mechanics have their own suite next door (src/lib/scroll-spy); what is
// pinned here is the WIRING — that the marker exists, that it starts on the
// first category, that scrolling moves it and that a click pins it.
// AND SINCE 2026-09-18 the island is the whole menu CARD, holding a second
// store (lib/sticky-rail) that decides where the card is held when it is
// taller than the window. Same division of labour: the state machine has its
// own suite beside the module; here the WIRING is pinned — the rail finds the
// nav by the band's id, the mode lands as `data-rail`, the number as an
// inline `top`, and the server HTML carries neither. The stylesheet's absence
// cuts the other way for this store: no CSS makes the nav sticky, so the
// wiring test lends it an inline sticky rule and a resize, and reads the
// attribute back. AND SINCE 2026-09-29 the spy's one answer lands twice — as
// the link's `aria-current` and as `data-current` on the category card that
// link points at, the mark ui/Card's `aura="current"` shows its glow for —
// so the tests that follow the first mark follow the second too, and pin
// that the two never disagree and that the card's mark leaves with the island.
// AND SINCE ROUND 5 (owner, 2026-09-29) two things more. The spy measures
// against THE READING LINE — the middle of the window's clear area,
// `(scroll-padding-top + innerHeight) / 2`, bent near both ends of the page —
// and writes each card's landing as its inline `scroll-margin-top`, so the
// scrolling tests are argued against that line: from the fixture's own
// geometry and the design's own statement of it (a card becomes current as its
// top crosses the line; the first at the top; the last at the end), never from
// a copy of lib/reading-line's arithmetic, whose own suite owns the numbers.
// And the island tells a keyboard's arrival from a pointer's — a click's
// `detail`, 0 for the keyboard's, the click count for a pointer's — and stamps
// the keyboard's card `data-arrival="keyboard"`, so that card alone keeps its
// focus ring. user-event drives both kinds for real: its Enter on a link
// dispatches a click with `detail` 0 and its pointer click counts 1, as both
// engines do (the planner's probe on the built page).
//
// NOTHING IS MOCKED: no router, no cookie, no clock, no message provider. A
// dumb band needs none of them, which is the point of the shape.

const MENU_TITLE = 'Categorii';

/** Three categories is the smallest deck that can prove the pairing: every one
 *  of them carries an eyebrow (owner 2026-09-14 — required in this band), and
 *  the last one a four-digit price. The stories' deck is the realistic one —
 *  this is the shape. */
const CATEGORIES: readonly PriceCategoryProps[] = [
  {
    id: 'consultations',
    name: 'Consultații',
    eyebrow: 'Primul pas către tratament',
    rows: [
      {
        id: 'first-visit',
        name: 'Consultație inițială și plan de tratament',
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
        id: 'single-canal',
        name: 'Tratament endodontic — un canal',
        price: '450 RON',
      },
      {
        id: 'retreatment',
        name: 'Retratament endodontic sub microscop',
        price: '700 RON',
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
      { id: 'inlay', name: 'Inlay ceramic', price: '1.300 RON' },
    ],
  },
];

const ROWS: readonly PriceRowProps[] = CATEGORIES.flatMap(
  (category) => category.rows,
);

/** Every visible string the band is handed — the sweep's alphabet. */
const FIXTURE_WORDS = [
  MENU_TITLE,
  ...CATEGORIES.flatMap((category) => [category.name, category.eyebrow]),
  ...ROWS.flatMap((row) => [row.name, row.price]),
];

/** ui/Card's glow utility, spelled in the TEST and never in the components:
 *  this band passes the atom's `aura` PROP, so no `shadow-aura` string exists
 *  in its source — exactly what tests/unit/aura-token.test.ts's census expects
 *  of a section that wears the glow this way. Pinning it here is how the WEAR
 *  stays guarded. */
const AURA = 'shadow-aura';

/** The two tokens of the ARMED glow (`aura="current"`, owner 2026-09-29): the
 *  same glow on the card's `::before` layer, and the one rule that shows that
 *  layer while the card carries the mark. Spelled here for AURA's reason. */
const ARMED_GLOW = 'before:shadow-aura';
const SHOWN_WHILE = 'data-current:before:opacity-100';

/** The mark the island stamps on the category card the visitor is at — the
 *  attribute ui/Card's `aura="current"` answers to. Spelled independently of
 *  the atom's CARD_CURRENT_ATTRIBUTE, so a silent rename fails here. */
const CURRENT = 'data-current';

/** Every category card that carries the mark, in document order. */
const markedCards = (): HTMLElement[] =>
  screen.getAllByRole('region').filter((card) => card.hasAttribute(CURRENT));

/** The island's stamp on a card the KEYBOARD jumped to, and its one value
 *  (owner 2026-09-29) — spelled here, never imported from ./arrival, CURRENT's
 *  reason. */
const ARRIVAL = 'data-arrival';
const KEYBOARD = 'keyboard';

/** The card's class that hides the ring wherever that stamp is absent. */
const QUIET_RING = 'not-data-[arrival=keyboard]:focus-visible:outline-hidden';

/** Every element in the document that carries the stamp — the whole document,
 *  so a stamp left on a card that has already left it is still found through
 *  the node a test kept. */
const stampedElements = (): Element[] =>
  Array.from(document.querySelectorAll(`[${ARRIVAL}]`));

/** The shell's own `scroll-padding-top: 6rem`, in the pixels this file sets on
 *  <html> for the scrolling tests — globals.css is not loaded here. */
const SCROLL_PADDING = 96;

/** THE READING LINE as this project can have it: the middle of the window's
 *  clear area, `(scroll-padding-top + innerHeight) / 2`, in viewport pixels —
 *  the design's own statement of it (lib/scroll-spy's THE READING LINE), with
 *  the shell's padding this file sets. */
const readingLine = (): number => (SCROLL_PADDING + window.innerHeight) / 2;

const mount = () =>
  render(<PriceList menuTitle={MENU_TITLE} categories={CATEGORIES} />);

/** The band root — the rendered <section> itself; everything else is found
 *  through a role. */
const bandOf = (container: HTMLElement): HTMLElement =>
  container.firstElementChild as HTMLElement;

const tokensOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

/** A class's VARIANT CHAIN — split at every colon OUTSIDE brackets, so an
 *  arbitrary value's own colon (`supports-[color:…]`) stays inside its
 *  variant; the utility, after the last colon, is dropped
 *  (tests/unit/design-scale.test.ts's `parse`, for this band's guards). */
const variantsOf = (token: string): string[] => {
  const variants: string[] = [];
  let depth = 0;
  let part = '';
  for (const char of token) {
    if (char === '[') depth += 1;
    else if (char === ']') depth -= 1;
    if (char === ':' && depth === 0) {
      variants.push(part);
      part = '';
    } else {
      part += char;
    }
  }
  return variants;
};

/** THE CONTAINER GUARD (the 'measures the CONTAINER' test below): does a
 *  variant ask the WINDOW's size — a breakpoint, an arbitrary `min-`/`max-`
 *  width, an arbitrary `[@media…]`, or the window's orientation? Read on its
 *  form with every leading `not-` STRIPPED, so a negated breakpoint is one
 *  too (G2 typescript, 2026-10-10: `not-md`, `not-max-sm` and
 *  `not-[@media(…)]` slipped past the first reading, and `landscape` /
 *  `portrait` were not counted at all). `pointer-fine` and its negation ask
 *  the device, not the window. */
const VIEWPORT_VARIANT =
  /^(?:(?:max-|min-)?(?:sm|md|lg|xl|2xl)|(?:min|max)-\[.*|\[@media.*|landscape|portrait)$/;
const asksTheWindow = (variant: string): boolean =>
  VIEWPORT_VARIANT.test(variant.replace(/^(?:not-)+/, ''));

/** The page-level media chains the menu documents (PriceList.tsx's THE GATE,
 *  PriceMenu.tsx's THE STRIP'S CLEARANCE) — compared in their RAW spelling,
 *  so a negation can never pose as one (`not-min-[60rem]` is not
 *  `min-[60rem]`). */
const ALLOWED_MEDIA = new Set([
  'min-[60rem]',
  '[@media(min-height:30rem)]',
  '[@media(min-height:30rem)] max-[60rem]',
]);

/** THE CONTAINER GUARD on one class's variant chain: true when it passes — no
 *  window variant at all, or exactly one documented media chain, the rail's
 *  `min-[60rem]` always under `pointer-fine`. */
const passesTheContainerGuard = (chain: readonly string[]): boolean => {
  const media = chain.filter(asksTheWindow);
  if (media.length === 0) return true;
  if (!ALLOWED_MEDIA.has(media.join(' '))) return false;
  return !media.includes('min-[60rem]') || chain.includes('pointer-fine');
};

/** A class's UTILITY — what is left after its last top-level colon. */
const utilityOf = (token: string): string => {
  const variants = variantsOf(token);
  return variants.length === 0
    ? token
    : token.slice(variants.join(':').length + 1);
};

/** THE TWO PRESENTATIONS (owner 2026-10-09 — PriceMenu.tsx's paragraph of
 *  that name): ONE <nav>, the RAIL's card with its list, and the STRIP's list
 *  of chips. This project loads no stylesheet, so BOTH lists render and both
 *  are in the tab order here; the suites below drive the rail's list — the
 *  presentation the band has always tested, and the one the island's watcher
 *  answers when both have a box — and the strip's by its own id. */
const STRIP_ID = `${PRICE_MENU_ID}-strip`;

/** The rail's card — the box the <h2> sits in (ui/Card, no longer `asChild`
 *  onto the <nav>). Found through the title's id, not its role: in the
 *  strip's state the rail is `display: none` and its heading leaves the
 *  accessibility tree, and the helpers must still reach it. */
const railCard = (): HTMLElement =>
  document.getElementById(`${PRICE_MENU_ID}-title`)
    ?.parentElement as HTMLElement;

/** The rail's box — the card's parent, the element the rail's gate shows. */
const railBox = (): HTMLElement => railCard().parentElement as HTMLElement;

/** The rail's list of links. */
const railList = (): HTMLElement => within(railCard()).getByRole('list');

/** The strip's list of chips. */
const stripList = (): HTMLElement =>
  document.getElementById(STRIP_ID) as HTMLElement;

/** The rail's links, in order — what every suite here that says "the menu"
 *  means. */
const menuLinks = (): HTMLElement[] => within(railList()).getAllByRole('link');

/** The strip's chips, in order. */
const stripLinks = (): HTMLElement[] =>
  within(stripList()).getAllByRole('link');

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Scroll the page and let the browser deliver its scroll event — dispatched at
 * the next rendering opportunity, never synchronously. Inside `act` because
 * the island's store publishes from that listener, i.e. a React update that
 * starts outside React.
 */
const scrollToY = async (y: number): Promise<void> => {
  await act(async () => {
    window.scrollTo(0, y);
    await nextFrame();
    await nextFrame();
  });
};

/** Make the cards tall enough to be read one at a time, and give <html> the
 *  scroll padding the real shell has. Returns, for a card, the scroll offset
 *  at which its top edge sits exactly ON the reading line — where the design
 *  says it becomes current. Every stretched card is taller than the window and
 *  far from both ends of the page, where nothing bends the line (lib/scroll-
 *  spy's THE READING LINE); a test that reads the line near an end says so. */
const stretchCards = (): ((id: string) => number) => {
  document.documentElement.style.scrollPaddingTop = `${SCROLL_PADDING}px`;
  for (const category of CATEGORIES) {
    const card = document.getElementById(category.id) as HTMLElement;
    card.style.minHeight = '1500px';
  }
  return (id: string): number =>
    Math.round(
      (document.getElementById(id) as HTMLElement).getBoundingClientRect().top +
        window.scrollY -
        readingLine(),
    );
};

/** Tab until `link` has focus — the way a keyboard visitor reaches it — with a
 *  guard of a dozen presses and a failure that says so BY NAME. */
const tabTo = async (link: HTMLElement): Promise<void> => {
  for (
    let press = 0;
    press < 12 && document.activeElement !== link;
    press += 1
  ) {
    await userEvent.tab();
  }
  expect(link, 'Tab never reached the menu link').toHaveFocus();
};

/**
 * The band's sources with their PROSE removed, which is what the island and
 * data guards at the bottom run against (mechanism from
 * ClinicLocation.test.tsx, reasoning written out in full in
 * Wordmark.test.tsx). Without it the guards police the files' own
 * documentation: every header discusses `'use client'` and `t()` by name.
 * ONE LEFT-TO-RIGHT PASS (the G2 typescript review, 2026-10-02, M2 — the same
 * shape as tests/unit/design-scale.test.ts's `tsCode`): string literals are
 * stepped over whole, and a `//` comment — which opens only at a line's start
 * or after whitespace, so a URL or a regex in code survives — is consumed
 * before a `/*` inside it can open a block that runs on to the next `*\/` and
 * hides the code between. The two-pass version it replaces stripped blocks
 * FIRST, so a `src/messages/*.json` in a line comment would have hidden code
 * from every guard and turned each `not.toMatch` vacuous; the stripper's own
 * test, in the island block, holds that case.
 */
const stripComments = (code: string): string =>
  code.replace(
    /('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|(?<=^|\s)\/\/[^\n]*/gm,
    (match: string, literal: string | undefined) => literal ?? ' ',
  );

const CODE = stripComments(source);
const CARD_CODE = stripComments(cardSource);
const MENU_CODE = stripComments(menuSource);
const ARRIVAL_CODE = stripComments(arrivalSource);

// The jump really navigates in this runner (see the fragment test) and the
// island really scrolls the page, so both survive a test. Put the URL, the
// scroll position and the inline styles back, or the next test file inherits
// a hash, an offset and a 4500px-tall document that have nothing to do with it.
afterEach(() => {
  // The island FIRST: its watcher restores the root's own inline
  // scroll-padding when it leaves (THE STRIP'S CLEARANCE), so it must leave
  // before the root is put back below — or a test's 96px would outlive it.
  cleanup();
  if (window.location.hash !== '') {
    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search,
    );
  }
  document.documentElement.style.scrollPaddingTop = '';
  window.scrollTo(0, 0);
  // The stamp tests spy on a card's listeners; the spies go with the test.
  vi.restoreAllMocks();
});

describe('PriceList — the band', () => {
  it('is a full-bleed <section> that paints the page ground, clips its x overflow, and names nothing', () => {
    // The band deliberately carries no aria-labelledby of its own: the PAGE
    // owns the intro heading above it and names it from there (board §3.1).
    // Spelling a role would be redundant ARIA (§9, semantic HTML first).
    // `overflow-x-clip` is the strip's belt (2026-10-09, PriceList.tsx's band
    // root comment): a 100vw strip overshoots by a classic scrollbar — and
    // NEVER `overflow-x-hidden`, the ReviewsCarousel's fallback, which would
    // make the band a scroll container and kill both sticky menus.
    const { container } = mount();
    const band = bandOf(container);

    expect(band.tagName).toBe('SECTION');
    expect(band).not.toHaveAttribute('role');
    expect(band).not.toHaveAttribute('aria-labelledby');
    expect(band.className).toBe('overflow-x-clip bg-page');
    expect(band.className).not.toMatch(/overflow-x-hidden|overflow-hidden/);
  });

  it('merges the caller className LAST, keeping the band’s own class first', () => {
    // Order is the contract, not an accident (§6.8) — a deterministic
    // convention the tests pin, NOT a cascade mechanism (attribute order never
    // decides CSS specificity), and §6.8 limits caller utilities to placement.
    const { container } = render(
      <PriceList
        menuTitle={MENU_TITLE}
        categories={CATEGORIES}
        className="col-span-2"
      />,
    );

    expect(bandOf(container).className).toBe(
      'overflow-x-clip bg-page col-span-2',
    );
  });

  it('spreads remaining native props onto the root <section>', () => {
    const { container } = render(
      <PriceList
        menuTitle={MENU_TITLE}
        categories={CATEGORIES}
        id="prices"
        data-slot="price-list"
      />,
    );

    expect(bandOf(container)).toHaveAttribute('id', 'prices');
    expect(bandOf(container)).toHaveAttribute('data-slot', 'price-list');
  });

  it('accepts ref as a regular prop (React 19) — it is the <section>', () => {
    const band = createRef<HTMLElement>();

    render(
      <PriceList menuTitle={MENU_TITLE} categories={CATEGORIES} ref={band} />,
    );

    expect(band.current?.tagName).toBe('SECTION');
    expect(band.current).toHaveClass('bg-page');
  });

  it('carries NO outer margin — the page owns the rhythm around it (§6.4)', () => {
    const { container } = mount();

    expect(
      tokensOf(bandOf(container)).filter((c) => /^-?m[trblxyse]?-/.test(c)),
    ).toEqual([]);
  });

  it('composes ui/Container for the gutter, and steps the rhythm one level in', () => {
    // The band root paints; the gutter box one level in is the container
    // (Container's PAGE-BAND RECIPE, rule 1). The clamp is asserted through
    // the atom's EXPORTED constant rather than written out —
    // tests/unit/gutter-single-spelling.test.ts fences src/ against a second
    // spelling, and a copy here would be the paste the promotion prevents.
    const { container } = mount();
    const band = bandOf(container);
    const gutter = band.firstElementChild as HTMLElement;

    expect(tokensOf(band)).not.toContain('@container');
    for (const token of containerClasses.split(' ')) {
      expect(tokensOf(gutter)).toContain(token);
    }

    const grid = gutter.firstElementChild as HTMLElement;
    expect(tokensOf(grid)).toEqual(
      expect.arrayContaining([
        'grid',
        'gap-8',
        'py-12',
        '@lg:py-16',
        '@3xl:py-20',
        // The menu's floor in the SPACING STEP — sixty of them, 15rem outside
        // the band scale and 240 design pixels inside it (PriceList.tsx's THE
        // TWO TRACKS): a literal rem floor would not follow the scale. Behind
        // the RAIL's gate since 2026-10-09 — a fine pointer AND the column's
        // `@3xl` — because a touch screen keeps one column and the strip.
        'pointer-fine:min-[60rem]:grid-cols-[minmax(calc(var(--spacing)*60),1fr)_4fr]',
        // Without it a grid item is stretched to the row's height and the
        // sticky menu has nothing left to stick against (board §3.3).
        'pointer-fine:min-[60rem]:items-start',
      ]),
    );
  });

  it('measures the CONTAINER, never the viewport (§6.5), in NAMED steps only — bar the band scale’s own chain, and bar the menu’s one documented page-level MEDIA gate', () => {
    // A media query here would react to the window instead of the boxes the
    // band actually occupies. Read VARIANT BY VARIANT along every class's
    // chain, never as a substring — `@3xl:` legitimately contains "xl:", and a
    // breakpoint could hide behind another variant. The band scale's two
    // strings (ui/Container's THE BAND SCALE) are the one exception, taken
    // whole and never re-spelled here: their gate, `scalable:`, asks the
    // POINTER, a property of the device and no width, and their floor,
    // `@min-[896px]`, is the regime's documented step — held to its one
    // spelling by tests/unit/design-scale.test.ts, not by this band.
    const { container } = mount();
    const band = bandOf(container);
    const named = /^@(3xs|2xs|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)$/;
    const fromTheScale = new Set([
      ...bandColumnClasses.split(' '),
      ...bandScaleClasses.split(' '),
    ]);

    const everything = [band, ...band.querySelectorAll('*')];
    const chains = everything
      .flatMap((el) => tokensOf(el))
      .filter((c) => !fromTheScale.has(c))
      .map(variantsOf);
    // THE ONE MEDIA GATE (G2, 2026-10-09 — PriceList.tsx's THE GATE,
    // PriceMenu.tsx's THE STRIP'S CLEARANCE): the menu's two presentations,
    // its stick and the root's clearance must flip on ONE boundary, and the
    // clearance is a rule on the ROOT, which can ask the window but never a
    // container — so exactly these page-level media chains may appear, each a
    // WINDOW property and documented: the rail's `min-[60rem]` (always under
    // `pointer-fine`), the stick's `[@media(min-height:30rem)]`, and the
    // clearance's `[@media(min-height:30rem)]` + `max-[60rem]`. No other
    // window width may enter the band (passesTheContainerGuard, above).
    for (const chain of chains) {
      expect(passesTheContainerGuard(chain), chain.join(':')).toBe(true);
    }

    const steps = chains.flat().filter((v) => v.startsWith('@'));
    expect(steps.length).toBeGreaterThan(0);
    // No custom container step may enter the untouched default scale (§3).
    for (const step of steps) expect(step).toMatch(named);
  });

  it('…and the guard has TEETH: a negated breakpoint, a negated arbitrary width or media query, the window’s orientation, and a negation posing as the rail’s own step all FAIL it', () => {
    // Fed through the guard's own functions — so a guard that stops seeing
    // any one of these fails here, not in a review.
    const offenders: readonly (readonly string[])[] = [
      ['not-md'],
      ['not-max-sm'],
      ['not-[@media(min-width:40rem)]'],
      ['landscape'],
      ['portrait'],
      ['pointer-fine', 'not-min-[60rem]'],
    ];
    for (const chain of offenders) {
      expect(passesTheContainerGuard(chain), chain.join(':')).toBe(false);
    }
    // …while what the band documents still passes — the device's pointer,
    // negated or not, included.
    expect(passesTheContainerGuard(['pointer-fine', 'min-[60rem]'])).toBe(true);
    expect(passesTheContainerGuard(['not-pointer-fine'])).toBe(true);
    expect(
      passesTheContainerGuard(['[@media(min-height:30rem)]', 'max-[60rem]']),
    ).toBe(true);
  });

  it('renders NOTHING at all for an empty tariff', () => {
    // The sections/ReviewsCarousel answer, verbatim — and here it is load-
    // bearing rather than tidy: the menu island builds a scroll-spy from these
    // ids, and lib/scroll-spy refuses an empty list, so without the band's own
    // guard `categories={[]}` would type-check and then throw during the static
    // export (G2 typescript, 2026-09-14).
    const { container } = render(
      <PriceList menuTitle={MENU_TITLE} categories={[]} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('rebuilds the menu’s ring when the categories themselves change', () => {
    // The island freezes its ids at mount and has no `setIds` (§16: page data
    // is compiled at build time). The band keys it by its own id list so React
    // remounts it if that assumption is ever broken — a Storybook control
    // swapping decks on a mounted story, which would otherwise leave the spy
    // walking ids no link carries and marking nothing (G2 react, 2026-09-14).
    const other = CATEGORIES.map((category, index) => ({
      ...category,
      id: `other-${index}`,
    }));
    const { rerender } = mount();

    rerender(<PriceList menuTitle={MENU_TITLE} categories={other} />);

    const marked = menuLinks().filter(
      (link) => link.getAttribute('aria-current') === 'location',
    );
    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveAttribute('href', '#other-0');
    // …and the new ring marks the new deck's CARD too: one region, the first.
    const cards = markedCards();
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveAttribute('id', 'other-0');
  });
});

describe('PriceList — the jump menu', () => {
  it('is a nav landmark named by its own visible <h2>', () => {
    const { container } = mount();
    const menu = screen.getByRole('navigation', { name: MENU_TITLE });

    expect(menu.tagName).toBe('NAV');
    expect(menu).toHaveAttribute('id', PRICE_MENU_ID);
    expect(menu).toHaveAttribute('aria-labelledby', `${PRICE_MENU_ID}-title`);

    const title = within(menu).getByRole('heading', {
      level: 2,
      name: MENU_TITLE,
    });
    expect(title.tagName).toBe('H2');
    expect(title).toHaveAttribute('id', `${PRICE_MENU_ID}-title`);
    // It is the FIRST track of the grid — the menu comes before the cards in
    // the DOM, which is also the order a screen reader and the keyboard read.
    const grid = (bandOf(container).firstElementChild as HTMLElement)
      .firstElementChild as HTMLElement;
    expect(grid.firstElementChild).toBe(menu);
  });

  it('gives that <h2> the CATEGORY CARDS’ own step — a title, not an item', () => {
    // Owner 2026-09-14: „Categorii" must read as the TITLE of this navigation.
    // ui/Heading's `band` step is every page <h2>'s (D48, §15.24 — the card
    // titles wear it through sections/SectionHeading), so the two are honest
    // siblings; the rule under it (asserted with the list below) is what
    // separates the title from the items. The step is CONTAINER-responsive —
    // 30px under the card's 28rem `@md` step, 36px from it — and this project
    // loads no stylesheet, so the size each title actually reads, menu and
    // cards side by side, is measured in PriceList.stories.tsx's
    // expectHeadingOutline; here the TOKENS are the contract.
    mount();
    const title = within(
      screen.getByRole('navigation', { name: MENU_TITLE }),
    ).getByRole('heading', { level: 2, name: MENU_TITLE });

    expect(tokensOf(title)).toEqual(
      expect.arrayContaining([
        'font-display',
        'text-3xl',
        '@md:text-4xl',
        'text-ink-strong',
      ]),
    );
    // …and never D46's FIXED 36px, which outranked the page's own <h1> on a
    // phone (its `hero` curve sits on a 32px floor there).
    expect(tokensOf(title)).not.toContain('text-4xl');
  });

  it('holds ui/Card’s surface AND its aura on the RAIL’s own card inside the <nav> — no longer asChild onto it (2026-10-09)', () => {
    mount();
    const menu = screen.getByRole('navigation', { name: MENU_TITLE });
    const card = railCard();

    // The card's own marks, derived from the atom rather than retyped: the
    // container context (Card D10), the surface row, and the glow the band
    // asks for with ui/Card's `aura` prop (owner 2026-09-14) — on the rail's
    // card, the box the <h2> and the list sit in.
    expect(tokensOf(card)).toEqual(
      expect.arrayContaining(['@container', 'bg-surface', 'p-6', AURA]),
    );
    // The menu card is NOT armed: no token of it starts with `before:` — its
    // glow is WORN, for good, where every category card's is armed and shown
    // only while the island marks it (owner 2026-09-29).
    expect(tokensOf(card).filter((t) => t.startsWith('before:'))).toEqual([]);
    // The card sits in the rail's box, which only the rail's gate shows…
    expect(card.parentElement).toBe(railBox());
    expect(tokensOf(railBox())).toEqual([
      'hidden',
      'pointer-fine:min-[60rem]:block',
    ]);
    // …inside the <nav>, which now paints nothing of its own: no surface, no
    // glow, no padding — the card is its child, not its clothes.
    expect(railBox().parentElement).toBe(menu);
    expect(
      tokensOf(menu).filter((t) =>
        /^(bg-|p-|shadow-|border|@container)/.test(t),
      ),
    ).toEqual([]);
  });

  it('makes the <nav> STICKY in both presentations — the strip’s line under the header pill by default, the rail’s 8.5rem behind its gate', () => {
    // PriceMenu.tsx's THE TWO PRESENTATIONS and THE STRIP'S GEOMETRY, as the
    // <nav>'s whole class list, exactly: the strip's base — stuck on the z-20
    // seat ONLY FROM 30rem OF WINDOW HEIGHT (G2 a11y, 2026-10-09), at the
    // header pill's flow box (the SEVENTH coupled spelling — THE STRIP FLOATS
    // UNDER THE BAR, owner 2026-10-10: nothing of the strip behind the bar),
    // its negative top margin cancelling the strip's 0.75rem of air at rest,
    // and drawn back over the glow room under the chips — then the rail
    // branch under `pointer-fine:min-[60rem]:`, restoring the side menu
    // exactly: sticky at every height, the 8.5rem line (the FIFTH spelling),
    // no z-index, no margins,
    // the card's 6px corner for the focus ring, and the one rule lib/sticky-
    // rail's 'travel' asks for. `min-w-0` keeps the nowrap row from blowing
    // the band's single grid track out.
    mount();
    const menu = screen.getByRole('navigation', { name: MENU_TITLE });

    expect(tokensOf(menu)).toEqual([
      'min-w-0',
      'scroll-mt-[2.5rem]',
      '[@media(min-height:30rem)]:supports-[selector(:has(*))]:sticky',
      'top-[calc(6rem+2px)]',
      'z-20',
      '-mt-[0.75rem]',
      '-mb-8',
      'pointer-fine:min-[60rem]:sticky',
      'pointer-fine:min-[60rem]:top-[8.5rem]',
      'pointer-fine:min-[60rem]:z-auto',
      'pointer-fine:min-[60rem]:mt-0',
      'pointer-fine:min-[60rem]:mb-0',
      'pointer-fine:min-[60rem]:rounded-md',
      'pointer-fine:min-[60rem]:data-[rail=travel]:relative',
    ]);
  });

  it('is NEVER a scroll container in the rail — no height belt, no overflow on the <nav> or its card (owner 2026-09-18)', () => {
    // The belt (`max-h-[calc(100dvh-9.5rem)] overflow-y-auto`) made the card
    // its own scroller on every laptop: the wheel scrolled the menu, not the
    // page. Reversed for lib/sticky-rail's pinning; nothing on the nav or its
    // card may cap its height or clip its overflow again. (The STRIP is a
    // sideways scroller by design — its own box, never the rail's.)
    mount();
    const menu = screen.getByRole('navigation', { name: MENU_TITLE });

    for (const element of [menu, railBox(), railCard()]) {
      expect(
        tokensOf(element).filter((c) => /overflow|max-h|dvh|h-\[/.test(c)),
      ).toEqual([]);
    }
  });

  it('separates the title from the list with a rule, and nothing else', () => {
    // The rail <ul>'s whole class list, exactly: the rule and its two
    // paddings are the separation the owner asked for, `items-start` keeps
    // each link hugging its own label, and there is no third idea in there.
    mount();
    const list = railList();

    expect(list.tagName).toBe('UL');
    expect(tokensOf(list)).toEqual([
      'mt-4',
      'flex',
      'flex-col',
      'items-start',
      'gap-1',
      'border-t',
      'border-line-subtle',
      'pt-4',
    ]);
  });

  it('prints ONE link per category in EACH list, in the categories’ own order — two lists in the one <nav>', () => {
    mount();
    const menu = screen.getByRole('navigation', { name: MENU_TITLE });

    // Exactly two lists inside the landmark: the rail's and the strip's.
    const lists = within(menu).getAllByRole('list');
    expect(lists).toEqual([railList(), stripList()]);
    for (const links of [menuLinks(), stripLinks()]) {
      expect(links).toHaveLength(CATEGORIES.length);
      expect(links.map((link) => link.textContent)).toEqual(
        CATEGORIES.map((category) => category.name),
      );
    }
    // A list, because it IS one — "list, N items" is what a screen reader
    // announces. No role="list": WebKit only drops the semantics outside a
    // <nav> (eslint.config.mjs, jsx-a11y/list-role-for-webkit).
    for (const list of lists) {
      expect(within(list).getAllByRole('listitem')).toHaveLength(
        CATEGORIES.length,
      );
    }
  });

  it('points every link of BOTH lists at a card that really exists on the page', () => {
    // The menu and the cards are the same array printed three times, so this
    // can only fail if the href spelling breaks — which is exactly what it
    // guards.
    const { container } = mount();

    for (const links of [menuLinks(), stripLinks()]) {
      for (const [index, link] of links.entries()) {
        const category = CATEGORIES[index];
        expect(link).toHaveAttribute('href', `#${category.id}`);
        const target = container.ownerDocument.getElementById(category.id);
        expect(target).not.toBeNull();
        expect(target?.tagName).toBe('SECTION');
      }
    }
  });

  it('keeps the <nav>’s name „Categorii” while the rail — and its visible <h2> — is display: none (the strip’s state)', () => {
    // THE TWO PRESENTATIONS: where the strip shows, the rail's box is
    // `display: none`, the <h2> with it — and an accessible name READS a
    // hidden referent of `aria-labelledby`, so the landmark keeps its name.
    // No stylesheet here: the rail's gate is emulated on its box.
    mount();
    railBox().style.display = 'none';

    const menu = screen.getByRole('navigation', { name: MENU_TITLE });
    expect(menu).toHaveAttribute('aria-labelledby', `${PRICE_MENU_ID}-title`);
    // …and the title is out of the accessibility tree — no visible heading in
    // the strip's state — while the strip's links are in it.
    expect(
      within(menu).queryByRole('heading', { name: MENU_TITLE }),
    ).toBeNull();
    expect(
      within(menu)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(CATEGORIES.map((category) => category.name));
  });

  it('dresses each link as ui/TextButton — the Footer’s quiet-link look', () => {
    // The atom's real bundle, rendered right here: the expectation is DERIVED,
    // never typed, so an edit to TextButton lands in this assertion instead of
    // drifting silently away from the menu. `min-h-11` (2.75rem = 44px, in rem
    // so zoom carries it) is the §9 target floor, and `hyphens-none` is
    // §15.14's rule that an interactive label never syllable-breaks — both
    // come from the atom rather than from a class string copied into a band.
    mount();
    const link = menuLinks()[1];

    render(
      <TextButton asChild>
        <a href="#x">x</a>
      </TextButton>,
    );
    const reference = tokensOf(screen.getByRole('link', { name: 'x' }));

    expect(reference).toContain('min-h-11');
    expect(reference).toContain('hyphens-none');
    expect(tokensOf(link)).toEqual(expect.arrayContaining(reference));
    // The Footer's optical correction: pull the label back over the atom's
    // own px-2 so it lines up with the card's title.
    expect(tokensOf(link)).toContain('-ml-2');
  });

  it('holds NO link back to itself — the way back was dropped (owner 2026-09-14)', () => {
    // "completely drop that button … it has no place here". Nothing in the
    // band points at the menu's own id any more; the id stays exported because
    // it is a public address another page may link to.
    const { container } = mount();

    expect(
      bandOf(container).querySelectorAll(`a[href="#${PRICE_MENU_ID}"]`),
    ).toHaveLength(0);
  });
});

describe('PriceList — the strip (owner 2026-10-09: “a horizontal list of buttons which you can scroll from left to right”)', () => {
  it('is a <ul> of its own, named by id, hidden at the rail’s gate — every class of THE STRIP’S GEOMETRY, exactly', () => {
    // PriceMenu.tsx's THE STRIP'S GEOMETRY, as the list's whole class list:
    // the row, hidden where the rail shows; the 0.75rem of air between the
    // header pill and the chips as its top padding and `pb-8` (the chips'
    // glow room); the ReviewsDeck stage's full-bleed margins with the same
    // expression back as START padding; the trailing gutter as a real
    // `::after` box, the gutter less `gap-3`'s own step (THE TRAILING GUTTER
    // IS A REAL BOX — WebKit drops a flex scroller's end padding); the scroll
    // padding in `cqw` (a scroll-padding percentage reads the scrollport, and
    // would be 0); the scrollbar HIDDEN (owner 2026-10-10: "there is a scroll
    // bar, a horizontal one on that scrollable menu. remove it"); and the
    // root's clearance, two rules.
    mount();
    const list = stripList();

    expect(list.tagName).toBe('UL');
    expect(list.parentElement).toBe(
      screen.getByRole('navigation', { name: MENU_TITLE }),
    );
    expect(tokensOf(list)).toEqual([
      'flex',
      'items-center',
      'gap-3',
      'overflow-x-auto',
      'overscroll-x-contain',
      'pointer-fine:min-[60rem]:hidden',
      'pt-[0.75rem]',
      'pb-8',
      'mx-[calc(50%_-_50vw)]',
      'ps-[calc(50vw_-_50%)]',
      'scroll-px-[calc(50vw_-_50cqw)]',
      'after:flex-none',
      'after:w-[calc(100vw_-_100%_-_var(--spacing)*3)]',
      "after:content-['']",
      '[scrollbar-width:none]',
      '[&::-webkit-scrollbar]:hidden',
      '[@media(min-height:30rem)]:not-pointer-fine:[:root:has(&)]:[scroll-padding-top:calc(6rem+2px+0.75rem+2.75rem)]',
      '[@media(min-height:30rem)]:max-[60rem]:[:root:has(&)]:[scroll-padding-top:calc(6rem+2px+0.75rem+2.75rem)]',
    ]);
    // THE SCROLLBAR IS HIDDEN, for every pointer and every engine: the
    // standard property (WebKit's iOS bug 277167, Safari 18.2) and the
    // `::-webkit-scrollbar` fallback for older WebKit and Chromium, both
    // UNGATED — and no scrollbar colour left behind for a thumb nobody sees.
    expect(tokensOf(list).filter((t) => t.includes('scrollbar'))).toEqual([
      '[scrollbar-width:none]',
      '[&::-webkit-scrollbar]:hidden',
    ]);
    expect(variantsOf('[scrollbar-width:none]')).toEqual([]);
    expect(variantsOf('[&::-webkit-scrollbar]:hidden')).toEqual([
      '[&::-webkit-scrollbar]',
    ]);
    expect(tokensOf(list).filter((t) => t.includes('scrollbar-color'))).toEqual(
      [],
    );
    // THE STRIP FLOATS UNDER THE BAR (owner 2026-10-10: "i do not want it to
    // transition into some kid of fog anymore"): the list paints NO
    // background — no colour, no image, no gradient stop, behind any variant.
    expect(
      tokensOf(list).filter((t) =>
        /^(bg-|from-|via-|to-|\[background)/.test(utilityOf(t)),
      ),
    ).toEqual([]);
    // The trailing box's gap is the row's own: `gap-3` and `* 3`, one step.
    expect(tokensOf(list)).toContain('gap-3');
    // No end PADDING — the box replaces it — and no scroll snap (it would
    // re-snap after the follower's glide).
    expect(
      tokensOf(list).filter(
        (t) => /^(px|pe|pr)-/.test(t) || t.includes('snap'),
      ),
    ).toEqual([]);
  });

  it('gives the stick and the chips’ focus margin the CLEARANCE’s own condition — 30rem of window AND `:has()` — so no engine sticks the strip over jumps that would land under it (G2 a11y N1)', () => {
    // The clearance is a `:root:has(&)` rule: an engine without `:has()`
    // (Safari before 15.4, Firefox before 121) drops it. Were the stick not
    // gated the same way, such an engine would keep the strip stuck while every
    // fragment jump landed under it.
    mount();
    const menu = screen.getByRole('navigation', { name: MENU_TITLE });
    const gated = (token: string): boolean => {
      const chain = variantsOf(token);
      return (
        chain.includes('[@media(min-height:30rem)]') &&
        chain.includes('supports-[selector(:has(*))]')
      );
    };
    const stick = tokensOf(menu).filter((t) => utilityOf(t) === 'sticky');
    // The strip's stick is gated; the rail's (behind its own gate) is not —
    // the rail sticks at every height, in every engine, as before.
    expect(stick.filter(gated)).toHaveLength(1);
    expect(stick.filter((t) => !gated(t))).toEqual([
      'pointer-fine:min-[60rem]:sticky',
    ]);
    for (const chip of stripLinks()) {
      const margin = tokensOf(chip).filter((t) =>
        utilityOf(t).startsWith('scroll-mt-'),
      );
      expect(margin).toHaveLength(1);
      expect(gated(margin[0])).toBe(true);
    }
    // …and the clearance itself needs no such gate: an engine without
    // `:has()` drops it on its own.
    expect(
      tokensOf(stripList()).filter((t) => t.includes('[:root:has(&)]')),
    ).toHaveLength(2);
  });

  it('spells the pill’s flow box ONCE as the <nav>’s sticky line, and the 0.75rem of air once each as the strip’s top padding and the <nav>’s negative margin — rem literals the band scale cannot remap', () => {
    // THE STRIP FLOATS UNDER THE BAR (PriceMenu.tsx, owner 2026-10-10): the
    // <nav> sticks at the header pill's FLOW BOX — the SEVENTH coupled
    // spelling of its reach (Header.tsx's THE MOUNT CONTRACT) — so nothing of
    // the strip lies behind the bar; the air between the pill and the chips is
    // the strip's top padding, which the <nav>'s negative top margin cancels
    // at rest. The two must be the SAME length, or the chips would not sit on
    // the grid's first row at rest. Each expression held in a const and
    // spliced, never a whole class beside the ones the elements wear.
    const flowBox = 'calc(6rem+2px)';
    const air = '0.75rem';
    const tokens = classTokensOf(MENU_CODE);
    expect(tokens.filter((t) => t.includes(`[${flowBox}]`))).toEqual([
      `top-[${flowBox}]`,
    ]);
    expect(tokens.filter((t) => t.endsWith(`-[${air}]`))).toEqual([
      `-mt-[${air}]`,
      `pt-[${air}]`,
    ]);
    // THE STRIP'S CLEARANCE spells both once more in each of its two rules —
    // the flow box + the air + the chips' 2.75rem, the chips' bottom edge
    // when stuck — so the seventh spelling stands three times in this one
    // file, and nowhere else.
    const clearance = 'calc(6rem+2px+0.75rem+2.75rem)';
    expect(tokens.filter((t) => t.includes(clearance))).toHaveLength(2);
    // The lift the strip had until 2026-10-10 — the flow box AND the air in
    // one length, worn as the <nav>'s negative margin and the strip's top
    // padding over its ground — is gone (the clearance's longer sum shares
    // its first terms, never its closing bracket). Assembled from parts,
    // never one literal.
    const lift = ['calc(6rem+2px+', air, ')'].join('');
    expect(tokens.filter((t) => t.includes(lift))).toEqual([]);
    // …and none of the three in the band's other modules.
    for (const code of [CODE, CARD_CODE, ARRIVAL_CODE]) {
      expect(code).not.toContain(flowBox);
      expect(code).not.toContain(clearance);
      expect(code).not.toContain(lift);
    }
  });

  it('dresses each chip as ui/PillButton through asChild — the atom’s whole bundle — with the focus margin of minus its own height', () => {
    // The atom's real bundle, rendered right here: the expectation is
    // DERIVED, never typed, so an edit to PillButton lands in this assertion
    // instead of drifting away from the strip. The one token past the bundle
    // is THE CHIPS' FOCUS MARGIN (PriceMenu.tsx): minus the chip's
    // `min-h-11`, so a keyboard focus on the stuck strip never scrolls the
    // page. (Spelled only WHOLE in this file: Tailwind scans tests too, and a
    // bare fragment of it would ship a rule no element wears.)
    mount();
    const chip = stripLinks()[1];

    render(
      <PillButton asChild>
        <a href="#x">x</a>
      </PillButton>,
    );
    const reference = tokensOf(screen.getByRole('link', { name: 'x' }));

    expect(reference).toContain('rounded-full');
    expect(reference).toContain('min-h-11');
    // The focus margin rides the STICK's own threshold: where the strip does
    // not stick, a chip half under the pill must be revealed whole.
    expect(tokensOf(chip)).toEqual([
      ...reference,
      '[@media(min-height:30rem)]:supports-[selector(:has(*))]:scroll-mt-[-2.75rem]',
    ]);
    expect(chip.tagName).toBe('A');
    expect(chip.parentElement?.tagName).toBe('LI');
  });

  it('marks the SAME category on both lists — one store, `aria-current="location"` and the chip’s lavender face', () => {
    mount();
    expect(menuLinks()[0]).toHaveAttribute('aria-current', 'location');
    expect(stripLinks()[0]).toHaveAttribute('aria-current', 'location');
    expect(tokensOf(stripLinks()[0])).toEqual(
      expect.arrayContaining(['bg-accent', 'text-ink-inverse']),
    );
    for (const chip of stripLinks().slice(1)) {
      expect(chip).not.toHaveAttribute('aria-current');
      expect(tokensOf(chip)).toEqual(
        expect.arrayContaining(['bg-surface', 'text-ink']),
      );
    }
  });

  it('a click on a chip PINS its category at once — on both lists and on its card — and lands the jump', async () => {
    mount();
    const last = CATEGORIES[CATEGORIES.length - 1];

    await userEvent.click(
      within(stripList()).getByRole('link', { name: last.name }),
    );

    expect(window.location.hash).toBe(`#${last.id}`);
    expect(stripLinks()[CATEGORIES.length - 1]).toHaveAttribute(
      'aria-current',
      'location',
    );
    expect(menuLinks()[CATEGORIES.length - 1]).toHaveAttribute(
      'aria-current',
      'location',
    );
    expect(markedCards()).toEqual([
      screen.getByRole('region', { name: last.name }),
    ]);
    // A pointer's click stamps nothing (THE RING IS THE KEYBOARD'S) — the same
    // logic as the rail's links, one function for both.
    expect(stampedElements()).toEqual([]);
  });

  it('a KEYBOARD click on a chip stamps the card it jumped to, as the rail’s links do', async () => {
    mount();
    const chip = stripLinks()[1];
    const card = screen.getByRole('region', { name: CATEGORIES[1].name });

    chip.focus();
    await userEvent.keyboard('{Enter}');

    expect(window.location.hash).toBe(`#${CATEGORIES[1].id}`);
    expect(card).toHaveAttribute(ARRIVAL, KEYBOARD);
    expect(stampedElements()).toEqual([card]);
  });

  it('a MODIFIED click on a chip neither pins nor stamps', () => {
    mount();
    const chip = stripLinks()[2];
    const cancel = (event: Event): void => event.preventDefault();
    chip.addEventListener('click', cancel, { capture: true });

    fireEvent.click(chip, { detail: 0, metaKey: true });

    expect(chip).not.toHaveAttribute('aria-current');
    expect(stripLinks()[0]).toHaveAttribute('aria-current', 'location');
    expect(stampedElements()).toEqual([]);
    chip.removeEventListener('click', cancel, { capture: true });
  });
});

describe('PriceList — THE STRIP’S CLEARANCE is the stylesheet’s: the island writes nothing on the root (G2, 2026-10-09)', () => {
  // PriceMenu.tsx's paragraph of that name. Since the G2 round the root's
  // `scroll-padding-top` under the strip is TWO CSS RULES spelled on the
  // strip itself — in place before the first paint, without JavaScript, and
  // reading nothing (the deep-link, stale-top and no-JS findings) — and the
  // island's watcher only tells the spy to RE-PLAN after a presentation flip
  // or a size change. No stylesheet is loaded here, so BOTH lists have a box
  // and the watcher answers "the rail"; each test below emulates the STRIP's
  // state the way the rail's gate makes it — the rail's box `display: none` —
  // and, where it needs the padding the CSS would give, sets it inline itself:
  // the harness standing in for the stylesheet, as stretchCards() does for the
  // shell's 6rem.

  /** Three frames: the watcher's observer delivers after the next layout
   *  and re-syncs one frame later, never inside the delivery (PriceMenu.tsx's
   *  ONE FRAME LATER). */
  const settleWatcher = async (): Promise<void> => {
    await nextFrame();
    await nextFrame();
    await nextFrame();
  };

  /** Show the strip's state and let the watcher re-sync. */
  const asStrip = async (): Promise<void> => {
    await act(async () => {
      railBox().style.display = 'none';
      await settleWatcher();
    });
  };

  /** Back to the rail's state. */
  const asRail = async (): Promise<void> => {
    await act(async () => {
      railBox().style.display = '';
      await settleWatcher();
    });
  };

  it('writes NOTHING on the root — in either presentation, and when it leaves: whatever stood there stands', async () => {
    document.documentElement.style.scrollPaddingTop = '77px';
    const { unmount } = mount();
    expect(document.documentElement.style.scrollPaddingTop).toBe('77px');
    await asStrip();
    expect(document.documentElement.style.scrollPaddingTop).toBe('77px');
    await asRail();
    expect(document.documentElement.style.scrollPaddingTop).toBe('77px');
    unmount();
    expect(document.documentElement.style.scrollPaddingTop).toBe('77px');
  });

  it('spells the clearance ON THE STRIP — two `:root:has(&)` rules: the pill’s flow box + the 0.75rem of air + the chips’ 2.75rem, exactly where the strip is shown AND sticky', () => {
    mount();
    const rules = tokensOf(stripList()).filter((token) =>
      token.includes('[:root:has(&)]'),
    );
    // The strip is shown where the rail's gate is NOT met — no fine pointer,
    // or a window under 60rem — and sticks from 30rem of window height: the
    // two halves of that complement, each gated by the stick's threshold.
    // Each spelled WHOLE (Tailwind scans tests too: a bare
    // scroll-padding value held in a const would ship a rule nothing wears).
    expect(rules).toEqual([
      '[@media(min-height:30rem)]:not-pointer-fine:[:root:has(&)]:[scroll-padding-top:calc(6rem+2px+0.75rem+2.75rem)]',
      '[@media(min-height:30rem)]:max-[60rem]:[:root:has(&)]:[scroll-padding-top:calc(6rem+2px+0.75rem+2.75rem)]',
    ]);
    // That nothing WRITES the root is held by behaviour, not by source: the
    // test above watches the root's inline value through both presentations
    // and the island's unmount (a source pattern could be dodged by aliasing).
  });

  it('makes the spy RE-PLAN after a presentation flip — the reading line follows the padding the stylesheet now gives, with no scroll to tell it', async () => {
    // THE READING LINE is the middle of the CLEAR area, (scroll-padding-top +
    // innerHeight) / 2. A flip to the strip turns the CSS clearance on with no
    // event the spy hears — so the watcher calls `refresh()`. Here the
    // harness sets the root's padding the way the CSS would (a tall 300px,
    // standing in for 154), BEFORE the flip: until the flip nothing re-plans;
    // after it, a card whose top sat 50px under the old line is well above the
    // new one — and current at once.
    mount();
    const crossingOf = stretchCards();
    await scrollToY(crossingOf(CATEGORIES[1].id) - 50);
    expect(markedCards()).toEqual([
      screen.getByRole('region', { name: CATEGORIES[0].name }),
    ]);

    document.documentElement.style.scrollPaddingTop = '300px';
    await nextFrame();
    // The premise: nothing re-planned on its own.
    expect(markedCards()).toEqual([
      screen.getByRole('region', { name: CATEGORIES[0].name }),
    ]);

    await asStrip();

    expect(window.scrollY).toBe(crossingOf(CATEGORIES[1].id) - 50);
    expect(markedCards()).toEqual([
      screen.getByRole('region', { name: CATEGORIES[1].name }),
    ]);
  });

  it('makes the spy RE-PLAN after a SIZE change of the strip too — the observer, not only the window, says so', async () => {
    mount();
    const crossingOf = stretchCards();
    await asStrip();
    await scrollToY(crossingOf(CATEGORIES[1].id) - 50);
    expect(markedCards()).toEqual([
      screen.getByRole('region', { name: CATEGORIES[0].name }),
    ]);

    document.documentElement.style.scrollPaddingTop = '300px';
    await act(async () => {
      stripList().style.paddingTop = '40px';
      await settleWatcher();
    });

    expect(markedCards()).toEqual([
      screen.getByRole('region', { name: CATEGORIES[1].name }),
    ]);
  });

  it('stops the rail’s store while the strip shows — no `data-rail`, no inline `top` on the sticky strip — and starts it again with the rail', async () => {
    // THE RAIL RUNS WHERE IT SHOWS: both presentations are sticky, and the
    // store's 'bottom' and 'travel' would write a `top` that moves the strip.
    // The <nav> is lent the rail's sticky rule inline and made taller than the
    // window, which in the rail's state leaves 'fits' at the next resize.
    mount();
    stretchCards();
    const menu = screen.getByRole('navigation', { name: MENU_TITLE });
    menu.style.position = 'sticky';
    menu.style.top = `${SCROLL_PADDING + 40}px`;
    menu.style.minHeight = `${window.innerHeight}px`;

    await asStrip();
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
      await nextFrame();
      await nextFrame();
    });
    expect(menu).not.toHaveAttribute('data-rail');

    await asRail();
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
      await nextFrame();
      await nextFrame();
    });
    expect(menu).toHaveAttribute('data-rail', 'top');
  });
});

// ── THE BAND SCALE (2026-10-02, §15.32 — PriceList.tsx's paragraph of that
// name). The owner: "i do not want the cards jsut to wide, i want the menu and
// cards to adapt too with the width of the screen". The CLASS contract lives
// here: the rhythm box wears ui/Container's two band-scale strings — read from
// the atom's exports and never written out (their one spelling is
// Container.tsx's; tests/unit/design-scale.test.ts fences every other) — and
// the band's own floor beside them, THE FLOOR (the band never draws smaller
// than the theme); and the pair coupled to the header pill is spelled so the
// scale cannot reach it. What the engine draws with all of it is
// PriceList.scale.test.tsx's.

/** THE FLOOR's property and its value (PriceList.tsx's BAND_FLOOR), each
 *  named apart: the band spells its whole class ONCE, in PriceList.tsx —
 *  tests/unit/design-scale.test.ts counts one setter — and Tailwind scans this
 *  file too, so the expected token is assembled here from its parts, never
 *  written whole. */
const FLOOR_PROPERTY = '--band-floor';
const FLOOR_VALUE = '0.0625rem';
const FLOOR_CLASS = ['[', FLOOR_PROPERTY, ':', FLOOR_VALUE, ']'].join('');

/** Every class-like token in a source's string literals — single, double and
 *  backtick, a template's `${…}` read as a gap: what Tailwind's scanner sees
 *  in a quoted class string (tests/unit/design-scale.test.ts's `tokensOf`). */
const classTokensOf = (code: string): string[] =>
  [...code.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g)]
    .flatMap((match) =>
      (
        match[1] ??
        match[2] ??
        (match[3] ?? '').replace(/\$\{[^}]*\}/g, ' ')
      ).split(/\s+/),
    )
    .filter(Boolean);

describe('PriceList — THE BAND SCALE, the class contract (§15.32)', () => {
  it('wears BOTH band-scale strings on the rhythm box and THE FLOOR beside them — after its own classes, in the order cx() writes them — and on no other element', () => {
    // ui/Container's recipe rule 5: the RHYTHM box, the first inside the
    // Container — never the Container itself (an element cannot query its own
    // size, and the regime's `@4xl` step reads the Container), never the
    // <section> (outside the container context the step would never match).
    // Here the rhythm box is also the grid. THE FLOOR must sit on that very
    // box: the design pixel is declared there, and reads it there.
    const { container } = mount();
    const band = bandOf(container);
    const grid = (band.firstElementChild as HTMLElement)
      .firstElementChild as HTMLElement;

    expect(tokensOf(grid)).toEqual([
      'grid',
      'gap-8',
      'py-12',
      '@lg:py-16',
      '@3xl:py-20',
      'pointer-fine:min-[60rem]:grid-cols-[minmax(calc(var(--spacing)*60),1fr)_4fr]',
      'pointer-fine:min-[60rem]:items-start',
      ...bandColumnClasses.split(' '),
      ...bandScaleClasses.split(' '),
      FLOOR_CLASS,
    ]);
    for (const element of [band, ...band.querySelectorAll('*')]) {
      if (element === grid) continue;
      expect(
        tokensOf(element).filter((t) => variantsOf(t).includes('scalable')),
      ).toEqual([]);
      // …and no other box sets the floor: unregistered and inherited, one
      // more setter below would only repeat it, one above would reach past
      // the band.
      expect(
        tokensOf(element).filter((t) => t.includes(FLOOR_PROPERTY)),
      ).toEqual([]);
    }
  });

  it('pins THE FLOOR at one sixteenth of a rem — the theme’s own pixel at any root — ungated, set once, in PriceList.tsx alone', () => {
    // 1rem / 16 is the pixel the theme's rem lengths are drawn in at ANY root
    // (PriceList.tsx's BAND_FLOOR), so the band never draws smaller than the
    // theme and, under the reference, IS its rem self. Ungated on purpose: it
    // is inert wherever ui/Container's pixel declaration is held back, its one
    // reader. The census (tests/unit/design-scale.test.ts) holds the same
    // number from src/; this holds what the band renders and its folder.
    const { container } = mount();
    const grid = (bandOf(container).firstElementChild as HTMLElement)
      .firstElementChild as HTMLElement;
    const floors = tokensOf(grid).filter((t) =>
      t.startsWith(`[${FLOOR_PROPERTY}:`),
    );

    expect(floors).toHaveLength(1);
    expect(variantsOf(floors[0])).toEqual([]);
    expect(utilityOf(floors[0])).toBe(FLOOR_CLASS);
    expect(floors[0].slice(FLOOR_PROPERTY.length + 2, -1)).toBe(FLOOR_VALUE);
    // Spelled ONCE in the folder's code, prose stripped: in PriceList.tsx, and
    // in no other module of the band.
    expect(CODE.split(FLOOR_PROPERTY)).toHaveLength(2);
    for (const code of [CARD_CODE, MENU_CODE, ARRIVAL_CODE]) {
      expect(code).not.toContain(FLOOR_PROPERTY);
    }
  });

  it('is UNCONDITIONAL and spells none of the regime itself — no `scaled` prop, both strings imported', () => {
    // The band's one page is the Services page, where it is the only band —
    // unlike ClinicLocation, which also stands on a page that does not scale
    // and so asks for a prop. Every class of the regime is ui/Container's.
    expectTypeOf<PriceListProps>().not.toHaveProperty('scaled');
    expect(CODE).toMatch(
      /import \{[^}]*\bbandColumnClasses\b[^}]*\bbandScaleClasses\b[^}]*\} from '@\/components\/ui\/Container\/Container'/,
    );
    for (const code of [CODE, CARD_CODE, MENU_CODE, ARRIVAL_CODE]) {
      expect(code).not.toMatch(/scalable:|design-scale|--scale-px/);
    }
  });

  it('keeps the pill’s pair out of its reach — the menu’s 8.5rem line and every card’s 2.5rem of air are rem LITERALS, and no class string in the folder spells either as a spacing step', () => {
    // The header pill these two clear is not a band and does not scale
    // (PriceList.tsx's THE 8.5rem LINE paragraph): as spacing steps they
    // would follow the band's design pixel past the reference — the menu
    // floating further and further under the bar, the card's line off the
    // menu's — so they are arbitrary rem values no theme variable carries.
    mount();
    const menu = screen.getByRole('navigation', { name: MENU_TITLE });
    expect(tokensOf(menu)).toContain('pointer-fine:min-[60rem]:top-[8.5rem]');
    expect(tokensOf(menu)).toContain('scroll-mt-[2.5rem]');
    for (const card of screen.getAllByRole('region')) {
      expect(tokensOf(card)).toContain('scroll-mt-[2.5rem]');
    }

    // The folder's own class strings, prose stripped: every `top` and
    // `scroll-mt` utility in them is a bracketed literal — none is a step.
    // The strip's sticky line is one of them since 2026-10-10: the header
    // pill's flow box, a rem literal (PriceMenu.tsx's THE STRIP FLOATS UNDER
    // THE BAR).
    const stepForm = /^-?(top|scroll-mt)-\d+(\.\d+)?$/;
    for (const [name, code] of [
      ['PriceList.tsx', CODE],
      ['CategoryCard.tsx', CARD_CODE],
      ['PriceMenu.tsx', MENU_CODE],
      ['arrival.ts', ARRIVAL_CODE],
    ] as const) {
      expect(
        classTokensOf(code).filter((t) => stepForm.test(utilityOf(t))),
        name,
      ).toEqual([]);
    }
    // …and each literal is spelled exactly once, where it is worn.
    const count = (code: string, token: string): number =>
      classTokensOf(code).filter((t) => t === token).length;
    expect(count(MENU_CODE, 'pointer-fine:min-[60rem]:top-[8.5rem]')).toBe(1);
    expect(count(MENU_CODE, 'top-[calc(6rem+2px)]')).toBe(1);
    expect(count(MENU_CODE, 'scroll-mt-[2.5rem]')).toBe(1);
    expect(count(CARD_CODE, 'scroll-mt-[2.5rem]')).toBe(1);
  });

  it('has a step reader with teeth — a spacing step behind any variant is seen, a literal is not', () => {
    // Assembled from parts, never one literal: Tailwind scans this file too,
    // and a spelled step class would ship a rule nobody wears.
    const step = ['top', String(8.5 * 4)].join('-');
    const air = ['scroll', 'mt', String(2.5 * 4)].join('-');
    const probe = [
      `const A = '@3xl:${step} block';`,
      `const B = \`${air}\`;`,
      `const C = "scroll-mt-[2.5rem] pointer-fine:min-[60rem]:top-[8.5rem]";`,
    ].join('\n');
    const stepForm = /^-?(top|scroll-mt)-\d+(\.\d+)?$/;
    expect(
      classTokensOf(probe).filter((t) => stepForm.test(utilityOf(t))),
    ).toEqual([`@3xl:${step}`, air]);
  });
});

describe('PriceList — one card per category', () => {
  it('renders each category as a named region, in order', () => {
    mount();

    for (const category of CATEGORIES) {
      const card = screen.getByRole('region', { name: category.name });
      expect(card.tagName).toBe('SECTION');
      expect(card).toHaveAttribute('id', category.id);
      expect(card).toHaveAttribute('aria-labelledby', `${category.id}-title`);
    }
    expect(screen.getAllByRole('region')).toHaveLength(CATEGORIES.length);
  });

  it('makes the card itself the fragment target: focusable by script only', () => {
    // board §4.2 — the skip-link technique. Without tabindex="-1" the browser
    // moves only the sequential focus start point and a screen reader may
    // announce nothing on arrival; with it, the region is announced by its
    // heading. -1 keeps it OUT of the Tab order.
    mount();

    for (const category of CATEGORIES) {
      const card = screen.getByRole('region', { name: category.name });
      expect(card).toHaveAttribute('tabindex', '-1');
      // 2.5rem of air on top of the global scroll-padding-top: 6rem
      // (globals.css) — the same 2.5rem the stuck menu wears, so the two come
      // to rest on one line; a rem literal, so the band scale leaves it 40px.
      expect(tokensOf(card)).toContain('scroll-mt-[2.5rem]');
    }
  });

  it('ARMS every card with the glow — none wears it on its own (owner 2026-09-29)', () => {
    // "what category card is not selected gets no aura": every card carries
    // the pill's glow ARMED on its `::before` layer (ui/Card's `aura`
    // prop, `"current"`), shown only while the island marks it — and no card
    // wears the glow on its own box.
    mount();

    for (const category of CATEGORIES) {
      const tokens = tokensOf(
        screen.getByRole('region', { name: category.name }),
      );
      expect(tokens).toContain(ARMED_GLOW);
      expect(tokens).toContain(SHOWN_WHILE);
      expect(tokens).not.toContain(AURA);
    }
  });

  it('stacks the cards with the gap the glow needs', () => {
    // `gap-8` = 32px. The aura is `0 8px 22px`, and ANY card can be the
    // glowing one — whichever the visitor is at — so a `gap-6` column would
    // let that glow run into the next card's edge (PriceList.tsx, THE GLOW IS
    // A CARD KIND).
    mount();
    const column = screen.getByRole('region', { name: CATEGORIES[0].name })
      .parentElement as HTMLElement;

    expect(tokensOf(column)).toEqual(['flex', 'flex-col', 'gap-8']);
    expect(column.children).toHaveLength(CATEGORIES.length);
  });

  it('opens each card with SectionHeading: an h2 title over its eyebrow', () => {
    mount();

    for (const category of CATEGORIES) {
      const card = screen.getByRole('region', { name: category.name });
      const heading = within(card).getByRole('heading', { level: 2 });

      expect(heading.tagName).toBe('H2');
      expect(heading).toHaveTextContent(category.name);
      expect(heading).toHaveAttribute('id', `${category.id}-title`);
      // EVERY category carries one (owner 2026-09-14), and it is the card's
      // only paragraph.
      expect(
        Array.from(card.querySelectorAll('p'), (p) => p.textContent),
      ).toEqual([category.eyebrow]);
    }
  });

  it('keeps the whole page at ONE heading level: h2, nothing else', () => {
    // The outline is the page's h1 (its own intro) → h2 per category, plus the
    // menu's own h2. No levels skipped, none invented (§9).
    const { container } = mount();
    const headings = within(bandOf(container)).getAllByRole('heading');

    expect(headings).toHaveLength(CATEGORIES.length + 1);
    for (const heading of headings) expect(heading.tagName).toBe('H2');
  });
});

describe('PriceList — the price rows', () => {
  it('pairs every treatment with its price in one <dl> per card', () => {
    mount();

    for (const category of CATEGORIES) {
      const card = screen.getByRole('region', { name: category.name });
      const lists = card.querySelectorAll('dl');
      expect(lists).toHaveLength(1);

      const rows = Array.from(lists[0].children);
      expect(rows).toHaveLength(category.rows.length);

      for (const [index, row] of rows.entries()) {
        const terms = row.querySelectorAll('dt');
        const values = row.querySelectorAll('dd');
        expect(terms).toHaveLength(1);
        expect(values).toHaveLength(1);
        expect(terms[0].textContent).toBe(category.rows[index].name);
        expect(values[0].textContent).toBe(category.rows[index].price);
      }
    }
  });

  it('dresses the number so digits line up and never break (board §3.5)', () => {
    mount();
    const price = screen.getByText(ROWS[0].price);

    expect(price.tagName).toBe('DD');
    expect(tokensOf(price)).toEqual(
      expect.arrayContaining([
        // ui/Text's own bundle first…
        'text-base',
        'text-ink-strong',
        // …then the row's placement className, merged last (§6.8).
        'shrink-0',
        'text-end',
        'tabular-nums',
        // §15.14 on a DATA string: „1.300 RON" may never be split.
        'hyphens-none',
      ]),
    );
  });

  it('keeps the rows in ONE column and reflows each row against the CARD', () => {
    // Owner 2026-09-14: "I do not like having 2 columns for prices. always
    // make only one" — so the <dl> carries no class at all, and no row needs
    // `break-inside-avoid` any more. What survives is the one step that reads
    // ui/Card's own @container: `@sm` (24rem of INNER width) is where a row
    // stops stacking — at 390 the card's inside is ~301px (~262 until
    // ui/Container's THE PHONE GUTTER, 2026-10-09; 346 at 440, so every phone
    // held upright still stacks) and an 80-character treatment name needs the
    // whole line (board §5.3).
    mount();
    const card = screen.getByRole('region', { name: CATEGORIES[0].name });
    const list = card.querySelector('dl') as HTMLElement;

    expect(tokensOf(list)).toEqual([]);
    expect(tokensOf(list.firstElementChild as HTMLElement)).toEqual([
      'flex',
      'flex-col',
      'gap-1',
      // The rule rides each ROW, not the list: `divide-y` would skip the last
      // child and leave the tariff hanging open (CategoryCard.tsx, THE RULE
      // RIDES EACH ROW).
      'border-b',
      'border-line-subtle',
      'py-2',
      '@sm:flex-row',
      '@sm:items-baseline',
      '@sm:justify-between',
      '@sm:gap-4',
    ]);
  });
});

describe('PriceList — the jump itself', () => {
  it('scrolls the second category into view and hands it the focus', async () => {
    // The fragment navigation the whole band is built on, exercised for real:
    // the runner is a live Chromium, so clicking the link performs the
    // browser's own same-document navigation — the URL takes the fragment and
    // the focusing steps run on the target, which is focusable precisely
    // because of its tabindex="-1" (board §4.2).
    mount();
    const category = CATEGORIES[1];
    const link = within(railList()).getByRole('link', { name: category.name });

    await userEvent.click(link);

    const card = screen.getByRole('region', { name: category.name });
    expect(window.location.hash).toBe(`#${category.id}`);
    expect(document.activeElement).toBe(card);
  });
});

describe('PriceList — the current category (the island)', () => {
  it('marks NOTHING in the server HTML — hydration-safe by construction', () => {
    // The island's two stores publish `{ current: null }` and
    // `{ mode: 'fits' }` from their frozen server snapshots (lib/scroll-spy,
    // lib/sticky-rail), so the pre-rendered page every visitor downloads
    // carries no aria-current, no data-rail and no inline style at all, and
    // the browser's first render agrees with it byte for byte (§16's
    // hydration-safety rule).
    const html = renderToStaticMarkup(
      <PriceList menuTitle={MENU_TITLE} categories={CATEGORIES} />,
    );

    expect(html).not.toContain('aria-current');
    expect(html).not.toContain('data-rail');
    expect(html).not.toContain('style=');
    // …and no card arrives marked (owner 2026-09-29): the island stamps the
    // mark after mount. A REGEX on the ATTRIBUTE form and not `toContain`,
    // because the armed class token `data-current:before:opacity-100` holds
    // the very substring on every card — the attribute is the name followed
    // by `=`, a space or the tag's end, the class token by a colon.
    expect(html).not.toMatch(/\sdata-current(=|\s|>)/);
    // The cards ARE armed in that HTML — the glow waits for the mark only.
    expect(html).toContain(SHOWN_WHILE);
    expect(html).toContain(`href="#${CATEGORIES[0].id}"`);
    expect(html).toMatch(/<nav[^>]*id="price-categories"/);
    // …and nothing of round 5's (owner 2026-09-29) either: no card arrives
    // with a planned landing — the reading spy writes each card's
    // `scroll-margin-top` at start() — and none arrives stamped, because only
    // a click stamps. The same ATTRIBUTE-form regex as the mark's: every card
    // carries the quiet ring's class token, whose `not-data-[arrival=…` holds
    // a bracket where the attribute has none.
    expect(html).not.toContain('scroll-margin');
    expect(html).not.toMatch(/\sdata-arrival(=|\s|>)/);
    expect(html).toContain(QUIET_RING);
  });

  it('answers the rail on the nav — the mode as data-rail, the number as top', async () => {
    // The WIRING of the second store, not its state machine (that is
    // src/lib/sticky-rail's suite): the rail finds the nav by PRICE_MENU_ID,
    // and what it publishes lands where the island says it does. No
    // stylesheet is loaded, so the nav is lent its sticky rule inline and made
    // taller than the window, then told about it the only way 'fits' can be
    // left — a resize; the scroll that follows engages the sticky and opens
    // 'travel'.
    mount();
    stretchCards();
    const menu = screen.getByRole('navigation', { name: MENU_TITLE });
    expect(menu).not.toHaveAttribute('data-rail');
    expect(menu).not.toHaveAttribute('style');

    menu.style.position = 'sticky';
    menu.style.top = `${SCROLL_PADDING + 40}px`;
    menu.style.minHeight = `${window.innerHeight}px`;
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
      await nextFrame();
      await nextFrame();
    });
    expect(menu).toHaveAttribute('data-rail', 'top');
    expect(menu.style.top).toBe(`${SCROLL_PADDING + 40}px`);

    const engage =
      menu.getBoundingClientRect().top + window.scrollY - (SCROLL_PADDING + 40);
    await scrollToY(engage + 30);

    expect(menu).toHaveAttribute('data-rail', 'travel');
    expect(menu.style.top).toMatch(/^\d+(\.\d+)?px$/);
  });

  it('marks the FIRST category once it is mounted at the top of the page', async () => {
    // The top fallback: this band starts at the top of its page, so at scrollY
    // 0 the first card is what the visitor sees. `location`, not `page` —
    // "where you are WITHIN the page" (PriceMenu.tsx says why) — and the look
    // is ui/TextButton's own `active` variant, the hover END state.
    mount();
    const links = menuLinks();

    expect(links[0]).toHaveAttribute('aria-current', 'location');
    expect(tokensOf(links[0])).toEqual(
      expect.arrayContaining(['text-accent', 'after:scale-x-100']),
    );
    for (const link of links.slice(1)) {
      expect(link).not.toHaveAttribute('aria-current');
      expect(tokensOf(link)).toEqual(
        expect.arrayContaining(['text-ink', 'after:scale-x-0']),
      );
    }
    // …and the same answer lands on the CARD (owner 2026-09-29): one region
    // carries the mark, and it is the first category's.
    expect(markedCards()).toEqual([
      screen.getByRole('region', { name: CATEGORIES[0].name }),
    ]);
  });

  it('follows an ordinary scroll: the card whose top has crossed the middle of the clear area wins', async () => {
    // The first of the owner's two directions (2026-09-14: "normal scrolling
    // also dictates menu item"), on the line round 5 moved it to (owner
    // 2026-09-29: "keeps the line lower for currently selected items"): a
    // card becomes current as its top edge crosses the middle of the window's
    // clear area — no longer as it slides under the header. The cards are
    // stretched here and <html> is given the shell's own scroll padding,
    // because this project loads no stylesheet: the rule is the page's, the
    // numbers are this file's.
    mount();
    const crossingOf = stretchCards();
    const line = readingLine();
    const third = screen.getByRole('region', { name: CATEGORIES[2].name });
    // The premise, so the assertions below cannot pass by standing still.
    expect(menuLinks()[0]).toHaveAttribute('aria-current', 'location');

    // Ten pixels short of the line the third card is not current yet: the
    // second is, its top long past the line.
    await scrollToY(crossingOf(CATEGORIES[2].id) - 10);
    expect(third.getBoundingClientRect().top).toBeGreaterThan(line + 1);
    expect(menuLinks()[1]).toHaveAttribute('aria-current', 'location');
    expect(markedCards()).toEqual([
      screen.getByRole('region', { name: CATEGORIES[1].name }),
    ]);

    // Ten pixels past it, it is.
    await scrollToY(crossingOf(CATEGORIES[2].id) + 10);
    expect(third.getBoundingClientRect().top).toBeLessThan(line);
    const links = menuLinks();
    expect(links[2]).toHaveAttribute('aria-current', 'location');
    expect(links[1]).not.toHaveAttribute('aria-current');
    expect(links[0]).not.toHaveAttribute('aria-current');
    // The card's mark moves with the link's: the third card alone carries it
    // now, and the first has lost it.
    expect(markedCards()).toEqual([third]);
    expect(
      screen.getByRole('region', { name: CATEGORIES[0].name }),
    ).not.toHaveAttribute(CURRENT);
  });

  it('pins the category a click chose at once, and lands it where the scroll names it too', async () => {
    // The other direction ("menu item click takes you also to navigation
    // item"): the last category is marked the instant it is clicked, before
    // the jump's own scrolling has anything to say about it — that is the
    // pin. What that scrolling says once it has landed is round 5's claim
    // (owner 2026-09-29): the jump lands the card on the line that names it
    // current, so when the visitor's own hand lets the pin go the walk names
    // the SAME card — a click and a scroll never disagree.
    mount();
    stretchCards();
    const last = CATEGORIES[CATEGORIES.length - 1];
    // The cards just grew. The spy re-plans their landings from its
    // ResizeObserver, which delivers in the next rendering step — so the click
    // waits for it, or the jump would land by the plan made for the short
    // cards (the lib suite's own wait for the observer's delivery).
    await act(async () => {
      await nextFrame();
      await nextFrame();
    });

    await userEvent.click(
      within(railList()).getByRole('link', { name: last.name }),
    );

    const links = menuLinks();
    expect(links[CATEGORIES.length - 1]).toHaveAttribute(
      'aria-current',
      'location',
    );
    expect(links[0]).not.toHaveAttribute('aria-current');
    expect(window.location.hash).toBe(`#${last.id}`);
    // The pin marks the CARD at once too: the last one, and only it.
    const card = screen.getByRole('region', { name: last.name });
    expect(markedCards()).toEqual([card]);
    // The premise of the hand-over: the jump really moved the page, and the
    // card it brought sits BELOW the header's strip — never under the pill.
    expect(window.scrollY).toBeGreaterThan(0);
    expect(card.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      SCROLL_PADDING - 1,
    );

    // A wheel — the visitor's own input — drops the pin at once (lib/scroll-
    // spy's THE VISITOR'S OWN INPUT), and the walk answers for the page as it
    // lies: the same card.
    await act(async () => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 1 }));
    });
    expect(markedCards()).toEqual([card]);
    expect(menuLinks()[CATEGORIES.length - 1]).toHaveAttribute(
      'aria-current',
      'location',
    );
  });

  it('marks the card the link names — the two marks never disagree', async () => {
    // One store, two marks (owner 2026-09-29): the link's `aria-current` and
    // the card's `data-current` are the scroll-spy's ONE answer printed
    // twice, so whichever way the visitor got somewhere, the ONE marked card
    // is the card the ONE marked link points at. Checked after each of the
    // three ways in — the top fallback at mount, an ordinary scroll and a
    // click's pin — each step naming where it must have moved the answer, so
    // the pairing cannot pass by standing still.
    const expectOneAnswer = (id: string): void => {
      const links = menuLinks().filter(
        (link) => link.getAttribute('aria-current') === 'location',
      );
      const cards = markedCards();
      expect(links).toHaveLength(1);
      expect(cards).toHaveLength(1);
      expect(`#${cards[0].id}`).toBe(links[0].getAttribute('href'));
      expect(cards[0]).toHaveAttribute('id', id);
    };
    const last = CATEGORIES[CATEGORIES.length - 1];

    mount();
    expectOneAnswer(CATEGORIES[0].id);

    // The second card's top ten pixels past the reading line.
    const crossingOf = stretchCards();
    await scrollToY(crossingOf(CATEGORIES[1].id) + 10);
    expectOneAnswer(CATEGORIES[1].id);

    await userEvent.click(
      within(railList()).getByRole('link', { name: last.name }),
    );
    expectOneAnswer(last.id);
  });

  it('takes the mark off when the island leaves', () => {
    // The effect's cleanup runs on the SAME node the mark was put on — held
    // in its closure, so it reaches that node even once it has left the
    // document — and the mark leaves with the island.
    const { unmount } = mount();
    const first = screen.getByRole('region', { name: CATEGORIES[0].name });
    expect(first).toHaveAttribute(CURRENT);

    unmount();

    expect(first).not.toHaveAttribute(CURRENT);
  });

  it('skips a target that is not in the document — no throw, no mark', async () => {
    // The island ALONE, so every id it holds names an element that is not
    // there (a hot reload can leave a menu briefly outliving its cards). The
    // click still PINS its id — the link says so — and the effect, finding
    // no element by that id, skips it exactly as the spy's walk skips a
    // missing target (PriceMenu.tsx, THE SPY'S OWN IDIOM). A throw from the
    // effect would surface through the click's act() and reject it.
    render(
      <PriceMenu
        id={PRICE_MENU_ID}
        title={MENU_TITLE}
        items={CATEGORIES.map(({ id, name }) => ({ id, name }))}
      />,
    );
    // The premise: no card exists anywhere.
    for (const category of CATEGORIES) {
      expect(document.getElementById(category.id)).toBeNull();
    }
    const link = within(railList()).getByRole('link', {
      name: CATEGORIES[1].name,
    });

    await expect(userEvent.click(link)).resolves.toBeUndefined();

    expect(link).toHaveAttribute('aria-current', 'location');
    expect(document.querySelectorAll(`[${CURRENT}]`)).toHaveLength(0);
  });

  it('marks exactly one card under React’s Strict Mode, and none after it leaves', () => {
    // Strict Mode mounts every effect, cleans it up and mounts it again — the
    // spy's start() and dispose() included — which is the rehearsal of every
    // remount the island will ever see (Fast Refresh, a re-keyed ring). One
    // mark must survive the rehearsal, and none the real unmount.
    const { unmount } = render(
      <StrictMode>
        <PriceList menuTitle={MENU_TITLE} categories={CATEGORIES} />
      </StrictMode>,
    );
    const first = screen.getByRole('region', { name: CATEGORIES[0].name });
    expect(markedCards()).toEqual([first]);

    unmount();

    expect(first).not.toHaveAttribute(CURRENT);
  });

  it('keeps one mark when the ring is rebuilt around a card that stays', () => {
    // The first two categories only: the id list changes, so the band's key
    // remounts the island, while the first card — same key — keeps its node.
    // The OLD island's cleanup and the NEW island's stamp therefore land on
    // the SAME element, and the outcome pinned here is one mark on it, not
    // none: every cleanup of a commit runs before any of its new effects.
    const { rerender } = mount();
    const first = screen.getByRole('region', { name: CATEGORIES[0].name });
    expect(markedCards()).toEqual([first]);

    rerender(
      <PriceList menuTitle={MENU_TITLE} categories={CATEGORIES.slice(0, 2)} />,
    );

    // The premise: the node persisted — the case this test exists for.
    expect(screen.getByRole('region', { name: CATEGORIES[0].name })).toBe(
      first,
    );
    expect(markedCards()).toEqual([first]);
  });

  it('marks the card the URL names, and the LAST card at the end of the page', async () => {
    // (a) A link someone sent — /ro/services/#prosthetics in a WhatsApp
    // message: the `#id` is in the URL before the page mounts, and start()'s
    // own hash check pins it, so that card is the one marked card and its
    // link the one marked link.
    const third = CATEGORIES[2];
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}#${third.id}`,
    );
    mount();

    expect(markedCards()).toEqual([
      screen.getByRole('region', { name: third.name }),
    ]);
    expect(
      menuLinks()
        .filter((link) => link.getAttribute('aria-current') === 'location')
        .map((link) => link.getAttribute('href')),
    ).toEqual([`#${third.id}`]);

    // (b) THE PAGE'S END: the reading line BENDS near both ends of the page
    // (lib/scroll-spy's THE READING LINE), so at the document's end the LAST
    // card is current even when it is too short for its top ever to reach
    // the middle of the clear area — the owner's "every card has its turn",
    // at the bottom. Two premises make that bend the ONLY way the last card
    // can win here. This deck's third card IS its last, so the URL's pin
    // from (a) is dropped first, by the visitor's own input (a wheel), and
    // the walk takes the page back — the first card, marked at the top. And
    // the last card is left SHORT, so at the document's end its top is still
    // BELOW the middle of the clear area while the one before it is above
    // it: an unbent line would answer the second card.
    stretchCards();
    const [, second, last] = CATEGORIES.map(
      (category) => document.getElementById(category.id) as HTMLElement,
    );
    last.style.minHeight = '';
    await act(async () => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 120 }));
    });
    expect(markedCards()).toEqual([
      screen.getByRole('region', { name: CATEGORIES[0].name }),
    ]);

    await scrollToY(document.documentElement.scrollHeight);

    const root = document.documentElement;
    expect(window.scrollY).toBeGreaterThanOrEqual(
      root.scrollHeight - window.innerHeight - 1,
    );
    expect(last.getBoundingClientRect().top).toBeGreaterThan(readingLine() + 1);
    expect(second.getBoundingClientRect().top).toBeLessThanOrEqual(
      readingLine() + 1,
    );
    expect(markedCards()).toEqual([last]);
  });
});

describe('PriceList — where a click lands, and whose ring it is (owner 2026-09-29)', () => {
  it('writes every card’s landing as its inline scroll-margin-top after mount, none in the server HTML, and takes them off when the island leaves', () => {
    // "the go to card when you click on the meniu on an option should be more
    // to the center of the screen": the browser lands a jump by the target's
    // `scroll-margin-top`, so the reading spy writes each card's planned value
    // there (PriceMenu.tsx's WHERE THE LINE IS, AND WHERE A CLICK LANDS).
    // Where each one lands is lib/reading-line's arithmetic and its suite's;
    // what is pinned HERE is the wiring — written after mount, absent from
    // the server's bytes, gone with the island.
    const html = renderToString(
      <PriceList menuTitle={MENU_TITLE} categories={CATEGORIES} />,
    );
    expect(html).not.toContain('scroll-margin');

    const { unmount } = mount();
    const cards = CATEGORIES.map((category) =>
      screen.getByRole('region', { name: category.name }),
    );
    for (const card of cards) {
      expect(card.style.getPropertyValue('scroll-margin-top')).toMatch(
        /^-?\d+(\.\d+)?px$/,
      );
    }

    unmount();

    for (const card of cards) {
      expect(card.style.getPropertyValue('scroll-margin-top')).toBe('');
    }
  });

  it('writes the landings once more after Strict Mode’s rehearsal, and leaves none behind it', () => {
    // Strict Mode mounts the spy's effect, cleans it up and mounts it again —
    // start(), dispose(), start() — so the margins are written, taken off and
    // written again; the real unmount must leave the stylesheet's own value.
    const { unmount } = render(
      <StrictMode>
        <PriceList menuTitle={MENU_TITLE} categories={CATEGORIES} />
      </StrictMode>,
    );
    const cards = screen.getAllByRole('region');
    for (const card of cards) {
      expect(card.style.getPropertyValue('scroll-margin-top')).not.toBe('');
    }

    unmount();

    for (const card of cards) {
      expect(card.style.getPropertyValue('scroll-margin-top')).toBe('');
    }
  });

  it('stamps the card a KEYBOARD click jumped to, and focus moving on takes the stamp off', async () => {
    // "it also highlights it with a dark border … i want that removed" — for
    // a pointer. A keyboard visitor keeps the ring, so the island stamps the
    // card THEIR click jumped to (CategoryCard.tsx's THE RING IS THE
    // KEYBOARD'S): Tab to the link, Enter — user-event's Enter on a link is a
    // click whose `detail` is 0, as the keyboard's is in both engines.
    mount();
    const link = menuLinks()[1];
    const card = screen.getByRole('region', { name: CATEGORIES[1].name });

    await tabTo(link);
    await userEvent.keyboard('{Enter}');

    // The jump really happened — the URL, the focus — and the card it
    // focused is the one stamped, and the only one.
    expect(window.location.hash).toBe(`#${CATEGORIES[1].id}`);
    expect(card).toHaveFocus();
    expect(card).toHaveAttribute(ARRIVAL, KEYBOARD);
    expect(stampedElements()).toEqual([card]);

    // The keyboard moves on; the card loses focus and the stamp goes with it.
    await userEvent.tab();
    expect(card).not.toHaveFocus();
    expect(card).not.toHaveAttribute(ARRIVAL);
    expect(stampedElements()).toEqual([]);
  });

  it('keeps the stamp through a blur that moves no focus — a window, a tab or the address bar taking it — however often it comes', async () => {
    // G2 a11y F1: switching to another window, tab or the address bar
    // delivers `blur` to the focused card although focus has not moved inside
    // the document. The card is still the active element, still
    // `:focus-visible` when the visitor returns — so it must keep its ring
    // (SC 2.4.7), and with it the stamp that keeps the ring (PriceMenu.tsx's
    // THE RING IS THE KEYBOARD'S). A dispatched `blur` on the focused card is
    // exactly what such a switch delivers.
    mount();
    const card = screen.getByRole('region', { name: CATEGORIES[1].name });
    await tabTo(menuLinks()[1]);
    await userEvent.keyboard('{Enter}');
    expect(card).toHaveFocus();
    expect(card).toHaveAttribute(ARRIVAL, KEYBOARD);

    card.dispatchEvent(new FocusEvent('blur'));

    expect(card).toHaveFocus();
    expect(card).toHaveAttribute(ARRIVAL, KEYBOARD);

    // …and again: a second switch away keeps it too.
    card.dispatchEvent(new FocusEvent('blur'));

    expect(card).toHaveFocus();
    expect(card).toHaveAttribute(ARRIVAL, KEYBOARD);
    expect(stampedElements()).toEqual([card]);

    // THE LISTENER IS NO ONE-SHOT (G2 react LOW): after those two blurs the
    // real move is still HEARD — focus goes to another element in the page,
    // and the stamp goes with it. With `once`, the first window blur would
    // have consumed the listener and the stamp would outlive the focus.
    menuLinks()[0].focus();

    expect(card).not.toHaveFocus();
    expect(card).not.toHaveAttribute(ARRIVAL);
    expect(stampedElements()).toEqual([]);
  });

  it('lifts the stamp when focus moves to something else in the page, and leaves no listener behind', async () => {
    // Inside a blur that MOVES focus, the document's active element is no
    // longer the card (the reviewers' measurement, both engines) — that is
    // the blur that takes the stamp off. And the listener goes with it: the
    // one `blur` listener the stamp added is the one the lift removed.
    mount();
    const card = screen.getByRole('region', { name: CATEGORIES[1].name });
    const added = vi.spyOn(card, 'addEventListener');
    const removed = vi.spyOn(card, 'removeEventListener');
    await tabTo(menuLinks()[1]);
    await userEvent.keyboard('{Enter}');
    expect(card).toHaveAttribute(ARRIVAL, KEYBOARD);

    // A real move: focus goes to another element in the page.
    menuLinks()[0].focus();

    expect(card).not.toHaveFocus();
    expect(card).not.toHaveAttribute(ARRIVAL);
    const blurAdded = added.mock.calls.filter(([type]) => type === 'blur');
    const blurRemoved = removed.mock.calls.filter(([type]) => type === 'blur');
    expect(blurAdded).toHaveLength(1);
    expect(blurRemoved.map(([, listener]) => listener)).toEqual([
      blurAdded[0][1],
    ]);

    // A later blur changes nothing…
    card.dispatchEvent(new FocusEvent('blur'));
    expect(card).not.toHaveAttribute(ARRIVAL);
    // …and a later keyboard arrival on the same card stamps it afresh.
    await tabTo(menuLinks()[1]);
    await userEvent.keyboard('{Enter}');
    expect(card).toHaveFocus();
    expect(card).toHaveAttribute(ARRIVAL, KEYBOARD);
    expect(stampedElements()).toEqual([card]);
  });

  it('takes the stamp off a card that still HOLDS focus when the island leaves — its listener with it', async () => {
    // The listener is no one-shot any more, so the island's leaving is what
    // must take it off a card that was never left: one removal, and no stamp.
    const { unmount } = mount();
    const card = screen.getByRole('region', { name: CATEGORIES[1].name });
    const removed = vi.spyOn(card, 'removeEventListener');
    await tabTo(menuLinks()[1]);
    await userEvent.keyboard('{Enter}');
    expect(card).toHaveFocus();
    expect(card).toHaveAttribute(ARRIVAL, KEYBOARD);

    unmount();

    expect(card).not.toHaveAttribute(ARRIVAL);
    expect(removed.mock.calls.filter(([type]) => type === 'blur')).toHaveLength(
      1,
    );
  });

  it('stamps nothing for a POINTER click — and takes off a stamp that is still there', async () => {
    // A mouse press or a tap is a click whose `detail` counts it: no stamp,
    // so the quiet ring hides the outline WebKit would draw.
    mount();
    await userEvent.click(menuLinks()[2]);
    expect(window.location.hash).toBe(`#${CATEGORIES[2].id}`);
    expect(stampedElements()).toEqual([]);

    // The last arrival decides. A keyboard arrival stamps the second card and
    // leaves it focused; then a pointer's click on its link arrives with no
    // press before it to move the focus first — a lone `click`, which is the
    // island's own path (every real press in both engines moves focus off the
    // card first, and the card's blur takes the stamp then; this pins the
    // path that does not rely on it).
    const card = screen.getByRole('region', { name: CATEGORIES[1].name });
    await tabTo(menuLinks()[1]);
    await userEvent.keyboard('{Enter}');
    expect(card).toHaveFocus();
    expect(card).toHaveAttribute(ARRIVAL, KEYBOARD);

    fireEvent.click(menuLinks()[1], { detail: 1 });

    expect(card).toHaveFocus();
    expect(card).not.toHaveAttribute(ARRIVAL);
    expect(stampedElements()).toEqual([]);
    // …and the click still pinned its card, as any plain left click does.
    expect(markedCards()).toEqual([card]);
  });

  it('moves the stamp with a second keyboard arrival — never two cards at once', async () => {
    // Every change to the stamp, in the order the DOM made it: an attribute
    // record with no old value is the stamp arriving, one with an old value
    // is it leaving. Replayed, the set of stamped cards must never hold two.
    const { container } = mount();
    // The RAIL's state, as its gate makes it (no stylesheet here): the strip
    // `display: none`, so the Tab order is the rail's links and the cards —
    // Shift+Tab from a card lands on the rail's last link, as on a laptop.
    stripList().style.display = 'none';
    const records: MutationRecord[] = [];
    const observer = new MutationObserver((batch) => records.push(...batch));
    observer.observe(bandOf(container), {
      subtree: true,
      attributes: true,
      attributeFilter: [ARRIVAL],
      attributeOldValue: true,
    });
    const first = screen.getByRole('region', { name: CATEGORIES[0].name });
    const last = screen.getByRole('region', { name: CATEGORIES[2].name });

    await tabTo(menuLinks()[0]);
    await userEvent.keyboard('{Enter}');
    expect(first).toHaveAttribute(ARRIVAL, KEYBOARD);
    // Back into the menu from the card — Shift+Tab lands on its last link —
    // and a second Enter.
    await userEvent.tab({ shift: true });
    expect(menuLinks()[2]).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    // And the island's OWN hand-over, with no blur to help it: a keyboard's
    // click on the first link while the last card still holds its focus and
    // its stamp — stamping a second card takes the first one's off.
    expect(last).toHaveFocus();
    expect(last).toHaveAttribute(ARRIVAL, KEYBOARD);
    fireEvent.click(menuLinks()[0], { detail: 0 });
    // Whatever the observer has not delivered yet, BEFORE disconnect() — which
    // would discard it.
    records.push(...observer.takeRecords());
    observer.disconnect();

    expect(stampedElements()).toEqual([first]);
    const stamped = new Set<string>();
    let most = 0;
    for (const record of records) {
      const id = (record.target as HTMLElement).id;
      if (record.oldValue === null) stamped.add(id);
      else stamped.delete(id);
      most = Math.max(most, stamped.size);
    }
    expect(records.length).toBeGreaterThanOrEqual(4);
    expect(most).toBe(1);
  });

  it('takes a stamp that is still on off when the island leaves — under Strict Mode too', () => {
    // The stamp is made WITHOUT the jump that would focus the card: a capture
    // listener cancels the click's default action (the island still hears the
    // click — React listens at the root), so the card is stamped but never
    // focused, and no blur can ever take the stamp off. Only the island's own
    // cleanup can — and it must, rehearsal and all.
    const { unmount } = render(
      <StrictMode>
        <PriceList menuTitle={MENU_TITLE} categories={CATEGORIES} />
      </StrictMode>,
    );
    const link = menuLinks()[1];
    const card = screen.getByRole('region', { name: CATEGORIES[1].name });
    const cancel = (event: Event): void => event.preventDefault();
    link.addEventListener('click', cancel, { capture: true });

    fireEvent.click(link, { detail: 0 });

    expect(card).toHaveAttribute(ARRIVAL, KEYBOARD);
    expect(card).not.toHaveFocus();
    expect(window.location.hash).toBe('');

    unmount();
    link.removeEventListener('click', cancel, { capture: true });

    expect(card).not.toHaveAttribute(ARRIVAL);
    expect(stampedElements()).toEqual([]);
  });

  it('neither pins nor stamps a MODIFIED click — Meta, Ctrl, Shift or Alt', () => {
    // A modified click opens the link somewhere else (a new tab, a new
    // window, a download) — this tab goes nowhere, so this tab marks nothing
    // and stamps nothing (ONLY A PLAIN LEFT CLICK PINS). `detail` 0 is the
    // keyboard's own spelling (Shift+Enter, say): the one a stamp would
    // answer. The capture listener keeps the runner from acting on the
    // modifier; the island still hears every click.
    mount();
    const link = menuLinks()[2];
    const cancel = (event: Event): void => event.preventDefault();
    link.addEventListener('click', cancel, { capture: true });

    for (const modifier of [
      'metaKey',
      'ctrlKey',
      'shiftKey',
      'altKey',
    ] as const) {
      fireEvent.click(link, { detail: 0, [modifier]: true });

      expect(link, modifier).not.toHaveAttribute('aria-current');
      expect(menuLinks()[0], modifier).toHaveAttribute(
        'aria-current',
        'location',
      );
      expect(stampedElements(), modifier).toEqual([]);
    }
    link.removeEventListener('click', cancel, { capture: true });
  });
});

describe('PriceList — dumb by construction', () => {
  it('strips prose in ONE pass — a `/*` inside a line comment hides no code after it, a comment opener inside a string is kept, and the band’s real prose is gone', () => {
    // The stripper's own teeth (the G2 typescript review, M2): every guard in
    // this block reads code through it, so a stripper that hid code would turn
    // each `not.toMatch` vacuous. The openers are assembled from parts, so the
    // sample is data and never a comment of this file's own.
    const open = ['/', '*'].join('');
    const close = ['*', '/'].join('');
    const sample = [
      `// a path like src/messages/${open}.json, in a line comment`,
      'const kept = 1;',
      `${open} a block comment ${close}`,
      `const url = 'https://example.ro/${open}still-a-string';`,
      'const alsoKept = 2; // trailing prose',
      `${open} a second block ${close}`,
      'const lastKept = 3;',
    ].join('\n');
    const code = stripComments(sample);

    for (const line of [
      'const kept = 1;',
      `const url = 'https://example.ro/${open}still-a-string';`,
      'const alsoKept = 2;',
      'const lastKept = 3;',
    ]) {
      expect(code).toContain(line);
    }
    expect(code).not.toMatch(
      /a path like|a block comment|trailing prose|a second block/,
    );
    // …and on the band's real sources: the prose that names the guards'
    // targets is gone, and the code is all there.
    expect(source).toMatch(/'use client'/);
    expect(CODE).not.toMatch(/use client/);
    expect(CODE).toMatch(/export function PriceList\b/);
    expect(CODE).toMatch(/const RHYTHM = cx\(/);
  });

  it('hands the island id/name pairs only — no price row crosses the boundary', () => {
    // Props that cross a server→client boundary are serialized into the page's
    // own HTML (the RSC flight payload). The island needs eleven `{ id, name }`
    // pairs; handing it the whole categories array would type-check (structural
    // subtyping accepts the extra fields) and print all 102 rows a second time
    // into every services page. No type can refuse that, so the projection is
    // pinned from the band's source (G2 typescript, Fable, 2026-09-15).
    expect(CODE).toMatch(
      /items=\{categories\.map\(\(\{ id, name \}\) => \(\{ id, name \}\)\)\}/,
    );
    expect(CODE).not.toMatch(/items=\{categories\}/);
  });

  it('prints nothing but the words it was handed (§17.4)', () => {
    // The sweep: strike every fixture string out of the band's text and what
    // remains must hold no letter and no digit. A hardcoded label, a stray
    // separator word, a unit bolted on in JSX — each one fails here.
    const { container } = mount();
    const text = bandOf(container).textContent ?? '';

    const residue = FIXTURE_WORDS.reduce(
      (rest, word) => rest.replaceAll(word, ' '),
      text,
    );
    expect(residue).not.toMatch(/[\p{L}\p{N}]/u);
    for (const word of FIXTURE_WORDS) expect(text).toContain(word);
  });

  it('imports no data and no translation machinery', () => {
    // The page is the one populator (board §2c.1): these three files may reach
    // for lib/cx and — the island's three React-free mechanics — for
    // lib/scroll-spy (the pack round), lib/sticky-rail (2026-09-18) and
    // lib/strip-follow (2026-10-09), and for nothing else under lib/. None of them may know what a locale is.
    // All three are checked, prose stripped.
    for (const code of [CODE, CARD_CODE, MENU_CODE]) {
      const libImports = [...code.matchAll(/from '(@\/lib\/[^']+)'/g)].map(
        (match) => match[1],
      );
      expect(
        libImports.every((path) =>
          [
            '@/lib/cx/cx',
            '@/lib/scroll-spy/scroll-spy',
            '@/lib/sticky-rail/sticky-rail',
            '@/lib/strip-follow/strip-follow',
          ].includes(path),
        ),
      ).toBe(true);
      expect(code).not.toMatch(/next-intl|useTranslations|getTranslations/);
      expect(code).not.toMatch(/@\/messages|@\/i18n/);
    }
  });

  it('ships ONE island, and it is the menu CARD (§16; widened 2026-09-18)', () => {
    // The source guard, read through Vite's ?raw (typed by the repo's own
    // src/types/raw-import.d.ts). Anchored to a line of its OWN, because that
    // is what a directive is, and tolerant of a trailing comment. The band and
    // the category cards stay inert HTML on every page; the menu card — its
    // <nav>, its <h2>, its list — is what ships, because the rail must
    // position the <nav> itself. So the landmark is spelled in the island and
    // nowhere else, and the band's file renders no <nav> of its own.
    const directive = /^\s*['"]use client['"]\s*;?\s*(\/\/.*)?$/gm;

    for (const code of [CODE, CARD_CODE]) {
      expect(code).not.toMatch(directive);
      expect(code).not.toMatch(/\buseState\b|\buseEffect\b|\buseRef\b/);
      expect(code).not.toMatch(/\bon[A-Z]\w*=/);
      expect(code).not.toMatch(/<nav\b/);
    }
    expect(MENU_CODE.match(directive)).toHaveLength(1);
    expect(MENU_CODE).toMatch(/<nav\b/);
    expect(MENU_CODE).toMatch(/<h2\b/);
    // The public address stays on the server side of the boundary and
    // travels down as a prop (PriceList.tsx, ONE ISLAND, THE MENU CARD).
    expect(CODE).toMatch(/id=\{PRICE_MENU_ID\}/);
    expect(MENU_CODE).not.toMatch(/PRICE_MENU_ID/);
    // THE MARK ON THE CARD (owner 2026-09-29) is the island's alone: neither
    // the band nor the card renders it — they stay inert HTML — and the
    // island names the attribute through the atom's constant, IMPORTED and
    // never retyped, so the stamp and ui/Card's variant can never drift.
    expect(CARD_CODE).not.toMatch(/data-current/);
    expect(CODE).not.toMatch(/data-current/);
    expect(MENU_CODE).toMatch(/CARD_CURRENT_ATTRIBUTE/);
    expect(MENU_CODE).not.toMatch(/['"]data-current['"]/);
  });

  it('keeps the keyboard’s stamp in a module on NEITHER side of the boundary', () => {
    // ./arrival holds the attribute CategoryCard's class answers and the
    // island writes (arrival.ts's WHY A FILE OF ITS OWN): no directive, no
    // import, nothing but constants, so the server card and the client island
    // read the same bytes and neither drags the other across the boundary.
    // The card takes it for TYPES alone — its `satisfies` — and the island for
    // the two values it writes, never retyping the attribute.
    const directive = /^\s*['"]use client['"]\s*;?\s*(\/\/.*)?$/gm;

    expect(ARRIVAL_CODE).not.toMatch(directive);
    expect(ARRIVAL_CODE).not.toMatch(/\bimport\b/);
    expect(ARRIVAL_CODE).toMatch(/export const ARRIVAL_ATTRIBUTE\b/);
    expect(CARD_CODE).toMatch(/import type \{[^}]*\} from '\.\/arrival'/);
    expect(MENU_CODE).toMatch(
      /import \{[^}]*\bARRIVAL_ATTRIBUTE\b[^}]*\} from '\.\/arrival'/,
    );
    expect(MENU_CODE).not.toMatch(/['"]data-arrival['"]/);
    expect(CODE).not.toMatch(/arrival/i);
  });
});

describe('PriceList — every card of the page keeps the HOUSE corner (owner 2026-10-01, §15.29)', () => {
  // The soft 1rem corner (ui/Card's `corners="soft"`, the personnel card's)
  // was put on the menu card and on each of the eleven category cards on the
  // owner's "apply to all cards on services page too", and taken off the same
  // evening on his "i liked card from before better for services. it looked
  // perfect." So every card here wears ui/Card's default `rounded-md`, and
  // exactly ONE `rounded-*` (a second would leave the stylesheet's order to
  // pick the corner). These pins turn red if the soft corner comes back here
  // without a new word from the owner.
  const rounded = (element: Element): string[] =>
    tokensOf(element).filter((t) => /^rounded-/.test(t));

  it('on the jump menu’s card — the rail’s, and the <nav>’s focus ring the same 6px behind the rail’s gate', () => {
    mount();
    expect(rounded(railCard())).toEqual(['rounded-md']);
    // The <nav> paints nothing; its corner exists for the focus ring a jump
    // to `#price-categories` draws round it, so it follows the card's.
    const menu = screen.getByRole('navigation', { name: MENU_TITLE });
    expect(tokensOf(menu).filter((t) => t.includes('rounded-'))).toEqual([
      'pointer-fine:min-[60rem]:rounded-md',
    ]);
  });

  it('on every category card', () => {
    mount();
    for (const category of CATEGORIES) {
      const card = screen.getByRole('region', { name: category.name });
      expect(rounded(card), category.name).toEqual(['rounded-md']);
    }
  });
});

describe('PriceList — the note under the cards (CLAUDE.md §15.38)', () => {
  const NOTE = 'Prețurile sunt exprimate în RON și includ toate taxele.';

  it('prints the note LAST in the cards column, after every card', () => {
    render(
      <PriceList menuTitle={MENU_TITLE} categories={CATEGORIES} note={NOTE} />,
    );
    const note = screen.getByText(NOTE);
    expect(note.tagName).toBe('P');
    expect(note.parentElement?.lastElementChild).toBe(note);
    expect(note.previousElementSibling?.tagName).toBe('SECTION');
  });

  it('adds NOTHING without a note — the column still ends on its last card (§6.6)', () => {
    // Structure, not a comparison of two spellings of "absent" (which JS
    // treats alike — the React review): with no note the cards column ends on
    // its last card, and an EMPTY note adds nothing either.
    for (const note of [undefined, '']) {
      const { container, unmount } = render(
        <PriceList
          menuTitle={MENU_TITLE}
          categories={CATEGORIES}
          note={note}
        />,
      );
      const cards = container.querySelectorAll('section section');
      const column = cards[cards.length - 1]?.parentElement;
      expect(column?.lastElementChild?.tagName, String(note)).toBe('SECTION');
      expect(container.textContent).not.toContain(NOTE);
      unmount();
    }
  });
});
