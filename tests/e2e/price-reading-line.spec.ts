import { expect, type Page, test } from '@playwright/test';

// THE READING LINE ON THE REAL PAGE, against the built export (owner,
// 2026-09-29: "when you scroll, it turns on the shadow highlight too late,
// once it already passes the that point at which you see the top of the card
// because it already passes below the top bar and you see it had been
// selected, but it was already past. i need a new scrolling or selecting of
// current card that keeps the line lower for currently selected items and
// also selects top one, like idk, maybe somehting based on size of card i
// think would be neccesary to be implemented, so smaller cars at top also get
// selection, but not to get selected once they are below the top bar as it is
// too late then. and also the go to card when you click on the meniu on an
// option should be more to the center of the screen the go to selected card,
// to be more visible."). The price menu's scroll-spy measures against THE
// READING LINE (lib/scroll-spy's header of that name): the middle of the part
// of the window the page keeps clear under the header pill, `(scroll-padding-
// top + innerHeight) / 2`, bent near both ends of the page; and it writes
// every card's landing as its inline `scroll-margin-top`, so a click brings
// the card to that same line. This suite drives the page a visitor downloads
// and checks what the owner asked for, in the owner's terms:
//   · at load the FIRST card is current — on the desktop, where the second
//     card's top already sits above the middle of the window;
//   · scrolling from the top to the end, every card has its turn, in order;
//   · a card in the middle of the list lights as its top crosses the line;
//   · every one of the eleven links lands its card where the scroll rule
//     names it — centred when it fits, on the old 136px line when it is too
//     tall — and a pixel of the visitor's own scrolling leaves it current;
//   · a pasted link re-lands on the line, and a reload that restored another
//     position is left alone;
//   · on a phone, where the menu is stacked, the same holds;
//   · a long task right after a click cannot walk the mark through the cards
//     between (lib/scroll-spy's THE START GRACE).
//
// ── PROPERTIES, NEVER THE ARITHMETIC. Every expectation is read from the page
// or is the design's own statement of it — the line, a card fitting when it
// leaves the pill's strip and its 40px of air free above and below (height ≤
// innerHeight − 176), a card too tall resting on 136px. lib/reading-line's
// plan (the bend, the landings, the margins) is never recomputed here: its own
// suite proves it on these very measurements. The one place the design's
// arithmetic is consulted is to decide which landings the page's ENDS hold —
// see heldByAnEnd, which says why and how far.
//
// ── MOTION. The geometric loops teleport — `contextOptions: { reducedMotion:
// 'reduce' }`, the visual config's own spelling; the shell's `scroll-behavior:
// smooth` lives inside a no-preference query, so there a jump is one scroll
// event — and the tests about a glide keep motion ON, the e2e config's own
// default.
//
// Windows: the two e2e projects (playwright.e2e.config.ts), Romanian and
// German (§8.4 — the longest language), and a 390×844 phone. Nothing here is
// a screenshot.

const MENU = '#price-categories';
const CURRENT = 'data-current';

/** The 8.5rem line: the header pill's 6rem reach plus a card's 2.5rem floor
 *  (CategoryCard's `scroll-mt-10`) — where a card too tall to be centred
 *  rests, as every card rested before round 5. */
const CEILING = 136;

/** A card FITS the clear area when its height is at most `innerHeight −
 *  CLEAR`: the pill's 96px strip, plus the card's 40px of air above it and
 *  the same 40px mirrored at the bottom (lib/reading-line's A TARGET'S REST).
 *  One that fits is centred on the line; a taller one rests on CEILING. */
const CLEAR = 176;

/** The largest scroll step of the walks below. The shortest turn any card has
 *  on the measured page is 64px (the first card, at 1920×945 — the planner's
 *  simulation), so a 40px step can never step over one. */
const STEP = 40;

/** lib/reading-line's READING_END_PACE, the planner's decided value — spelled
 *  here and never imported, because this suite reads the design and not its
 *  code: near an end of the page, two neighbours' landings lie at least
 *  1/END_PACE of the distance between their tops apart. heldByAnEnd is its
 *  only reader. */
const END_PACE = 2;

/** lib/scroll-spy's DEFAULT_SETTLE_MS: the quiet time that ends a jump. A pin
 *  is judged within two of these windows (THE START GRACE). */
