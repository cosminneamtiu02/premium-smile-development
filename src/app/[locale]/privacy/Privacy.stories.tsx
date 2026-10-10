import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { PrivacyPolicy } from '@/components/sections/PrivacyPolicy/PrivacyPolicy';
import { PRIVACY_MAP_ANCHOR } from '@/lib/routes/routes';
import privacyDe from '@/messages/privacy/de.json';
import privacyRo from '@/messages/privacy/ro.json';

// Pages/Privacy — the /{locale}/privacy page's TWIN. KEEP-IN-SYNC with
// ./page.tsx: that page is a Server Component no browser runner renders, so
// this story mounts the very band it returns — sections/PrivacyPolicy, the
// whole page, no props (page-twins.test.ts holds the two sources together).
// The visual matrix photographs Pages/* at all six widths (§13), in Romanian
// and in German, the longest language (§8.4).

/** The real face first — Source Serif 4 is `font-display: block`, so a play
 *  that measures before it arrives measures the fallback (PR #125's lesson). */
async function loadFace(root: HTMLElement): Promise<void> {
  const h1 = root.querySelector('h1');
  if (h1) {
    const style = getComputedStyle(h1);
    await document.fonts.load(
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      h1.textContent ?? '',
    );
  }
  await document.fonts.ready;
}

/** No width may make the page scroll sideways (§7: reflow at 320px). */
async function expectNoSidewaysScroll(): Promise<void> {
  const root = document.documentElement;
  await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
}

const meta = {
  title: 'Pages/Privacy',
  component: PrivacyPolicy,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PrivacyPolicy>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Romanian — the default locale and the reference text. */
export const Romanian: Story = {
  globals: { locale: 'ro' },
  play: async ({ canvas, canvasElement }) => {
    await loadFace(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: privacyRo.title }),
    ).toBeInTheDocument();
    // The ten parts, each an h2 — the outline a screen reader walks.
    await expect(canvas.getAllByRole('heading', { level: 2 })).toHaveLength(10);
    // The map part the note under the map links to.
    await expect(
      canvasElement.querySelector(`#${PRIVACY_MAP_ANCHOR}`),
    ).not.toBeNull();
    // The one cookie, by the name the code writes.
    await expect(canvas.getByText('NEXT_LOCALE')).toBeInTheDocument();
    await expectNoSidewaysScroll();
  },
};

/**
 * German — the expansion stress (§8.4): the longest words in the definition
 * list's labels and the longest paragraphs. Nothing may push the page
 * sideways, at any of the six widths.
 */
export const GermanStress: Story = {
  globals: { locale: 'de' },
  play: async ({ canvas, canvasElement }) => {
    await loadFace(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: privacyDe.title }),
    ).toBeInTheDocument();
    await expect(canvas.getAllByRole('heading', { level: 2 })).toHaveLength(10);
    await expectNoSidewaysScroll();
  },
};
