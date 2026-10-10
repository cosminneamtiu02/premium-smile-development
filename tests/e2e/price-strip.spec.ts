import {
  type Browser,
  type BrowserContext,
  expect,
  type Page,
  test,
} from '@playwright/test';

// THE PRICE STRIP, against the built export (owner, 2026-10-09, verbatim: "i
// need a complete refactor on the price page on the menu that takes you to
// price lists on phone and on tablet. on latpops it should remain the same …
// a horizontal list of buttons which you can scroll from left to right … the
// menu should strethc on whole width of phone screen. on click of menu item it
// should take you to desired section and as you scroll it should iterate
// throug sections … so the list should move with respect to current so it
// does not go off screen" · "the pills menu shoulld be sticky below the top
// bar navigation as you scroll downwards … and have gradient transition from
// background coloer to above cards" · asked which screens: "Every touch
// screen"; and on 2026-10-10, on his iPhone, reversing the gradient: "i see you
// have placed some block behind the top bar and the buttons menu that is the
// color of the baclkfground, remove it. i do not want it to transition into
// some kid of fog anymore and by fog to hide what is beneath. also, there is a
// scroll bar, a horizontal one on that scrollable menu. remove it").
// sections/PriceList/PriceMenu shows the RAIL — the side menu, as it
// was — where a fine pointer meets a WINDOW of 60rem (a media query since the
// G2 round), and the STRIP of chips everywhere else: every touch screen at any
// width and either orientation, every window under the step. lib/strip-follow
// keeps the current chip centred; the STYLESHEET sets the root's
// `scroll-padding-top` — the chips' bottom edge — where the strip is shown and
// sticks (PriceMenu.tsx's THE STRIP'S CLEARANCE, CSS since the G2 round; the
// island no longer writes the root), so every jump clears it, from the first
// paint and without JavaScript.
//
// Pinned, at four screens in Romanian and German: a phone and a tablet with a
// FINE pointer (the strip under the step), and a TOUCH tablet held both ways
// (`hasTouch` + `isMobile`, its coarse pointer confirmed — 1180px wide and
// still the strip): the strip shown and the rail not, full bleed, the first
// chip on the column's edge, its scrollbar hidden; stuck under the header
// pill — its box from the pill's 98px bottom edge to 32px under the chips,
// the chips at 110px — painting NOTHING of its own, no ground and no fade, the
// cards scrolling under it, and nothing of it above that box; the root's
// padding the chips' bottom; the current chip the spy's, walked in order
// through every category, centred (or
// clamped at an end) after each change settles; a tap on a far chip — the
// page's glide completes, the card lands clear of the strip, the chip is
// current at once and ends centred; a hand held on the strip — no
// programmatic move while it is down; a swipe with no new current — the strip
// stays where the hand left it, never sliding back; reduced motion — a jump;
// a keyboard focus on the stuck strip — the page never moves, and while the
// focus is in the strip the page may scroll by keys under it but the focused
// chip never slides away, the change it missed followed once focus leaves; a
// deep link — the browser lands the card first, the strip not scrolled by
// script before the document has loaded and then placed in one jump (since
// 2026-10-10; "placed before the paint" until then, which in Chromium cost
// the deep link its jump); a resize — the pinned chip re-centred at once, no
// glide; and the trailing gutter a real box — at the strip's end the last chip
// on the column's right edge, in Chromium AND WebKit (the tests that launch
// both engines themselves, with the keyboard walk). THE G2 ROUND (2026-10-09)
// adds: a DEEP-LINK SWEEP — every category, RO + DE, 390×844 fine and touch
// and 820×1180 touch, loaded fresh — each card resting where the spy's plan
// lands it, never under the chips, with the chip, the card's mark and the
// centred pill all the linked category (the stylesheet's clearance, in place
// before hydration), and the same with JavaScript OFF; SHORT WINDOWS (844×390
// touch, 640×400 fine) where the strip scrolls away, the root keeps 96px and
// a tapped card lands below the pill; a sideways SWIPE on the strip mid-glide
// that never moves the mark off the tapped category; and FORCED COLOURS, the
// current chip in the system's selection pair. And at three laptop windows
// with a fine pointer: the rail exactly as before, no strip, no root write.
// 2026-10-10 adds A SLOW LOAD — the webfont held back 300ms and 1200ms by
// `page.route`, both motion preferences, a mouse and a touch, and WebKit once
// over — where every deep link must still land where the plan lands it: the
// deep-link sweep's flake, root-caused (lib/strip-follow's THE BROWSER'S
// FRAGMENT JUMP GOES FIRST, lib/scroll-spy's stale load-time jump). And a
// rotation: the spy keeps its pin across the page the browser moves for it
// (lib/scroll-spy's THE RESIZE KEEPS THE PIN). Nothing here is a screenshot.

const MENU = '#price-categories';
const STRIP = '#price-categories-strip';
const CURRENT = 'data-current';

/** The strip's numbers at the default 16px root (PriceMenu.tsx's THE STRIP
 *  FLOATS UNDER THE BAR): the header pill's flow box, 6rem + 2px — where the
 *  stuck <nav> begins — the 0.75rem of air between the pill and the chips, the
 *  chip's 2.75rem floor and the 2rem of glow room under the chips. */
const FLOW_BOX = 98;
const AIR = 12;
const CHIP = 44;
const GLOW_ROOM = 32;
/** The chips' top edge when stuck. */
const CHIPS_TOP = FLOW_BOX + AIR;
/** The chips' bottom edge when stuck: the root's padding. */
const CLEARANCE = CHIPS_TOP + CHIP;
/** A card's stylesheet floor (CategoryCard's `scroll-mt-[2.5rem]`). */
const FLOOR = 40;

/** How long an in-page wait may run before it gives up — a guard, never a
 *  clock the page is timed by. */
const GUARD_MS = 6_000;

type Device = Readonly<{
  name: string;
  viewport: { width: number; height: number };
  touch: boolean;
}>;

const DEVICES: readonly Device[] = [
  {
    name: 'phone 390×844',
    viewport: { width: 390, height: 844 },
    touch: false,
  },
  {
    name: 'tablet 768×1024',
    viewport: { width: 768, height: 1024 },
    touch: false,
  },
  {
    name: 'touch tablet 820×1180',
    viewport: { width: 820, height: 1180 },
    touch: true,
  },
  {
    name: 'touch tablet 1180×820',
    viewport: { width: 1180, height: 820 },
    touch: true,
  },
];

/** Wait until the PAGE and the STRIP have both rested — neither has moved for
 *  a fade's length (the follower's glide is the chips' 400ms clock) — and
 *  every animation has finished. A guard, not a clock. */
const untilRested = (page: Page): Promise<void> =>
  page.evaluate(
    async ({ strip, guardMs }) => {
      const box = document.querySelector(strip) as HTMLElement;
      const frame = (): Promise<void> =>
        new Promise((resolve) => requestAnimationFrame(() => resolve()));
      const until = performance.now() + guardMs;
      let last = `${window.scrollY}:${box.scrollLeft}`;
      let since = performance.now();
      while (performance.now() < until) {
        await frame();
        const now = `${window.scrollY}:${box.scrollLeft}`;
        if (now !== last) {
          last = now;
          since = performance.now();
        } else if (performance.now() - since >= 450) {
          break;
        }
      }
      await Promise.allSettled(
        document.getAnimations().map((animation) => animation.finished),
      );
    },
    { strip: STRIP, guardMs: GUARD_MS },
  );

/** Open a services page and wait until it has rested — fonts in, the island
 *  hydrated (the first card's mark is its proof), page and strip still. */
async function open(page: Page, locale: string): Promise<void> {
  await page.goto(`/${locale}/services/`);
  await page.waitForSelector(MENU);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector(`section[${CURRENT}]`, { state: 'attached' });
  await untilRested(page);
}

/** Scroll the PAGE to `to` in wheel-sized steps, two frames each, the last
 *  step clamped onto `to` (`behavior: 'instant'`: the shell's smooth
 *  scrolling would animate every step — the price-menu spec's stepScroll). */
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

type StripState = Readonly<{
  /** The id of every card that carries the mark — the spy's answer. */
  marked: readonly string[];
  /** The fragment of every SHOWN chip carrying aria-current="location". */
  current: readonly string[];
  /** Every chip's fragment, in order. */
  fragments: readonly string[];
  /** The current chip's box and the strip's visible box, viewport x. */
  chip: { left: number; right: number } | null;
  box: { left: number; right: number };
  scrollLeft: number;
  scrollMax: number;
}>;

const readState = (page: Page): Promise<StripState> =>
  page.evaluate(
    ({ strip, current }) => {
      const box = document.querySelector(strip) as HTMLElement;
      const chips = Array.from(box.querySelectorAll<HTMLAnchorElement>('a'));
      const marked = Array.from(
        document.querySelectorAll(`section[${current}]`),
        (card) => card.id,
      );
      const on = chips.filter(
        (chip) => chip.getAttribute('aria-current') === 'location',
      );
      const rect = on[0]?.getBoundingClientRect();
      const stripRect = box.getBoundingClientRect();
      return {
        marked,
        current: on.map((chip) => chip.hash.slice(1)),
        fragments: chips.map((chip) => chip.hash.slice(1)),
        chip: rect ? { left: rect.left, right: rect.right } : null,
        box: {
          left: stripRect.left + box.clientLeft,
          right: stripRect.left + box.clientLeft + box.clientWidth,
        },
        scrollLeft: box.scrollLeft,
        scrollMax: box.scrollWidth - box.clientWidth,
      };
    },
    { strip: STRIP, current: CURRENT },
  );

/** THE RULE (lib/strip-follow): the current chip wholly inside the strip's
 *  visible box, and centred in it — unless the strip is clamped at an end. */
function expectFollowed(state: StripState, at: string): void {
  expect(state.chip, `${at}: a current chip`).not.toBeNull();
  if (state.chip === null) return;
  expect(state.chip.left, `${at}: inside, left`).toBeGreaterThanOrEqual(
    state.box.left - 1,
  );
  expect(state.chip.right, `${at}: inside, right`).toBeLessThanOrEqual(
    state.box.right + 1,
  );
  const clamped =
    state.scrollLeft <= 1 || state.scrollLeft >= state.scrollMax - 1;
  if (!clamped) {
    const centre = (state.chip.left + state.chip.right) / 2;
    const middle = (state.box.left + state.box.right) / 2;
    expect(Math.abs(centre - middle), `${at}: centred`).toBeLessThanOrEqual(2);
  }
}

