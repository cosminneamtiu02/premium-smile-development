import type { ReactElement } from 'react';
import {
  act,
  createEvent,
  fireEvent,
  isInaccessible,
  render,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { renderToString } from 'react-dom/server';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest';
import { page as browser, userEvent as realUser } from 'vitest/browser';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline: a closed
// card's visibility, the ⌄'s click-through, the arrow's place and turn, an
// entry's hover colour, the card's geometry and the motion's timings are
// COMPUTED things (the house pattern —
// Header.step.test.tsx, TextButton.test.tsx; tests/setup/components.ts loads
// no CSS globally).
import '@/styles/globals.css';
import { ContactModalProvider } from '@/components/sections/ContactModal/ContactModalProvider';
import { type Locale, locales } from '@/i18n/locales';
import { priceCategories } from '@/lib/prices/prices';
import { doctors } from '@/lib/team/team';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import { FOLLOW_AFTER_MS, REVEAL_AFTER_MS } from './accordionTiming';
import { Header } from './Header';
import { HeaderNav } from './HeaderNav';
import { NavMenu, PANEL_ID } from './NavMenu';
import { type NavSectionsByPath, navSectionLinks } from './navSectionLinks';
import {
  HOVER_GRACE_MS,
  HOVER_INTENT_MS,
  type NavDropdowns,
} from './useNavDropdowns';

// sections/Header — THE TOP BAR'S DROPDOWNS (CLAUDE.md §15.40; the owner,
// 2026-10-15: "i want to implement a navigation dropdown on hover JUST ON THE
// TOP BAR ELEMNTS which drops down smoothly with sections of that particular
// page … on phone it should open up a dropdown with the adjacent subsections …
// if you click on another section with other subsections and another section
// is open it should close the other open one and open this one … blog and home
// should not have this").
//
// ── WHAT THIS FILE HOLDS, and with which pointer. Three drivers, each for what
// only it can prove (Header.test.tsx's TWO EVENT SOURCES, widened):
//   · the CLOCKS — the intent, the grace, the swap — with a MOUSE's pointer
//     events dispatched by hand (pointerType 'mouse', `fakeMouse` below)
//     under FAKE timers: time moves only when a test says so, so 119ms and
//     120ms are two different answers, never a race (not user-event: under
//     Vitest's fake timers its React wrapper hangs — `fakeMouse` says why);
//   · a FINGER and a PEN — PointerEvents dispatched by hand with their
//     pointerType, never Chromium's touch emulation (tests/unit/
//     no-touch-emulation.test.ts refuses it: it leaves the tab with no fine
//     pointer for every later file);
//   · the KEYBOARD and :hover — vitest/browser's real input: only a trusted
//     key makes the ⌄'s :focus-visible, and only a real pointer moves :hover.
//     The real pointer is PARKED away before every rest read and after every
//     hover test (the house's park-the-pointer rule — a resting pointer is
//     :hover, and it would open a card in the next test).
// Fixtures are the real message files and the real data lists (§17.4).

const nav = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('@/i18n/navigation', () => ({ usePathname: () => nav.pathname }));

const MESSAGES: Record<Locale, typeof ro> = { ro, en, de, fr, it: it_ };

const Mounted = ({ locale }: { locale: Locale }): ReactElement => (
  <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
    <ContactModalProvider>
      <Header />
    </ContactModalProvider>
  </NextIntlClientProvider>
);

/** STILLNESS for every read but the motion's own: an unlayered rule outranks
 *  every utility (the tests-with-real-CSS recipe). The motion describe lifts
 *  it to read the timings themselves. */
let still: HTMLStyleElement;
const freeze = () => {
  still = document.createElement('style');
  still.textContent = '*, *::before, *::after { transition: none !important; }';
  document.head.append(still);
};

// The page the bar sits on, as body-level SIBLINGS of the section (the
// shell's shape — NavMenu's freeze walks <body>'s children): something to
// hover and press OUTSIDE the row, and what the phone panel freezes.
let pageMain: HTMLElement;
let pageFooter: HTMLElement;
let window0 = { width: 0, height: 0 };

beforeAll(() => {
  window0 = { width: window.innerWidth, height: window.innerHeight };
  freeze();
});
afterAll(async () => {
  still.remove();
  await browser.viewport(window0.width, window0.height);
});

beforeEach(() => {
  nav.pathname = '/';
  pageMain = document.createElement('main');
  pageMain.innerHTML =
    '<p style="height: 6rem">Clinica este deschisă de luni până vineri.</p>' +
    '<a href="#prețuri">Prețuri și programări</a>';
  pageFooter = document.createElement('footer');
  pageFooter.innerHTML = '<a href="#sus">Înapoi sus</a>';
  document.body.append(pageMain, pageFooter);
});

afterEach(() => {
  vi.useRealTimers();
  pageMain.remove();
  pageFooter.remove();
  document.documentElement.style.overflow = '';
});

/** The real pointer, parked on a box at the very top-left corner, away from
 *  every control (TextButton.test.tsx's parkPointer). */
const parkPointer = async (): Promise<void> => {
  const parking = document.createElement('div');
  parking.style.cssText =
    'position: fixed; left: 0; bottom: 0; width: 2rem; height: 2rem';
  document.body.append(parking);
  await realUser.hover(parking);
  parking.remove();
};

/** Render into a container at the TOP of <body> — the shell's order (the
 *  header first, the page after it), never below the stand-in page: the bar's
 *  geometry and the focus scroll the browser does around it depend on where
 *  the bar sits. RTL still unmounts and removes it after every test. */
const atTop = (): { container: HTMLElement } => {
  const container = document.createElement('div');
  document.body.prepend(container);
  return { container };
};

/** Every element a desktop test reads, found the way a visitor's tools find
 *  it: the row by its landmark name, each dropdown item by its path. */
const mountRow = (locale: Locale = 'ro') => {
  const utils = render(<Mounted locale={locale} />, atTop());
  // By its landmark name, read as the attribute: at a phone's width the row
  // is display:none and out of the accessibility tree, but still the row.
  const row = utils.container.querySelector<HTMLElement>(
    `nav[aria-label="${MESSAGES[locale].common.nav.ariaLabel}"]`,
  );
  if (!row) throw new Error('the bar has no row');
  const item = (path: string): HTMLElement => {
    const found = row.querySelector<HTMLElement>(
      `[data-nav-dropdown="${path}"]`,
    );
    if (!found) throw new Error(`no dropdown item for ${path}`);
    return found;
  };
  const word = (path: string): HTMLElement =>
    item(path).querySelector<HTMLElement>(':scope > a') as HTMLElement;
  const toggle = (path: string): HTMLButtonElement =>
    item(path).querySelector<HTMLButtonElement>(
      ':scope > button',
    ) as HTMLButtonElement;
  const card = (path: string): HTMLElement => {
    const id = toggle(path).getAttribute('aria-controls');
    const found = id ? document.getElementById(id) : null;
    if (!found) throw new Error(`the ⌄ of ${path} controls nothing`);
    return found;
  };
  const isOpen = (path: string): boolean =>
    card(path).getAttribute('data-state') === 'open';
  const entries = (path: string): HTMLAnchorElement[] =>
    Array.from(card(path).querySelectorAll<HTMLAnchorElement>('a'));
  return { ...utils, row, item, word, toggle, card, isOpen, entries };
};

/**
 * THE FAKE-CLOCK MOUSE: what a real mouse move dispatches, by hand — a
 * `pointerout` from where it was (React derives the leave AND the enter from
 * it, its relatedTarget naming where the pointer went), a `pointerover` onto
 * the new element, a `pointermove` on it — every one a MOUSE's. Not
 * @testing-library/user-event: under Vitest's fake timers its React wrapper
 * drains the queue with a timer only Jest's clock advances, and every action
 * hangs. Synchronous, each move inside act(); a click is the move, a press
 * outside nothing, and RTL's fireEvent.click.
 */
const fakeMouse = () => {
  vi.useFakeTimers();
  let at: Element | null = null;
  const init = (relatedTarget: Element | null): PointerEventInit => ({
    bubbles: true,
    cancelable: true,
    pointerType: 'mouse',
    isPrimary: true,
    relatedTarget,
  });
  const hover = (target: Element) => {
    act(() => {
      if (at !== target) {
        at?.dispatchEvent(new PointerEvent('pointerout', init(target)));
        target.dispatchEvent(new PointerEvent('pointerover', init(at)));
      }
      target.dispatchEvent(new PointerEvent('pointermove', init(null)));
      at = target;
    });
  };
  return {
    hover,
    click: (target: Element) => {
      hover(target);
      fireEvent.click(target);
    },
    keyboard: (key: string) => {
      fireEvent.keyDown(document.activeElement ?? document.body, { key });
    },
  };
};

/** Time passes — inside act(), because a timer here commits React state. */
const elapse = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

/** A finger or a pen arriving on an element and moving on it — dispatched by
 *  hand with its pointerType (the file header says why never emulated). */
const touchLike = (target: Element, pointerType: 'touch' | 'pen') => {
  for (const type of ['pointerover', 'pointerenter', 'pointermove']) {
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: type !== 'pointerenter',
        pointerType,
        isPrimary: true,
      }),
    );
  }
};

/** Hrefs, in the order the data lists print them — THE ids the pages print
 *  (lib/nav-sections' own test holds the equality with the pages). */
const servicesHrefs = (locale: Locale) =>
  priceCategories.map((category) => `/${locale}/services/#${category.id}`);
const teamHrefs = (locale: Locale) =>
  doctors.map((doctor) => `/${locale}/team/#${doctor.id}`);

/** A semantic token's colour as the engine computes it — a probe's, so the
 *  test never retypes a hex (the hover test's idiom below, TextButton's). */
