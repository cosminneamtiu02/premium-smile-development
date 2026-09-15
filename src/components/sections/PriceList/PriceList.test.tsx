import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { containerClasses } from '@/components/ui/Container/Container';
import { TextButton } from '@/components/ui/TextButton/TextButton';
import cardSource from './CategoryCard.tsx?raw';
import {
  PriceList,
  PRICE_MENU_ID,
  type PriceCategoryProps,
  type PriceRowProps,
} from './PriceList';
import source from './PriceList.tsx?raw';
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
// this repo follows (Footer, GlyphButton, ClinicLocation). The one fact that
// only real CSS can prove — that the menu is `position: sticky` at 8.5rem once
// the split fires — is asserted in PriceList.stories.tsx's play functions,
// where globals.css is loaded and the box can be measured.
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

/** The shell's own `scroll-padding-top: 6rem`, in the pixels this file sets on
 *  <html> for the scrolling tests — globals.css is not loaded here. */
const SCROLL_PADDING = 96;

const mount = () =>
  render(<PriceList menuTitle={MENU_TITLE} categories={CATEGORIES} />);

/** The band root — the rendered <section> itself; everything else is found
 *  through a role. */
const bandOf = (container: HTMLElement): HTMLElement =>
  container.firstElementChild as HTMLElement;

const tokensOf = (element: Element): string[] =>
  (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);

const menuLinks = (): HTMLElement[] =>
  within(screen.getByRole('navigation', { name: MENU_TITLE })).getAllByRole(
    'link',
  );

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

/** Make the cards tall enough to be reached one at a time, and give <html> the
 *  scroll padding the real shell has. Returns the scroll offset a jump to that
 *  card would produce: `rect.top − scroll-margin-top === scroll-padding-top`,
 *  with the margin at 0 because no stylesheet turns `scroll-mt-10` into one. */
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
        SCROLL_PADDING,
    );
};

