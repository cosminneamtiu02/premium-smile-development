import { expect, type Locator, type Page, test } from '@playwright/test';

// THE DOCTORS BAND AND THE RIBBON'S FIRST MOUNT, against the built export
// (owner, 2026-09-30 — "make this the official dr card under personell card …
// integrate it in the page and crete it as a section in the home page and in
// the personell page"). sections/DoctorShowcase shows every doctor as the
// doctor card (sections/PersonnelCard, its D17) in ONE column that the floss
// ribbon wraps (ui/Ribbon, CLAUDE.md §15.26) — on the Team page, which the
// band opens, and on Home, under the Hero.
//
// WHY THE BUILT EXPORT. The band is a SERVER component and the ribbon its one
// client island: the cards are static HTML the browser HYDRATES and never
// re-renders, the canvases exist only after mount, and the forced-colours and
// print rules are real media states — an arrangement that exists only here.
// The Vitest projects render the whole band client-side (and the components
// project loads no stylesheet), and the visual net photographs with
// `prefers-reduced-motion: reduce`, where the ribbon is painted at once. Here
// the pages are the files a visitor downloads, with motion ON by default
// (playwright.e2e.config.ts), so the live drawing really runs. §15.26's
// "owed at the mount" names "forced colours and print as an e2e check"; this
// file is that check, and pins the rest of the mount beside it.
//
// Pinned, in order: the page as the server sends it — no canvas, one station,
// one card and one link per doctor, the four keep-out markers, the list
// roles, the FIRST picture eager with a preload link on the Team page and
// every picture lazy on Home, and the cards usable with no JavaScript at all;
// the ribbon drawn — at once under reduced motion, card by card as the page
// is scrolled with motion on, and STILL drawn after scrolling back ("drawn
// while scrolling but remains drawn"); never in the way — a click at a link's
// centre reaches the link and opens that doctor's page; hidden in forced
// colours and in print while the cards stay; painted, and never scrolling
// sideways, from a 320px window up; and the outline and the links' names.
//
// NOTHING HERE KNOWS THE ROSTER. How many doctors there are, what they are
// called and where their pages live are read from the PAGE: lib/team ships
// demo people until the clinic's real team lands (a lane with six real
// doctors is in flight), and a spec that spelled two names would go red for
// the wrong reason. The band's WORDS are spelled below, never imported —
// they are this lane's message keys, and a silent rename should fail here
// (the price specs' idiom).
//
// THE BROWSER SPEAKS THE PAGE'S LANGUAGE (`locale` below): headless Chromium
// reports en-US, which makes the shell's language-suggestion toast appear on
// every /ro/ and /de/ page — a fixed box that can sit over a card. That toast
// is sections/LanguageBanner's business and has its own suite; here it would
// only make a click's target depend on a banner.
//
// Nothing here is a screenshot; the assertions are DOM, computed style and
// painted canvas pixels, the price-menu spec's idiom.

type Locale = 'ro' | 'de';

/** The band's `<h2>` — and, through aria-labelledby, its region's name. */
const BAND_TITLE: Record<Locale, string> = {
  ro: 'Specialiștii cu care ne mândrim',
  de: 'Spezialisten, auf die wir stolz sind',
};

/** The card's one link, as it is painted. */
const PROFILE_LABEL: Record<Locale, string> = {
  ro: 'Mai multe despre mine',
  de: 'Mehr über mich',
};

const BROWSER_LOCALE: Record<Locale, string> = { ro: 'ro-RO', de: 'de-DE' };

/** One card's place in the ribbon (lib/ribbon-layout's station mark). */
const STATION = '[data-ribbon-station]';

/** The ribbon's decorative box: the canvases' only parent. */
const LAYER = '[role="list"] > div[aria-hidden="true"]';

/** A doctor's page: `/{locale}/team/{kebab-id}/` (run ledger D3, §15.13). */
const doctorPath = (locale: Locale): RegExp =>
  new RegExp(`^/${locale}/team/[a-z0-9]+(?:-[a-z0-9]+)*/$`);

/** The windows the band must hold at, besides the two projects' own: the
 *  accessibility stress width, the phone, the tablet, and the narrowest
 *  window that still seats a card in two columns (measured: 1136px). */
const WINDOWS = [320, 390, 768, 1136] as const;

interface Tile {
  readonly width: number;
  readonly height: number;
  /** Pixels the ribbon has painted on this card's canvas (alpha > 0). */
  readonly ink: number;
}

