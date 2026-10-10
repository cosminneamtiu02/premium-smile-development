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

/** How far PAST the ribbon's line a card's centre is carried. A scroll
 *  position is a whole pixel and a card's centre is not: aimed exactly at the
 *  line, the first card stopped 0.48px short of it on the 1920 × 945 window
 *  and was — correctly — never drawn (measured; two pixels further it was).
 *  A visitor scrolls THROUGH the line; so does this. */
const PAST_THE_LINE = 8;

/** Carry one card's centre across the ribbon's line — a quarter of the window
 *  above its bottom, the owner's rule for when that card's stretch is drawn
 *  (lib/ribbon-draw's LINE; the window's centre until 2026-10-01). Instant:
 *  the shell's smooth scrolling would make the arrival a race. */
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
          0.75 * window.innerHeight +
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
  test('each card is wrapped when its centre reaches the ribbon’s line, and STAYS wrapped', async ({
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

// ── F · THE SCALE (DoctorShowcase D10) ─────────────────────────────────────
// The owner, 2026-10-01: "i like how it looks on phone and tablet and i want
// to keep that unchanged. but on laptop and desktop if you make it
// bigger/smaller in width it gets highly disproportioned. i want card and
// component and all contents to adjust in size harmonically all at once and
// mentain raports as on following sizes: 1401x1063." — and, asked the same
// day how tablets should be treated: "Touch devices unchanged". On the built
// pages, at his own window and at every laptop and desktop width round it,
// each card's STRUCTURE — its picture's and its link's width, its name's,
// specialty's and quote's size, each over the card's width — is the 1401
// window's to 0.3 %, the band drawn in its design pixel, min(column, 96rem)
// / 1106: the column's up to a 1920 window (SCALED_WINDOWS), the cap's past
// it, the band 96rem wide and centred in its column (CAPPED_WINDOWS). A
// card's height over its width is held to the same 0.3 % only where its
// quote is SHORTER than its picture, which then sets the card's height: a
// quote re-wraps across the regime — the typeface's optical size — and a
// taller one would move the card by a line of text (D10, THE WORDS' LIMIT),
// which is the text's doing, never the scale's. Below the step (390 · 768 ·
// 1024) nothing is declared and the stacked or unscaled card is the theme's
// own — at 390 under the phone's header since 2026-10-10 (PersonnelCard D20);
// on a TOUCH tablet, upright or sideways, nothing is declared at any width
// (TOUCH_TABLETS); and the user's default font size moves the gates without
// breaking them — a 12px root starts nothing under the 896px floor, a 28px
// root keeps every card two-column under the cap in rem. Each window is a
// fresh load (a resize would measure the ribbon mid-rebuild) under reduced
// motion (the ribbon painted whole), every picture asked for first.

/** D10's numbers, written out: the reference column, the cap in rem of the
 *  root, and THE STEP's two halves — 56rem and the 896px floor. */
const REFERENCE_COLUMN = 1106;
const CAP_REM = 96;
const STEP_REM = 56;
const STEP_FLOOR = 896;

/** The owner's window — "1401x1063". */
const OWNER_WINDOW = { width: 1401, height: 1063 } as const;

/** The laptop and desktop windows whose column is under the cap — from the
 *  step's first (≈ 1139 under a classic scrollbar) to §7's 1920 — each drawn
 *  at its own column, s = column / 1106. */
const SCALED_WINDOWS = [1140, 1280, 1536, 1920] as const;

/** Windows past the cap (≈ 1939 under a classic scrollbar, 1920 under
 *  overlay ones): s = 96rem / 1106, the band 96rem wide and centred. */
const CAPPED_WINDOWS = [2560, 2800] as const;

/** Windows whose column is under the step whatever the pointer — the phone,
 *  §7's tablet held upright, and a 1024 window — unchanged. */
const BELOW_STEP = [390, 768, 1024] as const;

/** Tablets held SIDEWAYS — every one of them wider than the step's ≈ 1120px
 *  window, which a mouse there would scale: an iPad mini (1133 × 744), an
 *  iPad Air (1180 × 820), an iPad Pro 11″ (1194 × 834) and a 1280 × 800
 *  Android tablet — measured by G2 inside the first cut's range; the owner's
 *  "Touch devices unchanged" keeps them out. */
const TOUCH_TABLETS = [
  { width: 1133, height: 744 },
  { width: 1180, height: 820 },
  { width: 1194, height: 834 },
  { width: 1280, height: 800 },
] as const;

/** The unscaled card's own two-column flip: its inset's content box against
 *  48rem (PersonnelCard D17), in px at the default root. */
const CARD_FLIP = 48 * 16;

/** The structure tolerance: ≈ 2.5 × the worst drift measured on the built
 *  pages (0.12 %, a card's height over its width), and well under what one
 *  unscaled step would cost — a single remap line dropped moves a card's
 *  height over its width by ≈ 0.8 % (G2 typescript, T7). */
const STRUCTURE = 0.003;

interface CardShape {
  readonly width: number;
  readonly height: number;
  /** The cutout as drawn: width, height — on a phone 165 % of its circle,
   *  clipped by it (PersonnelCard D20). */
  readonly picture: readonly [number, number];
  /** The picture's CELL: width, height — the 18rem cutout cell, and on a
   *  phone the round photo (PersonnelCard D20). */
  readonly cell: readonly [number, number];
  /** Where the cell's left edge and the name's stand, px from the LEFT edge
   *  of the inset's content box — and how the name and the specialty align.
   *  Read for THE PHONE HEADER's one side (PersonnelCard D20's ONE SIDE ON A
   *  PHONE): the photo at 0, the name right of it, both `start`, on every
   *  card whatever its `side`. */
  readonly cellAt: number;
  readonly nameAt: number;
  readonly align: readonly [string, string];
  /** The cutout's own height over its width, from its attributes (§11). */
  readonly aspect: number;
  /** Font sizes, px: the quote, the name, the specialty under it. */
  readonly quote: number;
  readonly name: number;
  readonly specialty: number;
  /** The quote's laid-out height — set against the picture's (THE WORDS'
   *  LIMIT). */
  readonly words: number;
  /** The link's width. */
  readonly link: number;
  /** The card's grid: `grid` (two columns) or `flex` (stacked). */
  readonly grid: string;
  /** The inset's content width — what every container step of the card
   *  reads: its `@3xl` and `@md`, the two atom steps' 24rem, the phone
   *  header's 12.5rem FLOOR and 24rem step, and the circle's `cqi`
   *  (PersonnelCard D17, D20). */
  readonly room: number;
}

interface BandShape {
  /** The root's font size, px — every rem of the gates reads it. */
  readonly rem: number;
  /** The scrollbar gutter, read off the BODY: under Playwright's
   *  --hide-scrollbars the root's clientWidth is the window's in both modes,
   *  and `scrollbar-gutter: stable` reserves 15px only for a classic bar. */
  readonly gutter: number;
  /** ui/Container's width — the band's column. */
  readonly column: number;
  /** The rhythm box in its column: left offset, width. */
  readonly box: readonly [number, number];
  /** The rhythm box's design pixel, as computed. */
  readonly scalePx: string;
  /** Whether `design-scale` remaps the step on the rhythm box. */
  readonly remapped: boolean;
  readonly cards: readonly CardShape[];
}

/** The band as the page lays it out right now. */
const readShape = (page: Page, locale: Locale): Promise<BandShape> =>
  band(page, locale).evaluate((section) => {
    const column = section.firstElementChild as HTMLElement;
    const rhythm = column.firstElementChild as HTMLElement;
    const size = (element: Element | null): number =>
      element === null ? NaN : parseFloat(getComputedStyle(element).fontSize);
    const from = column.getBoundingClientRect();
    const box = rhythm.getBoundingClientRect();
    return {
      rem: size(document.documentElement),
      gutter: window.innerWidth - document.body.getBoundingClientRect().width,
      column: from.width,
      box: [box.left - from.left, box.width] as const,
      scalePx: getComputedStyle(rhythm).getPropertyValue('--scale-px'),
      remapped:
        getComputedStyle(rhythm).getPropertyValue('--spacing') !==
        getComputedStyle(document.documentElement).getPropertyValue(
          '--spacing',
        ),
      cards: Array.from(
        section.querySelectorAll('[data-ribbon-station] > article'),
        (card) => {
          const inset = card.firstElementChild as HTMLElement;
          const grid = inset.firstElementChild as HTMLElement;
          const own = card.getBoundingClientRect();
          const image = card.querySelector('img');
          const picture = image?.getBoundingClientRect();
          const cell = image?.parentElement?.getBoundingClientRect();
          const quote = card.querySelector('blockquote');
          const style = getComputedStyle(inset);
          // The specialty is the eyebrow beside the name (PersonnelCard D17's
          // PAIR): the name first in the DOM, the specialty after it.
          const heading = card.querySelector('h3');
          const specialty = card.querySelector('h3 + p');
          const contentLeft =
            inset.getBoundingClientRect().left + parseFloat(style.paddingLeft);
          return {
            width: own.width,
            height: own.height,
            picture: [picture?.width ?? NaN, picture?.height ?? NaN] as const,
            cell: [cell?.width ?? NaN, cell?.height ?? NaN] as const,
            cellAt: (cell?.left ?? NaN) - contentLeft,
            nameAt:
              (heading?.getBoundingClientRect().left ?? NaN) - contentLeft,
            align: [
              heading === null ? '' : getComputedStyle(heading).textAlign,
              specialty === null ? '' : getComputedStyle(specialty).textAlign,
            ] as const,
            aspect:
              Number(image?.getAttribute('height')) /
              Number(image?.getAttribute('width')),
            quote: size(quote),
            name: size(heading),
            specialty: size(specialty),
            words: quote?.getBoundingClientRect().height ?? NaN,
            link: card.querySelector('a')?.getBoundingClientRect().width ?? NaN,
            grid: getComputedStyle(grid).display,
            room:
              inset.getBoundingClientRect().width -
              parseFloat(style.paddingLeft) -
              parseFloat(style.paddingRight),
          };
        },
      ),
    };
  });

/** A fresh load at one window, settled: the typefaces in, every picture of
 *  the band asked for and arrived (or broken — every box is reserved from
 *  its width and height, §11), the ribbon painted whole, and no sideways
 *  scroll. */
async function openAt(
  page: Page,
  path: string,
  width: number,
  height: number,
): Promise<void> {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, path);
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const picture of document.querySelectorAll<HTMLImageElement>(
      '[data-ribbon-station] img',
    )) {
      picture.loading = 'eager';
    }
  });
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Array.from(
            document.querySelectorAll<HTMLImageElement>(
              '[data-ribbon-station] img',
            ),
          ).every((picture) => picture.complete),
        ),
      { timeout: 15_000 },
    )
    .toBe(true);
  await expectDrawn(page);
  const sideways = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(sideways, `${width}px: sideways scroll`).toBeLessThanOrEqual(0);
}