/** The scroll offset at which card `id`'s top reaches the READING LINE — the
 *  middle of the clear area, (scroll-padding-top + innerHeight) / 2, both
 *  read from the page (the reading-line spec's crossingOf). */
const crossingOf = (page: Page, id: string): Promise<number> =>
  page.evaluate((id) => {
    const padding =
      parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) ||
      0;
    const line = (padding + window.innerHeight) / 2;
    const card = document.getElementById(id) as HTMLElement;
    return Math.ceil(card.getBoundingClientRect().top + window.scrollY - line);
  }, id);

for (const device of DEVICES) {
  for (const locale of ['ro', 'de'] as const) {
    test.describe(`${locale}/services on a ${device.name} — the strip`, () => {
      test.use({
        viewport: device.viewport,
        hasTouch: device.touch,
        isMobile: device.touch,
      });

      test.beforeEach(async ({ page }, testInfo) => {
        test.skip(
          testInfo.project.name !== 'laptop-1366x633',
          'this block sets its own screen; one project is enough to run it',
        );
        await open(page, locale);
      });

      test('shows the strip and not the rail — full bleed, its first chip on the column’s edge', async ({
        page,
      }) => {
        const layout = await page.evaluate(
          ({ menu, strip }) => {
            const nav = document.querySelector(menu) as HTMLElement;
            const box = document.querySelector(strip) as HTMLElement;
            const title = nav.querySelector('h2') as HTMLElement;
            const column = (
              nav.closest('section')?.firstElementChild as HTMLElement
            ).getBoundingClientRect();
            const first = (
              box.querySelector('a') as HTMLElement
            ).getBoundingClientRect();
            const stripRect = box.getBoundingClientRect();
            const scrollLeft = box.scrollLeft;
            const firstLeft = first.left;
            // THE TRAILING GUTTER IS A REAL BOX: at the strip's END the last
            // chip stands on the content column's right edge.
            box.scrollLeft = box.scrollWidth;
            const chips = box.querySelectorAll('a');
            const lastRight =
              chips[chips.length - 1].getBoundingClientRect().right;
            box.scrollLeft = scrollLeft;
            return {
              coarse: matchMedia('(pointer: coarse)').matches,
              stripShown: box.getClientRects().length > 0,
              railShown: title.getClientRects().length > 0,
              navName: nav.getAttribute('aria-labelledby'),
              innerWidth: window.innerWidth,
              stripWidth: stripRect.width,
              stripLeft: stripRect.left,
              scrollLeft,
              firstLeft,
              columnLeft: column.left,
              columnRight: column.right,
              lastRight,
              scrollbarWidth: getComputedStyle(box).scrollbarWidth,
              scrollbarColor: getComputedStyle(box).scrollbarColor,
              scrollbarHeight: box.offsetHeight - box.clientHeight,
              webkitScrollbar: getComputedStyle(box, '::-webkit-scrollbar')
                .display,
              overflows: box.scrollWidth > box.clientWidth,
              sideways:
                document.documentElement.scrollWidth -
                document.documentElement.clientWidth,
            };
          },
          { menu: MENU, strip: STRIP },
        );

        // The touch tablets are what they claim: a coarse primary pointer.
        expect(layout.coarse).toBe(device.touch);
        expect(layout.stripShown).toBe(true);
        expect(layout.railShown).toBe(false);
        // The landmark keeps its name: its role and name, read like a reader.
        await expect(
          page.getByRole('navigation', {
            name: locale === 'ro' ? 'Categorii' : 'Kategorien',
          }),
        ).toHaveCount(1);
        // Full bleed: the strip is the window's width (a classic scrollbar's
        // overshoot is the band's to clip), never a sideways page.
        expect(
          Math.abs(layout.stripWidth - layout.innerWidth),
        ).toBeLessThanOrEqual(1);
        expect(layout.sideways).toBeLessThanOrEqual(0);
        // At rest, scrollLeft 0, the first chip on the content column's edge…
        expect(layout.scrollLeft).toBe(0);
        expect(
          Math.abs(layout.firstLeft - layout.columnLeft),
        ).toBeLessThanOrEqual(0.5);
        // …and at the strip's end the last chip on its right edge.
        expect(
          Math.abs(layout.lastRight - layout.columnRight),
        ).toBeLessThanOrEqual(0.5);
        // THE SCROLLBAR IS HIDDEN (PriceMenu.tsx's THE ROW, owner
        // 2026-10-10: "there is a scroll bar, a horizontal one on that
        // scrollable menu. remove it"), for every pointer: `none`, and no
        // colour left for a thumb nobody sees — on a row that does overflow,
        // whose scrollport then takes no height for a bar. (That last reading
        // can only bite under CLASSIC scrollbars: under overlay ones a bar
        // takes no height anyway.)
        expect(layout.overflows).toBe(true);
        expect(layout.scrollbarWidth).toBe('none');
        expect(layout.scrollbarColor).toBe('auto');
        expect(layout.scrollbarHeight).toBe(0);
        // …and the `::-webkit-scrollbar` fallback for the engines before the
        // standard property, read off the pseudo-element itself.
        expect(layout.webkitScrollbar).toBe('none');
      });

      test('sticks under the header pill — its box from the pill’s 98px bottom edge, the chips at 110–154px, 32px of glow room under them — painting NOTHING of its own, the cards scrolling under it, nothing of it behind the bar, and the root’s padding the chips’ bottom', async ({
        page,
      }) => {
        // PriceMenu.tsx's THE STRIP FLOATS UNDER THE BAR (owner 2026-10-10:
        // "i see you have placed some block behind the top bar … remove it. i
        // do not want it to transition into some kid of fog anymore"). Down
        // past the strip's own place, deep into the cards.
        const second = (await readState(page)).fragments[2];
        await stepScroll(page, (await crossingOf(page, second)) + 10);
        await untilRested(page);

        const stuck = await page.evaluate(
          ({ menu, strip }) => {
            const nav = document.querySelector(menu) as HTMLElement;
            const box = document.querySelector(strip) as HTMLElement;
            const chips = Array.from(
              box.querySelectorAll<HTMLAnchorElement>('a'),
            );
            const chip = chips[0].getBoundingClientRect();
            const header = (
              document.querySelector('body > header') ??
              document.querySelector('header')
            )?.getBoundingClientRect();
            const navRect = nav.getBoundingClientRect();
            const stripRect = box.getBoundingClientRect();
            const paintOf = (element: Element) => {
              const style = getComputedStyle(element);
              return {
                image: style.backgroundImage,
                colour: style.backgroundColor,
              };
            };
            const inStrip = (x: number, y: number): boolean => {
              const hit = document.elementFromPoint(x, y);
              return hit !== null && box.contains(hit);
            };
            // The category cards — every chip's fragment target — that lie
            // under the strip's box: the content the visitor now sees
            // through it.
            const under = chips
              .map((link) => document.getElementById(link.hash.slice(1)))
              .filter((card): card is HTMLElement => card !== null)
              .filter((card) => {
                const rect = card.getBoundingClientRect();
                return (
                  rect.top < stripRect.bottom && rect.bottom > stripRect.top
                );
              })
              .map((card) => card.id);
            const middle = window.innerWidth / 2;
            return {
              navTop: navRect.top,
              navBottom: navRect.bottom,
              stripTop: stripRect.top,
              stripBottom: stripRect.bottom,
              chipTop: chip.top,
              chipBottom: chip.bottom,
              headerBottom: header?.bottom ?? Number.NaN,
              paint: { nav: paintOf(nav), strip: paintOf(box) },
              under,
              // ABOVE its box, at the gutter's edge — the window's top, the
              // pill's height, 2px over the box — where its ground used to
              // reach: never the strip now…
              above: [
                [4, 8],
                [4, 60],
                [4, navRect.top - 2],
              ].map(([x, y]) => inStrip(x, y)),
              // …and INSIDE it, at the column's middle, the 12px of air above
              // the chips and the glow room under them: the strip, whose
              // transparent box stays pointer-active.
              air: inStrip(middle, chip.top - 6),
              glowRoom: inStrip(middle, chip.bottom + 12),
              rootPadding: getComputedStyle(document.documentElement)
                .scrollPaddingTop,
            };
          },
          { menu: MENU, strip: STRIP },
        );

        // The <nav>'s box — and the strip's — begins at the header pill's
        // bottom edge, the pill's flow box: nothing of the strip behind the
        // bar.
        expect(stuck.navTop).toBeCloseTo(FLOW_BOX, 0);
        expect(stuck.stripTop).toBeCloseTo(FLOW_BOX, 0);
        expect(Math.abs(stuck.navTop - stuck.headerBottom)).toBeLessThanOrEqual(
          0.5,
        );
        // The chips 0.75rem under it, where they always stood…
        expect(stuck.chipTop).toBeCloseTo(CHIPS_TOP, 0);
        expect(stuck.chipBottom).toBeCloseTo(CLEARANCE, 0);
        // …and the box ends 2rem under them, the glow room.
        expect(stuck.stripBottom).toBeCloseTo(CLEARANCE + GLOW_ROOM, 0);
        expect(stuck.navBottom).toBeCloseTo(CLEARANCE + GLOW_ROOM, 0);
        // NO GROUND, NO FADE: neither box paints anything…
        expect(stuck.paint).toEqual({
          nav: { image: 'none', colour: 'rgba(0, 0, 0, 0)' },
          strip: { image: 'none', colour: 'rgba(0, 0, 0, 0)' },
        });
        // …and a card lies under the stuck strip, seen through it.
        expect(stuck.under.length).toBeGreaterThan(0);
        // Nothing of it above its box; its own box pointer-active.
        expect(stuck.above).toEqual([false, false, false]);
        expect(stuck.air).toBe(true);
        expect(stuck.glowRoom).toBe(true);
        // THE STRIP'S CLEARANCE: the root's padding is the chips' bottom edge.
        expect(stuck.rootPadding).toBe(`${CLEARANCE}px`);
      });

      test('scrolling down through every category walks the current chip in order — the spy’s own answer — centred (or clamped) after each change settles', async ({
        page,
      }) => {
        test.setTimeout(120_000);
        const { fragments } = await readState(page);
        const end = await page.evaluate(
          () => document.documentElement.scrollHeight - window.innerHeight,
        );
        const turns: string[] = [];
        for (let y = 0; ; y = Math.min(y + 40, end)) {
          await page.evaluate(async (y) => {
            window.scrollTo({ top: y, behavior: 'instant' });
            await new Promise((resolve) => requestAnimationFrame(resolve));
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }, y);
          const state = await readState(page);
          // One store, two marks: the current chip IS the marked card.
          expect(state.current, `at ${y}`).toEqual(state.marked);
          if (state.marked[0] !== turns[turns.length - 1]) {
            turns.push(state.marked[0]);
            await untilRested(page);
            expectFollowed(await readState(page), `${state.marked[0]} at ${y}`);
          }
          if (y >= end) break;
        }
        expect(turns).toEqual(fragments);
      });

      test('a tap on a far chip: the chip is current at once, the page’s glide completes, the card lands clear of the strip, and the chip ends centred', async ({
        page,
      }) => {
        const { fragments } = await readState(page);
        const index = fragments.length - 2;
        const id = fragments[index];
        // Bring the far chip into view inside the strip (the visitor's swipe),
        // then let the strip rest.
        await page.evaluate(
          ({ strip, index }) => {
            const box = document.querySelector(strip) as HTMLElement;
            const chip = box.querySelectorAll('a')[index] as HTMLElement;
            const at = chip.getBoundingClientRect();
            const rect = box.getBoundingClientRect();
            box.scrollLeft +=
              at.left +
              at.width / 2 -
              (rect.left + box.clientLeft + box.clientWidth / 2);
          },
          { strip: STRIP, index },
        );
        await untilRested(page);
        const chip = page.locator(`${STRIP} a`).nth(index);
        const box = await chip.boundingBox();
        if (box === null) throw new Error(`the chip for #${id} has no box`);
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        if (device.touch) await page.touchscreen.tap(x, y);
        else await page.mouse.click(x, y);

        // Current AT ONCE — the pin — on the chip and on its card.
        await expect(chip).toHaveAttribute('aria-current', 'location');
        await expect(page.locator(`section#${id}`)).toHaveAttribute(
          CURRENT,
          '',
        );

        await untilRested(page);
        const landed = await page.evaluate(
          ({ id }) => {
            const card = (
              document.getElementById(id) as HTMLElement
            ).getBoundingClientRect();
            const padding = parseFloat(
              getComputedStyle(document.documentElement).scrollPaddingTop,
            );
            return {
              y: window.scrollY,
              maxY: document.documentElement.scrollHeight - window.innerHeight,
              top: card.top,
              bottom: card.bottom,
              height: card.height,
              innerHeight: window.innerHeight,
              padding,
              hash: window.location.hash,
            };
          },
          { id },
        );
        expect(landed.hash).toBe(`#${id}`);
        expect(landed.padding).toBe(CLEARANCE);
        // THE GLIDE COMPLETED: the page went where the reading line plans it —
        // never stopped short. A card too tall for the clear area rests 2.5rem
        // under the chips; one that fits, centred on the line; near the page's
        // end the plan bends, and the card is then at least clear of the strip.
        expect(landed.top).toBeGreaterThanOrEqual(CLEARANCE + FLOOR - 2);
        const fits =
          landed.height <= landed.innerHeight - CLEARANCE - 2 * FLOOR;
        const heldByTheEnd = landed.y >= landed.maxY - 1;
        if (!heldByTheEnd) {
          if (fits) {
            const line = (CLEARANCE + landed.innerHeight) / 2;
            expect(
              Math.abs((landed.top + landed.bottom) / 2 - line),
            ).toBeLessThanOrEqual(3);
          } else {
            expect(
              Math.abs(landed.top - (CLEARANCE + FLOOR)),
            ).toBeLessThanOrEqual(2);
          }
        }
        const state = await readState(page);
        expect(state.current).toEqual([id]);
        expect(state.marked).toEqual([id]);
        expectFollowed(state, `#${id} after the tap`);
      });

      test('a hand held on the strip: the strip never moves under it — and the change it missed is followed once it lets go', async ({
        page,
      }) => {
        const { fragments } = await readState(page);
        // Press INSIDE the strip's box but on no chip — in the 0.75rem of air
        // above the chips, its top padding (PriceMenu.tsx's THE STRIP FLOATS
        // UNDER THE BAR: the box paints nothing, and stays pointer-active) —
        // so the release is no click on a link.
        const point = await page.evaluate((strip) => {
          const box = document.querySelector(strip) as HTMLElement;
          const chip = (
            box.querySelector('a') as HTMLElement
          ).getBoundingClientRect();
          return { x: window.innerWidth / 2, y: chip.top - 6 };
        }, STRIP);
        expect(
          await page.evaluate(
            ({ strip, x, y }) => {
              const hit = document.elementFromPoint(x, y);
              return (
                hit !== null &&
                (document.querySelector(strip) as HTMLElement).contains(hit) &&
                hit.closest('a') === null
              );
            },
            { strip: STRIP, ...point },
          ),
          'the hand lands on the strip, on no chip',
        ).toBe(true);
        const cdp = device.touch
          ? await page.context().newCDPSession(page)
          : null;
        if (cdp !== null) {
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ x: point.x, y: point.y }],
          });
        } else {
          await page.mouse.move(point.x, point.y);
          await page.mouse.down();
        }

        // While the hand is down, the page moves to a far category — by
        // script, as a glide would — and the current item changes.
        const target = fragments[fragments.length - 3];
        const samples = await page.evaluate(
          async ({ strip, top }) => {
            const box = document.querySelector(strip) as HTMLElement;
            const frame = (): Promise<void> =>
              new Promise((resolve) => requestAnimationFrame(() => resolve()));
            const before = box.scrollLeft;
            window.scrollTo({ top, behavior: 'instant' });
            const seen: number[] = [];
            for (let i = 0; i < 40; i += 1) {
              await frame();
              seen.push(box.scrollLeft);
            }
            return { before, seen };
          },
          { strip: STRIP, top: (await crossingOf(page, target)) + 10 },
        );
        const held = await readState(page);
        expect(held.current).toEqual([target]);
        // Not one programmatic move while the hand was down.
        expect(new Set(samples.seen)).toEqual(new Set([samples.before]));

        if (cdp !== null) {
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: [],
          });
        } else {
          await page.mouse.up();
        }
        await untilRested(page);
        expectFollowed(await readState(page), `#${target} after the release`);
      });

      test('reduced motion: the strip JUMPS to the new current chip — no glide', async ({
        page,
      }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const { fragments } = await readState(page);
        const target = fragments[fragments.length - 3];
        const top = (await crossingOf(page, target)) + 10;
        const run = await page.evaluate(
          async ({ strip, top }) => {
            const box = document.querySelector(strip) as HTMLElement;
            const frame = (): Promise<void> =>
              new Promise((resolve) => requestAnimationFrame(() => resolve()));
            const before = box.scrollLeft;
            window.scrollTo({ top, behavior: 'instant' });
            const seen: number[] = [];
            for (let i = 0; i < 30; i += 1) {
              await frame();
              seen.push(box.scrollLeft);
            }
            return { before, seen };
          },
          { strip: STRIP, top },
        );
        const moved = run.seen.filter((left) => left !== run.before);
        // It moved, and every frame after the change shows the same place: one
        // step, no values in between.
        expect(moved.length).toBeGreaterThan(0);
        expect(new Set(moved).size).toBe(1);
        const state = await readState(page);
        expect(state.current).toEqual([target]);
        expectFollowed(state, `#${target} under reduced motion`);
      });

      test('a keyboard focus on the STUCK strip never moves the page — the chips’ focus margin', async ({
        page,
      }) => {
        // PriceMenu.tsx's THE CHIPS' FOCUS MARGIN: without it, the root's
        // padding over the stuck strip made every focus of a chip scroll the
        // page up by a chip's height.
        const { fragments } = await readState(page);
        await stepScroll(page, (await crossingOf(page, fragments[3])) + 10);
        await untilRested(page);
        const before = await page.evaluate(() => window.scrollY);
        await page.locator(`${STRIP} a`).first().focus();
        await untilRested(page);
        expect(await page.evaluate(() => window.scrollY)).toBe(before);
        await page.keyboard.press('Tab');
        await untilRested(page);
        expect(await page.evaluate(() => window.scrollY)).toBe(before);
        // …and the strip is still stuck where it was.
        const chipTop = await page
          .locator(`${STRIP} a`)
          .first()
          .evaluate((chip) => chip.getBoundingClientRect().top);
        expect(chipTop).toBeCloseTo(CHIPS_TOP, 0);
      });

      test('a keyboard focus IN the strip: the page scrolls by keys beneath it, the focused chip never slides away — and the change it missed is followed once focus leaves', async ({
        page,
      }) => {
        // lib/strip-follow's THE KEYBOARD (the planner, 2026-10-09).
        const { fragments } = await readState(page);
        await stepScroll(page, (await crossingOf(page, fragments[2])) + 150);
        await untilRested(page);
        // Tab in from the <nav> (tabIndex -1, no tab stop of its own) to the
        // current chip — a focus the KEYBOARD made.
        const at = (await readState(page)).current[0];
        await page.locator(MENU).evaluate((nav) => {
          (nav as HTMLElement).focus({ preventScroll: true });
        });
        for (let i = 0; i <= fragments.indexOf(at); i += 1) {
          await page.keyboard.press('Tab');
        }
        await untilRested(page);
        const focus = () =>
          page.evaluate((strip) => {
            const box = document.querySelector(strip) as HTMLElement;
            const active = document.activeElement as HTMLAnchorElement;
            return {
              inStrip: box.contains(active),
              hash: active.hash,
              keyboard: active.matches(':focus-visible'),
              left: active.getBoundingClientRect().left,
              scrollLeft: box.scrollLeft,
            };
          }, STRIP);
        const held = await focus();
        expect(held).toMatchObject({
          inStrip: true,
          hash: `#${at}`,
          keyboard: true,
        });

        // The page by keys, focus still on the chip, until the current moves.
        for (let i = 0; i < 8; i += 1) {
          await page.keyboard.press('PageDown');
          await untilRested(page);
          if ((await readState(page)).current[0] !== at) break;
        }
        const moved = await readState(page);
        expect(moved.current[0]).not.toBe(at);
        // Not one pixel: the focused chip stays where the visitor's eyes are.
        expect(await focus()).toEqual(held);

        // Focus leaves the strip — and the change it missed is drawn then.
        await page.evaluate(() =>
          (document.activeElement as HTMLElement).blur(),
        );
        await untilRested(page);
        expectFollowed(
          await readState(page),
          `#${moved.current[0]} after focus left`,
        );
      });

      test('a swipe with no new current leaves the strip where the hand left it — it never slides back by itself', async ({
        page,
      }) => {
        // lib/strip-follow's THE STRIP MOVES ONLY ON A SELECTION CHANGE.
        const { fragments } = await readState(page);
        await stepScroll(page, (await crossingOf(page, fragments[4])) + 150);
        await untilRested(page);
        const before = await readState(page);
        // On the STUCK strip its box runs from the header pill's bottom edge
        // (98px) to 2rem under the chips: the glow room under them is the
        // strip's own — transparent, and pointer-active (PriceMenu.tsx's THE
        // STRIP FLOATS UNDER THE BAR).
        const point = await page.evaluate((strip) => {
          const box = document.querySelector(strip) as HTMLElement;
          const chip = (
            box.querySelector('a') as HTMLElement
          ).getBoundingClientRect();
          return { x: window.innerWidth / 2, y: chip.bottom + 12 };
        }, STRIP);
        expect(
          await page.evaluate(
            ({ strip, x, y }) =>
              (document.querySelector(strip) as HTMLElement).contains(
                document.elementFromPoint(x, y),
              ),
            { strip: STRIP, ...point },
          ),
          'the hand lands on the strip',
        ).toBe(true);
        if (device.touch) {
          // A finger's swipe to the left: the strip scrolls on.
          const cdp = await page.context().newCDPSession(page);
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ x: point.x, y: point.y }],
          });
          for (let step = 1; step <= 8; step += 1) {
            await cdp.send('Input.dispatchTouchEvent', {
              type: 'touchMove',
              touchPoints: [{ x: point.x - step * 20, y: point.y }],
            });
          }
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: [],
          });
        } else {
          // A mouse's sideways wheel (a trackpad's swipe) over the strip.
          await page.mouse.move(point.x, point.y);
          await page.mouse.wheel(160, 0);
        }
        await untilRested(page);
        const left = (await readState(page)).scrollLeft;
        // The premise: the hand really moved the strip.
        expect(Math.abs(left - before.scrollLeft)).toBeGreaterThan(40);
        // A second of stillness: nothing slides it back.
        const seen = await page.evaluate(async (strip) => {
          const box = document.querySelector(strip) as HTMLElement;
          const frame = (): Promise<void> =>
            new Promise((resolve) => requestAnimationFrame(() => resolve()));
          const values: number[] = [];
          for (let i = 0; i < 60; i += 1) {
            await frame();
            values.push(box.scrollLeft);
          }
          return values;
        }, STRIP);
        expect(new Set(seen)).toEqual(new Set([left]));
        expect((await readState(page)).current).toEqual(before.current);
      });

      test('a deep link: the browser lands the card first — the strip is not scrolled by script before the document has loaded, then jumps once to its rest, no glide', async ({
        page,
      }) => {
        // lib/strip-follow's THE BROWSER'S FRAGMENT JUMP GOES FIRST (2026-10-10):
        // in Chromium any scripted scroll before the browser's own jump to a
        // URL's fragment cancels that jump. A sampler from the document's first
        // moment records, at every animation frame, which chip is marked, where
        // the strip is and whether the document has loaded yet.
        const { fragments } = await readState(page);
        const deep = fragments[fragments.length - 2];
        await page.addInitScript(() => {
          const frames: {
            current: string | null;
            left: number;
            loaded: boolean;
          }[] = [];
          (window as unknown as { __frames: typeof frames }).__frames = frames;
          const tick = (): void => {
            const box = document.getElementById('price-categories-strip');
            if (box !== null) {
              const on = box.querySelector<HTMLAnchorElement>(
                'a[aria-current="location"]',
              );
              frames.push({
                current: on === null ? null : on.hash.slice(1),
                left: box.scrollLeft,
                loaded: document.readyState === 'complete',
              });
            }
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
        // The webfont held back 800ms, so the document loads well AFTER the
        // island has hydrated and marked its chip — on a fast local load it
        // could load before the first mark, and the "not scrolled before the
        // load" check below would hold of no frame at all (G2, 2026-10-10).
        await page.route('**/*.woff2', async (route) => {
          await new Promise((resolve) => setTimeout(resolve, 800));
          await route.continue();
        });
        // A NEW document (the same URL plus a hash would be a same-document
        // navigation, and the sampler would never be installed).
        await page.goto('about:blank');
        await page.goto(`/${locale}/services/#${deep}`);
        await page.waitForSelector(`section[${CURRENT}]`, {
          state: 'attached',
        });
        await page.waitForFunction(() => document.readyState === 'complete');
        await untilRested(page);
        const frames = await page.evaluate(
          () =>
            (
              window as unknown as {
                __frames: {
                  current: string | null;
                  left: number;
                  loaded: boolean;
                }[];
              }
            ).__frames,
        );
        const marked = frames.filter((frame) => frame.current !== null);
        expect(marked.length).toBeGreaterThan(0);
        // The link's own category from the first mark on…
        expect(new Set(marked.map((frame) => frame.current))).toEqual(
          new Set([deep]),
        );
        // …sampled BEFORE the document had loaded, with the chip already
        // marked — the island hydrated, its follower started…
        expect(
          frames.filter((frame) => frame.current !== null && !frame.loaded)
            .length,
          'frames with the chip marked before the document loaded',
        ).toBeGreaterThan(0);
        // …the strip not scrolled by script in any frame before the document
        // had loaded…
        for (const frame of frames.filter((each) => !each.loaded)) {
          expect(frame.left).toBe(0);
        }
        // …and then ONE jump to where it rests: no value in between.
        const rest = frames[frames.length - 1].left;
        expect(rest).toBeGreaterThan(0);
        expect(
          new Set(frames.map((frame) => frame.left).filter((left) => left > 0)),
        ).toEqual(new Set([rest]));
        // The card itself: where the plan lands it, clear of the strip.
        expectPlannedLanding(
          await landingOf(page, deep),
          CLEARANCE,
          `#${deep} from a deep link`,
        );
        expectFollowed(await readState(page), `#${deep} from a deep link`);
      });

      test('a resize — a rotation, a narrower window: the pinned chip is re-centred AT ONCE, never glided to', async ({
        page,
      }) => {
        // lib/strip-follow's INSTANT: a new geometry, not a new choice. A tap
        // pins its category (lib/scroll-spy's click pin holds until a hand
        // scrolls the page — a resize is no hand, even when the browser moves
        // the page for it: a touch tablet's rotation does, 667 → 675px on the
        // 1180×820 one, and the spy takes the rest again, its THE RESIZE KEEPS
        // THE PIN), so the chip is the same before and after and the only
        // movement is the re-centring.
        const { fragments } = await readState(page);
        const index = 3;
        const id = fragments[index];
        // Bring the chip into view inside the strip (the visitor's swipe).
        await page.evaluate(
          ({ strip, index }) => {
            const box = document.querySelector(strip) as HTMLElement;
            const chip = box.querySelectorAll('a')[index] as HTMLElement;
            const at = chip.getBoundingClientRect();
            const rect = box.getBoundingClientRect();
            box.scrollLeft +=
              at.left +
              at.width / 2 -
              (rect.left + box.clientLeft + box.clientWidth / 2);
          },
          { strip: STRIP, index },
        );
        await untilRested(page);
        const chip = page.locator(`${STRIP} a`).nth(index);
        const box = await chip.boundingBox();
        if (box === null) throw new Error(`the chip for #${id} has no box`);
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        if (device.touch) await page.touchscreen.tap(x, y);
        else await page.mouse.click(x, y);
        await untilRested(page);
        expect((await readState(page)).current).toEqual([id]);

        const { width, height } = device.viewport;
        await page.setViewportSize(
          device.touch
            ? { width: height, height: width }
            : { width: width - 40, height },
        );
        // Two frames: the observer's delivery and the next. A glide would
        // still be on its way — 400ms of them.
        await page.evaluate(async () => {
          await new Promise((resolve) => requestAnimationFrame(resolve));
          await new Promise((resolve) => requestAnimationFrame(resolve));
        });
        const state = await readState(page);
        expect(state.current).toEqual([id]);
        expectFollowed(state, `#${id} two frames after the resize`);
      });
    });
  }
}