const tokenColour = (name: string): string => {
  const probe = document.createElement('span');
  probe.style.color = `var(--${name})`;
  document.body.append(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
};

/** How much of its width a word's underline draws — its `::after`'s
 *  horizontal scale (TextButton.test.tsx's `underlineScaleX`: Chromium reads
 *  "0 1" swept away and "1" drawn, so the first value is the answer, and
 *  `none` is 1). */
const ruleScaleX = (element: Element): number => {
  const scale = getComputedStyle(element, '::after').scale;
  if (scale === 'none') return 1;
  const x = scale.split(/\s+/)[0];
  return x.endsWith('%') ? parseFloat(x) / 100 : parseFloat(x);
};

/** THE HELD LOOK's classes (ui/TextButton's): the active row — the lavender
 *  label and the full rule — on a word that is NOT the current page in these
 *  tests (`nav.pathname` is '/', Acasă), so nothing else can put them there.
 *  The computed paint is read beside it where a test needs the pixels. */
const wearsHeld = (element: Element): boolean => {
  const classes = (element.getAttribute('class') ?? '').split(/\s+/);
  return (
    classes.includes('text-accent') && classes.includes('after:scale-x-100')
  );
};

/** THE POINTER of a dropdown item — the <svg> that is a DIRECT child of the
 *  item (the word's arrow sits inside its link, never here). */
const pointerOf = (item: Element): SVGSVGElement | null =>
  item.querySelector<SVGSVGElement>(':scope > svg');

/** THE ARROW of a dropdown word — the <svg> INSIDE its link (NavDropdown.tsx's
 *  THE ARROW; the ⌄ <button> beside the word draws none since 2026-10-16). */
const arrowOf = (word: Element): SVGSVGElement => {
  const arrow = word.querySelector<SVGSVGElement>(':scope > svg');
  if (!arrow) throw new Error('the dropdown word carries no arrow');
  return arrow;
};

/** The arrow's DRAWN chevron, as the engine lays it out — its path's
 *  geometry turned with the svg (Chromium reads an SVG shape's box without
 *  its stroke: 8 × 4 at the glyph's `sm` size, turned down or up). */
const chevronOf = (word: Element): DOMRect =>
  (
    arrowOf(word).querySelector('path') as SVGPathElement
  ).getBoundingClientRect();

/** The class tokens that would set a property `transition-transform` watches
 *  — transform, translate, scale, rotate — whatever their variants (a
 *  `motion-reduce:` reset is no such token: it names a transition, not a
 *  value). NavDropdown.tsx's THE LOAD RACE: on the arrow there must be none. */
const onTheTransitionList = (classes: string | null | undefined): string[] =>
  (classes ?? '')
    .split(/\s+/)
    .filter((token) =>
      /^-?(?:rotate|translate|scale|transform)(?:-|$)/.test(
        token.split(':').at(-1) ?? '',
      ),
    );

/** The site's COMPILED stylesheet, as the dev server injected it into this
 *  document for the `globals.css` import at the top of this file — the
 *  sheet a racing load receives late (THE LOAD RACE test). */
const compiledSheet = (): string => {
  const style = Array.from(document.querySelectorAll('style')).find((element) =>
    (element.getAttribute('data-vite-dev-id') ?? '').endsWith(
      '/styles/globals.css',
    ),
  );
  if (!style?.textContent) {
    throw new Error('no compiled globals.css in this document to copy');
  }
  return style.textContent;
};

/** The box of a link's TEXT — its label's run, where the link's own box
 *  carries 8px of padding a side (Header.step.test.tsx's `textBox`). */
const textOf = (word: Element): DOMRect => {
  const node = Array.from(word.childNodes).find(
    (child) => child.nodeType === Node.TEXT_NODE,
  );
  if (!node) throw new Error('the word has no text');
  const range = document.createRange();
  range.selectNodeContents(node);
  return range.getBoundingClientRect();
};

/** The ui/Card behind an open list — the backdrop the wrapper's one-cell grid
 *  stretches (NavDropdown.tsx's THE CARD IS A BACKDROP). */
const cardBoxOf = (wrapper: Element): HTMLElement => {
  const card = wrapper.querySelector<HTMLElement>(':scope > .grid > div');
  if (!card) throw new Error('the dropdown has no ui/Card backdrop');
  return card;
};

/** The face the words are really set in — Source Serif 4, the declaration
 *  Header.step.test.tsx injects, verbatim apart from the stillness this file
 *  already has. */
const SERIF = 'Source Serif 4 SB';

/** THE REAL FACE for a describe that measures a word: a fallback serif sets
 *  other widths, and the words' widths decide where the pointer's base and
 *  the arrow stand. `load()` rejects on a 404 — loudly, never a silent
 *  fallback. Called once, at the top of the describe. */
const withRealFace = (): void => {
  let face: HTMLStyleElement | null = null;
  beforeAll(async () => {
    face = document.createElement('style');
    face.textContent = `
@font-face {
  font-family: '${SERIF}';
  src: url('/src/fonts/SourceSerif4Variable-subset.woff2') format('woff2');
  font-weight: 200 900;
  font-style: normal;
  font-display: block;
}
:root { --font-source-serif: '${SERIF}'; }`;
    document.head.append(face);
    await document.fonts.load(`500 1rem "${SERIF}"`);
    await document.fonts.ready;
  });
  afterAll(() => {
    face?.remove();
    face = null;
  });
};

/**
 * THE FRAME NEVER LEAVES — a net under every click of this file. Since
 * 2026-10-26 Servicii and Echipa are LINKS that go to their pages once their
 * lists are open (NavAccordion.tsx's THE ROW IS A LINK THAT OPENS ITS LIST
 * FIRST), and @vitest/browser guards no link: a test frame that navigates
 * fails the WHOLE file ("Cannot connect to the iframe", its orchestrator's
 * words) instead of one assertion. Every click a test means the browser to
 * follow is recorded on <body> and held back there (the phone describe's
 * `whileRecording`, the desktop tests' own recorders); this listener sits on
 * the DOCUMENT — after every <body> listener, so it changes nothing a test
 * reads — and holds back whatever a regression lets through. Called ONCE, at
 * file scope, right below: every test of the file runs over it.
 */
const holdTheFrame = (): void => {
  const stay = (event: MouseEvent): void => {
    if (event.target instanceof Element && event.target.closest('a[href]')) {
      event.preventDefault();
    }
  };
  beforeEach(() => {
    document.addEventListener('click', stay);
  });
  afterEach(() => {
    document.removeEventListener('click', stay);
  });
};
holdTheFrame();

describe('the dropdowns in the STATIC HTML (§16 rule 2)', () => {
  it('prints both cards CLOSED with every link, and Acasă and Blog bare', () => {
    // What the server writes before any script runs: crawlable links in
    // every card, every card closed — `data-state="closed"` and `inert` —
    // so the first client render agrees and hydration is quiet.
    const html = renderToString(<Mounted locale="ro" />);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const row = doc.querySelector(
      `nav[aria-label="${ro.common.nav.ariaLabel}"]`,
    );
    if (!row) throw new Error('the static HTML has no bar row');

    const words = Array.from(row.querySelectorAll(':scope > ul > li'));
    expect(
      words.map((li) => li.querySelector(':scope > a')?.textContent),
    ).toEqual([
      ro.common.nav.home,
      ro.common.nav.services,
      ro.common.nav.team,
      ro.common.nav.blog,
    ]);
    // Acasă and Blog: a word and nothing else ("blog and home should not
    // have this").
    for (const li of [words[0], words[3]]) {
      expect(li.querySelector('button')).toBeNull();
      expect(li.querySelector('[data-state]')).toBeNull();
      expect(li.hasAttribute('data-nav-dropdown')).toBe(false);
      // No arrow: nothing drops down from them.
      expect(li.querySelector('svg')).toBeNull();
    }

    const cards: Array<[string, string[]]> = [
      ['/services', servicesHrefs('ro')],
      ['/team', teamHrefs('ro')],
    ];
    for (const [path, hrefs] of cards) {
      const li = row.querySelector(`[data-nav-dropdown="${path}"]`);
      const button = li?.querySelector(':scope > button');
      const card = button
        ? doc.getElementById(button.getAttribute('aria-controls') ?? '')
        : null;
      expect(card, path).not.toBeNull();
      expect(card?.getAttribute('data-state')).toBe('closed');
      expect(card?.hasAttribute('inert')).toBe(true);
      expect(button?.getAttribute('aria-expanded')).toBe('false');
      // THE POINTER is drawn only while a card is open — so never here — and
      // the word is printed without THE HELD LOOK.
      expect(li?.querySelector(':scope > svg'), path).toBeNull();
      const word = li?.querySelector(':scope > a');
      expect(word && wearsHeld(word), path).toBe(false);
      // THE ARROW is printed with the word, inside its link — decoration, so
      // the link's text is its label alone (checked above) — and its rest
      // turn, DOWN, is printed ON THE ARROW ITSELF, an inline style: the
      // first style computation points it down, stylesheet or not
      // (NavDropdown.tsx's THE LOAD RACE). No class sets anything a
      // transition watches. The ⌄ beside the word draws nothing of its own.
      const arrow = word?.querySelector(':scope > svg');
      expect(arrow, path).not.toBeNull();
      expect(arrow?.getAttribute('aria-hidden'), path).toBe('true');
      expect(arrow?.getAttribute('style'), path).toBe('rotate:90deg');
      expect(onTheTransitionList(arrow?.getAttribute('class')), path).toEqual(
        [],
      );
      expect(button?.childElementCount, path).toBe(0);
      expect(
        Array.from(card?.querySelectorAll('a') ?? [], (a) =>
          a.getAttribute('href'),
        ),
      ).toEqual(hrefs);
    }
    // Two the owner named, spelled out: the price card and the doctor card.
    expect(html).toContain('href="/ro/services/#prophylaxis"');
    expect(html).toContain('href="/ro/team/#toma-lucian"');
    // Seventeen entries in all, none of them current.
    expect(row.querySelectorAll('[data-state] a')).toHaveLength(17);
    expect(row.querySelectorAll('[data-state] [aria-current]')).toHaveLength(0);
  });

  it.each(locales)(
    '%s: the entries are the page’s own sections, in the visitor’s language',
    (locale) => {
      const ui = mountRow(locale);
      const labels = (path: string) =>
        ui.entries(path).map((a) => [a.textContent, a.getAttribute('href')]);
      expect(labels('/services')).toEqual(
        priceCategories.map((category, i) => [
          category.name[locale],
          servicesHrefs(locale)[i],
        ]),
      );
      expect(labels('/team')).toEqual(
        doctors.map((doctor, i) => [
          doctor.words[locale].name,
          teamHrefs(locale)[i],
        ]),
      );
      // The ⌄'s name: `common.nav.submenu` with the word in it.
      expect(ui.toggle('/services')).toHaveAccessibleName(
        MESSAGES[locale].common.nav.submenu.replace(
          '{label}',
          MESSAGES[locale].common.nav.services,
        ),
      );
    },
  );
});

describe('desktop — the row, at a laptop’s width', () => {
  beforeAll(async () => {
    await browser.viewport(1536, 900);
    // The REAL pointer away from the bar before the fake-clock tests: a
    // layout change under a resting cursor re-delivers pointerover, which
    // would start a visit (and cancel a grace) no test asked for.
    await parkPointer();
  });

  it('keeps the row as wide as it was: the words centred, nothing new taking inline space', () => {
    const ui = mountRow();
    const header = ui.row.closest('header') as HTMLElement;
    const words = Array.from(
      ui.row.querySelectorAll<HTMLElement>(':scope > ul > li > a'),
    );
    expect(words).toHaveLength(4);
    // The row is the four words and the three 8px gaps between them — the
    // ⌄s and the cards are absolutely placed.
    const sum = words.reduce((w, a) => w + a.getBoundingClientRect().width, 0);
    expect(ui.row.getBoundingClientRect().width).toBeCloseTo(sum + 3 * 8, 1);
    // Every item as tall as the row, every word on the row's centre line.
    const bar = header.firstElementChild as HTMLElement;
    const b = bar.getBoundingClientRect();
    for (const a of words) {
      const li = a.parentElement as HTMLElement;
      expect(li.getBoundingClientRect().height).toBeCloseTo(b.height, 1);
      const r = a.getBoundingClientRect();
      expect(r.top + r.height / 2).toBeCloseTo(b.top + b.height / 2, 1);
    }
    for (const path of ['/services', '/team']) {
      expect(getComputedStyle(ui.toggle(path)).position).toBe('absolute');
      expect(getComputedStyle(ui.card(path)).position).toBe('absolute');
      // The word's arrow too: inside the link, out of its flow.
      expect(getComputedStyle(arrowOf(ui.word(path))).position).toBe(
        'absolute',
      );
    }
  });

  it('keeps a closed card unreachable: inert, invisible, and no link in the accessibility tree', () => {
    const ui = mountRow();
    for (const path of ['/services', '/team']) {
      expect(ui.isOpen(path)).toBe(false);
      expect(ui.card(path)).toHaveAttribute('inert');
      expect(getComputedStyle(ui.card(path)).visibility).toBe('hidden');
    }
    // A visitor's tools see the four words and nothing else.
    expect(within(ui.row).getAllByRole('link')).toHaveLength(4);
    // `role="list"` on each card's list: `list-style: none` costs a list
    // its semantics in Safari's VoiceOver otherwise.
    for (const path of ['/services', '/team']) {
      expect(ui.card(path).querySelector('ul')).toHaveAttribute('role', 'list');
    }
  });

  it('draws nothing of the ⌄ and lets the mouse through it at rest — the arrow is the word’s', () => {
    // NavDropdown.tsx's THE TOGGLE since 2026-10-16: the one arrow on screen
    // is the WORD's, so the ⌄ paints nothing — no glyph, no ground, no frame,
    // no ring until a keyboard focus — and a mouse over it is on the word.
    const ui = mountRow();
    for (const path of ['/services', '/team']) {
      const toggle = ui.toggle(path);
      expect(toggle.childElementCount).toBe(0);
      expect(toggle.textContent).toBe('');
      const style = getComputedStyle(toggle);
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(style.borderTopWidth).toBe('0px');
      expect(style.outlineStyle).toBe('none');
      expect(style.pointerEvents).toBe('none');
      // Still a real, named button in the Tab order — the keyboard's.
      expect(ui.toggle(path).tagName).toBe('BUTTON');
      expect(ui.toggle(path)).toHaveAttribute('type', 'button');
      expect(ui.toggle(path).tabIndex).toBe(0);
      // SC 2.5.8's 24px floor, and Apple's height.
      const r = ui.toggle(path).getBoundingClientRect();
      expect(r.width).toBeGreaterThanOrEqual(24);
      expect(r.height).toBeGreaterThanOrEqual(44);
    }
  });

  describe('the mouse — the clocks, on a fake timer', () => {
    it(`opens a card only once the pointer has rested ${HOVER_INTENT_MS}ms on its word`, async () => {
      const mouse = fakeMouse();
      const ui = mountRow();
      mouse.hover(ui.word('/services'));
      elapse(HOVER_INTENT_MS - 1);
      expect(ui.isOpen('/services')).toBe(false);
      elapse(1);
      expect(ui.isOpen('/services')).toBe(true);
      expect(ui.toggle('/services')).toHaveAttribute('aria-expanded', 'true');
      expect(ui.isOpen('/team')).toBe(false);
      // Open by the MOUSE, the ⌄ stays click-through: the mouse over the
      // arrow is still on the word.
      expect(getComputedStyle(ui.toggle('/services')).pointerEvents).toBe(
        'none',
      );
      // Open, the card is reachable and drawn.
      expect(ui.card('/services')).not.toHaveAttribute('inert');
      expect(getComputedStyle(ui.card('/services')).visibility).toBe('visible');
    });

    it('opens nothing for a pointer only passing over the word', async () => {
      const mouse = fakeMouse();
      const ui = mountRow();
      mouse.hover(ui.word('/services'));
      elapse(HOVER_INTENT_MS / 2);
      mouse.hover(pageMain);
      elapse(1000);
      expect(ui.isOpen('/services')).toBe(false);
    });

    it('opens nothing for a pointer that never MOVED on the word (a layout change under a resting cursor)', () => {
      vi.useFakeTimers();
      const ui = mountRow();
      // Chromium re-delivers pointerover/enter when the layout moves under a
      // resting cursor — with no pointermove. The hook arms on the move.
      ui.word('/services').dispatchEvent(
        new PointerEvent('pointerover', {
          bubbles: true,
          pointerType: 'mouse',
        }),
      );
      elapse(1000);
      expect(ui.isOpen('/services')).toBe(false);
    });

    it(`closes ${HOVER_GRACE_MS}ms after the pointer leaves, and stays open if it comes back first`, async () => {
      const mouse = fakeMouse();
      const ui = mountRow();
      mouse.hover(ui.word('/services'));
      elapse(HOVER_INTENT_MS);
      expect(ui.isOpen('/services')).toBe(true);

      mouse.hover(pageMain);
      elapse(HOVER_GRACE_MS - 1);
      expect(ui.isOpen('/services')).toBe(true);
      mouse.hover(ui.word('/services'));
      elapse(1000);
      expect(ui.isOpen('/services')).toBe(true);

      mouse.hover(pageMain);
      elapse(HOVER_GRACE_MS);
      expect(ui.isOpen('/services')).toBe(false);
    });

    it('keeps the card open while the pointer travels into it', async () => {
      const mouse = fakeMouse();
      const ui = mountRow();
      mouse.hover(ui.word('/services'));
      elapse(HOVER_INTENT_MS);
      const [first] = ui.entries('/services');
      mouse.hover(first);
      elapse(1000);
      expect(ui.isOpen('/services')).toBe(true);
      mouse.hover(ui.entries('/services').at(-1) as HTMLElement);
      elapse(1000);
      expect(ui.isOpen('/services')).toBe(true);
    });

    it('SWAPS at once from Servicii to Echipa — no intent, one card open', async () => {
      const mouse = fakeMouse();
      const ui = mountRow();
      mouse.hover(ui.word('/services'));
      elapse(HOVER_INTENT_MS);
      mouse.hover(ui.word('/team'));
      // No time has passed.
      expect(ui.isOpen('/team')).toBe(true);
      expect(ui.isOpen('/services')).toBe(false);
      expect(ui.toggle('/services')).toHaveAttribute('aria-expanded', 'false');
      elapse(1000);
      expect(ui.isOpen('/team')).toBe(true);
      expect(ui.isOpen('/services')).toBe(false);
    });

    it('never swaps on another item’s BAND — the open card stays and its grace keeps running', async () => {
      // THE SWAP is the WORD's alone (useNavDropdowns): the card reaches under
      // the neighbouring words, so the bands above and below them are the
      // road INTO the card. A pointer that only crosses Echipa's band leaves
      // Servicii's card where it is and its grace running; one that lingers
      // there lets it close — and then the bar is closed, and a closed bar
      // opens the item under the pointer after the intent, like any other.
      const mouse = fakeMouse();
      const ui = mountRow();
      mouse.hover(ui.word('/services'));
      elapse(HOVER_INTENT_MS);
      // Onto Echipa's ITEM — the <li> itself, not its word.
      mouse.hover(ui.item('/team'));
      expect(ui.isOpen('/services')).toBe(true);
      expect(ui.isOpen('/team')).toBe(false);
      elapse(HOVER_GRACE_MS - 1);
      expect(ui.isOpen('/services')).toBe(true);
      expect(ui.isOpen('/team')).toBe(false);
      elapse(1);
      expect(ui.isOpen('/services')).toBe(false);
      expect(ui.isOpen('/team')).toBe(false);
      mouse.hover(ui.item('/team'));
      elapse(HOVER_INTENT_MS - 1);
      expect(ui.isOpen('/team')).toBe(false);
      elapse(1);
      expect(ui.isOpen('/team')).toBe(true);
    });

    it('swaps at once when the pointer climbs from the band onto the word, and the grace is gone with it', async () => {
      const mouse = fakeMouse();
      const ui = mountRow();
      mouse.hover(ui.word('/services'));
      elapse(HOVER_INTENT_MS);
      mouse.hover(ui.item('/team'));
      elapse(HOVER_GRACE_MS / 2);
      mouse.hover(ui.word('/team'));
      expect(ui.isOpen('/team')).toBe(true);
      expect(ui.isOpen('/services')).toBe(false);
      elapse(1000);
      expect(ui.isOpen('/team')).toBe(true);
    });

    it('takes the ARROW for the word: a move on it opens a closed bar’s card after the intent, and swaps an open one at once', () => {
      // NavDropdown.tsx's THE ARROW: drawn INSIDE the link, so a move on it
      // is a move on the word — THE SWAP's own test (useNavDropdowns: the
      // event's target inside the link) — though its box reaches 8px past
      // the link's, into the row's gap.
      const mouse = fakeMouse();
      const ui = mountRow();
      mouse.hover(arrowOf(ui.word('/services')));
      elapse(HOVER_INTENT_MS - 1);
      expect(ui.isOpen('/services')).toBe(false);
      elapse(1);
      expect(ui.isOpen('/services')).toBe(true);
      mouse.hover(arrowOf(ui.word('/team')));
      // No time has passed: the swap.
      expect(ui.isOpen('/team')).toBe(true);
      expect(ui.isOpen('/services')).toBe(false);
    });

    it('opens nothing over Acasă and Blog, and lets a card close from there', async () => {
      const mouse = fakeMouse();
      const ui = mountRow();
      const [home, , , blog] = Array.from(
        ui.row.querySelectorAll<HTMLElement>(':scope > ul > li > a'),
      );
      mouse.hover(home);
      elapse(1000);
      expect(ui.isOpen('/services')).toBe(false);
      expect(ui.isOpen('/team')).toBe(false);
      mouse.hover(ui.word('/team'));
      elapse(HOVER_INTENT_MS);
      mouse.hover(blog);
      elapse(HOVER_GRACE_MS);
      expect(ui.isOpen('/team')).toBe(false);
    });

    it.each(['touch', 'pen'] as const)(
      'never opens a card for a %s — a tap on the word just navigates',
      (pointerType) => {
        vi.useFakeTimers();
        const ui = mountRow();
        touchLike(ui.word('/services'), pointerType);
        touchLike(ui.word('/team'), pointerType);
        elapse(1000);
        expect(ui.isOpen('/services')).toBe(false);
        expect(ui.isOpen('/team')).toBe(false);
      },
    );

    it('closes at once when an entry is clicked, never prevents the navigation, and stays shut under the resting pointer', async () => {
      const mouse = fakeMouse();
      const ui = mountRow();
      // The navigation is the browser's: this listener records whether
      // anything prevented it — then prevents it itself, so the test page
      // stays. On <body>: AFTER React's handler (at its root, the container
      // RTL renders into) and BEFORE the browser's default action — the
      // runner guards no link of its own (holdTheFrame says what a navigated
      // test frame costs).
      let prevented: boolean | null = null;
      const record = (event: MouseEvent) => {
        prevented = event.defaultPrevented;
        event.preventDefault();
      };
      document.body.addEventListener('click', record);
      try {
        mouse.hover(ui.word('/services'));
        elapse(HOVER_INTENT_MS);
        const prophylaxis = ui
          .entries('/services')
          .find((a) => a.textContent === priceCategories[2].name.ro);
        expect(prophylaxis).toBeDefined();
        mouse.click(prophylaxis as HTMLElement);
        expect(prevented).toBe(false);
        expect(ui.isOpen('/services')).toBe(false);
        // The visit is spent: moving on the word again opens nothing…
        mouse.hover(ui.word('/services'));
        elapse(1000);
        expect(ui.isOpen('/services')).toBe(false);
        // …until the pointer leaves the item and comes back.
        mouse.hover(pageMain);
        mouse.hover(ui.word('/services'));
        elapse(HOVER_INTENT_MS);
        expect(ui.isOpen('/services')).toBe(true);
      } finally {
        document.body.removeEventListener('click', record);
      }
    });

    it('closes on Escape without moving focus, and the resting pointer does not reopen it', async () => {
      const mouse = fakeMouse();
      const ui = mountRow();
      const outside = pageMain.querySelector('a') as HTMLElement;
      outside.focus();
      mouse.hover(ui.word('/team'));
      elapse(HOVER_INTENT_MS);
      expect(ui.isOpen('/team')).toBe(true);
      mouse.keyboard('Escape');
      expect(ui.isOpen('/team')).toBe(false);
      expect(document.activeElement).toBe(outside);
      mouse.hover(ui.word('/team'));
      elapse(1000);
      expect(ui.isOpen('/team')).toBe(false);
    });
  });

  describe('a PENDING intent, and the timers a close leaves', () => {
    it('opens nothing after Escape pressed while the intent is still running', () => {
      const mouse = fakeMouse();
      const ui = mountRow();
      mouse.hover(ui.word('/services'));
      elapse(HOVER_INTENT_MS / 2);
      mouse.keyboard('Escape');
      elapse(1000);
      expect(ui.isOpen('/services')).toBe(false);
      // The visit is spent: the resting pointer moving opens nothing either.
      mouse.hover(ui.word('/services'));
      elapse(1000);
      expect(ui.isOpen('/services')).toBe(false);
    });

    it('opens nothing after a pagehide while the intent is still running', () => {
      const mouse = fakeMouse();
      const ui = mountRow();
      mouse.hover(ui.word('/team'));
      elapse(HOVER_INTENT_MS / 2);
      act(() => {
        window.dispatchEvent(
          new PageTransitionEvent('pagehide', { persisted: true }),
        );
      });
      elapse(1000);
      expect(ui.isOpen('/team')).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('closes on a KEYBOARD activation (Enter) of an entry and leaves no timer running', () => {
      const mouse = fakeMouse();
      const ui = mountRow();
      const record = (event: MouseEvent) => event.preventDefault();
      document.body.addEventListener('click', record);
      try {
        mouse.hover(ui.word('/services'));
        elapse(HOVER_INTENT_MS);
        // The pointer leaves: the grace is now a pending timer.
        mouse.hover(pageMain);
        expect(vi.getTimerCount()).toBe(1);
        const entry = ui.entries('/services')[4];
        entry.focus();
        // Enter on a link: its keydown, then a click of button 0 with no
        // pointer behind it (detail 0) — a plain activation.
        fireEvent.keyDown(entry, { key: 'Enter' });
        fireEvent.click(entry, { button: 0, detail: 0 });
        expect(ui.isOpen('/services')).toBe(false);
        expect(vi.getTimerCount()).toBe(0);
      } finally {
        document.body.removeEventListener('click', record);
      }
    });
  });

  // The three tests below move the WINDOW; each puts it back in a `finally`,
  // so a failure cannot leave the rest of the file at another width.

  it('closes when the window’s WIDTH changes — the row may cross the bar’s step — and not on a height-only resize', async () => {
    try {
      const ui = mountRow();
      act(() => {
        ui.toggle('/services').click();
      });
      expect(ui.isOpen('/services')).toBe(true);
      // A mobile URL bar, a docked panel, a full-page screenshot: the height
      // alone moves, the step cannot have been crossed.
      await browser.viewport(1536, 700);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      expect(ui.isOpen('/services')).toBe(true);
      await browser.viewport(1400, 700);
      await expect
        .poll(() => ui.isOpen('/services'), { timeout: 2000 })
        .toBe(false);
    } finally {
      await browser.viewport(1536, 900);
    }
  });

  it('hands focus INSIDE a card to its ⌄ when a width change closes it, the row still drawn', async () => {
    try {
      const ui = mountRow();
      act(() => {
        ui.toggle('/team').click();
      });
      const entry = ui.entries('/team')[2];
      entry.focus();
      expect(document.activeElement).toBe(entry);
      await browser.viewport(1400, 900);
      await expect
        .poll(() => ui.isOpen('/team'), { timeout: 2000 })
        .toBe(false);
      // 1400 is past the bar's step: the row, and the ⌄, are still drawn.
      expect(ui.toggle('/team').offsetParent).not.toBeNull();
      expect(document.activeElement).toBe(ui.toggle('/team'));
    } finally {
      await browser.viewport(1536, 900);
    }
  });

  it.each(['an entry of the card', 'the ⌄ itself'] as const)(
    'hands focus on %s to the BURGER when a width change under the bar’s step closes a pinned card — never <body>',
    async (where) => {
      // Under the step the row — word, ⌄ and card — is `display: none`, and
      // the burger is drawn in its place (NavMenu's `@min-[62rem]:hidden`,
      // the other half of the breakpoint), the way into the same links. A
      // focus left on the hidden row would fall to <body> (the React
      // review, 2026-10-16). On the ⌄ is where Enter leaves it.
      try {
        const ui = mountRow();
        act(() => {
          ui.toggle('/team').click();
        });
        expect(ui.toggle('/team')).toHaveAttribute('data-pinned');
        const target =
          where === 'the ⌄ itself'
            ? ui.toggle('/team')
            : ui.entries('/team')[2];
        target.focus();
        expect(document.activeElement).toBe(target);
        await browser.viewport(1100, 900);
        await expect
          .poll(() => ui.isOpen('/team'), { timeout: 2000 })
          .toBe(false);
        // The premises: 1100 is under the bar's step — the ⌄ not drawn,
        // the burger drawn.
        const burger = document.querySelector<HTMLButtonElement>(
          `button[aria-controls="${PANEL_ID}"]`,
        ) as HTMLButtonElement;
        expect(ui.toggle('/team').offsetParent).toBeNull();
        expect(burger.offsetParent).not.toBeNull();
        // Focus on the burger — never left on the hidden row, never <body>.
        expect(document.activeElement).toBe(burger);
        // …and it stays there once the browser has had its frame.
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(document.activeElement).toBe(burger);
      } finally {
        await browser.viewport(1536, 900);
      }
    },
  );

  it('closes SYNCHRONOUSLY on pagehide — the back/forward cache freezes a closed card', () => {
    const ui = mountRow();
    act(() => {
      ui.toggle('/services').click();
    });
    expect(ui.isOpen('/services')).toBe(true);
    act(() => {
      window.dispatchEvent(
        new PageTransitionEvent('pagehide', { persisted: true }),
      );
      // Read INSIDE act, before it flushes anything of its own: only a
      // flushSync close is already in the DOM here (Header.test.tsx's
      // pagehide test argues the same reading).
      expect(ui.isOpen('/services')).toBe(false);
      expect(ui.card('/services')).toHaveAttribute('inert');
    });
  });

  it('closes on a back/forward-cache restore', () => {
    const ui = mountRow();
    act(() => {
      ui.toggle('/team').click();
    });
    act(() => {
      window.dispatchEvent(
        new PageTransitionEvent('pageshow', { persisted: true }),
      );
    });
    expect(ui.isOpen('/team')).toBe(false);
  });

  it('closes a PINNED card on a press outside the row, and not on one inside it', () => {
    const ui = mountRow();
    act(() => {
      ui.toggle('/services').click();
    });
    act(() => {
      ui.entries('/services')[0].dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true }),
      );
    });
    expect(ui.isOpen('/services')).toBe(true);
    act(() => {
      pageMain.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true }),
      );
    });
    expect(ui.isOpen('/services')).toBe(false);
  });

  it('closes a PINNED card when the ⌄ is pressed again', () => {
    const ui = mountRow();
    act(() => {
      ui.toggle('/team').click();
    });
    expect(ui.isOpen('/team')).toBe(true);
    act(() => {
      ui.toggle('/team').click();
    });
    expect(ui.isOpen('/team')).toBe(false);
  });

  it('moves focus from INSIDE the card to the ⌄ when the ⌄ closes it — Safari and Firefox never focus a clicked button', () => {
    const ui = mountRow();
    act(() => {
      ui.toggle('/services').click();
    });
    const entry = ui.entries('/services')[1];
    entry.focus();
    // A programmatic click moves no focus — the Mac engines' own manner.
    act(() => {
      ui.toggle('/services').click();
    });
    expect(ui.isOpen('/services')).toBe(false);
    expect(document.activeElement).toBe(ui.toggle('/services'));
  });

  it('paints the OPEN card above a closing one — one step above the row', () => {
    const ui = mountRow();
    act(() => {
      ui.toggle('/team').click();
    });
    act(() => {
      ui.toggle('/services').click();
    });
    // Echipa's card, later in the DOM, is closing; Servicii's opening one
    // must still be drawn over it where the two overlap under the row.
    expect(getComputedStyle(ui.card('/services')).zIndex).toBe('1');
    expect(getComputedStyle(ui.card('/team')).zIndex).toBe('auto');
  });

  it.each([
    ['a Ctrl click', { ctrlKey: true }],
    ['a Cmd click', { metaKey: true }],
    ['a Shift click', { shiftKey: true }],
    ['an Alt click', { altKey: true }],
    ['a middle click', { button: 1 }],
  ])(
    'leaves the card OPEN on %s — a new tab, not this page’s navigation',
    (_form, modifiers) => {
      const ui = mountRow();
      const record = (event: MouseEvent) => event.preventDefault();
      document.body.addEventListener('click', record);
      try {
        act(() => {
          ui.toggle('/services').click();
        });
        fireEvent.click(ui.entries('/services')[0], modifiers);
        expect(ui.isOpen('/services')).toBe(true);
        // …and a plain left click still closes it.
        fireEvent.click(ui.entries('/services')[0], { button: 0 });
        expect(ui.isOpen('/services')).toBe(false);
      } finally {
        document.body.removeEventListener('click', record);
      }
    },
  );

  it('types the dropdowns by the sectioned paths alone — a ⌄ for Acasă does not compile', () => {
    expectTypeOf<Parameters<NavDropdowns['toggle']>[0]>().toEqualTypeOf<
      '/services' | '/team'
    >();
    // @ts-expect-error — Acasă carries no dropdown.
    const home: Parameters<NavDropdowns['toggle']>[0] = '/';
    void home;
  });

  it('draws an EMPTY list as the plain word — no ⌄, no card — in the row and in the panel', async () => {
    const sections: NavSectionsByPath = {
      ...navSectionLinks('ro'),
      '/services': [],
    };
    render(
      <NextIntlClientProvider locale="ro" messages={ro}>
        <ContactModalProvider>
          <header>
            <HeaderNav sections={sections} />
            <NavMenu sections={sections} />
          </header>
        </ContactModalProvider>
      </NextIntlClientProvider>,
      atTop(),
    );
    const row = document.querySelector(
      `nav[aria-label="${ro.common.nav.ariaLabel}"]`,
    ) as HTMLElement;
    expect(row.querySelector('[data-nav-dropdown="/services"]')).toBeNull();
    expect(row.querySelector('[data-nav-dropdown="/team"]')).not.toBeNull();
    const words = row.querySelectorAll(':scope > ul > li > a');
    expect(words.length).toBe(4);
    // The plain word carries no arrow — nothing drops down from it — while
    // Echipa's still does.
    expect(words[1].querySelector('svg')).toBeNull();
    expect(words[2].querySelector('svg')).not.toBeNull();
    // The panel: Servicii's row is its plain word again — a link to its
    // page with nothing to open — while Echipa's word is a link that opens
    // its list first (NavAccordion.tsx's THE ROW IS A LINK THAT OPENS ITS
    // LIST FIRST): both links, only one a disclosure.
    await browser.viewport(390, 844);
    try {
      await userEvent.click(
        screen.getByRole('button', { name: ro.common.menu.label }),
      );
      const panel = document.getElementById('header-menu') as HTMLElement;
      const services = within(panel).getByRole('link', {
        name: ro.common.nav.services,
      });
      expect(services).toHaveAttribute('href', '/ro/services/');
      expect(services).not.toHaveAttribute('aria-expanded');
      expect(services).not.toHaveAttribute('aria-controls');
      const team = within(panel).getByRole('link', {
        name: ro.common.nav.team,
      });
      expect(team).toHaveAttribute('href', '/ro/team/');
      expect(team).toHaveAttribute('aria-expanded', 'false');
      expect(team).toHaveAttribute('aria-controls');
    } finally {
      await browser.viewport(1536, 900);
    }
  });

  describe('THE HELD LOOK — the word keeps its hover look while its card is open (owner, 2026-10-16)', () => {
    // "if a dropdown is being clicked or hovered it has to light up lilla and
    // trigger animation and leave it on until card or section unfocus or
    // change. so also while button triggered cards is open, button must
    // behave as if focused" — NavDropdown passes `held={open}` to the word
    // (ui/TextButton's THE HELD LOOK: its active row, aria-current aside).

    it('holds it exactly while a HOVER-opened card is open — into the card and through the grace — and lets go when it closes', () => {
      const mouse = fakeMouse();
      const ui = mountRow();
      expect(wearsHeld(ui.word('/services'))).toBe(false);
      mouse.hover(ui.word('/services'));
      // The intent: no card yet, so no hold (the hover's own look is CSS's).
      elapse(HOVER_INTENT_MS - 1);
      expect(wearsHeld(ui.word('/services'))).toBe(false);
      elapse(1);
      expect(ui.isOpen('/services')).toBe(true);
      expect(wearsHeld(ui.word('/services'))).toBe(true);
      // Down into the card: the pointer has left the word, the look stays.
      mouse.hover(ui.entries('/services')[3]);
      elapse(1000);
      expect(wearsHeld(ui.word('/services'))).toBe(true);
      // Away to the page: held through the grace, released with the card.
      mouse.hover(pageMain);
      elapse(HOVER_GRACE_MS - 1);
      expect(wearsHeld(ui.word('/services'))).toBe(true);
      elapse(1);
      expect(ui.isOpen('/services')).toBe(false);
      expect(wearsHeld(ui.word('/services'))).toBe(false);
      // The look of a selection, nothing said: never aria-current.
      expect(ui.word('/services')).not.toHaveAttribute('aria-current');
      expect(wearsHeld(ui.word('/team'))).toBe(false);
    });

    it('moves with a SWAP: the old word lets go as the new one takes hold', () => {
      const mouse = fakeMouse();
      const ui = mountRow();
      mouse.hover(ui.word('/services'));
      elapse(HOVER_INTENT_MS);
      expect(wearsHeld(ui.word('/services'))).toBe(true);
      mouse.hover(ui.word('/team'));
      expect(ui.isOpen('/team')).toBe(true);
      expect(wearsHeld(ui.word('/team'))).toBe(true);
      expect(wearsHeld(ui.word('/services'))).toBe(false);
    });

    it('holds it while the ⌄ keeps the card PINNED, and lets go when the ⌄ closes it', () => {
      const ui = mountRow();
      act(() => {
        ui.toggle('/team').click();
      });
      expect(ui.isOpen('/team')).toBe(true);
      expect(wearsHeld(ui.word('/team'))).toBe(true);
      expect(wearsHeld(ui.word('/services'))).toBe(false);
      act(() => {
        ui.toggle('/team').click();
      });
      expect(wearsHeld(ui.word('/team'))).toBe(false);
    });

    it('paints it — the --accent label and the full rule — with the pointer parked away, and paints it back', async () => {
      // The REAL pointer away first: a resting pointer is :hover, and the
      // hover's own look would pass for the hold.
      await parkPointer();
      const ui = mountRow();
      const word = ui.word('/services');
      expect(word.matches(':hover')).toBe(false);
      expect(getComputedStyle(word).color).toBe(tokenColour('ink'));
      expect(ruleScaleX(word)).toBe(0);
      act(() => {
        ui.toggle('/services').click();
      });
      expect(word.matches(':hover')).toBe(false);
      expect(getComputedStyle(word).color).toBe(tokenColour('accent'));
      expect(ruleScaleX(word)).toBe(1);
      act(() => {
        ui.toggle('/services').click();
      });
      expect(getComputedStyle(word).color).toBe(tokenColour('ink'));
      expect(ruleScaleX(word)).toBe(0);
    });
  });

  describe('THE POINTER — the small notch on the card’s top edge, its tip under the word (owner, 2026-10-16)', () => {
    // "it's bottom is not drawn and lateral sides are just part of the card …
    // top of triangle still on top bar as if it is on a z higher that the top
    // bar" — and, on the first look: "triangle is too wide … make the
    // traingle way smaller, like in attatched screenshot" (NavDropdown.tsx's
    // THE POINTER: a right-angled tip, base 20px, height 10px).

    it('draws none while a card is closed, one under the open word only, and moves to the new word on a swap', () => {
      const ui = mountRow();
      for (const path of ['/services', '/team']) {
        expect(pointerOf(ui.item(path)), path).toBeNull();
      }
      act(() => {
        ui.toggle('/services').click();
      });
      expect(pointerOf(ui.item('/services'))).not.toBeNull();
      expect(pointerOf(ui.item('/team'))).toBeNull();
      act(() => {
        ui.toggle('/team').click();
      });
      expect(pointerOf(ui.item('/team'))).not.toBeNull();
      expect(pointerOf(ui.item('/services'))).toBeNull();
      act(() => {
        ui.toggle('/team').click();
      });
      expect(pointerOf(ui.item('/team'))).toBeNull();
    });

    it('is a decoration: aria-hidden, click-through, never inside the card’s clip, hidden in forced colours', () => {
      const ui = mountRow();
      act(() => {
        ui.toggle('/services').click();
      });
      const pointer = pointerOf(ui.item('/services')) as SVGSVGElement;
      expect(pointer).toHaveAttribute('aria-hidden', 'true');
      const style = getComputedStyle(pointer);
      expect(style.pointerEvents).toBe('none');
      expect(style.position).toBe('absolute');
      // Above the open card, below the ⌄ (the header's THE POINTER).
      expect(style.zIndex).toBe('2');
      expect(getComputedStyle(ui.card('/services')).zIndex).toBe('1');
      expect(getComputedStyle(ui.toggle('/services')).zIndex).toBe('10');
      // A sibling of the card's wrapper, so its clip-path never cuts it.
      expect(ui.card('/services').contains(pointer)).toBe(false);
      // The class is the contract here, as for reduced motion: this runner
      // cannot ask for forced colours without emulating media for every
      // later file.
      expect((pointer.getAttribute('class') ?? '').split(/\s+/)).toContain(
        'forced-colors:hidden',
      );
    });

    it('stands on the card’s top edge, centred under the word: its base one pixel into the card, its tip just inside the bar’s bottom edge, under the word’s rule', () => {
      const ui = mountRow();
      const rem = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      for (const path of ['/services', '/team']) {
        act(() => {
          ui.toggle(path).click();
        });
        const p = (
          pointerOf(ui.item(path)) as SVGSVGElement
        ).getBoundingClientRect();
        const word = ui.word(path).getBoundingClientRect();
        const item = ui.item(path).getBoundingClientRect();
        const card = cardBoxOf(ui.card(path)).getBoundingClientRect();
        // 1.375rem × 0.6875rem — 22 × 11 at the default root: the 10px notch
        // over the 1px row of the card's border.
        expect(p.width, path).toBeCloseTo(1.375 * rem, 1);
        expect(p.height, path).toBeCloseTo(0.6875 * rem, 1);
        // Centred on the word.
        expect(
          Math.abs(p.left + p.width / 2 - (word.left + word.width / 2)),
          path,
        ).toBeLessThanOrEqual(0.5);
        // Its base on the card's border-box top + its 1px border: the white
        // base covers that border between its two corners.
        expect(Math.abs(p.bottom - (card.top + 1)), path).toBeLessThanOrEqual(
          0.5,
        );
        // The tip: under the word's box (its rule is the box's last 2px),
        // and still inside the bar — one pixel above the row's bottom, the
        // bar's very edge (96 against 97 at 1366 × 768).
        expect(p.top, path).toBeGreaterThan(word.bottom);
        expect(p.top, path).toBeLessThan(item.bottom);
        expect(item.bottom - p.top, path).toBeCloseTo(1, 1);
      }
    });

    it('is a right-angled tip twice as wide as it is tall — base 20px, height 10px — its sides ending in the card’s border row', () => {
      // The owner's screenshot: a small white tip, its base about twice its
      // height. The SIDES are the drawn shape — the fill's bottom unit is the
      // card's own border row, which it covers — so their box is the notch.
      const ui = mountRow();
      act(() => {
        ui.toggle('/services').click();
      });
      const pointer = pointerOf(ui.item('/services')) as SVGSVGElement;
      const [, sides] = Array.from(pointer.querySelectorAll('path'));
      const s = sides.getBoundingClientRect();
      const card = cardBoxOf(ui.card('/services')).getBoundingClientRect();
      expect(s.width).toBeCloseTo(20, 1);
      expect(s.height).toBeCloseTo(10, 1);
      // Base twice the height: the apex a right angle, each side at 45°.
      expect(s.width / s.height).toBeCloseTo(2, 2);
      // The sides end half a pixel into the card's 1px border row, so they
      // rise from where that border stops.
      expect(s.bottom).toBeGreaterThan(card.top);
      expect(s.bottom).toBeLessThan(card.top + 1);
      // Half the 1px stroke inside the svg's box on every side: nothing of
      // it is clipped away at the box's edge.
      const p = pointer.getBoundingClientRect();
      expect(s.left).toBeGreaterThanOrEqual(p.left + 0.5);
      expect(s.right).toBeLessThanOrEqual(p.right - 0.5);
      expect(s.top).toBeGreaterThanOrEqual(p.top + 0.5);
      expect(s.bottom).toBeLessThanOrEqual(p.bottom - 0.5);
    });

    it('is the card’s own paint: the fill its white ground, the two sides its frame colour, and no line along the base', () => {
      const ui = mountRow();
      act(() => {
        ui.toggle('/services').click();
      });
      const pointer = pointerOf(ui.item('/services')) as SVGSVGElement;
      const [fill, sides] = Array.from(pointer.querySelectorAll('path'));
      const card = getComputedStyle(cardBoxOf(ui.card('/services')));
      expect(getComputedStyle(fill).fill).toBe(card.backgroundColor);
      expect(getComputedStyle(sides).stroke).toBe(card.borderTopColor);
      expect(getComputedStyle(sides).fill).toBe('none');
      // One pixel at any size, like the card's own border.
      expect(getComputedStyle(sides).strokeWidth).toBe(card.borderTopWidth);
      expect(sides).toHaveAttribute('vector-effect', 'non-scaling-stroke');
      // An OPEN path — its two sides, never closed back along the base.
      const d = sides.getAttribute('d') ?? '';
      expect(d).not.toMatch(/z/i);
      expect(d.match(/L/g)).toHaveLength(2);
    });

    describe('in all five languages, with the real face', () => {
      // The shortest dropdown word decides how near the card's corner the
      // notch's base comes, so a fallback face would measure the wrong one.
      withRealFace();

      it.each(
        locales.flatMap((locale) =>
          (['/services', '/team'] as const).map(
            (path) => [locale, path] as const,
          ),
        ),
      )(
        '%s %s: its base corners stand on the card’s straight top edge, past the corner curve',
        (locale, path) => {
          const ui = mountRow(locale);
          expect(document.fonts.check(`500 1rem "${SERIF}"`)).toBe(true);
          expect(ui.word(path)).toHaveTextContent(
            path === '/services'
              ? MESSAGES[locale].common.nav.services
              : MESSAGES[locale].common.nav.team,
          );
          act(() => {
            ui.toggle(path).click();
          });
          const p = (
            pointerOf(ui.item(path)) as SVGSVGElement
          ).getBoundingClientRect();
          const backdrop = cardBoxOf(ui.card(path));
          const card = backdrop.getBoundingClientRect();
          const style = getComputedStyle(backdrop);
          const left = p.left - card.left;
          const right = card.right - p.right;
          // A base corner over the curve would stand below the edge it is
          // meant to continue. The notch's left base corner stands half the
          // item's width + 5px in from the card's edge — on this Mac 35.28px
          // for the shortest word, French „Soins", and 59.03px for German
          // „Leistungen" — so every corner is PAST the 16px curve: the whole
          // base on the straight edge, with some 19px to spare for CI's Linux
          // Chromium, which advances every glyph by whole pixels (CLAUDE.md
          // §15.39's first CI run: „Soins" up to 1.6px narrower there).
          expect(
            left,
            `${left}px in from the left — past the corner`,
          ).toBeGreaterThanOrEqual(parseFloat(style.borderTopLeftRadius));
          expect(
            right,
            `${right}px in from the right — past the corner`,
          ).toBeGreaterThanOrEqual(parseFloat(style.borderTopRightRadius));
        },
      );
    });
  });

  describe('THE ARROW — a ⌄ inside each dropdown word, hinting at its card (owner, 2026-10-16)', () => {
    // "place an svg on the right side of thext with an arrow pointing
    // downwards. hinting it is a dropdown menu" (NavDropdown.tsx's THE
    // ARROW): the ChevronRight glyph at its `sm` size, drawn INSIDE the
    // word's link through NavItem's `trailing` slot, absolutely placed.

    it.each(locales)(
      '%s: draws it after Servicii and Echipa — inside the link, aria-hidden, pointing down — and after neither Acasă nor Blog, the links still named by their words',
      (locale) => {
        const ui = mountRow(locale);
        const words = Array.from(
          ui.row.querySelectorAll<HTMLElement>(':scope > ul > li > a'),
        );
        const { nav } = MESSAGES[locale].common;
        // Acasă and Blog: no arrow — nothing drops down from them.
        expect(words[0].querySelector('svg')).toBeNull();
        expect(words[3].querySelector('svg')).toBeNull();
        for (const [path, label] of [
          ['/services', nav.services],
          ['/team', nav.team],
        ] as const) {
          const word = ui.word(path);
          const arrow = arrowOf(word);
          // Exactly one, the link's own decoration: aria-hidden, so the link
          // is still named by its word alone — never „Servicii, arrow".
          expect(word.querySelectorAll('svg'), path).toHaveLength(1);
          expect(arrow).toHaveAttribute('aria-hidden', 'true');
          expect(word).toHaveAccessibleName(label);
          expect(word.textContent).toBe(label);
          expect(within(ui.row).getByRole('link', { name: label })).toBe(word);
          // Pointing DOWN at rest — the glyph points right, turned 90° by its
          // own inline style (THE LOAD RACE), never by a class.
          expect(getComputedStyle(arrow).rotate, path).toBe('90deg');
          expect(arrow.style.rotate, path).toBe('90deg');
          expect(
            onTheTransitionList(arrow.getAttribute('class')),
            path,
          ).toEqual([]);
          // The ⌄ beside the word draws none of its own: one arrow, never two.
          expect(ui.toggle(path).querySelector('svg'), path).toBeNull();
        }
      },
    );

    it('points UP while the card is open — opened by the hover or by the ⌄ — and down again once it closes', () => {
      const mouse = fakeMouse();
      const ui = mountRow();
      const arrow = arrowOf(ui.word('/services'));
      expect(getComputedStyle(arrow).rotate).toBe('90deg');
      mouse.hover(ui.word('/services'));
      elapse(HOVER_INTENT_MS);
      expect(ui.isOpen('/services')).toBe(true);
      expect(getComputedStyle(arrow).rotate).toBe('-90deg');
      // Only the open word's arrow turns.
      expect(getComputedStyle(arrowOf(ui.word('/team'))).rotate).toBe('90deg');
      // A swap turns this one back and the next one up.
      mouse.hover(ui.word('/team'));
      expect(getComputedStyle(arrow).rotate).toBe('90deg');
      expect(getComputedStyle(arrowOf(ui.word('/team'))).rotate).toBe('-90deg');
      mouse.hover(pageMain);
      elapse(HOVER_GRACE_MS);
      expect(getComputedStyle(arrowOf(ui.word('/team'))).rotate).toBe('90deg');
      // PINNED by the ⌄ — the keyboard's way in — it turns up just the same.
      act(() => {
        ui.toggle('/services').click();
      });
      expect(getComputedStyle(arrow).rotate).toBe('-90deg');
      // The turn is the inline style React switches — the one change the
      // transition is for.
      expect(arrow.style.rotate).toBe('-90deg');
      act(() => {
        ui.toggle('/services').click();
      });
      expect(getComputedStyle(arrow).rotate).toBe('90deg');
      expect(arrow.style.rotate).toBe('90deg');
    });

    it('turns and slides NOTHING while the stylesheet arrives late — THE LOAD RACE the built page showed', () => {
      // The planner's e2e on the built export (2026-10-16): an arrow read
      // 81.7476deg where 90deg was due, and on about one load in three both
      // arrows turned on their own — 0° → 17° → 55° → 70° → 82° → 88° → 90°
      // over ~300ms — whenever a style computation ran before the stylesheet
      // applied. Replayed here in a frame of its own, as a racing load has
      // it: the SERVER's HTML with no stylesheet; a style read (a script's,
      // a probe's); THEN the compiled sheet. With the round-3 classes this
      // started TWO transitions on each arrow, `rotate` and `translate`
      // (61.16° and −34 % of the −50 % centring 100ms in); now none may start.
      const html = renderToString(<Mounted locale="ro" />);
      const frame = document.createElement('iframe');
      // Wide enough for the bar's row: a hidden row would start no
      // transition at all, and the test would pass for nothing.
      frame.style.cssText = 'width: 1536px; height: 600px; border: 0';
      document.body.append(frame);
      try {
        const win = frame.contentWindow as Window;
        const doc = frame.contentDocument as Document;
        doc.open();
        doc.write(
          `<!doctype html><html lang="ro"><head></head><body>${html}</body></html>`,
        );
        doc.close();
        const arrows = Array.from(
          doc.querySelectorAll<SVGSVGElement>('[data-nav-dropdown] > a > svg'),
        );
        expect(arrows).toHaveLength(2);
        // THE WINDOW BEFORE THE SHEET: a style read — and the arrow already
        // points down, its turn in the HTML itself.
        for (const arrow of arrows) {
          expect(win.getComputedStyle(arrow).rotate).toBe('90deg');
          expect(win.getComputedStyle(arrow).transitionDuration).toBe('0s');
        }
        // THE SHEET ARRIVES.
        const sheet = doc.createElement('style');
        sheet.textContent = compiledSheet();
        doc.head.append(sheet);
        // The premises, so nothing passes for nothing: the sheet applied
        // (the arrow's 300ms turn is live), the row is drawn, and motion is
        // not reduced — a transition COULD start.
        const nav = doc.querySelector('header nav') as HTMLElement;
        expect(win.getComputedStyle(nav).display).toBe('flex');
        expect(win.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(
          false,
        );
        for (const arrow of arrows) {
          const style = win.getComputedStyle(arrow);
          expect(style.transitionProperty).toContain('rotate');
          expect(style.transitionDuration).toContain('0.3s');
          // …and none did: the arrow at rest, down, nothing moving on it.
          expect(style.rotate).toBe('90deg');
          expect(style.translate).toBe('none');
          expect(
            arrow
              .getAnimations()
              .map(
                (animation) => (animation as CSSTransition).transitionProperty,
              ),
          ).toEqual([]);
        }
      } finally {
        frame.remove();
      }
    });

    describe('in all five languages, with the real face', () => {
      // Where the arrow stands is read off the TEXT's end, and the text is
      // the face's width.
      withRealFace();

      it.each(
        locales.flatMap((locale) =>
          (['/services', '/team'] as const).map(
            (path) => [locale, path] as const,
          ),
        ),
      )(
        '%s %s: stands 4px after the text, clear of the next word’s box, on the word’s centre line — and takes no width',
        (locale, path) => {
          const ui = mountRow(locale);
          expect(document.fonts.check(`500 1rem "${SERIF}"`)).toBe(true);
          const word = ui.word(path);
          const arrow = arrowOf(word);
          // The next word — Echipa after Servicii, Blog after Echipa.
          const next = (
            ui.item(path).nextElementSibling as HTMLElement
          ).querySelector(':scope > a') as HTMLElement;
          const text = textOf(word);
          const box = arrow.getBoundingClientRect();
          const chevron = chevronOf(word);
          const w = word.getBoundingClientRect();
          const n = next.getBoundingClientRect();

          // The 16px glyph box: from the TEXT's end (the link's 8px right
          // padding back from its edge) to where the next word's box begins
          // (the row's 8px gap past the link).
          expect(box.width).toBeCloseTo(16, 1);
          expect(Math.abs(box.left - text.right)).toBeLessThanOrEqual(0.5);
          expect(Math.abs(n.left - box.right)).toBeLessThanOrEqual(0.5);
          // The chevron drawn in it, turned down: 8 × 4, 4px after the text
          // (its stroke's ink a 1.33px line round that), clear of the next
          // word's box and some 12px before the next word's text — its own
          // word's, never the neighbour's.
          expect(chevron.width).toBeCloseTo(8, 1);
          expect(chevron.height).toBeCloseTo(4, 1);
          const after = chevron.left - text.right;
          expect(after, `${after}px after the text`).toBeGreaterThanOrEqual(3);
          expect(after, `${after}px after the text`).toBeLessThanOrEqual(5);
          expect(n.left - chevron.right).toBeGreaterThanOrEqual(3);
          expect(textOf(next).left - chevron.right).toBeGreaterThanOrEqual(10);
          // On the word's own centre line.
          expect(
            Math.abs(chevron.top + chevron.height / 2 - (w.top + w.height / 2)),
          ).toBeLessThanOrEqual(0.5);
          // NO WIDTH TAKEN: the link is its text and its 8px a side, and it
          // is exactly as wide with the arrow taken out of the layout.
          expect(w.width).toBeCloseTo(text.width + 16, 1);
          arrow.style.display = 'none';
          const without = word.getBoundingClientRect().width;
          arrow.style.display = '';
          expect(without).toBe(w.width);
        },
      );
    });

    describe('a real pointer — the arrow is part of the word', () => {
      afterEach(async () => {
        await parkPointer();
      });

      it('wears the word’s ink — the body’s at rest, the lavender while the card is open and under the pointer — and its hover is the word’s', async () => {
        await parkPointer();
        const ui = mountRow();
        const word = ui.word('/services');
        const arrow = arrowOf(word);
        // At rest: the body's ink, the word's own.
        expect(word.matches(':hover')).toBe(false);
        expect(getComputedStyle(arrow).color).toBe(tokenColour('ink'));
        expect(getComputedStyle(arrow).color).toBe(
          getComputedStyle(word).color,
        );
        // THE HELD LOOK: lavender with its word while the card is open.
        act(() => {
          ui.toggle('/services').click();
        });
        expect(getComputedStyle(arrow).color).toBe(tokenColour('accent'));
        expect(getComputedStyle(arrow).color).toBe(
          getComputedStyle(word).color,
        );
        act(() => {
          ui.toggle('/services').click();
        });
        expect(getComputedStyle(arrow).color).toBe(tokenColour('ink'));
        // The REAL pointer on the arrow: it is the WORD that is hovered —
        // the ⌄ over the arrow lets the pointer through — and both go
        // lavender.
        await realUser.hover(arrow);
        expect(word.matches(':hover')).toBe(true);
        expect(ui.toggle('/services').matches(':hover')).toBe(false);
        expect(getComputedStyle(arrow).color).toBe(tokenColour('accent'));
        expect(getComputedStyle(arrow).color).toBe(
          getComputedStyle(word).color,
        );
      });

      it('follows the word’s link on a click — never the ⌄’s toggle', async () => {
        await parkPointer();
        const ui = mountRow();
        const word = ui.word('/services');
        const arrow = arrowOf(word);
        // At the chevron's centre, the hit test lands on the arrow — inside
        // the word — not on the ⌄ laid over it.
        const c = chevronOf(word);
        const hit = document.elementFromPoint(
          c.left + c.width / 2,
          c.top + c.height / 2,
        );
        expect(hit && word.contains(hit)).toBe(true);
        // The navigation is the browser's: this listener records which link
        // the click would follow and whether anything prevented it — then
        // prevents it itself, so the test page stays (the entry test's
        // listener, on <body>: after React, before the browser's default
        // action — the runner guards no link, holdTheFrame).
        let followed: string | null = null;
        let prevented: boolean | null = null;
        const record = (event: MouseEvent) => {
          const link =
            event.target instanceof Element ? event.target.closest('a') : null;
          followed = link?.getAttribute('href') ?? null;
          prevented = event.defaultPrevented;
          event.preventDefault();
        };
        document.body.addEventListener('click', record);
        try {
          await realUser.click(arrow);
          expect(followed).toBe('/ro/services/');
          expect(prevented).toBe(false);
          // The ⌄ never took the click: no card PINNED by it.
          expect(ui.toggle('/services')).not.toHaveAttribute('data-pinned');
        } finally {
          document.body.removeEventListener('click', record);
        }
      });
    });
  });

  describe('the keyboard — Apple’s ⌄ (a real keyboard: only a trusted key makes :focus-visible)', () => {
    /** Focus the bar's first stop, the logo, then Tab with the REAL keyboard
     *  until `target` holds focus — never more than the bar's stops. */
    const tabTo = async (target: Element) => {
      const header = document.querySelector('header') as HTMLElement;
      (header.querySelector('a') as HTMLElement).focus();
      for (let i = 0; i < 8 && document.activeElement !== target; i += 1) {
        await realUser.tab();
      }
      expect(document.activeElement).toBe(target);
    };

    afterEach(async () => {
      await parkPointer();
    });

    it('reaches the word, then its ⌄ — whose ring surrounds the word’s arrow', async () => {
      const ui = mountRow();
      await tabTo(ui.word('/services'));
      // The word holds a keyboard focus inside the item: the ⌄ takes the
      // pointer there too, so the arrow under it is the ⌄'s to a click.
      expect(getComputedStyle(ui.toggle('/services')).pointerEvents).toBe(
        'auto',
      );
      // …and only that item's: Echipa's stays click-through.
      expect(getComputedStyle(ui.toggle('/team')).pointerEvents).toBe('none');
      await realUser.tab();
      const toggle = ui.toggle('/services');
      expect(document.activeElement).toBe(toggle);
      expect(toggle.matches(':focus-visible')).toBe(true);
      const style = getComputedStyle(toggle);
      expect(style.pointerEvents).toBe('auto');
      // The ring: the menu buttons' 2px of --focus, drawn ON the box's edge —
      // at their 2px offset it ran 4px into both neighbouring words
      // (NavDropdown.tsx's THE TOGGLE paragraph).
      expect(style.outlineStyle).toBe('solid');
      expect(style.outlineWidth).toBe('2px');
      // 2px INSIDE its box, whose sides stand in the two words' paddings: the
      // ring never reaches either word's text.
      expect(style.outlineOffset).toBe('-2px');
      // The ring SURROUNDS the arrow: the chevron stands inside the ring's
      // band, 2px in from every side of the ⌄'s box — the one arrow on
      // screen, the word's, while the ⌄ draws none of its own.
      expect(toggle.querySelector('svg')).toBeNull();
      const t = toggle.getBoundingClientRect();
      const c = chevronOf(ui.word('/services'));
      expect(c.left).toBeGreaterThanOrEqual(t.left + 2);
      expect(c.right).toBeLessThanOrEqual(t.right - 2);
      expect(c.top).toBeGreaterThanOrEqual(t.top + 2);
      expect(c.bottom).toBeLessThanOrEqual(t.bottom - 2);
    });

    it('opens PINNED on Enter, walks into the entries on Tab, and Escape returns focus to the ⌄', async () => {
      const ui = mountRow();
      await tabTo(ui.toggle('/services'));
      await realUser.keyboard('{Enter}');
      expect(ui.isOpen('/services')).toBe(true);
      expect(ui.toggle('/services')).toHaveAttribute('aria-expanded', 'true');
      expect(ui.toggle('/services')).toHaveAttribute('data-pinned');
      // The word's arrow turned over to point UP.
      expect(getComputedStyle(arrowOf(ui.word('/services'))).rotate).toBe(
        '-90deg',
      );
      await realUser.tab();
      expect(document.activeElement).toBe(ui.entries('/services')[0]);
      // The ⌄ keeps the pointer while its card is pinned and the keyboard
      // inside its item.
      expect(getComputedStyle(ui.toggle('/services')).pointerEvents).toBe(
        'auto',
      );
      await realUser.keyboard('{Escape}');
      expect(ui.isOpen('/services')).toBe(false);
      expect(document.activeElement).toBe(ui.toggle('/services'));
      expect(getComputedStyle(arrowOf(ui.word('/services'))).rotate).toBe(
        '90deg',
      );
    });

    it('closes a PINNED card when focus leaves the item — and not when it moves inside it', async () => {
      const ui = mountRow();
      await tabTo(ui.toggle('/services'));
      await realUser.keyboard('{Enter}');
      expect(ui.isOpen('/services')).toBe(true);
      await realUser.tab({ shift: true });
      expect(document.activeElement).toBe(ui.word('/services'));
      expect(ui.isOpen('/services')).toBe(true);
      await realUser.tab({ shift: true });
      expect(document.activeElement?.textContent).toBe(ro.common.nav.home);
      expect(ui.isOpen('/services')).toBe(false);
    });

    it('lets the last entry Tab on to the next word, closing the card behind it', async () => {
      const ui = mountRow();
      await tabTo(ui.toggle('/team'));
      await realUser.keyboard('{Enter}');
      for (const entry of ui.entries('/team')) {
        await realUser.tab();
        expect(document.activeElement).toBe(entry);
      }
      await realUser.tab();
      expect(document.activeElement?.textContent).toBe(ro.common.nav.blog);
      expect(ui.isOpen('/team')).toBe(false);
    });

    it('never lets a hover take a card from the keyboard inside it (the mixed-input belt)', async () => {
      const ui = mountRow();
      await tabTo(ui.toggle('/services'));
      await realUser.keyboard('{Enter}');
      await realUser.tab();
      const focused = ui.entries('/services')[0];
      expect(document.activeElement).toBe(focused);
      // A mouse wanders over Echipa's word, and away from the row.
      const user = userEvent.setup();
      await user.hover(ui.word('/team'));
      await user.hover(pageMain);
      await new Promise((resolve) => setTimeout(resolve, HOVER_GRACE_MS * 2));
      expect(ui.isOpen('/services')).toBe(true);
      expect(ui.isOpen('/team')).toBe(false);
      expect(document.activeElement).toBe(focused);
    });

    it('never lets a hover SWAP away a card the ⌄ pinned — with focus on the ⌄, outside the card', async () => {
      // The accessibility review, 2026-10-16: Enter on Servicii's ⌄ pins its
      // card and leaves focus ON THE ⌄ — outside the card, where the belt
      // above cannot see it. A mouse then reaching „Echipa"'s WORD used to
      // swap: the focused ⌄ said "collapsed" and the next Tab landed on
      // „Echipa". A pinned card is the keyboard's (useNavDropdowns' THE
      // SWAP): no hover takes it.
      const ui = mountRow();
      await tabTo(ui.toggle('/services'));
      await realUser.keyboard('{Enter}');
      expect(ui.isOpen('/services')).toBe(true);
      expect(ui.toggle('/services')).toHaveAttribute('data-pinned');
      expect(document.activeElement).toBe(ui.toggle('/services'));
      // The REAL pointer onto Echipa's word — the very place a hover card
      // swaps at once.
      await realUser.hover(ui.word('/team'));
      expect(ui.word('/team').matches(':hover')).toBe(true);
      await new Promise((resolve) =>
        setTimeout(resolve, HOVER_INTENT_MS + HOVER_GRACE_MS),
      );
      expect(ui.isOpen('/services')).toBe(true);
      expect(ui.toggle('/services')).toHaveAttribute('data-pinned');
      expect(ui.toggle('/services')).toHaveAttribute('aria-expanded', 'true');
      expect(ui.isOpen('/team')).toBe(false);
      expect(document.activeElement).toBe(ui.toggle('/services'));
    });

    it('keeps the mouse’s visit to „Echipa" when the keyboard Tabs out of Servicii’s card onto it — its next move opens Echipa', async () => {
      // Servicii's card PINNED with the keyboard inside it, the mouse resting
      // on „Echipa" (the belt keeps the swap off while focus is in the card),
      // then Tab lands on the word „Echipa": Servicii's card closes on the
      // focus loss — and must leave Echipa's visit standing, so the mouse's
      // next move opens Echipa's card after the intent.
      const ui = mountRow();
      const user = userEvent.setup();
      await tabTo(ui.toggle('/services'));
      await realUser.keyboard('{Enter}');
      await realUser.tab();
      expect(document.activeElement).toBe(ui.entries('/services')[0]);
      await user.hover(ui.word('/team'));
      expect(ui.isOpen('/services')).toBe(true);
      expect(ui.isOpen('/team')).toBe(false);
      for (
        let i = 0;
        i < 15 && document.activeElement !== ui.word('/team');
        i += 1
      ) {
        await realUser.tab();
      }
      expect(document.activeElement).toBe(ui.word('/team'));
      expect(ui.isOpen('/services')).toBe(false);
      // The mouse's NEXT move on the word — dispatched by hand: user-event
      // sends nothing for a hover on the element it already rests on.
      act(() => {
        ui.word('/team').dispatchEvent(
          new PointerEvent('pointermove', {
            bubbles: true,
            pointerType: 'mouse',
            isPrimary: true,
          }),
        );
      });
      expect(ui.isOpen('/team')).toBe(false); // the intent first
      await expect.poll(() => ui.isOpen('/team'), { timeout: 2000 }).toBe(true);
    });

    it('closes a HOVER card the pointer has left once the keyboard leaves it too', async () => {
      // The belt's other half: the grace spared the card for the focus inside
      // it; when that focus leaves the item, nothing else would close it.
      const ui = mountRow();
      const user = userEvent.setup();
      await user.hover(ui.word('/services'));
      await expect
        .poll(() => ui.isOpen('/services'), { timeout: 2000 })
        .toBe(true);
      await tabTo(ui.toggle('/services'));
      await realUser.tab();
      expect(document.activeElement).toBe(ui.entries('/services')[0]);
      await user.hover(pageMain);
      await new Promise((resolve) => setTimeout(resolve, HOVER_GRACE_MS * 2));
      expect(ui.isOpen('/services')).toBe(true);
      await realUser.tab({ shift: true });
      expect(document.activeElement).toBe(ui.toggle('/services'));
      expect(ui.isOpen('/services')).toBe(true);
      await realUser.tab({ shift: true });
      await realUser.tab({ shift: true });
      expect(document.activeElement?.textContent).toBe(ro.common.nav.home);
      expect(ui.isOpen('/services')).toBe(false);
    });
  });

  describe('a real pointer — :hover, the bridge and the card’s place', () => {
    afterEach(async () => {
      await parkPointer();
    });

    /** Hover the word with the REAL pointer and wait for its card. */
    const openByRealHover = async (
      ui: ReturnType<typeof mountRow>,
      path: string,
    ) => {
      expect(
        matchMedia('(hover: hover) and (pointer: fine)').matches,
        'THE PREMISE: this tab has a fine, hovering pointer',
      ).toBe(true);
      await realUser.hover(ui.word(path));
      await expect.poll(() => ui.isOpen(path), { timeout: 2000 }).toBe(true);
    };

    it('lights an entry lavender and sweeps its underline in under the pointer — the top bar’s own hover — and no rule stands at rest (§15.40 round 4)', async () => {
      // The owner, 2026-10-16: "maybe on hover of a element of a dropdown
      // also add underline animation as on top bar buttons?"
      const ui = mountRow();
      await openByRealHover(ui, '/services');
      const entry = ui.entries('/services')[3];
      const rest = getComputedStyle(entry).color;
      // At rest every entry's rule is generated and swept away: no entry is
      // ever the current one.
      for (const a of ui.entries('/services')) {
        expect(getComputedStyle(a, '::after').content).not.toBe('none');
        expect(ruleScaleX(a)).toBe(0);
      }
      await realUser.hover(entry);
      expect(entry.matches(':hover')).toBe(true);
      expect(ui.isOpen('/services')).toBe(true);
      expect(getComputedStyle(entry).color).toBe(tokenColour('accent'));
      expect(getComputedStyle(entry).color).not.toBe(rest);
      expect(ruleScaleX(entry)).toBe(1);
      // …and only the hovered one.
      for (const a of ui.entries('/services')) {
        if (a !== entry) expect(ruleScaleX(a)).toBe(0);
      }
    });

    it('hangs the card half a rem under the pill, its first entry’s text under the word’s', async () => {
      const ui = mountRow();
      await openByRealHover(ui, '/services');
      const header = ui.row.closest('header') as HTMLElement;
      const card = ui
        .card('/services')
        .querySelector('.grid > div') as HTMLElement;
      const rem = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      expect(
        card.getBoundingClientRect().top -
          header.getBoundingClientRect().bottom,
      ).toBeCloseTo(0.5 * rem, 1);
      // The entry's box starts where the word's box does, so the two texts
      // (each 8px inside its own box) start on one line.
      expect(
        ui.entries('/services')[0].getBoundingClientRect().left,
      ).toBeCloseTo(ui.word('/services').getBoundingClientRect().left, 1);
      // The card paints the atom's own white ground and soft corner.
      expect(getComputedStyle(card).backgroundColor).toBe('rgb(255, 255, 255)');
      expect(getComputedStyle(card).borderTopLeftRadius).toBe(`${rem}px`);
      // It never makes the page scroll sideways.
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
        document.documentElement.clientWidth,
      );
    });

    it('bridges the word and the card: every point between them is inside the item', async () => {
      const ui = mountRow();
      await openByRealHover(ui, '/services');
      const word = ui.word('/services').getBoundingClientRect();
      const first = ui.entries('/services')[0].getBoundingClientRect();
      const x = word.left + word.width / 2;
      for (let y = word.bottom; y <= first.top; y += 1) {
        const hit = document.elementFromPoint(x, y);
        expect(hit && ui.item('/services').contains(hit), `y = ${y}`).toBe(
          true,
        );
      }
    });

    it('lays Servicii’s eleven out in two columns, six and five, read down then across; Echipa’s six in one', async () => {
      const ui = mountRow();
      await openByRealHover(ui, '/services');
      const lefts = ui
        .entries('/services')
        .map((a) => Math.round(a.getBoundingClientRect().left));
      expect(new Set(lefts.slice(0, 6)).size).toBe(1);
      expect(new Set(lefts.slice(6)).size).toBe(1);
      expect(lefts[6]).toBeGreaterThan(lefts[0]);
      // Column-major: DOM order = reading order = Tab order.
      const tops = ui
        .entries('/services')
        .map((a) => a.getBoundingClientRect().top);
      for (let i = 1; i < 6; i += 1)
        expect(tops[i]).toBeGreaterThan(tops[i - 1]);
      expect(tops[6]).toBeCloseTo(tops[0], 1);

      await realUser.hover(ui.word('/team'));
      await expect.poll(() => ui.isOpen('/team'), { timeout: 2000 }).toBe(true);
      const teamLefts = ui
        .entries('/team')
        .map((a) => Math.round(a.getBoundingClientRect().left));
      expect(new Set(teamLefts).size).toBe(1);
    });

    it('keeps Servicii’s card on a diagonal from its word through the band under „Echipa" into its right column — never swapping', async ({
      skip,
    }) => {
      // The owner's road to a right-column category: down and to the right
      // from „Servicii", across the band under „Echipa" (Echipa's item, never
      // its word), over the bridge, onto „Chirurgie orală". A REAL pointer,
      // so the targets are the browser's own hit tests; `force` skips the
      // runner's actionability waits, so the crossing is a visitor's speed.
      const ui = mountRow();
      await openByRealHover(ui, '/services');
      // ANY open of Echipa's card along the way, even for one frame, is a
      // swap: watched on the attribute itself.
      const swaps: string[] = [];
      const watch = new MutationObserver(() => {
        if (ui.isOpen('/team')) swaps.push('/team');
      });
      watch.observe(ui.card('/team'), {
        attributes: true,
        attributeFilter: ['data-state'],
      });
      try {
        const own = ui.item('/services').getBoundingClientRect();
        const team = ui.item('/team');
        const band = team.getBoundingClientRect();
        const teamWord = ui.word('/team').getBoundingClientRect();
        const wrapper = ui.card('/services');
        const bridge = wrapper.getBoundingClientRect();
        const target = ui.entries('/services')[6]; // the right column's first
        expect(
          target.getBoundingClientRect().left,
          'the target stands in the right column, past Servicii’s item',
        ).toBeGreaterThan(own.right);
        // Down and right inside Servicii's own item, under its word.
        await realUser.hover(ui.item('/services'), {
          force: true,
          position: { x: own.width - 3, y: own.height - 4 },
        });
        // THE CROSSING — out of Servicii's item, through Echipa's band.
        const crossing = performance.now();
        await realUser.hover(team, {
          force: true,
          position: { x: 4, y: band.height - 6 },
        });
        // The premise: on Echipa's ITEM and below its word.
        expect(team.matches(':hover')).toBe(true);
        expect(ui.word('/team').matches(':hover')).toBe(false);
        expect(band.top + band.height - 6).toBeGreaterThan(teamWord.bottom);
        await realUser.hover(team, {
          force: true,
          position: { x: band.width / 2, y: band.height - 2 },
        });
        // Over the bridge under Echipa — Servicii's card, its padding.
        await realUser.hover(wrapper, {
          force: true,
          position: { x: band.left + band.width / 2 - bridge.left, y: 4 },
        });
        // THE PREMISE: a visitor's crossing is quicker than the grace. On a
        // machine stalled long enough for it not to be, the grace may
        // rightly have closed the card — a fact about the machine, not the
        // rule — so the test stands down instead of failing (a loaded CI).
        const took = performance.now() - crossing;
        if (took >= HOVER_GRACE_MS) {
          skip(
            `the crossing took ${Math.round(took)}ms, past the ${HOVER_GRACE_MS}ms grace — the machine stalled; the rule is untested here`,
          );
        }
        await realUser.hover(target);
        // Well past the grace: Servicii's card stayed, Echipa's never opened.
        await new Promise((resolve) => setTimeout(resolve, HOVER_GRACE_MS * 3));
        expect(target.matches(':hover')).toBe(true);
        expect(ui.isOpen('/services')).toBe(true);
        expect(ui.isOpen('/team')).toBe(false);
        expect(swaps).toEqual([]);
      } finally {
        watch.disconnect();
      }
    });

    it('swaps at once when the real pointer reaches the word „Echipa"', async () => {
      const ui = mountRow();
      await openByRealHover(ui, '/services');
      await realUser.hover(ui.word('/team'));
      // Quicker than the 120ms intent — and while Servicii's card is open
      // nothing BUT the swap can open Echipa's.
      await expect
        .poll(() => ui.isOpen('/team'), { timeout: HOVER_INTENT_MS })
        .toBe(true);
      expect(ui.isOpen('/services')).toBe(false);
    });

    it('closes once the real pointer leaves for the page', async () => {
      const ui = mountRow();
      await openByRealHover(ui, '/team');
      // Away to the page's far corner — the open card itself covers the page
      // just under the bar, where a hover would land on the card.
      await parkPointer();
      await expect
        .poll(() => ui.isOpen('/team'), { timeout: 2000 })
        .toBe(false);
    });
  });
});

