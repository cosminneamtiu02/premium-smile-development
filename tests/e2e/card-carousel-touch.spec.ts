import { expect, type Locator, type Page, test } from '@playwright/test';
import { STEP } from '../../src/components/sections/CardCarousel/conveyor';
import ro from '../../src/messages/ro.json';

// THE CARD CAROUSEL UNDER A FINGER, on the BUILT export (sections/
// CardCarousel's THE HAND). A touch is captured by the browser at its press
// already — to the element the finger landed on: a blog card's link or
// title, a gallery photograph — and the drag's own capture takes the pointer
// from that element, which the browser reports with a `lostpointercapture`
// that BUBBLES to the hand's box. Until 2026-10-20 the box read that bubbled
// event as its own capture lost — a cancel — so every touch drag that began
// on the centre card died one event in: the cards snapped back and the ring
// stopped for good (MEASURED by the lane's G2 review with a Chromium CDP
// touch: gotpointercapture on the link, lostpointercapture on the link,
// gotpointercapture on the box). The unit suite fires that bubbling event by
// hand; this spec drives a REAL touch — Chromium's own implicit capture —
// on the two places the carousel lives: Home's articles band and a blog
// article's photo gallery. A finger pressed on the centre card and moved
// left by six tenths of a step: the centre card follows it, and let go, the
// next card comes to the centre and the ring stops for good — and NO CLICK
// follows the drag. That is the check that can fail (the round-2 review: the
// URL check alone could not, for a touch): the page's URL never changes
// without a click, and a finger's drag leaves none behind, which is why the
// island arms no swallow for a finger (its THE HAND). Every click the page
// hears is counted on the window, in its capture phase — should Chromium
// ever leave a click after a touch drag, the count shows it here, and the
// link under the finger would be followed. The count is proved to hear a
// finger: a TAP on the previous arrow afterwards leaves exactly one click,
// and steps the ring back.
//
// A phone held upright with touch (390 × 844, `hasTouch` + `isMobile`), the
// browser's language Romanian (no language banner over the page). The
// carousel is brought to the screen's middle first and the island's clock
// read RUNNING (the live region `off` — the static HTML says `polite`), the
// proof that it hydrated and is in view; it moves by itself only a full
// interval after coming into view, far longer than the gesture takes.
//
// AND A REAL MOUSE (the round-3 review, 2026-10-21): the island swallows the
// click a mouse's or a pen's drag release leaves behind, armed at the release
// and disarmed on the NEXT task — which holds only if that click comes in the
// release's own task. The unit suite fires the click by hand; the last test
// here drags a REAL mouse over a card's link on Home's band, a laptop's
// window, no touch. MEASURED on the built export the same day: Chromium sends
// exactly ONE click after the drag, to the element that captured the pointer
// — the hand's box, not the link — and the island had already prevented it.
// So the page's URL alone could not fail here (the link is no part of that
// click's path); what can is the click itself: heard, inside the hand's box,
// and PREVENTED — a click let through, which a disarm one task too early
// would do, is a tap instead. (The round-3 review measured Firefox swallowing
// it too, and WebKit sending no click at all after a captured drag; this
// suite runs Chromium alone.)

/** A string matched literally inside a RegExp. */
const literally = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const PLACES = [
  {
    name: 'Home’s articles band',
    path: '/ro/',
    region: new RegExp(`^${literally(ro.home.articles.region)}$`),
    previous: ro.home.articles.previous,
  },
  {
    name: 'the blog article’s first photo gallery',
    path: '/ro/blog/cum-iti-alegi-periuta-de-dinti/',
    // „Galerie foto" alone, or „Galerie foto 1 din 2" on a page of two.
    region: new RegExp(`^${literally(ro.blog.article.gallery.region)}`),
    previous: ro.blog.article.gallery.previous,
  },
] as const;

/** What the carousel shows, read in the page: the centre card's name, where
 *  its centre is DRAWN (px from its layout centre, through its computed
 *  transform — the stories' drawnPoint), its layout width and middle, and
 *  the cards' live region. */
type Reading = Readonly<{
  label: string;
  shift: number;
  width: number;
  x: number;
  y: number;
  live: string | null;
}>;