const SETTLE_MS = 150;

/** The long task THE START GRACE test puts right after a click: longer than
 *  the 160ms the planner measured as enough to starve the settle. */
const LONG_TASK_MS = 250;

/** How long an in-page wait may run before it gives up and lets the
 *  assertions that follow say what they found — a guard, never a clock. */
const GUARD_MS = 6_000;

/** Every card is fragment-addressed by the menu's links, in order. */
type Reading = Readonly<{
  y: number;
  maxY: number;
  innerHeight: number;
  /** THE READING LINE, as a viewport y, read from the page. */
  line: number;
  fragments: readonly string[];
  /** The id of every card that carries the mark. */
  marked: readonly string[];
  /** The fragment of every menu link carrying aria-current="location". */
  linked: readonly string[];
}>;

const read = (page: Page): Promise<Reading> =>
  page.evaluate(
    ({ selector, current }) => {
      const nav = document.querySelector(selector) as HTMLElement;
      const links = Array.from(
        nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
      );
      const padding =
        parseFloat(
          getComputedStyle(document.documentElement).scrollPaddingTop,
        ) || 0;
      return {
        y: window.scrollY,
        maxY: document.documentElement.scrollHeight - window.innerHeight,
        innerHeight: window.innerHeight,
        line: (padding + window.innerHeight) / 2,
        fragments: links.map((link) => link.hash.slice(1)),
        marked: Array.from(
          document.querySelectorAll(`section[${current}]`),
          (card) => card.id,
        ),
        linked: links
          .filter((link) => link.getAttribute('aria-current') === 'location')
          .map((link) => link.hash.slice(1)),
      };
    },
    { selector: MENU, current: CURRENT },
  );

/** Where a card is, in viewport pixels, plus its DOCUMENT top. */
type Box = Readonly<{
  top: number;
  bottom: number;
  height: number;
  documentTop: number;
}>;

const boxOf = (page: Page, id: string): Promise<Box> =>
  page.evaluate((id) => {
    const rect = (
      document.getElementById(id) as HTMLElement
    ).getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
      documentTop: rect.top + window.scrollY,
    };
  }, id);

/**
 * Wait until the page has RESTED: the scroll position unchanged over every
 * frame of three settle windows — longer than the two in which the spy
 * judges a pin, so a jump it finishes, or a pin it hands to the walk, has
 * happened by the time this returns — and every animation the rest started
 * has finished. A guard, not a clock the page is timed by: after GUARD_MS it
 * returns anyway, and the assertions that follow say what they find.
 */
const untilRested = (page: Page): Promise<void> =>
  page.evaluate(
    async ({ quietMs, guardMs }) => {
      const frame = (): Promise<void> =>
        new Promise((resolve) => requestAnimationFrame(() => resolve()));
      const until = performance.now() + guardMs;
      let last = window.scrollY;
      let since = performance.now();
      while (performance.now() < until) {
        await frame();
        if (window.scrollY !== last) {
          last = window.scrollY;
          since = performance.now();
        } else if (performance.now() - since >= quietMs) {
          break;
        }
      }
      await Promise.allSettled(
        document.getAnimations().map((animation) => animation.finished),
      );
    },
    { quietMs: 3 * SETTLE_MS, guardMs: GUARD_MS },
  );

/** Open a services page — a fragment and all, when `path` carries one — and
 *  wait until it has rested: the fonts in (every landing is measured on the
 *  final layout), the island hydrated (the mark is the proof: nothing else
 *  writes it) and the page still. */
async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForSelector(MENU);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector(`section[${CURRENT}]`, { state: 'attached' });
  await untilRested(page);
}

/** Wait until the card `id` carries the mark — the pin a click sets at once —
 *  and then until the page has rested. Fails naming the card it waited for. */
async function markedThenRested(page: Page, id: string): Promise<void> {
  await page
    .waitForSelector(`section#${id}[${CURRENT}]`, {
      state: 'attached',
      timeout: GUARD_MS,
    })
    .catch(() => {
      throw new Error(`#${id} never took the mark after its link was followed`);
    });
  await untilRested(page);
}

