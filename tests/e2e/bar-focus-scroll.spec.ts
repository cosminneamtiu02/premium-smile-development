import { expect, type Locator, type Page, test } from '@playwright/test';

// THE KEYBOARD NEVER MOVES THE PAGE FROM THE BAR — against the built export
// (fix lane `fix/dialog-scroll-forced-colors`, 2026-10-26). The report: "focus
// the header's Contact button and press Enter — the page glides up ~215px
// while the contact dialog opens; a mouse click does not move it". MEASURED on
// develop's own export, the dialog is innocent: opening it moves nothing in any
// engine. The ~215px was the button's OWN focus — globals.css's
// `scroll-padding-top: 6rem` asks every reveal to keep the sticky pill's strip
// clear, and a control INSIDE that strip can never leave it, so the engine
// moved the page for nothing: Chromium centred the control in the clear area
// (215.5px up at this suite's 1366×633 laptop, 329 at a 390×844 phone), WebKit
// aligned it with the strip's edge (61px), every stop of a Tab walk again. And
// the phone menu's panel, which hangs off the same bar, had the bottom twin:
// Tab down its open list and the frozen page under it slid 1605px. The cures
// are sections/Header's THE BAR'S OWN CONTROLS CANCEL THE PAGE'S TOP CLEARANCE
// and lib/scroll-lock's THE BOTTOM CLEARANCE GOES WITH THE FREEZE; this spec
// walks the keyboard through every way a visitor reaches the contact dialog —
// the bar's Contact, the phone menu's Contact, the Home hero's — and asserts
// that the page stays exactly where it was. Every case below is RED on
// develop's export (the hero's, which never moved, is the control), green with
// the two cures.
//
// Reduced motion for the whole file, as a CONTEXT option (contextOptions — the
// visual config's own spelling; a bare `reducedMotion` in test.use() is not a
// Playwright test option and would be silently ignored): globals.css glides
// every scroll otherwise, and a glide still in flight reads as "not moved
// yet", which on develop's export would have passed the very bug this guards.
// So every scroll lands at once and the assertions can be exact. One block
// runs the glide on purpose (the report's own steps) and waits for it to end.
//
// Romanian browser: the language banner (§8.6) stays away, so nothing covers
// the corner or takes a Tab stop the walks do not expect. Chromium only, like
// the rest of the suite (a WebKit project is the owner's call); the lane's
// probe measured WebKit and Firefox on the same pages (Header.tsx records it).

test.use({ locale: 'ro-RO', contextOptions: { reducedMotion: 'reduce' } });

/** Where every walk starts: mid-page, with room to move either way. */
const MID = 1200;

/** The bar's own controls — never inside the phone panel or a dropdown card. */
const BAR_CONTACT = 'header button[aria-haspopup="dialog"]';
const BURGER = 'header button[aria-controls="header-menu"]';
const LOGO = 'header a:has(img)';
const PANEL = '#header-menu';

const scrollYOf = (page: Page): Promise<number> =>
  page.evaluate(() => window.scrollY);

/** The island has hydrated: React has attached its props to the element. */
async function hydrated(page: Page, selector: string): Promise<void> {
  await page.waitForFunction(
    (sel) => {
      const element = document.querySelector(sel);
      return (
        element !== null &&
        Object.keys(element).some((key) => key.startsWith('__reactProps'))
      );
    },
    selector,
    { timeout: 15_000 },
  );
}

/** Wait until the page has not moved for twenty frames — the end of a glide. */
async function settled(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      new Promise<boolean>((resolve) => {
        let last = window.scrollY;
        let still = 0;
        const tick = (): void => {
          still = window.scrollY === last ? still + 1 : 0;
          last = window.scrollY;
          if (still >= 20) resolve(true);
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    null,
    { timeout: 10_000 },
  );
}

/** Load `path`, wait for `island` to hydrate, and stand at `y`. */
async function standAt(
  page: Page,
  path: string,
  island: string,
  y: number,
): Promise<void> {
  await page.goto(path);
  await hydrated(page, island);
  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: 'instant' }),
    y,
  );
  await settled(page);
  expect(await scrollYOf(page)).toBe(y);
}

