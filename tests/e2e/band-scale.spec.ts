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
// under the step, nothing changes. Since 2026-10-13 a doctor's page draws its
// map band in the scale too (§15.32 round 3, the owner: "as the current map
// on home page is now … on absoultey every page"), and — the same day — every
// other band of it (round 4: "make the exact same thing with the heading and
// eyebrow from the individual dr page", "Whole page, like Home"); the last
// two blocks below read that page beside Home at every window — phone and
// tablet included.
//
// WHY THE BUILT EXPORT: the scale is real CSS — a registered custom property,
// container queries, `@supports` and `(pointer: fine)` — resolved by the
// engine against the page a visitor downloads. Nothing here is a screenshot:
// computed font sizes and boxes, read off the page (the doctor-showcase
// spec's idiom). The two band words read here — the staff band's title and
// the map band's — are spelled below, never imported, so a silent rename
// fails here.
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

/** The map band's <h2> — `home.location.title`, on every page that mounts it. */
const LOCATION_TITLE: Record<Locale, string> = {
  ro: 'Vizitează clinica noastră',
  de: 'Besuchen Sie unsere Klinik',
};

/** A doctor's page — the first in lib/team's list (the phone-gutter spec's). */
const DOCTOR_PATH = (locale: Locale): string =>
  `/${locale}/team/malea-sabau-oana-bianca/`;

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
  /** The first doctor card's width — the staff tile's measure on a phone. */
  readonly doctorCard: number | null;
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
      doctorCard:
        quote?.closest('article')?.getBoundingClientRect().width ?? null,
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
            // The staff tile's width under the step: the column's own under
            // the named `md` step, 28rem — a phone's (since 2026-10-09,
            // CLAUDE.md §15.35) — and 18rem from it.
            for (const tile of shape.staff) {
              expect(tile.width).toBe(shape.column < 448 ? shape.column : 288);
            }
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

  test.describe(`/${locale}/team/ — on every phone a staff tile is the column, like a doctor card`, () => {
    // A PHONE: touch, and overlay scrollbars — a desktop window this narrow
    // reserves a classic scrollbar's 15px, which no phone does. The owner,
    // 2026-10-09 (CLAUDE.md §15.35): "also make "our support team" part
    // readctive on phone as the doctor cards are" — so on a phone, a column
    // under the named `md` step (28rem), every staff tile is the column's own
    // width, the first doctor card's, from a Galaxy Fold's 280px cover screen
    // to the largest iPhone; and the first window off a phone, a 7″ tablet's
    // 600, keeps the fixed 288 (the owner's 2026-10-02 "fixed size" for a
    // tablet).
    test.use({
      locale: BROWSER_LOCALE[locale],
      isMobile: true,
      hasTouch: true,
    });
    onLaptopOnly();

    for (const width of [280, 320, 360, 390, 412, 430, 440] as const) {
      test(`at ${width}px every staff tile is the column and a doctor card’s width, and nothing scrolls sideways`, async ({
        page,
      }) => {
        await openAt(page, `/${locale}/team/`, { width, height: 844 });
        const shape = await readPage(page, STAFF_TITLE[locale]);
        expect(shape.sideways).toBeLessThanOrEqual(0);
        expect(shape.staff).toHaveLength(3);
        // Never vacuous: a phone's column is under the step, and wider than
        // the old fixed 288 from 360 up.
        expect(shape.column).toBeLessThan(448);
        if (width >= 360) expect(shape.column).toBeGreaterThan(288);
        for (const tile of shape.staff) {
          expect(tile.width).toBe(shape.column);
          expect(tile.width).toBe(shape.doctorCard);
        }
      });
    }

    test('at 600px — a 7″ tablet, the first window off a phone — every staff tile keeps its fixed 288px', async ({
      page,
    }) => {
      await openAt(page, `/${locale}/team/`, { width: 600, height: 960 });
      const shape = await readPage(page, STAFF_TITLE[locale]);
      expect(shape.sideways).toBeLessThanOrEqual(0);
      expect(shape.column).toBeGreaterThanOrEqual(448);
      expect(shape.staff).toHaveLength(3);
      for (const tile of shape.staff) expect(tile.width).toBe(288);
    });
  });

  test.describe(`${DOCTOR_PATH(locale)} — its map band IS Home’s, at every window (§15.32 round 3)`, () => {
    // The owner, 2026-10-13: "as the current map on home page is now, i need
    // it updated reactivity wise on absoultey every page, including
    // reactivity. with this i am refering to individual doctor page". So a
    // doctor's map band is read beside Home's at the same window — on a
    // laptop or desktop, where both pages pass `scaled` and THE BAND SCALE
    // draws it, and on a phone and a touch tablet, where neither declares
    // anything — and every number of it must agree: the eyebrow and the <h2>,
    // their left edge and the gap between them, the band's column, the map's
    // box, the band's width, the address and the discs. The doctor page's
    // OTHER bands joined the scale the same day (round 4); the block after
    // this one reads them.
    test.use({ locale: BROWSER_LOCALE[locale] });
    onLaptopOnly();

    interface MapBand {
      readonly opener: Opener;
      readonly map: NonNullable<PageShape['map']>;
      readonly pointerFine: boolean;
    }

    /** One page's map band at one window, read off the built page. */
    const mapBandAt = async (
      page: Page,
      path: string,
      viewport: { width: number; height: number },
    ): Promise<MapBand> => {
      await openAt(page, path, viewport);
      const shape = await readPage(page, STAFF_TITLE[locale]);
      const opener = shape.openers.find(
        (candidate) => candidate.title === LOCATION_TITLE[locale],
      );
      if (opener === undefined) throw new Error(`no map band on ${path}`);
      if (shape.map === null) throw new Error(`no map on ${path}`);
      expect(shape.sideways, `sideways scroll on ${path}`).toBeLessThanOrEqual(
        0,
      );
      return { opener, map: shape.map, pointerFine: shape.pointerFine };
    };

    /** Every number the band is made of, by name. */
    const numbersOf = (band: MapBand): Readonly<Record<string, number>> => ({
      'eyebrow size': band.opener.eyebrowSize,
      'title size': band.opener.titleSize,
      'eyebrow left': band.opener.eyebrowLeft,
      'title left': band.opener.titleLeft,
      'eyebrow → title gap': band.opener.gap,
      column: band.opener.column,
      'map width': band.map.width,
      'map height': band.map.height,
      'band width': band.map.band,
      address: band.map.address,
      'row disc': band.map.disc,
    });

    /** The doctor's band and Home's, number for number, to a twentieth of a
     *  pixel — never vacuous: each number is a real length on both pages. */
    const expectSameBand = (
      doctor: MapBand,
      home: MapBand,
      where: string,
    ): void => {
      const homes = numbersOf(home);
      for (const [name, value] of Object.entries(numbersOf(doctor))) {
        const theirs = homes[name] ?? NaN;
        expect(Number.isFinite(value), `${name} at ${where}`).toBe(true);
        expect(Number.isFinite(theirs), `Home’s ${name} at ${where}`).toBe(
          true,
        );
        expect(value, `${name} at ${where}: the doctor page’s`).toBeCloseTo(
          theirs,
          1,
        );
      }
    };

    for (const viewport of LAPTOPS) {
      test(`at ${viewport.width} × ${viewport.height}: the band Home draws — every number equal, every size the design × s`, async ({
        page,
      }) => {
        const home = await mapBandAt(page, `/${locale}/`, viewport);
        const doctor = await mapBandAt(page, DOCTOR_PATH(locale), viewport);
        expect(doctor.pointerFine, 'a mouse device').toBe(true);
        expectSameBand(doctor, home, `${viewport.width}`);

        // …and in THE BAND SCALE itself, read on the doctor's page alone, so
        // the pair cannot agree by both losing it.
        const s = Math.min(doctor.opener.column, 1536) / 1106;
        const near = (actual: number, design: number, what: string): void =>
          expect(actual, `${what} at ${viewport.width}`).toBeCloseTo(
            design * s,
            1,
          );
        near(doctor.opener.titleSize, DESIGN.title, 'the title');
        near(doctor.opener.eyebrowSize, DESIGN.eyebrow, 'the eyebrow');
        near(doctor.map.address, DESIGN.address, 'the address');
        near(doctor.map.disc, DESIGN.mapDisc, 'the row disc');
        expect(doctor.map.width / doctor.map.height).toBeCloseTo(2, 1);
      });
    }

    for (const device of [
      { name: 'a 390 × 844 phone', viewport: { width: 390, height: 844 } },
      {
        name: 'a 1180 × 820 touch tablet',
        viewport: { width: 1180, height: 820 },
      },
    ] as const) {
      test.describe(device.name, () => {
        test.use({ viewport: device.viewport, hasTouch: true, isMobile: true });

        test('the band Home draws — every number equal, the theme’s own sizes on both', async ({
          page,
        }) => {
          const home = await mapBandAt(page, `/${locale}/`, device.viewport);
          const doctor = await mapBandAt(
            page,
            DOCTOR_PATH(locale),
            device.viewport,
          );
          expect(doctor.pointerFine, 'a touch device').toBe(false);
          expectSameBand(doctor, home, device.name);
          // Nothing declared on a touch screen: the theme's 16px address and
          // 44px disc, on both pages.
          expect(doctor.map.address).toBe(16);
          expect(doctor.map.disc).toBe(44);
        });
      });
    }
  });

  test.describe(`${DOCTOR_PATH(locale)} — THE WHOLE PAGE in the band scale, like Home (§15.32 round 4)`, () => {
    // The owner, 2026-10-13: "take current heading and eyebrow from main
    // page. look how reactive and nice it is. make the exact same thing with
    // the heading and eyebrow from the individual dr page" — and, asked
    // whether the content under the titles should follow, "Whole page, like
    // Home". So a doctor's page is read beside Home at the same window. On a
    // laptop or desktop every band opener — the biography, the courses, the
    // tiles, the map — has Home's eyebrow and <h2>, to a twentieth of a pixel,
    // and Home's left edge (the biography 32 design pixels outdented, D14; the
    // tiles' opener centred, D30, so not compared); and everything under the
    // openers is its design size × s: the name (the `hero` step's 1401 value,
    // 65.04), the specialty, the credo card, a biography paragraph, a year, a
    // course line, the tiles at 9/8, the week's card. On a phone and a touch
    // tablet nothing is declared: every size is the theme's, Home's too.
    test.use({ locale: BROWSER_LOCALE[locale] });
    onLaptopOnly();

    /** The three band titles this block finds the bands by — `team.doctor.*`,
     *  the about one carrying the first doctor's name. */
    const TITLES: Record<
      Locale,
      {
        readonly about: string;
        readonly courses: string;
        readonly stats: string;
      }
    > = {
      ro: {
        about: 'Despre Dr. Malea (Sabău) Oana Bianca',
        courses: 'Cursuri și specializări',
        stats: 'Experiență confirmată în timp',
      },
      de: {
        about: 'Über Dr. Malea (Sabău) Oana Bianca',
        courses: 'Kurse und Spezialisierungen',
        stats: 'Über die Jahre bestätigte Erfahrung',
      },
    };

    /** The name's design size: the `hero` step at the owner's 1401 window,
     *  16 + 3.5 × 14.01 = 65.035, as 16.26 spacing steps (DoctorIntro's THE
     *  BAND SCALE). */
    const NAME = 16.26 * 4;

    interface OpenerSize {
      readonly size: number;
      readonly eyebrow: number;
      readonly left: number;
    }

    interface DoctorShape {
      readonly pointerFine: boolean;
      readonly sideways: number;
      /** ui/Container's width — the map band's first box (every band's is
       *  the same, §15.15 a). */
      readonly column: number;
      readonly openers: Readonly<
        Record<'about' | 'courses' | 'stats' | 'map', OpenerSize>
      >;
      readonly credo: {
        readonly title: number;
        readonly eyebrow: number;
        /** The card's content width — its title's `band` step reads it. */
        readonly content: number;
      };
      readonly name: number;
      readonly specialty: number;
      readonly paragraph: number;
      readonly year: number;
      readonly line: number;
      readonly tiles: PageShape['tiles'];
      readonly week: number;
    }

    /** The doctor page at one window, read off the built page. */
    const doctorAt = async (
      page: Page,
      viewport: { width: number; height: number },
    ): Promise<DoctorShape> => {
      await openAt(page, DOCTOR_PATH(locale), viewport);
      return page.evaluate(
        (titles) => {
          const size = (element: Element | null | undefined): number =>
            element ? parseFloat(getComputedStyle(element).fontSize) : NaN;
          const heading = (text: string): HTMLElement | undefined =>
            Array.from(document.querySelectorAll<HTMLElement>('main h2')).find(
              (candidate) => candidate.textContent?.trim() === text,
            );
          const opener = (text: string) => {
            const title = heading(text);
            return {
              size: size(title),
              eyebrow: size(title?.parentElement?.querySelector(':scope > p')),
              left: title?.getBoundingClientRect().left ?? NaN,
            };
          };
          const contentOf = (element: Element | null | undefined): number => {
            if (!element) return NaN;
            const style = getComputedStyle(element);
            return (
              element.getBoundingClientRect().width -
              parseFloat(style.paddingLeft) -
              parseFloat(style.paddingRight) -
              parseFloat(style.borderLeftWidth) -
              parseFloat(style.borderRightWidth)
            );
          };
          const name = document.querySelector('main h1');
          const credo = document
            .querySelector('main blockquote')
            ?.closest('section');
          const credoTitle = credo?.querySelector('h2');
          const about = heading(titles.about)?.closest('section');
          const courses = heading(titles.courses)?.closest('section');
          const mapBand = document
            .querySelector('main iframe')
            ?.closest('section');
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
          return {
            pointerFine: matchMedia('(pointer: fine)').matches,
            sideways:
              document.documentElement.scrollWidth -
              document.documentElement.clientWidth,
            column:
              mapBand?.firstElementChild?.getBoundingClientRect().width ?? NaN,
            openers: {
              about: opener(titles.about),
              courses: opener(titles.courses),
              stats: opener(titles.stats),
              map: opener(titles.location),
            },
            credo: {
              title: size(credoTitle),
              eyebrow: size(
                credoTitle?.parentElement?.querySelector(':scope > p'),
              ),
              content: contentOf(credo),
            },
            name: size(name),
            // The pair is `flex-col-reverse`: the <h1> first in the DOM, the
            // specialty right after it (DoctorIntro's THE HEADING paragraph).
            specialty: size(name?.nextElementSibling),
            // The biography region: its opener, then the paragraphs' block.
            paragraph: size(about?.lastElementChild?.querySelector('p')),
            year: size(courses?.querySelector('h3')),
            line: size(courses?.querySelector('li')),
            tiles,
            week:
              document
                .querySelector('main dl')
                ?.closest('section')
                ?.getBoundingClientRect().width ?? NaN,
          };
        },
        { ...TITLES[locale], location: LOCATION_TITLE[locale] },
      );
    };

    /** Home's first band opener at one window — the reference every doctor
     *  opener must equal. */
    const homeOpenerAt = async (
      page: Page,
      viewport: { width: number; height: number },
    ): Promise<Opener> => {
      await openAt(page, `/${locale}/`, viewport);
      const [first] = (await readPage(page, STAFF_TITLE[locale])).openers;
      if (first === undefined) throw new Error('no band opener on Home');
      return first;
    };

    for (const viewport of LAPTOPS) {
      test(`at ${viewport.width} × ${viewport.height}: every opener Home’s, every size the design × s`, async ({
        page,
      }) => {
        const home = await homeOpenerAt(page, viewport);
        const doctor = await doctorAt(page, viewport);
        expect(doctor.pointerFine, 'a mouse device').toBe(true);
        expect(doctor.sideways, 'sideways scroll').toBeLessThanOrEqual(0);
        const s = Math.min(doctor.column, 1536) / 1106;
        const near = (actual: number, design: number, what: string): void =>
          expect(actual, `${what} at ${viewport.width}`).toBeCloseTo(
            design * s,
            1,
          );

        // EVERY OPENER HOME'S — the owner's ask, word for word.
        for (const [band, opener] of Object.entries(doctor.openers)) {
          near(opener.size, DESIGN.title, `the ${band} title`);
          near(opener.eyebrow, DESIGN.eyebrow, `the ${band} eyebrow`);
          expect(opener.size, `the ${band} title = Home’s`).toBeCloseTo(
            home.titleSize,
            1,
          );
          expect(opener.eyebrow, `the ${band} eyebrow = Home’s`).toBeCloseTo(
            home.eyebrowSize,
            1,
          );
        }
        // …on Home's left edge, the biography outdented 32 design pixels.
        expect(doctor.openers.courses.left, 'courses left').toBeCloseTo(
          home.titleLeft,
          1,
        );
        expect(doctor.openers.map.left, 'map left').toBeCloseTo(
          home.titleLeft,
          1,
        );
        expect(
          doctor.openers.about.left + 32 * s,
          'the biography’s outdent',
        ).toBeCloseTo(home.titleLeft, 1);

        // THE OPENER: the name, the specialty, the credo card's two steps
        // (its title on `band` against the card's own content box).
        near(doctor.name, NAME, 'the name');
        near(doctor.specialty, DESIGN.eyebrow, 'the specialty');
        near(doctor.credo.eyebrow, DESIGN.eyebrow, 'the credo eyebrow');
        near(
          doctor.credo.title,
          doctor.credo.content >= 448 ? 36 : 30,
          'the credo title',
        );

        // UNDER THE OPENERS: a biography paragraph, a year, a course line,
        // the week's one width, and the tiles at 9/8 — Home's tiles exactly.
        near(doctor.paragraph, 18, 'a biography paragraph');
        near(doctor.year, 30, 'a year');
        near(doctor.line, 18, 'a course line');
        near(doctor.week, 320, 'the week’s card');
        expect(doctor.tiles).toHaveLength(4);
        for (const tile of doctor.tiles) {
          near(tile.sentence, DESIGN.tileSentence, 'the tile sentence');
          near(tile.label, DESIGN.tileLabel, 'the tile label');
          near(tile.number, DESIGN.tileNumber, 'the tile number');
          near(tile.disc, DESIGN.tileDisc, 'the tile disc');
        }
      });
    }

    for (const device of [
      { name: 'a 390 × 844 phone', viewport: { width: 390, height: 844 } },
      {
        name: 'a 1180 × 820 touch tablet',
        viewport: { width: 1180, height: 820 },
      },
    ] as const) {
      test.describe(device.name, () => {
        test.use({ viewport: device.viewport, hasTouch: true, isMobile: true });

        test('declares nothing — every size the theme’s, every opener Home’s', async ({
          page,
        }) => {
          const home = await homeOpenerAt(page, device.viewport);
          const doctor = await doctorAt(page, device.viewport);
          expect(doctor.pointerFine, 'a touch device').toBe(false);
          expect(doctor.sideways, 'sideways scroll').toBeLessThanOrEqual(0);
          for (const [band, opener] of Object.entries(doctor.openers)) {
            // `band`: 30px under a 28rem column, 36 from it.
            expect(opener.size, `the ${band} title`).toBe(
              doctor.column < 448 ? 30 : 36,
            );
            expect(opener.eyebrow, `the ${band} eyebrow`).toBe(14);
            expect(opener.size, `the ${band} title = Home’s`).toBe(
              home.titleSize,
            );
          }
          // The name on the `hero` clamp itself: 2rem, 1rem + 3.5vw, 4.5rem.
          expect(doctor.name).toBeCloseTo(
            Math.min(72, Math.max(32, 16 + 0.035 * device.viewport.width)),
            1,
          );
          expect(doctor.specialty).toBe(14);
          expect(doctor.paragraph).toBe(18);
          expect(doctor.year).toBe(30);
          expect(doctor.line).toBe(18);
          expect(doctor.week).toBe(Math.min(320, doctor.column));
          // Counted first, so a reader that found no tile cannot pass the loop.
          expect(doctor.tiles).toHaveLength(4);
          for (const tile of doctor.tiles) expect(tile.sentence).toBe(16);
        });
      });
    }
  });
}
