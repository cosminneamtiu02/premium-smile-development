import { expect, type Page, test } from '@playwright/test';

// THE GLOW ON THE CURRENT PRICE CARD, against the built export (owner,
// 2026-09-29 — "i need you on current prices page to add aura shadow jsut to
// currently selected/viewd price box. and on the menu of selecting the
// category. so what category card is not selected gets no aura. and aura has
// to be smooth when selected, like not sudden and upon deselect again
// smooth"). The menu card wears the header pill's lavender glow for good;
// among the eleven category cards only the one the visitor is at wears it —
// the card the menu's `aria-current="location"` link points at — fading in
// when a card becomes current and out when it stops being current. The band's
// island stamps `data-current` on that card (sections/PriceList/PriceMenu's
// THE CARD THE VISITOR IS AT) and the card's `aura="current"` shows its
// `::before` glow layer while the mark is there, on the atom's 400ms --fade
// clock (ui/Card's THE GLOW CAN FOLLOW A MARK).
//
// WHY THE BUILT EXPORT. The mark is written by the island onto cards that are
// SERVER HTML — markup React HYDRATES in the browser from the flight payload
// and never RE-renders — and that arrangement exists only here: both Vitest
// projects render the whole band client-side, the components project loads
// no stylesheet at all, and the visual net runs with
// `prefers-reduced-motion: reduce`, so nothing there can see a fade. Here the
// pages are the static files a visitor downloads, hydrated by the real
// bundle, under the shell's own stylesheet — its `scroll-padding-top`, its
// `scroll-behavior: smooth`, the glow's transition — with motion ON
// (playwright.e2e.config.ts asks for no reduced motion), so the fade really
// runs and can be caught running.
//
// Pinned, in order: the server HTML carries no mark, no stamp and no planned
// landing, every category card arrives ARMED, and no Suspense boundary splits
// the island's hydration from the cards'; at load the first category glows
// and only it; a scroll moves the glow with the menu's mark; a click moves it
// at once, the old card losing the mark before the new one gains it; the fade
// is a real 400ms transition in BOTH directions; under reduced motion the
// glow still moves, at once; and on a phone, where the menu is stacked above
// the cards, a scroll marks one card and only it. Romanian throughout; the
// load and the scroll in German too (§8.4 — the longest language: other
// words, other card heights).
//
// ── ROUND 5 (owner, the same day, 2026-09-29). "when you click on the menu om
// an item, it takes you to the item, but it also highlights it with a dark
// border. not the shadow, but a dark border. i want that removed." — so the
// focus ring is now the KEYBOARD's alone (CategoryCard.tsx's THE RING IS THE
// KEYBOARD'S), pinned below three ways: a pointer's arrival draws none, the
// keyboard's keeps it, and forced colours still paint an outline where the
// ring is hidden, because there the glow is gone. And the line that decides
// which card is current moved down to the middle of the window's clear area
// (lib/scroll-spy's THE READING LINE), so the scrolls below are aimed where a
// card's top crosses THAT line, read from the page; where each card comes to
// rest and whether a click and a scroll agree is
// tests/e2e/price-reading-line.spec.ts's.
// Nothing here is a screenshot; the assertions are DOM and computed style,
// the price-menu spec's idiom.

const MENU = '#price-categories';

/** The mark the island stamps, and the armed token that answers it — spelled
 *  here, never imported, so a silent rename in the atom fails somewhere
 *  (PriceList.test.tsx's CURRENT and SHOWN_WHILE, the same reason). */
const CURRENT = 'data-current';
const ARMED = 'data-current:before:opacity-100';

/** ui/Card's --fade clock: the glow's fade, in both directions. */
const FADE_MS = 400;

/** The menu link the fade test clicks: the fifth category, a jump away from
 *  the first, which is current at load. */
const FADE_TARGET = 4;

/** The menu link the focus-ring tests follow, by mouse, by touch and from the
 *  keyboard: the third category, whose link is on screen at load in both
 *  windows. */
const JUMP_TARGET = 2;

/** The island's stamp on a card the KEYBOARD jumped to — spelled here, never
 *  imported, CURRENT's reason. */