interface RibbonState {
  readonly stations: number;
  readonly tiles: readonly Tile[];
}

/** The ribbon as the page holds it right now: a canvas per card, its size and
 *  how much of it is painted. A withheld ribbon is every canvas 0 × 0. */
const readRibbon = (page: Page): Promise<RibbonState> =>
  page.evaluate(
    ([station, layer]) => ({
      stations: document.querySelectorAll(station).length,
      tiles: Array.from(
        document.querySelectorAll<HTMLCanvasElement>(`${layer} canvas`),
        (canvas) => {
          let ink = 0;
          if (canvas.width > 0 && canvas.height > 0) {
            const pixels = canvas
              .getContext('2d')
              ?.getImageData(0, 0, canvas.width, canvas.height).data;
            if (pixels) {
              for (let i = 3; i < pixels.length; i += 4) {
                if (pixels[i] > 0) ink += 1;
              }
            }
          }
          return { width: canvas.width, height: canvas.height, ink };
        },
      ),
    }),
    [STATION, LAYER] as const,
  );

const band = (page: Page, locale: Locale): Locator =>
  page.getByRole('region', { name: BAND_TITLE[locale] });

/** Load a page and wait for the band's cards — `attached`, because the band
 *  sits below the fold on Home. */
async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForSelector(STATION, { state: 'attached' });
}

/** How far PAST the window's centre line a card's centre is carried. A scroll
 *  position is a whole pixel and a card's centre is not: aimed exactly at the
 *  line, the first card stopped 0.48px short of it on the 1920 × 945 window
 *  and was — correctly — never drawn (measured; two pixels further it was).
 *  A visitor scrolls THROUGH the line; so does this. */
const PAST_THE_LINE = 8;

/** Carry one card's centre across the window's centre line — the owner's rule
 *  for when that card's stretch is drawn (lib/ribbon-draw). Instant: the
 *  shell's smooth scrolling would make the arrival a race. */
const centreOn = (page: Page, index: number): Promise<void> =>
  page.evaluate(
    ([station, i, past]) => {
      const card = document.querySelectorAll(station)[i];
      if (!card) throw new Error(`no station ${i}`);
      const box = card.getBoundingClientRect();
      window.scrollTo({
        top:
          window.scrollY +
          box.top +
          box.height / 2 -
          window.innerHeight / 2 +
          past,
        behavior: 'instant',
      });
    },
    [STATION, index, PAST_THE_LINE] as const,
  );

/** Every card has a canvas, and every canvas is painted. */
async function expectDrawn(page: Page): Promise<void> {
  await expect
    .poll(
      async () => {
        const { stations, tiles } = await readRibbon(page);
        return (
          stations > 0 &&
          tiles.length === stations &&
          tiles.every((tile) => tile.ink > 0)
        );
      },
      { timeout: 15_000 },
    )
    .toBe(true);
}

/** Skips a block on every project but the laptop's: the width-pinning blocks
 *  each set their own window, so running them twice would only repeat them. */
const onLaptopOnly = (): void => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'laptop-1366x633',
      'this block sets its own window; one project is enough',
    );
  });
};

test.use({ locale: BROWSER_LOCALE.ro });

