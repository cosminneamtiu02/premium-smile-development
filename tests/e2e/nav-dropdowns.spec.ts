import { expect, type Locator, type Page, test } from '@playwright/test';
import {
  FOLLOW_AFTER_MS,
  REVEAL_AFTER_MS,
} from '../../src/components/sections/Header/accordionTiming';
import ro from '../../src/messages/ro.json';

// THE TOP BAR'S DROPDOWNS on the BUILT export (CLAUDE.md §15.40; the owner,
// 2026-10-15: "i want to implement a navigation dropdown on hover JUST ON THE
// TOP BAR ELEMNTS which drops down smoothly with sections of that particular
// page … you click profilaxie it takes you directly to profilaxie. on echipa it
// take you directly to a doctor card … on phone it should open up a dropdown
// with the adjacent subsections … if you click on another section … it should
// close the other open one"). The unit suites prove the island in isolation;
// this spec proves what a visitor gets from the real static pages: the hover
// open and close with their delays, the swap between the two, the keyboard
// way in, the landing on the card a link names — across pages and on the same
// page — and the phone panel's one-open-at-a-time lists. And since the owner's
// next word (2026-10-16: "on phone on click of servicii it has to open it's
// respective dropdown … light up lilla and trigger animation and leave it on
// until card or section unfocus or change … a top oriented bump that point to
// which category the card opened to"): the open item's word stays lit, the
// card's pointer stands under it, and on a phone the word itself opens the
// list. And the owner's look at that (the same day: "make the traingle way
// smaller … and place an svg on the right side of the text with an arrow
// pointing downwards"): the pointer a small right-angled notch, and a down
// arrow after each dropdown word. And the owner's word of 2026-10-26 ("when i
// click it ONCE to open dropdown and … twice to go to page top, do not
// implement with a counter, but with an if dropdown open flag"): on a phone
// the word is a LINK again — a tap while its list is shut opens the list and
// stays, a tap while it is open is the browser following it to the page's
// top, from another page and from the page itself — and the same evening's
// picks: a tap within half a second of the open is held back (time, never a
// count — a quick double tap opens and stays), and while a list is open a
// screen reader hears „Apasă din nou pentru a deschide pagina.".
//
// Everything is found by ROLE and NAME — the words a visitor reads — never by
// a class, so the spec survives a restyle and fails on a renamed control.
// Both laptop projects show the bar's row (the bar's 62rem step sits at a
// ≈1261px window); the phone block sets its own touch viewport.

/** The intent delay (120ms) plus the reveal (300ms), with room to spare. */
const OPEN_WITHIN = 1_500;
/** The grace (250ms) plus the fade-out (≈300ms), with room to spare. */
const CLOSE_WITHIN = 1_500;
/** Where a jumped-to card rests: the root's 6rem scroll-padding + 2.5rem. */
const LANDING = 96 + 40;

const navOf = (page: Page): Locator =>
  page.getByRole('navigation', { name: 'Navigare principală' });

/** A top-level word of the bar row. */
const word = (page: Page, name: string): Locator =>
  navOf(page).getByRole('link', { name, exact: true });

/** The region a disclosure toggle controls, by its aria-controls. */
async function controlled(page: Page, toggle: Locator): Promise<Locator> {
  const id = await toggle.getAttribute('aria-controls');
  if (!id) throw new Error('the dropdown toggle carries no aria-controls');
  return page.locator(`[id="${id}"]`);
}

/** Park the mouse far from the bar so no hover is left over. */
const park = (page: Page) =>
  page.mouse.move(5, page.viewportSize()!.height - 5);

/** THE BAR AT REST: nothing in the header animating. A paint read as a
 *  REFERENCE must wait for it — on a load whose scripts read the layout
 *  before the stylesheet applied, every menu link starts ui/TextButton's
 *  200ms colour transition (from the browser's own link colour to the ink),
 *  and a reference read in its tail was 1 level off the token (MEASURED in
 *  the e2e run of 2026-10-16: rgb(115, 103, 148) against the lilac's
 *  rgb(116, 104, 148)). */
const barAtRest = (page: Page) =>
  page.waitForFunction(
    () =>
      document.querySelector('header')!.getAnimations({ subtree: true })
        .length === 0,
  );

async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('load');
  await park(page);
  await barAtRest(page);
}

/** A word's PAINT — its label's computed colour and its underline's scale
 *  (the `::after` rule's `scale`, which Chromium reads back as "0 1" swept
 *  away and "1" drawn — ui/TextButton's underlineScaleX). Compared with the
 *  page's own words — the current page's, lit; „Blog", at rest — never with a
 *  colour typed here. */
const paintOf = (target: Locator) =>
  target.evaluate((element) => ({
    colour: getComputedStyle(element).color,
    rule: getComputedStyle(element, '::after').scale,
  }));