const ARRIVAL = 'data-arrival';

/** How long an in-page promise below may wait for the mark before it gives
 *  up and says so BY NAME — a guard, never a clock the page is timed by: on a
 *  healthy runner the mark lands within a frame of the click. */
const GUARD_MS = 5_000;

/** Every animation on the page, awaited to its last frame — one frame first,
 *  so a style change that starts a fade has been seen (ui/Card's ToneMorph
 *  settle, document-wide). Nothing on the services page animates forever,
 *  and under reduced motion the list is simply empty. */
const settle = (page: Page): Promise<void> =>
  page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
    await Promise.all(
      document.getAnimations().map((animation) => animation.finished),
    );
  });

/** Open a services page and wait until it is AT REST: the fonts in (every
 *  landing line below is measured on the final layout), the island hydrated
 *  — the first card's mark is the proof it ran, since nothing else writes it
 *  — and every animation the load started, that card's fade-in included,
 *  finished. */
async function open(page: Page, locale: string): Promise<void> {
  await page.goto(`/${locale}/services/`);
  await page.waitForSelector(MENU);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector(`section[${CURRENT}]`, { state: 'attached' });
  await settle(page);
}

/** Wait until the PAGE has stopped moving — the same scroll position for ten
 *  frames running — which is when a fragment jump's glide is over. Bounded:
 *  after GUARD_MS it returns anyway, and the assertions that follow report
 *  what they find. (Not `scrollend`: a jump that moves nothing fires none.) */
const stillPage = (page: Page): Promise<void> =>
  page.evaluate(async (guardMs) => {
    const frame = (): Promise<void> =>
      new Promise((resolve) => requestAnimationFrame(() => resolve()));
    const until = performance.now() + guardMs;
    let still = 0;
    let last = window.scrollY;
    while (still < 10 && performance.now() < until) {
      await frame();
      still = window.scrollY === last ? still + 1 : 0;
      last = window.scrollY;
    }
  }, GUARD_MS);

/** Where the price band ENDS in the served HTML: the close of the <section>
 *  that opens last before the menu's <nav> — the band root, with only <div>s
 *  between them — found by counting the <section>s nested inside it. −1 if
 *  the markup is not the shape this spec was written against. */
function endOfBand(html: string): number {
  const nav = html.indexOf('id="price-categories"');
  const start = html.lastIndexOf('<section', nav);
  if (nav < 0 || start < 0) return -1;
  const tags = /<section\b|<\/section>/g;
  tags.lastIndex = start;
  let depth = 0;
  for (let tag = tags.exec(html); tag !== null; tag = tags.exec(html)) {
    depth += tag[0] === '</section>' ? -1 : 1;
    if (depth === 0) return tag.index + tag[0].length;
  }
  return -1;
}

type State = Readonly<{
  /** The menu's fragments, in order — one per category card. */
  fragments: readonly string[];
  /** The fragment of every menu link carrying aria-current="location". */
  linked: readonly string[];
  /** The id of every element in the band that carries the mark. */
  marked: readonly string[];
  /** Every category card, in order, with its glow layer's opacity. */
  cards: readonly Readonly<{ id: string; glow: string }>[];
  /** The menu card's own box-shadow — the glow it wears for good. */
  menuShadow: string;
}>;

const readState = (page: Page): Promise<State> =>
  page.evaluate(
    ({ selector, current }) => {
      const nav = document.querySelector(selector) as HTMLElement;
      const band = nav.closest('section') as HTMLElement;
      const links = Array.from(
        nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
      );
      return {
        fragments: links.map((link) => link.hash.slice(1)),
        linked: links
          .filter((link) => link.getAttribute('aria-current') === 'location')
          .map((link) => link.hash.slice(1)),
        marked: Array.from(
          band.querySelectorAll(`[${current}]`),
          (element) => element.id,
        ),
        cards: Array.from(
          band.querySelectorAll<HTMLElement>('section[id][tabindex="-1"]'),
          (card) => ({
            id: card.id,
            glow: getComputedStyle(card, '::before').opacity,
          }),
        ),
        menuShadow: getComputedStyle(nav).boxShadow,
      };
    },
    { selector: MENU, current: CURRENT },
  );

