import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Icon } from '../Icon/Icon';
import {
  RoundButton,
  type RoundButtonSize,
  type RoundButtonVariant,
} from './RoundButton';

// One story per meaningful state (§13). Demo values are Romanian with
// diacritics (§15.7); there are no DE/pseudo-locale or 320px stress variants
// on purpose (plan D6 — the control carries no visible text and its box is a
// fixed ≤56px circle, so neither text expansion nor reflow can move it).
// The children here are real <Icon> glyphs — exactly what the footer socials
// and the floating call CTA will pass (plan D8, amended round 5). Stories may
// compose atoms; RoundButton.tsx itself never imports Icon, and its unit tests
// use a raw <svg> to keep that independence honest.
// Hrefs are placeholders: the real phone number and profile URLs arrive from
// lib/clinic.ts, the single source of NAP (§10.1), when sections get built.

const meta = {
  title: 'UI/RoundButton',
  component: RoundButton,
  args: {
    children: <Icon name="phone" />,
    'aria-label': 'Sună clinica',
    variant: 'solid',
    size: 'md',
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['solid', 'outline'] satisfies RoundButtonVariant[],
      description:
        'Named color pair — solid = filled call CTA / outline = socials, fills on hover',
    },
    size: {
      control: 'radio',
      options: ['md', 'lg'] satisfies RoundButtonSize[],
      description: 'Circle scale — md 2.75rem/44px · lg 3.5rem/56px',
    },
    'aria-label': {
      control: 'text',
      description:
        'REQUIRED (§6.3) — the control has no visible text; already-translated string',
    },
    children: {
      control: false,
      description:
        'The icon slot — always an inline SVG, normally <Icon name="…" />',
    },
    asChild: {
      control: false,
      description:
        'Render no <button> of its own — the single child element becomes the control (see AsChildTel)',
    },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof RoundButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Solid — the filled call CTA: white phone glyph on the green circle. */
export const Default: Story = {};

/** Outline — the socials tone: green glyph on surface, fills green on hover. */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: <Icon name="instagram" />,
    'aria-label': 'Deschide profilul Instagram',
  },
};

/** Both circle scales side by side (gap owned by the parent, §6.4). */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <RoundButton {...args} size="md" />
      <RoundButton {...args} size="lg" />
    </div>
  ),
};

/** asChild: the nested tel: anchor IS the circle — the floating CTA's shape. */
export const AsChildTel: Story = {
  args: { size: 'lg' },
  render: (args) => (
    <RoundButton {...args} asChild>
      <a href="tel:+40700000000">
        <Icon name="phone" />
      </a>
    </RoundButton>
  ),
};

/** asChild ×2: the footer socials — external anchors, each named in Romanian. */
export const AsChildExternal: Story = {
  args: { variant: 'outline' },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <RoundButton {...args} asChild aria-label="Deschide profilul Instagram">
        <a
          href="https://example.com/instagram"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="instagram" />
        </a>
      </RoundButton>
      <RoundButton {...args} asChild aria-label="Deschide profilul TikTok">
        <a
          href="https://example.com/tiktok"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="tiktok" />
        </a>
      </RoundButton>
    </div>
  ),
};

/** Disabled, both variants — plain-button mode (an anchor cannot be disabled). */
export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <RoundButton {...args} variant="solid" aria-label="Sună clinica">
        <Icon name="phone" />
      </RoundButton>
      <RoundButton
        {...args}
        variant="outline"
        aria-label="Deschide profilul Instagram"
      >
        <Icon name="instagram" />
      </RoundButton>
    </div>
  ),
};

/**
 * Sizing precedence in situ: an md circle keeps its glyph at 20px even when the
 * Icon asks for lg (2rem) — the circle owns its icon's geometry (plan §4c).
 */
export const IconSizePrecedence: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-2">
      <RoundButton {...args} size="md">
        <Icon name="phone" size="lg" />
      </RoundButton>
      {/* Developer note, not site copy — untranslated on purpose. */}
      <p className="text-sm text-ink-muted">
        &lt;Icon size=&quot;lg&quot;&gt; inside an md RoundButton → 20px, not
        32px: the circle&apos;s [&amp;_svg]:size-5 scores (0,1,1) and outranks
        Icon&apos;s own (0,1,0).
      </p>
    </div>
  ),
};