/** The open card's POINTER and the geometry it answers to, read off the
 *  item filed under `path` — an aria-hidden drawing has no role or name, so
 *  it is found by its place: the item's own <svg> child. */
const pointerGeometry = (page: Page, path: string) =>
  page.evaluate((itemPath) => {
    const item = document.querySelector(
      `header nav li[data-nav-dropdown="${itemPath}"]`,
    );
    if (!item) throw new Error(`no dropdown item for ${itemPath}`);
    const pointer = item.querySelector(':scope > svg');
    const word = item.querySelector(':scope > a')!.getBoundingClientRect();
    const toggle = item.querySelector('button[aria-controls]')!;
    const region = document.getElementById(
      toggle.getAttribute('aria-controls')!,
    )!;
    // The card: the region's grid, then its first cell — the backdrop.
    const card = region.firstElementChild!.firstElementChild!;
    const drawn = pointer?.getBoundingClientRect();
    return {
      pointers: document.querySelectorAll(
        'header nav li[data-nav-dropdown] > svg',
      ).length,
      drawn: pointer !== null,
      pointerWidth: drawn?.width ?? NaN,
      pointerCentre: drawn ? drawn.left + drawn.width / 2 : NaN,
      pointerTop: drawn?.top ?? NaN,
      pointerBottom: drawn?.bottom ?? NaN,
      wordCentre: word.left + word.width / 2,
      wordBottom: word.bottom,
      rowBottom: item.getBoundingClientRect().bottom,
      cardTop: card.getBoundingClientRect().top,
    };
  }, path);

