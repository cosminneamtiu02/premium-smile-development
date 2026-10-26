import { expect, type Page, test } from '@playwright/test';
import { pageCount } from '../../src/lib/blog/blog';

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
// eyebrow from the individual dr page", "Whole page, like Home"); two blocks
// below read that page beside Home at every window — phone and tablet
// included. Since 2026-10-14 the blog's list page draws in the scale too
// (CLAUDE.md §15.39 round 2: its hero, its three-across grid, its pager, and
// the map under them); the last block reads it beside Home the same way.
// Since 2026-10-15 the Team page opens on that very hero (sections/PageHero,
// the doctors band's page opener — the owner: "implement something similar
// instead of FAMILIA PREMIUM SMILE / Specialiștii cu care ne mândrim on the
// echipa page"): its doctors band has no eyebrow and <h2> any more, and the
// page's blocks check its <h1> the way the blog's block checks the blog's.
//
// WHY THE BUILT EXPORT: the scale is real CSS — a registered custom property,
// container queries, `@supports` and `(pointer: fine)` — resolved by the
// engine against the page a visitor downloads. Nothing here is a screenshot:
// computed font sizes and boxes, read off the page (the doctor-showcase
// spec's idiom). The two band words read here — the staff band's title and
// the map band's — are spelled below, never imported, so a silent rename
// fails here. The one thing imported is a fact of the DATA, never a word:
// lib/blog's page count, which says whether the blog's first page has a
// pager at all (the Pages/Blog twin reads it the same way).
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
  /** Does the page open on the centred hero — its visible <h1> and lead,
   *  sections/PageHero (the blog list's, the Team page's since 2026-10-15)? */
  readonly hero: boolean;
}[] = [
  // Home: the numbers, the blog's articles (sections/BlogCarousel, since
  // 2026-10-17 — this count stood at 4 until 2026-10-25, red on develop's own
  // export from that day), the doctors, the map, the reviews.
  { path: (l) => `/${l}/`, bands: 5, staff: false, reviews: true, hero: false },
  // Team: the hero over the doctors (no eyebrow and <h2> of their own since
  // 2026-10-15), then the staff, the numbers, the map.
  {
    path: (l) => `/${l}/team/`,
    bands: 3,
    staff: true,
    reviews: false,
    hero: true,
  },
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
 *  tile's four at 9/8, the map row's text and disc, the staff tile's width,
 *  and the `hero` step's value at the owner's 1401 window — 16 + 3.5 × 14.01
 *  = 65.035, as 16.26 spacing steps: ui/Heading's `hero-scaled` step, which
 *  the doctor page's name, the page hero's <h1> — the blog list's and, since
 *  2026-10-15, the Team page's — and an article's title ask for (its
 *  header's 'hero-scaled' JOINED; tests/unit/design-scale.test.ts holds the
 *  size to that one file). */
/** THE HEADING'S REACH (sections/PageHero's paragraph of that name), in
 *  design pixels: how far the hero's <h1> may pass EACH edge of its column
 *  inside the band scale — 135 since 2026-10-16, HALF the 67.5 spacing steps
 *  its max-width adds to the column, the box being centred (100 a side until
 *  then; widened so the fallback face's first lines fit and the heading never
 *  re-wraps when the webfont lands). The whole 67.5 × 4 as a per-edge bound
 *  let a box twice as wide through (the verify review, 2026-10-16). */
const REACH = (67.5 / 2) * 4;

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
  hero: 16.26 * 4,
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
  /** The page's FIRST <h1> and the <p> after it, read as the blog block
   *  reads its hero — meaningful where the page opens on sections/PageHero
   *  (PAGES' `hero`); on Home it is the page's `sr-only` <h1>, never checked. */
  readonly hero: {
    readonly size: number;
    readonly left: number;
    readonly right: number;
    /** Its band's RHYTHM box — the column the hero centres on and the one
     *  its reach is measured from: capped at 96rem and centred past a 1920
     *  window, where ui/Container's own box runs wider (the TS review,
     *  2026-10-15: measured against that box, the reach could never fail at
     *  2560). */
    readonly columnLeft: number;
    readonly columnRight: number;
    readonly pageRight: number;
    /** One hundred `vw` off a probe box — what the `hero` clamp reads. */
    readonly hundredVw: number;
    readonly whiteSpace: { readonly h1: string; readonly lead: string };
    readonly copyLines: { readonly h1: number; readonly lead: number };
    readonly lines: { readonly h1: number; readonly lead: number };
  };
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
    // NOTHING TO SCROLL SIDEWAYS, measured by the root's own BOX, which ends
    // where a classic scrollbar's reserved gutter begins — never by the
    // root's `clientWidth`. Under globals.css's stable scrollbar gutter that
    // is the WHOLE window, gutter included — so a check against it let up to
    // 15px of overflow through (the G2 review, 2026-10-15). Measured in this
    // Chromium the same day, on a page with that gutter and a classic 15px
    // scrollbar at a 1140 window: `clientWidth` 1140, the root's box 1125,
    // and a page 5px too wide scrolled 5px sideways while the old reading
    // said −10. PostList.scale.test.tsx's expectNoSideways measures the same
    // way; `scrollWidth` is whole pixels, so the box is rounded up to meet it.
    const root = document.documentElement;
    // THE HERO (PAGES' `hero`): the first <h1> and its lead, the <p> after it.
    const h1 = document.querySelector('main h1');
    const heroLead = h1?.nextElementSibling;
    // <h1> → PageHero's <header> → the band's rhythm box.
    const heroColumn =
      h1?.parentElement?.parentElement?.getBoundingClientRect();
    const copyLinesOf = (element: Element | null | undefined): number =>
      element ? (element.textContent ?? '').split('\n').length : NaN;
    const renderedLinesOf = (element: Element | null | undefined): number => {
      if (!element) return NaN;
      const range = document.createRange();
      range.selectNodeContents(element);
      return new Set(
        Array.from(range.getClientRects())
          .filter((rect) => rect.width > 0)
          .map((rect) => Math.round(rect.top)),
      ).size;
    };
    const whiteSpaceOf = (element: Element | null | undefined): string =>
      element ? getComputedStyle(element).whiteSpace : '';
    // Nothing to scroll sideways is read BEFORE the probe enters the page.
    const sideways =
      root.scrollWidth - Math.ceil(root.getBoundingClientRect().width);
    const probe = document.createElement('div');
    probe.style.width = '100vw';
    document.body.append(probe);
    const hundredVw = probe.getBoundingClientRect().width;
    probe.remove();
    return {
      gutter: window.innerWidth - document.body.getBoundingClientRect().width,
      pointerFine: matchMedia('(pointer: fine)').matches,
      column: openers[0]?.column ?? NaN,
      sideways,
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
      hero: {
        size: size(h1),
        left: h1?.getBoundingClientRect().left ?? NaN,
        right: h1?.getBoundingClientRect().right ?? NaN,
        columnLeft: heroColumn?.left ?? NaN,
        columnRight: heroColumn?.right ?? NaN,
        pageRight: root.getBoundingClientRect().right,
        hundredVw,
        whiteSpace: { h1: whiteSpaceOf(h1), lead: whiteSpaceOf(heroLead) },
        copyLines: { h1: copyLinesOf(h1), lead: copyLinesOf(heroLead) },
        lines: {
          h1: renderedLinesOf(h1),
          lead: renderedLinesOf(heroLead),
        },
      },
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

/** The map band of one page — the very band Home draws, on every page that
 *  mounts it (§15.32 round 3). */
interface MapBand {
  readonly opener: Opener;
  readonly map: NonNullable<PageShape['map']>;
  readonly pointerFine: boolean;
}

/** The map band of the page loaded now, read off it — `where` names the page. */
const readMapBand = async (
  page: Page,
  locale: Locale,
  where: string,
): Promise<MapBand> => {
  const shape = await readPage(page, STAFF_TITLE[locale]);
  const opener = shape.openers.find(
    (candidate) => candidate.title === LOCATION_TITLE[locale],
  );
  if (opener === undefined) throw new Error(`no map band on ${where}`);
  if (shape.map === null) throw new Error(`no map on ${where}`);
  expect(shape.sideways, `sideways scroll on ${where}`).toBeLessThanOrEqual(0);
  return { opener, map: shape.map, pointerFine: shape.pointerFine };
};

/** One page's map band at one window: a fresh load, then the reading. */
const mapBandAt = async (
  page: Page,
  locale: Locale,
  path: string,
  viewport: { width: number; height: number },
): Promise<MapBand> => {
  await openAt(page, path, viewport);
  return readMapBand(page, locale, path);
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

/** One page's band and Home's, number for number, to a twentieth of a pixel
 *  — never vacuous: each number is a real length on both pages. `whose`
 *  names the page compared. */
const expectSameBand = (
  band: MapBand,
  home: MapBand,
  where: string,
  whose: string,
): void => {
  const homes = numbersOf(home);
  for (const [name, value] of Object.entries(numbersOf(band))) {
    const theirs = homes[name] ?? NaN;
    expect(Number.isFinite(value), `${name} at ${where}`).toBe(true);
    expect(Number.isFinite(theirs), `Home’s ${name} at ${where}`).toBe(true);
    expect(value, `${name} at ${where}: ${whose}`).toBeCloseTo(theirs, 1);
  }
};

/** THE HERO INSIDE THE SCALE (sections/PageHero — its THE <h1>, THE STAIRWAY
 *  and THE HEADING'S REACH; the blog block below checks the blog's the same
 *  way): the <h1> at the doctor page's name's 65.04 design pixels, both
 *  blocks on the pre-line white-space and rendering exactly the copy's lines
 *  — the <h1> two, the lead three — the <h1>'s box centred on its band's
 *  column, never more than 135 design pixels past either edge, and inside
 *  the window. */
const expectHeroInTheScale = (
  shape: PageShape,
  s: number,
  where: string,
): void => {
  const { hero } = shape;
  expect(hero.size, `the hero’s <h1> at ${where}`).toBeCloseTo(
    DESIGN.hero * s,
    1,
  );
  expect(hero.whiteSpace.h1, `the <h1>’s white-space at ${where}`).toBe(
    'pre-line',
  );
  expect(hero.whiteSpace.lead, `the lead’s white-space at ${where}`).toBe(
    'pre-line',
  );
  expect(hero.copyLines.h1, `the copy’s <h1> lines at ${where}`).toBe(2);
  expect(hero.copyLines.lead, `the copy’s lead lines at ${where}`).toBe(3);
  expect(hero.lines.h1, `the <h1>’s rendered lines at ${where}`).toBe(2);
  expect(hero.lines.lead, `the lead’s rendered lines at ${where}`).toBe(3);
  expect(
    (hero.left + hero.right) / 2,
    `the <h1> centred on its column at ${where}`,
  ).toBeCloseTo((hero.columnLeft + hero.columnRight) / 2, 0);
  expect(
    hero.columnLeft - hero.left,
    `the <h1> past the column’s start at ${where}`,
  ).toBeLessThanOrEqual(REACH * s + 0.1);
  expect(
    hero.right - hero.columnRight,
    `the <h1> past the column’s end at ${where}`,
  ).toBeLessThanOrEqual(REACH * s + 0.1);
  expect(
    hero.left,
    `the <h1> inside the window at ${where}`,
  ).toBeGreaterThanOrEqual(0);
  expect(
    hero.right,
    `the <h1> inside the window at ${where}`,
  ).toBeLessThanOrEqual(hero.pageRight);
};

/** THE HERO OFF THE SCALE: nothing declared — the <h1> on the `hero` clamp
 *  itself (2rem, 1rem + 3.5vw, 4.5rem, its `vw` the page's own, measured),
 *  both blocks on the normal white-space — the copy's line breaks a space,
 *  as prose — and the <h1> inside its column. */
const expectHeroOffTheScale = (shape: PageShape, where: string): void => {
  const { hero } = shape;
  expect(hero.size, `the hero’s <h1> at ${where}`).toBeCloseTo(
    Math.min(72, Math.max(32, 16 + 0.035 * hero.hundredVw)),
    1,
  );
  expect(hero.whiteSpace.h1, `the <h1>’s white-space at ${where}`).toBe(
    'normal',
  );
  expect(hero.whiteSpace.lead, `the lead’s white-space at ${where}`).toBe(
    'normal',
  );
  expect(
    hero.left,
    `the <h1> from its column’s start at ${where}`,
  ).toBeGreaterThanOrEqual(hero.columnLeft - 0.1);
  expect(
    hero.right,
    `the <h1> to its column’s end at ${where}`,
  ).toBeLessThanOrEqual(hero.columnRight + 0.1);
};

for (const locale of ['ro', 'de'] as const) {
  for (const { path, bands, staff, reviews, hero } of PAGES) {
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
          if (hero) expectHeroInTheScale(shape, s, `${viewport.width}`);
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
          if (hero) expectHeroOffTheScale(shape, `${viewport.width}`);
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
            if (hero) expectHeroOffTheScale(shape, `${tablet.width}`);
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

    for (const viewport of LAPTOPS) {
      test(`at ${viewport.width} × ${viewport.height}: the band Home draws — every number equal, every size the design × s`, async ({
        page,
      }) => {
        const home = await mapBandAt(page, locale, `/${locale}/`, viewport);
        const doctor = await mapBandAt(
          page,
          locale,
          DOCTOR_PATH(locale),
          viewport,
        );
        expect(doctor.pointerFine, 'a mouse device').toBe(true);
        expectSameBand(doctor, home, `${viewport.width}`, 'the doctor page’s');

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
          const home = await mapBandAt(
            page,
            locale,
            `/${locale}/`,
            device.viewport,
          );
          const doctor = await mapBandAt(
            page,
            locale,
            DOCTOR_PATH(locale),
            device.viewport,
          );
          expect(doctor.pointerFine, 'a touch device').toBe(false);
          expectSameBand(doctor, home, device.name, 'the doctor page’s');
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
    // laptop or desktop every band opener — the tiles, the biography, the
    // courses, the map — has Home's eyebrow and <h2>, to a twentieth of a
    // pixel; the biography's and the map's stand on Home's left edge, and the
    // courses' — beside the biography since round 7 (2026-10-13), in the
    // band's second column — three fifths of the box less its 48-design-pixel
    // gap, plus the gap, to the right of it: the biography's 3fr beside the
    // courses' 2fr (the owner, the same evening: "like 20% wider"); and the
    // two contents start level, the courses' list and the biography's
    // paragraphs on one y ("to start at same y when they sit next to the
    // other" — the band's subgrid). The tiles' opener is centred, D30, so not
    // compared.
    // Everything under the openers is its design size × s: the name (the
    // `hero` step's 1401 value, 65.04), the specialty, the credo card, a
    // biography paragraph, an idea of the courses, the tiles at 9/8. On a
    // phone and a touch tablet nothing is declared: every size is the
    // theme's, Home's too.
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
      /** The first idea of the courses — one `<li>` per idea, no years since
       *  2026-10-13 (CLAUDE.md §15.23 round 7). */
      readonly idea: number;
      /** Where the two contents start — the biography's paragraphs block and
       *  the courses' list, untransformed boxes (the lit idea inside the
       *  list is drawn at 1.04, so it is not the box compared). */
      readonly starts: { readonly paragraphs: number; readonly ideas: number };
      readonly tiles: PageShape['tiles'];
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
          // Nothing to scroll sideways, by the root's own box — readPage's
          // NOTHING TO SCROLL SIDEWAYS.
          const root = document.documentElement;
          return {
            pointerFine: matchMedia('(pointer: fine)').matches,
            sideways:
              root.scrollWidth - Math.ceil(root.getBoundingClientRect().width),
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
            idea: size(courses?.querySelector('li')),
            starts: {
              paragraphs:
                about?.lastElementChild?.getBoundingClientRect().top ?? NaN,
              ideas:
                courses?.querySelector('ul')?.getBoundingClientRect().top ??
                NaN,
            },
            tiles,
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
        // …the biography and the map on Home's left edge (no outdent since
        // round 7), the courses at the second column's start: the band's box
        // is the column capped at 96rem, its tracks 3fr and 2fr, 48 design
        // pixels apart (sections/DoctorProfile's grid) — the second track
        // begins 3/5 of the box less the gap, plus the gap, in.
        expect(doctor.openers.about.left, 'biography left').toBeCloseTo(
          home.titleLeft,
          1,
        );
        expect(doctor.openers.map.left, 'map left').toBeCloseTo(
          home.titleLeft,
          1,
        );
        const box = Math.min(doctor.column, 1536);
        const gap = 48 * s;
        expect(doctor.openers.courses.left, 'courses left').toBeCloseTo(
          home.titleLeft + (3 / 5) * (box - gap) + gap,
          1,
        );
        // …and the two contents start level, whatever each opener's height.
        expect(
          Math.abs(doctor.starts.ideas - doctor.starts.paragraphs),
          'the courses and the paragraphs start level',
        ).toBeLessThanOrEqual(0.5);

        // THE OPENER: the name, the specialty, the credo card's two steps
        // (its title on `band` against the card's own content box).
        near(doctor.name, DESIGN.hero, 'the name');
        near(doctor.specialty, DESIGN.eyebrow, 'the specialty');
        near(doctor.credo.eyebrow, DESIGN.eyebrow, 'the credo eyebrow');
        near(
          doctor.credo.title,
          doctor.credo.content >= 448 ? 36 : 30,
          'the credo title',
        );

        // UNDER THE OPENERS: a biography paragraph, an idea of the courses —
        // the same 18 design pixels, side by side — and the tiles at 9/8,
        // Home's tiles exactly.
        near(doctor.paragraph, 18, 'a biography paragraph');
        near(doctor.idea, 18, 'an idea of the courses');
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
          expect(doctor.idea).toBe(18);
          // Counted first, so a reader that found no tile cannot pass the loop.
          expect(doctor.tiles).toHaveLength(4);
          for (const tile of doctor.tiles) expect(tile.sentence).toBe(16);
        });
      });
    }
  });

  test.describe(`/${locale}/blog/ — the blog’s list in the band scale, its map Home’s (CLAUDE.md §15.39 round 2)`, () => {
    // The owner, 2026-10-14: "i want 3 per row, max 6 items on a page, so 2
    // rows" — and the list page joined THE BAND SCALE (sections/PostList's
    // paragraph of that name). So on a laptop or desktop the list band is ONE
    // design × s: the <h1> at the doctor page's name's 65.04 design pixels,
    // the one size the remap cannot redraw, and — the owner, 2026-10-15: "it
    // should not be constrained by a div so that it has same space left and
    // right as the articles seciton" — its box not held to the grid: as wide
    // as its first line, centred on the grid, never more than REACH design
    // pixels past either edge (135 since 2026-10-16), inside the window (THE
    // HEADING'S REACH); the
    // copy's own line breaks kept, the <h1> in exactly its two lines and the
    // lead in its three (THE STAIRWAY); the lead on the theme's base text
    // step, 16 design pixels — ui/Text's, not the site's body size, 18
    // (§15.1's 1.125rem); three cards to a row, each a third of the band
    // less its two 32-design-pixel gaps, the grid on Home's left edge and the
    // pager under its end edge; and the map under the list is Home's band,
    // number for number. Under the step and on a touch screen nothing is
    // declared: the theme's own sizes, the copy's line breaks a space, the
    // <h1> inside the grid's edges, and the columns the grid's own container
    // steps give the column (36rem and 56rem) — one in a 390px window, two at
    // 768, three on a touch tablet held sideways. The two narrow windows are
    // a MOUSE's, not a phone's: they reserve a classic scrollbar's gutter
    // where the browser shows one, which no phone does.
    test.use({ locale: BROWSER_LOCALE[locale] });
    onLaptopOnly();

    const BLOG_PATH = `/${locale}/blog/`;

    interface BlogShape {
      readonly pointerFine: boolean;
      readonly sideways: number;
      /** The list band's ui/Container width — its column. */
      readonly column: number;
      readonly h1: number;
      /** The <h1>'s box edges — past the grid's inside the band scale, never
       *  past the page's (THE HEADING'S REACH). */
      readonly h1Left: number;
      readonly h1Right: number;
      /** The page's own right edge — the root's box, which ends where a
       *  classic scrollbar begins. */
      readonly pageRight: number;
      /** One hundred `vw` in px, off a probe box: what the `hero` clamp of the
       *  <h1>'s size reads. Never the window's width: whether `vw` counts a
       *  classic scrollbar's reserved gutter is the engine's call. This
       *  Chromium counts it (2026-10-15, the built page: 768px at a 768
       *  window behind a 15px gutter); an engine that left it out would set
       *  that clamp at 42.355px where the window's width says 42.88, so the
       *  check reads what the clamp reads. */
      readonly hundredVw: number;
      readonly lead: number;
      /** THE STAIRWAY, block by block: the computed white-space; the
       *  copy's own lines — its text split at its line breaks; and the lines
       *  the page renders — the block's text boxes grouped by their top, as
       *  PageHero.fixtures' `linesOf` reads a line. */
      readonly whiteSpace: { readonly h1: string; readonly lead: string };
      readonly copyLines: { readonly h1: number; readonly lead: number };
      readonly lines: { readonly h1: number; readonly lead: number };
      /** Page 1's cards, in order: each its grid cell's box — the <li>, never
       *  the <article>, which the hover jump transforms — its title's size,
       *  and its card's content width, which that title's `band` step reads
       *  (30px under a 28rem container, 36 from it). */
      readonly cards: readonly {
        readonly left: number;
        readonly right: number;
        readonly top: number;
        readonly bottom: number;
        readonly title: number;
        readonly content: number;
      }[];
      /** The pager's end edge — null on a one-page blog, which has none. */
      readonly pagerRight: number | null;
    }

    /** The list page loaded now, read off it. */
    const readBlog = (page: Page): Promise<BlogShape> =>
      page.evaluate(() => {
        const size = (element: Element | null | undefined): number =>
          element ? parseFloat(getComputedStyle(element).fontSize) : NaN;
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
        const h1 = document.querySelector('main h1');
        const band = h1?.closest('section');
        const cards = Array.from(
          band?.querySelectorAll('ul[role="list"] > li') ?? [],
        )
          .filter((li) => li.querySelector(':scope > article'))
          .map((li) => {
            const box = li.getBoundingClientRect();
            const article = li.querySelector(':scope > article');
            return {
              left: box.left,
              right: box.right,
              top: box.top,
              bottom: box.bottom,
              title: size(article?.querySelector('h2')),
              content: contentOf(article?.firstElementChild),
            };
          });
        // The hero's lead: the <p> right after the <h1>.
        const lead = h1?.nextElementSibling;
        /** The copy's own lines: the block's text split at its line breaks. */
        const copyLinesOf = (element: Element | null | undefined): number =>
          element ? (element.textContent ?? '').split('\n').length : NaN;
        /** The lines the page renders: the block's text boxes, the empty
         *  ones left out, grouped by their top. */
        const linesOf = (element: Element | null | undefined): number => {
          if (!element) return NaN;
          const range = document.createRange();
          range.selectNodeContents(element);
          return new Set(
            Array.from(range.getClientRects())
              .filter((rect) => rect.width > 0)
              .map((rect) => Math.round(rect.top)),
          ).size;
        };
        const whiteSpaceOf = (element: Element | null | undefined): string =>
          element ? getComputedStyle(element).whiteSpace : '';
        // Nothing to scroll sideways, by the root's own box — readPage's
        // NOTHING TO SCROLL SIDEWAYS — read BEFORE the probe below enters
        // the page.
        const root = document.documentElement;
        const sideways =
          root.scrollWidth - Math.ceil(root.getBoundingClientRect().width);
        // One hundred `vw`, off a probe box that is in the page for this one
        // reading (PostList.scale.test.tsx's `vw` reads it the same way).
        const probe = document.createElement('div');
        probe.style.width = '100vw';
        document.body.append(probe);
        const hundredVw = probe.getBoundingClientRect().width;
        probe.remove();
        return {
          pointerFine: matchMedia('(pointer: fine)').matches,
          sideways,
          column: band?.firstElementChild?.getBoundingClientRect().width ?? NaN,
          h1: size(h1),
          h1Left: h1?.getBoundingClientRect().left ?? NaN,
          h1Right: h1?.getBoundingClientRect().right ?? NaN,
          pageRight: root.getBoundingClientRect().right,
          hundredVw,
          lead: size(lead),
          whiteSpace: { h1: whiteSpaceOf(h1), lead: whiteSpaceOf(lead) },
          copyLines: { h1: copyLinesOf(h1), lead: copyLinesOf(lead) },
          lines: { h1: linesOf(h1), lead: linesOf(lead) },
          cards,
          pagerRight:
            band?.querySelector('nav')?.getBoundingClientRect().right ?? null,
        };
      });

    /** How many cards stand on the first row — those level with the first. */
    const firstRow = (shape: BlogShape): number =>
      shape.cards.filter(
        (card) => Math.abs(card.top - (shape.cards[0]?.top ?? NaN)) < 0.5,
      ).length;

    /** Every card past the first row stands under the card one row before
     *  it, on its column. */
    const expectRows = (shape: BlogShape, columns: number): void => {
      for (const [index, card] of shape.cards.entries()) {
        const above = shape.cards[index - columns];
        if (above === undefined) continue;
        expect(card.top, `card ${index + 1} under its row`).toBeGreaterThan(
          above.bottom,
        );
        expect(card.left, `card ${index + 1} on its column`).toBeCloseTo(
          above.left,
          1,
        );
      }
    };

    for (const viewport of LAPTOPS) {
      test(`at ${viewport.width} × ${viewport.height}: the <h1> and the cards the design × s, three to a row, the map Home’s`, async ({
        page,
      }) => {
        const home = await mapBandAt(page, locale, `/${locale}/`, viewport);
        await openAt(page, BLOG_PATH, viewport);
        const blog = await readBlog(page);
        const map = await readMapBand(page, locale, BLOG_PATH);
        expect(blog.pointerFine, 'a mouse device').toBe(true);
        expect(blog.sideways, 'sideways scroll').toBeLessThanOrEqual(0);
        const s = Math.min(blog.column, 1536) / 1106;
        const near = (actual: number, design: number, what: string): void =>
          expect(actual, `${what} at ${viewport.width}`).toBeCloseTo(
            design * s,
            1,
          );

        // THE HERO: the <h1> at the doctor page's name's design size, the
        // lead on the theme's base text step, 16 design pixels (ui/Text's —
        // not the site's body size, 18).
        near(blog.h1, DESIGN.hero, 'the <h1>');
        near(blog.lead, 16, 'the lead');

        // THE STAIRWAY (sections/PostList's paragraph of that name): both
        // blocks keep the copy's own line breaks — the pre-line white-space —
        // and render exactly the copy's lines, the <h1> two and the lead
        // three. Under that white-space every break of the copy starts a
        // line, so as many rendered lines as the copy has means no line
        // wrapped on top of them: each line is the copy's own, the stairway
        // whole. A lost pre-line fails the white-space first, whatever its
        // wrap would then happen to count.
        const where = `at ${viewport.width}`;
        expect(blog.whiteSpace.h1, `the <h1>’s white-space ${where}`).toBe(
          'pre-line',
        );
        expect(blog.whiteSpace.lead, `the lead’s white-space ${where}`).toBe(
          'pre-line',
        );
        expect(blog.copyLines.h1, `the copy’s <h1> lines ${where}`).toBe(2);
        expect(blog.copyLines.lead, `the copy’s lead lines ${where}`).toBe(3);
        expect(blog.lines.h1, `the <h1>’s rendered lines ${where}`).toBe(2);
        expect(blog.lines.lead, `the lead’s rendered lines ${where}`).toBe(3);

        // THREE CARDS A ROW — never vacuous: a full first row, every row
        // under the last, every card (1106 − 2 × 32) / 3 design pixels wide
        // and its title on the `band` step its card reads.
        expect(blog.cards.length, 'cards on page 1').toBeGreaterThanOrEqual(3);
        expect(firstRow(blog), 'cards on the first row').toBe(3);
        expectRows(blog, 3);
        for (const card of blog.cards) {
          near(card.right - card.left, (1106 - 2 * 32) / 3, 'a card');
          near(card.title, card.content >= 448 ? 36 : 30, 'a card title');
        }
        // …the grid on Home's left edge, and the pager under its end edge.
        expect(blog.cards[0]?.left ?? NaN, 'the grid’s left edge').toBeCloseTo(
          home.opener.titleLeft,
          1,
        );
        // THE PAGER, read off the DATA so the check is never skipped by
        // finding none: page 1 has a pager exactly when the blog has more
        // than one page — lib/blog's page count, the same in every language
        // (twelve posts today, six a page: it does) — and then its end edge
        // is the grid's.
        expect(
          blog.pagerRight === null ? 'no pager' : 'a pager',
          `page 1 of ${pageCount()} ${where}`,
        ).toBe(pageCount() > 1 ? 'a pager' : 'no pager');
        if (pageCount() > 1) {
          expect(blog.pagerRight ?? NaN, 'the pager’s end edge').toBeCloseTo(
            blog.cards[2]?.right ?? NaN,
            1,
          );
        }

        // THE HEADING'S REACH (sections/PageHero's paragraph of that name):
        // the <h1>'s box is not held to the grid — at 65.04 design pixels
        // every shipped first line is wider than the grid's 1106 (Romanian's
        // 1183.5, German's 1201.4 at 1401) — so it passes BOTH of the grid's
        // edges, by the same amount, never by more than REACH design pixels,
        // and stays inside the window. Wider by MORE than 10 design pixels:
        // a heading held to the grid is the grid's width give or take a 64th
        // of a pixel, which a bare "wider" would let through; the narrowest
        // first line here, Romanian's, passes each edge by 38.8.
        const gridLeft = blog.cards[0]?.left ?? NaN;
        const gridRight = blog.cards[2]?.right ?? NaN;
        expect(
          blog.h1Right - blog.h1Left,
          `the <h1> wider than the grid at ${viewport.width}`,
        ).toBeGreaterThan(gridRight - gridLeft + 10 * s);
        expect(
          (blog.h1Left + blog.h1Right) / 2,
          `the <h1> centred on the grid at ${viewport.width}`,
        ).toBeCloseTo((gridLeft + gridRight) / 2, 0);
        expect(
          gridLeft - blog.h1Left,
          `the <h1> past the grid’s start at ${viewport.width}`,
        ).toBeLessThanOrEqual(REACH * s + 0.1);
        expect(
          blog.h1Right - gridRight,
          `the <h1> past the grid’s end at ${viewport.width}`,
        ).toBeLessThanOrEqual(REACH * s + 0.1);
        expect(
          blog.h1Left,
          `the <h1> inside the window at ${viewport.width}`,
        ).toBeGreaterThanOrEqual(0);
        expect(
          blog.h1Right,
          `the <h1> inside the window at ${viewport.width}`,
        ).toBeLessThanOrEqual(blog.pageRight);

        // THE MAP: Home's band, number for number — and in the band scale
        // read on this page alone, so the pair cannot agree by both losing it.
        expect(map.pointerFine, 'a mouse device').toBe(true);
        expectSameBand(map, home, `${viewport.width}`, 'the blog page’s');
        near(map.opener.titleSize, DESIGN.title, 'the map title');
        near(map.opener.eyebrowSize, DESIGN.eyebrow, 'the map eyebrow');
        near(map.map.address, DESIGN.address, 'the address');
        near(map.map.disc, DESIGN.mapDisc, 'the row disc');
      });
    }

    /** Nothing declared: the <h1> on the `hero` clamp itself (2rem, 1rem +
     *  3.5vw, 4.5rem — its `vw` the page's own, measured, never the window's
     *  width) and inside the grid's edges, the lead 16px, both blocks on the
     *  normal white-space — the copy's line breaks a space, as prose — a card
     *  title 30 or 36px by its card, `columns` cards to a row — the grid's
     *  own steps for this column — and the map Home's band at the theme's
     *  16px address and 44px disc. Hands back the list page as read. */
    const expectTheTheme = async (
      page: Page,
      viewport: { width: number; height: number },
      columns: number,
      where: string,
    ): Promise<BlogShape> => {
      const home = await mapBandAt(page, locale, `/${locale}/`, viewport);
      await openAt(page, BLOG_PATH, viewport);
      const blog = await readBlog(page);
      const map = await readMapBand(page, locale, BLOG_PATH);
      expect(blog.sideways, `sideways scroll at ${where}`).toBeLessThanOrEqual(
        0,
      );
      // 3.5vw is 0.035 of one hundred `vw` — the probe's width, whatever
      // the engine makes of a classic scrollbar's reserved gutter
      // (BlogShape's `hundredVw`); every touch screen here reserves none.
      expect(blog.h1, `the <h1> at ${where}`).toBeCloseTo(
        Math.min(72, Math.max(32, 16 + 0.035 * blog.hundredVw)),
        1,
      );
      expect(blog.lead, `the lead at ${where}`).toBe(16);
      // OFF THE SCALE the copy's line breaks are spaces: both blocks wrap as
      // prose (THE STAIRWAY holds inside the band scale alone).
      expect(blog.whiteSpace.h1, `the <h1>’s white-space at ${where}`).toBe(
        'normal',
      );
      expect(blog.whiteSpace.lead, `the lead’s white-space at ${where}`).toBe(
        'normal',
      );
      // The grid's steps — two columns from a 36rem column, three from 56rem
      // — must give this window `columns`: never vacuous.
      expect(
        blog.column >= 896 ? 3 : blog.column >= 576 ? 2 : 1,
        `the column at ${where}`,
      ).toBe(columns);
      expect(firstRow(blog), `cards on the first row at ${where}`).toBe(
        columns,
      );
      expectRows(blog, columns);
      for (const card of blog.cards) {
        expect(card.title, `a card title at ${where}`).toBe(
          card.content >= 448 ? 36 : 30,
        );
      }
      // Off the scale the <h1> keeps its column: inside the grid's edges
      // (THE HEADING'S REACH holds only inside the band scale).
      const gridLeft = Math.min(...blog.cards.map((card) => card.left));
      const gridRight = Math.max(...blog.cards.map((card) => card.right));
      expect(
        blog.h1Left,
        `the <h1> from the grid’s start at ${where}`,
      ).toBeGreaterThanOrEqual(gridLeft - 0.1);
      expect(
        blog.h1Right,
        `the <h1> to the grid’s end at ${where}`,
      ).toBeLessThanOrEqual(gridRight + 0.1);
      expectSameBand(map, home, where, 'the blog page’s');
      expect(map.map.address).toBe(16);
      expect(map.map.disc).toBe(44);
      return blog;
    };

    for (const { columns, ...viewport } of [
      { width: 390, height: 844, columns: 1 },
      { width: 768, height: 1024, columns: 2 },
    ] as const) {
      test(`a ${viewport.width}px window (under the step): the theme’s own sizes, ${columns} card(s) a row, the map Home’s`, async ({
        page,
      }) => {
        await expectTheTheme(page, viewport, columns, `${viewport.width}`);
      });
    }

    for (const tablet of [
      { width: 1180, height: 820 },
      { width: 1366, height: 1024 },
    ] as const) {
      test.describe(`a ${tablet.width} × ${tablet.height} touch tablet`, () => {
        test.use({ viewport: tablet, hasTouch: true, isMobile: true });

        test('declares nothing — the theme’s own sizes, three cards a row, the map Home’s', async ({
          page,
        }) => {
          const blog = await expectTheTheme(page, tablet, 3, `${tablet.width}`);
          expect(blog.pointerFine, 'a touch device').toBe(false);
        });
      });
    }
  });
}