// ── A · AS THE SERVER SENDS IT ─────────────────────────────────────────────
// JavaScript off: the browser's DOM is then exactly the static file, and the
// band must already be whole — §16's rule that a visitor-independent page is
// complete HTML, with the ribbon (decoration) the only thing missing.
test.describe('the band as the server sends it — no JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const path of ['/ro/team/', '/ro/'] as const) {
    test(`${path} carries every card, the ribbon's seam and no canvas`, async ({
      page,
    }) => {
      await open(page, path);
      const region = band(page, 'ro');
      const stations = region.locator(STATION);
      const count = await stations.count();
      expect(count).toBeGreaterThan(0);

      // The ribbon is drawn after mount: the file itself carries no canvas,
      // only the empty decorative box the canvases will live in.
      await expect(page.locator('canvas')).toHaveCount(0);
      await expect(region.locator(LAYER)).toHaveCount(1);

      // A list stays a list (SC 1.3.1): the ribbon's root is the list, each
      // station an item, each item ONE card with ONE link.
      const list = region.getByRole('list');
      await expect(list.getByRole('listitem')).toHaveCount(count);
      await expect(region.getByRole('article')).toHaveCount(count);
      await expect(region.getByRole('link')).toHaveCount(count);

      for (let i = 0; i < count; i += 1) {
        const station = stations.nth(i);
        // The seam (§15.26): the name pair, the words and the link are plain
        // keep-outs, the picture's cell the portrait's.
        await expect(station.locator('[data-ribbon-keepout=""]')).toHaveCount(
          3,
        );
        await expect(
          station.locator('[data-ribbon-keepout="portrait"]'),
        ).toHaveCount(1);

        // The card is usable as it arrives: a name, the doctor's words and
        // the link to the doctor's own page.
        const name = station.getByRole('heading');
        await expect(name).toHaveCount(1);
        await expect(name).not.toBeEmpty();
        await expect(station.getByRole('blockquote')).not.toBeEmpty();
        const link = station.getByRole('link');
        await expect(link).toHaveText(PROFILE_LABEL.ro);
        expect(await link.getAttribute('href')).toMatch(doctorPath('ro'));
      }
    });
  }

  test('on the Team page the FIRST picture is eager and preloaded, the rest lazy', async ({
    page,
  }) => {
    // The band opens this page, and its first picture is the page's largest
    // paint (measured — DoctorShowcase D9, PersonnelCard D18).
    await open(page, '/ro/team/');
    const pictures = band(page, 'ro').locator(`${STATION} img`);
    const count = await pictures.count();
    expect(count).toBeGreaterThan(0);

    const first = pictures.first();
    await expect(first).toHaveAttribute('fetchpriority', 'high');
    await expect(first).not.toHaveAttribute('loading', 'lazy');
    const srcset = await first.getAttribute('srcset');
    expect(srcset).toBeTruthy();
    // EXACTLY ONE preload link asks for this picture, and it asks for the
    // same candidate the <img> will pick: the same srcset AND the same sizes
    // — a mismatch would download the picture twice.
    const preloads = await page
      .locator('head link[rel="preload"][as="image"][imagesrcset]')
      .evaluateAll((links) =>
        links.map((link) => ({
          srcset: link.getAttribute('imagesrcset'),
          sizes: link.getAttribute('imagesizes'),
          priority: link.getAttribute('fetchpriority'),
        })),
      );
    const mine = preloads.filter((link) => link.srcset === srcset);
    expect(mine).toHaveLength(1);
    expect(mine[0]?.sizes).toBe(await first.getAttribute('sizes'));
    expect(mine[0]?.priority).toBe('high');

    for (let i = 1; i < count; i += 1) {
      await expect(pictures.nth(i)).toHaveAttribute('loading', 'lazy');
      await expect(pictures.nth(i)).not.toHaveAttribute('fetchpriority');
    }
  });

  test('on Home every picture of the band is lazy and none is preloaded', async ({
    page,
  }) => {
    // Home's largest paint is the hero's photograph; the band is below it.
    await open(page, '/ro/');
    const pictures = band(page, 'ro').locator(`${STATION} img`);
    const count = await pictures.count();
    expect(count).toBeGreaterThan(0);

    const preloaded = await page
      .locator('head link[rel="preload"][as="image"][imagesrcset]')
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute('imagesrcset')),
      );
    for (let i = 0; i < count; i += 1) {
      const picture = pictures.nth(i);
      await expect(picture).toHaveAttribute('loading', 'lazy');
      await expect(picture).not.toHaveAttribute('fetchpriority');
      // A missing srcset would make the next line pass for nothing.
      const srcset = await picture.getAttribute('srcset');
      expect(srcset).toBeTruthy();
      expect(preloaded).not.toContain(srcset);
    }
  });

  test('without JavaScript the first card still leads to its doctor', async ({
    page,
  }) => {
    await open(page, '/ro/team/');
    const station = band(page, 'ro').locator(STATION).first();
    const name = await station.getByRole('heading').innerText();
    const link = station.getByRole('link');
    const href = await link.getAttribute('href');
    await link.click();
    await expect(page).toHaveURL((url) => url.pathname === href);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
  });
});