/** The pixels of the first card's canvas that the ribbon's BODY covers —
 *  alpha 200 or more, where its shadow, at 0.38, never reaches. */
const bodyOf = (page: Page): Promise<number> =>
  page.evaluate((layer) => {
    const canvas = document.querySelector<HTMLCanvasElement>(`${layer} canvas`);
    const pixels = canvas
      ?.getContext('2d')
      ?.getImageData(0, 0, canvas.width, canvas.height).data;
    let body = 0;
    if (pixels) {
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] >= 200) body += 1;
      }
    }
    return body;
  }, LAYER);

/**
 * THE WIDTH SHARE as the page draws it (sections/DoctorShowcase, D11): the
 * ribbon's body at the page's own share, over its body once the SAME page is
 * told `--ribbon-width-share: 1` on the ribbon's root and rebuilt by a
 * resize — 1 where the page declares no share, and 0.7 less the anti-aliased
 * fringe each edge keeps where it draws the ribbon 30 % thinner. Relative on
 * purpose: the gauge rule is lib/ribbon-model's, and this file spells none of
 * it. Reduced motion is on (openAt), so a rebuild paints the whole ribbon in
 * its own frame.
 */
async function widthShareDrawn(page: Page): Promise<number> {
  const own = await bodyOf(page);
  await page.evaluate((layer) => {
    const root = document.querySelector(layer)?.parentElement;
    if (!root) throw new Error('no ribbon root');
    root.style.setProperty('--ribbon-width-share', '1');
    window.dispatchEvent(new Event('resize'));
  }, LAYER);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const whole = await bodyOf(page);
  expect(whole, 'the ribbon painted at its whole width').toBeGreaterThan(0);
  return own / whole;
}

