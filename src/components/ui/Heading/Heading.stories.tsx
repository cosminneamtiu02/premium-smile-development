import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Heading, type HeadingSize } from './Heading';

// One story per meaningful state (§13). Demo values are Romanian with
// diacritics — real site strings (§15.7); DE-longest and pseudo-locale are
// dedicated stress variants, both carrying the 'stress-320' tag so the visual
// net also samples them at the 320px accessibility width (§13 UI-tier opt-in;
// the tier itself is 1280-only) — SectionStep carries that tag for its own
// reason: a 30px serif line wrapping inside a 320px column.
// Three of the six stories exist to show ONE look on three different
// elements — <p>, <h2>, <a>. That decoupling is the atom's whole point, and
// "identical pixels, different element" is a claim only rendered stories can
// make honestly.
// There are deliberately NO Focus/Hover stories: the atom is non-interactive
// and owns no state styling whatsoever — the AsLink child's focus ring comes
// from the globals' :focus-visible net, which belongs to no atom.
// The href is a placeholder: the real one is a plain locale anchor built by
// localeHref() (§15.13), and it lives in the Header. An atom story composes
// atoms; it never plays a section.

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
      options: ['title', 'section'] satisfies HeadingSize[],
      description:
        "The growth axis, one step per measured consumer: 'title' = the Footer/Header treatment (font-display, text-xl, ink-strong) · 'section' = the SectionHeading step (text-3xl, same face and ink), measured 2026-09-01. Further steps ('page') join additively when real designs measure them — the default stays 'title' forever, so growth never moves an existing call site",
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
 * The second step (D2, 2026-09-01): `text-3xl` — 30px on the same display face
 * and the same ink, the size sections/SectionHeading passes. Both wrap extremes
 * share one frame, because a step shown only on its short line proves nothing
 * about the long one: the Romanian title the section opens with, and a German
 * compound that cannot break at a space (§8.4 expansion). A 30px serif compound
 * inside a 320px column is the genuine wrap case here — hence 'stress-320'.
 * The Romanian line follows the `size` control (flip it to watch the step next
 * to itself); the German line is pinned to 'section' so the comparison holds.
 * Both take the default <p> host — the story samples a SIZE, not an outline,
 * so there is no heading order for axe to score.
 * The gap belongs to this wrapper, never to the atom (§6.4).
 * lang="de" rides the prop spread onto the German <p> (fb-315): CSS
 * `hyphens: auto` picks its dictionary from the ELEMENT's language, so this
 * line breaks under German patterns while the frame stays Romanian.
 */
export const SectionStep: Story = {
  tags: ['stress-320'],
  args: { size: 'section', children: 'Vizitează clinica noastră' },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Heading {...args} />
      <Heading size="section" lang="de">
        Behandlungsschwerpunkte und Anfahrtsbeschreibung
      </Heading>
    </div>
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
