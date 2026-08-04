import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button, type ButtonSize, type ButtonVariant } from './Button';

// One story per meaningful state (§13). Demo values are Romanian with
// diacritics; DE-longest + pseudo-locale are dedicated stress variants
// (§15.7), both carrying the 'stress-320' tag → the visual net also samples
// them at the 320px accessibility width (§13 UI-tier opt-in).

const meta = {
  title: 'UI/Button',
  component: Button,
  args: {
    children: 'Programează o consultație',
    variant: 'solid',
    size: 'md',
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['solid', 'outline', 'ghost'] satisfies ButtonVariant[],
      description: 'Visual tone — solid CTA / outlined, fills on hover / quiet',
    },
    size: {
      control: 'radio',
      options: ['md', 'lg', 'xl'] satisfies ButtonSize[],
      description: 'Box scale — md ≥44px, lg ≥56px, xl ≥64px (hero)',
    },
    asChild: {
      control: false,
      description:
        'Render no <button> of its own — the single child element becomes the button (see AsLink)',
    },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Solid CTA — the „Programează o consultație" hero/topbar action. */
export const Default: Story = {};

/** Outlined tone — ground and label crossfade (swap colors) on hover. */
export const Outline: Story = {
  args: { variant: 'outline', children: 'Vezi serviciile' },
};

/** Quiet tone for tertiary actions. */
export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Închide' },
};

/** The three box scales side by side (gap owned by the parent, §6.4). */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-start gap-4">
      <Button {...args} size="md">
        Programează-te
      </Button>
      <Button {...args} size="lg">
        Programează-te
      </Button>
      <Button {...args} size="xl">
        Programează-te
      </Button>
    </div>
  ),
};

/** Content is a slot: partly-bold label (ANPC/ODR), color inherits on hover. */
export const PartlyBold: Story = {
  args: { variant: 'outline' },
  render: (args) => (
    <Button {...args}>
      Soluționarea <strong>online</strong> a litigiilor
    </Button>
  ),
};

/**
 * Content is a slot: graphic beside text (ANPC/SAL shape). The placeholder
 * mark draws with currentColor, so it follows the hover text crossfade exactly
 * like the label does — no coordination code anywhere.
 */
export const WithImage: Story = {
  args: { variant: 'outline' },
  render: (args) => (
    <Button {...args}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle cx="14" cy="14" r="12" fill="currentColor" opacity="0.25" />
        <circle
          cx="14"
          cy="14"
          r="7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <span>Soluționarea alternativă a litigiilor</span>
    </Button>
  ),
};

/** asChild: the nested <a> IS the button — same clothes, link behaviour. */
export const AsLink: Story = {
  args: { variant: 'outline' },
  render: (args) => (
    <Button {...args} asChild>
      <a href="#servicii">Vezi serviciile</a>
    </Button>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};

/** DE is the longest locale (§8.4) — must wrap, never overflow, at 320px too. */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  args: { children: 'Vereinbaren Sie einen Beratungstermin', size: 'xl' },
};

/**
 * Pseudo-locale (~40% expansion, accents) — hardcoded stress fixture (§15.7).
 * Runs on the OUTLINE variant so a wide label also stresses the bordered tone
 * (the a11y-audit's worst-case combination).
 */
export const PseudoLocale: Story = {
  tags: ['stress-320'],
  args: {
    variant: 'outline',
    children: '⟦Þŕöğŕämẽäžä ö ċöñšũĺţäţīẽ — ẽẋţŕä ţẽẋţ ĺũñğ⟧',
  },
};

/**
 * Hover END states, pinned as real pixels: the 'pin-hover' tag makes the
 * visual spec perform a true mouse hover before the (animation-disabled)
 * screenshot — synthetic play() events cannot activate CSS :hover.
 */
export const HoverSolid: Story = {
  tags: ['pin-hover'],
};

export const HoverOutline: Story = {
  tags: ['pin-hover'],
  args: { variant: 'outline', children: 'Vezi serviciile' },
};