// ── B · THE RIBBON IS DRAWN ────────────────────────────────────────────────
for (const [locale, path] of [
  ['ro', '/ro/team/'],
  ['de', '/de/team/'],
  ['ro', '/ro/'],
] as const) {
  test.describe(`${path} — the ribbon, whole at once under reduced motion`, () => {
    test.use({ locale: BROWSER_LOCALE[locale] });

    test('every card is wrapped without a scroll, the page hydrates clean, and the layer is pure decoration', async ({
      page,
    }) => {
      // THE PAGE HYDRATES CLEAN. The cards are server HTML handed THROUGH the
      // ribbon's client component; a mismatch there, or a throw from the
      // island, is reported on the console or as a page error and nowhere a
      // gate looks. The one third-party frame on these pages — the map's —
      // is fenced off first (the visual spec's network fence), so whatever
      // is collected is this site's own.
      const problems: string[] = [];
      page.on('pageerror', (error) => {
        problems.push(`page error: ${error.message}`);
      });
      page.on('console', (message) => {
        if (message.type() === 'error') {
          problems.push(`console.error: ${message.text()}`);
        }
      });
      await page.route(
        (url) => url.hostname !== '127.0.0.1' && url.hostname !== 'localhost',
        (route) =>
          route.fulfill({ status: 200, contentType: 'text/html', body: '' }),
      );

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await open(page, path);
      await expectDrawn(page);
      expect(problems).toEqual([]);

      const layer = band(page, locale).locator(LAYER);
      await expect(layer).toHaveAttribute('aria-hidden', 'true');
      expect(
        await layer.evaluate((box) => getComputedStyle(box).pointerEvents),
      ).toBe('none');
      // Nothing in the decoration can take focus.
      await expect(
        layer.locator('a, button, input, select, textarea, [tabindex]'),
      ).toHaveCount(0);
    });
  });
}

test.describe('/ro/team/ — the ribbon, drawn as the page is scrolled', () => {
  test('each card is wrapped when its centre reaches the window’s, and STAYS wrapped', async ({
    page,
  }) => {
    await open(page, '/ro/team/');
    const { stations } = await readRibbon(page);
    expect(stations).toBeGreaterThan(0);

    for (let i = 0; i < stations; i += 1) {
      await centreOn(page, i);
      await expect
        .poll(async () => (await readRibbon(page)).tiles[i]?.ink ?? 0, {
          timeout: 15_000,
        })
        .toBeGreaterThan(0);
    }

    // The pen has finished when two readings a beat apart agree.
    let settled: readonly number[] = [];
    await expect
      .poll(
        async () => {
          const before = settled;
          settled = (await readRibbon(page)).tiles.map((tile) => tile.ink);
          return (
            before.length === settled.length &&
            before.every((ink, i) => ink === settled[i])
          );
        },
        { timeout: 15_000, intervals: [400] },
      )
      .toBe(true);
    expect(settled.every((ink) => ink > 0)).toBe(true);

    // "drawn while scrolling but remains drawn" — back at the top, not one
    // painted pixel has been taken away.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    const after = (await readRibbon(page)).tiles.map((tile) => tile.ink);
    expect(after).toEqual(settled);
  });
});

test.describe('/ro/ — the ribbon under the hero', () => {
  test('scrolling through the band wraps every card', async ({ page }) => {
    await open(page, '/ro/');
    const { stations } = await readRibbon(page);
    expect(stations).toBeGreaterThan(0);
    for (let i = 0; i < stations; i += 1) await centreOn(page, i);
    await expectDrawn(page);
  });
});