test.describe('the trailing gutter is a real box — in Chromium AND in WebKit', () => {
  // THE TRAILING GUTTER IS A REAL BOX (PriceMenu.tsx): WebKit has dropped a
  // flex scroller's inline-end padding from its scrollable overflow (WebKit
  // bugs 236634, 286472, 318111), so the end is an `::after` box — and this
  // one test launches BOTH engines itself, whatever the project's browser.
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'laptop-1366x633',
      'this block launches its own engines; one project is enough to run it',
    );
  });

  for (const engine of ['chromium', 'webkit'] as const) {
    test(`${engine}: at the strip’s end the last chip stands on the content column’s right edge — at its start the first on the left`, async ({
      playwright,
      baseURL,
    }) => {
      test.setTimeout(120_000);
      const browser = await playwright[engine].launch();
      try {
        for (const device of DEVICES) {
          for (const locale of ['ro', 'de'] as const) {
            const context = await browser.newContext({
              baseURL,
              viewport: device.viewport,
              hasTouch: device.touch,
              isMobile: device.touch,
            });
            try {
              const page = await context.newPage();
              await open(page, locale);
              const ends = await page.evaluate(
                ({ menu, strip }) => {
                  const nav = document.querySelector(menu) as HTMLElement;
                  const box = document.querySelector(strip) as HTMLElement;
                  const column = nav.getBoundingClientRect();
                  const chips = box.querySelectorAll('a');
                  box.scrollLeft = 0;
                  const firstLeft = chips[0].getBoundingClientRect().left;
                  box.scrollLeft = box.scrollWidth;
                  const lastRight =
                    chips[chips.length - 1].getBoundingClientRect().right;
                  return {
                    firstLeft,
                    lastRight,
                    columnLeft: column.left,
                    columnRight: column.right,
                    scrolls: box.scrollWidth > box.clientWidth,
                  };
                },
                { menu: MENU, strip: STRIP },
              );
              const at = `${engine} ${device.name} ${locale}`;
              expect(ends.scrolls, `${at}: the row overflows`).toBe(true);
              expect(
                Math.abs(ends.firstLeft - ends.columnLeft),
                `${at}: the first chip on the column's left edge`,
              ).toBeLessThanOrEqual(0.5);
              expect(
                Math.abs(ends.lastRight - ends.columnRight),
                `${at}: the last chip on the column's right edge`,
              ).toBeLessThanOrEqual(0.5);
            } finally {
              await context.close();
            }
          }
        }
      } finally {
        await browser.close();
      }
    });

    test(`${engine}: a keyboard walk through the chips — every focused chip wholly inside the strip’s scroll padding, moved as little as needed, never a frame of the engine’s own jump, and the page still`, async ({
      playwright,
      baseURL,
    }) => {
      // lib/strip-follow's THE KEYBOARD'S REVEAL (the planner, 2026-10-09).
      // WebKit's Tab reaches links only with Alt (macOS's own default).
      test.setTimeout(180_000);
      const forward = engine === 'webkit' ? 'Alt+Tab' : 'Tab';
      const back = engine === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab';
      const browser = await playwright[engine].launch();
      try {
        for (const device of DEVICES.filter(
          (each) => each.viewport.width === 390 || each.viewport.width === 820,
        )) {
          for (const locale of ['ro', 'de'] as const) {
            const context = await browser.newContext({
              baseURL,
              viewport: device.viewport,
              hasTouch: device.touch,
              isMobile: device.touch,
            });
            try {
              const page = await context.newPage();
              await open(page, locale);
              const { fragments } = await readState(page);
              // Stuck, deep in the list: the current chip centred mid-strip.
              await stepScroll(
                page,
                (await crossingOf(page, fragments[5])) + 150,
              );
              await untilRested(page);
              const pageY = await page.evaluate(() => window.scrollY);
              // Every DRAWN frame's position: a ResizeObserver's callback
              // runs after every animation-frame callback of its frame and
              // before the paint, so it sees what is painted.
              await page.evaluate(
                ({ menu, strip }) => {
                  const box = document.querySelector(strip) as HTMLElement;
                  const probe = document.createElement('div');
                  probe.style.cssText =
                    'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none';
                  document.body.append(probe);
                  const drawn: number[] = [];
                  let n = 0;
                  new ResizeObserver(() => drawn.push(box.scrollLeft)).observe(
                    probe,
                  );
                  const tick = (): void => {
                    n += 1;
                    probe.style.width = `${1 + (n % 2)}px`;
                    requestAnimationFrame(tick);
                  };
                  requestAnimationFrame(tick);
                  (window as unknown as { __drawn: number[] }).__drawn = drawn;
                  (document.querySelector(menu) as HTMLElement).focus({
                    preventScroll: true,
                  });
                },
                { menu: MENU, strip: STRIP },
              );
              const keys = [
                ...Array.from({ length: fragments.length }, () => forward),
                ...Array.from({ length: fragments.length - 1 }, () => back),
              ];
              for (const [step, key] of keys.entries()) {
                const origin = await page.evaluate((strip) => {
                  (window as unknown as { __drawn: number[] }).__drawn.length =
                    0;
                  return (document.querySelector(strip) as HTMLElement)
                    .scrollLeft;
                }, STRIP);
                await page.keyboard.press(key);
                await untilRested(page);
                const seen = await page.evaluate((strip) => {
                  const box = document.querySelector(strip) as HTMLElement;
                  const active = document.activeElement as HTMLElement;
                  const style = getComputedStyle(box);
                  const rect = box.getBoundingClientRect();
                  const chip = active.getBoundingClientRect();
                  return {
                    inStrip: box.contains(active),
                    chipLeft: chip.left,
                    chipRight: chip.right,
                    innerLeft:
                      rect.left +
                      box.clientLeft +
                      parseFloat(style.scrollPaddingLeft),
                    innerRight:
                      rect.left +
                      box.clientLeft +
                      box.clientWidth -
                      parseFloat(style.scrollPaddingRight),
                    scrollLeft: box.scrollLeft,
                    drawn: [
                      ...(window as unknown as { __drawn: number[] }).__drawn,
                    ],
                    y: window.scrollY,
                  };
                }, STRIP);
                const at = `${engine} ${device.name} ${locale}, key ${step + 1} (${key})`;
                expect(seen.inStrip, `${at}: focus in the strip`).toBe(true);
                // Wholly inside the strip's visible box less its scroll padding.
                expect(
                  seen.chipLeft,
                  `${at}: inside, left`,
                ).toBeGreaterThanOrEqual(seen.innerLeft - 0.5);
                expect(
                  seen.chipRight,
                  `${at}: inside, right`,
                ).toBeLessThanOrEqual(seen.innerRight + 0.5);
                // The page never moves.
                expect(seen.y, `${at}: the page`).toBe(pageY);
                if (Math.abs(seen.scrollLeft - origin) > 0.5) {
                  // As little as needed: the chip on the inner edge it came in
                  // by — within the whole pixel nearestScrollLeft rounds to,
                  // always on the inside.
                  const onEdge =
                    Math.abs(seen.chipLeft - seen.innerLeft) <= 1 ||
                    Math.abs(seen.chipRight - seen.innerRight) <= 1;
                  expect(onEdge, `${at}: on an inner edge`).toBe(true);
                }
                // Never a drawn frame outside the way from where it was to where
                // it rests — the engine's own jump never reaches the screen.
                const low = Math.min(origin, seen.scrollLeft) - 0.5;
                const high = Math.max(origin, seen.scrollLeft) + 0.5;
                for (const left of seen.drawn) {
                  expect(left, `${at}: a drawn frame`).toBeGreaterThanOrEqual(
                    low,
                  );
                  expect(left, `${at}: a drawn frame`).toBeLessThanOrEqual(
                    high,
                  );
                }
              }
            } finally {
              await context.close();
            }
          }
        }
      } finally {
        await browser.close();
      }
    });
  }
});

