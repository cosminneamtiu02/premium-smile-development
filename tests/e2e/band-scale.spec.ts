import { expect, type Page, test } from '@playwright/test';

// THE BAND SCALE, against the built export (owner, 2026-10-02 — "i want both
// section to in parallel on widening of screen to be responsive and adapt in
// parallel, so headings and eyebrows grow together, always have same size and
// extremley important for headings and eyebrows, same offset always";
// CLAUDE.md §15.32). Every band under the Home hero and every band of the
// Team page wears ui/Container's THE BAND SCALE on a laptop or desktop: one
// design pixel — the column ÷ 1106, capped at a 96rem column — so every
// band's eyebrow and <h2> are ONE size and stand on ONE left edge at every
// width, the numbers band's tiles draw at 9/8 of it (a tile's sentence reads
// the doctor card's quote size), the map band grows as one design, the
// reviews band's opener alone scales (its deck is untouched) and the staff
// tiles hold one width. On every phone, every touch tablet and every window
// under the step, nothing changes.
//
// WHY THE BUILT EXPORT: the scale is real CSS — a registered custom property,
// container queries, `@supports` and `(pointer: fine)` — resolved by the
// engine against the page a visitor downloads. Nothing here is a screenshot:
// computed font sizes and boxes, read off the page (the doctor-showcase
// spec's idiom). The one band word read here is spelled below, never
// imported, so a silent rename fails here.
//
// THE NUMBERS: s = min(column, 1536) / 1106 with `column` read off the page
// (ui/Container's width), so the checks hold under a classic scrollbar and
// under overlay ones alike; every size is compared to its design size × s.

type Locale = 'ro' | 'de';

const BROWSER_LOCALE: Record<Locale, string> = { ro: 'ro-RO', de: 'de-DE' };

/** The staff band's <h2> — `team.roster.title`, the drafts of 2026-10-02. */
const STAFF_TITLE: Record<Locale, string> = {
  ro: 'Oamenii fără de care nu ne-am descurca',
  de: 'Die Menschen, ohne die es nicht ginge',
};

/** The pages and what each must hold. */
const PAGES: readonly {
  readonly path: (locale: Locale) => string;
  readonly bands: number;
  readonly staff: boolean;
  readonly reviews: boolean;
}[] = [
  // Home: the numbers, the doctors, the map, the reviews.
  { path: (l) => `/${l}/`, bands: 4, staff: false, reviews: true },
  // Team: the doctors, the staff, the numbers, the map.
  { path: (l) => `/${l}/team/`, bands: 4, staff: true, reviews: false },
];