/** THE STRUCTURE the owner's sentence is about, for one card: every length
 *  that is no line of text, each over the card's width. */
const structureOf = (card: CardShape): Record<string, number> => ({
  'picture width / card width': card.picture[0] / card.width,
  'link width / card width': card.link / card.width,
  'name size / card width': card.name / card.width,
  'specialty size / card width': card.specialty / card.width,
  'quote size / card width': card.quote / card.width,
});

/** A card whose quote is SHORTER than its picture — the picture then sets
 *  the card's height, and the height over the width is the scale's alone. */
const pictureSetsHeight = (card: CardShape): boolean =>
  card.words < card.picture[1];

/**
 * THE REGIME at one window, which `capped` says it must be in — so a
 * scrollbar or a gutter that carried a window across the cap fails as itself,
 * never as a ratio: the design pixel min(column, 96rem) / 1106, the box as
 * wide as what it draws and centred in its column (flush under the cap), and
 * every card two-column with its quote 18 × s and its name 36 × s, to a
 * twentieth of a pixel — the cap and the step in rem of the page's own root.
 */
const expectRegime = (shape: BandShape, at: string, capped: boolean): void => {
  const cap = CAP_REM * shape.rem;
  expect(shape.remapped, at).toBe(true);
  expect(shape.column, `${at}: from the step`).toBeGreaterThanOrEqual(
    Math.max(STEP_REM * shape.rem, STEP_FLOOR),
  );
  if (capped) {
    expect(shape.column, `${at}: past the cap`).toBeGreaterThan(cap);
  } else {
    expect(shape.column, `${at}: under the cap`).toBeLessThanOrEqual(cap);
  }
  const drawn = Math.min(shape.column, cap);
  const s = drawn / REFERENCE_COLUMN;
  expect(parseFloat(shape.scalePx), at).toBeCloseTo(s, 4);
  expect(Math.abs(shape.box[1] - drawn), `${at}: the box`).toBeLessThan(0.5);
  expect(
    Math.abs(shape.box[0] - (shape.column - drawn) / 2),
    `${at}: centred`,
  ).toBeLessThan(0.5);
  expect(shape.cards.length, at).toBeGreaterThan(0);
  shape.cards.forEach((card, i) => {
    const where = `${at}, card ${i + 1}`;
    expect(card.grid, where).toBe('grid');
    expect(Math.abs(card.quote - 18 * s), `${where}: quote`).toBeLessThan(0.05);
    expect(Math.abs(card.name - 36 * s), `${where}: name`).toBeLessThan(0.05);
  });
};