test.describe('ro/services on a laptop — the rail, exactly as before', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'laptop-1366x633',
      'this block sets its own windows; one project is enough to run it',
    );
  });

  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 1366, height: 633 },
    { width: 1920, height: 945 },
  ] as const) {
    test(`at ${viewport.width} × ${viewport.height}: the rail, no strip, no root write`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await open(page, 'ro');
      const facts = await page.evaluate(
        ({ menu, strip }) => {
          const nav = document.querySelector(menu) as HTMLElement;
          const box = document.querySelector(strip) as HTMLElement;
          const title = nav.querySelector('h2') as HTMLElement;
          return {
            fine: matchMedia('(pointer: fine)').matches,
            stripShown: box.getClientRects().length > 0,
            railShown: title.getClientRects().length > 0,
            navTop: getComputedStyle(nav).top,
            navZ: getComputedStyle(nav).zIndex,
            rootInline: document.documentElement.style.scrollPaddingTop,
            rootPadding: getComputedStyle(document.documentElement)
              .scrollPaddingTop,
          };
        },
        { menu: MENU, strip: STRIP },
      );
      expect(facts).toEqual({
        fine: true,
        stripShown: false,
        railShown: true,
        navTop: '136px',
        navZ: 'auto',
        rootInline: '',
        rootPadding: '96px',
      });
      // …and scrolled deep, the same: the rail never writes a clearance.
      await stepScroll(page, 2_000);
      await untilRested(page);
      expect(
        await page.evaluate(
          () => document.documentElement.style.scrollPaddingTop,
        ),
      ).toBe('');
    });
  }
});