/** Scroll the PAGE to `to` in wheel-sized steps, two frames each —
 *  `behavior: 'instant'` because the shell's `scroll-behavior: smooth` would
 *  animate every step (the price-menu spec's stepScroll, the last step
 *  clamped onto `to`). */
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
          top:
            direction > 0
              ? Math.min(before + step, to)
              : Math.max(before - step, to),
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

/** The scroll offset at which the card `id`'s top edge reaches the reading
 *  line — where a card away from the page's ends becomes current. Rounded UP,
 *  so the top has reached the line rather than stopping a hair short. */
const crossingOf = (page: Page, id: string): Promise<number> =>
  page.evaluate((id) => {
    const padding =
      parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) ||
      0;
    const line = (padding + window.innerHeight) / 2;
    const card = document.getElementById(id) as HTMLElement;
    return Math.ceil(card.getBoundingClientRect().top + window.scrollY - line);
  }, id);

/** One stop of a walk down the page. */
type Sample = Readonly<{
  y: number;
  marked: readonly string[];
  linked: readonly string[];
  /** Every card's top edge, in the menu's order, in viewport pixels. */
  tops: readonly number[];
}>;

/**
 * Walk the page from the top to its very end in steps of STEP pixels, two
 * frames a step — the scroll event and whatever it set off — and record at
 * every stop which card carries the mark, which link, and where every card's
 * top is. The last stop is the page's end exactly.
 */
const walkDown = (page: Page): Promise<Sample[]> =>
  page.evaluate(
    async ({ selector, current, step }) => {
      const frame = (): Promise<void> =>
        new Promise((resolve) => requestAnimationFrame(() => resolve()));
      const links = Array.from(
        (
          document.querySelector(selector) as HTMLElement
        ).querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
      );
      const cards = links.map(
        (link) => document.getElementById(link.hash.slice(1)) as HTMLElement,
      );
      const end = document.documentElement.scrollHeight - window.innerHeight;
      const samples: Sample[] = [];
      for (let y = 0; ; y = Math.min(y + step, end)) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await frame();
        await frame();
        samples.push({
          y: window.scrollY,
          marked: cards
            .filter((card) => card.hasAttribute(current))
            .map((card) => card.id),
          linked: links
            .filter((link) => link.getAttribute('aria-current') === 'location')
            .map((link) => link.hash.slice(1)),
          tops: cards.map((card) => card.getBoundingClientRect().top),
        });
        if (y >= end) break;
      }
      return samples;
    },
    { selector: MENU, current: CURRENT, step: STEP },
  );

/**
 * HELD BY AN END OF THE PAGE — where a card's landing is not the page's to
 * choose. Near either end some landings cannot be the ideal one, and the
 * contract's (c) says to relax the centring there, decided from the PAGE:
 *   · the page rests at scroll 0 or at its maximum;
 *   · the card's ideal rest — centred on the line when it fits, its top on
 *     CEILING when it does not — would need a scroll position outside 0…max;
 *   · or, the one reading of the design this adds (reported to the planner):
 *     it would need a position closer to an end than 1/END_PACE of the
 *     distance between its top and the top of the card AT that end. That is
 *     lib/reading-line's THE STEP — near an end the landings are kept apart so
 *     that every card between keeps a turn — and it is what holds the second
 *     card at 1920×945: its centred landing (28px) lies inside the page, but
 *     the first card's turn needs (422 − 178) / 2 = 122px of scrolling before
 *     it, so it rests 94px above centre. Away from both ends this can never
 *     hold a card (the middle cards' ideal landings are further apart than
 *     the step), so the centring is still asserted exactly where the owner
 *     sees it.
 */
function heldByAnEnd(
  reading: Reading,
  card: Box,
  firstTop: number,
  lastTop: number,
): boolean {
  if (reading.y <= 0 || reading.y >= reading.maxY - 1) return true;
  const rest =
    card.height <= reading.innerHeight - CLEAR
      ? reading.line - card.height / 2
      : CEILING;
  const wants = card.documentTop - rest;
  if (wants < 0 || wants > reading.maxY) return true;
  if (wants < (card.documentTop - firstTop) / END_PACE) return true;
  return wants > reading.maxY - (lastTop - card.documentTop) / END_PACE;
}

