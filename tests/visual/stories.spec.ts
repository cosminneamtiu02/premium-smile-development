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
    await expect(page).toHaveScreenshot(`${story.id}.png`, { fullPage: true });
  });
}