/** The doctor card's PHONE HEADER (PersonnelCard D20): from its inset's
 *  12.5rem FLOOR to its 24rem step, in px at the default root — and under
 *  the step, header or not, the two atom steps' phone sizes. */
const PHONE_FLOOR = 12.5 * 16;
const PHONE_HEADER = 24 * 16;

/**
 * TODAY'S BAND at one window — no design pixel, no remap, no cap: the box
 * its whole column, and every card at the theme's own sizes, in the layout
 * its own flips give it at that column (two columns from an inset of 48rem,
 * stacked below; and from 12.5rem to 24rem — every phone at 100 % zoom — THE
 * PHONE HEADER of PersonnelCard D20): outside the header, the cutout in its
 * 18rem cell — the inset's whole width where that is less — at its own
 * ratio; in it, a round photo of clamp(72px, inset − 160px, 112px) a side
 * with the cutout drawn 165 % of it inside, at the inset's left edge on EVERY
 * card and the name 18px right of it (D20's ONE SIDE ON A PHONE — the sides
 * alternate from the two-column flip alone); and under 24rem, header or not,
 * the name at 24px and the specialty at 13.2px — from there up the name on
 * `band`'s 30 or 36px and the specialty at 14px.
 */
const expectUnscaled = (shape: BandShape, at: string): void => {
  expect(shape.remapped, at).toBe(false);
  expect(shape.scalePx, at).toBe('1px');
  expect(Math.abs(shape.box[1] - shape.column), `${at}: no cap`).toBeLessThan(
    0.5,
  );
  expect(shape.cards.length, at).toBeGreaterThan(0);
  shape.cards.forEach((card, i) => {
    const where = `${at}, card ${i + 1}`;
    expect(card.grid, where).toBe(card.room >= CARD_FLIP ? 'grid' : 'flex');
    expect(card.quote, where).toBe(18);
    const small = card.room < PHONE_HEADER;
    expect(card.specialty, where).toBe(small ? 13.2 : 14);
    expect(card.name, where).toBe(small ? 24 : card.room >= 448 ? 36 : 30);
    if (small && card.room >= PHONE_FLOOR) {
      const circle = Math.min(Math.max(72, card.room - 160), 112);
      expect(Math.abs(card.cell[0] - circle), where).toBeLessThan(0.5);
      expect(Math.abs(card.cell[1] - circle), where).toBeLessThan(0.5);
      expect(Math.abs(card.picture[0] - 1.65 * circle), where).toBeLessThan(
        0.5,
      );
      // ONE SIDE ON A PHONE (D20 — the owner, 2026-10-10: "i prefer only left
      // on phone"): the photo at the inset's left edge, the name 18px right of
      // it, every line at the start — on EVERY card, the odd, mirrored ones
      // too.
      expect(
        Math.abs(card.cellAt),
        `${where}: the photo at the left edge`,
      ).toBeLessThan(0.5);
      expect(
        Math.abs(card.nameAt - circle - 18),
        `${where}: the name right of the photo`,
      ).toBeLessThan(0.5);
      expect(card.align, where).toEqual(['start', 'start']);
      return;
    }
    const cell = Math.min(288, card.room);
    expect(Math.abs(card.picture[0] - cell), where).toBeLessThan(0.5);
    expect(Math.abs(card.picture[1] - cell * card.aspect), where).toBeLessThan(
      0.5,
    );
    expect(Math.abs(card.cell[0] - cell), where).toBeLessThan(0.5);
  });
};

