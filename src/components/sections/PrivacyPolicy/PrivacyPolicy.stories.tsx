import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import privacyDe from '@/messages/privacy/de.json';
import privacyRo from '@/messages/privacy/ro.json';
import { PrivacyPolicy } from './PrivacyPolicy';

// Sections/PrivacyPolicy — the privacy and cookie policy band (CLAUDE.md
// §15.38). It takes no props: it translates itself and reads lib/clinic, so a
// story only picks the language and the width. The visual matrix photographs
// Sections/* at 390 and 1536 (§13); the page twin, Pages/Privacy, takes all six.

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
  title: 'Sections/PrivacyPolicy',
  component: PrivacyPolicy,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PrivacyPolicy>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Romanian, the reference text, at the workbench's own width. */
export const Default: Story = {
  globals: { locale: 'ro' },
  play: async ({ canvas, canvasElement }) => {
    await loadFace(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: privacyRo.title }),
    ).toBeInTheDocument();
    await expect(canvas.getAllByRole('heading', { level: 2 })).toHaveLength(10);
    await expect(canvas.getByText('NEXT_LOCALE')).toBeInTheDocument();
    // The clinic's facts the owner has not supplied yet read as placeholders,
    // never as invented values (lib/clinic's `legal`).
    await expect(
      canvas.getAllByText(
        new RegExp(privacyRo.missing.replace(/[[\]]/g, '\\$&')),
      ).length,
    ).toBeGreaterThan(0);
    await expectNoSidewaysScroll();
  },
};

/**
 * The phone: the cookie's definition list stacks — every label OVER its value
 * below the card's `@md` step, so no phone squeezes two columns.
 */
export const Smartphone: Story = {
  globals: { locale: 'ro', viewport: { value: 'smartphone' } },
  play: async ({ canvasElement }) => {
    await loadFace(canvasElement);
    const pairs = canvasElement.querySelectorAll('#cookies dl > div');
    await expect(pairs).toHaveLength(5);
    for (const pair of pairs) {
      const [label, value] = [
        pair.querySelector('dt'),
        pair.querySelector('dd'),
      ];
      if (label === null || value === null)
        throw new Error('a pair lost its dt or dd');
      await expect(value.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        label.getBoundingClientRect().bottom - 1,
      );
    }
    await expectNoSidewaysScroll();
  },
};

/** German at the laptop — the longest language (§8.4), the labels beside their values. */
export const GermanStress: Story = {
  globals: { locale: 'de', viewport: { value: 'laptop' } },
  play: async ({ canvas, canvasElement }) => {
    await loadFace(canvasElement);
    await expect(
      canvas.getByRole('heading', { level: 1, name: privacyDe.title }),
    ).toBeInTheDocument();
    const pair = canvasElement.querySelector('#cookies dl > div');
    const label = pair?.querySelector('dt');
    const value = pair?.querySelector('dd');
    if (!label || !value) throw new Error('the first pair lost its dt or dd');
    // Beside, from the card's @md: one line, the value to the label's right.
    await expect(value.getBoundingClientRect().left).toBeGreaterThan(
      label.getBoundingClientRect().left,
    );
    await expectNoSidewaysScroll();
  },
};
