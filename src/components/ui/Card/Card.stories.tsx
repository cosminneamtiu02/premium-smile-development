import type { ReactElement, ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Container } from '../Container/Container';
import { Heading } from '../Heading/Heading';
import { Text } from '../Text/Text';
import { Card, type CardTone } from './Card';

// SIX stories, and the count is the honest one: the four tones, the two
// elements a real consumer slots into (an <article>, a list of <li>), the glow,
// and the German stress width. The export NAMES are load-bearing — each one
// names a baseline file (`ui-card--default`, `ui-card--in-a-grid`, …), so
// renaming or adding an export re-records pictures; this list IS the atom's
// contribution to the lane's visual manifest.
//
// ── SIX, NOT SEVEN: there is deliberately NO PseudoLocale story, the
// ui/Container and sections/Wordmark precedent for the same reason — this
// component renders no translated string of its own and reads no message key
// (§8.1: children arrive finished). Flip the locale toolbar to Pseudo and
// nothing here may change; that is the §8.9 sweep passing, not a gap. Text
// expansion is a concern for whatever rides INSIDE the card, which is exactly
// what GermanLongest photographs.
//
// ── EVERY STORY RENDERS THE CARD INSIDE THE PAGE-BAND RECIPE (the standing
// law in Container.tsx's header): a semantic full-bleed <section> that PAINTS,
// a <Container> that measures the column and carries the band's own `py-10`.
// That frame is not decoration — a Card applies inline-size containment (D10),
// so it must always sit in a width-giving parent; photographing one in a bare
// canvas would show a box sized by a rule the atom does not actually use.
// `layout: 'fullscreen'` is load-bearing for the same reason as in
// Container.stories: Storybook's default canvas padding would falsify the band.
//
// ── HOW TO READ THE FRAMES: `UI/*` routes to 1280 (§13); the 'stress-320' tag
// adds the accessibility width (§7/§9) to Default, InAGrid and GermanLongest —
// the three whose layout actually has something to say there (a card at a
// 256px column, a three-track grid collapsing to one, a German compound that
// must break rather than push the border).
//
// Demo copy is Romanian with diacritics (§15.7) and factual — no superlatives,
// no promotions, no result guarantees (CMSR advertising rules for dental
// practices, in force since 2025-07-01). Prices are illustrative fixtures, not
// the clinic's list: the real numbers are the owner's to author (§15.17).
//
// THE CONTROLS, AND WHERE THEY ARE DEAD ON PURPOSE. The `children` control
// feeds the demo BODY LINE rather than the card's own children (the
// Container.stories convention), so it is live in exactly the three stories
// whose fixture reads it: Default, WithAura and GermanLongest. AsArticle,
// InAGrid and Tones compose fixed JSX children — which win over a spread
// `children` prop — so their `children` control is switched OFF rather than
// left as a knob that silently does nothing; Tones switches `tone` off too,
// because it pins one tone per card, which is the entire subject of that
// frame. A control that cannot move its story is worse than a missing one.

const Band = ({
  paint = 'bg-page',
  children,
}: {
  /** The band's own full-bleed paint (recipe rule 1) — the two semantic
   *  surfaces a band may wear, spelled as a union so a story cannot pass a
   *  primitive or a class Tailwind never sees. */
  paint?: 'bg-page' | 'bg-surface';
  children: ReactNode;
}): ReactElement => (
  <section className={paint}>
    <Container className="py-10">{children}</Container>
  </section>
);

/** The tone control's options, derived from a keyed object rather than typed
 *  as an array: `satisfies { [K in CardTone]: K }` refuses to compile while a
 *  member is MISSING — which a `satisfies CardTone[]` array (Heading.stories'
 *  shape) cannot see, it only catches a wrong one — and, being keyed by the
 *  union with each value pinned to its OWN key, it also refuses
 *  `{ surface: 'tinted' }`, which the looser `Record<CardTone, CardTone>` had
 *  allowed. The next situation therefore reaches the panel in the same commit
 *  that adds its row, spelled as itself. */
