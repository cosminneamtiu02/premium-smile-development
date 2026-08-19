import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Heading, type HeadingSize } from './Heading';

// One story per meaningful state (§13). Demo values are Romanian with
// diacritics — real site strings (§15.7); DE-longest and pseudo-locale are
// dedicated stress variants, both carrying the 'stress-320' tag so the visual
// net also samples them at the 320px accessibility width (§13 UI-tier opt-in;
// the tier itself is 1280-only).
// Three of the five stories exist to show ONE look on three different
// elements — <p>, <h2>, <a>. That decoupling is the atom's whole point, and
// "identical pixels, different element" is a claim only rendered stories can
// make honestly.
// There are deliberately NO Focus/Hover stories: the atom is non-interactive
// and owns no state styling whatsoever — the AsLink child's focus ring comes
// from the globals' :focus-visible net, which belongs to no atom.
// The href is a placeholder: the real locale-aware next-intl <Link> lives in
// the Header. An atom story composes atoms; it never plays a section.

const meta = {
  title: 'UI/Heading',
  component: Heading,
  args: {
    children: 'Servicii și prețuri',
    size: 'title',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['title'] satisfies HeadingSize[],
      description:
        "The growth axis, honestly one member wide today: 'title' = the Footer/Header treatment (font-display, text-xl, ink-strong). Further steps ('section', 'page') join additively when real designs measure them — the default stays 'title' so no existing call site ever moves",
    },
    asChild: {
      control: false,
      description:
        'Render no element of its own — the single child element becomes the heading (see AsHeadingElement / AsLink)',
    },
    children: {
      control: 'text',
      description: 'The finished, already-translated text (§8.1)',
    },
  },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default host: a plain <p> — the Footer's column and brand titles, which open no outline slot on purpose. */
export const Default: Story = {};

/**
 * asChild: the nested <h2> IS the heading — identical pixels to Default, plus
 * a real document outline slot. This is the shape a future SectionHeading
 * passes (it owns the level and the id; the atom owns only the size).
 * axe note: a lone <h2> satisfies heading-order — that rule scores the
 * INCREMENT between consecutive headings, and the first heading in the order
 * has none to score.
 */
export const AsHeadingElement: Story = {
  render: (args) => (
    <Heading {...args} asChild>
      <h2>Echipa noastră</h2>
    </Heading>
  ),
};

/**
 * asChild: the brand anchor IS the heading — the Header's shape, where the
 * classes sit ON the link today. Cloning them onto the child is what makes
 * that rewire byte-identical in the DOM rather than merely similar.
 */
export const AsLink: Story = {
  render: (args) => (
    <Heading {...args} asChild>
      <a href="#acasa">Premium Smile</a>
    </Heading>
  ),
};

/**
 * DE is the longest locale (§8.4) — this is the real Footer hours title: one
 * long compound word with an umlaut and no break opportunity, sampled at 320px
 * where an atom that had reserved width would overflow.
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  args: { children: 'Öffnungszeiten' },
};

/** Pseudo-locale (~40% expansion, accents) — hardcoded stress fixture (§15.7). */
export const PseudoLocale: Story = {
  tags: ['stress-320'],
  args: { children: 'Šéŕvíçíí șî þŕéțûŕí~~~' },
};