test.describe('desktop — the cards under Servicii and Echipa', () => {
  test('hovering Servicii drops its card under the word, all eleven categories, and leaving closes it', async ({
    page,
  }) => {
    await open(page, '/ro/');
    const toggle = navOf(page).getByRole('button', {
      name: 'Submeniul Servicii',
    });
    const card = await controlled(page, toggle);
    await expect(card.getByRole('link')).toHaveCount(0); // closed: unreachable

    await word(page, 'Servicii').hover();
    const links = card.getByRole('link');
    await expect(links).toHaveCount(11, { timeout: OPEN_WITHIN });
    await expect(links.first()).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // Under the word, the phone panel's own 8px below the pill.
    const geometry = await page.evaluate(() => {
      const header = document.querySelector('header')!.getBoundingClientRect();
      const first = [...document.querySelectorAll('header nav a')]
        .filter((a) => a.textContent === 'Profilaxie')
        .at(0)!
        .getBoundingClientRect();
      return { headerBottom: header.bottom, firstTop: first.top };
    });
    expect(geometry.firstTop).toBeGreaterThan(geometry.headerBottom);

    await park(page);
    await expect(links).toHaveCount(0, { timeout: CLOSE_WITHIN });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('the open card points at its word, and the word stays lit while the card is open — with the pointer down in the card — until it closes (2026-10-16)', async ({
    page,
  }) => {
    await open(page, '/ro/');
    // The page's own paints: „Acasă" is the current page on /ro/ — the look
    // the held word wears — and „Blog" is a word at rest.
    const lit = await paintOf(word(page, 'Acasă'));
    const rest = await paintOf(word(page, 'Blog'));
    expect(lit).not.toEqual(rest);

    const servicii = word(page, 'Servicii');
    const toggle = navOf(page).getByRole('button', {
      name: 'Submeniul Servicii',
    });
    expect((await pointerGeometry(page, '/services')).drawn).toBe(false);
    await servicii.hover();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true', {
      timeout: OPEN_WITHIN,
    });

    // Down into the card: the word is no longer under the pointer, and it
    // keeps its light — the owner's "leave it on until card … unfocus".
    const card = await controlled(page, toggle);
    const profilaxie = card.getByRole('link', {
      name: 'Profilaxie',
      exact: true,
    });
    await profilaxie.hover();
    // The entry under the pointer wears the top bar's own hover — lavender,
    // its underline swept in (round 4: "maybe on hover of a element of a
    // dropdown also add underline animation as on top bar buttons?"). Read
    // FIRST: by the end of its 300ms sweep the word, had it no hold, would
    // have faded back to rest on its own 200ms and 300ms clocks — so ONE read
    // of the word then proves the hold, where a poll could have caught a fade
    // on its first frame.
    await expect.poll(() => paintOf(profilaxie)).toEqual(lit);
    expect(await paintOf(servicii)).toEqual(lit);

    // THE POINTER: one, small (the owner's second look: "make the traingle
    // way smaller" — a 20 × 10 notch in a 22px box), centred under the word,
    // its tip under the underline and on the bar's edge, its base on the
    // card's top edge.
    const geometry = await pointerGeometry(page, '/services');
    expect(geometry.pointers).toBe(1);
    expect(geometry.pointerWidth).toBeCloseTo(22, 0);
    expect(
      Math.abs(geometry.pointerCentre - geometry.wordCentre),
    ).toBeLessThanOrEqual(0.5);
    expect(geometry.pointerTop).toBeGreaterThan(geometry.wordBottom);
    expect(geometry.pointerTop).toBeLessThan(geometry.rowBottom);
    expect(geometry.pointerBottom).toBeCloseTo(geometry.cardTop + 1, 0);

    // Closed: the light goes out and the pointer is gone.
    await park(page);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false', {
      timeout: CLOSE_WITHIN,
    });
    expect((await pointerGeometry(page, '/services')).pointers).toBe(0);
    await expect.poll(() => paintOf(servicii)).toEqual(rest);
  });

  test('a swap hands the light and the pointer to the next word at once (2026-10-16)', async ({
    page,
  }) => {
    await open(page, '/ro/');
    const lit = await paintOf(word(page, 'Acasă'));
    const rest = await paintOf(word(page, 'Blog'));
    const team = navOf(page).getByRole('button', { name: 'Submeniul Echipa' });

    await word(page, 'Servicii').hover();
    await expect(
      navOf(page).getByRole('button', { name: 'Submeniul Servicii' }),
    ).toHaveAttribute('aria-expanded', 'true', { timeout: OPEN_WITHIN });
    await word(page, 'Echipa').hover();
    await expect(team).toHaveAttribute('aria-expanded', 'true');

    const geometry = await pointerGeometry(page, '/team');
    expect(geometry.pointers).toBe(1);
    expect(geometry.drawn).toBe(true);
    expect(
      Math.abs(geometry.pointerCentre - geometry.wordCentre),
    ).toBeLessThanOrEqual(0.5);
    await expect.poll(() => paintOf(word(page, 'Servicii'))).toEqual(rest);
    await expect.poll(() => paintOf(word(page, 'Echipa'))).toEqual(lit);
  });

  test('a down arrow after Servicii and Echipa hints at the dropdown — inside the word, taking no width; up while open; a click on it follows the word (2026-10-16)', async ({
    page,
  }) => {
    await open(page, '/ro/');
    // The arrow is the word's own decoration, found by its place: the one
    // <svg> inside each dropdown word's link. Acasă and Blog have none.
    const arrows = page.locator('header nav li[data-nav-dropdown] > a svg');
    await expect(arrows).toHaveCount(2);
    await expect(
      navOf(page)
        .getByRole('link', { name: 'Acasă', exact: true })
        .locator('svg'),
    ).toHaveCount(0);

    for (const path of ['/services', '/team']) {
      const placed = await page.evaluate((itemPath) => {
        const item = document.querySelector(
          `header nav li[data-nav-dropdown="${itemPath}"]`,
        )!;
        const link = item.querySelector(':scope > a')!;
        const arrow = link.querySelector('svg')!;
        const next = item.nextElementSibling!.getBoundingClientRect();
        const a = arrow.getBoundingClientRect();
        const l = link.getBoundingClientRect();
        return {
          hidden: arrow.getAttribute('aria-hidden'),
          rotate: getComputedStyle(arrow).rotate,
          // The glyph's 16px box: from the TEXT's end (the link's right
          // padding is 8px) to the next word's box — the row's 8px gap.
          fromLinkRight: a.left - l.right,
          toNextBox: next.left - a.right,
          centredOnRow: Math.abs(a.top + a.height / 2 - (l.top + l.height / 2)),
        };
      }, path);
      expect(placed.hidden).toBe('true');
      expect(placed.rotate).toBe('90deg'); // pointing DOWN at rest
      expect(placed.fromLinkRight).toBeCloseTo(-8, 0);
      expect(placed.toNextBox).toBeGreaterThanOrEqual(-0.5);
      expect(placed.centredOnRow).toBeLessThanOrEqual(0.5);
    }

    // The keyboard's ⌄ draws no arrow of its own — one arrow, never two.
    await expect(
      navOf(page)
        .getByRole('button', { name: 'Submeniul Servicii' })
        .locator('svg'),
    ).toHaveCount(0);

    // Open: the arrow turns up.
    const servicesArrow = page.locator(
      'header nav li[data-nav-dropdown="/services"] > a svg',
    );
    await word(page, 'Servicii').hover();
    await expect(
      navOf(page).getByRole('button', { name: 'Submeniul Servicii' }),
    ).toHaveAttribute('aria-expanded', 'true', { timeout: OPEN_WITHIN });
    await expect
      .poll(() => servicesArrow.evaluate((svg) => getComputedStyle(svg).rotate))
      .toBe('-90deg');

    // It is part of the word: a click on the arrow follows the word's link.
    await servicesArrow.click();
    await page.waitForURL('**/ro/services/');
  });

  test('a pointer only passing over the word opens nothing', async ({
    page,
  }) => {
    await open(page, '/ro/');
    // Watch BEFORE the moves: any flip to open, however brief, counts — a
    // check after the fact would run after the grace had closed it again.
    // And time the pass IN the page: from the first move on the item (the
    // intent's own start) to the pointer leaving it.
    await page.evaluate(() => {
      const w = window as unknown as {
        __opened: boolean;
        __onItemAt: number | null;
        __leftAt: number | null;
      };
      w.__opened = false;
      w.__onItemAt = null;
      w.__leftAt = null;
      const item = document.querySelector('[data-nav-dropdown="/services"]')!;
      item.addEventListener('pointermove', () => {
        w.__onItemAt ??= performance.now();
      });
      item.addEventListener('pointerleave', () => {
        w.__leftAt ??= performance.now();
      });
      new MutationObserver(() => {
        if (document.querySelector('header nav [aria-expanded="true"]'))
          w.__opened = true;
      }).observe(document.querySelector('header')!, {
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-expanded'],
      });
    });
    const box = await word(page, 'Servicii').boundingBox();
    if (!box) throw new Error('the word „Servicii" has no box');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(5, page.viewportSize()!.height - 5); // gone at once
    await page.waitForTimeout(500);
    const seen = await page.evaluate(() => {
      const w = window as unknown as {
        __opened: boolean;
        __onItemAt: number | null;
        __leftAt: number | null;
      };
      return { opened: w.__opened, onItemAt: w.__onItemAt, leftAt: w.__leftAt };
    });
    expect(
      seen.onItemAt,
      'the page saw the pointer on the item',
    ).not.toBeNull();
    expect(seen.leftAt, 'and saw it leave').not.toBeNull();
    // THE PREMISE: a pointer only PASSING — on the item for less than the
    // 120ms intent. A machine slow enough to deliver the two moves farther
    // apart may rightly open the card — a fact about the machine, not the
    // rule — so the test stands down (the unit suite's diagonal test does the
    // same; the React review, 2026-10-16).
    const stayed = seen.leftAt! - seen.onItemAt!;
    test.skip(
      stayed >= 120,
      `the pointer stayed ${Math.round(stayed)}ms, past the 120ms intent — the machine stalled; the rule is untested here`,
    );
    expect(seen.opened).toBe(false);
  });

  test('moving from Servicii to Echipa swaps the cards at once', async ({
    page,
  }) => {
    await open(page, '/ro/');
    const services = navOf(page).getByRole('button', {
      name: 'Submeniul Servicii',
    });
    const team = navOf(page).getByRole('button', { name: 'Submeniul Echipa' });
    await word(page, 'Servicii').hover();
    await expect(services).toHaveAttribute('aria-expanded', 'true', {
      timeout: OPEN_WITHIN,
    });
    // Timed IN the page, both ends: from the moment the PAGE sees the pointer
    // on Echipa's word — the swap's own trigger — to the flip. The swap is
    // taken on that move itself; a delayed open would take 120ms or more.
    // (Started before `hover()`, the clock also counted the runner's own
    // work — its actionability waits and the messages — and read 186ms on a
    // loaded machine, 2026-10-16, for a swap no slower than ever.)
    await page.evaluate(() => {
      const w = window as unknown as {
        __swapAt: number | null;
        __onWordAt: number | null;
      };
      w.__swapAt = null;
      w.__onWordAt = null;
      const item = document.querySelector('[data-nav-dropdown="/team"]')!;
      const toggle = item.querySelector('button[aria-expanded]')!;
      // Capture, on the word itself: it runs before the item's own handler.
      item.querySelector(':scope > a')!.addEventListener(
        'pointermove',
        () => {
          w.__onWordAt ??= performance.now();
        },
        { capture: true },
      );
      new MutationObserver(() => {
        if (toggle.getAttribute('aria-expanded') === 'true')
          w.__swapAt ??= performance.now();
      }).observe(toggle, { attributes: true });
    });
    await word(page, 'Echipa').hover();
    await expect(team).toHaveAttribute('aria-expanded', 'true');
    const timed = await page.evaluate(() => {
      const w = window as unknown as {
        __swapAt: number | null;
        __onWordAt: number | null;
      };
      return { swapAt: w.__swapAt, onWordAt: w.__onWordAt };
    });
    expect(
      timed.onWordAt,
      'the page saw the pointer on the word',
    ).not.toBeNull();
    expect(timed.swapAt, 'the swap was seen').not.toBeNull();
    expect(timed.swapAt! - timed.onWordAt!).toBeLessThan(100);
    await expect(services).toHaveAttribute('aria-expanded', 'false');
    const doctors = (await controlled(page, team)).getByRole('link');
    await expect(doctors).toHaveCount(6);
  });

  test('„Profilaxie" from the home page lands on its price card', async ({
    page,
  }) => {
    await open(page, '/ro/');
    await word(page, 'Servicii').hover();
    await navOf(page)
      .getByRole('link', { name: 'Profilaxie', exact: true })
      .click({ timeout: OPEN_WITHIN });
    await page.waitForURL('**/ro/services/#prophylaxis');
    await page.waitForLoadState('load');
    await expect
      .poll(() =>
        page.evaluate(() => {
          const card = document.getElementById('prophylaxis')!;
          const top = card.getBoundingClientRect().top;
          return top >= 96 - 1 && top < innerHeight - 40;
        }),
      )
      .toBe(true);
  });

  test('a doctor from the services page lands on that doctor’s card, under the bar', async ({
    page,
  }) => {
    await open(page, '/ro/services/');
    await word(page, 'Echipa').hover();
    await navOf(page)
      .getByRole('link', { name: 'Dr. Toma Lucian', exact: true })
      .click({ timeout: OPEN_WITHIN });
    await page.waitForURL('**/ro/team/#toma-lucian');
    await page.waitForLoadState('load');
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.getElementById('toma-lucian')!.getBoundingClientRect().top,
        ),
      )
      .toBeCloseTo(LANDING, 0);
  });

  test('on the services page a category jumps in place — no new document — and the card closes', async ({
    page,
  }) => {
    await open(page, '/ro/services/');
    await page.evaluate(() => {
      (window as unknown as { __samePage: boolean }).__samePage = true;
    });
    const toggle = navOf(page).getByRole('button', {
      name: 'Submeniul Servicii',
    });
    await word(page, 'Servicii').hover();
    await navOf(page)
      .getByRole('link', { name: 'Endodonție', exact: true })
      .click({ timeout: OPEN_WITHIN });
    await page.waitForURL('**/ro/services/#endodontics');
    expect(
      await page.evaluate(
        () => (window as unknown as { __samePage?: boolean }).__samePage,
      ),
    ).toBe(true);
    // The pointer still rests where the entry was: only the click closed it.
    await expect(toggle).toHaveAttribute('aria-expanded', 'false', {
      timeout: 200,
    });
  });

  test('a keyboard jump to a price card on the same page draws the ring (§15.20 round 5)', async ({
    page,
  }) => {
    await open(page, '/ro/services/');
    await word(page, 'Servicii').focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    const entry = navOf(page).getByRole('link', {
      name: 'Endodonție',
      exact: true,
    });
    await entry.focus();
    await page.keyboard.press('Enter');
    await page.waitForURL('**/ro/services/#endodontics');
    const card = page.locator('#endodontics');
    await expect(card).toBeFocused();
    await expect(card).toHaveAttribute('data-arrival', 'keyboard');
    await expect
      .poll(() => card.evaluate((el) => getComputedStyle(el).outlineStyle))
      .toBe('solid');
  });

  test('the keyboard way in: the word, then its ⌄, Enter opens, Tab walks in, Escape returns', async ({
    page,
  }) => {
    await open(page, '/ro/');
    const servicii = word(page, 'Servicii');
    await servicii.focus();
    await page.keyboard.press('Tab');
    const toggle = navOf(page).getByRole('button', {
      name: 'Submeniul Servicii',
    });
    await expect(toggle).toBeFocused();
    // The keyboard sees it: its ring drawn, and it takes the pointer while the
    // keyboard is in the item (since round 3 it draws no glyph of its own —
    // the visible arrow is the word's — so its ring is what shows).
    await expect
      .poll(() =>
        toggle.evaluate((el) => ({
          ring: getComputedStyle(el).outlineStyle,
          pointer: getComputedStyle(el).pointerEvents,
        })),
      )
      .toEqual({ ring: 'solid', pointer: 'auto' });
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    await expect(
      navOf(page).getByRole('link', { name: 'Consultații', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('Acasă and Blog carry no dropdown', async ({ page }) => {
    await open(page, '/ro/');
    for (const name of ['Submeniul Acasă', 'Submeniul Blog']) {
      await expect(navOf(page).getByRole('button', { name })).toHaveCount(0);
    }
  });

  test('an open card never makes the page scroll sideways', async ({
    page,
  }) => {
    for (const path of ['/ro/', '/de/']) {
      await open(page, path);
      // The row is the header's FIRST <nav> in every language (its name is
      // translated: „Hauptnavigation" on /de/).
      const words = page
        .locator('header nav')
        .first()
        .locator(':scope > ul > li > a');
      for (const index of [1, 2]) {
        await words.nth(index).hover();
        // A card IS open — this test's whole premise — and only one.
        await expect(
          page.locator('header nav button[aria-expanded="true"]'),
        ).toHaveCount(1, { timeout: OPEN_WITHIN });
        expect(
          await page.evaluate(
            () =>
              document.documentElement.scrollWidth -
              document.documentElement.clientWidth,
          ),
        ).toBeLessThanOrEqual(0);
      }
    }
  });
});

test.describe('phone — the burger panel’s lists', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'laptop-1366x633',
      'the phone block sets its own viewport — once is enough',
    );
  });

  const panelOf = (page: Page): Locator =>
    page.getByRole('navigation', { name: 'Meniu' });

  async function openPanel(page: Page, path: string): Promise<void> {
    await page.goto(path);
    await page.waitForLoadState('load');
    await page.getByRole('button', { name: 'Meniu' }).tap();
    await expect(panelOf(page)).toBeVisible();
    await barAtRest(page);
  }

  /** A visitor who reads the list before tapping again: past THE GUARD (the
   *  owner's pick, 2026-10-26 — a tap on an open list's word within
   *  `FOLLOW_AFTER_MS` of the open is held back). The constant is imported
   *  from the row's own import-free timing module, never copied, so this
   *  spec cannot drift from the component (the round-6 reviews). */
  const pastTheGuard = (page: Page) =>
    page.waitForTimeout(FOLLOW_AFTER_MS + 150);

  /** Every navigation of the page's main frame, by URL, from now on. A tap
   *  that opened the list AND left would show here before the next document
   *  commits — Playwright's tap waits for no navigation of its own, so the
   *  URL and the page's state alone could still read the old page (the
   *  test-coverage review, 2026-10-26). */
  function watchNavigations(page: Page): string[] {
    const navigations: string[] = [];
    page.on('request', (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame())
        navigations.push(request.url());
    });
    return navigations;
  }

  test('a tap on Servicii or Echipa opens its list — the two words, links since 2026-10-26, are the only toggles — and opening one closes the other, the open word lit (2026-10-16)', async ({
    page,
  }) => {
    await openPanel(page, '/ro/');
    const panel = panelOf(page);
    await expect(panel.locator('a[aria-expanded]')).toHaveCount(2);
    await expect(panel.locator('button[aria-expanded]')).toHaveCount(0);
    await expect(
      panel.getByRole('button', { name: /^Submeniul / }),
    ).toHaveCount(0);
    const services = panel.getByRole('link', {
      name: 'Servicii',
      exact: true,
    });
    const team = panel.getByRole('link', { name: 'Echipa', exact: true });
    // The panel's own paints: the current page's row (Acasă on /ro/), lit —
    // the look an open row holds — and „Blog", at rest.
    const lit = await paintOf(
      panel.getByRole('link', { name: 'Acasă', exact: true }),
    );
    const rest = await paintOf(
      panel.getByRole('link', { name: 'Blog', exact: true }),
    );
    expect(lit).not.toEqual(rest);

    await services.tap();
    await expect(services).toHaveAttribute('aria-expanded', 'true');
    await expect(
      (await controlled(page, services)).getByRole('link'),
    ).toHaveCount(11);
    await expect.poll(() => paintOf(services)).toEqual(lit);

    await team.tap();
    await expect(team).toHaveAttribute('aria-expanded', 'true');
    await expect(services).toHaveAttribute('aria-expanded', 'false');
    await expect(
      (await controlled(page, services)).getByRole('link'),
    ).toHaveCount(0, { timeout: CLOSE_WITHIN });
    await expect((await controlled(page, team)).getByRole('link')).toHaveCount(
      6,
    );
    await expect.poll(() => paintOf(services)).toEqual(rest);
    await expect.poll(() => paintOf(team)).toEqual(lit);
  });

  // THE SECOND TAP (the owner, 2026-10-26: "when i click it ONCE to open
  // dropdown and … twice to go to page top … with an if dropdown open flag").
  // The first tap is held back by the row — the list opens, the page stays;
  // with the list open the same word is a plain link the browser follows, to
  // a fresh document at its top.
  test('the first tap opens the list and stays on the page; a tap with the list open goes to the page, at its top (2026-10-26)', async ({
    page,
  }) => {
    const navigations = watchNavigations(page);

    for (const [name, path] of [
      ['Servicii', '/ro/services/'],
      ['Echipa', '/ro/team/'],
    ] as const) {
      await openPanel(page, '/ro/');
      const row = panelOf(page).getByRole('link', { name, exact: true });
      await expect(row).toHaveAttribute('href', path);
      await expect(row).toHaveAttribute('aria-expanded', 'false');
      // A tap on the ⌄ at the row's end is a tap on the word — the spot the
      // arrow invites: its box is part of the link, nothing laid over it.
      expect(
        await row.evaluate((link) => {
          const glyph = link.querySelector(':scope > [aria-hidden="true"]');
          if (!glyph) return 'no ⌄ box in the row';
          const box = glyph.getBoundingClientRect();
          const hit = document.elementFromPoint(
            box.left + box.width / 2,
            box.top + box.height / 2,
          );
          return hit !== null && link.contains(hit);
        }),
        name,
      ).toBe(true);

      // THE HINT (the owner's pick, 2026-10-26): nothing extra is said while
      // the list is shut…
      await expect(row).toHaveAccessibleDescription('');

      const before = navigations.length;
      await row.tap();
      await expect(row).toHaveAttribute('aria-expanded', 'true');
      await expect(
        (await controlled(page, row)).getByRole('link').first(),
      ).toBeVisible();
      expect(new URL(page.url()).pathname, name).toBe('/ro/');
      expect(navigations.slice(before), name).toEqual([]);
      // …and while it is open a screen reader hears what the next press does.
      await expect(row).toHaveAccessibleDescription(ro.common.nav.pressAgain);

      await pastTheGuard(page);
      await row.tap();
      await page.waitForURL(`**${path}`);
      await page.waitForLoadState('load');
      // The page arrives at its top — nothing on it moves the visitor on
      // load (a script that scrolled the arriving page would show here).
      expect(await page.evaluate(() => scrollY), name).toBe(0);
      await expect(panelOf(page)).toHaveCount(0);
    }
  });

  // THE SAME SPOT, TWICE, ON A SHORT PHONE (the React review of 2026-10-26,
  // MEASURED the same day on the built export): until the fold, a list
  // opened by a tap had the panel scroll itself 300ms later to show the
  // list's end — 100px at 390×664, 375×667 and 844×390 — so the word slid up
  // from under the finger and a second tap on the same spot landed on a
  // category („Urgențe", /ro/services/#emergencies), not the page's top. A
  // pointer's open no longer scrolls the panel (NavAccordion's reveal is the
  // keyboard's alone). Echipa's shorter list moved its word too, on a shorter
  // screen (24px at 390×600, measured) and on a phone held sideways — the
  // owner, the same evening: "i hope you implemented this on echipa too".
  test('on a short phone a second tap on the SAME spot still goes to the page — the word never slides from under the finger, on Servicii and on Echipa (2026-10-26)', async ({
    page,
  }) => {
    for (const [name, path, width, height] of [
      ['Servicii', '/ro/services/', 390, 664],
      ['Servicii', '/ro/services/', 375, 667],
      ['Servicii', '/ro/services/', 844, 390],
      ['Echipa', '/ro/team/', 390, 600],
      ['Echipa', '/ro/team/', 844, 390],
    ] as const) {
      const where = `${name} at ${width}×${height}`;
      await page.setViewportSize({ width, height });
      await openPanel(page, '/ro/');
      const row = panelOf(page).getByRole('link', { name, exact: true });
      const box = await row.boundingBox();
      if (!box) throw new Error(`the row is not laid out: ${where}`);
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;

      await page.touchscreen.tap(x, y);
      await expect(row).toHaveAttribute('aria-expanded', 'true');
      // A visitor reads the list before tapping again — past the old
      // reveal's delay and its glide, and past the guard.
      expect(REVEAL_AFTER_MS + 600, where).toBeGreaterThan(FOLLOW_AFTER_MS);
      await page.waitForTimeout(REVEAL_AFTER_MS + 600);
      expect((await row.boundingBox())?.y, where).toBe(box.y);

      const loaded = page.waitForEvent('load');
      await page.touchscreen.tap(x, y);
      await loaded;
      const landed = new URL(page.url());
      expect(landed.pathname + landed.hash, where).toBe(path);
    }
  });

  // THE GUARD (the owner's pick, 2026-10-26: "Ignore a second tap that comes
  // within about 0.5 s of opening. It's based on time, not a count"): a
  // double tap faster than half a second opens the list and STAYS on the
  // page; the next tap past the half second goes. On both rows.
  test('a quick double tap opens the list and stays on the page — the next tap past the half second goes to the page (2026-10-26)', async ({
    page,
  }) => {
    const navigations = watchNavigations(page);
    for (const [name, path] of [
      ['Servicii', '/ro/services/'],
      ['Echipa', '/ro/team/'],
    ] as const) {
      await openPanel(page, '/ro/');
      const row = panelOf(page).getByRole('link', { name, exact: true });
      const box = await row.boundingBox();
      if (!box) throw new Error(`the ${name} row is not laid out`);
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;

      // Every click that reaches a row's word, as the page sees it: when (the
      // click's own timestamp), whether its list was open just BEFORE it
      // (read in the capture phase, ahead of React), and whether its link was held
      // back (read once React's handler has run) — so the test proves the
      // guard ran, never merely that nothing happened (the round-6 reviews).
      await page.evaluate(() => {
        type Click = {
          at: number;
          wasOpen: string | null;
          prevented?: boolean;
        };
        const clicks: Click[] = [];
        (window as unknown as { clicks: Click[] }).clicks = clicks;
        const rowOf = (event: Event) =>
          event.target instanceof Element
            ? event.target.closest('#header-menu a[aria-expanded]')
            : null;
        addEventListener(
          'click',
          (event) => {
            const row = rowOf(event);
            if (row)
              clicks.push({
                at: event.timeStamp,
                wasOpen: row.getAttribute('aria-expanded'),
              });
          },
          true,
        );
        addEventListener('click', (event) => {
          if (rowOf(event))
            clicks[clicks.length - 1].prevented = event.defaultPrevented;
        });
      });

      const before = navigations.length;
      const gap = Math.round(FOLLOW_AFTER_MS * 0.3);
      const settle = Math.round(FOLLOW_AFTER_MS * 0.6);
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(gap);
      await page.touchscreen.tap(x, y);
      // Time for a navigation the second tap might have started to show.
      await page.waitForTimeout(settle);
      const clicks = await page.evaluate(
        () =>
          (
            window as unknown as {
              clicks: {
                at: number;
                wasOpen: string | null;
                prevented?: boolean;
              }[];
            }
          ).clicks,
      );
      expect(clicks.length, `${name}: both taps reached the word`).toBe(2);
      expect(
        clicks[1].at - clicks[0].at,
        `${name}: THE PREMISE — the second tap landed inside the guard`,
      ).toBeLessThan(FOLLOW_AFTER_MS);
      expect(
        clicks.map(({ wasOpen, prevented }) => ({ wasOpen, prevented })),
        name,
      ).toEqual([
        { wasOpen: 'false', prevented: true },
        { wasOpen: 'true', prevented: true },
      ]);
      await expect(row).toHaveAttribute('aria-expanded', 'true');
      expect(navigations.slice(before), name).toEqual([]);
      expect(new URL(page.url()).pathname, name).toBe('/ro/');

      await pastTheGuard(page);
      const loaded = page.waitForEvent('load');
      await page.touchscreen.tap(x, y);
      await loaded;
      expect(new URL(page.url()).pathname, name).toBe(path);
    }
  });

  test('on its own page, scrolled down, the second tap on Servicii loads the page afresh at its top (2026-10-26)', async ({
    page,
  }) => {
    // A link to the page you are on, with no fragment, is a NEW document —
    // `navigate`, not a reload, so nothing restores the scroll (measured on
    // the built export, Chromium, WebKit and Firefox, before this lane was
    // built).
    await page.goto('/ro/services/');
    await page.waitForLoadState('load');
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, 1500);
      (window as unknown as { before: boolean }).before = true;
    });
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(1000);
    await page.getByRole('button', { name: 'Meniu' }).tap();
    await expect(panelOf(page)).toBeVisible();
    const row = panelOf(page).getByRole('link', {
      name: 'Servicii',
      exact: true,
    });
    await expect(row).toHaveAttribute('aria-current', 'page');

    await row.tap();
    await expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(
      await page.evaluate(() => 'before' in window),
      'still the same document after the first tap',
    ).toBe(true);

    await pastTheGuard(page);
    const loaded = page.waitForEvent('load');
    await row.tap();
    await loaded;
    expect(
      await page.evaluate(() => ({
        fresh: !('before' in window),
        path: location.pathname + location.hash,
        y: scrollY,
        type: (() => {
          const [entry] = performance.getEntriesByType('navigation');
          return entry instanceof PerformanceNavigationTiming
            ? entry.type
            : null;
        })(),
      })),
    ).toEqual({ fresh: true, path: '/ro/services/', y: 0, type: 'navigate' });
  });

  // (The menu's close before a jump matters on the SAME page — the services
  // test below proves it; a doctor's link loads the Team page, whose menu is
  // closed by being a new document.)
  test('a doctor in the list lands on their card on the Team page', async ({
    page,
  }) => {
    await openPanel(page, '/ro/');
    await panelOf(page)
      .getByRole('link', { name: 'Echipa', exact: true })
      .tap();
    await panelOf(page)
      .getByRole('link', { name: 'Dr. Nicu Elena Alina', exact: true })
      .tap();
    await page.waitForURL('**/ro/team/#nicu-elena-alina');
    await page.waitForLoadState('load');
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.getElementById('nicu-elena-alina')!.getBoundingClientRect()
              .top,
        ),
      )
      .toBeCloseTo(LANDING, 0);
  });

  test('on the services page a category closes the menu and jumps in place, the page unlocked', async ({
    page,
  }) => {
    await openPanel(page, '/ro/services/');
    await panelOf(page)
      .getByRole('link', { name: 'Servicii', exact: true })
      .tap();
    await panelOf(page)
      .getByRole('link', { name: 'Ortodonție', exact: true })
      .tap();
    await page.waitForURL('**/ro/services/#orthodontics');
    await expect(panelOf(page)).toHaveCount(0);
    const state = await page.evaluate(() => ({
      locked: document.documentElement.style.overflow,
      inert: [...document.body.children].some((el) => el.hasAttribute('inert')),
    }));
    expect(state).toEqual({ locked: '', inert: false });
    await expect
      .poll(() =>
        page.evaluate(() => {
          const top = document
            .getElementById('orthodontics')!
            .getBoundingClientRect().top;
          return top > 0 && top < innerHeight;
        }),
      )
      .toBe(true);
  });
});