/**
 * The two components' source with their PROSE removed, which is what the
 * island and data guards at the bottom run against (mechanism from
 * ClinicLocation.test.tsx, reasoning written out in full in
 * Wordmark.test.tsx). Without it the guards police the files' own
 * documentation: every header discusses `'use client'` and `t()` by name.
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

const CODE = stripComments(source);
const CARD_CODE = stripComments(cardSource);
const MENU_CODE = stripComments(menuSource);

// The jump really navigates in this runner (see the fragment test) and the
// island really scrolls the page, so both survive a test. Put the URL, the
// scroll position and the inline styles back, or the next test file inherits
// a hash, an offset and a 4500px-tall document that have nothing to do with it.
afterEach(() => {
  if (window.location.hash !== '') {
    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search,
    );
  }
  document.documentElement.style.scrollPaddingTop = '';
  window.scrollTo(0, 0);
});

describe('PriceList — the band', () => {
  it('is a full-bleed <section> that paints the page ground and names nothing', () => {
    // The band deliberately carries no aria-labelledby of its own: the PAGE
    // owns the intro heading above it and names it from there (board §3.1).
    // Spelling a role would be redundant ARIA (§9, semantic HTML first).
    const { container } = mount();
    const band = bandOf(container);

    expect(band.tagName).toBe('SECTION');
    expect(band).not.toHaveAttribute('role');
    expect(band).not.toHaveAttribute('aria-labelledby');
    expect(band.className).toBe('bg-page');
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

    expect(bandOf(container).className).toBe('bg-page col-span-2');
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
        '@3xl:grid-cols-[minmax(15rem,1fr)_4fr]',
        // Without it a grid item is stretched to the row's height and the
        // sticky menu has nothing left to stick against (board §3.3).
        '@3xl:items-start',
      ]),
    );
  });

  it('measures the CONTAINER, never the viewport (§6.5), in NAMED steps only', () => {
    // A media query here would react to the window instead of the boxes the
    // band actually occupies. Token-wise, not a substring match — `@3xl:`
    // legitimately contains "xl:".
    const { container } = mount();
    const band = bandOf(container);
    const viewportVariant = /^(sm|md|lg|xl|2xl):/;
    const named = /^@(3xs|2xs|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl):/;

    const everything = [band, ...band.querySelectorAll('*')];
    for (const el of everything) {
      expect(tokensOf(el).filter((c) => viewportVariant.test(c))).toEqual([]);
    }

    const steps = everything
      .flatMap((el) => tokensOf(el))
      .filter((c) => c.startsWith('@') && c !== '@container');
    expect(steps.length).toBeGreaterThan(0);
    // No custom container step may enter the untouched default scale (§3).
    for (const step of steps) expect(step).toMatch(named);
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
    // ui/Heading's `section` step is text-3xl, the same one every card title
    // wears, so the two are honest siblings; the rule under it (asserted with
    // the list below) is what separates the title from the items.
    mount();
    const title = within(
      screen.getByRole('navigation', { name: MENU_TITLE }),
    ).getByRole('heading', { level: 2, name: MENU_TITLE });

    expect(tokensOf(title)).toEqual(
      expect.arrayContaining(['font-display', 'text-3xl', 'text-ink-strong']),
    );
  });

  it('wears ui/Card’s surface AND its aura on the nav itself (asChild, no wrapper)', () => {
    mount();
    const menu = screen.getByRole('navigation', { name: MENU_TITLE });

    // The card's own marks, derived from the atom rather than retyped: the
    // container context (Card D10), the surface row, and the glow the band
    // asks for with ui/Card's `aura` prop (owner 2026-09-14).
    expect(tokensOf(menu)).toEqual(
      expect.arrayContaining(['@container', 'bg-surface', 'p-6', AURA]),
    );
    // …and the placement className is merged after them (ui/slot.ts). 8.5rem
    // of offset = the pill's 6rem reach + 2.5rem that clears its glow; the
    // belt is that offset plus one rem of air at the bottom.
    expect(tokensOf(menu)).toEqual(
      expect.arrayContaining([
        'scroll-mt-10',
        '@3xl:sticky',
        '@3xl:top-34',
        '@3xl:max-h-[calc(100dvh-9.5rem)]',
        '@3xl:overflow-y-auto',
      ]),
    );
    expect(menu.className.indexOf('@container')).toBeLessThan(
      menu.className.indexOf('@3xl:sticky'),
    );
  });

  it('separates the title from the list with a rule, and nothing else', () => {
    // The <ul>'s whole class list, exactly: the rule and its two paddings are
    // the separation the owner asked for, `items-start` keeps each link
    // hugging its own label, and there is no third idea in there.
    mount();
    const list = within(
      screen.getByRole('navigation', { name: MENU_TITLE }),
    ).getByRole('list');

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

  it('prints ONE link per category, in the categories’ own order', () => {
    mount();
    const menu = screen.getByRole('navigation', { name: MENU_TITLE });
    const links = within(menu).getAllByRole('link');

    expect(links).toHaveLength(CATEGORIES.length);
    expect(links.map((link) => link.textContent)).toEqual(
      CATEGORIES.map((category) => category.name),
    );
    // A list, because it IS one — "list, N items" is what a screen reader
    // announces. No role="list": WebKit only drops the semantics outside a
    // <nav> (eslint.config.mjs, jsx-a11y/list-role-for-webkit).
    const list = within(menu).getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(
      CATEGORIES.length,
    );
  });

  it('points every link at a card that really exists on the page', () => {
    // The menu and the cards are the same array printed twice, so this can
    // only fail if the href spelling breaks — which is exactly what it guards.
    const { container } = mount();

    for (const [index, link] of menuLinks().entries()) {
      const category = CATEGORIES[index];
      expect(link).toHaveAttribute('href', `#${category.id}`);
      const target = container.ownerDocument.getElementById(category.id);
      expect(target).not.toBeNull();
      expect(target?.tagName).toBe('SECTION');
    }
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
      // to rest on one line.
      expect(tokensOf(card)).toContain('scroll-mt-10');
    }
  });

  it('gives every card the pill’s glow (ui/Card’s aura prop)', () => {
    mount();

    for (const category of CATEGORIES) {
      const card = screen.getByRole('region', { name: category.name });
      expect(tokensOf(card).filter((c) => c === AURA)).toEqual([AURA]);
    }
  });

  it('stacks the cards with the gap the glow needs', () => {
    // `gap-8` = 32px. The aura is `0 8px 22px`, so a `gap-6` column would let
    // two neighbouring glows stack into a seam between cards (PriceList.tsx,
    // THE GLOW IS A CARD KIND).
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
    // stops stacking — at 390 the card's inside is ~262px and an 80-character
    // treatment name needs the whole line (board §5.3).
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
    const link = within(
      screen.getByRole('navigation', { name: MENU_TITLE }),
    ).getByRole('link', { name: category.name });

    await userEvent.click(link);

    const card = screen.getByRole('region', { name: category.name });
    expect(window.location.hash).toBe(`#${category.id}`);
    expect(document.activeElement).toBe(card);
  });
});

describe('PriceList — the current category (the island)', () => {
  it('marks NOTHING in the server HTML — hydration-safe by construction', () => {
    // The island's store publishes `{ current: null }` from its frozen server
    // snapshot (lib/scroll-spy), so the pre-rendered page every visitor
    // downloads carries no aria-current at all and the browser's first render
    // agrees with it byte for byte (§16's hydration-safety rule).
    const html = renderToStaticMarkup(
      <PriceList menuTitle={MENU_TITLE} categories={CATEGORIES} />,
    );

    expect(html).not.toContain('aria-current');
    expect(html).toContain(`href="#${CATEGORIES[0].id}"`);
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
      expect.arrayContaining(['text-cta-hover', 'after:scale-x-100']),
    );
    for (const link of links.slice(1)) {
      expect(link).not.toHaveAttribute('aria-current');
      expect(tokensOf(link)).toEqual(
        expect.arrayContaining(['text-ink', 'after:scale-x-0']),
      );
    }
  });

  it('follows an ordinary scroll: the card at its landing line wins', async () => {
    // The first of the owner's two directions (2026-09-14: "normal scrolling
    // also dictates menu item"). The cards are stretched here and <html> is
    // given the shell's own scroll padding, because this project loads no
    // stylesheet — the arithmetic is the page's, the numbers are this file's.
    mount();
    const landingOf = stretchCards();
    // The premise, so the assertion below cannot pass by standing still.
    expect(menuLinks()[0]).toHaveAttribute('aria-current', 'location');

    await scrollToY(landingOf(CATEGORIES[2].id));

    const links = menuLinks();
    expect(links[2]).toHaveAttribute('aria-current', 'location');
    expect(links[0]).not.toHaveAttribute('aria-current');
  });

  it('pins the category a click chose, at once and whatever the scroll says', async () => {
    // The other direction ("menu item click takes you also to navigation
    // item"), and the reason the pin exists at all: the last category is
    // marked the instant it is clicked, before — and after — the jump's own
    // scrolling has anything to say about it.
    mount();
    const last = CATEGORIES[CATEGORIES.length - 1];

    await userEvent.click(
      within(screen.getByRole('navigation', { name: MENU_TITLE })).getByRole(
        'link',
        { name: last.name },
      ),
    );

    const links = menuLinks();
    expect(links[CATEGORIES.length - 1]).toHaveAttribute(
      'aria-current',
      'location',
    );
    expect(links[0]).not.toHaveAttribute('aria-current');
    expect(window.location.hash).toBe(`#${last.id}`);
  });
});

describe('PriceList — dumb by construction', () => {
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
    // for lib/cx and — since the pack round — for lib/scroll-spy, the island's
    // React-free mechanics, and for nothing else under lib/. None of them may
    // know what a locale is. All three are checked, prose stripped.
    for (const code of [CODE, CARD_CODE, MENU_CODE]) {
      const libImports = [...code.matchAll(/from '(@\/lib\/[^']+)'/g)].map(
        (match) => match[1],
      );
      expect(
        libImports.every((path) =>
          ['@/lib/cx/cx', '@/lib/scroll-spy/scroll-spy'].includes(path),
        ),
      ).toBe(true);
      expect(code).not.toMatch(/next-intl|useTranslations|getTranslations/);
      expect(code).not.toMatch(/@\/messages|@\/i18n/);
    }
  });

  it('ships ONE island, and it is the menu list (§16)', () => {
    // The source guard, read through Vite's ?raw (typed by the repo's own
    // src/types/raw-import.d.ts). Anchored to a line of its OWN, because that
    // is what a directive is, and tolerant of a trailing comment. The band and
    // the card stay inert HTML on every page; only the list of links ships.
    const directive = /^\s*['"]use client['"]\s*;?\s*(\/\/.*)?$/gm;

    for (const code of [CODE, CARD_CODE]) {
      expect(code).not.toMatch(directive);
      expect(code).not.toMatch(/\buseState\b|\buseEffect\b|\buseRef\b/);
      expect(code).not.toMatch(/\bon[A-Z]\w*=/);
    }
    expect(MENU_CODE.match(directive)).toHaveLength(1);
  });
});