for (const locale of ['ro', 'de']) {
  test.describe(`${locale}/services — the reading line`, () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });

    test('at load the FIRST card is current — even where the second card’s top already sits above the middle of the window', async ({
      page,
    }, testInfo) => {
      await open(page, `/${locale}/services/`);
      const reading = await read(page);

      expect(reading.y).toBe(0);
      expect(reading.marked).toEqual([reading.fragments[0]]);
      expect(reading.linked).toEqual([reading.fragments[0]]);

      // The owner's case ("so smaller cars at top also get selection"): on
      // the desktop the second card is already above the window's middle —
      // and so above the reading line — at scroll 0, the highest the page
      // goes. An unbent line would name it and the first card would never
      // have a turn; the line bends near the top, and the first card is lit.
      if (testInfo.project.name === 'desktop-1920x945') {
        const second = await boxOf(page, reading.fragments[1]);
        expect(second.top).toBeLessThan(reading.innerHeight / 2);
        expect(second.top).toBeLessThan(reading.line);
      }
    });

    test('every card has its turn, in order — from the top to the end in steps of at most 40px', async ({
      page,
    }) => {
      await open(page, `/${locale}/services/`);
      const { fragments, maxY } = await read(page);
      const samples = await walkDown(page);

      // At every stop ONE card carries the mark, and its link the other.
      const split = samples.find(
        (sample) =>
          sample.marked.length !== 1 ||
          sample.linked.length !== 1 ||
          sample.marked[0] !== sample.linked[0],
      );
      expect(
        split,
        `at scrollY ${split?.y}: marked ${split?.marked} · linked ${split?.linked}`,
      ).toBeUndefined();

      // The turns, in the order they came: exactly the menu's eleven — none
      // skipped, none revisited — and the walk really reached the end.
      const turns = samples
        .map((sample) => sample.marked[0])
        .filter((id, index, all) => index === 0 || id !== all[index - 1]);
      expect(turns).toEqual(fragments);
      expect(samples[samples.length - 1].y).toBeGreaterThanOrEqual(maxY - 1);
    });

    test('a card in the middle of the list lights as its top crosses the middle of the clear area', async ({
      page,
    }) => {
      await open(page, `/${locale}/services/`);
      const { fragments, line } = await read(page);
      const samples = await walkDown(page);

      // Cards 4 to 8 sit far from both ends at both windows, where the line
      // is plain. At the FIRST stop where a card is current its top has just
      // crossed the line — within one step of it, and the walk's pixel of
      // grace — and one stop earlier the card before it was current.
      for (let index = 4; index <= 8; index += 1) {
        const first = samples.findIndex(
          (sample) => sample.marked[0] === fragments[index],
        );
        expect.soft(first, `${fragments[index]} never lit`).toBeGreaterThan(0);
        if (first <= 0) continue;
        const top = samples[first].tops[index];
        expect
          .soft(top, `${fragments[index]}'s top when it lit (line ${line})`)
          .toBeLessThanOrEqual(line + 2);
        expect
          .soft(top, `${fragments[index]}'s top when it lit (line ${line})`)
          .toBeGreaterThan(line - (STEP + 2));
        expect
          .soft(
            samples[first - 1].marked,
            `the stop before ${fragments[index]} lit`,
          )
          .toEqual([fragments[index - 1]]);
      }
    });

    test('EVERY link lands its card where the scroll rule names it — centred when it fits, on the 136px line when it is too tall', async ({
      page,
    }) => {
      test.setTimeout(120_000);
      await open(page, `/${locale}/services/`);
      const { fragments } = await read(page);
      const firstTop = (await boxOf(page, fragments[0])).documentTop;
      const lastTop = (await boxOf(page, fragments[fragments.length - 1]))
        .documentTop;

      for (const [index, id] of fragments.entries()) {
        // Every jump from a freshly loaded page, at its top — judged alike.
        if (index > 0) await open(page, `/${locale}/services/`);
        const link = page.locator(`${MENU} a[href^="#"]`).nth(index);
        const onScreen = await link.evaluate(
          (element) =>
            element.getBoundingClientRect().top >= 0 &&
            element.getBoundingClientRect().bottom <= window.innerHeight,
        );
        if (onScreen) {
          // A real press and release, the owner's own click.
          const box = await link.boundingBox();
          if (box === null) throw new Error(`the link to #${id} has no box`);
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.up();
        } else {
          await link.click();
        }
        await markedThenRested(page, id);

        const reading = await read(page);
        const card = await boxOf(page, id);
        const at = `#${id} (scrollY ${reading.y} of ${reading.maxY}, top ${card.top}, height ${card.height})`;

        // (a) Both marks name the card the link pointed at.
        expect.soft(reading.marked, `${at}: the card's mark`).toEqual([id]);
        expect.soft(reading.linked, `${at}: the link's mark`).toEqual([id]);
        // (b) Never under the header pill.
        expect
          .soft(card.top, `${at}: below the pill`)
          .toBeGreaterThanOrEqual(CEILING - 1);
        // (c) Where it rests: centred when it fits, on the 136px line when it
        // is taller — except where an end of the page holds it
        // (heldByAnEnd), and then it is at least entirely on screen.
        const fits = card.height <= reading.innerHeight - CLEAR;
        if (heldByAnEnd(reading, card, firstTop, lastTop)) {
          if (fits) {
            expect.soft(card.top, `${at}: on screen`).toBeGreaterThanOrEqual(0);
            expect
              .soft(card.bottom, `${at}: on screen`)
              .toBeLessThanOrEqual(reading.innerHeight);
          }
        } else if (fits) {
          expect
            .soft(
              Math.abs((card.top + card.bottom) / 2 - reading.line),
              `${at}: its centre from the line ${reading.line}`,
            )
            .toBeLessThanOrEqual(3);
        } else {
          expect
            .soft(Math.abs(card.top - CEILING), `${at}: its top from 136`)
            .toBeLessThanOrEqual(2);
        }

        // (d) A pixel of the visitor's own scrolling drops the pin (a wheel —
        // lib/scroll-spy's THE VISITOR'S OWN INPUT) and hands the answer to
        // the walk: which must name the SAME card.
        await page.mouse.move(
          (page.viewportSize()?.width ?? 0) / 2,
          reading.innerHeight / 2,
        );
        await page.mouse.wheel(0, 1);
        await untilRested(page);
        const after = await read(page);
        expect.soft(after.marked, `${at}: after a 1px wheel`).toEqual([id]);
        expect.soft(after.linked, `${at}: after a 1px wheel`).toEqual([id]);
      }
    });
  });
}