/** Exactly one element in the band carries the mark and it is the card `id`;
 *  that card's glow layer is fully shown and every other card's fully
 *  hidden. */
function expectGlowOn(state: State, id: string): void {
  expect(state.cards).toHaveLength(11);
  expect(state.marked).toEqual([id]);
  for (const card of state.cards) {
    expect(card.glow, card.id).toBe(card.id === id ? '1' : '0');
  }
}

/** The scroll offset at which the top edge of the card the menu's `index`-th
 *  link points at reaches the READING LINE — the middle of the window's clear
 *  area, `(scroll-padding-top + innerHeight) / 2`, both read from the page.
 *  Away from the page's two ends that is where the card becomes current
 *  (lib/scroll-spy's THE READING LINE; near an end the line bends, and no
 *  test here aims there). Rounded UP, so at that offset the top has reached
 *  the line rather than stopping a fraction of a pixel short of it. The
 *  reading line's own arithmetic is never repeated here: this is the design's
 *  statement of where "current" begins, and the walk is what is under test. */
const crossingOf = (page: Page, index: number): Promise<number> =>
  page.evaluate(
    ({ selector, index }) => {
      const link = document.querySelectorAll<HTMLAnchorElement>(
        `${selector} a[href^="#"]`,
      )[index];
      const card = document.getElementById(link.hash.slice(1)) as HTMLElement;
      const padding =
        parseFloat(
          getComputedStyle(document.documentElement).scrollPaddingTop,
        ) || 0;
      const line = (padding + window.innerHeight) / 2;
      return Math.ceil(
        card.getBoundingClientRect().top + window.scrollY - line,
      );
    },
    { selector: MENU, index },
  );

/**
 * Scroll the PAGE to `to` in wheel-sized steps, one frame each — the
 * price-menu spec's stepScroll, with the last step CLAMPED so the page stops
 * exactly on `to` (where a card's top reaches the reading line, here) instead
 * of up to a step past it. `behavior: 'instant'` is load-bearing for that spec's reason: the shell
 * declares `scroll-behavior: smooth` on <html>, so a plain scrollTo would
 * animate every step. `to` may be beyond the document; the browser clamps.
 */
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

test.describe('ro/services — the page as the server sends it', () => {
  test('carries no mark, and every category card arrives ARMED — hydration-safe', async ({
    page,
  }) => {
    const html = await (await page.request.get('/ro/services/')).text();
    // The ATTRIBUTE form — the name followed by `=`, a space or the tag's
    // end — and never the class token `data-current:before:opacity-100`,
    // which every category card carries and which holds the same letters
    // followed by a colon. First on the category <section>s, then anywhere.
    expect(html).not.toMatch(/<section\b[^>]*\sdata-current(=|\s|>)/);
    expect(html).not.toMatch(/\sdata-current(=|\s|>)/);
    // The eleven category cards: the page's only <section>s that are
    // fragment targets (tabindex="-1", CategoryCard's THE CARD IS THE
    // TARGET). Each is armed — the glow waits for the mark and nothing else.
    const cards = html.match(/<section\b[^>]*\btabindex="-1"[^>]*>/g) ?? [];
    expect(cards).toHaveLength(11);
    for (const card of cards) expect(card).toContain(ARMED);
    // Nothing of round 5's either (owner 2026-09-29): no card arrives with a
    // planned landing — the island's spy writes each card's inline
    // `scroll-margin-top` after hydration — and none arrives stamped, because
    // only a keyboard's click stamps. The stamp in its ATTRIBUTE form, again:
    // every card carries the quiet ring's class token, whose
    // `not-data-[arrival=…` holds a bracket where the attribute has none.
    for (const card of cards) expect(card).not.toMatch(/\sstyle=/);
    expect(html).not.toContain('scroll-margin');
    expect(html).not.toMatch(/\sdata-arrival(=|\s|>)/);
    // ONE HYDRATION PASS for the island and the cards it marks (PriceMenu's
    // WHAT THE STAMP RELIES ON): no Suspense boundary marker — React's
    // `<!--$-->`, `<!--$?-->` or `<!--$!-->` — between the opening <main and
    // the end of the price band. A boundary there would let the island run
    // its effect before the cards are React's, and stamp a card React has
    // not yet claimed.
    const main = html.indexOf('<main');
    const bandEnd = endOfBand(html);
    expect(main).toBeGreaterThanOrEqual(0);
    expect(bandEnd).toBeGreaterThan(main);
    expect(html.slice(main, bandEnd)).not.toMatch(/<!--\$[?!]?-->/);
  });
});

