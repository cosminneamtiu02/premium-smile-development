import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { page } from 'vitest/browser';
// The REAL stylesheet, compiled by the site's own Tailwind pipeline — the
// reason this file exists apart from Header.test.tsx (the header below).
// tests/setup/components.ts loads no CSS globally; the per-file import is the
// house pattern (ContactModal, PriceList, PostList).
import '@/styles/globals.css';
import { ContactModalProvider } from '@/components/sections/ContactModal/ContactModalProvider';
import { type Locale, locales } from '@/i18n/locales';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it_ from '@/messages/it.json';
import ro from '@/messages/ro.json';
import { Header } from './Header';

// sections/Header — THE BAR'S STEP, MEASURED IN EVERY LANGUAGE (2026-10-14).
// The blog's link joined every language's row that day ("internationalise and
// add that blog on eveyer language"), so all five rows have four links, and
// the step has to keep the owner's air in each of them: "at least a little
// space between 'premium smile' and first button of menu, like idk, 70% of
// the width of the menu button" (2026-09-26). Header.tsx's THE FIVE ROWS GREW
// carries the table this file holds.
//
// ── WHY A FILE OF ITS OWN. Header.test.tsx pins the bar's class TOKENS with
// no stylesheet loaded — its one premise, which every component suite in the
// repo shares. A gap, a centre line and an overlap are COMPUTED things, so
// they need the sheet, and a label's width needs the real FACE, because a
// fallback serif sets other widths. One premise per file (the
// *.scale.test.tsx split).
//
// ── HOW THE BAR IS HELD AT THE STEP. The step is a container query on the
// bar itself (`@min-[62rem]:`, `@container (width >= 62rem)`), so a bar whose
// CONTENT box is exactly 62rem IS the step, in any window: the <header> loses
// its gutter margins and takes a border-box width of 62rem + its two 1px
// borders, set inline. Which WINDOW lands there — 0.8 × the window − the
// scrollbar gutter − 2px — is tests/e2e/header-step.spec.ts' question, on the
// built export; this file asks what the bar does once it is there.
//
// ── WHAT IS HELD, per language (Chromium, the real Source Serif 4):
//   · at exactly 62rem the row is drawn and the burger is not; the gap from
//     the brand's PAINTED edge (its last child, the name — never the link's
//     own box) to the first link is at least 70 % of that link — French the
//     nearest, 65.5px against 54.2 —, the nav sits on the bar's centre line,
//     the Contact button stays clear of the row and inside it, and nothing
//     scrolls sideways;
//   · a pixel under it the row is gone and the burger drawn;
//   · under WCAG 1.4.12's text-spacing overrides at 62rem (line height 1.5,
//     letter spacing 0.12em, word spacing 0.16em, paragraphs 2em apart) every
//     row presses the brand's track down to the brand's own width and sits
//     against it, box to box, so the ink stays apart by the link's own `px-2`
//     (8px, measured) — nothing may overlap, nothing may scroll sideways, and
//     the Contact button still clears the row.
// The pathname is mocked at '@/i18n/navigation', Header.test.tsx's boundary
// (its HARNESS NOTE): no route is current but Services, as on /services/.

vi.mock('@/i18n/navigation', () => ({ usePathname: () => '/services/' }));

const MESSAGES: Record<Locale, typeof ro> = { ro, en, de, fr, it: it_ };

/** The bar's step in rem — Header.tsx's THE COUPLED SPELLINGS lists it. */
const STEP_REM = 62;

// The REAL typeface: the declarations .storybook/preview-fonts.css makes for
// Storybook, verbatim apart from the URL — this runner serves the repo from
// its root — and `font-display: block`, so a fallback is never measured. The
// mono face is not copied: nothing in the bar uses it. Then THE STILLNESS: an
// unlayered `transition: none` beats the layered utilities.
const SERIF = 'Source Serif 4 SB';
const INJECTED_CSS = `
@font-face {
  font-family: '${SERIF}';
  src: url('/src/fonts/SourceSerif4Variable-subset.woff2') format('woff2');
  font-weight: 200 900;
  font-style: normal;
  font-display: block;
}
:root { --font-source-serif: '${SERIF}'; }
*, *::before, *::after { transition: none; }
`;