/** Where a card came to rest after a jump, read from the page — with the
 *  landing lib/scroll-spy PLANNED for it, which the spy writes on the card as
 *  its inline `scroll-margin-top` (THE READING LINE). */
const landingOf = (page: Page, id: string) =>
  page.evaluate((id) => {
    const element = document.getElementById(id) as HTMLElement;
    const card = element.getBoundingClientRect();
    const planned = parseFloat(
      element.style.getPropertyValue('scroll-margin-top'),
    );
    return {
      y: window.scrollY,
      maxY: document.documentElement.scrollHeight - window.innerHeight,
      top: card.top,
      padding: parseFloat(
        getComputedStyle(document.documentElement).scrollPaddingTop,
      ),
      planned: Number.isNaN(planned) ? null : planned,
    };
  }, id);

/** WHERE THE PLAN LANDS IT: never under the strip — its top at least the
 *  clearance and the 2.5rem floor down — and, wherever an end of the page
 *  does not hold it, exactly on its planned landing: the padding plus the
 *  margin the spy wrote (centred on the reading line when it fits, 2.5rem
 *  under the clearance when it does not, bent near the page's ends). */
function expectPlannedLanding(
  landed: Awaited<ReturnType<typeof landingOf>>,
  clearance: number,
  at: string,
): void {
  expect(landed.top, `${at}: clear of the strip`).toBeGreaterThanOrEqual(
    clearance + FLOOR - 2,
  );
  if (landed.y <= 1 || landed.y >= landed.maxY - 1) return;
  expect(landed.planned, `${at}: the spy wrote its plan`).not.toBeNull();
  expect(
    Math.abs(landed.top - (landed.padding + (landed.planned ?? 0))),
    `${at}: where the plan lands it`,
  ).toBeLessThanOrEqual(2);
}

