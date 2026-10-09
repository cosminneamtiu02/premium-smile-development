import { expect, type Page, test } from '@playwright/test';
import sharp from 'sharp';

// THE HERO'S LAST PIXELS, against the built export (owner, 2026-10-09, from an
// iPhone on the production site: "on phone there is a slim thn dark line that
// appears between hero section and "in numbers section". check if it appears
// on other devices … i need it fixed and gone on every device").
//
// Until this spec's lane, sections/Hero painted three layers down to its
// bottom edge: the photograph (4px past the edge, trimmed by the band's clip),
// the 0.40 veil (`groundClasses`) and, over both, the fade into the page colour
// (`fadeClasses`). Wherever that edge lands BETWEEN two device pixels — 839 CSS
// px × 2.625 on a Pixel 7, 721 × 1.5 on a laptop at 150 % display scaling, a
// hero a fraction taller than an iPhone's screen at 3× — each engine resolves
// the band's last, partial row of pixels layer by layer, and the clipped
// photograph and veil took more of it than the fade drawn over them: the
// veiled photograph leaked as a one-device-pixel line, its darkness following
// the photograph's (measured in the owner's screenshot). MEASURED on develop
// a6b072f, 112 combinations of engine × scale × window: a line in 30 — every
// fractional scale in Chromium (1.25, 1.5, 1.75, 2.625, 2.75, 3.5) and 1.5 and
// one 3× phone size in WebKit — 15 to 58 levels darker than the fade's row
// above it (96 with the photograph on its own GPU layer, the path an iPhone
// takes eagerly); none in Firefox, none where the edge sat on a whole device
// pixel. Pushing the fade 2px PAST the edge did not cure it (the
// photograph and the veil still won that row), so the fix keeps both dark
// layers 2px clear of the edge (Hero.tsx's THE BAND'S LAST PIXELS bullet).
//
// THE ASSERTION: in Chromium (this suite's engine), on seven devices whose edge
// lands between device pixels, no row at the band's edge is darker than the
// fade's own row just above it by more than MAX_DEPTH. Each case first proves
// its premise — the edge IS fractional in device pixels — so a hero that one
// day changes height cannot turn it into a test of nothing. Pixels, not
// geometry: every box was exactly where it should be; the defect was
// rasterisation. WebKit and Firefox were swept by the lane's own probe, not
// here (a second engine for this suite is the owner's call, §15.20).

/** How much darker than the fade's row just above it a row at the band's edge
 *  may read, in levels of 255 averaged across the width. The shipped band
 *  read 18.9–44.0 on these devices; the fixed one reads at most 0.12. No room
 *  to raise it: undoing only the veil's half of the fix reads 2.5 on the
 *  laptop at 125 % (G2 typescript, measured). */
const MAX_DEPTH = 2;

/** Each sets its own window and scale. The hero is exactly one window tall on
 *  all of them (its content is shorter), so the scale alone puts its edge
 *  between device pixels: 839 × 2.625 = 2202.375, 721 × 1.5 = 1081.5 … */
const DEVICES = [
  {
    name: 'a Pixel 7',
    size: { width: 412, height: 839 },
    scale: 2.625,
    touch: true,
  },
  {
    name: 'a small Android phone',
    size: { width: 360, height: 740 },
    scale: 2.625,
    touch: true,
  },
  {
    name: 'an Android phone at 2.75',
    size: { width: 393, height: 873 },
    scale: 2.75,
    touch: true,
  },
  {
    name: 'an Android phone at 3.5',
    size: { width: 412, height: 915 },
    scale: 3.5,
    touch: true,
  },
  {
    name: 'a laptop at 125 %',
    size: { width: 1536, height: 865 },
    scale: 1.25,
    touch: false,
  },
  {
    name: 'a laptop at 150 %',
    size: { width: 1280, height: 721 },
    scale: 1.5,
    touch: false,
  },
  {
    name: 'a laptop at 175 %',
    size: { width: 1280, height: 801 },
    scale: 1.75,
    touch: false,
  },
] as const;

/** The browser speaks the page's language, so the §8.6 suggestion toast never
 *  opens over the window. Romanian is the default; English is the page the
 *  owner reported from. */
const BROWSER_LOCALE = { ro: 'ro-RO', en: 'en-GB' } as const;

/** How far from a whole device pixel the edge must land to count as between
 *  two: layout works in 1/64 px, so a real fraction is at least 1/64 × scale
 *  away, while a scale like 1.1 can leave float residue (700 × 1.1 % 1 =
 *  1.1e-13) on an edge that sits on the grid (G2 typescript). */
const OFF_GRID = 1e-6;

const onLaptopOnly = (): void => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'laptop-1366x633',
      'every case sets its own window and scale; one project is enough',
    );
  });
};

interface Edge {
  /** The band's bottom in the document, CSS px. */
  readonly bottom: number;
  /** How far past the last whole device pixel it lands (0 = on the grid). */
  readonly between: number;
  /** The band's bottom in the window, CSS px. */
  readonly inWindow: number;
  /** The page's scroll offset when the edge was read, CSS px. */
  readonly scrollY: number;
}

