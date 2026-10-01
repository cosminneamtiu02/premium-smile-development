import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import {
  Button,
  type ButtonMotion,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
} from './Button';

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
    tone: 'cta',
    motion: 'still',
    size: 'md',
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['solid', 'outline', 'ghost'] satisfies ButtonVariant[],
      description:
        'The face — solid, drains on hover / outlined, greys on hover / quiet',
    },
    tone: {
      control: 'radio',
      options: ['cta', 'accent'] satisfies ButtonTone[],
      description:
        'The colour family — cta, the green of the one conversion goal (the default) / accent, the menu buttons’ lavender (owner 2026-10-01); ghost paints with ink and ignores it',
    },
    motion: {
      control: 'radio',
      options: ['still', 'jump'] satisfies ButtonMotion[],
      description:
        'What moves on hover — still, nothing (the default) / jump, the old site’s 105 % pop on its own 200ms clock (the Hero’s pair, the doctor card’s link, the bar’s Contact — owner 2026-10-01); hover the canvas to see it',
    },
    size: {
      control: 'radio',
      options: ['md', 'lg', 'xl', 'hero'] satisfies ButtonSize[],
      description:
        'Box scale — md ≥44px, lg ≥56px, xl ≥64px, hero = the lg box to the Laptop checkpoint (1536px), scaled with the viewport from there (the Home opener’s two calls to action; see HeroSize)',
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

/** Outlined tone — greys a little on hover (ground to line-subtle, label one step darker; owner 2026-09-20), never fills. */
export const Outline: Story = {
  args: { variant: 'outline', children: 'Vezi serviciile' },
};

/** Quiet tone for tertiary actions. */
export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Închide' },
};

/**
 * The fluid size (2026-10-01, the hero-aura lane — owner: "buttons should
 * also expand retract in accord to adjusting of current tab for all screens
 * … corellated size wise in expanding or retracting", then, on the first
 * cut's 140px boxes, "horribly large … i need them raport wise as they would
 * look on 1500x1063 aproxmiatley as screen size"): the lg box — 56 / 28 /
 * 18px — up to the Laptop checkpoint, 1536px, then scaled by the viewport
 * over 1536 — 70 / 35 / 22.5px from 1920 on — the ratio the lg box makes
 * with the opener's slogan at the checkpoint, kept as both grow; on every
 * phone, the tablet and the notebook it IS lg. Both tones, the pair the Hero
 * mounts. The play reads the three measures off the engine at the width the
 * story runs — the proof the clamps parsed (an arbitrary value Tailwind
 * refused would leave the atom's base); at the UI tier's 1280 and on the
 * Vitest canvas that is the lg floor, so the growth is the Pages/Home 1920
 * frames' to show. 'stress-320': the floors, at the phone width. The gap is
 * the story's (§6.4).
 */
export const HeroSize: Story = {
  tags: ['stress-320'],
  args: { size: 'hero', children: 'Programează o consultație' },
  render: (args) => (
    <div className="flex flex-wrap items-start gap-4">
      <Button {...args} />
      <Button {...args} variant="outline">
        Vezi serviciile
      </Button>
    </div>
  ),
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', {
      name: 'Programează o consultație',
    });
    const style = getComputedStyle(button);
    const factor = Math.min(Math.max(1, window.innerWidth / 1536), 1.25);
    await expect(parseFloat(style.fontSize)).toBeCloseTo(18 * factor, 0);
    await expect(parseFloat(style.paddingLeft)).toBeCloseTo(28 * factor, 0);
    await expect(parseFloat(style.minHeight)).toBeCloseTo(56 * factor, 0);
  },
};

/** The three fixed box scales side by side (gap owned by the parent, §6.4). */
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
 * Since the 2026-09-06 mirror law, HoverSolid's END face IS the outline
 * variant's rest face (surface ground, cta label, 1px cta hairline) — if
 * that pinned frame drifts from outline's rest, the mirror broke, not just a
 * color. HoverOutline's END face is its OWN grey since 2026-09-20 (owner:
 * "gray out a little") — line-subtle ground, cta-hover label, cta border —
 * no longer solid's rest face; Button.tsx's contract carries the arithmetic.
 */
export const HoverSolid: Story = {
  tags: ['pin-hover'],
};

export const HoverOutline: Story = {
  tags: ['pin-hover'],
  args: { variant: 'outline', children: 'Vezi serviciile' },
};

/**
 * THE LAVENDER FAMILY (owner, 2026-10-01: "a set of buttons i need you to
 * make lilla, like the one that the latest menu buttons are"): the same faces
 * cut from the menu buttons' `accent` role — Button.tsx's THE TWO FAMILIES
 * carries the measured pairs. Accent is the doctor card's „Mai multe despre
 * mine" and the Hero's contact trigger; AccentOutline the Hero's „Vezi
 * serviciile" — lilac border and label on the white box.
 */
export const Accent: Story = {
  args: { tone: 'accent', size: 'lg', children: 'Mai multe despre mine' },
};

export const AccentOutline: Story = {
  args: {
    tone: 'accent',
    variant: 'outline',
    size: 'lg',
    children: 'Vezi serviciile',
  },
};

/**
 * The lavender pair's hover END states, pinned as real pixels ('pin-hover',
 * as HoverSolid/HoverOutline above): solid drains to the white face with a
 * lilac label and hairline — the owner's "when on hover it must still turn
 * white" — and outline greys, the label one step darker (accent-strong) —
 * "on hover it should still turn current slight gray".
 */
export const HoverAccent: Story = {
  tags: ['pin-hover'],
  args: { tone: 'accent', size: 'lg', children: 'Programează o consultație' },
};

export const HoverAccentOutline: Story = {
  tags: ['pin-hover'],
  args: {
    tone: 'accent',
    variant: 'outline',
    size: 'lg',
    children: 'Vezi serviciile',
  },
};

/**
 * THE JUMP (owner, 2026-10-01: "like in old webpage i want the book
 * consultation, see our services, call hover button in bottom right and
 * whatsapp button, contact button in top bar, more about me button in doctor
 * card, to have that jump at you animation on hover"): `motion="jump"`, the
 * old site's hover:scale-105 on its own 200ms ease-out clock beside the 400ms
 * colour fade (Button.tsx's THE JUMP). HOVER IT in the workbench — the net
 * runs every story under reduced motion, where the box holds still by rule,
 * so this frame would only repeat Accent's pixels: 'no-visual'.
 */
export const Jump: Story = {
  tags: ['no-visual'],
  args: {
    tone: 'accent',
    motion: 'jump',
    size: 'lg',
    children: 'Programează o consultație',
  },
};
