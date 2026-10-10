import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent } from 'storybook/test';
import { PillButton } from './PillButton';

// One story per meaningful state (§13). Demo values are Romanian with
// diacritics — the price page's own category names (§15.7); the German stress
// label and the row carry the 'stress-320' tag, so the visual net also samples
// them at the 320px accessibility width (§13 UI-tier opt-in), where a chip that
// cannot wrap must still never push the page sideways. Hrefs are placeholders:
// the price strip nests a plain <a href="#…"> through `asChild`.
//
// THE PLAYS READ THE PAINT, not only the classes: the chip's 44px floor, its
// half-circle ends and each state's colours, from the real stylesheet the
// workbench loads — the facts PillButton.test.tsx pins as tokens, shown to
// hold in the canvas the pixel net photographs. Nothing here waits for a fade:
// a story renders its state from the first frame, so no transition runs.

const meta = {
  title: 'UI/PillButton',
  component: PillButton,
  args: {
    children: 'Consultații',
    active: false,
  },
  argTypes: {
    active: {
      control: 'boolean',
      description:
        'The current choice — the lavender face, white label, and aria-current="page" (an explicit aria-current wins)',
    },
    asChild: {
      control: false,
      description:
        'Render no <button> of its own — the single child element becomes the control (see Row)',
    },
    children: {
      control: 'text',
      description: 'The label — already-translated text (§8.1)',
    },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof PillButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The pair every play reads: the chip's box and its computed style. */
const measure = (chip: HTMLElement) => ({
  box: chip.getBoundingClientRect(),
  style: getComputedStyle(chip),
});

/** A pill: at least the 44px floor (§9's aim), and ends that are half circles
 *  — `rounded-full` is a radius larger than any box, which an engine clamps
 *  to half the shorter side. */
const expectPill = async (chip: HTMLElement): Promise<void> => {
  const { box, style } = measure(chip);
  await expect(box.height).toBeGreaterThanOrEqual(44 - 0.5);
  await expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThanOrEqual(
    box.height / 2,
  );
  await expect(
    parseFloat(style.borderBottomRightRadius),
  ).toBeGreaterThanOrEqual(box.height / 2);
  await expect(style.borderTopWidth).toBe('2px');
  // The glow is worn in both states.
  await expect(style.boxShadow).not.toBe('none');
};

/** The resting paint: ink on white inside the card tint's thin edge — or, if
 *  the runner's real pointer happens to rest on the chip (a resting pointer
 *  is :hover — the house's park-the-pointer lesson), the HOVER paint the atom
 *  promises there: the same white face, the label and the edge lavender. */
const expectResting = async (chip: HTMLElement): Promise<void> => {
  const { style } = measure(chip);
  const hovered = chip.matches(':hover');
  await expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
  await expect(style.color).toBe(
    hovered ? 'rgb(116, 104, 148)' : 'rgb(43, 39, 36)',
  );
  // The tint, never the solid accent an engine without color-mix would show.
  await expect(style.borderTopColor).not.toBe('rgb(122, 109, 156)');
  await expect(style.borderTopColor).not.toBe(style.backgroundColor);
  await expect(chip).not.toHaveAttribute('aria-current');
};

/** The current paint: white on the lavender face, a lavender edge. */
const expectActive = async (chip: HTMLElement): Promise<void> => {
  const { style } = measure(chip);
  await expect(style.backgroundColor).toBe('rgb(116, 104, 148)');
  await expect(style.borderTopColor).toBe('rgb(116, 104, 148)');
  await expect(style.color).toBe('rgb(255, 255, 255)');
};

/** At rest: a white chip, ink label, the doctor card's lavender edge, the
 *  header pill's glow. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const chip = canvas.getByRole('button', { name: 'Consultații' });
    await expectPill(chip);
    await expectResting(chip);
  },
};

/** The current choice: the lavender face — ui/Button's lavender family at
 *  rest — with a white label, and aria-current="page". */
export const Active: Story = {
  args: { active: true, children: 'Endodonție' },
  play: async ({ canvas }) => {
    const chip = canvas.getByRole('button', { name: 'Endodonție' });
    await expectPill(chip);
    await expectActive(chip);
    await expect(chip).toHaveAttribute('aria-current', 'page');
  },
};

/**
 * Hover END state, pinned as real pixels: the 'pin-hover' tag makes the visual
 * spec perform a true mouse hover before the (animation-disabled) screenshot —
 * synthetic play() events cannot activate CSS :hover. What lands is the label
 * and the edge in the lavender, on the same white face. The play reads the
 * resting state only, for that reason.
 */
export const Hover: Story = {
  tags: ['pin-hover'],
  args: { children: 'Protetică' },
  play: async ({ canvas }) => {
    await expectPill(canvas.getByRole('button', { name: 'Protetică' }));
  },
};

/**
 * The keyboard state, pinned as real pixels: a play-function Tab press makes
 * :focus-visible genuinely match, so the per-story axe pass and the visual
 * baseline both render the 2px offset ring — a pill of its own, because an
 * outline follows `border-radius`.
 */
export const FocusVisible: Story = {
  args: { children: 'Ortodonție' },
  play: async ({ canvas }) => {
    await userEvent.tab();
    const chip = canvas.getByRole('button', { name: 'Ortodonție' });
    await expect(chip).toHaveFocus();
    const { style } = measure(chip);
    await expect(style.outlineStyle).toBe('solid');
    await expect(style.outlineWidth).toBe('2px');
    await expect(style.outlineOffset).toBe('2px');
  },
};

/**
 * German, the longest language (§8.4) — „Kieferorthopädie", the real tariff's
 * longest single word. A chip never wraps (the strip it lives in scrolls
 * sideways instead), so the 320 frame is the proof that one chip alone still
 * fits the narrowest phone.
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  globals: { locale: 'de' },
  args: { children: 'Kieferorthopädie' },
  play: async ({ canvas, canvasElement }) => {
    const chip = canvas.getByRole('button', { name: 'Kieferorthopädie' });
    await expectPill(chip);
    // ONE line: the box is exactly the floor, never a wrapped lozenge.
    await expect(measure(chip).box.height).toBeLessThanOrEqual(44 + 0.5);
    await expect(measure(chip).style.whiteSpace).toBe('nowrap');
    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

/**
 * The consumption shape — a ROW of chips in a horizontal scroller, the third
 * one current, each an <a href> through `asChild` (the price strip's own
 * markup, in miniature). The scroller is the story's, not the atom's: its
 * padding leaves the glow its 14px above, 30px below and 22px sideways, which
 * is the room any scroller that clips must leave round a row of chips.
 */
export const Row: Story = {
  tags: ['stress-320'],
  render: (args) => (
    <ul className="flex items-center gap-3 overflow-x-auto px-6 pt-4 pb-8">
      {[
        'Consultații',
        'Endodonție',
        'Protetică',
        'Ortodonție',
        'Estetică dentară',
        'Chirurgie',
      ].map((name, index) => (
        <li key={name}>
          <PillButton
            {...args}
            asChild
            active={index === 2}
            aria-current={index === 2 ? 'location' : undefined}
          >
            <a href={`#categorie-${index}`}>{name}</a>
          </PillButton>
        </li>
      ))}
    </ul>
  ),
  play: async ({ canvas, canvasElement }) => {
    const links = canvas.getAllByRole('link');
    await expect(links).toHaveLength(6);
    for (const [index, link] of links.entries()) {
      await expectPill(link);
      if (index === 2) {
        await expectActive(link);
        await expect(link).toHaveAttribute('aria-current', 'location');
      } else {
        await expectResting(link);
      }
    }
    // The row scrolls sideways inside its own box — never the page.
    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};
