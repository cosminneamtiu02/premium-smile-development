import { expect, type Page, test } from '@playwright/test';

// THE PRICE MENU'S STICKY BEHAVIOUR, against the built export (owner,
// 2026-09-18 — "that should absolutely not be possible", of the nested
// scrollbar the old height belt put inside the menu card on every laptop).
// Two geometries, one story each (playwright.e2e.config.ts says why these
// two): at 1366×633 the eleven-category menu is TALLER than the window and
// lib/sticky-rail must hold it — bottom-pinned on the way down, top-pinned on
// the way up, every link reachable by scrolling the PAGE and every focused
// link on screen; at 1920×945 it FITS, and nothing the rail could do may
// show — plain CSS sticky at the 8.5rem line throughout, the DOM byte for
// byte what the server sent.
//
// Both locales the owner measured (Romanian and German — the menu is 653px
// tall in each) run the tall story. The numbers below are the site's own:
// 136px = the 8.5rem line (the header pill's 6rem reach + 2.5rem of air,
// sections/PriceList's `@3xl:top-34` paragraph), 16px = the 1rem of air under
// the bottom pin (lib/sticky-rail's default, one root em).

const MENU = '#price-categories';
const LINE = 136;
const GAP = 16;

type Box = Readonly<{ top: number; bottom: number; height: number }>;

const menuBox = (page: Page): Promise<Box> =>
  page.evaluate((selector) => {
    const rect = (
      document.querySelector(selector) as HTMLElement
    ).getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, height: rect.height };
  }, MENU);

/** The menu is never a scroll container: its content is exactly its box,
 *  and overflow is the browser's default. */
async function expectNoNestedScroll(page: Page): Promise<void> {
  const nested = await page.evaluate((selector) => {
    const nav = document.querySelector(selector) as HTMLElement;
    return {
      scrollHeight: nav.scrollHeight,
      clientHeight: nav.clientHeight,
      overflowY: getComputedStyle(nav).overflowY,
    };
  }, MENU);
  expect(nested.scrollHeight).toBe(nested.clientHeight);
  expect(nested.overflowY).toBe('visible');
}

/**
 * Scroll the PAGE in wheel-sized steps, one frame each — the rail reacts per
 * frame, and a single jump is a different (recorded) story. `to` may be
 * beyond the document; the browser clamps. `behavior: 'instant'` is
 * load-bearing: the shell declares `scroll-behavior: smooth` on <html>
 * (globals.css), so a plain scrollTo would ANIMATE each step and two frames
 * later the page would have moved ten pixels, not a hundred and twenty —
 * measured in this lane before the option was added.
 */
async function stepScroll(page: Page, to: number, step = 120): Promise<void> {
  await page.evaluate(
    async ({ to, step }) => {
      const frame = (): Promise<void> =>
        new Promise((resolve) => requestAnimationFrame(() => resolve()));
      const direction = to > window.scrollY ? 1 : -1;
      while (
        (direction > 0 && window.scrollY < to) ||
        (direction < 0 && window.scrollY > to)
      ) {
        const before = window.scrollY;
        window.scrollTo({
          top: before + direction * step,
          behavior: 'instant',
        });
        await frame();
        await frame();
        if (window.scrollY === before) break;
      }
    },
    { to, step },
  );
}

const lastCardLanding = (page: Page): Promise<number> =>
  page.evaluate((selector) => {
    const links = document.querySelectorAll<HTMLAnchorElement>(
      `${selector} a[href^="#"]`,
    );
    const last = links[links.length - 1];
    const card = document.getElementById(last.hash.slice(1)) as HTMLElement;
    return Math.round(card.getBoundingClientRect().top + window.scrollY);
  }, MENU);