for (const motion of ['no-preference', 'reduce'] as const) {
  test.describe(`ro/services — a pasted link re-lands (motion: ${motion})`, () => {
    test.use({ contextOptions: { reducedMotion: motion } });

    test('a card that fits is centred on the line, current, and the URL keeps its fragment', async ({
      page,
    }) => {
      // A link someone sent, WhatsApp-style. The BROWSER follows the `#id`
      // before any script runs — onto the stylesheet's 136px line, gliding
      // when motion is allowed — and the spy finishes the jump onto the
      // reading line once it has hydrated: at once when the page already
      // rests there (THE READING LINE's one scroll), at the pin's settle when
      // the island woke mid-glide.
      await open(page, '/ro/services/#prophylaxis');
      const reading = await read(page);
      const card = await boxOf(page, 'prophylaxis');

      // The premises: it fits, and neither end of the page holds it.
      expect(card.height).toBeLessThanOrEqual(reading.innerHeight - CLEAR);
      expect(reading.y).toBeGreaterThan(0);
      expect(reading.y).toBeLessThan(reading.maxY - 1);

      expect(
        Math.abs((card.top + card.bottom) / 2 - reading.line),
        `its centre (top ${card.top}, bottom ${card.bottom}) from the line ${reading.line}`,
      ).toBeLessThanOrEqual(3);
      expect(reading.marked).toEqual(['prophylaxis']);
      expect(reading.linked).toEqual(['prophylaxis']);
      expect(new URL(page.url()).hash).toBe('#prophylaxis');
    });

    test('a card too tall to be centred rests with its top on the 136px line', async ({
      page,
    }) => {
      await open(page, '/ro/services/#prosthetics');
      const reading = await read(page);
      const card = await boxOf(page, 'prosthetics');

      expect(card.height).toBeGreaterThan(reading.innerHeight - CLEAR);
      expect(
        Math.abs(card.top - CEILING),
        `its top ${card.top} from ${CEILING}`,
      ).toBeLessThanOrEqual(2);
      expect(reading.marked).toEqual(['prosthetics']);
      expect(reading.linked).toEqual(['prosthetics']);
      expect(new URL(page.url()).hash).toBe('#prosthetics');
    });
  });
}

