import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
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
// ── WHAT THE PLAYS DELIBERATELY DO NOT DO: click. The band's island marks the
// category the visitor is at, and both of its inputs — a click and a scroll —
// MOVE THE PAGE, which would photograph a different frame than the one the
// baselines hold. So the plays assert the load-time state only (the first
// category marked, exactly once); the pin and the scroll walk are exercised in
// PriceList.test.tsx and in src/lib/scroll-spy, where the runner owns the
// scroll position.
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

/**
 * The arrangement contract, in the branch the measured column actually puts us
 * in (board §3.3, §5.2):
 *   · beside the cards — the menu is `sticky` at 8.5rem, the header pill's
 *     6rem reach plus the 2.5rem that clears the glow around it (the FIFTH
 *     coupled spelling of that reach, measured in PriceList.tsx's header);
 *   · stacked — the menu is a plain static table of contents at the top of the
 *     band, which is the whole phone design.
 * This is the assertion that needs REAL CSS, which is why it lives in a play
 * function: the components project loads no stylesheet (PriceList.test.tsx's
 * header says so) and can only see class tokens.
 */
const expectArrangement = async (
  band: HTMLElement,
  menu: HTMLElement,
): Promise<void> => {
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

/** The outline: the menu's title and one title per card, all <h2>, nothing
 *  skipped and nothing invented (§9). The page's own <h1> lives above the
 *  band, which is why there is none here — and the menu's title wears the same
 *  30px step as the card titles (owner 2026-09-14), read back from real CSS. */
const expectHeadingOutline = async (
  band: HTMLElement,
  categories: readonly PriceCategoryProps[],
): Promise<void> => {
  const headings = Array.from(band.querySelectorAll('h1,h2,h3,h4,h5,h6'));

  await expect(headings.map((heading) => heading.tagName)).toEqual(
    Array<string>(categories.length + 1).fill('H2'),
  );
  for (const heading of headings) {
    await expect(getComputedStyle(heading).fontSize).toBe(`${1.875 * rem()}px`);
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
    await expectHeadingOutline(band, deck.categories);
    await expectCurrentIsFirst(band, deck.categories);
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
 * What to look at: the menu card on the left, its „Categorii" title at the
 * same 30px step as the card titles with a rule under it, then four links,
 * each a 44px row — the first one green and underlined, because that is where
 * the page currently is; the cards on the right, each opening with its own
 * eyebrow and <h2>, each wearing the header pill's lavender glow; the price
 * column right-aligned with tabular digits so „2.300 RON" and „150 RON" line
 * up, one column however wide the card gets. Click a menu entry and the
 * browser jumps — the jump itself is still the browser's, and the only
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
 * track's 15rem floor on ONE line, because §15.14 forbids syllable-breaking an
 * interactive label; „Prothetische Versorgung" must not push the card's
 * heading into its rows; and the ~90-character compound row name must wrap
 * inside the card without ever colliding with its price. If a label ever stops
 * fitting, the FLOOR moves — never the architecture, and never in this file
 * alone.
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
 * card's inside is ~262px and an 80-character treatment name needs the whole
 * of it (board §5.3).
 */
export const Smartphone390: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  play: playDeck(ROMANIAN),
};

/**
 * The laptop, Romanian — the other sampled width, and the one that shows the
 * design the owner asked for: the menu beside the cards, stuck 8.5rem down so
 * it clears the header pill AND the glow around it, while the price cards
 * scroll past it and the marked link follows them.
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
 *  one unbroken line inside a 15rem card. */
export const GermanLaptop1536: Story = {
  globals: { locale: 'de', viewport: { value: 'laptop' } },
  args: GERMAN,
  play: playDeck(GERMAN),
};