/** Laptop and desktop windows — the regime, on a mouse device. */
const LAPTOPS = [
  { width: 1140, height: 800 },
  { width: 1280, height: 800 },
  { width: 1401, height: 1063 },
  { width: 1536, height: 864 },
  { width: 1882, height: 1141 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
] as const;

/** The design sizes, in design pixels (§15.32): the opener's two steps, the
 *  tile's four at 9/8, the map row's text and disc, the staff tile's width. */
const DESIGN = {
  title: 36,
  eyebrow: 14,
  quote: 18,
  tileSentence: 18,
  tileLabel: 22.5,
  tileNumber: 40.5,
  tileDisc: 126,
  address: 16,
  mapDisc: 44,
  staffTile: 352,
  staffName: 30,
} as const;

interface Opener {
  readonly title: string;
  readonly titleSize: number;
  readonly eyebrowSize: number;
  readonly titleLeft: number;
  readonly eyebrowLeft: number;
  readonly gap: number;
  /** The band's own ui/Container width — its column. */
  readonly column: number;
}

interface PageShape {
  readonly gutter: number;
  readonly pointerFine: boolean;
  readonly column: number;
  readonly sideways: number;
  readonly openers: readonly Opener[];
  readonly tiles: readonly {
    readonly sentence: number;
    readonly label: number;
    readonly number: number;
    readonly disc: number;
  }[];
  readonly quote: number | null;
  readonly map: {
    readonly width: number;
    readonly height: number;
    readonly band: number;
    readonly address: number;
    readonly disc: number;
  } | null;
  readonly reviewBody: number | null;
  readonly staff: readonly {
    readonly width: number;
    readonly top: number;
    readonly name: number;
    readonly level: string;
  }[];
}

/** The page as it is laid out right now. */
const readPage = (page: Page, staffTitle: string): Promise<PageShape> =>
  page.evaluate((staffName) => {
    const size = (element: Element | null | undefined): number =>
      element ? parseFloat(getComputedStyle(element).fontSize) : NaN;
    const openers = Array.from(
      document.querySelectorAll<HTMLElement>('main section[aria-labelledby]'),
    )
      .map((section) =>
        document.getElementById(section.getAttribute('aria-labelledby') ?? ''),
      )
      .filter(
        (heading): heading is HTMLElement =>
          heading !== null &&
          heading.tagName === 'H2' &&
          heading.parentElement?.querySelector(':scope > p') !== null,
      )
      .map((heading) => {
        const eyebrow = heading.parentElement?.querySelector(':scope > p');
        const title = heading.getBoundingClientRect();
        const kicker = eyebrow?.getBoundingClientRect();
        return {
          title: heading.textContent?.trim() ?? '',
          titleSize: size(heading),
          eyebrowSize: size(eyebrow),
          titleLeft: title.left,
          eyebrowLeft: kicker?.left ?? NaN,
          gap: title.top - (kicker?.bottom ?? NaN),
          // The band's own ui/Container — its <section>'s first box. Read per
          // band, never off the page's first <section>: on Home that is the
          // Hero, whose first box is its full-width stage.
          column:
            heading
              .closest('section')
              ?.firstElementChild?.getBoundingClientRect().width ?? NaN,
        };
      });
    const tiles = Array.from(
      document.querySelectorAll('main section ul[role="list"] > li'),
    )
      .filter((li) => li.querySelector(':scope > h3'))
      .map((li) => {
        const paragraphs = li.querySelectorAll(':scope > p');
        return {
          sentence: size(paragraphs[paragraphs.length - 1]),
          label: size(li.querySelector(':scope > h3')),
          number: size(paragraphs[0]),
          disc:
            li
              .querySelector(':scope > span[aria-hidden="true"]')
              ?.getBoundingClientRect().width ?? NaN,
        };
      });
    const quote = document.querySelector('main article blockquote');
    const frame = document.querySelector('main iframe')?.parentElement;
    const mapBand = frame?.closest('section');
    const row = mapBand?.querySelector('a[href^="tel:"]');
    const reviewBody = Array.from(document.querySelectorAll('main article'))
      .find((article) => article.querySelector('time'))
      ?.querySelector('blockquote p');
    const staffBand = Array.from(
      document.querySelectorAll('main section'),
    ).find(
      (section) =>
        section.querySelector('h2')?.textContent?.trim() === staffName,
    );
    const staff = Array.from(
      staffBand?.querySelectorAll('li > article') ?? [],
    ).map((card) => {
      const box = card.getBoundingClientRect();
      const name = card.querySelector('h2, h3');
      return {
        width: box.width,
        top: box.top,
        name: size(name),
        level: name?.tagName ?? '',
      };
    });
    return {
      gutter: window.innerWidth - document.body.getBoundingClientRect().width,
      pointerFine: matchMedia('(pointer: fine)').matches,
      column: openers[0]?.column ?? NaN,
      sideways:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      openers,
      tiles,
      quote: quote ? size(quote) : null,
      map: frame
        ? {
            width: frame.getBoundingClientRect().width,
            height: frame.getBoundingClientRect().height,
            band:
              (
                mapBand?.firstElementChild
                  ?.firstElementChild as HTMLElement | null
              )?.getBoundingClientRect().width ?? NaN,
            address: size(row?.querySelector(':scope > span:last-child')),
            disc:
              row
                ?.querySelector(':scope > span:first-child')
                ?.getBoundingClientRect().width ?? NaN,
          }
        : null,
      reviewBody: reviewBody ? size(reviewBody) : null,
      staff,
    };
  }, staffTitle);

/** A fresh load at one window, the typefaces in. */
async function openAt(
  page: Page,
  path: string,
  viewport: { width: number; height: number },
): Promise<void> {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(path);
  await page.waitForSelector('main iframe', { state: 'attached' });
  await page.evaluate(() => document.fonts.ready);
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
  for (const { path, bands, staff, reviews } of PAGES) {
    const at = path(locale);
    test.describe(`${at} — THE BAND SCALE on a laptop or desktop`, () => {
      test.use({ locale: BROWSER_LOCALE[locale] });
      onLaptopOnly();

      for (const viewport of LAPTOPS) {
        test(`at ${viewport.width} × ${viewport.height}: one eyebrow size, one title size, one left edge — the design × s`, async ({
          page,
        }) => {
          await openAt(page, at, viewport);
          const shape = await readPage(page, STAFF_TITLE[locale]);
          expect(shape.pointerFine, 'a mouse device').toBe(true);
          expect(shape.sideways, 'sideways scroll').toBeLessThanOrEqual(0);
          const s = Math.min(shape.column, 1536) / 1106;
          const near = (actual: number, design: number, what: string): void =>
            expect(actual, `${what} at ${viewport.width}`).toBeCloseTo(
              design * s,
              1,
            );

          expect(shape.openers).toHaveLength(bands);
          const [first] = shape.openers;
          for (const opener of shape.openers) {
            // Every band's column is the same width (one gutter, §15.15 a).
            expect(opener.column, `“${opener.title}” column`).toBeCloseTo(
              shape.column,
              1,
            );
            near(opener.titleSize, DESIGN.title, `“${opener.title}” title`);
            near(
              opener.eyebrowSize,
              DESIGN.eyebrow,
              `“${opener.title}” eyebrow`,
            );
            // ONE left edge: every eyebrow and every title on the first's.
            expect(opener.titleLeft, `“${opener.title}” left`).toBeCloseTo(
              first?.titleLeft ?? NaN,
              1,
            );
            expect(
              opener.eyebrowLeft,
              `“${opener.title}” eyebrow left`,
            ).toBeCloseTo(first?.titleLeft ?? NaN, 1);
            // …and one gap between the two.
            expect(opener.gap, `“${opener.title}” gap`).toBeCloseTo(
              first?.gap ?? NaN,
              1,
            );
          }

          // The numbers band: the tile drawn at 9/8 — its sentence the
          // doctor card's quote size (the owner's "1 to 1").
          expect(shape.tiles).toHaveLength(3);
          for (const tile of shape.tiles) {
            near(tile.sentence, DESIGN.tileSentence, 'the tile sentence');
            near(tile.label, DESIGN.tileLabel, 'the tile label');
            near(tile.number, DESIGN.tileNumber, 'the tile number');
            near(tile.disc, DESIGN.tileDisc, 'the tile disc');
            expect(tile.sentence, 'sentence = quote').toBeCloseTo(
              shape.quote ?? NaN,
              2,
            );
          }
          near(shape.quote ?? NaN, DESIGN.quote, 'the doctor quote');

          // The map band: one design, every part × s; the map 2:1.
          expect(shape.map).not.toBeNull();
          near(shape.map?.address ?? NaN, DESIGN.address, 'the address');
          near(shape.map?.disc ?? NaN, DESIGN.mapDisc, 'the row disc');
          expect(
            (shape.map?.width ?? NaN) / (shape.map?.height ?? NaN),
          ).toBeCloseTo(2, 1);

          if (reviews) {
            // The deck is untouched: its body text stays the theme's 16px.
            expect(shape.reviewBody).toBeCloseTo(16, 2);
          }
          if (staff) {
            // Three fixed tiles on one row, each 352 design px, names <h3>.
            expect(shape.staff).toHaveLength(3);
            for (const tile of shape.staff) {
              near(tile.width, DESIGN.staffTile, 'the staff tile');
              near(tile.name, DESIGN.staffName, 'the staff name');
              expect(tile.level).toBe('H3');
              expect(tile.top).toBeCloseTo(shape.staff[0]?.top ?? NaN, 1);
            }
          }
        });
      }

      test('the map band keeps ONE proportion — its map’s share of the band the same at every window', async ({
        page,
      }) => {
        const shares: number[] = [];
        for (const viewport of LAPTOPS) {
          await openAt(page, at, viewport);
          const { map } = await readPage(page, STAFF_TITLE[locale]);
          shares.push((map?.width ?? NaN) / (map?.band ?? NaN));
        }
        // Within two points of the 1401 window's share: the typeface sets
        // larger words a little narrower per em (`font-optical-sizing:
        // auto`), so the rows' track is not exactly × s — measured 68.5 % at
        // a 1280 window's column, 68.8 % at 1401, 69.9 % at 1882 and past the
        // cap (ClinicLocation's THE NUMBERS), where develop's share ran from
        // 65.8 % to 83.9 %.
        for (const share of shares) {
          expect(Math.abs(share - (shares[2] ?? NaN))).toBeLessThan(0.02);
        }
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
          const shape = await readPage(page, STAFF_TITLE[locale]);
          expect(shape.sideways, 'sideways scroll').toBeLessThanOrEqual(0);
          for (const opener of shape.openers) {
            expect(opener.eyebrowSize).toBe(14);
            // `band`: 30px under a 28rem column, 36 from it.
            expect(opener.titleSize).toBe(shape.column < 448 ? 30 : 36);
          }
          for (const tile of shape.tiles) expect(tile.sentence).toBe(16);
          expect(shape.map?.address).toBe(16);
          expect(shape.map?.disc).toBe(44);
          if (staff) {
            // The staff tile's ONE width on phones and tablets: 18rem.
            for (const tile of shape.staff) expect(tile.width).toBe(288);
          }
        });
      }

      for (const tablet of [
        { width: 1180, height: 820 },
        { width: 1366, height: 1024 },
      ] as const) {
        test.describe(`a ${tablet.width} × ${tablet.height} touch tablet`, () => {
          test.use({ viewport: tablet, hasTouch: true, isMobile: true });

          test('declares nothing — every band the theme’s own size (the owner: “Touch devices unchanged”)', async ({
            page,
          }) => {
            await page.emulateMedia({ reducedMotion: 'reduce' });
            await page.goto(at);
            await page.waitForSelector('main iframe', { state: 'attached' });
            await page.evaluate(() => document.fonts.ready);
            const shape = await readPage(page, STAFF_TITLE[locale]);
            expect(shape.pointerFine).toBe(false);
            for (const opener of shape.openers) {
              expect(opener.titleSize).toBe(36);
              expect(opener.eyebrowSize).toBe(14);
            }
            for (const tile of shape.tiles) expect(tile.sentence).toBe(16);
            expect(shape.map?.address).toBe(16);
            if (staff) {
              for (const tile of shape.staff) expect(tile.width).toBe(288);
            }
          });
        });
      }
    });
  }

  test.describe(`/${locale}/team/ — the staff tiles hold one width on every phone`, () => {
    // A PHONE: touch, and overlay scrollbars — a desktop window this narrow
    // would reserve a classic scrollbar's 15px and squeeze the column under
    // 288 at 360, which no phone does.
    test.use({
      locale: BROWSER_LOCALE[locale],
      isMobile: true,
      hasTouch: true,
    });
    onLaptopOnly();

    for (const width of [320, 360, 390, 412, 430] as const) {
      test(`at ${width}px a tile is ${width === 320 ? 'the column (256px)' : '288px'} and nothing scrolls sideways`, async ({
        page,
      }) => {
        await openAt(page, `/${locale}/team/`, { width, height: 844 });
        const shape = await readPage(page, STAFF_TITLE[locale]);
        expect(shape.sideways).toBeLessThanOrEqual(0);
        expect(shape.staff).toHaveLength(3);
        for (const tile of shape.staff) {
          expect(tile.width).toBe(width === 320 ? shape.column : 288);
        }
      });
    }
  });
}