/** WCAG 1.4.12's four overrides — the W3C's own bookmarklet values. */
const TEXT_SPACING_CSS =
  '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; ' +
  'word-spacing: 0.16em !important; } ' +
  'p { margin-bottom: 2em !important; }';

let injected: HTMLStyleElement | null = null;
let spacing: HTMLStyleElement | null = null;
let window0 = { width: 0, height: 0 };
let lang0: string | null = null;

beforeAll(async () => {
  // Recorded FIRST, so `afterAll` can put the window back even when a
  // premise below fails.
  window0 = { width: window.innerWidth, height: window.innerHeight };
  lang0 = document.documentElement.getAttribute('lang');
  // A laptop's window, wide enough for the bar: nothing inside the bar reads
  // the window, but a document narrower than the bar would scroll sideways
  // around it.
  await page.viewport(1366, 900);
  injected = document.createElement('style');
  injected.textContent = INJECTED_CSS;
  document.head.append(injected);
  // load(), not just ready: nothing has rendered yet, so there is no pending
  // font for `ready` to wait on — and a 404 on the subset REJECTS here,
  // loudly, instead of silently downgrading every width below to a fallback.
  await document.fonts.load(`500 1rem "${SERIF}"`);
  await document.fonts.load(`1rem "${SERIF}"`);
  await document.fonts.ready;
});

afterEach(() => {
  spacing?.remove();
  spacing = null;
});

afterAll(async () => {
  injected?.remove();
  injected = null;
  if (lang0 === null) document.documentElement.removeAttribute('lang');
  else document.documentElement.lang = lang0;
  await page.viewport(window0.width, window0.height);
});

const rem = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);

/** The node a query found — or a failure that NAMES what went missing. */
const htmlElement = (
  node: Element | null | undefined,
  name: string,
): HTMLElement => {
  if (!(node instanceof HTMLElement))
    throw new Error(`Header.step: no ${name}`);
  return node;
};

const shown = (element: Element): boolean =>
  getComputedStyle(element).display !== 'none';

/** The box of an element's first or last non-blank text node — its INK's
 *  horizontal extent, where the element's own box carries padding. */
const textBox = (element: Element, which: 'first' | 'last'): DOMRect => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes: Node[] = [];
  while (walker.nextNode()) {
    if ((walker.currentNode.textContent ?? '').trim() !== '') {
      nodes.push(walker.currentNode);
    }
  }
  const node = which === 'first' ? nodes.at(0) : nodes.at(-1);
  if (!node) throw new Error('Header.step: an element with no text');
  const range = document.createRange();
  range.selectNodeContents(node);
  return range.getBoundingClientRect();
};

/** The Header as the shell mounts it: the locale's messages and the one
 *  ContactModalProvider its two Contact triggers need (Header.test.tsx's
 *  ① and ②). */
const Mounted = ({ locale }: { locale: Locale }): ReactElement => (
  <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
    <ContactModalProvider>
      <Header />
    </ContactModalProvider>
  </NextIntlClientProvider>
);

/**
 * The Header in `locale`, its bar's CONTENT box held at `barPx` (the file
 * header's HOW THE BAR IS HELD AT THE STEP), and the parts this file reads.
 */
const mountAt = (locale: Locale, barPx: number) => {
  document.documentElement.lang = locale;
  const { container } = render(<Mounted locale={locale} />);
  const header = htmlElement(container.querySelector('header'), '<header>');
  header.style.marginInline = '0';
  header.style.width = `${barPx + 2}px`;
  // The row's <nav> — the panel's is not mounted while the menu is closed.
  const nav = htmlElement(header.querySelector('nav'), 'nav row');
  // The brand lockup: the one <a> wrapping the artwork <img> — found through
  // the artwork, never through its href (the AtTheStep story's idiom).
  const brand = htmlElement(header.querySelector('img')?.closest('a'), 'brand');
  const cta = htmlElement(
    header.querySelector('button[aria-haspopup="dialog"]'),
    'Contact button',
  );
  // The burger is the one toggle that controls the PANEL, and the row's links
  // are its own WORDS, each a direct child of its <li>: since the dropdowns
  // (2026-10-15, CLAUDE.md §15.40) the row also holds the ⌄ toggles, which
  // carry aria-expanded too and come first in the DOM, and the cards' links,
  // laid out under the bar while closed — neither belongs to the row's
  // geometry (tests/e2e/header-step.spec.ts reads the bar the same way).
  const burger = htmlElement(
    header.querySelector('button[aria-controls="header-menu"]'),
    'burger',
  );
  const links = Array.from(
    nav.querySelectorAll(':scope > ul > li > a[href]'),
    (link) => htmlElement(link, 'nav link'),
  );
  // No unmount: tests/setup/components.ts cleans up after every case.
  return { header, nav, brand, cta, burger, links };
};