test.describe('ro/services — a reload that restored another position', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('is left where the browser put it, and the marks name the card the walk names there', async ({
    page,
  }) => {
    await open(page, '/ro/services/#prophylaxis');
    const landed = await read(page);
    expect(landed.marked).toEqual(['prophylaxis']);

    // 600px of the visitor's own scrolling, then a reload: the browser
    // RESTORES that position instead of jumping to the fragment again, and
    // the spy must not drag the page back (lib/scroll-spy's THE READING
    // LINE: a page restored anywhere else is left alone).
    await page.mouse.move(
      (page.viewportSize()?.width ?? 0) / 2,
      landed.innerHeight / 2,
    );
    await page.mouse.wheel(0, 600);
    await untilRested(page);
    const scrolled = (await read(page)).y;
    expect(scrolled - landed.y).toBeGreaterThanOrEqual(500);

    await page.reload();
    await page.waitForSelector(MENU);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector(`section[${CURRENT}]`, { state: 'attached' });
    await untilRested(page);
    const restored = await read(page);

    expect(Math.abs(restored.y - scrolled)).toBeLessThanOrEqual(1);
    expect(new URL(page.url()).hash).toBe('#prophylaxis');

    // What the walk names at that position, asked of a page with NO pin: a
    // fresh copy of the services page, no fragment, scrolled there by hand.
    // (The walk is a pure function of the scroll position — lib/scroll-spy's
    // THE POSITION WALK — so the two must agree.)
    const walker = await page.context().newPage();
    try {
      await open(walker, '/ro/services/');
      await stepScroll(walker, restored.y);
      const walked = await read(walker);
      expect(walked.y).toBe(restored.y);

      // The premise: the walk names another card there than the fragment
      // does, so the agreement below is the pin handed to the walk and not
      // the pin standing still.
      expect(walked.marked).not.toEqual(['prophylaxis']);
      expect(restored.marked).toEqual(walked.marked);
      expect(restored.linked).toEqual(walked.linked);
    } finally {
      await walker.close();
    }
  });
});

test.describe('the phone — the menu stacked above the cards', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    contextOptions: { reducedMotion: 'reduce' },
  });

  for (const locale of ['ro', 'de']) {
    test(`${locale}: a tap on the third link centres the third card, and a scroll marks one card and only it`, async ({
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== 'laptop-1366x633',
        'the phone sets its own window; one project is enough to run it',
      );
      await open(page, `/${locale}/services/`);
      const { fragments } = await read(page);
      expect(
        await page
          .locator(MENU)
          .evaluate((nav) => getComputedStyle(nav).position),
      ).toBe('static');

      const box = await page
        .locator(`${MENU} a[href^="#"]`)
        .nth(2)
        .boundingBox();
      if (box === null) throw new Error('the third menu link has no box');
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await markedThenRested(page, fragments[2]);

      const reading = await read(page);
      const card = await boxOf(page, fragments[2]);
      // The premises: it fits, and neither end holds it.
      expect(card.height).toBeLessThanOrEqual(reading.innerHeight - CLEAR);
      expect(reading.y).toBeGreaterThan(0);
      expect(reading.y).toBeLessThan(reading.maxY - 1);
      expect(
        Math.abs((card.top + card.bottom) / 2 - reading.line),
        `its centre from the line ${reading.line}`,
      ).toBeLessThanOrEqual(3);
      expect(reading.marked).toEqual([fragments[2]]);
      expect(reading.linked).toEqual([fragments[2]]);

      // A scroll after the jump has rested drops the pin and hands the page
      // to the walk: with the seventh card's top ten pixels past the line, it
      // is the one card marked, and its link the one link.
      await stepScroll(page, (await crossingOf(page, fragments[6])) + 10);
      await untilRested(page);
      const scrolled = await read(page);
      expect(scrolled.marked).toEqual([fragments[6]]);
      expect(scrolled.linked).toEqual([fragments[6]]);
    });
  }
});