/** Every window round the owner's, with the regime it must be in. */
const ROUND_THE_OWNER = [
  ...SCALED_WINDOWS.map((width) => ({ width, capped: false })),
  ...CAPPED_WINDOWS.map((width) => ({ width, capped: true })),
];

/** The browser's own default font size, set through the DevTools protocol —
 *  Chrome's "Font size" setting, which every rem on the page follows (the
 *  root's computed size, a container query's and a media query's alike). It
 *  holds across the page's navigations; the context dies with the test. */
async function defaultFont(page: Page, px: number): Promise<void> {
  const session = await page.context().newCDPSession(page);
  await session.send('Page.enable');
  await session.send('Page.setFontSizes', { fontSizes: { standard: px } });
}

for (const [locale, path] of [
  ['ro', '/ro/team/'],
  ['de', '/de/'],
] as const) {
  test.describe(`${path} — THE SCALE: the 1401 window's ratios at every laptop and desktop width`, () => {
    test.use({ locale: BROWSER_LOCALE[locale] });
    onLaptopOnly();

    test(`every card keeps the owner’s structure to 0.3 %, the band drawn in its design pixel, capped at ${CAP_REM}rem`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(180_000);
      await openAt(page, path, OWNER_WINDOW.width, OWNER_WINDOW.height);
      const reference = await readShape(page, locale);
      const at1401 = `${path} at ${OWNER_WINDOW.width}px`;
      expectRegime(reference, at1401, false);
      // REFERENCE is the owner's window's column: 1401 less two 10vw margins
      // and the gutter — 1105.81 under a classic scrollbar (s = 0.99983, the
      // band he approved, to the pixel), 1120.81 under overlay ones, which
      // reserve no gutter (s = 1.0134, the same band 1.3 % larger); the
      // regime above already held s to whichever column the page has.
      expect([0, 15], `${at1401}: the scrollbar gutter`).toContain(
        reference.gutter,
      );
      expect(
        Math.abs(
          reference.column -
            (OWNER_WINDOW.width - reference.gutter - 0.2 * OWNER_WINDOW.width),
        ),
        `${at1401}: the column is the window's`,
      ).toBeLessThan(0.5);
      expect(
        Math.abs(reference.column + reference.gutter - 15 - REFERENCE_COLUMN),
        `${at1401}: REFERENCE is this window's column under a classic scrollbar`,
      ).toBeLessThan(0.5);

      const structure = reference.cards.map(structureOf);
      const held: string[] = [];
      for (const { width, capped } of ROUND_THE_OWNER) {
        await openAt(page, path, width, OWNER_WINDOW.height);
        const shape = await readShape(page, locale);
        const at = `${path} at ${width}px`;
        expectRegime(shape, at, capped);
        expect(shape.cards).toHaveLength(reference.cards.length);
        shape.cards.forEach((card, i) => {
          const before = reference.cards[i];
          if (before === undefined) throw new Error(`${at}: no card ${i + 1}`);
          // …the card's structure, every length that is no line of text…
          for (const [name, value] of Object.entries(structureOf(card))) {
            const want = structure[i]?.[name] ?? NaN;
            expect(
              Math.abs(value / want - 1),
              `${at}, card ${i + 1}: ${name} ${value.toFixed(6)} against ${want.toFixed(6)}`,
            ).toBeLessThanOrEqual(STRUCTURE);
          }
          // …and its height over its width wherever the picture, not the
          // words, sets that height, at the reference and here alike.
          if (pictureSetsHeight(before) && pictureSetsHeight(card)) {
            const value = card.height / card.width;
            const want = before.height / before.width;
            expect(
              Math.abs(value / want - 1),
              `${at}, card ${i + 1}: height / width ${value.toFixed(5)} against ${want.toFixed(5)}`,
            ).toBeLessThanOrEqual(STRUCTURE);
            held.push(`${width}: ${i + 1}`);
          }
        });
      }
      // WHICH cards had their height held, said out loud — and never none.
      // With today's quotes every card is held at every window; a longer
      // biography drops out of this list instead of failing the suite.
      testInfo.annotations.push({
        type: 'height / width held (window: card)',
        description: held.join(' · '),
      });
      expect(
        held.length,
        'no card had a quote shorter than its picture',
      ).toBeGreaterThan(0);
    });

    test('draws the ribbon 30 % thinner at the owner’s window and at every laptop and desktop width — 0.7 of the width the same page draws without the share (D11)', async ({
      page,
    }) => {
      // The owner, 2026-10-02: "on desktop, laptops whatever screen larger
      // than tablet make it 30% thinner". Measured on this build: 0.69 at
      // every window — 70 % less the fringe each edge keeps at any width.
      test.setTimeout(180_000);
      for (const width of [OWNER_WINDOW.width, ...SCALED_WINDOWS, 2560]) {
        await openAt(page, path, width, OWNER_WINDOW.height);
        const ratio = await widthShareDrawn(page);
        expect(ratio, `${path} at ${width}px`).toBeGreaterThan(0.66);
        expect(ratio, `${path} at ${width}px`).toBeLessThan(0.7);
      }
    });

    test('below the step — the phone, the tablet upright, a 1024 window — the band is today’s: nothing declared, the theme’s own sizes, the ribbon its whole width', async ({
      page,
    }) => {
      test.setTimeout(120_000);
      for (const width of BELOW_STEP) {
        await openAt(page, path, width, 900);
        const shape = await readShape(page, locale);
        expect(shape.column, `${width}px: under the step`).toBeLessThan(
          STEP_FLOOR,
        );
        expectUnscaled(shape, `${path} at ${width}px`);
        // "on tablet phone etc, the width is fine" (D11).
        expect(await widthShareDrawn(page), `${path} at ${width}px`).toBe(1);
      }
    });

    test('a SMALLER default font starts nothing under the step’s 896px floor — Chrome’s 12px at a 1024 window, a column past its own 56rem (G2 react, R6)', async ({
      page,
    }) => {
      await defaultFont(page, 12);
      await openAt(page, path, 1024, 900);
      const shape = await readShape(page, locale);
      const at = `${path} at 1024px, a 12px root`;
      expect(shape.rem, at).toBe(12);
      // Past 56rem — the rem half of the step alone would scale this column,
      // at 0.73 of the design — and under the floor, which keeps it plain.
      expect(shape.column, at).toBeGreaterThan(STEP_REM * shape.rem);
      expect(shape.column, at).toBeLessThan(STEP_FLOOR);
      expect(shape.remapped, at).toBe(false);
      expect(shape.scalePx, at).toBe('1px');
    });

    test('a LARGER default font keeps every card two-column inside the regime — 28px at a 2560 window, the cap in rem (G2 typescript, T2)', async ({
      page,
    }) => {
      // With the cap in px, a root of ≈ 27.4px put the 56rem step past it and
      // stacked every card inside the regime: the inset 1329px against 48rem
      // of 1344px. In rem the step and the cap keep their ratio.
      await defaultFont(page, 28);
      await openAt(page, path, 2560, 1063);
      const shape = await readShape(page, locale);
      const at = `${path} at 2560px, a 28px root`;
      expect(shape.rem, at).toBe(28);
      expectRegime(shape, at, false);
      for (const card of shape.cards) {
        expect(card.room, at).toBeGreaterThanOrEqual(48 * shape.rem);
      }
    });
  });

  test.describe(`${path} — THE SCALE: a touch tablet keeps today’s band at any width (the owner: “Touch devices unchanged”)`, () => {
    test.use({ locale: BROWSER_LOCALE[locale] });
    onLaptopOnly();

    for (const tablet of TOUCH_TABLETS) {
      test.describe(`a ${tablet.width} × ${tablet.height} touch tablet, held sideways`, () => {
        // Chromium's own touch emulation and a mobile viewport — overlay
        // scrollbars, the page's meta viewport honoured — exactly as G2
        // measured the tablets. It turns the primary pointer coarse and hover
        // off (measured 2026-10-01; a DevTools `Emulation.setEmulatedMedia`
        // with a `pointer` feature, by contrast, is ignored by Chromium), and
        // the first assertion checks that it did.
        test.use({ viewport: tablet, hasTouch: true, isMobile: true });

        test('declares nothing: no design pixel, no remap, no cap — today’s card, the ribbon painted at its whole width, nothing sideways', async ({
          page,
        }) => {
          // FIRST, the device: asked on the context's blank first page, before
          // the band is loaded, so a touch emulation that did not take fails
          // as itself rather than as a scale.
          expect(
            await page.evaluate(() => ({
              coarse: matchMedia('(pointer: coarse)').matches,
              hoverNone: matchMedia('(hover: none)').matches,
            })),
            'a touch screen',
          ).toEqual({ coarse: true, hoverNone: true });
          await openAt(page, path, tablet.width, tablet.height);
          const shape = await readShape(page, locale);
          const at = `${path} on a ${tablet.width}px touch tablet`;
          // The window a MOUSE would scale — the column past the step…
          expect(shape.column, at).toBeGreaterThanOrEqual(STEP_FLOOR);
          // …and today's band all the same, its ribbon at its whole width
          // (D11: "on tablet phone etc, the width is fine").
          expectUnscaled(shape, at);
          expect(await widthShareDrawn(page), at).toBe(1);
        });
      });
    }
  });
}

