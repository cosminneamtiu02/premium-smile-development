import { expect, type Page, test } from '@playwright/test';

// THE PHONE GUTTER on the BUILT export (2026-10-09, CLAUDE.md §15.35; the
// rule lives in ui/Container's header, THE PHONE GUTTER). The owner, verbatim:
// "i want that space to remain but to be like 50% thinner … so that they
// cover the recovered space in width. this must be done only on phones."
// Container.test.tsx measures the clamp on a bare box; this spec measures it
// where the owner looks — every page type, every band's column, the top bar
// and the footer — on phones (HALF: 5vw a side, up to a 480px window), on
// the ramp to the old gutter (480–600), and on every tablet and wider
// (UNCHANGED: 10vw — the iPad mini's 744 among them, the case that moved the
// ramp below 600), plus the two side effects the lane found and handled: the
// logo's phone size on the largest iPhones (sections/Wordmark's `@max-md`
// step) and a sideways scroll during the course timeline's forward
// animation (the belt — sections/DoctorProfile's since 2026-10-13, when the
// courses joined the biography's band; sections/DoctorCourses' until then).

const PAGES = [
  '/ro/',
  '/de/',
  '/ro/services/',
  '/ro/team/',
  '/ro/team/malea-sabau-oana-bianca/',
  '/ro/404/',
] as const;

/** §7's phone widths and the common ones between them: 320 (the stress
 *  width) up to 440 (the largest iPhone). */
const PHONES = [320, 360, 375, 390, 412, 430, 440] as const;

/** The narrowest tablet held upright (a 7″ Android), the iPad mini, §7's
 *  Tablet and a 1024 touch screen: the gutter they were drawn with. */
const WIDER = [600, 744, 768, 1024] as const;

/** The logo's mark at each size (sections/Wordmark, THE OWNER'S SIZES). */
const MARK = { phone: 24.47, full: 55.08 } as const;

// A PHONE: touch and overlay scrollbars, so a column is the window less its
// two gutters and nothing else (a desktop window this narrow would reserve a
// classic scrollbar's 15px).
test.use({ isMobile: true, hasTouch: true });

// These blocks set their own windows; one project is enough.
test.beforeEach(({}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'laptop-1366x633',
    'this spec sets its own windows; one project is enough',
  );
});

async function openAt(page: Page, path: string, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 844 });
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
}

/** Every box that wears the gutter — the Header pill (it imports the
 *  constant), ui/Container's columns in <main> and the Footer's — by kind,
 *  with its distance to each edge of the window; the page's sideways
 *  overflow; and the logo's two marks (the home link's picture, in the bar
 *  and in the footer). */
async function read(page: Page, home: string) {
  return page.evaluate((homeHref) => {
    const width = window.innerWidth;
    const box = (kind: 'bar' | 'band' | 'footer') => (el: Element) => {
      const r = el.getBoundingClientRect();
      return { kind, left: r.left, right: width - r.right };
    };
    // `body > header`: the shell mounts the bar as a body-level sibling
    // (Header.tsx's mount contract); the contact dialog has a <header> too.
    const boxes = [
      ...[...document.querySelectorAll('body > header')].map(box('bar')),
      ...[...document.querySelectorAll('main [class*="mx-[clamp("]')].map(
        box('band'),
      ),
      ...[...document.querySelectorAll('footer [class*="mx-[clamp("]')].map(
        box('footer'),
      ),
    ];
    const marks = [
      ...document.querySelectorAll(`a[href="${homeHref}"] img`),
    ].map((img) => img.getBoundingClientRect().height);
    return {
      width,
      boxes,
      marks,
      sideways:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    };
  }, home);
}

type Shape = Awaited<ReturnType<typeof read>>;

/** The window is the one asked for, and every kind of gutter box is there:
 *  one top bar, at least one band, at least one footer column. */
function expectEveryKind(shape: Shape, width: number): void {
  expect(shape.width).toBe(width);
  const count = (kind: string) =>
    shape.boxes.filter((b) => b.kind === kind).length;
  expect(count('bar'), 'the top bar').toBe(1);
  expect(count('band'), 'the bands').toBeGreaterThanOrEqual(1);
  expect(count('footer'), 'the footer').toBeGreaterThanOrEqual(1);
}

function expectGutter(shape: Shape, gutter: number): void {
  for (const box of shape.boxes) {
    expect(box.left, `${box.kind}, left`).toBeCloseTo(gutter, 1);
    expect(box.right, `${box.kind}, right`).toBeCloseTo(gutter, 1);
  }
  expect(shape.sideways, 'sideways scroll').toBeLessThanOrEqual(0);
}

const homeOf = (path: string): string => `/${path.split('/')[1]}/`;

for (const path of PAGES) {
  test.describe(`${path} — the gutter`, () => {
    for (const width of PHONES) {
      test(`a ${width}px phone: HALF — 5vw a side on every band, the top bar and the footer; the phone logo; no sideways scroll`, async ({
        page,
      }) => {
        await openAt(page, path, width);
        const shape = await read(page, homeOf(path));
        expectEveryKind(shape, width);
        // 5vw — at 320 the 1rem floor meets it exactly (16px).
        expectGutter(shape, width * 0.05);
        // The bar's and the footer's logo stay the phone size on EVERY phone
        // — the pill grew by a tenth of the window, and `@max-md` keeps the
        // 430 / 440 iPhones from drawing the 55px desktop mark.
        expect(shape.marks).toHaveLength(2);
        for (const mark of shape.marks) expect(mark).toBeCloseTo(MARK.phone, 1);
      });
    }

    test('a 540px window, on the ramp: 30vw − 7.5rem a side (42px)', async ({
      page,
    }) => {
      await openAt(page, path, 540);
      const shape = await read(page, homeOf(path));
      expectEveryKind(shape, 540);
      expectGutter(shape, 0.3 * 540 - 120);
    });

    for (const width of WIDER) {
      test(`a ${width}px touch screen: UNCHANGED — 10vw a side, the full logo`, async ({
        page,
      }) => {
        await openAt(page, path, width);
        const shape = await read(page, homeOf(path));
        expectEveryKind(shape, width);
        expectGutter(shape, width * 0.1);
        expect(shape.marks).toHaveLength(2);
        for (const mark of shape.marks) expect(mark).toBeCloseTo(MARK.full, 1);
      });
    }
  });
}