const TONE_OPTIONS = {
  surface: 'surface',
  tinted: 'tinted',
  emphasized: 'emphasized',
  framed: 'framed',
} satisfies { [K in CardTone]: K };

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: { layout: 'fullscreen' },
  args: {
    tone: 'surface',
    aura: false,
    children: 'Evaluare completă a danturii și plan de tratament.',
  },
  argTypes: {
    tone: {
      control: 'select',
      options: Object.values(TONE_OPTIONS),
      description:
        'Named SITUATIONS, never CSS knobs: surface = the default card on a page band (border-line-subtle on bg-surface) · tinted = the quiet card that sits ON a surface band (transparent border, bg-page) · emphasized = the highlighted row (accent-decorative fill + border colour) · framed = the old site’s review-card frame, 3px of accent-decorative on surface paint (owner fb-423). Every row spends the same 25px per side on border width + padding — 1 + 24, or 3 + 22 for framed — so switching tone never moves content by a pixel',
    },
    aura: {
      control: 'boolean',
      description:
        'The lavender glow the Header pill and the corner discs wear (shadow-aura, mixed from --accent-decorative). A prop by owner decision (fb-378/381): it is chosen per card KIND in the section that composes it, never per instance and never by the atom',
    },
    asChild: {
      control: false,
      description:
        'Render no element of its own — the single child element you nest becomes the card and keeps its own attributes and classes (see AsArticle / InAGrid). Not a live control: every story here composes a MULTI-element fixture, and a text or multi-element child cannot be slotted — ui/slot.ts throws a Card-named error instead of guessing',
    },
    children: {
      control: 'text',
      description:
        'Finished, already-translated content (§8.1) — a section passes composed children; the card never reads a message key. In these stories the control feeds the demo BODY line (each fixture composes its own heading and price row), and it is live only where a fixture reads it: Default, WithAura, GermanLongest',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The services-card shape, shared by Default and WithAura so the glow is the
 *  only difference between their two pictures. */
const renderServiceTier: NonNullable<Story['render']> = ({
  children,
  ...args
}) => (
  <Band>
    <Card {...args}>
      <Heading size="title" asChild>
        <h3>Ședință de consultație</h3>
      </Heading>
      {/* `flex-1` on the BODY is the §8.4 mechanism the atom deliberately does
          not own: the growing child absorbs the slack, which pins the price
          line to the bottom of every card in a row however long the text runs
          (InAGrid photographs that at three lengths at once). */}
      <Text tone="muted" className="flex-1">
        {children}
      </Text>
      <Text bold>de la 150 lei</Text>
    </Card>
  </Band>
);

/**
 * The default surface in its natural habitat: one card in a band column, tone
 * and aura live on the controls.
 *
 * **1280 (the `UI/*` tier width):** the card fills the 1024px column — width is
 * the parent's, always (D3) — and shows the whole definition at rest: the 1px
 * `line-subtle` border on `surface` paint, the 6px radius (§15.1's default),
 * the `p-6` inset and the inner column's rhythm between heading, body and
 * price.
 *
 * **320 (`stress-320`, §7/§9):** the same card in a 256px column, with the
 * padding intact and no horizontal scrolling — the width the atom is *not*
 * allowed to fight.
 *
 * What the picture does NOT show is as decided as what it does: the paint
 * behind the card and the band's vertical rhythm belong to the `<section>` and
 * the `<Container>`, never to the atom.
 */
export const Default: Story = {
  tags: ['stress-320'],
  render: renderServiceTier,
};

/**
 * `asChild` onto the consumer's own `<article>` — the team-card shape. The
 * look lands on the element the SECTION chose, so the article keeps its
 * `aria-labelledby` wiring and the heading it points at (D2); there is no
 * wrapper div anywhere in the tree.
 *
 * The avatar is an initials disc rather than a photo on purpose: no team
 * photography exists in the repo yet, and a card story must never wait on an
 * asset. It is `aria-hidden` because the name right beside it is the accessible
 * one — a screen reader announcing "AP" before "Dr. Ana Popescu" would be
 * noise, not information.
 *
 * The role line separates with a COMMA, not a middle dot: screen readers speak
 * "·" by name, while a comma becomes the pause a sighted reader sees
 * (§15.14's `common.language.switch` precedent). Future card lanes copy this
 * fixture — so the fixture has to be right.
 */
export const AsArticle: Story = {
  // The fixture's JSX children win over the spread `children` prop, so the
  // control would move nothing — off, not silently inert.
  argTypes: { children: { control: false } },
  render: (args) => (
    <Band>
      <Card {...args} asChild>
        <article aria-labelledby="card-echipa-ana">
          <p
            aria-hidden
            className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-decorative/20 font-display text-xl"
          >
            AP
          </p>
          <Heading size="title" asChild>
            <h3 id="card-echipa-ana">Dr. Ana Popescu</h3>
          </Heading>
          <Text tone="muted">Medic stomatolog, ortodonție</Text>
          <Text>
            Consultații și tratamente ortodontice pentru copii și adulți.
          </Text>
        </article>
      </Card>
    </Band>
  ),
};

/**
 * THE proof frame for the two axes the atom refuses to own. Three cards of
 * deliberately uneven body length (one line, three, five) sit in one grid row:
 *
 * · **height** comes from the grid — `align-items: stretch` is its default, so
 *   all three boxes match the tallest without any `min-h` prop (D4);
 * · **the price line holds the baseline** because `flex-1` on each body
 *   absorbs the slack — the §8.4 mechanism, doing the job a `minHeight` prop
 *   would freeze at one language's number.
 *
 * `asChild` makes each card the `<li>` itself, so the list keeps its semantics
 * — a screen reader still announces "list, 3 items". `role="list"` is
 * redundant in the SPEC and load-bearing in WebKit (the ui/SpeedDial
 * precedent, configured as an exception in eslint.config.mjs): Safari drops
 * list semantics from any list styled `list-style: none`, which Tailwind's
 * preflight sets on every `<ul>` in the project.
 *
 * At 1280 the `@3xl` step — measured against the Container column, not the
 * window (§6.5) — gives three tracks; at 320 the same grid is one column and
 * the stretch has nothing to equalise, which is the honest mobile picture.
 */
export const InAGrid: Story = {
  tags: ['stress-320'],
  // Three fixed fixtures — the uneven lengths ARE the subject, so the body
  // control has nothing to say here.
  argTypes: { children: { control: false } },
  render: (args) => (
    <Band>
      <ul role="list" className="grid gap-6 @3xl:grid-cols-3">
        <Card {...args} asChild>
          <li>
            <Heading size="title" asChild>
              <h3>Consultație</h3>
            </Heading>
            <Text tone="muted" className="flex-1">
              Examinare clinică și plan de tratament.
            </Text>
            <Text bold>de la 150 lei</Text>
          </li>
        </Card>
        <Card {...args} asChild>
          <li>
            <Heading size="title" asChild>
              <h3>Igienizare profesională</h3>
            </Heading>
            <Text tone="muted" className="flex-1">
              Detartraj cu ultrasunete, periaj profesional și air-flow.
              Îndepărtăm depunerile de pe toate suprafețele dentare, inclusiv
              sub marginea gingiei.
            </Text>
            <Text bold>de la 250 lei</Text>
          </li>
        </Card>
        <Card {...args} asChild>
          <li>
            <Heading size="title" asChild>
              <h3>Tratament ortodontic</h3>
            </Heading>
            <Text tone="muted" className="flex-1">
              Evaluare inițială cu radiografie panoramică și fotografii
              intraorale. Discutăm opțiunile de aparat dentar, durata estimată
              și pașii de urmat. Ședințele de control se programează din șase în
              șase săptămâni, iar la final discutăm despre contenție. Planul se
              ajustează pe parcurs, în funcție de evoluția fiecărui pacient.
            </Text>
            <Text bold>de la 4.500 lei</Text>
          </li>
        </Card>
      </ul>
    </Band>
  ),
};

/**
 * The four tones, each on the band paint it exists FOR — which is the only
 * honest way to photograph them, since a tone is a relationship between a card
 * and the surface behind it, not a colour on its own:
 *
 * · `surface` — the default card, on a `bg-page` band;
 * · `tinted` — the quiet card ON a `bg-surface` band, where the default's white
 *   fill would vanish and its border would be the only thing left;
 * · `emphasized` — the highlighted row, back on `bg-page`;
 * · `framed` — the old site's review-card frame at its own 3px, also on
 *   `bg-page` (owner fb-423).
 *
 * Watch the TEXT EDGES down the four bands: they line up exactly, and that is
 * the whole subject of this frame. Every row spends the same 25px per side on
 * border width plus padding — 1 + 24 for the flat rows, 3 + 22 for `framed` —
 * so a thicker frame buys its 2px from its own padding rather than from the
 * content box. `framed` is the ONE thickness situation on the axis; emphasis
 * everywhere else stays fill and border COLOUR, which is why the old
 * carousel's ring was never imported onto `emphasized`: at `p-6` it would have
 * pulled that card's inner box 4px narrower than its neighbours'.
 */
export const Tones: Story = {
  // Both controls off: the children are fixed, and each card PINS its tone —
  // a live `tone` knob would repaint all four at once and destroy the
  // comparison the frame exists for.
  argTypes: { children: { control: false }, tone: { control: false } },
  render: (args) => (
    <>
      <Band>
        <Card {...args} tone="surface">
          <Heading size="title" asChild>
            <h3>Tonul „surface” pe banda paginii</h3>
          </Heading>
          <Text tone="muted">
            Cardul obișnuit: chenar subțire pe fundal de suprafață.
          </Text>
        </Card>
      </Band>
      <Band paint="bg-surface">
        <Card {...args} tone="tinted">
          <Heading size="title" asChild>
            <h3>Tonul „tinted” pe o bandă de suprafață</h3>
          </Heading>
          <Text tone="muted">
            Aceeași geometrie, fără chenar vizibil: banda este deja albă, iar
            cardul se desprinde prin fundalul paginii.
          </Text>
        </Card>
      </Band>
      <Band>
        <Card {...args} tone="emphasized">
          <Heading size="title" asChild>
            <h3>Tonul „emphasized” pe banda paginii</h3>
          </Heading>
          <Text tone="muted">
            Accent decorativ în fundal și în chenar — grosimea rămâne de 1px.
          </Text>
        </Card>
      </Band>
      <Band>
        <Card {...args} tone="framed">
          <Heading size="title" asChild>
            <h3>Tonul „framed” pe banda paginii</h3>
          </Heading>
          <Text tone="muted">
            Chenar de 3px, ca pe cardul de recenzie al vechiului site —
            conținutul rămâne aliniat cu vecinii, pentru că chenarul și spațiul
            interior însumează tot 25px.
          </Text>
        </Card>
      </Band>
    </>
  ),
};

/**
 * The same card as Default with the glow on: `shadow-aura`, the static
 * lavender shadow mixed from `--accent-decorative` that the Header pill and
 * the fixed corner discs already wear (fb-378/381). The section decides it per
 * card KIND — every review card, say — never per instance.
 *
 * Read the frame at the card's corners rather than at its face: the shadow is
 * a 22px blur at 40% opacity, which the visual net's own measurement showed
 * sits at or under Playwright's per-pixel threshold over warm paint, so
 * tests/unit/aura-token.test.ts is what actually guards this decision.
 */
export const WithAura: Story = {
  args: { aura: true },
  render: renderServiceTier,
};

/**
 * DE is the longest locale (§8.4) — and German is also where the border earns
 * its keep: `Behandlungskostenübernahmebestätigung` is one 37-character word
 * with no space to break at. `lang="de"` rides the native prop spread onto the
 * card root (the fb-315 precedent from Heading.stories) and inherits to every
 * child, because the site-wide `hyphens: auto` (§15.14) picks its dictionary
 * from the ELEMENT's language: German syllable breaks engage here while the
 * surrounding frame stays Romanian.
 *
 * At 320 (`stress-320`) that compound must hyphenate INSIDE the card's padding
 * — no overflow past the border, no horizontal scrolling (§7/§9). A card that
 * had reserved a width, or a heading that scaled itself per viewport, would
 * fail visibly right here.
 */
export const GermanLongest: Story = {
  tags: ['stress-320'],
  args: {
    children:
      'Kostenvoranschlag für Zahnersatzversorgung und Nachsorgeterminvereinbarung.',
  },
  render: ({ children, ...args }) => (
    <Band>
      <Card {...args} lang="de">
        <Heading size="title" asChild>
          <h3>Behandlungskostenübernahmebestätigung</h3>
        </Heading>
        <Text tone="muted" className="flex-1">
          {children}
        </Text>
        <Text bold>ab 150 Lei</Text>
      </Card>
    </Band>
  ),
};