/** Focus without a scroll of our own: the walks start from a known place, and
 *  only the keyboard's next stop may decide whether the page moves. */
const focusQuietly = (locator: Locator): Promise<void> =>
  locator.evaluate((element) =>
    (element as HTMLElement).focus({ preventScroll: true }),
  );

/** The first link or button of the page itself (DOM order) — off screen at
 *  MID, which does not matter: it is focused quietly, and Shift+Tab from it
 *  leaves the page for the bar's last control. */
const firstOfMain = (page: Page): Locator =>
  page.locator('main :is(a[href], button):visible').first();

/** Shift+Tab until the focus is in the header; the stop it lands on. */
async function backIntoTheBar(page: Page): Promise<string> {
  for (let step = 0; step < 6; step += 1) {
    await page.keyboard.press('Shift+Tab');
    const inBar = await page.evaluate(
      () => document.activeElement?.closest('header') !== null,
    );
    if (inBar) {
      return page.evaluate(
        () =>
          document.activeElement?.getAttribute('aria-label') ??
          document.activeElement?.textContent?.trim() ??
          '',
      );
    }
  }
  throw new Error('Shift+Tab never reached the bar');
}

/** Skips a block on every project but the laptop's: it sets its own window. */
const onLaptopOnly = (): void => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'laptop-1366x633',
      'this block sets its own window; one project is enough',
    );
  });
};

test.describe('the bar’s Contact, on a laptop and a desktop', () => {
  test('a script’s focus(), then Enter, then Escape — the report’s own steps — move nothing', async ({
    page,
  }) => {
    await standAt(page, '/ro/team/', BAR_CONTACT, MID);
    const contact = page.locator(BAR_CONTACT);

    // Playwright's focus() IS a script's element.focus(), no preventScroll —
    // what the report's probe did before pressing Enter.
    await contact.focus();
    expect(await scrollYOf(page)).toBe(MID);

    await page.keyboard.press('Enter');
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    expect(await scrollYOf(page)).toBe(MID);

    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(contact).toBeFocused();
    expect(await scrollYOf(page)).toBe(MID);
  });

  test('Tab through every control of the bar: the page never moves', async ({
    page,
  }) => {
    await standAt(page, '/ro/team/', BAR_CONTACT, MID);
    await focusQuietly(page.locator(LOGO));

    const stops: string[] = [];
    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press('Tab');
      const stop = await page.evaluate(() => ({
        inBar: document.activeElement?.closest('header') !== null,
        name:
          document.activeElement?.getAttribute('aria-label') ??
          document.activeElement?.textContent?.trim() ??
          '',
        contact: document.activeElement?.getAttribute('aria-haspopup'),
      }));
      if (!stop.inBar) break;
      stops.push(stop.name);
      expect(await scrollYOf(page), `after Tab to „${stop.name}"`).toBe(MID);
      if (stop.contact === 'dialog') break;
    }
    // Acasă · Servicii · its ⌄ · Echipa · its ⌄ · Blog · Contact — the walk
    // really crossed the row (a premise, so a skipped row cannot pass).
    expect(stops.length).toBeGreaterThanOrEqual(7);
  });

  test('Shift+Tab from the page lands on the Contact without moving the page; the dialog then moves nothing', async ({
    page,
  }) => {
    await standAt(page, '/ro/team/', BAR_CONTACT, MID);
    await focusQuietly(firstOfMain(page));

    await backIntoTheBar(page);
    await expect(page.locator(BAR_CONTACT)).toBeFocused();
    expect(await scrollYOf(page)).toBe(MID);

    await page.keyboard.press('Enter');
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    expect(await scrollYOf(page)).toBe(MID);
    await page.keyboard.press('Escape');
    await expect(page.locator(BAR_CONTACT)).toBeFocused();
    expect(await scrollYOf(page)).toBe(MID);
  });

  test.describe('without reduced motion — the glide the report saw', () => {
    test.use({ contextOptions: { reducedMotion: 'no-preference' } });

    test('focus(), Enter, Escape: a second later the page is where it was', async ({
      page,
    }) => {
      await standAt(page, '/ro/services/', BAR_CONTACT, MID);
      await page.locator(BAR_CONTACT).focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('dialog[open]')).toHaveCount(1);
      // A glide starts AFTER focus() returns, so read only once it has had
      // every chance to run and stop.
      await page.waitForTimeout(600);
      await settled(page);
      expect(await scrollYOf(page)).toBe(MID);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
      await settled(page);
      expect(await scrollYOf(page)).toBe(MID);
    });
  });
});