test.describe('a DEEP LINK to every category lands clear of the strip and marks its own category (G2, 2026-10-09)', () => {
  // THE STRIP'S CLEARANCE is the stylesheet's since the G2 round: a page
  // loaded with a `#fragment` jumps BEFORE hydration, and with the old
  // island-written padding it jumped with 96px — every card at 136px, under
  // the stuck chips' 154 — and the spy, expecting 194, never finished the
  // jump: a link to #prophylaxis marked „Estetică dentară" (5 to 6 of 11
  // wrong at 820×1180). Every category, both languages, three screens: fresh
  // loads, each from about:blank.
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'laptop-1366x633',
      'this block opens its own screens; one project is enough to run it',
    );
  });

  for (const device of [
    {
      name: 'phone 390×844 fine',
      viewport: { width: 390, height: 844 },
      touch: false,
    },
    {
      name: 'phone 390×844 touch',
      viewport: { width: 390, height: 844 },
      touch: true,
    },
    {
      name: 'touch tablet 820×1180',
      viewport: { width: 820, height: 1180 },
      touch: true,
    },
  ] as const) {
    for (const locale of ['ro', 'de'] as const) {
      test(`${locale} on a ${device.name}: each of the 11 categories — the card where the plan lands it, and the chip, the card's mark and the centred pill all the linked one`, async ({
        browser,
        baseURL,
      }) => {
        test.setTimeout(240_000);
        const context = await browser.newContext({
          baseURL,
          viewport: device.viewport,
          hasTouch: device.touch,
          isMobile: device.touch,
        });
        try {
          const page = await context.newPage();
          await open(page, locale);
          const { fragments } = await readState(page);
          expect(fragments).toHaveLength(11);
          for (const id of fragments) {
            const at = `${locale} ${device.name} #${id}`;
            await page.goto('about:blank');
            await page.goto(`/${locale}/services/#${id}`);
            await page.waitForSelector(`section[${CURRENT}]`, {
              state: 'attached',
            });
            await page.evaluate(() => document.fonts.ready);
            await untilRested(page);
            const landed = await landingOf(page, id);
            expect(landed.padding, `${at}: the stylesheet's clearance`).toBe(
              CLEARANCE,
            );
            expectPlannedLanding(landed, CLEARANCE, at);
            const state = await readState(page);
            expect(state.current, `${at}: the chip`).toEqual([id]);
            expect(state.marked, `${at}: the card's mark`).toEqual([id]);
            expectFollowed(state, `${at}: the pill`);
          }
        } finally {
          await context.close();
        }
      });
    }
  }

  test('WITHOUT JavaScript a deep link still lands clear of the strip — every category, the stylesheet’s clearance alone', async ({
    browser,
    baseURL,
  }) => {
    test.setTimeout(120_000);
    // Reduced motion: the fragment jump is instant (the shell's smooth
    // scrolling is a no-preference rule) — and it still comes AFTER the load
    // event `goto` waits for (MEASURED: scrollY 0 when goto returned), so the
    // test waits for the page to have moved and to have stopped.
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      javaScriptEnabled: false,
      reducedMotion: 'reduce',
    });
    try {
      const page = await context.newPage();
      await page.goto('/ro/services/');
      const hrefs = await page
        .locator(`${STRIP} a`)
        .evaluateAll((links) =>
          links.map((link) => link.getAttribute('href') ?? ''),
        );
      expect(hrefs).toHaveLength(11);
      const scrollY = (): Promise<number> =>
        page.evaluate(() => window.scrollY);
      for (const href of hrefs) {
        await page.goto('about:blank');
        await page.goto(`/ro/services/${href}`);
        await expect.poll(scrollY, { timeout: 5_000 }).toBeGreaterThan(0);
        let last = -1;
        for (let read = 0; read < 20; read += 1) {
          const now = await scrollY();
          if (now === last) break;
          last = now;
          await page.waitForTimeout(100);
        }
        const box = await page.locator(href).boundingBox();
        if (box === null) throw new Error(`no box for ${href}`);
        // NEVER UNDER THE CHIPS — the stylesheet's 154px clearance. The jump
        // itself lands the card on its 2.5rem floor, 194px down (traced), but
        // without JavaScript nothing re-lands it after a late webfont: on a
        // cold run the font swap shortens the cards above, and the card was
        // read 20px higher (174px) — still clear of the chips' bottom edge.
        expect(box.y, `${href}: clear of the strip`).toBeGreaterThanOrEqual(
          CLEARANCE,
        );
      }
    } finally {
      await context.close();
    }
  });
});

test.describe('a SLOW LOAD — the webfont held back, and the scripts with it — still lands every deep link where the plan lands it (the deep-link sweep’s flake, root-caused 2026-10-10)', () => {
  // The sweep above warms the webfont first, and still missed now and then
  // under load — a card 60 to 80px high, inside the stuck chips, or 609px
  // above the window. `/debug-deep` found it deterministic once the webfont is
  // HELD BACK (`page.route`), which is every visitor's first visit on a slow
  // connection: in Chromium a scripted scroll of the strip before the
  // browser's own jump to the fragment cancelled that jump (lib/strip-follow's
  // THE BROWSER'S FRAGMENT JUMP GOES FIRST), and a smooth jump the late
  // webfont reflowed under went stale — with JavaScript off too — which
  // lib/scroll-spy now finishes at its settle (THE READING LINE). Five
  // categories, the webfont late by 300ms and by 1200ms — and late by 1800ms
  // with the SCRIPTS late by 700ms too (G2 react, 2026-10-10: hydration
  // between the browser's jump and the load, where a finish at start()
  // stopped the browser's own corrections — −20.5, −10 and −18.5px measured),
  // both motion preferences, a mouse and a touch — and WebKit once over. The
  // card is POLLED onto its planned landing (2px, 5s): the settle that
  // finishes a stale jump comes after the load, so one read at the first
  // quiet frame could catch the page before it.
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'laptop-1366x633',
      'this block opens its own screens; one project is enough to run it',
    );
  });

  const IDS = [
    'emergencies',
    'restorative',
    'endodontics',
    'oral-surgery',
    'prosthetics',
  ] as const;

  async function landsEveryOne(
    browser: Browser,
    baseURL: string | undefined,
    at: string,
    options: Readonly<{
      touch: boolean;
      reducedMotion: 'reduce' | 'no-preference';
    }>,
  ): Promise<void> {
    const lateness = [
      { font: 300, scripts: 0 },
      { font: 1_200, scripts: 0 },
      { font: 1_800, scripts: 700 },
    ] as const;
    for (const late of lateness) {
      for (const id of IDS) {
        const context = await browser.newContext({
          baseURL,
          viewport: { width: 390, height: 844 },
          hasTouch: options.touch,
          isMobile: options.touch,
          reducedMotion: options.reducedMotion,
          locale: 'de-DE',
        });
        try {
          await context.route('**/*.woff2', async (route) => {
            await new Promise((resolve) => setTimeout(resolve, late.font));
            await route.continue();
          });
          if (late.scripts > 0) {
            await context.route(
              '**/_next/static/chunks/*.js',
              async (route) => {
                await new Promise((resolve) =>
                  setTimeout(resolve, late.scripts),
                );
                await route.continue();
              },
            );
          }
          const page = await context.newPage();
          await page.goto('about:blank');
          await page.goto(`/de/services/#${id}`);
          await page.waitForSelector(`section[${CURRENT}]`, {
            state: 'attached',
          });
          await page.waitForFunction(() => document.readyState === 'complete');
          const where = `${at}, webfont +${late.font}ms, scripts +${late.scripts}ms, #${id}`;
          await expect(async () => {
            expectPlannedLanding(await landingOf(page, id), CLEARANCE, where);
          }).toPass({ timeout: 5_000 });
          await untilRested(page);
          // …and it STAYS there once everything is quiet.
          expectPlannedLanding(await landingOf(page, id), CLEARANCE, where);
          const state = await readState(page);
          expect(state.current, `${where}: the chip`).toEqual([id]);
          expect(state.marked, `${where}: the card's mark`).toEqual([id]);
          expectFollowed(state, `${where}: the pill`);
        } finally {
          await context.close();
        }
      }
    }
  }

  for (const reducedMotion of ['reduce', 'no-preference'] as const) {
    for (const touch of [false, true]) {
      test(`chromium, ${reducedMotion} motion, ${touch ? 'touch' : 'fine'} 390×844`, async ({
        browser,
        baseURL,
      }) => {
        test.setTimeout(240_000);
        await landsEveryOne(
          browser,
          baseURL,
          `${reducedMotion} ${touch ? 'touch' : 'fine'}`,
          {
            touch,
            reducedMotion,
          },
        );
      });
    }
  }

  test('a load that NEVER completes: the card and its chip give up on it together, at the ceiling — the strip placed, the card where the plan lands it (lib/strip-follow GATE_CEILING_MS = lib/scroll-spy LOAD_WAIT_CEILING_MS)', async ({
    browser,
    baseURL,
  }) => {
    test.setTimeout(60_000);
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      locale: 'de-DE',
    });
    try {
      // The webfont never answers, so the document's `load` never comes.
      await context.route('**/*.woff2', () => {});
      const page = await context.newPage();
      await page.goto('about:blank');
      const started = Date.now();
      await page.goto('/de/services/#prosthetics', {
        waitUntil: 'domcontentloaded',
      });
      await page.waitForSelector(`section[${CURRENT}]`, { state: 'attached' });
      const stripLeft = (): Promise<number> =>
        page.evaluate(
          (strip) => (document.querySelector(strip) as HTMLElement).scrollLeft,
          STRIP,
        );
      // Well inside the ceiling: still waiting — the strip untouched.
      await page.waitForTimeout(Math.max(0, 6_000 - (Date.now() - started)));
      expect(await page.evaluate(() => document.readyState)).not.toBe(
        'complete',
      );
      expect(await stripLeft()).toBe(0);
      // Past it: the strip placed, as after a load. Both ceilings count from
      // start() — the island's hydration — never from the navigation, so the
      // state after them is POLLED rather than read at a fixed moment.
      const where = 'a load that never completes, #prosthetics';
      await expect(async () => {
        expect(await page.evaluate(() => document.readyState)).not.toBe(
          'complete',
        );
        expectPlannedLanding(
          await landingOf(page, 'prosthetics'),
          CLEARANCE,
          where,
        );
        const state = await readState(page);
        expect(state.current, `${where}: the chip`).toEqual(['prosthetics']);
        expect(state.marked, `${where}: the card's mark`).toEqual([
          'prosthetics',
        ]);
        expectFollowed(state, `${where}: the pill`);
      }).toPass({ timeout: 15_000 });
    } finally {
      await context.close();
    }
  });

  test('webkit, motion allowed, fine 390×844', async ({
    playwright,
    baseURL,
  }) => {
    test.setTimeout(240_000);
    const browser = await playwright.webkit.launch();
    try {
      await landsEveryOne(browser, baseURL, 'webkit', {
        touch: false,
        reducedMotion: 'no-preference',
      });
    } finally {
      await browser.close();
    }
  });
});