function readCarousel(region: Locator): Promise<Reading> {
  return region.evaluate((section) => {
    const stage = section.querySelector('[aria-live]');
    if (!(stage instanceof HTMLElement)) throw new Error('no stage');
    const centre = [...stage.children].find(
      (card) => !card.hasAttribute('inert'),
    );
    if (!(centre instanceof HTMLElement)) throw new Error('no centre card');
    const matrix = new DOMMatrix(getComputedStyle(centre).transform);
    const point = matrix.transformPoint(new DOMPoint(0, 0, 0, 1));
    const box = centre.getBoundingClientRect();
    return {
      label: centre.getAttribute('aria-label') ?? '',
      shift: point.x / point.w,
      width: parseFloat(getComputedStyle(centre).width),
      x: box.left + box.width / 2,
      y: box.top + box.height / 2,
      live: stage.getAttribute('aria-live'),
    };
  });
}

/** „Articolul 3 din 12" → „Articolul 4 din 12": the next card's name, the
 *  ring wrapping after the last. */
function nextLabel(label: string): string {
  const found = /^(.*?)(\d+) din (\d+)$/.exec(label);
  if (found === null) throw new Error(`an unexpected card name: ${label}`);
  const [, prefix, index, total] = found;
  return `${prefix}${(Number(index) % Number(total)) + 1} din ${total}`;
}

/** EVERY CLICK the page hears from now on, counted on the window in its
 *  capture phase — nothing on the way can hide one from it. Returns the
 *  count's reader. */
async function countClicks(page: Page): Promise<() => Promise<number>> {
  await page.evaluate(() => {
    const counted = window as Window & { carouselClicks?: number };
    counted.carouselClicks = 0;
    window.addEventListener(
      'click',
      () => {
        counted.carouselClicks = (counted.carouselClicks ?? 0) + 1;
      },
      true,
    );
  });
  return () =>
    page.evaluate(
      () =>
        (window as Window & { carouselClicks?: number }).carouselClicks ?? 0,
    );
}

/** The carousel in the screen's middle, hydrated, its clock running. */
async function openCarousel(
  page: Page,
  path: string,
  region: RegExp,
): Promise<Locator> {
  await page.goto(path);
  const carousel = page.getByRole('region', { name: region }).first();
  await carousel.evaluate((section) =>
    section.scrollIntoView({ block: 'center', behavior: 'instant' }),
  );
  await expect
    .poll(async () => (await readCarousel(carousel)).live, {
      message: 'the island hydrated and its clock runs (the live region off)',
    })
    .toBe('off');
  return carousel;
}

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  locale: 'ro-RO',
});

test.beforeEach(({}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'laptop-1366x633',
    'this spec sets its own screen; one project is enough to run it',
  );
});

for (const place of PLACES) {
  test(`a finger drags ${place.name}: the cards follow it, and let go, the next card comes to the centre`, async ({
    page,
  }) => {
    const carousel = await openCarousel(page, place.path, place.region);
    const before = await readCarousel(carousel);
    expect(Math.abs(before.shift), 'the centre card at rest').toBeLessThan(0.5);
    const pitch = STEP * before.width;
    const travel = -0.6 * pitch;

    const clicks = await countClicks(page);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: before.x, y: before.y }],
    });
    const steps = 12;
    for (let step = 1; step <= steps; step += 1) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: before.x + (travel * step) / steps, y: before.y }],
      });
    }

    // UNDER THE FINGER: the centre card's drawn centre where the finger is —
    // read once React has drawn the last move (a pointermove's update is not
    // drawn in the same task) — and the ring held while the finger is down.
    await expect
      .poll(
        async () => Math.abs((await readCarousel(carousel)).shift - travel),
        { message: 'the centre card follows the finger', timeout: 2_000 },
      )
      .toBeLessThanOrEqual(2);
    const under = await readCarousel(carousel);
    expect(under.label, 'still the card the finger pressed').toBe(before.label);
    expect(under.live, 'the ring held under the finger').toBe('polite');

    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });

    // LET GO past half a step: the next card at the centre, at rest, and the
    // ring stopped for good — and no click left behind, so no link followed.
    await expect
      .poll(async () => (await readCarousel(carousel)).label)
      .toBe(nextLabel(before.label));
    await expect
      .poll(async () => Math.abs((await readCarousel(carousel)).shift), {
        message: 'the new centre card comes to rest',
      })
      .toBeLessThan(0.5);
    expect((await readCarousel(carousel)).live, 'stopped for good').toBe(
      'polite',
    );
    expect(await clicks(), 'a finger’s drag leaves no click behind').toBe(0);
    expect(new URL(page.url()).pathname).toBe(place.path);

    // THE COUNT HEARS A FINGER: a tap on the previous arrow leaves ONE click,
    // and the ring steps back to the card the drag began on.
    const arrow = await carousel
      .getByRole('button', { name: place.previous, exact: true })
      .boundingBox();
    if (arrow === null) throw new Error('no previous arrow on screen');
    const tap = { x: arrow.x + arrow.width / 2, y: arrow.y + arrow.height / 2 };
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [tap],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await expect
      .poll(clicks, { message: 'a finger’s tap leaves its click' })
      .toBe(1);
    await expect
      .poll(async () => (await readCarousel(carousel)).label)
      .toBe(before.label);
    expect(new URL(page.url()).pathname).toBe(place.path);
  });
}

