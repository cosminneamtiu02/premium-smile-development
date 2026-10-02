import { expect, type Page, test } from '@playwright/test';

// THE BAND SCALE on the Services page, against the built export (owner,
// 2026-10-02 — "i need this responsiveness refactor also on the prices page.
// the best ration i see is on 1392 x 1179. so i do not want the cards jsut to
// wide, i want the menu and cards to adapt too with the width of the screen";
// CLAUDE.md §15.32 round 2). The price list wears ui/Container's THE BAND
// SCALE on a laptop or desktop: its menu card and its eleven category cards are
// ONE design drawn at a 1106px column and scaled to the page's column (capped at
// a 96rem column, centred), so the cards no longer widen alone while the words
// keep their size. The owner's 1392 window is a 1098.6px column under the
// classic scrollbar — 0.7 % under the reference the Home and Team bands share,
// so the page joins that one design pixel. On every phone, every touch tablet
// and every window under the step, nothing changes.
//
// THE FLOOR (the owner's delegated decision, 2026-10-02 — "decide for me on
// decisions and create pr"): the band never draws SMALLER than the theme — its
// pixel is max(1rem / 16, column / 1106) — so up to the reference (the owner's
// 1392 window among them) it IS develop's look, and only past it does it grow.
// His own BACKLOG entry asks for larger price text for older patients, never
// smaller.
//
// TWO LENGTHS DO NOT SCALE, BY DESIGN: the stuck menu's top (8.5rem = 136px)
// and a card's landing margin (2.5rem) are spelled from the Header pill's reach
// (6rem, the global scroll-padding-top), and the pill does not scale — so the
// menu rests 136px down at every width, clear of the pill's aura (y 126).
//
// WHY THE BUILT EXPORT: the scale is real CSS — a registered custom property,
// container queries, `@supports` and `(pointer: fine)` — resolved by the engine
// against the page a visitor downloads; nothing here is a screenshot (the
// band-scale spec's idiom, whose THE NUMBERS this file follows: s = min(column,
// 1536) / 1106, `column` read off the page, so the checks hold under a classic
// scrollbar and under overlay ones alike).

type Locale = 'ro' | 'de';

const BROWSER_LOCALE: Record<Locale, string> = { ro: 'ro-RO', de: 'de-DE' };

/** Laptop and desktop windows — the regime, on a mouse device; the owner's
 *  1392 × 1179 among them. */