for (const device of [
  {
    name: 'landscape phone 844×390 touch',
    viewport: { width: 844, height: 390 },
    touch: true,
  },
  {
    name: 'zoomed laptop 640×400 fine (a 1280×800 laptop at 200%)',
    viewport: { width: 640, height: 400 },
    touch: false,
  },
] as const) {
  test.describe(`ro/services on a ${device.name} — the strip SCROLLS AWAY (G2 a11y, 2026-10-09)`, () => {
    // PriceMenu.tsx's STICKY UNDER THE HEADER PILL, FROM 30rem: a window
    // under 480px tall keeps the strip in the page's flow — stuck, the strip
    // and the clearance under it would hold every jump below the window's top
    // 154px, and its footprint was 186px while it had a ground, half the
    // screen there — and the root keeps the shell's 96px.
    // A Romanian browser: the language suggestion (sections/LanguageBanner)
    // does not show — MEASURED, on a window this short its card covers the
    // strip's chips at rest, and a tap would land on its link instead.
    test.use({
      viewport: device.viewport,
      hasTouch: device.touch,
      isMobile: device.touch,
      locale: 'ro-RO',
    });

    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== 'laptop-1366x633',
        'this block sets its own screen; one project is enough to run it',
      );
      await open(page, 'ro');
    });

    test('the strip is shown but does not stick: it scrolls away with the page, and the root keeps the shell’s 96px', async ({
      page,
    }) => {
      const before = await page.evaluate(
        ({ menu, strip }) => ({
          shown:
            (document.querySelector(strip) as HTMLElement).getClientRects()
              .length > 0,
          position: getComputedStyle(document.querySelector(menu) as Element)
            .position,
          padding: getComputedStyle(document.documentElement).scrollPaddingTop,
          inline: document.documentElement.style.scrollPaddingTop,
        }),
        { menu: MENU, strip: STRIP },
      );
      expect(before).toEqual({
        shown: true,
        position: 'static',
        padding: '96px',
        inline: '',
      });
      await stepScroll(page, 1_500);
      await untilRested(page);
      const stripBottom = await page.evaluate(
        (strip) =>
          (document.querySelector(strip) as HTMLElement).getBoundingClientRect()
            .bottom,
        STRIP,
      );
      // Scrolled away above the window — never stuck in it.
      expect(stripBottom).toBeLessThan(0);
    });

    test('a tapped card lands below the header pill — the shell’s 96px clearance and its 2.5rem floor', async ({
      page,
    }) => {
      const { fragments } = await readState(page);
      const index = 4;
      const id = fragments[index];
      await page.evaluate(
        ({ strip, index }) => {
          const box = document.querySelector(strip) as HTMLElement;
          const chip = box.querySelectorAll('a')[index] as HTMLElement;
          const at = chip.getBoundingClientRect();
          const rect = box.getBoundingClientRect();
          box.scrollLeft +=
            at.left +
            at.width / 2 -
            (rect.left + box.clientLeft + box.clientWidth / 2);
        },
        { strip: STRIP, index },
      );
      await untilRested(page);
      const box = await page.locator(`${STRIP} a`).nth(index).boundingBox();
      if (box === null) throw new Error(`the chip for #${id} has no box`);
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      if (device.touch) await page.touchscreen.tap(x, y);
      else await page.mouse.click(x, y);
      await untilRested(page);
      const landed = await landingOf(page, id);
      const headerBottom = await page.evaluate(
        () =>
          (
            document.querySelector('header') as HTMLElement
          ).getBoundingClientRect().bottom,
      );
      expect(landed.padding).toBe(96);
      expect(landed.top, 'below the header pill').toBeGreaterThanOrEqual(
        headerBottom,
      );
      expectPlannedLanding(landed, 96, `#${id} on a short window`);
      expect((await readState(page)).current).toEqual([id]);
    });
  });
}

test.describe('a sideways swipe on the strip MID-GLIDE never moves the mark off the tapped category (lib/scroll-spy’s horizontalScrollers, G2 react, 2026-10-09)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'laptop-1366x633',
      'this block opens its own screens; one project is enough to run it',
    );
  });

  for (const device of [
    { name: 'phone 390×844 touch', viewport: { width: 390, height: 844 } },
    { name: 'touch tablet 820×1180', viewport: { width: 820, height: 1180 } },
  ] as const) {
    for (const locale of ['ro', 'de'] as const) {
      test(`${locale} on a ${device.name}`, async ({ browser, baseURL }) => {
        const context = await browser.newContext({
          baseURL,
          viewport: device.viewport,
          hasTouch: true,
          isMobile: true,
        });
        try {
          const page = await context.newPage();
          await open(page, locale);
          const { fragments } = await readState(page);
          const index = fragments.length - 2;
          const id = fragments[index];
          await page.evaluate(
            ({ strip, index }) => {
              const box = document.querySelector(strip) as HTMLElement;
              const chip = box.querySelectorAll('a')[index] as HTMLElement;
              const at = chip.getBoundingClientRect();
              const rect = box.getBoundingClientRect();
              box.scrollLeft +=
                at.left +
                at.width / 2 -
                (rect.left + box.clientLeft + box.clientWidth / 2);
            },
            { strip: STRIP, index },
          );
          await untilRested(page);
          // Every frame's marked chip, from now on.
          await page.evaluate((strip) => {
            const box = document.querySelector(strip) as HTMLElement;
            const marks: (string | null)[] = [];
            (window as unknown as { __marks: typeof marks }).__marks = marks;
            const tick = (): void => {
              const on = box.querySelector<HTMLAnchorElement>(
                'a[aria-current="location"]',
              );
              marks.push(on === null ? null : on.hash.slice(1));
              requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }, STRIP);
          const box = await page.locator(`${STRIP} a`).nth(index).boundingBox();
          if (box === null) throw new Error(`the chip for #${id} has no box`);
          await page.touchscreen.tap(
            box.x + box.width / 2,
            box.y + box.height / 2,
          );
          // 120ms into the page's glide, a finger swipes the strip sideways.
          await page.waitForTimeout(120);
          const point = await page.evaluate((strip) => {
            const chip = (
              document.querySelector(`${strip} a`) as HTMLElement
            ).getBoundingClientRect();
            return { x: window.innerWidth / 2, y: chip.bottom + 12 };
          }, STRIP);
          const cdp = await context.newCDPSession(page);
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ x: point.x, y: point.y }],
          });
          for (let step = 1; step <= 8; step += 1) {
            await cdp.send('Input.dispatchTouchEvent', {
              type: 'touchMove',
              touchPoints: [{ x: point.x + step * 18, y: point.y + 1 }],
            });
          }
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: [],
          });
          await untilRested(page);
          const marks = await page.evaluate(
            () => (window as unknown as { __marks: (string | null)[] }).__marks,
          );
          const from = marks.indexOf(id);
          expect(from, 'the tap marked its category').toBeGreaterThanOrEqual(0);
          expect(new Set(marks.slice(from))).toEqual(new Set([id]));
        } finally {
          await context.close();
        }
      });
    }
  }
});

test.describe('FORCED COLOURS: the current chip stays distinguishable (ui/PillButton, G2 a11y, 2026-10-09)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'laptop-1366x633',
      'this block sets its own screen; one project is enough to run it',
    );
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page, 'ro');
  });

  test('the current chip wears the system’s selection pair, the resting chips keep the system’s own colours', async ({
    page,
  }) => {
    const seen = await page.evaluate((strip) => {
      // The system colours this engine resolves, read off probes.
      const probe = (css: string): CSSStyleDeclaration => {
        const element = document.createElement('div');
        element.style.cssText = `${css}; forced-color-adjust: none;`;
        document.body.append(element);
        const style = getComputedStyle(element);
        const copy = {
          backgroundColor: style.backgroundColor,
          color: style.color,
        } as CSSStyleDeclaration;
        element.remove();
        return copy;
      };
      const highlight = probe(
        'background-color: Highlight; color: HighlightText',
      );
      const canvas = probe('background-color: Canvas; color: CanvasText');
      const box = document.querySelector(strip) as HTMLElement;
      const chips = Array.from(box.querySelectorAll<HTMLElement>('a'));
      const current = chips.find(
        (chip) => chip.getAttribute('aria-current') === 'location',
      ) as HTMLElement;
      const resting = chips.find((chip) => chip !== current) as HTMLElement;
      return {
        forced: matchMedia('(forced-colors: active)').matches,
        highlight,
        canvas,
        current: {
          background: getComputedStyle(current).backgroundColor,
          color: getComputedStyle(current).color,
          border: getComputedStyle(current).borderTopColor,
        },
        resting: {
          background: getComputedStyle(resting).backgroundColor,
          border: getComputedStyle(resting).borderTopColor,
        },
      };
    }, STRIP);
    expect(seen.forced).toBe(true);
    // The current chip: Highlight ground and border, HighlightText label.
    expect(seen.current.background).toBe(seen.highlight.backgroundColor);
    expect(seen.current.border).toBe(seen.highlight.backgroundColor);
    expect(seen.current.color).toBe(seen.highlight.color);
    // A resting chip: the system's own ground, never the selection's.
    expect(seen.resting.background).not.toBe(seen.highlight.backgroundColor);
    expect([seen.canvas.backgroundColor, 'rgba(0, 0, 0, 0)']).toContain(
      seen.resting.background,
    );
    // …so the two differ.
    expect(seen.current.background).not.toBe(seen.resting.background);
  });
});

test.describe('THE LANGUAGE BANNER on a short, wide window covers neither the strip nor the corner discs (sections/LanguageBanner, G2 a11y, 2026-10-09)', () => {
  // A browser in another language than the page shows the §8.6 suggestion
  // card. Under 30rem of window height its lift put it over the strip's
  // resting chips (SC 2.4.11); from 40rem of width it is anchored low now —
  // THE ONE OVERRIDE in LanguageBanner.tsx.
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'laptop-1366x633',
      'this block opens its own screens; one project is enough to run it',
    );
  });

  for (const device of [
    {
      name: 'a laptop at 200% — 640×400 fine',
      viewport: { width: 640, height: 400 },
      touch: false,
    },
    {
      name: 'a phone held sideways — 844×390 touch',
      viewport: { width: 844, height: 390 },
      touch: true,
    },
  ] as const) {
    test(device.name, async ({ browser, baseURL }) => {
      const context = await browser.newContext({
        baseURL,
        viewport: device.viewport,
        hasTouch: device.touch,
        isMobile: device.touch,
        locale: 'en-US',
      });
      try {
        const page = await context.newPage();
        await open(page, 'ro');
        // The card decides after mount and slides in over 200ms (its
        // `starting:` translate): read it once it has come to rest.
        await page.waitForSelector('aside[aria-labelledby]');
        await page.evaluate(() =>
          Promise.allSettled(
            document.getAnimations().map((animation) => animation.finished),
          ),
        );
        type Box = { left: number; top: number; right: number; bottom: number };
        const seen = await page.evaluate((strip) => {
          const boxOf = (element: Element): Box => {
            const r = element.getBoundingClientRect();
            return {
              left: r.left,
              top: r.top,
              right: r.right,
              bottom: r.bottom,
            };
          };
          const banner = Array.from(document.querySelectorAll('aside')).find(
            (aside) => getComputedStyle(aside).position === 'fixed',
          ) as HTMLElement;
          const discs = Array.from(document.querySelectorAll('body *')).filter(
            (element) => {
              const style = getComputedStyle(element);
              return (
                style.position === 'fixed' &&
                style.zIndex === '40' &&
                element.getClientRects().length > 0
              );
            },
          );
          const box = document.querySelector(strip) as HTMLElement;
          const chips: Box[] = [];
          // Each chip in turn brought into the strip's window — as a swipe
          // would — and read where it then stands.
          for (const chip of Array.from(box.querySelectorAll('a'))) {
            const at = chip.getBoundingClientRect();
            const rect = box.getBoundingClientRect();
            box.scrollLeft +=
              at.left +
              at.width / 2 -
              (rect.left + box.clientLeft + box.clientWidth / 2);
            chips.push(boxOf(chip));
          }
          return {
            banner: boxOf(banner),
            discs: discs.map(boxOf),
            chips,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
          };
        }, STRIP);
        const overlap = (a: Box, b: Box): number =>
          Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
          Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        const onScreen = (a: Box): number =>
          overlap(a, {
            left: 0,
            top: 0,
            right: seen.innerWidth,
            bottom: seen.innerHeight,
          });
        expect(seen.chips).toHaveLength(11);
        for (const [index, chip] of seen.chips.entries()) {
          const visible = onScreen(chip) - overlap(chip, seen.banner);
          expect(
            visible,
            `chip ${index + 1}: uncovered on screen`,
          ).toBeGreaterThan(0);
          expect(overlap(chip, seen.banner), `chip ${index + 1}`).toBe(0);
        }
        expect(seen.discs.length).toBeGreaterThanOrEqual(2);
        for (const [index, disc] of seen.discs.entries()) {
          expect(overlap(disc, seen.banner), `corner disc ${index + 1}`).toBe(
            0,
          );
        }
      } finally {
        await context.close();
      }
    });
  }
});

