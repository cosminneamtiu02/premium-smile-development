import { StrictMode } from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { page, userEvent as realUser } from 'vitest/browser';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline: the ring
// is a COMPUTED outline — globals.css's `:focus-visible` safety net, and
// CategoryCard's quiet ring over it — so this file loads the sheet and lives
// apart from PriceList.test.tsx, whose scrolling suites need a page without it
// (that file's header; PriceList.scale.test.tsx's WHY A FILE OF ITS OWN).
// tests/setup/components.ts loads no CSS globally; the per-file import is the
// house pattern.
import '@/styles/globals.css';
import { PriceList, PRICE_MENU_ID, type PriceCategoryProps } from './PriceList';

// sections/PriceList — THE RING IS THE KEYBOARD'S, FROM A LINK OUTSIDE THE
// MENU (CLAUDE.md §15.40; PriceMenu.tsx's A LINK FROM OUTSIDE THE MENU STAMPS
// TOO). Since 2026-10-15 the top bar's dropdown under „Servicii" lists the
// eleven categories as plain links to `/{locale}/services/#{id}`. On this very
// page a keyboard visitor who pressed Enter on one landed on the card with
// focus and `:focus-visible` — and with NO ring: no click of the menu's had
// stamped the card, so its quiet ring hid the outline (the G2 reviewers, the
// built export, Chromium 1366×900; through the menu's own link, with the same
// keys, the ring showed). The owner's rule of 2026-09-29 is the ARRIVAL's, not
// the menu's: a keyboard's arrival keeps the ring, a pointer's never draws it.
//
// ── THE STAND-IN. The top bar is another section, which this band may not
// import (§4), so a plain anchor before the band stands in for its entry —
// inside a <nav> of its own, as the dropdown's entries are — with the top
// bar's href shape: this page's own path, then the category's fragment.
//
// ── WHAT DRIVES IT. vitest/browser's REAL input for the arrivals: only a
// trusted key press makes a `:focus-visible` arrival, and a trusted press
// counts itself in the click's `detail` — the e2e's own way (tests/e2e/
// price-current-aura.spec.ts: the link takes focus, Enter follows it). And
// fireEvent for two kinds of click a real hand cannot stage here: the LONE
// click no press precedes, which moves no focus (PriceList.test.tsx's
// 'stamps nothing for a POINTER click' — the island's own path, the one that
// does not lean on the card's blur), and clicks whose default a capture
// listener ON THE LINK cancels, so the runner never leaves this page or opens
// another. The document's capture listener runs before the link's own, so it
// hears every one of them.
//
// ── THE WINDOW is a laptop's, 1366×900 — the reviewers' — so the menu is the
// rail beside the cards, as on the screens where the top bar's dropdown is
// drawn (the phone panel's list is the same kind of link, the same listener).

const MENU_TITLE = 'Categorii';

/** Three categories with diacritics (§15.7) — the smallest deck that holds a
 *  menu, a column of cards and a target with neighbours on both sides. */
const CATEGORIES: readonly PriceCategoryProps[] = [
  {
    id: 'consultations',
    name: 'Consultații',
    eyebrow: 'Primul pas către tratament',
    rows: [
      { id: 'first-visit', name: 'Consultație inițială', price: '150 RON' },
    ],
  },
  {
    id: 'endodontics',
    name: 'Endodonție',
    eyebrow: 'Tratamente la microscop',
    rows: [
      { id: 'one-canal', name: 'Tratament pe un canal', price: '450 RON' },
    ],
  },
  {
    id: 'prosthetics',
    name: 'Protetică',
    eyebrow: 'Lucrări fixe și mobile',
    rows: [{ id: 'crown', name: 'Coroană ceramică', price: '2.300 RON' }],
  },
];

/** The category every case jumps to — „Endodonție", the reviewers' own. */
const TARGET = CATEGORIES[1];

/** The stand-in top bar's name. */
const TOP_BAR = 'Meniu principal';

/** The island's stamp on a card the KEYBOARD jumped to, and its one value —
 *  spelled here, never imported from ./arrival, so a silent rename of the
 *  stamp fails in this file (PriceList.test.tsx's reason). */