// ── G · EVERY NAME WHOLE, A ZOOMED PHONE INCLUDED (PersonnelCard D20) ───────
// A phone with page zoom lays out NARROWER — a 390 phone at 150 % is a 260px
// layout, at 200 % a 195px one. Before D20's FLOOR the phone header held its
// 72px photo there and left the name a column of a few px: measured on the
// built export, four of the six real names broke inside a word at 260
// („(Sab|ău)", „Căt|ălina", „Mirc|ea", „Bozd|og") and at 195 one name took
// twenty-five one-letter lines. Since the floor, under a 12.5rem INSET the
// card is the stacked one, the name centred across the whole column and no
// `overflow-wrap: anywhere` on it; over it, the header's narrowest name
// column is 110px, wider than every real name word. So at every window here
// no word of any doctor's name may occupy more than one line — a break AFTER
// a hyphen („Ivașcu-|Zugravu") is a line break between two words, and is
// allowed. Read with a Range per word, the way a line count is read: the
// distinct tops of the word's own rectangles. The windows run from the 195px
// layout to a 390 phone at 100 % — header and stacked both — on ONE page,
// resized in a loop, with the real faces loaded first.

/** The windows: a 390 phone at 200 % (195), a 320 window at ~143 % (223), a
 *  390 phone at ~162 % and 150 % (240, 260), the Galaxy Fold's cover screen
 *  (280), and the two phones at 100 % (320, 390). */
