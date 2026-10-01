import { expect, type Page, test } from '@playwright/test';

// THE HEADER'S STEP, against the built export (owner, 2026-09-26 — "it should
// maintain at least a little space between 'premium smile' and first button
// of menu … if not fit due to thinning web tab or screen size, switch to
// dropdown menu"). sections/Header's breakpoint is a container step measured
// on the BAR, not the window — 62rem of content box since 2026-10-01 (60rem
// from the header-nav-gap lane of 2026-09-26 until the owner's sizes grew the
// brand to 270.1px), the smallest whole rem that keeps a German gap of 4rem at
// the flip (Header.tsx's "THE BREAKPOINT IS A CONTAINER STEP" block carries the
// arithmetic). The pill's side margins are 10vw each and `vw` counts the
// scrollbar gutter while the containing block does not, so in a window V wide
// the bar's content box is 0.8 × V − gutter − 2px of borders: the step lands
// at ≈1261px with the 15px classic gutter Chromium reserves
// (`scrollbar-gutter: stable`), ≈1243 without one. The two windows below
// straddle it with real margins on BOTH sides, gutter or no gutter: at 1220
// the bar is 959–974px (18–33px under the step), at 1280 it is 1007–1022px
// (15–30px over) — so neither an engine's scrollbar width nor the pill's 2px
// of borders can move the answer (G2, 2026-09-26: the first cut sat 2px under
// the step on a scrollbar-less engine, and those 2px were the borders). The
// third window is the project's own laptop, where the row is comfortably
// centred. Both locales the bar calibrates against run: Romanian, the default,
// and German, the longest (§8.4).
//
// Nothing here is a screenshot; the assertions are geometry and DOM, the
// price-menu spec's idiom (playwright.e2e.config.ts says why this suite is
// separate from the visual net).

/** 4rem — the floor the step was chosen for (Header.tsx). */
const GAP = 64;
/** Below → the burger; above → the row (the header comment has the margins). */
const BELOW = 1220;
const ABOVE = 1280;

interface Bar {
  readonly rowShown: boolean;
  readonly burgerShown: boolean;
  readonly ctaShown: boolean;
  /** First nav link's left edge minus the brand lockup's painted right edge. */
  readonly gap: number | null;
  /** The centre of the links' span (first left edge to last right edge)
   *  minus the bar's centre. */
  readonly navOffCentre: number | null;
  readonly overflowsSideways: boolean;
}

