import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ALL_GLYPHS } from './all-glyphs';
import { Phone, type PhoneProps } from './Phone';

// One story per meaningful state (§13). Glyphs carry no text of their own, so
// there are no DE/pseudo-locale stress variants and no 320px tag (a ≤2rem box
// cannot reflow); the only user-facing strings here are the demo aria-labels,
// Romanian with diacritics per §15.7. Component names and the specificity
// caption are technical identifiers/developer notes — deliberately untranslated.
// The meta binds Phone (the stroke-family exemplar); Gallery walks ALL_GLYPHS
// so every folder component keeps a frozen shape in the visual net — under the
// whole-svg pattern that list is HAND-maintained (all-glyphs.ts, README §5).

const meta = {
  title: 'UI/Glyphs',
  component: Phone,
  args: { size: 'md' },
  argTypes: {
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'] satisfies NonNullable<PhoneProps['size']>[],
      description: 'Box scale — sm 1rem · md 1.5rem (default) · lg 2rem',
    },
    'aria-label': {
      control: 'text',
      description:
        'Non-empty → role="img" + this name; empty or absent → decorative (aria-hidden)',
    },
  },
} satisfies Meta<typeof Phone>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The stroke-family exemplar at rest: Phone at md, decorative, controls wired. */
export const Default: Story = {};

/**
 * The growth surface — every glyph component in the folder, labeled with its
 * import name. The baseline freezes every shape, so an accidental path edit
 * fails the visual net. A new glyph appears here ONLY via its all-glyphs.ts
 * row — the hand-list drift risk this pattern accepted (board §5·2-2).
 */
export const Gallery: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-start gap-6">
      {ALL_GLYPHS.map(([name, Glyph]) => (
        <span key={name} className="flex flex-col items-center gap-2">
          <Glyph {...args} />
          <span className="text-xs text-ink-muted">{name}</span>
        </span>
      ))}
    </div>
  ),
};

/** The three rem-based presets side by side (gap owned by the parent, §6.4). */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-end gap-4">
      <Phone {...args} size="sm" />
      <Phone {...args} size="md" />
      <Phone {...args} size="lg" />
    </div>
  ),
};

/**
 * One glyph, three grounds: the artwork paints itself with currentColor, so
 * each wrapper's text color reaches inside it with zero glyph code — the
 * mechanic every future hover fade relies on.
 */
export const CurrentColor: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <span className="text-cta">
        <Phone {...args} />
      </span>
      <span className="text-ink">
        <Phone {...args} />
      </span>
      <span className="inline-flex rounded-md bg-inverse-surface p-3 text-ink-inverse">
        <Phone {...args} />
      </span>
    </div>
  ),
};

/**
 * Sizing precedence, proven: size="lg" (2rem) inside a wrapper that says
 * [&_svg]:size-5 renders at 20px, not 32px. The wrapper uses the exact utility
 * shape composed controls use, so a parent deterministically owns its glyph's
 * geometry.
 */
export const ParentOverride: Story = {
  args: { size: 'lg' },
  render: (args) => (
    <div className="flex flex-col items-start gap-2">
      <div className="[&_svg]:size-5">
        <Phone {...args} />
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