/** The courses' rhythm, KEEP-IN-SYNC with sections/DoctorCourses'
 *  COURSES_INTERVAL_MS — spelled here because this suite reads the built
 *  page and imports nothing from src. */
const COURSES_INTERVAL_MS = 3_000;

test.describe('the course timeline comes forward without a sideways scroll', () => {
  // The lit idea scales 1.04 and overshoots ~1.06 for a few frames each time
  // the automatic cycle lights it (sections/DoctorCourses/CourseTimeline.tsx),
  // growing to the right: on a phone the ideas stack column-wide, so the
  // overshoot pokes ~2.7–3.7px past the halved phone gutter, and the band's
  // full-bleed outer — sections/DoctorProfile's since 2026-10-13, when the
  // courses joined the biography's band — wears an `overflow-x-clip` belt.
  // Motion ON here (no reduced-motion emulation): the animation IS the case.
  // Since the highlight follows a CLOCK, not the scroll (the owner,
  // 2026-10-13: "the scrolll highiight has to be automatic now"), the walk
  // first waits for the island's FIRST light (it lands at mount, below the
  // fold, and holds there — the off-screen hold), brings the courses into
  // view instantly (the site's smooth scrolling would make it a glide), times
  // the cycle lighting the NEXT idea — a full interval after they arrive —
  // and samples every frame of that idea's forward motion. Reading the lit
  // idea before the first light had landed made the walk vacuous: `null`,
  // then idea 1 a few milliseconds later, "changed" with no clock involved
  // (G2 typescript M1, react L1 — 20 of 21 runs measured that way).
  for (const width of [320, 390, 430] as const) {
    test(`a ${width}px phone, every frame`, async ({ page }) => {
      test.setTimeout(60_000);
      await openAt(page, '/ro/team/malea-sabau-oana-bianca/', width);
      await page.waitForFunction(
        () => document.querySelector('main li[data-current]') !== null,
        null,
        { timeout: 10_000 },
      );
      const walk = await page.evaluate(async () => {
        const root = document.documentElement;
        const title = [...document.querySelectorAll('h2')].find((h) =>
          /Cursuri/.test(h.textContent ?? ''),
        );
        const courses = title?.closest('section');
        if (!courses) return null;
        const ideas = [...courses.querySelectorAll('li')];
        const litIdea = (): Element | null =>
          courses.querySelector('[data-current]');
        const indexOf = (idea: Element | null): number =>
          idea === null ? -1 : ideas.indexOf(idea as HTMLLIElement);
        // THE PREMISE: the courses start below the fold, so the cycle is
        // HELD and the next light can only come after they arrive.
        const offAtLoad =
          courses.getBoundingClientRect().top >= window.innerHeight;
        const before = litIdea();
        courses.scrollIntoView({ block: 'center', behavior: 'instant' });
        const arrived = performance.now();
        // Bounded, so a stopped cycle fails here rather than hanging the run.
        const deadline = arrived + 10_000;
        while (litIdea() === before && performance.now() < deadline) {
          await new Promise(requestAnimationFrame);
        }
        const waited = performance.now() - arrived;
        const after = litIdea();
        let sideways = Number.NEGATIVE_INFINITY;
        let peak = Number.NEGATIVE_INFINITY;
        let lit = 0;
        // Every frame of the forward motion: 450ms, sampled for 900.
        const end = performance.now() + 900;
        while (performance.now() < end) {
          await new Promise(requestAnimationFrame);
          sideways = Math.max(sideways, root.scrollWidth - root.clientWidth);
          const idea = litIdea();
          if (idea) {
            lit++;
            peak = Math.max(
              peak,
              idea.getBoundingClientRect().right - window.innerWidth,
            );
          }
        }
        return {
          offAtLoad,
          count: ideas.length,
          before: indexOf(before),
          after: indexOf(after),
          waited,
          sideways,
          peak,
          lit,
        };
      });
      expect(walk, 'the courses region').not.toBeNull();
      if (walk === null) return;
      // Never vacuous: the courses started held below the fold with an idea
      // lit, the cycle moved on BY ITSELF to the very next idea a full
      // interval after they arrived, an idea was lit through the whole
      // sample, and its forward peak really did pass the screen's edge — the
      // belt was exercised, not merely present.
      expect(walk.offAtLoad, 'the courses start below the fold').toBe(true);
      expect(walk.before, 'an idea lit before the walk').toBeGreaterThanOrEqual(
        0,
      );
      expect(walk.after, 'the cycle lit the next idea').toBe(
        (walk.before + 1) % walk.count,
      );
      expect(
        walk.waited,
        'a full interval after arriving',
      ).toBeGreaterThanOrEqual(COURSES_INTERVAL_MS - 250);
      expect(walk.lit).toBeGreaterThan(0);
      expect(walk.peak, 'the forward peak past the edge').toBeGreaterThan(0);
      expect(walk.sideways, 'sideways scroll at any frame').toBeLessThanOrEqual(
        0,
      );
    });
  }
});