/** The hero is the band that holds the page's LCP picture. */
const readEdge = (page: Page): Promise<Edge> =>
  page.evaluate(() => {
    const band = document
      .querySelector('img[fetchpriority="high"]')
      ?.closest('section');
    if (!band) {
      throw new Error(
        'no hero — the <section> holding the fetchpriority="high" picture; sections/Hero changed shape, update readEdge',
      );
    }
    const rect = band.getBoundingClientRect();
    const bottom = rect.bottom + scrollY;
    return {
      bottom,
      between: (bottom * devicePixelRatio) % 1,
      inWindow: rect.bottom,
      scrollY,
    };
  });

/** The band's edge in the middle of the window, two frames painted. The jump
 *  is INSTANT, never the page's own smooth scrolling: globals.css glides
 *  every scroll while reduced motion is not requested, and two frames into a
 *  glide the sampled rows are nowhere near the edge — measured, the spec then
 *  passed on the defect (G2 typescript). And it lands on a WHOLE DEVICE PIXEL,
 *  so the window's pixel grid is the document's: the edge row read off
 *  getBoundingClientRect is the row the browser paints (G2 react). */
async function centreTheEdge(page: Page): Promise<Edge> {
  await page.evaluate(() => {
    const band = document
      .querySelector('img[fetchpriority="high"]')
      ?.closest('section');
    const bottom = (band?.getBoundingClientRect().bottom ?? 0) + scrollY;
    const target = Math.max(0, bottom - innerHeight / 2);
    window.scrollTo({
      top: Math.round(target * devicePixelRatio) / devicePixelRatio,
      behavior: 'instant',
    });
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  return readEdge(page);
}

/** The average grey of each device-pixel row from `first` to `last` around
 *  the band's edge row, across 5–90 % of the width (clear of a classic
 *  scrollbar and of the fixed corner discs), from a screenshot at the device's
 *  own scale — one image row per device pixel. */
async function rowsAround(
  page: Page,
  edgeRow: number,
  first: number,
  last: number,
): Promise<number[]> {
  const { data, info } = await sharp(await page.screenshot({ scale: 'device' }))
    .raw()
    .toBuffer({ resolveWithObject: true });
  const from = Math.floor(info.width * 0.05);
  const to = Math.floor(info.width * 0.9);
  const rows: number[] = [];
  for (let y = edgeRow + first; y <= edgeRow + last; y += 1) {
    let sum = 0;
    for (let x = from; x < to; x += 1) {
      const i = (y * info.width + x) * info.channels;
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    rows.push(sum / (to - from));
  }
  return rows;
}

for (const locale of ['ro', 'en'] as const) {
  test.describe(`/${locale}/ — the hero's bottom edge holds no line`, () => {
    test.use({ locale: BROWSER_LOCALE[locale] });
    onLaptopOnly();

    for (const device of DEVICES) {
      test.describe(`on ${device.name}`, () => {
        test.use({
          viewport: device.size,
          deviceScaleFactor: device.scale,
          isMobile: device.touch,
          hasTouch: device.touch,
        });

        test(`(${device.size.width} × ${device.size.height} at ${device.scale}) the rows at the edge are never darker than the fade above them`, async ({
          page,
        }) => {
          // Reduced motion holds the ring on its first slide: a still frame is
          // the repeatable one (the line showed with the ring running too, in
          // the lane's sweep). The scroll is instant either way (centreTheEdge).
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await page.goto(`/${locale}/`);
          await page.evaluate(() => document.fonts.ready);
          await page.waitForFunction(() => {
            const picture = document.querySelector<HTMLImageElement>(
              'img[fetchpriority="high"]',
            );
            return (
              picture !== null && picture.complete && picture.naturalWidth > 0
            );
          });

          const edge = await centreTheEdge(page);
          // THE PREMISE: the edge lands between device pixels, the one
          // condition the line needs. If the hero's height ever changes so
          // that it does not, pick another window rather than pass on nothing.
          expect(
            Math.min(edge.between, 1 - edge.between),
            `the hero's bottom (${edge.bottom}px × ${device.scale}) lands on a whole device pixel — this window no longer tests the hazard; pick another height`,
          ).toBeGreaterThan(OFF_GRID);

          // Rows −4 and −3 are the fade, all but finished; rows −2 … +1 hold
          // the band's last rows and the next band's first. The window is
          // wider than the one row the edge needs on purpose: before the
          // scroll landed on a whole device pixel, the browser painted at a
          // snapped offset getBoundingClientRect did not report, and the
          // line sat one row above `edgeRow` on 3 of the 7 devices (G2
          // typescript) — the slack keeps the assertion honest either way.
          const edgeRow = Math.floor(edge.inWindow * device.scale);
          const rows = await rowsAround(page, edgeRow, -4, 1);
          expect(
            await page.evaluate(() => scrollY),
            'the page moved while it was photographed — the rows are not the edge',
          ).toBe(edge.scrollY);
          const fade = Math.max(rows[0], rows[1]);
          const darkest = Math.min(rows[2], rows[3], rows[4], rows[5]);
          expect(
            fade - darkest,
            `rows at the edge (device rows ${edgeRow - 4}…${edgeRow + 1}): ${rows.map((row) => row.toFixed(1)).join(' ')}`,
          ).toBeLessThanOrEqual(MAX_DEPTH);
        });
      });
    }
  });
}