// ── C · NEVER IN THE WAY ───────────────────────────────────────────────────
test.describe('/ro/team/ — the ribbon never takes a click, a colour scheme or a page of paper', () => {
  test('a click at the centre of every link reaches the link, and the first opens its doctor', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/ro/team/');
    await expectDrawn(page);

    const links = band(page, 'ro').getByRole('link');
    const count = await links.count();
    for (let i = 0; i < count; i += 1) {
      const reached = await links.nth(i).evaluate((link) => {
        link.scrollIntoView({ block: 'center', behavior: 'instant' });
        const box = link.getBoundingClientRect();
        const top = document.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
        );
        return top !== null && link.contains(top);
      });
      expect(reached, `link ${i + 1} is under something`).toBe(true);
    }

    const station = band(page, 'ro').locator(STATION).first();
    const name = await station.getByRole('heading').innerText();
    const link = station.getByRole('link');
    const href = await link.getAttribute('href');
    expect(href).toMatch(doctorPath('ro'));
    await link.click();
    await expect(page).toHaveURL((url) => url.pathname === href);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
  });

  test('forced colours hide the ribbon and keep every card', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/ro/team/');
    await expectDrawn(page);
    const region = band(page, 'ro');
    const layer = region.locator(LAYER);
    const display = (): Promise<string> =>
      layer.evaluate((box) => getComputedStyle(box).display);
    // The rule is a real one: shown before the scheme, gone under it.
    expect(await display()).not.toBe('none');

    await page.emulateMedia({
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    expect(await display()).toBe('none');

    const stations = region.locator(STATION);
    const count = await stations.count();
    for (let i = 0; i < count; i += 1) {
      await expect(stations.nth(i).getByRole('heading')).toBeVisible();
      await expect(stations.nth(i).getByRole('blockquote')).toBeVisible();
      await expect(stations.nth(i).getByRole('link')).toBeVisible();
    }
  });

  test('print hides the ribbon and keeps every card', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/ro/team/');
    await expectDrawn(page);
    const region = band(page, 'ro');
    const layer = region.locator(LAYER);
    const display = (): Promise<string> =>
      layer.evaluate((box) => getComputedStyle(box).display);
    expect(await display()).not.toBe('none');

    await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
    expect(await display()).toBe('none');

    const stations = region.locator(STATION);
    const count = await stations.count();
    for (let i = 0; i < count; i += 1) {
      await expect(stations.nth(i).getByRole('heading')).toBeVisible();
      await expect(stations.nth(i).getByRole('link')).toBeVisible();
    }
  });
});

// ── D · EVERY WINDOW ───────────────────────────────────────────────────────
for (const [locale, path] of [
  ['ro', '/ro/team/'],
  ['de', '/de/team/'],
  ['ro', '/ro/'],
] as const) {
  test.describe(`${path} — from the narrowest window up`, () => {
    test.use({ locale: BROWSER_LOCALE[locale] });
    onLaptopOnly();

    for (const width of WINDOWS) {
      test(`at ${width}px the ribbon is painted and nothing scrolls sideways`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await open(page, path);
        await page.evaluate(() => document.fonts.ready);
        // Painted means the guard let it through: a ribbon whose strip would
        // touch a name, a text or a button is withheld, every canvas 0 × 0.
        await expectDrawn(page);
        const { tiles } = await readRibbon(page);
        for (const tile of tiles) {
          expect(tile.width).toBeGreaterThan(0);
          expect(tile.height).toBeGreaterThan(0);
        }
        const sideways = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        expect(sideways).toBeLessThanOrEqual(0);
      });
    }
  });
}

// ── E · THE OUTLINE AND THE NAMES ──────────────────────────────────────────
for (const locale of ['ro', 'de'] as const) {
  test.describe(`${locale}/team — the outline and the links' names`, () => {
    test.use({ locale: BROWSER_LOCALE[locale] });

    test('one h1, no level skipped, and every link names its doctor', async ({
      page,
    }) => {
      await open(page, `/${locale}/team/`);

      // ONE outline root — the page's own, read and never seen.
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

      // No level is skipped on the way down the page.
      const levels = await page
        .locator('main :is(h1, h2, h3, h4, h5, h6)')
        .evaluateAll((headings) =>
          headings.map((heading) => Number(heading.tagName[1])),
        );
      expect(levels[0]).toBe(1);
      for (let i = 1; i < levels.length; i += 1) {
        expect(
          levels[i],
          `heading ${i + 1} of ${levels.join(' ')}`,
        ).toBeLessThanOrEqual((levels[i - 1] ?? 0) + 1);
      }

      // The band is a region named by its own title, each doctor's name a
      // level-3 heading inside it.
      const region = band(page, locale);
      await expect(
        region.getByRole('heading', { level: 2, name: BAND_TITLE[locale] }),
      ).toBeVisible();

      // A links list reads "More about me" once per doctor; the accessible
      // name therefore carries the person: the visible label FIRST (SC
      // 2.5.3), the card's own heading after it.
      const stations = region.locator(STATION);
      const count = await stations.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i += 1) {
        const station = stations.nth(i);
        const name = await station
          .getByRole('heading', { level: 3 })
          .innerText();
        const link = station.getByRole('link');
        await expect(link).toHaveText(PROFILE_LABEL[locale]);
        await expect(link).toHaveAccessibleName(
          `${PROFILE_LABEL[locale]} ${name}`,
        );
        expect(await link.getAttribute('href')).toMatch(doctorPath(locale));
      }
    });
  });
}