for (const locale of ['ro', 'de']) {
  test.describe(`${locale}/services — the menu taller than the window`, () => {
    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== 'laptop-1366x633',
        'the tall story belongs to the laptop geometry',
      );
      await page.goto(`/${locale}/services/`);
      await page.waitForSelector(MENU);
      await page.evaluate(() => document.fonts.ready);
    });

    test('the server HTML carries no mode and no style — hydration-safe', async ({
      page,
    }) => {
      const html = await (
        await page.request.get(`/${locale}/services/`)
      ).text();
      // The menu's own markup, from its <nav> to the matching close — the
      // Header's nav legitimately marks the current PAGE, so the scope here
      // is the menu, and the claim is `location`.
      const menu = html.match(
        /<nav[^>]*id="price-categories"[^>]*>[\s\S]*?<\/nav>/,
      )?.[0];
      expect(menu).toBeDefined();
      expect(menu?.match(/<nav[^>]*>/)?.[0]).not.toContain('data-rail');
      expect(menu?.match(/<nav[^>]*>/)?.[0]).not.toContain('style=');
      expect(menu).not.toContain('aria-current');
    });

    test('is never a scroll container, at rest and at every pin', async ({
      page,
    }) => {
      const box = await menuBox(page);
      expect(box.height).toBeGreaterThan(633 - LINE - GAP);
      await expectNoNestedScroll(page);
      await stepScroll(page, await lastCardLanding(page));
      await expectNoNestedScroll(page);
      await stepScroll(page, 0);
      await expectNoNestedScroll(page);
    });

    test('scrolling down to the last category pins the menu by its bottom, last link on screen', async ({
      page,
    }) => {
      await stepScroll(page, await lastCardLanding(page));

      await expect(page.locator(MENU)).toHaveAttribute('data-rail', 'bottom');
      const box = await menuBox(page);
      expect(box.bottom).toBeLessThanOrEqual(633 - GAP + 1);
      const last = await page
        .locator(`${MENU} a`)
        .last()
        .evaluate((link) => {
          const rect = link.getBoundingClientRect();
          return { top: rect.top, bottom: rect.bottom };
        });
      expect(last.top).toBeGreaterThanOrEqual(0);
      expect(last.bottom).toBeLessThanOrEqual(633);
    });

    test('scrolling back up pins the menu by its top at the 8.5rem line, title on screen', async ({
      page,
    }) => {
      await stepScroll(page, await lastCardLanding(page));
      await expect(page.locator(MENU)).toHaveAttribute('data-rail', 'bottom');

      // Up, but not all the way: the sticky must still be engaged.
      await stepScroll(page, 1_200);

      await expect(page.locator(MENU)).toHaveAttribute('data-rail', 'top');
      const box = await menuBox(page);
      expect(Math.abs(box.top - LINE)).toBeLessThanOrEqual(1);
      const title = await page
        .locator(`${MENU} h2`)
        .evaluate((h2) => h2.getBoundingClientRect().top);
      expect(title).toBeGreaterThanOrEqual(LINE - 1);
      expect(title).toBeLessThanOrEqual(633);
    });

    test('Tab through all eleven links, and back — every focused link on screen', async ({
      page,
    }) => {
      const links = page.locator(`${MENU} a`);
      const count = await links.count();
      expect(count).toBe(11);
      await stepScroll(page, 1_200);

      const focusedOnScreen = async (index: number): Promise<void> => {
        const state = await page.evaluate((selector) => {
          const active = document.activeElement as HTMLElement | null;
          const all = Array.from(document.querySelectorAll(`${selector} a`));
          const rect = active?.getBoundingClientRect();
          return {
            index: active === null ? -1 : all.indexOf(active),
            top: rect?.top ?? Number.NaN,
            bottom: rect?.bottom ?? Number.NaN,
          };
        }, MENU);
        expect(state.index).toBe(index);
        expect(state.top).toBeGreaterThanOrEqual(0);
        expect(state.bottom).toBeLessThanOrEqual(633);
      };

      await links.first().focus();
      await focusedOnScreen(0);
      for (let index = 1; index < count; index += 1) {
        await page.keyboard.press('Tab');
        await focusedOnScreen(index);
      }
      for (let index = count - 2; index >= 0; index -= 1) {
        await page.keyboard.press('Shift+Tab');
        await focusedOnScreen(index);
      }
    });
  });
}

test.describe('ro/services — the menu fits: plain-sticky parity', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop-1920x945',
      'the parity story belongs to the desktop geometry',
    );
    await page.goto('/ro/services/');
    await page.waitForSelector(MENU);
    await page.evaluate(() => document.fonts.ready);
  });

  test('the rail writes nothing, and the menu sits at 136px throughout', async ({
    page,
  }) => {
    const box = await menuBox(page);
    expect(LINE + box.height + GAP).toBeLessThanOrEqual(945);
    await expectNoNestedScroll(page);

    const samples = await page.evaluate(
      async ({ selector, line }) => {
        const nav = document.querySelector(selector) as HTMLElement;
        const grid = nav.parentElement as HTMLElement;
        const frame = (): Promise<void> =>
          new Promise((resolve) => requestAnimationFrame(() => resolve()));
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const out: {
          y: number;
          top: number;
          attribute: string | null;
          style: string | null;
          held: boolean;
        }[] = [];
        const sample = (): void => {
          const rect = nav.getBoundingClientRect();
          // A sticky box is bounded by its containing block's CONTENT box —
          // the grid's border box minus its own bottom padding.
          const gridBottom =
            grid.getBoundingClientRect().bottom -
            parseFloat(getComputedStyle(grid).paddingBottom);
          out.push({
            y: window.scrollY,
            top: rect.top,
            attribute: nav.getAttribute('data-rail'),
            style: nav.getAttribute('style'),
            // Held at the line, still in flow above it, or pushed up by the
            // end of its own grid — the three honest places a plain sticky
            // can be.
            held:
              Math.abs(rect.top - line) <= 1 ||
              rect.top > line ||
              Math.abs(gridBottom - rect.bottom) <= 1,
          });
        };
        // 'instant', because the shell's `scroll-behavior: smooth` would
        // otherwise animate every step (stepScroll above says the same).
        for (let y = 0; y <= max; y += 120) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await frame();
          await frame();
          sample();
        }
        for (let y = max; y >= 0; y -= 120) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await frame();
          await frame();
          sample();
        }
        return out;
      },
      { selector: MENU, line: LINE },
    );

    expect(samples.length).toBeGreaterThan(10);
    for (const sample of samples) {
      expect(sample.attribute, `at scrollY ${sample.y}`).toBeNull();
      expect(sample.style, `at scrollY ${sample.y}`).toBeNull();
      expect(sample.held, `at scrollY ${sample.y}: top ${sample.top}`).toBe(
        true,
      );
    }
    // The sticky really engaged somewhere along the way.
    expect(samples.some((sample) => Math.abs(sample.top - LINE) <= 1)).toBe(
      true,
    );
  });
});