test.describe('a real MOUSE', () => {
  test.use({
    viewport: { width: 1366, height: 633 },
    hasTouch: false,
    isMobile: false,
  });

  test('drags Home’s articles band over a card’s link: the cards follow it, the next card lands, and the click the release leaves behind is swallowed — never a tap, never the link', async ({
    page,
  }) => {
    const [home] = PLACES;
    const carousel = await openCarousel(page, home.path, home.region);
    const before = await readCarousel(carousel);
    // The premise: the drag begins over the centre card's LINK.
    const link = await carousel.evaluate(
      (_section, point) =>
        document
          .elementFromPoint(point.x, point.y)
          ?.closest('a')
          ?.getAttribute('href') ?? null,
      { x: before.x, y: before.y },
    );
    expect(link, 'a card’s link under the mouse').not.toBeNull();

    // Every click the page hears, kept whole: whether the hand's box holds its
    // target, and — read once it has been dispatched — whether anything
    // prevented it.
    await page.evaluate(() => {
      const heard = window as Window & { carouselClicks?: Event[] };
      heard.carouselClicks = [];
      window.addEventListener(
        'click',
        (event) => heard.carouselClicks?.push(event),
        true,
      );
    });
    const pitch = STEP * before.width;
    const travel = -0.6 * pitch;
    await page.mouse.move(before.x, before.y);
    await page.mouse.down();
    const steps = 12;
    for (let step = 1; step <= steps; step += 1) {
      await page.mouse.move(before.x + (travel * step) / steps, before.y);
    }
    await expect
      .poll(
        async () => Math.abs((await readCarousel(carousel)).shift - travel),
        { message: 'the centre card follows the mouse', timeout: 2_000 },
      )
      .toBeLessThanOrEqual(2);
    await page.mouse.up();

    // LET GO past half a step: the next card at the centre, at rest, the ring
    // stopped for good, and the page where it was.
    await expect
      .poll(async () => (await readCarousel(carousel)).label)
      .toBe(nextLabel(before.label));
    await expect
      .poll(async () => Math.abs((await readCarousel(carousel)).shift), {
        message: 'the new centre card comes to rest',
      })
      .toBeLessThan(0.5);
    expect((await readCarousel(carousel)).live, 'stopped for good').toBe(
      'polite',
    );
    expect(new URL(page.url()).pathname).toBe(home.path);

    // THE CLICK THE RELEASE LEFT BEHIND: one, inside the hand's box — and
    // PREVENTED, the swallow's work, which proves it came while the swallow
    // was still armed: in the release's own task.
    const clicks = await carousel.evaluate((section) => {
      const stage = section.querySelector('[aria-live]');
      const hand = stage?.parentElement ?? null;
      const heard =
        (window as Window & { carouselClicks?: Event[] }).carouselClicks ?? [];
      return heard.map((event) => ({
        inHand:
          hand !== null &&
          event.target instanceof Node &&
          hand.contains(event.target),
        prevented: event.defaultPrevented,
      }));
    });
    expect(clicks, 'the click a mouse’s drag leaves behind').toEqual([
      { inHand: true, prevented: true },
    ]);
  });
});