describe('the motion — timings measured on apple.com (2026-10-15)', () => {
  beforeAll(async () => {
    await browser.viewport(1536, 900);
    still.remove();
  });
  afterAll(() => {
    freeze();
  });

  /** A computed transition longhand, as Chromium writes it. */
  const timing = (element: Element) => {
    const style = getComputedStyle(element);
    return {
      property: style.transitionProperty,
      duration: style.transitionDuration,
      easing: style.transitionTimingFunction,
      delay: style.transitionDelay,
    };
  };

  it('reveals the card over 300ms on easeOutQuad, visible at once; clips it back over 200ms after 80ms', () => {
    const ui = mountRow();
    const card = ui.card('/services');
    expect(timing(card)).toEqual({
      property: 'clip-path, visibility',
      duration: '0.2s',
      easing: 'ease-in-out',
      delay: '0.08s',
    });
    act(() => {
      ui.toggle('/services').click();
    });
    expect(timing(card)).toEqual({
      property: 'clip-path, visibility',
      duration: '0.3s, 0s',
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      delay: '0s',
    });
  });

  it('fades each entry in over 240ms, 50ms + 20ms per entry after the card starts; out over 150ms at once', () => {
    const ui = mountRow();
    const items = ui
      .entries('/services')
      .map((a) => a.parentElement as HTMLElement);
    expect(timing(items[4])).toEqual({
      property: 'opacity, translate',
      duration: '0.15s',
      easing: 'ease-in',
      delay: '0s',
    });
    act(() => {
      ui.toggle('/services').click();
    });
    expect(timing(items[0]).delay).toBe('0.05s');
    expect(timing(items[4])).toEqual({
      property: 'opacity, translate',
      duration: '0.24s',
      easing: 'ease-in-out',
      delay: '0.13s',
    });
    expect(timing(items[10]).delay).toBe('0.25s');
  });

  it('plays THE HELD LOOK in and out on the hover’s own clocks — the word’s label over 200ms, its rule over 300ms', () => {
    // ui/TextButton's clocks, unconditional on the word, so `held` switched
    // at run time sweeps in like a hover and back out when the card closes.
    const ui = mountRow();
    const word = ui.word('/services');
    act(() => {
      ui.toggle('/services').click();
    });
    // Tailwind's `ease-out` STEP — the theme's curve, read off the root, not
    // the CSS keyword of the same name.
    const easeOut = getComputedStyle(document.documentElement)
      .getPropertyValue('--ease-out')
      .trim();
    expect(easeOut).toMatch(/^cubic-bezier\(/);
    expect(timing(word)).toMatchObject({
      property: 'color',
      duration: '0.2s',
      easing: easeOut,
    });
    const rule = getComputedStyle(word, '::after');
    expect(rule.transitionDuration).toBe('0.3s');
    expect(rule.transitionTimingFunction).toBe(easeOut);
    expect(rule.transitionProperty).toContain('transform');
  });

  it('turns the word’s arrow over the TextButton underline’s 300ms — the phone row’s own turn', () => {
    // NavDropdown.tsx's THE ARROW: `glyphMotion`, KEEP-IN-SYNC with
    // NavAccordion's, on the individual `rotate` property React switches.
    const ui = mountRow();
    const arrow = arrowOf(ui.word('/services'));
    const easeOut = getComputedStyle(document.documentElement)
      .getPropertyValue('--ease-out')
      .trim();
    const turn = timing(arrow);
    expect(turn.property.split(/,\s*/)).toContain('rotate');
    expect(turn.duration.split(/,\s*/).every((d) => d === '0.3s')).toBe(true);
    expect(turn.easing).toContain(easeOut);
    // Spelled as the phone row's ⌄ is (Header.test.tsx pins the two
    // `glyphMotion` strings byte-equal).
    expect((arrow.getAttribute('class') ?? '').split(/\s+/)).toEqual(
      expect.arrayContaining([
        'transition-transform',
        'duration-300',
        'ease-out',
        'motion-reduce:transition-none',
      ]),
    );
  });

  it('switches every moving part off under reduced motion', () => {
    // The class is the contract here: this runner cannot ask the OS for
    // reduced motion without emulating media for every later file.
    const ui = mountRow();
    const moving = [
      ui.card('/services'),
      arrowOf(ui.word('/services')),
      ...ui.entries('/services').map((a) => a.parentElement as Element),
    ];
    for (const element of moving) {
      expect((element.getAttribute('class') ?? '').split(/\s+/)).toContain(
        'motion-reduce:transition-none',
      );
    }
  });
});

describe('phone — the burger panel’s lists', () => {
  beforeAll(async () => {
    await browser.viewport(390, 844);
  });
  // EVERY TEST STARTS FROM A STILL PAGE AT ITS TOP. user-event presses an
  // element after a plain focus(), which may scroll the page (the short
  // screen test below says why it avoids it), and under the shell's
  // `scroll-behavior: smooth` that scroll is a GLIDE that can outlive its test
  // — MEASURED 2026-10-26: phone tests ending with the page 1–7px into one,
  // and the short screen's "the page never moves" read, taken mid-glide,
  // failing 2 runs in 3. A new INSTANT scroll aborts a glide in flight (CSSOM
  // View), so none runs into the next test.
  beforeEach(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  });

  const mountPanel = async (locale: Locale = 'ro') => {
    const user = userEvent.setup();
    const utils = render(<Mounted locale={locale} />, atTop());
    const messages = MESSAGES[locale].common;
    const burger = screen.getByRole('button', { name: messages.menu.label });
    await user.click(burger);
    const panel = document.getElementById('header-menu') as HTMLElement;
    expect(panel).not.toBeNull();
    // Re-read each time: a menu closed and opened again is a NEW panel. A
    // row with a list IS its word — a LINK named by its label alone, again
    // since 2026-10-26 (NavAccordion.tsx's THE ROW IS A LINK THAT OPENS ITS
    // LIST FIRST).
    const rowOf = (label: string) =>
      within(document.getElementById('header-menu') as HTMLElement).getByRole(
        'link',
        { name: label },
      );
    const regionOf = (row: HTMLElement) =>
      document.getElementById(
        row.getAttribute('aria-controls') ?? '',
      ) as HTMLElement;
    return { ...utils, user, messages, burger, panel, rowOf, regionOf };
  };

  /** The ⌄'s box at a row's end — decoration INSIDE the link. Throws by name
   *  when the row carries none, rather than handing a null on to a click or a
   *  measure. */
  const glyphBoxOf = (row: HTMLElement): HTMLElement => {
    const box = row.querySelector<HTMLElement>(':scope > [aria-hidden="true"]');
    if (!box) {
      throw new Error(`the row „${row.textContent ?? ''}" carries no ⌄ box`);
    }
    return box;
  };

  /** Reads `read` on every frame for `ms` and returns the LARGEST value each
   *  of its numbers reached — so something that moved for a moment, or moved
   *  and came back, is caught, not only something moved by the end. */
  const largestOver = async (
    ms: number,
    read: () => Readonly<Record<string, number>>,
  ): Promise<Record<string, number>> => {
    const largest: Record<string, number> = { ...read() };
    const until = performance.now() + ms;
    while (performance.now() < until) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      for (const [name, value] of Object.entries(read())) {
        largest[name] = Math.max(largest[name] ?? value, value);
      }
    }
    return largest;
  };

  /** What one click found and left behind. `expandedBefore` is read as the
   *  click ARRIVED — in the CAPTURE phase on <body>, before React's
   *  listeners at its root (the container RTL renders into, inside <body>)
   *  and so before the row's handler: the clicked link's `aria-expanded`,
   *  false a shut list's word, true an open one's, null a link that carries
   *  none (an entry of a list). The rest is read as the click reached <body>
   *  on its way back up — AFTER the row's handler, BEFORE the browser's
   *  default action: did anything hold the link back, which link it would
   *  follow, and where the menu stood at that moment. */
  type Tap = Readonly<{
    expandedBefore: boolean | null;
    prevented: boolean;
    href: string | null;
    menuOpen: boolean;
    pageInert: boolean;
    overflow: string;
  }>;

  /** The link a click lands in, if any — the row, or an entry. */
  const linkOf = (event: Event): Element | null =>
    event.target instanceof Element ? event.target.closest('a[href]') : null;

  /** Every click `run` makes, recorded on <body> (`Tap`) and then held back
   *  there, so the test page stays — one pair of listeners for a run of
   *  clicks. The document's net (holdTheFrame) sits behind them. */
  const whileRecording = async (run: () => unknown): Promise<Tap[]> => {
    const taps: Tap[] = [];
    // Each click's `expandedBefore`, keyed by the event itself: the capture
    // listener writes it, the bubbling one reads it.
    const found = new WeakMap<Event, boolean | null>();
    const arrive = (event: MouseEvent) => {
      const expanded = linkOf(event)?.getAttribute('aria-expanded') ?? null;
      found.set(event, expanded === null ? null : expanded === 'true');
    };
    const record = (event: MouseEvent) => {
      taps.push({
        expandedBefore: found.get(event) ?? null,
        prevented: event.defaultPrevented,
        href: linkOf(event)?.getAttribute('href') ?? null,
        menuOpen: document.getElementById('header-menu') !== null,
        pageInert: pageMain.hasAttribute('inert'),
        overflow: document.documentElement.style.overflow,
      });
      event.preventDefault();
    };
    document.body.addEventListener('click', arrive, { capture: true });
    document.body.addEventListener('click', record);
    try {
      await run();
    } finally {
      document.body.removeEventListener('click', arrive, { capture: true });
      document.body.removeEventListener('click', record);
    }
    return taps;
  };

  /** A tap that OPENED a list: its list SHUT as the tap arrived, the row
   *  held the link back, and the menu still stood open over the frozen,
   *  scroll-locked page. */
  const opened = (href: string): Tap => ({
    expandedBefore: false,
    prevented: true,
    href,
    menuOpen: true,
    pageInert: true,
    overflow: 'hidden',
  });

  /** A tap THE GUARD held back (NavAccordion.tsx): the marks of an opening
   *  tap but one — its list already OPEN as the tap arrived, opened less
   *  than FOLLOW_AFTER_MS before: open before, held. Never a shut list
   *  opened a second time, which `opened` records. */
  const heldBack = (href: string): Tap => ({
    ...opened(href),
    expandedBefore: true,
  });

  /** A tap the browser FOLLOWS on an OPEN list's word: nothing held it back,
   *  and the menu was already gone — the page unfrozen and unlocked — before
   *  the browser's default action (NavMenu's closeForJump). */
  const followed = (href: string): Tap => ({
    expandedBefore: true,
    prevented: false,
    href,
    menuOpen: false,
    pageInert: false,
    overflow: '',
  });

  /** An ENTRY of a list, followed: the word's marks, on a link that carries
   *  no `aria-expanded`. */
  const entryFollowed = (href: string): Tap => ({
    ...followed(href),
    expandedBefore: null,
  });

  /** A click left to the browser's own way — a new tab or window: nothing
   *  held back here, and nothing moved either — the menu open over the
   *  frozen page. `expandedBefore` is what the click found: false a shut
   *  list's word, true an open one's, null an entry. */
  const leftToTheBrowser = (
    href: string,
    expandedBefore: boolean | null,
  ): Tap => ({
    expandedBefore,
    prevented: false,
    href,
    menuOpen: true,
    pageInert: true,
    overflow: 'hidden',
  });

  /** A click on `row` that stands for a moment: `at`, set as the NATIVE
   *  event's own `timeStamp` before it is dispatched — the stamp THE GUARD
   *  reads (NavAccordion.tsx's ONE CLOCK) — so a boundary is exact, never a
   *  race against a real wait; the tests that wait for real use
   *  `pastTheGuard`. A pointer's click unless `init` says otherwise
   *  (`detail` 1: THE REVEAL stays still). THE PREMISE is checked before the
   *  click is dispatched, so a stamp that did not take names itself rather
   *  than failing a test's taps. Throws by name on a row that has LEFT the
   *  document: a click on it escapes every net here — no listener outside a
   *  detached element hears it — and Chrome still follows a detached link
   *  (measured 2026-10-26: with the guard deleted, a later click navigated
   *  the frame and took the whole file down). */
  const clickAt = (
    row: HTMLElement,
    at: number,
    init: MouseEventInit = {},
  ): void => {
    if (!row.isConnected) {
      throw new Error(
        `the row „${row.textContent ?? ''}" has left the document — the menu closed before this click`,
      );
    }
    const event = createEvent.click(row, { button: 0, detail: 1, ...init });
    Object.defineProperty(event, 'timeStamp' satisfies keyof Event, {
      value: at,
    });
    expect(
      event.timeStamp,
      'THE PREMISE: the click carries the moment it stands for',
    ).toBe(at);
    fireEvent(row, event);
  };

  /** A REAL wait past THE GUARD — for a test whose next tap on an open
   *  list's word must go to the page. Never a fake timer: the guard reads
   *  each click's own `event.timeStamp`, the browser's clock, which no fake
   *  timer moves; a wait that starts once the opening tap has landed puts
   *  the next one at least this far behind it. */
  const pastTheGuard = (): Promise<void> =>
    new Promise((resolve) => {
      window.setTimeout(resolve, FOLLOW_AFTER_MS + 100);
    });

  /** The browser's clock at every click `row` receives from here on — each
   *  event's `timeStamp`, the one THE GUARD reads — for a test's premise:
   *  how far apart its taps really landed. The listener dies with the row. */
  const clickStamps = (row: HTMLElement): number[] => {
    const stamps: number[] = [];
    row.addEventListener('click', (event) => {
      stamps.push(event.timeStamp);
    });
    return stamps;
  };

  /** The clicks that open a link elsewhere — the browser's, never this
   *  page's (./isPlainLeftClick answers no to each). */
  const modifiedClicks = [
    ['a Ctrl click', { ctrlKey: true }],
    ['a Cmd click', { metaKey: true }],
    ['a Shift click', { shiftKey: true }],
    ['an Alt click', { altKey: true }],
    ['a middle click', { button: 1 }],
  ] as const;

  it('makes all four rows LINKS to their pages — Servicii and Echipa the words that open their lists, no „Submeniul …" control left', async () => {
    // The owner, 2026-10-26: "when i click it ONCE to open dropdown and ehn
    // i click it twice to go to page top, do not implement with a counter,
    // but with an if dropdown open flag" — the word a link to its page
    // again, after ten days as a <button> that only toggled its list
    // (2026-10-16: "on phone on click of servicii it has to open it's
    // respective dropdown").
    const ui = await mountPanel();
    expect(
      within(ui.panel).queryAllByRole('button', { name: /^Submeniul / }),
    ).toHaveLength(0);
    // The four rows, in the bar's order, each its <li>'s direct child.
    const rows = Array.from(
      ui.panel.querySelectorAll<HTMLElement>(
        ':scope > ul > li > :is(a, button)',
      ),
    );
    expect(
      rows.map((row) => [
        row.tagName,
        row.textContent,
        row.getAttribute('href'),
      ]),
    ).toEqual([
      ['A', ro.common.nav.home, '/ro/'],
      ['A', ro.common.nav.services, '/ro/services/'],
      ['A', ro.common.nav.team, '/ro/team/'],
      ['A', ro.common.nav.blog, '/ro/blog/'],
    ]);
    // Acasă and Blog: plain words — nothing opens from them.
    for (const row of [rows[0], rows[3]]) {
      expect(row).not.toHaveAttribute('aria-expanded');
      expect(row).not.toHaveAttribute('aria-controls');
    }
    const list = ui.panel.querySelector(':scope > ul') as HTMLElement;
    const plain = rows[0].getBoundingClientRect();
    for (const label of [ro.common.nav.services, ro.common.nav.team]) {
      const row = ui.rowOf(label);
      // A link whose name is its label alone (SC 2.5.3), and the disclosure:
      // aria-expanded, aria-controls its list — shut.
      expect(row).toHaveAccessibleName(label);
      expect(row).toHaveAttribute('aria-expanded', 'false');
      expect(ui.regionOf(row)).not.toBeNull();
      expect(ui.regionOf(row)).toHaveAttribute('data-state', 'closed');
      // As wide as the panel's list and a §9 target — the plain rows' own
      // box, to the pixel.
      const box = row.getBoundingClientRect();
      expect(box.width).toBeCloseTo(list.getBoundingClientRect().width, 0);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.height).toBe(plain.height);
      expect(box.left).toBe(plain.left);
      // The ⌄ is decoration INSIDE it, where the old ⌄ square stood: an
      // aria-hidden box 44px wide at the row's end, the row's height,
      // absolutely placed — so the label stays centred on the row.
      const glyphBox = glyphBoxOf(row);
      expect(glyphBox.querySelector('svg')).not.toBeNull();
      const g = glyphBox.getBoundingClientRect();
      expect(getComputedStyle(glyphBox).position).toBe('absolute');
      expect(g.width).toBeCloseTo(44, 0);
      expect(g.height).toBeCloseTo(box.height, 0);
      expect(g.right).toBeCloseTo(box.right, 0);
      const text = document.createRange();
      text.selectNodeContents(row.firstChild as Node);
      const t = text.getBoundingClientRect();
      expect(t.left + t.width / 2).toBeCloseTo(box.left + box.width / 2, 0);
    }
  });

  it('OPENS its list on the first tap — the row holds the link back, the menu stays open, nothing navigates — on the word or on the ⌄ at its end', async () => {
    const ui = await mountPanel();
    const services = ui.rowOf(ro.common.nav.services);
    const team = ui.rowOf(ro.common.nav.team);
    const url = window.location.href;

    expect(await whileRecording(() => ui.user.click(services))).toEqual([
      opened('/ro/services/'),
    ]);
    expect(services).toHaveAttribute('aria-expanded', 'true');
    expect(ui.regionOf(services)).toHaveAttribute('data-state', 'open');

    // The ⌄'s box is the row: a tap on it, Echipa's list shut, opens that
    // list the same way — and shuts Servicii's, one list at a time.
    expect(await whileRecording(() => ui.user.click(glyphBoxOf(team)))).toEqual(
      [opened('/ro/team/')],
    );
    expect(team).toHaveAttribute('aria-expanded', 'true');
    expect(ui.regionOf(team)).toHaveAttribute('data-state', 'open');
    expect(services).toHaveAttribute('aria-expanded', 'false');

    // The same page, the same menu, the same freeze.
    expect(window.location.href).toBe(url);
    expect(document.getElementById('header-menu')).not.toBeNull();
    expect(ui.burger).toHaveAttribute('aria-expanded', 'true');
    expect(pageMain).toHaveAttribute('inert');
  });

  it.each([
    ['Servicii', 'its word', 'services'],
    ['Echipa', 'the ⌄ at its end', 'team'],
  ] as const)(
    'GOES TO ITS PAGE on the next tap, its list open — %s, tapped on %s: nothing held back, the menu shut BEFORE the browser follows, focus not on the burger',
    async (_row, on, key) => {
      // "so if dropdown of services open on click of it go to services page
      // at top": the browser follows the plain link — no script here
      // navigates or scrolls (NavAccordion.tsx's WHY A LINK).
      const ui = await mountPanel();
      const row = ui.rowOf(ro.common.nav[key]);
      const href = `/ro/${key}/`;
      const target = on === 'its word' ? row : glyphBoxOf(row);
      expect(await whileRecording(() => ui.user.click(target))).toEqual([
        opened(href),
      ]);
      expect(row).toHaveAttribute('aria-expanded', 'true');

      // A visitor who reads the list before tapping again: past THE GUARD
      // (a sooner tap is held back — the tests below).
      await pastTheGuard();
      expect(await whileRecording(() => ui.user.click(target))).toEqual([
        followed(href),
      ]);
      expect(document.getElementById('header-menu')).toBeNull();
      expect(ui.burger).toHaveAttribute('aria-expanded', 'false');
      // The next document decides where the keyboard goes — not the burger.
      expect(document.activeElement).not.toBe(ui.burger);
    },
  );

  it('opens on the first Enter and goes to the page on the next — a link and a real keyboard; Space opens nothing, and the page never moves', async () => {
    const ui = await mountPanel();
    const team = ui.rowOf(ro.common.nav.team);
    team.focus({ preventScroll: true });
    expect(document.activeElement).toBe(team);
    // THE PAGE STAYS PUT through every key (the React review, 2026-10-26):
    // the planner's probe saw nothing move, and these reads keep it so.
    expect(window.scrollY).toBe(0);

    // Space: a link does not answer it — no click at all, nothing opens.
    expect(await whileRecording(() => realUser.keyboard('[Space]'))).toEqual(
      [],
    );
    expect(team).toHaveAttribute('aria-expanded', 'false');
    expect(window.scrollY).toBe(0);

    // Enter: a click of the primary button — the first one opens…
    expect(await whileRecording(() => realUser.keyboard('{Enter}'))).toEqual([
      opened('/ro/team/'),
    ]);
    expect(team).toHaveAttribute('aria-expanded', 'true');
    expect(ui.regionOf(team)).toHaveAttribute('data-state', 'open');
    expect(document.activeElement).toBe(team);
    expect(window.scrollY).toBe(0);
    // …Space still does nothing, the list stays open…
    expect(await whileRecording(() => realUser.keyboard('[Space]'))).toEqual(
      [],
    );
    expect(team).toHaveAttribute('aria-expanded', 'true');
    expect(window.scrollY).toBe(0);
    // …and the next Enter, past THE GUARD's half second, goes to the page.
    await pastTheGuard();
    expect(await whileRecording(() => realUser.keyboard('{Enter}'))).toEqual([
      followed('/ro/team/'),
    ]);
    expect(ui.burger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).not.toBe(ui.burger);
    // …and with the menu gone, the page unlocked, nothing scrolls it after.
    expect(await largestOver(500, () => ({ scrollY: window.scrollY }))).toEqual(
      { scrollY: 0 },
    );
  });

  it.each([
    ['Servicii', 'services'],
    ['Echipa', 'team'],
  ] as const)(
    'HOLDS BACK a second tap within FOLLOW_AFTER_MS of the opening — %s: a quick double tap opens the list and STAYS, the menu and the freeze as they were; a tap past the guard goes to the page',
    async (_row, key) => {
      // The owner, 2026-10-26: "Ignore a second tap that comes within about
      // 0.5 s of opening. It's based on time, not a count" (NavAccordion.tsx's
      // THE GUARD).
      const ui = await mountPanel();
      const row = ui.rowOf(ro.common.nav[key]);
      const href = `/ro/${key}/`;
      const stamps = clickStamps(row);

      // A double tap: two taps on the word, back to back.
      const taps = await whileRecording(async () => {
        await ui.user.click(row);
        await ui.user.click(row);
      });
      // THE PREMISE first: two taps, the second inside the guard.
      expect(stamps).toHaveLength(2);
      expect(
        stamps[1] - stamps[0],
        'THE PREMISE: the second tap landed inside the guard',
      ).toBeLessThan(FOLLOW_AFTER_MS);
      expect(taps).toEqual([opened(href), heldBack(href)]);
      // The list stays open, and so do the menu and the freeze.
      expect(row).toHaveAttribute('aria-expanded', 'true');
      expect(ui.regionOf(row)).toHaveAttribute('data-state', 'open');
      expect(document.getElementById('header-menu')).not.toBeNull();
      expect(ui.burger).toHaveAttribute('aria-expanded', 'true');
      expect(pageMain).toHaveAttribute('inert');
      expect(document.documentElement.style.overflow).toBe('hidden');

      // Past the guard, the very same tap goes to the page.
      await pastTheGuard();
      expect(await whileRecording(() => ui.user.click(row))).toEqual([
        followed(href),
      ]);
      expect(stamps[2] - stamps[0]).toBeGreaterThanOrEqual(FOLLOW_AFTER_MS);
    },
  );

  it('HOLDS BACK a second Enter within FOLLOW_AFTER_MS of the opening one — a real keyboard; an Enter past the guard goes to the page', async () => {
    const ui = await mountPanel();
    const services = ui.rowOf(ro.common.nav.services);
    const stamps = clickStamps(services);
    services.focus({ preventScroll: true });

    // Two Enters in one breath — a click of button 0 each, `detail` 0.
    const taps = await whileRecording(() =>
      realUser.keyboard('{Enter}{Enter}'),
    );
    expect(stamps).toHaveLength(2);
    expect(
      stamps[1] - stamps[0],
      'THE PREMISE: the second Enter landed inside the guard',
    ).toBeLessThan(FOLLOW_AFTER_MS);
    expect(taps).toEqual([opened('/ro/services/'), heldBack('/ro/services/')]);
    expect(services).toHaveAttribute('aria-expanded', 'true');
    expect(document.activeElement).toBe(services);
    expect(ui.burger).toHaveAttribute('aria-expanded', 'true');
    expect(pageMain).toHaveAttribute('inert');

    await pastTheGuard();
    expect(await whileRecording(() => realUser.keyboard('{Enter}'))).toEqual([
      followed('/ro/services/'),
    ]);
    expect(document.activeElement).not.toBe(ui.burger);
  });

  it('measures THE GUARD in TIME from the OPENING, never in taps — held 1ms and FOLLOW_AFTER_MS − 1ms after it whatever the click count, a modified click the browser’s own inside it, followed at FOLLOW_AFTER_MS: a held tap re-arms nothing', async () => {
    // Each click carries the moment it stands for in its own native
    // `timeStamp`, the stamp THE GUARD reads — `clickAt`, which checks THE
    // PREMISE before each click is dispatched — so the boundary is exact,
    // never a race against a real wait; the tests above wait for real.
    const ui = await mountPanel();
    const services = ui.rowOf(ro.common.nav.services);
    const href = '/ro/services/';
    // A whole number of milliseconds, so every difference below is exact.
    const t0 = Math.floor(performance.now());

    expect(
      await whileRecording(() => {
        // The opening click.
        clickAt(services, t0, { detail: 1 });
        // A double click's second click (`detail` 2), 1ms on: held.
        clickAt(services, t0 + 1, { detail: 2 });
        // A Ctrl click inside the guard: the browser's own — the modifier
        // check runs first.
        clickAt(services, t0 + 2, { detail: 1, ctrlKey: true });
        // A lone click (`detail` 1) 1ms short of the half second: held —
        // time, not a count.
        clickAt(services, t0 + FOLLOW_AFTER_MS - 1, { detail: 1 });
      }),
    ).toEqual([
      opened(href),
      heldBack(href),
      leftToTheBrowser(href, true),
      heldBack(href),
    ]);
    expect(services).toHaveAttribute('aria-expanded', 'true');

    // FOLLOW_AFTER_MS after the OPENING — 1ms behind the last held click,
    // which re-armed nothing — and a double click's second at that: it goes.
    expect(
      await whileRecording(() => {
        clickAt(services, t0 + FOLLOW_AFTER_MS, { detail: 2 });
      }),
    ).toEqual([followed(href)]);
  });

  it('keys THE GUARD off THIS opening, never a row’s first — across both rows: each word held for half a second after ITS list’s latest opening, then followed', async () => {
    // The test-coverage review's MEDIUM (2026-10-26): every other guard test
    // opens a row once, so a guard measured from a row's FIRST opening would
    // pass them all. Here Servicii opens twice: the second time 1200ms after
    // the first, and a tap 1ms after THAT opening is held — measured from
    // the first opening, it would be 1201ms and go to the page.
    const ui = await mountPanel();
    const services = ui.rowOf(ro.common.nav.services);
    const team = ui.rowOf(ro.common.nav.team);
    const t0 = Math.floor(performance.now());

    expect(
      await whileRecording(() => {
        // Servicii opens…
        clickAt(services, t0);
        // …Echipa opens 600ms on, shutting it, and its word holds a tap 1ms
        // after ITS opening…
        clickAt(team, t0 + 600);
        clickAt(team, t0 + 601);
        // …Servicii opens AGAIN, Echipa's list shut by it, and its word
        // holds a tap 1ms after this second opening.
        clickAt(services, t0 + 1200);
        clickAt(services, t0 + 1201);
      }),
    ).toEqual([
      opened('/ro/services/'),
      opened('/ro/team/'),
      heldBack('/ro/team/'),
      opened('/ro/services/'),
      heldBack('/ro/services/'),
    ]);
    expect(services).toHaveAttribute('aria-expanded', 'true');
    expect(team).toHaveAttribute('aria-expanded', 'false');

    // FOLLOW_AFTER_MS after Servicii's SECOND opening, its word goes.
    expect(
      await whileRecording(() => {
        clickAt(services, t0 + 1200 + FOLLOW_AFTER_MS);
      }),
    ).toEqual([followed('/ro/services/')]);
  });

  it('reads both stamps off the NATIVE click, one clock — a tap 1ms after an opening the browser stamped 0 is held, where React’s own stamp would be the wall clock; and a tap stamped BEFORE its opening, which only two clocks make, goes', async () => {
    // The React and TypeScript reviews (2026-10-26): React's synthetic
    // `timeStamp` is the native one, or `Date.now()` where the native one is
    // 0 — the wall clock against the event clock. NavAccordion.tsx's ONE
    // CLOCK reads the native stamp both times, and holds a tap only for an
    // elapsed time from 0 up to FOLLOW_AFTER_MS.
    const ui = await mountPanel();
    const services = ui.rowOf(ro.common.nav.services);
    const team = ui.rowOf(ro.common.nav.team);

    // An opening stamped 0 by the browser — React's own stamp for it would
    // be `Date.now()` — and a tap 1ms on, on the event's clock: held.
    expect(
      await whileRecording(() => {
        clickAt(services, 0);
        clickAt(services, 1);
      }),
    ).toEqual([opened('/ro/services/'), heldBack('/ro/services/')]);
    expect(services).toHaveAttribute('aria-expanded', 'true');

    // Echipa opens, and a tap on its word stamped 1000ms BEFORE that
    // opening — a negative elapsed time, which only two clocks can make —
    // is let through: it goes to the page.
    const t0 = Math.floor(performance.now());
    expect(
      await whileRecording(() => {
        clickAt(team, t0);
      }),
    ).toEqual([opened('/ro/team/')]);
    expect(
      await whileRecording(() => {
        clickAt(team, t0 - 1000);
      }),
    ).toEqual([followed('/ro/team/')]);
  });

  /** What one keydown left behind when it reached <body> — after the row's
   *  React handler: which key, whether the browser marked it repeating, and
   *  whether anything held its default action back. */
  type Press = Readonly<{
    key: string;
    repeat: boolean;
    prevented: boolean;
  }>;

  /** Every keydown `run` makes, recorded on <body> (`Press`) — never held
   *  back here, so a key keeps whatever default action the row left it. */
  const whilePressing = async (run: () => unknown): Promise<Press[]> => {
    const presses: Press[] = [];
    const record = (event: KeyboardEvent) => {
      presses.push({
        key: event.key,
        repeat: event.repeat,
        prevented: event.defaultPrevented,
      });
    };
    document.body.addEventListener('keydown', record);
    try {
      await run();
    } finally {
      document.body.removeEventListener('keydown', record);
    }
    return presses;
  };

  it.each([
    ['shut', false],
    ['open', true],
  ] as const)(
    'holds back an Enter keydown the browser marks REPEATING, its list %s — and nothing else: an unrepeated Enter, and a repeating Space or arrow key, are left alone',
    async (_state, open) => {
      // The accessibility review's LOW-3 (2026-10-26), MEASURED by the
      // planner on the built export: Enter held on the shut word, keydowns
      // marked `repeat` every 33ms from 500ms to 1.5s — Chromium sent ONE
      // click, WebKit and Firefox kept activating the link on the repeats,
      // the first past THE GUARD going to /ro/services/ (NavAccordion.tsx's
      // A HELD ENTER OPENS THE LIST ONCE; re-measured on a bare page the
      // same day, the same rhythm: without the hold Chromium 1 click, WebKit
      // 28, Firefox 29 — with it, 1 in all three). This Chromium cannot show
      // the engines' difference — it ignores a repeating Enter on a link of
      // its own accord — so the hold itself is what this test pins: a
      // dispatched keydown is untrusted and has no default action anyway,
      // but `defaultPrevented` says whether the row held it back.
      const ui = await mountPanel();
      const services = ui.rowOf(ro.common.nav.services);
      if (open) await ui.user.click(services);
      expect(services).toHaveAttribute('aria-expanded', String(open));
      const press = (init: KeyboardEventInit): void => {
        services.dispatchEvent(
          new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            ...init,
          }),
        );
      };

      const presses: Press[] = [];
      const taps = await whileRecording(async () => {
        presses.push(
          ...(await whilePressing(() => {
            press({ key: 'Enter', code: 'Enter', repeat: true });
            press({ key: 'Enter', code: 'Enter', repeat: false });
            press({ key: ' ', code: 'Space', repeat: true });
            press({ key: 'ArrowDown', code: 'ArrowDown', repeat: true });
          })),
        );
      });
      expect(presses).toEqual([
        { key: 'Enter', repeat: true, prevented: true },
        { key: 'Enter', repeat: false, prevented: false },
        { key: ' ', repeat: true, prevented: false },
        { key: 'ArrowDown', repeat: true, prevented: false },
      ]);
      // …and the keys changed nothing: no click, the list as it was, the
      // menu open over the frozen page.
      expect(taps).toEqual([]);
      expect(services).toHaveAttribute('aria-expanded', String(open));
      expect(document.getElementById('header-menu')).not.toBeNull();
      expect(pageMain).toHaveAttribute('inert');
    },
  );

  it('opens the list ONCE for a REAL held Enter — the browser’s own repeating keydowns, every one after the first held back', async () => {
    // vitest/browser's `{Enter>4/}` presses Enter and keeps it down for
    // three more keydowns, each one the browser marks `repeat` (Playwright's
    // auto-repeat), then lets go: the input a held key makes. This Chromium
    // answers only the first with a click whatever the row does (A HELD
    // ENTER's measurement); the hold on the three repeats is the row's.
    const ui = await mountPanel();
    const services = ui.rowOf(ro.common.nav.services);
    services.focus({ preventScroll: true });

    const presses: Press[] = [];
    const taps = await whileRecording(async () => {
      presses.push(
        ...(await whilePressing(() => realUser.keyboard('{Enter>4/}'))),
      );
    });
    expect(presses).toEqual([
      { key: 'Enter', repeat: false, prevented: false },
      { key: 'Enter', repeat: true, prevented: true },
      { key: 'Enter', repeat: true, prevented: true },
      { key: 'Enter', repeat: true, prevented: true },
    ]);
    expect(taps).toEqual([opened('/ro/services/')]);
    expect(services).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('header-menu')).not.toBeNull();
  });

  it.each(locales)(
    'DESCRIBES the open word to a screen reader — `%s`: on both rows, only while its list is open; the sentence never drawn, never in the accessibility tree, never part of the name',
    async (locale) => {
      // The owner, 2026-10-26: "A spoken hint for screen readers while the
      // list is open. It needs five translations from you." (NavAccordion.tsx's
      // THE HINT: the word's DESCRIPTION, which a reader may speak — „Servicii,
      // link, expanded, Apasă din nou pentru a deschide pagina." — when, and
      // whether at all, the reader's own; what this test pins is the
      // exposure, the page's part.)
      const ui = await mountPanel(locale);
      const hint = ui.messages.nav.pressAgain;
      const services = ui.rowOf(ui.messages.nav.services);
      const team = ui.rowOf(ui.messages.nav.team);
      /** A row's own sentence: in its <li>, beside the link. Throws by name
       *  when the row carries none. */
      const sentenceOf = (row: HTMLElement): HTMLElement => {
        const sentence = row
          .closest('li')
          ?.querySelector<HTMLElement>(':scope > span[hidden]');
        if (!sentence) {
          throw new Error(
            `the row „${row.textContent ?? ''}" carries no sentence`,
          );
        }
        return sentence;
      };

      // Shut: nothing describes either word — each row's sentence there all
      // the same, beside its link and never in it, `hidden`: never drawn,
      // and out of the accessibility tree (Testing Library's own test of
      // it, the one its role queries filter by).
      for (const row of [services, team]) {
        expect(row).not.toHaveAttribute('aria-describedby');
        expect(row).toHaveAccessibleDescription('');
        const sentence = sentenceOf(row);
        expect(sentence.textContent).toBe(hint);
        expect(row.contains(sentence)).toBe(false);
        expect(sentence).toHaveAttribute('hidden');
        expect(getComputedStyle(sentence).display).toBe('none');
        expect(isInaccessible(sentence)).toBe(true);
      }

      // Servicii's list open: its word is described by its own sentence,
      // its name still its label alone (SC 2.5.3)…
      await ui.user.click(services);
      expect(services).toHaveAttribute('aria-expanded', 'true');
      expect(services).toHaveAttribute(
        'aria-describedby',
        sentenceOf(services).id,
      );
      expect(services).toHaveAccessibleDescription(hint);
      expect(services).toHaveAccessibleName(ui.messages.nav.services);
      // …Echipa's by nothing, and the panel's drawn text carries no trace of
      // the sentence.
      expect(team).not.toHaveAttribute('aria-describedby');
      expect(team).toHaveAccessibleDescription('');
      expect(ui.panel.innerText).not.toContain(hint);

      // Echipa takes over: the description goes with the open list.
      await ui.user.click(team);
      expect(team).toHaveAttribute('aria-expanded', 'true');
      expect(team).toHaveAttribute('aria-describedby', sentenceOf(team).id);
      expect(team).toHaveAccessibleDescription(hint);
      expect(team).toHaveAccessibleName(ui.messages.nav.team);
      expect(services).not.toHaveAttribute('aria-describedby');
      expect(services).toHaveAccessibleDescription('');
    },
  );

  it.each(modifiedClicks)(
    'leaves the ROW to the browser on %s — shut or open, nothing held back, the list and the menu as they were',
    async (_form, modifiers) => {
      // A new tab or window for the page is the browser's own; THIS page
      // stays exactly as it was (NavAccordion.tsx's ONLY A PLAIN LEFT CLICK
      // DECIDES — the entries' rule, below).
      const ui = await mountPanel();
      const services = ui.rowOf(ro.common.nav.services);
      // Shut: nothing opens.
      expect(
        await whileRecording(() => {
          fireEvent.click(services, modifiers);
        }),
      ).toEqual([leftToTheBrowser('/ro/services/', false)]);
      expect(services).toHaveAttribute('aria-expanded', 'false');
      // Open (a plain tap first): nothing closes, nothing is followed — and
      // nothing is held back either, though the click comes right behind
      // the opening tap: the modifier check runs before THE GUARD (its exact
      // half second is the time-stamped test above).
      expect(await whileRecording(() => ui.user.click(services))).toEqual([
        opened('/ro/services/'),
      ]);
      expect(
        await whileRecording(() => {
          fireEvent.click(services, modifiers);
        }),
      ).toEqual([leftToTheBrowser('/ro/services/', true)]);
      expect(services).toHaveAttribute('aria-expanded', 'true');
      expect(ui.regionOf(services)).toHaveAttribute('data-state', 'open');
      expect(ui.burger).toHaveAttribute('aria-expanded', 'true');
    },
  );

  it('holds the word’s hover look while its list is open — and lets go when the other row takes over', async () => {
    // THE HELD LOOK on the phone (the owner: "leave it on until card or
    // section unfocus or change"). The REAL pointer parked BEFORE the panel
    // opens — its sheet then covers the parking spot — so no :hover passes
    // for the hold in the computed reads.
    await parkPointer();
    const ui = await mountPanel();
    const services = ui.rowOf(ro.common.nav.services);
    const team = ui.rowOf(ro.common.nav.team);
    expect(wearsHeld(services)).toBe(false);
    expect(getComputedStyle(services).color).toBe(tokenColour('ink'));
    expect(ruleScaleX(services)).toBe(0);

    await ui.user.click(services);
    expect(services.matches(':hover')).toBe(false);
    expect(wearsHeld(services)).toBe(true);
    expect(getComputedStyle(services).color).toBe(tokenColour('accent'));
    expect(ruleScaleX(services)).toBe(1);
    // The glyph inside turns lavender with its label.
    expect(
      getComputedStyle(services.querySelector('svg') as SVGElement).color,
    ).toBe(tokenColour('accent'));
    // Nothing said by it: no aria-current off the current page.
    expect(services).not.toHaveAttribute('aria-current');

    // The other row takes over: this one lets go, that one holds…
    await ui.user.click(team);
    expect(wearsHeld(team)).toBe(true);
    expect(wearsHeld(services)).toBe(false);
    expect(getComputedStyle(services).color).toBe(tokenColour('ink'));
    expect(ruleScaleX(services)).toBe(0);

    // …and back the other way: the word no longer shuts its own list, so a
    // hold ends when the OTHER row's list opens.
    await ui.user.click(services);
    expect(wearsHeld(services)).toBe(true);
    expect(wearsHeld(team)).toBe(false);
    expect(getComputedStyle(team).color).toBe(tokenColour('ink'));
    expect(ruleScaleX(team)).toBe(0);
  });

  it('keeps the CURRENT page’s mark on its row — and its open word goes to that very page, at its top', async () => {
    // „Servicii, current page, link, collapsed": on the services page the
    // menu still says where the visitor is (NavAccordion.tsx's THE CURRENT
    // PAGE KEEPS ITS MARK), and with its list open the word follows its own
    // URL — no fragment, so the browser loads the page anew, at its top.
    nav.pathname = '/services';
    const ui = await mountPanel();
    const services = ui.rowOf(ro.common.nav.services);
    expect(services).toHaveAttribute('aria-current', 'page');
    expect(wearsHeld(services)).toBe(true);
    expect(ui.rowOf(ro.common.nav.team)).not.toHaveAttribute('aria-current');

    expect(await whileRecording(() => ui.user.click(services))).toEqual([
      opened('/ro/services/'),
    ]);
    expect(services).toHaveAttribute('aria-expanded', 'true');
    expect(services).toHaveAttribute('aria-current', 'page');
    expect(wearsHeld(services)).toBe(true);

    await pastTheGuard();
    expect(await whileRecording(() => ui.user.click(services))).toEqual([
      followed('/ro/services/'),
    ]);
    expect(ui.burger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens one list at a time — and a row whose list the other shut OPENS it again on its next tap: the flag, never a count', async () => {
    // "do not implement with a counter, but with an if dropdown open flag":
    // Servicii's second tap here comes after Echipa's shut its list, so the
    // flag says shut and the tap opens — a count of taps would have gone to
    // the page. The three taps come back to back, and none is held: THE
    // GUARD asks only about an OPEN list's word.
    const ui = await mountPanel();
    const services = ui.rowOf(ro.common.nav.services);
    const team = ui.rowOf(ro.common.nav.team);
    const taps = await whileRecording(async () => {
      await ui.user.click(services);
      expect(services).toHaveAttribute('aria-expanded', 'true');
      expect(ui.regionOf(services)).toHaveAttribute('data-state', 'open');
      expect(within(ui.regionOf(services)).getAllByRole('link')).toHaveLength(
        11,
      );

      await ui.user.click(team);
      expect(team).toHaveAttribute('aria-expanded', 'true');
      expect(services).toHaveAttribute('aria-expanded', 'false');
      expect(ui.regionOf(services)).toHaveAttribute('data-state', 'closed');
      expect(within(ui.regionOf(team)).getAllByRole('link')).toHaveLength(6);
      expect(
        Array.from(ui.regionOf(team).querySelectorAll('a'), (a) =>
          a.getAttribute('href'),
        ),
      ).toEqual(teamHrefs('ro'));

      await ui.user.click(services);
    });
    expect(taps).toEqual([
      opened('/ro/services/'),
      opened('/ro/team/'),
      opened('/ro/services/'),
    ]);
    expect(services).toHaveAttribute('aria-expanded', 'true');
    expect(team).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps a collapsed list unreachable: inert, invisible, no link in the accessibility tree', async () => {
    const ui = await mountPanel();
    for (const label of [ro.common.nav.services, ro.common.nav.team]) {
      const region = ui.regionOf(ui.rowOf(label));
      expect(region).toHaveAttribute('inert');
      expect(getComputedStyle(region).visibility).toBe('hidden');
      expect(region.getBoundingClientRect().height).toBe(0);
      expect(within(region).queryAllByRole('link')).toHaveLength(0);
    }
    // The panel's links are its four words — a collapsed list adds none
    // (the Contact is a button).
    expect(
      within(ui.panel)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      ro.common.nav.home,
      ro.common.nav.services,
      ro.common.nav.team,
      ro.common.nav.blog,
    ]);
  });

  it('frames the list with a hairline, never a tinted ground', async () => {
    const ui = await mountPanel();
    const services = ui.rowOf(ro.common.nav.services);
    await ui.user.click(services);
    const list = ui.regionOf(services).querySelector('ul') as HTMLElement;
    const style = getComputedStyle(list);
    expect(style.borderTopWidth).toBe('1px');
    expect(style.borderBottomWidth).toBe('1px');
    expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    // `role="list"`: a `list-style: none` list keeps its semantics in
    // Safari's VoiceOver.
    expect(list).toHaveAttribute('role', 'list');
  });

  it.each(modifiedClicks)(
    'leaves the menu OPEN on %s of an entry — a new tab, not this page’s jump',
    async (_form, modifiers) => {
      const ui = await mountPanel();
      const services = ui.rowOf(ro.common.nav.services);
      await ui.user.click(services);
      const entry = within(ui.regionOf(services)).getAllByRole('link')[0];
      expect(
        await whileRecording(() => {
          fireEvent.click(entry, modifiers);
        }),
      ).toEqual([leftToTheBrowser(servicesHrefs('ro')[0], null)]);
      expect(services).toHaveAttribute('aria-expanded', 'true');
    },
  );

  it('closes the whole menu BEFORE the browser follows an entry — page unfrozen, scroll unlocked, focus not on the burger', async () => {
    const ui = await mountPanel();
    expect(pageMain).toHaveAttribute('inert');
    expect(document.documentElement.style.overflow).toBe('hidden');
    const services = ui.rowOf(ro.common.nav.services);
    await ui.user.click(services);
    const target = within(ui.regionOf(services)).getByRole('link', {
      name: priceCategories[10].name.ro,
    });
    // At <body> — after React's handler, before the browser's default
    // action (`whileRecording`) — the menu must already be gone: the path
    // the open word takes too (NavMenu's closeForJump). The entry is tapped
    // right behind the opening tap: THE GUARD holds back the word alone,
    // never an entry.
    expect(await whileRecording(() => ui.user.click(target))).toEqual([
      entryFollowed(servicesHrefs('ro')[10]),
    ]);
    expect(ui.burger).toHaveAttribute('aria-expanded', 'false');
    // The jump decides where the keyboard goes next — not the burger.
    expect(document.activeElement).not.toBe(ui.burger);
  });

  it('opens with every list shut, whatever was open when it closed', async () => {
    const ui = await mountPanel();
    await ui.user.click(ui.rowOf(ro.common.nav.team));
    await ui.user.click(ui.burger);
    expect(document.getElementById('header-menu')).toBeNull();
    await ui.user.click(ui.burger);
    for (const label of [ro.common.nav.services, ro.common.nav.team]) {
      expect(ui.rowOf(label)).toHaveAttribute('aria-expanded', 'false');
    }
  });

  it.each(['an entry of its list', 'its open word'] as const)(
    'resets THE FLAG when %s is followed — the menu, opened again, has every list shut, and a tap on Servicii OPENS it, never goes',
    async (what) => {
      // A followed link closes the menu through NavMenu's closeForJump, not
      // its close(): that path must clear `expandedPath` too, or the panel
      // opened next would show Servicii's list open, and its first tap would
      // go to the page.
      const ui = await mountPanel();
      const services = ui.rowOf(ro.common.nav.services);
      expect(await whileRecording(() => ui.user.click(services))).toEqual([
        opened('/ro/services/'),
      ]);
      const word = what === 'its open word';
      const link = word
        ? services
        : within(ui.regionOf(services)).getAllByRole('link')[0];
      const href = word ? '/ro/services/' : servicesHrefs('ro')[0];
      // The word goes only past THE GUARD; an entry is never held.
      if (word) await pastTheGuard();
      expect(await whileRecording(() => ui.user.click(link))).toEqual([
        word ? followed(href) : entryFollowed(href),
      ]);
      expect(document.getElementById('header-menu')).toBeNull();

      // The menu opened again — a NEW panel, every list in it shut…
      await ui.user.click(ui.burger);
      for (const label of [ro.common.nav.services, ro.common.nav.team]) {
        expect(ui.rowOf(label)).toHaveAttribute('aria-expanded', 'false');
      }
      // …so a tap on Servicii opens its list again, never goes to the page.
      expect(
        await whileRecording(() =>
          ui.user.click(ui.rowOf(ro.common.nav.services)),
        ),
      ).toEqual([opened('/ro/services/')]);
      expect(ui.rowOf(ro.common.nav.services)).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    },
  );

  it('closes everything on Escape, focus back on the burger', async () => {
    const ui = await mountPanel();
    await ui.user.click(ui.rowOf(ro.common.nav.services));
    await ui.user.keyboard('{Escape}');
    expect(document.getElementById('header-menu')).toBeNull();
    expect(document.activeElement).toBe(ui.burger);
  });

  it('turns the glyph over with the row’s own state — React’s classes, read as the computed rotation', async () => {
    // From React state since 2026-10-16 — classes here, from `expanded` (the
    // bar's arrow turns from React state too, by an inline style: its
    // NavDropdown.tsx THE LOAD RACE): the `group` reading of the old ⌄'s
    // aria-expanded went with ui/GlyphButton, whose marker it read.
    const ui = await mountPanel();
    const services = ui.rowOf(ro.common.nav.services);
    const glyph = services.querySelector('svg') as SVGElement;
    const classes = () => (glyph.getAttribute('class') ?? '').split(/\s+/);
    expect(classes()).toContain('rotate-90');
    expect(classes()).not.toContain('-rotate-90');
    expect(classes().some((c) => c.startsWith('group-'))).toBe(false);
    expect(getComputedStyle(glyph).rotate).toBe('90deg');
    await ui.user.click(services);
    expect(classes()).toContain('-rotate-90');
    expect(classes()).not.toContain('rotate-90');
    expect(getComputedStyle(glyph).rotate).toBe('-90deg');
    // Shut again by the other row's opening — this word, its list open,
    // would go to its page.
    await ui.user.click(ui.rowOf(ro.common.nav.team));
    expect(getComputedStyle(glyph).rotate).toBe('90deg');
    // Decoration: hidden from assistive technology, inside its hidden box.
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
    expect(glyph.parentElement).toHaveAttribute('aria-hidden', 'true');
    expect((glyph.getAttribute('class') ?? '').split(/\s+/)).toContain(
      'motion-reduce:transition-none',
    );
  });

  describe('on a short screen', () => {
    beforeAll(async () => {
      await browser.viewport(390, 500);
    });
    afterAll(async () => {
      await browser.viewport(390, 844);
    });

    it('scrolls the PANEL — never the page — to show the end of a list the KEYBOARD opened', async () => {
      const ui = await mountPanel();
      const team = ui.rowOf(ro.common.nav.team);
      const scrollY = window.scrollY;
      expect(ui.panel.scrollTop).toBe(0);
      // Opened by the KEYBOARD: THE REVEAL is the keyboard's alone since
      // 2026-10-26 (NavAccordion.tsx's THE REVEAL; a pointer's open is the
      // next test). Focused WITHOUT a scroll — a plain focus() scrolls the
      // page itself when the row sits in the root's scroll-padding, the
      // runner's motion, not the panel's — then a real Enter: a click of
      // button 0 whose `detail` is 0. The list shut, it opens (the row holds
      // the link back).
      team.focus({ preventScroll: true });
      expect(await whileRecording(() => realUser.keyboard('{Enter}'))).toEqual([
        opened('/ro/team/'),
      ]);
      const list = ui.regionOf(team).querySelector('ul') as HTMLElement;
      await expect
        .poll(
          () => {
            const panel = ui.panel.getBoundingClientRect();
            return (
              list.getBoundingClientRect().bottom <=
              panel.top + ui.panel.clientTop + ui.panel.clientHeight + 0.5
            );
          },
          { timeout: REVEAL_AFTER_MS + 2000 },
        )
        .toBe(true);
      expect(ui.panel.scrollTop).toBeGreaterThan(0);
      expect(window.scrollY).toBe(scrollY);
      // The row itself is still in view.
      const row = team.getBoundingClientRect();
      expect(row.top).toBeGreaterThanOrEqual(
        ui.panel.getBoundingClientRect().top,
      );
    });

    it('leaves the panel STILL for a list a POINTER opened — the word stays under the finger, and a second tap on the same spot goes to the page', async () => {
      // The React review's MEDIUM (2026-10-26, measured on the built export
      // at 390×664, 375×667 and 844×390): the reveal scrolled the panel 100px
      // after a tap on „Servicii", the word slid away, and a second tap on
      // the same spot landed on the entry „Urgențe" — not the page.
      const ui = await mountPanel();
      const services = ui.rowOf(ro.common.nav.services);
      const scrollY = window.scrollY;
      expect(ui.panel.scrollTop).toBe(0);
      const before = services.getBoundingClientRect();
      // The spot a finger taps: the row's centre.
      const x = before.left + before.width / 2;
      const y = before.top + before.height / 2;

      // A POINTER's click — user-event counts it, `detail` 1.
      expect(await whileRecording(() => ui.user.click(services))).toEqual([
        opened('/ro/services/'),
      ]);
      // THE PREMISE: the list ends past the panel's visible bottom — a
      // reveal WOULD have scrolled the panel here.
      const list = ui.regionOf(services).querySelector('ul') as HTMLElement;
      const panelBox = ui.panel.getBoundingClientRect();
      expect(list.getBoundingClientRect().bottom).toBeGreaterThan(
        panelBox.top + ui.panel.clientTop + ui.panel.clientHeight,
      );

      // Well past the reveal's moment and the glide it would start — and past
      // THE GUARD's half second, so the second tap below goes: on every
      // frame the panel unscrolled, the word where it was, the page still.
      expect(REVEAL_AFTER_MS + 600).toBeGreaterThan(FOLLOW_AFTER_MS);
      expect(
        await largestOver(REVEAL_AFTER_MS + 600, () => ({
          panelScrollTop: ui.panel.scrollTop,
          wordMoved: Math.abs(
            services.getBoundingClientRect().top - before.top,
          ),
          pageMoved: Math.abs(window.scrollY - scrollY),
        })),
      ).toEqual({ panelScrollTop: 0, wordMoved: 0, pageMoved: 0 });

      // The same spot is still the word…
      const hit = document.elementFromPoint(x, y);
      if (!hit) throw new Error('nothing is drawn at the tapped spot');
      expect(hit.closest('a')).toBe(services);
      // …and the second tap there goes to the page.
      expect(await whileRecording(() => ui.user.click(hit))).toEqual([
        followed('/ro/services/'),
      ]);
    });
  });
});

describe('THE REVEAL’S CLOCK is the list’s opening transition (KEEP-IN-SYNC)', () => {
  beforeAll(async () => {
    await browser.viewport(390, 844);
    still.remove();
  });
  afterAll(() => {
    freeze();
  });

  it('waits exactly as long as the list takes to open', async () => {
    const user = userEvent.setup();
    render(<Mounted locale="ro" />);
    await user.click(
      screen.getByRole('button', { name: ro.common.menu.label }),
    );
    // The row IS the word — the link named „Servicii" (a <button> from
    // 2026-10-16 to 2026-10-26); its first tap opens the list.
    const services = within(
      document.getElementById('header-menu') as HTMLElement,
    ).getByRole('link', { name: ro.common.nav.services });
    await user.click(services);
    const region = document.getElementById(
      services.getAttribute('aria-controls') ?? '',
    ) as HTMLElement;
    const style = getComputedStyle(region);
    expect(style.transitionProperty).toBe('grid-template-rows, visibility');
    expect(style.transitionDuration).toBe(`${REVEAL_AFTER_MS / 1000}s, 0s`);
    expect(style.transitionTimingFunction).toBe(
      'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    );
  });
});