const readBar = (page: Page): Promise<Bar> =>
  page.evaluate(() => {
    const header = document.querySelector('header') as HTMLElement;
    const shown = (el: Element | null): boolean =>
      el !== null && getComputedStyle(el).display !== 'none';
    // The brand corner is sections/Wordmark's lockup: the one <a> in the bar
    // wrapping an <img> (the artwork; D10 renders every part at every width).
    // NOT "the <a> without an href" — D9's placeholder state is FINAL since
    // the owner dropped the home-link wiring (2026-09-06), and a selector
    // keyed on an absence would be the wrong idiom anyway (G2, 2026-09-26).
    // The gap is measured from what the lockup PAINTS — the right edge of its
    // last child, the name — never from the anchor's own box: WebKit sizes
    // that box from the artwork's natural width (301.5px around the 258.5px
    // the demo cat's lockup painted, measured 2026-09-26; at the owner's sizes
    // of 2026-10-01 — the clinic's mark at 68.85% of the row, the name at
    // 30px, sections/Wordmark — the lockup is ~270px and the German gap at the
    // step ~56px, under the floor until the owner rules on the fitting —
    // Header.tsx, THE BRAND GREW) and Firefox lets the brand's cell span
    // its whole track, so a box edge would misreport the air between "Smile"
    // and the first link. Chromium is the only engine this suite runs today;
    // the measurement is engine-proof anyway.
    const brand = header.querySelector('img')?.closest('a');
    if (!brand) {
      throw new Error(
        'the bar has no brand lockup (an <img> inside an <a>) — sections/Wordmark changed shape; update readBar',
      );
    }
    const brandRight =
      brand.children.length > 0
        ? Math.max(
            ...Array.from(
              brand.children,
              (c) => c.getBoundingClientRect().right,
            ),
          )
        : null;
    const nav = header.querySelector('nav') as HTMLElement;
    const links = [...nav.querySelectorAll<HTMLAnchorElement>('a[href]')];
    const burger = header.querySelector('button[aria-expanded]');
    // The bar's Contact trigger sits in a section-owned wrapper box that
    // carries the breakpoint (Header.tsx: "WHY THE VISIBILITY LIVES ON A
    // WRAPPER AND NOT ON THE BUTTON").
    const cta = header.querySelector('button[aria-haspopup="dialog"]');
    const rowShown = shown(nav);
    const hb = header.getBoundingClientRect();
    const first = links.at(0)?.getBoundingClientRect();
    const last = links.at(-1)?.getBoundingClientRect();
    return {
      rowShown,
      burgerShown: shown(burger),
      ctaShown: cta !== null && shown(cta.parentElement),
      gap:
        rowShown && first && brandRight !== null
          ? first.left - brandRight
          : null,
      navOffCentre:
        rowShown && first && last
          ? (first.left + last.right) / 2 - (hb.left + hb.width / 2)
          : null,
      overflowsSideways: header.scrollWidth > header.clientWidth,
    };
  });

async function openAt(
  page: Page,
  locale: string,
  width: number,
): Promise<void> {
  await page.setViewportSize({ width, height: 633 });
  await page.goto(`/${locale}/services/`);
  // `attached`, not the default `visible`: below the step the row is
  // correctly display:none, which is the very state the first test asserts.
  await page.waitForSelector('header nav', { state: 'attached' });
  await page.evaluate(() => document.fonts.ready);
}

for (const locale of ['ro', 'de']) {
  test.describe(`${locale}/services — the bar's step`, () => {
    test.beforeEach(({}, testInfo) => {
      test.skip(
        testInfo.project.name !== 'laptop-1366x633',
        'the step lives on the laptop geometry; each test sets its own width',
      );
    });

    test(`at ${BELOW}px the row does not fit: brand + burger, nothing else`, async ({
      page,
    }) => {
      await openAt(page, locale, BELOW);
      const bar = await readBar(page);
      expect(bar.rowShown).toBe(false);
      expect(bar.ctaShown).toBe(false);
      expect(bar.burgerShown).toBe(true);
      expect(bar.overflowsSideways).toBe(false);
    });

    test(`at ${ABOVE}px the row fits with the gap: no burger`, async ({
      page,
    }) => {
      await openAt(page, locale, ABOVE);
      const bar = await readBar(page);
      expect(bar.rowShown).toBe(true);
      expect(bar.ctaShown).toBe(true);
      expect(bar.burgerShown).toBe(false);
      expect(bar.overflowsSideways).toBe(false);
      expect(bar.gap).toBeGreaterThanOrEqual(GAP);
      // The side tracks still exceed the brand here, so the nav is exactly
      // on the bar's centre line (the 2026-09-04 rule), not merely clear of
      // the brand.
      expect(Math.abs(bar.navOffCentre ?? Infinity)).toBeLessThanOrEqual(1);
    });

    test('on the laptop itself the row is centred with room to spare', async ({
      page,
    }) => {
      await openAt(page, locale, 1366);
      const bar = await readBar(page);
      expect(bar.rowShown).toBe(true);
      expect(bar.burgerShown).toBe(false);
      expect(bar.overflowsSideways).toBe(false);
      expect(bar.gap).toBeGreaterThanOrEqual(GAP);
      expect(Math.abs(bar.navOffCentre ?? Infinity)).toBeLessThanOrEqual(1);
    });
  });
}