const LAPTOPS = [
  { width: 1140, height: 800 },
  { width: 1280, height: 800 },
  { width: 1392, height: 1179 },
  { width: 1401, height: 1063 },
  { width: 1536, height: 864 },
  { width: 1882, height: 1141 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
] as const;

/** The band's design sizes, in design pixels — what develop drew at a 1106px
 *  column (measured on its build, 2026-10-02): the menu card's 15rem track, the
 *  gap, the menu's title (the `band` step under its card's 28rem container
 *  step) and links (text-lg in a min-h-11 box), a card's title (`band` from the
 *  step) and eyebrow, a row's text. The cards column is what the band leaves
 *  them — its width less the menu and the gap: 834 design px at the reference
 *  (1106 − 240 − 32), and under it, where THE FLOOR holds s at 1, the band's own
 *  width less 272 (625px at a 1140 window, as on develop). */
const DESIGN = {
  menu: 240,
  gap: 32,
  menuTitle: 30,
  link: 18,
  linkBox: 44,
  cardTitle: 36,
  eyebrow: 14,
  row: 16,
} as const;

/** The pill-coupled pair, in CSS px at the default root: never scaled. */
const STUCK_TOP = 136;
const LANDING = 40;
const AIR = 16;

interface BandShape {
  readonly pointerFine: boolean;
  readonly sideways: number;
  readonly column: { readonly left: number; readonly width: number };
  readonly scalePx: string;
  readonly menu: {
    readonly left: number;
    readonly width: number;
    readonly height: number;
  };
  readonly menuTitle: number;
  readonly link: { readonly size: number; readonly height: number };
  readonly cards: { readonly left: number; readonly width: number };
  readonly cardTitle: number;
  readonly eyebrow: number;
  readonly row: number;
  readonly landing: string;
  /** Whether the regime REDREW the band: its `--spacing` differs from the
   *  root's. Under THE FLOOR a redrawn band and an untouched one draw alike,
   *  and `--scale-px` reads 1px in both (its registered initial value) — so
   *  this is the one reading that tells the floor from a gate that never
   *  opened (the G2 react and typescript reviews). */
  readonly remapped: boolean;
}

/** The band as it is laid out right now. */
const readBand = (page: Page): Promise<BandShape> =>
  page.evaluate(() => {
    const size = (element: Element | null | undefined): number =>
      element ? parseFloat(getComputedStyle(element).fontSize) : Number.NaN;
    const nav = document.querySelector('main nav[aria-labelledby]');
    const rhythm = nav?.parentElement;
    const column = rhythm?.parentElement;
    const cardsColumn = rhythm?.children[1];
    const card = cardsColumn?.firstElementChild;
    const title = card?.querySelector('h2');
    const link = nav?.querySelector('ul a');
    if (
      !nav ||
      !rhythm ||
      !column ||
      !cardsColumn ||
      !card ||
      !title ||
      !link
    ) {
      throw new Error('the price band is missing a part this spec reads');
    }
    const box = (element: Element): DOMRect => element.getBoundingClientRect();
    // A card's landing margin AS THE STYLESHEET SPELLS IT: lib/scroll-spy's
    // reading line writes each card's planned margin inline, so it is lifted
    // for the read and put back.
    if (!(card instanceof HTMLElement)) {
      throw new Error('the first price card is not an HTML element');
    }
    const planned = card.style.scrollMarginTop;
    card.style.scrollMarginTop = '';
    const landing = getComputedStyle(card).scrollMarginTop;
    card.style.scrollMarginTop = planned;
    const spacing = (element: Element): string =>
      getComputedStyle(element).getPropertyValue('--spacing').trim();
    return {
      pointerFine: matchMedia('(pointer: fine)').matches,
      sideways:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      column: { left: box(column).left, width: box(column).width },
      scalePx: getComputedStyle(rhythm).getPropertyValue('--scale-px').trim(),
      menu: {
        left: box(nav).left,
        width: box(nav).width,
        height: box(nav).height,
      },
      menuTitle: size(nav.querySelector('h2')),
      link: { size: size(link), height: box(link).height },
      cards: { left: box(cardsColumn).left, width: box(cardsColumn).width },
      cardTitle: size(title),
      eyebrow: size(title.previousElementSibling),
      row: size(card.querySelector('dt')),
      landing,
      remapped: spacing(rhythm) !== spacing(document.documentElement),
    };
  });

/** A fresh load at one window, the typefaces in. */
async function openAt(
  page: Page,
  path: string,
  viewport: { width: number; height: number },
): Promise<void> {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(path);
  await page.waitForSelector('main nav[aria-labelledby]');
  await page.evaluate(() => document.fonts.ready);
}

/** Where the stuck menu rests a third of the way down the page, and whether
 *  the rail had to hold it (a menu taller than the window less its line). */
async function restingMenu(
  page: Page,
): Promise<{ readonly top: number; readonly rail: string | null }> {
  await page.evaluate(() =>
    scrollTo(0, Math.round(document.documentElement.scrollHeight / 3)),
  );
  await page.waitForTimeout(400);
  return page.evaluate(() => {
    const nav = document.querySelector('main nav[aria-labelledby]');
    if (!nav) throw new Error('the price menu is missing');
    return {
      top: nav.getBoundingClientRect().top,
      rail: nav.getAttribute('data-rail'),
    };
  });
}

/** Skips a block on every project but the laptop's: these blocks set their
 *  own windows, so a second project would only repeat them. */
const onLaptopOnly = (): void => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'laptop-1366x633',
      'this block sets its own windows; one project is enough',
    );
  });
};