for (const locale of ['ro', 'de']) {
  test.describe(`${locale}/services — THE START GRACE, a busy main thread after the click`, () => {
    test.use({ contextOptions: { reducedMotion: 'no-preference' } });

    test('a long task right after the click cannot walk the mark through the cards between', async ({
      page,
    }) => {
      await open(page, `/${locale}/services/`);
      const { fragments } = await read(page);
      const target = fragments[5];

      // Installed before the click: a record of every card that TAKES the
      // mark, with the moment the target took it; a long task of
      // LONG_TASK_MS on the click; and the moment the glide's first scroll
      // event arrives.
      // WHERE THE LONG TASK SITS IS THE TEST. A listener on the LINK runs
      // before React's own — React listens at the document — so the long
      // task would come BEFORE the pin, and the settle it is meant to starve
      // would not exist yet (measured on the built page, 2026-09-29: the
      // target's mark landed only after such a task ended). On WINDOW it runs
      // after React's handler has pinned the target and armed the settle, and
      // before the browser's jump begins — the case THE START GRACE answers.
      // WHAT THIS ENGINE CAN SHOW, stated rather than discovered: on the last
      // build WITHOUT the grace, this very long task left the pin standing
      // in Chromium every time (32 of 32 runs, with and without a fourfold
      // CPU throttle, 2026-09-29) — Chromium delivers the glide's first
      // scroll event before the overdue timer runs. So here the test guards
      // the PROPERTY; the defect it replays was WebKit's (12 of 12), and
      // lib/scroll-spy's own suite proves the grace with a clock it owns.
      await page.evaluate(
        ({ selector, current, target, longTaskMs }) => {
          const nav = document.querySelector(selector) as HTMLElement;
          const band = nav.closest('section') as HTMLElement;
          const log = {
            lit: [] as string[],
            markAt: -1,
            taskStart: -1,
            taskEnd: -1,
            firstScrollAt: -1,
          };
          (window as unknown as { __grace: typeof log }).__grace = log;
          new MutationObserver((records) => {
            for (const record of records) {
              if (record.oldValue !== null) continue;
              const id = (record.target as HTMLElement).id;
              log.lit.push(id);
              if (id === target && log.markAt < 0) {
                log.markAt = performance.now();
              }
            }
          }).observe(band, {
            subtree: true,
            attributes: true,
            attributeFilter: [current],
            attributeOldValue: true,
          });
          window.addEventListener(
            'click',
            () => {
              log.taskStart = performance.now();
              while (performance.now() < log.taskStart + longTaskMs) {
                // A long task, on purpose.
              }
              log.taskEnd = performance.now();
            },
            { once: true },
          );
          window.addEventListener(
            'scroll',
            () => {
              if (log.taskEnd >= 0 && log.firstScrollAt < 0) {
                log.firstScrollAt = performance.now();
              }
            },
            { passive: true },
          );
        },
        {
          selector: MENU,
          current: CURRENT,
          target,
          longTaskMs: LONG_TASK_MS,
        },
      );

      const box = await page
        .locator(`${MENU} a[href^="#"]`)
        .nth(5)
        .boundingBox();
      if (box === null) throw new Error('the sixth menu link has no box');
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.up();
      await markedThenRested(page, target);

      const log = await page.evaluate(
        () =>
          (
            window as unknown as {
              __grace: {
                lit: string[];
                markAt: number;
                taskStart: number;
                taskEnd: number;
                firstScrollAt: number;
              };
            }
          ).__grace,
      );

      // The premises — this staged the starved case. The pin came first (the
      // target took the mark before the long task began), and the glide's
      // first scroll event came more than a settle window after the pin: by
      // the time the page first moved, the settle had already been due.
      expect(log.markAt, 'the target took the mark').toBeGreaterThanOrEqual(0);
      expect(log.taskStart).toBeGreaterThanOrEqual(log.markAt);
      expect(log.firstScrollAt, 'the glide scrolled').toBeGreaterThanOrEqual(0);
      expect(log.firstScrollAt - log.markAt).toBeGreaterThan(SETTLE_MS);

      // The claim: the mark went to the target and nowhere else — no card
      // between the start and the target ever took it, and neither did the
      // start card again.
      expect(
        log.lit,
        `the cards that took the mark: ${log.lit.join(' → ')}`,
      ).toEqual([target]);
      const reading = await read(page);
      expect(reading.marked).toEqual([target]);
      expect(reading.linked).toEqual([target]);
    });
  });
}
