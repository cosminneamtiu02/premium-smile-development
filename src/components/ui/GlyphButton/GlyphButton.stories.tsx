import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Icon } from '../Icon/Icon';
import {
  GlyphButton,
  type GlyphButtonShape,
  type GlyphButtonSize,
  type GlyphButtonVariant,
} from './GlyphButton';

// One story per meaningful state (§13). Demo values are Romanian with
// diacritics (§15.7); there are no DE/pseudo-locale or 320px stress variants
// on purpose (plan D6 — the control carries no visible text and its box is a
// fixed ≤56px square, so neither text expansion nor reflow can move it).
// The children here are real <Icon> glyphs — exactly what the footer socials
// and the floating call CTA will pass (plan D8, amended round 5). Stories may
// compose atoms; GlyphButton.tsx itself never imports Icon, and its unit tests
// use a raw <svg> to keep that independence honest. The one exception is the
// burger below: a deliberately BESPOKE inline svg, kept out of the glyph
// registry because the Header will replace it with the animated morph version.
// Hrefs are placeholders: the real phone number and profile URLs arrive from
// lib/clinic.ts, the single source of NAP (§10.1), when sections get built.

const meta = {
  title: 'UI/GlyphButton',
  component: GlyphButton,
  args: {
    children: <Icon name="phone" />,
    'aria-label': 'Sună clinica',
    variant: 'solid',
    shape: 'round',
    size: 'md',
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['solid', 'outline', 'ghost'] satisfies GlyphButtonVariant[],
      description:
        'Named color pair — solid = filled call CTA / outline = socials, fills on hover / ghost = quiet, dim tray on hover',
    },
    shape: {
      control: 'radio',
      options: ['round', 'square'] satisfies GlyphButtonShape[],
      description:
        'Geometry only — round = the circle (phone, socials) / square = 6px radius (the Header burger)',
    },
    size: {
      control: 'radio',
      options: ['md', 'lg'] satisfies GlyphButtonSize[],
      description: 'Box scale — md 2.75rem/44px · lg 3.5rem/56px',
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
} satisfies Meta<typeof GlyphButton>;

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

/**
 * Ghost — the quiet tone: nothing at all at rest, a dim tray fading in on
 * hover (`bg-line-subtle`, byte-parity with Button's ghost so the two atoms
 * speak one ghost language). Transparent at rest means the PARENT owns the
 * rest contrast: light grounds only.
 */
export const Ghost: Story = {
  args: { variant: 'ghost' },
};

/**
 * SquareGhost — THE Header burger cell of the D2 grid: same ghost bundle, same
 * 44px box as its round siblings, only the radius differs (6px, §15.1).
 * The glyph is a BESPOKE inline svg on purpose and stays out of the Icon
 * registry: the real one ships with the Header section (D12) as an
 * aria-expanded-driven animated morph. This atom only enables that — it
 * guarantees `group` on its root and holds no state of its own.
 * Two rules travel with this cell into the Header dossier (G2 a11y,
 * 2026-08-06): keep ONE state-invariant label + aria-expanded (no
 * Deschide/Închide label swapping, no aria-haspopup — the nav panel is a
 * disclosure, not a menu widget), and the morph SVG brings its OWN
 * motion-reduce guard — the atom's transition-none never reaches the
 * parent's transforms.
 */
export const SquareGhost: Story = {
  args: {
    variant: 'ghost',
    shape: 'square',
    'aria-label': 'Deschide meniul',
    children: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        strokeWidth={2}
        strokeLinecap="round"
      >
        <path d="M4 6h16" stroke="currentColor" fill="none" />
        <path d="M4 12h16" stroke="currentColor" fill="none" />
        <path d="M4 18h16" stroke="currentColor" fill="none" />
      </svg>
    ),
  },
};

/** Both box scales side by side (gap owned by the parent, §6.4). */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <GlyphButton {...args} size="md" />
      <GlyphButton {...args} size="lg" />
    </div>
  ),
};

/** asChild: the nested tel: anchor IS the circle — the floating CTA's shape. */
export const AsChildTel: Story = {
  args: { size: 'lg' },
  render: (args) => (
    <GlyphButton {...args} asChild>
      <a href="tel:+40700000000">
        <Icon name="phone" />
      </a>
    </GlyphButton>
  ),
};

/** asChild ×2: the footer socials — external anchors, each named in Romanian. */
export const AsChildExternal: Story = {
  args: { variant: 'outline' },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <GlyphButton {...args} asChild aria-label="Deschide profilul Instagram">
        <a
          href="https://example.com/instagram"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="instagram" />
        </a>
      </GlyphButton>
      <GlyphButton {...args} asChild aria-label="Deschide profilul TikTok">
        <a
          href="https://example.com/tiktok"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="tiktok" />
        </a>
      </GlyphButton>
    </div>
  ),
};

/** Disabled, both variants — plain-button mode (an anchor cannot be disabled). */
export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <GlyphButton {...args} variant="solid" aria-label="Sună clinica">
        <Icon name="phone" />
      </GlyphButton>
      <GlyphButton
        {...args}
        variant="outline"
        aria-label="Deschide profilul Instagram"
      >
        <Icon name="instagram" />
      </GlyphButton>
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
      <GlyphButton {...args} size="md">
        <Icon name="phone" size="lg" />
      </GlyphButton>
      {/* Developer note, not site copy — untranslated on purpose. */}
      <p className="text-sm text-ink-muted">
        &lt;Icon size=&quot;lg&quot;&gt; inside an md GlyphButton → 20px, not
        32px: the circle&apos;s [&amp;_svg]:size-5 scores (0,1,1) and outranks
        Icon&apos;s own (0,1,0).
      </p>
    </div>
  ),
};