const ARRIVAL = 'data-arrival';
const KEYBOARD = 'keyboard';

/** The reviewers' window. */
const LAPTOP = { width: 1366, height: 900 } as const;

/** The top bar's href shape: this page's own path and query, then the
 *  fragment — the same document, so the browser's jump stays in it. */
const thisPage = (id: string): string =>
  `${location.pathname}${location.search}#${id}`;

/** The band, and before it the stand-in for the top bar's entry, linking to
 *  `href` — the page's elements every case reads, found by role. */
const mount = (href = thisPage(TARGET.id)) => {
  render(
    <>
      <nav aria-label={TOP_BAR}>
        <a href={href}>{TARGET.name}</a>
      </nav>
      <PriceList menuTitle={MENU_TITLE} categories={CATEGORIES} />
    </>,
  );
  return {
    outside: within(
      screen.getByRole('navigation', { name: TOP_BAR }),
    ).getByRole('link'),
    // The rail's link: at this window the strip is `display: none`, so the
    // menu's role tree holds the rail's links alone.
    menuLink: within(
      screen.getByRole('navigation', { name: MENU_TITLE }),
    ).getByRole('link', { name: TARGET.name }),
    card: screen.getByRole('region', { name: TARGET.name }),
  };
};

/** What the card shows for its focus, read from the engine: whether it holds
 *  focus and matches `:focus-visible`, its outline, and the island's stamp
 *  (the e2e's `ringOn`, in this runner). */
const ringOf = (card: HTMLElement) => {
  const style = getComputedStyle(card);
  return {
    focused: document.activeElement === card,
    focusVisible: card.matches(':focus-visible'),
    outlineStyle: style.outlineStyle,
    outlineWidth: style.outlineWidth,
    arrival: card.getAttribute(ARRIVAL),
  };
};

/** Every element in the document that carries the stamp. */
const stamped = (): Element[] =>
  Array.from(document.querySelectorAll(`[${ARRIVAL}]`));

/** Wait until a jump has LANDED: the card focused through its tabindex="-1"
 *  by the browser's own fragment jump (CategoryCard's THE CARD IS THE
 *  TARGET). A guard, never a clock. */
const landedOn = async (card: HTMLElement): Promise<void> => {
  await expect.poll(() => document.activeElement, { timeout: 2000 }).toBe(card);
};

/** THE KEYBOARD'S ARRIVAL: the link takes focus, and a REAL Enter follows it —
 *  the click the browser makes for that key counts 0. */
const byKeyboard = async (
  link: HTMLElement,
  card: HTMLElement,
): Promise<void> => {
  link.focus();
  await realUser.keyboard('{Enter}');
  await landedOn(card);
};

/** Cancel a link's navigation from its OWN capture listener — which runs
 *  after the document's, so the island still hears the click. Returns the
 *  clean-up. */
const cancelOn = (link: HTMLElement): (() => void) => {
  const cancel = (event: Event): void => event.preventDefault();
  link.addEventListener('click', cancel, { capture: true });
  return () => link.removeEventListener('click', cancel, { capture: true });
};

/** The blur listeners a card has been handed since a spy was put on its
 *  `addEventListener` — one per stamp (PriceMenu.tsx's createArrivalStamp).
 *  The spy is read by its calls alone, whatever the method's overloads. */
const blurListenersAdded = (
  spy: Readonly<{ mock: Readonly<{ calls: readonly (readonly unknown[])[] }> }>,
): number => spy.mock.calls.filter(([type]) => type === 'blur').length;

/** The ring as a keyboard arrival must leave it: the safety net's 2px solid
 *  outline on the focused, `:focus-visible`, stamped card. */
const KEYBOARD_RING = {
  focused: true,
  focusVisible: true,
  outlineStyle: 'solid',
  outlineWidth: '2px',
  arrival: KEYBOARD,
} as const;

let window0 = { width: 0, height: 0 };

beforeAll(async () => {
  window0 = { width: window.innerWidth, height: window.innerHeight };
  await page.viewport(LAPTOP.width, LAPTOP.height);
});