for (const locale of ['ro', 'de']) {
  test.describe(`${locale}/services — the glow follows the menu's mark`, () => {
    test.beforeEach(async ({ page }) => {
      await open(page, locale);
    });

    test('at load, the first category glows and only it; the menu wears its glow for good', async ({
      page,
    }) => {
      const state = await readState(page);

      expectGlowOn(state, state.fragments[0]);
      expect(state.linked).toEqual([state.fragments[0]]);
      expect(state.menuShadow).not.toBe('none');
    });

    test('a scroll moves the glow with the menu’s mark', async ({ page }) => {
      // Down to where the fourth card's top reaches the middle of the
      // window's clear area — where the owner's round 5 says it becomes
      // current, not as it slides under the header.
      await stepScroll(page, await crossingOf(page, 3));
      await settle(page);
      const state = await readState(page);

      // The fourth card is marked and it is the card the ONE marked link
      // points at — one store, two marks; its glow is shown, the first
      // card's is gone.
      expectGlowOn(state, state.fragments[3]);
      expect(state.linked).toEqual([state.fragments[3]]);
    });
  });
}

test.describe('ro/services — the glow moves smoothly, or at once', () => {
  test('a click pins the glow at once: the old card loses the mark as the new one gains it', async ({
    page,
  }) => {
    await open(page, 'ro');

    // In ONE evaluate: watch every mark in the band, click the LAST link, and
    // stop at the first record that puts the mark on the last card. The
    // records arrive in the order the DOM changed, so the first card's
    // removal standing BEFORE the last card's arrival is the proof that no
    // moment held two marks. (`HTMLElement.click()`, not a Playwright click:
    // on the laptop the last link sits below the window, and a Playwright
    // click would scroll it into view first — moving the page, the other
    // input the mark follows, before the click this test is about.)
    const moment = await page.evaluate(
      ({ selector, current, guardMs }) =>
        new Promise<{
          first: string;
          last: string;
          order: string[];
          marked: string[];
          timedOut: boolean;
        }>((resolve) => {
          const nav = document.querySelector(selector) as HTMLElement;
          const band = nav.closest('section') as HTMLElement;
          const links = Array.from(
            nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
          );
          const first = links[0].hash.slice(1);
          const last = links[links.length - 1].hash.slice(1);
          const order: string[] = [];
          const marked = (): string[] =>
            Array.from(
              band.querySelectorAll(`[${current}]`),
              (element) => element.id,
            );
          const observer = new MutationObserver((records) => {
            for (const record of records) {
              const id = (record.target as HTMLElement).id;
              // No old value: the attribute was ADDED; an old value: REMOVED.
              order.push(`${record.oldValue === null ? '+' : '-'}${id}`);
              if (record.oldValue === null && id === last) {
                observer.disconnect();
                clearTimeout(guard);
                resolve({
                  first,
                  last,
                  order,
                  marked: marked(),
                  timedOut: false,
                });
                return;
              }
            }
          });
          // A guard, not a clock: if the mark never arrives the promise
          // still settles, and the assertions below say so by name.
          const guard = setTimeout(() => {
            observer.disconnect();
            resolve({ first, last, order, marked: marked(), timedOut: true });
          }, guardMs);
          observer.observe(band, {
            subtree: true,
            attributes: true,
            attributeFilter: [current],
            attributeOldValue: true,
          });
          links[links.length - 1].click();
        }),
      { selector: MENU, current: CURRENT, guardMs: GUARD_MS },
    );

    expect(
      moment.timedOut,
      `the mark never reached the last card: ${moment.order.join(' ')}`,
    ).toBe(false);
    expect(moment.order).toEqual([`-${moment.first}`, `+${moment.last}`]);
    expect(moment.marked).toEqual([moment.last]);
  });

  test('the fade is a real transition, in BOTH directions — the owner’s “smooth”', async ({
    page,
  }) => {
    await open(page, 'ro');

    // In ONE evaluate: watch every mark in the band, click the target's link,
    // and one frame after the mark lands on the target collect the `::before`
    // opacity transitions on the page, keyed by the card they belong to —
    // then let them finish and read where they ended. Every card that GAINS
    // the mark along the way is recorded, because that list is what a failure
    // names: a fade is CANCELLED when the card it runs on changes state again
    // before the fade is over, which here means the pin let go (PriceMenu's
    // A KNOWN LIMIT, RESOLVED — lib/scroll-spy's THE START GRACE is its fix,
    // and tests/e2e/price-reading-line.spec.ts replays the starved click), and
    // a starved runner must fail saying so, never as a bare timeout.
    const fade = await page.evaluate(
      ({ selector, current, target, guardMs }) =>
        new Promise<{
          entering: string;
          leaving: string;
          marks: string[];
          seen: { id: string; playState: string; duration: unknown }[];
          enteringGlow: string;
          leavingGlow: string;
          cancelled: boolean;
          timedOut: boolean;
        }>((resolve) => {
          const nav = document.querySelector(selector) as HTMLElement;
          const band = nav.closest('section') as HTMLElement;
          const links = Array.from(
            nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
          );
          const leaving = document.getElementById(
            links[0].hash.slice(1),
          ) as HTMLElement;
          const entering = document.getElementById(
            links[target].hash.slice(1),
          ) as HTMLElement;
          const marks: string[] = [];
          let seen: { id: string; playState: string; duration: unknown }[] = [];
          let collecting = false;
          const finish = (outcome: {
            cancelled: boolean;
            timedOut: boolean;
          }): void => {
            clearTimeout(guard);
            observer.disconnect();
            resolve({
              entering: entering.id,
              leaving: leaving.id,
              marks,
              seen,
              enteringGlow: getComputedStyle(entering, '::before').opacity,
              leavingGlow: getComputedStyle(leaving, '::before').opacity,
              ...outcome,
            });
          };
          const observer = new MutationObserver((records) => {
            for (const record of records) {
              if (record.oldValue === null) {
                marks.push((record.target as HTMLElement).id);
              }
            }
            if (collecting || !entering.hasAttribute(current)) return;
            collecting = true;
            requestAnimationFrame(() => {
              const fades = document.getAnimations().filter(
                (
                  animation,
                ): animation is CSSTransition & {
                  readonly effect: KeyframeEffect;
                } =>
                  animation instanceof CSSTransition &&
                  animation.effect instanceof KeyframeEffect &&
                  animation.effect.pseudoElement === '::before' &&
                  animation.transitionProperty === 'opacity',
              );
              seen = fades.map((animation) => ({
                id: animation.effect.target?.id ?? '',
                playState: animation.playState,
                duration: animation.effect.getTiming().duration,
              }));
              // A cancelled transition REJECTS its `finished`: that is the
              // pin letting go mid-fade, and it resolves this evaluate by name.
              Promise.all(fades.map((animation) => animation.finished)).then(
                () => finish({ cancelled: false, timedOut: false }),
                () => finish({ cancelled: true, timedOut: false }),
              );
            });
          });
          const guard = setTimeout(
            () => finish({ cancelled: false, timedOut: true }),
            guardMs,
          );
          observer.observe(band, {
            subtree: true,
            attributes: true,
            attributeFilter: [current],
            attributeOldValue: true,
          });
          links[target].click();
        }),
      {
        selector: MENU,
        current: CURRENT,
        target: FADE_TARGET,
        guardMs: GUARD_MS,
      },
    );

    expect(
      fade.timedOut,
      `the mark never reached the target: ${fade.marks.join(' → ')}`,
    ).toBe(false);
    expect(
      fade.cancelled,
      `the fade was cancelled — the pin dropped: ${fade.marks.join(' → ')}`,
    ).toBe(false);
    // Two fades and no third: the card the visitor is going to fades IN, the
    // card they left fades OUT — each on the full 400ms clock, each running.
    const byCard = new Map(fade.seen.map((entry) => [entry.id, entry]));
    expect(fade.seen).toHaveLength(2);
    expect([...byCard.keys()].sort()).toEqual(
      [fade.entering, fade.leaving].sort(),
    );
    for (const id of [fade.entering, fade.leaving]) {
      expect(byCard.get(id)?.playState, id).toBe('running');
      expect(byCard.get(id)?.duration, id).toBe(FADE_MS);
    }
    // …and where they end: the new card's glow fully shown, the old one's
    // fully gone.
    expect(fade.enteringGlow).toBe('1');
    expect(fade.leavingGlow).toBe('0');
  });

  test('reduced motion: the glow still moves — at once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, 'ro');

    // No settle anywhere after the click: the reading is taken the moment
    // the mark lands on the last card (its MutationObserver record), with no
    // frame in between — and if it never lands, the guard says so by name.
    const moved = await page.evaluate(
      ({ selector, current, guardMs }) =>
        new Promise<{
          clock: string;
          lastGlow: string;
          firstGlow: string;
          layers: number;
          timedOut: boolean;
        }>((resolve) => {
          const nav = document.querySelector(selector) as HTMLElement;
          const links = Array.from(
            nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
          );
          const first = document.getElementById(
            links[0].hash.slice(1),
          ) as HTMLElement;
          const last = document.getElementById(
            links[links.length - 1].hash.slice(1),
          ) as HTMLElement;
          const clock = getComputedStyle(first, '::before').transitionProperty;
          const read = (timedOut: boolean): void => {
            clearTimeout(guard);
            observer.disconnect();
            resolve({
              clock,
              lastGlow: getComputedStyle(last, '::before').opacity,
              firstGlow: getComputedStyle(first, '::before').opacity,
              layers: document
                .getAnimations()
                .filter(
                  (animation) =>
                    animation.effect instanceof KeyframeEffect &&
                    animation.effect.pseudoElement === '::before',
                ).length,
              timedOut,
            });
          };
          const observer = new MutationObserver(() => {
            if (last.hasAttribute(current)) read(false);
          });
          const guard = setTimeout(() => read(true), guardMs);
          observer.observe(last, {
            attributes: true,
            attributeFilter: [current],
          });
          links[links.length - 1].click();
        }),
      { selector: MENU, current: CURRENT, guardMs: GUARD_MS },
    );

    expect(moved.timedOut, 'the mark never reached the last card').toBe(false);
    // ui/Card's `motion-reduce:before:transition-none`: the layer has no
    // clock, so the glow jumps — the mark still shows, only the fade is gone.
    expect(moved.clock).toBe('none');
    expect(moved.lastGlow).toBe('1');
    expect(moved.firstGlow).toBe('0');
    expect(moved.layers).toBe(0);
  });
});

