import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Heading, type HeadingSize, type HeadingTone } from './Heading';

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
      options: ['title', 'section', 'page', 'hero'] satisfies HeadingSize[],
      description:
        "The growth axis, one step per measured consumer: 'title' = the Footer/Header treatment (font-display, text-xl, ink-strong) · 'section' = the SectionHeading step (text-3xl, same face and ink), measured 2026-09-01 · 'page' = the page-hero step (text-4xl), measured by the 404 band 2026-09-07 · 'hero' = the fluid slogan step (clamp 32px → 72px with the viewport, /tight), measured by sections/Hero 2026-09-19. Further steps join additively when real designs measure them — the default stays 'title' forever, so growth never moves an existing call site",
    },
    tone: {
      control: 'select',
      options: [
        'default',
        'inverse',
        'inverse-stroked',
        'inverse-outlined',
      ] satisfies HeadingTone[],
      description:
        "The ink axis, orthogonal to size: 'default' = ink-strong, every title's ink · 'inverse' = ink-inverse, display text over the §15.1 scrim · 'inverse-stroked' = the same white ink, bold and tight, with the old page's 2px accent stroke behind the letterforms · 'inverse-outlined' = the plain weight with that stroke alone (the Hero's three compared faces, 2026-09-20/21). Joined with sections/Hero; the default stays 'default' forever",
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
 * The page-hero step, measured in by the 404 band (owner, 2026-09-07): 36px,
 * one additive step over 'section', same face and ink. Same dual-line shape as
 * SectionStep — the Romanian line follows the `size` control, the German line
 * is pinned to 'page' so the comparison holds; both at the default <p> host (a
 * SIZE sample, not an outline). The fixtures are the step's own measuring
 * consumer: the routed 404 headings, `404: ` prefix included, and a 36px serif
 * line in a 320px column is the wrap case — hence 'stress-320'.
 */
export const PageStep: Story = {
  tags: ['stress-320'],
  args: { size: 'page', children: '404: Această pagină nu există' },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Heading {...args} />
      <Heading size="page" lang="de">
        404: Diese Seite existiert nicht
      </Heading>
    </div>
  ),
};

/**
 * The fluid slogan step, measured in by sections/Hero (owner dispatch
 * 2026-09-19, epic #103): `clamp(2rem, 1rem + 3.5vw, 4.5rem)` — 32px at the
 * 320px stress width, ~61px at the 1280px UI-tier width, 72px from 1600px
 * on — replacing the old site's four-prefix staircase with one curve, so the
 * atom scales with the PAGE (the gutter's own licence) and never with a
 * container it cannot see. Same dual-line shape as its elders: the Romanian
 * line follows the controls, the German line is pinned to 'hero'. The fixtures
 * are the old site's own slogans. 'stress-320': a 32px serif line in a 256px
 * column is the wrap case, and the step's floor is what this width proves.
 */
export const HeroStep: Story = {
  tags: ['stress-320'],
  args: {
    size: 'hero',
    children: 'O clinică stomatologică modernă pentru toată familia',
  },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Heading {...args} />
      <Heading size="hero" lang="de">
        Eine moderne Zahnklinik für die ganze Familie
      </Heading>
    </div>
  ),
};

/**
 * The inverse ink on the ground it exists for: display text over the §15.1
 * scrim. The wrapper paints `bg-scrim` over `bg-page` — the darkest the
 * scrim ever gets on the site is the 0.55 token over a white photograph, and
 * this near-white ground is that worst case (white-on-#737373 measures
 * 4.77:1, which is why 0.55 is the locked floor). The wrapper's padding is the
 * story owning its spacing, never the atom's (§6.4). Both steps the Hero
 * uses ride here — the slogan on 'hero', a supporting line on 'section' —
 * because the axis is orthogonal and a story is where that is visible.
 */
export const InverseTone: Story = {
  tags: ['stress-320'],
  args: {
    size: 'hero',
    tone: 'inverse',
    children: 'O echipă care ascultă, pe limba ta',
  },
  render: (args) => (
    <div className="bg-page">
      <div className="flex flex-col gap-4 bg-scrim p-6">
        <Heading {...args} />
        <Heading size="section" tone="inverse" lang="de">
          Ein Team, das zuhört – in Ihrer Sprache
        </Heading>
      </div>
    </div>
  ),
};

/**
 * The old page's slogan face (owner, 2026-09-20: "the thick heading with
 * border"): bold, tight, white, a 2px accent stroke painted BEHIND the fill,
 * so every glyph keeps a defined edge over a pale photograph. Shown over the
 * §15.1 scrim like InverseTone — the solid ground axe can measure (4.77:1);
 * the Hero's own 0.40 veil sits over a photograph, which axe cannot measure,
 * and its number is recorded in Hero.tsx and §15.1's rider, not here. The
 * wrapper owns its spacing, never the atom (§6.4).
 */
export const StrokedTone: Story = {
  tags: ['stress-320'],
  parameters: {
    // axe reads `-webkit-text-stroke`'s colour as the FOREGROUND and measures
    // the lavender stroke against the ground (1.06:1) - a false positive: the
    // stroke is painted BEHIND the fill (paint-order), the letterforms the
    // visitor reads are the white ink, and InverseTone measures that ink on
    // this very ground at 4.77:1. The rule is off for this story only, the
    // reason recorded here; every other rule still runs.
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
  },
  args: {
    size: 'hero',
    tone: 'inverse-stroked',
    children: 'Tratamente realizate ca într-un studio de lux',
  },
  render: (args) => (
    <div className="bg-page">
      <div className="flex flex-col gap-4 bg-scrim p-6">
        <Heading {...args} />
        <Heading size="hero" tone="inverse-stroked" lang="de">
          Behandlungen wie in einem Luxusstudio
        </Heading>
      </div>
    </div>
  ),
};

/**
 * The stroke alone on the plain weight (owner, 2026-09-21: "the initial thin,
 * but with that border") — the Hero's third compared face, over the same
 * scrim ground as its siblings. The same axe note as StrokedTone: the checker
 * reads the stroke colour as the foreground, so its contrast rule is off for
 * this story only.
 */
export const OutlinedTone: Story = {
  tags: ['stress-320'],
  parameters: {
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } },
  },
  args: {
    size: 'hero',
    tone: 'inverse-outlined',
    children: 'Tratamente realizate ca într-un studio de lux',
  },
  render: (args) => (
    <div className="bg-page">
      <div className="flex flex-col gap-4 bg-scrim p-6">
        <Heading {...args} />
        <Heading size="hero" tone="inverse-outlined" lang="de">
          Behandlungen wie in einem Luxusstudio
        </Heading>
      </div>
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
