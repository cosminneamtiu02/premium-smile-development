import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// THE central visual spec (brief §3): every built story, screenshotted at the
// widths its tier prescribes (§13). Runs against storybook-static via the
// webServer in playwright.config.ts.
//
//   UI/*       → 1280 only (+ opt-in 320 via the 'stress-320' story tag)
//   Sections/* → 390 + 1536
//   Pages/*    → 320 390 768 1280 1536 1920
//   (anything else, e.g. Fixtures/*) → 1280

const kebab = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const MATRIX: ReadonlyArray<[RegExp, number[]]> = [
  [/^UI\//, [1280]],
  [/^Sections\//, [390, 1536]],
  [/^Pages\//, [320, 390, 768, 1280, 1536, 1920]],
];
const DEFAULT_WIDTHS = [1280];

interface IndexEntry {
  type: string;
  id: string;
  title: string;
  name: string;
  tags?: string[];
}

let entries: IndexEntry[];
try {
  const index = JSON.parse(
    readFileSync('storybook-static/index.json', 'utf8'),
  ) as { entries: Record<string, IndexEntry> };
  entries = Object.values(index.entries).filter((e) => e.type === 'story');
} catch {
  throw new Error(
    'storybook-static/index.json missing — run `npm run build-storybook` first (GITHUB_SETUP §7).',
  );
}

for (const story of entries) {
  const matched = MATRIX.find(([pattern]) => pattern.test(story.title));
  let widths = matched ? matched[1] : DEFAULT_WIDTHS;
  if (story.tags?.includes('stress-320') && !widths.includes(320)) {
    widths = [...widths, 320];
  }

  test(`${story.title} › ${story.name}`, async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width ?? 0;
    test.skip(
      !widths.includes(width),
      `${story.id} is not sampled at ${width}px (tier policy §13)`,
    );

    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
    await page.waitForSelector('#storybook-root');
    // Self-hosted fonts must be painted before pixels are compared.
    await page.evaluate(() => document.fonts.ready);
    // 'pin-hover' stories snapshot their hover END state: a real mouse hover
    // (synthetic events can't activate CSS :hover) + animations disabled.
    if (story.tags?.includes('pin-hover')) {
      await page
        .locator('#storybook-root button, #storybook-root a')
        .first()
        .hover();
    }
    // 'pin-open' stories snapshot a disclosure in its OPEN state (the Header's
    // dropdown today, ContactModal next). Four things are deliberate here:
    //  · the width — the toggle only EXISTS below its own container
    //    breakpoint, so the click happens at the phone width and the project's
    //    width is restored before the shot. That is also the only real route
    //    into the wide open state (open on a phone, then rotate).
    //  · the wait BEFORE reading state — the story chunk mounts lazily, and a
    //    plain count() is a non-waiting sample that can miss the toggle
    //    entirely and skip straight to a 30s timeout.
    //  · the poll — the story's own play function clicks this same toggle, and
    //    the two orderings must both end OPEN. Clicking only a collapsed
    //    toggle and re-checking converges whichever of us goes first; a blind
    //    second click would close it and freeze a closed baseline.
    //  · the parked mouse — the pointer is left over the toggle's phone
    //    coordinates, which at 1536 sit on a nav link, and its :hover state
    //    would bake into the baseline.
    if (story.tags?.includes('pin-open')) {
      const height = testInfo.project.use.viewport?.height ?? 844;
      await page.setViewportSize({ width: 390, height });
      const toggle = page.locator('#storybook-root [aria-expanded]').first();
      await toggle.waitFor();
      await expect
        .poll(async () => {
          if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
            await toggle.click();
          }
          return toggle.getAttribute('aria-expanded');
        })
        .toBe('true');
      await page.mouse.move(0, 0);
      await page.setViewportSize({ width, height });
      // The panel's id comes from the toggle itself, so any disclosure that
      // wears aria-controls works without editing this spec.
      await page.waitForSelector(
        `#${await toggle.getAttribute('aria-controls')}`,
      );
    }
    // Baselines are organised by tier/component folders derived from the
    // story title (owner decision 2026-08-03): UI/Button › German Longest
    // → __screenshots__/ui/button/german-longest-<project>-<platform>.png
    await expect(page).toHaveScreenshot(
      [...story.title.split('/').map(kebab), `${kebab(story.name)}.png`],
      { fullPage: true },
    );
  });
}