/** What the card `id` shows for its focus, read from the page: whether it
 *  holds focus and matches `:focus-visible`, its outline, its glow layer and
 *  the island's keyboard stamp. */
const ringOn = (
  page: Page,
  id: string,
): Promise<{
  focused: boolean;
  focusVisible: boolean;
  outlineStyle: string;
  outlineWidth: string;
  glow: string;
  arrival: string | null;
}> =>
  page.evaluate(
    ({ id, arrival }) => {
      const card = document.getElementById(id) as HTMLElement;
      const style = getComputedStyle(card);
      return {
        focused: document.activeElement === card,
        focusVisible: card.matches(':focus-visible'),
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        glow: getComputedStyle(card, '::before').opacity,
        arrival: card.getAttribute(arrival),
      };
    },
    { id, arrival: ARRIVAL },
  );

/** Wait until a jump to the card `id` has LANDED: the card focused through
 *  its tabindex="-1" (the browser's own fragment jump, CategoryCard's THE
 *  CARD IS THE TARGET) and marked (the island's pin) — then the page still
 *  and every fade finished. The first wait is a guard, never a clock: after
 *  GUARD_MS it fails, naming the card it waited for. */
async function jumpLanded(page: Page, id: string): Promise<void> {
  await page
    .waitForFunction(
      ({ id, current }) => {
        const card = document.getElementById(id);
        return (
          card !== null &&
          document.activeElement === card &&
          card.hasAttribute(current)
        );
      },
      { id, current: CURRENT },
      { timeout: GUARD_MS },
    )
    .catch(() => {
      throw new Error(`the jump to #${id} never landed: focused and marked`);
    });
  await stillPage(page);
  await settle(page);
}