const NAME_WINDOWS = [195, 223, 240, 260, 280, 320, 390] as const;

interface NameReading {
  readonly name: string;
  /** The inset's content width (CardShape.room). */
  readonly room: number;
  /** `header` where the card draws D20's phone header, `stacked` else. */
  readonly layout: 'header' | 'stacked';
  /** How many lines the whole name takes. */
  readonly lines: number;
  /** Every word that occupies more than one line, with its line count. */
  readonly broken: readonly string[];
}

/** Every doctor card's name on the page, read as it is laid out now. */
const readNames = (page: Page): Promise<readonly NameReading[]> =>
  page.evaluate((station) => {
    /** Distinct line tops among a range's rectangles — two rectangles whose
     *  tops are within 4px share a line. */
    const linesOf = (rects: Iterable<DOMRect>): number => {
      const tops = [...rects]
        .filter((rect) => rect.width > 0 && rect.height > 0)
        .map((rect) => rect.top)
        .sort((a, b) => a - b);
      let lines = 0;
      let last = -Infinity;
      for (const top of tops) {
        if (top - last > 4) lines += 1;
        last = top;
      }
      return lines;
    };
    return Array.from(
      document.querySelectorAll(`${station} > article`),
      (card) => {
        const inset = card.firstElementChild as HTMLElement;
        const block = inset.firstElementChild?.firstElementChild as HTMLElement;
        const style = getComputedStyle(inset);
        const heading = card.querySelector('h2, h3') as HTMLElement;
        const text = heading.firstChild as Text;
        const range = document.createRange();
        const broken: string[] = [];
        let at = 0;
        // A unit ends at whitespace or right after a hyphen: the two places a
        // line may break between words in a name.
        for (const unit of text.data.split(/(?<=[\s-])/)) {
          const word = unit.trimEnd();
          if (word.length > 0) {
            range.setStart(text, at);
            range.setEnd(text, at + word.length);
            const lines = linesOf(range.getClientRects());
            if (lines > 1) broken.push(`${word} (${lines} lines)`);
          }
          at += unit.length;
        }
        range.selectNodeContents(heading);
        return {
          name: text.data,
          room:
            inset.getBoundingClientRect().width -
            parseFloat(style.paddingLeft) -
            parseFloat(style.paddingRight),
          layout:
            getComputedStyle(block).display === 'grid' ? 'header' : 'stacked',
          lines: linesOf(range.getClientRects()),
          broken,
        } as const;
      },
    );
  }, STATION);