describe("Header — the bar's step holds the owner's air in every language (2026-10-14)", () => {
  it.each(locales)(
    '%s: at exactly 62rem the four-link row is drawn, 70 % of its first link clear of the brand',
    (locale) => {
      const bar = mountAt(locale, STEP_REM * rem());
      // The premise: the bar's content box IS the step, to the pixel.
      expect(bar.header.clientWidth).toBeCloseTo(STEP_REM * rem(), 1);

      expect(shown(bar.nav), 'the row').toBe(true);
      expect(shown(bar.burger), 'the burger').toBe(false);
      expect(shown(htmlElement(bar.cta.parentElement, 'CTA box'))).toBe(true);
      // The row measured is the four-link row, the blog last.
      expect(bar.links.map((link) => link.textContent)).toEqual([
        MESSAGES[locale].common.nav.home,
        MESSAGES[locale].common.nav.services,
        MESSAGES[locale].common.nav.team,
        MESSAGES[locale].common.nav.blog,
      ]);

      // THE OWNER'S FLOOR, in this language: the air between what the brand
      // PAINTS and the first link's box is at least 70 % of that box.
      const brandRight = Math.max(
        ...Array.from(
          bar.brand.children,
          (child) => child.getBoundingClientRect().right,
        ),
      );
      const first = bar.links[0].getBoundingClientRect();
      expect(first.left - brandRight).toBeGreaterThanOrEqual(0.7 * first.width);

      // The nav on the bar's centre line — every side track is wider than
      // the brand at the step — and the Contact button clear of the row and
      // inside the bar's content box (its `px-4`).
      const h = bar.header.getBoundingClientRect();
      const n = bar.nav.getBoundingClientRect();
      const c = bar.cta.getBoundingClientRect();
      expect(
        Math.abs((n.left + n.right) / 2 - (h.left + h.right) / 2),
      ).toBeLessThanOrEqual(1);
      expect(c.left).toBeGreaterThanOrEqual(n.right);
      expect(c.right).toBeLessThanOrEqual(h.right - 1 - rem() + 0.5);
      // §7 — nothing may require horizontal scrolling.
      expect(bar.header.scrollWidth).toBeLessThanOrEqual(
        bar.header.clientWidth,
      );
    },
  );

  it.each(locales)(
    '%s: a pixel under 62rem the row is gone and the burger drawn',
    (locale) => {
      const bar = mountAt(locale, STEP_REM * rem() - 1);
      expect(shown(bar.nav), 'the row').toBe(false);
      expect(shown(htmlElement(bar.cta.parentElement, 'CTA box'))).toBe(false);
      expect(shown(bar.burger), 'the burger').toBe(true);
    },
  );

  it.each(locales)(
    '%s: under WCAG 1.4.12 text spacing at 62rem nothing overlaps and nothing scrolls sideways',
    (locale) => {
      spacing = document.createElement('style');
      spacing.textContent = TEXT_SPACING_CSS;
      document.head.append(spacing);
      const bar = mountAt(locale, STEP_REM * rem());

      expect(shown(bar.nav), 'the row').toBe(true);
      // The brand's track floors at the brand's own width (the mark counts
      // since 2026-10-01 — Header.tsx's RECORDED TRADE-OFF), so the row
      // moves right of centre rather than under the brand: box to box never
      // negative, and the ink apart by the first link's own padding.
      const brandRight = Math.max(
        ...Array.from(
          bar.brand.children,
          (child) => child.getBoundingClientRect().right,
        ),
      );
      const first = bar.links[0];
      expect(first.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        brandRight - 0.5,
      );
      expect(textBox(first, 'first').left).toBeGreaterThan(
        textBox(bar.brand, 'last').right,
      );
      // The Contact button still clears the row, and the bar never scrolls.
      expect(bar.cta.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        bar.nav.getBoundingClientRect().right,
      );
      expect(bar.header.scrollWidth).toBeLessThanOrEqual(
        bar.header.clientWidth,
      );
    },
  );
});