afterAll(async () => {
  await page.viewport(window0.width, window0.height);
  // The real pointer, parked on a box at the bottom-left corner, away from
  // whatever the next file mounts at the top of <body> (the house's
  // park-the-pointer rule — a resting pointer is :hover).
  const parking = document.createElement('div');
  parking.style.cssText =
    'position: fixed; left: 0; bottom: 0; width: 2rem; height: 2rem';
  document.body.append(parking);
  await realUser.hover(parking);
  parking.remove();
});

// The jumps really navigate in this runner, and globals.css makes them glide:
// the island leaves FIRST (its spy and its listeners with it), then the URL
// loses its fragment and the page goes back to its top at once — an instant
// scroll, which also ends any glide still running.
afterEach(() => {
  cleanup();
  if (window.location.hash !== '') {
    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search,
    );
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  vi.restoreAllMocks();
});

describe('PriceList — a link OUTSIDE the menu: the ring is the keyboard’s there too (CLAUDE.md §15.40)', () => {
  beforeAll(() => {
    // THE PREMISES: the sheet is loaded and this window is the rail's — a
    // fine pointer and 60rem (PriceMenu.tsx's THE TWO PRESENTATIONS).
    expect(
      window.matchMedia('(pointer: fine) and (min-width: 60rem)').matches,
      'a laptop’s window: the rail beside the cards',
    ).toBe(true);
  });

  it('stamps the card a KEYBOARD jump from the top bar’s entry lands on — once — and the ring is drawn: 2px solid', async () => {
    const { outside, card } = mount();
    const added = vi.spyOn(card, 'addEventListener');

    await byKeyboard(outside, card);

    expect(window.location.hash).toBe(`#${TARGET.id}`);
    expect(ringOf(card)).toEqual(KEYBOARD_RING);
    expect(stamped()).toEqual([card]);
    // ONE stamp: one blur listener handed to the card, the one that takes the
    // stamp off when focus moves on.
    expect(blurListenersAdded(added)).toBe(1);
  });

  it('stamps nothing for a REAL POINTER click on that entry — no ring', async () => {
    const { outside, card } = mount();

    await realUser.click(outside);
    await landedOn(card);

    expect(window.location.hash).toBe(`#${TARGET.id}`);
    expect(ringOf(card)).toMatchObject({
      focused: true,
      outlineStyle: 'none',
      arrival: null,
    });
    expect(stamped()).toEqual([]);
  });

  it('lets the LAST arrival decide: a lone pointer click on the entry lifts the keyboard’s stamp, and the quiet ring hides the outline the card still matches', async () => {
    // WebKit's pointer state, staged from the keyboard's side (the e2e's own
    // move): Chromium never makes a pointer's arrival `:focus-visible`, so a
    // real press here would test the engine's heuristic, not the stamp. A
    // keyboard arrival leaves the card focused and `:focus-visible`; a lone
    // click on the entry — no press before it, so no focus moves and no blur
    // takes the stamp — must lift it, and the card's class then hides the
    // ring it still qualifies for.
    const { outside, card } = mount();
    await byKeyboard(outside, card);
    expect(ringOf(card)).toEqual(KEYBOARD_RING);

    fireEvent.click(outside, { detail: 1 });

    expect(ringOf(card)).toMatchObject({
      focused: true,
      focusVisible: true,
      outlineStyle: 'none',
      arrival: null,
    });
    expect(stamped()).toEqual([]);
  });

  it('neither stamps nor lifts on a MODIFIED click — Ctrl or Cmd: this tab goes nowhere', async () => {
    // A Ctrl or Cmd click opens the link somewhere else, so it says nothing
    // about how THIS tab's card was reached (PriceMenu.tsx's ONLY A PLAIN
    // LEFT CLICK PINS). `detail` 0 is the keyboard's spelling — Ctrl+Enter —
    // the one a stamp would answer; 1 a pointer's, the one a lift would.
    const { outside, card } = mount();
    const restore = cancelOn(outside);
    try {
      for (const modifier of ['ctrlKey', 'metaKey'] as const) {
        fireEvent.click(outside, { detail: 0, [modifier]: true });
        expect(stamped(), modifier).toEqual([]);
      }
    } finally {
      restore();
    }

    // …and a stamp already there stays, with its ring.
    await byKeyboard(outside, card);
    expect(ringOf(card)).toEqual(KEYBOARD_RING);
    const restoreAgain = cancelOn(outside);
    try {
      for (const modifier of ['ctrlKey', 'metaKey'] as const) {
        fireEvent.click(outside, { detail: 1, [modifier]: true });
        expect(ringOf(card), modifier).toEqual(KEYBOARD_RING);
      }
    } finally {
      restoreAgain();
    }
  });

  it.each([
    {
      link: 'a bare fragment',
      href: () => `#${TARGET.id}`,
      stamps: true,
    },
    {
      link: 'this page’s own path — the top bar’s shape',
      href: () => thisPage(TARGET.id),
      stamps: true,
    },
    {
      link: 'another page',
      href: () => `/ro/team/#${TARGET.id}`,
      stamps: false,
    },
    {
      link: 'this path with another query — a new document',
      href: () =>
        `${location.pathname}${location.search}${location.search === '' ? '?' : '&'}pret=1#${TARGET.id}`,
      stamps: false,
    },
    {
      link: 'another origin',
      href: () =>
        `https://example.ro${location.pathname}${location.search}#${TARGET.id}`,
      stamps: false,
    },
    {
      link: 'a fragment that names the menu, not a category',
      href: () => thisPage(PRICE_MENU_ID),
      stamps: false,
    },
    {
      link: 'a fragment no card of this menu wears',
      href: () => thisPage('prophylaxis'),
      stamps: false,
    },
  ])(
    'counts a keyboard click on $link as an arrival: $stamps',
    ({ href, stamps }) => {
      // The browser's own rule for a jump that stays in the document — the
      // same origin, path and query — and a fragment naming one of THIS
      // menu's categories. The default is cancelled on the link, so nothing
      // navigates; the document's listener has already heard the click.
      const { outside, card } = mount(href());
      const restore = cancelOn(outside);
      try {
        fireEvent.click(outside, { detail: 0 });
      } finally {
        restore();
      }

      expect(stamped()).toEqual(stamps ? [card] : []);
    },
  );

  it('leaves the menu’s OWN links to the menu — one stamp, one blur listener, the ring', async () => {
    // onItemClick answers them, exactly as before: the document's listener
    // skips every link inside the menu's <nav>, so the card is stamped ONCE —
    // a second stamp would hand it a second blur listener.
    const { menuLink, card } = mount();
    const added = vi.spyOn(card, 'addEventListener');

    await byKeyboard(menuLink, card);

    expect(ringOf(card)).toEqual(KEYBOARD_RING);
    expect(stamped()).toEqual([card]);
    expect(blurListenersAdded(added)).toBe(1);
  });

  it('listens on the document in the CAPTURE phase for the island’s life — once under Strict Mode, and not after it leaves', () => {
    const isCapture = (
      options: boolean | EventListenerOptions | undefined,
    ): boolean =>
      options === true ||
      (typeof options === 'object' && options.capture === true);
    const added = vi.spyOn(document, 'addEventListener');
    const removed = vi.spyOn(document, 'removeEventListener');
    /** The capture `click` listeners handed to (or taken off) the document. */
    const clicks = (spy: typeof added | typeof removed): unknown[] =>
      spy.mock.calls
        .filter(([type, , options]) => type === 'click' && isCapture(options))
        .map(([, listener]) => listener);

    const { unmount } = render(
      <StrictMode>
        <PriceList menuTitle={MENU_TITLE} categories={CATEGORIES} />
      </StrictMode>,
    );

    // Strict Mode's rehearsal adds, removes and adds again: ONE stays.
    const live = clicks(added).filter(
      (listener) => !clicks(removed).includes(listener),
    );
    expect(live).toHaveLength(1);

    unmount();

    // Every one it added is removed — with the capture flag, which a removal
    // must repeat to match.
    expect(clicks(removed)).toEqual(expect.arrayContaining(clicks(added)));
    expect(clicks(removed)).toHaveLength(clicks(added).length);
  });
});