for (const locale of ['ro', 'de'] as const) {
  test.describe(`/${locale}/team/ — every doctor's name whole, a zoomed phone's layout included (PersonnelCard D20's THE FLOOR)`, () => {
    test.use({ locale: BROWSER_LOCALE[locale] });
    onLaptopOnly();

    test(`no word of any doctor’s name takes more than one line at ${NAME_WINDOWS.join(' · ')} — a break after a hyphen excepted`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: NAME_WINDOWS[0], height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await open(page, `/${locale}/team/`);
      // The real faces first: a word's lines are the face's.
      await page.evaluate(async (station) => {
        for (const heading of document.querySelectorAll<HTMLElement>(
          `${station} > article :is(h2, h3)`,
        )) {
          const style = getComputedStyle(heading);
          await document.fonts.load(
            `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
            heading.textContent ?? '',
          );
        }
        await document.fonts.ready;
      }, STATION);

      const seen: string[] = [];
      for (const width of NAME_WINDOWS) {
        await page.setViewportSize({ width, height: 844 });
        const names = await readNames(page);
        expect(names.length, `${width}px: the doctors`).toBeGreaterThan(0);
        for (const name of names) {
          const where = `${width}px, ${name.name}`;
          // The premise, so a header that never turned on (or never off)
          // fails as itself: THE FLOOR's 12.5rem and the step's 24rem.
          expect(
            name.layout,
            `${where}: a ${name.room.toFixed(1)}px inset`,
          ).toBe(
            name.room >= 12.5 * 16 && name.room < 24 * 16
              ? 'header'
              : 'stacked',
          );
          expect(name.broken, where).toEqual([]);
        }
        const first = names[0];
        seen.push(
          `${width}: ${first?.layout} at ${first?.room.toFixed(1)}px, the longest name ${Math.max(...names.map((n) => n.lines))} lines`,
        );
      }
      // What each window drew, said out loud for the record.
      testInfo.annotations.push({
        type: 'layout and name lines (window: first card)',
        description: seen.join(' · '),
      });
    });
  });
}
