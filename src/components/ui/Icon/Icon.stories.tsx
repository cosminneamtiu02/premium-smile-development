import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { GLYPHS } from '@/assets/glyphs';
import { Icon, type IconName, type IconSize } from './Icon';

// One story per meaningful state (§13). Icon carries no text of its own, so
// there are no DE/pseudo-locale stress variants and no 320px tag (a ≤2rem box
// cannot reflow); the only user-facing strings here are the demo aria-labels,
// Romanian with diacritics per §15.7. Glyph names and the specificity caption
// are technical identifiers/developer notes — deliberately untranslated.

// Derived from the folder, never hand-listed: a new file in glyphs/ appears in
// the control AND in the AllGlyphs gallery by itself (plan §4a).
const GLYPH_NAMES = Object.keys(GLYPHS) as IconName[];

const meta = {
  title: 'UI/Icon',
  component: Icon,
  args: { name: 'phone', size: 'md' },
  argTypes: {
    name: {
      control: 'select',
      options: GLYPH_NAMES,
      description: 'Which glyph — one file in glyphs/; a typo cannot compile',
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'] satisfies IconSize[],
      description: 'Box scale — sm 1rem · md 1.5rem (default) · lg 2rem',
    },
    'aria-label': {
      control: 'text',
      description:
        'Non-empty → role="img" + this name; empty or absent → decorative (aria-hidden)',
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The atom at rest: the phone glyph at md, decorative, controls wired. */
export const Default: Story = {};

/**
 * The growth surface — every registry glyph, labeled with its call-site name.
 * A future glyph shows up here on its own; the baseline freezes every shape,
 * so an accidental path edit fails the visual net.
 */
export const AllGlyphs: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-start gap-6">
      {GLYPH_NAMES.map((glyph) => (
        <span key={glyph} className="flex flex-col items-center gap-2">
          <Icon {...args} name={glyph} />
          <span className="text-xs text-ink-muted">{glyph}</span>
        </span>
      ))}
    </div>
  ),
};

/** The three rem-based presets side by side (gap owned by the parent, §6.4). */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-end gap-4">
      <Icon {...args} size="sm" />
      <Icon {...args} size="md" />
      <Icon {...args} size="lg" />
    </div>
  ),
};

/**
 * One glyph, three grounds: the icon paints itself with currentColor, so each
 * wrapper's text color reaches inside it with zero icon code — the mechanic
 * every future hover fade relies on.
 */
export const CurrentColor: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <span className="text-cta">
        <Icon {...args} />
      </span>
      <span className="text-ink">
        <Icon {...args} />
      </span>
      <span className="inline-flex rounded-md bg-inverse-surface p-3 text-ink-inverse">
        <Icon {...args} />
      </span>
    </div>
  ),
};

/**
 * Sizing precedence, proven: size="lg" (2rem) inside a wrapper that says
 * [&_svg]:size-5 renders at 20px, not 32px. The wrapper uses the exact utility
 * shape composed controls use, so a parent deterministically owns its icon's
 * geometry (plan §4c).
 */
export const ParentOverride: Story = {
  args: { size: 'lg' },
  render: (args) => (
    <div className="flex flex-col items-start gap-2">
      <div className="[&_svg]:size-5">
        <Icon {...args} />
      </div>
      {/* Developer note, not site copy — untranslated on purpose. */}
      <p className="text-sm text-ink-muted">
        size=&quot;lg&quot; inside [&amp;_svg]:size-5 → 20px: the wrapper&apos;s
        descendant selector scores (0,1,1) and outranks the atom&apos;s own
        (0,1,0).
      </p>
    </div>
  ),
};

/**
 * The semantic escape hatch: an aria-label turns the decorative glyph into a
 * named image (role="img"), visible to screen readers and to axe.
 */
export const Labelled: Story = {
  args: { 'aria-label': 'Sună clinica' },
};