test.describe('the phone menu’s Contact (390 × 844)', () => {
  onLaptopOnly();
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('burger by Shift+Tab, Enter, the panel’s Contact, the dialog and back: the page never moves', async ({
    page,
  }) => {
    await standAt(page, '/ro/team/', BURGER, MID);
    await focusQuietly(firstOfMain(page));

    // The burger is the bar's last control on a phone.
    await backIntoTheBar(page);
    await expect(page.locator(BURGER)).toBeFocused();
    expect(await scrollYOf(page)).toBe(MID);

    await page.keyboard.press('Enter');
    await expect(page.locator(PANEL)).toBeVisible();
    await page.keyboard.press('Tab');
    const panelContact = page.locator(
      `${PANEL} button[aria-haspopup="dialog"]`,
    );
    await expect(panelContact).toBeFocused();
    expect(await scrollYOf(page)).toBe(MID);

    await page.keyboard.press('Enter');
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    expect(await scrollYOf(page)).toBe(MID);

    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(page.locator(BURGER)).toBeFocused();
    expect(await scrollYOf(page)).toBe(MID);
  });

  test('Tab down the panel’s open Servicii list: the frozen page never moves, and every entry is shown', async ({
    page,
  }) => {
    await standAt(page, '/ro/team/', BURGER, MID);
    await focusQuietly(page.locator(BURGER));
    await page.keyboard.press('Enter');
    await expect(page.locator(PANEL)).toBeVisible();

    // The Servicii row's button: the word, which opens its list (§15.40).
    const services = page
      .locator(`${PANEL} button[aria-expanded]`)
      .filter({ hasText: /^Servicii/ });
    await focusQuietly(services);
    await page.keyboard.press('Enter');
    await expect(services).toHaveAttribute('aria-expanded', 'true');

    let entries = 0;
    for (let step = 0; step < 16; step += 1) {
      await page.keyboard.press('Tab');
      const stop = await page.evaluate((panel) => {
        const active = document.activeElement as HTMLElement | null;
        const box = active?.getBoundingClientRect();
        return {
          inPanel: active?.closest(panel) !== null,
          shown:
            box !== undefined &&
            box.top >= 0 &&
            box.bottom <= window.innerHeight,
          name: active?.textContent?.trim() ?? '',
        };
      }, PANEL);
      if (!stop.inPanel) break;
      entries += 1;
      expect(await scrollYOf(page), `after Tab to „${stop.name}"`).toBe(MID);
      // The panel still reveals its own entries — the cure must not hide one.
      expect(stop.shown, `„${stop.name}" is on screen`).toBe(true);
    }
    // Eleven categories and the rows after them: the list was really walked.
    expect(entries).toBeGreaterThanOrEqual(11);

    await page.keyboard.press('Escape');
    expect(await scrollYOf(page)).toBe(MID);
  });
});

test.describe('the Home hero’s Contact', () => {
  test('Shift+Tab onto it, Enter, Escape: the dialog moves nothing and hands focus back', async ({
    page,
  }) => {
    const trigger = page.locator('main button[aria-haspopup="dialog"]');
    await standAt(page, '/ro/', 'main button[aria-haspopup="dialog"]', 0);
    // The services link beside it, quietly — then one Shift+Tab, the
    // keyboard's own way onto the trigger. Wherever that leaves the page (a
    // reveal of content is the clearance doing its job) is the baseline.
    await focusQuietly(page.locator('main a[href$="/services/"]').first());
    await page.keyboard.press('Shift+Tab');
    await expect(trigger).toBeFocused();
    await settled(page);
    const before = await scrollYOf(page);

    await page.keyboard.press('Enter');
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    expect(await scrollYOf(page)).toBe(before);

    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    expect(await scrollYOf(page)).toBe(before);
  });
});