for (const locale of ['ro', 'de'] as const) {
  const at = `/${locale}/services/`;

  test.describe(`${at} — THE BAND SCALE on a laptop or desktop`, () => {
    test.use({ locale: BROWSER_LOCALE[locale] });
    onLaptopOnly();

    for (const viewport of LAPTOPS) {
      test(`at ${viewport.width} × ${viewport.height}: the menu and the cards are ONE design × s, the stuck menu still 136px down`, async ({
        page,
      }) => {
        await openAt(page, at, viewport);
        const band = await readBand(page);
        expect(band.pointerFine).toBe(true);
        expect(band.remapped, 'the regime redrew the band').toBe(true);
        expect(band.sideways, 'sideways scroll').toBeLessThanOrEqual(0);
        // THE FLOOR: never under the theme's own pixel (1px at this root).
        const s = Math.max(1, Math.min(band.column.width, 1536) / 1106);
        expect(parseFloat(band.scalePx)).toBeCloseTo(s, 3);
        // The two tracks and the gap between them, design × s.
        expect(band.menu.width).toBeCloseTo(DESIGN.menu * s, 0);
        expect(band.cards.width).toBeCloseTo(
          Math.min(band.column.width, 1536) - (DESIGN.menu + DESIGN.gap) * s,
          0,
        );
        expect(
          band.cards.left - (band.menu.left + band.menu.width),
        ).toBeCloseTo(DESIGN.gap * s, 0);
        // Past the cap the band centres in its column.
        expect(band.menu.left - band.column.left).toBeCloseTo(
          (band.column.width - Math.min(band.column.width, 1536)) / 2,
          0,
        );
        // Every word, design × s.
        expect(band.menuTitle).toBeCloseTo(DESIGN.menuTitle * s, 1);
        expect(band.link.size).toBeCloseTo(DESIGN.link * s, 1);
        expect(band.link.height).toBeCloseTo(DESIGN.linkBox * s, 0);
        expect(band.cardTitle).toBeCloseTo(DESIGN.cardTitle * s, 1);
        expect(band.eyebrow).toBeCloseTo(DESIGN.eyebrow * s, 1);
        expect(band.row).toBeCloseTo(DESIGN.row * s, 1);
        // The pill-coupled pair does not scale.
        expect(band.landing).toBe(`${LANDING}px`);
        const resting = await restingMenu(page);
        if (STUCK_TOP + band.menu.height + AIR <= viewport.height) {
          expect(
            resting.rail,
            'a menu that fits is held by CSS alone',
          ).toBeNull();
          expect(resting.top).toBeCloseTo(STUCK_TOP, 0);
        } else {
          // Taller than the window less its line: the rail holds it, never a
          // scroll container (lib/sticky-rail; price-menu-pin.spec covers it).
          expect(resting.rail).not.toBeNull();
        }
      });
    }

    test('at the owner’s 1392 × 1179 window the band IS what develop drew there — the floor holds it at the theme', async ({
      page,
    }) => {
      await openAt(page, at, { width: 1392, height: 1179 });
      const band = await readBand(page);
      // THE PREMISE (the G2 typescript review): only under the classic 15px
      // scrollbar is a 1392 window's column (1098.6px) at or under the 1106
      // reference; with overlay scrollbars it is 1113.6px and s = 1.007, which
      // the LAPTOPS loop above already covers with a measured s.
      test.skip(
        band.column.width > 1106,
        'needs a classic 15px scrollbar: only then is a 1392 window at or under the reference',
      );
      // The regime RAN — the floor, not a gate that never opened, is what
      // keeps develop's look here.
      expect(band.remapped).toBe(true);
      // develop at 1392: a 240px menu, 18px links on 44px boxes, 36px card
      // titles, 16px rows — measured on its build, 2026-10-02.
      expect(band.scalePx).toBe('1px');
      expect(band.menu.width).toBe(240);
      expect(band.link.size).toBe(18);
      expect(band.link.height).toBe(44);
      expect(band.cardTitle).toBe(36);
      expect(band.row).toBe(16);
    });
  });

  test.describe(`${at} — UNCHANGED where the scale does not apply`, () => {
    test.use({ locale: BROWSER_LOCALE[locale] });
    onLaptopOnly();

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
    ] as const) {
      test(`a ${viewport.width}px window (under the step): the theme’s own sizes, nothing declared`, async ({
        page,
      }) => {
        await openAt(page, at, viewport);
        const band = await readBand(page);
        expect(band.sideways, 'sideways scroll').toBeLessThanOrEqual(0);
        expect(band.scalePx).toBe('1px');
        expect(band.remapped, 'nothing redrawn').toBe(false);
        expect(band.link.size).toBe(DESIGN.link);
        expect(band.link.height).toBe(DESIGN.linkBox);
        expect(band.eyebrow).toBe(DESIGN.eyebrow);
        expect(band.row).toBe(DESIGN.row);
        expect(band.landing).toBe(`${LANDING}px`);
        // Stacked: the menu is the column's width, above the cards.
        expect(band.menu.width).toBeCloseTo(band.column.width, 0);
      });
    }

    for (const tablet of [
      { width: 1180, height: 820 },
      { width: 1366, height: 1024 },
    ] as const) {
      test.describe(`a ${tablet.width} × ${tablet.height} touch tablet`, () => {
        test.use({ viewport: tablet, hasTouch: true, isMobile: true });

        test('declares nothing — the menu and the cards the theme’s own size (the owner: “Touch devices unchanged”)', async ({
          page,
        }) => {
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await page.goto(at);
          await page.waitForSelector('main nav[aria-labelledby]');
          await page.evaluate(() => document.fonts.ready);
          const band = await readBand(page);
          expect(band.pointerFine).toBe(false);
          expect(band.scalePx).toBe('1px');
          expect(band.remapped, 'nothing redrawn').toBe(false);
          expect(band.menu.width).toBe(DESIGN.menu);
          expect(band.menuTitle).toBe(DESIGN.menuTitle);
          expect(band.link.size).toBe(DESIGN.link);
          expect(band.cardTitle).toBe(DESIGN.cardTitle);
          expect(band.row).toBe(DESIGN.row);
          expect(band.landing).toBe(`${LANDING}px`);
        });
      });
    }
  });
}