test.describe('THE LANGUAGE BANNER on a narrow phone window never ENTIRELY hides the centred current chip of the stuck strip (sections/LanguageBanner, G2 a11y LOW-5, 2026-10-10)', () => {
  // A narrow window keeps the card's 12.5rem lift at every height (THE ONE
  // OVERRIDE needs 40rem of width). From 30rem of height the strip sticks,
  // its chips at 110–154px, and the longest card — Italian, two lines — then
  // reaches down over the bottom of the centred chip: MEASURED 8.8px at 480,
  // 4.8 at 484, 0.8 at 488, none from 490 (Chromium and WebKit alike), never
  // all of it. LanguageBanner.tsx records the residual, and the resting
  // chips' (the page's top) beside it.
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'laptop-1366x633',
      'this block opens its own screens; one project is enough to run it',
    );
  });

  for (const height of [480, 484, 487]) {
    test(`390×${height} touch, an Italian browser on a Romanian page`, async ({
      browser,
      baseURL,
    }) => {
      const context = await browser.newContext({
        baseURL,
        viewport: { width: 390, height },
        hasTouch: true,
        isMobile: true,
        locale: 'it-IT',
      });
      try {
        const page = await context.newPage();
        await open(page, 'ro');
        await page.waitForSelector('aside[aria-labelledby]');
        await page.evaluate(() =>
          Promise.allSettled(
            document.getAnimations().map((animation) => animation.finished),
          ),
        );
        // The page scrolled into the list: the strip stuck, its current chip
        // centred by the follower.
        await page.evaluate(() =>
          window.scrollTo({
            top: Math.round(
              (document.documentElement.scrollHeight - window.innerHeight) *
                0.45,
            ),
            behavior: 'instant',
          }),
        );
        await untilRested(page);
        const seen = await page.evaluate((strip) => {
          const banner = Array.from(document.querySelectorAll('aside')).find(
            (aside) => getComputedStyle(aside).position === 'fixed',
          ) as HTMLElement;
          const chip = document
            .querySelector(strip)
            ?.querySelector('a[aria-current="location"]') as HTMLElement;
          const b = banner.getBoundingClientRect();
          const c = chip.getBoundingClientRect();
          return {
            banner: {
              top: b.top,
              bottom: b.bottom,
              left: b.left,
              right: b.right,
            },
            chip: {
              top: c.top,
              bottom: c.bottom,
              left: c.left,
              right: c.right,
            },
          };
        }, STRIP);
        // The premise: the strip is stuck and the card reaches into its row.
        expect(seen.chip.top).toBeCloseTo(CHIPS_TOP, 0);
        const across =
          Math.min(seen.banner.right, seen.chip.right) -
          Math.max(seen.banner.left, seen.chip.left);
        const down =
          Math.min(seen.banner.bottom, seen.chip.bottom) -
          Math.max(seen.banner.top, seen.chip.top);
        expect(across).toBeGreaterThan(0);
        // NEVER ENTIRELY HIDDEN (SC 2.4.11): the card covers at most the
        // chip's bottom 8.8px — the residual LanguageBanner.tsx records.
        expect(down).toBeLessThan(CHIP);
        expect(down).toBeLessThanOrEqual(9);
      } finally {
        await context.close();
      }
    });
  }
});

test.describe('A RESTING MOUSE on the chips of a deep link is waited for briefly, never for good (lib/strip-follow, the G2 re-review, 2026-10-10)', () => {
  // The unit suite TELLS the strip it is hovered (a real move there would
  // disturb the other test files sharing its browser page); here a REAL mouse
  // moves onto the chips after the island has started and rests there — each
  // Playwright test owns its page, and its mouse. Measured before the fold:
  // the unbounded wait froze the strip — the visitor wheel-scrolled, the
  // current item walked three categories, every current chip off screen.
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'laptop-1366x633',
      'this block opens its own screens; one project is enough to run it',
    );
  });

  /** A narrow mouse window on a deep link, the webfont late: once the island
   *  has started, the mouse MOVES onto the chips' row and rests there. */
  async function restOnTheChips(
    browser: Browser,
    baseURL: string | undefined,
  ): Promise<Readonly<{ context: BrowserContext; page: Page }>> {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 900, height: 800 },
      locale: 'de-DE',
    });
    await context.route('**/*.woff2', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      await route.continue();
    });
    const page = await context.newPage();
    await page.goto('about:blank');
    await page.goto('/de/services/#prosthetics', { waitUntil: 'commit' });
    await page.waitForSelector(`section[${CURRENT}]`, { state: 'attached' });
    const row = await page.evaluate((strip) => {
      const chip = document.querySelector(`${strip} a`) as HTMLElement;
      const rect = chip.getBoundingClientRect();
      return Math.round(rect.top + rect.height / 2);
    }, STRIP);
    await page.mouse.move(450, row);
    await page.waitForFunction(() => document.readyState === 'complete');
    return { context, page };
  }

  const resting = (page: Page): Promise<boolean> =>
    page.evaluate(
      (strip) =>
        (document.querySelector(strip) as HTMLElement).matches(':hover'),
      STRIP,
    );

  test('the bound: with no other input, the strip is placed within HOVER_WAIT_MAX_MS of the load — the mouse still resting on it', async ({
    browser,
    baseURL,
  }) => {
    const { context, page } = await restOnTheChips(browser, baseURL);
    try {
      await expect(async () => {
        expectFollowed(await readState(page), 'a resting mouse, no input');
      }).toPass({ timeout: 4_000 });
      expect(await resting(page), 'the premise: the mouse rests').toBe(true);
    } finally {
      await context.close();
    }
  });

  test('the wheel: every current chip in view as the page scrolls under the resting mouse — a new current item ends the wait', async ({
    browser,
    baseURL,
  }) => {
    const { context, page } = await restOnTheChips(browser, baseURL);
    try {
      expect(await resting(page), 'the premise: the mouse rests').toBe(true);
      const seen: string[] = [];
      for (let step = 1; step <= 3; step += 1) {
        await page.mouse.wheel(0, -700);
        await untilRested(page);
        const state = await readState(page);
        seen.push(...state.current);
        expectFollowed(state, `wheel step ${step}`);
      }
      expect(new Set(seen).size, 'the current item moved on').toBeGreaterThan(
        1,
      );
    } finally {
      await context.close();
    }
  });
});

test.describe('A READER WHO SCROLLED DOWN THE CARD BEFORE HYDRATION is never pulled back (lib/scroll-spy THE HYBRID, G2 react, 2026-10-10)', () => {
  // The HTML is readable a second or more before the island hydrates, on
  // every phone load. Measured before the fold: a reader 900px down a tall
  // card when the island started was pulled back to its top (Chromium 720px,
  // WebKit 900px). In this harness WebKit made no fragment jump before the
  // held-back scripts arrived, so the reader is driven in Chromium; the unit
  // suite pins the rule for both engines.
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'laptop-1366x633',
      'this block opens its own screens; one project is enough to run it',
    );
  });

  /** Until the page has gone past `beyond` and not moved for 300ms. */
  const pageAtRest = (page: Page, beyond: number): Promise<unknown> =>
    page.waitForFunction(
      (beyond) => {
        const w = window as unknown as { __lastY?: number; __since?: number };
        const y = window.scrollY;
        if (y !== w.__lastY) {
          w.__lastY = y;
          w.__since = performance.now();
          return false;
        }
        return y > beyond && performance.now() - (w.__since ?? 0) > 300;
      },
      beyond,
      { polling: 50, timeout: 10_000 },
    );

  test('the scripts held back 3s: the browser lands #prosthetics, the reader wheels 900px down it before the island starts — the page stays where they read', async ({
    browser,
    baseURL,
  }) => {
    test.setTimeout(60_000);
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 390, height: 844 },
      locale: 'de-DE',
    });
    try {
      await context.route('**/_next/static/chunks/*.js', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 3_000));
        await route.continue();
      });
      const page = await context.newPage();
      await page.goto('about:blank');
      await page.goto('/de/services/#prosthetics', { waitUntil: 'commit' });
      // The browser's own jump, come to rest — no script of ours yet.
      await pageAtRest(page, 0);
      const jumped = await page.evaluate(() => window.scrollY);
      await page.mouse.move(195, 500);
      await page.mouse.wheel(0, 900);
      await pageAtRest(page, jumped + 600);
      const read = await page.evaluate(() => window.scrollY);
      const premise = await page.evaluate(() => {
        const card = (
          document.getElementById('prosthetics') as HTMLElement
        ).getBoundingClientRect();
        return {
          hydrated: document.querySelector('section[data-current]') !== null,
          top: card.top,
          bottom: card.bottom,
        };
      });
      expect(premise.hydrated, 'the premise: before hydration').toBe(false);
      expect(premise.top, 'the premise: well down the card').toBeLessThan(-600);
      expect(premise.bottom, 'the premise: the card in view').toBeGreaterThan(
        CLEARANCE,
      );

      await page.waitForSelector(`section[${CURRENT}]`, {
        state: 'attached',
        timeout: 15_000,
      });
      await page.waitForFunction(() => document.readyState === 'complete');
      await page.waitForTimeout(1_500);
      await untilRested(page);

      expect(
        Math.abs((await page.evaluate(() => window.scrollY)) - read),
        'not pulled back',
      ).toBeLessThanOrEqual(2);
    } finally {
      await context.close();
    }
  });
});