/** The centre of the menu's `index`-th link, on screen — or a failure that
 *  says which link was not. */
async function linkCentre(
  page: Page,
  index: number,
): Promise<{ x: number; y: number }> {
  const box = await page
    .locator(`${MENU} a[href^="#"]`)
    .nth(index)
    .boundingBox();
  if (box === null) throw new Error(`menu link ${index} has no box to press`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test.describe('ro/services — the ring is the keyboard’s (owner 2026-09-29)', () => {
  // "when you click on the menu om an item, it takes you to the item, but it
  // also highlights it with a dark border. not the shadow, but a dark border.
  // i want that removed." The dark border is the shell's `:focus-visible`
  // outline on the card the jump focuses. Whether a jump's focus counts as
  // `:focus-visible` is each engine's own call: after a MOUSE press WebKit
  // says yes — that is the ring the owner saw on Safari — and Chromium says
  // no (the planner's focus probe, 2026-09-29). This suite runs Chromium, so
  // its pointer test cannot see WebKit's ring; the RULE that hides it — the
  // card's class, which hides the outline on every `:focus-visible` card the
  // keyboard did not stamp — is exercised in the third test, which stages
  // WebKit's state from the keyboard's side.

  test('a pointer draws no ring — neither a mouse press nor a tap', async ({
    page,
    browser,
  }, testInfo) => {
    await open(page, 'ro');
    const target = (
      (await page
        .locator(`${MENU} a[href^="#"]`)
        .nth(JUMP_TARGET)
        .getAttribute('href')) ?? ''
    ).slice(1);

    // A real mouse press and release on the link — the click the owner made.
    const press = await linkCentre(page, JUMP_TARGET);
    await page.mouse.move(press.x, press.y);
    await page.mouse.down();
    await page.mouse.up();
    await jumpLanded(page, target);

    // The card arrived, holds the focus and glows — and wears no outline,
    // and no stamp: a pointer's click counts itself (`detail` 1).
    expect(await ringOn(page, target)).toMatchObject({
      focused: true,
      outlineStyle: 'none',
      glow: '1',
      arrival: null,
    });

    // …and the same through a TAP, in a window that has touch.
    const context = await browser.newContext({
      viewport: page.viewportSize(),
      deviceScaleFactor: 1,
      hasTouch: true,
      baseURL: testInfo.project.use.baseURL,
    });
    try {
      const touch = await context.newPage();
      await open(touch, 'ro');
      const tap = await linkCentre(touch, JUMP_TARGET);
      await touch.touchscreen.tap(tap.x, tap.y);
      await jumpLanded(touch, target);

      expect(await ringOn(touch, target)).toMatchObject({
        focused: true,
        outlineStyle: 'none',
        glow: '1',
        arrival: null,
      });
    } finally {
      await context.close();
    }
  });

  test('the keyboard keeps its ring with the glow on — and the stamp leaves with the focus', async ({
    page,
  }) => {
    await open(page, 'ro');
    const link = page.locator(`${MENU} a[href^="#"]`).nth(JUMP_TARGET);
    const target = ((await link.getAttribute('href')) ?? '').slice(1);

    // The keyboard path: the link takes focus and Enter follows it — a click
    // whose `detail` is 0, so the island stamps the card it jumps to
    // (PriceMenu's THE RING IS THE KEYBOARD'S).
    await link.focus();
    await page.keyboard.press('Enter');
    await jumpLanded(page, target);

    // Both at once, on the one element: the ring is the card's own outline
    // (globals.css's `:focus-visible` safety net, 2px solid, 2px off the
    // edge) and the glow is its `::before` layer — the mark did not take the
    // focus indicator's place, and the focus did not take the glow's.
    expect(await ringOn(page, target)).toEqual({
      focused: true,
      focusVisible: true,
      outlineStyle: 'solid',
      outlineWidth: '2px',
      glow: '1',
      arrival: 'keyboard',
    });

    // A press on the page ground beside the band — the gutter, which nothing
    // focusable covers — takes the focus off the card, and the stamp with it.
    await page.mouse.click(
      4,
      Math.round((page.viewportSize()?.height ?? 0) / 2),
    );
    expect(await ringOn(page, target)).toMatchObject({
      focused: false,
      outlineStyle: 'none',
      arrival: null,
    });
  });

  test('forced colours paint an outline where the ring is hidden — the one mark left once the glow is gone', async ({
    page,
  }) => {
    await open(page, 'ro');
    const target = (
      (await page
        .locator(`${MENU} a[href^="#"]`)
        .nth(JUMP_TARGET)
        .getAttribute('href')) ?? ''
    ).slice(1);

    // WEBKIT'S POINTER STATE, STAGED: the card focused, `:focus-visible`, and
    // NOT stamped. Chromium never makes a pointer's arrival `:focus-visible` —
    // not in forced colours either, measured on the built page — so a mouse
    // press here would test the engine's heuristic, not this rule. A key
    // press first puts Chromium in the keyboard's modality; the card is then
    // focused from script, which no click made, so the island stamps nothing.
    await page.keyboard.press('Tab');
    await page.evaluate((id) => {
      (document.getElementById(id) as HTMLElement).focus({
        preventScroll: true,
      });
    }, target);
    expect(await ringOn(page, target)).toMatchObject({
      focused: true,
      focusVisible: true,
      arrival: null,
      // The rule at work in ordinary colours: the ring WebKit would draw for
      // a pointer is hidden.
      outlineStyle: 'none',
    });

    // Forced colours: the class's own branch is a 2px TRANSPARENT solid
    // outline, which forced colours paint in the system's colour — while
    // every box-shadow, the glow's included, is dropped.
    await page.emulateMedia({ forcedColors: 'active' });
    const forced = await page.evaluate((id) => {
      const card = document.getElementById(id) as HTMLElement;
      const style = getComputedStyle(card);
      return {
        forced: window.matchMedia('(forced-colors: active)').matches,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        glowShadow: getComputedStyle(card, '::before').boxShadow,
      };
    }, target);
    expect(forced).toEqual({
      forced: true,
      outlineStyle: 'solid',
      outlineWidth: '2px',
      glowShadow: 'none',
    });
  });
});

test.describe('ro/services on a phone — the menu stacked above the cards', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'laptop-1366x633',
      'the phone sets its own window; one project is enough to run it',
    );
    await open(page, 'ro');
  });

  test('a scroll to the third card marks the third card, and only it', async ({
    page,
  }) => {
    // Stacked: below the band's split the menu is a plain static table of
    // contents, and its box ends before the first card begins.
    const layout = await page.evaluate((selector) => {
      const nav = document.querySelector(selector) as HTMLElement;
      const link = nav.querySelector<HTMLAnchorElement>('a[href^="#"]');
      const first = document.getElementById(
        (link as HTMLAnchorElement).hash.slice(1),
      ) as HTMLElement;
      return {
        position: getComputedStyle(nav).position,
        menuBottom: nav.getBoundingClientRect().bottom,
        firstTop: first.getBoundingClientRect().top,
      };
    }, MENU);
    expect(layout.position).toBe('static');
    expect(layout.menuBottom).toBeLessThanOrEqual(layout.firstTop);

    // Down to where the third card's top reaches the middle of the window's
    // clear area — the reading line, on a phone too.
    await stepScroll(page, await crossingOf(page, 2));
    await settle(page);
    const state = await readState(page);

    expectGlowOn(state, state.fragments[2]);
    expect(state.linked).toEqual([state.fragments[2]]);
  });
});
